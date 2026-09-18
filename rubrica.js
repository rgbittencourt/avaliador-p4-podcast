// Rubrica oficial da atividade P4 (Podcast) - TEDPRO/IFSC.
// IMPORTANTE: esta é a cópia usada pelo SERVIDOR (para montar o prompt da IA).
// Existe uma cópia igual em public/app.js (usada pela TELA, para desenhar os
// critérios e calcular a nota). Se um dia editar o texto da rubrica, edite as
// duas — não há um único lugar automático hoje porque a tela é só HTML/JS puro,
// sem empacotador. Fica à vontade para ligar as duas via um build step no
// Codex, se quiser.

const RUBRICA = {
  roteiro: {
    label: "Elaboração do roteiro",
    max: 2,
    niveis: [
      {pontos:0, desc:"Não apresentou o roteiro, ou o roteiro não está condizente com o podcast produzido ou precisa de muitas melhorias."},
      {pontos:1, desc:"O roteiro não tem início, meio e fim, ou não indica os diferentes momentos e efeitos do podcast (se houver)."},
      {pontos:2, desc:"O roteiro tem início, meio e fim, e indica os diferentes momentos e efeitos do podcast (se houver)."}
    ]
  },
  adequacao: {
    label: "Adequação do podcast ao desafio e ao público-alvo",
    max: 1,
    niveis: [
      {pontos:0, desc:"Não apresentou o podcast, ou não apresentou o desafio e o público-alvo, ou o podcast não é adequado ao desafio ou ao público-alvo."},
      {pontos:0.5, desc:"O desafio e o público-alvo foram apresentados, mas o podcast é pouco adequado a eles."},
      {pontos:1, desc:"O desafio e o público-alvo foram apresentados e o podcast é adequado a eles."}
    ]
  },
  producao: {
    label: "Produção do podcast",
    max: 4,
    niveis: [
      {pontos:0, desc:"Não apresentou o podcast, ou o podcast precisa de muitas melhorias."},
      {pontos:2, desc:"O podcast não tem duração de 2 a 5 minutos e/ou não contempla o que foi previsto no roteiro, mesmo apresentando todos os elementos: efeitos sonoros; áudio de boa qualidade; edição de boa qualidade."},
      {pontos:3, desc:"O podcast tem duração de 2 a 5 minutos, mas deixou de apresentar ao menos um dos seguintes elementos: efeitos sonoros; áudio de boa qualidade; edição de boa qualidade."},
      {pontos:4, desc:"O podcast tem duração de 2 a 5 minutos, efeitos sonoros, boa qualidade de áudio e boa qualidade de edição."}
    ]
  },
  relato: {
    label: "Relato da elaboração do podcast",
    max: 3,
    niveis: [
      {pontos:0, desc:"Não apresentou o relato ou o podcast, ou as informações apresentadas não são compreensíveis a respeito da experiência de elaboração do recurso."},
      {pontos:1, desc:"As informações apresentadas a respeito da experiência na elaboração do podcast são insuficientes para compreender completamente o caminho e as etapas do estudante na elaboração da atividade."},
      {pontos:2, desc:"O estudante relatou sua experiência na elaboração do podcast, permitindo compreender os desafios enfrentados e o caminho percorrido, mas descreveu de forma vaga ou omissa a superação dos desafios ou se suas expectativas em relação ao produto final foram atingidas."},
      {pontos:3, desc:"O estudante relatou sua experiência na elaboração do podcast de forma clara e detalhada, sendo possível compreender perfeitamente os desafios enfrentados, como os superou e se suas expectativas em relação ao produto final foram atingidas."}
    ]
  }
};

const ORDEM = ["roteiro","adequacao","producao","relato"];

module.exports = { RUBRICA, ORDEM };
