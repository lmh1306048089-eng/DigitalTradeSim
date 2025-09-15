import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, FileText, Upload, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, CreditCard, MapPin, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/experiments/file-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// 表单验证模式
const enterpriseQualificationSchema = z.object({
  // 基本企业信息
  companyName: z.string().min(2, "企业名称至少2个字符"),
  unifiedCreditCode: z.string().regex(/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, "请输入正确的统一社会信用代码"),
  businessLicenseNumber: z.string().min(15, "营业执照注册号不能少于15位"),
  
  // 法定代表人信息
  legalRepresentative: z.string().min(2, "法定代表人姓名至少2个字符"),
  legalRepIdCard: z.string().regex(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, "请输入有效的身份证号码"),
  legalRepPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  
  // 企业地址信息
  registeredAddress: z.string().min(10, "注册地址信息不完整"),
  businessAddress: z.string().min(10, "经营地址信息不完整"),
  
  // 联系信息
  contactPerson: z.string().min(2, "联系人姓名至少2个字符"),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  contactEmail: z.string().email("请输入有效的邮箱地址"),
  
  // 对外贸易经营者备案信息
  tradeLicenseNumber: z.string().min(10, "对外贸易经营者备案登记表编号不能少于10位"),
  tradeScope: z.array(z.string()).min(1, "请至少选择一个贸易范围"),
  
  // 跨境电商海关备案号
  customsRecordNumber: z.string().min(10, "海关备案号不能少于10位"),
  
  // 外汇结算账户信息
  bankName: z.string().min(2, "开户银行名称不能少于2个字符"),
  accountNumber: z.string().min(10, "银行账号不能少于10位"),
  accountName: z.string().min(2, "账户名称不能少于2个字符"),
  
  // 税务备案信息
  taxRegistrationNumber: z.string().min(15, "税务登记证号不能少于15位"),
  vatNumber: z.string().optional(),
  
  // 生产能力信息
  productionCapacity: z.string().min(10, "请详细描述生产能力"),
  qualityCertification: z.array(z.string()).optional(),
  
  // 声明确认
  dataAccuracy: z.boolean().refine(val => val === true, "必须确认数据真实性"),
  legalResponsibility: z.boolean().refine(val => val === true, "必须承诺承担法律责任"),
  submitConsent: z.boolean().refine(val => val === true, "必须同意提交申请")
});

type EnterpriseQualificationData = z.infer<typeof enterpriseQualificationSchema>;

interface EnterpriseQualificationFormProps {
  onComplete?: (data: EnterpriseQualificationData & { uploadedFiles: any[] }) => void;
  onCancel?: () => void;
}

