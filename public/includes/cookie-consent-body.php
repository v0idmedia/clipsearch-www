<aside class="cookie-consent" id="cookie-consent" role="dialog" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-description" hidden>
  <div class="cookie-consent__panel">
    <div class="cookie-consent__copy">
      <strong id="cookie-consent-title">Настройки cookies</strong>
      <p id="cookie-consent-description">Мы используем необходимые технологии для работы сайта, защиты формы и сохранения выбранных настроек. Яндекс Метрика и Вебвизор подключаются для аналитики и улучшения сайта только с вашего разрешения. Подробнее — в <a href="/docs/privacy-policy.pdf" target="_blank" rel="noopener" data-pdf-modal data-pdf-title="Политика конфиденциальности">политике конфиденциальности</a>.</p>
    </div>
    <div class="cookie-consent__actions">
      <button class="cookie-consent__button cookie-consent__button--primary" type="button" data-cookie-choice="all">Разрешить все</button>
      <button class="cookie-consent__button" type="button" data-cookie-choice="necessary">Только необходимые</button>
    </div>
  </div>
</aside>
<script>
(function () {
  'use strict';
  var banner = document.getElementById('cookie-consent');
  if (!banner) return;

  function showBanner() {
    banner.hidden = false;
    window.requestAnimationFrame(function () {
      banner.classList.add('is-visible');
      var primary = banner.querySelector('[data-cookie-choice="all"]');
      if (primary) primary.focus({ preventScroll: true });
    });
  }

  function saveChoice(choice) {
    if (choice !== 'all' && choice !== 'necessary') return;
    try {
      window.localStorage.setItem('clipsearch_cookie_consent', choice);
    } catch (error) {
      // The choice remains active for the current page when storage is unavailable.
    }
    window.CLIPSEARCH_COOKIE_CONSENT = choice;
    document.documentElement.setAttribute('data-cookie-consent', choice);
    window.dispatchEvent(new CustomEvent('clipsearch:cookie-consent', { detail: { choice: choice } }));
    banner.classList.remove('is-visible');
    window.setTimeout(function () { banner.hidden = true; }, 240);
  }

  Array.prototype.forEach.call(banner.querySelectorAll('[data-cookie-choice]'), function (button) {
    button.addEventListener('click', function () { saveChoice(button.getAttribute('data-cookie-choice')); });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-cookie-settings]'), function (button) {
    button.addEventListener('click', showBanner);
  });

  var current = document.documentElement.getAttribute('data-cookie-consent');
  if (current !== 'all' && current !== 'necessary') showBanner();
})();
</script>
