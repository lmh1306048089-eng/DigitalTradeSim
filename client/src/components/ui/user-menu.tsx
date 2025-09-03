import { useState } from "react";
import { ChevronDown, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProfileModal } from "@/components/modals/profile-modal";
import { useAuth } from "@/hooks/useAuth";
import { formatPhoneNumber } from "@/lib/auth";
import type { UserState } from "@/types";

interface UserMenuProps {
  user: UserState;
}

export function UserMenu({ user }: UserMenuProps) {
  const [showProfile, setShowProfile] = useState(false);
  const { logout } = useAuth();

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "student": return "bg-primary";
      case "teacher": return "bg-secondary";
      case "admin": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center space-x-2 hover:bg-muted"
            data-testid="user-menu-trigger"
          >
            <div className={`w-8 h-8 ${getRoleColor(user.role)} text-white rounded-full flex items-center justify-center font-medium text-sm`}>
              {getInitial(user.username)}
            </div>
            <span className="text-sm font-medium" data-testid="user-name">{user.username}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-medium" data-testid="user-menu-name">{user.username}</p>
            <p className="text-xs text-muted-foreground" data-testid="user-menu-phone">
              {formatPhoneNumber(user.phone)}
            </p>
          </div>

          <DropdownMenuItem 
            onClick={() => setShowProfile(true)}
            data-testid="user-menu-profile"
          >
            <Settings className="mr-2 h-4 w-4" />
            账号管理
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={logout}
            className="text-destructive focus:text-destructive"
            data-testid="user-menu-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal 
        open={showProfile} 
        onOpenChange={setShowProfile} 
        user={user} 
      />
    </>
  );
}
