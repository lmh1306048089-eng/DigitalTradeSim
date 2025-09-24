/**
 * AI海关报关单快速校验引擎
 * 基于真实海关标准，提供10秒内快速、准确的校验结果
 */

export interface ValidationError {
  field: string;
  error: string;
  suggestion: string;
  severity: 'critical' | 'warning' | 'suggestion';
  autoFix?: boolean;
  fixValue?: any;
}

export interface ValidationResult {
  overallStatus: 'pass' | 'warning' | 'error';
  validationTime: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: ValidationError[];
  passedCount: number;
  totalChecks: number;
  customsReady: boolean;
}

interface DeclarationData {
  // 基础信息
  preEntryNo?: string;
  customsNo?: string;
  consignorConsignee: string;
  declarationUnit?: string;
  filingNo?: string;
  licenseNo?: string;
  
  // 贸易信息
  exportPort: string;
  declareDate: Date;
  transportMode: string;
  transportName?: string;
  billNo?: string;
  supervisionMode?: string;
  exemptionNature?: string;
  tradeCountry?: string;
  arrivalCountry?: string;
  originCountry?: string;
  
  // 金融信息
  currency: string;
  exchangeRate?: number;
  totalAmountForeign: number;
  totalAmountCNY?: number;
  freight?: number;
  insurance?: number;
  otherCharges?: number;
  
  // 计量包装
  packages?: number;
  packageType?: string;
  grossWeight?: number;
  netWeight?: number;
  
  // 商品明细
  goods: Array<{
    itemNo: number;
    goodsCode: string;
    goodsNameSpec: string;
    quantity1: number;
    unit1: string;
    unitPrice: number;
    totalPrice: number;
    currency?: string;
    originCountry?: string;
    finalDestCountry?: string;
  }>;
  
  // 申报声明
  inspectionQuarantine?: boolean;
  priceInfluenceFactor?: boolean;
  paymentSettlementUsage?: boolean;
}

/**
 * 海关标准代码字典
 */
const CUSTOMS_CODES = {
  // 运输方式代码
  transportModes: {
    '1': '海运',
    '2': '铁路',
    '3': '公路',
    '4': '航空',
    '5': '邮政',
    '6': '固定运输设备',
    '7': '内河运输',
    '8': '其他'
  },
  
  // 监管方式代码
  supervisionModes: {
    '0110': '一般贸易',
    '0313': '暂时进出境货物',
    '1039': '来料加工进口料件',
    '1210': '保税仓库进出境货物',
    '2025': '暂时进境货物',
    '9600': '来料料件复出境',
    '9700': '来料成品出境'
  },
  
  // 币制代码
  currencies: ['USD', 'CNY', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD'],
  
  // 计量单位代码
  units: ['千克', '件', '台', '个', '套', '箱', '米', '升', '吨', '平方米'],
  
  // 国别地区代码（部分）
  countries: {
    'CHN': '中国',
    'USA': '美国',
    'JPN': '日本',
    'DEU': '德国',
    'GBR': '英国',
    'FRA': '法国',
    'KOR': '韩国',
    'ITA': '意大利',
    'CAN': '加拿大',
    'AUS': '澳大利亚'
  }
};

/**
 * 阶段1：字段完整性校验（1-2秒）
 */
class FieldIntegrityValidator {
  validate(data: DeclarationData): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // 必填字段检查
    const requiredFields = [
      { field: 'consignorConsignee', name: '收发货人' },
      { field: 'exportPort', name: '出口口岸' },
      { field: 'transportMode', name: '运输方式' },
      { field: 'declareDate', name: '申报日期' },
      { field: 'currency', name: '币制' },
      { field: 'totalAmountForeign', name: '外币总价' }
    ];
    
    for (const { field, name } of requiredFields) {
      if (!data[field as keyof DeclarationData] || data[field as keyof DeclarationData] === '') {
        errors.push({
          field,
          error: `${name}为必填项，不能为空`,
          suggestion: `请填写${name}信息`,
          severity: 'critical',
          autoFix: false
        });
      }
    }
    
    // HS编码格式检查
    data.goods.forEach((item, index) => {
      if (item.goodsCode) {
        // 检查13位格式
        if (!/^\d{13}$/.test(item.goodsCode)) {
          errors.push({
            field: `goods[${index}].goodsCode`,
            error: `商品${index + 1}的HS编码格式错误，必须为13位数字`,
            suggestion: `请检查商品编码格式，例如：1234567890123`,
            severity: 'critical',
            autoFix: item.goodsCode.length < 13,
            fixValue: item.goodsCode.padStart(13, '0')
          });
        }
      } else {
        errors.push({
          field: `goods[${index}].goodsCode`,
          error: `商品${index + 1}缺少HS编码`,
          suggestion: `请填写13位商品编码`,
          severity: 'critical',
          autoFix: false
        });
      }
      
      // 商品名称规格检查
      if (!item.goodsNameSpec || item.goodsNameSpec.trim() === '') {
        errors.push({
          field: `goods[${index}].goodsNameSpec`,
          error: `商品${index + 1}缺少商品名称/规格型号`,
          suggestion: `请填写详细的商品名称和规格`,
          severity: 'critical',
          autoFix: false
        });
      }
    });
    
    // 格式规范检查
    if (data.transportMode && !CUSTOMS_CODES.transportModes[data.transportMode as keyof typeof CUSTOMS_CODES.transportModes]) {
      errors.push({
        field: 'transportMode',
        error: '运输方式代码不符合海关标准',
        suggestion: '请选择有效的运输方式代码(1-8)',
        severity: 'warning',
        autoFix: false
      });
    }
    
    if (data.currency && !CUSTOMS_CODES.currencies.includes(data.currency)) {
      errors.push({
        field: 'currency',
        error: '币制代码不符合海关标准',
        suggestion: '请选择有效的币制代码(USD/CNY/EUR等)',
        severity: 'warning',
        autoFix: false
      });
    }
    
    return errors;
  }
}

