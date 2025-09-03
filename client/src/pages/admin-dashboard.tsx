import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Settings, Users, Building, FlaskConical, Server, BarChart, Database, Activity } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Sidebar, SidebarItem } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SystemStats, VirtualScene, Experiment } from "@/types";

type ActiveSection = "overview" | "users" | "scenes" | "experiments" | "monitoring";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");

  // Fetch system data
  const { data: systemStats } = useQuery<SystemStats>({
    queryKey: ["/api/admin/users"],
  });

  const { data: scenes = [] } = useQuery<VirtualScene[]>({
    queryKey: ["/api/scenes"],
  });

  const { data: experiments = [] } = useQuery<Experiment[]>({
    queryKey: ["/api/experiments"],
  });

  const renderOverviewSection = () => (
    <div className="space-y-6">
      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="总用户数"
          value={systemStats?.totalUsers || 0}
          icon={<Users />}
          iconColor="text-primary"
        />
        <StatsCard
          title="在线用户"
          value="156" // Mock data - would come from real-time monitoring
          icon={<Activity />}
          iconColor="text-secondary"
        />
        <StatsCard
          title="系统负载"
          value="23%" // Mock data - would come from system monitoring
          icon={<Server />}
          iconColor="text-accent"
        />
        <StatsCard
          title="数据存储"
          value="2.3GB" // Mock data - would come from storage monitoring
          icon={<Database />}
          iconColor="text-secondary"
        />
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>系统健康状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">数据库连接</p>
                <p className="text-sm text-muted-foreground">PostgreSQL</p>
              </div>
              <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                正常
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">API 服务</p>
                <p className="text-sm text-muted-foreground">Express Server</p>
              </div>
              <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                正常
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">文件存储</p>
                <p className="text-sm text-muted-foreground">本地存储</p>
              </div>
              <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                正常
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>用户角色分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">学员</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${systemStats ? (systemStats.students / systemStats.totalUsers) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{systemStats?.students || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">教师</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-secondary h-2 rounded-full" 
                      style={{ width: `${systemStats ? (systemStats.teachers / systemStats.totalUsers) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{systemStats?.teachers || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">管理员</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full" 
                      style={{ width: `${systemStats ? (systemStats.admins / systemStats.totalUsers) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{systemStats?.admins || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统配置状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">虚拟场景</span>
                <Badge variant="outline">{scenes.length} 个已配置</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">实验流程</span>
                <Badge variant="outline">{experiments.length} 个已配置</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">系统备份</span>
                <Badge variant="secondary" className="bg-secondary/20 text-secondary">自动备份已启用</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderUsersSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">用户管理</h2>
        <Button data-testid="button-create-user">
          <Users className="mr-2 h-4 w-4" />
          创建用户
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="学员总数"
          value={systemStats?.students || 0}
          icon={<Users />}
          iconColor="text-primary"
        />
        <StatsCard
          title="教师总数"
          value={systemStats?.teachers || 0}
          icon={<Users />}
          iconColor="text-secondary"
        />
        <StatsCard
          title="管理员总数"
          value={systemStats?.admins || 0}
          icon={<Users />}
          iconColor="text-accent"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户管理操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="h-24 flex-col space-y-2" data-testid="button-batch-import">
              <Users className="h-6 w-6" />
              <span>批量导入学员</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col space-y-2" data-testid="button-role-management">
              <Settings className="h-6 w-6" />
              <span>角色权限管理</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col space-y-2" data-testid="button-user-analytics">
              <BarChart className="h-6 w-6" />
              <span>用户行为分析</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderScenesSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">虚拟场景配置</h2>
        <Button data-testid="button-create-scene">
          <Building className="mr-2 h-4 w-4" />
          创建场景
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scenes.map((scene) => (
          <Card key={scene.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{scene.name}</CardTitle>
                <Button variant="ghost" size="sm" data-testid={`button-edit-scene-${scene.id}`}>
                  编辑
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{scene.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>交互元素:</span>
                  <span>{scene.interactiveElements?.length || 0}个</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>配置状态:</span>
                  <Badge 
                    variant={scene.status === "active" ? "secondary" : "outline"}
                    className={scene.status === "active" ? "bg-secondary/20 text-secondary" : ""}
                  >
                    {scene.status === "active" ? "正常运行" : "未激活"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>排序:</span>
                  <span>第{scene.order}位</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderExperimentsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">实验流程管理</h2>
        <Button data-testid="button-create-experiment">
          <FlaskConical className="mr-2 h-4 w-4" />
          创建实验
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {experiments.map((experiment) => (
          <Card key={experiment.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{experiment.name}</CardTitle>
                <Button variant="ghost" size="sm" data-testid={`button-edit-experiment-${experiment.id}`}>
                  编辑
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{experiment.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>类别:</span>
                  <Badge variant="outline">{experiment.category}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>步骤数:</span>
                  <span>{experiment.steps?.length || 0}个</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>状态:</span>
                  <Badge 
                    variant={experiment.isActive ? "secondary" : "outline"}
                    className={experiment.isActive ? "bg-secondary/20 text-secondary" : ""}
                  >
                    {experiment.isActive ? "已激活" : "未激活"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>排序:</span>
                  <span>第{experiment.order}位</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMonitoringSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">系统监控</h2>
        <Button variant="outline" data-testid="button-refresh-monitoring">
          <Activity className="mr-2 h-4 w-4" />
          刷新状态
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>服务状态监控</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Web 服务器", status: "正常", uptime: "99.9%" },
                { name: "数据库", status: "正常", uptime: "99.8%" },
                { name: "文件服务", status: "正常", uptime: "99.7%" },
                { name: "认证服务", status: "正常", uptime: "99.9%" },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">运行时间: {service.uptime}</p>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统性能指标</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { metric: "CPU 使用率", value: "23%", status: "正常" },
                { metric: "内存使用率", value: "45%", status: "正常" },
                { metric: "磁盘使用率", value: "67%", status: "正常" },
                { metric: "网络延迟", value: "12ms", status: "优秀" },
              ].map((metric) => (
                <div key={metric.metric} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">{metric.metric}</p>
                    <p className="text-sm text-muted-foreground">当前值: {metric.value}</p>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                    {metric.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>系统日志</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[
              { time: "2024-01-20 14:32:18", level: "INFO", message: "用户登录成功: user123" },
              { time: "2024-01-20 14:30:45", level: "INFO", message: "实验数据提交: 前期准备实验" },
              { time: "2024-01-20 14:28:12", level: "WARN", message: "API 请求频率较高: /api/progress" },
              { time: "2024-01-20 14:25:33", level: "INFO", message: "数据备份完成" },
              { time: "2024-01-20 14:20:15", level: "INFO", message: "新用户注册: student456" },
            ].map((log, index) => (
              <div key={index} className="text-sm p-2 bg-muted rounded">
                <span className="text-muted-foreground">[{log.time}]</span>
                <Badge 
                  variant="outline" 
                  className={`ml-2 ${log.level === "WARN" ? "text-accent" : "text-primary"}`}
                >
                  {log.level}
                </Badge>
                <span className="ml-2">{log.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "overview": return renderOverviewSection();
      case "users": return renderUsersSection();
      case "scenes": return renderScenesSection();
      case "experiments": return renderExperimentsSection();
      case "monitoring": return renderMonitoringSection();
      default: return renderOverviewSection();
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header title="系统管理中心" />
      
      <div className="flex h-screen">
        <Sidebar>
          <SidebarItem
            icon={<BarChart className="h-5 w-5" />}
            active={activeSection === "overview"}
            onClick={() => setActiveSection("overview")}
          >
            系统概览
          </SidebarItem>
          <SidebarItem
            icon={<Users className="h-5 w-5" />}
            active={activeSection === "users"}
            onClick={() => setActiveSection("users")}
          >
            用户管理
          </SidebarItem>
          <SidebarItem
            icon={<Building className="h-5 w-5" />}
            active={activeSection === "scenes"}
            onClick={() => setActiveSection("scenes")}
          >
            场景配置
          </SidebarItem>
          <SidebarItem
            icon={<FlaskConical className="h-5 w-5" />}
            active={activeSection === "experiments"}
            onClick={() => setActiveSection("experiments")}
          >
            实验管理
          </SidebarItem>
          <SidebarItem
            icon={<Server className="h-5 w-5" />}
            active={activeSection === "monitoring"}
            onClick={() => setActiveSection("monitoring")}
          >
            系统监控
          </SidebarItem>
        </Sidebar>

        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
