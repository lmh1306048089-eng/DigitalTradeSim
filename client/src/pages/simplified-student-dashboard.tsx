import { useState, useEffect } from "react";
import { 
  Building2, 
  Shield, 
  Warehouse,
  Home,
  Plane,
  MapPin,
  ArrowRight
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

  // 监听URL查询参数，设置对应的场景
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section') as ActiveSection;
    if (section && ['overview', 'enterprise_scene', 'customs_scene', 'customs_supervision_scene', 'overseas_warehouse_scene', 'buyer_home_scene'].includes(section)) {
      setActiveSection(section);
      // 清除URL参数，保持URL干净
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
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
      <div className="bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 dark:from-blue-950 dark:via-slate-950 dark:to-indigo-950 rounded-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            数字贸易生态城区
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            模拟真实的跨境电商全流程业务场景，体验完整的数字贸易生态链
          </p>
        </div>
        
        {/* 数字贸易流程可视化 */}
        <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl p-6 shadow-xl border border-white/20">
          {/* 标题区域 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
              <span className="text-white text-2xl font-bold">🔗</span>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
              数字贸易全流程业务链
            </h3>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                跨境电商端到端业务流程
              </span>
              <span className="text-slate-400">•</span>
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                点击场景深入了解
              </span>
            </div>
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

    // 定义每个场景的任务列表
    const getSceneTasks = (sceneCode: string) => {
      switch (sceneCode) {
        case SCENES.ENTERPRISE:
          return [
            {
              id: 'enterprise-backup',
              title: '海关企业资质备案',
              description: '企业资质备案申请流程，完成企业信息注册和资质审核',
              icon: <Shield className="h-6 w-6" />,
              status: 'available',
              requiredRole: '跨境电商企业操作员',
              onClick: () => {
                if (currentRole?.roleCode === 'enterprise_operator') {
                  setLocation("/experiments/873e1fe1-0430-4f47-9db2-c4f00e2b048f");
                } else {
                  alert(`当前角色"${currentRole?.roleName || '未选择'}"无权限执行此操作。请切换到"跨境电商企业操作员"角色后重试。`);
                }
              }
            },
            {
              id: 'eport-ic-card',
              title: '电子口岸IC卡申请',
              description: '申请电子口岸IC卡的完整流程，包括资料准备和在线申请',
              icon: <MapPin className="h-6 w-6" />,
              status: 'available',
              requiredRole: '跨境电商企业操作员',
              onClick: () => {
                if (currentRole?.roleCode === 'enterprise_operator') {
                  setLocation("/experiments/b6566249-2b05-497a-9517-b09f2b7eaa97");
                } else {
                  alert(`当前角色"${currentRole?.roleName || '未选择'}"无权限执行此操作。请切换到"跨境电商企业操作员"角色后重试。`);
                }
              }
            },
            {
              id: 'enterprise-qualification',
              title: '电商企业资质备案',
              description: '完成跨境电商企业资质备案填报，包括营业执照、贸易备案、税务信息等',
              icon: <Building2 className="h-6 w-6" />,
              status: 'available',
              requiredRole: '跨境电商企业操作员',
              onClick: () => {
                if (currentRole?.roleCode === 'enterprise_operator') {
                  setLocation("/enterprise-qualification");
                } else {
                  alert(`当前角色"${currentRole?.roleName || '未选择'}"无权限执行此操作。请切换到"跨境电商企业操作员"角色后重试。`);
                }
              }
            }
          ];
        case SCENES.CUSTOMS:
          return [
            {
              id: 'customs-review',
              title: '备案材料审核',
              description: '审核企业备案申请，检查资质材料和合规性',
              icon: <Shield className="h-6 w-6" />,
              status: 'developing',
              requiredRole: '海关审核员',
              onClick: () => {
                if (currentRole?.roleCode === 'customs_officer') {
                  alert("海关场景实验正在开发中...");
                } else {
                  alert(`当前角色"${currentRole?.roleName || '未选择'}"无权限执行此操作。请切换到"海关审核员"角色后重试。`);
                }
              }
            }
          ];
        case SCENES.CUSTOMS_SUPERVISION:
          return [
            {
              id: 'cargo-inspection',
              title: '货物查验操作',
              description: '对进出口货物进行查验，确保符合监管要求',
              icon: <Warehouse className="h-6 w-6" />,
              status: 'developing',
              requiredRole: '海关审核员',
              onClick: () => {
                if (currentRole?.roleCode === 'customs_officer' || currentRole?.roleCode === 'logistics_operator') {
                  alert("货物查验操作实验正在开发中...");
                } else {
                  alert(`当前角色"${currentRole?.roleName || '未选择'}"无权限执行此操作。请切换到"海关审核员"或"物流企业操作员"角色后重试。`);
                }
              }
            }
          ];
        case SCENES.OVERSEAS_WAREHOUSE:
          return [
            {
              id: 'warehouse-picking',
              title: '海外仓拣货打包',
              description: '在海外仓库进行商品拣选和打包操作',
              icon: <Plane className="h-6 w-6" />,
              status: 'developing',
              requiredRole: '物流企业操作员',
              onClick: () => {
                if (currentRole?.roleCode === 'logistics_operator') {
                  alert("海外仓拣货打包实验正在开发中...");
                } else {
                  alert(`当前角色"${currentRole?.roleName || '未选择'}"无权限执行此操作。请切换到"物流企业操作员"角色后重试。`);
                }
              }
            }
          ];
        case SCENES.BUYER_HOME:
          return [
            {
              id: 'delivery-confirmation',
              title: '买家签收确认',
              description: '完成最后一公里配送和买家签收确认流程',
              icon: <Home className="h-6 w-6" />,
              status: 'developing',
              requiredRole: '物流企业操作员',
              onClick: () => {
                if (currentRole?.roleCode === 'logistics_operator') {
                  alert("买家签收确认实验正在开发中...");
                } else {
                  alert(`当前角色"${currentRole?.roleName || '未选择'}"无权限执行此操作。请切换到"物流企业操作员"角色后重试。`);
                }
              }
            }
          ];
        default:
          return [];
      }
    };

    const tasks = getSceneTasks(sceneCode);

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'available':
          return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">可开始</Badge>;
        case 'developing':
          return <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400">开发中</Badge>;
        default:
          return <Badge variant="outline">未开始</Badge>;
      }
    };
    
    return (
      <div className="space-y-6">
        {/* Scene Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 ${scene.color} text-white rounded-lg`}>
              {scene.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{scene.name}</h2>
              <p className="text-muted-foreground">{scene.description}</p>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
              data-testid={`task-card-${task.id}`}
            >
              {/* 任务序号 */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-full">
                  任务{index + 1}
                </span>
                {getStatusBadge(task.status)}
              </div>
              
              <div className="flex items-start space-x-4 mb-4">
                <div className={`p-3 rounded-lg ${scene.color} text-white`}>
                  {task.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    {task.title}
                  </h3>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {task.description}
              </p>
              
              <div className="mb-4">
                <span className="text-xs text-muted-foreground">需要角色: {task.requiredRole}</span>
              </div>
              
              {/* 开始任务按钮 */}
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
                onClick={task.onClick}
                data-testid={`start-task-${task.id}`}
              >
                <span>开始任务</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">该场景的实验任务正在开发中...</div>
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