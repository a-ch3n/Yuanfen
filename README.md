# Yuanfen 缘

SMS-based matchmaking system built on emotional compatibility.

No photos. No swiping. Five SMS questions, one careful introduction at a time.

---

## Architecture

```
yuanfen/
├── backend/         FastAPI · SQLite · Twilio · OpenAI
│   └── app/
│       ├── main.py             FastAPI app + endpoints
│       ├── models.py           SQLAlchemy models
│       ├── schemas.py          Pydantic schemas
│       ├── database.py         DB session
│       ├── config.py           env settings
│       ├── onboarding.py       SMS conversation state machine
│       ├── personality.py      OpenAI personality extraction (+ fallback)
│       ├── matching_service.py compatibility scoring + intro flow
│       └── sms_service.py      Twilio wrapper (logs in dev)
│
└── frontend/        Next.js 14 · Tailwind · Framer Motion · TypeScript
    └── app/
        ├── page.tsx            Landing + waitlist
        ├── admin/page.tsx      Editor's-desk dashboard
        ├── layout.tsx
        └── globals.css
```

---

## Backend setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # add OPENAI_API_KEY and TWILIO_* if you have them
uvicorn app.main:app --reload
```

API now at <http://localhost:8000>. SQLite file is created automatically.

### Without Twilio / OpenAI

It still works. Personality extraction has a deterministic fallback, and SMS
sends are logged to the console + DB. Use `POST /dev/sms` to simulate inbound
messages while you build:

```bash
curl -X POST http://localhost:8000/dev/sms -F "phone=+15551234567" -F "body=hi"
```

---

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Site at <http://localhost:3000>. Admin at <http://localhost:3000/admin>
(default token: `change-me-please` — change in `backend/.env`).

If your API runs on a different host, set `NEXT_PUBLIC_API_URL` before `npm run dev`.

---

## Endpoints

| Method | Path                    | Purpose                                  |
| ------ | ----------------------- | ---------------------------------------- |
| POST   | `/waitlist`             | Landing-page email capture               |
| POST   | `/sms`                  | Twilio webhook (incoming SMS)            |
| POST   | `/dev/sms`              | Simulate an inbound SMS (no Twilio)      |
| GET    | `/admin/users`          | List all members + personalities         |
| GET    | `/admin/matches`        | List all introductions and their state   |
| GET    | `/admin/waitlist`       | List waitlist entries                    |
| POST   | `/admin/run-matching`   | Trigger a matching pass                  |

All `/admin/*` routes require an `X-Admin-Token` header.

---

## SMS onboarding flow

1. User texts anything → bot asks for name
2. Name → age → city → five emotional-resonance questions
3. Answers go to OpenAI for personality extraction
4. User receives a confirmation message and waits

When you run matching (`POST /admin/run-matching` or `python -m app.matching_service`):
5. The best unmatched candidate is found (score ≥ 60)
6. User A receives the intro + reason → replies YES / NO
7. If YES, user B receives the same intro → replies YES / NO
8. If both say YES, numbers are exchanged. Done.

---

## Production notes

- **Database**: swap `DATABASE_URL` to Postgres for production.
- **Twilio webhook**: point your Twilio phone number's incoming-SMS webhook
  to `https://yourdomain.com/sms`. Use an ngrok tunnel for local testing.
- **Admin token**: change `ADMIN_TOKEN` in `.env` before deploying.
- **CORS**: currently wide open in `main.py`; lock down to your frontend
  domain in production.
- **Matching**: easy to put on a cron job — `python -m app.matching_service`
  runs one pass and exits.
# Yuanfen
