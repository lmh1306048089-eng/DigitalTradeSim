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

// 电商企业资质备案表单验证模式
const ecommerceFormSchema = z.object({
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
  
  // 电商平台信息
  platformName: z.string().min(1, "电商平台名称不能为空"),
  platformUrl: z.string().url("请输入有效的网站地址"),
  platformType: z.string().min(1, "请选择平台类型"),
  operatingMode: z.array(z.string()).min(1, "请至少选择一个运营模式"),
  
  // 跨境电商特定信息
  ecommerceMode: z.array(z.string()).min(1, "请至少选择一个跨境电商模式"),
  targetCountries: z.string().min(5, "目标销售国家/地区至少5个字符"),
  annualTradeVolume: z.string().min(1, "预计年贸易额不能为空"),
  
  // 产品信息
  mainProducts: z.string().min(10, "主要产品描述至少10个字符"),
  productCategories: z.array(z.string()).min(1, "请至少选择一个产品类别"),
  qualityCertification: z.array(z.string()).min(1, "请至少选择一个质量认证"),
  
  // 声明确认
  dataAccuracy: z.boolean().refine(val => val === true, "必须确认数据真实性"),
  legalResponsibility: z.boolean().refine(val => val === true, "必须承诺承担法律责任"),
  complianceCommitment: z.boolean().refine(val => val === true, "必须承诺遵守相关法律法规")
});

type EcommerceFormData = z.infer<typeof ecommerceFormSchema>;

interface EcommerceQualificationFormProps {
  onComplete?: (data: EcommerceFormData & { uploadedFiles: any[] }) => void;
  onCancel?: () => void;
}

