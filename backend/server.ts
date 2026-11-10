import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'expenses.json');

app.use(express.json());

// Category definitions
const VALID_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Other',
];

interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

// Calendar Date Validator (catches non-existent calendar days like Feb 31, April 31)
function isValidDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > 2100) return false;

  const testDate = new Date(year, month - 1, day);
  return (
    testDate.getFullYear() === year &&
    testDate.getMonth() === month - 1 &&
    testDate.getDate() === day
  );
}

// Generate dynamic seed data reflecting the current month with Indian Rupee (₹) amounts
function getInitialSeedData(): ExpenseRecord[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const currentMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
  
  // Previous month calculation
  const prevDate = new Date(currentYear, now.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  return [
    {
      id: crypto.randomUUID(),
      title: 'Coffee & Breakfast at Blue Tokai',
      amount: 380,
      category: 'Food',
      date: `${currentMonth}-10`,
      note: 'Cappuccino with croissant',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Metro Monthly Smart Card',
      amount: 1200,
      category: 'Transport',
      date: `${currentMonth}-08`,
      note: 'Monthly city metro pass reload',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Weekly Grocery Essentials',
      amount: 3450,
      category: 'Food',
      date: `${currentMonth}-07`,
      note: 'Fresh vegetables, dairy, pulses, and pantry staples',
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Broadband Fiber Internet Bill',
      amount: 999,
      category: 'Bills',
      date: `${currentMonth}-05`,
      note: '200Mbps unlimited fiber auto-debit',
      createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Weekend Movie Tickets & Snacks',
      amount: 850,
      category: 'Entertainment',
      date: `${currentMonth}-03`,
      note: 'PVR IMAX tickets with popcorn',
      createdAt: new Date(Date.now() - 3600000 * 168).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Winter Jacket',
      amount: 2999,
      category: 'Shopping',
      date: `${currentMonth}-02`,
      note: 'Warm fleece zip jacket',
      createdAt: new Date(Date.now() - 3600000 * 192).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Electricity & Utility Bill',
      amount: 1850,
      category: 'Bills',
      date: `${prevMonth}-28`,
      note: 'Monthly power and water bill',
      createdAt: new Date(Date.now() - 3600000 * 300).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Dinner at Punjabi Rasoi',
      amount: 1450,
      category: 'Food',
      date: `${prevMonth}-24`,
      note: 'Family dinner with desserts',
      createdAt: new Date(Date.now() - 3600000 * 400).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Airport Cab Ride',
      amount: 780,
      category: 'Transport',
      date: `${prevMonth}-20`,
      note: 'Ola cab to terminal 3',
      createdAt: new Date(Date.now() - 3600000 * 500).toISOString(),
    },
  ];
}

// Ensure data folder and file exist with initial seeds
function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = getInitialSeedData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

// Safe read from JSON file
function readExpenses(): ExpenseRecord[] {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading expenses from file:', err);
    return [];
  }
}

// Safe write to JSON file
function writeExpenses(expenses: ExpenseRecord[]): void {
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing expenses to file:', err);
    throw new Error('Failed to persist expenses data');
  }
}

// API Routes

// 1. GET /api/expenses - List expenses with sorting & filtering
app.get('/api/expenses', (req, res) => {
  try {
    const { category, from, to, search } = req.query as {
      category?: string;
      from?: string;
      to?: string;
      search?: string;
    };

    let expenses = readExpenses();

    // Filter by Category
    if (category && category !== 'All' && VALID_CATEGORIES.includes(category)) {
      expenses = expenses.filter((e) => e.category === category);
    }

    // Filter by Date Range (from / to) with weird date range normalization
    let filterFrom = from && isValidDate(from) ? from : undefined;
    let filterTo = to && isValidDate(to) ? to : undefined;

    // Edge case: if both provided and from > to, automatically swap to prevent blank results
    if (filterFrom && filterTo && filterFrom > filterTo) {
      const temp = filterFrom;
      filterFrom = filterTo;
      filterTo = temp;
    }

    if (filterFrom) {
      expenses = expenses.filter((e) => e.date >= filterFrom!);
    }
    if (filterTo) {
      expenses = expenses.filter((e) => e.date <= filterTo!);
    }

    // Filter by Title (partial text match, case-insensitive, also checks notes)
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      expenses = expenses.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.note && e.note.toLowerCase().includes(q))
      );
    }

    // Sort by Date (most recent first), secondary sort by createdAt (most recent first)
    expenses.sort((a, b) => {
      const dateComparison = b.date.localeCompare(a.date);
      if (dateComparison !== 0) return dateComparison;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    res.json(expenses);
  } catch (error) {
    console.error('GET /api/expenses error:', error);
    res.status(500).json({ error: 'Failed to retrieve expenses' });
  }
});

