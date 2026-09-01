<?php
declare(strict_types=1);

$submitted = isset($_GET['sent']) && $_GET['sent'] === '1';
$initialError = isset($_GET['error']) ? trim((string)$_GET['error']) : '';

$requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
$requestHost = (string)preg_replace('/:\d+$/', '', $requestHost);
$isLocalRequest = in_array($requestHost, ['localhost', '127.0.0.1', '[::1]', '::1'], true);
$turnstileSiteKey = trim((string)(getenv('TURNSTILE_SITE_KEY') ?: ''));
if ($turnstileSiteKey === '' && $isLocalRequest) {
    $turnstileSiteKey = '1x00000000000000000000BB';
}
$turnstileConfigured = $turnstileSiteKey !== '';

function icon(string $name, string $class = 'icon'): string
{
    $icons = [
        'arrow' => '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
        'check' => '<path d="M20 6 9 17l-5-5"/>',
        'search' => '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
        'clock' => '<circle cx="12" cy="12" r="10"/><path d="M12 6v6h4"/>',
        'sparkle' => '<path d="m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5Z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>',
        'image' => '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
        'file' => '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2Z"/><path d="M14 2v6h6M8 13h2M14 13h2M8 17h2M14 17h2"/>',
        'folder' => '<path d="M20 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l2 3h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z"/><path d="m9 13 2 2 4-4"/>',
        'shield' => '<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6c3 0 5.5-1.2 8-3 2.5 1.8 5 3 8 3Z"/><path d="m9 12 2 2 4-4"/>',
        'layers' => '<path d="m12 2 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
        'text' => '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
        'zap' => '<path d="M13 2 3 14h9l-1 8 10-12h-9Z"/>',
        'scan' => '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="11" cy="11" r="4"/><path d="m15 15 3 3"/>',
        'gauge' => '<path d="M20 13a8 8 0 1 0-16 0"/><path d="m12 13 4-4M4 17h16"/>',
        'phone' => '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c1 .3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>',
        'smartphone' => '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
        'panel' => '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M7 6h.01M11 6h.01M15 6h.01M8 13h8M8 17h5"/>',
        'server' => '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01M10 6h8M10 18h8"/>',
        'mail' => '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-9 5.7a2 2 0 0 1-2 0L2 7"/>',
        'map' => '<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        'x' => '<path d="M18 6 6 18M6 6l12 12"/>',
    ];
    $body = isset($icons[$name]) ? $icons[$name] : $icons['check'];
    return '<svg class="' . htmlspecialchars($class, ENT_QUOTES, 'UTF-8') . '" viewBox="0 0 24 24" aria-hidden="true">' . $body . '</svg>';
}
?>
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CLIP Search | Автоматизация проверки размещения наружной рекламы</title>
  <meta name="description" content="Программа на базе Machine Vision и AI находит рекламные макеты на фото стендов, ускоряет проверку в 5–10 раз и формирует готовый XLSX-отчёт.">
  <meta name="keywords" content="проверка фотоотчётов, автоматизация рекламного агентства, поиск рекламного макета на фото, контроль размещения рекламы, machine vision, распознавание изображений, CLIP Search">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="https://clipsearch.ru/">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#7330a8">
  <meta name="msapplication-config" content="/browserconfig.xml">
  <meta name="msapplication-TileColor" content="#7330a8">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="CLIP Search">
  <meta property="og:title" content="CLIP Search — фотоотчёты проверяются сами">
  <meta property="og:description" content="Автоматическая проверка размещения рекламных макетов на сотнях фотографий за минуты.">
  <meta property="og:url" content="https://clipsearch.ru/">
  <meta property="og:image" content="https://clipsearch.ru/og.png">
  <meta property="og:image:secure_url" content="https://clipsearch.ru/og.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1672">
  <meta property="og:image:height" content="941">
  <meta property="og:image:alt" content="CLIP Search — автоматическая проверка рекламных фотоотчётов">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="CLIP Search — фотоотчёты проверяются сами">
  <meta name="twitter:description" content="Автоматическая проверка размещения рекламных макетов на сотнях фотографий за минуты.">
  <meta name="twitter:image" content="https://clipsearch.ru/og.png">
  <link rel="preload" href="/assets/fonts/mulish-variable.ttf" as="font" type="font/ttf" crossorigin>
  <?php if ($turnstileConfigured): ?><link rel="preconnect" href="https://challenges.cloudflare.com"><?php endif; ?>
  <link rel="stylesheet" href="/assets/style.css?v=20260901">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"CLIP Search","applicationCategory":"BusinessApplication","operatingSystem":"Windows","description":"Программа автоматизации проверки размещения рекламных макетов на фотографиях стендов.","url":"https://clipsearch.ru/","image":"https://clipsearch.ru/og.png","provider":{"@type":"Organization","name":"VOID MEDIA","url":"https://voidmedia.ru/","telephone":"+7-499-677-68-83"},"offers":{"@type":"Offer","priceCurrency":"RUB","price":"49990","description":"Профессиональная лицензия до 5 пользователей за 49 990 рублей в год"}}</script>
