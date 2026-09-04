const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const router = express.Router();
const Database = require('../utils/database');
const emailService = require('../utils/emailService');

const db = new Database();

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { items, total, language, customerEmail, customerPhone } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'zar',
      metadata: {
        orderId: 'PENDING-' + Date.now(),
        language,
        customerEmail,
        customerPhone,
        items: JSON.stringify(items)
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment and save order
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, items, total, language, customerEmail, customerPhone } = req.body;

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Save order to database
    const orderId = db.saveOrder({
      items,
      total,
      language,
      customerEmail,
      customerPhone,
      paymentIntentId,
      status: 'paid',
      createdAt: new Date().toISOString()
    });

    // Send confirmation email
    if (customerEmail) {
      await emailService.sendOrderConfirmation({
        email: customerEmail,
        orderId,
        items,
        total,
        language,
        paid: true
      });
    }

    // Send notification to business
    await emailService.sendOrderNotification({
      orderId,
      items,
      total,
      customerEmail,
      customerPhone,
      language,
      paid: true,
      paymentIntentId
    });

    res.json({
      success: true,
      orderId,
      message: language === 'af' ? 'Betaling suksesvol! Bedankt!' : 'Payment successful! Thank you!'
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`✓ Payment succeeded: ${paymentIntent.id}`);
      // Order already saved in confirm-payment, but can handle async updates here
      break;
    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      console.log(`✗ Payment failed: ${failedIntent.id}`);
      // Update order status to failed
      break;
    case 'charge.refunded':
      console.log(`↩ Refund processed`);
      break;
  }

  res.json({received: true});
});

module.exports = router;
