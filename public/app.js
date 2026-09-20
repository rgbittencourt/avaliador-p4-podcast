
// ---------- Definição da rubrica oficial (P4 - Podcast TEDPRO) ----------
// Cópia usada pela TELA (critérios, pontos, nota). Existe uma segunda cópia em
// ../rubrica.js, usada pelo SERVIDOR para montar o prompt da IA — se editar o
// texto da rubrica, edite as duas.
const RUBRICA = {
  roteiro: {
    label: "Elaboração do roteiro",
    max: 2,
    niveis: [
      {pontos:0, desc:"Não apresentou o roteiro, ou o roteiro não está condizente com o podcast produzido ou precisa de muitas melhorias.",
        feedback:"O roteiro não foi apresentado, ou não está condizente com o podcast produzido, ou precisa de melhorias significativas."},
      {pontos:1, desc:"O roteiro não tem início, meio e fim, ou não indica os diferentes momentos e efeitos do podcast (se houver).",
        feedback:"Seu roteiro ainda não apresenta claramente início, meio e fim, e/ou não indica os diferentes momentos e efeitos previstos no podcast. Para as próximas entregas, procure estruturar melhor essas etapas."},
      {pontos:2, desc:"O roteiro tem início, meio e fim, e indica os diferentes momentos e efeitos do podcast (se houver).", feedback:null}
    ]
  },
  adequacao: {
    label: "Adequação do podcast ao desafio e ao público-alvo",
    max: 1,
    niveis: [
      {pontos:0, desc:"Não apresentou o podcast, ou não apresentou o desafio e o público-alvo, ou o podcast não é adequado ao desafio ou ao público-alvo.",
        feedback:"O podcast não foi apresentado, ou o desafio e o público-alvo não foram apresentados, ou o podcast não está adequado a eles."},
      {pontos:0.5, desc:"O desafio e o público-alvo foram apresentados, mas o podcast é pouco adequado a eles.",
        feedback:"O desafio e o público-alvo foram apresentados, mas o podcast ficou pouco adequado a eles. Procure alinhar melhor o conteúdo às necessidades do seu público e desafio."},
      {pontos:1, desc:"O desafio e o público-alvo foram apresentados e o podcast é adequado a eles.", feedback:null}
    ]
  },
  producao: {
    label: "Produção do podcast",
    max: 4,
    niveis: [
      {pontos:0, desc:"Não apresentou o podcast, ou o podcast precisa de muitas melhorias.",
        feedback:"O podcast não foi apresentado, ou precisa de melhorias significativas."},
      {pontos:2, desc:"O podcast não tem duração de 2 a 5 minutos e/ou não contempla o que foi previsto no roteiro, mesmo apresentando todos os elementos: efeitos sonoros; áudio de boa qualidade; edição de boa qualidade.",
        feedback:"O podcast não ficou dentro da duração de 2 a 5 minutos e/ou não contemplou integralmente o que foi previsto no roteiro, mesmo apresentando efeitos sonoros, boa qualidade de áudio e boa qualidade de edição."},
      {pontos:3, desc:"O podcast tem duração de 2 a 5 minutos, mas deixou de apresentar ao menos um dos seguintes elementos: efeitos sonoros; áudio de boa qualidade; edição de boa qualidade.",
        feedback:"O podcast ficou dentro da duração de 2 a 5 minutos, mas deixou de apresentar ao menos um dos seguintes elementos: efeitos sonoros, áudio de boa qualidade ou edição de boa qualidade."},
      {pontos:4, desc:"O podcast tem duração de 2 a 5 minutos, efeitos sonoros, boa qualidade de áudio e boa qualidade de edição.", feedback:null}
    ]
  },
  relato: {
    label: "Relato da elaboração do podcast",
    max: 3,
    niveis: [
      {pontos:0, desc:"Não apresentou o relato ou o podcast, ou as informações apresentadas não são compreensíveis a respeito da experiência de elaboração do recurso.",
        feedback:"O relato (ou o podcast) não foi apresentado, ou as informações apresentadas não permitem compreender a experiência de elaboração do recurso."},
      {pontos:1, desc:"As informações apresentadas a respeito da experiência na elaboração do podcast são insuficientes para compreender completamente o caminho e as etapas do estudante na elaboração da atividade.",
        feedback:"As informações apresentadas sobre a experiência na elaboração do podcast ainda são insuficientes para compreender completamente o caminho e as etapas percorridas. Procure detalhar mais o processo."},
      {pontos:2, desc:"O estudante relatou sua experiência na elaboração do podcast, permitindo compreender os desafios enfrentados e o caminho percorrido, mas descreveu de forma vaga ou omissa a superação dos desafios ou se suas expectativas em relação ao produto final foram atingidas.",
        feedback:"Você relatou bem os desafios enfrentados e o caminho percorrido na elaboração do podcast, mas descreveu de forma vaga ou omissa como superou esses desafios, ou se suas expectativas em relação ao produto final foram atingidas. Capriche mais nesse ponto nas próximas entregas."},
      {pontos:3, desc:"O estudante relatou sua experiência na elaboração do podcast de forma clara e detalhada, sendo possível compreender perfeitamente os desafios enfrentados, como os superou e se suas expectativas em relação ao produto final foram atingidas.", feedback:null}
    ]
  }
};
const ORDEM = ["roteiro","adequacao","producao","relato"];
const PLACEHOLDERS = ["escreva aqui","seu nome","matrícula","matricula","selecione","clique aqui"];
const feedbackOut = document.getElementById('feedbackOut');