</head>
<body>
<main>
  <header class="site-header">
    <a href="#top" class="brand" aria-label="CLIP Search — на главную"><img src="/assets/logo.png" alt="CLIP Search"></a>
    <nav aria-label="Основная навигация"><a href="#how">Как работает</a><a href="#features">Возможности</a><a href="#pricing">Тарифы</a></nav>
    <a class="header-cta" href="#contact" data-open-form>Получить демо</a>
  </header>

  <section class="hero" id="top">
    <div class="hero-copy reveal">
      <div class="eyebrow"><?= icon('sparkle') ?> Machine Vision + AI</div>
      <h1>Фотоотчёты проверяются <em>сами</em></h1>
      <p class="hero-lead">CLIP Search находит рекламный макет на сотнях фотографий стендов и сокращает ручную проверку на 80–95%.</p>
      <div class="hero-actions"><a class="button primary" href="#contact" data-open-form>Запросить демонстрацию <?= icon('arrow') ?></a><a class="button ghost" href="#how">Как это работает</a></div>
      <ul class="hero-points"><li><?= icon('check') ?> 100+ фото за минуту</li><li><?= icon('check') ?> XLSX-отчёт без ручной сверки</li></ul>
    </div>

    <div class="search-demo reveal delay-1" aria-label="Пример поиска макета на фотографии стенда">
      <div class="demo-topline"><span class="demo-dot"></span><span>CLIP Search / проверка размещения</span><span class="demo-status">AI анализирует</span></div>
      <div class="demo-body">
        <div class="layout-card"><span>Искомый макет</span><img src="/assets/layout.jpg" alt="Искомый рекламный макет Билайн"><b>bogorodskoe.jpg</b></div>
        <div class="scan-line" aria-hidden="true"><?= icon('arrow') ?></div>
        <div class="stand-card"><img src="/assets/stand.jpg" alt="Фото рекламного стенда с несколькими объявлениями"><span class="match-box"><i>совпадение</i><b>96%</b></span></div>
      </div>
      <div class="demo-footer"><span><b>1</b> точное совпадение</span><span class="found-badge"><?= icon('check') ?> Макет найден</span></div>
    </div>
  </section>

  <section class="metric-strip" aria-label="Ключевые показатели">
    <div><b>−80–95%</b><span>времени на проверку</span></div><div><b>в 5–10 раз</b><span>быстрее готов отчёт</span></div><div><b>−90%</b><span>ручного труда</span></div><div><b>−70–85%</b><span>ошибок оператора</span></div>
  </section>

  <section class="section problem-section">
    <div class="section-heading narrow"><span class="kicker">Не листать. Не сверять. Не ошибаться.</span><h2>Пока менеджер смотрит фото по одному, CLIP Search уже готовит отчёт</h2><p>Программа берёт на себя однообразную часть контроля размещения, а специалист подключается только там, где действительно нужна оценка.</p></div>
    <div class="compare-grid">
      <article class="compare-card manual" data-card-trail><span class="compare-label"><?= icon('clock') ?> Вручную</span><strong>4–8 часов</strong><p>Открыть каждый файл, найти макет, сверить версию, отметить статус, перенести результат в таблицу.</p><div class="manual-trail" aria-hidden="true"></div></article>
      <article class="compare-card auto"><span class="compare-label"><?= icon('sparkle') ?> С CLIP Search</span><strong>несколько минут</strong><p>Выбрать макет и папку. Алгоритм проверит снимки, разметит совпадения и соберёт XLSX.</p><div class="auto-progress" aria-hidden="true"><span></span><i>100%</i></div></article>
    </div>
  </section>

  <section class="section how-section" id="how">
    <div class="section-heading"><span class="kicker light">Простой сценарий</span><h2>От исходного макета до готового списка размещений — три шага</h2></div>
    <div class="steps-grid">
      <article><span class="step-number">01</span><?= icon('image') ?><h3>Укажите макет</h3><p>Загрузите один или несколько эталонов рекламной кампании.</p></article>
      <article><span class="step-number">02</span><?= icon('search') ?><h3>Выберите фотоотчёт</h3><p>Папка может содержать сотни снимков и вложенные каталоги.</p></article>
      <article><span class="step-number">03</span><?= icon('file') ?><h3>Получите результат</h3><p>Статусы, проценты совпадения, разметка и ссылки появятся в XLSX.</p></article>
    </div>
    <div class="app-showcase">
      <div class="app-copy"><span class="mini-label">Десктопное приложение</span><h3>Понятно с первого запуска</h3><p>CLIP Search работает локально на Windows. Фотографии не нужно отправлять в сторонние облачные сервисы: выберите файл макета, папку и запустите поиск.</p><ul><li><?= icon('check') ?> Настраиваемые пороги точности</li><li><?= icon('check') ?> Лог событий и проценты совпадения</li><li><?= icon('check') ?> Лицензирование и офлайн-режим</li></ul></div>
      <div class="app-window modern-app">
        <div class="modern-chrome"><span class="window-dots"><i></i><i></i><i></i></span><b>CLIP Search</b><em>Machine Vision</em></div>
        <div class="modern-app-body">
          <aside aria-hidden="true"><span class="active"><?= icon('scan') ?></span><span><?= icon('folder') ?></span><span><?= icon('file') ?></span></aside>
          <div class="modern-screen"><img src="/assets/app-demo.jpg" alt="Интерфейс CLIP Search со списком найденных размещений"><div class="result-float"><span><?= icon('check') ?></span><p><b>24 размещения найдено</b><small>Отчёт готов к экспорту</small></p></div></div>
        </div>
      </div>
    </div>
  </section>

  <section class="section similarity-section">
    <div class="similarity-visual" aria-label="Сравнение похожих рекламных макетов">
      <div class="similarity-toolbar"><span></span><b>Проверка похожих макетов</b><i>3 версии</i></div>
      <div class="creative-row"><div class="creative selected"><img src="/assets/layout.jpg" alt="Выбранный макет"><span><?= icon('check') ?> Выбран</span></div><div class="creative variant"><img src="/assets/variant-price.jpg" alt="Похожий макет Билайн с другим предложением"><span><?= icon('x') ?> Другая версия</span></div><div class="creative variant"><img src="/assets/variant-comfort.jpg" alt="Похожий макет Билайн с другим тарифом"><span><?= icon('x') ?> Другая версия</span></div></div>
      <div class="match-proof"><?= icon('shield') ?><span><b>Точное различение</b>Геометрия + ключевые точки + визуальная структура + текст</span></div>
    </div>
    <div class="similarity-copy"><span class="kicker">Точность важнее похожести</span><h2>Разные макеты не смешиваются в одном отчёте</h2><p>CLIP Search проверяет не только общий цвет и форму. Многоступенчатое сопоставление отличает близкие версии креативов, даже если меняются лишь текст, цена или небольшой визуальный элемент.</p><div class="proof-list"><span><b>RANSAC</b> проверяет геометрию</span><span><b>Similarity</b> подтверждает изображение</span><span><b>Text check</b> уточняет версию</span></div></div>
  </section>

  <section class="section features-section" id="features">
    <div class="section-heading"><span class="kicker">Технологии новой версии</span><h2>Уверенно работает с реальными, а не идеальными фотоотчётами</h2><p>Текущие SIFT/ORB, гомография и similarity дополняются ROI-детекцией, устойчивыми локальными признаками, проверкой текста и GPU-ускорением.</p></div>
    <div class="features-grid">
      <article class="feature-card"><div class="feature-icon"><?= icon('scan') ?></div><span class="feature-tag">Machine Vision</span><h3>Находит макет в сложном кадре</h3><p>Распознаёт размещение под углом, при размытии, бликах, стекле и частичном перекрытии.</p></article>
      <article class="feature-card"><div class="feature-icon"><?= icon('layers') ?></div><span class="feature-tag">Точный матчинг</span><h3>Не путает похожие макеты</h3><p>Сравнивает ключевые точки, геометрию, визуальную структуру и текстовые области — близкие версии остаются разными.</p></article>
      <article class="feature-card"><div class="feature-icon"><?= icon('folder') ?></div><span class="feature-tag">Готово сейчас</span><h3>Сортирует результат</h3><p>Автоматически раскладывает исходники по папкам _FOUND и _NOTFOUND для быстрой контрольной проверки.</p></article>
      <article class="feature-card"><div class="feature-icon"><?= icon('file') ?></div><span class="feature-tag">Готово сейчас</span><h3>Формирует XLSX-отчёт</h3><p>Статус, процент совпадения, метод проверки и ссылки на исходный и размеченный кадр — в одной таблице.</p></article>
      <article class="feature-card"><div class="feature-icon"><?= icon('text') ?></div><span class="feature-tag">Новая версия</span><h3>Проверяет текст на макете</h3><p>Дополнительная валидация по текстовым областям повышает точность в визуально сложных сценах.</p></article>
      <article class="feature-card"><div class="feature-icon"><?= icon('zap') ?></div><span class="feature-tag">Опция</span><h3>Масштабируется на GPU</h3><p>Работает на CPU, а опциональное CUDA-ускорение помогает обрабатывать растущие архивы в 5–20 раз быстрее.</p></article>
    </div>
    <div class="tech-line" aria-label="Технологии CLIP Search"><span>OpenCV</span><span>SIFT / ORB</span><span>RANSAC</span><span>SuperPoint</span><span>LightGlue</span><span>CRAFT</span><span>YOLO</span><span>CUDA</span></div>
  </section>

  <section class="section calculator-section">
    <div class="calculator-copy"><span class="kicker light">Калькулятор рутины</span><h2>Сколько времени можно вернуть команде?</h2><p>Передвиньте ползунок и оцените порядок экономии при средней ручной проверке 1,2 минуты на кадр.</p><label for="photo-range">Фотографий в месяц <b id="photo-count">500</b></label><input id="photo-range" type="range" min="100" max="5000" step="100" value="500"><div class="range-labels"><span>100</span><span>5 000</span></div></div>
    <div class="saving-card"><div><span>Ручная проверка</span><b id="manual-hours">10 ч</b></div><div><span>CLIP Search</span><b id="clip-minutes">≈ 75 мин</b></div><div class="saving-total"><?= icon('gauge') ?><span>Команда экономит</span><b id="saved-hours">до 9 ч/мес.</b></div></div>
  </section>

  <section class="section pricing-section" id="pricing">
    <div class="section-heading narrow"><span class="kicker">Варианты запуска</span><h2>Начните с демо — масштабируйте после результата</h2><p>Предварительная модель стоимости для продаж. Финальная лицензия зависит от числа рабочих мест, объёма фото и требуемых модулей.</p></div>
    <div class="pricing-grid">
      <article class="price-card"><span class="price-name">Демо</span><h3>Бесплатно</h3><p>Проверим ваш макет на тестовой выборке и покажем итоговый отчёт.</p><ul><li><?= icon('check') ?> 1 рекламный макет</li><li><?= icon('check') ?> До 100 фото</li><li><?= icon('check') ?> Демонстрация результата</li></ul><a href="#contact" data-open-form class="price-button">Запросить демо <?= icon('arrow') ?></a></article>
      <article class="price-card featured"><span class="popular">Популярный</span><span class="price-name">Профессиональный</span><h3>49 990 ₽<small>/год</small></h3><p>Для регулярной проверки фотоотчётов одной команды.</p><ul><li><?= icon('check') ?> До 5 пользователей</li><li><?= icon('check') ?> Неограниченные папки</li><li><?= icon('check') ?> XLSX и разметка кадров</li><li><?= icon('check') ?> Устойчивый поиск и ROI</li><li><?= icon('check') ?> Обновления и поддержка</li></ul><a href="#contact" data-open-form class="price-button">Получить предложение <?= icon('arrow') ?></a></article>
      <article class="price-card"><span class="price-name">Корпоративный</span><h3>По запросу</h3><p>Для больших потоков, нескольких команд и индивидуального контура.</p><ul><li><?= icon('check') ?> Несколько рабочих мест</li><li><?= icon('check') ?> GPU-ускорение</li><li><?= icon('check') ?> Текстовая валидация</li><li><?= icon('check') ?> Настройка под ваши данные</li></ul><a href="#contact" data-open-form class="price-button">Обсудить задачу <?= icon('arrow') ?></a></article>
    </div>
    <p class="pricing-disclaimer">Работаем исключительно с юридическими лицами и ИП. Указанные цены и условия носят информационный характер и не являются публичной офертой.</p>
  </section>

  <section class="section custom-system-section" id="custom-system">
    <div class="custom-system-card">
      <div class="custom-system-copy">
        <span class="kicker">Индивидуальная разработка</span>
        <h2>Система автоматической проверки наружной рекламы</h2>
        <p>Разработаем единый контур контроля размещения: от постановки задания исполнителю до проверки геолокации, даты съёмки, рекламного макета и готового отчёта.</p>
        <div class="custom-system-features">
          <article><?= icon('smartphone') ?><span><b>Android-приложение</b>Задания, маршруты, защищённая съёмка без загрузки кадров из галереи.</span></article>
          <article><?= icon('panel') ?><span><b>Онлайн-панель</b>Карта объектов, статусы, фотоотчёты, контроль сроков и аналитика.</span></article>
          <article><?= icon('scan') ?><span><b>Автоматическая проверка</b>Система запускает анализ сразу после загрузки фотоотчёта и отмечает найденные размещения без ручного старта.</span></article>
          <article><?= icon('server') ?><span><b>Гибкое размещение</b>On-premise на инфраструктуре заказчика или сопровождение на сервере разработчика.</span></article>
        </div>
        <a class="button primary custom-system-button" href="#contact" data-open-form>Обсудить проект <?= icon('arrow') ?></a>
      </div>
      <div class="custom-system-visual">
        <picture>
          <source media="(max-width: 760px)" srcset="/assets/custom-system.webp">
          <img src="/assets/custom-system-portrait.webp" alt="Android-приложение и онлайн-панель системы контроля размещения наружной рекламы" loading="lazy" width="1152" height="1536">
        </picture>
      </div>
    </div>
  </section>

  <section class="section faq-section">
    <div class="faq-title"><span class="kicker">Ответы по делу</span><h2>Частые вопросы</h2><p>Если вашего вопроса нет в списке, покажем программу на живой демонстрации.</p></div>
    <div class="faq-list">
      <article class="faq-item open"><button type="button" aria-expanded="true"><span>Какие фотоотчёты можно проверять?</span><i>−</i></button><div class="faq-answer"><p>CLIP Search работает с JPG, JPEG, PNG, BMP, TIFF, WEBP и HEIC. Можно выбрать отдельный кадр или целую папку с вложенными каталогами.</p></div></article>
      <article class="faq-item"><button type="button" aria-expanded="false"><span>Что будет, если фото снято под углом?</span><i>+</i></button><div class="faq-answer"><p>Алгоритм проверяет геометрию совпадения и перспективу. Он рассчитан на реальные условия съёмки: наклон, шум, блики, размытие и частичное перекрытие макета.</p></div></article>
      <article class="faq-item"><button type="button" aria-expanded="false"><span>Программа различает похожие рекламные макеты?</span><i>+</i></button><div class="faq-answer"><p>Да. Совпадение проходит несколько проверок: локальные признаки, геометрия, визуальная схожесть, а в новой версии — ещё и текстовые области. Это снижает риск перепутать близкие версии креатива.</p></div></article>
      <article class="faq-item"><button type="button" aria-expanded="false"><span>Нужна ли мощная видеокарта?</span><i>+</i></button><div class="faq-answer"><p>Нет, базовый и улучшенный поиск работают на CPU. GPU — опциональное ускорение для больших потоков фото и растущих архивов.</p></div></article>
      <article class="faq-item"><button type="button" aria-expanded="false"><span>Можно сначала проверить на наших фотографиях?</span><i>+</i></button><div class="faq-answer"><p>Да. На демонстрации можно провести демо на вашем макете и небольшой выборке фотоотчёта, затем подобрать конфигурацию и пороги проверки.</p></div></article>
    </div>
  </section>

  <section class="contact-section" id="contact">
    <div class="contact-shell">
      <div class="contact-copy"><span class="kicker light">Покажите один макет</span><h2>А мы покажем, сколько часов он вернёт вашей команде</h2><p>Проведём демонстрацию CLIP Search на примере вашего фотоотчёта и предложим подходящую конфигурацию.</p><div class="contact-meta"><a href="tel:+74996776883"><?= icon('phone') ?> +7 (499) 677-68-83</a><a href="mailto:info@voidmedia.ru"><?= icon('mail') ?> info@voidmedia.ru</a></div></div>
      <div class="form-card contact-form-card" data-lead-scope>
        <div class="success-state<?= $submitted ? '' : ' is-hidden' ?>" data-success-state><span><?= icon('check') ?></span><h3>Заявка принята</h3><p>Спасибо! Мы свяжемся с вами, чтобы уточнить задачу и согласовать демонстрацию.</p><button type="button" data-send-another>Отправить ещё одну</button></div>
        <form action="/submit.php" method="post" data-lead-form<?= $submitted ? ' class="is-hidden"' : '' ?> aria-labelledby="contact-form-title">
          <div class="form-heading"><span id="contact-form-title">Заявка на демонстрацию</span><b>Ответим в рабочее время</b></div>
          <div class="form-grid">
            <label><span>Имя</span><input required name="name" autocomplete="name" placeholder="Как к вам обращаться"></label>
            <label><span>Телефон</span><input required name="phone" type="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__"></label>
            <label><span>Почта</span><input required name="email" type="email" autocomplete="email" placeholder="name@company.ru"></label>
            <label><span>Компания</span><input required name="company" autocomplete="organization" placeholder="Название агентства"></label>
          </div>
          <input class="honeypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <?php if ($turnstileConfigured): ?>
          <div class="turnstile-field" data-turnstile-widget data-sitekey="<?= htmlspecialchars($turnstileSiteKey, ENT_QUOTES, 'UTF-8') ?>" aria-label="Проверка защиты от автоматических отправок"></div>
          <?php else: ?>
          <p class="turnstile-config-error">Форма временно недоступна. Позвоните нам или напишите на почту.</p>
          <?php endif; ?>
          <label class="consent-check"><input required type="checkbox" name="consent" value="1"><span>Я согласен на <a href="/docs/personal-data-consent.pdf" target="_blank" rel="noopener" data-pdf-modal data-pdf-title="Согласие на обработку персональных данных">обработку персональных данных</a> и ознакомлен с <a href="/docs/privacy-policy.pdf" target="_blank" rel="noopener" data-pdf-modal data-pdf-title="Политика конфиденциальности">политикой конфиденциальности</a>.</span></label>
          <p class="form-error<?= $initialError === '' ? ' is-hidden' : '' ?>" data-form-error role="alert"><?= htmlspecialchars($initialError, ENT_QUOTES, 'UTF-8') ?></p>
          <button class="submit-button" type="submit" disabled>Получить демонстрацию <?= icon('arrow') ?></button>
        </form>
      </div>
    </div>
  </section>

  <footer>
    <div class="footer-top"><img src="/assets/logo.png" alt="CLIP Search"><p>Автоматизация проверки размещения наружной рекламы</p><a href="#top">Наверх ↑</a></div>
    <div class="footer-bottom"><span>© 2025–<?= date('Y') ?> CLIP Search × VOID MEDIA</span><div><a href="/docs/privacy-policy.pdf" target="_blank" rel="noopener" data-pdf-modal data-pdf-title="Политика конфиденциальности">Политика конфиденциальности</a><a href="/docs/personal-data-consent.pdf" target="_blank" rel="noopener" data-pdf-modal data-pdf-title="Согласие на обработку персональных данных">Согласие</a><a href="/docs/company-details.pdf" target="_blank" rel="noopener" data-pdf-modal data-pdf-title="Реквизиты">Реквизиты</a></div></div>
    <div class="footer-disclaimer"><p>Информация на сайте предназначена исключительно для юридических лиц и индивидуальных предпринимателей, приобретающих услуги в целях осуществления предпринимательской или профессиональной деятельности. Услуги физическим лицам для личных, семейных, домашних и иных нужд, не связанных с предпринимательской деятельностью, не оказываются.</p><p>Информация, размещённая на сайте, носит информационный характер и не является публичной офертой в соответствии со статьёй 437 ГК РФ. Условия оказания услуг определяются индивидуально и фиксируются в договоре.</p></div>
  </footer>
