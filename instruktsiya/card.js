/* Рендер картинки «Моя инструкция» на canvas.
   Раскладка повторяет карусели сообщества: крем, вино, капс, скруглённая карточка. */

window.InstructionCard = (function () {

  var CREAM = "#F7F0EA";
  var WINE = "#33101D";
  var CRIMSON = "#8E2B42";
  var MUTED = "#8B7479";
  var ONCARD = "#F2E7E9";
  var FOOT = "#B9A7A9";
  var FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

  function rr(x, ctx, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function wrap(ctx, text, maxW) {
    var words = String(text).split(" ");
    var lines = [], line = "";
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  /* mode: "post" (1080×1350) или "story" (1080×1920) */
  function draw(rules, mode) {
    var W = 1080;
    var H = mode === "story" ? 1920 : 1350;
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d");

    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, W, H);

    var pad = 78;
    var innerW = W - pad * 2;

    /* ── считаем высоту карточки ── */
    var rulePad = 54;
    var ruleFont = rules.length > 6 ? 37 : 41;
    ctx.font = "600 " + ruleFont + 'px ' + FAMILY;
    var ruleMaxW = innerW - rulePad * 2 - 58;
    var blocks = rules.map(function (r) { return wrap(ctx, r, ruleMaxW); });
    var lineH = Math.round(ruleFont * 1.28);
    var gap = 30;
    var cardH = rulePad * 2;
    blocks.forEach(function (b, i) {
      cardH += b.length * lineH;
      if (i < blocks.length - 1) cardH += gap;
    });

    /* ── вертикальная раскладка ── */
    var titleFont = mode === "story" ? 104 : 96;
    var titleLines = ["МОЯ", "ИНСТРУКЦИЯ"];
    var titleH = titleLines.length * Math.round(titleFont * .93);
    var kickerH = 34;
    var footH = 96;
    var blockH = kickerH + 34 + titleH + 46 + cardH + 40 + 60;
    var top = Math.max(mode === "story" ? 250 : 116, Math.round((H - footH - blockH) / 2));

    var y = top;

    /* эйрбоу */
    ctx.fillStyle = MUTED;
    ctx.font = "700 27px " + FAMILY;
    ctx.fillText("// тень хорошей девочки", pad, y + 22);
    y += kickerH + 34;

    /* заголовок */
    ctx.fillStyle = WINE;
    ctx.font = "800 " + titleFont + "px " + FAMILY;
    titleLines.forEach(function (t) {
      y += Math.round(titleFont * .93);
      ctx.fillText(t, pad, y - Math.round(titleFont * .18));
    });
    y += 46;

    /* карточка с правилами */
    ctx.fillStyle = WINE;
    rr(pad, ctx, y, innerW, cardH, 30);

    var ty = y + rulePad;
    ctx.textBaseline = "top";
    blocks.forEach(function (b, i) {
      ctx.fillStyle = CRIMSON;
      ctx.font = "800 " + ruleFont + "px " + FAMILY;
      ctx.fillText("—", pad + rulePad, ty + 2);

      ctx.fillStyle = ONCARD;
      ctx.font = "600 " + ruleFont + "px " + FAMILY;
      b.forEach(function (l, j) {
        ctx.fillText(l, pad + rulePad + 58, ty + j * lineH);
      });
      ty += b.length * lineH + gap;
    });
    ctx.textBaseline = "alphabetic";
    y += cardH + 40;

    /* подпись под карточкой */
    ctx.fillStyle = MUTED;
    ctx.font = "500 29px " + FAMILY;
    ctx.fillText("Её никто не писал на бумаге. Её просто выдали.", pad, y + 26);

    /* футер */
    ctx.fillStyle = FOOT;
    ctx.font = "500 27px " + FAMILY;
    ctx.fillText("@nastya_erasova", pad, H - 64);
    var right = "приложение «Твоя инструкция»";
    ctx.fillText(right, W - pad - ctx.measureText(right).width, H - 64);

    return cv.toDataURL("image/png");
  }

  return { draw: draw };
})();
