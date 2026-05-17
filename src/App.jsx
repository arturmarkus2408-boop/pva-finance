import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './App.css';

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('ru');
  const [currency, setCurrency] = useState('UZS');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('expense');
  const [editingId, setEditingId] = useState(null);
  const [chartType, setChartType] = useState('pie');
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    customCategory: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const tr = {
    ru: {
      appName: 'PVA Finance',
      addIncome: '+ Доход',
      addExpense: '+ Расход',
      balance: 'БАЛАНС',
      income: 'ДОХОД',
      expense: 'РАСХОД',
      category: 'Категория',
      amount: 'Сумма',
      description: 'Описание',
      date: 'Дата',
      save: 'Сохранить',
      update: 'Обновить',
      cancel: 'Отмена',
      recent: 'Последние операции',
      delete: 'Удалить',
      edit: 'Редактировать',
      selectCat: 'Выберите категорию',
      customCatPlaceholder: 'Напишите свою категорию',
      light: 'Светлая',
      dark: 'Тёмная',
      soft: 'Деловая',
      categoriesExp: ['Продукты', 'Коммунальные', 'Аренда', 'Интернет', 'Транспорт', 'Налоги', 'Развлечения', 'Покупки', 'Другое'],
      categoriesInc: ['Зарплата', 'Фриланс', 'Инвестиции', 'Перевод', 'Продажа', 'Подарок', 'Другое'],
      noOperations: 'Нет операций',
      chartTitle: 'Расходы по категориям',
      pieChart: 'Круг',
      barChart: 'Столбцы',
      lineChart: 'Линия',
      editMode: 'Редактирование операции'
    },
    uz: {
      appName: 'PVA Finance',
      addIncome: '+ Daromad',
      addExpense: '+ Xarajat',
      balance: 'BALANS',
      income: 'DAROMAD',
      expense: 'XARAJAT',
      category: 'Kategoriya',
      amount: 'Summa',
      description: 'Tavsif',
      date: 'Sana',
      save: 'Saqlash',
      update: 'Yangilash',
      cancel: 'Bekor qilish',
      recent: 'Songgi amaliyotlar',
      delete: 'O\'chirish',
      edit: 'Tahrirlash',
      selectCat: 'Kategoriyani tanlang',
      customCatPlaceholder: 'O\'z kategoriyangizni kiriting',
      light: 'Yorqin',
      dark: 'Qora',
      soft: 'Biznes',
      categoriesExp: ['Oziq-ovqat', 'Kommunal', 'Ijara', 'Internet', 'Transport', 'Soliqlar', 'Dam olish', 'Xaridlar', 'Boshqa'],
      categoriesInc: ['Maosh', 'Frilans', 'Investitsiya', 'O\'tkazma', 'Sotuv', 'Sovga', 'Boshqa'],
      noOperations: 'Amaliyotlar yo\'q',
      chartTitle: 'Kategoriya bo\'yicha xarajatlar',
      pieChart: 'Doira',
      barChart: 'Ustun',
      lineChart: 'Chiziq',
      editMode: 'Amaliyotni tahrirlash'
    }
  };

  const t = tr[language];

  useEffect(() => {
    const saved = localStorage.getItem('pvaData');
    if (saved) {
      const data = JSON.parse(saved);
      setTransactions(data.transactions || []);
      setTheme(data.theme || 'light');
      setLanguage(data.language || 'ru');
      setCurrency(data.currency || 'UZS');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pvaData', JSON.stringify({ transactions, theme, language, currency }));
  }, [transactions, theme, language, currency]);

  const themes = {
    light: { bg: '#F7F4ED', text: '#1B2845', sec: '#5F5E5A', card: '#FFFFFF', border: '#E0DCD0', incomeColor: '#3F7D58', expenseColor: '#8B4548', saveBtn: '#B07D3F' },
    dark: { bg: '#000000', text: '#FFFFFF', sec: '#C9A84C', card: '#111111', border: '#2A2A2A', incomeColor: '#C9A84C', expenseColor: '#E05555', saveBtn: '#C9A84C' },
    soft: { bg: '#EEF1F5', text: '#1A2635', sec: '#4A6080', card: '#FFFFFF', border: '#C8D3DE', incomeColor: '#1E5C3A', expenseColor: '#6B2737', saveBtn: '#1E3A5C' }
  };

  const c = themes[theme];
  const isOther = formData.category === 'Другое' || formData.category === 'Boshqa';

  const submitTransaction = (e) => {
    e.preventDefault();
    const finalCategory = isOther ? formData.customCategory : formData.category;
    if (!formData.amount || !finalCategory) return;

    if (editingId) {
      setTransactions(transactions.map(tx => tx.id === editingId ? {
        ...tx,
        amount: parseFloat(formData.amount),
        category: finalCategory,
        description: formData.description,
        date: formData.date
      } : tx));
      setEditingId(null);
    } else {
      const newT = {
        id: Date.now(),
        type: formType,
        amount: parseFloat(formData.amount),
        category: finalCategory,
        description: formData.description,
        currency: currency,
        date: formData.date
      };
      setTransactions([...transactions, newT]);
    }
    setFormData({ amount: '', category: '', customCategory: '', description: '', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const startEdit = (tx) => {
    const builtInCats = tx.type === 'income' ? t.categoriesInc : t.categoriesExp;
    const isBuiltIn = builtInCats.includes(tx.category);
    setFormType(tx.type);
    setEditingId(tx.id);
    setFormData({
      amount: tx.amount.toString(),
      category: isBuiltIn ? tx.category : (language === 'ru' ? 'Другое' : 'Boshqa'),
      customCategory: isBuiltIn ? '' : tx.category,
      description: tx.description || '',
      date: tx.date
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ amount: '', category: '', customCategory: '', description: '', date: new Date().toISOString().split('T')[0] });
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(tx => tx.id !== id));
  };

  const income = transactions.filter(tx => tx.type === 'income' && tx.currency === currency).reduce((s, tx) => s + tx.amount, 0);
  const expense = transactions.filter(tx => tx.type === 'expense' && tx.currency === currency).reduce((s, tx) => s + tx.amount, 0);
  const balance = income - expense;

  const categoryData = {};
  transactions.filter(tx => tx.type === 'expense' && tx.currency === currency).forEach(tx => {
    categoryData[tx.category] = (categoryData[tx.category] || 0) + tx.amount;
  });
  const chartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
  const chartColors = ['#1B2845', '#3F7D58', '#8B4548', '#B07D3F', '#C9A84C', '#2D6A4F', '#E24B4A', '#2C4A6E'];

  const cats = formType === 'income' ? t.categoriesInc : t.categoriesExp;

  const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: c.bg, color: c.text, boxSizing: 'border-box', fontSize: '14px' };

  const chartTabStyle = (active) => ({
    padding: '6px 14px',
    fontSize: '13px',
    borderRadius: '6px',
    border: '1px solid ' + c.border,
    backgroundColor: active ? c.saveBtn : c.card,
    color: active ? '#FFFFFF' : c.text,
    cursor: 'pointer',
    fontWeight: active ? 500 : 400
  });

  return (
    <div style={{ backgroundColor: c.bg, color: c.text, minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>{t.appName}</h1>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: c.card, color: c.text, cursor: 'pointer' }}>
              <option value="light">{t.light}</option>
              <option value="dark">{t.dark}</option>
              <option value="soft">{t.soft}</option>
            </select>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: c.card, color: c.text, cursor: 'pointer' }}>
              <option value="ru">RU</option>
              <option value="uz">UZ</option>
            </select>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid ' + c.border, backgroundColor: c.card, color: c.text, cursor: 'pointer' }}>
              <option value="UZS">UZS</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: c.card, padding: '16px', borderRadius: '12px', border: '1px solid ' + c.border }}>
            <div style={{ fontSize: '11px', color: c.sec, letterSpacing: '0.5px' }}>{t.balance}</div>
            <div style={{ fontSize: '22px', fontWeight: 600, marginTop: '4px' }}>{balance.toLocaleString()} {currency}</div>
          </div>
          <div style={{ backgroundColor: c.card, padding: '16px', borderRadius: '12px', border: '1px solid ' + c.border }}>
            <div style={{ fontSize: '11px', color: c.incomeColor, letterSpacing: '0.5px' }}>{t.income}</div>
            <div style={{ fontSize: '22px', fontWeight: 600, marginTop: '4px', color: c.incomeColor }}>{income.toLocaleString()} {currency}</div>
          </div>
          <div style={{ backgroundColor: c.card, padding: '16px', borderRadius: '12px', border: '1px solid ' + c.border }}>
            <div style={{ fontSize: '11px', color: c.expenseColor, letterSpacing: '0.5px' }}>{t.expense}</div>
            <div style={{ fontSize: '22px', fontWeight: 600, marginTop: '4px', color: c.expenseColor }}>{expense.toLocaleString()} {currency}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => { setFormType('income'); setEditingId(null); setShowForm(true); }} style={{ flex: 1, padding: '14px', backgroundColor: c.incomeColor, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>{t.addIncome}</button>
          <button onClick={() => { setFormType('expense'); setEditingId(null); setShowForm(true); }} style={{ flex: 1, padding: '14px', backgroundColor: c.expenseColor, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>{t.addExpense}</button>
        </div>

        {showForm && (
          <div style={{ backgroundColor: c.card, padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid ' + c.border }}>
            {editingId && (
              <div style={{ marginBottom: '12px', fontSize: '13px', color: c.saveBtn, fontWeight: 500 }}>{t.editMode}</div>
            )}
            <form onSubmit={submitTransaction}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: c.sec }}>{t.category}</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value, customCategory: '' })} style={inputStyle}>
                  <option value="">{t.selectCat}</option>
                  {cats.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                </select>
              </div>

              {isOther && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: c.sec }}>{t.customCatPlaceholder}</label>
                  <input type="text" value={formData.customCategory} onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })} placeholder={t.customCatPlaceholder} style={{ ...inputStyle, border: '1px solid ' + c.saveBtn }} autoFocus />
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: c.sec }}>{t.amount}</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: c.sec }}>{t.description}</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: c.sec }}>{t.date}</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: c.saveBtn, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>{editingId ? t.update : t.save}</button>
                <button type="button" onClick={cancelForm} style={{ flex: 1, padding: '12px', backgroundColor: c.sec, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>{t.cancel}</button>
              </div>
            </form>
          </div>
        )}

        {chartData.length > 0 && (
          <div style={{ backgroundColor: c.card, padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid ' + c.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>{t.chartTitle}</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setChartType('pie')} style={chartTabStyle(chartType === 'pie')}>{t.pieChart}</button>
                <button onClick={() => setChartType('bar')} style={chartTabStyle(chartType === 'bar')}>{t.barChart}</button>
                <button onClick={() => setChartType('line')} style={chartTabStyle(chartType === 'line')}>{t.lineChart}</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => name + ': ' + value.toLocaleString()}>
                    {chartData.map((entry, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
                  <XAxis dataKey="name" stroke={c.text} style={{ fontSize: '11px' }} />
                  <YAxis stroke={c.text} style={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={{ backgroundColor: c.card, border: '1px solid ' + c.border, color: c.text }} />
                  <Bar dataKey="value" fill={c.expenseColor} radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
                  <XAxis dataKey="name" stroke={c.text} style={{ fontSize: '11px' }} />
                  <YAxis stroke={c.text} style={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={{ backgroundColor: c.card, border: '1px solid ' + c.border, color: c.text }} />
                  <Line type="monotone" dataKey="value" stroke={c.saveBtn} strokeWidth={2} dot={{ fill: c.saveBtn, r: 5 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ backgroundColor: c.card, padding: '20px', borderRadius: '12px', border: '1px solid ' + c.border }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>{t.recent}</h3>
          {transactions.length === 0 ? (
            <div style={{ color: c.sec, textAlign: 'center', padding: '20px' }}>{t.noOperations}</div>
          ) : (
            transactions.slice().reverse().map((tx, i) => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < transactions.length - 1 ? '1px solid ' + c.border : 'none', gap: '12px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{tx.category}</div>
                  <div style={{ fontSize: '12px', color: c.sec }}>{tx.description || tx.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: tx.type === 'income' ? c.incomeColor : c.expenseColor, fontWeight: 600 }}>
                    {tx.type === 'income' ? '+' : '−'}{tx.amount.toLocaleString()} {tx.currency}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px', justifyContent: 'flex-end' }}>
                    <button onClick={() => startEdit(tx)} style={{ fontSize: '11px', background: 'none', border: 'none', color: c.saveBtn, cursor: 'pointer', padding: 0, fontWeight: 500 }}>{t.edit}</button>
                    <button onClick={() => deleteTransaction(tx.id)} style={{ fontSize: '11px', background: 'none', border: 'none', color: '#E24B4A', cursor: 'pointer', padding: 0, fontWeight: 500 }}>{t.delete}</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default App;