import { useState, useCallback, useEffect, useMemo } from "react";
import { 
  Package, 
  Box, 
  Shield, 
  Scale, 
  PackageCheck,
  ShoppingCart,
  Recycle,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Circle,
  Lightbulb,
  Target,
  ArrowRight,
  Eye,
  Hash,
  Clock,
  Ruler,
  Weight,
  ThermometerSun,
  Droplets,
  Archive,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  Info,
  Star,
  TreePine,
  Truck,
  CheckSquare,
  X,
  Camera,
  MapPin
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

// Type definitions for packaging area
interface ApprovedItem {
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
  fragilityLevel: 'low' | 'medium' | 'high' | 'fragile';
  category: 'standard' | 'fragile' | 'hazardous' | 'temperature-sensitive' | 'liquid';
  specialHandling: string[];
  packagingRequirements: string[];
  value: number;
  customerPreferences?: string[];
  hazardousInfo?: {
    type: string;
    warnings: string[];
    specialProtocols: string[];
  };
}

interface PackagingMaterial {
  id: string;
  name: string;
  type: 'box' | 'envelope' | 'protection' | 'specialty';
  subType: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  maxWeight: number;
  cost: number;
  sustainability: {
    recyclable: boolean;
    biodegradable: boolean;
    score: number; // 1-10
  };
  suitableFor: string[];
  description: string;
  icon: string;
  features: string[];
  availability: number;
}

interface PackagingStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  instructions: string[];
  safetyNotes?: string[];
  estimatedTime: number; // seconds
  completed: boolean;
  materials: string[];
  tips?: string[];
}

interface QualityCheck {
  id: string;
  name: string;
  description: string;
  type: 'integrity' | 'labeling' | 'compliance' | 'weight' | 'dimensions';
  required: boolean;
  passed?: boolean;
  notes?: string;
  criteria: string[];
}

interface PackagingSession {
  itemId: string;
  selectedMaterials: PackagingMaterial[];
  steps: PackagingStep[];
  currentStep: number;
  totalCost: number;
  totalWeight: number;
  finalDimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  qualityChecks: QualityCheck[];
  efficiency: number; // 1-100
  sustainabilityScore: number; // 1-100
  completed: boolean;
  startTime: Date;
  endTime?: Date;
}

interface PackagingAreaProps {
  approvedItems: ApprovedItem[];
  availablePackaging: PackagingMaterial[];
  onItemPackaged?: (itemId: string, session: PackagingSession) => void;
  onComplete?: (sessions: PackagingSession[]) => void;
}

// Sample data for demonstration
const sampleApprovedItems: ApprovedItem[] = [
  {
    id: "ITEM-001",
    sku: "ELEC-PHONE-001",
    name: "智能手机保护壳",
    description: "适用于iPhone 15的透明保护壳，TPU材质",
    quantity: 2,
    dimensions: { length: 15, width: 8, height: 1, unit: "cm" },
    weight: 0.15,
    fragilityLevel: "medium",
    category: "fragile",
    specialHandling: ["轻拿轻放", "避免重压"],
    packagingRequirements: ["气泡膜保护", "小型包装盒"],
    value: 35.99,
    customerPreferences: ["环保包装"]
  },
  {
    id: "ITEM-002",
    sku: "HOME-GLASS-003",
    name: "水晶装饰摆件",
    description: "纯手工制作水晶摆件，易碎品",
    quantity: 1,
    dimensions: { length: 12, width: 12, height: 18, unit: "cm" },
    weight: 0.8,
    fragilityLevel: "fragile",
    category: "fragile",
    specialHandling: ["极易碎", "需专业包装", "标注易碎标识"],
    packagingRequirements: ["防震气泡膜", "专用易碎品包装盒", "填充材料"],
    value: 128.00,
    customerPreferences: ["礼品包装", "防损保护"]
  },
  {
    id: "ITEM-003",
    sku: "CHEM-CLEAN-125",
    name: "多功能清洁剂",
    description: "家用多功能清洁剂，化学制品",
    quantity: 3,
    dimensions: { length: 8, width: 8, height: 25, unit: "cm" },
    weight: 0.5,
    fragilityLevel: "low",
    category: "hazardous",
    specialHandling: ["化学品处理", "防泄漏包装", "通风储存"],
    packagingRequirements: ["防漏密封袋", "吸水材料", "化学品标识"],
    value: 19.99,
    hazardousInfo: {
      type: "化学清洁剂",
      warnings: ["避免与食物接触", "保持密封"],
      specialProtocols: ["使用防护手套", "确保容器密封"]
    }
  },
  {
    id: "ITEM-004",
    sku: "FOOD-FROZEN-012",
    name: "冷冻海鲜套装",
    description: "进口冷冻海鲜，需低温保存",
    quantity: 1,
    dimensions: { length: 30, width: 20, height: 8, unit: "cm" },
    weight: 2.5,
    fragilityLevel: "medium",
    category: "temperature-sensitive",
    specialHandling: ["冷链保存", "快速包装", "温度监控"],
    packagingRequirements: ["保温包装盒", "冰袋", "温度指示器"],
    value: 89.99,
    customerPreferences: ["冷链配送"]
  }
];

