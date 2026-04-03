// renderers/alert.js
function renderAlert(sec) {
  var variant = sec.variant || 'warning';
  var div = createElement('div', { class: 'alert alert-' + variant });
  if (sec.label) div.appendChild(createElement('span', { class: 'alert-label' }, [sec.label]));
  div.appendChild(document.createTextNode(sec.text));
  return div;
}
