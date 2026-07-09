require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./db');
const expensesRouter = require('./routes/expenses');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/expenses', expensesRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Maneja tus Gastos API is running 🚀' });
});

// Sync DB and start server only when not testing
if (process.env.NODE_ENV !== 'test') {
  sequelize
    .sync({ alter: true })
    .then(() => {
      console.log('✅ Base de datos sincronizada');
      app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Error al conectar con la base de datos:', err);
      process.exit(1);
    });
}

module.exports = app;

