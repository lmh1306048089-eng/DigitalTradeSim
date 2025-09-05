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
        <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl p-10 shadow-2xl border border-white/20">
          {/* 标题区域 */}
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              数字贸易全流程业务链
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              跨境电商端到端业务流程 · 点击场景深入了解
            </p>
          </div>
          
          <div className="relative">
            {/* 流程步骤 */}
            <div className="space-y-16">
              
              {/* 第一阶段：国内出口 */}
              <div className="relative">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full shadow-lg">
                    <span className="text-sm font-semibold tracking-wider">🇨🇳 国内出口阶段</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-12 items-center">
                  {/* 电商企业 */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <div 
                      className="relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-8 rounded-2xl shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-300"
                      onClick={() => setActiveSection(SCENES.ENTERPRISE as ActiveSection)}
                    >
                      <div className="text-center">
                        <div className="bg-white/20 p-4 rounded-xl mb-4 mx-auto w-fit">
                          <Building2 className="h-12 w-12" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">电商企业</h3>
                        <p className="text-blue-100 text-sm mb-4">Cross-border E-commerce</p>
                        <div className="space-y-1 text-xs text-blue-100">
                          <div className="bg-white/10 px-3 py-1 rounded-full">① 备案申报</div>
                          <div className="bg-white/10 px-3 py-1 rounded-full">② 出口申报</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 流程箭头 */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <svg width="120" height="60" viewBox="0 0 120 60" className="mx-auto">
                        <defs>
                          <linearGradient id="arrowGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#10B981" />
                          </linearGradient>
                          <marker id="arrowhead1" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                            <polygon points="0,0 10,3 0,6" fill="url(#arrowGradient1)" />
                          </marker>
                        </defs>
                        <path d="M10,30 Q60,10 110,30" stroke="url(#arrowGradient1)" strokeWidth="3" fill="none" markerEnd="url(#arrowhead1)" />
                      </svg>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg">
                      申报材料传输
                    </div>
                  </div>
                  
                  {/* 海关办事处 */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <div 
                      className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-8 rounded-2xl shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-300"
                      onClick={() => setActiveSection(SCENES.CUSTOMS as ActiveSection)}
                    >
                      <div className="text-center">
                        <div className="bg-white/20 p-4 rounded-xl mb-4 mx-auto w-fit">
                          <Shield className="h-12 w-12" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">海关办事处</h3>
                        <p className="text-emerald-100 text-sm mb-4">Customs Office</p>
                        <div className="space-y-1 text-xs text-emerald-100">
                          <div className="bg-white/10 px-3 py-1 rounded-full">③ 审核备案</div>
                          <div className="bg-white/10 px-3 py-1 rounded-full">④ 布控查验</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 向下箭头 */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  <svg width="60" height="80" viewBox="0 0 60 80" className="mx-auto">
                    <defs>
                      <linearGradient id="arrowGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                      <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="3" refY="9" orient="auto" markerUnits="strokeWidth">
                        <polygon points="0,0 6,10 3,10" fill="url(#arrowGradient2)" />
                      </marker>
                    </defs>
                    <path d="M30,10 L30,70" stroke="url(#arrowGradient2)" strokeWidth="4" fill="none" markerEnd="url(#arrowhead2)" />
                  </svg>
                  <div className="bg-gradient-to-r from-emerald-500 to-amber-500 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg mt-2">
                    查验放行
                  </div>
                </div>
              </div>
              
              {/* 第二阶段：监管查验 */}
              <div className="relative">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-lg">
                    <span className="text-sm font-semibold tracking-wider">🏭 监管查验阶段</span>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <div 
                      className="relative bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white p-8 rounded-2xl shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-300"
                      onClick={() => setActiveSection(SCENES.CUSTOMS_SUPERVISION as ActiveSection)}
                    >
                      <div className="text-center">
                        <div className="bg-white/20 p-4 rounded-xl mb-4 mx-auto w-fit">
                          <Warehouse className="h-12 w-12" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">监管作业场所</h3>
                        <p className="text-amber-100 text-sm mb-4">Supervision Warehouse</p>
                        <div className="space-y-1 text-xs text-amber-100">
                          <div className="bg-white/10 px-3 py-1 rounded-full">⑤ 货物查验</div>
                          <div className="bg-white/10 px-3 py-1 rounded-full">⑥ 运抵登记</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 跨境运输分隔 */}
              <div className="relative py-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-dashed border-slate-300 dark:border-slate-600"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-500 text-white px-8 py-4 rounded-full shadow-2xl border-4 border-white dark:border-slate-800">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🚢</span>
                      <div>
                        <div className="font-bold text-lg">跨境物流运输</div>
                        <div className="text-xs opacity-90">International Shipping</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 第三阶段：海外配送 */}
              <div className="relative">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg">
                    <span className="text-sm font-semibold tracking-wider">🌍 海外配送阶段</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-16 items-center max-w-4xl mx-auto">
                  {/* 海外仓库 */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <div 
                      className="relative bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-8 rounded-2xl shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-300"
                      onClick={() => setActiveSection(SCENES.OVERSEAS_WAREHOUSE as ActiveSection)}
                    >
                      <div className="text-center">
                        <div className="bg-white/20 p-4 rounded-xl mb-4 mx-auto w-fit">
                          <Plane className="h-12 w-12" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">海外仓库</h3>
                        <p className="text-purple-100 text-sm mb-4">Overseas Warehouse</p>
                        <div className="space-y-1 text-xs text-purple-100">
                          <div className="bg-white/10 px-3 py-1 rounded-full">⑦ 入境清关</div>
                          <div className="bg-white/10 px-3 py-1 rounded-full">⑧ 仓库拣货</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 流程箭头 */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <svg width="120" height="60" viewBox="0 0 120 60" className="mx-auto">
                        <defs>
                          <linearGradient id="arrowGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#A855F7" />
                            <stop offset="100%" stopColor="#EC4899" />
                          </linearGradient>
                          <marker id="arrowhead3" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                            <polygon points="0,0 10,3 0,6" fill="url(#arrowGradient3)" />
                          </marker>
                        </defs>
                        <path d="M10,30 Q60,10 110,30" stroke="url(#arrowGradient3)" strokeWidth="3" fill="none" markerEnd="url(#arrowhead3)" />
                      </svg>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg">
                      最后一公里配送
                    </div>
                  </div>
                  
                  {/* 买家居家 */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <div 
                      className="relative bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white p-8 rounded-2xl shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-300"
                      onClick={() => setActiveSection(SCENES.BUYER_HOME as ActiveSection)}
                    >
                      <div className="text-center">
                        <div className="bg-white/20 p-4 rounded-xl mb-4 mx-auto w-fit">
                          <Home className="h-12 w-12" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">买家居家</h3>
                        <p className="text-pink-100 text-sm mb-4">Consumer Home</p>
                        <div className="space-y-1 text-xs text-pink-100">
                          <div className="bg-white/10 px-3 py-1 rounded-full">⑨ 配送签收</div>
                          <div className="bg-white/10 px-3 py-1 rounded-full">⑩ 完成交易</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* 背景装饰 */}
            <div className="absolute inset-0 -z-10 opacity-5">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
              <div className="absolute top-3/4 right-1/4 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-pink-500 rounded-full blur-3xl"></div>
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