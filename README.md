<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="apps/web/public/logo/dark.svg" />
    <img src="apps/web/public/logo/light.svg" alt="CloudCoffee" width="180" />
  </picture>

  <h1>CloudCoffee</h1>

  <p><strong>Your career knowledge base.</strong></p>
  <p>Capture your work, track opportunities, and turn career evidence into a resume built for the role.</p>

  <p>
    <a href="#quick-start"><strong>Quick start</strong></a>
    ·
    <a href="docs"><strong>Documentation</strong></a>
    ·
    <a href="https://github.com/unaisshemim/cloud-coffee/issues"><strong>Issues</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 24" />
    <img src="https://img.shields.io/badge/pnpm-11-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm 11" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-18A999?style=flat-square" alt="MIT License" /></a>
  </p>
</div>

---

CloudCoffee is an open-source workspace for managing the information behind a career—not only the final resume.
It keeps projects, outcomes, applications, and supporting evidence together, then helps turn that history into focused
resumes and interview-ready stories when an opportunity appears.

The project combines a career profile, application tracker, resume builder, ATS readability analysis, configurable AI,
and agent-friendly API and MCP interfaces in one self-hostable application.

## What CloudCoffee does

### Build a reusable career knowledge base

- Record projects, launches, metrics, feedback, and lessons while they are fresh.
- Maintain one career profile that can support many applications and resumes.
- Keep claims connected to concrete outcomes, artifacts, and context.
- Search and reuse past experience instead of rebuilding it for every opportunity.

### Run your job search

- Track companies, roles, stages, contacts, notes, follow-ups, and job descriptions.
- Link each application to the resume and files actually submitted.
- Import existing application records from CSV.
- Review pipeline, funnel, source, and activity insights.

### Create role-specific resumes

- Build resumes with a live preview and professionally designed templates.
- Tailor content around a job description and relevant career evidence.
- Customize typography, colors, spacing, page layout, and structured style rules.
- Export as PDF, DOCX, Markdown, or JSON.
- Share public resume links with optional password protection.
- Restore previous snapshots with built-in version history.

### Check and automate

- Inspect whether an applicant tracking system can read the exported resume.
- Configure supported AI providers with your own credentials.
- Draft summaries, bullets, cover-letter content, and application material from existing context.
- Integrate through authenticated APIs, MCP tools, and browser-native WebMCP workflows.

## Principles

- **Evidence over invention** — career material should remain grounded in work you actually did.
- **Portable data** — export structured data and documents without being locked into one format.
- **Private by default** — resumes stay private until explicitly shared; self-hosting keeps infrastructure under your control.
- **Provider choice** — AI is optional and configured with credentials you control.
- **Open source** — inspect, modify, and deploy the complete application under the MIT license.

## Quick start

### Requirements

- Node.js 24
- pnpm 11
- Docker with Docker Compose

### 1. Clone and install

```bash
git clone https://github.com/unaisshemim/cloud-coffee.git
cd cloud-coffee
pnpm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 3. Configure local environment

Generate an authentication secret:

```bash
openssl rand -hex 32
```

Create `.env.local` in the repository root:

```dotenv
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
AUTH_SECRET=replace-with-the-generated-secret
```

`.env.local` is ignored by Git. Never commit production credentials, OAuth secrets, provider keys, or Terraform state.

### 4. Start CloudCoffee

```bash
pnpm dlx @dotenvx/dotenvx run -f .env.local -- pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional services such as S3-compatible storage, SMTP, social authentication, and saved AI providers require additional
environment variables. See the [development guide](docs/contributing/development.mdx) and
[self-hosting guide](docs/self-hosting/docker.mdx).

## Technology

| Area | Stack |
| --- | --- |
| Web | TanStack Start, React 19, Vite, TanStack Router |
| Server | Hono on Node.js |
| Language | TypeScript |
| API | oRPC with OpenAPI adapters |
| Authentication | Better Auth |
| Database | PostgreSQL and Drizzle ORM |
| UI | Tailwind CSS, Base UI, shared component package |
| Client data | TanStack Query and Zustand |
| Documents | React PDF, PDF.js, DOCX, Markdown, JSON |
| Automation | MCP, WebMCP, JSON Patch API |
| Tooling | pnpm workspaces, Turborepo, Vitest, Biome |

