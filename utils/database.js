const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.db = new sqlite3.Database(process.env.DB_PATH || path.join(dataDir, 'orders.db'));
  }

  init() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          items TEXT NOT NULL,
          total REAL NOT NULL,
          language TEXT DEFAULT 'en',
          customerEmail TEXT,
          customerPhone TEXT,
          status TEXT DEFAULT 'pending',
          createdAt TEXT,
          updatedAt TEXT
        )
      `);
      console.log('✓ Database initialized');
    });
  }

  saveOrder(order) {
    const id = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const stmt = this.db.prepare(`
      INSERT INTO orders (id, items, total, language, customerEmail, customerPhone, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      JSON.stringify(order.items),
      order.total,
      order.language || 'en',
      order.customerEmail || null,
      order.customerPhone || null,
      order.status || 'pending',
      order.createdAt,
      order.createdAt
    );
    stmt.finalize();
    return id;
  }

  getOrder(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        if (row) {
          row.items = JSON.parse(row.items);
        }
        resolve(row);
      });
    });
  }

  getAllOrders() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM orders ORDER BY createdAt DESC', (err, rows) => {
        if (err) reject(err);
        if (rows) {
          rows = rows.map(row => ({
            ...row,
            items: JSON.parse(row.items)
          }));
        }
        resolve(rows || []);
      });
    });
  }

  updateOrderStatus(id, status) {
    const stmt = this.db.prepare('UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?');
    stmt.run(status, new Date().toISOString(), id);
    stmt.finalize();
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;
