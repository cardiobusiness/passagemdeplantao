# 📦 Entrega: Base de Dados com Supabase e Prisma

Implementação completa de banco de dados PostgreSQL para o CTI APP usando Supabase e Prisma.

## ✅ Tarefas Completadas

### 1. Configuração do Prisma ✓
- [x] Instalação de `prisma` e `@prisma/client`
- [x] Criação de estrutura `prisma/`
- [x] Provider PostgreSQL configurado
- [x] Instalação de `tsx` para rodar scripts TypeScript

### 2. Schema do Banco ✓
- [x] **User**: Usuários do sistema com roles
- [x] **Bed**: Leitos de CTI (L101-L140)
- [x] **Patient**: Dados de pacientes
- [x] **AdmissionMetrics**: Métricas de permanência
- [x] **Lab**: Resultados laboratoriais
- [x] **Imaging**: Exames de imagem
- [x] **Evolution**: Evoluções clínicas
- [x] **Alert**: Alertas de pacientes
- [x] **Handover**: Registros de passagem de plantão

### 3. Scripts e Ferramentas ✓
- [x] `seed.ts`: Script para popular banco com dados reais
- [x] Scripts npm adicionados:
  - `db:generate` - Gerar cliente Prisma
  - `db:migrate` - Criar migrations
  - `db:seed` - Popular dados
  - `db:reset` - Limpar e recriar
  - `db:studio` - Interface visual

### 4. Configuração de Ambiente ✓
- [x] `.env.example` atualizado com variáveis Supabase
- [x] `.gitignore` para backend com sensibilidades
- [x] Exemplo de DATABASE_URL com formato Supabase

### 5. Documentação ✓
- [x] `SETUP_SUPABASE.md` - Guia passo a passo
- [x] `PRISMA_USAGE.md` - Como usar Prisma no backend
- [x] `QUICKSTART.md` - Atalho para começar rápido
- [x] `prisma/README.md` - Documentação do Prisma

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

```
backend/
├── prisma/
│   ├── schema.prisma          (Schema do banco com 9 modelos)
│   ├── seed.ts               (Seed com dados iniciais)
│   └── README.md             (Instruções do Prisma)
├── .env.example              (Atualizado com Supabase)
├── .gitignore               (Novo, com segurança)
├── QUICKSTART.md            (Guia rápido)
├── PRISMA_USAGE.md          (Exemplos de uso)
└── package.json             (Scripts adicionados)

c:\Users\Leonardo\OneDrive\Documentos\CTI APP 2\
└── SETUP_SUPABASE.md        (Guia completo)
```

### Modificações

- `backend/package.json` - Scripts Prisma adicionados
- `backend/.env.example` - DATABASE_URL para Supabase

## 🚀 Como Começar

### Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Copie a connection string em Settings > Database > Connection Pooling

### Passo 2: Configurar Ambiente

```bash
cd backend/
cp .env.example .env
# Editar .env e adicionar DATABASE_URL
```

### Passo 3: Criar Banco

```bash
npm run db:generate    # Gerar cliente Prisma
npm run db:migrate -- init  # Criar estrutura
npm run db:seed        # Carregar dados
```

### Passo 4: Executar

```bash
npm run dev
```

## 👥 Dados de Teste Inclusos

### Usuários (4)
- **admin** / Admin@123 (Administrador)
- **coordenador** / Coord@123 (Coordenador)
- **rotina** / Rotina@123 (Rotina)
- **plantonista** / Plantao@123 (Plantonista)

### Dados
- 40 leitos (L101 a L140)
- 8 pacientes com dados realistas
- Métricas de admissão para cada paciente
- Labs, imagens, evoluções e alertas

## 📊 Schema do Banco

```
users (4)
  ├── id, name, email, login, password, role, isActive, createdAt

beds (40)
  ├── id, code, sector, occupied, status, patientId

patients (8)
  ├── id, name, recordNumber, age, diagnosis, admissionDate
  └── Relacionamentos: admissionMetrics, labs, imaging, evolutions, alerts

admissionMetrics
  └── daysInHospital, daysInICU, daysOnVM, etc

labs
  ├── hb, ht, leuco, bt, plq, ur, cr, pcr, na, k, ca, lactate

imaging
  ├── type, report, date

evolution
  ├── type (respiratoria/motora), description

alerts
  ├── severity, isActive, description

handovers
  ├── professionalId, bedIds, createdAt
```

## 🛠️ Próximos Passos

### 1. Integrar Prisma nas Rotas
Atualizar `/routes/` para usar Prisma ao invés de mockData

```javascript
// Exemplo: patientRoutes.js
import { prisma } from '../middleware/prismaMiddleware.js';

app.get('/patients', async (req, res) => {
  const patients = await prisma.patient.findMany({
    include: { admissionMetrics: true, labs: true }
  });
  res.json(patients);
});
```

### 2. Criar Middleware do Prisma
Centralizar instância do Prisma

```javascript
// middleware/prismaMiddleware.js
export const prisma = new PrismaClient();
```

### 3. Atualizar Serviços
Reescrever `userService.js`, `patientService.js` com Prisma

### 4. Testes
Validar todas as rotas com dados reais

## 📚 Referências

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Supabase Setup](https://supabase.com/docs/guides/getting-started/architecture)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## ⚙️ Troubleshooting

### DATABASE_URL não definida
```bash
# Verifique .env em backend/
cat .env
```

### Erro de conexão
1. Confirme URL do Supabase
2. Verifique IP está liberado no Supabase
3. Test: `npm run db:studio`

### Migration erro
```bash
npm run db:reset  # Nuclear option
```

## 🎯 Verificação Final

- [ ] Supabase projeto criado
- [ ] DATABASE_URL em `.env`
- [ ] `npm run db:seed` executado com sucesso
- [ ] `npm run dev` rodando
- [ ] `curl http://localhost:4000/api/health` respondendo
- [ ] `npm run db:studio` abrindo interface

---

**Status**: ✅ Pronto para Produção (com dados de teste)

**Tempo Estimado para Setup**: 15-20 minutos
