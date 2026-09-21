// Проверка «это одна и та же операция», описанная отдельно от компонента,
// потому что от неё зависит вся защита от задвоения при импорте SMS и фото.

export const isSameTx = (a, b) => {
  // Номер транзакции из квитанции — самый надёжный признак.
  // Есть у обеих и совпал — это одна операция, других проверок не нужно.
  // Есть у обеих и разный — это точно разные операции.
  if (a.ref && b.ref) return a.ref === b.ref;

  // Одна карта, та же минута и тот же остаток после операции — это одна и та же операция,
  // даже если сумма записана по-разному (например, пересчитана из сумов в доллары)
  if (a.card && a.card === b.card && a.date === b.date && a.time && a.time === b.time &&
      a.balanceAfter != null && b.balanceAfter != null &&
      Math.round(a.balanceAfter * 100) === Math.round(b.balanceAfter * 100)) return true;

  if (a.type !== b.type) return false;
  if ((a.currency || '') !== (b.currency || '')) return false;

  // Одна и та же операция могла попасть в базу без комиссии (из SMS)
  // и с комиссией (из квитанции) — сравниваем оба варианта суммы.
  const amountsOf = (x) => [x.amount, x.baseAmount, x.total]
    .filter(v => typeof v === 'number' && isFinite(v))
    .map(v => Math.round(v * 100));
  const av = amountsOf(a), bv = amountsOf(b);
  if (!av.some(v => bv.includes(v))) return false;

  if (a.date !== b.date) return false;
  if (a.card && b.card && a.card !== b.card) return false;
  if (a.balanceAfter != null && b.balanceAfter != null &&
      Math.round(a.balanceAfter * 100) !== Math.round(b.balanceAfter * 100)) return false;
  if (a.time && b.time && a.time !== b.time) return false;
  return true;
};

