import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, FileText, Download, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { api } from '../utils/api';

export function LeaderboardImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [year, setYear] = useState(new Date().getFullYear().toString());

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      parseLeaderboardCSV(file);
    }
  }

  async function parseLeaderboardCSV(file: File) {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setError('CSV file must contain a header row and at least one data row');
        return;
      }

      // Parse header - extract month columns
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Find employee name column (usually first)
      const nameColumnIndex = 0;
      
      // Find month columns - they typically have "Points" in the name
      // Format: "January Points", "February Points", etc.
      const monthColumns: { name: string; index: number; month: string }[] = [];
      
      headers.forEach((header, index) => {
        if (index === 0) return; // Skip name column
        if (header.toLowerCase().includes('total')) return; // Skip total column
        
        // Extract month name from headers like "January Points", "# May Points", "April Points"
        const match = header.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
        if (match) {
          monthColumns.push({
            name: header,
            index: index,
            month: match[1]
          });
        }
      });
      
      if (monthColumns.length === 0) {
        setError('No month columns found. Expected format: "Name of Employee, January Points, February Points, ..."');
        return;
      }
      
      // Parse employee data
      const employees: { name: string; points: Record<string, number> }[] = [];
      
      lines.slice(1).forEach(line => {
        const values = line.split(',').map(v => v.trim());
        const employeeName = values[nameColumnIndex];
        
        if (!employeeName) return;
        
        const points: Record<string, number> = {};
        monthColumns.forEach(col => {
          const pointValue = parseInt(values[col.index]) || 0;
          points[col.month] = pointValue;
        });
        
        employees.push({ name: employeeName, points });
      });

      setCsvData({
        monthColumns: monthColumns.map(c => c.month),
        employees
      });
      
      // Auto-select all months
      setSelectedMonths(monthColumns.map(c => c.month));
      setError(null);
    } catch (err) {
      console.error('CSV parse error:', err);
      setError('Failed to parse CSV file. Please check the format.');
      setCsvData(null);
    }
  }

  function toggleMonth(month: string) {
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  }

  async function handleImport() {
    if (!csvData || selectedMonths.length === 0) {
      setError('Please upload a CSV file and select at least one month to import');
      return;
    }

    if (!year) {
      setError('Please specify the year for these elections');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Import each selected month as a separate election
      let importedCount = 0;
      
      for (const month of selectedMonths) {
        // Create entries for this month
        const entries = csvData.employees
          .map((emp: any) => ({
            employee_name: emp.name,
            total_points: emp.points[month] || 0
          }))
          .filter((e: any) => e.total_points > 0); // Only include employees with points
        
        if (entries.length === 0) continue;
        
        // Determine the date for this election (last day of the month)
        const monthIndex = getMonthIndex(month);
        const date = new Date(parseInt(year), monthIndex + 1, 0); // Last day of month
        
        await api.importHistoricalData({
          title: `${month} ${year} Employee of the Month`,
          date: date.toISOString(),
          entries
        });
        
        importedCount++;
      }

      setSuccess(`Successfully imported ${importedCount} elections with ${csvData.employees.length} employees!`);
      setCsvFile(null);
      setCsvData(null);
      setSelectedMonths([]);
      
      // Reset file input
      const fileInput = document.getElementById('leaderboard-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      console.error('Import error:', err);
      setError('Failed to import data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function getMonthIndex(monthName: string): number {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
  }

  function downloadTemplate() {
    const template = `Name of Employee,January Points,February Points,March Points,April Points,May Points,Total Points
Aliu,15,4,39,13,10,127
Srujan,22,16,7,16,18,119
Xtreme,17,13,12,12,18,106
Mabel,6,8,3,15,14,92
Lope,15,18,8,5,10,91`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leaderboard-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-success/50 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}

      {/* How it works — read this before the form, because the shape of the
          sheet is the thing people get wrong. */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-e1 sm:p-6">
        <h4 className="font-display text-base font-semibold tracking-tight">Before you start</h4>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground text-pretty">
          One sheet, one year. The first column holds names, every other column holds a month's points —
          and each of those months becomes its own election, dated to the last day of the month.
        </p>
        <ol className="mt-4 space-y-2.5">
          {[
            'Open the leaderboard in Google Sheets.',
            'Choose File → Download → Comma Separated Values (.csv).',
            'Upload that file below and pick the months you want.',
          ].map((stepText, i) => (
            <li key={stepText} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span
                className="mt-px inline-grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="text-pretty">{stepText}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted-foreground text-pretty">
          Anyone in the sheet who isn't an employee yet will be added for you.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-e1 sm:p-6">
        <h4 className="font-display text-base font-semibold tracking-tight">Upload the sheet</h4>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground text-pretty">
          Nothing is imported until you press the button at the bottom — you get a preview first.
        </p>

        <div className="mt-5 space-y-5">
          {/* Template Download */}
          <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4 inset-ring-1 inset-ring-border sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground text-pretty">
                Want to see the layout first? The template is the same shape we expect back.
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate} className="h-10 w-full shrink-0 gap-2 sm:w-auto">
              <Download className="h-4 w-4" aria-hidden="true" />
              Download template
            </Button>
          </div>

          {/* Year Input */}
          <div>
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
              className="mt-1.5 h-11 max-w-[10rem] tabular-nums"
              min="2000"
              max="2100"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              The year every month in this sheet belongs to.
            </p>
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="leaderboard-upload">CSV file</Label>
            <Input
              id="leaderboard-upload"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="mt-1.5 h-11 cursor-pointer py-2.5 file:mr-3 file:text-sm file:font-medium"
            />
            <p className="mt-2 text-xs text-muted-foreground text-pretty">
              Expected columns: name, then one column per month, with an optional total at the end.
            </p>
          </div>

          {/* Month Selection */}
          {csvData && (
            <div className="animate-fade-in">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Label>Months to import</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={() => setSelectedMonths(csvData.monthColumns)}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={() => setSelectedMonths([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 overflow-hidden rounded-xl border border-border sm:grid-cols-2 lg:grid-cols-3">
                {csvData.monthColumns.map((month: string, idx: number) => {
                  const employeesWithPoints = csvData.employees.filter((e: any) => (e.points[month] || 0) > 0).length;
                  const checked = selectedMonths.includes(month);

                  return (
                    <label
                      key={month}
                      htmlFor={`month-${month}`}
                      className={`flex cursor-pointer items-start gap-3 border-border p-3.5 transition-colors duration-150 sm:[&:nth-child(2n)]:border-l lg:[&:nth-child(2n)]:border-l-0 lg:[&:nth-child(3n+2)]:border-l lg:[&:nth-child(3n)]:border-l ${
                        idx > 0 ? 'border-t sm:[&:nth-child(2)]:border-t-0 lg:[&:nth-child(2)]:border-t-0 lg:[&:nth-child(3)]:border-t-0' : ''
                      } ${checked ? 'bg-primary/8' : 'hover:bg-muted/40'}`}
                    >
                      <Checkbox
                        id={`month-${month}`}
                        className="mt-0.5"
                        checked={checked}
                        onCheckedChange={() => toggleMonth(month)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{month} {year}</span>
                        <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                          {employeesWithPoints} {employeesWithPoints === 1 ? 'person' : 'people'} scored
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <p className="mt-3 text-sm text-muted-foreground tabular-nums" aria-live="polite">
                {selectedMonths.length === 0
                  ? 'No months selected yet — pick at least one.'
                  : `${selectedMonths.length} of ${csvData.monthColumns.length} months selected`}
              </p>

              {/* Preview */}
              <div className="mt-5">
                <Label>Preview — first 5 people</Label>
                <div className="mt-1.5 overflow-hidden rounded-xl border border-border">
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/70 backdrop-blur-sm">
                        <tr>
                          <th className="sticky left-0 z-10 bg-muted p-2.5 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                            Name
                          </th>
                          {selectedMonths.map(month => (
                            <th key={month} className="p-2.5 text-right text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                              {month}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.employees.slice(0, 5).map((emp: any, idx: number) => (
                          <tr key={idx} className="border-t border-border">
                            <td className="sticky left-0 bg-card p-2.5 font-medium">{emp.name}</td>
                            {selectedMonths.map(month => (
                              <td key={month} className="p-2.5 text-right tabular-nums text-muted-foreground">
                                {emp.points[month] || 0}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvData.employees.length > 5 && (
                    <div className="border-t border-border bg-muted/40 p-2.5 text-center text-xs text-muted-foreground">
                      Showing the first 5 of {csvData.employees.length} people
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={loading || !csvData || selectedMonths.length === 0 || !year}
            className="h-11 w-full gap-2"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              : <Upload className="h-4 w-4" aria-hidden="true" />}
            {loading
              ? 'Importing…'
              : `Import ${selectedMonths.length} election${selectedMonths.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </section>
    </div>
  );
}