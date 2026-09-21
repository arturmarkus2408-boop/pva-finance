// Пересчёт суммы операции в валюту карты — например, покупка в сумах на долларовой карте.
// Принимает список распознанных операций плюс три источника данных, которые в приложении
// приходят из состояния: список уже внесённых операций, функцию «в какой валюте карта»
// и функцию «курс валюты к базовой». Здесь они просто параметры, поэтому функцию можно
// протестировать без запуска всего приложения.

export function applyCardCurrency(items, { transactions, cardCurrencyOf, rateOf }) {

  const stampOf = (x) => x.date + ' ' + (x.time || '00:00');
  const order = items.map((it, i) => ({ it, i })).sort((a, b) => stampOf(a.it).localeCompare(stampOf(b.it)));
  const lastBal = {};
  const result = [...items];
  const pending = [];

  order.forEach(({ it, i }) => {
    const bound = cardCurrencyOf(it.card);
    if (!bound || it.currency === bound) {
      if (bound && it.card && it.balanceAfter != null) lastBal[it.card] = it.balanceAfter;
      return;
    }
    let prev = lastBal[it.card];
    let prevSource = prev != null ? 'batch' : null;
    if (prev == null) {
      const earlier = transactions
        .filter(tx => tx.card === it.card && tx.currency === bound && tx.balanceAfter != null && stampOf(tx) < stampOf(it))
        .sort((a, b) => stampOf(b).localeCompare(stampOf(a)))[0];
      if (earlier) { prev = earlier.balanceAfter; prevSource = 'stored'; }
    }
    const original = it.total ?? it.amount;
    const base = { ...it, originalAmount: original, originalCurrency: it.currency, currency: bound, fee: 0 };
    if (prev != null && it.balanceAfter != null && Math.abs(prev - it.balanceAfter) > 0.001) {
      const delta = Math.round(Math.abs(prev - it.balanceAfter) * 100) / 100;
      result[i] = { ...base, amount: delta, total: delta, baseAmount: delta, converted: 'balance', prevSource };
      pending.push(i);
    } else {
      const rFrom = rateOf(it.currency), rTo = rateOf(bound);
      if (rFrom != null && rTo != null) {
        const conv = Math.round(original * rFrom / rTo * 100) / 100;
        result[i] = { ...base, amount: conv, total: conv, baseAmount: conv, converted: 'rate' };
      } else {
        result[i] = { ...base, converted: 'none', needsCheck: true };
      }
    }
    if (it.balanceAfter != null) lastBal[it.card] = it.balanceAfter;
  });

  // Проверка здравого смысла. Если между двумя SMS пропущена операция,
  // разница остатков включит и её — сумма получится завышенной.
  // Курс банка внутри дня почти не меняется, поэтому каждую операцию сверяем
  // с курсом соседних SMS той же пары валют. Допуск 4% плюс запас на округление
  // до цента: у покупки на 4 цента округление само по себе даёт десятки процентов.
  // Соседей нет — сверяем с курсом из настроек, с допуском шире: он мог устареть.
  // Опорный курс соседей считается как отношение сумм, а не медиана:
  // так покупка на 4 цента почти не влияет на опору, а крупная — влияет сильно.
  const implied = pending.map(i => ({
    i,
    pair: result[i].originalCurrency + '>' + result[i].currency,
    from: result[i].originalAmount,
    to: result[i].amount
  }));
  pending.forEach(i => {
    const x = result[i];
    const own = x.originalAmount / x.amount;
    const pair = x.originalCurrency + '>' + x.currency;
    const others = implied.filter(o => o.i !== i && o.pair === pair);
    let reference = null, tolerance = 0;
    if (others.length) {
      reference = others.reduce((a, o) => a + o.from, 0) / others.reduce((a, o) => a + o.to, 0);
      tolerance = 0.04 + 0.01 / x.amount;
    } else {
      const rFrom = rateOf(x.originalCurrency), rTo = rateOf(x.currency);
      if (rFrom != null && rTo != null) {
        reference = rTo / rFrom;
        tolerance = 0.15 + 0.01 / x.amount;
      }
    }
    if (reference == null) {
      if (x.prevSource === 'stored') result[i] = { ...x, needsCheck: true };
    } else if (Math.abs(own / reference - 1) > tolerance) {
      result[i] = { ...x, needsCheck: true };
    }
  });
  return result;
}
