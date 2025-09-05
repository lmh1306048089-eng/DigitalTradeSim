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
        
        {/* 城区地图 */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="grid grid-cols-3 gap-6 h-96">
            {/* 第一行：电商企业 */}
            <div className="col-span-1 flex items-center justify-center">
              <div 
                className={`relative p-6 rounded-xl ${sceneConfigs[0].color} text-white cursor-pointer transform hover:scale-105 transition-all`}
                onClick={() => setActiveSection(SCENES.ENTERPRISE as ActiveSection)}
              >
                <div className="text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="font-bold">电商企业</h3>
                  <p className="text-xs opacity-90">企业操作中心</p>
                </div>
                {!canAccessScene(SCENES.ENTERPRISE) && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                    <span className="text-xs">无权限</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 第一行：海关办事处 */}
            <div className="col-span-1 flex items-center justify-center">
              <div 
                className={`relative p-6 rounded-xl ${sceneConfigs[1].color} text-white cursor-pointer transform hover:scale-105 transition-all`}
                onClick={() => setActiveSection(SCENES.CUSTOMS as ActiveSection)}
              >
                <div className="text-center">
                  <Shield className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="font-bold">海关办事处</h3>
                  <p className="text-xs opacity-90">审核监管中心</p>
                </div>
                {!canAccessScene(SCENES.CUSTOMS) && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                    <span className="text-xs">无权限</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 第一行：海关监管作业场所 */}
            <div className="col-span-1 flex items-center justify-center">
              <div 
                className={`relative p-6 rounded-xl ${sceneConfigs[2].color} text-white cursor-pointer transform hover:scale-105 transition-all`}
                onClick={() => setActiveSection(SCENES.CUSTOMS_SUPERVISION as ActiveSection)}
              >
                <div className="text-center">
                  <Warehouse className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="font-bold">监管作业场所</h3>
                  <p className="text-xs opacity-90">货物查验中心</p>
                </div>
                {!canAccessScene(SCENES.CUSTOMS_SUPERVISION) && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                    <span className="text-xs">无权限</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 流程箭头和连接线 */}
            <div className="col-span-3 flex items-center justify-center py-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-1 bg-gray-300 dark:bg-gray-600"></div>
                <MapPin className="h-6 w-6 text-gray-400" />
                <div className="w-16 h-1 bg-gray-300 dark:bg-gray-600"></div>
                <span className="text-sm text-muted-foreground">跨境物流</span>
                <div className="w-16 h-1 bg-gray-300 dark:bg-gray-600"></div>
                <MapPin className="h-6 w-6 text-gray-400" />
                <div className="w-16 h-1 bg-gray-300 dark:bg-gray-600"></div>
              </div>
            </div>
            
            {/* 第三行：海外仓库和买家居家 */}
            <div className="col-span-1"></div>
            <div className="col-span-1 flex items-center justify-center">
              <div 
                className={`relative p-6 rounded-xl ${sceneConfigs[3].color} text-white cursor-pointer transform hover:scale-105 transition-all`}
                onClick={() => setActiveSection(SCENES.OVERSEAS_WAREHOUSE as ActiveSection)}
              >
                <div className="text-center">
                  <Plane className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="font-bold">海外仓库</h3>
                  <p className="text-xs opacity-90">仓储物流中心</p>
                </div>
                {!canAccessScene(SCENES.OVERSEAS_WAREHOUSE) && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                    <span className="text-xs">无权限</span>
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-1 flex items-center justify-center">
              <div 
                className={`relative p-6 rounded-xl ${sceneConfigs[4].color} text-white cursor-pointer transform hover:scale-105 transition-all`}
                onClick={() => setActiveSection(SCENES.BUYER_HOME as ActiveSection)}
              >
                <div className="text-center">
                  <Home className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="font-bold">买家居家</h3>
                  <p className="text-xs opacity-90">消费者场景</p>
                </div>
                {!canAccessScene(SCENES.BUYER_HOME) && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                    <span className="text-xs">无权限</span>
                  </div>
                )}
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
          
          {!hasAccess && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300 text-sm">
                <strong>权限不足：</strong>当前角色"{currentRole?.roleName}"无法访问此场景。
                请联系管理员或切换到有权限的角色。
              </p>
            </div>
          )}
        </div>

        {hasAccess ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
              <h3 className="font-semibold mb-4">可执行操作</h3>
              <div className="space-y-2">
                {BUSINESS_ROLE_CONFIGS[currentRole?.roleCode || ""]?.availableOperations.map((operation, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{operation}</span>
                  </div>
                ))}
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
                      onClick={() => setLocation("/experiments/873e1fe1-0430-4f47-9db2-c4f00e2b048f")}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      海关企业资质备案
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setLocation("/experiments/b6566249-2b05-497a-9517-b09f2b7eaa97")}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      电子口岸IC卡申请
                    </Button>
                  </>
                )}
                
                {(sceneCode === SCENES.CUSTOMS || sceneCode === SCENES.CUSTOMS_SUPERVISION) && (
                  <div className="text-sm text-muted-foreground">
                    该场景的实验任务正在开发中...
                  </div>
                )}
                
                {(sceneCode === SCENES.OVERSEAS_WAREHOUSE || sceneCode === SCENES.BUYER_HOME) && (
                  <div className="text-sm text-muted-foreground">
                    该场景的实验任务正在开发中...
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Home className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              无访问权限
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              请切换到有权限的角色后重试
            </p>
          </div>
        )}
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
              disabled={!canAccessScene(scene.code)}
              data-testid={`sidebar-${scene.code}`}
            >
              <div className="flex items-center justify-between w-full">
                <span>{scene.name}</span>
                {!canAccessScene(scene.code) && (
                  <Badge variant="secondary" className="text-xs">
                    无权限
                  </Badge>
                )}
              </div>
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