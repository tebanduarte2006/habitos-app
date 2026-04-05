// modules/mental.js — Módulo Mental (hub interactivo)

// ─── Styles ───────────────────────────────────────────────────────────────────
(function() {
  if (document.getElementById('mental-styles')) return;
  var s = document.createElement('style');
  s.id  = 'mental-styles';
  s.textContent = [
    // Grids
    '.mental-sections-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:20px 16px 32px; }',
    '.mental-cards-grid    { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:16px 16px 32px; }',

    // Section cards (Nivel 1)
    '.mental-section-card { background:var(--bg-card); border-radius:var(--radius-xl); border:0.5px solid var(--separator); padding:20px 14px 18px; display:flex; flex-direction:column; align-items:center; gap:8px; cursor:pointer; -webkit-tap-highlight-color:transparent; transition:opacity .15s; }',
    '.mental-section-card:active { opacity:.7; }',
    '.mental-section-icon  { font-size:40px; line-height:1; }',
    '.mental-section-label { font-size:16px; font-weight:700; color:var(--text-primary); font-family:-apple-system,sans-serif; text-align:center; }',
    '.mental-section-desc  { font-size:12px; font-weight:400; color:var(--text-tertiary); font-family:-apple-system,sans-serif; text-align:center; line-height:1.4; }',

    // Technique cards (Nivel 2)
    '.mental-card { background:var(--bg-card); border-radius:var(--radius-lg); border:0.5px solid var(--separator); padding:18px 12px 14px; display:flex; flex-direction:column; align-items:center; gap:8px; cursor:pointer; -webkit-tap-highlight-color:transparent; transition:opacity .15s; }',
    '.mental-card:active { opacity:.7; }',
    '.mental-card-icon  { font-size:32px; line-height:1; }',
    '.mental-card-label { font-size:13px; font-weight:600; color:var(--text-primary); font-family:-apple-system,sans-serif; text-align:center; line-height:1.3; }',

    // Placeholder (Nivel 3)
    '.mental-placeholder { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:64px 32px; text-align:center; }',
    '.mental-placeholder-icon  { font-size:56px; margin-bottom:20px; }',
    '.mental-placeholder-title { font-size:20px; font-weight:700; color:var(--text-primary); font-family:-apple-system,sans-serif; margin-bottom:8px; }',
    '.mental-placeholder-sub   { font-size:15px; color:var(--text-tertiary); font-family:-apple-system,sans-serif; }',

    // Config form
    '.mental-cfg-group-label { font-size:12px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:.06em; padding:20px 16px 6px; font-family:-apple-system,sans-serif; }',
    '.mental-cfg-group { background:var(--bg-card); border-radius:var(--radius-lg); margin:0 16px 4px; overflow:hidden; }',
    '.mental-cfg-row   { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:.5px solid var(--separator); }',
    '.mental-cfg-row:last-child { border-bottom:none; }',
    '.mental-cfg-lbl   { font-size:15px; color:var(--text-primary); font-family:-apple-system,sans-serif; flex:1; }',
    '.mental-cfg-input { width:70px; background:var(--bg-card-2); border:none; border-radius:10px; color:var(--text-primary); font-size:15px; font-weight:600; text-align:center; padding:7px 8px; font-family:-apple-system,sans-serif; }',
    '.mental-cfg-input:focus { outline:2px solid #5e5ce6; }',
    '.mental-cfg-actions { display:flex; gap:12px; margin:20px 16px 40px; }',
    '.mental-cfg-save  { flex:1; background:#5e5ce6; border:none; border-radius:980px; color:#fff; font-size:16px; font-weight:700; padding:14px; cursor:pointer; font-family:-apple-system,sans-serif; }',
    '.mental-cfg-reset { flex:1; background:var(--bg-card); border:none; border-radius:980px; color:var(--text-secondary); font-size:15px; font-weight:600; padding:14px; cursor:pointer; border:.5px solid var(--separator); font-family:-apple-system,sans-serif; }',

    // Gear button in header
    '#mental-gear-btn { background:none; border:none; font-size:20px; cursor:pointer; padding:4px 0; color:var(--text-secondary); -webkit-tap-highlight-color:transparent; }',

    // ── Phase B: Technique views ──────────────────────────────────────────────
    '.mental-tech-view { padding:12px 16px 80px; }',
    '.mental-tech-section { background:var(--bg-card); border-radius:var(--radius-lg); border:0.5px solid var(--separator); padding:16px; margin-bottom:12px; }',

    // Guide
    '.mental-guide-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; cursor:pointer; -webkit-tap-highlight-color:transparent; }',
    '.mental-guide-title { font-size:12px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:.06em; font-family:-apple-system,sans-serif; }',
    '.mental-guide-toggle-btn { font-size:12px; color:rgba(94,92,230,0.85); font-family:-apple-system,sans-serif; }',
    '.mental-guide-step { display:flex; gap:10px; margin-bottom:10px; align-items:flex-start; }',
    '.mental-guide-step:last-child { margin-bottom:0; }',
    '.mental-guide-num { width:20px; height:20px; min-width:20px; border-radius:50%; background:rgba(94,92,230,0.15); color:#5e5ce6; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; font-family:-apple-system,sans-serif; margin-top:2px; flex-shrink:0; }',
    '.mental-guide-text { font-size:14px; color:var(--text-secondary); font-family:-apple-system,sans-serif; line-height:1.55; }',

    // Alert note
    '.mental-tech-alert { background:rgba(255,159,10,0.12); border:0.5px solid rgba(255,159,10,0.28); border-radius:var(--radius-md); padding:12px 14px; font-size:13px; color:rgba(255,200,100,0.9); font-family:-apple-system,sans-serif; line-height:1.5; }',

    // Schedule tag
    '.mental-schedule-tag { display:flex; align-items:flex-start; gap:6px; background:rgba(94,92,230,0.10); border:0.5px solid rgba(94,92,230,0.22); border-radius:var(--radius-sm); padding:8px 12px; }',
    '.mental-schedule-icon { font-size:13px; flex-shrink:0; line-height:1.5; }',
    '.mental-schedule-text { font-size:12px; color:rgba(255,255,255,0.55); font-family:-apple-system,sans-serif; line-height:1.5; }',

    // Info toggle
    '.mental-info-btn { width:100%; background:none; border:none; display:flex; align-items:center; justify-content:space-between; padding:0; cursor:pointer; font-family:-apple-system,sans-serif; -webkit-tap-highlight-color:transparent; }',
    '.mental-info-lbl { font-size:13px; font-weight:600; color:rgba(255,255,255,0.38); }',
    '.mental-info-chev { font-size:14px; color:rgba(255,255,255,0.25); transition:transform .25s ease; display:inline-block; }',
    '.mental-info-body { font-size:13px; color:rgba(255,255,255,0.48); font-family:-apple-system,sans-serif; line-height:1.65; padding-top:10px; }',

    // Metronome
    '.mental-metro { display:flex; flex-direction:column; align-items:center; gap:6px; padding:4px 0; }',
    '.mental-metro-cwrap { width:200px; height:200px; display:flex; align-items:center; justify-content:center; }',
    '.mental-metro-circle { width:160px; height:160px; border-radius:50%; border:3px solid #5e5ce6; display:flex; align-items:center; justify-content:center; transition:transform .12s linear, border-color .5s ease; background:rgba(94,92,230,0.07); }',
    '.mental-metro-phase { font-size:13px; font-weight:700; color:#fff; font-family:-apple-system,sans-serif; text-align:center; letter-spacing:.05em; padding:0 8px; line-height:1.2; }',
    '.mental-metro-sec { font-size:44px; font-weight:700; color:#fff; font-family:-apple-system,sans-serif; line-height:1; }',
    '.mental-metro-session { font-size:14px; color:var(--text-tertiary); font-family:-apple-system,sans-serif; }',
    '.mental-metro-cycles { font-size:13px; color:var(--text-tertiary); font-family:-apple-system,sans-serif; margin-bottom:4px; }',
    '.mental-metro-ctrl { display:flex; gap:10px; width:100%; margin-top:4px; }',
    '.mental-metro-done { font-size:15px; font-weight:600; color:#30d158; font-family:-apple-system,sans-serif; text-align:center; padding:14px 0; width:100%; }',

    // Simple timer
    '.mental-timer { display:flex; flex-direction:column; align-items:center; gap:16px; padding:4px 0; }',
    '.mental-timer-ring-wrap { position:relative; width:160px; height:160px; }',
    '.mental-timer-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }',
    '.mental-timer-time { font-size:38px; font-weight:700; color:#fff; font-family:-apple-system,sans-serif; letter-spacing:-1px; }',

    // Masaje timer
    '.mental-masaje { display:flex; flex-direction:column; align-items:center; gap:8px; padding:4px 0; width:100%; }',
    '.mental-masaje-name { font-size:17px; font-weight:700; color:#fff; font-family:-apple-system,sans-serif; text-align:center; line-height:1.3; }',
    '.mental-masaje-time { font-size:52px; font-weight:700; color:#fff; font-family:-apple-system,sans-serif; letter-spacing:-1px; line-height:1; }',
    '.mental-masaje-ind { font-size:13px; color:var(--text-tertiary); font-family:-apple-system,sans-serif; margin-bottom:4px; }',
    '.mental-masaje-ctrl { display:flex; gap:8px; width:100%; flex-wrap:wrap; margin-top:4px; }',

    // Ear diagram
    '.mental-ear-wrap { display:flex; justify-content:center; margin-bottom:12px; }'
  ].join('\n');
  document.head.appendChild(s);
}());

// ─── Defaults y config ────────────────────────────────────────────────────────
var MENTAL_DEFAULTS = {
  deuda_dopamina_min:          10,
  protocolo_no_dopamina_min:   20,
  protocolo_wakeful_rest_min:  10,
  coherencia_inhala_s:          5,
  coherencia_exhala_s:          5,
  coherencia_duracion_min:     10,
  suspiro_inhala1_s:            3,
  suspiro_inhala2_s:            1.5,
  suspiro_exhala_s:             5.5,
  suspiro_duracion_min:         5,
  humming_inhala_s:             4,
  humming_exhala_s:            13,
  humming_duracion_min:         5,
  inmersion_duracion_s:        30,
  masaje_por_direccion_min:     2,
  masaje_orejas:                2
};

function mentalGetConfig() {
  var raw = localStorage.getItem('mental_config');
  if (!raw) return Object.assign({}, MENTAL_DEFAULTS);
  try { return Object.assign({}, MENTAL_DEFAULTS, JSON.parse(raw)); }
  catch(e) { return Object.assign({}, MENTAL_DEFAULTS); }
}

// ─── Datos del módulo ─────────────────────────────────────────────────────────
var MENTAL_SECTIONS = [
  {
    id: 'flow',
    icon: '🎯',
    label: 'Flow State',
    desc: 'Prepara y ejecuta sesiones de enfoque profundo',
    cards: [
      { id: 'clasificacion',    icon: '📋', label: 'Clasificación'      },
      { id: 'deuda_dopamina',   icon: '🔇', label: 'Deuda de Dopamina'  },
      { id: 'sesion_enfoque',   icon: '⏱️', label: 'Sesión de Enfoque'  },
      { id: 'protocolo_salida', icon: '🚪', label: 'Protocolo de Salida' },
      { id: 'stats',            icon: '📊', label: 'Stats'              }
    ]
  },
  {
    id: 'recuperacion',
    icon: '🧘',
    label: 'Recuperación',
    desc: 'Técnicas de activación parasimpática',
    cards: [
      { id: 'coherencia', icon: '🫁',  label: 'Respiración Coherencia' },
      { id: 'suspiro',    icon: '😮‍💨', label: 'Suspiro Fisiológico'    },
      { id: 'humming',    icon: '🎵',  label: 'Humming'               },
      { id: 'inmersion',  icon: '🧊',  label: 'Inmersión Facial'       },
      { id: 'masaje',     icon: '👂',  label: 'Masaje Auricular'       }
    ]
  }
];

