// ─── renderers/gym.js — Gym module (Claude Design V3 redesign) ────────────────
// 3 tabs:
//   Entrenar     — Sesión activa con cronómetro + rest timer + sets Pending/Done/Skipped
//   Ejercicios   — Library con search + pills filtrables + lista agrupada por rutina
//   Progresión   — Hero "Récord de la semana" + lista de ejercicios + detalle por ejercicio
//
// IndexedDB stores (via db.js, sin tocar db.js):
//   sesiones   { id, fecha, finalizada, nombre?, timestamp_inicio?, duracion_ms?, routine_type? }
//   ejercicios { id, nombre, musculo_primario, tipo? }
//   sets       { id, sesion_id, ejercicio_id, peso, reps, orden?, status? }

// ─── Constantes ────────────────────────────────────────────────────────────────
var GYM_MUSCLE_GROUPS = [
  'Pecho','Pecho superior','Pecho inferior',
  'Espalda','Dorsales','Trapecio','Romboides','Lumbar',
  'Hombros','Hombro frontal','Hombro lateral','Hombro posterior',
  'Bíceps','Tríceps','Antebrazo',
  'Core','Abdominales','Oblicuos',
  'Piernas','Cuádriceps','Isquiotibiales','Gemelos','Aductores','Abductores','Tibial',
  'Glúteos','Cuello'
];
var GYM_STATUS = { PENDING: 'Pending', DONE: 'Done', SKIPPED: 'Skipped' };

// Config rest timer
var GYM_REST_DURATION = 90;

// ─── Estado en memoria ─────────────────────────────────────────────────────────
var _gymTimerId = null;
var _gymRestTimerId = null;
var _gymRestRemaining = 0;
var _gymAcknowledgedSession = null;
var _gymRestTotal = GYM_REST_DURATION;

// ─── Unidades ──────────────────────────────────────────────────────────────────
var KG_PER_LB = 0.45359237;
function gymKgToLbs(kg) {
  var n = Number(kg);
  if (!isFinite(n)) return null;
  return Math.round(n / KG_PER_LB * 10) / 10;
}
function gymInputToKg(value, unit) {
  var n = Number(value);
  if (!isFinite(n)) return NaN;
  return unit === 'kg' ? n : n * KG_PER_LB;
}
function gymFormatWeight(kg) {
  var lbs = gymKgToLbs(kg);
  if (lbs === null) return '—';
  return (Math.round(lbs * 10) / 10) + ' lbs';
}
function gymWeightLbsNum(kg) {
  var lbs = gymKgToLbs(kg);
  if (lbs === null) return null;
  return Math.round(lbs * 10) / 10;
}

// ─── Utilidades ────────────────────────────────────────────────────────────────
function gymParseMuscleArr(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { var a = JSON.parse(raw); return Array.isArray(a) ? a : [raw]; }
  catch (e) { return [String(raw)]; }
}

