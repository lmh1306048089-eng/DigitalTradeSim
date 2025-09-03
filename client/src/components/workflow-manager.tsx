import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Play, CheckCircle, Clock, Users, FileText, Truck, Package, DollarSign, Building, RefreshCw, Settings } from 'lucide-react';
import { getAuthTokens, clearAuthTokens } from '@/lib/auth';
import { WorkflowOperationModal } from './workflow-operation-modal';

interface WorkflowInstance {
  id: string;
  workflowCode: string;
  businessRoleCode: string;
  currentStep: number;
  status: string;
  stepData: any;
  collaborators: any;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowStep {
  stepNumber: number;
  title: string;
  description: string;
  requiredRole: string;
  inputFields: any[];
  outputData: any;
  isCompleted: boolean;
  canExecute: boolean;
}

// 6大协作工作流程定义
const WORKFLOW_DEFINITIONS = {
  preparation: {
    name: '前期准备',
    description: '企业备案与海关审核',
    icon: Building,
    color: 'bg-blue-500',
    steps: [
      {
        stepNumber: 1,
        title: '企业资质准备',
        description: '准备企业营业执照、税务登记证等基础资质文件',
        requiredRole: 'enterprise_operator',
        inputFields: ['businessLicense', 'taxCertificate', 'organizationCode'],
        canExecute: true
      },
      {
        stepNumber: 2,
        title: '海关备案申请',
        description: '向海关提交企业备案申请，获取海关企业编码',
        requiredRole: 'customs_officer',
        inputFields: ['applicationForm', 'companyDocuments'],
        canExecute: false
      }
    ]
  },
  declaration: {
    name: '出口申报',
    description: '出口货物申报与审核',
    icon: FileText,
    color: 'bg-green-500',
    steps: [
      {
        stepNumber: 1,
        title: '货物信息录入',
        description: '录入出口货物的详细信息，包括商品编码、数量、价值等',
        requiredRole: 'enterprise_operator',
        inputFields: ['productCode', 'quantity', 'value', 'destination'],
        canExecute: true
      },
      {
        stepNumber: 2,
        title: '申报单审核',
        description: '海关审核出口申报单的准确性和完整性',
        requiredRole: 'customs_officer',
        inputFields: ['declarationForm', 'verificationNotes'],
        canExecute: false
      }
    ]
  },
  inspection: {
    name: '货物查验',
    description: '海关货物查验与放行',
    icon: Package,
    color: 'bg-orange-500',
    steps: [
      {
        stepNumber: 1,
        title: '查验布控',
        description: '海关系统自动布控或人工布控需要查验的货物',
        requiredRole: 'customs_officer',
        inputFields: ['controlReason', 'inspectionType'],
        canExecute: false
      },
      {
        stepNumber: 2,
        title: '货物送检',
        description: '物流公司将货物送至指定查验场地',
        requiredRole: 'logistics_operator',
        inputFields: ['inspectionLocation', 'deliveryTime'],
        canExecute: false
      },
      {
        stepNumber: 3,
        title: '现场查验',
        description: '海关关员现场查验货物，确认与申报信息一致',
        requiredRole: 'customs_officer',
        inputFields: ['inspectionResults', 'complianceStatus'],
        canExecute: false
      }
    ]
  },
  warehouse: {
    name: '海外仓操作',
    description: '海外仓储与配送管理',
    icon: Truck,
    color: 'bg-purple-500',
    steps: [
      {
        stepNumber: 1,
        title: '入库处理',
        description: '货物到达海外仓，进行入库登记和质检',
        requiredRole: 'logistics_operator',
        inputFields: ['warehouseLocation', 'storageConditions', 'qualityCheck'],
        canExecute: false
      },
      {
        stepNumber: 2,
        title: '订单拣货',
        description: '根据买家订单进行商品拣选和包装',
        requiredRole: 'logistics_operator',
        inputFields: ['orderDetails', 'packingList', 'shippingMethod'],
        canExecute: false
      }
    ]
  },
  delivery: {
    name: '买家签收',
    description: '最后一公里配送与签收',
    icon: CheckCircle,
    color: 'bg-teal-500',
    steps: [
      {
        stepNumber: 1,
        title: '订单配送',
        description: '本地物流公司进行最后一公里配送',
        requiredRole: 'logistics_operator',
        inputFields: ['deliveryAddress', 'deliveryTime', 'trackingNumber'],
        canExecute: false
      },
      {
        stepNumber: 2,
        title: '买家签收确认',
        description: '买家收到货物并确认签收',
        requiredRole: 'platform_specialist',
        inputFields: ['deliveryConfirmation', 'customerFeedback'],
        canExecute: false
      }
    ]
  },
  tax_refund: {
    name: '退税申报',
    description: '出口退税申请与处理',
    icon: DollarSign,
    color: 'bg-red-500',
    steps: [
      {
        stepNumber: 1,
        title: '退税资料准备',
        description: '整理出口发票、报关单等退税所需资料',
        requiredRole: 'enterprise_operator',
        inputFields: ['exportInvoice', 'customsDeclaration', 'contractDocuments'],
        canExecute: true
      },
      {
        stepNumber: 2,
        title: '退税申请处理',
        description: '税务部门审核退税申请，计算退税金额',
        requiredRole: 'service_specialist',
        inputFields: ['taxCalculation', 'approvalStatus', 'refundAmount'],
        canExecute: false
      }
    ]
  }
};

export default function WorkflowManager({ 
  businessRoleCode, 
  availableScenes 
}: { 
  businessRoleCode: string;
  availableScenes: string[];
}) {
  // 添加token检查
  const tokens = getAuthTokens();
  const hasValidToken = !!tokens.accessToken;
  
  // 操作界面状态
  const [activeOperation, setActiveOperation] = useState<{
    workflowId: string;
    workflowCode: string;
    stepNumber: number;
  } | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('preparation');
  const [operationModal, setOperationModal] = useState<{
    isOpen: boolean;
    workflowCode: string;
    workflowName: string;
    stepNumber: number;
    stepTitle: string;
    stepDescription: string;
    inputFields: string[];
  }>({
    isOpen: false,
    workflowCode: '',
    workflowName: '',
    stepNumber: 1,
    stepTitle: '',
    stepDescription: '',
    inputFields: []
  });

  // 获取当前活跃的工作流程
  const { data: activeWorkflows, isLoading } = useQuery({
    queryKey: ['/api/workflows/current', businessRoleCode],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/workflows/current?businessRoleCode=${businessRoleCode}`);
      return response.json();
    },
  });

  // 启动新工作流程
  const startWorkflowMutation = useMutation({
    mutationFn: async (workflowCode: string) => {
      const response = await apiRequest('POST', '/api/workflows/start', {
        workflowCode,
        businessRoleCode
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "工作流程已启动",
        description: "新的协作流程已成功创建，可以开始执行相关操作。",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows/current'] });
    },
    onError: (error: any) => {
      toast({
        title: "启动失败",
        description: error.message || "工作流程启动失败，请重试。",
        variant: "destructive",
      });
    }
  });

  // 执行工作流程步骤
  const executeStepMutation = useMutation({
    mutationFn: async ({ instanceId, stepNumber, inputData }: {
      instanceId: string;
      stepNumber: number;
      inputData: any;
    }) => {
      const response = await apiRequest('POST', '/api/workflows/execute-step', {
        instanceId,
        stepNumber,
        inputData,
        businessRoleCode
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "步骤执行成功",
        description: "工作流程步骤已完成，协作伙伴将收到通知。",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows/current'] });
    },
    onError: (error: any) => {
      toast({
        title: "执行失败",
        description: error.message || "步骤执行失败，请检查输入数据。",
        variant: "destructive",
      });
    }
  });

  const workflowDef = WORKFLOW_DEFINITIONS[selectedWorkflow as keyof typeof WORKFLOW_DEFINITIONS];
  const IconComponent = workflowDef?.icon;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 animate-spin" />
            <span>加载工作流程数据...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="workflow-manager">
      {/* 当前活跃工作流程概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            协作工作流程管理
            <Badge variant="outline" className="ml-auto">
              {businessRoleCode} 角色
            </Badge>
          </CardTitle>
          <CardDescription>
            当前活跃流程: {activeWorkflows?.activeWorkflows?.length || 0} 个 | 
            总计: {activeWorkflows?.totalCount || 0} 个
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {activeWorkflows?.activeWorkflows && activeWorkflows.activeWorkflows.length > 0 ? (
            <div className="space-y-4">
              {activeWorkflows.activeWorkflows.map((instance: WorkflowInstance) => {
                const def = WORKFLOW_DEFINITIONS[instance.workflowCode as keyof typeof WORKFLOW_DEFINITIONS];
                const progress = (instance.currentStep / def?.steps.length) * 100 || 0;
                
                return (
                  <div key={instance.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{def?.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={instance.status === 'active' ? 'default' : 'secondary'}>
                          {instance.status === 'active' ? '进行中' : '已完成'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ID: {instance.id.slice(-8)}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={progress} className="mb-3" />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        步骤 {instance.currentStep} / {def?.steps.length} - 
                        当前: {def?.steps[instance.currentStep - 1]?.title}
                      </p>
                      {instance.status === 'active' && def?.steps[instance.currentStep - 1]?.requiredRole === businessRoleCode && (
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const currentStep = def.steps[instance.currentStep - 1];
                            setOperationModal({
                              isOpen: true,
                              workflowCode: instance.workflowCode,
                              workflowName: def.name,
                              stepNumber: instance.currentStep,
                              stepTitle: currentStep.title,
                              stepDescription: currentStep.description,
                              inputFields: currentStep.inputFields
                            });
                          }}
                          data-testid={`execute-step-${instance.id}`}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          执行操作
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无活跃的协作流程</p>
              <p className="text-sm">选择下方的流程类型开始新的协作</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 工作流程操作面板 */}
      <Card>
        <CardHeader>
          <CardTitle>可执行的协作流程</CardTitle>
          <CardDescription>
            基于您的 {businessRoleCode} 角色权限，以下是可参与的跨境贸易协作流程
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6">
              {Object.entries(WORKFLOW_DEFINITIONS).map(([key, def]) => (
                <TabsTrigger key={key} value={key} className="text-xs">
                  <def.icon className="w-4 h-4 mr-1" />
                  {def.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(WORKFLOW_DEFINITIONS).map(([key, def]) => (
              <TabsContent key={key} value={key}>
                <div className="space-y-4">
                  {/* 流程描述 */}
                  <div className={`p-4 rounded-lg text-white ${def.color}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <def.icon className="w-6 h-6" />
                      <h3 className="text-xl font-semibold">{def.name}</h3>
                    </div>
                    <p className="opacity-90">{def.description}</p>
                  </div>

                  {/* 工作流程步骤 */}
                  <div className="space-y-3">
                    {def.steps.map((step, index) => {
                      const canExecute = step.requiredRole === businessRoleCode;
                      const isActive = canExecute && step.stepNumber === 1; // 简化版：只有第一步可执行
                      
                      return (
                        <div key={step.stepNumber} className={`p-4 border rounded-lg ${
                          canExecute ? 'border-primary bg-primary/5' : 'border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                isActive ? 'bg-primary text-white' : 
                                canExecute ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {step.stepNumber}
                              </div>
                              <div>
                                <h4 className="font-medium">{step.title}</h4>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant={canExecute ? 'default' : 'secondary'}>
                                {step.requiredRole === 'enterprise_operator' ? '企业操作员' :
                                 step.requiredRole === 'customs_officer' ? '海关审核员' :
                                 step.requiredRole === 'logistics_operator' ? '物流操作员' :
                                 step.requiredRole === 'platform_specialist' ? '平台专员' :
                                 step.requiredRole === 'service_specialist' ? '服务专员' : step.requiredRole}
                              </Badge>
                              
                              {isActive && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const workflow = WORKFLOW_DEFINITIONS[key];
                                    const firstStep = workflow.steps[0];
                                    setOperationModal({
                                      isOpen: true,
                                      workflowCode: key,
                                      workflowName: workflow.name,
                                      stepNumber: firstStep.stepNumber,
                                      stepTitle: firstStep.title,
                                      stepDescription: firstStep.description,
                                      inputFields: firstStep.inputFields
                                    });
                                  }}
                                  disabled={startWorkflowMutation.isPending}
                                  data-testid={`start-workflow-${key}`}
                                >
                                  <Settings className="w-4 h-4 mr-1" />
                                  开始操作
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {canExecute && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="text-sm text-muted-foreground">
                                <strong>需要准备:</strong> {step.inputFields.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* 操作模态框 */}
      <WorkflowOperationModal
        isOpen={operationModal.isOpen}
        onClose={() => setOperationModal(prev => ({ ...prev, isOpen: false }))}
        workflowCode={operationModal.workflowCode}
        workflowName={operationModal.workflowName}
        stepNumber={operationModal.stepNumber}
        stepTitle={operationModal.stepTitle}
        stepDescription={operationModal.stepDescription}
        businessRole={businessRoleCode}
        inputFields={operationModal.inputFields}
        onSubmit={(data) => {
          // 提交操作数据后，启动工作流
          startWorkflowMutation.mutate(operationModal.workflowCode);
          setOperationModal(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}