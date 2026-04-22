// ─── renderers/gym.js — Gym module (Benny Builds It Workout Tracker) ───────────
// 3 tabs:
//   Entrenar     — Workout Planner. Sesión activa, cronómetro, sets Pending/Done/Skipped
//   Ejercicios   — Exercise Library. Lista agrupada por Muscle Group / filtrable por Type
//   Progresión   — Completed Workouts + PR per ejercicio + export/import backup
//
// IndexedDB stores usados (via db.js, sin tocar db.js):
//   sesiones   { id, fecha (ISO), finalizada (bool), nombre?, timestamp_inicio?, duracion_ms? }
//   ejercicios { id, nombre (unique), musculo_primario (JSON string array), tipo? }
//   sets       { id, sesion_id, ejercicio_id, peso, reps, orden?, status? }
// Los campos con "?" son aditivos — registros antiguos sin ellos siguen funcionando.

// ─── Constantes ────────────────────────────────────────────────────────────────
var GYM_MUSCLE_GROUPS = ['Pecho','Espalda','Hombros','Bíceps','Tríceps','Piernas','Core','Glúteos'];
// Tipos de rutina = nombres definidos por el usuario (free-text). Se descubren dinámicamente.
var GYM_STATUS = { PENDING: 'Pending', DONE: 'Done', SKIPPED: 'Skipped' };
var GYM_STATUS_ICON = { Pending: '🔲', Done: '✅', Skipped: '❌' };

// ─── Estado en memoria ─────────────────────────────────────────────────────────
var _gymTimerId = null;
var _gymRestTimerId = null;
var _gymRestSeconds = 90;
var _gymRestRemaining = 0;
// Session cuya prompt de "Reanudar" ya fue resuelta en este page load.
// Permite cambiar de tab y volver sin re-disparar el modal.
var _gymAcknowledgedSession = null;

// ─── Unidades (kg canonical en DB, display siempre lbs; toggle por-set en input) ─
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

// ─── Utilidades ────────────────────────────────────────────────────────────────
function gymParseMuscleArr(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { var a = JSON.parse(raw); return Array.isArray(a) ? a : [raw]; }
  catch (e) { return [String(raw)]; }
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
  return (h > 0 ? h + ':' + pad(m) : m) + ':' + pad(s);
}

function gymTodayISO() {
  var d = new Date();
  return d.toISOString();
}

function gymStatusChip(status) {
  var s = status || GYM_STATUS.PENDING;
  var colorMap = {
    Pending: 'var(--t3)',
    Done:    'var(--accent)',
    Skipped: 'var(--red)'
  };
  var bgMap = {
    Pending: 'rgba(255,255,255,0.06)',
    Done:    'var(--accent-dim)',
    Skipped: 'rgba(255,69,58,0.15)'
  };
  return createElement('span', {
    class: 'gym-status-chip',
    style: 'display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;padding:3px 10px;border-radius:980px;background:' + bgMap[s] + ';color:' + colorMap[s] + ';'
  }, [GYM_STATUS_ICON[s] + ' ' + s]);
}