/**
 * 阶段2：数据逻辑校验（3-5秒）
 */
class DataLogicValidator {
  validate(data: DeclarationData): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // 重量逻辑校验
    if (data.grossWeight && data.netWeight) {
      if (data.grossWeight < data.netWeight) {
        errors.push({
          field: 'grossWeight',
          error: '毛重不能小于净重',
          suggestion: `请检查重量填写，当前净重：${data.netWeight}kg`,
          severity: 'critical',
          autoFix: false
        });
      }
      
      // 包装重量合理性检查
      const packagingWeight = data.grossWeight - data.netWeight;
      const packagingRatio = packagingWeight / data.netWeight;
      if (packagingRatio > 0.5) {
        errors.push({
          field: 'grossWeight',
          error: '包装重量过高，可能存在填写错误',
          suggestion: `包装重量占比${(packagingRatio * 100).toFixed(1)}%，建议检查重量数据`,
          severity: 'warning',
          autoFix: false
        });
      }
    }
    
    // 金额计算校验
    const calculatedTotal = data.goods.reduce((sum, item) => 
      sum + (item.quantity1 * item.unitPrice), 0
    );
    
    const declaredTotal = data.totalAmountForeign;
    const errorRate = Math.abs(calculatedTotal - declaredTotal) / Math.max(calculatedTotal, 0.01);
    
    if (errorRate > 0.02) { // 允许2%误差
      errors.push({
        field: 'totalAmountForeign',
        error: `总价计算不符：计算值${calculatedTotal.toFixed(2)} vs 申报值${declaredTotal}`,
        suggestion: `建议修正总价为：${calculatedTotal.toFixed(2)}`,
        severity: 'critical',
        autoFix: true,
        fixValue: parseFloat(calculatedTotal.toFixed(2))
      });
    }
    
