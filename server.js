// Avaliador P4 - Podcast (TEDPRO/IFSC) — servidor local
//
// Serve a página (public/) e dois endpoints que usam a API da OpenAI com a
// SUA chave (fica só aqui no servidor, nunca vai para o navegador):
//   POST /api/suggest-scores  -> sugestão de pontuação por critério da rubrica
//   POST /api/transcrever     -> transcrição do áudio do podcast (Whisper)
// Além de turmas nomeadas persistidas em data/turmas.json.

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { RUBRICA, ORDEM } = require('./rubrica');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const APP_USERNAME = process.env.APP_USERNAME || 'professor';
const APP_PASSWORD = process.env.APP_PASSWORD || '';

if(process.env.NODE_ENV === 'production' && !APP_PASSWORD){
  throw new Error('APP_PASSWORD é obrigatória em produção. Configure uma senha forte no serviço de hospedagem.');
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES },
  fileFilter: (_req, file, cb) => {
    const tipoAceito = /^(audio|video)\//.test(file.mimetype || '');
    cb(tipoAceito ? null : new Error('Envie um arquivo de áudio ou vídeo válido.'), tipoAceito);
  }
});

app.use((req, res, next) => {
  // O shell estático precisa ser público para Android/Chrome conseguirem ler o
  // manifesto, os ícones e o service worker e oferecer a instalação como PWA.
  // Todos os dados e operações continuam protegidos atrás de /api/.
  if(!APP_PASSWORD || req.path === '/api/health' || !req.path.startsWith('/api/')) return next();
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Basic ') ? cabecalho.slice(6) : '';
  let usuario='', senha='';
  try{ [usuario, senha] = Buffer.from(token, 'base64').toString('utf8').split(':'); }catch{}
  if(usuario === APP_USERNAME && senha === APP_PASSWORD) return next();
  res.set('WWW-Authenticate', 'Basic realm="Avaliador P4 Podcast", charset="UTF-8"');
  res.status(401).send('Autenticação necessária.');
});

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, openaiConfigurada: Boolean(OPENAI_API_KEY) });
});

function precisaChaveOpenAI(res){
  if(!OPENAI_API_KEY){
    res.status(401).json({ erro: 'OPENAI_API_KEY não configurada no servidor. Copie .env.example para .env e cole sua chave.' });
    return true;
  }
  return false;
}

// ---------- Turmas e avaliações ----------
app.get('/api/turmas', async (_req, res) => {
  try{ res.json(await db.listarTurmas()); }
  catch(e){ console.error(e); res.status(500).json({erro: e.message}); }
});

app.post('/api/turmas', async (req, res) => {
  try{ res.status(201).json(await db.criarTurma(req.body?.nome)); }
  catch(e){ res.status(400).json({erro:e.message}); }
});

app.patch('/api/turmas/:turmaId', async (req, res) => {
  try{ res.json(await db.renomearTurma(req.params.turmaId, req.body?.nome)); }
  catch(e){ res.status(400).json({erro:e.message}); }
});

app.delete('/api/turmas/:turmaId', async (req, res) => {
  try{ res.json(await db.excluirTurma(req.params.turmaId, req.body?.confirmarNome)); }
  catch(e){ res.status(400).json({erro:e.message}); }
});

app.get('/api/turmas/:turmaId/avaliacoes', async (req, res) => {
  try{ res.json(await db.listarAvaliacoes(req.params.turmaId)); }
  catch(e){ res.status(404).json({erro:e.message}); }
});

