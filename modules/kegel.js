// modules/kegel.js — Módulo Kegel (autónomo, localStorage)

// ─── Styles ───────────────────────────────────────────────────────────────────
(function() {
  if (document.getElementById('kegel-styles')) return;
  var s = document.createElement('style');
  s.id  = 'kegel-styles';
  s.textContent = [
    '.kegel-progress { text-align:center; font-size:13px; font-weight:600; color:var(--t3); letter-spacing:.5px; text-transform:uppercase; padding:14px 20px 4px; }',
    '.kegel-phase-title { font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--t1); padding:10px 20px 4px; margin:0; }',
    '.kegel-instruction { font-size:14px; color:var(--t2); line-height:1.5; padding:4px 20px 12px; margin:0; }',
    '.kegel-counter-display { text-align:center; font-family:var(--font-display); font-size:34px; font-weight:700; color:var(--t1); padding:16px 20px 8px; font-variant-numeric:tabular-nums; letter-spacing:-0.5px; transition:color .2s; }',
    '.kegel-counter-display.kegel-done { color:#30d158; }',
    '.kegel-tap-btn { display:block; margin:8px auto 4px; width:180px; height:180px; border-radius:50%; border:none; background:var(--bg2); color:var(--t1); font-size:17px; font-weight:600; cursor:pointer; transition:transform .1s,background .15s; -webkit-tap-highlight-color:transparent; }',
    '.kegel-tap-btn:active { transform:scale(.93); background:var(--bg3,#2c2c2e); }',
    '.kegel-guide-btn { display:block; margin:12px auto 4px; background:none; border:1px solid var(--sep); border-radius:980px; color:var(--t2); font-size:14px; padding:8px 22px; cursor:pointer; }',
    '.kegel-breath-guide { text-align:center; font-family:var(--font-display); font-size:28px; font-weight:700; letter-spacing:-.3px; padding:14px 20px; margin:6px 20px; border-radius:16px; transition:background .3s,color .3s; }',
    '.kegel-hidden { display:none; }',
    '.kegel-inhale { background:rgba(48,209,88,.12); color:#30d158; }',
    '.kegel-exhale { background:rgba(10,132,255,.12); color:#0a84ff; }',
    '.kegel-state-display { text-align:center; font-family:var(--font-display); font-size:44px; font-weight:800; letter-spacing:-.5px; padding:18px 20px 4px; transition:color .25s; }',
    '.kegel-state-contrae { color:#ff9f0a; }',
    '.kegel-state-relaja  { color:#30d158; }',
    '.kegel-state-descanso{ color:var(--t2); }',
    '.kegel-state-done    { color:#30d158; font-size:32px; }',
    '.kegel-timer-display { text-align:center; font-family:var(--font-display); font-size:60px; font-weight:700; color:var(--t1); padding:4px 20px 12px; font-variant-numeric:tabular-nums; letter-spacing:-1px; }',
    '.kegel-counters-row { display:flex; justify-content:center; gap:28px; padding:4px 20px 12px; }',
    '.kegel-counter-small { font-size:15px; font-weight:600; color:var(--t2); font-variant-numeric:tabular-nums; }',
    '.kegel-pause-btn { display:block; margin:10px auto 6px; background:var(--bg2); border:none; border-radius:980px; color:var(--t1); font-size:16px; font-weight:600; padding:12px 36px; cursor:pointer; }',
    '.kegel-pause-btn:active { opacity:.7; }',
    '.kegel-next-btn { display:block; margin:10px 20px 6px; width:calc(100% - 40px); background:#ff9f0a; border:none; border-radius:980px; color:#000; font-size:16px; font-weight:700; padding:14px 20px; cursor:pointer; }',
    '.kegel-next-btn.disabled { background:var(--bg2); color:var(--t3); cursor:default; pointer-events:none; }',
    '.kegel-complete { text-align:center; padding:40px 20px 20px; }',
    '.kegel-complete-emoji { font-size:64px; margin-bottom:16px; }',
    '.kegel-complete-title { font-family:var(--font-display); font-size:26px; font-weight:700; color:var(--t1); margin-bottom:8px; }',
    '.kegel-complete-sub { font-size:15px; color:var(--t2); margin-bottom:32px; }',
    '.kegel-restart-btn { display:block; margin:0 auto; background:#ff9f0a; border:none; border-radius:980px; color:#000; font-size:16px; font-weight:700; padding:14px 48px; cursor:pointer; }',
    '.kegel-config-title { font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--t1); padding:12px 20px 6px; margin:0; }',
    '.kegel-config-group { background:var(--bg2); border-radius:16px; margin:10px 20px; padding:4px 0; }',
    '.kegel-config-group-label { font-size:12px; font-weight:600; color:var(--t3); text-transform:uppercase; letter-spacing:.5px; padding:14px 20px 4px; }',
    '.kegel-config-row { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:.5px solid var(--sep); }',
    '.kegel-config-row:last-child { border-bottom:none; }',
    '.kegel-config-label { font-size:15px; color:var(--t1); flex:1; }',
    '.kegel-config-input { width:70px; background:var(--bg3,#3a3a3c); border:none; border-radius:10px; color:var(--t1); font-size:16px; font-weight:600; text-align:center; padding:7px 8px; font-family:-apple-system,sans-serif; }',
    '.kegel-config-input:focus { outline:2px solid #ff9f0a; }',
    '.kegel-config-actions { display:flex; gap:12px; margin:16px 20px 40px; }',
    '.kegel-config-save { flex:1; background:#ff9f0a; border:none; border-radius:980px; color:#000; font-size:16px; font-weight:700; padding:13px; cursor:pointer; }',
    '.kegel-config-reset { flex:1; background:var(--bg2); border:none; border-radius:980px; color:var(--t2); font-size:15px; font-weight:600; padding:13px; cursor:pointer; }'
  ].join('\n');
  document.head.appendChild(s);
}());

