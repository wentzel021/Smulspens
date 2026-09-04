# Smul Spens Backend - Phase 4: Admin Dashboard

## Features

✅ Admin authentication with token-based access  
✅ Order management (view, filter, update status)  
✅ Order analytics & statistics  
✅ Inventory tracking & management  
✅ Automatic invoice PDF generation  
✅ Dashboard with real-time data  
✅ Responsive design  

## Setup

1. **Install dependencies:**
   ```bash
   npm install pdfkit
   ```

2. **Configure `.env`:**
   ```bash
   ADMIN_TOKEN=your-secure-random-token-here
   ```
   Generate a secure token:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Start server:**
   ```bash
   npm start
   ```

4. **Access dashboard:**
   - Navigate to `http://localhost:3000/admin`
   - Enter your admin token

## Admin API Endpoints

### Orders
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/orders/:id` - Get specific order
- `PATCH /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/orders/:id/invoice` - Download invoice PDF

### Inventory
- `GET /api/admin/inventory` - Get inventory list
- `PATCH /api/admin/inventory/:itemId` - Update inventory quantity

### Analytics
- `GET /api/admin/stats` - Get dashboard statistics

## Dashboard Features

📊 **Statistics**
- Total orders
- Paid vs pending orders
- Total revenue

📋 **Order Management**
- View all orders
- Update order status (pending → paid → processing → shipped → delivered)
- Download invoices as PDF
- View customer details

📦 **Inventory**
- Track stock levels
- Set reorder levels
- Update quantities
- Low stock alerts

## Order Statuses

- **pending** - Order received, awaiting payment
- **paid** - Payment confirmed
- **processing** - Being prepared
- **shipped** - On its way
- **delivered** - Completed
- **cancelled** - Order cancelled

## Security Notes

⚠️ **Admin Token**: Keep this secret! It controls access to all admin operations.
⚠️ **HTTPS**: Use HTTPS in production.
⚠️ **Token Rotation**: Change your admin token periodically.

## Future Enhancements

- Multi-user admin accounts with roles
- Advanced filtering & search
- Email notifications for order updates
- Export orders to CSV/Excel
- Custom reports
- Two-factor authentication
