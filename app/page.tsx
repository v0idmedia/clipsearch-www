'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  Clock3,
  Cpu,
  FileSpreadsheet,
  FolderCheck,
  Gauge,
  Image as ImageIcon,
  Layers3,
  Mail,
  MapPin,
  Phone,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  TextSearch,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const features = [
  {
    icon: ScanSearch,
    title: 'Находит макет в сложном кадре',
    text: 'Распознаёт размещение под углом, при размытии, бликах, стекле и частичном перекрытии.',
    tag: 'Machine Vision',
  },
  {
    icon: Layers3,
    title: 'Не путает похожие макеты',
    text: 'Сравнивает ключевые точки, геометрию, визуальную структуру и текстовые области — близкие версии остаются разными.',
    tag: 'Точный матчинг',
  },
  {
    icon: FolderCheck,
    title: 'Сортирует результат',
    text: 'Автоматически раскладывает исходники по папкам _FOUND и _NOTFOUND для быстрой контрольной проверки.',
    tag: 'Готово сейчас',
  },
  {
    icon: FileSpreadsheet,
    title: 'Формирует XLSX-отчёт',
    text: 'Статус, процент совпадения, метод проверки и ссылки на исходный и размеченный кадр — в одной таблице.',
    tag: 'Готово сейчас',
  },
  {
    icon: TextSearch,
    title: 'Проверяет текст на макете',
    text: 'Дополнительная валидация по текстовым областям повышает точность в визуально сложных сценах.',
    tag: 'Новая версия',
  },
  {
    icon: Zap,
    title: 'Масштабируется на GPU',
    text: 'Работает на CPU, а опциональное CUDA-ускорение помогает обрабатывать растущие архивы в 5–20 раз быстрее.',
    tag: 'Опция',
  },
];

const faqs = [
  ['Какие фотоотчёты можно проверять?', 'CLIP Search работает с JPG, JPEG, PNG, BMP, TIFF, WEBP и HEIC. Можно выбрать отдельный кадр или целую папку с вложенными каталогами.'],
  ['Что будет, если фото снято под углом?', 'Алгоритм проверяет геометрию совпадения и перспективу. Он рассчитан на реальные условия съёмки: наклон, шум, блики, размытие и частичное перекрытие макета.'],
  ['Программа различает похожие рекламные макеты?', 'Да. Совпадение проходит несколько проверок: локальные признаки, геометрия, визуальная схожесть, а в новой версии — ещё и текстовые области. Это снижает риск перепутать близкие версии креатива.'],
  ['Нужна ли мощная видеокарта?', 'Нет, базовый и улучшенный поиск работают на CPU. GPU — опциональное ускорение для больших потоков фото и растущих архивов.'],
  ['Можно сначала проверить на наших фотографиях?', 'Да. На демонстрации можно провести пилот на вашем макете и небольшой выборке фотоотчёта, затем подобрать конфигурацию и пороги проверки.'],
];

type LegalType = 'policy' | 'consent' | 'details' | null;

