// ─── app.js — Router principal de Hábitos ─────────────────────────────────────

// ─── Registro de módulos ───────────────────────────────────────────────────────
var MODULES_REGISTRY = [];

function registerModule(mod) {
  MODULES_REGISTRY.push(mod);
}

// ─── Estado de navegación ──────────────────────────────────────────────────────
var _currentModule = null;

// ─── Preferencias (localStorage) ──────────────────────────────────────────────
function getPinnedModules() {
  var raw = localStorage.getItem('habitos-pinned');
  return raw ? JSON.parse(raw) : [];
}

function savePinnedModules(arr) {
  localStorage.setItem('habitos-pinned', JSON.stringify(arr));
}

function getModuleOrder() {
  var raw = localStorage.getItem('habitos-module-order');
  return raw ? JSON.parse(raw) : [];
}

function saveModuleOrder(arr) {
  localStorage.setItem('habitos-module-order', JSON.stringify(arr));
}

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

  // Header del módulo con botón de regreso
  var header = createElement('div', { class: 'module-header' }, [
    createElement('button', { class: 'back-btn', id: 'back-btn' }, ['Hábitos']),
    createElement('h1', { class: 'module-title' }, [mod.icon + ' ' + mod.label])
  ]);
  document.getElementById('back-btn') && null;
  moduleEl.appendChild(header);

  // Contenedor del contenido del módulo
  var content = createElement('div', { class: 'module-content', id: 'module-content' });
  moduleEl.appendChild(content);

  // Cargar y renderizar el módulo
  loadModule(mod, content);

  // Swipe desde borde izquierdo para volver
  setupSwipeBack();

  // Bind del botón back (debe ser después de appendChild)
  document.getElementById('back-btn').addEventListener('click', navigateHome);
}

function navigateHome() {
  _currentModule = null;
  document.getElementById('home-screen').classList.remove('hidden');
  document.getElementById('module-view').classList.add('hidden');
  document.getElementById('module-view').innerHTML = '';
  renderHomeScreen();
}

// ─── Cargar módulo ─────────────────────────────────────────────────────────────
function loadModule(mod, container) {
  if (mod.type === 'json') {
    fetch('./modules/' + mod.id + '.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        renderModuleContent(data, container);
        dailyReset();
        loadSteps();
        loadDays();
      })
      .catch(function(err) {
        container.innerHTML = '<div class="load-error">Error cargando módulo.</div>';
        console.error(err);
      });
  } else if (mod.type === 'custom') {
    switch (mod.id) {
      case 'kegel': renderKegelModule(container); break;
    }
  } else if (typeof mod.render === 'function') {
    mod.render(container);
  }
}

function renderModuleContent(data, container) {
  // Tabs del módulo
  var tabBar = createElement('div', { class: 'main-tabs', id: 'main-tabs' });
  var tabContent = createElement('div', { id: 'tab-content' });
  container.appendChild(tabBar);
  container.appendChild(tabContent);

  data.tabs.forEach(function(tab, i) {
    var isFirst = i === 0;
    var tabBtn = createElement('button', {
      class: 'main-tab' + (isFirst ? ' active' : ''),
      id: 'tab-btn-' + tab.id
    }, [tab.icon + ' ' + tab.label]);
    tabBtn.addEventListener('click', function() { switchModuleTab(data.tabs, tab.id); });
    tabBar.appendChild(tabBtn);

    var panel = createElement('div', {
      class: 'tab-panel' + (isFirst ? ' active' : ''),
      id: 'tab-panel-' + tab.id
    });
    tab.sections.forEach(function(sec) {
      var rendered = renderSection(sec);
      if (rendered) panel.appendChild(rendered);
    });
    tabContent.appendChild(panel);
  });
}

