// Разбор текста банковского SMS — чистые функции без побочных эффектов,
// не зависят от состояния приложения. Используются и в приложении, и в тестах.

export const SMS_EXPENSE_WORDS = /(spisanie|списание|pokupka|покупка|platezh|платеж|платёж|oplata|оплата|snyatie|снятие|otpravleno|отправлено|perevod s karty|перевод с карты|withdrawal|debit|xarid|yechib)/i;
export const SMS_INCOME_WORDS = /(popolnenie|пополнение|zachislenie|зачисление|postuplenie|поступление|vozvrat|возврат|refund|credit|zarplata|зарплата|tushum|kirim|perevod na kartu|перевод на карту)/i;

// Приводит "1 633 421.97" / "501250,00" / "400 000" к числу
export const parseSmsNumber = (raw) => {
  if (!raw) return null;
  let v = String(raw).replace(/\s/g, '');
  const lastDot = v.lastIndexOf('.');
  const lastComma = v.lastIndexOf(',');
  const sep = Math.max(lastDot, lastComma);
  if (sep > -1 && /^\d{1,2}$/.test(v.slice(sep + 1))) {
    v = v.slice(0, sep).replace(/[.,]/g, '') + '.' + v.slice(sep + 1);
  } else {
    v = v.replace(/[.,]/g, '');
  }
  const n = parseFloat(v);
  return isFinite(n) ? n : null;
};