// 2. GET /api/expenses/summary - Monthly summary for specified or current month
app.get('/api/expenses/summary', (req, res) => {
  try {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetMonth = (req.query.month as string) || currentMonthStr;

    if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
      return res.status(400).json({ error: 'Invalid month format. Expected YYYY-MM.' });
    }

    const [yearStr, monthStrPart] = targetMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStrPart, 10);
    if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid month. Must be between 01 and 12.' });
    }

    const allExpenses = readExpenses();
    const monthExpenses = allExpenses.filter((e) => e.date.startsWith(targetMonth));

    const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseCount = monthExpenses.length;
    const averageSpent = expenseCount > 0 ? totalSpent / expenseCount : 0;

    // Breakdown by category
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    for (const cat of VALID_CATEGORIES) {
      categoryTotals[cat] = { total: 0, count: 0 };
    }

    for (const exp of monthExpenses) {
      if (categoryTotals[exp.category]) {
        categoryTotals[exp.category].total += exp.amount;
        categoryTotals[exp.category].count += 1;
      } else {
        categoryTotals[exp.category] = { total: exp.amount, count: 1 };
      }
    }

    const categories = VALID_CATEGORIES.map((cat) => {
      const data = categoryTotals[cat] || { total: 0, count: 0 };
      const percentage = totalSpent > 0 ? (data.total / totalSpent) * 100 : 0;
      return {
        category: cat,
        total: Math.round(data.total * 100) / 100,
        count: data.count,
        percentage: Math.round(percentage * 10) / 10,
      };
    });

    // Find highest spending category
    let highestCategory: { category: string; total: number; percentage: number } | undefined;
    const sortedCats = [...categories].sort((a, b) => b.total - a.total);
    if (sortedCats.length > 0 && sortedCats[0].total > 0) {
      highestCategory = {
        category: sortedCats[0].category,
        total: sortedCats[0].total,
        percentage: sortedCats[0].percentage,
      };
    }

    // Month display name
    const monthDate = new Date(year, month - 1, 1);
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Daily breakdown for the month chart
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyMap: Record<number, { total: number; count: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = { total: 0, count: 0 };
    }

    for (const exp of monthExpenses) {
      const dayNum = parseInt(exp.date.split('-')[2], 10);
      if (dailyMap[dayNum]) {
        dailyMap[dayNum].total += exp.amount;
        dailyMap[dayNum].count += 1;
      }
    }

    const dailyBreakdown = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${targetMonth}-${dayStr}`;
      return {
        day,
        date: dateStr,
        total: Math.round(dailyMap[day].total * 100) / 100,
        count: dailyMap[day].count,
      };
    });

    res.json({
      month: targetMonth,
      monthName,
      totalSpent: Math.round(totalSpent * 100) / 100,
      expenseCount,
      averageSpent: Math.round(averageSpent * 100) / 100,
      categories,
      highestCategory,
      dailyBreakdown,
    });
  } catch (error) {
    console.error('GET /api/expenses/summary error:', error);
    res.status(500).json({ error: 'Failed to calculate monthly summary' });
  }
});

// 3. POST /api/expenses - Add an expense
app.post('/api/expenses', (req, res) => {
  try {
    const { title, amount, category, date, note } = req.body;

    // Validation: Title
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required and cannot be empty' });
    }
    if (title.trim().length > 100) {
      return res.status(400).json({ error: 'Title must be 100 characters or fewer' });
    }

    // Validation: Amount
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number greater than ₹0' });
    }
    if (numAmount > 10000000) {
      return res.status(400).json({ error: 'Amount cannot exceed ₹1,00,00,000 (1 Crore)' });
    }

    // Validation: Category
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    // Validation: Date
    if (!isValidDate(date)) {
      return res.status(400).json({ error: 'Invalid calendar date. Must be valid YYYY-MM-DD.' });
    }

    const expenses = readExpenses();
    const newExpense: ExpenseRecord = {
      id: crypto.randomUUID(),
      title: title.trim(),
      amount: Math.round(numAmount * 100) / 100,
      category,
      date,
      note: note && typeof note === 'string' && note.trim() !== '' ? note.trim().slice(0, 500) : undefined,
      createdAt: new Date().toISOString(),
    };

    expenses.unshift(newExpense);
    writeExpenses(expenses);

    res.status(201).json(newExpense);
  } catch (error) {
    console.error('POST /api/expenses error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// 4. PUT /api/expenses/:id - Edit an expense
app.put('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date, note } = req.body;

    const expenses = readExpenses();
    const index = expenses.findIndex((e) => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Validation: Title
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required and cannot be empty' });
    }
    if (title.trim().length > 100) {
      return res.status(400).json({ error: 'Title must be 100 characters or fewer' });
    }

    // Validation: Amount
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number greater than ₹0' });
    }
    if (numAmount > 10000000) {
      return res.status(400).json({ error: 'Amount cannot exceed ₹1,00,00,000 (1 Crore)' });
    }

    // Validation: Category
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    // Validation: Date
    if (!isValidDate(date)) {
      return res.status(400).json({ error: 'Invalid calendar date. Must be valid YYYY-MM-DD.' });
    }

    const updated: ExpenseRecord = {
      ...expenses[index],
      title: title.trim(),
      amount: Math.round(numAmount * 100) / 100,
      category,
      date,
      note: note && typeof note === 'string' && note.trim() !== '' ? note.trim().slice(0, 500) : undefined,
      updatedAt: new Date().toISOString(),
    };

    expenses[index] = updated;
    writeExpenses(expenses);

    res.json(updated);
  } catch (error) {
    console.error('PUT /api/expenses/:id error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// 5. DELETE /api/expenses/:id - Delete an expense
app.delete('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const expenses = readExpenses();
    const index = expenses.findIndex((e) => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const [deleted] = expenses.splice(index, 1);
    writeExpenses(expenses);

    res.json({ success: true, deleted });
  } catch (error) {
    console.error('DELETE /api/expenses/:id error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// 6. POST /api/expenses/reset-demo - Reset to demo state
app.post('/api/expenses/reset-demo', (_req, res) => {
  try {
    const demoData = getInitialSeedData();
    writeExpenses(demoData);
    res.json({ success: true, count: demoData.length });
  } catch (error) {
    console.error('POST /api/expenses/reset-demo error:', error);
    res.status(500).json({ error: 'Failed to reset demo expenses' });
  }
});

// Dev / Prod mounting
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Expense Tracker server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
