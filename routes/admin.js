const express = require('express');
const router = express.Router();
const Database = require('../utils/database');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const db = new Database();

// Admin authentication middleware (basic)
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token === process.env.ADMIN_TOKEN) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Get all orders
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const orders = await db.getAllOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/orders/:id', requireAuth, async (req, res) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.patch('/orders/:id/status', requireAuth, (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    db.updateOrderStatus(req.params.id, status);
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Get inventory
router.get('/inventory', requireAuth, async (req, res) => {
  try {
    const inventory = await db.getInventory();
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Update inventory
router.patch('/inventory/:itemId', requireAuth, (req, res) => {
  try {
    const { quantity } = req.body;
    db.updateInventory(req.params.itemId, quantity);
    res.json({ success: true, message: 'Inventory updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// Generate invoice PDF
router.get('/orders/:id/invoice', requireAuth, async (req, res) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const doc = new PDFDocument();
    const filename = `invoice-${order.id}.pdf`;
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(24).text('Smul Spens', { align: 'center' });
    doc.fontSize(12).text('Homemade & Handcrafted Confectionery', { align: 'center' });
    doc.moveDown();
    
    // Invoice details
    doc.fontSize(14).text('INVOICE', { underline: true });
    doc.fontSize(10);
    doc.text(`Order ID: ${order.id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Status: ${order.status.toUpperCase()}`);
    doc.moveDown();
    
    // Customer details
    if (order.customerEmail || order.customerPhone) {
      doc.text('Customer:');
      if (order.customerEmail) doc.text(`Email: ${order.customerEmail}`);
      if (order.customerPhone) doc.text(`Phone: ${order.customerPhone}`);
      doc.moveDown();
    }
    
    // Items
    doc.text('Items:');
    doc.moveDown(0.5);
    order.items.forEach(item => {
      doc.text(`${item.quantity}x ${item.name} @ R${item.price} = R${(item.quantity * item.price).toFixed(2)}`);
    });
    doc.moveDown();
    
    // Total
    doc.fontSize(12).text(`TOTAL: R${order.total.toFixed(2)}`, { underline: true });
    doc.moveDown();
    
    doc.fontSize(10).text('Thank you for your order!', { align: 'center' });
    
    doc.end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// Dashboard stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
