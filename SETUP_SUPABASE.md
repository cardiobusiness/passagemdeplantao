# Setup de Banco de Dados com Supabase e Prisma

Este guia explica como configurar o banco de dados PostgreSQL usando Supabase e Prisma para o projeto CTI APP.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com)
- Git

## 🚀 Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha os dados:
   - **Project name**: `cti-app`
   - **Database password**: Use uma senha forte
   - **Region**: Selecione a região mais próxima (ex: América do Sul - São Paulo)
5. Aguarde a criação (2-3 minutos)

## 🔑 Passo 2: Obter Connection String

1. No painel do Supabase, vá para **Settings** > **Database** > **Connection Pooling**
2. Certifique-se que o **Mode** é "Transaction"
3. Copie a connection string que aparece:

```
postgresql://postgres.[project-id]:[password]@aws-0-[region].pooling.supabase.com:6543/postgres
```

Ou use a URL direta (sem pooling):

```
postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
```

## 📝 Passo 3: Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e substitua a `DATABASE_URL`:

```bash
# .env
DATABASE_URL="sua_connection_string_aqui"
PORT=4000
JWT_SECRET="sua-chave-secreta-aqui"
```

**Segurança**: Nunca compartilhe seu `.env` no git!

## 🗄️ Passo 4: Criar Banco de Dados

### Opção A: Usar Prisma (Recomendado)

1. **Gerar cliente Prisma**:
```bash
npm run db:generate
```

2. **Criar migration inicial**:
```bash
npm run db:migrate -- init
```

Quando perguntado, nomeie como `init`

3. **Executar migration**:
```bash
npm run db:migrate -- init
```

### Opção B: Reset (Limpa tudo e recria)

```bash
npm run db:reset
```

## 🌱 Passo 5: Popular Banco com Dados Iniciais

```bash
npm run db:seed
```

Isso criará:
- ✅ 4 usuários (admin, coordenador, rotina, plantonista)
- ✅ 40 leitos (L101 a L140)
- ✅ 8 pacientes de exemplo
- ✅ Métricas de admissão
- ✅ Resultados de laboratório
- ✅ Exames de imagem
- ✅ Evoluções clínicas
- ✅ Alertas

## 👥 Usuários de Teste

| Login | Senha | Role |
|-------|-------|------|
| admin | Admin@123 | Administrador |
| coordenador | Coord@123 | Coordenador |
| rotina | Rotina@123 | Rotina |
| plantonista | Plantao@123 | Plantonista |

## 🛠️ Comandos Úteis

### Desenvolvimento

```bash
# Inicia o servidor em modo watch
npm run dev

# Visualiza dados no Prisma Studio
npm run db:studio
```

### Migrations

```bash
# Criar nova migration
npm run db:migrate -- nome_da_migration

# Ver status das migrations
npx prisma migrate status

# Resetar banco (CUIDADO!)
npm run db:reset
```

### Dados

```bash
# Popular banco com seed
npm run db:seed

# Resetar banco e executar seed
npm run db:reset
```

## 📚 Estrutura do Banco

### Tabelas Principais

- **users**: Usuários do sistema
- **beds**: Leitos de CTI
- **patients**: Dados de pacientes
- **admission_metrics**: Métricas de internação
- **labs**: Resultados de laboratório
- **imaging**: Exames de imagem
- **evolutions**: Evoluções clínicas
- **alerts**: Alertas de pacientes
- **handovers**: Registros de passagem de plantão

## 🔗 Integração com Backend

O backend já está configurado para usar Prisma. Para usar os dados do banco:

1. **Importar Prisma**:
```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Usar em rotas
const patients = await prisma.patient.findMany();
```

2. **Exemplo de Rota**:
```javascript
app.get('/api/patients', async (req, res) => {
  const patients = await prisma.patient.findMany({
    include: { admissionMetrics: true, labs: true }
  });
  res.json(patients);
});
```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'prisma'"
```bash
npm install prisma @prisma/client
```

### Erro: "DATABASE_URL não definida"
Verifique se o arquivo `.env` existe e tem a variável `DATABASE_URL`

### Erro de conexão com Supabase
1. Confirme a URL de conexão
2. Verifique se o IP está liberado (Supabase > Settings > Database > Connection Pooling)
3. Teste a conexão: `npm run db:studio`

### Migrations falhando
```bash
# Reset completo
npm run db:reset

# Ou resolver manual
npx prisma migrate resolve --rolled-back init
```

## 📖 Documentação

- [Prisma Docs](https://www.prisma.io/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## ✅ Verificação Final

1. Confirme que `.env` tem a `DATABASE_URL` correta
2. Execute `npm run db:studio` - deve abrir interface visual
3. Verifique se dados estão sendo exibidos
4. Inicie o servidor com `npm run dev`
5. Teste rota: `curl http://localhost:4000/api/health`

---

**Próximos passos**: Atualizar as rotas do backend para usar Prisma ao invés de mockData.
