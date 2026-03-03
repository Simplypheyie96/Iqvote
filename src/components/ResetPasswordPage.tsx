import { useState, useEffect } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { api } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import logoImageLight from 'figma:asset/adf5897e345947bbe763382a76a190054bc17e88.png';
import logoImageDark from 'figma:asset/edd81dc1188a78ee35f46489ff2f13306860893c.png';

interface ResetPasswordPageProps {
  onComplete: () => void;
}

export function ResetPasswordPage({ onComplete }: ResetPasswordPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Read the token from URL query params (?token=...&type=reset)
  const token = new URLSearchParams(window.location.search).get('token') || '';

  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;

    if (password !== confirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await api.resetPassword(token, password);
      setSuccess(true);
      // Clear the token from the URL then go to sign in
      window.history.replaceState({}, '', '/');
      setTimeout(onComplete, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center mb-6">
            <img
              src={isDark ? logoImageDark : logoImageLight}
              alt="IQ Vote Logo"
              className="w-[102px] h-[102px] sm:w-[134px] sm:h-[134px] object-contain mb-[6px]"
            />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent mb-2">
              Set New Password
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              Choose a new password for your account
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <Alert className="mb-6 border-green-500/50 bg-green-500/10">
              <AlertDescription className="text-green-600 dark:text-green-400">
                ✅ Password updated! Redirecting to sign in…
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="rp-password">New Password</Label>
                <Input
                  id="rp-password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">Must be at least 6 characters</p>
              </div>
              <div>
                <Label htmlFor="rp-confirm">Confirm Password</Label>
                <Input
                  id="rp-confirm"
                  name="confirm"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" inline />
                    Updating…
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
