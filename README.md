# Passagem de Plantao

**Gestao Inteligente de CTI**

Sistema web para acompanhamento assistencial do CTI com foco em mapa de leitos, ficha clinica completa do paciente, analytics operacionais e administracao de profissionais, mantendo dados em memoria nesta etapa inicial.

## Estrutura

```text
cti-app/
|-- backend/
|   |-- package.json
|   `-- src/
|       |-- config/
|       |-- data/
|       |-- middleware/
|       |-- routes/
|       |-- services/
|       `-- index.js
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- lib/
|   |-- package.json
|   |-- next.config.mjs
|   `-- tsconfig.json
|-- package.json
`-- README.md
```

## O que o sistema entrega hoje

- autenticacao com perfis `administrador`, `fisioterapeuta` e `coordenador`
- administracao de profissionais com criacao, edicao, ativacao, inativacao e redefinicao de senha
- dashboard com mapa de 40 leitos do `CTI 1`
- cadastro de pacientes em memoria
- ficha clinica completa
- exames laboratoriais diarios
- fluxo de alta / saida
- analytics com graficos e filtros de periodo

## Tecnologias

- Frontend: Next.js 14 + React 18 + TypeScript
- Backend: Node.js + Express
- Graficos: Recharts
- Persistencia atual: `mockData` em memoria

## Como rodar

### 1. Instale as dependencias

```bash
npm install
```

### 2. Configure o frontend

Crie `frontend/.env.local` com:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Rode em desenvolvimento

```bash
npm run dev
```

Aplicacoes:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Credenciais iniciais

- Administrador: `admin` / `Admin@123`
- Fisioterapeuta: `fisio` / `123456`
- Coordenador: `coordenador` / `Coord@123`

## Observacoes

- O sistema continua sem Prisma e sem PostgreSQL nesta fase.
- Senhas dos usuarios sao armazenadas com hash no backend.
- Os dados atuais sao resetados ao reiniciar o servidor backend.
