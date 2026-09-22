import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, LabelList } from 'recharts';
import * as XLSX from 'xlsx';
import './App.css';
import { tr as translations } from './i18n';
import { todayLocal, toIsoDate, newId, parseAmount, normalizeCurrencyName } from './lib/date';
import { guessCategory } from './lib/categoryGuess';
import { buildReportPdf, preloadPdfTools } from './lib/pdfReport';
import { parseBankSms } from './lib/smsParser';
import { isSameTx } from './lib/matching';
import { computeReconciliation } from './lib/reconciliation';
import { applyCardCurrency } from './lib/currencyConversion';

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
    date: todayLocal()
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
  const [pendingPdf, setPendingPdf] = useState(null); // готовый PDF, если меню не успело открыться
  const [expandedMonths, setExpandedMonths] = useState(new Set());
  const [expandedYears, setExpandedYears] = useState(new Set());
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState('');
  const [aiAnalysisPeriod, setAiAnalysisPeriod] = useState('');
  const [aiExpanded, setAiExpanded] = useState(false);
  const [importItems, setImportItems] = useState(null);
  // Голосовой ввод: живой текст во время диктовки и итоговая фраза для окна сверки
  const [voiceText, setVoiceText] = useState('');
  const [voiceHeard, setVoiceHeard] = useState('');
  const recRef = useRef(null);
  const voiceFinalRef = useRef('');
  const voiceInterimRef = useRef('');
  const voiceCancelledRef = useRef(false);
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
  // Сверка: точка, с которой начинать сравнение по каждой карте («Принять остаток банка»)
  const [reconAnchors, setReconAnchors] = useState({});
  const [reconOpen, setReconOpen] = useState(null);
  // Список последних операций: свёрнут по умолчанию
  const [recentOpen, setRecentOpen] = useState(false);
  const [recentShowAll, setRecentShowAll] = useState(false);
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
  const [inboxStatus, setInboxStatus] = useState(null); // { ok: bool, text } — ответ под кнопкой в настройках
  const [pendingAckIds, setPendingAckIds] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatUseFinData, setChatUseFinData] = useState(false);
  const chatEndRef = useRef(null);
  // Форма операции стоит вверху главного экрана. При «Редактировать» из списка внизу
  // её не было видно, и казалось, что кнопка не работает — теперь экран прокручивается к ней.
  const txFormRef = useRef(null);
  useEffect(() => {
    if (!showForm) return;
    const id = setTimeout(() => {
      if (txFormRef.current) txFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => clearTimeout(id);
  }, [showForm, editingId]);
  const isFirstRender = useRef(true);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const t = translations[language];

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
        if (data.reconAnchors && typeof data.reconAnchors === 'object') setReconAnchors(data.reconAnchors);
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
    try {
      localStorage.setItem('walletData', JSON.stringify({ transactions, theme, language, currency, currencies, dashboardPeriod, customCats, ownerName, myCards, plans, rates, baseCurrency, budgets, recurring, tags, lastBackup, reconAnchors }));
    } catch {
      // Раньше ошибка здесь роняла всё приложение в белый экран, а данные молча не сохранялись
      setTimeout(() => setScanError(translations[language].storageFull), 0);
    }
  }, [transactions, theme, language, currency, currencies, dashboardPeriod, customCats, ownerName, myCards, plans, rates, baseCurrency, budgets, recurring, tags, lastBackup, reconAnchors]);

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
    if (!(parseAmount(formData.amount) > 0) || !finalCategory) return;
    if (isNewCat) addCategory(formType, finalCategory);
    if (editingId) {
      setTransactions(transactions.map(tx => tx.id === editingId ? { ...tx, amount: parseAmount(formData.amount), category: finalCategory, description: formData.description, tag: formData.tag, date: formData.date } : tx));
      setEditingId(null);
    } else {
      const amountNum = parseAmount(formData.amount);
      setTransactions([...transactions, { id: newId(), type: formType, amount: amountNum, category: finalCategory, description: formData.description, tag: formData.tag, currency, date: formData.date }]);
      // Эта трата перевалила за месячный лимит? Предупреждаем сразу, а не когда пользователь сам заметит
      if (formType === 'expense') {
        const lim = parseFloat(budgets[currency + '|' + finalCategory]);
        if (lim > 0) {
          const month = formData.date.slice(0, 7);
          const spentBefore = transactions
            .filter(tx => tx.type === 'expense' && tx.currency === currency && tx.category === finalCategory && tx.date.slice(0, 7) === month)
            .reduce((a, tx) => a + tx.amount, 0);
          if (spentBefore <= lim && spentBefore + amountNum > lim) {
            setScanError('⚠ ' + t.budgetJustExceeded + ': ' + finalCategory + ' (' + Math.round(spentBefore + amountNum - lim).toLocaleString() + ' ' + currency + ')');
            setTimeout(() => setScanError(''), 7000);
          }
        }
      }
    }
    setFormData({ amount: '', category: '', customCategory: '', description: '', tag: '', date: todayLocal() });
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

  const deleteTransaction = (id) => {
    const tx = transactions.find(x => x.id === id);
    const label = tx ? (tx.type === 'income' ? '+' : '−') + tx.amount.toLocaleString() + ' ' + tx.currency + ' · ' + tx.category : '';
    if (!window.confirm(t.confirmDeleteTx + (label ? '\n\n' + label : ''))) return;
    setTransactions(transactions.filter(x => x.id !== id));
  };

  // ===== ПЛАНЫ И ДОЛГИ =====
  // Три вида записей: запланированная покупка, мой долг кому-то, чужой долг мне.
  // Запись висит активной, пока пользователь сам её не закроет.
  // Пересчитывается при каждой отрисовке: приложение на телефоне может жить в фоне
  // днями, и замороженная при запуске дата ломала сроки долгов и даты закрытия.
  const todayStr = todayLocal();
  // Возврат в приложение из фона: перерисовать всё, что зависит от даты,
  // и проверить почтовый ящик с SMS (раньше он проверялся только при полном перезапуске)
  const [, setResumeTick] = useState(0);

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
      setPlans([...plans, { id: newId(), ...payload, done: false, doneAt: null, createdAt: todayStr }]);
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
        id: newId(),
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


  // Переименование валюты. Если новое имя уже занято — валюты объединяются.
  // Меняется всё, что ссылается на валюту: операции, лимиты, платежи, планы, курсы, привязки карт.
  const renameCurrency = (from) => {
    const raw = window.prompt(t.currencyRenamePrompt, from);
    if (raw == null) return;
    const cleaned = normalizeCurrencyName(raw);
    if (!cleaned) { window.alert(t.currencyNameInvalid); return; }
    // Совпадение без учёта регистра — это объединение с уже существующей валютой
    const to = currencies.find(cur => cur !== from && cur.toLowerCase() === cleaned.toLowerCase()) || cleaned;
    if (to === from) return;
    if (currencies.includes(to)) {
      const msg = t.currencyMergeConfirm.split('{from}').join(from).split('{to}').join(to);
      if (!window.confirm(msg)) return;
    }
    const swap = (x) => (x === from ? to : x);
    setTransactions(prev => prev.map(tx => tx.currency === from ? { ...tx, currency: to } : tx));
    setCurrencies(prev => [...new Set(prev.map(swap))]);
    if (currency === from) setCurrency(to);
    if (baseCurrency === from) setBaseCurrency(to);
    setRates(prev => {
      const n = { ...prev };
      if (n[from] != null && n[to] == null) n[to] = n[from];
      delete n[from];
      return n;
    });
    setBudgets(prev => {
      const n = {};
      Object.entries(prev).forEach(([k, v]) => {
        const sep = k.indexOf('|');
        const cur = k.slice(0, sep);
        n[(cur === from ? to : cur) + k.slice(sep)] = v;
      });
      return n;
    });
    setRecurring(prev => prev.map(r => r.currency === from ? { ...r, currency: to } : r));
    setPlans(prev => prev.map(pl => pl.currency === from ? { ...pl, currency: to } : pl));
    setMyCards(prev => prev.map(mc => mc.currency === from ? { ...mc, currency: to } : mc));
    setReconAnchors(prev => {
      const n = {};
      Object.entries(prev).forEach(([k, v]) => {
        const [card, cur] = k.split('|');
        n[card + '|' + swap(cur)] = v;
      });
      return n;
    });
  };

  const deleteCurrency = (cur) => {
    if (currencies.length <= 1) { window.alert(t.currencyLastOne); return; }
    const used = transactions.filter(tx => tx.currency === cur).length;
    if (used > 0) {
      const msg = t.currencyInUseConfirm.split('{cur}').join(cur).split('{n}').join(String(used));
      if (!window.confirm(msg)) return;
      setTransactions(prev => prev.filter(tx => tx.currency !== cur));
    }
    const next = currencies.filter(x => x !== cur);
    setCurrencies(next);
    if (currency === cur) setCurrency(next[0]);
    if (baseCurrency === cur) setBaseCurrency(next[0]);
    setRates(prev => { const n = { ...prev }; delete n[cur]; return n; });
    setBudgets(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(cur + '|'))));
    setRecurring(prev => prev.filter(r => r.currency !== cur));
    setMyCards(prev => prev.map(mc => mc.currency === cur ? { ...mc, currency: '' } : mc));
  };

  // В какой валюте вести операции по карте.
  // Сначала смотрим явную привязку в «Моих картах», затем — валюту,
  // в названии которой стоят те же 4 цифры (например «KPTL *1515»).
  const cardCurrencyOf = (last4) => {
    if (!last4) return null;
    const bound = myCards.find(mc => mc.last4 === last4 && mc.currency);
    if (bound && currencies.includes(bound.currency)) return bound.currency;
    return currencies.find(cur => cur.replace(/\D/g, '').endsWith(last4)) || null;
  };

  const addCurrency = () => {
    const val = normalizeCurrencyName(newCurrency);
    if (!val) {
      if (newCurrency.trim()) { window.alert(t.currencyNameInvalid); return; }
      setShowCurrencyInput(false);
      return;
    }
    // «Kapital uzcard» и «KAPITAL UZCARD» — одна и та же валюта
    const existing = currencies.find(cur => cur.toLowerCase() === val.toLowerCase());
    if (existing) {
      setCurrency(existing);
    } else {
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
        return { fromStr: toIsoDate(today), toStr: toIsoDate(today), label: today.toLocaleDateString(language === 'en' ? 'en-GB' : language) };
      case 'week': {
        const day = today.getDay() || 7; // Пн=1..Вс=7
        const monday = new Date(today);
        monday.setDate(today.getDate() - (day - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return { fromStr: toIsoDate(monday), toStr: toIsoDate(sunday), label: monday.toLocaleDateString(language === 'en' ? 'en-GB' : language) + ' — ' + today.toLocaleDateString(language === 'en' ? 'en-GB' : language) };
      }
      case 'month': {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { fromStr: toIsoDate(first), toStr: toIsoDate(lastDay), label: first.toLocaleDateString(language === 'en' ? 'en-GB' : language, { month: 'long', year: 'numeric' }) };
      }
      case 'year': {
        const first = new Date(now.getFullYear(), 0, 1);
        return { fromStr: toIsoDate(first), toStr: now.getFullYear() + '-12-31', label: String(now.getFullYear()) };
      }
      case 'all':
      default:
        return { fromStr: null, toStr: null, label: t.periodAll };
    }
  };

  const { fromStr: periodFromStr, toStr: periodToStr, label: periodLabel } = getPeriodRange(dashboardPeriod);

  const periodTransactions = transactions.filter(tx => {
    if (tx.currency !== currency) return false;
    if (periodFromStr && tx.date < periodFromStr) return false;
    if (periodToStr && tx.date > periodToStr) return false;
    return true;
  });

  // Операции за тот же период в ДРУГИХ валютах. Главный экран считает только выбранную
  // валюту, и доллары с карты *1515 просто не было видно. Теперь они показываются строкой ниже.
  const otherCurrencyTotals = (() => {
    const map = {};
    transactions.forEach(tx => {
      if (tx.currency === currency) return;
      if (periodFromStr && tx.date < periodFromStr) return;
      if (periodToStr && tx.date > periodToStr) return;
      const m = map[tx.currency] || (map[tx.currency] = { cur: tx.currency, income: 0, expense: 0 });
      if (tx.type === 'income') m.income += tx.amount; else m.expense += tx.amount;
    });
    return Object.values(map).sort((a, b) => (b.expense + b.income) - (a.expense + a.income));
  })();

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

  // Пересчитывается только когда меняются операции, а не при каждом нажатии клавиши
  const balanceByCurrency = useMemo(() => {
    const map = {};
    transactions.forEach(tx => {
      if (!map[tx.currency]) map[tx.currency] = 0;
      map[tx.currency] += tx.type === 'income' ? tx.amount : -tx.amount;
    });
    return map;
  }, [transactions]);

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
  const reconciliation = useMemo(() => computeReconciliation(transactions, reconAnchors), [transactions, reconAnchors]);

  // «Принять остаток банка»: сверка по карте начинается с последней точки заново
  const acceptBankBalance = (rc) => {
    if (!window.confirm(t.reconAcceptConfirm)) return;
    setReconAnchors(prev => ({ ...prev, [rc.key]: rc.date + ' ' + (rc.time || '00:00') }));
    setReconOpen(null);
    setScanNotice(t.reconAccepted);
    setTimeout(() => setScanNotice(''), 3500);
  };

  // «Внести разницу»: добавляет операцию на сумму расхождения в том отрезке, где оно возникло.
  // Операция ставится на ту же минуту, что и банковская точка, поэтому сразу закрывает разрыв.
  const addReconDifference = (rc, step) => {
    const gap = step.gap;
    const type = gap < 0 ? 'expense' : 'income';
    const list = catsFor(type);
    setTransactions(prev => [...prev, {
      id: newId(),
      type,
      amount: Math.abs(gap),
      category: list[list.length - 1],
      description: t.reconMissingDesc + ' ***' + rc.card,
      currency: rc.currency,
      date: step.tx.date,
      time: step.tx.time || null,
      card: rc.card,
      source: 'recon'
    }]);
  };

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
        .filter(tx => tx.type === 'expense' && tx.currency === currency && tx.category === cat && tx.date.slice(0, 7) === monthStart.slice(0, 7))
        .reduce((sum, tx) => sum + tx.amount, 0);
      const lim = parseFloat(limit);
      return { key, cat, limit: lim, spent, left: lim - spent, pct: Math.min(100, Math.round(spent / lim * 100)) };
    })
    .sort((a, b) => b.pct - a.pct);

  // ===== РЕГУЛЯРНЫЕ ПЛАТЕЖИ =====
  // Считаем платёж «созревшим», если наступил его день месяца, а в этом месяце его ещё не вносили.
  const currentMonthKey = monthStart.slice(0, 7);
  const recurringDue = recurring.filter(r => {
    if (r.active === false) return false;
    if (r.lastPosted === currentMonthKey || r.skipped === currentMonthKey) return false;
    const today = new Date().getDate();
    return today >= Math.min(28, parseInt(r.day, 10) || 1);
  });

  // Платёж, который наступит завтра — мягкое предупреждение заранее
  const recurringUpcoming = (() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const key = toIsoDate(tmr).slice(0, 7);
    return recurring.filter(r => r.active !== false &&
      (parseInt(r.day, 10) || 1) === tmr.getDate() &&
      r.lastPosted !== key && r.skipped !== key);
  })();

  const toggleRecurring = (id) => setRecurring(prev => prev.map(x => x.id === id ? { ...x, active: x.active === false } : x));

  const postRecurring = (r) => {
    setTransactions(prev => [...prev, {
      id: newId(),
      type: r.type || 'expense',
      amount: parseFloat(r.amount),
      category: r.category,
      description: r.description || '',
      currency: r.currency,
      date: todayLocal(),
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
      data: { transactions, theme, language, currency, currencies, dashboardPeriod, customCats, ownerName, myCards, plans, rates, baseCurrency, budgets, recurring, tags, reconAnchors, chat: chatMessages.slice(-40) }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wallet-backup-' + todayLocal() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setLastBackup(todayLocal());
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
      if (d.reconAnchors) setReconAnchors(d.reconAnchors);
      if (Array.isArray(d.chat)) {
        setChatMessages(d.chat);
        try { localStorage.setItem('walletChat', JSON.stringify(d.chat)); } catch { /* память переполнена — не критично */ }
      }
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
      : todayLocal();
    const time = typeof raw?.time === 'string' && /^\d{2}:\d{2}$/.test(raw.time) ? raw.time : null;
    const cardDigits = raw?.card ? String(raw.card).replace(/\D/g, '') : '';
    const card = cardDigits.length >= 4 ? cardDigits.slice(-4) : null;
    // Сначала ищем среди валют пользователя (включая свои названия вроде «Kapital uzcard»),
    // потом принимаем стандартный трёхбуквенный код, иначе — текущая валюта
    const rawCur = typeof raw?.currency === 'string' ? raw.currency.trim() : '';
    const knownCur = rawCur ? currencies.find(cur => cur.toLowerCase() === rawCur.toLowerCase()) : null;
    const currencyVal = knownCur || (/^[A-Za-z]{3}$/.test(rawCur) ? rawCur.toUpperCase() : currency);
    const catList = fallbackCats(type);
    // Категория: от распознавания (AI), иначе подбор по получателю, иначе «Другое» из списка
    // пользователя. Последняя по порядку категория больше не подставляется: туда попадали
    // категории вроде «Бухгалтерия …», которые пользователь просто добавил последними.
    const category = (typeof raw?.category === 'string' && raw.category.trim())
      ? raw.category.trim()
      : (guessCategory([raw?.description, raw?.counterparty].filter(Boolean).join(' '), catList)
        || t.otherCategory);
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
  // ===== ПЕРЕСЧЁТ В ВАЛЮТУ КАРТЫ =====
  // Пример: долларовая карта, магазин берёт 45 000 сум, банк списывает доллары.
  // В SMS видны сумма в сумах и остаток в долларах. Самая точная сумма в долларах —
  // разница остатков до и после операции: её посчитал сам банк, вместе с курсом и комиссией.
  // Если предыдущего остатка нет — пересчитываем по курсу из настроек.
  // Если нет и курса — оставляем сумму как есть и просим пользователя проверить.

  const buildReview = (rawItems) => {
    const items = applyCardCurrency(rawItems, { transactions, cardCurrencyOf, rateOf });
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

  // ===== ПОЧТОВЫЙ ЯЩИК: ЗАБРАТЬ НАКОПЛЕННЫЕ SMS С СЕРВЕРА =====
  // Сервер только передаёт текст. Разбор, сверка с базой и решение, что вносить,
  // как и раньше происходят здесь, на устройстве.
  const fetchInbox = async (silent, keyOverride) => {
    const key = keyOverride || inboxKey;
    if (!key || inboxBusy) return;
    setInboxBusy(true);
    if (!silent) setInboxStatus(null);
    try {
      const resp = await fetch('/api/inbox', { headers: { 'x-wallet-key': key } });
      if (resp.status === 401) throw new Error('bad-key');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length === 0) {
        if (!silent) { setInboxStatus({ ok: true, text: t.inboxEmpty }); setScanNotice(t.inboxEmpty); setTimeout(() => setScanNotice(''), 3000); }
        return;
      }
      const raw = items.flatMap(m => parseBankSms(m.text));
      const normalized = raw.map(x => normalizeScannedItem(x, catsFor)).filter(Boolean);
      if (normalized.length === 0) {
        if (!silent) { setInboxStatus({ ok: false, text: t.inboxNoParse }); setScanError(t.inboxNoParse); setTimeout(() => setScanError(''), 6000); }
        return;
      }
      setPendingAckIds(items.map(m => m.id));
      setImportItems(buildReview(normalized));
      setActiveTab('dashboard');
    } catch (err) {
      if (!silent) {
        setInboxStatus({ ok: false, text: err?.message === 'bad-key' ? t.inboxBadKey : t.inboxFail });
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

  // Возврат в приложение из фона. Подписка обновляется на каждой отрисовке,
  // чтобы сверка новых SMS шла с актуальным списком операций, а не со старым.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      setResumeTick(x => x + 1);
      if (inboxKey) fetchInbox(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });

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
      const todayStr = todayLocal();
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
          date: only.date,
          tag: ''
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
    const newTx = chosen.map((i) => {
      const parts = [i.description, i.counterparty].filter(Boolean);
      if (i.exchangedTo) parts.push(t.importExchange + ' ' + i.exchangedTo);
      if (i.fee > 0) parts.push(t.importFee + ' ' + i.fee.toLocaleString());
      return {
        id: newId(),
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
        originalAmount: i.originalAmount ?? null,
        originalCurrency: i.originalCurrency || null,
        source: i.source || 'import'
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
  // ===== ГОЛОСОВОЙ ВВОД =====
  // Слушаем непрерывно, пока человек сам не нажмёт «Готово»: паузы, раздумья
  // и несколько операций подряд — нормальная речь, а не повод оборвать запись.
  const startVoiceInput = () => {
    // Повторное нажатие на микрофон во время записи = «Готово»
    if (listening) { recRef.current?.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setScanError(t.voiceNotSupported);
      setTimeout(() => setScanError(''), 5000);
      return;
    }
    if (!geminiKey && !groqKey && !orKey) {
      setScanError(t.noKeyError);
      setShowSettings(true);
      setTimeout(() => setScanError(''), 5000);
      return;
    }
    const langMap = { ru: 'ru-RU', uz: 'uz-UZ', en: 'en-US', tr: 'tr-TR' };
    const rec = new SR();
    rec.lang = langMap[language] || 'ru-RU';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    voiceFinalRef.current = '';
    voiceInterimRef.current = '';
    voiceCancelledRef.current = false;
    setVoiceText('');

    rec.onstart = () => { setListening(true); setScanError(''); setScanNotice(''); };

    rec.onresult = (e) => {
      // Текст собирается заново из всего списка на каждом событии — так не бывает дублей.
      // Особенность Chrome на Android: следующий кусок иногда уже содержит предыдущий
      // целиком. Тогда кусок заменяется, а не дописывается.
      const finals = [];
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const piece = (e.results[i][0]?.transcript || '').trim();
        if (!piece) continue;
        if (e.results[i].isFinal) {
          const prev = finals[finals.length - 1];
          if (prev && piece.toLowerCase().startsWith(prev.toLowerCase())) finals[finals.length - 1] = piece;
          else finals.push(piece);
        } else {
          interim = piece;
        }
      }
      voiceFinalRef.current = finals.join(' ');
      voiceInterimRef.current = interim;
      setVoiceText((voiceFinalRef.current + ' ' + interim).trim());
    };

    rec.onerror = (e) => {
      if (e.error === 'aborted') return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        voiceCancelledRef.current = true;
        setScanError(t.micDenied);
        setTimeout(() => setScanError(''), 5000);
      } else if (e.error === 'no-speech' && !voiceFinalRef.current && !voiceInterimRef.current) {
        voiceCancelledRef.current = true;
        setScanError(t.noSpeech);
        setTimeout(() => setScanError(''), 5000);
      }
      // Прочие ошибки посреди диктовки не страшны: то, что уже услышано, разберём в onend
    };

    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      const fin = voiceFinalRef.current.trim();
      const tail = voiceInterimRef.current.trim();
      // Если «Готово» нажали посреди фразы, последний кусок мог не успеть стать окончательным
      const text = (tail && !fin.toLowerCase().endsWith(tail.toLowerCase()) ? fin + ' ' + tail : fin).trim();
      setVoiceText('');
      if (voiceCancelledRef.current || !text) return;
      parseVoiceText(text);
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setListening(false);
      recRef.current = null;
      setScanError(t.voiceParseError);
      setTimeout(() => setScanError(''), 5000);
    }
  };

  const cancelVoiceInput = () => {
    voiceCancelledRef.current = true;
    recRef.current?.abort();
  };

  // Разбор надиктованного: ИИ находит ВСЕ операции в хаотичной речи,
  // а результат, как и у SMS и фото, идёт в окно сверки — ничего не вносится молча.
  const parseVoiceText = async (text) => {
    setScanning(true);
    try {
      const today = todayLocal();
      const cardsInfo = myCards.length
        ? myCards.map(mc => {
            const cur = cardCurrencyOf(mc.last4);
            return '***' + mc.last4 + (mc.label ? ' «' + mc.label + '»' : '') + (cur ? ' — валюта «' + cur + '»' : '');
          }).join('; ')
        : 'не указаны';
      const langWord = language === 'ru' ? 'русский' : language === 'uz' ? "o'zbek" : language === 'en' ? 'English' : 'Türkçe';
      const prompt = `Ты разбираешь речь, которую пользователь финансового приложения надиктовал голосом.
Речь живая и хаотичная: паузы, повторы, слова-паразиты, оговорки, поправки, несколько операций подряд вперемешку.
Твоя задача — понять СУТЬ и извлечь ВСЕ денежные операции, которые человек уже совершил.

ПРАВИЛА:
1. Каждая отдельная трата или поступление — отдельный объект в items.
2. Поправки: «пятьдесят, нет, шестьдесят тысяч» → 60000. Всегда бери последний названный вариант.
   «Ой, не на бензин, а на продукты» → категория продукты.
3. Числа словами и сокращения: «пятьдесят тысяч» → 50000, «полтора миллиона» → 1500000, «полтинник» → 50000,
   «три с половиной доллара» → 3.5, «двадцать долларов пятьдесят центов» → 20.5, «500к» → 500000, «2 ляма» → 2000000.
   Распознаватель речи иногда пишет цифрами с пробелами: «50 000», «1 500 000» — это одно число.
4. Тип: потратил, купил, оплатил, заплатил, отдал, перевёл, скинул, снял → "expense";
   получил, пришло, зарплата, вернули мне, поступило, заработал, дали → "income".
5. Валюты пользователя: ${JSON.stringify(currencies)}. В поле currency возвращай ТОЧНО одно название из этого списка.
   Если человек говорит своими словами («с капитал визы», «с узкарда», «в долларах», «сумов») — выбери подходящее по смыслу.
   Валюта не названа → null (будет использована текущая: «${currency}»).
6. Карты пользователя: ${cardsInfo}.
   Назвал карту (по цифрам или по названию) → верни её 4 цифры в card и валюту этой карты в currency.
7. Дата: «сегодня», «вчера», «позавчера», «в понедельник», «пятнадцатого» → YYYY-MM-DD. Не названа → null.
   Сегодня ${today}. Дата не может быть в будущем.
8. Категория расходов — из списка ${JSON.stringify(catsFor('expense'))}; доходов — из ${JSON.stringify(catsFor('income'))}.
   Ничего не подходит — предложи одно короткое слово.
9. description — коротко и по сути, что куплено или за что: «бензин», «обед с Андреем», «аренда офиса». Без суммы и даты.
10. Долги: «отдал Андрею долг», «Костя вернул сто долларов» → "isDebt": true, имя человека в counterparty.
11. НЕ выдумывай. Планы на будущее («надо будет купить», «завтра заплачу»), вопросы и рассуждения — это НЕ операции.
12. Если сумма расслышана неуверенно или непонятно, трата это или приход — всё равно верни операцию, но с "needsCheck": true.

Все текстовые поля — на языке: ${langWord}.

Верни СТРОГО JSON без markdown:
{"items":[{"type":"expense" или "income","amount":число,"currency":"название из списка" или null,"date":"YYYY-MM-DD" или null,"card":"1234" или null,"category":"...","description":"...","counterparty":"" ,"isDebt":false,"needsCheck":false}]}

Речь пользователя:
«${text.replace(/[«»]/g, '"')}»`;

      const raw = await callTextWithFallback(
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', thinkingConfig: { thinkingLevel: 'low' } }
        },
        'Ты разбираешь надиктованную речь для финансового приложения. Отвечай строго JSON без markdown.',
        prompt,
        true
      );
      let jsonText = String(raw).trim();
      if (jsonText.startsWith('```')) jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(jsonText);
      const rawItems = Array.isArray(parsed?.items) ? parsed.items : (parsed?.amount ? [parsed] : []);
      const normalized = rawItems
        .map(r => normalizeScannedItem(r, catsFor))
        .filter(Boolean)
        .map(x => ({ ...x, source: 'voice' }));
      if (normalized.length === 0) throw new Error('voice-nothing');
      setVoiceHeard(text);
      setImportItems(buildReview(normalized));
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Voice parse error', err);
      const msg = err?.message || '';
      let userMsg = t.voiceParseError;
      if (msg === 'voice-nothing') userMsg = t.voiceNothing + ': «' + text.slice(0, 120) + '»';
      else if (/api key|permission|unauthenticated|401|403/i.test(msg)) userMsg = t.scanFailedAuth;
      else if (/network|failed to fetch|load failed/i.test(msg)) userMsg = t.scanFailedNetwork;
      setScanError(userMsg + (msg && msg !== 'voice-nothing' ? ' [' + msg.slice(0, 90) + ']' : ''));
      setTimeout(() => setScanError(''), 9000);
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
      [t.currencyCol]: tx.currency,
      [t.importCard]: tx.card ? '***' + tx.card : ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Wallet');
    XLSX.writeFile(wb, 'wallet-report.xlsx');
  };

  // ===== ПОДЕЛИТЬСЯ ОТЧЁТОМ: НАСТОЯЩИЙ PDF ЧЕРЕЗ МЕНЮ «ПОДЕЛИТЬСЯ» =====
  // Раньше отправлялся Excel, а Android не разрешает сайтам делиться таким файлом —
  // он молча падал в «Загрузки». PDF разрешён: откроется меню, в нём Telegram.
  const sendPdfFile = async (file) => {
    try {
      await navigator.share({ files: [file], title: t.shareTitle });
      setPendingPdf(null);
      setShareNotice('');
    } catch (err) {
      if (err && err.name === 'AbortError') { setPendingPdf(null); setShareNotice(''); return; }
      // Телефон отменил показ меню, потому что PDF собирался слишком долго:
      // файл готов, повторное нажатие откроет меню сразу
      setPendingPdf(file);
      setShareNotice(t.sharePdfReady);
    }
  };

  const shareReport = async () => {
    setPendingPdf(null);
    setShareNotice(t.sharePdfBuilding);
    let blob;
    try {
      const balanceNow = reportIncome - reportExpense;
      const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
      const range = [filterFrom && (t.dateFrom + ': ' + filterFrom), filterTo && (t.dateTo + ': ' + filterTo)].filter(Boolean).join('   ');
      blob = await buildReportPdf({
        title: 'Wallet — ' + t.reportTitle,
        subtitle: [range, currency].filter(Boolean).join('  ·  '),
        kpis: [
          { label: t.totalIncome, value: fmt(reportIncome) + ' ' + currency, tone: 'income' },
          { label: t.totalExpense, value: fmt(reportExpense) + ' ' + currency, tone: 'expense' },
          { label: t.totalBalance, value: fmt(balanceNow) + ' ' + currency },
          { label: t.operations, value: String(reportData.length) }
        ],
        head: [t.date, t.category, t.description, t.importCard.charAt(0).toUpperCase() + t.importCard.slice(1), t.amount],
        rows: reportData.map(tx => [
          tx.date,
          tx.category || '',
          tx.description || '',
          tx.card ? '***' + tx.card : '',
          (tx.type === 'income' ? '+' : '−') + fmt(tx.amount) + ' ' + tx.currency
        ]),
        rowTones: reportData.map(tx => tx.type),
        footer: 'Wallet · ' + todayLocal()
      });
    } catch (err) {
      console.warn('PDF build failed:', err);
      setShareNotice(t.sharePdfFail);
      setTimeout(() => setShareNotice(''), 6000);
      return;
    }
    const filename = 'wallet-report-' + todayLocal() + '.pdf';
    const file = new File([blob], filename, { type: 'application/pdf' });

    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await sendPdfFile(file);
      return;
    }
    // Меню «Поделиться» недоступно (например, на компьютере) — просто сохраняем PDF
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

  // Шрифт и библиотеки PDF подгружаем заранее, как только открыта вкладка «Отчёт»
  useEffect(() => {
    if (activeTab === 'report') preloadPdfTools().catch(() => {});
  }, [activeTab]);

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
      <style>{`
        @keyframes walletGlow {
          0%, 100% { box-shadow: 0 0 0 0 var(--glow, transparent); }
          50% { box-shadow: 0 0 18px 3px var(--glow, transparent); }
        }
        .wallet-glow { animation: walletGlow 2.8s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.75; transform: scale(1.06); } }
        @media (prefers-reduced-motion: reduce) { .wallet-glow { animation: none; } }
      `}</style>
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
            <select value={currency} onChange={(e) => { if (e.target.value === '__add__') setShowCurrencyInput(true); else setCurrency(e.target.value); }} style={{ padding: '7px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: c.card, color: c.text, cursor: 'pointer', fontSize: '13px', flex: '1 1 90px', minWidth: 0, maxWidth: '100%', textOverflow: 'ellipsis' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                  {myCards.map(mc => (
                    <div key={mc.last4} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', backgroundColor: c.bg, border: '1px solid ' + c.border }}>
                      <span style={{ fontSize: '12px', flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                        <b>***{mc.last4}</b>{mc.label ? ' · ' + mc.label : ''}
                      </span>
                      <select
                        value={mc.currency || ''}
                        onChange={(e) => setMyCards(myCards.map(x => x.last4 === mc.last4 ? { ...x, currency: e.target.value } : x))}
                        title={t.cardCurrency}
                        style={{ padding: '5px 6px', fontSize: '11px', borderRadius: '6px', border: '1px solid ' + c.border, backgroundColor: c.card, color: c.text, cursor: 'pointer', maxWidth: '120px' }}
                      >
                        <option value="">{t.cardCurrencyAuto}</option>
                        {currencies.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                      </select>
                      <button onClick={() => setMyCards(myCards.filter(x => x.last4 !== mc.last4))} style={{ background: 'none', border: 'none', color: c.sec, cursor: 'pointer', fontSize: '13px', padding: 0, lineHeight: 1 }}>✕</button>
                    </div>
                  ))}
                  <div style={{ fontSize: '11px', color: c.sec, lineHeight: '1.5' }}>{t.cardCurrencyHint}</div>
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
                onClick={() => {
                  // Пароль сохраняется сразу при проверке — отдельно искать кнопку «Сохранить» не нужно
                  const k = tempInboxKey.trim();
                  if (!k) return;
                  if (k !== inboxKey) { setInboxKey(k); localStorage.setItem('walletInboxKey', k); }
                  fetchInbox(false, k);
                }}
                disabled={!tempInboxKey.trim() || inboxBusy}
                style={{ width: '100%', padding: '10px', fontSize: '12px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: 'transparent', color: tempInboxKey.trim() ? c.saveBtn : c.sec, cursor: (tempInboxKey.trim() && !inboxBusy) ? 'pointer' : 'default', marginBottom: '8px' }}
              >
                {inboxBusy ? t.inboxChecking : '↻ ' + t.inboxCheck}
              </button>
              {inboxStatus && (
                <div role="status" style={{ fontSize: '12px', fontWeight: 500, color: inboxStatus.ok ? c.saveBtn : c.expenseColor, marginBottom: '8px', textAlign: 'center' }}>
                  {inboxStatus.ok ? '✓ ' : '✕ '}{inboxStatus.text}
                </div>
              )}
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
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: c.sec, fontWeight: 600 }}>{t.currenciesManage}</label>
              <div style={{ fontSize: '11px', color: c.sec, marginBottom: '8px', lineHeight: '1.5' }}>{t.currenciesHint}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {currencies.map(cur => {
                  const used = transactions.filter(tx => tx.currency === cur).length;
                  return (
                    <div key={cur} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', backgroundColor: c.bg, border: '1px solid ' + c.border }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{cur}</span>
                      <span style={{ fontSize: '11px', color: c.sec, whiteSpace: 'nowrap' }}>{used}</span>
                      <button onClick={() => renameCurrency(cur)} title={t.edit}
                        style={{ background: 'none', border: 'none', color: c.saveBtn, cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>✎</button>
                      <button onClick={() => deleteCurrency(cur)} title={t.delete}
                        style={{ background: 'none', border: 'none', color: c.sec, cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>✕</button>
                    </div>
                  );
                })}
              </div>

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
            <input type="text" value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)} placeholder={t.currencyPlaceholder} style={{ ...inputStyle, flex: 1 }} autoFocus maxLength={30} onKeyDown={(e) => e.key === 'Enter' && addCurrency()} />
            <button onClick={addCurrency} style={{ padding: '10px 16px', backgroundColor: c.saveBtn, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>{t.save}</button>
            <button onClick={() => setShowCurrencyInput(false)} style={{ padding: '10px 16px', backgroundColor: c.sec, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{t.cancel}</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '4px', backgroundColor: c.card, padding: '4px', borderRadius: '12px', border: '1px solid ' + c.border, marginBottom: '16px' }}>
          <button onClick={() => setActiveTab('dashboard')} style={tabStyle(activeTab === 'dashboard')}>{t.dashboard}</button>
          <button onClick={() => setActiveTab('report')} style={tabStyle(activeTab === 'report')}>{t.report}</button>
          <button onClick={() => setActiveTab('plans')} style={{ ...tabStyle(activeTab === 'plans'), position: 'relative' }}>
            {t.plans}
            {(overdueCount + recurringDue.length + budgetRows.filter(b => b.left < 0).length) > 0 && activeTab !== 'plans' && (
              <span style={{ position: 'absolute', top: '5px', right: '7px', minWidth: '16px', height: '16px', borderRadius: '8px', backgroundColor: c.expenseColor, color: '#fff', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {overdueCount + recurringDue.length + budgetRows.filter(b => b.left < 0).length}
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
                {voiceHeard && importItems.some(i => i.source === 'voice') && (
                  <div style={{ fontSize: '12px', lineHeight: '1.5', marginBottom: '10px', padding: '9px 11px', borderRadius: '8px', backgroundColor: c.card, border: '1px solid ' + c.border, overflowWrap: 'anywhere' }}>
                    <span style={{ color: c.sec }}>🎙️ {t.voiceHeard}: </span>«{voiceHeard}»
                  </div>
                )}
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
                            {it.originalAmount != null && (
                              <span style={{ display: 'block', fontSize: '10px', color: c.sec, marginTop: '2px' }}>
                                {t.importConverted} {it.originalAmount.toLocaleString()} {it.originalCurrency}
                              </span>
                            )}
                          </span>
                        </div>

                        {(it.status === 'check' || it.source === 'voice') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '7px' }}>
                            <input
                              type="number" inputMode="decimal" step="any" min="0"
                              value={it.total ?? it.amount}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                const n = isFinite(v) && v >= 0 ? v : 0;
                                updateImportItem(idx, { amount: n, total: n, baseAmount: n, fee: 0 });
                              }}
                              style={{ width: '120px', padding: '5px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #E67E22', backgroundColor: c.bg, color: c.text }}
                            />
                            <span style={{ fontSize: '11px', color: c.sec }}>{it.currency}</span>
                            {it.converted === 'none' && (
                              <span style={{ fontSize: '10px', color: '#E67E22' }}>{t.importNoRate}</span>
                            )}
                          </div>
                        )}

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

            {recurringUpcoming.length > 0 && recurringDue.length === 0 && (
              <div style={{ backgroundColor: c.card, border: '1px dashed ' + c.saveBtn + '70', borderRadius: '12px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', lineHeight: '1.5' }}>
                🔁 {t.recurUpcoming}, {t.recurTomorrow}: {recurringUpcoming.map(r => r.category + ' ' + parseFloat(r.amount).toLocaleString() + ' ' + r.currency).join(', ')}
              </div>
            )}

            {budgetRows.some(b => b.pct >= 90) && (() => {
              const over = budgetRows.filter(b => b.left < 0);
              const near = budgetRows.filter(b => b.left >= 0 && b.pct >= 90);
              const alertColor = over.length ? c.expenseColor : '#E67E22';
              return (
                <div
                  className={over.length ? 'wallet-glow' : undefined}
                  onClick={() => setActiveTab('plans')}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') setActiveTab('plans'); }}
                  style={{ '--glow': alertColor + '55', backgroundColor: c.card, border: '1px solid ' + alertColor + '90', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: alertColor }}>
                    🎯 {over.length ? t.budgetAlertTitle : t.budgetWarnTitle}
                  </div>
                  {[...over, ...near].map(b => (
                    <div key={b.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px', padding: '3px 0' }}>
                      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{b.cat}</span>
                      <span style={{ whiteSpace: 'nowrap', color: b.left < 0 ? c.expenseColor : '#E67E22', fontWeight: 600 }}>
                        {b.left < 0
                          ? '+' + Math.round(-b.left).toLocaleString()
                          : Math.round(b.spent).toLocaleString() + ' / ' + Math.round(b.limit).toLocaleString()} {currency}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {recurringDue.length > 0 && (
              <div className="wallet-glow" style={{ '--glow': c.saveBtn + '55', backgroundColor: c.card, border: '1px solid ' + c.saveBtn + '90', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: c.saveBtn }}>🔁 {t.recurDue}</div>
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

            {otherCurrencyTotals.length > 0 && (
              <div style={{ backgroundColor: c.card, border: '1px solid ' + c.border, borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: c.sec, marginBottom: '6px' }}>{t.otherCurrenciesTitle}</div>
                {otherCurrencyTotals.map(o => (
                  <button key={o.cur} onClick={() => setCurrency(o.cur)} title={t.otherCurrenciesSwitch}
                    style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '6px 0', background: 'none', border: 'none', borderTop: '1px dashed ' + c.border, cursor: 'pointer', fontSize: '13px', color: c.text }}>
                    <span style={{ fontWeight: 600 }}>{o.cur}</span>
                    <span style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {o.expense > 0 && <span style={{ color: c.expenseColor, fontWeight: 500 }}>−{o.expense.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>}
                      {o.income > 0 && <span style={{ color: c.incomeColor, fontWeight: 500 }}>+{o.income.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>}
                      <span style={{ color: c.sec }}>›</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

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
                disabled={scanning}
                title={listening ? t.voiceDone : t.voiceInputTitle}
                aria-label={listening ? t.voiceDone : t.voiceInputTitle}
                style={{ padding: '13px 18px', backgroundColor: listening ? c.expenseColor : c.card, color: listening ? '#fff' : c.text, border: '1px solid ' + (listening ? c.expenseColor : c.border), borderRadius: '8px', cursor: scanning ? 'wait' : 'pointer', fontSize: '18px', opacity: scanning ? 0.7 : 1, animation: listening ? 'pulse 1.2s ease-in-out infinite' : 'none' }}
              >
                {t.voiceInput}
              </button>
            </div>
            {listening && (
              <div style={{ backgroundColor: c.card, border: '1px solid ' + c.expenseColor + '70', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: c.sec, marginBottom: '8px', lineHeight: '1.45' }}>🎙️ {t.voiceListeningFree}</div>
                <div style={{ minHeight: '44px', fontSize: '14px', lineHeight: '1.5', color: voiceText ? c.text : c.sec, fontStyle: voiceText ? 'normal' : 'italic', overflowWrap: 'anywhere', marginBottom: '10px' }}>
                  {voiceText || '…'}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={startVoiceInput}
                    style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', backgroundColor: c.saveBtn, color: '#fff', cursor: 'pointer' }}
                  >✓ {t.voiceDone}</button>
                  <button onClick={cancelVoiceInput}
                    style={{ padding: '10px 16px', fontSize: '13px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: 'transparent', color: c.sec, cursor: 'pointer' }}
                  >{t.cancel}</button>
                </div>
              </div>
            )}
            {!listening && scanning && !fileInputRef.current?.files?.length && (
              <div style={{ textAlign: 'center', fontSize: '12px', color: c.sec, marginBottom: '12px' }}>
                ⏳ {t.voiceProcessing}
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
              <div ref={txFormRef} style={{ backgroundColor: c.card, padding: '18px', borderRadius: '12px', marginBottom: '16px', border: '1px solid ' + c.border, scrollMarginTop: '12px' }}>
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
                    <input type="text" inputMode="decimal" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/[^\d.,\s]/g, '') })} placeholder="0" style={inputStyle} />
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
                  const isOpen = reconOpen === rc.key;
                  const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString();
                  return (
                    <div key={rc.key} style={{ padding: '10px 0', borderTop: '1px solid ' + c.border }}>
                      <div
                        onClick={() => setReconOpen(isOpen ? null : rc.key)}
                        role="button" tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setReconOpen(isOpen ? null : rc.key); } }}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>
                            <span style={{ fontSize: '10px', color: c.sec, display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', marginRight: '6px' }}>▶</span>
                            {t.reconCard} ***{rc.card}
                          </span>
                          <span style={{ fontSize: '11px', color: ok ? c.incomeColor : c.expenseColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {ok ? '✓ ' + t.reconOk : '⚠ ' + (rc.diff > 0 ? '+' : '−') + fmt(Math.abs(rc.diff)) + ' ' + rc.currency}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: c.sec, marginTop: '4px', lineHeight: '1.5', paddingLeft: '16px' }}>
                          {t.reconBank}: {fmt(rc.bank)} {rc.currency} ({t.reconAsOf} {rc.date}{rc.time ? ' ' + rc.time : ''})
                        </div>
                        {!ok && !isOpen && (
                          <div style={{ fontSize: '11px', color: c.expenseColor, marginTop: '3px', lineHeight: '1.5', paddingLeft: '16px' }}>
                            {t.reconGap}
                          </div>
                        )}
                      </div>

                      {isOpen && (
                        <div style={{ marginTop: '10px', paddingLeft: '16px' }}>
                          {rc.steps.length <= 1 ? (
                            <div style={{ fontSize: '11px', color: c.sec, lineHeight: '1.5' }}>{t.reconNoCardOps}</div>
                          ) : (
                            <div style={{ borderLeft: '2px solid ' + c.border, paddingLeft: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                              {rc.steps.slice(-40).map((st, si) => {
                                const hasGap = st.gap != null && Math.abs(st.gap) >= 0.01;
                                return (
                                  <div key={si} style={{
                                    padding: '6px 8px', marginBottom: '4px', borderRadius: '6px',
                                    backgroundColor: hasGap ? c.expenseColor + '14' : 'transparent',
                                    border: hasGap ? '1px solid ' + c.expenseColor + '40' : '1px solid transparent'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '11px' }}>
                                      <span style={{ color: c.sec, minWidth: 0, overflowWrap: 'anywhere' }}>
                                        {st.tx.date}{st.tx.time ? ' ' + st.tx.time : ''} · {st.isStart ? t.reconStartPoint : (st.tx.description || st.tx.category)}
                                      </span>
                                      {!st.isStart && (
                                        <span style={{ whiteSpace: 'nowrap', color: st.tx.type === 'income' ? c.incomeColor : c.expenseColor }}>
                                          {st.tx.type === 'income' ? '+' : '−'}{fmt(st.tx.amount)}
                                        </span>
                                      )}
                                    </div>
                                    {st.bank != null && (
                                      <div style={{ fontSize: '10px', color: c.sec, marginTop: '2px' }}>
                                        {t.reconBank}: {fmt(st.bank)}{!st.isStart ? ' · ' + t.reconOurs + ': ' + fmt(st.running) : ''}
                                      </div>
                                    )}
                                    {hasGap && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '5px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '11px', color: c.expenseColor, fontWeight: 600 }}>
                                          {t.reconGapHere}: {st.gap > 0 ? '+' : '−'}{fmt(Math.abs(st.gap))} {rc.currency}
                                        </span>
                                        <button
                                          onClick={() => addReconDifference(rc, st)}
                                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', border: 'none', backgroundColor: c.saveBtn, color: '#fff', cursor: 'pointer' }}
                                        >{t.reconAddMissing}</button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {!ok && (
                            <button
                              onClick={() => acceptBankBalance(rc)}
                              style={{ marginTop: '10px', width: '100%', padding: '9px', fontSize: '12px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: 'transparent', color: c.text, cursor: 'pointer' }}
                            >✓ {t.reconAccept}</button>
                          )}
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

            <div style={{ backgroundColor: c.card, padding: recentOpen ? '18px' : '14px 18px', borderRadius: '12px', border: '1px solid ' + c.border }}>
              <div
                onClick={() => { setRecentOpen(!recentOpen); if (recentOpen) setRecentShowAll(false); }}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRecentOpen(!recentOpen); } }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', marginBottom: recentOpen ? '14px' : 0 }}
              >
                <span style={{ fontSize: '11px', color: c.sec, display: 'inline-block', transform: recentOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
                <h3 style={{ margin: 0, fontSize: '15px', flex: 1 }}>{t.recent}</h3>
                <span style={{ fontSize: '11px', color: c.sec, border: '1px solid ' + c.border, borderRadius: '10px', padding: '2px 8px' }}>{transactions.length}</span>
              </div>
              {!recentOpen ? null : transactions.length === 0 ? (
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
                        {isExpanded && (alwaysExpanded && !recentShowAll ? monthTxs.slice(0, 7) : monthTxs).map((tx, i, shown) => {
                          const amountColor = tx.type === 'income' ? c.incomeColor : getExpenseColor(tx);
                          return (
                            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < shown.length - 1 ? '1px solid ' + c.border : 'none', gap: '10px' }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 500, fontSize: '14px' }}>{tx.category}</div>
                                <div style={{ fontSize: '11px', color: c.sec }}>{tx.description || ''} · {tx.date}{tx.card ? ' · ***' + tx.card : ''}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ color: amountColor, fontWeight: 600, fontSize: '14px' }}>
                                  {tx.type === 'income' ? '+' : '−'}{tx.amount.toLocaleString()} {tx.currency}
                                </div>
                                {tx.originalAmount != null && (
                                  <div style={{ fontSize: '10px', color: c.sec }}>{tx.originalAmount.toLocaleString()} {tx.originalCurrency}</div>
                                )}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '3px', justifyContent: 'flex-end' }}>
                                  <button onClick={(e) => { e.stopPropagation(); startEdit(tx); }} style={{ fontSize: '11px', background: 'none', border: 'none', color: c.saveBtn, cursor: 'pointer', padding: 0, fontWeight: 500 }}>{t.edit}</button>
                                  <button onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }} style={{ fontSize: '11px', background: 'none', border: 'none', color: '#E24B4A', cursor: 'pointer', padding: 0, fontWeight: 500 }}>{t.delete}</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {isExpanded && alwaysExpanded && monthTxs.length > 7 && (
                          <button
                            onClick={() => setRecentShowAll(!recentShowAll)}
                            style={{ width: '100%', marginTop: '6px', padding: '8px', fontSize: '12px', borderRadius: '8px', border: '1px dashed ' + c.border, backgroundColor: 'transparent', color: c.saveBtn, cursor: 'pointer' }}
                          >
                            {recentShowAll ? t.recentShowLess : t.recentShowAll + ' (' + monthTxs.length + ')'}
                          </button>
                        )}
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
                  {pendingPdf && (
                    <button onClick={() => sendPdfFile(pendingPdf)} style={{ marginTop: '10px', width: '100%', padding: '10px', backgroundColor: '#2C5282', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>{t.sharePdfBtn}</button>
                  )}
                  <button onClick={() => { setShareNotice(''); setPendingPdf(null); }} aria-label="Закрыть" style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: c.sec, cursor: 'pointer', fontSize: '16px', padding: 0, lineHeight: 1 }}>✕</button>
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
                    <div style={{ fontSize: '13px', fontWeight: 500, opacity: r.active === false ? 0.5 : 1 }}>
                      {r.category}{r.description ? ' · ' + r.description : ''}
                      {r.active === false && <span style={{ fontSize: '10px', color: c.sec, marginLeft: '6px' }}>({t.recurPaused})</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: c.sec }}>
                      {parseFloat(r.amount).toLocaleString()} {r.currency} · {t.recurEvery} {r.day} {t.recurDayShort}
                      {' · '}{r.lastPosted ? t.recurLast + ' ' + r.lastPosted : t.recurNever}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRecurring(r.id)}
                    style={{ padding: '4px 9px', fontSize: '11px', borderRadius: '6px', border: '1px solid ' + c.border, backgroundColor: 'transparent', color: r.active === false ? c.incomeColor : c.sec, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >{r.active === false ? t.recurResume : t.recurPause}</button>
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
                        setRecurring([...recurring, { ...recurForm, id: newId(), amount: amt, day, lastPosted: null, skipped: null }]);
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
