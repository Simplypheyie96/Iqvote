// IQ Vote ships dark-only — the brand theme. Applied before React renders
// so there is never a light flash.
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
