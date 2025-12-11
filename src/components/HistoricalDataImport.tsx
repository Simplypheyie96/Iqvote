import { useState } from 'react';
import { Upload, Plus, Trash2, AlertCircle, CheckCircle2, FileText, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { api } from '../utils/api';

interface HistoricalEntry {
  employee_name: string;
  employee_email?: string;
  total_points: number;
  count_first?: number;
  count_second?: number;
  count_third?: number;
}

export function HistoricalDataImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // CSV Import
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  
  // Manual Entry
  const [electionTitle, setElectionTitle] = useState('');
  const [electionDate, setElectionDate] = useState('');
  const [manualEntries, setManualEntries] = useState<HistoricalEntry[]>([
    { employee_name: '', total_points: 0, count_first: 0, count_second: 0, count_third: 0 }
  ]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      parseCSV(file);
    }
  }

  async function parseCSV(file: File) {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setError('CSV file must contain a header row and at least one data row');
        return;
      }

      // Parse header - first column should be employee name, rest are month columns
      const headers = lines[0].split(',').map(h => h.trim());
      
      // First column is employee name, last might be "Total Points", everything else is a month
      const employeeNameColumn = headers[0];
      const monthColumns = headers.slice(1).filter(h => 
        !h.toLowerCase().includes('total') && 
        !h.toLowerCase().includes('email') &&
        h.length > 0
      );
      
      if (monthColumns.length === 0) {
        setError('No month columns found. Expected format: Name of Employee, January Points, February Points, etc.');
        return;
      }
      
      // Parse data rows
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {
          employee_name: values[0] || ''
        };
        
        // Add each month's points
        monthColumns.forEach((monthHeader, index) => {
          row[monthHeader] = values[index + 1] || '0';
        });
        
        return row;
      });

      setCsvPreview(data);
      setError(null);
    } catch (err) {
      console.error('CSV parse error:', err);
      setError('Failed to parse CSV file. Please check the format.');
      setCsvPreview([]);
    }
  }

  async function handleCSVImport() {
    if (!electionTitle || !electionDate || csvPreview.length === 0) {
      setError('Please provide election details and upload a valid CSV file');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Transform CSV data to match our format
      const entries = csvPreview.map(row => {
        // Try to find name column (common variations)
        const name = row.name || row.employee || row['employee name'] || 
                    row.voter || row['full name'] || row.email?.split('@')[0] || '';
        
        // Try to find email column
        const email = row.email || row['email address'] || row['email id'] || '';
        
        // Try to find points/votes columns
        const totalPoints = parseInt(row.points || row['total points'] || row.score || row.votes || '0');
        const countFirst = parseInt(row['1st place'] || row.first || row['rank 1'] || '0');
        const countSecond = parseInt(row['2nd place'] || row.second || row['rank 2'] || '0');
        const countThird = parseInt(row['3rd place'] || row.third || row['rank 3'] || '0');

        return {
          employee_name: name,
          employee_email: email,
          total_points: totalPoints,
          count_first: countFirst,
          count_second: countSecond,
          count_third: countThird
        };
      }).filter(entry => entry.employee_name && entry.total_points > 0);

      if (entries.length === 0) {
        setError('No valid entries found in CSV. Please check the column names.');
        setLoading(false);
        return;
      }

      await api.importHistoricalData({
        title: electionTitle,
        date: new Date(electionDate).toISOString(),
        entries
      });

      setSuccess(`Successfully imported ${entries.length} entries for "${electionTitle}"!`);
      setCsvFile(null);
      setCsvPreview([]);
      setElectionTitle('');
      setElectionDate('');
      
      // Reset file input
      const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      console.error('Import error:', err);
      setError('Failed to import data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function addManualEntry() {
    setManualEntries([
      ...manualEntries,
      { employee_name: '', total_points: 0, count_first: 0, count_second: 0, count_third: 0 }
    ]);
  }

  function updateManualEntry(index: number, field: keyof HistoricalEntry, value: any) {
    const newEntries = [...manualEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setManualEntries(newEntries);
  }

  function removeManualEntry(index: number) {
    if (manualEntries.length > 1) {
      setManualEntries(manualEntries.filter((_, i) => i !== index));
    }
  }

  async function handleManualImport() {
    if (!electionTitle || !electionDate) {
      setError('Please provide election title and date');
      return;
    }

    const validEntries = manualEntries.filter(e => e.employee_name && e.total_points > 0);
    
    if (validEntries.length === 0) {
      setError('Please add at least one valid entry with a name and points');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.importHistoricalData({
        title: electionTitle,
        date: new Date(electionDate).toISOString(),
        entries: validEntries
      });

      setSuccess(`Successfully imported ${validEntries.length} entries for "${electionTitle}"!`);
      setElectionTitle('');
      setElectionDate('');
      setManualEntries([
        { employee_name: '', total_points: 0, count_first: 0, count_second: 0, count_third: 0 }
      ]);
    } catch (err: any) {
      console.error('Import error:', err);
      setError('Failed to import data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const template = `name,email,total_points,1st place,2nd place,3rd place
John Doe,john@example.com,45,3,2,1
Jane Smith,jane@example.com,38,2,3,2
Bob Johnson,bob@example.com,32,1,2,3`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'iq-vote-import-template.csv';
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
            Import Historical Voting Data
          </CardTitle>
          <CardDescription>
            Import past election results from Google Forms/Sheets or enter them manually. This creates historical records in your system.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="csv" className="space-y-6">
        <TabsList>
          <TabsTrigger value="csv">CSV Import</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        {/* CSV Import Tab */}
        <TabsContent value="csv" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import from CSV</CardTitle>
              <CardDescription>
                Export your Google Sheets as CSV and upload it here. We'll automatically detect the columns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Download */}
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-sm">Need help formatting your CSV?</span>
                  <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 w-full sm:w-auto flex-shrink-0">
                    <Download className="w-3 h-3" />
                    Download Template
                  </Button>
                </AlertDescription>
              </Alert>

              {/* Election Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="csv-title">Election Title</Label>
                  <Input
                    id="csv-title"
                    value={electionTitle}
                    onChange={(e) => setElectionTitle(e.target.value)}
                    placeholder="e.g., January 2024 IQ Vote"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="csv-date">Election Date</Label>
                  <Input
                    id="csv-date"
                    type="date"
                    value={electionDate}
                    onChange={(e) => setElectionDate(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <Label htmlFor="csv-upload">Upload CSV File</Label>
                <div className="mt-1.5">
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Supported columns: name/employee, email, total_points/points/score, 1st place, 2nd place, 3rd place
                </p>
              </div>

              {/* CSV Preview */}
              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview ({csvPreview.length} rows)</Label>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left p-2 font-medium">Name</th>
                            <th className="text-left p-2 font-medium">Email</th>
                            <th className="text-left p-2 font-medium">Points</th>
                            <th className="text-left p-2 font-medium">1st</th>
                            <th className="text-left p-2 font-medium">2nd</th>
                            <th className="text-left p-2 font-medium">3rd</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.slice(0, 10).map((row, idx) => {
                            const name = row.name || row.employee || row['employee name'] || row.voter || '';
                            const email = row.email || row['email address'] || '';
                            const points = row.points || row['total points'] || row.score || row.votes || '0';
                            const first = row['1st place'] || row.first || row['rank 1'] || '0';
                            const second = row['2nd place'] || row.second || row['rank 2'] || '0';
                            const third = row['3rd place'] || row.third || row['rank 3'] || '0';

                            return (
                              <tr key={idx} className="border-t border-border">
                                <td className="p-2">{name}</td>
                                <td className="p-2 text-muted-foreground">{email}</td>
                                <td className="p-2 font-medium">{points}</td>
                                <td className="p-2 text-muted-foreground">{first}</td>
                                <td className="p-2 text-muted-foreground">{second}</td>
                                <td className="p-2 text-muted-foreground">{third}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {csvPreview.length > 10 && (
                      <div className="p-2 text-xs text-center text-muted-foreground bg-muted/30 border-t border-border">
                        Showing first 10 of {csvPreview.length} rows
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleCSVImport}
                disabled={loading || !csvFile || csvPreview.length === 0 || !electionTitle || !electionDate}
                className="w-full gap-2"
              >
                <Upload className="w-4 h-4" />
                {loading ? 'Importing...' : 'Import CSV Data'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
              <CardDescription>
                Enter historical election results manually, one employee at a time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Election Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manual-title">Election Title</Label>
                  <Input
                    id="manual-title"
                    value={electionTitle}
                    onChange={(e) => setElectionTitle(e.target.value)}
                    placeholder="e.g., January 2024 IQ Vote"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-date">Election Date</Label>
                  <Input
                    id="manual-date"
                    type="date"
                    value={electionDate}
                    onChange={(e) => setElectionDate(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Manual Entries */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Employee Results</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addManualEntry}
                    className="gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    Add Employee
                  </Button>
                </div>

                {manualEntries.map((entry, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg space-y-3 bg-card">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`name-${index}`}>Employee Name *</Label>
                        <Input
                          id={`name-${index}`}
                          value={entry.employee_name}
                          onChange={(e) => updateManualEntry(index, 'employee_name', e.target.value)}
                          placeholder="John Doe"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`email-${index}`}>Email (Optional)</Label>
                        <Input
                          id={`email-${index}`}
                          value={entry.employee_email || ''}
                          onChange={(e) => updateManualEntry(index, 'employee_email', e.target.value)}
                          placeholder="john@example.com"
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label htmlFor={`points-${index}`}>Total Points *</Label>
                        <Input
                          id={`points-${index}`}
                          type="number"
                          value={entry.total_points}
                          onChange={(e) => updateManualEntry(index, 'total_points', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`first-${index}`}>1st Place</Label>
                        <Input
                          id={`first-${index}`}
                          type="number"
                          value={entry.count_first || 0}
                          onChange={(e) => updateManualEntry(index, 'count_first', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`second-${index}`}>2nd Place</Label>
                        <Input
                          id={`second-${index}`}
                          type="number"
                          value={entry.count_second || 0}
                          onChange={(e) => updateManualEntry(index, 'count_second', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`third-${index}`}>3rd Place</Label>
                        <Input
                          id={`third-${index}`}
                          type="number"
                          value={entry.count_third || 0}
                          onChange={(e) => updateManualEntry(index, 'count_third', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    {manualEntries.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeManualEntry(index)}
                        className="gap-2 hover:border-destructive/50 hover:text-destructive w-full"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Note:</strong> Total points is required. Rank counts (1st, 2nd, 3rd place) are optional but help with tie-breaking.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleManualImport}
                disabled={loading || !electionTitle || !electionDate}
                className="w-full gap-2"
              >
                <Upload className="w-4 h-4" />
                {loading ? 'Importing...' : `Import ${manualEntries.filter(e => e.employee_name && e.total_points > 0).length} Entries`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}