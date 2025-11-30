"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { Button } from "./Button";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}

export function DropdownMenu({
  trigger,
  children,
  align = "right",
}: DropdownMenuProps) {
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
    <div className="relative inline-block text-left" ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-popover ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-100",
            align === "right"
              ? "right-0 origin-top-right"
              : "left-0 origin-top-left"
          )}
        >
          <div className="py-1" role="menu" aria-orientation="vertical">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  onClick: (e: any) => {
                    (child as React.ReactElement<any>).props.onClick?.(e);
                    setIsOpen(false);
                  },
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
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
  return (
    <button
      className={cn(
        "block w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
        variant === "destructive" &&
          "text-red-600 hover:text-red-700 hover:bg-red-50",
        className
      )}
      role="menuitem"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
