// renderers/checklist.js
function renderChecklist(sec) {
  var wrap = document.createElement('div');
  wrap.className = 'steps';
  sec.steps.forEach(function(step, i) {
    var children = [createElement('div', { class: 'step-name' }, [step.name])];
    if (step.detail) children.push(createElement('div', { class: 'step-detail' }, [step.detail]));
    if (step.product) children.push(createElement('span', { class: 'product-tag' }, [step.product]));
    var row = createElement('div', {
      class: 'step',
      'data-id': step.id,
      'data-group': sec.id,
      'aria-checked': 'false',
      role: 'checkbox'
    }, [
      createElement('div', { class: 'step-num' }, [String(i + 1).padStart(2, '0')]),
      createElement('div', { class: 'step-body' }, children),
      createElement('div', { class: 'check-box' })
    ]);
    row.addEventListener('click', function() { toggleStep(row, sec.id); });
    wrap.appendChild(row);
  });
  var frag = document.createDocumentFragment();
  if (sec.label) frag.appendChild(createElement('div', { class: 'section-label' }, [sec.label]));
  frag.appendChild(createElement('div', { class: 'progress-row' }, [
    createElement('span', { class: 'prog-label', id: 'prog-' + sec.id + '-txt' }, ['0 / ' + sec.steps.length]),
    createElement('div', { class: 'prog-wrap' }, [createElement('div', { class: 'prog-bar', id: 'prog-' + sec.id + '-bar' })]),
    createElement('span', { class: 'prog-pct', id: 'prog-' + sec.id + '-pct' }, ['0%'])
  ]));
  var resetBtn = createElement('button', { class: 'reset-btn' }, ['Reiniciar']);
  resetBtn.addEventListener('click', function() { resetGroup(sec.id); });
  frag.appendChild(createElement('div', { class: 'reset-row' }, [resetBtn]));
  frag.appendChild(wrap);
  return frag;
}
