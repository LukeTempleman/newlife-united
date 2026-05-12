/* ─── Newlife United · CRM Integration Layer ─────────────────────── *
 *                                                                      *
 *  This file is the single integration point between the website and   *
 *  your CRM (e.g. Planning Center, Salesforce, HubSpot, Mailchimp,     *
 *  custom API, etc.).                                                   *
 *                                                                       *
 *  HOW TO WIRE UP A CRM:                                                *
 *  1. Replace each stub method below with your CRM's API call.          *
 *  2. Add any authentication headers / API keys in a .env file on       *
 *     Cloudflare Pages (Settings → Environment Variables).              *
 *  3. For server-side operations (webhooks, secure API keys), create a  *
 *     Cloudflare Worker and call it from here instead of the CRM        *
 *     directly — keeps secrets off the browser.                         *
 *                                                                       *
 *  DATA ATTRIBUTES ON ELEMENTS:                                         *
 *  Each person photo carries:                                           *
 *    data-crm-member-id   — unique identifier (fill in your CRM IDs)   *
 *    data-crm-member-name — display name                                *
 *    data-crm-member-role — role / title                                *
 *                                                                       *
 *  Each small group card carries:                                       *
 *    data-crm-group-id    — unique group identifier                     *
 *    data-crm-group-name  — group name                                  *
 *    data-crm-group-day   — meeting day                                 *
 *    data-crm-group-type  — group type (Mixed / Women / Men / etc.)     *
 *                                                                       *
 *  Each form carries:                                                   *
 *    data-crm-form        — form type identifier                        *
 *      visit-plan         → plan-a-visit form                           *
 *      prayer             → prayer request                              *
 *      contact            → general contact                             *
 *      next-steps-signup  → Growth Track signup                         *
 *      youth-connect      → youth ministry interest                     *
 *      kids-connect       → kids ministry interest                      *
 *      small-group-join   → small group join request                    *
 *      legacy-team        → legacy team inquiry                         *
 * ─────────────────────────────────────────────────────────────────── */

