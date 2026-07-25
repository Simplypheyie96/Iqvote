"use client";

import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

import { useTheme } from "../ThemeProvider";

/**
 * Toasts follow the app's own theme. Sonner defaults to light, which read as a
 * bright card dropped onto a dark page. Elevation comes from the app's scale so
 * a toast sits at the same height as a dialog.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border-border !bg-popover !text-popover-foreground !shadow-e2",
          description: "!text-muted-foreground",
          actionButton: "!rounded-lg !bg-primary !text-primary-foreground",
          cancelButton: "!rounded-lg !bg-muted !text-muted-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
