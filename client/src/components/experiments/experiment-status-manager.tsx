import { useState } from "react";
import { Play, FileText, CheckCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExperimentResultViewer } from "./experiment-result-viewer";
import type { Experiment, StudentProgress } from "../../types/index";

interface ExperimentStatusManagerProps {
  experiment: Experiment;
  progress?: StudentProgress;
  onStartExperiment: () => void;
  onBackToScene: () => void;
  children?: React.ReactNode; // 用于渲染实验表单内容
}

export function ExperimentStatusManager({
  experiment,
  progress,
  onStartExperiment,
  onBackToScene,
  children
}: ExperimentStatusManagerProps) {
  const [showResults, setShowResults] = useState(false);

  // 获取状态显示信息
  const getStatusInfo = () => {
    const status = progress?.status || "not_started";
    
    switch (status) {
      case "not_started":
        return {
          icon: <Play className="h-5 w-5 text-blue-600" />,
          title: "准备开始",
          description: "您还没有开始这个实验",
          badgeVariant: "secondary" as const,
          badgeText: "未开始"
        };
      case "in_progress":
        return {
          icon: <FileText className="h-5 w-5 text-orange-600" />,
          title: "正在进行",
          description: "您的实验正在进行中",
          badgeVariant: "default" as const,
          badgeText: "进行中"
        };
      case "submitted":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          title: "已提交",
          description: "您已成功提交实验结果",
          badgeVariant: "secondary" as const,
          badgeText: "已提交"
        };
      case "completed":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          title: "已完成",
          description: "实验已完成并获得评价",
          badgeVariant: "secondary" as const,
          badgeText: "已完成"
        };
      default:
        return {
          icon: <Play className="h-5 w-5 text-gray-600" />,
          title: "未知状态",
          description: "实验状态未知",
          badgeVariant: "secondary" as const,
          badgeText: "未知"
        };
    }
  };

  // 处理重启实验
  const handleRestart = () => {
    setShowResults(false);
    // 触发父组件的重启逻辑（会重新获取数据）
  };

  // 获取步骤图标
  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'introduction': return "📖";
      case 'form': return "📋";  
      case 'upload': return "📄";
      case 'submit': return "✅";
      case 'instruction': return "📖";
      default: return "🔷";
    }
  };

  // 获取步骤背景色
  const getStepBgColor = (index: number) => {
    const colors = [
      "from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30",
      "from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30",
      "from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30",
      "from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30",
      "from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30",
      "from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30"
    ];
    return colors[index % colors.length];
  };

  const statusInfo = getStatusInfo();
  const currentStatus = progress?.status || "not_started";

  // 如果正在显示结果或状态为已提交/已完成，显示结果查看器
  if (showResults || currentStatus === "submitted" || currentStatus === "completed") {
    return (
      <ExperimentResultViewer
        experimentId={experiment.id}
        experimentName={experiment.name}
        onRestart={handleRestart}
        onBackToScene={onBackToScene}
      />
    );
  }

  // 如果状态为进行中且有子组件（实验表单），显示子组件
  if (currentStatus === "in_progress" && children) {
    return <>{children}</>;
  }

  // 默认显示实验介绍页面
  return (
    <div className="space-y-6">
      {/* 实验状态卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {statusInfo.icon}
              <div>
                <CardTitle className="flex items-center gap-2">
                  {experiment.name}
                  <Badge variant={statusInfo.badgeVariant}>{statusInfo.badgeText}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusInfo.description}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* 显示进度条 */}
        {progress && progress.progress > 0 && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>完成进度</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
            </div>
          </CardContent>
        )}
      </Card>

      {/* 实验描述 */}
      <Card>
        <CardHeader>
          <CardTitle>实验介绍</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {experiment.description || "这是一个数字贸易实训实验，通过实际操作帮助您掌握相关技能。"}
          </p>
          
          {/* 实验信息 */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <span className="font-medium">实验类别：</span>
              <span className="text-muted-foreground">{experiment.category}</span>
            </div>
            <div>
              <span className="font-medium">难度等级：</span>
              <span className="text-muted-foreground">中级</span>
            </div>
            <div>
              <span className="font-medium">预计用时：</span>
              <span className="text-muted-foreground">30-45 分钟</span>
            </div>
            <div>
              <span className="font-medium">完成条件：</span>
              <span className="text-muted-foreground">完成所有步骤</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 实验步骤预览 */}
      {experiment.steps && experiment.steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>实验步骤</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {experiment.steps.map((step, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border bg-gradient-to-r ${getStepBgColor(index)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-medium border">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{getStepIcon(step.type)}</span>
                        <h4 className="font-medium">{step.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">准备好了吗？</h4>
              <p className="text-sm text-muted-foreground">
                {currentStatus === "not_started" 
                  ? "点击开始按钮开始您的实验之旅"
                  : currentStatus === "in_progress"
                  ? "继续完成您的实验"
                  : "您可以查看提交结果或重新开始"
                }
              </p>
            </div>
            <div className="flex gap-3">
              {currentStatus === "not_started" && (
                <Button
                  onClick={onStartExperiment}
                  data-testid="button-start-experiment"
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  开始实验
                </Button>
              )}

              {currentStatus === "in_progress" && (
                <Button
                  onClick={onStartExperiment}
                  data-testid="button-continue-experiment"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  继续实验
                </Button>
              )}

              {(currentStatus === "submitted" || currentStatus === "completed") && (
                <Button
                  onClick={() => setShowResults(true)}
                  data-testid="button-view-results"
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  查看结果
                </Button>
              )}

              <Button 
                variant="outline" 
                onClick={onBackToScene}
                data-testid="button-back-to-scene"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                返回场景
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}