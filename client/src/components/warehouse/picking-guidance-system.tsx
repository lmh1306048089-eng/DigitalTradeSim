import { useState, useCallback, useEffect, useMemo } from "react";
import { 
  Navigation, 
  Scan, 
  Package, 
  CheckCircle, 
  Circle, 
  MapPin,
  Clock,
  Target,
  ArrowRight,
  AlertTriangle,
  CheckSquare,
  X,
  Camera,
  Zap,
  Route,
  Eye,
  Volume2,
  SkipForward,
  ShoppingCart,
  Hash,
  Ruler,
  Weight,
  Info,
  Navigation2,
  Compass
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Type definitions for picking guidance system
interface PickingLocation {
  zone: string;
  aisle: string;
  shelf: string;
  position: string;
  code: string; // A1-B3-C2 format
  coordinates: { x: number; y: number };
  description: string;
  accessible: boolean;
}

interface OrderItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  quantityPicked: number;
  location: PickingLocation;
  visualCues: {
    size: string;
    color: string;
    packaging: string;
    weight: string;
    dimensions: string;
  };
  safetyNotes?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  price: number;
  barcode: string;
  picked: boolean;
  scanned: boolean;
  confirmed: boolean;
  skipped: boolean;
  issues?: string[];
}

interface RouteStep {
  stepNumber: number;
  fromLocation: string;
  toLocation: string;
  direction: string;
  distance: number; // meters
  estimatedTime: number; // seconds
  instruction: string;
  landmarks?: string[];
}

interface PickingRoute {
  id: string;
  totalDistance: number;
  totalTime: number;
  steps: RouteStep[];
  optimized: boolean;
  currentStep: number;
}

interface ScanResult {
  success: boolean;
  scannedSku: string;
  expectedSku: string;
  timestamp: Date;
  errorMessage?: string;
  confidence: number;
}

interface PickingProgress {
  totalItems: number;
  pickedItems: number;
  scannedItems: number;
  skippedItems: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
  efficiency: number; // percentage
}

interface CartSummary {
  items: OrderItem[];
  totalWeight: number;
  totalVolume: number;
  capacity: {
    weight: number;
    volume: number;
  };
}

interface PickingGuidanceSystemProps {
  orderItems: OrderItem[];
  onItemPicked?: (itemId: string, quantity: number) => void;
  onLocationReached?: (locationCode: string, timestamp: Date) => void;
  onComplete?: (completionData: {
    orderId: string;
    pickedItems: OrderItem[];
    totalTime: number;
    efficiency: number;
  }) => void;
  onItemScanned?: (scanResult: ScanResult) => void;
  onItemSkipped?: (itemId: string, reason: string) => void;
  currentLocation?: string;
  orderId?: string;
}

