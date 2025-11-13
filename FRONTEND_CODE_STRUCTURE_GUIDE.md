# Magic Roulette Frontend Code Structure Guide
*Comprehensive Documentation for the Frontend Application*

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Directory Structure](#directory-structure)
4. [Core Files Explained](#core-files-explained)
5. [Component Architecture](#component-architecture)
6. [API Routes](#api-routes)
7. [State Management](#state-management)
8. [Styling & UI](#styling--ui)
9. [Build & Development](#build--development)
10. [Integration Points](#integration-points)

---

## 📊 Project Overview

**Magic Roulette** is a Solana-based decentralized roulette game built with Next.js 16. The frontend provides a modern, responsive casino interface that connects to Solana wallets and interacts with on-chain smart contracts.

### Key Features:
- 🎰 Real-time roulette gameplay
- 💳 Solana wallet integration (Phantom, Solflare, etc.)
- 🎨 Modern casino-themed UI with gradients and animations
- 📱 Responsive design for all devices
- 🔗 Blockchain interaction with smart contracts
- 📊 Real-time game statistics and history

---

## 🏗️ Architecture & Tech Stack

### **Frontend Framework**
- **Next.js 16**: React framework with App Router architecture
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe JavaScript development

### **Solana Integration**
- **@solana/wallet-adapter-react**: Wallet connection management
- **@jup-ag/wallet-adapter**: Jupiter wallet integration
- **@solana/web3.js**: Solana blockchain interaction

### **Styling & UI**
- **Tailwind CSS 4**: Utility-first styling framework
- **Custom gradients**: Casino-themed visual effects
- **Responsive design**: Mobile-first approach

### **Data & State**
- **SWR**: Data fetching and caching
- **React hooks**: Component state management
- **Sonner**: Toast notifications

---

## 📁 Directory Structure

```
app/
├── 📁 public/                    # Static assets
├── 📁 src/
│   ├── 📁 app/                   # Next.js App Router
│   │   ├── 📁 api/              # API routes (server-side)
│   │   │   ├── 📁 accounts/     # Account-related endpoints
│   │   │   │   ├── 📁 bets/     # Betting data
│   │   │   │   ├── 📁 rounds/   # Game round data
│   │   │   │   └── 📁 table/    # Table state data
│   │   │   └── 📁 transaction/  # Transaction handling
│   │   ├── 📄 globals.css       # Global styles
│   │   ├── 📄 layout.tsx        # Root layout component
│   │   ├── 📄 page.tsx          # Home page component
│   │   └── 📄 favicon.ico       # App icon
│   ├── 📁 components/           # Reusable components
│   │   ├── 📁 provider/         # Context providers
│   │   ├── 📁 ui/               # UI components
│   │   ├── 📄 WalletButton.tsx  # Wallet connection
│   │   └── 📄 ToastContent.tsx  # Notification content
│   ├── 📁 lib/                  # Utility functions
│   ├── 📁 types/                # TypeScript definitions
│   ├── 📁 idl/                  # Solana program interfaces
│   └── 📁 providers/            # Global providers
├── 📄 package.json              # Dependencies & scripts
├── 📄 tsconfig.json             # TypeScript config
├── 📄 tailwind.config.js        # Tailwind CSS config
└── 📄 next.config.ts            # Next.js configuration
```

---

## 🔍 Core Files Explained

### **📄 `src/app/layout.tsx`** - Root Layout
```typescript
Purpose: App-wide layout and providers
```
**What it does:**
- Sets up HTML document structure
- Loads Google Fonts (Geist Sans & Mono)
- Wraps app with wallet providers
- Configures toast notifications
- Provides global metadata

**Key Components:**
- Font configuration
- Wallet provider wrapper
- Toast notification system
- Global CSS imports

---

### **📄 `src/app/page.tsx`** - Home Page
```typescript
Purpose: Main landing page and game interface
```
**What it does:**
- Displays casino-themed gradient background
- Shows app title and branding
- Renders wallet connection component
- Provides main game interface structure

**Visual Elements:**
- Multi-layer gradient backgrounds
- Animated overlay effects
- Responsive layout system
- Card-based UI components

---

### **📄 `src/components/WalletButton.tsx`** - Wallet Integration
```typescript
Purpose: Solana wallet connection interface
```
**What it does:**
- Handles wallet connection/disconnection
- Displays connection status
- Shows wallet address when connected
- Provides copy functionality
- Uses dynamic imports for SSR compatibility

**Key Features:**
- Multi-wallet support (Phantom, Solflare, etc.)
- Hydration error prevention
- Loading states
- Tooltip integration

---

### **📄 `src/app/globals.css`** - Global Styles
```css
Purpose: App-wide styling and CSS variables
```
**What it includes:**
- Tailwind CSS imports
- Custom CSS variables
- Casino-themed color schemes
- Animation definitions
- Responsive utilities

**Casino Theme Elements:**
- Purple/emerald gradients
- Neon glow effects
- Card shadows
- Button hover states

---

## 🧩 Component Architecture

### **Provider Pattern**
```
Root App
├── WalletProviders (Solana connection)
├── ToastProvider (Notifications)
└── ThemeProvider (UI theming)
```

### **Component Hierarchy**
```
Layout
├── Header (Navigation + Wallet)
├── Main (Game Interface)
│   ├── RouletteWheel
│   ├── BettingInterface  
│   └── GameStats
└── Footer (App info)
```

### **UI Components** (`src/components/ui/`)
- **Card**: Container components with styling
- **Button**: Interactive elements
- **Tooltip**: Information overlays
- **Badge**: Status indicators
- **Input**: Form elements

---

## 🌐 API Routes

### **📁 `src/app/api/accounts/`**
Server-side API endpoints for account data:

#### **📁 `bets/`**
- **Purpose**: Handle betting transactions
- **Methods**: GET, POST
- **Data**: Bet history, active bets, payouts

#### **📁 `rounds/`** 
- **Purpose**: Game round management
- **Methods**: GET, POST
- **Data**: Round results, timing, statistics

#### **📁 `table/`**
- **Purpose**: Table state management  
- **Methods**: GET, PUT
- **Data**: Table limits, active players, pool

### **📁 `src/app/api/transaction/`**
- **Purpose**: Blockchain transaction handling
- **Methods**: POST
- **Data**: Transaction signatures, confirmations

---

## 🎨 Styling & UI

### **Tailwind Configuration**
- **Version**: Tailwind CSS 4
- **Features**: JIT compilation, custom utilities
- **Theme**: Extended with casino colors

### **Design System**
```css
Colors:
├── Primary: Purple gradients
├── Secondary: Emerald accents  
├── Background: Dark slate
└── Text: White with shadows

Effects:
├── Gradients: Multi-stop backgrounds
├── Shadows: Depth and elevation
├── Animations: Hover and focus states
└── Responsive: Mobile-first breakpoints
```

### **Component Styling Patterns**
- **Glass morphism**: Semi-transparent overlays
- **Gradient borders**: Neon-effect boundaries
- **Hover animations**: Interactive feedback
- **Loading states**: Skeleton placeholders

---

## 🔧 Build & Development

### **Package Scripts**
```json
{
  "dev": "next dev",           // Development server
  "build": "next build",       // Production build
  "start": "next start",       // Production server  
  "lint": "eslint"            // Code linting
}
```

### **Development Workflow**
1. **Local Development**: `bun dev` (port 3000)
2. **Hot Reloading**: Automatic updates
3. **Type Checking**: Real-time TypeScript validation
4. **Linting**: ESLint integration

### **Build Output**
- **Static Generation**: Pre-rendered pages
- **API Routes**: Server-side functions
- **Assets**: Optimized images and fonts
- **Chunks**: Code splitting for performance

---

## 🔗 Integration Points

### **Solana Blockchain**
```typescript
Connection Flow:
├── Wallet Detection
├── Connection Request
├── Account Access
├── Transaction Signing
└── Confirmation Handling
```

### **Smart Contract Integration**
- **Program ID**: Solana program identifier
- **IDL Files**: Interface definitions
- **Account Structure**: On-chain data layout
- **Instruction Handling**: Transaction building

### **Data Flow**
```
User Action → Component State → API Call → Blockchain → Response → UI Update
```

---

## 📊 State Management

### **Client State**
- **Wallet Connection**: Connected wallet info
- **Game State**: Current round, bets, results
- **UI State**: Modals, loading, errors

### **Server State** (via SWR)
- **Account Data**: Fetched from API routes
- **Caching**: Automatic background updates
- **Revalidation**: Smart data refreshing

### **Global Context**
- **WalletContext**: Wallet connection state
- **GameContext**: Game-specific data
- **ThemeContext**: UI appearance settings

---

## 🚀 Performance Optimizations

### **Next.js Features**
- **App Router**: File-based routing
- **Dynamic Imports**: Code splitting
- **Image Optimization**: Automatic compression
- **Font Loading**: Preload and optimize

### **React Optimizations**
- **Memo**: Prevent unnecessary re-renders
- **Suspense**: Loading state management
- **Error Boundaries**: Graceful error handling

### **Solana Optimizations**
- **Connection Pooling**: Reuse RPC connections
- **Transaction Batching**: Group operations
- **Account Caching**: Reduce network calls

---

## 🎯 Use Cases & Features

### **Primary Use Cases**
1. **Wallet Connection**: Users connect Solana wallets
2. **Place Bets**: Users bet on roulette numbers/colors
3. **Game Rounds**: Automated roulette spinning
4. **Payout Distribution**: Automatic winner payouts
5. **Game History**: View past rounds and results

### **User Flows**
```
New User:
Connect Wallet → View Rules → Place Bet → Watch Spin → Receive Payout

Returning User:  
Auto-connect → Check History → Place New Bet → Continue Playing
```

### **Admin Features**
- Game configuration via API
- Round management
- Statistics tracking
- Emergency controls

---

## 🔒 Security Considerations

### **Wallet Security**
- No private key storage
- User-controlled signatures
- Secure connection protocols

### **Transaction Safety**  
- Input validation
- Amount limits
- Confirmation requirements

### **UI Security**
- XSS protection
- CSRF prevention
- Secure API endpoints

---

## 📈 Future Enhancements

### **Planned Features**
- [ ] Multi-table support
- [ ] Tournament modes
- [ ] Social features (chat, leaderboards)
- [ ] Mobile app version
- [ ] Advanced betting options

### **Technical Improvements**
- [ ] WebSocket integration for real-time updates
- [ ] Progressive Web App (PWA) features
- [ ] Advanced caching strategies
- [ ] Performance monitoring

---

## 🛠️ Development Guidelines

### **Code Standards**
- **TypeScript**: Strict type checking
- **ESLint**: Consistent code formatting
- **Component Structure**: Functional components with hooks
- **File Naming**: kebab-case for files, PascalCase for components

### **Best Practices**
- **Error Handling**: Comprehensive try-catch blocks
- **Loading States**: User-friendly loading indicators
- **Responsive Design**: Mobile-first approach
- **Accessibility**: ARIA labels and semantic HTML

---

## 📞 Support & Documentation

### **Key Resources**
- **Next.js Docs**: https://nextjs.org/docs
- **Solana Docs**: https://docs.solana.com
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Wallet Adapter**: https://github.com/solana-labs/wallet-adapter

### **Common Issues**
- **Hydration Errors**: Use dynamic imports for wallet components
- **RPC Limits**: Implement connection pooling
- **State Updates**: Ensure proper dependency arrays in useEffect

---

*This documentation provides a comprehensive overview of the Magic Roulette frontend codebase. For specific implementation details, refer to the individual source files and their inline comments.*

**Last Updated**: November 8, 2025  
**Version**: 1.0  
**Framework**: Next.js 16 + React 19 + Solana
