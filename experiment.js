(() => {
  'use strict';
  const config = window.HenkExperimentConfig;
  const informal = window.HenkInformalCopy || {};
  const formal = Object.fromEntries(Object.entries(informal).map(([u, je]) => [je, u]));
  const key = 'henk:aanspreekvorm:v1';
  const preview = new URLSearchParams(location.search).get('variant');
  const isPreview = preview === 'je' || preview === 'u';
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(key)); } catch {}
  if (saved?.expires <= Date.now()) { saved = null; try { localStorage.removeItem(key); } catch {} }
  let variant = isPreview ? preview : saved?.choice === 'yes' ? saved.variant : 'u';
  let tracking = false, joining = false, flushing = false, queue = [], timer, consentEpoch = 0;
  const pageId = crypto.randomUUID();
  let sessionId = pageId;
  const once = new Set();
  try {
    const visit = JSON.parse(sessionStorage.getItem(key));
    if (visit && Date.now() - visit.time < 30 * 60 * 1000) sessionId = visit.id;
    sessionStorage.setItem(key, JSON.stringify({ id: sessionId, time: Date.now() }));
  } catch {}

  function text(value) { return variant === 'je' ? (informal[value] || value) : (formal[value] || value); }
  function update(root) {
    if (!root || root.nodeType !== 1 || root.closest('script,style,[data-variant-ignore]')) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('script,style,[data-variant-ignore]')) continue;
      const next = text(node.nodeValue);
      if (node.nodeValue !== next) node.nodeValue = next;
    }
    [root, ...root.querySelectorAll('[aria-label],[placeholder],meta[content]')].forEach(element => {
      if (element.closest('[data-variant-ignore]')) return;
      ['aria-label', 'placeholder', 'content'].forEach(attribute => {
        const value = element.getAttribute(attribute);
        if (value !== null && text(value) !== value) element.setAttribute(attribute, text(value));
      });
    });
    document.documentElement.dataset.copyVariant = variant;
  }
  window.HenkCopy = { text, get variant() { return variant; } };
  const observer = new MutationObserver(records => {
    const roots = new Set();
    records.forEach(record => {
      if (record.type === 'characterData') roots.add(record.target.parentElement);
      else record.addedNodes.forEach(node => roots.add(node.nodeType === 1 ? node : node.parentElement));
    });
    roots.forEach(update);
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });

  function save(value) { saved = value; try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function record(type, context = '') {
    if (!tracking || isPreview || local) return;
    const milestone = `${type}:${context}`;
    if (type !== 'page_view' && once.has(milestone)) return;
    once.add(milestone);
    queue.push({ id: crypto.randomUUID(), session: sessionId, page: pageId, type, context });
    queue = queue.slice(-60);
    clearTimeout(timer); timer = setTimeout(flush, 500);
  }
  async function flush() {
    if (!tracking || flushing || !queue.length || !saved?.token) return;
    flushing = true;
    const batch = queue.slice(0, 12), epoch = consentEpoch;
    try {
      const response = await fetch(config.endpoint + '/api/events', {
        method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: saved.token, events: batch })
      });
      if (response.ok && epoch === consentEpoch) queue.splice(0, batch.length);
      if (response.status === 401 && epoch === consentEpoch) {
        tracking = false; queue = []; save({ choice: 'no', expires: Date.now() + 30 * 86400000 });
      }
    } catch { /* The website and form continue to work if measurement is unavailable. */ }
    finally { flushing = false; if (tracking && queue.length) { clearTimeout(timer); timer = setTimeout(flush, 5000); } }
  }
  async function join() {
    if (!config?.enabled || isPreview || local) {
      const status = document.querySelector('#measurement-status');
      if (status) status.textContent = isPreview || local ? 'Dit is een voorbeeldversie. Deze bezoeken tellen niet mee in de statistieken.' : 'De meting is nog niet geactiveerd. Er worden nu geen bezoekersgegevens verzameld.';
      return;
    }
    if (joining) return;
    joining = true;
    const epoch = consentEpoch;
    const status = document.querySelector('#measurement-status');
    try {
      if (!saved?.token || saved.expires <= Date.now()) {
        const response = await fetch(config.endpoint + '/api/enroll', {
          method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ experiment: config.experiment, consent: true, device: innerWidth < 768 ? 'mobile' : innerWidth < 1024 ? 'tablet' : 'desktop' })
        });
        if (!response.ok) throw new Error('measurement unavailable');
        const assignment = await response.json();
        if (epoch !== consentEpoch) return;
        save({ choice: 'yes', token: assignment.token, variant: assignment.variant, expires: assignment.expires * 1000 });
      }
      if (epoch !== consentEpoch) return;
      variant = saved.variant; update(document.documentElement); tracking = true;
      record('page_view');
      document.querySelector('#measurement-choice').hidden = true;
    } catch {
      if (status) status.textContent = 'Meten is tijdelijk niet beschikbaar. De website blijft gewoon werken; er worden nu geen gegevens gemeten.';
    } finally { joining = false; }
  }
  function stop() {
    const token = saved?.token;
    consentEpoch++; tracking = false; queue = []; once.clear(); clearTimeout(timer);
    save({ choice: 'no', expires: Date.now() + 30 * 86400000 });
    variant = isPreview ? preview : 'u'; update(document.documentElement);
    document.querySelector('#measurement-choice').hidden = true;
    if (token && !isPreview && !local) fetch(config.endpoint + '/api/forget', {
      method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token })
    }).catch(() => {});
  }
  document.addEventListener('DOMContentLoaded', () => {
    update(document.documentElement);
    const choice = document.querySelector('#measurement-choice');
    document.querySelector('#measurement-yes').addEventListener('click', () => { if (tracking) { choice.hidden = true; return; } consentEpoch++; if (saved?.choice !== 'yes') saved = null; join(); });
    document.querySelector('#measurement-no').addEventListener('click', stop);
    document.querySelector('#measurement-open').addEventListener('click', () => {
      choice.hidden = false;
      document.querySelector('#measurement-no').textContent = tracking ? 'Toestemming intrekken' : 'Niet meten';
      document.querySelector('#measurement-status').textContent = tracking ? 'Meting staat aan. Intrekken stopt de meting en vraagt verwijdering van de bijbehorende meetgegevens.' : '';
      document.querySelector('#measurement-yes').focus();
    });
    document.querySelector('#measurement-privacy').addEventListener('click', () => document.querySelector('#privacy-dialog').showModal());
    choice.hidden = isPreview || local || !!saved || !config?.enabled;
    if (saved?.choice === 'yes') join();
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href="#aanvraag"]');
      if (!link) return;
      const context = link.closest('.header') ? 'header' : link.closest('.hero') ? 'hero' : link.closest('.host-section') ? 'partner' : link.closest('.venue-panel') ? 'venue' : link.closest('.network-section') ? 'network' : link.closest('.faq-section') ? 'faq' : 'footer';
      record('cta_click', context);
    });
    document.querySelector('#request-form').addEventListener('input', () => record('form_start'));
    document.addEventListener('henk:request-ready', () => { record('form_start'); record('request_ready'); });
    document.addEventListener('henk:request-copy', () => record('request_copy'));
    document.addEventListener('henk:request-download', () => record('request_download'));
    document.addEventListener('henk:venue-change', event => record('venue_view', event.detail.venue));
    document.querySelectorAll('#vragen details').forEach(item => item.addEventListener('toggle', () => { if (item.open) record('faq_open'); }));
    let scrollQueued = false;
    addEventListener('scroll', () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        const height = document.documentElement.scrollHeight;
        if (height <= innerHeight) return;
        const depth = Math.min(100, Math.round((scrollY + innerHeight) / height * 100));
        [25, 50, 75, 100].forEach(mark => { if (depth >= mark) record('scroll', String(mark)); });
      });
    }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
    addEventListener('pagehide', flush);
  });
})();
