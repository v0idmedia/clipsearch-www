(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var range = document.getElementById('photo-range');
  var photoCount = document.getElementById('photo-count');
  var manualHours = document.getElementById('manual-hours');
  var clipMinutes = document.getElementById('clip-minutes');
  var savedHours = document.getElementById('saved-hours');

  function formatNumber(value) {
    return new Intl.NumberFormat('ru-RU').format(value);
  }

  function updateCalculator() {
    if (!range) return;
    var photos = Number(range.value);
    var manual = Math.max(1, Math.round((photos * 1.2) / 60));
    var clip = Math.max(3, Math.round((photos * 1.2) / 8));
    var saved = Math.max(1, Math.round(manual * 0.9));
    photoCount.textContent = formatNumber(photos);
    manualHours.textContent = manual + ' ч';
    clipMinutes.textContent = '≈ ' + clip + ' мин';
    savedHours.textContent = 'до ' + saved + ' ч/мес.';
  }

  if (range) {
    range.addEventListener('input', updateCalculator);
    updateCalculator();
  }

  var faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
  faqItems.forEach(function (item) {
    var button = item.querySelector('button');
    var marker = button.querySelector('i');
    button.addEventListener('click', function () {
      var willOpen = !item.classList.contains('open');
      faqItems.forEach(function (other) {
        other.classList.remove('open');
        other.querySelector('button').setAttribute('aria-expanded', 'false');
        other.querySelector('button i').textContent = '+';
      });
      if (willOpen) {
        item.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
        marker.textContent = '−';
      }
    });
  });

  var leadModal = document.getElementById('lead-modal');
  var leadLastFocus = null;
  var modal = document.getElementById('legal-modal');
  var modalTitle = document.getElementById('modal-title');
  var modalCopy = document.getElementById('modal-copy');
  var lastFocus = null;
  var legalTitles = {
    policy: 'Политика конфиденциальности',
    consent: 'Согласие на обработку персональных данных',
    details: 'Реквизиты и контакты'
  };

  function openLeadModal(trigger) {
    leadLastFocus = trigger || document.activeElement;
    leadModal.hidden = false;
    document.body.classList.add('modal-open');
    var firstInput = leadModal.querySelector('input:not(.honeypot)');
    if (firstInput) window.setTimeout(function () { firstInput.focus(); }, 60);
  }

  function closeLeadModal() {
    leadModal.hidden = true;
    document.body.classList.remove('modal-open');
    if (leadLastFocus && typeof leadLastFocus.focus === 'function') leadLastFocus.focus();
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-open-form]')).forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      openLeadModal(button);
    });
  });
  Array.prototype.slice.call(document.querySelectorAll('[data-lead-close]')).forEach(function (button) {
    button.addEventListener('click', closeLeadModal);
  });
  if (leadModal && !leadModal.hidden) document.body.classList.add('modal-open');

  function openModal(type, trigger) {
    var template = document.getElementById('legal-' + type);
    if (!template) return;
    lastFocus = trigger || document.activeElement;
    if (leadModal && !leadModal.hidden) leadModal.hidden = true;
    modalTitle.textContent = legalTitles[type] || '';
    modalCopy.innerHTML = template.innerHTML;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    modal.querySelector('.modal-close').focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-legal]')).forEach(function (button) {
    button.addEventListener('click', function () { openModal(button.getAttribute('data-legal'), button); });
  });
  Array.prototype.slice.call(document.querySelectorAll('[data-modal-close]')).forEach(function (button) {
    button.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (!modal.hidden) closeModal();
    else if (leadModal && !leadModal.hidden) closeLeadModal();
  });

  var form = document.getElementById('lead-form');
  var success = document.getElementById('success-state');
  var formError = document.getElementById('form-error');
  var sendAnother = document.getElementById('send-another');

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      formError.classList.add('is-hidden');
      var submit = form.querySelector('[type="submit"]');
      var initialText = submit.innerHTML;
      submit.disabled = true;
      submit.textContent = 'Отправляем…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          return response.json().then(function (data) {
            if (!response.ok || !data.ok) throw new Error(data.message || 'Не удалось отправить заявку.');
            return data;
          });
        })
        .then(function () {
          form.reset();
          form.classList.add('is-hidden');
          success.classList.remove('is-hidden');
        })
        .catch(function (error) {
          formError.textContent = error.message || 'Не удалось отправить заявку. Попробуйте ещё раз.';
          formError.classList.remove('is-hidden');
        })
        .then(function () {
          submit.disabled = false;
          submit.innerHTML = initialText;
        });
    });
  }

  if (sendAnother) {
    sendAnother.addEventListener('click', function () {
      success.classList.add('is-hidden');
      form.classList.remove('is-hidden');
      form.querySelector('input').focus();
    });
  }

  var revealTargets = document.querySelectorAll('.compare-card, .steps-grid article, .feature-card, .price-card, .similarity-visual, .app-window');
  Array.prototype.forEach.call(revealTargets, function (element) { element.classList.add('scroll-reveal'); });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(revealTargets, function (element) { observer.observe(element); });
  } else {
    Array.prototype.forEach.call(revealTargets, function (element) { element.classList.add('is-visible'); });
  }
})();
