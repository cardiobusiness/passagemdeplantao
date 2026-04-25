# Guia de Uso do Prisma no Backend

Este documento explica como usar o Prisma nas rotas e serviços do backend CTI APP.

## Setup Básico

### 1. Importar Prisma

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

### 2. Em um Middleware Global (Recomendado)

```javascript
// middleware/prismaMiddleware.js
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// em index.js
import { prisma } from './middleware/prismaMiddleware.js';
app.locals.prisma = prisma;
```

## Exemplos de Uso

### Buscar Pacientes

```javascript
// Todos os pacientes
const patients = await prisma.patient.findMany();

// Com relacionamentos
const patients = await prisma.patient.findMany({
  include: {
    admissionMetrics: true,
    labs: true,
    imaging: true,
    evolutions: true,
    alerts: true
  }
});

// Com filtro
const patients = await prisma.patient.findMany({
  where: {
    age: { gte: 50 }
  },
  include: { admissionMetrics: true }
});

// Com paginação
const patients = await prisma.patient.findMany({
  skip: 0,
  take: 10,
  orderBy: { admissionDate: 'desc' }
});
```

### Buscar Paciente Específico

```javascript
// Por ID
const patient = await prisma.patient.findUnique({
  where: { id: patientId },
  include: {
    admissionMetrics: true,
    labs: { orderBy: { date: 'desc' } },
    imaging: true
  }
});

// Por Record Number
const patient = await prisma.patient.findUnique({
  where: { recordNumber: 'PAC000001' }
});
```

### Criar Paciente

```javascript
const newPatient = await prisma.patient.create({
  data: {
    name: "João da Silva",
    recordNumber: "PAC000123",
    age: 65,
    diagnosis: "Pneumonia",
    admissionDate: new Date(),
    ventilatorySupport: "Ventilação Mecânica",
    mobilityLevel: "Acamado",
    reasonForAdmission: "Insuficiência respiratória",
    clinicalHistory: {
      antecedentes: ["Hipertensão"],
      comorbidities: ["Diabetes"],
      intercurrences: [],
      clinicalAlerts: []
    }
  },
  include: { admissionMetrics: true }
});
```

### Atualizar Paciente

```javascript
const updated = await prisma.patient.update({
  where: { id: patientId },
  data: {
    diagnosis: "Novo diagnóstico",
    ventilatorySupport: "Oxigênio inalado"
  }
});
```

### Deletar Paciente

```javascript
// Cascata automática (relacionamentos deletados também)
await prisma.patient.delete({
  where: { id: patientId }
});
```

### Trabalhar com Leitos

```javascript
// Leitos ocupados
const occupiedBeds = await prisma.bed.findMany({
  where: { occupied: true },
  include: { patient: true }
});

// Leitos por setor
const ctiSector = await prisma.bed.findMany({
  where: { sector: "CTI 1" }
});

// Ocupação por setor
const occupancy = await prisma.bed.groupBy({
  by: ['sector'],
  where: { occupied: true },
  _count: { id: true }
});
```

### Trabalhar com Laboratórios

```javascript
// Labs de um paciente
const labs = await prisma.lab.findMany({
  where: { patientId },
  orderBy: { date: 'desc' }
});

// Último lab
const lastLab = await prisma.lab.findFirst({
  where: { patientId },
  orderBy: { date: 'desc' }
});

// Criar novo lab
const newLab = await prisma.lab.create({
  data: {
    patientId,
    date: new Date(),
    hb: "12.5",
    ht: "38",
    leuco: "8500",
    // ... outros campos
  }
});
```

### Trabalhar com Usuários

```javascript
// Buscar usuário por login
const user = await prisma.user.findUnique({
  where: { login: "admin" }
});

// Usuários ativos
const activeUsers = await prisma.user.findMany({
  where: { isActive: true }
});

// Usuários por role
const coordinators = await prisma.user.findMany({
  where: { role: "coordinator" }
});
```

### Transações

```javascript
// Múltiplas operações em transação
const result = await prisma.$transaction(async (tx) => {
  // Deletar todos os labs antigos
  await tx.lab.deleteMany({
    where: { date: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }
  });

  // Contar labs restantes
  const count = await tx.lab.count();
  
  return count;
});
```

### Queries Avançadas

```javascript
// Raw queries (quando necessário)
const result = await prisma.$queryRaw`
  SELECT p.name, COUNT(l.id) as lab_count
  FROM patients p
  LEFT JOIN labs l ON p.id = l.patientId
  GROUP BY p.id
`;

// Executar comando SQL
await prisma.$executeRaw`
  ALTER TABLE patients ADD COLUMN description TEXT;
`;
```

## Padrões Recomendados

### 1. Service Layer com Prisma

```javascript
// services/patientService.js
import { prisma } from '../middleware/prismaMiddleware.js';

export async function getPatientById(patientId) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { admissionMetrics: true, labs: true }
  });

  if (!patient) {
    throw new Error('Paciente não encontrado');
  }

  return patient;
}

export async function createPatient(data) {
  return prisma.patient.create({ data });
}

// Em uma rota
app.get('/api/patients/:id', async (req, res) => {
  const patient = await getPatientById(Number(req.params.id));
  res.json(patient);
});
```

### 2. Error Handling

```javascript
import { Prisma } from '@prisma/client';

app.post('/api/patients', async (req, res) => {
  try {
    const patient = await prisma.patient.create({
      data: req.body
    });
    res.status(201).json(patient);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Violação de unique constraint
        return res.status(400).json({ error: 'Record Number já existe' });
      }
    }
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Paginação

```javascript
export async function getPatients(page = 1, pageSize = 10) {
  const skip = (page - 1) * pageSize;
  
  const [patients, total] = await prisma.$transaction([
    prisma.patient.findMany({
      skip,
      take: pageSize,
      include: { admissionMetrics: true }
    }),
    prisma.patient.count()
  ]);

  return {
    data: patients,
    pagination: {
      page,
      pageSize,
      total,
      pages: Math.ceil(total / pageSize)
    }
  };
}
```

## Migrando de mockData

### Antes (mockData)

```javascript
import { patients } from '../data/mockData.js';

app.get('/api/patients', (req, res) => {
  res.json(patients);
});
```

### Depois (Prisma)

```javascript
app.get('/api/patients', async (req, res) => {
  const patients = await prisma.patient.findMany({
    include: { admissionMetrics: true, labs: true }
  });
  res.json(patients);
});
```

## Troubleshooting

### Erro: PrismaClientInitializationError

Certifique-se que `DATABASE_URL` está definida em `.env`

### Erro: Relation not found

Use `include` para carregar relacionamentos:

```javascript
// ❌ Não funciona
const patient = await prisma.patient.findUnique({
  where: { id: 1 }
});
console.log(patient.labs); // undefined

// ✅ Funciona
const patient = await prisma.patient.findUnique({
  where: { id: 1 },
  include: { labs: true }
});
console.log(patient.labs); // array
```

### Erro: Field is required

Todos os campos obrigatórios do schema devem ser fornecidos

### Performance

Para queries grandes, use `select` ao invés de `include`:

```javascript
// Mais leve
const patients = await prisma.patient.findMany({
  select: {
    id: true,
    name: true,
    age: true
    // Sem relacionamentos
  }
});
```

## Referências

- [Prisma Query Documentation](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance)
- [Error Codes](https://www.prisma.io/docs/reference/api-reference/error-reference)
