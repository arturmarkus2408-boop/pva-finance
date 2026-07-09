import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
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
      noKeyError: 'Сначала добавьте API-ключ в ⚙️ Настройки', close: 'Закрыть',
      recognized: 'Проверьте данные и сохраните', fromGallery: 'Из галереи'
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
      noKeyError: 'Avval ⚙️ Sozlamalarga API kalitni qo\'shing', close: 'Yopish',
      recognized: "Ma'lumotlarni tekshirib saqlang", fromGallery: 'Galereyadan'
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
      noKeyError: 'First add an API key in ⚙️ Settings', close: 'Close',
      recognized: 'Verify data and save', fromGallery: 'From gallery'
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
      noKeyError: 'Önce ⚙️ Ayarlar bölümünden API anahtarı ekleyin', close: 'Kapat',
      recognized: 'Verileri kontrol edip kaydedin', fromGallery: 'Galeriden'
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
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem('walletData', JSON.stringify({ transactions, theme, language, currency, currencies, dashboardPeriod }));
  }, [transactions, theme, language, currency, currencies, dashboardPeriod]);

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
  const chartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
  const chartColors = ['#1B2845', '#3F7D58', '#8B4548', '#B07D3F', '#C9A84C', '#2D6A4F', '#E24B4A', '#2C4A6E'];

  // Для столбчатой: топ-6 + свернуть остальное в «Прочее»
  const barData = (() => {
    if (chartData.length <= 7) return chartData;
    const sorted = [...chartData].sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 6);
    const rest = sorted.slice(6);
    const other = { name: t.otherCategory, value: rest.reduce((s, x) => s + x.value, 0) };
    return [...top, other];
  })();

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
  const compressImage = (file, maxSide = 1600, quality = 0.85) => new Promise((resolve, reject) => {
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
      const prompt = 'Проанализируй фотографию чека. Найди итоговую сумму (ИТОГО, К оплате, TOTAL, TO PAY и т.п.) и дату чека. Верни СТРОГО JSON без markdown и лишнего текста в формате: {"amount": число_без_разделителей_и_валюты, "date": "YYYY-MM-DD"}. Если сумма или дата нечитаемы — используй null. Если дата на чеке в формате DD.MM.YYYY или DD/MM/YYYY — переведи в YYYY-MM-DD.';
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(geminiKey),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [
              { inline_data: { mime_type: 'image/jpeg', data: base64 } },
              { text: prompt }
            ]}],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
          })
        }
      );
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('Empty response');
      let jsonText = String(raw).trim();
      if (jsonText.startsWith('```')) jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(jsonText);
      const amount = typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount);
      const date = parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : new Date().toISOString().split('T')[0];
      if (!amount || isNaN(amount)) throw new Error('No amount');
      setFormType('expense');
      setEditingId(null);
      setFormData({
        amount: String(amount),
        category: '',
        customCategory: '',
        description: '',
        date
      });
      setShowForm(true);
      setActiveTab('dashboard');
      setScanNotice(t.recognized);
      setTimeout(() => setScanNotice(''), 4000);
    } catch (err) {
      console.error('OCR error', err);
      setScanError(t.scanFailed);
      setTimeout(() => setScanError(''), 5000);
    } finally {
      setScanning(false);
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
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                style={{ flex: 1, padding: '13px', backgroundColor: c.saveBtn, color: 'white', border: 'none', borderRadius: '8px', cursor: scanning ? 'wait' : 'pointer', fontWeight: 500, fontSize: '14px', opacity: scanning ? 0.7 : 1 }}
              >
                {scanning ? '⏳ ' + t.scanning : t.receiptPhoto}
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={scanning}
                title={t.fromGallery}
                aria-label={t.fromGallery}
                style={{ padding: '13px 18px', backgroundColor: c.card, color: c.text, border: '1px solid ' + c.border, borderRadius: '8px', cursor: scanning ? 'wait' : 'pointer', fontSize: '18px', opacity: scanning ? 0.7 : 1 }}
              >
                📎
              </button>
            </div>

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

                {chartType === 'pie' && chartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%" cy="45%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ percent }) => percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : ''}
                        labelLine={false}
                      >
                        {chartData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: c.card, border: '1px solid ' + c.border, color: c.text, fontSize: '12px' }}
                        formatter={(v) => [v.toLocaleString() + ' ' + currency, '']}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={70}
                        wrapperStyle={{ fontSize: '11px', color: c.text, paddingTop: '10px' }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'bar' && chartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 55 }}>
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
                      <YAxis stroke={c.text} style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: c.card, border: '1px solid ' + c.border, color: c.text, fontSize: '12px' }}
                        formatter={(v) => [v.toLocaleString() + ' ' + currency, '']}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar dataKey="value" fill={c.expenseColor} radius={[6, 6, 0, 0]} />
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

            <div style={{ backgroundColor: c.card, padding: '18px', borderRadius: '12px', border: '1px solid ' + c.border }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '15px' }}>{t.recent}</h3>
              {transactions.length === 0 ? (
                <div style={{ color: c.sec, textAlign: 'center', padding: '20px' }}>{t.noOperations}</div>
              ) : (
                transactions.slice().reverse().map((tx, i) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < transactions.length - 1 ? '1px solid ' + c.border : 'none', gap: '10px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '14px' }}>{tx.category}</div>
                      <div style={{ fontSize: '11px', color: c.sec }}>{tx.description || ''} · {tx.date}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: tx.type === 'income' ? c.incomeColor : c.expenseColor, fontWeight: 600, fontSize: '14px' }}>
                        {tx.type === 'income' ? '+' : '−'}{tx.amount.toLocaleString()} {tx.currency}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '3px', justifyContent: 'flex-end' }}>
                        <button onClick={() => startEdit(tx)} style={{ fontSize: '11px', background: 'none', border: 'none', color: c.saveBtn, cursor: 'pointer', padding: 0, fontWeight: 500 }}>{t.edit}</button>
                        <button onClick={() => deleteTransaction(tx.id)} style={{ fontSize: '11px', background: 'none', border: 'none', color: '#E24B4A', cursor: 'pointer', padding: 0, fontWeight: 500 }}>{t.delete}</button>
                      </div>
                    </div>
                  </div>
                ))
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
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={exportExcel} style={{ flex: 1, padding: '11px', backgroundColor: '#1E5C3A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>📊 {t.exportExcel}</button>
                <button onClick={exportPDF} style={{ flex: 1, padding: '11px', backgroundColor: '#8B2020', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>📄 {t.exportPDF}</button>
              </div>
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

      </div>
    </div>
  );
};

export default App;
