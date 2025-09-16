import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, FileText, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Package, Warehouse, Globe, MapPin } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/experiments/file-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// 海外仓备案表单验证schema
const overseasWarehouseSchema = z.object({
  // 企业基本信息
  companyName: z.string().min(2, "企业名称至少2个字符"),
  unifiedCreditCode: z.string().regex(/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, "请输入正确的统一社会信用代码"),
  legalRepresentative: z.string().min(2, "法定代表人姓名至少2个字符"),
  registeredAddress: z.string().min(10, "注册地址信息不完整"),
  businessAddress: z.string().min(10, "经营地址信息不完整"),
  contactPerson: z.string().min(2, "联系人姓名至少2个字符"),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  contactEmail: z.string().email("请输入有效的邮箱地址"),
  businessLicense: z.string().min(15, "营业执照注册号不能少于15位"),
  businessScope: z.string().min(10, "经营范围信息不完整"),
  registeredCapital: z.number().min(1, "注册资本必须大于0"),
  
  // 海外仓出口企业备案登记表字段
  exportBusinessScope: z.string().min(10, "出口经营范围信息不完整"),
  overseasWarehouseCountry: z.string().min(2, "请选择海外仓所在国家"),
  overseasWarehouseAddress: z.string().min(20, "海外仓地址信息不完整"),
  warehouseOperatingModel: z.string().min(2, "请选择仓库运营模式"),
  expectedAnnualExportVolume: z.number().min(1, "预计年出口量必须大于0"),
  mainExportProducts: z.string().min(10, "主要出口商品信息不完整"),
  targetMarkets: z.string().min(10, "目标市场信息不完整"),
  
  // 海外仓信息登记表字段
  warehouseName: z.string().min(2, "海外仓名称至少2个字符"),
  warehouseCode: z.string().min(1, "请输入海外仓编码"),
  warehouseArea: z.number().min(1, "仓库面积必须大于0"),
  storageCapacity: z.number().min(1, "储存能力必须大于0"),
  warehouseType: z.string().min(2, "请选择仓库类型"),
  operatingLicense: z.string().optional(),
  warehouseContactPerson: z.string().min(2, "仓库联系人姓名至少2个字符"),
  warehouseContactPhone: z.string().min(1, "请输入仓库联系电话"),
  warehouseManagementSystem: z.string().optional(),
  
  // 海外仓所有权信息
  ownershipType: z.string().min(2, "请选择所有权类型"),
  leaseAgreementNumber: z.string().optional(),
  leaseStartDate: z.string().optional(),
  leaseEndDate: z.string().optional(),
  lessorInformation: z.string().optional(),
  
  // 海关相关信息
  customsSupervisionCode: z.string().optional(),
  bonded_area_code: z.string().optional(),
  warehouseRegistrationNumber: z.string().optional(),
  insuranceInformation: z.string().optional(),
  emergencyContactInfo: z.string().optional(),
  
  // 声明确认
  dataAccuracy: z.boolean().refine(val => val === true, "必须确认数据真实性"),
  legalResponsibility: z.boolean().refine(val => val === true, "必须承诺承担法律责任"),
  submitConsent: z.boolean().refine(val => val === true, "必须同意提交申请")
});

type OverseasWarehouseData = z.infer<typeof overseasWarehouseSchema>;

interface OverseasWarehouseFormProps {
  onComplete?: (data: any & { uploadedFiles: any[] }) => void;
  onCancel?: () => void;
}

