#!/usr/bin/env node
// Генератор страниц сайта «Навигатор среды». Запуск: node build.js
// Результат — готовые статические HTML (папка /<slug>/index.html), sitemap.xml, robots.txt.
const fs = require('fs');
const path = require('path');

const SITE = (process.env.SITE_URL || 'https://navigator-sredy.example').replace(/\/$/, ''); // замените на реальный домен
const ORG = 'АНО «Навигатор среды»';
const ORG_FULL = 'Автономная некоммерческая организация «Навигатор среды: доступные решения для туризма и досуга»';
const PHONE = '+7 (913) 182-96-54';
const PHONE_HREF = '+79131829654';
const EMAIL = 'grigoryeva_irina@bk.ru';
const ADDRESS = '660125, Красноярский край, г. Красноярск, пр-кт Комсомольский, д. 11, кв. 53';

// ---------- иллюстрации-заглушки вместо фотографий ----------
const scenes = {
  a: `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfeceb"/><stop offset="1" stop-color="#f7ecd4"/></linearGradient></defs><rect width="400" height="300" fill="url(#ga)"/><circle cx="300" cy="70" r="34" fill="#f0a04b" opacity=".85"/><path d="M0 190 L90 100 L150 160 L230 80 L330 190 L400 140 V300 H0Z" fill="#7fb7ae"/><path d="M0 230 L70 160 L140 215 L210 150 L300 230 L400 180 V300 H0Z" fill="#2f7a6c"/><path d="M0 262 Q100 236 200 260 T400 250 V300 H0Z" fill="#14463c"/></svg>`,
  b: `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="#e6f3ef"/><circle cx="90" cy="70" r="28" fill="#f0a04b" opacity=".8"/><path d="M0 170 Q100 130 200 165 T400 150 V300 H0Z" fill="#a9d6cd"/><g fill="#14463c"><path d="M60 250 L85 150 L110 250Z"/><path d="M110 250 L140 120 L170 250Z"/><path d="M300 250 L325 160 L350 250Z"/><path d="M250 250 L280 130 L310 250Z"/></g><path d="M0 250 H400 V300 H0Z" fill="#2f7a6c"/><path d="M170 300 Q200 255 240 250 L260 250 Q215 262 200 300Z" fill="#f7ecd4"/></svg>`,
  c: `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="#f7ecd4"/><rect y="170" width="400" height="130" fill="#7fc3be"/><path d="M0 200 Q50 190 100 200 T200 200 T300 200 T400 200" stroke="#dff1ee" stroke-width="3" fill="none"/><path d="M0 232 Q50 222 100 232 T200 232 T300 232 T400 232" stroke="#dff1ee" stroke-width="3" fill="none"/><path d="M0 170 L60 120 L120 160 L190 100 L260 165 L330 125 L400 170Z" fill="#2f7a6c"/><rect x="40" y="150" width="320" height="14" rx="3" fill="#14463c"/><g fill="#14463c"><rect x="70" y="164" width="6" height="30"/><rect x="190" y="164" width="6" height="30"/><rect x="310" y="164" width="6" height="30"/></g><circle cx="320" cy="60" r="26" fill="#f0a04b" opacity=".85"/></svg>`
};
const sceneTemplates = Object.entries(scenes).map(([k, v]) => `<template id="scene-${k}">${v}</template>`).join('');

