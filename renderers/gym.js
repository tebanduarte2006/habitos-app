// renderers/gym.js — Módulo Gym (autónomo, IndexedDB)

// ─── Estado del módulo ─────────────────────────────────────────────────────────
var _gymSession          = null;   // objeto sesión activa
var _gymSessionExercises = [];     // [{ ejercicio: {...}, sets: [...] }]
var _gymTimerInterval    = null;   // setInterval del cronómetro
var _gymPanel            = null;   // panel raíz del tab "Iniciar Rutina"
var _gymSessionCheckDone = false;  // flag: evita re-disparar modal al cambiar tabs

// ─── Punto de entrada ──────────────────────────────────────────────────────────
function renderGymModule(container) {
  // Resetear estado al entrar al módulo desde fuera
  _gymSessionCheckDone = false;
  _gymSession          = null;
  _gymSessionExercises = [];
  if (_gymTimerInterval) { clearInterval(_gymTimerInterval); _gymTimerInterval = null; }

  var tabBar     = createElement('div', { class: 'main-tabs' });
  var tabContent = createElement('div', {});
  container.appendChild(tabBar);
  container.appendChild(tabContent);

  var tabs = [
    { id: 'iniciar',    label: '▶ Iniciar Rutina' },
    { id: 'progresion', label: '📈 Progresión' }
  ];

  var panels = {};

  tabs.forEach(function(tab, i) {
    var isFirst = i === 0;
    var btn = createElement('button', {
      class: 'main-tab' + (isFirst ? ' active' : ''),
      id: 'gym-tab-btn-' + tab.id
    }, [tab.label]);

    btn.addEventListener('click', function() {
      if (tab.id !== 'iniciar' && _gymTimerInterval) {
        clearInterval(_gymTimerInterval);
        _gymTimerInterval = null;
      }
      tabs.forEach(function(t) {
        var b = document.getElementById('gym-tab-btn-' + t.id);
        var p = panels[t.id];
        if (b) b.classList.toggle('active', t.id === tab.id);
        if (p) p.classList.toggle('active', t.id === tab.id);
      });
      if (tab.id === 'iniciar')    renderIniciarTab(panels['iniciar']);
      if (tab.id === 'progresion') renderProgresionTab(panels['progresion']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    tabBar.appendChild(btn);

    var panel = createElement('div', {
      class: 'tab-panel' + (isFirst ? ' active' : ''),
      id: 'gym-panel-' + tab.id
    });
    panels[tab.id] = panel;
    tabContent.appendChild(panel);
  });

  _gymPanel = panels['iniciar'];
  renderIniciarTab(panels['iniciar']);
}

// ─── Tab: Iniciar Rutina ───────────────────────────────────────────────────────
function renderIniciarTab(panel) {
  panel.innerHTML = '';
  if (_gymTimerInterval) { clearInterval(_gymTimerInterval); _gymTimerInterval = null; }

  // Si hay sesión activa en memoria, reanudar directamente sin tocar la BD
  if (_gymSession) {
    showActiveSession(panel, _gymSession);
    return;
  }

  // Verificar sesión sin finalizar solo una vez por visita al módulo
  if (_gymSessionCheckDone) {
    showStartScreen(panel);
    return;
  }
  _gymSessionCheckDone = true;

  dbGetAll('sesiones').then(function(sesiones) {
    var activa = null;
    for (var i = 0; i < sesiones.length; i++) {
      if (!sesiones[i].finalizada) { activa = sesiones[i]; break; }
    }
    if (activa) {
      showStartScreen(panel);          // fondo detrás del modal
      showModalSesionActiva(activa, panel);
    } else {
      showStartScreen(panel);
    }
  });
}

// ─── Modal: sesión sin terminar ────────────────────────────────────────────────
function showModalSesionActiva(sesion, panel) {
  var overlay = createElement('div', { class: 'gym-modal-overlay' });
  var modal   = createElement('div', { class: 'gym-modal' });

  modal.appendChild(createElement('div', { class: 'gym-modal-title' }, ['Sesión sin terminar']));
  modal.appendChild(createElement('div', { style: 'color:var(--t2);font-size:15px;margin-bottom:4px;' }, ['"' + sesion.nombre + '"']));

  // ── Opción 0: Reanudar rutina ──
  var resumeBtn = createElement('button', { class: 'gym-btn-primary' }, ['Reanudar rutina']);
  resumeBtn.addEventListener('click', function() {
    overlay.remove();
    Promise.all([dbGetAll('sets'), dbGetAll('ejercicios')]).then(function(results) {
      var allSets = results[0];
      var allEjs  = results[1];
      var ejMap = {};
      allEjs.forEach(function(e) { ejMap[e.id] = e; });
      var sesionSets = allSets.filter(function(s) { return s.sesion_id === sesion.id; });
      var grouped = {};
      var ejOrder = [];
      sesionSets.forEach(function(s) {
        if (!grouped[s.ejercicio_id]) { grouped[s.ejercicio_id] = []; ejOrder.push(s.ejercicio_id); }
        grouped[s.ejercicio_id].push(s);
      });
      var seen = {};
      var ejIds = [];
      ejOrder.forEach(function(id) { if (!seen[id]) { seen[id] = true; ejIds.push(id); } });
      _gymSession = sesion;
      _gymSessionExercises = ejIds.map(function(ejId) {
        var sets = grouped[ejId].slice();
        sets.sort(function(a, b) { return (a.orden || 0) - (b.orden || 0); });
        return { ejercicio: ejMap[parseInt(ejId, 10)] || { id: parseInt(ejId, 10), nombre: 'Ejercicio' }, sets: sets };
      });
      showActiveSession(panel, sesion);
    });
  });
  modal.appendChild(resumeBtn);

  // ── Opción 1: ¿A qué hora terminaste? ──
  modal.appendChild(createElement('div', { style: 'color:var(--t3);font-size:13px;margin-top:8px;' }, ['¿A qué hora terminaste?']));

  var now = new Date();
  var timeInput = createElement('input', {
    type: 'time',
    class: 'gym-session-name-input'
  });
  timeInput.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  modal.appendChild(timeInput);

  var saveTimeBtn = createElement('button', { class: 'gym-btn-primary' }, ['Guardar']);
  saveTimeBtn.addEventListener('click', function() {
    var parts = timeInput.value.split(':');
    if (!parts || parts.length < 2) { showToast('Ingresa una hora válida'); return; }
    var endTime = new Date();
    endTime.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
    var duracion = endTime.getTime() - sesion.timestamp_inicio;
    if (duracion < 0) duracion = Date.now() - sesion.timestamp_inicio;
    sesion.finalizada  = true;
    sesion.duracion_ms = duracion;
    dbPut('sesiones', sesion).then(function() {
      overlay.remove();
      showStartScreen(panel);
      showToast('Sesión guardada');
    });
  });
  modal.appendChild(saveTimeBtn);

  // ── Opción 2: Guardar tal como está ──
  var saveNowBtn = createElement('button', { class: 'gym-btn-secondary' }, ['Guardar tal como está']);
  saveNowBtn.addEventListener('click', function() {
    sesion.finalizada  = true;
    sesion.duracion_ms = Date.now() - sesion.timestamp_inicio;
    dbPut('sesiones', sesion).then(function() {
      overlay.remove();
      showStartScreen(panel);
      showToast('Sesión guardada');
    });
  });
  modal.appendChild(saveNowBtn);

  // ── Opción 3: Eliminar sesión ──
  var deleteBtn = createElement('button', { class: 'gym-btn-danger' }, ['Eliminar sesión']);
  deleteBtn.addEventListener('click', function() {
    dbGetAll('sets').then(function(allSets) {
      var promises = [];
      for (var i = 0; i < allSets.length; i++) {
        if (allSets[i].sesion_id === sesion.id) {
          promises.push(dbDelete('sets', allSets[i].id));
        }
      }
      promises.push(dbDelete('sesiones', sesion.id));
      return Promise.all(promises);
    }).then(function() {
      overlay.remove();
      showStartScreen(panel);
      showToast('Sesión eliminada');
    });
  });
  modal.appendChild(deleteBtn);

  overlay.appendChild(modal);
  panel.appendChild(overlay);
}

// ─── Pantalla: inicio de sesión nueva ─────────────────────────────────────────
function showStartScreen(panel) {
  panel.innerHTML = '';
  _gymSession          = null;
  _gymSessionExercises = [];
  if (_gymTimerInterval) { clearInterval(_gymTimerInterval); _gymTimerInterval = null; }

  var screen = createElement('div', { class: 'gym-start-screen' });

  var nameInput = createElement('input', {
    type: 'text',
    class: 'gym-session-name-input',
    placeholder: 'Push, Legs, Upper...'
  });

  var startBtn = createElement('button', { class: 'gym-btn-primary' }, ['Iniciar Rutina']);
  startBtn.addEventListener('click', function() {
    var nombre = nameInput.value.trim();
    if (!nombre) { showToast('Ingresa un nombre para la sesión'); return; }

    var sesionData = {
      nombre:           nombre,
      fecha:            new Date().toISOString(),
      timestamp_inicio: Date.now(),
      duracion_ms:      0,
      nota:             '',
      finalizada:       false
    };

    dbPut('sesiones', sesionData).then(function(id) {
      sesionData.id    = id;
      _gymSession      = sesionData;
      _gymSessionExercises = [];
      showActiveSession(panel, sesionData);
    });
  });

  screen.appendChild(nameInput);
  screen.appendChild(startBtn);
  panel.appendChild(screen);

  // ── Última sesión ──
  var lastSection = createElement('div', { style: 'padding: 0 20px 80px;' });
  lastSection.appendChild(createElement('div', { class: 'title-section', style: 'padding: 24px 0 10px;' }, ['Última sesión']));
  panel.appendChild(lastSection);

  Promise.all([dbGetAll('sesiones'), dbGetAll('sets')]).then(function(results) {
    var sesiones = results[0];
    var allSets  = results[1];

    var finalizadas = sesiones.filter(function(s) { return s.finalizada; });
    finalizadas.sort(function(a, b) { return b.timestamp_inicio - a.timestamp_inicio; });
    var ultima = finalizadas[0];

    if (!ultima) {
      lastSection.appendChild(createElement('p', { style: 'font-size:14px;color:var(--text-tertiary);text-align:center;padding-top:32px;font-family:-apple-system,sans-serif;' }, ['Sin sesiones registradas aún']));
      return;
    }

    var durMs   = ultima.duracion_ms || 0;
    var durH    = Math.floor(durMs / 3600000);
    var durMin  = Math.floor((durMs % 3600000) / 60000);
    var durStr  = durH > 0 ? durH + 'h ' + durMin + 'min' : durMin + 'min';

    var fechaD  = new Date(ultima.fecha);
    var dias    = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var meses   = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var fechaStr = dias[fechaD.getDay()] + ' ' + fechaD.getDate() + ' ' + meses[fechaD.getMonth()];

    var setsDeUltima  = allSets.filter(function(s) { return s.sesion_id === ultima.id; });
    var ejerciciosIds = {};
    setsDeUltima.forEach(function(s) { ejerciciosIds[s.ejercicio_id] = true; });
    var numEjercicios = Object.keys(ejerciciosIds).length;

    var card = createElement('div', { class: 'content-card', style: 'padding:16px;' });
    card.appendChild(createElement('div', { style: 'font-size:15px;font-weight:700;color:var(--text-primary);font-family:-apple-system,sans-serif;margin-bottom:6px;' }, [ultima.nombre]));
    card.appendChild(createElement('div', { style: 'font-size:13px;color:var(--text-tertiary);font-family:-apple-system,sans-serif;margin-bottom:2px;' }, [fechaStr]));
    card.appendChild(createElement('div', { style: 'font-size:13px;color:var(--text-secondary);font-family:-apple-system,sans-serif;' }, [durStr + (numEjercicios > 0 ? ' · ' + numEjercicios + ' ejercicio' + (numEjercicios !== 1 ? 's' : '') : '')]));
    lastSection.appendChild(card);
  });
}

// ─── Pantalla: sesión activa ───────────────────────────────────────────────────
function showActiveSession(panel, sesion) {
  panel.innerHTML = '';
  if (_gymTimerInterval) { clearInterval(_gymTimerInterval); _gymTimerInterval = null; }

  // Header + cronómetro
  var timerEl = createElement('div', { class: 'gym-timer' }, ['00:00']);

  function updateTimer() {
    var elapsed = Math.floor((Date.now() - sesion.timestamp_inicio) / 1000);
    var mins    = Math.floor(elapsed / 60);
    var secs    = elapsed % 60;
    timerEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }
  updateTimer();
  _gymTimerInterval = setInterval(updateTimer, 1000);

  var header = createElement('div', { class: 'gym-active-header' }, [
    createElement('div', { class: 'gym-session-title' }, [sesion.nombre]),
    timerEl
  ]);
  panel.appendChild(header);

  // Lista de ejercicios
  var exercisesList = createElement('div', { class: 'gym-exercises-list', id: 'gym-exercises-list' });
  panel.appendChild(exercisesList);

  // Render ejercicios ya existentes en la sesión
  _gymSessionExercises.forEach(function(exData) {
    exercisesList.appendChild(buildExerciseCard(exData, sesion));
  });

  // Botones de acción
  var actionsRow = createElement('div', { class: 'gym-actions-row', id: 'gym-actions-row' });

  var addExBtn = createElement('button', { class: 'gym-btn-secondary' }, ['+ Agregar ejercicio']);
  addExBtn.addEventListener('click', function() {
    showAddExerciseFlow(panel, exercisesList, sesion);
  });

  var addNoteBtn = createElement('button', { class: 'gym-btn-secondary' }, ['Agregar nota']);
  addNoteBtn.addEventListener('click', function() {
    toggleNoteArea(actionsRow, sesion);
  });

  var finishBtn = createElement('button', { class: 'gym-btn-danger' }, ['Finalizar rutina']);
  finishBtn.addEventListener('click', function() {
    finishSession(panel, sesion);
  });

  actionsRow.appendChild(addExBtn);
  actionsRow.appendChild(addNoteBtn);
  actionsRow.appendChild(finishBtn);
  panel.appendChild(actionsRow);

  // — Sección Cardio —
  var cardioSection = createElement('div', { style: 'padding:0 20px;margin-top:16px;' });

  var cardioDivider = createElement('div', { style: 'display:flex;align-items:center;gap:12px;margin-bottom:12px;' });
  cardioDivider.appendChild(createElement('div', { style: 'flex:1;height:1px;background:var(--sep2);' }));
  cardioDivider.appendChild(createElement('span', { style: 'color:var(--t3);font-size:12px;text-transform:uppercase;letter-spacing:0.5px;' }, ['Cardio']));
  cardioDivider.appendChild(createElement('div', { style: 'flex:1;height:1px;background:var(--sep2);' }));
  cardioSection.appendChild(cardioDivider);

  var cardioRegistrosList = createElement('div', { id: 'gym-session-cardio-list' });
  cardioSection.appendChild(cardioRegistrosList);

  var addCardioBtn = createElement('button', { class: 'gym-btn-secondary', style: 'margin-top:4px;' }, ['+ Agregar cardio']);

  function reloadCardioList() {
    cardioRegistrosList.innerHTML = '';
    dbGetAll('cardio_registros').then(function(todos) {
      var registros = todos.filter(function(r) { return r.sesion_id === sesion.id; });
      registros.forEach(function(r) {
        cardioRegistrosList.appendChild(buildCardioRegistroRow(r, reloadCardioList));
      });
    });
  }
  reloadCardioList();

  addCardioBtn.addEventListener('click', function() {
    showAddCardioFlow(cardioSection, addCardioBtn, sesion, reloadCardioList);
  });
  cardioSection.appendChild(addCardioBtn);

  panel.appendChild(cardioSection);
  panel.appendChild(createElement('div', { style: 'height:80px;' }));
}

// ─── Nota inline ──────────────────────────────────────────────────────────────
function toggleNoteArea(actionsRow, sesion) {
  var existing = document.getElementById('gym-note-area');
  if (existing) { existing.remove(); return; }

  var noteDiv  = createElement('div', { id: 'gym-note-area' });
  var textarea = createElement('textarea', {
    placeholder: 'Agrega una nota a esta sesión...',
    style: 'width:100%;box-sizing:border-box;background:var(--bg2);border:none;border-radius:var(--r);padding:14px;font-size:15px;color:var(--t1);font-family:-apple-system,sans-serif;outline:none;resize:none;min-height:80px;'
  });
  textarea.value = sesion.nota || '';

  var saveNoteBtn = createElement('button', { class: 'gym-btn-secondary' }, ['Guardar nota']);
  saveNoteBtn.addEventListener('click', function() {
    sesion.nota = textarea.value;
    dbPut('sesiones', sesion).then(function() { showToast('Nota guardada'); });
  });

  noteDiv.appendChild(textarea);
  noteDiv.appendChild(saveNoteBtn);
  actionsRow.insertBefore(noteDiv, actionsRow.firstChild);
}

// ─── Ejercicio: tarjeta ────────────────────────────────────────────────────────
function buildExerciseCard(exData, sesion) {
  var card = createElement('div', { class: 'gym-exercise-card' });

  var cardHeader = createElement('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;' });
  cardHeader.appendChild(createElement('div', { class: 'gym-exercise-name', style: 'margin-bottom:0;' }, [exData.ejercicio.nombre]));

  var delExBtn = createElement('button', { class: 'gym-set-delete', style: 'font-size:14px;flex-shrink:0;' }, ['🗑']);
  delExBtn.addEventListener('click', function() {
    var nSets = exData.sets.length;
    var msg = '¿Eliminar ' + exData.ejercicio.nombre + ' y sus ' + nSets + ' set' + (nSets !== 1 ? 's' : '') + ' de esta sesión?';
    gymShowConfirmModal('¿Eliminar ' + exData.ejercicio.nombre + '?', msg, function() {
      var promises = exData.sets.map(function(s) { return dbDelete('sets', s.id); });
      Promise.all(promises).then(function() {
        var idx = _gymSessionExercises.indexOf(exData);
        if (idx >= 0) _gymSessionExercises.splice(idx, 1);
        card.style.transition = 'opacity 0.15s';
        card.style.opacity = '0';
        setTimeout(function() { card.remove(); }, 150);
      });
    });
  });
  cardHeader.appendChild(delExBtn);
  card.appendChild(cardHeader);

  var setsList = createElement('div', { class: 'gym-sets-list' });
  card.appendChild(setsList);

  exData.sets.forEach(function(set, idx) {
    setsList.appendChild(buildSetRow(set, idx + 1, setsList, exData));
  });

  var addSetBtn = createElement('button', { class: 'gym-btn-secondary', style: 'margin-top:10px;' }, ['+ Agregar set']);
  addSetBtn.addEventListener('click', function() {
    showAddSetRow(card, setsList, exData, sesion, addSetBtn);
  });
  card.appendChild(addSetBtn);

  return card;
}

// ─── Set: fila ────────────────────────────────────────────────────────────────
function buildSetRow(set, orden, setsList, exData) {
  var row = createElement('div', { class: 'gym-set-row' });

  var label = createElement('span', {}, [
    'Set ' + orden + ' — ' + set.reps + ' reps · ' + set.peso_lbs.toFixed(1) + ' lbs'
  ]);

  var delBtn = createElement('button', { class: 'gym-set-delete' }, ['×']);
  delBtn.addEventListener('click', function() {
    dbDelete('sets', set.id).then(function() {
      var idx = exData.sets.indexOf(set);
      if (idx >= 0) exData.sets.splice(idx, 1);
      row.style.transition = 'opacity 0.15s';
      row.style.opacity = '0';
      setTimeout(function() { row.remove(); renumberSets(setsList); }, 150);
    });
  });

  label.addEventListener('click', function() {
    showEditSetRow(row, label, set, orden, exData);
  });

  row.appendChild(label);
  row.appendChild(delBtn);
  return row;
}

function renumberSets(setsList) {
  var rows = setsList.querySelectorAll('.gym-set-row');
  rows.forEach(function(r, i) {
    var span = r.querySelector('span');
    if (span) {
      span.textContent = span.textContent.replace(/^Set \d+/, 'Set ' + (i + 1));
    }
  });
}

// ─── Set: editar inline ────────────────────────────────────────────────────────
function showEditSetRow(row, label, set, orden, exData) {
  if (row.querySelector('.gym-add-set-row')) return; // ya en edición

  var delBtn = row.querySelector('.gym-set-delete');
  label.style.display  = 'none';
  if (delBtn) delBtn.style.display = 'none';

  var unit    = 'lbs';
  var editRow = createElement('div', { class: 'gym-add-set-row', style: 'flex:1;' });

  var repsInput = createElement('input', { type: 'number', class: 'gym-input-small', placeholder: 'Reps' });
  repsInput.value = set.reps;

  var pesoInput = createElement('input', { type: 'number', class: 'gym-input-small', placeholder: 'Peso', step: '0.5' });
  pesoInput.value = set.peso_lbs.toFixed(1);

  var toggleDiv = createElement('div', { class: 'gym-unit-toggle' });
  var lbsBtn    = createElement('button', { class: 'active' }, ['lbs']);
  var kgBtn     = createElement('button', {}, ['kg']);
  lbsBtn.addEventListener('click', function() { unit = 'lbs'; lbsBtn.classList.add('active'); kgBtn.classList.remove('active'); });
  kgBtn.addEventListener('click',  function() { unit = 'kg';  kgBtn.classList.add('active');  lbsBtn.classList.remove('active'); });
  toggleDiv.appendChild(lbsBtn);
  toggleDiv.appendChild(kgBtn);

  var confirmBtn = createElement('button', { class: 'gym-confirm-set-btn' }, ['✓']);
  confirmBtn.addEventListener('click', function() {
    var reps     = parseInt(repsInput.value, 10);
    var pesoVal  = parseFloat(pesoInput.value);
    if (!reps || isNaN(pesoVal)) { showToast('Ingresa reps y peso'); return; }
    var peso_lbs = unit === 'kg' ? pesoVal * 2.20462 : pesoVal;
    set.reps     = reps;
    set.peso_lbs = peso_lbs;
    dbPut('sets', set).then(function() {
      editRow.remove();
      label.textContent = 'Set ' + orden + ' — ' + reps + ' reps · ' + peso_lbs.toFixed(1) + ' lbs';
      label.style.display  = '';
      if (delBtn) delBtn.style.display = '';
    });
  });

  editRow.appendChild(repsInput);
  editRow.appendChild(pesoInput);
  editRow.appendChild(toggleDiv);
  editRow.appendChild(confirmBtn);
  row.appendChild(editRow);
  repsInput.focus();
}

// ─── Agregar set ───────────────────────────────────────────────────────────────
function showAddSetRow(card, setsList, exData, sesion, addSetBtn) {
  var existing = card.querySelector('.gym-add-set-row');
  if (existing) { existing.remove(); return; }

  var unit = 'lbs';
  var row  = createElement('div', { class: 'gym-add-set-row' });

  var repsInput = createElement('input', { type: 'number', class: 'gym-input-small', placeholder: 'Reps' });
  var pesoInput = createElement('input', { type: 'number', class: 'gym-input-small', placeholder: 'Peso', step: '0.5' });

  var toggleDiv = createElement('div', { class: 'gym-unit-toggle' });
  var lbsBtn    = createElement('button', { class: 'active' }, ['lbs']);
  var kgBtn     = createElement('button', {}, ['kg']);
  lbsBtn.addEventListener('click', function() { unit = 'lbs'; lbsBtn.classList.add('active'); kgBtn.classList.remove('active'); });
  kgBtn.addEventListener('click',  function() { unit = 'kg';  kgBtn.classList.add('active');  lbsBtn.classList.remove('active'); });
  toggleDiv.appendChild(lbsBtn);
  toggleDiv.appendChild(kgBtn);

  var confirmBtn = createElement('button', { class: 'gym-confirm-set-btn' }, ['✓']);
  confirmBtn.addEventListener('click', function() {
    var reps    = parseInt(repsInput.value, 10);
    var pesoVal = parseFloat(pesoInput.value);
    if (!reps || isNaN(pesoVal)) { showToast('Ingresa reps y peso'); return; }
    var peso_lbs = unit === 'kg' ? pesoVal * 2.20462 : pesoVal;
    var orden    = exData.sets.length + 1;

    var newSet = {
      sesion_id:   sesion.id,
      ejercicio_id: exData.ejercicio.id,
      orden:        orden,
      reps:         reps,
      peso_lbs:     peso_lbs
    };

    dbPut('sets', newSet).then(function(id) {
      newSet.id = id;
      exData.sets.push(newSet);
      row.remove();
      setsList.appendChild(buildSetRow(newSet, orden, setsList, exData));
    });
  });

  row.appendChild(repsInput);
  row.appendChild(pesoInput);
  row.appendChild(toggleDiv);
  row.appendChild(confirmBtn);
  card.insertBefore(row, addSetBtn);
  repsInput.focus();
}

// ─── Flujo: agregar ejercicio ──────────────────────────────────────────────────
function showAddExerciseFlow(panel, exercisesList, sesion) {
  var existing = document.getElementById('gym-search-overlay');
  if (existing) { existing.remove(); return; }

  var overlay = createElement('div', {
    id: 'gym-search-overlay',
    style: 'padding:16px 20px;'
  });

  var searchInput = createElement('input', {
    type: 'text',
    class: 'gym-search-input',
    placeholder: 'Nombre del ejercicio...'
  });

  var suggestions = createElement('div', { class: 'gym-suggestions' });

  var cancelBtn = createElement('button', { class: 'gym-btn-secondary' }, ['Cancelar']);
  cancelBtn.addEventListener('click', function() { overlay.remove(); });

  overlay.appendChild(searchInput);
  overlay.appendChild(suggestions);
  overlay.appendChild(cancelBtn);

  var header = panel.querySelector('.gym-active-header');
  if (header && header.nextSibling) {
    panel.insertBefore(overlay, header.nextSibling);
  } else {
    panel.insertBefore(overlay, panel.firstChild);
  }

  var _allEjercicios = [];
  dbGetAll('ejercicios').then(function(all) { _allEjercicios = all; });

  searchInput.addEventListener('input', function() {
    var query = searchInput.value.trim().toLowerCase();
    suggestions.innerHTML = '';
    if (!query) return;

    var matches = _allEjercicios.filter(function(e) {
      return e.nombre.toLowerCase().indexOf(query) >= 0;
    });

    matches.forEach(function(ej) {
      var item = createElement('div', { class: 'gym-suggestion-item' }, [ej.nombre]);
      item.addEventListener('click', function() {
        overlay.remove();
        addExerciseToSession(ej, exercisesList, sesion);
      });
      suggestions.appendChild(item);
    });

    var exactMatch = _allEjercicios.find(function(e) {
      return e.nombre.toLowerCase() === query;
    });
    if (!exactMatch) {
      var nombre     = searchInput.value.trim();
      var createItem = createElement('div', {
        class: 'gym-suggestion-item',
        style: 'color:var(--accent);'
      }, ['+ Crear "' + nombre + '"']);
      createItem.addEventListener('click', function() {
        showMusclePicker(overlay, nombre, exercisesList, sesion);
      });
      suggestions.appendChild(createItem);
    }
  });

  searchInput.focus();
}

// ─── Selector de músculos primarios (multi-selección) ─────────────────────────
function showMusclePicker(overlay, nombre, exercisesList, sesion) {
  overlay.innerHTML = '';

  var musculos = [
    'Pecho','Espalda','Hombros','Bíceps','Tríceps','Antebrazos',
    'Cuádriceps','Isquiotibiales','Glúteos','Aductor','Abductor',
    'Abdominales','Gemelos','Trapecios'
  ];

  var selected = {};

  overlay.appendChild(createElement('div', { class: 'gym-modal-title', style: 'margin-bottom:4px;' }, ['Músculos primarios']));
  overlay.appendChild(createElement('div', { style: 'color:var(--t2);font-size:14px;margin-bottom:8px;' }, ['"' + nombre + '"']));

  var grid = createElement('div', { class: 'gym-muscle-grid' });
  musculos.forEach(function(m) {
    var lbl = createElement('label', { class: 'gym-muscle-checkbox-label' });
    var cb  = createElement('input', { type: 'checkbox' });
    cb.addEventListener('change', function() {
      if (cb.checked) { selected[m] = true; lbl.classList.add('selected'); }
      else            { delete selected[m]; lbl.classList.remove('selected'); }
    });
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(' ' + m));
    grid.appendChild(lbl);
  });
  overlay.appendChild(grid);

  var confirmBtn = createElement('button', { class: 'gym-btn-primary' }, ['Confirmar']);
  confirmBtn.addEventListener('click', function() {
    var arr = musculos.filter(function(m) { return selected[m]; });
    if (arr.length === 0) { showToast('Selecciona al menos un músculo'); return; }
    var newEj = {
      nombre:           nombre,
      musculo_primario: JSON.stringify(arr),
      fecha_creacion:   new Date().toISOString()
    };
    dbPut('ejercicios', newEj).then(function(id) {
      newEj.id = id;
      overlay.remove();
      addExerciseToSession(newEj, exercisesList, sesion);
    });
  });

  var cancelBtn = createElement('button', { class: 'gym-btn-secondary' }, ['Cancelar']);
  cancelBtn.addEventListener('click', function() { overlay.remove(); });

  overlay.appendChild(confirmBtn);
  overlay.appendChild(cancelBtn);
}

// ─── Formatea musculo_primario (string o JSON array) ──────────────────────────
function gymMusculoStr(val) {
  if (!val) return '';
  if (typeof val === 'string' && val.charAt(0) === '[') {
    try {
      var arr = JSON.parse(val);
      return Array.isArray(arr) ? arr.join(' · ') : val;
    } catch(e) { return val; }
  }
  return val;
}

// ─── Agregar ejercicio a la sesión ────────────────────────────────────────────
function addExerciseToSession(ejercicio, exercisesList, sesion) {
  for (var i = 0; i < _gymSessionExercises.length; i++) {
    if (_gymSessionExercises[i].ejercicio.id === ejercicio.id) {
      showToast('Ejercicio ya agregado');
      return;
    }
  }
  var exData = { ejercicio: ejercicio, sets: [] };
  _gymSessionExercises.push(exData);
  exercisesList.appendChild(buildExerciseCard(exData, sesion));
}

// ─── Finalizar rutina ─────────────────────────────────────────────────────────
function finishSession(panel, sesion) {
  if (_gymTimerInterval) { clearInterval(_gymTimerInterval); _gymTimerInterval = null; }

  sesion.duracion_ms = Date.now() - sesion.timestamp_inicio;
  sesion.finalizada  = true;

  dbPut('sesiones', sesion).then(function() {
    showSummaryScreen(panel, sesion);
  });
}

// ─── Pantalla: resumen ────────────────────────────────────────────────────────
function showSummaryScreen(panel, sesion) {
  panel.innerHTML = '';

  var mins   = Math.floor(sesion.duracion_ms / 60000);
  var secs   = Math.floor((sesion.duracion_ms % 60000) / 1000);
  var durStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

  var screen = createElement('div', { class: 'gym-summary-screen' });
  screen.appendChild(createElement('div', { class: 'gym-summary-title' }, [sesion.nombre]));
  screen.appendChild(createElement('div', { class: 'gym-summary-duration' }, ['Duración: ' + durStr]));

  _gymSessionExercises.forEach(function(exData) {
    var exDiv = createElement('div', { class: 'gym-summary-exercise' });
    exDiv.appendChild(createElement('div', { class: 'gym-summary-exercise-name' }, [exData.ejercicio.nombre]));
    exData.sets.forEach(function(set, i) {
      exDiv.appendChild(createElement('div', { class: 'gym-summary-set' }, [
        'Set ' + (i + 1) + ' — ' + set.reps + ' reps · ' + set.peso_lbs.toFixed(1) + ' lbs'
      ]));
    });
    screen.appendChild(exDiv);
  });

  // — Cardio registros en resumen —
  var cardioSummaryWrap = createElement('div', { style: 'margin-top:16px;' });
  screen.appendChild(cardioSummaryWrap);
  dbGetAll('cardio_registros').then(function(todos) {
    var registros = todos.filter(function(r) { return r.sesion_id === sesion.id; });
    if (registros.length === 0) return;
    cardioSummaryWrap.appendChild(createElement('div', { class: 'gym-summary-exercise-name', style: 'margin-top:8px;' }, ['Cardio']));
    registros.forEach(function(r) {
      var texto = (r.tipo_nombre || 'Cardio') + ' — ' + r.tiempo_min + ' min';
      if (r.valores) {
        var parts = Object.keys(r.valores).filter(function(k) { return r.valores[k] != null; });
        if (parts.length > 0) texto += ' — ' + parts.map(function(k) { return k + ': ' + r.valores[k]; }).join(', ');
      }
      cardioSummaryWrap.appendChild(createElement('div', { class: 'gym-summary-set' }, [texto]));
    });
  });

  var backBtn = createElement('button', { class: 'gym-btn-primary', style: 'margin-top:24px;' }, ['Volver al inicio']);
  backBtn.addEventListener('click', function() {
    _gymSession          = null;
    _gymSessionExercises = [];
    showStartScreen(panel);
  });
  screen.appendChild(backBtn);

  panel.appendChild(screen);
  panel.appendChild(createElement('div', { style: 'height:80px;' }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — PROGRESIÓN
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Estado Progresión ─────────────────────────────────────────────────────────
var _gymCalYear         = new Date().getFullYear();
var _gymCalMonth        = new Date().getMonth();   // 0-indexed
var _gymDirSearchQuery  = '';
var _gymDirMuscleFilter = 'Todos';
var _gymDetailRange     = '3M';
var _gymDetailMetric    = 'peso_max';

// ─── Tab Progresión: estructura de sub-tabs ────────────────────────────────────
function renderProgresionTab(panel) {
  panel.innerHTML = '';

  var subTabs = [
    { id: 'calendario', label: 'Calendario' },
    { id: 'directorio', label: 'Directorio' },
    { id: 'prs',        label: 'PRs' }
  ];

  var subBar     = createElement('div', { class: 'gym-sub-tabs' });
  var subContent = createElement('div', {});
  panel.appendChild(subBar);
  panel.appendChild(subContent);

  var subPanels = {};

  subTabs.forEach(function(sub, i) {
    var isFirst = i === 0;
    var btn = createElement('button', {
      class: 'gym-sub-tab' + (isFirst ? ' active' : ''),
      id: 'gym-sub-btn-' + sub.id
    }, [sub.label]);

    btn.addEventListener('click', function() {
      subTabs.forEach(function(s) {
        var b = document.getElementById('gym-sub-btn-' + s.id);
        var p = subPanels[s.id];
        if (b) b.classList.toggle('active', s.id === sub.id);
        if (p) p.classList.toggle('active', s.id === sub.id);
      });
      if (sub.id === 'calendario') renderCalendario(subPanels['calendario']);
      if (sub.id === 'directorio') renderDirectorio(subPanels['directorio']);
      if (sub.id === 'prs')        renderPRs(subPanels['prs']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    subBar.appendChild(btn);

    var subPanel = createElement('div', {
      class: 'tab-panel' + (isFirst ? ' active' : ''),
      id: 'gym-sub-panel-' + sub.id
    });
    subPanels[sub.id] = subPanel;
    subContent.appendChild(subPanel);
  });

  renderCalendario(subPanels['calendario']);
}

// ─── SUB-TAB 1: CALENDARIO ────────────────────────────────────────────────────
function renderCalendario(panel) {
  panel.innerHTML = '';

  var year  = _gymCalYear;
  var month = _gymCalMonth;

  var meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  dbGetAll('sesiones').then(function(sesiones) {
    var finalizadas = sesiones.filter(function(s) { return s.finalizada; });

    var byDate = {};
    finalizadas.forEach(function(s) {
      var d   = new Date(s.fecha);
      var key = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(s);
    });

    var header  = createElement('div', { class: 'gym-cal-header' });
    var prevBtn = createElement('button', { class: 'gym-cal-nav' }, ['‹']);
    prevBtn.addEventListener('click', function() {
      _gymCalMonth--;
      if (_gymCalMonth < 0) { _gymCalMonth = 11; _gymCalYear--; }
      renderCalendario(panel);
    });
    var nextBtn = createElement('button', { class: 'gym-cal-nav' }, ['›']);
    nextBtn.addEventListener('click', function() {
      _gymCalMonth++;
      if (_gymCalMonth > 11) { _gymCalMonth = 0; _gymCalYear++; }
      renderCalendario(panel);
    });
    header.appendChild(prevBtn);
    header.appendChild(createElement('div', { class: 'gym-cal-title' }, [meses[month] + ' ' + year]));
    header.appendChild(nextBtn);
    panel.appendChild(header);

    var dayLabels = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
    var labelRow  = createElement('div', { class: 'gym-cal-grid' });
    dayLabels.forEach(function(d) {
      labelRow.appendChild(createElement('div', { class: 'gym-cal-day-label' }, [d]));
    });
    panel.appendChild(labelRow);

    var grid        = createElement('div', { class: 'gym-cal-grid' });
    var firstDay    = new Date(year, month, 1).getDay();
    var startOffset = (firstDay === 0) ? 6 : firstDay - 1;
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today       = new Date();
    var todayStr    = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    for (var e = 0; e < startOffset; e++) {
      grid.appendChild(createElement('div', { class: 'gym-cal-cell empty' }));
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var dateKey   = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var hasSesion = byDate[dateKey] && byDate[dateKey].length > 0;
      var isToday   = dateKey === todayStr;

      var cls  = 'gym-cal-cell' + (hasSesion ? ' has-session' : '') + (isToday ? ' today' : '');
      var cell = createElement('div', { class: cls });
      cell.appendChild(createElement('span', { class: 'gym-cal-day-num' }, [String(day)]));
      if (hasSesion) {
        cell.appendChild(createElement('span', { class: 'gym-cal-dot' }));
        (function(sessions) {
          cell.addEventListener('click', function() { showSessionBottomSheet(sessions[0]); });
        })(byDate[dateKey]);
      }
      grid.appendChild(cell);
    }

    panel.appendChild(grid);
    panel.appendChild(createElement('div', { style: 'height:80px;' }));
  });
}

// ─── Bottom sheet: detalle de sesión ──────────────────────────────────────────
function showSessionBottomSheet(sesion) {
  var existing = document.getElementById('gym-bottom-sheet');
  if (existing) existing.remove();

  var overlay = createElement('div', { id: 'gym-bottom-sheet', class: 'gym-modal-overlay' });
  var sheet   = createElement('div', { class: 'gym-modal' });

  var totalMins = Math.floor(sesion.duracion_ms / 60000);
  var horas     = Math.floor(totalMins / 60);
  var minutos   = totalMins % 60;
  var durStr    = horas > 0 ? horas + 'h ' + minutos + 'min' : minutos + 'min';

  sheet.appendChild(createElement('div', { class: 'gym-modal-title' }, [sesion.nombre]));
  sheet.appendChild(createElement('div', {
    style: 'color:var(--accent);font-size:15px;font-weight:600;margin-bottom:8px;'
  }, [durStr]));

  Promise.all([dbGetAll('sets'), dbGetAll('ejercicios')]).then(function(results) {
    var allSets = results[0];
    var allEjs  = results[1];

    var ejMap = {};
    allEjs.forEach(function(e) { ejMap[e.id] = e; });

    var sesionSets = allSets.filter(function(s) { return s.sesion_id === sesion.id; });
    var grouped    = {};
    sesionSets.forEach(function(s) {
      if (!grouped[s.ejercicio_id]) grouped[s.ejercicio_id] = [];
      grouped[s.ejercicio_id].push(s);
    });

    var ejIds = Object.keys(grouped);
    if (ejIds.length === 0) {
      sheet.appendChild(createElement('div', {
        style: 'color:var(--t3);font-size:14px;padding:8px 0;'
      }, ['Sin ejercicios registrados']));
    } else {
      ejIds.forEach(function(ejId) {
        var sets    = grouped[ejId];
        var ej      = ejMap[parseInt(ejId, 10)] || { nombre: 'Ejercicio' };
        var maxPeso = Math.max.apply(null, sets.map(function(s) { return s.peso_lbs; }));
        var txt     = ej.nombre + ' · ' + sets.length + ' set' + (sets.length !== 1 ? 's' : '') +
                      ' · máx ' + maxPeso.toFixed(0) + ' lbs';
        sheet.appendChild(createElement('div', { class: 'gym-sheet-exercise-row' }, [txt]));
      });
    }

    if (sesion.nota) {
      sheet.appendChild(createElement('div', {
        style: 'color:var(--t2);font-size:14px;margin-top:8px;font-style:italic;'
      }, [sesion.nota]));
    }

    var closeBtn = createElement('button', { class: 'gym-btn-secondary', style: 'margin-top:8px;' }, ['Cerrar']);
    closeBtn.addEventListener('click', function() { overlay.remove(); });
    sheet.appendChild(closeBtn);

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  });
}

// ─── SUB-TAB 2: DIRECTORIO ────────────────────────────────────────────────────
function renderDirectorio(panel) {
  panel.innerHTML = '';

  var musculos = ['Todos','Pecho','Espalda','Hombros','Bíceps','Tríceps','Antebrazos',
    'Cuádriceps','Isquiotibiales','Glúteos','Aductor','Abductor','Abdominales','Gemelos','Trapecios'];

  var searchWrap  = createElement('div', { style: 'padding:16px 20px 0;' });
  var searchInput = createElement('input', {
    type: 'text',
    class: 'gym-search-input',
    placeholder: 'Buscar ejercicio...',
    style: 'margin-bottom:0;'
  });
  searchInput.value = _gymDirSearchQuery;
  searchWrap.appendChild(searchInput);
  panel.appendChild(searchWrap);

  var pillsWrap = createElement('div', { class: 'gym-filter-pills', style: 'padding-top:12px;' });
  musculos.forEach(function(m) {
    var pill = createElement('button', {
      class: 'gym-filter-pill' + (m === _gymDirMuscleFilter ? ' active' : '')
    }, [m]);
    pill.addEventListener('click', function() {
      _gymDirMuscleFilter = m;
      pillsWrap.querySelectorAll('.gym-filter-pill').forEach(function(p) { p.classList.remove('active'); });
      pill.classList.add('active');
      renderList();
    });
    pillsWrap.appendChild(pill);
  });
  panel.appendChild(pillsWrap);

  var listEl = createElement('div', { class: 'gym-dir-list' });
  panel.appendChild(listEl);

  // — Sección Cardio —
  var cardioDirHeader = createElement('div', { style: 'padding:24px 20px 8px;' });
  cardioDirHeader.appendChild(createElement('div', { class: 'title-section', style: 'padding:0 0 4px;' }, ['Cardio']));
  panel.appendChild(cardioDirHeader);

  var cardioTiposList = createElement('div', { style: 'padding:0 20px;' });
  panel.appendChild(cardioTiposList);

  var newCardioTipoBtn = createElement('button', { class: 'gym-btn-secondary', style: 'margin:8px 20px 0;display:block;' }, ['+ Nuevo tipo de cardio']);
  newCardioTipoBtn.addEventListener('click', function() { showNuevoTipoCardioForm(panel, renderCardioTiposList); });
  panel.appendChild(newCardioTipoBtn);

  panel.appendChild(createElement('div', { style: 'height:80px;' }));

  function renderCardioTiposList() {
    cardioTiposList.innerHTML = '';
    dbGetAll('cardio_tipos').then(function(tipos) {
      if (tipos.length === 0) {
        cardioTiposList.appendChild(createElement('div', {
          style: 'color:var(--t3);font-size:14px;padding:8px 0;'
        }, ['Sin tipos de cardio']));
        return;
      }
      tipos.forEach(function(tipo) {
        var item = createElement('div', { class: 'gym-dir-item' });
        item.appendChild(createElement('div', { class: 'gym-dir-item-name' }, [tipo.nombre]));
        var sub  = createElement('div', { class: 'gym-dir-item-sub' });
        var params = tipo.parametros && tipo.parametros.length > 0
          ? tipo.parametros.map(function(p) { return p.nombre; }).join(', ')
          : 'Solo tiempo';
        sub.appendChild(createElement('span', { style: 'color:var(--t2);' }, [params]));
        item.appendChild(sub);
        item.addEventListener('click', function() { showCardioTipoDetalle(panel, tipo); });
        cardioTiposList.appendChild(item);
      });
    });
  }
  renderCardioTiposList();

  searchInput.addEventListener('input', function() {
    _gymDirSearchQuery = searchInput.value;
    renderList();
  });

  function renderList() {
    listEl.innerHTML = '';
    Promise.all([dbGetAll('ejercicios'), dbGetAll('sesiones'), dbGetAll('sets')]).then(function(results) {
      var ejercicios = results[0];
      var sesiones   = results[1];
      var allSets    = results[2];

      var filtered = ejercicios.filter(function(e) {
        var mQ = !_gymDirSearchQuery || e.nombre.toLowerCase().indexOf(_gymDirSearchQuery.toLowerCase()) >= 0;
        var mM = _gymDirMuscleFilter === 'Todos';
        if (!mM && e.musculo_primario) {
          try {
            var arr = JSON.parse(e.musculo_primario);
            mM = Array.isArray(arr) ? arr.indexOf(_gymDirMuscleFilter) >= 0 : e.musculo_primario === _gymDirMuscleFilter;
          } catch(ex) { mM = e.musculo_primario === _gymDirMuscleFilter; }
        }
        return mQ && mM;
      });
      filtered.sort(function(a, b) { return a.nombre.localeCompare(b.nombre); });

      var sesionMap = {};
      sesiones.forEach(function(s) { if (s.finalizada) sesionMap[s.id] = s; });

      var lastUsedMap = {};
      allSets.forEach(function(s) {
        var ses = sesionMap[s.sesion_id];
        if (!ses) return;
        var prev = lastUsedMap[s.ejercicio_id];
        if (!prev || ses.fecha > prev) lastUsedMap[s.ejercicio_id] = ses.fecha;
      });

      if (filtered.length === 0) {
        listEl.appendChild(createElement('div', {
          style: 'padding:32px;text-align:center;color:var(--t3);font-size:15px;'
        }, ['Sin ejercicios']));
        return;
      }

      filtered.forEach(function(ej) {
        var lastStr = lastUsedMap[ej.id] ? gymFormatShortDate(lastUsedMap[ej.id]) : 'Nunca';
        var item    = createElement('div', { class: 'gym-dir-item' });
        item.appendChild(createElement('div', { class: 'gym-dir-item-name' }, [ej.nombre]));
        var sub = createElement('div', { class: 'gym-dir-item-sub' });
        sub.appendChild(createElement('span', { style: 'color:var(--accent);' }, [gymMusculoStr(ej.musculo_primario)]));
        sub.appendChild(createElement('span', {}, [' · Última vez: ' + lastStr]));
        item.appendChild(sub);
        item.addEventListener('click', function() { showEjercicioDetalle(panel, ej); });
        listEl.appendChild(item);
      });
    });
  }

  renderList();
}

// ─── Vista detalle de ejercicio ────────────────────────────────────────────────
function showEjercicioDetalle(panel, ej) {
  panel.innerHTML = '';

  var header  = createElement('div', { class: 'gym-dir-detail-header' });
  var backBtn = createElement('button', { class: 'gym-dir-back-btn' }, ['‹ Directorio']);
  backBtn.addEventListener('click', function() { renderDirectorio(panel); });
  header.appendChild(backBtn);

  // — Nombre editable —
  var nameRow = createElement('div', { style: 'display:flex;align-items:center;gap:8px;' });
  var nameEl  = createElement('div', { class: 'gym-dir-detail-title', style: 'flex:1;margin-bottom:0;' }, [ej.nombre]);
  var nameEditBtn = createElement('button', { style: 'background:none;border:none;cursor:pointer;font-size:16px;padding:4px;flex-shrink:0;' }, ['✏️']);
  nameEditBtn.addEventListener('click', function() {
    if (nameRow.querySelector('input')) return;
    var inp = createElement('input', { type: 'text', class: 'gym-session-name-input', style: 'flex:1;margin-bottom:0;' });
    inp.value = ej.nombre;
    var saveBtn2 = createElement('button', { class: 'gym-btn-primary', style: 'padding:6px 12px;font-size:13px;' }, ['Guardar']);
    var cancelBtn2 = createElement('button', { class: 'gym-btn-secondary', style: 'padding:6px 12px;font-size:13px;' }, ['Cancelar']);
    saveBtn2.addEventListener('click', function() {
      var nuevo = inp.value.trim();
      if (!nuevo) { showToast('El nombre no puede estar vacío'); return; }
      ej.nombre = nuevo;
      dbPut('ejercicios', ej).then(function() {
        nameEl.textContent = nuevo;
        nameRow.innerHTML = '';
        nameRow.appendChild(nameEl);
        nameRow.appendChild(nameEditBtn);
        showToast('Nombre actualizado');
      });
    });
    cancelBtn2.addEventListener('click', function() {
      nameRow.innerHTML = '';
      nameRow.appendChild(nameEl);
      nameRow.appendChild(nameEditBtn);
    });
    nameRow.innerHTML = '';
    nameRow.appendChild(inp);
    nameRow.appendChild(saveBtn2);
    nameRow.appendChild(cancelBtn2);
    inp.focus();
  });
  nameRow.appendChild(nameEl);
  nameRow.appendChild(nameEditBtn);
  header.appendChild(nameRow);

  // — Músculos editables —
  var muscleRow = createElement('div', { style: 'display:flex;align-items:center;gap:8px;margin-top:4px;' });
  var muscleEl  = createElement('div', { class: 'gym-dir-detail-muscle', style: 'flex:1;margin-bottom:0;' }, [gymMusculoStr(ej.musculo_primario)]);
  var muscleEditBtn = createElement('button', { style: 'background:none;border:none;cursor:pointer;font-size:14px;padding:4px;flex-shrink:0;' }, ['✏️']);
  muscleEditBtn.addEventListener('click', function() {
    var existing = document.getElementById('gym-muscle-edit-panel');
    if (existing) { existing.remove(); return; }
    var allMusculos = ['Pecho','Espalda','Hombros','Bíceps','Tríceps','Antebrazos',
      'Cuádriceps','Isquiotibiales','Glúteos','Aductor','Abductor','Abdominales','Gemelos','Trapecios'];
    var currentArr = [];
    try { currentArr = JSON.parse(ej.musculo_primario); } catch(e) {}
    if (!Array.isArray(currentArr)) currentArr = ej.musculo_primario ? [ej.musculo_primario] : [];
    var selected = {};
    currentArr.forEach(function(m) { selected[m] = true; });
    var editPanel = createElement('div', {
      id: 'gym-muscle-edit-panel',
      style: 'padding:16px 20px;background:var(--bg2);margin-top:0;'
    });
    editPanel.appendChild(createElement('div', { style: 'color:var(--t2);font-size:13px;margin-bottom:8px;' }, ['Selecciona músculos:']));
    var grid = createElement('div', { class: 'gym-muscle-grid' });
    allMusculos.forEach(function(m) {
      var lbl = createElement('label', { class: 'gym-muscle-checkbox-label' + (selected[m] ? ' selected' : '') });
      var cb  = createElement('input', { type: 'checkbox' });
      cb.checked = !!selected[m];
      cb.addEventListener('change', function() {
        if (cb.checked) { selected[m] = true; lbl.classList.add('selected'); }
        else            { delete selected[m]; lbl.classList.remove('selected'); }
      });
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(' ' + m));
      grid.appendChild(lbl);
    });
    editPanel.appendChild(grid);
    var mSaveBtn = createElement('button', { class: 'gym-btn-primary', style: 'margin-top:12px;' }, ['Guardar']);
    var mCancelBtn = createElement('button', { class: 'gym-btn-secondary' }, ['Cancelar']);
    mSaveBtn.addEventListener('click', function() {
      var arr = allMusculos.filter(function(m) { return selected[m]; });
      if (arr.length === 0) { showToast('Selecciona al menos un músculo'); return; }
      ej.musculo_primario = JSON.stringify(arr);
      dbPut('ejercicios', ej).then(function() {
        muscleEl.textContent = gymMusculoStr(ej.musculo_primario);
        editPanel.remove();
        showToast('Músculos actualizados');
      });
    });
    mCancelBtn.addEventListener('click', function() { editPanel.remove(); });
    editPanel.appendChild(mSaveBtn);
    editPanel.appendChild(mCancelBtn);
    header.parentNode.insertBefore(editPanel, header.nextSibling);
  });
  muscleRow.appendChild(muscleEl);
  muscleRow.appendChild(muscleEditBtn);
  header.appendChild(muscleRow);

  panel.appendChild(header);

  var ranges   = ['1M', '3M', '6M', '1A', 'Todo'];
  var rangeBar = createElement('div', { class: 'gym-pills-row' });
  ranges.forEach(function(r) {
    var pill = createElement('button', {
      class: 'gym-pill' + (r === _gymDetailRange ? ' active' : '')
    }, [r]);
    pill.addEventListener('click', function() {
      _gymDetailRange = r;
      rangeBar.querySelectorAll('.gym-pill').forEach(function(p) { p.classList.remove('active'); });
      pill.classList.add('active');
      renderChart();
    });
    rangeBar.appendChild(pill);
  });
  panel.appendChild(rangeBar);

  var metrics   = [
    { id: 'vol',      label: 'Volumen total' },
    { id: 'peso_max', label: 'Peso máximo' },
    { id: 'orm',      label: '1RM estimado' }
  ];
  var metricBar = createElement('div', { class: 'gym-pills-row', style: 'margin-top:8px;' });
  metrics.forEach(function(m) {
    var pill = createElement('button', {
      class: 'gym-pill' + (m.id === _gymDetailMetric ? ' active' : '')
    }, [m.label]);
    pill.addEventListener('click', function() {
      _gymDetailMetric = m.id;
      metricBar.querySelectorAll('.gym-pill').forEach(function(p) { p.classList.remove('active'); });
      pill.classList.add('active');
      renderChart();
    });
    metricBar.appendChild(pill);
  });
  panel.appendChild(metricBar);

  var chartEl = createElement('div', { id: 'gym-chart-container', style: 'padding:0 20px;margin-top:12px;' });
  var tableEl = createElement('div', { id: 'gym-detail-table', style: 'padding:0 20px;margin-top:16px;' });
  panel.appendChild(chartEl);
  panel.appendChild(tableEl);

  // — Eliminar ejercicio —
  var delEjSection = createElement('div', { style: 'padding:24px 20px 0;' });
  var delEjBtn = createElement('button', { class: 'gym-btn-danger', style: 'width:100%;' }, ['Eliminar ejercicio']);
  delEjBtn.addEventListener('click', function() {
    gymShowConfirmModal(
      '¿Eliminar ' + ej.nombre + '?',
      'Se eliminará del directorio y de todas las sesiones donde fue registrado.',
      function() {
        dbGetAll('sets').then(function(allSets) {
          var promises = allSets
            .filter(function(s) { return s.ejercicio_id === ej.id; })
            .map(function(s) { return dbDelete('sets', s.id); });
          promises.push(dbDelete('ejercicios', ej.id));
          return Promise.all(promises);
        }).then(function() {
          showToast(ej.nombre + ' eliminado');
          renderDirectorio(panel);
        });
      }
    );
  });
  delEjSection.appendChild(delEjBtn);
  panel.appendChild(delEjSection);
  panel.appendChild(createElement('div', { style: 'height:80px;' }));

  function renderChart() {
    Promise.all([dbGetAll('sesiones'), dbGetAll('sets')]).then(function(results) {
      var sesiones = results[0];
      var allSets  = results[1];

      var sesionMap = {};
      sesiones.filter(function(s) { return s.finalizada; }).forEach(function(s) { sesionMap[s.id] = s; });

      var now    = new Date();
      var cutoff = null;
      if (_gymDetailRange !== 'Todo') {
        cutoff = new Date();
        if      (_gymDetailRange === '1M') cutoff.setMonth(now.getMonth() - 1);
        else if (_gymDetailRange === '3M') cutoff.setMonth(now.getMonth() - 3);
        else if (_gymDetailRange === '6M') cutoff.setMonth(now.getMonth() - 6);
        else if (_gymDetailRange === '1A') cutoff.setFullYear(now.getFullYear() - 1);
      }

      var ejSets = allSets.filter(function(s) { return s.ejercicio_id === ej.id; });

      var sesionGroups = {};
      ejSets.forEach(function(s) {
        var ses = sesionMap[s.sesion_id];
        if (!ses) return;
        var d = new Date(ses.fecha);
        if (cutoff && d < cutoff) return;
        if (!sesionGroups[s.sesion_id]) sesionGroups[s.sesion_id] = { sesion: ses, sets: [] };
        sesionGroups[s.sesion_id].sets.push(s);
      });

      var groups = [];
      var gkeys  = Object.keys(sesionGroups);
      for (var k = 0; k < gkeys.length; k++) groups.push(sesionGroups[gkeys[k]]);
      groups.sort(function(a, b) { return new Date(a.sesion.fecha) - new Date(b.sesion.fecha); });

      var dataPoints = groups.map(function(g) {
        var val;
        if (_gymDetailMetric === 'vol') {
          val = g.sets.reduce(function(acc, s) { return acc + s.reps * s.peso_lbs; }, 0);
        } else if (_gymDetailMetric === 'peso_max') {
          val = Math.max.apply(null, g.sets.map(function(s) { return s.peso_lbs; }));
        } else {
          val = Math.max.apply(null, g.sets.map(function(s) {
            return s.reps === 1 ? s.peso_lbs : s.peso_lbs * (1 + s.reps / 30);
          }));
        }
        return {
          date:   new Date(g.sesion.fecha),
          value:  Math.round(val * 10) / 10,
          sesion: g.sesion,
          sets:   g.sets
        };
      });

      chartEl.innerHTML = '';
      gymRenderLineChart(chartEl, dataPoints);

      tableEl.innerHTML = '';
      var hdr = createElement('div', { class: 'gym-detail-table-row gym-detail-table-header' });
      ['Fecha', 'Sets', 'Máx (lbs)', '1RM est.'].forEach(function(h) {
        hdr.appendChild(createElement('span', {}, [h]));
      });
      tableEl.appendChild(hdr);

      var reversed = dataPoints.slice().reverse();
      reversed.forEach(function(dp) {
        var maxPeso = Math.max.apply(null, dp.sets.map(function(s) { return s.peso_lbs; }));
        var orm     = Math.max.apply(null, dp.sets.map(function(s) {
          return s.reps === 1 ? s.peso_lbs : s.peso_lbs * (1 + s.reps / 30);
        }));
        var row = createElement('div', { class: 'gym-detail-table-row' });
        [gymFormatShortDate(dp.sesion.fecha), String(dp.sets.length),
         maxPeso.toFixed(1), orm.toFixed(1)].forEach(function(v) {
          row.appendChild(createElement('span', {}, [v]));
        });
        tableEl.appendChild(row);
      });

      if (dataPoints.length === 0) {
        chartEl.appendChild(createElement('div', {
          style: 'color:var(--t3);font-size:14px;text-align:center;padding:24px;'
        }, ['Sin datos en este rango']));
      }
    });
  }

  renderChart();
}

// ─── Gráfica SVG de línea ─────────────────────────────────────────────────────
function gymRenderLineChart(container, dataPoints) {
  if (dataPoints.length === 0) return;

  var W      = container.offsetWidth || 320;
  var H      = 160;
  var PAD_L  = 48; var PAD_R = 16; var PAD_T = 16; var PAD_B = 32;
  var chartW = W - PAD_L - PAD_R;
  var chartH = H - PAD_T - PAD_B;

  var values = dataPoints.map(function(d) { return d.value; });
  var minV   = Math.min.apply(null, values);
  var maxV   = Math.max.apply(null, values);
  if (minV === maxV) { minV -= 1; maxV += 1; }
  var n = dataPoints.length;

  function xPos(i) {
    return PAD_L + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  }
  function yPos(v) {
    return PAD_T + chartH - ((v - minV) / (maxV - minV)) * chartH;
  }

  var NS  = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.style.display = 'block';

  function makeLine(x1, y1, x2, y2) {
    var l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1);
    l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    l.setAttribute('stroke', 'var(--sep2)'); l.setAttribute('stroke-width', '1');
    return l;
  }
  function makeText(x, y, txt, anchor) {
    var t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.setAttribute('fill', 'var(--t3)'); t.setAttribute('font-size', '10');
    t.setAttribute('text-anchor', anchor || 'end');
    t.setAttribute('font-family', '-apple-system, sans-serif');
    t.textContent = txt;
    return t;
  }

  svg.appendChild(makeLine(PAD_L, PAD_T, PAD_L, PAD_T + chartH));
  svg.appendChild(makeLine(PAD_L, PAD_T + chartH, PAD_L + chartW, PAD_T + chartH));
  svg.appendChild(makeText(PAD_L - 4, PAD_T + 4, String(Math.round(maxV))));
  svg.appendChild(makeText(PAD_L - 4, PAD_T + chartH + 1, String(Math.round(minV))));

  var pts  = dataPoints.map(function(d, i) { return xPos(i) + ',' + yPos(d.value); }).join(' ');
  var poly = document.createElementNS(NS, 'polyline');
  poly.setAttribute('points', pts);
  poly.setAttribute('fill', 'none');
  poly.setAttribute('stroke', '#32d74b');
  poly.setAttribute('stroke-width', '2');
  poly.setAttribute('stroke-linejoin', 'round');
  poly.setAttribute('stroke-linecap', 'round');
  svg.appendChild(poly);

  var mAbr = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  dataPoints.forEach(function(d, i) {
    var cx = xPos(i);
    var cy = yPos(d.value);
    var c  = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy);
    c.setAttribute('r', '4'); c.setAttribute('fill', '#32d74b');
    svg.appendChild(c);

    var showLbl = (n <= 6) || (i === 0) || (i === n - 1) || (i % Math.ceil(n / 5) === 0);
    if (showLbl) {
      svg.appendChild(makeText(cx, PAD_T + chartH + 18, mAbr[d.date.getMonth()] + ' ' + d.date.getDate(), 'middle'));
    }
  });

  container.appendChild(svg);
}

// ─── SUB-TAB 3: PRs ───────────────────────────────────────────────────────────
function renderPRs(panel) {
  panel.innerHTML = '';

  Promise.all([dbGetAll('ejercicios'), dbGetAll('sesiones'), dbGetAll('sets')]).then(function(results) {
    var ejercicios = results[0];
    var sesiones   = results[1];
    var allSets    = results[2];

    var sesionMap = {};
    sesiones.forEach(function(s) { sesionMap[s.id] = s; });

    var prs = [];
    ejercicios.forEach(function(ej) {
      var ejSets = allSets.filter(function(s) { return s.ejercicio_id === ej.id; });
      if (ejSets.length === 0) return;

      var bestORM = -1;
      var bestSet = null;
      var bestSes = null;

      ejSets.forEach(function(s) {
        var ses = sesionMap[s.sesion_id];
        if (!ses || !ses.finalizada) return;
        var orm = s.reps === 1 ? s.peso_lbs : s.peso_lbs * (1 + s.reps / 30);
        if (orm > bestORM) { bestORM = orm; bestSet = s; bestSes = ses; }
      });

      if (bestSet && bestSes) {
        prs.push({ ejercicio: ej, orm: bestORM, set: bestSet, sesion: bestSes });
      }
    });

    prs.sort(function(a, b) {
      var mg = gymMusculoStr(a.ejercicio.musculo_primario).localeCompare(gymMusculoStr(b.ejercicio.musculo_primario));
      return mg !== 0 ? mg : a.ejercicio.nombre.localeCompare(b.ejercicio.nombre);
    });

    if (prs.length === 0) {
      panel.appendChild(createElement('div', {
        style: 'padding:40px 20px;text-align:center;color:var(--t3);font-size:15px;'
      }, ['Registra sesiones para ver tus PRs']));
      return;
    }

    var listEl        = createElement('div', { style: 'padding:0 20px;' });
    var currentMuscle = null;

    prs.forEach(function(pr) {
      var muscle = gymMusculoStr(pr.ejercicio.musculo_primario) || 'Sin grupo';
      if (muscle !== currentMuscle) {
        currentMuscle = muscle;
        listEl.appendChild(createElement('div', { class: 'gym-pr-muscle-header' }, [muscle]));
      }
      var card = createElement('div', { class: 'gym-pr-card' });
      card.appendChild(createElement('div', { class: 'gym-pr-name' }, [pr.ejercicio.nombre]));
      card.appendChild(createElement('div', { class: 'gym-pr-value' }, [pr.orm.toFixed(1) + ' lbs estimado']));
      card.appendChild(createElement('div', { class: 'gym-pr-sub' }, [
        pr.set.reps + ' reps · ' + pr.set.peso_lbs.toFixed(1) + ' lbs · ' + gymFormatShortDate(pr.sesion.fecha)
      ]));
      listEl.appendChild(card);
    });

    panel.appendChild(listEl);
    panel.appendChild(createElement('div', { style: 'height:80px;' }));
  });
}

// ─── Utilidad compartida: fecha corta ─────────────────────────────────────────
function gymFormatShortDate(isoStr) {
  var d     = new Date(isoStr);
  var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return d.getDate() + ' ' + meses[d.getMonth()] + ' ' + d.getFullYear();
}

// ─── Modal de confirmación reutilizable ───────────────────────────────────────
function gymShowConfirmModal(title, message, onConfirm) {
  var overlay = createElement('div', { class: 'gym-modal-overlay' });
  var modal   = createElement('div', { class: 'gym-modal' });
  modal.appendChild(createElement('div', { class: 'gym-modal-title' }, [title]));
  if (message) {
    modal.appendChild(createElement('div', { style: 'color:var(--t2);font-size:14px;margin-bottom:16px;' }, [message]));
  }
  var confirmBtn = createElement('button', { class: 'gym-btn-danger' }, ['Confirmar']);
  var cancelBtn  = createElement('button', { class: 'gym-btn-secondary' }, ['Cancelar']);
  confirmBtn.addEventListener('click', function() { overlay.remove(); onConfirm(); });
  cancelBtn.addEventListener('click',  function() { overlay.remove(); });
  modal.appendChild(confirmBtn);
  modal.appendChild(cancelBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

// ─── Cardio: fila de registro ─────────────────────────────────────────────────
function buildCardioRegistroRow(registro, onDelete) {
  var row   = createElement('div', { class: 'gym-set-row' });
  var texto = (registro.tipo_nombre || 'Cardio') + ' — ' + registro.tiempo_min + ' min';
  if (registro.valores) {
    var parts = Object.keys(registro.valores).filter(function(k) { return registro.valores[k] != null; });
    if (parts.length > 0) {
      texto += ' — ' + parts.map(function(k) { return k + ': ' + registro.valores[k]; }).join(', ');
    }
  }
  var label  = createElement('span', {}, [texto]);
  var delBtn = createElement('button', { class: 'gym-set-delete' }, ['×']);
  delBtn.addEventListener('click', function() {
    dbDelete('cardio_registros', registro.id).then(function() {
      row.style.transition = 'opacity 0.15s';
      row.style.opacity = '0';
      setTimeout(function() { row.remove(); if (onDelete) onDelete(); }, 150);
    });
  });
  row.appendChild(label);
  row.appendChild(delBtn);
  return row;
}

// ─── Cardio: formulario agregar registro (sesión activa) ──────────────────────
function showAddCardioFlow(cardioSection, addCardioBtn, sesion, onSave) {
  var existing = document.getElementById('gym-add-cardio-form');
  if (existing) { existing.remove(); return; }

  dbGetAll('cardio_tipos').then(function(tipos) {
    var form = createElement('div', {
      id: 'gym-add-cardio-form',
      style: 'background:var(--bg2);border-radius:var(--r);padding:16px;margin-bottom:8px;'
    });

    if (tipos.length === 0) {
      form.appendChild(createElement('div', {
        style: 'color:var(--t3);font-size:14px;text-align:center;padding:8px 0;'
      }, ['Sin tipos de cardio. Créalos en el Directorio → Cardio.']));
      var closeBtn = createElement('button', { class: 'gym-btn-secondary' }, ['Cerrar']);
      closeBtn.addEventListener('click', function() { form.remove(); });
      form.appendChild(closeBtn);
      cardioSection.insertBefore(form, addCardioBtn);
      return;
    }

    var tipoSelect = createElement('select', {
      style: 'width:100%;background:var(--bg3);color:var(--t1);border:none;border-radius:6px;padding:10px;font-size:15px;margin-bottom:10px;box-sizing:border-box;'
    });
    tipos.forEach(function(t) {
      tipoSelect.appendChild(createElement('option', { value: String(t.id) }, [t.nombre]));
    });
    form.appendChild(tipoSelect);

    var timeInput = createElement('input', {
      type: 'number', class: 'gym-input-small',
      placeholder: 'Tiempo (min)', style: 'width:100%;margin-bottom:8px;'
    });
    form.appendChild(timeInput);

    var paramsDiv = createElement('div', {});
    form.appendChild(paramsDiv);

    function renderFormParams() {
      paramsDiv.innerHTML = '';
      var tipoId = parseInt(tipoSelect.value, 10);
      var tipo   = null;
      for (var i = 0; i < tipos.length; i++) { if (tipos[i].id === tipoId) { tipo = tipos[i]; break; } }
      if (!tipo || !tipo.parametros || tipo.parametros.length === 0) return;
      tipo.parametros.forEach(function(p) {
        var wrap = createElement('div', { style: 'margin-bottom:6px;' });
        wrap.appendChild(createElement('div', {
          style: 'color:var(--t2);font-size:12px;margin-bottom:3px;'
        }, [p.nombre + (p.unidad ? ' (' + p.unidad + ')' : '')]));
        var inp = createElement('input', {
          type: 'number', class: 'gym-input-small',
          'data-param': p.nombre, placeholder: p.unidad || p.nombre, style: 'width:100%;'
        });
        wrap.appendChild(inp);
        paramsDiv.appendChild(wrap);
      });
    }
    tipoSelect.addEventListener('change', renderFormParams);
    renderFormParams();

    var btnRow  = createElement('div', { style: 'display:flex;gap:8px;margin-top:12px;' });
    var saveBtn = createElement('button', { class: 'gym-btn-primary', style: 'flex:1;' }, ['Agregar']);
    var cancelBtn = createElement('button', { class: 'gym-btn-secondary', style: 'flex:1;' }, ['Cancelar']);

    saveBtn.addEventListener('click', function() {
      var tiempo = parseInt(timeInput.value, 10);
      if (!tiempo || tiempo <= 0) { showToast('Ingresa el tiempo en minutos'); return; }
      var tipoId  = parseInt(tipoSelect.value, 10);
      var tipo    = null;
      for (var i = 0; i < tipos.length; i++) { if (tipos[i].id === tipoId) { tipo = tipos[i]; break; } }
      var valores = {};
      if (tipo && tipo.parametros) {
        tipo.parametros.forEach(function(p) {
          var inp = paramsDiv.querySelector('[data-param="' + p.nombre + '"]');
          if (inp && inp.value !== '') valores[p.nombre] = parseFloat(inp.value);
        });
      }
      var registro = {
        sesion_id:   sesion.id,
        tipo_id:     tipoId,
        tipo_nombre: tipo ? tipo.nombre : '',
        tiempo_min:  tiempo,
        valores:     valores
      };
      dbPut('cardio_registros', registro).then(function() {
        form.remove();
        onSave();
      });
    });
    cancelBtn.addEventListener('click', function() { form.remove(); });
    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);
    form.appendChild(btnRow);

    cardioSection.insertBefore(form, addCardioBtn);
    timeInput.focus();
  });
}

// ─── Cardio Directorio: formulario nuevo tipo ──────────────────────────────────
function showNuevoTipoCardioForm(panel, onCreated) {
  var overlay = createElement('div', { class: 'gym-modal-overlay' });
  var modal   = createElement('div', { class: 'gym-modal' });

  modal.appendChild(createElement('div', { class: 'gym-modal-title' }, ['Nuevo tipo de cardio']));

  var nameInput = createElement('input', {
    type: 'text', class: 'gym-session-name-input', placeholder: 'Nombre (ej: Caminadora)'
  });
  modal.appendChild(nameInput);

  modal.appendChild(createElement('div', { style: 'color:var(--t2);font-size:14px;margin:12px 0 4px;font-weight:600;' }, ['Parámetros']));
  modal.appendChild(createElement('div', { style: 'color:var(--t3);font-size:12px;margin-bottom:8px;' }, ['El tiempo siempre está incluido.']));

  var paramsContainer = createElement('div', {});
  modal.appendChild(paramsContainer);

  var addParamBtn = createElement('button', { class: 'gym-btn-secondary', style: 'font-size:13px;padding:6px 12px;' }, ['+ Agregar parámetro']);
  addParamBtn.addEventListener('click', function() {
    var paramRow   = createElement('div', { style: 'display:flex;gap:6px;margin-bottom:6px;align-items:center;' });
    var nombreInp  = createElement('input', { type: 'text', class: 'gym-input-small', placeholder: 'Nombre (ej: Inclinación)', style: 'flex:1;' });
    var unidadInp  = createElement('input', { type: 'text', class: 'gym-input-small', placeholder: 'Unidad (ej: nivel)', style: 'flex:1;' });
    var removeBtn  = createElement('button', { class: 'gym-set-delete' }, ['×']);
    removeBtn.addEventListener('click', function() { paramRow.remove(); });
    paramRow.appendChild(nombreInp);
    paramRow.appendChild(unidadInp);
    paramRow.appendChild(removeBtn);
    paramsContainer.appendChild(paramRow);
    nombreInp.focus();
  });
  modal.appendChild(addParamBtn);

  var createBtn  = createElement('button', { class: 'gym-btn-primary', style: 'margin-top:16px;' }, ['Crear']);
  var cancelBtn  = createElement('button', { class: 'gym-btn-secondary' }, ['Cancelar']);

  createBtn.addEventListener('click', function() {
    var nombre = nameInput.value.trim();
    if (!nombre) { showToast('Ingresa un nombre'); return; }
    var params = [];
    var rows   = paramsContainer.querySelectorAll('div');
    rows.forEach(function(row) {
      var inputs = row.querySelectorAll('input');
      if (inputs.length >= 2) {
        var n = inputs[0].value.trim();
        var u = inputs[1].value.trim();
        if (n) params.push({ nombre: n, unidad: u });
      }
    });
    dbPut('cardio_tipos', { nombre: nombre, parametros: params }).then(function() {
      overlay.remove();
      showToast('Tipo de cardio creado');
      if (onCreated) onCreated();
    });
  });
  cancelBtn.addEventListener('click', function() { overlay.remove(); });

  modal.appendChild(createBtn);
  modal.appendChild(cancelBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  nameInput.focus();
}

// ─── Cardio Directorio: detalle de tipo ───────────────────────────────────────
function showCardioTipoDetalle(panel, tipo) {
  panel.innerHTML = '';

  var header  = createElement('div', { class: 'gym-dir-detail-header' });
  var backBtn = createElement('button', { class: 'gym-dir-back-btn' }, ['‹ Directorio']);
  backBtn.addEventListener('click', function() { renderDirectorio(panel); });
  header.appendChild(backBtn);

  // — Nombre editable —
  var nameRow = createElement('div', { style: 'display:flex;align-items:center;gap:8px;' });
  var nameEl  = createElement('div', { class: 'gym-dir-detail-title', style: 'flex:1;margin-bottom:0;' }, [tipo.nombre]);
  var nameEditBtn = createElement('button', { style: 'background:none;border:none;cursor:pointer;font-size:16px;padding:4px;flex-shrink:0;' }, ['✏️']);
  nameEditBtn.addEventListener('click', function() {
    if (nameRow.querySelector('input')) return;
    var inp = createElement('input', { type: 'text', class: 'gym-session-name-input', style: 'flex:1;margin-bottom:0;' });
    inp.value = tipo.nombre;
    var saveBtn2 = createElement('button', { class: 'gym-btn-primary', style: 'padding:6px 12px;font-size:13px;' }, ['Guardar']);
    var cancelBtn2 = createElement('button', { class: 'gym-btn-secondary', style: 'padding:6px 12px;font-size:13px;' }, ['Cancelar']);
    saveBtn2.addEventListener('click', function() {
      var nuevo = inp.value.trim();
      if (!nuevo) { showToast('El nombre no puede estar vacío'); return; }
      tipo.nombre = nuevo;
      dbPut('cardio_tipos', tipo).then(function() {
        nameEl.textContent = nuevo;
        nameRow.innerHTML = '';
        nameRow.appendChild(nameEl);
        nameRow.appendChild(nameEditBtn);
        showToast('Nombre actualizado');
      });
    });
    cancelBtn2.addEventListener('click', function() {
      nameRow.innerHTML = '';
      nameRow.appendChild(nameEl);
      nameRow.appendChild(nameEditBtn);
    });
    nameRow.innerHTML = '';
    nameRow.appendChild(inp);
    nameRow.appendChild(saveBtn2);
    nameRow.appendChild(cancelBtn2);
    inp.focus();
  });
  nameRow.appendChild(nameEl);
  nameRow.appendChild(nameEditBtn);
  header.appendChild(nameRow);
  panel.appendChild(header);

  // — Parámetros —
  var paramsSection = createElement('div', { style: 'padding:0 20px;margin-top:20px;' });
  paramsSection.appendChild(createElement('div', { style: 'color:var(--t2);font-size:14px;font-weight:600;margin-bottom:4px;' }, ['Parámetros']));
  paramsSection.appendChild(createElement('div', { style: 'color:var(--t3);font-size:12px;margin-bottom:12px;' }, ['El tiempo siempre está incluido.']));

  if (!tipo.parametros) tipo.parametros = [];

  var paramsListEl = createElement('div', {});

  function renderParamsList() {
    paramsListEl.innerHTML = '';
    tipo.parametros.forEach(function(p, idx) {
      var paramRow  = createElement('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:8px;' });
      var nombreInp = createElement('input', { type: 'text', class: 'gym-input-small', placeholder: 'Nombre', style: 'flex:1;' });
      var unidadInp = createElement('input', { type: 'text', class: 'gym-input-small', placeholder: 'Unidad', style: 'flex:1;' });
      nombreInp.value = p.nombre || '';
      unidadInp.value = p.unidad || '';

      nombreInp.addEventListener('blur', function() { tipo.parametros[idx].nombre = nombreInp.value.trim(); });
      unidadInp.addEventListener('blur', function() { tipo.parametros[idx].unidad = unidadInp.value.trim(); });

      var delParamBtn = createElement('button', { class: 'gym-set-delete' }, ['×']);
      delParamBtn.addEventListener('click', function() {
        var pNombre = p.nombre;
        var doDelete = function() {
          tipo.parametros.splice(idx, 1);
          dbPut('cardio_tipos', tipo).then(function() {
            renderParamsList();
            showToast('Parámetro eliminado');
          });
        };
        dbGetAll('cardio_registros').then(function(registros) {
          var usando = registros.filter(function(r) {
            return r.tipo_id === tipo.id && r.valores && r.valores[pNombre] != null;
          });
          if (usando.length > 0) {
            gymShowConfirmModal(
              '¿Eliminar parámetro "' + pNombre + '"?',
              'Hay ' + usando.length + ' registro(s) con este parámetro. Sus valores se conservarán en el historial.',
              doDelete
            );
          } else {
            doDelete();
          }
        });
      });

      paramRow.appendChild(nombreInp);
      paramRow.appendChild(unidadInp);
      paramRow.appendChild(delParamBtn);
      paramsListEl.appendChild(paramRow);
    });

    var addParamBtn = createElement('button', {
      class: 'gym-btn-secondary', style: 'margin-top:4px;font-size:13px;padding:6px 12px;'
    }, ['+ Agregar parámetro']);
    addParamBtn.addEventListener('click', function() {
      tipo.parametros.push({ nombre: '', unidad: '' });
      renderParamsList();
      var inputs = paramsListEl.querySelectorAll('input');
      if (inputs.length >= 2) inputs[inputs.length - 2].focus();
    });
    paramsListEl.appendChild(addParamBtn);

    var saveParamsBtn = createElement('button', { class: 'gym-btn-primary', style: 'margin-top:8px;' }, ['Guardar parámetros']);
    saveParamsBtn.addEventListener('click', function() {
      tipo.parametros = tipo.parametros.filter(function(p) { return p.nombre && p.nombre.trim(); });
      dbPut('cardio_tipos', tipo).then(function() {
        showToast('Parámetros guardados');
        renderParamsList();
      });
    });
    paramsListEl.appendChild(saveParamsBtn);
  }

  renderParamsList();
  paramsSection.appendChild(paramsListEl);
  panel.appendChild(paramsSection);

  // — Eliminar tipo —
  var delSection = createElement('div', { style: 'padding:24px 20px 0;' });
  var delBtn     = createElement('button', { class: 'gym-btn-danger', style: 'width:100%;' }, ['Eliminar tipo de cardio']);
  delBtn.addEventListener('click', function() {
    gymShowConfirmModal(
      '¿Eliminar ' + tipo.nombre + '?',
      'Se eliminarán todos los registros de cardio de este tipo.',
      function() {
        dbGetAll('cardio_registros').then(function(registros) {
          var promises = registros
            .filter(function(r) { return r.tipo_id === tipo.id; })
            .map(function(r) { return dbDelete('cardio_registros', r.id); });
          promises.push(dbDelete('cardio_tipos', tipo.id));
          return Promise.all(promises);
        }).then(function() {
          showToast(tipo.nombre + ' eliminado');
          renderDirectorio(panel);
        });
      }
    );
  });
  delSection.appendChild(delBtn);
  panel.appendChild(delSection);
  panel.appendChild(createElement('div', { style: 'height:80px;' }));
}
