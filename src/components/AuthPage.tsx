import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { createClient } from '../utils/supabase/client';
import { api } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { useTheme } from './ThemeProvider';
import logoImageLight from 'figma:asset/adf5897e345947bbe763382a76a190054bc17e88.png';
import logoImageDark from 'figma:asset/edd81dc1188a78ee35f46489ff2f13306860893c.png';

interface AuthPageProps {
  onSignIn: () => void;
  error?: string | null;
  showResetOption?: boolean;
}

/* The scoring rule, stated on the way in rather than discovered on the vote
   screen. Ordered 2nd–1st–3rd and graded by fill so it reads as the same
   podium the leaderboard builds, not a generic bar chart. */
const SCORING = [
  { rank: '2nd', points: 3, height: 'h-11', fill: 'bg-primary/20' },
  { rank: '1st', points: 5, height: 'h-16', fill: 'bg-primary/35' },
  { rank: '3rd', points: 2, height: 'h-8', fill: 'bg-primary/14' },
];

/* Shared field shell. Every input in this page is a label, a control, and an
   optional hint in the same vertical rhythm — declaring it once is what keeps
   the two forms from drifting apart. */
function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* Password field with a reveal toggle. The toggle is a real button with an
   accessible name and it sits inside the input's padding, so the text never
   runs under it. */
