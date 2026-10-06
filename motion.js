(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const header = document.querySelector('.header');
  const art = document.querySelector('.hero-art');
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);

  // Content stays visible without JavaScript or IntersectionObserver.
  const revealSelectors = [
    '.section-heading > *', '.step', '.launch-note', '.host-intro > *',
    '.benefits article', '.venue-tabs', '.venue-panel', '.network-inner > div',
    '.faq-intro > *', '.faq-list details', '.contact-copy > *', '.request-form',
    '.footer-top > *', '.footer-wordmark', '.footer-bottom'
  ];
  const revealElements = Array.from(document.querySelectorAll(revealSelectors.join(',')));
  let observer;
  const reveal = element => element.classList.add('is-visible');
  if ('IntersectionObserver' in window) {
    revealElements.forEach(element => {
      element.dataset.reveal = '';
      const siblings = Array.from(element.parentElement.children).filter(item => revealElements.includes(item));
      element.style.setProperty('--reveal-delay', Math.min(siblings.indexOf(element) * 65, 195) + 'ms');
    });
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { reveal(entry.target); observer.unobserve(entry.target); }
      });
    }, {threshold: 0, rootMargin: '0px 0px -35px 0px'});
  }

  let frame = 0;
  function renderScroll() {
    frame = 0;
    const scroll = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (total > 0 ? Math.min(1, Math.max(0, scroll / total)) : 0) + ')';
    header.classList.toggle('is-scrolled', scroll > 24);
    if (reducedMotion.matches) return;
    const bounds = art.getBoundingClientRect();
    if (bounds.bottom > 0 && bounds.top < window.innerHeight && finePointer.matches) {
      const depth = Math.max(-1, Math.min(1, scroll / 600));
      art.style.setProperty('--product-y', (-depth * 8).toFixed(2) + 'px');
      art.style.setProperty('--sticker-y', (-depth * 17).toFixed(2) + 'px');
      art.style.setProperty('--sticker-rotation', (depth * -7).toFixed(2) + 'deg');
    }
  }
  function requestScrollFrame() { if (!frame) frame = requestAnimationFrame(renderScroll); }
  window.addEventListener('scroll', requestScrollFrame, {passive:true});

  function resetArt() {
    ['--tilt-x','--tilt-y','--glow-opacity','--product-y','--sticker-y','--sticker-rotation'].forEach(property => art.style.removeProperty(property));
  }
  let pointerFrame = 0;
  let pointerX = .5;
  let pointerY = .5;
  art.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
    const bounds = art.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width;
    pointerY = (event.clientY - bounds.top) / bounds.height;
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      if (reducedMotion.matches || !finePointer.matches || document.hidden) return;
      art.style.setProperty('--tilt-x', ((.5 - pointerY) * 5).toFixed(2) + 'deg');
      art.style.setProperty('--tilt-y', ((pointerX - .5) * 6).toFixed(2) + 'deg');
      art.style.setProperty('--glow-x', (pointerX * 100).toFixed(1) + '%');
      art.style.setProperty('--glow-y', (pointerY * 100).toFixed(1) + '%');
      art.style.setProperty('--glow-opacity', '.8');
    });
  });
  art.addEventListener('pointerleave', () => { cancelAnimationFrame(pointerFrame); pointerFrame = 0; resetArt(); });

  document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
      const bounds = button.getBoundingClientRect();
      const x = Math.max(-4, Math.min(4, (event.clientX - bounds.left - bounds.width / 2) * .035));
      const y = Math.max(-3, Math.min(3, (event.clientY - bounds.top - bounds.height / 2) * .07));
      button.style.setProperty('--magnetic-x', x.toFixed(2) + 'px');
      button.style.setProperty('--magnetic-y', y.toFixed(2) + 'px');
    });
    button.addEventListener('pointerleave', () => { button.style.removeProperty('--magnetic-x'); button.style.removeProperty('--magnetic-y'); });
  });

  // The selected pill also follows wrapped tabs on smaller screens.
  const tabs = document.querySelector('.venue-tabs');
  const indicator = document.createElement('span');
  indicator.className = 'venue-tab-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  tabs.prepend(indicator);
  tabs.classList.add('has-indicator');
  function positionIndicator() {
    const selected = tabs.querySelector('[aria-selected="true"]');
    if (!selected) return;
    indicator.style.setProperty('--tab-x', selected.offsetLeft + 'px');
    indicator.style.setProperty('--tab-y', selected.offsetTop + 'px');
    indicator.style.setProperty('--tab-width', selected.offsetWidth + 'px');
    indicator.style.setProperty('--tab-height', selected.offsetHeight + 'px');
  }
  const panelAnimations = new Set();
  document.addEventListener('henk:venue-change', () => {
    positionIndicator();
    panelAnimations.forEach(animation => animation.cancel());
    panelAnimations.clear();
    if (reducedMotion.matches) return;
    document.querySelectorAll('.venue-editorial > *, .venue-copy > *').forEach((element,index) => {
      const animation = element.animate([{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}], {duration:460,delay:(index % 4)*35,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
      panelAnimations.add(animation);
      animation.onfinish = () => panelAnimations.delete(animation);
    });
  });
  if ('ResizeObserver' in window) new ResizeObserver(positionIndicator).observe(tabs);
  window.addEventListener('resize', () => { positionIndicator(); requestScrollFrame(); }, {passive:true});
  if (document.fonts) document.fonts.ready.then(positionIndicator);

  // Keyboard and anchor navigation never land on hidden content.
  document.addEventListener('focusin', event => {
    const target = event.target.closest('[data-reveal]');
    if (target) { target.style.setProperty('--reveal-delay','0ms'); reveal(target); }
  });
  function syncMotionPreference() {
    observer?.disconnect();
    root.classList.toggle('motion-ready', !reducedMotion.matches);
    if (reducedMotion.matches) {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      revealElements.forEach(reveal);
      resetArt();
      panelAnimations.forEach(animation => animation.cancel());
      panelAnimations.clear();
      document.querySelectorAll('.button').forEach(button => { button.style.removeProperty('--magnetic-x'); button.style.removeProperty('--magnetic-y'); });
    } else if (observer) {
      revealElements.filter(element => !element.classList.contains('is-visible')).forEach(element => observer.observe(element));
    }
    renderScroll();
  }
  reducedMotion.addEventListener('change', syncMotionPreference);
  finePointer.addEventListener('change', () => { resetArt(); requestScrollFrame(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetArt(); else requestScrollFrame(); });
  positionIndicator();
  syncMotionPreference();
})();
