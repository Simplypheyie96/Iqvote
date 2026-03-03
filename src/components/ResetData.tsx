import { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { createClient } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

export function ResetData() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  async function handleReset() {
    if (confirmText !== 'RESET') {
      setError('Please type RESET to confirm');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get the current user's access token
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e2c9f810/admin/reset-database`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset data');
      }
      
      setSuccess(true);
      
      // Clear local storage and reload after 3 seconds
      setTimeout(() => {
        localStorage.clear();
        window.location.reload();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-destructive/5">
      <Card className="max-w-2xl w-full border-destructive/50">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive-foreground" />
          </div>
          <CardTitle className="text-3xl">Reset All Data</CardTitle>
          <CardDescription className="text-base">
            Clear all demo data and start fresh
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!success ? (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This will permanently delete ALL data including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All user accounts and authentication data</li>
                    <li>All employees</li>
                    <li>All elections</li>
                    <li>All votes and ballots</li>
                    <li>All leaderboard data</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-semibold mb-2">What happens after reset:</h4>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>All data will be cleared from the database</li>
                  <li>All user accounts will be deleted</li>
                  <li>You'll be signed out automatically</li>
                  <li>The page will reload to the sign-up screen</li>
                  <li>The first person to sign up will become admin</li>
                </ol>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Type <span className="font-mono bg-muted px-1 py-0.5 rounded">RESET</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type RESET here"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>

              <Button 
                onClick={handleReset} 
                disabled={loading || confirmText !== 'RESET'}
                variant="destructive"
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Resetting All Data...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5 mr-2" />
                    Reset All Data
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-600 dark:text-green-400 font-semibold">
                  All data has been reset successfully!
                </AlertDescription>
              </Alert>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  <strong>Redirecting in 3 seconds...</strong>
                  <br />
                  You'll be taken to the sign-up page where you can create your admin account.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
