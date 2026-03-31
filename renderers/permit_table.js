// renderers/permit_table.js
function renderPermitTable(sec) {
  var rows = sec.rows.map(function(row) {
    var cells = [createElement('td', row.highlight ? { style: 'color:var(--' + (row.highlight === 'danger' ? 'red' : row.highlight) + ');font-style:italic;' } : null, [row.product])];
    row.values.forEach(function(val) {
      var cls = val === 'ok' ? 'ok-cell' : val === 'no' ? 'no-cell' : 'half-cell';
      var sym = val === 'ok' ? '✓' : val === 'no' ? '✗' : '± puntual';
      cells.push(createElement('td', { class: cls }, [sym]));
    });
    return createElement('tr', null, cells);
  });

  var table = createElement('table', { class: 'permit-table' }, [
    createElement('thead', null, [createElement('tr', null, sec.columns.map(function(c) { return createElement('th', null, [c]); }))]),
    createElement('tbody', null, rows)
  ]);

  var frag = document.createDocumentFragment();
  if (sec.label) frag.appendChild(createElement('div', { class: 'section-label' }, [sec.label]));
  frag.appendChild(createElement('div', { style: 'overflow-x:auto;border-radius:var(--r);' }, [table]));
  return frag;
}
