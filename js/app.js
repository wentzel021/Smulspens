let ITEMS = [];
let qty = {};
let currentLang = 'en';
let tabsOriginalTop = null;
let stripe = null;
let elements = null;
let cardElement = null;
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const STRIPE_KEY = 'pk_test_YOUR_STRIPE_KEY'; // Replace with your Stripe public key

// Load products from JSON
async function loadProducts() {
  try {
    const response = await fetch('products.json');
    ITEMS = await response.json();
    ITEMS.forEach(i => { qty[i.id] = 0; });
    renderProducts();
    console.log('✓ Products loaded successfully');
  } catch (error) {
    console.error('✗ Error loading products:', error);
    loadFallbackProducts();
  }
}

// Fallback products if JSON fails to load
function loadFallbackProducts() {
  ITEMS = [
    {id:'beetroot', cat:'pickles', en:'Pickled Beetroot', af:'Ingelegde Beet', price:30},
    {id:'curriedbeans', cat:'pickles', en:'Curried Beans', af:'Kerrie Boontjies', price:40},
    {id:'curriedcabbage', cat:'pickles', en:'Curried Cabbage', af:'Kerrie Kool', price:30},
    {id:'onions', cat:'pickles', en:'Pickled Onions', af:'Ingelegde Uie', price:60},
    {id:'mustard', cat:'pickles', en:'Homemade Mustard', af:'Tuisgemaakte Mosterd', price:60},
    {id:'tomatojam', cat:'pickles', en:'Tomato Jam', af:'Tamatiekonfyt', price:50},
    {id:'allbran', cat:'rusks', en:'All Bran Rusks', af:'All Bran Beskuit', price:55},
    {id:'branseeds', cat:'rusks', en:'Bran Rusks with Seeds', af:'Semelbeskuit met Sade', price:55},
    {id:'buttermilk', cat:'rusks', en:'Buttermilk Rusks', af:'Karringmelkbeskuit', price:55},
    {id:'diabetic', cat:'rusks', en:'Diabetic Rusks', af:'Diabetiese Beskuit', price:55},
    {id:'ginger', cat:'baked', en:'Ginger Biscuits', af:'Gemmerkoekies', price:35},
    {id:'sweetbiscuits', cat:'baked', en:'Sweet Biscuits', af:'Soet Koekies', price:35},
    {id:'cupcakes', cat:'baked', en:'Cupcakes', af:'Kolwyntjies', price:10},
    {id:'fudge', cat:'sweets', en:'Biscuit Fudge', af:'Koekie Fudge', price:20},
    {id:'coconutice', cat:'sweets', en:'Coconut Ice', af:'Klapper-ys', price:20},
    {id:'lamingtons', cat:'sweets', en:'Lamingtons', af:'Ystervarkies', price:20}
  ];
  ITEMS.forEach(i => { qty[i.id] = 0; });
  renderProducts();
  console.log('⚠ Using fallback products');
}

