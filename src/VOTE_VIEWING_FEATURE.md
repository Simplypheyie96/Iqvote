# Vote Viewing Feature for Admins

## Overview
Admins can view who has voted and manage votes across all elections through the Admin Panel's "Votes" tab, while maintaining voter privacy by keeping individual vote choices confidential.

## Privacy Protection
**Important**: Vote choices are kept confidential to prevent bias and protect voter anonymity. Admins can see:
- ✅ Who has voted (name and email)
- ✅ When they voted
- ✅ Ability to delete votes if needed
- ❌ **NOT** who each person voted for

This ensures that admins (who are also voters) cannot see others' specific choices, maintaining the integrity of the election process.

## Features Implemented

### 1. **Election Selection**
- **Search Functionality**: Search elections by title or date
- **Smart Filtering**: Elections are grouped into:
  - Active Elections (currently running)
  - Past Elections (completed)
  - Upcoming Elections (not yet started)
- **Quick Browse**: Modal with all elections organized by status

### 2. **Vote Statistics**
For each selected election, admins can see:
- **Total Votes**: All votes cast (active + deleted)
- **Active Votes**: Currently valid votes
- **Deleted Votes**: Revoked votes with reasons

### 3. **Voter Information** (Privacy-Protected)
Each active vote displays:
- Voter name and email
- Vote timestamp
- **No candidate information shown** (privacy protection)

### 4. **Vote Management**
Admins can:
- **Delete Votes**: Remove invalid votes with reason tracking
- **Search Voters**: Filter by name or email
- **Reason Categories**:
  - Duplicate vote
  - Voter requested removal
  - Error correction
  - Policy violation
  - Invalid submission
  - Custom reason
- **Additional Context**: Optional notes for audit trail

### 5. **Deleted Votes Tracking**
- View all revoked votes
- See voter information (name and email only)
- See deletion timestamp
- Review deletion reasons
- Complete audit trail

### 6. **Export Functionality**
- Export complete election results as JSON
- Includes aggregated leaderboard data and metadata
- File named automatically: `[ElectionTitle]_results.json`

## Access
Navigate to: **Admin Panel → Votes Tab**

## UI Highlights
- Clean card-based interface
- Privacy notice prominently displayed
- Color-coded status indicators (green = active, red = deleted)
- Real-time search with instant results
- Responsive design for all screen sizes
- Contextual warnings before destructive actions

## Security
- Admin-only access
- Vote choices kept confidential (privacy protection)
- All deletions require reasons (audit compliance)
- Permanent deletion warnings
- Detailed activity logging

## Technical Implementation
- Component: `/components/VoteManagement.tsx`
- Integrated in: `/components/AdminPage.tsx`
- API Endpoints: 
  - `GET /elections` - List all elections
  - `GET /admin/elections/:id/votes` - Get votes for specific election
  - `POST /admin/ballots/revoke` - Delete vote with reason
  - `GET /admin/elections/:id/export` - Export results