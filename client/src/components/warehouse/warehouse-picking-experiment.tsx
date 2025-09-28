import { useState, useCallback, useEffect, useMemo } from "react";
import { 
  Package, 
  CheckCircle, 
  Circle, 
  ArrowRight,
  Clock,
  Target,
  Award,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Square,
  BarChart3,
  Users,
  Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Import warehouse components
import { WarehouseEquipmentLearning } from "./warehouse-equipment-learning";
import { OrderProcessingArea } from "./order-processing-area";
import { PickingGuidanceSystem } from "./picking-guidance-system";
import { QualityInspectionArea } from "./quality-inspection-area";
import { PackagingArea } from "./packaging-area";
import { DeliveryLoadingArea } from "./delivery-loading-area";

// Types for warehouse picking experiment
interface ExperimentStep {
  stepNumber: number;
  stepName: string;
  title: string;
  description: string;
  component: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  timeSpent?: number;
  score?: number;
  efficiency?: number;
  errors?: number;
  stepData?: any;
}

interface WarehousePickingExperiment {
  id: string;
  userId: string;
  experimentId?: string;
  orderId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  currentStep: number;
  startedAt?: string;
  completedAt?: string;
  totalTimeSpent: number;
  overallScore: number;
  efficiency: number;
  accuracy: number;
  orderData: {
    id: string;
    items: any[];
    customer: any;
    shippingAddress: any;
    priority: string;
    totalValue: number;
    totalItems: number;
    estimatedWeight: number;
  };
}

interface WarehousePickingMetrics {
  totalItems: number;
  itemsPicked: number;
  itemsRejected: number;
  itemsPackaged: number;
  itemsLoaded: number;
  equipmentLearningTime: number;
  orderProcessingTime: number;
  pickingTime: number;
  qualityInspectionTime: number;
  packagingTime: number;
  loadingTime: number;
  totalDistance: number;
  scanAccuracy: number;
  packagingQuality: number;
  materialCost: number;
  operationalCost: number;
}

interface WarehousePickingExperimentProps {
  experimentId?: string; // If continuing existing experiment
  onComplete?: (results: {
    experiment: WarehousePickingExperiment;
    steps: ExperimentStep[];
    metrics: WarehousePickingMetrics;
  }) => void;
  onExit?: () => void;
}

// Sample order data for the experiment
const generateSampleOrderData = () => ({
  id: `ORD-${Date.now()}`,
  customer: {
    id: "CUST-789123",
    name: "张明华",
    email: "zhang.minghua@email.com",
    phone: "+86 138-0013-5678"
  },
  shippingAddress: {
    street: "浦东新区世纪大道123号",
    city: "上海",
    state: "上海",
    zipCode: "200120",
    country: "中国"
  },
  items: [
    {
      id: "ITEM-001",
      sku: "ELEC-PHONE-001",
      name: "智能手机保护壳",
      quantity: 2,
      location: "A1-B3-C2",
      zone: "电子产品区",
      price: 35.99,
      weight: 0.15,
      dimensions: "15×8×1cm",
      category: "电子配件"
    },
    {
      id: "ITEM-002", 
      sku: "HOME-TOWEL-003",
      name: "纯棉毛巾套装",
      quantity: 1,
      location: "B2-A1-D4",
      zone: "家居用品区",
      price: 28.50,
      weight: 0.8,
      dimensions: "35×25×5cm",
      category: "家居纺织"
    },
    {
      id: "ITEM-003",
      sku: "BOOK-EDU-045", 
      name: "英语学习词典",
      quantity: 1,
      location: "C3-B2-A1",
      zone: "图书区",
      price: 42.00,
      weight: 1.2,
      dimensions: "21×14×3cm",
      category: "教育图书"
    },
    {
      id: "ITEM-004",
      sku: "HEALTH-VIT-012",
      name: "维生素C片剂", 
      quantity: 3,
      location: "D1-C4-B2",
      zone: "保健品区",
      price: 19.99,
      weight: 0.3,
      dimensions: "8×8×6cm",
      category: "营养保健"
    }
  ],
  priority: "high" as const,
  status: "pending" as const,
  orderDate: new Date().toISOString(),
  totalValue: 186.46,
  totalItems: 7,
  estimatedWeight: 2.45
});

// Step definitions
const EXPERIMENT_STEPS: Omit<ExperimentStep, 'status' | 'startedAt' | 'completedAt' | 'timeSpent' | 'score' | 'efficiency' | 'errors' | 'stepData'>[] = [
  {
    stepNumber: 1,
    stepName: "equipment_learning",
    title: "设备学习",
    description: "学习仓储设备的使用方法和安全操作规程",
    component: "WarehouseEquipmentLearning"
  },
  {
    stepNumber: 2,
    stepName: "order_processing",
    title: "订单处理",
    description: "处理订单信息，准备拣货清单和推车",
    component: "OrderProcessingArea"
  },
  {
    stepNumber: 3,
    stepName: "picking_guidance",
    title: "拣货指导",
    description: "根据系统指导完成商品拣选任务",
    component: "PickingGuidanceSystem"
  },
  {
    stepNumber: 4,
    stepName: "quality_inspection", 
    title: "质量检验",
    description: "对拣选的商品进行质量检验和确认",
    component: "QualityInspectionArea"
  },
  {
    stepNumber: 5,
    stepName: "packaging",
    title: "包装作业",
    description: "选择合适的包装材料并完成商品包装",
    component: "PackagingArea"
  },
  {
    stepNumber: 6,
    stepName: "delivery_loading",
    title: "装载发货",
    description: "将包装好的商品装载到配送车辆",
    component: "DeliveryLoadingArea"
  },
  {
    stepNumber: 7,
    stepName: "completion",
    title: "实验完成",
    description: "查看实验结果和绩效分析",
    component: "CompletionSummary"
  }
];

export function WarehousePickingExperiment({ 
  experimentId,
  onComplete,
  onExit 
}: WarehousePickingExperimentProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State management
  const [experiment, setExperiment] = useState<WarehousePickingExperiment | null>(null);
  const [steps, setSteps] = useState<ExperimentStep[]>([]);
  const [metrics, setMetrics] = useState<WarehousePickingMetrics | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [stepStartTime, setStepStartTime] = useState<Date | null>(null);
  
  // Data flow between steps
  const [orderData, setOrderData] = useState(() => generateSampleOrderData());
  const [equipmentLearningData, setEquipmentLearningData] = useState<any>(null);
  const [orderProcessingData, setOrderProcessingData] = useState<any>(null);
  const [pickingData, setPickingData] = useState<any>(null);
  const [qualityData, setQualityData] = useState<any>(null);
  const [packagingData, setPackagingData] = useState<any>(null);
  const [deliveryData, setDeliveryData] = useState<any>(null);

  // Initialize experiment query
  const { data: existingExperiment, isLoading: isLoadingExperiment } = useQuery({
    queryKey: ['/api/warehouse-picking/experiments', experimentId],
    enabled: !!experimentId,
  });

  // Create experiment mutation
  const createExperimentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/warehouse-picking/experiments', data);
      return response.json();
    },
    onSuccess: (data) => {
      setExperiment(data.experiment);
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse-picking/experiments'] });
      toast({
        title: "实验已创建",
        description: "仓储拣货实验已成功创建，开始学习！"
      });
    },
    onError: (error: any) => {
      toast({
        title: "创建失败",
        description: error.message || "创建实验失败，请重试",
        variant: "destructive"
      });
    }
  });

  // Update experiment mutation
  const updateExperimentMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest('PATCH', `/api/warehouse-picking/experiments/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setExperiment(data.experiment);
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse-picking/experiments'] });
    }
  });

  // Complete step mutation
  const completeStepMutation = useMutation({
    mutationFn: async ({ experimentId, stepNumber, ...data }: any) => {
      const response = await apiRequest('PATCH', `/api/warehouse-picking/experiments/${experimentId}/steps/${stepNumber}/complete`, data);
      return response.json();
    },
    onSuccess: (data) => {
      const { step, nextStep } = data;
      
      // Update steps array
      setSteps(prev => prev.map(s => 
        s.stepNumber === step.stepNumber ? { ...s, ...step, status: 'completed' } : s
      ));
      
      // Move to next step if available
      if (nextStep && nextStep <= 7) {
        setCurrentStepIndex(nextStep - 1);
        setStepStartTime(new Date());
      } else {
        // Experiment completed
        handleExperimentComplete();
      }
      
      toast({
        title: "步骤完成",
        description: `${EXPERIMENT_STEPS[step.stepNumber - 1]?.title}已完成`
      });
    },
    onError: (error: any) => {
      toast({
        title: "步骤完成失败",
        description: error.message || "完成步骤时发生错误",
        variant: "destructive"
      });
    }
  });

  // Update metrics mutation
  const updateMetricsMutation = useMutation({
    mutationFn: async ({ experimentId, ...data }: any) => {
      const response = await apiRequest('POST', `/api/warehouse-picking/experiments/${experimentId}/metrics`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setMetrics(data.metrics);
    }
  });

  // Initialize experiment
  useEffect(() => {
    if (existingExperiment) {
      const experimentData = existingExperiment as WarehousePickingExperiment;
      setExperiment(experimentData);
      setCurrentStepIndex(Math.max(0, (experimentData.currentStep || 1) - 1));
      setIsStarted(experimentData.status !== 'not_started');
      
      if (experimentData.orderData) {
        setOrderData(experimentData.orderData as any);
      }
      
      // Initialize steps from existing data or create new ones
      const initialSteps: ExperimentStep[] = EXPERIMENT_STEPS.map(step => ({
        ...step,
        status: step.stepNumber <= (experimentData.currentStep || 1) ? 'completed' : 'pending'
      }));
      setSteps(initialSteps);
    } else {
      // Initialize steps for new experiment
      const initialSteps: ExperimentStep[] = EXPERIMENT_STEPS.map(step => ({
        ...step,
        status: step.stepNumber === 1 ? 'pending' : 'pending'
      }));
      setSteps(initialSteps);
    }
  }, [existingExperiment]);

  // Start experiment
  const handleStartExperiment = useCallback(async () => {
    if (!user) {
      toast({
        title: "认证失败",
        description: "请先登录后再开始实验",
        variant: "destructive"
      });
      return;
    }

    if (!experiment) {
      // Create new experiment
      createExperimentMutation.mutate({
        userId: user.id,
        orderId: orderData.id,
        orderData,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        currentStep: 1
      });
    } else {
      // Resume existing experiment
      updateExperimentMutation.mutate({
        id: experiment.id,
        status: 'in_progress',
        startedAt: experiment.startedAt || new Date().toISOString()
      });
    }
    
    setIsStarted(true);
    setStepStartTime(new Date());
  }, [user, experiment, orderData, createExperimentMutation, updateExperimentMutation, toast]);

  // Pause experiment
  const handlePauseExperiment = useCallback(() => {
    setIsPaused(!isPaused);
    toast({
      title: isPaused ? "实验已恢复" : "实验已暂停",
      description: isPaused ? "继续您的仓储拣货实验" : "实验已暂停，您可以随时恢复"
    });
  }, [isPaused]);

  // Complete step with data and metrics
  const handleStepComplete = useCallback((stepNumber: number, stepData: any, performance: any) => {
    if (!experiment) return;

    const timeSpent = stepStartTime ? 
      Math.round((new Date().getTime() - stepStartTime.getTime()) / 1000) : 0;

    completeStepMutation.mutate({
      experimentId: experiment.id,
      stepNumber,
      stepData,
      score: performance.score || 0,
      efficiency: performance.efficiency || 0,
      errors: performance.errors || 0,
      timeSpent
    });

    // Update metrics based on step
    const metricsUpdate = calculateMetricsForStep(stepNumber, stepData, performance, timeSpent);
    updateMetricsMutation.mutate({
      experimentId: experiment.id,
      ...metricsUpdate
    });
  }, [experiment, stepStartTime]);

  // Calculate metrics for completed step
  const calculateMetricsForStep = (stepNumber: number, stepData: any, performance: any, timeSpent: number) => {
    const updates: Partial<WarehousePickingMetrics> = {};
    
    switch (stepNumber) {
      case 1: // Equipment Learning
        updates.equipmentLearningTime = timeSpent;
        break;
      case 2: // Order Processing
        updates.orderProcessingTime = timeSpent;
        updates.totalItems = orderData.totalItems;
        break;
      case 3: // Picking
        updates.pickingTime = timeSpent;
        updates.itemsPicked = stepData?.itemsPicked || 0;
        updates.scanAccuracy = performance.scanAccuracy || 0;
        updates.totalDistance = stepData?.totalDistance || 0;
        break;
      case 4: // Quality Inspection
        updates.qualityInspectionTime = timeSpent;
        updates.itemsRejected = stepData?.itemsRejected || 0;
        break;
      case 5: // Packaging
        updates.packagingTime = timeSpent;
        updates.itemsPackaged = stepData?.itemsPackaged || 0;
        updates.packagingQuality = performance.packagingQuality || 0;
        updates.materialCost = stepData?.materialCost || 0;
        break;
      case 6: // Delivery Loading
        updates.loadingTime = timeSpent;
        updates.itemsLoaded = stepData?.itemsLoaded || 0;
        updates.operationalCost = stepData?.operationalCost || 0;
        break;
    }
    
    return updates;
  };

  // Handle experiment completion
  const handleExperimentComplete = useCallback(async () => {
    if (!experiment) return;

    const totalTime = steps.reduce((sum, step) => sum + (step.timeSpent || 0), 0);
    const averageScore = steps.length > 0 
      ? steps.reduce((sum, step) => sum + (step.score || 0), 0) / steps.length 
      : 0;
    const overallEfficiency = steps.length > 0 
      ? steps.reduce((sum, step) => sum + (step.efficiency || 0), 0) / steps.length 
      : 0;

    // Update final experiment status
    await updateExperimentMutation.mutateAsync({
      id: experiment.id,
      status: 'completed',
      completedAt: new Date(),
      totalTimeSpent: totalTime,
      overallScore: averageScore,
      efficiency: overallEfficiency,
      accuracy: calculateOverallAccuracy()
    });

    toast({
      title: "实验完成！",
      description: "恭喜您完成了仓储拣货实验，查看您的成绩吧！",
      duration: 5000
    });

    // Call onComplete callback
    if (onComplete && metrics) {
      onComplete({
        experiment: { ...experiment, status: 'completed' },
        steps,
        metrics
      });
    }
  }, [experiment, steps, metrics, onComplete]);

  // Calculate overall accuracy
  const calculateOverallAccuracy = useCallback(() => {
    if (!metrics) return 0;
    
    const accuracyFactors = [
      metrics.scanAccuracy || 0,
      metrics.packagingQuality || 0,
      // Add more accuracy factors as needed
    ].filter(f => f > 0);
    
    return accuracyFactors.length > 0 
      ? accuracyFactors.reduce((sum, factor) => sum + factor, 0) / accuracyFactors.length 
      : 0;
  }, [metrics]);

  // Step-specific callback handlers
  const handleEquipmentLearningComplete = useCallback((completionData: any) => {
    setEquipmentLearningData(completionData);
    handleStepComplete(1, completionData, {
      score: completionData.totalScore,
      efficiency: (completionData.completedEquipment.length / 6) * 100, // Assuming 6 total equipment
      errors: 0
    });
  }, [handleStepComplete]);

  const handleOrderProcessingComplete = useCallback((orderId: string, completionData: any) => {
    setOrderProcessingData(completionData);
    handleStepComplete(2, completionData, {
      score: 85, // Base score for order processing
      efficiency: 90,
      errors: 0
    });
  }, [handleStepComplete]);

  const handlePickingComplete = useCallback((completionData: any) => {
    setPickingData(completionData);
    handleStepComplete(3, completionData, {
      score: completionData.efficiency || 0,
      efficiency: completionData.efficiency || 0,
      errors: completionData.errors || 0,
      scanAccuracy: completionData.scanAccuracy || 0
    });
  }, [handleStepComplete]);

  const handleQualityInspectionComplete = useCallback((results: any) => {
    setQualityData(results);
    const approvedItems = results.filter((r: any) => r.overallStatus === 'passed').length;
    const totalItems = results.length;
    
    handleStepComplete(4, { 
      results,
      approvedItems,
      itemsRejected: totalItems - approvedItems 
    }, {
      score: (approvedItems / totalItems) * 100,
      efficiency: 95,
      errors: totalItems - approvedItems
    });
  }, [handleStepComplete]);

  const handlePackagingComplete = useCallback((sessions: any) => {
    setPackagingData(sessions);
    const totalCost = sessions.reduce((sum: number, s: any) => sum + (s.totalCost || 0), 0);
    const avgQuality = sessions.length > 0 
      ? sessions.reduce((sum: number, s: any) => sum + (s.sustainabilityScore || 0), 0) / sessions.length 
      : 0;
    
    handleStepComplete(5, {
      sessions,
      itemsPackaged: sessions.length,
      materialCost: totalCost
    }, {
      score: avgQuality,
      efficiency: 88,
      errors: 0,
      packagingQuality: avgQuality
    });
  }, [handleStepComplete]);

  const handleDeliveryLoadingComplete = useCallback((manifestId: string, manifest: any) => {
    setDeliveryData(manifest);
    
    handleStepComplete(6, {
      manifest,
      itemsLoaded: manifest.totalPackages || 0,
      operationalCost: manifest.estimatedCost || 0
    }, {
      score: 92,
      efficiency: 85,
      errors: 0
    });
  }, [handleStepComplete]);

  // Render current step component
  const renderCurrentStepComponent = () => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return null;

    const commonProps = {
      key: currentStep.stepNumber
    };

    switch (currentStep.component) {
      case 'WarehouseEquipmentLearning':
        return (
          <WarehouseEquipmentLearning 
            {...commonProps}
            onComplete={handleEquipmentLearningComplete}
            currentStep={currentStep.stepNumber}
          />
        );
      
      case 'OrderProcessingArea':
        return (
          <OrderProcessingArea 
            {...commonProps}
            orderData={orderData as any}
            onComplete={handleOrderProcessingComplete}
          />
        );
      
      case 'PickingGuidanceSystem':
        return (
          <PickingGuidanceSystem 
            {...commonProps}
            orderItems={orderData.items as any}
            onComplete={handlePickingComplete}
            orderId={orderData.id}
          />
        );
      
      case 'QualityInspectionArea':
        return (
          <QualityInspectionArea 
            {...commonProps}
            pickedItems={pickingData?.pickedItems || orderData.items as any}
            onComplete={handleQualityInspectionComplete}
            orderId={orderData.id}
          />
        );
      
      case 'PackagingArea':
        return (
          <PackagingArea 
            {...commonProps}
            approvedItems={qualityData || orderData.items as any}
            availablePackaging={[]} // Will be provided by component
            onComplete={handlePackagingComplete}
          />
        );
      
      case 'DeliveryLoadingArea':
        return (
          <DeliveryLoadingArea 
            {...commonProps}
            packagedItems={packagingData || []}
            availableVehicles={[]} // Will be provided by component
            onLoadingComplete={handleDeliveryLoadingComplete}
          />
        );
      
      case 'CompletionSummary':
        return (
          <CompletionSummary 
            experiment={experiment}
            steps={steps}
            metrics={metrics}
            onExit={onExit}
          />
        );
      
      default:
        return <div>Unknown step component: {currentStep.component}</div>;
    }
  };

  // Progress calculation
  const overallProgress = useMemo(() => {
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    return Math.round((completedSteps / EXPERIMENT_STEPS.length) * 100);
  }, [steps]);

  if (isLoadingExperiment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">加载实验数据...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" data-testid="warehouse-picking-experiment">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            仓储拣货实验
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            完成七个步骤的完整仓储拣货流程实训
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {experiment && (
            <Badge variant={experiment.status === 'completed' ? 'default' : 'secondary'}>
              {experiment.status === 'not_started' && '未开始'}
              {experiment.status === 'in_progress' && '进行中'}
              {experiment.status === 'completed' && '已完成'}
              {experiment.status === 'failed' && '失败'}
            </Badge>
          )}
          
          {isStarted && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePauseExperiment}
              data-testid="button-pause-experiment"
            >
              {isPaused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
              {isPaused ? '继续' : '暂停'}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Exit button clicked'); // Debug log
              toast({
                title: "按钮点击",
                description: "退出按钮被点击了",
              });
              setShowExitDialog(true);
            }}
            data-testid="button-exit-experiment"
          >
            <Square className="w-4 h-4 mr-1" />
            退出
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>实验进度</span>
            </CardTitle>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              步骤 {currentStepIndex + 1} / {EXPERIMENT_STEPS.length}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={overallProgress} className="h-2" />
          
          <div className="grid grid-cols-7 gap-2">
            {EXPERIMENT_STEPS.map((step, index) => {
              const stepState = steps[index];
              const isCurrent = index === currentStepIndex;
              const isCompleted = stepState?.status === 'completed';
              const isInProgress = stepState?.status === 'in_progress' || isCurrent;
              
              return (
                <div
                  key={step.stepNumber}
                  className={cn(
                    "relative p-3 rounded-lg border-2 transition-all",
                    isCompleted && "border-green-500 bg-green-50 dark:bg-green-950",
                    isInProgress && !isCompleted && "border-blue-500 bg-blue-50 dark:bg-blue-950",
                    !isCompleted && !isInProgress && "border-gray-300 bg-gray-50 dark:bg-gray-900"
                  )}
                  data-testid={`step-${step.stepNumber}`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {stepState?.timeSpent && `${Math.round(stepState.timeSpent / 60)}分钟`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {(experiment?.status === 'in_progress' || experiment?.status === 'completed') && metrics && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">总用时</div>
                  <div className="text-lg font-semibold">
                    {Math.round((experiment.totalTimeSpent || 0) / 60)}分钟
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">综合得分</div>
                  <div className="text-lg font-semibold">
                    {Math.round(experiment.overallScore || 0)}分
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">操作效率</div>
                  <div className="text-lg font-semibold">
                    {Math.round(experiment.efficiency || 0)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">准确率</div>
                  <div className="text-lg font-semibold">
                    {Math.round(experiment.accuracy || 0)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {!isStarted ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">开始仓储拣货实验</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              这个实验将带您体验完整的仓储拣货流程，包括设备学习、订单处理、商品拣选、质量检验、包装作业和装载发货。
            </p>
            <Button 
              size="lg"
              onClick={handleStartExperiment}
              disabled={createExperimentMutation.isPending}
              data-testid="button-start-experiment"
            >
              {createExperimentMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  正在创建...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  开始实验
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={cn("transition-opacity duration-200", isPaused && "opacity-50 pointer-events-none")}>
          {renderCurrentStepComponent()}
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 text-center">
            <Pause className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">实验已暂停</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              点击继续按钮恢复实验
            </p>
            <Button onClick={handlePauseExperiment}>
              <Play className="w-4 h-4 mr-2" />
              继续实验
            </Button>
          </Card>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认退出实验</DialogTitle>
            <DialogDescription>
              您确定要退出仓储拣货实验吗？您的进度将会保存，下次可以继续。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowExitDialog(false)}
            >
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setShowExitDialog(false);
                onExit?.();
              }}
              data-testid="button-confirm-exit"
            >
              确认退出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Completion Summary Component
function CompletionSummary({ 
  experiment, 
  steps, 
  metrics,
  onExit 
}: {
  experiment: WarehousePickingExperiment | null;
  steps: ExperimentStep[];
  metrics: WarehousePickingMetrics | null;
  onExit?: () => void;
}) {
  if (!experiment || !metrics) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">数据加载中</h2>
          <p className="text-gray-600 dark:text-gray-400">
            正在准备您的实验结果...
          </p>
        </CardContent>
      </Card>
    );
  }

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const totalTime = Math.round((experiment.totalTimeSpent || 0) / 60);
  
  return (
    <div className="space-y-6" data-testid="completion-summary">
      <Card className="text-center py-8">
        <CardContent>
          <Award className="w-20 h-20 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-3xl font-bold text-green-600 mb-2">
            实验完成！
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            恭喜您成功完成仓储拣货实验
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {completedSteps}/7
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              完成步骤
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {Math.round(experiment.overallScore || 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              综合得分
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {totalTime}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              总用时(分钟)
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {Math.round(experiment.efficiency || 0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              操作效率
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>详细分析</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Breakdown */}
            <div>
              <h4 className="font-semibold mb-3">各步骤用时分析</h4>
              <div className="space-y-2">
                {steps.filter(s => s.status === 'completed').map(step => (
                  <div key={step.stepNumber} className="flex justify-between items-center">
                    <span className="text-sm">{step.title}</span>
                    <span className="text-sm font-medium">
                      {Math.round((step.timeSpent || 0) / 60)}分钟
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div>
              <h4 className="font-semibold mb-3">操作指标</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">拣选准确率</span>
                  <span className="text-sm font-medium">
                    {Math.round(metrics.scanAccuracy || 0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">包装质量</span>
                  <span className="text-sm font-medium">
                    {Math.round(metrics.packagingQuality || 0)}分
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">移动距离</span>
                  <span className="text-sm font-medium">
                    {Math.round(Number(metrics.totalDistance) || 0)}米
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">材料成本</span>
                  <span className="text-sm font-medium">
                    ¥{Number(metrics.materialCost || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button 
          size="lg"
          onClick={onExit}
          data-testid="button-finish-experiment"
        >
          完成实验
        </Button>
      </div>
    </div>
  );
}

export default WarehousePickingExperiment;