export function EnterpriseQualificationForm({ onComplete, onCancel }: EnterpriseQualificationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [filesByCategory, setFilesByCategory] = useState<{ [key: string]: any[] }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    applicationNumber: string;
    submittedAt: string;
  } | null>(null);
  const { toast } = useToast();

  // 获取测试数据用于自动预填充
  const { data: testData } = useQuery({
    queryKey: ['/api/test-data/ecommerce-qualification'],
    enabled: true
  });

  const form = useForm<EnterpriseQualificationData>({
    resolver: zodResolver(enterpriseQualificationSchema),
    defaultValues: {
      companyName: "",
      unifiedCreditCode: "",
      businessLicenseNumber: "",
      legalRepresentative: "",
      legalRepIdCard: "",
      legalRepPhone: "",
      registeredAddress: "",
      businessAddress: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      tradeLicenseNumber: "",
      tradeScope: [],
      customsRecordNumber: "",
      bankName: "",
      accountNumber: "",
      accountName: "",
      taxRegistrationNumber: "",
      vatNumber: "",
      productionCapacity: "",
      qualityCertification: [],
      dataAccuracy: false,
      legalResponsibility: false,
      submitConsent: false
    }
  });

  // 自动预填充测试数据（无感知）
  useEffect(() => {
    if (testData && testData.data && Array.isArray(testData.data) && testData.data.length > 0) {
      const firstDataSet = testData.data[0];
      // 静默预填充表单数据
      form.reset({
        companyName: firstDataSet.companyName || "",
        unifiedCreditCode: firstDataSet.unifiedCreditCode || "",
        businessLicenseNumber: firstDataSet.businessLicenseNumber || "",
        legalRepresentative: firstDataSet.legalRepresentative || "",
        legalRepIdCard: firstDataSet.legalRepIdCard || "",
        legalRepPhone: firstDataSet.legalRepPhone || "",
        registeredAddress: firstDataSet.registeredAddress || "",
        businessAddress: firstDataSet.businessAddress || "",
        contactPerson: firstDataSet.contactPerson || "",
        contactPhone: firstDataSet.contactPhone || "",
        contactEmail: firstDataSet.contactEmail || "",
        tradeLicenseNumber: firstDataSet.tradeLicenseNumber || "",
        tradeScope: typeof firstDataSet.tradeScope === 'string' 
          ? firstDataSet.tradeScope.split(',') 
          : firstDataSet.tradeScope || [],
        customsRecordNumber: firstDataSet.customsRecordNumber || "",
        bankName: firstDataSet.bankName || "",
        accountNumber: firstDataSet.accountNumber || "",
        accountName: firstDataSet.accountName || "",
        taxRegistrationNumber: firstDataSet.taxRegistrationNumber || "",
        vatNumber: firstDataSet.vatNumber || "",
        productionCapacity: firstDataSet.productionCapacity || "",
        qualityCertification: typeof firstDataSet.qualityCertification === 'string'
          ? firstDataSet.qualityCertification.split(',')
          : firstDataSet.qualityCertification || [],
        dataAccuracy: false,
        legalResponsibility: false,
        submitConsent: false
      });
    }
  }, [testData, form]);

  const tradeScopeOptions = [
    "服装纺织品",
    "电子产品",
    "家居用品",
    "美容护肤品",
    "食品饮料", 
    "母婴用品",
    "体育户外",
    "汽车配件",
    "工艺礼品",
    "其他"
  ];


  const certificationOptions = [
    "ISO9001质量管理体系",
    "ISO14001环境管理体系",
    "CE认证",
    "FCC认证", 
    "RoHS认证",
    "FDA认证",
    "CCC强制性产品认证",
    "其他"
  ];

  const totalSteps = 6;

  const getStepProgress = () => {
    return (currentStep / totalSteps) * 100;
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "企业基本信息";
      case 2: return "法人及联系信息";
      case 3: return "贸易备案信息";
      case 4: return "财务税务信息";
      case 5: return "生产能力信息";
      case 6: return "提交成功";
      default: return "";
    }
  };

  const handleNext = async () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = await form.trigger(['companyName', 'unifiedCreditCode', 'businessLicenseNumber', 'registeredAddress', 'businessAddress']);
        break;
      case 2:
        isValid = await form.trigger(['legalRepresentative', 'legalRepIdCard', 'legalRepPhone', 'contactPerson', 'contactPhone', 'contactEmail']);
        break;
      case 3:
        isValid = await form.trigger(['tradeLicenseNumber', 'tradeScope', 'customsRecordNumber']);
        break;
      case 4:
        isValid = await form.trigger(['bankName', 'accountNumber', 'accountName', 'taxRegistrationNumber']);
        break;
      case 5:
        isValid = await form.trigger(['productionCapacity', 'dataAccuracy', 'legalResponsibility', 'submitConsent']);
        break;
    }
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: EnterpriseQualificationData) => {
    if (currentStep !== totalSteps - 1) return; // 第5步提交
    
    setIsSubmitting(true);
    
    try {
      console.log("企业资质备案完成:", { ...data, uploadedFiles });
      
      // 模拟提交API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 生成申请号和提交时间
      const applicationNumber = `EQ${Date.now()}`;
      const submittedAt = new Date().toLocaleString('zh-CN');
      
      setSubmissionResult({
        applicationNumber,
        submittedAt
      });
      
      // 跳转到成功页面
      setCurrentStep(6);
      
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
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">电商企业资质备案</h2>
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
                          <Input placeholder="18位统一社会信用代码" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="businessLicenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>营业执照注册号 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入营业执照注册号" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="registeredAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>企业注册地址 *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="请输入详细的企业注册地址" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="businessAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>企业经营地址 *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="请输入详细的企业经营地址" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 文件上传区域 */}
                <div className="space-y-4">
                  <Separator />
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">上传营业执照</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">请上传营业执照扫描件、企业地址证明等相关文件</p>
                  
                  <FileUpload
                    onUploadComplete={(file) => handleFileUpload([file], "营业执照等企业证明文件")}
                    accept={{
                      'application/pdf': ['.pdf'],
                      'image/*': ['.jpg', '.jpeg', '.png']
                    }}
                    maxSize={10 * 1024 * 1024}
                  />
                  
                  {/* 显示已上传文件 */}
                  {getFilesByCategory("营业执照等企业证明文件").length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                            已上传 {getFilesByCategory("营业执照等企业证明文件").length} 个文件：
                          </p>
                          <div className="space-y-1">
                            {getFilesByCategory("营业执照等企业证明文件").map((file, index) => (
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

          {/* 第二步：法人及联系信息 */}
          {currentStep === 2 && (
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0">
                <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle>法定代表人及联系信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="legalRepresentative"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>法定代表人姓名 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入法定代表人姓名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="legalRepIdCard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>法人身份证号 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入18位身份证号" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="legalRepPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>法人联系电话 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入手机号码" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator className="my-6" />
                
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">企业联系信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>联系人姓名 *</FormLabel>
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
                        <FormLabel>联系人电话 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入手机号码" {...field} />
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
                        <FormLabel>联系邮箱 *</FormLabel>
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

          {/* 第三步：贸易备案信息 */}
          {currentStep === 3 && (
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle>对外贸易备案信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tradeLicenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>对外贸易经营者备案登记表编号 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入备案登记表编号" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customsRecordNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>跨境电商海关备案号 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入海关备案号" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="tradeScope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>贸易经营范围 *</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">
                        {tradeScopeOptions.map((scope) => (
                          <div key={scope} className="flex items-center space-x-2">
                            <Checkbox
                              id={`scope-${scope}`}
                              checked={field.value.includes(scope)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, scope]);
                                } else {
                                  field.onChange(field.value.filter((item) => item !== scope));
                                }
                              }}
                            />
                            <label htmlFor={`scope-${scope}`} className="text-sm">
                              {scope}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 文件上传 */}
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">上传贸易备案文件</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">请上传对外贸易经营者备案登记表等相关文件</p>
                  
                  <FileUpload
                    onUploadComplete={(file) => handleFileUpload([file], "对外贸易经营者备案登记表")}
                    accept={{
                      'application/pdf': ['.pdf'],
                      'image/*': ['.jpg', '.jpeg', '.png']
                    }}
                    maxSize={10 * 1024 * 1024}
                  />
                  
                  {/* 显示已上传文件 */}
                  {getFilesByCategory("对外贸易经营者备案登记表").length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                            已上传 {getFilesByCategory("对外贸易经营者备案登记表").length} 个文件：
                          </p>
                          <div className="space-y-1">
                            {getFilesByCategory("对外贸易经营者备案登记表").map((file, index) => (
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

          {/* 第四步：财务税务信息 */}
          {currentStep === 4 && (
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0">
                <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle>外汇结算账户及税务信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">外汇结算账户信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>开户银行 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入开户银行名称" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>银行账号 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入银行账号" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>账户名称 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入账户名称" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator className="my-6" />
                
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">税务备案信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxRegistrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>税务登记证号 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入税务登记证号" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="vatNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>增值税一般纳税人资格证号</FormLabel>
                        <FormControl>
                          <Input placeholder="如有请输入，无则留空" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 第五步：生产能力信息 */}
          {currentStep === 5 && (
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0">
                <Award className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle>生产能力及产品认证信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="productionCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>生产能力描述 *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="请详细描述企业的生产能力，包括生产设施、产能规模、生产流程等" 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                
                <FormField
                  control={form.control}
                  name="qualityCertification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>产品质量认证（可选）</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                        {certificationOptions.map((cert) => (
                          <div key={cert} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cert-${cert}`}
                              checked={field.value?.includes(cert) || false}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValue, cert]);
                                } else {
                                  field.onChange(currentValue.filter((item) => item !== cert));
                                }
                              }}
                            />
                            <label htmlFor={`cert-${cert}`} className="text-sm">
                              {cert}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 文件上传 */}
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">上传相关证明文件</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">请上传生产能力证明、产品认证文件等相关材料</p>
                  
                  <FileUpload
                    onUploadComplete={(file) => handleFileUpload([file], "生产能力证明及产品认证文件")}
                    accept={{
                      'application/pdf': ['.pdf'],
                      'image/*': ['.jpg', '.jpeg', '.png']
                    }}
                    maxSize={10 * 1024 * 1024}
                  />
                  
                  {/* 显示已上传文件 */}
                  {getFilesByCategory("生产能力证明及产品认证文件").length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                            已上传 {getFilesByCategory("生产能力证明及产品认证文件").length} 个文件：
                          </p>
                          <div className="space-y-1">
                            {getFilesByCategory("生产能力证明及产品认证文件").map((file, index) => (
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
                            我确认所填写的企业资质备案信息真实、准确、完整 *
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
                            我承诺对所提供信息的真实性承担相应法律责任 *
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
                            我同意提交企业资质备案申请，并接受相关部门审核 *
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

          {/* 第六步：提交成功 */}
          {currentStep === 6 && submissionResult && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center space-y-6">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
                      申请提交成功！
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      您的电商企业资质备案申请已成功提交，我们将尽快处理。
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-green-200 dark:border-green-800 w-full max-w-md">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">申请编号：</span>
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">{submissionResult.applicationNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">提交时间：</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{submissionResult.submittedAt}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">预计审核时间：</span>
                        <span className="text-sm text-blue-600 dark:text-blue-400">3-5个工作日</span>
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
                            <p className="leading-relaxed">我们将在1个工作日内进行初审</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="leading-relaxed">审核结果将通过短信和邮件通知您</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="leading-relaxed">如有疑问，请联系客服：<span className="font-medium">400-xxx-xxxx</span></p>
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
              {currentStep > 1 && currentStep < 6 && (
                <Button type="button" variant="outline" onClick={handlePrev}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  上一步
                </Button>
              )}
              {onCancel && currentStep < 6 && (
                <Button type="button" variant="ghost" onClick={onCancel} className="ml-2">
                  取消
                </Button>
              )}
            </div>
            
            <div>
              {currentStep < 5 ? (
                <Button type="button" onClick={handleNext}>
                  下一步
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : currentStep === 5 ? (
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
                  onClick={() => onComplete?.(form.getValues() as EnterpriseQualificationData & { uploadedFiles: any[] })}
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