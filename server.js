const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const Database = require('./utils/database');
const emailService = require('./utils/emailService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
const db = new Database();
db.init();

// Routes
app.post('/api/orders', async (req, res) => {
  try {
    const { items, total, language, customerEmail, customerPhone } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    // Save order to database
    const orderId = db.saveOrder({
      items,
      total,
      language,
      customerEmail,
      customerPhone,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    // Send confirmation email to customer
    if (customerEmail) {
      await emailService.sendOrderConfirmation({
        email: customerEmail,
        orderId,
        items,
        total,
        language
      });
    }

    // Send notification to business owners
    await emailService.sendOrderNotification({
      orderId,
      items,
      total,
      customerEmail,
      customerPhone,
      language
    });

    res.json({
      success: true,
      orderId,
      message: language === 'af' ? 'Bestelling ontvang!' : 'Order received!'
    });
  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const order = db.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

app.get('/api/orders', (req, res) => {
  try {
    const orders = db.getAllOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Smul Spens server running on http://localhost:${PORT}`);
});
