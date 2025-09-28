import { useState, useCallback, useEffect } from "react";
import { 
  Package, 
  Printer, 
  ShoppingCart, 
  CheckCircle, 
  Circle, 
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Hash,
  Clock,
  AlertTriangle,
  QrCode,
  Eye,
  CheckSquare,
  X,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Type definitions
interface OrderItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  location: string;
  zone: string;
  price: number;
  weight: number;
  dimensions: string;
  category: string;
}

interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface OrderData {
  id: string;
  customer: CustomerInfo;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'picked' | 'shipped' | 'delivered';
  orderDate: string;
  totalValue: number;
  totalItems: number;
  estimatedWeight: number;
}

interface CartType {
  id: string;
  name: string;
  capacity: string;
  maxWeight: string;
  dimensions: string;
  suitable: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  description: string;
}

interface OrderProcessingAreaProps {
  orderData: OrderData;
  onOrderPrinted?: (orderId: string, printData: any) => void;
  onCartPrepared?: (orderId: string, cartType: string) => void;
  onComplete?: (orderId: string, completionData: any) => void;
}

// Sample order data for demonstration
const sampleOrderData: OrderData = {
  id: "ORD-2024-001234",
  customer: {
    id: "CUST-789123",
    name: "张明华",
    email: "zhang.minghua@email.com",
    phone: "+86 138-0013-5678"
  },
  shippingAddress: {
    street: "浦东新区世纪大道123号",
    city: "上海",
    state: "上海",
    zipCode: "200120",
    country: "中国"
  },
  items: [
    {
      id: "ITEM-001",
      sku: "ELEC-PHONE-001",
      name: "智能手机保护壳",
      quantity: 2,
      location: "A1-B3-C2",
      zone: "电子产品区",
      price: 35.99,
      weight: 0.15,
      dimensions: "15×8×1cm",
      category: "电子配件"
    },
    {
      id: "ITEM-002", 
      sku: "HOME-TOWEL-003",
      name: "纯棉毛巾套装",
      quantity: 1,
      location: "B2-A1-D4",
      zone: "家居用品区",
      price: 28.50,
      weight: 0.8,
      dimensions: "35×25×5cm",
      category: "家居纺织"
    },
    {
      id: "ITEM-003",
      sku: "BOOK-EDU-045",
      name: "英语学习词典",
      quantity: 1,
      location: "C3-B2-A1",
      zone: "图书区",
      price: 42.00,
      weight: 1.2,
      dimensions: "21×14×3cm",
      category: "教育图书"
    },
    {
      id: "ITEM-004",
      sku: "HEALTH-VIT-012",
      name: "维生素C片剂",
      quantity: 3,
      location: "D1-C4-B2",
      zone: "保健品区",
      price: 19.99,
      weight: 0.3,
      dimensions: "8×8×6cm",
      category: "营养保健"
    }
  ],
  priority: "high",
  status: "pending",
  orderDate: "2024-01-15T10:30:00Z",
  totalValue: 186.46,
  totalItems: 7,
  estimatedWeight: 2.45
};

// Cart types data
const cartTypes: CartType[] = [
  {
    id: "small",
    name: "小型推车",
    capacity: "最多20件商品",
    maxWeight: "15kg",
    dimensions: "60×40×90cm",
    suitable: true
  },
  {
    id: "medium", 
    name: "中型推车",
    capacity: "最多50件商品",
    maxWeight: "30kg",
    dimensions: "80×60×95cm",
    suitable: true
  },
  {
    id: "large",
    name: "大型推车",
    capacity: "最多100件商品", 
    maxWeight: "50kg",
    dimensions: "100×70×100cm",
    suitable: false
  }
];

// Default checklist items
const defaultChecklistItems: ChecklistItem[] = [
  {
    id: "cart-inspection",
    label: "推车结构检查",
    completed: false,
    description: "检查推车轮子、把手和载货区域"
  },
  {
    id: "label-attachment", 
    label: "订单标签粘贴",
    completed: false,
    description: "将订单号标签贴在推车显著位置"
  },
  {
    id: "scanner-setup",
    label: "扫描器设置",
    completed: false,
    description: "连接手持扫描器并测试功能"
  },
  {
    id: "route-planning",
    label: "拣货路线规划",
    completed: false,
    description: "确认最优拣货路径和区域顺序"
  }
];

