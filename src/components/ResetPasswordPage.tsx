import { useState, useEffect } from 'react';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { createClient } from '../utils/supabase/client';
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
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        setSessionReady(true);
      }
    });

    // Explicitly exchange the PKCE code from the URL if present
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (data?.session) setSessionReady(true);
        if (error) setError('Invalid or expired reset link. Please request a new one.');
      });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setSessionReady(true);
      });
    }

    return () => subscription.unsubscribe();
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
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(onComplete, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    // Same surface as the sign-in screen this page hands you back to: content
    // centred on the page canvas, no card. A card here would be a second
    // enclosure around a form that is already the only thing on screen.
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5 py-12 sm:px-8">
      <div className="w-full max-w-[26rem]">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={isDark ? logoImageDark : logoImageLight}
            alt=""
            className="mb-4 h-11 w-11 object-contain"
          />
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Set a new password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Pick something you haven&apos;t used here before.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-5">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <Alert className="border-success/40 bg-success/10">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
            <AlertDescription className="text-success">
              Password updated. Signing you in…
            </AlertDescription>
          </Alert>
        ) : !sessionReady ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <LoadingSpinner size="sm" inline />
            Checking your reset link…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="rp-password">New password</Label>
              <Input
                id="rp-password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="••••••••"
                aria-describedby="rp-password-hint"
                className="mt-1.5 h-11"
              />
              <p id="rp-password-hint" className="mt-1.5 text-xs text-muted-foreground">
                At least 6 characters.
              </p>
            </div>
            <div>
              <Label htmlFor="rp-confirm">Confirm new password</Label>
              <Input
                id="rp-confirm"
                name="confirm"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="••••••••"
                className="mt-1.5 h-11"
              />
            </div>
            <Button type="submit" className="h-11 w-full gap-2 text-[0.9375rem]" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="sm" inline />
                  Updating…
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  Update password
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
