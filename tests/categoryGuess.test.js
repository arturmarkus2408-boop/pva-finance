import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guessCategory, otherCategoryOf } from '../src/lib/categoryGuess.js';

const MY = ['Продукты', 'Коммунальные', 'Аренда', 'Интернет', 'Транспорт', 'Налоги', 'Развлечения', 'Покупки', 'Другое', 'Бухгалтерия Хамид'];

test('проезд ATTO → Транспорт', () => {
  assert.equal(guessCategory('OOO ATTO TOLOV', MY), 'Транспорт');
});

test('еда → из списка пользователя', () => {
  assert.equal(guessCategory('ANGLESEY FOOD', MY), 'Продукты');
  assert.equal(guessCategory('ANGLESEY FOOD', [...MY, 'Кафе']), 'Кафе');
});

test('незнакомый получатель → «Другое», а не последняя категория', () => {
  assert.equal(guessCategory('OOO GRAND PHARM TRADE', MY), 'Другое');
  assert.equal(guessCategory('', MY), 'Другое');
  assert.notEqual(guessCategory('ЧТО-ТО НОВОЕ', MY), 'Бухгалтерия Хамид');
});

test('категория никогда не придумывается', () => {
  assert.equal(guessCategory('OOO ATTO TOLOV', ['Еда', 'Разное']), null);
  assert.equal(otherCategoryOf(['Boshqa', 'Transport']), 'Boshqa');
});
