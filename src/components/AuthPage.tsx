import { useState, useEffect } from 'react';
import { LogIn, Trophy, Vote, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { createClient } from '../utils/supabase/client';
import { api } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import logoImageLight from 'figma:asset/adf5897e345947bbe763382a76a190054bc17e88.png';
import logoImageDark from 'figma:asset/edd81dc1188a78ee35f46489ff2f13306860893c.png';

interface AuthPageProps {
  onSignIn: () => void;
  error?: string | null;
  showResetOption?: boolean;
}

export function AuthPage({ onSignIn, error: externalError, showResetOption = false }: AuthPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    // Check initial theme
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

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
          setSuccess('🎉 Account created! You are the first user and have been granted admin access.');
        } else {
          setSuccess('✅ Account created successfully! You can now sign in.');
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
            throw new Error('Invalid email or password. Please check your credentials and try again. If you don\'t have an account, please sign up first.');
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* ---------- Left: brand panel (desktop) ---------- */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 overflow-hidden bg-mesh">
        <div className="absolute inset-0 bg-grid opacity-[0.4]" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-primary/25 blur-3xl animate-float" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-purple-500/20 blur-3xl animate-float" style={{ animationDelay: '3s' }} aria-hidden="true" />

        {/* Logo lockup */}
        <div className="relative flex items-center gap-3 animate-fade-in-down">
          <img src={isDark ? logoImageDark : logoImageLight} alt="IQ Vote Logo" className="w-14 h-14 object-contain drop-shadow-lg" />
          <span className="font-display text-xl font-bold tracking-tight">IQ Vote</span>
        </div>

        {/* Headline */}
        <div className="relative animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            BrainDAO · Employee Recognition
          </div>
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight mb-5">
            Celebrate the people who move{' '}
            <span className="text-gradient-primary">IQ</span> forward.
          </h1>
          <p className="text-base xl:text-lg text-muted-foreground max-w-md">
            Cast your monthly ranked vote for the colleagues doing standout work — and watch the leaderboard come alive.
          </p>
        </div>

        {/* Feature chips */}
        <div className="relative grid gap-3 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          {[
            { icon: Vote, title: 'Ranked voting', desc: 'Pick your top 3 — 5, 3 and 2 points.' },
            { icon: Trophy, title: 'Live leaderboard', desc: 'Results update as the team votes.' },
            { icon: ShieldCheck, title: 'Private & fair', desc: 'One locked ballot, anonymous reasons.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 rounded-xl glass px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Right: auth card ---------- */}
      <div className="relative flex items-center justify-center px-4 sm:px-6 py-10 sm:py-12 overflow-hidden">
        {/* Mobile ambient background */}
        <div className="lg:hidden absolute inset-0 bg-mesh opacity-70" aria-hidden="true" />

        <div className="relative w-full max-w-md animate-fade-in-up">
          {/* Mobile brand header */}
          <div className="lg:hidden flex flex-col items-center text-center mb-6">
            <img src={isDark ? logoImageDark : logoImageLight} alt="IQ Vote Logo" className="w-20 h-20 object-contain mb-3 drop-shadow-lg" />
            <h1 className="font-display text-2xl font-bold text-gradient-primary">IQ Vote</h1>
            <p className="text-sm text-muted-foreground mt-1">Celebrate your top performers</p>
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8 shadow-2xl shadow-primary/10 glow-primary">
            <div className="hidden lg:block mb-6">
              <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Welcome back</h2>
              <p className="text-sm text-muted-foreground">Sign in to cast your vote.</p>
            </div>
          
          {externalError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{externalError}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6 border-green-500/50 bg-green-500/10">
              <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
            </Alert>
          )}
          
          {/* Sign In / Sign Up Tabs */}
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="mt-1.5"
                  />
                </div>
                
                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="mt-1.5"
                  />
                </div>
                
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" inline />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Forgot your password? Contact your admin to reset it.
                </p>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    required
                    placeholder="John Doe"
                    className="mt-1.5"
                  />
                </div>
                
                <div>
                  <Label htmlFor="signup-role">Role</Label>
                  <Input
                    id="signup-role"
                    name="role"
                    type="text"
                    required
                    placeholder="Software Engineer"
                    className="mt-1.5"
                  />
                </div>
                
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="mt-1.5"
                  />
                </div>
                
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 6 characters
                  </p>
                </div>
                
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" inline />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
