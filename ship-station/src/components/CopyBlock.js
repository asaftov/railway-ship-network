"use client";

import { useState } from "react";
import { Button } from "@radix-ui/themes";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";

export default function CopyBlock({ text, label = "Copy" }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      setDone(false);
    }
  }
  return (
    <div className="copyblock">
      <pre>{text}</pre>
      <Button type="button" className="copy-btn" variant="surface" color="gray" highContrast size="1" onClick={copy}>
        {done ? <CheckIcon /> : <CopyIcon />}
        {done ? "Copied" : label}
      </Button>
    </div>
  );
}
