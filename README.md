# The Plate Lab — Nutrition Dashboard

Three tabs: 🍽 Plate Lab (photo → calories) · 🧊 Fridge & Shop (inventory + store optimizer) · 🛒 Grocery Plan (meal plan, dressings, lists).

---

## ⚡ The 3-step update loop (after initial setup)

Every time Claude gives you a new `NutritionDashboard.jsx`:

```bash
# 1. Save the new file into the project ROOT (overwrite the old drop)
#    → nutrition-dashboard/NutritionDashboard.jsx

# 2. Port it (adds "use client", reroutes API calls to the secure proxy)
npm run port

# 3. Ship it
git add . && git commit -m "update dashboard" && git push
```

Vercel auto-deploys in ~90 seconds. That's the whole loop.

**Why this works:** the artifact file and the deployed component are line-for-line
identical except two mechanical edits, which `npm run port` applies for you:
1. a `"use client"` header (Next.js requirement)
2. every `https://api.anthropic.com/v1/messages` → `/api/analyze`

`/api/analyze` is a transparent proxy (`app/api/analyze/route.ts`) that forwards the
exact same request body and returns the exact same response — it just injects your
API key server-side so it never reaches the browser. Because request/response shapes
are unchanged, **no other code edits are ever needed**, no matter what features we add.

The port script also backs up the previous version to `components/NutritionDashboard.jsx.bak`
in case you need to roll back locally (git history has you covered too).

---

## One-time setup (~10 min)

### Prerequisites
- Node.js 18+: https://nodejs.org
- Anthropic API key: https://console.anthropic.com/settings/keys
- GitHub account · Vercel account (sign up with GitHub at https://vercel.com)

### Steps
```bash
npm install

cp .env.example .env.local
# edit .env.local → paste your real key

npm run dev        # → http://localhost:3000
```

### Deploy
```bash
git init && git add . && git commit -m "initial"
# create an empty repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/nutrition-dashboard.git
git push -u origin main
```
Then at **vercel.com/new**: Import the repo → Environment Variables →
add `ANTHROPIC_API_KEY` = your key → Deploy. Live URL in ~2 minutes.

---

## Project structure

```
nutrition-dashboard/
├── NutritionDashboard.jsx        ← (working file) drop new artifact versions here
├── scripts/port.mjs              ← npm run port: 2 mechanical transforms
├── components/
│   ├── NutritionDashboard.jsx    ← deployed component (generated — don't hand-edit)
│   └── NutritionDashboard.jsx.bak← auto-backup of previous version
├── app/
│   ├── api/analyze/route.ts      ← transparent key-injecting proxy
│   ├── layout.tsx · page.tsx · globals.css
├── .env.example                  ← copy to .env.local
└── package.json
```

Rule of thumb: **all feature work happens in the root `NutritionDashboard.jsx`**
(i.e., in your Claude sessions); everything else in this repo is stable plumbing
you should rarely touch.

---

## Notes

- **Model**: requests specify their own model; if omitted the proxy defaults to
  `claude-sonnet-4-6` (see `DEFAULT_MODEL` in route.ts).
- **Timeouts**: Vercel Hobby caps functions at 10s. Web-search-enabled calls can
  exceed that — if you see timeouts, either disable web search in prompts or
  upgrade to Vercel Pro (60s).
- **Photos** are sent base64 (~1.3× file size). If uploads fail on huge photos,
  we can add client-side compression in a future rev.

## Roadmap to App Store
1. ✅ Live web app (this repo)
2. Persistence (Supabase free tier): saved meals, calorie log, fridge state
3. Expo React Native port → EAS Build
4. Apple Developer Program ($99/yr) → TestFlight → App Store review
