// ─── app.js — Router principal de Hábitos ─────────────────────────────────────
// Apple HIG dark redesign (Claude Design V3).
// Arquitectura: Home (grid de módulos) → tap en card → módulo con back button.

// ─── Registro de módulos ───────────────────────────────────────────────────────
var MODULES_REGISTRY = [];

function registerModule(mod) {
  MODULES_REGISTRY.push(mod);
}

// ─── Estado de navegación ──────────────────────────────────────────────────────
var _currentModule = null;

// ─── Navegación principal ──────────────────────────────────────────────────────
function navigateTo(moduleId) {
  var mod = MODULES_REGISTRY.find(function(m) { return m.id === moduleId; });
  if (!mod) return;

  _currentModule = moduleId;

  var homeEl = document.getElementById('home-screen');
  var moduleEl = document.getElementById('module-view');

  homeEl.classList.add('hidden');
  moduleEl.classList.remove('hidden');
  moduleEl.innerHTML = '';

  // Header del módulo: back button "Hábitos" + título oculto (cada módulo dibuja
  // su propio título grande Apple-style dentro del panel).
  var header = createElement('div', { class: 'module-header', id: 'module-header' }, [
    createElement('button', { class: 'back-btn', id: 'habitos-back-btn', type: 'button' }, ['Hábitos']),
    createElement('h1', { class: 'module-title', id: 'module-title' }, [mod.label])
  ]);
  moduleEl.appendChild(header);
  moduleEl.appendChild(createElement('div', { id: 'header-divider' }));

  var content = createElement('div', { class: 'module-content', id: 'module-content' });
  moduleEl.appendChild(content);

  loadModule(mod, content);

  setupSwipeBack();
  document.getElementById('habitos-back-btn').addEventListener('click', navigateHome);
}

function navigateHome() {
  _currentModule = null;
  resetSwipeTransform();
  document.getElementById('home-screen').classList.remove('hidden');
  document.getElementById('module-view').classList.add('hidden');
  document.getElementById('module-view').innerHTML = '';
  renderHomeScreen();
}

// ─── Cargar módulo ─────────────────────────────────────────────────────────────
function loadModule(mod, container) {
  if (mod.type === 'interactive') {
    switch (mod.id) {
      case 'mental': renderMentalModule(container); break;
    }
  } else if (typeof mod.render === 'function') {
    mod.render(container);
  }
}

// ─── Swipe back ────────────────────────────────────────────────────────────────
function setupSwipeBack() {
  var el      = document.getElementById('module-view');
  var startX  = 0;
  var startY  = 0;
  var deltaX  = 0;
  var active  = false;

  function onTouchStart(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    deltaX = 0;
    active = startX < 30;
  }

  function onTouchMove(e) {
    if (!active) return;
    deltaX = e.touches[0].clientX - startX;
    var deltaY = Math.abs(e.touches[0].clientY - startY);
    if (deltaX > 0 && deltaY < 80) {
      el.style.transition = 'none';
      el.style.transform  = 'translateX(' + deltaX + 'px)';
    }
  }

  function onTouchEnd() {
    if (!active) return;
    active = false;
    if (deltaX > 100) {
      navigateHome();
    } else {
      el.style.transition = 'transform 0.3s ease';
      el.style.transform  = 'translateX(0)';
    }
  }

  el.addEventListener('touchstart', onTouchStart, { passive: true });
  el.addEventListener('touchmove',  onTouchMove,  { passive: true });
  el.addEventListener('touchend',   onTouchEnd,   { passive: true });
}

function resetSwipeTransform() {
  var el = document.getElementById('module-view');
  if (el) { el.style.transition = ''; el.style.transform = ''; }
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  var toast = createElement('div', { class: 'toast' }, [msg]);
  document.body.appendChild(toast);
  setTimeout(function() { toast.classList.add('visible'); }, 10);
  setTimeout(function() {
    toast.classList.remove('visible');
    setTimeout(function() { toast.remove(); }, 300);
  }, 2500);
}

// ─── Utilidades ────────────────────────────────────────────────────────────────
function createElement(tag, attrs, children) {
  var e = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function(k) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else e.setAttribute(k, attrs[k]);
  });
  if (children) children.forEach(function(c) {
    if (c == null) return;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}

// Stubs legacy — mental.js / gym.js los esperan, son no-op si no hay datos.
function dailyReset() {
  var today = new Date().toDateString();
  var last = localStorage.getItem('habitos-date');
  if (last !== today) {
    localStorage.setItem('habitos-date', today);
  }
}

// ─── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  dailyReset();

  registerModule({
    id: 'gym',
    label: 'Gym',
    icon: '💪',
    color: '#FF9F0A',
    type: 'dynamic',
    render: function(container) { renderGymModule(container); }
  });

  registerModule({
    id: 'mental',
    label: 'Mental',
    icon: '🧠',
    color: '#5E5CE6',
    type: 'interactive'
  });

  renderHomeScreen();

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(function() {});
  }
});
