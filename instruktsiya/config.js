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
  TG_APP_PEREVODCHIK: "",
  TG_APP_INSTRUKTSIYA: "",

  /* Кнопка «Прислать разбор по вашему типу». Разрешение писать в личку само по себе
     ничего не отправляет: пока в боте нет сценария, который реально шлёт разбор,
     кнопку не показываем — иначе это обещание, которого никто не выполнит. */
  RAZBOR_ENABLED: false,

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
