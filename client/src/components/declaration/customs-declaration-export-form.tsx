import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Ship, Package, FileText, CheckCircle, ArrowRight, ArrowLeft, Truck, Container, Globe, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { insertCustomsDeclarationExportTestDataSchema, type CustomsDeclarationExportTestData } from "@shared/schema";

// 分步验证模式 - 每步只验证当前步骤字段
const stepSchemas = {
  1: z.object({
    bookingOrderNumber: z.string().min(1, "订仓单号不能为空"),
    shippingCompany: z.string().min(1, "请选择船公司"),
    vesselName: z.string().min(1, "船名不能为空"),
    voyageNumber: z.string().min(1, "航次号不能为空"),
    containerNumber: z.string().min(1, "集装箱号不能为空"),
    containerType: z.string().min(1, "请选择集装箱类型"),
    sealNumber: z.string().min(1, "封条号不能为空"),
  }),
  2: z.object({
    declarationTaskId: z.string().min(1, "申报任务ID不能为空"),
    declarationSystemType: z.string().min(1, "请选择申报系统类型"),
    goodsDescription: z.string().min(10, "货物描述至少10个字符"),
    hsCode: z.string().min(1, "HS编码不能为空"),
    quantity: z.coerce.number().positive("数量必须大于0"),
    unit: z.string().min(1, "请选择计量单位"),
    totalValue: z.coerce.number().positive("总价值必须大于0"),
    currency: z.string().min(1, "请选择币制"),
  }),
  3: z.object({
    grossWeight: z.coerce.number().positive("毛重必须大于0"),
    netWeight: z.coerce.number().positive("净重必须大于0"),
    packageQuantity: z.coerce.number().int().positive("件数必须是正整数"),
    packageType: z.string().min(1, "请选择包装种类"),
    tradeMode: z.string().min(1, "请选择贸易方式"),
    exemptionMethod: z.string().min(1, "请选择征免性质"),
  }),
  4: z.object({
    customsDeclarationNumber: z.string().min(1, "报关单号不能为空"),
    singleWindowNumber: z.string().min(1, "单一窗口编号不能为空"),
    consignorName: z.string().min(1, "发货人名称不能为空"),
    consignorAddress: z.string().min(1, "发货人地址不能为空"),
    consigneeName: z.string().min(1, "收货人名称不能为空"),
    consigneeAddress: z.string().min(1, "收货人地址不能为空"),
    consigneeCountry: z.string().min(1, "请选择收货人国家"),
  }),
  5: z.object({
    declarationStatus: z.string().default("draft"),
    dataAccuracy: z.boolean().refine(val => val === true, "必须确认数据真实性"),
    legalResponsibility: z.boolean().refine(val => val === true, "必须承诺承担法律责任"),
    submitConsent: z.boolean().refine(val => val === true, "必须同意提交申请")
  })
};

// 完整表单数据类型
type CustomsDeclarationExportData = {
  // 步骤1: 订仓单推送
  bookingOrderNumber: string;
  shippingCompany: string;
  vesselName: string;
  voyageNumber: string;
  containerNumber: string;
  containerType: string;
  sealNumber: string;
  
  // 步骤3: 基础数据导入和申报任务创建
  declarationTaskId: string;
  declarationSystemType: string;
  goodsDescription: string;
  hsCode: string;
  quantity: number;
  unit: string;
  totalValue: number;
  currency: string;
  
  // 步骤4: 数据申报管理和推送
  grossWeight: number;
  netWeight: number;
  packageQuantity: number;
  packageType: string;
  tradeMode: string;
  exemptionMethod: string;
  
  // 步骤5: 报关单推送
  customsDeclarationNumber: string;
  singleWindowNumber: string;
  consignorName: string;
  consignorAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeCountry: string;
  
  // 步骤6: 申报结果查询
  declarationStatus: string;
  dataAccuracy: boolean;
  legalResponsibility: boolean;
  submitConsent: boolean;
};

interface CustomsDeclarationExportFormProps {
  onComplete?: (data: CustomsDeclarationExportData) => void;
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, title: "货物运抵申报", icon: Truck, description: "确认货物已运输至海关监管作业场所" },
  { id: 2, title: "订仓单推送", icon: Ship, description: "在跨境电商综合服务平台推送订仓单数据" },
  { id: 3, title: "基础数据导入", icon: FileText, description: "导入基础数据并创建申报任务" },
  { id: 4, title: "数据申报管理", icon: Package, description: "完善货物信息并进行数据推送" },
  { id: 5, title: "报关单推送", icon: Globe, description: "推送报关单至统一版系统" },
  { id: 6, title: "申报结果查询", icon: ClipboardList, description: "查询申报状态并确认结果" }
];

