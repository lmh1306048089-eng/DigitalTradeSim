import { useState, useCallback, useEffect, useMemo } from "react";
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  Package,
  Scale,
  Ruler,
  Calendar,
  Camera,
  FileX,
  RotateCcw,
  ArrowRight,
  CheckSquare,
  X,
  AlertCircle,
  Clock,
  Target,
  Hash,
  Info,
  Trash2,
  Archive,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Type definitions for quality inspection
interface PickedItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  quantityPicked: number;
  expectedQuantity: number;
  location: string;
  price: number;
  weight: number;
  dimensions: string;
  expirationDate?: string;
  batchNumber?: string;
  imageUrl?: string;
}

interface InspectionCriterion {
  id: string;
  name: string;
  description: string;
  type: 'visual' | 'measurement' | 'condition' | 'expiration' | 'quantity';
  required: boolean;
  passed?: boolean;
  notes?: string;
  options?: string[];
  selectedOption?: string;
  measuredValue?: string;
  expectedValue?: string;
  tolerance?: string;
}

interface QualityIssue {
  id: string;
  type: 'damage' | 'defect' | 'expiration' | 'quantity' | 'mislabel' | 'packaging';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  photoRequired: boolean;
  actionRequired: 'reject' | 'replace' | 'accept_with_note' | 'escalate';
}

interface InspectionResult {
  itemId: string;
  overallStatus: 'pending' | 'passed' | 'failed' | 'conditional';
  qualityScore: number; // 0-100
  criteria: InspectionCriterion[];
  issues: QualityIssue[];
  inspectorNotes: string;
  timestamp: Date;
  actionTaken: 'approved' | 'rejected' | 'replacement_requested' | 'pending';
  rejectionReason?: string;
  photosAttached: number;
}

interface QualityInspectionAreaProps {
  pickedItems: PickedItem[];
  onItemApproved?: (itemId: string, result: InspectionResult) => void;
  onItemRejected?: (itemId: string, result: InspectionResult, reason: string) => void;
  onReplacementRequested?: (itemId: string, result: InspectionResult) => void;
  onComplete?: (results: InspectionResult[]) => void;
  orderId?: string;
}

// Sample data for demonstration
const samplePickedItems: PickedItem[] = [
  {
    id: "ITEM-001",
    sku: "ELEC-PHONE-001",
    name: "智能手机保护壳",
    description: "适用于iPhone 15的透明保护壳，TPU材质",
    category: "电子配件",
    quantityPicked: 2,
    expectedQuantity: 2,
    location: "A1-B3-C2",
    price: 35.99,
    weight: 0.15,
    dimensions: "15×8×1cm",
    imageUrl: "/api/placeholder/200/200"
  },
  {
    id: "ITEM-002",
    sku: "HOME-TOWEL-003",
    name: "纯棉毛巾套装",
    description: "100%纯棉毛巾，3件套装（大中小）",
    category: "家居纺织",
    quantityPicked: 1,
    expectedQuantity: 1,
    location: "B2-A1-D4",
    price: 28.50,
    weight: 0.8,
    dimensions: "35×25×5cm",
    imageUrl: "/api/placeholder/200/200"
  },
  {
    id: "ITEM-003",
    sku: "FOOD-SNACK-125",
    name: "进口巧克力饼干",
    description: "比利时进口巧克力夹心饼干，180g装",
    category: "食品",
    quantityPicked: 3,
    expectedQuantity: 3,
    location: "C3-B2-A1",
    price: 12.99,
    weight: 0.18,
    dimensions: "20×15×3cm",
    expirationDate: "2024-12-31",
    batchNumber: "BT20241001",
    imageUrl: "/api/placeholder/200/200"
  },
  {
    id: "ITEM-004",
    sku: "HEALTH-VIT-012",
    name: "维生素C片剂",
    description: "维生素C咀嚼片，橙味，100片装",
    category: "营养保健",
    quantityPicked: 3,
    expectedQuantity: 3,
    location: "D1-C4-B2",
    price: 19.99,
    weight: 0.3,
    dimensions: "8×8×6cm",
    expirationDate: "2025-06-30",
    batchNumber: "VT20241205",
    imageUrl: "/api/placeholder/200/200"
  }
];