function photo(scene, caption, alt, src, cls = '') {
  const img = src ? ` data-src="/images/${src}" data-alt="${alt}"` : '';
  return `<figure class="photo ${cls}"${img} role="img" aria-label="${alt}">${scenes[scene]}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
}

// ---------- иконки (малое количество, простые) ----------
const I = {
  route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.6 3-6 7-6s7 2.4 7 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14c3 0 5 1.8 5 5"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>',
  museum: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/></svg>',
  city: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V9l6-4v16M10 21V12l10 3v6M3 21h18"/></svg>',
  team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3"/><circle cx="5" cy="9" r="2"/><circle cx="19" cy="9" r="2"/><path d="M6 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/></svg>'
};
const ico = (n) => `<span class="ico" aria-hidden="true">${I[n]}</span>`;

const logoSvg = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#14463c"/><path d="M20 7l5 13-5 13-5-13z" fill="#f0a04b"/><path d="M20 7l-5 13h10z" fill="#fff" opacity=".9"/><circle cx="20" cy="20" r="2.4" fill="#14463c"/></svg>`;

// ---------- каркас страницы ----------
const NAV = [
  ['/', 'Главная'], ['/o-nas/', 'О нас'], ['/napravleniya/', 'Направления'],
  ['/proekty/', 'Проекты'], ['/obuchenie/', 'Обучение'], ['/novosti/', 'Новости'], ['/kontakty/', 'Контакты']
];

function layout(p, body) {
  const url = SITE + p.path;
  const nav = NAV.map(([h, t]) => `<a href="${h}"${h === p.path ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  const mnav = NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join('');
  const ld = {
    '@context': 'https://schema.org', '@type': 'NGO', name: ORG, legalName: ORG_FULL, url: SITE + '/',
    address: { '@type': 'PostalAddress', addressLocality: 'Красноярск', addressRegion: 'Красноярский край', addressCountry: 'RU' },
    telephone: PHONE, email: EMAIL,
    description: 'Доступный и инклюзивный туризм и досуг: доступные маршруты, оценка доступности объектов, паспорта доступности, обучение и консультации.'
  };
  const crumbs = p.path === '/' ? '' : {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: p.crumb, item: url }]
  };
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:locale" content="ru_RU">
<meta property="og:title" content="${p.title}"><meta property="og:description" content="${p.desc}"><meta property="og:url" content="${url}">
<meta name="theme-color" content="#14463c">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(logoSvg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '))}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap&subset=cyrillic">
<link rel="stylesheet" href="/assets/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${crumbs ? `<script type="application/ld+json">${JSON.stringify(crumbs)}</script>` : ''}
</head>
<body>
<a class="skip" href="#main">К содержанию</a>
<header class="header">
  <div class="wrap header__in">
    <a class="logo" href="/" aria-label="${ORG} — на главную">${logoSvg}<span>Навигатор среды<small>доступный туризм и досуг</small></span></a>
    <nav class="nav" aria-label="Основное меню">${nav}</nav>
    <a class="btn btn--sun" href="/kontakty/#form">Обсудить задачу</a>
    <button class="burger" type="button" aria-label="Меню" aria-expanded="false" aria-controls="mnav"><span></span></button>
  </div>
  <nav class="mobile-nav" id="mnav" aria-label="Мобильное меню">${mnav}<a class="btn btn--sun" href="/kontakty/#form">Обсудить задачу</a></nav>
</header>
<main id="main">
${body}
</main>
<footer class="footer">
  <div class="wrap">
    <div class="footer__grid">
      <div><strong style="color:#fff;font-size:18px">${ORG}</strong>
        <p style="margin-top:10px">Доступные решения для туризма и досуга. Красноярск.</p></div>
      <div><h4>Разделы</h4><ul>${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></div>
      <div><h4>Связаться</h4><ul>
        <li><a href="tel:${PHONE_HREF}">${PHONE}</a></li>
        <li><a href="mailto:${EMAIL}">${EMAIL}</a></li>
        <li>Красноярск</li></ul></div>
    </div>
    <p class="footer__legal">${ORG_FULL}. Место нахождения: г. Красноярск. ОГРН 1262400015327, ИНН 2465374588.</p>
  </div>
</footer>
<div class="fab" aria-label="Быстрая связь"><a class="btn btn--sun" href="/kontakty/#form">Написать нам</a><a class="btn btn--forest" href="tel:${PHONE_HREF}" aria-label="Позвонить">Позвонить</a></div>
${sceneTemplates}
<script src="/assets/app.js" defer></script>
</body>
</html>
`;
}

// ---------- переиспользуемые блоки ----------
const head = (eyebrow, h2, lead) => `<div class="head">${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h2>${h2}</h2>${lead ? `<p class="lead">${lead}</p>` : ''}</div>`;

const DIRECTIONS = [
  ['route', 'Доступные маршруты', 'Разрабатываем и адаптируем туристические, экскурсионные маршруты и программы отдыха с учётом требований доступности.'],
  ['check', 'Оценка доступности', 'Обследуем и оцениваем доступность объектов, территорий, маршрутов и сервисов.'],
  ['doc', 'Паспорта доступности', 'Готовим паспорта доступности, рекомендации, заключения и методические материалы.'],
  ['learn', 'Обучение', 'Проводим тренинги, мастер-классы, вебинары и семинары.'],
  ['chat', 'Консультации', 'Помогаем организациям разобраться, как сделать услуги, маршруты и пространство более доступными.'],
  ['flag', 'Проекты', 'Разрабатываем и реализуем программы и проекты в сфере доступной среды, туризма и досуга.'],
  ['search', 'Исследования', 'Изучаем, как устроены туризм и досуг с точки зрения доступности, и опираемся на это в рекомендациях.']
];

const secDirections = (full) => `<section class="section" id="napravleniya"><div class="wrap">
${head('Что мы делаем', 'Семь направлений — одна цель: чтобы путешествовать и отдыхать было удобно', full ? 'Каждое направление — часть одной цепочки: от понимания потребностей до реальных изменений на маршруте или объекте.' : '')}
<div class="grid grid--3">${DIRECTIONS.map(([i, t, d], n) => `<article class="card${n === 6 ? ' card--accent' : ''}">${ico(i)}<h3>${t}</h3><p>${d}</p></article>`).join('')}
<a class="card card--accent" href="/kontakty/#form">${ico('chat')}<h3>Не нашли свою задачу?</h3><p>Расскажите, что вы хотите сделать — вместе подберём формат.</p><span class="link-arrow" style="margin-top:14px;color:#fff">Получить консультацию</span></a></div>
</div></section>`;

const secAudience = () => `<section class="section section--soft" id="dlya-kogo"><div class="wrap">
${head('Для кого', 'Решения для людей и для тех, кто создаёт для них среду')}
<div class="grid grid--3">
${[['people', 'Для людей и семей', 'Маршруты и отдых, которые учитывают разные потребности и возможности.'],
  ['bag', 'Для туристического бизнеса', 'Помогаем сделать туристические продукты и сервисы доступнее.'],
  ['museum', 'Для объектов культуры и досуга', 'Оцениваем доступность и предлагаем конкретные решения.'],
  ['city', 'Для муниципалитетов и территорий', 'Помогаем развивать доступную туристическую и досуговую инфраструктуру.'],
  ['team', 'Для организаций', 'Консультируем, обучаем сотрудников и разрабатываем практические решения.']]
  .map(([i, t, d]) => `<article class="card audience">${ico(i)}<div><h3>${t}</h3><p>${d}</p></div></article>`).join('')}
</div></div></section>`;

const secMore = () => `<section class="section section--dark" id="bolshe-chem-pandus"><div class="wrap">
<p class="eyebrow">Больше, чем пандус</p>
<h2>Доступность — это не только физическая среда</h2>
<p class="lead">Пандус нужен, но поездка состоит из множества звеньев. Если одно из них недоступно, весь маршрут теряет смысл.</p>
<ul class="aspects">${['Понятная информация', 'Удобная навигация', 'Доступный маршрут', 'Подготовленный персонал', 'Возможность получить услугу', 'Комфортное пребывание', 'Безопасность', 'Самостоятельные путешествия и отдых'].map(a => `<li>${a}</li>`).join('')}</ul>
<p class="quote">Мы смотрим на доступность комплексно — от маршрута и пространства до информации и качества сервиса.</p>
</div></section>`;

const secApproach = () => `<section class="section" id="podkhod"><div class="wrap">
${head('Наш подход', 'Четыре шага от вопроса к реальным изменениям')}
<ol class="steps">
${[['Изучаем', 'Объект, маршрут, потребности людей и существующие ограничения.'],
  ['Оцениваем', 'Определяем, что уже работает и где возникают барьеры.'],
  ['Предлагаем решения', 'Формируем конкретные рекомендации, маршруты и изменения.'],
  ['Помогаем реализовать', 'Сопровождаем проекты и помогаем переводить рекомендации в реальные изменения.']]
  .map(([t, d]) => `<li class="step"><h3>${t}</h3><p>${d}</p></li>`).join('')}
</ol></div></section>`;

const emptyProject = `<article class="pcard pcard--empty"><figure class="photo" role="img" aria-label="Здесь будет фотография проекта">${scenes.a}<figcaption>Фото проекта</figcaption></figure>
<div class="pcard__body"><h3>Название проекта</h3><span class="placeholder-line"></span><span class="placeholder-line s"></span>
<dl><div><dt>Для кого</dt><dd>будет добавлено</dd></div><div><dt>Что сделано</dt><dd>будет добавлено</dd></div><div><dt>Результат</dt><dd>будет добавлено</dd></div></dl>
<span class="btn btn--line" aria-disabled="true" style="opacity:.5">Подробнее</span></div></article>`;

const secProjects = (limit, withLink) => `<section class="section" id="proekty"><div class="wrap">
${head('Проекты', 'Истории маршрутов и реализованные решения', 'Здесь будут проекты организации: что было сделано, для кого и какой получился результат.')}
<div class="grid grid--3" data-projects="${limit}">${emptyProject.repeat(3)}</div>
<p class="note">Раздел готов к наполнению: проекты добавляются через панель управления <a href="/admin/">/admin</a> — фотография, описание, аудитория, что сделано, результат. Мы не публикуем данные, которых нет.</p>
${withLink ? '<div class="btn-row"><a class="btn btn--line" href="/proekty/">Все проекты</a></div>' : ''}
</div></section>`;

const secTourism = () => `<section class="section section--soft" id="puteshestviya"><div class="wrap tour__grid">
<div><p class="eyebrow">Доступный туризм</p><h2>Путешествия должны быть возможны</h2>
<p class="lead">Доступный туризм — это возможность не просто приехать в новое место, а действительно воспользоваться маршрутом, увидеть достопримечательности, получить услугу, отдохнуть и вернуться с хорошими впечатлениями.</p>
<div class="btn-row"><a class="btn btn--forest" href="/napravleniya/">Узнать подробнее</a></div></div>
<div class="mosaic">
${photo('a', 'Природа Красноярского края', 'Пейзаж Красноярского края: горы и река', 'tourism-nature.jpg')}
${photo('b', 'Прогулки', 'Прогулка на природе, люди разных возрастов', 'tourism-walk.jpg')}
${photo('c', 'Экскурсии', 'Экскурсия по городу, семья с детьми', 'tourism-excursion.jpg')}
</div></div></section>`;

const secBiz = () => `<section class="section" id="dlya-organizatsiy"><div class="wrap"><div class="biz">
<div><p class="eyebrow" style="color:#8fd8d3">Для организаций</p><h2>Хотите сделать свой объект или туристический продукт доступнее?</h2>
<p>Проведём обследование, оценим доступность, подготовим рекомендации и поможем разработать практические решения.</p></div>
<div><a class="btn btn--sun" href="/kontakty/#form">Обсудить задачу</a></div></div></div></section>`;

const secTraining = () => `<section class="section section--soft" id="obuchenie"><div class="wrap split">
<div><p class="eyebrow">Обучение</p><h2>Доступная среда начинается с понимания</h2>
<p class="lead">Помогаем сотрудникам организаций понимать потребности разных людей и создавать качественный сервис без формального подхода.</p>
<div class="btn-row"><a class="btn btn--forest" href="/obuchenie/">Узнать об обучении</a></div></div>
<div class="formats">${[['Тренинги', 'практика и разбор ситуаций'], ['Мастер-классы', 'учимся на примерах'], ['Вебинары', 'онлайн, из любого города'], ['Семинары', 'для команд и отраслей']].map(([t, d]) => `<div class="format">${t}<span>${d}</span></div>`).join('')}</div>
</div></section>`;

const secAboutTeaser = () => `<section class="section" id="o-nas"><div class="wrap split">
<div><p class="eyebrow">О нас</p><h2>Навигатор среды — о людях, маршрутах и возможностях</h2>
<p class="lead">Мы создали организацию, чтобы туризм и досуг в Красноярске и крае были удобны для разных людей — и чтобы это было не исключением, а нормой.</p>
<div class="btn-row"><a class="btn btn--line" href="/o-nas/">Узнать подробнее</a></div></div>
${photo('b', 'Команда', 'Команда АНО «Навигатор среды»', 'team.jpg', 'photo--tall')}
</div></section>`;

const secPartners = () => `<section class="section section--soft" id="partnery"><div class="wrap">
${head('Партнёры', 'Создаём доступную среду вместе', 'Здесь появятся логотипы организаций, с которыми мы работаем. Мы публикуем только реальных партнёров — после согласования названий и логотипов.')}
<div class="logos">${'<div class="logo-slot">Логотип партнёра</div>'.repeat(4)}</div>
<div class="btn-row"><a class="btn btn--teal" href="/kontakty/?topic=partner#form">Стать партнёром</a></div>
</div></section>`;

const emptyNews = `<article class="pcard pcard--empty"><figure class="photo" role="img" aria-label="Здесь будет фотография новости">${scenes.c}<figcaption>Фото</figcaption></figure>
<div class="pcard__body"><span class="tag">Рубрика</span><span class="meta">Дата</span><h3>Заголовок новости</h3><span class="placeholder-line"></span><span class="placeholder-line s"></span></div></article>`;

const secNews = (limit) => `<section class="section" id="novosti"><div class="wrap">
${head('Новости и события', 'Что происходит в Навигаторе среды', 'Мероприятия, новые маршруты, проекты, гранты, обучающие события, публикации и новости организации.')}
<div class="grid grid--3" data-news="${limit}">${emptyNews.repeat(3)}</div>
<p class="note">Новости добавляются через панель управления <a href="/admin/">/admin</a>: дата, рубрика, фото, заголовок и краткое описание.</p>
</div></section>`;

const secCta = () => `<section class="cta" id="svyaz"><div class="wrap"><h2>Есть идея или задача в сфере доступного туризма и досуга?</h2>
<p>Расскажите нам о ней. Вместе разберёмся, какое решение можно реализовать.</p>
<div class="btn-row"><a class="btn btn--sun" href="/kontakty/#form">Связаться с нами</a><a class="btn btn--line" href="tel:${PHONE_HREF}">${PHONE}</a></div></div></section>`;

const form = () => `<form class="form" id="form" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/kontakty/?sent=1">
<input type="hidden" name="form-name" value="contact">
<p class="hp"><label>Не заполняйте: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
<div class="field"><label for="f-name">Имя</label><input id="f-name" name="name" autocomplete="name" required></div>
<div class="field"><label for="f-contact">Телефон или email</label><input id="f-contact" name="contact" autocomplete="email" required></div>
<div class="field"><label for="f-org">Организация <span style="font-weight:500;color:var(--ink-soft)">(если есть)</span></label><input id="f-org" name="organization" autocomplete="organization"></div>
<div class="field"><label for="f-topic">Что вас интересует?</label><select id="f-topic" name="topic">
<option value="">Выберите тему</option><option value="routes">Доступные маршруты</option><option value="assessment">Оценка доступности</option><option value="passport">Паспорт доступности</option><option value="training">Обучение</option><option value="consulting">Консультация</option><option value="project">Совместный проект</option><option value="partner">Партнёрство</option><option value="other">Другое</option></select></div>
<div class="field"><label for="f-msg">Сообщение</label><textarea id="f-msg" name="message"></textarea></div>
<button class="btn btn--sun" type="submit">Отправить</button>
<p class="hint">Отправляя форму, вы соглашаетесь на обработку указанных данных для ответа на ваше обращение.</p>
<div class="form-status" role="status" aria-live="polite"></div></form>`;

const pageHead = (crumb, h1, lead) => `<section class="page-hero"><div class="wrap"><p class="breadcrumbs"><a href="/">Главная</a> / ${crumb}</p><h1>${h1}</h1>${lead ? `<p class="lead" style="margin-top:18px">${lead}</p>` : ''}</div></section>`;

// ---------- страницы ----------
const pages = [];

pages.push({
  path: '/', crumb: 'Главная',
  title: 'Доступный туризм и досуг в Красноярске — АНО «Навигатор среды»',
  desc: 'АНО «Навигатор среды» в Красноярске: доступные туристические маршруты, оценка доступности объектов, паспорта доступности, обучение и консультации.',
  body: `<section class="hero"><div class="wrap hero__grid">
<div><span class="badge">Красноярск · Красноярский край</span>
<h1>Делаем туризм и&nbsp;досуг <span>доступнее</span></h1>
<p class="lead">Разрабатываем доступные маршруты, оцениваем объекты и помогаем создавать среду, в которой удобно путешествовать, отдыхать и проводить время людям с разными возможностями.</p>
<div class="btn-row"><a class="btn btn--forest" href="/proekty/">Посмотреть проекты</a><a class="btn btn--sun" href="/kontakty/#form">Обсудить сотрудничество</a></div></div>
<div class="hero__mosaic">
${photo('a', '', 'Путешественники на прогулке у реки в Красноярском крае', 'hero-1.jpg')}
${photo('b', '', 'Друзья на экскурсии по лесной тропе', 'hero-2.jpg')}
${photo('c', '', 'Семья отдыхает на набережной', 'hero-3.jpg')}
</div></div></section>
${secDirections(false)}${secAudience()}${secMore()}${secApproach()}${secProjects(3, true)}${secTourism()}${secBiz()}${secTraining()}${secAboutTeaser()}${secPartners()}${secNews(3)}${secCta()}`
});

pages.push({
  path: '/o-nas/', crumb: 'О нас',
  title: 'О нас — АНО «Навигатор среды», Красноярск',
  desc: 'Кто стоит за АНО «Навигатор среды», зачем создана организация и какие направления она развивает: доступный и инклюзивный туризм, досуг, обучение, оценка доступности.',
  body: `${pageHead('О нас', 'Навигатор среды — о людях, маршрутах и возможностях')}
<section class="section"><div class="wrap split"><div>
<p class="lead">Организация создана, чтобы развивать и поддерживать доступную, инклюзивную и развивающую среду, организовывать досуг и развитие детей и взрослых, а также повышать качество услуг и подготовку персонала в сферах туризма и досуга.</p>
<h2 style="margin-top:32px;font-size:1.7rem">Какую проблему мы решаем</h2>
<p>Путешествие или поход на мероприятие — это цепочка: информация, дорога, вход, услуга, общение с персоналом. Когда в этой цепочке есть слабое звено, человек просто не может воспользоваться тем, что создано для всех. Мы находим такие звенья и вместе с организациями превращаем их в рабочие решения.</p>
<h2 style="margin-top:32px;font-size:1.7rem">Почему это важно</h2>
<p>Доступный туризм и досуг — это возможность быть частью жизни города и общества: путешествовать, отдыхать, развиваться и получать впечатления наравне с другими.</p>
<h2 style="margin-top:32px;font-size:1.7rem">Что мы развиваем</h2>
<ul>${DIRECTIONS.map(d => `<li>${d[1]}</li>`).join('')}</ul>
<div class="btn-row"><a class="btn btn--sun" href="/kontakty/#form">Обсудить задачу</a><a class="btn btn--line" href="/napravleniya/">Все направления</a></div></div>
<div>${photo('b', 'Команда', 'Команда АНО «Навигатор среды» во время работы', 'team.jpg', 'photo--tall')}
<dl class="facts" style="margin-top:18px">
<div><dt>Организационно-правовая форма</dt><dd>Автономная некоммерческая организация</dd></div>
<div><dt>Место нахождения</dt><dd>г. Красноярск</dd></div>
<div><dt>Срок деятельности</dt><dd>Без ограничения срока</dd></div>
<div><dt>ОГРН / ИНН</dt><dd>1262400015327 / 2465374588</dd></div></dl></div></div></section>
<section class="section section--soft"><div class="wrap">${head('Кто стоит за проектом', 'Команда')}
<div class="team"><div class="person">${photo('a', '', 'Директор АНО «Навигатор среды»', 'person-director.jpg')}<h3>Григорьева Ирина Вячеславовна</h3><p>Директор</p></div>
${[1, 2, 3].map(() => `<div class="person"><figure class="photo" role="img" aria-label="Место для фотографии участника команды">${scenes.b}</figure><h3>Имя и фамилия</h3><p>Должность</p></div>`).join('')}</div>
<p class="note">Информация об опыте и роли участников команды будет добавлена после предоставления данных.</p></div></section>
${secPartners()}${secCta()}`
});

pages.push({
  path: '/napravleniya/', crumb: 'Направления',
  title: 'Направления: доступные маршруты, оценка доступности, паспорта доступности — Навигатор среды',
  desc: 'Разработка доступных туристических маршрутов, оценка доступности объектов и туристической инфраструктуры, паспорта доступности, обучение и консультации в Красноярске и крае.',
  body: `${pageHead('Направления', 'Доступный туризм и досуг: чем мы занимаемся', 'От оценки доступности объектов до разработки доступных маршрутов и обучения сотрудников.')}
${secDirections(true)}${secAudience()}${secMore()}${secApproach()}${secBiz()}${secCta()}`
});

pages.push({
  path: '/proekty/', crumb: 'Проекты',
  title: 'Проекты по доступному и инклюзивному туризму — Навигатор среды',
  desc: 'Проекты АНО «Навигатор среды» в сфере доступной среды, инклюзивного туризма и досуга в Красноярске и Красноярском крае.',
  body: `${pageHead('Проекты', 'Проекты: от идеи до работающего маршрута', 'Для каждого проекта — для кого он, что было сделано и какой получился результат.')}
${secProjects(60, false)}${secTourism()}${secCta()}`
});

pages.push({
  path: '/obuchenie/', crumb: 'Обучение',
  title: 'Обучение доступной среде: тренинги, вебинары, семинары — Навигатор среды',
  desc: 'Обучение сотрудников туризма и досуга: тренинги, мастер-классы, вебинары и семинары по доступной среде и качественному сервису для разных людей.',
  body: `${pageHead('Обучение', 'Доступная среда начинается с понимания', 'Помогаем сотрудникам организаций понимать потребности разных людей и создавать качественный сервис без формального подхода.')}
<section class="section"><div class="wrap">${head('Форматы', 'Выберите удобный формат')}
<div class="grid grid--2">${[['Тренинги', 'Практические занятия для команд: разбираем реальные ситуации сервиса.'], ['Мастер-классы', 'Короткие форматы с конкретными приёмами и примерами.'], ['Вебинары', 'Онлайн-занятия для сотрудников из разных городов и территорий.'], ['Семинары', 'Тематические встречи для организаций туризма, культуры и досуга.']].map(([t, d]) => `<article class="card">${ico('learn')}<h3>${t}</h3><p>${d}</p></article>`).join('')}</div>
<div class="btn-row"><a class="btn btn--sun" href="/kontakty/?topic=training#form">Узнать об обучении</a></div></div></section>
${secApproach()}${secCta()}`
});

pages.push({
  path: '/novosti/', crumb: 'Новости',
  title: 'Новости и события — АНО «Навигатор среды»',
  desc: 'Новости, мероприятия, новые доступные маршруты, проекты, гранты и обучающие события АНО «Навигатор среды», Красноярск.',
  body: `${pageHead('Новости', 'Новости и события')}${secNews(60)}${secCta()}`
});

pages.push({
  path: '/kontakty/', crumb: 'Контакты',
  title: 'Контакты — АНО «Навигатор среды», Красноярск',
  desc: 'Свяжитесь с АНО «Навигатор среды» в Красноярске: обсудить оценку доступности, доступные маршруты, обучение или совместный проект.',
  body: `${pageHead('Контакты', 'Расскажите о своей задаче', 'Вместе разберёмся, какое решение можно реализовать. Форма короткая — достаточно имени и способа связи.')}
<section class="section" style="padding-top:20px"><div class="wrap split"><div>
<ul class="contact-list">
<li><strong>Организация</strong><span>${ORG}</span></li>
<li><strong>Город</strong><span>Красноярск</span></li>
<li><strong>Адрес</strong><span>${ADDRESS}</span></li>
<li><strong>Телефон</strong><a href="tel:${PHONE_HREF}">${PHONE}</a></li>
<li><strong>Email</strong><a href="mailto:${EMAIL}">${EMAIL}</a></li>
<li><strong>Социальные сети</strong><span style="font-weight:500;color:var(--ink-soft)">будут добавлены</span></li></ul>
<div class="map-slot">Здесь будет карта. Для точки на карте нужен адрес места приёма (юридический адрес указан выше).</div></div>
${form()}</div></section>`
});

// ---------- запись ----------
const root = __dirname;
for (const p of pages) {
  const dir = p.path === '/' ? root : path.join(root, p.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), layout(p, p.body));
}
// страница 404
fs.writeFileSync(path.join(root, '404.html'), layout({ path: '/404', crumb: '404', title: 'Страница не найдена — Навигатор среды', desc: 'Страница не найдена.' },
  `${pageHead('404', 'Такой страницы нет')}<section class="section" style="padding-top:0"><div class="wrap"><a class="btn btn--forest" href="/">На главную</a></div></section>`).replace('<meta name="description"', '<meta name="robots" content="noindex"><meta name="description"'));
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>${SITE}${p.path}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${SITE}/sitemap.xml\n`);
console.log('Готово:', pages.map(p => p.path).join(' '));