function escaparHtml(valor){
  return String(valor ?? '').replace(/[&<>'"]/g, caractere => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  })[caractere]);
}

function urlHttpSegura(valor){
  try{
    const url = new URL(valor);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

let spotifyApiPromise = null;
function obterSpotifyIframeApi(){
  if(spotifyApiPromise) return spotifyApiPromise;
  spotifyApiPromise = new Promise((resolve, reject)=>{
    window.onSpotifyIframeApiReady = resolve;
    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    script.onerror = ()=>reject(new Error('Não foi possível carregar o player oficial do Spotify.'));
    document.head.appendChild(script);
  });
  return spotifyApiPromise;
}

async function carregarSpotify(link, box){
  box.innerHTML = `
    <div class="alert info" style="margin-bottom:8px;">Use o player oficial abaixo para ouvir o podcast. Ao iniciar a reprodução, a duração total será preenchida automaticamente. Volume, música, efeitos e edição continuam sendo avaliados pela sua escuta.</div>
    <div id="spotifyEmbed"></div>
    <div id="spotifyStatus" class="hint" style="margin-top:6px;">Carregando player do Spotify...</div>`;
  try{
    const api = await obterSpotifyIframeApi();
    const elemento = document.getElementById('spotifyEmbed');
    api.createController(elemento, {url:link, width:'100%', height:152}, controller=>{
      if(window.spotifyController && window.spotifyController.destroy) window.spotifyController.destroy();
      window.spotifyController = controller;
      controller.addListener('ready', ()=>{
        document.getElementById('spotifyStatus').textContent = 'Player pronto. Clique em reproduzir para ouvir e confirmar a duração.';
      });
      controller.addListener('playback_update', evento=>{
        const ms = Number(evento?.data?.duration || 0);
        if(ms <= 0) return;
        const total = Math.round(ms/1000);
        const mm = Math.floor(total/60).toString().padStart(2,'0');
        const ss = (total%60).toString().padStart(2,'0');
        usarDuracaoDetectada(`${mm}:${ss}`);
        document.getElementById('spotifyStatus').innerHTML = `Duração informada pelo Spotify: <strong>${mm}:${ss}</strong>. Ouça pelo menos a abertura e trechos do meio/final antes de pontuar a produção.`;
      });
    });
  }catch(e){
    box.innerHTML = `<div class="alert">${escaparHtml(e.message)}</div><div class="toolbar"><a class="btn" href="${escaparHtml(link)}" target="_blank" rel="noopener noreferrer">Abrir no Spotify ↗</a></div>`;
  }
}

// ---------- Importação automática do PDF do relatório ----------
const CAMPOS_TEMPLATE = [
  {key:'nome', re:/Nome completo:?/i},
  {key:'matricula', re:/N[uú]mero\s+de\s+matr[ií]cula:?/i},
  {key:'orientadorIndicado', re:/Orientador\(a\):?/i},
  {key:'desafio', re:/Qual\s+[ée]\s+o\s+seu\s+desafio\??/i},
  {key:'publicoAlvo', re:/P[úu]blico[\s-]+alvo/i},
  {key:'diretrizes', re:/Diretrizes\s+de\s+estilo\s+do\s+podcast/i},
  {key:'roteiro', re:/Roteiro\s+do\s+podcast/i},
  {key:'linkPodcast', re:/Link\s+do\s+podcast/i},
  {key:'contribuicao', re:/Contribui[çc][ãa]o\s+do\s+podcast\s+para\s+a\s+solu[çc][ãa]o\s+do\s+desafio/i},
  {key:'relato', re:/Experi[êe]ncia\s+na\s+produ[çc][ãa]o\s+do\s+podcast/i},
  {key:'iaBloco', re:/Este\s+trabalho\s+teve\s+uso\s+de\s+IA/i},
];

// Ruído de cabeçalho/rodapé: só remove quando ocupa a linha inteira (não corta
// ocorrências legítimas da mesma frase dentro do texto respondido pelo aluno).
const RUIDO_BOILERPLATE = [
  /^\s*Instituto Federal de Santa Catarina.*$/gim,
  /^\s*Rua:\s*14 de julho.*$/gim,
  /^\s*Fone:\s*\(48\).*$/gim,
  /^\s*Especializa[çc][ãa]o\s*lato\s+sensu.*$/gim,
  /^\s*P[ÓO]S\s*TEDPRO\s*$/gim,
  /^\s*PRODU[ÇC][ÃA]O DO PODCAST\s*$/gim,
  /^\s*DADOS DO DESAFIO E P[ÚU]BLICO\s*$/gim,
  /^\s*P4\s*-\s*PORTF[ÓO]LIO\s*$/gim,
  /^\s*PODCAST RELACIONADO AO SEU DESAFIO\s*$/gim,
  /^\s*Declara[çc][ãa]o de transpar[êe]ncia no uso de IA\s*$/gim,
  /Dicas:.*?salvar o arquivo em PDF\./gis,
];

function limparBoilerplate(txt){
  let out = txt || '';
  RUIDO_BOILERPLATE.forEach(r=>{ out = out.replace(r, ' '); });
  return out.replace(/[ \t]{2,}/g,' ').replace(/\n{2,}/g,'\n').trim();
}

async function extrairTextoPdf(pdf){
  let textoCompleto = '';
  for(let p=1; p<=pdf.numPages; p++){
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    let lastY = null, lastXEnd = null, linha = '';
    const linhas = [];
    content.items.forEach(item=>{
      const y = item.transform[5];
      const x = item.transform[4];
      const altura = Math.abs(item.transform[3]) || item.height || 10;
      if(lastY!==null && Math.abs(y-lastY)>2){
        linhas.push(linha);
        linha = item.str;
      } else {
        // Só insere espaço se houver um vão horizontal real entre os itens.
        // Isso evita quebrar glifos de ligatura (ex: "fi", "fl") extraídos
        // como itens separados, mas adjacentes, do mesmo caractere.
        let precisaEspaco = false;
        if(lastXEnd !== null){
          const vao = x - lastXEnd;
          if(vao > altura * 0.2) precisaEspaco = true;
        }
        linha += (precisaEspaco ? ' ' : '') + item.str;
      }
      lastY = y;
      lastXEnd = x + (item.width || 0);
    });
    if(linha) linhas.push(linha);
    textoCompleto += linhas.join('\n') + '\n\n';
  }
  return textoCompleto;
}

function extrairCampos(textoCompleto){
  let posicoes = [];
  let cursor = 0;
  CAMPOS_TEMPLATE.forEach(c=>{
    const restante = textoCompleto.slice(cursor);
    const m = restante.match(c.re);
    if(m){
      const idx = cursor + m.index;
      posicoes.push({key:c.key, start:idx, labelEnd: idx + m[0].length});
      cursor = idx + m[0].length;
    } else {
      posicoes.push({key:c.key, start:-1, labelEnd:-1});
    }
  });
  const resultado = {};
  posicoes.forEach((atual, i)=>{
    if(atual.start===-1){ resultado[atual.key]=''; return; }
    const proximo = posicoes.slice(i+1).find(p=>p.start!==-1);
    const fim = proximo ? proximo.start : textoCompleto.length;
    resultado[atual.key] = limparBoilerplate(textoCompleto.slice(atual.labelEnd, fim));
  });
  return resultado;
}

function extrairLinkDoTrecho(txt){
  if(!txt) return '';
  // Links longos (típico de URL do Spotify com parâmetros ?si=...) às vezes
  // quebram em duas linhas no PDF exportado, e a extração de texto entrega um
  // "\n" bem no meio do link. Como isso nunca deixa espaço de verdade ao redor
  // (diferente de uma quebra entre frases/parágrafos), junta só esses casos
  // antes de procurar a URL, para não cortar o link pela metade.
  // Esta é só a extração de ÚLTIMO RECURSO, a partir do texto visível — sempre
  // que existir, o link real vem de extrairLinksAnotados (o hiperlink de
  // verdade embutido no PDF), porque o texto mostrado/impresso pode diferir do
  // destino real do link (ex.: Word mantém o link original no clique mesmo
  // que o texto exibido tenha sido editado ou quebrado na formatação).
  let semQuebraDeLinha = txt;
  for(let i=0;i<5;i++){
    const antes = semQuebraDeLinha;
    semQuebraDeLinha = semQuebraDeLinha.replace(/(\S)\n(\S)/g, '$1$2');
    if(semQuebraDeLinha===antes) break;
  }
  const m = semQuebraDeLinha.match(/https?:\/\/\S+/);
  return m ? m[0].replace(/[.,;)\]]+$/,'') : txt.trim();
}

async function extrairLinksAnotados(pdf){
  // O texto "impresso" de um link num PDF pode não ser o destino real do
  // clique (o hiperlink é uma anotação separada, com sua própria URL) —
  // então a forma confiável de pegar o link é ler essa anotação diretamente,
  // em vez de tentar reconstruir a URL a partir do texto visível.
  const links = [];
  for(let p=1; p<=pdf.numPages; p++){
    const page = await pdf.getPage(p);
    const anotacoes = await page.getAnnotations();
    anotacoes.forEach(a=>{
      if(a.subtype==='Link' && a.url){ links.push({pagina:p, url:a.url}); }
    });
  }
  return links;
}

function escolherLinkDoPodcast(linksAnotados){
  if(!linksAnotados || !linksAnotados.length) return null;
  const dominiosConhecidos = /spotify\.com|soundcloud\.com|drive\.google\.com|anchor\.fm|podbean\.com|buzzsprout\.com|youtube\.com|youtu\.be/i;
  const conhecido = linksAnotados.find(l=> dominiosConhecidos.test(l.url));
  return conhecido ? conhecido.url : linksAnotados[0].url;
}

function detectarIA(bloco){
  if(!bloco) return {usada:'nao', descricao:''};
  const marcado = bloco.match(/[☒xX✓]\s*\)?\s*Sim|Sim\s*\(?\s*[☒xX✓]/i);
  const usada = marcado ? 'sim' : 'nao';
  let descricao = bloco.replace(/\(?\s*[☒☐xX✓]?\s*\)?\s*Sim\s*\(?\s*[☒☐xX✓]?\s*\)?\s*N[ãa]o/i,'').trim();
  descricao = descricao.replace(/^Se sim,.*?forma o uso da IA contribuiu para o resultado final\)/is,'').trim();
  return {usada, descricao};
}

function normalizarNomeComparacao(valor){
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}

function normalizarMatriculaComparacao(valor){
  return String(valor || '').toLowerCase().replace(/[^a-z0-9]/g,'');
}

function verificarAvaliacaoExistente(){
  const nomeEl=document.getElementById('nome');
  const matriculaEl=document.getElementById('matricula');
  const aviso=document.getElementById('duplicidadeStatus');
  const nome=normalizarNomeComparacao(nomeEl.value);
  const matricula=normalizarMatriculaComparacao(matriculaEl.value);
  const encontrado=turmaCache.find(a=>{
    const mesmoNome=nome && normalizarNomeComparacao(a.nome)===nome;
    const mesmaMatricula=matricula && normalizarMatriculaComparacao(a.matricula)===matricula;
    return mesmoNome || mesmaMatricula;
  });
  [nomeEl,matriculaEl].forEach(el=>{
    el.classList.toggle('campo-duplicado', !!encontrado);
    if(encontrado) el.setAttribute('aria-invalid','true'); else el.removeAttribute('aria-invalid');
  });
  if(encontrado){
    const criterios=[];
    if(nome && normalizarNomeComparacao(encontrado.nome)===nome) criterios.push('nome');
    if(matricula && normalizarMatriculaComparacao(encontrado.matricula)===matricula) criterios.push('matrícula');
    aviso.textContent=`ATENÇÃO: este aluno já possui avaliação salva na turma ativa (correspondência por ${criterios.join(' e ')}). Use “Editar” na lista da turma se quiser atualizar o registro existente.`;
    aviso.style.display='block';
  }else{
    aviso.textContent=''; aviso.style.display='none';
  }
  return encontrado || null;
}

document.getElementById('arquivoRelatorioPdf').addEventListener('change', async function(e){
  const file = e.target.files[0];
  const status = document.getElementById('importStatus');
  if(!file) return;
  if(!window.pdfjsLib){
    status.innerHTML = '<span style="color:var(--vermelho);">Não foi possível carregar o leitor de PDF neste navegador. Preencha os campos manualmente abaixo.</span>';
    return;
  }
  status.textContent = 'Lendo PDF...';
  try{
    // Cada PDF inicia uma avaliação independente. Nunca reutilizar áudio,
    // transcrição, duração ou métricas do aluno anterior.
    window.ultimasMetricasAudio = null;
    window.producaoProvisoria = null;
    document.getElementById('arquivoLocal').value = '';
    document.getElementById('transcricaoPodcast').value = '';
    document.getElementById('duracao').value = '';
    document.getElementById('metricasAudioBox').innerHTML = '';
    document.getElementById('duracaoDetectadaBox').style.display = 'none';
    document.getElementById('playerContainer').innerHTML = '';
    document.getElementsByName('crit_producao').forEach(radio=>{ radio.checked=false; });
    const buf = await file.arrayBuffer();
    // disableWorker evita problemas de Worker bloqueado quando o arquivo é aberto
    // diretamente (file://) em vez de servido por um servidor web.
    const pdf = await pdfjsLib.getDocument({data: buf, disableWorker: true}).promise;
    const texto = await extrairTextoPdf(pdf);
    const campos = extrairCampos(texto);
    const linksAnotados = await extrairLinksAnotados(pdf);
    const linkReal = escolherLinkDoPodcast(linksAnotados);

    document.getElementById('nome').value = campos.nome || '';
    document.getElementById('matricula').value = campos.matricula || '';
    document.getElementById('orientadorIndicado').value = campos.orientadorIndicado || '';
    document.getElementById('desafio').value = campos.desafio || '';
    document.getElementById('publicoAlvo').value = campos.publicoAlvo || '';
    document.getElementById('diretrizes').value = campos.diretrizes || '';
    document.getElementById('roteiro').value = campos.roteiro || '';
    document.getElementById('linkPodcast').value = linkReal || extrairLinkDoTrecho(campos.linkPodcast);
    document.getElementById('contribuicao').value = campos.contribuicao || '';
    document.getElementById('relato').value = campos.relato || '';

    const ia = detectarIA(campos.iaBloco);
    document.getElementById('iaUsada').value = ia.usada;
    document.getElementById('iaDescricao').value = ia.descricao;
    document.getElementById('iaUsada').dispatchEvent(new Event('change'));

    verificarAvaliacaoExistente();
    atualizarNota();
    status.innerHTML = '<span style="color:var(--verde);">✔ Campos importados.</span> Revise os campos abaixo (a extração automática pode não ser perfeita, especialmente a marcação de uso de IA)'
      + (linkReal ? ' — o link do podcast veio do hiperlink real do PDF.' : (campos.linkPodcast ? ' — não achei um hiperlink clicável no PDF; o link do podcast foi reconstruído a partir do texto, confira com atenção.' : '.'))
      + ' Se tiver o arquivo do podcast, carregue-o na seção "Ou carregar um arquivo local" logo abaixo — depois é só clicar em "🚀 Avaliar automaticamente" no passo 3.';
  } catch(err){
    console.error(err);
    status.innerHTML = `<span style="color:var(--vermelho);">Não foi possível ler este PDF automaticamente (${err.message}). Preencha os campos manualmente abaixo.</span>`;
  }
});

// ---------- Montagem da rubrica na tela ----------
const container = document.getElementById('rubricaContainer');
ORDEM.forEach(chave=>{
  const crit = RUBRICA[chave];
  const fs = document.createElement('fieldset');
  fs.className='criterio';
  const legend = document.createElement('legend');
  legend.textContent = `${crit.label} (0 a ${crit.max} pts)`;
  fs.appendChild(legend);
  if(chave==='producao'){
    const evidencia=document.createElement('div');
    evidencia.id='producaoEvidencia';
    evidencia.className='alert info';
    evidencia.textContent='Critério exclusivamente humano: ouça o podcast antes de selecionar. A duração, sozinha, não comprova efeitos, qualidade, edição nem fidelidade ao roteiro.';
    fs.appendChild(evidencia);
  }
  crit.niveis.forEach((niv,i)=>{
    const lbl = document.createElement('label');
    lbl.className='nivel';
    lbl.innerHTML = `<input type="radio" name="crit_${chave}" value="${i}">
      <span class="txt">${niv.desc}</span>
      <span class="pts">${niv.pontos} pt${niv.pontos==1?'':'s'}</span>`;
    fs.appendChild(lbl);
  });
  const obsLabel = document.createElement('label');
  obsLabel.textContent = 'Observação do avaliador para este critério (opcional)';
  obsLabel.setAttribute('for', `obs_${chave}`);
  const obs = document.createElement('textarea');
  obs.id = `obs_${chave}`;
  obs.className = 'obs-criterio';
  obs.placeholder = 'Ex.: ponto forte, problema específico ou orientação personalizada.';
  obs.style.minHeight = '68px';
  obs.addEventListener('input', sinalizarMudancaAvaliacao);
  fs.appendChild(obsLabel);
  fs.appendChild(obs);
  container.appendChild(fs);
});

// listeners
document.querySelectorAll('fieldset.criterio input[type=radio]').forEach(r=>r.addEventListener('change', ()=>{
  if(r.name==='crit_producao') window.producaoProvisoria=false;
  sinalizarMudancaAvaliacao();
}));
document.getElementById('orientadorIncorretoChk').addEventListener('change', function(){
  document.getElementById('orientadorCorretoWrap').style.display = this.checked?'block':'none';
  sinalizarMudancaAvaliacao();
});
document.getElementById('iaUsada').addEventListener('change', atualizarNota);
document.getElementById('duracao').addEventListener('input', atualizarNota);
['nome','matricula','orientadorIndicado','desafio','publicoAlvo','roteiro','relato','contribuicao','linkPodcast','iaDescricao']
  .forEach(id=>document.getElementById(id).addEventListener('input', ()=>{
    if(id==='nome'||id==='matricula') verificarAvaliacaoExistente();
    sinalizarMudancaAvaliacao();
  }));
document.getElementById('alertasManuais').addEventListener('input', sinalizarMudancaAvaliacao);

// ---------- Sugestão de avaliação via IA (capacidade `sample`) ----------
// A construção do prompt e a chamada à API da OpenAI acontecem no servidor
// (server.js) — aqui só juntamos os campos preenchidos e mandamos por fetch.
// Isso mantém sua chave de API só no servidor, nunca no navegador.
function coletarCamposParaIA(){
  return {
    desafio: document.getElementById('desafio').value.trim(),
    publicoAlvo: document.getElementById('publicoAlvo').value.trim(),
    diretrizes: document.getElementById('diretrizes').value.trim(),
    roteiro: document.getElementById('roteiro').value.trim(),
    contribuicao: document.getElementById('contribuicao').value.trim(),
    relato: document.getElementById('relato').value.trim(),
    duracao: document.getElementById('duracao').value.trim(),
    linkPodcast: document.getElementById('linkPodcast').value.trim(),
    transcricao: document.getElementById('transcricaoPodcast').value.trim(),
    metricasAudio: window.ultimasMetricasAudio || null
  };
}

async function pedirSugestaoIA(){
  const resp = await fetch('/api/suggest-scores', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(coletarCamposParaIA())
  });
  if(!resp.ok){
    const err = await resp.json().catch(()=>({}));
    const e = new Error(err.erro || ('Erro ' + resp.status));
    e.status = resp.status;
    throw e;
  }
  return await resp.json();
}