// ─── Defaults ─────────────────────────────────────────────────────────────────
var KEGEL_DEFAULTS = {
  respiraciones:      5,
  seg_inhala:         4,
  seg_exhala:         6,
  f2_seg_contraccion: 8,
  f2_seg_relajacion:  8,
  f2_reps:            10,
  f2_series:          2,
  f2_descanso:        30,
  f3_seg_contraccion: 1,
  f3_reps:            10,
  f3_series:          3,
  f3_descanso:        20
};

function kegelGetConfig() {
  var raw = localStorage.getItem('kegel_config');
  if (!raw) return Object.assign({}, KEGEL_DEFAULTS);
  try { return Object.assign({}, KEGEL_DEFAULTS, JSON.parse(raw)); }
  catch(e) { return Object.assign({}, KEGEL_DEFAULTS); }
}

// ─── Estado global del módulo ─────────────────────────────────────────────────
var _kegelTimer          = null;
var _kegelBreathTimer    = null;   // stores setTimeout ID for breath cycle
var _kegelBreathCycleId  = 0;     // increments on cancel to invalidate pending callbacks
var _kegelPaused         = false;
var _kegelSessionPanel   = null;
var _kegelCurrentPhase   = 1;
var _kegelAudioCtx       = null;

function kegelClearTimers() {
  if (_kegelTimer)       { clearInterval(_kegelTimer);      _kegelTimer = null; }
  if (_kegelBreathTimer) { clearTimeout(_kegelBreathTimer); _kegelBreathTimer = null; }
  _kegelBreathCycleId++;   // invalidates all pending breath cycle callbacks
  _kegelPaused = false;
}

// ─── Web Audio — inicializar SOLO desde user gesture directo ─────────────────
function kegelInitAudio() {
  if (!_kegelAudioCtx) {
    try { _kegelAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { return; }
  }
  if (_kegelAudioCtx.state === 'suspended') {
    _kegelAudioCtx.resume();
  }
}

function kegelBeep() {
  if (!_kegelAudioCtx || _kegelAudioCtx.state === 'suspended') return;
  try {
    var osc  = _kegelAudioCtx.createOscillator();
    var gain = _kegelAudioCtx.createGain();
    osc.connect(gain);
    gain.connect(_kegelAudioCtx.destination);
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.15, _kegelAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _kegelAudioCtx.currentTime + 0.15);
    osc.start(_kegelAudioCtx.currentTime);
    osc.stop(_kegelAudioCtx.currentTime + 0.15);
  } catch(e) { /* ignore */ }
}

