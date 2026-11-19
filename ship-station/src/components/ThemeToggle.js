"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconButton, Tooltip } from "@radix-ui/themes";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <Tooltip content={label}>
      <IconButton variant="ghost" color="gray" size="2" aria-label={label} onClick={() => setTheme(dark ? "light" : "dark")}>
        {dark ? <SunIcon width="17" height="17" /> : <MoonIcon width="17" height="17" />}
      </IconButton>
    </Tooltip>
  );
}
