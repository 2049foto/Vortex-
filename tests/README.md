# Vortex Protocol - Testing Documentation

## Overview

This directory contains comprehensive E2E and performance tests for Vortex Protocol.

## E2E Tests (Playwright)

### Setup

```bash
# Install dependencies
bun install

# Install Playwright browsers
bunx playwright install
```

### Running Tests

```bash
# Run all E2E tests
bun run test:e2e

# Run with UI mode
bun run test:e2e:ui

# Run in headed mode (see browser)
bun run test:e2e:headed

# Run specific test file
bunx playwright test tests/e2e/scan.spec.ts
```

### Test Structure

- `tests/e2e/landing.spec.ts` - Landing page tests
- `tests/e2e/scan.spec.ts` - Portfolio scanning tests
- `tests/e2e/consolidate.spec.ts` - Consolidation flow tests
- `tests/e2e/dashboard.spec.ts` - Dashboard tests
- `tests/e2e/api.spec.ts` - API endpoint tests

### Configuration

Tests are configured in `tests/e2e/playwright.config.ts`. The default base URL is `http://localhost:3000`.

Set `E2E_BASE_URL` environment variable to test against different environments:

```bash
E2E_BASE_URL=https://staging.example.com bun run test:e2e
```

## Performance Tests (k6)

### Setup

```bash
# Install k6
# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
# Download from https://k6.io/docs/getting-started/installation/
```

### Running Tests

```bash
# Run all performance tests
bun run test:performance

# Run specific test
bun run test:performance:scan
bun run test:performance:consolidate
bun run test:performance:analytics

# Run with custom base URL
BASE_URL=https://staging.example.com k6 run tests/performance/k6-scan.js
```

### Test Structure

- `tests/performance/k6-scan.js` - Scan endpoint load testing
- `tests/performance/k6-consolidate.js` - Consolidation endpoint load testing
- `tests/performance/k6-analytics.js` - Analytics endpoint load testing

### Performance Targets

- **Scan Endpoint:**
  - 95% of requests < 2s
  - Error rate < 5%
  - 95% of scans complete in 5s

- **Consolidation Endpoint:**
  - 95% of requests < 10s
  - Error rate < 10%
  - 95% complete in 15s

- **Analytics Endpoint:**
  - 95% of requests < 500ms
  - Error rate < 1%
  - 95% complete in 1s

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: bun install
      - run: bunx playwright install --with-deps
      - run: bun run test:e2e

  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: grafana/k6-action@v0.3.0
        with:
          filename: tests/performance/k6-scan.js
```

## Test Results

Test results are saved to:
- `test-results/` - Playwright test results
- `test-results/*.json` - k6 performance results

View Playwright HTML report:
```bash
bunx playwright show-report
```
