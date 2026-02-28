/* ═══════════════════════════════════════════════════════════════════════
   LOWKEY PORTFOLIO — main.js
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── UTILS ────────────────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ═══════════════════════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════════════════════ */
(function initNavbar() {
  const navbar    = $('#navbar');
  const hamburger = $('#hamburger');
  const navLinks  = $('#navLinks');

  /* Scroll shadow */
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile hamburger */
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    navLinks.classList.toggle('is-open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  /* Mobile dropdown toggle (tap on arrow) */
  $$('.has-dropdown .nav-link--dropdown').forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth > 768) return;
      e.preventDefault();
      const li = link.closest('.has-dropdown');
      li.classList.toggle('mobile-open');
    });
  });

  /* Close mobile menu on link click */
  $$('.nav-dropdown a, .nav-link:not(.nav-link--dropdown)').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('is-open');
      $$('.has-dropdown').forEach(el => el.classList.remove('mobile-open'));
    });
  });

  /* Active nav link on scroll */
  const sections = $$('section[id]');
  const navALinks = $$('.nav-link');

  const observerNav = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navALinks.forEach(a => {
        const href = a.getAttribute('href');
        a.classList.toggle('active', href === `#${id}`);
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observerNav.observe(s));
})();

/* ═══════════════════════════════════════════════════════════════════════
   ACCORDION
   ═══════════════════════════════════════════════════════════════════════ */
(function initAccordions() {
  const blocks = $$('.accordion-block');

  blocks.forEach(block => {
    const header = $('.accordion-header', block);
    const body   = $('.accordion-body', block);

    // Initialise state from aria-expanded
    const startOpen = header.getAttribute('aria-expanded') === 'true';
    if (startOpen) {
      block.classList.add('is-open');
      body.style.display = 'block';
    }

    header.addEventListener('click', () => {
      const isOpen = block.classList.toggle('is-open');
      header.setAttribute('aria-expanded', isOpen);

      if (isOpen) {
        // Animate open
        body.style.display = 'block';
        body.style.overflow = 'hidden';
        const targetH = body.scrollHeight;
        body.style.maxHeight = '0px';
        body.style.transition = 'max-height 0.35s ease';
        // Force reflow
        body.offsetHeight; // eslint-disable-line
        body.style.maxHeight = targetH + 'px';
        body.addEventListener('transitionend', () => {
          body.style.maxHeight = '';
          body.style.overflow = '';
        }, { once: true });
      } else {
        // Animate close
        body.style.maxHeight = body.scrollHeight + 'px';
        body.style.overflow = 'hidden';
        body.style.transition = 'max-height 0.3s ease';
        body.offsetHeight; // eslint-disable-line
        body.style.maxHeight = '0px';
        body.addEventListener('transitionend', () => {
          body.style.display = 'none';
          body.style.maxHeight = '';
          body.style.overflow = '';
        }, { once: true });
      }
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════════════
   LIGHTBOX
   ═══════════════════════════════════════════════════════════════════════ */
(function initLightbox() {
  const lightbox  = $('#lightbox');
  const backdrop  = $('#lightboxBackdrop');
  const img       = $('#lightboxImg');
  const btnClose  = $('#lightboxClose');
  const btnPrev   = $('#lightboxPrev');
  const btnNext   = $('#lightboxNext');
  const caption   = $('#lightboxCaption');
  const counter   = $('#lightboxCounter');

  /* Gallery registry: { galleryId: [{ src, alt }] } */
  const galleries = {};
  let currentGallery = null;
  let currentIndex   = 0;

  $$('.gallery-item[data-gallery]').forEach(item => {
    const gid   = item.dataset.gallery;
    const idx   = parseInt(item.dataset.index, 10);
    const image = $('img', item);

    if (!galleries[gid]) galleries[gid] = [];
    galleries[gid][idx] = {
      src: image.src,
      alt: image.alt
    };

    item.addEventListener('click', () => open(gid, idx));
  });

  function open(gid, idx) {
    currentGallery = gid;
    currentIndex   = idx;
    render();
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    btnClose.focus();
  }

  function close() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    img.src = '';
  }

  function render() {
    const items = galleries[currentGallery];
    const item  = items[currentIndex];
    img.src = item.src;
    img.alt = item.alt;
    caption.textContent = item.alt;
    counter.textContent = `${currentIndex + 1} / ${items.length}`;
    btnPrev.style.display = items.length <= 1 ? 'none' : '';
    btnNext.style.display = items.length <= 1 ? 'none' : '';
  }

  function prev() {
    const len = galleries[currentGallery].length;
    currentIndex = (currentIndex - 1 + len) % len;
    render();
  }

  function next() {
    const len = galleries[currentGallery].length;
    currentIndex = (currentIndex + 1) % len;
    render();
  }

  btnClose.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  btnPrev.addEventListener('click', prev);
  btnNext.addEventListener('click', next);

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape')      close();
    if (e.key === 'ArrowLeft')   prev();
    if (e.key === 'ArrowRight')  next();
  });

  /* Touch swipe */
  let touchStartX = null;
  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartX = null;
  }, { passive: true });
})();

/* ═══════════════════════════════════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════════════════════════════════ */
(function initReveal() {
  const targets = $$('.accordion-block, .about-grid, .contact-card, .skills-group');
  targets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      // Stagger siblings slightly
      const delay = (i % 4) * 60;
      setTimeout(() => entry.target.classList.add('revealed'), delay);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
})();

/* ═══════════════════════════════════════════════════════════════════════
   FOOTER YEAR
   ═══════════════════════════════════════════════════════════════════════ */
(function setYear() {
  const el = $('#footerYear');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ═══════════════════════════════════════════════════════════════════════
   SMOOTH SCROLL OFFSET  (account for fixed navbar)
   ═══════════════════════════════════════════════════════════════════════ */
(function initSmoothScroll() {
  const NAV_H = 56;
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAV_H;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════════════
   VIDEO / GIF MEDIA SLOTS  (future-ready)
   ── When you add a <video> or <img> inside .media-slot, this will
      auto-play videos when they enter the viewport and pause when they
      leave, saving resources.
   ═══════════════════════════════════════════════════════════════════════ */
(function initMediaSlots() {
  const videos = $$('.media-slot video');
  if (!videos.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.3 });

  videos.forEach(v => {
    v.muted = true;
    v.loop  = true;
    v.playsInline = true;
    observer.observe(v);
  });
})();
