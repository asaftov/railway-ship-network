"use client";

import { ThemeProvider } from "next-themes";

// The app opens in the dark theme, like railway.com. The switch in the top bar changes it.
export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