app.put('/api/turmas/:turmaId/avaliacoes/:id', async (req, res) => {
  try{
    if(!req.params.id || req.params.id.length > 160) return res.status(400).json({erro:'Identificador inválido.'});
    if(!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({erro:'Avaliação inválida.'});
    res.json(await db.upsertAvaliacao(req.params.turmaId, req.params.id, req.body));
  }
  catch(e){ console.error(e); res.status(500).json({erro: e.message}); }
});

app.delete('/api/turmas/:turmaId/avaliacoes/:id', async (req, res) => {
  try{ await db.removerAvaliacao(req.params.turmaId, req.params.id); res.json({ok:true}); }
  catch(e){ console.error(e); res.status(500).json({erro: e.message}); }
});

app.delete('/api/turmas/:turmaId/avaliacoes', async (req, res) => {
  try{ await db.limparAvaliacoes(req.params.turmaId); res.json({ok:true}); }
  catch(e){ console.error(e); res.status(500).json({erro: e.message}); }
});

app.get('/api/backup/github', (_req, res) => {
  res.json(db.statusBackupGitHub());
});

app.post('/api/backup/github', async (_req, res) => {
  try{ res.json(await db.sincronizarBackupGitHub()); }
  catch(e){ console.error(e); res.status(503).json({erro:e.message, ...db.statusBackupGitHub()}); }
});

// ---------- Sugestão de pontuação por IA ----------
function montarPrompt(campos){
  const rubricaTexto = ORDEM.map(chave => {
    const c = RUBRICA[chave];
    const niveis = c.niveis.map(n => `  - ${n.pontos} pts: ${n.desc}`).join('\n');
    return `${c.label} (0 a ${c.max} pts):\n${niveis}`;
  }).join('\n\n');

  const metricas = campos.metricasAudio;
  const metricasTexto = metricas
    ? `\nMétricas objetivas medidas no arquivo de áudio: duração ${Math.floor(metricas.duracaoSeg/60)}:${String(metricas.duracaoSeg%60).padStart(2,'0')}, volume médio ${metricas.volumeMedioDb} dBFS, pico ${metricas.picoDb} dBFS${metricas.clipping?' (com estouro/clipping)':''}, silêncio ${metricas.silencioPct}% do áudio.`
    : '\nNenhuma métrica de áudio foi medida ainda (o professor não analisou o arquivo, ou o podcast só está disponível por link).';

  const transcricao = (campos.transcricao || '').trim();
  const transcricaoTexto = transcricao
    ? `\n\nTRANSCRIÇÃO DO QUE FOI FALADO NO PODCAST (feita pelo professor ou por transcrição automática, não é o roteiro planejado):\n${transcricao}`
    : '';

  const instrucaoAudio = transcricao
    ? `IMPORTANTE: use a transcrição somente para comparar o conteúdo falado com o roteiro. Você não pode avaliar dicção, efeitos sonoros, qualidade de áudio, edição, tom de voz ou ritmo a partir do texto.`
    : `IMPORTANTE: você não ouviu o áudio e não possui transcrição. Não faça qualquer inferência sobre fidelidade ao roteiro, efeitos, edição, dicção ou qualidade sonora.`;

  return `Você está ajudando um professor a avaliar a atividade "P4 - Produção de Podcast" de uma pós-graduação (TEDPRO/IFSC), usando a rubrica oficial abaixo. Analise o material entregue pelo aluno e proponha uma pontuação para CADA critério, escolhendo exatamente um dos valores de pontos listados (nunca um valor fora da lista), com uma justificativa breve (1-2 frases) baseada no que foi entregue.

RUBRICA OFICIAL:
${rubricaTexto}

MATERIAL ENTREGUE PELO ALUNO:
Desafio: ${campos.desafio || '(não preenchido)'}
Público-alvo: ${campos.publicoAlvo || '(não preenchido)'}
Diretrizes de estilo: ${campos.diretrizes || '(não preenchido)'}
Roteiro do podcast (planejado): ${campos.roteiro || '(não preenchido)'}
Contribuição para o desafio: ${campos.contribuicao || '(não preenchido)'}
Relato da experiência de produção: ${campos.relato || '(não preenchido)'}
Duração informada: ${campos.duracao || '(não informada)'}
${metricasTexto}${transcricaoTexto}

${instrucaoAudio}

O critério "Produção do podcast" é reservado ao professor após a escuta. Retorne sempre null em "producao", mesmo que existam duração, métricas ou transcrição.

Responda APENAS com um JSON no formato exato:
{"roteiro": {"pontos": number, "justificativa": string}, "adequacao": {"pontos": number, "justificativa": string}, "producao": null, "relato": {"pontos": number, "justificativa": string}}`;
}

function pontoMaisProximo(chave, pontos){
  const niveis = RUBRICA[chave].niveis;
  if(niveis.some(n => n.pontos === pontos)) return pontos;
  let melhor = niveis[0].pontos, menorDist = Infinity;
  niveis.forEach(n => { const d = Math.abs(n.pontos - pontos); if(d < menorDist){ menorDist = d; melhor = n.pontos; } });
  return melhor;
}

function montarPromptCoerencia(campos){
  const transcricao = String(campos.transcricao || '').trim();
  const evidenciaProduto = transcricao
    ? `Há uma transcrição do podcast. Ela pode ser usada apenas para verificar o conteúdo efetivamente falado, sem inferir qualidade sonora, dicção, efeitos ou edição.\nTranscrição: ${transcricao}`
    : 'Não há transcrição nem acesso ao áudio. Analise o que foi proposto e planejado no formulário; não afirme que algo ocorreu no podcast.';

  return `Você apoia o Prof. Rogério na leitura pedagógica de uma proposta de podcast da pós-graduação TEDPRO/IFSC.

TAREFA
Faça UMA análise semântica estruturada, tendo DESAFIO e PÚBLICO-ALVO como eixos, e produza duas saídas coerentes entre si, mas claramente diferentes:
1. "analise_coerencia": parecer técnico e diagnóstico para o professor, em 2 a 4 parágrafos.
2. "feedback_coerencia": mensagem pessoal ao estudante, em 3 a 5 parágrafos, escrita como se fosse o Prof. Rogério. Use o primeiro nome somente se estiver informado com segurança. Termine EXATAMENTE com:\nUm abraço,\nProf. Rogério

REGRAS ESSENCIAIS
- Isto é complementar e informativo: não atribua nota, pontos, conceito, percentual, ranking ou classificação.
- Não trate coerência como veracidade, correção gramatical ou qualidade técnica do áudio.
- Faça análise semântica profunda; coincidência de palavras-chave não prova coerência.
- Examine o encadeamento: desafio -> público -> estratégia/diretrizes -> roteiro/conteúdo -> contribuição para o desafio.
- Diferencie falar do mesmo tema de contribuir efetivamente para o desafio.
- Compare explicitamente o que as diretrizes prometem com o que o roteiro sustenta.
- Na contribuição, procure a cadeia recurso -> experiência/conhecimento -> efeito sobre o público -> relação com o desafio.
- Reconheça pontos fortes com justificativa; identifique tensões sem convertê-las automaticamente em erros.
- Não invente intenções, objetivos, características do público ou conteúdo ausente. Diferencie campo vazio de informação superficial.
- Se faltarem dados, continue com o que existe e declare com precisão as limitações.
- Diferencie proposta/roteiro do produto efetivamente analisado. Sem áudio ou transcrição, escreva "o roteiro propõe" ou "a estratégia prevê", nunca "no podcast você faz".
- O feedback deve selecionar os achados pedagogicamente mais úteis, falar diretamente ao estudante, evitar elogios vazios e pode incluir uma pergunta curta apenas quando ligada a um problema real.
- O feedback não pode ser mera cópia, resumo ou conversão mecânica do parecer técnico para segunda pessoa.

DADOS DO TRABALHO
Nome: ${campos.nome || '(não informado)'}
Desafio: ${campos.desafio || '(campo vazio)'}
Público-alvo: ${campos.publicoAlvo || '(campo vazio)'}
Diretrizes de estilo: ${campos.diretrizes || '(campo vazio)'}
Roteiro planejado: ${campos.roteiro || '(campo vazio)'}
Contribuição declarada para o desafio: ${campos.contribuicao || '(campo vazio)'}
Relato da experiência: ${campos.relato || '(campo vazio)'}
${evidenciaProduto}

Responda APENAS com JSON válido neste formato:
{"coerencia":{"relacao_desafio_publico":"string","adequacao_publico":"string","relacao_desafio_roteiro":"string","relacao_diretrizes_roteiro":"string","contribuicao_para_desafio":"string","consistencia_global":"string","pontos_fortes":["string"],"tensoes":["string"],"desalinhamentos":["string"],"informacoes_insuficientes":["string"]},"analise_coerencia":"string","feedback_coerencia":"string"}`;
}

function limparSaidaCoerencia(resultado){
  const analise = String(resultado?.analise_coerencia || '').trim();
  let feedback = String(resultado?.feedback_coerencia || '').trim();
  if(!analise || !feedback) throw new Error('A IA não produziu as duas saídas de coerência.');
  feedback = feedback.replace(/\s*Um abraço,\s*Prof\. Rogério\s*$/i, '').trim();
  feedback += '\n\nUm abraço,\nProf. Rogério';
  return { analise_coerencia: analise, feedback_coerencia: feedback };
}

app.post('/api/analisar-coerencia', async (req, res) => {
  if(precisaChaveOpenAI(res)) return;
  try{
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model:OPENAI_MODEL, response_format:{type:'json_object'}, temperature:0.25,
        messages:[{role:'user', content:montarPromptCoerencia(req.body || {})}] })
    });
    if(!resp.ok){
      const texto = await resp.text().catch(()=> '');
      console.error('OpenAI coerência erro', resp.status, texto);
      return res.status(resp.status===429?429:502).json({erro:`A API da OpenAI recusou a análise de coerência (${resp.status}).`});
    }
    const data = await resp.json();
    let resultado;
    try{ resultado = JSON.parse(data.choices?.[0]?.message?.content); }
    catch{ return res.status(502).json({erro:'A IA não respondeu em um formato reconhecível. Tente novamente.'}); }
    res.json(limparSaidaCoerencia(resultado));
  }catch(e){ console.error(e); res.status(500).json({erro:e.message}); }
});

