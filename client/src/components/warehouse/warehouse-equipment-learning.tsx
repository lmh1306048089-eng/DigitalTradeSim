import { useState, useCallback, useEffect } from "react";
import { 
  Forklift, 
  Package, 
  Scan, 
  Archive, 
  Database, 
  CheckCircle, 
  Circle, 
  Play, 
  Eye, 
  RotateCcw,
  ArrowRight,
  Target,
  Info,
  Lightbulb,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Equipment data structures
interface Equipment {
  id: string;
  name: string;
  englishName: string;
  description: string;
  icon: any;
  category: 'storage' | 'automation' | 'mobile' | 'digital';
  specifications: {
    label: string;
    value: string;
  }[];
  usageInstructions: string[];
  keyComponents: {
    name: string;
    description: string;
    position: { x: number; y: number };
  }[];
  safetyNotes: string[];
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

interface WarehouseEquipmentLearningProps {
  onComplete?: (completionData: {
    completedEquipment: string[];
    totalScore: number;
    timeSpent: number;
  }) => void;
  currentStep?: number;
  onProgressSave?: (progress: {
    currentEquipment: string;
    completedEquipment: string[];
    scores: Record<string, number>;
  }) => void;
}

// Equipment data
const equipmentData: Equipment[] = [
  {
    id: 'pallet-racking',
    name: '托盘货架',
    englishName: 'Pallet Racking',
    description: '固定式存储系统，采用垂直框架结构，用于高效存储标准化托盘货物',
    icon: Archive,
    category: 'storage',
    specifications: [
      { label: '最大载重', value: '1000-3000kg/层' },
      { label: '高度范围', value: '3-12米' },
      { label: '托盘规格', value: '1200×1000mm标准托盘' },
      { label: '材质', value: '冷轧钢板，静电喷涂' },
      { label: '层数', value: '3-6层可调' }
    ],
    usageInstructions: [
      '检查货架结构完整性和稳定性',
      '确认托盘规格与货架匹配',
      '使用叉车将托盘货物放置到指定层位',
      '确保货物摆放均匀，不超出托盘边缘',
      '定期检查货架承重和安全状况'
    ],
    keyComponents: [
      { name: '立柱', description: '承重主体结构', position: { x: 20, y: 30 } },
      { name: '横梁', description: '支撑托盘的水平构件', position: { x: 50, y: 40 } },
      { name: '安全销', description: '防止横梁脱落的安全装置', position: { x: 70, y: 35 } },
      { name: '护脚', description: '保护立柱底部的金属件', position: { x: 25, y: 80 } }
    ],
    safetyNotes: [
      '严禁超载使用，遵守额定承重限制',
      '定期检查连接件紧固情况',
      '禁止攀爬货架结构',
      '发现变形或损坏立即停用并维修'
    ],
    quiz: [
      {
        question: '托盘货架的主要承重部件是什么？',
        options: ['横梁', '立柱', '安全销', '护脚'],
        correctAnswer: 1,
        explanation: '立柱是货架的主要承重部件，承担整个货架的重量并传递给地面。'
      },
      {
        question: '标准托盘的规格是多少？',
        options: ['1000×800mm', '1200×1000mm', '1100×900mm', '1300×1100mm'],
        correctAnswer: 1,
        explanation: '1200×1000mm是国际标准托盘规格，也是中国最常用的托盘尺寸。'
      }
    ]
  },
  {
    id: 'mobile-racking',
    name: '移动式货架',
    englishName: 'Mobile Racking',
    description: '可移动的存储系统，通过轨道系统实现货架移动，大大提高空间利用率',
    icon: RotateCcw,
    category: 'storage',
    specifications: [
      { label: '空间利用率', value: '比固定货架提高40-60%' },
      { label: '移动方式', value: '电动/手动控制' },
      { label: '承重能力', value: '500-2000kg/m²' },
      { label: '移动速度', value: '3-6m/min' },
      { label: '控制系统', value: 'PLC智能控制' }
    ],
    usageInstructions: [
      '启动前检查轨道是否清洁无障碍物',
      '确认操作区域内无人员',
      '按下启动按钮，选择需要打开的通道',
      '等待货架完全停稳后再进入操作',
      '操作完成后及时关闭通道节省空间'
    ],
    keyComponents: [
      { name: '导轨', description: '货架移动的轨道系统', position: { x: 40, y: 85 } },
      { name: '驱动电机', description: '提供移动动力的电机', position: { x: 15, y: 60 } },
      { name: '控制面板', description: '操作货架移动的控制界面', position: { x: 80, y: 20 } },
      { name: '安全传感器', description: '检测人员和障碍物的安全装置', position: { x: 60, y: 50 } }
    ],
    safetyNotes: [
      '操作前必须确认通道内无人员',
      '移动过程中严禁进入货架间通道',
      '定期检查安全传感器功能',
      '发生故障时立即按下急停按钮'
    ],
    quiz: [
      {
        question: '移动式货架相比固定货架能提高多少空间利用率？',
        options: ['20-30%', '30-40%', '40-60%', '60-80%'],
        correctAnswer: 2,
        explanation: '移动式货架通过消除多余通道，可以比固定货架提高40-60%的空间利用率。'
      },
      {
        question: '移动货架操作的首要安全原则是什么？',
        options: ['检查电源', '确认无人员', '清洁轨道', '检查货物'],
        correctAnswer: 1,
        explanation: '确认通道内无人员是移动货架操作的首要安全原则，避免人员伤害事故。'
      }
    ]
  },
  {
    id: 'stacker-crane',
    name: '堆垛机',
    englishName: 'Stacker Crane',
    description: '自动化存取设备，沿着轨道运行，可在高架货架中自动存取货物',
    icon: Package,
    category: 'automation',
    specifications: [
      { label: '运行高度', value: '6-40米' },
      { label: '载重能力', value: '100-2000kg' },
      { label: '水平速度', value: '160-300m/min' },
      { label: '提升速度', value: '30-60m/min' },
      { label: '定位精度', value: '±3mm' }
    ],
    usageInstructions: [
      '通过WMS系统下发存取指令',
      '堆垛机自动移动到指定位置',
      '伸叉装置取出或放入货物',
      '系统自动更新库存信息',
      '监控设备运行状态和异常告警'
    ],
    keyComponents: [
      { name: '行走机构', description: '水平移动的驱动系统', position: { x: 30, y: 75 } },
      { name: '提升机构', description: '垂直升降的驱动系统', position: { x: 15, y: 40 } },
      { name: '载货台', description: '承载货物的平台', position: { x: 50, y: 45 } },
      { name: '伸叉装置', description: '取放货物的机械臂', position: { x: 75, y: 45 } }
    ],
    safetyNotes: [
      '运行区域内严禁人员进入',
      '定期检查导轨和机械部件',
      '监控系统状态，及时处理告警',
      '定期进行安全检查和维护保养'
    ],
    quiz: [
      {
        question: '堆垛机的定位精度通常是多少？',
        options: ['±1mm', '±3mm', '±5mm', '±10mm'],
        correctAnswer: 1,
        explanation: '现代堆垛机的定位精度通常可达到±3mm，确保准确的货物存取操作。'
      },
      {
        question: '堆垛机主要通过什么系统接收指令？',
        options: ['人工操作', 'WMS系统', '手持终端', '语音识别'],
        correctAnswer: 1,
        explanation: 'WMS（仓库管理系统）是堆垛机接收存取指令的主要系统，实现自动化操作。'
      }
    ]
  },
  {
    id: 'handheld-scanner',
    name: '手持数据采集器',
    englishName: 'Handheld Data Collector',
    description: '移动扫描设备，用于条码识别、数据采集和实时信息传输',
    icon: Scan,
    category: 'mobile',
    specifications: [
      { label: '扫描精度', value: '1D/2D/QR码识别' },
      { label: '通信方式', value: 'WiFi/4G/蓝牙' },
      { label: '电池续航', value: '8-12小时' },
      { label: '操作系统', value: 'Android/Windows CE' },
      { label: '防护等级', value: 'IP65防尘防水' }
    ],
    usageInstructions: [
      '开机并连接到仓库管理系统',
      '登录个人账户，选择作业任务',
      '扫描货物条码进行识别',
      '输入或确认货物数量信息',
      '实时上传数据到系统服务器'
    ],
    keyComponents: [
      { name: '扫描引擎', description: '读取条码的光学模块', position: { x: 50, y: 25 } },
      { name: '显示屏', description: '显示信息的LCD屏幕', position: { x: 50, y: 50 } },
      { name: '键盘', description: '数据输入的物理按键', position: { x: 50, y: 70 } },
      { name: '电池', description: '提供电源的锂电池', position: { x: 50, y: 85 } }
    ],
    safetyNotes: [
      '定期充电，避免电量耗尽',
      '避免摔落和强烈撞击',
      '保持扫描窗口清洁',
      '定期备份重要数据'
    ],
    quiz: [
      {
        question: '手持数据采集器通常支持哪些类型的条码？',
        options: ['只支持1D条码', '只支持2D条码', '1D/2D/QR码', '只支持QR码'],
        correctAnswer: 2,
        explanation: '现代手持数据采集器通常支持1D条码、2D条码和QR码等多种码制。'
      },
      {
        question: 'IP65防护等级表示什么？',
        options: ['防火防爆', '防尘防水', '防静电', '防磁干扰'],
        correctAnswer: 1,
        explanation: 'IP65防护等级表示设备具有防尘和防水功能，适合仓库环境使用。'
      }
    ]
  },
  {
    id: 'manual-pallet-truck',
    name: '手动托盘叉车',
    englishName: 'Manual Pallet Truck',
    description: '手动操作的货物搬运设备，用于托盘货物的短距离移动和装卸',
    icon: Forklift,
    category: 'mobile',
    specifications: [
      { label: '载重能力', value: '2000-3000kg' },
      { label: '货叉长度', value: '1150-1220mm' },
      { label: '最低高度', value: '85mm' },
      { label: '最高高度', value: '200mm' },
      { label: '转弯半径', value: '1500mm' }
    ],
    usageInstructions: [
      '检查设备完好性，确认无损坏',
      '将货叉插入托盘底部',
      '握紧手柄，向上拉动升起货物',
      '推拉移动到目标位置',
      '向下压手柄降低货物至地面'
    ],
    keyComponents: [
      { name: '货叉', description: '插入托盘的叉型结构', position: { x: 70, y: 70 } },
      { name: '液压缸', description: '提供升降动力的液压装置', position: { x: 40, y: 60 } },
      { name: '手柄', description: '操作控制的手动杆', position: { x: 20, y: 30 } },
      { name: '行走轮', description: '支撑和移动的轮子', position: { x: 50, y: 85 } }
    ],
    safetyNotes: [
      '严禁超载使用，遵守载重限制',
      '移动时注意周围人员和障碍物',
      '定期检查轮子和液压系统',
      '货物升起时禁止在下方停留'
    ],
    quiz: [
      {
        question: '手动托盘叉车的典型载重能力是多少？',
        options: ['1000-2000kg', '2000-3000kg', '3000-4000kg', '4000-5000kg'],
        correctAnswer: 1,
        explanation: '手动托盘叉车的典型载重能力为2000-3000kg，适合大多数托盘货物搬运。'
      },
      {
        question: '使用叉车时的首要安全原则是什么？',
        options: ['速度要快', '不超载使用', '可以载人', '可以斜坡使用'],
        correctAnswer: 1,
        explanation: '不超载使用是叉车操作的首要安全原则，超载会导致设备损坏和安全事故。'
      }
    ]
  },
  {
    id: 'barcode-wms',
    name: '条码仓库管理系统',
    englishName: 'Barcode WMS',
    description: '基于条码技术的数字化库存管理系统，实现货物的精确追踪和管理',
    icon: Database,
    category: 'digital',
    specifications: [
      { label: '数据处理', value: '实时处理能力' },
      { label: '用户并发', value: '支持100+用户同时在线' },
      { label: '系统架构', value: 'B/S架构，云端部署' },
      { label: '数据接口', value: 'API/EDI/XML多种接口' },
      { label: '报表功能', value: '多维度数据分析报表' }
    ],
    usageInstructions: [
      '登录WMS系统管理界面',
      '创建入库/出库作业任务',
      '打印条码标签并粘贴到货物',
      '使用扫描设备执行作业',
      '查看实时库存和作业报告'
    ],
    keyComponents: [
      { name: '数据库', description: '存储所有仓库数据', position: { x: 50, y: 20 } },
      { name: '应用服务器', description: '处理业务逻辑的服务器', position: { x: 30, y: 40 } },
      { name: 'Web界面', description: '用户操作的网页界面', position: { x: 70, y: 40 } },
      { name: '接口模块', description: '与其他系统对接的接口', position: { x: 50, y: 60 } }
    ],
    safetyNotes: [
      '定期备份系统数据',
      '设置用户权限和操作日志',
      '监控系统性能和安全状态',
      '定期更新系统软件版本'
    ],
    quiz: [
      {
        question: 'WMS系统的核心功能是什么？',
        options: ['财务管理', '库存管理', '人事管理', '客户管理'],
        correctAnswer: 1,
        explanation: 'WMS（仓库管理系统）的核心功能是库存管理，包括货物的入库、出库、盘点等。'
      },
      {
        question: '条码技术在WMS中的主要作用是什么？',
        options: ['美观装饰', '货物标识和追踪', '价格标识', '广告宣传'],
        correctAnswer: 1,
        explanation: '条码技术在WMS中主要用于货物的唯一标识和全程追踪，提高管理精度。'
      }
    ]
  }
];

export function WarehouseEquipmentLearning({ 
  onComplete, 
  currentStep = 0,
  onProgressSave 
}: WarehouseEquipmentLearningProps) {
  const [activeEquipment, setActiveEquipment] = useState<string>(equipmentData[0].id);
  const [completedEquipment, setCompletedEquipment] = useState<string[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<Record<string, number>>({});
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const [showQuizResults, setShowQuizResults] = useState<Record<string, boolean>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [startTime] = useState<number>(Date.now());
  const [showHotspots, setShowHotspots] = useState<Record<string, boolean>>({});

  // Get current equipment
  const currentEquipment = equipmentData.find(eq => eq.id === activeEquipment) || equipmentData[0];

  // Calculate overall progress
  const overallProgress = (completedEquipment.length / equipmentData.length) * 100;

  // Save progress when state changes
  useEffect(() => {
    if (onProgressSave) {
      onProgressSave({
        currentEquipment: activeEquipment,
        completedEquipment,
        scores: quizScores
      });
    }
  }, [activeEquipment, completedEquipment, quizScores, onProgressSave]);

  // Handle quiz answer selection
  const handleQuizAnswer = useCallback((equipmentId: string, questionIndex: number, answerIndex: number) => {
    const key = `${equipmentId}-${questionIndex}`;
    setSelectedAnswers(prev => ({ ...prev, [key]: answerIndex }));
  }, []);

  // Submit quiz for current question
  const handleQuizSubmit = useCallback((equipmentId: string) => {
    const equipment = equipmentData.find(eq => eq.id === equipmentId);
    if (!equipment) return;

    const questionIndex = currentQuizIndex[equipmentId] || 0;
    const question = equipment.quiz[questionIndex];
    const key = `${equipmentId}-${questionIndex}`;
    const selectedAnswer = selectedAnswers[key];
    
    if (selectedAnswer !== undefined) {
      const isCorrect = selectedAnswer === question.correctAnswer;
      
      // Calculate the new score for this equipment (including current question)
      const currentEquipmentScore = (quizScores[equipmentId] || 0) + (isCorrect ? 1 : 0);
      
      // Update quiz results
      setShowQuizResults(prev => ({ ...prev, [key]: true }));
      
      // Update score
      if (isCorrect) {
        setQuizScores(prev => ({
          ...prev,
          [equipmentId]: currentEquipmentScore
        }));
      }

      // Move to next question or complete equipment
      setTimeout(() => {
        setShowQuizResults(prev => ({ ...prev, [key]: false }));
        
        if (questionIndex < equipment.quiz.length - 1) {
          setCurrentQuizIndex(prev => ({
            ...prev,
            [equipmentId]: questionIndex + 1
          }));
        } else {
          // Equipment completed
          setCompletedEquipment(prev => {
            const newCompleted = [...prev, equipmentId].filter((item, index, arr) => 
              arr.indexOf(item) === index
            );
            
            // Check if all equipment completed
            if (newCompleted.length === equipmentData.length && onComplete) {
              // Calculate total score using fresh data - include current equipment's final score
              const otherEquipmentScores = Object.entries(quizScores)
                .filter(([id]) => id !== equipmentId)
                .reduce((sum, [_, score]) => sum + score, 0);
              const totalScore = otherEquipmentScores + currentEquipmentScore;
              const timeSpent = Date.now() - startTime;
              onComplete({
                completedEquipment: newCompleted,
                totalScore,
                timeSpent
              });
            }
            
            return newCompleted;
          });
          
          // Reset quiz state for this equipment
          setCurrentQuizIndex(prev => ({ ...prev, [equipmentId]: 0 }));
        }
      }, 2000);
    }
  }, [currentQuizIndex, selectedAnswers, quizScores, startTime, onComplete]);

  // Toggle hotspots visibility
  const toggleHotspots = useCallback((equipmentId: string) => {
    setShowHotspots(prev => ({ ...prev, [equipmentId]: !prev[equipmentId] }));
  }, []);

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'storage': return 'bg-blue-500';
      case 'automation': return 'bg-green-500';
      case 'mobile': return 'bg-orange-500';
      case 'digital': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Get category name
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'storage': return '存储设备';
      case 'automation': return '自动化设备';
      case 'mobile': return '移动设备';
      case 'digital': return '数字化系统';
      default: return '其他设备';
    }
  };

  // Filter equipment by category
  const categories = ['storage', 'automation', 'mobile', 'digital'];
  const equipmentByCategory = categories.map(cat => ({
    category: cat,
    name: getCategoryName(cat),
    equipment: equipmentData.filter(eq => eq.category === cat)
  }));

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6" data-testid="warehouse-equipment-learning">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground" data-testid="learning-title">
          海外仓拣货实验 - 仓储设备学习
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          了解现代仓储操作中的关键设备，掌握设备的规格、使用方法和安全注意事项
        </p>
        
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>学习进度</span>
            <span>{completedEquipment.length} / {equipmentData.length} 完成</span>
          </div>
          <Progress value={overallProgress} className="h-2" data-testid="overall-progress" />
        </div>
        
        {/* Completion Badges */}
        <div className="flex flex-wrap gap-2 justify-center">
          {equipmentData.map(equipment => (
            <Badge
              key={equipment.id}
              variant={completedEquipment.includes(equipment.id) ? 'default' : 'outline'}
              className={cn(
                'flex items-center gap-1',
                completedEquipment.includes(equipment.id) && 'bg-green-500 text-white'
              )}
              data-testid={`badge-${equipment.id}`}
            >
              {completedEquipment.includes(equipment.id) ? 
                <CheckCircle className="h-3 w-3" /> : 
                <Circle className="h-3 w-3" />
              }
              {equipment.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Equipment Tabs */}
      <Tabs defaultValue="storage" className="w-full">
        <TabsList className="grid w-full grid-cols-4" data-testid="category-tabs">
          {equipmentByCategory.map(({ category, name }) => (
            <TabsTrigger key={category} value={category} className="flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', getCategoryColor(category))} />
              {name}
            </TabsTrigger>
          ))}
        </TabsList>

        {equipmentByCategory.map(({ category, equipment }) => (
          <TabsContent key={category} value={category} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {equipment.map(eq => {
                const isCompleted = completedEquipment.includes(eq.id);
                const currentQuiz = currentQuizIndex[eq.id] || 0;
                const quizKey = `${eq.id}-${currentQuiz}`;
                const showResult = showQuizResults[quizKey];
                const selectedAnswer = selectedAnswers[quizKey];
                
                return (
                  <Card 
                    key={eq.id} 
                    className={cn(
                      'h-full transition-all duration-200',
                      activeEquipment === eq.id && 'ring-2 ring-primary',
                      isCompleted && 'bg-green-50 dark:bg-green-950'
                    )}
                    data-testid={`equipment-card-${eq.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-lg', getCategoryColor(eq.category))}>
                            <eq.icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{eq.name}</CardTitle>
                            <CardDescription>{eq.englishName}</CardDescription>
                          </div>
                        </div>
                        {isCompleted && (
                          <Badge variant="default" className="bg-green-500">
                            <Award className="h-3 w-3 mr-1" />
                            已完成
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{eq.description}</p>

                      {/* Equipment Image Placeholder with Hotspots */}
                      <div className="relative">
                        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                          <eq.icon className="h-20 w-20 text-gray-400" />
                          
                          {/* Interactive Hotspots */}
                          {showHotspots[eq.id] && eq.keyComponents.map((component, index) => (
                            <div
                              key={index}
                              className="absolute w-4 h-4 bg-primary rounded-full animate-pulse cursor-pointer group"
                              style={{
                                left: `${component.position.x}%`,
                                top: `${component.position.y}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                              data-testid={`hotspot-${eq.id}-${index}`}
                            >
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                <div className="font-medium">{component.name}</div>
                                <div>{component.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => toggleHotspots(eq.id)}
                          data-testid={`button-hotspots-${eq.id}`}
                        >
                          <Target className="h-4 w-4 mr-1" />
                          {showHotspots[eq.id] ? '隐藏' : '显示'}热点
                        </Button>
                      </div>

                      {/* Specifications */}
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          技术规格
                        </h4>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          {eq.specifications.slice(0, 3).map((spec, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-muted-foreground">{spec.label}:</span>
                              <span className="font-medium">{spec.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quiz Section */}
                      {eq.quiz.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            知识检测 ({currentQuiz + 1}/{eq.quiz.length})
                          </h4>
                          
                          <div className="space-y-3">
                            <p className="text-sm font-medium">{eq.quiz[currentQuiz].question}</p>
                            
                            <div className="space-y-2">
                              {eq.quiz[currentQuiz].options.map((option, index) => (
                                <button
                                  key={index}
                                  className={cn(
                                    'w-full text-left p-2 rounded border text-sm transition-colors',
                                    selectedAnswer === index && 'bg-primary/10 border-primary',
                                    showResult && selectedAnswer === index && selectedAnswer === eq.quiz[currentQuiz].correctAnswer && 'bg-green-100 border-green-500',
                                    showResult && selectedAnswer === index && selectedAnswer !== eq.quiz[currentQuiz].correctAnswer && 'bg-red-100 border-red-500',
                                    showResult && index === eq.quiz[currentQuiz].correctAnswer && 'bg-green-100 border-green-500'
                                  )}
                                  onClick={() => handleQuizAnswer(eq.id, currentQuiz, index)}
                                  disabled={showResult}
                                  data-testid={`quiz-option-${eq.id}-${currentQuiz}-${index}`}
                                >
                                  {String.fromCharCode(65 + index)}. {option}
                                </button>
                              ))}
                            </div>

                            {showResult && (
                              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                  {selectedAnswer === eq.quiz[currentQuiz].correctAnswer ? '✅ 回答正确！' : '❌ 回答错误'}
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                  {eq.quiz[currentQuiz].explanation}
                                </p>
                              </div>
                            )}

                            {!showResult && selectedAnswer !== undefined && (
                              <Button
                                onClick={() => handleQuizSubmit(eq.id)}
                                className="w-full"
                                data-testid={`button-quiz-submit-${eq.id}`}
                              >
                                提交答案
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Score Display */}
                      {quizScores[eq.id] !== undefined && (
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">
                            得分: {quizScores[eq.id]} / {eq.quiz.length}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Completion Summary */}
      {completedEquipment.length === equipmentData.length && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-green-500 rounded-full">
                  <Award className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                  🎉 恭喜完成学习！
                </h3>
                <p className="text-green-700 dark:text-green-300 mt-2">
                  您已经掌握了所有仓储设备的基础知识，总得分: {Object.values(quizScores).reduce((sum, score) => sum + score, 0)} / {equipmentData.reduce((sum, eq) => sum + eq.quiz.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}