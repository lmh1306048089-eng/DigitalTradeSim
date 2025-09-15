import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, FileText, Upload, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/experiments/file-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// 表单验证模式
const icCardFormSchema = z.object({
  // 企业基本信息
  companyName: z.string().min(2, "企业名称至少2个字符"),
  unifiedCreditCode: z.string().regex(/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, "请输入正确的统一社会信用代码"),
  registeredAddress: z.string().min(10, "注册地址信息不完整"),
  legalRepresentative: z.string().min(2, "法定代表人姓名至少2个字符"),
  businessLicense: z.string().min(15, "营业执照号码不能少于15位"),
  registeredCapital: z.coerce.number().min(1, "注册资本必须大于0"),
  contactPerson: z.string().min(2, "联系人姓名至少2个字符"),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  contactEmail: z.string().email("请输入有效的邮箱地址"),
  businessScope: z.array(z.string()).min(1, "请至少选择一个经营范围"),
  
  // IC卡申请特有字段
  operatorName: z.string().min(2, "操作员姓名至少2个字符"),
  operatorIdCard: z.string().regex(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, "请输入有效的身份证号"),
  customsDeclarantCertificate: z.string().min(8, "报关人员备案证明编号至少8位"),
  foreignTradeRegistration: z.string().min(8, "对外贸易经营者备案登记表编号至少8位"),
  customsImportExportReceipt: z.string().min(8, "海关进出口货物收发人备案回执编号至少8位"),
  applicationReason: z.string().min(10, "申请原因至少10个字符"),
  expectedCardQuantity: z.coerce.number().min(1, "申请卡片数量至少为1").max(10, "申请卡片数量不能超过10"),
  
  // 声明确认
  dataAccuracy: z.boolean().refine(val => val === true, "必须确认数据真实性"),
  legalResponsibility: z.boolean().refine(val => val === true, "必须承诺承担法律责任")
});

type IcCardFormData = z.infer<typeof icCardFormSchema>;

interface IcCardApplicationFormProps {
  onComplete?: (data: IcCardFormData & { uploadedFiles: any[] }) => void;
  onCancel?: () => void;
}

