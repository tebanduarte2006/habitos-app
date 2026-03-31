// renderers/gym.js — Módulo Gym (autónomo, IndexedDB)

// ─── Estado del módulo ─────────────────────────────────────────────────────────
var _gymSession          = null;   // objeto sesión activa
var _gymSessionExercises = [];     // [{ ejercicio: {...}, sets: [...] }]
var _gymTimerInterval    = null;   // setInterval del cronómetro
var _gymPanel            = null;   // panel raíz del tab "Iniciar Rutina"

// ─── Punto de entrada ──────────────────────────────────────────────────────────
function renderGymModule(container) {
  var tabBar     = createElement('div', { class: 'main-tabs' });
  var tabContent = createElement('div', {});
  container.appendChild(tabBar);
  container.appendChild(tabContent);

  var btn = createElement('button', { class: 'main-tab active' }, ['▶ Iniciar Rutina']);
  tabBar.appendChild(btn);

  var panel = createElement('div', { class: 'tab-panel active', id: 'gym-panel-iniciar' });
  tabContent.appendChild(panel);
  _gymPanel = panel;

  renderIniciarTab(panel);
}

// ─── Tab: Iniciar Rutina ───────────────────────────────────────────────────────
function renderIniciarTab(panel) {
  panel.innerHTML = '';
  if (_gymTimerInterval) { clearInterval(_gymTimerInterval); _gymTimerInterval = null; }

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

  card.appendChild(createElement('div', { class: 'gym-exercise-name' }, [exData.ejercicio.nombre]));

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
      row.remove();
      renumberSets(setsList);
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

// ─── Selector de músculo primario ─────────────────────────────────────────────
function showMusclePicker(overlay, nombre, exercisesList, sesion) {
  overlay.innerHTML = '';

  var musculos = [
    'Pecho','Espalda','Hombros','Bíceps','Tríceps','Antebrazos',
    'Cuádriceps','Isquiotibiales','Glúteos','Aductor','Abductor',
    'Abdominales','Gemelos','Trapecios'
  ];

  var selectedMusculo = null;

  overlay.appendChild(createElement('div', { class: 'gym-modal-title', style: 'margin-bottom:4px;' }, ['Músculo primario']));
  overlay.appendChild(createElement('div', { style: 'color:var(--t2);font-size:14px;margin-bottom:8px;' }, ['"' + nombre + '"']));

  var grid = createElement('div', { class: 'gym-muscle-grid' });
  musculos.forEach(function(m) {
    var btn = createElement('button', { class: 'gym-muscle-btn' }, [m]);
    btn.addEventListener('click', function() {
      grid.querySelectorAll('.gym-muscle-btn').forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      selectedMusculo = m;
    });
    grid.appendChild(btn);
  });
  overlay.appendChild(grid);

  var confirmBtn = createElement('button', { class: 'gym-btn-primary' }, ['Confirmar']);
  confirmBtn.addEventListener('click', function() {
    if (!selectedMusculo) { showToast('Selecciona un músculo'); return; }
    var newEj = {
      nombre:           nombre,
      musculo_primario: selectedMusculo,
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
