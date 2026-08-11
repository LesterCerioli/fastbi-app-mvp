 FastBI-App

**FastBI** is a full-stack, multi-tenant Business Intelligence SaaS platform for small and medium-sized businesses. Turn your data into intelligent decisions with dashboards, KPIs, automated reporting, workflow management, and AI-powered analytics.

Built with [Next.js](https://nextjs.org) and bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- **Dashboards & KPIs** — Customizable dashboards with real-time widgets and KPI tracking
- **Automated Reporting** — Scheduled report generation with narrative, preview, and export (CSV, Excel, PDF)
- **Workflow Management** — Industrial, automotive, and accounting workflow engines with status tracking and analytics
- **Customer Analytics** — LTV, churn prediction, segmentation, and at-risk detection
- **AI-Powered Insights** — Anomaly detection, root cause analysis, recommendation engine, and natural language reporting
- **Multi-Tenant** — Organization management with Brazilian CNPJ and US EIN tax ID support
- **White-Label Branding** — Per-organization brand configuration (logo, colors, report templates)
- **External Integrations** — Connect to external databases, Stripe billing, RabbitMQ message queues, email notifications

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Queue:** RabbitMQ (CloudAMQP)
- **Auth:** JWT (client credentials flow)
- **Payments:** Stripe
- **Email:** Nodemailer
- **Testing:** Jest 30

## Production Rules

> **⚠️ NEVER stop, restart, kill processes, or modify Docker containers in production.**
> All running containers are production — do not touch them. Use only HTTP calls to exposed services.

## Project Structure

```
src/
├── app/          # Next.js App Router pages and layouts
├── components/   # Shared UI components
├── lib/          # Utility functions and shared logic
├── services/     # Backend services (API, database, integrations)
│   ├── ai/           # AI/ML services (anomaly detection, RAG, recommendations)
│   ├── data_engineering/  # Data import/export, encryption, query execution
│   ├── reports/          # Reporting engine (scheduling, narrative, preview)
│   ├── streaming/        # Real-time event streaming (SSE, RabbitMQ, KPI streams)
│   └── ...
tests/           # Jest test suites
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Docker

Build the Docker image (pass the real Stripe key via `--build-arg`):

```bash
docker build \
  --build-arg NEXT_PUBLIC_STRIPE_API_KEY=ssssssssss_...
  -t ltservices/fastapp:1.0.3 .
```

Run the container using the `.env` file:

```bash
docker run -d \
  --name fastbi-app \
  --env-file .env \
  -p 4010:4010 \
  ltservices/fastapp:1.0.3
```

## Running Tests

```bash
npm test
```

The project uses [Jest](https://jestjs.io) with `ts-jest` for TypeScript support. Test files are located in the `tests/` directory.

####tttt

###jjjjjjjj