    // 商品明细逻辑校验
    data.goods.forEach((item, index) => {
      // 单价合理性检查
      if (item.unitPrice <= 0) {
        errors.push({
          field: `goods[${index}].unitPrice`,
          error: `商品${index + 1}单价必须大于0`,
          suggestion: '请检查单价填写',
          severity: 'critical',
          autoFix: false
        });
      }
      
      // 数量合理性检查
      if (item.quantity1 <= 0) {
        errors.push({
          field: `goods[${index}].quantity1`,
          error: `商品${index + 1}数量必须大于0`,
          suggestion: '请检查数量填写',
          severity: 'critical',
          autoFix: false
        });
      }
      
      // 总价计算检查
      const itemTotal = item.quantity1 * item.unitPrice;
      const itemErrorRate = Math.abs(itemTotal - item.totalPrice) / Math.max(itemTotal, 0.01);
      if (itemErrorRate > 0.01) {
        errors.push({
          field: `goods[${index}].totalPrice`,
          error: `商品${index + 1}总价计算错误`,
          suggestion: `建议修正为：${itemTotal.toFixed(2)}`,
          severity: 'warning',
          autoFix: true,
          fixValue: parseFloat(itemTotal.toFixed(2))
        });
      }
    });
    
    // 汇率合理性检查
    if (data.exchangeRate) {
      if (data.currency === 'USD' && (data.exchangeRate < 6 || data.exchangeRate > 8)) {
        errors.push({
          field: 'exchangeRate',
          error: 'USD汇率可能不合理',
          suggestion: '请检查汇率是否为当日海关汇率',
          severity: 'warning',
          autoFix: false
        });
      }
    }
    
    return errors;
  }
}

/**
 * 阶段3：监管合规校验（5-8秒）
 */
class ComplianceValidator {
  validate(data: DeclarationData): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // HS编码监管要求检查
    data.goods.forEach((item, index) => {
      if (item.goodsCode) {
        // 根据HS编码前缀判断商品类别和监管要求
        const hsPrefix = item.goodsCode.substring(0, 4);
        
        // 食品类商品检查（前4位为特定范围）
        const foodCategories = ['0401', '0402', '0403', '0404', '0405', '0406', '0407', '0408', '0409'];
        if (foodCategories.some(cat => hsPrefix.startsWith(cat.substring(0, 2)))) {
          if (!item.goodsNameSpec.includes('保质期') && !item.goodsNameSpec.includes('生产日期')) {
            errors.push({
              field: `goods[${index}].goodsNameSpec`,
              error: `商品${index + 1}为食品类，需要在商品名称中说明保质期等信息`,
              suggestion: '请在商品名称中补充保质期、生产日期等申报要素',
              severity: 'warning',
              autoFix: false
            });
          }
        }
        
        // 机电产品检查
        const mechanicalCategories = ['8401', '8402', '8403', '8404', '8405'];
        if (mechanicalCategories.some(cat => hsPrefix.startsWith(cat.substring(0, 2)))) {
          if (!item.goodsNameSpec.includes('功率') && !item.goodsNameSpec.includes('电压')) {
            errors.push({
              field: `goods[${index}].goodsNameSpec`,
              error: `商品${index + 1}为机电产品，需要申报技术参数`,
              suggestion: '请在商品名称中补充功率、电压等技术参数',
              severity: 'warning',
              autoFix: false
            });
          }
        }
        
        // 化工产品检查
        const chemicalCategories = ['2801', '2802', '2803', '2804', '2805'];
        if (chemicalCategories.some(cat => hsPrefix.startsWith(cat.substring(0, 2)))) {
          if (!item.goodsNameSpec.includes('成分') && !item.goodsNameSpec.includes('含量')) {
            errors.push({
              field: `goods[${index}].goodsNameSpec`,
              error: `商品${index + 1}为化工产品，需要申报成分含量`,
              suggestion: '请在商品名称中补充主要成分和含量信息',
              severity: 'warning',
              autoFix: false
            });
          }
        }
      }
    });
    
    // 贸易方式与监管方式匹配检查
    if (data.supervisionMode === '0110' && data.totalAmountForeign < 1000) {
      errors.push({
        field: 'supervisionMode',
        error: '一般贸易方式申报金额过低',
        suggestion: '金额较小的货物建议选择其他监管方式',
        severity: 'suggestion',
        autoFix: false
      });
    }
    
    // 单据一致性检查
    if (data.billNo && !data.transportName) {
      errors.push({
        field: 'transportName',
        error: '已填写提运单号但缺少运输工具名称',
        suggestion: '请补充运输工具名称信息',
        severity: 'warning',
        autoFix: false
      });
    }
    
