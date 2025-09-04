import { useState } from "react";
import { 
  CheckSquare, 
  TrendingUp, 
  ChartLine, 
  Building,
  Clock,
  Users
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Sidebar, SidebarItem } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { BusinessRoleSelector } from "@/components/business-role-selector";
import { useBusinessRole } from "@/hooks/useBusinessRole";
import { TaskDashboard } from "@/components/task-center/task-dashboard";
import { ExperimentModal } from "@/components/modals/experiment-modal";
import type { Experiment } from "@/types/index";

type ActiveSection = "tasks" | "learning_path" | "progress" | "resources";

export default function SimplifiedStudentDashboard() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("tasks");
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const { user } = useAuth();
  const {
    hasSelectedRole,
    selectedRoleCode,
    selectBusinessRole,
    getCurrentRole,
    clearBusinessRole,
    getRoleStatus
  } = useBusinessRole();

  // 如果是学生且还没有选择业务角色，显示角色选择界面
  if (user && (user as any).role === "student" && !hasSelectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-6xl mx-auto">
          <BusinessRoleSelector
            userProductRole={(user as any).role}
            onRoleSelect={selectBusinessRole}
            selectedRoleCode={selectedRoleCode || undefined}
          />
        </div>
      </div>
    );
  }

  const currentRole = getCurrentRole();

  const renderTasksSection = () => (
    <TaskDashboard />
  );

  const renderLearningPathSection = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
          学习路径
        </h2>
        <p className="text-blue-700 dark:text-blue-300">
          按照推荐的学习顺序，逐步掌握跨境电商业务技能
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-medium">1</span>
            </div>
            <h3 className="font-semibold">前期准备阶段</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            完成企业资质备案、开通支付账户等前期准备工作
          </p>
          <div className="text-xs text-green-600 dark:text-green-400">
            ✓ 海关企业资质备案
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
              <span className="text-amber-600 dark:text-amber-400 font-medium">2</span>
            </div>
            <h3 className="font-semibold">订单处理阶段</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            处理客户订单，准备发货和申报材料
          </p>
          <div className="text-xs text-muted-foreground">
            需完成前期准备
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 font-medium">3</span>
            </div>
            <h3 className="font-semibold">物流配送阶段</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            协调物流、跟踪货物状态直到最终交付
          </p>
          <div className="text-xs text-muted-foreground">
            需完成订单处理
          </div>
        </div>
      </div>
    </div>
  );

  const renderProgressSection = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
          学习进度
        </h2>
        <p className="text-green-700 dark:text-green-300">
          跟踪您的学习成果和技能掌握情况
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">完成任务数</h3>
            <CheckSquare className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-2">1 / 3</div>
          <p className="text-sm text-muted-foreground">已完成33%的核心任务</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">学习时长</h3>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold mb-2">2.5h</div>
          <p className="text-sm text-muted-foreground">本周累计学习时长</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">技能等级</h3>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold mb-2">初级</div>
          <p className="text-sm text-muted-foreground">继续学习提升技能等级</p>
        </div>
      </div>
    </div>
  );

  const renderResourcesSection = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-2">
          学习资源
        </h2>
        <p className="text-purple-700 dark:text-purple-300">
          查看操作指南、常见问题和帮助文档
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">操作指南</h3>
          <p className="text-sm text-muted-foreground mb-4">
            详细的操作步骤和最佳实践
          </p>
          <Button variant="outline" className="w-full">
            查看指南
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">常见问题</h3>
          <p className="text-sm text-muted-foreground mb-4">
            常见问题解答和故障排除
          </p>
          <Button variant="outline" className="w-full">
            查看FAQ
          </Button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "tasks": return renderTasksSection();
      case "learning_path": return renderLearningPathSection();
      case "progress": return renderProgressSection();
      case "resources": return renderResourcesSection();
      default: return renderTasksSection();
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <div className="flex h-screen">
        <Sidebar>
          {/* Role Status */}
          {currentRole && (
            <div className="p-4 mb-4 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">当前扮演角色</div>
              <div className="text-sm font-semibold">{currentRole.roleName}</div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs h-6 px-2"
                onClick={clearBusinessRole}
                data-testid="button-change-role"
              >
                切换角色
              </Button>
            </div>
          )}
          
          <SidebarItem
            icon={<CheckSquare />}
            label="实训任务"
            active={activeSection === "tasks"}
            onClick={() => setActiveSection("tasks")}
            data-testid="sidebar-tasks"
          />
          <SidebarItem
            icon={<TrendingUp />}
            label="学习路径"
            active={activeSection === "learning_path"}
            onClick={() => setActiveSection("learning_path")}
            data-testid="sidebar-learning-path"
          />
          <SidebarItem
            icon={<ChartLine />}
            label="学习进度"
            active={activeSection === "progress"}
            onClick={() => setActiveSection("progress")}
            data-testid="sidebar-progress"
          />
          <SidebarItem
            icon={<Building />}
            label="学习资源"
            active={activeSection === "resources"}
            onClick={() => setActiveSection("resources")}
            data-testid="sidebar-resources"
          />
        </Sidebar>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Experiment Modal */}
      <ExperimentModal
        open={!!selectedExperiment}
        onOpenChange={(open) => !open && setSelectedExperiment(null)}
        experiment={selectedExperiment}
      />
    </div>
  );
}