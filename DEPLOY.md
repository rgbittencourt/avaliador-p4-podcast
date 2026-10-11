# Publicação e acesso em qualquer dispositivo

O aplicativo contém dados acadêmicos e uma chave da OpenAI. Em produção, use sempre HTTPS, senha de acesso e armazenamento persistente.

## Docker

O projeto inclui `Dockerfile` e `docker-compose.yml`. Configure no serviço de hospedagem:

- `OPENAI_API_KEY`: chave da OpenAI;
- `APP_USERNAME`: nome de acesso, por exemplo `professor`;
- `APP_PASSWORD`: senha forte e exclusiva;
- `DATA_DIR`: diretório montado em armazenamento persistente, normalmente `/app/data`;
- `NODE_ENV`: `production`.

O serviço deve expor a porta definida em `PORT` e montar um volume persistente em `/app/data`. Sem volume, as turmas podem desaparecer quando o servidor reiniciar.

## Acesso

Depois de hospedado, o provedor fornecerá uma URL HTTPS. Essa mesma URL funciona em computadores, celulares e tablets. O navegador solicitará o usuário e a senha configurados.

## Implantação no Render

O arquivo `render.yaml` configura automaticamente o contêiner, o endereço HTTPS,
o teste de saúde e o plano gratuito. No painel do Render:

O nome configurado para o serviço é `avaliador-podcast`, portanto o endereço
pretendido é `https://avaliador-podcast.onrender.com` (se estiver disponível).

1. crie um **Blueprint** usando este repositório privado;
2. crie um banco PostgreSQL gratuito na Neon e copie a connection string;
3. informe `DATABASE_URL`, `APP_PASSWORD` e `OPENAI_API_KEY` como segredos;
4. revise e implante usando o plano **Free**.

Sem `DATABASE_URL`, o Render gratuito perderá as turmas ao suspender ou reiniciar
o serviço. No computador local, o aplicativo continua usando `data/turmas.json`.

## Backup

Use regularmente **Exportar turma (JSON)**. Esse arquivo permite restaurar avaliações mesmo se o serviço de hospedagem for substituído.

## Backup privado no GitHub

O aplicativo pode atualizar automaticamente um JSON separado, seguindo o
mesmo princípio do `PWA-Painel-Correcao-P1-dados`. O Neon continua sendo o
banco principal; o GitHub funciona como histórico e cópia de segurança.

Configure no Render:

- `GITHUB_DATA_OWNER=rgbittencourt`
- `GITHUB_DATA_REPO=avaliador-podcast-dados`
- `GITHUB_DATA_BRANCH=main`
- `GITHUB_DATA_PATH=dados/turmas.json`
- `GITHUB_DATA_TOKEN`: token fine-grained com acesso somente a esse repositório
  e permissão **Contents: Read and write**.

Nunca coloque esse token no código, no manifesto PWA ou no navegador. O
repositório de dados deve permanecer privado por conter nomes, matrículas,
notas e feedbacks. Após configurar, use **Salvar cópia no GitHub** na seção
Turma para fazer a primeira sincronização.