## Repository structure

```text
apps/
├── web/          TanStack Start frontend and resume-builder experience
├── server/       Hono server, HTTP adapters, RPC, MCP, OpenAPI, and static serving
└── terraform/    AWS ECS, networking, storage, DNS, and GitHub OIDC infrastructure

packages/
├── api/          Feature-owned oRPC procedures and application services
├── auth/         Better Auth configuration and helpers
├── db/           Drizzle client and PostgreSQL schema
├── schema/       Resume, application, profile, and template models
├── resume/       Resume-domain transforms, patches, and ATS analysis
├── pdf/          Resume templates and PDF rendering
├── docx/         DOCX generation
├── import/       Resume import adapters
├── ai/           AI provider and resume-processing utilities
├── mcp/          MCP tools, prompts, resources, and metadata
├── ui/           Shared UI components and hooks
└── env/          Validated server environment configuration
```

Production builds run as one Node.js process on port `3000`. The server owns API, authentication, MCP, OpenAPI, upload,
and health routes while serving the compiled web application.

## Useful commands

| Command | Purpose |
| --- | --- |
| `pnpm dlx @dotenvx/dotenvx run -f .env.local -- pnpm dev` | Start web and server development processes |
| `pnpm dlx @dotenvx/dotenvx run -f .env.local -- pnpm dev:web` | Start the web development process only |
| `pnpm test` | Run Vitest across workspaces |
| `pnpm typecheck` | Type-check all workspaces |
| `pnpm build` | Build production web and server bundles |
| `pnpm exec turbo boundaries` | Validate package boundaries |
| `pnpm check` | Format and lint the repository; this command can modify files |

## Deployment

### Docker

CloudCoffee includes a production `Dockerfile` and Docker Compose stack. The application starts after database migrations
complete and exposes `/api/health` for database and storage health checks.

Read [Self-hosting with Docker](docs/self-hosting/docker.mdx) before deploying. Configure secrets through environment
injection or your platform's secret manager; do not bake them into an image or commit them to the repository.

### AWS ECS with Terraform

`apps/terraform` provisions the supported AWS deployment path, including networking, ECS/Fargate, load balancing, ECR,
S3 storage, IAM, GitHub Actions OIDC, and optional Cloudflare DNS.

Terraform state and real `*.tfvars` files are ignored. Use the checked-in example variable files only as templates and
keep credentials in your shell, CI secret store, or cloud secret manager.

See the [AWS ECS deployment guide](apps/terraform/README.md) for prerequisites, remote-state bootstrap, planning,
deployment, verification, and teardown.

## Documentation

Project documentation lives in [`docs/`](docs):

- [Development setup](docs/contributing/development.mdx)
- [Architecture](docs/contributing/architecture.mdx)
- [Creating your first resume](docs/guides/creating-your-first-resume.mdx)
- [Tracking job applications](docs/guides/tracking-job-applications.mdx)
- [Using the ATS checker](docs/guides/using-the-ats-checker.mdx)
- [Exporting resumes](docs/guides/exporting-your-resume.mdx)
- [Using AI](docs/guides/using-ai.mdx)
- [Self-hosting](docs/self-hosting/docker.mdx)

## Contributing

Issues and pull requests are welcome. Before opening a change:

1. Create a focused branch.
2. Follow existing package and feature boundaries.
3. Add or update tests for behavior changes.
4. Run the narrowest relevant tests, then `pnpm typecheck` and boundary checks when applicable.
5. Never commit `.env.local`, Terraform state, provider credentials, user data, or generated local output.

Use [GitHub Issues](https://github.com/unaisshemim/cloud-coffee/issues) for reproducible bugs and scoped feature requests.

## Project history

CloudCoffee builds on the open-source foundation of
[Reactive Resume](https://github.com/AmruthPillai/Reactive-Resume) by Amruth Pillai and its contributors. This fork
extends that resume-building foundation into a broader career knowledge base, application tracker, and automation
workspace.

## License

CloudCoffee is available under the [MIT License](LICENSE). Retain applicable copyright and license notices when
redistributing the software.