// ─── Timer cleanup global ─────────────────────────────────────────────────────
var _mentalTimers = [];

function mentalClearTimers() {
  _mentalTimers.forEach(function(id) { clearInterval(id); });
  _mentalTimers = [];
}

// ─── Formato tiempo ───────────────────────────────────────────────────────────
function mentalFmtMS(sec) {
  var s = Math.max(0, sec);
  var m = Math.floor(s / 60);
  var rem = Math.floor(s % 60);
  return m + ':' + (rem < 10 ? '0' : '') + rem;
}

function mentalFmtTime(sec) {
  var s = Math.max(0, Math.ceil(sec));
  if (s < 60) return s + 's';
  var m = Math.floor(s / 60);
  var rem = s % 60;
  return m + ':' + (rem < 10 ? '0' : '') + rem;
}

// ─── Header helper ────────────────────────────────────────────────────────────
function mentalSetHeader(title, backFn, showGear, gearFn) {
  mentalClearTimers();

  var titleEl = document.getElementById('module-title');
  if (titleEl) titleEl.textContent = '🧠 ' + title;

  var backBtn = document.getElementById('habitos-back-btn');
  if (backBtn) {
    var newBack = backBtn.cloneNode(true);
    backBtn.parentNode.replaceChild(newBack, backBtn);
    newBack.addEventListener('click', backFn || navigateHome);
  }

  var oldGear = document.getElementById('mental-gear-btn');
  if (oldGear) oldGear.remove();

  if (showGear && gearFn) {
    var gear = document.createElement('button');
    gear.id          = 'mental-gear-btn';
    gear.textContent = '⚙️';
    gear.addEventListener('click', gearFn);
    var header = document.getElementById('module-header');
    if (header) header.appendChild(gear);
  }
}

// ─── Punto de entrada ─────────────────────────────────────────────────────────
function renderMentalModule(container) {
  mentalShowHome(container);
}

