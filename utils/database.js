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
      // Orders table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          items TEXT NOT NULL,
          total REAL NOT NULL,
          language TEXT DEFAULT 'en',
          customerEmail TEXT,
          customerPhone TEXT,
          paymentIntentId TEXT,
          status TEXT DEFAULT 'pending',
          createdAt TEXT,
          updatedAt TEXT
        )
      `);
      
      // Inventory table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS inventory (
          itemId TEXT PRIMARY KEY,
          itemName TEXT NOT NULL,
          quantity INTEGER DEFAULT 0,
          reorderLevel INTEGER DEFAULT 10,
          lastUpdated TEXT
        )
      `);
      
      console.log('✓ Database initialized with inventory support');
    });
  }

  saveOrder(order) {
    const id = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const stmt = this.db.prepare(`
      INSERT INTO orders (id, items, total, language, customerEmail, customerPhone, paymentIntentId, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      JSON.stringify(order.items),
      order.total,
      order.language || 'en',
      order.customerEmail || null,
      order.customerPhone || null,
      order.paymentIntentId || null,
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

  getInventory() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM inventory ORDER BY itemName', (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      });
    });
  }

  updateInventory(itemId, quantity) {
    const stmt = this.db.prepare('UPDATE inventory SET quantity = ?, lastUpdated = ? WHERE itemId = ?');
    stmt.run(quantity, new Date().toISOString(), itemId);
    stmt.finalize();
  }

  getDashboardStats() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          COUNT(*) as totalOrders,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paidOrders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
          SUM(total) as totalRevenue
        FROM orders
      `, (err, rows) => {
        if (err) reject(err);
        resolve(rows[0] || {});
      });
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;
