# Prisma Configuration

Este diretório contém a configuração do Prisma para o projeto CTI APP.

## Arquivos

- **schema.prisma**: Definição do schema do banco de dados
- **seed.ts**: Script para popular o banco com dados iniciais

## Workflow Típico

### Primeira Execução

```bash
# 1. Configurar DATABASE_URL em .env
# 2. Gerar cliente Prisma
npm run db:generate

# 3. Criar migration inicial
npm run db:migrate -- init

# 4. Popular com dados
npm run db:seed
```

### Após Modificações no Schema

```bash
# 1. Editar schema.prisma
# 2. Criar migration
npm run db:migrate -- descricao_da_mudanca

# 3. Regenerar cliente (automático, mas pode fazer manualmente)
npm run db:generate
```

### Para Desenvolvimento

```bash
# Visualizar dados em interface gráfica
npm run db:studio

# Resetar banco completamente (cuidado!)
npm run db:reset
```

## Modelos Disponíveis

### User
- Usuários do sistema
- Roles: administrator, coordinator, routine, oncall

### Bed
- Leitos de CTI
- Códigos: L101 a L140

### Patient
- Dados demográficos e clínicos de pacientes
- Relacionado com Bed

### AdmissionMetrics
- Métricas de permanência hospitalar

### Lab
- Resultados de exames laboratoriais

### Imaging
- Exames de imagem

### Evolution
- Evoluções clínicas (respiratória, motora)

### Alert
- Alertas ativos de pacientes

### Handover
- Registros de passagem de plantão

## Referências

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Database Best Practices](https://www.prisma.io/docs/guides/database/best-practices)
