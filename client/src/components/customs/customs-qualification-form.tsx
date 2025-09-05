import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, FileText, Upload, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
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

// 海关企业资质备案表单验证模式
const enterpriseFormSchema = z.object({
  // 企业基本信息
  companyName: z.string().min(2, "企业名称至少2个字符"),
  unifiedCreditCode: z.string().regex(/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, "请输入正确的统一社会信用代码"),
  registeredAddress: z.string().min(10, "注册地址信息不完整"),
  businessAddress: z.string().min(10, "经营地址信息不完整"),
  businessLicense: z.string().min(15, "营业执照号码不能少于15位"),
  registeredCapital: z.string().min(1, "注册资本不能为空"),
  establishmentDate: z.string().min(1, "成立日期不能为空"),
  businessTerm: z.string().min(1, "经营期限不能为空"),
  
  // 法定代表人信息
  legalRepresentative: z.string().min(2, "法定代表人姓名至少2个字符"),
  legalRepIdCard: z.string().regex(/^\d{17}[\dXx]$/, "请输入正确的身份证号码"),
  legalRepPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  
  // 联系信息
  contactPerson: z.string().min(2, "联系人姓名至少2个字符"),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  contactEmail: z.string().email("请输入有效的邮箱地址"),
  
  // 经营资质信息
  businessScope: z.array(z.string()).min(1, "请至少选择一个经营范围"),
  importExportLicense: z.string().optional(),
  foreignTradeRecordNumber: z.string().min(1, "对外贸易经营者备案登记表编号不能为空"),
  customsRegisterCode: z.string().min(1, "海关注册编码不能为空"),
  
  // 财务和税务信息
  taxRegistrationNumber: z.string().min(1, "税务登记号不能为空"),
  organizationCode: z.string().min(1, "组织机构代码不能为空"),
  bankAccount: z.string().min(1, "银行账户信息不能为空"),
  foreignExchangeAccount: z.string().min(1, "外汇结算账户信息不能为空"),
  
  // 产品和生产能力信息
  mainProducts: z.string().min(10, "主要产品描述至少10个字符"),
  productionCapacity: z.string().min(10, "生产能力描述至少10个字符"),
  qualityCertification: z.array(z.string()).min(1, "请至少选择一个质量认证"),
  
  // 跨境电商特定信息
  ecommerceMode: z.array(z.string()).min(1, "请至少选择一个跨境电商模式"),
  targetCountries: z.string().min(5, "目标销售国家/地区至少5个字符"),
  annualTradeVolume: z.string().min(1, "预计年贸易额不能为空"),
  
  // 声明确认
  dataAccuracy: z.boolean().refine(val => val === true, "必须确认数据真实性"),
  legalResponsibility: z.boolean().refine(val => val === true, "必须承诺承担法律责任"),
  complianceCommitment: z.boolean().refine(val => val === true, "必须承诺遵守相关法律法规")
});

type EnterpriseFormData = z.infer<typeof enterpriseFormSchema>;

interface CustomsQualificationFormProps {
  onComplete?: (data: EnterpriseFormData & { uploadedFiles: any[] }) => void;
  onCancel?: () => void;
}