// Sample data for demonstration
const sampleOrderItems: OrderItem[] = [
  {
    id: "ITEM-001",
    sku: "ELEC-PHONE-001",
    name: "智能手机保护壳",
    description: "适用于iPhone 15的透明保护壳，TPU材质",
    quantity: 2,
    quantityPicked: 0,
    location: {
      zone: "A区",
      aisle: "1通道",
      shelf: "B3层",
      position: "C2位",
      code: "A1-B3-C2",
      coordinates: { x: 20, y: 30 },
      description: "电子产品区域，中层货架",
      accessible: true
    },
    visualCues: {
      size: "小型",
      color: "透明包装",
      packaging: "塑料盒装",
      weight: "0.15kg",
      dimensions: "15×8×1cm"
    },
    safetyNotes: ["注意包装易碎", "轻拿轻放"],
    priority: "high",
    category: "电子配件",
    price: 35.99,
    barcode: "1234567890123",
    picked: false,
    scanned: false,
    confirmed: false,
    skipped: false
  },
  {
    id: "ITEM-002",
    sku: "HOME-TOWEL-003",
    name: "纯棉毛巾套装",
    description: "100%纯棉毛巾，3件套装（大中小）",
    quantity: 1,
    quantityPicked: 0,
    location: {
      zone: "B区",
      aisle: "2通道",
      shelf: "A1层",
      position: "D4位",
      code: "B2-A1-D4",
      coordinates: { x: 45, y: 15 },
      description: "家居用品区域，底层货架",
      accessible: true
    },
    visualCues: {
      size: "中型",
      color: "白色包装",
      packaging: "塑料袋装",
      weight: "0.8kg",
      dimensions: "35×25×5cm"
    },
    priority: "medium",
    category: "家居纺织",
    price: 28.50,
    barcode: "2345678901234",
    picked: false,
    scanned: false,
    confirmed: false,
    skipped: false
  },
  {
    id: "ITEM-003",
    sku: "BOOK-EDU-045",
    name: "英语学习词典",
    description: "牛津英语学习词典（第9版），硬皮装订",
    quantity: 1,
    quantityPicked: 0,
    location: {
      zone: "C区",
      aisle: "3通道",
      shelf: "B2层",
      position: "A1位",
      code: "C3-B2-A1",
      coordinates: { x: 70, y: 45 },
      description: "图书区域，中层货架",
      accessible: true
    },
    visualCues: {
      size: "中型",
      color: "蓝色封面",
      packaging: "硬皮书籍",
      weight: "1.2kg",
      dimensions: "21×14×3cm"
    },
    safetyNotes: ["注意重量，小心提取"],
    priority: "low",
    category: "教育图书",
    price: 42.00,
    barcode: "3456789012345",
    picked: false,
    scanned: false,
    confirmed: false,
    skipped: false
  },
  {
    id: "ITEM-004",
    sku: "HEALTH-VIT-012",
    name: "维生素C片剂",
    description: "维生素C咀嚼片，橙味，100片装",
    quantity: 3,
    quantityPicked: 0,
    location: {
      zone: "D区",
      aisle: "1通道",
      shelf: "C4层",
      position: "B2位",
      code: "D1-C4-B2",
      coordinates: { x: 25, y: 70 },
      description: "保健品区域，高层货架",
      accessible: true
    },
    visualCues: {
      size: "小型",
      color: "橙色标签",
      packaging: "塑料瓶装",
      weight: "0.3kg",
      dimensions: "8×8×6cm"
    },
    safetyNotes: ["注意保质期", "避免高温"],
    priority: "urgent",
    category: "营养保健",
    price: 19.99,
    barcode: "4567890123456",
    picked: false,
    scanned: false,
    confirmed: false,
    skipped: false
  }
];

