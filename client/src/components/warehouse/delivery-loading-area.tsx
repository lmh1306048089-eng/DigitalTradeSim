import { useState, useCallback, useEffect, useMemo } from "react";
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Circle, 
  Route,
  MapPin,
  Clock,
  Scale,
  Ruler,
  AlertTriangle,
  Shield,
  Wind,
  CloudRain,
  Sun,
  Navigation,
  QrCode,
  Clipboard,
  CheckSquare,
  User,
  FileText,
  Eye,
  RefreshCw,
  Zap,
  Calendar,
  Hash,
  Weight,
  Box,
  ArrowRight,
  Settings,
  Info,
  Star,
  Target,
  Plus,
  Minus,
  RotateCcw,
  Camera,
  Signature,
  X,
  DollarSign,
  Lightbulb,
  ShieldCheck,
  Car,
  Bike
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ============ TYPE DEFINITIONS ============

interface PackagedItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  weight: number;
  priority: 'express' | 'standard' | 'economy';
  fragilityLevel: 'low' | 'medium' | 'high' | 'fragile';
  category: 'standard' | 'fragile' | 'hazardous' | 'temperature-sensitive' | 'oversized';
  specialHandling: string[];
  deliveryRoute: string;
  carrier: string;
  destination: {
    address: string;
    city: string;
    zipCode: string;
    country: string;
  };
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  trackingNumber?: string;
  estimatedDeliveryTime?: string;
  value: number;
  isLoaded: boolean;
  loadedAt?: Date;
  vehicleId?: string;
  position?: {
    x: number;
    y: number;
    z: number;
  };
}

interface LoadingDock {
  id: string;
  dockNumber: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  currentVehicle?: string;
  vehicleType?: string;
  loadingProgress: number; // 0-100
  capacity: {
    maxWeight: number;
    maxVolume: number;
    currentWeight: number;
    currentVolume: number;
  };
  equipment: {
    forklift: boolean;
    loadingPlatform: boolean;
    scales: boolean;
    scanner: boolean;
  };
  assignedRoutes: string[];
  estimatedCompletionTime?: Date;
  safety: {
    emergencyStop: boolean;
    loadingLights: boolean;
    clearance: boolean;
  };
}

interface VehicleType {
  id: string;
  name: string;
  type: 'delivery_van' | 'truck' | 'cargo_bike' | 'express_courier';
  capacity: {
    maxWeight: number;
    maxVolume: number;
    maxPackages: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
  features: string[];
  suitableFor: string[];
  icon: string;
  loadingTime: number; // minutes
  restrictions: string[];
  fuelType: 'electric' | 'diesel' | 'gasoline' | 'hybrid';
  emissions: number; // CO2 kg per 100km
  costPerKm: number;
  zones: string[]; // delivery zones this vehicle can access
}

interface DeliveryRoute {
  id: string;
  routeCode: string;
  routeName: string;
  carrier: string;
  estimatedDeparture: Date;
  estimatedDuration: number; // minutes
  stops: number;
  totalDistance: number; // km
  packages: string[]; // package IDs
  totalWeight: number;
  totalVolume: number;
  vehicleType: string;
  dockAssignment?: string;
  driver?: {
    name: string;
    license: string;
    phone: string;
    experience: number; // years
  };
  status: 'preparing' | 'loading' | 'ready' | 'departed' | 'in_transit' | 'delivered';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  specialRequirements: string[];
}

interface WeatherCondition {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'windy';
  temperature: number; // Celsius
  humidity: number; // percentage
  windSpeed: number; // km/h
  visibility: number; // km
  precipitation: number; // mm
  advisory: string[];
  impactLevel: 'none' | 'low' | 'medium' | 'high' | 'severe';
}

interface LoadingManifest {
  id: string;
  routeId: string;
  vehicleId: string;
  dockId: string;
  packages: PackagedItem[];
  totalWeight: number;
  totalVolume: number;
  totalValue: number;
  loadingSequence: string[];
  securityChecks: {
    id: string;
    name: string;
    description: string;
    completed: boolean;
    completedBy?: string;
    timestamp?: Date;
  }[];
  driverSignature?: {
    signed: boolean;
    timestamp?: Date;
    driverName?: string;
  };
  qualityChecks: {
    cargoSecured: boolean;
    manifestSigned: boolean;
    vehicleInspected: boolean;
    gpsTracking: boolean;
    routeConfirmed: boolean;
  };
  createdAt: Date;
  completedAt?: Date;
}

interface LoadingStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  instructions: string[];
  safetyNotes: string[];
  estimatedTime: number; // seconds
  completed: boolean;
  tips: string[];
  bestPractices: string[];
  commonMistakes: string[];
}

interface DeliveryLoadingAreaProps {
  packagedItems: PackagedItem[];
  availableVehicles: VehicleType[];
  onPackageLoaded?: (packageId: string, vehicleId: string, position: { x: number; y: number; z: number }) => void;
  onLoadingComplete?: (manifestId: string, manifest: LoadingManifest) => void;
  onVehicleDispatched?: (vehicleId: string, routeId: string, packages: string[]) => void;
}

// ============ SAMPLE DATA ============