export function CustomsQualificationForm({ onComplete, onCancel }: CustomsQualificationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<EnterpriseFormData>({
    resolver: zodResolver(enterpriseFormSchema),
    defaultValues: {
      companyName: "",
      unifiedCreditCode: "",
      registeredAddress: "",
      businessAddress: "",
      businessLicense: "",
      registeredCapital: "",
      establishmentDate: "",
      businessTerm: "",
      legalRepresentative: "",
      legalRepIdCard: "",
      legalRepPhone: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      businessScope: [],
      importExportLicense: "",
      foreignTradeRecordNumber: "",
      customsRegisterCode: "",
      taxRegistrationNumber: "",
      organizationCode: "",
      bankAccount: "",
      foreignExchangeAccount: "",
      mainProducts: "",
      productionCapacity: "",
      qualityCertification: [],
      ecommerceMode: [],
      targetCountries: "",
      annualTradeVolume: "",
      dataAccuracy: false,
      legalResponsibility: false,
      complianceCommitment: false
    }
  });

  const businessScopeOptions = [
    "进出口贸易", "电子商务", "服装纺织", "食品饮料", "电子产品", 
    "化妆品", "玩具用品", "家居用品", "运动健身", "母婴用品", 
    "汽车配件", "机械设备"
  ];
  
  const qualityCertificationOptions = [
    "ISO9001质量管理体系认证", "ISO14001环境管理体系认证", "CE认证", 
    "FCC认证", "3C认证", "FDA认证", "ROHS认证", "GMP认证"
  ];
  
  const ecommerceModeOptions = [
    "B2B(企业对企业)", "B2C(企业对消费者)", "C2C(消费者对消费者)", 
    "O2O(线上线下融合)", "保税仓模式", "直邮模式", "海外仓模式"
  ];

  const steps = [
    { id: 1, title: "企业基本信息", description: "填写企业注册信息" },
    { id: 2, title: "法定代表人信息", description: "法人及联系人信息" },
    { id: 3, title: "经营资质信息", description: "经营范围及资质" },
    { id: 4, title: "财务税务信息", description: "银行及税务信息" },
    { id: 5, title: "产品生产信息", description: "产品及生产能力" },
    { id: 6, title: "跨境电商信息", description: "电商模式及市场" },
    { id: 7, title: "上传备案材料", description: "提交相关证明文件" },
    { id: 8, title: "确认提交", description: "核对信息并提交审核" },
    { id: 9, title: "提交成功", description: "备案申请已提交" }
  ];

  const getStepProgress = () => ((currentStep - 1) / (steps.length - 1)) * 100;

  const validateCurrentStep = async () => {
    const stepFields: Record<number, (keyof EnterpriseFormData)[]> = {
      1: ["companyName", "unifiedCreditCode", "registeredAddress", "businessAddress", "businessLicense", "registeredCapital", "establishmentDate", "businessTerm"],
      2: ["legalRepresentative", "legalRepIdCard", "legalRepPhone", "contactPerson", "contactPhone", "contactEmail"],
      3: ["businessScope", "foreignTradeRecordNumber", "customsRegisterCode"],
      4: ["taxRegistrationNumber", "organizationCode", "bankAccount", "foreignExchangeAccount"],
      5: ["mainProducts", "productionCapacity", "qualityCertification"],
      6: ["ecommerceMode", "targetCountries", "annualTradeVolume"],
      7: [], // 文件上传验证
      8: ["dataAccuracy", "legalResponsibility", "complianceCommitment"]
    };

    const fieldsToValidate = stepFields[currentStep];
    if (fieldsToValidate && fieldsToValidate.length > 0) {
      const result = await form.trigger(fieldsToValidate);
      return result;
    }

    if (currentStep === 7) {
      if (uploadedFiles.length === 0) {
        toast({
          title: "请上传备案材料",
          description: "必需的备案材料不能为空",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      if (currentStep === 8) {
        onSubmit(form.getValues());
      } else if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
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

  const onSubmit = async (data: EnterpriseFormData) => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "电商企业资质备案申请提交成功",
        description: "您的电商企业资质备案申请已提交，请等待审核结果"
      });

      setCurrentStep(9);
      
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
      case 1: // 企业基本信息
        return (
          <div className="space-y-6">
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
                    <FormLabel>注册资本 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="如: 100万元人民币" data-testid="input-registered-capital" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="establishmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>成立日期 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-establishment-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>经营期限 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="如: 长期 或 至2030年12月31日" data-testid="input-business-term" />
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
                    <Textarea {...field} placeholder="请输入详细的企业注册地址" className="min-h-[80px]" data-testid="textarea-registered-address" />
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
                  <FormLabel>经营地址 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="请输入详细的经营地址（如与注册地址相同可填写'同上'）" className="min-h-[80px]" data-testid="textarea-business-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2: // 法定代表人信息
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">法定代表人及联系人信息</h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                请准确填写法定代表人及企业联系人信息，此信息将用于海关备案审核及后续联系。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="legalRepresentative"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>法定代表人姓名 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入法定代表人姓名" data-testid="input-legal-rep" />
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
                    <FormLabel>法定代表人身份证号 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入18位身份证号码" maxLength={18} data-testid="input-legal-rep-id" />
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
                    <FormLabel>法定代表人手机号 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入11位手机号" data-testid="input-legal-rep-phone" />
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
                    <FormLabel>联系人姓名 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入联系人姓名" data-testid="input-contact-person" />
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
                    <FormLabel>联系人手机号 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入11位手机号" data-testid="input-contact-phone" />
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
                    <FormLabel>联系人邮箱 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="请输入邮箱地址" data-testid="input-contact-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 3: // 经营资质信息
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">经营资质证照信息</h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                请提供企业经营资质相关信息，包括经营范围、贸易备案等关键证照信息。
              </p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="foreignTradeRecordNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>对外贸易经营者备案登记表编号 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入备案登记表编号" data-testid="input-foreign-trade-record" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customsRegisterCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>海关注册编码 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入海关注册编码" data-testid="input-customs-register-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="importExportLicense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>进出口经营许可证号</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入许可证号（如有）" data-testid="input-import-export-license" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 4: // 财务税务信息
        return (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">财务税务信息</h3>
              <p className="text-green-700 dark:text-green-300 text-sm">
                请提供企业财务税务相关信息，包括银行账户、税务登记等信息。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taxRegistrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>税务登记号 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入税务登记号" data-testid="input-tax-registration" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>组织机构代码 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入组织机构代码" data-testid="input-organization-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>银行账户信息 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入银行名称及账号" data-testid="input-bank-account" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foreignExchangeAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>外汇结算账户信息 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入外汇结算账户信息" data-testid="input-foreign-exchange-account" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 5: // 产品生产信息
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">产品生产信息</h3>
              <p className="text-purple-700 dark:text-purple-300 text-sm">
                请详细描述企业主要产品和生产能力，以及相关质量认证情况。
              </p>
            </div>

            <FormField
              control={form.control}
              name="mainProducts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>主要产品描述 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="请详细描述企业主要产品，包括产品类别、型号、特点等" className="min-h-[100px]" data-testid="textarea-main-products" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productionCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>生产能力描述 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="请描述企业生产能力，包括年产量、生产设备、生产工艺等" className="min-h-[100px]" data-testid="textarea-production-capacity" />
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
                  <FormLabel>质量认证 <span className="text-red-500">*</span></FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {qualityCertificationOptions.map((cert) => (
                      <div key={cert} className="flex items-center space-x-2">
                        <Checkbox
                          id={cert}
                          checked={field.value?.includes(cert) || false}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, cert]);
                            } else {
                              field.onChange(currentValue.filter((item) => item !== cert));
                            }
                          }}
                          data-testid={`checkbox-${cert}`}
                        />
                        <label htmlFor={cert} className="text-sm font-medium leading-none">
                          {cert}
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

      case 6: // 跨境电商信息
        return (
          <div className="space-y-6">
            <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">跨境电商信息</h3>
              <p className="text-indigo-700 dark:text-indigo-300 text-sm">
                请提供跨境电商相关信息，包括经营模式、目标市场和预期贸易规模。
              </p>
            </div>

            <FormField
              control={form.control}
              name="ecommerceMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>跨境电商模式 <span className="text-red-500">*</span></FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {ecommerceModeOptions.map((mode) => (
                      <div key={mode} className="flex items-center space-x-2">
                        <Checkbox
                          id={mode}
                          checked={field.value?.includes(mode) || false}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, mode]);
                            } else {
                              field.onChange(currentValue.filter((item) => item !== mode));
                            }
                          }}
                          data-testid={`checkbox-${mode}`}
                        />
                        <label htmlFor={mode} className="text-sm font-medium leading-none">
                          {mode}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetCountries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目标销售国家/地区 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="请输入目标销售的国家或地区，如：美国、欧盟、东南亚等" className="min-h-[80px]" data-testid="textarea-target-countries" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="annualTradeVolume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>预计年贸易额 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="如：500万美元" data-testid="input-annual-trade-volume" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 7: // 上传备案材料
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">必需材料清单</h3>
              </div>
              <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                <li>• 营业执照副本复印件（加盖企业公章）</li>
                <li>• 对外贸易经营者备案登记表复印件</li>
                <li>• 法定代表人身份证复印件</li>
                <li>• 企业章程复印件</li>
                <li>• 银行开户许可证复印件</li>
                <li>• 质量认证证书复印件</li>
                <li>• 产品目录或说明书</li>
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
              experimentId="873e1fe1-0430-4f47-9db2-c4f00e2b048f"
            />

            {uploadedFiles.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">已上传文件：</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 8: // 确认提交
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
                        我确认以上填写的所有信息真实、准确、完整
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
                        我承诺对提供信息的真实性承担法律责任
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complianceCommitment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-compliance-commitment"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        我承诺严格遵守相关法律法规和海关监管要求
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-3">申请概要：</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">企业名称：</span>
                  <span className="font-medium">{form.getValues().companyName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">统一社会信用代码：</span>
                  <span className="font-medium">{form.getValues().unifiedCreditCode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">法定代表人：</span>
                  <span className="font-medium">{form.getValues().legalRepresentative}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">联系人：</span>
                  <span className="font-medium">{form.getValues().contactPerson}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">已上传文件：</span>
                  <span className="font-medium">{uploadedFiles.length} 个</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 9: // 提交成功
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">
                电商企业资质备案申请提交成功！
              </h3>
              <p className="text-lg text-muted-foreground">
                您的电商企业资质备案申请已成功提交
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">申请编号：EB-{Date.now()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>提交时间：{new Date().toLocaleString('zh-CN')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>预计审核时间：3-5个工作日</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-muted-foreground">
              <p>📧 我们将通过邮件和短信通知您审核结果</p>
              <p>📞 如有疑问，请拨打客服电话：400-123-4567</p>
            </div>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                正在返回任务中心...
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/50">
      {/* 进度条 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">电商企业资质备案</h1>
            <Badge variant="outline" className="text-sm">
              第 {currentStep} 步，共 {steps.length - 1} 步
            </Badge>
          </div>
          
          <Progress value={getStepProgress()} className="h-2" />
          
          <div className="flex justify-between mt-4">
            {steps.slice(0, -1).map((step) => (
              <div
                key={step.id}
                className={`flex-1 text-center ${
                  step.id === currentStep
                    ? "text-primary font-medium"
                    : step.id < currentStep
                    ? "text-green-600"
                    : "text-muted-foreground"
                }`}
              >
                <div className="font-medium">{step.title}</div>
                <div className="text-xs">{step.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="container mx-auto py-8 px-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {steps[currentStep - 1]?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {renderStepContent()}

                {/* 操作按钮 */}
                {currentStep < 9 && (
                  <div className="flex items-center justify-between pt-6 border-t">
                    <div>
                      {currentStep > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrevious}
                          data-testid="button-previous"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          上一步
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        data-testid="button-cancel"
                      >
                        取消
                      </Button>
                      
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={isSubmitting}
                        data-testid="button-next"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            提交中...
                          </>
                        ) : currentStep === 8 ? (
                          "提交申请"
                        ) : (
                          <>
                            下一步
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}