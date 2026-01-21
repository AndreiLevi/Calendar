# Миграция профилей в Calendar/ - ГОТОВО ✅

## Что скопировано

### Backend (Calendar/backend/)

- ✅ `services/profile_service.py` - Сервис управления профилями
- ✅ `services/__init__.py` - Python package marker
- ✅ `database/supabase_setup.sql` - SQL миграция (уже применена!)
- ✅ `main.py` - Обновлен с 7 новыми API endpoints
- ✅ `requirements.txt` - Добавлен `supabase`

### Frontend (Calendar/frontend/src/)

- ✅ `components/ProfileManager.jsx` - Менеджер профилей
- ✅ `components/LocationInput.jsx` - Геокодинг места рождения
- ✅ `App.jsx` - Интеграция ProfileManager
- ✅ `api.js` - Добавлен profileAPI
- ✅ `utils/translations.js` - Переводы для UI профилей

---

## Что делать дальше

### 1. Установить зависимости (если еще не сделали)

```bash
cd Calendar/backend
pip install -r requirements.txt
```

### 2. Проверить локально

```bash
# Terminal 1 - Backend
cd Calendar/backend
uvicorn main:app --reload

# Terminal 2 - Frontend  
cd Calendar/frontend
npm run dev
```

**Тест:**

1. Войти через Google
2. Нажать кнопку профиля (👤)
3. Создать профиль с датой/временем/местом
4. Проверить, что данные сохраняются

### 3. Закоммитить в Git

```bash
cd Calendar

git status
# Должны показаться:
# backend/services/
# backend/database/
# backend/main.py
# backend/requirements.txt
# frontend/src/components/ProfileManager.jsx
# frontend/src/components/LocationInput.jsx
# frontend/src/App.jsx
# frontend/src/api.js
# frontend/src/utils/translations.js

git add backend/services backend/database
git add backend/main.py backend/requirements.txt
git add frontend/src/components/ProfileManager.jsx
git add frontend/src/components/LocationInput.jsx
git add frontend/src/App.jsx frontend/src/api.js
git add frontend/src/utils/translations.js

git commit -m "Add user profile system with birth data management"
git push
```

### 4. На сервере (после деплоя)

Убедиться, что на production сервере:

- ✅ Установлен `supabase` пакет (из requirements.txt)
- ✅ В `.env` есть переменные:

  ```
  SUPABASE_URL=...
  SUPABASE_SERVICE_KEY=...
  ```

- ✅ Во frontend `.env`:

  ```
  VITE_SUPABASE_URL=...
  VITE_SUPABASE_ANON_KEY=...
  ```

---

## Таблицы Supabase

✅ Уже созданы! Вы запустили SQL миграцию:

- `profiles` - хранит профили пользователей
- `action_log` - логирует все действия

---

## Структура Calendar/ после миграции

```
Calendar/
├── backend/
│   ├── services/              ← НОВОЕ
│   │   ├── __init__.py
│   │   └── profile_service.py
│   ├── database/              ← НОВОЕ
│   │   └── supabase_setup.sql
│   ├── main.py                ← ОБНОВЛЕНО
│   └── requirements.txt       ← ОБНОВЛЕНО (+supabase)
└── frontend/src/
    ├── components/
    │   ├── ProfileManager.jsx ← НОВОЕ
    │   └── LocationInput.jsx  ← НОВОЕ
    ├── App.jsx                ← ОБНОВЛЕНО
    ├── api.js                 ← ОБНОВЛЕНО
    └── utils/
        └── translations.js    ← ОБНОВЛЕНО
```

---

## ✅ Система готова к деплою

После `git push` на production будет развернута полная система профилей.
