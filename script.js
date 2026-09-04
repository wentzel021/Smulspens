/* Smul Spens price list — behaviour + data-driven rendering.
   Menu content lives in products.json — edit that file to add, remove,
   rename, or re-price items without touching this script. */

var CATEGORIES = [];
var ITEMS = [];
var qty = {};
var currentLang = 'en';
var tabsOriginalTop = null;

/* ---------- Load data & build the page ---------- */

function loadProducts(){
  return fetch('products.json')
    .then(function(res){
      if(!res.ok){ throw new Error('Could not load products.json (' + res.status + ')'); }
      return res.json();
    })
    .then(function(data){
      CATEGORIES = data.categories || [];
      ITEMS = data.products || [];
      ITEMS.forEach(function(i){ qty[i.id] = 0; });
      renderTabs();
      renderPanels();
    })
    .catch(function(err){
      console.error(err);
      var panelWrap = document.getElementById('panelWrap');
      if(panelWrap){
        panelWrap.innerHTML = '<p class="loading-note">Sorry, the menu could not be loaded. Please refresh the page.</p>';
      }
    });
}

function renderTabs(){
  var tabsBar = document.getElementById('tabsBar');
  tabsBar.innerHTML = '';
  CATEGORIES.forEach(function(cat, index){
    var btn = document.createElement('button');
    btn.className = 'tab' + (index === 0 ? ' active' : '');
    btn.setAttribute('data-cat', cat.id);
    btn.onclick = function(){ showCat(cat.id); };

    var icon = document.createElement('span');
    icon.className = 'tab-icon';
    icon.textContent = cat.icon;
    btn.appendChild(icon);

    var label = document.createElement('span');
    label.setAttribute('data-en', cat.tabEn);
    label.setAttribute('data-af', cat.tabAf);
    label.textContent = currentLang === 'af' ? cat.tabAf : cat.tabEn;
    btn.appendChild(label);

    tabsBar.appendChild(btn);
  });
}

function renderPanels(){
  var panelWrap = document.getElementById('panelWrap');
  panelWrap.innerHTML = '';

  CATEGORIES.forEach(function(cat){
    var panel = document.createElement('div');
    panel.className = 'cat-panel';
    panel.id = 'cat-' + cat.id;

    var head = document.createElement('div');
    head.className = 'cat-section-head';
    head.innerHTML =
      '<div class="cat-section-icon">' + cat.icon + '</div>' +
      '<h2 data-en="' + escapeAttr(cat.en) + '" data-af="' + escapeAttr(cat.af) + '">' + escapeHtml(cat.en) + '</h2>';
    panel.appendChild(head);

    var grid = document.createElement('div');
    grid.className = 'item-grid';

    ITEMS.filter(function(item){ return item.cat === cat.id; }).forEach(function(item){
      grid.appendChild(buildItemCard(item));
    });

    panel.appendChild(grid);
    panelWrap.appendChild(panel);
  });
}

function buildItemCard(item){
  var card = document.createElement('div');
  card.className = 'item-card';

  var name = document.createElement('div');
  name.className = 'item-name';
  name.setAttribute('data-en', item.en);
  name.setAttribute('data-af', item.af);
  name.textContent = currentLang === 'af' ? item.af : item.en;
  card.appendChild(name);

  var price = document.createElement('div');
  price.className = 'item-price';
  price.textContent = 'R' + item.price;
  card.appendChild(price);

  if(item.unitEn){
    var unit = document.createElement('div');
    unit.className = 'unit-note';
    unit.setAttribute('data-en', item.unitEn);
    unit.setAttribute('data-af', item.unitAf || item.unitEn);
    unit.textContent = currentLang === 'af' ? (item.unitAf || item.unitEn) : item.unitEn;
    card.appendChild(unit);
  }

  var qtyRow = document.createElement('div');
  qtyRow.className = 'qty-row';

  var minusBtn = document.createElement('button');
  minusBtn.className = 'qty-btn';
  minusBtn.type = 'button';
  minusBtn.textContent = '−';
  minusBtn.onclick = function(){ stepQty(item.id, -1); };
  qtyRow.appendChild(minusBtn);

  var input = document.createElement('input');
  input.className = 'qty-input';
  input.type = 'number';
  input.min = '0';
  input.value = '0';
  input.setAttribute('data-item', item.id);
  input.oninput = function(){ qtyChanged(item.id, input.value); };
  qtyRow.appendChild(input);

  var plusBtn = document.createElement('button');
  plusBtn.className = 'qty-btn';
  plusBtn.type = 'button';
  plusBtn.textContent = '+';
  plusBtn.onclick = function(){ stepQty(item.id, 1); };
  qtyRow.appendChild(plusBtn);

  card.appendChild(qtyRow);
  return card;
}

