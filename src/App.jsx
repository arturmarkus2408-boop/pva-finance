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
    amount: '', category: '', customCategory: '', description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [geminiKey, setGeminiKey] = useState('');
  const [tempKey, setTempKey] = useState('');
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
      light: 'Светлая', dark: 'Тёмная', soft: 'Деловая',
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
      chatExample4: 'Куда я больше всего трачу деньги?'
    },
    uz: {
      appName: 'Wallet', addIncome: '+ Daromad', addExpense: '+ Xarajat',
      balance: 'BALANS', income: 'DAROMAD', expense: 'XARAJAT',
      category: 'Kategoriya', amount: 'Summa', description: 'Tavsif',
      date: 'Sana', save: 'Saqlash', update: 'Yangilash', cancel: 'Bekor qilish',
      recent: 'Songgi amaliyotlar', delete: "O'chirish", edit: 'Tahrirlash',
      selectCat: 'Kategoriyani tanlang', customCatPlaceholder: "O'z kategoriya",
      light: 'Yorqin', dark: 'Qora', soft: 'Biznes',
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
      chatExample4: 'Qayerga ko\'proq pul sarflamoqdaman?'
    },
    en: {
      appName: 'Wallet', addIncome: '+ Income', addExpense: '+ Expense',
      balance: 'BALANCE', income: 'INCOME', expense: 'EXPENSE',
      category: 'Category', amount: 'Amount', description: 'Description',
      date: 'Date', save: 'Save', update: 'Update', cancel: 'Cancel',
      recent: 'Recent transactions', delete: 'Delete', edit: 'Edit',
      selectCat: 'Select category', customCatPlaceholder: 'Custom category',
      light: 'Light', dark: 'Dark', soft: 'Business',
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
      chatExample4: 'Where do I spend the most money?'
    },
    tr: {
      appName: 'Wallet', addIncome: '+ Gelir', addExpense: '+ Gider',
      balance: 'BAKİYE', income: 'GELİR', expense: 'GİDER',
      category: 'Kategori', amount: 'Tutar', description: 'Açıklama',
      date: 'Tarih', save: 'Kaydet', update: 'Güncelle', cancel: 'İptal',
      recent: 'Son işlemler', delete: 'Sil', edit: 'Düzenle',
      selectCat: 'Kategori seçin', customCatPlaceholder: 'Özel kategori',
      light: 'Açık', dark: 'Koyu', soft: 'İş',
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
      chatExample4: 'Nereye en çok para harcıyorum?'
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
      } catch (e) {}
    }
    const key = localStorage.getItem('walletGeminiKey');
    if (key) { setGeminiKey(key); setTempKey(key); }
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
    localStorage.setItem('walletData', JSON.stringify({ transactions, theme, language, currency, currencies, dashboardPeriod }));
  }, [transactions, theme, language, currency, currencies, dashboardPeriod]);

  // Автосворачивание раскрытых прошлых месяцев и годов при любом действии вне списка
  useEffect(() => {
    setExpandedMonths(new Set());
    setExpandedYears(new Set());
  }, [dashboardPeriod, language, theme, currency, activeTab, showForm, showSettings, listening, scanning]);

  const themes = {
    light: { bg: '#F7F4ED', text: '#1B2845', sec: '#5F5E5A', card: '#FFFFFF', border: '#E0DCD0', incomeColor: '#3F7D58', expenseColor: '#8B4548', saveBtn: '#B07D3F', tabActive: '#1B2845', tabText: '#FFFFFF' },
    dark: { bg: '#000000', text: '#FFFFFF', sec: '#C9A84C', card: '#111111', border: '#2A2A2A', incomeColor: '#C9A84C', expenseColor: '#E05555', saveBtn: '#C9A84C', tabActive: '#C9A84C', tabText: '#000000' },
    soft: { bg: '#EEF1F5', text: '#1A2635', sec: '#4A6080', card: '#FFFFFF', border: '#C8D3DE', incomeColor: '#1E5C3A', expenseColor: '#6B2737', saveBtn: '#1E3A5C', tabActive: '#1E3A5C', tabText: '#FFFFFF' }
  };
  const c = themes[theme];

  const isOther = formData.category === 'Другое' || formData.category === 'Boshqa' || formData.category === 'Other' || formData.category === 'Diğer';

  const submitTransaction = (e) => {
    e.preventDefault();
    const finalCategory = isOther ? formData.customCategory : formData.category;
    if (!formData.amount || !finalCategory) return;
    if (editingId) {
      setTransactions(transactions.map(tx => tx.id === editingId ? { ...tx, amount: parseFloat(formData.amount), category: finalCategory, description: formData.description, date: formData.date } : tx));
      setEditingId(null);
    } else {
      setTransactions([...transactions, { id: Date.now(), type: formType, amount: parseFloat(formData.amount), category: finalCategory, description: formData.description, currency, date: formData.date }]);
    }
    setFormData({ amount: '', category: '', customCategory: '', description: '', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const startEdit = (tx) => {
    const builtInCats = tx.type === 'income' ? t.categoriesInc : t.categoriesExp;
    const isBuiltIn = builtInCats.includes(tx.category);
    setFormType(tx.type);
    setEditingId(tx.id);
    setFormData({ amount: tx.amount.toString(), category: isBuiltIn ? tx.category : t.categoriesInc[t.categoriesInc.length - 1], customCategory: isBuiltIn ? '' : tx.category, description: tx.description || '', date: tx.date });
    setShowForm(true);
    setActiveTab('dashboard');
  };

  const deleteTransaction = (id) => setTransactions(transactions.filter(tx => tx.id !== id));

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
  const getPeriodRange = (period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (period) {
      case 'today':
        return { from: today, label: today.toLocaleDateString(language === 'en' ? 'en-GB' : language) };
      case 'week': {
        const day = today.getDay() || 7; // Пн=1..Вс=7
        const monday = new Date(today);
        monday.setDate(today.getDate() - (day - 1));
        return { from: monday, label: monday.toLocaleDateString(language === 'en' ? 'en-GB' : language) + ' — ' + today.toLocaleDateString(language === 'en' ? 'en-GB' : language) };
      }
      case 'month': {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: first, label: first.toLocaleDateString(language === 'en' ? 'en-GB' : language, { month: 'long', year: 'numeric' }) };
      }
      case 'year': {
        const first = new Date(now.getFullYear(), 0, 1);
        return { from: first, label: String(now.getFullYear()) };
      }
      case 'all':
      default:
        return { from: null, label: t.periodAll };
    }
  };

  const { from: periodFrom, label: periodLabel } = getPeriodRange(dashboardPeriod);

  const periodTransactions = transactions.filter(tx => {
    if (tx.currency !== currency) return false;
    if (periodFrom) {
      const txDate = new Date(tx.date);
      if (txDate < periodFrom) return false;
    }
    return true;
  });

  const income = periodTransactions.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const expense = periodTransactions.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const balance = income - expense;

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

  const cats = formType === 'income' ? t.categoriesInc : t.categoriesExp;


  const allCategories = [...new Set([...t.categoriesInc, ...t.categoriesExp, ...transactions.map(tx => tx.category)].filter(cat => !['Другое','Boshqa','Other','Diğer'].includes(cat)))];

  const getReportData = () => transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const from = filterFrom ? new Date(filterFrom) : null;
    const to = filterTo ? new Date(filterTo) : null;
    return (!from || txDate >= from) && (!to || txDate <= to) &&
      (filterType === 'all' || tx.type === filterType) &&
      (!filterCategory || tx.category === filterCategory) &&
      tx.currency === currency;
  });

  const reportData = getReportData();
  const reportIncome = reportData.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const reportExpense = reportData.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);

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

  // ===== РАСПОЗНАВАНИЕ ЧЕКА ЧЕРЕЗ GEMINI VISION =====
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
      const knownCats = [...new Set([...t.categoriesExp, ...transactions.filter(tx => tx.type === 'expense').map(tx => tx.category)])].filter(x => !['Другое','Boshqa','Other','Diğer'].includes(x));
      const prompt = `Ты OCR финансового приложения. Проанализируй фотографию чека и извлеки данные.

ВАЖНО: Чек может быть мятым, скомканным, снятым под углом, с тенями от складок или бликами. Внимательно ищи текст в разных областях. Если строка искривлена из-за складки — восстанови её мысленно.

Пошагово выполни:

ШАГ 1 — НАЙДИ ИТОГОВУЮ СУММУ:
- Ищи метки: "ИТОГО", "К ОПЛАТЕ", "ВСЕГО", "СУММА", "TOTAL", "TO PAY", "AMOUNT", "JAMI", "UMUMIY", "TO'LOV", "JAMI SUMMA"
- Возле метки будет число — это и есть amount
- Если сумма встречается на чеке несколько раз (промежуточная и итоговая) — выбирай ту, что помечена как ИТОГО, или наибольшую из финальной части чека
- НЕ путай итог с ценами отдельных товаров или НДС

ШАГ 2 — НАЙДИ ДАТУ:
- Обычно в шапке или в подвале чека
- Форматы: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, DD-MM-YY
- Переведи в формат YYYY-MM-DD
- Если чек за 2024 или ранее — не путай с сегодняшним годом

ШАГ 3 — ОПРЕДЕЛИ ВАЛЮТУ:
- "сум", "сумов", "so'm", "UZS" → UZS
- "$", "USD", "долларов" → USD
- "€", "EUR", "евро" → EUR
- "₽", "руб", "рублей", "RUB" → RUB
- Если валюта не указана явно, но чек узбекский — UZS

ШАГ 4 — ОПРЕДЕЛИ ЧТО КУПЛЕНО (description):
- 3-8 слов о содержимом. Примеры:
  * "Бензин АИ-95, 38.5 л" (одна позиция)
  * "Продукты, Korzinka" (много позиций → тема + магазин)
  * "Лекарства, Dori-Darmon"
  * "Обед, ресторан Bosh Osh"
- Не включай сумму, валюту, дату

ШАГ 5 — ПОДБЕРИ КАТЕГОРИЮ:
- Известные категории: ${JSON.stringify(knownCats)}
- Правила: бензин/АЗС → "${t.categoriesExp[4]}", продукты/супермаркет → "${t.categoriesExp[0]}", коммуналка → "${t.categoriesExp[1]}", кафе/ресторан → "${t.categoriesExp[6]}", одежда/техника → "${t.categoriesExp[7]}"
- Если не подходит ни одна известная — предложи новую одним словом

Все текстовые поля возвращай на языке: ${language === 'ru' ? 'русский' : language === 'uz' ? "o'zbek" : language === 'en' ? 'English' : 'Türkçe'}.
Если данные нечитаемы даже после внимательного анализа — используй null для соответствующего поля.

Верни СТРОГО JSON без markdown:
{"amount": число_без_разделителей, "date": "YYYY-MM-DD" или null, "currency": "UZS"|"USD"|"EUR"|"RUB" или null, "description": "..." или null, "category": "..." или null}`;

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
          body: JSON.stringify({
            contents: [{ parts: [
              { inline_data: { mime_type: 'image/jpeg', data: base64 } },
              { text: prompt }
            ]}],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
              thinkingConfig: { thinkingBudget: 2048 }
            }
          })
        }
      );
      if (!response.ok) {
        let detail = 'HTTP ' + response.status;
        try {
          const errData = await response.json();
          if (errData?.error?.message) detail = errData.error.message;
        } catch (e) {}
        throw new Error(detail);
      }
      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('empty-response');
      let jsonText = String(raw).trim();
      if (jsonText.startsWith('```')) jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(jsonText);
      const amount = typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount);
      const date = parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : new Date().toISOString().split('T')[0];
      if (!amount || isNaN(amount)) throw new Error('no-amount-found');
      if (parsed.currency && currencies.includes(parsed.currency)) setCurrency(parsed.currency);
      const langCats = t.categoriesExp;
      let categoryValue = '';
      let customCategoryValue = '';
      if (parsed.category && langCats.includes(parsed.category)) {
        categoryValue = parsed.category;
      } else if (parsed.category) {
        categoryValue = langCats[langCats.length - 1]; // «Другое»
        customCategoryValue = parsed.category;
      }
      setFormType('expense');
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
      console.error('OCR error', err);
      const msg = err?.message || '';
      let userMsg = t.scanFailed;
      if (/api key|permission|unauthenticated|401|403/i.test(msg)) userMsg = t.scanFailedAuth;
      else if (/network|failed to fetch|load failed/i.test(msg)) userMsg = t.scanFailedNetwork;
      else if (msg === 'no-amount-found') userMsg = t.scanFailed;
      setScanError(userMsg + (msg ? ' [' + msg.slice(0, 90) + ']' : ''));
      setTimeout(() => setScanError(''), 8000);
    } finally {
      setScanning(false);
    }
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
      const knownCats = [...new Set([...t.categoriesInc, ...t.categoriesExp, ...transactions.map(tx => tx.category)])].filter(x => !['Другое','Boshqa','Other','Diğer'].includes(x));
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

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
          })
        }
      );
      if (!response.ok) {
        let detail = 'HTTP ' + response.status;
        try {
          const errData = await response.json();
          if (errData?.error?.message) detail = errData.error.message;
        } catch (e) {}
        throw new Error(detail);
      }
      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('empty-response');
      let jsonText = String(raw).trim();
      if (jsonText.startsWith('```')) jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(jsonText);
      const amount = typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount);
      if (!amount || isNaN(amount)) throw new Error('no-amount-found');
      const txType = parsed.type === 'income' ? 'income' : 'expense';
      const date = parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : new Date().toISOString().split('T')[0];
      if (parsed.currency && currencies.includes(parsed.currency)) setCurrency(parsed.currency);
      const langCats = txType === 'income' ? t.categoriesInc : t.categoriesExp;
      let categoryValue = '';
      let customCategoryValue = '';
      if (parsed.category && langCats.includes(parsed.category)) {
        categoryValue = parsed.category;
      } else if (parsed.category) {
        categoryValue = langCats[langCats.length - 1]; // «Другое»
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

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: finalSystem }] },
            contents: historyForApi,
            generationConfig: { temperature: 0.5 }
          })
        }
      );
      if (!response.ok) {
        let detail = 'HTTP ' + response.status;
        try {
          const errData = await response.json();
          if (errData?.error?.message) detail = errData.error.message;
        } catch (e) {}
        throw new Error(detail);
      }
      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('Пустой ответ от AI');
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

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.4
            }
          })
        }
      );
      if (!response.ok) {
        let detail = 'HTTP ' + response.status;
        try {
          const errData = await response.json();
          if (errData?.error?.message) detail = errData.error.message;
        } catch (e) {}
        throw new Error(detail);
      }
      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('empty-response');
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
    setShowSettings(false);
    setScanError('');
    setScanNotice(t.keySaved);
    setTimeout(() => setScanNotice(''), 2500);
  };

  const exportExcel = () => {
    const rows = reportData.map(tx => ({
      [t.date]: tx.date,
      [t.typeLabel]: tx.type === 'income' ? t.income : t.expense,
      [t.category]: tx.category,
      [t.description]: tx.description || '',
      [t.amount]: tx.amount,
      'Валюта': tx.currency
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
      'Валюта': tx.currency
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

  const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: c.bg, color: c.text, boxSizing: 'border-box', fontSize: '14px' };
  const chartTabStyle = (active) => ({ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid ' + c.border, backgroundColor: active ? c.saveBtn : c.card, color: active ? '#FFF' : c.text, cursor: 'pointer', fontWeight: active ? 500 : 400 });
  const tabStyle = (active) => ({ flex: 1, padding: '12px', fontSize: '14px', border: 'none', borderRadius: '8px', backgroundColor: active ? c.tabActive : 'transparent', color: active ? c.tabText : c.sec, cursor: 'pointer', fontWeight: active ? 600 : 400 });
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
            <button onClick={() => { setTempKey(geminiKey); setShowSettings(!showSettings); }} title={t.settings} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: showSettings ? c.saveBtn : c.card, color: showSettings ? '#fff' : c.text, cursor: 'pointer', fontSize: '13px' }}>⚙️</button>
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
            <div style={{ fontSize: '11px', color: c.sec, marginBottom: '12px', lineHeight: '1.5' }}>
              {t.apiKeyHint} <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: c.saveBtn, textDecoration: 'underline' }}>{t.getKey}</a>
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
          <button onClick={() => setActiveTab('assistant')} style={tabStyle(activeTab === 'assistant')}>{t.assistant}</button>
        </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: c.card, padding: '14px', borderRadius: '12px', border: '1px solid ' + c.border }}>
                <div style={{ fontSize: '10px', color: c.sec, letterSpacing: '0.5px' }}>{t.balance}</div>
                <div style={{ fontSize: '19px', fontWeight: 600, marginTop: '4px' }}>{balance.toLocaleString()} {currency}</div>
              </div>
              <div style={{ backgroundColor: c.card, padding: '14px', borderRadius: '12px', border: '1px solid ' + c.border }}>
                <div style={{ fontSize: '10px', color: c.incomeColor, letterSpacing: '0.5px' }}>{t.income}</div>
                <div style={{ fontSize: '19px', fontWeight: 600, marginTop: '4px', color: c.incomeColor }}>{income.toLocaleString()} {currency}</div>
              </div>
              <div style={{ backgroundColor: c.card, padding: '14px', borderRadius: '12px', border: '1px solid ' + c.border }}>
                <div style={{ fontSize: '10px', color: c.expenseColor, letterSpacing: '0.5px' }}>{t.expense}</div>
                <div style={{ fontSize: '19px', fontWeight: 600, marginTop: '4px', color: c.expenseColor }}>{expense.toLocaleString()} {currency}</div>
              </div>
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
                    </select>
                  </div>
                  {isOther && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec }}>{t.customCatPlaceholder}</label>
                      <input type="text" value={formData.customCategory} onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })} placeholder={t.customCatPlaceholder} style={{ ...inputStyle, border: '1px solid ' + c.saveBtn }} autoFocus />
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

            <div style={{ backgroundColor: c.card, padding: '18px', borderRadius: '12px', border: '1px solid ' + c.border, marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px' }}>{t.aiAnalysisTitle}</h3>
                {periodTransactions.length >= 3 && (
                  <button
                    onClick={runAiAnalysis}
                    disabled={aiAnalysisLoading}
                    style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '6px', border: '1px solid ' + c.border, backgroundColor: c.saveBtn, color: '#fff', cursor: aiAnalysisLoading ? 'wait' : 'pointer', fontWeight: 500, opacity: aiAnalysisLoading ? 0.7 : 1 }}
                  >
                    {aiAnalysisLoading ? '⏳ ' + t.aiAnalysisLoading : (aiAnalysis ? t.aiAnalysisRefresh : t.aiAnalysisRun)}
                  </button>
                )}
              </div>

              {aiAnalysisError && (
                <div style={{ backgroundColor: '#8B4548', color: '#fff', padding: '10px 14px', borderRadius: '8px', marginBottom: '10px', fontSize: '13px' }}>
                  {aiAnalysisError}
                </div>
              )}

              {aiAnalysis && !aiAnalysisLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                                <div style={{ fontSize: '11px', color: c.sec }}>{tx.description || ''} · {tx.date}</div>
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
                      <div style={{ fontSize: '11px', color: c.sec }}>{tx.description || ''} · {tx.date}</div>
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

        {activeTab === 'assistant' && (
          <div>
            <div style={{ backgroundColor: c.card, padding: '16px 18px', borderRadius: '12px', border: '1px solid ' + c.border, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '15px' }}>{t.chatTitle}</h3>
              {chatMessages.length > 0 && (
                <button onClick={clearChat} style={{ padding: '6px 10px', fontSize: '11px', border: '1px solid ' + c.border, borderRadius: '6px', backgroundColor: 'transparent', color: c.sec, cursor: 'pointer' }}>{t.chatClear}</button>
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
