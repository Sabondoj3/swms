# Prisma baseline for the existing SWMS database

The repository originally had no initial Prisma migration. The database was created before migration history was introduced, so `prisma migrate deploy` can fail with `P3005: The database schema is not empty`.

A baseline migration is now included at:

```text
prisma/migrations/00000000000000_baseline/migration.sql
```

It represents the original SWMS schema before the later Smart Bins, collector payments, push subscriptions, and configurable collector-rate migrations.

## Existing production database

Run these commands from a trusted machine with the production `DATABASE_URL` and `DIRECT_URL` set. Take a database backup first.

```bash
npx prisma migrate status
npx prisma migrate resolve --applied 00000000000000_baseline
```

If the production database already contains the later feature tables, mark only the migrations that are already present as applied. For a database that already includes all current SWMS features, that is:

```bash
npx prisma migrate resolve --applied 20261017000000_add_smart_bins
npx prisma migrate resolve --applied 20261020140000_add_collector_payments
npx prisma migrate resolve --applied 20261020150000_add_push_subscriptions
npx prisma migrate resolve --applied 20261020160000_add_collector_rates
```

Do **not** mark a migration as applied if its tables, columns, or enums are not actually present. In that case, mark only the baseline and let the following command apply the missing migrations:

```bash
npx prisma migrate deploy
```

Finally verify:

```bash
npx prisma migrate status
```

The Netlify application build intentionally does not run migrations. This prevents a build from failing before the production database has been baselined. After the one-time baseline procedure, apply pending migrations explicitly with:

```bash
npm run db:migrate
```

The five migration folder names currently in this repository are:

```text
00000000000000_baseline
20261017000000_add_smart_bins
20261020140000_add_collector_payments
20261020150000_add_push_subscriptions
20261020160000_add_collector_rates
```
