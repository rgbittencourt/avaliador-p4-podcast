const test = require('node:test');
const assert = require('node:assert/strict');
const { montarPrompt, montarPromptCoerencia, limparSaidaCoerencia, pontoMaisProximo, pontuarProducaoPorEvidencia } = require('../server');

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
  const coerencia = {
    relacao_desafio_publico:'Relação clara.', adequacao_publico:'Linguagem adequada.',
    relacao_desafio_roteiro:'Roteiro relacionado.', relacao_diretrizes_roteiro:'Diretrizes concretizadas.',
    contribuicao_para_desafio:'Contribuição explicitada.', consistencia_global:'Conjunto consistente.',
    pontos_fortes:['Foco'], tensoes:[], desalinhamentos:[], informacoes_insuficientes:[]
  };
  const saida = limparSaidaCoerencia({coerencia, analise_coerencia:'Parecer técnico.', feedback_coerencia:'Ana, vale refletir.\n\nUm abraço,\nProf. Rogério'});
  assert.equal(saida.analise_coerencia, 'Parecer técnico.');
  assert.match(saida.feedback_coerencia, /Um abraço,\nProf\. Rogério$/);
  assert.throws(()=>limparSaidaCoerencia({coerencia, analise_coerencia:'Só um texto'}));
  assert.throws(()=>limparSaidaCoerencia({analise_coerencia:'Parecer.', feedback_coerencia:'Feedback.'}), /estruturada/);
  assert.throws(()=>limparSaidaCoerencia({coerencia, analise_coerencia:'Texto igual.', feedback_coerencia:' texto   igual. '}), /mesmo texto/);
});

test('prompt cobre tensões de público, contradições e campos ausentes sem alterar a rubrica', () => {
  const prompt = montarPromptCoerencia({
    desafio:'Combater desinformação', publicoAlvo:'Especialistas e público geral',
    diretrizes:'Usar analogias', roteiro:'Sequência técnica sem contextualização', contribuicao:''
  });
  assert.match(prompt, /público amplo ou heterogêneo não é automaticamente um problema/i);
  assert.match(prompt, /o que as diretrizes prometem com o que o roteiro sustenta/i);
  assert.match(prompt, /Contribuição declarada para o desafio: \(campo vazio\)/);
  assert.match(prompt, /parecer integrado, não uma lista/i);
  assert.doesNotMatch(prompt, /RUBRICA OFICIAL/);
});

test('prompt de coerência distingue planejamento de produto efetivamente analisado', () => {
  const semAudio = montarPromptCoerencia({roteiro:'Explicar conceitos com exemplos'});
  assert.match(semAudio, /Não há transcrição nem acesso ao áudio/);
  assert.match(semAudio, /nunca "no podcast você faz"/);

  const comTranscricao = montarPromptCoerencia({
    roteiro:'Explicar conceitos com exemplos', transcricao:'O episódio apresentou dois exemplos.'
  });
  assert.match(comTranscricao, /conteúdo efetivamente falado/);
  assert.match(comTranscricao, /sem inferir qualidade sonora, dicção, efeitos ou edição/i);
});
