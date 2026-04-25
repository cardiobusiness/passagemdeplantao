# 🗄️ Banco de Dados - Guia Rápido

Passos essenciais para usar o Supabase + Prisma no CTI APP.

## ⚡ Quick Start

### 1. Configurar Supabase

```bash
# Criar projeto em supabase.com
# Copiar CONNECTION STRING da seção "Connection Pooling"
```

### 2. Configurar .env

```bash
# No diretório backend/
cp .env.example .env

# Editar .env e adicionar:
DATABASE_URL="sua-connection-string"
```

### 3. Preparar Banco

```bash
cd backend/

# Gerar cliente
npm run db:generate

# Criar estrutura
npm run db:migrate -- init

# Carregar dados de teste
npm run db:seed
```

### 4. Executar Backend

```bash
npm run dev
```

## 📊 Estrutura de Dados

| Tabela | Descrição | Registros |
|--------|-----------|-----------|
| users | Usuários do sistema | 4 (admin, coord, rotina, plantão) |
| beds | Leitos de CTI | 40 (L101-L140) |
| patients | Pacientes internados | 8 |
| labs | Exames laboratoriais | Múltiplos |
| imaging | Exames de imagem | Múltiplos |
| evolutions | Evoluções clínicas | Múltiplas |
| alerts | Alertas ativos | Múltiplos |
| admission_metrics | Métricas de permanência | 8 |

## 👥 Usuários de Teste

```
admin / Admin@123           (Administrador)
coordenador / Coord@123     (Coordenador)
rotina / Rotina@123         (Rotina)
plantonista / Plantao@123   (Plantonista)
```

## 🔧 Comandos Principais

```bash
# Desenvolvimento
npm run dev              # Inicia servidor em watch mode

# Banco de dados
npm run db:migrate       # Criar migration
npm run db:seed          # Carregar dados
npm run db:reset         # Limpar e recriar
npm run db:studio        # Interface visual do Prisma

# Verificar
curl http://localhost:4000/api/health
```

## 📚 Documentação Completa

- [Setup Detalhado](../SETUP_SUPABASE.md)
- [Como Usar Prisma](./PRISMA_USAGE.md)
- [Schema do Banco](./prisma/schema.prisma)
- [Script de Seed](./prisma/seed.ts)

## ✅ Checklist

- [ ] Projeto criado em supabase.com
- [ ] DATABASE_URL em .env
- [ ] `npm run db:migrate` executado
- [ ] `npm run db:seed` executado
- [ ] `npm run dev` rodando
- [ ] Endpoint `/api/health` respondendo

## 🚀 Próximos Passos

1. **Migrar rotas**: Substituir mockData por Prisma
2. **Atualizar serviços**: Usar Prisma em services/
3. **Frontend**: Testar com dados reais
4. **Produção**: Configurar variáveis de produção

---

**Problemas?** Consulte [SETUP_SUPABASE.md](../SETUP_SUPABASE.md#-troubleshooting)
