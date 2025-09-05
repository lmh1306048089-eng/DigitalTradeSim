import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FlaskConical, CheckCircle, Clock, AlertCircle, Users, Play, Building } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/50">
      <Header title="实验详情">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/experiments")}
          className="hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
          data-testid="button-back-to-experiments"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回实验列表
        </Button>
      </Header>

      <div className="container mx-auto py-8 px-6 max-w-6xl">
        <div className="space-y-8">
        {/* 实验基本信息 */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/50 dark:from-slate-800 dark:to-blue-950/30">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                <div className="p-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <FlaskConical className="h-10 w-10 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold mb-3">{experiment.name}</CardTitle>
                  <p className="text-blue-100 text-lg leading-relaxed">{experiment.description || "专业的跨境电商实训体验，模拟真实业务场景，提升实践能力"}</p>
                </div>
              </div>
              <Badge className={`${getStatusColor(experimentProgress?.status || "not_started")} shadow-lg border-0 px-4 py-2 text-sm font-medium`}>
                {getStatusIcon(experimentProgress?.status || "not_started")}
                <span className="ml-2">{getStatusText(experimentProgress?.status || "not_started")}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border border-purple-200/50 dark:border-purple-700/50">
                <div className="p-3 rounded-lg bg-purple-600 text-white">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100">实验类别</h4>
                  <p className="text-purple-700 dark:text-purple-300 font-medium">{experiment.category}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-900/50 border border-green-200/50 dark:border-green-700/50">
                <div className="p-3 rounded-lg bg-green-600 text-white">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-100">完成进度</h4>
                  <div className="space-y-2 mt-1">
                    <div className="flex justify-between text-sm font-medium text-green-700 dark:text-green-300">
                      <span>当前进度</span>
                      <span>{experimentProgress?.progress || 0}%</span>
                    </div>
                    <Progress value={experimentProgress?.progress || 0} className="h-2" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border border-orange-200/50 dark:border-orange-700/50">
                <div className="p-3 rounded-lg bg-orange-600 text-white">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100">预计时间</h4>
                  <p className="text-orange-700 dark:text-orange-300 font-medium">30-45分钟</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 核心实验流程 */}
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 border-b border-slate-200 dark:border-slate-600">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <FlaskConical className="h-5 w-5" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">核心实验流程</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-700/50">
              <p className="text-blue-800 dark:text-blue-200 text-base leading-relaxed">
                🎯 按照真实跨境电商出口海外仓业务流程设计的海关企业资质备案实验，涵盖完整的备案申请流程。通过模拟真实场景，让您掌握企业资质备案的核心技能。
              </p>
            </div>
            <div className="space-y-8">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="group hover:scale-105 transition-all duration-300">
                    <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/50 dark:to-green-900/50 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                        <span className="text-lg font-bold text-white">1</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-emerald-900 dark:text-emerald-100 mb-2">企业基本信息填写</h4>
                        <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">填写企业注册信息和联系方式，包括企业名称、统一社会信用代码、法定代表人等必要信息</p>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">📋 信息收集</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group hover:scale-105 transition-all duration-300">
                    <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-900/50 rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                        <span className="text-lg font-bold text-white">2</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-2">经营范围确认</h4>
                        <p className="text-blue-700 dark:text-blue-300 leading-relaxed">选择企业进出口经营范围，确认业务类型和产品类别，完善联系人信息</p>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">🎯 范围选择</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group hover:scale-105 transition-all duration-300">
                    <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950/50 dark:to-violet-900/50 rounded-xl border border-purple-200/50 dark:border-purple-700/50 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                        <span className="text-lg font-bold text-white">3</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-purple-900 dark:text-purple-100 mb-2">上传备案材料</h4>
                        <p className="text-purple-700 dark:text-purple-300 leading-relaxed">提交相关证明文件，包括报关单位备案信息表、营业执照副本、法定代表人身份证等</p>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">📄 文件上传</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group hover:scale-105 transition-all duration-300">
                    <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/50 dark:to-amber-900/50 rounded-xl border border-orange-200/50 dark:border-orange-700/50 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                        <span className="text-lg font-bold text-white">4</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-orange-900 dark:text-orange-100 mb-2">确认提交申请</h4>
                        <p className="text-orange-700 dark:text-orange-300 leading-relaxed">核对所有填写信息和上传材料，确认数据准确性并承担法律责任，最终提交备案申请</p>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700">✅ 最终提交</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 开始实验按钮 - 紧接着实验流程 */}
              <div className="flex justify-center pt-6">
                <div className="text-center">
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-200/50 dark:border-blue-700/50 shadow-lg">
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">准备开始实验？</h3>
                    <p className="text-blue-700 dark:text-blue-300 mb-4 text-sm">点击下方按钮进入实训环境，体验真实的海关企业资质备案流程</p>
                    <Button 
                      size="lg" 
                      onClick={handleStartExperiment}
                      disabled={experimentProgress?.status === "completed"}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      data-testid="button-start-experiment"
                    >
                      {experimentProgress?.status === "completed" ? (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5" />
                          实验已完成
                        </>
                      ) : experimentProgress?.status === "in_progress" ? (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          继续实验
                        </>
                      ) : (
                        <>
                          <FlaskConical className="mr-2 h-5 w-5" />
                          开始实验
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        </div>
      </div>
    </div>
  );
}