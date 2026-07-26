import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function ResetPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!confirm('⚠️ WARNING: This will DELETE ALL DATA including all users, elections, votes, and employees.\n\nAre you absolutely sure?')) {
      return;
    }

    if (!confirm('🚨 FINAL WARNING: This action CANNOT be undone!\n\nClick OK to proceed with complete data wipe.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e2c9f810/reset`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        
        // Clear local storage
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to home after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setError(data.error || 'Reset failed');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card rounded-xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-destructive mb-2">Database Reset Tool</h1>
          <p className="text-muted-foreground">
            Use this tool to completely wipe all data and start fresh
          </p>
        </div>

        {!result && !error && (
          <div className="space-y-6">
            <div className="bg-destructive/20 border border-destructive rounded-xl p-6">
              <h3 className="text-destructive mb-3">⚠️ Warning: This Will Delete</h3>
              <ul className="space-y-2 text-destructive">
                <li>• All registered users and authentication accounts</li>
                <li>• All employees and candidates</li>
                <li>• All elections and voting data</li>
                <li>• All ballots and tallies</li>
                <li>• All voting reasons and messages</li>
                <li>• All storage files and uploads</li>
              </ul>
            </div>

            <div className="bg-info/20 border border-info rounded-xl p-6">
              <h3 className="text-info mb-3">✅ After Reset</h3>
              <ul className="space-y-2 text-info">
                <li>• Database will be completely empty</li>
                <li>• No users will be registered</li>
                <li>• You can sign up fresh as the first admin</li>
                <li>• System will be ready for production use</li>
              </ul>
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/85 disabled:opacity-50 py-4 rounded-xl transition-colors"
            >
              {loading ? 'Resetting All Data...' : '🗑️ Reset All Data'}
            </button>

            <a
              href="/"
              className="block text-center text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Cancel and Go Back
            </a>
          </div>
        )}

        {result && (
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-success mb-4">Reset Successful!</h2>
            
            <div className="bg-success/20 border border-success rounded-xl p-6 text-left">
              <h3 className="text-success mb-3">Deleted:</h3>
              <ul className="space-y-2 text-success">
                <li>• {result.details.users_deleted} user accounts</li>
                <li>• {result.details.database_entries_deleted} database entries</li>
                <li>• {result.details.storage_files_deleted} storage files</li>
              </ul>
            </div>

            {result.has_errors && (
              <div className="bg-warning/20 border border-warning rounded-xl p-4 text-left">
                <p className="text-warning">
                  ⚠️ Some minor errors occurred but reset completed
                </p>
              </div>
            )}

            <p className="text-muted-foreground">
              Redirecting to home page in 3 seconds...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-destructive mb-4">Reset Failed</h2>
            
            <div className="bg-destructive/20 border border-destructive rounded-xl p-6">
              <p className="text-destructive">{error}</p>
            </div>

            <button
              onClick={() => {
                setError(null);
                setResult(null);
              }}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 px-6 py-3 rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
