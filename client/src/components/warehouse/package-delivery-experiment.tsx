import { useState, useCallback, useEffect, useMemo } from "react";
import { 
  Package, 
  CheckCircle, 
  Circle, 
  ArrowRight,
  ArrowLeft,
  Clock,
  Bell,
  User,
  Home,
  Truck,
  ClipboardCheck,
  PhoneCall,
  DoorOpen,
  PenTool,
  Star,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ExperimentResultsDisplay } from "./experiment-results-display";

// Types for package delivery experiment
interface DeliveryStep {
  stepNumber: number;
  stepName: string;
  type: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  timeSpent?: number;
  score?: number;
  efficiency?: number;
  stepData?: any;
  location?: string;
}

interface DeliveryNotification {
  id: string;
  experimentId: string;
  notificationType: string;
  notificationContent: string;
  status: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  respondedAt?: Date;
  responseData?: any;
}

interface PackageDeliveryExperiment {
  id: string;
  userId: string;
  trackingNumber: string;
  senderName: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  packageDescription: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
  currentStep: number;
  createdAt: string;
  deliveredAt?: string;
  totalTimeSpent: number;
  customerSatisfaction: number;
  deliveryRating: number;
  packageCondition: string;
}

// Step configuration for delivery process
const DELIVERY_STEPS = [
  {
    stepNumber: 1,
    stepName: "notification_received",
    type: "notification",
    title: "收到包裹通知",
    description: "您收到了包裹配送通知，快递员即将送达",
    icon: Bell,
    color: "bg-blue-500"
  },
  {
    stepNumber: 2,
    stepName: "courier_arrival",
    type: "interaction",
    title: "快递员到达",
    description: "快递员已到达您的地址，正在呼叫",
    icon: Truck,
    color: "bg-orange-500"
  },
  {
    stepNumber: 3,
    stepName: "identity_verification",
    type: "verification",
    title: "身份确认",
    description: "确认您的身份信息并验证包裹信息",
    icon: User,
    color: "bg-purple-500"
  },
  {
    stepNumber: 4,
    stepName: "package_inspection",
    type: "inspection",
    title: "包裹检查",
    description: "检查包裹外观是否完好无损",
    icon: Package,
    color: "bg-green-500"
  },
  {
    stepNumber: 5,
    stepName: "signing_confirmation",
    type: "signing",
    title: "签收确认",
    description: "确认收到包裹并进行电子签名",
    icon: PenTool,
    color: "bg-red-500"
  },
  {
    stepNumber: 6,
    stepName: "satisfaction_rating",
    type: "evaluation",
    title: "服务评价",
    description: "对配送服务进行评价和反馈",
    icon: Star,
    color: "bg-yellow-500"
  }
];

interface PackageDeliveryExperimentProps {
  experimentId?: string;
  onComplete?: () => void;
  onExit?: () => void;
}

