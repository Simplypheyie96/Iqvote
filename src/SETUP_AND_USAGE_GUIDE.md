# IQ Vote - Complete Setup & Usage Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Initial Setup](#initial-setup)
3. [User Roles & Access](#user-roles--access)
4. [Getting Started](#getting-started)
5. [Admin Guide](#admin-guide)
6. [Employee Guide](#employee-guide)
7. [Features Overview](#features-overview)
8. [FAQ](#faq)

---

## Overview

**IQ Vote** is a modern Employee of the Month voting system with:
- **Primary Color**: #FF1A88 (both light and dark modes)
- **Desktop-first design** with full mobile optimization
- **Supabase backend** with authentication, database, and storage
- **One-page voting flow** with inline validation
- **Point system**: 1st place = 5pts, 2nd place = 3pts, 3rd place = 2pts
- **Anonymous voting reasons** displayed on the leaderboard
- **Time-based filtering** (year/month/all-time views)
- **Admin panel** for managing elections and employees

---

## Initial Setup

### First User Becomes Admin

**IMPORTANT**: The first person to sign up automatically becomes an admin!

### Step 1: Create Your Admin Account
1. Open the application
2. Click the **"Sign Up"** tab
3. Fill in your details:
   - **Full Name**: Your name
   - **Role**: Your job title (e.g., "CEO", "Manager", "Team Lead")
   - **Email**: Your email address
   - **Password**: Choose a secure password
4. Click **"Create Account"**
5. You'll see a success message: "🎉 Account created! You are the first user and have been granted admin access."

### Step 2: You're Now Signed In as Admin
- The application will automatically sign you in
- You'll see an **"Admin"** tab in the header (with a shield icon 🛡️)
- You now have full access to all admin features

---

## User Roles & Access

### Admin Access
**Only admins can see and access the Admin tab.**

Admins have access to:
- ✅ **All employee features** (voting, leaderboard, history)
- ✅ **Admin panel** with three sub-tabs:
  - **Elections**: Create and manage elections
  - **Employees**: Add, edit, and manage employee profiles
  - **Eligibility**: Control who can vote and be voted for in each election

### Employee Access
Regular employees can:
- ✅ Vote in active elections
- ✅ View the leaderboard
- ✅ View their voting history
- ❌ Cannot access the Admin tab (it's hidden for non-admins)

---

## Getting Started

### For the First Admin

After creating your account, follow these steps:

#### 1. Add Employees (Admin Tab → Employees)
Before you can create an election, you need to add employees:

1. Click the **"Admin"** tab in the header
2. Go to the **"Employees"** sub-tab
3. Click **"Add Employee"**
4. Fill in the employee details:
   - **Name**: Employee's full name
   - **Email**: Their email address
   - **Role**: Their job title
   - **Department**: (Optional) Their department
   - **Is Admin**: Check this box if they should have admin access
   - **Image**: (Optional) Upload a profile picture
5. Click **"Add Employee"**
6. Repeat for all employees

**Note**: When you add an employee, they are NOT automatically given a login. They need to sign up themselves using the same email address you entered. Once they sign up with that email, their account will be linked to their employee profile.

#### 2. Create Your First Election (Admin Tab → Elections)

1. Go to the **"Elections"** sub-tab in the Admin panel
2. Click **"Create Election"**
3. Fill in the election details:
   - **Name**: e.g., "Employee of the Month - November 2024"
   - **Description**: (Optional) Additional context
   - **Start Time**: When voting opens
   - **End Time**: When voting closes
4. Click **"Create Election"**

#### 3. Set Election Eligibility (Admin Tab → Eligibility)

After creating an election, you need to specify who can participate:

1. Go to the **"Eligibility"** sub-tab
2. You'll see your newly created election listed
3. Click on the election to expand it
4. You'll see two sections:
   - **Voters**: Who can vote
   - **Candidates**: Who can be voted for
5. For each employee:
   - Check **"Can Vote"** if they should be able to vote
   - Check **"Can Be Voted For"** if they should appear as a candidate
6. Changes are saved automatically

**Best Practices**:
- Not everyone needs to be able to vote (e.g., contractors, new hires)
- Admins can choose whether to include themselves as candidates
- You can exclude certain employees from being candidates (e.g., those on leave)

#### 4. Invite Employees to Sign Up

Since employees don't have accounts yet:
1. Share the application URL with your team
2. Ask them to **sign up** using the email address you added for them
3. They should use the **same email** you entered in the Employee management section
4. Once they sign up, they'll automatically be linked to their employee profile

---

## Admin Guide

### Managing Elections

#### Creating an Election
1. **Admin Tab** → **Elections** → **"Create Election"**
2. Set meaningful names (e.g., "Employee of the Month - December 2024")
3. Choose appropriate start/end times
4. Remember to set eligibility after creating the election

#### Viewing Elections
- See all elections (past, current, and future)
- Elections are sorted by most recent first
- Current active election is highlighted

#### Important Notes
- You cannot edit an election after it's created
- You cannot delete elections (for audit purposes)
- To fix a mistake, create a new election with correct details

### Managing Employees

#### Adding Employees
1. **Admin Tab** → **Employees** → **"Add Employee"**
2. Fill in all required fields (name, email, role)
3. Optionally add department and profile picture
4. Check "Is Admin" to grant admin access

#### Editing Employees
1. Find the employee in the list
2. Click the **edit icon** (pencil) on their card
3. Update any fields (name, role, department, admin status)
4. Click **"Update Employee"**

**Why Edit Employees?**
- Update job titles or departments
- Grant/revoke admin access
- Add missing information (department, image)
- Correct typos in names

#### Employee Images
- Click the upload button to select an image
- Images are stored securely in Supabase Storage
- Images appear on the voting page, leaderboard, and employee cards
- Supported formats: JPEG, PNG, WebP

### Managing Eligibility

**This is crucial**: Elections won't work properly without setting eligibility!

1. **Admin Tab** → **Eligibility**
2. Click on an election to expand it
3. Set voters and candidates by checking the appropriate boxes
4. Changes save automatically

**Common Scenarios**:
- **New Election**: Set up all voters and candidates
- **Employee Left**: Uncheck both boxes to remove them
- **New Employee**: Check boxes to include them
- **Department-Specific**: Only select employees from certain departments

---

## Employee Guide

### Signing Up
1. Get the application URL from your admin
2. Click **"Sign Up"** tab
3. **Use the same email** your admin entered for you
4. Fill in your name, role, email, and password
5. Your account will automatically link to your employee profile

### Voting

#### When Can I Vote?
- Only when an active election is running
- You'll see the voting interface on the main page
- If no election is active, you'll see a message

#### How to Vote
1. The **"Vote"** tab shows the active election
2. Select your **1st choice** (5 points)
3. Select your **2nd choice** (3 points)
4. Select your **3rd choice** (2 points)
5. *Optional*: Write reasons for each vote (these are shown anonymously)
6. Click **"Submit Vote"**

#### Voting Rules
- ✅ You must select 3 different people
- ✅ You can vote for yourself (if eligible)
- ✅ Reasons are optional but encouraged
- ❌ You cannot select the same person twice
- ❌ You can only vote once per election
- ❌ You cannot change your vote after submitting

#### Voting Reasons
- Write why you chose each person
- These messages are **completely anonymous**
- They appear on the leaderboard next to each person's points
- Click the message icon to read all reasons for someone
- Great for morale and feedback!

### Viewing the Leaderboard

#### Time-Based Filtering
The leaderboard can show different time periods:
- **All Time**: Aggregated results from all elections ever
- **Specific Year**: Results from all elections in that year
- **Specific Month**: Results from elections in a specific month

**How to Filter**:
1. Use the **Year dropdown** to select a year or "All Time"
2. If you select a year, use the **Month dropdown** to select a month or "Full Year"

#### Understanding the Results
- **Top 3**: Special podium display with gold/silver/bronze
- **Rankings**: Everyone else in order below
- **Total Points**: Sum of all points received
- **Vote Breakdown**: How many 1st, 2nd, and 3rd place votes
- **Messages**: Click the message icon to read anonymous voting reasons

### My History

View all your past votes:
1. Click **"My History"** in the header
2. See all elections you've voted in
3. Each card shows:
   - Election name and date
   - Your three choices
   - Optional reasons you wrote
4. Click to expand/collapse each vote

---

## Features Overview

### Authentication
- **Sign Up**: Create a new account (first user becomes admin)
- **Sign In**: Access your account
- **Sign Out**: Securely log out
- **Session Management**: Stay logged in across browser sessions

### Voting System
- **One-page flow**: Simple and frictionless
- **Inline validation**: Immediate feedback on selections
- **Point allocation**: 1st=5pts, 2nd=3pts, 3rd=2pts
- **Double-vote prevention**: Server-side enforcement
- **Anonymous reasons**: Write optional messages

### Leaderboard
- **Time-based filtering**: Year, month, or all-time views
- **Top 3 podium**: Special display for winners
- **Vote breakdown**: See 1st/2nd/3rd place counts
- **Anonymous messages**: Read why people were voted for
- **Tie-breaker rules**: Consistent ranking

### Admin Panel
- **Elections Management**: Create and view elections
- **Employee Management**: Add, edit, and manage employees
- **Eligibility Control**: Set voters and candidates per election
- **Image Uploads**: Profile pictures for employees

### Theme Support
- **Light/Dark Mode**: Toggle in the header
- **Consistent colors**: Primary color (#FF1A88) in both modes
- **System preference**: Respects OS theme by default

### Responsive Design
- **Desktop-first**: Optimized for larger screens
- **Mobile-optimized**: Full touch-friendly mobile experience
- **Tablet support**: Works great on all screen sizes

---

## FAQ

### General Questions

**Q: Can I change my vote after submitting?**
A: No, votes are final once submitted. This ensures fairness and integrity.

**Q: Are my voting reasons anonymous?**
A: Yes! Voting reasons are completely anonymous. No one can see who wrote what.

**Q: Can I vote for myself?**
A: Yes, if you're eligible as a candidate in the election.

**Q: What happens if no election is active?**
A: The vote page will show "No active election" and you can view the leaderboard or history.

### Admin Questions

**Q: Can I make someone else an admin after they sign up?**
A: Yes! Go to Admin → Employees → Edit their profile → Check "Is Admin" → Update.

**Q: Can I remove someone's admin access?**
A: Yes, same process but uncheck "Is Admin".

**Q: What if I accidentally create an election with the wrong dates?**
A: You cannot delete or edit elections. Create a new election with correct dates and don't set eligibility for the wrong one.

**Q: Can employees who haven't signed up yet appear as candidates?**
A: Yes! You can add them as employees and mark them as candidates. When they sign up using their email, they'll be linked to their profile.

**Q: How do I remove an employee from an election?**
A: Go to Admin → Eligibility → Select the election → Uncheck "Can Vote" and "Can Be Voted For" for that employee.

**Q: Can I see who voted for whom?**
A: No. The system is designed to keep votes private. Only aggregated results are shown.

**Q: Can I edit employee information after they've signed up?**
A: Yes! You can always edit employee details (name, role, department, admin status) through the Admin panel.

### Technical Questions

**Q: Where is data stored?**
A: All data is stored securely in Supabase (PostgreSQL database with authentication).

**Q: Are images stored securely?**
A: Yes, images are stored in Supabase Storage with private buckets and signed URLs.

**Q: Can employees delete their accounts?**
A: Currently no. Contact an admin to remove your employee profile.

**Q: What happens to my votes if I'm removed as an employee?**
A: Your historical votes remain in the system for audit purposes, but you lose access to the application.

---

## Support

For technical issues or questions:
1. Check this guide first
2. Contact your system administrator
3. Review the error messages (they're designed to be helpful!)

---

## Best Practices

### For Admins
1. **Add all employees before creating elections**
2. **Always set eligibility** after creating an election
3. **Use clear election names** with dates (e.g., "Employee of the Month - November 2024")
4. **Communicate deadlines** to your team
5. **Review eligibility** before each election starts
6. **Upload employee photos** for a better experience

### For Employees
1. **Sign up with the email your admin provided**
2. **Vote thoughtfully** - your choices matter
3. **Write voting reasons** - they provide valuable feedback
4. **Vote before the deadline** - late votes are not accepted
5. **Check the leaderboard** to celebrate your colleagues

---

**Version**: 1.0  
**Last Updated**: November 2024  
**Built with**: React, TypeScript, Tailwind CSS, Supabase, shadcn/ui
