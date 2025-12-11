import { useState, useEffect, useRef } from 'react';
import { ChevronDown, LogOut, Moon, Sun, Menu, X, User, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { Employee } from '../types';
import logoImageLight from 'figma:asset/adf5897e345947bbe763382a76a190054bc17e88.png';
import logoImageDark from 'figma:asset/edd81dc1188a78ee35f46489ff2f13306860893c.png';

interface HeaderProps {
  user: Employee | null;
  currentView: 'vote' | 'leaderboard' | 'admin' | 'history';
  onNavigate: (view: 'vote' | 'leaderboard' | 'admin' | 'history') => void;
  onSignOut: () => void;
}

export function Header({ user, currentView, onNavigate, onSignOut }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const handleNavigate = (view: 'vote' | 'leaderboard' | 'admin' | 'history') => {
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
                    variant={currentView === 'history' ? 'default' : 'ghost'}
                    onClick={() => onNavigate('history')}
                    aria-current={currentView === 'history' ? 'page' : undefined}
                    size="sm"
                    className="rounded-full"
                  >
                    My History
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
                  <ThemeToggle />
                  
                  <div className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-muted/50 ml-1" aria-label="Current user information">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20" aria-hidden="true">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium leading-none mb-0.5" id="user-name">{user.name}</div>
                      <div className="text-xs text-muted-foreground leading-none" id="user-role">{user.role}</div>
                    </div>
                  </div>
                  
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
              {/* User Info */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.role}</div>
                </div>
              </div>

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
                variant={currentView === 'history' ? 'default' : 'ghost'}
                onClick={() => handleNavigate('history')}
                className="justify-start"
              >
                My History
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