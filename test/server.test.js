const test = require('node:test');
const assert = require('node:assert/strict');
const { montarPrompt, pontoMaisProximo, pontuarProducaoPorEvidencia } = require('../server');

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