export function OverseasWarehouseForm({ onComplete, onCancel }: OverseasWarehouseFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [filesByCategory, setFilesByCategory] = useState<{ [key: string]: any[] }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    applicationNumber: string;
    submittedAt: string;
    registrationNumber: string;
  } | null>(null);
  const { toast } = useToast();

  // 获取测试数据（自动预填）
  const { data: testData } = useQuery<{success: boolean; data: any[]}>({
    queryKey: ['/api/test-data/overseas-warehouse'],
    enabled: true,
  });

  const form = useForm<OverseasWarehouseData>({
    resolver: zodResolver(overseasWarehouseSchema),
    defaultValues: {
      companyName: "",
      unifiedCreditCode: "",
      legalRepresentative: "",
      registeredAddress: "",
      businessAddress: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      businessLicense: "",
      businessScope: "",
      registeredCapital: 0,
      exportBusinessScope: "",
      overseasWarehouseCountry: "",
      overseasWarehouseAddress: "",
      warehouseOperatingModel: "",
      expectedAnnualExportVolume: 0,
      mainExportProducts: "",
      targetMarkets: "",
      warehouseName: "",
      warehouseCode: "",
      warehouseArea: 0,
      storageCapacity: 0,
      warehouseType: "",
      operatingLicense: "",
      warehouseContactPerson: "",
      warehouseContactPhone: "",
      warehouseManagementSystem: "",
      ownershipType: "",
      leaseAgreementNumber: "",
      leaseStartDate: "",
      leaseEndDate: "",
      lessorInformation: "",
      customsSupervisionCode: "",
      bonded_area_code: "",
      warehouseRegistrationNumber: "",
      insuranceInformation: "",
      emergencyContactInfo: "",
      dataAccuracy: false,
      legalResponsibility: false,
      submitConsent: false
    }
  });

  // 自动预填测试数据
  useEffect(() => {
    if (testData?.data && testData.data.length > 0) {
      const defaultTestData = testData.data.find((item: any) => item.dataSetName === "默认测试企业") || testData.data[0];
      
      if (defaultTestData) {
        // 静默预填所有字段
        form.reset({
          companyName: defaultTestData.companyName,
          unifiedCreditCode: defaultTestData.unifiedCreditCode,
          legalRepresentative: defaultTestData.legalRepresentative,
          registeredAddress: defaultTestData.registeredAddress,
          businessAddress: defaultTestData.businessAddress,
          contactPerson: defaultTestData.contactPerson,
          contactPhone: defaultTestData.contactPhone,
          contactEmail: defaultTestData.contactEmail,
          businessLicense: defaultTestData.businessLicense,
          businessScope: defaultTestData.businessScope,
          registeredCapital: defaultTestData.registeredCapital,
          exportBusinessScope: defaultTestData.exportBusinessScope,
          overseasWarehouseCountry: defaultTestData.overseasWarehouseCountry,
          overseasWarehouseAddress: defaultTestData.overseasWarehouseAddress,
          warehouseOperatingModel: defaultTestData.warehouseOperatingModel,
          expectedAnnualExportVolume: defaultTestData.expectedAnnualExportVolume,
          mainExportProducts: defaultTestData.mainExportProducts,
          targetMarkets: defaultTestData.targetMarkets,
          warehouseName: defaultTestData.warehouseName,
          warehouseCode: defaultTestData.warehouseCode,
          warehouseArea: Number(defaultTestData.warehouseArea),
          storageCapacity: defaultTestData.storageCapacity,
          warehouseType: defaultTestData.warehouseType,
          operatingLicense: defaultTestData.operatingLicense || "",
          warehouseContactPerson: defaultTestData.warehouseContactPerson,
          warehouseContactPhone: defaultTestData.warehouseContactPhone,
          warehouseManagementSystem: defaultTestData.warehouseManagementSystem || "",
          ownershipType: defaultTestData.ownershipType,
          leaseAgreementNumber: defaultTestData.leaseAgreementNumber || "",
          leaseStartDate: defaultTestData.leaseStartDate || "",
          leaseEndDate: defaultTestData.leaseEndDate || "",
          lessorInformation: defaultTestData.lessorInformation || "",
          customsSupervisionCode: defaultTestData.customsSupervisionCode || "",
          bonded_area_code: defaultTestData.bonded_area_code || "",
          warehouseRegistrationNumber: defaultTestData.warehouseRegistrationNumber || "",
          insuranceInformation: defaultTestData.insuranceInformation || "",
          emergencyContactInfo: defaultTestData.emergencyContactInfo || "",
          dataAccuracy: false, // 保持同意复选框为未选中状态
          legalResponsibility: false,
          submitConsent: false
        });
      }
    }
  }, [testData, form]);

  const steps = [
    { 
      number: 1, 
      title: "企业基本信息", 
      icon: <Building2 className="h-5 w-5" />,
      description: "填写企业基础信息和联系方式"
    },
    { 
      number: 2, 
      title: "海外仓出口企业备案", 
      icon: <Globe className="h-5 w-5" />,
      description: "填写出口企业备案登记信息"
    },
    { 
      number: 3, 
      title: "海外仓信息登记", 
      icon: <Warehouse className="h-5 w-5" />,
      description: "填写海外仓基本信息和管理信息"
    },
    { 
      number: 4, 
      title: "上传备案材料", 
      icon: <FileText className="h-5 w-5" />,
      description: "上传必需的备案材料和证明文件"
    },
    { 
      number: 5, 
      title: "确认提交", 
      icon: <CheckCircle className="h-5 w-5" />,
      description: "核对信息并确认提交备案申请"
    }
  ];

  const getCurrentStepProgress = () => {
    return ((currentStep - 1) / (steps.length - 1)) * 100;
  };

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof OverseasWarehouseData)[] = [];
    
    switch(currentStep) {
      case 1:
        fieldsToValidate = ["companyName", "unifiedCreditCode", "legalRepresentative", "registeredAddress", "businessAddress", "contactPerson", "contactPhone", "contactEmail", "businessLicense", "businessScope", "registeredCapital"];
        break;
      case 2:
        fieldsToValidate = ["exportBusinessScope", "overseasWarehouseCountry", "overseasWarehouseAddress", "warehouseOperatingModel", "expectedAnnualExportVolume", "mainExportProducts", "targetMarkets"];
        break;
      case 3:
        fieldsToValidate = ["warehouseName", "warehouseCode", "warehouseArea", "storageCapacity", "warehouseType", "warehouseContactPerson", "warehouseContactPhone", "ownershipType"];
        break;
      case 4:
        setCurrentStep(currentStep + 1);
        return;
      case 5:
        fieldsToValidate = ["dataAccuracy", "legalResponsibility", "submitConsent"];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    } else {
      toast({
        title: "表单验证失败",
        description: "请检查并完善必填字段信息",
        variant: "destructive",
      });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = (files: any[], category: string) => {
    setFilesByCategory(prev => ({
      ...prev,
      [category]: files
    }));
    
    const allFiles = Object.values({ ...filesByCategory, [category]: files }).flat();
    setUploadedFiles(allFiles);
  };

  const handleSubmit = async (data: OverseasWarehouseData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // 模拟提交处理
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = {
        applicationNumber: `OWR${Date.now().toString().slice(-6)}`,
        submittedAt: new Date().toLocaleString('zh-CN'),
        registrationNumber: `OWR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
      };
      
      setSubmissionResult(result);
      
      toast({
        title: "备案申请提交成功！",
        description: `申请编号：${result.applicationNumber}`,
      });

      // 调用完成回调
      onComplete?.({
        ...data,
        uploadedFiles,
        applicationNumber: result.applicationNumber,
        registrationNumber: result.registrationNumber
      });
      
    } catch (error) {
      console.error("提交失败:", error);
      toast({
        title: "提交失败",
        description: "请检查网络连接后重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>企业名称 *</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-company-name"
                        placeholder="请输入企业全称" 
                        {...field} 
                      />
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
                      <Input 
                        data-testid="input-unified-credit-code"
                        placeholder="18位统一社会信用代码" 
                        {...field} 
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
                name="legalRepresentative"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>法定代表人 *</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-legal-representative"
                        placeholder="请输入法定代表人姓名" 
                        {...field} 
                      />
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
                    <FormLabel>营业执照注册号 *</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-business-license"
                        placeholder="请输入营业执照注册号" 
                        {...field} 
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
                  <FormLabel>注册地址 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      data-testid="input-registered-address"
                      placeholder="请输入详细的注册地址" 
                      {...field} 
                    />
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
                  <FormLabel>经营地址 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      data-testid="input-business-address"
                      placeholder="请输入详细的经营地址" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>联系人 *</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-contact-person"
                        placeholder="请输入联系人姓名" 
                        {...field} 
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
                    <FormLabel>联系电话 *</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-contact-phone"
                        placeholder="请输入手机号码" 
                        {...field} 
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
                    <FormLabel>联系邮箱 *</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-contact-email"
                        type="email"
                        placeholder="请输入邮箱地址" 
                        {...field} 
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
                name="registeredCapital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>注册资本（万元）*</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-registered-capital"
                        type="number"
                        placeholder="请输入注册资本"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
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
                      data-testid="input-business-scope"
                      placeholder="请输入详细的经营范围" 
                      {...field} 
                    />
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
            <FormField
              control={form.control}
              name="exportBusinessScope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>出口经营范围 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      data-testid="input-export-business-scope"
                      placeholder="请输入详细的出口经营范围" 
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="overseasWarehouseCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>海外仓所在国家 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-overseas-warehouse-country">
                          <SelectValue placeholder="请选择国家" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="美国">美国</SelectItem>
                        <SelectItem value="德国">德国</SelectItem>
                        <SelectItem value="英国">英国</SelectItem>
                        <SelectItem value="日本">日本</SelectItem>
                        <SelectItem value="澳大利亚">澳大利亚</SelectItem>
                        <SelectItem value="加拿大">加拿大</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouseOperatingModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>仓库运营模式 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-warehouse-operating-model">
                          <SelectValue placeholder="请选择运营模式" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="自营">自营</SelectItem>
                        <SelectItem value="第三方运营">第三方运营</SelectItem>
                        <SelectItem value="委托管理">委托管理</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="overseasWarehouseAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>海外仓地址 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      data-testid="input-overseas-warehouse-address"
                      placeholder="请输入详细的海外仓地址" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedAnnualExportVolume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>预计年出口量（万美元）*</FormLabel>
                  <FormControl>
                    <Input 
                      data-testid="input-expected-annual-export-volume"
                      type="number"
                      placeholder="请输入预计年出口量"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mainExportProducts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>主要出口商品 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      data-testid="input-main-export-products"
                      placeholder="请输入主要出口商品信息" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetMarkets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>目标市场 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      data-testid="input-target-markets"
                      placeholder="请输入目标市场信息" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="warehouseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>海外仓名称 *</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-warehouse-name"
                        placeholder="请输入海外仓名称" 
                        {...field} 
                      />
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
                    <FormLabel>海外仓编码 *</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-warehouse-code"
                        placeholder="请输入海外仓编码" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="warehouseArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>仓库面积（平方米）*</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-warehouse-area"
                        type="number"
                        placeholder="请输入仓库面积"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="storageCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>储存能力（立方米）*</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-storage-capacity"
                        type="number"
                        placeholder="请输入储存能力"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>仓库类型 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-warehouse-type">
                          <SelectValue placeholder="请选择仓库类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="保税仓">保税仓</SelectItem>
                        <SelectItem value="一般贸易仓">一般贸易仓</SelectItem>
                        <SelectItem value="FBA仓">FBA仓</SelectItem>
                        <SelectItem value="第三方仓">第三方仓</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="warehouseContactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>仓库联系人 *</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-warehouse-contact-person"
                        placeholder="请输入仓库联系人姓名" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="warehouseContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>仓库联系电话 *</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-warehouse-contact-phone"
                        placeholder="请输入仓库联系电话" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ownershipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>所有权类型 *</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      data-testid="radio-ownership-type"
                      onValueChange={field.onChange} 
                      value={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="自有" id="ownership-owned" />
                        <label htmlFor="ownership-owned">自有</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="租赁" id="ownership-rental" />
                        <label htmlFor="ownership-rental">租赁</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="委托管理" id="ownership-managed" />
                        <label htmlFor="ownership-managed">委托管理</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("ownershipType") === "租赁" && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">租赁协议信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="leaseAgreementNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>租赁协议编号</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-lease-agreement-number"
                            placeholder="请输入租赁协议编号" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="leaseStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>租赁开始日期</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-lease-start-date"
                            type="date"
                            {...field} 
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
                    name="leaseEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>租赁结束日期</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-lease-end-date"
                            type="date"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="lessorInformation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>出租方信息</FormLabel>
                      <FormControl>
                        <Textarea 
                          data-testid="input-lessor-information"
                          placeholder="请输入出租方详细信息" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-medium">海关相关信息（可选）</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customsSupervisionCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>海关监管代码</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-customs-supervision-code"
                          placeholder="请输入海关监管代码" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="warehouseRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>仓库注册编号</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-warehouse-registration-number"
                          placeholder="请输入仓库注册编号" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="insuranceInformation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>保险信息</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="input-insurance-information"
                        placeholder="请输入保险信息" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="emergencyContactInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>应急联系信息</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="input-emergency-contact-info"
                        placeholder="请输入应急联系信息" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">上传备案材料</h3>
              <p className="text-gray-600">请上传海外仓业务模式备案所需的各项材料</p>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  跨境电商海外仓出口企业备案登记表
                </h4>
                <FileUpload
                  onUploadComplete={(file) => handleFileUpload([file], "exportRegistration")}
                  accept={{
                    'application/pdf': ['.pdf'],
                    'application/msword': ['.doc'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                  }}
                />
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Warehouse className="h-4 w-4 mr-2" />
                  跨境电商海外仓信息登记表
                </h4>
                <FileUpload
                  onUploadComplete={(file) => handleFileUpload([file], "warehouseInfo")}
                  accept={{
                    'application/pdf': ['.pdf'],
                    'application/msword': ['.doc'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                  }}
                />
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  海外仓所有权文件
                </h4>
                <FileUpload
                  onUploadComplete={(file) => handleFileUpload([file], "ownershipDocuments")}
                  accept={{
                    'application/pdf': ['.pdf'],
                    'application/msword': ['.doc'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                    'image/*': ['.jpg', '.png']
                  }}
                />
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  企业营业执照
                </h4>
                <FileUpload
                  onUploadComplete={(file) => handleFileUpload([file], "businessLicense")}
                  accept={{
                    'application/pdf': ['.pdf'],
                    'image/*': ['.jpg', '.png']
                  }}
                />
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  其他相关材料
                </h4>
                <FileUpload
                  onUploadComplete={(file) => handleFileUpload([file], "otherDocuments")}
                  accept={{
                    'application/pdf': ['.pdf'],
                    'application/msword': ['.doc'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                    'image/*': ['.jpg', '.png']
                  }}
                />
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">已上传文件 ({uploadedFiles.length})</h4>
                <div className="space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="text-sm text-green-700">
                      • {file.name || file.originalName}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">确认提交备案申请</h3>
              <p className="text-gray-600">请仔细核对以下信息，确认无误后提交申请</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">企业名称：</span>
                  <span data-testid="text-review-company-name">{form.watch("companyName")}</span>
                </div>
                <div>
                  <span className="font-medium">统一社会信用代码：</span>
                  <span data-testid="text-review-unified-credit-code">{form.watch("unifiedCreditCode")}</span>
                </div>
                <div>
                  <span className="font-medium">海外仓名称：</span>
                  <span data-testid="text-review-warehouse-name">{form.watch("warehouseName")}</span>
                </div>
                <div>
                  <span className="font-medium">海外仓所在国家：</span>
                  <span data-testid="text-review-warehouse-country">{form.watch("overseasWarehouseCountry")}</span>
                </div>
                <div>
                  <span className="font-medium">运营模式：</span>
                  <span data-testid="text-review-operating-model">{form.watch("warehouseOperatingModel")}</span>
                </div>
                <div>
                  <span className="font-medium">已上传文件：</span>
                  <span data-testid="text-review-uploaded-files">{uploadedFiles.length} 个文件</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="dataAccuracy"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-data-accuracy"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>数据真实性确认</FormLabel>
                      <p className="text-sm text-gray-600">
                        我确认所提供的所有信息均真实、准确、完整，如有虚假信息愿承担相应的法律责任。
                      </p>
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
                        data-testid="checkbox-legal-responsibility"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>法律责任承诺</FormLabel>
                      <p className="text-sm text-gray-600">
                        我承诺遵守中华人民共和国相关法律法规，承担因海外仓运营产生的一切法律责任。
                      </p>
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
                        data-testid="checkbox-submit-consent"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>提交同意</FormLabel>
                      <p className="text-sm text-gray-600">
                        我同意提交此备案申请，并理解提交后将进入海关审核流程。
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {submissionResult && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">备案申请提交成功！</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <div>申请编号：<span className="font-mono">{submissionResult.applicationNumber}</span></div>
                  <div>提交时间：{submissionResult.submittedAt}</div>
                  <div>备案编号：<span className="font-mono">{submissionResult.registrationNumber}</span></div>
                  <div className="mt-2 text-green-600">
                    请保存好申请编号，您可以凭此编号查询审核进度。
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">海外仓业务模式备案</h1>
        <p className="text-gray-600">
          根据海关总署相关规定，开展海外仓业务的跨境电商企业需要完成业务模式备案登记
        </p>
      </div>

      {/* 步骤指示器 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep > step.number 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : currentStep === step.number 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'bg-gray-100 border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  step.icon
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {steps[currentStep - 1]?.title}
          </h2>
          <p className="text-sm text-gray-600">
            {steps[currentStep - 1]?.description}
          </p>
        </div>
        
        <div className="mt-4">
          <Progress value={getCurrentStepProgress()} className="w-full" />
        </div>
      </div>

      {/* 表单内容 */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* 导航按钮 */}
          <div className="flex justify-between">
            <div>
              {currentStep > 1 && !submissionResult && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  data-testid="button-prev-step"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  上一步
                </Button>
              )}
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  className="ml-2"
                  data-testid="button-cancel"
                >
                  取消
                </Button>
              )}
            </div>
            
            <div>
              {currentStep < steps.length && !submissionResult && (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  data-testid="button-next-step"
                >
                  下一步
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              
              {currentStep === steps.length && !submissionResult && (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="button-submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      提交中...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      提交备案申请
                    </>
                  )}
                </Button>
              )}
              
              {submissionResult && (
                <Button
                  type="button"
                  onClick={() => onComplete?.(form.getValues())}
                  data-testid="button-complete"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  完成备案
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}