// Сверка с банком — чистая функция от операций и точек сброса («Принять остаток банка»).
// Идёт по операциям каждой карты от одной банковской точки остатка к другой и находит,
// на каком именно отрезке расчётный остаток разошёлся с тем, что сообщил банк.

export function computeReconciliation(transactions, reconAnchors) {

  const stampOf = (tx) => tx.date + ' ' + (tx.time || '00:00');
  // При одинаковом времени сначала обычные операции, потом точки с остатком:
  // так поправка, внесённая «на ту же минуту», попадает в свой отрезок
  const byTime = (a, b) => {
    const d = stampOf(a).localeCompare(stampOf(b));
    if (d !== 0) return d;
    return (a.balanceAfter != null ? 1 : 0) - (b.balanceAfter != null ? 1 : 0);
  };
  const groups = {};
  transactions.forEach(tx => {
    if (!tx.card || tx.balanceAfter == null) return;
    const key = tx.card + '|' + tx.currency;
    (groups[key] = groups[key] || []).push(tx);
  });

  return Object.entries(groups).map(([key, points]) => {
    const [card, cur] = key.split('|');
    const anchor = reconAnchors[key];
    points = points.filter(p => !anchor || stampOf(p) >= anchor).sort(byTime);
    if (points.length === 0) return null;
    const first = points[0];
    const last = points[points.length - 1];
    const base = { key, card, currency: cur, bank: last.balanceAfter, date: last.date, time: last.time || '' };
    if (points.length < 2) return { ...base, expected: last.balanceAfter, diff: 0, comparable: false, steps: [], gaps: [] };

    // Идём по операциям карты от первой точки к последней и после каждой точки
    // с остатком сравниваем расчётный остаток с банковским. Расхождение фиксируется
    // на том отрезке, где возникло, а дальше счёт продолжается от банковской цифры —
    // так видно, где именно пропущена операция, а не только общая сумма.
    const between = transactions
      .filter(tx => tx.card === card && tx.currency === cur && byTime(tx, first) > 0 && byTime(tx, last) <= 0)
      .sort(byTime);
    let running = first.balanceAfter;
    const steps = [{ tx: first, running, bank: first.balanceAfter, gap: 0, isStart: true }];
    between.forEach(tx => {
      running = Math.round((running + (tx.type === 'income' ? tx.amount : -tx.amount)) * 100) / 100;
      if (tx.balanceAfter != null) {
        const gap = Math.round((tx.balanceAfter - running) * 100) / 100;
        steps.push({ tx, running, bank: tx.balanceAfter, gap });
        running = tx.balanceAfter;
      } else {
        steps.push({ tx, running });
      }
    });
    const gaps = steps.filter(st => st.gap != null && Math.abs(st.gap) >= 0.01);
    const diff = Math.round(gaps.reduce((a, st) => a + st.gap, 0) * 100) / 100;
    return { ...base, expected: last.balanceAfter - diff, diff, comparable: true, steps, gaps };
  }).filter(Boolean).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}