export function PackageDeliveryExperiment({ experimentId, onComplete, onExit }: PackageDeliveryExperimentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [experiment, setExperiment] = useState<PackageDeliveryExperiment | null>(null);
  const [steps, setSteps] = useState<DeliveryStep[]>([]);
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'start' | 'step' | 'complete'>('start');
  const [stepStartTime, setStepStartTime] = useState<Date | null>(null);
  const [experimentStartTime, setExperimentStartTime] = useState<Date | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [experimentResult, setExperimentResult] = useState<any>(null);

  // Form states for different steps
  const [verificationData, setVerificationData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [inspectionData, setInspectionData] = useState({
    condition: 'good',
    notes: '',
    damageReported: false
  });
  const [signatureData, setSignatureData] = useState({
    signature: '',
    signedBy: '',
    signatureTime: new Date()
  });
  const [ratingData, setRatingData] = useState({
    overallRating: 5,
    courierRating: 5,
    speedRating: 5,
    conditionRating: 5,
    feedback: ''
  });

  // Fetch experiment data
  const { data: experimentData, isLoading, refetch } = useQuery({
    queryKey: ['package-delivery-experiment', experimentId],
    queryFn: async () => {
      if (!experimentId) return null;
      const response = await apiRequest('GET', `/api/package-delivery/experiments/${experimentId}`);
      return response.json();
    },
    enabled: !!experimentId
  });

  // Create new experiment mutation
  const createExperimentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/package-delivery/experiments', data);
      return response.json();
    },
    onSuccess: (response: any) => {
      setExperiment(response.experiment);
      setExperimentStartTime(new Date());
      
      // Initialize steps state from DELIVERY_STEPS configuration
      const initialSteps = DELIVERY_STEPS.map(stepConfig => ({
        stepNumber: stepConfig.stepNumber,
        stepName: stepConfig.stepName,
        type: stepConfig.type,
        description: stepConfig.description,
        status: stepConfig.stepNumber === 1 ? 'in_progress' as const : 'pending' as const,
        startedAt: stepConfig.stepNumber === 1 ? new Date() : undefined,
        completedAt: undefined,
        timeSpent: undefined,
        score: undefined,
        efficiency: undefined,
        stepData: undefined
      }));
      setSteps(initialSteps);
      
      toast({
        title: "包裹配送实验已开始",
        description: "您将体验完整的包裹签收流程"
      });
      setDialogType('step');
      setIsDialogOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: "创建实验失败",
        description: error.message || "请稍后重试",
        variant: "destructive"
      });
    }
  });

  // Update experiment mutation
  const updateExperimentMutation = useMutation({
    mutationFn: async ({ experimentId, ...data }: any) => {
      const response = await apiRequest('PATCH', `/api/package-delivery/experiments/${experimentId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['package-delivery-experiment'] });
      refetch();
    }
  });

  // Complete step mutation
  const completeStepMutation = useMutation({
    mutationFn: async (stepData: any) => {
      const response = await apiRequest('POST', `/api/package-delivery/experiments/${experiment?.id}/steps`, stepData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['package-delivery-experiment'] });
      refetch();
    }
  });

  // Handle experiment data loading
  useEffect(() => {
    if (experimentData) {
      setExperiment(experimentData.experiment);
      setSteps(experimentData.steps || []);
      setNotifications(experimentData.notifications || []);
      setCurrentStep(experimentData.experiment.currentStep || 1);
    }
  }, [experimentData]);

  // Start new experiment
  const handleStartExperiment = useCallback(() => {
    if (!user) return;

    const newExperimentData = {
      trackingNumber: `SF${Date.now()}`,
      packageId: `PKG${Date.now()}`,
      senderName: "天猫旗舰店",
      recipientName: user.username,
      recipientPhone: "138****8888",
      recipientAddress: "上海市浦东新区张江高科技园区创业路1000号",
      packageDescription: "服装鞋包 - 运动鞋",
      status: "out_for_delivery" as const
    };

    createExperimentMutation.mutate(newExperimentData);
  }, [user, createExperimentMutation]);

  // Handle step completion
  const handleCompleteStep = useCallback((stepNumber: number, stepData: any) => {
    if (!experiment) return;

    const timeSpent = stepStartTime ? Date.now() - stepStartTime.getTime() : 0;
    const stepConfig = DELIVERY_STEPS.find(s => s.stepNumber === stepNumber);

    const completeStepData = {
      stepNumber,
      stepName: stepConfig?.stepName || `step_${stepNumber}`,
      status: 'completed' as const,
      startedAt: stepStartTime,
      completedAt: new Date(),
      timeSpent: Math.round(timeSpent / 1000), // Convert to seconds
      stepData: stepData,
      score: calculateStepScore(stepNumber, stepData),
      efficiency: calculateStepEfficiency(timeSpent)
    };

    completeStepMutation.mutate(completeStepData);

    // Move to next step or complete experiment
    if (stepNumber < DELIVERY_STEPS.length) {
      setCurrentStep(stepNumber + 1);
      setStepStartTime(new Date());
      setDialogType('step');
    } else {
      // Complete experiment
      const totalTime = experimentStartTime ? Date.now() - experimentStartTime.getTime() : 0;
      updateExperimentMutation.mutate({
        experimentId: experiment.id,
        status: 'delivered',
        currentStep: stepNumber,
        deliveredAt: new Date(),
        totalTimeSpent: Math.round(totalTime / 1000),
        customerSatisfaction: ratingData.overallRating,
        deliveryRating: (ratingData.courierRating + ratingData.speedRating + ratingData.conditionRating) / 3,
        packageCondition: inspectionData.condition
      });
      
      // Generate experiment results
      generateExperimentResults(Math.round(totalTime / 1000));
      
      setDialogType('complete');
      toast({
        title: "包裹签收完成",
        description: "您已成功完成包裹配送体验！"
      });
    }
  }, [experiment, stepStartTime, experimentStartTime, completeStepMutation, updateExperimentMutation, ratingData, inspectionData]);

  // Calculate step score based on performance
  const calculateStepScore = (stepNumber: number, stepData: any): number => {
    switch (stepNumber) {
      case 1: // Notification response time
        return stepData.responseTime < 30 ? 100 : Math.max(60, 100 - stepData.responseTime);
      case 2: // Courier interaction
        return stepData.politeResponse ? 100 : 80;
      case 3: // Identity verification accuracy
        return stepData.accurateInfo ? 100 : 70;
      case 4: // Package inspection thoroughness
        return stepData.thoroughInspection ? 100 : 85;
      case 5: // Signing process
        return stepData.signatureProvided ? 100 : 90;
      case 6: // Rating provided
        return stepData.feedbackProvided ? 100 : 95;
      default:
        return 90;
    }
  };

  // Calculate step efficiency
  const calculateStepEfficiency = (timeSpent: number): number => {
    const targetTime = 60000; // 1 minute target
    if (timeSpent <= targetTime) return 100;
    return Math.max(50, 100 - ((timeSpent - targetTime) / 1000));
  };

  // Generate experiment results for display
  const generateExperimentResults = (totalTimeSpent: number) => {
    if (!experiment || !user) return;

    // Calculate overall metrics from actual user performance
    const completedSteps = steps.filter(step => step.status === 'completed');
    const totalSteps = DELIVERY_STEPS.length;
    const completionRate = (completedSteps.length / totalSteps) * 100;
    
    const averageScore = completedSteps.length > 0 
      ? completedSteps.reduce((sum, step) => sum + (step.score || 0), 0) / completedSteps.length 
      : 0;
    const averageEfficiency = completedSteps.length > 0
      ? completedSteps.reduce((sum, step) => sum + (step.efficiency || 0), 0) / completedSteps.length
      : 0;
    
    // Calculate actual mistakes from step data
    const totalRealMistakes = calculateActualMistakes();
    
    // Calculate overall accuracy without arbitrary floor - reflect true performance
    const overallAccuracy = Math.max(0, Math.min(100, 100 - (totalRealMistakes * 5)));

    // Generate step results based on actual user performance
    const stepResults = DELIVERY_STEPS.map((stepConfig) => {
      const stepData = steps.find(s => s.stepNumber === stepConfig.stepNumber);
      const timeSpent = stepData?.timeSpent || 0;
      const targetTime = 45; // Target 45 seconds per step
      const actualScore = stepData?.score || 0;
      const actualEfficiency = stepData?.efficiency || 0;
      
      // Calculate actual accuracy from step performance
      const stepMistakes = getStepMistakes(stepConfig.stepNumber, stepData);
      const stepAccuracy = Math.max(0, Math.min(100, 100 - (stepMistakes.length * 15)));
      
      const isOptimal = stepData?.status === 'completed' && 
                       timeSpent <= targetTime && 
                       actualScore >= 90 && 
                       stepMistakes.length === 0;
      
      return {
        stepNumber: stepConfig.stepNumber,
        stepName: stepConfig.stepName,
        stepTitle: stepConfig.title,
        completedAt: stepData?.completedAt || new Date(),
        timeSpent,
        score: actualScore,
        efficiency: actualEfficiency,
        accuracy: stepAccuracy,
        targetTime,
        isOptimal,
        mistakes: stepMistakes,
        recommendations: generateStepRecommendations(stepConfig.stepNumber, stepMistakes)
      };
    });

    // Determine performance level
    let performanceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner';
    if (averageScore >= 95) performanceLevel = 'expert';
    else if (averageScore >= 85) performanceLevel = 'advanced';
    else if (averageScore >= 75) performanceLevel = 'intermediate';

    const result = {
      experimentId: experiment.id,
      userId: user.id,
      experimentType: 'package_delivery' as const,
      startedAt: experimentStartTime || new Date(),
      completedAt: new Date(),
      totalTimeSpent,
      overallScore: Math.round(averageScore),
      overallEfficiency: Math.round(averageEfficiency),
      overallAccuracy: Math.round(overallAccuracy),
      customerSatisfaction: ratingData.overallRating,
      deliveryRating: (ratingData.courierRating + ratingData.speedRating + ratingData.conditionRating) / 3,
      stepResults,
      strengths: generateStrengths(averageScore, averageEfficiency),
      improvements: generateImprovements(calculateActualMistakes(), totalTimeSpent),
      nextRecommendations: generateNextRecommendations(performanceLevel),
      performanceLevel,
      ranking: {
        userRank: Math.floor(Math.random() * 20) + 1,
        totalUsers: 50,
        percentile: Math.max(10, Math.min(90, averageScore))
      }
    };

    setExperimentResult(result);
    setTimeout(() => setShowResults(true), 2000); // Show results after 2 seconds
  };

  // Calculate actual mistakes from user performance
  const calculateActualMistakes = (): number => {
    let totalMistakes = 0;
    
    // Check verification data accuracy
    if (!verificationData.name || !verificationData.phone) {
      totalMistakes += 2; // Missing required fields
    }
    
    // Check inspection thoroughness
    if (inspectionData.condition === 'damaged' && !inspectionData.notes) {
      totalMistakes += 1; // Reported damage but no details
    }
    
    // Check signature completeness
    if (!signatureData.signature || !signatureData.signedBy) {
      totalMistakes += 1; // Incomplete signature process
    }
    
    // Check rating completeness
    if (ratingData.overallRating < 3 && !ratingData.feedback) {
      totalMistakes += 1; // Low rating without feedback
    }
    
    return totalMistakes;
  };

  // Get actual mistakes for a specific step
  const getStepMistakes = (stepNumber: number, stepData: any): string[] => {
    const mistakes: string[] = [];
    
    switch (stepNumber) {
      case 1: // Notification response
        if (stepData?.timeSpent > 60) {
          mistakes.push('响应通知速度较慢');
        }
        break;
        
      case 2: // Courier interaction
        if (stepData?.stepData?.responseType === 'request_wait') {
          mistakes.push('可以更主动地接收包裹');
        }
        break;
        
      case 3: // Identity verification
        if (!verificationData.name) mistakes.push('姓名未填写');
        if (!verificationData.phone) mistakes.push('电话号码未填写');
        break;
        
      case 4: // Package inspection
        if (inspectionData.condition === 'damaged' && !inspectionData.notes) {
          mistakes.push('包裹损坏但未详细说明');
        }
        break;
        
      case 5: // Signing
        if (!signatureData.signature) mistakes.push('未提供电子签名');
        if (!signatureData.signedBy) mistakes.push('未填写签收人信息');
        break;
        
      case 6: // Rating
        if (ratingData.overallRating < 3 && !ratingData.feedback) {
          mistakes.push('低评分但未提供具体反馈');
        }
        break;
    }
    
    return mistakes;
  };

  const generateStepRecommendations = (stepNumber: number, mistakes: string[] = []): string[] => {
    const recommendations = [
      ['及时查看配送通知', '保持手机通讯畅通'],
      ['准备好身份证件', '确认配送地址准确'],
      ['仔细核对个人信息', '确保信息准确无误'],
      ['全面检查包裹外观', '发现问题及时反馈'],
      ['仔细阅读签收条款', '确认无误后签名'],
      ['提供真实客观评价', '帮助改进服务质量']
    ];
    
    return recommendations[stepNumber - 1] || [];
  };

  const generateStrengths = (score: number, efficiency: number): string[] => {
    const strengths = [];
    if (score >= 90) strengths.push('签收操作规范准确，表现优秀');
    if (efficiency >= 85) strengths.push('完成效率高，时间控制良好');
    if (inspectionData.condition === 'good') strengths.push('包裹检查仔细认真');
    if (ratingData.overallRating >= 4) strengths.push('客户服务评价积极正面');
    
    return strengths.length > 0 ? strengths : ['基本完成了签收流程的各个步骤'];
  };

  const generateImprovements = (mistakes: number, timeSpent: number): string[] => {
    const improvements = [];
    if (mistakes > 2) improvements.push('减少操作失误，提高准确性');
    if (timeSpent > 400) improvements.push('优化操作流程，提高效率');
    if (verificationData.name === '' || verificationData.phone === '') {
      improvements.push('完善身份信息填写');
    }
    
    return improvements.length > 0 ? improvements : ['继续保持良好的操作习惯'];
  };

  const generateNextRecommendations = (level: string): string[] => {
    const recommendations = {
      beginner: [
        '多练习包裹签收流程，熟悉各个步骤',
        '学习快递服务相关知识和规范',
        '观看更多配送签收指导视频'
      ],
      intermediate: [
        '提高操作速度和准确性',
        '学习处理特殊情况的应对方法',
        '了解不同类型包裹的处理要求'
      ],
      advanced: [
        '掌握复杂配送场景的处理技巧',
        '学习客户沟通和服务技能',
        '参与更高级的物流培训课程'
      ],
      expert: [
        '分享经验帮助其他学员提高',
        '挑战更复杂的物流管理实验',
        '考虑从事相关专业工作'
      ]
    };
    
    return recommendations[level as keyof typeof recommendations] || recommendations.beginner;
  };

  // Get current step configuration
  const currentStepConfig = useMemo(() => {
    return DELIVERY_STEPS.find(step => step.stepNumber === currentStep);
  }, [currentStep]);

  // Calculate overall progress
  const progress = useMemo(() => {
    return ((currentStep - 1) / DELIVERY_STEPS.length) * 100;
  }, [currentStep]);

  // Render step content
  const renderStepContent = () => {
    if (!currentStepConfig) return null;

    switch (currentStepConfig.stepName) {
      case 'notification_received':
        return (
          <div className="space-y-4" data-testid="notification-step">
            <div className="text-center">
              <Bell className="h-16 w-16 mx-auto text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold">包裹配送通知</h3>
              <p className="text-muted-foreground mt-2">
                您有一个包裹即将送达，快递员正在前往您的地址
              </p>
            </div>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{experiment?.packageDescription}</p>
                    <p className="text-sm text-muted-foreground">运单号: {experiment?.trackingNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Home className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">收货地址</p>
                    <p className="text-sm text-muted-foreground">{experiment?.recipientAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                onClick={() => handleCompleteStep(1, { responseTime: 15, notificationRead: true })}
                className="flex-1"
                data-testid="button-acknowledge-notification"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                已收到通知
              </Button>
            </div>
          </div>
        );

      case 'courier_arrival':
        return (
          <div className="space-y-4" data-testid="arrival-step">
            <div className="text-center">
              <Truck className="h-16 w-16 mx-auto text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold">快递员到达</h3>
              <p className="text-muted-foreground mt-2">
                快递员已到达您的地址门口，正在呼叫
              </p>
            </div>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <PhoneCall className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">快递员通话</p>
                    <p className="text-sm text-muted-foreground">
                      "您好，我是顺丰快递员，您的包裹已送达，请开门签收"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => handleCompleteStep(2, { responseType: 'request_wait', politeResponse: true })}
                className="flex-1"
                data-testid="button-request-wait"
              >
                请稍等，马上来
              </Button>
              <Button 
                onClick={() => handleCompleteStep(2, { responseType: 'open_door', politeResponse: true })}
                className="flex-1"
                data-testid="button-open-door"
              >
                <DoorOpen className="h-4 w-4 mr-2" />
                立即开门
              </Button>
            </div>
          </div>
        );

      case 'identity_verification':
        return (
          <div className="space-y-4" data-testid="verification-step">
            <div className="text-center">
              <User className="h-16 w-16 mx-auto text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold">身份确认</h3>
              <p className="text-muted-foreground mt-2">
                请确认您的身份信息，快递员将核实包裹信息
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="recipient-name">收件人姓名</Label>
                <Input 
                  id="recipient-name"
                  value={verificationData.name}
                  onChange={(e) => setVerificationData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入您的姓名"
                  data-testid="input-recipient-name"
                />
              </div>
              <div>
                <Label htmlFor="recipient-phone">联系电话</Label>
                <Input 
                  id="recipient-phone"
                  value={verificationData.phone}
                  onChange={(e) => setVerificationData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="请输入您的电话号码"
                  data-testid="input-recipient-phone"
                />
              </div>
            </div>

            <Button 
              onClick={() => handleCompleteStep(3, { 
                verificationData, 
                accurateInfo: verificationData.name && verificationData.phone 
              })}
              disabled={!verificationData.name || !verificationData.phone}
              className="w-full"
              data-testid="button-confirm-identity"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              确认身份信息
            </Button>
          </div>
        );

      case 'package_inspection':
        return (
          <div className="space-y-4" data-testid="inspection-step">
            <div className="text-center">
              <Package className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">包裹检查</h3>
              <p className="text-muted-foreground mt-2">
                请检查包裹外观是否完好，有无破损或异常
              </p>
            </div>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <Label>包裹外观状态</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={inspectionData.condition === 'good' ? 'default' : 'outline'}
                        onClick={() => setInspectionData(prev => ({ ...prev, condition: 'good' }))}
                        className="flex-1"
                        data-testid="button-condition-good"
                      >
                        完好无损
                      </Button>
                      <Button
                        variant={inspectionData.condition === 'damaged' ? 'default' : 'outline'}
                        onClick={() => setInspectionData(prev => ({ ...prev, condition: 'damaged', damageReported: true }))}
                        className="flex-1"
                        data-testid="button-condition-damaged"
                      >
                        有损坏
                      </Button>
                    </div>
                  </div>
                  
                  {inspectionData.condition === 'damaged' && (
                    <div>
                      <Label htmlFor="damage-notes">损坏说明</Label>
                      <Textarea 
                        id="damage-notes"
                        value={inspectionData.notes}
                        onChange={(e) => setInspectionData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="请描述包裹损坏情况..."
                        data-testid="textarea-damage-notes"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => handleCompleteStep(4, { 
                inspectionData, 
                thoroughInspection: true 
              })}
              className="w-full"
              data-testid="button-complete-inspection"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              确认包裹状态
            </Button>
          </div>
        );

      case 'signing_confirmation':
        return (
          <div className="space-y-4" data-testid="signing-step">
            <div className="text-center">
              <PenTool className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold">签收确认</h3>
              <p className="text-muted-foreground mt-2">
                请确认收到包裹并提供您的签名
              </p>
            </div>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="signature">电子签名</Label>
                    <Input 
                      id="signature"
                      value={signatureData.signature}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, signature: e.target.value }))}
                      placeholder="请输入您的姓名作为电子签名"
                      data-testid="input-signature"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signed-by">签收人</Label>
                    <Input 
                      id="signed-by"
                      value={signatureData.signedBy}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, signedBy: e.target.value }))}
                      placeholder="本人/代收人姓名"
                      data-testid="input-signed-by"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => handleCompleteStep(5, { 
                signatureData: { ...signatureData, signatureTime: new Date() }, 
                signatureProvided: !!signatureData.signature && !!signatureData.signedBy 
              })}
              disabled={!signatureData.signature || !signatureData.signedBy}
              className="w-full"
              data-testid="button-confirm-signature"
            >
              <PenTool className="h-4 w-4 mr-2" />
              确认签收
            </Button>
          </div>
        );

      case 'satisfaction_rating':
        return (
          <div className="space-y-4" data-testid="rating-step">
            <div className="text-center">
              <Star className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <h3 className="text-lg font-semibold">服务评价</h3>
              <p className="text-muted-foreground mt-2">
                请对本次配送服务进行评价，您的反馈对我们很重要
              </p>
            </div>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {[
                    { key: 'overallRating', label: '整体满意度' },
                    { key: 'courierRating', label: '快递员服务态度' },
                    { key: 'speedRating', label: '配送速度' },
                    { key: 'conditionRating', label: '包裹完整性' }
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label>{label}</Label>
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            variant="ghost"
                            size="sm"
                            onClick={() => setRatingData(prev => ({ ...prev, [key]: rating }))}
                            className="p-1"
                            data-testid={`button-rating-${key}-${rating}`}
                          >
                            <Star 
                              className={cn(
                                "h-5 w-5",
                                rating <= (ratingData as any)[key] ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              )} 
                            />
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div>
                    <Label htmlFor="feedback">其他反馈（可选）</Label>
                    <Textarea 
                      id="feedback"
                      value={ratingData.feedback}
                      onChange={(e) => setRatingData(prev => ({ ...prev, feedback: e.target.value }))}
                      placeholder="请分享您的配送体验..."
                      data-testid="textarea-feedback"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => handleCompleteStep(6, { 
                ratingData, 
                feedbackProvided: true 
              })}
              className="w-full"
              data-testid="button-submit-rating"
            >
              <Star className="h-4 w-4 mr-2" />
              提交评价
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  // Start step timer when dialog opens
  useEffect(() => {
    if (isDialogOpen && dialogType === 'step') {
      setStepStartTime(new Date());
    }
  }, [isDialogOpen, dialogType]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show results page if experiment is completed
  if (showResults && experimentResult) {
    return (
      <ExperimentResultsDisplay
        result={experimentResult}
        onRetry={() => {
          setShowResults(false);
          setExperimentResult(null);
          setExperiment(null);
          setSteps([]);
          setCurrentStep(1);
        }}
        onContinue={() => {
          setShowResults(false);
          if (onComplete) onComplete();
        }}
        onClose={() => {
          setShowResults(false);
          if (onExit) onExit();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" data-testid="package-delivery-experiment">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    包裹签收体验
                  </h1>
                  <p className="text-lg text-gray-600 font-medium">
                    智能物流 · 数字化签收流程
                  </p>
                </div>
              </div>
              <p className="text-gray-500 max-w-2xl leading-relaxed">
                体验完整的包裹配送签收流程，掌握现代物流接收的标准化操作流程，提升服务质量和用户体验
              </p>
            </div>
            {onExit && (
              <Button 
                variant="outline" 
                onClick={onExit} 
                className="border-gray-200 hover:border-gray-300 shadow-sm"
                data-testid="button-exit"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                退出实验
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">

        {experiment && (
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">实验信息</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      运单号: {experiment.trackingNumber}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {experiment.createdAt && new Date(experiment.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Badge 
                  variant={experiment.status === 'delivered' ? 'default' : 'secondary'}
                  className="text-sm px-3 py-1"
                >
                  {experiment.status === 'delivered' ? '已完成' : 
                   experiment.status === 'out_for_delivery' ? '配送中' : '待配送'}
                </Badge>
              </div>
              
              {/* Enhanced Progress bar */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">完成进度</span>
                  <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-gray-100" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>已完成 {currentStep - 1} 步</span>
                  <span>共 {DELIVERY_STEPS.length} 步</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experiment Steps */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">签收流程步骤</h2>
            <p className="text-gray-600">跟随以下步骤完成包裹签收体验，每个步骤都有详细的操作指引</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DELIVERY_STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.stepNumber;
              const isCurrent = currentStep === step.stepNumber;
              const isNext = currentStep + 1 === step.stepNumber;

              return (
                <Card 
                  key={step.stepNumber}
                  className={cn(
                    "relative group transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                    "bg-white/90 backdrop-blur-sm border-2",
                    isCompleted && "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-green-100",
                    isCurrent && "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-blue-200 ring-2 ring-blue-200",
                    !isCompleted && !isCurrent && "border-gray-200 hover:border-gray-300"
                  )}
                  data-testid={`card-step-${step.stepNumber}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center",
                        "transition-all duration-300 shadow-lg",
                        isCompleted 
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200" :
                        isCurrent 
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-200" :
                          "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 group-hover:from-gray-200 group-hover:to-gray-300"
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="h-7 w-7" />
                        ) : isCurrent ? (
                          <div className="relative">
                            <Icon className="h-7 w-7" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                          </div>
                        ) : (
                          <Icon className="h-7 w-7" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-bold px-2 py-1 rounded-full",
                            isCompleted ? "bg-green-100 text-green-700" :
                            isCurrent ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-600"
                          )}>
                            步骤 {step.stepNumber}
                          </span>
                          {isCurrent && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium animate-pulse">
                              进行中
                            </span>
                          )}
                        </div>
                        <h4 className={cn(
                          "font-bold text-base leading-tight",
                          isCompleted ? "text-green-900" :
                          isCurrent ? "text-blue-900" :
                          "text-gray-900"
                        )}>
                          {step.title}
                        </h4>
                        <p className={cn(
                          "text-sm leading-relaxed",
                          isCompleted ? "text-green-700" :
                          isCurrent ? "text-blue-700" :
                          "text-gray-600"
                        )}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Step completion indicator */}
                    {isCompleted && (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">已完成</span>
                        </div>
                      </div>
                    )}
                    
                    {isCurrent && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Clock className="h-4 w-4 animate-pulse" />
                          <span className="font-medium">当前步骤</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {!experiment ? '开始您的包裹签收体验' : '继续实验流程'}
            </h3>
            <p className="text-gray-600">
              {!experiment 
                ? '点击下方按钮开始完整的包裹签收流程体验' 
                : experiment.status === 'delivered' 
                  ? '恭喜！您已完成所有签收步骤' 
                  : '继续当前步骤，完成您的签收体验'
              }
            </p>
          </div>

          <div className="flex justify-center">
            {!experiment ? (
              <Button 
                onClick={handleStartExperiment}
                disabled={createExperimentMutation.isPending}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                data-testid="button-start-experiment"
              >
                {createExperimentMutation.isPending ? (
                  <RefreshCw className="h-6 w-6 mr-3 animate-spin" />
                ) : (
                  <Play className="h-6 w-6 mr-3" />
                )}
                开始包裹签收体验
              </Button>
            ) : experiment.status !== 'delivered' ? (
              <Button 
                onClick={() => {
                  setDialogType('step');
                  setIsDialogOpen(true);
                }}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                data-testid="button-continue-experiment"
              >
                <ArrowRight className="h-6 w-6 mr-3" />
                继续当前步骤
              </Button>
            ) : (
              <div className="text-center py-6">
                <div className="mb-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">🎉 签收体验已完成！</h3>
                  <p className="text-gray-600 text-lg">
                    您已成功完成包裹配送签收的全部流程
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 inline-block">
                  <p className="text-sm text-green-700 font-medium">
                    所有步骤均已完成，感谢您的参与！
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        </div>
      </div>

      {/* Step Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-step">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'complete' ? '签收完成' : currentStepConfig?.title}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'complete' 
                ? '恭喜您完成包裹签收体验！' 
                : `步骤 ${currentStep}/${DELIVERY_STEPS.length}`
              }
            </DialogDescription>
          </DialogHeader>
          
          {dialogType === 'step' && renderStepContent()}
          
          {dialogType === 'complete' && (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">签收成功！</h3>
              <p className="text-muted-foreground mb-4">
                您已成功完成包裹配送签收流程，体验了从通知接收到服务评价的完整过程。
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                  data-testid="button-close-dialog"
                >
                  关闭
                </Button>
                {onComplete && (
                  <Button 
                    onClick={() => {
                      setIsDialogOpen(false);
                      onComplete();
                    }}
                    className="flex-1"
                    data-testid="button-complete-experiment"
                  >
                    完成体验
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}