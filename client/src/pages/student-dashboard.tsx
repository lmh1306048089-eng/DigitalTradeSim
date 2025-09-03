import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Building, FlaskConical, TrendingUp, Trophy, ChartLine, Users, Clock, Star, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/layout/header";
import { Sidebar, SidebarItem } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/ui/stats-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SceneCard } from "@/components/virtual-scenes/scene-card";
import { ExperimentCard } from "@/components/experiments/experiment-card";
import { SceneModal } from "@/components/modals/scene-modal";
import { ExperimentModal } from "@/components/modals/experiment-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { BusinessRoleSelector } from "@/components/business-role-selector";
import { useBusinessRole } from "@/hooks/useBusinessRole";
import { BUSINESS_ROLE_CONFIGS, SCENE_CONFIGS } from "@shared/business-roles";
import type { VirtualScene, Experiment, StudentProgress, StudentStats } from "@/types";

type ActiveSection = "overview" | "scenes" | "experiments" | "progress" | "results";

export default function StudentDashboard() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");
  const [selectedScene, setSelectedScene] = useState<VirtualScene | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const { user } = useAuth();
  const {
    hasSelectedRole,
    selectedRoleCode,
    selectBusinessRole,
    getCurrentRole,
    getAccessibleScenes,
    clearBusinessRole,
    getRoleStatus
  } = useBusinessRole();


  // Fetch data using React Query
  const { data: scenes = [] } = useQuery<VirtualScene[]>({
    queryKey: ["/api/scenes"],
  });

  const { data: experiments = [] } = useQuery<Experiment[]>({
    queryKey: ["/api/experiments"],
  });

  const { data: progress = [] } = useQuery<StudentProgress[]>({
    queryKey: ["/api/progress"],
  });

  const { data: stats } = useQuery<StudentStats>({
    queryKey: ["/api/progress/stats"],
  });

  // 获取基于业务角色的场景访问权限
  const { data: roleBasedScenes, isLoading: scenesLoading } = useQuery({
    queryKey: ["/api/scenes-with-operations", selectedRoleCode],
    enabled: !!selectedRoleCode,
  });

  const { data: results = [] } = useQuery<any[]>({
    queryKey: ["/api/results"],
  });

  // Helper functions
  const getSceneStatus = (sceneId: string) => {
    const sceneProgress = progress.find(p => p.sceneId === sceneId);
    if (!sceneProgress) return "locked";
    return sceneProgress.status === "completed" ? "completed" : "in_progress";
  };

  const getExperimentProgress = (experimentId: string) => {
    return progress.find(p => p.experimentId === experimentId);
  };

  const isExperimentUnlocked = (experiment: Experiment) => {
    // Simple logic: experiments are unlocked in order
    const experimentIndex = experiments.findIndex(e => e.id === experiment.id);
    if (experimentIndex === 0) return true;
    
    const previousExperiment = experiments[experimentIndex - 1];
    if (!previousExperiment) return true;
    
    const previousProgress = getExperimentProgress(previousExperiment.id);
    return previousProgress?.status === "completed";
  };

  // 如果是学生且还没有选择业务角色，显示角色选择界面
  if (user && user.role === "student" && !hasSelectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-6xl mx-auto">
          <BusinessRoleSelector
            userProductRole={user.role}
            onRoleSelect={selectBusinessRole}
            selectedRoleCode={selectedRoleCode || undefined}
          />
        </div>
      </div>
    );
  }

  const roleStatus = getRoleStatus();
  const currentRole = getCurrentRole();

  const renderOverviewSection = () => (
    <div className="space-y-6">
      {/* Enhanced Welcome Banner with Role Info */}
      <div className="gradient-header text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">数字贸易实训平台</h2>
            <p className="opacity-90">体验完整的跨境电商出口海外仓通关业务流程</p>
          </div>
          {currentRole && (
            <div className="text-right">
              <Badge variant="secondary" className="bg-white/20 text-white mb-2">
                当前角色: {currentRole.roleName}
              </Badge>
              <div className="text-sm opacity-80">
                可访问 {roleStatus.stats.scenesCount} 个场景
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Stats with Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="已完成场景"
          value={stats ? `${stats.completedExperiments}/${stats.totalExperiments}` : "0/0"}
          icon={<Building />}
          iconColor="text-secondary"
          progress={stats ? (stats.completedExperiments / stats.totalExperiments) * 100 : 0}
        />
        <StatsCard
          title="实验进度"
          value={stats ? `${Math.round(stats.completionRate)}%` : "0%"}
          icon={<FlaskConical />}
          iconColor="text-accent"
          progress={stats ? stats.completionRate : 0}
        />
        <StatsCard
          title="总体评分"
          value={stats ? `${stats.averageScore}分` : "0分"}
          icon={<Star />}
          iconColor="text-accent"
          progress={stats ? (stats.averageScore / 100) * 100 : 0}
        />
        <StatsCard
          title="学习时长"
          value={stats ? `${Math.round(stats.totalTimeSpent / 60)}h` : "0h"}
          icon={<Clock />}
          iconColor="text-primary"
          subtitle={`目标: 40h`}
        />
      </div>
      
      {/* Achievement Section */}
      <Card className="bg-gradient-to-r from-accent/10 to-secondary/10 border-accent/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Trophy className="h-5 w-5 text-accent mr-2" />
                学习成就
              </h3>
              <p className="text-muted-foreground">继续学习，解锁更多成就徽章</p>
            </div>
            <div className="flex space-x-2">
              <Badge variant="secondary" className="bg-accent/20 text-accent">
                <Trophy className="h-3 w-3 mr-1" />
                新手上路
              </Badge>
              {(stats?.completedExperiments || 0) >= 3 && (
                <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                  <Star className="h-3 w-3 mr-1" />
                  进步神速
                </Badge>
              )}
              {(stats?.completionRate || 0) >= 80 && (
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  <BarChart className="h-3 w-3 mr-1" />
                  学霸认证
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Path */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            学习路径
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {experiments.slice(0, 6).map((experiment, index) => {
              const experimentProgress = getExperimentProgress(experiment.id);
              const isUnlocked = isExperimentUnlocked(experiment);
              const status = experimentProgress?.status || "not_started";
              
              return (
                <div key={experiment.id} className="relative">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        status === "completed" 
                          ? "bg-secondary text-secondary-foreground" 
                          : status === "in_progress" 
                            ? "bg-primary text-primary-foreground"
                            : isUnlocked 
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium ${!isUnlocked ? "text-muted-foreground" : ""}`}>
                            {experiment.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{experiment.category}</p>
                          {experimentProgress && (
                            <div className="mt-1">
                              <Progress value={experimentProgress.progress} className="h-1" />
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant={status === "completed" ? "secondary" : status === "in_progress" ? "default" : "outline"}
                          className="ml-2"
                        >
                          {status === "completed" ? "已完成" : status === "in_progress" ? "进行中" : isUnlocked ? "可开始" : "未解锁"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {index < experiments.length - 1 && (
                    <div className="absolute left-4 top-8 w-px h-8 bg-border"></div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>当前任务</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {progress
              .filter(p => p.status === "in_progress")
              .slice(0, 2)
              .map((p) => {
                const experiment = experiments.find(e => e.id === p.experimentId);
                if (!experiment) return null;
                
                return (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium">{experiment.name}</p>
                        <p className="text-sm text-muted-foreground">{experiment.description}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setSelectedExperiment(experiment)}
                      data-testid="button-continue-task"
                    >
                      继续学习
                    </Button>
                  </div>
                );
              })}
            
            {progress.filter(p => p.status === "in_progress").length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无进行中的任务</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setActiveSection("experiments")}
                  data-testid="button-start-new-experiment"
                >
                  开始新实验
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderScenesSection = () => {
    if (scenesLoading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">加载场景权限中...</p>
            </div>
          </div>
        </div>
      );
    }

    if (!roleBasedScenes || !roleBasedScenes.accessibleScenes) {
      return (
        <div className="space-y-6">
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">请先选择业务角色以查看可访问的场景</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">虚拟场景体验 - {roleBasedScenes.businessRole?.roleName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {roleBasedScenes.businessRole?.description}
            </p>
          </div>
          <div className="text-right">
            <Badge variant="secondary">
              可访问 {roleBasedScenes.totalScenes} 个专属场景
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {roleBasedScenes.accessibleScenes.map((scene) => (
            <Card key={scene.sceneCode} className="hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{scene.sceneName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      {scene.description}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {scene.roleOperations?.length || 0}个操作入口
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {scene.roleOperations?.map((operation, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{operation.entryName}</h4>
                        <p className="text-xs text-muted-foreground">{operation.entryDescription}</p>
                      </div>
                      <Button size="sm" variant="outline" className="ml-2">
                        <Play className="h-3 w-3 mr-1" />
                        进入
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {operation.allowedOperations?.map((op, opIndex) => (
                        <Badge key={opIndex} variant="outline" className="text-xs">
                          {op}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {(!scene.roleOperations || scene.roleOperations.length === 0) && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    该角色在此场景暂无操作权限
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderExperimentsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">实验流程</h2>
        <div className="text-sm text-muted-foreground">6个核心实验环节，全流程实操体验</div>
      </div>

      {/* Process Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>实验流程进度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6 overflow-x-auto">
            {experiments.slice(0, 6).map((experiment, index) => {
              const experimentProgress = getExperimentProgress(experiment.id);
              const isCompleted = experimentProgress?.status === "completed";
              const isInProgress = experimentProgress?.status === "in_progress";
              
              return (
                <div key={experiment.id} className="flex items-center">
                  <div className="flex items-center space-x-2 whitespace-nowrap">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompleted 
                        ? "bg-secondary text-white" 
                        : isInProgress 
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{experiment.name}</span>
                  </div>
                  {index < experiments.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 ${
                      isCompleted ? "bg-secondary" : isInProgress ? "bg-primary" : "bg-border"
                    }`} style={{ minWidth: "2rem" }} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Experiment Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {experiments.map((experiment) => (
          <ExperimentCard
            key={experiment.id}
            experiment={experiment}
            progress={getExperimentProgress(experiment.id)}
            disabled={!isExperimentUnlocked(experiment)}
            onClick={() => setSelectedExperiment(experiment)}
          />
        ))}
      </div>
    </div>
  );

  const renderProgressSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">学习进度</h2>
        <Button variant="outline" data-testid="button-export-progress">
          <TrendingUp className="mr-2 h-4 w-4" />
          导出报告
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>总体进度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>虚拟场景体验</span>
              <span className="font-medium">
                {stats ? `${stats.completedExperiments}/${stats.totalExperiments} 已完成` : "0/0"}
              </span>
            </div>
            <ProgressBar 
              value={stats?.completedExperiments || 0} 
              max={stats?.totalExperiments || 1}
              className="mb-4"
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>平均评分</span>
              <span className="font-medium">{stats?.averageScore || 0}分</span>
            </div>
            <ProgressBar 
              value={stats?.averageScore || 0} 
              max={100}
            />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>实验详情</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {experiments.map((experiment) => {
                const experimentProgress = getExperimentProgress(experiment.id);
                const isCompleted = experimentProgress?.status === "completed";
                const isInProgress = experimentProgress?.status === "in_progress";
                
                return (
                  <div 
                    key={experiment.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isCompleted 
                        ? "bg-secondary/10" 
                        : isInProgress 
                          ? "bg-primary/10"
                          : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {isCompleted ? (
                        <BarChart className="h-4 w-4 text-secondary" />
                      ) : isInProgress ? (
                        <Clock className="h-4 w-4 text-primary" />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">{experiment.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {experimentProgress ? `${experimentProgress.progress}%` : "0%"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        用时: {experimentProgress ? `${Math.round((experimentProgress.timeSpent || 0) / 60)}h` : "0h"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>学习统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">累计学习时长</span>
                <span className="font-medium">
                  {stats ? `${Math.floor((stats.totalTimeSpent || 0) / 60)}小时${(stats.totalTimeSpent || 0) % 60}分钟` : "0小时0分钟"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">完成实验</span>
                <span className="font-medium">{stats?.completedExperiments || 0}个</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">平均评分</span>
                <span className="font-medium text-accent">{stats?.averageScore || 0}分</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">完成率</span>
                <span className="font-medium">{stats ? `${Math.round(stats.completionRate)}%` : "0%"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderResultsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">实训成果</h2>
        <Button data-testid="button-view-certificate">
          <Trophy className="mr-2 h-4 w-4" />
          查看证书
        </Button>
      </div>

      {/* Achievement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats && stats.averageScore >= 90 && (
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">业务流程专家</h3>
              <p className="text-sm text-muted-foreground mb-4">深度理解业务逻辑</p>
              <div className="text-2xl font-bold text-accent">{Math.round(stats.averageScore)}分</div>
            </CardContent>
          </Card>
        )}
        
        {stats && stats.completionRate >= 80 && (
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">申报流程能手</h3>
              <p className="text-sm text-muted-foreground mb-4">熟练掌握申报流程</p>
              <div className="text-2xl font-bold text-primary">{Math.round(stats.completionRate)}%</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>详细成果记录</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">实验项目</th>
                    <th className="text-left py-3 px-4 font-medium">完成时间</th>
                    <th className="text-left py-3 px-4 font-medium">得分</th>
                    <th className="text-left py-3 px-4 font-medium">状态</th>
                    <th className="text-left py-3 px-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result: any, index: number) => {
                    const experiment = experiments.find(e => e.id === result.experimentId);
                    return (
                      <tr key={result.id || index} className="border-b border-border">
                        <td className="py-3 px-4">{experiment?.name || "未知实验"}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {result.submittedAt ? new Date(result.submittedAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3 px-4">
                          {result.score ? (
                            <span className="text-secondary font-medium">{result.score}分</span>
                          ) : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={result.score ? "secondary" : "outline"}
                            className={result.score ? "bg-secondary/20 text-secondary" : ""}
                          >
                            {result.score ? "已评分" : "待评分"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-primary hover:underline text-sm">
                            查看详情
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无实训成果</p>
              <p className="text-sm">完成实验后查看您的成果记录</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "overview": return renderOverviewSection();
      case "scenes": return renderScenesSection();
      case "experiments": return renderExperimentsSection();
      case "progress": return renderProgressSection();
      case "results": return renderResultsSection();
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
            icon={<ChartLine className="h-5 w-5" />}
            active={activeSection === "overview"}
            onClick={() => setActiveSection("overview")}
          >
            学习概览
          </SidebarItem>
          <SidebarItem
            icon={<Building className="h-5 w-5" />}
            active={activeSection === "scenes"}
            onClick={() => setActiveSection("scenes")}
          >
            虚拟场景
          </SidebarItem>
          <SidebarItem
            icon={<FlaskConical className="h-5 w-5" />}
            active={activeSection === "experiments"}
            onClick={() => setActiveSection("experiments")}
          >
            实验流程
          </SidebarItem>
          <SidebarItem
            icon={<BarChart className="h-5 w-5" />}
            active={activeSection === "progress"}
            onClick={() => setActiveSection("progress")}
          >
            学习进度
          </SidebarItem>
          <SidebarItem
            icon={<Trophy className="h-5 w-5" />}
            active={activeSection === "results"}
            onClick={() => setActiveSection("results")}
          >
            实训成果
          </SidebarItem>
        </Sidebar>

        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Modals */}
      <SceneModal
        open={!!selectedScene}
        onOpenChange={(open) => !open && setSelectedScene(null)}
        scene={selectedScene}
      />

      <ExperimentModal
        open={!!selectedExperiment}
        onOpenChange={(open) => !open && setSelectedExperiment(null)}
        experiment={selectedExperiment}
        progress={selectedExperiment ? getExperimentProgress(selectedExperiment.id) : undefined}
      />
    </div>
  );
}