async function sugerirAvaliacaoIA(){
  const status = document.getElementById('sugestaoIAStatus');
  const btn = document.getElementById('btnSugerirIA');
  btn.disabled = true;
  status.innerHTML = 'Pensando... (pode levar até 1 minuto)';
  try{
    const resultado = await pedirSugestaoIA();
    const linhasResumo = [];
    ORDEM.forEach(chave=>{
      const sug = resultado && resultado[chave];
      if(!sug || typeof sug.pontos !== 'number'){
        if(chave === 'producao') document.getElementsByName('crit_producao').forEach(radio=>{ radio.checked=false; });
        linhasResumo.push(`${escaparHtml(RUBRICA[chave].label)}: <strong>pendente de avaliação humana</strong>`);
        return;
      }
      const niveis = RUBRICA[chave].niveis;
      let idx = niveis.findIndex(n=>n.pontos===sug.pontos);
      if(idx<0){
        idx = 0;
        let menorDist = Infinity;
        niveis.forEach((n,i)=>{ const d = Math.abs(n.pontos-sug.pontos); if(d<menorDist){ menorDist=d; idx=i; } });
      }
      const radios = document.getElementsByName(`crit_${chave}`);
      if(radios[idx]) radios[idx].checked = true;
      if(chave==='producao') window.producaoProvisoria = true;
      linhasResumo.push(`<strong>${escaparHtml(RUBRICA[chave].label)}: ${niveis[idx].pontos} pts</strong> — ${escaparHtml((sug.justificativa||'').toString())}`);
    });
    atualizarNota();
    status.innerHTML = '<div style="margin-top:4px;">' + linhasResumo.join('<br><br>') + '</div><div class="hint" style="margin-top:6px;">A IA sugere apenas roteiro, adequação e relato. “Produção do podcast” permanece obrigatoriamente pendente até sua escuta e decisão.</div>';
  } catch(e){
    console.error(e);
    if(e.status===401 || e.status===403){
      status.innerHTML = '<span style="color:var(--vermelho);">Chave da API da OpenAI ausente ou inválida — confira o arquivo .env do servidor.</span>';
    } else if(e.status===429){
      status.innerHTML = '<span style="color:var(--amarelo);">Muitas solicitações agora (ou limite da sua conta OpenAI). Aguarde um instante e tente novamente.</span>';
    } else if(e.status===0 || e.message==='Failed to fetch'){
      status.innerHTML = '<span style="color:var(--vermelho);">Não foi possível falar com o servidor local — confira se ele está rodando (npm start).</span>';
    } else {
      status.innerHTML = '<span style="color:var(--vermelho);">Não foi possível obter a sugestão (' + e.message + '). Tente novamente.</span>';
    }
  } finally {
    btn.disabled = false;
  }
}

// ---------- Avaliação automática (encadeia: métricas de áudio + sugestão IA + feedback) ----------
async function avaliarAutomaticamente(){
  const status = document.getElementById('autoAvaliarStatus');
  const btn = document.getElementById('btnAutoAvaliar');
  const nome = document.getElementById('nome').value.trim();
  const roteiro = document.getElementById('roteiro').value.trim();
  const relato = document.getElementById('relato').value.trim();
  if(!nome && !roteiro && !relato){
    status.innerHTML = '<span style="color:var(--vermelho);">Importe primeiro o PDF do relatório do aluno (passo 1 acima) — ainda não há nada para avaliar.</span>';
    return;
  }
  btn.disabled = true;
  try{
    const arquivoInput = document.getElementById('arquivoLocal');
    if(arquivoInput.files && arquivoInput.files[0] && !window.ultimasMetricasAudio){
      status.innerHTML = 'Analisando volume, picos e silêncio do áudio...';
      await analisarAudioLocal();
    }
    status.innerHTML = 'Pedindo à IA uma sugestão de pontuação para os 4 critérios... (pode levar até 1 minuto)';
    await sugerirAvaliacaoIA();
    gerarFeedback();
    const semAudio = !window.ultimasMetricasAudio;
    const comTranscricao = !!document.getElementById('transcricaoPodcast').value.trim();
    status.innerHTML = '<span style="color:var(--verde);">✔ Pontuação sugerida (veja a justificativa de cada critério abaixo, na rubrica) e feedback gerado no card "Feedback gerado", à direita.</span>'
      + (semAudio ? '<div class="hint" style="margin-top:4px;">Nenhum arquivo de áudio local foi carregado, então "Produção do podcast" foi sugerido só com base no texto do relatório e na duração informada — carregue o arquivo do podcast acima para uma sugestão mais informada.</div>' : '')
      + (comTranscricao
          ? '<div class="hint" style="margin-top:4px;">Uma transcrição foi fornecida, então a fidelidade do que foi falado ao roteiro já foi considerada pela IA — mas dicção, efeitos sonoros e edição continuam sendo só seu julgamento, ouvindo o áudio.</div>'
          : '<div class="hint" style="margin-top:4px;">Revise a pontuação, o texto do feedback e confira o link do podcast antes de salvar — a IA não ouve o áudio nem tem transcrição, então "Produção do podcast" e a fidelidade ao roteiro continuam sendo seu julgamento.</div>');
  } catch(e){
    console.error(e);
    status.innerHTML = '<span style="color:var(--vermelho);">Não foi possível concluir a avaliação automática. Tente novamente ou use as opções avançadas abaixo.</span>';
  } finally {
    btn.disabled = false;
  }
}

