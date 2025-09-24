import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Lightbulb,
  Zap,
  Shield,
  FileCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationResult, ValidationError } from "@/lib/customs-validation-engine";
import { getStatusMessage, getStatusColor } from "@/lib/customs-validation-engine";

interface ValidationResultsProps {
  results: ValidationResult;
  onApplyFix?: (error: ValidationError) => void;
  isLoading?: boolean;
}

export function ValidationResults({ results, onApplyFix, isLoading }: ValidationResultsProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 animate-spin" />
            <span>AI海关校验进行中...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={65} className="w-full" />
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>字段完整性校验 - 已完成</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500 animate-spin" />
                <span>数据逻辑校验 - 进行中</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                <span className="text-gray-400">监管合规校验 - 等待中</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (results.passedCount / Math.max(results.totalChecks, 1)) * 100;

  return (
    <div className="space-y-6">
      {/* 总体状态 */}
      <Card className={cn("border-2", getStatusColor(results.overallStatus))}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {results.overallStatus === 'pass' && <CheckCircle className="h-6 w-6 text-green-600" />}
              {results.overallStatus === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-600" />}
              {results.overallStatus === 'error' && <AlertCircle className="h-6 w-6 text-red-600" />}
              
              <div>
                <CardTitle className="text-lg">
                  {getStatusMessage(results.overallStatus)}
                </CardTitle>
                <div className="flex items-center space-x-4 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    校验用时：{results.validationTime.toFixed(2)}秒
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    通过率：{progressPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
            
            {results.customsReady && (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                <FileCheck className="h-4 w-4 mr-1" />
                可提交海关
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <Progress value={progressPercentage} className="w-full h-3" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.passedCount}</div>
                <div className="text-gray-500">通过项目</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.errors.length}</div>
                <div className="text-gray-500">严重错误</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{results.warnings.length}</div>
                <div className="text-gray-500">警告</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.suggestions.length}</div>
                <div className="text-gray-500">建议</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 严重错误 */}
      {results.errors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              严重错误 ({results.errors.length}项)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.errors.map((error, index) => (
              <ValidationErrorItem 
                key={index} 
                error={error} 
                onApplyFix={onApplyFix}
                icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                borderColor="border-red-200"
                bgColor="bg-red-50"
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* 警告 */}
      {results.warnings.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              警告 ({results.warnings.length}项)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.warnings.map((warning, index) => (
              <ValidationErrorItem 
                key={index} 
                error={warning} 
                onApplyFix={onApplyFix}
                icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
                borderColor="border-yellow-200"
                bgColor="bg-yellow-50"
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* 优化建议 */}
      {results.suggestions.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <Lightbulb className="h-5 w-5 mr-2" />
              优化建议 ({results.suggestions.length}项)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.suggestions.map((suggestion, index) => (
              <ValidationErrorItem 
                key={index} 
                error={suggestion} 
                onApplyFix={onApplyFix}
                icon={<Lightbulb className="h-4 w-4 text-blue-500" />}
                borderColor="border-blue-200"
                bgColor="bg-blue-50"
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* 通过的检查项 */}
      {results.passedCount > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle className="h-5 w-5 mr-2" />
              校验通过 ({results.passedCount}项)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>基础信息完整性</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>商品编码格式</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>金额计算准确性</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>单位重量合理性</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ValidationErrorItemProps {
  error: ValidationError;
  onApplyFix?: (error: ValidationError) => void;
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
}

function ValidationErrorItem({ error, onApplyFix, icon, borderColor, bgColor }: ValidationErrorItemProps) {
  const getFieldDisplayName = (field: string): string => {
    const fieldMap: Record<string, string> = {
      'consignorConsignee': '收发货人',
      'exportPort': '出口口岸',
      'transportMode': '运输方式',
      'declareDate': '申报日期',
      'currency': '币制',
      'totalAmountForeign': '外币总价',
      'grossWeight': '毛重',
      'netWeight': '净重',
      'exchangeRate': '汇率',
      'supervisionMode': '监管方式'
    };
    
    // 处理商品字段
    if (field.includes('goods[')) {
      const match = field.match(/goods\[(\d+)\]\.(.+)/);
      if (match) {
        const index = parseInt(match[1]) + 1;
        const subField = match[2];
        const subFieldMap: Record<string, string> = {
          'goodsCode': 'HS编码',
          'goodsNameSpec': '商品名称/规格',
          'quantity1': '数量',
          'unitPrice': '单价',
          'totalPrice': '总价'
        };
        return `商品${index} - ${subFieldMap[subField] || subField}`;
      }
    }
    
    return fieldMap[field] || field;
  };

  return (
    <div className={cn("border rounded-lg p-4", borderColor, bgColor)}>
      <div className="flex items-start space-x-3">
        {icon}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm">
              {getFieldDisplayName(error.field)}
            </div>
            <div className="flex items-center space-x-2">
              {error.autoFix && (
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  可自动修复
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-700">
            {error.error}
          </div>
          
          <div className="flex items-start space-x-2 text-sm">
            <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-blue-700 flex-1">
              <strong>优化建议：</strong>{error.suggestion}
            </div>
          </div>
          
          {error.autoFix && onApplyFix && (
            <div className="pt-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onApplyFix(error)}
                className="text-xs"
                data-testid={`button-fix-${error.field}`}
              >
                <Zap className="h-3 w-3 mr-1" />
                一键修复
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}