const samplePackagedItems: PackagedItem[] = [
  {
    id: "PKG-001",
    sku: "ELEC-PHONE-001",
    name: "智能手机保护壳套装",
    description: "适用于iPhone 15的透明保护壳，包装完整",
    quantity: 2,
    dimensions: { length: 20, width: 15, height: 8, unit: "cm" },
    weight: 0.8,
    priority: "express",
    fragilityLevel: "medium",
    category: "standard",
    specialHandling: ["轻拿轻放", "避免重压"],
    deliveryRoute: "RT-001",
    carrier: "顺丰快递",
    destination: {
      address: "浦东新区世纪大道123号",
      city: "上海",
      zipCode: "200120",
      country: "中国"
    },
    customerInfo: {
      name: "张明华",
      phone: "+86 138-0013-5678",
      email: "zhang.minghua@email.com"
    },
    trackingNumber: "SF1234567890123",
    estimatedDeliveryTime: "今日 14:00-16:00",
    value: 71.98,
    isLoaded: false
  },
  {
    id: "PKG-002",
    sku: "HOME-GLASS-003",
    name: "水晶装饰摆件",
    description: "纯手工制作水晶摆件，易碎品包装",
    quantity: 1,
    dimensions: { length: 25, width: 20, height: 22, unit: "cm" },
    weight: 1.2,
    priority: "standard",
    fragilityLevel: "fragile",
    category: "fragile",
    specialHandling: ["极易碎", "专业包装", "易碎标识", "垂直存放"],
    deliveryRoute: "RT-002",
    carrier: "中通快递",
    destination: {
      address: "静安区南京西路456号",
      city: "上海",
      zipCode: "200040",
      country: "中国"
    },
    customerInfo: {
      name: "李小红",
      phone: "+86 139-5678-9012"
    },
    trackingNumber: "ZTO9876543210987",
    estimatedDeliveryTime: "明日 09:00-12:00",
    value: 128.00,
    isLoaded: false
  },
  {
    id: "PKG-003",
    sku: "FOOD-FROZEN-012",
    name: "进口冷冻海鲜套装",
    description: "新西兰进口海鲜，保温包装",
    quantity: 1,
    dimensions: { length: 35, width: 25, height: 15, unit: "cm" },
    weight: 3.5,
    priority: "express",
    fragilityLevel: "medium",
    category: "temperature-sensitive",
    specialHandling: ["冷链保存", "温度监控", "快速配送", "保温包装"],
    deliveryRoute: "RT-001",
    carrier: "顺丰快递",
    destination: {
      address: "黄浦区淮海中路789号",
      city: "上海",
      zipCode: "200021",
      country: "中国"
    },
    customerInfo: {
      name: "王大明",
      phone: "+86 137-2468-1357"
    },
    trackingNumber: "SF2345678901234",
    estimatedDeliveryTime: "今日 10:00-12:00",
    value: 189.99,
    isLoaded: false
  },
  {
    id: "PKG-004",
    sku: "BOOK-EDU-045",
    name: "英语学习教材套装",
    description: "含词典、练习册和音频光盘",
    quantity: 3,
    dimensions: { length: 30, width: 22, height: 8, unit: "cm" },
    weight: 2.1,
    priority: "economy",
    fragilityLevel: "low",
    category: "standard",
    specialHandling: ["防潮包装"],
    deliveryRoute: "RT-003",
    carrier: "韵达快递",
    destination: {
      address: "徐汇区衡山路321号",
      city: "上海",
      zipCode: "200030",
      country: "中国"
    },
    customerInfo: {
      name: "陈晓敏",
      phone: "+86 136-9876-5432"
    },
    trackingNumber: "YD3456789012345",
    estimatedDeliveryTime: "后天 14:00-18:00",
    value: 126.00,
    isLoaded: false
  }
];

const sampleVehicleTypes: VehicleType[] = [
  {
    id: "VEH-VAN-001",
    name: "标准配送面包车",
    type: "delivery_van",
    capacity: {
      maxWeight: 1000,
      maxVolume: 8,
      maxPackages: 50,
      dimensions: { length: 300, width: 180, height: 180 }
    },
    features: ["货架系统", "制冷功能", "GPS跟踪", "防盗系统"],
    suitableFor: ["标准包裹", "易碎物品", "温控商品"],
    icon: "🚐",
    loadingTime: 15,
    restrictions: ["限高2.5米", "市区限行时段"],
    fuelType: "diesel",
    emissions: 8.5,
    costPerKm: 0.85,
    zones: ["市区", "近郊"]
  },
  {
    id: "VEH-TRUCK-001",
    name: "中型货车",
    type: "truck",
    capacity: {
      maxWeight: 3000,
      maxVolume: 25,
      maxPackages: 150,
      dimensions: { length: 500, width: 240, height: 240 }
    },
    features: ["液压尾板", "货物绑带", "防雨布", "分隔板"],
    suitableFor: ["大件包裹", "批量配送", "重型商品"],
    icon: "🚛",
    loadingTime: 30,
    restrictions: ["需要货运资质", "夜间禁行"],
    fuelType: "diesel",
    emissions: 15.2,
    costPerKm: 1.20,
    zones: ["市区", "近郊", "远郊"]
  },
  {
    id: "VEH-BIKE-001",
    name: "电动货运三轮车",
    type: "cargo_bike",
    capacity: {
      maxWeight: 150,
      maxVolume: 1.5,
      maxPackages: 20,
      dimensions: { length: 120, width: 80, height: 80 }
    },
    features: ["电动助力", "防水货箱", "LED照明"],
    suitableFor: ["小件快递", "短距离配送", "环保配送"],
    icon: "🚲",
    loadingTime: 5,
    restrictions: ["限载重150kg"],
    fuelType: "electric",
    emissions: 0,
    costPerKm: 0.15,
    zones: ["市区"]
  },
  {
    id: "VEH-COURIER-001",
    name: "即时配送电动车",
    type: "express_courier",
    capacity: {
      maxWeight: 50,
      maxVolume: 0.8,
      maxPackages: 8,
      dimensions: { length: 60, width: 40, height: 50 }
    },
    features: ["保温箱", "GPS实时跟踪", "快速充电"],
    suitableFor: ["紧急配送", "生鲜食品", "同城急件"],
    icon: "🛵",
    loadingTime: 3,
    restrictions: ["续航范围50km"],
    fuelType: "electric",
    emissions: 0,
    costPerKm: 0.25,
    zones: ["市区核心区"]
  }
];

