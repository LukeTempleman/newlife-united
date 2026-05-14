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
    debug: false,
  };

  function log(label, data) {
    if (CONFIG.debug) console.log('[CRM]', label, data);
  }

  /* ── Core dispatcher ─────────────────────────────────────────── */
  // Every form on the site funnels through here. type → form_type column;
  // payload → data_json column on form_submissions in D1.
  async function submitForm(type, data) {
    log('submit', { type, data });
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_type: type, data: data }),
      });
      if (!res.ok) console.error('[CRM] HTTP error', res.status);
      return res.ok;
    } catch (err) {
      console.error('[CRM] Network error', err);
      return false;
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
      return submitForm(type, data);
    },

    planVisit: function (data) {
      return submitForm('visit-plan', data);
    },

    submitPrayer: function (data) {
      return submitForm('prayer', data);
    },

    contact: function (data) {
      return submitForm('contact', data);
    },

    joinGroup: function (groupId, groupName) {
      return submitForm('group-interest', { group_id: groupId, group_name: groupName });
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
