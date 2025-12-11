# IQ Vote - Employee of the Month Voting System

A modern, responsive employee voting platform built with React, TypeScript, Tailwind CSS, and Supabase.

## ✨ Features

- 🎨 **Modern SaaS Design** with primary color #FF1A88
- 🌓 **Light & Dark Mode** support with theme toggle
- 🔐 **Secure Authentication** via Supabase Auth
- 🗳️ **Simple Voting Flow** - Select 3 employees with point allocation (5/3/2)
- 💬 **Anonymous Voting Reasons** - Write optional feedback for each vote
- 📊 **Time-Based Leaderboard** - Filter by year, month, or all-time
- 👑 **Admin Panel** - Manage elections, employees, and eligibility
- 📱 **Fully Responsive** - Desktop-first with complete mobile optimization
- 🔒 **Role-Based Access** - Admin tab only visible to administrators
- 📈 **Voting History** - Track all your past votes

## 🚀 Quick Start

### First-Time Setup (Become Admin)

1. **Sign Up** - The first person to create an account automatically becomes an admin
2. **Add Employees** - Admin → Employees → Add your team members
3. **Create Election** - Admin → Elections → Set up your first vote
4. **Set Eligibility** - Admin → Eligibility → Define voters and candidates
5. **Invite Team** - Share the app URL with your team to sign up

See **QUICK_START.md** for detailed step-by-step instructions.

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Fast setup guide with common tasks
- **[SETUP_AND_USAGE_GUIDE.md](SETUP_AND_USAGE_GUIDE.md)** - Comprehensive manual with FAQ

## 🔑 Key Concepts

### User Roles

**Admin** (First user + assigned admins)
- Full access to all features
- Can manage elections, employees, and eligibility
- See Admin tab in navigation (shield icon 🛡️)

**Employee** (Regular users)
- Can vote in active elections
- Can view leaderboard and voting history
- Cannot see or access Admin tab

### Admin Access Control

✅ **Admin tab is ONLY visible to admins**
- Hidden from navigation for non-admins
- Protected at the component level
- First user gets automatic admin rights
- Admins can grant/revoke admin status for others

### Voting System

- **Point Allocation**: 1st = 5pts, 2nd = 3pts, 3rd = 2pts
- **One Vote Per Election**: Cannot change after submission
- **Server-Side Validation**: Prevents double voting
- **Atomic Updates**: Ensures data integrity
- **Optional Reasons**: Anonymous feedback displayed on leaderboard

### Election Eligibility

⚠️ **IMPORTANT**: Every election requires eligibility setup!

- **Voters**: Who can submit votes
- **Candidates**: Who can be voted for
- **Flexible**: Different rules per election
- **Auto-save**: Changes persist immediately

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS v4.0, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Server**: Hono web framework in Edge Functions
- **State**: React hooks with localStorage for sessions

### Database Schema

The system uses Supabase's KV store with the following key structures:

- `employee:{id}` - Employee profiles
- `election:{id}` - Election data
- `ballot:{election_id}:{employee_id}` - Individual votes
- `eligibility:{election_id}:{employee_id}` - Voting permissions
- `leaderboard:{election_id}` - Cached aggregated results

### Security

- ✅ JWT-based authentication via Supabase Auth
- ✅ Server-side vote validation and deduplication
- ✅ Role-based access control for admin features
- ✅ Anonymous voting reasons (no voter attribution)
- ✅ Signed URLs for private image storage

## 🎯 Common Admin Tasks

### Creating a Monthly Election

```
1. Admin → Elections → "Create Election"
2. Name: "Employee of the Month - November 2024"
3. Set start/end dates
4. Admin → Eligibility → Select voters and candidates
```

### Adding a New Employee

```
1. Admin → Employees → "Add Employee"
2. Fill in: Name, Email, Role, (optional: Department, Image, Admin)
3. Tell employee to sign up with that email
4. Add to current election eligibility if needed
```

### Making Someone an Admin

```
1. Admin → Employees
2. Find employee → Click edit icon
3. Check "Is Admin" checkbox
4. Click "Update Employee"
```

### Viewing Historical Results

```
1. Leaderboard tab
2. Select year from dropdown (or "All Time")
3. Select month from dropdown (or "Full Year")
4. View aggregated results with message counts
```

## 📱 Mobile Optimization

The application is fully optimized for mobile devices:

- ✅ Touch-friendly buttons and controls
- ✅ Responsive navigation with mobile menu
- ✅ Collapsible cards for better space usage
- ✅ Optimized typography and spacing
- ✅ Native-feeling interactions

## 🎨 Design System

### Colors

- **Primary**: #FF1A88 (Brand Pink)
- **Theme**: Light/Dark mode support
- **Semantic**: Success, Error, Warning, Info states

### Typography

- Custom typography scale in `/styles/globals.css`
- No manual font-size classes needed
- Responsive text sizing
- Optimized line heights

### Components

All UI components from shadcn/ui located in `/components/ui/`:
- Forms, buttons, inputs, selects
- Cards, alerts, dialogs, sheets
- Navigation, tabs, breadcrumbs
- Charts, tooltips, popovers

## 🔧 Development

### Project Structure

```
/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── AdminPage.tsx   # Admin panel
│   ├── VotingPage.tsx  # Voting interface
│   ├── LeaderboardPage.tsx
│   └── ...
├── supabase/
│   └── functions/
│       └── server/     # Hono web server
├── utils/              # Helpers and API client
├── styles/             # Global CSS and theme
└── types.ts            # TypeScript definitions
```

### Key Files

- `App.tsx` - Main application with routing
- `types.ts` - TypeScript interfaces
- `utils/api.ts` - API client for server communication
- `supabase/functions/server/index.tsx` - Backend routes

## ⚠️ Important Notes

### What's Ready for Production

✅ Authentication and authorization  
✅ Voting system with validation  
✅ Leaderboard with time-based filtering  
✅ Admin panel with full CRUD operations  
✅ Image uploads and storage  
✅ Mobile responsive design  
✅ Theme support (light/dark)  
✅ Anonymous voting reasons  

### Demo Data (Optional)

A demo data creation endpoint exists at `/demo/create` for testing purposes. This is **optional** and not required for production use. The normal signup flow is the recommended way to get started.

### Production Checklist

- [ ] First user signs up (becomes admin)
- [ ] Admin adds all employees
- [ ] Admin creates first election
- [ ] Admin sets election eligibility
- [ ] Team members sign up with their emails
- [ ] Voting begins!

## 📝 License

This project is ready for internal company use.

## 🆘 Support

For help, refer to:
1. **QUICK_START.md** - Fast setup guide
2. **SETUP_AND_USAGE_GUIDE.md** - Comprehensive manual
3. In-app error messages (designed to be helpful!)

---

**Built with ❤️ using React, TypeScript, Tailwind CSS, and Supabase**
