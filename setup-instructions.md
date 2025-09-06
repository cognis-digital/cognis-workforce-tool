# Cognis Digital Platform Setup Instructions

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Update the `.env` file with your actual API keys:

```env
# Required: Add your Cognis API key
COGNIS_API_KEY=sk-your-cognis-api-key-here

# Required: Add your Stripe secret key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key-here

# Optional: For blockchain deployment
PRIVATE_KEY=your-wallet-private-key-here
INFURA_PROJECT_ID=your-infura-project-id-here
```

### 3. Start Local Supabase
```bash
npm run supabase:start
```

This will:
- Start PostgreSQL database on localhost:54322
- Start Supabase Studio on localhost:54323
- Start API server on localhost:54321
- Apply all database migrations
- Set up authentication and RLS policies

### 4. Deploy Edge Functions
```bash
npm run supabase:functions:deploy
```

### 5. Start Development Server
```bash
npm run dev
```

## 🔧 Production Deployment

### 1. Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Create a new project
3. Copy your project URL and anon key
4. Update `.env` with production values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
```

### 2. Deploy Functions to Production
```bash
npx supabase functions deploy --project-ref your-project-ref
```

### 3. Build for Production
```bash
npm run build
```

## 🔐 Security Checklist

- ✅ All API keys are in environment variables
- ✅ Supabase RLS policies are enabled
- ✅ Stripe webhooks are properly secured
- ✅ No secrets in client-side code
- ✅ CORS properly configured

## 🧪 Testing

### Demo Account
Use the demo login button on the login page:
- Email: demo@cognis.digital
- Password: demo123

### Test Stripe Integration
Use Stripe test card numbers:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

### Test Blockchain
1. Connect MetaMask to Sepolia testnet
2. Get test ETH from faucet
3. Test agent interactions and blockchain logging

## 📊 Monitoring

- Supabase Studio: http://localhost:54323 (local)
- Database logs and metrics available in Supabase dashboard
- Edge function logs in Supabase Functions section
- Stripe webhook logs in Stripe dashboard

## 🆘 Troubleshooting

### Supabase Connection Issues
```bash
npm run supabase:status
npm run supabase:stop
npm run supabase:start
```

### Edge Function Deployment Issues
```bash
npx supabase functions serve --env-file .env
```

### Build Issues
```bash
npm run lint
npm audit fix
```

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `COGNIS_API_KEY` | Cognis API key for AI functions | ✅ |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ✅ |
| `PRIVATE_KEY` | Wallet private key for contracts | ⚠️ |
| `INFURA_PROJECT_ID` | Infura project ID | ⚠️ |

⚠️ = Optional for basic functionality, required for blockchain features