window.CRM = (function () {
  'use strict';

  /* ── CONFIG ──────────────────────────────────────────────────── */
  const CONFIG = {
    // Replace with your Cloudflare Worker or CRM webhook URL:
    webhookUrl: null, // e.g. 'https://newlife-worker.workers.dev/submit'
    debug: true,      // set false in production
  };

  function log(label, data) {
    if (CONFIG.debug) console.log('[CRM]', label, data);
  }

  /* ── Core dispatcher ─────────────────────────────────────────── */
  async function post(endpoint, payload) {
    log('post', { endpoint, payload });
    if (!CONFIG.webhookUrl) {
      log('⚠ No webhookUrl configured — data captured locally only');
      return;
    }
    try {
      const res = await fetch(CONFIG.webhookUrl + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) console.error('[CRM] HTTP error', res.status);
    } catch (err) {
      console.error('[CRM] Network error', err);
    }
  }

  /* ── Public API ──────────────────────────────────────────────── */
  return {
    /**
     * Generic form submission handler.
     * Called automatically by site.js for any form with data-crm-form.
     * @param {string} type - the data-crm-form value
     * @param {Object} data - key/value pairs from the form
     */
    submit: function (type, data) {
      log('submit', { type, data });
      post('/form', { type, data, timestamp: new Date().toISOString() });
    },

    /**
     * Dedicated: Plan-a-Visit form
     * Triggered by the visit.html plan form.
     */
    planVisit: function (data) {
      log('planVisit', data);
      post('/visit', { ...data, source: 'website-visit-form', timestamp: new Date().toISOString() });
    },

    /**
     * Dedicated: Prayer request
     * Triggered by connect.html / contact.html prayer forms.
     */
    submitPrayer: function (data) {
      log('submitPrayer', data);
      post('/prayer', { ...data, source: 'website-prayer-form', timestamp: new Date().toISOString() });
    },

    /**
     * Dedicated: General contact message
     */
    contact: function (data) {
      log('contact', data);
      post('/contact', { ...data, source: 'website-contact-form', timestamp: new Date().toISOString() });
    },

    /**
     * Dedicated: Online giving
     * NOTE: For real payments use a payment processor (PayFast, Peach Payments,
     * Stripe) — this hook fires AFTER the payment processor redirects back.
     * @param {Object} data - { fund, amount, freq }
     */
    give: function (data) {
      log('give', data);
      post('/give', { ...data, source: 'website-give-flow', timestamp: new Date().toISOString() });
    },

    /**
     * Track when a visitor clicks to join a specific small group.
     * @param {string} groupId - the data-crm-group-id value
     * @param {string} groupName - display name
     */
    joinGroup: function (groupId, groupName) {
      log('joinGroup', { groupId, groupName });
      post('/group-interest', { groupId, groupName, source: 'website-group-finder', timestamp: new Date().toISOString() });
    },

    /**
     * Track leader / team member profile views (for CRM analytics).
     * Called automatically when a member card with data-crm-member-id is visible.
     * @param {string} memberId
     * @param {string} memberName
     */
    trackMember: function (memberId, memberName) {
      log('trackMember', { memberId, memberName });
      // Analytics only — no backend call by default. Add if needed.
    },

    /**
     * Called on page load — use to identify returning visitors if you
     * have a session token in localStorage (e.g. after a previous form).
     */
    identify: function () {
      const id = localStorage.getItem('nlu_visitor_id');
      if (id) log('identify', { id });
    },

    /**
     * Fetch events from the D1 database and render them.
     * Call this on pages that display events (events.html, watch.html, youth.html, etc.)
     * @param {string} containerSelector - the container element where events will be rendered
     * @param {string} page - optional: filter events by page name (default: 'events')
     * @param {number} limit - optional: limit number of events (default: 50)
     */
    loadEvents: async function (containerSelector, page = null, limit = 50) {
      try {
        log('loadEvents', { containerSelector, page, limit });
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        
        const data = await response.json();
        let events = data.data || [];

        // Filter by page if specified
        if (page) {
          events = events.filter(e => e.page === page);
        }

        // Limit results
        events = events.slice(0, limit);

        // Sort by date
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        const container = document.querySelector(containerSelector);
        if (!container) {
          console.error('[CRM] Container not found:', containerSelector);
          return;
        }

        // Render events
        container.innerHTML = events.map(event => {
          const eventDate = new Date(event.date);
          const dayOfWeek = eventDate.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
          const day = String(eventDate.getDate()).padStart(2, '0');
          const month = eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();

          const tag = this._getEventTag(event);
          const tagStyle = tag === 'WEEKLY' 
            ? 'border:1px solid rgba(255,255,255,.4);' 
            : tag === 'SPECIAL' 
            ? 'border:1px solid #D4847A;color:#D4847A;'
            : 'border:1px solid var(--accent);color:var(--accent);';

          return \`
            <a href="#" data-crm-event-id="\${event.id}" style="display:grid;grid-template-columns:auto 2fr 1fr 1fr 140px auto;gap:28px;padding:28px 8px;border-top:1px solid rgba(255,255,255,.1);border-bottom:1px solid rgba(255,255,255,.1);align-items:center;color:var(--paper);text-decoration:none">
              <div style="display:flex;align-items:baseline;gap:8px;min-width:130px">
                <span style="font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;color:rgba(255,255,255,.5)">\${dayOfWeek}</span>
                <span style="font-family:var(--font-sans);font-size:52px;font-weight:500;letter-spacing:-.04em;line-height:1;color:var(--accent)">\${day}</span>
                <span style="font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;color:rgba(255,255,255,.5)">\${month}</span>
              </div>
              <div style="font-family:var(--font-sans);font-size:24px;font-weight:500;letter-spacing:-.015em">\${event.title}</div>
              <div style="font-family:var(--font-mono);font-size:12px;color:rgba(255,255,255,.7);letter-spacing:.1em">\${event.time}</div>
              <div style="font-size:13px;color:rgba(255,255,255,.55)">\${event.location || 'TBD'}</div>
              <span style="padding:4px 10px;\${tagStyle}font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;">\${tag}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          \`;
        }).join('');

        log('loadEvents complete', { count: events.length });
      } catch (err) {
        console.error('[CRM] loadEvents error:', err);
      }
    },

    /**
     * Helper: determine event tag based on frequency or type
     * @private
     */
    _getEventTag: function (event) {
      if (event.title && event.title.toLowerCase().includes('weekly')) return 'WEEKLY';
      if (event.title && event.title.toLowerCase().includes('sunday')) return 'WEEKLY';
      if (event.title && event.title.toLowerCase().includes('conference')) return 'CONFERENCE';
      if (event.title && event.title.toLowerCase().includes('special')) return 'SPECIAL';
      return 'WEEKLY'; // Default
    },
  };
})();

// Auto-identify on load
document.addEventListener('DOMContentLoaded', function () {
  window.CRM && window.CRM.identify();

  // Wire up "Join" buttons on group cards
  document.querySelectorAll('[data-crm-group-id]').forEach(function (el) {
    const joinBtn = el.querySelector('[data-crm-join]');
    if (joinBtn) {
      joinBtn.addEventListener('click', function () {
        window.CRM.joinGroup(el.dataset.crmGroupId, el.dataset.crmGroupName);
      });
    }
  });

  // Track member views (IntersectionObserver for above-the-fold members)
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (el.dataset.crmMemberId) window.CRM.trackMember(el.dataset.crmMemberId, el.dataset.crmMemberName || '');
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-crm-member-id]').forEach(function (el) { observer.observe(el); });
  }
});
