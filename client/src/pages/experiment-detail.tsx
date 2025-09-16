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
import { IcCardApplicationForm } from "@/components/customs/ic-card-application-form";
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
      'b2e8f3c1-1234-4567-8901-234567890abc': 'enterprise_scene', // 电子口岸IC卡申请
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

  // 检查认证错误 - 更健壮的错误检测
  const isAuthError = (error: any): boolean => {
    if (!error) return false;
    
    // Check for status code
    if (error.status === 401) return true;
    
    // Check for auth-related messages
    const message = error.message || '';
    return /访问令牌|未授权|刷新令牌|token|401/i.test(message);
  };

  const hasAuthError = isAuthError(experimentsError) || isAuthError(progressError);
  
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

  // 只有在没有加载中、没有认证错误且确实找不到实验时才显示"实验未找到"
  if (!experimentsLoading && !progressLoading && !hasAuthError && !experiment) {
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

  // 处理非认证错误
  if ((experimentsError && !isAuthError(experimentsError)) || (progressError && !isAuthError(progressError))) {
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
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">加载失败</h2>
            <p className="text-muted-foreground mb-6">数据加载时发生错误，请刷新页面重试</p>
            <Button onClick={() => window.location.reload()}>
              刷新页面
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

  // 步骤图标辅助函数
  const getStepIcon = (type: string) => {
    switch (type) {
      case 'form': return "📋";
      case 'upload': return "📄";
      case 'submit': return "✅";
      case 'instruction': return "📖";
      default: return "🔷";
    }
  };

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

  const getStepBorderColor = (index: number) => {
    const colors = [
      "border-blue-200 dark:border-blue-700",
      "border-green-200 dark:border-green-700",
      "border-purple-200 dark:border-purple-700",
      "border-orange-200 dark:border-orange-700",
      "border-teal-200 dark:border-teal-700",
      "border-rose-200 dark:border-rose-700"
    ];
    return colors[index % colors.length];
  };

  const getStepTextColor = (index: number) => {
    const colors = [
      "text-blue-800 dark:text-blue-100",
      "text-green-800 dark:text-green-100",
      "text-purple-800 dark:text-purple-100",
      "text-orange-800 dark:text-orange-100",
      "text-teal-800 dark:text-teal-100",
      "text-rose-800 dark:text-rose-100"
    ];
    return colors[index % colors.length];
  };

  const getStepDescColor = (index: number) => {
    const colors = [
      "text-blue-700 dark:text-blue-200",
      "text-green-700 dark:text-green-200",
      "text-purple-700 dark:text-purple-200",
      "text-orange-700 dark:text-orange-200",
      "text-teal-700 dark:text-teal-200",
      "text-rose-700 dark:text-rose-200"
    ];
    return colors[index % colors.length];
  };

  const getStepIconBgColor = (index: number) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-green-500 to-green-600",
      "from-purple-500 to-purple-600",
      "from-orange-500 to-orange-600",
      "from-teal-500 to-teal-600",
      "from-rose-500 to-rose-600"
    ];
    return colors[index % colors.length];
  };

  // 从实验元数据获取步骤配置
  const getExperimentSteps = () => {
    // 优先使用数据库中的实验步骤元数据
    if (experiment?.steps && Array.isArray(experiment.steps)) {
      return experiment.steps.map((step, index) => ({
        id: index + 1,
        title: step.title || `步骤 ${index + 1}`,
        description: step.description || "",
        icon: getStepIcon(step.type),
        iconText: step.title?.slice(0, 4) || `步骤${index + 1}`,
        bgColor: getStepBgColor(index),
        borderColor: getStepBorderColor(index),
        textColor: getStepTextColor(index),
        descColor: getStepDescColor(index),
        iconBgColor: getStepIconBgColor(index)
      }));
    }
    
    // 仅作为备用的硬编码步骤
    if (experiment?.name === "电子口岸IC卡申请") {
      return [
        {
          id: 1,
          title: "访问电子口岸平台",
          description: "登录中国电子口岸数据中心平台，进入电子口岸入网模块",
          icon: "🌐",
          iconText: "平台登录",
          bgColor: "from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30",
          borderColor: "border-blue-200 dark:border-blue-700",
          textColor: "text-blue-800 dark:text-blue-100",
          descColor: "text-blue-700 dark:text-blue-200",
          iconBgColor: "from-blue-500 to-blue-600"
        },
        {
          id: 2,
          title: "新企业申请入网",
          description: "在电子口岸入网模块中启动新企业申请入网操作流程",
          icon: "🏢",
          iconText: "入网申请",
          bgColor: "from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30",
          borderColor: "border-green-200 dark:border-green-700",
          textColor: "text-green-800 dark:text-green-100",
          descColor: "text-green-700 dark:text-green-200",
          iconBgColor: "from-green-500 to-green-600"
        },
        {
          id: 3,
          title: "填写企业基本信息",
          description: "完整填写企业名称、统一社会信用代码、注册地址、法定代表人等基本信息",
          icon: "📋",
          iconText: "信息填写",
          bgColor: "from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30",
          borderColor: "border-purple-200 dark:border-purple-700",
          textColor: "text-purple-800 dark:text-purple-100",
          descColor: "text-purple-700 dark:text-purple-200",
          iconBgColor: "from-purple-500 to-purple-600"
        },
        {
          id: 4,
          title: "提交营业执照",
          description: "上传企业营业执照副本复印件（加盖企业公章）",
          icon: "📄",
          iconText: "营业执照",
          bgColor: "from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30",
          borderColor: "border-orange-200 dark:border-orange-700",
          textColor: "text-orange-800 dark:text-orange-100",
          descColor: "text-orange-700 dark:text-orange-200",
          iconBgColor: "from-orange-500 to-orange-600"
        },
        {
          id: 5,
          title: "提交操作员身份证",
          description: "上传IC卡操作员身份证原件复印件",
          icon: "🆔",
          iconText: "身份证明",
          bgColor: "from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30",
          borderColor: "border-teal-200 dark:border-teal-700",
          textColor: "text-teal-800 dark:text-teal-100",
          descColor: "text-teal-700 dark:text-teal-200",
          iconBgColor: "from-teal-500 to-teal-600"
        },
        {
          id: 6,
          title: "提交备案证明材料",
          description: "上传海关签发的《报关人员备案证明》、《对外贸易经营者备案登记表》原件",
          icon: "📑",
          iconText: "备案证明",
          bgColor: "from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30",
          borderColor: "border-rose-200 dark:border-rose-700",
          textColor: "text-rose-800 dark:text-rose-100",
          descColor: "text-rose-700 dark:text-rose-200",
          iconBgColor: "from-rose-500 to-rose-600"
        },
        {
          id: 7,
          title: "提交备案回执",
          description: "上传海关进出口货物收发人备案回执等相关文件",
          icon: "📋",
          iconText: "备案回执",
          bgColor: "from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30",
          borderColor: "border-indigo-200 dark:border-indigo-700",
          textColor: "text-indigo-800 dark:text-indigo-100",
          descColor: "text-indigo-700 dark:text-indigo-200",
          iconBgColor: "from-indigo-500 to-indigo-600"
        },
        {
          id: 8,
          title: "完成IC卡申请办理",
          description: "确认所有材料无误后提交申请，完成电子口岸IC卡申请办理流程",
          icon: "✅",
          iconText: "申请完成",
          bgColor: "from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30",
          borderColor: "border-emerald-200 dark:border-emerald-700",
          textColor: "text-emerald-800 dark:text-emerald-100",
          descColor: "text-emerald-700 dark:text-emerald-200",
          iconBgColor: "from-emerald-500 to-emerald-600"
        }
      ];
    } else {
      // 默认为海关企业资质备案步骤
      return [
        {
          id: 1,
          title: "企业基本信息填写",
          description: "填写企业名称、统一社会信用代码、注册地址、经营范围等基础信息",
          icon: "📋",
          iconText: "企业信息",
          bgColor: "from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50",
          borderColor: "border-slate-200 dark:border-slate-700",
          textColor: "text-slate-800 dark:text-slate-100",
          descColor: "text-slate-600 dark:text-slate-300",
          iconBgColor: "from-blue-500 to-blue-600"
        },
        {
          id: 2,
          title: "企业经营资质",
          description: "提供企业营业执照、税务登记证、组织机构代码证相关资质证明",
          icon: "📄",
          iconText: "资质证明",
          bgColor: "from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30",
          borderColor: "border-emerald-200 dark:border-emerald-700",
          textColor: "text-emerald-800 dark:text-emerald-100",
          descColor: "text-emerald-700 dark:text-emerald-200",
          iconBgColor: "from-emerald-500 to-emerald-600"
        },
        {
          id: 3,
          title: "上传备案材料",
          description: "提交相关证明文件，包括报关单位备案信息表、营业执照副本、法定代表人身份证等",
          icon: "📤",
          iconText: "文件上传",
          bgColor: "from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30",
          borderColor: "border-violet-200 dark:border-violet-700",
          textColor: "text-violet-800 dark:text-violet-100",
          descColor: "text-violet-700 dark:text-violet-200",
          iconBgColor: "from-violet-500 to-violet-600"
        },
        {
          id: 4,
          title: "确认提交申请",
          description: "核对所有填写信息和上传材料，确认数据准确性并承担法律责任，最终提交备案申请",
          icon: "✅",
          iconText: "备案提交",
          bgColor: "from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30",
          borderColor: "border-amber-200 dark:border-amber-700",
          textColor: "text-amber-800 dark:text-amber-100",
          descColor: "text-amber-700 dark:text-amber-200",
          iconBgColor: "from-amber-500 to-amber-600"
        }
      ];
    }
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
          <IcCardApplicationForm
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

  // 确保experiment存在才渲染主要内容
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载中...</p>
          </div>
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
                {experiment?.name === "电子口岸IC卡申请" ? (
                  "🎯 用户在电商企业场景中，依照任务要求，模拟前往中国电子口岸数据中心平台办理IC卡。通过在电子口岸入网模块中进行新企业申请入网操作，提交营业执照、操作员身份证、报关人员备案证明、对外贸易经营者备案登记表及海关进出口货物收发人备案回执等文件，完成IC卡的申请办理。"
                ) : (
                  "🎯 按照真实跨境电商出口海外仓业务流程设计的海关企业资质备案实验，涵盖完整的备案申请流程，通过模拟真实场景，让您掌握企业资质备案的核心技能。"
                )}
              </p>
            </div>

            {/* 实验步骤卡片 */}
            <div className={`grid grid-cols-1 ${getExperimentSteps().length > 4 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'md:grid-cols-2'} gap-6 mb-8`}>
              {getExperimentSteps().map((step) => (
                <div 
                  key={step.id}
                  className={`min-h-[12rem] p-4 rounded-xl bg-gradient-to-br ${step.bgColor} border ${step.borderColor} flex flex-col hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer`}
                  data-testid={`step-iccard-${step.title}`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${step.iconBgColor} flex items-center justify-center shadow-md`}>
                      <span className="text-lg font-bold text-white">{step.id}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold text-lg ${step.textColor} mb-2`}>{step.title}</h4>
                      <p className={`${step.descColor} text-sm leading-relaxed`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className={`mt-auto pt-3 border-t ${step.borderColor}`}>
                    <div className={`text-center text-sm ${step.descColor} font-medium`}>
                      {step.icon} {step.iconText}
                    </div>
                  </div>
                </div>
              ))}
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