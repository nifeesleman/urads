# UrAds

A two-sided marketplace connecting **Advertisers** and **Influencers** with blockchain-powered escrow payments. Brands create campaigns and manage influencer partnerships, while influencers build profiles, discover opportunities, and get paid securely through on-chain USDC escrow contracts.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Smart Contracts](#smart-contracts)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Advertisers

- Create, edit, and manage campaigns with budgets and deadlines
- Review incoming applications and accept or reject influencers
- Fund campaigns through USDC escrow and approve deliverables
- Discover influencers with AI-powered matching tools
- Real-time messaging with influencers

### Influencers

- Build rich profiles with bio, niches, social platforms, and portfolio
- Browse and apply to active campaigns
- Submit deliverables and receive escrow-protected USDC payments
- Track earnings and application status with real-time notifications

### Admins

- Manage users, campaigns, and platform disputes
- Monitor overall platform activity from a dedicated dashboard

### General

- Wallet-based authentication via MetaMask
- Real-time notifications for messages and application updates
- Responsive design for desktop and mobile
- Role-based access control (advertiser, influencer, admin)

---

## Tech Stack

| Category | Technology |
| --- | --- |
| **Frontend** | [React 18](https://react.dev/) · [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) · [shadcn/ui](https://ui.shadcn.com/) |
| **Routing** | [React Router 6](https://reactrouter.com/) |
| **State / Data** | [TanStack React Query](https://tanstack.com/query) · [React Hook Form](https://react-hook-form.com/) · [Zod](https://zod.dev/) |
| **Backend** | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Edge Functions) |
| **Web3** | [ethers.js 6](https://docs.ethers.org/v6/) · Solidity smart contracts (Sepolia testnet) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Testing** | [Vitest](https://vitest.dev/) · [React Testing Library](https://testing-library.com/) |
| **Linting** | [ESLint](https://eslint.org/) |

---

## Project Structure

```
urads/
├── contracts/               # Solidity smart contracts
│   ├── CampaignEscrow.sol   #   Individual campaign escrow
│   └── EscrowFactory.sol    #   Factory for deploying escrows
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable React components
│   │   ├── ui/              #   shadcn/ui primitives
│   │   ├── applications/    #   Application management
│   │   ├── campaigns/       #   Campaign creation & discovery
│   │   ├── messaging/       #   Chat and conversations
│   │   ├── wallet/          #   Web3 wallet integration
│   │   ├── auth/            #   Protected routes
│   │   ├── influencer/      #   Profile components
│   │   ├── landing/         #   Landing page sections
│   │   └── layout/          #   Dashboard layout
│   ├── contexts/            # React context providers
│   │   ├── AuthContext.tsx   #   Authentication state
│   │   └── Web3Context.tsx  #   Wallet connection state
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # External service clients (Supabase)
│   ├── lib/                 # Utilities and contract ABIs
│   ├── pages/               # Route-level page components
│   │   ├── advertiser/      #   Advertiser dashboard & pages
│   │   ├── influencer/      #   Influencer dashboard & pages
│   │   └── admin/           #   Admin dashboard & pages
│   ├── test/                # Test setup
│   ├── App.tsx              # Root component with routing
│   └── main.tsx             # Application entry point
├── supabase/                # Supabase config, migrations, functions
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) (included with Node.js)
- A [MetaMask](https://metamask.io/) wallet (for Web3 features)
- A [Supabase](https://supabase.com/) project (for backend services)

### Installation

```bash
# Clone the repository
git clone https://github.com/nifeesleman/urads.git
cd urads

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:8080**.

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:dev` | Build with development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |
| `npm run test` | Run tests once with Vitest |
| `npm run test:watch` | Run tests in watch mode |

---

## Smart Contracts

UrAds uses Solidity smart contracts on the **Ethereum Sepolia testnet** to handle escrow payments in USDC.

### EscrowFactory

Deploys and tracks individual `CampaignEscrow` contracts. When an advertiser funds a campaign, the factory creates a new escrow, transfers USDC into it, and records the campaign for both brand and influencer.

### CampaignEscrow

Holds USDC for a single campaign. The lifecycle is:

1. **Brand funds** — USDC is locked in the escrow at creation.
2. **Influencer submits work** — calls `submitWork(url)` before the deadline.
3. **Brand approves** — calls `approve()` to release payment (minus platform fee) to the influencer.
4. **Timeout claim** — if the brand doesn't approve by the deadline, the influencer can call `claimTimeout()`.
5. **Refund** — if the influencer never delivers by the deadline, the brand can call `refund()`.

Contract source files are in the `contracts/` directory.

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

These values come from your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api).

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m "Add your feature"`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a pull request.

---

## License

This project is private.
