/* Общие константы обоих приложений — сразу для двух платформ.
   Платформенный файл (vk.js или tg.js) при загрузке выставляет CFG.platform,
   и все ссылки ниже начинают отдаваться в терминах нужной платформы. */

window.CFG = {

  platform: "vk",              /* перезапишет tg.js, если собрана версия для Telegram */

  /* ── ВКонтакте ── */
  GROUP_ID: 236283706,
  GROUP_URL: "https://vk.com/erasova_nastya",
  APP_ID_PEREVODCHIK: 54716720,
  APP_ID_INSTRUKTSIYA: 54716740,

  /* ── Telegram ── */
  TG_BOT: "erasova_psy_bot",
  TG_CHANNEL_URL: "https://t.me/erasova_psy",
  /* short name мини-аппа из BotFather (/newapp). Пока приложения не заведены —
     ссылка «поделиться» ведёт на бота, а не на конкретное приложение. */
  TG_APP_PEREVODCHIK: "perevodchik",
  TG_APP_INSTRUKTSIYA: "instrukciya",

  /* Кнопка «Прислать разбор по вашему типу». Включать только когда на платформе
     есть сценарий, который реально шлёт разбор: в Telegram — автоматизации Chatplace
     на razbor_<тип>, во ВК — пока ничего. Иначе кнопка — обещание, которого
     никто не выполнит. */
  RAZBOR_ENABLED_TG: false,   /* поднять после создания автоматизаций в Chatplace */
  RAZBOR_ENABLED_VK: false,

  /* Документы школы. В приложениях НЕ показываются — приложения данных не собирают
     (ответы остаются в телефоне). Согласие живёт в точках сбора: в первых сообщениях
     ботов (регистратор, автоматизации Chatplace). Ссылки здесь — как справочник. */
  LEGAL_POLICY: "https://lk.erasovaonline.ru/privacy-policy",
  LEGAL_CONSENT: "https://lk.erasovaonline.ru/consent",

  /* Экран подписки перед контентом (только ВКонтакте): человек вступает в
     сообщество и разрешает сообщения — дальше открывается приложение.
     Включён 17.08.2026 по решению Натальи. */
  ALLOW_GATE_VK: true,

  allowGate: function () {
    return this.platform === "vk" && this.ALLOW_GATE_VK;
  },

  razborEnabled: function () {
    return this.platform === "tg" ? this.RAZBOR_ENABLED_TG : this.RAZBOR_ENABLED_VK;
  },

  /* Подарок «Что сказать себе» (7 фраз, 9 карточек). Во ВК разрешение на
     сообщения ловит серверный мост и ставит человека на бота Senler
     «Подарок: Что сказать себе» — поэтому кнопка живёт только там.
     В Telegram пути выдачи пока нет. */
  PODAROK_ENABLED_VK: true,

  podarokEnabled: function () {
    return this.platform === "vk" && this.PODAROK_ENABLED_VK;
  },

  /* Ссылка «пришли мне разбор типа X в личку от бота» — только Telegram */
  razborLink: function (type) {
    return "https://t.me/" + this.TG_BOT + "?start=razbor_" + type;
  },


  /* ── ссылки ── */

  /* app: "perevodchik" | "instruktsiya" */
  link: function (app) {
    if (this.platform === "tg") {
      var short = app === "perevodchik" ? this.TG_APP_PEREVODCHIK : this.TG_APP_INSTRUKTSIYA;
      return short ? "https://t.me/" + this.TG_BOT + "/" + short : "https://t.me/" + this.TG_BOT;
    }
    var id = app === "perevodchik" ? this.APP_ID_PEREVODCHIK : this.APP_ID_INSTRUKTSIYA;
    return id ? "https://vk.com/app" + id : this.GROUP_URL;
  },

  /* Ссылка внутрь приложения: у ВК это #хэш, у Telegram — ?startapp= */
  deepLink: function (app, param) {
    var base = this.link(app);
    if (!param) return base;
    if (this.platform !== "tg") return base + "#" + param;
    /* Пока мини-апп не заведён в BotFather, отдаём голую ссылку на бота:
       ?start= перехватят сценарии Chatplace и ответят не тем. */
    return base.indexOf("/" + this.TG_BOT + "/") === -1
      ? base
      : base + "?startapp=" + encodeURIComponent(param);
  },

  /* Куда ведёт кнопка сообщества: паблик ВК / канал в Telegram */
  communityUrl: function () {
    return this.platform === "tg" ? this.TG_CHANNEL_URL : this.GROUP_URL;
  }
};
