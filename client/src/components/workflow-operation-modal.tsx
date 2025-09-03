import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WorkflowOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowCode: string;
  workflowName: string;
  stepNumber: number;
  stepTitle: string;
  stepDescription: string;
  businessRole: string;
  inputFields: string[];
  onSubmit: (data: any) => void;
}

export function WorkflowOperationModal({
  isOpen,
  onClose,
  workflowCode,
  workflowName,
  stepNumber,
  stepTitle,
  stepDescription,
  businessRole,
  inputFields,
  onSubmit
}: WorkflowOperationModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const submitData = {
        ...formData,
        files: Object.fromEntries(
          Object.entries(files).filter(([_, file]) => file !== null)
        ),
        workflowCode,
        stepNumber,
        businessRole,
        timestamp: new Date().toISOString()
      };

      onSubmit(submitData);
      
      toast({
        title: "操作提交成功",
        description: `${stepTitle} 已完成，工作流将进入下一步骤`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "提交失败",
        description: "请检查网络连接或稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInputField = (field: string) => {
    switch (field) {
      case 'businessLicense':
      case 'taxCertificate':
      case 'organizationCode':
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field}>
              {field === 'businessLicense' ? '营业执照' :
               field === 'taxCertificate' ? '税务登记证' :
               field === 'organizationCode' ? '组织机构代码证' : field}
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                id={field}
                accept=".pdf,.jpg,.png,.jpeg"
                onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">支持 PDF、JPG、PNG 格式，最大 10MB</p>
            </div>
          </div>
        );

      case 'productCode':
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field}>商品编码</Label>
            <Select onValueChange={(value) => handleInputChange(field, value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择商品编码" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8471301000">8471301000 - 便携式数字计算机</SelectItem>
                <SelectItem value="8528721000">8528721000 - 液晶显示器</SelectItem>
                <SelectItem value="9013803000">9013803000 - 液晶显示面板</SelectItem>
                <SelectItem value="8517120000">8517120000 - 移动电话</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'quantity':
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field}>数量</Label>
            <Input
              id={field}
              type="number"
              placeholder="请输入商品数量"
              onChange={(e) => handleInputChange(field, parseInt(e.target.value))}
            />
          </div>
        );

      case 'value':
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field}>货值 (USD)</Label>
            <Input
              id={field}
              type="number"
              placeholder="请输入货物价值"
              onChange={(e) => handleInputChange(field, parseFloat(e.target.value))}
            />
          </div>
        );

      case 'destination':
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field}>目的地</Label>
            <Select onValueChange={(value) => handleInputChange(field, value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择目的地国家" />
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
        );

      default:
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field}>
              {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </Label>
            {field.includes('notes') || field.includes('description') || field.includes('reason') ? (
              <Textarea
                id={field}
                placeholder={`请输入${field}`}
                onChange={(e) => handleInputChange(field, e.target.value)}
              />
            ) : (
              <Input
                id={field}
                placeholder={`请输入${field}`}
                onChange={(e) => handleInputChange(field, e.target.value)}
              />
            )}
          </div>
        );
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'enterprise_operator': return '企业操作员';
      case 'customs_officer': return '海关审核员';
      case 'logistics_operator': return '物流操作员';
      case 'platform_specialist': return '平台专员';
      case 'service_specialist': return '服务专员';
      default: return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            {workflowName} - {stepTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 步骤信息 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">步骤 {stepNumber}</CardTitle>
                <Badge variant="default">
                  {getRoleDisplayName(businessRole)}
                </Badge>
              </div>
              <CardDescription>{stepDescription}</CardDescription>
            </CardHeader>
          </Card>

          {/* 操作表单 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                操作表单
              </CardTitle>
              <CardDescription>
                请根据业务流程要求填写以下信息并上传相关文件
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inputFields.map(field => renderInputField(field))}
            </CardContent>
          </Card>

          {/* 操作说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                操作说明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• 请确保所有必填字段都已正确填写</p>
                <p>• 上传的文件应清晰可读，格式正确</p>
                <p>• 提交后将自动进入下一个协作步骤</p>
                <p>• 如有疑问请联系相关业务人员</p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  完成操作
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}