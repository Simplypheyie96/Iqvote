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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-red-600 dark:text-red-400 mb-2">Database Reset Tool</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Use this tool to completely wipe all data and start fresh
          </p>
        </div>

        {!result && !error && (
          <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-red-800 dark:text-red-300 mb-3">⚠️ Warning: This Will Delete</h3>
              <ul className="space-y-2 text-red-700 dark:text-red-400">
                <li>• All registered users and authentication accounts</li>
                <li>• All employees and candidates</li>
                <li>• All elections and voting data</li>
                <li>• All ballots and tallies</li>
                <li>• All voting reasons and messages</li>
                <li>• All storage files and uploads</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-blue-800 dark:text-blue-300 mb-3">✅ After Reset</h3>
              <ul className="space-y-2 text-blue-700 dark:text-blue-400">
                <li>• Database will be completely empty</li>
                <li>• No users will be registered</li>
                <li>• You can sign up fresh as the first admin</li>
                <li>• System will be ready for production use</li>
              </ul>
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-4 rounded-lg transition-colors"
            >
              {loading ? 'Resetting All Data...' : '🗑️ Reset All Data'}
            </button>

            <a
              href="/"
              className="block text-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              ← Cancel and Go Back
            </a>
          </div>
        )}

        {result && (
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-green-600 dark:text-green-400 mb-4">Reset Successful!</h2>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-left">
              <h3 className="text-green-800 dark:text-green-300 mb-3">Deleted:</h3>
              <ul className="space-y-2 text-green-700 dark:text-green-400">
                <li>• {result.details.users_deleted} user accounts</li>
                <li>• {result.details.database_entries_deleted} database entries</li>
                <li>• {result.details.storage_files_deleted} storage files</li>
              </ul>
            </div>

            {result.has_errors && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-left">
                <p className="text-yellow-800 dark:text-yellow-300">
                  ⚠️ Some minor errors occurred but reset completed
                </p>
              </div>
            )}

            <p className="text-gray-600 dark:text-gray-400">
              Redirecting to home page in 3 seconds...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-red-600 dark:text-red-400 mb-4">Reset Failed</h2>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>

            <button
              onClick={() => {
                setError(null);
                setResult(null);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