function pontuarProducaoPorEvidencia(campos){
  const link = String(campos.linkPodcast || '').trim();
  if(!link) return {pontos:0, justificativa:'O podcast não foi apresentado por link ou arquivo.'};
  const m = String(campos.duracao || '').trim().match(/^(\d{1,3}):(\d{2})$/);
  if(!m) return null;
  const segundos = Number(m[1])*60 + Number(m[2]);
  if(segundos < 120 || segundos > 300){
    return {pontos:2, justificativa:`A duração informada (${campos.duracao}) está fora do intervalo exigido de 2 a 5 minutos.`};
  }
  return {pontos:3, justificativa:`A duração informada (${campos.duracao}) está dentro do intervalo exigido. Pontuação provisória e conservadora: efeitos sonoros, qualidade do áudio, edição e fidelidade ao roteiro ainda precisam ser confirmados pela escuta do professor.`};
}

app.post('/api/suggest-scores', async (req, res) => {
  if(precisaChaveOpenAI(res)) return;
  try{
    const prompt = montarPrompt(req.body || {});
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if(!resp.ok){
      const texto = await resp.text().catch(()=> '');
      console.error('OpenAI erro', resp.status, texto);
      return res.status(resp.status===429?429:502).json({erro: `A API da OpenAI recusou a solicitação (${resp.status}).`});
    }
    const data = await resp.json();
    const conteudo = data.choices?.[0]?.message?.content;
    let resultado;
    try{ resultado = JSON.parse(conteudo); }
    catch{ return res.status(502).json({erro: 'A IA não respondeu em um formato reconhecível. Tente novamente.'}); }

    const saida = {};
    ORDEM.forEach(chave => {
      const sug = resultado[chave];
      if(chave === 'producao'){
        saida[chave] = pontuarProducaoPorEvidencia(req.body || {});
        return;
      }
      if(sug && typeof sug.pontos === 'number'){
        saida[chave] = { pontos: pontoMaisProximo(chave, sug.pontos), justificativa: (sug.justificativa || '').toString() };
      } else {
        saida[chave] = null;
      }
    });
    res.json(saida);
  }catch(e){
    console.error(e);
    res.status(500).json({erro: e.message});
  }
});

