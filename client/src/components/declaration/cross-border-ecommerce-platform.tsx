import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Download, 
  FileText, 
  Database, 
  Send, 
  CheckCircle, 
  Clock,
  Building,
  Package,
  Ship,
  Settings,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CrossBorderEcommercePlatformProps {
  onComplete?: (data: any) => void;
  onCancel?: () => void;
}

type WorkflowStep = 'booking' | 'template' | 'fill' | 'task' | 'generate' | 'management';

interface BookingData {
  orderNumber: string;
  customerName: string;
  destinationCountry: string;
  productDetails: string;
  weight: string;
  value: string;
}

interface DeclarationTask {
  id: string;
  taskName: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  orderCount: number;
}

export function CrossBorderEcommercePlatform({ onComplete, onCancel }: CrossBorderEcommercePlatformProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('booking');
  const [bookingData, setBookingData] = useState<BookingData>({
    orderNumber: '',
    customerName: '',
    destinationCountry: '',
    productDetails: '',
    weight: '',
    value: ''
  });
  const [declarationTasks, setDeclarationTasks] = useState<DeclarationTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    declarationNo: '',
    productName: '',
    quantity: '',
    unitPrice: '',
    totalPrice: '',
    hsCode: '',
    originCountry: '',
    notes: ''
  });

  // 自动填充测试数据
  useEffect(() => {
    const loadTestData = async () => {
      try {
        const response = await apiRequest("GET", "/api/test-data/customs-declaration-export");
        if (response.ok) {
          const testData = await response.json();
          if (testData && testData.length > 0) {
            const data = testData[0];
            setBookingData({
              orderNumber: data.orderNumber || 'CB202509220001',
              customerName: data.customerName || '上海跨境贸易有限公司',
              destinationCountry: data.destinationCountry || '美国',
              productDetails: data.productDetails || '电子产品 - 智能手机配件',
              weight: data.weight || '2.5',
              value: data.value || '1500.00'
            });
          }
        }
      } catch (error) {
        console.log("测试数据加载失败，使用默认数据");
        setBookingData({
          orderNumber: 'CB202509220001',
          customerName: '上海跨境贸易有限公司',
          destinationCountry: '美国',
          productDetails: '电子产品 - 智能手机配件',
          weight: '2.5',
          value: '1500.00'
        });
      }
    };

    loadTestData();
  }, []);

  const steps = [
    { id: 'booking', title: '订仓单数据推送', icon: Ship, description: '推送订仓单数据到综合服务平台' },
    { id: 'template', title: '模板下载', icon: Download, description: '下载报关单模式申报模板并导入基础数据' },
    { id: 'fill', title: '表单填写与上传', icon: Upload, description: '填写申报表单并上传文件' },
    { id: 'task', title: '申报任务创建', icon: FileText, description: '创建新的申报任务' },
    { id: 'generate', title: '数据生成', icon: Settings, description: '生成申报数据' },
    { id: 'management', title: '数据申报管理与推送', icon: BarChart3, description: '管理申报数据并推送到统一版系统' }
  ];

  const getStepIndex = (step: WorkflowStep) => steps.findIndex(s => s.id === step);

  const handleNext = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as WorkflowStep);
    }
  };

  const handlePrev = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as WorkflowStep);
    }
  };

  const handleBookingPush = async () => {
    try {
      toast({
        title: "订仓单数据推送成功",
        description: `订单 ${bookingData.orderNumber} 已成功推送到跨境电商综合服务平台`,
      });
      setTimeout(() => {
        handleNext();
      }, 1500);
    } catch (error) {
      toast({
        title: "推送失败",
        description: "订仓单数据推送失败，请重试",
        variant: "destructive"
      });
    }
  };

  const handleDataImport = async () => {
    try {
      toast({
        title: "基础数据导入成功",
        description: "基础数据已成功导入到综合服务平台",
      });
      setTimeout(() => {
        handleNext();
      }, 1500);
    } catch (error) {
      toast({
        title: "导入失败",
        description: "基础数据导入失败，请重试",
        variant: "destructive"
      });
    }
  };

  const handleTemplateDownload = () => {
    // 模拟基础数据导入
    toast({
      title: "基础数据导入中...",
      description: "正在导入企业信息、商品编码、申报要素等基础数据",
    });
    
    setTimeout(() => {
      // 模拟模板下载
      const link = document.createElement('a');
      link.href = 'data:text/csv;charset=utf-8,申报单号,商品名称,数量,单价,总价,HS编码,原产国,备注\nCB001,智能手机,1,999.00,999.00,8517120000,中国,手机及配件';
      link.download = '报关单模式申报模板.csv';
      link.click();
      
      toast({
        title: "模板下载完成",
        description: "基础数据已导入，报关单模式申报模板已下载到本地，请填写后上传",
      });
      
      setTimeout(() => {
        handleNext();
      }, 1500);
    }, 1000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({
        title: "文件上传成功",
        description: `文件 ${file.name} 已上传`,
      });
    }
  };

  const handleFormSubmit = () => {
    if (!formData.declarationNo || !formData.productName || !formData.quantity) {
      toast({
        title: "表单验证失败",
        description: "请填写所有必填字段",
        variant: "destructive"
      });
      return;
    }

    if (!uploadedFile) {
      toast({
        title: "文件验证失败", 
        description: "请上传填写完成的申报文件",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "申报数据提交成功",
      description: "申报表单和文件已成功提交，即将创建申报任务",
    });
    
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const handleCreateTask = () => {
    const newTask: DeclarationTask = {
      id: `task-${Date.now()}`,
      taskName: `申报任务-${bookingData.orderNumber}`,
      status: 'pending',
      createdAt: new Date().toLocaleString(),
      orderCount: 1
    };
    
    setDeclarationTasks([...declarationTasks, newTask]);
    setSelectedTask(newTask.id);
    
    toast({
      title: "申报任务创建成功",
      description: `任务 ${newTask.taskName} 已创建`,
    });
    
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const handleGenerateData = async () => {
    if (!selectedTask) {
      toast({
        title: "请选择任务",
        description: "请先选择一个申报任务",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // 模拟数据生成过程
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 更新任务状态
      setDeclarationTasks(tasks => 
        tasks.map(task => 
          task.id === selectedTask 
            ? { ...task, status: 'completed' }
            : task
        )
      );
      
      toast({
        title: "申报数据生成完成",
        description: "申报数据已成功生成，可以进入数据管理模块",
      });
      
      setTimeout(() => {
        handleNext();
      }, 1500);
    } catch (error) {
      toast({
        title: "数据生成失败",
        description: "申报数据生成失败，请重试",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDataPush = async () => {
    try {
      toast({
        title: "数据推送成功",
        description: "申报数据已成功推送到跨境电商出口统一版系统",
      });
      
      setTimeout(() => {
        if (onComplete) {
          onComplete({
            bookingData,
            declarationTasks,
            completedSteps: steps.length
          });
        }
      }, 2000);
    } catch (error) {
      toast({
        title: "推送失败",
        description: "数据推送失败，请重试",
        variant: "destructive"
      });
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'booking':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Ship className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">订仓单数据推送</h3>
              <p className="text-gray-600">将订仓单数据推送到跨境电商综合服务平台</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderNumber">订单号</Label>
                <Input
                  id="orderNumber"
                  value={bookingData.orderNumber}
                  onChange={(e) => setBookingData(prev => ({ ...prev, orderNumber: e.target.value }))}
                  data-testid="input-order-number"
                />
              </div>
              <div>
                <Label htmlFor="customerName">客户名称</Label>
                <Input
                  id="customerName"
                  value={bookingData.customerName}
                  onChange={(e) => setBookingData(prev => ({ ...prev, customerName: e.target.value }))}
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <Label htmlFor="destinationCountry">目的地国家</Label>
                <Input
                  id="destinationCountry"
                  value={bookingData.destinationCountry}
                  onChange={(e) => setBookingData(prev => ({ ...prev, destinationCountry: e.target.value }))}
                  data-testid="input-destination-country"
                />
              </div>
              <div>
                <Label htmlFor="weight">重量 (KG)</Label>
                <Input
                  id="weight"
                  value={bookingData.weight}
                  onChange={(e) => setBookingData(prev => ({ ...prev, weight: e.target.value }))}
                  data-testid="input-weight"
                />
              </div>
              <div>
                <Label htmlFor="value">货值 (USD)</Label>
                <Input
                  id="value"
                  value={bookingData.value}
                  onChange={(e) => setBookingData(prev => ({ ...prev, value: e.target.value }))}
                  data-testid="input-value"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="productDetails">商品详情</Label>
              <Textarea
                id="productDetails"
                value={bookingData.productDetails}
                onChange={(e) => setBookingData(prev => ({ ...prev, productDetails: e.target.value }))}
                rows={3}
                data-testid="textarea-product-details"
              />
            </div>
            
            <Button onClick={handleBookingPush} className="w-full" data-testid="button-push-booking">
              <Send className="mr-2 h-4 w-4" />
              推送订仓单数据
            </Button>
          </div>
        );


      case 'template':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Download className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-semibold mb-2">报关单模式模板</h3>
              <p className="text-gray-600">下载报关单模式申报模板</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>申报模板文件</CardTitle>
                <CardDescription>包含报关单模式申报所需的所有字段和格式要求</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="font-medium">报关单模式申报模板.csv</div>
                        <div className="text-sm text-gray-500">包含标准申报字段</div>
                      </div>
                    </div>
                    <Badge variant="outline">CSV格式</Badge>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">模板说明：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 包含申报单号、商品名称、数量、单价等必填字段</li>
                      <li>• 支持批量导入多个商品记录</li>
                      <li>• 格式符合海关申报系统要求</li>
                      <li>• 可直接上传到申报系统使用</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button onClick={handleTemplateDownload} className="w-full" data-testid="button-download-template">
              <Download className="mr-2 h-4 w-4" />
              下载申报模板
            </Button>
          </div>
        );

      case 'fill':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Upload className="h-12 w-12 mx-auto mb-4 text-amber-600" />
              <h3 className="text-xl font-semibold mb-2">填写申报表单</h3>
              <p className="text-gray-600">基于下载的模板填写申报信息并上传文件</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>申报信息填写</CardTitle>
                <CardDescription>请填写完整的申报信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="declarationNo">申报单号 *</Label>
                    <Input
                      id="declarationNo"
                      value={formData.declarationNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, declarationNo: e.target.value }))}
                      placeholder="CB202509220001"
                      data-testid="input-declaration-no"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productName">商品名称 *</Label>
                    <Input
                      id="productName"
                      value={formData.productName}
                      onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                      placeholder="智能手机"
                      data-testid="input-product-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">数量 *</Label>
                    <Input
                      id="quantity"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="1"
                      data-testid="input-quantity"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unitPrice">单价 (USD)</Label>
                    <Input
                      id="unitPrice"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                      placeholder="999.00"
                      data-testid="input-unit-price"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalPrice">总价 (USD)</Label>
                    <Input
                      id="totalPrice"
                      value={formData.totalPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalPrice: e.target.value }))}
                      placeholder="999.00"
                      data-testid="input-total-price"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hsCode">HS编码</Label>
                    <Input
                      id="hsCode"
                      value={formData.hsCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, hsCode: e.target.value }))}
                      placeholder="8517120000"
                      data-testid="input-hs-code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="originCountry">原产国</Label>
                    <Input
                      id="originCountry"
                      value={formData.originCountry}
                      onChange={(e) => setFormData(prev => ({ ...prev, originCountry: e.target.value }))}
                      placeholder="中国"
                      data-testid="input-origin-country"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">备注</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="手机及配件"
                    rows={3}
                    data-testid="textarea-notes"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>文件上传</CardTitle>
                <CardDescription>上传填写完成的申报文件</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">拖拽文件到此处或点击选择文件</p>
                      <p className="text-xs text-gray-500">支持 CSV, XLS, XLSX 格式</p>
                    </div>
                    <input
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      data-testid="input-file-upload"
                    />
                    <Label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 mt-4"
                    >
                      选择文件
                    </Label>
                  </div>
                  
                  {uploadedFile && (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-green-600" />
                        <div>
                          <div className="font-medium text-green-800">{uploadedFile.name}</div>
                          <div className="text-sm text-green-600">{(uploadedFile.size / 1024).toFixed(2)} KB</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">已上传</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleFormSubmit} className="w-full" data-testid="button-submit-form">
              <CheckCircle className="mr-2 h-4 w-4" />
              提交申报数据
            </Button>
          </div>
        );

      case 'task':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="h-12 w-12 mx-auto mb-4 text-orange-600" />
              <h3 className="text-xl font-semibold mb-2">创建申报任务</h3>
              <p className="text-gray-600">为当前订单创建申报任务</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>任务信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>任务名称</Label>
                  <Input value={`申报任务-${bookingData.orderNumber}`} disabled />
                </div>
                <div>
                  <Label>关联订单</Label>
                  <Input value={bookingData.orderNumber} disabled />
                </div>
                <div>
                  <Label>申报类型</Label>
                  <Input value="报关单模式出口申报" disabled />
                </div>
                <div>
                  <Label>创建时间</Label>
                  <Input value={new Date().toLocaleString()} disabled />
                </div>
              </CardContent>
            </Card>
            
            {declarationTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>已创建的任务</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {declarationTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{task.taskName}</div>
                          <div className="text-sm text-gray-500">{task.createdAt}</div>
                        </div>
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {task.status === 'pending' ? '待处理' : task.status === 'processing' ? '处理中' : '已完成'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Button onClick={handleCreateTask} className="w-full" data-testid="button-create-task">
              <FileText className="mr-2 h-4 w-4" />
              创建申报任务
            </Button>
          </div>
        );

      case 'generate':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Settings className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
              <h3 className="text-xl font-semibold mb-2">生成申报数据</h3>
              <p className="text-gray-600">为选定的任务生成申报数据</p>
            </div>
            
            {declarationTasks.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>选择任务</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {declarationTasks.map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-center justify-between p-3 border rounded cursor-pointer transition-colors",
                            selectedTask === task.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                          )}
                          onClick={() => setSelectedTask(task.id)}
                        >
                          <div>
                            <div className="font-medium">{task.taskName}</div>
                            <div className="text-sm text-gray-500">订单数量: {task.orderCount}</div>
                          </div>
                          <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                            {task.status === 'pending' ? '待处理' : task.status === 'processing' ? '处理中' : '已完成'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {selectedTask && (
                  <Card>
                    <CardHeader>
                      <CardTitle>数据生成设置</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>申报口岸</Label>
                          <Input value="上海浦东机场" disabled />
                        </div>
                        <div>
                          <Label>监管方式</Label>
                          <Input value="9610" disabled />
                        </div>
                        <div>
                          <Label>贸易方式</Label>
                          <Input value="跨境电商B2C出口" disabled />
                        </div>
                        <div>
                          <Label>运输方式</Label>
                          <Input value="航空运输" disabled />
                        </div>
                      </div>
                      
                      {isGenerating && (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">正在生成申报数据...</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                <Button 
                  onClick={handleGenerateData} 
                  className="w-full" 
                  disabled={!selectedTask || isGenerating}
                  data-testid="button-generate-data"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {isGenerating ? '生成中...' : '生成申报数据'}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">请先创建申报任务</p>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('task')} 
                  className="mt-4"
                >
                  返回创建任务
                </Button>
              </div>
            )}
          </div>
        );

      case 'management':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-teal-600" />
              <h3 className="text-xl font-semibold mb-2">数据申报管理</h3>
              <p className="text-gray-600">管理生成的申报数据</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">待申报</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">1</div>
                  <div className="text-xs text-gray-500">个任务</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">已生成</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {declarationTasks.filter(t => t.status === 'completed').length}
                  </div>
                  <div className="text-xs text-gray-500">个数据</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">已推送</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-xs text-gray-500">个数据</div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>申报数据列表</CardTitle>
              </CardHeader>
              <CardContent>
                {declarationTasks.filter(t => t.status === 'completed').length > 0 ? (
                  <div className="space-y-3">
                    {declarationTasks.filter(t => t.status === 'completed').map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium">{task.taskName}</div>
                            <div className="text-sm text-gray-500">
                              数据已生成 • {task.createdAt}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">已生成</Badge>
                          <Button variant="outline" size="sm">
                            预览数据
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">暂无已生成的申报数据</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Separator className="my-6" />
            
            <Card>
              <CardHeader>
                <CardTitle>推送目标系统</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center space-x-3">
                    <Building className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-medium">跨境电商出口统一版系统</div>
                      <div className="text-sm text-gray-500">海关总署指定申报系统</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    连接正常
                  </Badge>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-yellow-800">推送说明：</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 数据将推送到海关单一窗口平台</li>
                    <li>• 推送后将进入海关审核流程</li>
                    <li>• 可实时查询申报状态</li>
                    <li>• 审核通过后可进行后续通关操作</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>待推送数据</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {declarationTasks.filter(t => t.status === 'completed').map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">{task.taskName}</div>
                          <div className="text-sm text-gray-500">
                            订单号: {bookingData.orderNumber}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">待推送</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Button 
              onClick={handleDataPush} 
              className="w-full" 
              disabled={declarationTasks.filter(t => t.status === 'completed').length === 0}
              data-testid="button-push-data"
            >
              <Send className="mr-2 h-4 w-4" />
              推送到统一版系统
            </Button>
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              跨境电商综合服务平台
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              报关单模式出口申报工作流程
            </p>
          </div>
          
          {/* Progress */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>工作流程进度</span>
                  <span>{getStepIndex(currentStep) + 1} / {steps.length}</span>
                </div>
                <Progress value={((getStepIndex(currentStep) + 1) / steps.length) * 100} />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {steps.map((step, index) => {
                  const isActive = step.id === currentStep;
                  const isCompleted = getStepIndex(currentStep) > index;
                  const Icon = step.icon;
                  
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg transition-all",
                        isActive && "bg-blue-100 border-2 border-blue-500",
                        isCompleted && "bg-green-100 border-2 border-green-500",
                        !isActive && !isCompleted && "bg-gray-100 border-2 border-gray-200"
                      )}
                    >
                      <Icon className={cn(
                        "h-6 w-6 mb-2",
                        isActive && "text-blue-600",
                        isCompleted && "text-green-600",
                        !isActive && !isCompleted && "text-gray-400"
                      )} />
                      <span className={cn(
                        "text-xs text-center font-medium",
                        isActive && "text-blue-900",
                        isCompleted && "text-green-900",
                        !isActive && !isCompleted && "text-gray-500"
                      )}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Current Step Content */}
          <Card>
            <CardContent className="pt-6">
              {renderCurrentStep()}
            </CardContent>
          </Card>
          
          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={onCancel}
              data-testid="button-cancel"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              取消
            </Button>
            
            <div className="space-x-2">
              {getStepIndex(currentStep) > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  data-testid="button-prev"
                >
                  上一步
                </Button>
              )}
              {getStepIndex(currentStep) < steps.length - 1 && (
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentStep === 'generate' && declarationTasks.filter(t => t.status === 'completed').length === 0}
                  data-testid="button-next"
                >
                  下一步
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}