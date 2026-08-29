/* Переводчик хорошей девочки — мини-апп ВКонтакте и Telegram.
   Платформа скрыта за window.App (_shared/vk.js или _shared/tg.js). */

(function () {

  var app = document.getElementById("app");
  var dock = document.getElementById("dock");

  var state = {
    cat: "child",
    q: "",
    fav: [],
    joined: false,
    view: "list",
    card: null
  };

  var LINK = CFG.link("perevodchik");

  /* ───────────── утилиты ───────────── */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function norm(s) {
    return String(s).toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9 ]/gi, " ").replace(/\s+/g, " ").trim();
  }

  function catById(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i];
    return CATS[0];
  }

  function cardById(id) {
    for (var i = 0; i < CARDS.length; i++) if (CARDS[i].id === id) return CARDS[i];
    return null;
  }

  function matches(card, q) {
    if (!q) return true;
    var hay = norm(card.phrase + " " + (card.also || []).join(" ") + " " + card.a + " " + card.b + " " + card.instead.join(" "));
    var words = q.split(" ");
    for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) === -1) return false;
    return true;
  }

  function visible() {
    var q = norm(state.q);
    return CARDS.filter(function (c) {
      if (state.cat === "fav") return state.fav.indexOf(c.id) !== -1 && matches(c, q);
      if (q) return matches(c, q);
      return c.cat === state.cat;
    });
  }

  /* ───────────── экран списка ───────────── */

  function renderList() {
    var cat = catById(state.cat);
    var items = visible();
    var searching = !!norm(state.q);

    var tabs = CATS.map(function (c) {
      return '<button class="tab' + (state.cat === c.id ? " on" : "") + '" data-cat="' + c.id + '">' + esc(c.title) + "</button>";
    }).join("");
    tabs += '<button class="tab' + (state.cat === "fav" ? " on" : "") + '" data-cat="fav">★ Своё' +
            (state.fav.length ? " " + state.fav.length : "") + "</button>";

    var rows = items.map(function (c) {
      var sub = (c.also && c.also.length) ? c.also[0] : catById(c.cat).title;
      return '<div class="row" data-id="' + c.id + '">' +
             "<div><b>" + esc(c.phrase) + '</b><div class="sub">' + esc(sub) + "</div></div>" +
             '<div class="arrow">›</div></div>';
    }).join("");

    if (!items.length) {
      rows = '<div class="empty">' + (state.cat === "fav"
        ? "Здесь будут фразы, которые вы сохраните.<br>Нажмите звёздочку на любой карточке."
        : "Такой фразы пока нет.<br>Попробуйте другое слово — например, «стыдно» или «обиделась».") + "</div>";
    }

    var lead = searching
      ? "Найдено: " + items.length
      : (state.cat === "fav" ? "Сохранённые фразы — они лежат в вашем телефоне." : cat.lead);

    app.innerHTML =
      '<div class="wrap fade">' +
        '<div class="hero">' +
          '<div class="kicker">// что это значит на самом деле</div>' +
          '<h1 class="big">ПЕРЕВОДЧИК\nХОРОШЕЙ\nДЕВОЧКИ</h1>' +
          '<p class="lead">Фраза, которую вы слышали или говорили сами. Что под ней — и что можно сказать вместо.</p>' +
        "</div>" +
        '<input class="search" id="q" type="search" placeholder="Найти фразу: «не реви», «я сама»…" value="' + esc(state.q) + '">' +
        '<div class="tabs">' + tabs + "</div>" +
        '<p class="small" style="margin:-4px 0 14px">' + esc(lead) + "</p>" +
        '<div id="list">' + rows + "</div>" +
        '<div class="divider"></div>' +
        '<div class="tile">' +
          '<div class="label">Что ещё есть</div>' +
          '<h3 style="margin-bottom:8px">Твоя инструкция</h3>' +
          '<p class="small">Второе приложение: 20 вопросов — и вы увидите свод правил, по которым вас растили, пять шкал вашей тени и три шага на эту неделю.</p>' +
          '<button class="btn ghost" id="toInstr" style="margin-top:14px">Пройти</button>' +
        "</div>" +
        '<div class="foot">' + CARDS.length + " фраз · Анастасия Ерасова, психолог</div>" +
      "</div>";

    var q = document.getElementById("q");
    q.addEventListener("input", function () {
      state.q = q.value;
      var items = visible();
      renderRowsOnly(items);
    });

    app.querySelectorAll(".tab").forEach(function (b) {
      b.addEventListener("click", function () {
        state.cat = b.dataset.cat;
        state.q = "";
        renderList();
        window.scrollTo(0, 0);
      });
    });

    var toInstr = document.getElementById("toInstr");
    if (toInstr) {
      toInstr.addEventListener("click", function () {
        App.openApp(CFG.link("instruktsiya"));
      });
    }

    bindRows();
    renderDock();
    App.setBack(null);
  }

  function renderRowsOnly(items) {
    var list = document.getElementById("list");
    list.innerHTML = items.length
      ? items.map(function (c) {
          var sub = (c.also && c.also.length) ? c.also[0] : catById(c.cat).title;
          return '<div class="row" data-id="' + c.id + '">' +
                 "<div><b>" + esc(c.phrase) + '</b><div class="sub">' + esc(sub) + "</div></div>" +
                 '<div class="arrow">›</div></div>';
        }).join("")
      : '<div class="empty">Такой фразы пока нет.<br>Попробуйте другое слово — например, «стыдно» или «обиделась».</div>';
    var lead = app.querySelector(".small");
    if (lead) {
      lead.textContent = norm(state.q)
        ? "Найдено: " + items.length
        : (state.cat === "fav" ? "Сохранённые фразы — они лежат в вашем телефоне." : catById(state.cat).lead);
    }
    bindRows();
  }

  function bindRows() {
    app.querySelectorAll(".row").forEach(function (r) {
      r.addEventListener("click", function () { open(r.dataset.id); });
    });
  }

  /* ───────────── экран карточки ───────────── */

  function open(id) {
    var c = cardById(id);
    if (!c) return;
    state.view = "card";
    state.card = c;
    history.pushState({ card: id }, "", "#" + id);
    renderCard(c);
    window.scrollTo(0, 0);
    App.haptic("success");
  }

  function renderCard(c) {
    var L = catById(c.cat).labels;
    var isFav = state.fav.indexOf(c.id) !== -1;

    var instead = c.instead.map(function (t) {
      return "<li>" + esc(t) + "</li>";
    }).join("");


    app.innerHTML =
      '<div class="wrap fade">' +
        '<div class="topbar"><button class="back" id="back">‹ Все фразы</button>' +
          '<button class="back" id="fav" style="margin-left:auto">' + (isFav ? "★ Сохранено" : "☆ Сохранить") + "</button>" +
        "</div>" +
        '<div class="hero" style="padding-top:6px">' +
          '<div class="kicker">// ' + esc(catById(c.cat).title.toLowerCase()) + "</div>" +
          '<h1 class="big">«' + esc(c.phrase) + '»</h1>' +
        "</div>" +

        '<div class="card"><div class="label">' + esc(L.a) + "</div><p>" + esc(c.a) + "</p></div>" +
        '<div class="card"><div class="label">' + esc(L.b) + "</div><p>" + esc(c.b) + "</p></div>" +

        '<div class="tile">' +
          '<div class="label">' + esc(L.instead) + "</div>" +
          '<ul class="instead">' + instead + "</ul>" +
        "</div>" +

        '<div class="tile"><div class="label">' + esc(L.extra) + '</div><p class="lead" style="font-size:16px">' + esc(c.extra) + "</p></div>" +

        (c.quote ? '<div class="quote">' + esc(c.quote) + "</div>" : "") +

        '<div class="divider"></div>' +
        '<button class="btn crimson" id="send">Отправить тому, кто узнает себя</button>' +
        '<button class="btn ghost" id="copy" style="margin-top:10px">Скопировать текст</button>' +

        '<div class="foot">Анастасия Ерасова · психолог</div>' +
      "</div>";

    document.getElementById("back").addEventListener("click", function () { history.back(); });

    document.getElementById("fav").addEventListener("click", function () {
      toggleFav(c.id);
      this.textContent = state.fav.indexOf(c.id) !== -1 ? "★ Сохранено" : "☆ Сохранить";
      App.haptic("success");
    });

    document.getElementById("send").addEventListener("click", function () {
      App.share(CFG.deepLink("perevodchik", c.id), "«" + c.phrase + "»");
    });

    document.getElementById("copy").addEventListener("click", function () {
      App.copy(plainText(c));
    });

    renderDock();
    /* системная стрелка «назад» в шапке Telegram; во ВК её нет — там свайп */
    App.setBack(function () { history.back(); });
  }

  function plainText(c) {
    var L = catById(c.cat).labels;
    return "«" + c.phrase + "»\n\n" +
      L.a + ": " + c.a + "\n\n" +
      L.b + ": " + c.b + "\n\n" +
      L.instead + ":\n— " + c.instead.join("\n— ") + "\n\n" +
      L.extra + ": " + c.extra + "\n\n" +
      "Переводчик хорошей девочки · " + LINK;
  }

  /* ───────────── избранное ───────────── */

  function toggleFav(id) {
    var i = state.fav.indexOf(id);
    if (i === -1) state.fav.push(id); else state.fav.splice(i, 1);
    App.set("fav", state.fav.join(","));
  }

  /* ───────────── нижняя панель ───────────── */

  function renderDock() {
    if (state.joined) { dock.innerHTML = ""; return; }
    dock.innerHTML =
      '<div class="inner"><button class="btn" id="join">' + esc(App.followLabel) + "</button></div>";
    document.getElementById("join").addEventListener("click", function () {
      App.follow().then(function (r) {
        if (!r.ok) return;
        state.joined = true;
        App.set("joined", "1");
        App.haptic("success");
        /* «спасибо» говорим только там, где платформа подтвердила подписку */
        if (r.confirmed && App.followThanks) App.toast(App.followThanks);
        renderDock();
      });
    });
  }

  /* ───────────── навигация ───────────── */

  window.addEventListener("popstate", function () {
    var hash = location.hash.replace("#", "");
    if (hash && cardById(hash)) {
      state.view = "card";
      renderCard(cardById(hash));
    } else {
      state.view = "list";
      renderList();
    }
  });


  /* ── экран подписки (только ВК): вступить в сообщество + разрешить сообщения.
     Ключ gate2 в хранилище — прошедшим не показываем. Обещание разбора
     выполняет подписная страница Senler (группа «Определи свой сценарий»). ── */
  function renderGate(next) {
    app.innerHTML =
      '<div class="wrap fade">' +
        '<div class="hero">' +
          '<div class="kicker">Подслушано у психолога</div>' +
          '<h1 class="big">Сначала подпишемся</h1>' +
          '<p class="lead" style="margin-top:18px">Приложение открывается после подписки на сообщество ' +
          'и разрешения на сообщения — так вы будете получать разборы и практики, ' +
          'которые здесь начинаются.</p>' +
        '</div>' +
        '<div class="card"><p>Бонус за подписку: разбор «Определи свой сценарий» — семь сценариев, ' +
        'по которым повторяются отношения, и потребность за каждым. Придёт в личные сообщения.</p></div>' +
        '<div class="foot">Анастасия Ерасова · клинический психолог</div>' +
      '</div>';
    dock.innerHTML = '<div class="inner"><button class="btn" id="gate-go">Подписаться и продолжить</button></div>';
    var tries = 0;
    document.getElementById("gate-go").addEventListener("click", function () {
      var btn = document.getElementById("gate-go");
      btn.disabled = true;
      tries++;
      App.follow().then(function (f) {
        return App.allowMessages().then(function (ok) {
          /* Тому, кто уже состоит в сообществе, ВК не даёт вступить второй раз:
             VKWebAppJoinGroup падает с ошибкой, и f.ok приходит false. Раньше
             таких разворачивали — то есть ровно своих же давних читателей.
             Поэтому пускаем, если сработало хоть что-то одно, а со второго
             клика — в любом случае: лучше открыть тренажёр, чем гонять
             человека по кругу. */
          if (f.ok || ok || tries >= 2) {
            App.set("gate2", "1");
            App.haptic("success");
            next();
            return;
          }
          btn.disabled = false;
          App.toast("Приложение откроется после подписки — попробуйте ещё раз");
        });
      });
    });
  }

  function withGate(next) {
    Promise.all([App.get("gate2"), App.getLaunchParams()]).then(function (g) {
      var passed = g[0] === "1";
      var inVKEnv = !!g[1];
      if (CFG.allowGate() && inVKEnv && !passed) renderGate(next); else next();
    });
  }

  /* ───────────── старт ───────────── */

  App.init();

  Promise.all([App.get("fav"), App.get("joined")]).then(function (r) {
    state.fav = (r[0] || "").split(",").filter(Boolean);
    state.joined = r[1] === "1";
    withGate(function () {

    /* прямая ссылка на карточку: во ВК это #ne-revi, в Telegram — ?startapp=ne-revi */
    var param = App.startParam();
    if (param && cardById(param)) {
      /* сначала кладём в историю список, иначе «назад» возвращает на ту же карточку */
      history.replaceState({}, "", location.pathname + location.search);
      renderList();
      open(param);
    } else {
      renderList();
    }
    });
  });

})();
