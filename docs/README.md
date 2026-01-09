# Vortex Protocol - Documentation

Welcome to the Vortex Protocol documentation. This directory contains setup guides, API references, and configuration instructions.

## Quick Links

### Setup Guides
- **[Environment Setup](./ENVIRONMENT_SETUP.md)** - Configure environment variables
- **[API Keys Setup](./API_KEYS_SETUP.md)** - Get and configure all API keys
- **[Turnstile Setup](./TURNSTILE_SETUP.md)** - Configure Cloudflare Turnstile bot protection

### Codebase Documentation
- **[Codebase Audit Report](../CODEBASE_AUDIT_REPORT.md)** - Comprehensive codebase analysis
- **[Environment Variables Reference](../ENV_VARIABLES_REFERENCE.md)** - Complete env vars reference

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/2049foto/Vortex-.git
   cd Vortex-
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment**
   - Copy `.env.example` to `.env.local` (if exists)
   - Follow [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
   - Get API keys from [API Keys Setup Guide](./API_KEYS_SETUP.md)

4. **Validate configuration**
   ```bash
   bun run validate:env
   ```

5. **Run database migrations**
   ```bash
   bun db:push
   ```

6. **Start development server**
   ```bash
   bun dev
   ```

## Documentation Structure

```
docs/
├── README.md                 # This file
├── ENVIRONMENT_SETUP.md      # Environment variables setup
├── API_KEYS_SETUP.md         # API keys configuration
└── TURNSTILE_SETUP.md        # Cloudflare Turnstile setup
```

## Common Tasks

### Adding a New API Key

1. Add the key to `src/config/env.ts`:
   ```typescript
   NEW_API_KEY: z.string().optional(),
   ```

2. Add to `.env.local`:
   ```bash
   NEW_API_KEY=your_key_here
   ```

3. Update validation script (`scripts/validate-env.ts`) if needed

4. Run validation:
   ```bash
   bun run validate:env
   ```

### Enabling Strict Mode for Turnstile

1. Set in `.env.local`:
   ```bash
   TURNSTILE_STRICT_MODE=true
   ```

2. Ensure Turnstile keys are configured:
   ```bash
   TURNSTILE_SECRET_KEY=your_secret
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
   ```

3. Restart the server

## Troubleshooting

### Environment Variables Not Loading

- Check `.env.local` exists in project root
- Restart dev server after adding variables
- For Vercel: Add variables in dashboard, not `.env.local`

### Validation Script Fails

- Run `bun run validate:env` to see specific errors
- Check that required variables are set
- Verify variable names match exactly (case-sensitive)

### API Keys Not Working

- Verify keys are correct (no extra spaces)
- Check API key is active in provider dashboard
- Verify rate limits haven't been exceeded
- Check API key has correct permissions

## Support

For issues or questions:
- Check [Codebase Audit Report](../CODEBASE_AUDIT_REPORT.md)
- Review [Environment Variables Reference](../ENV_VARIABLES_REFERENCE.md)
- Open an issue on GitHub

---

**Last Updated:** January 9, 2026
