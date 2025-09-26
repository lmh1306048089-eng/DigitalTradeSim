import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ArrowRight, 
  Package, 
  Truck, 
  FileText, 
  CheckCircle, 
  Clock,
  Building,
  Database,
  Send,
  Download,
  Upload,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BookingDataManager } from "./booking-data-manager";
import { LogisticsDataManager } from "./logistics-data-manager";
import { ListDataManager } from "./list-data-manager";

interface ListModeDeclarationPlatformProps {
  onComplete?: (data: any) => void;
  onCancel?: () => void;
}

type WorkflowStep = 'booking' | 'logistics' | 'list';

const stepConfig = {
  booking: {
    title: "推送订仓单数据",
    description: "下载模板并导入订仓单数据，推送至海关跨境电商出口统一版管理系统",
    icon: Package,
    bgColor: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400"
  },
  logistics: {
    title: "推送物流单数据", 
    description: "录入物流单数据，推送至海关跨境电商出口统一版管理系统",
    icon: Truck,
    bgColor: "bg-green-50 dark:bg-green-950",
    iconColor: "text-green-600 dark:text-green-400"
  },
  list: {
    title: "推送清单数据",
    description: "汇总清单数据并推送至海关系统，等待海关逻辑检验",
    icon: FileText,
    bgColor: "bg-purple-50 dark:bg-purple-950",
    iconColor: "text-purple-600 dark:text-purple-400"
  }
};

export function ListModeDeclarationPlatform({ onComplete, onCancel }: ListModeDeclarationPlatformProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('booking');
  const [declarationId, setDeclarationId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // 创建清单模式申报记录
  const createDeclarationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/export-declarations", {
        body: JSON.stringify({
          title: "清单模式出口申报",
          declarationMode: "manifest",
          status: "draft"
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('创建申报记录失败');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setDeclarationId(data.id);
      toast({
        title: "📋 申报记录已创建",
        description: "开始清单模式申报流程",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('创建申报记录失败:', error);
      toast({
        title: "创建失败",
        description: "创建申报记录失败，请点击重试",
        variant: "destructive",
      });
    }
  });

  // 初始化时创建申报记录
  useEffect(() => {
    if (!declarationId) {
      createDeclarationMutation.mutate();
    }
  }, []);

  const handleStepComplete = async (stepData: any) => {
    console.log(`步骤 ${currentStep} 完成:`, stepData);
    
    try {
      // 更新申报状态
      await apiRequest("PUT", `/api/export-declarations/${declarationId}`, {
        body: JSON.stringify({
          status: getNextStatus(currentStep)
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // 检查是否完成所有步骤
      if (currentStep === 'list') {
        toast({
          title: "🎉 清单模式申报完成",
          description: "所有数据已成功推送至海关系统",
          duration: 6000,
        });
        
        // 通知完成
        if (onComplete) {
          onComplete({
            declarationId,
            mode: "manifest",
            completedSteps: ['booking', 'logistics', 'list'],
            finalData: stepData
          });
        }
      } else {
        // 进入下一步
        const nextStep = getNextStep(currentStep);
        setCurrentStep(nextStep);
        
        toast({
          title: "✅ 步骤完成",
          description: `正在进入下一步：${stepConfig[nextStep].title}`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('更新申报状态失败:', error);
      toast({
        title: "状态更新失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const getNextStep = (step: WorkflowStep): WorkflowStep => {
    const steps: WorkflowStep[] = ['booking', 'logistics', 'list'];
    const currentIndex = steps.indexOf(step);
    return steps[currentIndex + 1] || step;
  };

  const getNextStatus = (step: WorkflowStep): string => {
    switch (step) {
      case 'booking':
        return 'booking_pushed';
      case 'logistics':
        return 'logistics_pushed';
      case 'list':
        return 'under_review';
      default:
        return 'draft';
    }
  };

  const calculateProgress = (): number => {
    const steps: WorkflowStep[] = ['booking', 'logistics', 'list'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const renderStepContent = () => {
    // Show loading state until declaration is created
    if (!declarationId) {
      if (createDeclarationMutation.isError) {
        return (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">创建申报记录失败</h3>
              <p className="text-muted-foreground mb-4">请检查网络连接后重试</p>
              <Button 
                onClick={() => createDeclarationMutation.mutate()}
                disabled={createDeclarationMutation.isPending}
                data-testid="button-retry-create-declaration"
              >
                重试
              </Button>
            </div>
          </div>
        );
      }
      
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {createDeclarationMutation.isPending ? "创建申报记录中..." : "初始化中..."}
            </p>
          </div>
        </div>
      );
    }

    // Only render step components after declaration is successfully created
    switch (currentStep) {
      case 'booking':
        return (
          <BookingDataManager 
            declarationId={declarationId}
            onComplete={handleStepComplete}
          />
        );
      case 'logistics':
        return (
          <LogisticsDataManager 
            declarationId={declarationId}
            onComplete={handleStepComplete}
          />
        );
      case 'list':
        return (
          <ListDataManager 
            declarationId={declarationId}
            onComplete={handleStepComplete}
          />
        );
      default:
        return null;
    }
  };

  const steps: WorkflowStep[] = ['booking', 'logistics', 'list'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-blue-950">
      {/* 头部导航 */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCancel}
                data-testid="button-back"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  清单模式申报
                </h1>
                <p className="text-sm text-muted-foreground">
                  跨境电商出口统一版管理系统
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
                进度: {Math.round(calculateProgress())}%
              </div>
              <Progress value={calculateProgress()} className="w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center space-x-8 mb-8">
          {steps.map((step, index) => {
            const isActive = step === currentStep;
            const isCompleted = steps.indexOf(currentStep) > index;
            const config = stepConfig[step];
            const IconComponent = config.icon;
            
            return (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted 
                      ? "bg-green-500 text-white" 
                      : isActive 
                        ? config.bgColor + " " + config.iconColor + " ring-2 ring-offset-2 ring-blue-500"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <IconComponent className="h-6 w-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      "text-sm font-medium",
                      isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {config.title}
                    </div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-16 h-0.5 mx-4 transition-colors duration-300",
                    isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 pb-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className={cn(
            "text-center transition-colors duration-300",
            stepConfig[currentStep].bgColor
          )}>
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                stepConfig[currentStep].iconColor,
                "bg-white dark:bg-gray-800"
              )}>
                {(() => {
                  const IconComponent = stepConfig[currentStep].icon;
                  return <IconComponent className="h-4 w-4" />;
                })()}
              </div>
              <CardTitle className="text-xl">
                {stepConfig[currentStep].title}
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              {stepConfig[currentStep].description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}