// ---------- Player do podcast (link ou arquivo local) ----------
function carregarPlayer(){
  const link = document.getElementById('linkPodcast').value.trim();
  const box = document.getElementById('playerContainer');
  if(!link){ box.innerHTML = '<div class="hint">Informe um link no campo "Link do podcast" acima.</div>'; return; }
  const linkSeguro = urlHttpSegura(link);
  if(!linkSeguro){
    box.innerHTML = '<div class="alert">O link precisa começar com http:// ou https://.</div>';
    return;
  }
  if(/open\.spotify\.com\/(episode|show)\//i.test(linkSeguro)){
    carregarSpotify(linkSeguro, box);
    return;
  }
  // Esta página roda com regras de segurança que bloqueiam carregar conteúdo
  // embutido de outros sites (Spotify, SoundCloud, Google Drive, ou até um
  // arquivo de áudio hospedado em outro link) — a tentativa de embutir falha
  // silenciosamente (ícone quebrado, sem erro visível). Isso não tem conserto
  // por aqui: não é um bug de link errado, é uma restrição da própria
  // plataforma. Por isso, para links, a forma que sempre funciona é abrir em
  // nova aba. Para ouvir dentro da própria ferramenta (com medição de áudio
  // incluída), baixe o arquivo e use "Ou carregar um arquivo local" abaixo.
  let plataforma = 'o link';
  if(/open\.spotify\.com\//.test(link)) plataforma = 'o Spotify';
  else if(/soundcloud\.com\//.test(link)) plataforma = 'o SoundCloud';
  else if(/drive\.google\.com\//.test(link)) plataforma = 'o Google Drive';
  else if(/\.(mp3|wav|m4a|ogg|aac|flac|mp4|webm|mov|m4v)(\?.*)?$/i.test(link)) plataforma = 'o arquivo';

  box.innerHTML = `
    <div class="hint" style="margin-bottom:8px;">Por uma restrição de segurança desta página, não é possível tocar ${plataforma} embutido aqui dentro — abra em uma nova aba para ouvir/assistir:</div>
    <div class="toolbar">
      <a class="btn" href="${escaparHtml(linkSeguro)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">▶ Abrir e ouvir em nova aba ↗</a>
    </div>
    <div class="hint" style="margin-top:8px;">Quer medir volume/ruído automaticamente, ou usar a "Avaliação automática" com mais evidência? Baixe o arquivo do podcast e carregue-o em "Ou carregar um arquivo local" logo abaixo — esse caminho toca dentro da ferramenta e habilita a análise de áudio.</div>`;
}

document.getElementById('arquivoLocal').addEventListener('change', function(e){
  const file = e.target.files[0];
  window.ultimasMetricasAudio = null;
  document.getElementById('metricasAudioBox').innerHTML = '';
  if(!file) return;
  if(window.mediaLocalUrl) URL.revokeObjectURL(window.mediaLocalUrl);
  const url = URL.createObjectURL(file);
  window.mediaLocalUrl = url;
  const isVideo = file.type.startsWith('video');
  const box = document.getElementById('playerContainer');
  const tag = isVideo ? 'video' : 'audio';
  box.innerHTML = `<${tag} controls style="width:100%;${isVideo?'max-height:280px;':''}" id="mediaLocal" src="${url}"></${tag}>`;
  const media = document.getElementById('mediaLocal');
  media.addEventListener('loadedmetadata', function(){
    if(!isFinite(media.duration)) return;
    const total = Math.round(media.duration);
    const mm = Math.floor(total/60).toString().padStart(2,'0');
    const ss = (total%60).toString().padStart(2,'0');
    const info = document.getElementById('duracaoDetectadaBox');
    info.style.display = 'block';
    info.innerHTML = `Duração detectada no arquivo: <strong>${mm}:${ss}</strong>
      <button type="button" class="btn secondary" style="padding:3px 8px;font-size:0.72rem;margin-left:6px;" onclick="usarDuracaoDetectada('${mm}:${ss}')">Usar esta duração</button>`;
  });
  // Já mede volume/picos/silêncio automaticamente ao carregar o arquivo, sem precisar clicar em outro botão.
  analisarAudioLocal();
});

function usarDuracaoDetectada(mmss){
  document.getElementById('duracao').value = mmss;
  atualizarNota();
}

// ---------- Análise objetiva de áudio (Web Audio API, 100% no navegador) ----------
async function analisarAudioLocal(){
  const input = document.getElementById('arquivoLocal');
  const file = input.files && input.files[0];
  const box = document.getElementById('metricasAudioBox');
  if(!file){ box.innerHTML = '<span style="color:var(--vermelho);">Selecione um arquivo local acima primeiro.</span>'; return; }
  box.textContent = 'Analisando áudio...';
  try{
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtxClass();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const duracaoSeg = audioBuffer.duration;
    let somaQuadrados=0, contagem=0, pico=0, amostrasSilencio=0;
    const limiarSilencio = 0.02;
    const passo = Math.max(1, Math.floor(audioBuffer.sampleRate/4000));
    for(let ch=0; ch<audioBuffer.numberOfChannels; ch++){
      const dados = audioBuffer.getChannelData(ch);
      for(let i=0;i<dados.length;i+=passo){
        const v = dados[i];
        somaQuadrados += v*v;
        contagem++;
        const av = Math.abs(v);
        if(av>pico) pico=av;
        if(av<limiarSilencio) amostrasSilencio++;
      }
    }
    const rms = Math.sqrt(somaQuadrados/(contagem||1));
    const rmsDb = 20*Math.log10(rms || 1e-8);
    const picoDb = 20*Math.log10(pico || 1e-8);
    const silencioPct = (amostrasSilencio/(contagem||1))*100;
    const clipping = pico >= 0.99;
    if(ctx.close) ctx.close();

    const mm = Math.floor(duracaoSeg/60).toString().padStart(2,'0');
    const ss = Math.round(duracaoSeg%60).toString().padStart(2,'0');

    window.ultimasMetricasAudio = {
      duracaoSeg: Math.round(duracaoSeg), volumeMedioDb: Math.round(rmsDb*10)/10,
      picoDb: Math.round(picoDb*10)/10, silencioPct: Math.round(silencioPct*10)/10, clipping
    };

    box.innerHTML = `
      <table class="score-table">
        <tr><td>Duração</td><td style="text-align:right;">${mm}:${ss}</td></tr>
        <tr><td>Volume médio</td><td style="text-align:right;">${rmsDb.toFixed(1)} dBFS</td></tr>
        <tr><td>Pico</td><td style="text-align:right;">${picoDb.toFixed(1)} dBFS ${clipping ? '<span class="badge b-zero">estouro</span>' : ''}</td></tr>
        <tr><td>Silêncio</td><td style="text-align:right;">${silencioPct.toFixed(0)}%</td></tr>
      </table>
      <div class="hint">Volume médio costuma soar bem entre -23 e -14 dBFS. Muito silêncio (acima de 30%) pode indicar pausas longas ou trechos vazios. Isto é um indicador objetivo, não substitui ouvir o áudio.</div>
      <button type="button" class="btn secondary" style="margin-top:6px;" onclick="usarDuracaoDetectada('${mm}:${ss}')">Usar esta duração</button>
    `;
  } catch(e){
    console.error(e);
    box.innerHTML = '<span style="color:var(--vermelho);">Não foi possível analisar este arquivo (' + e.message + '). Alguns formatos de vídeo não são suportados pela análise, mas o player acima ainda deve funcionar.</span>';
  }
}

function parseDuracao(str){
  if(!str) return null;
  const m = str.trim().match(/^(\d{1,2}):(\d{2})$/);
  if(!m) return null;
  return parseInt(m[1],10)*60 + parseInt(m[2],10);
}

function getSelecionado(chave){
  const el = document.querySelector(`input[name=crit_${chave}]:checked`);
  if(!el) return null;
  return RUBRICA[chave].niveis[parseInt(el.value,10)];
}

function contemPlaceholder(txt){
  if(!txt) return false;
  const low = txt.toLowerCase();
  return PLACEHOLDERS.some(p=>low.includes(p));
}

function aplicarProducaoPorEvidencia(){
  if(window.producaoProvisoria === false) return;
  const link = document.getElementById('linkPodcast').value.trim();
  const duracao = document.getElementById('duracao').value.trim();
  const segundos = parseDuracao(duracao);
  if(!link || segundos===null) return;
  const pontos = (segundos>=120 && segundos<=300) ? 3 : 2;
  const indice = RUBRICA.producao.niveis.findIndex(n=>n.pontos===pontos);
  const radio = document.getElementsByName('crit_producao')[indice];
  if(radio) radio.checked=true;
  window.producaoProvisoria=true;
}

function atualizarNota(){
  aplicarProducaoPorEvidencia();
  let total = 0, algumSelecionado=false;
  const linhas = [];
  ORDEM.forEach(chave=>{
    const niv = getSelecionado(chave);
    const crit = RUBRICA[chave];
    if(niv){
      total += niv.pontos;
      algumSelecionado = true;
      let badge = niv.pontos===crit.max ? 'b-max' : (niv.pontos===0?'b-zero':'b-mid');
      linhas.push(`<tr><td>${crit.label}</td><td style="text-align:right;"><span class="badge ${badge}">${niv.pontos}/${crit.max}</span></td></tr>`);
    } else {
      linhas.push(`<tr><td>${crit.label}</td><td style="text-align:right;color:#aaa;">não avaliado</td></tr>`);
    }
  });
  document.getElementById('scoreTable').innerHTML = linhas.join('');
  document.getElementById('totalNota').textContent = total.toFixed(1).replace(/\.0$/,'');

  // tag IA
  const ia = document.getElementById('iaUsada').value;
  document.getElementById('iaTag').textContent = ia==='sim' ? 'Declarou uso de IA' : 'Não declarou uso de IA';

  // alertas
  const alerts = [];
  const dur = document.getElementById('duracao').value;
  const durSeg = parseDuracao(dur);
  const durHint = document.getElementById('duracaoHint');
  const producaoEvidencia = document.getElementById('producaoEvidencia');
  if(dur && durSeg===null){
    alerts.push({tipo:'info', txt:'Formato de duração inválido. Use mm:ss (ex: 03:45).'});
  } else if(durSeg!==null && (durSeg<120 || durSeg>300)){
    alerts.push({tipo:'alerta', txt:`Duração informada (${dur}) fora do limite de 2 a 5 minutos. Isso já é considerado no critério "Produção do podcast" da rubrica (limita a no máximo 2 pontos).`});
    durHint.style.color = 'var(--vermelho)';
  } else {
    durHint.style.color = '#7B8794';
  }
  if(producaoEvidencia){
    const situacao = durSeg===null ? 'Duração ainda não confirmada.' : (durSeg>=120&&durSeg<=300 ? `Duração ${dur}: dentro do limite.` : `Duração ${dur}: fora do limite.`);
    producaoEvidencia.innerHTML = `<strong>${escaparHtml(situacao)}</strong> Selecione a faixa somente após ouvir e verificar fidelidade ao roteiro, efeitos sonoros, qualidade do áudio e edição.`;
  }

  ['nome','matricula'].forEach(id=>{
    if(!document.getElementById(id).value.trim()) alerts.push({tipo:'info', txt:`Campo "${id==='nome'?'Nome':'Matrícula'}" não preenchido.`});
  });
  const orientadorIndicado = document.getElementById('orientadorIndicado').value.trim();
  if(!orientadorIndicado || orientadorIndicado.toLowerCase()==='selecione'){
    alerts.push({tipo:'alerta', txt:'Orientador(a) não foi selecionado(a)/preenchido(a) no relatório.'});
  }
  if(!document.getElementById('linkPodcast').value.trim()){
    alerts.push({tipo:'alerta', txt:'Link do podcast não informado.'});
  }
  [['desafio','Desafio'],['publicoAlvo','Público-alvo'],['roteiro','Roteiro'],['relato','Relato da experiência'],['contribuicao','Contribuição para o desafio']]
    .forEach(([id,label])=>{
      const v = document.getElementById(id).value;
      if(!v.trim()) alerts.push({tipo:'info', txt:`Campo "${label}" está vazio.`});
      else if(contemPlaceholder(v)) alerts.push({tipo:'alerta', txt:`Campo "${label}" parece conter texto de modelo não substituído.`});
    });
  if(ia==='sim' && !document.getElementById('iaDescricao').value.trim()){
    alerts.push({tipo:'alerta', txt:'Declarou uso de IA, mas não descreveu ferramentas/finalidade/revisões.'});
  }
  if(document.getElementById('orientadorIncorretoChk').checked && !document.getElementById('orientadorCorreto').value.trim()){
    alerts.push({tipo:'info', txt:'Marcado "orientador incorreto", mas o nome correto não foi preenchido.'});
  }
  if(!algumSelecionado){
    alerts.push({tipo:'info', txt:'Nenhum critério da rubrica foi avaliado ainda.'});
  }
  const alertasManuais = document.getElementById('alertasManuais').value.split('\n').map(x=>x.trim()).filter(Boolean);
  alertasManuais.forEach(txt=>alerts.push({tipo:'manual', txt}));

  const box = document.getElementById('alertsBox');
  if(alerts.length===0){
    box.innerHTML = '<div class="no-alert">✔ Nenhuma pendência identificada.</div>';
  } else {
    box.innerHTML = alerts.map(a=>`<div class="alert ${a.tipo==='info'?'info':''}">${a.txt}</div>`).join('');
  }
  window.ultimosAlertas = alerts;
}
document.getElementById('iaUsada').dispatchEvent(new Event('change'));
atualizarNota();

// ---------- Geração de feedback ----------
let feedbackAlterado = false;
feedbackOut.addEventListener('input', ()=>{
  feedbackAlterado = true;
  document.getElementById('feedbackStatus').textContent = 'Editado manualmente - este texto será preservado ao salvar.';
});

function sinalizarMudancaAvaliacao(){
  atualizarNota();
  if(!feedbackOut.value.trim()) return;
  if(feedbackAlterado){
    document.getElementById('feedbackStatus').textContent = 'A avaliação mudou. Seu texto manual foi preservado; clique em “Atualizar conforme avaliação” quando quiser reconciliá-lo.';
  }else{
    gerarFeedback();
  }
}

function primeiroNome(nomeCompleto){
  if(!nomeCompleto) return 'aluno(a)';
  return nomeCompleto.trim().split(/\s+/)[0];
}

function gerarFeedback(){
  if(feedbackAlterado && feedbackOut.value.trim()) return feedbackOut.value;
  const nome = document.getElementById('nome').value.trim();
  const total = parseFloat(document.getElementById('totalNota').textContent) || 0;
  const linhas = [];
  linhas.push(`Olá ${primeiroNome(nome)},`);
  linhas.push('');
  const criteriosPendentes = ORDEM.filter(chave=>!getSelecionado(chave));
  if(criteriosPendentes.length){
    linhas.push(`AVALIAÇÃO PARCIAL - falta avaliar: ${criteriosPendentes.map(c=>RUBRICA[c].label).join(', ')}.`);
    linhas.push('');
  }

  if(document.getElementById('orientadorIncorretoChk').checked){
    const correto = document.getElementById('orientadorCorreto').value.trim();
    const indicado = document.getElementById('orientadorIndicado').value.trim();
    if(correto){
      linhas.push(`Só uma correção: seu orientador é o(a) ${correto}${indicado?`, não ${indicado}`:''}.`);
      linhas.push('');
    }
  }

  let comentarios = [];
  ORDEM.forEach(chave=>{
    const niv = getSelecionado(chave);
    if(chave==='producao' && niv && window.producaoProvisoria){
      const duracao = document.getElementById('duracao').value.trim();
      comentarios.push(`A duração informada (${duracao || 'não informada'}) está dentro do intervalo solicitado. A pontuação de produção é provisória, baseada nos dados disponíveis; efeitos sonoros, qualidade do áudio, edição e fidelidade ao roteiro devem ser confirmados pela escuta.`);
    } else if(niv && niv.feedback){
      comentarios.push(niv.feedback);
    }
    const observacao = document.getElementById(`obs_${chave}`).value.trim();
    if(observacao) comentarios.push(`${RUBRICA[chave].label}: ${observacao}`);
  });
  const observacoesAdicionais = document.getElementById('alertasManuais').value.split('\n').map(x=>x.trim()).filter(Boolean);
  observacoesAdicionais.forEach(obs=>comentarios.push(`Observação adicional: ${obs}`));

  if(comentarios.length===0){
    linhas.push('Sua atividade está excelente, contemplando todos os critérios avaliados. Parabéns pelo empenho na produção do podcast!');
  } else {
    comentarios.forEach(c=>{ linhas.push(c); linhas.push(''); });
  }

  linhas.push('');
  linhas.push(`${criteriosPendentes.length?'Nota parcial':'Nota final'}: ${total.toFixed(1).replace(/\.0$/,'')} / 10`);
  linhas.push('');
  linhas.push('Um abraço,');
  linhas.push('Prof. Rogério');

  let texto = linhas.join('\n').replace(/\n{3,}/g,'\n\n').replace(/—/g,'-');
  feedbackOut.value = texto;
  feedbackAlterado = false;
  document.getElementById('feedbackStatus').textContent = 'Sugestão gerada. Você pode editar o texto livremente.';
  return texto;
}

function regenerarFeedback(){
  if(feedbackAlterado && feedbackOut.value.trim() && !confirm('Gerar novamente substituirá suas alterações manuais. Continuar?')) return;
  feedbackAlterado = false;
  return gerarFeedback();
}

function copiarFeedback(){
  const txt = document.getElementById('feedbackOut').value || gerarFeedback();
  navigator.clipboard.writeText(txt).then(()=>{
    const btns = document.querySelectorAll('.btn.secondary');
  }).catch(()=>{
    const ta = document.getElementById('feedbackOut');
    ta.select(); document.execCommand('copy');
  });
}

function copiarCampo(id){
  const campo = document.getElementById(id);
  if(!campo || !campo.value.trim()) return;
  navigator.clipboard.writeText(campo.value).catch(()=>{
    campo.select(); document.execCommand('copy');
  });
}

async function analisarCoerencia(){
  const btn = document.getElementById('btnAnalisarCoerencia');
  const status = document.getElementById('coerenciaStatus');
  const campos = coletarCamposParaIA();
  campos.nome = document.getElementById('nome').value.trim();
  if(!campos.desafio && !campos.publicoAlvo && !campos.roteiro && !campos.contribuicao){
    status.innerHTML = '<span style="color:var(--vermelho);">Importe o relatório ou preencha os campos da proposta antes de analisar.</span>';
    return;
  }
  const analiseAtual = document.getElementById('analiseCoerenciaOut').value.trim();
  const feedbackAtual = document.getElementById('feedbackCoerenciaOut').value.trim();
  if((analiseAtual || feedbackAtual) && !confirm('Gerar novamente substituirá os textos de coerência atuais. Continuar?')) return;
  btn.disabled = true;
  status.textContent = 'Analisando as relações entre desafio, público, estratégia, roteiro e contribuição...';
  try{
    const resp = await fetch('/api/analisar-coerencia', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(campos)
    });
    const dados = await resp.json().catch(()=>({}));
    if(!resp.ok) throw new Error(dados.erro || `Erro ${resp.status}`);
    document.getElementById('analiseCoerenciaOut').value = dados.analise_coerencia || '';
    document.getElementById('feedbackCoerenciaOut').value = dados.feedback_coerencia || '';
    status.innerHTML = '<span style="color:var(--verde);">✔ Análise e feedback gerados a partir da mesma base semântica. Revise e edite livremente antes de salvar.</span>';
  }catch(e){
    console.error(e);
    status.innerHTML = `<span style="color:var(--vermelho);">Não foi possível analisar a coerência (${escaparHtml(e.message)}).</span>`;
  }finally{ btn.disabled = false; }
}

// ---------- Turma (capacidade db, sincronizada) ----------
// ---------- Capacidades da plataforma (db / downloads / sample) ----------
let turmaCache = [];
let turmasDisponiveis = [];
let turmaAtualId = null;
let editingDocId = null;

function slugId(str){
  const s = (str||'').toString().trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'');
  return s ? s.slice(0,120) : null;
}

function mostrarStatusTurma(msg, tipo){
  const el = document.getElementById('turmaStatus');
  if(!el) return;
  el.innerHTML = msg ? `<span style="color:${tipo==='erro'?'var(--vermelho)':'var(--amarelo)'};">${msg}</span>` : '';
}

// ---------- Transcrição automática do podcast (API de áudio da OpenAI) ----------
async function transcreverAutomaticamente(){
  const status = document.getElementById('transcreverStatus');
  const btn = document.getElementById('btnTranscrever');
  const input = document.getElementById('arquivoLocal');
  const file = input.files && input.files[0];
  const link = document.getElementById('linkPodcast').value.trim();
  if(!file && /open\.spotify\.com\//i.test(link)){
    status.innerHTML = '<span style="color:var(--amarelo);">O Spotify não fornece o áudio completo para transcrição. Abra o episódio, ouça-o e avalie manualmente a produção. Se o aluno também enviou um Google Drive público, substitua temporariamente o link por ele para transcrever.</span>';
    return;
  }
  if(!file && !/drive\.google\.com\//i.test(link)){
    status.innerHTML = '<span style="color:var(--vermelho);">Carregue um arquivo local ou informe um link público do Google Drive.</span>';
    return;
  }
  btn.disabled = true;
  status.textContent = 'Transcrevendo... (pode levar de alguns segundos a alguns minutos, dependendo da duração do áudio)';
  try{
    let resp;
    if(file){
      const fd = new FormData();
      fd.append('audio', file, file.name);
      resp = await fetch('/api/transcrever', {method:'POST', body: fd});
    } else {
      resp = await fetch('/api/transcrever-link', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url:link})
      });
    }
    if(!resp.ok){
      const err = await resp.json().catch(()=>({}));
      const e = new Error(err.erro || ('Erro ' + resp.status));
      e.status = resp.status;
      throw e;
    }
    const dados = await resp.json();
    document.getElementById('transcricaoPodcast').value = dados.texto || '';
    status.innerHTML = '<span style="color:var(--verde);">✔ Transcrição gerada — revise antes de usar (transcrição automática pode errar nomes próprios, termos técnicos etc.).</span>';
  }catch(e){
    console.error(e);
    if(e.status===401 || e.status===403){
      status.innerHTML = '<span style="color:var(--vermelho);">Chave da API da OpenAI ausente ou inválida — confira o arquivo .env do servidor.</span>';
    } else if(e.status===413){
      status.innerHTML = '<span style="color:var(--vermelho);">Arquivo grande demais para transcrever de uma vez. Tente um arquivo menor.</span>';
    } else {
      status.innerHTML = '<span style="color:var(--vermelho);">Não foi possível transcrever (' + e.message + ').</span>';
    }
  }finally{
    btn.disabled = false;
  }
}

