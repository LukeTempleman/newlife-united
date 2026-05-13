// Fetch image / video slot overrides from the CRM and swap matching
// <img data-slot> src values. If the override URL is a video (.mp4/.webm/.mov),
// the <img> is replaced with a muted, looping, autoplaying <video> element so
// hero slots can be either a still image or a short looping clip.
// Safe to call applySlots() again after dynamically adding more <img> tags.
(function () {
  let slotMap = null;

  function isVideo(url) {
    return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
  }

  function buildVideo(src, opts) {
    const v = document.createElement('video');
    v.src = src;
    v.autoplay = true;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('muted', '');
    v.setAttribute('autoplay', '');
    v.setAttribute('loop', '');
    v.preload = 'auto';
    v.setAttribute('data-slot', opts.slot || '');
    if (opts.alt) v.setAttribute('aria-label', opts.alt);
    if (opts.className) v.className = opts.className;
    if (opts.style) v.setAttribute('style', opts.style);
    // Force playback (some mobile browsers need an explicit call after attribute set).
    const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    v.addEventListener('loadedmetadata', tryPlay);
    setTimeout(tryPlay, 0);
    return v;
  }

  function applyOverrides() {
    if (!slotMap) return;
    document.querySelectorAll('img[data-slot], video[data-slot]').forEach((el) => {
      const slot = el.getAttribute('data-slot');
      const override = slotMap[slot];
      if (!override) return;
      const wantVideo = isVideo(override);
      const isCurrentlyVideo = el.tagName === 'VIDEO';

      if (wantVideo && !isCurrentlyVideo) {
        // Replace <img> with <video>
        const video = buildVideo(override, {
          slot,
          alt: el.getAttribute('alt') || '',
          className: el.className || '',
          style: el.getAttribute('style') || '',
        });
        el.replaceWith(video);
      } else if (!wantVideo && isCurrentlyVideo) {
        // Replace <video> back with <img>
        const img = document.createElement('img');
        img.src = override;
        img.setAttribute('data-slot', slot);
        const alt = el.getAttribute('aria-label') || '';
        if (alt) img.setAttribute('alt', alt);
        const style = el.getAttribute('style');
        if (style) img.setAttribute('style', style);
        if (el.className) img.className = el.className;
        el.replaceWith(img);
      } else if (el.getAttribute('src') !== override) {
        el.setAttribute('src', override);
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
      console.warn('slots: override fetch failed', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSlots);
  } else {
    loadSlots();
  }

  window.applySlots = applyOverrides;
})();
