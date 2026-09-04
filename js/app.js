let ITEMS = [];
let qty = {};
let currentLang = 'en';
let tabsOriginalTop = null;
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Load products from JSON
async function loadProducts() {
  try {
    const response = await fetch('products.json');
    ITEMS = await response.json();
    ITEMS.forEach(i => { qty[i.id] = 0; });
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
  console.log('⚠ Using fallback products');
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
  updateWaLinks();
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

async function submitOrderToBackend() {
  const items = getOrderItems();
  const total = getOrderTotal();

  if (items.length === 0) {
    alert(currentLang === 'af' ? 'Voeg items by!' : 'Add items to order!');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        total,
        language: currentLang,
        customerEmail: prompt(currentLang === 'af' ? 'Jou e-pos (opsioneel):' : 'Your email (optional):') || null,
        customerPhone: prompt(currentLang === 'af' ? 'Jou foonummer (opsioneel):' : 'Your phone (optional):') || null
      })
    });

    const result = await response.json();
    if (result.success) {
      alert(result.message);
      // Reset order
      ITEMS.forEach(i => { qty[i.id] = 0; });
      document.querySelectorAll('.qty-input').forEach(el => { el.value = 0; });
      updateTotals();
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    console.error('Order submission error:', error);
    alert(currentLang === 'af' ? 'Fout by bestelling' : 'Error submitting order');
  }
}

function buildMessage(){
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

function updateWaLinks(){
  const msg = buildMessage();
  const encoded = encodeURIComponent(msg);
  ['wa1','wa2','fabWa'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    const num = el.getAttribute('data-number');
    el.href = 'https://wa.me/' + num + '?text=' + encoded;
  });
}

function setActiveTab(catId){
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-cat') === catId);
  });
}

function showCat(catId){
  const target = document.getElementById('cat-' + catId);
  if(target){ target.scrollIntoView({behavior:'smooth', block:'start'}); }
  setActiveTab(catId);
}

function measureTabsOffset(){
  const tabsEl = document.getElementById('tabsBar');
  if(!tabsEl) return;
  const wasFloating = tabsEl.classList.contains('floating');
  if(wasFloating){ tabsEl.classList.remove('floating'); document.getElementById('tabsPlaceholder').style.display = 'none'; }
  const rect = tabsEl.getBoundingClientRect();
  tabsOriginalTop = rect.top + window.scrollY;
  if(wasFloating){ tabsEl.classList.add('floating'); document.getElementById('tabsPlaceholder').style.display = 'block'; }
}

function updateTabsFloat(){
  if(tabsOriginalTop === null) return;
  const tabsEl = document.getElementById('tabsBar');
  const placeholder = document.getElementById('tabsPlaceholder');
  const shouldFloat = window.scrollY + 10 >= tabsOriginalTop;
  if(shouldFloat && !tabsEl.classList.contains('floating')){
    placeholder.style.height = tabsEl.offsetHeight + 'px';
    placeholder.style.display = 'block';
    tabsEl.classList.add('floating');
  } else if(!shouldFloat && tabsEl.classList.contains('floating')){
    tabsEl.classList.remove('floating');
    placeholder.style.display = 'none';
  }
}

function updateActiveTabFromScroll(){
  const menu = document.getElementById('menu');
  if(!menu || menu.style.display === 'none') return;
  const tabsEl = document.getElementById('tabsBar');
  if(!tabsEl) return;
  const offset = tabsEl.getBoundingClientRect().bottom + 12;
  const panels = document.querySelectorAll('.cat-panel');
  let currentId = panels.length ? panels[0].id : null;
  panels.forEach(sec => {
    const rect = sec.getBoundingClientRect();
    if(rect.top - offset <= 0){ currentId = sec.id; }
  });
  if(currentId){ setActiveTab(currentId.replace('cat-', '')); }
}

function onScroll(){
  updateTabsFloat();
  updateActiveTabFromScroll();
}

window.addEventListener('scroll', onScroll, {passive:true});
window.addEventListener('resize', () => { measureTabsOffset(); onScroll(); });

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
  updateWaLinks();

  const landing = document.getElementById('landing');
  const menu = document.getElementById('menu');
  landing.style.opacity = '0';
  setTimeout(() => {
    landing.style.display = 'none';
    menu.style.display = 'block';
    void menu.offsetWidth;
    menu.classList.add('visible');
    setActiveTab('pickles');
    measureTabsOffset();
    onScroll();
    document.querySelector('.total-bar').classList.add('visible');
    document.getElementById('fabWa').classList.add('visible');
  }, 250);
}

function showLanding(){
  const landing = document.getElementById('landing');
  const menu = document.getElementById('menu');
  menu.classList.remove('visible');
  document.querySelector('.total-bar').classList.remove('visible');
  document.getElementById('fabWa').classList.remove('visible');
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
  updateWaLinks();
});