// ---------- Transcrição automática (áudio -> texto) ----------
async function transcreverBuffer(buffer, nome, mime){
  const formData = new FormData();
  const blob = new Blob([buffer], { type: mime || 'application/octet-stream' });
  formData.append('file', blob, nome || 'audio');
  formData.append('model', OPENAI_TRANSCRIBE_MODEL);
  formData.append('language', 'pt');
  const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }, body: formData
  });
  if(!resp.ok){
    const detalhe = await resp.text().catch(()=> '');
    console.error('OpenAI transcrição erro', resp.status, detalhe);
    const erro = new Error(`A API da OpenAI recusou a transcrição (${resp.status}).`);
    erro.status = resp.status===429 ? 429 : 502;
    throw erro;
  }
  const data = await resp.json();
  return data.text || '';
}

app.post('/api/transcrever', upload.single('audio'), async (req, res) => {
  if(precisaChaveOpenAI(res)) return;
  if(!req.file){ return res.status(400).json({erro: 'Nenhum arquivo de áudio recebido.'}); }
  try{
    res.json({ texto: await transcreverBuffer(req.file.buffer, req.file.originalname, req.file.mimetype) });
  }catch(e){
    console.error(e);
    res.status(e.status || 500).json({erro: e.message});
  }
});

function idGoogleDrive(url){
  try{
    const parsed = new URL(url);
    if(parsed.hostname !== 'drive.google.com') return null;
    return parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] || parsed.searchParams.get('id');
  }catch{ return null; }
}

