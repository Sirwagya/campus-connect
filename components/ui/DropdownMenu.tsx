"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface DropdownMenuContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<
  DropdownMenuContextType | undefined
>(undefined);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left" ref={menuRef}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const context = React.useContext(DropdownMenuContext);
  if (!context)
    throw new Error("DropdownMenuTrigger must be used within DropdownMenu");

  return (
    <div
      onClick={() => context.setIsOpen(!context.isOpen)}
      className="cursor-pointer"
    >
      {children}
    </div>
  );
}

export function DropdownMenuContent({
  children,
  align = "right",
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "end";
  className?: string;
}) {
  const context = React.useContext(DropdownMenuContext);
  if (!context)
    throw new Error("DropdownMenuContent must be used within DropdownMenu");

  if (!context.isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -5 }}
        transition={{ duration: 0.1 }}
        className={cn(
          "absolute z-50 mt-2 min-w-[8rem] rounded-md shadow-lg bg-[#18181B] border border-white/10 ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden",
          align === "right" || align === "end"
            ? "right-0 origin-top-right"
            : "left-0 origin-top-left",
          className
        )}
      >
        <div className="py-1" role="menu" aria-orientation="vertical">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  className?: string;
  variant?: "default" | "destructive";
}) {
  const context = React.useContext(DropdownMenuContext);

  return (
    <button
      className={cn(
        "block w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer",
        "hover:bg-white/5 text-gray-200",
        variant === "destructive" &&
          "text-red-400 hover:text-red-300 hover:bg-red-400/10",
        className
      )}
      role="menuitem"
      onClick={(e) => {
        onClick?.(e);
        context?.setIsOpen(false);
      }}
    >
      {children}
    </button>
  );
}
