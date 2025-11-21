"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import NextLink from "next/link";

import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { RollingText } from "@/components/ui/shadcn-io/rolling-text";

export const Navbar = () => {
  const { theme, resolvedTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      const isScrolled = window.scrollY > 15;

      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [scrolled]);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Dispatch custom event to reset app
    window.dispatchEvent(new CustomEvent("resetApp"));
  };

  // Use resolvedTheme to avoid hydration mismatch, default to dark if not yet resolved

  return (
    <HeroUINavbar
      className={`backdrop-blur-md fixed mx-auto right-0 left-0 mt-2 sm:w-10/12 md:w-3/5 lg:w-3/5 xl:w-3/5 2xl:w-2/5 rounded-2xl shadow-lg bg-background`}
      maxWidth="xl"
      position="sticky"
    >
      <NavbarContent className="basis-1/5 sm:basis-full px-4" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink
            className="flex justify-start items-center gap-1 group relative w-32 overflow-hidden"
            href="/"
            onClick={handleLogoClick}
          >
            <div className="absolute left-0 transition-all duration-300 group-hover:left-8 z-10">
              <Logo />
            </div>
            <RollingText
              className="font-bold text-inherit overflow-hidden whitespace-nowrap relative ml-7 transition-all duration-300 group-hover:-translate-x-full group-hover:opacity-0"
              text="QUANT"
              autoTrigger={true}
              autoTriggerInterval={100000}
            />
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-auto"
        justify="end"
      >
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};
