// Проверка разбора банковских SMS на живых примерах.
// Запуск: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBankSms } from '../src/lib/smsParser.js';

const HUMANS = `Pokupka 1 700.00 UZS, po karte *2073, 2026-09-21 13:22:34, UZB, OOO ATTO TOLOV Komissiya: 0.00 UZS. Dostupno: 18 842.39 UZS
Pokupka 1 700.00 UZS, po karte *2073, 2026-09-19 13:38:43, UZB, OOO ATTO TOLOV Komissiya: 0.00 UZS. Dostupno: 20 542.39 UZS
Pokupka 205 800.00 UZS, po karte *2073, 2026-09-18 14:03:56, UZB, OOO GRAND PHARM TRADE Komissiya: 0.00 UZS. Dostupno: 22 242.39 UZS
Perevod na kartu *2073, 200 000.00 UZS 2026-09-18 13:57:45 Komissiya: 0.00 UZS. Dostupno: 228 042.39 UZS`;

test('карта *2073: четыре SMS подряд дают четыре операции', () => {
  const r = parseBankSms(HUMANS);
  assert.equal(r.length, 4);
  assert.deepEqual(r.map(x => x.amount), [1700, 1700, 205800, 200000]);
  assert.deepEqual(r.map(x => x.type), ['expense', 'expense', 'expense', 'income']);
  assert.ok(r.every(x => x.card === '2073' && x.currency === 'UZS'));
  assert.deepEqual(r.map(x => x.balanceAfter), [18842.39, 20542.39, 22242.39, 228042.39]);
});

test('карта *2073: дата, время и получатель', () => {
  const [a, , , d] = parseBankSms(HUMANS);
  assert.equal(a.date, '2026-09-21');
  assert.equal(a.time, '13:22');
  assert.equal(a.description, 'OOO ATTO TOLOV');
  assert.equal(d.description, 'Perevod na kartu');
});

test('карта *2073: одно SMS отдельно', () => {
  const r = parseBankSms(HUMANS.split('\n')[2]);
  assert.equal(r.length, 1);
  assert.equal(r[0].amount, 205800);
  assert.equal(r[0].description, 'OOO GRAND PHARM TRADE');
});

test('ненулевая комиссия попадает в fee, а не в сумму', () => {
  const r = parseBankSms('Pokupka 50 000.00 UZS, po karte *2073, 2026-09-20 10:00:00, UZB, OOO TEST Komissiya: 500.00 UZS. Dostupno: 1 000.00 UZS');
  assert.equal(r.length, 1);
  assert.equal(r[0].amount, 50000);
  assert.equal(r[0].fee, 500);
});

test('Kapitalbank *1515: покупка в сумах, остаток в долларах', () => {
  const r = parseBankSms('Karta *1515. Pokupka/Xarid: "YANDEX GO", -45 000.00, UZS, "21.09.26 12:30". Dostupno: 123.45 USD');
  assert.equal(r.length, 1);
  assert.equal(r[0].amount, 45000);
  assert.equal(r[0].currency, 'UZS');
  assert.equal(r[0].card, '1515');
  assert.equal(r[0].balanceAfter, 123.45);
  assert.equal(r[0].description, 'YANDEX GO');
});

test('формат с summa и маской карты', () => {
  const r = parseBankSms('Spisanie: summa:501250.00 UZS, karta: 8600***1234, 21.09.2026 10:00, balans: 1 633 421.97 UZS');
  assert.equal(r.length, 1);
  assert.equal(r[0].amount, 501250);
  assert.equal(r[0].date, '2026-09-21');
  assert.equal(r[0].balanceAfter, 1633421.97);
});

test('два SMS Kapitalbank подряд не путают карты', () => {
  const r = parseBankSms('Karta *4283. Pokupka: "KORZINKA", -120 500.00, UZS, "18.09.26 20:05". Dostupno: 98 100.00 UZS\nKarta *7647. Pokupka: "EVOS", -60 000.00, UZS, "19.09.26 13:00". Dostupno: 93 400.00 UZS');
  assert.equal(r.length, 2);
  assert.deepEqual(r.map(x => x.card), ['4283', '7647']);
});

test('секунды времени и код страны не принимаются за сумму', () => {
  const r = parseBankSms('Pokupka 1 700.00 UZS, po karte *2073, 2026-09-21 13:22:34, UZB, OOO ATTO TOLOV Komissiya: 0.00 UZS. Dostupno: 18 842.39 UZS');
  assert.equal(r[0].amount, 1700);
});
