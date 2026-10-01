(function () {
  'use strict';
  var d = document;

  // Мобильное меню
  var burger = d.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = d.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
    });
    d.querySelectorAll('.mobile-nav a').forEach(function (a) {
      a.addEventListener('click', function () { d.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); });
    });
  }

  // Реальные фото: если файл существует, он ложится поверх иллюстрации-заглушки
  d.querySelectorAll('.photo[data-src]').forEach(function (box) {
    var img = new Image();
    img.onload = function () {
      img.alt = box.getAttribute('data-alt') || '';
      img.loading = 'lazy';
      box.insertBefore(img, box.firstChild);
    };
    img.src = box.getAttribute('data-src');
  });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) { return /^(https?:\/\/|\/|#)/.test(u || '') ? u : ''; }
  function photo(item, scene) {
    var tpl = d.getElementById('scene-' + scene);
    var art = tpl ? tpl.innerHTML : '';
    var img = item.image ? '<img src="' + esc(safeUrl(item.image)) + '" alt="' + esc(item.alt || item.title) + '" loading="lazy">' : '';
    return '<figure class="photo">' + img + art + '</figure>';
  }
  function load(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : { items: [] }; }).catch(function () { return { items: [] }; });
  }

  // Проекты из data/projects.json (редактируются через /admin/)
  d.querySelectorAll('[data-projects]').forEach(function (box) {
    var limit = parseInt(box.getAttribute('data-projects'), 10) || 99;
    load('/data/projects.json').then(function (data) {
      var items = (data.items || []).slice(0, limit);
      if (!items.length) return; // остаются аккуратные пустые карточки
      var scenes = ['a', 'b', 'c'];
      box.innerHTML = items.map(function (p, i) {
        var link = safeUrl(p.url);
        return '<article class="pcard">' + photo(p, scenes[i % 3]) +
          '<div class="pcard__body"><h3>' + esc(p.title) + '</h3><p>' + esc(p.summary) + '</p><dl>' +
          '<div><dt>Для кого</dt><dd>' + esc(p.audience) + '</dd></div>' +
          '<div><dt>Что сделано</dt><dd>' + esc(p.done) + '</dd></div>' +
          '<div><dt>Результат</dt><dd>' + esc(p.result) + '</dd></div></dl>' +
          (link ? '<a class="btn btn--line" href="' + esc(link) + '">Подробнее</a>' : '') +
          '</div></article>';
      }).join('');
      var note = box.parentNode.querySelector('.note');
      if (note) note.remove();
    });
  });

  // Новости из data/news.json
  d.querySelectorAll('[data-news]').forEach(function (box) {
    var limit = parseInt(box.getAttribute('data-news'), 10) || 99;
    load('/data/news.json').then(function (data) {
      var items = (data.items || []).slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, limit);
      if (!items.length) return;
      var scenes = ['b', 'c', 'a'];
      box.innerHTML = items.map(function (n, i) {
        var link = safeUrl(n.url);
        var dt = n.date ? new Date(n.date) : null;
        var dts = dt && !isNaN(dt) ? dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        return '<article class="pcard">' + photo(n, scenes[i % 3]) +
          '<div class="pcard__body"><span class="tag">' + esc(n.tag || 'Новость') + '</span>' +
          '<span class="meta"><time datetime="' + esc(n.date) + '">' + esc(dts) + '</time></span>' +
          '<h3>' + esc(n.title) + '</h3><p>' + esc(n.summary) + '</p>' +
          (link ? '<a class="link-arrow" href="' + esc(link) + '">Читать</a>' : '') + '</div></article>';
      }).join('');
      var note = box.parentNode.querySelector('.note');
      if (note) note.remove();
    });
  });

  // Формы: отправка в Netlify Forms без перезагрузки страницы
  d.querySelectorAll('form[data-netlify]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var contact = form.elements['contact'];
      if (!contact.value.trim()) { contact.focus(); return; }
      var body = new URLSearchParams(new FormData(form)).toString();
      status.className = 'form-status'; status.textContent = '';
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset();
          status.className = 'form-status ok';
          status.textContent = 'Спасибо! Сообщение отправлено, мы свяжемся с вами.';
        })
        .catch(function () {
          status.className = 'form-status err';
          status.textContent = 'Не удалось отправить. Напишите на grigoryeva_irina@bk.ru или позвоните +7 (913) 182-96-54.';
        });
    });
  });
})();
