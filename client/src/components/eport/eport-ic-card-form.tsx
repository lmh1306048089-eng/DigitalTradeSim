import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SimpleFileUpload } from "@/components/eport/simple-file-upload";
import { AlertCircle, CheckCircle, FileText, Upload, Building, User, Shield, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  // 企业入网申请信息
  companyName: z.string().min(1, "企业名称是必填项"),
  unifiedSocialCreditCode: z.string().min(18, "统一社会信用代码必须是18位"),
  legalRepresentative: z.string().min(1, "法定代表人姓名是必填项"),
  businessAddress: z.string().min(1, "企业注册地址是必填项"),
  contactPerson: z.string().min(1, "联系人姓名是必填项"),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号码"),
  contactEmail: z.string().email("请输入有效的邮箱地址"),
  
  // 企业经营信息
  businessScope: z.string().min(1, "经营范围是必填项"),
  registeredCapital: z.string().min(1, "注册资本是必填项"),
  establishmentDate: z.string().min(1, "成立日期是必填项"),
  
  // 申请类型
  applicationCategory: z.string().min(1, "请选择申请类别"),
  icCardType: z.string().min(1, "请选择IC卡类型"),
  
  // 操作员信息
  operatorName: z.string().min(1, "操作员姓名是必填项"),
  operatorIdCard: z.string().regex(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, "请输入有效的身份证号码"),
  operatorPosition: z.string().min(1, "操作员职务是必填项"),
  
  // 确认声明
  declaration: z.boolean().refine(val => val === true, "必须确认提交申请"),
});

type FormData = z.infer<typeof formSchema>;

interface EportIcCardFormProps {
  onComplete: (data?: any) => void;
  onCancel: () => void;
}

