const request = require('supertest');

// Mock DB connection BEFORE requiring app to avoid Postgres connection attempts
jest.mock('../src/db', () => ({
  define: jest.fn(),
  sync: jest.fn().mockResolvedValue(true),
  authenticate: jest.fn().mockResolvedValue(true),
}));

const app = require('../src/app');

// Mock Sequelize model to avoid real DB connection in tests
jest.mock('../src/models/expense', () => {
  const mockExpenses = [
    {
      id: 1,
      description: 'Supermercado',
      amount: 50.00,
      category: 'Alimentación',
      date: '2026-03-01',
    },
    {
      id: 2,
      description: 'Bus',
      amount: 2.50,
      category: 'Transporte',
      date: '2026-03-02',
    },
  ];

  return {
    findAll: jest.fn().mockResolvedValue(mockExpenses),
    findByPk: jest.fn((id) => {
      const expense = mockExpenses.find((e) => e.id === Number(id));
      if (!expense) return Promise.resolve(null);
      return Promise.resolve({
        ...expense,
        update: jest.fn((data) => Promise.resolve({ ...expense, ...data })),
        destroy: jest.fn().mockResolvedValue(true),
      });
    }),
    create: jest.fn((data) =>
      Promise.resolve({ id: 3, ...data })
    ),
  };
});

describe('API /api/expenses', () => {
  test('GET /api/expenses → retorna lista de gastos', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('description', 'Supermercado');
  });

  test('GET /api/expenses/:id → retorna un gasto por ID', async () => {
    const res = await request(app).get('/api/expenses/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('category', 'Alimentación');
  });

  test('GET /api/expenses/:id → 404 si no existe', async () => {
    const res = await request(app).get('/api/expenses/999');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Gasto no encontrado');
  });

  test('POST /api/expenses → crea un nuevo gasto', async () => {
    const newExpense = {
      description: 'Netflix',
      amount: 15.99,
      category: 'Entretenimiento',
      date: '2026-03-08',
    };
    const res = await request(app).post('/api/expenses').send(newExpense);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id', 3);
    expect(res.body).toHaveProperty('description', 'Netflix');
  });

  test('DELETE /api/expenses/:id → elimina un gasto', async () => {
    const res = await request(app).delete('/api/expenses/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Gasto eliminado correctamente');
  });
});

