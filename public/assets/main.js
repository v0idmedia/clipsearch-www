(function () {
  'use strict';

  var appConfig = window.CLIPSEARCH_CONFIG || {};
  var metrikaId = Number(appConfig.yandexMetrikaId || 0);
  var metrikaLoaded = false;

  function loadMetrika() {
    if (!metrikaId || metrikaLoaded) return;
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = window.ym.l || Date.now();

    if (!document.querySelector('script[data-clipsearch-metrika]')) {
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://mc.yandex.ru/metrika/tag.js';
      script.setAttribute('data-clipsearch-metrika', '');
      document.head.appendChild(script);
    }

    window.ym(metrikaId, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true
    });
    metrikaLoaded = true;
  }

  function disableMetrika() {
    if (!metrikaLoaded || typeof window.ym !== 'function') return;
    window.ym(metrikaId, 'destruct');
    metrikaLoaded = false;
  }

  function metrikaGoal(name) {
    if (metrikaLoaded && typeof window.ym === 'function') {
      window.ym(metrikaId, 'reachGoal', name);
    }
  }

  if (window.CLIPSEARCH_COOKIE_CONSENT === 'all') loadMetrika();
  window.addEventListener('clipsearch:cookie-consent', function (event) {
    if (event.detail && event.detail.choice === 'all') loadMetrika();
    else disableMetrika();
  });

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
  var turnstilePromise = null;

  function loadTurnstileScript() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstilePromise) return turnstilePromise;

    turnstilePromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = function () {
        if (window.turnstile) resolve(window.turnstile);
        else reject(new Error('Turnstile unavailable'));
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return turnstilePromise;
  }

  function clearTurnstileTimeout(form) {
    if (form._turnstileTimeout) {
      window.clearTimeout(form._turnstileTimeout);
      form._turnstileTimeout = null;
    }
  }

  function resetTurnstileForForm(form) {
    clearTurnstileTimeout(form);
    form._turnstileExecutionActive = false;
    form._turnstileToken = '';
    if (window.turnstile && form._turnstileWidgetId !== undefined) {
      window.turnstile.reset(form._turnstileWidgetId);
    }
  }

  function ensureTurnstile(form) {
    var container = form.querySelector('[data-turnstile-widget]');
    if (!container || !appConfig.turnstileSiteKey) return Promise.resolve(null);

    return loadTurnstileScript().then(function (api) {
      if (form._turnstileWidgetId === undefined) {
        form._turnstileWidgetId = api.render(container, {
          sitekey: container.getAttribute('data-sitekey') || appConfig.turnstileSiteKey,
          action: appConfig.turnstileAction || 'clipsearch_lead',
          execution: 'execute',
          appearance: 'interaction-only',
          retry: 'auto',
          'retry-interval': 3000,
          'refresh-expired': 'auto',
          'response-field': false,
          callback: function (token) {
            form._turnstileToken = token;
            if (!form._turnstileExecutionActive || typeof form._turnstileOnToken !== 'function') return;
            form._turnstileExecutionActive = false;
            clearTurnstileTimeout(form);
            form._turnstileOnToken(token);
          },
          'error-callback': function (code) {
            form._turnstileToken = '';
            if (!form._turnstileExecutionActive || typeof form._turnstileOnError !== 'function') return;
            var suffix = code ? ' Код Cloudflare: ' + code + '.' : '';
            form._turnstileOnError('Не удалось выполнить антиспам-проверку.' + suffix + ' Попробуйте ещё раз.');
          },
          'expired-callback': function () {
            form._turnstileToken = '';
          }
        });
      }
      return api;
    });
  }

  function openLeadModal(trigger) {
    leadLastFocus = trigger || document.activeElement;
    var sourceInput = leadModal.querySelector('input[name="source"]');
    if (sourceInput && trigger) {
      var source = trigger.getAttribute('data-form-source') || trigger.textContent || 'Всплывающая форма';
      sourceInput.value = source.replace(/\s+/g, ' ').trim();
    }
    leadModal.hidden = false;
    document.body.classList.add('modal-open');
    metrikaGoal('lead_open');
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
      var phoneInput = form.querySelector('[data-phone-input]');
      var phoneCountry = form.querySelector('[data-phone-country]');
      var phoneError = form.querySelector('[data-phone-error]');
      var consentInput = form.querySelector('input[name="consent"]');
      var consentError = form.querySelector('[data-consent-error]');
      var phoneController = null;
      var submit = form.querySelector('[type="submit"]');
      var initialSubmitHtml = submit ? submit.innerHTML : '';

      function setFieldError(input, errorNode, message) {
        if (!input || !errorNode) return;
        var field = input.closest('.form-field, .consent-field');
        input.classList.toggle('is-invalid', Boolean(message));
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
        errorNode.textContent = message || '';
        if (field) field.classList.toggle('is-invalid', Boolean(message));
      }

      if (phoneInput && typeof window.intlTelInput === 'function') {
        phoneController = window.intlTelInput(phoneInput, {
          initialCountry: 'ru',
          onlyCountries: ['ru', 'by', 'ge', 'kz', 'uz', 'az', 'am'],
          countryOrder: ['ru', 'by', 'ge', 'kz', 'uz', 'az', 'am'],
          countryNameLocale: 'ru',
          countryNameOverrides: {
            ru: 'Россия',
            by: 'Беларусь',
            ge: 'Грузия',
            kz: 'Казахстан',
            uz: 'Узбекистан',
            az: 'Азербайджан',
            am: 'Армения'
          },
          uiTranslations: {
            selectedCountryAriaLabel: 'Изменить страну номера, выбрана ${countryName} (${dialCode})',
            noCountrySelected: 'Выберите страну номера телефона',
            countryListAriaLabel: 'Список стран',
            searchPlaceholder: 'Поиск страны',
            clearSearchAriaLabel: 'Очистить поиск',
            searchEmptyState: 'Страны не найдены',
            searchSummaryAria: function (count) {
              return count === 0 ? 'Страны не найдены' : 'Найдено стран: ' + count;
            }
          },
          separateDialCode: true,
          nationalMode: true,
          strictMode: true,
          formatAsYouType: true,
          countrySearch: true,
          loadUtils: function () {
            return import('/assets/vendor/intl-tel-input/js/utils.js');
          }
        });
      }

      if (phoneInput) {
        phoneInput.addEventListener('input', function () {
          var filtered = phoneInput.value.replace(/[^0-9+\s().-]/g, '');
          if (filtered !== phoneInput.value) phoneInput.value = filtered;
          phoneInput.setCustomValidity('');
          setFieldError(phoneInput, phoneError, '');
        });
      }

      Array.prototype.forEach.call(form.querySelectorAll('input[name="name"], input[name="email"], input[name="company"]'), function (input) {
        input.addEventListener('input', function () {
          input.setCustomValidity('');
          setFieldError(input, form.querySelector('[data-error-for="' + input.name + '"]'), '');
        });
      });
      if (consentInput) {
        consentInput.addEventListener('change', function () {
          setFieldError(consentInput, consentError, '');
        });
      }

      function validatePhone() {
        var raw = phoneInput ? phoneInput.value.trim() : '';
        if (!raw) {
          if (phoneInput) phoneInput.setCustomValidity('Укажите номер телефона.');
          setFieldError(phoneInput, phoneError, 'Укажите номер телефона.');
          return Promise.resolve(false);
        }

        if (phoneController) {
          return Promise.resolve(phoneController.promise).catch(function () {}).then(function () {
            if (!phoneController.isValidNumber()) {
              phoneInput.setCustomValidity('Проверьте номер телефона.');
              setFieldError(phoneInput, phoneError, 'Проверьте номер телефона.');
              return false;
            }
            phoneInput.setCustomValidity('');
            setFieldError(phoneInput, phoneError, '');
            form._normalizedPhone = phoneController.getNumber();
            if (phoneCountry) {
              var selectedCountry = typeof phoneController.getSelectedCountry === 'function'
                ? phoneController.getSelectedCountry()
                : phoneController.getSelectedCountryData();
              phoneCountry.value = selectedCountry && selectedCountry.iso2 ? selectedCountry.iso2 : '';
            }
            return true;
          });
        }

        var normalized = raw.replace(/[^0-9+]/g, '');
        if (!/^\+[1-9][0-9]{6,14}$/.test(normalized)) {
          phoneInput.setCustomValidity('Введите номер с кодом страны, начиная с +.');
          setFieldError(phoneInput, phoneError, 'Введите номер с кодом страны, начиная с +.');
          return Promise.resolve(false);
        }
        phoneInput.setCustomValidity('');
        setFieldError(phoneInput, phoneError, '');
        form._normalizedPhone = normalized;
        return Promise.resolve(true);
      }

      function validateForm() {
        var valid = true;
        var firstInvalid = null;
        Array.prototype.forEach.call(['name', 'email', 'company'], function (name) {
          var input = form.querySelector('input[name="' + name + '"]');
          var errorNode = form.querySelector('[data-error-for="' + name + '"]');
          if (!input) return;
          var message = '';
          if (!input.value.trim()) {
            message = name === 'name' ? 'Укажите имя.' : name === 'company' ? 'Укажите компанию.' : 'Укажите email.';
          } else if (name === 'email' && !input.validity.valid) {
            message = 'Проверьте адрес электронной почты.';
          }
          setFieldError(input, errorNode, message);
          if (message) {
            valid = false;
            if (!firstInvalid) firstInvalid = input;
          }
        });

        var consentValid = Boolean(consentInput && consentInput.checked);
        setFieldError(consentInput, consentError, consentValid ? '' : 'Подтвердите согласие на обработку данных.');
        if (!consentValid) valid = false;

        return validatePhone().then(function (phoneValid) {
          if (!phoneValid) {
            valid = false;
            if (!firstInvalid) firstInvalid = phoneInput;
          }
          if (!firstInvalid && !consentValid) firstInvalid = consentInput;
          if (!valid && firstInvalid) firstInvalid.focus({ preventScroll: false });
          return valid;
        });
      }

      function setPending(pending, label) {
        if (!submit) return;
        submit.disabled = pending;
        submit.innerHTML = pending ? label : initialSubmitHtml;
      }

      function showFormError(message) {
        if (!formError) return;
        formError.textContent = message;
        formError.classList.remove('is-hidden');
      }

      function stopTurnstile(message) {
        resetTurnstileForForm(form);
        setPending(false, '');
        showFormError(message);
      }

      function sendForm(turnstileToken) {
        var sourceInput = form.querySelector('input[name="source"]');
        var sourceValue = sourceInput ? sourceInput.value : '';
        var formData = new FormData(form);
        if (form._normalizedPhone) formData.set('phone', form._normalizedPhone);
        if (turnstileToken) formData.set('cf-turnstile-response', turnstileToken);
        setPending(true, 'Отправляем…');

        fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        })
          .then(function (response) {
            var resultHeader = response.headers.get('X-Clipsearch-Result') || '';
            return response.text().then(function (body) {
              var data = null;
              try {
                data = JSON.parse(body);
              } catch (parseError) {
                if (response.ok && resultHeader === 'sent') {
                  return { ok: true, code: 'sent' };
                }
                throw new Error('Сервер вернул некорректный ответ. Заявка могла быть доставлена — свяжитесь с нами перед повторной отправкой.');
              }
              if (!response.ok || !data.ok) throw new Error(data.message || 'Не удалось отправить заявку.');
              return data;
            });
          })
          .then(function () {
            form.reset();
            form._normalizedPhone = '';
            if (sourceInput) sourceInput.value = sourceValue;
            resetTurnstileForForm(form);
            form.classList.add('is-hidden');
            if (success) success.classList.remove('is-hidden');
            metrikaGoal('lead_success');
          })
          .catch(function (error) {
            resetTurnstileForForm(form);
            showFormError(error.message || 'Не удалось отправить заявку. Попробуйте ещё раз.');
            metrikaGoal('lead_error');
          })
          .then(function () {
            setPending(false, '');
          });
      }

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (form._validationActive || form._turnstileExecutionActive || (submit && submit.disabled)) return;
        if (formError) formError.classList.add('is-hidden');
        form._validationActive = true;
        setPending(true, 'Проверяем…');

        validateForm().then(function (valid) {
          form._validationActive = false;
          if (!valid) {
            setPending(false, '');
            return;
          }

          if (!appConfig.turnstileSiteKey || !form.querySelector('[data-turnstile-widget]')) {
            sendForm('');
            return;
          }

          form._turnstileExecutionActive = true;
          form._turnstileOnToken = sendForm;
          form._turnstileOnError = stopTurnstile;
          clearTurnstileTimeout(form);
          form._turnstileTimeout = window.setTimeout(function () {
            if (form._turnstileExecutionActive) {
              stopTurnstile('Антиспам-проверка не ответила. Проверьте соединение и попробуйте ещё раз.');
            }
          }, 45000);

          ensureTurnstile(form)
            .then(function (api) {
              if (!form._turnstileExecutionActive || !api) return;
              api.execute(form._turnstileWidgetId);
            })
            .catch(function () {
              stopTurnstile('Антиспам-проверка недоступна. Попробуйте позже или свяжитесь с нами по телефону.');
            });
        }).catch(function () {
          form._validationActive = false;
          setPending(false, '');
          showFormError('Не удалось проверить данные формы. Обновите страницу и попробуйте ещё раз.');
        });
      });
    }

    if (sendAnother && form) {
      sendAnother.addEventListener('click', function () {
        if (success) success.classList.add('is-hidden');
        form.classList.remove('is-hidden');
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
