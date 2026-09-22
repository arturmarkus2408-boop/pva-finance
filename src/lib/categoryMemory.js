// Память категорий: приложение запоминает, как пользователь исправил категорию,
// и само применяет это исправление там, где оно действительно подходит.
//
// Правило простое и безопасное:
//   при правке «ATTO TOLOV: Бухгалтерия → Транспорт» меняются только другие операции
//   того же получателя, того же типа (расход/доход) и с той же СТАРОЙ категорией.
//   Операции, где категорию пользователь уже выбрал сам (catLocked), не трогаются никогда.

// Ключ получателя: «OOO ATTO TOLOV · комиссия 0» → «ATTO TOLOV»
export const merchantKey = (description) => {
  let s = String(description || '').split(' · ')[0];
  s = s.toUpperCase()
    .replace(/["«»'’`]/g, ' ')
    .replace(/(?<![\p{L}\p{N}])(OOO|ООО|MCHJ|LLC|LTD|IP|ИП|XK|АО|AO|OAJ|QK)(?![\p{L}\p{N}])/gu, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s.slice(0, 40);
};

// Запомнить: у этого получателя такая категория
export const learnRule = (rules, type, description, category) => {
  const key = merchantKey(description);
  if (!key || !category) return rules || {};
  const base = rules || {};
  return { ...base, [type]: { ...(base[type] || {}), [key]: category } };
};

// Категория из выученных правил — только если она есть в списке пользователя
export const ruleCategory = (rules, type, description, list) => {
  const key = merchantKey(description);
  if (!key || !rules || !rules[type]) return null;
  const cat = rules[type][key];
  return cat && (list || []).includes(cat) ? cat : null;
};

// Пользователь поменял категорию у одной операции: распространяем на такие же.
// Возвращает новый список и сколько ещё операций исправлено.
export const propagateCategoryEdit = (transactions, editedId, oldCategory, newCategory) => {
  const edited = transactions.find(tx => tx.id === editedId);
  if (!edited || !oldCategory || oldCategory === newCategory) {
    return { next: transactions, changed: 0 };
  }
  const key = merchantKey(edited.description);
  let changed = 0;
  const next = transactions.map(tx => {
    if (tx.id === editedId) return { ...tx, catLocked: true };
    if (!key) return tx;
    if (tx.catLocked) return tx;
    if (tx.type !== edited.type) return tx;
    if (tx.category !== oldCategory) return tx;
    if (merchantKey(tx.description) !== key) return tx;
    changed++;
    return { ...tx, category: newCategory };
  });
  return { next, changed };
};

// Операции, чья категория пропала из списка (категорию удалили или её подставила
// старая ошибка), разносятся по подходящим категориям. pick(tx, list) выбирает новую.
export const reassignOrphans = (transactions, listFor, pick, onlyCategory) => {
  let changed = 0;
  const next = transactions.map(tx => {
    if (tx.catLocked) return tx;
    const list = listFor(tx.type) || [];
    if (onlyCategory ? tx.category !== onlyCategory : list.includes(tx.category)) return tx;
    const cat = pick(tx, list);
    if (!cat || cat === tx.category) return tx;
    changed++;
    return { ...tx, category: cat };
  });
  return { next, changed };
};
