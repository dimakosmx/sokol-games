(() => {
  'use strict';
  const grid = document.querySelector('#gameGrid');
  const search = document.querySelector('#search');
  const filters = document.querySelector('#filters');
  const dialog = document.querySelector('#gameDialog');
  const frame = document.querySelector('#gameFrame');
  const safeGetFavorites = () => { try { return JSON.parse(localStorage.getItem('sokol-favorites') || '[]'); } catch { return []; } };
  const favorites = new Set(safeGetFavorites().filter(x => typeof x === 'string'));
  let currentFilter = 'all';
  let currentDevice = 'all';
  const deviceNames = { computer: 'Компьютер', phone: 'Телефон', tablet: 'Планшет' };
  const deviceIcons = { computer: '⌨', phone: '▯', tablet: '▣' };
  const deviceChoices = document.querySelector('#deviceChoices');
  let sounds = false;
  let audio;
  document.querySelector('#year').textContent = new Date().getFullYear();
  document.querySelector('#totalCount').textContent = GAMES.length;
  document.querySelector('#readyCount').textContent = GAMES.filter(g => g.status === 'ready').length;
  document.querySelector('#catalogCounter').textContent = String(GAMES.length).padStart(2, '0') + ' / GAMES';
  const escapeHTML = s => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function beep() {
    if (!sounds) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime;
      o.type = 'sine'; o.frequency.setValueAtTime(640,t); o.frequency.exponentialRampToValueAtTime(940,t+.08);
      gain.gain.setValueAtTime(.035,t); gain.gain.exponentialRampToValueAtTime(.0001,t+.12);
      o.connect(gain); gain.connect(audio.destination); o.start(t); o.stop(t+.13);
    } catch { /* unsupported audio */ }
  }
  function deviceBadges(g) {
    return (g.devices || []).map(id => `<span class="device-badge" title="${escapeHTML(deviceNames[id] || id)}">${deviceIcons[id] || '•'} ${escapeHTML(deviceNames[id] || id)}</span>`).join('');
  }
  function card(g, i) {
    const ready = g.status === 'ready';
    const el = document.createElement('article');
    el.className = 'game-card';
    el.style.setProperty('--from',g.colors[0]); el.style.setProperty('--to',g.colors[1]);
    el.innerHTML = `<div class="card-art"><span class="art-grid"></span><span class="art-icon">${escapeHTML(g.icon)}</span><span class="card-index">${String(i+1).padStart(2,'0')}</span><span class="status ${ready?'live':''}">${ready?'● PLAYABLE':'COMING SOON'}</span></div><div class="card-content"><div class="card-top"><span class="genre">${escapeHTML(g.genre)}</span><button class="favorite ${favorites.has(g.id)?'active':''}" data-favorite="${escapeHTML(g.id)}" aria-label="${favorites.has(g.id)?'Убрать из избранного':'В избранное'}" aria-pressed="${favorites.has(g.id)}">★</button></div><h3>${escapeHTML(g.title)}</h3><p>${escapeHTML(g.subtitle)}</p><div class="card-devices" aria-label="Поддерживаемые устройства">${deviceBadges(g)}</div><button class="card-play" data-play="${escapeHTML(g.id)}" ${!ready?'disabled':''}>${ready?'ИГРАТЬ СЕЙЧАС ↗':'СКОРО В ИГРЕ ✧'}</button></div>`;
    return el;
  }
  function render() {
    const query = search.value.trim().toLocaleLowerCase('ru');
    grid.replaceChildren();
    let shown = 0;
    GAMES.forEach((g,i) => {
      if (currentDevice !== 'all' && !(g.devices || []).includes(currentDevice)) return;
      if (currentFilter === 'ready' && g.status !== 'ready') return;
      if (currentFilter === 'soon' && g.status !== 'soon') return;
      if (currentFilter === 'favorite' && !favorites.has(g.id)) return;
      if (![g.title,g.subtitle,g.genre].join(' ').toLocaleLowerCase('ru').includes(query)) return;
      grid.append(card(g,i)); shown++;
    });
    document.querySelector('#emptyMessage').hidden = shown !== 0;
    document.querySelector('#deviceSummary').textContent = currentDevice === 'all' ? `Все устройства · найдено игр: ${shown}` : `${deviceNames[currentDevice]} · найдено игр: ${shown}`;
  }
  function validLocalPath(path) {
    if (!path || /^(?:[a-z]+:|\/\/|\/)/i.test(path) || path.split('/').includes('..')) return false;
    return path.endsWith('.html');
  }
  function play(id) {
    const g = GAMES.find(x => x.id === id);
    if (!g || g.status !== 'ready' || !validLocalPath(g.url)) return;
    beep();
    document.querySelector('#dialogTitle').textContent = g.title;
    document.querySelector('#dialogHint').textContent = g.controls || 'Удачной игры!';
    document.querySelector('#dialogDevices').textContent = 'ДОСТУПНО НА: ' + (g.devices || []).map(id => deviceNames[id] || id).join(' · ');
    frame.src = g.url;
    if (typeof dialog.showModal === 'function') dialog.showModal();
  }
  grid.addEventListener('click', e => {
    const fav = e.target.closest('[data-favorite]');
    if (fav) {
      const id = fav.dataset.favorite;
      favorites.has(id) ? favorites.delete(id) : favorites.add(id);
      try { localStorage.setItem('sokol-favorites',JSON.stringify([...favorites])); } catch {}
      beep(); render(); return;
    }
    const btn = e.target.closest('[data-play]');
    if (btn) play(btn.dataset.play);
  });
  filters.addEventListener('click', e => {
    const b = e.target.closest('[data-filter]'); if (!b) return;
    currentFilter = b.dataset.filter;
    filters.querySelectorAll('button').forEach(x => x.classList.toggle('selected',x===b));
    beep(); render();
  });
  search.addEventListener('input',render);
  deviceChoices.addEventListener('click', e => {
    const b = e.target.closest('[data-device]'); if (!b) return;
    currentDevice = b.dataset.device;
    deviceChoices.querySelectorAll('[data-device]').forEach(x => {
      const chosen = x === b;
      x.classList.toggle('active',chosen);
      x.setAttribute('aria-pressed',String(chosen));
    });
    beep(); render();
    document.querySelector('#games').scrollIntoView({behavior:'smooth'});
  });
  function close() { frame.src = 'about:blank'; if (dialog.open) dialog.close(); }
  document.querySelector('#closeDialog').addEventListener('click',close);
  dialog.addEventListener('close',()=>{frame.src='about:blank';});
  dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
  document.querySelector('#fullscreenBtn').addEventListener('click',()=>{try { frame.requestFullscreen?.(); } catch {}});
  document.querySelector('#themeSound').addEventListener('click',e=>{
    sounds = !sounds; const btn = e.currentTarget;
    btn.setAttribute('aria-pressed',String(sounds)); btn.querySelector('span').textContent = `Звуки: ${sounds?'вкл.':'выкл.'}`; beep();
  });
  render();
})();
