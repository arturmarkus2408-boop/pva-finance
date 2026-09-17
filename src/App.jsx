import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, LabelList } from 'recharts';
import * as XLSX from 'xlsx';
import './App.css';

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('ru');
  const [currency, setCurrency] = useState('UZS');
  const [currencies, setCurrencies] = useState(['UZS','USD','EUR','TRY']);
  const [newCurrency, setNewCurrency] = useState('');
  const [showCurrencyInput, setShowCurrencyInput] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('expense');
  const [editingId, setEditingId] = useState(null);
  const [chartType, setChartType] = useState('pie');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardPeriod, setDashboardPeriod] = useState('month');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    amount: '', category: '', customCategory: '', description: '', tag: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [geminiKey, setGeminiKey] = useState('');
  const [tempKey, setTempKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [tempGroqKey, setTempGroqKey] = useState('');
  const [orKey, setOrKey] = useState('');
  const [tempOrKey, setTempOrKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanNotice, setScanNotice] = useState('');
  const [listening, setListening] = useState(false);
  const [shareNotice, setShareNotice] = useState('');
  const [expandedMonths, setExpandedMonths] = useState(new Set());
  const [expandedYears, setExpandedYears] = useState(new Set());
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState('');
  const [aiAnalysisPeriod, setAiAnalysisPeriod] = useState('');
  const [aiExpanded, setAiExpanded] = useState(false);
  const [importItems, setImportItems] = useState(null);
  const [customCats, setCustomCats] = useState({ income: null, expense: null });
  const [newCatName, setNewCatName] = useState({ income: '', expense: '' });
  const [ownerName, setOwnerName] = useState('');
  const [myCards, setMyCards] = useState([]);
  const [newCardDigits, setNewCardDigits] = useState('');
  const [newCardLabel, setNewCardLabel] = useState('');
  const [plans, setPlans] = useState([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planTab, setPlanTab] = useState('active');
  const [confirmClosePlanId, setConfirmClosePlanId] = useState(null);
  const [planData, setPlanData] = useState({ kind: 'iowe', what: '', person: '', amount: '', currency: 'UZS', dueDate: '', note: '' });
  // Курсы к базовой валюте: { USD: 12800 } — 1 USD стоит 12800 базовых единиц
  const [rates, setRates] = useState({});
  const [baseCurrency, setBaseCurrency] = useState('UZS');
  // Лимиты расходов: ключ "UZS|Продукты" -> число
  const [budgets, setBudgets] = useState({});
  const [budgetDraft, setBudgetDraft] = useState({ category: '', amount: '' });
  // Регулярные платежи
  const [recurring, setRecurring] = useState([]);
  const [recurForm, setRecurForm] = useState(null);
  // Метки операций
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [filterTag, setFilterTag] = useState('');
  // Поиск по отчёту
  const [searchText, setSearchText] = useState('');
  // Резервные копии
  const [lastBackup, setLastBackup] = useState('');
  const backupInputRef = useRef(null);
  // Ручной приём SMS
  const [smsText, setSmsText] = useState('');
  const [showSmsBox, setShowSmsBox] = useState(false);
  // Почтовый ящик: пароль и список сообщений, которые уже забраны, но ещё не подтверждены
  const [inboxKey, setInboxKey] = useState('');
  const [tempInboxKey, setTempInboxKey] = useState('');
  const [inboxBusy, setInboxBusy] = useState(false);
  const [pendingAckIds, setPendingAckIds] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatUseFinData, setChatUseFinData] = useState(false);
  const chatEndRef = useRef(null);
  const isFirstRender = useRef(true);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const tr = {
    ru: {
      appName: 'Wallet', addIncome: '+ Доход', addExpense: '+ Расход',
      balance: 'БАЛАНС', income: 'ДОХОД', expense: 'РАСХОД',
      category: 'Категория', amount: 'Сумма', description: 'Описание',
      date: 'Дата', save: 'Сохранить', update: 'Обновить', cancel: 'Отмена',
      recent: 'Последние операции', delete: 'Удалить', edit: 'Редактировать',
      selectCat: 'Выберите категорию', customCatPlaceholder: 'Своя категория',
      light: 'Светлая', dark: 'Тёмная', soft: 'Деловая', steel: 'Графит',
      dashboard: 'Главная', report: 'Отчёт',
      reportTitle: 'Отчёт за период', dateFrom: 'Дата ОТ', dateTo: 'Дата ДО',
      allTypes: 'Все операции', onlyIncome: 'Только доходы', onlyExpense: 'Только расходы',
      allCategories: 'Все категории', totalIncome: 'Итого доходов', totalExpense: 'Итого расходов',
      totalBalance: 'Сальдо', operations: 'Операций', noData: 'Нет данных за период',
      exportExcel: 'Экспорт Excel', exportPDF: 'Экспорт PDF',
      addCurrency: '+ Добавить валюту', currencyPlaceholder: 'Напр: GBP, KZT...',
      categoriesExp: ['Продукты','Коммунальные','Аренда','Интернет','Транспорт','Налоги','Развлечения','Покупки','Другое'],
      categoriesInc: ['Зарплата','Фриланс','Инвестиции','Перевод','Продажа','Подарок','Другое'],
      noOperations: 'Нет операций', chartExpenseTitle: 'Расходы по категориям', chartDynamicsTitle: 'Динамика доходов и расходов',
      pieChart: 'Круг', barChart: 'Столбцы', lineChart: 'Линия', editMode: 'Редактирование',
      typeLabel: 'Тип', operationType: 'Тип операции', reportResult: 'Результат',
      periodToday: 'Сегодня', periodWeek: 'Неделя', periodMonth: 'Месяц', periodYear: 'Год', periodAll: 'Всё',
      dataFor: 'Данные за', otherCategory: 'Прочее',
      noLineData: 'За «Сегодня» линия не строится — используйте «Неделя», «Месяц» или «Год»',
      printHint: 'В открывшемся окне нажмите «Сохранить как PDF» в диалоге печати',
      receiptPhoto: '📷 Фото чека', settings: 'Настройки', saveKey: 'Сохранить ключ',
      apiKeyLabel: 'API-ключ Gemini', apiKeyPlaceholder: 'AIzaSy...',
      apiKeyHint: 'Ключ нужен для распознавания чеков. Хранится только на вашем устройстве.',
      getKey: 'Как получить ключ', keySaved: 'Ключ сохранён',
      groqKeyLabel: 'API-ключ Groq (резервный, необязательно)', groqKeyPlaceholder: 'gsk_...',
      groqKeyHint: 'Подключается автоматически, если Gemini недоступен (голос, AI-анализ, чат). Для фото чеков не используется.',
      getGroqKey: 'Как получить ключ Groq',
      orKeyLabel: 'API-ключ OpenRouter (резервный 2, необязательно)', orKeyPlaceholder: 'sk-or-...',
      orKeyHint: 'Третий уровень защиты — подключается, если недоступны и Gemini, и Groq.',
      getOrKey: 'Как получить ключ OpenRouter',
      scanning: 'Распознаю чек...', scanFailed: 'Не удалось распознать. Проверьте фото или введите вручную.',
      scanFailedAuth: 'Ключ API отклонён Google. Обновите ключ в ⚙️ Настройках.',
      scanFailedNetwork: 'Нет соединения с сервером. Проверьте интернет.',
      noKeyError: 'Сначала добавьте API-ключ в ⚙️ Настройки', close: 'Закрыть',
      recognized: 'Проверьте данные и сохраните', fromGallery: 'Из галереи',
      voiceInput: '🎤', voiceInputTitle: 'Голосовой ввод', voiceListening: 'Слушаю...',
      voiceProcessing: 'Разбираю фразу...', voiceNotSupported: 'Ваш браузер не поддерживает голосовой ввод. Используйте Chrome или Safari.',
      micDenied: 'Разрешите доступ к микрофону в настройках браузера',
      noSpeech: 'Не услышал речи, попробуйте снова', voiceParseError: 'Не удалось разобрать фразу. Скажите чётче или введите вручную.',
      shareReport: 'Поделиться отчётом', shareTitle: 'Wallet — Отчёт',
      shareText: 'Отчёт по расходам и доходам',
      shareNotSupported: '✓ Файл сохранён в папку «Загрузки». Чтобы отправить в мессенджер: откройте приложение «Мои файлы» → «Загрузки» → долгое нажатие на wallet-report → «Поделиться» → выберите приложение.',
      shareError: 'Не удалось отправить файл',
      aiAnalysisTitle: '🧠 AI-анализ', aiAnalysisRun: 'Анализировать', aiAnalysisRefresh: 'Обновить',
      aiAnalysisLoading: 'AI изучает твои финансы...',
      aiAnalysisIntro: 'Нажми кнопку чтобы получить AI-анализ твоих трат за выбранный период.',
      aiAnalysisFailed: 'Не удалось получить анализ. Проверь API-ключ и подключение к интернету.',
      aiAnalysisNoData: 'За выбранный период недостаточно данных для анализа. Добавь несколько операций.',
      aiSectionMain: '🔍 Что заметил', aiSectionTrends: '📊 Тренды', aiSectionAdvice: '💡 Совет',
      assistant: 'Ассистент', chatTitle: '🤖 Финансовый ассистент',
      chatPlaceholder: 'Спроси о налогах, учёте, финансах...',
      chatSend: 'Отправить', chatClear: 'Очистить чат', chatConfirmClear: 'Очистить всю переписку?',
      chatEmpty: 'Задай вопрос по налогам, бухгалтерии, финансам или своим тратам.',
      chatLoading: 'Ассистент думает...',
      chatUseFinDataLabel: 'Учитывать мои финансы в ответе',
      chatDisclaimer: 'Это AI-ответы. Для юридически важных решений консультируйся с юристом или бухгалтером.',
      chatSuggestions: 'Например:',
      chatExample1: 'Как рассчитать НДФЛ с зарплаты?',
      chatExample2: 'Что такое единый налоговый платёж для ИП?',
      chatExample3: 'Как оформить самозанятость в Узбекистане?',
      chatExample4: 'Куда я больше всего трачу деньги?',
      carryLabel: 'Перешло с прошлого периода',
      carryShort: 'ПЕРЕНОС', withCarryShort: 'ИТОГО С ПЕРЕНОСОМ',
      withCarryLabel: 'Итого с переносом',
      carryHint: 'Остаток на начало периода',
      aiReadyBadge: 'анализ готов',
      importTitle: '📥 Найденные операции',
      importFound: 'Распознано операций',
      importNew: 'новая',
      importDup: 'уже внесена',
      importTransfer: 'похоже на перевод между картами — проверьте',
      importNeedsCheck: 'не уверен — проверьте сумму и направление',
      aiExportPdf: 'Сохранить в PDF', aiShare: 'Поделиться', aiCopy: 'Скопировать',
      aiCopied: 'Скопировано', aiShareFail: 'Отправка не поддерживается — файл сохранён',
      aiDocTitleAnalysis: 'Анализ расходов', aiDocTitleChat: 'Диалог с ассистентом',
      importDebt: 'похоже на долг',
      importAdd: 'Внести выбранные',
      importSelectAllNew: 'Отметить все новые',
      importClearAll: 'Снять все',
      importNothing: 'На изображении не найдено ни одной операции',
      importCard: 'карта',
      importBalanceAfter: 'остаток после',
      importAdded: 'Внесено операций',
      importOtherCurrency: 'Часть операций в другой валюте — переключите валюту вверху, чтобы их увидеть',
      importNoneSelected: 'Не выбрано ни одной операции',
      statementScanning: 'Читаю выписку...',
      importDupHint: 'Серым отмечены операции, которые уже есть в базе — повторно они не вносятся.',
      importFee: 'комиссия', importTotal: 'итого', importRef: 'номер', importExchange: 'обмен на',
      importSelfTransfer: 'перевод между своими картами',
      catNew: '➕ Новая категория…', catManage: 'Мои категории',
      catManageHint: 'Добавляйте свои категории — они сохраняются. Ненужные стандартные можно удалить.',
      catIncomeTitle: 'Категории доходов', catExpenseTitle: 'Категории расходов',
      catAdd: 'Добавить', catAddPlaceholder: 'Напр.: Бухгалтерия',
      catReset: 'Вернуть стандартные', catRenameTitle: 'Новое название категории',
      catDeleteConfirm: 'Убрать категорию из списка? Уже внесённые операции останутся без изменений.',
      catNewPlaceholder: 'Название новой категории',
      plans: 'Планы', plansTitle: '📌 Планы и долги', planAdd: '+ Добавить запись',
      planKind: 'Тип записи', planPurchase: '🛒 Запланировать покупку', planIOwe: '↗️ Я должен', planOwedMe: '↘️ Мне должны',
      planWhat: 'Что именно', planWhatPlaceholder: 'Напр.: закупить канцтовары',
      planPerson: 'Кому / от кого', planPersonPlaceholder: 'Напр.: Андрей',
      planDue: 'Срок', planNote: 'Заметка', planNotePlaceholder: 'Необязательно',
      planAmountOptional: 'Сумма (необязательно)',
      planDone: 'Закрыть', planReopen: 'Вернуть в активные', planEdit: 'Изменить',
      planEmpty: 'Пока нет ни планов, ни долгов',
      planEmptyHint: 'Добавьте запись — она будет висеть здесь, пока вы сами её не закроете.',
      planActive: 'Активные', planClosed: 'Закрытые',
      planOverdue: 'Просрочено', planDueToday: 'Сегодня', planDueTomorrow: 'Завтра',
      planInDays: 'через', planDaysShort: 'дн.', planNoDue: 'Без срока',
      planRemindTitle: '⏰ Требует внимания', planRemindOpen: 'Открыть',
      planAskCreateTx: 'Внести эту сумму как операцию?',
      planCreateTx: 'Да, внести', planJustMark: 'Просто закрыть',
      planTxCategory: 'Долги', planTotalIOwe: 'Я должен', planTotalOwedMe: 'Мне должны',
      planDeleteConfirm: 'Удалить запись?', planClosedOn: 'закрыто',
      ownerNameLabel: 'Ваше имя на картах', ownerNamePlaceholder: 'TURDALIYEV A.',
      ownerNameHint: 'Как оно печатается в квитанциях. Помогает отличить перевод самому себе от настоящего расхода.',
      myCardsLabel: 'Мои карты', myCardsHint: 'Последние 4 цифры каждой карты. Нужны, чтобы переводы между своими картами не считались расходом.',
      myCardsDigits: '4 цифры', myCardsName: 'Название (необязательно)', myCardsAdd: 'Добавить карту',
      backupTitle: 'Резервная копия',
      backupHint: 'Все данные лежат только в этом браузере. Очистка данных сайта, переустановка приложения или чистка памяти системой сотрут их безвозвратно. Делайте копию хотя бы раз в месяц.',
      backupExport: 'Сохранить копию',
      backupImport: 'Восстановить из копии',
      backupConfirm: 'Заменить ВСЕ текущие данные данными из файла? Текущие записи будут потеряны.',
      backupDone: 'Копия сохранена',
      backupRestored: 'Данные восстановлены',
      backupBadFile: 'Файл не похож на резервную копию Wallet',
      backupLast: 'Последняя копия',
      backupNever: 'копию ещё не делали',
      backupWarn: 'Давно не делали резервную копию данных',
      ratesTitle: 'Курсы валют',
      ratesHint: 'Сколько единиц базовой валюты стоит 1 единица другой. Нужно только для сводного баланса — сами операции всегда хранятся в своей валюте.',
      ratesBase: 'Базовая валюта',
      ratesFor: 'за 1',
      totalTitle: 'Сводный баланс',
      totalHint: 'Все валюты пересчитаны в',
      totalNoRate: 'курс не задан',
      reconTitle: '🔍 Сверка с банком',
      reconHint: 'Сравниваем остаток, который банк прислал в последней квитанции по карте, с тем, что получается по вашим записям.',
      reconCard: 'Карта',
      reconBank: 'Банк сообщил',
      reconOurs: 'По вашим записям',
      reconDiff: 'Расхождение',
      reconOk: 'Сходится',
      reconGap: 'Похоже, какая-то операция не внесена',
      reconEmpty: 'Пока нет квитанций с остатком на карте. Занесите SMS или квитанцию, где виден баланс, — и сверка появится.',
      reconAsOf: 'на',
      smsTitle: 'Приём SMS от банка',
      smsHint: 'Вставьте текст банковского SMS — приложение разберёт его прямо на устройстве, без интернета и API-ключа.',
      smsPlaceholder: 'Spisanie s karty: HAMKORBANK ATB, UZ,15.09.26 23:22,karta ***4283. summa:501250.00 UZS balans:1633421.97 UZS',
      smsParse: 'Разобрать текст',
      smsFail: 'Не удалось разобрать. Проверьте, что это текст банковского SMS.',
      smsFound: 'Разобрано операций',
      searchLabel: 'Поиск',
      searchPlaceholder: 'Описание, категория, контрагент...',
      budgetTitle: '🎯 Лимиты по категориям',
      budgetHint: 'Месячный лимит расходов. Приложение просто показывает, сколько осталось, и не мешает тратить.',
      budgetCategory: 'Категория',
      budgetAmount: 'Лимит на месяц',
      budgetAdd: 'Задать лимит',
      budgetNone: 'Лимиты не заданы',
      budgetLeft: 'осталось',
      budgetOver: 'перерасход',
      budgetSpent: 'потрачено',
      budgetOnly: 'Лимиты считаются за текущий месяц в валюте',
      recurTitle: '🔁 Регулярные платежи',
      recurHint: 'Аренда, подписки, интернет. В нужный день месяца приложение напомнит и внесёт платёж одной кнопкой.',
      recurAdd: '+ Добавить регулярный',
      recurDay: 'День месяца',
      recurDue: 'Пора внести',
      recurPost: 'Внести',
      recurSkip: 'Пропустить месяц',
      recurNone: 'Регулярных платежей нет',
      recurLast: 'внесён',
      recurNever: 'ещё не вносился',
      recurEvery: 'каждое',
      recurDayShort: 'число',
      tagLabel: 'Метка',
      tagNone: 'Без метки',
      tagAll: 'Все метки',
      tagsManage: 'Метки операций',
      tagsHint: 'Разделяйте личные траты и рабочие — отчёт можно будет собрать по одной метке.',
      tagPlaceholder: 'Название метки',
      inboxTitle: 'Автоматический приём SMS',
      inboxHint: 'Телефон сам пересылает банковские SMS на ваш сервер, а приложение забирает их при открытии. Настраивается один раз, дальше вводить ничего не нужно.',
      inboxKeyLabel: 'Пароль почтового ящика',
      inboxKeyPlaceholder: 'тот же, что в переменной WALLET_INBOX_KEY',
      inboxCheck: 'Проверить сейчас',
      inboxChecking: 'Проверяю...',
      inboxEmpty: 'Новых сообщений нет',
      inboxFail: 'Не удалось связаться с почтовым ящиком',
      inboxBadKey: 'Сервер не принял пароль',
      inboxNoParse: 'Сообщения получены, но разобрать их не удалось',
      inboxGot: 'Получено сообщений',
      inboxPrivacy: 'Текст SMS будет проходить через ваш сервер и временно храниться там до месяца. Суммы и операции сервер не разбирает и не хранит.'
    },
    uz: {
      appName: 'Wallet', addIncome: '+ Daromad', addExpense: '+ Xarajat',
      balance: 'BALANS', income: 'DAROMAD', expense: 'XARAJAT',
      category: 'Kategoriya', amount: 'Summa', description: 'Tavsif',
      date: 'Sana', save: 'Saqlash', update: 'Yangilash', cancel: 'Bekor qilish',
      recent: 'Songgi amaliyotlar', delete: "O'chirish", edit: 'Tahrirlash',
      selectCat: 'Kategoriyani tanlang', customCatPlaceholder: "O'z kategoriya",
      light: 'Yorqin', dark: 'Qora', soft: 'Biznes', steel: 'Grafit',
      dashboard: 'Asosiy', report: 'Hisobot',
      reportTitle: 'Davr uchun hisobot', dateFrom: 'Dan', dateTo: 'Gacha',
      allTypes: 'Barcha', onlyIncome: 'Faqat daromad', onlyExpense: 'Faqat xarajat',
      allCategories: 'Barcha kategoriyalar', totalIncome: 'Jami daromad', totalExpense: 'Jami xarajat',
      totalBalance: 'Qoldiq', operations: 'Amaliyotlar', noData: "Ma'lumot yo'q",
      exportExcel: 'Excel yuklash', exportPDF: 'PDF yuklash',
      addCurrency: "+ Valyuta qo'shish", currencyPlaceholder: 'Mas: GBP, KZT...',
      categoriesExp: ['Oziq-ovqat','Kommunal','Ijara','Internet','Transport','Soliqlar','Dam olish','Xaridlar','Boshqa'],
      categoriesInc: ['Maosh','Frilans','Investitsiya',"O'tkazma",'Sotuv','Sovga','Boshqa'],
      noOperations: "Amaliyotlar yo'q", chartExpenseTitle: 'Xarajatlar kategoriyalar bo\'yicha', chartDynamicsTitle: 'Daromad va xarajatlar dinamikasi',
      pieChart: 'Doira', barChart: 'Ustun', lineChart: 'Chiziq', editMode: 'Tahrirlash',
      typeLabel: 'Tur', operationType: 'Amaliyot turi', reportResult: 'Natija',
      periodToday: 'Bugun', periodWeek: 'Hafta', periodMonth: 'Oy', periodYear: 'Yil', periodAll: 'Barchasi',
      dataFor: 'Davr', otherCategory: 'Boshqalar',
      noLineData: '«Bugun» uchun chiziq qurilmaydi — «Hafta», «Oy» yoki «Yil»ni tanlang',
      printHint: "Ochilgan oynada bosma dialogida «PDF sifatida saqlash»ni tanlang",
      receiptPhoto: '📷 Chek surati', settings: 'Sozlamalar', saveKey: 'Kalitni saqlash',
      apiKeyLabel: 'Gemini API kaliti', apiKeyPlaceholder: 'AIzaSy...',
      apiKeyHint: 'Chekni aniqlash uchun kalit kerak. Faqat qurilmangizda saqlanadi.',
      getKey: 'Kalitni qanday olish', keySaved: 'Kalit saqlandi',
      groqKeyLabel: 'Groq API kaliti (zaxira, ixtiyoriy)', groqKeyPlaceholder: 'gsk_...',
      groqKeyHint: 'Gemini mavjud bo\'lmasa avtomatik ishga tushadi (ovoz, AI-tahlil, chat). Chek suratlari uchun ishlatilmaydi.',
      getGroqKey: 'Groq kalitni qanday olish',
      orKeyLabel: 'OpenRouter API kaliti (2-zaxira, ixtiyoriy)', orKeyPlaceholder: 'sk-or-...',
      orKeyHint: 'Uchinchi himoya darajasi — Gemini va Groq ikkalasi ham mavjud bo\'lmasa ishga tushadi.',
      getOrKey: 'OpenRouter kalitni qanday olish',
      scanning: 'Chek aniqlanmoqda...', scanFailed: 'Aniqlab bo\'lmadi. Suratni tekshiring yoki qo\'lda kiriting.',
      scanFailedAuth: 'API kalit Google tomonidan rad etildi. ⚙️ Sozlamalarda kalitni yangilang.',
      scanFailedNetwork: 'Server bilan aloqa yo\'q. Internetni tekshiring.',
      noKeyError: 'Avval ⚙️ Sozlamalarga API kalitni qo\'shing', close: 'Yopish',
      recognized: "Ma'lumotlarni tekshirib saqlang", fromGallery: 'Galereyadan',
      voiceInput: '🎤', voiceInputTitle: 'Ovozli kiritish', voiceListening: 'Tinglayapman...',
      voiceProcessing: 'Iborani tahlil qilyapman...', voiceNotSupported: 'Brauzeringiz ovozli kiritishni qo\'llab-quvvatlamaydi. Chrome yoki Safari ishlating.',
      micDenied: 'Brauzer sozlamalarida mikrofonga ruxsat bering',
      noSpeech: 'Nutq eshitilmadi, qaytadan urinib ko\'ring', voiceParseError: 'Iborani tahlil qilib bo\'lmadi. Aniqroq gapiring yoki qo\'lda kiriting.',
      shareReport: 'Hisobotni ulashish', shareTitle: 'Wallet — Hisobot',
      shareText: 'Xarajat va daromadlar hisoboti',
      shareNotSupported: '✓ Fayl «Yuklashlar» papkasiga saqlandi. Messenjerga jo\'natish uchun: «Mening fayllarim» ilovasini oching → «Yuklashlar» → wallet-report faylini uzoq bosing → «Ulashish» → ilovani tanlang.',
      shareError: 'Faylni jo\'natib bo\'lmadi',
      aiAnalysisTitle: '🧠 AI-tahlil', aiAnalysisRun: 'Tahlil qilish', aiAnalysisRefresh: 'Yangilash',
      aiAnalysisLoading: 'AI moliyangizni o\'rganmoqda...',
      aiAnalysisIntro: 'Tanlangan davr uchun AI-tahlilni olish uchun tugmani bosing.',
      aiAnalysisFailed: 'Tahlilni olib bo\'lmadi. API kalitni va internetni tekshiring.',
      aiAnalysisNoData: 'Tanlangan davr uchun tahlil uchun ma\'lumot yetarli emas. Bir nechta operatsiya qo\'shing.',
      aiSectionMain: '🔍 Nima payqadim', aiSectionTrends: '📊 Tendensiyalar', aiSectionAdvice: '💡 Maslahat',
      assistant: 'Assistent', chatTitle: '🤖 Moliyaviy assistent',
      chatPlaceholder: 'Soliqlar, hisob, moliya haqida so\'rang...',
      chatSend: 'Yuborish', chatClear: 'Suhbatni tozalash', chatConfirmClear: 'Barcha yozishmalarni tozalaysizmi?',
      chatEmpty: 'Soliqlar, buxgalteriya, moliya yoki xarajatlaringiz haqida savol bering.',
      chatLoading: 'Assistent o\'ylayapti...',
      chatUseFinDataLabel: 'Javobda moliyaviy ma\'lumotlarimni hisobga olish',
      chatDisclaimer: 'Bu AI javoblari. Muhim yuridik qarorlar uchun yurist yoki buxgalter bilan maslahatlashing.',
      chatSuggestions: 'Masalan:',
      chatExample1: 'Ish haqidan NDFLni qanday hisoblash?',
      chatExample2: 'IPP uchun yagona soliq to\'lovi nima?',
      chatExample3: 'O\'zbekistonda samozanyat sifatida qanday ro\'yxatdan o\'tish?',
      chatExample4: 'Qayerga ko\'proq pul sarflamoqdaman?',
      carryLabel: 'O\'tgan davrlardan qoldiq',
      carryShort: 'QOLDIQ', withCarryShort: 'QOLDIQ BILAN JAMI',
      withCarryLabel: 'Qoldiq bilan jami',
      carryHint: 'Davr boshidagi qoldiq',
      aiReadyBadge: 'tahlil tayyor',
      importTitle: '📥 Topilgan amaliyotlar',
      importFound: 'Aniqlangan amaliyotlar',
      importNew: 'yangi',
      importDup: 'allaqachon kiritilgan',
      importTransfer: 'kartalar orasidagi o\'tkazmaga o\'xshaydi — tekshiring',
      importNeedsCheck: 'ishonchim komil emas — summa va yo\'nalishni tekshiring',
      aiExportPdf: 'PDF ga saqlash', aiShare: 'Ulashish', aiCopy: 'Nusxalash',
      aiCopied: 'Nusxalandi', aiShareFail: 'Ulashish qo\'llab-quvvatlanmaydi — fayl saqlandi',
      aiDocTitleAnalysis: 'Xarajatlar tahlili', aiDocTitleChat: 'Yordamchi bilan suhbat',
      importDebt: 'qarzga o\'xshaydi',
      importAdd: 'Tanlanganlarni kiritish',
      importSelectAllNew: 'Barcha yangilarni belgilash',
      importClearAll: 'Belgilashni olib tashlash',
      importNothing: 'Rasmda birorta ham amaliyot topilmadi',
      importCard: 'karta',
      importBalanceAfter: 'keyingi qoldiq',
      importAdded: 'Kiritilgan amaliyotlar',
      importOtherCurrency: 'Ba\'zi amaliyotlar boshqa valyutada — ularni ko\'rish uchun yuqoridan valyutani almashtiring',
      importNoneSelected: 'Birorta amaliyot tanlanmadi',
      statementScanning: 'Ko\'chirmani o\'qiyapman...',
      importDupHint: 'Kulrang rangda bazada allaqachon mavjud amaliyotlar — ular qayta kiritilmaydi.',
      importFee: 'komissiya', importTotal: 'jami', importRef: 'raqam', importExchange: 'almashtirildi',
      importSelfTransfer: 'o\'z kartalari orasidagi o\'tkazma',
      catNew: '➕ Yangi kategoriya…', catManage: 'Mening kategoriyalarim',
      catManageHint: 'O\'z kategoriyalaringizni qo\'shing — ular saqlanadi. Keraksiz standartlarini o\'chirish mumkin.',
      catIncomeTitle: 'Daromad kategoriyalari', catExpenseTitle: 'Xarajat kategoriyalari',
      catAdd: 'Qo\'shish', catAddPlaceholder: 'Mas: Buxgalteriya',
      catReset: 'Standartlarni qaytarish', catRenameTitle: 'Kategoriyaning yangi nomi',
      catDeleteConfirm: 'Kategoriya ro\'yxatdan olib tashlansinmi? Kiritilgan amaliyotlar o\'zgarishsiz qoladi.',
      catNewPlaceholder: 'Yangi kategoriya nomi',
      plans: 'Rejalar', plansTitle: '📌 Rejalar va qarzlar', planAdd: '+ Yozuv qo\'shish',
      planKind: 'Yozuv turi', planPurchase: '🛒 Xaridni rejalashtirish', planIOwe: '↗️ Men qarzdorman', planOwedMe: '↘️ Menga qarzdor',
      planWhat: 'Aynan nima', planWhatPlaceholder: 'Mas: kanselyariya olish',
      planPerson: 'Kimga / kimdan', planPersonPlaceholder: 'Mas: Andrey',
      planDue: 'Muddat', planNote: 'Izoh', planNotePlaceholder: 'Ixtiyoriy',
      planAmountOptional: 'Summa (ixtiyoriy)',
      planDone: 'Yopish', planReopen: 'Faollarga qaytarish', planEdit: 'Tahrirlash',
      planEmpty: 'Hozircha reja ham, qarz ham yo\'q',
      planEmptyHint: 'Yozuv qo\'shing — siz uni yopmaguningizcha shu yerda turadi.',
      planActive: 'Faol', planClosed: 'Yopilgan',
      planOverdue: 'Muddati o\'tgan', planDueToday: 'Bugun', planDueTomorrow: 'Ertaga',
      planInDays: 'keyin', planDaysShort: 'kun', planNoDue: 'Muddatsiz',
      planRemindTitle: '⏰ Diqqat talab qiladi', planRemindOpen: 'Ochish',
      planAskCreateTx: 'Bu summa amaliyot sifatida kiritilsinmi?',
      planCreateTx: 'Ha, kiritilsin', planJustMark: 'Shunchaki yopish',
      planTxCategory: 'Qarzlar', planTotalIOwe: 'Men qarzdorman', planTotalOwedMe: 'Menga qarzdor',
      planDeleteConfirm: 'Yozuv o\'chirilsinmi?', planClosedOn: 'yopilgan',
      ownerNameLabel: 'Kartalardagi ismingiz', ownerNamePlaceholder: 'TURDALIYEV A.',
      ownerNameHint: 'Kvitansiyalarda qanday chiqsa shunday. O\'zingizga o\'tkazmani haqiqiy xarajatdan ajratishga yordam beradi.',
      myCardsLabel: 'Mening kartalarim', myCardsHint: 'Har bir kartaning oxirgi 4 raqami. O\'z kartalari orasidagi o\'tkazma xarajat deb hisoblanmasligi uchun kerak.',
      myCardsDigits: '4 raqam', myCardsName: 'Nomi (ixtiyoriy)', myCardsAdd: 'Karta qo\'shish',
      backupTitle: 'Zaxira nusxa',
      backupHint: 'Barcha ma\'lumotlar faqat shu brauzerda saqlanadi. Sayt ma\'lumotlarini tozalash yoki ilovani qayta o\'rnatish ularni butunlay o\'chiradi. Oyiga kamida bir marta nusxa oling.',
      backupExport: 'Nusxani saqlash',
      backupImport: 'Nusxadan tiklash',
      backupConfirm: 'BARCHA joriy ma\'lumotlar fayldagilar bilan almashtirilsinmi? Joriy yozuvlar yo\'qoladi.',
      backupDone: 'Nusxa saqlandi',
      backupRestored: 'Ma\'lumotlar tiklandi',
      backupBadFile: 'Fayl Wallet zaxira nusxasiga o\'xshamaydi',
      backupLast: 'Oxirgi nusxa',
      backupNever: 'hali nusxa olinmagan',
      backupWarn: 'Ancha vaqtdan beri zaxira nusxa olinmagan',
      ratesTitle: 'Valyuta kurslari',
      ratesHint: 'Boshqa valyutaning 1 birligi necha asosiy valyuta birligiga teng. Faqat umumiy qoldiq uchun kerak.',
      ratesBase: 'Asosiy valyuta',
      ratesFor: '1 uchun',
      totalTitle: 'Umumiy qoldiq',
      totalHint: 'Barcha valyutalar qayta hisoblandi:',
      totalNoRate: 'kurs kiritilmagan',
      reconTitle: '🔍 Bank bilan solishtirish',
      reconHint: 'Bank oxirgi kvitansiyada yuborgan qoldiqni yozuvlaringizdan chiqadigan qoldiq bilan solishtiramiz.',
      reconCard: 'Karta',
      reconBank: 'Bank xabar qildi',
      reconOurs: 'Yozuvlaringiz bo\'yicha',
      reconDiff: 'Farq',
      reconOk: 'Mos keladi',
      reconGap: 'Qandaydir amaliyot kiritilmaganga o\'xshaydi',
      reconEmpty: 'Hozircha karta qoldig\'i ko\'rsatilgan kvitansiya yo\'q. Balans ko\'rinadigan SMS yoki kvitansiyani kiriting.',
      reconAsOf: 'sanasiga',
      smsTitle: 'Bank SMS qabul qilish',
      smsHint: 'Bank SMS matnini qo\'ying — ilova uni qurilmada, internetsiz va API kalitsiz tahlil qiladi.',
      smsPlaceholder: 'Spisanie s karty: HAMKORBANK ATB, UZ,15.09.26 23:22,karta ***4283. summa:501250.00 UZS balans:1633421.97 UZS',
      smsParse: 'Matnni tahlil qilish',
      smsFail: 'Tahlil qilib bo\'lmadi. Bu bank SMS matni ekanini tekshiring.',
      smsFound: 'Tahlil qilingan amaliyotlar',
      searchLabel: 'Qidiruv',
      searchPlaceholder: 'Tavsif, kategoriya, kontragent...',
      budgetTitle: '🎯 Kategoriya limitlari',
      budgetHint: 'Oylik xarajat limiti. Ilova qancha qolganini ko\'rsatadi, xalaqit bermaydi.',
      budgetCategory: 'Kategoriya',
      budgetAmount: 'Oylik limit',
      budgetAdd: 'Limit belgilash',
      budgetNone: 'Limitlar belgilanmagan',
      budgetLeft: 'qoldi',
      budgetOver: 'limitdan oshdi',
      budgetSpent: 'sarflandi',
      budgetOnly: 'Limitlar joriy oy uchun shu valyutada hisoblanadi:',
      recurTitle: '🔁 Doimiy to\'lovlar',
      recurHint: 'Ijara, obunalar, internet. Kerakli kunda ilova eslatadi va bitta tugma bilan kiritadi.',
      recurAdd: '+ Doimiy to\'lov qo\'shish',
      recurDay: 'Oy kuni',
      recurDue: 'Kiritish vaqti',
      recurPost: 'Kiritish',
      recurSkip: 'Bu oyni o\'tkazib yuborish',
      recurNone: 'Doimiy to\'lovlar yo\'q',
      recurLast: 'kiritilgan',
      recurNever: 'hali kiritilmagan',
      recurEvery: 'har oyning',
      recurDayShort: '-kuni',
      tagLabel: 'Belgi',
      tagNone: 'Belgisiz',
      tagAll: 'Barcha belgilar',
      tagsManage: 'Amaliyot belgilari',
      tagsHint: 'Shaxsiy va ish xarajatlarini ajrating — hisobotni bitta belgi bo\'yicha yig\'ish mumkin.',
      tagPlaceholder: 'Belgi nomi',
      inboxTitle: 'SMS avtomatik qabul qilish',
      inboxHint: 'Telefon bank SMS\'larini serveringizga o\'zi yuboradi, ilova esa ochilganda ularni oladi. Bir marta sozlanadi, keyin hech narsa kiritish kerak emas.',
      inboxKeyLabel: 'Pochta qutisi paroli',
      inboxKeyPlaceholder: 'WALLET_INBOX_KEY dagi bilan bir xil',
      inboxCheck: 'Hozir tekshirish',
      inboxChecking: 'Tekshiryapman...',
      inboxEmpty: 'Yangi xabarlar yo\'q',
      inboxFail: 'Pochta qutisi bilan bog\'lanib bo\'lmadi',
      inboxBadKey: 'Server parolni qabul qilmadi',
      inboxNoParse: 'Xabarlar olindi, lekin tahlil qilib bo\'lmadi',
      inboxGot: 'Olingan xabarlar',
      inboxPrivacy: 'SMS matni serveringiz orqali o\'tadi va u yerda bir oygacha vaqtincha saqlanadi. Server summalarni tahlil qilmaydi va saqlamaydi.'
    },
    en: {
      appName: 'Wallet', addIncome: '+ Income', addExpense: '+ Expense',
      balance: 'BALANCE', income: 'INCOME', expense: 'EXPENSE',
      category: 'Category', amount: 'Amount', description: 'Description',
      date: 'Date', save: 'Save', update: 'Update', cancel: 'Cancel',
      recent: 'Recent transactions', delete: 'Delete', edit: 'Edit',
      selectCat: 'Select category', customCatPlaceholder: 'Custom category',
      light: 'Light', dark: 'Dark', soft: 'Business', steel: 'Graphite',
      dashboard: 'Dashboard', report: 'Report',
      reportTitle: 'Period report', dateFrom: 'Date FROM', dateTo: 'Date TO',
      allTypes: 'All types', onlyIncome: 'Income only', onlyExpense: 'Expense only',
      allCategories: 'All categories', totalIncome: 'Total income', totalExpense: 'Total expense',
      totalBalance: 'Balance', operations: 'Operations', noData: 'No data for period',
      exportExcel: 'Export Excel', exportPDF: 'Export PDF',
      addCurrency: '+ Add currency', currencyPlaceholder: 'E.g: GBP, KZT...',
      categoriesExp: ['Groceries','Utilities','Rent','Internet','Transport','Taxes','Entertainment','Shopping','Other'],
      categoriesInc: ['Salary','Freelance','Investment','Transfer','Sale','Gift','Other'],
      noOperations: 'No operations', chartExpenseTitle: 'Expenses by category', chartDynamicsTitle: 'Income and expense dynamics',
      pieChart: 'Pie', barChart: 'Bar', lineChart: 'Line', editMode: 'Editing',
      typeLabel: 'Type', operationType: 'Operation type', reportResult: 'Result',
      periodToday: 'Today', periodWeek: 'Week', periodMonth: 'Month', periodYear: 'Year', periodAll: 'All',
      dataFor: 'Data for', otherCategory: 'Other',
      noLineData: 'Line chart is not shown for «Today» — use «Week», «Month» or «Year»',
      printHint: 'In the opened window, choose «Save as PDF» in the print dialog',
      receiptPhoto: '📷 Receipt photo', settings: 'Settings', saveKey: 'Save key',
      apiKeyLabel: 'Gemini API key', apiKeyPlaceholder: 'AIzaSy...',
      apiKeyHint: 'Key is used to recognize receipts. Stored only on your device.',
      getKey: 'How to get a key', keySaved: 'Key saved',
      groqKeyLabel: 'Groq API key (backup, optional)', groqKeyPlaceholder: 'gsk_...',
      groqKeyHint: 'Kicks in automatically if Gemini is unavailable (voice, AI analysis, chat). Not used for receipt photos.',
      getGroqKey: 'How to get a Groq key',
      orKeyLabel: 'OpenRouter API key (2nd backup, optional)', orKeyPlaceholder: 'sk-or-...',
      orKeyHint: 'Third layer of protection — kicks in if both Gemini and Groq are unavailable.',
      getOrKey: 'How to get an OpenRouter key',
      scanning: 'Recognizing receipt...', scanFailed: 'Could not recognize. Check the photo or enter manually.',
      scanFailedAuth: 'API key rejected by Google. Update the key in ⚙️ Settings.',
      scanFailedNetwork: 'No connection to server. Check your internet.',
      noKeyError: 'First add an API key in ⚙️ Settings', close: 'Close',
      recognized: 'Verify data and save', fromGallery: 'From gallery',
      voiceInput: '🎤', voiceInputTitle: 'Voice input', voiceListening: 'Listening...',
      voiceProcessing: 'Parsing phrase...', voiceNotSupported: 'Your browser does not support voice input. Use Chrome or Safari.',
      micDenied: 'Allow microphone access in browser settings',
      noSpeech: 'Did not hear speech, try again', voiceParseError: 'Could not parse the phrase. Speak more clearly or enter manually.',
      shareReport: 'Share report', shareTitle: 'Wallet — Report',
      shareText: 'Expense and income report',
      shareNotSupported: '✓ File saved to Downloads folder. To send via messenger: open "My Files" app → "Downloads" → long press wallet-report → "Share" → choose your app.',
      shareError: 'Could not send file',
      aiAnalysisTitle: '🧠 AI analysis', aiAnalysisRun: 'Analyze', aiAnalysisRefresh: 'Refresh',
      aiAnalysisLoading: 'AI is studying your finances...',
      aiAnalysisIntro: 'Tap the button to get an AI analysis of your expenses for the selected period.',
      aiAnalysisFailed: 'Could not get the analysis. Check the API key and internet connection.',
      aiAnalysisNoData: 'Not enough data for analysis in the selected period. Add a few transactions.',
      aiSectionMain: '🔍 What I noticed', aiSectionTrends: '📊 Trends', aiSectionAdvice: '💡 Advice',
      assistant: 'Assistant', chatTitle: '🤖 Financial assistant',
      chatPlaceholder: 'Ask about taxes, accounting, finances...',
      chatSend: 'Send', chatClear: 'Clear chat', chatConfirmClear: 'Clear all messages?',
      chatEmpty: 'Ask about taxes, accounting, finances, or your expenses.',
      chatLoading: 'Assistant is thinking...',
      chatUseFinDataLabel: 'Use my financial data in the answer',
      chatDisclaimer: 'These are AI answers. For legally important decisions, consult a lawyer or accountant.',
      chatSuggestions: 'For example:',
      chatExample1: 'How to calculate income tax from salary?',
      chatExample2: 'What is a unified tax payment for entrepreneurs?',
      chatExample3: 'How to register as self-employed in Uzbekistan?',
      chatExample4: 'Where do I spend the most money?',
      carryLabel: 'Carried over from previous periods',
      carryShort: 'CARRIED OVER', withCarryShort: 'TOTAL WITH CARRY',
      withCarryLabel: 'Total with carry-over',
      carryHint: 'Balance at the start of the period',
      aiReadyBadge: 'analysis ready',
      importTitle: '📥 Detected transactions',
      importFound: 'Transactions detected',
      importNew: 'new',
      importDup: 'already recorded',
      importTransfer: 'looks like a card-to-card transfer — please check',
      importNeedsCheck: 'not certain — check the amount and direction',
      aiExportPdf: 'Save as PDF', aiShare: 'Share', aiCopy: 'Copy',
      aiCopied: 'Copied', aiShareFail: 'Sharing is not supported — the file was saved',
      aiDocTitleAnalysis: 'Spending analysis', aiDocTitleChat: 'Conversation with the assistant',
      importDebt: 'looks like a debt',
      importAdd: 'Add selected',
      importSelectAllNew: 'Select all new',
      importClearAll: 'Clear selection',
      importNothing: 'No transactions found in the image',
      importCard: 'card',
      importBalanceAfter: 'balance after',
      importAdded: 'Transactions added',
      importOtherCurrency: 'Some transactions are in another currency — switch the currency above to see them',
      importNoneSelected: 'No transactions selected',
      statementScanning: 'Reading the statement...',
      importDupHint: 'Greyed-out rows are already in your data — they will not be added again.',
      importFee: 'fee', importTotal: 'total', importRef: 'ref', importExchange: 'exchanged for',
      importSelfTransfer: 'transfer between your own cards',
      catNew: '➕ New category…', catManage: 'My categories',
      catManageHint: 'Add your own categories — they are saved. Unused default ones can be removed.',
      catIncomeTitle: 'Income categories', catExpenseTitle: 'Expense categories',
      catAdd: 'Add', catAddPlaceholder: 'E.g.: Accounting',
      catReset: 'Restore defaults', catRenameTitle: 'New category name',
      catDeleteConfirm: 'Remove this category from the list? Recorded transactions stay unchanged.',
      catNewPlaceholder: 'New category name',
      plans: 'Plans', plansTitle: '📌 Plans and debts', planAdd: '+ Add entry',
      planKind: 'Entry type', planPurchase: '🛒 Plan a purchase', planIOwe: '↗️ I owe', planOwedMe: '↘️ Owed to me',
      planWhat: 'What exactly', planWhatPlaceholder: 'E.g.: buy office supplies',
      planPerson: 'To / from whom', planPersonPlaceholder: 'E.g.: Andrey',
      planDue: 'Due date', planNote: 'Note', planNotePlaceholder: 'Optional',
      planAmountOptional: 'Amount (optional)',
      planDone: 'Close', planReopen: 'Reopen', planEdit: 'Edit',
      planEmpty: 'No plans or debts yet',
      planEmptyHint: 'Add an entry — it stays here until you close it yourself.',
      planActive: 'Active', planClosed: 'Closed',
      planOverdue: 'Overdue', planDueToday: 'Today', planDueTomorrow: 'Tomorrow',
      planInDays: 'in', planDaysShort: 'd', planNoDue: 'No due date',
      planRemindTitle: '⏰ Needs attention', planRemindOpen: 'Open',
      planAskCreateTx: 'Record this amount as a transaction?',
      planCreateTx: 'Yes, record it', planJustMark: 'Just close',
      planTxCategory: 'Debts', planTotalIOwe: 'I owe', planTotalOwedMe: 'Owed to me',
      planDeleteConfirm: 'Delete this entry?', planClosedOn: 'closed',
      ownerNameLabel: 'Your name on the cards', ownerNamePlaceholder: 'TURDALIYEV A.',
      ownerNameHint: 'As printed on receipts. Helps tell a transfer to yourself from a real expense.',
      myCardsLabel: 'My cards', myCardsHint: 'Last 4 digits of each card. Keeps transfers between your own cards from counting as expenses.',
      myCardsDigits: '4 digits', myCardsName: 'Label (optional)', myCardsAdd: 'Add card',
      backupTitle: 'Backup',
      backupHint: 'All data lives only in this browser. Clearing site data, reinstalling the app or the system reclaiming storage will wipe it for good. Make a copy at least once a month.',
      backupExport: 'Save a backup',
      backupImport: 'Restore from backup',
      backupConfirm: 'Replace ALL current data with the contents of this file? Current records will be lost.',
      backupDone: 'Backup saved',
      backupRestored: 'Data restored',
      backupBadFile: 'This file does not look like a Wallet backup',
      backupLast: 'Last backup',
      backupNever: 'no backup yet',
      backupWarn: 'It has been a while since your last backup',
      ratesTitle: 'Exchange rates',
      ratesHint: 'How many units of the base currency one unit of another is worth. Used only for the combined balance.',
      ratesBase: 'Base currency',
      ratesFor: 'per 1',
      totalTitle: 'Combined balance',
      totalHint: 'All currencies converted to',
      totalNoRate: 'no rate set',
      reconTitle: '🔍 Reconciliation with the bank',
      reconHint: 'We compare the balance the bank reported in the latest receipt for a card with the balance implied by your records.',
      reconCard: 'Card',
      reconBank: 'Bank reported',
      reconOurs: 'Your records give',
      reconDiff: 'Difference',
      reconOk: 'Matches',
      reconGap: 'Looks like a transaction is missing',
      reconEmpty: 'No receipts with a card balance yet. Add an SMS or receipt showing the balance and reconciliation will appear.',
      reconAsOf: 'as of',
      smsTitle: 'Bank SMS intake',
      smsHint: 'Paste the text of a bank SMS — the app parses it on your device, with no internet and no API key.',
      smsPlaceholder: 'Spisanie s karty: HAMKORBANK ATB, UZ,15.09.26 23:22,karta ***4283. summa:501250.00 UZS balans:1633421.97 UZS',
      smsParse: 'Parse text',
      smsFail: 'Could not parse it. Check that this is the text of a bank SMS.',
      smsFound: 'Transactions parsed',
      searchLabel: 'Search',
      searchPlaceholder: 'Description, category, counterparty...',
      budgetTitle: '🎯 Category limits',
      budgetHint: 'A monthly spending limit. The app simply shows what is left and never blocks you.',
      budgetCategory: 'Category',
      budgetAmount: 'Monthly limit',
      budgetAdd: 'Set a limit',
      budgetNone: 'No limits set',
      budgetLeft: 'left',
      budgetOver: 'over budget',
      budgetSpent: 'spent',
      budgetOnly: 'Limits are counted for the current month in',
      recurTitle: '🔁 Recurring payments',
      recurHint: 'Rent, subscriptions, internet. On the right day of the month the app reminds you and records the payment in one tap.',
      recurAdd: '+ Add a recurring payment',
      recurDay: 'Day of month',
      recurDue: 'Due now',
      recurPost: 'Record',
      recurSkip: 'Skip this month',
      recurNone: 'No recurring payments',
      recurLast: 'recorded',
      recurNever: 'never recorded',
      recurEvery: 'every',
      recurDayShort: 'of the month',
      tagLabel: 'Tag',
      tagNone: 'No tag',
      tagAll: 'All tags',
      tagsManage: 'Transaction tags',
      tagsHint: 'Separate personal spending from work — a report can then be built for a single tag.',
      tagPlaceholder: 'Tag name',
      inboxTitle: 'Automatic SMS intake',
      inboxHint: 'Your phone forwards bank SMS to your own server, and the app collects them when you open it. Set it up once and you never type anything again.',
      inboxKeyLabel: 'Inbox password',
      inboxKeyPlaceholder: 'the same as in WALLET_INBOX_KEY',
      inboxCheck: 'Check now',
      inboxChecking: 'Checking...',
      inboxEmpty: 'No new messages',
      inboxFail: 'Could not reach the inbox',
      inboxBadKey: 'The server rejected the password',
      inboxNoParse: 'Messages received, but they could not be parsed',
      inboxGot: 'Messages received',
      inboxPrivacy: 'SMS text passes through your own server and is stored there for up to a month. The server never parses or keeps amounts or transactions.'
    },
    tr: {
      appName: 'Wallet', addIncome: '+ Gelir', addExpense: '+ Gider',
      balance: 'BAKİYE', income: 'GELİR', expense: 'GİDER',
      category: 'Kategori', amount: 'Tutar', description: 'Açıklama',
      date: 'Tarih', save: 'Kaydet', update: 'Güncelle', cancel: 'İptal',
      recent: 'Son işlemler', delete: 'Sil', edit: 'Düzenle',
      selectCat: 'Kategori seçin', customCatPlaceholder: 'Özel kategori',
      light: 'Açık', dark: 'Koyu', soft: 'İş', steel: 'Grafit',
      dashboard: 'Ana Sayfa', report: 'Rapor',
      reportTitle: 'Dönem raporu', dateFrom: 'Başlangıç', dateTo: 'Bitiş',
      allTypes: 'Tümü', onlyIncome: 'Yalnızca gelir', onlyExpense: 'Yalnızca gider',
      allCategories: 'Tüm kategoriler', totalIncome: 'Toplam gelir', totalExpense: 'Toplam gider',
      totalBalance: 'Bakiye', operations: 'İşlem sayısı', noData: 'Bu dönemde veri yok',
      exportExcel: 'Excel indir', exportPDF: 'PDF indir',
      addCurrency: '+ Para birimi ekle', currencyPlaceholder: 'Örn: GBP, KZT...',
      categoriesExp: ['Market','Faturalar','Kira','İnternet','Ulaşım','Vergiler','Eğlence','Alışveriş','Diğer'],
      categoriesInc: ['Maaş','Serbest çalışma','Yatırım','Transfer','Satış','Hediye','Diğer'],
      noOperations: 'İşlem yok', chartExpenseTitle: 'Kategoriye göre giderler', chartDynamicsTitle: 'Gelir ve gider dinamiği',
      pieChart: 'Pasta', barChart: 'Çubuk', lineChart: 'Çizgi', editMode: 'Düzenleme',
      typeLabel: 'Tür', operationType: 'İşlem türü', reportResult: 'Sonuç',
      periodToday: 'Bugün', periodWeek: 'Hafta', periodMonth: 'Ay', periodYear: 'Yıl', periodAll: 'Tümü',
      dataFor: 'Dönem', otherCategory: 'Diğer',
      noLineData: '«Bugün» için çizgi grafik oluşturulmuyor — «Hafta», «Ay» veya «Yıl»ı seçin',
      printHint: 'Açılan pencerede yazdırma dialoğunda «PDF olarak kaydet»i seçin',
      receiptPhoto: '📷 Fiş fotoğrafı', settings: 'Ayarlar', saveKey: 'Anahtarı kaydet',
      apiKeyLabel: 'Gemini API anahtarı', apiKeyPlaceholder: 'AIzaSy...',
      apiKeyHint: 'Anahtar, fişleri tanımak için gereklidir. Yalnızca cihazınızda saklanır.',
      getKey: 'Anahtar nasıl alınır', keySaved: 'Anahtar kaydedildi',
      groqKeyLabel: 'Groq API anahtarı (yedek, isteğe bağlı)', groqKeyPlaceholder: 'gsk_...',
      groqKeyHint: 'Gemini kullanılamazsa otomatik devreye girer (ses, AI analizi, sohbet). Fiş fotoğrafları için kullanılmaz.',
      getGroqKey: 'Groq anahtarı nasıl alınır',
      orKeyLabel: 'OpenRouter API anahtarı (2. yedek, isteğe bağlı)', orKeyPlaceholder: 'sk-or-...',
      orKeyHint: 'Üçüncü koruma katmanı — hem Gemini hem Groq kullanılamazsa devreye girer.',
      getOrKey: 'OpenRouter anahtarı nasıl alınır',
      scanning: 'Fiş tanımlanıyor...', scanFailed: 'Tanımlanamadı. Fotoğrafı kontrol edin veya manuel girin.',
      scanFailedAuth: 'API anahtarı Google tarafından reddedildi. ⚙️ Ayarlar\'dan anahtarı güncelleyin.',
      scanFailedNetwork: 'Sunucuyla bağlantı yok. İnternetinizi kontrol edin.',
      noKeyError: 'Önce ⚙️ Ayarlar bölümünden API anahtarı ekleyin', close: 'Kapat',
      recognized: 'Verileri kontrol edip kaydedin', fromGallery: 'Galeriden',
      voiceInput: '🎤', voiceInputTitle: 'Sesli giriş', voiceListening: 'Dinliyorum...',
      voiceProcessing: 'İfade analiz ediliyor...', voiceNotSupported: 'Tarayıcınız sesli girişi desteklemiyor. Chrome veya Safari kullanın.',
      micDenied: 'Tarayıcı ayarlarında mikrofona erişime izin verin',
      noSpeech: 'Konuşma duyulmadı, tekrar deneyin', voiceParseError: 'İfade analiz edilemedi. Daha net konuşun veya manuel girin.',
      shareReport: 'Raporu paylaş', shareTitle: 'Wallet — Rapor',
      shareText: 'Gelir ve gider raporu',
      shareNotSupported: '✓ Dosya "İndirilenler" klasörüne kaydedildi. Mesajlaşma uygulamasına göndermek için: "Dosyalarım" uygulamasını açın → "İndirilenler" → wallet-report dosyasına uzun basın → "Paylaş" → uygulamayı seçin.',
      shareError: 'Dosya gönderilemedi',
      aiAnalysisTitle: '🧠 AI analizi', aiAnalysisRun: 'Analiz et', aiAnalysisRefresh: 'Yenile',
      aiAnalysisLoading: 'AI finansınızı inceliyor...',
      aiAnalysisIntro: 'Seçilen dönem için AI analizini almak için düğmeye dokunun.',
      aiAnalysisFailed: 'Analiz alınamadı. API anahtarını ve internet bağlantısını kontrol edin.',
      aiAnalysisNoData: 'Seçilen dönemde analiz için yeterli veri yok. Birkaç işlem ekleyin.',
      aiSectionMain: '🔍 Fark ettiklerim', aiSectionTrends: '📊 Trendler', aiSectionAdvice: '💡 Tavsiye',
      assistant: 'Asistan', chatTitle: '🤖 Finansal asistan',
      chatPlaceholder: 'Vergiler, muhasebe, finans hakkında sorun...',
      chatSend: 'Gönder', chatClear: 'Sohbeti temizle', chatConfirmClear: 'Tüm mesajları temizlensin mi?',
      chatEmpty: 'Vergiler, muhasebe, finans veya harcamalarınız hakkında soru sorun.',
      chatLoading: 'Asistan düşünüyor...',
      chatUseFinDataLabel: 'Cevapta finansal verilerimi kullan',
      chatDisclaimer: 'Bunlar AI cevaplarıdır. Yasal olarak önemli kararlar için avukat veya muhasebeciye danışın.',
      chatSuggestions: 'Örneğin:',
      chatExample1: 'Maaştan gelir vergisi nasıl hesaplanır?',
      chatExample2: 'Girişimciler için birleşik vergi ödemesi nedir?',
      chatExample3: 'Özbekistan\'da serbest çalışan olarak nasıl kayıt olurum?',
      chatExample4: 'Nereye en çok para harcıyorum?',
      carryLabel: 'Önceki dönemlerden devir',
      carryShort: 'DEVİR', withCarryShort: 'DEVİRLE TOPLAM',
      withCarryLabel: 'Devirle birlikte toplam',
      carryHint: 'Dönem başı bakiye',
      aiReadyBadge: 'analiz hazır',
      importTitle: '📥 Bulunan işlemler',
      importFound: 'Tanınan işlem sayısı',
      importNew: 'yeni',
      importDup: 'zaten kayıtlı',
      importTransfer: 'kartlar arası transfer gibi görünüyor — kontrol edin',
      importNeedsCheck: 'emin değilim — tutarı ve yönü kontrol edin',
      aiExportPdf: 'PDF olarak kaydet', aiShare: 'Paylaş', aiCopy: 'Kopyala',
      aiCopied: 'Kopyalandı', aiShareFail: 'Paylaşım desteklenmiyor — dosya kaydedildi',
      aiDocTitleAnalysis: 'Harcama analizi', aiDocTitleChat: 'Asistanla görüşme',
      importDebt: 'borç gibi görünüyor',
      importAdd: 'Seçilenleri ekle',
      importSelectAllNew: 'Tüm yenileri seç',
      importClearAll: 'Seçimi kaldır',
      importNothing: 'Görselde hiçbir işlem bulunamadı',
      importCard: 'kart',
      importBalanceAfter: 'sonraki bakiye',
      importAdded: 'Eklenen işlem sayısı',
      importOtherCurrency: 'Bazı işlemler farklı para biriminde — görmek için yukarıdan para birimini değiştirin',
      importNoneSelected: 'Hiçbir işlem seçilmedi',
      statementScanning: 'Ekstre okunuyor...',
      importDupHint: 'Gri satırlar verilerinizde zaten var — tekrar eklenmeyecek.',
      importFee: 'komisyon', importTotal: 'toplam', importRef: 'no', importExchange: 'şuna çevrildi',
      importSelfTransfer: 'kendi kartlarınız arasında transfer',
      catNew: '➕ Yeni kategori…', catManage: 'Kategorilerim',
      catManageHint: 'Kendi kategorilerinizi ekleyin — kaydedilir. Kullanmadığınız varsayılanları silebilirsiniz.',
      catIncomeTitle: 'Gelir kategorileri', catExpenseTitle: 'Gider kategorileri',
      catAdd: 'Ekle', catAddPlaceholder: 'Örn: Muhasebe',
      catReset: 'Varsayılanlara dön', catRenameTitle: 'Yeni kategori adı',
      catDeleteConfirm: 'Kategori listeden çıkarılsın mı? Kayıtlı işlemler değişmez.',
      catNewPlaceholder: 'Yeni kategori adı',
      plans: 'Planlar', plansTitle: '📌 Planlar ve borçlar', planAdd: '+ Kayıt ekle',
      planKind: 'Kayıt türü', planPurchase: '🛒 Alışveriş planla', planIOwe: '↗️ Borçluyum', planOwedMe: '↘️ Bana borçlu',
      planWhat: 'Tam olarak ne', planWhatPlaceholder: 'Örn: kırtasiye almak',
      planPerson: 'Kime / kimden', planPersonPlaceholder: 'Örn: Andrey',
      planDue: 'Son tarih', planNote: 'Not', planNotePlaceholder: 'İsteğe bağlı',
      planAmountOptional: 'Tutar (isteğe bağlı)',
      planDone: 'Kapat', planReopen: 'Yeniden aç', planEdit: 'Düzenle',
      planEmpty: 'Henüz plan veya borç yok',
      planEmptyHint: 'Bir kayıt ekleyin — siz kapatana kadar burada durur.',
      planActive: 'Aktif', planClosed: 'Kapalı',
      planOverdue: 'Gecikmiş', planDueToday: 'Bugün', planDueTomorrow: 'Yarın',
      planInDays: 'içinde', planDaysShort: 'gün', planNoDue: 'Tarihsiz',
      planRemindTitle: '⏰ Dikkat gerekiyor', planRemindOpen: 'Aç',
      planAskCreateTx: 'Bu tutar işlem olarak kaydedilsin mi?',
      planCreateTx: 'Evet, kaydet', planJustMark: 'Sadece kapat',
      planTxCategory: 'Borçlar', planTotalIOwe: 'Borçluyum', planTotalOwedMe: 'Bana borçlu',
      planDeleteConfirm: 'Kayıt silinsin mi?', planClosedOn: 'kapatıldı',
      ownerNameLabel: 'Kartlardaki adınız', ownerNamePlaceholder: 'TURDALIYEV A.',
      ownerNameHint: 'Dekontlarda yazıldığı gibi. Kendinize transferi gerçek giderden ayırmaya yardımcı olur.',
      myCardsLabel: 'Kartlarım', myCardsHint: 'Her kartın son 4 hanesi. Kendi kartlarınız arasındaki transferlerin gider sayılmasını önler.',
      myCardsDigits: '4 hane', myCardsName: 'Etiket (isteğe bağlı)', myCardsAdd: 'Kart ekle',
      backupTitle: 'Yedek',
      backupHint: 'Tüm veriler yalnızca bu tarayıcıda durur. Site verilerini temizlemek veya uygulamayı yeniden kurmak verileri kalıcı olarak siler. Ayda en az bir kez yedek alın.',
      backupExport: 'Yedek kaydet',
      backupImport: 'Yedekten geri yükle',
      backupConfirm: 'TÜM mevcut veriler bu dosyadakilerle değiştirilsin mi? Mevcut kayıtlar kaybolur.',
      backupDone: 'Yedek kaydedildi',
      backupRestored: 'Veriler geri yüklendi',
      backupBadFile: 'Bu dosya bir Wallet yedeğine benzemiyor',
      backupLast: 'Son yedek',
      backupNever: 'henüz yedek alınmadı',
      backupWarn: 'Uzun süredir yedek almadınız',
      ratesTitle: 'Döviz kurları',
      ratesHint: 'Başka bir para biriminin 1 birimi kaç temel para birimi eder. Yalnızca birleşik bakiye için gerekir.',
      ratesBase: 'Temel para birimi',
      ratesFor: '1 için',
      totalTitle: 'Birleşik bakiye',
      totalHint: 'Tüm para birimleri şuna çevrildi:',
      totalNoRate: 'kur girilmedi',
      reconTitle: '🔍 Bankayla mutabakat',
      reconHint: 'Bankanın son dekontta bildirdiği bakiyeyi, kayıtlarınızdan çıkan bakiyeyle karşılaştırıyoruz.',
      reconCard: 'Kart',
      reconBank: 'Banka bildirdi',
      reconOurs: 'Kayıtlarınıza göre',
      reconDiff: 'Fark',
      reconOk: 'Uyuşuyor',
      reconGap: 'Görünüşe göre bir işlem girilmemiş',
      reconEmpty: 'Henüz kart bakiyesi görünen bir dekont yok. Bakiyenin göründüğü bir SMS veya dekont ekleyin.',
      reconAsOf: 'tarihi itibarıyla',
      smsTitle: 'Banka SMS alımı',
      smsHint: 'Banka SMS metnini yapıştırın — uygulama onu cihazınızda, internetsiz ve API anahtarsız çözümler.',
      smsPlaceholder: 'Spisanie s karty: HAMKORBANK ATB, UZ,15.09.26 23:22,karta ***4283. summa:501250.00 UZS balans:1633421.97 UZS',
      smsParse: 'Metni çözümle',
      smsFail: 'Çözümlenemedi. Bunun bir banka SMS metni olduğundan emin olun.',
      smsFound: 'Çözümlenen işlem sayısı',
      searchLabel: 'Arama',
      searchPlaceholder: 'Açıklama, kategori, karşı taraf...',
      budgetTitle: '🎯 Kategori limitleri',
      budgetHint: 'Aylık harcama limiti. Uygulama sadece ne kadar kaldığını gösterir, engellemez.',
      budgetCategory: 'Kategori',
      budgetAmount: 'Aylık limit',
      budgetAdd: 'Limit belirle',
      budgetNone: 'Limit belirlenmedi',
      budgetLeft: 'kaldı',
      budgetOver: 'limit aşıldı',
      budgetSpent: 'harcandı',
      budgetOnly: 'Limitler bu ay için şu para biriminde hesaplanır:',
      recurTitle: '🔁 Düzenli ödemeler',
      recurHint: 'Kira, abonelikler, internet. Ayın ilgili gününde uygulama hatırlatır ve tek dokunuşla kaydeder.',
      recurAdd: '+ Düzenli ödeme ekle',
      recurDay: 'Ayın günü',
      recurDue: 'Zamanı geldi',
      recurPost: 'Kaydet',
      recurSkip: 'Bu ayı atla',
      recurNone: 'Düzenli ödeme yok',
      recurLast: 'kaydedildi',
      recurNever: 'hiç kaydedilmedi',
      recurEvery: 'her ayın',
      recurDayShort: '. günü',
      tagLabel: 'Etiket',
      tagNone: 'Etiketsiz',
      tagAll: 'Tüm etiketler',
      tagsManage: 'İşlem etiketleri',
      tagsHint: 'Kişisel harcamaları işten ayırın — rapor tek etikete göre alınabilir.',
      tagPlaceholder: 'Etiket adı',
      inboxTitle: 'Otomatik SMS alımı',
      inboxHint: 'Telefonunuz banka SMS\'lerini kendi sunucunuza iletir, uygulama da açıldığında onları alır. Bir kez ayarlanır, sonra hiçbir şey girmezsiniz.',
      inboxKeyLabel: 'Gelen kutusu parolası',
      inboxKeyPlaceholder: 'WALLET_INBOX_KEY ile aynı',
      inboxCheck: 'Şimdi kontrol et',
      inboxChecking: 'Kontrol ediliyor...',
      inboxEmpty: 'Yeni mesaj yok',
      inboxFail: 'Gelen kutusuna ulaşılamadı',
      inboxBadKey: 'Sunucu parolayı kabul etmedi',
      inboxNoParse: 'Mesajlar alındı ama çözümlenemedi',
      inboxGot: 'Alınan mesaj sayısı',
      inboxPrivacy: 'SMS metni kendi sunucunuzdan geçer ve orada en fazla bir ay saklanır. Sunucu tutarları çözümlemez ve saklamaz.'
    }
  };

  const t = tr[language];

  useEffect(() => {
    const saved = localStorage.getItem('walletData') || localStorage.getItem('pvaData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTransactions(data.transactions || []);
        setTheme(data.theme || 'light');
        setLanguage(data.language || 'ru');
        setCurrency(data.currency || 'UZS');
        if (data.currencies) setCurrencies(data.currencies);
        if (data.dashboardPeriod) setDashboardPeriod(data.dashboardPeriod);
        if (data.customCats) setCustomCats({ income: data.customCats.income || null, expense: data.customCats.expense || null });
        if (typeof data.ownerName === 'string') setOwnerName(data.ownerName);
        if (Array.isArray(data.myCards)) setMyCards(data.myCards);
        if (Array.isArray(data.plans)) setPlans(data.plans);
        if (data.rates && typeof data.rates === 'object') setRates(data.rates);
        if (typeof data.baseCurrency === 'string') setBaseCurrency(data.baseCurrency);
        if (data.budgets && typeof data.budgets === 'object') setBudgets(data.budgets);
        if (Array.isArray(data.recurring)) setRecurring(data.recurring);
        if (Array.isArray(data.tags)) setTags(data.tags);
        if (typeof data.lastBackup === 'string') setLastBackup(data.lastBackup);
      } catch (e) {}
    }
    const key = localStorage.getItem('walletGeminiKey');
    if (key) { setGeminiKey(key); setTempKey(key); }
    const gKey = localStorage.getItem('walletGroqKey');
    if (gKey) { setGroqKey(gKey); setTempGroqKey(gKey); }
    const inbK = localStorage.getItem('walletInboxKey');
    if (inbK) { setInboxKey(inbK); setTempInboxKey(inbK); }
    const orK = localStorage.getItem('walletOrKey');
    if (orK) { setOrKey(orK); setTempOrKey(orK); }
    const savedAi = localStorage.getItem('walletAiAnalysis');
    if (savedAi) {
      try {
        const parsed = JSON.parse(savedAi);
        setAiAnalysis(parsed.analysis);
        setAiAnalysisPeriod(parsed.period);
      } catch (e) {}
    }
    const savedChat = localStorage.getItem('walletChat');
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        if (Array.isArray(parsed)) setChatMessages(parsed);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem('walletData', JSON.stringify({ transactions, theme, language, currency, currencies, dashboardPeriod, customCats, ownerName, myCards, plans, rates, baseCurrency, budgets, recurring, tags, lastBackup }));
  }, [transactions, theme, language, currency, currencies, dashboardPeriod, customCats, ownerName, myCards, plans, rates, baseCurrency, budgets, recurring, tags, lastBackup]);

  // Автосворачивание раскрытых прошлых месяцев и годов при любом действии вне списка
  useEffect(() => {
    setExpandedMonths(new Set());
    setExpandedYears(new Set());
  }, [dashboardPeriod, language, theme, currency, activeTab, showForm, showSettings, listening, scanning]);

  const themes = {
    light: { bg: '#F7F4ED', text: '#1B2845', sec: '#5F5E5A', card: '#FFFFFF', border: '#E0DCD0', incomeColor: '#3F7D58', expenseColor: '#8B4548', saveBtn: '#B07D3F', tabActive: '#1B2845', tabText: '#FFFFFF', carryColor: '#7A5528', balanceColor: '#3A5BA0' },
    dark: { bg: '#000000', text: '#FFFFFF', sec: '#C9A84C', card: '#111111', border: '#2A2A2A', incomeColor: '#C9A84C', expenseColor: '#E05555', saveBtn: '#C9A84C', tabActive: '#C9A84C', tabText: '#000000', carryColor: '#9FC4E0', balanceColor: '#7FA8E8' },
    steel: { bg: '#141516', text: '#E8EAEC', sec: '#9AA0A6', card: '#1D1F21', border: '#34383C', incomeColor: '#7FBF9A', expenseColor: '#D98A8A', saveBtn: '#5A6068', tabActive: '#C6CBD1', tabText: '#141516', carryColor: '#B8BEC6', balanceColor: '#8FA8C8' },
    soft: { bg: '#EEF1F5', text: '#1A2635', sec: '#4A6080', card: '#FFFFFF', border: '#C8D3DE', incomeColor: '#1E5C3A', expenseColor: '#6B2737', saveBtn: '#1E3A5C', tabActive: '#1E3A5C', tabText: '#FFFFFF', carryColor: '#8A6A3F', balanceColor: '#2F5FA8' }
  };
  const c = themes[theme];

  // ===== КАТЕГОРИИ ПОЛЬЗОВАТЕЛЯ =====
  // Пока пользователь не трогал список — показываем встроенный набор текущего языка.
  // Как только он что-то добавил, переименовал или удалил — список становится его собственным
  // и больше не меняется при переключении языка.
  const catsFor = (type) => {
    const own = type === 'income' ? customCats.income : customCats.expense;
    if (own && own.length) return own;
    return type === 'income' ? t.categoriesInc : t.categoriesExp;
  };

  // Списки правим через функциональное обновление: если пользователь ещё не заводил свой набор,
  // за основу берётся встроенный — так первое же изменение материализует список.
  const baseList = (prev, type) => (type === 'income' ? prev.income : prev.expense)
    || (type === 'income' ? t.categoriesInc : t.categoriesExp);

  const addCategory = (type, name) => {
    const clean = String(name || '').trim();
    if (!clean) return false;
    setCustomCats(prev => {
      const base = baseList(prev, type);
      if (base.some(x => x.toLowerCase() === clean.toLowerCase())) return prev;
      return { ...prev, [type]: [...base, clean] };
    });
    return true;
  };

  const removeCategory = (type, name) => {
    setCustomCats(prev => ({ ...prev, [type]: baseList(prev, type).filter(x => x !== name) }));
  };

  // Переименование правит и уже внесённые операции, чтобы отчёты не распались на два имени
  const renameCategory = (type, oldName, newName) => {
    const clean = String(newName || '').trim();
    if (!clean || clean === oldName) return;
    setCustomCats(prev => ({ ...prev, [type]: baseList(prev, type).map(x => x === oldName ? clean : x) }));
    setTransactions(prev => prev.map(tx => (tx.type === type && tx.category === oldName) ? { ...tx, category: clean } : tx));
  };

  const resetCategories = (type) => setCustomCats(prev => ({ ...prev, [type]: null }));

  const isNewCat = formData.category === '__new__';

  const submitTransaction = (e) => {
    e.preventDefault();
    const finalCategory = isNewCat ? formData.customCategory.trim() : formData.category;
    if (!formData.amount || !finalCategory) return;
    if (isNewCat) addCategory(formType, finalCategory);
    if (editingId) {
      setTransactions(transactions.map(tx => tx.id === editingId ? { ...tx, amount: parseFloat(formData.amount), category: finalCategory, description: formData.description, tag: formData.tag, date: formData.date } : tx));
      setEditingId(null);
    } else {
      setTransactions([...transactions, { id: Date.now(), type: formType, amount: parseFloat(formData.amount), category: finalCategory, description: formData.description, tag: formData.tag, currency, date: formData.date }]);
    }
    setFormData({ amount: '', category: '', customCategory: '', description: '', tag: '', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const startEdit = (tx) => {
    const known = catsFor(tx.type).includes(tx.category);
    setFormType(tx.type);
    setEditingId(tx.id);
    setFormData({ amount: tx.amount.toString(), category: known ? tx.category : '__new__', customCategory: known ? '' : tx.category, description: tx.description || '', tag: tx.tag || '', date: tx.date });
    setShowForm(true);
    setActiveTab('dashboard');
  };

  const deleteTransaction = (id) => setTransactions(transactions.filter(tx => tx.id !== id));

  // ===== ПЛАНЫ И ДОЛГИ =====
  // Три вида записей: запланированная покупка, мой долг кому-то, чужой долг мне.
  // Запись висит активной, пока пользователь сам её не закроет.
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const a = new Date(todayStr + 'T00:00:00');
    const b = new Date(dateStr + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  };

  const openPlanForm = (kind) => {
    setEditingPlanId(null);
    setPlanData({ kind, what: '', person: '', amount: '', currency, dueDate: '', note: '' });
    setShowPlanForm(true);
  };

  const startEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setPlanData({
      kind: plan.kind,
      what: plan.what || '',
      person: plan.person || '',
      amount: plan.amount != null ? String(plan.amount) : '',
      currency: plan.currency || currency,
      dueDate: plan.dueDate || '',
      note: plan.note || ''
    });
    setShowPlanForm(true);
    setActiveTab('plans');
  };

  const submitPlan = (e) => {
    e.preventDefault();
    const what = planData.what.trim();
    const person = planData.person.trim();
    if (!what && !person) return;
    const amountNum = planData.amount === '' ? null : parseFloat(planData.amount);
    const payload = {
      kind: planData.kind,
      what,
      person,
      amount: (amountNum != null && isFinite(amountNum) && amountNum > 0) ? amountNum : null,
      currency: planData.currency || currency,
      dueDate: planData.dueDate || '',
      note: planData.note.trim()
    };
    if (editingPlanId) {
      setPlans(plans.map(pl => pl.id === editingPlanId ? { ...pl, ...payload } : pl));
    } else {
      setPlans([...plans, { id: Date.now(), ...payload, done: false, doneAt: null, createdAt: todayStr }]);
    }
    setShowPlanForm(false);
    setEditingPlanId(null);
    setPlanData({ kind: 'iowe', what: '', person: '', amount: '', currency, dueDate: '', note: '' });
  };

  // Закрытие записи. Если у неё есть сумма, можно сразу завести настоящую операцию:
  // отданный долг и покупка — расход, возвращённый мне долг — доход.
  const closePlan = (plan, createTx) => {
    if (createTx && plan.amount) {
      const txType = plan.kind === 'owedme' ? 'income' : 'expense';
      const label = [plan.what, plan.person].filter(Boolean).join(' · ');
      setTransactions(prev => [...prev, {
        id: Date.now(),
        type: txType,
        amount: plan.amount,
        category: t.planTxCategory,
        description: label.slice(0, 160),
        currency: plan.currency || currency,
        date: todayStr,
        source: 'plan'
      }]);
      if (!plan.currencyKnown && plan.currency && !currencies.includes(plan.currency)) {
        setCurrencies(prev => prev.includes(plan.currency) ? prev : [...prev, plan.currency]);
      }
    }
    setPlans(prev => prev.map(pl => pl.id === plan.id ? { ...pl, done: true, doneAt: todayStr } : pl));
    setConfirmClosePlanId(null);
  };

  const reopenPlan = (id) => setPlans(plans.map(pl => pl.id === id ? { ...pl, done: false, doneAt: null } : pl));
  const deletePlan = (id) => setPlans(plans.filter(pl => pl.id !== id));

  const activePlans = plans.filter(pl => !pl.done)
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return b.id - a.id;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  const closedPlans = plans.filter(pl => pl.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));

  // Напоминание показываем только по делу: просрочено или срок в ближайшие 7 дней
  const attentionPlans = activePlans.filter(pl => {
    const d = daysUntil(pl.dueDate);
    return d != null && d <= 7;
  });
  const overdueCount = activePlans.filter(pl => {
    const d = daysUntil(pl.dueDate);
    return d != null && d < 0;
  }).length;

  const planDueInfo = (pl) => {
    const d = daysUntil(pl.dueDate);
    if (d == null) return { text: t.planNoDue, color: c.sec, urgent: false };
    if (d < 0) return { text: t.planOverdue + ' · ' + pl.dueDate, color: c.expenseColor, urgent: true };
    if (d === 0) return { text: t.planDueToday, color: '#E67E22', urgent: true };
    if (d === 1) return { text: t.planDueTomorrow, color: '#E67E22', urgent: true };
    if (d <= 7) return { text: t.planInDays + ' ' + d + ' ' + t.planDaysShort, color: '#E67E22', urgent: false };
    return { text: pl.dueDate, color: c.sec, urgent: false };
  };

  const planKindMeta = (kind) => {
    if (kind === 'purchase') return { icon: '🛒', label: t.planPurchase, color: c.saveBtn };
    if (kind === 'owedme') return { icon: '↘️', label: t.planOwedMe, color: c.incomeColor };
    return { icon: '↗️', label: t.planIOwe, color: c.expenseColor };
  };

  // Сводка по долгам, сгруппированная по валютам
  const debtTotals = (kind) => {
    const map = {};
    activePlans.filter(pl => pl.kind === kind && pl.amount).forEach(pl => {
      const cur = pl.currency || currency;
      map[cur] = (map[cur] || 0) + pl.amount;
    });
    return Object.entries(map);
  };


  const addCurrency = () => {
    const val = newCurrency.trim().toUpperCase();
    if (val && !currencies.includes(val)) {
      setCurrencies([...currencies, val]);
      setCurrency(val);
    }
    setNewCurrency('');
    setShowCurrencyInput(false);
  };

  // ===== НАЗВАНИЯ МЕСЯЦЕВ НА 4 ЯЗЫКАХ =====
  const monthNames = {
    ru: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
    uz: ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    tr: ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  };
  const formatMonthLabel = (dateStr) => {
    const [y, m] = dateStr.split('-');
    const monthIdx = parseInt(m, 10) - 1;
    const names = monthNames[language] || monthNames.ru;
    return names[monthIdx] + ' ' + y;
  };

  // ===== ФИЛЬТР ПО ПЕРИОДУ ДЛЯ ГЛАВНОГО ЭКРАНА =====
  // Локальная дата в формате YYYY-MM-DD — сравниваем строки, а не объекты Date,
  // чтобы граница периода не «уезжала» из-за часового пояса.
  const toIsoDate = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  const getPeriodRange = (period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (period) {
      case 'today':
        return { fromStr: toIsoDate(today), label: today.toLocaleDateString(language === 'en' ? 'en-GB' : language) };
      case 'week': {
        const day = today.getDay() || 7; // Пн=1..Вс=7
        const monday = new Date(today);
        monday.setDate(today.getDate() - (day - 1));
        return { fromStr: toIsoDate(monday), label: monday.toLocaleDateString(language === 'en' ? 'en-GB' : language) + ' — ' + today.toLocaleDateString(language === 'en' ? 'en-GB' : language) };
      }
      case 'month': {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        return { fromStr: toIsoDate(first), label: first.toLocaleDateString(language === 'en' ? 'en-GB' : language, { month: 'long', year: 'numeric' }) };
      }
      case 'year': {
        const first = new Date(now.getFullYear(), 0, 1);
        return { fromStr: toIsoDate(first), label: String(now.getFullYear()) };
      }
      case 'all':
      default:
        return { fromStr: null, label: t.periodAll };
    }
  };

  const { fromStr: periodFromStr, label: periodLabel } = getPeriodRange(dashboardPeriod);

  const periodTransactions = transactions.filter(tx => {
    if (tx.currency !== currency) return false;
    if (periodFromStr && tx.date < periodFromStr) return false;
    return true;
  });

  const income = periodTransactions.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const expense = periodTransactions.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const balance = income - expense;

  // ===== ОСТАТОК, ПЕРЕШЕДШИЙ С ПРОШЛЫХ ПЕРИОДОВ =====
  // Сальдо всех операций в текущей валюте, совершённых ДО начала выбранного периода.
  // Показывает, с каким «плюсом» или «минусом» пользователь вошёл в новый месяц/год.
  const carryOver = periodFromStr
    ? transactions.reduce((s, tx) => {
        if (tx.currency !== currency) return s;
        if (tx.date >= periodFromStr) return s;
        return s + (tx.type === 'income' ? tx.amount : -tx.amount);
      }, 0)
    : 0;
  const balanceWithCarry = carryOver + balance;
  const hasCarryData = periodFromStr && transactions.some(tx => tx.currency === currency && tx.date < periodFromStr);

  // Данные для круговой/столбчатой диаграммы — расходы по категориям за выбранный период
  const categoryData = {};
  periodTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
    categoryData[tx.category] = (categoryData[tx.category] || 0) + tx.amount;
  });
  const chartData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Для круговой: сворачиваем категории <3% в "Прочее" чтобы не было каши микро-секторов
  const pieData = (() => {
    const total = chartData.reduce((s, d) => s + d.value, 0) || 1;
    const threshold = 0.03;
    const big = chartData.filter(d => d.value / total >= threshold);
    const small = chartData.filter(d => d.value / total < threshold);
    if (small.length === 0) return chartData;
    const otherValue = small.reduce((s, x) => s + x.value, 0);
    if (otherValue === 0) return big;
    return [...big, { name: t.otherCategory, value: otherValue }];
  })();
  const chartColors = ['#8B1F1F', '#C0392B', '#E67E22', '#D4AC0D', '#95A5A6', '#7F8C8D', '#5D6D7E', '#34495E'];

  // Для столбчатой: сортировка по убыванию + топ-6 + свернуть остальное в «Прочее»
  const barData = (() => {
    const sorted = [...chartData].sort((a, b) => b.value - a.value);
    if (sorted.length <= 7) return sorted;
    const top = sorted.slice(0, 6);
    const rest = sorted.slice(6);
    const other = { name: t.otherCategory, value: rest.reduce((s, x) => s + x.value, 0) };
    return [...top, other];
  })();

  // Тепловая палитра для столбчатой: топ-3 бордо → красный → оранжевый, остальные — приглушённые
  const barColor = (idx) => {
    if (idx === 0) return '#8B1F1F';
    if (idx === 1) return '#C0392B';
    if (idx === 2) return '#E67E22';
    return '#7F8C8D';
  };

  // Компактный формат больших сумм для меток над столбцами
  const shortNum = (v) => {
    if (v >= 1000000) return (v / 1000000).toFixed(v >= 10000000 ? 0 : 1) + 'M';
    if (v >= 1000) return Math.round(v / 1000) + 'K';
    return String(v);
  };

  // Для линейной: динамика доходов и расходов по времени
  const lineData = (() => {
    if (dashboardPeriod === 'today') return null; // За сегодня линия бессмысленна
    const buckets = {};
    const useMonths = dashboardPeriod === 'year' || dashboardPeriod === 'all';
    periodTransactions.forEach(tx => {
      let key;
      if (useMonths) {
        key = tx.date.substring(0, 7); // YYYY-MM
      } else {
        key = tx.date; // YYYY-MM-DD
      }
      if (!buckets[key]) buckets[key] = { name: key, income: 0, expense: 0 };
      buckets[key][tx.type] += tx.amount;
    });
    return Object.values(buckets).sort((a, b) => a.name.localeCompare(b.name));
  })();

  // ===== ПОМЕСЯЧНАЯ И ПОГОДОВАЯ СВОДКА ДЛЯ СПИСКА ОПЕРАЦИЙ =====
  // По каждому месяцу: суммы прихода/расхода в текущей валюте + ранги расходов (топ-3 = светофор)
  // По каждому году: суммарные приход/расход в текущей валюте
  const monthlySummary = (() => {
    const map = {};
    transactions.forEach(tx => {
      if (tx.currency !== currency) return;
      const month = tx.date.substring(0, 7);
      if (!map[month]) map[month] = { income: 0, expense: 0, expenses: [] };
      map[month][tx.type] += tx.amount;
      if (tx.type === 'expense') map[month].expenses.push(tx);
    });
    Object.values(map).forEach(m => {
      m.expenses.sort((a, b) => b.amount - a.amount);
      m.expenseRank = {};
      m.expenses.forEach((tx, i) => { m.expenseRank[tx.id] = i; });
    });
    return map;
  })();

  const yearlySummary = (() => {
    const map = {};
    transactions.forEach(tx => {
      if (tx.currency !== currency) return;
      const year = tx.date.substring(0, 4);
      if (!map[year]) map[year] = { income: 0, expense: 0 };
      map[year][tx.type] += tx.amount;
    });
    return map;
  })();

  // Цвет расхода: топ-1/2/3 в месяце — светофор, остальные — обычный
  const getExpenseColor = (tx) => {
    if (tx.currency !== currency) return c.expenseColor; // не текущая валюта — не участвует в светофоре
    const month = tx.date.substring(0, 7);
    const rank = monthlySummary[month]?.expenseRank?.[tx.id];
    if (rank === 0) return '#8B1F1F';
    if (rank === 1) return '#C0392B';
    if (rank === 2) return '#E67E22';
    return c.expenseColor;
  };

  const cats = catsFor(formType);


  const allCategories = [...new Set([...catsFor('income'), ...catsFor('expense'), ...transactions.map(tx => tx.category)])].filter(Boolean).sort((a, b) => a.localeCompare(b));

  const getReportData = () => transactions.filter(tx => {
    const q = searchText.trim().toLowerCase();
    const haystack = [tx.description, tx.category, tx.counterparty, tx.card].filter(Boolean).join(' ').toLowerCase();
    return (!filterFrom || tx.date >= filterFrom) && (!filterTo || tx.date <= filterTo) &&
      (filterType === 'all' || tx.type === filterType) &&
      (!filterCategory || tx.category === filterCategory) &&
      (!filterTag || (tx.tag || '') === filterTag) &&
      (!q || haystack.includes(q)) &&
      tx.currency === currency;
  });

  const reportData = getReportData();
  const reportIncome = reportData.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const reportExpense = reportData.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);

  // ===== КУРСЫ ВАЛЮТ И СВОДНЫЙ БАЛАНС =====
  // Операции всегда хранятся в своей валюте. Курс нужен только чтобы показать
  // один общий итог: сколько всего денег, если свести всё к базовой валюте.
  const rateOf = (cur) => {
    if (cur === baseCurrency) return 1;
    const r = parseFloat(rates[cur]);
    return (isFinite(r) && r > 0) ? r : null;
  };

  const balanceByCurrency = (() => {
    const map = {};
    transactions.forEach(tx => {
      if (!map[tx.currency]) map[tx.currency] = 0;
      map[tx.currency] += tx.type === 'income' ? tx.amount : -tx.amount;
    });
    return map;
  })();

  const combinedBalance = (() => {
    let total = 0;
    const missing = [];
    Object.entries(balanceByCurrency).forEach(([cur, val]) => {
      if (Math.abs(val) < 0.0001) return;
      const r = rateOf(cur);
      if (r == null) { missing.push(cur); return; }
      total += val * r;
    });
    return { total, missing };
  })();

  // ===== СВЕРКА С БАНКОМ =====
  // У операций, попавших из SMS и квитанций, сохранён остаток на карте после операции.
  // Берём самую свежую такую операцию по каждой карте и смотрим: если к этому остатку
  // прибавить всё, что мы записали позже, получится ли то, что у нас в базе сейчас.
  // Расхождение почти всегда означает не внесённую операцию.
  const reconciliation = (() => {
    // Группируем операции, у которых банк прислал остаток, по карте и валюте
    const groups = {};
    transactions.forEach(tx => {
      if (!tx.card || tx.balanceAfter == null) return;
      const key = tx.card + '|' + tx.currency;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ ...tx, stamp: tx.date + ' ' + (tx.time || '00:00') });
    });

    return Object.entries(groups).map(([key, withBalance]) => {
      withBalance.sort((a, b) => a.stamp.localeCompare(b.stamp));
      const first = withBalance[0];
      const last = withBalance[withBalance.length - 1];
      const [card, cur] = key.split('|');
      // Одна точка опоры — сверять не с чем
      if (withBalance.length < 2) {
        return { card, currency: cur, bank: last.balanceAfter, date: last.date, time: last.time || '', expected: last.balanceAfter, diff: 0, comparable: false };
      }
      // Что должно получиться: остаток на первой точке плюс всё,
      // что произошло на этой карте после неё и до последней точки включительно
      const between = transactions.filter(tx => {
        if (tx.card !== card || tx.currency !== cur) return false;
        const stamp = tx.date + ' ' + (tx.time || '00:00');
        return stamp > first.stamp && stamp <= last.stamp;
      });
      const delta = between.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
      const expected = first.balanceAfter + delta;
      const diff = Math.round((last.balanceAfter - expected) * 100) / 100;
      return { card, currency: cur, bank: last.balanceAfter, date: last.date, time: last.time || '', expected, diff, comparable: true };
    }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  })();

  // ===== ЛИМИТЫ ПО КАТЕГОРИЯМ =====
  const budgetKey = (cur, cat) => cur + '|' + cat;
  const monthStart = (() => {
    const n = new Date();
    return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-01';
  })();

  const budgetRows = Object.entries(budgets)
    .filter(([key, limit]) => key.startsWith(currency + '|') && parseFloat(limit) > 0)
    .map(([key, limit]) => {
      const cat = key.slice(currency.length + 1);
      const spent = transactions
        .filter(tx => tx.type === 'expense' && tx.currency === currency && tx.category === cat && tx.date >= monthStart)
        .reduce((sum, tx) => sum + tx.amount, 0);
      const lim = parseFloat(limit);
      return { key, cat, limit: lim, spent, left: lim - spent, pct: Math.min(100, Math.round(spent / lim * 100)) };
    })
    .sort((a, b) => b.pct - a.pct);

  // ===== РЕГУЛЯРНЫЕ ПЛАТЕЖИ =====
  // Считаем платёж «созревшим», если наступил его день месяца, а в этом месяце его ещё не вносили.
  const currentMonthKey = monthStart.slice(0, 7);
  const recurringDue = recurring.filter(r => {
    if (r.lastPosted === currentMonthKey || r.skipped === currentMonthKey) return false;
    const today = new Date().getDate();
    return today >= Math.min(28, parseInt(r.day, 10) || 1);
  });

  const postRecurring = (r) => {
    setTransactions(prev => [...prev, {
      id: Date.now(),
      type: r.type || 'expense',
      amount: parseFloat(r.amount),
      category: r.category,
      description: r.description || '',
      currency: r.currency,
      date: new Date().toISOString().split('T')[0],
      tag: r.tag || '',
      source: 'recurring'
    }]);
    setRecurring(prev => prev.map(x => x.id === r.id ? { ...x, lastPosted: currentMonthKey } : x));
  };

  const skipRecurring = (r) => setRecurring(prev => prev.map(x => x.id === r.id ? { ...x, skipped: currentMonthKey } : x));
  const deleteRecurring = (id) => setRecurring(prev => prev.filter(x => x.id !== id));

  // ===== РЕЗЕРВНАЯ КОПИЯ =====
  const exportBackup = () => {
    const payload = {
      app: 'wallet', version: 1, savedAt: new Date().toISOString(),
      data: { transactions, theme, language, currency, currencies, dashboardPeriod, customCats, ownerName, myCards, plans, rates, baseCurrency, budgets, recurring, tags }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wallet-backup-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setLastBackup(new Date().toISOString().split('T')[0]);
    setScanNotice(t.backupDone);
    setTimeout(() => setScanNotice(''), 3000);
  };

  const importBackup = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const d = parsed?.data;
      if (!d || !Array.isArray(d.transactions)) throw new Error('bad');
      if (!window.confirm(t.backupConfirm)) return;
      setTransactions(d.transactions);
      if (d.theme) setTheme(d.theme);
      if (d.language) setLanguage(d.language);
      if (d.currency) setCurrency(d.currency);
      if (Array.isArray(d.currencies)) setCurrencies(d.currencies);
      if (d.customCats) setCustomCats({ income: d.customCats.income || null, expense: d.customCats.expense || null });
      if (typeof d.ownerName === 'string') setOwnerName(d.ownerName);
      if (Array.isArray(d.myCards)) setMyCards(d.myCards);
      if (Array.isArray(d.plans)) setPlans(d.plans);
      if (d.rates) setRates(d.rates);
      if (d.baseCurrency) setBaseCurrency(d.baseCurrency);
      if (d.budgets) setBudgets(d.budgets);
      if (Array.isArray(d.recurring)) setRecurring(d.recurring);
      if (Array.isArray(d.tags)) setTags(d.tags);
      setScanNotice(t.backupRestored);
      setTimeout(() => setScanNotice(''), 4000);
    } catch (err) {
      setScanError(t.backupBadFile);
      setTimeout(() => setScanError(''), 6000);
    }
  };

  // Напоминание о копии: если её не делали больше 30 дней, а записи есть
  const backupStale = transactions.length > 5 && (() => {
    if (!lastBackup) return true;
    const diff = (new Date() - new Date(lastBackup + 'T00:00:00')) / 86400000;
    return diff > 30;
  })();

  // ===== МНОГОУРОВНЕВАЯ ЗАЩИТА ОТ ОТКЛЮЧЕНИЯ МОДЕЛЕЙ GOOGLE =====
  // Google периодически отключает старые версии Gemini без долгого предупреждения.
  // Пробуем по очереди несколько моделей; если Google отключит одну — тихо переходим к следующей.
  // Порядок перебора моделей. Первым идёт псевдоним, который Google сам переводит
  // на свежую модель — он не устареет. Дальше конкретные версии на случай,
  // если псевдоним временно недоступен.
  const GEMINI_MODEL_CHAIN = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3-flash-preview'];

  // Gemini 3 и Gemini 2.5 настраиваются по-разному, и смешивать параметры нельзя:
  //  - у 3-й серии глубина размышления задаётся строкой thinkingLevel, а thinkingBudget не рекомендуется;
  //  - у 3-й серии температуру просить не надо вовсе: Google советует оставлять её по умолчанию,
  //    иначе модель может зацикливаться и отвечать заметно дольше;
  //  - у 2.5 наоборот: thinkingLevel не поддерживается, нужен числовой thinkingBudget.
  // Поэтому тело запроса подгоняется под конкретную модель прямо перед отправкой.
  const adaptRequestForModel = (body, model) => {
    const isLegacy = model.includes('2.5') || model.includes('2.0');
    const out = { ...body };
    const gen = { ...(body.generationConfig || {}) };
    const think = { ...(gen.thinkingConfig || {}) };

    if (isLegacy) {
      if (think.thinkingLevel) {
        const map = { minimal: 0, low: 512, medium: 2048, high: 8192 };
        think.thinkingBudget = map[think.thinkingLevel] ?? 1024;
        delete think.thinkingLevel;
      }
    } else {
      delete gen.temperature;
      delete gen.topP;
      delete gen.topK;
      if (think.thinkingBudget != null) {
        think.thinkingLevel = think.thinkingBudget === 0 ? 'minimal' : think.thinkingBudget <= 1024 ? 'low' : 'medium';
        delete think.thinkingBudget;
      }
    }
    if (Object.keys(think).length) gen.thinkingConfig = think; else delete gen.thinkingConfig;
    if (Object.keys(gen).length) out.generationConfig = gen; else delete out.generationConfig;
    return out;
  };

  // Универсальный вызов Gemini с перебором моделей. requestBody — тело запроса (contents, generationConfig и т.п.)
  // Возвращает текст ответа модели или бросает ошибку с деталями последней неудачной попытки.
  const callGeminiChain = async (requestBody) => {
    let lastErrorDetail = '';
    for (const model of GEMINI_MODEL_CHAIN) {
      try {
        // Если модель молчит дольше минуты, обрываем и идём к следующей,
        // иначе приложение «висит» без объяснений
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 60000);
        let response;
        try {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
              body: JSON.stringify(adaptRequestForModel(requestBody, model)),
              signal: controller.signal
            }
          );
        } finally {
          clearTimeout(timer);
        }
        if (!response.ok) {
          let detail = 'HTTP ' + response.status;
          try {
            const errData = await response.json();
            if (errData?.error?.message) detail = errData.error.message;
          } catch (e) {}
          lastErrorDetail = `[${model}] ${detail}`;
          // 404/503 — модель недоступна, пробуем следующую. Другие ошибки (напр. неверный ключ) — тоже пробуем следующую на всякий случай.
          continue;
        }
        const data = await response.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!raw) { lastErrorDetail = `[${model}] empty-response`; continue; }
        return raw;
      } catch (err) {
        lastErrorDetail = `[${model}] ${err?.message || 'network-error'}`;
        continue;
      }
    }
    throw new Error('gemini-chain-failed: ' + lastErrorDetail);
  };

  // Резервный текстовый провайдер — Groq (не поддерживает изображения, только текст).
  // Используется только если ВСЕ модели Gemini недоступны.
  const callGroqText = async (systemPrompt, userText, expectJson) => {
    if (!groqKey) throw new Error('no-groq-key');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + groqKey },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText }
        ],
        temperature: 0.3,
        ...(expectJson ? { response_format: { type: 'json_object' } } : {})
      })
    });
    if (!response.ok) {
      let detail = 'HTTP ' + response.status;
      try {
        const errData = await response.json();
        if (errData?.error?.message) detail = errData.error.message;
      } catch (e) {}
      throw new Error('groq: ' + detail);
    }
    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) throw new Error('groq: empty-response');
    return raw;
  };

  // Резервный текстовый провайдер уровня 3 — OpenRouter (бесплатная Llama 3.3), только текст.
  const callOpenRouterText = async (systemPrompt, userText, expectJson) => {
    if (!orKey) throw new Error('no-or-key');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + orKey,
        'HTTP-Referer': 'https://pva-finance.vercel.app/',
        'X-Title': 'Wallet'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText }
        ],
        temperature: 0.3,
        ...(expectJson ? { response_format: { type: 'json_object' } } : {})
      })
    });
    if (!response.ok) {
      let detail = 'HTTP ' + response.status;
      try {
        const errData = await response.json();
        if (errData?.error?.message) detail = errData.error.message;
      } catch (e) {}
      throw new Error('openrouter: ' + detail);
    }
    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) throw new Error('openrouter: empty-response');
    return raw;
  };

  // Единая точка входа для текстовых задач: пробует Gemini (цепочка моделей) → Groq → OpenRouter по очереди.
  // geminiRequestBody — тело запроса к Gemini. systemPrompt/userText — та же задача в формате OpenAI-совместимых сообщений (для Groq/OpenRouter).
  const callTextWithFallback = async (geminiRequestBody, systemPrompt, userText, expectJson) => {
    try {
      return await callGeminiChain(geminiRequestBody);
    } catch (geminiErr) {
      if (groqKey) {
        try {
          return await callGroqText(systemPrompt, userText, expectJson);
        } catch (groqErr) {
          if (orKey) return await callOpenRouterText(systemPrompt, userText, expectJson);
          throw groqErr;
        }
      }
      if (orKey) return await callOpenRouterText(systemPrompt, userText, expectJson);
      throw geminiErr;
    }
  };

  // ===== СЖАТИЕ ФОТО ПЕРЕД ОТПРАВКОЙ В GEMINI =====
  const compressImage = (file, maxSide = 2000, quality = 0.92) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (Math.max(width, height) > maxSide) {
        const ratio = maxSide / Math.max(width, height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Compression failed'));
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, 'image/jpeg', quality);
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });

  // ===== СРАВНЕНИЕ ОПЕРАЦИЙ (ЗАЩИТА ОТ ЗАДВОЕНИЯ) =====
  // Проверяем от обязательных признаков к уточняющим.
  // Тип, валюта, сумма и дата обязаны совпасть полностью.
  // Карта, остаток после операции и время — если известны у обеих записей и различаются,
  // значит это РАЗНЫЕ операции (две покупки на одну сумму в один день — обычное дело).
  const isSameTx = (a, b) => {
    // Номер транзакции из квитанции — самый надёжный признак.
    // Есть у обеих и совпал — это одна операция, других проверок не нужно.
    // Есть у обеих и разный — это точно разные операции.
    if (a.ref && b.ref) return a.ref === b.ref;

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

  // Приведение распознанной операции к внутреннему формату + отбраковка мусора
  const normalizeScannedItem = (raw, fallbackCats) => {
    const num = (v) => {
      if (typeof v === 'number') return isFinite(v) ? v : null;
      if (typeof v !== 'string') return null;
      const cleaned = v.replace(/\s/g, '').replace(/,/g, '.').replace(/[^\d.-]/g, '');
      const n = parseFloat(cleaned);
      return isFinite(n) ? n : null;
    };
    const amount = num(raw?.amount);
    if (!amount || amount <= 0) return null;
    const type = raw?.type === 'income' ? 'income' : 'expense';
    const date = typeof raw?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)
      ? raw.date
      : new Date().toISOString().split('T')[0];
    const time = typeof raw?.time === 'string' && /^\d{2}:\d{2}$/.test(raw.time) ? raw.time : null;
    const cardDigits = raw?.card ? String(raw.card).replace(/\D/g, '') : '';
    const card = cardDigits.length >= 4 ? cardDigits.slice(-4) : null;
    const currencyVal = typeof raw?.currency === 'string' && /^[A-Za-z]{3}$/.test(raw.currency.trim())
      ? raw.currency.trim().toUpperCase()
      : currency;
    const catList = fallbackCats(type);
    const category = (typeof raw?.category === 'string' && raw.category.trim())
      ? raw.category.trim()
      : catList[catList.length - 1];
    const feeRaw = num(raw?.fee);
    const fee = (feeRaw && feeRaw > 0 && type === 'expense') ? feeRaw : 0;
    const ref = raw?.ref ? String(raw.ref).trim().slice(0, 60) : null;
    const counterparty = typeof raw?.counterparty === 'string' ? raw.counterparty.trim().slice(0, 60) : '';
    const exchangedTo = typeof raw?.exchangedTo === 'string' ? raw.exchangedTo.trim().slice(0, 40) : '';
    // Своя карта с обеих сторон или собственное имя у отправителя и получателя —
    // это перемещение денег внутри своего кошелька, а не трата.
    const myLast4 = myCards.map(x => x.last4);
    const selfTransfer = raw?.selfTransfer === true ||
      (!!card && !!raw?.counterCard && myLast4.includes(card) && myLast4.includes(String(raw.counterCard).replace(/\D/g, '').slice(-4)));
    return {
      type,
      amount,                      // сумма самой операции, без комиссии
      fee,                         // комиссия банка, если была
      total: amount + fee,         // сколько реально ушло со счёта
      baseAmount: amount,
      currency: currencyVal,
      date,
      time,
      card,
      counterCard: raw?.counterCard ? String(raw.counterCard).replace(/\D/g, '').slice(-4) : null,
      counterparty,
      ref,
      exchangedTo,
      balanceAfter: num(raw?.balanceAfter),
      description: typeof raw?.description === 'string' ? raw.description.trim().slice(0, 120) : '',
      category,
      possibleTransfer: raw?.possibleTransfer === true || selfTransfer,
      selfTransfer,
      needsCheck: raw?.needsCheck === true,
      isDebt: raw?.isDebt === true
    };
  };

  // Сверяет пачку распознанных операций с базой и между собой,
  // проставляя каждой статус: новая / дубль / перевод между своими картами.
  const buildReview = (items) => {
    const accepted = [];
    return items.map(item => {
      const dupInBase = transactions.some(tx => isSameTx(item, tx));
      const dupInBatch = accepted.some(x => isSameTx(item, x));
      const isDup = dupInBase || dupInBatch;
      if (!isDup) accepted.push(item);
      const status = isDup ? 'dup'
        : item.needsCheck ? 'check'
        : (item.selfTransfer || item.possibleTransfer) ? 'transfer'
        : 'new';
      return { ...item, status, selected: status === 'new' };
    });
  };

  // ===== ОФЛАЙН-РАЗБОР ТЕКСТА БАНКОВСКОГО SMS =====
  // Работает без интернета и без API-ключа: обычные регулярные выражения по формату
  // узбекских банков. Это основа автоматического приёма — текст может прийти
  // из буфера обмена, из «Поделиться» или из ссылки, которую пришлёт автоматизация.
  const SMS_EXPENSE_WORDS = /(spisanie|списание|pokupka|покупка|platezh|платеж|платёж|oplata|оплата|snyatie|снятие|otpravleno|отправлено|perevod s karty|перевод с карты|withdrawal|debit|xarid|yechib)/i;
  const SMS_INCOME_WORDS = /(popolnenie|пополнение|zachislenie|зачисление|postuplenie|поступление|vozvrat|возврат|refund|credit|zarplata|зарплата|tushum|kirim|perevod na kartu|перевод на карту)/i;

  // Приводит "1 633 421.97" / "501250,00" / "400 000" к числу
  const parseSmsNumber = (raw) => {
    if (!raw) return null;
    let v = String(raw).replace(/\s/g, '');
    const lastDot = v.lastIndexOf('.');
    const lastComma = v.lastIndexOf(',');
    const sep = Math.max(lastDot, lastComma);
    if (sep > -1 && /^\d{1,2}$/.test(v.slice(sep + 1))) {
      v = v.slice(0, sep).replace(/[.,]/g, '') + '.' + v.slice(sep + 1);
    } else {
      v = v.replace(/[.,]/g, '');
    }
    const n = parseFloat(v);
    return isFinite(n) ? n : null;
  };

  const parseBankSms = (text) => {
    if (!text || typeof text !== 'string') return [];
    const clean = text.replace(/\u00a0/g, ' ').replace(/\r/g, '');
    // Каждое новое сообщение начинается со слова-маркера — по ним и режем
    const marker = /(?=(?:spisanie|списание|pokupka|покупка|platezh|платеж|платёж|oplata|оплата|snyatie|снятие|popolnenie|пополнение|zachislenie|зачисление|postuplenie|поступление|vozvrat|возврат|perevod|перевод)\b)/gi;
    const chunks = clean.split(marker).map(x => x.trim()).filter(x => /summa|сумма/i.test(x));
    const source = chunks.length ? chunks : [clean];
    const out = [];
    source.forEach(chunk => {
      const amountM = chunk.match(/(?:summa|сумма)\s*[:=]?\s*([\d\s.,]+?)\s*([A-Z]{3}|сум|so'm|сўм)/i);
      if (!amountM) return;
      const amount = parseSmsNumber(amountM[1]);
      if (!amount || amount <= 0) return;
      let cur = amountM[2].toUpperCase();
      if (/СУМ|SO'M|СЎМ/i.test(amountM[2])) cur = 'UZS';
      const balM = chunk.match(/(?:balans|баланс)\s*[:=]?\s*([\d\s.,]+?)\s*([A-Z]{3}|сум|so'm)/i);
      const cardM = chunk.match(/(?:kart[aи]?|карт[аы]?)\s*[:\s]*[*x•]*\s*(\d{4})\b/i)
        || chunk.match(/\d{6}\*+(\d{4})\b/)
        || chunk.match(/[*x•]{2,}\s*(\d{4})\b/);
      const dtM = chunk.match(/(\d{2})[./-](\d{2})[./-](\d{2,4})[\s,]+(\d{1,2}):(\d{2})/);
      let date = null, time = null;
      if (dtM) {
        const yy = dtM[3].length === 2 ? '20' + dtM[3] : dtM[3];
        date = yy + '-' + dtM[2] + '-' + dtM[1];
        time = String(dtM[4]).padStart(2, '0') + ':' + dtM[5];
      } else {
        const dM = chunk.match(/(\d{2})[./-](\d{2})[./-](\d{2,4})/);
        if (dM) {
          const yy = dM[3].length === 2 ? '20' + dM[3] : dM[3];
          date = yy + '-' + dM[2] + '-' + dM[1];
        }
      }
      const isIncome = SMS_INCOME_WORDS.test(chunk) && !SMS_EXPENSE_WORDS.test(chunk);
      // Описание: то, что стоит до даты и до слова summa
      let desc = chunk.split(/(?:summa|сумма)/i)[0]
        .replace(/\s+/g, ' ')
        .replace(/^[^:]{0,24}:\s*/, '')
        .replace(/\d{2}[./-]\d{2}[./-]\d{2,4}.*$/, '')
        .replace(/(?:kart[aи]?|карт[аы]?)\s*[:\s]*[*x•\d]*/i, '')
        .replace(/[,.\s]+$/, '')
        .trim();
      if (desc.length > 60) desc = desc.slice(0, 60);
      out.push({
        type: isIncome ? 'income' : 'expense',
        amount,
        currency: cur,
        date,
        time,
        card: cardM ? cardM[1] : null,
        balanceAfter: balM ? parseSmsNumber(balM[1]) : null,
        description: desc,
        category: null,
        possibleTransfer: /uzcard to visa|visa to uzcard|p2p|перевод/i.test(chunk)
      });
    });
    return out;
  };

  // ===== ПОЧТОВЫЙ ЯЩИК: ЗАБРАТЬ НАКОПЛЕННЫЕ SMS С СЕРВЕРА =====
  // Сервер только передаёт текст. Разбор, сверка с базой и решение, что вносить,
  // как и раньше происходят здесь, на устройстве.
  const fetchInbox = async (silent) => {
    if (!inboxKey || inboxBusy) return;
    setInboxBusy(true);
    try {
      const resp = await fetch('/api/inbox', { headers: { 'x-wallet-key': inboxKey } });
      if (resp.status === 401) throw new Error('bad-key');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length === 0) {
        if (!silent) { setScanNotice(t.inboxEmpty); setTimeout(() => setScanNotice(''), 3000); }
        return;
      }
      const raw = items.flatMap(m => parseBankSms(m.text));
      const normalized = raw.map(x => normalizeScannedItem(x, catsFor)).filter(Boolean);
      if (normalized.length === 0) {
        if (!silent) { setScanError(t.inboxNoParse); setTimeout(() => setScanError(''), 6000); }
        return;
      }
      setPendingAckIds(items.map(m => m.id));
      setImportItems(buildReview(normalized));
      setActiveTab('dashboard');
    } catch (err) {
      if (!silent) {
        setScanError(err?.message === 'bad-key' ? t.inboxBadKey : t.inboxFail);
        setTimeout(() => setScanError(''), 6000);
      }
    } finally {
      setInboxBusy(false);
    }
  };

  // Подтверждаем серверу, что сообщения разобраны — иначе они придут снова
  const ackInbox = async (ids) => {
    const list = ids && ids.length ? ids : pendingAckIds;
    if (!inboxKey || list.length === 0) return;
    setPendingAckIds([]);
    try {
      await fetch('/api/inbox?action=ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wallet-key': inboxKey },
        body: JSON.stringify({ ids: list })
      });
    } catch (err) {
      // не страшно: сообщения просто придут ещё раз, а задвоение отсечёт сверка
    }
  };

  // Тихая проверка ящика при запуске приложения
  useEffect(() => {
    if (inboxKey) fetchInbox(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxKey]);

  // Разбор вставленного или полученного извне текста SMS
  const handleSmsText = (text) => {
    const raw = parseBankSms(text);
    const normalized = raw.map(r => normalizeScannedItem(r, catsFor)).filter(Boolean);
    if (normalized.length === 0) {
      setScanError(t.smsFail);
      setTimeout(() => setScanError(''), 6000);
      return false;
    }
    setImportItems(buildReview(normalized));
    setShowSmsBox(false);
    setSmsText('');
    setActiveTab('dashboard');
    return true;
  };

  // Приём текста извне: ?sms=... или ?text=... (Web Share Target, ярлык, автоматизация)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming = params.get('sms') || params.get('text');
    const quick = params.get('quick');
    if (incoming) {
      handleSmsText(incoming);
    } else if (quick === 'expense' || quick === 'income') {
      setFormType(quick);
      setEditingId(null);
      setShowForm(true);
    }
    if (incoming || quick) window.history.replaceState({}, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== РАСПОЗНАВАНИЕ ЧЕКА ИЛИ БАНКОВСКОЙ ВЫПИСКИ ЧЕРЕЗ GEMINI VISION =====
  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    if (!geminiKey) {
      setScanError(t.noKeyError);
      setShowSettings(true);
      return;
    }
    setScanning(true);
    setScanError('');
    setScanNotice('');
    try {
      const base64 = await compressImage(file);
      const knownCats = [...new Set([...catsFor('expense'), ...transactions.filter(tx => tx.type === 'expense').map(tx => tx.category)])].filter(Boolean);
      const knownCatsInc = [...new Set([...catsFor('income'), ...transactions.filter(tx => tx.type === 'income').map(tx => tx.category)])].filter(Boolean);
      const todayStr = new Date().toISOString().split('T')[0];
      const langWord = language === 'ru' ? 'русский' : language === 'uz' ? "o'zbek" : language === 'en' ? 'English' : 'Türkçe';

      const myCardsLine = myCards.length
        ? myCards.map(mc => '***' + mc.last4 + (mc.label ? ' (' + mc.label + ')' : '')).join(', ')
        : '(пользователь их не указал)';
      const ownerLine = ownerName ? ownerName : '(пользователь его не указал)';

      const statementPrompt = `Ты OCR финансового приложения. На изображении может быть ЛЮБОЙ из этих документов:

(A) бумажный кассовый чек — одна покупка;
(B) скриншот SMS от банка или список push-уведомлений — НЕСКОЛЬКО операций;
(C) экран истории/отчётов банковского приложения (Kapitalbank, Hamkorbank, Ipoteka, Aloqabank, Uzum, Anor, TBC) — несколько операций, иногда с раскрытой карточкой детали внизу;
(D) квитанция об одной операции: перевод с карты на карту, p2p, оплата услуги, покупка, обмен валюты;
(E) электронный чек платёжного сервиса (alif, Payme, Click, Uzum Bank) со строками «Сумма», «Комиссия», «Итого»;
(F) экран успешного платежа в приложении оператора связи или сервиса: крупная галочка, надпись «Платёж выполнен», «Успешно», «Готово», «Оплачено», сумма, дата и получатель (Mobiuz, Ucell, Beeline, Uzmobile, интернет-провайдер, коммунальные);
(G) скриншот переписки в мессенджере (Telegram, WhatsApp), где обсуждается или подтверждается перевод денег.

===== ОСОБО ПРО ЭКРАН УСПЕШНОГО ПЛАТЕЖА (F) =====
Такой экран почти всегда означает РАСХОД. Сумма написана самым крупным шрифтом.
Дата бывает в сокращённом виде без года: «17 сент. 08:29», «17 сентября», «Bugun 08:29» — год тогда берётся текущий (${todayStr.slice(0, 4)}).
Получателем считается название сервиса рядом с логотипом (например Mobiuz), а номер телефона под ним — это лицевой счёт, его можно дописать в description.
Категория для операторов связи и интернета — «${t.categoriesExp[3]}».
Слова «Фискальный чек», «Детали платежа», «Сохранить платёж», «Повтор», «Готово» — это кнопки интерфейса, а НЕ операции. Никогда не превращай их в отдельные записи.

===== ОСОБО ПРО ПЕРЕПИСКУ В МЕССЕНДЖЕРЕ (G) =====
Здесь нужна осторожность: в переписке много текста, который не является операцией.
Извлекай сумму ТОЛЬКО если выполнено одно из двух:
  1) в кадре видна карточка перевода от банка или платёжного сервиса — например фиолетовый или цветной блок со словами
     «Готово», «Перевели», «Отправлено», «Перевод выполнен», суммой и именем получателя с последними цифрами карты;
  2) сам пользователь пишет о совершённом переводе прошедшим временем:
     «перевёл», «отправил», «скинул», «вернул долг», «рассчитался», «оплатил», «pul tashladim», «o'tkazdim».
Направление определяй по тому, кто автор сообщения:
  - сообщения пользователя в Telegram и WhatsApp выровнены ПО ПРАВОМУ краю и обычно на цветном фоне (зелёном или синем);
  - сообщения собеседника — по левому краю, на сером или белом фоне.
  Пользователь написал, что перевёл или вернул → "expense".
  Собеседник написал, что перевёл пользователю, или пользователь пишет «мне вернули», «получил» → "income".
Имя получателя или отправителя ставь в поле counterparty, последние 4 цифры его карты — в toCard или fromCard.
Если из переписки видно, что это возврат или получение долга («долг», «qarz», «рассчитался», «осталось»), поставь "isDebt": true
и в description коротко напиши суть, например «возврат долга».
НЕ извлекай суммы из фраз о намерении или просьбе: «переведи», «скинь», «должен буду», «сколько с меня», «давай завтра» — это не операции.
Если сумма упомянута, но непонятно, состоялся ли перевод, всё равно верни операцию, но поставь "needsCheck": true —
пользователь увидит её отмеченной как требующую проверки и решит сам.

Определи тип и извлеки ВСЕ операции, которые реально видны.

===== ДАННЫЕ ПОЛЬЗОВАТЕЛЯ (для определения направления денег) =====
Имя владельца на картах: ${ownerLine}
Его собственные карты (последние 4 цифры): ${myCardsLine}

Правила направления:
- Списание с карты пользователя чужому человеку или магазину → type "expense".
- Зачисление на карту пользователя от кого-то другого → type "income".
- Если имя отправителя и имя получателя СОВПАДАЮТ (это один человек), либо обе карты принадлежат
  пользователю — это перемещение внутри своего кошелька: поставь "selfTransfer": true.
  Такая операция не является ни расходом, ни доходом, пользователь решит сам.
- Если своих карт и имени не указано — опирайся только на текст и ставь selfTransfer лишь при явном
  совпадении имён отправителя и получателя.

===== СЛОВА-МАРКЕРЫ =====
РАСХОД: "Spisanie", "Списание", "Pokupka", "Покупка", "Platezh", "Платёж", "Oplata", "Оплата",
"Snyatie", "Снятие", "Perevod s karty", "Перевод с карты", "Перевод на карту" (если отправитель — пользователь),
"p2p перевод", "Otpravleno", "Withdrawal", "Debit", "Xarid", "Yechib olindi", "Продается"/"Продаётся" при обмене валюты.
ПРИХОД: "Popolnenie", "Пополнение", "Zachislenie", "Зачисление", "Postuplenie", "Поступление",
"Vozvrat", "Возврат", "Refund", "Credit", "Zarplata", "Tushum", "Kirim", "Покупается" при обмене валюты (если это ваша вторая карта — см. selfTransfer).

===== РАЗБОР ПОЛЕЙ =====
- amount: сумма САМОЙ операции, без комиссии. "summa:501250.00 UZS" → 501250. "74 000 сум" → 74000. "22.4 USD" → 22.4.
  Точка и запятая внутри числа — десятичный разделитель; пробел — разделитель разрядов.
- fee: комиссия, если она выделена отдельной строкой ("Комиссия", "Komissiya", "Fee"). "Комиссия 333 сум" → 333.
  Если строка «Итого» = сумма + комиссия, всё равно возвращай amount = сумма, fee = комиссия. НЕ складывай их сам.
- currency: берётся из текста рядом с суммой — UZS ("сум", "so'm", "UZS"), USD ("$", "USD"), EUR, RUB. Не угадывай.
- date / time: форматы DD.MM.YYYY, DD.MM.YY, DD/MM/YYYY, "06.09.2026 12:08", "15.09.26 23:22", "16 сентября".
  Приводи к date "YYYY-MM-DD" и time "HH:MM". Двузначный год: 26 → 2026. Сегодня ${todayStr}, дата не может быть в будущем.
  Если на экране истории дата стоит заголовком группы ("16 сентября"), применяй её ко всем операциям под этим заголовком.
- card: карта, С КОТОРОЙ списано (или НА которую зачислено) у пользователя. Только последние 4 цифры.
  Маски бывают разные: "***4283", "karta ***4283", "561468******4283", "4278 32** **** 1515" → бери последние 4 цифры: "4283", "1515".
- counterCard: карта второй стороны (получатель при списании, отправитель при зачислении), тоже последние 4 цифры, иначе null.
- counterparty: имя второй стороны, как напечатано ("KAMERTSEL J.", "NEMATILLOYEVA S."), иначе "".
- ref: "Номер транзакции", "Номер операции", "Transaction ID", "Chek raqami" — строкой, как есть. Это уникальный
  идентификатор операции, он критически важен. Если его нет — null.
- balanceAfter: остаток на карте ПОСЛЕ операции ("balans:1633421.97 UZS"). Это НЕ сумма операции. Если нет — null.
- description: магазин, терминал, услуга, назначение — коротко, до 8 слов, без суммы и даты.
  "ANTHROPIC* CLAUDE SUB", "UZCARD TO VISA", "HAMKORBANK ATB", "OOO ATTO TOLOV".
- exchangedTo: только для обмена валюты. Если видно "Продается 14 USD" и "Покупается 164 780 UZS",
  то amount=14, currency="USD", exchangedTo="164 780 UZS". Иначе "".
- possibleTransfer: true для "UZCARD TO VISA", "VISA TO UZCARD", "p2p", переводов между картами, обмена валюты.

===== ТОЧНОСТЬ ВАЖНЕЕ ПОЛНОТЫ =====
- НЕ ВЫДУМЫВАЙ операции. Только то, у чего реально видна сумма.
- Обрезано краем экрана, сумма или дата не читаются — ПРОПУСТИ запись целиком.
- Одно и то же попало в кадр дважды (например, строка в списке и её же раскрытая карточка внизу экрана) — верни ОДИН раз,
  взяв более подробный вариант.
- Не путай "balans" с "summa", "Комиссия" с "Итого", сумму операции с остатком на счёте.
- Игнорируй рекламные баннеры, кнопки, номера телефонов поддержки и номера лицензий — это не операции.
- Каждая операция — отдельный объект, даже при одинаковых суммах: различай их по времени, номеру и остатку.

===== КАТЕГОРИЯ =====
Расходы выбирай из: ${JSON.stringify(knownCats)}
Доходы выбирай из: ${JSON.stringify(knownCatsInc)}
Смысловые ориентиры: АЗС, ATTO, метро, такси → транспорт; супермаркет, Korzinka, Makro → продукты;
свет, газ, вода → коммунальные; Ucell, Beeline, Uzmobile, интернет-провайдер → связь и интернет;
кафе, ресторан, доставка еды → развлечения или питание; онлайн-подписки и сервисы (ANTHROPIC, Google, Netflix) → подписки;
маркетплейсы, одежда, техника → покупки.
Если ни одна не подходит — предложи свою одним-двумя словами.

Все текстовые поля возвращай на языке: ${langWord}.

Верни СТРОГО JSON без markdown:
{"kind":"receipt" или "statement","items":[{"isDebt":false,"needsCheck":false,"type":"expense" или "income","amount":число,"fee":число или 0,"currency":"UZS","date":"YYYY-MM-DD","time":"HH:MM" или null,"card":"4283" или null,"counterCard":"1214" или null,"counterparty":"...","ref":"..." или null,"balanceAfter":число или null,"exchangedTo":"","description":"...","category":"...","possibleTransfer":false,"selfTransfer":false}]}`;

      const rawStatement = await callGeminiChain({
        contents: [{ parts: [
          { inline_data: { mime_type: 'image/jpeg', data: base64 } },
          { text: statementPrompt }
        ]}],
        generationConfig: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: 'low' }
        }
      });
      let stText = String(rawStatement).trim();
      if (stText.startsWith('```')) stText = stText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      const stParsed = JSON.parse(stText);
      const rawItems = Array.isArray(stParsed?.items) ? stParsed.items : [];
      const fallbackCats = (type) => catsFor(type);
      const normalized = rawItems.map(r => normalizeScannedItem(r, fallbackCats)).filter(Boolean);

      if (normalized.length === 0) throw new Error('no-amount-found');

      // Одна операция с бумажного чека — привычное поведение: сразу подставляем в форму
      if (normalized.length === 1 && stParsed?.kind !== 'statement') {
        const only = normalized[0];
        if (only.currency && currencies.includes(only.currency)) setCurrency(only.currency);
        const langCats = fallbackCats(only.type);
        const isKnown = langCats.includes(only.category);
        setFormType(only.type);
        setEditingId(null);
        setFormData({
          amount: String(only.total ?? only.amount),
          category: isKnown ? only.category : '__new__',
          customCategory: isKnown ? '' : only.category,
          description: only.description || '',
          date: only.date
        });
        setShowForm(true);
        setActiveTab('dashboard');
        setScanNotice(t.recognized);
        setTimeout(() => setScanNotice(''), 4000);
        return;
      }

      // Выписка: сверяем каждую операцию с уже внесёнными и между собой внутри пачки
      setImportItems(buildReview(normalized));
      setActiveTab('dashboard');
    } catch (err) {
      console.error('OCR error', err);
      const msg = err?.message || '';
      let userMsg = t.scanFailed;
      if (/api key|permission|unauthenticated|401|403/i.test(msg)) userMsg = t.scanFailedAuth;
      else if (/network|failed to fetch|load failed/i.test(msg)) userMsg = t.scanFailedNetwork;
      else if (msg === 'no-amount-found') userMsg = t.importNothing;
      setScanError(userMsg + (msg ? ' [' + msg.slice(0, 90) + ']' : ''));
      setTimeout(() => setScanError(''), 8000);
    } finally {
      setScanning(false);
    }
  };

  // Изменение одной строки в окне подтверждения импорта
  const updateImportItem = (idx, patch) => {
    setImportItems(prev => prev ? prev.map((it, i) => i === idx ? { ...it, ...patch } : it) : prev);
  };

  // Внесение отмеченных операций в базу
  const confirmImport = () => {
    const chosen = (importItems || []).filter(i => i.selected);
    if (chosen.length === 0) {
      setImportItems(null);
      ackInbox();
      setScanError(t.importNoneSelected);
      setTimeout(() => setScanError(''), 4000);
      return;
    }
    const base = Date.now();
    const newTx = chosen.map((i, idx) => {
      const parts = [i.description, i.counterparty].filter(Boolean);
      if (i.exchangedTo) parts.push(t.importExchange + ' ' + i.exchangedTo);
      if (i.fee > 0) parts.push(t.importFee + ' ' + i.fee.toLocaleString());
      return {
        id: base + idx,
        type: i.type,
        amount: i.total,          // списанная сумма с учётом комиссии
        baseAmount: i.baseAmount, // сумма без комиссии — нужна для сверки с SMS
        fee: i.fee || 0,
        category: i.category,
        description: [...new Set(parts)].join(' · ').slice(0, 160),
        currency: i.currency,
        date: i.date,
        time: i.time || null,
        card: i.card || null,
        counterCard: i.counterCard || null,
        ref: i.ref || null,
        balanceAfter: i.balanceAfter ?? null,
        source: 'import'
      };
    });
    const unknownCurrencies = [...new Set(newTx.map(x => x.currency))].filter(cur => !currencies.includes(cur));
    if (unknownCurrencies.length) setCurrencies([...currencies, ...unknownCurrencies]);
    // Новые категории из квитанций запоминаем, чтобы они были под рукой при ручном вводе
    chosen.forEach(i => { if (i.category) addCategory(i.type, i.category); });
    setTransactions([...transactions, ...newTx]);
    setImportItems(null);
    ackInbox();
    const hasOtherCurrency = newTx.some(x => x.currency !== currency);
    setScanNotice(t.importAdded + ': ' + newTx.length + (hasOtherCurrency ? '. ' + t.importOtherCurrency : ''));
    setTimeout(() => setScanNotice(''), hasOtherCurrency ? 9000 : 4000);
  };

  // ===== ГОЛОСОВОЙ ВВОД =====
  const startVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setScanError(t.voiceNotSupported);
      setTimeout(() => setScanError(''), 5000);
      return;
    }
    if (!geminiKey) {
      setScanError(t.noKeyError);
      setShowSettings(true);
      setTimeout(() => setScanError(''), 5000);
      return;
    }
    const langMap = { ru: 'ru-RU', uz: 'uz-UZ', en: 'en-US', tr: 'tr-TR' };
    const rec = new SR();
    rec.lang = langMap[language] || 'ru-RU';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => { setListening(true); setScanError(''); setScanNotice(''); };
    rec.onend = () => setListening(false);
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setScanError(t.micDenied);
      else if (e.error === 'no-speech') setScanError(t.noSpeech);
      else setScanError(t.voiceParseError);
      setTimeout(() => setScanError(''), 5000);
    };
    rec.onresult = async (e) => {
      const text = e.results?.[0]?.[0]?.transcript;
      setListening(false);
      if (text) await parseVoiceText(text);
    };
    try { rec.start(); } catch (err) {
      setListening(false);
      setScanError(t.voiceParseError);
      setTimeout(() => setScanError(''), 5000);
    }
  };

  const parseVoiceText = async (text) => {
    setScanning(true);
    try {
      const knownCats = [...new Set([...catsFor('income'), ...catsFor('expense'), ...transactions.map(tx => tx.category)])].filter(Boolean);
      const today = new Date().toISOString().split('T')[0];
      const prompt = `Ты парсер фраз финансового приложения. Разбери фразу пользователя.

Определи и верни СТРОГО JSON без markdown:
{
  "type": "income" (для приход/доход/зарплата/получил/фриланс) или "expense" (для расход/потратил/трата/купил/оплатил),
  "amount": число без разделителей (примеры нормализации: "500 тысяч" → 500000, "2 миллиона" → 2000000, "полмиллиона" → 500000, "500к" → 500000, "5 млн" → 5000000),
  "currency": "UZS" (сум/сумов/uzs/so'm), "USD" (долларов/долл/$/usd), "EUR" (евро/€/eur), "RUB" (рублей/руб/rub) или null если не указана,
  "date": "YYYY-MM-DD" или null. Правила: "сегодня"→сегодня, "вчера"→вчера, "позавчера"→позавчера, "7 июля" или "седьмого июля" → ближайшая прошлая или сегодняшняя дата с этим числом/месяцем, "в понедельник"→ближайший прошлый понедельник. null если дата не упомянута,
  "category": одна категория из списка ${JSON.stringify(knownCats)} если упомянута в фразе, иначе null,
  "description": остаток фразы после извлечения всех полей выше, или null если только тип и сумма
}

Сегодняшняя дата: ${today}
Фраза: "${text.replace(/"/g, '\\"')}"`;

      const raw = await callTextWithFallback(
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        },
        'Ты парсер фраз финансового приложения. Отвечай строго в формате JSON без markdown.',
        prompt,
        true
      );
      let jsonText = String(raw).trim();
      if (jsonText.startsWith('```')) jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(jsonText);
      const amount = typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount);
      if (!amount || isNaN(amount)) throw new Error('no-amount-found');
      const txType = parsed.type === 'income' ? 'income' : 'expense';
      const date = parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : new Date().toISOString().split('T')[0];
      if (parsed.currency && currencies.includes(parsed.currency)) setCurrency(parsed.currency);
      const langCats = catsFor(txType);
      let categoryValue = '';
      let customCategoryValue = '';
      if (parsed.category && langCats.includes(parsed.category)) {
        categoryValue = parsed.category;
      } else if (parsed.category) {
        categoryValue = '__new__';
        customCategoryValue = parsed.category;
      }
      setFormType(txType);
      setEditingId(null);
      setFormData({
        amount: String(amount),
        category: categoryValue,
        customCategory: customCategoryValue,
        description: parsed.description || '',
        date
      });
      setShowForm(true);
      setActiveTab('dashboard');
      setScanNotice(t.recognized);
      setTimeout(() => setScanNotice(''), 4000);
    } catch (err) {
      console.error('Voice parse error', err);
      const msg = err?.message || '';
      let userMsg = t.voiceParseError;
      if (/api key|permission|unauthenticated|401|403/i.test(msg)) userMsg = t.scanFailedAuth;
      else if (/network|failed to fetch|load failed/i.test(msg)) userMsg = t.scanFailedNetwork;
      setScanError(userMsg + (msg ? ' [' + msg.slice(0, 90) + ']' : ''));
      setTimeout(() => setScanError(''), 8000);
    } finally {
      setScanning(false);
    }
  };

  // ===== AI-ЧАТ =====
  const sendChatMessage = async (text) => {
    const messageText = (text ?? chatInput).trim();
    if (!messageText || chatLoading) return;
    if (!geminiKey) {
      setShowSettings(true);
      alert(t.noKeyError);
      return;
    }
    const userMsg = { role: 'user', content: messageText, timestamp: Date.now() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      const langNames = { ru: 'русский', uz: "o'zbek (latin)", en: 'English', tr: 'Türkçe' };
      const systemInstruction = `Ты финансовый и налоговый помощник в мобильном приложении Wallet для пользователей из Узбекистана.

Твоя специализация:
1. Налоговое законодательство Узбекистана (НК РУз): НДФЛ, налог на прибыль, НДС, ЕНП, единый налоговый платёж для ИП, самозанятость, БРВ
2. Бухгалтерский учёт (НСБУ, ПБУ, МСФО): основные средства, амортизация, отчётность в ГНК
3. Трудовое законодательство (ТК РУз): увольнения, отпуска, компенсации, оформление сотрудников
4. Банковская сфера Узбекистана: валютные операции, эквайринг, депозиты, кредиты, лимиты
5. Личные финансы: бюджетирование, инвестиции, сбережения, финансовое планирование
6. Валютные операции и курсы ЦБ РУз

Правила ответов:
- Отвечай кратко и по делу (2-4 абзаца обычно достаточно)
- Используй актуальные ставки, лимиты, размер БРВ (Базовая расчётная величина) когда это релевантно
- Ссылайся на конкретные статьи НК РУз, ТК РУз, ГК РУз когда возможно
- Если не уверен в конкретной норме или ставке — так и говори, лучше сказать "уточните в ГНК" чем выдумать
- В сложных или пограничных вопросах рекомендуй обратиться к юристу или бухгалтеру
- Не давай юридически обязывающих советов
- Пиши на языке: ${langNames[language]}
- Не используй markdown разметку (никаких **жирный** и *списков*), пиши как обычный текст с переносами строк

Стиль: как опытный коллега-финансист, дружелюбно, структурированно, без лишней воды.`;

      let finalSystem = systemInstruction;
      if (chatUseFinData && transactions.length > 0) {
        const catExpense = {};
        const catIncome = {};
        const recent = transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100);
        recent.forEach(tx => {
          const bucket = tx.type === 'income' ? catIncome : catExpense;
          const key = tx.category + ' (' + tx.currency + ')';
          bucket[key] = (bucket[key] || 0) + tx.amount;
        });
        const summary = `\n\nФинансовые данные пользователя (последние 100 операций):
- Всего операций: ${recent.length}
- Валюты: ${[...new Set(recent.map(t => t.currency))].join(', ')}
- Текущая выбранная валюта: ${currency}

Доходы по категориям:
${Object.entries(catIncome).map(([k, v]) => '- ' + k + ': ' + v.toLocaleString()).join('\n') || '(нет)'}

Расходы по категориям:
${Object.entries(catExpense).map(([k, v]) => '- ' + k + ': ' + v.toLocaleString()).join('\n') || '(нет)'}`;
        finalSystem += summary;
      }

      // Ограничиваем контекст последними 12 сообщениями чтобы не разрастался
      const historyForApi = newMessages.slice(-12).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      let raw;
      try {
        raw = await callGeminiChain({
          systemInstruction: { parts: [{ text: finalSystem }] },
          contents: historyForApi,
          generationConfig: { thinkingConfig: { thinkingLevel: 'low' } }
        });
      } catch (geminiErr) {
        // Groq и OpenRouter используют одинаковый (OpenAI-совместимый) формат сообщений
        const openAiMessages = newMessages.slice(-12).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        }));
        const tryOpenAiCompatible = async (url, key, model, extraHeaders) => {
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key, ...(extraHeaders || {}) },
            body: JSON.stringify({
              model,
              messages: [{ role: 'system', content: finalSystem }, ...openAiMessages],
              temperature: 0.5
            })
          });
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          const respData = await resp.json();
          const text = respData?.choices?.[0]?.message?.content;
          if (!text) throw new Error('empty-response');
          return text;
        };
        if (groqKey) {
          try {
            raw = await tryOpenAiCompatible('https://api.groq.com/openai/v1/chat/completions', groqKey, 'llama-3.3-70b-versatile');
          } catch (groqErr) {
            if (orKey) {
              raw = await tryOpenAiCompatible(
                'https://openrouter.ai/api/v1/chat/completions',
                orKey,
                'meta-llama/llama-3.3-70b-instruct:free',
                { 'HTTP-Referer': 'https://pva-finance.vercel.app/', 'X-Title': 'Wallet' }
              );
            } else {
              throw geminiErr;
            }
          }
        } else if (orKey) {
          raw = await tryOpenAiCompatible(
            'https://openrouter.ai/api/v1/chat/completions',
            orKey,
            'meta-llama/llama-3.3-70b-instruct:free',
            { 'HTTP-Referer': 'https://pva-finance.vercel.app/', 'X-Title': 'Wallet' }
          );
        } else {
          throw geminiErr;
        }
      }
      const aiMsg = { role: 'model', content: raw.trim(), timestamp: Date.now() };
      const finalMessages = [...newMessages, aiMsg];
      setChatMessages(finalMessages);
      try { localStorage.setItem('walletChat', JSON.stringify(finalMessages.slice(-40))); } catch (e) {}
    } catch (err) {
      console.error('Chat error', err);
      const errorMsg = { role: 'model', content: '⚠️ ' + (err.message || 'Ошибка соединения') + '. Попробуй ещё раз.', timestamp: Date.now(), isError: true };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const clearChat = () => {
    if (chatMessages.length === 0) return;
    if (window.confirm(t.chatConfirmClear)) {
      setChatMessages([]);
      try { localStorage.removeItem('walletChat'); } catch (e) {}
    }
  };

  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (chatEndRef.current && activeTab === 'assistant') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, chatLoading, activeTab]);

  // ===== AI-АНАЛИЗ МЕСЯЦА =====
  const runAiAnalysis = async () => {
    if (!geminiKey) {
      setAiAnalysisError(t.noKeyError);
      setShowSettings(true);
      setTimeout(() => setAiAnalysisError(''), 5000);
      return;
    }
    if (periodTransactions.length < 3) {
      setAiAnalysisError(t.aiAnalysisNoData);
      setTimeout(() => setAiAnalysisError(''), 5000);
      return;
    }
    setAiExpanded(true);
    setAiAnalysisLoading(true);
    setAiAnalysisError('');
    try {
      // Собираем данные текущего периода
      const catIncome = {};
      const catExpense = {};
      periodTransactions.forEach(tx => {
        const bucket = tx.type === 'income' ? catIncome : catExpense;
        if (!bucket[tx.category]) bucket[tx.category] = { total: 0, count: 0, top: 0 };
        bucket[tx.category].total += tx.amount;
        bucket[tx.category].count += 1;
        if (tx.amount > bucket[tx.category].top) bucket[tx.category].top = tx.amount;
      });
      const fmtCat = (obj) => Object.entries(obj)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([name, v]) => `- ${name}: ${v.total.toLocaleString()} ${currency} (${v.count} операций, крупнейшая ${v.top.toLocaleString()})`)
        .join('\n');
      // Прошлые периоды для сравнения (последние 3 месяца)
      const now = new Date();
      const monthsData = [];
      for (let i = 1; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        const totals = monthlySummary[key];
        if (totals && (totals.income > 0 || totals.expense > 0)) {
          monthsData.push(`- ${formatMonthLabel(key + '-01')}: доход ${totals.income.toLocaleString()}, расход ${totals.expense.toLocaleString()}`);
        }
      }
      const langNames = { ru: 'русский', uz: "o'zbek (latin)", en: 'English', tr: 'Türkçe' };
      const prompt = `Ты финансовый советник в мобильном приложении Wallet. Проанализируй траты пользователя из Узбекистана.

Валюта отчёта: ${currency}
Период: ${periodLabel}
Всего операций: ${periodTransactions.length}
Общий доход: ${income.toLocaleString()} ${currency}
Общий расход: ${expense.toLocaleString()} ${currency}
Сальдо: ${balance.toLocaleString()} ${currency}

Расходы по категориям за период:
${fmtCat(catExpense) || '(нет расходов)'}

Доходы по категориям за период:
${fmtCat(catIncome) || '(нет доходов)'}

Данные за прошлые месяцы для сравнения:
${monthsData.join('\n') || '(нет исторических данных)'}

Верни СТРОГО JSON без markdown в формате:
{
  "main": "2-3 предложения о том что заметил в тратах (топ-статья, необычное распределение и т.п.)",
  "trends": "2-3 предложения о трендах и сравнении с прошлыми периодами (если есть данные). Если данных мало — оцени текущий период без сравнений.",
  "advice": "1-2 конкретных практических совета исходя из паттернов расходов. Не общие фразы про 'экономь больше' — а конкретика по данным пользователя."
}

Стиль: дружелюбно-деловой, без нравоучений и общих фраз. Пиши как опытный финансист-друг. Язык ответа: ${langNames[language]}.`;

      const raw = await callTextWithFallback(
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4
          }
        },
        'Ты финансовый советник. Отвечай строго в формате JSON без markdown.',
        prompt,
        true
      );
      let jsonText = String(raw).trim();
      if (jsonText.startsWith('```')) jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(jsonText);
      if (!parsed.main && !parsed.trends && !parsed.advice) throw new Error('no-content');
      setAiAnalysis(parsed);
      setAiAnalysisPeriod(dashboardPeriod + '|' + periodLabel);
      try {
        localStorage.setItem('walletAiAnalysis', JSON.stringify({ analysis: parsed, period: dashboardPeriod + '|' + periodLabel }));
      } catch (e) {}
    } catch (err) {
      console.error('AI analysis error', err);
      const msg = err?.message || '';
      let userMsg = t.aiAnalysisFailed;
      if (/api key|permission|unauthenticated|401|403/i.test(msg)) userMsg = t.scanFailedAuth;
      else if (/network|failed to fetch|load failed/i.test(msg)) userMsg = t.scanFailedNetwork;
      setAiAnalysisError(userMsg + (msg ? ' [' + msg.slice(0, 90) + ']' : ''));
      setTimeout(() => setAiAnalysisError(''), 8000);
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const saveGeminiKey = () => {
    const val = tempKey.trim();
    setGeminiKey(val);
    if (val) localStorage.setItem('walletGeminiKey', val);
    else localStorage.removeItem('walletGeminiKey');
    const groqVal = tempGroqKey.trim();
    setGroqKey(groqVal);
    if (groqVal) localStorage.setItem('walletGroqKey', groqVal);
    else localStorage.removeItem('walletGroqKey');
    const inbVal = tempInboxKey.trim();
    setInboxKey(inbVal);
    if (inbVal) localStorage.setItem('walletInboxKey', inbVal);
    else localStorage.removeItem('walletInboxKey');
    const orVal = tempOrKey.trim();
    setOrKey(orVal);
    if (orVal) localStorage.setItem('walletOrKey', orVal);
    else localStorage.removeItem('walletOrKey');
    setShowSettings(false);
    setScanError('');
    setScanNotice(t.keySaved);
    setTimeout(() => setScanNotice(''), 2500);
  };

  // ===== ВЫГРУЗКА ОТВЕТОВ АССИСТЕНТА =====
  // Собирает текст анализа или диалога в один документ.
  const aiAnalysisToText = () => {
    if (!aiAnalysis) return '';
    const parts = [];
    if (aiAnalysis.main) parts.push(t.aiSectionMain + '\n' + aiAnalysis.main);
    if (aiAnalysis.trends) parts.push(t.aiSectionTrends + '\n' + aiAnalysis.trends);
    if (Array.isArray(aiAnalysis.advice) && aiAnalysis.advice.length) {
      parts.push(t.aiSectionAdvice + '\n' + aiAnalysis.advice.map((a, i) => (i + 1) + '. ' + a).join('\n'));
    }
    if (aiAnalysis.warning) parts.push(t.aiSectionWarning + '\n' + aiAnalysis.warning);
    return parts.join('\n\n');
  };

  const chatToText = () => chatMessages
    .map(m => (m.role === 'user' ? '— ' : '') + m.content)
    .join('\n\n');

  // Печатная страница: открывается в новой вкладке и сразу вызывает печать,
  // где в системном окне можно выбрать «Сохранить в PDF»
  const aiToPdf = (title, body) => {
    const esc = (x) => String(x).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
      <style>
        body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; margin: 28px; color: #1B2845; line-height: 1.6; }
        h1 { font-size: 19px; margin: 0 0 4px; }
        .meta { font-size: 12px; color: #666; margin-bottom: 18px; }
        pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 14px; margin: 0; }
        .noprint { margin-top: 24px; }
        @media print { .noprint { display: none; } }
      </style></head><body>
      <h1>${esc(title)}</h1>
      <div class="meta">Wallet · ${esc(new Date().toLocaleDateString(language === 'en' ? 'en-GB' : language))} · ${esc(periodLabel)}</div>
      <pre>${esc(body)}</pre>
      <div class="noprint"><button onclick="window.print()">${esc(t.aiExportPdf)}</button></div>
      <script>window.onload = () => setTimeout(() => window.print(), 400);</script>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) { setShareNotice(t.aiShareFail); setTimeout(() => setShareNotice(''), 4000); return; }
    w.document.write(html);
    w.document.close();
  };

  // Отправка текстом: системное меню «Поделиться», а если его нет — буфер обмена
  const aiShareText = async (title, body) => {
    const payload = title + '\n\n' + body;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: payload });
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(payload);
      setShareNotice(t.aiCopied);
    } catch {
      setShareNotice(t.aiShareFail);
    }
    setTimeout(() => setShareNotice(''), 4000);
  };

  const exportExcel = () => {
    const rows = reportData.map(tx => ({
      [t.date]: tx.date,
      [t.typeLabel]: tx.type === 'income' ? t.income : t.expense,
      [t.category]: tx.category,
      [t.description]: tx.description || '',
      [t.amount]: tx.amount,
      'Валюта': tx.currency,
      [t.importCard]: tx.card ? '***' + tx.card : ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Wallet');
    XLSX.writeFile(wb, 'wallet-report.xlsx');
  };

  // ===== ПОДЕЛИТЬСЯ ОТЧЁТОМ ЧЕРЕЗ WEB SHARE API =====
  const shareReport = async () => {
    setShareNotice('');
    // Сгенерировать Excel в памяти
    const rows = reportData.map(tx => ({
      [t.date]: tx.date,
      [t.typeLabel]: tx.type === 'income' ? t.income : t.expense,
      [t.category]: tx.category,
      [t.description]: tx.description || '',
      [t.amount]: tx.amount,
      'Валюта': tx.currency,
      [t.importCard]: tx.card ? '***' + tx.card : ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Wallet');
    const arr = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = 'wallet-report-' + dateStr + '.xlsx';
    const file = new File([blob], filename, { type: blob.type });

    // Fallback — скачать файл + показать инструкцию
    const downloadWithHelp = () => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setShareNotice(t.shareNotSupported);
      setTimeout(() => setShareNotice(''), 15000);
    };

    // Пробуем через Web Share API
    if (navigator.share) {
      try {
        if (navigator.canShare && !navigator.canShare({ files: [file] })) {
          downloadWithHelp();
          return;
        }
        await navigator.share({
          files: [file],
          title: t.shareTitle,
          text: t.shareText
        });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // пользователь отменил
        console.warn('Share API failed, downloading instead:', err);
        downloadWithHelp();
        return;
      }
    }
    // Web Share вообще не поддерживается
    downloadWithHelp();
  };

  // ===== ЭКСПОРТ PDF ЧЕРЕЗ ПЕЧАТЬ БРАУЗЕРА (кириллица работает всегда) =====
  const exportPDF = () => {
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
    const balance = reportIncome - reportExpense;
    const rows = reportData.map(tx => `
      <tr>
        <td>${esc(tx.date)}</td>
        <td>${esc(tx.type === 'income' ? t.income : t.expense)}</td>
        <td>${esc(tx.category)}</td>
        <td>${esc(tx.description || '')}</td>
        <td class="num" style="color:${tx.type === 'income' ? '#1E5C3A' : '#8B2020'};font-weight:600">
          ${tx.type === 'income' ? '+' : '−'}${tx.amount.toLocaleString()} ${esc(tx.currency)}
        </td>
      </tr>
    `).join('');

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Wallet — ${esc(t.reportTitle)}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', 'Helvetica Neue', Roboto, Arial, sans-serif; color: #1B2845; margin: 0; padding: 28px; }
        h1 { font-size: 22px; margin: 0 0 4px 0; }
        .sub { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
        .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
        .kpi { padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .kpi-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .kpi-value { font-size: 16px; font-weight: 600; margin-top: 4px; }
        .kpi.inc .kpi-value, .kpi.inc .kpi-label { color: #1E5C3A; }
        .kpi.exp .kpi-value, .kpi.exp .kpi-label { color: #8B2020; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1B2845; color: white; padding: 9px 10px; text-align: left; font-size: 11px; font-weight: 600; }
        td { padding: 8px 10px; border-bottom: 1px solid #eef0f2; font-size: 12px; }
        tr:nth-child(even) td { background: #fafbfc; }
        .num { text-align: right; white-space: nowrap; }
        .footer { margin-top: 22px; color: #9ca3af; font-size: 10px; text-align: right; }
        .noprint { position: fixed; top: 10px; right: 10px; }
        .noprint button { padding: 8px 14px; border: 1px solid #1B2845; background: #1B2845; color: white; border-radius: 6px; cursor: pointer; font-size: 13px; }
        @media print { .noprint { display: none; } body { padding: 15px; } .kpis { grid-template-columns: repeat(4, 1fr); } }
      </style></head><body>
      <div class="noprint"><button onclick="window.print()">${esc(t.exportPDF)}</button></div>
      <h1>Wallet — ${esc(t.reportTitle)}</h1>
      <div class="sub">${filterFrom ? esc(t.dateFrom)+': '+esc(filterFrom) : ''} ${filterTo ? '&nbsp;&nbsp;'+esc(t.dateTo)+': '+esc(filterTo) : ''} &nbsp;·&nbsp; ${esc(currency)}</div>
      <div class="kpis">
        <div class="kpi inc"><div class="kpi-label">${esc(t.totalIncome)}</div><div class="kpi-value">${reportIncome.toLocaleString()} ${esc(currency)}</div></div>
        <div class="kpi exp"><div class="kpi-label">${esc(t.totalExpense)}</div><div class="kpi-value">${reportExpense.toLocaleString()} ${esc(currency)}</div></div>
        <div class="kpi"><div class="kpi-label">${esc(t.totalBalance)}</div><div class="kpi-value">${balance.toLocaleString()} ${esc(currency)}</div></div>
        <div class="kpi"><div class="kpi-label">${esc(t.operations)}</div><div class="kpi-value">${reportData.length}</div></div>
      </div>
      <table>
        <thead><tr>
          <th>${esc(t.date)}</th><th>${esc(t.typeLabel)}</th><th>${esc(t.category)}</th><th>${esc(t.description)}</th><th class="num">${esc(t.amount)}</th>
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:20px">${esc(t.noData)}</td></tr>`}</tbody>
      </table>
      <div class="footer">Wallet · ${new Date().toLocaleString()}</div>
      <script>window.onload = () => setTimeout(() => window.print(), 400);</script>
      </body></html>`;

    const w = window.open('', '_blank');
    if (!w) { alert(t.printHint); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  // Крупные числа в карточках: сами уменьшаются на узком экране и переносятся,
  // вместо того чтобы вылезать за границу карточки
  const statNumStyle = {
    fontSize: 'clamp(15px, 5vw, 19px)',
    fontWeight: 600,
    marginTop: '4px',
    overflowWrap: 'anywhere',
    lineHeight: 1.2
  };

  const aiActionBtn = { padding: '6px 11px', fontSize: '11px', border: '1px solid ' + c.border, borderRadius: '6px', backgroundColor: 'transparent', color: c.sec, cursor: 'pointer', whiteSpace: 'nowrap' };

  const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: c.bg, color: c.text, boxSizing: 'border-box', fontSize: '14px' };
  const chartTabStyle = (active) => ({ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid ' + c.border, backgroundColor: active ? c.saveBtn : c.card, color: active ? '#FFF' : c.text, cursor: 'pointer', fontWeight: active ? 500 : 400 });
  const tabStyle = (active) => ({ flex: 1, padding: '11px 4px', fontSize: '13px', border: 'none', borderRadius: '8px', backgroundColor: active ? c.tabActive : 'transparent', color: active ? c.tabText : c.sec, cursor: 'pointer', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' });
  const periodBtnStyle = (active) => ({ flex: 1, padding: '8px 6px', fontSize: '12px', border: '1px solid ' + c.border, borderRadius: '8px', backgroundColor: active ? c.tabActive : c.card, color: active ? c.tabText : c.text, cursor: 'pointer', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' });

  return (
    <div style={{ backgroundColor: c.bg, color: c.text, minHeight: '100vh', padding: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{t.appName}</h1>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ padding: '7px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: c.card, color: c.text, cursor: 'pointer', fontSize: '13px' }}>
              <option value="light">{t.light}</option>
              <option value="dark">{t.dark}</option>
              <option value="steel">{t.steel}</option>
              <option value="soft">{t.soft}</option>
            </select>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ padding: '7px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: c.card, color: c.text, cursor: 'pointer', fontSize: '13px' }}>
              <option value="ru">RU</option>
              <option value="uz">UZ</option>
              <option value="en">EN</option>
              <option value="tr">TR</option>
            </select>
            <select value={currency} onChange={(e) => { if (e.target.value === '__add__') setShowCurrencyInput(true); else setCurrency(e.target.value); }} style={{ padding: '7px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: c.card, color: c.text, cursor: 'pointer', fontSize: '13px' }}>
              {currencies.map(cur => <option key={cur} value={cur}>{cur}</option>)}
              <option value="__add__">{t.addCurrency}</option>
            </select>
            <button onClick={() => { setTempKey(geminiKey); setTempGroqKey(groqKey); setTempOrKey(orKey); setTempInboxKey(inboxKey); setShowSettings(!showSettings); }} title={t.settings} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: showSettings ? c.saveBtn : c.card, color: showSettings ? '#fff' : c.text, cursor: 'pointer', fontSize: '13px' }}>⚙️</button>
          </div>
        </div>

        {showSettings && (
          <div style={{ backgroundColor: c.card, padding: '16px', borderRadius: '12px', marginBottom: '14px', border: '1px solid ' + c.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px' }}>{t.settings}</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: c.sec, cursor: 'pointer', fontSize: '18px', padding: 0 }}>✕</button>
            </div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.apiKeyLabel}</label>
            <input type="text" value={tempKey} onChange={(e) => setTempKey(e.target.value)} placeholder={t.apiKeyPlaceholder} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', marginBottom: '8px' }} autoComplete="off" spellCheck="false" />
            <div style={{ fontSize: '11px', color: c.sec, marginBottom: '16px', lineHeight: '1.5' }}>
              {t.apiKeyHint} <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: c.saveBtn, textDecoration: 'underline' }}>{t.getKey}</a>
            </div>
            <div style={{ borderTop: '1px solid ' + c.border, paddingTop: '14px', marginBottom: '4px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.groqKeyLabel}</label>
              <input type="text" value={tempGroqKey} onChange={(e) => setTempGroqKey(e.target.value)} placeholder={t.groqKeyPlaceholder} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', marginBottom: '8px' }} autoComplete="off" spellCheck="false" />
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '12px', lineHeight: '1.5' }}>
                {t.groqKeyHint} <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ color: c.saveBtn, textDecoration: 'underline' }}>{t.getGroqKey}</a>
              </div>
            </div>
            <div style={{ borderTop: '1px solid ' + c.border, paddingTop: '14px', marginBottom: '4px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.orKeyLabel}</label>
              <input type="text" value={tempOrKey} onChange={(e) => setTempOrKey(e.target.value)} placeholder={t.orKeyPlaceholder} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', marginBottom: '8px' }} autoComplete="off" spellCheck="false" />
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '12px', lineHeight: '1.5' }}>
                {t.orKeyHint} <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener noreferrer" style={{ color: c.saveBtn, textDecoration: 'underline' }}>{t.getOrKey}</a>
              </div>
            </div>
            <div style={{ borderTop: '1px solid ' + c.border, paddingTop: '14px', marginTop: '14px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.ownerNameLabel}</label>
              <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder={t.ownerNamePlaceholder} style={{ ...inputStyle, marginBottom: '6px' }} autoComplete="off" />
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '14px', lineHeight: '1.5' }}>{t.ownerNameHint}</div>

              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.myCardsLabel}</label>
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '8px', lineHeight: '1.5' }}>{t.myCardsHint}</div>
              {myCards.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {myCards.map(mc => (
                    <span key={mc.last4} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 9px', fontSize: '12px', borderRadius: '8px', backgroundColor: c.bg, border: '1px solid ' + c.border }}>
                      ***{mc.last4}{mc.label ? ' · ' + mc.label : ''}
                      <button onClick={() => setMyCards(myCards.filter(x => x.last4 !== mc.last4))} style={{ background: 'none', border: 'none', color: c.sec, cursor: 'pointer', fontSize: '13px', padding: 0, lineHeight: 1 }}>✕</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                <input type="text" inputMode="numeric" value={newCardDigits} maxLength={4} onChange={(e) => setNewCardDigits(e.target.value.replace(/\D/g, ''))} placeholder={t.myCardsDigits} style={{ ...inputStyle, width: '92px', flex: '0 0 auto' }} />
                <input type="text" value={newCardLabel} onChange={(e) => setNewCardLabel(e.target.value)} placeholder={t.myCardsName} style={{ ...inputStyle, flex: 1 }} />
                <button
                  onClick={() => {
                    if (newCardDigits.length !== 4 || myCards.some(x => x.last4 === newCardDigits)) return;
                    setMyCards([...myCards, { last4: newCardDigits, label: newCardLabel.trim() }]);
                    setNewCardDigits(''); setNewCardLabel('');
                  }}
                  style={{ padding: '10px 14px', backgroundColor: c.saveBtn, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
                >{t.catAdd}</button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid ' + c.border, paddingTop: '14px', marginTop: '14px', marginBottom: '14px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '13px' }}>{t.catManage}</h4>
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '12px', lineHeight: '1.5' }}>{t.catManageHint}</div>

              {['expense', 'income'].map(kind => (
                <div key={kind} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: kind === 'income' ? c.incomeColor : c.expenseColor }}>
                      {kind === 'income' ? t.catIncomeTitle : t.catExpenseTitle}
                    </span>
                    {(kind === 'income' ? customCats.income : customCats.expense) && (
                      <button onClick={() => resetCategories(kind)} style={{ padding: '3px 9px', fontSize: '10px', border: '1px solid ' + c.border, borderRadius: '6px', backgroundColor: 'transparent', color: c.sec, cursor: 'pointer' }}>{t.catReset}</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {catsFor(kind).map(cat => (
                      <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 9px', fontSize: '12px', borderRadius: '8px', backgroundColor: c.bg, border: '1px solid ' + c.border }}>
                        <span
                          onClick={() => {
                            const next = window.prompt(t.catRenameTitle, cat);
                            if (next !== null) renameCategory(kind, cat, next);
                          }}
                          style={{ cursor: 'pointer' }}
                          title={t.catRenameTitle}
                        >{cat}</span>
                        <button
                          onClick={() => { if (window.confirm(t.catDeleteConfirm)) removeCategory(kind, cat); }}
                          style={{ background: 'none', border: 'none', color: c.sec, cursor: 'pointer', fontSize: '13px', padding: 0, lineHeight: 1 }}
                        >✕</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={newCatName[kind]}
                      onChange={(e) => setNewCatName({ ...newCatName, [kind]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (addCategory(kind, newCatName[kind])) setNewCatName({ ...newCatName, [kind]: '' }); } }}
                      placeholder={t.catAddPlaceholder}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      onClick={() => { if (addCategory(kind, newCatName[kind])) setNewCatName({ ...newCatName, [kind]: '' }); }}
                      style={{ padding: '10px 14px', backgroundColor: c.saveBtn, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
                    >{t.catAdd}</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid ' + c.border, paddingTop: '14px', marginTop: '14px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec, fontWeight: 600 }}>{t.inboxTitle}</label>
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '8px', lineHeight: '1.5' }}>{t.inboxHint}</div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', color: c.sec }}>{t.inboxKeyLabel}</label>
              <input
                type="text" value={tempInboxKey} onChange={(e) => setTempInboxKey(e.target.value)}
                placeholder={t.inboxKeyPlaceholder}
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', marginBottom: '8px' }}
                autoComplete="off" spellCheck="false"
              />
              <button
                onClick={() => fetchInbox(false)}
                disabled={!inboxKey || inboxBusy}
                style={{ width: '100%', padding: '10px', fontSize: '12px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: 'transparent', color: inboxKey ? c.saveBtn : c.sec, cursor: (inboxKey && !inboxBusy) ? 'pointer' : 'default', marginBottom: '8px' }}
              >
                {inboxBusy ? t.inboxChecking : '↻ ' + t.inboxCheck}
              </button>
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '4px', lineHeight: '1.5' }}>{t.inboxPrivacy}</div>
            </div>

            <div style={{ borderTop: '1px solid ' + c.border, paddingTop: '14px', marginTop: '14px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec, fontWeight: 600 }}>{t.backupTitle}</label>
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '10px', lineHeight: '1.5' }}>{t.backupHint}</div>
              <div style={{ fontSize: '11px', color: backupStale ? c.expenseColor : c.sec, marginBottom: '8px' }}>
                {t.backupLast}: {lastBackup || t.backupNever}
              </div>
              <input ref={backupInputRef} type="file" accept="application/json,.json" onChange={importBackup} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <button onClick={exportBackup} style={{ flex: 1, minWidth: '140px', padding: '10px', fontSize: '12px', borderRadius: '8px', border: 'none', backgroundColor: c.incomeColor, color: '#fff', cursor: 'pointer', fontWeight: 500 }}>⬇ {t.backupExport}</button>
                <button onClick={() => backupInputRef.current?.click()} style={{ flex: 1, minWidth: '140px', padding: '10px', fontSize: '12px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: 'transparent', color: c.text, cursor: 'pointer' }}>⬆ {t.backupImport}</button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid ' + c.border, paddingTop: '14px', marginTop: '14px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec, fontWeight: 600 }}>{t.ratesTitle}</label>
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '10px', lineHeight: '1.5' }}>{t.ratesHint}</div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', color: c.sec }}>{t.ratesBase}</label>
              <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }}>
                {currencies.map(cur => <option key={cur} value={cur}>{cur}</option>)}
              </select>
              {currencies.filter(cur => cur !== baseCurrency).map(cur => (
                <div key={cur} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                  <span style={{ fontSize: '12px', minWidth: '78px' }}>1 {cur} =</span>
                  <input
                    type="number" inputMode="decimal" step="any" min="0"
                    value={rates[cur] ?? ''}
                    onChange={(e) => setRates({ ...rates, [cur]: e.target.value })}
                    placeholder="0"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <span style={{ fontSize: '12px', minWidth: '42px', color: c.sec }}>{baseCurrency}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid ' + c.border, paddingTop: '14px', marginTop: '14px', marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec, fontWeight: 600 }}>{t.tagsManage}</label>
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '8px', lineHeight: '1.5' }}>{t.tagsHint}</div>
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {tags.map(tg => (
                    <span key={tg} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 9px', fontSize: '12px', borderRadius: '8px', backgroundColor: c.bg, border: '1px solid ' + c.border }}>
                      {tg}
                      <button onClick={() => setTags(tags.filter(x => x !== tg))} style={{ background: 'none', border: 'none', color: c.sec, cursor: 'pointer', fontSize: '13px', padding: 0, lineHeight: 1 }}>✕</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
                  placeholder={t.tagPlaceholder} style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    const v = newTagName.trim();
                    if (v && !tags.includes(v)) { setTags([...tags, v]); setNewTagName(''); }
                  }}
                />
                <button
                  onClick={() => { const v = newTagName.trim(); if (v && !tags.includes(v)) { setTags([...tags, v]); setNewTagName(''); } }}
                  style={{ padding: '10px 14px', fontSize: '12px', borderRadius: '8px', border: 'none', backgroundColor: c.saveBtn, color: '#fff', cursor: 'pointer' }}
                >{t.catAdd}</button>
              </div>
            </div>

            <button onClick={saveGeminiKey} style={{ width: '100%', padding: '10px', backgroundColor: c.saveBtn, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>{t.saveKey}</button>
          </div>
        )}

        {showCurrencyInput && (
          <div style={{ backgroundColor: c.card, padding: '14px', borderRadius: '10px', marginBottom: '14px', border: '1px solid ' + c.border, display: 'flex', gap: '8px' }}>
            <input type="text" value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)} placeholder={t.currencyPlaceholder} style={{ ...inputStyle, flex: 1 }} autoFocus maxLength={6} onKeyDown={(e) => e.key === 'Enter' && addCurrency()} />
            <button onClick={addCurrency} style={{ padding: '10px 16px', backgroundColor: c.saveBtn, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>{t.save}</button>
            <button onClick={() => setShowCurrencyInput(false)} style={{ padding: '10px 16px', backgroundColor: c.sec, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{t.cancel}</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '4px', backgroundColor: c.card, padding: '4px', borderRadius: '12px', border: '1px solid ' + c.border, marginBottom: '16px' }}>
          <button onClick={() => setActiveTab('dashboard')} style={tabStyle(activeTab === 'dashboard')}>{t.dashboard}</button>
          <button onClick={() => setActiveTab('report')} style={tabStyle(activeTab === 'report')}>{t.report}</button>
          <button onClick={() => setActiveTab('plans')} style={{ ...tabStyle(activeTab === 'plans'), position: 'relative' }}>
            {t.plans}
            {overdueCount > 0 && activeTab !== 'plans' && (
              <span style={{ position: 'absolute', top: '5px', right: '7px', minWidth: '16px', height: '16px', borderRadius: '8px', backgroundColor: c.expenseColor, color: '#fff', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {overdueCount}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('assistant')} style={tabStyle(activeTab === 'assistant')}>{t.assistant}</button>
        </div>

        {importItems && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ backgroundColor: c.bg, color: c.text, width: '100%', maxWidth: '640px', maxHeight: '92vh', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', border: '1px solid ' + c.border }}>

              <div style={{ padding: '14px 16px', borderBottom: '1px solid ' + c.border, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '15px' }}>{t.importTitle}</h3>
                  <div style={{ fontSize: '11px', color: c.sec, marginTop: '4px' }}>
                    {t.importFound}: <b>{importItems.length}</b>
                    {' · '}<span style={{ color: c.incomeColor }}>{t.importNew}: {importItems.filter(i => i.status === 'new').length}</span>
                    {importItems.some(i => i.status === 'dup') && <>{' · '}{t.importDup}: {importItems.filter(i => i.status === 'dup').length}</>}
                  </div>
                </div>
                <button onClick={() => { setImportItems(null); ackInbox(); }} style={{ background: 'none', border: 'none', color: c.sec, cursor: 'pointer', fontSize: '20px', padding: 0, lineHeight: 1 }}>✕</button>
              </div>

              <div style={{ padding: '10px 16px', borderBottom: '1px solid ' + c.border, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setImportItems(importItems.map(i => ({ ...i, selected: i.status === 'new' })))}
                  style={{ padding: '6px 11px', fontSize: '11px', borderRadius: '6px', border: '1px solid ' + c.border, backgroundColor: c.card, color: c.text, cursor: 'pointer' }}
                >{t.importSelectAllNew}</button>
                <button
                  onClick={() => setImportItems(importItems.map(i => ({ ...i, selected: false })))}
                  style={{ padding: '6px 11px', fontSize: '11px', borderRadius: '6px', border: '1px solid ' + c.border, backgroundColor: c.card, color: c.text, cursor: 'pointer' }}
                >{t.importClearAll}</button>
              </div>

              <div style={{ overflowY: 'auto', padding: '12px 14px', flex: 1 }}>
                {importItems.some(i => i.status === 'dup') && (
                  <div style={{ fontSize: '11px', color: c.sec, lineHeight: '1.5', marginBottom: '10px', padding: '8px 10px', borderRadius: '8px', backgroundColor: c.card, border: '1px solid ' + c.border }}>
                    {t.importDupHint}
                  </div>
                )}

                {importItems.map((it, idx) => {
                  const catOptions = [...new Set([...(it.type === 'income' ? t.categoriesInc : t.categoriesExp), it.category])];
                  const statusColor = it.status === 'new' ? c.incomeColor
                    : (it.status === 'transfer' || it.status === 'check') ? '#E67E22'
                    : c.sec;
                  const statusText = it.status === 'new' ? t.importNew
                    : it.status === 'check' ? t.importNeedsCheck
                    : it.status === 'transfer' ? (it.selfTransfer ? t.importSelfTransfer : t.importTransfer)
                    : t.importDup;
                  return (
                    <div key={idx} style={{
                      display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px',
                      padding: '10px 11px', borderRadius: '10px',
                      backgroundColor: c.card,
                      border: '1px solid ' + (it.selected ? c.saveBtn : c.border),
                      opacity: it.status === 'dup' && !it.selected ? 0.5 : 1
                    }}>
                      <input
                        type="checkbox"
                        checked={it.selected}
                        onChange={(e) => updateImportItem(idx, { selected: e.target.checked })}
                        style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '11px', color: c.sec }}>
                            {it.date}{it.time ? ' · ' + it.time : ''}{it.card ? ' · ' + t.importCard + ' ***' + it.card : ''}
                          </span>
                          <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: it.type === 'income' ? c.incomeColor : c.expenseColor }}>
                              {it.type === 'income' ? '+' : '−'}{(it.total ?? it.amount).toLocaleString()} {it.currency}
                            </span>
                            {it.fee > 0 && (
                              <span style={{ display: 'block', fontSize: '10px', color: c.sec, marginTop: '2px' }}>
                                {it.amount.toLocaleString()} + {t.importFee} {it.fee.toLocaleString()}
                              </span>
                            )}
                          </span>
                        </div>

                        {(it.description || it.counterparty) && (
                          <div style={{ fontSize: '12px', marginTop: '4px', wordBreak: 'break-word', lineHeight: '1.4' }}>
                            {[it.description, it.counterparty].filter(Boolean).join(' · ')}
                          </div>
                        )}

                        {it.exchangedTo && (
                          <div style={{ fontSize: '11px', marginTop: '3px', color: c.saveBtn }}>
                            ⇄ {t.importExchange} {it.exchangedTo}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '7px', flexWrap: 'wrap' }}>
                          <select
                            value={it.type}
                            onChange={(e) => {
                              const newType = e.target.value;
                              const list = newType === 'income' ? t.categoriesInc : t.categoriesExp;
                              const keepCat = list.includes(it.category) ? it.category : list[list.length - 1];
                              updateImportItem(idx, { type: newType, category: keepCat });
                            }}
                            style={{ padding: '4px 6px', fontSize: '11px', borderRadius: '6px', border: '1px solid ' + c.border, backgroundColor: c.bg, color: c.text, cursor: 'pointer' }}
                          >
                            <option value="expense">{t.expense}</option>
                            <option value="income">{t.income}</option>
                          </select>
                          <select
                            value={it.category}
                            onChange={(e) => updateImportItem(idx, { category: e.target.value })}
                            style={{ padding: '4px 6px', fontSize: '11px', borderRadius: '6px', border: '1px solid ' + c.border, backgroundColor: c.bg, color: c.text, cursor: 'pointer', maxWidth: '150px' }}
                          >
                            {catOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <span style={{ fontSize: '10px', color: statusColor, border: '1px solid ' + statusColor + '55', borderRadius: '10px', padding: '2px 8px' }}>
                            {statusText}
                          </span>
                        </div>

                        {(it.balanceAfter != null || it.ref) && (
                          <div style={{ fontSize: '10px', color: c.sec, marginTop: '5px', wordBreak: 'break-all' }}>
                            {it.balanceAfter != null && <>{t.importBalanceAfter}: {it.balanceAfter.toLocaleString()} {it.currency}</>}
                            {it.balanceAfter != null && it.ref && ' · '}
                            {it.ref && <>{t.importRef}: {it.ref.length > 22 ? it.ref.slice(0, 22) + '…' : it.ref}</>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: '12px 14px', borderTop: '1px solid ' + c.border, display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setImportItems(null); ackInbox(); }}
                  style={{ padding: '11px 16px', fontSize: '13px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: 'transparent', color: c.sec, cursor: 'pointer' }}
                >{t.cancel}</button>
                <button
                  onClick={confirmImport}
                  disabled={importItems.every(i => !i.selected)}
                  style={{ flex: 1, padding: '11px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', backgroundColor: c.saveBtn, color: '#fff', cursor: importItems.every(i => !i.selected) ? 'default' : 'pointer', opacity: importItems.every(i => !i.selected) ? 0.5 : 1 }}
                >
                  {t.importAdd} ({importItems.filter(i => i.selected).length})
                </button>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            {/* ===== ПЕРЕКЛЮЧАТЕЛЬ ПЕРИОДА ===== */}
            <div style={{ backgroundColor: c.card, padding: '10px', borderRadius: '12px', border: '1px solid ' + c.border, marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => setDashboardPeriod('today')} style={periodBtnStyle(dashboardPeriod === 'today')}>{t.periodToday}</button>
                <button onClick={() => setDashboardPeriod('week')} style={periodBtnStyle(dashboardPeriod === 'week')}>{t.periodWeek}</button>
                <button onClick={() => setDashboardPeriod('month')} style={periodBtnStyle(dashboardPeriod === 'month')}>{t.periodMonth}</button>
                <button onClick={() => setDashboardPeriod('year')} style={periodBtnStyle(dashboardPeriod === 'year')}>{t.periodYear}</button>
                <button onClick={() => setDashboardPeriod('all')} style={periodBtnStyle(dashboardPeriod === 'all')}>{t.periodAll}</button>
              </div>
              <div style={{ fontSize: '11px', color: c.sec, marginTop: '8px', textAlign: 'center' }}>
                {t.dataFor}: <span style={{ fontWeight: 600, color: c.text }}>{periodLabel}</span>
              </div>
            </div>

            {backupStale && (
              <div style={{ backgroundColor: c.card, border: '1px solid ' + c.expenseColor + '70', borderRadius: '12px', padding: '11px 14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', lineHeight: '1.45' }}>⚠️ {t.backupWarn}</span>
                <button onClick={exportBackup} style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px', border: 'none', backgroundColor: c.incomeColor, color: '#fff', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {t.backupExport}
                </button>
              </div>
            )}

            {recurringDue.length > 0 && (
              <div style={{ backgroundColor: c.card, border: '1px solid ' + c.saveBtn + '70', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>🔁 {t.recurDue}</div>
                {recurringDue.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '6px 0', flexWrap: 'wrap', borderTop: '1px solid ' + c.border }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '13px' }}>{r.category}{r.description ? ' · ' + r.description : ''}</div>
                      <div style={{ fontSize: '11px', color: c.sec }}>
                        {parseFloat(r.amount).toLocaleString()} {r.currency} · {t.recurEvery} {r.day} {t.recurDayShort}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => postRecurring(r)} style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px', border: 'none', backgroundColor: c.saveBtn, color: '#fff', cursor: 'pointer', fontWeight: 500 }}>{t.recurPost}</button>
                      <button onClick={() => skipRecurring(r)} style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid ' + c.border, backgroundColor: 'transparent', color: c.sec, cursor: 'pointer' }}>{t.recurSkip}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {attentionPlans.length > 0 && (
              <div style={{ backgroundColor: c.card, borderRadius: '12px', border: '1px solid ' + (overdueCount > 0 ? c.expenseColor + '80' : c.border), padding: '12px 14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{t.planRemindTitle}</span>
                  <button onClick={() => setActiveTab('plans')} style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid ' + c.border, backgroundColor: 'transparent', color: c.saveBtn, cursor: 'pointer' }}>
                    {t.planRemindOpen}
                  </button>
                </div>
                {attentionPlans.slice(0, 3).map(pl => {
                  const info = planDueInfo(pl);
                  const meta = planKindMeta(pl.kind);
                  return (
                    <div key={pl.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px', padding: '4px 0', fontSize: '12px' }}>
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {meta.icon} {[pl.what, pl.person].filter(Boolean).join(' · ')}
                      </span>
                      <span style={{ color: info.color, whiteSpace: 'nowrap', fontWeight: info.urgent ? 600 : 400, fontSize: '11px' }}>{info.text}</span>
                    </div>
                  );
                })}
                {attentionPlans.length > 3 && (
                  <div style={{ fontSize: '11px', color: c.sec, marginTop: '4px' }}>+{attentionPlans.length - 3}</div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: c.card, padding: '14px', borderRadius: '12px', border: '1px solid ' + c.border, minWidth: 0 }}>
                <div style={{ fontSize: '10px', color: c.sec, letterSpacing: '0.5px' }}>{t.balance}</div>
                <div style={{ ...statNumStyle, color: c.balanceColor }}>{balance.toLocaleString()} {currency}</div>
              </div>
              <div style={{ backgroundColor: c.card, padding: '14px', borderRadius: '12px', border: '1px solid ' + c.border, minWidth: 0 }}>
                <div style={{ fontSize: '10px', color: c.incomeColor, letterSpacing: '0.5px' }}>{t.income}</div>
                <div style={{ ...statNumStyle, color: c.incomeColor }}>{income.toLocaleString()} {currency}</div>
              </div>
              <div style={{ backgroundColor: c.card, padding: '14px', borderRadius: '12px', border: '1px solid ' + c.border, minWidth: 0 }}>
                <div style={{ fontSize: '10px', color: c.expenseColor, letterSpacing: '0.5px' }}>{t.expense}</div>
                <div style={{ ...statNumStyle, color: c.expenseColor }}>{expense.toLocaleString()} {currency}</div>
              </div>

              {hasCarryData && (
                <div
                  title={t.carryLabel + ' — ' + t.carryHint}
                  style={{
                    backgroundColor: c.carryColor + '12',
                    border: '1px solid ' + c.carryColor + '3A',
                    borderRadius: '12px',
                    padding: '11px 12px',
                    minWidth: 0,
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)'
                  }}
                >
                  <div style={{ fontSize: '10px', color: c.carryColor, letterSpacing: '0.5px', opacity: 0.85, lineHeight: 1.2 }}>{t.carryShort}</div>
                  <div style={{
                    fontSize: '13px', fontWeight: 500, marginTop: '2px',
                    overflowWrap: 'anywhere', lineHeight: 1.2, color: c.carryColor, opacity: 0.85
                  }}>
                    {carryOver >= 0 ? '+' : '−'}{Math.abs(carryOver).toLocaleString()}
                  </div>
                  <div style={{ marginTop: '7px', paddingTop: '7px', borderTop: '1px dashed ' + c.carryColor + '40' }}>
                    <div style={{ fontSize: '10px', color: c.carryColor, letterSpacing: '0.5px', lineHeight: 1.2, opacity: 0.85 }}>{t.withCarryShort}</div>
                    <div style={{
                      fontSize: '16px', fontWeight: 600, marginTop: '2px',
                      overflowWrap: 'anywhere', lineHeight: 1.2, color: c.carryColor
                    }}>
                      {balanceWithCarry.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <button onClick={() => { setFormType('income'); setEditingId(null); setShowForm(true); }} style={{ flex: 1, padding: '13px', backgroundColor: c.incomeColor, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>{t.addIncome}</button>
              <button onClick={() => { setFormType('expense'); setEditingId(null); setShowForm(true); }} style={{ flex: 1, padding: '13px', backgroundColor: c.expenseColor, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>{t.addExpense}</button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleReceiptUpload} style={{ display: 'none' }} />
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleReceiptUpload} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning || listening}
                style={{ flex: 1, padding: '13px', backgroundColor: c.saveBtn, color: 'white', border: 'none', borderRadius: '8px', cursor: (scanning || listening) ? 'wait' : 'pointer', fontWeight: 500, fontSize: '14px', opacity: (scanning || listening) ? 0.7 : 1 }}
              >
                {scanning && !listening ? '⏳ ' + t.scanning : t.receiptPhoto}
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={scanning || listening}
                title={t.fromGallery}
                aria-label={t.fromGallery}
                style={{ padding: '13px 18px', backgroundColor: c.card, color: c.text, border: '1px solid ' + c.border, borderRadius: '8px', cursor: (scanning || listening) ? 'wait' : 'pointer', fontSize: '18px', opacity: (scanning || listening) ? 0.7 : 1 }}
              >
                📎
              </button>
              <button
                onClick={startVoiceInput}
                disabled={scanning || listening}
                title={t.voiceInputTitle}
                aria-label={t.voiceInputTitle}
                style={{ padding: '13px 18px', backgroundColor: listening ? c.expenseColor : c.card, color: listening ? '#fff' : c.text, border: '1px solid ' + (listening ? c.expenseColor : c.border), borderRadius: '8px', cursor: (scanning || listening) ? 'wait' : 'pointer', fontSize: '18px', opacity: scanning ? 0.7 : 1, animation: listening ? 'pulse 1.2s ease-in-out infinite' : 'none' }}
              >
                {t.voiceInput}
              </button>
            </div>
            {(listening || (scanning && !fileInputRef.current?.files?.length)) && (
              <div style={{ textAlign: 'center', fontSize: '12px', color: c.sec, marginBottom: '12px' }}>
                {listening ? '🎙️ ' + t.voiceListening : '⏳ ' + t.voiceProcessing}
              </div>
            )}
            <div style={{ height: '6px' }}></div>

            {scanError && (
              <div style={{ backgroundColor: '#8B4548', color: '#fff', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                {scanError}
              </div>
            )}
            {scanNotice && (
              <div style={{ backgroundColor: c.incomeColor, color: '#fff', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                ✓ {scanNotice}
              </div>
            )}

            {showForm && (
              <div style={{ backgroundColor: c.card, padding: '18px', borderRadius: '12px', marginBottom: '16px', border: '1px solid ' + c.border }}>
                {editingId && <div style={{ marginBottom: '10px', fontSize: '13px', color: c.saveBtn, fontWeight: 500 }}>{t.editMode}</div>}
                <form onSubmit={submitTransaction}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.category}</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value, customCategory: '' })} style={inputStyle}>
                      <option value="">{t.selectCat}</option>
                      {cats.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                      <option value="__new__">{t.catNew}</option>
                    </select>
                  </div>
                  {isNewCat && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.catNewPlaceholder}</label>
                      <input type="text" value={formData.customCategory} onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })} placeholder={t.catAddPlaceholder} style={{ ...inputStyle, border: '1px solid ' + c.saveBtn }} autoFocus />
                      <div style={{ fontSize: '11px', color: c.sec, marginTop: '5px' }}>{t.catManageHint}</div>
                    </div>
                  )}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.amount}</label>
                    <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.description}</label>
                    <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={inputStyle} />
                  </div>
                  {tags.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.tagLabel}</label>
                      <select value={formData.tag} onChange={(e) => setFormData({ ...formData, tag: e.target.value })} style={inputStyle}>
                        <option value="">{t.tagNone}</option>
                        {tags.map(tg => <option key={tg} value={tg}>{tg}</option>)}
                      </select>
                    </div>
                  )}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.date}</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" style={{ flex: 1, padding: '11px', backgroundColor: c.saveBtn, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>{editingId ? t.update : t.save}</button>
                    <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} style={{ flex: 1, padding: '11px', backgroundColor: c.sec, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>{t.cancel}</button>
                  </div>
                </form>
              </div>
            )}

            {/* ===== ГРАФИК ===== */}
            {(chartData.length > 0 || lineData) && (
              <div style={{ backgroundColor: c.card, padding: '18px', borderRadius: '12px', marginBottom: '16px', border: '1px solid ' + c.border }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px' }}>
                    {chartType === 'line' ? t.chartDynamicsTitle : t.chartExpenseTitle}
                  </h3>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => setChartType('pie')} style={chartTabStyle(chartType === 'pie')}>{t.pieChart}</button>
                    <button onClick={() => setChartType('bar')} style={chartTabStyle(chartType === 'bar')}>{t.barChart}</button>
                    <button onClick={() => setChartType('line')} style={chartTabStyle(chartType === 'line')}>{t.lineChart}</button>
                  </div>
                </div>

                {chartType === 'pie' && pieData.length > 0 && (() => {
                  const RAD = Math.PI / 180;
                  const totalP = pieData.reduce((s, d) => s + d.value, 0) || 1;
                  let accP = 0;
                  const items = pieData.map((d) => {
                    const startPct = accP / totalP;
                    accP += d.value;
                    const endPct = accP / totalP;
                    const midDeg = 90 - ((startPct + endPct) / 2) * 360;
                    return { name: d.name, pct: d.value / totalP, midDeg };
                  });
                  const externals = items
                    .filter(it => it.pct >= 0.05 && it.pct < 0.15)
                    .map(it => {
                      const r = -it.midDeg * RAD;
                      return { ...it, cos: Math.cos(r), sin: Math.sin(r) };
                    });
                  externals.forEach(it => { it.isRight = it.cos >= 0; it.idealSin = it.sin; });
                  const minGap = 0.35;
                  const adjust = (list) => {
                    list.sort((a, b) => a.idealSin - b.idealSin);
                    let prev = -Infinity;
                    list.forEach(it => {
                      it.finalSin = Math.max(it.idealSin, prev + minGap);
                      prev = it.finalSin;
                    });
                    return list;
                  };
                  const posMap = {};
                  [...adjust(externals.filter(x => x.isRight)), ...adjust(externals.filter(x => !x.isRight))].forEach(it => { posMap[it.name] = it; });
                  return (
                    <>
                      <ResponsiveContainer width="100%" height={270}>
                        <PieChart margin={{ top: 15, bottom: 5, left: 0, right: 0 }}>
                          <Pie
                            data={pieData}
                            cx="50%" cy="50%"
                            outerRadius={70}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                              const strokeProps = { fill: '#fff', stroke: 'rgba(0,0,0,0.65)', strokeWidth: 2.8, paintOrder: 'stroke', textAnchor: 'middle', dominantBaseline: 'central', fontWeight: 600 };
                              const rad = -midAngle * RAD;
                              if (percent >= 0.15) {
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.62;
                                const x = cx + radius * Math.cos(rad);
                                const y = cy + radius * Math.sin(rad);
                                const maxLen = percent >= 0.30 ? 10 : 7;
                                const displayName = name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
                                return (
                                  <g>
                                    <text x={x} y={y - 7} {...strokeProps} fontSize={10}>{displayName}</text>
                                    <text x={x} y={y + 7} {...strokeProps} fontSize={11}>{`${(percent * 100).toFixed(0)}%`}</text>
                                  </g>
                                );
                              }
                              if (percent < 0.05) return null;
                              const it = posMap[name];
                              if (!it) return null;
                              const cos = Math.cos(rad), sin = Math.sin(rad);
                              const sx = cx + outerRadius * cos;
                              const sy = cy + outerRadius * sin;
                              const mx = cx + (outerRadius + 6) * cos;
                              const my = cy + (outerRadius + 6) * sin;
                              const ty = cy + (outerRadius + 20) * it.finalSin;
                              const tx = it.isRight ? cx + outerRadius + 18 : cx - outerRadius - 18;
                              const anchor = it.isRight ? 'start' : 'end';
                              const color = chartColors[pieData.findIndex(d => d.name === name) % chartColors.length];
                              const displayName = name.length > 6 ? name.slice(0, 5) + '…' : name;
                              return (
                                <g>
                                  <polyline points={`${sx},${sy} ${mx},${my} ${tx - (it.isRight ? 3 : -3)},${ty}`} fill="none" stroke={color} strokeWidth={1} />
                                  <circle cx={sx} cy={sy} r={2} fill={color} />
                                  <text x={tx} y={ty} textAnchor={anchor} dominantBaseline="central" fontSize={10} fill={c.text} fontWeight={500}>
                                    {`${displayName} ${(percent * 100).toFixed(0)}%`}
                                  </text>
                                </g>
                              );
                            }}
                            labelLine={false}
                          >
                            {pieData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: c.card, border: '1px solid ' + c.border, color: c.text, fontSize: '12px' }}
                            formatter={(v) => [v.toLocaleString() + ' ' + currency, '']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px 12px', marginTop: '10px', fontSize: '11px', color: c.text }}>
                        {pieData.map((d, i) => (
                          <div key={d.name} style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                            <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', backgroundColor: chartColors[i % chartColors.length], marginRight: 7, flexShrink: 0 }}></span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name} — {((d.value / totalP) * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}

                {chartType === 'bar' && chartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={barData} margin={{ top: 25, right: 10, left: 0, bottom: 55 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
                      <XAxis
                        dataKey="name"
                        stroke={c.text}
                        angle={-40}
                        textAnchor="end"
                        interval={0}
                        style={{ fontSize: '11px' }}
                        height={60}
                      />
                      <YAxis stroke={c.text} style={{ fontSize: '11px' }} tickFormatter={shortNum} />
                      <Tooltip
                        contentStyle={{ backgroundColor: c.card, border: '1px solid ' + c.border, color: c.text, fontSize: '12px' }}
                        formatter={(v) => [v.toLocaleString() + ' ' + currency, '']}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {barData.map((_, i) => <Cell key={i} fill={barColor(i)} />)}
                        <LabelList dataKey="value" position="top" fill={c.text} fontSize={10} fontWeight={600} formatter={shortNum} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'line' && (
                  lineData && lineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={lineData} margin={{ top: 10, right: 15, left: 0, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
                        <XAxis dataKey="name" stroke={c.text} style={{ fontSize: '10px' }} angle={-30} textAnchor="end" height={50} />
                        <YAxis stroke={c.text} style={{ fontSize: '10px' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: c.card, border: '1px solid ' + c.border, color: c.text, fontSize: '12px' }}
                          formatter={(v, n) => [v.toLocaleString() + ' ' + currency, n === 'income' ? t.income : t.expense]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', color: c.text }} formatter={(v) => v === 'income' ? t.income : t.expense} />
                        <Line type="monotone" dataKey="income" stroke={c.incomeColor} strokeWidth={2} dot={{ fill: c.incomeColor, r: 3 }} />
                        <Line type="monotone" dataKey="expense" stroke={c.expenseColor} strokeWidth={2} dot={{ fill: c.expenseColor, r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ color: c.sec, textAlign: 'center', padding: '40px 20px', fontSize: '13px' }}>{t.noLineData}</div>
                  )
                )}
              </div>
            )}

            {Object.keys(balanceByCurrency).filter(cur => Math.abs(balanceByCurrency[cur]) > 0.0001).length > 1 && (
              <div style={{ backgroundColor: c.card, padding: '14px 16px', borderRadius: '12px', border: '1px solid ' + c.border, marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', color: c.sec, letterSpacing: '0.5px', marginBottom: '8px' }}>{t.totalTitle}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: combinedBalance.total >= 0 ? c.incomeColor : c.expenseColor }}>
                  {Math.round(combinedBalance.total).toLocaleString()} {baseCurrency}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {Object.entries(balanceByCurrency)
                    .filter(([, v]) => Math.abs(v) > 0.0001)
                    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                    .map(([cur, val]) => (
                      <span key={cur} style={{ fontSize: '11px', padding: '4px 9px', borderRadius: '8px', backgroundColor: c.bg, border: '1px solid ' + c.border, color: val >= 0 ? c.incomeColor : c.expenseColor }}>
                        {Math.round(val).toLocaleString()} {cur}
                      </span>
                    ))}
                </div>
                {combinedBalance.missing.length > 0 && (
                  <div style={{ fontSize: '11px', color: c.expenseColor, marginTop: '8px', lineHeight: '1.45' }}>
                    {combinedBalance.missing.join(', ')} — {t.totalNoRate}. ⚙️ {t.ratesTitle}
                  </div>
                )}
              </div>
            )}

            {budgetRows.length > 0 && (
              <div style={{ backgroundColor: c.card, padding: '16px 18px', borderRadius: '12px', border: '1px solid ' + c.border, marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{t.budgetTitle}</h3>
                <div style={{ fontSize: '11px', color: c.sec, marginBottom: '12px' }}>{t.budgetOnly} {currency}</div>
                {budgetRows.map(b => {
                  const over = b.left < 0;
                  const barColor = over ? c.expenseColor : b.pct >= 80 ? '#E67E22' : c.incomeColor;
                  return (
                    <div key={b.key} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '5px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{b.cat}</span>
                        <span style={{ fontSize: '11px', color: barColor, whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {over
                            ? t.budgetOver + ' ' + Math.abs(Math.round(b.left)).toLocaleString()
                            : t.budgetLeft + ' ' + Math.round(b.left).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', backgroundColor: c.bg, overflow: 'hidden', border: '1px solid ' + c.border }}>
                        <div style={{ width: b.pct + '%', height: '100%', backgroundColor: barColor, transition: 'width 0.2s' }} />
                      </div>
                      <div style={{ fontSize: '10px', color: c.sec, marginTop: '4px' }}>
                        {t.budgetSpent} {Math.round(b.spent).toLocaleString()} / {Math.round(b.limit).toLocaleString()} {currency}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ backgroundColor: c.card, padding: '16px 18px', borderRadius: '12px', border: '1px solid ' + c.border, marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '15px' }}>{t.reconTitle}</h3>
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '12px', lineHeight: '1.5' }}>{t.reconHint}</div>
              {reconciliation.length === 0 ? (
                <div style={{ fontSize: '12px', color: c.sec, lineHeight: '1.5' }}>{t.reconEmpty}</div>
              ) : (
                reconciliation.map(rc => {
                  const ok = !rc.comparable || Math.abs(rc.diff) < 0.01;
                  return (
                    <div key={rc.card + rc.currency} style={{ padding: '10px 0', borderTop: '1px solid ' + c.border }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{t.reconCard} ***{rc.card}</span>
                        <span style={{ fontSize: '11px', color: ok ? c.incomeColor : c.expenseColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {ok ? '✓ ' + t.reconOk : '⚠ ' + Math.abs(Math.round(rc.diff)).toLocaleString() + ' ' + rc.currency}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: c.sec, marginTop: '4px', lineHeight: '1.5' }}>
                        {t.reconBank}: {Math.round(rc.bank).toLocaleString()} {rc.currency} ({t.reconAsOf} {rc.date}{rc.time ? ' ' + rc.time : ''})
                      </div>
                      {!ok && (
                        <div style={{ fontSize: '11px', color: c.expenseColor, marginTop: '4px', lineHeight: '1.5' }}>
                          {t.reconGap}. {t.reconOurs}: {Math.round(rc.expected).toLocaleString()} {rc.currency}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ backgroundColor: c.card, padding: showSmsBox ? '16px 18px' : '12px 18px', borderRadius: '12px', border: '1px solid ' + c.border, marginBottom: '16px' }}>
              <div
                onClick={() => setShowSmsBox(!showSmsBox)}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowSmsBox(!showSmsBox); } }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '11px', color: c.sec, transform: showSmsBox ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
                <h3 style={{ margin: 0, fontSize: '15px' }}>✉️ {t.smsTitle}</h3>
              </div>
              {showSmsBox && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', color: c.sec, marginBottom: '8px', lineHeight: '1.5' }}>{t.smsHint}</div>
                  <textarea
                    value={smsText}
                    onChange={(e) => setSmsText(e.target.value)}
                    placeholder={t.smsPlaceholder}
                    rows={4}
                    style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical', marginBottom: '8px', fontSize: '12px' }}
                  />
                  <button
                    onClick={() => handleSmsText(smsText)}
                    disabled={!smsText.trim()}
                    style={{ width: '100%', padding: '11px', fontSize: '13px', borderRadius: '8px', border: 'none', backgroundColor: c.saveBtn, color: '#fff', cursor: smsText.trim() ? 'pointer' : 'default', fontWeight: 500, opacity: smsText.trim() ? 1 : 0.5 }}
                  >{t.smsParse}</button>
                </div>
              )}
            </div>

            <div style={{ backgroundColor: c.card, padding: aiExpanded ? '18px' : '14px 18px', borderRadius: '12px', border: '1px solid ' + c.border, marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: aiExpanded ? '12px' : 0, flexWrap: 'wrap', gap: '8px' }}>
                <div
                  onClick={() => setAiExpanded(!aiExpanded)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAiExpanded(!aiExpanded); } }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, minWidth: 0 }}
                >
                  <span style={{ fontSize: '11px', color: c.sec, transform: aiExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>▶</span>
                  <h3 style={{ margin: 0, fontSize: '15px' }}>{t.aiAnalysisTitle}</h3>
                  {!aiExpanded && aiAnalysis && (
                    <span style={{ fontSize: '10px', color: c.incomeColor, border: '1px solid ' + c.incomeColor + '55', borderRadius: '10px', padding: '2px 8px', whiteSpace: 'nowrap' }}>
                      {t.aiReadyBadge}
                    </span>
                  )}
                </div>
                {aiExpanded && periodTransactions.length >= 3 && (
                  <button
                    onClick={runAiAnalysis}
                    disabled={aiAnalysisLoading}
                    style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '6px', border: '1px solid ' + c.border, backgroundColor: c.saveBtn, color: '#fff', cursor: aiAnalysisLoading ? 'wait' : 'pointer', fontWeight: 500, opacity: aiAnalysisLoading ? 0.7 : 1 }}
                  >
                    {aiAnalysisLoading ? '⏳ ' + t.aiAnalysisLoading : (aiAnalysis ? t.aiAnalysisRefresh : t.aiAnalysisRun)}
                  </button>
                )}
              </div>

              {aiExpanded && (
                <>
              {aiAnalysisError && (
                <div style={{ backgroundColor: '#8B4548', color: '#fff', padding: '10px 14px', borderRadius: '8px', marginBottom: '10px', fontSize: '13px' }}>
                  {aiAnalysisError}
                </div>
              )}

              {aiAnalysis && !aiAnalysisLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => aiToPdf(t.aiDocTitleAnalysis, aiAnalysisToText())}
                      style={aiActionBtn}>📄 {t.aiExportPdf}</button>
                    <button onClick={() => aiShareText(t.aiDocTitleAnalysis, aiAnalysisToText())}
                      style={aiActionBtn}>↗ {t.aiShare}</button>
                  </div>
                  {aiAnalysis.main && (
                    <div style={{ backgroundColor: c.saveBtn + '18', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid ' + c.saveBtn }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: c.saveBtn, marginBottom: '5px', letterSpacing: '0.3px' }}>{t.aiSectionMain}</div>
                      <div style={{ fontSize: '13px', lineHeight: '1.55', color: c.text }}>{aiAnalysis.main}</div>
                    </div>
                  )}
                  {aiAnalysis.trends && (
                    <div style={{ backgroundColor: c.incomeColor + '18', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid ' + c.incomeColor }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: c.incomeColor, marginBottom: '5px', letterSpacing: '0.3px' }}>{t.aiSectionTrends}</div>
                      <div style={{ fontSize: '13px', lineHeight: '1.55', color: c.text }}>{aiAnalysis.trends}</div>
                    </div>
                  )}
                  {aiAnalysis.advice && (
                    <div style={{ backgroundColor: c.expenseColor + '18', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid ' + c.expenseColor }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: c.expenseColor, marginBottom: '5px', letterSpacing: '0.3px' }}>{t.aiSectionAdvice}</div>
                      <div style={{ fontSize: '13px', lineHeight: '1.55', color: c.text }}>{aiAnalysis.advice}</div>
                    </div>
                  )}
                </div>
              )}

              {!aiAnalysis && !aiAnalysisLoading && !aiAnalysisError && (
                <div style={{ fontSize: '13px', color: c.sec, lineHeight: '1.55', padding: '4px 0' }}>
                  {periodTransactions.length < 3 ? t.aiAnalysisNoData : t.aiAnalysisIntro}
                </div>
              )}
                </>
              )}
            </div>

            <div style={{ backgroundColor: c.card, padding: '18px', borderRadius: '12px', border: '1px solid ' + c.border }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '15px' }}>{t.recent}</h3>
              {transactions.length === 0 ? (
                <div style={{ color: c.sec, textAlign: 'center', padding: '20px' }}>{t.noOperations}</div>
              ) : (
                (() => {
                  const sorted = transactions.slice().sort((a, b) => {
                    const dateCmp = b.date.localeCompare(a.date);
                    return dateCmp !== 0 ? dateCmp : b.id - a.id;
                  });
                  // Группируем по годам и месяцам
                  const byYear = {};
                  sorted.forEach(tx => {
                    const y = tx.date.substring(0, 4);
                    const m = tx.date.substring(0, 7);
                    if (!byYear[y]) byYear[y] = {};
                    if (!byYear[y][m]) byYear[y][m] = [];
                    byYear[y][m].push(tx);
                  });
                  const yearKeys = Object.keys(byYear).sort().reverse();
                  const currentYear = yearKeys[0]; // самый свежий год всегда раскрыт без плашки

                  const toggleMonth = (m) => {
                    setExpandedMonths(prev => {
                      const next = new Set(prev);
                      if (next.has(m)) next.delete(m); else next.add(m);
                      return next;
                    });
                  };
                  const toggleYear = (y) => {
                    setExpandedYears(prev => {
                      const next = new Set(prev);
                      if (next.has(y)) next.delete(y); else next.add(y);
                      return next;
                    });
                  };

                  const renderMonthBlock = (monthKey, monthTxs, mi, alwaysExpanded) => {
                    const isExpanded = alwaysExpanded || expandedMonths.has(monthKey);
                    const monthTotals = monthlySummary[monthKey];
                    const anchorDate = monthTxs[0].date;
                    return (
                      <React.Fragment key={monthKey}>
                        <div
                          onClick={alwaysExpanded ? undefined : () => toggleMonth(monthKey)}
                          role={alwaysExpanded ? undefined : 'button'}
                          tabIndex={alwaysExpanded ? undefined : 0}
                          onKeyDown={alwaysExpanded ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMonth(monthKey); } }}
                          style={{ marginTop: mi === 0 ? 0 : '10px', marginBottom: '4px', padding: '10px 14px', backgroundColor: c.saveBtn + '22', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', cursor: alwaysExpanded ? 'default' : 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 600, color: c.saveBtn, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            {formatMonthLabel(anchorDate)}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            {monthTotals && (monthTotals.income > 0 || monthTotals.expense > 0) && (
                              <span>
                                {monthTotals.income > 0 && (
                                  <span style={{ color: c.incomeColor }}>+{shortNum(monthTotals.income)}</span>
                                )}
                                {monthTotals.income > 0 && monthTotals.expense > 0 && (
                                  <span style={{ color: c.sec, margin: '0 6px' }}>·</span>
                                )}
                                {monthTotals.expense > 0 && (
                                  <span style={{ color: c.expenseColor }}>−{shortNum(monthTotals.expense)}</span>
                                )}
                                <span style={{ color: c.sec, marginLeft: '4px' }}>{currency}</span>
                              </span>
                            )}
                            {!alwaysExpanded && (
                              <span style={{ color: c.saveBtn, fontSize: '10px', marginLeft: '2px' }}>
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                        </div>
                        {isExpanded && monthTxs.map((tx, i) => {
                          const amountColor = tx.type === 'income' ? c.incomeColor : getExpenseColor(tx);
                          return (
                            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < monthTxs.length - 1 ? '1px solid ' + c.border : 'none', gap: '10px' }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 500, fontSize: '14px' }}>{tx.category}</div>
                                <div style={{ fontSize: '11px', color: c.sec }}>{tx.description || ''} · {tx.date}{tx.card ? ' · ***' + tx.card : ''}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ color: amountColor, fontWeight: 600, fontSize: '14px' }}>
                                  {tx.type === 'income' ? '+' : '−'}{tx.amount.toLocaleString()} {tx.currency}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '3px', justifyContent: 'flex-end' }}>
                                  <button onClick={(e) => { e.stopPropagation(); startEdit(tx); }} style={{ fontSize: '11px', background: 'none', border: 'none', color: c.saveBtn, cursor: 'pointer', padding: 0, fontWeight: 500 }}>{t.edit}</button>
                                  <button onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }} style={{ fontSize: '11px', background: 'none', border: 'none', color: '#E24B4A', cursor: 'pointer', padding: 0, fontWeight: 500 }}>{t.delete}</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  };

                  return yearKeys.map((yearKey, yi) => {
                    const isCurrentYear = yearKey === currentYear;
                    const isYearExpanded = isCurrentYear || expandedYears.has(yearKey);
                    const monthsOfYear = byYear[yearKey];
                    const monthKeys = Object.keys(monthsOfYear).sort().reverse();
                    const yearTotals = yearlySummary[yearKey];
                    return (
                      <React.Fragment key={yearKey}>
                        {!isCurrentYear && (
                          <div
                            onClick={() => toggleYear(yearKey)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleYear(yearKey); } }}
                            style={{ marginTop: '22px', marginBottom: '6px', padding: '13px 15px', backgroundColor: c.saveBtn + '44', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', cursor: 'pointer', userSelect: 'none' }}
                          >
                            <div style={{ fontSize: '14px', fontWeight: 700, color: c.saveBtn, letterSpacing: '0.5px' }}>
                              {yearKey}
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                              {yearTotals && (yearTotals.income > 0 || yearTotals.expense > 0) && (
                                <span>
                                  {yearTotals.income > 0 && (
                                    <span style={{ color: c.incomeColor }}>+{shortNum(yearTotals.income)}</span>
                                  )}
                                  {yearTotals.income > 0 && yearTotals.expense > 0 && (
                                    <span style={{ color: c.sec, margin: '0 6px' }}>·</span>
                                  )}
                                  {yearTotals.expense > 0 && (
                                    <span style={{ color: c.expenseColor }}>−{shortNum(yearTotals.expense)}</span>
                                  )}
                                  <span style={{ color: c.sec, marginLeft: '4px' }}>{currency}</span>
                                </span>
                              )}
                              <span style={{ color: c.saveBtn, fontSize: '11px', marginLeft: '2px' }}>
                                {isYearExpanded ? '▲' : '▼'}
                              </span>
                            </div>
                          </div>
                        )}
                        {isYearExpanded && monthKeys.map((monthKey, mi) => {
                          // В текущем году самый свежий месяц раскрыт по умолчанию
                          const alwaysExpanded = isCurrentYear && mi === 0;
                          return renderMonthBlock(monthKey, monthsOfYear[monthKey], mi, alwaysExpanded);
                        })}
                      </React.Fragment>
                    );
                  });
                })()
              )}
            </div>
          </>
        )}

        {activeTab === 'report' && (
          <div>
            <div style={{ backgroundColor: c.card, padding: '18px', borderRadius: '12px', marginBottom: '14px', border: '1px solid ' + c.border }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '15px' }}>{t.reportTitle}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.dateFrom}</label>
                  <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.dateTo}</label>
                  <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.operationType}</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={inputStyle}>
                  <option value="all">{t.allTypes}</option>
                  <option value="income">{t.onlyIncome}</option>
                  <option value="expense">{t.onlyExpense}</option>
                </select>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.category}</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={inputStyle}>
                  <option value="">{t.allCategories}</option>
                  {allCategories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                </select>
              </div>
              {tags.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.tagLabel}</label>
                  <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={inputStyle}>
                    <option value="">{t.tagAll}</option>
                    {tags.map(tg => <option key={tg} value={tg}>{tg}</option>)}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.searchLabel}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={t.searchPlaceholder} style={{ ...inputStyle, flex: 1 }} />
                  {searchText && (
                    <button onClick={() => setSearchText('')} style={{ padding: '10px 13px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: 'transparent', color: c.sec, cursor: 'pointer' }}>✕</button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button onClick={exportExcel} style={{ flex: 1, padding: '11px', backgroundColor: '#1E5C3A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>📊 {t.exportExcel}</button>
                <button onClick={exportPDF} style={{ flex: 1, padding: '11px', backgroundColor: '#8B2020', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>📄 {t.exportPDF}</button>
              </div>
              <button onClick={shareReport} style={{ width: '100%', padding: '11px', backgroundColor: '#2C5282', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                {t.shareReport}
              </button>
              {shareNotice && (
                <div style={{ marginTop: '10px', padding: '12px 14px', backgroundColor: c.card, color: c.text, borderRadius: '8px', fontSize: '12px', lineHeight: '1.55', border: '1px solid ' + c.incomeColor, position: 'relative' }}>
                  <div style={{ paddingRight: '20px' }}>{shareNotice}</div>
                  <button onClick={() => setShareNotice('')} aria-label="Закрыть" style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: c.sec, cursor: 'pointer', fontSize: '16px', padding: 0, lineHeight: 1 }}>✕</button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: c.card, padding: '12px', borderRadius: '12px', border: '1px solid ' + c.border }}>
                <div style={{ fontSize: '10px', color: c.incomeColor }}>{t.totalIncome}</div>
                <div style={{ fontSize: '17px', fontWeight: 600, color: c.incomeColor, marginTop: '4px' }}>{reportIncome.toLocaleString()} {currency}</div>
              </div>
              <div style={{ backgroundColor: c.card, padding: '12px', borderRadius: '12px', border: '1px solid ' + c.border }}>
                <div style={{ fontSize: '10px', color: c.expenseColor }}>{t.totalExpense}</div>
                <div style={{ fontSize: '17px', fontWeight: 600, color: c.expenseColor, marginTop: '4px' }}>{reportExpense.toLocaleString()} {currency}</div>
              </div>
              <div style={{ backgroundColor: c.card, padding: '12px', borderRadius: '12px', border: '1px solid ' + c.border }}>
                <div style={{ fontSize: '10px', color: c.sec }}>{t.totalBalance}</div>
                <div style={{ fontSize: '17px', fontWeight: 600, marginTop: '4px' }}>{(reportIncome - reportExpense).toLocaleString()} {currency}</div>
              </div>
              <div style={{ backgroundColor: c.card, padding: '12px', borderRadius: '12px', border: '1px solid ' + c.border }}>
                <div style={{ fontSize: '10px', color: c.sec }}>{t.operations}</div>
                <div style={{ fontSize: '17px', fontWeight: 600, marginTop: '4px' }}>{reportData.length}</div>
              </div>
            </div>

            <div style={{ backgroundColor: c.card, padding: '18px', borderRadius: '12px', border: '1px solid ' + c.border }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '15px' }}>{t.reportResult}</h3>
              {reportData.length === 0 ? (
                <div style={{ color: c.sec, textAlign: 'center', padding: '20px' }}>{t.noData}</div>
              ) : (
                reportData.slice().reverse().map((tx, i) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < reportData.length - 1 ? '1px solid ' + c.border : 'none', gap: '10px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '14px' }}>{tx.category}</div>
                      <div style={{ fontSize: '11px', color: c.sec }}>{tx.description || ''} · {tx.date}{tx.card ? ' · ***' + tx.card : ''}</div>
                    </div>
                    <div style={{ color: tx.type === 'income' ? c.incomeColor : c.expenseColor, fontWeight: 600, whiteSpace: 'nowrap', fontSize: '14px' }}>
                      {tx.type === 'income' ? '+' : '−'}{tx.amount.toLocaleString()} {tx.currency}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div>
            {/* Сводка по долгам */}
            {(debtTotals('iowe').length > 0 || debtTotals('owedme').length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                {debtTotals('iowe').length > 0 && (
                  <div style={{ backgroundColor: c.card, padding: '14px', borderRadius: '12px', border: '1px solid ' + c.border }}>
                    <div style={{ fontSize: '10px', color: c.expenseColor, letterSpacing: '0.5px' }}>↗️ {t.planTotalIOwe}</div>
                    {debtTotals('iowe').map(([cur, sum]) => (
                      <div key={cur} style={{ fontSize: '17px', fontWeight: 600, marginTop: '4px', color: c.expenseColor }}>{sum.toLocaleString()} {cur}</div>
                    ))}
                  </div>
                )}
                {debtTotals('owedme').length > 0 && (
                  <div style={{ backgroundColor: c.card, padding: '14px', borderRadius: '12px', border: '1px solid ' + c.border }}>
                    <div style={{ fontSize: '10px', color: c.incomeColor, letterSpacing: '0.5px' }}>↘️ {t.planTotalOwedMe}</div>
                    {debtTotals('owedme').map(([cur, sum]) => (
                      <div key={cur} style={{ fontSize: '17px', fontWeight: 600, marginTop: '4px', color: c.incomeColor }}>{sum.toLocaleString()} {cur}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Кнопки создания */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => openPlanForm('purchase')} style={{ flex: '1 1 30%', padding: '11px 8px', fontSize: '12px', backgroundColor: c.card, color: c.text, border: '1px solid ' + c.border, borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>{t.planPurchase}</button>
              <button onClick={() => openPlanForm('iowe')} style={{ flex: '1 1 30%', padding: '11px 8px', fontSize: '12px', backgroundColor: c.card, color: c.text, border: '1px solid ' + c.border, borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>{t.planIOwe}</button>
              <button onClick={() => openPlanForm('owedme')} style={{ flex: '1 1 30%', padding: '11px 8px', fontSize: '12px', backgroundColor: c.card, color: c.text, border: '1px solid ' + c.border, borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>{t.planOwedMe}</button>
            </div>

            {/* Форма записи */}
            {showPlanForm && (
              <div style={{ backgroundColor: c.card, padding: '18px', borderRadius: '12px', marginBottom: '14px', border: '1px solid ' + c.saveBtn }}>
                <form onSubmit={submitPlan}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.planKind}</label>
                    <select value={planData.kind} onChange={(e) => setPlanData({ ...planData, kind: e.target.value })} style={inputStyle}>
                      <option value="purchase">{t.planPurchase}</option>
                      <option value="iowe">{t.planIOwe}</option>
                      <option value="owedme">{t.planOwedMe}</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.planWhat}</label>
                    <input type="text" value={planData.what} onChange={(e) => setPlanData({ ...planData, what: e.target.value })} placeholder={t.planWhatPlaceholder} style={inputStyle} autoFocus />
                  </div>
                  {planData.kind !== 'purchase' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.planPerson}</label>
                      <input type="text" value={planData.person} onChange={(e) => setPlanData({ ...planData, person: e.target.value })} placeholder={t.planPersonPlaceholder} style={inputStyle} />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.planAmountOptional}</label>
                      <input type="number" value={planData.amount} onChange={(e) => setPlanData({ ...planData, amount: e.target.value })} placeholder="0" style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>&nbsp;</label>
                      <select value={planData.currency} onChange={(e) => setPlanData({ ...planData, currency: e.target.value })} style={inputStyle}>
                        {currencies.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.planDue}</label>
                    <input type="date" value={planData.dueDate} onChange={(e) => setPlanData({ ...planData, dueDate: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.planNote}</label>
                    <input type="text" value={planData.note} onChange={(e) => setPlanData({ ...planData, note: e.target.value })} placeholder={t.planNotePlaceholder} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" style={{ flex: 1, padding: '11px', backgroundColor: c.saveBtn, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>{editingPlanId ? t.update : t.save}</button>
                    <button type="button" onClick={() => { setShowPlanForm(false); setEditingPlanId(null); }} style={{ padding: '11px 18px', backgroundColor: 'transparent', color: c.sec, border: '1px solid ' + c.border, borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>{t.cancel}</button>
                  </div>
                </form>
              </div>
            )}

            {/* Активные / закрытые */}
            <div style={{ display: 'flex', gap: '5px', backgroundColor: c.card, padding: '4px', borderRadius: '10px', border: '1px solid ' + c.border, marginBottom: '12px' }}>
              <button onClick={() => setPlanTab('active')} style={{ flex: 1, padding: '8px', fontSize: '12px', border: 'none', borderRadius: '7px', backgroundColor: planTab === 'active' ? c.tabActive : 'transparent', color: planTab === 'active' ? c.tabText : c.sec, cursor: 'pointer', fontWeight: planTab === 'active' ? 600 : 400 }}>
                {t.planActive} ({activePlans.length})
              </button>
              <button onClick={() => setPlanTab('closed')} style={{ flex: 1, padding: '8px', fontSize: '12px', border: 'none', borderRadius: '7px', backgroundColor: planTab === 'closed' ? c.tabActive : 'transparent', color: planTab === 'closed' ? c.tabText : c.sec, cursor: 'pointer', fontWeight: planTab === 'closed' ? 600 : 400 }}>
                {t.planClosed} ({closedPlans.length})
              </button>
            </div>

            {(planTab === 'active' ? activePlans : closedPlans).length === 0 ? (
              <div style={{ backgroundColor: c.card, padding: '32px 20px', borderRadius: '12px', border: '1px solid ' + c.border, textAlign: 'center' }}>
                <div style={{ fontSize: '14px', marginBottom: '6px' }}>{t.planEmpty}</div>
                <div style={{ fontSize: '12px', color: c.sec, lineHeight: '1.55' }}>{t.planEmptyHint}</div>
              </div>
            ) : (
              (planTab === 'active' ? activePlans : closedPlans).map(pl => {
                const meta = planKindMeta(pl.kind);
                const info = planDueInfo(pl);
                const isConfirming = confirmClosePlanId === pl.id;
                return (
                  <div key={pl.id} style={{
                    backgroundColor: c.card, padding: '13px 14px', borderRadius: '12px', marginBottom: '9px',
                    border: '1px solid ' + (pl.done ? c.border : (info.urgent ? info.color + '70' : c.border)),
                    borderLeft: '3px solid ' + (pl.done ? c.border : meta.color),
                    opacity: pl.done ? 0.62 : 1
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, wordBreak: 'break-word', textDecoration: pl.done ? 'line-through' : 'none' }}>
                          {meta.icon} {pl.what || pl.person}
                        </div>
                        {pl.what && pl.person && (
                          <div style={{ fontSize: '12px', color: c.sec, marginTop: '2px' }}>{pl.person}</div>
                        )}
                        {pl.note && (
                          <div style={{ fontSize: '11px', color: c.sec, marginTop: '4px', lineHeight: '1.45', wordBreak: 'break-word' }}>{pl.note}</div>
                        )}
                      </div>
                      {pl.amount != null && (
                        <div style={{ fontSize: '15px', fontWeight: 700, whiteSpace: 'nowrap', color: pl.done ? c.sec : meta.color }}>
                          {pl.amount.toLocaleString()} {pl.currency}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '9px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: pl.done ? c.sec : info.color, fontWeight: info.urgent && !pl.done ? 600 : 400 }}>
                        {pl.done ? t.planClosedOn + ' ' + (pl.doneAt || '') : info.text}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {pl.done ? (
                          <>
                            <button onClick={() => reopenPlan(pl.id)} style={{ padding: '5px 10px', fontSize: '11px', border: '1px solid ' + c.border, borderRadius: '6px', backgroundColor: 'transparent', color: c.sec, cursor: 'pointer' }}>{t.planReopen}</button>
                            <button onClick={() => { if (window.confirm(t.planDeleteConfirm)) deletePlan(pl.id); }} style={{ padding: '5px 10px', fontSize: '11px', border: '1px solid ' + c.border, borderRadius: '6px', backgroundColor: 'transparent', color: c.expenseColor, cursor: 'pointer' }}>{t.delete}</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditPlan(pl)} style={{ padding: '5px 10px', fontSize: '11px', border: '1px solid ' + c.border, borderRadius: '6px', backgroundColor: 'transparent', color: c.sec, cursor: 'pointer' }}>{t.planEdit}</button>
                            <button onClick={() => { if (window.confirm(t.planDeleteConfirm)) deletePlan(pl.id); }} style={{ padding: '5px 10px', fontSize: '11px', border: '1px solid ' + c.border, borderRadius: '6px', backgroundColor: 'transparent', color: c.sec, cursor: 'pointer' }}>{t.delete}</button>
                            <button onClick={() => pl.amount ? setConfirmClosePlanId(pl.id) : closePlan(pl, false)} style={{ padding: '5px 12px', fontSize: '11px', border: 'none', borderRadius: '6px', backgroundColor: c.saveBtn, color: '#fff', cursor: 'pointer', fontWeight: 500 }}>{t.planDone}</button>
                          </>
                        )}
                      </div>
                    </div>

                    {isConfirming && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed ' + c.border }}>
                        <div style={{ fontSize: '12px', marginBottom: '8px', lineHeight: '1.5' }}>{t.planAskCreateTx}</div>
                        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                          <button onClick={() => closePlan(pl, true)} style={{ padding: '7px 12px', fontSize: '11px', border: 'none', borderRadius: '6px', backgroundColor: pl.kind === 'owedme' ? c.incomeColor : c.expenseColor, color: '#fff', cursor: 'pointer', fontWeight: 500 }}>{t.planCreateTx}</button>
                          <button onClick={() => closePlan(pl, false)} style={{ padding: '7px 12px', fontSize: '11px', border: '1px solid ' + c.border, borderRadius: '6px', backgroundColor: 'transparent', color: c.text, cursor: 'pointer' }}>{t.planJustMark}</button>
                          <button onClick={() => setConfirmClosePlanId(null)} style={{ padding: '7px 12px', fontSize: '11px', border: '1px solid ' + c.border, borderRadius: '6px', backgroundColor: 'transparent', color: c.sec, cursor: 'pointer' }}>{t.cancel}</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <div style={{ backgroundColor: c.card, padding: '16px 18px', borderRadius: '12px', border: '1px solid ' + c.border, marginTop: '16px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '15px' }}>{t.budgetTitle}</h3>
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '12px', lineHeight: '1.5' }}>{t.budgetHint}</div>

              {budgetRows.length === 0 && (
                <div style={{ fontSize: '12px', color: c.sec, marginBottom: '12px' }}>{t.budgetNone}</div>
              )}
              {budgetRows.map(b => (
                <div key={b.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '8px 0', borderTop: '1px solid ' + c.border }}>
                  <span style={{ fontSize: '13px', flex: 1, minWidth: 0 }}>{b.cat}</span>
                  <span style={{ fontSize: '12px', color: c.sec, whiteSpace: 'nowrap' }}>{Math.round(b.limit).toLocaleString()} {currency}</span>
                  <button
                    onClick={() => { const next = { ...budgets }; delete next[b.key]; setBudgets(next); }}
                    style={{ background: 'none', border: 'none', color: c.sec, cursor: 'pointer', fontSize: '14px', padding: '0 2px' }}
                  >✕</button>
                </div>
              ))}

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                <select
                  value={budgetDraft.category}
                  onChange={(e) => setBudgetDraft({ ...budgetDraft, category: e.target.value })}
                  style={{ ...inputStyle, flex: '1 1 130px' }}
                >
                  <option value="">{t.budgetCategory}</option>
                  {catsFor('expense').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input
                  type="number" inputMode="decimal" min="0" step="any"
                  value={budgetDraft.amount}
                  onChange={(e) => setBudgetDraft({ ...budgetDraft, amount: e.target.value })}
                  placeholder={t.budgetAmount}
                  style={{ ...inputStyle, flex: '1 1 110px' }}
                />
                <button
                  onClick={() => {
                    const amt = parseFloat(budgetDraft.amount);
                    if (!budgetDraft.category || !isFinite(amt) || amt <= 0) return;
                    setBudgets({ ...budgets, [budgetKey(currency, budgetDraft.category)]: amt });
                    setBudgetDraft({ category: '', amount: '' });
                  }}
                  style={{ padding: '10px 16px', fontSize: '12px', borderRadius: '8px', border: 'none', backgroundColor: c.saveBtn, color: '#fff', cursor: 'pointer', fontWeight: 500 }}
                >{t.budgetAdd}</button>
              </div>
            </div>

            <div style={{ backgroundColor: c.card, padding: '16px 18px', borderRadius: '12px', border: '1px solid ' + c.border, marginTop: '16px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '15px' }}>{t.recurTitle}</h3>
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '12px', lineHeight: '1.5' }}>{t.recurHint}</div>

              {recurring.length === 0 && !recurForm && (
                <div style={{ fontSize: '12px', color: c.sec, marginBottom: '12px' }}>{t.recurNone}</div>
              )}
              {recurring.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '9px 0', borderTop: '1px solid ' + c.border }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{r.category}{r.description ? ' · ' + r.description : ''}</div>
                    <div style={{ fontSize: '11px', color: c.sec }}>
                      {parseFloat(r.amount).toLocaleString()} {r.currency} · {t.recurEvery} {r.day} {t.recurDayShort}
                      {' · '}{r.lastPosted ? t.recurLast + ' ' + r.lastPosted : t.recurNever}
                    </div>
                  </div>
                  <button onClick={() => deleteRecurring(r.id)} style={{ background: 'none', border: 'none', color: c.sec, cursor: 'pointer', fontSize: '14px', padding: '0 2px' }}>✕</button>
                </div>
              ))}

              {recurForm ? (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid ' + c.border }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <select value={recurForm.type} onChange={(e) => setRecurForm({ ...recurForm, type: e.target.value, category: '' })} style={{ ...inputStyle, flex: '1 1 110px' }}>
                      <option value="expense">{t.expense}</option>
                      <option value="income">{t.income}</option>
                    </select>
                    <select value={recurForm.category} onChange={(e) => setRecurForm({ ...recurForm, category: e.target.value })} style={{ ...inputStyle, flex: '1 1 130px' }}>
                      <option value="">{t.selectCat}</option>
                      {catsFor(recurForm.type).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <input type="number" inputMode="decimal" min="0" step="any" value={recurForm.amount} onChange={(e) => setRecurForm({ ...recurForm, amount: e.target.value })} placeholder={t.amount} style={{ ...inputStyle, flex: '1 1 110px' }} />
                    <select value={recurForm.currency} onChange={(e) => setRecurForm({ ...recurForm, currency: e.target.value })} style={{ ...inputStyle, flex: '0 1 100px' }}>
                      {currencies.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                    </select>
                    <input type="number" min="1" max="28" value={recurForm.day} onChange={(e) => setRecurForm({ ...recurForm, day: e.target.value })} placeholder={t.recurDay} style={{ ...inputStyle, flex: '0 1 100px' }} />
                  </div>
                  <input type="text" value={recurForm.description} onChange={(e) => setRecurForm({ ...recurForm, description: e.target.value })} placeholder={t.description} style={{ ...inputStyle, marginBottom: '10px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        const amt = parseFloat(recurForm.amount);
                        const day = parseInt(recurForm.day, 10);
                        if (!recurForm.category || !isFinite(amt) || amt <= 0 || !(day >= 1 && day <= 28)) return;
                        setRecurring([...recurring, { ...recurForm, id: Date.now(), amount: amt, day, lastPosted: null, skipped: null }]);
                        setRecurForm(null);
                      }}
                      style={{ flex: 1, padding: '11px', fontSize: '13px', borderRadius: '8px', border: 'none', backgroundColor: c.saveBtn, color: '#fff', cursor: 'pointer', fontWeight: 500 }}
                    >{t.save}</button>
                    <button onClick={() => setRecurForm(null)} style={{ padding: '11px 16px', fontSize: '13px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: 'transparent', color: c.sec, cursor: 'pointer' }}>{t.cancel}</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setRecurForm({ type: 'expense', category: '', amount: '', currency, day: '1', description: '', tag: '' })}
                  style={{ width: '100%', marginTop: '10px', padding: '11px', fontSize: '13px', borderRadius: '8px', border: '1px dashed ' + c.border, backgroundColor: 'transparent', color: c.saveBtn, cursor: 'pointer', fontWeight: 500 }}
                >{t.recurAdd}</button>
              )}
            </div>

          </div>
        )}

        {activeTab === 'assistant' && (
          <div>
            <div style={{ backgroundColor: c.card, padding: '16px 18px', borderRadius: '12px', border: '1px solid ' + c.border, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '15px' }}>{t.chatTitle}</h3>
              {chatMessages.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button onClick={() => aiToPdf(t.aiDocTitleChat, chatToText())} style={aiActionBtn}>📄 PDF</button>
                  <button onClick={() => aiShareText(t.aiDocTitleChat, chatToText())} style={aiActionBtn}>↗ {t.aiShare}</button>
                  <button onClick={clearChat} style={{ padding: '6px 10px', fontSize: '11px', border: '1px solid ' + c.border, borderRadius: '6px', backgroundColor: 'transparent', color: c.sec, cursor: 'pointer' }}>{t.chatClear}</button>
                </div>
              )}
            </div>

            <div style={{ backgroundColor: c.card, padding: '14px', borderRadius: '12px', border: '1px solid ' + c.border, minHeight: '320px', maxHeight: '55vh', overflowY: 'auto', marginBottom: '12px' }}>
              {chatMessages.length === 0 ? (
                <div>
                  <div style={{ color: c.sec, fontSize: '13px', lineHeight: '1.55', textAlign: 'center', padding: '20px 10px 24px' }}>{t.chatEmpty}</div>
                  <div style={{ fontSize: '11px', color: c.sec, marginBottom: '8px', textAlign: 'center' }}>{t.chatSuggestions}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '360px', margin: '0 auto' }}>
                    {[t.chatExample1, t.chatExample2, t.chatExample3, t.chatExample4].map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => sendChatMessage(ex)}
                        style={{ padding: '10px 12px', fontSize: '12px', backgroundColor: c.saveBtn + '15', color: c.text, border: '1px solid ' + c.saveBtn + '40', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', lineHeight: '1.4' }}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map((m, i) => {
                    const isUser = m.role === 'user';
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                        <div style={{
                          maxWidth: '85%',
                          padding: '10px 13px',
                          borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                          backgroundColor: isUser ? c.saveBtn : (m.isError ? '#8B4548' + '20' : c.bg),
                          color: isUser ? '#fff' : c.text,
                          fontSize: '13px',
                          lineHeight: '1.55',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          border: isUser ? 'none' : '1px solid ' + c.border
                        }}>
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                  {chatLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ padding: '10px 13px', borderRadius: '12px 12px 12px 4px', backgroundColor: c.bg, color: c.sec, fontSize: '13px', border: '1px solid ' + c.border }}>
                        ⏳ {t.chatLoading}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            <div style={{ backgroundColor: c.card, padding: '12px', borderRadius: '12px', border: '1px solid ' + c.border }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  placeholder={t.chatPlaceholder}
                  disabled={chatLoading}
                  rows={2}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: c.bg, color: c.text, fontSize: '13px', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
                <button
                  onClick={() => sendChatMessage()}
                  disabled={chatLoading || !chatInput.trim()}
                  style={{ padding: '10px 14px', backgroundColor: c.saveBtn, color: '#fff', border: 'none', borderRadius: '8px', cursor: (chatLoading || !chatInput.trim()) ? 'default' : 'pointer', fontWeight: 500, fontSize: '13px', opacity: (chatLoading || !chatInput.trim()) ? 0.5 : 1, whiteSpace: 'nowrap' }}
                >
                  {t.chatSend}
                </button>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '12px', color: c.sec, cursor: 'pointer' }}>
                <input type="checkbox" checked={chatUseFinData} onChange={(e) => setChatUseFinData(e.target.checked)} style={{ cursor: 'pointer' }} />
                <span>{t.chatUseFinDataLabel}</span>
              </label>
            </div>

            <div style={{ marginTop: '10px', fontSize: '11px', color: c.sec, textAlign: 'center', lineHeight: '1.5', padding: '0 10px' }}>
              {t.chatDisclaimer}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
