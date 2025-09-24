import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Clock, FileText, User, Calendar, Award, Download, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ExperimentResult } from "../../types/index";

interface ExperimentResultViewerProps {
  experimentId: string;
  experimentName: string;
  onRestart?: () => void;
  onBackToScene?: () => void;
}

export function ExperimentResultViewer({ 
  experimentId, 
  experimentName, 
  onRestart, 
  onBackToScene 
}: ExperimentResultViewerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRestarting, setIsRestarting] = useState(false);

  // 获取实验结果数据
  const { data: result, isLoading, error } = useQuery<ExperimentResult | null>({
    queryKey: ["/api/experiment-results", experimentId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/experiment-results/${experimentId}`);
      return response.json();
    },
    retry: 1,
  });

  // 处理重启实验
  const handleRestart = async () => {
    try {
      setIsRestarting(true);
      const response = await apiRequest("POST", `/api/experiments/${experimentId}/restart`);
      
      if (response.ok) {
        const data = await response.json();
        
        // 重启成功后失效相关缓存
        await queryClient.invalidateQueries({
          queryKey: ["/api/experiment-results", experimentId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["/api/progress", experimentId],
        });
        
        toast({
          title: "实验已重启",
          description: data.message || "您可以重新开始这个实验了",
        });
        
        // 调用父组件的回调
        if (onRestart) {
          onRestart();
        }
      } else {
        throw new Error("重启失败");
      }
    } catch (error: any) {
      toast({
        title: "重启失败",
        description: error.message || "无法重启实验，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsRestarting(false);
    }
  };

  // 格式化提交数据显示
  const renderSubmissionData = (submissionData: any) => {
    if (!submissionData) return <p className="text-muted-foreground">无提交数据</p>;

    // 处理不同类型的实验数据
    if (typeof submissionData === 'object') {
      return (
        <ScrollArea className="h-64 w-full rounded border p-3">
          <div className="space-y-3">
            {Object.entries(submissionData).map(([key, value], index) => {
              // 过滤系统字段
              if (['userId', 'id', 'createdAt', 'updatedAt'].includes(key)) return null;
              
              return (
                <div key={index} className="border-b pb-2 last:border-b-0">
                  <div className="font-medium text-sm text-muted-foreground mb-1">
                    {getFieldDisplayName(key)}
                  </div>
                  <div className="text-sm">
                    {formatFieldValue(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      );
    }

    return <p className="text-sm">{String(submissionData)}</p>;
  };

  // 获取字段显示名称
  const getFieldDisplayName = (fieldName: string): string => {
    const fieldNames: Record<string, string> = {
      // 基础信息
      companyName: "企业名称",
      unifiedCreditCode: "统一社会信用代码", 
      businessLicenseNumber: "营业执照号",
      legalRepresentative: "法定代表人",
      registeredAddress: "注册地址",
      businessAddress: "经营地址",
      contactPerson: "联系人",
      contactPhone: "联系电话",
      contactEmail: "联系邮箱",
      
      // 报关单字段
      preEntryNo: "预录入编号",
      customsNo: "海关编号",
      consignorConsignee: "收发货人",
      declarationUnit: "申报单位",
      exportPort: "出口口岸",
      transportMode: "运输方式",
      supervisionMode: "监管方式",
      totalAmountForeign: "外币总价",
      totalAmountCNY: "人民币总价",
      exchangeRate: "汇率",
      packages: "件数",
      grossWeight: "毛重",
      netWeight: "净重",
      goods: "货物明细",
      
      // 其他常见字段
      submittedAt: "提交时间",
      status: "状态"
    };
    
    return fieldNames[fieldName] || fieldName;
  };

  // 格式化字段值显示
  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return "未填写";
    if (typeof value === 'boolean') return value ? "是" : "否";
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.length > 0 ? `${value.length} 项` : "无";
      }
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  // 格式化时间显示
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600 animate-spin" />
              <CardTitle>加载提交结果中...</CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle>加载失败</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">无法加载实验结果，请刷新页面重试。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <CardTitle>暂无提交记录</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              您还没有提交过这个实验的结果。
            </p>
            <div className="flex gap-3">
              <Button onClick={onRestart} disabled={isRestarting}>
                开始实验
              </Button>
              {onBackToScene && (
                <Button variant="outline" onClick={onBackToScene}>
                  返回场景
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 结果概览卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle>{experimentName} - 提交结果</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  您已成功提交实验结果
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              已提交
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">提交时间：</span>
              <span>{formatDateTime(result.submittedAt!)}</span>
            </div>
            
            {result.score && (
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">评分：</span>
                <span className="font-medium">{result.score} 分</span>
              </div>
            )}
          </div>

          {/* 评价反馈 */}
          {result.feedback && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  教师评价
                </h4>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{result.feedback}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 提交数据详情 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            提交数据详情
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderSubmissionData(result.submissionData)}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">实验管理</h4>
              <p className="text-sm text-muted-foreground">
                您可以重新开始这个实验或返回场景继续其他任务
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRestart}
                disabled={isRestarting}
                data-testid="button-restart-experiment"
              >
                {isRestarting ? "重启中..." : "重新开始"}
              </Button>
              {onBackToScene && (
                <Button 
                  variant="outline" 
                  onClick={onBackToScene}
                  data-testid="button-back-to-scene"
                >
                  返回场景
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}