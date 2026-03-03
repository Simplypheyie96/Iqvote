import { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, Menu, X, User, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { Employee } from '../types';
import logoImageLight from 'figma:asset/adf5897e345947bbe763382a76a190054bc17e88.png';
import logoImageDark from 'figma:asset/edd81dc1188a78ee35f46489ff2f13306860893c.png';

import { Election } from '../types';

interface HeaderProps {
  user: Employee | null;
  employees: Employee[];
  currentElection: Election | null;
  currentView: 'vote' | 'leaderboard' | 'admin' | 'profile';
  onNavigate: (view: 'vote' | 'leaderboard' | 'admin' | 'profile') => void;
  onSignOut: () => void;
}

export function Header({ user, employees, currentElection, currentView, onNavigate, onSignOut }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Close bell dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use employee record image if available, fall back to user profile image
  const employeeRecord = user ? employees.find(e => e.email === user.email) : null;
  const avatarSrc = !imageError ? (employeeRecord?.image_url || user?.image_url || '') : '';

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

  const handleNavigate = (view: 'vote' | 'leaderboard' | 'admin' | 'profile') => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src={isDark ? logoImageDark : logoImageLight} 
                alt="IQ Vote Logo" 
                className="w-12 h-12 object-contain" 
                aria-hidden="true" 
              />
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              IQ Vote
            </h1>
          </div>
          
          {user && (
            <>
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-2">
                <nav className="flex items-center gap-1 p-1 rounded-full bg-muted/50" role="navigation" aria-label="Main navigation">
                  <Button
                    variant={currentView === 'vote' ? 'default' : 'ghost'}
                    onClick={() => onNavigate('vote')}
                    aria-current={currentView === 'vote' ? 'page' : undefined}
                    size="sm"
                    className="rounded-full"
                  >
                    Vote
                  </Button>
                  <Button
                    variant={currentView === 'leaderboard' ? 'default' : 'ghost'}
                    onClick={() => onNavigate('leaderboard')}
                    aria-current={currentView === 'leaderboard' ? 'page' : undefined}
                    size="sm"
                    className="rounded-full"
                  >
                    Leaderboard
                  </Button>
                  <Button
                    variant={currentView === 'profile' ? 'default' : 'ghost'}
                    onClick={() => onNavigate('profile')}
                    aria-current={currentView === 'profile' ? 'page' : undefined}
                    size="sm"
                    className="rounded-full gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    Profile
                  </Button>
                  {user?.is_admin && (
                    <Button
                      variant={currentView === 'admin' ? 'default' : 'ghost'}
                      onClick={() => onNavigate('admin')}
                      aria-current={currentView === 'admin' ? 'page' : undefined}
                      size="sm"
                      className="rounded-full gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Admin
                    </Button>
                  )}
                </nav>
                
                <div className="flex items-center gap-1">
                  {/* Notification bell */}
                  {currentElection && (
                    <div ref={bellRef} className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full w-9 h-9"
                        onClick={() => setBellOpen(v => !v)}
                        aria-label="Election notification"
                      >
                        <Bell className="w-5 h-5 text-foreground" />
                      </Button>
                      {/* Badge sits on the container, not inside the button */}
                      <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-background" />
                      </span>

                      {bellOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-card shadow-lg z-50 p-4">
                          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Active Election</p>
                          <p className="font-semibold text-sm text-foreground mb-1">{currentElection.title}</p>
                          <p className="text-xs text-muted-foreground mb-1">
                            Ends {new Date(currentElection.end_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <Button
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => { onNavigate('vote'); setBellOpen(false); }}
                          >
                            Vote Now →
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <ThemeToggle />
                  
                  <button
                    className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-muted/50 ml-1 hover:bg-muted/80 transition-colors cursor-pointer"
                    aria-label="Go to your profile"
                    onClick={() => onNavigate('profile')}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden flex-shrink-0" aria-hidden="true">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <span className="text-xs font-bold text-primary">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium leading-none mb-0.5" id="user-name">{user.name}</div>
                      <div className="text-xs text-muted-foreground leading-none" id="user-role">{user.role}</div>
                    </div>
                  </button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onSignOut} 
                    className="gap-2 rounded-full"
                    aria-label="Sign out of your account"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden xl:inline">Sign Out</span>
                  </Button>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex items-center gap-2 lg:hidden">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {user && isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-2 border-t border-border/40 pt-4">
            <div className="flex flex-col gap-2">
              {/* User Info - clickable to profile */}
              <button
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 mb-2 w-full text-left hover:bg-muted/80 transition-colors"
                onClick={() => handleNavigate('profile')}
                aria-label="Go to your profile"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden flex-shrink-0">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className="text-sm font-bold text-primary">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.role}</div>
                </div>
              </button>

              {/* Active election banner */}
              {currentElection && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 mb-1">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-1">
                    <Bell className="w-3 h-3" /> Active Election
                  </p>
                  <p className="text-sm font-medium text-foreground">{currentElection.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ends {new Date(currentElection.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <Button size="sm" className="w-full mt-2" onClick={() => handleNavigate('vote')}>
                    Vote Now →
                  </Button>
                </div>
              )}

              {/* Navigation */}
              <Button
                variant={currentView === 'vote' ? 'default' : 'ghost'}
                onClick={() => handleNavigate('vote')}
                className="justify-start"
              >
                Vote
              </Button>
              <Button
                variant={currentView === 'leaderboard' ? 'default' : 'ghost'}
                onClick={() => handleNavigate('leaderboard')}
                className="justify-start"
              >
                Leaderboard
              </Button>
              <Button
                variant={currentView === 'profile' ? 'default' : 'ghost'}
                onClick={() => handleNavigate('profile')}
                className="justify-start gap-2"
              >
                <User className="w-4 h-4" />
                Profile
              </Button>
              {user.is_admin && (
                <Button
                  variant={currentView === 'admin' ? 'default' : 'ghost'}
                  onClick={() => handleNavigate('admin')}
                  className="justify-start"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              
              {/* Sign Out */}
              <Button 
                variant="ghost" 
                onClick={onSignOut} 
                className="justify-start gap-2 mt-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}