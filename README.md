# Sistema de Restaurante

Backend em **Laravel 12** (API REST com JWT) e frontend em **React 19 + Vite + TypeScript**.

## Executar com Docker

```bash
cp .env.example .env            # credenciais do MySQL usadas pelo compose
docker compose up -d --build
docker compose exec app php artisan db:seed   # cria empresa e usuário admin
```

- Frontend: http://localhost:3000
- API: http://localhost:8000/api

O container `app` instala as dependências, gera `APP_KEY`/`JWT_SECRET` (se ausentes) e roda as migrations ao iniciar.

## Executar localmente

```bash
# Backend
cd backend
cp .env.example .env            # ajuste DB_*
composer install
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
php artisan serve --port=8000

# Frontend
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

Usuário inicial (seeder): `admin` / `admin123`. Troque a senha após o primeiro acesso
(configurável por `SEED_ADMIN_USERNAME` e `SEED_ADMIN_PASSWORD`).

## Segurança e permissões

- **Autenticação**: JWT (`Authorization: Bearer`). Login limitado a 5 tentativas/minuto por usuário+IP.
  O logout invalida o token.
- **Empresa (multi-tenant)**: todo dado é filtrado pela empresa ativa do usuário. Usuário inativo,
  vínculo desativado ou empresa inativa perdem o acesso imediatamente, mesmo com token válido.
- **Telas (módulos)**: `produtos`, `vendas`, `caixa`, `gestao_relatorio`, `gestao_equipe`.
  - Perfis `ADMIN`/`MASTER` acessam todos os módulos.
  - Perfil `USER` acessa apenas as telas atribuídas na Gestão de Equipe.
  - Um `USER` com acesso à Gestão de Equipe não pode criar, editar ou desativar administradores.
- **Administração da plataforma** (`/api/admin/*`: empresas, vínculos e telas): somente usuários `is_master`.

## Testes

```bash
cd backend && php artisan test
cd frontend && npm run build
```
