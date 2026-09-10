/* ============================================================================
   HydroClean — script principal (versão startup)
   ========================================================================== */
'use strict';

const CFG = window.HYDROCLEAN_CONFIG || {};
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const fmtBR = n => Math.round(n).toLocaleString('pt-BR');
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const dom = {
  preloader: $('#preloader'), scrollProgress: $('#scrollProgress'), header: $('#siteHeader'),
  bgCanvas: $('#bgCanvas'), themeToggle: $('#themeToggle'), mobileToggle: $('#mobileToggle'),
  nav: $('#nav'), navLinks: $$('.nav-link'), toast: $('#toast'), backTop: $('#backTop'),
};

/* ------------------------------------------------------------------ Tema --- */
const THEME_KEY = 'hydroclean_theme';
function initTheme(){
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.dataset.theme = saved;
  dom.themeToggle.textContent = saved === 'dark' ? '☀' : '☾';
}
function toggleTheme(){
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  dom.themeToggle.textContent = next === 'dark' ? '☀' : '☾';
  localStorage.setItem(THEME_KEY, next);
  showToast(`Tema ${next === 'dark' ? 'escuro' : 'claro'} aplicado.`);
}
function showToast(msg){
  dom.toast.textContent = msg; dom.toast.classList.add('is-visible');
  clearTimeout(showToast._t); showToast._t = setTimeout(() => dom.toast.classList.remove('is-visible'), 2600);
}

/* ------------------------------------------------------- Scroll / progresso */
function onScroll(){
  const max = document.documentElement.scrollHeight - window.innerHeight;
  dom.scrollProgress.style.width = (max <= 0 ? 0 : (window.scrollY / max) * 100) + '%';
  dom.header.classList.toggle('scrolled', window.scrollY > 8);
  highlightNav();
}
function highlightNav(){
  const pt = window.scrollY + 120;
  dom.navLinks.forEach(link => {
    const sel = link.getAttribute('href');
    if (!sel || !sel.startsWith('#')) return;
    const sec = document.querySelector(sel); if (!sec) return;
    const top = sec.offsetTop, bottom = top + sec.offsetHeight;
    link.classList.toggle('is-active', pt >= top && pt < bottom);
  });
}
function initReveal(){
  const els = $$('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)){ els.forEach(e => e.classList.add('is-visible')); return; }
  const io = new IntersectionObserver((ent, obs) => ent.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('is-visible'); obs.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -60px 0px' });
  els.forEach(e => io.observe(e));
}
function initCounters(){
  const els = $$('[data-counter]');
  if (prefersReduced || !('IntersectionObserver' in window)){ els.forEach(e => e.textContent = fmtBR(+e.dataset.counter)); return; }
  const io = new IntersectionObserver((ent, obs) => ent.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = +el.dataset.counter, t0 = performance.now(), dur = 1400;
    const tick = now => { const p = Math.min(1, (now - t0) / dur);
      el.textContent = fmtBR((1 - Math.pow(1 - p, 3)) * target); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick); obs.unobserve(el);
  }), { threshold: .5 });
  els.forEach(e => io.observe(e));
}

/* ============================================================================
   FUNDO DE MICROALGAS — orgânicas, com filamentos, rotação, profundidade e grupos
   ========================================================================== */