</main>

<div class="modal lead-modal" id="lead-modal" hidden role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
  <button class="modal-backdrop" type="button" data-lead-close aria-label="Закрыть"></button>
  <div class="modal-panel lead-panel" role="document">
    <button class="modal-close" type="button" data-lead-close aria-label="Закрыть">×</button>
    <div class="form-card" data-lead-scope>
      <div class="success-state<?= $submitted ? '' : ' is-hidden' ?>" data-success-state><span><?= icon('check') ?></span><h3>Заявка принята</h3><p>Спасибо! Мы свяжемся с вами, чтобы уточнить задачу и согласовать демонстрацию.</p><button type="button" data-send-another>Отправить ещё одну</button></div>
      <form id="lead-form" action="/submit.php" method="post" data-lead-form<?= $submitted ? ' class="is-hidden"' : '' ?>>
        <div class="form-heading"><span id="lead-modal-title">Оставить заявку</span><b>Ответим в рабочее время</b></div>
        <div class="form-grid">
          <label><span>Имя</span><input required name="name" autocomplete="name" placeholder="Как к вам обращаться"></label>
          <label><span>Телефон</span><input required name="phone" type="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__"></label>
          <label><span>Почта</span><input required name="email" type="email" autocomplete="email" placeholder="name@company.ru"></label>
          <label><span>Компания</span><input required name="company" autocomplete="organization" placeholder="Название агентства"></label>
        </div>
        <input class="honeypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <?php if ($turnstileConfigured): ?>
        <div class="turnstile-field" data-turnstile-widget data-sitekey="<?= htmlspecialchars($turnstileSiteKey, ENT_QUOTES, 'UTF-8') ?>" aria-label="Проверка защиты от автоматических отправок"></div>
        <?php else: ?>
        <p class="turnstile-config-error">Форма временно недоступна. Позвоните нам или напишите на почту.</p>
        <?php endif; ?>
        <label class="consent-check"><input required type="checkbox" name="consent" value="1"><span>Я согласен на <a href="/docs/personal-data-consent.pdf" target="_blank" rel="noopener" data-pdf-modal data-pdf-title="Согласие на обработку персональных данных">обработку персональных данных</a> и ознакомлен с <a href="/docs/privacy-policy.pdf" target="_blank" rel="noopener" data-pdf-modal data-pdf-title="Политика конфиденциальности">политикой конфиденциальности</a>.</span></label>
        <p class="form-error<?= $initialError === '' ? ' is-hidden' : '' ?>" data-form-error role="alert"><?= htmlspecialchars($initialError, ENT_QUOTES, 'UTF-8') ?></p>
        <button class="submit-button" type="submit" disabled>Получить демонстрацию <?= icon('arrow') ?></button>
        <div class="form-disclaimer"><p>Информация на сайте предназначена исключительно для юридических лиц и индивидуальных предпринимателей, приобретающих услуги в целях осуществления предпринимательской или профессиональной деятельности. Услуги физическим лицам для личных, семейных, домашних и иных нужд, не связанных с предпринимательской деятельностью, не оказываются.</p><p>Информация, размещённая на сайте, носит информационный характер и не является публичной офертой в соответствии со статьёй 437 ГК РФ. Условия оказания услуг определяются индивидуально и фиксируются в договоре.</p></div>
      </form>
    </div>
  </div>
</div>

<div class="modal pdf-modal" id="pdf-modal" hidden role="dialog" aria-modal="true" aria-labelledby="pdf-modal-title">
  <button class="modal-backdrop" type="button" data-pdf-close aria-label="Закрыть документ"></button>
  <div class="modal-panel pdf-panel" role="document">
    <div class="pdf-modal-header">
      <h3 id="pdf-modal-title">Документ</h3>
      <a href="#" target="_blank" rel="noopener" id="pdf-open-link">Открыть в новой вкладке <?= icon('arrow') ?></a>
      <button class="modal-close" type="button" data-pdf-close aria-label="Закрыть">×</button>
    </div>
    <iframe id="pdf-frame" title="Просмотр документа PDF" src="about:blank"></iframe>
  </div>
</div>

<script src="/assets/main.js?v=20260901-2" defer></script>
<?php if ($turnstileConfigured): ?><script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&amp;onload=clipsearchTurnstileReady" defer></script><?php endif; ?>
</body>
</html>