// ─── Punto de entrada ─────────────────────────────────────────────────────────
function renderKegelModule(container) {
  _kegelCurrentPhase = 1;
  kegelClearTimers();

  var tabBar     = createElement('div', { class: 'main-tabs' });
  var tabContent = createElement('div', {});
  container.appendChild(tabBar);
  container.appendChild(tabContent);

  var tabs   = [{ id: 'sesion', label: 'Sesión' }, { id: 'config', label: 'Configuración' }];
  var panels = {};

  tabs.forEach(function(tab, i) {
    var isFirst = i === 0;
    var btn = createElement('button', {
      class: 'main-tab' + (isFirst ? ' active' : ''),
      id: 'kegel-tab-btn-' + tab.id
    }, [tab.label]);

    btn.addEventListener('click', function() {
      if (tab.id !== 'sesion') kegelClearTimers();
      tabs.forEach(function(t) {
        var b = document.getElementById('kegel-tab-btn-' + t.id);
        var p = panels[t.id];
        if (b) b.classList.toggle('active', t.id === tab.id);
        if (p) p.classList.toggle('active', t.id === tab.id);
      });
      if (tab.id === 'sesion') kegelRenderSession(panels['sesion']);
      if (tab.id === 'config') kegelRenderConfig(panels['config']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    tabBar.appendChild(btn);

    var panel = createElement('div', {
      class: 'tab-panel' + (isFirst ? ' active' : ''),
      id: 'kegel-panel-' + tab.id
    });
    panels[tab.id] = panel;
    tabContent.appendChild(panel);
  });

  _kegelSessionPanel = panels['sesion'];
  kegelRenderSession(panels['sesion']);
}

// ─── TAB: SESIÓN — pantalla de inicio ────────────────────────────────────────
function kegelRenderSession(panel) {
  panel.innerHTML = '';
  kegelClearTimers();
  _kegelSessionPanel = panel;

  var cfg = kegelGetConfig();

  // Duración estimada total
  var phase1s = cfg.respiraciones * (cfg.seg_inhala + cfg.seg_exhala);
  var phase2s = cfg.f2_series * cfg.f2_reps * (cfg.f2_seg_contraccion + cfg.f2_seg_relajacion)
              + Math.max(0, cfg.f2_series - 1) * cfg.f2_descanso;
  var phase3s = cfg.f3_series * cfg.f3_reps * (cfg.f3_seg_contraccion * 2)
              + Math.max(0, cfg.f3_series - 1) * cfg.f3_descanso;
  var totalMin = Math.ceil((phase1s + phase2s + phase3s + phase1s) / 60);

  var screen = createElement('div', {
    style: 'display:flex;flex-direction:column;justify-content:center;align-items:center;' +
           'padding:32px;min-height:60vh;text-align:center;'
  });

  screen.appendChild(createElement('div', { style: 'font-size:64px;margin-bottom:16px;' }, ['🤞']));
  screen.appendChild(createElement('div', {
    style: 'font-size:24px;font-weight:700;color:var(--text-primary);' +
           'font-family:-apple-system,sans-serif;margin-bottom:8px;'
  }, ['Sesión de Kegel']));
  screen.appendChild(createElement('div', {
    style: 'font-size:15px;color:var(--text-tertiary);' +
           'font-family:-apple-system,sans-serif;margin-bottom:48px;'
  }, ['4 fases · ~' + totalMin + ' min']));

  var startBtn = createElement('button', { class: 'btn-primary' }, ['Iniciar sesión']);
  startBtn.addEventListener('click', function() {
    kegelInitAudio();   // crea y desbloquea AudioContext en user gesture directo
    kegelBeep();        // beep de confirmación — verifica que el audio está activo
    kegelRenderPhase(panel, 1);
  });
  screen.appendChild(startBtn);
  panel.appendChild(screen);
}

function kegelRenderPhase(panel, phase) {
  panel.innerHTML = '';
  kegelClearTimers();
  _kegelCurrentPhase = phase;
  _kegelSessionPanel = panel;

  var cfg = kegelGetConfig();
  panel.appendChild(createElement('div', { class: 'kegel-progress' }, ['Fase ' + phase + ' de 4']));

  switch (phase) {
    case 1: kegelRenderBreathPhase(panel, cfg, 1); break;
    case 2: kegelRenderSustainedPhase(panel, cfg); break;
    case 3: kegelRenderRapidPhase(panel, cfg);     break;
    case 4: kegelRenderBreathPhase(panel, cfg, 4); break;
  }
}

// ─── FASES 1 y 4 — Respiración con ring SVG + double-beep automático ──────────
function kegelRenderBreathPhase(panel, cfg, phaseNum) {
  var total     = cfg.respiraciones;
  var inhalaSeg = cfg.seg_inhala;
  var exhalaSeg = cfg.seg_exhala;
  var isLast    = phaseNum === 4;
  var CIRC      = 439.82;   // 2 * π * 70

  panel.appendChild(createElement('h3', { class: 'kegel-phase-title' }, [
    isLast ? 'Fase 4 — Relajación final' : 'Fase 1 — Relajación inicial'
  ]));
  panel.appendChild(createElement('p', { class: 'kegel-instruction' }, [
    isLast
      ? 'Igual que la Fase 1. Suelta el suelo pélvico con cada exhalación.'
      : 'Inhala ' + inhalaSeg + ' seg por la nariz, exhala ' + exhalaSeg + ' seg por la boca. Con cada exhalación, suelta activamente el suelo pélvico.'
  ]));

  // ── SVG ring (FIX 2: stroke vía style, no atributo) ──
  var svgNS = 'http://www.w3.org/2000/svg';
  var svg   = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '180'); svg.setAttribute('height', '180');
  svg.setAttribute('viewBox', '0 0 180 180');
  svg.style.cssText = 'display:block;margin:24px auto 8px;';

  var bgC = document.createElementNS(svgNS, 'circle');
  bgC.setAttribute('cx', '90'); bgC.setAttribute('cy', '90'); bgC.setAttribute('r', '70');
  bgC.style.cssText = 'stroke:rgba(255,255,255,0.08);fill:none;stroke-width:10;';
  svg.appendChild(bgC);

  var progC = document.createElementNS(svgNS, 'circle');
  progC.setAttribute('cx', '90'); progC.setAttribute('cy', '90'); progC.setAttribute('r', '70');
  progC.style.cssText = 'stroke:var(--accent);fill:none;stroke-width:10;stroke-linecap:round;transition:stroke-dashoffset 0.5s ease;';
  progC.setAttribute('stroke-dasharray',  CIRC.toFixed(2));
  progC.setAttribute('stroke-dashoffset', CIRC.toFixed(2));
  progC.setAttribute('transform', 'rotate(-90 90 90)');
  svg.appendChild(progC);

  var tNum = document.createElementNS(svgNS, 'text');
  tNum.setAttribute('x', '90'); tNum.setAttribute('y', '82');
  tNum.setAttribute('text-anchor', 'middle');
  tNum.setAttribute('font-family', "-apple-system,'SF Pro Display',system-ui,sans-serif");
  tNum.setAttribute('font-size', '44'); tNum.setAttribute('font-weight', '700');
  tNum.setAttribute('fill', 'white');
  tNum.textContent = '0';
  svg.appendChild(tNum);

  var tSub = document.createElementNS(svgNS, 'text');
  tSub.setAttribute('x', '90'); tSub.setAttribute('y', '108');
  tSub.setAttribute('text-anchor', 'middle');
  tSub.setAttribute('font-family', "-apple-system,'SF Pro Display',system-ui,sans-serif");
  tSub.setAttribute('font-size', '14'); tSub.setAttribute('font-weight', '500');
  tSub.setAttribute('fill', 'rgba(255,255,255,0.4)');
  tSub.textContent = '/ ' + total + ' resp';
  svg.appendChild(tSub);

  panel.appendChild(svg);

  var nextBtn = createElement('button', { class: 'kegel-next-btn', id: 'kegel-next-btn' }, [
    isLast ? 'Finalizar rutina' : 'Siguiente fase →'
  ]);
  panel.appendChild(nextBtn);

  function updateRing(done) {
    tNum.textContent = done;
    progC.setAttribute('stroke-dashoffset', (CIRC * (1 - done / total)).toFixed(2));
  }

  // FIX 3: double-beep con chained setTimeout
  // Cada respiración: beep (inhala) → espera inhalaSeg → beep (exhala) → espera exhalaSeg → cuenta + siguiente
  var myCycleId = _kegelBreathCycleId;

  function runBreathCycle(done) {
    if (_kegelBreathCycleId !== myCycleId || done >= total) return;

    kegelBeep(); // beep inhala

    _kegelBreathTimer = setTimeout(function() {
      if (_kegelBreathCycleId !== myCycleId) return;
      kegelBeep(); // beep exhala

      _kegelBreathTimer = setTimeout(function() {
        if (_kegelBreathCycleId !== myCycleId) return;
        done++;
        updateRing(done);
        if (done >= total) {
          _kegelBreathTimer = setTimeout(function() {
            if (_kegelBreathCycleId !== myCycleId) return;
            kegelClearTimers();
            if (isLast) kegelRenderComplete(_kegelSessionPanel);
            else        kegelRenderPhase(_kegelSessionPanel, phaseNum + 1);
          }, 500);
        } else {
          runBreathCycle(done);
        }
      }, exhalaSeg * 1000);
    }, inhalaSeg * 1000);
  }

  runBreathCycle(0);

  nextBtn.addEventListener('click', function() {
    kegelClearTimers();
    if (isLast) kegelRenderComplete(_kegelSessionPanel);
    else        kegelRenderPhase(_kegelSessionPanel, phaseNum + 1);
  });
}

// ─── FASE 2 — Contracciones sostenidas ───────────────────────────────────────
function kegelRenderSustainedPhase(panel, cfg) {
  panel.appendChild(createElement('h3', { class: 'kegel-phase-title' }, ['Fase 2 — Contracciones sostenidas']));
  panel.appendChild(createElement('p',  { class: 'kegel-instruction' }, [
    'Contrae al máximo → mantén → relaja completamente. Respira normalmente.'
  ]));
  kegelRunTimerPhase(panel, {
    segContraccion: cfg.f2_seg_contraccion,
    segRelajacion:  cfg.f2_seg_relajacion,
    reps:           cfg.f2_reps,
    series:         cfg.f2_series,
    descanso:       cfg.f2_descanso,
    labelContrae:   'CONTRAE',
    labelRelaja:    'RELAJA',
    nextPhase:      3
  });
}

// ─── FASE 3 — Contracciones rápidas ──────────────────────────────────────────
function kegelRenderRapidPhase(panel, cfg) {
  panel.appendChild(createElement('h3', { class: 'kegel-phase-title' }, ['Fase 3 — Contracciones rápidas']));
  panel.appendChild(createElement('p',  { class: 'kegel-instruction' }, [
    'Contrae y suelta rápido, ~1 seg cada una.'
  ]));
  kegelRunTimerPhase(panel, {
    segContraccion: cfg.f3_seg_contraccion,
    segRelajacion:  cfg.f3_seg_contraccion,
    reps:           cfg.f3_reps,
    series:         cfg.f3_series,
    descanso:       cfg.f3_descanso,
    labelContrae:   'CONTRAE',
    labelRelaja:    'SUELTA',
    nextPhase:      4
  });
}

// ─── Timer phase engine (fases 2 y 3) — con rings SVG (FIX 4) ────────────────
function kegelRunTimerPhase(panel, opts) {
  var st = { series: 1, rep: 1, phase: 'contrae', timeLeft: opts.segContraccion, done: false };

  var CIRC1 = 389.56;  // 2*π*62, ring grande r=62
  var CIRC2 = 188.50;  // 2*π*30, ring pequeño r=30
  var svgNS = 'http://www.w3.org/2000/svg';

  // ── Ring 1: temporizador (160×160) ──
  var svg1 = document.createElementNS(svgNS, 'svg');
  svg1.setAttribute('width', '160'); svg1.setAttribute('height', '160');
  svg1.setAttribute('viewBox', '0 0 160 160');
  svg1.style.cssText = 'display:block;margin:0 auto;';

  var bg1 = document.createElementNS(svgNS, 'circle');
  bg1.setAttribute('cx', '80'); bg1.setAttribute('cy', '80'); bg1.setAttribute('r', '62');
  bg1.style.cssText = 'stroke:rgba(255,255,255,0.08);fill:none;stroke-width:10;';
  svg1.appendChild(bg1);

  var prog1 = document.createElementNS(svgNS, 'circle');
  prog1.setAttribute('cx', '80'); prog1.setAttribute('cy', '80'); prog1.setAttribute('r', '62');
  prog1.style.cssText = 'stroke:var(--accent);fill:none;stroke-width:10;stroke-linecap:round;transition:stroke-dashoffset 0.25s linear,stroke 0.3s;';
  prog1.setAttribute('stroke-dasharray',  CIRC1.toFixed(2));
  prog1.setAttribute('stroke-dashoffset', '0');
  prog1.setAttribute('transform', 'rotate(-90 80 80)');
  svg1.appendChild(prog1);

  var t1Num = document.createElementNS(svgNS, 'text');
  t1Num.setAttribute('x', '80'); t1Num.setAttribute('y', '72');
  t1Num.setAttribute('text-anchor', 'middle');
  t1Num.setAttribute('font-family', "-apple-system,'SF Pro Display',system-ui,sans-serif");
  t1Num.setAttribute('font-size', '40'); t1Num.setAttribute('font-weight', '700');
  t1Num.setAttribute('fill', 'white');
  t1Num.textContent = opts.segContraccion;
  svg1.appendChild(t1Num);

  var t1Sub = document.createElementNS(svgNS, 'text');
  t1Sub.setAttribute('x', '80'); t1Sub.setAttribute('y', '97');
  t1Sub.setAttribute('text-anchor', 'middle');
  t1Sub.setAttribute('font-family', "-apple-system,'SF Pro Display',system-ui,sans-serif");
  t1Sub.setAttribute('font-size', '13'); t1Sub.setAttribute('font-weight', '700');
  t1Sub.setAttribute('fill', '#FF9F0A');
  t1Sub.textContent = opts.labelContrae;
  svg1.appendChild(t1Sub);

  // ── Ring 2: progreso de reps (80×80) ──
  var svg2 = document.createElementNS(svgNS, 'svg');
  svg2.setAttribute('width', '80'); svg2.setAttribute('height', '80');
  svg2.setAttribute('viewBox', '0 0 80 80');
  svg2.style.cssText = 'display:block;margin:16px auto 0;';

  var bg2 = document.createElementNS(svgNS, 'circle');
  bg2.setAttribute('cx', '40'); bg2.setAttribute('cy', '40'); bg2.setAttribute('r', '30');
  bg2.style.cssText = 'stroke:rgba(255,255,255,0.08);fill:none;stroke-width:7;';
  svg2.appendChild(bg2);

  var prog2 = document.createElementNS(svgNS, 'circle');
  prog2.setAttribute('cx', '40'); prog2.setAttribute('cy', '40'); prog2.setAttribute('r', '30');
  prog2.style.cssText = 'stroke:var(--accent);fill:none;stroke-width:7;stroke-linecap:round;transition:stroke-dashoffset 0.3s ease;';
  prog2.setAttribute('stroke-dasharray',  CIRC2.toFixed(2));
  prog2.setAttribute('stroke-dashoffset', CIRC2.toFixed(2));
  prog2.setAttribute('transform', 'rotate(-90 40 40)');
  svg2.appendChild(prog2);

  var t2Num = document.createElementNS(svgNS, 'text');
  t2Num.setAttribute('x', '40'); t2Num.setAttribute('y', '37');
  t2Num.setAttribute('text-anchor', 'middle');
  t2Num.setAttribute('font-family', "-apple-system,'SF Pro Display',system-ui,sans-serif");
  t2Num.setAttribute('font-size', '20'); t2Num.setAttribute('font-weight', '700');
  t2Num.setAttribute('fill', 'white');
  t2Num.textContent = '0';
  svg2.appendChild(t2Num);

  var t2Sub = document.createElementNS(svgNS, 'text');
  t2Sub.setAttribute('x', '40'); t2Sub.setAttribute('y', '51');
  t2Sub.setAttribute('text-anchor', 'middle');
  t2Sub.setAttribute('font-family', "-apple-system,'SF Pro Display',system-ui,sans-serif");
  t2Sub.setAttribute('font-size', '10'); t2Sub.setAttribute('font-weight', '500');
  t2Sub.setAttribute('fill', 'rgba(255,255,255,0.4)');
  t2Sub.textContent = '/ ' + opts.reps + ' reps';
  svg2.appendChild(t2Sub);

  // ── Labels y controles ──
  var serieLabel = createElement('div', { style: 'text-align:center;font-size:13px;color:rgba(255,255,255,0.4);font-family:-apple-system,sans-serif;margin-top:12px;' }, ['Serie 1 de ' + opts.series]);
  var pauseBtn   = createElement('button', { class: 'kegel-pause-btn' }, ['Pausar']);
  var nextBtn    = createElement('button', { class: 'kegel-next-btn disabled', id: 'kegel-next-btn' }, ['Siguiente fase →']);

  var ringsWrap = createElement('div', { style: 'padding:24px 0 8px;' });
  ringsWrap.appendChild(svg1);
  ringsWrap.appendChild(svg2);

  panel.appendChild(ringsWrap);
  panel.appendChild(serieLabel);
  panel.appendChild(pauseBtn);
  panel.appendChild(nextBtn);

  function getTotalForPhase() {
    if (st.phase === 'contrae')  return opts.segContraccion;
    if (st.phase === 'relaja')   return opts.segRelajacion;
    return opts.descanso;
  }

  function updateRings() {
    var total = getTotalForPhase();
    var offset1 = CIRC1 * (1 - st.timeLeft / total);
    prog1.setAttribute('stroke-dashoffset', offset1.toFixed(2));
    t1Num.textContent = st.timeLeft;

    if (st.phase === 'contrae') {
      prog1.style.stroke = 'var(--accent)';
      t1Sub.setAttribute('fill', '#FF9F0A');
      t1Sub.textContent  = opts.labelContrae;
    } else if (st.phase === 'relaja') {
      prog1.style.stroke = 'rgba(255,255,255,0.2)';
      t1Sub.setAttribute('fill', 'rgba(255,255,255,0.5)');
      t1Sub.textContent  = opts.labelRelaja;
    } else {
      prog1.style.stroke = 'rgba(255,255,255,0.1)';
      t1Sub.setAttribute('fill', 'rgba(255,255,255,0.3)');
      t1Sub.textContent  = 'DESCANSA';
    }

    var repsDone = st.rep - 1;
    prog2.setAttribute('stroke-dashoffset', (CIRC2 * (1 - repsDone / opts.reps)).toFixed(2));
    t2Num.textContent = repsDone;
    serieLabel.textContent = 'Serie ' + st.series + ' de ' + opts.series;
  }

  function finish() {
    st.done = true;
    clearInterval(_kegelTimer); _kegelTimer = null;
    prog1.style.stroke = 'var(--accent)';
    prog1.setAttribute('stroke-dashoffset', '0');
    t1Num.textContent  = '✓';
    t1Sub.setAttribute('fill', '#FF9F0A');
    t1Sub.textContent  = 'Completado';
    prog2.setAttribute('stroke-dashoffset', '0');
    t2Num.textContent  = opts.reps;
    pauseBtn.disabled  = true;
    nextBtn.classList.remove('disabled');
    nextBtn.addEventListener('click', function() {
      kegelRenderPhase(_kegelSessionPanel, opts.nextPhase);
    });
  }

  function tick() {
    if (_kegelPaused || st.done) return;
    st.timeLeft--;
    if (st.timeLeft > 0) { updateRings(); return; }

    if (st.phase === 'contrae') {
      st.phase    = 'relaja';
      st.timeLeft = opts.segRelajacion;
    } else if (st.phase === 'relaja') {
      if (st.rep >= opts.reps) {
        if (st.series >= opts.series) { finish(); return; }
        st.series++; st.rep = 1; st.phase = 'descanso'; st.timeLeft = opts.descanso;
      } else {
        st.rep++; st.phase = 'contrae'; st.timeLeft = opts.segContraccion;
      }
    } else if (st.phase === 'descanso') {
      st.phase = 'contrae'; st.timeLeft = opts.segContraccion;
    }
    updateRings();
  }

  updateRings();
  _kegelTimer = setInterval(tick, 1000);

  pauseBtn.addEventListener('click', function() {
    _kegelPaused         = !_kegelPaused;
    pauseBtn.textContent = _kegelPaused ? 'Reanudar' : 'Pausar';
  });
}

// ─── Pantalla de cierre ───────────────────────────────────────────────────────
function kegelRenderComplete(panel) {
  panel.innerHTML = '';
  kegelClearTimers();

  var wrap = createElement('div', { class: 'kegel-complete' });
  wrap.appendChild(createElement('div',    { class: 'kegel-complete-emoji' }, ['💪']));
  wrap.appendChild(createElement('div',    { class: 'kegel-complete-title' }, ['Rutina completada']));
  wrap.appendChild(createElement('p',      { class: 'kegel-complete-sub'   }, ['Buen trabajo. Los resultados llegan con la constancia.']));
  var restartBtn = createElement('button', { class: 'kegel-restart-btn'    }, ['Reiniciar']);
  restartBtn.addEventListener('click', function() {
    kegelRenderSession(panel);
  });
  wrap.appendChild(restartBtn);
  panel.appendChild(wrap);
}

// ─── TAB: CONFIGURACIÓN ───────────────────────────────────────────────────────
function kegelRenderConfig(panel) {
  panel.innerHTML = '';
  var cfg    = kegelGetConfig();
  var inputs = {};

  function group(label, fields) {
    panel.appendChild(createElement('div', { class: 'kegel-config-group-label' }, [label]));
    var g = createElement('div', { class: 'kegel-config-group' });
    fields.forEach(function(f) {
      var row = createElement('div', { class: 'kegel-config-row' });
      row.appendChild(createElement('label', { class: 'kegel-config-label' }, [f.label]));
      var inp = createElement('input', { type: 'number', class: 'kegel-config-input', min: '1' });
      inp.value = cfg[f.key];
      inputs[f.key] = inp;
      row.appendChild(inp);
      g.appendChild(row);
    });
    panel.appendChild(g);
  }

  panel.appendChild(createElement('h3', { class: 'kegel-config-title' }, ['Configuración']));

  group('Fases 1 y 4 — Respiración', [
    { key: 'respiraciones', label: 'Respiraciones'        },
    { key: 'seg_inhala',    label: 'Segundos inhala'      },
    { key: 'seg_exhala',    label: 'Segundos exhala'      }
  ]);

  group('Fase 2 — Contracciones sostenidas', [
    { key: 'f2_seg_contraccion', label: 'Segundos de contracción' },
    { key: 'f2_seg_relajacion',  label: 'Segundos de relajación'  },
    { key: 'f2_reps',            label: 'Reps por serie'          },
    { key: 'f2_series',          label: 'Número de series'        },
    { key: 'f2_descanso',        label: 'Descanso entre series (seg)' }
  ]);

  group('Fase 3 — Contracciones rápidas', [
    { key: 'f3_seg_contraccion', label: 'Seg por contracción'     },
    { key: 'f3_reps',            label: 'Reps por serie'          },
    { key: 'f3_series',          label: 'Número de series'        },
    { key: 'f3_descanso',        label: 'Descanso entre series (seg)' }
  ]);

  var actions  = createElement('div', { class: 'kegel-config-actions' });
  var saveBtn  = createElement('button', { class: 'kegel-config-save'  }, ['Guardar']);
  var resetBtn = createElement('button', { class: 'kegel-config-reset' }, ['Restaurar defaults']);

  saveBtn.addEventListener('click', function() {
    var newCfg = {};
    Object.keys(inputs).forEach(function(k) {
      var val = parseInt(inputs[k].value, 10);
      newCfg[k] = (isNaN(val) || val < 1) ? KEGEL_DEFAULTS[k] : val;
    });
    localStorage.setItem('kegel_config', JSON.stringify(newCfg));
    showToast('Configuración guardada');
  });

  resetBtn.addEventListener('click', function() {
    localStorage.removeItem('kegel_config');
    kegelRenderConfig(panel);
    showToast('Configuración restaurada');
  });

  actions.appendChild(saveBtn);
  actions.appendChild(resetBtn);
  panel.appendChild(actions);
}
