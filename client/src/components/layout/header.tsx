import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/ui/user-menu";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
}

export function Header({ title = "数字贸易实训系统", children }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-card border-b border-border px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Globe className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold" data-testid="header-title">{title}</h1>
        </div>

        <div className="flex items-center space-x-4">
          {children}
          {user && <UserMenu user={user} />}
        </div>
      </div>
    </header>
  );
}
