import { useState, useCallback, useEffect, useMemo } from "react";
import { 
  Package, 
  CheckCircle, 
  Circle, 
  ArrowRight,
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
    queryFn: () => experimentId ? apiRequest(`/api/package-delivery/experiments/${experimentId}`) : null,
    enabled: !!experimentId
  });

  // Create new experiment mutation
  const createExperimentMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/package-delivery/experiments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
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
    mutationFn: ({ experimentId, ...data }: any) => 
      apiRequest(`/api/package-delivery/experiments/${experimentId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['package-delivery-experiment'] });
      refetch();
    }
  });

  // Complete step mutation
  const completeStepMutation = useMutation({
    mutationFn: (stepData: any) => 
      apiRequest(`/api/package-delivery/experiments/${experiment?.id}/steps`, {
        method: 'POST',
        body: JSON.stringify(stepData)
      }),
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
      senderName: "天猫旗舰店",
      recipientName: user.profile?.realName || user.username,
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

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="package-delivery-experiment">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">包裹签收体验</h1>
            <p className="text-muted-foreground">
              体验完整的包裹配送签收流程，学习快递接收的规范操作
            </p>
          </div>
          {onExit && (
            <Button variant="outline" onClick={onExit} data-testid="button-exit">
              退出实验
            </Button>
          )}
        </div>

        {experiment && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">实验信息</h3>
                  <p className="text-sm text-muted-foreground">
                    运单号: {experiment.trackingNumber}
                  </p>
                </div>
                <Badge variant={experiment.status === 'delivered' ? 'default' : 'secondary'}>
                  {experiment.status === 'delivered' ? '已完成' : 
                   experiment.status === 'out_for_delivery' ? '配送中' : '待配送'}
                </Badge>
              </div>
              
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>进度</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Experiment Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {DELIVERY_STEPS.map((step) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.stepNumber;
          const isCurrent = currentStep === step.stepNumber;
          const isNext = currentStep + 1 === step.stepNumber;

          return (
            <Card 
              key={step.stepNumber}
              className={cn(
                "relative transition-all duration-200",
                isCurrent && "ring-2 ring-primary shadow-lg",
                isCompleted && "bg-green-50 border-green-200"
              )}
              data-testid={`card-step-${step.stepNumber}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                    isCompleted ? "bg-green-500 text-white" :
                    isCurrent ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight mb-1">
                      {step.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!experiment ? (
          <Button 
            onClick={handleStartExperiment}
            disabled={createExperimentMutation.isPending}
            className="flex-1"
            data-testid="button-start-experiment"
          >
            {createExperimentMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            开始包裹签收体验
          </Button>
        ) : experiment.status !== 'delivered' ? (
          <Button 
            onClick={() => {
              setDialogType('step');
              setIsDialogOpen(true);
            }}
            className="flex-1"
            data-testid="button-continue-experiment"
          >
            继续当前步骤
          </Button>
        ) : (
          <div className="flex-1 text-center">
            <p className="text-green-600 font-medium">🎉 签收体验已完成！</p>
            <p className="text-sm text-muted-foreground mt-1">
              您已成功完成包裹配送签收的全部流程
            </p>
          </div>
        )}
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