import { useState } from "react";
import { ArrowRight, ArrowLeft, Download, Upload, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileUpload } from "@/components/experiments/file-upload";
import { CustomsQualificationForm } from "@/components/customs/customs-qualification-form";
import type { Experiment, StudentProgress } from "@/types/index";

interface ExperimentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experiment: Experiment | null;
  progress?: StudentProgress;
}

export function ExperimentModal({ open, onOpenChange, experiment, progress }: ExperimentModalProps) {
  const [currentStep, setCurrentStep] = useState(progress?.currentStep || 0);
  const [showCustomsForm, setShowCustomsForm] = useState(false);

  if (!experiment) return null;

  const steps = experiment.steps || [
    { name: "模式选择", status: "completed" },
    { name: "订仓单推送", status: "current" },
    { name: "报关单数据申报", status: "pending" },
    { name: "随附单证上传", status: "pending" },
  ];

  const getCurrentStepContent = () => {
    const step = steps[currentStep];
    if (!step) return null;

    switch (currentStep) {
      case 1: // 订仓单推送
        return (
          <div className="space-y-4">
            <h4 className="font-medium">步骤2: 订仓单数据导入</h4>
            <p className="text-sm text-muted-foreground">
              请下载报关单模式模板，填写货物信息后上传创建申报任务
            </p>
            
            <FileUpload 
              experimentId={experiment.id}
              onUploadComplete={(file) => {
                console.log('File uploaded:', file);
              }}
            />
            
            <div className="flex space-x-4">
              <Button variant="outline" data-testid="button-download-template">
                <Download className="mr-2 h-4 w-4" />
                下载模板
              </Button>
              <Button data-testid="button-upload-continue">
                <Upload className="mr-2 h-4 w-4" />
                上传并继续
              </Button>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-4">
            <h4 className="font-medium">{step.name}</h4>
            <p className="text-sm text-muted-foreground">
              {step.description || "按照指导完成当前步骤的操作。"}
            </p>
          </div>
        );
    }
  };

  const canGoNext = () => {
    return currentStep < steps.length - 1;
  };

  const canGoPrevious = () => {
    return currentStep > 0;
  };

  const handleNext = () => {
    if (canGoNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious()) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 海关企业资质备案实验的特殊处理
  if (experiment.name === "海关企业资质备案" && showCustomsForm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-auto" data-testid="experiment-modal">
          <CustomsQualificationForm
            onComplete={(data) => {
              console.log("海关备案申请完成:", data);
              // 可以在这里处理完成逻辑，比如更新进度、显示成功信息等
              setShowCustomsForm(false);
              onOpenChange(false);
            }}
            onCancel={() => {
              setShowCustomsForm(false);
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" data-testid="experiment-modal">
        <DialogHeader>
          <DialogTitle data-testid="experiment-modal-title">
            {experiment.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 海关企业资质备案实验的开始按钮 */}
          {experiment.name === "海关企业资质备案" && !showCustomsForm && (
            <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  海关企业资质备案任务
                </h3>
                <p className="text-blue-700 dark:text-blue-300">
                  作为电商企业操作员，您需要完成企业向海关的资质备案申请。
                  这是开展跨境电商业务的重要前提步骤。
                </p>
                <div className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
                  <p>• 填写完整的企业基本信息</p>
                  <p>• 确认进出口经营范围</p>
                  <p>• 上传报关单位备案信息表（加盖公章）</p>
                  <p>• 提交备案申请等待审核</p>
                </div>
                <Button
                  onClick={() => setShowCustomsForm(true)}
                  className="mt-4"
                  data-testid="button-start-customs-filing"
                >
                  开始备案申请
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* 标准实验步骤显示（非海关备案实验） */}
          {experiment.name !== "海关企业资质备案" && (
            <>
              {/* Experiment Steps Progress */}
              <div className="space-y-4">
                <h3 className="font-semibold">实验步骤</h3>
                <div className="space-y-3">
                  {steps.map((step: any, index: number) => (
                    <div 
                      key={index}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        index === currentStep 
                          ? "bg-primary/10 border border-primary/20" 
                          : index < currentStep
                            ? "bg-secondary/10"
                            : "bg-muted"
                      }`}
                      data-testid={`step-indicator-${index}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        index < currentStep
                          ? "bg-secondary text-white"
                          : index === currentStep
                            ? "bg-primary text-white"
                            : "bg-muted-foreground text-white"
                      }`}>
                        {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
                      </div>
                      <span className={`text-sm ${
                        index === currentStep ? "font-medium" : ""
                      }`}>
                        {step.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Step Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>总体进度</span>
                  <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                </div>
                <Progress value={((currentStep + 1) / steps.length) * 100} />
              </div>

              {/* Current Step Content */}
              <div className="bg-muted rounded-lg p-6" data-testid="current-step-content">
                {getCurrentStepContent()}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  data-testid="button-experiment-close"
                >
                  返回场景
                </Button>
                
                <div className="space-x-3">
                  <Button 
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={!canGoPrevious()}
                    data-testid="button-experiment-previous"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    上一步
                  </Button>
                  <Button 
                    onClick={handleNext}
                    disabled={!canGoNext()}
                    className="bg-secondary hover:bg-secondary/90"
                    data-testid="button-experiment-next"
                  >
                    下一步
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
