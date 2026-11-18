(function () {
  const GOALS = window.GOALS, SPHERES = window.SPHERES, H = window.PIN_HASHES;
  const TARGET = 50;
  const LS = 'goals2027-status-v1';
  const STATUS = { idea: 'Мечта', doing: 'В работе', done: 'Сбылось' };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch (e) { saved = {}; }
  const statusOf = (g) => saved[g.id] || g.status || 'idea';
  const setStatus = (g, s) => { saved[g.id] = s; try { localStorage.setItem(LS, JSON.stringify(saved)); } catch (e) { /* storage unavailable */ } render(); };
  const pinUrl = (n) => { const h = H[n - 1]; return h ? `https://i.pinimg.com/474x/${h.slice(0, 2)}/${h.slice(2, 4)}/${h.slice(4, 6)}/${h}.jpg` : ''; };
  let filter = (location.hash || '').slice(1);
  if (!SPHERES[filter]) filter = '';

  const el = (tag, attrs, ...kids) => {
    const n = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) { if (v == null) continue; if (k === 'class') n.className = v; else if (k === 'style') n.setAttribute('style', v); else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v); }
    kids.flat().forEach((k) => k != null && n.append(k instanceof Node ? k : document.createTextNode(String(k))));
    return n;
  };
  const img = (n) => el('img', { src: pinUrl(n), alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' });

  function stats() {
    const done = GOALS.filter((g) => statusOf(g) === 'done').length;
    const doing = GOALS.filter((g) => statusOf(g) === 'doing').length;
    const box = document.getElementById('stats');
    const ticks = el('div', { class: 'ticks', 'aria-hidden': 'true' });
    for (let i = 0; i < TARGET; i++) ticks.append(el('i', { class: i < done ? 'done' : i < GOALS.length ? 'on' : '' }));
    box.replaceChildren(
      el('div', { class: 'orb-main', role: 'img', 'aria-label': `Записано ${GOALS.length} целей из ${TARGET}` }, el('span', null, 'Целей'), el('b', null, String(GOALS.length)), el('small', null, 'из ' + TARGET)),
      el('div', { class: 'orb-side' },
        el('div', { class: 'orb-sm' }, el('b', null, String(doing)), el('span', null, 'в работе')),
        el('div', { class: 'orb-sm done' }, el('b', null, String(done)), el('span', null, 'сбылось'))),
      ticks,
      el('div', { class: 'ticks-label' }, el('span', null, '1'), el('span', null, 'Записано ' + GOALS.length + ' · сбылось ' + done), el('span', null, String(TARGET))));
  }

  function toolbar() {
    const bar = document.getElementById('toolbar');
    const mk = (key, label, color, count) => el('button', { type: 'button', class: 'chip', 'aria-pressed': String(filter === key), onclick: () => { filter = key; history.replaceState(null, '', key ? '#' + key : location.pathname); render(); } },
      color ? el('span', { class: 'dot', style: `background:${color}` }) : null, label, el('span', { class: 'n' }, count));
    const chips = [mk('', 'Все', null, GOALS.length)];
    Object.entries(SPHERES).forEach(([k, s]) => { const c = GOALS.filter((g) => g.sphere === k).length; if (c) chips.push(mk(k, s.name, s.color, c)); });
    bar.replaceChildren(...chips);
  }

  function collage(g) {
    const pins = g.pins || [];
    if (!pins.length) return el('div', { class: 'nophoto' }, 'Картинки добавим');
    const show = pins.slice(0, 4);
    const box = el('div', { class: 'collage c' + show.length });
    show.forEach((n, i) => {
      const ph = el('div', { class: 'ph' }, img(n));
      if (i === show.length - 1 && pins.length > show.length) ph.append(el('div', { class: 'more' }, '+' + (pins.length - show.length)));
      box.append(ph);
    });
    return box;
  }

  function cards() {
    const grid = document.getElementById('grid');
    const list = GOALS.filter((g) => !filter || g.sphere === filter);
    grid.replaceChildren(...list.map((g) => {
      const s = statusOf(g), sp = SPHERES[g.sphere] || { name: '', color: '#888' };
      return el('button', { type: 'button', class: 'card' + (s === 'done' ? ' done' : '') + (g.feature ? ' feature' : ''), onclick: () => open(g) },
        collage(g),
        el('div', { class: 'body' },
          el('div', { class: 'meta' }, el('span', { class: 'sph' }, el('i', { style: `background:${sp.color}` }), sp.name), el('span', { class: 'status ' + s }, STATUS[s]), g.when ? el('span', null, g.when) : null),
          el('div', { class: 'row' }, el('h3', null, g.title), el('span', { class: 'go', 'aria-hidden': 'true' }, '›')),
          g.why ? el('p', null, g.why) : null));
    }));
  }

  function pool() {
    const used = new Set(GOALS.flatMap((g) => g.pins || []));
    const free = H.map((_, i) => i + 1).filter((n) => !used.has(n));
    document.getElementById('pool').hidden = !free.length;
    document.getElementById('pool-grid').replaceChildren(...free.map((n) => el('div', { class: 'ph', title: 'Пин №' + n }, img(n), el('b', null, n))));
  }

  const dlg = document.getElementById('dlg');
  function open(g) {
    const sp = SPHERES[g.sphere] || { name: '', color: '#888' };
    const s = statusOf(g);
    const facts = [['Когда', g.when], ['Сколько стоит', g.cost], ['Первый шаг', g.first]].filter(([, v]) => v);
    document.getElementById('dlg-inner').replaceChildren(
      el('div', { class: 'dlg-head' },
        el('div', null, el('div', { class: 'meta' }, el('span', { class: 'sph' }, el('i', { style: `background:${sp.color}` }), sp.name)), el('h2', { id: 'dlg-title' }, g.title)),
        el('button', { type: 'button', class: 'x', 'aria-label': 'Закрыть', onclick: () => dlg.close() }, '×')),
      el('div', { class: 'dlg-body' },
        g.why ? el('p', { style: 'margin:0;max-width:70ch' }, g.why) : null,
        facts.length ? el('div', { class: 'facts' }, ...facts.map(([k, v]) => el('div', { class: 'fact' }, el('span', null, k), v))) : null,
        el('div', { class: 'statusbar' }, el('span', { class: 'note' }, 'Статус:'), ...Object.entries(STATUS).map(([k, label]) => el('button', { type: 'button', class: 'chip', 'aria-pressed': String(s === k), onclick: () => { setStatus(g, k); open(g); } }, label))),
        (g.pins || []).length ? el('div', { class: 'gallery' }, ...g.pins.map(img)) : el('p', { class: 'note' }, 'Картинок пока нет — подберём с доски.')));
    if (!dlg.open) dlg.showModal();
  }
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  function render() { stats(); toolbar(); cards(); pool(); }
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); filter = SPHERES[h] ? h : ''; render(); });
  render();
})();
