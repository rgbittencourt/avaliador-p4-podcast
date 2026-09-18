# Avaliador P4 · Podcast (TEDPRO/IFSC)

App local (roda no seu computador) para avaliar a atividade P4 (produção de
podcast) do TEDPRO contra a rubrica oficial: importa o relatório em PDF (lendo
até o hyperlink real do podcast, não só o texto), toca/analisa o áudio,
sugere pontuação por IA (com sua própria chave da OpenAI), transcreve o
podcast automaticamente e gera o texto de feedback no seu padrão de sempre.

Este projeto nasceu como um protótipo em Claude e foi convertido para rodar
de forma independente, com a sua própria chave de API — pensado para você
continuar evoluindo no Codex.

## Como rodar

Pré-requisito: [Node.js](https://nodejs.org) 18 ou mais recente instalado.

```bash
npm install
cp .env.example .env
# edite o .env e cole sua chave da OpenAI (OPENAI_API_KEY=sk-...)
npm start
```

Abra `http://localhost:3000` no navegador.

Sem uma chave da OpenAI configurada, a tela funciona normalmente para
preencher a rubrica manualmente e gerar o feedback — só a sugestão de
pontuação por IA e a transcrição automática exigem a chave.

## O que o app faz

- **Importa o PDF do relatório do aluno** direto no navegador (pdf.js, sem
  depender de nenhum servidor externo) — extrai nome, matrícula, roteiro,
  relato, declaração de uso de IA, e o **link real do podcast** (lido do
  hyperlink embutido no PDF, não só do texto impresso, que pode estar
  truncado ou desatualizado).
- **Toca o podcast**: incorpora o player oficial do Spotify e captura a duração
  total informada pelo player; outros links abrem em nova aba. Arquivos locais
  podem ser tocados e analisados dentro da própria ferramenta.
- **Mede o áudio localmente**: volume médio, picos/estouro e proporção de
  silêncio, direto no navegador (Web Audio API), sem enviar o arquivo a
  lugar nenhum.
- **Transcreve o podcast automaticamente** (rotas `/api/transcrever` e
  `/api/transcrever-link`, usando a API de áudio da OpenAI) a partir de um
  arquivo local ou de um arquivo público no Google Drive — o texto
  cai na caixa de transcrição, que alimenta a sugestão de IA com o que foi
  realmente falado, para comparar com o roteiro planejado.
- **Sugere pontuação por IA** (rota `/api/suggest-scores`) para os 4
  critérios da rubrica, com justificativa, a partir do relatório, das
  métricas de áudio e da transcrição (quando houver). A sugestão é só um
  rascunho — a decisão final é sempre sua.
- **Gera o texto de feedback** no seu padrão de sempre, a partir da nota
  final. A seleção da rubrica, as observações por critério, os alertas manuais
  e o próprio texto do feedback são editáveis. Enquanto o feedback não tiver
  edição manual, ele acompanha automaticamente as alterações da avaliação;
  depois de editado, o texto é preservado até você confirmar a atualização.
- **Mantém várias turmas nomeadas** salvas localmente em `data/turmas.json`.
  Cada turma pode ser reaberta, renomeada e receber avaliações novas ou
  alteradas, inclusive depois da emissão de um relatório. A exclusão integral
  exige digitar exatamente o nome da turma e remove permanentemente todos os
  dados e avaliações vinculados a ela.
- **Gera relatório executivo sob demanda** com indicadores, gráficos de
  desempenho, distribuição das notas, alertas recorrentes, insights,
  recomendações pedagógicas e resultados individuais. O relatório abre em
  uma página pronta para imprimir ou salvar como PDF.

## Estrutura do projeto

```
├── server.js        # servidor Express: serve a página e fala com a OpenAI
├── rubrica.js        # rubrica oficial (cópia usada pelo servidor)
├── db.js              # persistência simples das turmas (data/turmas.json)
├── public/
│   ├── index.html    # página (marcação + estilo)
│   └── app.js         # toda a lógica da tela (rubrica, PDF, áudio, turma...)
├── data/
│   ├── turma.json     # formato antigo, migrado automaticamente se existir
│   └── turmas.json    # turmas nomeadas e respectivas avaliações
├── .env.example
└── package.json
```

## Privacidade

- O PDF é lido inteiramente no navegador — o arquivo em si nunca é enviado
  a lugar nenhum.
- Só os **campos de texto já extraídos** (roteiro, relato, etc.) e as
  **métricas objetivas do áudio** são enviados à API da OpenAI quando você
  pede uma sugestão de pontuação.
- O **áudio do podcast** só é enviado à OpenAI quando você aperta
  "Transcrever automaticamente" — nesse caso o arquivo de áudio é enviado
  à API de transcrição da OpenAI (sujeito à política de privacidade deles).
- Um link do Spotify serve para reprodução e conferência manual. O Spotify
  não fornece o áudio completo para download/transcrição; o aplicativo não
  tenta contornar essa restrição. Sem arquivo ou transcrição, a IA deixa o
  critério de produção sem sugestão para o professor decidir após ouvir.
- As turmas ficam em `data/turmas.json`, no computador local ou no volume
  persistente configurado na hospedagem.

## Continuando no Codex

O projeto é Node.js puro (Express + `fetch` nativo, sem framework de
frontend) — qualquer agente de código consegue ler e estender. Algumas
ideias de próximos passos, se quiser pedir ao Codex:

- Trocar `data/turmas.json` por SQLite se a base crescer muito ou for usar
  em mais de um computador.
- Hospedar o app em um servidor de verdade (hoje ele foi pensado para rodar
  só na sua máquina — hospedar publicamente exige cuidado extra com a
  chave da API e com autenticação de acesso).
- Adicionar o relatório executivo em DOCX com gráficos, a partir da turma
  salva.

## Rodar em qualquer dispositivo

Para acesso por computador, celular e tablet, hospede o contêiner Docker em
um serviço com HTTPS e volume persistente. A mesma URL funcionará em todos os
navegadores. Em produção, o servidor exige `APP_PASSWORD` e protege a interface
com autenticação. Consulte [DEPLOY.md](DEPLOY.md) para variáveis, volume e backup.

A configuração de nuvem está pronta em `render.yaml`. Ela cria um serviço web
protegido por senha e mantém as turmas em um disco persistente.
