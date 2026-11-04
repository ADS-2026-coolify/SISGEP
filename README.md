# SISGEP

Sistema de Gestão de Pátios para administrar veículos apreendidos pelo Detran,
bancos e particulares. O projeto contém uma API Django e uma interface React,
servidas juntas pelo mesmo container.

## Executar localmente

1. Copie `.env.example` para `.env` na raiz do projeto.
2. Gere valores diferentes para `SECRET_KEY` e `POSTGRES_PASSWORD`; não use os
   valores de exemplo.
3. Inicie os serviços com `docker compose up --build`.
4. Acesse `http://localhost:8000`.

O Compose mantém os dados do PostgreSQL e os arquivos enviados em volumes
persistentes. Não apague esses volumes se precisar preservar os dados.

## Deploy no Coolify

1. Crie um recurso **Docker Compose** apontando para este repositório, branch
   `main` e arquivo `compose.yaml` (contexto de build na raiz).
2. Configure o domínio público no serviço `app`, usando a porta de container
   `8000`; não publique o serviço `db`.
3. Cadastre no ambiente do recurso as variáveis abaixo. Gere segredos próprios
   e nunca os coloque no Git:

   - `SECRET_KEY`: chave Django aleatória, exclusiva para produção.
   - `POSTGRES_PASSWORD`: senha forte do banco.
   - `ALLOWED_HOSTS`: domínio do app, sem `https://`.
   - `FRONTEND_URL`: URL completa do app, por exemplo `https://sisgep.exemplo.com`.

4. Preserve os volumes `postgres_data` e `app_media` entre deploys.
5. Se habilitar envio de e-mail ou Cloudinary, configure também as respectivas
   variáveis `USE_BREVO`/`BREVO_API_KEY` ou `USE_CLOUDINARY`/`CLOUDINARY_URL`.

O Compose configura `DEBUG=False`, monta a URL do banco a partir de
`POSTGRES_PASSWORD` e executa as migrações ao iniciar a aplicação. Os arquivos
`.env`, bancos locais, dumps de banco e configurações pessoais do editor são
ignorados pelo Git.
