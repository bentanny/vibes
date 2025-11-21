"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@heroui/button";
import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

export const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button isIconOnly variant="light" className="text-foreground">
        <MoonFilledIcon size={22} />
      </Button>
    );
  }

  return (
    <Button
      isIconOnly
      variant="light"
      className="text-foreground"
      onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <SunFilledIcon size={22} />
      ) : (
        <MoonFilledIcon size={22} />
      )}
    </Button>
  );
};
