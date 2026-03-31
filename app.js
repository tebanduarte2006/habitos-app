// app.js — Router principal de Hábitos
// Carga módulos, maneja navegación global.

const MODULES_REGISTRY = [];

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

function registerModule(mod) {
  MODULES_REGISTRY.push(mod);
}

function renderHomeScreen() {
  const home = document.getElementById('home-screen');
  home.innerHTML = `
    <header class="home-header">
      <div class="home-date">${formatDate()}</div>
      <h1 class="home-title" id="home-title-btn">Hábitos</h1>
    </header>
    <div class="home-reminders" id="home-reminders">
      <p class="no-reminders">Cargando...</p>
    </div>
  `;
  renderBottomBar();
}

function renderBottomBar() {
  const bar = document.getElementById('bottom-bar');
  bar.innerHTML = '<p style="color:var(--t2);font-size:13px;">Módulos próximamente</p>';
}

function formatDate() {
  const d = new Date();
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderHomeScreen();
});
