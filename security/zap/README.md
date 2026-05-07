# OWASP ZAP Baseline Scan

Run the app first:

```bash
npm run dev
```

Then run the ZAP baseline scan:

```bash
npm run security:zap
```

The scan writes reports into this folder:

- `zap-report.html`
- `zap-report.json`

The package script uses Docker and targets `http://host.docker.internal:3000`, which lets the ZAP container reach the local Next.js dev server on Windows and Docker Desktop.
