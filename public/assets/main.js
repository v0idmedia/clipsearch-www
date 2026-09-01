(function () {
  'use strict';

  document.documentElement.classList.add('js');

  function protectShortWordsInHeadings() {
    var shortWords = /(^|[\s\u00a0«„“\"'(\[])(а|без|бы|в|во|да|для|до|же|за|и|из|из-за|или|как|к|ко|ли|либо|на|над|не|ни|но|о|об|обо|от|по|под|при|про|с|со|у|что)\s+(?=\S)/gi;
    var headings = document.querySelectorAll('h1, h2, h3');

    Array.prototype.forEach.call(headings, function (heading) {
      var walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT, null, false);
      var textNode;

      while ((textNode = walker.nextNode())) {
        textNode.nodeValue = textNode.nodeValue.replace(shortWords, '$1$2\u00a0');
      }
    });
  }

  protectShortWordsInHeadings();

  var siteHeader = document.querySelector('.site-header');

  function updateFloatingHeader() {
    if (!siteHeader) return;
    if (window.scrollY > 24) siteHeader.classList.add('is-floating');
    else siteHeader.classList.remove('is-floating');
  }

  if (siteHeader) {
    window.addEventListener('scroll', updateFloatingHeader, { passive: true });
    updateFloatingHeader();
  }

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

  var manualCard = document.querySelector('[data-card-trail]');
  var canUseTrail = window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (manualCard && canUseTrail) {
    var trailLayer = manualCard.querySelector('.manual-trail');
    var lastTrailX = -100;
    var lastTrailY = -100;
    var lastTrailTime = 0;
    var trailIndex = 0;

    function createTrailCard(event, force) {
      if (!trailLayer || event.pointerType === 'touch') return;

      var bounds = manualCard.getBoundingClientRect();
      var x = event.clientX - bounds.left;
      var y = event.clientY - bounds.top;
      var distance = Math.sqrt(Math.pow(x - lastTrailX, 2) + Math.pow(y - lastTrailY, 2));
      var now = Date.now();

      if (!force && distance < 34 && now - lastTrailTime < 80) return;

      lastTrailX = x;
      lastTrailY = y;
      lastTrailTime = now;

      var card = document.createElement('span');
      var rotations = [-8, 5, -3, 9, -6, 3];
      card.className = 'manual-trail-card';
      card.style.left = x + 'px';
      card.style.top = y + 'px';
      card.style.setProperty('--trail-rotate', rotations[trailIndex % rotations.length] + 'deg');
      trailIndex += 1;
      trailLayer.appendChild(card);

      while (trailLayer.children.length > 12) {
        trailLayer.removeChild(trailLayer.firstElementChild);
      }

      card.addEventListener('animationend', function () {
        if (card.parentNode) card.parentNode.removeChild(card);
      });
    }

    manualCard.addEventListener('pointerenter', function (event) { createTrailCard(event, true); });
    manualCard.addEventListener('pointermove', function (event) { createTrailCard(event, false); });
    manualCard.addEventListener('pointerleave', function () {
      lastTrailX = -100;
      lastTrailY = -100;
    });
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
  var pdfModal = document.getElementById('pdf-modal');
  var pdfFrame = document.getElementById('pdf-frame');
  var pdfTitle = document.getElementById('pdf-modal-title');
  var pdfOpenLink = document.getElementById('pdf-open-link');
  var pdfLastFocus = null;
  var turnstileReady = false;

  function setTurnstileSubmitState(container, enabled) {
    var form = container.closest('form');
    var submit = form ? form.querySelector('[type="submit"]') : null;
    if (submit) submit.disabled = !enabled;
  }

  function renderTurnstileWidgets(root) {
    if (!turnstileReady || !window.turnstile) return;
    var containers = root.querySelectorAll('[data-turnstile-widget]');

    Array.prototype.forEach.call(containers, function (container) {
      if (container._turnstileWidgetId !== undefined) return;
      var parentModal = container.closest('.modal');
      if (parentModal && parentModal.hidden) return;

      container._turnstileWidgetId = window.turnstile.render(container, {
        sitekey: container.getAttribute('data-sitekey'),
        theme: 'light',
        size: 'flexible',
        appearance: 'interaction-only',
        action: 'lead',
        callback: function () { setTurnstileSubmitState(container, true); },
        'expired-callback': function () { setTurnstileSubmitState(container, false); },
        'error-callback': function () { setTurnstileSubmitState(container, false); }
      });
    });
  }

  function resetTurnstileForForm(form) {
    var container = form.querySelector('[data-turnstile-widget]');
    if (!container || container._turnstileWidgetId === undefined || !window.turnstile) return;
    setTurnstileSubmitState(container, false);
    window.turnstile.reset(container._turnstileWidgetId);
  }

  window.clipsearchTurnstileReady = function () {
    turnstileReady = true;
    renderTurnstileWidgets(document);
  };

  function openLeadModal(trigger) {
    leadLastFocus = trigger || document.activeElement;
    var sourceInput = leadModal.querySelector('input[name="source"]');
    if (sourceInput && trigger) {
      var source = trigger.getAttribute('data-form-source') || trigger.textContent || 'Всплывающая форма';
      sourceInput.value = source.replace(/\s+/g, ' ').trim();
    }
    leadModal.hidden = false;
    document.body.classList.add('modal-open');
    renderTurnstileWidgets(leadModal);
    var firstInput = leadModal.querySelector('input:not([type="hidden"]):not(.honeypot)');
    if (firstInput) window.setTimeout(function () { firstInput.focus(); }, 60);
  }

  function closeLeadModal() {
    leadModal.hidden = true;
    if (!pdfModal || pdfModal.hidden) document.body.classList.remove('modal-open');
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

  function openPdfModal(link) {
    var url = link.getAttribute('href');
    if (!pdfModal || !pdfFrame || !url) return;

    pdfLastFocus = link;
    pdfTitle.textContent = link.getAttribute('data-pdf-title') || link.textContent.trim() || 'Документ';
    pdfOpenLink.href = url;
    pdfFrame.src = url + '#view=FitH&toolbar=1&navpanes=0';
    pdfModal.hidden = false;
    document.body.classList.add('modal-open');
    window.setTimeout(function () { pdfModal.querySelector('.modal-close').focus(); }, 40);
  }

  function closePdfModal() {
    if (!pdfModal) return;
    pdfModal.hidden = true;
    if (pdfFrame) pdfFrame.src = 'about:blank';
    if (!leadModal || leadModal.hidden) document.body.classList.remove('modal-open');
    if (pdfLastFocus && typeof pdfLastFocus.focus === 'function') pdfLastFocus.focus();
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-pdf-modal]')).forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      openPdfModal(link);
    });
  });
  Array.prototype.slice.call(document.querySelectorAll('[data-pdf-close]')).forEach(function (button) {
    button.addEventListener('click', closePdfModal);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (pdfModal && !pdfModal.hidden) closePdfModal();
    else if (leadModal && !leadModal.hidden) closeLeadModal();
  });

  var leadScopes = document.querySelectorAll('[data-lead-scope]');
  Array.prototype.forEach.call(leadScopes, function (scope) {
    var form = scope.querySelector('[data-lead-form]');
    var success = scope.querySelector('[data-success-state]');
    var formError = scope.querySelector('[data-form-error]');
    var sendAnother = scope.querySelector('[data-send-another]');

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (formError) formError.classList.add('is-hidden');
        var submit = form.querySelector('[type="submit"]');
        var initialText = submit.innerHTML;
        var sourceInput = form.querySelector('input[name="source"]');
        var sourceValue = sourceInput ? sourceInput.value : '';
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
            if (sourceInput) sourceInput.value = sourceValue;
            resetTurnstileForForm(form);
            form.classList.add('is-hidden');
            if (success) success.classList.remove('is-hidden');
          })
          .catch(function (error) {
            resetTurnstileForForm(form);
            if (!formError) return;
            formError.textContent = error.message || 'Не удалось отправить заявку. Попробуйте ещё раз.';
            formError.classList.remove('is-hidden');
          })
          .then(function () {
            if (!form.querySelector('[data-turnstile-widget]')) submit.disabled = false;
            submit.innerHTML = initialText;
          });
      });
    }

    if (sendAnother && form) {
      sendAnother.addEventListener('click', function () {
        if (success) success.classList.add('is-hidden');
        form.classList.remove('is-hidden');
        renderTurnstileWidgets(scope);
        form.querySelector('input:not([type="hidden"]):not(.honeypot)').focus();
      });
    }
  });

  var revealTargets = document.querySelectorAll('.compare-card, .steps-grid article, .feature-card, .price-card, .similarity-visual, .app-window, .custom-system-card');
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
