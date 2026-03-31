// renderers/phase_tracker.js
function renderPhaseTracker(sec) {
  var tid = sec.id || ('tr_' + Math.random().toString(36).slice(2));
  var saved = JSON.parse(localStorage.getItem('habitos-phases') || '{}');
  var def = saved[tid] !== undefined ? saved[tid] : (sec.default || 0);

  var phasesGrid = createElement('div', { class: 'tracker-phases' });
  sec.phases.forEach(function(phase, i) {
    var card = createElement('div', {
      class: 'tracker-phase' + (i === def ? ' current' : ''),
      'data-tracker': tid
    }, [
      createElement('span', { class: 'phase-num' }, [phase.label]),
      document.createTextNode(phase.sublabel)
    ]);
    (function(idx) {
      card.addEventListener('click', function() { selectPhase(tid, idx, sec.phases); });
    })(i);
    phasesGrid.appendChild(card);
  });

  var desc = createElement('div', { class: 'phase-desc', id: 'phase-desc-' + tid });
  desc.innerHTML = '<strong>' + sec.phases[def].title + '</strong><br><br>' + sec.phases[def].description;

  return createElement('div', { class: 'tracker' }, [
    createElement('div', { class: 'tracker-title' }, [sec.title]),
    createElement('div', { class: 'tracker-sub' },   [sec.subtitle]),
    phasesGrid,
    desc
  ]);
}

function selectPhase(trackerId, index, phases) {
  document.querySelectorAll('.tracker-phase[data-tracker="' + trackerId + '"]').forEach(function(p, i) {
    p.classList.toggle('current', i === index);
  });
  var desc = document.getElementById('phase-desc-' + trackerId);
  if (desc) desc.innerHTML = '<strong>' + phases[index].title + '</strong><br><br>' + phases[index].description;
  var phases_store = JSON.parse(localStorage.getItem('habitos-phases') || '{}');
  phases_store[trackerId] = index;
  localStorage.setItem('habitos-phases', JSON.stringify(phases_store));
}