export function EportIcCardForm({ onComplete, onCancel }: EportIcCardFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      unifiedSocialCreditCode: "",
      legalRepresentative: "",
      businessAddress: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      businessScope: "",
      registeredCapital: "",
      establishmentDate: "",
      applicationCategory: "",
      icCardType: "",
      operatorName: "",
      operatorIdCard: "",
      operatorPosition: "",
      declaration: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // 添加表单数据
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      
      // 添加文件
      Object.entries(uploadedFiles).forEach(([fileType, files]) => {
        files.forEach((file, index) => {
          formData.append(`${fileType}_${index}`, file);
        });
      });
      
      return fetch("/api/experiments/eport-ic-card/submit", {
        method: "POST",
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "申请提交成功！",
        description: "您的电子口岸IC卡申请已成功提交，请等待审核结果。",
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      onComplete(data);
    },
    onError: (error: any) => {
      toast({
        title: "提交失败",
        description: error.message || "请检查网络连接后重试",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    // 检查必需文件是否已上传
    const requiredFiles = [
      "businessLicense",
      "operatorIdCard", 
      "customsDeclarationCert",
      "foreignTradeRegistration",
      "customsBackupReceipt"
    ];
    
    const missingFiles = requiredFiles.filter(fileType => !uploadedFiles[fileType]?.length);
    
    if (missingFiles.length > 0) {
      toast({
        title: "请上传必要文件",
        description: "请确保所有必需的证明文件都已上传完成",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate(data);
  };

  const handleFileUpload = (fileType: string, files: File[]) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: files
    }));
  };

  const getStepIcon = (step: number) => {
    if (step < currentStep) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (step === currentStep) return <div className="h-5 w-5 rounded-full bg-blue-600" />;
    return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  };

  const steps = [
    { number: 1, title: "企业基本信息", icon: <Building className="h-5 w-5" /> },
    { number: 2, title: "经营资质信息", icon: <Shield className="h-5 w-5" /> },
    { number: 3, title: "操作员信息", icon: <User className="h-5 w-5" /> },
    { number: 4, title: "文件上传", icon: <Upload className="h-5 w-5" /> },
    { number: 5, title: "确认提交", icon: <Receipt className="h-5 w-5" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100">
          电子口岸IC卡申请
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          请按照步骤完成中国电子口岸数据中心平台IC卡入网申请
        </p>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 
              ${step.number === currentStep ? 'bg-blue-600 border-blue-600 text-white' : 
                step.number < currentStep ? 'bg-green-600 border-green-600 text-white' : 
                'bg-gray-100 border-gray-300 text-gray-400'}`}>
              {step.number < currentStep ? <CheckCircle className="h-6 w-6" /> : step.icon}
            </div>
            <div className="mt-2 text-center">
              <div className={`text-sm font-medium 
                ${step.number <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
                第{step.number}步
              </div>
              <div className={`text-xs 
                ${step.number <= currentStep ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`hidden md:block absolute mt-6 h-0.5 w-24 transform translate-x-12 
                ${step.number < currentStep ? 'bg-green-600' : 'bg-gray-300'}`} 
                style={{ left: `${((index + 1) * 100) / steps.length}%` }} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* 第1步：企业基本信息 */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                企业基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">企业名称 *</Label>
                  <Input
                    id="companyName"
                    placeholder="请输入企业全称"
                    {...form.register("companyName")}
                    className="w-full"
                    data-testid="input-company-name"
                  />
                  {form.formState.errors.companyName && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.companyName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unifiedSocialCreditCode">统一社会信用代码 *</Label>
                  <Input
                    id="unifiedSocialCreditCode"
                    placeholder="请输入18位统一社会信用代码"
                    {...form.register("unifiedSocialCreditCode")}
                    maxLength={18}
                    data-testid="input-credit-code"
                  />
                  {form.formState.errors.unifiedSocialCreditCode && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.unifiedSocialCreditCode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legalRepresentative">法定代表人 *</Label>
                  <Input
                    id="legalRepresentative"
                    placeholder="请输入法定代表人姓名"
                    {...form.register("legalRepresentative")}
                    data-testid="input-legal-representative"
                  />
                  {form.formState.errors.legalRepresentative && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.legalRepresentative.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="establishmentDate">企业成立日期 *</Label>
                  <Input
                    id="establishmentDate"
                    type="date"
                    {...form.register("establishmentDate")}
                    data-testid="input-establishment-date"
                  />
                  {form.formState.errors.establishmentDate && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.establishmentDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress">企业注册地址 *</Label>
                <Textarea
                  id="businessAddress"
                  placeholder="请输入企业注册地址"
                  {...form.register("businessAddress")}
                  rows={3}
                  data-testid="textarea-business-address"
                />
                {form.formState.errors.businessAddress && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.businessAddress.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">联系人 *</Label>
                  <Input
                    id="contactPerson"
                    placeholder="请输入联系人姓名"
                    {...form.register("contactPerson")}
                    data-testid="input-contact-person"
                  />
                  {form.formState.errors.contactPerson && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.contactPerson.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">联系电话 *</Label>
                  <Input
                    id="contactPhone"
                    placeholder="请输入手机号码"
                    {...form.register("contactPhone")}
                    data-testid="input-contact-phone"
                  />
                  {form.formState.errors.contactPhone && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.contactPhone.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">联系邮箱 *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="请输入邮箱地址"
                  {...form.register("contactEmail")}
                  data-testid="input-contact-email"
                />
                {form.formState.errors.contactEmail && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.contactEmail.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 第2步：经营资质信息 */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                经营资质信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessScope">经营范围 *</Label>
                <Textarea
                  id="businessScope"
                  placeholder="请输入企业经营范围"
                  {...form.register("businessScope")}
                  rows={4}
                  data-testid="textarea-business-scope"
                />
                {form.formState.errors.businessScope && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.businessScope.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="registeredCapital">注册资本 *</Label>
                  <Input
                    id="registeredCapital"
                    placeholder="请输入注册资本（万元）"
                    {...form.register("registeredCapital")}
                    data-testid="input-registered-capital"
                  />
                  {form.formState.errors.registeredCapital && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.registeredCapital.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicationCategory">申请类别 *</Label>
                  <Select onValueChange={(value) => form.setValue("applicationCategory", value)}>
                    <SelectTrigger data-testid="select-application-category">
                      <SelectValue placeholder="请选择申请类别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="import_export">进出口企业</SelectItem>
                      <SelectItem value="processing_trade">加工贸易企业</SelectItem>
                      <SelectItem value="bonded_logistics">保税物流企业</SelectItem>
                      <SelectItem value="cross_border_ecommerce">跨境电子商务企业</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.applicationCategory && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.applicationCategory.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icCardType">IC卡类型 *</Label>
                <Select onValueChange={(value) => form.setValue("icCardType", value)}>
                  <SelectTrigger data-testid="select-ic-card-type">
                    <SelectValue placeholder="请选择IC卡类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator_card">操作员卡</SelectItem>
                    <SelectItem value="enterprise_card">企业法人卡</SelectItem>
                    <SelectItem value="declaration_card">申报员卡</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.icCardType && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.icCardType.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 第3步：操作员信息 */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                操作员信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="operatorName">操作员姓名 *</Label>
                  <Input
                    id="operatorName"
                    placeholder="请输入操作员姓名"
                    {...form.register("operatorName")}
                    data-testid="input-operator-name"
                  />
                  {form.formState.errors.operatorName && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.operatorName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operatorPosition">操作员职务 *</Label>
                  <Input
                    id="operatorPosition"
                    placeholder="请输入职务"
                    {...form.register("operatorPosition")}
                    data-testid="input-operator-position"
                  />
                  {form.formState.errors.operatorPosition && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.operatorPosition.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operatorIdCard">操作员身份证号 *</Label>
                <Input
                  id="operatorIdCard"
                  placeholder="请输入18位身份证号码"
                  {...form.register("operatorIdCard")}
                  maxLength={18}
                  data-testid="input-operator-id-card"
                />
                {form.formState.errors.operatorIdCard && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.operatorIdCard.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 第4步：文件上传 */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-orange-600" />
                证明文件上传
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <SimpleFileUpload
                  label="营业执照 *"
                  description="请上传企业营业执照电子版（支持PDF、JPG、PNG格式）"
                  onFilesChange={(files) => handleFileUpload("businessLicense", files)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxFiles={1}
                  data-testid="upload-business-license"
                />

                <SimpleFileUpload
                  label="操作员身份证 *"
                  description="请上传操作员身份证正反面（支持JPG、PNG格式）"
                  onFilesChange={(files) => handleFileUpload("operatorIdCard", files)}
                  accept=".jpg,.jpeg,.png"
                  maxFiles={2}
                  data-testid="upload-operator-id-card"
                />

                <SimpleFileUpload
                  label="报关人员备案证明 *"
                  description="请上传海关签发的《报关人员备案证明》"
                  onFilesChange={(files) => handleFileUpload("customsDeclarationCert", files)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxFiles={1}
                  data-testid="upload-customs-declaration-cert"
                />

                <SimpleFileUpload
                  label="对外贸易经营者备案登记表 *"
                  description="请上传《对外贸易经营者备案登记表》原件"
                  onFilesChange={(files) => handleFileUpload("foreignTradeRegistration", files)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxFiles={1}
                  data-testid="upload-foreign-trade-registration"
                />

                <SimpleFileUpload
                  label="海关备案回执 *"
                  description="请上传海关进出口货物收发人备案回执"
                  onFilesChange={(files) => handleFileUpload("customsBackupReceipt", files)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxFiles={1}
                  data-testid="upload-customs-backup-receipt"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 第5步：确认提交 */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                确认提交申请
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">申请信息确认</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">企业名称：</span>{form.watch("companyName")}</p>
                  <p><span className="font-medium">统一社会信用代码：</span>{form.watch("unifiedSocialCreditCode")}</p>
                  <p><span className="font-medium">申请类别：</span>{form.watch("applicationCategory")}</p>
                  <p><span className="font-medium">IC卡类型：</span>{form.watch("icCardType")}</p>
                  <p><span className="font-medium">操作员：</span>{form.watch("operatorName")}</p>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-800 dark:text-orange-200">
                    <p className="font-medium mb-2">重要提醒：</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>请确保所有信息填写准确无误</li>
                      <li>所有上传的文件必须清晰可读</li>
                      <li>提交后无法修改，请仔细核对</li>
                      <li>申请结果将通过短信和邮件通知</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="declaration"
                  checked={form.watch("declaration")}
                  onChange={(e) => form.setValue("declaration", e.target.checked)}
                  className="rounded border-gray-300"
                  data-testid="checkbox-declaration"
                />
                <Label htmlFor="declaration" className="text-sm">
                  我确认以上信息真实有效，并承担相应法律责任 *
                </Label>
              </div>
              {form.formState.errors.declaration && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {form.formState.errors.declaration.message}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 按钮区域 */}
        <div className="flex justify-between pt-6">
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              data-testid="button-cancel"
            >
              取消申请
            </Button>
            {currentStep > 1 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCurrentStep(currentStep - 1)}
                data-testid="button-previous"
              >
                上一步
              </Button>
            )}
          </div>
          <div>
            {currentStep < 5 ? (
              <Button 
                type="button" 
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-next"
              >
                下一步
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={submitMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-submit"
              >
                {submitMutation.isPending ? "提交中..." : "提交申请"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}