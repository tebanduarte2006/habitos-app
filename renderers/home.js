// ─── renderers/home.js — Home screen (Apple HIG dark redesign) ───────────────
// Renderiza un dashboard con:
//   · Header (fecha + título)
//   · Grid de módulos (2 columnas) — cada card muestra métricas reales 7d
//   · Card "Esta semana" con totales agregados
// Métricas calculadas en runtime desde IndexedDB (sesiones · flow_sessions).
// Sin metas, sin rachas, sin datos inventados.

function renderHomeScreen() {
  var home = document.getElementById('home-screen');
  home.innerHTML = '';

  // ── Header ──
  var header = createElement('div', { class: 'h-home-header' }, [
    createElement('div', { class: 'h-home-date' }, [formatHomeDate()]),
    createElement('h1', { class: 'h-home-title' }, ['Hábitos'])
  ]);
  home.appendChild(header);

  // ── Sección Módulos ──
  home.appendChild(createElement('div', { class: 'h-section-label' }, ['Módulos']));

  var grid = createElement('div', { class: 'h-modules-grid', id: 'home-modules-grid' });
  home.appendChild(grid);

  // ── Sección Esta semana ──
  home.appendChild(createElement('div', { class: 'h-section-label' }, ['Esta semana']));
  var weekCard = createElement('div', { class: 'h-week-card', id: 'home-week-card' }, [
    createElement('div', { class: 'h-week-empty' }, ['Cargando…'])
  ]);
  home.appendChild(weekCard);

  // ── Render cards de módulos (con métricas) ──
  computeHomeMetrics().then(function(metrics) {
    grid.innerHTML = '';
    grid.appendChild(buildModuleCard({
      id: 'gym',
      label: 'Gym',
      sub: 'Workout tracker',
      iconBuilder: function() { return ICON.dumbbell({ size: 22, stroke: 1.7 }); },
      accent: 'var(--accent)',
      metrics: metrics.gym
    }));
    grid.appendChild(buildModuleCard({
      id: 'mental',
      label: 'Mental',
      sub: 'Sesiones de enfoque',
      iconBuilder: function() { return ICON.brain({ size: 22, stroke: 1.7 }); },
      accent: 'var(--accent-mental)',
      metrics: metrics.mental
    }));

    weekCard.innerHTML = '';
    weekCard.appendChild(buildWeekRows(metrics));
  }).catch(function(err) {
    console.error('home metrics', err);
    grid.innerHTML = '';
    grid.appendChild(buildModuleCard({
      id: 'gym', label: 'Gym', sub: 'Workout tracker',
      iconBuilder: function() { return ICON.dumbbell({ size: 22, stroke: 1.7 }); },
      accent: 'var(--accent)', metrics: { sessions: 0, ms: 0, lastTs: 0 }
    }));
    grid.appendChild(buildModuleCard({
      id: 'mental', label: 'Mental', sub: 'Sesiones de enfoque',
      iconBuilder: function() { return ICON.brain({ size: 22, stroke: 1.7 }); },
      accent: 'var(--accent-mental)', metrics: { sessions: 0, ms: 0, lastTs: 0 }
    }));
    weekCard.innerHTML = '';
    weekCard.appendChild(createElement('div', { class: 'h-week-empty' }, ['No hay actividad esta semana.']));
  });
}

// ─── Card de un módulo en la home ────────────────────────────────────────────
function buildModuleCard(opts) {
  var card = createElement('button', { class: 'h-module-card', 'data-module': opts.id, type: 'button' });

  // Icono coloreado
  var iconWrap = createElement('div', { class: 'h-module-icon' });
  iconWrap.style.color = opts.accent;
  iconWrap.style.background = opts.accent === 'var(--accent)'
    ? 'rgba(255,159,10,0.14)'
    : 'rgba(94,92,230,0.18)';
  iconWrap.appendChild(opts.iconBuilder());
  card.appendChild(iconWrap);

  card.appendChild(createElement('div', { class: 'h-module-name' }, [opts.label]));
  card.appendChild(createElement('div', { class: 'h-module-sub' }, [opts.sub]));

  // Meta: número grande + unidad
  var metaWrap = createElement('div', { class: 'h-module-meta' });
  var num = createElement('span', { class: 'h-module-meta-num' }, [String(opts.metrics.sessions)]);
  num.style.color = opts.accent;
  metaWrap.appendChild(num);
  metaWrap.appendChild(createElement('span', { class: 'h-module-meta-unit' }, [opts.metrics.sessions === 1 ? 'sesión · 7 d' : 'sesiones · 7 d']));
  card.appendChild(metaWrap);

  // Footer: última actividad
  var foot = createElement('div', { class: 'h-module-foot' }, [
    createElement('span', { class: 'h-module-foot-label' }, ['Última']),
    createElement('span', { class: 'h-module-foot-value' }, [
      opts.metrics.lastTs ? formatRelative(opts.metrics.lastTs) : 'sin registros'
    ])
  ]);
  card.appendChild(foot);

  card.addEventListener('click', function() { navigateTo(opts.id); });
  return card;
}