export function IcCardApplicationForm({ onComplete, onCancel }: IcCardApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTestData, setIsLoadingTestData] = useState(false);
  const { toast } = useToast();

  // 获取IC卡测试数据
  const { data: testDataSets, isLoading: isTestDataLoading } = useQuery<any[]>({
    queryKey: ['/api/ic-card-test-data']
  });

  const form = useForm<IcCardFormData>({
    resolver: zodResolver(icCardFormSchema),
    defaultValues: {
      companyName: "",
      unifiedCreditCode: "",
      registeredAddress: "",
      legalRepresentative: "",
      businessLicense: "",
      registeredCapital: 0,
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      businessScope: [],
      operatorName: "",
      operatorIdCard: "",
      customsDeclarantCertificate: "",
      foreignTradeRegistration: "",
      customsImportExportReceipt: "",
      applicationReason: "",
      expectedCardQuantity: 1,
      dataAccuracy: false,
      legalResponsibility: false
    }
  });

  // 自动填充测试数据函数
  const autoFillDefaultTestData = async () => {
    const dataSetName = '默认测试企业';
    try {
      setIsLoadingTestData(true);
      const response = await apiRequest('GET', `/api/ic-card-test-data/${encodeURIComponent(dataSetName)}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const testData = data.data;
        // 使用测试数据填充表单
        form.reset({
          companyName: testData.companyName,
          unifiedCreditCode: testData.unifiedCreditCode,
          registeredAddress: testData.registeredAddress,
          legalRepresentative: testData.legalRepresentative,
          businessLicense: testData.businessLicense,
          registeredCapital: Number.isFinite(+testData.registeredCapital) ? +testData.registeredCapital : 1000,
          contactPerson: testData.contactPerson,
          contactPhone: testData.contactPhone,
          contactEmail: testData.contactEmail,
          businessScope: testData.businessScope || [],
          operatorName: testData.operatorName,
          operatorIdCard: testData.operatorIdCard,
          customsDeclarantCertificate: testData.customsDeclarantCertificate,
          foreignTradeRegistration: testData.foreignTradeRegistration,
          customsImportExportReceipt: testData.customsImportExportReceipt,
          applicationReason: testData.applicationReason,
          expectedCardQuantity: testData.expectedCardQuantity || 1,
          dataAccuracy: false, // 需要用户手动确认
          legalResponsibility: false // 需要用户手动确认
        });
        
        // 数据已静默填充，无需用户通知
      }
    } catch (error: any) {
      console.error('自动填充测试数据失败:', error);
    } finally {
      setIsLoadingTestData(false);
    }
  };

  // 组件挂载时自动填充默认测试数据
  useEffect(() => {
    if (testDataSets && Array.isArray(testDataSets) && testDataSets.length > 0) {
      autoFillDefaultTestData();
    }
  }, [testDataSets]);

  const businessScopeOptions = [
    "跨境电商零售进出口",
    "一般贸易进出口",
    "技术进出口",
    "货物进出口",
    "保税区仓储服务",
    "供应链管理服务",
    "进出口贸易",
    "电子商务",
    "服装纺织",
    "机械设备",
    "食品饮料",
    "化工产品",
    "医疗器械",
    "汽车配件",
    "数码电子",
    "家居用品"
  ];

  const steps = [
    { id: 1, title: "新企业入网申请", description: "中国电子口岸数据中心平台入网" },
    { id: 2, title: "操作员信息填写", description: "IC卡操作员身份信息" },
    { id: 3, title: "海关备案证明", description: "提交相关备案证明编号" },
    { id: 4, title: "上传申请材料", description: "营业执照等必需文件" },
    { id: 5, title: "确认提交申请", description: "核对信息并提交IC卡申请" },
    { id: 6, title: "申请提交成功", description: "IC卡办理申请已成功提交" }
  ];

  const getStepProgress = () => ((currentStep - 1) / (steps.length - 1)) * 100;

  const validateCurrentStep = async () => {
    const stepFields: Record<number, (keyof IcCardFormData)[]> = {
      1: ["companyName", "unifiedCreditCode", "registeredAddress", "legalRepresentative", "businessLicense", "registeredCapital"],
      2: ["contactPerson", "contactPhone", "contactEmail", "businessScope", "operatorName", "operatorIdCard"],
      3: ["customsDeclarantCertificate", "foreignTradeRegistration", "customsImportExportReceipt", "applicationReason", "expectedCardQuantity"],
      4: [], // 文件上传验证
      5: ["dataAccuracy", "legalResponsibility"]
    };

    const fieldsToValidate = stepFields[currentStep];
    if (fieldsToValidate.length > 0) {
      const result = await form.trigger(fieldsToValidate);
      return result;
    }

    if (currentStep === 4) {
      if (uploadedFiles.length === 0) {
        toast({
          title: "请上传申请材料",
          description: "营业执照副本等材料是必需的",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = (file: any) => {
    setUploadedFiles(prev => [...prev, file]);
  };

  const onSubmit = async (data: IcCardFormData) => {
    setIsSubmitting(true);
    try {
      // 模拟提交到电子口岸系统
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "IC卡申请提交成功",
        description: "您的电子口岸IC卡申请已提交，请等待审核结果"
      });

      // 切换到成功页面
      setCurrentStep(6);
      
      // 3秒后执行回调
      setTimeout(() => {
        onComplete?.({ ...data, uploadedFiles });
      }, 3000);
    } catch (error) {
      toast({
        title: "提交失败",
        description: "请检查网络连接后重试",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">中国电子口岸数据中心平台入网申请</h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                请填写企业基本信息，用于在中国电子口岸数据中心平台进行新企业入网申请操作。
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>企业名称 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入企业全称" data-testid="input-company-name" />
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
                    <FormLabel>统一社会信用代码 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="18位统一社会信用代码" maxLength={18} data-testid="input-credit-code" />
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
                    <FormLabel>法定代表人 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入法定代表人姓名" data-testid="input-legal-rep" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessLicense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>营业执照注册号 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入营业执照注册号" data-testid="input-business-license" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registeredCapital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>注册资本（万元） <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        inputMode="numeric"
                        min="1"
                        step="0.01"
                        placeholder="请输入注册资本" 
                        data-testid="input-registered-capital" 
                      />
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
                  <FormLabel>注册地址 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="请输入详细的企业注册地址" className="min-h-[80px]" data-testid="textarea-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800 mb-6">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">IC卡操作员信息</h3>
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                请填写IC卡操作员身份信息、联系方式和企业经营范围。操作员身份证原件需要在后续步骤中上传。
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>联系人 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="联系人姓名" 
                        data-testid="input-contact-person"
                      />
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
                    <FormLabel>联系电话 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="手机号码" 
                        data-testid="input-contact-phone"
                      />
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
                    <FormLabel>联系邮箱 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="邮箱地址" 
                        type="email" 
                        data-testid="input-contact-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="operatorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>操作员姓名 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入操作员姓名" data-testid="input-operator-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operatorIdCard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>操作员身份证号 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入18位身份证号" maxLength={18} data-testid="input-operator-id" />
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
                  <FormLabel>经营范围 <span className="text-red-500">*</span></FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {businessScopeOptions.map((scope) => (
                      <div key={scope} className="flex items-center space-x-2">
                        <Checkbox
                          id={scope}
                          checked={field.value?.includes(scope) || false}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, scope]);
                            } else {
                              field.onChange(currentValue.filter((item) => item !== scope));
                            }
                          }}
                          data-testid={`checkbox-${scope}`}
                        />
                        <label htmlFor={scope} className="text-sm font-medium leading-none">
                          {scope}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800 mb-6">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">海关备案证明信息</h3>
              <p className="text-purple-700 dark:text-purple-300 text-sm">
                请填写海关签发的相关备案证明编号信息，这些证明文件的原件需要在下一步骤中上传。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customsDeclarantCertificate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>报关人员备案证明编号 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入备案证明编号" data-testid="input-declarant-certificate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foreignTradeRegistration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>对外贸易经营者备案登记表编号 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入登记表编号" data-testid="input-trade-registration" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customsImportExportReceipt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>海关进出口货物收发人备案回执编号 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入回执编号" data-testid="input-import-export-receipt" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedCardQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>申请IC卡数量 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        inputMode="numeric"
                        min="1"
                        max="10"
                        placeholder="请输入申请数量" 
                        data-testid="input-card-quantity" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="applicationReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>申请原因 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="请详细说明申请IC卡的原因和用途" 
                      className="min-h-[100px]" 
                      data-testid="textarea-application-reason" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">必需材料清单</h3>
              </div>
              <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                <li>• 营业执照副本复印件（加盖企业公章）</li>
                <li>• 操作员身份证原件复印件</li>
                <li>• 海关签发的《报关人员备案证明》</li>
                <li>• 《对外贸易经营者备案登记表》原件</li>
                <li>• 海关进出口货物收发人备案回执</li>
              </ul>
            </div>

            <FileUpload
              accept={{
                'application/pdf': ['.pdf'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'image/jpeg': ['.jpg', '.jpeg'],
                'image/png': ['.png']
              }}
              maxSize={10 * 1024 * 1024} // 10MB
              onUploadComplete={handleFileUpload}
              experimentId="ic-card-experiment-id"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">提交前确认</h3>
              </div>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                请仔细核对所填信息，提交后将无法修改。我们将在3-5个工作日内完成审核。
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="dataAccuracy"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-data-accuracy"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        我确认所填写的信息真实准确 <span className="text-red-500">*</span>
                      </FormLabel>
                    </div>
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
                        data-testid="checkbox-legal-responsibility"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        我承诺承担因虚假信息导致的法律责任 <span className="text-red-500">*</span>
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">申请信息摘要</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>企业名称：{form.getValues("companyName") || "未填写"}</p>
                <p>操作员：{form.getValues("operatorName") || "未填写"}</p>
                <p>申请IC卡数量：{form.getValues("expectedCardQuantity") || 0} 张</p>
                <p>已上传文件：{uploadedFiles.length} 个</p>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">申请提交成功</h3>
              <p className="text-green-600 dark:text-green-400">
                您的电子口岸IC卡申请已成功提交，申请编号：IC-{Date.now().toString().slice(-8)}
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                我们将在3-5个工作日内完成审核，请保持联系方式畅通
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8" data-testid="ic-card-application-form">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="title-ic-card-application">电子口岸IC卡申请</h1>
            <p className="text-muted-foreground">中国电子口岸数据中心平台 - 新企业入网申请</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>步骤 {currentStep} / {steps.length - 1}</span>
            <span>{Math.round(getStepProgress())}% 完成</span>
          </div>
          <Progress value={getStepProgress()} className="h-2" data-testid="progress-bar" />
        </div>

        <div className="flex flex-wrap gap-2">
          {steps.slice(0, -1).map((step) => (
            <Badge
              key={step.id}
              variant={currentStep === step.id ? "default" : currentStep > step.id ? "secondary" : "outline"}
              className="px-3 py-1"
              data-testid={`badge-step-${step.id}`}
            >
              {step.id}. {step.title}
            </Badge>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {currentStep}
            </span>
            {steps[currentStep - 1]?.title}
          </CardTitle>
          <p className="text-muted-foreground">{steps[currentStep - 1]?.description}</p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {renderStepContent()}

              {currentStep < steps.length - 1 && (
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    data-testid="button-previous"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    上一步
                  </Button>

                  {currentStep === steps.length - 1 ? (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[120px]"
                      data-testid="button-submit"
                    >
                      {isSubmitting ? "提交中..." : "提交申请"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleNext}
                      data-testid="button-next"
                    >
                      下一步
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {currentStep === steps.length && (
                <div className="flex justify-center pt-6 border-t">
                  <Button
                    type="button"
                    onClick={() => onComplete?.({ ...form.getValues(), uploadedFiles })}
                    data-testid="button-complete"
                  >
                    完成
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}