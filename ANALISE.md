# Análise técnica e funcional

## Escopo confirmado nos documentos oficiais

A atividade P4 avalia um podcast individual de 2 a 5 minutos, alinhado ao desafio e ao público-alvo do estudante. A nota total é 10 pontos: roteiro (2), adequação (1), produção (4) e relato (3). A avaliação de produção exige julgamento humano de efeitos sonoros, clareza e edição; métricas e transcrição servem como evidência auxiliar, não como substituto da escuta.

## Estado da aplicação

A base recebida já implementava importação de relatório PDF, leitura de hyperlinks, reprodução de arquivo local, métricas de áudio, transcrição, sugestão assistida por IA, rubrica manual, feedback, cadastro de turma e exportação JSON/CSV.

## Melhorias aplicadas nesta versão

- dependência de upload corrigida para uma versão publicável;
- limite de transcrição alinhado a 25 MB, com mensagem de erro clara;
- filtro de tipo para uploads de áudio/vídeo;
- endpoint de saúde em `/api/health`;
- validação básica de registros da turma;
- gravação atômica do arquivo da turma para reduzir risco de corrupção;
- proteção contra links perigosos e conteúdo HTML injetado na lista de alunos;
- transcrição por arquivo público do Google Drive, além do upload local;
- tratamento explícito do Spotify como fonte de reprodução, sem captura ou download indevido;
- critério de produção deixado pendente quando não existem evidências do áudio;
- múltiplas turmas nomeadas, reabertas e editáveis, com migração do cadastro antigo;
- relatório executivo gerado sob demanda, com gráficos, insights e sugestões pedagógicas;
- rubrica, observações por critério, alertas manuais e feedback editáveis, com proteção contra sobrescrita acidental;
- servidor exportável para testes e testes automatizados das regras centrais;
- documentação de instalação, privacidade, limites e roteiro de evolução.

## Limites conhecidos

- a extração de PDF depende do layout do template e deve ser revisada pelo avaliador;
- transcrição não mede dicção, trilha, efeitos ou qualidade de edição;
- o armazenamento em JSON é adequado para uso local por uma pessoa, não para uso simultâneo;
- publicação na internet exigirá autenticação, autorização, banco transacional, logs e política institucional de dados;
- a rubrica ainda aparece no servidor e na interface; testes de consistência ou um endpoint único de rubrica são a próxima melhoria arquitetural.

## Próxima fase recomendada

Validar o fluxo com 5 a 10 entregas reais, registrar divergências de extração e de sugestão, e só então evoluir para autenticação multiusuário e implantação institucional.
