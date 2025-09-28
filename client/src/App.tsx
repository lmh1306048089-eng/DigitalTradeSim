import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { getAuthTokens, clearAuthTokens } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@/types";
import LoginPage from "@/pages/login";
import SimplifiedStudentDashboard from "@/pages/simplified-student-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ExperimentDetailPage from "@/pages/experiment-detail";
import NotFound from "@/pages/not-found";
import CustomsDeclarationQuery from "@/pages/customs-declaration-query";
import DeclarationResultDetail from "@/pages/declaration-result-detail";
import { CustomsQualificationForm } from "@/components/customs/customs-qualification-form";
import { EnterpriseQualificationForm } from "@/components/enterprise/enterprise-qualification-form";
import { IcCardApplicationForm } from "@/components/customs/ic-card-application-form";
import { TransportIdForm } from "@/components/enterprise/transport-id-form";
import { CustomsDeclarationExportForm } from "@/components/declaration/customs-declaration-export-form";
import { WarehousePickingExperiment } from "@/components/warehouse/warehouse-picking-experiment";

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const tokens = getAuthTokens();
      if (!tokens.accessToken) {
        setIsLoading(false);
        return;
      }

      // Try to fetch user data
      const response = await apiRequest("GET", "/api/auth/me");
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      // If auth fails, clear tokens and show login
      clearAuthTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={checkAuth} />;
  }

  return (
    <Switch>
      {user.role === "student" && (
        <>
          <Route path="/" component={SimplifiedStudentDashboard} />
          <Route path="/experiments/:id" component={ExperimentDetailPage} />
          <Route path="/customs-qualification">
            <CustomsQualificationForm />
          </Route>
          <Route path="/enterprise-qualification">
            <EnterpriseQualificationForm />
          </Route>
          <Route path="/ic-card-application">
            <IcCardApplicationForm />
          </Route>
          <Route path="/transport-id-application">
            <TransportIdForm 
              onComplete={(data) => {
                console.log("传输ID申请完成:", data);
                // 返回主页
                window.location.href = "/";
              }}
              onCancel={() => {
                // 返回主页
                window.location.href = "/";
              }}
            />
          </Route>
          <Route path="/customs-declaration-export">
            <CustomsDeclarationExportForm 
              onComplete={(data, declarationId) => {
                console.log("报关单模式出口申报完成:", data);
                // 申报成功后跳转到结果详情页面
                if (declarationId) {
                  window.location.href = `/declaration-result/${declarationId}`;
                }
              }}
              onCancel={() => {
                // 返回主页
                window.location.href = "/";
              }}
            />
          </Route>
          <Route path="/customs-declaration-query">
            <CustomsDeclarationQuery />
          </Route>
          <Route path="/declaration-result/:id">
            <DeclarationResultDetail />
          </Route>
          <Route path="/warehouse-picking">
            <WarehousePickingExperiment />
          </Route>
        </>
      )}
      {user.role === "teacher" && (
        <Route path="/" component={TeacherDashboard} />
      )}
      {user.role === "admin" && (
        <Route path="/" component={AdminDashboard} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;