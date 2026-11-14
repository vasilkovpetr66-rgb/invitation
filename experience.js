(() => {
  const opening = document.getElementById('opening');
  const openButton = document.getElementById('open-invitation');
  const main = document.querySelector('main');
  const audio = document.getElementById('wedding-music');
  const musicButton = document.getElementById('music-control');
  const notice = document.getElementById('music-notice');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let opened = false;
  let wantsMusic = false;
  let fadeFrame = 0;
  let noticeTimer;

  function announce(text) {
    clearTimeout(noticeTimer);
    notice.textContent = text;
    if (text) noticeTimer = setTimeout(() => { notice.textContent = ''; }, 6500);
  }
  function updateMusic() {
    const playing = !audio.paused && !audio.ended;
    musicButton.setAttribute('aria-pressed', String(playing));
    musicButton.setAttribute('aria-label', playing ? 'Выключить музыку' : 'Включить музыку');
    musicButton.title = playing ? 'Выключить музыку' : 'Включить музыку';
  }
  async function startMusic() {
    wantsMusic = true;
    cancelAnimationFrame(fadeFrame);
    audio.volume = 0;
    try {
      // Called directly by a visitor's click, including on mobile browsers.
      await audio.play();
      if (!wantsMusic) { audio.pause(); return; }
      announce('');
      const started = performance.now();
      const fade = now => {
        if (!wantsMusic || audio.paused) return;
        const progress = Math.min(1, (now - started) / 2200);
        audio.volume = progress * .65;
        if (progress < 1) fadeFrame = requestAnimationFrame(fade);
      };
      fadeFrame = requestAnimationFrame(fade);
    } catch {
      wantsMusic = false;
      announce('Музыка не запустилась. Попробуйте нажать кнопку с нотами.');
    }
    updateMusic();
  }
  function stopMusic() {
    wantsMusic = false;
    cancelAnimationFrame(fadeFrame);
    audio.pause();
    updateMusic();
  }
  function animateContent() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    document.querySelectorAll('.welcome .narrow, .envelope, .program h2, .event, .dress h2, .dress > p, .palette, .location h2, .location p, .location a, .rsvp .narrow, .footer > p, .chat-links, .footer h2, .countdown').forEach((element, i) => {
      element.classList.add('reveal');
      element.style.setProperty('--reveal-delay', `${(i % 3) * 80}ms`);
      observer.observe(element);
    });
    document.body.classList.add('motion-ready');
  }
  function finishOpening() {
    opening.hidden = true;
    main.inert = false;
    document.body.classList.remove('invitation-closed');
    document.body.classList.add('invitation-open');
    document.getElementById('title').focus({ preventScroll: true });
    animateContent();
  }
  function openInvitation(withMusic = true) {
    if (opened) return;
    opened = true;
    opening.classList.add('is-opening');
    openButton.disabled = true;
    musicButton.hidden = false;
    if (withMusic) startMusic();
    // A timeout also completes opening if transitionend does not fire.
    setTimeout(finishOpening, reducedMotion.matches ? 0 : 3700);
  }
  musicButton.addEventListener('click', () => {
    if (wantsMusic || !audio.paused) stopMusic();
    else startMusic();
  });
  ['play', 'pause', 'ended'].forEach(event => audio.addEventListener(event, updateMusic));
  audio.addEventListener('error', () => {
    if (opened) announce('Не удалось загрузить музыку. Остальные разделы сайта доступны.');
    stopMusic();
  });
  openButton.addEventListener('click', () => openInvitation(true));
  opening.addEventListener('keydown', event => {
    if (event.key === 'Escape') openInvitation(false);
    if (event.key === 'Tab') { event.preventDefault(); openButton.focus(); }
  });
  // Progressive enhancement: without JavaScript the invitation stays readable.
  main.inert = true;
  opening.hidden = false;
  document.body.classList.add('invitation-closed');
  window.scrollTo(0, 0);
  openButton.focus({ preventScroll: true });
})();