// ─── Nivel 1 — Grid de secciones ─────────────────────────────────────────────
function mentalShowHome(container) {
  container.innerHTML = '';

  mentalSetHeader('Mental', navigateHome, true, function() {
    mentalShowConfig(container);
  });

  var grid = document.createElement('div');
  grid.className = 'mental-sections-grid';

  MENTAL_SECTIONS.forEach(function(section) {
    var card = document.createElement('div');
    card.className = 'mental-section-card';

    var iconEl  = document.createElement('div'); iconEl.className  = 'mental-section-icon';  iconEl.textContent  = section.icon;
    var labelEl = document.createElement('div'); labelEl.className = 'mental-section-label'; labelEl.textContent = section.label;
    var descEl  = document.createElement('div'); descEl.className  = 'mental-section-desc';  descEl.textContent  = section.desc;

    card.appendChild(iconEl);
    card.appendChild(labelEl);
    card.appendChild(descEl);
    card.addEventListener('click', function() { mentalShowSection(container, section); });
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// ─── Nivel 2 — Grid de cards de una sección ──────────────────────────────────
function mentalShowSection(container, section) {
  container.innerHTML = '';

  mentalSetHeader(section.label, function() { mentalShowHome(container); });

  var grid = document.createElement('div');
  grid.className = 'mental-cards-grid';

  section.cards.forEach(function(card) {
    var cardEl = document.createElement('div');
    cardEl.className = 'mental-card';

    var iconEl  = document.createElement('div'); iconEl.className  = 'mental-card-icon';  iconEl.textContent  = card.icon;
    var labelEl = document.createElement('div'); labelEl.className = 'mental-card-label'; labelEl.textContent = card.label;

    cardEl.appendChild(iconEl);
    cardEl.appendChild(labelEl);
    cardEl.addEventListener('click', function() { mentalShowCard(container, section, card); });
    grid.appendChild(cardEl);
  });

  container.appendChild(grid);
}

// ─── Nivel 3 — Router de técnicas ────────────────────────────────────────────
function mentalShowCard(container, section, card) {
  if (section.id === 'recuperacion') {
    switch (card.id) {
      case 'coherencia': return mentalShowCoherencia(container, section, card);
      case 'suspiro':    return mentalShowSuspiro(container, section, card);
      case 'humming':    return mentalShowHumming(container, section, card);
      case 'inmersion':  return mentalShowInmersion(container, section, card);
      case 'masaje':     return mentalShowMasaje(container, section, card);
    }
  }

  // Placeholder para técnicas no implementadas aún
  container.innerHTML = '';
  mentalSetHeader(card.label, function() { mentalShowSection(container, section); });

  var wrap = document.createElement('div');
  wrap.className = 'mental-placeholder';
  var iconEl  = document.createElement('div'); iconEl.className  = 'mental-placeholder-icon';  iconEl.textContent  = card.icon;
  var titleEl = document.createElement('div'); titleEl.className = 'mental-placeholder-title'; titleEl.textContent = 'Próximamente';
  var subEl   = document.createElement('div'); subEl.className   = 'mental-placeholder-sub';   subEl.textContent   = card.label;
  wrap.appendChild(iconEl);
  wrap.appendChild(titleEl);
  wrap.appendChild(subEl);
  container.appendChild(wrap);
}

// ─── Panel de Configuración ───────────────────────────────────────────────────
function mentalShowConfig(container) {
  container.innerHTML = '';

  mentalSetHeader('Configuración', function() { mentalShowHome(container); });

  var cfg    = mentalGetConfig();
  var inputs = {};

  function cfgGroup(label, fields) {
    var lbl = document.createElement('div');
    lbl.className   = 'mental-cfg-group-label';
    lbl.textContent = label;
    container.appendChild(lbl);

    var group = document.createElement('div');
    group.className = 'mental-cfg-group';

    fields.forEach(function(f) {
      var row = document.createElement('div');
      row.className = 'mental-cfg-row';

      var lbEl = document.createElement('label');
      lbEl.className   = 'mental-cfg-lbl';
      lbEl.textContent = f.label;
      row.appendChild(lbEl);

      var inp = document.createElement('input');
      inp.type      = 'number';
      inp.className = 'mental-cfg-input';
      inp.min       = f.min  !== undefined ? String(f.min)  : '1';
      inp.max       = f.max  !== undefined ? String(f.max)  : '';
      inp.step      = f.step !== undefined ? String(f.step) : '1';
      inp.value     = cfg[f.key];
      inputs[f.key] = inp;
      row.appendChild(inp);

      group.appendChild(row);
    });

    container.appendChild(group);
  }

  cfgGroup('Flow State', [
    { key: 'deuda_dopamina_min',         label: 'Deuda de dopamina (min)'      },
    { key: 'protocolo_no_dopamina_min',  label: 'Protocolo: sin dopamina (min)' },
    { key: 'protocolo_wakeful_rest_min', label: 'Protocolo: wakeful rest (min)' }
  ]);

  cfgGroup('Respiración de Coherencia', [
    { key: 'coherencia_inhala_s',    label: 'Inhalación (s)'     },
    { key: 'coherencia_exhala_s',    label: 'Exhalación (s)'     },
    { key: 'coherencia_duracion_min', label: 'Duración total (min)' }
  ]);

  cfgGroup('Suspiro Fisiológico', [
    { key: 'suspiro_inhala1_s',    label: 'Inhalación 1 (s)'    },
    { key: 'suspiro_inhala2_s',    label: 'Inhalación 2 (s)',    step: 0.5 },
    { key: 'suspiro_exhala_s',     label: 'Exhalación (s)',      step: 0.5 },
    { key: 'suspiro_duracion_min', label: 'Duración total (min)'            }
  ]);

  cfgGroup('Humming', [
    { key: 'humming_inhala_s',    label: 'Inhalación (s)'           },
    { key: 'humming_exhala_s',    label: 'Exhalación + zumbido (s)' },
    { key: 'humming_duracion_min', label: 'Duración total (min)'     }
  ]);

  cfgGroup('Inmersión Facial', [
    { key: 'inmersion_duracion_s', label: 'Duración (s)' }
  ]);

  cfgGroup('Masaje Auricular', [
    { key: 'masaje_por_direccion_min', label: 'Duración por dirección (min)' },
    { key: 'masaje_orejas',            label: 'Cantidad de orejas',           min: 1, max: 2 }
  ]);

  var actions  = document.createElement('div');
  actions.className = 'mental-cfg-actions';

  var saveBtn  = document.createElement('button');
  saveBtn.className   = 'mental-cfg-save';
  saveBtn.textContent = 'Guardar';
  saveBtn.addEventListener('click', function() {
    var newCfg = {};
    Object.keys(inputs).forEach(function(k) {
      var val = parseFloat(inputs[k].value);
      newCfg[k] = (isNaN(val) || val < 0) ? MENTAL_DEFAULTS[k] : val;
    });
    localStorage.setItem('mental_config', JSON.stringify(newCfg));
    showToast('Configuración guardada');
  });

  var resetBtn = document.createElement('button');
  resetBtn.className   = 'mental-cfg-reset';
  resetBtn.textContent = 'Restaurar defaults';
  resetBtn.addEventListener('click', function() {
    localStorage.removeItem('mental_config');
    mentalShowConfig(container);
    showToast('Configuración restaurada');
  });

  actions.appendChild(saveBtn);
  actions.appendChild(resetBtn);
  container.appendChild(actions);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Componentes reutilizables ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Separador de línea dentro de una card
function mentalMkInnerSep() {
  var d = document.createElement('div');
  d.style.cssText = 'height:0.5px;background:var(--separator);margin:12px -16px;';
  return d;
}

// Separador principal entre secciones
function mentalMkSep() {
  var d = document.createElement('div');
  d.style.cssText = 'height:0.5px;background:var(--separator-strong);margin:4px 0 16px;';
  return d;
}

// ─── Guía paso a paso ─────────────────────────────────────────────────────────
function createGuideSection(steps) {
  var container = document.createElement('div');

  var header = document.createElement('div');
  header.className = 'mental-guide-header';

  var title = document.createElement('div');
  title.className = 'mental-guide-title';
  title.textContent = 'Cómo hacerlo';

  var toggleBtn = document.createElement('span');
  toggleBtn.className = 'mental-guide-toggle-btn';
  toggleBtn.textContent = 'Ocultar';

  header.appendChild(title);
  header.appendChild(toggleBtn);

  var content = document.createElement('div');
  steps.forEach(function(text, i) {
    var step = document.createElement('div');
    step.className = 'mental-guide-step';
    var num = document.createElement('div');
    num.className = 'mental-guide-num';
    num.textContent = i + 1;
    var txt = document.createElement('div');
    txt.className = 'mental-guide-text';
    txt.textContent = text;
    step.appendChild(num);
    step.appendChild(txt);
    content.appendChild(step);
  });

  var expanded = true;
  function doToggle() {
    expanded = !expanded;
    content.style.display = expanded ? '' : 'none';
    toggleBtn.textContent = expanded ? 'Ocultar' : 'Ver guía';
  }
  header.addEventListener('click', doToggle);

  container._collapse = function() { if (expanded) doToggle(); };

  container.appendChild(header);
  container.appendChild(content);
  return container;
}

// ─── Tag de horario recomendado ───────────────────────────────────────────────
function createScheduleTag(text) {
  var tag = document.createElement('div');
  tag.className = 'mental-schedule-tag';
  var icon = document.createElement('span');
  icon.className = 'mental-schedule-icon';
  icon.textContent = '🕐';
  var txt = document.createElement('span');
  txt.className = 'mental-schedule-text';
  txt.textContent = text;
  tag.appendChild(icon);
  tag.appendChild(txt);
  return tag;
}

// ─── Toggle informativo ───────────────────────────────────────────────────────
function createInfoToggle(text) {
  var wrap = document.createElement('div');
  var btn = document.createElement('button');
  btn.className = 'mental-info-btn';
  var lbl = document.createElement('span');
  lbl.className = 'mental-info-lbl';
  lbl.textContent = '¿Por qué funciona?';
  var chev = document.createElement('span');
  chev.className = 'mental-info-chev';
  chev.textContent = '▾';
  btn.appendChild(lbl);
  btn.appendChild(chev);
  var body = document.createElement('div');
  body.className = 'mental-info-body';
  body.style.display = 'none';
  body.textContent = text;
  var open = false;
  btn.addEventListener('click', function() {
    open = !open;
    body.style.display = open ? '' : 'none';
    chev.style.transform = open ? 'rotate(180deg)' : '';
  });
  wrap.appendChild(btn);
  wrap.appendChild(body);
  return wrap;
}

// ─── Metrónomo de respiración ─────────────────────────────────────────────────
// opts: { phases:[{label,duration_s,color}], total_duration_min, onStart, onComplete }
function createBreathingMetronome(opts) {
  var totalSec   = Math.max(60, opts.total_duration_min * 60);
  var cycleDur   = opts.phases.reduce(function(a, p) { return a + Math.max(0.1, p.duration_s); }, 0);
  var totalCycles = Math.max(1, Math.round(totalSec / cycleDur));

  var phaseIdx = 0, cycleCount = 0, phaseElapsed = 0, sessionElapsed = 0;
  var running = false, intervalId = null;

  var wrap = document.createElement('div');
  wrap.className = 'mental-metro';

  // Circle
  var cwrap = document.createElement('div');
  cwrap.className = 'mental-metro-cwrap';
  var circle = document.createElement('div');
  circle.className = 'mental-metro-circle';
  circle.style.borderColor = opts.phases[0].color;
  circle.style.transform = 'scale(0.65)';
  var phaseLabel = document.createElement('div');
  phaseLabel.className = 'mental-metro-phase';
  phaseLabel.textContent = opts.phases[0].label;
  circle.appendChild(phaseLabel);
  cwrap.appendChild(circle);

  var secEl = document.createElement('div');
  secEl.className = 'mental-metro-sec';
  secEl.textContent = Math.ceil(opts.phases[0].duration_s) + 's';

  var sessionEl = document.createElement('div');
  sessionEl.className = 'mental-metro-session';
  sessionEl.textContent = mentalFmtMS(totalSec);

  var cyclesEl = document.createElement('div');
  cyclesEl.className = 'mental-metro-cycles';
  cyclesEl.textContent = 'Ciclo 0 / ' + totalCycles;

  var ctrlWrap = document.createElement('div');
  ctrlWrap.className = 'mental-metro-ctrl';

  var startBtn = document.createElement('button');
  startBtn.className = 'mental-cfg-save';
  startBtn.textContent = 'Comenzar';

  var pauseBtn = document.createElement('button');
  pauseBtn.className = 'mental-cfg-save';
  pauseBtn.textContent = 'Pausar';
  pauseBtn.style.display = 'none';

  var stopBtn = document.createElement('button');
  stopBtn.className = 'mental-cfg-reset';
  stopBtn.textContent = 'Terminar';
  stopBtn.style.display = 'none';

  function getScale(label, progress) {
    var lbl = label.toUpperCase();
    if (lbl.indexOf('INHALA CORTO') !== -1) return 1.0 + progress * 0.12;
    if (lbl.indexOf('INHALA') !== -1)       return 0.65 + progress * 0.35;
    if (lbl.indexOf('LENTO') !== -1)        return 1.12 - progress * 0.47;
    return 1.0 - progress * 0.35;
  }

  function updateUI() {
    var phase    = opts.phases[phaseIdx];
    var progress = Math.min(1, phaseElapsed / phase.duration_s);
    circle.style.transform = 'scale(' + getScale(phase.label, progress).toFixed(3) + ')';
    circle.style.borderColor = phase.color;
    phaseLabel.textContent = phase.label;
    secEl.textContent = Math.ceil(Math.max(0, phase.duration_s - phaseElapsed)) + 's';
    sessionEl.textContent = mentalFmtMS(Math.max(0, totalSec - sessionElapsed));
    cyclesEl.textContent = 'Ciclo ' + cycleCount + ' / ' + totalCycles;
  }

  function tick() {
    phaseElapsed   += 0.1;
    sessionElapsed += 0.1;
    var phase = opts.phases[phaseIdx];
    if (phaseElapsed >= phase.duration_s) {
      phaseElapsed -= phase.duration_s;
      phaseIdx = (phaseIdx + 1) % opts.phases.length;
      if (phaseIdx === 0) {
        cycleCount++;
        if (cycleCount >= totalCycles) {
          phaseElapsed = 0;
          finish();
          return;
        }
      }
    }
    updateUI();
  }

  function start() {
    if (opts.onStart) opts.onStart();
    phaseIdx = 0; cycleCount = 0; phaseElapsed = 0; sessionElapsed = 0;
    running = true;
    startBtn.style.display = 'none';
    pauseBtn.style.display = '';
    stopBtn.style.display  = '';
    intervalId = setInterval(tick, 100);
    _mentalTimers.push(intervalId);
    updateUI();
  }

  function togglePause() {
    if (running) {
      clearInterval(intervalId);
      _mentalTimers = _mentalTimers.filter(function(x) { return x !== intervalId; });
      intervalId = null; running = false;
      pauseBtn.textContent = 'Reanudar';
    } else {
      running = true;
      intervalId = setInterval(tick, 100);
      _mentalTimers.push(intervalId);
      pauseBtn.textContent = 'Pausar';
    }
  }

  function stopSession() {
    if (intervalId) { clearInterval(intervalId); _mentalTimers = _mentalTimers.filter(function(x) { return x !== intervalId; }); }
    running = false;
    showDone(cycleCount + ' ciclo' + (cycleCount !== 1 ? 's' : '') + ' completado' + (cycleCount !== 1 ? 's' : ''));
  }

  function finish() {
    if (intervalId) { clearInterval(intervalId); _mentalTimers = _mentalTimers.filter(function(x) { return x !== intervalId; }); }
    running = false;
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    showDone(totalCycles + ' ciclo' + (totalCycles !== 1 ? 's' : '') + ' completado' + (totalCycles !== 1 ? 's' : ''));
    if (opts.onComplete) opts.onComplete();
  }

  function showDone(msg) {
    ctrlWrap.innerHTML = '';
    var done = document.createElement('div');
    done.className = 'mental-metro-done';
    done.textContent = '✓ Sesión completada — ' + msg;
    ctrlWrap.appendChild(done);
    circle.style.borderColor = '#30d158';
    circle.style.transform   = 'scale(1)';
    phaseLabel.textContent   = '✓';
    secEl.textContent        = '';
  }

  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', togglePause);
  stopBtn.addEventListener('click', stopSession);

  ctrlWrap.appendChild(startBtn);
  ctrlWrap.appendChild(pauseBtn);
  ctrlWrap.appendChild(stopBtn);

  wrap.appendChild(cwrap);
  wrap.appendChild(secEl);
  wrap.appendChild(sessionEl);
  wrap.appendChild(cyclesEl);
  wrap.appendChild(ctrlWrap);
  return wrap;
}

// ─── Timer simple (countdown) ─────────────────────────────────────────────────
// opts: { duration_s, onStart, onComplete }
function createSimpleTimer(opts) {
  var total = Math.max(1, opts.duration_s);
  var remaining = total;
  var running = false, intervalId = null;
  var R = 62, CIRC = 2 * Math.PI * R;

  var wrap = document.createElement('div');
  wrap.className = 'mental-timer';

  // Ring
  var ringWrap = document.createElement('div');
  ringWrap.className = 'mental-timer-ring-wrap';

  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '160'); svg.setAttribute('height', '160');
  svg.setAttribute('viewBox', '0 0 160 160');

  var track = document.createElementNS(NS, 'circle');
  track.setAttribute('cx', '80'); track.setAttribute('cy', '80'); track.setAttribute('r', String(R));
  track.style.cssText = 'fill:none;stroke:rgba(255,255,255,0.08);stroke-width:8;';

  var prog = document.createElementNS(NS, 'circle');
  prog.setAttribute('cx', '80'); prog.setAttribute('cy', '80'); prog.setAttribute('r', String(R));
  prog.style.cssText = 'fill:none;stroke:#5e5ce6;stroke-width:8;stroke-linecap:round;' +
    'stroke-dasharray:' + CIRC.toFixed(2) + ';stroke-dashoffset:0;' +
    'transform:rotate(-90deg);transform-origin:80px 80px;transition:stroke-dashoffset .1s linear;';

  svg.appendChild(track);
  svg.appendChild(prog);
  ringWrap.appendChild(svg);

  var overlay = document.createElement('div');
  overlay.className = 'mental-timer-overlay';
  var timeEl = document.createElement('div');
  timeEl.className = 'mental-timer-time';
  timeEl.textContent = mentalFmtTime(remaining);
  overlay.appendChild(timeEl);
  ringWrap.appendChild(overlay);

  var ctrlWrap = document.createElement('div');
  ctrlWrap.className = 'mental-metro-ctrl';

  var startBtn = document.createElement('button');
  startBtn.className = 'mental-cfg-save'; startBtn.textContent = 'Comenzar';

  var pauseBtn = document.createElement('button');
  pauseBtn.className = 'mental-cfg-save'; pauseBtn.textContent = 'Pausar';
  pauseBtn.style.display = 'none';

  var stopBtn = document.createElement('button');
  stopBtn.className = 'mental-cfg-reset'; stopBtn.textContent = 'Terminar';
  stopBtn.style.display = 'none';

  function updateUI() {
    var pct = remaining / total;
    prog.style.strokeDashoffset = String((CIRC * (1 - pct)).toFixed(2));
    timeEl.textContent = mentalFmtTime(remaining);
  }

  function tick() {
    remaining -= 0.1;
    if (remaining <= 0) { remaining = 0; updateUI(); finish(); return; }
    updateUI();
  }

  function start() {
    if (opts.onStart) opts.onStart();
    remaining = total; running = true;
    startBtn.style.display = 'none';
    pauseBtn.style.display = ''; stopBtn.style.display = '';
    intervalId = setInterval(tick, 100);
    _mentalTimers.push(intervalId);
  }

  function togglePause() {
    if (running) {
      clearInterval(intervalId);
      _mentalTimers = _mentalTimers.filter(function(x) { return x !== intervalId; });
      intervalId = null; running = false;
      pauseBtn.textContent = 'Reanudar';
    } else {
      running = true;
      intervalId = setInterval(tick, 100);
      _mentalTimers.push(intervalId);
      pauseBtn.textContent = 'Pausar';
    }
  }

  function stopSession() {
    if (intervalId) { clearInterval(intervalId); _mentalTimers = _mentalTimers.filter(function(x) { return x !== intervalId; }); }
    running = false; showDone('Terminado');
  }

  function finish() {
    if (intervalId) { clearInterval(intervalId); _mentalTimers = _mentalTimers.filter(function(x) { return x !== intervalId; }); }
    running = false;
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    prog.style.stroke = '#30d158';
    showDone('Completado');
    if (opts.onComplete) opts.onComplete();
  }

  function showDone(msg) {
    ctrlWrap.innerHTML = '';
    var done = document.createElement('div');
    done.className = 'mental-metro-done';
    done.textContent = '✓ ' + msg;
    ctrlWrap.appendChild(done);
  }

  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', togglePause);
  stopBtn.addEventListener('click', stopSession);
  ctrlWrap.appendChild(startBtn); ctrlWrap.appendChild(pauseBtn); ctrlWrap.appendChild(stopBtn);

  wrap.appendChild(ringWrap);
  wrap.appendChild(ctrlWrap);
  return wrap;
}

// ─── Timer guiado por fases (Masaje Auricular) ────────────────────────────────
// opts: { durPerPhase_s, numOrejas, onStart, onComplete }
function createMasajeTimer(opts) {
  var allPhases = [
    'Oreja izquierda — sentido horario',
    'Oreja izquierda — sentido antihorario',
    'Oreja derecha — sentido horario',
    'Oreja derecha — sentido antihorario'
  ];
  var phases = opts.numOrejas <= 1 ? allPhases.slice(0, 2) : allPhases;
  var totalPhases = phases.length;
  var phaseIdx = 0, remaining = opts.durPerPhase_s;
  var running = false, intervalId = null;

  var wrap = document.createElement('div');
  wrap.className = 'mental-masaje';

  var nameEl = document.createElement('div');
  nameEl.className = 'mental-masaje-name';
  nameEl.textContent = phases[0];

  var timeEl = document.createElement('div');
  timeEl.className = 'mental-masaje-time';
  timeEl.textContent = mentalFmtMS(remaining);

  var indEl = document.createElement('div');
  indEl.className = 'mental-masaje-ind';
  indEl.textContent = 'Fase 1 de ' + totalPhases;

  var ctrlWrap = document.createElement('div');
  ctrlWrap.className = 'mental-masaje-ctrl';

  var startBtn = document.createElement('button');
  startBtn.className = 'mental-cfg-save'; startBtn.textContent = 'Comenzar';
  startBtn.style.flex = '1 1 100%';

  var pauseBtn = document.createElement('button');
  pauseBtn.className = 'mental-cfg-save'; pauseBtn.textContent = 'Pausar';
  pauseBtn.style.cssText = 'flex:1;display:none;';

  var skipBtn = document.createElement('button');
  skipBtn.className = 'mental-cfg-reset'; skipBtn.textContent = 'Saltar';
  skipBtn.style.cssText = 'flex:1;display:none;';

  var stopBtn = document.createElement('button');
  stopBtn.className = 'mental-cfg-reset'; stopBtn.textContent = 'Terminar';
  stopBtn.style.cssText = 'flex:1;display:none;';

  function updateUI() {
    timeEl.textContent = mentalFmtMS(remaining);
    indEl.textContent  = 'Fase ' + (phaseIdx + 1) + ' de ' + totalPhases;
    nameEl.textContent = phases[phaseIdx] || '';
  }

  function nextPhase() {
    phaseIdx++;
    if (phaseIdx >= totalPhases) { finish(); return; }
    remaining = opts.durPerPhase_s;
    if (navigator.vibrate) navigator.vibrate(200);
    updateUI();
  }

  function tick() {
    remaining -= 0.1;
    if (remaining <= 0) { remaining = 0; updateUI(); nextPhase(); return; }
    updateUI();
  }

  function start() {
    if (opts.onStart) opts.onStart();
    phaseIdx = 0; remaining = opts.durPerPhase_s; running = true;
    startBtn.style.display = 'none';
    pauseBtn.style.display = ''; skipBtn.style.display = ''; stopBtn.style.display = '';
    intervalId = setInterval(tick, 100);
    _mentalTimers.push(intervalId);
    updateUI();
  }

  function togglePause() {
    if (running) {
      clearInterval(intervalId);
      _mentalTimers = _mentalTimers.filter(function(x) { return x !== intervalId; });
      intervalId = null; running = false;
      pauseBtn.textContent = 'Reanudar';
    } else {
      running = true;
      intervalId = setInterval(tick, 100);
      _mentalTimers.push(intervalId);
      pauseBtn.textContent = 'Pausar';
    }
  }

  function skip() {
    if (intervalId) { clearInterval(intervalId); _mentalTimers = _mentalTimers.filter(function(x) { return x !== intervalId; }); intervalId = null; }
    running = false;
    phaseIdx++;
    if (phaseIdx >= totalPhases) { finish(); return; }
    remaining = opts.durPerPhase_s;
    updateUI();
    running = true;
    intervalId = setInterval(tick, 100);
    _mentalTimers.push(intervalId);
  }

  function stopSession() {
    if (intervalId) { clearInterval(intervalId); _mentalTimers = _mentalTimers.filter(function(x) { return x !== intervalId; }); }
    running = false; showDone('Sesión terminada');
  }

  function finish() {
    if (intervalId) { clearInterval(intervalId); _mentalTimers = _mentalTimers.filter(function(x) { return x !== intervalId; }); }
    running = false;
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    showDone('Sesión completada');
    if (opts.onComplete) opts.onComplete();
  }

  function showDone(msg) {
    ctrlWrap.innerHTML = '';
    var done = document.createElement('div');
    done.className = 'mental-metro-done';
    done.textContent = '✓ ' + msg;
    done.style.width = '100%';
    ctrlWrap.appendChild(done);
    nameEl.textContent = '✓ Listo';
  }

  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', togglePause);
  skipBtn.addEventListener('click', skip);
  stopBtn.addEventListener('click', stopSession);

  ctrlWrap.appendChild(startBtn); ctrlWrap.appendChild(pauseBtn);
  ctrlWrap.appendChild(skipBtn);  ctrlWrap.appendChild(stopBtn);

  wrap.appendChild(nameEl); wrap.appendChild(timeEl);
  wrap.appendChild(indEl);  wrap.appendChild(ctrlWrap);
  return wrap;
}

// ─── Diagrama SVG de la oreja ─────────────────────────────────────────────────
function createEarDiagram() {
  var wrap = document.createElement('div');
  wrap.className = 'mental-ear-wrap';

  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 360 320');
  svg.setAttribute('width',   '200');
  svg.setAttribute('height',  '178');
  svg.style.cssText = 'display:block;margin:0 auto;overflow:visible;';

  function p(tag, attrs, styleStr) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function(k) { e.setAttribute(k, String(attrs[k])); });
    if (styleStr) e.style.cssText = styleStr;
    return e;
  }
  function txt(x, y, content, sz, fw, fill, anchor) {
    var t = document.createElementNS(NS, 'text');
    t.setAttribute('x', String(x)); t.setAttribute('y', String(y));
    t.setAttribute('font-family', '-apple-system,BlinkMacSystemFont,sans-serif');
    t.setAttribute('font-size', String(sz));
    t.setAttribute('font-weight', String(fw));
    t.setAttribute('fill', fill);
    if (anchor) t.setAttribute('text-anchor', anchor);
    t.textContent = content;
    return t;
  }

  // Outer helix — main ear outline
  svg.appendChild(p('path', {
    d: 'M 172,288 C 138,288 112,270 106,246 C 100,220 110,198 108,172 C 106,144 96,118 98,88 C 100,55 124,16 170,12 C 210,9 244,42 248,82 C 252,118 240,156 238,182 C 236,202 240,218 236,234 C 230,258 212,272 196,278 C 186,282 182,286 182,290 L 172,290 Z'
  }, 'fill:none;stroke:#8e8e93;stroke-width:2.5;stroke-linejoin:round;'));

  // Antihelix ridge
  svg.appendChild(p('path', {
    d: 'M 156,272 C 148,252 144,230 146,207 C 148,190 156,180 154,162 C 152,145 144,135 146,118 C 149,101 162,94 165,78 C 168,62 166,46 156,38 C 148,31 136,37 134,50'
  }, 'fill:none;stroke:#555558;stroke-width:2;stroke-linecap:round;'));

  // Superior crus of antihelix
  svg.appendChild(p('path', {
    d: 'M 154,158 C 172,148 192,146 210,153'
  }, 'fill:none;stroke:#555558;stroke-width:1.5;stroke-linecap:round;'));

  // Crus of helix
  svg.appendChild(p('path', {
    d: 'M 166,182 C 184,176 202,176 218,182'
  }, 'fill:none;stroke:#555558;stroke-width:1.5;stroke-linecap:round;'));

  // Ear canal
  svg.appendChild(p('ellipse', { cx: 220, cy: 210, rx: 15, ry: 13 },
    'fill:#0a0a0a;stroke:#636366;stroke-width:1.5;'));

  // Earlobe
  svg.appendChild(p('path', {
    d: 'M 156,272 C 150,282 156,292 170,293 C 182,294 188,286 186,278'
  }, 'fill:rgba(255,255,255,0.03);stroke:#555558;stroke-width:1.5;stroke-linecap:round;'));

  // Zone 1: Cymba concha (upper hollow — above crus of helix)
  svg.appendChild(p('ellipse', { cx: 200, cy: 118, rx: 24, ry: 21 },
    'fill:#5e5ce6;fill-opacity:0.28;stroke:#5e5ce6;stroke-width:2;'));

  // Zone 2: Tragus (cartilage protrusion in front of canal)
  svg.appendChild(p('path', {
    d: 'M 148,185 C 138,193 136,210 141,220 C 147,230 163,232 172,222 C 178,214 177,200 170,192 C 163,183 155,180 148,185 Z'
  }, 'fill:#bf5af2;fill-opacity:0.28;stroke:#bf5af2;stroke-width:2;'));

  // Zone 1 connector line + dot
  svg.appendChild(p('line', { x1: 222, y1: 109, x2: 258, y2: 82 },
    'stroke:#5e5ce6;stroke-width:1.2;stroke-linecap:round;'));
  svg.appendChild(p('circle', { cx: 258, cy: 82, r: 2.5 }, 'fill:#5e5ce6;'));

  // Zone 2 connector line + dot
  svg.appendChild(p('line', { x1: 148, y1: 218, x2: 86, y2: 250 },
    'stroke:#bf5af2;stroke-width:1.2;stroke-linecap:round;'));
  svg.appendChild(p('circle', { cx: 86, cy: 250, r: 2.5 }, 'fill:#bf5af2;'));

  // Zone 1 labels (right side)
  svg.appendChild(txt(264, 80,  'Zona 1',       11, '700', '#5e5ce6',                   'start'));
  svg.appendChild(txt(264, 94,  'hueco interior', 10, '400', 'rgba(255,255,255,0.40)', 'start'));

  // Zone 2 labels (left side, right-aligned)
  svg.appendChild(txt(80, 244, 'Zona 2',        11, '700', '#bf5af2',                   'end'));
  svg.appendChild(txt(80, 258, 'solapa frontal', 10, '400', 'rgba(255,255,255,0.40)',  'end'));

  wrap.appendChild(svg);
  return wrap;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Técnicas de Recuperación ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Construye la estructura común: info card + separador + timer card
function mentalBuildTechView(container, section, card, buildFn) {
  container.innerHTML = '';
  mentalSetHeader(card.label, function() { mentalShowSection(container, section); });
  var view = document.createElement('div');
  view.className = 'mental-tech-view';
  buildFn(view);
  container.appendChild(view);
}

// ─── Técnica 1: Respiración de Coherencia ────────────────────────────────────
function mentalShowCoherencia(container, section, card) {
  mentalBuildTechView(container, section, card, function(view) {
    var cfg = mentalGetConfig();

    var infoCard = document.createElement('div');
    infoCard.className = 'mental-tech-section';

    var guide = createGuideSection([
      'Siéntate con la espalda recta en una posición cómoda.',
      'Inhala por la nariz durante ' + cfg.coherencia_inhala_s + ' segundos.',
      'Exhala por la nariz durante ' + cfg.coherencia_exhala_s + ' segundos.',
      'Mantén el ritmo constante. No fuerces la respiración.'
    ]);
    infoCard.appendChild(guide);
    infoCard.appendChild(mentalMkInnerSep());
    infoCard.appendChild(createScheduleTag('Mañana (antes del desayuno) · La receptividad vagal es mayor en la mañana; estabiliza la HRV para el resto del día.'));
    infoCard.appendChild(mentalMkInnerSep());
    infoCard.appendChild(createInfoToggle('A exactamente 6 respiraciones por minuto (0.1 Hz), tu sistema cardiovascular entra en resonancia: la variabilidad de tu frecuencia cardíaca se maximiza, lo que significa que tu corazón y tu sistema nervioso están sincronizados de forma óptima. Esto reduce cortisol, baja la presión arterial y mejora la atención sostenida. No es relajación genérica: es una frecuencia específica con efectos medibles.'));
    view.appendChild(infoCard);
    view.appendChild(mentalMkSep());

    var timerCard = document.createElement('div');
    timerCard.className = 'mental-tech-section';
    timerCard.appendChild(createBreathingMetronome({
      phases: [
        { label: 'INHALA', duration_s: cfg.coherencia_inhala_s, color: '#5e5ce6' },
        { label: 'EXHALA', duration_s: cfg.coherencia_exhala_s, color: '#30d158' }
      ],
      total_duration_min: cfg.coherencia_duracion_min,
      onStart: function() { guide._collapse(); }
    }));
    view.appendChild(timerCard);
  });
}

// ─── Técnica 2: Suspiro Fisiológico ──────────────────────────────────────────
function mentalShowSuspiro(container, section, card) {
  mentalBuildTechView(container, section, card, function(view) {
    var cfg = mentalGetConfig();

    var infoCard = document.createElement('div');
    infoCard.className = 'mental-tech-section';

    var guide = createGuideSection([
      'Inhala profundamente por la nariz hasta llenar los pulmones.',
      'Sin exhalar, haz una segunda inhalación corta por la nariz (un "sorbito" de aire extra).',
      'Exhala muy lentamente por la boca, con los labios ligeramente cerrados (como soplando por un pitillo). La exhalación debe durar más que ambas inhalaciones combinadas.'
    ]);
    infoCard.appendChild(guide);
    infoCard.appendChild(mentalMkInnerSep());
    infoCard.appendChild(createScheduleTag('En cualquier momento de estrés agudo · Tu herramienta de emergencia para disolver tensión en segundos.'));
    infoCard.appendChild(mentalMkInnerSep());
    infoCard.appendChild(createInfoToggle('Las exhalaciones largas activan directamente el nervio vago. La doble inhalación maximiza la superficie alveolar de intercambio de gases, haciendo que la exhalación larga sea más eficiente para eliminar CO₂. Un estudio de Stanford (2023, Cell Reports Medicine) demostró que 5 minutos diarios de esta técnica superan a la meditación mindfulness en reducción de excitación fisiológica.'));
    view.appendChild(infoCard);
    view.appendChild(mentalMkSep());

    var timerCard = document.createElement('div');
    timerCard.className = 'mental-tech-section';
    timerCard.appendChild(createBreathingMetronome({
      phases: [
        { label: 'INHALA',       duration_s: cfg.suspiro_inhala1_s, color: '#5e5ce6' },
        { label: 'INHALA CORTO', duration_s: cfg.suspiro_inhala2_s, color: '#bf5af2' },
        { label: 'EXHALA LENTO', duration_s: cfg.suspiro_exhala_s,  color: '#30d158' }
      ],
      total_duration_min: cfg.suspiro_duracion_min,
      onStart: function() { guide._collapse(); }
    }));
    view.appendChild(timerCard);
  });
}

// ─── Técnica 3: Humming ───────────────────────────────────────────────────────
function mentalShowHumming(container, section, card) {
  mentalBuildTechView(container, section, card, function(view) {
    var cfg = mentalGetConfig();

    var infoCard = document.createElement('div');
    infoCard.className = 'mental-tech-section';

    var guide = createGuideSection([
      'Inhala profundamente por la nariz.',
      'Al exhalar, produce un sonido constante de "Mmmmm" (tararear con la boca cerrada). Siente la vibración en garganta, nariz y pecho.',
      'Intenta que cada exhalación con zumbido dure ' + cfg.humming_exhala_s + ' segundos. Si al principio no llegas, empieza con lo que puedas.'
    ]);
    infoCard.appendChild(guide);
    infoCard.appendChild(mentalMkInnerSep());
    infoCard.appendChild(createScheduleTag('Transición post-trabajo (18:00-19:00) · Marca el límite entre la demanda cognitiva del día y el descanso. Señal definitiva al sistema nervioso de que la jornada terminó.'));
    infoCard.appendChild(mentalMkInnerSep());
    infoCard.appendChild(createInfoToggle('El nervio vago inerva los músculos de tu laringe y faringe. Al tararear, las vibraciones mecánicas estimulan directamente las fibras vagales en esa zona. Además, el humming genera niveles altos de óxido nítrico en los senos nasales, favoreciendo la vasodilatación cerebral. Estudios muestran que esta técnica aumenta la variabilidad cardíaca más que la respiración lenta convencional sola.'));
    view.appendChild(infoCard);
    view.appendChild(mentalMkSep());

    var timerCard = document.createElement('div');
    timerCard.className = 'mental-tech-section';
    timerCard.appendChild(createBreathingMetronome({
      phases: [
        { label: 'INHALA',          duration_s: cfg.humming_inhala_s, color: '#5e5ce6' },
        { label: 'EXHALA + ZUMBIDO', duration_s: cfg.humming_exhala_s, color: '#ff9f0a' }
      ],
      total_duration_min: cfg.humming_duracion_min,
      onStart: function() { guide._collapse(); }
    }));
    view.appendChild(timerCard);
  });
}

// ─── Técnica 4: Inmersión Facial ──────────────────────────────────────────────
function mentalShowInmersion(container, section, card) {
  mentalBuildTechView(container, section, card, function(view) {
    var cfg = mentalGetConfig();

    var infoCard = document.createElement('div');
    infoCard.className = 'mental-tech-section';

    var guide = createGuideSection([
      'Llena un recipiente con agua fría (8-10°C, puedes agregar hielo al agua del grifo).',
      'Toma aire y mantén la respiración.',
      'Sumerge toda la cara: frente, ojos, mejillas y nariz deben estar cubiertos. Si no tienes recipiente, empapa una toalla con agua helada y cubre ojos y mejillas.',
      'Mantén entre 15 y 30 segundos.',
      'Saca la cara y respira normalmente.'
    ]);
    infoCard.appendChild(guide);

    var alertEl = document.createElement('div');
    alertEl.className = 'mental-tech-alert';
    alertEl.textContent = '⚠️ La zona clave es alrededor de los ojos y las mejillas. Los nervios que disparan la respuesta (trigémino) están concentrados ahí.';
    alertEl.style.marginTop = '12px';
    infoCard.appendChild(alertEl);

    infoCard.appendChild(mentalMkInnerSep());
    infoCard.appendChild(createScheduleTag('Después de un pico de estrés o agotamiento extremo · Un "reset mecánico" de emergencia. También funciona en la mañana para un golpe de alerta.'));
    infoCard.appendChild(mentalMkInnerSep());
    infoCard.appendChild(createInfoToggle('Estás activando el "reflejo de inmersión mamífero", una respuesta evolutiva que todos los mamíferos conservamos. Cuando tu cara detecta agua fría + ausencia de respiración, tu tronco cerebral interpreta que estás buceando y activa una respuesta de emergencia: baja la frecuencia cardíaca drásticamente, redirige sangre hacia cerebro y corazón, y fuerza la activación parasimpática. Es una de las formas más rápidas de resetear tu sistema nervioso en segundos.'));
    view.appendChild(infoCard);
    view.appendChild(mentalMkSep());

    var timerCard = document.createElement('div');
    timerCard.className = 'mental-tech-section';
    timerCard.appendChild(createSimpleTimer({
      duration_s: cfg.inmersion_duracion_s,
      onStart: function() { guide._collapse(); }
    }));
    view.appendChild(timerCard);
  });
}

// ─── Técnica 5: Masaje Auricular ──────────────────────────────────────────────
function mentalShowMasaje(container, section, card) {
  mentalBuildTechView(container, section, card, function(view) {
    var cfg = mentalGetConfig();

    // Ear diagram
    view.appendChild(createEarDiagram());

    var infoCard = document.createElement('div');
    infoCard.className = 'mental-tech-section';

    var guide = createGuideSection([
      'Tu oreja tiene terminaciones nerviosas conectadas al nervio vago. Vas a masajear dos zonas.',
      'Zona 1 — El "hueco" interior: Mete el dedo índice dentro de la oreja, justo arriba del agujero del oído. Sentirás un hueco en el cartílago (la parte cóncava más grande, arriba del canal auditivo). Masajea en círculos pequeños: 40-60 círculos en una dirección, luego 40-60 en la otra.',
      'Zona 2 — La "solapa" frente al oído: El pedazo de cartílago que sobresale justo frente al canal auditivo (si presionas sobre él, tapa parcialmente tu oído). Masajea con pulgar e índice en círculos suaves, misma cantidad de repeticiones.',
      'Repite en ambas orejas.'
    ]);
    infoCard.appendChild(guide);
    infoCard.appendChild(mentalMkInnerSep());
    infoCard.appendChild(createScheduleTag('Noche, como rutina de sueño (21:00-22:00) · Reduce citoquinas proinflamatorias y prepara al cerebro para la recuperación del sistema glinfático durante el sueño.'));
    infoCard.appendChild(mentalMkInnerSep());
    infoCard.appendChild(createInfoToggle('La rama auricular del nervio vago (nervio de Arnold) tiene terminaciones en estas zonas específicas. Al estimularlas manualmente, envías señales a los centros de regulación vagal en el tronco cerebral, reduciendo producción de adrenalina, bajando inflamación sistémica y mejorando calidad de sueño. Es el mismo principio de los dispositivos médicos de estimulación vagal transcutánea, pero con tus dedos.'));
    view.appendChild(infoCard);
    view.appendChild(mentalMkSep());

    var timerCard = document.createElement('div');
    timerCard.className = 'mental-tech-section';
    timerCard.appendChild(createMasajeTimer({
      durPerPhase_s: cfg.masaje_por_direccion_min * 60,
      numOrejas:     cfg.masaje_orejas,
      onStart: function() { guide._collapse(); }
    }));
    view.appendChild(timerCard);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// FASE C — Flow State
// ══════════════════════════════════════════════════════════════════════════════

// ─── Estilos Flow ─────────────────────────────────────────────────────────────
(function() {
  if (document.getElementById('mental-styles-flow')) return;
  var s = document.createElement('style');
  s.id = 'mental-styles-flow';
  s.textContent = [
    '.mental-prog-dots { display:flex; gap:8px; justify-content:center; margin-bottom:20px; }',
    '.mental-prog-dot { width:8px; height:8px; border-radius:50%; background:var(--separator-strong); }',
    '.mental-prog-dot.active { background:#5e5ce6; }',
    '.mental-prog-dot.done   { background:#30d158; }',
    '.mental-flow-milestone { position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:#5e5ce6; color:#fff; border-radius:20px; padding:10px 20px; font-size:14px; font-weight:600; z-index:9999; pointer-events:none; white-space:nowrap; font-family:-apple-system,sans-serif; }',
    '.mental-clas-header { font-size:13px; color:var(--text-secondary); margin-bottom:14px; line-height:1.5; font-family:-apple-system,sans-serif; }',
    '.mental-clas-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; }',
    '.mental-clas-q { background:rgba(255,255,255,0.04); border-radius:var(--radius-lg); padding:10px; min-height:80px; }',
    '.mental-clas-q-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; margin-bottom:8px; font-family:-apple-system,sans-serif; }',
    '.mental-clas-q-items { display:flex; flex-direction:column; gap:4px; }',
    '.mental-clas-task { display:flex; align-items:flex-start; gap:4px; }',
    '.mental-clas-task-txt { font-size:12px; color:var(--text-primary); line-height:1.3; flex:1; font-family:-apple-system,sans-serif; word-break:break-word; }',
    '.mental-clas-task-del { background:none; border:none; color:var(--text-tertiary); font-size:14px; cursor:pointer; padding:0 2px; flex-shrink:0; line-height:1; }',
    '.mental-clas-add { display:flex; gap:6px; }',
    '.mental-clas-inp { flex:1; background:var(--bg-card); border:1px solid var(--separator-strong); border-radius:var(--radius-lg); padding:8px 12px; font-size:14px; color:var(--text-primary); font-family:-apple-system,sans-serif; min-width:0; }',
    '.mental-clas-sel { background:var(--bg-card); border:1px solid var(--separator-strong); border-radius:var(--radius-lg); padding:8px 6px; font-size:11px; color:var(--text-primary); -webkit-appearance:none; flex-shrink:0; }',
    '.mental-clas-addbtn { background:#5e5ce6; border:none; border-radius:var(--radius-lg); padding:8px 14px; color:#fff; font-size:15px; font-weight:700; cursor:pointer; flex-shrink:0; }',
    '.mental-dur-row { display:flex; align-items:center; gap:10px; margin-top:8px; }',
    '.mental-dur-inp { width:64px; background:var(--bg-card); border:1px solid var(--separator-strong); border-radius:var(--radius-lg); padding:8px 0; font-size:22px; font-weight:700; color:var(--text-primary); text-align:center; font-family:-apple-system,sans-serif; flex-shrink:0; }',
    '.mental-dur-unit { font-size:14px; color:var(--text-secondary); font-family:-apple-system,sans-serif; }',
    '.mental-flow-start { flex:1; background:#5e5ce6; border:none; border-radius:var(--radius-xl); padding:12px; font-size:15px; font-weight:700; color:#fff; cursor:pointer; font-family:-apple-system,sans-serif; }',
    '.mental-proto-title { font-size:17px; font-weight:700; color:var(--text-primary); margin-bottom:6px; font-family:-apple-system,sans-serif; }',
    '.mental-proto-sub { font-size:14px; color:var(--text-secondary); margin-bottom:16px; line-height:1.5; font-family:-apple-system,sans-serif; }',
    '.mental-chips { display:flex; flex-wrap:wrap; gap:6px; margin:0 0 12px; min-height:4px; }',
    '.mental-chip { display:inline-flex; align-items:center; gap:4px; background:rgba(94,92,230,.18); border-radius:20px; padding:5px 10px; font-size:13px; color:#a8a6ff; font-family:-apple-system,sans-serif; }',
    '.mental-chip-x { background:none; border:none; color:#a8a6ff; font-size:15px; cursor:pointer; padding:0; line-height:1; }',
    '.mental-ac-wrap { position:relative; }',
    '.mental-ac-inp { width:100%; background:var(--bg-card); border:1px solid var(--separator-strong); border-radius:var(--radius-lg); padding:10px 14px; font-size:14px; color:var(--text-primary); box-sizing:border-box; font-family:-apple-system,sans-serif; }',
    '.mental-ac-drop { position:absolute; top:calc(100% + 4px); left:0; right:0; background:#1c1c1e; border:1px solid var(--separator-strong); border-radius:var(--radius-lg); z-index:200; overflow:hidden; }',
    '.mental-ac-opt { padding:10px 14px; font-size:14px; color:var(--text-primary); cursor:pointer; font-family:-apple-system,sans-serif; }',
    '.mental-ac-opt:hover,.mental-ac-opt:active { background:rgba(255,255,255,.08); }',
    '.mental-rating-row { display:flex; gap:8px; justify-content:center; margin:10px 0 6px; }',
    '.mental-rating-btn { width:46px; height:46px; border-radius:50%; border:2px solid var(--separator-strong); background:none; font-size:16px; font-weight:700; color:var(--text-secondary); cursor:pointer; font-family:-apple-system,sans-serif; }',
    '.mental-rating-btn.sel { border-color:#5e5ce6; background:#5e5ce6; color:#fff; }',
    '.mental-radio-grp { display:flex; flex-direction:column; gap:10px; margin:10px 0 16px; }',
    '.mental-radio-row { display:flex; align-items:center; gap:10px; cursor:pointer; -webkit-tap-highlight-color:transparent; }',
    '.mental-radio-dot { width:20px; height:20px; border-radius:50%; border:2px solid var(--separator-strong); flex-shrink:0; position:relative; }',
    '.mental-radio-dot.sel { border-color:#5e5ce6; background:#5e5ce6; }',
    '.mental-radio-dot.sel::after { content:""; position:absolute; width:8px; height:8px; border-radius:50%; background:#fff; top:50%; left:50%; transform:translate(-50%,-50%); }',
    '.mental-radio-lbl { font-size:14px; color:var(--text-primary); font-family:-apple-system,sans-serif; line-height:1.4; }',
    '.mental-notes-inp { width:100%; background:var(--bg-card); border:1px solid var(--separator-strong); border-radius:var(--radius-lg); padding:10px 14px; font-size:14px; color:var(--text-primary); resize:vertical; min-height:80px; box-sizing:border-box; font-family:-apple-system,sans-serif; }',
    '.mental-flow-next { width:100%; background:#5e5ce6; border:none; border-radius:var(--radius-xl); padding:13px; font-size:15px; font-weight:700; color:#fff; cursor:pointer; margin-top:16px; font-family:-apple-system,sans-serif; }',
    '.mental-flow-save { width:100%; background:#30d158; border:none; border-radius:var(--radius-xl); padding:13px; font-size:15px; font-weight:700; color:#fff; cursor:pointer; margin-top:16px; font-family:-apple-system,sans-serif; }',
    '.mental-flow-save:disabled { background:var(--separator-strong); color:var(--text-tertiary); cursor:not-allowed; }',
    '.mental-flow-sec-lbl { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:var(--text-tertiary); margin:14px 0 6px; font-family:-apple-system,sans-serif; }',
    '.mental-ses-sum { font-size:13px; color:var(--text-secondary); line-height:1.9; margin-bottom:12px; font-family:-apple-system,sans-serif; }',
    '.mental-clas-inp:focus,.mental-ac-inp:focus,.mental-notes-inp:focus,.mental-dur-inp:focus { outline:none; border-color:#5e5ce6; }'
  ].join('\n');
  document.head.appendChild(s);
}());

var _mentalFlowSessionData = null;

// ─── Override mentalShowCard con rutas de flow ────────────────────────────────
function mentalShowCard(container, section, card) {
  if (section.id === 'recuperacion') {
    switch (card.id) {
      case 'coherencia': return mentalShowCoherencia(container, section, card);
      case 'suspiro':    return mentalShowSuspiro(container, section, card);
      case 'humming':    return mentalShowHumming(container, section, card);
      case 'inmersion':  return mentalShowInmersion(container, section, card);
      case 'masaje':     return mentalShowMasaje(container, section, card);
    }
  }
  if (section.id === 'flow') {
    switch (card.id) {
      case 'clasificacion':    return mentalShowClasificacion(container, section, card);
      case 'deuda_dopamina':   return mentalShowDeudaDopamina(container, section, card);
      case 'sesion_enfoque':   return mentalShowSesionEnfoque(container, section, card);
      case 'protocolo_salida': return mentalShowProtocoloSalida(container, section, card);
    }
  }
  container.innerHTML = '';
  mentalSetHeader(card.label, function() { mentalShowSection(container, section); });
  var wrap = document.createElement('div'); wrap.className = 'mental-placeholder';
  var iconEl  = document.createElement('div'); iconEl.className  = 'mental-placeholder-icon';  iconEl.textContent  = card.icon;
  var titleEl = document.createElement('div'); titleEl.className = 'mental-placeholder-title'; titleEl.textContent = 'Próximamente';
  var subEl   = document.createElement('div'); subEl.className   = 'mental-placeholder-sub';   subEl.textContent   = card.label;
  wrap.appendChild(iconEl); wrap.appendChild(titleEl); wrap.appendChild(subEl);
  container.appendChild(wrap);
}

// ─── Progress dots ────────────────────────────────────────────────────────────
function mentalMkProgDots(total, current) {
  var wrap = document.createElement('div');
  wrap.className = 'mental-prog-dots';
  for (var i = 0; i < total; i++) {
    var dot = document.createElement('div');
    dot.className = 'mental-prog-dot' + (i < current ? ' done' : i === current ? ' active' : '');
    wrap.appendChild(dot);
  }
  return wrap;
}

// ─── Milestone badge ──────────────────────────────────────────────────────────
function mentalShowMilestoneBadge(text) {
  var badge = document.createElement('div');
  badge.className = 'mental-flow-milestone';
  badge.textContent = text;
  document.body.appendChild(badge);
  setTimeout(function() { if (badge.parentNode) badge.parentNode.removeChild(badge); }, 3000);
}

// ─── Flow 1: Clasificación de Tareas ─────────────────────────────────────────
function mentalShowClasificacion(container, section, card) {
  container.innerHTML = '';
  mentalSetHeader(card.label, function() { mentalShowSection(container, section); });
  var view = document.createElement('div'); view.className = 'mental-tech-view';
  var mainCard = document.createElement('div'); mainCard.className = 'mental-tech-section';

  var hdr = document.createElement('div'); hdr.className = 'mental-clas-header';
  hdr.textContent = 'Organiza tus tareas según dificultad e impacto para elegir la correcta al iniciar una sesión de flow.';
  mainCard.appendChild(hdr);

  var data;
  try { data = JSON.parse(localStorage.getItem('mental_tareas_clasificacion') || 'null') || {}; }
  catch(e) { data = {}; }

  var quads = [
    { id: 'flow',     label: '🎯 Flow Zone',  color: '#5e5ce6' },
    { id: 'win',      label: '⚡ Quick Win',   color: '#30d158' },
    { id: 'profundo', label: '🧠 Profundo',    color: '#0a84ff' },
    { id: 'defer',    label: '📌 Diferir',     color: '#636366' }
  ];
  quads.forEach(function(q) { if (!Array.isArray(data[q.id])) data[q.id] = []; });

  function save() { localStorage.setItem('mental_tareas_clasificacion', JSON.stringify(data)); }

  var grid = document.createElement('div'); grid.className = 'mental-clas-grid';
  var quadEls = {};
  quads.forEach(function(q) {
    var qEl = document.createElement('div'); qEl.className = 'mental-clas-q';
    qEl.style.borderTop = '2px solid ' + q.color;
    var lbl = document.createElement('div'); lbl.className = 'mental-clas-q-label';
    lbl.style.color = q.color; lbl.textContent = q.label;
    var items = document.createElement('div'); items.className = 'mental-clas-q-items';
    qEl.appendChild(lbl); qEl.appendChild(items);
    quadEls[q.id] = items;
    grid.appendChild(qEl);
  });
  mainCard.appendChild(grid);

  function renderQuad(qid) {
    var el = quadEls[qid]; el.innerHTML = '';
    (data[qid] || []).forEach(function(task, i) {
      var row = document.createElement('div'); row.className = 'mental-clas-task';
      var txt = document.createElement('span'); txt.className = 'mental-clas-task-txt'; txt.textContent = task;
      var del = document.createElement('button'); del.className = 'mental-clas-task-del'; del.textContent = '×';
      del.addEventListener('click', (function(idx) {
        return function() { data[qid].splice(idx, 1); save(); renderQuad(qid); };
      }(i)));
      row.appendChild(txt); row.appendChild(del); el.appendChild(row);
    });
  }
  quads.forEach(function(q) { renderQuad(q.id); });

  mainCard.appendChild(mentalMkInnerSep());
  var addRow = document.createElement('div'); addRow.className = 'mental-clas-add';
  var inp = document.createElement('input'); inp.type = 'text'; inp.placeholder = 'Nueva tarea…'; inp.className = 'mental-clas-inp';
  var sel = document.createElement('select'); sel.className = 'mental-clas-sel';
  quads.forEach(function(q) {
    var opt = document.createElement('option'); opt.value = q.id; opt.textContent = q.label; sel.appendChild(opt);
  });
  var addBtn = document.createElement('button'); addBtn.className = 'mental-clas-addbtn'; addBtn.textContent = '+';
  addBtn.addEventListener('click', function() {
    var val = inp.value.trim(); if (!val) return;
    data[sel.value].push(val); save(); renderQuad(sel.value);
    inp.value = ''; inp.focus();
  });
  inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); addBtn.click(); } });
  addRow.appendChild(inp); addRow.appendChild(sel); addRow.appendChild(addBtn);
  mainCard.appendChild(addRow);
  view.appendChild(mainCard);
  container.appendChild(view);
}

// ─── Flow 2: Deuda de Dopamina ────────────────────────────────────────────────
function mentalShowDeudaDopamina(container, section, card) {
  mentalBuildTechView(container, section, card, function(view) {
    var cfg = mentalGetConfig();
    var infoCard = document.createElement('div'); infoCard.className = 'mental-tech-section';
    var guide = createGuideSection([
      'Busca un espacio tranquilo sin pantallas ni notificaciones.',
      'Siéntate o recuéstate en silencio. No hagas nada que produzca dopamina fácil.',
      'Si surgen impulsos de revisar el teléfono o poner música, simplemente obsérvelos sin actuar.',
      'El objetivo es dejar que tu línea base de dopamina baje al nivel mínimo natural.'
    ]);
    infoCard.appendChild(guide);
    infoCard.appendChild(mentalMkInnerSep());
    infoCard.appendChild(createScheduleTag('Antes de una sesión de enfoque · Permite que tu dopamina base descienda para que el trabajo real sea más recompensante y el flow sea más accesible.'));
    infoCard.appendChild(mentalMkInnerSep());
    infoCard.appendChild(createInfoToggle('La dopamina no es una recompensa: es anticipación. Cada scroll y notificación eleva tu línea base. Cuando esa base está alta, el trabajo real — que produce dopamina de forma sostenida pero más lenta — no puede competir. Una pausa sin estímulos baja la base y restaura tu capacidad de encontrar recompensante el esfuerzo cognitivo.'));
    view.appendChild(infoCard);
    view.appendChild(mentalMkSep());
    var timerCard = document.createElement('div'); timerCard.className = 'mental-tech-section';
    timerCard.appendChild(createSimpleTimer({
      duration_s: cfg.deuda_dopamina_min * 60,
      onStart: function() { guide._collapse(); }
    }));
    view.appendChild(timerCard);
  });
}

// ─── Flow 3: Sesión de Enfoque ────────────────────────────────────────────────
function mentalShowSesionEnfoque(container, section, card) {
  _mentalFlowSessionData = null;
  renderEnfoqueSetup();

  function renderEnfoqueSetup() {
    container.innerHTML = '';
    mentalSetHeader(card.label, function() { mentalShowSection(container, section); });
    var view = document.createElement('div'); view.className = 'mental-tech-view';
    var infoCard = document.createElement('div'); infoCard.className = 'mental-tech-section';
    var guide = createGuideSection([
      'Silencia notificaciones y cierra pestañas que no necesitas.',
      'Elige UNA sola tarea de tu cuadrante Flow Zone o Profundo.',
      'Define cuánto tiempo vas a dedicar. No busques terminar la tarea, busca el tiempo en flow.',
      'Si aparece un pensamiento distractor, anótalo mentalmente y vuelve a la tarea.'
    ]);
    infoCard.appendChild(guide);
    infoCard.appendChild(mentalMkInnerSep());
    var durLbl = document.createElement('div'); durLbl.className = 'mental-flow-sec-lbl'; durLbl.textContent = 'Duración de la sesión';
    infoCard.appendChild(durLbl);
    var durRow = document.createElement('div'); durRow.className = 'mental-dur-row';
    var durInp = document.createElement('input');
    durInp.type = 'number'; durInp.min = '5'; durInp.max = '180'; durInp.value = '25';
    durInp.className = 'mental-dur-inp'; durInp.setAttribute('inputmode', 'numeric');
    var durUnit = document.createElement('span'); durUnit.className = 'mental-dur-unit'; durUnit.textContent = 'minutos';
    var startBtn = document.createElement('button'); startBtn.className = 'mental-flow-start'; startBtn.textContent = 'Iniciar Sesión';
    startBtn.addEventListener('click', function() {
      var min = parseInt(durInp.value, 10); if (isNaN(min) || min < 1) min = 25;
      renderEnfoqueTimer(min);
    });
    durRow.appendChild(durInp); durRow.appendChild(durUnit); durRow.appendChild(startBtn);
    infoCard.appendChild(durRow);
    view.appendChild(infoCard);
    container.appendChild(view);
  }

  function renderEnfoqueTimer(plannedMin) {
    var transitionCancelled = false;
    container.innerHTML = '';
    mentalSetHeader(card.label, function() { transitionCancelled = true; renderEnfoqueSetup(); });

    var total = plannedMin * 60, remaining = total, elapsed = 0;
    var running = false, intervalId = null;
    var nextMilestone = 900, halfShown = false;
    var now0 = new Date();
    var startTime = now0.getHours() + ':' + (now0.getMinutes() < 10 ? '0' : '') + now0.getMinutes();
    var R = 62, CIRC = 2 * Math.PI * R;
    var NS = 'http://www.w3.org/2000/svg';

    var view = document.createElement('div'); view.className = 'mental-tech-view';
    var timerCard = document.createElement('div'); timerCard.className = 'mental-tech-section';
    timerCard.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:14px;';

    var sesLbl = document.createElement('div'); sesLbl.className = 'mental-flow-sec-lbl';
    sesLbl.style.cssText = 'text-align:center;margin:0;';
    sesLbl.textContent = 'Sesión de ' + plannedMin + ' min';
    timerCard.appendChild(sesLbl);

    var ringWrap = document.createElement('div'); ringWrap.className = 'mental-timer-ring-wrap';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '160'); svg.setAttribute('height', '160'); svg.setAttribute('viewBox', '0 0 160 160');
    var track = document.createElementNS(NS, 'circle');
    track.setAttribute('cx', '80'); track.setAttribute('cy', '80'); track.setAttribute('r', String(R));
    track.style.cssText = 'fill:none;stroke:rgba(255,255,255,.08);stroke-width:8;';
    var prog = document.createElementNS(NS, 'circle');
    prog.setAttribute('cx', '80'); prog.setAttribute('cy', '80'); prog.setAttribute('r', String(R));
    prog.style.cssText = 'fill:none;stroke:#5e5ce6;stroke-width:8;stroke-linecap:round;' +
      'stroke-dasharray:' + CIRC.toFixed(2) + ';stroke-dashoffset:0;' +
      'transform:rotate(-90deg);transform-origin:80px 80px;transition:stroke-dashoffset .1s linear;';
    svg.appendChild(track); svg.appendChild(prog);
    ringWrap.appendChild(svg);
    var overlay = document.createElement('div'); overlay.className = 'mental-timer-overlay';
    var timeEl = document.createElement('div'); timeEl.className = 'mental-timer-time';
    timeEl.textContent = mentalFmtTime(remaining);
    overlay.appendChild(timeEl); ringWrap.appendChild(overlay);
    timerCard.appendChild(ringWrap);

    var ctrlWrap = document.createElement('div'); ctrlWrap.className = 'mental-metro-ctrl';
    var pauseBtn = document.createElement('button'); pauseBtn.className = 'mental-cfg-save'; pauseBtn.textContent = 'Pausar';
    var stopBtn  = document.createElement('button'); stopBtn.className  = 'mental-cfg-reset'; stopBtn.textContent  = 'Terminar';
    ctrlWrap.appendChild(pauseBtn); ctrlWrap.appendChild(stopBtn);
    timerCard.appendChild(ctrlWrap);
    view.appendChild(timerCard);
    container.appendChild(view);

    function updateUI() {
      var pct = remaining / total;
      prog.style.strokeDashoffset = String((CIRC * (1 - pct)).toFixed(2));
      timeEl.textContent = mentalFmtTime(remaining);
    }

    function tick() {
      remaining -= 0.1; elapsed += 0.1;
      if (remaining <= 0) { remaining = 0; elapsed = total; updateUI(); finishSession(false); return; }
      if (!halfShown && elapsed >= total / 2) {
        halfShown = true;
        mentalShowMilestoneBadge('🎯 Mitad alcanzada — ¡Sigue!');
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
      if (elapsed >= nextMilestone) {
        nextMilestone += 900;
        mentalShowMilestoneBadge('⚡ ' + Math.floor(elapsed / 60) + ' min en flow');
        if (navigator.vibrate) navigator.vibrate(150);
      }
      updateUI();
    }

    function togglePause() {
      if (running) {
        clearInterval(intervalId);
        _mentalTimers = _mentalTimers.filter(function(x) { return x !== intervalId; });
        intervalId = null; running = false; pauseBtn.textContent = 'Reanudar';
      } else {
        running = true; intervalId = setInterval(tick, 100); _mentalTimers.push(intervalId); pauseBtn.textContent = 'Pausar';
      }
    }

    function finishSession(stopped) {
      if (intervalId) {
        clearInterval(intervalId);
        _mentalTimers = _mentalTimers.filter(function(x) { return x !== intervalId; });
        intervalId = null;
      }
      running = false;
      var now1 = new Date();
      var endTime = now1.getHours() + ':' + (now1.getMinutes() < 10 ? '0' : '') + now1.getMinutes();
      _mentalFlowSessionData = {
        fecha: now1.toISOString().slice(0, 10),
        hora_inicio: startTime,
        hora_fin: endTime,
        duracion_planeada_min: plannedMin,
        duracion_real_s: Math.round(elapsed),
        distracciones: [],
        rating: null,
        cierre: null,
        notas: ''
      };
      if (!stopped && navigator.vibrate) navigator.vibrate([200, 100, 200]);
      prog.style.stroke = '#30d158';
      ctrlWrap.innerHTML = '';
      var doneEl = document.createElement('div'); doneEl.className = 'mental-metro-done';
      doneEl.textContent = stopped ? '↗ Sesión terminada' : '✓ ¡Sesión completada!';
      ctrlWrap.appendChild(doneEl);
      var protoCard = null;
      section.cards.forEach(function(c) { if (c.id === 'protocolo_salida') protoCard = c; });
      setTimeout(function() {
        if (transitionCancelled) return;
        if (protoCard) mentalShowProtocoloSalida(container, section, protoCard);
        else mentalShowSection(container, section);
      }, 1500);
    }

    pauseBtn.addEventListener('click', togglePause);
    stopBtn.addEventListener('click', function() { finishSession(true); });
    running = true; intervalId = setInterval(tick, 100); _mentalTimers.push(intervalId);
  }
}

// ─── Flow 4: Protocolo de Salida ──────────────────────────────────────────────
function mentalShowProtocoloSalida(container, section, card) {
  if (!_mentalFlowSessionData) {
    var n = new Date();
    _mentalFlowSessionData = {
      fecha: n.toISOString().slice(0, 10),
      hora_inicio: null,
      hora_fin: n.getHours() + ':' + (n.getMinutes() < 10 ? '0' : '') + n.getMinutes(),
      duracion_planeada_min: null,
      duracion_real_s: null,
      distracciones: [],
      rating: null,
      cierre: null,
      notas: ''
    };
  }
  mentalShowProtocoloStep1(container, section, card);
}

// Paso 1 — Captura de distracciones
function mentalShowProtocoloStep1(container, section, card) {
  container.innerHTML = '';
  mentalSetHeader('Protocolo de Salida', function() { mentalShowSection(container, section); });
  var view = document.createElement('div'); view.className = 'mental-tech-view';
  var mainCard = document.createElement('div'); mainCard.className = 'mental-tech-section';
  mainCard.appendChild(mentalMkProgDots(3, 0));

  var title = document.createElement('div'); title.className = 'mental-proto-title'; title.textContent = 'Captura de Distracciones';
  mainCard.appendChild(title);
  var sub = document.createElement('div'); sub.className = 'mental-proto-sub';
  sub.textContent = '¿Qué interrumpió tu enfoque? Escríbelo para registrarlo y vaciarlo de tu cabeza.';
  mainCard.appendChild(sub);

  var catalog = [];
  dbGetAll('flow_distraccion_catalogo').then(function(rows) { catalog = rows || []; }).catch(function() {});

  var chipsEl = document.createElement('div'); chipsEl.className = 'mental-chips';
  mainCard.appendChild(chipsEl);

  function renderChips() {
    chipsEl.innerHTML = '';
    (_mentalFlowSessionData.distracciones || []).forEach(function(d, i) {
      var chip = document.createElement('span'); chip.className = 'mental-chip';
      var txt = document.createTextNode(d);
      var x = document.createElement('button'); x.className = 'mental-chip-x'; x.textContent = '×';
      x.addEventListener('click', (function(idx) {
        return function() { _mentalFlowSessionData.distracciones.splice(idx, 1); renderChips(); };
      }(i)));
      chip.appendChild(txt); chip.appendChild(x);
      chipsEl.appendChild(chip);
    });
  }
  renderChips();

  var acWrap = document.createElement('div'); acWrap.className = 'mental-ac-wrap';
  var acInp = document.createElement('input'); acInp.type = 'text'; acInp.placeholder = 'Añadir distracción…'; acInp.className = 'mental-ac-inp';
  var acDrop = document.createElement('div'); acDrop.className = 'mental-ac-drop'; acDrop.style.display = 'none';
  acWrap.appendChild(acInp); acWrap.appendChild(acDrop);
  mainCard.appendChild(acWrap);

  function addDistraccion(name) {
    var val = name.trim(); if (!val) return;
    if (!_mentalFlowSessionData.distracciones) _mentalFlowSessionData.distracciones = [];
    if (_mentalFlowSessionData.distracciones.indexOf(val) === -1) {
      _mentalFlowSessionData.distracciones.push(val); renderChips();
    }
    acInp.value = ''; acDrop.style.display = 'none';
  }

  acInp.addEventListener('input', function() {
    var q = acInp.value.trim().toLowerCase();
    acDrop.innerHTML = ''; acDrop.style.display = 'none';
    if (!q || !catalog.length) return;
    var matches = catalog.filter(function(c) {
      return c.nombre_normalizado && c.nombre_normalizado.indexOf(q) === 0;
    }).sort(function(a, b) { return (b.conteo || 0) - (a.conteo || 0); }).slice(0, 5);
    if (!matches.length) return;
    matches.forEach(function(c) {
      var opt = document.createElement('div'); opt.className = 'mental-ac-opt'; opt.textContent = c.nombre;
      opt.addEventListener('mousedown', function(e) { e.preventDefault(); });
      opt.addEventListener('click', function() { addDistraccion(c.nombre); });
      opt.addEventListener('touchend', function(e) { e.preventDefault(); addDistraccion(c.nombre); });
      acDrop.appendChild(opt);
    });
    acDrop.style.display = 'block';
  });
  acInp.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); addDistraccion(acInp.value); }
    if (e.key === 'Escape') { acDrop.style.display = 'none'; }
  });
  acInp.addEventListener('blur', function() { setTimeout(function() { acDrop.style.display = 'none'; }, 150); });

  var nextBtn = document.createElement('button'); nextBtn.className = 'mental-flow-next';
  nextBtn.textContent = 'Siguiente →';
  nextBtn.addEventListener('click', function() { mentalShowProtocoloStep2(container, section, card); });
  mainCard.appendChild(nextBtn);
  view.appendChild(mainCard);
  container.appendChild(view);
}

