<script>
(function () {
  'use strict';
  var value = '';
  try {
    value = window.localStorage.getItem('clipsearch_cookie_consent') || '';
  } catch (error) {
    value = '';
  }
  if (value === 'all' || value === 'necessary') {
    document.documentElement.setAttribute('data-cookie-consent', value);
  }
  window.CLIPSEARCH_COOKIE_CONSENT = value;
})();
</script>
<style>
  .cookie-consent[hidden] { display: none !important; }
  .cookie-consent { position: fixed; left: 0; right: 0; bottom: 10px; z-index: 950; padding: 0 10px; pointer-events: none; }
  .cookie-consent__panel { width: min(1120px, 100%); display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 24px; margin: 0 auto; padding: 18px 20px; border: 1px solid rgba(61,45,70,.11); border-radius: 24px; color: #2b2430; background: rgba(255,255,255,.92); box-shadow: 0 18px 55px rgba(43,27,51,.18); -webkit-backdrop-filter: blur(18px) saturate(145%); backdrop-filter: blur(18px) saturate(145%); opacity: 0; transform: translateY(18px); transition: opacity .24s ease, transform .24s ease; pointer-events: auto; }
  .cookie-consent.is-visible .cookie-consent__panel { opacity: 1; transform: translateY(0); }
  .cookie-consent__copy { display: grid; gap: 6px; }
  .cookie-consent__copy strong { font-size: 15px; line-height: 1.2; }
  .cookie-consent__copy p { max-width: 730px; margin: 0; color: #746a7a; font-size: 12px; line-height: 1.45; }
  .cookie-consent__copy a { color: #7330a8; font-weight: 800; text-decoration: underline; text-underline-offset: 2px; }
  .cookie-consent__actions { display: flex; gap: 9px; }
  .cookie-consent__button { min-height: 42px; padding: 0 16px; border: 1px solid #ded4e4; border-radius: 999px; background: #fff; color: #4f4555; font: inherit; font-size: 11px; font-weight: 900; white-space: nowrap; cursor: pointer; }
  .cookie-consent__button--primary { border-color: #7330a8; background: #7330a8; color: #fff; }
  .cookie-consent__button:hover { transform: translateY(-1px); }
  .cookie-settings-button { padding: 0; border: 0; background: none; color: inherit; font: inherit; cursor: pointer; }
  .cookie-settings-button:hover { color: #7330a8; }
  @media (max-width: 720px) {
    .cookie-consent__panel { grid-template-columns: 1fr; gap: 14px; padding: 17px; border-radius: 20px; }
    .cookie-consent__actions { width: 100%; }
    .cookie-consent__button { flex: 1; }
  }
  @media (max-width: 460px) {
    .cookie-consent { bottom: 8px; padding: 0 8px; }
    .cookie-consent__actions { flex-direction: column; }
    .cookie-consent__button { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cookie-consent__panel { transition: none; }
  }
</style>
