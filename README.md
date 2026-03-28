# DMAS Simple Interest Calculator

Live website: https://dmas-simple-interest-calculator.vercel.app

DMAS Simple Interest Calculator is a React + Vite web app for preparing simple-interest bills, statement tables, and printable output cards. It supports local bill saving, optional Supabase cloud sync, Telugu/English output, and row-wise end-date calculation when needed.

## Live Release

- Production site: https://dmas-simple-interest-calculator.vercel.app
- Repository: https://github.com/AbhishekVabilisetty/dmas-simple-interest-calculator

## Features

- Create and save multiple bills
- Edit entries with amount, daily, days, and per-row end dates
- Generate formatted statement output for sharing or printing
- Copy statement text and statement image
- Switch website theme: light, dark, or system
- Switch output language: English or Telugu
- Optional Supabase cloud backup for cross-device access

## Tech Stack

- React
- Vite
- Supabase
- Vercel

## Local Development

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

## Deploy

```powershell
npm run deploy:prod
```

## Notes

- Production URL is deployed on Vercel.
- Cloud sync uses Supabase when environment variables are configured.
- Local browser storage still works as a fallback.
