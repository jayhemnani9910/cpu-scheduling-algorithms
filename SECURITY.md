# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately rather than opening a public issue.

**Contact:** jayhemnani992000@gmail.com

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact

You can expect an initial response within 7 days.

## Scope

This project is a static client-side visualization. The primary risks are:
- XSS via untrusted input to the scheduling form
- Supply-chain risk from CDN-loaded dependencies (Google Charts, Chart.js)

Reports about either are welcome.