function escapeHtml(str){
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(str){
  return escapeHtml(str).replace(/"/g, '&quot;');
}

/* ---------- Quantities & totals ---------- */

function stepQty(id, delta){
  qty[id] = Math.max(0, (qty[id]||0) + delta);
  var el = document.querySelector('.qty-input[data-item="' + id + '"]');
  if(el) el.value = qty[id];
  updateTotals();
}

function qtyChanged(id, val){
  var n = parseInt(val, 10);
  if(isNaN(n) || n < 0) n = 0;
  qty[id] = n;
  updateTotals();
}

function updateTotals(){
  var total = 0;
  ITEMS.forEach(function(i){ total += (qty[i.id]||0) * i.price; });
  document.getElementById('totalAmount').textContent = 'R' + total.toFixed(2);
  updateWaLinks();
}

/* ---------- WhatsApp message building ---------- */

function buildMessage(){
  var lines = [];
  var total = 0;
  ITEMS.forEach(function(i){
    var q = qty[i.id]||0;
    if(q > 0){
      var name = currentLang === 'af' ? i.af : i.en;
      lines.push(q + 'x ' + name);
      total += q * i.price;
    }
  });
  if(lines.length === 0){
    return currentLang === 'af'
      ? "Hallo! Ek wil graag 'n bestelling plaas."
      : "Hi! I'd like to place an order from your price list.";
  }
  var greeting = currentLang === 'af'
    ? "Hallo! Ek wil graag hierdie bestelling plaas:"
    : "Hi! I'd like to place this order:";
  var totalLabel = currentLang === 'af' ? 'Totaal' : 'Total';
  return greeting + ' ' + lines.join(', ') + ' - ' + totalLabel + ': R' + total.toFixed(2);
}

function updateWaLinks(){
  var msg = buildMessage();
  var encoded = encodeURIComponent(msg);
  ['wa1', 'wa2', 'fabWa'].forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    var num = el.getAttribute('data-number');
    el.href = 'https://wa.me/' + num + '?text=' + encoded;
  });
}

/* ---------- Tabs: click-to-scroll + scrollspy + floating ---------- */

function setActiveTab(catId){
  document.querySelectorAll('.tab').forEach(function(t){
    t.classList.toggle('active', t.getAttribute('data-cat') === catId);
  });
}

function showCat(catId){
  var target = document.getElementById('cat-' + catId);
  if(target){ target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  setActiveTab(catId);
}

function measureTabsOffset(){
  var tabsEl = document.getElementById('tabsBar');
  if(!tabsEl) return;
  var wasFloating = tabsEl.classList.contains('floating');
  if(wasFloating){
    tabsEl.classList.remove('floating');
    document.getElementById('tabsPlaceholder').style.display = 'none';
  }
  var rect = tabsEl.getBoundingClientRect();
  tabsOriginalTop = rect.top + window.scrollY;
  if(wasFloating){
    tabsEl.classList.add('floating');
    document.getElementById('tabsPlaceholder').style.display = 'block';
  }
}

function updateTabsFloat(){
  if(tabsOriginalTop === null) return;
  var tabsEl = document.getElementById('tabsBar');
  var placeholder = document.getElementById('tabsPlaceholder');
  var shouldFloat = window.scrollY + 10 >= tabsOriginalTop;
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
  var menu = document.getElementById('menu');
  if(!menu || menu.style.display === 'none') return;
  var tabsEl = document.getElementById('tabsBar');
  if(!tabsEl) return;
  var offset = tabsEl.getBoundingClientRect().bottom + 12;
  var panels = document.querySelectorAll('.cat-panel');
  var currentId = panels.length ? panels[0].id : null;
  panels.forEach(function(sec){
    var rect = sec.getBoundingClientRect();
    if(rect.top - offset <= 0){ currentId = sec.id; }
  });
  if(currentId){ setActiveTab(currentId.replace('cat-', '')); }
}

function onScroll(){
  updateTabsFloat();
  updateActiveTabFromScroll();
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', function(){ measureTabsOffset(); onScroll(); });

/* ---------- Language switching ---------- */

function setLang(lang){
  currentLang = lang;
  document.querySelectorAll('[data-en]').forEach(function(el){
    var val = lang === 'af' ? el.getAttribute('data-af') : el.getAttribute('data-en');
    el.textContent = val;
  });
  document.querySelectorAll('[data-en-html]').forEach(function(el){
    var val = lang === 'af' ? el.getAttribute('data-af-html') : el.getAttribute('data-en-html');
    el.innerHTML = val;
  });
  document.documentElement.lang = lang;
  updateWaLinks();

  var landing = document.getElementById('landing');
  var menu = document.getElementById('menu');
  landing.style.opacity = '0';
  setTimeout(function(){
    landing.style.display = 'none';
    menu.style.display = 'block';
    void menu.offsetWidth;
    menu.classList.add('visible');
    if(CATEGORIES.length){ setActiveTab(CATEGORIES[0].id); }
    measureTabsOffset();
    onScroll();
    document.querySelector('.total-bar').classList.add('visible');
    document.getElementById('fabWa').classList.add('visible');
  }, 250);
}

function showLanding(){
  var landing = document.getElementById('landing');
  var menu = document.getElementById('menu');
  menu.classList.remove('visible');
  document.querySelector('.total-bar').classList.remove('visible');
  document.getElementById('fabWa').classList.remove('visible');
  setTimeout(function(){
    menu.style.display = 'none';
    landing.style.display = 'block';
    landing.style.opacity = '0';
    void landing.offsetWidth;
    landing.style.opacity = '1';
  }, 300);
}

/* ---------- Init ---------- */

document.addEventListener('DOMContentLoaded', function(){
  loadProducts().then(function(){
    updateWaLinks();
  });
});
