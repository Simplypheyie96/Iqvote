import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, FileText, Download, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
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
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Import Google Sheets Leaderboard
          </CardTitle>
          <CardDescription>
            Import your historical leaderboard with multiple months. Each column (month) will be imported as a separate election.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Leaderboard CSV</CardTitle>
          <CardDescription>
            Export your Google Sheets leaderboard as CSV. Format: First column = employee names, other columns = monthly points.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Download */}
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm">Download a sample template to see the expected format</span>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 w-full sm:w-auto flex-shrink-0">
                <Download className="w-3 h-3" />
                Download Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* Year Input */}
          <div>
            <Label htmlFor="year">Year *</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
              className="mt-1.5 max-w-xs"
              min="2000"
              max="2100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The year these elections took place
            </p>
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="leaderboard-upload">Upload CSV File</Label>
            <div className="mt-1.5">
              <Input
                id="leaderboard-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Expected format: "Name of Employee, January Points, February Points, March Points, ..., Total Points"
            </p>
          </div>

          {/* Month Selection */}
          {csvData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Months to Import ({selectedMonths.length} selected)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonths(csvData.monthColumns)}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonths([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 border border-border rounded-lg bg-muted/30">
                {csvData.monthColumns.map((month: string) => {
                  const employeesWithPoints = csvData.employees.filter((e: any) => (e.points[month] || 0) > 0).length;
                  
                  return (
                    <div key={month} className="flex items-start gap-2">
                      <Checkbox
                        id={`month-${month}`}
                        checked={selectedMonths.includes(month)}
                        onCheckedChange={() => toggleMonth(month)}
                      />
                      <div className="flex flex-col">
                        <label
                          htmlFor={`month-${month}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {month} {year}
                        </label>
                        <span className="text-xs text-muted-foreground">
                          {employeesWithPoints} employees
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview (First 5 employees)</Label>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium sticky left-0 bg-muted/50 z-10">Employee</th>
                          {selectedMonths.map(month => (
                            <th key={month} className="text-left p-2 font-medium">{month}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.employees.slice(0, 5).map((emp: any, idx: number) => (
                          <tr key={idx} className="border-t border-border">
                            <td className="p-2 font-medium sticky left-0 bg-background">{emp.name}</td>
                            {selectedMonths.map(month => (
                              <td key={month} className="p-2 text-center">
                                {emp.points[month] || 0}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvData.employees.length > 5 && (
                    <div className="p-2 text-xs text-center text-muted-foreground bg-muted/30 border-t border-border">
                      Showing first 5 of {csvData.employees.length} employees
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleImport}
            disabled={loading || !csvData || selectedMonths.length === 0 || !year}
            className="w-full gap-2"
          >
            <Upload className="w-4 h-4" />
            {loading ? 'Importing...' : `Import ${selectedMonths.length} Election${selectedMonths.length !== 1 ? 's' : ''}`}
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Open your Google Sheets leaderboard</li>
            <li>Click <strong>File → Download → Comma Separated Values (.csv)</strong></li>
            <li>Upload the CSV file here</li>
            <li>Select which months you want to import</li>
            <li>Click "Import" to create historical elections</li>
          </ol>
          
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Note:</strong> Each month will be created as a separate election. Employees will be automatically created if they don't exist in your system. Each election will be dated as the last day of that month.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}