const sampleLoadingDocks: LoadingDock[] = [
  {
    id: "DOCK-001",
    dockNumber: 1,
    status: "available",
    loadingProgress: 0,
    capacity: {
      maxWeight: 5000,
      maxVolume: 50,
      currentWeight: 0,
      currentVolume: 0
    },
    equipment: {
      forklift: true,
      loadingPlatform: true,
      scales: true,
      scanner: true
    },
    assignedRoutes: [],
    safety: {
      emergencyStop: true,
      loadingLights: true,
      clearance: true
    }
  },
  {
    id: "DOCK-002",
    dockNumber: 2,
    status: "occupied",
    currentVehicle: "VEH-VAN-001",
    vehicleType: "配送面包车",
    loadingProgress: 65,
    capacity: {
      maxWeight: 5000,
      maxVolume: 50,
      currentWeight: 850,
      currentVolume: 12
    },
    equipment: {
      forklift: true,
      loadingPlatform: true,
      scales: true,
      scanner: true
    },
    assignedRoutes: ["RT-001"],
    estimatedCompletionTime: new Date(Date.now() + 25 * 60 * 1000),
    safety: {
      emergencyStop: true,
      loadingLights: true,
      clearance: true
    }
  },
  {
    id: "DOCK-003",
    dockNumber: 3,
    status: "maintenance",
    loadingProgress: 0,
    capacity: {
      maxWeight: 5000,
      maxVolume: 50,
      currentWeight: 0,
      currentVolume: 0
    },
    equipment: {
      forklift: false,
      loadingPlatform: false,
      scales: true,
      scanner: true
    },
    assignedRoutes: [],
    safety: {
      emergencyStop: false,
      loadingLights: false,
      clearance: true
    }
  }
];

const sampleDeliveryRoutes: DeliveryRoute[] = [
  {
    id: "RT-001",
    routeCode: "SF-SH-001",
    routeName: "上海市区快递路线",
    carrier: "顺丰快递",
    estimatedDeparture: new Date(Date.now() + 2 * 60 * 60 * 1000),
    estimatedDuration: 240,
    stops: 8,
    totalDistance: 45,
    packages: ["PKG-001", "PKG-003"],
    totalWeight: 4.3,
    totalVolume: 2.8,
    vehicleType: "delivery_van",
    dockAssignment: "DOCK-002",
    driver: {
      name: "刘师傅",
      license: "A2",
      phone: "+86 138-9876-5432",
      experience: 8
    },
    status: "loading",
    priority: "urgent",
    specialRequirements: ["冷链配送", "当日达"]
  },
  {
    id: "RT-002",
    routeCode: "ZTO-SH-002",
    routeName: "上海静安区标准路线",
    carrier: "中通快递",
    estimatedDeparture: new Date(Date.now() + 4 * 60 * 60 * 1000),
    estimatedDuration: 180,
    stops: 5,
    totalDistance: 28,
    packages: ["PKG-002"],
    totalWeight: 1.2,
    totalVolume: 0.8,
    vehicleType: "delivery_van",
    status: "preparing",
    priority: "normal",
    specialRequirements: ["易碎品处理"]
  },
  {
    id: "RT-003",
    routeCode: "YD-SH-003",
    routeName: "上海徐汇区经济路线",
    carrier: "韵达快递",
    estimatedDeparture: new Date(Date.now() + 8 * 60 * 60 * 1000),
    estimatedDuration: 300,
    stops: 12,
    totalDistance: 52,
    packages: ["PKG-004"],
    totalWeight: 2.1,
    totalVolume: 1.5,
    vehicleType: "delivery_van",
    status: "preparing",
    priority: "low",
    specialRequirements: []
  }
];

const sampleWeatherCondition: WeatherCondition = {
  condition: "cloudy",
  temperature: 18,
  humidity: 65,
  windSpeed: 12,
  visibility: 8,
  precipitation: 0,
  advisory: ["轻微风力", "适宜装载作业"],
  impactLevel: "none"
};

// Helper functions
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'express': return 'bg-red-500 text-white';
    case 'standard': return 'bg-blue-500 text-white';
    case 'economy': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'bg-green-500 text-white';
    case 'occupied': return 'bg-yellow-500 text-black';
    case 'maintenance': return 'bg-red-500 text-white';
    case 'reserved': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const getVehicleIcon = (type: string) => {
  switch (type) {
    case 'delivery_van': return Truck;
    case 'truck': return Truck;
    case 'cargo_bike': return Bike;
    case 'express_courier': return Car;
    default: return Truck;
  }
};

const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case 'sunny': return Sun;
    case 'cloudy': return CloudRain;
    case 'rainy': return CloudRain;
    case 'windy': return Wind;
    default: return Sun;
  }
};

