const cover = document.querySelector('#cover');
const invite = document.querySelector('#invite');
const openButton = document.querySelector('#openInvite');
const music = document.querySelector('#bgMusic');
const musicToggle = document.querySelector('#musicToggle');
const presentation = document.querySelector('#presentation');
const slides = [...document.querySelectorAll('.presentation-slide')];
const dots = [...document.querySelectorAll('#slideDots i')];
const slideCounter = document.querySelector('#slideCounter');
const slideProgress = document.querySelector('#slideProgress');
const enterInvite = document.querySelector('#enterInvite');
const skipPresentation = document.querySelector('#skipPresentation');
let presentationTimer;
let currentSlide = 0;

openButton.addEventListener('click', () => {
  openButton.classList.add('opened');
  document.querySelector('.envelope-flap').style.transform = 'rotateX(180deg)';
  document.querySelector('.silver-rings').classList.add('opening');
  cover.classList.add('leaving');

  // O clique no envelope é uma ação do convidado e libera o áudio no celular.
  startMusic();

  setTimeout(() => {
    // Retira toda a camada do envelope antes de exibir o primeiro slide.
    // Isso evita que uma stacking context do cover cubra a apresentação.
    cover.style.display = 'none';
    presentation.classList.add('visible');
    presentation.setAttribute('aria-hidden', 'false');
    runPresentation();
  }, 1500);
});

enterInvite.addEventListener('click', finishPresentation);
skipPresentation.addEventListener('click', finishPresentation);

musicToggle.addEventListener('click', () => {
  if (music.paused) {
    startMusic();
  } else {
    music.pause();
  }
});

music.addEventListener('play', () => setMusicState(true));
music.addEventListener('pause', () => setMusicState(false));

function startMusic() {
  music.play().catch(() => setMusicState(false));
}

function setMusicState(isPlaying) {
  musicToggle.classList.toggle('is-playing', isPlaying);
  musicToggle.setAttribute('aria-label', isPlaying ? 'Pausar Ordinary' : 'Tocar Ordinary');
  musicToggle.setAttribute('aria-pressed', isPlaying.toString());
}

function runPresentation() {
  currentSlide = 0;
  showSlide(0);
  presentationTimer = setInterval(() => {
    if (currentSlide >= slides.length - 1) {
      clearInterval(presentationTimer);
      return;
    }
    showSlide(currentSlide + 1);
  }, 6500);
}

function showSlide(index) {
  currentSlide = index;
  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === index;
    slide.classList.remove('active', 'is-entering');
    if (isActive) {
      // Reinicia a entrada para que cada slide tenha uma animação própria.
      void slide.offsetWidth;
      slide.classList.add('active', 'is-entering');
    }
  });
  dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
  slideCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  slideProgress.style.width = `${((index + 1) / slides.length) * 100}%`;
}

function finishPresentation() {
  clearInterval(presentationTimer);
  presentation.classList.remove('visible');
  presentation.setAttribute('aria-hidden', 'true');
  cover.style.display = 'none';
  invite.classList.add('visible');
  invite.setAttribute('aria-hidden', 'false');
  musicToggle.classList.add('is-visible');
  window.scrollTo(0, 0);
  startCountdown();
  revealSections();
}

function startCountdown() {
  const target = new Date('2026-12-19T19:30:00-03:00').getTime();
  const units = {
    days: document.querySelector('[data-unit="days"]'),
    hours: document.querySelector('[data-unit="hours"]'),
    minutes: document.querySelector('[data-unit="minutes"]'),
    seconds: document.querySelector('[data-unit="seconds"]'),
  };

  const update = () => {
    const distance = Math.max(0, target - Date.now());
    units.days.textContent = Math.floor(distance / 86400000).toString().padStart(2, '0');
    units.hours.textContent = Math.floor((distance / 3600000) % 24).toString().padStart(2, '0');
    units.minutes.textContent = Math.floor((distance / 60000) % 60).toString().padStart(2, '0');
    units.seconds.textContent = Math.floor((distance / 1000) % 60).toString().padStart(2, '0');
  };

  update();
  setInterval(update, 1000);
}

function revealSections() {
  const sections = document.querySelectorAll('.reveal-on-scroll');
  if (!('IntersectionObserver' in window)) {
    sections.forEach((section) => section.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  sections.forEach((section) => observer.observe(section));
}