// ---------- Turma (persistida no servidor local, pasta data/) ----------
function urlAvaliacoes(sufixo=''){
  if(!turmaAtualId) throw new Error('Selecione ou crie uma turma.');
  return `/api/turmas/${encodeURIComponent(turmaAtualId)}/avaliacoes${sufixo}`;
}

async function respostaJson(resp, contexto='operação'){
  const tipo = resp.headers.get('content-type') || '';
  if(!tipo.includes('application/json')){
    throw new Error(`O servidor local está desatualizado para esta ${contexto}. Encerre-o com Control+C, inicie novamente e recarregue a página.`);
  }
  const dados = await resp.json();
  if(!resp.ok) throw new Error(dados.erro || `Falha na ${contexto} (erro ${resp.status}).`);
  return dados;
}

async function carregarListaTurmas(preferida){
  const resp = await fetch('/api/turmas');
  turmasDisponiveis = await respostaJson(resp, 'leitura das turmas');
  const select = document.getElementById('turmaSelect');
  select.innerHTML = '';
  if(!turmasDisponiveis.length){
    const opt = document.createElement('option'); opt.value=''; opt.textContent='Nenhuma turma criada'; select.appendChild(opt);
    turmaAtualId=null; turmaCache=[]; renderRoster(); return;
  }
  turmasDisponiveis.forEach(t=>{
    const opt=document.createElement('option'); opt.value=t.id; opt.textContent=`${t.nome} (${t.quantidade})`; select.appendChild(opt);
  });
  const salva = preferida || localStorage.getItem('avaliadorTurmaAtual');
  turmaAtualId = turmasDisponiveis.some(t=>t.id===salva) ? salva : turmasDisponiveis[0].id;
  select.value=turmaAtualId;
  localStorage.setItem('avaliadorTurmaAtual', turmaAtualId);
}

async function selecionarTurma(id){
  turmaAtualId=id || null;
  editingDocId=null;
  if(turmaAtualId) localStorage.setItem('avaliadorTurmaAtual', turmaAtualId);
  await carregarTurma();
}

