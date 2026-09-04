# Smul Spens Backend - Phase 3: Stripe Payments

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure `.env`:**
   ```bash
   cp .env.example .env
   ```

3. **Get Stripe Keys:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Navigate to "Developers" → "API keys"
   - Copy `Publishable key` → `STRIPE_PUBLIC_KEY`
   - Copy `Secret key` → `STRIPE_SECRET_KEY`
   - Set up webhook → `STRIPE_WEBHOOK_SECRET`

4. **Start server:**
   ```bash
   npm start
   ```

## New Endpoints

### POST `/api/payments/create-payment-intent`
Initiate a Stripe payment.

**Request:**
```json
{
  "items": [{"id": "beetroot", "name": "Pickled Beetroot", "quantity": 2, "price": 30}],
  "total": 60,
  "language": "en",
  "customerEmail": "customer@example.com",
  "customerPhone": "+27799550825"
}
```

**Response:**
```json
{
  "clientSecret": "pi_3Ks5ZI2eZvKYlo2C1234567890",
  "paymentIntentId": "pi_3Ks5ZI2eZvKYlo2C"
}
```

### POST `/api/payments/confirm-payment`
Confirm payment and save order.

**Request:**
```json
{
  "paymentIntentId": "pi_3Ks5ZI2eZvKYlo2C",
  "items": [{...}],
  "total": 60,
  "language": "en",
  "customerEmail": "customer@example.com",
  "customerPhone": "+27799550825"
}
```

### POST `/api/payments/webhook`
Stripe webhook endpoint (set in Stripe dashboard).

## Features

✅ Stripe payment processing  
✅ Automatic order confirmation emails with payment status  
✅ Business notifications with payment details  
✅ Payment tracking with Stripe Intent IDs  
✅ Bilingual support (EN/AF)  
✅ Order status: pending → paid  
✅ Webhook support for async events  

## Next: Phase 4
- Admin dashboard for order management
- Inventory tracking
- Invoice generation (PDF)
- Multi-user support
