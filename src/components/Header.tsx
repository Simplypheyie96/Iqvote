import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Bell, ChevronRight, LogOut } from 'lucide-react';
import { Employee } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from './ThemeProvider';
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

type View = HeaderProps['currentView'];

/* Heavy, no-overshoot curve. Matches --ease-fluid in index.css. */
const FLUID = 'ease-[cubic-bezier(0.32,0.72,0,1)]';

export function Header({ user, employees, currentElection, currentView, onNavigate, onSignOut }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { resolvedTheme } = useTheme();
  const logoImage = resolvedTheme === 'dark' ? logoImageDark : logoImageLight;

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

  // The glass only switches on once the page has actually scrolled, because
  // that's the only time there is content underneath for it to refract. A
  // 1px sentinel above the bar reports this without a scroll listener.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Escape closes whichever layer is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setBellOpen(false);
      setIsMobileMenuOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Hold the page still while the menu sheet is over it.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isMobileMenuOpen]);

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

  const avatar = (size: string, text: string) => (
    <span className={`${size} rounded-full bg-muted overflow-hidden grid place-items-center ${text} font-semibold text-muted-foreground shrink-0`} aria-hidden="true">
      {avatarSrc ? (
        <img src={avatarSrc} alt="" className="w-full h-full object-cover" onError={() => setImageError(true)} />
      ) : (
        initials
      )}
    </span>
  );

  return (
    <>
      {/* Invisible until focused — lets keyboard users jump past the nav. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-full focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />

      <header
        className={`sticky top-0 z-50 transition-[background-color,box-shadow] duration-500 ${FLUID} ${
          scrolled || isMobileMenuOpen ? 'glass-bar glass-hairline' : 'bg-transparent hairline-soft'
        }`}
        role="banner"
      >
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
                {/* Desktop navigation — segmented control. The track is inset,
                    the selected tab is a raised surface. Selection is carried
                    by four neutral signals at once (surface, hairline, text
                    colour, weight) rather than an accent outline: the light
                    pink is 2.85:1 on white, so as a border it would be
                    decoration that some people simply can't see. */}
                <nav
                  className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-muted/70 inset-ring-1 inset-ring-border/60"
                  role="navigation"
                  aria-label="Main navigation"
                >
                  {navItems.map(({ key, label }) => {
                    const active = currentView === key;
                    return (
                      <button
                        key={key}
                        onClick={() => onNavigate(key)}
                        aria-current={active ? 'page' : undefined}
                        className={`h-9 px-4 rounded-full text-sm transition-[background-color,color,box-shadow] duration-300 ${FLUID} ${
                          active
                            ? 'bg-background text-foreground font-semibold inset-ring-1 inset-ring-border shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                            : 'text-muted-foreground font-medium hover:text-foreground'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </nav>

                {/* Desktop actions — one bordered family, generous gaps */}
                <div className="hidden lg:flex items-center gap-3 ml-auto">
                  {currentElection && (
                    <div ref={bellRef} className="relative">
                      <button
                        className={`relative w-9 h-9 rounded-full border border-border bg-card grid place-items-center text-foreground hover:bg-accent transition-colors duration-200 ${FLUID}`}
                        onClick={() => setBellOpen(v => !v)}
                        aria-label="Election notification"
                        aria-expanded={bellOpen}
                      >
                        <Bell className="w-4 h-4" aria-hidden="true" />
                        <span className="absolute top-1.5 right-2 w-2 h-2 bg-primary rounded-full" aria-hidden="true" />
                      </button>

                      {bellOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border bg-popover shadow-e2 z-50 p-4 origin-top-right animate-scale-in">
                          <p className="text-[10px] font-semibold text-primary uppercase tracking-[0.18em] mb-2">Active election</p>
                          <p className="font-semibold text-sm text-foreground mb-1">{currentElection.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Ends {new Date(currentElection.end_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <button
                            className={`group mt-4 w-full h-11 rounded-full bg-primary text-primary-foreground pl-5 pr-1.5 flex items-center justify-between text-sm font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)] transition-colors duration-200 ${FLUID} hover:bg-primary/90 active:scale-[0.98]`}
                            onClick={() => { onNavigate('vote'); setBellOpen(false); }}
                          >
                            <span>Vote now</span>
                            <span className={`w-8 h-8 rounded-full bg-white/20 grid place-items-center transition-transform duration-300 ${FLUID} group-hover:translate-x-0.5`}>
                              <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <ThemeToggle />

                  <button
                    className={`hidden xl:flex items-center gap-2 h-9 rounded-full border border-border bg-card pl-1 pr-3 hover:bg-accent transition-colors duration-200 ${FLUID}`}
                    onClick={() => onNavigate('profile')}
                    aria-label="Go to your profile"
                  >
                    {avatar('w-7 h-7', 'text-[10px]')}
                    <span className="text-sm font-medium">{user.name}</span>
                  </button>

                  <button
                    className={`h-9 rounded-full border border-border bg-card px-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 ${FLUID}`}
                    onClick={onSignOut}
                    aria-label="Sign out of your account"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>

                {/* Mobile menu button — the two bars rotate into an X rather
                    than swapping for a different icon. */}
                <div className="flex lg:hidden items-center ml-auto">
                  <button
                    className="relative w-10 h-10 rounded-full border border-border bg-card grid place-items-center"
                    onClick={() => setIsMobileMenuOpen(v => !v)}
                    aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isMobileMenuOpen}
                  >
                    <span className="relative block w-4 h-3" aria-hidden="true">
                      <span
                        className={`absolute left-0 block h-[1.5px] w-4 rounded-full bg-foreground transition-transform duration-[400ms] ${FLUID} ${
                          isMobileMenuOpen ? 'top-[5px] rotate-45' : 'top-0'
                        }`}
                      />
                      <span
                        className={`absolute left-0 block h-[1.5px] w-4 rounded-full bg-foreground transition-transform duration-[400ms] ${FLUID} ${
                          isMobileMenuOpen ? 'top-[5px] -rotate-45' : 'top-[10px]'
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile menu — a full-bleed glass sheet under the bar, not a list
          crammed into the header. */}
      {user && isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 glass-sheet overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="px-5 pt-6 pb-12 flex flex-col gap-8">
            {/* Who you are. Nested enclosure so it reads as the one object
                on the sheet rather than another row in a list. */}
            <div className="animate-menu-row rounded-[1.75rem] bg-muted p-1.5 inset-ring-1 inset-ring-border/70">
              <button
                className={`group w-full flex items-center gap-4 rounded-[1.375rem] bg-background px-4 py-4 text-left inset-ring-1 inset-ring-border/60 transition-colors duration-300 ${FLUID} hover:bg-accent`}
                onClick={() => handleNavigate('profile')}
                aria-label="Go to your profile"
              >
                {avatar('w-11 h-11', 'text-sm')}
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-foreground truncate">{user.name}</span>
                  <span className="block text-[13px] text-muted-foreground truncate">{user.role}</span>
                </span>
                <span className={`ml-auto w-8 h-8 shrink-0 rounded-full bg-muted grid place-items-center text-muted-foreground transition-transform duration-300 ${FLUID} group-hover:translate-x-0.5`}>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </span>
              </button>
            </div>

            {/* Active election */}
            {currentElection && (
              <div className="animate-menu-row" style={{ animationDelay: '60ms' }}>
                <p className="px-1 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Active election
                </p>
                <div className="rounded-[1.5rem] border border-border bg-card px-5 py-5">
                  <p className="flex items-center gap-2 text-[13px] font-semibold text-primary">
                    <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                    Voting is open
                  </p>
                  <p className="mt-2.5 text-[15px] font-semibold text-foreground">{currentElection.title}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Ends {new Date(currentElection.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <button
                    className={`group mt-5 w-full h-12 rounded-full bg-primary text-primary-foreground pl-6 pr-1.5 flex items-center justify-between text-[15px] font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)] transition-colors duration-200 ${FLUID} hover:bg-primary/90 active:scale-[0.98]`}
                    onClick={() => handleNavigate('vote')}
                  >
                    <span>Vote now</span>
                    <span className={`w-9 h-9 rounded-full bg-white/20 grid place-items-center transition-transform duration-300 ${FLUID} group-hover:translate-x-0.5`}>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav
              className="animate-menu-row"
              style={{ animationDelay: '120ms' }}
              role="navigation"
              aria-label="Main navigation"
            >
              <p className="px-1 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Go to
              </p>
              <div className="flex flex-col gap-1.5">
                {navItems.map(({ key, label }) => {
                  const active = currentView === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleNavigate(key)}
                      aria-current={active ? 'page' : undefined}
                      className={`h-14 rounded-2xl px-4 flex items-center gap-3 text-left text-[15px] transition-colors duration-300 ${FLUID} ${
                        active
                          ? 'bg-card font-semibold text-foreground inset-ring-1 inset-ring-border'
                          : 'font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${active ? 'bg-primary' : 'bg-transparent'}`}
                        aria-hidden="true"
                      />
                      {label}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Theme — the only way to reach light mode on a phone */}
            <div className="animate-menu-row" style={{ animationDelay: '180ms' }}>
              <p className="px-1 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Appearance
              </p>
              <ThemeToggle variant="labeled" />
            </div>

            {/* Sign out */}
            <button
              onClick={onSignOut}
              style={{ animationDelay: '240ms' }}
              className={`animate-menu-row h-14 rounded-2xl px-4 flex items-center gap-3 text-left text-[15px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors duration-300 ${FLUID}`}
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