export function DeliveryLoadingArea({
  packagedItems = samplePackagedItems,
  availableVehicles = sampleVehicleTypes,
  onPackageLoaded,
  onLoadingComplete,
  onVehicleDispatched
}: DeliveryLoadingAreaProps) {
  const { toast } = useToast();
  
  // State management
  const [loadingDocks, setLoadingDocks] = useState<LoadingDock[]>(sampleLoadingDocks);
  const [deliveryRoutes, setDeliveryRoutes] = useState<DeliveryRoute[]>(sampleDeliveryRoutes);
  const [weather, setWeather] = useState<WeatherCondition>(sampleWeatherCondition);
  const [selectedDock, setSelectedDock] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<Record<string, number>>({});
  const [manifestData, setManifestData] = useState<LoadingManifest | null>(null);
  const [showTips, setShowTips] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  // Enhanced package data with loading states
  const [packages, setPackages] = useState<PackagedItem[]>(packagedItems);

  // Loading steps for educational purposes
  const loadingSteps: LoadingStep[] = [
    {
      id: "preparation",
      stepNumber: 1,
      title: "装载前准备",
      description: "检查车辆状态和装载设备",
      instructions: [
        "检查车辆外观和轮胎状态",
        "确认货厢清洁和干燥",
        "测试车辆照明和安全设备",
        "验证车辆载重能力"
      ],
      safetyNotes: [
        "确保装载区域无障碍物",
        "检查紧急停止按钮",
        "佩戴安全防护用品"
      ],
      estimatedTime: 300,
      completed: false,
      tips: [
        "💡 装载前检查能避免90%的运输问题",
        "🔍 仔细检查车辆状态，确保运输安全"
      ],
      bestPractices: [
        "使用检查清单确保无遗漏",
        "记录车辆状态和里程",
        "确认保险和相关证件"
      ],
      commonMistakes: [
        "跳过车辆检查直接装载",
        "忽视货厢清洁状况",
        "未确认载重限制"
      ]
    },
    {
      id: "organization",
      stepNumber: 2,
      title: "包裹分拣组织",
      description: "按配送路线和优先级组织包裹",
      instructions: [
        "按配送路线分组包裹",
        "识别优先级和特殊处理要求",
        "核对包裹信息和目的地",
        "计算总重量和体积"
      ],
      safetyNotes: [
        "注意易碎品和危险品标识",
        "保持通道畅通",
        "避免过度堆叠"
      ],
      estimatedTime: 480,
      completed: false,
      tips: [
        "📦 按路线倒序装载：最后送达的先装",
        "🎯 优先级高的包裹放在易取位置"
      ],
      bestPractices: [
        "使用颜色编码标识不同路线",
        "重物放底部，轻物放上层",
        "预留紧急包裹位置"
      ],
      commonMistakes: [
        "未按路线顺序组织",
        "混装不同优先级包裹",
        "忽视重量分布"
      ]
    },
    {
      id: "loading",
      stepNumber: 3,
      title: "系统化装载",
      description: "按照优化策略装载包裹",
      instructions: [
        "先装载重物和大件",
        "填充空隙提高空间利用率",
        "确保重量均匀分布",
        "为易碎品留出缓冲空间"
      ],
      safetyNotes: [
        "避免超过载重限制",
        "确保视线不被遮挡",
        "保持重心稳定"
      ],
      estimatedTime: 600,
      completed: false,
      tips: [
        "⚖️ 重量分布影响车辆操控性",
        "📐 合理利用三维空间"
      ],
      bestPractices: [
        "使用专业装载工具",
        "遵循先重后轻原则",
        "预留检查和调整空间"
      ],
      commonMistakes: [
        "重物放在顶部",
        "包裹堆放不稳定",
        "忽视重心位置"
      ]
    },
    {
      id: "securing",
      stepNumber: 4,
      title: "货物固定",
      description: "使用固定设备确保运输安全",
      instructions: [
        "使用绑带固定大件物品",
        "在空隙处放置缓冲材料",
        "检查所有固定点",
        "确认货物无移动风险"
      ],
      safetyNotes: [
        "绑带拉力不要过大",
        "避免尖锐物品划伤包装",
        "确保紧急情况下可快速取出"
      ],
      estimatedTime: 300,
      completed: false,
      tips: [
        "🔒 良好的固定能防止95%的货损",
        "🛡️ 缓冲材料减少震动损害"
      ],
      bestPractices: [
        "使用多点固定确保稳定",
        "定期检查固定状态",
        "为特殊商品使用专用固定方式"
      ],
      commonMistakes: [
        "固定不牢固导致移位",
        "使用不合适的固定材料",
        "固定过紧损坏包装"
      ]
    }
  ];

  // Calculations
  const totalPackages = packages.length;
  const loadedPackages = packages.filter(p => p.isLoaded).length;
  const progressPercentage = totalPackages > 0 ? (loadedPackages / totalPackages) * 100 : 0;

  const routePackages = useMemo(() => {
    const grouped: Record<string, PackagedItem[]> = {};
    packages.forEach(pkg => {
      if (!grouped[pkg.deliveryRoute]) {
        grouped[pkg.deliveryRoute] = [];
      }
      grouped[pkg.deliveryRoute].push(pkg);
    });
    return grouped;
  }, [packages]);

  const availableDocks = loadingDocks.filter(dock => dock.status === 'available');

  // Event handlers
  const handlePackageLoad = useCallback((packageId: string, vehicleId: string) => {
    setPackages(prev => prev.map(pkg => 
      pkg.id === packageId 
        ? { ...pkg, isLoaded: true, loadedAt: new Date(), vehicleId }
        : pkg
    ));

    if (onPackageLoaded) {
      onPackageLoaded(packageId, vehicleId, { x: 0, y: 0, z: 0 });
    }

    toast({
      title: "包裹装载成功",
      description: `包裹 ${packageId} 已装载到车辆`,
    });
  }, [onPackageLoaded, toast]);

  const handleRouteComplete = useCallback((routeId: string) => {
    const route = deliveryRoutes.find(r => r.id === routeId);
    if (!route) return;

    const routePackageItems = packages.filter(pkg => 
      route.packages.includes(pkg.id) && pkg.isLoaded
    );

    if (routePackageItems.length === route.packages.length) {
      const manifest: LoadingManifest = {
        id: `MAN-${Date.now()}`,
        routeId: route.id,
        vehicleId: selectedVehicle || route.dockAssignment || 'VEH-VAN-001',
        dockId: selectedDock || route.dockAssignment || 'DOCK-001',
        packages: routePackageItems,
        totalWeight: routePackageItems.reduce((sum, pkg) => sum + pkg.weight, 0),
        totalVolume: routePackageItems.reduce((sum, pkg) => 
          sum + (pkg.dimensions.length * pkg.dimensions.width * pkg.dimensions.height / 1000000), 0
        ),
        totalValue: routePackageItems.reduce((sum, pkg) => sum + pkg.value, 0),
        loadingSequence: routePackageItems.map(pkg => pkg.id),
        securityChecks: [
          { id: "weight", name: "重量检查", description: "确认总重量", completed: true },
          { id: "fragile", name: "易碎品检查", description: "验证易碎品包装", completed: true },
          { id: "manifest", name: "清单核对", description: "核对包裹清单", completed: true }
        ],
        qualityChecks: {
          cargoSecured: true,
          manifestSigned: false,
          vehicleInspected: true,
          gpsTracking: true,
          routeConfirmed: true
        },
        createdAt: new Date()
      };

      setManifestData(manifest);
      
      // Update route status to ready
      setDeliveryRoutes(prev => prev.map(r => 
        r.id === routeId ? { ...r, status: 'ready' as const } : r
      ));
      
      if (onLoadingComplete) {
        onLoadingComplete(manifest.id, manifest);
      }

      toast({
        title: "路线装载完成",
        description: `路线 ${route.routeName} 的所有包裹已装载完成，清单已生成`,
      });
    }
  }, [deliveryRoutes, packages, selectedVehicle, selectedDock, onLoadingComplete, toast]);

  // Vehicle dispatch handler
  const handleVehicleDispatch = useCallback((manifestId: string) => {
    if (!manifestData) return;

    const vehicleId = manifestData.vehicleId;
    const routeId = manifestData.routeId;
    const packageIds = manifestData.packages.map(pkg => pkg.id);

    // Update route status to departed
    setDeliveryRoutes(prev => prev.map(r => 
      r.id === routeId ? { ...r, status: 'departed' as const } : r
    ));

    // Update manifest as completed
    setManifestData(prev => prev ? { 
      ...prev, 
      completedAt: new Date(), 
      driverSignature: { 
        signed: true, 
        timestamp: new Date(), 
        driverName: prev.packages[0]?.customerInfo.name || 'Driver' 
      } 
    } : null);

    if (onVehicleDispatched) {
      onVehicleDispatched(vehicleId, routeId, packageIds);
    }

    toast({
      title: "车辆发车成功",
      description: `车辆已发车，开始配送路线 ${deliveryRoutes.find(r => r.id === routeId)?.routeName}`,
    });
  }, [manifestData, deliveryRoutes, onVehicleDispatched, toast]);

  // Auto-trigger route completion when all packages in a route are loaded
  useEffect(() => {
    deliveryRoutes.forEach(route => {
      const routePackageItems = packages.filter(pkg => route.packages.includes(pkg.id));
      const loadedPackagesInRoute = routePackageItems.filter(pkg => pkg.isLoaded);
      
      if (routePackageItems.length > 0 && 
          loadedPackagesInRoute.length === routePackageItems.length && 
          route.status !== 'ready' && 
          route.status !== 'departed') {
        // Route is complete, trigger completion automatically
        handleRouteComplete(route.id);
      }
    });
  }, [packages, deliveryRoutes, handleRouteComplete]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6" data-testid="delivery-loading-area">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground" data-testid="loading-area-title">
          配送装载区域
        </h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          专业配送装载操作中心 - 优化装载策略，确保配送效率与安全，完成从仓储到最后一公里的无缝衔接
        </p>
        
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>总体装载进度</span>
            <span>{loadedPackages} / {totalPackages} 包裹已装载</span>
          </div>
          <Progress value={progressPercentage} className="h-3" data-testid="loading-progress" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Column - Loading Bay Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Weather Conditions */}
          <Card data-testid="weather-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getWeatherIcon(weather.condition)({ className: "h-5 w-5" })}
                天气状况
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>温度: {weather.temperature}°C</div>
                <div>湿度: {weather.humidity}%</div>
                <div>风速: {weather.windSpeed}km/h</div>
                <div>能见度: {weather.visibility}km</div>
              </div>
              {weather.advisory.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">装载建议:</div>
                  {weather.advisory.map((advice, index) => (
                    <div key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {advice}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading Docks Status */}
          <Card data-testid="docks-status-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                装载站台状态
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingDocks.map((dock) => (
                <div key={dock.id} className="p-3 border rounded-lg space-y-2" data-testid={`dock-${dock.id}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">站台 {dock.dockNumber}</span>
                    <Badge className={cn("px-2 py-1", getStatusColor(dock.status))}>
                      {dock.status === 'available' ? '可用' :
                       dock.status === 'occupied' ? '占用' :
                       dock.status === 'maintenance' ? '维护' : '预留'}
                    </Badge>
                  </div>
                  
                  {dock.status === 'occupied' && (
                    <>
                      <div className="text-sm text-muted-foreground">
                        车辆: {dock.vehicleType}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>装载进度</span>
                          <span>{dock.loadingProgress}%</span>
                        </div>
                        <Progress value={dock.loadingProgress} className="h-1" />
                      </div>
                      {dock.estimatedCompletionTime && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          预计完成: {dock.estimatedCompletionTime.toLocaleTimeString()}
                        </div>
                      )}
                    </>
                  )}

                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>载重:</span>
                      <span>{dock.capacity.currentWeight}/{dock.capacity.maxWeight}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>体积:</span>
                      <span>{dock.capacity.currentVolume.toFixed(1)}/{dock.capacity.maxVolume}m³</span>
                    </div>
                  </div>

                  {/* Equipment Status */}
                  <div className="flex gap-1 flex-wrap">
                    {dock.equipment.forklift && (
                      <Badge variant="outline" className="text-xs">叉车</Badge>
                    )}
                    {dock.equipment.scales && (
                      <Badge variant="outline" className="text-xs">地磅</Badge>
                    )}
                    {dock.equipment.scanner && (
                      <Badge variant="outline" className="text-xs">扫描器</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Educational Tips */}
          {showTips && (
            <Card data-testid="tips-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  装载小贴士
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowTips(false)}
                    className="ml-auto"
                    data-testid="close-tips-button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                    💡 装载黄金法则
                  </div>
                  <div className="text-blue-600 dark:text-blue-400">
                    "重下轻上，先远后近" - 重物放底部，远距离包裹先装载
                  </div>
                </div>
                
                <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="font-medium text-green-700 dark:text-green-300 mb-1">
                    🛡️ 安全第一
                  </div>
                  <div className="text-green-600 dark:text-green-400">
                    始终确保货物固定牢靠，避免运输过程中移位造成损坏
                  </div>
                </div>

                <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="font-medium text-orange-700 dark:text-orange-300 mb-1">
                    ⚡ 效率优化
                  </div>
                  <div className="text-orange-600 dark:text-orange-400">
                    按配送路线倒序装载，最后送达的包裹放在车厢最内侧
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle Column - Package Organization & Vehicle Loading */}
        <div className="lg:col-span-2 space-y-6">
          {/* Package Organization by Route */}
          <Card data-testid="package-organization-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                包裹路线组织
              </CardTitle>
              <CardDescription>
                按配送路线和承运商组织包裹，优化装载顺序
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(routePackages).map(([routeId, routePkgs]) => {
                  const route = deliveryRoutes.find(r => r.id === routeId);
                  if (!route) return null;

                  const routeWeight = routePkgs.reduce((sum, pkg) => sum + pkg.weight, 0);
                  const routeValue = routePkgs.reduce((sum, pkg) => sum + pkg.value, 0);
                  const loadedCount = routePkgs.filter(pkg => pkg.isLoaded).length;
                  const routeProgress = routePkgs.length > 0 ? (loadedCount / routePkgs.length) * 100 : 0;

                  return (
                    <div key={routeId} className="border rounded-lg p-4 space-y-3" data-testid={`route-${routeId}`}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            <Badge className={cn("px-2 py-1", 
                              route.priority === 'urgent' ? 'bg-red-500 text-white' :
                              route.priority === 'high' ? 'bg-orange-500 text-white' :
                              route.priority === 'normal' ? 'bg-blue-500 text-white' :
                              'bg-green-500 text-white'
                            )}>
                              {route.carrier}
                            </Badge>
                            {route.routeName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {route.stops} 个站点 • {route.totalDistance}km • 预计 {Math.round(route.estimatedDuration/60)}小时
                          </div>
                        </div>
                        <div className="text-right text-sm" data-testid={`route-progress-${routeId}`}>
                          <div data-testid={`route-loaded-count-${routeId}`}>{loadedCount}/{routePkgs.length} 已装载</div>
                          <Progress value={routeProgress} className="w-20 h-2 mt-1" data-testid={`route-progress-bar-${routeId}`} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Weight className="h-4 w-4 text-muted-foreground" />
                          <span>重量: {routeWeight.toFixed(1)}kg</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>价值: ¥{routeValue.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{route.estimatedDeparture.toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {/* Route packages */}
                      <div className="space-y-2">
                        {routePkgs.map((pkg) => (
                          <div key={pkg.id} className={cn(
                            "flex items-center gap-3 p-2 border rounded text-sm",
                            pkg.isLoaded ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : ""
                          )} data-testid={`package-${pkg.id}`}>
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              pkg.isLoaded ? "bg-green-500" : "bg-gray-300"
                            )} />
                            
                            <div className="flex-1">
                              <div className="font-medium">{pkg.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {pkg.customerInfo.name} • {pkg.destination.city}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge className={cn("px-2 py-1 text-xs", getPriorityColor(pkg.priority))} data-testid={`package-priority-${pkg.id}`}>
                                {pkg.priority === 'express' ? '特快' :
                                 pkg.priority === 'standard' ? '标准' : '经济'}
                              </Badge>
                              
                              {pkg.fragilityLevel === 'fragile' && (
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-600" data-testid={`fragile-badge-${pkg.id}`}>
                                  易碎
                                </Badge>
                              )}

                              {pkg.category === 'temperature-sensitive' && (
                                <Badge variant="outline" className="text-xs text-blue-600 border-blue-600" data-testid={`temperature-badge-${pkg.id}`}>
                                  温控
                                </Badge>
                              )}

                              <div className="text-xs text-muted-foreground" data-testid={`package-weight-${pkg.id}`}>
                                {pkg.weight}kg
                              </div>

                              {!pkg.isLoaded && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handlePackageLoad(pkg.id, selectedVehicle || 'VEH-VAN-001')}
                                  data-testid={`load-package-${pkg.id}`}
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  装载
                                </Button>
                              )}

                              {pkg.isLoaded && (
                                <div className="flex items-center gap-1 text-green-600" data-testid={`loaded-status-${pkg.id}`}>
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-xs">已装载</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {loadedCount === routePkgs.length && (
                        <Button 
                          onClick={() => handleRouteComplete(routeId)}
                          className="w-full"
                          data-testid={`complete-route-${routeId}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          路线装载完成
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Loading Simulation */}
          <Card data-testid="vehicle-loading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                车辆装载模拟
              </CardTitle>
              <CardDescription>
                可视化车辆装载空间，优化包裹放置位置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Vehicle Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">选择车辆类型:</label>
                    <Select value={selectedVehicle || ""} onValueChange={setSelectedVehicle}>
                      <SelectTrigger data-testid="vehicle-select">
                        <SelectValue placeholder="选择车辆" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            <div className="flex items-center gap-2">
                              <span>{vehicle.icon}</span>
                              <span>{vehicle.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">分配站台:</label>
                    <Select value={selectedDock || ""} onValueChange={setSelectedDock}>
                      <SelectTrigger data-testid="dock-select">
                        <SelectValue placeholder="选择站台" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDocks.map((dock) => (
                          <SelectItem key={dock.id} value={dock.id}>
                            站台 {dock.dockNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedVehicle && (
                  <div className="space-y-4">
                    {(() => {
                      const vehicle = availableVehicles.find(v => v.id === selectedVehicle);
                      if (!vehicle) return null;

                      const loadedWeight = packages.filter(p => p.isLoaded && p.vehicleId === selectedVehicle)
                        .reduce((sum, p) => sum + p.weight, 0);
                      const weightUtilization = (loadedWeight / vehicle.capacity.maxWeight) * 100;

                      return (
                        <>
                          {/* Vehicle Info */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-medium">{vehicle.name}</div>
                                <div className="text-muted-foreground">
                                  {vehicle.type === 'delivery_van' ? '配送面包车' :
                                   vehicle.type === 'truck' ? '货车' :
                                   vehicle.type === 'cargo_bike' ? '货运三轮车' : '即时配送车'}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div>载重: {loadedWeight.toFixed(1)}/{vehicle.capacity.maxWeight}kg</div>
                                <Progress value={weightUtilization} className="h-2" />
                              </div>
                            </div>
                          </div>

                          {/* Vehicle Loading Visualization */}
                          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px]" data-testid="loading-visualization">
                            <div className="absolute top-2 left-2 text-xs text-muted-foreground">
                              车厢装载视图 ({vehicle.capacity.dimensions.length}×{vehicle.capacity.dimensions.width}×{vehicle.capacity.dimensions.height}cm)
                            </div>
                            
                            {/* Simulated loading area */}
                            <div className="mt-6 grid grid-cols-4 gap-2 h-32">
                              {packages.filter(p => p.isLoaded && p.vehicleId === selectedVehicle).map((pkg, index) => (
                                <div key={pkg.id} className={cn(
                                  "border rounded p-2 text-xs bg-white dark:bg-gray-800 shadow-sm",
                                  pkg.priority === 'express' ? 'border-red-500' :
                                  pkg.priority === 'standard' ? 'border-blue-500' : 'border-green-500'
                                )} data-testid={`loaded-package-${pkg.id}`}>
                                  <div className="font-medium truncate">{pkg.name}</div>
                                  <div className="text-muted-foreground">{pkg.weight}kg</div>
                                  {pkg.fragilityLevel === 'fragile' && (
                                    <Badge variant="outline" className="text-xs">易碎</Badge>
                                  )}
                                </div>
                              ))}
                              
                              {/* Empty slots */}
                              {Array.from({ length: Math.max(0, 8 - packages.filter(p => p.isLoaded && p.vehicleId === selectedVehicle).length) }, (_, i) => (
                                <div key={i} className="border-2 border-dashed border-gray-200 rounded p-2 flex items-center justify-center text-xs text-muted-foreground">
                                  可用空间
                                </div>
                              ))}
                            </div>

                            {/* Loading Tips */}
                            <div className="mt-4 text-xs text-muted-foreground space-y-1">
                              <div>💡 装载提示:</div>
                              <div>• 重物放置在车厢前部和底部</div>
                              <div>• 易碎品使用缓冲材料保护</div>
                              <div>• 确保重量分布均匀</div>
                            </div>
                          </div>

                          {/* Vehicle Capacity Indicators */}
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span>重量利用率</span>
                                <span>{weightUtilization.toFixed(1)}%</span>
                              </div>
                              <Progress value={weightUtilization} className="h-2" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span>空间利用率</span>
                                <span>0.0%</span>
                              </div>
                              <Progress value={0} className="h-2" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span>包裹数量</span>
                                <span>{packages.filter(p => p.isLoaded && p.vehicleId === selectedVehicle).length}/{vehicle.capacity.maxPackages}</span>
                              </div>
                              <Progress 
                                value={(packages.filter(p => p.isLoaded && p.vehicleId === selectedVehicle).length / vehicle.capacity.maxPackages) * 100} 
                                className="h-2" 
                              />
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Documentation & Verification */}
        <div className="lg:col-span-1 space-y-6">
          {/* Loading Steps Progress */}
          <Card data-testid="loading-steps-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                装载流程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loadingSteps.map((step, index) => (
                  <div key={step.id} className={cn(
                    "p-3 border rounded-lg",
                    index === currentStep ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "",
                    step.completed ? "border-green-500 bg-green-50 dark:bg-green-950" : ""
                  )} data-testid={`step-${step.id}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : index === currentStep ? (
                        <Circle className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                      <div className="font-medium text-sm">{step.title}</div>
                    </div>
                    
                    {(index === currentStep || step.completed) && (
                      <div className="space-y-2 text-xs">
                        <div className="text-muted-foreground">{step.description}</div>
                        
                        {index === currentStep && (
                          <>
                            <div className="space-y-1">
                              <div className="font-medium">操作步骤:</div>
                              {step.instructions.map((instruction, i) => (
                                <div key={i} className="flex items-start gap-1">
                                  <span className="text-muted-foreground">{i + 1}.</span>
                                  <span>{instruction}</span>
                                </div>
                              ))}
                            </div>

                            {step.safetyNotes.length > 0 && (
                              <div className="space-y-1">
                                <div className="font-medium text-orange-600">安全提醒:</div>
                                {step.safetyNotes.map((note, i) => (
                                  <div key={i} className="flex items-start gap-1 text-orange-600">
                                    <AlertTriangle className="h-3 w-3 mt-0.5" />
                                    <span>{note}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <Button 
                              size="sm" 
                              onClick={() => {
                                const newSteps = [...loadingSteps];
                                newSteps[index].completed = true;
                                setCurrentStep(Math.min(currentStep + 1, loadingSteps.length - 1));
                              }}
                              className="w-full mt-2"
                              data-testid={`complete-step-${step.id}`}
                            >
                              完成此步骤
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Manifest */}
          {manifestData && (
            <Card data-testid="manifest-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  配送清单
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>清单编号:</span>
                    <span className="font-mono">{manifestData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>包裹数量:</span>
                    <span>{manifestData.packages.length} 件</span>
                  </div>
                  <div className="flex justify-between">
                    <span>总重量:</span>
                    <span>{manifestData.totalWeight.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>总价值:</span>
                    <span>¥{manifestData.totalValue.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                {/* Quality Checks */}
                <div className="space-y-2">
                  <div className="font-medium text-sm">质量检查:</div>
                  {Object.entries(manifestData.qualityChecks).map(([key, completed]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-300" />
                      )}
                      <span>
                        {key === 'cargoSecured' ? '货物固定' :
                         key === 'manifestSigned' ? '清单签字' :
                         key === 'vehicleInspected' ? '车辆检查' :
                         key === 'gpsTracking' ? 'GPS跟踪' :
                         key === 'routeConfirmed' ? '路线确认' : key}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Driver Signature */}
                <div className="space-y-2">
                  <div className="font-medium text-sm">司机签收:</div>
                  {!manifestData.driverSignature?.signed ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setManifestData(prev => prev ? {
                          ...prev,
                          driverSignature: {
                            signed: true,
                            timestamp: new Date(),
                            driverName: "刘师傅"
                          }
                        } : null);
                      }}
                      data-testid="driver-sign-button"
                    >
                      <Signature className="h-4 w-4 mr-2" />
                      司机签字
                    </Button>
                  ) : (
                    <div className="p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">已签收</span>
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        司机: {manifestData.driverSignature.driverName}<br/>
                        时间: {manifestData.driverSignature.timestamp?.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Dispatch */}
                {manifestData.driverSignature?.signed && Object.values(manifestData.qualityChecks).every(Boolean) && (
                  <Button 
                    className="w-full"
                    onClick={() => handleVehicleDispatch(manifestData.id)}
                    data-testid="dispatch-vehicle-button"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    确认发车
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Educational Best Practices */}
          <Card data-testid="best-practices-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                最佳实践
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <div className="font-medium">装载效率优化:</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 按配送路线倒序装载</li>
                  <li>• 重物底部，易碎品保护</li>
                  <li>• 预留15%空间用于固定</li>
                  <li>• 优先装载高价值商品</li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="font-medium">安全操作规范:</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 佩戴安全防护用品</li>
                  <li>• 检查车辆状态</li>
                  <li>• 确保货物固定牢靠</li>
                  <li>• 遵守载重限制</li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="font-medium">常见错误避免:</div>
                <ul className="space-y-1 text-orange-600 dark:text-orange-400">
                  <li>• 避免超载操作</li>
                  <li>• 不要忽视易碎标识</li>
                  <li>• 禁止混装危险品</li>
                  <li>• 防止重心偏移</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}