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
  Download, 
  Upload, 
  FileText, 
  CheckCircle, 
  Package,
  Database,
  Send,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const bookingOrderSchema = z.object({
  orderNumber: z.string().min(1, "订单号不能为空"),
  customerName: z.string().min(1, "客户名称不能为空"),
  destinationCountry: z.string().min(1, "目的国家不能为空"),
  productDetails: z.string().min(1, "产品描述不能为空"),
  weight: z.string().min(1, "重量不能为空"),
  value: z.string().min(1, "价值不能为空"),
  waybillNumber: z.string().min(1, "运单号不能为空"),
});

interface BookingDataManagerProps {
  declarationId: string;
  onComplete: (data: any) => void;
}

export function BookingDataManager({ declarationId, onComplete }: BookingDataManagerProps) {
  const [currentStep, setCurrentStep] = useState<'template' | 'import' | 'push'>('template');
  const [importedData, setImportedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof bookingOrderSchema>>({
    resolver: zodResolver(bookingOrderSchema),
    defaultValues: {
      orderNumber: "",
      customerName: "",
      destinationCountry: "",
      productDetails: "",
      weight: "",
      value: "",
      waybillNumber: "",
    },
  });

  // 获取测试数据
  const { data: testData } = useQuery({
    queryKey: ['/api/test-data/list-mode', '默认测试企业'],
    enabled: true,
  });

  // 自动预填测试数据
  useEffect(() => {
    if (testData?.data?.bookingData) {
      const bookingData = testData.data.bookingData;
      form.reset({
        orderNumber: bookingData.orderNumber || "BOOK2025030001",
        customerName: bookingData.shipper?.name || "深圳市跨境通电子商务有限公司",
        destinationCountry: bookingData.transport?.destination || "美国",
        productDetails: bookingData.goods?.[0]?.name || "无线蓝牙耳机",
        weight: bookingData.goods?.[0]?.weight || "125.5",
        value: bookingData.goods?.[0]?.value || "12750",
        waybillNumber: bookingData.transport?.waybillNumber || "ML2025030001",
      });
      setImportedData([bookingData]);
    }
  }, [testData, form]);

  // 下载模板
  const downloadTemplate = () => {
    const templateData = [
      {
        '订单号': 'BOOK2025030001',
        '客户名称': '深圳市跨境通电子商务有限公司',
        '目的国家': '美国',
        '产品描述': '无线蓝牙耳机',
        '重量(kg)': '125.5',
        '价值(USD)': '12750',
        '运单号': 'ML2025030001'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "订仓单模板");
    XLSX.writeFile(wb, "订仓单导入模板.xlsx");

    toast({
      title: "📥 模板下载完成",
      description: "请填写订仓单数据后重新上传",
      duration: 3000,
    });

    setCurrentStep('import');
  };

  // 文件上传处理
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let parsedData: any[] = [];

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet);
        } else if (file.name.endsWith('.csv')) {
          Papa.parse(data as string, {
            header: true,
            complete: (results) => {
              parsedData = results.data as any[];
            }
          });
        }

        if (parsedData.length > 0) {
          setImportedData(parsedData);
          
          // 自动填充第一行数据到表单
          const firstRow = parsedData[0];
          form.reset({
            orderNumber: firstRow['订单号'] || firstRow.orderNumber || "",
            customerName: firstRow['客户名称'] || firstRow.customerName || "",
            destinationCountry: firstRow['目的国家'] || firstRow.destinationCountry || "",
            productDetails: firstRow['产品描述'] || firstRow.productDetails || "",
            weight: String(firstRow['重量(kg)'] || firstRow.weight || ""),
            value: String(firstRow['价值(USD)'] || firstRow.value || ""),
            waybillNumber: firstRow['运单号'] || firstRow.waybillNumber || "",
          });

          toast({
            title: "📊 数据导入成功",
            description: `成功导入 ${parsedData.length} 条订仓单记录`,
            duration: 3000,
          });

          setCurrentStep('push');
        }
      } catch (error) {
        console.error('文件解析失败:', error);
        toast({
          title: "导入失败",
          description: "文件格式不正确，请检查文件内容",
          variant: "destructive",
        });
      }
    };

    reader.readAsBinaryString(file);
  };

  // 推送订仓单数据
  const pushBookingDataMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof bookingOrderSchema>) => {
      setIsProcessing(true);

      // 1. 创建订仓单记录
      const bookingOrderData = {
        orderNumber: formData.orderNumber,
        status: "created",
        platform: "comprehensive_service",
        orderData: {
          shipper: {
            name: formData.customerName,
            address: "深圳市南山区科技园",
            phone: "0755-12345678"
          },
          consignee: {
            name: "TechWorld Electronics Inc.",
            address: "123 Tech Street, Los Angeles, CA 90001",
            phone: "+1-555-123-4567"
          },
          goods: [{
            name: formData.productDetails,
            weight: parseFloat(formData.weight),
            value: parseFloat(formData.value),
            quantity: 500,
            unit: "个"
          }],
          transport: {
            destination: formData.destinationCountry,
            waybillNumber: formData.waybillNumber,
            vessel: "OOCL TOKYO",
            voyage: "V2025030"
          }
        }
      };

      const response = await apiRequest("POST", `/api/export-declarations/${declarationId}/booking-orders`, {
        body: JSON.stringify(bookingOrderData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('创建订仓单失败');
      }

      const bookingOrder = await response.json();

      // 2. 模拟推送到海关系统
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. 更新状态为已推送
      const updateResponse = await apiRequest("PUT", `/api/export-declarations/${declarationId}`, {
        body: JSON.stringify({
          status: "booking_pushed",
          bookingOrderPushed: true,
          importedData: importedData
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!updateResponse.ok) {
        throw new Error('更新申报状态失败');
      }

      return { bookingOrder, importedData, formData };
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      
      toast({
        title: "🚀 订仓单推送成功",
        description: "订仓单数据已成功推送至海关跨境电商出口统一版管理系统",
        duration: 5000,
      });

      // 通知完成
      onComplete({
        step: 'booking',
        bookingOrder: data.bookingOrder,
        importedData: data.importedData,
        formData: data.formData
      });
    },
    onError: (error) => {
      setIsProcessing(false);
      console.error('推送订仓单失败:', error);
      toast({
        title: "推送失败",
        description: "订仓单推送失败，请重试",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof bookingOrderSchema>) => {
    pushBookingDataMutation.mutate(data);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">下载订仓单模板</h3>
              <p className="text-muted-foreground">
                请先下载标准的订仓单Excel模板，填写完成后再上传导入数据
              </p>
            </div>
            
            <Button 
              onClick={downloadTemplate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-download-template"
            >
              <Download className="mr-2 h-4 w-4" />
              下载订仓单模板
            </Button>
          </div>
        );

      case 'import':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">导入订仓单数据</h3>
              <p className="text-muted-foreground mb-6">
                请上传填写完成的订仓单Excel文件
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                data-testid="input-file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="h-12 w-12 text-gray-400" />
                <span className="text-lg font-medium">点击上传文件</span>
                <span className="text-sm text-muted-foreground">
                  支持 Excel (.xlsx, .xls) 和 CSV 文件
                </span>
              </label>
            </div>

            {importedData.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">
                    已导入 {importedData.length} 条记录
                  </span>
                </div>
                
                <Button 
                  onClick={() => setCurrentStep('push')}
                  className="w-full"
                  data-testid="button-continue-to-push"
                >
                  继续推送数据
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        );

      case 'push':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">推送订仓单数据</h3>
              <p className="text-muted-foreground">
                确认订仓单信息无误后，推送至海关跨境电商出口统一版管理系统
              </p>
            </div>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="bg-blue-50 dark:bg-blue-950">
                <CardTitle className="text-lg flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  订仓单信息确认
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="orderNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>订单号</FormLabel>
                            <FormControl>
                              <Input placeholder="订单号" {...field} data-testid="input-order-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="waybillNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>运单号</FormLabel>
                            <FormControl>
                              <Input placeholder="运单号" {...field} data-testid="input-waybill-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>客户名称</FormLabel>
                            <FormControl>
                              <Input placeholder="客户名称" {...field} data-testid="input-customer-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="destinationCountry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>目的国家</FormLabel>
                            <FormControl>
                              <Input placeholder="目的国家" {...field} data-testid="input-destination-country" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="productDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>产品描述</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="产品详细描述" 
                              {...field} 
                              data-testid="textarea-product-details"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>重量 (kg)</FormLabel>
                            <FormControl>
                              <Input placeholder="重量" {...field} data-testid="input-weight" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>价值 (USD)</FormLabel>
                            <FormControl>
                              <Input placeholder="价值" {...field} data-testid="input-value" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-6" />

                    <Button 
                      type="submit" 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={isProcessing}
                      data-testid="button-push-booking-data"
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

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 步骤进度条 */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        {(['template', 'import', 'push'] as const).map((step, index) => {
          const isActive = step === currentStep;
          const isCompleted = (['template', 'import', 'push'] as const).indexOf(currentStep) > index;
          
          const stepIcons = {
            template: Download,
            import: Upload,
            push: Send,
          };
          
          const stepLabels = {
            template: "下载模板",
            import: "导入数据", 
            push: "推送数据",
          };
          
          const IconComponent = stepIcons[step];
          
          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center space-y-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted 
                    ? "bg-green-500 text-white" 
                    : isActive 
                      ? "bg-blue-500 text-white ring-2 ring-offset-2 ring-blue-300"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                )}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <IconComponent className="h-5 w-5" />
                  )}
                </div>
                <div className={cn(
                  "text-sm font-medium",
                  isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                )}>
                  {stepLabels[step]}
                </div>
              </div>
              
              {index < 2 && (
                <div className={cn(
                  "w-16 h-0.5 mx-4 transition-colors duration-300",
                  isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* 步骤内容 */}
      {renderStepContent()}
    </div>
  );
}