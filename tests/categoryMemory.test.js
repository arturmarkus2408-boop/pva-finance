import { test } from 'node:test';
import assert from 'node:assert/strict';
import { merchantKey, learnRule, ruleCategory, propagateCategoryEdit, reassignOrphans } from '../src/lib/categoryMemory.js';

const tx = (id, desc, cat, extra = {}) => ({ id, type: 'expense', amount: 1700, description: desc, category: cat, ...extra });

test('ключ получателя без ООО, адреса после « · » и регистра', () => {
  assert.equal(merchantKey('OOO ATTO TOLOV'), 'ATTO TOLOV');
  assert.equal(merchantKey('ООО «ATTO TOLOV» · комиссия 0'), 'ATTO TOLOV');
  assert.equal(merchantKey(''), '');
});

test('правка A→Б меняет только тот же получатель с той же старой категорией', () => {
  const list = [
    tx('1', 'OOO ATTO TOLOV', 'Бухгалтерия'),
    tx('2', 'OOO ATTO TOLOV', 'Бухгалтерия'),
    tx('3', 'OOO ATTO TOLOV', 'Развлечения'),              // другая старая категория — не трогаем
    tx('4', 'ANGLESEY FOOD', 'Бухгалтерия'),               // другой получатель — не трогаем
    tx('5', 'OOO ATTO TOLOV', 'Бухгалтерия', { catLocked: true }), // выбрано вручную — не трогаем
    tx('6', 'OOO ATTO TOLOV', 'Бухгалтерия', { type: 'income' })   // доход — не трогаем
  ];
  list[0].category = 'Транспорт'; // пользователь исправил первую
  const { next, changed } = propagateCategoryEdit(list, '1', 'Бухгалтерия', 'Транспорт');
  assert.equal(changed, 1);
  assert.deepEqual(next.map(x => x.category), ['Транспорт', 'Транспорт', 'Развлечения', 'Бухгалтерия', 'Бухгалтерия', 'Бухгалтерия']);
  assert.equal(next[0].catLocked, true);
});

test('выученное правило применяется к новым SMS, только если категория есть в списке', () => {
  const r = learnRule({}, 'expense', 'OOO ATTO TOLOV', 'Транспорт');
  assert.equal(ruleCategory(r, 'expense', 'ООО ATTO TOLOV', ['Транспорт']), 'Транспорт');
  assert.equal(ruleCategory(r, 'expense', 'ООО ATTO TOLOV', ['Еда']), null);
  assert.equal(ruleCategory(r, 'income', 'ООО ATTO TOLOV', ['Транспорт']), null);
});

test('операции удалённой категории разносятся автоматически, выбранные вручную — нет', () => {
  const list = [
    tx('1', 'OOO ATTO TOLOV', 'Бухгалтерия Хамид'),
    tx('2', 'ANGLESEY FOOD', 'Бухгалтерия Хамид'),
    tx('3', 'X', 'Бухгалтерия Хамид', { catLocked: true }),
    tx('4', 'Y', 'Продукты')
  ];
  const cats = ['Продукты', 'Транспорт', 'Другое'];
  const pick = (t) => /ATTO/.test(t.description) ? 'Транспорт' : /FOOD/.test(t.description) ? 'Продукты' : 'Другое';
  const { next, changed } = reassignOrphans(list, () => cats, pick);
  assert.equal(changed, 2);
  assert.deepEqual(next.map(x => x.category), ['Транспорт', 'Продукты', 'Бухгалтерия Хамид', 'Продукты']);
});
