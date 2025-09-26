import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Package,
  Send,
  Ship,
  Globe,
  Weight,
  DollarSign,
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const bookingOrderSchema = z.object({
  orderNumber: z.string().min(1, "订单号不能为空"),
  customerName: z.string().min(1, "客户名称不能为空"),
  destinationCountry: z.string().min(1, "目的国家不能为空"),
  productDetails: z.string().min(1, "产品描述不能为空"),
  weight: z.string().min(1, "重量不能为空").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "重量必须是大于0的数字"
  }),
  value: z.string().min(1, "价值不能为空").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "价值必须是大于0的数字"
  }),
  waybillNumber: z.string().min(1, "运单号不能为空"),
});

interface BookingDataManagerProps {
  declarationId: string;
  onComplete: (data: any) => void;
}

export function BookingDataManager({ declarationId, onComplete }: BookingDataManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("manual");
  const [importedData, setImportedData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

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
    // 始终使用默认的fallback数据确保字段不为空
    const defaultData = {
      orderNumber: "BOOK2025030001",
      customerName: "深圳市跨境通电子商务有限公司",
      destinationCountry: "美国",
      productDetails: "无线蓝牙耳机",
      weight: "125.5",
      value: "12750",
      waybillNumber: "ML2025030001",
    };

    if (testData) {
      // 优先使用API返回的真实测试数据，但确保有fallback
      const orderData = testData as any;
      
      form.reset({
        orderNumber: orderData.orderNumber || defaultData.orderNumber,
        customerName: orderData.shipper?.name || orderData.customerName || defaultData.customerName,
        destinationCountry: orderData.transport?.destination || orderData.destinationCountry || defaultData.destinationCountry,
        productDetails: orderData.goods?.[0]?.name || orderData.productDetails || defaultData.productDetails,
        weight: (orderData.goods?.[0]?.weight || orderData.weight || defaultData.weight).toString(),
        value: (orderData.goods?.[0]?.value || orderData.value || defaultData.value).toString(),
        waybillNumber: orderData.transport?.waybillNumber || orderData.waybillNumber || defaultData.waybillNumber,
      });
    } else {
      // 使用默认的fallback数据
      form.reset(defaultData);
    }
  }, [testData, form]);

  // 模板下载功能
  const downloadTemplate = async () => {
    try {
      const response = await apiRequest("GET", "/api/templates/booking-order");
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'booking-order-template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "下载成功",
          description: "订舱单模板已下载完成",
        });
      } else {
        throw new Error('下载失败');
      }
    } catch (error) {
      console.error("模板下载失败:", error);
      toast({
        title: "下载失败",
        description: "模板下载失败，请重试",
        variant: "destructive",
      });
    }
  };

  // 文件上传和解析
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiRequest("POST", `/api/import/booking-order/${declarationId}`, formData);
      
      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
        setImportedData(result.data || []);
        
        // 如果导入成功且有数据，自动填充第一行数据到表单
        if (result.data && result.data.length > 0) {
          const firstRow = result.data[0];
          form.reset(firstRow);
          setActiveTab("manual"); // 切换到手动填写模式，允许用户编辑
        }
        
        toast({
          title: result.errors.length > 0 ? "导入部分成功" : "导入成功",
          description: result.message,
          variant: result.errors.length > 0 ? "default" : "default",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '导入失败');
      }
    } catch (error: any) {
      console.error("文件导入失败:", error);
      toast({
        title: "导入失败",
        description: error.message || "文件导入失败，请检查文件格式",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 拖拽上传配置
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false
  });

  // 推送订仓单数据
  const pushBookingDataMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof bookingOrderSchema>) => {
      // 1. 创建订仓单记录
      const bookingOrderData = {
        declarationId: declarationId,
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

      const response = await apiRequest("POST", `/api/export-declarations/${declarationId}/booking-orders`, bookingOrderData);

      if (!response.ok) {
        throw new Error('创建订仓单失败');
      }

      const bookingOrder = await response.json();

      // 2. 模拟推送到海关系统
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. 更新状态为已推送
      const updateResponse = await apiRequest("PUT", `/api/export-declarations/${declarationId}`, {
        status: "booking_pushed",
        bookingOrderPushed: true,
        importedData: [formData]
      });

      if (!updateResponse.ok) {
        throw new Error('更新申报状态失败');
      }

      return { bookingOrder, formData };
    },
    onSuccess: (data) => {
      toast({
        title: "🚀 订仓单推送成功",
        description: "订仓单数据已成功推送至海关跨境电商出口统一版管理系统",
        duration: 5000,
      });

      // 通知完成
      onComplete({
        step: 'booking',
        bookingOrder: data.bookingOrder,
        importedData: [data.formData],
        formData: data.formData
      });
    },
    onError: (error) => {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">订仓单数据录入</h2>
        <p className="text-muted-foreground">
          支持手动填写或模板导入，填写完成后推送至海关跨境电商出口统一版管理系统
        </p>
      </div>

      {/* 标签切换区域 */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="bg-blue-50 dark:bg-blue-950">
          <CardTitle className="text-lg flex items-center">
            <Package className="mr-2 h-5 w-5" />
            订仓单信息
          </CardTitle>
          <CardDescription>
            请选择数据录入方式，支持手动填写或Excel模板导入
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>手动填写</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center space-x-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span>模板导入</span>
              </TabsTrigger>
            </TabsList>

            {/* 模板导入标签页 */}
            <TabsContent value="import" className="space-y-6">
              {/* 模板下载区域 */}
              <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">步骤1: 下载模板</h3>
                    <p className="text-sm text-muted-foreground">
                      下载Excel模板，按照格式填写订仓单数据
                    </p>
                  </div>
                  <Button onClick={downloadTemplate} className="flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>下载模板</span>
                  </Button>
                </div>
              </div>

              {/* 文件上传区域 */}
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">步骤2: 上传文件</h3>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center space-y-4">
                    <Upload className={`h-12 w-12 ${isDragActive ? "text-blue-500" : "text-gray-400"}`} />
                    <div>
                      <p className="text-lg font-medium">
                        {isDragActive ? "拖放文件到这里" : "拖拽文件到这里或点击选择"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        支持 .xlsx、.xls、.csv 格式
                      </p>
                    </div>
                    {isUploading && (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>上传中...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 上传结果显示 */}
                {uploadResult && (
                  <div className="mt-6 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      {uploadResult.errors.length === 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                      <span className="font-medium">{uploadResult.message}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>总行数: {uploadResult.totalRows} | 有效行数: {uploadResult.validRows}</p>
                      {uploadResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium text-red-600">错误信息:</p>
                          <ul className="list-disc list-inside">
                            {uploadResult.errors.map((error: string, index: number) => (
                              <li key={index} className="text-red-600">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {uploadResult.data.length > 0 && (
                      <Button 
                        onClick={() => setActiveTab("manual")} 
                        className="mt-4"
                        size="sm"
                      >
                        编辑导入的数据
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 手动填写标签页 */}
            <TabsContent value="manual" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 基础订仓信息 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">基础订仓信息</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="orderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>订单号</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入订单号" {...field} data-testid="input-order-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>客户名称</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入客户名称" {...field} data-testid="input-customer-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="destinationCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-1">
                        <Globe className="h-4 w-4" />
                        <span>目的国家</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="请输入目的国家" {...field} data-testid="input-destination-country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* 运输信息 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Ship className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold">运输信息</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="waybillNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>运单号</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入运单号" {...field} data-testid="input-waybill-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* 货物信息 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Package className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">货物信息</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="productDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>产品描述</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="请详细描述产品信息" 
                          {...field} 
                          data-testid="textarea-product-details"
                          className="min-h-[80px]"
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
                        <FormLabel className="flex items-center space-x-1">
                          <Weight className="h-4 w-4" />
                          <span>重量 (kg)</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="请输入重量" {...field} data-testid="input-weight" />
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
                        <FormLabel className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>价值 (USD)</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="请输入价值" {...field} data-testid="input-value" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* 提交按钮 */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  disabled={pushBookingDataMutation.isPending}
                  data-testid="button-push-booking-data"
                >
                  {pushBookingDataMutation.isPending ? (
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
              </div>
            </form>
          </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}