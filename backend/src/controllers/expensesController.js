const Expense = require('../models/expense');

// GET /api/expenses
const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findAll({ order: [['date', 'DESC']] });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los gastos', error: error.message });
  }
};

// GET /api/expenses/:id
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el gasto', error: error.message });
  }
};

// POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const { description, amount, category, date } = req.body;
    const expense = await Expense.create({ description, amount, category, date });
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el gasto', error: error.message });
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }
    const { description, amount, category, date } = req.body;
    await expense.update({ description, amount, category, date });
    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el gasto', error: error.message });
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }
    await expense.destroy();
    res.json({ message: 'Gasto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el gasto', error: error.message });
  }
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};