const samplePackagingMaterials: PackagingMaterial[] = [
  // Boxes
  {
    id: "BOX-SMALL",
    name: "小型包装盒",
    type: "box",
    subType: "standard",
    dimensions: { length: 20, width: 15, height: 10, unit: "cm" },
    maxWeight: 2,
    cost: 1.50,
    sustainability: { recyclable: true, biodegradable: true, score: 8 },
    suitableFor: ["小型物品", "电子配件", "饰品"],
    description: "适用于小型商品的标准包装盒",
    icon: "📦",
    features: ["可回收", "可生物降解", "成本低"],
    availability: 50
  },
  {
    id: "BOX-MEDIUM",
    name: "中型包装盒",
    type: "box",
    subType: "standard",
    dimensions: { length: 30, width: 20, height: 15, unit: "cm" },
    maxWeight: 5,
    cost: 2.80,
    sustainability: { recyclable: true, biodegradable: true, score: 8 },
    suitableFor: ["中型物品", "家居用品", "服装"],
    description: "适用于中型商品的标准包装盒",
    icon: "📦",
    features: ["结构稳固", "可回收", "经济实用"],
    availability: 35
  },
  {
    id: "BOX-FRAGILE",
    name: "易碎品专用盒",
    type: "box",
    subType: "fragile",
    dimensions: { length: 25, width: 20, height: 20, unit: "cm" },
    maxWeight: 3,
    cost: 4.20,
    sustainability: { recyclable: true, biodegradable: false, score: 6 },
    suitableFor: ["易碎物品", "玻璃制品", "陶瓷"],
    description: "加固设计的易碎品专用包装盒",
    icon: "🔒",
    features: ["防震设计", "加厚材质", "易碎标识"],
    availability: 20
  },
  {
    id: "BOX-INSULATED",
    name: "保温包装盒",
    type: "box",
    subType: "temperature",
    dimensions: { length: 35, width: 25, height: 15, unit: "cm" },
    maxWeight: 8,
    cost: 8.50,
    sustainability: { recyclable: false, biodegradable: false, score: 4 },
    suitableFor: ["冷冻食品", "药品", "生鲜"],
    description: "保温隔热的专用包装盒",
    icon: "❄️",
    features: ["保温隔热", "密封性好", "温度监控"],
    availability: 15
  },
  // Envelopes
  {
    id: "ENV-BUBBLE",
    name: "气泡信封",
    type: "envelope",
    subType: "bubble",
    dimensions: { length: 25, width: 18, height: 2, unit: "cm" },
    maxWeight: 0.5,
    cost: 0.80,
    sustainability: { recyclable: false, biodegradable: false, score: 3 },
    suitableFor: ["文档", "小配件", "轻量物品"],
    description: "内置气泡膜的保护信封",
    icon: "📄",
    features: ["防震保护", "轻便", "防水"],
    availability: 100
  },
  {
    id: "ENV-POLY",
    name: "防水信封",
    type: "envelope",
    subType: "poly",
    dimensions: { length: 30, width: 22, height: 1, unit: "cm" },
    maxWeight: 0.3,
    cost: 0.60,
    sustainability: { recyclable: true, biodegradable: false, score: 5 },
    suitableFor: ["文档", "证书", "照片"],
    description: "防水防撕的聚乙烯信封",
    icon: "💧",
    features: ["防水", "防撕", "透明"],
    availability: 80
  },
  // Protection materials
  {
    id: "PROT-BUBBLE",
    name: "气泡膜",
    type: "protection",
    subType: "bubble",
    maxWeight: 0,
    cost: 0.30,
    sustainability: { recyclable: true, biodegradable: false, score: 4 },
    suitableFor: ["易碎物品", "电子产品", "精密仪器"],
    description: "多层气泡防震保护膜",
    icon: "🫧",
    features: ["防震", "轻便", "可重复使用"],
    availability: 200
  },
  {
    id: "PROT-FOAM",
    name: "防震海绵",
    type: "protection",
    subType: "foam",
    maxWeight: 0,
    cost: 0.50,
    sustainability: { recyclable: false, biodegradable: false, score: 2 },
    suitableFor: ["精密设备", "易碎物品", "高价值商品"],
    description: "高密度防震泡沫材料",
    icon: "🧽",
    features: ["强力防震", "定制切割", "高密度"],
    availability: 150
  },
  {
    id: "PROT-PAPER",
    name: "环保填充纸",
    type: "protection",
    subType: "paper",
    maxWeight: 0,
    cost: 0.20,
    sustainability: { recyclable: true, biodegradable: true, score: 9 },
    suitableFor: ["轻量填充", "环保包装", "一般保护"],
    description: "可回收的环保填充材料",
    icon: "📄",
    features: ["环保", "可降解", "成本低"],
    availability: 300
  },
  // Specialty items
  {
    id: "SPEC-HAZMAT",
    name: "化学品包装袋",
    type: "specialty",
    subType: "hazmat",
    maxWeight: 2,
    cost: 3.50,
    sustainability: { recyclable: false, biodegradable: false, score: 2 },
    suitableFor: ["化学品", "清洁剂", "危险物品"],
    description: "符合危险品运输标准的专用包装",
    icon: "⚠️",
    features: ["防泄漏", "化学标识", "符合法规"],
    availability: 25
  },
  {
    id: "SPEC-ICE",
    name: "保冷冰袋",
    type: "specialty",
    subType: "cooling",
    maxWeight: 0,
    cost: 2.20,
    sustainability: { recyclable: false, biodegradable: false, score: 3 },
    suitableFor: ["冷冻食品", "药品", "生鲜"],
    description: "长效保冷的专用冰袋",
    icon: "🧊",
    features: ["长效保冷", "无毒安全", "可重复使用"],
    availability: 40
  }
];

