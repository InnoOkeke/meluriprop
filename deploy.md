Deployment Recommendations
Since your project is split into distinct services, it's best to deploy them to specialized platforms:

1. Frontend (Web)

Best Option: Vercel (Creators of Next.js). It requires zero configuration.
How: Connect your GitHub repo to Vercel, select the web folder as the root, and it validates automatically.
2. Backend (API)

Best Option: Railway or Render.
Why: Unlike Vercel (which is serverless), NestJS runs best on a persistent server. Railway/Render also provides a PostgreSQL Database out of the box, which you need for Prisma.
How: Connect your repo, set the Root Directory to api, and set the Build Command to npm run build and Start Command to npm run start:prod.
3. Contracts

Status: You are already deploying these to the ARC Testnet via your Hardhat scripts. No server needed, they live on the blockchain.
4. Mobile

Status: This would be built via Expo Application Services (EAS) to generate APK/IPA files for app stores.