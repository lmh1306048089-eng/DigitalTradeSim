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
import { EportIcCardForm } from "@/components/eport/eport-ic-card-form";
import { EnterpriseQualificationForm } from "@/components/enterprise/enterprise-qualification-form";
import { TransportIdForm } from "@/components/enterprise/transport-id-form";
import type { Experiment, StudentProgress } from "../types/index";

export default function ExperimentDetailPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [showCustomsForm, setShowCustomsForm] = useState(false);
  const [showEportForm, setShowEportForm] = useState(false);
  const [showEnterpriseQualificationForm, setShowEnterpriseQualificationForm] = useState(false);
  const [showTransportIdForm, setShowTransportIdForm] = useState(false);

  // 根据实验ID映射到对应的场景
  const getSceneFromExperimentId = (experimentId: string): string => {
    const experimentSceneMap: Record<string, string> = {
      '873e1fe1-0430-4f47-9db2-c4f00e2b048f': 'enterprise_scene', // 海关企业资质备案
      'b6566249-2b05-497a-9517-b09f2b7eaa97': 'enterprise_scene', // 电子口岸IC卡申请
      'enterprise-qualification-exp': 'enterprise_scene', // 电商企业资质备案
      'transport-id-application-exp': 'enterprise_scene', // 传输ID申请
    };
    return experimentSceneMap[experimentId] || 'overview';
  };

  // 构建返回场景的URL
  const getBackToSceneUrl = () => {
    if (!id) return '/';
    const sceneCode = getSceneFromExperimentId(id);
    if (sceneCode === 'overview') return '/';
    return `/?section=${sceneCode}`;
  };

  // Fetch experiment data
  const { data: experiments = [], isLoading: experimentsLoading, error: experimentsError } = useQuery<Experiment[]>({
    queryKey: ["/api/experiments"],
  });

  const { data: progress = [], isLoading: progressLoading, error: progressError } = useQuery<StudentProgress[]>({
    queryKey: ["/api/progress"],
  });

  const experiment = experiments?.find(exp => exp.id === id);
  const experimentProgress = progress?.find(p => p.experimentId === id);

  // 移除自动显示表单的逻辑，让用户先看到实验详情页

  // 检查认证错误
  const hasAuthError = experimentsError && experimentsError.message.includes('401');
  
  if (hasAuthError) {
    return (
      <div className="min-h-screen bg-muted">
        <Header title="实验详情">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/')}
            data-testid="button-back-home"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Button>
        </Header>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">登录已过期</h2>
            <p className="text-muted-foreground mb-6">请重新登录后继续使用</p>
            <Button onClick={() => setLocation('/login')}>
              重新登录
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 如果数据还在加载中，显示加载状态
  if (experimentsLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <Header title="实验详情">
          <Button 
            variant="outline" 
            onClick={() => setLocation(getBackToSceneUrl())}
            data-testid="button-back-to-scene"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回场景
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
            onClick={() => setLocation(getBackToSceneUrl())}
            data-testid="button-back-to-scene"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回场景
          </Button>
        </Header>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">实验未找到</h2>
            <p className="text-muted-foreground mb-6">请检查实验ID是否正确</p>
            <Button onClick={() => setLocation(getBackToSceneUrl())}>
              返回场景
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
    if (experiment?.name === "海关企业资质备案") {
      setShowCustomsForm(true);
    } else if (experiment?.name === "电子口岸IC卡申请") {
      setShowEportForm(true);
    } else if (experiment?.name === "电商企业资质备案") {
      setShowEnterpriseQualificationForm(true);
    } else if (experiment?.name === "传输ID申请") {
      setShowTransportIdForm(true);
    }
  };

  const handleExperimentComplete = (data: any) => {
    console.log("实验完成:", data);
    // 可以在这里处理实验完成逻辑，比如更新进度
    // 直接跳转到任务列表页，不显示中间的实验详情页
    setLocation(getBackToSceneUrl());
  };

  // 如果正在显示海关备案表单，直接渲染表单
  if (showCustomsForm && experiment?.name === "海关企业资质备案") {
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

  // 如果正在显示电子口岸IC卡申请表单，直接渲染表单
  if (showEportForm && experiment?.name === "电子口岸IC卡申请") {
    return (
      <div className="min-h-screen bg-muted">
        <Header title="电子口岸IC卡申请实验">
          <Button 
            variant="outline" 
            onClick={() => setShowEportForm(false)}
            data-testid="button-back-to-experiment"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回实验详情
          </Button>
        </Header>
        <div className="container mx-auto py-6">
          <EportIcCardForm
            onComplete={handleExperimentComplete}
            onCancel={() => setShowEportForm(false)}
          />
        </div>
      </div>
    );
  }

  // 如果正在显示电商企业资质备案表单，直接渲染表单
  if (showEnterpriseQualificationForm && experiment?.name === "电商企业资质备案") {
    return (
      <div className="min-h-screen bg-muted">
        <Header title="电商企业资质备案实验">
          <Button 
            variant="outline" 
            onClick={() => setShowEnterpriseQualificationForm(false)}
            data-testid="button-back-to-experiment"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回实验详情
          </Button>
        </Header>
        <div className="container mx-auto py-6">
          <EnterpriseQualificationForm
            onComplete={handleExperimentComplete}
            onCancel={() => setShowEnterpriseQualificationForm(false)}
          />
        </div>
      </div>
    );
  }

  // 如果正在显示传输ID申请表单，直接渲染表单
  if (showTransportIdForm && experiment?.name === "传输ID申请") {
    return (
      <div className="min-h-screen bg-muted">
        <Header title="传输ID申请实验">
          <Button 
            variant="outline" 
            onClick={() => setShowTransportIdForm(false)}
            data-testid="button-back-to-experiment"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回实验详情
          </Button>
        </Header>
        <div className="container mx-auto py-6">
          <TransportIdForm
            onComplete={handleExperimentComplete}
            onCancel={() => setShowTransportIdForm(false)}
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
          onClick={() => setLocation(getBackToSceneUrl())}
          className="hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
          data-testid="button-back-to-scene"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回场景
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
            {/* 说明文字 */}
            <div className="mb-8 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-700/50">
              <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                🎯 按照真实跨境电商出口海外仓业务流程设计的海关企业资质备案实验，涵盖完整的备案申请流程，通过模拟真实场景，让您掌握企业资质备案的核心技能。
              </p>
            </div>

            {/* 实验步骤卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* 第1步：企业基本信息填写 */}
              <div className="h-48 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-slate-700 flex flex-col hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                    <span className="text-lg font-bold text-white">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">企业基本信息填写</h4>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                      填写企业名称、统一社会信用代码、注册地址、经营范围等基础信息
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-center text-sm text-slate-700 dark:text-slate-300 font-medium">
                    📋 企业信息
                  </div>
                </div>
              </div>

              {/* 第2步：企业经营资质 */}
              <div className="h-48 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border border-emerald-200 dark:border-emerald-700 flex flex-col hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                    <span className="text-lg font-bold text-white">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-emerald-800 dark:text-emerald-100 mb-2">企业经营资质</h4>
                    <p className="text-emerald-700 dark:text-emerald-200 text-sm leading-relaxed">
                      提供企业营业执照、税务登记证、组织机构代码证相关资质证明
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-emerald-200 dark:border-emerald-700">
                  <div className="text-center text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                    📄 资质证明
                  </div>
                </div>
              </div>

              {/* 第3步：上传备案材料 */}
              <div className="h-48 p-4 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 border border-violet-200 dark:border-violet-700 flex flex-col hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-md">
                    <span className="text-lg font-bold text-white">3</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-violet-800 dark:text-violet-100 mb-2">上传备案材料</h4>
                    <p className="text-violet-700 dark:text-violet-200 text-sm leading-relaxed">
                      提交相关证明文件，包括报关单位备案信息表、营业执照副本、法定代表人身份证等
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-violet-200 dark:border-violet-700">
                  <div className="text-center text-sm text-violet-700 dark:text-violet-300 font-medium">
                    📤 文件上传
                  </div>
                </div>
              </div>

              {/* 第4步：确认提交申请 */}
              <div className="h-48 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border border-amber-200 dark:border-amber-700 flex flex-col hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                    <span className="text-lg font-bold text-white">4</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-amber-800 dark:text-amber-100 mb-2">确认提交申请</h4>
                    <p className="text-amber-700 dark:text-amber-200 text-sm leading-relaxed">
                      核对所有填写信息和上传材料，确认数据准确性并承担法律责任，最终提交备案申请
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-amber-200 dark:border-amber-700">
                  <div className="text-center text-sm text-amber-700 dark:text-amber-300 font-medium">
                    ✅ 备案提交
                  </div>
                </div>
              </div>
            </div>
              
            {/* 开始实验按钮 - 自然融入设计 */}
            <div className="mt-8 text-center">
              <Button 
                size="lg" 
                onClick={handleStartExperiment}
                disabled={experimentProgress?.status === "completed"}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-12 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                data-testid="button-start-experiment"
              >
                {experimentProgress?.status === "completed" ? (
                  <>
                    <CheckCircle className="mr-3 h-5 w-5" />
                    实验已完成
                  </>
                ) : experimentProgress?.status === "in_progress" ? (
                  <>
                    <Play className="mr-3 h-5 w-5" />
                    继续实验
                  </>
                ) : (
                  <>
                    <FlaskConical className="mr-3 h-5 w-5" />
                    开始实验
                  </>
                )}
              </Button>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                预计完成时间：30-45分钟
              </p>
            </div>
          </CardContent>
        </Card>

        </div>
      </div>
    </div>
  );
}