function switchModuleTab(tabs, activeId) {
  tabs.forEach(function(tab) {
    var btn = document.getElementById('tab-btn-' + tab.id);
    var panel = document.getElementById('tab-panel-' + tab.id);
    var isActive = tab.id === activeId;
    if (btn) btn.classList.toggle('active', isActive);
    if (panel) panel.classList.toggle('active', isActive);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Home screen ───────────────────────────────────────────────────────────────
function renderHomeScreen() {
  var home = document.getElementById('home-screen');
  home.innerHTML = '';

  // Header
  var header = createElement('header', { class: 'home-header' }, [
    createElement('div', { class: 'home-date' }, [formatDate()]),
    createElement('h1', { class: 'home-title', id: 'home-title-btn' }, ['Hábitos'])
  ]);
  home.appendChild(header);

  // Reminders
  var remindersEl = createElement('div', { class: 'home-reminders', id: 'home-reminders' });
  renderReminders(remindersEl);
  home.appendChild(remindersEl);

  // Spacer para que el contenido no quede bajo la barra inferior
  home.appendChild(createElement('div', { style: 'height: 80px;' }));

  renderBottomBar();
}

function renderReminders(container) {
  var pinned = getPinnedModules();
  if (pinned.length === 0) {
    container.appendChild(createElement('p', { class: 'no-reminders' }, ['Pinea un módulo en la barra inferior para ver recordatorios aquí.']));
    return;
  }
  pinned.forEach(function(modId) {
    var mod = MODULES_REGISTRY.find(function(m) { return m.id === modId; });
    if (!mod || !mod.reminder) return;
    var card = createElement('div', { class: 'reminder-card', 'data-module': modId }, [
      createElement('span', { class: 'reminder-icon' }, [mod.icon]),
      createElement('span', { class: 'reminder-text' }, [mod.reminder()])
    ]);
    card.addEventListener('click', function() { navigateTo(modId); });
    container.appendChild(card);
  });
}

// ─── Barra inferior ────────────────────────────────────────────────────────────
var _barExpanded = false;

function renderBottomBar() {
  var bar = document.getElementById('bottom-bar');
  bar.innerHTML = '';
  bar.classList.remove('expanded');
  _barExpanded = false;

  var pinned = getPinnedModules();

  // Área de íconos pineados
  var iconsRow = createElement('div', { class: 'bar-icons' });

  if (pinned.length === 0) {
    iconsRow.appendChild(createElement('span', { class: 'bar-hint' }, ['Abre el menú ↑ para pinear módulos']));
  } else {
    pinned.forEach(function(modId) {
      var mod = MODULES_REGISTRY.find(function(m) { return m.id === modId; });
      if (!mod) return;
      var btn = createElement('button', { class: 'bar-icon-btn', 'data-module': modId }, [
        createElement('span', { class: 'bar-icon' }, [mod.icon]),
        createElement('span', { class: 'bar-label' }, [mod.label])
      ]);
      btn.addEventListener('click', function() { navigateTo(modId); });
      iconsRow.appendChild(btn);
    });
  }

  // Botón expandir
  var expandBtn = createElement('button', { class: 'bar-expand-btn', id: 'bar-expand-btn' }, ['⋯']);
  expandBtn.addEventListener('click', toggleBarExpanded);

  bar.appendChild(iconsRow);
  bar.appendChild(expandBtn);
}

function toggleBarExpanded() {
  var bar = document.getElementById('bottom-bar');
  _barExpanded = !_barExpanded;

  if (_barExpanded) {
    bar.classList.add('expanded');
    renderModuleGrid(bar);
  } else {
    bar.classList.remove('expanded');
    renderBottomBar();
  }
}

function renderModuleGrid(bar) {
  bar.innerHTML = '';

  var closeBtn = createElement('button', { class: 'bar-close-btn' }, ['✕ Cerrar']);
  closeBtn.addEventListener('click', toggleBarExpanded);
  bar.appendChild(closeBtn);

  var grid = createElement('div', { class: 'module-grid' });
  var pinned = getPinnedModules();

  MODULES_REGISTRY.forEach(function(mod) {
    var isPinned = pinned.indexOf(mod.id) >= 0;
    var card = createElement('div', { class: 'module-grid-card' + (isPinned ? ' pinned' : '') });

    var iconEl = createElement('div', { class: 'module-grid-icon' }, [mod.icon]);
    var labelEl = createElement('div', { class: 'module-grid-label' }, [mod.label]);
    var pinBtn = createElement('button', {
      class: 'pin-btn' + (isPinned ? ' pinned' : ''),
      title: isPinned ? 'Desanclar' : 'Anclar a la barra'
    }, [isPinned ? '★' : '☆']);

    pinBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      togglePin(mod.id);
    });

    iconEl.addEventListener('click', function() {
      toggleBarExpanded();
      navigateTo(mod.id);
    });

    card.appendChild(iconEl);
    card.appendChild(labelEl);
    card.appendChild(pinBtn);
    grid.appendChild(card);
  });

  bar.appendChild(grid);
}

function togglePin(modId) {
  var pinned = getPinnedModules();
  var idx = pinned.indexOf(modId);
  if (idx >= 0) {
    pinned.splice(idx, 1);
  } else {
    if (pinned.length >= 4) {
      showToast('Límite de módulos pineados alcanzado (máx. 4)');
      return;
    }
    pinned.push(modId);
  }
  savePinnedModules(pinned);
  renderModuleGrid(document.getElementById('bottom-bar'));
}

// ─── Swipe back ────────────────────────────────────────────────────────────────
function setupSwipeBack() {
  var startX = 0;
  var el = document.getElementById('module-view');
  el.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
  }, { passive: true });
  el.addEventListener('touchend', function(e) {
    var endX = e.changedTouches[0].clientX;
    if (startX < 30 && endX - startX > 80) {
      navigateHome();
    }
  }, { passive: true });
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
function formatDate() {
  var d = new Date();
  var dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return dias[d.getDay()] + ' ' + d.getDate() + ' ' + meses[d.getMonth()];
}

