import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, CheckSquare, BarChart, Download, Search, Eye, FileText } from "lucide-react";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/ui/stats-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TeacherStats, TrainingTask, ExperimentResult, Experiment } from "@/types";

export default function TeacherDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teacher data
  const { data: stats } = useQuery<TeacherStats>({
    queryKey: ["/api/teacher/stats"],
  });

  const { data: tasks = [] } = useQuery<TrainingTask[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: experiments = [] } = useQuery<Experiment[]>({
    queryKey: ["/api/experiments"],
  });

  const { data: results = [] } = useQuery<ExperimentResult[]>({
    queryKey: ["/api/results"],
  });

  // Mutation for evaluating results
  const evaluateResultMutation = useMutation({
    mutationFn: async ({ resultId, score, feedback }: { resultId: string; score: number; feedback: string }) => {
      const res = await apiRequest("PUT", `/api/results/${resultId}/evaluate`, { score, feedback });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      toast({
        title: "评价成功",
        description: "学员实验结果已评价",
      });
    },
    onError: (error: any) => {
      toast({
        title: "评价失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter students based on search
  const filteredResults = results.filter((result: any) => 
    result.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.experiment?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingEvaluations = results.filter((result: any) => !result.score).length;

  const handleEvaluate = (resultId: string, score: number, feedback: string) => {
    evaluateResultMutation.mutate({ resultId, score, feedback });
  };

  const exportData = () => {
    // TODO: Implement data export functionality
    toast({
      title: "导出功能开发中",
      description: "数据导出功能正在开发中，敬请期待",
    });
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header title="教师管理中心">
        <Button data-testid="button-create-task">
          <Plus className="mr-2 h-4 w-4" />
          创建任务
        </Button>
      </Header>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="管理学员"
            value={`${stats?.totalStudents || 0}人`}
            icon={<Users />}
            iconColor="text-primary"
          />
          <StatsCard
            title="活跃任务"
            value={`${stats?.activeTasks || 0}个`}
            icon={<CheckSquare />}
            iconColor="text-accent"
          />
          <StatsCard
            title="总任务数"
            value={`${stats?.totalTasks || 0}个`}
            icon={<BarChart />}
            iconColor="text-secondary"
          />
          <StatsCard
            title="待评价作业"
            value={`${pendingEvaluations}份`}
            icon={<FileText />}
            iconColor="text-destructive"
          />
        </div>

        {/* Task Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>培训任务管理</CardTitle>
              <div className="flex space-x-3">
                <Button variant="outline" size="sm" data-testid="button-filter-tasks">
                  筛选任务
                </Button>
                <Button variant="outline" size="sm" onClick={exportData} data-testid="button-export-tasks">
                  <Download className="mr-2 h-4 w-4" />
                  导出数据
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task) => {
                  const experiment = experiments.find(e => e.id === task.experimentId);
                  return (
                    <div key={task.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-muted-foreground">
                            实验: {experiment?.name || "未知实验"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            分配学员: {task.assignedStudents?.length || 0}人
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              截止: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={task.isActive ? "default" : "secondary"}>
                          {task.isActive ? "进行中" : "已结束"}
                        </Badge>
                        <Button variant="ghost" size="sm" data-testid={`button-view-task-${task.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无培训任务</p>
                <Button className="mt-4" data-testid="button-create-first-task">
                  <Plus className="mr-2 h-4 w-4" />
                  创建第一个任务
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>学员管理</CardTitle>
              <div className="flex space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索学员..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                    data-testid="input-search-students"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={exportData} data-testid="button-export-students">
                  <Download className="mr-2 h-4 w-4" />
                  导出数据
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-3 px-6 font-medium">学员信息</th>
                      <th className="text-left py-3 px-6 font-medium">实验项目</th>
                      <th className="text-left py-3 px-6 font-medium">提交时间</th>
                      <th className="text-left py-3 px-6 font-medium">评分状态</th>
                      <th className="text-left py-3 px-6 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.slice(0, 10).map((result: any) => {
                      const experiment = experiments.find(e => e.id === result.experimentId);
                      return (
                        <tr key={result.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-medium">{result.user?.username || "未知学员"}</p>
                              <p className="text-sm text-muted-foreground">{result.user?.phone || ""}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">{experiment?.name || "未知实验"}</td>
                          <td className="py-4 px-6 text-muted-foreground">
                            {result.submittedAt ? new Date(result.submittedAt).toLocaleDateString() : "-"}
                          </td>
                          <td className="py-4 px-6">
                            {result.score ? (
                              <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                                {result.score}分
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-destructive">
                                待评价
                              </Badge>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-view-result-${result.id}`}
                              >
                                查看详情
                              </Button>
                              {!result.score && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Open evaluation modal
                                    const score = prompt("请输入评分 (0-100):");
                                    const feedback = prompt("请输入评语:");
                                    if (score && feedback) {
                                      handleEvaluate(result.id, parseFloat(score), feedback);
                                    }
                                  }}
                                  data-testid={`button-evaluate-${result.id}`}
                                >
                                  评价
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无学员记录</p>
                <p className="text-sm">学员完成实验后将在此显示</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>实验完成统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {experiments.slice(0, 5).map((experiment) => {
                  const experimentResults = results.filter((r: any) => r.experimentId === experiment.id);
                  const completedCount = experimentResults.length;
                  const totalStudents = stats?.totalStudents || 1;
                  const completionRate = (completedCount / totalStudents) * 100;
                  
                  return (
                    <div key={experiment.id}>
                      <div className="flex justify-between text-sm mb-2">
                        <span>{experiment.name}</span>
                        <span className="font-medium">{completedCount}/{totalStudents}</span>
                      </div>
                      <ProgressBar value={completedCount} max={totalStudents} showLabel={false} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>评分分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["90-100分", "80-89分", "70-79分", "60-69分", "60分以下"].map((range, index) => {
                  const scoredResults = results.filter((r: any) => r.score);
                  let count = 0;
                  
                  scoredResults.forEach((result: any) => {
                    const score = parseFloat(result.score);
                    if (index === 0 && score >= 90) count++;
                    else if (index === 1 && score >= 80 && score < 90) count++;
                    else if (index === 2 && score >= 70 && score < 80) count++;
                    else if (index === 3 && score >= 60 && score < 70) count++;
                    else if (index === 4 && score < 60) count++;
                  });
                  
                  return (
                    <div key={range}>
                      <div className="flex justify-between text-sm mb-2">
                        <span>{range}</span>
                        <span className="font-medium">{count}人</span>
                      </div>
                      <ProgressBar 
                        value={count} 
                        max={Math.max(scoredResults.length, 1)} 
                        showLabel={false} 
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
