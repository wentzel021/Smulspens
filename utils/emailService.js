const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendOrderConfirmation(data) {
    try {
      const { email, orderId, items, total, language, paid } = data;
      const isAfrikaans = language === 'af';

      const subject = isAfrikaans ? 'Bestelling bevestigd!' : 'Order Confirmed!';
      const html = this.getConfirmationTemplate({
        orderId,
        items,
        total,
        isAfrikaans,
        paid
      });

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject,
        html
      });

      console.log(`✓ Confirmation email sent to ${email}`);
    } catch (error) {
      console.error('Email error:', error);
    }
  }

  async sendOrderNotification(data) {
    try {
      const { orderId, items, total, customerEmail, customerPhone, language, paid, paymentIntentId } = data;
      const isAfrikaans = language === 'af';

      const subject = isAfrikaans ? `Nuwe Bestelling: ${orderId}` : `New Order: ${orderId}`;
      const html = this.getNotificationTemplate({
        orderId,
        items,
        total,
        customerEmail,
        customerPhone,
        isAfrikaans,
        paid,
        paymentIntentId
      });

      const recipients = [
        process.env.BUSINESS_EMAIL_RONEL,
        process.env.BUSINESS_EMAIL_DALENE
      ].filter(Boolean);

      for (const recipient of recipients) {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: recipient,
          subject,
          html
        });
      }

      console.log(`✓ Order notification sent to business owners`);
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  getConfirmationTemplate(data) {
    const { orderId, items, total, isAfrikaans, paid } = data;
    const itemsHtml = items
      .map(i => `<li>${i.quantity}x ${i.name} - R${(i.price * i.quantity).toFixed(2)}</li>`)
      .join('');

    const paymentStatus = paid 
      ? isAfrikaans ? '✓ BETAALD' : '✓ PAID'
      : isAfrikaans ? '⏳ HANGENDE' : '⏳ PENDING';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${isAfrikaans ? 'Bestelling Bevestigd!' : 'Order Confirmed!'}</h2>
        <p>${isAfrikaans ? 'Bedankt vir jou bestelling!' : 'Thank you for your order!'}</p>
        <p><strong>${isAfrikaans ? 'Bestellingnommer:' : 'Order Number:'}</strong> ${orderId}</p>
        <p><strong>${isAfrikaans ? 'Status:' : 'Status:'}</strong> ${paymentStatus}</p>
        <h3>${isAfrikaans ? 'Jou Bestelstukke:' : 'Your Items:'}</h3>
        <ul>${itemsHtml}</ul>
        <p><strong>${isAfrikaans ? 'Totaal:' : 'Total:'}</strong> R${total.toFixed(2)}</p>
        <p>${isAfrikaans ? 'Ons sal met jou kontak oor die besteldetails.' : 'We will contact you with order details.'}</p>
        <p>${isAfrikaans ? 'Baie dankie!' : 'Thank you!'}</p>
      </div>
    `;
  }

  getNotificationTemplate(data) {
    const { orderId, items, total, customerEmail, customerPhone, isAfrikaans, paid, paymentIntentId } = data;
    const itemsHtml = items
      .map(i => `<li>${i.quantity}x ${i.name} - R${(i.price * i.quantity).toFixed(2)}</li>`)
      .join('');

    const paymentInfo = paid
      ? `<p><strong>${isAfrikaans ? 'Betaalstatus:' : 'Payment Status:'}</strong> ✓ ${isAfrikaans ? 'BETAALD' : 'PAID'}</p>
         <p><strong>${isAfrikaans ? 'Betaling ID:' : 'Payment ID:'}</strong> ${paymentIntentId}</p>`
      : `<p><strong>${isAfrikaans ? 'Betaalstatus:' : 'Payment Status:'}</strong> ⏳ ${isAfrikaans ? 'HANGENDE' : 'PENDING'}</p>`;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${isAfrikaans ? 'NUWE BESTELLING ONTVANG' : 'NEW ORDER RECEIVED'}</h2>
        <p><strong>${isAfrikaans ? 'Bestellingnommer:' : 'Order Number:'}</strong> ${orderId}</p>
        <p><strong>${isAfrikaans ? 'Klant E-pos:' : 'Customer Email:'}</strong> ${customerEmail || 'N/A'}</p>
        <p><strong>${isAfrikaans ? 'Klant Foon:' : 'Customer Phone:'}</strong> ${customerPhone || 'N/A'}</p>
        ${paymentInfo}
        <h3>${isAfrikaans ? 'Bestelstukke:' : 'Items:'}</h3>
        <ul>${itemsHtml}</ul>
        <p><strong>${isAfrikaans ? 'Totaal:' : 'Total:'}</strong> R${total.toFixed(2)}</p>
      </div>
    `;
  }
}

module.exports = new EmailService();