async function baixarComLimite(url, limite){
  const resp = await fetch(url, {redirect:'follow'});
  if(!resp.ok) throw Object.assign(new Error(`O Google Drive recusou o acesso (${resp.status}).`), {status:400});
  const hostFinal = new URL(resp.url).hostname;
  if(!(hostFinal === 'drive.google.com' || hostFinal.endsWith('.googleusercontent.com'))){
    throw Object.assign(new Error('O redirecionamento do arquivo não foi reconhecido como Google Drive.'), {status:400});
  }
  const tamanho = Number(resp.headers.get('content-length') || 0);
  if(tamanho > limite) throw Object.assign(new Error('O arquivo do Google Drive excede o limite de 25 MB.'), {status:413});
  const partes=[]; let total=0;
  const leitor = resp.body.getReader();
  while(true){
    const {done,value} = await leitor.read();
    if(done) break;
    total += value.byteLength;
    if(total > limite){ await leitor.cancel(); throw Object.assign(new Error('O arquivo do Google Drive excede o limite de 25 MB.'), {status:413}); }
    partes.push(Buffer.from(value));
  }
  const tipo = resp.headers.get('content-type') || '';
  if(tipo.includes('text/html')) throw Object.assign(new Error('O link não está público ou aponta para uma página, não para o arquivo de áudio.'), {status:400});
  return {buffer:Buffer.concat(partes), tipo};
}

app.post('/api/transcrever-link', async (req, res) => {
  if(precisaChaveOpenAI(res)) return;
  const id = idGoogleDrive(req.body?.url || '');
  if(!id) return res.status(400).json({erro:'Informe um link público de arquivo do Google Drive.'});
  try{
    const url = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`;
    const arquivo = await baixarComLimite(url, MAX_AUDIO_BYTES);
    res.json({texto: await transcreverBuffer(arquivo.buffer, 'podcast.mp3', arquivo.tipo)});
  }catch(e){
    console.error(e);
    res.status(e.status || 500).json({erro:e.message});
  }
});

app.use((err, _req, res, _next) => {
  if(err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'){
    return res.status(413).json({erro:'Arquivo grande demais. O limite de transcrição é 25 MB.'});
  }
  console.error(err);
  res.status(400).json({erro: err.message || 'Solicitação inválida.'});
});

if(require.main === module){
  app.listen(PORT, () => {
    console.log(`Avaliador P4 Podcast rodando em http://localhost:${PORT}`);
    if(!OPENAI_API_KEY){
      console.warn('Aviso: OPENAI_API_KEY não configurada — copie .env.example para .env e adicione sua chave para usar a sugestão de IA e a transcrição.');
    }
  });
}

module.exports = { app, montarPrompt, montarPromptCoerencia, limparSaidaCoerencia, pontoMaisProximo, pontuarProducaoPorEvidencia };
