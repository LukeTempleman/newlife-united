/* ─── Newlife United · Shared JS ─────────────────────────────────── */
(function () {
  'use strict';

  // ── Nav data ────────────────────────────────────────────────────
  const NAV = [
    { slug: 'about',   label: 'About',       href: 'about.html' },
    { slug: 'watch',   label: 'Watch',        href: 'watch.html' },
    {
      slug: 'involved', label: 'Get Involved', href: 'connect.html',
      children: [
        { slug: 'connect',    label: 'Connect',             href: 'connect.html',      desc: 'Find your place. Get plugged in.' },
        { slug: 'next-steps', label: 'Your Next Step',      href: 'next-steps.html',   desc: 'Growth Track — a four-step journey.' },
        { slug: 'bible',      label: 'Bible School & Care', href: 'bible-school.html', desc: 'Equipping & care ministries.' },
        { slug: 'kids',       label: 'Kids For Christ',     href: 'kids.html',         desc: 'Babies through Seniors.' },
        { slug: 'youth',      label: 'Youth United',        href: 'youth.html',        desc: 'High school ministry — Fridays.' },
        { slug: 'groups',     label: 'Small Groups',        href: 'small-groups.html', desc: 'Mondays at 18:00 across the city.' },
        { slug: 'dream-teams',label: 'Dream Teams',         href: 'dream-teams.html',  desc: 'Areas to serve and make a difference.' },
      ],
    },
    { slug: 'legacy',  label: 'Legacy Team', href: 'legacy.html' },
    { slug: 'give',    label: 'Generosity',  href: 'give.html' },
    { slug: 'events',  label: 'Events',      href: 'events.html' },
    { slug: 'contact', label: 'Contact',     href: 'contact.html' },
  ];

  const FOOTER_COLS = [
    { heading: 'Visit',       links: [['Sundays', 'visit.html'], ['Plan your visit', 'visit.html'], ['What to expect', 'visit.html'], ['Contact', 'contact.html']] },
    { heading: 'Get Involved',links: [['Connect', 'connect.html'], ['Next Steps', 'next-steps.html'], ['Small Groups', 'small-groups.html'], ['Dream Teams', 'dream-teams.html'], ['Bible School', 'bible-school.html']] },
    { heading: 'Family',      links: [['Kids For Christ', 'kids.html'], ['Youth United', 'youth.html'], ['Legacy Team', 'legacy.html'], ['Events', 'events.html']] },
    { heading: 'Generosity',  links: [['Tithes & Offerings', 'give.html'], ['Building Fund', 'give.html'], ['Apostolic Fund', 'give.html'], ['Bible School Fund', 'give.html']] },
  ];

  // ── Arrow SVG ───────────────────────────────────────────────────
  function arrow(size) {
    size = size || 14;
    return `<svg class="arrow-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
  }

  // ── Inject Nav ──────────────────────────────────────────────────
  function buildNav(page) {
    const inDropdown = ['connect','next-steps','bible','kids','youth','groups','dream-teams'];
    const isInvolved = inDropdown.includes(page);

    const links = NAV.map(function (n) {
      if (n.children) {
        const dropItems = n.children.map(function (c) {
          const active = c.slug === page ? 'active' : '';
          return `<a href="${c.href}" class="nav-dropdown-item ${active}" data-crm-nav="${c.slug}">
            <span class="nav-dropdown-item-label">${c.label}</span>
            <span class="nav-dropdown-item-desc">${c.desc}</span>
          </a>`;
        }).join('');
        const parentActive = isInvolved ? 'active' : '';
        return `<li class="nav-dropdown">
          <a href="${n.href}" class="${parentActive}" data-crm-nav="involved">
            <span class="nav-link-label">${n.label}</span>
            <svg class="nav-dropdown-chevron" width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l4 4 4-4"/></svg>
          </a>
          <div class="nav-dropdown-menu">${dropItems}</div>
        </li>`;
      }
      const active = n.slug === page ? 'active' : '';
      return `<li><a href="${n.href}" class="${active}" data-crm-nav="${n.slug}"><span class="nav-link-label">${n.label}</span></a></li>`;
    }).join('');

    // Mobile links
    const mobileLinks = NAV.map(function (n) {
      if (n.children) {
        const sub = n.children.map(function (c) {
          const active = c.slug === page ? 'active' : '';
          return `<a href="${c.href}" class="${active}">${c.label}</a>`;
        }).join('');
        return `<a href="${n.href}" ${isInvolved ? 'class="active"' : ''}>${n.label}</a>
          <div class="nav-mobile-sub">${sub}</div>`;
      }
      const active = n.slug === page ? 'active' : '';
      return `<a href="${n.href}" class="${active}">${n.label}</a>`;
    }).join('');

    const navEl = document.getElementById('site-nav');
    if (!navEl) return;
    navEl.innerHTML = `
      <div class="nav-inner">
        <a href="index.html" class="nav-logo" aria-label="Newlife United Home">
          <img src="assets/logo.png" alt="Newlife United" data-slot="site-logo" data-crm-asset="logo">
        </a>
        <ul class="nav-links">${links}</ul>
        <div class="nav-cta">
          <span class="nav-service-time">SUN · 09:00</span>
          <a href="visit.html" class="btn ghost sm" style="border-color:var(--paper);color:var(--paper)">
            Plan a visit ${arrow(12)}
          </a>
          <button class="nav-hamburger" aria-label="Open menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div class="nav-mobile" id="nav-mobile" aria-hidden="true">
        <a href="index.html" ${page === 'index' ? 'class="active"' : ''}>Home</a>
        ${mobileLinks}
        <a href="visit.html" class="btn accent-bg" style="margin-top:16px;justify-content:center">Plan a visit ${arrow(12)}</a>
      </div>`;

    // Keep --nav-h synced to the real bar height so the mobile menu
    // sits flush under it — no gap, no overlap, no cut-off.
    function syncNavHeight() {
      document.documentElement.style.setProperty('--nav-h', navEl.offsetHeight + 'px');
    }
    syncNavHeight();
    window.addEventListener('resize', syncNavHeight);

    // Hamburger toggle
    const btn = navEl.querySelector('.nav-hamburger');
    const mob = document.getElementById('nav-mobile');
    if (btn && mob) {
      btn.addEventListener('click', function () {
        syncNavHeight();
        const open = mob.classList.toggle('open');
        btn.setAttribute('aria-expanded', open);
        mob.setAttribute('aria-hidden', !open);
        document.body.style.overflow = open ? 'hidden' : '';
      });
    }
  }

  // ── Inject Footer ────────────────────────────────────────────────
  function buildFooter() {
    const cols = FOOTER_COLS.map(function (col) {
      const links = col.links.map(function (l) {
        return `<li><a href="${l[1]}">${l[0]}</a></li>`;
      }).join('');
      return `<div class="footer-col">
        <div class="footer-col-label">${col.heading}</div>
        <ul>${links}</ul>
      </div>`;
    }).join('');

    const el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML = `
      <div class="footer-inner">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="footer-brand-logo"><img src="assets/logo.png" alt="Newlife United" data-slot="site-logo" data-crm-asset="logo"></div>
            <div class="footer-tagline">A house of prayer for all nations.</div>
            <div class="footer-address">
              129, 12th Avenue, Edenvale, 1609<br>
              Gauteng, South Africa<br>
              <a href="mailto:info@newlifeunited.co.za" style="color:inherit">info@newlifeunited.co.za</a><br>
              WhatsApp <a href="https://wa.me/27780002965" style="color:inherit">078 000 2965</a>
            </div>
            <div class="footer-socials">
              <a href="#" class="footer-social" aria-label="Facebook" data-crm-social="facebook">f</a>
              <a href="#" class="footer-social" aria-label="Instagram" data-crm-social="instagram">ig</a>
              <a href="#" class="footer-social" aria-label="YouTube" data-crm-social="youtube">yt</a>
              <a href="#" class="footer-social" aria-label="Spotify" data-crm-social="spotify">s</a>
            </div>
          </div>
          ${cols}
        </div>
        <div class="footer-bottom">
          <span>© 2026 Newlife United Church · Edenvale, Gauteng</span>
          <span>To know Jesus and to make Him known.</span>
        </div>
      </div>`;
  }

  // ── FAQ accordion ────────────────────────────────────────────────
  function initFAQs() {
    document.querySelectorAll('.faq-item').forEach(function (item) {
      const btn = item.querySelector('.faq-btn');
      if (!btn) return;
      btn.addEventListener('click', function () {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
        if (!isOpen) item.classList.add('open');
      });
    });
    // Open first by default
    const first = document.querySelector('.faq-item');
    if (first) first.classList.add('open');
  }

  // ── Give flow ────────────────────────────────────────────────────
  function initGive() {
    const form = document.getElementById('give-form');
    if (!form) return;

    let fund = 'Tithes & Offerings';
    let amount = 500;
    let freq = 'Once';

    const fundBtns  = form.querySelectorAll('.pill[data-fund]');
    const amtBtns   = form.querySelectorAll('.amount-pill');
    const customAmt = form.querySelector('#custom-amount');
    const freqBtns  = form.querySelectorAll('.freq-btn');
    const submitBtn = form.querySelector('#give-submit');
    const label     = form.querySelector('#give-label');

    function updateLabel() {
      if (label) {
        const rep = freq !== 'Once' ? ' ' + freq.toLowerCase() : '';
        label.textContent = `Give R${amount.toLocaleString('en-ZA')}${rep}`;
      }
      if (submitBtn) submitBtn.setAttribute('data-crm-give-amount', amount);
    }

    fundBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        fund = b.dataset.fund;
        fundBtns.forEach(function (x) { x.classList.toggle('active', x === b); });
        if (submitBtn) submitBtn.setAttribute('data-crm-give-fund', fund);
      });
    });

    amtBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        amount = parseInt(b.dataset.amt, 10);
        amtBtns.forEach(function (x) { x.classList.toggle('active', x === b); });
        if (customAmt) customAmt.value = amount;
        updateLabel();
      });
    });

    if (customAmt) {
      customAmt.addEventListener('input', function () {
        amount = parseInt(customAmt.value, 10) || 0;
        amtBtns.forEach(function (x) { x.classList.remove('active'); });
        updateLabel();
      });
    }

    freqBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        freq = b.dataset.freq;
        freqBtns.forEach(function (x) { x.classList.toggle('active', x === b); });
        if (submitBtn) submitBtn.setAttribute('data-crm-give-frequency', freq);
        updateLabel();
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      window.CRM && window.CRM.give({ fund, amount, freq });
      const box = document.getElementById('give-box');
      if (box) {
        box.innerHTML = `<div class="form-success">
          <div class="form-success-headline">Thank you.</div>
          <p>Your gift has been received. We are grateful. Expect to hear from God this week.</p>
        </div>`;
      }
    });

    updateLabel();
  }

  // ── Group filter ─────────────────────────────────────────────────
  function initGroupFilter() {
    const filterBtns = document.querySelectorAll('[data-filter]');
    const groupRows  = document.querySelectorAll('[data-group]');
    if (!filterBtns.length) return;

    function applyFilters() {
      const active = {};
      filterBtns.forEach(function (b) {
        if (b.classList.contains('active')) active[b.dataset.filter] = b.dataset.val;
      });
      groupRows.forEach(function (r) {
        let show = true;
        Object.keys(active).forEach(function (k) {
          if (active[k] !== 'Any' && r.dataset[k] && r.dataset[k] !== active[k]) show = false;
        });
        r.classList.toggle('hidden', !show);
      });
    }

    filterBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        const group = b.dataset.filter;
        document.querySelectorAll(`[data-filter="${group}"]`).forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        applyFilters();
      });
    });
  }

  // ── Countdown timer ──────────────────────────────────────────────
  function initCountdown() {
    const el = document.getElementById('countdown');
    if (!el) return;
    const target = new Date('2026-06-19T19:00:00+02:00');

    function tick() {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) { el.textContent = 'Starting now!'; return; }
      const d = Math.floor(diff / 864e5);
      const h = Math.floor((diff % 864e5) / 36e5);
      const m = Math.floor((diff % 36e5) / 6e4);
      const s = Math.floor((diff % 6e4) / 1e3);
      const cells = el.querySelectorAll('.countdown-num');
      if (cells[0]) cells[0].textContent = String(d).padStart(2, '0');
      if (cells[1]) cells[1].textContent = String(h).padStart(2, '0');
      if (cells[2]) cells[2].textContent = String(m).padStart(2, '0');
      if (cells[3]) cells[3].textContent = String(s).padStart(2, '0');
    }
    tick(); setInterval(tick, 1000);
  }

  // ── Generic form submissions ─────────────────────────────────────
  // Every <form data-crm-form="X"> gets wired up: serialise the fields,
  // await the POST to /api/forms (via window.CRM.submit), then show the
  // thank-you UI only if the request actually landed. If it fails we
  // re-enable the button and tell the user, so submissions never look
  // like they worked when they didn't.
  function initForms() {
    document.querySelectorAll('[data-crm-form]').forEach(function (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const type = form.dataset.crmForm;
        const data = {};
        new FormData(form).forEach(function (v, k) { data[k] = v; });

        const submitBtn = form.querySelector('button[type="submit"], button:not([type])');
        const originalLabel = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Sending…';
        }

        let ok = false;
        try {
          if (window.CRM && typeof window.CRM.submit === 'function') {
            ok = await window.CRM.submit(type, data);
          }
        } catch (err) {
          console.error('[form] submit failed', err);
          ok = false;
        }

        if (!ok) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalLabel || 'Try again';
          }
          let errEl = form.querySelector('.form-error');
          if (!errEl) {
            errEl = document.createElement('div');
            errEl.className = 'form-error';
            errEl.style.cssText = 'margin-top:14px;padding:12px 16px;border:1px solid #e74c3c;color:#e74c3c;font-size:14px;background:rgba(231,76,60,.08)';
            form.appendChild(errEl);
          }
          errEl.textContent = "Couldn't send right now. Please try again, or call us on 078 000 2965.";
          return;
        }

        const success = form.nextElementSibling;
        if (success && success.classList.contains('form-success')) {
          form.style.display = 'none';
          success.style.display = 'flex';
        } else {
          const msg = document.createElement('div');
          msg.className = 'form-success';
          msg.innerHTML = '<div class="form-success-headline">Thank you.</div><p>Your message has been received. We\'ll be in touch soon.</p>';
          form.replaceWith(msg);
        }
      });
    });
  }

  // ── Init ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    const page = document.body.dataset.page || 'index';
    buildNav(page);
    buildFooter();
    initFAQs();
    initGive();
    initGroupFilter();
    initCountdown();
    initForms();
    if (typeof window.applySlots === 'function') window.applySlots();
  });

})();