export function PickingGuidanceSystem({
  orderItems = sampleOrderItems,
  onItemPicked,
  onLocationReached,
  onComplete,
  onItemScanned,
  onItemSkipped,
  currentLocation = "入口处",
  orderId = "ORD-2024-001234"
}: PickingGuidanceSystemProps) {
  const [items, setItems] = useState<OrderItem[]>(orderItems);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [scanningMode, setScanningMode] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isNavigating, setIsNavigating] = useState(false);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [pickingRoute, setPickingRoute] = useState<PickingRoute | null>(null);

  // Setup timer for real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sync items when orderItems prop changes and reset session state
  useEffect(() => {
    setItems(orderItems);
    // Reset all session-specific state for a clean restart
    setCurrentItemIndex(0); // Start from first item
    const newStartTime = Date.now();
    setStartTime(newStartTime); // Restart session timer
    setCurrentTime(newStartTime); // Sync current time with new start time
    setScanResult(null); // Clear any previous scan state
    setScanningMode(false); // Reset scanning interface
    setIsNavigating(false); // Reset navigation state
    setShowLocationDetails(false); // Reset location details state
  }, [orderItems]);

  // Get current item
  const currentItem = items[currentItemIndex];
  const hasCurrentItem = currentItem && !currentItem.picked && !currentItem.skipped;

  // Calculate progress with real-time updates
  const progress = useMemo((): PickingProgress => {
    const totalItems = items.length;
    const pickedItems = items.filter(item => item.picked).length;
    const scannedItems = items.filter(item => item.scanned).length;
    const skippedItems = items.filter(item => item.skipped).length;
    const timeElapsed = Math.floor((currentTime - startTime) / 1000);
    
    const avgTimePerItem = totalItems > 0 ? timeElapsed / Math.max(pickedItems + skippedItems, 1) : 0;
    const remainingItems = totalItems - pickedItems - skippedItems;
    const estimatedTimeRemaining = Math.floor(avgTimePerItem * remainingItems);
    
    const efficiency = totalItems > 0 ? Math.floor((pickedItems / totalItems) * 100) : 0;

    return {
      totalItems,
      pickedItems,
      scannedItems,
      skippedItems,
      timeElapsed,
      estimatedTimeRemaining,
      efficiency
    };
  }, [items, startTime, currentTime]);

  // Calculate cart summary
  const cartSummary = useMemo((): CartSummary => {
    const pickedItems = items.filter(item => item.picked);
    const totalWeight = pickedItems.reduce((sum, item) => {
      const weight = parseFloat(item.visualCues.weight.replace('kg', ''));
      return sum + (weight * item.quantityPicked);
    }, 0);

    return {
      items: pickedItems,
      totalWeight: Math.round(totalWeight * 100) / 100,
      totalVolume: pickedItems.length * 0.1, // Simplified volume calculation
      capacity: {
        weight: 30, // 30kg capacity
        volume: 100 // 100L capacity
      }
    };
  }, [items]);

  // Generate optimized picking route
  const generateRoute = useCallback((): PickingRoute => {
    const unpickedItems = items.filter(item => !item.picked && !item.skipped);
    const steps: RouteStep[] = [];
    let currentPos = { x: 0, y: 0 }; // Starting position
    let totalDistance = 0;
    let totalTime = 0;

    unpickedItems.forEach((item, index) => {
      const distance = Math.sqrt(
        Math.pow(item.location.coordinates.x - currentPos.x, 2) +
        Math.pow(item.location.coordinates.y - currentPos.y, 2)
      );
      const time = Math.ceil(distance * 2 + 30); // 2 sec per unit + 30 sec picking time

      steps.push({
        stepNumber: index + 1,
        fromLocation: index === 0 ? currentLocation : unpickedItems[index - 1].location.code,
        toLocation: item.location.code,
        direction: item.location.coordinates.x > currentPos.x ? "向右" : "向左",
        distance: Math.round(distance),
        estimatedTime: time,
        instruction: `前往 ${item.location.zone} ${item.location.aisle}，取 ${item.name}`,
        landmarks: [`${item.location.zone}入口`, `${item.location.aisle}标识`]
      });

      totalDistance += distance;
      totalTime += time;
      currentPos = item.location.coordinates;
    });

    return {
      id: `route-${Date.now()}`,
      totalDistance: Math.round(totalDistance),
      totalTime,
      steps,
      optimized: true,
      currentStep: 0
    };
  }, [items, currentLocation]);

  // Initialize route
  useEffect(() => {
    setPickingRoute(generateRoute());
  }, [generateRoute]);

  // Handle navigation to location
  const handleNavigateToLocation = useCallback((locationCode: string) => {
    setIsNavigating(true);
    setShowLocationDetails(true);
    
    if (onLocationReached) {
      onLocationReached(locationCode, new Date());
    }

    // Simulate navigation time
    setTimeout(() => {
      setIsNavigating(false);
    }, 2000);
  }, [onLocationReached]);

  // Handle barcode scan
  const handleScanItem = useCallback((expectedSku: string) => {
    setScanningMode(true);

    // Simulate scanning delay
    setTimeout(() => {
      // Simulate random scan results (90% success rate)
      const success = Math.random() > 0.1;
      const confidence = success ? 0.95 + Math.random() * 0.05 : 0.3 + Math.random() * 0.4;
      
      const result: ScanResult = {
        success,
        scannedSku: success ? expectedSku : `WRONG-${Math.random().toString().slice(2, 8)}`,
        expectedSku,
        timestamp: new Date(),
        confidence,
        errorMessage: success ? undefined : "扫描的商品与订单不匹配"
      };

      setScanResult(result);
      setScanningMode(false);

      if (onItemScanned) {
        onItemScanned(result);
      }

      // Update item scan status
      if (success) {
        setItems(prev => prev.map(item => 
          item.sku === expectedSku ? { ...item, scanned: true } : item
        ));
      }
    }, 1500);
  }, [onItemScanned]);

  // Handle item pick confirmation
  const handleConfirmPick = useCallback((itemId: string, quantity: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, picked: true, quantityPicked: quantity, confirmed: true }
        : item
    ));

    if (onItemPicked) {
      onItemPicked(itemId, quantity);
    }

    // Move to next item
    const nextIndex = items.findIndex((item, index) => 
      index > currentItemIndex && !item.picked && !item.skipped
    );
    
    if (nextIndex !== -1) {
      setCurrentItemIndex(nextIndex);
    } else {
      // All items completed
      handleComplete();
    }
    
    setScanResult(null);
  }, [items, currentItemIndex, onItemPicked]);

  // Handle skip item
  const handleSkipItem = useCallback((itemId: string, reason: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, skipped: true, issues: [...(item.issues || []), reason] }
        : item
    ));

    if (onItemSkipped) {
      onItemSkipped(itemId, reason);
    }

    // Move to next item
    const nextIndex = items.findIndex((item, index) => 
      index > currentItemIndex && !item.picked && !item.skipped
    );
    
    if (nextIndex !== -1) {
      setCurrentItemIndex(nextIndex);
    } else {
      handleComplete();
    }
  }, [items, currentItemIndex, onItemSkipped]);

  // Handle completion
  const handleComplete = useCallback(() => {
    if (onComplete) {
      const pickedItems = items.filter(item => item.picked);
      const totalTime = Math.floor((Date.now() - startTime) / 1000);
      
      onComplete({
        orderId,
        pickedItems,
        totalTime,
        efficiency: progress.efficiency
      });
    }
  }, [items, startTime, orderId, progress.efficiency, onComplete]);

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

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-4" data-testid="picking-guidance-system">
      {/* Header with Progress */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="picking-title">
          仓储拣货指导系统
        </h1>
        <p className="text-muted-foreground">
          订单 {orderId} - 智能拣货路线指导
        </p>
        
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>拣货进度</span>
            <span>{progress.pickedItems} / {progress.totalItems} 完成</span>
          </div>
          <Progress 
            value={(progress.pickedItems / progress.totalItems) * 100} 
            className="h-3" 
            data-testid="picking-progress" 
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>用时: {formatTime(progress.timeElapsed)}</span>
            <span>效率: {progress.efficiency}%</span>
            <span>预计剩余: {formatTime(progress.estimatedTimeRemaining)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Location Navigation Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Warehouse Map */}
          <Card data-testid="warehouse-map-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                仓库导航
              </CardTitle>
              <CardDescription>
                当前位置: {currentLocation} | 下一目标: {hasCurrentItem ? currentItem.location.code : "已完成"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simplified Warehouse Layout */}
              <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-64 overflow-hidden">
                {/* Grid lines */}
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 gap-1 opacity-20">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className="border border-gray-400" />
                  ))}
                </div>
                
                {/* Location markers */}
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      "absolute w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      item.picked ? "bg-green-500 text-white" :
                      item.skipped ? "bg-gray-400 text-white" :
                      index === currentItemIndex ? "bg-blue-500 text-white animate-pulse" :
                      "bg-orange-500 text-white"
                    )}
                    style={{
                      left: `${item.location.coordinates.x}%`,
                      top: `${item.location.coordinates.y}%`
                    }}
                    data-testid={`location-marker-${item.id}`}
                  >
                    {index + 1}
                  </div>
                ))}
                
                {/* Route path visualization */}
                {pickingRoute && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {pickingRoute.steps.map((step, index) => {
                      if (index === 0) return null;
                      const prevStep = pickingRoute.steps[index - 1];
                      const currentItem = items.find(item => item.location.code === step.toLocation);
                      const prevItem = items.find(item => item.location.code === prevStep.toLocation);
                      
                      if (!currentItem || !prevItem) return null;
                      
                      return (
                        <line
                          key={`route-${index}`}
                          x1={`${prevItem.location.coordinates.x}%`}
                          y1={`${prevItem.location.coordinates.y}%`}
                          x2={`${currentItem.location.coordinates.x}%`}
                          y2={`${currentItem.location.coordinates.y}%`}
                          stroke="rgb(59, 130, 246)"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          className="opacity-60"
                        />
                      );
                    })}
                  </svg>
                )}
                
                {/* Zone labels */}
                <div className="absolute top-2 left-2 text-xs font-medium">A区</div>
                <div className="absolute top-2 right-2 text-xs font-medium">B区</div>
                <div className="absolute bottom-2 left-2 text-xs font-medium">C区</div>
                <div className="absolute bottom-2 right-2 text-xs font-medium">D区</div>
              </div>
              
              {/* Route Instructions */}
              {pickingRoute && hasCurrentItem && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Route className="h-4 w-4" />
                    拣货路线 ({pickingRoute.totalDistance}米, 预计{Math.ceil(pickingRoute.totalTime / 60)}分钟)
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Navigation2 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">下一步:</span>
                      前往 <Badge variant="outline">{currentItem.location.code}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {currentItem.location.zone} → {currentItem.location.aisle} → {currentItem.location.shelf}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Item Picking Instructions */}
          {hasCurrentItem && (
            <Card data-testid="picking-instructions-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    当前拣货任务
                  </CardTitle>
                  <Badge 
                    className={cn("px-3 py-1", getPriorityColor(currentItem.priority))}
                    data-testid={`priority-${currentItem.priority}`}
                  >
                    {currentItem.priority === 'urgent' ? '紧急' : 
                     currentItem.priority === 'high' ? '高优先级' :
                     currentItem.priority === 'medium' ? '中等优先级' : '低优先级'}
                  </Badge>
                </div>
                <CardDescription>
                  第 {currentItemIndex + 1} 项，共 {items.length} 项
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Item Details */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-lg" data-testid={`item-name-${currentItem.id}`}>
                        {currentItem.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {currentItem.sku}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {currentItem.description}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        数量: <span className="font-medium">{currentItem.quantity}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Weight className="h-4 w-4" />
                        重量: {currentItem.visualCues.weight}
                      </div>
                      <div className="flex items-center gap-1">
                        <Ruler className="h-4 w-4" />
                        尺寸: {currentItem.visualCues.dimensions}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        包装: {currentItem.visualCues.packaging}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Location Details */}
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                      <div className="flex items-center gap-2 font-medium text-sm mb-2">
                        <MapPin className="h-4 w-4" />
                        位置信息
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>位置码: <span className="font-mono font-bold">{currentItem.location.code}</span></div>
                        <div>区域: {currentItem.location.zone}</div>
                        <div>通道: {currentItem.location.aisle}</div>
                        <div>货架: {currentItem.location.shelf}</div>
                        <div>位置: {currentItem.location.position}</div>
                      </div>
                    </div>
                    
                    {/* Visual Cues */}
                    <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
                      <div className="flex items-center gap-2 font-medium text-sm mb-2">
                        <Eye className="h-4 w-4" />
                        识别特征
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>规格: {currentItem.visualCues.size}</div>
                        <div>颜色: {currentItem.visualCues.color}</div>
                        <div>包装: {currentItem.visualCues.packaging}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Safety Notes */}
                {currentItem.safetyNotes && currentItem.safetyNotes.length > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                    <div className="flex items-center gap-2 font-medium text-sm mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      安全提醒
                    </div>
                    <ul className="text-sm space-y-1">
                      {currentItem.safetyNotes.map((note, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Circle className="h-2 w-2 mt-2 flex-shrink-0" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleNavigateToLocation(currentItem.location.code)}
                    variant="outline"
                    className="flex-1"
                    disabled={isNavigating}
                    data-testid="button-navigate"
                  >
                    {isNavigating ? (
                      <>
                        <Compass className="h-4 w-4 mr-2 animate-spin" />
                        导航中...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4 mr-2" />
                        导航到位置
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleScanItem(currentItem.sku)}
                    disabled={scanningMode || currentItem.scanned}
                    className="flex-1"
                    data-testid="button-scan"
                  >
                    {scanningMode ? (
                      <>
                        <Camera className="h-4 w-4 mr-2 animate-pulse" />
                        扫描中...
                      </>
                    ) : currentItem.scanned ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        已扫描
                      </>
                    ) : (
                      <>
                        <Scan className="h-4 w-4 mr-2" />
                        扫描商品
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Progress and Control Panel */}
        <div className="space-y-4">
          {/* Scanning Interface */}
          <Card data-testid="scanning-interface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                条码扫描
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scanningMode && (
                <div className="text-center space-y-3">
                  <div className="relative">
                    <Camera className="h-16 w-16 mx-auto text-blue-500 animate-pulse" />
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg animate-ping opacity-75" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    正在扫描条码...
                  </div>
                </div>
              )}
              
              {scanResult && (
                <div className={cn(
                  "p-4 rounded-lg border-l-4 space-y-2",
                  scanResult.success 
                    ? "bg-green-50 dark:bg-green-950 border-green-500" 
                    : "bg-red-50 dark:bg-red-950 border-red-500"
                )}>
                  <div className="flex items-center gap-2">
                    {scanResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {scanResult.success ? "扫描成功" : "扫描失败"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div>扫描结果: {scanResult.scannedSku}</div>
                    <div>期望SKU: {scanResult.expectedSku}</div>
                    <div>置信度: {Math.round(scanResult.confidence * 100)}%</div>
                    {scanResult.errorMessage && (
                      <div className="text-red-600 mt-1">{scanResult.errorMessage}</div>
                    )}
                  </div>
                  
                  {scanResult.success && hasCurrentItem && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleConfirmPick(currentItem.id, currentItem.quantity)}
                        data-testid="button-confirm-pick"
                      >
                        <CheckSquare className="h-4 w-4 mr-1" />
                        确认拣货
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setScanResult(null)}
                        data-testid="button-rescan"
                      >
                        重新扫描
                      </Button>
                    </div>
                  )}
                  
                  {!scanResult.success && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setScanResult(null)}
                        data-testid="button-retry-scan"
                      >
                        重试扫描
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => hasCurrentItem && handleSkipItem(currentItem.id, "扫描失败")}
                        data-testid="button-skip-item"
                      >
                        <SkipForward className="h-4 w-4 mr-1" />
                        跳过商品
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Tracking */}
          <Card data-testid="progress-tracking">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                拣货清单
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-colors",
                      index === currentItemIndex && !item.picked && !item.skipped && "bg-blue-50 dark:bg-blue-950",
                      item.picked && "bg-green-50 dark:bg-green-950",
                      item.skipped && "bg-gray-50 dark:bg-gray-950"
                    )}
                    data-testid={`checklist-item-${item.id}`}
                  >
                    <Checkbox 
                      checked={item.picked} 
                      disabled 
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-sm font-medium truncate",
                        item.picked && "line-through text-muted-foreground"
                      )}>
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.location.code} • 数量: {item.quantity}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {item.picked ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : item.skipped ? (
                        <X className="h-4 w-4 text-gray-400" />
                      ) : index === currentItemIndex ? (
                        <Circle className="h-4 w-4 text-blue-500 animate-pulse" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cart Summary */}
          <Card data-testid="cart-summary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                购物车概览
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>已拣商品:</span>
                  <span className="font-medium">{cartSummary.items.length} 件</span>
                </div>
                <div className="flex justify-between">
                  <span>总重量:</span>
                  <span className="font-medium">{cartSummary.totalWeight} kg</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>载重:</span>
                    <span className="text-xs">
                      {cartSummary.totalWeight}/{cartSummary.capacity.weight} kg
                    </span>
                  </div>
                  <Progress 
                    value={(cartSummary.totalWeight / cartSummary.capacity.weight) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
              
              {/* Time and Efficiency Stats */}
              <div className="pt-3 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>已用时间:</span>
                  <span className="font-medium">{formatTime(progress.timeElapsed)}</span>
                </div>
                <div className="flex justify-between">
                  <span>拣货效率:</span>
                  <span className={cn(
                    "font-medium",
                    progress.efficiency >= 80 ? "text-green-600" :
                    progress.efficiency >= 60 ? "text-yellow-600" :
                    "text-red-600"
                  )}>
                    {progress.efficiency}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complete Order Button */}
          {progress.pickedItems + progress.skippedItems === progress.totalItems && (
            <Button 
              onClick={handleComplete}
              className="w-full"
              size="lg"
              data-testid="button-complete-order"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              完成订单拣货
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}