// Сегодняшняя дата по часам телефона, в виде YYYY-MM-DD.
// toISOString() для этого не годится: он считает по Гринвичу, и в Ташкенте (UTC+5)
// с полуночи до пяти утра выдаёт вчерашнее число.
export const todayLocal = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

// То же самое для произвольной даты — используется при расчёте периодов (сегодня/неделя/месяц/год)
export const toIsoDate = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

// Уникальный id для новых записей. Date.now() сам по себе может совпасть,
// если две записи создаются в одну миллисекунду (пакетный импорт + ручной ввод).
let lastId = 0;
export const newId = () => {
  const n = Date.now();
  lastId = n > lastId ? n : lastId + 1;
  return lastId;
};

// Сумма из поля ввода: принимает и точку, и запятую, и пробелы между разрядами.
// На части Android-клавиатур десятичный разделитель — запятая, а parseFloat("3,9") даёт 3.
export const parseAmount = (v) => {
  if (typeof v === 'number') return isFinite(v) ? v : NaN;
  const n = parseFloat(String(v || '').replace(/\s/g, '').replace(',', '.'));
  return isFinite(n) ? n : NaN;
};

// Название валюты: до 30 символов, без «|» (он служит разделителем во внутренних ключах).
// Трёхбуквенный латинский код приводится к заглавным (usd → USD), остальное — как ввёл человек.
export const normalizeCurrencyName = (raw) => {
  const v = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!v || v.length > 30 || v.includes('|')) return '';
  return /^[A-Za-z]{3}$/.test(v) ? v.toUpperCase() : v;
};
