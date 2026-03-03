import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from './utils/supabase/client';
import { api, clearSessionCache } from './utils/api';
import { AuthPage } from './components/AuthPage';
import { VotingPage } from './components/VotingPage';
import { LeaderboardPage } from './components/LeaderboardPage';
import { AdminPage } from './components/AdminPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Header } from './components/Header';
import { ThemeProvider } from './components/ThemeProvider';
import { ProfilePage } from './components/ProfilePage';
import { OgImagePage } from './components/OgImagePage';
import { Employee, Election } from './types';
import { Toaster } from 'sonner@2.0.3';
import logoImageLight from 'figma:asset/adf5897e345947bbe763382a76a190054bc17e88.png';
import logoImageDark from 'figma:asset/edd81dc1188a78ee35f46489ff2f13306860893c.png';

const ogImage = '/og-image.png';

export default function App() {
  // Check if we should render the OG image preview page
  if (window.location.pathname === '/og-image-preview' || window.location.hash === '#og-preview') {
    return <OgImagePage />;
  }

  // Set OG meta tags
  useEffect(() => {
    // Set title
    document.title = 'IQ Vote - Employee of the Month Voting';
    
    // Create or update meta tags
    const setMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const setMetaTagName = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Get absolute URL for the image
    const imageUrl = new URL(ogImage, window.location.origin).href;
    const currentUrl = window.location.href;

    // OG tags
    setMetaTag('og:title', 'IQ Vote - Employee of the Month Voting');
    setMetaTag('og:description', 'Modern employee recognition platform with frictionless voting experience');
    setMetaTag('og:image', imageUrl);
    setMetaTag('og:image:secure_url', imageUrl);
    setMetaTag('og:image:type', 'image/png');
    setMetaTag('og:image:width', '1200');
    setMetaTag('og:image:height', '630');
    setMetaTag('og:type', 'website');
    setMetaTag('og:url', currentUrl);
    setMetaTag('og:site_name', 'IQ Vote');
    
    // Twitter Card tags
    setMetaTagName('twitter:card', 'summary_large_image');
    setMetaTagName('twitter:title', 'IQ Vote - Employee of the Month Voting');
    setMetaTagName('twitter:description', 'Modern employee recognition platform with frictionless voting experience');
    setMetaTagName('twitter:image', imageUrl);
    
    // Standard meta description
    setMetaTagName('description', 'Modern employee recognition platform with frictionless voting experience');
  }, []);

  // Derive initial view from URL path
  const viewFromPath = (path: string): 'vote' | 'leaderboard' | 'admin' | 'profile' => {
    if (path.startsWith('/leaderboard')) return 'leaderboard';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/history') || path.startsWith('/profile')) return 'profile';
    return 'vote';
  };

  const pathForView = (view: 'vote' | 'leaderboard' | 'admin' | 'profile') => {
    if (view === 'vote') return '/';
    return `/${view}`;
  };

  const titleForView = (view: 'vote' | 'leaderboard' | 'admin' | 'profile') => {
    const titles = { vote: 'IQ Vote', leaderboard: 'IQ Vote - Leaderboard', admin: 'IQ Vote - Admin', profile: 'IQ Vote - My Profile' };
    return titles[view];
  };

  const [currentView, setCurrentView] = useState<'vote' | 'leaderboard' | 'admin' | 'profile'>(
    () => viewFromPath(window.location.pathname)
  );

  // Track which views have been visited so they stay mounted (no re-fetching on tab switch)
  const [visitedViews, setVisitedViews] = useState<Set<string>>(
    () => new Set([viewFromPath(window.location.pathname)])
  );
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [currentElection, setCurrentElection] = useState<Election | null>(null);
  const [allElections, setAllElections] = useState<Election[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Add refs to prevent infinite loops
  const authCheckInProgress = useRef(false);
  const lastAuthCheck = useRef(0);
  const AUTH_CHECK_THROTTLE = 2000; // Minimum 2 seconds between auth checks

  // Wrap data loading functions in useCallback
  const loadCurrentElection = useCallback(async () => {
    try {
      const { election } = await api.getCurrentElection();
      setCurrentElection(election);
    } catch (err) {
      console.error('Failed to load current election:', err);
    }
  }, []);

  const loadAllElections = useCallback(async () => {
    try {
      const { elections } = await api.getElections();
      setAllElections(elections);
    } catch (err) {
      console.error('Failed to load elections:', err);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const { employees: data } = await api.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    // Throttle auth checks to prevent rapid re-checking
    const now = Date.now();
    if (authCheckInProgress.current || (now - lastAuthCheck.current) < AUTH_CHECK_THROTTLE) {
      console.log('Auth check throttled or already in progress');
      return;
    }

    authCheckInProgress.current = true;
    lastAuthCheck.current = now;
    console.log('checkAuth started');
    setLoading(true);
    
    try {
      const supabase = createClient();
      
      // Try to get the session, but handle refresh token errors
      let session = null;
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          // If it's a refresh token error, clear everything and start fresh
          if (sessionError.message.includes('Refresh Token')) {
            console.log('Invalid refresh token, clearing all auth data');
            await supabase.auth.signOut();
            setCurrentUser(null);
            setAuthError(null);
            setLoading(false);
            authCheckInProgress.current = false;
            return;
          }
          throw sessionError;
        }
        
        session = currentSession;
      } catch (err: any) {
        console.error('Error getting session:', err);
        // Clear session on any error
        await supabase.auth.signOut();
        setCurrentUser(null);
        setAuthError(null);
        setLoading(false);
        authCheckInProgress.current = false;
        return;
      }
      
      if (!session) {
        console.log('No active session found');
        setCurrentUser(null);
        setLoading(false);
        authCheckInProgress.current = false;
        return;
      }
      
      // Verify token with API
      try {
        const { user } = await api.getCurrentUser();
        console.log('User verified:', user);
        setCurrentUser(user);
        setAuthError(null);
      } catch (apiErr: any) {
        console.log('Session verification failed:', apiErr.message);
        
        // If it's a 401, the session is invalid
        if (apiErr.status === 401 || apiErr.message?.includes('Unauthorized')) {
          console.log('Session is invalid or expired, signing out');
          await supabase.auth.signOut();
          setCurrentUser(null);
          setAuthError(null); // Don't show error for expired sessions
        } else {
          // Other errors - show error
          console.error('Unexpected API error:', apiErr);
          setAuthError('Failed to verify session. Please try refreshing.');
        }
      }
    } catch (err: any) {
      console.error('Auth check error:', err);
      const supabase = createClient();
      await supabase.auth.signOut();
      setCurrentUser(null);
      setAuthError(null); // Don't show error for auth failures
    } finally {
      console.log('checkAuth finished');
      setLoading(false);
      authCheckInProgress.current = false;
    }
  }, []);

  const initializeData = useCallback(async () => {
    setInitialized(true);
    
    // Load data
    try {
      await Promise.all([
        loadCurrentElection(),
        loadAllElections(),
        loadEmployees(),
      ]);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, [loadCurrentElection, loadAllElections, loadEmployees]);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;
    let hasInitialized = false;
    
    const performAuthCheck = async () => {
      // Throttle auth checks to prevent rapid re-checking
      const now = Date.now();
      if (authCheckInProgress.current || (now - lastAuthCheck.current) < AUTH_CHECK_THROTTLE) {
        console.log('Auth check throttled or already in progress');
        return;
      }

      authCheckInProgress.current = true;
      lastAuthCheck.current = now;
      console.log('checkAuth started');
      setLoading(true);
      
      try {
        const supabase = createClient();
        
        // Try to get the session, but handle refresh token errors
        let session = null;
        try {
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            // If it's a refresh token error, clear everything and start fresh
            if (sessionError.message.includes('Refresh Token')) {
              console.log('Invalid refresh token, clearing all auth data');
              await supabase.auth.signOut();
              setCurrentUser(null);
              setAuthError(null);
              setLoading(false);
              authCheckInProgress.current = false;
              return;
            }
            throw sessionError;
          }
          
          session = currentSession;
        } catch (err: any) {
          console.error('Error getting session:', err);
          // Clear session on any error
          await supabase.auth.signOut();
          setCurrentUser(null);
          setAuthError(null);
          setLoading(false);
          authCheckInProgress.current = false;
          return;
        }
        
        if (!session) {
          console.log('No active session found');
          setCurrentUser(null);
          setLoading(false);
          authCheckInProgress.current = false;
          return;
        }
        
        // Verify token with API
        try {
          const { user } = await api.getCurrentUser();
          console.log('User verified:', user);
          setCurrentUser(user);
          setAuthError(null);
        } catch (apiErr: any) {
          console.log('Session verification failed:', apiErr.message);
          
          // If it's a 401, the session is invalid
          if (apiErr.status === 401 || apiErr.message?.includes('Unauthorized')) {
            console.log('Session is invalid or expired, signing out');
            await supabase.auth.signOut();
            setCurrentUser(null);
            setAuthError(null); // Don't show error for expired sessions
          } else {
            // Other errors - show error
            console.error('Unexpected API error:', apiErr);
            setAuthError('Failed to verify session. Please try refreshing.');
          }
        }
      } catch (err: any) {
        console.error('Auth check error:', err);
        const supabase = createClient();
        await supabase.auth.signOut();
        setCurrentUser(null);
        setAuthError(null); // Don't show error for auth failures
      } finally {
        console.log('checkAuth finished');
        setLoading(false);
        authCheckInProgress.current = false;
      }
    };
    
    const initialize = async () => {
      if (hasInitialized) return;
      hasInitialized = true;
      
      console.log('Starting initialization');
      
      try {
        // Try to verify the session with our API
        await performAuthCheck();
        
        if (!mounted) return;
        
        // Only set up auth listener after initial check completes
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;
          
          console.log('Auth state changed:', event);
          
          if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            setCurrentElection(null);
            setAllElections([]);
            setEmployees([]);
            setInitialized(false);
          } else if (event === 'SIGNED_IN' && session) {
            // Don't re-check on SIGNED_IN if we just signed in
            // The checkAuth will be called by handleSignIn
            console.log('Signed in, skipping redundant check');
          } else if (event === 'TOKEN_REFRESHED' && session) {
            // Don't trigger checkAuth on token refresh, just log it
            console.log('Token refreshed silently');
          }
        });
        
        authSubscription = subscription;
      } catch (err) {
        console.error('Initialization error:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initialize();
    
    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    if (currentUser && !initialized) {
      initializeData();
    }
  }, [currentUser, initialized, initializeData]);

  async function handleSignIn() {
    await checkAuth();
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentElection(null);
    setAllElections([]);
    setEmployees([]);
    setInitialized(false);
    clearSessionCache();
  }

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const view = viewFromPath(window.location.pathname);
      setCurrentView(view);
      setVisitedViews(prev => new Set(prev).add(view));
      document.title = titleForView(view);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function handleNavigate(view: 'vote' | 'leaderboard' | 'admin' | 'profile') {
    setCurrentView(view);
    setVisitedViews(prev => new Set(prev).add(view));
    window.history.pushState({}, '', pathForView(view));
    document.title = titleForView(view);
  }

  async function handleVoteSubmitted() {
    // Refresh leaderboard data
    if (currentElection) {
      // Could refresh leaderboard here if needed
    }
  }

  async function handleElectionCreated() {
    await loadCurrentElection();
    await loadAllElections();
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading IQ Vote" />;
  }

  if (!currentUser) {
    return (
      <ThemeProvider>
        <AuthPage 
          onSignIn={handleSignIn} 
          error={authError}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Header
          user={currentUser}
          employees={employees}
          onSignOut={handleSignOut}
          onNavigate={handleNavigate}
          currentView={currentView}
        />
        
        <main id="main-content" role="main" className="overflow-x-hidden">
          {visitedViews.has('vote') && (
            <div style={{ display: currentView === 'vote' ? '' : 'none' }}>
              <VotingPage
                currentUser={currentUser}
                election={currentElection}
                employees={employees}
                onVoteSubmitted={handleVoteSubmitted}
              />
            </div>
          )}

          {visitedViews.has('leaderboard') && (
            <div style={{ display: currentView === 'leaderboard' ? '' : 'none' }}>
              <LeaderboardPage
                currentUser={currentUser}
                election={currentElection}
                elections={allElections}
              />
            </div>
          )}

          {visitedViews.has('admin') && currentUser.is_admin && (
            <div style={{ display: currentView === 'admin' ? '' : 'none' }}>
              <AdminPage
                currentUser={currentUser}
                onElectionCreated={handleElectionCreated}
              />
            </div>
          )}

          {visitedViews.has('profile') && (
            <div style={{ display: currentView === 'profile' ? '' : 'none' }}>
              <ProfilePage
                currentUser={currentUser}
                employees={employees}
                onProfileUpdated={(updated) => {
                  setCurrentUser(updated);
                  loadEmployees();
                }}
              />
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}