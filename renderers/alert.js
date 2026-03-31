// renderers/alert.js
function renderAlert(sec) {
  var div = createElement('div', { class: 'alert alert-' + sec.variant });
  if (sec.label) div.appendChild(createElement('span', { class: 'alert-label' }, [sec.label]));
  div.appendChild(document.createTextNode(sec.text));
  return div;
}
