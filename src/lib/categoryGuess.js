// Подбор категории по названию получателя из SMS.
// Возвращает категорию ТОЛЬКО из списка пользователя — новых категорий не придумывает.
// Если ничего не подошло — «Другое»/«Прочее» из его списка, а не последняя по порядку
// (раньше туда попадала последняя добавленная категория, например «Бухгалтерия …»).

// Группы: слова в названии получателя → возможные названия категории (на всех языках приложения)
const RULES = [
  { re: /\batto\b|metro|\btaxi\b|yandex\s*go|mytaxi|\buber\b|avtobus|автобус|такси|метро|проезд|\bazs\b|заправк|benzin|propan|metan|parkovk|парковк/i,
    cats: ['Транспорт', 'Проезд', 'Такси', 'Transport', 'Ulaşım'] },
  { re: /korzinka|makro|havas|supermarket|супермаркет|\bmarket\b|магазин|oziq|продукт|baraka|carrefour|\bbi1\b|\bmega\b/i,
    cats: ['Продукты', 'Oziq-ovqat', 'Groceries', 'Market', 'Еда'] },
  { re: /\bfood\b|\bcafe\b|\bkafe\b|кафе|restor|ресторан|burger|pizza|пицц|\bevos\b|\bkfc\b|\boqtepa\b|lavash|лаваш|coffee|кофе|choyxona|chayxona|чайхан|\bosh\b|столов|oshxona|bistro|donar|doner|shashlik/i,
    cats: ['Кафе', 'Еда', 'Обед', 'Рестораны', 'Продукты', 'Oziq-ovqat', 'Groceries', 'Market'] },
  { re: /pharm|apteka|аптек|dorixona|clinic|klinik|клиник|med\b|медиц|stomat|стомат/i,
    cats: ['Здоровье', 'Аптека', 'Медицина', "Sog'liq", 'Health', 'Sağlık'] },
  { re: /beeline|ucell|mobiuz|uzmobile|uztelecom|\bums\b|perfectum|internet|интернет|сотов|связь/i,
    cats: ['Связь', 'Интернет', 'Internet', 'İnternet'] },
  { re: /elektr|электр|hududgaz|gaz\b|газ\b|suvsoz|suvta|водоканал|kommunal|коммунал|toza\s*hudud|issiqlik/i,
    cats: ['Коммунальные', 'Kommunal', 'Utilities', 'Faturalar'] },
  { re: /soliq|налог|\bgnk\b|\bdxx\b|shtraf|штраф|jarima/i,
    cats: ['Налоги', 'Soliqlar', 'Taxes', 'Vergiler'] },
  { re: /\bp2p\b|perevod|перевод|o'?tkazma|transfer/i,
    cats: ['Переводы', 'Перевод', "O'tkazma", 'Transfer'] }
];

const OTHER_NAMES = ['Другое', 'Прочее', 'Прочие', 'Boshqa', 'Other', 'Others', 'Diğer'];

const findIn = (list, names) => {
  const lower = list.map(x => String(x).toLowerCase());
  for (const n of names) {
    const i = lower.indexOf(n.toLowerCase());
    if (i >= 0) return list[i];
  }
  return null;
};

// Категория «Другое» из списка пользователя, или null, если такой нет
export const otherCategoryOf = (list) => findIn(list || [], OTHER_NAMES);

// text — описание/получатель; list — категории пользователя для этого типа операции
export const guessCategory = (text, list) => {
  const src = String(text || '');
  const cats = list || [];
  if (src) {
    for (const rule of RULES) {
      if (rule.re.test(src)) {
        const hit = findIn(cats, rule.cats);
        if (hit) return hit;
      }
    }
  }
  return otherCategoryOf(cats);
};