export function EcommerceQualificationForm({ onComplete, onCancel }: EcommerceQualificationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<EcommerceFormData>({
    resolver: zodResolver(ecommerceFormSchema),
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
      platformName: "",
      platformUrl: "",
      platformType: "",
      operatingMode: [],
      ecommerceMode: [],
      targetCountries: "",
      annualTradeVolume: "",
      mainProducts: "",
      productCategories: [],
      qualityCertification: [],
      dataAccuracy: false,
      legalResponsibility: false,
      complianceCommitment: false
    },
  });

  const steps = [
    { id: 1, title: "企业基本信息", icon: Building2 },
    { id: 2, title: "法定代表人信息", icon: FileText },
    { id: 3, title: "联系信息", icon: FileText },
    { id: 4, title: "经营资质", icon: FileText },
    { id: 5, title: "财务税务", icon: FileText },
    { id: 6, title: "电商平台信息", icon: FileText },
    { id: 7, title: "跨境电商信息", icon: FileText },
    { id: 8, title: "产品信息", icon: FileText },
    { id: 9, title: "文件上传", icon: Upload },
    { id: 10, title: "确认提交", icon: CheckCircle }
  ];

  const onSubmit = async (data: EcommerceFormData) => {
    if (currentStep < 10) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      // 模拟提交延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onComplete?.({
        ...data,
        uploadedFiles
      });
      
      toast({
        title: "备案申请提交成功",
        description: "您的电商企业资质备案申请已成功提交，请等待审核。",
      });
    } catch (error) {
      toast({
        title: "提交失败",
        description: "网络错误，请稍后重试。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">企业名称 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入企业全称" data-testid="input-company-name" {...field} />
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
                  <FormLabel className="text-blue-700">统一社会信用代码 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入18位统一社会信用代码" data-testid="input-credit-code" {...field} />
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
                  <FormLabel className="text-blue-700">营业执照注册号 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入营业执照注册号" data-testid="input-business-license" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registeredCapital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700">注册资本 *</FormLabel>
                    <FormControl>
                      <Input placeholder="万元" data-testid="input-registered-capital" {...field} />
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
                    <FormLabel className="text-blue-700">成立日期 *</FormLabel>
                    <FormControl>
                      <Input type="date" data-testid="input-establishment-date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="businessTerm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">经营期限 *</FormLabel>
                  <FormControl>
                    <Input placeholder="如：2020-01-01至2030-01-01" data-testid="input-business-term" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registeredAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">注册地址 *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="请输入详细的企业注册地址" data-testid="textarea-registered-address" {...field} />
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
                  <FormLabel className="text-blue-700">经营地址 *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="请输入详细的企业经营地址" data-testid="textarea-business-address" {...field} />
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
              name="legalRepresentative"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">法定代表人姓名 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入法定代表人姓名" data-testid="input-legal-rep" {...field} />
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
                  <FormLabel className="text-blue-700">法定代表人身份证号 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入18位身份证号码" data-testid="input-legal-rep-id" {...field} />
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
                  <FormLabel className="text-blue-700">法定代表人手机号 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入11位手机号码" data-testid="input-legal-rep-phone" {...field} />
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
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">联系人姓名 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入联系人姓名" data-testid="input-contact-person" {...field} />
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
                  <FormLabel className="text-blue-700">联系人手机号 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入11位手机号码" data-testid="input-contact-phone" {...field} />
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
                  <FormLabel className="text-blue-700">联系邮箱 *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="请输入有效的邮箱地址" data-testid="input-contact-email" {...field} />
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
            <FormField
              control={form.control}
              name="businessScope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">经营范围 *</FormLabel>
                  <div className="space-y-2">
                    {[
                      "货物进出口",
                      "技术进出口",
                      "代理进出口",
                      "电子商务",
                      "互联网销售",
                      "跨境电商"
                    ].map((scope) => (
                      <div key={scope} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value?.includes(scope)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, scope]);
                            } else {
                              field.onChange(currentValue.filter((item) => item !== scope));
                            }
                          }}
                          data-testid={`checkbox-business-scope-${scope}`}
                        />
                        <label className="text-sm">{scope}</label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="importExportLicense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">进出口许可证号</FormLabel>
                  <FormControl>
                    <Input placeholder="如有请填写" data-testid="input-import-export-license" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="foreignTradeRecordNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">对外贸易经营者备案登记表编号 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入备案登记表编号" data-testid="input-foreign-trade-record" {...field} />
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
                  <FormLabel className="text-blue-700">海关注册编码 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入海关注册编码" data-testid="input-customs-register-code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="taxRegistrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">税务登记号 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入税务登记号" data-testid="input-tax-registration" {...field} />
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
                  <FormLabel className="text-blue-700">组织机构代码 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入组织机构代码" data-testid="input-organization-code" {...field} />
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
                  <FormLabel className="text-blue-700">银行基本账户信息 *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="开户银行、账号等信息" data-testid="textarea-bank-account" {...field} />
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
                  <FormLabel className="text-blue-700">外汇结算账户信息 *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="外汇结算银行、账号等信息" data-testid="textarea-foreign-exchange-account" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="platformName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">电商平台名称 *</FormLabel>
                  <FormControl>
                    <Input placeholder="如：天猫国际、京东全球购等" data-testid="input-platform-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="platformUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">平台网址 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入平台完整网址" data-testid="input-platform-url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="platformType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">平台类型 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-platform-type">
                        <SelectValue placeholder="请选择平台类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="B2C">B2C（企业对消费者）</SelectItem>
                      <SelectItem value="B2B">B2B（企业对企业）</SelectItem>
                      <SelectItem value="C2C">C2C（消费者对消费者）</SelectItem>
                      <SelectItem value="O2O">O2O（线上到线下）</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operatingMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">运营模式 *</FormLabel>
                  <div className="space-y-2">
                    {[
                      "自营",
                      "第三方销售",
                      "代销",
                      "分销",
                      "直邮",
                      "保税仓发货"
                    ].map((mode) => (
                      <div key={mode} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value?.includes(mode)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, mode]);
                            } else {
                              field.onChange(currentValue.filter((item) => item !== mode));
                            }
                          }}
                          data-testid={`checkbox-operating-mode-${mode}`}
                        />
                        <label className="text-sm">{mode}</label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="ecommerceMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">跨境电商模式 *</FormLabel>
                  <div className="space-y-2">
                    {[
                      "9610（直购进口）",
                      "1210（保税跨境贸易）",
                      "9710（跨境电商B2B直接出口）",
                      "9810（跨境电商出口海外仓）"
                    ].map((mode) => (
                      <div key={mode} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value?.includes(mode)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, mode]);
                            } else {
                              field.onChange(currentValue.filter((item) => item !== mode));
                            }
                          }}
                          data-testid={`checkbox-ecommerce-mode-${mode}`}
                        />
                        <label className="text-sm">{mode}</label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetCountries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">目标销售国家/地区 *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="请列出主要的目标销售国家或地区" data-testid="textarea-target-countries" {...field} />
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
                  <FormLabel className="text-blue-700">预计年贸易额 *</FormLabel>
                  <FormControl>
                    <Input placeholder="万美元" data-testid="input-annual-trade-volume" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="mainProducts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">主要产品描述 *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="详细描述企业主要产品的类型、特点、用途等" data-testid="textarea-main-products" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productCategories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">产品类别 *</FormLabel>
                  <div className="space-y-2">
                    {[
                      "电子产品",
                      "服装鞋帽",
                      "家居用品",
                      "美容护肤",
                      "食品饮料",
                      "母婴用品",
                      "运动户外",
                      "汽车用品"
                    ].map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value?.includes(category)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, category]);
                            } else {
                              field.onChange(currentValue.filter((item) => item !== category));
                            }
                          }}
                          data-testid={`checkbox-product-category-${category}`}
                        />
                        <label className="text-sm">{category}</label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qualityCertification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">质量认证 *</FormLabel>
                  <div className="space-y-2">
                    {[
                      "ISO9001质量管理体系",
                      "ISO14001环境管理体系",
                      "CE认证",
                      "FCC认证",
                      "3C认证",
                      "FDA认证"
                    ].map((cert) => (
                      <div key={cert} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value?.includes(cert)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, cert]);
                            } else {
                              field.onChange(currentValue.filter((item) => item !== cert));
                            }
                          }}
                          data-testid={`checkbox-quality-cert-${cert}`}
                        />
                        <label className="text-sm">{cert}</label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <Upload className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">上传相关证明文件</h3>
              <p className="text-blue-700 dark:text-blue-300 mb-6">
                请上传电商企业资质备案所需的各类证明文件和资料
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700">基础证件</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUpload
                    experimentId="ecommerce-qualification"
                    onUploadComplete={(file) => {
                      setUploadedFiles(prev => [...prev, { ...file, type: "营业执照副本" }]);
                    }}
                  />
                  <FileUpload
                    experimentId="ecommerce-qualification"
                    onUploadComplete={(file) => {
                      setUploadedFiles(prev => [...prev, { ...file, type: "统一社会信用代码证" }]);
                    }}
                  />
                  <FileUpload
                    experimentId="ecommerce-qualification"
                    onUploadComplete={(file) => {
                      setUploadedFiles(prev => [...prev, { ...file, type: "法定代表人身份证" }]);
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700">经营资质</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUpload
                    experimentId="ecommerce-qualification"
                    onUploadComplete={(file) => {
                      setUploadedFiles(prev => [...prev, { ...file, type: "对外贸易经营者备案登记表" }]);
                    }}
                  />
                  <FileUpload
                    experimentId="ecommerce-qualification"
                    onUploadComplete={(file) => {
                      setUploadedFiles(prev => [...prev, { ...file, type: "海关注册登记证书" }]);
                    }}
                  />
                  <FileUpload
                    experimentId="ecommerce-qualification"
                    onUploadComplete={(file) => {
                      setUploadedFiles(prev => [...prev, { ...file, type: "质量认证证书" }]);
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {uploadedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">已上传文件</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 dark:text-green-300">{file.type}</span>
                        <Badge variant="secondary">{file.name}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <CheckCircle className="mx-auto h-16 w-16 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-3">
                确认提交电商企业资质备案申请
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mb-6">
                请仔细核对以上填写的信息，确认无误后提交申请
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">申请信息摘要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">企业名称：</span>
                    <span className="font-medium">{form.getValues().companyName || "未填写"}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">统一社会信用代码：</span>
                    <span className="font-medium">{form.getValues().unifiedCreditCode || "未填写"}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">法定代表人：</span>
                    <span className="font-medium">{form.getValues().legalRepresentative || "未填写"}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">联系人：</span>
                    <span className="font-medium">{form.getValues().contactPerson || "未填写"}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">电商平台：</span>
                    <span className="font-medium">{form.getValues().platformName || "未填写"}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">已上传文件：</span>
                    <span className="font-medium">{uploadedFiles.length} 个</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">法律声明与承诺</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        <FormLabel className="text-blue-700">
                          数据真实性确认
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          我确认以上所填写的信息真实、准确、完整，无虚假内容。
                        </p>
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
                        <FormLabel className="text-blue-700">
                          法律责任承诺
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          我愿意承担因提供虚假信息而产生的一切法律责任。
                        </p>
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
                        <FormLabel className="text-blue-700">
                          合规经营承诺
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          我承诺严格遵守国家相关法律法规，合规经营跨境电商业务。
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
              电商企业资质备案申请
            </h1>
            <p className="text-blue-700 dark:text-blue-300">
              跨境电商企业资质备案申请表单 - 前期准备阶段
            </p>
          </div>

          {/* 步骤指示器 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive 
                        ? "bg-blue-600 border-blue-600 text-white" 
                        : isCompleted 
                        ? "bg-green-600 border-green-600 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-0.5 ${
                        isCompleted ? "bg-green-600" : "bg-gray-300"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step) => (
                <div key={step.id} className="text-xs text-center w-10">
                  <span className={`${
                    currentStep === step.id 
                      ? "text-blue-600 font-semibold" 
                      : currentStep > step.id
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 进度条 */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-blue-600 mb-2">
              <span>步骤 {currentStep} / {steps.length}</span>
              <span>{Math.round((currentStep / steps.length) * 100)}% 完成</span>
            </div>
            <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          </div>

          {/* 表单内容 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-200">
                步骤 {currentStep}: {steps[currentStep - 1]?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  {getStepContent()}
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* 导航按钮 */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep(currentStep - 1);
                } else {
                  onCancel?.();
                }
              }}
              data-testid="button-previous"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentStep > 1 ? "上一步" : "取消"}
            </Button>

            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-next"
            >
              {isSubmitting ? (
                "提交中..."
              ) : currentStep === 10 ? (
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
      </div>
    </div>
  );
}