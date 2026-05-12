// Fetch image slot overrides from the CRM and swap matching <img data-slot>
// src values. Slots without an override keep the HTML default. Safe to load
// after DOMContentLoaded — it's idempotent and works on dynamically added imgs
// if you call applySlots() again.
(function () {
  let slotMap = null;

  function applyOverrides() {
    if (!slotMap) return;
    document.querySelectorAll('img[data-slot]').forEach((img) => {
      const slot = img.getAttribute('data-slot');
      const override = slotMap[slot];
      if (override && img.getAttribute('src') !== override) {
        img.setAttribute('src', override);
      }
    });
  }

  async function loadSlots() {
    try {
      const res = await fetch('/api/slots', { credentials: 'omit' });
      if (!res.ok) return;
      const body = await res.json();
      slotMap = body && body.data ? body.data : {};
      applyOverrides();
    } catch (err) {
      // network/parse failure — leave defaults in place
      console.warn('slots: override fetch failed', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSlots);
  } else {
    loadSlots();
  }

  // Expose for any page that adds <img> dynamically.
  window.applySlots = applyOverrides;
})();
