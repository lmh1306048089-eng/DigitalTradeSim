import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  children: ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
  return (
    <nav 
      className={cn("w-64 bg-card border-r border-border p-4", className)}
      data-testid="sidebar"
    >
      <div className="space-y-2">
        {children}
      </div>
    </nav>
  );
}

interface SidebarItemProps {
  icon: ReactNode;
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function SidebarItem({ icon, children, active, onClick, disabled }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3",
        active 
          ? "bg-primary text-primary-foreground" 
          : "hover:bg-muted",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      data-testid="sidebar-item"
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