export const parseBankSms = (text) => {
  if (!text || typeof text !== 'string') return [];
  const clean = text.replace(/\u00a0/g, ' ').replace(/\r/g, '').replace(/[«»“”„]/g, '"');

  // Как резать текст на отдельные сообщения.
  // Kapitalbank начинает каждое SMS с «Karta *1515. Xarid/Pokupka ...» — режем по этому началу.
  // У Hamkorbank и похожих карта стоит в середине, а начало — слово операции («Spisanie», «Pokupka»).
  const cardFirst = /(?=(?:karta|карта|card)\s*\*+\s*\d{4}\s*\.\s*(?!summa|сумма|balans|баланс|dostupno|доступно)[A-Za-zА-Яа-яЁёʻʼ'’]+[/\s:])/gi;
  const wordFirst = /(?=(?:spisanie|списание|pokupka|покупка|platezh|платеж|платёж|oplata|оплата|snyatie|снятие|popolnenie|пополнение|zachislenie|зачисление|postuplenie|поступление|vozvrat|возврат|perevod|перевод)\b)/gi;
  const hasAmount = (x) => /summa|сумма|[+-]\s?\d[\d\s]*(?:[.,]\d{1,2})?\s*,?\s*[A-Z]{3}\b/i.test(x)
    || /(?<![\d:.,])\d[\d\s]*[.,]\d{2}\s*[A-Z]{3}\b/.test(x);
  let chunks;
  if (clean.match(cardFirst)) {
    chunks = clean.split(cardFirst)
      .flatMap(part => ((part.match(/summa|сумма/gi) || []).length > 1 ? part.split(wordFirst) : [part]));
  } else {
    chunks = clean.split(wordFirst);
  }
  chunks = chunks.map(x => x.trim()).filter(hasAmount);
  const source = chunks.length ? chunks : [clean];

  const toUZS = (cur) => (/СУМ|SO'M|СЎМ|SUM/i.test(cur) ? 'UZS' : cur.toUpperCase());
  const out = [];
  source.forEach(chunk => {
    // Остаток после операции убираем из текста заранее, чтобы его число
    // никогда не приняли за сумму самой операции
    const balRe = /(?:balans|баланс|dostupno|доступно|ostatok|остаток|qoldiq|mavjud)\s*[:=]?\s*([\d\s.,]+?)\s*,?\s*([A-Z]{3}|сум|so'm|сўм)/i;
    const balM = chunk.match(balRe);
    const body = balM ? chunk.slice(0, balM.index) : chunk;

    let amount = null, cur = null, sign = null, amountIndex = -1;
    // 1) «summa:501250.00 UZS»
    const summaM = body.match(/(?:summa|сумма)\s*[:=]?\s*([+-]?)\s*([\d\s.,]+?)\s*([A-Z]{3}|сум|so'm|сўм)/i);
    if (summaM) {
      sign = summaM[1] || null;
      amount = parseSmsNumber(summaM[2]);
      cur = toUZS(summaM[3]);
    } else {
      // 2) Kapitalbank: сумма со знаком сразу после названия магазина в кавычках
      const kbM = body.match(/"\s*,\s*([+-]?)\s*(\d[\d\s]*(?:[.,]\d{1,2})?)\s*,\s*([A-Z]{3})\b/)
        // 3) Любая сумма со знаком и кодом валюты
        || body.match(/([+-])\s*(\d[\d\s]*(?:[.,]\d{1,2})?)\s*,?\s*([A-Z]{3})\b/);
      if (kbM) {
        sign = kbM[1] || null;
        amount = parseSmsNumber(kbM[2]);
        cur = toUZS(kbM[3]);
      } else {
        // 4) Сумма без знака: «Pokupka 1 700.00 UZS, po karte *2073, ...».
        // Берём первую сумму с кодом валюты; число после двоеточия (секунды времени)
        // или внутри другого числа не считается.
        const plainM = body.match(/(?<![\d:.,])(\d[\d\s]*(?:[.,]\d{1,2})?)\s*,?\s*([A-Z]{3}|сум|so'm|сўм)\b/);
        const before = plainM ? body.slice(Math.max(0, plainM.index - 14), plainM.index) : '';
        if (plainM && !/(?:komissiya|комиссия|fee)\s*[:=]?\s*$/i.test(before)) {
          amount = parseSmsNumber(plainM[1]);
          cur = toUZS(plainM[2]);
          amountIndex = plainM.index;
        }
      }
    }
    if (!amount || amount <= 0) return;

    const cardM = chunk.match(/(?:kart[aeuyи]?|карт[аеуы]?|card)\s*[:\s]*[*x•]*\s*(\d{4})\b/i)
      || chunk.match(/\d{6}\*+(\d{4})\b/)
      || chunk.match(/[*x•]{2,}\s*(\d{4})\b/);
    const isoM = chunk.match(/(\d{4})-(\d{2})-(\d{2})(?:[ T,]+(\d{1,2}):(\d{2}))?/);
    const dtM = isoM ? null : chunk.match(/(\d{2})[./-](\d{2})[./-](\d{2,4})[\s,]+(\d{1,2}):(\d{2})/);
    let date = null, time = null;
    if (isoM) {
      date = isoM[1] + '-' + isoM[2] + '-' + isoM[3];
      if (isoM[4]) time = String(isoM[4]).padStart(2, '0') + ':' + isoM[5];
    } else if (dtM) {
      const yy = dtM[3].length === 2 ? '20' + dtM[3] : dtM[3];
      date = yy + '-' + dtM[2] + '-' + dtM[1];
      time = String(dtM[4]).padStart(2, '0') + ':' + dtM[5];
    } else {
      const dM = chunk.match(/(\d{2})[./-](\d{2})[./-](\d{2,4})/);
      if (dM) {
        const yy = dM[3].length === 2 ? '20' + dM[3] : dM[3];
        date = yy + '-' + dM[2] + '-' + dM[1];
      }
    }

    // Направление: знак суммы надёжнее слов. Нет знака — смотрим на слова.
    const isIncome = sign === '+' ? true
      : sign === '-' ? false
      : (SMS_INCOME_WORDS.test(chunk) && !SMS_EXPENSE_WORDS.test(chunk));

    // Описание: у Kapitalbank это первая фраза в кавычках, которая не является датой
    const quoted = [...chunk.matchAll(/"([^"]{2,80})"/g)].map(m => m[1]).find(q => !/^\d{2}[./-]\d{2}[./-]\d{2,4}/.test(q.trim()));
    let desc = quoted
      ? quoted.replace(/[>]+$/, '').trim()
      : chunk.split(/(?:summa|сумма)/i)[0]
          .replace(/\s+/g, ' ')
          .replace(/^[^:]{0,24}:\s*/, '')
          .replace(/\d{2}[./-]\d{2}[./-]\d{2,4}.*$/, '')
          .replace(/(?:kart[aи]?|карт[аы]?)\s*[:\s]*[*x•\d]*/i, '')
          .replace(/[,.\s]+$/, '')
          .trim();
    // Формат «Pokupka 1 700.00 UZS, po karte *2073, 2026-09-21 13:22:34, UZB, OOO ATTO TOLOV Komissiya: ...»:
    // получатель стоит после даты и кода страны, до слова «Komissiya»
    if (!quoted && isoM) {
      const afterDate = body.slice(isoM.index + isoM[0].length)
        .replace(/^(?::\d{2})?\s*,?\s*/, '')
        .replace(/^[A-Z]{3}\s*,\s*/, '')
        .split(/(?:komissiya|комиссия|fee)/i)[0]
        .replace(/[,.\s]+$/, '')
        .trim();
      if (afterDate) desc = afterDate;
      else if (amountIndex > 0) {
        // Получателя нет — берём начало SMS: «Perevod na kartu»
        desc = body.slice(0, amountIndex).replace(/[*x•]+\s*\d{4}/, '').replace(/[,.:\s]+$/, '').trim();
      }
    }
    // «ANGLESEY FOOD, TASHKENT, CHILANZARSKIY RAYON ...» — после первой запятой идёт адрес
    if (!quoted && desc.includes(',')) {
      const head = desc.split(',')[0].trim();
      if (head.length >= 3) desc = head;
    }
    if (desc.length > 60) desc = desc.slice(0, 60);

    // Комиссия банка, если она не нулевая и в той же валюте, что и операция
    const feeM = body.match(/(?:komissiya|комиссия|fee)\s*[:=]?\s*([\d\s.,]+?)\s*,?\s*([A-Z]{3}|сум|so'm|сўм)/i);
    const feeVal = feeM ? parseSmsNumber(feeM[1]) : null;
    const fee = (feeVal && feeVal > 0 && toUZS(feeM[2]) === cur) ? feeVal : 0;

    out.push({
      type: isIncome ? 'income' : 'expense',
      amount,
      currency: cur,
      date,
      time,
      card: cardM ? cardM[1] : null,
      balanceAfter: balM ? parseSmsNumber(balM[1]) : null,
      fee,
      description: desc,
      category: null,
      possibleTransfer: /uzcard to visa|visa to uzcard|p2p|перевод|o'tkazma/i.test(chunk)
    });
  });
  return out;
};
