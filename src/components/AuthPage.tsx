import { useState, useEffect } from 'react';
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
      {/* Left: brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-[#101d35] text-white lg:border-r border-white/5">
        <div className="flex items-center gap-3">
          <img src={logoImageDark} alt="IQ Vote" className="w-11 h-11 object-contain" />
          <span className="text-lg font-semibold tracking-tight">IQ Vote</span>
        </div>

        <div>
          <div className="inline-flex items-center rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/70 mb-6">
            BrainDAO · Employee Recognition
          </div>
          <h1 className="text-4xl xl:text-[2.75rem] font-semibold leading-[1.08] tracking-tight mb-5">
            Recognize the people who move <span className="text-primary">IQ</span> forward.
          </h1>
          <p className="text-base text-white/55 max-w-md">
            Cast your monthly ranked vote for the colleagues doing standout work.
          </p>
        </div>

        <div className="grid gap-3.5">
          {[
            { t: 'Ranked voting', d: 'Pick your top three — 5, 3 and 2 points.' },
            { t: 'Live leaderboard', d: 'Results update as the team votes.' },
            { t: 'Private & fair', d: 'One locked ballot, anonymous notes.' },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-3">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
              <div>
                <div className="text-sm font-medium leading-tight">{f.t}</div>
                <div className="text-sm text-white/45">{f.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-4 sm:px-6 py-10 sm:py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <img src={isDark ? logoImageDark : logoImageLight} alt="IQ Vote" className="w-9 h-9 object-contain" />
            <span className="text-lg font-semibold tracking-tight">IQ Vote</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to cast your vote.</p>
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
                
                <Button type="submit" className="w-full mt-1" disabled={loading}>
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" inline />
                      Signing in…
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground pt-1">
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
                
                <Button type="submit" className="w-full mt-1" disabled={loading}>
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
        </div>
      </div>
    </div>
  );
}
