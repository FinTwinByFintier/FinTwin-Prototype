# FinTwin

**Funding Readiness Platform** for Jordanian MSMEs — helps small businesses assess credit and Green Finance eligibility through simulation and mock data integration.

## Stack

- **Frontend** (`artifacts/fintwin`): React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, Framer Motion, Recharts, Wouter, i18next (Arabic/English)
- **Backend** (`artifacts/api-server`): Node.js, Express, Pino logging, Zod validation
- **Shared libs** (`lib/`): Drizzle ORM schema (`lib/db`), OpenAPI spec + Orval codegen (`lib/api-spec`), S3 file uploads (`lib/object-storage-web`)
- **Monorepo**: PNPM workspaces

## How to Run

Dependencies are installed via `pnpm install` at the root.

Workflows:
- **Frontend**: `artifacts/fintwin: web` — runs `vite --config vite.config.ts --host 0.0.0.0`
- **API**: `artifacts/api-server: API Server` — builds and starts Express server

The frontend is accessible at `/` in preview. The API runs at `/api`.

## Key Features

- Multi-step onboarding (business classification, mock CliQ/Sanad data connections)
- Credit & Green Finance scoring engine (`artifacts/fintwin/src/lib/simulationEngine.ts`)
- Interactive simulation dashboard (what-if scenarios: hiring, loans, solar)
- Loan pre-screening with PDF export (jspdf)
- Arabic/English i18n support

## Current Limitations

- **No persistence**: state is React Context only — resets on page refresh
- **Mocked data**: CliQ/JoFotara connections and dashboard scores are hardcoded
- **No live DB**: Drizzle schema exists in `lib/db` but no database is connected

## User Preferences