function initBackground(){
  const c = dom.bgCanvas; if (!c || prefersReduced) return;
  const ctx = c.getContext('2d');
  const isMobile = window.innerWidth < 760;
  const cores = navigator.hardwareConcurrency || 4;
  let count = isMobile ? 16 : 30; if (cores <= 2) count = Math.round(count * .6);

  let W, H, dpr, algae = [], raf = null, running = true;
  const GREENS = [[139,195,74],[124,179,66],[85,139,47],[158,205,110]];

  function rnd(a, b){ return a + Math.random() * (b - a); }
  function makeAlga(cluster){
    const depth = Math.random();                 // 0 fundo .. 1 frente
    const base = (isMobile ? 10 : 14) + depth * (isMobile ? 12 : 20);
    const g = GREENS[(Math.random() * GREENS.length) | 0];
    const type = Math.random();                   // define o formato orgânico
    return {
      x: cluster ? cluster.x + rnd(-40, 40) : Math.random() * (W || 1000),
      y: cluster ? cluster.y + rnd(-40, 40) : Math.random() * (H || 800),
      size: base, depth, rgb: g,
      alpha: 0.05 + depth * 0.16,
      angle: Math.random() * Math.PI * 2,
      spin: rnd(-0.0025, 0.0025),
      vx: rnd(-0.08, 0.08) * (0.4 + depth),
      vy: -(0.03 + depth * 0.10),
      drift: Math.random() * Math.PI * 2,
      driftSpeed: rnd(0.002, 0.005),
      shape: type < 0.34 ? 'diatom' : type < 0.67 ? 'filament' : 'colony',
      lobes: (Math.random() * 3 | 0) + 4
    };
  }
  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = c.clientWidth = window.innerWidth; H = c.clientHeight = window.innerHeight;
    c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    algae = [];
    // parte agrupada (colônias) + parte dispersa
    const clusters = Math.max(2, Math.round(count / 8));
    for (let i = 0; i < clusters; i++){
      const cx = { x: Math.random() * W, y: Math.random() * H };
      const n = 3 + (Math.random() * 3 | 0);
      for (let j = 0; j < n; j++) algae.push(makeAlga(cx));
    }
    while (algae.length < count) algae.push(makeAlga(null));
  }

  function drawDiatom(a){ // elipse com estrias internas
    ctx.beginPath(); ctx.ellipse(0, 0, a.size, a.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${a.rgb[0]},${a.rgb[1]},${a.rgb[2]},${a.alpha})`; ctx.fill();
    ctx.strokeStyle = `rgba(${a.rgb[0]-30},${a.rgb[1]-30},${a.rgb[2]-20},${a.alpha*0.9})`;
    ctx.lineWidth = 0.8;
    for (let i = -2; i <= 2; i++){ ctx.beginPath(); ctx.moveTo(i * a.size*0.3, -a.size*0.4); ctx.lineTo(i * a.size*0.3, a.size*0.4); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0,0,a.size,a.size*0.5,0,0,Math.PI*2); ctx.stroke();
  }
  function drawFilament(a){ // corrente de células
    const n = a.lobes; const r = a.size * 0.32;
    for (let i = 0; i < n; i++){
      const px = (i - (n-1)/2) * r * 1.5;
      ctx.beginPath(); ctx.arc(px, Math.sin(i + a.drift) * 2, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${a.rgb[0]},${a.rgb[1]},${a.rgb[2]},${a.alpha})`; ctx.fill();
      ctx.strokeStyle = `rgba(${a.rgb[0]-30},${a.rgb[1]-30},${a.rgb[2]-20},${a.alpha*0.8})`;
      ctx.lineWidth = 0.7; ctx.stroke();
    }
  }
  function drawColony(a){ // núcleo com lóbulos + brilho discreto
    const n = a.lobes;
    for (let i = 0; i < n; i++){
      const ang = (i / n) * Math.PI * 2, d = a.size * 0.5;
      ctx.beginPath(); ctx.arc(Math.cos(ang)*d, Math.sin(ang)*d, a.size*0.34, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${a.rgb[0]},${a.rgb[1]},${a.rgb[2]},${a.alpha})`; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0,0,a.size*0.42,0,Math.PI*2);
    ctx.fillStyle = `rgba(${a.rgb[0]+20},${a.rgb[1]+30},${a.rgb[2]+10},${a.alpha*1.1})`; ctx.fill();
    // brilho verde discreto para as mais próximas
    if (a.depth > 0.7){
      const g = ctx.createRadialGradient(0,0,0,0,0,a.size*1.3);
      g.addColorStop(0, `rgba(139,195,74,${a.alpha*0.5})`); g.addColorStop(1, 'rgba(139,195,74,0)');
      ctx.beginPath(); ctx.arc(0,0,a.size*1.3,0,Math.PI*2); ctx.fillStyle = g; ctx.fill();
    }
  }

  function frame(){
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    // ordena por profundidade (mais distantes primeiro)
    for (const a of algae){
      a.drift += a.driftSpeed;
      a.x += a.vx + Math.sin(a.drift) * 0.12;
      a.y += a.vy; a.angle += a.spin;
      if (a.y < -60){ a.y = H + 60; a.x = Math.random() * W; }
      if (a.x < -60) a.x = W + 60; if (a.x > W + 60) a.x = -60;
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.angle);
      if (a.shape === 'diatom') drawDiatom(a);
      else if (a.shape === 'filament') drawFilament(a);
      else drawColony(a);
      ctx.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  resize();
  window.addEventListener('resize', debounce(resize, 250));
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running){ cancelAnimationFrame(raf); frame(); } });
  frame();
}

/* ============================================================================
   ÁGUA — canvas de ondas (hero + antes/depois)
   ========================================================================== */
function waterCanvas(canvas, opts){
  if (!canvas || prefersReduced) return;
  const ctx = canvas.getContext('2d');
  const o = Object.assign({ colorTop:'#5EC4F5', colorBot:'#0D47A1', particles:12, turbid:false }, opts);
  let W, H, dpr, parts = [], raf, t = 0, running = true;
  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    parts = Array.from({ length: o.particles }, () => ({
      x: Math.random()*W, y: Math.random()*H, r: Math.random()*3+1,
      s: Math.random()*0.4+0.1, a: Math.random()*0.4+0.2
    }));
  }
  function frame(){
    if (!running) return;
    ctx.clearRect(0,0,W,H); t += 0.02;
    const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,o.colorTop); g.addColorStop(1,o.colorBot);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0,H);
    for (let x=0;x<=W;x+=8){ const y = 28 + Math.sin(x*0.02 + t)*7 + Math.sin(x*0.05 + t*1.5)*4; ctx.lineTo(x,y); }
    ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
    // reflexo
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath(); ctx.moveTo(0,H);
    for (let x=0;x<=W;x+=8){ const y = 30 + Math.sin(x*0.02 + t)*7; ctx.lineTo(x,y); ctx.lineTo(x,y+3); }
    ctx.closePath(); ctx.fill();
    // partículas (impurezas se turbid)
    parts.forEach(p => {
      p.y -= p.s; if (p.y < 20) { p.y = H; p.x = Math.random()*W; }
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = o.turbid ? `rgba(120,90,40,${p.a})` : `rgba(255,255,255,${p.a})`; ctx.fill();
    });
    raf = requestAnimationFrame(frame);
  }
  resize(); window.addEventListener('resize', debounce(resize, 250));
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running){ cancelAnimationFrame(raf); frame(); } });
  frame();
}

/* ============================================================================
   MÉTRICAS "AO VIVO" no card do hero (efeito de sistema operando)
   ========================================================================== */
function initLiveMetrics(){
  const flow = $('#dmFlow'), ph = $('#dmPh'); if (!flow || prefersReduced) return;
  setInterval(() => {
    const f = (3.5 + Math.random() * 1.2).toFixed(1).replace('.', ',');
    const p = (6.9 + Math.random() * 0.4).toFixed(1);
    flow.textContent = f + ' L/min'; ph.textContent = p;
  }, 2200);
}

/* ============================================================================
   COMO FUNCIONA — diagrama interativo + fluxo de partículas
   ========================================================================== */
function initDiagram(){
  const flowEl = $('#pipeFlow'), partsEl = $('#pipeParticles'), info = $('#diagramInfo');
  const nodes = $$('.dg-node');
  if (!nodes.length) return;

  // hover / foco mostra a explicação
  nodes.forEach((n, i) => {
    const show = () => {
      nodes.forEach(x => x.classList.remove('active')); n.classList.add('active');
      info.querySelector('.di-step').textContent = `Etapa ${i + 1}`;
      info.querySelector('p').textContent = n.dataset.info;
    };
    n.addEventListener('mouseenter', show);
    n.addEventListener('focus', show);
    n.tabIndex = 0;
  });

  if (prefersReduced){ if (flowEl) flowEl.style.width = '100%'; return; }

  // partículas fluindo no tubo
  const NP = window.innerWidth < 760 ? 6 : 12;
  for (let i = 0; i < NP; i++){ const p = document.createElement('span'); p.className = 'pp'; partsEl.appendChild(p); }
  const pps = $$('.pp', partsEl);

  let started = false;
  const io = new IntersectionObserver(ent => ent.forEach(e => { if (e.isIntersecting && !started){ started = true; run(); } }), { threshold: .3 });
  io.observe($('#como-funciona'));

  function run(){
    const dur = 3600, t0 = performance.now();
    const tick = now => {
      const p = ((now - t0) % dur) / dur;
      flowEl.style.width = (p * 100) + '%';
      pps.forEach((el, i) => {
        const off = (p + i / pps.length) % 1;
        el.style.left = (off * 100) + '%';
        el.style.opacity = off > 0.96 || off < 0.04 ? 0 : 0.9;
      });
      // ilumina o nó correspondente ao progresso, se nenhum estiver em hover
      if (!$('.dg-node:hover')){
        const idx = Math.min(nodes.length - 1, Math.floor(p * nodes.length));
        nodes.forEach((n, i2) => n.classList.toggle('active', i2 === idx));
        info.querySelector('.di-step').textContent = `Etapa ${idx + 1}`;
        info.querySelector('p').textContent = nodes[idx].dataset.info;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

/* ============================================================================
   PRODUTOS — render de cards + tabela comparativa (a partir do config)
   ========================================================================== */
function precoBaseFaixa(base){
  // faixa estimada +25% sobre a base, para exibição nos cards
  return `${CFG.configurador.moeda} ${fmtBR(base)} a ${CFG.configurador.moeda} ${fmtBR(base * 1.35)}`;
}
function initProducts(){
  const grid = $('#productsGrid'), prods = CFG.produtos || [];
  if (!grid) return;
  grid.innerHTML = prods.map((p, i) => `
    <article class="product-card reveal ${i===1?'featured':''}">
      ${p.destaque ? `<span class="pc-badge">${p.destaque}</span>` : ''}
      <div class="pc-visual"><div class="pc-render">
        <div class="panel"></div><div class="sun"></div>
        <div class="tank"><div class="lvl"></div></div>
      </div></div>
      <div class="pc-body">
        <h3>${p.nome}</h3>
        <p class="pc-public">${p.publico}</p>
        <ul class="pc-specs">
          <li><span>Capacidade</span><b>${p.capacidadePadrao}</b></li>
          <li><span>Dimensões</span><b>${p.dimensoes}</b></li>
        </ul>
        <ul class="pc-features">${p.recursos.map(r => `<li>${r}</li>`).join('')}</ul>
        <div class="pc-price"><small>A partir de</small><b>${CFG.configurador.moeda} ${fmtBR(p.base)}</b></div>
        <a href="#orcamento" class="primary-btn small pc-cta" data-model="${p.id}">Solicitar orçamento</a>
      </div>
    </article>`).join('');

  // tabela comparativa
  const table = $('#compareTable');
  if (table){
    const linha = (rot, get) => `<div class="ct-row" style="display:contents"><div class="ct-cell">${rot}</div>${prods.map(p => `<div class="ct-cell">${get(p)}</div>`).join('')}</div>`;
    table.innerHTML = `<div class="ct-grid">
      <div class="ct-head" style="display:contents"><div class="ct-cell">Modelo</div>${prods.map(p=>`<div class="ct-cell">${p.nome.replace('HydroClean ','')}</div>`).join('')}</div>
      ${linha('Público', p => p.publico)}
      ${linha('Capacidade', p => p.capacidadePadrao)}
      ${linha('Dimensões', p => p.dimensoes)}
      ${linha('A partir de', p => `<b>${CFG.configurador.moeda} ${fmtBR(p.base)}</b>`)}
    </div>`;
  }

  // clicar em "Solicitar orçamento" de um produto pré-seleciona no configurador
  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-model]'); if (!btn) return;
    preselectModel(btn.dataset.model);
  });
}
function preselectModel(id){
  const map = CFG.configurador.aplicacao;
  const appKey = Object.keys(map).find(k => map[k].modelo === id);
  if (appKey){ setChip('#cfgApp', appKey); cfgState.app = appKey; renderCfg(); }
}

/* ============================================================================
   CONFIGURADOR DE ORÇAMENTO — lógica de preço coerente + animação
   ========================================================================== */
const C = CFG.configurador || {};
const cfgState = { app: 'residencial', cap: null, energy: 'solar', mon: 'basico', install: 'nao' };
let lastPrice = 0;

function produtoPorId(id){ return (CFG.produtos || []).find(p => p.id === id); }

// Modelo recomendado = o MAIOR tier entre o exigido pela aplicação e pela capacidade.
function modeloRecomendado(capObj){
  const ordem = C.ordemModelos || ['compact','community','pro'];
  const tierApp = ordem.indexOf((C.aplicacao[cfgState.app] || {}).modelo || 'compact');
  const tierCap = ordem.indexOf(capObj.modeloMin || 'compact');
  return ordem[Math.max(tierApp, tierCap)] || 'compact';
}

function calcPreco(){
  const capObj = (C.capacidade || []).find(c => c.valor === cfgState.cap) || C.capacidade[0];
  const modelo = produtoPorId(modeloRecomendado(capObj));
  const energia = C.energia[cfgState.energy], mon = C.monitoramento[cfgState.mon], inst = C.instalacao[cfgState.install];
  const partes = [
    { rot: `Base — ${modelo.nome.replace('HydroClean ','')}`, val: modelo.base },
    { rot: `Capacidade — ${capObj.label}`, val: capObj.custo },
    { rot: `Energia — ${energia.label}`, val: energia.custo },
    { rot: `Monitoramento — ${mon.label}`, val: mon.custo },
    { rot: `Instalação — ${inst.label}`, val: inst.custo }
  ];
  const total = partes.reduce((s, p) => s + p.val, 0);
  return { modelo, capObj, energia, mon, inst, partes, total };
}

function animatePrice(el, to){
  if (prefersReduced){ el.textContent = fmtBR(to); return; }
  const from = lastPrice, t0 = performance.now(), dur = 550;
  el.parentElement.classList.remove('price-bump'); void el.offsetWidth; el.parentElement.classList.add('price-bump');
  const tick = now => { const p = Math.min(1, (now - t0) / dur);
    el.textContent = fmtBR(from + (to - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick); else el.textContent = fmtBR(to); };
  requestAnimationFrame(tick); lastPrice = to;
}

function renderCfg(){
  const r = calcPreco();
  $('#cfgModel').textContent = r.modelo.nome;
  $('#cfgModelDesc').textContent = r.modelo.publico + '.';

  $('#cfgSummary').innerHTML = `
    <div class="cs"><span>Aplicação</span><b>${C.aplicacao[cfgState.app].label}</b></div>
    <div class="cs"><span>Capacidade</span><b>${r.capObj.label}</b></div>
    <div class="cs"><span>Energia</span><b>${r.energia.label}</b></div>
    <div class="cs"><span>Monitoramento</span><b>${r.mon.label}</b></div>
    <div class="cs"><span>Instalação</span><b>${r.inst.label}</b></div>`;

  $('#cfgBreakdown').innerHTML = r.partes
    .filter((p, i) => i === 0 || p.val > 0)
    .map(p => `<div class="bk"><span>${p.rot}</span><span>${p.val ? '+ ' : ''}${C.moeda} ${fmtBR(p.val)}</span></div>`).join('');

  animatePrice($('#cfgPrice'), r.total);
  $('#cfgNote').textContent = C.observacao;
}

function setChip(groupSel, value){
  $$(`${groupSel} button`).forEach(b => b.classList.toggle('is-active', b.dataset.v === value));
}
function initConfigurator(){
  if (!$('#cfgApp')) return;
  // Sem configuração válida, não há como montar o configurador — sai com segurança.
  if (!C.capacidade || !C.capacidade.length){
    console.warn('[HydroClean] configurador não inicializado: configuração de capacidade ausente.');
    return;
  }
  // popular capacidades
  const capWrap = $('#cfgCap');
  capWrap.innerHTML = (C.capacidade || []).map((c, i) =>
    `<button type="button" data-v="${c.valor}" class="${i===0?'is-active':''}">${c.label}</button>`).join('');
  cfgState.cap = C.capacidade[0].valor;
  lastPrice = calcPreco().total;

  const bind = (sel, key, cast = v => v) => {
    const g = $(sel); if (!g) return;
    g.addEventListener('click', e => {
      const btn = e.target.closest('button'); if (!btn) return;
      $$('button', g).forEach(b => b.classList.toggle('is-active', b === btn));
      cfgState[key] = cast(btn.dataset.v); renderCfg();
    });
  };
  bind('#cfgApp', 'app');
  bind('#cfgCap', 'cap', Number);
  bind('#cfgEnergy', 'energy');
  bind('#cfgMon', 'mon');
  bind('#cfgInstall', 'install');

  $('#cfgQuote').addEventListener('click', () => {
    const r = calcPreco();
    showToast(`Configuração ${r.modelo.nome} • ${C.moeda} ${fmtBR(r.total)} adicionada ao contato.`);
    const msg = $('#cMsg');
    if (msg) msg.value = `Tenho interesse no ${r.modelo.nome}.\nConfiguração: ${C.aplicacao[cfgState.app].label}, ${r.capObj.label}, energia ${r.energia.label}, monitoramento ${r.mon.label}, instalação ${r.inst.label}.\nInvestimento estimado: ${C.moeda} ${fmtBR(r.total)}.`;
  });
  renderCfg();
}

/* ============================================================================
   RESULTADOS — gráficos de barras animados (antes/depois)
   ========================================================================== */
function initResults(){
  const grid = $('#resultsGrid'), cfg = CFG.resultados; if (!grid || !cfg) return;
  const note = $('#resultsNote'); if (note && cfg.observacao) note.textContent = cfg.observacao;
  const badge = $('#demoBadge'); if (badge && cfg.rotulo) badge.textContent = cfg.rotulo;

  const maxOf = p => Math.max(Math.abs(p.antes), Math.abs(p.depois), p.alvo || 0) || 1;
  grid.innerHTML = (cfg.parametros || []).map(p => {
    const unid = p.unidade ? ' ' + p.unidade : '';
    let delta = '';
    if (p.melhor === 'menor' && p.antes) delta = `-${Math.round((1 - p.depois / p.antes) * 100)}%`;
    else if (p.melhor === 'maior' && p.antes) delta = `+${Math.round((p.depois / p.antes - 1) * 100)}%`;
    else delta = 'estável';
    return `
    <article class="result-card reveal" data-max="${maxOf(p)}" data-antes="${p.antes}" data-depois="${p.depois}">
      <div class="rc-head"><h3>${p.nome}</h3><span class="rc-delta good">${delta}</span></div>
      <div class="rc-bars">
        <div class="rc-bar-row"><span>Antes</span><div class="rc-track"><div class="rc-fill before"></div></div><b>${p.antes}${unid}</b></div>
        <div class="rc-bar-row"><span>Depois</span><div class="rc-track"><div class="rc-fill after"></div></div><b>${p.depois}${unid}</b></div>
      </div>
    </article>`;
  }).join('');

  // anima as barras ao entrar na viewport
  const cards = $$('.result-card', grid);
  const fill = card => {
    const max = +card.dataset.max, a = +card.dataset.antes, d = +card.dataset.depois;
    card.querySelector('.rc-fill.before').style.width = Math.min(100, (Math.abs(a) / max) * 100) + '%';
    card.querySelector('.rc-fill.after').style.width  = Math.min(100, (Math.abs(d) / max) * 100) + '%';
  };
  if (prefersReduced || !('IntersectionObserver' in window)){ cards.forEach(fill); return; }
  const io = new IntersectionObserver((ent, obs) => ent.forEach(e => {
    if (e.isIntersecting){ setTimeout(() => fill(e.target), 150); obs.unobserve(e.target); }
  }), { threshold: .4 });
  cards.forEach(c => io.observe(c));
}

/* ============================================================================
   IMPACTO — indicadores
   ========================================================================== */
function initImpact(){
  const grid = $('#impactGrid'), items = CFG.impacto; if (!grid || !items) return;
  grid.innerHTML = items.map(it => `
    <article class="impact-card reveal">
      <b><span data-counter="${it.valor}">0</span>${it.sufixo}</b>
      <h4>${it.titulo}</h4><p>${it.texto}</p>
    </article>`).join('');
}

/* ============================================================================
   CONTATOS / FOOTER
   ========================================================================== */
function buildURLs(){
  const c = CFG.contato || {};
  const wa = (c.whatsapp||'').replace(/\D/g,''), tel = (c.telefone||'').replace(/\D/g,''), insta = (c.instagram||'').replace(/^@/,'');
  return {
    whatsapp: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(c.whatsappMensagem||'')}` : '#',
    instagram: insta ? `https://instagram.com/${insta}` : '#',
    email: c.email ? `mailto:${c.email}` : '#',
    telefone: tel ? `tel:+${tel}` : '#',
    handle: insta
  };
}
function initContacts(){
  const c = CFG.contato || {}, u = buildURLs();
  const cl = $('#contactLinks');
  if (cl) cl.innerHTML = `
    <a class="ci" href="${u.whatsapp}" target="_blank" rel="noopener"><span class="ci-icon">💬</span><span class="ci-text"><small>WhatsApp</small><b>Falar com a equipe</b></span></a>
    <a class="ci" href="${u.instagram}" target="_blank" rel="noopener"><span class="ci-icon">📸</span><span class="ci-text"><small>Instagram</small><b>@${u.handle||'perfil'}</b></span></a>
    <a class="ci" href="${u.email}"><span class="ci-icon">✉️</span><span class="ci-text"><small>E-mail</small><b>${c.email||'e-mail'}</b></span></a>
    <a class="ci" href="${u.telefone}"><span class="ci-icon">📞</span><span class="ci-text"><small>Telefone</small><b>${c.telefoneLabel||'ligar'}</b></span></a>`;
  const fs = $('#footerSocial');
  if (fs) fs.innerHTML = `
    <li><a href="${u.instagram}" target="_blank" rel="noopener">Instagram</a></li>
    <li><a href="${u.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></li>
    <li><a href="${u.email}">E-mail</a></li>`;
}

