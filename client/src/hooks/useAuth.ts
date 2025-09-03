import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { setAuthTokens, getAuthTokens, clearAuthTokens, isUnauthorizedError } from "@/lib/auth";
import type { UserState } from "@/types";

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!getAuthTokens().accessToken, // Only query if there's an access token
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { phone: string; password: string; role: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return res.json();
    },
    onSuccess: (data) => {
      setAuthTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "登录成功",
        description: "欢迎回到数字贸易实训系统",
      });
    },
    onError: (error) => {
      toast({
        title: "登录失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: { phone: string; password: string; username: string; role: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      return res.json();
    },
    onSuccess: (data) => {
      setAuthTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "注册成功",
        description: "欢迎加入数字贸易实训系统",
      });
    },
    onError: (error) => {
      toast({
        title: "注册失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const refreshTokenMutation = useMutation({
    mutationFn: async () => {
      const { refreshToken } = getAuthTokens();
      if (!refreshToken) throw new Error("No refresh token");
      
      const res = await apiRequest("POST", "/api/auth/refresh", { refreshToken });
      return res.json();
    },
    onSuccess: (data) => {
      setAuthTokens(data.accessToken, data.refreshToken);
    },
    onError: () => {
      logout();
    },
  });

  const logout = () => {
    clearAuthTokens();
    queryClient.clear();
    toast({
      title: "已退出登录",
      description: "感谢使用数字贸易实训系统",
    });
  };

  // Auto-refresh token when it expires
  const handleUnauthorizedError = (error: Error) => {
    if (isUnauthorizedError(error)) {
      const { refreshToken } = getAuthTokens();
      if (refreshToken) {
        refreshTokenMutation.mutate();
      } else {
        logout();
      }
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    handleUnauthorizedError,
  };
}
