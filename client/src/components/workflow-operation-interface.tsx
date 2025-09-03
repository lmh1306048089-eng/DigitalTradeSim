import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useForm } from 'react-hook-form';
import { Upload, FileText, CheckCircle, AlertCircle, Clock, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WorkflowOperationInterfaceProps {
  workflowCode: string;
  stepNumber: number;
  businessRoleCode: string;
  onComplete: (data: any) => void;
}

export default function WorkflowOperationInterface({ 
  workflowCode, 
  stepNumber, 
  businessRoleCode,
  onComplete 
}: WorkflowOperationInterfaceProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

  // 企业备案操作界面
  const renderPreparationInterface = () => {
    if (stepNumber === 1) {
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">企业备案申请表</h3>
            </div>
            <p className="text-blue-700 text-sm mb-4">
              请填写完整的企业信息，所有信息将用于海关备案审核
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName" className="text-sm font-medium">
                  企业名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="请输入企业全称"
                  {...register('companyName', { required: '企业名称不能为空' })}
                  data-testid="input-company-name"
                />
                {errors.companyName && (
                  <p className="text-red-500 text-xs mt-1">{errors.companyName.message as string}</p>
                )}
              </div>

              <div>
                <Label htmlFor="unifiedCreditCode" className="text-sm font-medium">
                  统一社会信用代码 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unifiedCreditCode"
                  placeholder="请输入18位统一社会信用代码"
                  maxLength={18}
                  {...register('unifiedCreditCode', { 
                    required: '统一社会信用代码不能为空',
                    pattern: {
                      value: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
                      message: '请输入正确的统一社会信用代码格式'
                    }
                  })}
                  data-testid="input-credit-code"
                />
                {errors.unifiedCreditCode && (
                  <p className="text-red-500 text-xs mt-1">{errors.unifiedCreditCode.message as string}</p>
                )}
              </div>

              <div>
                <Label htmlFor="registeredAddress" className="text-sm font-medium">
                  注册地址 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="registeredAddress"
                  placeholder="请输入企业注册地址"
                  {...register('registeredAddress', { required: '注册地址不能为空' })}
                  data-testid="textarea-address"
                />
              </div>

              <div>
                <Label htmlFor="businessScope" className="text-sm font-medium">
                  经营范围
                </Label>
                <Textarea
                  id="businessScope"
                  placeholder="请简要描述主要经营范围"
                  {...register('businessScope')}
                  data-testid="textarea-business-scope"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="legalPerson" className="text-sm font-medium">
                  法定代表人 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="legalPerson"
                  placeholder="请输入法定代表人姓名"
                  {...register('legalPerson', { required: '法定代表人不能为空' })}
                  data-testid="input-legal-person"
                />
              </div>

              <div>
                <Label htmlFor="contactPhone" className="text-sm font-medium">
                  联系电话 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactPhone"
                  placeholder="请输入联系电话"
                  {...register('contactPhone', { 
                    required: '联系电话不能为空',
                    pattern: {
                      value: /^1[3-9]\d{9}$/,
                      message: '请输入正确的手机号码'
                    }
                  })}
                  data-testid="input-phone"
                />
                {errors.contactPhone && (
                  <p className="text-red-500 text-xs mt-1">{errors.contactPhone.message as string}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  企业邮箱 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入企业邮箱"
                  {...register('email', { 
                    required: '企业邮箱不能为空',
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: '请输入正确的邮箱格式'
                    }
                  })}
                  data-testid="input-email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tradeType" className="text-sm font-medium">
                  贸易类型 <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(value) => setValue('tradeType', value)}>
                  <SelectTrigger data-testid="select-trade-type">
                    <SelectValue placeholder="请选择贸易类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">一般贸易</SelectItem>
                    <SelectItem value="processing">来料加工</SelectItem>
                    <SelectItem value="ecommerce">跨境电商</SelectItem>
                    <SelectItem value="express">快件进出口</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 文件上传区域 */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">上传企业资质文件</h4>
              <p className="text-sm text-gray-600 mb-4">
                请上传以下必需文件（支持PDF、JPG格式，单个文件不超过10MB）
              </p>
              
              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>营业执照副本（加盖公章）</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>进出口经营权备案证</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>组织机构代码证</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>税务登记证</span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  // 模拟文件上传
                  const files = ['营业执照.pdf', '进出口许可证.pdf', '组织机构代码证.pdf'];
                  setUploadedFiles(files);
                  toast({
                    title: "文件上传成功",
                    description: `已成功上传 ${files.length} 个文件`,
                  });
                }}
                data-testid="button-upload-files"
              >
                <Upload className="h-4 w-4 mr-2" />
                选择文件上传
              </Button>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                <h5 className="font-medium text-green-800 mb-2">已上传文件：</h5>
                <ul className="space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // 出口申报操作界面
  const renderDeclarationInterface = () => {
    if (stepNumber === 1) {
      return (
        <div className="space-y-6">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900">出口货物报关单</h3>
            </div>
            <p className="text-orange-700 text-sm">
              请准确填写货物信息，任何虚假申报都将承担法律责任
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="goodsName" className="text-sm font-medium">
                  货物名称（中文）<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="goodsName"
                  placeholder="请输入货物的中文名称"
                  {...register('goodsName', { required: '货物名称不能为空' })}
                  data-testid="input-goods-name"
                />
              </div>

              <div>
                <Label htmlFor="goodsNameEn" className="text-sm font-medium">
                  货物名称（英文）<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="goodsNameEn"
                  placeholder="Please enter goods name in English"
                  {...register('goodsNameEn', { required: '英文名称不能为空' })}
                  data-testid="input-goods-name-en"
                />
              </div>

              <div>
                <Label htmlFor="hsCode" className="text-sm font-medium">
                  HS编码 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hsCode"
                  placeholder="请输入10位HS商品编码"
                  maxLength={10}
                  {...register('hsCode', { 
                    required: 'HS编码不能为空',
                    pattern: {
                      value: /^\d{10}$/,
                      message: 'HS编码必须是10位数字'
                    }
                  })}
                  data-testid="input-hs-code"
                />
                {errors.hsCode && (
                  <p className="text-red-500 text-xs mt-1">{errors.hsCode.message as string}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    申报数量 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="数量"
                    {...register('quantity', { required: '数量不能为空', min: 1 })}
                    data-testid="input-quantity"
                  />
                </div>
                <div>
                  <Label htmlFor="unit" className="text-sm font-medium">
                    计量单位
                  </Label>
                  <Select onValueChange={(value) => setValue('unit', value)}>
                    <SelectTrigger data-testid="select-unit">
                      <SelectValue placeholder="单位" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">千克(kg)</SelectItem>
                      <SelectItem value="pcs">件(pcs)</SelectItem>
                      <SelectItem value="m">米(m)</SelectItem>
                      <SelectItem value="set">套(set)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="unitPrice" className="text-sm font-medium">
                  单价（美元）<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  placeholder="请输入单价"
                  {...register('unitPrice', { required: '单价不能为空', min: 0.01 })}
                  data-testid="input-unit-price"
                />
              </div>

              <div>
                <Label htmlFor="totalValue" className="text-sm font-medium">
                  总价值（美元）
                </Label>
                <Input
                  id="totalValue"
                  type="number"
                  step="0.01"
                  placeholder="自动计算或手动输入"
                  {...register('totalValue')}
                  data-testid="input-total-value"
                />
              </div>

              <div>
                <Label htmlFor="tradeMode" className="text-sm font-medium">
                  贸易方式 <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(value) => setValue('tradeMode', value)}>
                  <SelectTrigger data-testid="select-trade-mode">
                    <SelectValue placeholder="请选择贸易方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0110">一般贸易</SelectItem>
                    <SelectItem value="1210">保税仓库货物</SelectItem>
                    <SelectItem value="9610">跨境电商</SelectItem>
                    <SelectItem value="0300">来料加工</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="destination" className="text-sm font-medium">
                  目的地国家/地区 <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(value) => setValue('destination', value)}>
                  <SelectTrigger data-testid="select-destination">
                    <SelectValue placeholder="请选择目的地" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">美国</SelectItem>
                    <SelectItem value="UK">英国</SelectItem>
                    <SelectItem value="DE">德国</SelectItem>
                    <SelectItem value="JP">日本</SelectItem>
                    <SelectItem value="AU">澳大利亚</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    // 模拟提交延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 组合提交数据
    const submitData = {
      ...data,
      uploadedFiles,
      workflowCode,
      stepNumber,
      businessRoleCode,
      timestamp: new Date().toISOString()
    };

    onComplete(submitData);
    setIsSubmitting(false);
    
    toast({
      title: "提交成功",
      description: "您的申请已提交，等待下一角色处理",
    });
  };

  const getInterfaceTitle = () => {
    if (workflowCode === 'preparation' && stepNumber === 1) return '企业备案申请';
    if (workflowCode === 'declaration' && stepNumber === 1) return '出口货物申报';
    return `${workflowCode} - 步骤 ${stepNumber}`;
  };

  const getCurrentProgress = () => {
    if (workflowCode === 'preparation') return stepNumber * 25;
    if (workflowCode === 'declaration') return stepNumber * 20;
    return stepNumber * 16.67;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{getInterfaceTitle()}</CardTitle>
            <CardDescription className="mt-2">
              角色：<Badge variant="outline">{businessRoleCode}</Badge> | 
              步骤 {stepNumber} / 6
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-2">完成进度</div>
            <Progress value={getCurrentProgress()} className="w-32" />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 根据工作流程类型渲染不同的界面 */}
          {workflowCode === 'preparation' && renderPreparationInterface()}
          {workflowCode === 'declaration' && renderDeclarationInterface()}

          {/* 提交按钮 */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              <Clock className="h-4 w-4 inline mr-1" />
              提交后将转至下一处理环节
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              data-testid="button-submit-operation"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  提交申请
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}