/* ============================================================================
   FORMULÁRIO — confirmação visual (modal) e envio opcional
   ========================================================================== */
function initForm(){
  const f = $('#contactForm'); if (!f) return;
  const fb = $('#cFeedback'), modo = (CFG.formulario && CFG.formulario.modo) || 'demo';

  f.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#cName').value.trim(), email = $('#cEmail').value.trim(), msg = $('#cMsg').value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    $$('.invalid', f).forEach(el => el.classList.remove('invalid'));
    let err = null;
    if (name.length < 3){ err = 'Por favor, informe um nome válido.'; $('#cName').classList.add('invalid'); }
    else if (!re.test(email)){ err = 'Por favor, informe um e-mail válido.'; $('#cEmail').classList.add('invalid'); }
    else if (msg.length < 10){ err = 'Escreva uma mensagem um pouco mais detalhada.'; $('#cMsg').classList.add('invalid'); }
    if (err){ fb.textContent = err; fb.classList.add('error'); return; }
    fb.classList.remove('error'); fb.textContent = '';

    const corpo = `Nome: ${name}\nE-mail: ${email}\nInteresse: ${$('#cInterest').value}\nTelefone: ${$('#cPhone').value||'-'}\n\n${msg}`;
    if (modo === 'whatsapp'){
      const wa = (CFG.contato.whatsapp||'').replace(/\D/g,'');
      if (wa){ window.open(`https://wa.me/${wa}?text=${encodeURIComponent('[HydroClean]\n'+corpo)}`, '_blank', 'noopener'); }
    } else if (modo === 'email'){
      window.location.href = `mailto:${CFG.contato.email||''}?subject=${encodeURIComponent('[HydroClean] '+$('#cInterest').value)}&body=${encodeURIComponent(corpo)}`;
    }
    openModal(); f.reset();
  });
}
function openModal(){ const m = $('#successModal'); m.classList.add('open'); m.setAttribute('aria-hidden','false'); }
function closeModal(){ const m = $('#successModal'); m.classList.remove('open'); m.setAttribute('aria-hidden','true'); }