function gymNormalizeKey(s) {
  if (!s) return '';
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function gymFormatDateShort(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  var meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return d.getDate() + ' ' + meses[d.getMonth()];
}

function gymFormatDateLong(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  var meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return d.getDate() + ' ' + meses[d.getMonth()] + ' ' + d.getFullYear();
}

function gymFormatDuration(ms) {
  if (!ms || ms < 0) return '0:00';
  var total = Math.floor(ms / 1000);
  var h = Math.floor(total / 3600);
  var m = Math.floor((total % 3600) / 60);
  var s = total % 60;
  var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  return (h > 0 ? h + ':' + pad(m) : pad(m)) + ':' + pad(s);
}

function gymStatusChip(status, onClick) {
  var s = status || GYM_STATUS.PENDING;
  var cfg = {
    Pending: { icon: '○', label: 'Pendiente' },
    Done:    { icon: '✓', label: 'Hecho' },
    Skipped: { icon: '✕', label: 'Saltado' }
  }[s];
  var btn = createElement('button', {
    class: 'g-chip g-chip-' + s,
    type: 'button'
  }, [
    createElement('span', { style: 'font-weight:700;' }, [cfg.icon]),
    cfg.label
  ]);
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}

// ─── Entry point ──────────────────────────────────────────────────────────────
function renderGymModule(container) {
  container.innerHTML = '';

  // Título grande "Gym" + tab bar
  container.appendChild(createElement('h1', { class: 'g-screen-title' }, ['Gym']));

  var tabBar = createElement('div', { class: 'main-tabs' });
  var tabContent = createElement('div', { id: 'gym-tab-content' });
  container.appendChild(tabBar);
  container.appendChild(tabContent);

  var tabs = [
    { id: 'entrenar',   label: 'Entrenar' },
    { id: 'ejercicios', label: 'Ejercicios' },
    { id: 'progresion', label: 'Progresión' }
  ];

  var panels = {};
  tabs.forEach(function(tab, i) {
    var isFirst = i === 0;
    var btn = createElement('button', {
      class: 'main-tab' + (isFirst ? ' active' : ''),
      id: 'gym-tab-btn-' + tab.id, type: 'button'
    }, [tab.label]);
    btn.addEventListener('click', function() { gymSwitchTab(tab.id, tabs, panels); });
    tabBar.appendChild(btn);

    var panel = createElement('div', {
      class: 'tab-panel' + (isFirst ? ' active' : ''),
      id: 'gym-panel-' + tab.id
    });
    panels[tab.id] = panel;
    tabContent.appendChild(panel);
  });

  gymRenderEntrenar(panels.entrenar);
  gymRenderEjercicios(panels.ejercicios);
  gymRenderProgresion(panels.progresion);
}

function gymSwitchTab(activeId, tabs, panels) {
  tabs.forEach(function(tab) {
    var btn = document.getElementById('gym-tab-btn-' + tab.id);
    var panel = panels[tab.id];
    var isActive = tab.id === activeId;
    if (btn) btn.classList.toggle('active', isActive);
    if (panel) panel.classList.toggle('active', isActive);
  });
  if (activeId === 'entrenar')   gymRenderEntrenar(panels.entrenar);
  if (activeId === 'ejercicios') gymRenderEjercicios(panels.ejercicios);
  if (activeId === 'progresion') gymRenderProgresion(panels.progresion);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — ENTRENAR
// ══════════════════════════════════════════════════════════════════════════════
function gymRenderEntrenar(panel) {
  panel.innerHTML = '';
  gymStopTimer();

  dbGetAll('sesiones').then(function(sesiones) {
    var activa = sesiones.find(function(s) { return s.finalizada === false; });
    if (activa) {
      if (_gymAcknowledgedSession === activa.id) {
        gymRenderActiveSession(panel, activa);
      } else {
        gymPromptResume(panel, activa);
      }
    } else {
      _gymAcknowledgedSession = null;
      gymRenderStartScreen(panel, sesiones);
    }
  });
}

function gymPromptResume(panel, activa) {
  var startTs = activa.timestamp_inicio || (activa.fecha ? new Date(activa.fecha).getTime() : Date.now());
  var age = Date.now() - startTs;

  // Contar sets/ejercicios
  Promise.all([dbGetAll('sets'), dbGetAll('ejercicios')]).then(function(r) {
    var sets = r[0].filter(function(s) { return s.sesion_id === activa.id; });
    var realSets = sets.filter(function(s) {
      return !(s.status === GYM_STATUS.PENDING && Number(s.peso) === 0 && Number(s.reps) === 0);
    });
    var ejIds = {};
    sets.forEach(function(s) { ejIds[s.ejercicio_id] = true; });
    var nEj = Object.keys(ejIds).length;

    var modal = createElement('div', { class: 'g-modal' });
    modal.appendChild(createElement('div', { class: 'g-modal-handle' }));
    var head = createElement('div', { class: 'g-modal-head' }, [
      createElement('div', { class: 'g-modal-title' }, ['Sesión sin terminar']),
      gymBuildModalClose(function() { closeOverlay(); })
    ]);
    modal.appendChild(head);

    var summary = createElement('div', { class: 'g-resume-summary' });
    summary.appendChild(createElement('div', { class: 'g-resume-meta' }, [
      ((activa.routine_type || '').toUpperCase()) + ' · iniciada hace ' + gymFormatDuration(age)
    ]));
    var stats = createElement('div', { class: 'g-resume-stats' }, [
      createElement('div', {}, [
        createElement('span', { class: 'g-resume-num' }, [String(nEj)]),
        createElement('span', { class: 'g-resume-unit' }, [nEj === 1 ? 'ejercicio' : 'ejercicios'])
      ]),
      createElement('div', {}, [
        createElement('span', { class: 'g-resume-num' }, [String(realSets.length)]),
        createElement('span', { class: 'g-resume-unit' }, [realSets.length === 1 ? 'set' : 'sets'])
      ]),
      createElement('div', {}, [
        createElement('span', { class: 'g-resume-num' }, [gymFormatDuration(age)]),
        createElement('span', { class: 'g-resume-unit' }, ['transcurrido'])
      ])
    ]);
    summary.appendChild(stats);
    modal.appendChild(summary);

    var btnResume = createElement('button', { class: 'g-btn-primary', type: 'button' }, ['Reanudar sesión']);
    btnResume.addEventListener('click', function() {
      closeOverlay();
      _gymAcknowledgedSession = activa.id;
      gymRenderActiveSession(panel, activa);
    });
    var btnSave = createElement('button', { class: 'g-btn-secondary', type: 'button' }, ['Guardar y cerrar']);
    btnSave.addEventListener('click', function() {
      closeOverlay();
      activa.finalizada = true;
      activa.duracion_ms = activa.duracion_ms || age;
      dbPut('sesiones', activa).then(function() { gymRenderEntrenar(panel); });
    });
    var btnDelete = createElement('button', { class: 'g-btn-destructive', type: 'button' }, ['Eliminar sesión']);
    btnDelete.addEventListener('click', function() {
      closeOverlay();
      dbGetAll('sets').then(function(all) {
        var toDelete = all.filter(function(s) { return s.sesion_id === activa.id; });
        return Promise.all(toDelete.map(function(s) { return dbDelete('sets', s.id); }));
      }).then(function() {
        return dbDelete('sesiones', activa.id);
      }).then(function() { gymRenderEntrenar(panel); });
    });
    modal.appendChild(btnResume);
    modal.appendChild(btnSave);
    modal.appendChild(btnDelete);

    var overlay = gymOpenOverlay(modal);
    function closeOverlay() { overlay.remove(); }
  });
}

function gymRenderStartScreen(panel, sesiones) {
  panel.innerHTML = '';
  var wrap = createElement('div', { class: 'g-start' });

  var finalizadas = sesiones
    .filter(function(s) { return s.finalizada === true; })
    .sort(function(a, b) {
      return (b.timestamp_inicio || new Date(b.fecha).getTime()) -
             (a.timestamp_inicio || new Date(a.fecha).getTime());
    })
    .slice(0, 3);

  if (finalizadas.length > 0) {
    wrap.appendChild(createElement('div', { class: 'g-section-label', style: 'padding-left:4px;padding-top:0;' }, ['ÚLTIMAS SESIONES']));
    var list = createElement('div', { class: 'g-recent-list' });
    dbGetAll('sets').then(function(all) {
      finalizadas.forEach(function(s) {
        var setsCount = all.filter(function(st) {
          return st.sesion_id === s.id
            && !(st.status === GYM_STATUS.PENDING && Number(st.peso) === 0 && Number(st.reps) === 0);
        }).length;
        var card = createElement('div', { class: 'g-recent-card' }, [
          createElement('div', {}, [
            createElement('div', { class: 'g-recent-name' }, [s.nombre || 'Workout']),
            createElement('div', { class: 'g-recent-sub' }, [
              gymFormatDateLong(s.fecha) + ' · ' + setsCount + (setsCount === 1 ? ' set' : ' sets')
            ])
          ]),
          createElement('div', { class: 'g-recent-meta' }, [
            s.duracion_ms ? gymFormatDuration(s.duracion_ms) : ''
          ])
        ]);
        list.appendChild(card);
      });
    });
    wrap.appendChild(list);
  } else {
    wrap.appendChild(createElement('div', { class: 'g-empty-card' }, [
      'Aún no hay sesiones registradas. Toca "Iniciar sesión" para empezar tu primera rutina.'
    ]));
  }

  var startBtn = createElement('button', { class: 'g-start-cta', type: 'button' }, ['▶ Iniciar sesión']);
  startBtn.addEventListener('click', function() { gymShowStartModal(panel); });
  wrap.appendChild(startBtn);

  panel.appendChild(wrap);
}

function gymShowStartModal(panel) {
  var modal = createElement('div', { class: 'g-modal' });
  modal.appendChild(createElement('div', { class: 'g-modal-handle' }));
  var head = createElement('div', { class: 'g-modal-head' }, [
    createElement('div', { class: 'g-modal-title' }, ['Iniciar sesión']),
    gymBuildModalClose(function() { overlay.remove(); })
  ]);
  modal.appendChild(head);

  modal.appendChild(createElement('div', { class: 'g-modal-sub' }, ['Tipo de rutina']));
  var input = createElement('input', {
    class: 'g-modal-input', type: 'text',
    placeholder: 'Ej. Upper, Push, Leg Day…',
    autocomplete: 'off'
  });
  modal.appendChild(input);

  var pillsLabel = createElement('div', { class: 'g-modal-sub', style: 'margin-top:14px;' }, ['Recientes']);
  modal.appendChild(pillsLabel);
  var pills = createElement('div', { class: 'g-pills', style: 'margin-bottom:12px;' });
  modal.appendChild(pills);

  var sugg = createElement('div', { class: 'g-suggest' });
  sugg.style.display = 'none';
  modal.appendChild(sugg);

  var startBtn = createElement('button', { class: 'g-btn-primary', type: 'button' }, ['Comenzar entrenamiento']);
  startBtn.addEventListener('click', function() {
    var name = input.value.trim();
    if (!name) { showToast('Escribe un nombre para la rutina'); return; }
    overlay.remove();
    gymCreateSession(panel, name);
  });
  modal.appendChild(startBtn);

  // Cargar autocomplete de rutinas
  Promise.all([dbGetAll('sesiones'), dbGetAll('ejercicios')]).then(function(r) {
    var nameSet = {};
    r[0].forEach(function(s) { if (s.routine_type) nameSet[s.routine_type] = true; });
    r[1].forEach(function(e) { if (e.tipo) nameSet[e.tipo] = true; });
    var allNames = Object.keys(nameSet).sort();

    // Pills "recientes" (top 5 más recientes en sesiones)
    var recentSorted = r[0].slice().sort(function(a, b) {
      return (b.timestamp_inicio || 0) - (a.timestamp_inicio || 0);
    });
    var recents = [];
    recentSorted.forEach(function(s) {
      if (s.routine_type && recents.indexOf(s.routine_type) < 0 && recents.length < 6) {
        recents.push(s.routine_type);
      }
    });
    if (recents.length === 0) {
      pillsLabel.style.display = 'none';
    } else {
      recents.forEach(function(name) {
        var p = createElement('button', { class: 'g-pill', type: 'button' }, [name]);
        p.addEventListener('click', function() {
          input.value = name;
          // marcar como activa visualmente
          Array.prototype.forEach.call(pills.children, function(c) { c.classList.remove('active'); });
          p.classList.add('active');
          renderSugg('');
        });
        pills.appendChild(p);
      });
    }

    function renderSugg(term) {
      sugg.innerHTML = '';
      var t = (term || '').trim();
      var tKey = gymNormalizeKey(t);
      if (!t) { sugg.style.display = 'none'; return; }
      var filtered = allNames.filter(function(n) { return gymNormalizeKey(n).indexOf(tKey) >= 0; });
      if (filtered.length === 0) { sugg.style.display = 'none'; return; }
      filtered.slice(0, 8).forEach(function(n) {
        var item = createElement('button', { class: 'g-suggest-row', type: 'button' }, [n]);
        item.addEventListener('click', function() {
          input.value = n;
          sugg.style.display = 'none';
        });
        sugg.appendChild(item);
      });
      sugg.style.display = '';
    }
    input.addEventListener('input', function() { renderSugg(input.value); });
  });

  var overlay = gymOpenOverlay(modal);
  setTimeout(function() { input.focus(); }, 80);
}

function gymCreateSession(panel, routineType) {
  dbGetAll('sesiones').then(function(all) {
    var n = all.length + 1;
    var now = Date.now();
    var sesion = {
      nombre: 'Workout #' + n + ' · ' + routineType,
      fecha: new Date(now).toISOString(),
      timestamp_inicio: now,
      finalizada: false,
      routine_type: routineType
    };
    dbPut('sesiones', sesion).then(function(id) {
      sesion.id = id;
      _gymAcknowledgedSession = id;
      gymRenderActiveSession(panel, sesion);
    });
  });
}

// ─── Sesión activa ────────────────────────────────────────────────────────────
function gymRenderActiveSession(panel, sesion) {
  panel.innerHTML = '';
  var wrap = createElement('div', { class: 'g-train' });

  // Card principal de sesión
  var sessionCard = createElement('div', { class: 'g-session-card' });
  sessionCard.appendChild(createElement('div', { class: 'g-session-meta' }, [
    createElement('div', { class: 'g-session-rt' }, [(sesion.routine_type || '').toUpperCase()]),
    createElement('div', { class: 'g-session-name' }, [sesion.nombre || 'Workout'])
  ]));

  var timerWrap = createElement('div', { class: 'g-session-timer-wrap' });
  var timerLeft = createElement('div', {}, [
    createElement('div', { class: 'g-session-timer-label' }, ['DURACIÓN']),
    createElement('div', { class: 'g-session-timer', id: 'gym-session-timer' }, ['0:00'])
  ]);
  timerWrap.appendChild(timerLeft);
  sessionCard.appendChild(timerWrap);
  wrap.appendChild(sessionCard);

  gymStartSessionTimer(sesion.timestamp_inicio);

  // Rest timer bar (oculto por default)
  var restBar = createElement('div', { class: 'g-rest-bar hidden', id: 'gym-rest-bar' });
  wrap.appendChild(restBar);

  // Lista de ejercicios
  var exList = createElement('div', { id: 'gym-ex-list' });
  wrap.appendChild(exList);
  gymRefreshSessionExercises(sesion, exList);

  // Botón agregar ejercicio
  var addBtn = createElement('button', { class: 'g-add-exercise', type: 'button' }, ['+ Agregar ejercicio']);
  addBtn.addEventListener('click', function() { gymShowAddExerciseModal(sesion, exList); });
  wrap.appendChild(addBtn);

  // Botón finalizar
  var finBtn = createElement('button', { class: 'g-finalize', type: 'button' }, ['■ Finalizar sesión']);
  finBtn.addEventListener('click', function() { gymConfirmFinalize(sesion, panel); });
  wrap.appendChild(finBtn);

  panel.appendChild(wrap);
}

function gymStartSessionTimer(startTs) {
  gymStopTimer();
  var tick = function() {
    var el = document.getElementById('gym-session-timer');
    if (!el) { gymStopTimer(); return; }
    el.textContent = gymFormatDuration(Date.now() - (startTs || Date.now()));
  };
  tick();
  _gymTimerId = setInterval(tick, 1000);
}

function gymStopTimer() {
  if (_gymTimerId) { clearInterval(_gymTimerId); _gymTimerId = null; }
  if (_gymRestTimerId) { clearInterval(_gymRestTimerId); _gymRestTimerId = null; }
}

function gymRefreshSessionExercises(sesion, listEl) {
  listEl.innerHTML = '';
  Promise.all([dbGetAll('sets'), dbGetAll('ejercicios')]).then(function(r) {
    var sets = r[0].filter(function(s) { return s.sesion_id === sesion.id; });
    var ejercicios = r[1];
    var ejMap = {};
    ejercicios.forEach(function(e) { ejMap[e.id] = e; });

    var order = [];
    var byEj = {};
    sets.forEach(function(st) {
      if (!byEj[st.ejercicio_id]) { byEj[st.ejercicio_id] = []; order.push(st.ejercicio_id); }
      byEj[st.ejercicio_id].push(st);
    });

    if (order.length === 0) {
      listEl.appendChild(createElement('div', { class: 'g-empty-card' }, [
        'Toca "+ Agregar ejercicio" para empezar.'
      ]));
      return;
    }

    order.forEach(function(ejId, i) {
      var ej = ejMap[ejId];
      if (!ej) return;
      var card = gymBuildExerciseCard(sesion, ej, byEj[ejId], listEl, i === 0);
      listEl.appendChild(card);
    });
  });
}

function gymBuildExerciseCard(sesion, ej, sets, listEl, defaultExpanded) {
  var card = createElement('div', { class: 'g-ex-card' + (defaultExpanded ? ' open' : '') });

  var visibleSets = sets.filter(function(st) {
    return !(st.status === GYM_STATUS.PENDING && Number(st.peso) === 0 && Number(st.reps) === 0);
  }).sort(function(a, b) { return (a.orden || a.id) - (b.orden || b.id); });
  var doneCount = visibleSets.filter(function(s) { return s.status === GYM_STATUS.DONE; }).length;
  var totalCount = visibleSets.length;

  // Header (clickable para expandir)
  var head = createElement('button', { class: 'g-ex-head', type: 'button' });
  var muscleStr = gymParseMuscleArr(ej.musculo_primario).join(' · ') || 'sin músculo';
  head.appendChild(createElement('div', {}, [
    createElement('div', { class: 'g-ex-name' }, [ej.nombre]),
    createElement('div', { class: 'g-ex-muscle' }, [muscleStr])
  ]));
  var headRight = createElement('div', { class: 'g-ex-head-right' });
  headRight.appendChild(createElement('div', { class: 'g-ex-count' }, [
    doneCount + '/' + (totalCount || '—')
  ]));
  var chev = ICON.chevronDown({ size: 18 });
  chev.setAttribute('class', 'g-ex-chevron');
  headRight.appendChild(chev);
  head.appendChild(headRight);
  head.addEventListener('click', function() { card.classList.toggle('open'); });
  card.appendChild(head);

  // Body
  var body = createElement('div', { class: 'g-ex-body' });

  // Tools (delete exercise)
  var tools = createElement('div', { class: 'g-ex-tools' });
  var delEx = createElement('button', { class: 'g-ex-del', type: 'button', title: 'Quitar ejercicio' }, ['🗑']);
  delEx.addEventListener('click', function() {
    gymConfirmAction('¿Eliminar ejercicio y sus sets de esta sesión?', function() {
      Promise.all(sets.map(function(s) { return dbDelete('sets', s.id); }))
        .then(function() { gymRefreshSessionExercises(sesion, listEl); });
    });
  });
  tools.appendChild(delEx);
  body.appendChild(tools);

  // Última sesión collapsible
  var lastToggle = createElement('button', { class: 'g-last-toggle', type: 'button' }, [
    createElement('span', { class: 'g-last-chev' }, ['›']),
    'Última sesión'
  ]);
  var lastDateSpan = createElement('span', { class: 'g-last-date' });
  lastToggle.appendChild(lastDateSpan);
  body.appendChild(lastToggle);

  var lastBody = createElement('div', { class: 'g-last-body' }, [
    createElement('div', { class: 'g-last-empty' }, ['Cargando…'])
  ]);
  body.appendChild(lastBody);

  lastToggle.addEventListener('click', function() {
    var open = lastToggle.classList.toggle('open');
    card.classList.toggle('last-open', open);
  });

  gymGetLastSessionSetsForEjercicio(ej.id, sesion.id).then(function(prev) {
    lastBody.innerHTML = '';
    if (!prev || !prev.sets || prev.sets.length === 0) {
      lastBody.appendChild(createElement('div', { class: 'g-last-empty' }, ['N/A — sin registros previos']));
      return;
    }
    lastDateSpan.textContent = ' · ' + gymFormatDateShort(prev.fecha);
    lastBody.appendChild(createElement('div', { class: 'g-last-header' }, [gymFormatDateLong(prev.fecha)]));
    prev.sets.forEach(function(st, i) {
      var lbsNum = gymWeightLbsNum(st.peso);
      var pesoLabel = lbsNum != null ? lbsNum : '—';
      lastBody.appendChild(createElement('div', { class: 'g-last-row' }, [
        createElement('span', {}, ['Set ' + (i + 1)]),
        createElement('span', {}, [
          createElement('b', {}, [String(pesoLabel)]),
          ' lbs × ',
          createElement('b', {}, [String(st.reps)])
        ])
      ]));
    });
  });

  // Sets list
  var setsList = createElement('div', { class: 'g-sets-list' });
  visibleSets.forEach(function(st, idx) {
    setsList.appendChild(gymBuildSetRow(sesion, ej, st, idx + 1, listEl));
  });
  body.appendChild(setsList);

  // Add set row
  body.appendChild(gymBuildAddSetRow(sesion, ej, sets, listEl));

  card.appendChild(body);
  return card;
}

function gymBuildSetRow(sesion, ej, set, setNum, listEl) {
  var row = createElement('div', { class: 'g-set-row' });
  var status = set.status || GYM_STATUS.DONE;
  var lbsNum = gymWeightLbsNum(set.peso);
  var pesoLabel = lbsNum != null ? String(lbsNum) : '—';

  row.appendChild(createElement('div', { class: 'g-set-n' }, ['Set ' + setNum]));
  row.appendChild(createElement('div', { class: 'g-set-val' }, [
    createElement('b', {}, [pesoLabel]),
    createElement('span', {}, ['lbs'])
  ]));
  row.appendChild(createElement('div', { class: 'g-set-times' }, ['×']));
  row.appendChild(createElement('div', { class: 'g-set-val' }, [
    createElement('b', {}, [String(set.reps)])
  ]));

  var chip = gymStatusChip(status, function() {
    var next = status === GYM_STATUS.PENDING ? GYM_STATUS.DONE :
               status === GYM_STATUS.DONE    ? GYM_STATUS.SKIPPED :
               GYM_STATUS.PENDING;
    set.status = next;
    dbPut('sets', set).then(function() { gymRefreshSessionExercises(sesion, listEl); });
  });
  row.appendChild(chip);

  var del = createElement('button', { class: 'g-set-del', type: 'button', title: 'Eliminar set' }, ['×']);
  del.addEventListener('click', function() {
    dbDelete('sets', set.id).then(function() { gymRefreshSessionExercises(sesion, listEl); });
  });
  row.appendChild(del);
  return row;
}

function gymBuildAddSetRow(sesion, ej, sets, listEl) {
  var setUnit = 'lbs';
  var addRow = createElement('div', { class: 'g-add-set' });
  var pesoInput = createElement('input', {
    class: 'g-input-num', type: 'number',
    placeholder: 'Peso', step: '0.5', inputmode: 'decimal'
  });

  // Toggle de unidad estilo segmented control
  var lbsBtn = createElement('button', { type: 'button', class: 'active' }, ['lbs']);
  var kgBtn = createElement('button', { type: 'button' }, ['kg']);
  var unitToggle = createElement('div', { class: 'g-unit-toggle' }, [lbsBtn, kgBtn]);
  function setUnitActive(u) {
    setUnit = u;
    lbsBtn.classList.toggle('active', u === 'lbs');
    kgBtn.classList.toggle('active', u === 'kg');
  }
  lbsBtn.addEventListener('click', function() { setUnitActive('lbs'); });
  kgBtn.addEventListener('click', function() { setUnitActive('kg'); });

  var repsInput = createElement('input', {
    class: 'g-input-num', type: 'number',
    placeholder: 'Reps', step: '1', inputmode: 'numeric'
  });
  var confirmBtn = createElement('button', {
    class: 'g-confirm-set', type: 'button', title: 'Confirmar set'
  }, ['+']);
  confirmBtn.addEventListener('click', function() {
    var inputVal = parseFloat(pesoInput.value);
    var reps = parseInt(repsInput.value, 10);
    if (!(inputVal >= 0) || !(reps > 0)) { showToast('Peso y reps requeridos'); return; }
    var pesoKg = gymInputToKg(inputVal, setUnit);
    pesoKg = Math.round(pesoKg * 1000) / 1000;
    var orden = sets.length > 0 ? Math.max.apply(null, sets.map(function(s) { return s.orden || 0; })) + 1 : 1;
    var newSet = {
      sesion_id: sesion.id,
      ejercicio_id: ej.id,
      peso: pesoKg,
      reps: reps,
      orden: orden,
      status: GYM_STATUS.DONE
    };
    dbPut('sets', newSet).then(function() {
      pesoInput.value = '';
      repsInput.value = '';
      gymRefreshSessionExercises(sesion, listEl);
      gymStartRestTimer();
    });
  });

  addRow.appendChild(pesoInput);
  addRow.appendChild(unitToggle);
  addRow.appendChild(repsInput);
  addRow.appendChild(confirmBtn);
  return addRow;
}

// ─── Última sesión por ejercicio ────────────────────────────────────────────────
function gymGetLastSessionSetsForEjercicio(ejercicio_id, excludeSesionId) {
  return Promise.all([dbGetAll('sets'), dbGetAll('sesiones')]).then(function(r) {
    var sets = r[0], sesiones = r[1];
    var sesionMap = {};
    sesiones.forEach(function(s) { sesionMap[s.id] = s; });

    var real = sets.filter(function(s) {
      if (s.ejercicio_id !== ejercicio_id) return false;
      if (s.sesion_id === excludeSesionId) return false;
      if (s.status === GYM_STATUS.PENDING && Number(s.peso) === 0 && Number(s.reps) === 0) return false;
      return true;
    });
    if (real.length === 0) return null;

    var bySes = {};
    real.forEach(function(s) {
      if (!bySes[s.sesion_id]) bySes[s.sesion_id] = [];
      bySes[s.sesion_id].push(s);
    });

    var sesionIds = Object.keys(bySes).map(function(k) { return Number(k); });
    sesionIds.sort(function(a, b) {
      var sa = sesionMap[a], sb = sesionMap[b];
      var ta = (sa && (sa.timestamp_inicio || (sa.fecha ? new Date(sa.fecha).getTime() : 0))) || a;
      var tb = (sb && (sb.timestamp_inicio || (sb.fecha ? new Date(sb.fecha).getTime() : 0))) || b;
      return tb - ta;
    });
    var pickId = sesionIds[0];
    var picked = bySes[pickId].slice().sort(function(a, b) { return (a.orden || a.id) - (b.orden || b.id); });
    var sesion = sesionMap[pickId];
    return { sesion_id: pickId, fecha: sesion ? sesion.fecha : null, sets: picked };
  });
}

// ─── Rest timer ────────────────────────────────────────────────────────────────
function gymStartRestTimer() {
  var bar = document.getElementById('gym-rest-bar');
  if (!bar) return;
  if (_gymRestTimerId) clearInterval(_gymRestTimerId);
  _gymRestRemaining = GYM_REST_DURATION;
  _gymRestTotal = GYM_REST_DURATION;

  bar.innerHTML = '';
  bar.classList.remove('hidden');

  var clockIcon = ICON.clock({ size: 16, color: 'var(--accent)' });
  var label = createElement('div', { class: 'g-rest-label' }, ['Descanso']);
  var time = createElement('div', { class: 'g-rest-time', id: 'gym-rest-time' }, [String(_gymRestRemaining) + 's']);
  var prog = createElement('div', { class: 'g-rest-progress' });
  var fill = createElement('div', { class: 'g-rest-progress-fill', id: 'gym-rest-fill' });
  fill.style.width = '100%';
  prog.appendChild(fill);
  var skip = createElement('button', { class: 'g-rest-skip', type: 'button' }, ['Saltar']);
  skip.addEventListener('click', gymStopRestTimer);

  bar.appendChild(clockIcon);
  bar.appendChild(label);
  bar.appendChild(time);
  bar.appendChild(prog);
  bar.appendChild(skip);

  _gymRestTimerId = setInterval(function() {
    _gymRestRemaining -= 1;
    var t = document.getElementById('gym-rest-time');
    var f = document.getElementById('gym-rest-fill');
    if (!t || !f) { gymStopRestTimer(); return; }
    t.textContent = _gymRestRemaining + 's';
    f.style.width = ((_gymRestRemaining / _gymRestTotal) * 100) + '%';
    if (_gymRestRemaining <= 0) {
      gymStopRestTimer();
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      showToast('Descanso terminado');
    }
  }, 1000);
}

function gymStopRestTimer() {
  if (_gymRestTimerId) { clearInterval(_gymRestTimerId); _gymRestTimerId = null; }
  var bar = document.getElementById('gym-rest-bar');
  if (bar) bar.classList.add('hidden');
}

// ─── Modal: agregar ejercicio a la sesión ──────────────────────────────────────
function gymShowAddExerciseModal(sesion, listEl) {
  var modal = createElement('div', { class: 'g-modal' });
  modal.appendChild(createElement('div', { class: 'g-modal-handle' }));
  modal.appendChild(createElement('div', { class: 'g-modal-head' }, [
    createElement('div', { class: 'g-modal-title' }, ['Agregar ejercicio']),
    gymBuildModalClose(function() { overlay.remove(); })
  ]));

  var searchWrap = createElement('div', { class: 'g-search-wrap' });
  var sIcon = ICON.search({ size: 17 }); sIcon.setAttribute('class', 'g-search-icon');
  searchWrap.appendChild(sIcon);
  var search = createElement('input', {
    class: 'g-search', type: 'text',
    placeholder: 'Buscar ejercicio…', autocomplete: 'off'
  });
  searchWrap.appendChild(search);
  modal.appendChild(searchWrap);

  var sugg = createElement('div', { class: 'g-suggest' });
  modal.appendChild(sugg);

  var newBtn = createElement('button', { class: 'g-btn-secondary', type: 'button' }, ['+ Crear ejercicio nuevo']);
  newBtn.addEventListener('click', function() {
    overlay.remove();
    gymShowNewExerciseModal(function(newEj) {
      gymAttachExerciseToSession(sesion, newEj, listEl);
    }, sesion.routine_type);
  });
  modal.appendChild(newBtn);

  dbGetAll('ejercicios').then(function(all) {
    function render(term) {
      sugg.innerHTML = '';
      var t = (term || '').trim();
      if (!t) {
        sugg.appendChild(createElement('div', { class: 'g-suggest-empty' }, ['Escribe para buscar.']));
        return;
      }
      var tKey = gymNormalizeKey(t);
      var filtered = all.filter(function(e) { return gymNormalizeKey(e.nombre).indexOf(tKey) >= 0; })
        .sort(function(a, b) { return a.nombre.localeCompare(b.nombre); }).slice(0, 8);
      if (filtered.length === 0) {
        sugg.appendChild(createElement('div', { class: 'g-suggest-empty' }, ['Sin coincidencias. Usa "Crear ejercicio nuevo".']));
        return;
      }
      filtered.forEach(function(e) {
        var muscles = gymParseMuscleArr(e.musculo_primario).join(' · ');
        var item = createElement('button', { class: 'g-suggest-row', type: 'button' }, [
          createElement('div', { style: 'font-weight:600;color:var(--t1);' }, [e.nombre]),
          createElement('div', { class: 'g-suggest-meta' }, [(e.tipo || '—') + ' · ' + (muscles || 'sin músculo')])
        ]);
        item.addEventListener('click', function() {
          overlay.remove();
          gymAttachExerciseToSession(sesion, e, listEl);
        });
        sugg.appendChild(item);
      });
    }
    render('');
    search.addEventListener('input', function() { render(search.value); });
  });

  var overlay = gymOpenOverlay(modal);
  setTimeout(function() { search.focus(); }, 80);
}

function gymAttachExerciseToSession(sesion, ej, listEl) {
  var routine = sesion.routine_type;
  var tagPromise = (routine && ej.tipo !== routine)
    ? (function() { ej.tipo = routine; return dbPut('ejercicios', ej); })()
    : Promise.resolve();

  tagPromise.then(function() {
    var placeholder = {
      sesion_id: sesion.id, ejercicio_id: ej.id,
      peso: 0, reps: 0, orden: 1, status: GYM_STATUS.PENDING
    };
    return dbPut('sets', placeholder);
  }).then(function() {
    gymRefreshSessionExercises(sesion, listEl);
  });
}

// ─── Modal: nuevo ejercicio ────────────────────────────────────────────────────
function gymShowNewExerciseModal(onCreated, defaultRoutine) {
  var modal = createElement('div', { class: 'g-modal' });
  modal.appendChild(createElement('div', { class: 'g-modal-handle' }));
  modal.appendChild(createElement('div', { class: 'g-modal-head' }, [
    createElement('div', { class: 'g-modal-title' }, ['Crear ejercicio']),
    gymBuildModalClose(function() { overlay.remove(); })
  ]));

  modal.appendChild(createElement('div', { class: 'g-modal-sub' }, ['Nombre']));
  var nameInput = createElement('input', {
    class: 'g-modal-input', type: 'text', placeholder: 'Nombre del ejercicio'
  });
  modal.appendChild(nameInput);

  modal.appendChild(createElement('div', { class: 'g-modal-sub' }, ['Rutina']));
  var typeInput = createElement('input', {
    class: 'g-modal-input', type: 'text',
    placeholder: 'Ej. Upper, Push, Leg Day…', autocomplete: 'off'
  });
  if (defaultRoutine) typeInput.value = defaultRoutine;
  modal.appendChild(typeInput);

  var typeSugg = createElement('div', { class: 'g-suggest' });
  typeSugg.style.display = 'none';
  modal.appendChild(typeSugg);

  Promise.all([dbGetAll('sesiones'), dbGetAll('ejercicios')]).then(function(r) {
    var nameSet = {};
    r[0].forEach(function(s) { if (s.routine_type) nameSet[s.routine_type] = true; });
    r[1].forEach(function(e) { if (e.tipo) nameSet[e.tipo] = true; });
    var allNames = Object.keys(nameSet).sort();
    function render(term) {
      typeSugg.innerHTML = '';
      var t = (term || '').trim();
      var tKey = gymNormalizeKey(t);
      if (!t) { typeSugg.style.display = 'none'; return; }
      var filtered = allNames.filter(function(n) { return gymNormalizeKey(n).indexOf(tKey) >= 0; });
      if (filtered.length === 0) { typeSugg.style.display = 'none'; return; }
      filtered.slice(0, 5).forEach(function(n) {
        var item = createElement('button', { class: 'g-suggest-row', type: 'button' }, [n]);
        item.addEventListener('click', function() {
          typeInput.value = n;
          typeSugg.style.display = 'none';
        });
        typeSugg.appendChild(item);
      });
      typeSugg.style.display = '';
    }
    typeInput.addEventListener('input', function() { render(typeInput.value); });
  });

  modal.appendChild(createElement('div', { class: 'g-modal-sub' }, ['Músculos']));
  var picker = gymBuildMusclePicker({ initialSelected: [] });
  modal.appendChild(picker.container);

  var createBtn = createElement('button', { class: 'g-btn-primary', type: 'button' }, ['Crear ejercicio']);
  createBtn.addEventListener('click', function() {
    var nombre = nameInput.value.trim();
    if (!nombre) { showToast('Nombre requerido'); return; }
    var muscles = picker.getSelected();
    if (muscles.length === 0) { showToast('Selecciona al menos un músculo'); return; }
    var record = {
      nombre: nombre,
      musculo_primario: JSON.stringify(muscles),
      tipo: typeInput.value.trim() || null,
      fecha_creacion: new Date().toISOString()
    };
    dbPut('ejercicios', record).then(function(id) {
      record.id = id;
      overlay.remove();
      showToast('Ejercicio creado');
      if (onCreated) onCreated(record);
    }).catch(function() {
      showToast('Error: nombre duplicado');
    });
  });
  modal.appendChild(createBtn);

  var overlay = gymOpenOverlay(modal);
  setTimeout(function() { nameInput.focus(); }, 80);
}

// ─── Finalizar sesión ──────────────────────────────────────────────────────────
function gymConfirmFinalize(sesion, panel) {
  // Calcular stats reales para el modal de confirmación
  Promise.all([dbGetAll('sets'), dbGetAll('ejercicios')]).then(function(r) {
    var allSets = r[0].filter(function(s) { return s.sesion_id === sesion.id; });
    var visible = allSets.filter(function(s) {
      return !(s.status === GYM_STATUS.PENDING && Number(s.peso) === 0 && Number(s.reps) === 0);
    });
    var done = visible.filter(function(s) { return s.status === GYM_STATUS.DONE; }).length;
    var pending = visible.filter(function(s) { return s.status === GYM_STATUS.PENDING; }).length;
    var ejIds = {}; allSets.forEach(function(s) { ejIds[s.ejercicio_id] = true; });
    var nEj = Object.keys(ejIds).length;
    var dur = Date.now() - (sesion.timestamp_inicio || Date.now());
    // Volumen total (kg→lbs)
    var volKg = visible.reduce(function(sum, s) {
      if (s.status === GYM_STATUS.DONE) return sum + (Number(s.peso) * Number(s.reps));
      return sum;
    }, 0);
    var volLbs = Math.round(gymKgToLbs(volKg) || 0);

    var modal = createElement('div', { class: 'g-modal' });
    modal.appendChild(createElement('div', { class: 'g-modal-handle' }));
    modal.appendChild(createElement('div', { class: 'g-modal-head' }, [
      createElement('div', { class: 'g-modal-title' }, ['¿Finalizar sesión?']),
      gymBuildModalClose(function() { overlay.remove(); })
    ]));

    var summary = createElement('div', { class: 'g-confirm-summary' }, [
      buildConfirmRow('Duración', gymFormatDuration(dur)),
      buildConfirmRow('Ejercicios', String(nEj)),
      buildConfirmRow('Sets completados', done + ' / ' + visible.length),
      buildConfirmRow('Volumen total', volLbs.toLocaleString('es-MX') + ' lbs')
    ]);
    modal.appendChild(summary);

    if (pending > 0) {
      modal.appendChild(createElement('div', { class: 'g-confirm-warn' }, [
        pending + (pending === 1 ? ' set queda pendiente.' : ' sets quedan pendientes.') +
        ' Se descartarán al finalizar.'
      ]));
    }

    var doneBtn = createElement('button', { class: 'g-btn-primary', type: 'button' }, ['Finalizar y guardar']);
    doneBtn.addEventListener('click', function() {
      overlay.remove();
      var now = Date.now();
      sesion.finalizada = true;
      sesion.duracion_ms = now - (sesion.timestamp_inicio || now);
      // Limpiar placeholders 0/0 Pending
      dbGetAll('sets').then(function(all) {
        var placeholders = all.filter(function(s) {
          return s.sesion_id === sesion.id
            && Number(s.peso) === 0 && Number(s.reps) === 0
            && s.status === GYM_STATUS.PENDING;
        });
        return Promise.all(placeholders.map(function(s) { return dbDelete('sets', s.id); }));
      }).then(function() {
        return dbPut('sesiones', sesion);
      }).then(function() {
        gymStopTimer();
        showToast('Sesión guardada');
        gymRenderEntrenar(panel);
      });
    });
    var continueBtn = createElement('button', { class: 'g-btn-secondary', type: 'button' }, ['Continuar entrenando']);
    continueBtn.addEventListener('click', function() { overlay.remove(); });
    modal.appendChild(doneBtn);
    modal.appendChild(continueBtn);

    var overlay = gymOpenOverlay(modal);
  });
}

function buildConfirmRow(label, value) {
  return createElement('div', { class: 'g-confirm-row' }, [
    createElement('span', {}, [label]),
    createElement('b', {}, [value])
  ]);
}

function gymConfirmAction(msg, onConfirm) {
  var modal = createElement('div', { class: 'g-modal' });
  modal.appendChild(createElement('div', { class: 'g-modal-handle' }));
  modal.appendChild(createElement('div', { class: 'g-modal-head' }, [
    createElement('div', { class: 'g-modal-title' }, ['Confirmar']),
    gymBuildModalClose(function() { overlay.remove(); })
  ]));
  modal.appendChild(createElement('div', { class: 'g-modal-body' }, [msg]));
  var ok = createElement('button', { class: 'g-btn-primary', type: 'button' }, ['Sí, continuar']);
  var cancel = createElement('button', { class: 'g-btn-secondary', type: 'button' }, ['Cancelar']);
  ok.addEventListener('click', function() { overlay.remove(); onConfirm(); });
  cancel.addEventListener('click', function() { overlay.remove(); });
  modal.appendChild(ok);
  modal.appendChild(cancel);
  var overlay = gymOpenOverlay(modal);
}

// ─── Muscle picker (reutilizable) ──────────────────────────────────────────────
function gymBuildMusclePicker(opts) {
  opts = opts || {};
  var initial = (opts.initialSelected || []).filter(Boolean);
  var selectedMuscles = {};
  initial.forEach(function(m) { selectedMuscles[m] = true; });

  var wrap = createElement('div', {});

  var chipsWrap = createElement('div', { class: 'g-muscle-chips' });
  wrap.appendChild(chipsWrap);

  var searchWrap = createElement('div', { class: 'g-search-wrap', style: 'margin-top:8px;' });
  var sIcon = ICON.search({ size: 17 }); sIcon.setAttribute('class', 'g-search-icon');
  searchWrap.appendChild(sIcon);
  var muscleSearch = createElement('input', {
    class: 'g-search', type: 'text',
    placeholder: 'Buscar o crear músculo…', autocomplete: 'off'
  });
  searchWrap.appendChild(muscleSearch);
  wrap.appendChild(searchWrap);

  var sugg = createElement('div', { class: 'g-suggest' });
  wrap.appendChild(sugg);

  var allMuscles = GYM_MUSCLE_GROUPS.slice();
  initial.forEach(function(m) {
    if (!allMuscles.some(function(x) { return gymNormalizeKey(x) === gymNormalizeKey(m); })) {
      allMuscles.push(m);
    }
  });

  function renderChips() {
    chipsWrap.innerHTML = '';
    Object.keys(selectedMuscles).forEach(function(m) {
      var chip = createElement('button', { type: 'button', class: 'g-muscle-chip-selected' }, [
        m, ' ✕'
      ]);
      chip.addEventListener('click', function() {
        delete selectedMuscles[m];
        renderChips();
        renderSugg(muscleSearch.value);
      });
      chipsWrap.appendChild(chip);
    });
  }

  function renderSugg(term) {
    sugg.innerHTML = '';
    var t = (term || '').trim();
    var tKey = gymNormalizeKey(t);
    var filtered = allMuscles.filter(function(m) {
      if (selectedMuscles[m]) return false;
      if (!t) return true;
      return gymNormalizeKey(m).indexOf(tKey) >= 0;
    });

    if (!t && filtered.length === 0) return;

    filtered.slice(0, 12).forEach(function(m) {
      var item = createElement('button', { class: 'g-suggest-row', type: 'button' }, [
        '+ ', m
      ]);
      item.addEventListener('click', function() {
        selectedMuscles[m] = true;
        muscleSearch.value = '';
        renderChips();
        renderSugg('');
      });
      sugg.appendChild(item);
    });

    if (t) {
      var exists = allMuscles.some(function(m) { return gymNormalizeKey(m) === tKey; });
      if (!exists && !selectedMuscles[t]) {
        var createItem = createElement('button', { class: 'g-suggest-row', type: 'button' }, [
          createElement('span', { class: 'g-suggest-create' }, ['+ Crear "' + t + '"'])
        ]);
        createItem.addEventListener('click', function() {
          selectedMuscles[t] = true;
          allMuscles.push(t);
          allMuscles.sort(function(a, b) { return a.localeCompare(b); });
          muscleSearch.value = '';
          renderChips();
          renderSugg('');
        });
        sugg.appendChild(createItem);
      }
    }
  }

  dbGetAll('ejercicios').then(function(all) {
    var seen = {};
    allMuscles.forEach(function(m) { seen[gymNormalizeKey(m)] = true; });
    all.forEach(function(e) {
      gymParseMuscleArr(e.musculo_primario).forEach(function(m) {
        if (!m) return;
        var key = gymNormalizeKey(m);
        if (!seen[key]) { seen[key] = true; allMuscles.push(m); }
      });
    });
    allMuscles.sort(function(a, b) { return a.localeCompare(b); });
    renderSugg(muscleSearch.value);
  });

  muscleSearch.addEventListener('input', function() { renderSugg(muscleSearch.value); });
  renderChips();

  return {
    container: wrap,
    getSelected: function() { return Object.keys(selectedMuscles); }
  };
}

// ─── Modal: editar músculos ────────────────────────────────────────────────────
function gymOpenEditMusclesModal(ej, onSaved) {
  var modal = createElement('div', { class: 'g-modal' });
  modal.appendChild(createElement('div', { class: 'g-modal-handle' }));
  modal.appendChild(createElement('div', { class: 'g-modal-head' }, [
    createElement('div', { class: 'g-modal-title' }, ['Editar músculos']),
    gymBuildModalClose(function() { overlay.remove(); })
  ]));
  modal.appendChild(createElement('div', { class: 'g-modal-sub', style: 'margin-top:0;' }, [ej.nombre]));

  var picker = gymBuildMusclePicker({ initialSelected: gymParseMuscleArr(ej.musculo_primario) });
  modal.appendChild(picker.container);

  var saveBtn = createElement('button', { class: 'g-btn-primary', type: 'button' }, ['Guardar cambios']);
  saveBtn.addEventListener('click', function() {
    var muscles = picker.getSelected();
    if (muscles.length === 0) { showToast('Selecciona al menos un músculo'); return; }
    gymConfirmAction(
      'Cambiar los músculos primarios de "' + ej.nombre + '"? Esto afecta también las sesiones pasadas.',
      function() {
        ej.musculo_primario = JSON.stringify(muscles);
        dbPut('ejercicios', ej).then(function() {
          overlay.remove();
          showToast('Músculos actualizados');
          if (onSaved) onSaved(ej);
        }).catch(function() { showToast('Error al guardar'); });
      }
    );
  });
  modal.appendChild(saveBtn);
  var cancelBtn = createElement('button', { class: 'g-btn-secondary', type: 'button' }, ['Cancelar']);
  cancelBtn.addEventListener('click', function() { overlay.remove(); });
  modal.appendChild(cancelBtn);

  var overlay = gymOpenOverlay(modal);
}

// ─── Modal helpers ─────────────────────────────────────────────────────────────
function gymOpenOverlay(modalEl) {
  var overlay = createElement('div', { class: 'g-modal-overlay' }, [modalEl]);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
  return overlay;
}

function gymBuildModalClose(onClose) {
  var btn = createElement('button', { class: 'g-modal-close', type: 'button' }, ['✕']);
  btn.addEventListener('click', onClose);
  return btn;
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — EJERCICIOS
// ══════════════════════════════════════════════════════════════════════════════
var _gymLibFilter = { type: null, search: '' };

function gymRenderEjercicios(panel) {
  panel.innerHTML = '';
  var wrap = createElement('div', { class: 'g-lib' });

  // Search
  var searchWrap = createElement('div', { class: 'g-search-wrap' });
  var sIcon = ICON.search({ size: 17 }); sIcon.setAttribute('class', 'g-search-icon');
  searchWrap.appendChild(sIcon);
  var search = createElement('input', {
    class: 'g-search', type: 'text', placeholder: 'Buscar ejercicio…'
  });
  search.value = _gymLibFilter.search || '';
  searchWrap.appendChild(search);
  wrap.appendChild(searchWrap);

  // Pills dinámicas
  var pills = createElement('div', { class: 'g-pills' });
  function makePill(label, value) {
    var active = _gymLibFilter.type === value || (value === null && _gymLibFilter.type === null);
    var p = createElement('button', { class: 'g-pill' + (active ? ' active' : ''), type: 'button' }, [label]);
    p.addEventListener('click', function() {
      _gymLibFilter.type = _gymLibFilter.type === value ? null : value;
      gymRenderEjercicios(panel);
    });
    return p;
  }
  pills.appendChild(makePill('Todos', null));
  wrap.appendChild(pills);

  Promise.all([dbGetAll('ejercicios'), dbGetAll('sesiones')]).then(function(r) {
    var nameSet = {};
    r[0].forEach(function(e) { if (e.tipo) nameSet[e.tipo] = true; });
    r[1].forEach(function(s) { if (s.routine_type) nameSet[s.routine_type] = true; });
    Object.keys(nameSet).sort().forEach(function(t) { pills.appendChild(makePill(t, t)); });
  });

  // Lista
  var listWrap = createElement('div', { id: 'gym-dir-list' });
  wrap.appendChild(listWrap);

  // CTA
  var addBtn = createElement('button', { class: 'g-add-cta', type: 'button' }, ['+ Crear ejercicio']);
  addBtn.addEventListener('click', function() {
    gymShowNewExerciseModal(function() { gymRenderEjercicios(panel); });
  });
  wrap.appendChild(addBtn);

  panel.appendChild(wrap);

  search.addEventListener('input', function() {
    _gymLibFilter.search = search.value;
    gymRenderLibraryItems(listWrap, panel);
  });
  gymRenderLibraryItems(listWrap, panel);
}

function gymRenderLibraryItems(listEl, panel) {
  listEl.innerHTML = '';
  Promise.all([dbGetAll('ejercicios'), dbGetAll('sets'), dbGetAll('sesiones')]).then(function(r) {
    var ejercicios = r[0], allSets = r[1], sesiones = r[2];
    var sesMap = {}; sesiones.forEach(function(s) { sesMap[s.id] = s; });
    var termKey = gymNormalizeKey(_gymLibFilter.search || '');
    var filtered = ejercicios.filter(function(e) {
      if (_gymLibFilter.type && e.tipo !== _gymLibFilter.type) return false;
      if (termKey && gymNormalizeKey(e.nombre).indexOf(termKey) < 0) return false;
      return true;
    });

    var groups = {};
    filtered.forEach(function(e) {
      var t = e.tipo || 'Sin tipo';
      if (!groups[t]) groups[t] = [];
      groups[t].push(e);
    });

    var keys = Object.keys(groups).sort(function(a, b) {
      if (a === 'Sin tipo') return 1;
      if (b === 'Sin tipo') return -1;
      return a.localeCompare(b);
    });

    if (keys.length === 0) {
      listEl.appendChild(createElement('div', { class: 'g-empty-card', style: 'margin-top:24px;' }, [
        'Sin ejercicios. Crea el primero abajo.'
      ]));
      return;
    }

    keys.forEach(function(k) {
      var items = (groups[k] || []).sort(function(a, b) { return a.nombre.localeCompare(b.nombre); });
      if (items.length === 0) return;
      listEl.appendChild(createElement('div', { class: 'g-section-label' }, [k.toUpperCase()]));
      var card = createElement('div', { class: 'g-list-card' });

      items.forEach(function(e) {
        var muscles = gymParseMuscleArr(e.musculo_primario).join(' · ') || 'sin músculo';
        // Buscar PR del ejercicio (mejor set absoluto)
        var setsEj = allSets.filter(function(s) {
          return s.ejercicio_id === e.id
            && s.status !== GYM_STATUS.PENDING
            && isFinite(Number(s.peso)) && Number(s.peso) > 0
            && isFinite(Number(s.reps)) && Number(s.reps) > 0;
        });
        var bestStr = '—';
        if (setsEj.length > 0) {
          var pr = setsEj.reduce(function(m, s) {
            if (Number(s.peso) > Number(m.peso)) return s;
            if (Number(s.peso) === Number(m.peso) && Number(s.reps) > Number(m.reps)) return s;
            return m;
          }, setsEj[0]);
          var lbsNum = gymWeightLbsNum(pr.peso);
          bestStr = (lbsNum != null ? lbsNum : '—') + ' × ' + pr.reps;
        }

        var row = createElement('button', { class: 'g-list-row', type: 'button' }, [
          createElement('div', {}, [
            createElement('div', { class: 'g-list-name' }, [e.nombre]),
            createElement('div', { class: 'g-list-sub' }, [muscles])
          ]),
          createElement('div', { class: 'g-list-right' }, [
            createElement('span', { class: 'g-list-pr' }, [bestStr]),
            createElement('span', { class: 'g-list-arrow' }, ['›'])
          ])
        ]);
        row.addEventListener('click', function() { gymRenderEjercicioDetail(panel, e); });
        card.appendChild(row);
      });
      listEl.appendChild(card);
    });
  });
}

function gymRenderEjercicioDetail(panel, ej) {
  panel.innerHTML = '';
  var wrap = createElement('div', { class: 'g-detail-screen' });

  var back = createElement('button', { class: 'g-back-inline', type: 'button' }, ['Ejercicios']);
  back.addEventListener('click', function() { gymRenderEjercicios(panel); });
  wrap.appendChild(back);

  wrap.appendChild(createElement('h2', { class: 'g-detail-title' }, [ej.nombre]));
  var muscles = gymParseMuscleArr(ej.musculo_primario);
  wrap.appendChild(createElement('div', { class: 'g-detail-sub' }, [
    muscles.length > 0 ? muscles.join(' · ') : 'sin músculo'
  ]));

  // Info grid
  var infoGrid = createElement('div', { class: 'g-info-grid' }, [
    createElement('div', { class: 'g-info-item' }, [
      createElement('div', { class: 'g-info-label' }, ['RUTINA']),
      createElement('div', { class: 'g-info-value' }, [ej.tipo || 'Sin tipo'])
    ]),
    createElement('div', { class: 'g-info-item' }, [
      createElement('div', { class: 'g-info-label' }, ['SESIONES']),
      createElement('div', { class: 'g-info-value', id: 'gym-detail-ses-count' }, ['—'])
    ])
  ]);
  wrap.appendChild(infoGrid);

  var editBtn = createElement('button', { class: 'g-edit-muscles', type: 'button' }, ['✏️ Editar músculos']);
  editBtn.addEventListener('click', function() {
    gymOpenEditMusclesModal(ej, function(updated) {
      gymRenderEjercicioDetail(panel, updated);
    });
  });
  wrap.appendChild(editBtn);

  wrap.appendChild(createElement('div', { class: 'g-section-label', style: 'padding-left:20px;' }, ['HISTORIAL']));

  var listWrap = createElement('div', { style: 'padding: 0 16px;' });
  wrap.appendChild(listWrap);

  panel.appendChild(wrap);

  Promise.all([dbGetAll('sets'), dbGetAll('sesiones')]).then(function(r) {
    var sets = r[0].filter(function(s) {
      return s.ejercicio_id === ej.id
        && s.status !== GYM_STATUS.PENDING
        && isFinite(Number(s.peso))
        && isFinite(Number(s.reps));
    });
    var sesiones = {};
    r[1].forEach(function(s) { sesiones[s.id] = s; });

    var bySesion = {};
    sets.forEach(function(st) {
      if (!bySesion[st.sesion_id]) bySesion[st.sesion_id] = [];
      bySesion[st.sesion_id].push(st);
    });

    var sesionCount = Object.keys(bySesion).length;
    var ctEl = document.getElementById('gym-detail-ses-count');
    if (ctEl) ctEl.textContent = String(sesionCount);

    if (sets.length === 0) {
      listWrap.appendChild(createElement('div', { class: 'g-empty-card' }, ['Sin registros aún para este ejercicio.']));
      return;
    }

    var rows = Object.keys(bySesion).map(function(sid) {
      var sesion = sesiones[sid];
      var arr = bySesion[sid];
      var ts = sesion ? (sesion.timestamp_inicio || new Date(sesion.fecha || 0).getTime()) : 0;
      var best = arr.slice().sort(function(a, b) {
        if (Number(b.peso) !== Number(a.peso)) return Number(b.peso) - Number(a.peso);
        return Number(b.reps) - Number(a.reps);
      })[0];
      return { fecha: sesion ? sesion.fecha : null, rt: sesion ? sesion.routine_type : null, ts: ts, count: arr.length, best: best };
    }).sort(function(a, b) { return b.ts - a.ts; });

    var card = createElement('div', { class: 'g-list-card' });
    rows.forEach(function(row) {
      var lbsNum = gymWeightLbsNum(row.best.peso);
      var bestStr = row.count + ' × ' + row.best.reps + ' a ' + (lbsNum != null ? lbsNum : '—') + ' lbs';
      var item = createElement('div', { class: 'g-list-row', style: 'cursor:default;' }, [
        createElement('div', {}, [
          createElement('div', { class: 'g-list-name' }, [gymFormatDateLong(row.fecha)]),
          createElement('div', { class: 'g-list-sub' }, [row.rt || 'Sin rutina'])
        ]),
        createElement('span', { class: 'g-list-pr' }, [bestStr])
      ]);
      card.appendChild(item);
    });
    listWrap.appendChild(card);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — PROGRESIÓN (Hero "Récord de la semana" + lista + detalle)
// ══════════════════════════════════════════════════════════════════════════════
function gymRenderProgresion(panel) {
  panel.innerHTML = '';
  var wrap = createElement('div', { class: 'g-prog' });

  // Slot para el hero (se rellena async)
  var heroSlot = createElement('div', { id: 'gym-prog-hero-slot' });
  wrap.appendChild(heroSlot);

  wrap.appendChild(createElement('div', { class: 'g-section-label' }, ['EJERCICIOS · TAP PARA VER PROGRESIÓN']));
  var listWrap = createElement('div', { id: 'gym-prog-list-with' });
  wrap.appendChild(listWrap);

  var noHistSlot = createElement('div', { id: 'gym-prog-list-no' });
  wrap.appendChild(noHistSlot);

  // Export / Import
  wrap.appendChild(createElement('div', { class: 'g-section-label' }, ['DATOS']));
  var eiWrap = createElement('div', { class: 'g-export-row' });
  var exportBtn = createElement('button', { class: 'g-secondary-btn', type: 'button' }, ['📤 Exportar']);
  exportBtn.addEventListener('click', function() { gymExportData(); });
  var importBtn = createElement('button', { class: 'g-secondary-btn', type: 'button' }, ['📥 Importar']);
  importBtn.addEventListener('click', function() { gymImportData(panel); });
  eiWrap.appendChild(exportBtn);
  eiWrap.appendChild(importBtn);
  wrap.appendChild(eiWrap);

  panel.appendChild(wrap);

  Promise.all([dbGetAll('ejercicios'), dbGetAll('sets'), dbGetAll('sesiones')]).then(function(r) {
    var ejercicios = r[0], sets = r[1], sesiones = r[2];
    var sesMap = {}; sesiones.forEach(function(s) { sesMap[s.id] = s; });

    if (ejercicios.length === 0) {
      listWrap.appendChild(createElement('div', { class: 'g-empty-card' }, [
        'Sin ejercicios. Crea uno desde la pestaña Ejercicios.'
      ]));
      return;
    }

    var realSets = sets.filter(function(s) {
      return s.status !== GYM_STATUS.PENDING
        && isFinite(Number(s.peso)) && Number(s.peso) > 0
        && isFinite(Number(s.reps)) && Number(s.reps) > 0;
    });

    // Hero "Récord de la semana"
    var weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    var weekSets = realSets.filter(function(s) {
      var ses = sesMap[s.sesion_id];
      var ts = ses ? (ses.timestamp_inicio || new Date(ses.fecha || 0).getTime()) : 0;
      return ts >= weekAgo;
    });
    if (weekSets.length > 0) {
      var weekBest = weekSets.reduce(function(m, s) {
        if (Number(s.peso) > Number(m.peso)) return s;
        if (Number(s.peso) === Number(m.peso) && Number(s.reps) > Number(m.reps)) return s;
        return m;
      }, weekSets[0]);
      var ejBest = ejercicios.find(function(e) { return e.id === weekBest.ejercicio_id; });
      if (ejBest) {
        // Sparkline: peso máximo por sesión del ejercicio campeón en últimos 7d
        var ejSets = realSets.filter(function(s) { return s.ejercicio_id === ejBest.id; });
        var bySesEj = {};
        ejSets.forEach(function(s) {
          var ts = sesMap[s.sesion_id];
          var t = ts ? (ts.timestamp_inicio || new Date(ts.fecha || 0).getTime()) : 0;
          if (t < weekAgo) return;
          if (!bySesEj[s.sesion_id]) bySesEj[s.sesion_id] = { ts: t, max: 0 };
          if (Number(s.peso) > bySesEj[s.sesion_id].max) bySesEj[s.sesion_id].max = Number(s.peso);
        });
        var sparkRows = Object.keys(bySesEj).map(function(k) { return bySesEj[k]; })
          .sort(function(a, b) { return a.ts - b.ts; });
        heroSlot.appendChild(gymBuildProgHero(ejBest, weekBest, sparkRows, sesMap));
      }
    }

    var withData = [], noData = [];
    ejercicios.forEach(function(ej) {
      var setsEj = realSets.filter(function(s) { return s.ejercicio_id === ej.id; });
      if (setsEj.length === 0) { noData.push(ej); return; }
      var pr = setsEj.reduce(function(m, s) {
        if (Number(s.peso) > Number(m.peso)) return s;
        if (Number(s.peso) === Number(m.peso) && Number(s.reps) > Number(m.reps)) return s;
        return m;
      }, setsEj[0]);
      var lastTs = 0;
      var sesIds = {};
      setsEj.forEach(function(s) {
        sesIds[s.sesion_id] = true;
        var ses = sesMap[s.sesion_id];
        var t = ses ? (ses.timestamp_inicio || new Date(ses.fecha || 0).getTime()) : 0;
        if (t > lastTs) lastTs = t;
      });
      withData.push({ ej: ej, pr: pr, lastTs: lastTs, sesionCount: Object.keys(sesIds).length });
    });
    withData.sort(function(a, b) { return b.lastTs - a.lastTs; });

    if (withData.length > 0) {
      var card = createElement('div', { class: 'g-list-card' });
      withData.forEach(function(item) {
        card.appendChild(gymBuildProgRow(panel, item.ej, item.pr, item.sesionCount));
      });
      listWrap.appendChild(card);
    } else {
      listWrap.appendChild(createElement('div', { class: 'g-empty-card' }, ['Aún no hay ejercicios con historial.']));
    }

    if (noData.length > 0) {
      noHistSlot.appendChild(createElement('div', { class: 'g-section-label dim' }, ['SIN HISTORIAL']));
      var dimCard = createElement('div', { class: 'g-list-card dim' });
      noData.sort(function(a, b) { return a.nombre.localeCompare(b.nombre); }).forEach(function(ej) {
        dimCard.appendChild(gymBuildProgRow(panel, ej, null, 0));
      });
      noHistSlot.appendChild(dimCard);
    }
  });
}

function gymBuildProgHero(ej, prSet, sparkRows, sesMap) {
  var lbsNum = gymWeightLbsNum(prSet.peso);
  var oneRM = Math.round((lbsNum != null ? lbsNum : 0) * (1 + Number(prSet.reps) / 30));

  var hero = createElement('div', { class: 'g-prog-hero' });
  hero.appendChild(createElement('div', { class: 'g-prog-hero-label' }, ['RÉCORD DE LA SEMANA']));
  hero.appendChild(createElement('div', { class: 'g-prog-hero-name' }, [ej.nombre]));
  hero.appendChild(createElement('div', { class: 'g-prog-hero-num' }, [
    createElement('span', { class: 'g-prog-hero-big' }, [String(lbsNum != null ? lbsNum : '—')]),
    createElement('span', { class: 'g-prog-hero-unit' }, ['lbs × ' + prSet.reps])
  ]));
  hero.appendChild(createElement('div', { class: 'g-prog-hero-sub' }, [
    '1RM est. ' + oneRM + ' lbs · fórmula Epley'
  ]));

  // Sparkline SVG
  if (sparkRows.length >= 2) {
    var W = 280, H = 48;
    var pesos = sparkRows.map(function(r) { return gymWeightLbsNum(r.max) || 0; });
    var minY = Math.min.apply(null, pesos) - 2;
    var maxY = Math.max.apply(null, pesos) + 2;
    if (minY === maxY) { minY -= 1; maxY += 1; }
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'g-prog-spark');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');

    var defs = document.createElementNS(ns, 'defs');
    var gradId = 'hg-spark-' + Math.random().toString(36).slice(2, 8);
    var grad = document.createElementNS(ns, 'linearGradient');
    grad.setAttribute('id', gradId);
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
    var st1 = document.createElementNS(ns, 'stop');
    st1.setAttribute('offset', '0%'); st1.setAttribute('stop-color', '#FF9F0A'); st1.setAttribute('stop-opacity', '0.4');
    var st2 = document.createElementNS(ns, 'stop');
    st2.setAttribute('offset', '100%'); st2.setAttribute('stop-color', '#FF9F0A'); st2.setAttribute('stop-opacity', '0');
    grad.appendChild(st1); grad.appendChild(st2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    var pts = pesos.map(function(p, i) {
      var x = (i / (pesos.length - 1)) * W;
      var y = H - ((p - minY) / (maxY - minY)) * H;
      return { x: x, y: y };
    });
    var areaD = pts.map(function(p, i) { return (i === 0 ? 'M ' : 'L ') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' ')
      + ' L ' + W + ' ' + H + ' L 0 ' + H + ' Z';
    var lineD = pts.map(function(p, i) { return (i === 0 ? 'M ' : 'L ') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' ');

    var area = document.createElementNS(ns, 'path');
    area.setAttribute('d', areaD); area.setAttribute('fill', 'url(#' + gradId + ')');
    svg.appendChild(area);
    var line = document.createElementNS(ns, 'path');
    line.setAttribute('d', lineD); line.setAttribute('fill', 'none');
    line.setAttribute('stroke', '#FF9F0A'); line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linecap', 'round'); line.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(line);
    hero.appendChild(svg);

    hero.appendChild(createElement('div', { class: 'g-prog-hero-axis' }, [
      createElement('span', {}, ['Hace 7 d']),
      createElement('span', {}, ['Hoy'])
    ]));
  }

  // Tap → detalle del ejercicio
  hero.style.cursor = 'pointer';
  hero.addEventListener('click', function() {
    // Buscar el panel para llamar a render detalle
    var panel = hero.closest('.tab-panel');
    if (panel) gymRenderProgresionDetail(panel, ej);
  });

  return hero;
}

function gymBuildProgRow(panel, ej, pr, sesionCount) {
  var muscles = gymParseMuscleArr(ej.musculo_primario).join(' · ') || 'sin músculo';
  var subStr = pr
    ? sesionCount + (sesionCount === 1 ? ' sesión · PR ' : ' sesiones · PR ') + (gymWeightLbsNum(pr.peso) || 0) + ' × ' + pr.reps
    : muscles;
  var row = createElement('button', { class: 'g-list-row', type: 'button' }, [
    createElement('div', {}, [
      createElement('div', { class: 'g-list-name' }, [ej.nombre]),
      createElement('div', { class: 'g-list-sub' }, [subStr])
    ]),
    createElement('span', { class: 'g-list-arrow' }, ['›'])
  ]);
  row.addEventListener('click', function() { gymRenderProgresionDetail(panel, ej); });
  return row;
}

function gymRenderProgresionDetail(panel, ej) {
  panel.innerHTML = '';
  var wrap = createElement('div', { class: 'g-detail-screen' });

  var back = createElement('button', { class: 'g-back-inline', type: 'button' }, ['Progresión']);
  back.addEventListener('click', function() { gymRenderProgresion(panel); });
  wrap.appendChild(back);

  wrap.appendChild(createElement('h2', { class: 'g-detail-title' }, [ej.nombre]));
  var muscles = gymParseMuscleArr(ej.musculo_primario);
  wrap.appendChild(createElement('div', { class: 'g-detail-sub' }, [
    (ej.tipo || 'Sin tipo') + ' · ' + (muscles.join(' · ') || 'sin músculo')
  ]));
  panel.appendChild(wrap);

  Promise.all([dbGetAll('sets'), dbGetAll('sesiones')]).then(function(r) {
    var sets = r[0].filter(function(s) {
      return s.ejercicio_id === ej.id
        && s.status !== GYM_STATUS.PENDING
        && isFinite(Number(s.peso)) && Number(s.peso) > 0
        && isFinite(Number(s.reps)) && Number(s.reps) > 0;
    });
    var sesMap = {};
    r[1].forEach(function(s) { sesMap[s.id] = s; });

    if (sets.length === 0) {
      wrap.appendChild(createElement('div', { class: 'g-empty-card', style: 'margin: 0 16px;' }, [
        'Sin sesiones registradas para este ejercicio.'
      ]));
      return;
    }

    // PR absoluto
    var prAbs = sets.reduce(function(m, s) {
      if (Number(s.peso) > Number(m.peso)) return s;
      if (Number(s.peso) === Number(m.peso) && Number(s.reps) > Number(m.reps)) return s;
      return m;
    }, sets[0]);
    var prAbsSesion = sesMap[prAbs.sesion_id];
    var prLbs = gymWeightLbsNum(prAbs.peso) || 0;
    var oneRM = Math.round(prLbs * (1 + Number(prAbs.reps) / 30));

    // PR card
    var prCard = createElement('div', { class: 'g-pr-card' });
    var prLabel = createElement('div', { class: 'g-pr-card-label' }, ['🏆 PERSONAL RECORD']);
    prCard.appendChild(prLabel);
    prCard.appendChild(createElement('div', { class: 'g-pr-card-value' }, [
      createElement('span', { class: 'g-pr-num' }, [String(prLbs)]),
      createElement('span', { class: 'g-pr-unit' }, ['lbs × ' + prAbs.reps])
    ]));
    prCard.appendChild(createElement('div', { class: 'g-pr-card-meta' }, [
      (prAbsSesion && prAbsSesion.fecha ? gymFormatDateLong(prAbsSesion.fecha) : 'fecha desconocida') +
      ' · 1RM est. ' + oneRM + ' lbs · Epley'
    ]));
    wrap.appendChild(prCard);

    // Agrupar por sesión
    var bySesion = {};
    sets.forEach(function(s) {
      if (!bySesion[s.sesion_id]) bySesion[s.sesion_id] = [];
      bySesion[s.sesion_id].push(s);
    });
    var sessionRows = Object.keys(bySesion).map(function(sid) {
      var arr = bySesion[sid].slice().sort(function(a, b) { return (a.orden || a.id) - (b.orden || b.id); });
      var sesion = sesMap[sid];
      var ts = sesion ? (sesion.timestamp_inicio || new Date(sesion.fecha || 0).getTime()) : 0;
      var maxPeso = arr.reduce(function(m, s) { return Math.max(m, Number(s.peso) || 0); }, 0);
      var bestSet = arr.reduce(function(best, s) {
        if (!best) return s;
        if (Number(s.peso) > Number(best.peso)) return s;
        if (Number(s.peso) === Number(best.peso) && Number(s.reps) > Number(best.reps)) return s;
        return best;
      }, null);
      var volumen = arr.reduce(function(sum, s) { return sum + (Number(s.peso) * Number(s.reps)); }, 0);
      return { sesion: sesion, ts: ts, sets: arr, maxPeso: maxPeso, bestSet: bestSet, volumen: volumen };
    }).sort(function(a, b) { return a.ts - b.ts; });

    // Marcar PRs en running max
    var runningMax = 0;
    sessionRows.forEach(function(row) {
      row.sets.forEach(function(s) {
        var p = Number(s.peso);
        s._isPR = p > runningMax;
        if (p > runningMax) runningMax = p;
      });
    });

    var last10Asc = sessionRows.slice(-10);
    var last10Desc = last10Asc.slice().reverse();

    // Chart
    wrap.appendChild(gymBuildSvgChart(last10Asc));

    // Lista de sesiones
    wrap.appendChild(createElement('div', { class: 'g-section-label', style: 'padding-left:20px;' }, [
      'ÚLTIMAS ' + last10Desc.length + (last10Desc.length === 1 ? ' SESIÓN' : ' SESIONES')
    ]));
    var listWrap = createElement('div', { style: 'padding: 0 16px;' });
    last10Desc.forEach(function(row) { listWrap.appendChild(gymBuildSessionDetails(row)); });
    wrap.appendChild(listWrap);
  });
}

function gymBuildSvgChart(rows) {
  var card = createElement('div', { class: 'g-chart-card' });
  card.appendChild(createElement('div', { class: 'g-section-label', style: 'padding:0 0 10px;' }, [
    'PESO MÁX · ÚLTIMAS ' + rows.length + (rows.length === 1 ? ' SESIÓN' : ' SESIONES')
  ]));

  if (rows.length === 0) {
    card.appendChild(createElement('div', { style: 'color:var(--t3);font-size:13px;padding:20px 0;text-align:center;' }, ['Sin datos.']));
    return card;
  }

  var W = 320, H = 120, padX = 14, padY = 14;
  var pesos = rows.map(function(r) { return gymWeightLbsNum(r.maxPeso) || 0; });
  var minP = Math.min.apply(null, pesos);
  var maxP = Math.max.apply(null, pesos);
  if (minP === maxP) { minP = Math.max(0, minP - 1); maxP = maxP + 1; }
  var range = maxP - minP;
  var step = rows.length > 1 ? (W - 2 * padX) / (rows.length - 1) : 0;
  var ns = 'http://www.w3.org/2000/svg';

  var svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('preserveAspectRatio', 'none');

  // Grid
  [0, 0.5, 1].forEach(function(t) {
    var y = padY + (1 - t) * (H - 2 * padY);
    var line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', padX); line.setAttribute('x2', W - padX);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke', 'rgba(255,255,255,0.06)');
    line.setAttribute('stroke-dasharray', '2 4');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  });

  var pts = rows.map(function(r, i) {
    var x = rows.length === 1 ? W / 2 : padX + i * step;
    var p = gymWeightLbsNum(r.maxPeso) || 0;
    var norm = range === 0 ? 0.5 : (p - minP) / range;
    var y = padY + (1 - norm) * (H - 2 * padY);
    return { x: x, y: y, row: r };
  });

  if (pts.length > 1) {
    var areaD = 'M ' + pts[0].x + ' ' + (H - padY) +
      ' L ' + pts.map(function(p) { return p.x + ' ' + p.y; }).join(' L ') +
      ' L ' + pts[pts.length - 1].x + ' ' + (H - padY) + ' Z';
    var area = document.createElementNS(ns, 'path');
    area.setAttribute('d', areaD);
    area.setAttribute('fill', 'rgba(255,159,10,0.18)');
    svg.appendChild(area);

    var lineD = 'M ' + pts.map(function(p) { return p.x + ' ' + p.y; }).join(' L ');
    var ln = document.createElementNS(ns, 'path');
    ln.setAttribute('d', lineD);
    ln.setAttribute('fill', 'none');
    ln.setAttribute('stroke', '#FF9F0A');
    ln.setAttribute('stroke-width', '2');
    ln.setAttribute('stroke-linecap', 'round');
    ln.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(ln);
  }

  pts.forEach(function(p) {
    var c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
    c.setAttribute('r', 3);
    c.setAttribute('fill', '#FF9F0A');
    var title = document.createElementNS(ns, 'title');
    title.textContent = gymFormatDateShort(p.row.sesion ? p.row.sesion.fecha : null) +
                        ': ' + (gymWeightLbsNum(p.row.maxPeso) || 0) + ' lbs';
    c.appendChild(title);
    svg.appendChild(c);
  });

  card.appendChild(svg);
  card.appendChild(createElement('div', { class: 'g-chart-axis' }, [
    createElement('span', {}, [gymFormatDateShort(rows[0].sesion ? rows[0].sesion.fecha : null)]),
    createElement('span', { class: 'g-chart-axis-mid' }, ['min ' + Math.round(minP) + ' / máx ' + Math.round(maxP) + ' lbs']),
    createElement('span', {}, [gymFormatDateShort(rows[rows.length - 1].sesion ? rows[rows.length - 1].sesion.fecha : null)])
  ]));
  return card;
}

function gymBuildSessionDetails(row) {
  var details = createElement('details', { class: 'g-session-row' });
  var summary = createElement('summary', { class: 'g-session-summary' });
  var routine = row.sesion && row.sesion.routine_type ? row.sesion.routine_type : '';
  var bestLbs = gymWeightLbsNum(row.bestSet.peso) || 0;
  var volLbs = Math.round(gymKgToLbs(row.volumen) || 0);
  summary.appendChild(createElement('div', {}, [
    createElement('div', { class: 'g-list-name' }, [
      gymFormatDateLong(row.sesion ? row.sesion.fecha : null),
      routine ? ' · ' : '',
      routine ? createElement('span', { style: 'color:var(--accent);' }, [routine]) : ''
    ]),
    createElement('div', { class: 'g-list-sub' }, [
      'Mejor: ' + bestLbs + ' × ' + row.bestSet.reps + ' · Vol: ' + volLbs.toLocaleString('es-MX')
    ])
  ]));
  summary.appendChild(createElement('span', { class: 'g-session-chev' }, ['›']));
  details.appendChild(summary);

  var setsBody = createElement('div', { class: 'g-session-sets' });
  row.sets.forEach(function(s, i) {
    var lbsNum = gymWeightLbsNum(s.peso);
    var srow = createElement('div', { class: 'g-session-set-row' });
    srow.appendChild(createElement('span', { class: 'g-set-n' }, ['Set ' + (i + 1)]));
    srow.appendChild(createElement('span', {}, [
      createElement('b', {}, [String(lbsNum != null ? lbsNum : '—')]),
      ' lbs × ',
      createElement('b', {}, [String(s.reps)])
    ]));
    if (s._isPR) {
      srow.appendChild(createElement('span', { class: 'g-pr-badge' }, ['🏆 PR']));
    } else if (s.status === GYM_STATUS.SKIPPED) {
      srow.appendChild(createElement('span', { class: 'g-skip-badge' }, ['skipped']));
    }
    setsBody.appendChild(srow);
  });
  details.appendChild(setsBody);
  return details;
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT / IMPORT
// ══════════════════════════════════════════════════════════════════════════════
function gymExportData() {
  Promise.all([
    dbGetAll('sesiones'),
    dbGetAll('ejercicios'),
    dbGetAll('sets')
  ]).then(function(results) {
    var payload = {
      version: 2,
      exportDate: new Date().toISOString(),
      sesiones:   results[0],
      ejercicios: results[1],
      sets:       results[2]
    };
    var json = JSON.stringify(payload, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var today = new Date().toISOString().slice(0, 10);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'habitos-gym-backup-' + today + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    showToast('Backup descargado');
  });
}

function gymImportData(panel) {
  var fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  fileInput.addEventListener('change', function() {
    var file = fileInput.files[0];
    document.body.removeChild(fileInput);
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      var data;
      try { data = JSON.parse(e.target.result); } catch(err) { showToast('Archivo no válido'); return; }
      if (!data || data.version == null
          || !Array.isArray(data.sesiones)
          || !Array.isArray(data.ejercicios)
          || !Array.isArray(data.sets)) {
        showToast('Archivo no válido');
        return;
      }
      var nSes = data.sesiones.length, nEj = data.ejercicios.length, nSet = data.sets.length;

      var modal = createElement('div', { class: 'g-modal' });
      modal.appendChild(createElement('div', { class: 'g-modal-handle' }));
      modal.appendChild(createElement('div', { class: 'g-modal-head' }, [
        createElement('div', { class: 'g-modal-title' }, ['Importar backup']),
        gymBuildModalClose(function() { overlay.remove(); })
      ]));
      modal.appendChild(createElement('div', { class: 'g-modal-body' }, [
        'El backup contiene ' + nSes + ' sesiones, ' + nEj + ' ejercicios y ' + nSet + ' sets. ' +
        '¿Importar? Los registros con el mismo ID se sobrescribirán.'
      ]));

      var confirmBtn = createElement('button', { class: 'g-btn-primary', type: 'button' }, ['Importar']);
      confirmBtn.addEventListener('click', function() {
        overlay.remove();
        openDB().then(function(db) {
          var tx = db.transaction(['sesiones', 'ejercicios', 'sets'], 'readwrite');
          var sStore = tx.objectStore('sesiones');
          var eStore = tx.objectStore('ejercicios');
          var setStore = tx.objectStore('sets');
          data.sesiones.forEach(function(r) { sStore.put(r); });
          data.ejercicios.forEach(function(r) { eStore.put(r); });
          data.sets.forEach(function(r) { setStore.put(r); });
          tx.oncomplete = function() {
            showToast(nSes + ' sesiones, ' + nEj + ' ejercicios, ' + nSet + ' sets importados.');
            gymRenderProgresion(panel);
          };
          tx.onerror = function() { showToast('Error al importar'); };
        });
      });
      var cancelBtn = createElement('button', { class: 'g-btn-secondary', type: 'button' }, ['Cancelar']);
      cancelBtn.addEventListener('click', function() { overlay.remove(); });
      modal.appendChild(confirmBtn);
      modal.appendChild(cancelBtn);
      var overlay = gymOpenOverlay(modal);
    };
    reader.readAsText(file);
  });

  fileInput.click();
}
