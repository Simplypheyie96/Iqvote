# IQ Vote - Employee of the Month Voting System

A modern, responsive employee recognition platform with weighted voting, real-time leaderboards, and comprehensive admin tools.

## 🎯 Features

- **Weighted Voting System** - 1st choice (5pts), 2nd choice (3pts), 3rd choice (2pts)
- **Supabase Authentication** - Secure sign up and login
- **Admin Dashboard** - Manage employees, elections, and system settings
- **Real-time Leaderboard** - Live vote tallies with tie-breaker rules
- **Dark Mode Support** - Toggle between light and dark themes
- **Super Admin Protection** - Irrevocable system owner controls
- **Activity Monitoring** - Complete audit trail logging
- **Social Sharing** - Beautiful OG images for social platforms

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR-USERNAME/iq-vote.git
cd iq-vote
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Add your Supabase credentials to `.env`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Run development server:
```bash
npm run dev
```

6. Open http://localhost:3000

## 📦 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions for Vercel.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR-USERNAME/iq-vote)

1. Click the deploy button above
2. Connect your GitHub account
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## 🏗️ Project Structure

```
iq-vote/
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components (shadcn)
│   │   ├── AuthPage.tsx   # Authentication
│   │   ├── VotingPage.tsx # Voting interface
│   │   ├── LeaderboardPage.tsx
│   │   ├── AdminPage.tsx
│   │   └── ...
│   ├── imports/           # Imported assets and components
│   ├── styles/            # Global styles
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   │   ├── api.ts         # API client
│   │   └── supabase/      # Supabase configuration
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── supabase/
│   └── functions/
│       └── make-server-e2c9f810/  # Edge Functions
│           ├── index.tsx          # Server routes
│           └── kv_store.tsx       # KV store utilities
├── public/                # Static assets
├── index.html             # HTML entry point
├── package.json
├── vite.config.ts
└── vercel.json            # Vercel configuration
```

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS 4.0, shadcn/ui
- **Backend:** Supabase (Auth, Database, Edge Functions)
- **Deployment:** Vercel
- **Icons:** Lucide React
- **Notifications:** Sonner

## 🎨 Design System

- **Primary Color:** #FF1A88 (both light & dark modes)
- **Font:** Open Sans
- **Design:** Modern SaaS aesthetic with generous whitespace
- **Components:** Card-based layouts with shadcn principles
- **Responsive:** Desktop-first, mobile-optimized

## 📊 Key Features Explained

### Voting System
- Users can select 3 distinct employees
- Weighted scoring: 1st=5pts, 2nd=3pts, 3rd=2pts
- Inline validation prevents duplicate selections
- Server-side double-vote prevention
- Atomic tally updates

### Admin Features
- Create and manage elections
- Add/edit/delete employees
- View historical data
- Monitor system activity
- Import historical voting data

### Super Admin
- Protected account: ajayifey@gmail.com
- Irrevocable system owner
- Exclusive control over admin management
- Hidden "Activity" tab for monitoring

### Leaderboard
- Real-time vote tallies
- Tie-breaker rules
- Historical election results
- Export capabilities

## 🔒 Security

- Supabase authentication
- Protected routes
- Server-side validation
- Secure Edge Functions
- Environment variable protection

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=          # Supabase project URL
VITE_SUPABASE_ANON_KEY=     # Supabase anonymous key
```

**Note:** Never commit `.env` to version control!

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues and questions, please open an issue on GitHub.

## 🎉 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Status:** Production Ready ✅
