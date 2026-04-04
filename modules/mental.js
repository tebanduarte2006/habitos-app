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

    // Section cards (Nivel 1) — más altas, con descripción
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
    '#mental-gear-btn { background:none; border:none; font-size:20px; cursor:pointer; padding:4px 0; color:var(--text-secondary); -webkit-tap-highlight-color:transparent; }'
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

// ─── Header helper ────────────────────────────────────────────────────────────
// Actualiza título y re-bindea el botón atrás sin acumular listeners.
function mentalSetHeader(title, backFn, showGear, gearFn) {
  // Título
  var titleEl = document.getElementById('module-title');
  if (titleEl) titleEl.textContent = '🧠 ' + title;

  // Botón atrás: clonar elimina los listeners previos
  var backBtn = document.getElementById('habitos-back-btn');
  if (backBtn) {
    var newBack = backBtn.cloneNode(true);
    backBtn.parentNode.replaceChild(newBack, backBtn);
    newBack.addEventListener('click', backFn || navigateHome);
  }

  // Gear button
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

// ─── Nivel 3 — Técnica individual (placeholder) ──────────────────────────────
function mentalShowCard(container, section, card) {
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

  // Acciones
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
