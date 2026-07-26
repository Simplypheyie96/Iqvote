import { useState } from 'react';
import { Rocket, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function DemoSetup() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<any>(null);

  async function createDemoData() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e2c9f810/demo/create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create demo data');
      }
      
      setDemoAccounts(data.demo_accounts);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl">IQ Vote Demo Setup</CardTitle>
          <CardDescription className="text-base">
            Initialize demo data to explore all features
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!success ? (
            <>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <h4 className="font-semibold mb-2">What will be created:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary-strong mt-0.5 flex-shrink-0" />
                      <span>8 demo employees with authentication</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary-strong mt-0.5 flex-shrink-0" />
                      <span>1 active election (November 2024) with eligible employees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary-strong mt-0.5 flex-shrink-0" />
                      <span>2 historical elections (October & September 2024)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary-strong mt-0.5 flex-shrink-0" />
                      <span>5 submitted ballots with voting reasons</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary-strong mt-0.5 flex-shrink-0" />
                      <span>Compiled leaderboard with anonymous messages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary-strong mt-0.5 flex-shrink-0" />
                      <span>Personal voting history for demo accounts</span>
                    </li>
                  </ul>
                </div>

                <Alert className="border-primary/50 bg-primary/10">
                  <AlertDescription className="text-sm">
                    This will create demo data including authentication accounts.
                    You can log in as either an admin or employee to explore the full system.
                  </AlertDescription>
                </Alert>
              </div>

              <Button 
                onClick={createDemoData} 
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Demo Data...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5 mr-2" />
                    Create Demo Data
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <Alert className="border-success/50 bg-success/10">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <AlertDescription className="text-success font-semibold">
                  Demo data created successfully!
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    👑 Admin Account
                  </h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div>
                      <span className="text-muted-foreground">Email:</span>{' '}
                      <span className="font-semibold">{demoAccounts?.admin.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Password:</span>{' '}
                      <span className="font-semibold">{demoAccounts?.admin.password}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-muted/50 border border-border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    👤 Employee Account
                  </h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div>
                      <span className="text-muted-foreground">Email:</span>{' '}
                      <span className="font-semibold">{demoAccounts?.employee.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Password:</span>{' '}
                      <span className="font-semibold">{demoAccounts?.employee.password}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-info/10 border border-info/20">
                <p className="text-sm text-info">
                  <strong>Next step:</strong> Close this window and sign in with one of the accounts above to explore all features!
                </p>
              </div>

              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                size="lg"
                className="w-full"
              >
                Go to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
