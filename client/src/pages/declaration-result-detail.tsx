import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocation, useRoute } from "wouter";
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  User,
  Calendar,
  FileCheck,
  Shield,
  Target,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ExportDeclaration } from "@shared/schema";

interface DeclarationResultDetailProps {
  onBack?: () => void;
}

interface SubmissionHistoryRecord {
  id: string;
  declarationId: string;
  submissionType: string;
  platform: string;
  status: string;
  requestData: any;
  responseData: any;
  errorMessage?: string;
  submittedAt: string;
  processedAt?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-800", icon: FileText },
  booking_pushed: { label: "舱位已推送", color: "bg-blue-100 text-blue-800", icon: Clock },
  declaration_pushed: { label: "申报已推送", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  under_review: { label: "海关审核中", color: "bg-orange-100 text-orange-800", icon: Clock },
  approved: { label: "审核通过", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "审核不通过", color: "bg-red-100 text-red-800", icon: XCircle }
};

export default function DeclarationResultDetail({ onBack }: DeclarationResultDetailProps) {
  const [location, navigate] = useLocation();
  const [match, params] = useRoute('/declaration-result/:id');
  const { toast } = useToast();
  
  // 从路由参数中获取申报ID
  const declarationId = params?.id;
  
  // 如果没有匹配到路由或ID不存在，重定向
  if (!match || !declarationId) {
    setTimeout(() => navigate('/customs-declaration-query'), 0);
    return null;
  }

  // 获取申报基本信息
  const { data: declaration, isLoading: declarationLoading } = useQuery<ExportDeclaration>({
    queryKey: ['/api/export-declarations', declarationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/export-declarations/${declarationId}`);
      if (!response.ok) {
        throw new Error('获取申报记录失败');
      }
      return response.json();
    },
    retry: 3,
  });

  // 获取审核历史记录
  const { data: auditHistory, isLoading: historyLoading } = useQuery<SubmissionHistoryRecord[]>({
    queryKey: ['/api/export-declarations', declarationId, 'submission-history'],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/export-declarations/${declarationId}/submission-history`);
      if (!response.ok) {
        throw new Error('获取审核历史失败');
      }
      return response.json();
    },
    retry: 3,
  });

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/customs-declaration-query');
    }
  };

  const formatDateTime = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return "-";
    
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(date.getTime())) return "-";
      
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.warn('Failed to format date:', dateValue, error);
      return "-";
    }
  };

  const getCustomsNumber = (declaration: ExportDeclaration) => {
    return declaration.generatedData?.customsNumber || "待生成";
  };

  const getSubmittedTime = (declaration: ExportDeclaration) => {
    const submittedAt = declaration.generatedData?.submittedAt;
    const readyAt = declaration.readyAt;
    
    if (submittedAt) return submittedAt;
    if (readyAt) return readyAt;
    return undefined;
  };

  if (declarationLoading || historyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">加载申报详情...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!declaration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">申报记录不存在</h3>
            <p className="text-gray-500 mb-4">无法找到指定的申报记录，请检查链接是否正确。</p>
            <Button onClick={handleBack}>返回查询页面</Button>
          </div>
        </div>
      </div>
    );
  }

  const status = statusConfig[declaration.status] || {
    label: declaration.status,
    color: "bg-gray-100 text-gray-800",
    icon: AlertCircle
  };
  const StatusIcon = status.icon;

  // 查找审核记录
  const auditRecord = auditHistory?.find(h => h.submissionType === 'customs_audit') || null;
  const auditResult = auditRecord?.responseData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mr-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回查询
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-blue-900">中国国际单一窗口</h1>
            <p className="text-blue-600">申报结果详情</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：申报基本信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 申报概览 */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-900">
                  <FileText className="h-5 w-5 mr-2" />
                  申报概览
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900" data-testid="text-declaration-title">
                    {declaration.title}
                  </h2>
                  <Badge className={status.color} data-testid="badge-status">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">海关单号：</span>
                    <div className="font-medium" data-testid="text-customs-number">
                      {getCustomsNumber(declaration)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">申报模式：</span>
                    <div className="font-medium" data-testid="text-declaration-mode">
                      {declaration.declarationMode === "declaration" ? "报关单模式" : "清单模式"}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">提交时间：</span>
                    <div className="font-medium" data-testid="text-submitted-time">
                      {formatDateTime(getSubmittedTime(declaration))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">创建时间：</span>
                    <div className="font-medium">
                      {formatDateTime(declaration.createdAt)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 海关审核结果 */}
            {declaration.status !== 'draft' && declaration.status !== 'under_review' && (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-900">
                    <Shield className="h-5 w-5 mr-2" />
                    海关审核结果
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {auditResult ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">审核员：</span>
                            <span className="text-sm font-medium" data-testid="text-auditor">
                              {auditResult[4] || "系统审核"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">审核时间：</span>
                            <span className="text-sm font-medium" data-testid="text-audit-time">
                              {formatDateTime(auditResult[1])}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">审核评分：</span>
                            <span className="text-sm font-medium" data-testid="text-audit-score">
                              {auditResult[2]}/100
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">风险等级：</span>
                            <Badge 
                              className={auditResult[5] === "低风险" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              data-testid="badge-risk-level"
                            >
                              {auditResult[5] || "未知"}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileCheck className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">审核状态：</span>
                            <Badge 
                              className={declaration.status === 'approved' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              data-testid="badge-audit-result"
                            >
                              {declaration.status === 'approved' ? '通过' : '拒绝'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">审核意见</h4>
                        <div className="bg-gray-50 p-3 rounded text-sm" data-testid="text-audit-feedback">
                          {auditResult[3] || "暂无审核意见"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">暂无详细审核记录</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 处理历史 */}
            {auditHistory && auditHistory.length > 0 && (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-900">
                    <Clock className="h-5 w-5 mr-2" />
                    处理历史
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditHistory.map((record, index) => (
                      <div key={record.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {record.submissionType === 'customs_audit' ? '海关审核' : 
                               record.submissionType === 'declaration' ? '申报推送' : 
                               record.submissionType}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(record.processedAt || record.submittedAt)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            平台：{record.platform === 'single_window' ? '中国国际单一窗口' : record.platform}
                          </div>
                          <Badge 
                            className={record.status === 'success' ? "bg-green-100 text-green-800 text-xs" : "bg-red-100 text-red-800 text-xs"}
                          >
                            {record.status === 'success' ? '成功' : '失败'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：流程状态 */}
          <div className="space-y-6">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-900">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  流程状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`flex items-center space-x-3 ${declaration.taskCreated ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`h-3 w-3 rounded-full ${declaration.taskCreated ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">任务创建</span>
                    {declaration.taskCreated && <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div className={`flex items-center space-x-3 ${declaration.dataGenerated ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`h-3 w-3 rounded-full ${declaration.dataGenerated ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">数据生成</span>
                    {declaration.dataGenerated && <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div className={`flex items-center space-x-3 ${declaration.declarationPushed ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`h-3 w-3 rounded-full ${declaration.declarationPushed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">申报推送</span>
                    {declaration.declarationPushed && <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div className={`flex items-center space-x-3 ${declaration.customsValidated ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`h-3 w-3 rounded-full ${declaration.customsValidated ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">海关校验</span>
                    {declaration.customsValidated && <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div className={`flex items-center space-x-3 ${declaration.status === 'approved' ? 'text-green-600' : declaration.status === 'under_review' ? 'text-yellow-600' : 'text-gray-400'}`}>
                    <div className={`h-3 w-3 rounded-full ${declaration.status === 'approved' ? 'bg-green-500' : declaration.status === 'under_review' ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">审核完成</span>
                    {declaration.status === 'approved' && <CheckCircle className="h-4 w-4" />}
                    {declaration.status === 'under_review' && <Clock className="h-4 w-4" />}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.print()}
                  data-testid="button-print"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  打印结果
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleBack}
                  data-testid="button-back-to-list"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回列表
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}