// Paso 2 — Evaluación
function mentalShowProtocoloStep2(container, section, card) {
  container.innerHTML = '';
  mentalSetHeader('Protocolo de Salida', function() { mentalShowProtocoloStep1(container, section, card); });
  var view = document.createElement('div'); view.className = 'mental-tech-view';
  var mainCard = document.createElement('div'); mainCard.className = 'mental-tech-section';
  mainCard.appendChild(mentalMkProgDots(3, 1));

  var title = document.createElement('div'); title.className = 'mental-proto-title'; title.textContent = 'Evaluación de la Sesión';
  mainCard.appendChild(title);

  var rLbl = document.createElement('div'); rLbl.className = 'mental-flow-sec-lbl';
  rLbl.textContent = '¿Qué tan enfocado estuviste? (1 = muy disperso · 5 = flow total)';
  mainCard.appendChild(rLbl);

  var ratingRow = document.createElement('div'); ratingRow.className = 'mental-rating-row';
  var selRating = _mentalFlowSessionData.rating || null;
  var rBtns = [];
  for (var r = 1; r <= 5; r++) {
    (function(val) {
      var btn = document.createElement('button');
      btn.className = 'mental-rating-btn' + (selRating === val ? ' sel' : '');
      btn.textContent = String(val);
      btn.addEventListener('click', function() {
        selRating = val; _mentalFlowSessionData.rating = val;
        rBtns.forEach(function(b, i) { if (i + 1 === val) b.classList.add('sel'); else b.classList.remove('sel'); });
      });
      ratingRow.appendChild(btn); rBtns.push(btn);
    }(r));
  }
  mainCard.appendChild(ratingRow);
  mainCard.appendChild(mentalMkInnerSep());

  var cLbl = document.createElement('div'); cLbl.className = 'mental-flow-sec-lbl'; cLbl.textContent = '¿Cómo termina esta sesión?';
  mainCard.appendChild(cLbl);

  var radioOpts = [
    { id: 'satisfecho',   label: '✅ Satisfecho — Completé lo que me propuse'     },
    { id: 'incompleto',   label: '🔄 Incompleto — Quedó trabajo pendiente'       },
    { id: 'interrumpido', label: '⚠️ Interrumpido — Algo externo cortó la sesión' }
  ];
  var radioGrp = document.createElement('div'); radioGrp.className = 'mental-radio-grp';
  var selCierre = _mentalFlowSessionData.cierre || null;
  var rdots = {};
  radioOpts.forEach(function(opt) {
    var row = document.createElement('div'); row.className = 'mental-radio-row';
    var dot = document.createElement('div'); dot.className = 'mental-radio-dot' + (selCierre === opt.id ? ' sel' : '');
    var lbl = document.createElement('div'); lbl.className = 'mental-radio-lbl'; lbl.textContent = opt.label;
    rdots[opt.id] = dot;
    row.appendChild(dot); row.appendChild(lbl);
    row.addEventListener('click', (function(oid) {
      return function() {
        selCierre = oid; _mentalFlowSessionData.cierre = oid;
        Object.keys(rdots).forEach(function(k) { if (k === oid) rdots[k].classList.add('sel'); else rdots[k].classList.remove('sel'); });
      };
    }(opt.id)));
    radioGrp.appendChild(row);
  });
  mainCard.appendChild(radioGrp);

  var nextBtn = document.createElement('button'); nextBtn.className = 'mental-flow-next';
  nextBtn.textContent = 'Siguiente →';
  nextBtn.addEventListener('click', function() { mentalShowProtocoloStep3(container, section, card); });
  mainCard.appendChild(nextBtn);
  view.appendChild(mainCard);
  container.appendChild(view);
}