async function criarTurma(){
  const nome = prompt('Nome da nova turma (ex.: TEDPRO 2026.2 - Turma A):');
  if(!nome || !nome.trim()) return;
  try{
    const resp=await fetch('/api/turmas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:nome.trim()})});
    const turma=await respostaJson(resp, 'criação da turma');
    await carregarListaTurmas(turma.id); await carregarTurma();
  }catch(e){ alert(e.message); }
}

async function renomearTurma(){
  const turma=turmasDisponiveis.find(t=>t.id===turmaAtualId);
  if(!turma){ alert('Crie ou selecione uma turma primeiro.'); return; }
  const nome=prompt('Novo nome da turma:', turma.nome);
  if(!nome || !nome.trim() || nome.trim()===turma.nome) return;
  try{
    const resp=await fetch(`/api/turmas/${encodeURIComponent(turmaAtualId)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:nome.trim()})});
    await respostaJson(resp, 'alteração do nome da turma');
    await carregarListaTurmas(turmaAtualId); await carregarTurma();
  }catch(e){ alert(e.message); }
}

async function excluirTurma(){
  const turma=turmasDisponiveis.find(t=>t.id===turmaAtualId);
  if(!turma){ alert('Selecione uma turma primeiro.'); return; }
  const digitado=prompt(`ATENÇÃO: esta ação apagará permanentemente a turma e suas ${turma.quantidade} avaliação(ões).\n\nPara confirmar, digite exatamente o nome da turma:\n${turma.nome}`);
  if(digitado===null) return;
  if(digitado!==turma.nome){ alert('O nome digitado não corresponde. A turma não foi apagada.'); return; }
  try{
    const resp=await fetch(`/api/turmas/${encodeURIComponent(turma.id)}`,{
      method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({confirmarNome:digitado})
    });
    const resumo=await respostaJson(resp, 'exclusão da turma');
    localStorage.removeItem('avaliadorTurmaAtual');
    turmaAtualId=null; turmaCache=[]; editingDocId=null;
    await carregarListaTurmas(); await carregarTurma();
    alert(`Turma “${resumo.nome}” apagada. ${resumo.avaliacoesRemovidas} avaliação(ões) foram removidas permanentemente.`);
  }catch(e){ alert(e.message); }
}

async function carregarTurma(){
  if(!turmaAtualId){ turmaCache=[]; renderRoster(); mostrarStatusTurma('Crie uma turma para começar.'); return; }
  try{
    const resp = await fetch(urlAvaliacoes());
    if(!resp.ok) throw new Error('Erro ' + resp.status);
    turmaCache = await resp.json();
    turmaCache.sort((a,b)=> (a.nome||'').localeCompare(b.nome||'', 'pt-BR'));
    mostrarStatusTurma('');
  }catch(e){
    console.error(e);
    mostrarStatusTurma('Não foi possível conectar ao servidor local — confira se ele está rodando (npm start) e recarregue a página. As avaliações desta sessão continuam na tela, mas não vão salvar na turma.', 'erro');
  }
  renderRoster();
  verificarAvaliacaoExistente();
}

async function initApp(){
  try{ await carregarListaTurmas(); await carregarTurma(); }
  catch(e){ console.error(e); mostrarStatusTurma(e.message, 'erro'); }
}

function coletarDados(){
  const scores = {};
  ORDEM.forEach(chave=>{
    const niv = getSelecionado(chave);
    scores[chave] = niv ? niv.pontos : null;
  });
  const total = ORDEM.reduce((s,c)=> s + (scores[c]||0), 0);
  const alertas = window.ultimosAlertas || [];
  return {
    nome: document.getElementById('nome').value.trim(),
    matricula: document.getElementById('matricula').value.trim(),
    orientadorIndicado: document.getElementById('orientadorIndicado').value.trim(),
    orientadorIncorreto: document.getElementById('orientadorIncorretoChk').checked,
    orientadorCorreto: document.getElementById('orientadorCorreto').value.trim(),
    linkPodcast: document.getElementById('linkPodcast').value.trim(),
    duracao: document.getElementById('duracao').value.trim(),
    desafio: document.getElementById('desafio').value.trim(),
    publicoAlvo: document.getElementById('publicoAlvo').value.trim(),
    diretrizes: document.getElementById('diretrizes').value.trim(),
    roteiro: document.getElementById('roteiro').value.trim(),
    contribuicao: document.getElementById('contribuicao').value.trim(),
    relato: document.getElementById('relato').value.trim(),
    transcricao: document.getElementById('transcricaoPodcast').value.trim(),
    observacoesCriterios: Object.fromEntries(ORDEM.map(chave=>[chave, document.getElementById(`obs_${chave}`).value.trim()])),
    alertasManuais: document.getElementById('alertasManuais').value.split('\n').map(x=>x.trim()).filter(Boolean),
    iaUsada: document.getElementById('iaUsada').value,
    iaDescricao: document.getElementById('iaDescricao').value.trim(),
    metricasAudio: window.ultimasMetricasAudio || null,
    producaoProvisoria: !!window.producaoProvisoria,
    scores, total,
    alertas: alertas,
    alertasCount: alertas.length,
    feedback: document.getElementById('feedbackOut').value || gerarFeedback(),
    analiseCoerencia: document.getElementById('analiseCoerenciaOut').value.trim(),
    feedbackCoerencia: document.getElementById('feedbackCoerenciaOut').value.trim(),
    timestamp: new Date().toISOString()
  };
}

async function salvarNaTurma(){
  const dados = coletarDados();
  if(!turmaAtualId){ alert('Crie ou selecione uma turma antes de salvar.'); return; }
  if(!dados.nome){ alert('Preencha ao menos o nome do aluno antes de salvar na turma.'); return; }
  const btn = event ? event.target : null;
  if(btn) btn.disabled = true;
  try{
    const docId = editingDocId || slugId(dados.matricula) || ('aluno-' + Date.now());
    const resp = await fetch(urlAvaliacoes('/' + encodeURIComponent(docId)), {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(dados)
    });
    if(!resp.ok) throw new Error('Erro ' + resp.status);
    editingDocId = null;
    await carregarListaTurmas(turmaAtualId); await carregarTurma();
  }catch(e){
    console.error(e);
    alert('Não foi possível salvar na turma (' + e.message + '). Confira se o servidor local está rodando.');
  }finally{
    if(btn) btn.disabled = false;
  }
}

function renderRoster(){
  const body = document.getElementById('rosterBody');
  const empty = document.getElementById('rosterEmpty');
  if(!body) return;
  body.innerHTML='';
  empty.style.display = turmaCache.length? 'none':'block';
  turmaCache.forEach(a=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escaparHtml(a.nome||'(sem nome)')}</td><td>${escaparHtml(a.matricula||'-')}</td>
      <td><strong>${(a.total||0).toFixed(1).replace(/\.0$/,'')}</strong>/10</td>
      <td>${a.alertasCount>0? `<span class="badge b-mid">${a.alertasCount}</span>` : '<span class="badge b-max">0</span>'}</td>
      <td class="acoes">
        <button class="btn secondary" onclick="editarAluno('${a.id}')">Editar</button>
        <button class="btn danger" onclick="excluirAluno('${a.id}')">Excluir</button>
      </td>`;
    body.appendChild(tr);
  });
}

function editarAluno(id){
  const a = turmaCache.find(x=>x.id===id);
  if(!a) return;
  editingDocId = id;
  document.getElementById('nome').value = a.nome||'';
  document.getElementById('matricula').value = a.matricula||'';
  document.getElementById('orientadorIndicado').value = a.orientadorIndicado||'';
  document.getElementById('orientadorIncorretoChk').checked = !!a.orientadorIncorreto;
  document.getElementById('orientadorCorretoWrap').style.display = a.orientadorIncorreto?'block':'none';
  document.getElementById('orientadorCorreto').value = a.orientadorCorreto||'';
  document.getElementById('linkPodcast').value = a.linkPodcast||'';
  document.getElementById('transcricaoPodcast').value = a.transcricao||'';
  document.getElementById('duracao').value = a.duracao||'';
  document.getElementById('desafio').value = a.desafio||'';
  document.getElementById('publicoAlvo').value = a.publicoAlvo||'';
  document.getElementById('diretrizes').value = a.diretrizes||'';
  document.getElementById('roteiro').value = a.roteiro||'';
  document.getElementById('contribuicao').value = a.contribuicao||'';
  document.getElementById('relato').value = a.relato||'';
  document.getElementById('iaUsada').value = a.iaUsada||'nao';
  document.getElementById('iaDescricao').value = a.iaDescricao||'';
  ORDEM.forEach(chave=>{ document.getElementById(`obs_${chave}`).value = a.observacoesCriterios?.[chave] || ''; });
  document.getElementById('alertasManuais').value = (a.alertasManuais||[]).join('\n');
  window.ultimasMetricasAudio = a.metricasAudio || null;
  window.producaoProvisoria = !!a.producaoProvisoria;
  document.querySelectorAll('fieldset.criterio input[type=radio]').forEach(r=>r.checked=false);
  ORDEM.forEach(chave=>{
    const pts = a.scores ? a.scores[chave] : null;
    if(pts!==null && pts!==undefined){
      const niveis = RUBRICA[chave].niveis;
      const i = niveis.findIndex(n=>n.pontos===pts);
      if(i>=0){
        const radios = document.getElementsByName(`crit_${chave}`);
        if(radios[i]) radios[i].checked = true;
      }
    }
  });
  atualizarNota();
  document.getElementById('feedbackOut').value = a.feedback||'';
  document.getElementById('analiseCoerenciaOut').value = a.analiseCoerencia||'';
  document.getElementById('feedbackCoerenciaOut').value = a.feedbackCoerencia||'';
  document.getElementById('coerenciaStatus').textContent = (a.analiseCoerencia || a.feedbackCoerencia) ? 'Textos de coerência salvos carregados para edição.' : '';
  feedbackAlterado = false;
  document.getElementById('feedbackStatus').textContent = a.feedback ? 'Feedback salvo carregado para edição.' : '';
  verificarAvaliacaoExistente();
  window.scrollTo({top:0, behavior:'smooth'});
}

async function excluirAluno(id){
  if(!confirm('Excluir este aluno da turma?')) return;
  try{
    const resp = await fetch(urlAvaliacoes('/' + encodeURIComponent(id)), {method:'DELETE'});
    if(!resp.ok) throw new Error('Erro ' + resp.status);
    await carregarListaTurmas(turmaAtualId); await carregarTurma();
  }
  catch(e){ console.error(e); alert('Não foi possível excluir (' + e.message + ').'); }
}

function novaAvaliacao(){
  if(!confirm('Limpar o formulário para uma nova avaliação?')) return;
  editingDocId = null;
  window.ultimasMetricasAudio = null;
  window.producaoProvisoria = null;
  if(window.spotifyController?.destroy){
    try{ window.spotifyController.destroy(); }catch{}
    window.spotifyController = null;
  }
  if(window.mediaLocalUrl){
    URL.revokeObjectURL(window.mediaLocalUrl);
    window.mediaLocalUrl = null;
  }
  const camposTexto = [
    'nome','matricula','orientadorIndicado','orientadorCorreto','linkPodcast',
    'transcricaoPodcast','duracao','desafio','publicoAlvo','diretrizes','roteiro',
    'contribuicao','relato','iaDescricao','alertasManuais','feedbackOut','analiseCoerenciaOut','feedbackCoerenciaOut'
  ];
  camposTexto.forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  ['arquivoRelatorioPdf','arquivoLocal'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('orientadorIncorretoChk').checked=false;
  document.getElementById('orientadorCorretoWrap').style.display='none';
  document.getElementById('iaUsada').value='nao';
  document.querySelectorAll('fieldset.criterio input[type=radio]').forEach(r=>r.checked=false);
  ORDEM.forEach(chave=>{ document.getElementById(`obs_${chave}`).value=''; });
  feedbackAlterado = false;
  document.getElementById('feedbackStatus').textContent='';
  ['importStatus','playerContainer','metricasAudioBox','transcreverStatus','autoAvaliarStatus','sugestaoIAStatus','coerenciaStatus']
    .forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=''; });
  const duracaoBox=document.getElementById('duracaoDetectadaBox');
  if(duracaoBox){ duracaoBox.innerHTML=''; duracaoBox.style.display='none'; }
  document.getElementById('iaUsada').dispatchEvent(new Event('change'));
  verificarAvaliacaoExistente();
  atualizarNota();
  window.scrollTo({top:0, behavior:'smooth'});
}

