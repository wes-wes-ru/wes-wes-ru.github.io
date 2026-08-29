/* Платформенный слой: Telegram Mini Apps.
   Отдаёт тот же интерфейс window.App, что и vk.js, — приложения не знают,
   в какой они соцсети. Вне Telegram молча падает на localStorage и обычные
   ссылки, чтобы страницу можно было открыть в браузере. */

window.App = (function () {

  var tg = (window.Telegram && window.Telegram.WebApp) || null;
  var inTG = !!tg && !!tg.initData;      /* пустой initData = страницу открыли не из Telegram */

  CFG.platform = "tg";

  function has(version) {
    return inTG && tg.isVersionAtLeast && tg.isVersionAtLeast(version);
  }

  /* ── тема ── */

  function applyScheme(dark) {
    document.documentElement.setAttribute("data-scheme", dark ? "dark" : "light");
    if (!has("6.9")) return;
    var bg = dark ? "#150A0E" : "#F7F0EA";
    try { tg.setHeaderColor(bg); } catch (e) {}
    try { tg.setBackgroundColor(bg); } catch (e) {}
    if (has("7.10")) { try { tg.setBottomBarColor(bg); } catch (e) {} }
  }

  function initScheme() {
    if (!inTG) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyScheme(mq.matches);
      mq.addEventListener("change", function (e) { applyScheme(e.matches); });
      return;
    }
    applyScheme(tg.colorScheme === "dark");
    tg.onEvent("themeChanged", function () { applyScheme(tg.colorScheme === "dark"); });
  }

  /* ── безопасная зона ──
     У Telegram своя шапка поверх страницы, и на айфонах снизу свой отступ.
     Держим CSS-переменную в актуальном состоянии, иначе нижняя панель
     наезжает на системную полоску. */

  function applyInsets() {
    if (!inTG) return;
    /* safeAreaInset — вырез самого телефона, contentSafeAreaInset — шапка Telegram
       поверх страницы. Складываются: контент должен начинаться ниже обоих. */
    var top = 0, bottom = 0;
    if (tg.safeAreaInset) { top += tg.safeAreaInset.top || 0; bottom += tg.safeAreaInset.bottom || 0; }
    if (tg.contentSafeAreaInset) { top += tg.contentSafeAreaInset.top || 0; bottom += tg.contentSafeAreaInset.bottom || 0; }
    document.documentElement.style.setProperty("--safe-t", top + "px");
    document.documentElement.style.setProperty("--safe-b", bottom + "px");
  }

  /* ── хранилище: CloudStorage, если есть, иначе localStorage ──
     CloudStorage переживает переустановку и виден на всех устройствах человека. */

  function get(key) {
    var local = "";
    try { local = localStorage.getItem(key) || ""; } catch (e) {}
    if (!has("6.9") || !tg.CloudStorage) return Promise.resolve(local);
    return new Promise(function (resolve) {
      tg.CloudStorage.getItem(key, function (err, value) {
        resolve(err ? local : (value || local));
      });
    });
  }

  function set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
    if (!has("6.9") || !tg.CloudStorage) return Promise.resolve();
    return new Promise(function (resolve) {
      tg.CloudStorage.setItem(key, String(value), function () { resolve(); });
    });
  }

  /* ── пользователь ── */

  function user() {
    return Promise.resolve((inTG && tg.initDataUnsafe && tg.initDataUnsafe.user) || null);
  }

  /* ── действия ── */

  function share(link, text) {
    var url = "https://t.me/share/url?url=" + encodeURIComponent(link) +
              (text ? "&text=" + encodeURIComponent(text) : "");
    if (!inTG) { window.open(url, "_blank"); return Promise.resolve(); }
    tg.openTelegramLink(url);
    return Promise.resolve();
  }

  function copy(text) {
    function done() { toast("Скопировано"); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(done).catch(function () { legacyCopy(text); done(); });
    }
    legacyCopy(text);
    done();
    return Promise.resolve();
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    ta.remove();
  }

  /* Канал. Подтвердить подписку без бэкенда нельзя, поэтому confirmed:false —
     приложение просто откроет канал и не будет врать «спасибо, вы подписаны». */
  function follow() {
    var url = CFG.communityUrl();
    if (inTG) tg.openTelegramLink(url); else window.open(url, "_blank");
    return Promise.resolve({ ok: true, confirmed: false });
  }

  function allowMessages() {
    /* В Telegram человек уже в переписке с ботом — отдельное разрешение не нужно. */
    return Promise.resolve(false);
  }

  function story(dataUrl) {
    /* tg.shareToStory умеет только публичные https-ссылки на картинку,
       а мы рисуем на canvas прямо в телефоне. Поэтому — сохранение. */
    return saveImage(dataUrl, "moya-instrukciya.png");
  }

  function addToFavorites() {
    if (has("8.0")) { try { tg.addToHomeScreen(); return Promise.resolve(true); } catch (e) {} }
    return Promise.resolve(false);
  }

  /* Сохранение картинки. Прямая загрузка файла в вебвью Telegram на айфоне
     не срабатывает, поэтому показываем картинку во весь экран: удержание
     пальцем сохраняет её в фотоплёнку штатным меню системы. */
  function saveImage(dataUrl, filename) {
    var anchorWorks = !inTG || (tg.platform !== "ios" && tg.platform !== "macos");
    if (anchorWorks) {
      var a = document.createElement("a");
      a.href = dataUrl; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      toast("Сохранено");
      return Promise.resolve(true);
    }
    showImageSheet(dataUrl);
    return Promise.resolve(true);
  }

  var sheet = null;
  function showImageSheet(dataUrl) {
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.className = "sheet";
      sheet.innerHTML = '<div class="sheet-in">' +
        '<img alt="Моя инструкция">' +
        '<p class="sheet-hint">Нажмите на картинку и удерживайте — «Сохранить в фото»</p>' +
        '<button class="btn ghost sheet-close">Закрыть</button>' +
      "</div>";
      document.body.appendChild(sheet);
      sheet.addEventListener("click", function (e) {
        if (e.target === sheet || e.target.classList.contains("sheet-close")) sheet.classList.remove("on");
      });
    }
    sheet.querySelector("img").src = dataUrl;
    sheet.classList.add("on");
  }

  function haptic(type) {
    if (!has("6.1") || !tg.HapticFeedback) return;
    try { tg.HapticFeedback.notificationOccurred(type || "success"); } catch (e) {}
  }

  function openApp(url) {
    if (inTG) tg.openTelegramLink(url); else window.open(url, "_blank");
  }

  /* Параметр прямой ссылки: t.me/bot/app?startapp=ne-revi */
  function startParam() {
    if (inTG && tg.initDataUnsafe && tg.initDataUnsafe.start_param) return tg.initDataUnsafe.start_param;
    var qp = new URLSearchParams(location.search).get("startapp") || new URLSearchParams(location.search).get("tgWebAppStartParam");
    return qp || location.hash.replace("#", "");
  }

  /* Системная кнопка «назад» в шапке Telegram. */
  var backHandler = null;
  function setBack(fn) {
    if (!inTG || !tg.BackButton) return;
    if (backHandler) { tg.BackButton.offClick(backHandler); backHandler = null; }
    if (fn) {
      backHandler = function () { fn(); };
      tg.BackButton.onClick(backHandler);
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
  }

  /* Спросить «точно закрыть?» — чтобы не потерять начатый тест. */
  function confirmClose(on) {
    if (!has("6.2")) return;
    try { on ? tg.enableClosingConfirmation() : tg.disableClosingConfirmation(); } catch (e) {}
  }

  /* ── тост ── */

  var toastEl = null, toastTimer = null;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("on"); }, 1800);
  }

  /* ── старт ── */

  function init() {
    if (inTG) {
      try { tg.ready(); } catch (e) {}
      try { tg.expand(); } catch (e) {}
      /* иначе свайп вниз посреди теста закрывает приложение */
      if (has("7.7")) { try { tg.disableVerticalSwipes(); } catch (e) {} }
      applyInsets();
      if (has("8.0")) {
        tg.onEvent("safeAreaChanged", applyInsets);
        tg.onEvent("contentSafeAreaChanged", applyInsets);
      }
      tg.onEvent("viewportChanged", applyInsets);
      /* вебвью Telegram иногда открывает страницу чуть проскролленной —
         с виду «пустой фон сверху, текст обрезан». Прибиваем к началу. */
      window.scrollTo(0, 0);
      setTimeout(function () { window.scrollTo(0, 0); applyInsets(); }, 300);
    }
    initScheme();
  }

  return {
    getLaunchParams: function () { return Promise.resolve(null); },
    platform: "tg", native: inTG, init: init,
    followLabel: "Читать канал Насти",
    followThanks: "",                 /* подписку подтвердить нечем — не благодарим авансом */
    canAllowMessages: false,
    canStory: false,                  /* историю из canvas Telegram не принимает */

    get: get, set: set, user: user,
    share: share, copy: copy, follow: follow, allowMessages: allowMessages,
    story: story, addToFavorites: addToFavorites, saveImage: saveImage,
    haptic: haptic, toast: toast, openApp: openApp,
    startParam: startParam, setBack: setBack, confirmClose: confirmClose
  };
})();