// Quality check templates
const getQualityChecks = (item: ApprovedItem): QualityCheck[] => {
  const baseChecks: QualityCheck[] = [
    {
      id: "integrity",
      name: "包装完整性检查",
      description: "确认包装结构完整，无破损",
      type: "integrity",
      required: true,
      criteria: ["包装盒完整", "封口牢固", "无破损", "无变形"]
    },
    {
      id: "labeling",
      name: "标签准确性检查",
      description: "验证标签信息正确且清晰",
      type: "labeling",
      required: true,
      criteria: ["收件人信息", "商品信息", "处理标识", "追踪码"]
    },
    {
      id: "weight",
      name: "重量验证",
      description: "确认包装总重量符合规定",
      type: "weight",
      required: true,
      criteria: ["重量准确", "在限重范围内", "重量分布均匀"]
    },
    {
      id: "dimensions",
      name: "尺寸检查",
      description: "验证包装尺寸符合运输要求",
      type: "dimensions",
      required: true,
      criteria: ["尺寸准确", "符合运输规格", "堆放稳定"]
    }
  ];

  // Add category-specific checks
  if (item.category === "fragile") {
    baseChecks.push({
      id: "fragile-protection",
      name: "易碎品保护检查",
      description: "确认易碎品得到充分保护",
      type: "integrity",
      required: true,
      criteria: ["防震材料充足", "易碎标识清晰", "固定牢靠", "缓冲充分"]
    });
  }

  if (item.category === "hazardous") {
    baseChecks.push({
      id: "hazmat-compliance",
      name: "危险品合规检查",
      description: "确认危险品包装符合法规要求",
      type: "compliance",
      required: true,
      criteria: ["防泄漏包装", "警告标识", "合规标签", "安全固定"]
    });
  }

  return baseChecks;
};

// Packaging optimization suggestions
const getPackagingTips = (item: ApprovedItem, materials: PackagingMaterial[]): string[] => {
  const tips: string[] = [];
  
  if (item.fragilityLevel === "fragile") {
    tips.push("💡 使用多层保护：先用气泡膜包裹，再放入专用易碎品盒");
    tips.push("🔍 确保物品在盒中不能移动，填充材料要充足");
  }
  
  if (item.category === "hazardous") {
    tips.push("⚠️ 危险品必须使用专用包装材料，并添加相应标识");
    tips.push("🧤 包装过程中务必佩戴防护用品");
  }
  
  if (item.value > 100) {
    tips.push("💰 高价值商品建议购买运输保险");
    tips.push("📸 包装前后拍照留档，便于处理纠纷");
  }
  
  const sustainableMaterials = materials.filter(m => m.sustainability.score >= 7);
  if (sustainableMaterials.length > 0) {
    tips.push("🌱 优先选择环保材料，提升品牌形象");
  }
  
  return tips;
};

