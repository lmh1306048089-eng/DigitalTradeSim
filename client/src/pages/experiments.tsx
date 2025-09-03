import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FlaskConical, CheckCircle, Clock, Circle, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { ExperimentCard } from "@/components/experiments/experiment-card";
import { ExperimentModal } from "@/components/modals/experiment-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Experiment, StudentProgress } from "@/types";

export default function ExperimentsPage() {
  const [, setLocation] = useLocation();
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);

  // Fetch data
  const { data: experiments = [] } = useQuery<Experiment[]>({
    queryKey: ["/api/experiments"],
  });

  const { data: progress = [] } = useQuery<StudentProgress[]>({
    queryKey: ["/api/progress"],
  });

  // Helper functions
  const getExperimentProgress = (experimentId: string) => {
    return progress.find(p => p.experimentId === experimentId);
  };

  const isExperimentUnlocked = (experiment: Experiment) => {
    const experimentIndex = experiments.findIndex(e => e.id === experiment.id);
    if (experimentIndex === 0) return true;
    
    const previousExperiment = experiments[experimentIndex - 1];
    if (!previousExperiment) return true;
    
    const previousProgress = getExperimentProgress(previousExperiment.id);
    return previousProgress?.status === "completed";
  };

  // Calculate overall progress
  const completedExperiments = experiments.filter(exp => {
    const prog = getExperimentProgress(exp.id);
    return prog?.status === "completed";
  }).length;

  const inProgressExperiments = experiments.filter(exp => {
    const prog = getExperimentProgress(exp.id);
    return prog?.status === "in_progress";
  }).length;

  const overallProgress = experiments.length > 0 ? (completedExperiments / experiments.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-muted">
      <Header title="实验流程">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/")}
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Button>
      </Header>

      <div className="p-6 space-y-6">
        {/* Experiment Overview */}
        <div className="gradient-header text-white rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-2">实验流程学习中心</h2>
          <p className="opacity-90 mb-4">6个核心实验环节，全流程实操体验跨境电商出口海外仓通关业务</p>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 opacity-75" />
              <span className="text-sm">已完成: {completedExperiments}个</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">进行中: {inProgressExperiments}个</span>
            </div>
            <div className="flex items-center space-x-2">
              <FlaskConical className="h-4 w-4 opacity-75" />
              <span className="text-sm">总计: {experiments.length}个</span>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>实验流程进度总览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Overall Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>总体完成度</span>
                  <span className="font-medium">{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>

              {/* Process Flow Visualization */}
              <div className="overflow-x-auto">
                <div className="flex items-center justify-between min-w-max space-x-4 py-4">
                  {experiments.slice(0, 6).map((experiment, index) => {
                    const experimentProgress = getExperimentProgress(experiment.id);
                    const isCompleted = experimentProgress?.status === "completed";
                    const isInProgress = experimentProgress?.status === "in_progress";
                    const isUnlocked = isExperimentUnlocked(experiment);
                    
                    return (
                      <div key={experiment.id} className="flex items-center">
                        <div className="flex flex-col items-center space-y-2 min-w-max">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                            isCompleted 
                              ? "bg-secondary text-white border-secondary" 
                              : isInProgress 
                                ? "bg-primary text-white border-primary"
                                : isUnlocked
                                  ? "bg-background border-border text-foreground"
                                  : "bg-muted border-muted text-muted-foreground"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="h-6 w-6" />
                            ) : isInProgress ? (
                              <Clock className="h-6 w-6" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-center max-w-24">
                              {experiment.name}
                            </p>
                            {experimentProgress && experimentProgress.progress > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {experimentProgress.progress}%
                              </p>
                            )}
                          </div>
                        </div>
                        {index < experiments.length - 1 && (
                          <div className="flex items-center mx-4">
                            <ArrowRight className={`h-5 w-5 ${
                              isCompleted ? "text-secondary" : "text-muted-foreground"
                            }`} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experiment Categories */}
        <div className="space-y-6">
          {/* Core Experiments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FlaskConical className="h-5 w-5" />
                <span>核心实验流程</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-6">
                按照真实跨境电商出口海外仓业务流程设计的6个核心实验，涵盖从前期准备到退税申报的完整链条。
              </p>
              
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
            </CardContent>
          </Card>

          {/* Experiment Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>实验学习指南</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">学习建议</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start space-x-2">
                        <Circle className="h-1 w-1 mt-2 flex-shrink-0 rounded-full bg-primary" />
                        <span>按照流程顺序逐步完成，每个实验都是下一步的基础</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Circle className="h-1 w-1 mt-2 flex-shrink-0 rounded-full bg-primary" />
                        <span>仔细阅读每个步骤的操作指导和注意事项</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Circle className="h-1 w-1 mt-2 flex-shrink-0 rounded-full bg-primary" />
                        <span>充分利用虚拟场景中的交互元素和帮助资料</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Circle className="h-1 w-1 mt-2 flex-shrink-0 rounded-full bg-primary" />
                        <span>遇到问题时可以重复练习或查看指导视频</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>评价标准</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">评分维度</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">步骤完整性</span>
                        <Badge variant="outline">40%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">材料准确性</span>
                        <Badge variant="outline">30%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">操作规范性</span>
                        <Badge variant="outline">20%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">完成时效</span>
                        <Badge variant="outline">10%</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">等级划分</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>优秀</span>
                        <span className="text-secondary font-medium">90-100分</span>
                      </div>
                      <div className="flex justify-between">
                        <span>良好</span>
                        <span className="text-primary font-medium">80-89分</span>
                      </div>
                      <div className="flex justify-between">
                        <span>合格</span>
                        <span className="text-accent font-medium">70-79分</span>
                      </div>
                      <div className="flex justify-between">
                        <span>待改进</span>
                        <span className="text-muted-foreground">70分以下</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => {
                    const nextExperiment = experiments.find(exp => {
                      const prog = getExperimentProgress(exp.id);
                      return !prog || prog.status === "not_started";
                    });
                    if (nextExperiment && isExperimentUnlocked(nextExperiment)) {
                      setSelectedExperiment(nextExperiment);
                    }
                  }}
                  data-testid="button-start-next"
                >
                  <FlaskConical className="h-6 w-6" />
                  <span>开始下一个实验</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => {
                    const inProgressExp = experiments.find(exp => {
                      const prog = getExperimentProgress(exp.id);
                      return prog?.status === "in_progress";
                    });
                    if (inProgressExp) {
                      setSelectedExperiment(inProgressExp);
                    }
                  }}
                  data-testid="button-continue-current"
                >
                  <Clock className="h-6 w-6" />
                  <span>继续当前实验</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => setLocation("/")}
                  data-testid="button-view-progress"
                >
                  <CheckCircle className="h-6 w-6" />
                  <span>查看学习进度</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Experiment Modal */}
      <ExperimentModal
        open={!!selectedExperiment}
        onOpenChange={(open) => !open && setSelectedExperiment(null)}
        experiment={selectedExperiment}
        progress={selectedExperiment ? getExperimentProgress(selectedExperiment.id) : undefined}
      />
    </div>
  );
}
