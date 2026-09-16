// Почтовый ящик для банковских SMS.
//
// Как это работает целиком:
//   1. На телефоне MacroDroid (или Tasker) ловит SMS от банка и шлёт сюда POST.
//   2. Функция кладёт текст в Upstash Redis — это временное хранилище, не база приложения.
//   3. Приложение при открытии забирает накопленное, разбирает на устройстве и показывает
//      окно сверки. После того как пользователь решил, что с ними делать, сообщения удаляются.
//
// Сервер НЕ разбирает суммы, не хранит операции и ничего не знает о финансах —
// он только передаёт текст с телефона в приложение. Вся логика осталась на устройстве.
//
// Нужны три переменные окружения в настройках проекта Vercel:
//   UPSTASH_REDIS_REST_URL    — адрес базы Upstash
//   UPSTASH_REDIS_REST_TOKEN  — токен доступа к ней
//   WALLET_INBOX_KEY          — ваш личный пароль, придумайте длинный и случайный

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const INBOX_KEY = process.env.WALLET_INBOX_KEY;

const HKEY = 'wallet:inbox';
const TTL_SECONDS = 60 * 60 * 24 * 30; // месяц — дальше несобранное само исчезнет
const MAX_TEXT = 4000;
const MAX_ITEMS = 200;

async function redis(command) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + REDIS_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  if (!res.ok) throw new Error('redis ' + res.status);
  const json = await res.json();
  return json.result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-wallet-key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!REDIS_URL || !REDIS_TOKEN || !INBOX_KEY) {
    return res.status(500).json({ error: 'server-not-configured' });
  }

  // Пароль можно прислать заголовком (так делает приложение)
  // или параметром в адресе (так проще настроить MacroDroid)
  const key = req.headers['x-wallet-key'] || (req.query && req.query.key);
  if (!key || String(key) !== INBOX_KEY) {
    return res.status(401).json({ error: 'bad-key' });
  }

  try {
    if (req.method === 'POST') {
      // Подтверждение: приложение сообщает, какие сообщения уже забрало
      if (req.query && req.query.action === 'ack') {
        const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids : [];
        const clean = ids.map(String).filter(x => x && x.length < 64).slice(0, MAX_ITEMS);
        if (clean.length) await redis(['HDEL', HKEY, ...clean]);
        return res.status(200).json({ ok: true, removed: clean.length });
      }

      // Приём нового сообщения
      let text = '';
      if (typeof req.body === 'string') text = req.body;
      else if (req.body && typeof req.body.text === 'string') text = req.body.text;
      else if (req.query && req.query.text) text = String(req.query.text);

      text = String(text || '').trim();
      if (!text) return res.status(400).json({ error: 'empty-text' });
      if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT);

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      await redis(['HSET', HKEY, id, JSON.stringify({ id, text, at: new Date().toISOString() })]);
      await redis(['EXPIRE', HKEY, TTL_SECONDS]);
      return res.status(200).json({ ok: true, id });
    }

    if (req.method === 'GET') {
      const flat = await redis(['HGETALL', HKEY]);
      const items = [];
      // Upstash отдаёт хеш плоским списком: поле, значение, поле, значение...
      for (let i = 1; i < (flat ? flat.length : 0); i += 2) {
        try {
          const parsed = JSON.parse(flat[i]);
          if (parsed && parsed.id && parsed.text) items.push(parsed);
        } catch {
          // битую запись просто пропускаем
        }
      }
      items.sort((a, b) => String(a.at).localeCompare(String(b.at)));
      return res.status(200).json({ ok: true, items: items.slice(0, MAX_ITEMS) });
    }

    return res.status(405).json({ error: 'method-not-allowed' });
  } catch (err) {
    return res.status(502).json({ error: 'upstream', detail: String(err && err.message || err).slice(0, 120) });
  }
}