export function PackagingArea({
  approvedItems = sampleApprovedItems,
  availablePackaging = samplePackagingMaterials,
  onItemPackaged,
  onComplete
}: PackagingAreaProps) {
  const { toast } = useToast();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [packagingSessions, setPackagingSessions] = useState<PackagingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<PackagingSession | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<PackagingMaterial[]>([]);
  const [showMaterialDetails, setShowMaterialDetails] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(true);

  // Get current item
  const currentItem = approvedItems[currentItemIndex];
  const hasCurrentItem = currentItem && currentItemIndex < approvedItems.length;

  // Calculate progress
  const progress = useMemo(() => {
    const totalItems = approvedItems.length;
    const completedItems = packagingSessions.filter(s => s.completed).length;
    const totalCost = packagingSessions.reduce((sum, s) => sum + s.totalCost, 0);
    const avgEfficiency = completedItems > 0 ? 
      packagingSessions.filter(s => s.completed).reduce((sum, s) => sum + s.efficiency, 0) / completedItems : 0;
    
    return {
      totalItems,
      completedItems,
      percentage: totalItems > 0 ? (completedItems / totalItems) * 100 : 0,
      totalCost,
      avgEfficiency: Math.round(avgEfficiency)
    };
  }, [approvedItems, packagingSessions]);

  // Initialize session for current item
  useEffect(() => {
    if (hasCurrentItem && !currentSession) {
      const newSession: PackagingSession = {
        itemId: currentItem.id,
        selectedMaterials: [],
        steps: generatePackagingSteps(currentItem),
        currentStep: 0,
        totalCost: 0,
        totalWeight: currentItem.weight,
        qualityChecks: getQualityChecks(currentItem),
        efficiency: 100,
        sustainabilityScore: 100,
        completed: false,
        startTime: new Date()
      };
      setCurrentSession(newSession);
    }
  }, [hasCurrentItem, currentItem, currentSession]);

  // Generate packaging steps based on item characteristics
  const generatePackagingSteps = useCallback((item: ApprovedItem): PackagingStep[] => {
    const steps: PackagingStep[] = [
      {
        id: "prepare",
        stepNumber: 1,
        title: "准备包装材料",
        description: "根据商品特性选择合适的包装材料",
        instructions: [
          "检查商品状态和包装要求",
          "选择合适尺寸的包装盒",
          "准备保护材料"
        ],
        estimatedTime: 60,
        completed: false,
        materials: [],
        tips: ["选择稍大于商品的包装盒", "预留填充材料空间"]
      },
      {
        id: "protect",
        stepNumber: 2,
        title: "商品保护包装",
        description: "为商品添加适当的保护材料",
        instructions: [
          "用保护材料包裹商品",
          "确保关键部位得到保护",
          "检查包装紧密度"
        ],
        estimatedTime: 90,
        completed: false,
        materials: [],
        tips: ["易碎品要多层保护", "避免过度包装"]
      },
      {
        id: "box",
        stepNumber: 3,
        title: "装箱",
        description: "将保护好的商品放入包装盒",
        instructions: [
          "将商品小心放入包装盒",
          "添加填充材料防止移动",
          "确保商品在盒中固定"
        ],
        estimatedTime: 45,
        completed: false,
        materials: [],
        tips: ["填充材料要适量", "避免商品在盒中晃动"]
      },
      {
        id: "seal",
        stepNumber: 4,
        title: "封装",
        description: "封闭包装盒并添加标签",
        instructions: [
          "用胶带密封包装盒",
          "贴上运单和处理标识",
          "最终检查包装完整性"
        ],
        estimatedTime: 30,
        completed: false,
        materials: [],
        tips: ["封口要牢固", "标签要清晰可见"]
      }
    ];

    // Add special steps for different categories
    if (item.category === "fragile") {
      steps.splice(1, 0, {
        id: "fragile-prep",
        stepNumber: 2,
        title: "易碎品特殊处理",
        description: "为易碎品进行专门的防护准备",
        instructions: [
          "使用易碎品专用包装盒",
          "添加易碎标识",
          "准备额外的防震材料"
        ],
        safetyNotes: ["轻拿轻放", "避免冲击"],
        estimatedTime: 45,
        completed: false,
        materials: [],
        tips: ["多层保护更安全", "标识要醒目"]
      });
    }

    if (item.category === "hazardous") {
      steps.splice(1, 0, {
        id: "hazmat-prep",
        stepNumber: 2,
        title: "危险品安全处理",
        description: "按照危险品规定进行包装",
        instructions: [
          "佩戴防护用品",
          "使用危险品专用包装",
          "添加警告标识"
        ],
        safetyNotes: ["必须佩戴手套", "确保通风良好", "避免泄漏"],
        estimatedTime: 120,
        completed: false,
        materials: [],
        tips: ["安全第一", "严格按规范操作"]
      });
    }

    return steps.map((step, index) => ({ ...step, stepNumber: index + 1 }));
  }, []);

  // Handle material selection
  const handleMaterialSelection = useCallback((material: PackagingMaterial) => {
    if (!currentSession) return;

    const isSelected = selectedMaterials.some(m => m.id === material.id);
    
    if (isSelected) {
      setSelectedMaterials(prev => prev.filter(m => m.id !== material.id));
    } else {
      setSelectedMaterials(prev => [...prev, material]);
    }

    // Update session with new materials
    const newMaterials = isSelected 
      ? selectedMaterials.filter(m => m.id !== material.id)
      : [...selectedMaterials, material];
    
    const newCost = newMaterials.reduce((sum, m) => sum + m.cost, 0);
    const sustainabilityScore = newMaterials.length > 0 
      ? newMaterials.reduce((sum, m) => sum + m.sustainability.score, 0) / newMaterials.length * 10
      : 100;

    setCurrentSession(prev => prev ? {
      ...prev,
      selectedMaterials: newMaterials,
      totalCost: newCost,
      sustainabilityScore: Math.round(sustainabilityScore)
    } : null);
  }, [currentSession, selectedMaterials]);

  // Handle step completion
  const handleStepComplete = useCallback((stepId: string) => {
    if (!currentSession) return;

    const updatedSteps = currentSession.steps.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    );

    const nextStep = updatedSteps.findIndex(step => !step.completed);
    
    setCurrentSession(prev => prev ? {
      ...prev,
      steps: updatedSteps,
      currentStep: nextStep === -1 ? updatedSteps.length : nextStep
    } : null);
  }, [currentSession]);

  // Handle quality check
  const handleQualityCheck = useCallback((checkId: string, passed: boolean, notes?: string) => {
    if (!currentSession) return;

    const updatedChecks = currentSession.qualityChecks.map(check =>
      check.id === checkId ? { ...check, passed, notes } : check
    );

    setCurrentSession(prev => prev ? {
      ...prev,
      qualityChecks: updatedChecks
    } : null);
  }, [currentSession]);

  // Check if current packaging is ready
  const isPackagingReady = useMemo(() => {
    if (!currentSession) return false;
    
    const hasBox = selectedMaterials.some(m => m.type === 'box');
    const allStepsComplete = currentSession.steps.every(step => step.completed);
    const allQualityChecks = currentSession.qualityChecks.filter(c => c.required).every(c => c.passed === true);
    
    return hasBox && allStepsComplete && allQualityChecks;
  }, [currentSession, selectedMaterials]);

  // Get specific missing requirements for validation feedback
  const getMissingRequirements = useCallback(() => {
    if (!currentSession) return [];
    
    const missing: string[] = [];
    
    if (!selectedMaterials.some(m => m.type === 'box')) {
      missing.push("选择包装盒");
    }
    
    const incompleteSteps = currentSession.steps.filter(step => !step.completed);
    if (incompleteSteps.length > 0) {
      missing.push(`完成包装步骤 (剩余 ${incompleteSteps.length} 步)`);
    }
    
    const failedChecks = currentSession.qualityChecks.filter(c => c.required && c.passed !== true);
    if (failedChecks.length > 0) {
      missing.push(`通过质量检查 (剩余 ${failedChecks.length} 项)`);
    }
    
    return missing;
  }, [currentSession, selectedMaterials]);

  // Complete current item packaging
  const handleCompleteItemPackaging = useCallback(() => {
    if (!currentSession || !hasCurrentItem) return;

    // CRITICAL: Enforce packaging readiness validation
    if (!isPackagingReady) {
      const missingRequirements = getMissingRequirements();
      toast({
        title: "包装未完成",
        description: `请完成以下要求: ${missingRequirements.join(", ")}`,
        variant: "destructive",
      });
      return; // Block completion
    }

    // Calculate final dimensions based on selected box
    const selectedBox = selectedMaterials.find(m => m.type === 'box');
    const finalDimensions = selectedBox?.dimensions || currentItem.dimensions;

    // Calculate efficiency based on material choices and time
    const timeEfficiency = 100; // Simplified calculation
    const costEfficiency = currentSession.totalCost <= 10 ? 100 : Math.max(50, 100 - (currentSession.totalCost - 10) * 5);
    const materialEfficiency = selectedMaterials.length <= 4 ? 100 : Math.max(70, 100 - (selectedMaterials.length - 4) * 10);
    const efficiency = Math.round((timeEfficiency + costEfficiency + materialEfficiency) / 3);

    const completedSession: PackagingSession = {
      ...currentSession,
      finalDimensions,
      efficiency,
      completed: true,
      endTime: new Date()
    };

    setPackagingSessions(prev => [...prev, completedSession]);
    
    // Show success toast
    toast({
      title: "包装完成",
      description: `商品 "${currentItem.name}" 已成功完成包装`,
      variant: "default",
    });
    
    if (onItemPackaged) {
      onItemPackaged(currentItem.id, completedSession);
    }

    // Move to next item or complete
    if (currentItemIndex < approvedItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
      setCurrentSession(null);
      setSelectedMaterials([]);
    } else {
      // All items completed
      if (onComplete) {
        onComplete([...packagingSessions, completedSession]);
      }
    }
  }, [currentSession, hasCurrentItem, currentItem, selectedMaterials, currentItemIndex, approvedItems.length, packagingSessions, onItemPackaged, onComplete, isPackagingReady, getMissingRequirements, toast]);

  // Get fragility color
  const getFragilityColor = (level: string) => {
    switch (level) {
      case 'fragile': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fragile': return 'text-red-600 bg-red-100';
      case 'hazardous': return 'text-orange-600 bg-orange-100';
      case 'temperature-sensitive': return 'text-blue-600 bg-blue-100';
      case 'standard': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!hasCurrentItem && progress.completedItems === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">暂无待包装商品</h2>
        <p className="text-muted-foreground">所有商品已完成包装或暂无审核通过的商品</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6" data-testid="packaging-area">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground" data-testid="packaging-title">
          包装作业区域
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          智能包装指导系统，根据商品特性选择最优包装方案，确保安全高效的包装作业
        </p>
        
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>包装进度</span>
            <span>{progress.completedItems} / {progress.totalItems} 完成</span>
          </div>
          <Progress value={progress.percentage} className="h-3" data-testid="packaging-progress" />
          <div className="flex justify-center gap-6 text-sm">
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              总成本: ¥{progress.totalCost.toFixed(2)}
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              平均效率: {progress.avgEfficiency}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items to Package Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Current Item */}
          {hasCurrentItem && (
            <Card data-testid="current-item-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  当前包装商品
                </CardTitle>
                <CardDescription>
                  第 {currentItemIndex + 1} 项，共 {approvedItems.length} 项
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium" data-testid={`item-name-${currentItem.id}`}>{currentItem.name}</h3>
                    <p className="text-sm text-muted-foreground">{currentItem.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      <span>SKU: {currentItem.sku}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>数量: {currentItem.quantity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" />
                      <span>{currentItem.dimensions.length}×{currentItem.dimensions.width}×{currentItem.dimensions.height}{currentItem.dimensions.unit}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Weight className="h-3 w-3" />
                      <span>{currentItem.weight}kg</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      className={cn("text-xs", getFragilityColor(currentItem.fragilityLevel))}
                      data-testid={`fragility-${currentItem.fragilityLevel}`}
                    >
                      {currentItem.fragilityLevel === 'fragile' ? '易碎' :
                       currentItem.fragilityLevel === 'high' ? '高易碎' :
                       currentItem.fragilityLevel === 'medium' ? '中等' : '不易碎'}
                    </Badge>
                    <Badge 
                      className={cn("text-xs", getCategoryColor(currentItem.category))}
                      data-testid={`category-${currentItem.category}`}
                    >
                      {currentItem.category === 'fragile' ? '易碎品' :
                       currentItem.category === 'hazardous' ? '危险品' :
                       currentItem.category === 'temperature-sensitive' ? '温控品' : '标准品'}
                    </Badge>
                  </div>

                  {currentItem.specialHandling.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        特殊处理要求
                      </div>
                      <div className="space-y-1">
                        {currentItem.specialHandling.map((requirement, index) => (
                          <div key={index} className="text-xs bg-orange-50 dark:bg-orange-950 p-2 rounded">
                            {requirement}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items Overview */}
          <Card data-testid="items-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5" />
                包装清单
              </CardTitle>
              <CardDescription>
                已审核通过的待包装商品
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {approvedItems.map((item, index) => {
                  const session = packagingSessions.find(s => s.itemId === item.id);
                  const isCurrent = index === currentItemIndex;
                  const isCompleted = session?.completed || false;
                  
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        isCurrent && "ring-2 ring-primary bg-primary/5",
                        isCompleted && "bg-green-50 dark:bg-green-950 border-green-200"
                      )}
                      data-testid={`item-overview-${item.id}`}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : isCurrent ? (
                          <Circle className="h-5 w-5 text-primary animate-pulse" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.quantity} 件 • {item.fragilityLevel === 'fragile' ? '易碎' : '一般'}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {isCompleted && session && (
                          <Badge variant="outline" className="text-xs">
                            效率 {session.efficiency}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Packaging Materials & Process */}
        <div className="lg:col-span-2 space-y-6">
          {hasCurrentItem && currentSession && (
            <>
              {/* Packaging Material Selection */}
              <Card data-testid="material-selection-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Box className="h-5 w-5" />
                      包装材料选择
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTips(!showTips)}
                      data-testid="toggle-tips"
                    >
                      <Lightbulb className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    根据商品特性选择最适合的包装材料组合
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {showTips && (
                    <div className="mb-6 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                        <Lightbulb className="h-4 w-4" />
                        包装建议
                      </div>
                      <div className="space-y-2">
                        {getPackagingTips(currentItem, availablePackaging).map((tip, index) => (
                          <div key={index} className="text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                            {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Material Categories */}
                  <div className="space-y-6">
                    {/* Boxes */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        包装盒类型
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availablePackaging.filter(m => m.type === 'box').map(material => {
                          const isSelected = selectedMaterials.some(m => m.id === material.id);
                          const isRecommended = material.suitableFor.some(category => 
                            currentItem.category.includes(category) || 
                            currentItem.packagingRequirements.some(req => req.includes(category))
                          );
                          
                          return (
                            <div
                              key={material.id}
                              className={cn(
                                "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md",
                                isSelected && "ring-2 ring-primary bg-primary/5",
                                isRecommended && "border-blue-300 bg-blue-50 dark:bg-blue-950"
                              )}
                              onClick={() => handleMaterialSelection(material)}
                              data-testid={`material-${material.id}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-2xl">{material.icon}</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-medium text-sm">{material.name}</h5>
                                    {isRecommended && (
                                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {material.description}
                                  </p>
                                  
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <span>¥{material.cost}</span>
                                      <div className="flex items-center gap-1">
                                        <TreePine className="h-3 w-3" />
                                        <span>{material.sustainability.score}/10</span>
                                      </div>
                                    </div>
                                    {material.dimensions && (
                                      <span className="text-muted-foreground">
                                        {material.dimensions.length}×{material.dimensions.width}×{material.dimensions.height}{material.dimensions.unit}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {material.features.slice(0, 2).map(feature => (
                                      <Badge key={feature} variant="outline" className="text-xs">
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Protection Materials */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        保护材料
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {availablePackaging.filter(m => m.type === 'protection').map(material => {
                          const isSelected = selectedMaterials.some(m => m.id === material.id);
                          
                          return (
                            <div
                              key={material.id}
                              className={cn(
                                "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md",
                                isSelected && "ring-2 ring-primary bg-primary/5"
                              )}
                              onClick={() => handleMaterialSelection(material)}
                              data-testid={`protection-${material.id}`}
                            >
                              <div className="text-center space-y-2">
                                <div className="text-2xl">{material.icon}</div>
                                <h5 className="font-medium text-sm">{material.name}</h5>
                                <div className="flex items-center justify-center gap-2 text-xs">
                                  <span>¥{material.cost}</span>
                                  <div className="flex items-center gap-1">
                                    <TreePine className="h-3 w-3" />
                                    <span>{material.sustainability.score}/10</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Specialty Materials for special categories */}
                    {(currentItem.category === 'hazardous' || currentItem.category === 'temperature-sensitive') && (
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          专用材料
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {availablePackaging.filter(m => 
                            m.type === 'specialty' && 
                            m.suitableFor.some(category => currentItem.category.includes(category))
                          ).map(material => {
                            const isSelected = selectedMaterials.some(m => m.id === material.id);
                            
                            return (
                              <div
                                key={material.id}
                                className={cn(
                                  "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md border-orange-300",
                                  isSelected && "ring-2 ring-primary bg-primary/5"
                                )}
                                onClick={() => handleMaterialSelection(material)}
                                data-testid={`specialty-${material.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-2xl">{material.icon}</div>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-sm">{material.name}</h5>
                                    <p className="text-xs text-muted-foreground">{material.description}</p>
                                    <div className="flex items-center gap-2 text-xs mt-1">
                                      <span>¥{material.cost}</span>
                                      <Badge variant="outline" className="text-xs">必需</Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Materials Summary */}
                  {selectedMaterials.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <Separator />
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          已选材料
                        </h4>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            总成本: ¥{currentSession.totalCost.toFixed(2)}
                          </span>
                          <span className="flex items-center gap-1">
                            <TreePine className="h-3 w-3" />
                            环保分: {currentSession.sustainabilityScore}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedMaterials.map(material => (
                          <Badge key={material.id} variant="secondary" className="text-xs">
                            {material.icon} {material.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Packaging Process Simulation */}
              <Card data-testid="packaging-process-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    包装流程指导
                  </CardTitle>
                  <CardDescription>
                    按步骤完成包装作业，确保包装质量和安全
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentSession.steps.map((step, index) => {
                      const isCurrentStep = index === currentSession.currentStep;
                      const isCompleted = step.completed;
                      const isAccessible = index <= currentSession.currentStep;
                      
                      return (
                        <div
                          key={step.id}
                          className={cn(
                            "border rounded-lg p-4 transition-all",
                            isCurrentStep && "ring-2 ring-primary bg-primary/5",
                            isCompleted && "bg-green-50 dark:bg-green-950 border-green-200",
                            !isAccessible && "opacity-50"
                          )}
                          data-testid={`step-${step.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {isCompleted ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : isCurrentStep ? (
                                <Circle className="h-5 w-5 text-primary" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">
                                  步骤 {step.stepNumber}: {step.title}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {Math.ceil(step.estimatedTime / 60)} 分钟
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-3">
                                {step.description}
                              </p>
                              
                              <div className="space-y-2">
                                <h5 className="text-sm font-medium">操作步骤:</h5>
                                <ul className="text-sm space-y-1">
                                  {step.instructions.map((instruction, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="flex-shrink-0 w-4 h-4 bg-primary/10 rounded-full flex items-center justify-center text-xs mt-0.5">
                                        {i + 1}
                                      </span>
                                      <span>{instruction}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              {step.safetyNotes && step.safetyNotes.length > 0 && (
                                <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950 rounded border-l-4 border-orange-300">
                                  <div className="flex items-center gap-1 text-sm font-medium text-orange-600 mb-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    安全提示
                                  </div>
                                  <ul className="text-xs space-y-1">
                                    {step.safetyNotes.map((note, i) => (
                                      <li key={i}>• {note}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {step.tips && step.tips.length > 0 && (
                                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                                  <div className="flex items-center gap-1 text-sm font-medium text-blue-600 mb-1">
                                    <Lightbulb className="h-3 w-3" />
                                    操作提示
                                  </div>
                                  <ul className="text-xs space-y-1">
                                    {step.tips.map((tip, i) => (
                                      <li key={i}>• {tip}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {isCurrentStep && !isCompleted && (
                                <div className="mt-4">
                                  <Button
                                    onClick={() => handleStepComplete(step.id)}
                                    className="w-full"
                                    data-testid={`complete-step-${step.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    完成此步骤
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quality & Compliance Checks */}
              <Card data-testid="quality-checks-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    质量检查
                  </CardTitle>
                  <CardDescription>
                    确保包装符合质量标准和运输要求
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentSession.qualityChecks.map(check => (
                      <div
                        key={check.id}
                        className={cn(
                          "border rounded-lg p-4",
                          check.passed === true && "bg-green-50 dark:bg-green-950 border-green-200",
                          check.passed === false && "bg-red-50 dark:bg-red-950 border-red-200"
                        )}
                        data-testid={`quality-check-${check.id}`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium flex items-center gap-2">
                              {check.type === 'integrity' && <Shield className="h-4 w-4" />}
                              {check.type === 'labeling' && <Archive className="h-4 w-4" />}
                              {check.type === 'weight' && <Scale className="h-4 w-4" />}
                              {check.type === 'dimensions' && <Ruler className="h-4 w-4" />}
                              {check.type === 'compliance' && <CheckSquare className="h-4 w-4" />}
                              {check.name}
                              {check.required && (
                                <Badge variant="destructive" className="text-xs">必检</Badge>
                              )}
                            </h4>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={check.passed === true ? "default" : "outline"}
                                onClick={() => handleQualityCheck(check.id, true)}
                                data-testid={`check-pass-${check.id}`}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                通过
                              </Button>
                              <Button
                                size="sm"
                                variant={check.passed === false ? "destructive" : "outline"}
                                onClick={() => handleQualityCheck(check.id, false)}
                                data-testid={`check-fail-${check.id}`}
                              >
                                <X className="h-3 w-3 mr-1" />
                                不通过
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {check.description}
                          </p>
                          
                          <div className="space-y-1">
                            <h5 className="text-sm font-medium">检查项目:</h5>
                            <ul className="text-sm space-y-1">
                              {check.criteria.map((criterion, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-muted-foreground" />
                                  {criterion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Final Packaging Approval */}
                  <div className="mt-6 space-y-4">
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <PackageCheck className="h-4 w-4" />
                        包装完成确认
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Scale className="h-4 w-4 text-muted-foreground" />
                            <span>预估总重量: {currentSession.totalWeight.toFixed(2)} kg</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>包装成本: ¥{currentSession.totalCost.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <TreePine className="h-4 w-4 text-muted-foreground" />
                            <span>环保评分: {currentSession.sustainabilityScore}/100</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span>预计效率: {currentSession.efficiency}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleCompleteItemPackaging}
                        disabled={!isPackagingReady}
                        className="w-full"
                        data-testid="complete-packaging"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        完成包装
                      </Button>
                      
                      {!isPackagingReady && (
                        <div className="space-y-2">
                          <div className="text-xs text-destructive font-medium text-center flex items-center justify-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            包装要求未满足
                          </div>
                          <div className="text-xs text-muted-foreground text-center">
                            待完成: {getMissingRequirements().join(" • ")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Completion Status */}
      {progress.completedItems === progress.totalItems && progress.totalItems > 0 && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
              所有商品包装完成！
            </h2>
            <div className="flex justify-center gap-6 text-sm text-green-700 dark:text-green-300">
              <span>总成本: ¥{progress.totalCost.toFixed(2)}</span>
              <span>平均效率: {progress.avgEfficiency}%</span>
              <span>商品数量: {progress.totalItems} 件</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}