function renderProducts() {
  const panel = document.getElementById('productsPanel');
  const categories = ['pickles', 'rusks', 'baked', 'sweets'];
  const catIcons = {'pickles': '🫙', 'rusks': '🍞', 'baked': '🍪', 'sweets': '🍬'};
  const catLabels = {
    'pickles': {en: 'Pickled Products & Spreads', af: 'Ingelegde Produkte & Smere'},
    'rusks': {en: 'Rusks', af: 'Beskuit'},
    'baked': {en: 'Baked Goods & Biscuits', af: 'Gebak & Koekies'},
    'sweets': {en: 'Sweet Treats', af: 'Soet Lekkernye'}
  };

  panel.innerHTML = categories.map(cat => `
    <div class="cat-panel" id="cat-${cat}">
      <div class="cat-section-head">
        <div class="cat-section-icon">${catIcons[cat]}</div>
        <h2>${currentLang === 'af' ? catLabels[cat].af : catLabels[cat].en}</h2>
      </div>
      <div class="item-grid">
        ${ITEMS.filter(i => i.cat === cat).map(i => `
          <div class="item-card">
            <div class="item-name">${currentLang === 'af' ? i.af : i.en}</div>
            <div class="item-price">R${i.price}</div>
            <div class="qty-row">
              <button class="qty-btn" onclick="stepQty('${i.id}',-1)" aria-label="Decrease">−</button>
              <input class="qty-input" type="number" min="0" value="0" data-item="${i.id}" oninput="qtyChanged('${i.id}',this.value)" aria-label="Quantity">
              <button class="qty-btn" onclick="stepQty('${i.id}',1)" aria-label="Increase">+</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function stepQty(id, delta){
  qty[id] = Math.max(0, (qty[id]||0) + delta);
  const el = document.querySelector('.qty-input[data-item="'+id+'"]');
  if(el) el.value = qty[id];
  updateTotals();
}

function qtyChanged(id, val){
  let n = parseInt(val, 10);
  if(isNaN(n) || n < 0) n = 0;
  qty[id] = n;
  updateTotals();
}

function updateTotals(){
  let total = 0;
  ITEMS.forEach(i => { total += (qty[i.id]||0) * i.price; });
  document.getElementById('totalAmount').textContent = 'R' + total.toFixed(2);
}

function getOrderItems() {
  return ITEMS
    .filter(i => qty[i.id] > 0)
    .map(i => ({
      id: i.id,
      name: currentLang === 'af' ? i.af : i.en,
      quantity: qty[i.id],
      price: i.price
    }));
}

function getOrderTotal() {
  let total = 0;
  ITEMS.forEach(i => { total += (qty[i.id]||0) * i.price; });
  return total;
}

function buildWhatsAppMessage(){
  const lines = [];
  let total = 0;
  ITEMS.forEach(i => {
    const q = qty[i.id]||0;
    if(q > 0){
      const name = currentLang === 'af' ? i.af : i.en;
      lines.push(q + 'x ' + name);
      total += q * i.price;
    }
  });
  if(lines.length === 0){
    return currentLang === 'af'
      ? "Hallo! Ek wil graag 'n bestelling plaas."
      : "Hi! I'd like to place an order from your price list.";
  }
  const greeting = currentLang === 'af'
    ? "Hallo! Ek wil graag hierdie bestelling plaas:"
    : "Hi! I'd like to place this order:";
  const totalLabel = currentLang === 'af' ? 'Totaal' : 'Total';
  return greeting + ' ' + lines.join(', ') + ' - ' + totalLabel + ': R' + total.toFixed(2);
}

function showWhatsAppOptions() {
  const items = getOrderItems();
  if (items.length === 0) {
    alert(currentLang === 'af' ? 'Voeg items by!' : 'Add items to order!');
    return;
  }
  const msg = buildWhatsAppMessage();
  const encoded = encodeURIComponent(msg);
  document.getElementById('wa1').href = 'https://wa.me/27799550825?text=' + encoded;
  document.getElementById('wa2').href = 'https://wa.me/27835081982?text=' + encoded;
  document.getElementById('waModal').classList.add('show');
}

function closeWhatsAppModal() {
  document.getElementById('waModal').classList.remove('show');
}

function initializeStripe() {
  if (!stripe) {
    stripe = Stripe(STRIPE_KEY);
    elements = stripe.elements();
    cardElement = elements.create('card');
    cardElement.mount('#card-element');
    cardElement.on('change', (event) => {
      const displayError = document.getElementById('card-errors');
      displayError.textContent = event.error ? event.error.message : '';
    });
  }
}

function initiateStripePayment() {
  const items = getOrderItems();
  if (items.length === 0) {
    alert(currentLang === 'af' ? 'Voeg items by!' : 'Add items to order!');
    return;
  }
  initializeStripe();
  document.getElementById('stripeModal').classList.add('show');
}

function closeStripeModal() {
  document.getElementById('stripeModal').classList.remove('show');
}

document.getElementById('paymentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const total = getOrderTotal();
  const items = getOrderItems();
  const email = document.getElementById('customerEmail').value;
  const phone = document.getElementById('customerPhone').value;
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = currentLang === 'af' ? 'Verwerk...' : 'Processing...';

  try {
    // Create payment intent
    const intentRes = await fetch(`${API_URL}/payments/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, total, language: currentLang, customerEmail: email, customerPhone: phone })
    });
    const intentData = await intentRes.json();

    // Confirm payment with Stripe
    const result = await stripe.confirmCardPayment(intentData.clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { email }
      }
    });

    if (result.error) {
      document.getElementById('card-errors').textContent = result.error.message;
    } else {
      // Confirm with backend
      const confirmRes = await fetch(`${API_URL}/payments/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: intentData.paymentIntentId,
          items,
          total,
          language: currentLang,
          customerEmail: email,
          customerPhone: phone
        })
      });
      const confirmData = await confirmRes.json();
      alert(confirmData.message);
      closeStripeModal();
      ITEMS.forEach(i => { qty[i.id] = 0; });
      renderProducts();
      updateTotals();
    }
  } catch (error) {
    document.getElementById('card-errors').textContent = 'Payment error: ' + error.message;
  } finally {
    btn.disabled = false;
    btn.textContent = currentLang === 'af' ? 'Betaal R' + getOrderTotal().toFixed(2) : 'Pay R' + getOrderTotal().toFixed(2);
  }
});

function setLang(lang){
  currentLang = lang;
  document.querySelectorAll('[data-en]').forEach(el => {
    const val = lang === 'af' ? el.getAttribute('data-af') : el.getAttribute('data-en');
    el.textContent = val;
  });
  document.querySelectorAll('[data-en-html]').forEach(el => {
    const val = lang === 'af' ? el.getAttribute('data-af-html') : el.getAttribute('data-en-html');
    el.innerHTML = val;
  });
  document.documentElement.lang = lang;
  renderProducts();

  const landing = document.getElementById('landing');
  const menu = document.getElementById('menu');
  landing.style.opacity = '0';
  setTimeout(() => {
    landing.style.display = 'none';
    menu.style.display = 'block';
    void menu.offsetWidth;
    menu.classList.add('visible');
    document.querySelector('.total-bar').classList.add('visible');
  }, 250);
}

function showLanding(){
  const landing = document.getElementById('landing');
  const menu = document.getElementById('menu');
  menu.classList.remove('visible');
  document.querySelector('.total-bar').classList.remove('visible');
  setTimeout(() => {
    menu.style.display = 'none';
    landing.style.display = 'block';
    landing.style.opacity = '0';
    void landing.offsetWidth;
    landing.style.opacity = '1';
  }, 300);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  updateTotals();
});
