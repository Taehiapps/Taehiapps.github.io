document.querySelectorAll('[data-nav-dropdown]').forEach((dropdown) => {
  const trigger = dropdown.querySelector('.site-nav-trigger');
  if (!trigger) return;

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const willOpen = !dropdown.classList.contains('is-open');
    closeNavDropdowns();
    if (willOpen) {
      dropdown.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
});

function closeNavDropdowns() {
  document.querySelectorAll('[data-nav-dropdown].is-open').forEach((dropdown) => {
    dropdown.classList.remove('is-open');
    const trigger = dropdown.querySelector('.site-nav-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

document.addEventListener('click', closeNavDropdowns);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeNavDropdowns();
});

const overlayHeader = document.querySelector('.site-header--overlay');
const heroBackdrop = document.querySelector('.home-intro-backdrop-image, .hero-backdrop-image');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (overlayHeader) {
  const updateHeader = () => {
    overlayHeader.classList.toggle('is-scrolled', window.scrollY > 48);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

if (heroBackdrop && !prefersReducedMotion) {
  const onScroll = () => {
    const offset = Math.min(window.scrollY * 0.28, 120);
    heroBackdrop.style.transform = `scale(1.08) translateY(${offset}px)`;
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

const revealElements = document.querySelectorAll('[data-reveal]');

if (revealElements.length > 0 && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
    if (element.getBoundingClientRect().top < window.innerHeight * 0.92) {
      element.classList.add('is-visible');
    }
  });
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}
