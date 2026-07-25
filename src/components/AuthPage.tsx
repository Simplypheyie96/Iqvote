import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { createClient } from '../utils/supabase/client';
import { api } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logoImageDark} alt="IQ Vote" className="w-12 h-12 object-contain mb-4" />
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to IQ Vote</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Cast your monthly vote for standout colleagues.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
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
          <Tabs defaultValue="signin" className="w-full gap-5">
            <TabsList className="w-full">
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

        <p className="text-center text-xs text-muted-foreground mt-6">
          BrainDAO · Employee Recognition
        </p>
      </div>
    </div>
  );
}
