import { useState, useMemo } from "react";
import { 
  Trophy, 
  Clock, 
  Star, 
  TrendingUp, 
  Target,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Award,
  Zap,
  BookOpen,
  ArrowRight,
  Download,
  Share,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Types for experiment results
interface StepResult {
  stepNumber: number;
  stepName: string;
  stepTitle: string;
  completedAt: Date;
  timeSpent: number; // in seconds
  score: number; // 0-100
  efficiency: number; // 0-100
  accuracy: number; // 0-100
  mistakes: string[];
  recommendations: string[];
  targetTime: number; // in seconds
  isOptimal: boolean;
}

interface ExperimentResult {
  experimentId: string;
  userId: string;
  experimentType: 'package_delivery' | 'warehouse_picking';
  startedAt: Date;
  completedAt: Date;
  totalTimeSpent: number; // in seconds
  overallScore: number; // 0-100
  overallEfficiency: number; // 0-100
  overallAccuracy: number; // 0-100
  customerSatisfaction?: number; // 1-5 for delivery experiments
  deliveryRating?: number; // 1-5 for delivery experiments
  stepResults: StepResult[];
  strengths: string[];
  improvements: string[];
  nextRecommendations: string[];
  performanceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  ranking?: {
    userRank: number;
    totalUsers: number;
    percentile: number;
  };
}

interface ExperimentResultsDisplayProps {
  result: ExperimentResult;
  onRetry?: () => void;
  onContinue?: () => void;
  onClose?: () => void;
}

// Performance level configurations
const PERFORMANCE_LEVELS = {
  beginner: {
    label: '初学者',
    color: 'bg-gray-500',
    description: '继续练习以提高熟练度',
    icon: BookOpen
  },
  intermediate: {
    label: '中级',
    color: 'bg-blue-500',
    description: '表现不错，还有提升空间',
    icon: TrendingUp
  },
  advanced: {
    label: '高级',
    color: 'bg-green-500',
    description: '表现优秀，接近专业水平',
    icon: Target
  },
  expert: {
    label: '专家',
    color: 'bg-purple-500',
    description: '卓越表现，达到专业标准',
    icon: Trophy
  }
};

export function ExperimentResultsDisplay({ 
  result, 
  onRetry, 
  onContinue, 
  onClose 
}: ExperimentResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate derived metrics
  const metrics = useMemo(() => {
    const averageStepTime = result.stepResults.length > 0 ? result.totalTimeSpent / result.stepResults.length : 0;
    const optimizedSteps = result.stepResults.filter(step => step.isOptimal).length;
    const perfectScores = result.stepResults.filter(step => step.score === 100).length;
    const totalMistakes = result.stepResults.reduce((sum, step) => sum + step.mistakes.length, 0);
    
    // Calculate actual completion rate based on completed status, not score
    const actuallyCompletedSteps = result.stepResults.filter(step => 
      step.completedAt && step.timeSpent > 0
    ).length;
    const totalSteps = result.stepResults.length;
    const completionRate = totalSteps > 0 ? (actuallyCompletedSteps / totalSteps) * 100 : 0;
    
    // Calculate time efficiency with proper bounds (0-100%)
    const targetTime = 300; // 5 minutes target
    const timeEfficiency = result.totalTimeSpent > 0 
      ? Math.min(100, Math.max(0, (targetTime / result.totalTimeSpent) * 100))
      : 0;
    
    return {
      averageStepTime,
      optimizedSteps,
      perfectScores,
      totalMistakes,
      completionRate,
      timeEfficiency,
    };
  }, [result]);

  // Get performance level info
  const levelInfo = PERFORMANCE_LEVELS[result.performanceLevel];
  const LevelIcon = levelInfo.icon;

  // Format time with proper rounding
  const formatTime = (seconds: number): string => {
    const roundedSeconds = Math.round(seconds);
    const mins = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get score badge variant
  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, label: '优秀' };
    if (score >= 80) return { variant: 'secondary' as const, label: '良好' };
    if (score >= 70) return { variant: 'outline' as const, label: '中等' };
    return { variant: 'destructive' as const, label: '需改进' };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6" data-testid="experiment-results-display">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">实验完成！</h1>
        </div>
        
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{result.overallScore}分</p>
            <p className="text-sm text-muted-foreground">总体得分</p>
          </div>
          
          <Separator orientation="vertical" className="h-12" />
          
          <div className="text-center">
            <p className="text-xl font-semibold">{formatTime(result.totalTimeSpent)}</p>
            <p className="text-sm text-muted-foreground">完成时间</p>
          </div>
          
          <Separator orientation="vertical" className="h-12" />
          
          <div className="flex items-center gap-2">
            <LevelIcon className="h-5 w-5" />
            <div className="text-center">
              <Badge className={levelInfo.color} data-testid="performance-level">
                {levelInfo.label}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">{levelInfo.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            概览
          </TabsTrigger>
          <TabsTrigger value="steps" data-testid="tab-steps">
            <CheckCircle className="h-4 w-4 mr-2" />
            步骤分析
          </TabsTrigger>
          <TabsTrigger value="feedback" data-testid="tab-feedback">
            <Star className="h-4 w-4 mr-2" />
            评价反馈
          </TabsTrigger>
          <TabsTrigger value="ranking" data-testid="tab-ranking">
            <Award className="h-4 w-4 mr-2" />
            排行对比
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{result.overallAccuracy}%</p>
                    <p className="text-sm text-muted-foreground">准确率</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{result.overallEfficiency}%</p>
                    <p className="text-sm text-muted-foreground">效率</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{metrics.optimizedSteps}</p>
                    <p className="text-sm text-muted-foreground">优化步骤</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{formatTime(metrics.averageStepTime)}</p>
                    <p className="text-sm text-muted-foreground">平均步骤时间</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  优势表现
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2" data-testid={`strength-${index}`}>
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  改进建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2" data-testid={`improvement-${index}`}>
                      <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Steps Analysis Tab */}
        <TabsContent value="steps" className="space-y-4">
          {result.stepResults.map((step, index) => {
            const scoreBadge = getScoreBadge(step.score);
            
            return (
              <Card key={step.stepNumber} className="transition-all hover:shadow-md">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                        step.isOptimal ? "bg-green-500" : "bg-blue-500"
                      )}>
                        {step.stepNumber}
                      </div>
                      <div>
                        <h4 className="font-semibold">{step.stepTitle}</h4>
                        <p className="text-sm text-muted-foreground">{formatTime(step.timeSpent)} 完成</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge {...scoreBadge} data-testid={`step-badge-${step.stepNumber}`}>
                        {step.score}分
                      </Badge>
                      {step.isOptimal && (
                        <p className="text-xs text-green-600 mt-1">⚡ 最优完成</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">准确率</p>
                      <div className="flex items-center gap-2">
                        <Progress value={step.accuracy} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{step.accuracy}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground">效率</p>
                      <div className="flex items-center gap-2">
                        <Progress value={step.efficiency} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{step.efficiency}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground">时间对比</p>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={step.timeSpent > 0 ? Math.min(100, (step.targetTime / step.timeSpent) * 100) : 0} 
                          className="flex-1 h-2" 
                        />
                        <span className="text-sm font-medium">
                          {step.timeSpent === 0 ? '未完成' : 
                           step.timeSpent <= step.targetTime ? '✓' : formatTime(step.timeSpent - step.targetTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {(step.mistakes.length > 0 || step.recommendations.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      {step.mistakes.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-600 mb-2">需要注意：</p>
                          <ul className="space-y-1">
                            {step.mistakes.map((mistake, mIndex) => (
                              <li key={mIndex} className="text-xs text-red-600" data-testid={`mistake-${step.stepNumber}-${mIndex}`}>
                                • {mistake}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {step.recommendations.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-blue-600 mb-2">改进建议：</p>
                          <ul className="space-y-1">
                            {step.recommendations.map((rec, rIndex) => (
                              <li key={rIndex} className="text-xs text-blue-600" data-testid={`recommendation-${step.stepNumber}-${rIndex}`}>
                                • {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          {result.experimentType === 'package_delivery' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    客户满意度
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      {result.customerSatisfaction || 0}/5
                    </div>
                    <div className="flex justify-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-6 w-6",
                            star <= (result.customerSatisfaction || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(result.customerSatisfaction || 0) >= 4.5 ? '客户非常满意' :
                       (result.customerSatisfaction || 0) >= 4 ? '客户满意' :
                       (result.customerSatisfaction || 0) >= 3 ? '客户基本满意' : '需要改进服务'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    配送评价
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      {result.deliveryRating || 0}/5
                    </div>
                    <div className="flex justify-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-6 w-6",
                            star <= (result.deliveryRating || 0)
                              ? "fill-blue-400 text-blue-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(result.deliveryRating || 0) >= 4.5 ? '配送服务优秀' :
                       (result.deliveryRating || 0) >= 4 ? '配送服务良好' :
                       (result.deliveryRating || 0) >= 3 ? '配送服务一般' : '配送服务需改进'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                下一步学习建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {result.nextRecommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-3" data-testid={`next-recommendation-${index}`}>
                    <div className="bg-blue-100 p-1 rounded-full">
                      <ArrowRight className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-6">
          {result.ranking && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  班级排名
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-4xl font-bold text-blue-600">#{result.ranking.userRank}</p>
                    <p className="text-muted-foreground">
                      总共 {result.ranking.totalUsers} 名学生
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-lg text-white">
                    <p className="text-lg font-semibold">
                      击败了 {result.ranking.percentile}% 的同学！
                    </p>
                    <p className="text-sm opacity-90">
                      继续努力，争取更好的成绩
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>性能对比分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>总体得分</span>
                    <span>{result.overallScore}/100</span>
                  </div>
                  <Progress value={result.overallScore} className="h-3" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>完成效率</span>
                    <span>{result.overallEfficiency}%</span>
                  </div>
                  <Progress value={result.overallEfficiency} className="h-3" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>操作准确率</span>
                    <span>{result.overallAccuracy}%</span>
                  </div>
                  <Progress value={result.overallAccuracy} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onRetry && (
          <Button variant="outline" onClick={onRetry} data-testid="button-retry">
            <RefreshCw className="h-4 w-4 mr-2" />
            重新实验
          </Button>
        )}
        
        <Button variant="outline" data-testid="button-download">
          <Download className="h-4 w-4 mr-2" />
          下载报告
        </Button>
        
        <Button variant="outline" data-testid="button-share">
          <Share className="h-4 w-4 mr-2" />
          分享成果
        </Button>
        
        {onContinue && (
          <Button onClick={onContinue} data-testid="button-continue">
            继续学习
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
        
        {onClose && (
          <Button variant="secondary" onClick={onClose} data-testid="button-close">
            关闭
          </Button>
        )}
      </div>
    </div>
  );
}