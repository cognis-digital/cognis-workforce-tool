# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production  
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Backend API Development
```bash
# Start Cognis API server in development
npm run cognis:api:dev

# Start API server in production
npm run cognis:api

# Start AI agent server in development
npm run ai:dev

# Start AI agent server in production
npm run ai:start

# Start complete development environment
npm run cognis:dev
```

### Database & Supabase
```bash
# Start local Supabase instance
npm run supabase:start

# Stop Supabase
npm run supabase:stop

# Reset database with fresh migrations
npm run supabase:reset

# Check Supabase status
npm run supabase:status

# Deploy edge functions
npm run supabase:functions:deploy

# Serve edge functions locally
npm run supabase:functions:serve
```

### Smart Contracts
```bash
# Compile smart contracts
npm run contracts:compile

# Deploy to specific network
npm run contracts:deploy -- --network sepolia
npm run contracts:deploy -- --network mumbai

# Deploy to all supported testnets
npm run contracts:deploy-all

# Test a single contract deployment
npx hardhat run scripts/deploy.js --network weblocal
```

### Testing
```bash
# Run API tests (in cognis-api directory)
cd cognis-api && npm test

# Run specific test file
cd cognis-api && npm test -- auth.test.js
```

### Complete Setup
```bash
# Initial setup for new developers
npm run setup

# Complete production deployment
npm run cognis:deploy
```

## Architecture Overview

### Evolution Architecture System
This platform implements a revolutionary "Evolution Architecture" - a self-optimizing application system with:

- **Time-Series State Management**: Complete history tracking with snapshot capabilities for all application states
- **Polymorphic Code Generation**: Dynamic UI component creation based on observed state patterns  
- **State Analysis Engine**: Pattern detection and anomaly identification for continuous optimization
- **Adaptive UI Framework**: Components that evolve based on user interaction patterns
- **Blockchain Verification**: On-chain validation of critical AI-powered decisions

### Multi-Component Architecture

#### 1. Frontend Web Application (`/web/`)
- **Framework**: React 18 with TypeScript, Tailwind CSS, Framer Motion
- **State Management**: Zustand for global state, Immer for immutable updates
- **Authentication**: Supabase Auth with JWT tokens
- **Blockchain**: wagmi + RainbowKit for wallet connectivity
- **Entry Point**: `/web/src/main.js` - Event-driven system with agent registry

#### 2. Cognis API Backend (`/cognis-api/`)
- **Framework**: Express.js with TypeScript
- **Features**: OpenAI-compatible API endpoints, streaming support, rate limiting
- **Authentication**: JWT tokens and API key validation
- **Models Supported**: Cognis-Zenith-4.0, Cognis-Apex-3.5, Cognis-Vertex-4.0
- **Entry Point**: `src/index.ts`

#### 3. AI Workforce System (`/server/` and related files)
Event-driven agent-based system with specialized AI agents:
- **CEO Agent**: Parses natural language instructions into structured tasks
- **Writer Agent**: Generates content based on task specifications  
- **Validator Agent**: Validates content against requirements
- **Fixer Agent**: Automatically fixes issues identified in validation
- **Ops Agent**: Handles GitHub operations (commits, PRs, CI integration)

#### 4. Smart Contracts (`/contracts/`)
- **CognisLogger.sol**: Multi-chain logging contract deployed on all testnets
- **Networks Supported**: Ethereum Sepolia, Polygon Mumbai, BSC Testnet, Avalanche Fuji, Arbitrum Sepolia
- **Features**: Agent interaction logging, knowledge base tracking, lead generation events, batch operations

#### 5. Database Schema (Supabase)
Multi-tenant architecture with Row-Level Security:
- **Core Tables**: organizations, user_profiles, subscriptions, ai_agents
- **Knowledge System**: knowledge_bases, kb_embeddings, agent_interactions
- **Business Logic**: leads, blockchain_transactions
- **Evolution System**: evolution_states, evolution_snapshots

### Key Integration Points

#### Supabase Edge Functions
- **ai-chat**: Cognis AI integration endpoint
- **stripe-webhook**: Subscription lifecycle management  
- **create-checkout**: Stripe checkout session creation

#### Environment Configuration
The system uses multiple environment files:
- `.env.development` - Development configuration
- `.env.production` - Production settings
- `.env.staging` - Staging environment
- `cognis-api/.env.development` - API server specific config

#### Multi-Chain Blockchain Integration
- **Local Development**: Uses weblocal network (chainId: 31337)
- **Testnet Deployment**: Configured for 5 major testnets
- **Gas Optimization**: Batch operations in CognisLogger contract
- **Event Logging**: All critical AI operations logged on-chain

## Development Workflow

### For AI Agent Development
1. Agents are defined in the registry system (`/web/src/main.js`)
2. Each agent has: `id`, `name`, `systemPrompt`, `model`, `temperature`, `tools`
3. Communication happens via event system with `register()` and `wire()` functions
4. Support for both streaming and non-streaming responses

### For Smart Contract Development  
1. Contracts in `/contracts/` use OpenZeppelin standards
2. Both ESM (`hardhat.config.js`) and CommonJS (`hardhat.config.cjs`) configs available
3. Use `weblocal` network for local testing
4. Deploy to specific testnets or all at once with batch commands

### For Backend API Development
1. API follows OpenAI-compatible structure
2. All endpoints require Bearer token authentication
3. Comprehensive request validation with Joi/Zod
4. Rate limiting and caching implemented
5. Streaming responses supported for chat completions

### For Workforce System Development
1. Tasks are the core operational unit with structured format
2. Event-driven coordination between agents
3. Self-correction loop with validation and fixing
4. GitHub integration for automated PR creation
5. Comprehensive audit logging

## Subscription Tiers & Limits

- **Free**: 1 Basic AI Agent, 5 Document Uploads, 10 Lead Generation Searches
- **Basic ($20/mo)**: 3 Custom AI Agents, 50 Document Uploads, 100 Lead Generation Searches  
- **Pro ($50/mo)**: 10 Advanced AI Agents, 500 Document Uploads, 500 Lead Generation Searches
- **Enterprise ($100/mo)**: Unlimited AI Agents, Unlimited Document Uploads, Unlimited Lead Generation

## Important Implementation Notes

### Security Considerations
- Row-Level Security (RLS) enforced on all Supabase tables
- Smart contracts use OpenZeppelin's Ownable, ReentrancyGuard, Pausable
- API key protection in Edge Functions
- Stripe webhook signature verification
- JWT-based authentication throughout

### Performance Optimizations
- Smart contract gas optimization with batch operations
- Response caching in API layer
- Vector embeddings for knowledge base RAG
- Time-series state management for evolution tracking

### Multi-Network Deployment
When deploying smart contracts, the system automatically handles:
- Network-specific gas prices and limits
- Infura endpoints for reliable connectivity  
- Fallback networks and error handling
- Contract address management across networks

## File Organization Patterns

- `/web/` - Frontend React application
- `/cognis-api/` - Backend API server  
- `/contracts/` - Smart contracts
- `/docs/` - Comprehensive documentation
- `/server/` - AI workforce system (when present)
- `/.github/workflows/` - CI/CD pipelines
- Environment files at root and in service directories

This platform represents a comprehensive AI workforce automation system with blockchain integration, self-evolving architecture, and production-ready scalability.