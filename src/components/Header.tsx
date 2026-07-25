import { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
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

  // Escape closes whichever layer is open — a floating bar that traps you is
  // worse than a docked one.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setBellOpen(false);
      setIsMobileMenuOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
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

  /** Shared control styling for the round icon buttons flanking the nav. */
  const iconButton =
    'w-9 h-9 rounded-full border border-border bg-card text-foreground grid place-items-center ' +
    'transition-[background-color,box-shadow,transform] duration-200 hover:bg-accent ' +
    'hover:shadow-e1 active:scale-95';

  return (
    <>
      {/* Keyboard users shouldn't have to tab the whole nav to reach the page. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-e2"
      >
        Skip to content
      </a>

      {/* The bar floats in a gutter rather than spanning edge to edge. The
          wrapper is click-through so the gutter never eats a click. */}
      <div className="sticky top-0 z-50 px-3 sm:px-5 pt-3 sm:pt-4 pb-1 pointer-events-none">
        <header
          className={`pointer-events-auto max-w-7xl mx-auto border border-border glass-chrome transition-[border-radius] duration-300 ${
            isMobileMenuOpen ? 'rounded-3xl' : 'rounded-full'
          }`}
          role="banner"
        >
          <div className="px-3 sm:px-4">
            <div className="flex h-14 items-center gap-4 lg:gap-8">
              {/* Brand */}
              <button
                className="flex items-center gap-2.5 shrink-0 rounded-full pl-1.5 pr-2 py-1 transition-opacity duration-200 hover:opacity-80"
                onClick={() => user && onNavigate('vote')}
                aria-label="IQ Vote home"
              >
                <img src={logoImage} alt="" className="w-7 h-7 object-contain" aria-hidden="true" />
                <span className="text-[15px] font-semibold tracking-tight text-foreground">IQ Vote</span>
              </button>

              {user && (
                <>
                  {/* Desktop navigation. No inner border — the floating bar is
                      already the container; the active pill carries the state. */}
                  <nav
                    className="hidden lg:flex items-center gap-1"
                    role="navigation"
                    aria-label="Main navigation"
                  >
                    {navItems.map(({ key, label }) => {
                      const isActive = currentView === key;
                      return (
                        <button
                          key={key}
                          onClick={() => onNavigate(key)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`h-9 px-4 rounded-full text-sm font-medium transition-[color,background-color,box-shadow] duration-200 ${
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-e1'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </nav>

                  {/* Desktop actions */}
                  <div className="hidden lg:flex items-center gap-2.5 ml-auto">
                    {currentElection && (
                      <div ref={bellRef} className="relative">
                        <button
                          className={`relative ${iconButton}`}
                          onClick={() => setBellOpen(v => !v)}
                          aria-label="Election notification"
                          aria-expanded={bellOpen}
                        >
                          <Bell className="w-4 h-4" aria-hidden="true" />
                          <span
                            className="absolute top-1.5 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-card"
                            aria-hidden="true"
                          />
                        </button>

                        {bellOpen && (
                          <div className="absolute right-0 top-full mt-2.5 w-72 rounded-2xl border border-border bg-popover shadow-e3 z-50 p-4 origin-top-right animate-scale-in">
                            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Active Election</p>
                            <p className="font-semibold text-sm text-foreground mb-1">{currentElection.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Ends {new Date(currentElection.end_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <Button
                              size="sm"
                              className="w-full mt-4"
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
                      className="hidden xl:flex items-center gap-2 h-9 rounded-full border border-border bg-card pl-1 pr-3.5 transition-[background-color,box-shadow] duration-200 hover:bg-accent hover:shadow-e1"
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
                      className={`${iconButton} xl:w-auto xl:px-4 xl:gap-2 xl:grid-flow-col text-muted-foreground hover:text-foreground`}
                      onClick={onSignOut}
                      aria-label="Sign out of your account"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden xl:inline text-sm font-medium">Sign Out</span>
                    </button>
                  </div>

                  {/* Mobile actions — the theme control lives in the menu,
                      where it can carry labels instead of crowding the bar. */}
                  <div className="flex lg:hidden items-center gap-2 ml-auto">
                    <button
                      className={iconButton}
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      aria-label="Toggle menu"
                      aria-expanded={isMobileMenuOpen}
                    >
                      {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu */}
            {user && isMobileMenuOpen && (
              <div className="lg:hidden pb-4 pt-4 border-t border-border animate-fade-in">
                <div className="flex flex-col gap-1.5">
                  {/* User info — goes to profile */}
                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-border bg-card mb-2 w-full text-left transition-colors duration-200 hover:bg-accent"
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
                    <div className="rounded-2xl border border-border bg-card px-3.5 py-3 mb-1.5 shadow-e1">
                      <p className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-1.5">
                        <Bell className="w-3 h-3" aria-hidden="true" /> Active Election
                      </p>
                      <p className="text-sm font-medium text-foreground">{currentElection.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ends {new Date(currentElection.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <Button size="sm" className="w-full mt-3" onClick={() => handleNavigate('vote')}>
                        Vote Now →
                      </Button>
                    </div>
                  )}

                  {/* Navigation */}
                  {navItems.map(({ key, label }) => {
                    const isActive = currentView === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleNavigate(key)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`h-11 px-4 rounded-full text-left text-sm font-medium transition-colors duration-200 ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-e1'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}

                  {/* Theme — labelled here, where there's room for it */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <ThemeToggle variant="labeled" />
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={onSignOut}
                    className="h-11 px-4 rounded-full text-left text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground hover:bg-accent/60 flex items-center gap-2 mt-1.5"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
      </div>
    </>
  );
}
