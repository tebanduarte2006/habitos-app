// renderers/day_selector.js
var _dayStates = _dayStates || {};

function renderDaySelector(sec) {
  var sid = sec.id || ('ds_' + Math.random().toString(36).slice(2));
  if (!_dayStates[sid]) {
    _dayStates[sid] = sec.days.map(function(_, i) {
      return (sec.default_selected || []).indexOf(i) >= 0;
    });
  }
  var wrap = createElement('div', { class: 'day-selector' });
  sec.days.forEach(function(day, i) {
    var btn = createElement('button', {
      class: 'day-btn' + (_dayStates[sid][i] ? ' selected' : ''),
      'data-selector': sid
    }, [day]);
    (function(idx) {
      btn.addEventListener('click', function() { toggleDay(btn, sid, idx); });
    })(i);
    wrap.appendChild(btn);
  });
  var frag = document.createDocumentFragment();
  if (sec.label) frag.appendChild(createElement('div', { class: 'section-label' }, [sec.label]));
  if (sec.sublabel) frag.appendChild(createElement('p', { style: 'font-size:13px;color:var(--t2);margin-bottom:10px;' }, [sec.sublabel]));
  frag.appendChild(wrap);
  return frag;
}

function toggleDay(btn, selectorId, index) {
  btn.classList.toggle('selected');
  if (!_dayStates[selectorId]) _dayStates[selectorId] = [];
  _dayStates[selectorId][index] = btn.classList.contains('selected');
  saveDays();
}

function saveDays() {
  localStorage.setItem('habitos-days', JSON.stringify(_dayStates));
}

function loadDays() {
  var raw = localStorage.getItem('habitos-days');
  if (!raw) return;
  var saved = JSON.parse(raw);
  Object.keys(saved).forEach(function(sid) {
    _dayStates[sid] = saved[sid];
    document.querySelectorAll('.day-btn[data-selector="' + sid + '"]').forEach(function(btn, i) {
      if (_dayStates[sid][i]) btn.classList.add('selected');
      else btn.classList.remove('selected');
    });
  });
}
