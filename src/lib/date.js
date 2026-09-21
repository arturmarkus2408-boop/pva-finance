// Сегодняшняя дата по часам телефона, в виде YYYY-MM-DD.
// toISOString() для этого не годится: он считает по Гринвичу, и в Ташкенте (UTC+5)
// с полуночи до пяти утра выдаёт вчерашнее число.
export const todayLocal = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

// То же самое для произвольной даты — используется при расчёте периодов (сегодня/неделя/месяц/год)
export const toIsoDate = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