function createElement(tag, attrs, children) {
  var e = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function(k) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else e.setAttribute(k, attrs[k]);
  });
  if (children) children.forEach(function(c) {
    if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}

function renderSection(sec) {
  switch (sec.type) {
    case 'checklist':       return renderChecklist(sec);
    case 'scenario_picker': return renderScenarioPicker(sec);
    case 'alert':           return renderAlert(sec);
    case 'rules':           return renderRules(sec);
    case 'metric_grid':     return renderMetricGrid(sec);
    case 'day_selector':    return renderDaySelector(sec);
    case 'phase_tracker':   return renderPhaseTracker(sec);
    case 'permit_table':    return renderPermitTable(sec);
    case 'divider':         return renderDivider();
    default:                return null;
  }
}

function toggleStep(stepEl, group) {
  var was = stepEl.classList.contains('checked');
  stepEl.classList.toggle('checked');
  stepEl.setAttribute('aria-checked', String(!was));
  updateProg(group);
  saveSteps();
  if (navigator.vibrate) navigator.vibrate(20);
}

function updateProg(g) {
  var all = document.querySelectorAll('.step[data-group="' + g + '"]');
  var checked = document.querySelectorAll('.step[data-group="' + g + '"].checked');
  var total = all.length, done = checked.length;
  if (!total) return;
  var pct = Math.round(done / total * 100);
  var txt = document.getElementById('prog-' + g + '-txt');
  var bar = document.getElementById('prog-' + g + '-bar');
  var pctEl = document.getElementById('prog-' + g + '-pct');
  if (txt) txt.textContent = done + ' / ' + total;
  if (bar) bar.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
}

function resetGroup(g) {
  document.querySelectorAll('.step[data-group="' + g + '"]').forEach(function(s) {
    s.classList.remove('checked');
    s.setAttribute('aria-checked', 'false');
  });
  updateProg(g);
  saveSteps();
}

function switchSub(groupId, scenarioId) {
  document.querySelectorAll('[id^="subpanel-' + groupId + '-"]').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('[id^="subtab-' + groupId + '-"]').forEach(function(t) { t.classList.remove('active'); });
  var panel = document.getElementById('subpanel-' + groupId + '-' + scenarioId);
  var tab = document.getElementById('subtab-' + groupId + '-' + scenarioId);
  if (panel) panel.classList.add('active');
  if (tab) tab.classList.add('active');
}

function dailyReset() {
  var today = new Date().toDateString();
  var last = localStorage.getItem('habitos-date');
  if (last !== today) {
    localStorage.removeItem('habitos-steps');
    localStorage.setItem('habitos-date', today);
  }
}

function saveSteps() {
  var state = {};
  document.querySelectorAll('.step[data-id]').forEach(function(s) {
    state[s.dataset.id] = s.classList.contains('checked');
  });
  localStorage.setItem('habitos-steps', JSON.stringify(state));
}

function loadSteps() {
  var raw = localStorage.getItem('habitos-steps');
  var state = raw ? JSON.parse(raw) : {};
  document.querySelectorAll('.step[data-id]').forEach(function(s) {
    if (state[s.dataset.id]) {
      s.classList.add('checked');
      s.setAttribute('aria-checked', 'true');
    }
  });
  var groups = {};
  document.querySelectorAll('.step[data-group]').forEach(function(s) { groups[s.dataset.group] = true; });
  Object.keys(groups).forEach(updateProg);
}

function loadDays() {
  var raw = localStorage.getItem('habitos-days');
  if (!raw) return;
  var saved = JSON.parse(raw);
  Object.keys(saved).forEach(function(sid) {
    document.querySelectorAll('.day-btn[data-selector="' + sid + '"]').forEach(function(btn, i) {
      btn.classList.toggle('selected', !!saved[sid][i]);
    });
  });
}

// ─── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  dailyReset();

  // Registrar módulo Skincare
  registerModule({
    id: 'skincare',
    label: 'Skincare',
    icon: '✦',
    color: '#007AFF',
    type: 'json',
    reminder: function() {
      var hour = new Date().getHours();
      return hour < 12 ? 'Rutina de mañana pendiente' : 'Rutina de noche pendiente';
    }
  });

  registerModule({
    id: 'gym',
    label: 'Gym',
    icon: '💪',
    color: '#FF375F',
    type: 'dynamic',
    reminder: function() { return 'Registra tu sesión de hoy'; },
    render: function(container) { renderGymModule(container); }
  });

  registerModule({
    id: 'oral',
    label: 'Oral',
    icon: '🦷',
    color: '#30d158',
    type: 'json',
    reminder: function() { return 'Rutina oral pendiente'; }
  });

  registerModule({
    id: 'kegel',
    label: 'Kegel',
    icon: '💪',
    color: '#ff9f0a',
    type: 'custom',
    reminder: function() { return 'Completa tu rutina de Kegel hoy.'; }
  });

  renderHomeScreen();
});
