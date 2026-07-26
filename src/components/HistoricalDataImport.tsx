import { useState } from 'react';
import { Upload, Plus, Trash2, AlertCircle, CheckCircle2, FileText, Download, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { SUBTAB_LIST_CLASS, SUBTAB_TRIGGER_CLASS } from './ui/tab-pills';
import { api } from '../utils/api';

/** Matches the numbered steps on the create-election form, minus the number —
 *  these two panels are alternatives, not a sequence. */
function Panel({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-e1 sm:p-6">
      <h4 className="font-display text-base font-semibold tracking-tight">{title}</h4>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground text-pretty">{description}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

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
        <Alert className="border-success/50 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="csv" className="space-y-6">
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className={SUBTAB_LIST_CLASS}>
            <TabsTrigger value="csv" className={SUBTAB_TRIGGER_CLASS}>Upload a CSV</TabsTrigger>
            <TabsTrigger value="manual" className={SUBTAB_TRIGGER_CLASS}>Type it in</TabsTrigger>
          </TabsList>
        </div>

        {/* CSV Import Tab */}
        <TabsContent value="csv" className="mt-0">
          <Panel
            title="Upload a CSV"
            description="Export the sheet as CSV and drop it here. The columns are detected for you."
          >
              {/* Template Download */}
              <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4 inset-ring-1 inset-ring-border sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground text-pretty">
                    Not sure how the file should be laid out? Start from the template.
                  </p>
                </div>
                <Button variant="outline" onClick={downloadTemplate} className="h-10 w-full shrink-0 gap-2 sm:w-auto">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download template
                </Button>
              </div>

              {/* Election Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="csv-title">Election title</Label>
                  <Input
                    id="csv-title"
                    value={electionTitle}
                    onChange={(e) => setElectionTitle(e.target.value)}
                    placeholder="January 2024 — Employee of the Month"
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="csv-date">Election date</Label>
                  <Input
                    id="csv-date"
                    type="date"
                    value={electionDate}
                    onChange={(e) => setElectionDate(e.target.value)}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <Label htmlFor="csv-upload">CSV file</Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="mt-1.5 h-11 cursor-pointer py-2.5 file:mr-3 file:text-sm file:font-medium"
                />
                <p className="mt-2 text-xs text-muted-foreground text-pretty">
                  Recognised columns: name/employee, email, total_points/points/score, 1st place, 2nd place, 3rd place.
                </p>
              </div>

              {/* CSV Preview */}
              {csvPreview.length > 0 && (
                <div>
                  <Label>Preview — {csvPreview.length} {csvPreview.length === 1 ? 'row' : 'rows'}</Label>
                  <div className="mt-1.5 overflow-hidden rounded-xl border border-border">
                    <div className="max-h-64 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/70 backdrop-blur-sm">
                          <tr>
                            <th className="p-2.5 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Name</th>
                            <th className="p-2.5 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Email</th>
                            <th className="p-2.5 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Points</th>
                            <th className="p-2.5 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">1st</th>
                            <th className="p-2.5 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">2nd</th>
                            <th className="p-2.5 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">3rd</th>
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
                                <td className="p-2.5">{name}</td>
                                <td className="p-2.5 text-muted-foreground">{email}</td>
                                <td className="p-2.5 font-medium tabular-nums">{points}</td>
                                <td className="p-2.5 tabular-nums text-muted-foreground">{first}</td>
                                <td className="p-2.5 tabular-nums text-muted-foreground">{second}</td>
                                <td className="p-2.5 tabular-nums text-muted-foreground">{third}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {csvPreview.length > 10 && (
                      <div className="border-t border-border bg-muted/40 p-2.5 text-center text-xs text-muted-foreground">
                        Showing the first 10 of {csvPreview.length} rows
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleCSVImport}
                disabled={loading || !csvFile || csvPreview.length === 0 || !electionTitle || !electionDate}
                className="h-11 w-full gap-2"
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  : <Upload className="h-4 w-4" aria-hidden="true" />}
                {loading ? 'Importing…' : 'Import this file'}
              </Button>
          </Panel>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="mt-0">
          <Panel
            title="Type it in"
            description="For a single past election with only a handful of results — add one person at a time."
          >
              {/* Election Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="manual-title">Election title</Label>
                  <Input
                    id="manual-title"
                    value={electionTitle}
                    onChange={(e) => setElectionTitle(e.target.value)}
                    placeholder="January 2024 — Employee of the Month"
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-date">Election date</Label>
                  <Input
                    id="manual-date"
                    type="date"
                    value={electionDate}
                    onChange={(e) => setElectionDate(e.target.value)}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>

              {/* Manual Entries */}
              <div>
                <div className="flex items-center justify-between gap-4">
                  <Label>Results</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addManualEntry}
                    className="h-10 gap-2"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add person
                  </Button>
                </div>

                <div className="mt-3 space-y-3">
                {manualEntries.map((entry, index) => (
                  <div key={index} className="rounded-xl bg-muted/40 p-4 inset-ring-1 inset-ring-border">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Person {index + 1}
                      </span>
                      {manualEntries.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeManualEntry(index)}
                          className="h-8 gap-1.5 px-2.5 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`name-${index}`}>Name</Label>
                        <Input
                          id={`name-${index}`}
                          value={entry.employee_name}
                          onChange={(e) => updateManualEntry(index, 'employee_name', e.target.value)}
                          placeholder="Ngozi Okonkwo"
                          className="mt-1.5 h-11 bg-card"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`email-${index}`}>Email <span className="font-normal text-muted-foreground">(optional)</span></Label>
                        <Input
                          id={`email-${index}`}
                          value={entry.employee_email || ''}
                          onChange={(e) => updateManualEntry(index, 'employee_email', e.target.value)}
                          placeholder="n.okonkwo@braindao.org"
                          className="mt-1.5 h-11 bg-card"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <Label htmlFor={`points-${index}`}>Points</Label>
                        <Input
                          id={`points-${index}`}
                          type="number"
                          value={entry.total_points}
                          onChange={(e) => updateManualEntry(index, 'total_points', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="mt-1.5 h-11 bg-card tabular-nums"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`first-${index}`}>1st places</Label>
                        <Input
                          id={`first-${index}`}
                          type="number"
                          value={entry.count_first || 0}
                          onChange={(e) => updateManualEntry(index, 'count_first', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="mt-1.5 h-11 bg-card tabular-nums"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`second-${index}`}>2nd places</Label>
                        <Input
                          id={`second-${index}`}
                          type="number"
                          value={entry.count_second || 0}
                          onChange={(e) => updateManualEntry(index, 'count_second', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="mt-1.5 h-11 bg-card tabular-nums"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`third-${index}`}>3rd places</Label>
                        <Input
                          id={`third-${index}`}
                          type="number"
                          value={entry.count_third || 0}
                          onChange={(e) => updateManualEntry(index, 'count_third', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="mt-1.5 h-11 bg-card tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                </div>

                <p className="mt-3 text-sm text-muted-foreground text-pretty">
                  Points are what the leaderboard ranks on. The 1st/2nd/3rd counts are optional — they only
                  come into play to break a tie.
                </p>
              </div>

              <Button
                onClick={handleManualImport}
                disabled={loading || !electionTitle || !electionDate}
                className="h-11 w-full gap-2"
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  : <Upload className="h-4 w-4" aria-hidden="true" />}
                {loading
                  ? 'Importing…'
                  : `Import ${manualEntries.filter(e => e.employee_name && e.total_points > 0).length} ${
                      manualEntries.filter(e => e.employee_name && e.total_points > 0).length === 1 ? 'result' : 'results'
                    }`}
              </Button>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}