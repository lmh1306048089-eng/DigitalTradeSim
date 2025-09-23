import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { insertDeclarationFormSchema, type InsertDeclarationForm } from "@shared/schema";
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
  BarChart3,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import mammoth from 'mammoth';

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

interface UploadedFileMetadata {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  userId: string;
  experimentId: string;
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
  const [uploadedFile, setUploadedFile] = useState<UploadedFileMetadata | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPreviewTask, setSelectedPreviewTask] = useState<DeclarationTask | null>(null);
  // 设置react-hook-form
  const form = useForm<InsertDeclarationForm>({
    resolver: zodResolver(insertDeclarationFormSchema),
    mode: 'onChange', // 启用实时验证
    defaultValues: {
      consignorConsignee: '',
      exportPort: '',
      transportMode: '1', // 移除 as any，使用字符串类型
      currency: 'USD',
      declareDate: new Date(),
      userId: '',
      status: 'draft',
      // 基本申报信息
      preEntryNo: '',
      customsNo: '',
      productionSalesUnit: '',
      declarationUnit: '',
      filingNo: '',
      licenseNo: '',
      // 合同与发票信息
      contractNo: '',
      invoiceNo: '',
      tradeTerms: 'FOB',
      // 贸易信息
      transportName: '',
      tradeCountry: '',
      arrivalCountry: '',
      // 金融信息
      totalAmountForeign: '',
      totalAmountCNY: '',
      exchangeRate: '',
      freight: '',
      insurance: '',
      otherCharges: '',
      // 包装信息
      packages: '',
      packageType: '',
      grossWeight: '',
      netWeight: '',
      // 申报相关信息
      declarationLocation: '',
      customsDistrict: '',
      declarationPerson: '',
      declarationPhone: '',
      // 标记备注
      marksAndNotes: '',
      // 申报选项
      inspectionQuarantine: false,
      priceInfluenceFactor: false,
      paymentSettlementUsage: false,
    },
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
    // 下载DOCX模板文件
    const downloadUrl = '/api/templates/customs-declaration.docx';
    window.location.href = downloadUrl;
    
    toast({
      title: "模板下载开始",
      description: "正在下载海关出口货物报关单模板文件",
    });
    
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  // 文件解析和自动填充功能
  const parseFileAndAutoFill = async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let parsedData: any = {};

    try {
      switch (fileExtension) {
        case 'csv':
          parsedData = await parseCSVFile(file);
          break;
        case 'xlsx':
        case 'xls':
          parsedData = await parseExcelFile(file);
          break;
        case 'docx':
          parsedData = await parseDOCXFile(file);
          break;
        default:
          throw new Error('不支持的文件格式');
      }

      // 自动填充表单数据（使用react-hook-form）
      if (Object.keys(parsedData).length > 0) {
        const allowedKeys = Object.keys(form.getValues()) as (keyof InsertDeclarationForm)[];
        
        Object.entries(parsedData).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '' && allowedKeys.includes(key as keyof InsertDeclarationForm)) {
            try {
              // 类型强制转换
              let processedValue: any = value;
              
              // 处理布尔字段
              if (['inspectionQuarantine', 'priceInfluenceFactor', 'paymentSettlementUsage'].includes(key)) {
                processedValue = Boolean(value) || String(value).toLowerCase() === 'true';
              }
              // 处理日期字段
              else if (key === 'declareDate') {
                processedValue = value instanceof Date ? value : new Date(String(value));
              }
              // 处理数值字段
              else if (['totalAmountForeign', 'totalAmountCNY', 'exchangeRate', 'freight', 'insurance', 'otherCharges', 'grossWeight', 'netWeight'].includes(key)) {
                const numValue = parseFloat(String(value));
                if (!isNaN(numValue)) {
                  processedValue = numValue;
                }
              }
              // 处理整数字段
              else if (['packages'].includes(key)) {
                const intValue = parseInt(String(value), 10);
                if (!isNaN(intValue)) {
                  processedValue = intValue;
                }
              }
              // 其他字段保持字符串
              else {
                processedValue = String(value);
              }
              
              form.setValue(key as keyof InsertDeclarationForm, processedValue);
            } catch (error) {
              console.warn(`无法设置字段 ${key}:`, error);
            }
          }
        });

        toast({
          title: "文件解析成功",
          description: `从 ${file.name} 中解析出数据并自动填充表单`,
        });
      }
    } catch (error) {
      console.error('文件解析错误:', error);
      toast({
        title: "文件解析失败",
        description: `无法解析文件 ${file.name}，请检查文件格式`,
        variant: "destructive"
      });
    }
  };

  // CSV文件解析
  const parseCSVFile = (file: File): Promise<any> => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data[0] as any; // 假设第一行是数据
          const mappedData = mapDataToFormFields(data);
          resolve(mappedData);
        },
        error: (error) => {
          console.error('CSV解析错误:', error);
          resolve({});
        }
      });
    });
  };

  // Excel文件解析
  const parseExcelFile = (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length > 0) {
            const mappedData = mapDataToFormFields(jsonData[0] as any);
            resolve(mappedData);
          } else {
            resolve({});
          }
        } catch (error) {
          console.error('Excel解析错误:', error);
          resolve({});
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // DOCX文件解析（使用mammoth库）
  const parseDOCXFile = (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // 使用mammoth解析DOCX文件
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;
          
          // 解析文档中的表单数据
          const mappedData = parseDOCXContent(text);
          resolve(mappedData);
        } catch (error) {
          console.error('DOCX解析错误:', error);
          resolve({});
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // 解析DOCX文档内容并提取表单数据
  const parseDOCXContent = (text: string) => {
    const mappedData: any = {};
    
    // 定义文档中常见的标签模式
    const patterns: { [key: string]: RegExp[] } = {
      preEntryNo: [
        /预录入编号[：:]\s*([^\s\n]+)/g,
        /Pre-entry No[：:]\s*([^\s\n]+)/gi
      ],
      customsNo: [
        /海关编号[：:]\s*([^\s\n]+)/g,
        /Customs No[：:]\s*([^\s\n]+)/gi
      ],
      consignorConsignee: [
        /收发货人[：:]\s*([^\n]+)/g,
        /发货人[：:]\s*([^\n]+)/g,
        /Consignor[：:]\s*([^\n]+)/gi
      ],
      declarationUnit: [
        /申报单位[：:]\s*([^\n]+)/g,
        /Declaration Unit[：:]\s*([^\n]+)/gi
      ],
      exportPort: [
        /出口口岸[：:]\s*([^\s\n]+)/g,
        /Export Port[：:]\s*([^\s\n]+)/gi
      ],
      transportMode: [
        /运输方式[：:]\s*([^\n]+)/g,
        /Transport Mode[：:]\s*([^\n]+)/gi
      ],
      tradeCountry: [
        /贸易国[：:]\s*([^\s\n]+)/g,
        /贸易国.*地区[：:]\s*([^\s\n]+)/g,
        /Trade Country[：:]\s*([^\s\n]+)/gi
      ],
      productName: [
        /商品名称[：:]\s*([^\n]+)/g,
        /Product Name[：:]\s*([^\n]+)/gi,
        /货物名称[：:]\s*([^\n]+)/g
      ],
      hsCode: [
        /HS编码[：:]\s*([^\s\n]+)/g,
        /HS Code[：:]\s*([^\s\n]+)/gi,
        /商品编码[：:]\s*([^\s\n]+)/g
      ],
      originCountry: [
        /原产国[：:]\s*([^\s\n]+)/g,
        /Origin Country[：:]\s*([^\s\n]+)/gi,
        /原产地[：:]\s*([^\s\n]+)/g
      ],
      quantity: [
        /数量[：:]\s*([^\s\n]+)/g,
        /Quantity[：:]\s*([^\s\n]+)/gi
      ],
      unitPrice: [
        /单价[：:]\s*([^\s\n]+)/g,
        /Unit Price[：:]\s*([^\s\n]+)/gi
      ],
      totalPrice: [
        /总价[：:]\s*([^\s\n]+)/g,
        /Total Price[：:]\s*([^\s\n]+)/gi,
        /总金额[：:]\s*([^\s\n]+)/g
      ],
      // 金融信息字段
      totalAmountForeign: [
        /外币总价[：:]\s*([^\s\n]+)/g,
        /外币金额[：:]\s*([^\s\n]+)/g,
        /Foreign Amount[：:]\s*([^\s\n]+)/gi
      ],
      totalAmountCNY: [
        /人民币总价[：:]\s*([^\s\n]+)/g,
        /人民币金额[：:]\s*([^\s\n]+)/g,
        /CNY Amount[：:]\s*([^\s\n]+)/gi
      ],
      exchangeRate: [
        /汇率[：:]\s*([^\s\n]+)/g,
        /Exchange Rate[：:]\s*([^\s\n]+)/gi
      ],
      freight: [
        /运费[：:]\s*([^\s\n]+)/g,
        /Freight[：:]\s*([^\s\n]+)/gi,
        /运输费[：:]\s*([^\s\n]+)/g
      ],
      insurance: [
        /保险费[：:]\s*([^\s\n]+)/g,
        /Insurance[：:]\s*([^\s\n]+)/gi
      ],
      otherCharges: [
        /杂费[：:]\s*([^\s\n]+)/g,
        /Other Charges[：:]\s*([^\s\n]+)/gi,
        /其他费用[：:]\s*([^\s\n]+)/g
      ],
      tradeTerms: [
        /成交方式[：:]\s*([^\s\n]+)/g,
        /Trade Terms[：:]\s*([^\s\n]+)/gi,
        /贸易条款[：:]\s*([^\s\n]+)/g
      ],
      contractNo: [
        /合同协议号[：:]\s*([^\s\n]+)/g,
        /Contract No[：:]\s*([^\s\n]+)/gi,
        /合同号[：:]\s*([^\s\n]+)/g
      ],
      invoiceNo: [
        /发票号[：:]\s*([^\s\n]+)/g,
        /Invoice No[：:]\s*([^\s\n]+)/gi,
        /发票编号[：:]\s*([^\s\n]+)/g
      ],
      // 包装信息字段
      packages: [
        /件数[：:]\s*([^\s\n]+)/g,
        /Packages[：:]\s*([^\s\n]+)/gi,
        /包装件数[：:]\s*([^\s\n]+)/g
      ],
      packageType: [
        /包装种类[：:]\s*([^\s\n]+)/g,
        /Package Type[：:]\s*([^\s\n]+)/gi,
        /包装类型[：:]\s*([^\s\n]+)/g
      ],
      grossWeight: [
        /毛重[：:]\s*([^\s\n]+)/g,
        /Gross Weight[：:]\s*([^\s\n]+)/gi,
        /总重量[：:]\s*([^\s\n]+)/g
      ],
      netWeight: [
        /净重[：:]\s*([^\s\n]+)/g,
        /Net Weight[：:]\s*([^\s\n]+)/gi,
        /净重量[：:]\s*([^\s\n]+)/g
      ],
      // 申报相关信息字段
      declarationLocation: [
        /申报地点[：:]\s*([^\n]+)/g,
        /Declaration Location[：:]\s*([^\n]+)/gi,
        /申报地[：:]\s*([^\n]+)/g
      ],
      customsDistrict: [
        /关区代码[：:]\s*([^\s\n]+)/g,
        /Customs District[：:]\s*([^\s\n]+)/gi,
        /海关关区[：:]\s*([^\s\n]+)/g
      ],
      declarationPerson: [
        /申报人员[：:]\s*([^\n]+)/g,
        /Declaration Person[：:]\s*([^\n]+)/gi,
        /申报人[：:]\s*([^\n]+)/g
      ],
      declarationPhone: [
        /申报联系电话[：:]\s*([^\s\n]+)/g,
        /Declaration Phone[：:]\s*([^\s\n]+)/gi,
        /申报电话[：:]\s*([^\s\n]+)/g
      ],
      filingNo: [
        /备案号[：:]\s*([^\s\n]+)/g,
        /Filing No[：:]\s*([^\s\n]+)/gi,
        /备案编号[：:]\s*([^\s\n]+)/g
      ],
      licenseNo: [
        /许可证号[：:]\s*([^\s\n]+)/g,
        /License No[：:]\s*([^\s\n]+)/gi,
        /许可证编号[：:]\s*([^\s\n]+)/g
      ]
    };

    // 遍历每个字段的模式，尝试提取数据
    Object.entries(patterns).forEach(([field, regexList]) => {
      for (const regex of regexList) {
        const matches = Array.from(text.matchAll(regex));
        if (matches.length > 0) {
          const value = matches[0][1]?.trim();
          if (value && value !== '') {
            mappedData[field] = value;
            break; // 找到匹配就跳出内层循环
          }
        }
      }
    });

    return mappedData;
  };

  // 将解析的数据映射到表单字段（改进的精确匹配）
  const mapDataToFormFields = (data: any) => {
    const mappedData: any = {};
    const mappingSummary: { matched: string[], unmatched: string[] } = { matched: [], unmatched: [] };
    
    // 精确的字段名映射字典
    const fieldMappings: { [key: string]: Set<string> } = {
      preEntryNo: new Set(['预录入编号', 'preentryno', 'pre_entry_no', '预录入号', 'pre-entry-no']),
      customsNo: new Set(['海关编号', 'customsno', 'customs_no', '海关号', 'customs-no']),
      consignorConsignee: new Set(['收发货人', 'consignor', 'consignee', '企业名称', 'company', '收货人', '发货人']),
      productionSalesUnit: new Set(['生产销售单位', 'production_sales_unit', '生产企业', 'production-sales-unit']),
      declarationUnit: new Set(['申报单位', 'declaration_unit', '申报企业', 'declaration-unit']),
      exportPort: new Set(['出口口岸', 'export_port', '口岸', 'export-port', '出境口岸']),
      transportMode: new Set(['运输方式', 'transport_mode', '运输', 'transport-mode', '运输工具类型']),
      transportName: new Set(['运输工具名称', 'transport_name', '运输工具', 'transport-name', '航班号', '船名']),
      tradeCountry: new Set(['贸易国', 'trade_country', '目的国', 'trade-country', '贸易国家']),
      arrivalCountry: new Set(['运抵国', 'arrival_country', '到达国', 'arrival-country', '最终目的国']),
      currency: new Set(['币制', 'currency', '货币', '币种']),
      productName: new Set(['商品名称', 'product_name', 'goods_name', '商品', 'product-name', 'goods-name', '货物名称']),
      quantity: new Set(['数量', 'quantity', 'qty', '件数']),
      unitPrice: new Set(['单价', 'unit_price', 'price', 'unit-price']),
      totalPrice: new Set(['总价', 'total_price', 'total_amount', '总金额', 'total-price', 'total-amount']),
      hsCode: new Set(['HS编码', 'hs_code', 'hscode', '编码', 'hs-code', '商品编码']),
      originCountry: new Set(['原产国', 'origin_country', '原产地', 'origin-country']),
      marksAndNotes: new Set(['备注', 'remarks', 'notes', '说明', '标记唛码', '唛头', 'marks']),
      // 金融信息字段
      totalAmountForeign: new Set(['外币总价', 'total_amount_foreign', '外币金额', 'foreign_amount', '外币价值']),
      totalAmountCNY: new Set(['人民币总价', 'total_amount_cny', '人民币金额', 'cny_amount', '人民币价值']),
      exchangeRate: new Set(['汇率', 'exchange_rate', 'rate', '换汇率', 'exchange-rate']),
      freight: new Set(['运费', 'freight', '运输费', 'shipping_cost', '运输费用']),
      insurance: new Set(['保险费', 'insurance', '保险', 'insurance_fee', '保险费用']),
      otherCharges: new Set(['杂费', 'other_charges', '其他费用', 'other_fees', '附加费']),
      tradeTerms: new Set(['成交方式', 'trade_terms', '贸易条款', 'trade_conditions', 'incoterms']),
      contractNo: new Set(['合同协议号', 'contract_no', '合同号', 'contract_number', '协议号']),
      invoiceNo: new Set(['发票号', 'invoice_no', '发票编号', 'invoice_number', '票据号']),
      // 包装信息字段
      packages: new Set(['件数', 'packages', '包装件数', 'package_count', '箱数']),
      packageType: new Set(['包装种类', 'package_type', '包装类型', 'packaging_type', '包装方式']),
      grossWeight: new Set(['毛重', 'gross_weight', '总重量', 'total_weight', '毛重量']),
      netWeight: new Set(['净重', 'net_weight', '净重量', 'net_weight_kg', '净重公斤']),
      // 申报相关信息字段
      declarationLocation: new Set(['申报地点', 'declaration_location', '申报地', 'declare_location', '申报场所']),
      customsDistrict: new Set(['关区代码', 'customs_district', '海关关区', 'customs_code', '关区']),
      declarationPerson: new Set(['申报人员', 'declaration_person', '申报人', 'declarant', '申报员']),
      declarationPhone: new Set(['申报联系电话', 'declaration_phone', '申报电话', 'phone', '联系电话']),
      filingNo: new Set(['备案号', 'filing_no', '备案编号', 'filing_number', '企业备案号']),
      licenseNo: new Set(['许可证号', 'license_no', '许可证编号', 'license_number', '执照号'])
    };

    // 标准化键名（去除空格，转换为小写，替换常见分隔符）
    const normalizeKey = (key: string): string => {
      return key.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[_-]/g, '')
        .replace(/[：:]/g, '');
    };

    // 遍历数据对象，进行精确匹配
    Object.keys(data).forEach(originalKey => {
      const normalizedKey = normalizeKey(originalKey);
      let matched = false;
      
      // 查找匹配的表单字段
      Object.entries(fieldMappings).forEach(([formField, possibleKeys]) => {
        if (!matched) { // 确保每个键只匹配一个字段
          for (const possibleKey of Array.from(possibleKeys)) {
            const normalizedPossibleKey = normalizeKey(possibleKey);
            
            // 精确匹配或完全包含匹配
            if (normalizedKey === normalizedPossibleKey || 
                (normalizedKey.length > 2 && normalizedPossibleKey.includes(normalizedKey)) ||
                (normalizedPossibleKey.length > 2 && normalizedKey.includes(normalizedPossibleKey))) {
              
              const value = data[originalKey];
              if (value !== null && value !== undefined && value !== '') {
                mappedData[formField] = String(value).trim();
                mappingSummary.matched.push(`${originalKey} → ${formField}`);
                matched = true;
                break;
              }
            }
          }
        }
      });

      if (!matched) {
        mappingSummary.unmatched.push(originalKey);
      }
    });

    // 打印映射摘要到控制台（便于调试）
    console.log('字段映射摘要:', mappingSummary);

    return mappedData;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // 1. 解析文件并自动填充表单
      await parseFileAndAutoFill(file);

      // 2. 上传文件到服务器（用于存档）
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('experimentId', 'df7e2bc1-4532-4f89-9db3-d5g11f3c159g'); // 报关单模式出口申报实验ID

      const response = await apiRequest("POST", "/api/upload", uploadFormData);
      
      if (response.ok) {
        const uploadedFileData: UploadedFileMetadata = await response.json();
        setUploadedFile(uploadedFileData);
      }
    } catch (error) {
      console.error('文件处理错误:', error);
      toast({
        title: "文件处理失败",
        description: "请检查文件格式并重试",
        variant: "destructive"
      });
    }
  };

  // 表单提交成功处理函数
  const onFormSubmit = (data: InsertDeclarationForm) => {
    if (!uploadedFile) {
      toast({
        title: "文件验证失败", 
        description: "请上传填写完成的申报文件",
        variant: "destructive"
      });
      return;
    }

    console.log('表单提交数据:', data);
    
    toast({
      title: "申报数据提交成功",
      description: "申报表单和文件已成功提交，即将创建申报任务",
    });
    
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  // 表单提交失败处理函数
  const onFormError = (errors: any) => {
    console.error('表单验证错误:', errors);
    toast({
      title: "表单验证失败",
      description: "请检查并填写所有必填字段",
      variant: "destructive"
    });
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

  const handlePreviewData = (task: DeclarationTask) => {
    setSelectedPreviewTask(task);
    setPreviewDialogOpen(true);
  };

  const generateMockDeclarationData = (task: DeclarationTask) => {
    const formValues = form.watch();
    return {
      预录入编号: `CB${new Date().getFullYear()}${(Math.random() * 10000).toFixed(0).padStart(4, '0')}`,
      海关编号: `${new Date().getFullYear()}${(Math.random() * 1000000).toFixed(0).padStart(6, '0')}`,
      收发货人: formValues.consignorConsignee || '深圳进出口有限公司',
      出口口岸: '上海浦东机场',
      出口日期: new Date().toISOString().split('T')[0],
      申报日期: new Date().toISOString().split('T')[0],
      生产销售单位: '上海贸易有限公司',
      运输方式: '5(航空运输)',
      运输工具名称: 'CA1234',
      商品名称: '智能手机配件',
      数量: '100台',
      单价: '15.50 USD',
      总价: '1550.00 USD',
      HS编码: '8517120000',
      原产国: '中国',
      监管方式: '9610',
      贸易方式: '跨境电商B2C出口',
      备注: '手机及配件'
    };
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
                        <div className="font-medium">海关出口货物报关单模板.docx</div>
                        <div className="text-sm text-gray-500">中华人民共和国海关标准格式</div>
                      </div>
                    </div>
                    <Badge variant="outline">标准格式</Badge>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">模板说明：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 包含预录入编号、海关编号、收发货人等基本信息</li>
                      <li>• 涵盖运输方式、监管方式、贸易国等贸易信息</li>
                      <li>• 包含商品编号、规格型号、数量单价等商品明细</li>
                      <li>• 符合中华人民共和国海关标准格式要求</li>
                      <li>• 可直接用于海关出口货物申报</li>
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
          <Form {...form}>
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Upload className="h-12 w-12 mx-auto mb-4 text-amber-600" />
                <h3 className="text-xl font-semibold mb-2">报关单申报表单</h3>
                <p className="text-gray-600">上传文件自动填充或手动填写完整的海关申报信息</p>
              </div>

            {/* 第一优先级：文件上传与自动填充 */}
            <Card className="border-2 border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  <span>1. 文件上传与自动填充</span>
                </CardTitle>
                <CardDescription>上传DOCX/CSV/XLS/XLSX文件自动解析并填充表单数据</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50/50">
                  <Upload className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-blue-700">拖拽文件或点击上传</h4>
                    <p className="text-sm text-blue-600">支持 DOCX, CSV, XLS, XLSX 格式文件</p>
                    <p className="text-xs text-blue-500">上传后将自动解析文件内容并填充下方表单</p>
                  </div>
                  <input
                    type="file"
                    accept=".docx,.csv,.xls,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    data-testid="input-file-upload"
                  />
                  <Label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 mt-6 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    选择文件上传
                  </Label>
                </div>
                
                {uploadedFile && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-medium text-green-700">{uploadedFile.originalName}</p>
                          <p className="text-sm text-green-600">已成功上传并解析</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadedFile(null)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        data-testid="button-remove-file"
                      >
                        移除文件
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 第二部分：基本申报信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span>2. 基本申报信息</span>
                </CardTitle>
                <CardDescription>填写海关申报的基础信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="preEntryNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>预录入编号</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="18110820180001"
                            data-testid="input-pre-entry-no"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customsNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>海关编号</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="181108201800010001"
                            data-testid="input-customs-no"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="consignorConsignee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>收发货人 *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="深圳市XX贸易有限公司"
                            data-testid="input-consignor-consignee"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="productionSalesUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>生产销售单位</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="深圳市XX电子科技有限公司"
                            data-testid="input-production-sales-unit"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="declarationUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>申报单位</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="深圳市XX报关有限公司"
                            data-testid="input-declaration-unit"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="filingNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>备案号</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="44011234567"
                            data-testid="input-filing-no"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 第三部分：贸易信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Ship className="h-5 w-5 text-blue-600" />
                  <span>3. 贸易信息</span>
                </CardTitle>
                <CardDescription>填写贸易相关的运输和地区信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="exportPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>出口口岸 *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="深圳"
                            data-testid="input-export-port"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transportMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>运输方式 *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger data-testid="select-transport-mode">
                              <SelectValue placeholder="选择运输方式" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1-非保税区运输</SelectItem>
                              <SelectItem value="2">2-直接运输</SelectItem>
                              <SelectItem value="3">3-转关运输</SelectItem>
                              <SelectItem value="4">4-航空运输</SelectItem>
                              <SelectItem value="5">5-海运</SelectItem>
                              <SelectItem value="9">9-其他运输</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transportName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>运输工具名称</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="CA123"
                            data-testid="input-transport-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tradeCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>贸易国(地区)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="美国"
                            data-testid="input-trade-country"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="arrivalCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>运抵国(地区)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="美国"
                            data-testid="input-arrival-country"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>币制</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value || 'USD'}>
                            <SelectTrigger data-testid="select-currency">
                              <SelectValue placeholder="选择币制" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">美元 (USD)</SelectItem>
                              <SelectItem value="EUR">欧元 (EUR)</SelectItem>
                              <SelectItem value="CNY">人民币 (CNY)</SelectItem>
                              <SelectItem value="GBP">英镑 (GBP)</SelectItem>
                              <SelectItem value="JPY">日元 (JPY)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 第四部分：金融与费用信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>4. 金融与费用信息</span>
                </CardTitle>
                <CardDescription>填写贸易金额、汇率及相关费用</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="totalAmountForeign"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>外币总价 *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="1550.00"
                            data-testid="input-total-amount-foreign"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalAmountCNY"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>人民币总价</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="11160.00"
                            data-testid="input-total-amount-cny"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="exchangeRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>汇率</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
                            placeholder="7.2000"
                            data-testid="input-exchange-rate"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="freight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>运费</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="150.00"
                            data-testid="input-freight"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="insurance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>保险费</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="50.00"
                            data-testid="input-insurance"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="otherCharges"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>杂费</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="25.00"
                            data-testid="input-other-charges"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tradeTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>成交方式</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger data-testid="select-trade-terms">
                              <SelectValue placeholder="选择成交方式" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FOB">FOB (离岸价)</SelectItem>
                              <SelectItem value="CIF">CIF (到岸价)</SelectItem>
                              <SelectItem value="CFR">CFR (成本加运费)</SelectItem>
                              <SelectItem value="EXW">EXW (工厂交货)</SelectItem>
                              <SelectItem value="FCA">FCA (货交承运人)</SelectItem>
                              <SelectItem value="CPT">CPT (运费付至)</SelectItem>
                              <SelectItem value="CIP">CIP (运费保险费付至)</SelectItem>
                              <SelectItem value="DAT">DAT (终端交货)</SelectItem>
                              <SelectItem value="DAP">DAP (目的地交货)</SelectItem>
                              <SelectItem value="DDP">DDP (完税后交货)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>合同协议号</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="CT202509220001"
                            data-testid="input-contract-no"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="invoiceNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>发票号</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="INV202509220001"
                            data-testid="input-invoice-no"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 第五部分：包装与重量信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  <span>5. 包装与重量信息</span>
                </CardTitle>
                <CardDescription>填写货物的包装和重量详细信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="packages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>件数 *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="100"
                            data-testid="input-packages"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>包装种类</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger data-testid="select-package-type">
                              <SelectValue placeholder="选择包装种类" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="01">纸箱</SelectItem>
                              <SelectItem value="02">木箱</SelectItem>
                              <SelectItem value="03">铁箱</SelectItem>
                              <SelectItem value="04">塑料箱</SelectItem>
                              <SelectItem value="05">袋装</SelectItem>
                              <SelectItem value="06">桶装</SelectItem>
                              <SelectItem value="07">散装</SelectItem>
                              <SelectItem value="99">其他</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="grossWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>毛重(千克) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="250.500"
                            data-testid="input-gross-weight"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="netWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>净重(千克) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="200.000"
                            data-testid="input-net-weight"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 第六部分：商品信息表格 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  <span>4. 商品信息明细</span>
                </CardTitle>
                <CardDescription>详细的商品申报信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 商品明细表格 - 这里将在下一个任务中实现动态表格 */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-6 gap-2 text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                      <div>项号</div>
                      <div>商品名称/规格型号</div>
                      <div>数量</div>
                      <div>单位</div>
                      <div>单价</div>
                      <div>总价</div>
                    </div>
                    <div className="grid grid-cols-6 gap-2 text-sm">
                      <Input placeholder="1" className="h-8" data-testid="input-item-no" />
                      <Input placeholder="智能手机" className="h-8" data-testid="input-goods-name" />
                      <Input placeholder="1" className="h-8" data-testid="input-quantity" />
                      <Input placeholder="台" className="h-8" data-testid="input-unit" />
                      <Input placeholder="999.00" className="h-8" data-testid="input-unit-price" />
                      <Input placeholder="999.00" className="h-8" data-testid="input-total-price" />
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <Button variant="outline" size="sm" data-testid="button-add-item">
                        + 添加商品明细
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 第五部分：备案与备注 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <span>5. 备案与备注</span>
                </CardTitle>
                <CardDescription>补充信息和备注说明</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="marksAndNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>标记唛码及备注</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="商品标记、包装说明、特殊要求等"
                          rows={4}
                          data-testid="textarea-marks-notes"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="inspectionQuarantine"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-inspection-quarantine"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          检验检疫
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priceInfluenceFactor"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-price-influence"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          价格影响因素
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentSettlementUsage"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-payment-settlement"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          支付/结汇方式
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 第七部分：申报相关信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span>7. 申报相关信息</span>
                </CardTitle>
                <CardDescription>填写申报地点、人员和联系方式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="declarationLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>申报地点</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="深圳蛇口海关"
                            data-testid="input-declaration-location"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customsDistrict"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>关区代码</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="5130"
                            data-testid="input-customs-district"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="declarationPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>申报人员</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="张三"
                            data-testid="input-declaration-person"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="declarationPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>申报联系电话</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="138-0000-0000"
                            data-testid="input-declaration-phone"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="filingNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>备案号</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="BA2025092200001"
                            data-testid="input-filing-no"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="licenseNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>许可证号</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="LIC20250922001"
                            data-testid="input-license-no"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 第八部分：标记唛码及备注 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span>8. 标记唛码及备注</span>
                </CardTitle>
                <CardDescription>填写货物标记、唛码和其他备注信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="marksAndNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>标记唛码及备注</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="请输入标记唛码及备注信息&#10;例如：&#10;- 货物标记：FRAGILE&#10;- 包装要求：防潮处理&#10;- 特殊说明：易碎物品，轻拿轻放"
                          className="min-h-[100px]"
                          data-testid="textarea-marks-and-notes"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        包括但不限于：货物标记、唛头信息、包装说明、特殊要求等
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              onClick={form.handleSubmit(onFormSubmit, onFormError)}
              className="w-full" 
              data-testid="button-submit-form"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              提交申报数据
            </Button>
            </div>
          </Form>
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
                          <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handlePreviewData(task)}
                                data-testid={`button-preview-data-${task.id}`}
                              >
                                预览数据
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>申报数据预览</DialogTitle>
                              </DialogHeader>
                              {selectedPreviewTask && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">任务信息</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">任务名称:</span>
                                          <span className="font-medium">{selectedPreviewTask.taskName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">创建时间:</span>
                                          <span className="font-medium">{selectedPreviewTask.createdAt}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">订单数量:</span>
                                          <span className="font-medium">{selectedPreviewTask.orderCount}个</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">状态:</span>
                                          <Badge variant="default">已生成</Badge>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">关联订单</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">订单号:</span>
                                          <span className="font-medium">{bookingData.orderNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">客户名称:</span>
                                          <span className="font-medium">{bookingData.customerName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">目的国:</span>
                                          <span className="font-medium">{bookingData.destinationCountry}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">总重量:</span>
                                          <span className="font-medium">{bookingData.weight}kg</span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                  
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">生成的申报数据</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                        {Object.entries(generateMockDeclarationData(selectedPreviewTask)).map(([key, value]) => (
                                          <div key={key} className="flex flex-col space-y-1">
                                            <span className="text-gray-600 text-xs">{key}</span>
                                            <span className="font-medium bg-gray-50 p-2 rounded border">{value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2 text-blue-800">数据说明：</h4>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                      <li>• 该数据基于您填写的申报信息自动生成</li>
                                      <li>• 符合海关跨境电商出口申报标准格式</li>
                                      <li>• 数据已完成合规性检查，可直接用于申报</li>
                                      <li>• 推送后将进入海关审核流程</li>
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
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