export default function Home() {
  const [photos, setPhotos] = useState(500);
  const [success, setSuccess] = useState(false);
  const [legal, setLegal] = useState<LegalType>(null);
  const [openFaq, setOpenFaq] = useState(0);

  const saving = useMemo(() => {
    const manualHours = Math.max(1, Math.round((photos * 1.2) / 60));
    const clipMinutes = Math.max(3, Math.round((photos * 1.2) / 8));
    return { manualHours, clipMinutes, saved: Math.max(1, Math.round(manualHours * 0.9)) };
  }, [photos]);

  function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(true);
  }

  return (
    <main>
      <header className="site-header">
        <a href="#top" className="brand" aria-label="CLIP Search — на главную">
          <img src="/assets/logo.png" alt="CLIP Search" />
        </a>
        <nav aria-label="Основная навигация">
          <a href="#how">Как работает</a>
          <a href="#features">Возможности</a>
          <a href="#pricing">Тарифы</a>
        </nav>
        <a className="header-cta" href="#contact">Получить демо</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy reveal">
          <div className="eyebrow"><Sparkles size={16} /> Machine Vision + AI</div>
          <h1>Фотоотчёты проверяются <em>сами</em></h1>
          <p className="hero-lead">
            CLIP Search находит рекламный макет на сотнях фотографий стендов и
            сокращает ручную проверку на 80–95%.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#contact">Запросить демонстрацию <ArrowRight size={18} /></a>
            <a className="button ghost" href="#how">Посмотреть, как это работает</a>
          </div>
          <ul className="hero-points">
            <li><Check size={17} /> 100+ фото за минуты</li>
            <li><Check size={17} /> XLSX-отчёт без ручной сверки</li>
          </ul>
        </div>

        <div className="search-demo reveal delay-1" aria-label="Пример поиска макета на фотографии стенда">
          <div className="demo-topline">
            <span className="demo-dot" />
            <span>CLIP Search / проверка размещения</span>
            <span className="demo-status">AI анализирует</span>
          </div>
          <div className="demo-body">
            <div className="layout-card">
              <span>Искомый макет</span>
              <img src="/assets/layout.jpg" alt="Искомый рекламный макет Билайн" />
              <b>bogorodskoe.jpg</b>
            </div>
            <div className="scan-line" aria-hidden="true"><ArrowRight size={22} /></div>
            <div className="stand-card">
              <img src="/assets/stand.jpg" alt="Фото рекламного стенда с несколькими объявлениями" />
              <span className="match-box"><i>совпадение</i><b>96%</b></span>
            </div>
          </div>
          <div className="demo-footer">
            <span><b>1</b> точное совпадение</span>
            <span className="found-badge"><Check size={15} /> Макет найден</span>
          </div>
        </div>
      </section>

      <section className="metric-strip" aria-label="Ключевые показатели">
        <div><b>−80–95%</b><span>времени на проверку</span></div>
        <div><b>в 5–10 раз</b><span>быстрее готов отчёт</span></div>
        <div><b>−90%</b><span>ручного труда</span></div>
        <div><b>−70–85%</b><span>ошибок оператора</span></div>
      </section>

      <section className="section problem-section">
        <div className="section-heading narrow">
          <span className="kicker">Не листать. Не сверять. Не ошибаться.</span>
          <h2>Пока менеджер смотрит фото по одному, CLIP Search уже готовит отчёт</h2>
          <p>Программа берёт на себя однообразную часть контроля размещения, а специалист подключается только там, где действительно нужна оценка.</p>
        </div>
        <div className="compare-grid">
          <article className="compare-card manual">
            <span className="compare-label"><Clock3 size={17} /> Вручную</span>
            <strong>4–8 часов</strong>
            <p>Открыть каждый файл, найти макет, сверить версию, отметить статус, перенести результат в таблицу.</p>
            <div className="manual-stack" aria-hidden="true">
              {[0,1,2,3,4].map((n) => <span key={n} style={{ transform: `translate(${n * 7}px, ${n * 5}px) rotate(${n - 2}deg)` }} />)}
            </div>
          </article>
          <article className="compare-card auto">
            <span className="compare-label"><WandSparkles size={17} /> С CLIP Search</span>
            <strong>несколько минут</strong>
            <p>Выбрать макет и папку. Алгоритм проверит снимки, разметит совпадения и соберёт XLSX.</p>
            <div className="auto-progress" aria-hidden="true"><span /><i>100%</i></div>
          </article>
        </div>
      </section>

      <section className="section how-section" id="how">
        <div className="section-heading">
          <span className="kicker light">Простой сценарий</span>
          <h2>От исходного макета до готового списка размещений — три шага</h2>
        </div>
        <div className="steps-grid">
          <article><span className="step-number">01</span><ImageIcon /><h3>Укажите макет</h3><p>Загрузите один или несколько эталонов рекламной кампании.</p></article>
          <article><span className="step-number">02</span><Search /><h3>Выберите фотоотчёт</h3><p>Папка может содержать сотни снимков и вложенные каталоги.</p></article>
          <article><span className="step-number">03</span><FileSpreadsheet /><h3>Получите результат</h3><p>Статусы, проценты совпадения, разметка и ссылки появятся в XLSX.</p></article>
        </div>
        <div className="app-showcase">
          <div className="app-copy">
            <span className="mini-label">Десктопное приложение</span>
            <h3>Понятно с первого запуска</h3>
            <p>CLIP Search работает локально на Windows. Фотографии не нужно отправлять в сторонние облачные сервисы: выберите файл макета, папку и запустите поиск.</p>
            <ul>
              <li><CheckCircle2 /> Настраиваемые пороги точности</li>
              <li><CheckCircle2 /> Лог событий и проценты совпадения</li>
              <li><CheckCircle2 /> Лицензирование и офлайн-режим</li>
            </ul>
          </div>
          <div className="app-window"><img src="/assets/app-screen.jpg" alt="Интерфейс CLIP Search со списком найденных размещений" /></div>
        </div>
      </section>

      <section className="section similarity-section">
        <div className="similarity-visual" aria-label="Сравнение похожих рекламных макетов">
          <div className="similarity-toolbar"><span /><b>Проверка похожих макетов</b><i>3 версии</i></div>
          <div className="creative-row">
            <div className="creative selected"><img src="/assets/layout.jpg" alt="Выбранный макет" /><span><CircleCheck /> Выбран</span></div>
            <div className="creative variant warm"><img src="/assets/layout.jpg" alt="Похожий, но другой макет" /><span><X /> Другая версия</span></div>
            <div className="creative variant mono"><img src="/assets/layout.jpg" alt="Ещё один похожий макет" /><span><X /> Другая версия</span></div>
          </div>
          <div className="match-proof"><ShieldCheck /><span><b>Точное различение</b>Геометрия + ключевые точки + визуальная структура + текст</span></div>
        </div>
        <div className="similarity-copy">
          <span className="kicker">Точность важнее похожести</span>
          <h2>Разные макеты не смешиваются в одном отчёте</h2>
          <p>CLIP Search проверяет не только общий цвет и форму. Многоступенчатое сопоставление отличает близкие версии креативов, даже если меняются лишь текст, цена или небольшой визуальный элемент.</p>
          <div className="proof-list"><span><b>RANSAC</b> проверяет геометрию</span><span><b>Similarity</b> подтверждает изображение</span><span><b>Text check</b> уточняет версию</span></div>
        </div>
      </section>

      <section className="section features-section" id="features">
        <div className="section-heading">
          <span className="kicker">Технологии новой версии</span>
          <h2>Уверенно работает с реальными, а не идеальными фотоотчётами</h2>
          <p>Текущие SIFT/ORB, гомография и similarity дополняются ROI-детекцией, устойчивыми локальными признаками, проверкой текста и GPU-ускорением.</p>
        </div>
        <div className="features-grid">
          {features.map(({ icon: Icon, title, text, tag }) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon"><Icon /></div><span className="feature-tag">{tag}</span>
              <h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
        <div className="tech-line" aria-label="Технологии CLIP Search">
          <span>OpenCV</span><span>SIFT / ORB</span><span>RANSAC</span><span>SuperPoint</span><span>LightGlue</span><span>CRAFT</span><span>YOLO</span><span>CUDA</span>
        </div>
      </section>

      <section className="section calculator-section">
        <div className="calculator-copy">
          <span className="kicker light">Калькулятор рутины</span>
          <h2>Сколько времени можно вернуть команде?</h2>
          <p>Передвиньте ползунок и оцените порядок экономии при средней ручной проверке 1,2 минуты на кадр.</p>
          <label htmlFor="photo-range">Фотографий в месяц <b>{photos.toLocaleString('ru-RU')}</b></label>
          <input id="photo-range" type="range" min="100" max="5000" step="100" value={photos} onChange={(event) => setPhotos(Number(event.target.value))} />
          <div className="range-labels"><span>100</span><span>5 000</span></div>
        </div>
        <div className="saving-card">
          <div><span>Ручная проверка</span><b>{saving.manualHours} ч</b></div>
          <div><span>CLIP Search</span><b>≈ {saving.clipMinutes} мин</b></div>
          <div className="saving-total"><Gauge /><span>Команда экономит</span><b>до {saving.saved} ч/мес.</b></div>
        </div>
      </section>

      <section className="section pricing-section" id="pricing">
        <div className="section-heading narrow">
          <span className="kicker">Варианты запуска</span>
          <h2>Начните с пилота — масштабируйте после результата</h2>
          <p>Предварительная модель стоимости для продаж. Финальная лицензия зависит от числа рабочих мест, объёма фото и требуемых модулей.</p>
        </div>
        <div className="pricing-grid">
          <article className="price-card">
            <span className="price-name">Пилот</span><h3>Бесплатно</h3><p>Проверим ваш макет на тестовой выборке и покажем итоговый отчёт.</p>
            <ul><li><Check /> 1 рекламный макет</li><li><Check /> До 100 фото</li><li><Check /> Демонстрация результата</li></ul>
            <a href="#contact" className="price-button">Запросить пилот <ChevronRight /></a>
          </article>
          <article className="price-card featured">
            <span className="popular">Популярный</span><span className="price-name">Профессиональный</span><h3>от 59 000 ₽<small>/год</small></h3><p>Для регулярной проверки фотоотчётов одной команды.</p>
            <ul><li><Check /> Неограниченные папки</li><li><Check /> XLSX и разметка кадров</li><li><Check /> Устойчивый поиск и ROI</li><li><Check /> Обновления и поддержка</li></ul>
            <a href="#contact" className="price-button">Получить предложение <ChevronRight /></a>
          </article>
          <article className="price-card">
            <span className="price-name">Корпоративный</span><h3>По запросу</h3><p>Для больших потоков, нескольких команд и индивидуального контура.</p>
            <ul><li><Check /> Несколько рабочих мест</li><li><Check /> GPU-ускорение</li><li><Check /> Текстовая валидация</li><li><Check /> Настройка под ваши данные</li></ul>
            <a href="#contact" className="price-button">Обсудить задачу <ChevronRight /></a>
          </article>
        </div>
      </section>

      <section className="section faq-section">
        <div className="faq-title"><span className="kicker">Ответы по делу</span><h2>Частые вопросы</h2><p>Если вашего вопроса нет в списке, покажем программу на живой демонстрации.</p></div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
            <article className={openFaq === index ? 'faq-item open' : 'faq-item'} key={question}>
              <button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{question}</span><i>{openFaq === index ? '−' : '+'}</i></button>
              <div className="faq-answer"><p>{answer}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-shell">
          <div className="contact-copy">
            <span className="kicker light">Покажите один макет</span>
            <h2>А мы покажем, сколько часов он вернёт вашей команде</h2>
            <p>Оставьте контакты — проведём демонстрацию CLIP Search на примере вашего фотоотчёта и предложим конфигурацию.</p>
            <div className="contact-meta"><a href="tel:+74996776883"><Phone /> +7 (499) 677-68-83</a><a href="mailto:info@voidmedia.ru"><Mail /> info@voidmedia.ru</a></div>
          </div>
          <div className="form-card">
            {success ? (
              <div className="success-state"><span><Check /></span><h3>Заявка принята</h3><p>Спасибо! Мы свяжемся с вами, чтобы уточнить задачу и согласовать демонстрацию.</p><button type="button" onClick={() => setSuccess(false)}>Отправить ещё одну</button></div>
            ) : (
              <form onSubmit={submitLead}>
                <div className="form-heading"><span>Заявка на демонстрацию</span><b>Ответим в рабочее время</b></div>
                <div className="form-grid">
                  <label><span>Имя</span><Input required name="name" autoComplete="name" placeholder="Как к вам обращаться" /></label>
                  <label><span>Телефон</span><Input required name="phone" type="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" /></label>
                  <label><span>Почта</span><Input required name="email" type="email" autoComplete="email" placeholder="name@company.ru" /></label>
                  <label><span>Компания</span><Input required name="company" autoComplete="organization" placeholder="Название агентства" /></label>
                </div>
                <label className="consent-check"><input required type="checkbox" /><span>Я согласен на <button type="button" onClick={() => setLegal('consent')}>обработку персональных данных</button> и ознакомлен с <button type="button" onClick={() => setLegal('policy')}>политикой конфиденциальности</button>.</span></label>
                <button className="submit-button" type="submit">Получить демонстрацию <ArrowRight /></button>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-top">
          <img src="/assets/logo.png" alt="CLIP Search" />
          <p>Автоматизация проверки размещения рекламных макетов на фотоотчётах.</p>
          <a href="#top">Наверх ↑</a>
        </div>
        <div className="footer-bottom">
          <span>© 2026 CLIP Search / VOID MEDIA</span>
          <div><button type="button" onClick={() => setLegal('policy')}>Политика конфиденциальности</button><button type="button" onClick={() => setLegal('consent')}>Согласие</button><button type="button" onClick={() => setLegal('details')}>Реквизиты</button></div>
        </div>
      </footer>

      <LegalDialog type={legal} onClose={() => setLegal(null)} />
    </main>
  );
}

function LegalDialog({ type, onClose }: { type: LegalType; onClose: () => void }) {
  const titles = { policy: 'Политика конфиденциальности', consent: 'Согласие на обработку персональных данных', details: 'Реквизиты и контакты' };
  return (
    <Dialog open={Boolean(type)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="legal-dialog">
        <DialogHeader>
          <DialogTitle>{type ? titles[type] : ''}</DialogTitle>
          <DialogDescription>Документы сайта CLIP Search</DialogDescription>
        </DialogHeader>
        <div className="legal-copy">
          {type === 'policy' && <>
            <h4>1. Общие положения</h4><p>Настоящая политика описывает порядок обработки данных посетителей сайта CLIP Search. Оператор использует сведения только для ответа на заявки, подготовки демонстрации и исполнения договорных обязательств.</p>
            <h4>2. Какие данные обрабатываются</h4><p>Имя, номер телефона, адрес электронной почты, название компании, а также технические сведения, автоматически передаваемые браузером.</p>
            <h4>3. Цели и срок обработки</h4><p>Данные используются для обратной связи, консультации, подготовки предложения и улучшения работы сайта. Сведения хранятся не дольше, чем это требуется для указанных целей или установлено законом.</p>
            <h4>4. Права пользователя</h4><p>Пользователь может запросить уточнение, блокирование или удаление своих данных, направив обращение по адресу info@voidmedia.ru.</p>
          </>}
          {type === 'consent' && <>
            <p>Отправляя форму, я свободно, своей волей и в своём интересе даю согласие оператору CLIP Search / VOID MEDIA на обработку указанных мною персональных данных: имени, телефона, электронной почты и названия компании.</p>
            <p>Разрешённые действия: сбор, запись, систематизация, хранение, уточнение, использование и удаление данных с применением средств автоматизации или без них.</p>
            <p>Цель обработки — обратная связь по заявке, проведение демонстрации, подготовка коммерческого предложения и заключение договора. Согласие действует до достижения целей обработки и может быть отозвано письмом на info@voidmedia.ru.</p>
          </>}
          {type === 'details' && <>
            <h4>Правообладатель и разработчик</h4><p><b>VOID MEDIA</b><br />Программный продукт: CLIP Search</p>
            <p><Phone /> +7 (499) 677-68-83<br /><Mail /> info@voidmedia.ru<br /><MapPin /> Москва, ул. Люблинская, 141</p>
            <p>Юридические и банковские реквизиты указываются в договоре и предоставляются по запросу перед оплатой.</p>
          </>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
