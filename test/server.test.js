const test = require('node:test');
const assert = require('node:assert/strict');
const { montarPrompt, montarPromptCoerencia, limparSaidaCoerencia, pontoMaisProximo, pontuarProducaoPorEvidencia, hostDownloadDrivePermitido } = require('../server');

test('aceita os domínios oficiais usados no download do Google Drive', () => {
  assert.equal(hostDownloadDrivePermitido('drive.google.com'), true);
  assert.equal(hostDownloadDrivePermitido('drive.usercontent.google.com'), true);
  assert.equal(hostDownloadDrivePermitido('doc-00-00-sheets.googleusercontent.com'), true);
  assert.equal(hostDownloadDrivePermitido('drive.usercontent.google.com.exemplo.com'), false);
  assert.equal(hostDownloadDrivePermitido('exemplo.com'), false);
});

test('normaliza pontuações para os valores oficiais da rubrica', () => {
  assert.equal(pontoMaisProximo('adequacao', 0.6), 0.5);
  assert.equal(pontoMaisProximo('producao', 3.8), 4);
  assert.equal(pontoMaisProximo('relato', 2), 2);
});

test('pontua produção apenas com a evidência objetiva disponível', () => {
  assert.deepEqual(pontuarProducaoPorEvidencia({linkPodcast:'https://open.spotify.com/episode/abc', duracao:'02:47'}).pontos, 3);
  assert.deepEqual(pontuarProducaoPorEvidencia({linkPodcast:'https://open.spotify.com/episode/abc', duracao:'05:01'}).pontos, 2);
  assert.deepEqual(pontuarProducaoPorEvidencia({linkPodcast:'', duracao:'02:47'}).pontos, 0);
  assert.equal(pontuarProducaoPorEvidencia({linkPodcast:'https://open.spotify.com/episode/abc', duracao:''}), null);
});

test('prompt diferencia roteiro, transcrição e limites da análise automática', () => {
  const prompt = montarPrompt({
    desafio: 'Como apoiar estudantes?',
    publicoAlvo: 'Docentes',
    roteiro: 'Abertura, desenvolvimento e encerramento',
    transcricao: 'Conteúdo efetivamente falado',
    metricasAudio: { duracaoSeg: 180, volumeMedioDb: -18, picoDb: -1, silencioPct: 8, clipping: false }
  });
  assert.match(prompt, /TRANSCRIÇÃO DO QUE FOI FALADO/);
  assert.match(prompt, /não pode avaliar dicção/i);
  assert.match(prompt, /duração 3:00/);
  assert.match(prompt, /Retorne sempre null em "producao"/);
});

test('prompt de coerência mantém as novas saídas independentes da rubrica', () => {
  const prompt = montarPromptCoerencia({
    nome:'Ana Silva', desafio:'Baixa participação', publicoAlvo:'Docentes',
    diretrizes:'Linguagem acessível', roteiro:'Apresentar causas e estratégias', contribuicao:'Apoiar reflexão'
  });
  assert.match(prompt, /UMA análise semântica estruturada/);
  assert.match(prompt, /não atribua nota, pontos/i);
  assert.match(prompt, /analise_coerencia/);
  assert.match(prompt, /feedback_coerencia/);
  assert.match(prompt, /Prof\. Rogério/);
});

test('saída de coerência exige dois textos e normaliza a assinatura', () => {
  const saida = limparSaidaCoerencia({analise_coerencia:'Parecer técnico.', feedback_coerencia:'Ana, vale refletir.\n\nUm abraço,\nProf. Rogério'});
  assert.equal(saida.analise_coerencia, 'Parecer técnico.');
  assert.match(saida.feedback_coerencia, /Um abraço,\nProf\. Rogério$/);
  assert.throws(()=>limparSaidaCoerencia({analise_coerencia:'Só um texto'}));
});
