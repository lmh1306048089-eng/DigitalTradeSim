import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Eye,
  Calendar,
  Gavel
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ExportDeclaration } from "@shared/schema";

interface CustomsDeclarationQueryProps {
  onBack?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-800", icon: FileText },
  booking_pushed: { label: "舱位已推送", color: "bg-blue-100 text-blue-800", icon: Clock },
  declaration_pushed: { label: "申报已推送", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  under_review: { label: "海关审核中", color: "bg-orange-100 text-orange-800", icon: Clock },
  approved: { label: "审核通过", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "审核不通过", color: "bg-red-100 text-red-800", icon: XCircle }
};

export default function CustomsDeclarationQuery({ onBack }: CustomsDeclarationQueryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // 获取用户的申报记录列表
  const { data: declarations, isLoading, isError, error, refetch } = useQuery<ExportDeclaration[]>({
    queryKey: ['/api/export-declarations'],
    refetchInterval: 30000, // 每30秒自动刷新
    retry: 3, // 失败时重试3次
  });

  // 海关审核模拟mutation
  const customsReviewMutation = useMutation({
    mutationFn: async ({ forceTrigger = false }: { forceTrigger?: boolean } = {}) => {
      const response = await apiRequest("POST", "/api/customs/simulate-review", {
        body: JSON.stringify({ forceTrigger }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('海关审核模拟失败');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🏛️ 海关审核模拟完成",
        description: data.message,
        duration: 5000,
      });
      
      // 刷新申报列表
      queryClient.invalidateQueries({ queryKey: ['/api/export-declarations'] });
    },
    onError: (error) => {
      console.error('海关审核模拟失败:', error);
      toast({
        title: "审核模拟失败",
        description: "海关审核模拟失败，请稍后重试",
        variant: "destructive",
      });
    }
  });

  const filteredDeclarations = declarations?.filter(decl => {
    const matchesSearch = !searchQuery || 
      decl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (decl.generatedData?.customsNumber && decl.generatedData.customsNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTab = activeTab === "all" || decl.status === activeTab;
    
    return matchesSearch && matchesTab;
  }) || [];

  // 计算待审核的申报数量
  const underReviewCount = declarations?.filter(d => d.status === "under_review").length || 0;

  // 自动审核轮询 - 每60秒检查一次是否有可以自动审核的申报
  useEffect(() => {
    if (underReviewCount === 0) return;

    const autoReviewInterval = setInterval(async () => {
      try {
        // 静默触发审核检查（不强制，只处理符合时间条件的）
        const response = await apiRequest("POST", "/api/customs/simulate-review", {
          body: JSON.stringify({ forceTrigger: false }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          // 如果有申报被处理，刷新数据
          if (result.processed > 0) {
            queryClient.invalidateQueries({ queryKey: ['/api/export-declarations'] });
          }
        }
      } catch (error) {
        // 静默失败，不影响用户体验
        console.log('自动审核检查失败:', error);
      }
    }, 60000); // 每60秒检查一次

    return () => clearInterval(autoReviewInterval);
  }, [underReviewCount]); // 只依赖申报数量

  const formatDateTime = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return "-";
    
    try {
      // 处理各种日期格式：字符串、Date对象或null
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) return "-";
      
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
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
    
    // 返回原始值，让formatDateTime处理类型转换
    if (submittedAt) return submittedAt;
    if (readyAt) return readyAt;
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">加载申报记录...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-12 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">加载失败</h3>
              <p className="text-red-700 mb-4">
                无法获取申报记录，请检查网络连接或稍后重试。
              </p>
              <div className="space-x-2">
                <Button 
                  onClick={() => refetch()}
                  data-testid="button-retry"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
                <Link href="/">
                  <Button variant="outline" data-testid="button-home-error">
                    返回主页
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* 顶部导航栏 - 模仿单一窗口风格 */}
      <div className="bg-white border-b border-blue-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onBack}
                  data-testid="button-back"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回
                </Button>
              ) : (
                <Link href="/">
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid="link-home"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    返回主页
                  </Button>
                </Link>
              )}
              <div className="text-xl font-semibold text-blue-900">申报结果查询</div>
              <div className="text-sm text-gray-500">中国国际贸易单一窗口</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => customsReviewMutation.mutate({ forceTrigger: false })}
                  disabled={customsReviewMutation.isPending || underReviewCount === 0}
                  data-testid="button-simulate-review"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {customsReviewMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Gavel className="h-4 w-4 mr-2" />
                  )}
                  海关审核模拟
                </Button>
                {underReviewCount > 0 && (
                  <Badge 
                    variant="outline" 
                    className="bg-yellow-50 text-yellow-700 border-yellow-200"
                    data-testid="badge-under-review-count"
                  >
                    {underReviewCount}个待审核
                  </Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                data-testid="button-refresh"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 搜索和筛选 */}
        <Card className="mb-6 border-blue-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900 flex items-center">
              <Search className="h-5 w-5 mr-2" />
              查询条件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="输入申报标题或海关单号搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <Button 
                variant="outline"
                data-testid="button-search" 
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 状态标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-blue-50 border-blue-200">
            <TabsTrigger value="all" data-testid="tab-all">全部</TabsTrigger>
            <TabsTrigger value="under_review" data-testid="tab-under-review">审核中</TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">已通过</TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">未通过</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredDeclarations.length === 0 ? (
              <Card className="border-blue-200">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无申报记录</h3>
                  <p className="text-gray-500">您还没有提交任何海关申报，请先完成申报流程。</p>
                  <Link href="/customs-declaration-export">
                    <Button className="mt-4" data-testid="button-new-declaration">
                      立即申报
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredDeclarations.map((declaration) => {
                  const status = statusConfig[declaration.status] || {
                    label: declaration.status,
                    color: "bg-gray-100 text-gray-800",
                    icon: AlertCircle
                  };
                  const StatusIcon = status.icon;
                  
                  return (
                    <Card 
                      key={declaration.id} 
                      className="border-blue-200 hover:shadow-md transition-shadow"
                      data-testid={`card-declaration-${declaration.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-blue-900" data-testid={`text-title-${declaration.id}`}>
                                {declaration.title}
                              </h3>
                              <Badge 
                                className={status.color}
                                data-testid={`badge-status-${declaration.id}`}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">海关单号：</span>
                                <span 
                                  className="font-medium"
                                  data-testid={`text-customs-number-${declaration.id}`}
                                >
                                  {getCustomsNumber(declaration)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">提交时间：</span>
                                <span 
                                  className="font-medium"
                                  data-testid={`text-submitted-time-${declaration.id}`}
                                >
                                  {formatDateTime(getSubmittedTime(declaration))}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">申报模式：</span>
                                <span className="font-medium">
                                  {declaration.declarationMode === "declaration" ? "报关单模式" : "清单模式"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">创建时间：</span>
                                <span className="font-medium">
                                  {formatDateTime(declaration.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              data-testid={`button-view-${declaration.id}`}
                              className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              查看详情
                            </Button>
                          </div>
                        </div>
                        
                        {/* 进度指示器 */}
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center space-x-4 text-xs">
                            <div className={`flex items-center space-x-1 ${declaration.taskCreated ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className={`h-2 w-2 rounded-full ${declaration.taskCreated ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span>任务创建</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${declaration.declarationPushed ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className={`h-2 w-2 rounded-full ${declaration.declarationPushed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span>申报推送</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${declaration.customsValidated ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className={`h-2 w-2 rounded-full ${declaration.customsValidated ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span>海关校验</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${declaration.status === 'approved' ? 'text-green-600' : declaration.status === 'under_review' ? 'text-yellow-600' : 'text-gray-400'}`}>
                              <div className={`h-2 w-2 rounded-full ${declaration.status === 'approved' ? 'bg-green-500' : declaration.status === 'under_review' ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                              <span>审核完成</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{declarations?.length || 0}</div>
              <div className="text-sm text-gray-500">总申报数</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {declarations?.filter(d => d.status === 'under_review').length || 0}
              </div>
              <div className="text-sm text-gray-500">审核中</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {declarations?.filter(d => d.status === 'approved').length || 0}
              </div>
              <div className="text-sm text-gray-500">已通过</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {declarations?.filter(d => d.status === 'rejected').length || 0}
              </div>
              <div className="text-sm text-gray-500">未通过</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}