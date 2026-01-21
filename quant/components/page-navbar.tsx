"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/contexts/auth-context";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Logo } from "@/components/icons";
import { GalleryVerticalEnd, Layers, TextAlignJustify, LayoutGrid } from "lucide-react";
import { SignInModal } from "@/components/sign-in-modal";

export function PageNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentView, setCurrentView] = useState<string | null>(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // Check current view from localStorage
  useEffect(() => {
    const checkView = () => {
      if (typeof window !== "undefined") {
        const view = localStorage.getItem("quant-view");
        setCurrentView(view);
      }
    };

    checkView();
    // Check periodically in case localStorage changes
    const interval = setInterval(checkView, 100);
    return () => clearInterval(interval);
  }, []);

  // Hide navbar when dashboard is visible or on settings page
  if (
    (currentView === "dashboard" && pathname === "/") ||
    pathname === "/settings" ||
    pathname === "/portfolio"
  ) {
    return null;
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(
      new CustomEvent("navigateView", { detail: "landing" }),
    );
  };

  const handleAboutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("navigateView", { detail: "about" }));
  };

  const handleIntelligenceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(
      new CustomEvent("navigateView", { detail: "intelligence" }),
    );
  };

  function PortfolioButton({
    router,
  }: {
    router: ReturnType<typeof useRouter>;
  }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        className={`relative flex items-center cursor-pointer ${isHovered ? "mix-blend-normal" : "mix-blend-difference"}`}
        onClick={() => router.push("/portfolio")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center overflow-hidden">
          <span
            className={`text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-all duration-300 ease-out ${
              isHovered
                ? "max-w-[120px] opacity-100 mr-2 text-black"
                : "max-w-0 opacity-0 text-white/80"
            }`}
          >
            Portfolio
          </span>
        </div>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 border ${
            isHovered
              ? "bg-white/95 text-black border-transparent rotate-90"
              : "bg-transparent border-white/30 text-white/80"
          }`}
        >
          <GalleryVerticalEnd size={14} className="transition-colors" />
        </div>
      </div>
    );
  }

  function StrategiesButton({
    router,
  }: {
    router: ReturnType<typeof useRouter>;
  }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        className={`relative flex items-center cursor-pointer ${isHovered ? "mix-blend-normal" : "mix-blend-difference"}`}
        onClick={() => router.push("/strategies")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center overflow-hidden">
          <span
            className={`text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-all duration-300 ease-out ${
              isHovered
                ? "max-w-[120px] opacity-100 mr-2 text-black"
                : "max-w-0 opacity-0 text-white/80"
            }`}
          >
            Strategies
          </span>
        </div>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 border ${
            isHovered
              ? "bg-white/95 text-black border-transparent"
              : "bg-transparent border-white/30 text-white/80"
          }`}
        >
          <LayoutGrid size={14} className="transition-colors" />
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Blog", href: "#", onClick: undefined },
    { name: "Intelligence", href: "#", onClick: handleIntelligenceClick },
    { name: "About", href: "#", onClick: handleAboutClick },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full p-8 grid grid-cols-2 md:grid-cols-3 items-center z-50 text-white/90 pointer-events-none">
      <div className="pointer-events-auto mix-blend-difference">
        <a
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Logo size={20} className="text-white" />
          <span className="text-sm tracking-[0.2em] uppercase font-medium">
            Quant
          </span>
        </a>
      </div>

      <div className="hidden md:flex gap-8 text-xs tracking-[0.2em] uppercase font-medium pointer-events-auto justify-center mix-blend-difference">
        {navItems.map((item) => {
          const isActive =
            (item.name === "Blog" && currentView === "blog") ||
            (item.name === "About" && currentView === "about") ||
            (item.name === "Intelligence" && currentView === "intelligence");
          return (
            <a
              key={item.name}
              href={item.href}
              onClick={item.onClick}
              className="hover:text-amber-200 transition-colors duration-300 relative group cursor-pointer"
            >
              {item.name}
              <span
                className={`absolute -bottom-2 left-0 h-[1px] bg-amber-200 transition-all duration-300 ${
                  isActive ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </a>
          );
        })}
      </div>

      <div className="pointer-events-auto flex justify-end items-center gap-3">
        {status === "authenticated" && session?.user ? (
          <>
            <StrategiesButton router={router} />
            <PortfolioButton router={router} />
            <button
              onClick={() => router.push("/settings")}
              className="flex items-center gap-3 px-3 py-1.5 border border-white/30 rounded-full hover:bg-white/95 hover:text-black hover:mix-blend-normal hover:border-transparent transition-all duration-300 group mix-blend-difference"
            >
              <Avatar
                src={session.user.image || undefined}
                name={session.user.name || "User"}
                size="sm"
                className="w-8 h-8 border border-white/30 group-hover:border-black/30"
                showFallback
                fallback={
                  <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-semibold">
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                }
              />
              <span className="text-xs uppercase tracking-widest text-white/80 group-hover:text-black transition-colors">
                Profile
              </span>
            </button>
          </>
        ) : (
          <>
            {/* Stack icon for mobile */}
            <Button
              isIconOnly
              className="md:hidden w-10 h-10 border border-white/30 rounded-full text-white hover:bg-white/95 hover:text-black hover:mix-blend-normal hover:border-transparent transition-all duration-300 bg-transparent mix-blend-difference"
              variant="bordered"
              radius="full"
            >
              <TextAlignJustify size={18} />
            </Button>
            {/* Launch Terminal button for desktop */}
            <Button
              className="hidden md:flex px-6 py-2 border border-white/30 rounded-full text-xs uppercase tracking-widest text-white hover:bg-white/95 hover:text-black hover:mix-blend-normal hover:border-transparent transition-all duration-300 bg-transparent mix-blend-difference"
              variant="bordered"
              radius="full"
              onPress={() => setIsSignInOpen(true)}
            >
              Launch Terminal
            </Button>
          </>
        )}
      </div>

      {/* Sign In Modal */}
      <SignInModal isOpen={isSignInOpen} onOpenChange={setIsSignInOpen} />
    </nav>
  );
}
