import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, FileText, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Truck, CreditCard, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/experiments/file-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// 基础字段验证
const baseFields = {
  // 企业基本信息
  companyName: z.string().min(2, "企业名称至少2个字符"),
  unifiedCreditCode: z.string().regex(/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, "请输入正确的统一社会信用代码"),
  legalRepresentative: z.string().min(2, "法定代表人姓名至少2个字符"),
  contactPerson: z.string().min(2, "联系人姓名至少2个字符"),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  contactEmail: z.string().email("请输入有效的邮箱地址"),
  
  // 申请模式
  applicationMode: z.enum(["declaration", "manifest"], {
    required_error: "请选择申请模式",
  }),
  
  // 技术对接信息
  systemName: z.string().min(2, "系统名称不能少于2个字符"),
  systemVersion: z.string().min(1, "请输入系统版本"),
  technicalContact: z.string().min(2, "技术联系人姓名至少2个字符"),
  technicalPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的技术联系人手机号"),
  
  // 声明确认
  dataAccuracy: z.boolean().refine(val => val === true, "必须确认数据真实性"),
  legalResponsibility: z.boolean().refine(val => val === true, "必须承诺承担法律责任"),
  submitConsent: z.boolean().refine(val => val === true, "必须同意提交申请")
};

// 报关单模式专用字段
const declarationFields = {
  customsCode: z.string().min(4, "海关代码至少4位"),
  declarationEntCode: z.string().min(1, "请输入报关企业代码"),
  tradeMode: z.string().min(1, "请选择贸易方式"),
  exemptionType: z.string().min(1, "请选择征免性质"),
  importExportType: z.string().min(1, "请选择进出口类型"),
  businessScope: z.string().min(1, "请填写经营范围"),
};

// 清单模式专用字段
const manifestFields = {
  ecommerceCode: z.string().min(1, "请输入电商平台代码"),
  supervisoryLocationCode: z.string().min(1, "请输入监管场所代码"),
  paymentEntCode: z.string().min(1, "请输入支付企业代码"),
  logisticsEntCode: z.string().min(1, "请输入物流企业代码"),
  warehouseCode: z.string().optional(),
  businessModel: z.string().min(1, "请选择业务模式"),
  dataTransmissionFreq: z.string().min(1, "请选择数据传输频率"),
};

// 根据模式创建动态schema
const createTransportIdSchema = (mode?: string) => {
  if (mode === "declaration") {
    return z.object({ ...baseFields, ...declarationFields });
  } else if (mode === "manifest") {
    return z.object({ ...baseFields, ...manifestFields });
  }
  return z.object(baseFields);
};

type TransportIdData = z.infer<ReturnType<typeof createTransportIdSchema>>;

interface TransportIdFormProps {
  onComplete?: (data: any & { uploadedFiles: any[] }) => void;
  onCancel?: () => void;
}

