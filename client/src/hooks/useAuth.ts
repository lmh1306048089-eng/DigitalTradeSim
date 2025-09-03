import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { setAuthTokens, getAuthTokens, clearAuthTokens, isUnauthorizedError } from "@/lib/auth";
import type { User, LoginCredentials, RegisterData } from "@/types";

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tokens = getAuthTokens();
  const hasValidToken = !!tokens.accessToken;

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    enabled: hasValidToken,
  });

  // Clear tokens immediately on 401 error
  if (error && error.message.includes("401")) {
    clearAuthTokens();
    window.location.reload(); // Force a page reload to reset state
  }

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
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
    mutationFn: async (userData: RegisterData) => {
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
