import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, FileText, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Truck, CreditCard } from "lucide-react";
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

// 表单验证模式
const transportIdSchema = z.object({
  // 企业基本信息
  companyName: z.string().min(2, "企业名称至少2个字符"),
  unifiedCreditCode: z.string().regex(/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, "请输入正确的统一社会信用代码"),
  legalRepresentative: z.string().min(2, "法定代表人姓名至少2个字符"),
  contactPerson: z.string().min(2, "联系人姓名至少2个字符"),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  contactEmail: z.string().email("请输入有效的邮箱地址"),
  
  // 传输ID申请信息
  applicationMode: z.enum(["declaration", "manifest"], {
    required_error: "请选择申请模式",
  }),
  businessType: z.string().min(1, "请选择业务类型"),
  customsCode: z.string().min(4, "海关代码至少4位"),
  
  // 技术对接信息
  systemName: z.string().min(2, "系统名称不能少于2个字符"),
  systemVersion: z.string().min(1, "请输入系统版本"),
  technicalContact: z.string().min(2, "技术联系人姓名至少2个字符"),
  technicalPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的技术联系人手机号"),
  
  // 声明确认
  dataAccuracy: z.boolean().refine(val => val === true, "必须确认数据真实性"),
  legalResponsibility: z.boolean().refine(val => val === true, "必须承诺承担法律责任"),
  submitConsent: z.boolean().refine(val => val === true, "必须同意提交申请")
});

type TransportIdData = z.infer<typeof transportIdSchema>;

interface TransportIdFormProps {
  onComplete?: (data: TransportIdData & { uploadedFiles: any[] }) => void;
  onCancel?: () => void;
}

export function TransportIdForm({ onComplete, onCancel }: TransportIdFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [filesByCategory, setFilesByCategory] = useState<{ [key: string]: any[] }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    applicationNumber: string;
    submittedAt: string;
    transportId: string;
  } | null>(null);
  const { toast } = useToast();

  const form = useForm<TransportIdData>({
    resolver: zodResolver(transportIdSchema),
    defaultValues: {
      companyName: "",
      unifiedCreditCode: "",
      legalRepresentative: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      applicationMode: undefined,
      businessType: "",
      customsCode: "",
      systemName: "",
      systemVersion: "",
      technicalContact: "",
      technicalPhone: "",
      dataAccuracy: false,
      legalResponsibility: false,
      submitConsent: false
    }
  });

  const businessTypeOptions = [
    "跨境电商进口",
    "跨境电商出口",
    "一般贸易进口",
    "一般贸易出口",
    "保税区业务",
    "其他"
  ];

  const totalSteps = 5;

  const getStepProgress = () => {
    return (currentStep / totalSteps) * 100;
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "企业基本信息";
      case 2: return "申请模式选择";
      case 3: return "技术对接信息";
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
        isValid = await form.trigger(['applicationMode', 'businessType', 'customsCode']);
        break;
      case 3:
        isValid = await form.trigger(['systemName', 'systemVersion', 'technicalContact', 'technicalPhone', 'dataAccuracy', 'legalResponsibility', 'submitConsent']);
        break;
    }
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: TransportIdData) => {
    if (currentStep !== 4) return; // 第4步提交
    
    setIsSubmitting(true);
    
    try {
      console.log("传输ID申请完成:", { ...data, uploadedFiles });
      
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
      
      // 跳转到成功页面
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
    
    // 更新总文件列表
    setUploadedFiles(prev => {
      // 移除同类别的旧文件，添加新文件
      const filtered = prev.filter(f => f.category !== category);
      return [...filtered, ...newFiles];
    });
    
    // 更新按类别分组的文件
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
                                用于一般贸易报关，支持完整的报关单数据传输
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
                                用于跨境电商业务，支持清单数据批量传输
                              </p>
                            </div>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>业务类型 *</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value}
                            onChange={field.onChange}
                          >
                            <option value="">请选择业务类型</option>
                            {businessTypeOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* 第三步：技术对接信息 */}
          {currentStep === 3 && (
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
                      您的传输ID申请已成功提交，系统正在为您分配传输ID。
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
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">使用说明</h4>
                        <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                          <div className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="leading-relaxed">传输ID已生效，可用于数据传输对接</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="leading-relaxed">请妥善保管传输ID，用于系统对接配置</p>
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
                <Button type="button" onClick={handleNext}>
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