    return errors;
  }
}

/**
 * AI海关校验引擎主类
 */
export class CustomsValidationEngine {
  private fieldValidator = new FieldIntegrityValidator();
  private logicValidator = new DataLogicValidator();
  private complianceValidator = new ComplianceValidator();
  
  /**
   * 执行完整的海关校验
   */
  async validateDeclaration(data: DeclarationData): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      // 并行执行三个阶段的校验
      const [fieldErrors, logicErrors, complianceErrors] = await Promise.all([
        Promise.resolve(this.fieldValidator.validate(data)),
        Promise.resolve(this.logicValidator.validate(data)),
        Promise.resolve(this.complianceValidator.validate(data))
      ]);
      
      const validationTime = (Date.now() - startTime) / 1000;
      
      // 按严重程度分类错误
      const allErrors = [...fieldErrors, ...logicErrors, ...complianceErrors];
      const errors = allErrors.filter(e => e.severity === 'critical');
      const warnings = allErrors.filter(e => e.severity === 'warning');
      const suggestions = allErrors.filter(e => e.severity === 'suggestion');
      
      // 计算总体状态
      let overallStatus: 'pass' | 'warning' | 'error' = 'pass';
      if (errors.length > 0) {
        overallStatus = 'error';
      } else if (warnings.length > 0) {
        overallStatus = 'warning';
      }
      
      // 计算通过项目数
      const totalChecks = this.calculateTotalChecks(data);
      const passedCount = totalChecks - allErrors.length;
      
      return {
        overallStatus,
        validationTime,
        errors,
        warnings,
        suggestions,
        passedCount,
        totalChecks,
        customsReady: errors.length === 0
      };
      
    } catch (error) {
      console.error('校验引擎执行错误:', error);
      return {
        overallStatus: 'error',
        validationTime: (Date.now() - startTime) / 1000,
        errors: [{
          field: 'system',
          error: '校验系统发生错误',
          suggestion: '请重试或联系技术支持',
          severity: 'critical',
          autoFix: false
        }],
        warnings: [],
        suggestions: [],
        passedCount: 0,
        totalChecks: 0,
        customsReady: false
      };
    }
  }
  
  /**
   * 应用自动修复
   */
  applyAutoFix(data: DeclarationData, error: ValidationError): DeclarationData {
    if (!error.autoFix || error.fixValue === undefined) {
      return data;
    }
    
    const fixedData = { ...data };
    
    // 解析字段路径并应用修复值
    const fieldPath = error.field.split('.');
    if (fieldPath.length === 1) {
      (fixedData as any)[fieldPath[0]] = error.fixValue;
    } else if (fieldPath.length === 3 && fieldPath[0] === 'goods') {
      const index = parseInt(fieldPath[1].match(/\d+/)?.[0] || '0');
      const field = fieldPath[2];
      if (fixedData.goods[index]) {
        (fixedData.goods[index] as any)[field] = error.fixValue;
      }
    }
    
    return fixedData;
  }
  
  /**
   * 计算总检查项目数
   */
  private calculateTotalChecks(data: DeclarationData): number {
    let totalChecks = 15; // 基础字段检查项
    totalChecks += data.goods.length * 8; // 每个商品8项检查
    if (data.grossWeight && data.netWeight) totalChecks += 2; // 重量检查
    if (data.exchangeRate) totalChecks += 1; // 汇率检查
    return totalChecks;
  }
}

// 导出工厂函数
export function createCustomsValidator(): CustomsValidationEngine {
  return new CustomsValidationEngine();
}

// 导出状态辅助函数
export function getStatusMessage(status: 'pass' | 'warning' | 'error'): string {
  switch (status) {
    case 'pass':
      return '🎉 校验通过，可以提交申报';
    case 'warning':
      return '⚠️ 存在警告，建议优化后申报';
    case 'error':
      return '❌ 存在严重错误，需修复后申报';
    default:
      return '校验状态未知';
  }
}

export function getStatusColor(status: 'pass' | 'warning' | 'error'): string {
  switch (status) {
    case 'pass':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}