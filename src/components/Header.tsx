import { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Employee } from '../types';
import logoImage from 'figma:asset/edd81dc1188a78ee35f46489ff2f13306860893c.png';

import { Election } from '../types';

interface HeaderProps {
  user: Employee | null;
  employees: Employee[];
  currentElection: Election | null;
  currentView: 'vote' | 'leaderboard' | 'admin' | 'profile';
  onNavigate: (view: 'vote' | 'leaderboard' | 'admin' | 'profile') => void;
  onSignOut: () => void;
}

type View = HeaderProps['currentView'];

export function Header({ user, employees, currentElection, currentView, onNavigate, onSignOut }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  const initials = user
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '';

  const handleNavigate = (view: View) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const navItems: { key: View; label: string }[] = [
    { key: 'vote', label: 'Vote' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'profile', label: 'Profile' },
    ...(user?.is_admin ? ([{ key: 'admin' as View, label: 'Admin' }]) : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center gap-6 lg:gap-10">
          {/* Brand */}
          <button
            className="flex items-center gap-2.5 shrink-0"
            onClick={() => user && onNavigate('vote')}
            aria-label="IQ Vote home"
          >
            <img src={logoImage} alt="" className="w-8 h-8 object-contain" aria-hidden="true" />
            <h1 className="text-[15px] font-semibold tracking-tight text-foreground">IQ Vote</h1>
          </button>

          {user && (
            <>
              {/* Desktop navigation — boxed tab/pill group with breathing room */}
              <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full border border-border bg-card" role="navigation" aria-label="Main navigation">
                {navItems.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => onNavigate(key)}
                    aria-current={currentView === key ? 'page' : undefined}
                    className={`h-9 px-3.5 rounded-full text-sm font-medium transition-colors ${
                      currentView === key
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>

              {/* Desktop actions — one bordered family, generous gaps */}
              <div className="hidden lg:flex items-center gap-3 ml-auto">
                {currentElection && (
                  <div ref={bellRef} className="relative">
                    <button
                      className="relative w-9 h-9 rounded-full border border-border bg-card grid place-items-center text-foreground hover:bg-accent transition-colors"
                      onClick={() => setBellOpen(v => !v)}
                      aria-label="Election notification"
                    >
                      <Bell className="w-4 h-4" aria-hidden="true" />
                      <span className="absolute top-1.5 right-2 w-2 h-2 bg-primary rounded-full" aria-hidden="true" />
                    </button>

                    {bellOpen && (
                      <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-popover shadow-lg z-50 p-4 origin-top-right animate-scale-in">
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

                <button
                  className="hidden xl:flex items-center gap-2 h-9 rounded-full border border-border bg-card pl-1 pr-3 hover:bg-accent transition-colors"
                  onClick={() => onNavigate('profile')}
                  aria-label="Go to your profile"
                >
                  <span className="w-7 h-7 rounded-full bg-muted overflow-hidden grid place-items-center text-[10px] font-semibold text-muted-foreground" aria-hidden="true">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      initials
                    )}
                  </span>
                  <span className="text-sm font-medium">{user.name}</span>
                </button>

                <button
                  className="h-9 rounded-full border border-border bg-card px-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  onClick={onSignOut}
                  aria-label="Sign out of your account"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="flex lg:hidden items-center ml-auto">
                <button
                  className="w-9 h-9 rounded-full border border-border bg-card grid place-items-center"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile menu */}
        {user && isMobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-border/60 pt-4">
            <div className="flex flex-col gap-1.5">
              {/* User info — goes to profile */}
              <button
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card mb-2 w-full text-left hover:bg-accent transition-colors"
                onClick={() => handleNavigate('profile')}
                aria-label="Go to your profile"
              >
                <span className="w-9 h-9 rounded-full bg-muted grid place-items-center overflow-hidden flex-shrink-0 text-xs font-semibold text-muted-foreground">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    initials
                  )}
                </span>
                <span>
                  <span className="block text-sm font-medium">{user.name}</span>
                  <span className="block text-xs text-muted-foreground">{user.role}</span>
                </span>
              </button>

              {/* Active election banner */}
              {currentElection && (
                <div className="rounded-xl border border-border bg-card px-3 py-2.5 mb-1">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-1">
                    <Bell className="w-3 h-3" aria-hidden="true" /> Active Election
                  </p>
                  <p className="text-sm font-medium text-foreground">{currentElection.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ends {new Date(currentElection.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <Button size="sm" className="w-full mt-2.5" onClick={() => handleNavigate('vote')}>
                    Vote Now →
                  </Button>
                </div>
              )}

              {/* Navigation */}
              {navItems.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleNavigate(key)}
                  aria-current={currentView === key ? 'page' : undefined}
                  className={`h-10 px-3.5 rounded-xl text-left text-sm font-medium transition-colors ${
                    currentView === key ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  {label}
                </button>
              ))}

              {/* Sign out */}
              <button
                onClick={onSignOut}
                className="h-10 px-3.5 rounded-xl text-left text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-2 mt-1.5"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