async function limparTurma(){
  if(!confirm('Isso vai apagar TODOS os alunos salvos da turma. Confirma?')) return;
  try{
    const resp = await fetch(urlAvaliacoes(), {method:'DELETE'});
    if(!resp.ok) throw new Error('Erro ' + resp.status);
    await carregarListaTurmas(turmaAtualId); await carregarTurma();
  }catch(e){ console.error(e); alert('Não foi possível limpar a turma (' + e.message + ').'); }
}

async function salvarArquivo(filename, blob){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 4000);
}

async function exportarJSON(){
  if(!turmaCache.length){ alert('Nenhum aluno salvo ainda.'); return; }
  const blob = new Blob([JSON.stringify(turmaCache,null,2)], {type:'application/json'});
  const turma=turmasDisponiveis.find(t=>t.id===turmaAtualId);
  await salvarArquivo(`${slugId(turma?.nome||'turma')}_p4_podcast.json`, blob);
}

function normalizarRegistroImportado(reg){
  const scores = Object.assign({roteiro:null, adequacao:null, producao:null, relato:null}, reg.scores || {});
  let total = reg.total;
  if(total===undefined || total===null){
    total = ORDEM.reduce((s,c)=> s + (scores[c]||0), 0);
  }
  const alertas = Array.isArray(reg.alertas) ? reg.alertas : [];
  return {
    nome: reg.nome || '',
    matricula: reg.matricula || '',
    orientadorIndicado: reg.orientadorIndicado || '',
    orientadorIncorreto: !!reg.orientadorIncorreto,
    orientadorCorreto: reg.orientadorCorreto || '',
    linkPodcast: reg.linkPodcast || '',
    transcricao: reg.transcricao || '',
    duracao: reg.duracao || '',
    desafio: reg.desafio || '',
    publicoAlvo: reg.publicoAlvo || '',
    diretrizes: reg.diretrizes || '',
    roteiro: reg.roteiro || '',
    contribuicao: reg.contribuicao || '',
    relato: reg.relato || '',
    iaUsada: reg.iaUsada || 'nao',
    iaDescricao: reg.iaDescricao || '',
    observacoesCriterios: reg.observacoesCriterios || {},
    alertasManuais: Array.isArray(reg.alertasManuais) ? reg.alertasManuais : [],
    metricasAudio: reg.metricasAudio || null,
    producaoProvisoria: !!reg.producaoProvisoria,
    scores, total,
    alertas, alertasCount: reg.alertasCount!==undefined ? reg.alertasCount : alertas.length,
    feedback: reg.feedback || '',
    analiseCoerencia: reg.analiseCoerencia || reg.analise_coerencia || '',
    feedbackCoerencia: reg.feedbackCoerencia || reg.feedback_coerencia || '',
    timestamp: reg.timestamp || new Date().toISOString()
  };
}

document.getElementById('arquivoImportarAvaliacao').addEventListener('change', async function(e){
  const file = e.target.files[0];
  const status = document.getElementById('importAvaliacaoStatus');
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async function(){
    try{
      const dados = JSON.parse(reader.result);
      const lista = Array.isArray(dados) ? dados : [dados];
      if(!lista.length){ status.innerHTML = '<span style="color:var(--vermelho);">Arquivo vazio.</span>'; return; }
      let novos = 0, atualizados = 0;
      for(const reg of lista){
        const norm = normalizarRegistroImportado(reg);
        const docId = slugId(norm.matricula) || ('aluno-' + Date.now() + '-' + novos);
        const existiaAntes = turmaCache.some(a=>a.id===docId);
        const resp = await fetch(urlAvaliacoes('/' + encodeURIComponent(docId)), {
          method: 'PUT',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(norm)
        });
        if(!resp.ok) throw new Error('Erro ' + resp.status + ' ao salvar ' + (norm.nome || docId));
        if(existiaAntes) atualizados++; else novos++;
      }
      await carregarListaTurmas(turmaAtualId); await carregarTurma();
      status.innerHTML = `<span style="color:var(--verde);">✔ Importado: ${novos} novo(s), ${atualizados} atualizado(s).</span>`;
    } catch(err){
      console.error(err);
      status.innerHTML = `<span style="color:var(--vermelho);">Não foi possível importar (${err.message}). Verifique se o arquivo é um JSON válido e se o servidor local está rodando.</span>`;
    }
  };
  reader.readAsText(file);
});

async function exportarCSV(){
  if(!turmaCache.length){ alert('Nenhum aluno salvo ainda.'); return; }
  const headers = ['nome','matricula','orientadorIndicado','linkPodcast','duracao',
    'roteiro_pts','adequacao_pts','producao_pts','relato_pts','total','iaUsada','alertasCount',
    'analiseCoerencia','feedbackCoerencia'];
  const linhas = [headers.join(';')];
  turmaCache.forEach(a=>{
    const row = [
      a.nome, a.matricula, a.orientadorIndicado, a.linkPodcast, a.duracao,
      a.scores.roteiro, a.scores.adequacao, a.scores.producao, a.scores.relato,
      a.total, a.iaUsada, a.alertasCount, a.analiseCoerencia, a.feedbackCoerencia
    ].map(v=> `"${(v===undefined||v===null?'':v).toString().replace(/"/g,'""')}"`);
    linhas.push(row.join(';'));
  });
  const blob = new Blob([linhas.join('\n')], {type:'text/csv;charset=utf-8;'});
  const turma=turmasDisponiveis.find(t=>t.id===turmaAtualId);
  await salvarArquivo(`${slugId(turma?.nome||'turma')}_p4_podcast.csv`, blob);
}

