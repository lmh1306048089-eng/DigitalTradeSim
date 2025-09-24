import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { ExperimentStatusManager } from "@/components/experiments/experiment-status-manager";
import { CustomsQualificationForm } from "@/components/customs/customs-qualification-form";
import { IcCardApplicationForm } from "@/components/customs/ic-card-application-form";
import { EnterpriseQualificationForm } from "@/components/enterprise/enterprise-qualification-form";
import { TransportIdForm } from "@/components/enterprise/transport-id-form";
import { OverseasWarehouseForm } from "@/components/enterprise/overseas-warehouse-form";
import { CustomsDeclarationExportForm } from "@/components/declaration/customs-declaration-export-form";
import { CrossBorderEcommercePlatform } from "@/components/declaration/cross-border-ecommerce-platform";
import { apiRequest } from "@/lib/queryClient";
import type { Experiment, StudentProgress } from "../types/index";

export default function ExperimentDetailPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 简化状态管理 - 只需要一个状态控制表单显示
  const [activeForm, setActiveForm] = useState<string | null>(null);

  // 根据实验ID映射到对应的场景
  const getSceneFromExperimentId = (experimentId: string): string => {
    const experimentSceneMap: Record<string, string> = {
      // 电商企业场景实验
      "exp001": "enterprise_scene",
      "exp002": "enterprise_scene", 
      "exp003": "enterprise_scene",
      // 海关场景实验  
      "exp004": "customs_scene",
      "exp005": "customs_scene",
      // 报关单实验
      "exp006": "customs_scene"
    };
    return experimentSceneMap[experimentId] || "enterprise_scene";
  };

  // 生成返回场景的URL
  const getBackToSceneUrl = () => {
    if (!id) return "/scenes";
    const sceneId = getSceneFromExperimentId(id);
    return `/scenes/${sceneId}`;
  };

  // 获取实验数据
  const { data: experiment, isLoading: experimentLoading, error: experimentError } = useQuery<Experiment>({
    queryKey: ["/api/experiments", id],
    enabled: !!id
  });

  // 获取进度数据
  const { data: experimentProgress, isLoading: progressLoading } = useQuery<StudentProgress>({
    queryKey: ["/api/progress", id],
    enabled: !!id
  });

  // 实验启动处理 - 正确的状态驱动模式
  const handleStartExperiment = async () => {
    if (!id || !experiment) return;
    
    const formMap: Record<string, string> = {
      "海关企业资质备案": "customs-qualification",
      "电子口岸IC卡申请": "eport-ic-card",
      "电商企业资质备案": "enterprise-qualification",
      "传输ID申请": "transport-id",
      "海外仓业务模式备案": "overseas-warehouse",
      "报关单模式出口申报": "cross-border-platform"
    };
    
    const formType = formMap[experiment.name];
    if (!formType) return;
    
    try {
      // 使用apiRequest发起进度更新
      const response = await apiRequest('POST', '/api/progress', {
        experimentId: id,
        status: 'in_progress',
        progress: 0
      });
      
      if (response.ok) {
        // 使缓存失效，触发重新获取
        await queryClient.invalidateQueries({
          queryKey: ["/api/progress", id],
        });
        await queryClient.invalidateQueries({
          queryKey: ["/api/experiments", id],
        });
        
        // 设置表单显示状态
        setActiveForm(formType);
        
        toast({
          title: "实验已开始",
          description: "您可以开始填写实验表单了",
        });
      } else {
        throw new Error('更新进度失败');
      }
    } catch (error: any) {
      toast({
        title: "启动实验失败",
        description: error.message || "无法启动实验，请稍后重试",
        variant: "destructive",
      });
    }
  };

  // 实验完成处理
  const handleExperimentComplete = (data: any) => {
    console.log("实验完成:", data);
    setActiveForm(null); // 关闭表单
    // 让ExperimentStatusManager处理状态变化
  };

  // 渲染对应的实验表单组件
  const renderExperimentForm = () => {
    if (!activeForm) return null;
    
    switch (activeForm) {
      case "customs-qualification":
        return (
          <CustomsQualificationForm
            onComplete={handleExperimentComplete}
            onCancel={() => setActiveForm(null)}
          />
        );
      case "eport-ic-card":
        return (
          <IcCardApplicationForm
            onComplete={handleExperimentComplete}
            onCancel={() => setActiveForm(null)}
          />
        );
      case "enterprise-qualification":
        return (
          <EnterpriseQualificationForm
            onComplete={handleExperimentComplete}
            onCancel={() => setActiveForm(null)}
          />
        );
      case "transport-id":
        return (
          <TransportIdForm
            onComplete={handleExperimentComplete}
            onCancel={() => setActiveForm(null)}
          />
        );
      case "overseas-warehouse":
        return (
          <OverseasWarehouseForm
            onComplete={handleExperimentComplete}
            onCancel={() => setActiveForm(null)}
          />
        );
      case "cross-border-platform":
        return (
          <CrossBorderEcommercePlatform
            onComplete={handleExperimentComplete}
            onCancel={() => setActiveForm(null)}
          />
        );
      default:
        return null;
    }
  };

  // 加载状态
  if (experimentLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="text-xl font-semibold mt-4">加载中...</h2>
            <p className="text-muted-foreground">正在获取实验数据</p>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (experimentError || !experiment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="container mx-auto py-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation(getBackToSceneUrl())}
            className="flex items-center gap-2"
            data-testid="button-back-to-scene"
          >
            <ArrowLeft className="h-4 w-4" />
            返回场景
          </Button>
        </div>

        {/* 主要内容 */}
        <div className="max-w-4xl mx-auto">
          {activeForm ? (
            // 显示实验表单
            renderExperimentForm()
          ) : (
            // 显示状态管理器
            <ExperimentStatusManager
              experiment={experiment}
              progress={experimentProgress}
              onStartExperiment={handleStartExperiment}
              onBackToScene={() => setLocation(getBackToSceneUrl())}
            />
          )}
        </div>
      </div>
    </div>
  );
}