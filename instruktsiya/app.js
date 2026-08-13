/* Твоя инструкция — мини-апп ВКонтакте и Telegram.
   Платформа скрыта за window.App (_shared/vk.js или _shared/tg.js). */

(function () {

  var app = document.getElementById("app");
  var dock = document.getElementById("dock");

  var LINK = CFG.link("instruktsiya");
  var LINK_PEREVODCHIK = CFG.link("perevodchik");

  var state = {
    screen: "intro",
    i: 0,
    answers: {},
    joined: false,
    allowed: false
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function nl2br(s) { return esc(s).replace(/\n/g, "<br><br>"); }

  /* ───────────── подсчёт ───────────── */

  function score() {
    var sums = {}, i;
    TYPE_ORDER.forEach(function (t) { sums[t] = 0; });
    QUESTIONS.forEach(function (q) { sums[q.type] += (state.answers[q.id] || 0); });

    var pct = {};
    TYPE_ORDER.forEach(function (t) { pct[t] = Math.round(sums[t] / 12 * 100); });

    var order = TYPE_ORDER.slice().sort(function (a, b) { return sums[b] - sums[a]; });
    var top = order[0], second = order[1];
    var close = sums[top] > 0 && (sums[top] - sums[second]) <= 1 ? second : null;

    /* правила инструкции */
    var picked = QUESTIONS.filter(function (q) { return (state.answers[q.id] || 0) >= 2; });
    if (picked.length < 4) {
      picked = QUESTIONS.filter(function (q) { return (state.answers[q.id] || 0) >= 1; });
    }
    picked.sort(function (a, b) { return (state.answers[b.id] || 0) - (state.answers[a.id] || 0); });
    var rules = picked.slice(0, 8).map(function (q) { return q.rule; });

    return { sums: sums, pct: pct, top: top, second: close, rules: rules, total: sums[top] };
  }

  /* ───────────── экраны ───────────── */

  function renderIntro() {
    state.screen = "intro";
    app.innerHTML =
      '<div class="wrap fade">' +
        '<div class="hero">' +
          '<div class="kicker">' + esc(INTRO.kicker) + "</div>" +
          '<h1 class="big">' + esc(INTRO.title) + "</h1>" +
          '<p class="lead" style="margin-top:18px">' + esc(INTRO.lead) + "</p>" +
        "</div>" +
        '<div class="card"><p>' + esc(INTRO.body) + "</p></div>" +
        '<p class="small" style="margin:4px 2px 0">' + esc(INTRO.note) + "</p>" +
        '<div class="foot">Анастасия Ерасова · клинический психолог' + CFG.legalFoot() + "</div>" +
      "</div>";
    dock.innerHTML = '<div class="inner"><button class="btn" id="go">Начать · 20 вопросов</button></div>';
    document.getElementById("go").addEventListener("click", function () {
      state.i = 0;
      renderQuestion();
      window.scrollTo(0, 0);
    });
    App.setBack(null);
    App.confirmClose(false);
  }

  function renderQuestion() {
    state.screen = "quiz";
    var q = QUESTIONS[state.i];
    var chosen = state.answers[q.id];

    var opts = SCALE.map(function (s, idx) {
      return '<button class="opt' + (chosen === s.v ? " on" : "") + '" data-v="' + s.v + '">' + esc(s.label) + "</button>";
    }).join("");

    app.innerHTML =
      '<div class="wrap fade">' +
        '<div class="topbar">' +
          (state.i > 0 ? '<button class="back" id="prev">‹ Назад</button>' : '<button class="back" id="quit">‹ В начало</button>') +
          '<span class="small" style="margin-left:auto">' + (state.i + 1) + " из " + QUESTIONS.length + "</span>" +
        "</div>" +
        '<div class="progress"><i style="width:' + Math.round((state.i) / QUESTIONS.length * 100) + '%"></i></div>' +
        '<h2 style="text-transform:none;font-size:24px;font-weight:700;line-height:1.25;margin:14px 0 26px">' + esc(q.text) + "</h2>" +
        opts +
        '<div class="foot">Ответы остаются в вашем телефоне</div>' +
      "</div>";

    dock.innerHTML = "";

    var prev = document.getElementById("prev");
    if (prev) prev.addEventListener("click", function () { state.i--; renderQuestion(); window.scrollTo(0, 0); });
    var quit = document.getElementById("quit");
    if (quit) quit.addEventListener("click", renderIntro);

    /* стрелка «назад» в шапке Telegram ведёт на предыдущий вопрос,
       а свернуть приложение посреди теста Telegram переспросит */
    App.setBack(state.i > 0
      ? function () { state.i--; renderQuestion(); window.scrollTo(0, 0); }
      : renderIntro);
    App.confirmClose(true);

    app.querySelectorAll(".opt").forEach(function (b) {
      b.addEventListener("click", function () {
        state.answers[q.id] = Number(b.dataset.v);
        app.querySelectorAll(".opt").forEach(function (o) { o.classList.remove("on"); });
        b.classList.add("on");
        App.haptic("success");
        setTimeout(function () {
          if (state.i < QUESTIONS.length - 1) {
            state.i++;
            renderQuestion();
            window.scrollTo(0, 0);
          } else {
            renderResult();
          }
        }, 180);
      });
    });
  }

  function renderResult() {
    state.screen = "result";
    var r = score();
    var T = TYPES[r.top];
    var low = r.total <= 3;

    App.set("result", JSON.stringify({ pct: r.pct, top: r.top }));

    var rulesHtml = r.rules.length
      ? '<div class="card"><ul class="rules">' + r.rules.map(function (t, i) {
          return "<li><em>" + (i + 1) + "</em>" + esc(t) + "</li>";
        }).join("") + "</ul></div>"
      : '<div class="card"><p>' + esc(LOW_RESULT.text) + "</p></div>";

    var bars = TYPE_ORDER.map(function (t) {
      var isTop = t === r.top && !low;
      return '<div class="bar-row">' +
        '<div class="bar-head"><b>' + esc(TYPES[t].title) + (isTop ? " ←" : "") + "</b><span>" + r.pct[t] + "%</span></div>" +
        '<div class="bar' + (isTop ? "" : " dim") + '"><i data-w="' + r.pct[t] + '"></i></div>' +
        "</div>";
    }).join("");

    var typeBlock = low ? "" :
      '<div class="divider"></div>' +
      '<div class="kicker">// ваша ведущая тень</div>' +
      '<h1 class="big">' + esc(T.title.toUpperCase()) + "</h1>" +
      '<p class="lead" style="margin:14px 0 18px">' + esc(T.lead) + "</p>" +
      (r.second ? '<p class="small" style="margin:-8px 0 18px">Рядом идёт «' + esc(TYPES[r.second].title) +
        '» — почти с тем же весом. Обычно это значит, что правила из обеих частей включаются по очереди, в зависимости от того, кто напротив.</p>' : "") +

      '<div class="tile"><div class="label">Что эта часть вам дала</div><p class="lead" style="font-size:16px">' + esc(T.strength) + "</p></div>" +
      '<div class="card"><div class="label">Что ушло в тень</div><p>' + esc(T.shadow) + "</p></div>" +
      '<div class="card"><div class="label">Чем вы за это платите</div><p>' + esc(T.price) + "</p></div>" +

      '<div class="divider"></div>' +
      '<h2>ТРИ ШАГА<br>НА ЭТУ НЕДЕЛЮ</h2>' +
      '<div style="margin-top:16px">' + T.steps.map(function (s, i) {
        return '<div class="tile"><div class="label">Шаг ' + (i + 1) + "</div><p class=\"lead\" style=\"font-size:16px\">" + esc(s) + "</p></div>";
      }).join("") + "</div>" +

      '<div class="card"><div class="label">Что будет откатом</div><p>' + esc(T.rollback) + "</p></div>" +
      '<div class="accent">' + esc(T.permission) + "</div>";

    app.innerHTML =
      '<div class="wrap fade">' +
        '<div class="topbar"><button class="back" id="again">‹ Пройти заново</button></div>' +
        '<div class="hero" style="padding-top:6px">' +
          '<div class="kicker">// то, чему вас научили</div>' +
          '<h1 class="big">' + (low ? "ИНСТРУКЦИИ\nПОЧТИ НЕТ" : "МОЯ\nИНСТРУКЦИЯ") + "</h1>" +
          '<p class="lead" style="margin-top:16px">' +
            (low ? esc(LOW_RESULT.title) : "Правила, которые вы усвоили. Их никто не писал на бумаге — их просто выдали.") +
          "</p>" +
        "</div>" +

        rulesHtml +

        /* «В историю» есть только там, где платформа принимает картинку
           прямо из приложения. Telegram умеет только публичные ссылки —
           там остаётся одно «Сохранить картинку». */
        (r.rules.length
          ? (App.canStory
              ? '<div class="btn-row" style="margin-top:14px">' +
                  '<button class="btn crimson" id="save">Сохранить картинку</button>' +
                  '<button class="btn ghost" id="story">В историю</button>' +
                "</div>"
              : '<button class="btn crimson" id="save" style="margin-top:14px">Сохранить картинку</button>') +
            '<button class="btn ghost" id="send" style="margin-top:10px">Отправить той, кто узнает себя</button>'
          : '<button class="btn ghost" id="send" style="margin-top:14px">Отправить той, кто узнает себя</button>') +

        '<div class="divider"></div>' +
        '<div class="kicker">// пять шкал</div>' +
        '<h2 style="margin-bottom:18px">ГДЕ ИМЕННО<br>ЭТО ЖИВЁТ</h2>' +
        bars +

        typeBlock +

        '<div class="divider"></div>' +
        '<div class="tile">' +
          '<div class="label">Что ещё есть</div>' +
          '<h3 style="margin-bottom:8px">Переводчик хорошей девочки</h3>' +
          '<p class="small">Второе приложение: 53 фразы — что они значат на самом деле и что можно сказать вместо. Ребёнку, себе и в ответ тем, кто говорит их вам.</p>' +
          '<button class="btn ghost" id="toPerevodchik" style="margin-top:14px">Открыть переводчик</button>' +
        "</div>" +

        '<div class="foot">Анастасия Ерасова · клинический психолог' + CFG.legalFoot() + "</div>" +
      "</div>";

    setTimeout(function () {
      app.querySelectorAll(".bar i").forEach(function (el) { el.style.width = el.dataset.w + "%"; });
    }, 60);

    document.getElementById("again").addEventListener("click", function () {
      state.answers = {}; state.i = 0; renderIntro(); window.scrollTo(0, 0);
    });

    if (r.rules.length) {
      document.getElementById("save").addEventListener("click", function () {
        App.saveImage(InstructionCard.draw(r.rules, "post"), "moya-instrukciya.png");
      });

      var storyBtn = document.getElementById("story");
      if (storyBtn) storyBtn.addEventListener("click", function () {
        App.story(InstructionCard.draw(r.rules, "story"), LINK);
      });
    }

    document.getElementById("send").addEventListener("click", function () {
      App.share(LINK, "Мои правила хорошей девочки — 20 вопросов и вся инструкция целиком");
    });

    document.getElementById("toPerevodchik").addEventListener("click", function () {
      App.openApp(LINK_PEREVODCHIK);
    });

    renderResultDock(r);
    window.scrollTo(0, 0);
    App.haptic("success");
    App.setBack(null);
    App.confirmClose(false);
  }

  function renderResultDock(r) {
    if (!state.joined) {
      dock.innerHTML = '<div class="inner"><button class="btn" id="join">' + esc(App.followLabel) + "</button></div>";
      document.getElementById("join").addEventListener("click", function () {
        App.follow().then(function (res) {
          if (!res.ok) return;
          state.joined = true;
          App.set("joined", "1");
          App.haptic("success");
          renderResultDock(r);
        });
      });
      return;
    }
    /* «Прислать разбор» включается только когда на платформе есть сценарий,
       который его реально шлёт (CFG.razborEnabled). В Telegram кнопка ведёт
       на бота с start=razbor_<тип> — человек жмёт Start и получает разбор,
       во ВК — старый запрос разрешения на личку. */
    if (CFG.razborEnabled() && !state.allowed) {
      dock.innerHTML = '<div class="inner"><button class="btn crimson" id="allow">Прислать разбор по вашему типу</button></div>';
      document.getElementById("allow").addEventListener("click", function () {
        if (App.platform === "tg") {
          App.set("allowed", "1");
          state.allowed = true;
          App.openApp(CFG.razborLink(r.top));
          return;
        }
        App.allowMessages().then(function (ok) {
          if (!ok) return;
          state.allowed = true;
          App.set("allowed", "1");
          App.toast("Готово. Разбор придёт в сообщения");
          renderResultDock(r);
        });
      });
      return;
    }
    dock.innerHTML = "";
  }

  /* ───────────── старт ───────────── */

  App.init();

  Promise.all([App.get("joined"), App.get("allowed")]).then(function (v) {
    state.joined = v[0] === "1";
    state.allowed = v[1] === "1";
    renderIntro();
  });

})();
