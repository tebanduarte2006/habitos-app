// renderers/scenario_picker.js
function renderScenarioPicker(sec) {
  var groupId = sec.id || 'sp_' + Math.random().toString(36).slice(2);
  var frag = document.createDocumentFragment();
  if (sec.label) frag.appendChild(createElement('div', { class: 'section-label' }, [sec.label]));
  var subTabsEl = createElement('div', { class: 'sub-tabs' });
  frag.appendChild(subTabsEl);
  sec.scenarios.forEach(function(scenario, i) {
    var tabBtn = createElement('button', {
      class: 'sub-tab' + (i === 0 ? ' active' : ''),
      id: 'subtab-' + groupId + '-' + scenario.id
    }, [scenario.label]);
    (function(sid) {
      tabBtn.addEventListener('click', function() { switchSub(groupId, sid); });
    })(scenario.id);
    subTabsEl.appendChild(tabBtn);
    var panel = createElement('div', {
      class: 'sub-panel' + (i === 0 ? ' active' : ''),
      id: 'subpanel-' + groupId + '-' + scenario.id
    });
    scenario.sections.forEach(function(childSec) {
      var rendered = renderSection(childSec);
      if (rendered) panel.appendChild(rendered);
    });
    frag.appendChild(panel);
  });
  return frag;
}