// Quality inspection criteria templates by category
const getInspectionCriteria = (item: PickedItem): InspectionCriterion[] => {
  const baseAriteria: InspectionCriterion[] = [
    {
      id: "quantity-check",
      name: "数量核实",
      description: "确认拣货数量与订单数量一致",
      type: "quantity",
      required: true,
      expectedValue: item.expectedQuantity.toString(),
      measuredValue: item.quantityPicked.toString()
    },
    {
      id: "packaging-integrity",
      name: "包装完整性",
      description: "检查产品包装是否完好无损",
      type: "visual",
      required: true,
      options: ["完好", "轻微磨损", "明显损坏", "严重破损"]
    },
    {
      id: "label-accuracy",
      name: "标签准确性",
      description: "验证产品标签信息与订单匹配",
      type: "visual",
      required: true,
      options: ["正确", "部分错误", "完全错误", "标签缺失"]
    },
    {
      id: "physical-condition",
      name: "物理状态",
      description: "检查产品外观和物理状态",
      type: "condition",
      required: true,
      options: ["全新", "良好", "轻微瑕疵", "明显缺陷", "损坏"]
    }
  ];

  // Add category-specific criteria
  if (item.category === "食品" || item.category === "营养保健") {
    baseAriteria.push({
      id: "expiration-check",
      name: "保质期检查",
      description: "确认产品未过期且保质期充足",
      type: "expiration",
      required: true,
      expectedValue: item.expirationDate,
      options: ["有效期内", "即将过期(30天内)", "已过期", "无法确定"]
    });
  }

  if (item.weight > 0) {
    baseAriteria.push({
      id: "weight-verification",
      name: "重量验证",
      description: "测量并验证产品重量",
      type: "measurement",
      required: false,
      expectedValue: `${item.weight}kg`,
      tolerance: "±5%"
    });
  }

  return baseAriteria;
};

// Common quality issues database
const qualityIssuesDB: QualityIssue[] = [
  {
    id: "packaging-damage",
    type: "damage",
    severity: "medium",
    description: "包装破损或变形",
    photoRequired: true,
    actionRequired: "reject"
  },
  {
    id: "product-defect",
    type: "defect",
    severity: "high",
    description: "产品本身存在缺陷",
    photoRequired: true,
    actionRequired: "replace"
  },
  {
    id: "expiration-issue",
    type: "expiration",
    severity: "critical",
    description: "产品已过期或即将过期",
    photoRequired: false,
    actionRequired: "reject"
  },
  {
    id: "quantity-mismatch",
    type: "quantity",
    severity: "high",
    description: "数量与订单不符",
    photoRequired: false,
    actionRequired: "escalate"
  },
  {
    id: "wrong-label",
    type: "mislabel",
    severity: "high",
    description: "标签信息错误",
    photoRequired: true,
    actionRequired: "replace"
  },
  {
    id: "packaging-issue",
    type: "packaging",
    severity: "low",
    description: "包装外观问题",
    photoRequired: true,
    actionRequired: "accept_with_note"
  }
];

