# 4Lebanon CI/CD Pipeline

## Overview

This document describes the continuous integration and deployment pipeline for the 4Lebanon news website.

## Pipeline Architecture

```
Developer → Local Hooks → GitHub → GitHub Actions → Vercel
    │           │            │           │             │
    │           │            │           │             └─→ Production
    │           │            │           │             └─→ Preview
    │           │            │           └─→ Lint + Type + Build
    │           │            └─→ PR/Push triggers
    │           └─→ Husky pre-commit
    └─→ Code changes
```

## Local Development Checks

### Husky Pre-commit Hook

Every commit runs:

```bash
# .husky/pre-commit
npx lint-staged
npm run typecheck
```

### lint-staged Configuration

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

**Benefits**:

- Catches errors before they reach CI
- Formats code consistently
- Faster feedback loop

## GitHub Actions CI

### Trigger Events

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

### CI Jobs

```yaml
jobs:
  check:
    steps:
      - Checkout repository
      - Setup Node.js 20
      - Install dependencies (npm ci)
      - TypeScript check (npm run typecheck)
      - ESLint (npm run lint)
      - Build (npm run build)
```

### Environment Variables in CI

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

**Note**: Use placeholder values if secrets aren't set (for open-source forks).

## Vercel Deployment

### Automatic Deployments

| Branch      | Environment | URL                             |
| ----------- | ----------- | ------------------------------- |
| `main`      | Production  | your-domain.com                 |
| `develop`   | Staging     | develop-your-project.vercel.app |
| PR branches | Preview     | pr-123-your-project.vercel.app  |

### Deployment Process

1. Push to GitHub
2. Vercel detects changes
3. Runs `npm run build`
4. Deploys to edge network
5. Invalidates CDN cache

### Preview Deployments

Every pull request gets:

- Unique preview URL
- Own environment
- Comment on PR with link

## Database Migrations

### Manual Migration Flow

Supabase migrations are **not** automatically deployed. Process:

1. Create migration file: `supabase/migrations/00X_name.sql`
2. Test locally with Supabase CLI
3. Apply to staging manually
4. After verification, apply to production

```bash
# Local testing
supabase start
supabase db reset  # Applies all migrations

# Production
supabase link --project-ref your-ref
supabase db push
```

### Migration Best Practices

- Never modify existing migrations
- Add new migrations for schema changes
- Test migrations on staging first
- Back up production before major changes

## Environment Management

### Environments

| Environment | Supabase Project   | Vercel Environment |
| ----------- | ------------------ | ------------------ |
| Development | Local/Dev          | -                  |
| Staging     | Staging project    | Preview            |
| Production  | Production project | Production         |

### Secrets Management

1. **Local**: `.env.local` (gitignored)
2. **GitHub**: Repository secrets for CI
3. **Vercel**: Environment variables per environment

## Rollback Procedure

### Vercel Rollback

1. Go to Vercel Dashboard > Deployments
2. Find previous working deployment
3. Click "..." > "Promote to Production"

### Database Rollback

1. Use Supabase Point-in-Time Recovery (Pro plan)
2. Or restore from backup
3. Or write reverse migration

## Monitoring & Alerts

### Vercel Monitoring

- Build logs in Vercel Dashboard
- Function logs for API routes
- Analytics for performance metrics

### GitHub Actions

- Email notifications on failure
- Status checks on PRs
- Action run history

## Security Considerations

### Protected Branches

Configure in GitHub:

- Require PR reviews before merge
- Require status checks to pass
- Require linear history (optional)

### Secret Rotation

Periodically rotate:

- `SUPABASE_SERVICE_ROLE_KEY`
- `REVALIDATE_SECRET`

Update in all environments simultaneously.

## Troubleshooting

### Build Failures

1. Check GitHub Actions logs
2. Verify environment variables
3. Run `npm run build` locally
4. Check for TypeScript errors

### Deployment Issues

1. Check Vercel deployment logs
2. Verify environment variables in Vercel
3. Check for runtime errors in function logs

### Common Fixes

```bash
# Clear Next.js cache
rm -rf .next

# Reset node_modules
rm -rf node_modules package-lock.json
npm install

# Verify build locally
npm run build
```
