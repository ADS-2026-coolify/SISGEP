# SISGEP
O SISGEP (SIStema de GEstão de Pátios) é um sistema que permite que pátios gerenciem seus veículos com foco em veículos apreendidos pelo Detran, Bancos e Particulares.

## Deploy separado no Render

Configure o frontend como **Static Site**, com diretório raiz `SISGEP.web`, comando de build `npm ci && npm run build` e diretório publicado `dist`. Defina `VITE_API_URL` como a URL pública da API terminada em `/api/auth/`. O Vite usa `/` como base dos arquivos estáticos nesse deploy; não defina `VITE_ASSET_BASE`.

No backend, permita o domínio do frontend em `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS`.

## Exportação de relatórios

As telas **Extrato Financeiro**, **Todos os Registros** e **Relatório de Leilão** exportam arquivos `.xlsx` formatados, com título, data de geração, resumo, cabeçalhos destacados, filtros e larguras adequadas para leitura. As planilhas incluem os dados correspondentes à busca e aos filtros aplicados na tela, quando disponíveis.
