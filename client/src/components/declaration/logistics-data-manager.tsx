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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Truck, 
  MapPin, 
  Package,
  Clock,
  Send,
  CheckCircle,
  Building
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";

const logisticsOrderSchema = z.object({
  waybillNumber: z.string().min(1, "运单号不能为空"),
  carrier: z.string().min(1, "承运商不能为空"),
  vehicleInfo: z.string().min(1, "运输工具信息不能为空"),
  departurePort: z.string().min(1, "起运港不能为空"),
  destinationPort: z.string().min(1, "目的港不能为空"),
  estimatedDeparture: z.string().min(1, "预计发货时间不能为空"),
  estimatedArrival: z.string().min(1, "预计到达时间不能为空"),
  routeDescription: z.string().min(1, "运输路线不能为空"),
  specialInstructions: z.string().optional(),
});

interface LogisticsDataManagerProps {
  declarationId: string;
  onComplete: (data: any) => void;
}

export function LogisticsDataManager({ declarationId, onComplete }: LogisticsDataManagerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof logisticsOrderSchema>>({
    resolver: zodResolver(logisticsOrderSchema),
    defaultValues: {
      waybillNumber: "",
      carrier: "",
      vehicleInfo: "",
      departurePort: "",
      destinationPort: "",
      estimatedDeparture: "",
      estimatedArrival: "",
      routeDescription: "",
      specialInstructions: "",
    },
  });

  // 获取测试数据
  const { data: testData } = useQuery({
    queryKey: ['/api/test-data/list-mode', '默认测试企业'],
    enabled: true,
  });

  // 自动预填测试数据
  useEffect(() => {
    if (testData && (testData as any)?.data?.logisticsData) {
      const logisticsData = (testData as any).data.logisticsData;
      const currentDate = new Date();
      const departureDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // 明天
      const arrivalDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 一周后
      
      form.reset({
        waybillNumber: logisticsData.waybillNumber || "LG2025030001",
        carrier: logisticsData.transport?.carrier || "中远海运物流有限公司",
        vehicleInfo: logisticsData.transport?.vehicle || "集装箱船 OOCL TOKYO / 航次 V2025030",
        departurePort: logisticsData.route?.departure || "深圳盐田港",
        destinationPort: logisticsData.route?.destination || "洛杉矶港",
        estimatedDeparture: departureDate.toISOString().split('T')[0],
        estimatedArrival: arrivalDate.toISOString().split('T')[0],
        routeDescription: logisticsData.route?.description || "深圳 → 香港 → 太平洋航线 → 洛杉矶",
        specialInstructions: "冷链运输，温度控制在2-8℃",
      });
    }
  }, [testData, form]);

  // 推送物流单数据
  const pushLogisticsDataMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof logisticsOrderSchema>) => {
      setIsProcessing(true);

      // 1. 创建物流单记录
      const logisticsOrderData = {
        waybillNumber: formData.waybillNumber,
        status: "created",
        platform: "comprehensive_service",
        logisticsData: {
          shipper: {
            name: "深圳市跨境通电子商务有限公司",
            address: "深圳市南山区科技园南区高新南九道10号",
            phone: "0755-12345678"
          },
          consignee: {
            name: "TechWorld Electronics Inc.",
            address: "123 Tech Street, Los Angeles, CA 90001",
            phone: "+1-555-123-4567"
          },
          transport: {
            carrier: formData.carrier,
            vehicle: formData.vehicleInfo,
            waybillNumber: formData.waybillNumber,
            departurePort: formData.departurePort,
            destinationPort: formData.destinationPort,
            estimatedDeparture: formData.estimatedDeparture,
            estimatedArrival: formData.estimatedArrival,
            transportMode: "sea_freight"
          },
          route: {
            departure: formData.departurePort,
            destination: formData.destinationPort,
            description: formData.routeDescription,
            estimatedTransitTime: "7天",
            specialInstructions: formData.specialInstructions
          }
        }
      };

      const response = await apiRequest("POST", `/api/export-declarations/${declarationId}/logistics-orders`, logisticsOrderData);

      if (!response.ok) {
        throw new Error('创建物流单失败');
      }

      const logisticsOrder = await response.json();

      // 2. 模拟推送到海关系统
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. 更新申报状态
      const updateResponse = await apiRequest("PUT", `/api/export-declarations/${declarationId}`, {
        body: JSON.stringify({
          status: "logistics_pushed"
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!updateResponse.ok) {
        throw new Error('更新申报状态失败');
      }

      return { logisticsOrder, formData };
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      
      toast({
        title: "🚛 物流单推送成功",
        description: "物流单数据已成功推送至海关跨境电商出口统一版管理系统",
        duration: 5000,
      });

      // 通知完成
      onComplete({
        step: 'logistics',
        logisticsOrder: data.logisticsOrder,
        formData: data.formData
      });
    },
    onError: (error) => {
      setIsProcessing(false);
      console.error('推送物流单失败:', error);
      toast({
        title: "推送失败",
        description: "物流单推送失败，请重试",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof logisticsOrderSchema>) => {
    pushLogisticsDataMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Truck className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">录入物流单信息</h3>
        <p className="text-muted-foreground">
          请填写完整的物流运输信息，确保数据准确无误
        </p>
      </div>

      <Card className="border-green-200 dark:border-green-800">
        <CardHeader className="bg-green-50 dark:bg-green-950">
          <CardTitle className="text-lg flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            物流单信息录入
          </CardTitle>
          <CardDescription>
            请根据实际运输安排填写物流单详细信息
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  基本信息
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="waybillNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>运单号 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入运单号" {...field} data-testid="input-waybill-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>承运商 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入承运商名称" {...field} data-testid="input-carrier" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="vehicleInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>运输工具信息 *</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入运输工具详细信息" {...field} data-testid="input-vehicle-info" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* 运输路线 */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  运输路线
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="departurePort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>起运港 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入起运港" {...field} data-testid="input-departure-port" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="destinationPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>目的港 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入目的港" {...field} data-testid="input-destination-port" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="routeDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>运输路线描述 *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="请详细描述运输路线" 
                          {...field} 
                          data-testid="textarea-route-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* 时间安排 */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  时间安排
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estimatedDeparture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>预计发货时间 *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-estimated-departure"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estimatedArrival"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>预计到达时间 *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-estimated-arrival"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* 特殊要求 */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  特殊要求
                </h4>
                
                <FormField
                  control={form.control}
                  name="specialInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>特殊运输要求</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="如有特殊运输要求，请在此说明"
                          {...field} 
                          data-testid="textarea-special-instructions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isProcessing}
                data-testid="button-push-logistics-data"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    推送中...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    推送至海关系统
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}