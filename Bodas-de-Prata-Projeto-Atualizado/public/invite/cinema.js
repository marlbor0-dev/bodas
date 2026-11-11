(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const experience = $('#experience');
  const cover = $('#cover');
  const cinema = $('#cinema');
  const invite = $('#invite');
  const openButton = $('#openInvite');
  const music = $('#bgMusic');
  const musicButton = $('#musicToggle');
  const musicStatus = $('#musicStatus');
  const pauseButton = $('#pauseStory');
  const scenes = [...document.querySelectorAll('.scene')];
  const progressButtons = [...document.querySelectorAll('#sceneProgress button')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Set();
  let phase = 'cover';
  let currentScene = 0;
  let storyTimer;
  let sceneStarted = 0;
  let remaining = 0;
  let userPaused = false;
  let hiddenPaused = document.hidden;
  let observer;
  let countdownTimer;
  let particles;
  let ringStage;

  document.documentElement.classList.add('js-ready');
  invite.inert = true;
  const schedule = (fn, delay) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, delay);
    timers.add(id);
    return id;
  };
  const cancelScheduled = () => {
    timers.forEach(clearTimeout);
    timers.clear();
    clearTimeout(storyTimer);
  };

  // Audio is requested synchronously in the guest's click, including on iOS.
  const startMusic = () => {
    musicButton.hidden = false;
    const playRequest = music.play();
    if (playRequest) playRequest.catch(() => {
      updateMusic();
      $('#experienceStatus').textContent = 'Toque no botão de música para ouvir Ordinary.';
    });
  };
  const updateMusic = () => {
    const playing = !music.paused && !music.ended;
    musicButton.classList.toggle('is-playing', playing);
    musicButton.setAttribute('aria-pressed', String(playing));
    musicButton.setAttribute('aria-label', (playing ? 'Pausar' : 'Tocar') + ' Ordinary, de Alex Warren');
    musicStatus.textContent = playing ? 'Pausar' : 'Tocar';
  };
  music.addEventListener('play', updateMusic);
  music.addEventListener('pause', updateMusic);
  music.addEventListener('ended', updateMusic);
  music.addEventListener('error', () => {
    updateMusic();
    $('#experienceStatus').textContent = 'A música não carregou. O convite continua disponível.';
  });
  musicButton.addEventListener('click', () => music.paused ? startMusic() : music.pause());
  music.volume = 0.7;

  function openEnvelope() {
    if (phase !== 'cover') return;
    phase = 'opening';
    openButton.disabled = true;
    startMusic();
    experience.classList.add('is-opening');
    particles?.burst();
    const delay = reducedMotion.matches ? 350 : 5400;
    schedule(() => {
      if (phase !== 'opening') return;
      cinema.hidden = false;
      cinema.inert = false;
      phase = 'film';
      showScene(0);
      cover.classList.add('is-leaving');
      cover.inert = true;
      pauseButton.focus({ preventScroll: true });
      $('#experienceStatus').textContent = 'Apresentação iniciada. Você pode pausar ou pular para o convite.';
      schedule(() => { cover.hidden = true; }, reducedMotion.matches ? 50 : 1150);
    }, delay);
  }

  function scheduleScene() {
    clearTimeout(storyTimer);
    if (phase !== 'film' || userPaused || hiddenPaused) return;
    sceneStarted = performance.now();
    storyTimer = setTimeout(() => {
      if (currentScene < scenes.length - 1) showScene(currentScene + 1);
      else finishPresentation();
    }, remaining);
  }

  function showScene(index) {
    if (phase !== 'film') return;
    clearTimeout(storyTimer);
    currentScene = Math.max(0, Math.min(index, scenes.length - 1));
    remaining = Number(scenes[currentScene].dataset.duration);
    experience.dataset.tone = currentScene === 0 ? 'paper' : 'forest';
    document.body.classList.toggle('is-paper-opening',currentScene === 0);
    if (currentScene === 0) ringStage?.play(0,userPaused || hiddenPaused,reducedMotion.matches);
    else ringStage?.stop();
    scenes.forEach((scene, i) => {
      scene.classList.toggle('is-active', i === currentScene);
      scene.setAttribute('aria-hidden', String(i !== currentScene));
      scene.inert = i !== currentScene;
    });
    progressButtons.forEach((button, i) => {
      button.classList.remove('is-current', 'is-complete');
      button.removeAttribute('aria-current');
      if (i < currentScene) button.classList.add('is-complete');
      if (i === currentScene) {
        button.style.setProperty('--scene-time', remaining + 'ms');
        void button.offsetWidth;
        button.classList.add('is-current');
        button.setAttribute('aria-current', 'step');
      }
    });
    $('#sceneCounter').textContent = String(currentScene + 1).padStart(2, '0') + ' / ' + String(scenes.length).padStart(2, '0');
    cinema.classList.toggle('is-paused', userPaused || hiddenPaused);
    scheduleScene();
  }

  function changePauseState(nextUserPaused, nextHiddenPaused) {
    const wasPaused = userPaused || hiddenPaused;
    const willPause = nextUserPaused || nextHiddenPaused;
    if (phase === 'film' && !wasPaused && willPause) {
      clearTimeout(storyTimer);
      remaining = Math.max(0, remaining - (performance.now() - sceneStarted));
    }
    userPaused = nextUserPaused;
    hiddenPaused = nextHiddenPaused;
    cinema.classList.toggle('is-paused', willPause);
    ringStage?.pause(willPause);
    pauseButton.setAttribute('aria-pressed', String(userPaused));
    pauseButton.setAttribute('aria-label', userPaused ? 'Continuar apresentação' : 'Pausar apresentação');
    pauseButton.firstElementChild.textContent = userPaused ? '▷' : 'Ⅱ';
    if (phase === 'film' && wasPaused && !willPause) scheduleScene();
  }

  function revealContent() {
    const elements = [...document.querySelectorAll('.reveal')];
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('in-view'));
      return;
    }
    if (observer) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    elements.forEach(el => observer.observe(el));
  }

  function finishPresentation() {
    if (phase === 'site' || phase === 'finishing') return;
    cancelScheduled();
    phase = 'finishing';
    ringStage?.stop();
    invite.hidden = false;
    invite.inert = false;
    cover.inert = true;
    cinema.inert = true;
    document.body.classList.remove('is-intro','is-paper-opening');
    musicButton.hidden = false;
    experience.classList.add('is-finishing');
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('#mainTitle').focus({ preventScroll: true });
    revealContent();
    updateCountdown();
    if (!countdownTimer) countdownTimer = setInterval(updateCountdown, 1000);
    schedule(() => {
      experience.hidden = true;
      phase = 'site';
      particles?.stop();
      $('#experienceStatus').textContent = 'Convite aberto. Data: 19 de dezembro de 2026, às 19:30h. Oliveira Eventos, Goiânia.';
    }, reducedMotion.matches ? 160 : 1150);
  }

  function replay() {
    cancelScheduled();
    phase = 'cover';
    ringStage?.stop();
    experience.dataset.tone = 'paper';
    currentScene = 0;
    userPaused = false;
    hiddenPaused = document.hidden;
    invite.hidden = true;
    invite.inert = true;
    experience.hidden = false;
    experience.classList.remove('is-opening', 'is-finishing');
    cover.hidden = false;
    cover.inert = false;
    cover.classList.remove('is-leaving');
    cinema.hidden = true;
    cinema.inert = true;
    cinema.classList.remove('is-paused');
    scenes.forEach(scene => { scene.classList.remove('is-active'); scene.inert = true; });
    openButton.disabled = false;
    pauseButton.setAttribute('aria-pressed', 'false');
    pauseButton.setAttribute('aria-label', 'Pausar apresentação');
    pauseButton.firstElementChild.textContent = 'Ⅱ';
    document.body.classList.add('is-intro','is-paper-opening');
    window.scrollTo({ top: 0, behavior: 'instant' });
    particles?.start();
    openButton.focus({ preventScroll: true });
    $('#experienceStatus').textContent = 'Envelope pronto para abrir novamente.';
  }

  function updateCountdown() {
    const distance = Math.max(0, new Date('2026-12-19T19:30:00-03:00').getTime() - Date.now());
    const values = {
      days: Math.floor(distance / 86400000),
      hours: Math.floor(distance / 3600000) % 24,
      minutes: Math.floor(distance / 60000) % 60,
      seconds: Math.floor(distance / 1000) % 60
    };
    Object.entries(values).forEach(([key, value]) => {
      $('[data-unit="' + key + '"]').textContent = String(value).padStart(2, '0');
    });
    if (distance === 0) $('#countdownLabel').textContent = 'Chegou o dia de celebrar o amor.';
  }

  openButton.addEventListener('click', openEnvelope);
  $('#skipCover').addEventListener('click', () => { startMusic(); finishPresentation(); });
  $('#skipPresentation').addEventListener('click', finishPresentation);
  $('#enterInvite').addEventListener('click', finishPresentation);
  $('#replayIntro').addEventListener('click', replay);
  pauseButton.addEventListener('click', () => changePauseState(!userPaused, hiddenPaused));
  progressButtons.forEach((button, index) => button.addEventListener('click', () => showScene(index)));
  document.addEventListener('visibilitychange', () => {
    changePauseState(userPaused, document.hidden);
    if (document.hidden) particles?.stop();
    else if (phase !== 'site') particles?.start();
  });
  document.addEventListener('keydown', event => {
    if (phase !== 'film') return;
    if (event.key === 'Escape') { event.preventDefault(); finishPresentation(); }
  });
  window.addEventListener('pagehide', () => { particles?.stop(); ringStage?.stop(); music.pause(); });
  // No session flag: every guest can experience the opening, and replay is always available.
  scenes.forEach(scene => { scene.inert = true; });
  updateCountdown();

  // Optional graphics never gate the envelope, audio, or the rest of the invitation.
  import('./ceremony-3d.js').then(({createRingStage}) => {
    ringStage = createRingStage($('#ringStage'), {
      onReady: () => $('.scene-rings').classList.add('has-3d'),
      onUnavailable: () => $('.scene-rings').classList.remove('has-3d'),
    });
    if (phase === 'film' && currentScene === 0) {
      const elapsed = Number(scenes[0].dataset.duration) - remaining + (userPaused || hiddenPaused ? 0 : performance.now()-sceneStarted);
      ringStage.play(elapsed,userPaused || hiddenPaused,reducedMotion.matches);
    }
  }).catch(() => { /* The existing silver-ring artwork remains as a graceful fallback. */ });

  function createAtmosphere() {
    const canvas = $('#stardust');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    let width = 0, height = 0, frame = 0, lastFrame = 0, running = false;
    let dots = [], bursts = [];
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = Array.from({ length: width < 600 ? 32 : 64 }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        r: Math.random() * 1.35 + .35, speed: Math.random() * .24 + .12,
        phase: Math.random() * Math.PI * 2
      }));
    };
    const draw = (now) => {
      if (!running) return;
      frame = requestAnimationFrame(draw);
      if (now - lastFrame < 32) return;
      const dt = Math.min((now - lastFrame) / 33, 2);
      lastFrame = now;
      ctx.clearRect(0, 0, width, height);
      dots.forEach(dot => {
        dot.y -= dot.speed * dt;
        dot.x += Math.sin(now / 4800 + dot.phase) * .1 * dt;
        if (dot.y < -5) dot.y = height + 5;
        const alpha = .18 + (Math.sin(now / 1400 + dot.phase) + 1) * .21;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(214,234,205,' + alpha + ')';
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      });
      bursts = bursts.filter(dot => dot.life > 0);
      bursts.forEach(dot => {
        dot.x += dot.vx * dt; dot.y += dot.vy * dt;
        dot.vx *= .985; dot.vy -= .008 * dt; dot.life -= .008 * dt;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(232,246,219,' + Math.max(0, dot.life * .7) + ')';
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    const stop = () => { running = false; cancelAnimationFrame(frame); };
    const start = () => {
      if (running || reducedMotion.matches || document.hidden) return;
      running = true; lastFrame = performance.now(); frame = requestAnimationFrame(draw);
    };
    window.addEventListener('resize', resize, { passive:true });
    reducedMotion.addEventListener('change', () => reducedMotion.matches ? stop() : phase !== 'site' && start());
    resize(); start();
    return {
      start, stop,
      burst() {
        if (reducedMotion.matches) return;
        const rect = openButton.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height * .67;
        bursts = Array.from({ length: width < 600 ? 45 : 80 }, () => {
          const angle = Math.random() * Math.PI * 2;
          const speed = .7 + Math.random() * 2.5;
          return { x, y, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, r:.4+Math.random()*1.6, life:.5+Math.random()*.5 };
        });
      }
    };
  }
  // Decoration must never be able to block the invitation itself.
  try { particles = createAtmosphere(); } catch { /* Static backdrop remains available. */ }
})();