// Paso 3 — Notas y guardar
function mentalShowProtocoloStep3(container, section, card) {
  container.innerHTML = '';
  mentalSetHeader('Protocolo de Salida', function() { mentalShowProtocoloStep2(container, section, card); });
  var view = document.createElement('div'); view.className = 'mental-tech-view';
  var mainCard = document.createElement('div'); mainCard.className = 'mental-tech-section';
  mainCard.appendChild(mentalMkProgDots(3, 2));

  var title = document.createElement('div'); title.className = 'mental-proto-title'; title.textContent = 'Notas y Guardar';
  mainCard.appendChild(title);

  var s = _mentalFlowSessionData;
  if (s.duracion_real_s !== null) {
    var sumLbl = document.createElement('div'); sumLbl.className = 'mental-flow-sec-lbl'; sumLbl.textContent = 'Resumen';
    mainCard.appendChild(sumLbl);
    var sumEl = document.createElement('div'); sumEl.className = 'mental-ses-sum';
    function addLine(text) { var d = document.createElement('div'); d.textContent = text; sumEl.appendChild(d); }
    if (s.hora_inicio) addLine('⏱ ' + s.hora_inicio + ' → ' + s.hora_fin);
    var rS = s.duracion_real_s, rM = Math.floor(rS / 60), rSec = rS % 60;
    addLine('📋 Planeado: ' + (s.duracion_planeada_min || '?') + ' min  ·  Real: ' + rM + ':' + (rSec < 10 ? '0' : '') + rSec);
    if (s.rating) addLine('⭐ Enfoque: ' + s.rating + ' / 5');
    if (s.cierre) addLine('🏷 Cierre: ' + s.cierre);
    if ((s.distracciones || []).length) addLine('💭 Distracciones: ' + s.distracciones.join(', '));
    mainCard.appendChild(sumEl);
    mainCard.appendChild(mentalMkInnerSep());
  }

  var nLbl = document.createElement('div'); nLbl.className = 'mental-flow-sec-lbl'; nLbl.textContent = 'Notas (opcional)';
  mainCard.appendChild(nLbl);
  var notesInp = document.createElement('textarea'); notesInp.className = 'mental-notes-inp';
  notesInp.placeholder = 'Aprendizajes, bloqueos, próximos pasos…';
  notesInp.value = s.notas || '';
  mainCard.appendChild(notesInp);

  var saveBtn = document.createElement('button'); saveBtn.className = 'mental-flow-save'; saveBtn.textContent = 'Guardar Sesión';
  saveBtn.addEventListener('click', function() {
    saveBtn.disabled = true; saveBtn.textContent = 'Guardando…';
    _mentalFlowSessionData.notas = notesInp.value.trim();
    var n2 = new Date();
    var sessionRecord = {
      fecha:                 _mentalFlowSessionData.fecha,
      hora_inicio:           _mentalFlowSessionData.hora_inicio  || null,
      hora_fin:              _mentalFlowSessionData.hora_fin      || n2.toTimeString().slice(0, 5),
      duracion_planeada_min: _mentalFlowSessionData.duracion_planeada_min || null,
      duracion_real_s:       _mentalFlowSessionData.duracion_real_s       || null,
      rating:                _mentalFlowSessionData.rating  || null,
      cierre:                _mentalFlowSessionData.cierre  || null,
      notas:                 _mentalFlowSessionData.notas
    };
    var today        = _mentalFlowSessionData.fecha;
    var distracciones = (_mentalFlowSessionData.distracciones || []).slice();
    dbPut('flow_sessions', sessionRecord).then(function(sesionId) {
      return dbGetAll('flow_distraccion_catalogo').then(function(catalog) {
        return mentalProcesarDistracciones(catalog || [], distracciones, sesionId, today, 0);
      });
    }).then(function() {
      _mentalFlowSessionData = null;
      saveBtn.textContent = '✓ Guardado';
      saveBtn.style.background = '#30d158';
      setTimeout(function() { mentalShowSection(container, section); }, 1200);
    }).catch(function(err) {
      saveBtn.disabled = false; saveBtn.textContent = 'Error — Reintentar';
      console.error('[mental] guardar sesión:', err);
    });
  });
  mainCard.appendChild(saveBtn);
  view.appendChild(mainCard);
  container.appendChild(view);
}

// ─── Guardar distracciones secuencialmente en IndexedDB ───────────────────────
function mentalProcesarDistracciones(catalog, distracciones, sesionId, today, index) {
  if (index >= distracciones.length) return Promise.resolve();
  var nombre = distracciones[index];
  var norm   = nombre.toLowerCase().trim();
  return dbPut('flow_distracciones', {
    sesion_id:          sesionId,
    distraccion_nombre: nombre,
    fecha:              today
  }).then(function() {
    var found = null;
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i].nombre_normalizado === norm) { found = catalog[i]; break; }
    }
    if (found) {
      found.conteo = (found.conteo || 0) + 1;
      return dbPut('flow_distraccion_catalogo', found);
    } else {
      var entry = { nombre: nombre, nombre_normalizado: norm, conteo: 1 };
      return dbPut('flow_distraccion_catalogo', entry).then(function(newId) {
        entry.id = newId; catalog.push(entry);
      });
    }
  }).then(function() {
    return mentalProcesarDistracciones(catalog, distracciones, sesionId, today, index + 1);
  });
}