export function CustomsDeclarationExportForm({ onComplete, onCancel }: CustomsDeclarationExportFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // 获取测试数据进行自动预填
  const { data: testData, isLoading } = useQuery<CustomsDeclarationExportTestData[]>({
    queryKey: ['/api/test-data/customs-declaration-export'],
    enabled: true
  });

  const form = useForm<CustomsDeclarationExportData>({
    mode: "onChange",
    defaultValues: {
      currency: "USD",
      declarationStatus: "draft",
      dataAccuracy: false,
      legalResponsibility: false,
      submitConsent: false,
      // 数字字段默认值
      quantity: 0,
      totalValue: 0,
      grossWeight: 0,
      netWeight: 0,
      packageQuantity: 0,
      // 字符串字段默认值
      bookingOrderNumber: "",
      shippingCompany: "",
      vesselName: "",
      voyageNumber: "",
      containerNumber: "",
      containerType: "",
      sealNumber: "",
      declarationTaskId: "",
      declarationSystemType: "",
      goodsDescription: "",
      hsCode: "",
      unit: "",
      packageType: "",
      tradeMode: "",
      exemptionMethod: "",
      customsDeclarationNumber: "",
      singleWindowNumber: "",
      consignorName: "",
      consignorAddress: "",
      consigneeName: "",
      consigneeAddress: "",
      consigneeCountry: ""
    }
  });

  // 自动预填测试数据
  useEffect(() => {
    if (testData && Array.isArray(testData) && testData.length > 0) {
      const defaultTestData = testData[0]; // 使用默认测试企业数据
      
      // 静默预填所有字段
      form.reset({
        // 步骤1: 订仓单推送
        bookingOrderNumber: defaultTestData.bookingOrderNumber || "",
        shippingCompany: defaultTestData.shippingCompany || "",
        vesselName: defaultTestData.vesselName || "",
        voyageNumber: defaultTestData.voyageNumber || "",
        containerNumber: defaultTestData.containerNumber || "",
        containerType: defaultTestData.containerType || "",
        sealNumber: defaultTestData.sealNumber || "",

        // 步骤3: 基础数据导入和申报任务创建
        declarationTaskId: defaultTestData.declarationTaskId || "",
        declarationSystemType: defaultTestData.declarationSystemType || "",
        goodsDescription: defaultTestData.goodsDescription || "",
        hsCode: defaultTestData.hsCode || "",
        quantity: Number(defaultTestData.quantity) || 0,
        unit: defaultTestData.unit || "",
        totalValue: Number(defaultTestData.totalValue) || 0,
        currency: defaultTestData.currency || "USD",

        // 步骤4: 数据申报管理和推送
        grossWeight: Number(defaultTestData.grossWeight) || 0,
        netWeight: Number(defaultTestData.netWeight) || 0,
        packageQuantity: Number(defaultTestData.packageQuantity) || 0,
        packageType: defaultTestData.packageType || "",
        tradeMode: defaultTestData.tradeMode || "",
        exemptionMethod: defaultTestData.exemptionMethod || "",

        // 步骤5: 报关单推送
        customsDeclarationNumber: defaultTestData.customsDeclarationNumber || "",
        singleWindowNumber: defaultTestData.singleWindowNumber || "",
        consignorName: defaultTestData.consignorName || "",
        consignorAddress: defaultTestData.consignorAddress || "",
        consigneeName: defaultTestData.consigneeName || "",
        consigneeAddress: defaultTestData.consigneeAddress || "",
        consigneeCountry: defaultTestData.consigneeCountry || "",

        // 步骤6: 申报结果查询
        declarationStatus: defaultTestData.declarationStatus || "draft",

        // 保持确认项为false状态
        dataAccuracy: false,
        legalResponsibility: false,
        submitConsent: false
      });
    }
  }, [testData, form]);

  const progress = (currentStep / STEPS.length) * 100;

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 验证当前步骤
  const validateCurrentStep = async () => {
    const currentStepSchema = stepSchemas[currentStep as keyof typeof stepSchemas];
    const formData = form.getValues();
    
    try {
      currentStepSchema.parse(formData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // 将验证错误设置到表单
        error.errors.forEach((err) => {
          if (err.path[0]) {
            form.setError(err.path[0] as keyof CustomsDeclarationExportData, {
              type: "manual",
              message: err.message,
            });
          }
        });
      }
      return false;
    }
  };

  const onSubmit = async () => {
    // 验证当前步骤
    const isStepValid = await validateCurrentStep();
    if (!isStepValid) {
      return;
    }

    if (currentStep < STEPS.length) {
      nextStep();
      return;
    }

    // 最后一步，提交整个表单
    setIsSubmitting(true);
    try {
      const data = form.getValues();
      
      // 暂时使用模拟提交，API端点待实现
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "申报成功",
        description: "您的出口申报已成功提交，等待海关审核。",
      });

      onComplete?.(data);
    } catch (error) {
      toast({
        title: "提交失败",
        description: "申报提交失败，请检查网络连接后重试。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bookingOrderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>订仓单号</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入订仓单号" {...field} data-testid="input-booking-order-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shippingCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>船公司</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-shipping-company">
                          <SelectValue placeholder="请选择船公司" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="中远海运">中远海运</SelectItem>
                        <SelectItem value="马士基">马士基</SelectItem>
                        <SelectItem value="地中海航运">地中海航运</SelectItem>
                        <SelectItem value="东方海外">东方海外</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vesselName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>船名</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入船名" {...field} data-testid="input-vessel-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="voyageNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>航次号</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入航次号" {...field} data-testid="input-voyage-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="containerNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>集装箱号</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入集装箱号" {...field} data-testid="input-container-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="containerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>集装箱类型</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-container-type">
                          <SelectValue placeholder="请选择集装箱类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="20GP">20GP (20英尺干货集装箱)</SelectItem>
                        <SelectItem value="40GP">40GP (40英尺干货集装箱)</SelectItem>
                        <SelectItem value="40HQ">40HQ (40英尺高柜)</SelectItem>
                        <SelectItem value="45HQ">45HQ (45英尺高柜)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sealNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>封条号</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入封条号" {...field} data-testid="input-seal-number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="declarationTaskId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>申报任务ID</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入申报任务ID" {...field} data-testid="input-declaration-task-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="declarationSystemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>申报系统类型</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-declaration-system-type">
                          <SelectValue placeholder="请选择申报系统类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="单一窗口">单一窗口</SelectItem>
                        <SelectItem value="海关H2018">海关H2018</SelectItem>
                        <SelectItem value="跨境电商统一版">跨境电商统一版</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="goodsDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>货物描述</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="请详细描述货物信息，包括品牌、型号、规格等" 
                      className="min-h-[120px]" 
                      {...field} 
                      data-testid="textarea-goods-description" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hsCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HS编码</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入HS编码" {...field} data-testid="input-hs-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>计量单位</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-unit">
                          <SelectValue placeholder="请选择计量单位" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="千克">千克</SelectItem>
                        <SelectItem value="个">个</SelectItem>
                        <SelectItem value="台">台</SelectItem>
                        <SelectItem value="套">套</SelectItem>
                        <SelectItem value="箱">箱</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>数量</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="请输入数量" 
                        {...field}
                        value={field.value?.toString() || ""}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        data-testid="input-quantity" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>总价值</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="请输入总价值" 
                        {...field}
                        value={field.value?.toString() || ""}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        data-testid="input-total-value" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>币制</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-currency">
                        <SelectValue placeholder="请选择币制" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD (美元)</SelectItem>
                      <SelectItem value="CNY">CNY (人民币)</SelectItem>
                      <SelectItem value="EUR">EUR (欧元)</SelectItem>
                      <SelectItem value="JPY">JPY (日元)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grossWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>毛重（千克）</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001" 
                        placeholder="请输入毛重" 
                        {...field}
                        value={field.value?.toString() || ""}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        data-testid="input-gross-weight" 
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
                    <FormLabel>净重（千克）</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001" 
                        placeholder="请输入净重" 
                        {...field}
                        value={field.value?.toString() || ""}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        data-testid="input-net-weight" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="packageQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>件数</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="请输入件数" 
                        {...field}
                        value={field.value?.toString() || ""}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        data-testid="input-package-quantity" 
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-package-type">
                          <SelectValue placeholder="请选择包装种类" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="纸箱">纸箱</SelectItem>
                        <SelectItem value="木箱">木箱</SelectItem>
                        <SelectItem value="塑料箱">塑料箱</SelectItem>
                        <SelectItem value="托盘">托盘</SelectItem>
                        <SelectItem value="散装">散装</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tradeMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>贸易方式</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-trade-mode">
                          <SelectValue placeholder="请选择贸易方式" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1210">1210 (保税跨境贸易电子商务)</SelectItem>
                        <SelectItem value="9610">9610 (跨境贸易电子商务)</SelectItem>
                        <SelectItem value="0110">0110 (一般贸易)</SelectItem>
                        <SelectItem value="0139">0139 (其他贸易)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="exemptionMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>征免性质</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-exemption-method">
                          <SelectValue placeholder="请选择征免性质" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="101">101 (一般征税)</SelectItem>
                        <SelectItem value="106">106 (保税)</SelectItem>
                        <SelectItem value="299">299 (其他法定)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customsDeclarationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>报关单号</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入报关单号" {...field} data-testid="input-customs-declaration-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="singleWindowNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>单一窗口编号</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入单一窗口编号" {...field} data-testid="input-single-window-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="consignorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>发货人名称</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入发货人名称" {...field} data-testid="input-consignor-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consigneeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>收货人名称</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入收货人名称" {...field} data-testid="input-consignee-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="consignorAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>发货人地址</FormLabel>
                    <FormControl>
                      <Textarea placeholder="请输入发货人详细地址" {...field} data-testid="textarea-consignor-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consigneeAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>收货人地址</FormLabel>
                    <FormControl>
                      <Textarea placeholder="请输入收货人详细地址" {...field} data-testid="textarea-consignee-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="consigneeCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>收货人国家</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-consignee-country">
                        <SelectValue placeholder="请选择收货人国家" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="US">美国</SelectItem>
                      <SelectItem value="DE">德国</SelectItem>
                      <SelectItem value="JP">日本</SelectItem>
                      <SelectItem value="GB">英国</SelectItem>
                      <SelectItem value="FR">法国</SelectItem>
                      <SelectItem value="AU">澳大利亚</SelectItem>
                      <SelectItem value="CA">加拿大</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">申报状态查询</h3>
              </div>
              <p className="text-blue-700 dark:text-blue-300 mb-4">
                您的出口申报已提交完成，系统正在处理中。请确认以下信息无误后完成最终提交。
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">申报任务ID:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400" data-testid="text-task-id">
                    {form.getValues("declarationTaskId")}
                  </span>
                </div>
                <div>
                  <span className="font-medium">报关单号:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400" data-testid="text-declaration-number">
                    {form.getValues("customsDeclarationNumber")}
                  </span>
                </div>
                <div>
                  <span className="font-medium">货物描述:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400" data-testid="text-goods-desc">
                    {form.getValues("goodsDescription")?.substring(0, 50)}...
                  </span>
                </div>
                <div>
                  <span className="font-medium">申报状态:</span>
                  <Badge variant="secondary" data-testid="badge-status">草稿</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-md font-semibold">最终确认</h4>
              
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="dataAccuracy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-data-accuracy"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          我确认所填写的申报信息真实、准确、完整
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="legalResponsibility"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-legal-responsibility"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          我承诺对申报信息的真实性承担法律责任
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="submitConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-submit-consent"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          我同意提交此出口申报并接受海关监管
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 步骤指示器 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            报关单模式出口申报
          </h2>
          <Badge variant="outline" className="text-sm">
            步骤 {currentStep} / {STEPS.length}
          </Badge>
        </div>
        
        <Progress value={progress} className="w-full h-2" data-testid="progress-bar" />
        
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center space-y-2 flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                  ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 
                    isCompleted ? 'bg-green-600 border-green-600 text-white' : 
                    'bg-gray-100 border-gray-300 text-gray-400'}
                `}>
                  {isCompleted ? <CheckCircle className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                </div>
                <div className="text-center">
                  <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 max-w-20 leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 表单内容 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {React.createElement(STEPS[currentStep - 1].icon, { className: "h-5 w-5" })}
            <span>{STEPS[currentStep - 1].title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : (
            <Form {...form}>
              <div className="space-y-6">
                {renderStepContent()}

                <Separator />

                {/* 表单按钮 */}
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={currentStep === 1 ? onCancel : prevStep}
                    disabled={isSubmitting}
                    data-testid="button-prev"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {currentStep === 1 ? "取消" : "上一步"}
                  </Button>

                  <Button
                    type="button"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    data-testid="button-next"
                  >
                    {isSubmitting ? "提交中..." : currentStep === STEPS.length ? "完成申报" : "下一步"}
                    {currentStep < STEPS.length && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
              </div>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}