export function TransportIdForm({ onComplete, onCancel }: TransportIdFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState<"declaration" | "manifest" | undefined>();
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [filesByCategory, setFilesByCategory] = useState<{ [key: string]: any[] }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    applicationNumber: string;
    submittedAt: string;
    transportId: string;
  } | null>(null);
  const { toast } = useToast();

  // 动态创建表单验证schema
  const form = useForm({
    resolver: zodResolver(createTransportIdSchema(selectedMode)),
    defaultValues: {
      companyName: "",
      unifiedCreditCode: "",
      legalRepresentative: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      applicationMode: undefined,
      systemName: "",
      systemVersion: "",
      technicalContact: "",
      technicalPhone: "",
      dataAccuracy: false,
      legalResponsibility: false,
      submitConsent: false,
      // 报关单模式字段
      customsCode: "",
      declarationEntCode: "",
      tradeMode: "",
      exemptionType: "",
      importExportType: "",
      businessScope: "",
      // 清单模式字段
      ecommerceCode: "",
      supervisoryLocationCode: "",
      paymentEntCode: "",
      logisticsEntCode: "",
      warehouseCode: "",
      businessModel: "",
      dataTransmissionFreq: "",
    }
  });

  // 当模式改变时重新创建表单验证
  useEffect(() => {
    if (selectedMode) {
      // 重新设置表单验证resolver
      form.clearErrors();
    }
  }, [selectedMode, form]);

  // 监听applicationMode变化
  const watchedMode = form.watch("applicationMode");
  useEffect(() => {
    if (watchedMode && watchedMode !== selectedMode) {
      setSelectedMode(watchedMode as "declaration" | "manifest");
    }
  }, [watchedMode, selectedMode]);

  const tradeOptions = [
    { value: "0110", label: "一般贸易" },
    { value: "1210", label: "保税跨境贸易电子商务" },
    { value: "9610", label: "跨境贸易电子商务" },
    { value: "1239", label: "保税跨境贸易电子商务A" },
    { value: "1249", label: "保税跨境贸易电子商务B" },
  ];

  const exemptionOptions = [
    { value: "101", label: "照章征收" },
    { value: "301", label: "全免" },
    { value: "601", label: "特殊减免" },
    { value: "701", label: "暂免" },
  ];

  const businessModelOptions = [
    { value: "BBC", label: "BBC（保税备货）" },
    { value: "BC", label: "BC（直购进口）" },
    { value: "CC", label: "CC（一般出口）" },
    { value: "B2B2C", label: "B2B2C（海外直邮）" },
  ];

  const dataFreqOptions = [
    { value: "realtime", label: "实时传输" },
    { value: "batch_hourly", label: "批量传输（每小时）" },
    { value: "batch_daily", label: "批量传输（每日）" },
    { value: "batch_weekly", label: "批量传输（每周）" },
  ];

  const totalSteps = 5;

  const getStepProgress = () => {
    return (currentStep / totalSteps) * 100;
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "企业基本信息";
      case 2: return "申请模式选择";
      case 3: return selectedMode === "declaration" ? "报关单配置信息" : "清单传输配置";
      case 4: return "营业执照上传";
      case 5: return "申请成功";
      default: return "";
    }
  };

  const handleNext = async () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = await form.trigger(['companyName', 'unifiedCreditCode', 'legalRepresentative', 'contactPerson', 'contactPhone', 'contactEmail']);
        break;
      case 2:
        isValid = await form.trigger(['applicationMode']);
        break;
      case 3:
        if (selectedMode === "declaration") {
          isValid = await form.trigger(['customsCode', 'declarationEntCode', 'tradeMode', 'exemptionType', 'importExportType', 'businessScope', 'systemName', 'systemVersion', 'technicalContact', 'technicalPhone', 'dataAccuracy', 'legalResponsibility', 'submitConsent']);
        } else if (selectedMode === "manifest") {
          isValid = await form.trigger(['ecommerceCode', 'supervisoryLocationCode', 'paymentEntCode', 'logisticsEntCode', 'businessModel', 'dataTransmissionFreq', 'systemName', 'systemVersion', 'technicalContact', 'technicalPhone', 'dataAccuracy', 'legalResponsibility', 'submitConsent']);
        }
        break;
    }
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: any) => {
    if (currentStep !== 4) return;
    
    setIsSubmitting(true);
    
    try {
      console.log("传输ID申请完成:", { ...data, uploadedFiles, mode: selectedMode });
      
      // 模拟提交API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 生成申请号、传输ID和提交时间
      const applicationNumber = `TID${Date.now()}`;
      const transportId = `T${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      const submittedAt = new Date().toLocaleString('zh-CN');
      
      setSubmissionResult({
        applicationNumber,
        transportId,
        submittedAt
      });
      
      setCurrentStep(5);
      
    } catch (error) {
      toast({
        title: "提交失败",
        description: "请检查网络连接后重试。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (files: any[], category: string) => {
    const newFiles = files.map(file => ({ ...file, category }));
    setUploadedFiles(prev => {
      const filtered = prev.filter(f => f.category !== category);
      return [...filtered, ...newFiles];
    });
    setFilesByCategory(prev => ({
      ...prev,
      [category]: newFiles
    }));
  };

  const getFilesByCategory = (category: string) => {
    return filesByCategory[category] || [];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 进度条 */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">传输ID申请</h2>
            <Badge variant="outline" className="bg-white dark:bg-gray-800">
              第 {currentStep} 步 / 共 {totalSteps} 步
            </Badge>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">{getStepTitle(currentStep)}</p>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 第一步：企业基本信息 */}
          {currentStep === 1 && (
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0">
                <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle>企业基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>企业名称 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入企业全称" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unifiedCreditCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>统一社会信用代码 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入18位统一社会信用代码" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="legalRepresentative"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>法定代表人 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入法定代表人姓名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>联系人 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入联系人姓名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>联系电话 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入手机号" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>邮箱地址 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入邮箱地址" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 第二步：申请模式选择 */}
          {currentStep === 2 && (
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0">
                <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle>申请模式选择</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="applicationMode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>请选择传输ID申请模式 *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-4"
                        >
                          <div className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <RadioGroupItem value="declaration" id="declaration" />
                            <div className="flex-1">
                              <label htmlFor="declaration" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                申请报关单模式
                              </label>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                用于一般贸易报关，支持完整的报关单数据传输，需配置海关代码、贸易方式等信息
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <RadioGroupItem value="manifest" id="manifest" />
                            <div className="flex-1">
                              <label htmlFor="manifest" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                申请清单模式
                              </label>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                用于跨境电商业务，支持清单数据批量传输，需配置电商平台、监管场所等信息
                              </p>
                            </div>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* 第三步：模式专用配置 + 技术对接信息 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* 报关单模式配置 */}
              {selectedMode === "declaration" && (
                <Card>
                  <CardHeader className="flex flex-row items-center space-y-0">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <CardTitle>报关单配置信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customsCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>海关代码 *</FormLabel>
                            <FormControl>
                              <Input placeholder="请输入海关代码" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="declarationEntCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>报关企业代码 *</FormLabel>
                            <FormControl>
                              <Input placeholder="请输入报关企业代码" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tradeMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>贸易方式 *</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={field.value}
                                onChange={field.onChange}
                              >
                                <option value="">请选择贸易方式</option>
                                {tradeOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.value} - {option.label}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="exemptionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>征免性质 *</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={field.value}
                                onChange={field.onChange}
                              >
                                <option value="">请选择征免性质</option>
                                {exemptionOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.value} - {option.label}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="importExportType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>进出口类型 *</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={field.value}
                                onChange={field.onChange}
                              >
                                <option value="">请选择进出口类型</option>
                                <option value="import">进口</option>
                                <option value="export">出口</option>
                                <option value="both">进出口</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="businessScope"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>经营范围 *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="请详细描述企业经营范围"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* 清单模式配置 */}
              {selectedMode === "manifest" && (
                <Card>
                  <CardHeader className="flex flex-row items-center space-y-0">
                    <Package className="h-5 w-5 text-blue-600 mr-2" />
                    <CardTitle>清单传输配置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ecommerceCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>电商平台代码 *</FormLabel>
                            <FormControl>
                              <Input placeholder="请输入电商平台代码" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="supervisoryLocationCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>监管场所代码 *</FormLabel>
                            <FormControl>
                              <Input placeholder="请输入监管场所代码" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="paymentEntCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>支付企业代码 *</FormLabel>
                            <FormControl>
                              <Input placeholder="请输入支付企业代码" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="logisticsEntCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>物流企业代码 *</FormLabel>
                            <FormControl>
                              <Input placeholder="请输入物流企业代码" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="warehouseCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>仓库代码</FormLabel>
                            <FormControl>
                              <Input placeholder="请输入仓库代码（可选）" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="businessModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>业务模式 *</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={field.value}
                                onChange={field.onChange}
                              >
                                <option value="">请选择业务模式</option>
                                {businessModelOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.value} - {option.label}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dataTransmissionFreq"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>数据传输频率 *</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={field.value}
                                onChange={field.onChange}
                              >
                                <option value="">请选择传输频率</option>
                                {dataFreqOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 技术对接信息 */}
              <Card>
                <CardHeader className="flex flex-row items-center space-y-0">
                  <Truck className="h-5 w-5 text-blue-600 mr-2" />
                  <CardTitle>技术对接信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="systemName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>对接系统名称 *</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入系统名称" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="systemVersion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>系统版本 *</FormLabel>
                          <FormControl>
                            <Input placeholder="如：v1.0.0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="technicalContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>技术联系人 *</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入技术联系人姓名" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="technicalPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>技术联系人电话 *</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入技术联系人手机号" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 确认声明 */}
                  <div className="space-y-4 pt-4">
                    <Separator />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">申请确认</h4>
                    
                    <FormField
                      control={form.control}
                      name="dataAccuracy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              我确认提供的信息真实、准确、完整 *
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="legalResponsibility"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              我愿意承担因信息不实而产生的相应法律责任 *
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="submitConsent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              我同意提交传输ID申请，并接受相关部门审核 *
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 第四步：营业执照上传 */}
          {currentStep === 4 && (
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle>营业执照上传</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">上传营业执照</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">请上传营业执照扫描件（支持PDF、JPG、PNG格式）</p>
                  
                  <FileUpload
                    onUploadComplete={(file) => handleFileUpload([file], "营业执照扫描件")}
                    accept={{
                      'application/pdf': ['.pdf'],
                      'image/*': ['.jpg', '.jpeg', '.png']
                    }}
                    maxSize={10 * 1024 * 1024}
                  />
                  
                  {/* 显示已上传文件 */}
                  {getFilesByCategory("营业执照扫描件").length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                            已上传 {getFilesByCategory("营业执照扫描件").length} 个文件：
                          </p>
                          <div className="space-y-1">
                            {getFilesByCategory("营业执照扫描件").map((file, index) => (
                              <p key={index} className="text-xs text-green-600 dark:text-green-400 truncate">
                                • {file.originalName || file.name || `文件${index + 1}`}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 第五步：提交成功 */}
          {currentStep === 5 && submissionResult && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center space-y-6">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
                      传输ID申请成功！
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      您的{selectedMode === "declaration" ? "报关单模式" : "清单模式"}传输ID申请已成功提交。
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-green-200 dark:border-green-800 w-full max-w-md">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">申请编号：</span>
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">{submissionResult.applicationNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">传输ID：</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{submissionResult.transportId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">申请模式：</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {selectedMode === "declaration" ? "报关单模式" : "清单模式"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">提交时间：</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{submissionResult.submittedAt}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">状态：</span>
                        <span className="text-sm text-green-600 dark:text-green-400">已激活</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg w-full max-w-md border border-blue-200 dark:border-blue-700">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">后续流程</h4>
                        <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                          <div className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="leading-relaxed">传输ID已生效，可用于{selectedMode === "declaration" ? "报关单" : "清单"}数据传输</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="leading-relaxed">请在企业系统中配置传输ID进行数据对接测试</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="leading-relaxed">如有技术问题，请联系客服：<span className="font-medium">400-xxx-xxxx</span></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 按钮区域 */}
          <div className="flex justify-between pt-6">
            <div>
              {currentStep > 1 && currentStep < 5 && (
                <Button type="button" variant="outline" onClick={handlePrev}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  上一步
                </Button>
              )}
              {onCancel && currentStep < 5 && (
                <Button type="button" variant="ghost" onClick={onCancel} className="ml-2">
                  取消
                </Button>
              )}
            </div>
            
            <div>
              {currentStep < 4 ? (
                <Button 
                  type="button" 
                  onClick={handleNext}
                  disabled={currentStep === 2 && !selectedMode}
                >
                  下一步
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : currentStep === 4 ? (
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      提交申请
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={() => onComplete?.({ uploadedFiles } as any)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  返回任务列表
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}