export function OrderProcessingArea({ 
  orderData = sampleOrderData,
  onOrderPrinted,
  onCartPrepared,
  onComplete 
}: OrderProcessingAreaProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [selectedCartType, setSelectedCartType] = useState<string>("");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(defaultChecklistItems);
  const [isOrderPrinted, setIsOrderPrinted] = useState(false);
  const [isCartPrepared, setIsCartPrepared] = useState(false);

  // Calculate progress
  const totalSteps = 3; // Print, Cart Selection, Cart Preparation
  const progress = (currentStep / totalSteps) * 100;

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-500 text-white';
      case 'processing': return 'bg-yellow-500 text-black';
      case 'picked': return 'bg-green-500 text-white';
      case 'shipped': return 'bg-purple-500 text-white';
      case 'delivered': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Handle print confirmation
  const handlePrintConfirmation = useCallback(() => {
    const printData = {
      orderId: orderData.id,
      timestamp: new Date().toISOString(),
      items: orderData.items,
      pickingList: true
    };
    
    setIsOrderPrinted(true);
    setCurrentStep(1);
    setIsPrintDialogOpen(false);
    
    if (onOrderPrinted) {
      onOrderPrinted(orderData.id, printData);
    }
  }, [orderData, onOrderPrinted]);

  // Handle cart type selection
  const handleCartSelection = useCallback((cartId: string) => {
    setSelectedCartType(cartId);
    setCurrentStep(2);
  }, []);

  // Handle checklist item toggle
  const handleChecklistToggle = useCallback((itemId: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, completed: !item.completed }
          : item
      )
    );
  }, []);

  // Check if cart is prepared
  const isCartFullyPrepared = checklistItems.every(item => item.completed);

  // Handle cart preparation completion
  const handleCartPreparationComplete = useCallback(() => {
    if (isCartFullyPrepared && selectedCartType) {
      setIsCartPrepared(true);
      setCurrentStep(3);
      
      if (onCartPrepared) {
        onCartPrepared(orderData.id, selectedCartType);
      }
    }
  }, [isCartFullyPrepared, selectedCartType, orderData.id, onCartPrepared]);

  // Handle overall completion
  const handleOverallComplete = useCallback(() => {
    const completionData = {
      orderId: orderData.id,
      printedAt: new Date().toISOString(),
      cartType: selectedCartType,
      preparationCompleted: isCartFullyPrepared,
      totalItems: orderData.totalItems,
      estimatedTime: calculateEstimatedPickingTime()
    };
    
    if (onComplete) {
      onComplete(orderData.id, completionData);
    }
  }, [orderData, selectedCartType, isCartFullyPrepared, onComplete]);

  // Calculate estimated picking time
  const calculateEstimatedPickingTime = () => {
    const baseTime = 5; // 5 minutes base time
    const itemTime = orderData.items.length * 2; // 2 minutes per item
    const zoneTime = new Set(orderData.items.map(item => item.zone)).size * 3; // 3 minutes per zone
    return baseTime + itemTime + zoneTime;
  };

  // Auto-complete cart preparation when all items checked
  useEffect(() => {
    if (isCartFullyPrepared && selectedCartType && !isCartPrepared) {
      handleCartPreparationComplete();
    }
  }, [isCartFullyPrepared, selectedCartType, isCartPrepared, handleCartPreparationComplete]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6" data-testid="order-processing-area">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground" data-testid="processing-title">
          订单处理区域
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          处理新订单，打印拣货单，准备拣货推车，开始仓储拣货作业
        </p>
        
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>处理进度</span>
            <span>{currentStep} / {totalSteps} 步骤完成</span>
          </div>
          <Progress value={progress} className="h-2" data-testid="processing-progress" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center space-x-8">
          <div className={cn("flex items-center gap-2", isOrderPrinted ? "text-green-600" : "text-muted-foreground")}>
            {isOrderPrinted ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            <span className="text-sm font-medium">订单打印</span>
          </div>
          <div className={cn("flex items-center gap-2", selectedCartType ? "text-green-600" : "text-muted-foreground")}>
            {selectedCartType ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            <span className="text-sm font-medium">推车选择</span>
          </div>
          <div className={cn("flex items-center gap-2", isCartPrepared ? "text-green-600" : "text-muted-foreground")}>
            {isCartPrepared ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            <span className="text-sm font-medium">推车准备</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Display Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <Card data-testid="order-info-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-6 w-6" />
                  订单信息
                </CardTitle>
                <div className="flex gap-2">
                  <Badge className={cn("px-3 py-1", getPriorityColor(orderData.priority))} data-testid={`priority-${orderData.priority}`}>
                    {orderData.priority === 'urgent' ? '紧急' : 
                     orderData.priority === 'high' ? '高优先级' :
                     orderData.priority === 'medium' ? '中等优先级' : '低优先级'}
                  </Badge>
                  <Badge className={cn("px-3 py-1", getStatusColor(orderData.status))} data-testid={`status-${orderData.status}`}>
                    {orderData.status === 'pending' ? '待处理' :
                     orderData.status === 'processing' ? '处理中' :
                     orderData.status === 'picked' ? '已拣货' :
                     orderData.status === 'shipped' ? '已发货' : '已送达'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">订单号:</span>
                    <span data-testid="order-id">{orderData.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">订单日期:</span>
                    <span>{new Date(orderData.orderDate).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">商品总数:</span>
                    <span data-testid="total-items">{orderData.totalItems} 件</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">订单总额:</span>
                    <span className="font-bold text-green-600" data-testid="total-value">¥{orderData.totalValue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">预估重量:</span>
                    <span>{orderData.estimatedWeight} kg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">预估拣货时间:</span>
                    <span>{calculateEstimatedPickingTime()} 分钟</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card data-testid="customer-info-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-6 w-6" />
                客户信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">客户姓名:</span>
                    <span data-testid="customer-name">{orderData.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">邮箱地址:</span>
                    <span>{orderData.customer.email}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">联系电话:</span>
                    <span>{orderData.customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">配送地址:</span>
                    <span data-testid="shipping-address">
                      {orderData.shippingAddress.street}, {orderData.shippingAddress.city}, {orderData.shippingAddress.zipCode}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card data-testid="order-items-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                商品清单
              </CardTitle>
              <CardDescription>
                总共 {orderData.items.length} 种商品，{orderData.totalItems} 件
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderData.items.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg" data-testid={`item-${item.id}`}>
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1 grid gap-2 md:grid-cols-2">
                      <div className="space-y-1">
                        <div className="font-medium" data-testid={`item-name-${item.id}`}>{item.name}</div>
                        <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>数量: <span className="font-medium text-foreground">{item.quantity}</span></span>
                          <span>单价: <span className="font-medium text-foreground">¥{item.price}</span></span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            <span className="font-medium" data-testid={`item-location-${item.id}`}>{item.location}</span>
                            <span className="text-muted-foreground"> ({item.zone})</span>
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          分类: {item.category} | 尺寸: {item.dimensions}
                        </div>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processing Actions */}
        <div className="space-y-6">
          {/* Order Printing */}
          <Card data-testid="print-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-6 w-6" />
                订单打印
              </CardTitle>
              <CardDescription>
                打印拣货单和订单标签
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isOrderPrinted ? (
                <>
                  <Button 
                    onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                    variant="outline" 
                    className="w-full"
                    data-testid="button-preview-order"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    预览拣货单
                  </Button>
                  
                  {isPreviewVisible && (
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900" data-testid="picking-list-preview">
                      <div className="text-center space-y-2 mb-4">
                        <div className="font-bold">拣货单</div>
                        <div className="text-sm text-muted-foreground">订单号: {orderData.id}</div>
                        <div className="flex justify-center">
                          <QrCode className="h-16 w-16" data-testid="barcode-simulation" />
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>客户: {orderData.customer.name}</div>
                        <div>总计: {orderData.totalItems} 件商品</div>
                        <div className="border-t pt-2 mt-2">
                          {orderData.items.map(item => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.name} x{item.quantity}</span>
                              <span>{item.location}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => setIsPrintDialogOpen(true)}
                    className="w-full"
                    data-testid="button-print-order"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    打印拣货单
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <div className="font-medium text-green-600">拣货单已打印</div>
                  <div className="text-sm text-muted-foreground">请前往打印机取单</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart Selection */}
          <Card data-testid="cart-selection-section" className={cn(currentStep < 1 && "opacity-50")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                推车选择
              </CardTitle>
              <CardDescription>
                根据订单大小选择合适的拣货推车
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentStep >= 1 ? (
                !selectedCartType ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      建议推车类型（基于 {orderData.totalItems} 件商品，{orderData.estimatedWeight}kg）:
                    </div>
                    <Select onValueChange={handleCartSelection} data-testid="cart-type-select">
                      <SelectTrigger>
                        <SelectValue placeholder="选择推车类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {cartTypes.map(cart => (
                          <SelectItem key={cart.id} value={cart.id} disabled={!cart.suitable}>
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{cart.name}</div>
                                <div className="text-xs text-muted-foreground">{cart.capacity}</div>
                              </div>
                              {cart.suitable && <Badge variant="outline" className="ml-2 text-xs">推荐</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <div className="font-medium text-green-600">
                      已选择: {cartTypes.find(c => c.id === selectedCartType)?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {cartTypes.find(c => c.id === selectedCartType)?.capacity}
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-sm">请先完成订单打印</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart Preparation */}
          <Card data-testid="cart-preparation-section" className={cn(currentStep < 2 && "opacity-50")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-6 w-6" />
                推车准备
              </CardTitle>
              <CardDescription>
                完成拣货推车的准备检查清单
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentStep >= 2 ? (
                !isCartPrepared ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {checklistItems.map(item => (
                        <div 
                          key={item.id} 
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                          onClick={() => handleChecklistToggle(item.id)}
                          data-testid={`checklist-${item.id}`}
                        >
                          <Checkbox
                            checked={item.completed}
                            onChange={() => handleChecklistToggle(item.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <div className={cn("font-medium", item.completed && "line-through text-muted-foreground")}>
                              {item.label}
                            </div>
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          </div>
                          {item.completed && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>准备进度</span>
                        <span>{checklistItems.filter(item => item.completed).length} / {checklistItems.length}</span>
                      </div>
                      <Progress 
                        value={(checklistItems.filter(item => item.completed).length / checklistItems.length) * 100} 
                        className="h-2" 
                      />
                    </div>

                    {isCartFullyPrepared && (
                      <Button 
                        onClick={handleCartPreparationComplete}
                        className="w-full"
                        data-testid="button-complete-preparation"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        完成推车准备
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <div className="font-medium text-green-600">推车准备完成</div>
                    <div className="text-sm text-muted-foreground">可以开始拣货作业</div>
                  </div>
                )
              ) : (
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-sm">请先完成推车选择</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Complete Processing */}
          {isOrderPrinted && selectedCartType && isCartPrepared && (
            <Card data-testid="completion-section">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <div>
                    <div className="font-bold text-green-600 text-lg">订单处理完成</div>
                    <div className="text-sm text-muted-foreground">所有准备工作已就绪，可以开始拣货</div>
                  </div>
                  <Button 
                    onClick={handleOverallComplete}
                    size="lg"
                    className="w-full"
                    data-testid="button-start-picking"
                  >
                    开始拣货作业
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Print Confirmation Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent data-testid="print-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-6 w-6" />
              打印确认
            </DialogTitle>
            <DialogDescription>
              确认打印订单 {orderData.id} 的拣货单？
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="text-sm space-y-2">
                <div>打印内容: 拣货单 + 订单标签</div>
                <div>商品数量: {orderData.totalItems} 件</div>
                <div>拣货路线: {new Set(orderData.items.map(item => item.zone)).size} 个区域</div>
                <div>预估时间: {calculateEstimatedPickingTime()} 分钟</div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <QrCode className="h-24 w-24 text-muted-foreground" data-testid="print-preview-barcode" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)} data-testid="button-cancel-print">
              取消
            </Button>
            <Button onClick={handlePrintConfirmation} data-testid="button-confirm-print">
              <Printer className="h-4 w-4 mr-2" />
              确认打印
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}