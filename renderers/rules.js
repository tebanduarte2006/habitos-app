// renderers/rules.js
function renderRules(sec) {
  var wrap = createElement('div', { class: 'steps-static' });
  sec.items.forEach(function(item) {
    var bodyChildren = [createElement('div', { class: 'step-name' }, [item.name])];
    if (item.detail) bodyChildren.push(createElement('div', { class: 'step-detail' }, [item.detail]));
    wrap.appendChild(createElement('div', { class: 'step-static' }, [
      createElement('div', { class: 'step-num' }, [item.id]),
      createElement('div', { class: 'step-body' }, bodyChildren)
    ]));
  });
  var frag = document.createDocumentFragment();
  if (sec.label) frag.appendChild(createElement('div', { class: 'section-label' }, [sec.label]));
  frag.appendChild(wrap);
  return frag;
}
