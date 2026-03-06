import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import session from "express-session";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const db = new Database("trading_v2.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    user_id INTEGER PRIMARY KEY,
    initial_capital REAL DEFAULT 1000,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS daily_profits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date TEXT,
    amount REAL,
    note TEXT,
    UNIQUE(user_id, date),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Health check for Railway
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  app.use(session({
    secret: "trading-portfolio-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: true, // Required for AI Studio iframe
      sameSite: 'none', // Required for AI Studio iframe
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 
    }
  }));

  // Add request logging for debugging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing fields" });
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hashedPassword);
      const userId = result.lastInsertRowid;
      
      db.prepare("INSERT INTO settings (user_id, initial_capital) VALUES (?, ?)").run(userId, 1000);
      
      req.session.userId = userId as number;
      res.json({ success: true, userId });
    } catch (error) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
      if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user.id;
        res.json({ success: true, userId: user.id });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (e) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.session.userId) {
      const user = db.prepare("SELECT id, username FROM users WHERE id = ?").get(req.session.userId) as any;
      res.json(user);
    } else {
      res.status(401).json({ error: "Not logged in" });
    }
  });

  // Data Routes
  app.get("/api/stats", requireAuth, (req, res) => {
    const userId = req.session.userId;
    const settings = db.prepare("SELECT initial_capital FROM settings WHERE user_id = ?").get(userId) as any;
    const initial = settings?.initial_capital || 1000;
    const totalProfit = db.prepare("SELECT SUM(amount) as total FROM daily_profits WHERE user_id = ?").get(userId).total || 0;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyProfit = db.prepare("SELECT SUM(amount) as total FROM daily_profits WHERE user_id = ? AND date LIKE ?").get(userId, `${currentMonth}%`).total || 0;
    const today = new Date().toISOString().slice(0, 10);
    const dailyProfit = db.prepare("SELECT amount FROM daily_profits WHERE user_id = ? AND date = ?").get(userId, today)?.amount || 0;

    res.json({
      initialCapital: initial,
      totalProfit,
      currentCapital: initial + totalProfit,
      monthlyProfit,
      dailyProfit
    });
  });

  app.get("/api/history", requireAuth, (req, res) => {
    const userId = req.session.userId;
    const history = db.prepare("SELECT * FROM daily_profits WHERE user_id = ? ORDER BY date DESC LIMIT 30").all(userId);
    res.json(history);
  });

  app.post("/api/profit", requireAuth, (req, res) => {
    const userId = req.session.userId;
    const { amount, date, note } = req.body;
    const entryDate = date || new Date().toISOString().slice(0, 10);
    
    try {
      const upsert = db.prepare(`
        INSERT INTO daily_profits (user_id, date, amount, note) 
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, date) DO UPDATE SET amount = amount + excluded.amount, note = excluded.note
      `);
      upsert.run(userId, entryDate, amount, note || "");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/settings", requireAuth, (req, res) => {
    const userId = req.session.userId;
    const { initialCapital } = req.body;
    if (initialCapital !== undefined) {
      db.prepare("UPDATE settings SET initial_capital = ? WHERE user_id = ?").run(initialCapital, userId);
    }
    res.json({ success: true });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
