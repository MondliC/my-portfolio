(() => {
  const endpoint = '/.netlify/functions/track';
  const sessionKey = 'mondli_session_id';
  const sessionId = sessionStorage.getItem(sessionKey) || crypto.randomUUID();
  sessionStorage.setItem(sessionKey, sessionId);

  const state = {
    startedAt: Date.now(),
    activeMs: 0,
    lastActiveAt: Date.now(),
    maxScroll: 0,
    visible: !document.hidden,
    clicks: []
  };

  const page = location.pathname || '/';
  const referrer = document.referrer || '';
  const params = new URLSearchParams(location.search);
  const utmSource = params.get('utm_source') || '';
  const referralSource = (() => {
    if (utmSource) return utmSource;
    if (!referrer) return 'Direct';
    const r = referrer.toLowerCase();
    if (r.includes('linkedin')) return 'LinkedIn';
    if (r.includes('github')) return 'GitHub';
    if (r.includes('google.')) return 'Google';
    if (r.includes('bing.')) return 'Bing';
    if (r.includes('duckduckgo')) return 'DuckDuckGo';
    if (r.includes('facebook') || r.includes('fb.com')) return 'Facebook';
    if (r.includes('twitter') || r.includes('x.com')) return 'X / Twitter';
    if (r.includes('instagram')) return 'Instagram';
    try { return new URL(referrer).hostname.replace(/^www\\./, ''); } catch (_) { return 'Referral'; }
  })();
  const ua = navigator.userAgent;
  const device = /Mobi|Android/i.test(ua) ? 'mobile' : /Tablet|iPad/i.test(ua) ? 'tablet' : 'desktop';

  function updateActive() {
    const now = Date.now();
    if (state.visible && now - state.lastActiveAt < 15000) {
      state.activeMs += now - state.lastActiveAt;
    }
    state.lastActiveAt = now;
  }

  ['mousemove','keydown','touchstart','scroll','click'].forEach(evt => {
    addEventListener(evt, () => {
      updateActive();
      state.lastActiveAt = Date.now();
    }, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    updateActive();
    state.visible = !document.hidden;
    state.lastActiveAt = Date.now();
    if (document.hidden) send('heartbeat');
  });

  addEventListener('scroll', () => {
    const doc = document.documentElement;
    const scrollable = Math.max(1, doc.scrollHeight - innerHeight);
    const depth = Math.min(100, Math.round((scrollY / scrollable) * 100));
    state.maxScroll = Math.max(state.maxScroll, depth);
  }, { passive: true });

  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    const label = (a.textContent || '').trim().slice(0, 80);
    const href = a.getAttribute('href') || '';
    if (href) state.clicks.push({ label, href });
  });

  async function send(type = 'pageview') {
    updateActive();
    const payload = {
      type,
      session_id: sessionId,
      page,
      title: document.title,
      referrer,
      referral_source: referralSource,
      utm_source: utmSource,
      device,
      active_seconds: Math.round(state.activeMs / 1000),
      scroll_depth: state.maxScroll,
      clicks: state.clicks.splice(0, 20),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      language: navigator.language || '',
      screen: `${screen.width}x${screen.height}`
    };

    try {
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon && type !== 'pageview') {
        navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      } else {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true
        });
      }
    } catch (_) {}
  }

  send('pageview');
  setInterval(() => send('heartbeat'), 30000);
  addEventListener('pagehide', () => send('session_end'));
})();