function PasswordField({
  id,
  autoComplete,
  minLength,
}: {
  id: string;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name="password"
        type={visible ? 'text' : 'password'}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder="••••••••"
        className="h-11 pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function AuthPage({ onSignIn, error: externalError, showResetOption = false }: AuthPageProps) {
  const { resolvedTheme } = useTheme();
  const logoImage = resolvedTheme === 'dark' ? logoImageDark : logoImageLight;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  /* Tracked only so the heading above the tabs can name what you're about to
     do. The tabs remain the control; this just follows them. */
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, isSignUp: boolean) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const supabase = createClient();

      if (isSignUp) {
        const name = formData.get('name') as string;
        const role = formData.get('role') as string;

        // Use the api helper which has correct credentials
        const result = await api.signup(email, password, name, role);

        // Check if this was the first user (admin)
        if (result.is_first_user) {
          setSuccess('Account created. You are the first user, so you have admin access.');
        } else {
          setSuccess('Account created. Signing you in…');
        }

        // Now sign in automatically
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (signInData.session) {
          // Supabase handles session storage automatically
          onSignIn();
        }
      } else {
        // Sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // Provide more helpful error message
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('That email and password don\'t match an account. Check them and try again, or create an account first.');
          }
          throw signInError;
        }

        if (data.session) {
          // Supabase handles session storage automatically
          onSignIn();
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* ---------------------------------------------------------------- */}
      {/*  Brand rail — desktop only.                                       */}
      {/*                                                                   */}
      {/*  On a phone this would be a screen of marketing standing between  */}
      {/*  someone and their password, so it collapses to a compact header  */}
      {/*  above the form instead of stacking.                              */}
      {/* ---------------------------------------------------------------- */}
      <aside className="relative hidden overflow-hidden bg-card lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-16">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        {/* Fades the grid out toward the seam so it reads as texture rather
            than a pattern that stops at an edge. */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-card/60 to-card"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3">
          <img src={logoImage} alt="" className="h-9 w-9 object-contain" />
          <span className="font-display text-lg font-semibold tracking-tight">IQ Vote</span>
        </div>

        <div className="relative max-w-[26rem]">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            BrainDAO
          </p>
          <h2 className="font-display mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-balance xl:text-[2.75rem]">
            Employee of the Month, decided by the team.
          </h2>
          <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty">
            Rank three colleagues each month. Your ballot is anonymous, and the
            standings update the moment voting closes.
          </p>

          {/* The scoring rule as a small podium — the same shape the
              leaderboard uses, so the mental model is already in place before
              anyone reaches the vote screen. */}
          <div className="mt-10 max-w-[19rem]" aria-hidden="true">
            <div className="flex items-end gap-2.5 border-b border-border pb-px">
              {SCORING.map(({ rank, points, height, fill }) => (
                <div key={rank} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">{points}</span>
                  <div
                    className={`w-full rounded-t-lg inset-ring-1 inset-ring-primary/35 ${fill} ${height}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2.5 pt-2">
              {SCORING.map(({ rank }) => (
                <span key={rank} className="flex-1 text-center text-xs text-muted-foreground">
                  {rank}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            1st place is worth 5 points, 2nd is worth 3, and 3rd is worth 2.
          </p>
        </div>

        <p className="relative text-xs text-muted-foreground">
          Internal to BrainDAO · Employee recognition
        </p>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/*  Form column                                                      */}
      {/* ---------------------------------------------------------------- */}
      <main className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-12 sm:px-8 lg:min-h-0 lg:py-16">
        <div className="w-full max-w-[26rem]">
          {/* Compact brand for phones and tablets, where the rail is hidden. */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <img src={logoImage} alt="" className="mb-4 h-11 w-11 object-contain" />
            <h1 className="font-display text-2xl font-semibold tracking-tight">IQ Vote</h1>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">
              Employee-of-the-Month voting for BrainDAO.
            </p>
          </div>

          <div className="mb-7 hidden lg:block">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {mode === 'signin' ? 'Sign in to IQ Vote' : 'Create your account'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === 'signin'
                ? 'Use the email address you were invited with.'
                : 'Your name and role appear on the ballot other people vote from.'}
            </p>
          </div>

          {externalError && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{externalError}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-5 border-success/40 bg-success/10">
              <AlertDescription className="text-success">{success}</AlertDescription>
            </Alert>
          )}

          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as 'signin' | 'signup')}
            className="w-full gap-6"
          >
            {/* Same segmented control as the header nav: an inset track with a
                raised, hairlined selected tab. Selection is carried by surface,
                border, colour and weight together — not by an accent outline,
                which the brand pink is too light to draw legibly. */}
            <TabsList className="h-11 w-full rounded-full bg-muted/70 p-1 inset-ring-1 inset-ring-border/60">
              <TabsTrigger
                value="signin"
                className="h-9 flex-1 rounded-full data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:shadow-[0_1px_2px_rgba(0,0,0,0.06)] data-[state=active]:inset-ring-1 data-[state=active]:inset-ring-border"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="h-9 flex-1 rounded-full data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:shadow-[0_1px_2px_rgba(0,0,0,0.06)] data-[state=active]:inset-ring-1 data-[state=active]:inset-ring-border"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
                <Field id="signin-email" label="Email">
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@braindao.org"
                    className="h-11"
                  />
                </Field>

                <Field id="signin-password" label="Password">
                  <PasswordField id="signin-password" autoComplete="current-password" />
                </Field>

                <Button type="submit" className="h-11 w-full text-[0.9375rem]" disabled={loading}>
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" inline />
                      Signing in…
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>

                <p className="pt-1 text-center text-sm text-muted-foreground">
                  Forgotten your password? Ask an admin to reset it.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-5">
                {/* Name and role are both short — side by side on anything
                    wider than a phone keeps the form from running long. */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="signup-name" label="Full name">
                    <Input
                      id="signup-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Amara Okonkwo"
                      className="h-11"
                    />
                  </Field>

                  <Field id="signup-role" label="Role">
                    <Input
                      id="signup-role"
                      name="role"
                      type="text"
                      required
                      autoComplete="organization-title"
                      placeholder="Protocol Engineer"
                      className="h-11"
                    />
                  </Field>
                </div>

                <Field id="signup-email" label="Email">
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@braindao.org"
                    className="h-11"
                  />
                </Field>

                <Field
                  id="signup-password"
                  label="Password"
                  hint="At least 6 characters."
                >
                  <PasswordField
                    id="signup-password"
                    autoComplete="new-password"
                    minLength={6}
                  />
                </Field>

                <Button type="submit" className="h-11 w-full text-[0.9375rem]" disabled={loading}>
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" inline />
                      Creating account…
                    </>
                  ) : (
                    'Create account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-center text-xs text-muted-foreground lg:hidden">
            BrainDAO · Employee recognition
          </p>
        </div>
      </main>
    </div>
  );
}