function gerarRelatorioExecutivo(){
  if(!turmaCache.length){ alert('Esta turma ainda não possui avaliações salvas.'); return; }
  const turma=turmasDisponiveis.find(t=>t.id===turmaAtualId);
  const avaliadas=turmaCache.filter(a=>Number.isFinite(Number(a.total)));
  const media=avaliadas.reduce((s,a)=>s+Number(a.total||0),0)/(avaliadas.length||1);
  const ordenadas=avaliadas.map(a=>Number(a.total||0)).sort((a,b)=>a-b);
  const mediana=ordenadas.length%2 ? ordenadas[(ordenadas.length-1)/2] : (ordenadas[ordenadas.length/2-1]+ordenadas[ordenadas.length/2])/2;
  const menorNota=ordenadas[0] ?? 0;
  const maiorNota=ordenadas[ordenadas.length-1] ?? 0;
  const faixas=[
    {label:'Abaixo de 6,0', cor:'#b54747', qtd:avaliadas.filter(a=>a.total<6).length},
    {label:'De 6,0 a 7,9', cor:'#d29b2c', qtd:avaliadas.filter(a=>a.total>=6&&a.total<8).length},
    {label:'De 8,0 a 8,9', cor:'#3987a8', qtd:avaliadas.filter(a=>a.total>=8&&a.total<9).length},
    {label:'De 9,0 a 10,0', cor:'#36865b', qtd:avaliadas.filter(a=>a.total>=9).length}
  ];
  const criterios=ORDEM.map(chave=>{
    const valores=turmaCache.map(a=>a.scores?.[chave]).filter(v=>v!==null&&v!==undefined).map(Number);
    const mediaCrit=valores.reduce((s,v)=>s+v,0)/(valores.length||1);
    return {chave,label:RUBRICA[chave].label,max:RUBRICA[chave].max,media:mediaCrit,qtd:valores.length,pct:valores.length?Math.round(mediaCrit/RUBRICA[chave].max*100):0};
  });
  const pendentes=turmaCache.filter(a=>ORDEM.some(c=>a.scores?.[c]===null||a.scores?.[c]===undefined)).length;
  const concluidas=turmaCache.length-pendentes;
  const conclusaoPct=Math.round(concluidas/turmaCache.length*100);
  const ia=turmaCache.filter(a=>a.iaUsada==='sim').length;
  const iaPct=Math.round(ia/turmaCache.length*100);
  const dentroDuracao=turmaCache.filter(a=>{const s=parseDuracao(a.duracao);return s!==null&&s>=120&&s<=300;}).length;
  const alertasContagem=new Map();
  turmaCache.flatMap(a=>a.alertas||[]).forEach(a=>{
    const texto=typeof a==='string'?a:a.txt;
    if(texto) alertasContagem.set(texto,(alertasContagem.get(texto)||0)+1);
  });
  const alertas=[...alertasContagem.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6);
  const criteriosComDados=criterios.filter(c=>c.qtd>0);
  const maisFraco=[...criteriosComDados].sort((a,b)=>a.pct-b.pct)[0];
  const maisForte=[...criteriosComDados].sort((a,b)=>b.pct-a.pct)[0];
  const recomendacoes=[];
  if(maisFraco) recomendacoes.push({titulo:'Reforçar o critério com menor desempenho',texto:`Retomar “${maisFraco.label}” com exemplos comentados, um modelo de referência e uma lista de verificação antes da entrega. O aproveitamento médio foi de ${maisFraco.pct}%.`});
  if(dentroDuracao<turmaCache.length) recomendacoes.push({titulo:'Tornar a duração verificável antes da publicação',texto:'Incluir nas instruções uma etapa obrigatória de conferência do intervalo de 2 a 5 minutos e orientar o estudante a registrar a duração final no relatório.'});
  if(turmaCache.some(a=>!a.transcricao)) recomendacoes.push({titulo:'Ampliar as evidências disponíveis para avaliação',texto:'Solicitar, além do link de publicação, um arquivo de áudio ou link público do Google Drive. Isso permite transcrição, comparação com o roteiro e maior rastreabilidade da correção.'});
  if(pendentes) recomendacoes.push({titulo:'Concluir as avaliações pendentes',texto:`Há ${pendentes} registro(s) com ao menos um critério ainda não preenchido. Recomenda-se revisar esses casos antes de utilizar os resultados para decisões pedagógicas.`});
  if(!recomendacoes.length) recomendacoes.push({titulo:'Preservar e compartilhar boas práticas',texto:'A turma apresenta avaliações completas e bom desempenho. Selecione exemplos autorizados de entregas bem-sucedidas para apoiar futuras ofertas da atividade.'});
  const resumoDesempenho = media>=9 ? 'O desempenho global foi elevado e consistente.' : media>=8 ? 'O desempenho global foi positivo, com espaço para aperfeiçoamentos pontuais.' : media>=6 ? 'O desempenho foi intermediário e indica oportunidades claras de reforço pedagógico.' : 'O desempenho global requer atenção e revisão das orientações e dos apoios oferecidos.';
  const resumoPendencias = pendentes ? `${pendentes} de ${turmaCache.length} avaliação(ões) ainda apresentam critérios pendentes; por isso, os indicadores devem ser interpretados como parciais.` : 'Todas as avaliações possuem os quatro critérios preenchidos, permitindo uma leitura consolidada da turma.';
  const barrasCriterios=criterios.map(c=>`<div class="chart-row"><div><strong>${escaparHtml(c.label)}</strong><small>${c.qtd?`Média ${c.media.toFixed(2)} de ${c.max} · ${c.qtd} avaliação(ões)`:'Sem avaliações concluídas'}</small></div><div class="track"><i style="width:${Math.min(100,c.pct)}%"></i></div><b>${c.qtd?`${c.pct}%`:'—'}</b></div>`).join('');
  const barrasFaixas=faixas.map(f=>`<div class="distribution"><div class="column"><i style="height:${Math.max(4,Math.round(f.qtd/turmaCache.length*150))}px;background:${f.cor}"></i><b>${f.qtd}</b></div><span>${f.label}</span></div>`).join('');
  const linhasAlunos=[...turmaCache].sort((a,b)=>(b.total||0)-(a.total||0)).map((a,i)=>{const p=ORDEM.filter(c=>a.scores?.[c]===null||a.scores?.[c]===undefined).length;return `<tr><td>${i+1}</td><td><strong>${escaparHtml(a.nome||'Sem nome')}</strong></td><td>${escaparHtml(a.matricula||'—')}</td><td><span class="grade">${Number(a.total||0).toFixed(1)}</span></td><td>${p?`<span class="pending">${p} pendente(s)</span>`:'Completa'}</td></tr>`}).join('');
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório executivo - ${escaparHtml(turma?.nome||'Turma')}</title><style>
  :root{--navy:#173f5f;--blue:#246b91;--sky:#eaf3f8;--ink:#243746;--muted:#667987;--line:#d8e3e9;--green:#36865b;--amber:#b78022;--red:#a94a4a}*{box-sizing:border-box}body{margin:0;background:#eef2f4;color:var(--ink);font:15px/1.62 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}.page{max-width:1000px;margin:28px auto;background:#fff;box-shadow:0 12px 40px #18394d22}.hero{background:linear-gradient(135deg,var(--navy),#256f92);color:#fff;padding:52px 58px 46px;position:relative;overflow:hidden}.hero:after{content:"";position:absolute;width:260px;height:260px;border:46px solid #ffffff10;border-radius:50%;right:-80px;top:-100px}.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:11px;font-weight:800;opacity:.82}.hero h1{font-size:34px;line-height:1.14;margin:12px 0 8px;max-width:680px}.hero .course{font-size:17px;opacity:.94}.hero-meta{display:flex;gap:28px;margin-top:30px;font-size:12px;opacity:.85}.content{padding:42px 58px 56px}.actions{position:fixed;right:22px;top:20px;border:0;border-radius:8px;padding:11px 16px;background:var(--navy);color:#fff;font-weight:700;cursor:pointer;box-shadow:0 4px 16px #0003}h2{font-size:22px;color:var(--navy);margin:40px 0 16px;padding-bottom:9px;border-bottom:2px solid var(--sky)}h3{font-size:16px;color:var(--navy);margin:0 0 6px}p{margin:0 0 13px}.lead{font-size:17px;line-height:1.7;color:#344e60}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0}.kpi{border:1px solid var(--line);border-top:4px solid var(--blue);border-radius:9px;padding:16px;background:#fff}.kpi .value{font-size:29px;line-height:1;font-weight:800;color:var(--navy)}.kpi .label{font-size:12px;color:var(--muted);margin-top:7px}.callout{background:var(--sky);border-left:5px solid var(--blue);border-radius:7px;padding:17px 20px;margin:20px 0}.chart-card{border:1px solid var(--line);border-radius:10px;padding:20px;margin:14px 0;break-inside:avoid}.chart-row{display:grid;grid-template-columns:300px 1fr 55px;gap:15px;align-items:center;margin:16px 0}.chart-row small{display:block;color:var(--muted);margin-top:2px}.track{height:14px;background:#e8eef2;border-radius:10px;overflow:hidden}.track i{display:block;height:100%;border-radius:10px;background:linear-gradient(90deg,var(--blue),#49a2c5)}.distribution-wrap{display:flex;align-items:flex-end;justify-content:space-around;height:220px;border-bottom:1px solid var(--line);padding:0 25px}.distribution{width:22%;text-align:center}.column{height:175px;display:flex;flex-direction:column-reverse;align-items:center}.column i{display:block;width:58px;border-radius:7px 7px 0 0}.column b{margin-bottom:6px;font-size:18px}.distribution span{display:block;font-size:12px;color:var(--muted);margin-top:9px}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}.insight{border:1px solid var(--line);border-radius:9px;padding:17px;break-inside:avoid}.insight strong{display:block;color:var(--navy);font-size:20px}.recommendation{display:grid;grid-template-columns:38px 1fr;gap:13px;margin:15px 0;padding:16px;border:1px solid var(--line);border-radius:9px;break-inside:avoid}.recommendation .n{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--navy);color:#fff;font-weight:800}table{width:100%;border-collapse:collapse;font-size:13px}th{background:var(--navy);color:#fff;text-align:left;padding:10px}td{padding:10px;border-bottom:1px solid var(--line)}tr:nth-child(even) td{background:#f7fafb}.grade{font-weight:800;color:var(--navy)}.pending{color:var(--red);font-weight:700}.method{font-size:12px;color:var(--muted);background:#f6f8f9;padding:16px;border-radius:8px}.footer{margin-top:34px;padding-top:16px;border-top:1px solid var(--line);display:flex;justify-content:space-between;color:var(--muted);font-size:11px}
  @page{size:A4;margin:14mm}@media print{body{background:#fff}.page{margin:0;max-width:none;box-shadow:none}.actions{display:none}.hero{padding:34px 38px}.content{padding:28px 38px}.chart-card,.kpi,.insight,.recommendation{break-inside:avoid}h2{break-after:avoid}.page-break{break-before:page}}@media(max-width:760px){.page{margin:0}.hero,.content{padding:28px 22px}.kpis,.two-col{grid-template-columns:1fr 1fr}.chart-row{grid-template-columns:1fr}.actions{position:static;margin:10px}.hero-meta{display:block}.hero-meta span{display:block;margin-top:4px}}
  </style></head><body><button class="actions" onclick="window.print()">Imprimir / Salvar em PDF</button><main class="page"><header class="hero"><div class="eyebrow">IFSC · TEDPRO · Avaliação da aprendizagem</div><h1>Relatório Executivo<br>P4 — Produção de Podcast</h1><div class="course">${escaparHtml(turma?.nome||'Turma')}</div><div class="hero-meta"><span>Gerado em ${new Date().toLocaleString('pt-BR')}</span><span>${turmaCache.length} estudante(s) registrado(s)</span><span>Documento atualizável</span></div></header><div class="content">
  <section><h2>Resumo executivo</h2><p class="lead">Este relatório consolida os resultados da atividade P4 — Produção de Podcast da turma <strong>${escaparHtml(turma?.nome||'Turma')}</strong>. Foram consideradas ${turmaCache.length} avaliações salvas, com média geral de <strong>${media.toFixed(1)}</strong> e mediana de <strong>${mediana.toFixed(1)}</strong>, em uma escala de zero a dez.</p><p>${escaparHtml(resumoDesempenho)} ${escaparHtml(resumoPendencias)}</p><div class="callout"><strong>Leitura recomendada.</strong> Os resultados devem ser interpretados em conjunto com os critérios pendentes e com a escuta humana dos podcasts. Indicadores automáticos apoiam a correção, mas não substituem o julgamento docente sobre edição, efeitos e qualidade sonora.</div></section>
  <section><h2>Indicadores principais</h2><div class="kpis"><div class="kpi"><div class="value">${turmaCache.length}</div><div class="label">avaliações registradas</div></div><div class="kpi"><div class="value">${media.toFixed(1)}</div><div class="label">média geral da turma</div></div><div class="kpi"><div class="value">${conclusaoPct}%</div><div class="label">avaliações completas</div></div><div class="kpi"><div class="value">${iaPct}%</div><div class="label">declararam uso de IA</div></div></div><p>As notas variaram entre <strong>${menorNota.toFixed(1)}</strong> e <strong>${maiorNota.toFixed(1)}</strong>. ${dentroDuracao} de ${turmaCache.length} registros apresentaram duração confirmada dentro do intervalo de 2 a 5 minutos.</p></section>
  <section><h2>Desempenho por critério</h2><p>O gráfico apresenta o aproveitamento médio proporcional à pontuação máxima de cada critério, permitindo comparar dimensões com pesos diferentes.</p><div class="chart-card">${barrasCriterios}</div>${maisForte&&maisFraco?`<div class="two-col"><div class="insight"><span>Maior aproveitamento</span><strong>${maisForte.pct}%</strong><p>${escaparHtml(maisForte.label)}</p></div><div class="insight"><span>Principal oportunidade</span><strong>${maisFraco.pct}%</strong><p>${escaparHtml(maisFraco.label)}</p></div></div>`:''}</section>
  <section><h2>Distribuição das notas</h2><p>A distribuição mostra a concentração de resultados por faixa e ajuda a identificar dispersão ou necessidade de apoio adicional.</p><div class="chart-card"><div class="distribution-wrap">${barrasFaixas}</div></div></section>
  <section class="page-break"><h2>Padrões e alertas observados</h2>${alertas.length?`<p>Os alertas abaixo foram os mais recorrentes nos registros da turma. A frequência não representa necessariamente gravidade, mas sinaliza pontos que merecem atenção nas próximas orientações.</p><div class="two-col">${alertas.map(([a,n])=>`<div class="insight"><strong>${n} ocorrência${n===1?'':'s'}</strong><p>${escaparHtml(a)}</p></div>`).join('')}</div>`:'<div class="callout">Não foram registrados alertas recorrentes nesta turma.</div>'}</section>
  <section><h2>Recomendações pedagógicas</h2><p>As recomendações a seguir derivam dos resultados agregados e devem ser combinadas com a experiência do professor e o contexto da oferta.</p>${recomendacoes.map((r,i)=>`<div class="recommendation"><div class="n">${i+1}</div><div><h3>${escaparHtml(r.titulo)}</h3><p>${escaparHtml(r.texto)}</p></div></div>`).join('')}</section>
  <section class="page-break"><h2>Resultados individuais</h2><p>A tabela facilita o acompanhamento da turma e a identificação de registros que ainda precisam de revisão.</p><table><thead><tr><th>#</th><th>Estudante</th><th>Matrícula</th><th>Nota</th><th>Situação</th></tr></thead><tbody>${linhasAlunos}</tbody></table></section>
  <section><h2>Notas metodológicas</h2><div class="method"><p><strong>Fonte dos dados:</strong> avaliações salvas no aplicativo para a turma selecionada.</p><p><strong>Cálculo:</strong> média e mediana utilizam as notas registradas no momento da geração. O desempenho por critério é apresentado como percentual da pontuação máxima e considera apenas registros preenchidos naquele critério.</p><p><strong>Limitações:</strong> avaliações pendentes tornam os resultados parciais. Duração, transcrição e métricas objetivas não substituem a escuta docente dos elementos sonoros.</p><p><strong>Atualização:</strong> novas entregas e correções podem ser adicionadas à turma; gere novamente o relatório para obter uma versão atualizada.</p></div></section>
  <footer class="footer"><span>Relatório Executivo — P4 Podcast · TEDPRO/IFSC</span><span>${escaparHtml(turma?.nome||'Turma')}</span></footer></div></main></body></html>`;
  const janela=window.open('','_blank');
  if(!janela){ alert('O navegador bloqueou a nova janela. Permita pop-ups para este endereço e tente novamente.'); return; }
  janela.document.open(); janela.document.write(html); janela.document.close();
}

initApp();