/* ----------------------------------------------------------------- Eventos - */
function initEvents(){
  dom.themeToggle.addEventListener('click', toggleTheme);
  dom.mobileToggle.addEventListener('click', () => {
    const open = dom.nav.classList.toggle('is-open'); dom.mobileToggle.setAttribute('aria-expanded', String(open));
  });
  dom.navLinks.forEach(l => l.addEventListener('click', () => {
    if (window.innerWidth <= 860){ dom.nav.classList.remove('is-open'); dom.mobileToggle.setAttribute('aria-expanded','false'); }
  }));
  dom.backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', debounce(() => {
    if (window.innerWidth > 860){ dom.nav.classList.remove('is-open'); dom.mobileToggle.setAttribute('aria-expanded','false'); }
  }, 200));
  const sm = $('#successModal');
  $('#smClose').addEventListener('click', closeModal);
  sm.addEventListener('click', e => { if (e.target === sm) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

/* -------------------------------------------------------------- Inicializa - */
// Esconde a tela de carregamento. Chamado por várias vias (failsafe).
function hidePreloader(){
  if (dom.preloader) dom.preloader.classList.add('hidden');
}
// Executa uma etapa com isolamento: se uma falhar, as outras continuam.
function safe(label, fn){
  try { fn(); }
  catch (err){ console.error(`[HydroClean] Falha em ${label}:`, err); }
}

function init(){
  // Aviso claro se a configuração não carregou (não impede o site de abrir).
  if (!window.HYDROCLEAN_CONFIG){
    console.error('[HydroClean] config.js não foi carregado. Verifique se o arquivo está na mesma pasta do index.html.');
  }
  safe('tema', initTheme);
  safe('eventos', initEvents);
  safe('contatos', initContacts);
  safe('produtos', initProducts);
  safe('configurador', initConfigurator);
  safe('resultados', initResults);
  safe('impacto', initImpact);
  safe('formulário', initForm);
  safe('reveal', initReveal);
  safe('contadores', initCounters);
  safe('fundo', initBackground);
  safe('água (hero)',  () => waterCanvas($('#heroWater'),  { colorTop:'#8fd4f7', colorBot:'#0D47A1', particles:16 }));
  safe('água (bruta)', () => waterCanvas($('#dirtyWater'), { colorTop:'#9ab27a', colorBot:'#4b5d32', particles:26, turbid:true }));
  safe('água (limpa)', () => waterCanvas($('#cleanWater'), { colorTop:'#8fd4f7', colorBot:'#1565C0', particles:10 }));
  safe('métricas', initLiveMetrics);
  safe('diagrama', initDiagram);
  safe('scroll', onScroll);
  setTimeout(hidePreloader, 600);
}

// Dispara o init assim que o DOM estiver pronto (cobrindo o caso de já estar pronto).
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
// Failsafe 1: ao terminar de carregar tudo, garante que a tela suma.
window.addEventListener('load', hidePreloader);
// Failsafe 2: trava de segurança absoluta — some em no máximo 2,5s aconteça o que acontecer.
setTimeout(hidePreloader, 2500);
