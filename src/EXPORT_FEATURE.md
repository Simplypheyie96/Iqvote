# Excel Export Feature

## Overview
Added Excel export functionality to the Leaderboard page, allowing users to download comprehensive voting results in spreadsheet format.

## Features

### ✅ Export Button
- Located in the top-right corner of the Leaderboard page
- Positioned alongside Year and Month filters
- Displays Download icon with "Export" label
- Disabled when no data is available or while loading

### ✅ Excel File Contents

**Header Section:**
- Title: "IQ Vote - Leaderboard Export"
- Period information (e.g., "Showing 2026 totals (3 elections)")
- Export timestamp with date and time

**Main Data Table:**
- **Rank** - Employee's position in leaderboard
- **Name** - Employee's full name
- **Role** - Job title/position
- **Department** - Department affiliation
- **Total Points** - Sum of all points earned
- **1st Place (5pts)** - Number of first-place votes
- **2nd Place (3pts)** - Number of second-place votes
- **3rd Place (2pts)** - Number of third-place votes
- **Messages** - Count of voting messages/reasons received

**Summary Statistics Section:**
- Total Employees in leaderboard
- Total Elections counted
- Total Points Awarded across all employees

### ✅ Smart Filename Generation

Filenames automatically include context:
- `IQ_Vote_Leaderboard_All_Time_2026-02-02.xlsx` (for all-time view)
- `IQ_Vote_Leaderboard_2026_2026-02-02.xlsx` (for full year)
- `IQ_Vote_Leaderboard_January_2026_2026-02-02.xlsx` (for specific month)

Format: `IQ_Vote_Leaderboard_{Period}_{ExportDate}.xlsx`

### ✅ Professional Formatting

- **Column Widths**: Auto-adjusted for readability
  - Rank: 6 characters
  - Name/Role/Department: 20 characters each
  - Total Points: 12 characters
  - Vote counts: 16 characters each
  - Messages: 10 characters

- **Spacing**: Empty rows separate sections for clarity

## Use Cases

### For HR/Management:
- Monthly performance reports
- Annual review documentation
- Employee recognition programs
- Performance trend analysis

### For Employees:
- Personal achievement tracking
- Peer comparison insights
- Historical voting records

### For Analytics:
- Export data for further analysis in other tools
- Create custom visualizations
- Combine with other datasets
- Archive historical records

## Technical Details

### Implementation
- Uses `xlsx` library (SheetJS)
- Client-side generation (no server processing required)
- Respects current filter settings (Year/Month/All-Time)
- Includes only non-revoked votes in statistics

### Data Structure
```
IQ Vote - Leaderboard Export
Period: Showing 2026 totals (3 elections)
Exported on: 2/2/2026 at 3:45:00 PM

Rank | Name | Role | Department | Total Points | 1st Place (5pts) | 2nd Place (3pts) | 3rd Place (2pts) | Messages
1    | John | Dev  | Engineering | 50           | 8                | 2                | 4                | 12
...

Summary Statistics
Total Employees: 25
Total Elections: 3
Total Points Awarded: 450
```

## User Experience

### Accessibility
- Button is keyboard accessible
- Clear visual feedback when disabled
- Descriptive icon + label

### Performance
- Instant export for typical datasets
- No server round-trip required
- Works offline once page is loaded

### Responsiveness
- Button adapts to mobile/tablet layouts
- Maintains accessibility across screen sizes

## Future Enhancements (Possible)

### Could Add:
- Multiple export formats (CSV, PDF)
- Custom column selection
- Email delivery option
- Scheduled automatic exports
- Individual employee detail sheets
- Charts/graphs in exported file
- Voting messages/reasons export

## Files Modified

### `/components/LeaderboardPage.tsx`
- Added `xlsx` library import
- Created `exportToExcel()` function
- Added Export button to header
- Implemented smart filename generation
- Added data formatting and styling

## How to Use

### Step-by-Step:
1. Navigate to **Leaderboard** page
2. Select desired time period:
   - Choose **Year** (or "All Time")
   - Choose **Month** (if specific month needed)
3. Wait for leaderboard to load
4. Click **Export** button
5. Excel file downloads automatically with contextual filename

### Tips:
- Export button is disabled when no data is available
- Filename includes time period for easy organization
- Summary statistics help validate data completeness
- All visible leaderboard data is included in export

## Benefits

### ✅ **No Manual Data Entry**
- Eliminates error-prone copy-paste operations
- Saves significant time for regular reporting

### ✅ **Consistent Format**
- Every export follows same structure
- Easy to compare across different time periods

### ✅ **Comprehensive Data**
- Includes all relevant metrics
- Summary statistics for quick insights

### ✅ **Professional Output**
- Clean, well-formatted spreadsheets
- Ready for presentations or further analysis

### ✅ **User-Friendly**
- One-click operation
- Automatic filename generation
- Works with all filter combinations
