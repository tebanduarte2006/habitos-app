// ─── renderers/icons.js — librería de iconos SVG (vanilla) ────────────────────
// Builders inspirados en SF Symbols (line-style, 1.6px stroke).
// Uso: var el = ICON.dumbbell({ size: 22, color: '#fff' });
// Devuelven elementos <svg>.

(function() {
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs) {
    var e = document.createElementNS(SVG_NS, tag);
    if (attrs) Object.keys(attrs).forEach(function(k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  // Crea un <svg> base con el path provisto.
  // opts: { size=22, stroke=1.6, fill='none', color, paths: [{ d, fill? }], extras: [(svg) => {}] }
  function makeIcon(opts) {
    opts = opts || {};
    var size = opts.size || 22;
    var stroke = opts.stroke != null ? opts.stroke : 1.6;
    var fill = opts.fill || 'none';
    var color = opts.color || 'currentColor';

    var svg = svgEl('svg', {
      width: String(size),
      height: String(size),
      viewBox: '0 0 24 24',
      fill: fill,
      stroke: color,
      'stroke-width': String(stroke),
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    });
    if (opts.style) svg.setAttribute('style', opts.style);
    if (opts.class) svg.setAttribute('class', opts.class);

    (opts.paths || []).forEach(function(p) {
      var path = svgEl('path', { d: p.d });
      if (p.fill) path.setAttribute('fill', p.fill);
      if (p.stroke) path.setAttribute('stroke', p.stroke);
      svg.appendChild(path);
    });

    if (opts.extras) opts.extras.forEach(function(fn) { fn(svg); });
    return svg;
  }

  var ICON = {
    dumbbell: function(o) { return makeIcon(extend(o, { paths: [
      { d: 'M6.5 6v12M3 9v6M17.5 6v12M21 9v6M6.5 12h11' }
    ]})); },
    brain: function(o) { return makeIcon(extend(o, { paths: [
      { d: 'M12 5a3 3 0 0 0-3 3v.5a2.5 2.5 0 0 0-2 4 2.5 2.5 0 0 0 0 4 2.5 2.5 0 0 0 2.5 3 2.5 2.5 0 0 0 2.5-2.5V8a3 3 0 0 0 0-3z' },
      { d: 'M12 5a3 3 0 0 1 3 3v.5a2.5 2.5 0 0 1 2 4 2.5 2.5 0 0 1 0 4 2.5 2.5 0 0 1-2.5 3 2.5 2.5 0 0 1-2.5-2.5' }
    ]})); },
    play: function(o) { return makeIcon(extend(o, { fill: 'currentColor', stroke: 'none', paths: [
      { d: 'M7 5.5v13l11-6.5z' }
    ]})); },
    pause: function(o) {
      var svg = makeIcon(extend(o, { fill: 'currentColor', stroke: 'none', paths: [] }));
      svg.appendChild(svgEl('rect', { x: '6', y: '5', width: '4', height: '14', rx: '1', fill: 'currentColor' }));
      svg.appendChild(svgEl('rect', { x: '14', y: '5', width: '4', height: '14', rx: '1', fill: 'currentColor' }));
      return svg;
    },
    stop: function(o) {
      var svg = makeIcon(extend(o, { fill: 'currentColor', stroke: 'none', paths: [] }));
      svg.appendChild(svgEl('rect', { x: '6', y: '6', width: '12', height: '12', rx: '2', fill: 'currentColor' }));
      return svg;
    },
    plus: function(o) { return makeIcon(extend(o, { paths: [
      { d: 'M12 5v14M5 12h14' }
    ]})); },
    check: function(o) { return makeIcon(extend(o, { paths: [
      { d: 'M5 12.5l4.5 4.5L19 7.5' }
    ]})); },
    x: function(o) { return makeIcon(extend(o, { paths: [
      { d: 'M6 6l12 12M18 6L6 18' }
    ]})); },
    chevronRight: function(o) { return makeIcon(extend(o, { paths: [
      { d: 'M9 6l6 6-6 6' }
    ]})); },
    chevronLeft: function(o) { return makeIcon(extend(o, { paths: [
      { d: 'M15 6l-6 6 6 6' }
    ]})); },
    chevronDown: function(o) { return makeIcon(extend(o, { paths: [
      { d: 'M6 9l6 6 6-6' }
    ]})); },
    search: function(o) {
      var svg = makeIcon(extend(o, { paths: [
        { d: 'M16 16l4 4' }
      ]}));
      svg.appendChild(svgEl('circle', {
        cx: '11', cy: '11', r: '6.5',
        fill: 'none', stroke: 'currentColor'
      }));
      return svg;
    },
    clock: function(o) {
      var svg = makeIcon(extend(o, { paths: [
        { d: 'M12 7.5V12l3 2' }
      ]}));
      svg.appendChild(svgEl('circle', {
        cx: '12', cy: '12', r: '8.5',
        fill: 'none', stroke: 'currentColor'
      }));
      return svg;
    },
    flame: function(o) { return makeIcon(extend(o, { paths: [
      { d: 'M12 3.5s4 4 4 8.5a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5C8 9 8.5 6.5 12 3.5z' }
    ]})); },
    trophy: function(o) { return makeIcon(extend(o, { paths: [
      { d: 'M7 4h10v3a5 5 0 0 1-10 0z' },
      { d: 'M5 5h2v2a2 2 0 0 1-2-2zM19 5h-2v2a2 2 0 0 0 2-2z' },
      { d: 'M10 13h4l-.5 4h-3z' },
      { d: 'M8 19h8' }
    ]})); },
    calendar: function(o) {
      var svg = makeIcon(extend(o, { paths: [
        { d: 'M3.5 9.5h17M8 3v4M16 3v4' }
      ]}));
      svg.appendChild(svgEl('rect', {
        x: '3.5', y: '5', width: '17', height: '15', rx: '2',
        fill: 'none', stroke: 'currentColor'
      }));
      return svg;
    },
    target: function(o) {
      var svg = makeIcon(extend(o, { paths: [] }));
      svg.appendChild(svgEl('circle', { cx: '12', cy: '12', r: '8.5', fill: 'none', stroke: 'currentColor' }));
      svg.appendChild(svgEl('circle', { cx: '12', cy: '12', r: '4.5', fill: 'none', stroke: 'currentColor' }));
      svg.appendChild(svgEl('circle', { cx: '12', cy: '12', r: '1', fill: 'currentColor', stroke: 'none' }));
      return svg;
    },
    more: function(o) {
      var svg = makeIcon(extend(o, { paths: [] }));
      [6, 12, 18].forEach(function(cx) {
        svg.appendChild(svgEl('circle', { cx: String(cx), cy: '12', r: '1.2', fill: 'currentColor', stroke: 'none' }));
      });
      return svg;
    },
    gear: function(o) { return makeIcon(extend(o, { paths: [
      { d: 'M19.4 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' }
    ]})); }
  };

  function extend(o, base) {
    o = o || {};
    Object.keys(o).forEach(function(k) { base[k] = o[k]; });
    return base;
  }

  window.ICON = ICON;
})();
