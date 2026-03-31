// renderers/metric_grid.js
function renderMetricGrid(sec) {
  var grid = createElement('div', { class: 'razor-grid' });
  sec.items.forEach(function(item) {
    var variantClass = item.variant === 'warn' ? ' warn-card' : item.variant === 'ok' ? ' ok-card' : '';
    var valClass = 'rc-val' + (item.variant === 'default' ? ' rc-val-default' : '');
    grid.appendChild(createElement('div', { class: 'razor-card' + variantClass }, [
      createElement('div', { class: 'rc-label' }, [item.label]),
      createElement('div', { class: valClass },   [item.value]),
      createElement('div', { class: 'rc-sub' },   [item.sublabel])
    ]));
  });
  var frag = document.createDocumentFragment();
  if (sec.label) frag.appendChild(createElement('div', { class: 'section-label' }, [sec.label]));
  frag.appendChild(grid);
  return frag;
}