// ─── Card "Esta semana" ──────────────────────────────────────────────────────
function buildWeekRows(metrics) {
  var wrap = document.createDocumentFragment();
  var anyActivity = metrics.gym.sessions > 0 || metrics.mental.sessions > 0;
  if (!anyActivity) {
    var empty = createElement('div', { class: 'h-week-empty' }, ['Sin actividad esta semana.']);
    wrap.appendChild(empty);
    return wrap;
  }

  // Tiempo Gym
  if (metrics.gym.ms > 0) {
    wrap.appendChild(buildWeekRow({
      iconBuilder: function() { return ICON.dumbbell({ size: 16, stroke: 1.7, color: 'var(--accent)' }); },
      label: 'Tiempo en Gym',
      value: formatHourMin(metrics.gym.ms),
      iconBg: 'rgba(255,159,10,0.18)'
    }));
  }
  // Tiempo Mental
  if (metrics.mental.ms > 0) {
    wrap.appendChild(buildWeekRow({
      iconBuilder: function() { return ICON.brain({ size: 16, stroke: 1.7, color: 'var(--accent-mental)' }); },
      label: 'Tiempo en Mental',
      value: formatHourMin(metrics.mental.ms),
      iconBg: 'rgba(94,92,230,0.18)'
    }));
  }
  // Sesiones totales
  var totalSes = metrics.gym.sessions + metrics.mental.sessions;
  wrap.appendChild(buildWeekRow({
    iconBuilder: function() { return ICON.calendar({ size: 16, stroke: 1.7, color: 'rgba(255,255,255,0.6)' }); },
    label: 'Sesiones totales',
    value: String(totalSes),
    iconBg: 'rgba(255,255,255,0.06)'
  }));
  return wrap;
}

function buildWeekRow(opts) {
  var iconBox = createElement('div', { class: 'h-week-icon' });
  if (opts.iconBg) iconBox.style.background = opts.iconBg;
  iconBox.appendChild(opts.iconBuilder());
  var row = createElement('div', { class: 'h-week-row' }, [
    iconBox,
    createElement('div', { class: 'h-week-text' }, [opts.label]),
    createElement('div', { class: 'h-week-value' }, [opts.value])
  ]);
  return row;
}

// ─── Métricas: lecturas reales de IndexedDB ───────────────────────────────────
function computeHomeMetrics() {
  var weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  var promises = [
    dbGetAll('sesiones').catch(function() { return []; }),
    safeGet('flow_sessions')
  ];
  return Promise.all(promises).then(function(r) {
    var gymSes = r[0] || [];
    var flowSes = r[1] || [];

    var gymStats = aggregateGym(gymSes, weekAgo);
    var mentalStats = aggregateMental(flowSes, weekAgo);

    return { gym: gymStats, mental: mentalStats };
  });
}

function safeGet(store) {
  try {
    return dbGetAll(store).catch(function() { return []; });
  } catch (e) {
    return Promise.resolve([]);
  }
}

function aggregateGym(sesiones, weekAgo) {
  var sessions = 0, ms = 0, lastTs = 0;
  sesiones.forEach(function(s) {
    var ts = s.timestamp_inicio || (s.fecha ? new Date(s.fecha).getTime() : 0);
    if (!ts) return;
    if (ts > lastTs && s.finalizada) lastTs = ts;
    if (s.finalizada && ts >= weekAgo) {
      sessions++;
      if (s.duracion_ms && s.duracion_ms > 0) ms += s.duracion_ms;
    }
  });
  return { sessions: sessions, ms: ms, lastTs: lastTs };
}

function aggregateMental(flowSes, weekAgo) {
  // flow_sessions schema variable; intentamos extraer fecha y duración con
  // varios nombres comunes. Si no hay nada, devolvemos cero — no inventamos.
  var sessions = 0, ms = 0, lastTs = 0;
  flowSes.forEach(function(s) {
    var ts = s.timestamp_inicio || s.timestamp_fin
          || (s.fecha ? new Date(s.fecha).getTime() : 0);
    if (!ts) return;
    if (ts > lastTs) lastTs = ts;
    if (ts >= weekAgo) {
      sessions++;
      var dur = s.duracion_ms || s.duracion_seg ? (s.duracion_ms || s.duracion_seg * 1000) : 0;
      if (dur > 0) ms += dur;
    }
  });
  return { sessions: sessions, ms: ms, lastTs: lastTs };
}

// ─── Helpers de formato ──────────────────────────────────────────────────────
function formatHomeDate() {
  var d = new Date();
  var dias = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
  var meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  return dias[d.getDay()] + ' ' + d.getDate() + ' ' + meses[d.getMonth()];
}

function formatRelative(ts) {
  if (!ts) return '—';
  var now = Date.now();
  var dDays = Math.floor((now - ts) / (24 * 60 * 60 * 1000));
  if (dDays <= 0) {
    var hours = Math.floor((now - ts) / (60 * 60 * 1000));
    if (hours <= 0) return 'Hace pocos minutos';
    if (hours === 1) return 'Hace 1 h';
    if (hours < 24) return 'Hace ' + hours + ' h';
    return 'Hoy';
  }
  if (dDays === 1) return 'Ayer';
  if (dDays < 7) return 'Hace ' + dDays + ' d';
  if (dDays < 30) return 'Hace ' + Math.floor(dDays / 7) + ' sem';
  return 'Hace +30 d';
}

function formatHourMin(ms) {
  if (!ms || ms < 0) return '0m';
  var totalMin = Math.floor(ms / 60000);
  var h = Math.floor(totalMin / 60);
  var m = totalMin % 60;
  if (h === 0) return m + 'm';
  return h + 'h ' + (m < 10 ? '0' + m : m) + 'm';
}
