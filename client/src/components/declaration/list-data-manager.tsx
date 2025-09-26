import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Database, 
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Package2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";

const listDeclarationSchema = z.object({
  listNumber: z.string().min(1, "清单编号不能为空"),
  totalValue: z.coerce.number().positive("总价值必须大于0"),
  totalWeight: z.coerce.number().positive("总重量必须大于0"),
  totalQuantity: z.coerce.number().int().positive("总件数必须为正整数"),
  summary: z.string().min(1, "汇总说明不能为空"),
});

interface ListDataManagerProps {
  declarationId: string;
  onComplete: (data: any) => void;
}

export function ListDataManager({ declarationId, onComplete }: ListDataManagerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'pending' | 'validating' | 'submitted' | 'approved' | 'rejected'>('pending');
  const [validationMessage, setValidationMessage] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof listDeclarationSchema>>({
    resolver: zodResolver(listDeclarationSchema),
    defaultValues: {
      listNumber: "",
      totalValue: 0,
      totalWeight: 0,
      totalQuantity: 0,
      summary: "",
    },
  });

  // 获取测试数据
  const { data: testData } = useQuery({
    queryKey: ['/api/test-data/list-mode', '默认测试企业'],
    enabled: true,
  });

  // 获取相关的订仓单和物流单数据
  const { data: bookingOrders } = useQuery({
    queryKey: ['/api/export-declarations', declarationId, 'booking-orders'],
  });

  const { data: logisticsOrders } = useQuery({
    queryKey: ['/api/export-declarations', declarationId, 'logistics-orders'],
  });

  // 自动预填测试数据
  useEffect(() => {
    if (testData && (testData as any)?.data?.listData) {
      const listData = (testData as any).data.listData;
      form.reset({
        listNumber: listData.listNumber || "LIST2025030001",
        totalValue: listData.totalValue || 12750,
        totalWeight: listData.totalWeight || 125.5,
        totalQuantity: listData.summary?.totalQuantity || 500,
        summary: "包含1种商品：无线蓝牙耳机，共500个，总重125.5公斤，总价值12750美元",
      });
    }
  }, [testData, form]);

  // 模拟商品清单数据
  const mockItemsData = [
    {
      itemNo: 1,
      hsCode: "8518300000",
      goodsName: "无线蓝牙耳机",
      specification: "支持蓝牙5.0，续航8小时",
      quantity: 500,
      unit: "个",
      unitPrice: 25.5,
      totalPrice: 12750,
      currency: "USD",
      originCountry: "中国",
      brand: "TechSound"
    }
  ];

  // 推送清单数据并等待海关逻辑检验
  const pushListDataMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof listDeclarationSchema>) => {
      setIsProcessing(true);
      setValidationStatus('pending');

      // 1. 创建清单申报记录
      const listDeclarationData = {
        listNumber: formData.listNumber,
        status: "created",
        platform: "unified_export",
        listData: {
          summary: {
            listNumber: formData.listNumber,
            totalValue: formData.totalValue,
            totalWeight: formData.totalWeight,
            totalQuantity: formData.totalQuantity,
            currency: "USD",
            description: formData.summary
          },
          items: mockItemsData,
          totalValue: formData.totalValue,
          totalWeight: formData.totalWeight
        },
        logicValidated: false
      };

      const response = await apiRequest("POST", `/api/export-declarations/${declarationId}/list-declarations`, listDeclarationData);

      if (!response.ok) {
        throw new Error('创建清单申报失败');
      }

      const listDeclaration = await response.json();

      // 2. 模拟推送到海关系统
      setValidationStatus('validating');
      setValidationMessage("正在推送至海关跨境电商出口统一版管理系统...");
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 3. 模拟海关逻辑检验
      setValidationMessage("海关系统正在进行逻辑检验...");
      await new Promise(resolve => setTimeout(resolve, 4000));

      // 4. 提交到海关审核队列
      setValidationStatus('submitted');
      setValidationMessage("清单数据已提交至海关系统，等待海关逻辑检验...");
      
      // 更新申报状态为 under_review，交由后台调度器处理
      await apiRequest("PUT", `/api/export-declarations/${declarationId}`, {
        status: "under_review",
        readyAt: new Date().toISOString() // 设置审核准备时间
      });

      return { listDeclaration, formData };
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      
      toast({
        title: "🏛️ 清单申报已提交",
        description: "清单数据已成功推送至海关系统，等待逻辑检验结果",
        duration: 6000,
      });

      // 通知完成提交
      setTimeout(() => {
        onComplete({
          step: 'list',
          listDeclaration: data.listDeclaration,
          formData: data.formData,
          status: 'under_review'
        });
      }, 2000);
    },
    onError: (error) => {
      setIsProcessing(false);
      console.error('推送清单申报失败:', error);
      toast({
        title: "申报失败",
        description: error.message || "清单申报失败，请重试",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof listDeclarationSchema>) => {
    pushListDataMutation.mutate(data);
  };

  const getValidationStatusConfig = () => {
    switch (validationStatus) {
      case 'pending':
        return {
          icon: Clock,
          color: "text-gray-500",
          bgColor: "bg-gray-100 dark:bg-gray-800",
          label: "待推送"
        };
      case 'validating':
        return {
          icon: AlertCircle,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100 dark:bg-yellow-900",
          label: "检验中"
        };
      case 'submitted':
        return {
          icon: Clock,
          color: "text-blue-600",
          bgColor: "bg-blue-100 dark:bg-blue-900",
          label: "已提交"
        };
      case 'approved':
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100 dark:bg-green-900",
          label: "已通过"
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          color: "text-red-600",
          bgColor: "bg-red-100 dark:bg-red-900",
          label: "未通过"
        };
    }
  };

  const statusConfig = getValidationStatusConfig();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">汇总清单数据</h3>
        <p className="text-muted-foreground">
          根据订仓单和物流单信息生成清单数据，推送至海关系统进行逻辑检验
        </p>
      </div>

      {/* 海关检验状态 */}
      {validationStatus !== 'pending' && (
        <Card className={cn("border-2", statusConfig.bgColor)}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <statusConfig.icon className={cn("h-5 w-5", statusConfig.color)} />
              <span>海关逻辑检验状态</span>
              <Badge variant="outline" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{validationMessage}</p>
            {validationStatus === 'validating' && (
              <div className="mt-4 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span className="text-sm">检验过程通常需要3-5分钟，请耐心等待...</span>
              </div>
            )}
            {validationStatus === 'submitted' && (
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 提示：您可以在"海关申报查询"页面实时查看审核进度和结果
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 清单汇总信息 */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="bg-purple-50 dark:bg-purple-950">
            <CardTitle className="text-lg flex items-center">
              <Database className="mr-2 h-5 w-5" />
              清单汇总信息
            </CardTitle>
            <CardDescription>
              请确认清单汇总数据的准确性
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="listNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>清单编号 *</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入清单编号" {...field} data-testid="input-list-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>总件数 *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="总件数" 
                            {...field} 
                            data-testid="input-total-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="totalWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>总重量 (kg) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            placeholder="总重量" 
                            {...field} 
                            data-testid="input-total-weight"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="totalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>总价值 (USD) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="总价值" 
                          {...field} 
                          data-testid="input-total-value"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>汇总说明 *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="请输入清单汇总说明"
                          {...field} 
                          data-testid="textarea-summary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-6" />

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isProcessing || validationStatus === 'approved'}
                  data-testid="button-push-list-data"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      推送中...
                    </>
                  ) : validationStatus === 'approved' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      申报已完成
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      推送清单数据
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* 商品明细列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Package2 className="mr-2 h-5 w-5" />
              商品明细
            </CardTitle>
            <CardDescription>
              根据订仓单生成的商品清单
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>序号</TableHead>
                    <TableHead>商品名称</TableHead>
                    <TableHead>HS编码</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>单价</TableHead>
                    <TableHead>总价</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockItemsData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.itemNo}</TableCell>
                      <TableCell className="font-medium">{item.goodsName}</TableCell>
                      <TableCell className="font-mono text-sm">{item.hsCode}</TableCell>
                      <TableCell>{item.quantity} {item.unit}</TableCell>
                      <TableCell>${item.unitPrice}</TableCell>
                      <TableCell className="font-medium">${item.totalPrice}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 说明信息 */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                海关逻辑检验说明
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                清单数据推送至海关系统后，将自动进行以下检验：
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4">
                <li>• 商品信息与订仓单数据一致性检验</li>
                <li>• HS编码与商品描述匹配性检验</li>
                <li>• 价值和重量数据合理性检验</li>
                <li>• 物流信息与清单数据关联性检验</li>
              </ul>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                检验通过后，申报流程完成，您可以在中国国际单一窗口查询申报结果。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}