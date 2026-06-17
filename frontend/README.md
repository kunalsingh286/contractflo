# ContractFlo Frontend

Next.js 15 application for ContractFlo.

## Setup

```bash
npm install
cp .env.example .env.local   # macOS / Linux
copy .env.example .env.local # Windows
```

## Development

```bash
npm run dev
```

## shadcn/ui

This project is configured for [shadcn/ui](https://ui.shadcn.com). Add components with:

```bash
npx shadcn@latest add button
```

Configuration: `components.json`

## Project layout

```
app/              App Router pages and layouts
components/
  ui/             shadcn/ui primitives
  layout/         Shell and navigation
hooks/            Custom React hooks
lib/              Utilities, constants, API client
types/            Shared TypeScript types
```
