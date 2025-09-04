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

// 表单验证模式
const customsFormSchema = z.object({
  // 企业基本信息
  companyName: z.string().min(2, "企业名称至少2个字符"),
  unifiedCreditCode: z.string().regex(/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, "请输入正确的统一社会信用代码"),
  registeredAddress: z.string().min(10, "注册地址信息不完整"),
  legalRepresentative: z.string().min(2, "法定代表人姓名至少2个字符"),
  businessLicense: z.string().min(15, "营业执照号码不能少于15位"),
  contactPerson: z.string().min(2, "联系人姓名至少2个字符"),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  contactEmail: z.string().email("请输入有效的邮箱地址"),
  
  // 经营范围
  businessScope: z.array(z.string()).min(1, "请至少选择一个经营范围"),
  importExportLicense: z.string().optional(),
  
  // 声明确认
  dataAccuracy: z.boolean().refine(val => val === true, "必须确认数据真实性"),
  legalResponsibility: z.boolean().refine(val => val === true, "必须承诺承担法律责任")
});

type CustomsFormData = z.infer<typeof customsFormSchema>;

interface CustomsQualificationFormProps {
  onComplete?: (data: CustomsFormData & { uploadedFiles: any[] }) => void;
  onCancel?: () => void;
}

export function CustomsQualificationForm({ onComplete, onCancel }: CustomsQualificationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CustomsFormData>({
    resolver: zodResolver(customsFormSchema),
    defaultValues: {
      companyName: "",
      unifiedCreditCode: "",
      registeredAddress: "",
      legalRepresentative: "",
      businessLicense: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      businessScope: [],
      importExportLicense: "",
      dataAccuracy: false,
      legalResponsibility: false
    }
  });

  const businessScopeOptions = [
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
    { id: 1, title: "企业基本信息", description: "填写企业注册信息" },
    { id: 2, title: "经营范围确认", description: "选择进出口经营范围" },
    { id: 3, title: "上传备案材料", description: "提交相关证明文件" },
    { id: 4, title: "确认提交", description: "核对信息并提交审核" }
  ];

  const getStepProgress = () => ((currentStep - 1) / (steps.length - 1)) * 100;

  const validateCurrentStep = async () => {
    const stepFields: Record<number, (keyof CustomsFormData)[]> = {
      1: ["companyName", "unifiedCreditCode", "registeredAddress", "legalRepresentative", "businessLicense"],
      2: ["contactPerson", "contactPhone", "contactEmail", "businessScope"],
      3: [], // 文件上传验证
      4: ["dataAccuracy", "legalResponsibility"]
    };

    const fieldsToValidate = stepFields[currentStep];
    if (fieldsToValidate.length > 0) {
      const result = await form.trigger(fieldsToValidate);
      return result;
    }

    if (currentStep === 3) {
      if (uploadedFiles.length === 0) {
        toast({
          title: "请上传备案材料",
          description: "报关单位备案信息表是必需的",
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
    toast({
      title: "文件上传成功",
      description: `${file.name} 已成功上传`
    });
  };

  const onSubmit = async (data: CustomsFormData) => {
    setIsSubmitting(true);
    try {
      // 模拟提交到海关系统
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "备案申请提交成功",
        description: "您的海关企业资质备案申请已提交，请等待审核结果"
      });

      onComplete?.({ ...data, uploadedFiles });
    } catch (error) {
      toast({
        title: "提交失败",
        description: "请检查网络连接后重试",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
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

            <FormField
              control={form.control}
              name="importExportLicense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>进出口许可证号（如有）</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      placeholder="请输入进出口许可证号" 
                      data-testid="input-import-export-license" 
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
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">必需材料清单</h3>
              </div>
              <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                <li>• 报关单位备案信息表（加盖企业公章）</li>
                <li>• 营业执照副本复印件</li>
                <li>• 法定代表人身份证复印件</li>
                <li>• 企业章程复印件（如适用）</li>
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
              experimentId="customs-qualification"
            />

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">已上传文件：</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <Badge variant="secondary">已上传</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
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
                <p>统一社会信用代码：{form.getValues("unifiedCreditCode") || "未填写"}</p>
                <p>联系人：{form.getValues("contactPerson") || "未填写"}</p>
                <p>已上传文件：{uploadedFiles.length} 个</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="customs-qualification-form">
      {/* 进度指示器 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">海关企业资质备案</h2>
          <Badge variant="outline">
            第 {currentStep} 步，共 {steps.length} 步
          </Badge>
        </div>

        <Progress value={getStepProgress()} className="mb-4" />

        <div className="flex justify-between text-sm">
          {steps.map((step) => (
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

      {/* 表单内容 */}
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
                  
                  {currentStep < steps.length ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      data-testid="button-next"
                    >
                      下一步
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      data-testid="button-submit"
                    >
                      {isSubmitting ? "提交中..." : "提交备案申请"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}