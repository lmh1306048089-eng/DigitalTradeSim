import { useState } from "react";
import { 
  Building2, 
  Shield, 
  Warehouse,
  Home,
  Plane,
  MapPin
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Sidebar, SidebarItem } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { BusinessRoleSelector } from "@/components/business-role-selector";
import { useBusinessRole } from "@/hooks/useBusinessRole";
import { SCENES, BUSINESS_ROLE_CONFIGS } from "@shared/business-roles";
import { useLocation } from "wouter";

type ActiveSection = "overview" | "enterprise_scene" | "customs_scene" | "customs_supervision_scene" | "overseas_warehouse_scene" | "buyer_home_scene";

export default function SimplifiedStudentDashboard() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");
  const [, setLocation] = useLocation();
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

  // 检查当前角色是否可以访问某个场景
  const canAccessScene = (sceneCode: string) => {
    if (!currentRole) return false;
    return BUSINESS_ROLE_CONFIGS[currentRole.roleCode]?.availableScenes.includes(sceneCode) || false;
  };

  // 场景配置
  const sceneConfigs = [
    {
      code: SCENES.ENTERPRISE,
      name: "电商企业",
      description: "跨境电商企业操作场景",
      icon: <Building2 className="h-5 w-5" />,
      color: "bg-blue-500"
    },
    {
      code: SCENES.CUSTOMS,
      name: "海关办事处", 
      description: "海关审核与监管场景",
      icon: <Shield className="h-5 w-5" />,
      color: "bg-green-500"
    },
    {
      code: SCENES.CUSTOMS_SUPERVISION,
      name: "海关监管作业场所",
      description: "海关监管作业操作场景", 
      icon: <Warehouse className="h-5 w-5" />,
      color: "bg-orange-500"
    },
    {
      code: SCENES.OVERSEAS_WAREHOUSE,
      name: "海外仓库",
      description: "海外仓储与物流场景",
      icon: <Plane className="h-5 w-5" />,
      color: "bg-purple-500"
    },
    {
      code: SCENES.BUYER_HOME,
      name: "买家居家",
      description: "消费者接收与签收场景",
      icon: <Home className="h-5 w-5" />,
      color: "bg-pink-500"
    }
  ];

  const renderOverviewSection = () => (
    <div className="space-y-6">
      {/* 数字贸易城区可视化 */}
      <div className="bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 dark:from-blue-950 dark:via-green-950 dark:to-purple-950 rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-2">数字贸易生态城区</h2>
        <p className="text-center text-muted-foreground mb-8">
          模拟真实的跨境电商全流程业务场景，体验完整的数字贸易生态链
        </p>
        
        {/* 数字贸易流程可视化 */}
        <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl p-6 shadow-xl border border-white/20">
          {/* 标题区域 */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              数字贸易全流程业务链
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              跨境电商端到端业务流程 · 点击场景深入了解
            </p>
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            {/* 流程图 */}
            <div className="grid grid-cols-5 gap-4 items-center">
              
              {/* 电商企业 */}
              <div className="relative group text-center">
                <div 
                  className="bg-gradient-to-br from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white p-4 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300"
                  onClick={() => setActiveSection(SCENES.ENTERPRISE as ActiveSection)}
                >
                  <Building2 className="h-8 w-8 mx-auto mb-2" />
                  <h4 className="font-bold text-sm mb-1">电商企业</h4>
                  <div className="text-xs opacity-90 space-y-1">
                    <div>① 备案申报</div>
                    <div>② 出口申报</div>
                  </div>
                </div>
              </div>
              
              {/* 箭头1 */}
              <div className="flex flex-col items-center">
                <div className="text-blue-500 text-2xl">→</div>
                <div className="text-xs text-blue-500 mt-1">申报</div>
              </div>
              
              {/* 海关办事处 */}
              <div className="relative group text-center">
                <div 
                  className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300"
                  onClick={() => setActiveSection(SCENES.CUSTOMS as ActiveSection)}
                >
                  <Shield className="h-8 w-8 mx-auto mb-2" />
                  <h4 className="font-bold text-sm mb-1">海关办事处</h4>
                  <div className="text-xs opacity-90 space-y-1">
                    <div>③ 审核备案</div>
                    <div>④ 布控查验</div>
                  </div>
                </div>
              </div>
              
              {/* 箭头2 */}
              <div className="flex flex-col items-center">
                <div className="text-blue-600 text-2xl">→</div>
                <div className="text-xs text-blue-600 mt-1">放行</div>
              </div>
              
              {/* 监管作业场所 */}
              <div className="relative group text-center">
                <div 
                  className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300"
                  onClick={() => setActiveSection(SCENES.CUSTOMS_SUPERVISION as ActiveSection)}
                >
                  <Warehouse className="h-8 w-8 mx-auto mb-2" />
                  <h4 className="font-bold text-sm mb-1">监管作业场所</h4>
                  <div className="text-xs opacity-90 space-y-1">
                    <div>⑤ 货物查验</div>
                    <div>⑥ 运抵登记</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 跨境运输分隔 */}
            <div className="relative my-6">
              <div className="flex items-center">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
                <div className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg mx-4">
                  🚢 跨境物流运输
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent"></div>
              </div>
            </div>
            
            {/* 海外配送阶段 */}
            <div className="grid grid-cols-3 gap-4 items-center">
              
              {/* 海外仓库 */}
              <div className="relative group text-center">
                <div 
                  className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white p-4 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300"
                  onClick={() => setActiveSection(SCENES.OVERSEAS_WAREHOUSE as ActiveSection)}
                >
                  <Plane className="h-8 w-8 mx-auto mb-2" />
                  <h4 className="font-bold text-sm mb-1">海外仓库</h4>
                  <div className="text-xs opacity-90 space-y-1">
                    <div>⑦ 入境清关</div>
                    <div>⑧ 仓库拣货</div>
                  </div>
                </div>
              </div>
              
              {/* 箭头3 */}
              <div className="flex flex-col items-center">
                <div className="text-indigo-600 text-2xl">→</div>
                <div className="text-xs text-indigo-600 mt-1">配送</div>
              </div>
              
              {/* 买家居家 */}
              <div className="relative group text-center">
                <div 
                  className="bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white p-4 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300"
                  onClick={() => setActiveSection(SCENES.BUYER_HOME as ActiveSection)}
                >
                  <Home className="h-8 w-8 mx-auto mb-2" />
                  <h4 className="font-bold text-sm mb-1">买家居家</h4>
                  <div className="text-xs opacity-90 space-y-1">
                    <div>⑨ 配送签收</div>
                    <div>⑩ 完成交易</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 当前角色信息 */}
      {currentRole && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">当前角色权限</h3>
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium">角色：</span>
              <Badge variant="outline" className="ml-2">{currentRole.roleName}</Badge>
            </div>
            <div>
              <span className="text-sm font-medium">可访问场景：</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {sceneConfigs.map(scene => (
                  <Badge 
                    key={scene.code}
                    variant={canAccessScene(scene.code) ? "default" : "secondary"}
                    className={canAccessScene(scene.code) ? "" : "opacity-50"}
                  >
                    {scene.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 创建各个场景的渲染函数
  const renderSceneSection = (sceneCode: string) => {
    const scene = sceneConfigs.find(s => s.code === sceneCode);
    if (!scene) return null;

    const hasAccess = canAccessScene(sceneCode);
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 ${scene.color} text-white rounded-lg`}>
              {scene.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{scene.name}</h2>
              <p className="text-muted-foreground">{scene.description}</p>
            </div>
          </div>
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">角色操作权限</h3>
            <div className="space-y-3">
              {currentRole && hasAccess ? (
                BUSINESS_ROLE_CONFIGS[currentRole.roleCode]?.availableOperations.map((operation, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{operation}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  当前角色"{currentRole?.roleName || "未选择"}"在此场景下暂无操作权限
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">相关实验任务</h3>
            <div className="space-y-3">
              {sceneCode === SCENES.ENTERPRISE && (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      if (hasAccess) {
                        setLocation("/experiments/873e1fe1-0430-4f47-9db2-c4f00e2b048f");
                      } else {
                        alert(`当前角色"${currentRole?.roleName}"无权限执行此操作。请切换到"跨境电商企业操作员"角色后重试。`);
                      }
                    }}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    海关企业资质备案
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      if (hasAccess) {
                        setLocation("/experiments/b6566249-2b05-497a-9517-b09f2b7eaa97");
                      } else {
                        alert(`当前角色"${currentRole?.roleName}"无权限执行此操作。请切换到"跨境电商企业操作员"角色后重试。`);
                      }
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    电子口岸IC卡申请
                  </Button>
                </>
              )}
              
              {sceneCode === SCENES.CUSTOMS && (
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      if (hasAccess) {
                        // 跳转到海关相关实验
                        alert("海关场景实验正在开发中...");
                      } else {
                        alert(`当前角色"${currentRole?.roleName}"无权限执行此操作。请切换到"海关审核员"角色后重试。`);
                      }
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    备案材料审核
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    该场景的其他实验任务正在开发中...
                  </div>
                </div>
              )}
              
              {sceneCode === SCENES.CUSTOMS_SUPERVISION && (
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      if (hasAccess) {
                        alert("监管作业场所实验正在开发中...");
                      } else {
                        alert(`当前角色"${currentRole?.roleName}"无权限执行此操作。请切换到"海关审核员"或"物流企业操作员"角色后重试。`);
                      }
                    }}
                  >
                    <Warehouse className="mr-2 h-4 w-4" />
                    货物查验操作
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    该场景的其他实验任务正在开发中...
                  </div>
                </div>
              )}
              
              {sceneCode === SCENES.OVERSEAS_WAREHOUSE && (
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      if (hasAccess) {
                        alert("海外仓库实验正在开发中...");
                      } else {
                        alert(`当前角色"${currentRole?.roleName}"无权限执行此操作。请切换到"物流企业操作员"角色后重试。`);
                      }
                    }}
                  >
                    <Plane className="mr-2 h-4 w-4" />
                    海外仓拣货打包
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    该场景的其他实验任务正在开发中...
                  </div>
                </div>
              )}
              
              {sceneCode === SCENES.BUYER_HOME && (
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      if (hasAccess) {
                        alert("买家居家实验正在开发中...");
                      } else {
                        alert(`当前角色"${currentRole?.roleName}"无权限执行此操作。请切换到"物流企业操作员"角色后重试。`);
                      }
                    }}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    买家签收确认
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    该场景的其他实验任务正在开发中...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };


  const renderContent = () => {
    switch (activeSection) {
      case "overview": return renderOverviewSection();
      case "enterprise_scene": return renderSceneSection(SCENES.ENTERPRISE);
      case "customs_scene": return renderSceneSection(SCENES.CUSTOMS);
      case "customs_supervision_scene": return renderSceneSection(SCENES.CUSTOMS_SUPERVISION);
      case "overseas_warehouse_scene": return renderSceneSection(SCENES.OVERSEAS_WAREHOUSE);
      case "buyer_home_scene": return renderSceneSection(SCENES.BUYER_HOME);
      default: return renderOverviewSection();
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
            icon={<MapPin />}
            active={activeSection === "overview"}
            onClick={() => setActiveSection("overview")}
            data-testid="sidebar-overview"
          >
            城区总览
          </SidebarItem>
          
          {sceneConfigs.map(scene => (
            <SidebarItem
              key={scene.code}
              icon={scene.icon}
              active={activeSection === scene.code}
              onClick={() => setActiveSection(scene.code as ActiveSection)}
              data-testid={`sidebar-${scene.code}`}
            >
              {scene.name}
            </SidebarItem>
          ))}
          
          <div className="mt-4 px-3">
            <div className="text-xs text-muted-foreground mb-2">当前角色</div>
            <div className="text-sm font-medium">{currentRole?.roleName || "未选择"}</div>
          </div>
        </Sidebar>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* 注意：现在使用页面跳转而不是模态框 */}
    </div>
  );
}