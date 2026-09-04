# Smul Spens Backend

## Phase 2: Order Logging & Email Notifications

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure email (Gmail recommended):**
   - Enable 2-Step Verification on your Google account
   - Generate an [App Password](https://support.google.com/accounts/answer/185833)
   - Add to `.env`:
     ```
     SMTP_USER=your-email@gmail.com
     SMTP_PASS=your-app-password
     ```

4. **Start server:**
   ```bash
   npm start
   ```
   or for development with auto-reload:
   ```bash
   npm run dev
   ```

### API Endpoints

#### POST `/api/orders`
Create a new order.

**Request:**
```json
{
  "items": [
    {"id": "beetroot", "name": "Pickled Beetroot", "quantity": 2, "price": 30}
  ],
  "total": 60,
  "language": "en",
  "customerEmail": "customer@example.com",
  "customerPhone": "+27799550825"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "ORD-1693820400000-abc123xyz",
  "message": "Order received!"
}
```

#### GET `/api/orders/:id`
Get a specific order.

#### GET `/api/orders`
Get all orders.

### Features

✅ SQLite database for order storage  
✅ Automatic email confirmations to customers  
✅ Business owner notifications  
✅ Bilingual support (English/Afrikaans)  
✅ Order tracking with status updates  
✅ Order history in database  

### Next: Phase 3
- Stripe payment integration
- Payment confirmation workflow
- Invoice generation
