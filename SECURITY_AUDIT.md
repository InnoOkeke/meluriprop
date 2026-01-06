# Security Audit Report

**Date**: 2026-01-06
**Scope**: Full Codebase Audit (API, Web, Contracts)

## Executive Summary
The codebase follows standard security practices for a modern web3 application. Secrets are managed via environment variables, and authentication is handled via Privy. The most significant area for improvement is moving from local file storage to a cloud object store (S3/Cloudinary) for production.

## Findings

### 1. Secrets Management ✅
- **Status**: **PASS**
- **Observation**: No hardcoded private keys or secrets were found in the source code. All secrets are loaded from `process.env`.
- **Note**: Ensure `.env` is never committed. It is currently correctly listed in `.gitignore`.

### 2. API Security
- **Authentication**: **PASS**. `PrivyGuard` is correctly implemented to verify Bearer tokens on sensitive endpoints.
- **CORS**: **PASS**. CORS is enabled and restricted to specific origins (localhost + vercel domains).
- **File Uploads**: **WARNING**.
    - **Current**: Files are stored locally on the disk (`./api/uploads`).
    - **Risk**: In a production environment (like Render/Railway), the filesystem is ephemeral, meaning uploaded images will vanish on redeploy.
    - **Remediation**: Use an object storage service like AWS S3, Google Cloud Storage, or Cloudinary.
    - **Validation**: File extension checks are present, but consider stricter magic number checks for production.

### 3. Smart Contract Integration
- **Status**: **PASS**
- **Observation**: Private keys are used only for seeding/admin scripts. The frontend relies on the user's connected wallet (MetaMask/Coinbase) for transactions, which is the secure standard.
- **Admin scripts**: The admin seeding script logs a partial private key for debugging. Ensure this is removed or restricted in production logs.

### 4. Git Configuration
- **Status**: **FIXED** (during audit)
- **Observation**: `api/uploads` was missing from `.gitignore`, posing a risk of committing user content. This has been added.

## Recommendations for Production

1.  **Migrate to S3/Cloudinary**: Install `@nestjs/platform-express` multers3 or similar to stream uploads to the cloud.
2.  **Rate Limiting**: Implement `@nestjs/throttler` to prevent DoS attacks on the API.
3.  **Logging**: Remove private key logging in `seed-properties.ts` before final production deploy.
4.  **Content Security Policy (CSP)**: Add Helmet middleware (`npm i helmet`) to the NestJS app to set secure HTTP headers.

## Security Policy
Please report any vulnerabilities to the maintainers privately.
