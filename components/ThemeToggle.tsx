"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("arij.theme", next);
  }

  return (
    <button onClick={toggle} aria-label="Toggle dark mode" style={{ marginLeft: "auto" }}>
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