export function QualityInspectionArea({
  pickedItems = samplePickedItems,
  onItemApproved,
  onItemRejected,
  onReplacementRequested,
  onComplete,
  orderId = "ORD-2024-001234"
}: QualityInspectionAreaProps) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [inspectionResults, setInspectionResults] = useState<InspectionResult[]>([]);
  const [currentCriteria, setCurrentCriteria] = useState<InspectionCriterion[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<QualityIssue[]>([]);
  const [inspectorNotes, setInspectorNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [photosAttached, setPhotosAttached] = useState(0);
  const [isInspecting, setIsInspecting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get current item
  const currentItem = pickedItems[currentItemIndex];
  const hasCurrentItem = currentItem && currentItemIndex < pickedItems.length;

  // Initialize criteria for current item
  useEffect(() => {
    if (hasCurrentItem) {
      setCurrentCriteria(getInspectionCriteria(currentItem));
      setSelectedIssues([]);
      setInspectorNotes("");
      setRejectionReason("");
      setPhotosAttached(0);
    }
  }, [currentItemIndex, hasCurrentItem, currentItem]);

  // Calculate inspection progress
  const progress = useMemo(() => {
    const totalItems = pickedItems.length;
    const completedItems = inspectionResults.length;
    const passedItems = inspectionResults.filter(r => r.overallStatus === "passed").length;
    const failedItems = inspectionResults.filter(r => r.overallStatus === "failed").length;
    const conditionalItems = inspectionResults.filter(r => r.overallStatus === "conditional").length;
    
    return {
      totalItems,
      completedItems,
      passedItems,
      failedItems,
      conditionalItems,
      percentage: totalItems > 0 ? (completedItems / totalItems) * 100 : 0
    };
  }, [pickedItems, inspectionResults]);

  // Calculate quality score based on criteria results
  const calculateQualityScore = useCallback((criteria: InspectionCriterion[], issues: QualityIssue[]): number => {
    const totalCriteria = criteria.length;
    const passedCriteria = criteria.filter(c => c.passed === true).length;
    const baseScore = totalCriteria > 0 ? (passedCriteria / totalCriteria) * 100 : 0;
    
    // Deduct points for issues
    const issueDeductions = issues.reduce((total, issue) => {
      switch (issue.severity) {
        case 'critical': return total - 30;
        case 'high': return total - 20;
        case 'medium': return total - 10;
        case 'low': return total - 5;
        default: return total;
      }
    }, 0);

    return Math.max(0, Math.min(100, baseScore + issueDeductions));
  }, []);

  // Handle criterion change
  const handleCriterionChange = useCallback((criterionId: string, passed: boolean, notes?: string, selectedOption?: string, measuredValue?: string) => {
    setCurrentCriteria(prev => prev.map(criterion => 
      criterion.id === criterionId 
        ? { ...criterion, passed, notes, selectedOption, measuredValue }
        : criterion
    ));
  }, []);

  // Handle issue selection
  const handleIssueToggle = useCallback((issue: QualityIssue, selected: boolean) => {
    setSelectedIssues(prev => {
      if (selected) {
        return [...prev, issue];
      } else {
        return prev.filter(i => i.id !== issue.id);
      }
    });
  }, []);

  // Determine overall status based on criteria and issues
  const getOverallStatus = useCallback((criteria: InspectionCriterion[], issues: QualityIssue[]): 'passed' | 'failed' | 'conditional' => {
    const hasFailedRequiredCriteria = criteria.some(c => c.required && c.passed === false);
    const hasCriticalIssues = issues.some(i => i.severity === 'critical');
    const hasHighIssues = issues.some(i => i.severity === 'high');
    
    if (hasFailedRequiredCriteria || hasCriticalIssues) {
      return 'failed';
    } else if (hasHighIssues || issues.length > 0) {
      return 'conditional';
    }
    return 'passed';
  }, []);

  // Handle item approval
  const handleApproveItem = useCallback(() => {
    if (!hasCurrentItem) return;

    // Validate approval eligibility inline
    const errors: string[] = [];
    const overallStatus = getOverallStatus(currentCriteria, selectedIssues);
    const requiredCriteriaComplete = currentCriteria
      .filter(c => c.required)
      .every(c => c.passed !== undefined);
    
    // Check if inspection is complete
    if (!requiredCriteriaComplete) {
      errors.push("请完成所有必检项目的检验");
    }
    
    // Check if item actually passes quality standards
    if (overallStatus === 'failed') {
      errors.push("该商品存在严重质量问题，无法批准通过");
    }
    
    // Check for critical issues
    const criticalIssues = selectedIssues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      errors.push(`存在${criticalIssues.length}个严重质量问题，必须处理后才能批准`);
    }
    
    // Check required criteria failures
    const failedRequiredCriteria = currentCriteria.filter(c => c.required && c.passed === false);
    if (failedRequiredCriteria.length > 0) {
      errors.push(`${failedRequiredCriteria.length}个必检项目不符合标准`);
    }
    
    // Validate approval eligibility
    const canApprove = errors.length === 0 && overallStatus === 'passed';
    if (!canApprove) {
      setValidationErrors(errors);
      return;
    }

    const qualityScore = calculateQualityScore(currentCriteria, selectedIssues);

    const result: InspectionResult = {
      itemId: currentItem.id,
      overallStatus, // Use computed status instead of hard-coded 'passed'
      qualityScore,
      criteria: [...currentCriteria],
      issues: [...selectedIssues],
      inspectorNotes,
      timestamp: new Date(),
      actionTaken: 'approved',
      photosAttached
    };

    setInspectionResults(prev => [...prev, result]);
    setValidationErrors([]); // Clear validation errors on success
    
    if (onItemApproved) {
      onItemApproved(currentItem.id, result);
    }

    // Move to next item or complete
    if (currentItemIndex < pickedItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
    } else {
      // Complete the inspection
      if (onComplete) {
        onComplete([...inspectionResults, result]);
      }
    }
  }, [hasCurrentItem, currentItem, currentCriteria, selectedIssues, inspectorNotes, photosAttached, currentItemIndex, pickedItems.length, inspectionResults, getOverallStatus, calculateQualityScore, onItemApproved, onComplete]);

  // Handle item rejection
  const handleRejectItem = useCallback(() => {
    if (!hasCurrentItem || !rejectionReason) return;

    const overallStatus = getOverallStatus(currentCriteria, selectedIssues);
    const qualityScore = calculateQualityScore(currentCriteria, selectedIssues);

    const result: InspectionResult = {
      itemId: currentItem.id,
      overallStatus, // Use computed status instead of hard-coded 'failed'
      qualityScore,
      criteria: [...currentCriteria],
      issues: [...selectedIssues],
      inspectorNotes,
      timestamp: new Date(),
      actionTaken: 'rejected',
      rejectionReason,
      photosAttached
    };

    setInspectionResults(prev => [...prev, result]);
    setValidationErrors([]); // Clear validation errors
    
    if (onItemRejected) {
      onItemRejected(currentItem.id, result, rejectionReason);
    }

    // Move to next item or complete
    if (currentItemIndex < pickedItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
    } else {
      handleComplete([...inspectionResults, result]);
    }
  }, [hasCurrentItem, currentItem, rejectionReason, currentCriteria, selectedIssues, inspectorNotes, photosAttached, currentItemIndex, pickedItems.length, inspectionResults, getOverallStatus, calculateQualityScore, onItemRejected]);

  // Handle replacement request
  const handleRequestReplacement = useCallback(() => {
    if (!hasCurrentItem) return;

    const overallStatus = getOverallStatus(currentCriteria, selectedIssues);
    const qualityScore = calculateQualityScore(currentCriteria, selectedIssues);

    const result: InspectionResult = {
      itemId: currentItem.id,
      overallStatus, // Use computed status instead of hard-coded 'failed'
      qualityScore,
      criteria: [...currentCriteria],
      issues: [...selectedIssues],
      inspectorNotes,
      timestamp: new Date(),
      actionTaken: 'replacement_requested',
      photosAttached
    };

    setInspectionResults(prev => [...prev, result]);
    setValidationErrors([]); // Clear validation errors
    
    if (onReplacementRequested) {
      onReplacementRequested(currentItem.id, result);
    }

    // Move to next item or complete
    if (currentItemIndex < pickedItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
    } else {
      handleComplete([...inspectionResults, result]);
    }
  }, [hasCurrentItem, currentItem, currentCriteria, selectedIssues, inspectorNotes, photosAttached, currentItemIndex, pickedItems.length, inspectionResults, getOverallStatus, calculateQualityScore, onReplacementRequested]);

  // Handle completion
  const handleComplete = useCallback((finalResults: InspectionResult[]) => {
    if (onComplete) {
      onComplete(finalResults);
    }
  }, [onComplete]);

  // Handle mark as reviewed (skip to next)
  const handleMarkAsReviewed = useCallback(() => {
    if (currentItemIndex < pickedItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
    } else {
      handleComplete(inspectionResults);
    }
  }, [currentItemIndex, pickedItems.length, inspectionResults, handleComplete]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900';
      case 'conditional': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Check if current inspection is complete
  const isCurrentInspectionComplete = useMemo(() => {
    const requiredCriteriaComplete = currentCriteria
      .filter(c => c.required)
      .every(c => c.passed !== undefined);
    return requiredCriteriaComplete;
  }, [currentCriteria]);

  // Calculate current overall status and validate for approval
  const currentOverallStatus = useMemo(() => {
    return getOverallStatus(currentCriteria, selectedIssues);
  }, [currentCriteria, selectedIssues, getOverallStatus]);

  // Validation for approval action
  const approvalValidation = useMemo(() => {
    const errors: string[] = [];
    
    // Check if inspection is complete
    if (!isCurrentInspectionComplete) {
      errors.push("请完成所有必检项目的检验");
    }
    
    // Check if item actually passes quality standards
    if (currentOverallStatus === 'failed') {
      errors.push("该商品存在严重质量问题，无法批准通过");
    }
    
    // Check for critical issues
    const criticalIssues = selectedIssues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      errors.push(`存在${criticalIssues.length}个严重质量问题，必须处理后才能批准`);
    }
    
    // Check required criteria failures
    const failedRequiredCriteria = currentCriteria.filter(c => c.required && c.passed === false);
    if (failedRequiredCriteria.length > 0) {
      errors.push(`${failedRequiredCriteria.length}个必检项目不符合标准`);
    }
    
    return {
      canApprove: errors.length === 0 && currentOverallStatus === 'passed',
      errors
    };
  }, [isCurrentInspectionComplete, currentOverallStatus, selectedIssues, currentCriteria]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6" data-testid="quality-inspection-area">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground" data-testid="inspection-title">
          质量检验区域
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          对拣选的商品进行质量检验，确保发货准确性和产品质量标准
        </p>
        
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>检验进度</span>
            <span>{progress.completedItems} / {progress.totalItems} 完成</span>
          </div>
          <Progress value={progress.percentage} className="h-3" data-testid="inspection-progress" />
          <div className="flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              通过: {progress.passedItems}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              条件通过: {progress.conditionalItems}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              不通过: {progress.failedItems}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Inspection Overview Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Items List */}
          <Card data-testid="items-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                待检验商品清单
              </CardTitle>
              <CardDescription>
                订单 {orderId} - 共 {pickedItems.length} 件商品
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pickedItems.map((item, index) => {
                  const result = inspectionResults.find(r => r.itemId === item.id);
                  const isCurrent = index === currentItemIndex;
                  
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        isCurrent && "ring-2 ring-primary bg-primary/5",
                        result && getStatusColor(result.overallStatus)
                      )}
                      data-testid={`overview-item-${item.id}`}
                    >
                      <div className="flex-shrink-0">
                        {result ? (
                          result.overallStatus === 'passed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : result.overallStatus === 'failed' ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          )
                        ) : isCurrent ? (
                          <Search className="h-5 w-5 text-primary animate-pulse" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          SKU: {item.sku} | 数量: {item.quantityPicked}
                        </div>
                        {result && (
                          <div className="text-xs">
                            质量评分: {result.qualityScore}/100
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Inspection Summary */}
          {progress.completedItems > 0 && (
            <Card data-testid="inspection-summary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  检验汇总
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>平均质量评分:</span>
                    <span className="font-bold">
                      {inspectionResults.length > 0 
                        ? Math.round(inspectionResults.reduce((sum, r) => sum + r.qualityScore, 0) / inspectionResults.length)
                        : 0}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>检验效率:</span>
                    <span className="font-bold">{Math.round(progress.percentage)}%</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">状态分布:</div>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div className="text-center p-1 bg-green-100 rounded">
                        通过<br/><span className="font-bold">{progress.passedItems}</span>
                      </div>
                      <div className="text-center p-1 bg-yellow-100 rounded">
                        条件<br/><span className="font-bold">{progress.conditionalItems}</span>
                      </div>
                      <div className="text-center p-1 bg-red-100 rounded">
                        不通过<br/><span className="font-bold">{progress.failedItems}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Inspection Interface */}
        <div className="lg:col-span-2 space-y-6">
          {hasCurrentItem ? (
            <>
              {/* Current Item Details */}
              <Card data-testid="current-item-details">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      正在检验商品 ({currentItemIndex + 1}/{pickedItems.length})
                    </CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {currentItem.sku}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Item Image */}
                    <div className="space-y-3">
                      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        {currentItem.imageUrl ? (
                          <img 
                            src={currentItem.imageUrl} 
                            alt={currentItem.name}
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
                        ) : (
                          <Package className="h-16 w-16 text-gray-400" />
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setPhotosAttached(prev => prev + 1)}
                        data-testid="button-add-photo"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        添加检验照片 ({photosAttached})
                      </Button>
                    </div>

                    {/* Item Information */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-bold text-lg" data-testid="current-item-name">{currentItem.name}</h3>
                        <p className="text-sm text-muted-foreground">{currentItem.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>数量: <span className="font-medium">{currentItem.quantityPicked}/{currentItem.expectedQuantity}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-muted-foreground" />
                          <span>重量: <span className="font-medium">{currentItem.weight}kg</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-muted-foreground" />
                          <span>尺寸: <span className="font-medium">{currentItem.dimensions}</span></span>
                        </div>
                        {currentItem.expirationDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>保质期: <span className="font-medium">{currentItem.expirationDate}</span></span>
                          </div>
                        )}
                      </div>
                      
                      <Badge className="w-fit">{currentItem.category}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quality Check Interface */}
              <Card data-testid="quality-check-interface">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    质量检验清单
                  </CardTitle>
                  <CardDescription>
                    请逐项检查以下质量标准，标有"*"的为必检项目
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {currentCriteria.map((criterion) => (
                      <div 
                        key={criterion.id} 
                        className="space-y-3 p-4 border rounded-lg"
                        data-testid={`criterion-${criterion.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium flex items-center gap-1">
                            {criterion.name}
                            {criterion.required && <span className="text-red-500">*</span>}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {criterion.type === 'visual' && '目视检查'}
                            {criterion.type === 'measurement' && '测量验证'}
                            {criterion.type === 'condition' && '状态评估'}
                            {criterion.type === 'expiration' && '保质期检查'}
                            {criterion.type === 'quantity' && '数量核实'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{criterion.description}</p>
                        
                        {criterion.type === 'quantity' && (
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>期望数量: <span className="font-medium">{criterion.expectedValue}</span></div>
                            <div>实际数量: <span className="font-medium">{criterion.measuredValue}</span></div>
                          </div>
                        )}
                        
                        {criterion.type === 'measurement' && (
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>期望值: <span className="font-medium">{criterion.expectedValue}</span></div>
                            <div>容差: <span className="font-medium">{criterion.tolerance}</span></div>
                            <div>
                              <input
                                type="text"
                                placeholder="测量值"
                                className="w-full px-2 py-1 border rounded text-sm"
                                value={criterion.measuredValue || ""}
                                onChange={(e) => handleCriterionChange(criterion.id, true, criterion.notes, criterion.selectedOption, e.target.value)}
                                data-testid={`input-measured-${criterion.id}`}
                              />
                            </div>
                          </div>
                        )}
                        
                        {criterion.options && (
                          <RadioGroup
                            value={criterion.selectedOption || ""}
                            onValueChange={(value) => {
                              const passed = value === criterion.options![0]; // First option is usually "good"
                              handleCriterionChange(criterion.id, passed, criterion.notes, value);
                            }}
                            data-testid={`radio-group-${criterion.id}`}
                          >
                            <div className="grid grid-cols-2 gap-2">
                              {criterion.options.map((option, index) => (
                                <div key={option} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option} id={`${criterion.id}-${index}`} />
                                  <label 
                                    htmlFor={`${criterion.id}-${index}`} 
                                    className="text-sm cursor-pointer"
                                  >
                                    {option}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        )}
                        
                        {!criterion.options && criterion.type !== 'quantity' && criterion.type !== 'measurement' && (
                          <div className="flex gap-2">
                            <Button
                              variant={criterion.passed === true ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleCriterionChange(criterion.id, true, criterion.notes)}
                              data-testid={`button-pass-${criterion.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              通过
                            </Button>
                            <Button
                              variant={criterion.passed === false ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => handleCriterionChange(criterion.id, false, criterion.notes)}
                              data-testid={`button-fail-${criterion.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              不通过
                            </Button>
                          </div>
                        )}
                        
                        {criterion.passed !== undefined && (
                          <div className="mt-2">
                            <Textarea
                              placeholder="检验备注..."
                              value={criterion.notes || ""}
                              onChange={(e) => handleCriterionChange(criterion.id, criterion.passed!, e.target.value, criterion.selectedOption, criterion.measuredValue)}
                              className="text-sm"
                              rows={2}
                              data-testid={`textarea-notes-${criterion.id}`}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quality Issues Reporting */}
              <Card data-testid="quality-issues-reporting">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    质量问题报告
                  </CardTitle>
                  <CardDescription>
                    如发现质量问题，请选择相应的问题类型
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {qualityIssuesDB.map((issue) => {
                      const isSelected = selectedIssues.some(i => i.id === issue.id);
                      
                      return (
                        <div
                          key={issue.id}
                          className={cn(
                            "p-3 border rounded-lg cursor-pointer transition-all",
                            isSelected && "ring-2 ring-primary bg-primary/5"
                          )}
                          onClick={() => handleIssueToggle(issue, !isSelected)}
                          data-testid={`issue-option-${issue.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              checked={isSelected}
                              onChange={() => {}}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{issue.description}</span>
                                <Badge className={cn("text-xs", getSeverityColor(issue.severity))}>
                                  {issue.severity === 'critical' && '严重'}
                                  {issue.severity === 'high' && '高'}
                                  {issue.severity === 'medium' && '中'}
                                  {issue.severity === 'low' && '低'}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                处理方式: {
                                  issue.actionRequired === 'reject' ? '拒收' :
                                  issue.actionRequired === 'replace' ? '换货' :
                                  issue.actionRequired === 'accept_with_note' ? '备注接收' : '上报处理'
                                }
                                {issue.photoRequired && ' (需要拍照)'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedIssues.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="text-sm font-medium">已选择的问题:</div>
                      <div className="space-y-2">
                        {selectedIssues.map((issue) => (
                          <div key={issue.id} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950 rounded">
                            <span className="text-sm">{issue.description}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleIssueToggle(issue, false)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inspector Notes */}
              <Card data-testid="inspector-notes">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    检验员备注
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="请输入检验备注、发现的问题或特殊说明..."
                    value={inspectorNotes}
                    onChange={(e) => setInspectorNotes(e.target.value)}
                    rows={3}
                    data-testid="textarea-inspector-notes"
                  />
                </CardContent>
              </Card>

              {/* Decision Actions */}
              <Card data-testid="decision-actions">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    检验决策
                  </CardTitle>
                  <CardDescription>
                    根据检验结果选择相应的处理方式
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Quality Score Preview */}
                    {isCurrentInspectionComplete && (
                      <div className={cn(
                        "p-3 rounded-lg",
                        currentOverallStatus === 'passed' ? "bg-green-50 dark:bg-green-900/20" :
                        currentOverallStatus === 'failed' ? "bg-red-50 dark:bg-red-900/20" :
                        "bg-yellow-50 dark:bg-yellow-900/20"
                      )}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">预估质量评分:</span>
                          <span className="text-lg font-bold">
                            {calculateQualityScore(currentCriteria, selectedIssues)}/100
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">状态:</span>
                          <Badge 
                            className={cn(
                              "text-xs",
                              currentOverallStatus === 'passed' ? "bg-green-100 text-green-800" :
                              currentOverallStatus === 'failed' ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            )}
                          >
                            {currentOverallStatus === 'passed' ? '✓ 通过' : 
                             currentOverallStatus === 'failed' ? '✗ 不通过' : '⚠ 条件通过'}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Validation Error Messages */}
                    {validationErrors.length > 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" data-testid="validation-errors">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800 dark:text-red-200">质量检验问题</span>
                        </div>
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-red-500 mt-0.5">•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                          请解决上述问题后才能批准该商品
                        </div>
                      </div>
                    )}

                    {/* Quality Control Guidelines */}
                    {!approvalValidation.canApprove && validationErrors.length === 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg" data-testid="quality-guidelines">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">质量控制指引</span>
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <p>• 请完成所有必检项目的检验</p>
                          <p>• 只有通过所有质量标准的商品才能被批准</p>
                          <p>• 存在质量问题的商品请选择拒收或申请换货</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid gap-3 md:grid-cols-2">
                      <Button
                        className={cn(
                          "w-full",
                          approvalValidation.canApprove ? "bg-green-600 hover:bg-green-700" : ""
                        )}
                        disabled={!approvalValidation.canApprove}
                        onClick={handleApproveItem}
                        data-testid="button-approve-item"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {approvalValidation.canApprove ? "✓ 批准商品" : "无法批准"}
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleRequestReplacement}
                        disabled={selectedIssues.length === 0 && currentOverallStatus === 'passed'}
                        data-testid="button-request-replacement"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        申请换货
                      </Button>
                    </div>

                    {/* Rejection Section */}
                    <div className="space-y-3">
                      <Textarea
                        placeholder="拒收原因 (必填)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={2}
                        data-testid="textarea-rejection-reason"
                      />
                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={!rejectionReason.trim() || !isCurrentInspectionComplete}
                        onClick={handleRejectItem}
                        data-testid="button-reject-item"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        拒收商品
                        {!isCurrentInspectionComplete && " (需完成检验)"}
                      </Button>
                    </div>

                    {/* Skip Section */}
                    <div className="pt-3 border-t">
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={handleMarkAsReviewed}
                        data-testid="button-mark-reviewed"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        标记为已审核 (跳过到下一项)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Completion State */
            <Card data-testid="inspection-complete">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  质量检验完成
                </CardTitle>
                <CardDescription>
                  所有商品检验完毕，可以进行下一步操作
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-2xl font-bold text-green-600">
                    {progress.completedItems}/{progress.totalItems} 项目已完成
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{progress.passedItems}</div>
                      <div className="text-muted-foreground">通过</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{progress.conditionalItems}</div>
                      <div className="text-muted-foreground">条件通过</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{progress.failedItems}</div>
                      <div className="text-muted-foreground">不通过</div>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full max-w-md"
                    onClick={() => handleComplete(inspectionResults)}
                    data-testid="button-complete-inspection"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    完成质量检验
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}