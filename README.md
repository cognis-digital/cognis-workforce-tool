# Cognis Digital - Blockchain AI Agency Workforce Platform

A comprehensive, production-ready blockchain AI agency workforce application with complete authentication, subscription management, and operational functionality.

## 🚀 Features

- **Complete Authentication System**: Supabase-powered auth with tiered subscription paywall
- **AI Agent Management**: Create and manage specialized AI agents for different business roles
- **Knowledge Stack Builder**: Operational file management with AI processing and vector embeddings
- **Multi-chain Blockchain Integration**: Live wallet connectivity with smart contract logging
- **Lead Generation Hub**: AI-powered lead generation with customer interaction flows
- **Mobile-responsive Dashboard**: Real-time network statistics and comprehensive analytics
- **B2B Automation Workflows**: Complete business process automation

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (self-hosted), Edge Functions
- **AI**: OpenAI GPT-4/5 (branded as Cognis Digital)
- **Blockchain**: Ethereum, Polygon, BSC, Avalanche, Arbitrum (testnets)
- **Payments**: Stripe integration
- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin

## 📋 Prerequisites

- Node.js 18+
- Docker (for Supabase)
- Git
- Wallet with testnet tokens for deployment

## 🔧 Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd cognis-digital-platform
npm install
```

### 2. Environment Configuration

Update `.env` with your actual keys:

```env
# Supabase (auto-configured after supabase start)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# OpenAI
OPENAI_API_KEY=<your-openai-api-key>

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51QeUu1GEVYcs2xbF94uVpiyEPcgD92TY3WAQpbjXXTLf2giAbOZCJy2yqRhH2Ul9r77xi9cslgEx4pfElU2KK5Lt00cYegad7U
STRIPE_SECRET_KEY=<your-stripe-secret-key>

# Blockchain
PRIVATE_KEY=<your-wallet-private-key>
INFURA_PROJECT_ID=<your-infura-project-id>
```

### 3. Start Supabase

```bash
npm run supabase:start
```

This will:
- Start local Supabase instance
- Apply database migrations
- Set up authentication and RLS policies

### 4. Deploy Edge Functions

```bash
npm run supabase:deploy
```

### 5. Deploy Smart Contracts

```bash
# Deploy to all testnets
npm run contracts:deploy-all

# Or deploy to specific networks
npm run contracts:deploy -- --network sepolia
npm run contracts:deploy -- --network mumbai
```

### 6. Start Development Server

```bash
npm run dev
```

## 🏗 Architecture

### Database Schema

- **organizations**: Multi-tenant organization management
- **user_profiles**: User profiles with tier-based access control
- **subscriptions**: Stripe subscription management
- **ai_agents**: AI agent configurations and statistics
- **knowledge_bases**: File and document management
- **kb_embeddings**: Vector embeddings for RAG
- **agent_interactions**: Conversation history and analytics
- **leads**: Lead generation and management
- **blockchain_transactions**: On-chain activity logging

### Smart Contracts

**CognisLogger.sol** - Deployed on all testnets:
- Agent interaction logging
- Knowledge base update tracking
- Lead generation events
- Subscription tier changes
- Batch operations for gas efficiency

### Edge Functions

- **ai-chat**: OpenAI integration with Cognis branding
- **stripe-webhook**: Subscription lifecycle management
- **create-checkout**: Stripe checkout session creation

## 🔐 Security Features

- Row-Level Security (RLS) for multi-tenant data isolation
- JWT-based authentication with Supabase
- API key protection in Edge Functions
- Smart contract access controls and reentrancy protection
- Stripe webhook signature verification

## 💳 Subscription Tiers

- **Free**: 1 AI Agent, 100 tasks/month, basic support
- **Pro**: 5 AI Agents, 1,000 tasks/month, priority support
- **Enterprise**: Unlimited agents and tasks, dedicated support

## 🌐 Supported Networks

- Ethereum Sepolia Testnet
- Polygon Mumbai Testnet  
- BSC Testnet
- Avalanche Fuji Testnet
- Arbitrum Sepolia Testnet

## 🚀 Deployment

### Production Deployment

1. **Supabase Production**:
   - Create Supabase project
   - Update environment variables
   - Deploy functions: `supabase functions deploy`

2. **Smart Contracts**:
   - Deploy to mainnets with production keys
   - Update contract addresses in config

3. **Frontend**:
   - Build: `npm run build`
   - Deploy to Vercel/Netlify/your preferred platform

### Environment Variables for Production

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
OPENAI_API_KEY=your-openai-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📊 Monitoring & Analytics

- Real-time agent performance metrics
- Blockchain transaction tracking
- User engagement analytics
- Subscription conversion tracking
- Knowledge base usage statistics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: support@cognis.digital
- Documentation: [docs.cognis.digital](https://docs.cognis.digital)

---

**Cognis Digital** - Powering the future of AI workforce automation