// ─── Entry point ──────────────────────────────────────────────────────────────
function renderGymModule(container) {
  container.innerHTML = '';

  // Tabs
  var tabBar = createElement('div', { class: 'main-tabs' });
  var tabContent = createElement('div', { id: 'gym-tab-content' });
  container.appendChild(tabBar);
  container.appendChild(tabContent);

  var tabs = [
    { id: 'entrenar', label: '▶ Entrenar' },
    { id: 'ejercicios', label: '📚 Ejercicios' },
    { id: 'progresion', label: '📈 Progresión' }
  ];

  var panels = {};
  tabs.forEach(function(tab, i) {
    var isFirst = i === 0;
    var btn = createElement('button', {
      class: 'main-tab' + (isFirst ? ' active' : ''),
      id: 'gym-tab-btn-' + tab.id
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
  // Refresh data-sensitive tabs al volver a entrar
  if (activeId === 'entrenar')   gymRenderEntrenar(panels.entrenar);
  if (activeId === 'ejercicios') gymRenderEjercicios(panels.ejercicios);
  if (activeId === 'progresion') gymRenderProgresion(panels.progresion);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — ENTRENAR (Workout Planner)
// ══════════════════════════════════════════════════════════════════════════════
function gymRenderEntrenar(panel) {
  panel.innerHTML = '';
  gymStopTimer();

  dbGetAll('sesiones').then(function(sesiones) {
    var activa = sesiones.find(function(s) { return s.finalizada === false; });
    if (activa) {
      // Si el usuario ya resolvió el prompt en este page load, ir directo a la sesión.
      if (_gymAcknowledgedSession === activa.id) {
        gymRenderActiveSession(panel, activa);
      } else {
        gymPromptResume(panel, activa, sesiones);
      }
    } else {
      _gymAcknowledgedSession = null;
      gymRenderStartScreen(panel, sesiones);
    }
  });
}

function gymPromptResume(panel, activa, sesiones) {
  // Check session age — if older than 24h, default to "ajustar hora"
  var startTs = activa.timestamp_inicio || (activa.fecha ? new Date(activa.fecha).getTime() : Date.now());
  var age = Date.now() - startTs;

  var modal = createElement('div', { class: 'gym-modal' });
  modal.appendChild(createElement('div', { class: 'gym-modal-title' }, ['Sesión sin finalizar']));
  modal.appendChild(createElement('div', {
    style: 'color:var(--t2);font-size:14px;margin-bottom:16px;line-height:1.5;'
  }, [
    (activa.nombre || 'Workout') + ' · iniciada hace ' + gymFormatDuration(age) + '. ¿Qué hacer con ella?'
  ]));

  var btnResume = createElement('button', { class: 'gym-btn-primary' }, ['▶ Reanudar']);
  btnResume.addEventListener('click', function() {
    overlay.remove();
    _gymAcknowledgedSession = activa.id;
    gymRenderActiveSession(panel, activa);
  });

  var btnSaveAs = createElement('button', { class: 'gym-btn-secondary' }, ['💾 Guardar como está']);
  btnSaveAs.addEventListener('click', function() {
    overlay.remove();
    activa.finalizada = true;
    activa.duracion_ms = activa.duracion_ms || age;
    dbPut('sesiones', activa).then(function() { gymRenderEntrenar(panel); });
  });

  var btnDelete = createElement('button', { class: 'gym-btn-danger' }, ['🗑 Eliminar']);
  btnDelete.addEventListener('click', function() {
    overlay.remove();
    // Eliminar sesión + sets asociados
    dbGetAll('sets').then(function(sets) {
      var toDelete = sets.filter(function(st) { return st.sesion_id === activa.id; });
      return Promise.all(toDelete.map(function(st) { return dbDelete('sets', st.id); }));
    }).then(function() {
      return dbDelete('sesiones', activa.id);
    }).then(function() { gymRenderEntrenar(panel); });
  });

  modal.appendChild(btnResume);
  modal.appendChild(btnSaveAs);
  modal.appendChild(btnDelete);

  var overlay = createElement('div', { class: 'gym-modal-overlay' }, [modal]);
  document.body.appendChild(overlay);
}

function gymRenderStartScreen(panel, sesiones) {
  panel.innerHTML = '';

  var wrap = createElement('div', { class: 'gym-start-screen', style: 'padding:20px;' });

  // Últimas 3 sesiones
  var finalizadas = sesiones
    .filter(function(s) { return s.finalizada === true; })
    .sort(function(a, b) { return (b.timestamp_inicio || new Date(b.fecha).getTime()) - (a.timestamp_inicio || new Date(a.fecha).getTime()); })
    .slice(0, 3);

  if (finalizadas.length > 0) {
    wrap.appendChild(createElement('div', {
      style: 'font-size:13px;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;font-weight:600;'
    }, ['ÚLTIMAS SESIONES']));

    var list = createElement('div', { style: 'display:flex;flex-direction:column;gap:10px;margin-bottom:28px;' });
    var pending = finalizadas.map(function(s) {
      return dbGetAll('sets').then(function(all) {
        var count = all.filter(function(st) { return st.sesion_id === s.id; }).length;
        var card = createElement('div', {
          style: 'background:var(--bg-card);border-radius:var(--radius-md);padding:14px 16px;display:flex;justify-content:space-between;align-items:center;'
        });
        var left = createElement('div', {}, [
          createElement('div', { style: 'font-weight:600;font-size:15px;color:var(--t1);margin-bottom:2px;' }, [s.nombre || 'Workout']),
          createElement('div', { style: 'font-size:13px;color:var(--t2);' }, [gymFormatDateLong(s.fecha) + ' · ' + count + (count === 1 ? ' set' : ' sets')])
        ]);
        var right = gymStatusChip(GYM_STATUS.DONE);
        card.appendChild(left);
        card.appendChild(right);
        list.appendChild(card);
      });
    });
    Promise.all(pending).then(function() { /* ya appended */ });
    wrap.appendChild(list);
  }

  // CTA: Iniciar sesión
  var startBtn = createElement('button', { class: 'gym-btn-primary' }, ['▶ Iniciar sesión']);
  startBtn.addEventListener('click', function() { gymShowStartModal(panel); });
  wrap.appendChild(startBtn);

  panel.appendChild(wrap);
}

function gymShowStartModal(panel) {
  var modal = createElement('div', { class: 'gym-modal' });
  modal.appendChild(createElement('div', { class: 'gym-modal-title' }, ['Nueva sesión']));
  modal.appendChild(createElement('div', {
    style: 'color:var(--t2);font-size:14px;margin-bottom:10px;'
  }, ['Nombre de la rutina:']));

  var input = createElement('input', {
    class: 'gym-search-input',
    type: 'text',
    placeholder: 'Ej. Upper, Push, Leg Day…',
    autocomplete: 'off'
  });
  modal.appendChild(input);

  var sugg = createElement('div', { class: 'gym-suggestions' });
  modal.appendChild(sugg);

  var startBtn = createElement('button', { class: 'gym-btn-primary' }, ['▶ Iniciar']);
  startBtn.addEventListener('click', function() {
    var name = input.value.trim();
    if (!name) { showToast('Escribe un nombre para la rutina'); return; }
    overlay.remove();
    gymCreateSession(panel, name);
  });
  modal.appendChild(startBtn);

  var cancelBtn = createElement('button', { class: 'gym-btn-secondary' }, ['Cancelar']);
  cancelBtn.addEventListener('click', function() { overlay.remove(); });
  modal.appendChild(cancelBtn);

  // Autocomplete: nombres de rutinas previas
  Promise.all([dbGetAll('sesiones'), dbGetAll('ejercicios')]).then(function(r) {
    var nameSet = {};
    r[0].forEach(function(s) { if (s.routine_type) nameSet[s.routine_type] = true; });
    r[1].forEach(function(e) { if (e.tipo) nameSet[e.tipo] = true; });
    var allNames = Object.keys(nameSet).sort();
    var render = function(term) {
      sugg.innerHTML = '';
      var t = (term || '').trim().toLowerCase();
      var filtered = allNames.filter(function(n) { return !t || n.toLowerCase().indexOf(t) >= 0; });
      if (filtered.length === 0 && !t) {
        sugg.appendChild(createElement('div', {
          style: 'padding:12px;color:var(--t3);font-size:13px;text-align:center;'
        }, ['Sin rutinas previas. Escribe una nueva.']));
        return;
      }
      filtered.slice(0, 8).forEach(function(n) {
        var item = createElement('div', { class: 'gym-suggestion-item' }, [n]);
        item.addEventListener('click', function() {
          overlay.remove();
          gymCreateSession(panel, n);
        });
        sugg.appendChild(item);
      });
    };
    render('');
    input.addEventListener('input', function() { render(input.value); });
  });

  var overlay = createElement('div', { class: 'gym-modal-overlay' }, [modal]);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  setTimeout(function() { input.focus(); }, 50);
}

function gymCreateSession(panel, routineType) {
  // Nombre auto: "Workout #N" basado en cuántas sesiones existan + 1
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

  // Header: nombre + fecha + cronómetro + status chip
  var header = createElement('div', { class: 'gym-active-header' });
  var titleRow = createElement('div', {
    style: 'display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;'
  });
  var titleBlock = createElement('div', {}, [
    createElement('div', { class: 'gym-session-title' }, [sesion.nombre || 'Workout']),
    createElement('div', { style: 'font-size:13px;color:var(--t2);margin-top:2px;' }, [gymFormatDateLong(sesion.fecha)])
  ]);
  titleRow.appendChild(titleBlock);
  titleRow.appendChild(gymStatusChip(GYM_STATUS.PENDING));

  var bottomRow = createElement('div', {
    style: 'display:flex;align-items:center;justify-content:flex-start;gap:12px;margin-top:6px;'
  });
  var timerEl = createElement('div', { class: 'gym-timer', id: 'gym-session-timer' }, ['0:00']);
  bottomRow.appendChild(timerEl);

  header.appendChild(titleRow);
  header.appendChild(bottomRow);
  panel.appendChild(header);

  gymStartSessionTimer(sesion.timestamp_inicio);

  // Rest timer (inicialmente oculto)
  var restBar = createElement('div', {
    id: 'gym-rest-bar',
    style: 'display:none;margin:0 20px 12px;padding:12px 16px;background:var(--accent-dim);border:1px solid var(--accent-border);border-radius:var(--radius-md);display:none;align-items:center;justify-content:space-between;gap:12px;'
  });
  panel.appendChild(restBar);

  // Lista de ejercicios
  var exList = createElement('div', { class: 'gym-exercises-list', id: 'gym-ex-list' });
  panel.appendChild(exList);

  gymRefreshSessionExercises(sesion, exList);

  // Agregar ejercicio
  var addExWrap = createElement('div', { style: 'padding: 12px 20px 6px;' });
  var addExBtn = createElement('button', { class: 'gym-btn-secondary' }, ['+ Agregar ejercicio']);
  addExBtn.addEventListener('click', function() {
    gymShowAddExerciseModal(sesion, exList);
  });
  addExWrap.appendChild(addExBtn);
  panel.appendChild(addExWrap);

  // Finalizar sesión
  var finWrap = createElement('div', { style: 'padding: 20px 20px 80px;' });
  var finBtn = createElement('button', { class: 'gym-btn-danger' }, ['Finalizar sesión']);
  finBtn.addEventListener('click', function() { gymConfirmFinalize(sesion, panel); });
  finWrap.appendChild(finBtn);
  panel.appendChild(finWrap);
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

    // Agrupar sets por ejercicio, preservando orden de aparición
    var order = [];
    var byEj = {};
    sets.forEach(function(st) {
      if (!byEj[st.ejercicio_id]) { byEj[st.ejercicio_id] = []; order.push(st.ejercicio_id); }
      byEj[st.ejercicio_id].push(st);
    });

    if (order.length === 0) {
      var hint = createElement('div', {
        style: 'padding:32px 20px;text-align:center;color:var(--t3);font-size:14px;'
      }, ['Toca "+ Agregar ejercicio" para empezar.']);
      listEl.appendChild(hint);
      return;
    }

    order.forEach(function(ejId) {
      var ej = ejMap[ejId];
      if (!ej) return;
      var card = gymBuildExerciseCard(sesion, ej, byEj[ejId], listEl);
      listEl.appendChild(card);
    });
  });
}

function gymBuildExerciseCard(sesion, ej, sets, listEl) {
  var card = createElement('div', { class: 'gym-exercise-card' });

  // Header: nombre + delete
  var head = createElement('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;' });
  head.appendChild(createElement('div', { class: 'gym-exercise-name' }, [ej.nombre]));
  var delEx = createElement('button', {
    class: 'gym-set-delete',
    title: 'Quitar ejercicio',
    style: 'font-size:16px;'
  }, ['🗑']);
  delEx.addEventListener('click', function() {
    gymConfirmAction('¿Eliminar ejercicio y sus sets de esta sesión?', function() {
      Promise.all(sets.map(function(s) { return dbDelete('sets', s.id); }))
        .then(function() { gymRefreshSessionExercises(sesion, listEl); });
    });
  });
  head.appendChild(delEx);
  card.appendChild(head);

  // Hint: última vez
  gymGetLastSetForEjercicio(ej.id, sesion.id).then(function(last) {
    if (last && isFinite(Number(last.peso)) && isFinite(Number(last.reps))) {
      var hint = createElement('div', {
        style: 'font-size:12px;color:var(--t3);margin-bottom:10px;'
      }, ['Última vez: ' + gymFormatWeight(last.peso) + ' × ' + last.reps + ' reps']);
      card.insertBefore(hint, card.children[1] || null);
    }
  });

  // Sets rows
  sets.sort(function(a, b) { return (a.orden || a.id) - (b.orden || b.id); });
  sets.forEach(function(st, idx) {
    var row = gymBuildSetRow(sesion, ej, st, idx + 1, listEl);
    card.appendChild(row);
  });

  // Agregar set — con toggle por-input lbs/kg (default lbs)
  var setUnit = 'lbs';
  var addSetRow = createElement('div', { class: 'gym-add-set-row' });
  var pesoInput = createElement('input', { class: 'gym-input-small', type: 'number', placeholder: 'Peso (lbs)', step: '0.5' });
  var unitToggle = createElement('button', {
    type: 'button',
    style: 'background:rgba(255,255,255,0.06);border:1px solid var(--sep);color:var(--t1);font-size:13px;font-weight:600;padding:0 12px;border-radius:var(--radius-sm);min-height:44px;cursor:pointer;'
  }, ['lbs']);
  unitToggle.addEventListener('click', function() {
    setUnit = setUnit === 'lbs' ? 'kg' : 'lbs';
    unitToggle.textContent = setUnit;
    pesoInput.placeholder = 'Peso (' + setUnit + ')';
  });
  var repsInput = createElement('input', { class: 'gym-input-small', type: 'number', placeholder: 'Reps', step: '1' });
  var confirmBtn = createElement('button', { class: 'gym-confirm-set-btn' }, ['+ Set']);
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
  addSetRow.appendChild(pesoInput);
  addSetRow.appendChild(unitToggle);
  addSetRow.appendChild(repsInput);
  addSetRow.appendChild(confirmBtn);
  card.appendChild(addSetRow);

  return card;
}

function gymBuildSetRow(sesion, ej, set, setNum, listEl) {
  var row = createElement('div', { class: 'gym-set-row' });
  var status = set.status || GYM_STATUS.DONE;

  var label = createElement('div', {
    style: 'font-size:14px;color:var(--t2);font-weight:500;min-width:54px;'
  }, ['Set #' + setNum]);

  var pesoStr = isFinite(Number(set.peso)) ? gymFormatWeight(set.peso) : '—';
  var repsStr = isFinite(Number(set.reps)) ? set.reps : '—';
  var vals = createElement('div', {
    style: 'flex:1;font-size:15px;color:var(--t1);font-weight:500;'
  }, [pesoStr + ' × ' + repsStr + ' reps']);

  // Status toggle: Pending → Done → Skipped → Pending
  var chip = gymStatusChip(status);
  chip.style.cursor = 'pointer';
  chip.addEventListener('click', function() {
    var next = status === GYM_STATUS.PENDING ? GYM_STATUS.DONE :
               status === GYM_STATUS.DONE ? GYM_STATUS.SKIPPED :
               GYM_STATUS.PENDING;
    set.status = next;
    dbPut('sets', set).then(function() { gymRefreshSessionExercises(sesion, listEl); });
  });

  var del = createElement('button', { class: 'gym-set-delete', title: 'Eliminar set' }, ['×']);
  del.addEventListener('click', function() {
    dbDelete('sets', set.id).then(function() { gymRefreshSessionExercises(sesion, listEl); });
  });

  row.appendChild(label);
  row.appendChild(vals);
  row.appendChild(chip);
  row.appendChild(del);
  return row;
}

function gymGetLastSetForEjercicio(ejercicio_id, excludeSesionId) {
  return dbGetAll('sets').then(function(sets) {
    var candidates = sets.filter(function(s) {
      return s.ejercicio_id === ejercicio_id && s.sesion_id !== excludeSesionId;
    });
    if (candidates.length === 0) return null;
    // Get the most recent by sesion (sesion_id mayor ≈ más reciente si autoIncrement)
    candidates.sort(function(a, b) { return b.sesion_id - a.sesion_id || b.id - a.id; });
    return candidates[0];
  });
}

function gymStartRestTimer() {
  var bar = document.getElementById('gym-rest-bar');
  if (!bar) return;
  if (_gymRestTimerId) clearInterval(_gymRestTimerId);
  _gymRestRemaining = _gymRestSeconds;
  bar.innerHTML = '';
  bar.style.display = 'flex';

  var label = createElement('div', {
    style: 'font-size:13px;color:var(--t2);font-weight:600;'
  }, ['Descanso']);
  var countdown = createElement('div', {
    style: 'font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums;',
    id: 'gym-rest-count'
  }, [_gymRestRemaining + 's']);
  var skipBtn = createElement('button', {
    style: 'background:none;border:none;color:var(--t2);font-size:13px;font-weight:600;cursor:pointer;padding:4px 8px;'
  }, ['Saltar']);
  skipBtn.addEventListener('click', gymStopRestTimer);

  bar.appendChild(label);
  bar.appendChild(countdown);
  bar.appendChild(skipBtn);

  _gymRestTimerId = setInterval(function() {
    _gymRestRemaining -= 1;
    var c = document.getElementById('gym-rest-count');
    if (!c) { gymStopRestTimer(); return; }
    c.textContent = _gymRestRemaining + 's';
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
  if (bar) bar.style.display = 'none';
}

// ─── Modal: Agregar ejercicio a la sesión ──────────────────────────────────────
function gymShowAddExerciseModal(sesion, listEl) {
  var modal = createElement('div', { class: 'gym-modal' });
  modal.appendChild(createElement('div', { class: 'gym-modal-title' }, ['Agregar ejercicio']));

  var search = createElement('input', {
    class: 'gym-search-input',
    type: 'text',
    placeholder: 'Buscar o crear ejercicio…'
  });
  modal.appendChild(search);

  var suggestions = createElement('div', { class: 'gym-suggestions' });
  modal.appendChild(suggestions);

  var newBtn = createElement('button', { class: 'gym-btn-secondary' }, ['+ Crear ejercicio nuevo']);
  newBtn.addEventListener('click', function() {
    overlay.remove();
    gymShowNewExerciseModal(function(newEj) {
      gymAttachExerciseToSession(sesion, newEj, listEl);
    }, sesion.routine_type);
  });
  modal.appendChild(newBtn);

  var cancelBtn = createElement('button', { class: 'gym-btn-secondary' }, ['Cancelar']);
  cancelBtn.addEventListener('click', function() { overlay.remove(); });
  modal.appendChild(cancelBtn);

  dbGetAll('ejercicios').then(function(all) {
    var render = function(term) {
      suggestions.innerHTML = '';
      var t = (term || '').trim();
      if (!t) {
        suggestions.appendChild(createElement('div', {
          style: 'padding:14px 12px;color:var(--t3);font-size:13px;text-align:center;'
        }, ['Escribe para buscar ejercicios.']));
        return;
      }
      var filtered = all.filter(function(e) {
        return e.nombre.toLowerCase().indexOf(t.toLowerCase()) >= 0;
      }).sort(function(a, b) { return a.nombre.localeCompare(b.nombre); }).slice(0, 8);
      if (filtered.length === 0) {
        suggestions.appendChild(createElement('div', {
          style: 'padding:12px;color:var(--t3);font-size:13px;text-align:center;'
        }, ['Sin coincidencias. Usa "Crear ejercicio nuevo".']));
        return;
      }
      filtered.forEach(function(e) {
        var muscles = gymParseMuscleArr(e.musculo_primario).join(' · ');
        var item = createElement('div', { class: 'gym-suggestion-item' }, [
          createElement('div', { style: 'font-weight:500;color:var(--t1);' }, [e.nombre]),
          createElement('div', { style: 'font-size:12px;color:var(--t3);margin-top:2px;' }, [(e.tipo || '—') + ' · ' + (muscles || 'sin músculo')])
        ]);
        item.addEventListener('click', function() {
          overlay.remove();
          gymAttachExerciseToSession(sesion, e, listEl);
        });
        suggestions.appendChild(item);
      });
    };
    render('');
    search.addEventListener('input', function() { render(search.value); });
  });

  var overlay = createElement('div', { class: 'gym-modal-overlay' }, [modal]);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function gymAttachExerciseToSession(sesion, ej, listEl) {
  // Auto-tag: el ejercicio queda asociado al routine_type de la sesión actual.
  // (Si ya tenía otro tipo, se sobreescribe — última rutina en que se usó manda.)
  var routine = sesion.routine_type;
  var tagPromise = (routine && ej.tipo !== routine)
    ? (function() { ej.tipo = routine; return dbPut('ejercicios', ej); })()
    : Promise.resolve();

  tagPromise.then(function() {
    var placeholder = {
      sesion_id: sesion.id,
      ejercicio_id: ej.id,
      peso: 0,
      reps: 0,
      orden: 1,
      status: GYM_STATUS.PENDING
    };
    return dbPut('sets', placeholder);
  }).then(function() {
    gymRefreshSessionExercises(sesion, listEl);
  });
}

// ─── Modal: Nuevo ejercicio ────────────────────────────────────────────────────
function gymShowNewExerciseModal(onCreated, defaultRoutine) {
  var modal = createElement('div', { class: 'gym-modal' });
  modal.appendChild(createElement('div', { class: 'gym-modal-title' }, ['Nuevo ejercicio']));

  var nameInput = createElement('input', {
    class: 'gym-search-input',
    type: 'text',
    placeholder: 'Nombre del ejercicio'
  });
  modal.appendChild(nameInput);

  modal.appendChild(createElement('div', {
    style: 'font-size:13px;color:var(--t3);margin:4px 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;'
  }, ['RUTINA (opcional)']));

  var typeInput = createElement('input', {
    class: 'gym-search-input',
    type: 'text',
    placeholder: 'Ej. Upper, Push, Leg Day…',
    autocomplete: 'off'
  });
  if (defaultRoutine) typeInput.value = defaultRoutine;
  modal.appendChild(typeInput);

  // Autocomplete de rutinas existentes
  var typeSugg = createElement('div', { class: 'gym-suggestions', style: 'max-height:120px;overflow-y:auto;' });
  modal.appendChild(typeSugg);
  Promise.all([dbGetAll('sesiones'), dbGetAll('ejercicios')]).then(function(r) {
    var nameSet = {};
    r[0].forEach(function(s) { if (s.routine_type) nameSet[s.routine_type] = true; });
    r[1].forEach(function(e) { if (e.tipo) nameSet[e.tipo] = true; });
    var allNames = Object.keys(nameSet).sort();
    var renderTypes = function(term) {
      typeSugg.innerHTML = '';
      var t = (term || '').trim().toLowerCase();
      var filtered = allNames.filter(function(n) { return !t || n.toLowerCase().indexOf(t) >= 0; });
      filtered.slice(0, 5).forEach(function(n) {
        var item = createElement('div', { class: 'gym-suggestion-item' }, [n]);
        item.addEventListener('click', function() { typeInput.value = n; typeSugg.innerHTML = ''; });
        typeSugg.appendChild(item);
      });
    };
    renderTypes(typeInput.value);
    typeInput.addEventListener('input', function() { renderTypes(typeInput.value); });
  });

  modal.appendChild(createElement('div', {
    style: 'font-size:13px;color:var(--t3);margin:12px 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;'
  }, ['MÚSCULO PRIMARIO']));

  var selectedMuscles = {};
  var muscleGrid = createElement('div', { class: 'gym-muscle-grid' });
  GYM_MUSCLE_GROUPS.forEach(function(m) {
    var btn = createElement('button', { class: 'gym-muscle-btn' }, [m]);
    btn.addEventListener('click', function() {
      if (selectedMuscles[m]) { delete selectedMuscles[m]; btn.classList.remove('selected'); }
      else { selectedMuscles[m] = true; btn.classList.add('selected'); }
    });
    muscleGrid.appendChild(btn);
  });
  modal.appendChild(muscleGrid);

  var createBtn = createElement('button', { class: 'gym-btn-primary' }, ['Crear']);
  createBtn.addEventListener('click', function() {
    var nombre = nameInput.value.trim();
    if (!nombre) { showToast('Nombre requerido'); return; }
    var muscles = Object.keys(selectedMuscles);
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
    }).catch(function(err) {
      showToast('Error: nombre duplicado');
    });
  });
  modal.appendChild(createBtn);

  var cancelBtn = createElement('button', { class: 'gym-btn-secondary' }, ['Cancelar']);
  cancelBtn.addEventListener('click', function() { overlay.remove(); });
  modal.appendChild(cancelBtn);

  var overlay = createElement('div', { class: 'gym-modal-overlay' }, [modal]);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  setTimeout(function() { nameInput.focus(); }, 50);
}

// ─── Finalizar sesión ──────────────────────────────────────────────────────────
function gymConfirmFinalize(sesion, panel) {
  gymConfirmAction('¿Finalizar sesión?', function() {
    var now = Date.now();
    sesion.finalizada = true;
    sesion.duracion_ms = now - (sesion.timestamp_inicio || now);
    // Limpiar sets pendientes con 0/0 (placeholders no usados)
    dbGetAll('sets').then(function(all) {
      var placeholders = all.filter(function(s) {
        return s.sesion_id === sesion.id && s.peso === 0 && s.reps === 0 && s.status === GYM_STATUS.PENDING;
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
}

function gymConfirmAction(msg, onConfirm) {
  var modal = createElement('div', { class: 'gym-modal' });
  modal.appendChild(createElement('div', { class: 'gym-modal-title' }, ['Confirmar']));
  modal.appendChild(createElement('div', {
    style: 'color:var(--t2);font-size:14px;margin-bottom:16px;line-height:1.5;'
  }, [msg]));
  var ok = createElement('button', { class: 'gym-btn-danger' }, ['Sí, continuar']);
  var cancel = createElement('button', { class: 'gym-btn-secondary' }, ['Cancelar']);
  ok.addEventListener('click', function() { overlay.remove(); onConfirm(); });
  cancel.addEventListener('click', function() { overlay.remove(); });
  modal.appendChild(ok);
  modal.appendChild(cancel);
  var overlay = createElement('div', { class: 'gym-modal-overlay' }, [modal]);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — EJERCICIOS (Exercise Library)
// ══════════════════════════════════════════════════════════════════════════════
var _gymLibFilter = { type: null, search: '' };

function gymRenderEjercicios(panel) {
  panel.innerHTML = '';

  var wrap = createElement('div', { style: 'padding: 12px 0 80px;' });

  // Buscador
  var searchWrap = createElement('div', { style: 'padding: 0 20px 10px;' });
  var search = createElement('input', {
    class: 'gym-search-input',
    type: 'text',
    placeholder: 'Buscar ejercicio…'
  });
  search.value = _gymLibFilter.search || '';
  searchWrap.appendChild(search);
  wrap.appendChild(searchWrap);

  // Filter pills por rutina (dinámicas, descubiertas de los ejercicios + sesiones)
  var pills = createElement('div', { class: 'gym-filter-pills' });
  var makePill = function(label, value) {
    var active = _gymLibFilter.type === value;
    var p = createElement('button', { class: 'gym-filter-pill' + (active ? ' active' : '') }, [label]);
    p.addEventListener('click', function() {
      _gymLibFilter.type = _gymLibFilter.type === value ? null : value;
      gymRenderEjercicios(panel);
    });
    return p;
  };
  pills.appendChild(makePill('Todos', null));
  wrap.appendChild(pills);
  Promise.all([dbGetAll('ejercicios'), dbGetAll('sesiones')]).then(function(r) {
    var nameSet = {};
    r[0].forEach(function(e) { if (e.tipo) nameSet[e.tipo] = true; });
    r[1].forEach(function(s) { if (s.routine_type) nameSet[s.routine_type] = true; });
    Object.keys(nameSet).sort().forEach(function(t) { pills.appendChild(makePill(t, t)); });
  });

  // Lista agrupada
  var listWrap = createElement('div', { class: 'gym-dir-list', id: 'gym-dir-list' });
  wrap.appendChild(listWrap);

  // CTA añadir
  var addWrap = createElement('div', { style: 'padding: 20px;' });
  var addBtn = createElement('button', { class: 'gym-btn-primary' }, ['+ Crear ejercicio']);
  addBtn.addEventListener('click', function() {
    gymShowNewExerciseModal(function() { gymRenderEjercicios(panel); });
  });
  addWrap.appendChild(addBtn);
  wrap.appendChild(addWrap);

  panel.appendChild(wrap);

  search.addEventListener('input', function() {
    _gymLibFilter.search = search.value;
    gymRenderLibraryItems(listWrap, panel);
  });
  gymRenderLibraryItems(listWrap, panel);
}

function gymRenderLibraryItems(listEl, panel) {
  listEl.innerHTML = '';
  dbGetAll('ejercicios').then(function(all) {
    var term = (_gymLibFilter.search || '').toLowerCase();
    var filtered = all.filter(function(e) {
      if (_gymLibFilter.type && e.tipo !== _gymLibFilter.type) return false;
      if (term && e.nombre.toLowerCase().indexOf(term) < 0) return false;
      return true;
    });

    // Agrupar por rutina (free-text, descubierto de los datos)
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
    var hasAny = false;
    keys.forEach(function(k) {
      var items = (groups[k] || []).sort(function(a, b) { return a.nombre.localeCompare(b.nombre); });
      if (items.length === 0) return;
      hasAny = true;
      var header = createElement('div', { class: 'gym-pr-muscle-header' }, [k + '  ·  ' + items.length]);
      listEl.appendChild(header);

      items.forEach(function(e) {
        var muscles = gymParseMuscleArr(e.musculo_primario);
        var item = createElement('div', { class: 'gym-dir-item' }, [
          createElement('div', {}, [
            createElement('div', { class: 'gym-dir-item-name' }, [e.nombre]),
            createElement('div', { class: 'gym-dir-item-sub' }, [muscles.length > 0 ? muscles.join(' · ') : 'sin músculo'])
          ]),
          createElement('div', { style: 'color:var(--t3);font-size:18px;' }, ['›'])
        ]);
        item.addEventListener('click', function() { gymRenderEjercicioDetail(panel, e); });
        listEl.appendChild(item);
      });
    });

    if (!hasAny) {
      listEl.appendChild(createElement('div', {
        style: 'padding:40px 20px;text-align:center;color:var(--t3);font-size:14px;'
      }, ['Sin ejercicios. Crea el primero arriba.']));
    }
  });
}

function gymRenderEjercicioDetail(panel, ej) {
  panel.innerHTML = '';

  var header = createElement('div', { class: 'gym-dir-detail-header' });
  var back = createElement('button', { class: 'gym-dir-back-btn' }, ['‹ Ejercicios']);
  back.addEventListener('click', function() { gymRenderEjercicios(panel); });
  header.appendChild(back);

  header.appendChild(createElement('div', { class: 'gym-dir-detail-title' }, [ej.nombre]));
  var muscles = gymParseMuscleArr(ej.musculo_primario);
  header.appendChild(createElement('div', { class: 'gym-dir-detail-muscle' }, [(ej.tipo || 'Sin tipo') + ' · ' + (muscles.join(' · ') || 'sin músculo')]));
  panel.appendChild(header);

  // Historial: lista de sesiones en que aparece, de más reciente a más antiguo
  var histWrap = createElement('div', { style: 'padding: 8px 20px 80px;' });
  histWrap.appendChild(createElement('div', {
    style: 'font-size:13px;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;font-weight:600;'
  }, ['HISTORIAL']));

  Promise.all([dbGetAll('sets'), dbGetAll('sesiones')]).then(function(r) {
    var sets = r[0].filter(function(s) {
      return s.ejercicio_id === ej.id
        && s.status !== GYM_STATUS.PENDING
        && isFinite(Number(s.peso))
        && isFinite(Number(s.reps));
    });
    var sesiones = {};
    r[1].forEach(function(s) { sesiones[s.id] = s; });

    if (sets.length === 0) {
      histWrap.appendChild(createElement('div', {
        style: 'padding:20px;color:var(--t3);font-size:14px;'
      }, ['Sin registros aún para este ejercicio.']));
      panel.appendChild(histWrap);
      return;
    }

    // Agrupar sets por sesion
    var bySesion = {};
    sets.forEach(function(st) {
      if (!bySesion[st.sesion_id]) bySesion[st.sesion_id] = [];
      bySesion[st.sesion_id].push(st);
    });

    var rows = Object.keys(bySesion).map(function(sid) {
      var sesion = sesiones[sid];
      var arr = bySesion[sid];
      var fecha = sesion ? sesion.fecha : null;
      var ts = sesion ? (sesion.timestamp_inicio || new Date(sesion.fecha || 0).getTime()) : 0;
      // Best set: mayor peso × reps
      arr.sort(function(a, b) { return (b.peso * b.reps) - (a.peso * a.reps); });
      var best = arr[0];
      return { fecha: fecha, ts: ts, count: arr.length, best: best };
    }).sort(function(a, b) { return b.ts - a.ts; });

    rows.forEach(function(r) {
      var item = createElement('div', { class: 'gym-detail-table-row' }, [
        createElement('div', { style: 'flex:1;color:var(--t1);font-size:15px;font-weight:500;' }, [gymFormatDateShort(r.fecha)]),
        createElement('div', { style: 'color:var(--t2);font-size:14px;' }, [r.count + '×' + r.best.reps + ' a ' + gymFormatWeight(r.best.peso)])
      ]);
      histWrap.appendChild(item);
    });
    panel.appendChild(histWrap);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — PROGRESIÓN (Completed Workouts + PR + chart)
// ══════════════════════════════════════════════════════════════════════════════
function gymRenderProgresion(panel) {
  panel.innerHTML = '';

  var wrap = createElement('div', { style: 'padding: 12px 0 20px;' });

  // Sección: Selector de ejercicio
  wrap.appendChild(createElement('div', {
    style: 'font-size:13px;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px;padding:0 20px 8px;font-weight:600;'
  }, ['PROGRESIÓN POR EJERCICIO']));

  var selectorWrap = createElement('div', { style: 'padding: 0 20px 14px;' });
  var select = createElement('select', {
    class: 'gym-search-input',
    style: 'appearance:none;background:var(--bg2);color:var(--t1);padding:12px 14px;border-radius:var(--radius-sm);border:1px solid var(--sep);width:100%;font-size:15px;'
  });
  selectorWrap.appendChild(select);
  wrap.appendChild(selectorWrap);

  var detailWrap = createElement('div', { id: 'gym-prog-detail' });
  wrap.appendChild(detailWrap);

  // Sección: Completed Workouts
  wrap.appendChild(createElement('div', {
    style: 'font-size:13px;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px;padding:20px 20px 8px;font-weight:600;'
  }, ['SESIONES COMPLETADAS']));

  var completedWrap = createElement('div', { style: 'padding: 0 20px;' });
  wrap.appendChild(completedWrap);

  // Sección: Export / Import
  var eiSep = createElement('div', {
    style: 'height:1px;background:var(--sep);margin:28px 20px 20px;'
  });
  wrap.appendChild(eiSep);

  var eiWrap = createElement('div', { style: 'padding:0 20px 80px;display:flex;flex-direction:column;gap:12px;' });
  var exportBtn = createElement('button', { class: 'gym-btn-secondary' }, ['📤 Exportar datos']);
  exportBtn.addEventListener('click', function() { gymExportData(); });
  var importBtn = createElement('button', { class: 'gym-btn-secondary' }, ['📥 Importar datos']);
  importBtn.addEventListener('click', function() { gymImportData(panel); });
  eiWrap.appendChild(exportBtn);
  eiWrap.appendChild(importBtn);
  wrap.appendChild(eiWrap);

  panel.appendChild(wrap);

  // Populate
  dbGetAll('ejercicios').then(function(all) {
    var sorted = all.sort(function(a, b) { return a.nombre.localeCompare(b.nombre); });
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '— Selecciona ejercicio —';
    select.appendChild(placeholder);
    sorted.forEach(function(e) {
      var opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = e.nombre;
      select.appendChild(opt);
    });
    select.addEventListener('change', function() {
      var id = parseInt(select.value, 10);
      if (!id) { detailWrap.innerHTML = ''; return; }
      var ej = sorted.find(function(e) { return e.id === id; });
      gymRenderProgresionDetail(detailWrap, ej);
    });
  });

  gymRenderCompletedWorkouts(completedWrap);
}

function gymRenderProgresionDetail(container, ej) {
  container.innerHTML = '';
  Promise.all([dbGetAll('sets'), dbGetAll('sesiones')]).then(function(r) {
    var sets = r[0].filter(function(s) {
      return s.ejercicio_id === ej.id
        && s.status !== GYM_STATUS.PENDING
        && isFinite(Number(s.peso))
        && isFinite(Number(s.reps));
    });
    var sesiones = {};
    r[1].forEach(function(s) { sesiones[s.id] = s; });

    if (sets.length === 0) {
      container.appendChild(createElement('div', {
        style: 'padding:20px;color:var(--t3);font-size:14px;text-align:center;'
      }, ['Sin datos aún.']));
      return;
    }

    // PR
    var pr = sets.reduce(function(max, s) { return Number(s.peso) > Number(max.peso) ? s : max; }, sets[0]);

    // Agrupar por sesion
    var bySesion = {};
    sets.forEach(function(st) {
      if (!bySesion[st.sesion_id]) bySesion[st.sesion_id] = [];
      bySesion[st.sesion_id].push(st);
    });

    var rows = Object.keys(bySesion).map(function(sid) {
      var arr = bySesion[sid];
      var sesion = sesiones[sid];
      var ts = sesion ? (sesion.timestamp_inicio || new Date(sesion.fecha || 0).getTime()) : 0;
      arr.sort(function(a, b) { return (b.peso * b.reps) - (a.peso * a.reps); });
      var best = arr[0];
      var volumen = arr.reduce(function(sum, s) { return sum + (s.peso * s.reps); }, 0);
      return { fecha: sesion ? sesion.fecha : null, ts: ts, best: best, volumen: volumen };
    }).sort(function(a, b) { return a.ts - b.ts; });

    // PR card
    var prCard = createElement('div', { class: 'gym-pr-card', style: 'margin: 0 20px 12px;' }, [
      createElement('div', {}, [
        createElement('div', { class: 'gym-pr-name' }, ['Personal Record']),
        createElement('div', { class: 'gym-pr-sub' }, [pr.reps + ' reps'])
      ]),
      createElement('div', { class: 'gym-pr-value' }, [gymFormatWeight(pr.peso)])
    ]);
    container.appendChild(prCard);

    // Mini chart (bars)
    var maxPeso = Math.max.apply(null, rows.map(function(r) { return Number(r.best.peso) || 0; })) || 1;
    var chartWrap = createElement('div', {
      style: 'margin:6px 20px 12px;padding:14px;background:var(--bg-card);border-radius:var(--radius-md);'
    });
    chartWrap.appendChild(createElement('div', {
      style: 'font-size:12px;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;font-weight:600;'
    }, ['PESO MÁX · POR SESIÓN']));
    var chart = createElement('div', {
      style: 'display:flex;align-items:flex-end;gap:6px;height:90px;'
    });
    rows.slice(-12).forEach(function(r) {
      var p = Number(r.best.peso) || 0;
      var h = Math.max(6, Math.round((p / maxPeso) * 100));
      var bar = createElement('div', {
        style: 'flex:1;background:var(--accent);border-radius:4px 4px 2px 2px;opacity:0.85;height:' + h + '%;min-height:6px;',
        title: gymFormatDateShort(r.fecha) + ': ' + gymFormatWeight(p)
      });
      chart.appendChild(bar);
    });
    chartWrap.appendChild(chart);
    container.appendChild(chartWrap);

    // Tabla
    var tableWrap = createElement('div', { style: 'margin: 6px 20px 0;background:var(--bg-card);border-radius:var(--radius-md);overflow:hidden;' });
    var tableHeader = createElement('div', { class: 'gym-detail-table-header' }, [
      createElement('div', { style: 'flex:1;' }, ['Fecha']),
      createElement('div', { style: 'flex:1;' }, ['Mejor set']),
      createElement('div', { style: 'flex:1;text-align:right;' }, ['Volumen'])
    ]);
    tableWrap.appendChild(tableHeader);

    rows.slice().reverse().forEach(function(r) {
      var row = createElement('div', { class: 'gym-detail-table-row' }, [
        createElement('div', { style: 'flex:1;color:var(--t1);font-size:14px;' }, [gymFormatDateShort(r.fecha)]),
        createElement('div', { style: 'flex:1;color:var(--t2);font-size:14px;' }, [gymFormatWeight(r.best.peso) + ' × ' + r.best.reps]),
        createElement('div', { style: 'flex:1;color:var(--t2);font-size:14px;text-align:right;' }, [gymFormatWeight(r.volumen)])
      ]);
      tableWrap.appendChild(row);
    });
    container.appendChild(tableWrap);
  });
}

function gymRenderCompletedWorkouts(container) {
  container.innerHTML = '';
  Promise.all([dbGetAll('sesiones'), dbGetAll('sets')]).then(function(r) {
    var sesiones = r[0].filter(function(s) { return s.finalizada === true; })
      .sort(function(a, b) {
        return (b.timestamp_inicio || new Date(b.fecha || 0).getTime()) -
               (a.timestamp_inicio || new Date(a.fecha || 0).getTime());
      });
    var sets = r[1];

    if (sesiones.length === 0) {
      container.appendChild(createElement('div', {
        style: 'padding:20px;color:var(--t3);font-size:14px;text-align:center;'
      }, ['Sin sesiones completadas.']));
      return;
    }

    sesiones.forEach(function(s) {
      var sessionSets = sets.filter(function(st) { return st.sesion_id === s.id && st.status !== GYM_STATUS.PENDING; });
      var doneCount = sessionSets.filter(function(st) { return st.status !== GYM_STATUS.SKIPPED; }).length;
      var card = createElement('div', {
        style: 'background:var(--bg-card);border-radius:var(--radius-md);padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:10px;'
      });
      var left = createElement('div', { style: 'flex:1;min-width:0;' }, [
        createElement('div', { style: 'font-weight:600;font-size:15px;color:var(--t1);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' }, [s.nombre || 'Workout']),
        createElement('div', { style: 'font-size:13px;color:var(--t2);' }, [gymFormatDateShort(s.fecha) + ' · ' + doneCount + (doneCount === 1 ? ' set' : ' sets') + (s.duracion_ms ? ' · ' + gymFormatDuration(s.duracion_ms) : '')])
      ]);
      var right = gymStatusChip(GYM_STATUS.DONE);
      card.appendChild(left);
      card.appendChild(right);
      container.appendChild(card);
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT / IMPORT (preservado del módulo anterior)
// ══════════════════════════════════════════════════════════════════════════════
function gymExportData() {
  Promise.all([
    dbGetAll('sesiones'),
    dbGetAll('ejercicios'),
    dbGetAll('sets')
  ]).then(function(results) {
    var payload = {
      version:    2,
      exportDate: new Date().toISOString(),
      sesiones:   results[0],
      ejercicios: results[1],
      sets:       results[2]
    };
    var json  = JSON.stringify(payload, null, 2);
    var blob  = new Blob([json], { type: 'application/json' });
    var url   = URL.createObjectURL(blob);
    var today = new Date().toISOString().slice(0, 10);
    var a     = document.createElement('a');
    a.href     = url;
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
  fileInput.type   = 'file';
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
      try { data = JSON.parse(e.target.result); } catch(err) {
        showToast('Archivo no válido');
        return;
      }

      if (!data || data.version == null ||
          !Array.isArray(data.sesiones) ||
          !Array.isArray(data.ejercicios) ||
          !Array.isArray(data.sets)) {
        showToast('Archivo no válido');
        return;
      }

      var nSes = data.sesiones.length;
      var nEj  = data.ejercicios.length;
      var nSet = data.sets.length;

      var modal   = createElement('div', { class: 'gym-modal' });
      modal.appendChild(createElement('div', { class: 'gym-modal-title' }, ['Importar backup']));
      modal.appendChild(createElement('div', {
        style: 'color:var(--t2);font-size:14px;margin-bottom:16px;line-height:1.5;'
      }, [
        'El backup contiene ' + nSes + ' sesiones, ' + nEj + ' ejercicios y ' + nSet + ' sets. ' +
        '¿Importar? Esto fusionará los datos con los existentes. ' +
        'Los registros duplicados (mismo ID) se sobrescriben.'
      ]));

      var confirmBtn = createElement('button', { class: 'gym-btn-primary' }, ['Importar']);
      var cancelBtn  = createElement('button', { class: 'gym-btn-secondary' }, ['Cancelar']);

      confirmBtn.addEventListener('click', function() {
        overlay.remove();
        openDB().then(function(db) {
          var tx = db.transaction(['sesiones', 'ejercicios', 'sets'], 'readwrite');
          var sStore   = tx.objectStore('sesiones');
          var eStore   = tx.objectStore('ejercicios');
          var setStore = tx.objectStore('sets');

          data.sesiones.forEach(function(r)   { sStore.put(r); });
          data.ejercicios.forEach(function(r) { eStore.put(r); });
          data.sets.forEach(function(r)       { setStore.put(r); });

          tx.oncomplete = function() {
            showToast(nSes + ' sesiones, ' + nEj + ' ejercicios, ' + nSet + ' sets importados.');
            gymRenderProgresion(panel);
          };
          tx.onerror = function() { showToast('Error al importar'); };
        });
      });

      cancelBtn.addEventListener('click', function() { overlay.remove(); });
      modal.appendChild(confirmBtn);
      modal.appendChild(cancelBtn);
      var overlay = createElement('div', { class: 'gym-modal-overlay' }, [modal]);
      overlay.addEventListener('click', function(ev) { if (ev.target === overlay) overlay.remove(); });
      document.body.appendChild(overlay);
    };
    reader.readAsText(file);
  });

  fileInput.click();
}
