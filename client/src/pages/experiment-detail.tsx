import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FlaskConical, CheckCircle, Clock, AlertCircle, Users, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/layout/header";
import { CustomsQualificationForm } from "@/components/customs/customs-qualification-form";
import type { Experiment, StudentProgress } from "../types/index";

export default function ExperimentDetailPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [showCustomsForm, setShowCustomsForm] = useState(false);

  // Fetch experiment data
  const { data: experiments = [] } = useQuery<Experiment[]>({
    queryKey: ["/api/experiments"],
  });

  const { data: progress = [] } = useQuery<StudentProgress[]>({
    queryKey: ["/api/progress"],
  });

  const experiment = experiments?.find(exp => exp.id === id);
  const experimentProgress = progress?.find(p => p.experimentId === id);

  // 移除自动显示表单的逻辑，让用户先看到实验详情页

  // 如果数据还在加载中，显示加载状态
  if (!experiments || experiments.length === 0) {
    return (
      <div className="min-h-screen bg-muted">
        <Header title="实验详情">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/experiments")}
            data-testid="button-back-to-experiments"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回实验列表
          </Button>
        </Header>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载实验信息中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="min-h-screen bg-muted">
        <Header title="实验详情">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/experiments")}
            data-testid="button-back-to-experiments"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回实验列表
          </Button>
        </Header>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">实验未找到</h2>
            <p className="text-muted-foreground mb-6">请检查实验ID是否正确</p>
            <Button onClick={() => setLocation("/experiments")}>
              返回实验列表
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "已完成";
      case "in_progress": return "进行中";
      default: return "未开始";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  const handleStartExperiment = () => {
    if (experiment.name === "海关企业资质备案") {
      setShowCustomsForm(true);
    }
  };

  const handleExperimentComplete = (data: any) => {
    console.log("实验完成:", data);
    // 可以在这里处理实验完成逻辑，比如更新进度
    setShowCustomsForm(false);
    // 返回实验列表
    setTimeout(() => {
      setLocation("/experiments");
    }, 2000);
  };

  // 如果正在显示海关备案表单，直接渲染表单
  if (showCustomsForm && experiment.name === "海关企业资质备案") {
    return (
      <div className="min-h-screen bg-muted">
        <Header title="海关企业资质备案实验">
          <Button 
            variant="outline" 
            onClick={() => setShowCustomsForm(false)}
            data-testid="button-back-to-experiment"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回实验详情
          </Button>
        </Header>
        <div className="container mx-auto py-6">
          <CustomsQualificationForm
            onComplete={handleExperimentComplete}
            onCancel={() => setShowCustomsForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Header title="实验详情">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/experiments")}
          data-testid="button-back-to-experiments"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回实验列表
        </Button>
      </Header>

      <div className="container mx-auto py-8 space-y-6">
        {/* 实验基本信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FlaskConical className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{experiment.name}</CardTitle>
                  <p className="text-muted-foreground mt-2">{experiment.description}</p>
                </div>
              </div>
              <Badge className={getStatusColor(experimentProgress?.status || "not_started")}>
                {getStatusIcon(experimentProgress?.status || "not_started")}
                <span className="ml-1">{getStatusText(experimentProgress?.status || "not_started")}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">实验类别</h4>
                <p className="text-muted-foreground">{experiment.category}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">完成进度</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>进度</span>
                    <span>{experimentProgress?.progress || 0}%</span>
                  </div>
                  <Progress value={experimentProgress?.progress || 0} />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">预计时间</h4>
                <p className="text-muted-foreground">30-45分钟</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 核心实验流程 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FlaskConical className="h-5 w-5" />
              <span>核心实验流程</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-6">
              按照真实跨境电商出口海外仓业务流程设计的海关企业资质备案实验，涵盖完整的备案申请流程。
            </p>
            <div className="space-y-4">
              {experiment.steps && experiment.steps.length > 0 ? (
                experiment.steps.map((step, index) => (
                  <div key={step.id || index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{step.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                      {step.required && (
                        <Badge variant="outline" className="mt-2">必需</Badge>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {index < (experimentProgress?.currentStep || 0) ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : index === (experimentProgress?.currentStep || 0) ? (
                        <Clock className="h-5 w-5 text-blue-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">企业基本信息填写</h4>
                      <p className="text-sm text-muted-foreground mt-1">填写企业注册信息和联系方式，包括企业名称、统一社会信用代码、法定代表人等必要信息</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">经营范围确认</h4>
                      <p className="text-sm text-muted-foreground mt-1">选择企业进出口经营范围，确认业务类型和产品类别，完善联系人信息</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">3</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">上传备案材料</h4>
                      <p className="text-sm text-muted-foreground mt-1">提交相关证明文件，包括报关单位备案信息表、营业执照副本、法定代表人身份证等</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">4</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">确认提交申请</h4>
                      <p className="text-sm text-muted-foreground mt-1">核对所有填写信息和上传材料，确认数据准确性并承担法律责任，最终提交备案申请</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 开始实验按钮 */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleStartExperiment}
            disabled={experimentProgress?.status === "completed"}
            data-testid="button-start-experiment"
          >
            {experimentProgress?.status === "completed" ? "已完成" : 
             experimentProgress?.status === "in_progress" ? "继续实验" : "开始实验"}
          </Button>
        </div>
      </div>
    </div>
  );
}