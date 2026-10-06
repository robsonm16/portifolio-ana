(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const nav = document.getElementById('nav');
  const counter = document.getElementById('counter');
  const progress = document.getElementById('progress');
  const navLinks = [...document.querySelectorAll('.nav__links a')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Título da capa letra a letra ---------- */
  const letters = document.querySelector('.hero__letters');
  if (letters) {
    letters.innerHTML = [...letters.textContent]
      .map((c, i) => `<span class="char" style="--i:${i}" aria-hidden="true">${c}</span>`)
      .join('');
  }

  /* ---------- Revelar elementos ao rolar ---------- */
  // Escalona os elementos irmãos para entrarem em sequência
  document.querySelectorAll('.post-grid, .reels__grid, .process, .stats, .hero__tags, .presence__phones, .presence__fb')
    .forEach(group => {
      [...group.querySelectorAll('.reveal')].forEach((el, i) => el.style.setProperty('--d', `${i * 0.07}s`));
    });

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // A capa aparece sempre ao carregar, sem depender da rolagem
  requestAnimationFrame(() =>
    document.querySelectorAll('.slide--hero .reveal').forEach(el => el.classList.add('is-in')));

  /* ---------- Contadores animados (Meta Ads) ---------- */
  const fmt = new Intl.NumberFormat('pt-BR');
  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count);
      countObserver.unobserve(el);
      if (reduceMotion) { el.textContent = fmt.format(target); return; }
      const start = performance.now();
      const dur = 1600;
      const tick = now => {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt.format(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

  /* ---------- Slide atual: contador e link ativo ---------- */
  const slideObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const slide = entry.target;
      counter.textContent = slide.dataset.index;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${slide.id}`));
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  slides.forEach(s => slideObserver.observe(s));

  /* ---------- Barra de progresso + nav visível após a capa ---------- */
  let ticking = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    nav.classList.toggle('is-visible', scrollY > innerHeight * 0.6);
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Botões de seta e teclado ---------- */
  const currentIndex = () => {
    const mid = scrollY + innerHeight / 2;
    return Math.max(0, slides.findIndex(s => s.offsetTop <= mid && s.offsetTop + s.offsetHeight > mid));
  };
  const goTo = i => slides[Math.max(0, Math.min(slides.length - 1, i))]
    .scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });

  document.querySelectorAll('[data-next]').forEach(btn =>
    btn.addEventListener('click', () => goTo(slides.indexOf(btn.closest('.slide')) + 1)));
  document.querySelectorAll('[data-top]').forEach(btn =>
    btn.addEventListener('click', () => goTo(0)));

  addEventListener('keydown', e => {
    if (!lightbox.hidden || e.target.closest('input, textarea')) return;
    if (e.key === 'PageDown' || (e.key === 'ArrowRight')) { e.preventDefault(); goTo(currentIndex() + 1); }
    if (e.key === 'PageUp' || (e.key === 'ArrowLeft')) { e.preventDefault(); goTo(currentIndex() - 1); }
  });

  /* ---------- Gradiente da capa segue o cursor ---------- */
  const hero = document.querySelector('.slide--hero .blob-field');
  if (hero && !reduceMotion && matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', e => {
      if (scrollY > innerHeight) return;
      const x = (e.clientX / innerWidth - 0.5) * 60;
      const y = (e.clientY / innerHeight - 0.5) * 40;
      hero.style.transform = `translate(${x}px, ${y}px)`;
    });
    hero.style.transition = 'transform 1.2s cubic-bezier(.2,.7,.1,1)';
  }

  /* ---------- Lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lbImg = lightbox.querySelector('.lightbox__img');
  const lbCaption = lightbox.querySelector('.lightbox__caption');
  let group = [];
  let pos = 0;
  let lastFocus = null;

  const show = i => {
    pos = (i + group.length) % group.length;
    const img = group[pos];
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCaption.textContent = group.length > 1 ? `${img.alt}  ·  ${pos + 1}/${group.length}` : img.alt;
  };

  const open = img => {
    // Agrupa as imagens da mesma seção para navegar entre elas
    group = [...img.closest('.slide').querySelectorAll('[data-zoom]')];
    lightbox.querySelectorAll('.lightbox__nav').forEach(b => (b.hidden = group.length < 2));
    show(group.indexOf(img));
    lastFocus = document.activeElement;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lightbox__close').focus();
  };

  const close = () => {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    lbImg.removeAttribute('src');
    lastFocus?.focus();
  };

  document.querySelectorAll('[data-zoom]').forEach(img => {
    img.tabIndex = 0;
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
  });

  lightbox.querySelector('.lightbox__close').addEventListener('click', close);
  lightbox.querySelector('.lightbox__nav--prev').addEventListener('click', () => show(pos - 1));
  lightbox.querySelector('.lightbox__nav--next').addEventListener('click', () => show(pos + 1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });

  addEventListener('keydown', e => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(pos - 1);
    if (e.key === 'ArrowRight') show(pos + 1);
  });

  // Swipe no celular
  let touchX = null;
  lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(pos + (dx < 0 ? 1 : -1));
    touchX = null;
  });
})();
