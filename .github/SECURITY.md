# Security Policy

## Vulnerability Disclosure

If you discover a security vulnerability in this project, please email security@example.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

**Do not** open a public GitHub issue for security vulnerabilities.

## Security Scanning

This project uses multiple automated security tools to maintain code safety:

### 1. **npm audit** (Daily + On Push)
- Scans Node.js dependencies for known vulnerabilities
- Fails on CRITICAL severity
- Runs on schedule and every push to main/develop
- **Workflow:** `.github/workflows/security.yml`

### 2. **Snyk**
- Advanced vulnerability database beyond npm
- Detects supply chain attacks
- Requires SNYK_TOKEN for private projects
- **Action:** Snyk/actions/node@master
- **Status:** Check GitHub Actions > Security tab

### 3. **OWASP Dependency Check**
- Scans for known CVEs in dependencies
- Generates SARIF reports for GitHub Security
- Covers npm, Java, Python, etc.
- **Workflow:** `.github/workflows/security.yml`

### 4. **TruffleHog Secret Detection**
- Scans for leaked API keys, tokens, credentials
- Only reports verified secrets (high confidence)
- Runs on every push
- **Workflow:** `.github/workflows/security.yml`

### 5. **CodeQL Security Analysis**
- GitHub's code analysis engine
- Detects security patterns (SQL injection, XSS, etc.)
- JavaScript and TypeScript support
- **Workflow:** `.github/workflows/security.yml`
- **Results:** GitHub Security > Code scanning

### 6. **Dependabot** (Weekly)
- Automatically checks for dependency updates
- Creates PRs for security patches and updates
- Auto-configured in `.github/dependabot.yml`
- **Updates:** npm + GitHub Actions
- **Results:** Pull requests tagged `dependencies`

### 7. **ESLint + TypeScript**
- Code quality checks on every PR
- Type safety validation
- **Workflow:** `.github/workflows/code-quality.yml`
- **Triggers:** Push to main/develop/claude/*, PRs

## Workflow Summary

| Workflow | Frequency | Purpose |
|----------|-----------|---------|
| **security.yml** | Push + Daily | Full security audit (npm, Snyk, OWASP, TruffleHog, CodeQL) |
| **npm-audit-fix.yml** | Daily | Auto-fix vulnerabilities with PR |
| **code-quality.yml** | Push + PR | TypeScript, ESLint, build test |
| **dependabot.yml** | Weekly | Dependency updates |

## Quick Fixes

### Fix npm Vulnerabilities
```bash
npm audit fix
npm audit fix --force  # More aggressive, may break compatibility
npm ci  # Install from lock file to verify
```

### Run Security Scans Locally
```bash
# npm audit
npm audit --audit-level=moderate

# TypeScript
npx tsc --noEmit

# ESLint
npm run lint

# Build test
npm run build
```

## Environment Security

Never commit:
- `.env.local` — use `.env.example` template
- Private API keys
- Database credentials
- Bearer tokens

### Safe Practices
- ✅ Add secrets to `.github/settings` (for Actions)
- ✅ Use Railway dashboard for deployment secrets
- ✅ Rotate API keys monthly
- ✅ Use GitHub token for Snyk/security tools

## Dependencies with Known Issues

| Package | Current | Status | Fix |
|---------|---------|--------|-----|
| next | 15.1.11+ | ✅ Secure | Upgraded from 15.1.3 |
| react | ^19.0.0 | ✅ Secure | Latest |
| axios | ^1.6.0 | ✅ Secure | Keep updated |

## Railway.app Deployment

Railway blocks deployments with:
- CRITICAL CVEs in dependencies
- HIGH severity vulnerabilities (unless approved)

**Current status:** ✅ Zero critical vulnerabilities

To deploy:
1. Fix any npm audit issues locally
2. Push to branch
3. Railway CI will run security checks
4. If blocked: review CVE links, update packages, retry

## CI/CD Security Checks

1. **Before Merge:**
   - ✅ npm audit passes
   - ✅ TypeScript compiles
   - ✅ ESLint passes
   - ✅ Build succeeds
   - ✅ No secrets detected

2. **Before Deploy (Railway):**
   - ✅ Zero CRITICAL CVEs
   - ✅ No HIGH severity issues (critical only)
   - ✅ Code quality gates pass

## Security Headers

The app includes:
- Content Security Policy (CSP) recommendations
- No sensitive data in URLs
- HTTPS-only in production
- No hardcoded secrets in code

## Contact

For security questions or concerns:
- 📧 Email: security@example.com
- 🔒 GitHub Security Advisory: https://github.com/SimonTingle/International-energy/security
