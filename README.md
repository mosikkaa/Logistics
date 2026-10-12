# Logistics CMS

An internal tool for logists to keep track of truck drivers, organized by destination.

- **Sign-in only.** Accounts are created by an admin. There's no public sign-up.
- **Drivers dashboard.** Tabs for each destination (Turkey, Azerbaijan, Armenia, Russia, Kazakhstan, Uzbekistan, Europe, Ukraine). A driver with several destinations shows up under each of them.
  Columns: Logist · Number · Name · Truck type · Destination · Description · WhatsApp (opens the chat).
- **Add driver in 2 steps.** You enter the phone number first. If it's already in the database, you see who added it (for example *"added by logist Luka Meskhi"*) and the driver's details, and you can't add it twice.
- **Check number page.** Check any number on its own, with a history of your recent checks. It's also available as a quick check in the header.
- **Smart paste.** Paste `+995 599 12 34 56` from WhatsApp and the code selector switches to **GE +995**, leaving only `599 12 34 56` in the field. Every number is stored as `+995599123456`, so the duplicate check always works.
- **Logists page.** The admin adds logists and can disable them. **Account** page for changing your password.
- **Permissions.** Only the driver's logist or an admin can edit or delete a driver.

Design: [Figma — Logistics CMS – Drivers](https://www.figma.com/design/U3kPj3hna6o6OxGgclGjOr)

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Cache Components), React 19, TypeScript |
| Styling | Tailwind CSS v4 (design tokens in `src/app/globals.css`) |
| Database | **Microsoft SQL Server** via Prisma ORM 7 + `@prisma/adapter-mssql` |
| Auth | Email + password (bcrypt), signed HTTP-only session cookie (`jose`) |
| Tests | Vitest (`src/lib/phone.test.ts`) |

## Getting started

Requirements: Node.js 20.9+ and a SQL Server 2017+ instance (Express, Developer, Standard, or Azure SQL all work).

### 1. Install

```bash
npm install
cp .env.example .env
```

### 2. Database

**Option A: local SQL Server in Docker**

```bash
docker compose up -d
```

The default `DATABASE_URL` in `.env.example` already points to this container.

**Option B: your existing SQL Server.** Put its connection string in `.env`:

```
DATABASE_URL="sqlserver://HOST:1433;database=logistics;user=USER;password=PASSWORD;encrypt=true;trustServerCertificate=true"
```

For SQL Server Express or a named instance, enable **TCP/IP** in SQL Server Configuration Manager and turn on **SQL Server authentication** (mixed mode). If the login isn't allowed to create databases, run `CREATE DATABASE logistics;` yourself first.

### 3. Fill in `.env`

- `SESSION_SECRET`: a random string of 32+ characters. Generate one with
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: the first admin account.

### 4. Create the tables and seed

```bash
npm run db:migrate -- --name init   # creates prisma/migrations and the tables
npm run db:seed                     # 8 destinations + your admin account
# optional demo data:
SEED_SAMPLE=1 npm run db:seed       # PowerShell: $env:SEED_SAMPLE=1; npm run db:seed
```

Commit the generated `prisma/migrations` folder.

### 5. Run

```bash
npm run dev        # http://localhost:3000
```

Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then add the other logists on the **Logists** page.

## Production

```bash
npm ci
npm run db:deploy  # applies committed migrations, never resets data
npm run build
npm start          # port 3000, change with: npm start -- -p 8080
```

Run it behind HTTPS. The session cookie is `Secure` in production. On Windows you can keep it running with a service manager such as [PM2](https://pm2.keymetrics.io/) or NSSM, and use IIS or nginx as a reverse proxy.

## Useful scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm test` | Unit tests (phone parsing and formatting) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create or apply migrations after changing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Seed destinations and the admin |
| `npm run db:studio` | Browse the database in Prisma Studio |

## How the code is organized

```
prisma/
  schema.prisma          User, Destination, Driver (unique phone), NumberCheck
  seed.ts                destinations + first admin (+ optional sample data)
src/
  proxy.ts               redirects signed-out visitors to /login (Next 16 "proxy" = old middleware)
  lib/
    phone.ts             smart paste: parsePhone / normalizePhone / formatPhone / whatsappUrl
    auth.ts              getCurrentUser() — the only place that reads the session
    session.ts           sign/verify the session cookie
    drivers.ts           database queries
    db.ts                Prisma client with the SQL Server adapter
  app/
    login/               sign-in page
    logout/route.ts      sign out (POST)
    actions/             Server Actions: auth, drivers, check, logists
    (app)/               signed-in area with sidebar
      page.tsx           drivers dashboard (tabs, filters, table)
      driver-dialog.tsx  Add driver (2 steps) / Edit driver
      check/             Check number page
      logists/           manage logists (admin)
      account/           change password
  components/            PhoneField, Modal, WhatsApp button, avatars
```

### Adding a destination or truck type

- **Destinations** are rows in the `Destination` table. Add them in `prisma/seed.ts` and re-run `npm run db:seed`, or insert them with Prisma Studio. `sortOrder` controls the tab order.
- **Truck types** are listed in `src/lib/constants.ts`.
- **Country codes** for the phone field are in `src/lib/phone.ts` (`COUNTRIES`).

## Notes on SQL Server

- SQL Server has no enum type, so `User.role` is a string: `"ADMIN"` or `"LOGIST"`.
- Text columns are `NVARCHAR`, so Georgian and Russian names are stored correctly.
- Search uses the database collation. The default (`SQL_Latin1_General_CP1_CI_AS`) is case-insensitive.
