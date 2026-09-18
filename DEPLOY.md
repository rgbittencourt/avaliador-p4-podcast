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

## Backup

Use regularmente **Exportar turma (JSON)**. Esse arquivo permite restaurar avaliações mesmo se o serviço de hospedagem for substituído.
