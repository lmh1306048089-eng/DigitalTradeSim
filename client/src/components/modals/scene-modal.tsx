import { useState } from "react";
import { ArrowRight, Monitor, FolderOpen, Printer, PlayCircle, FileText, Building2, Package } from "lucide-react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessRole } from "@/hooks/useBusinessRole";
import { SCENE_CONFIGS, BUSINESS_ROLES } from "@shared/business-roles";
import type { VirtualScene } from "@/types/index";

// 操作点类型定义
type OperationPoint = {
  businessRoleCode: string;
  entryName: string;
  entryDescription: string;
  allowedOperations: string[];
};

interface SceneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scene: VirtualScene | null;
}

export function SceneModal({ open, onOpenChange, scene }: SceneModalProps) {
  const [currentTask, setCurrentTask] = useState("目的国入境清关实验");
  const [showOperationsMenu, setShowOperationsMenu] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { selectedRoleCode } = useBusinessRole();

  if (!scene) return null;

  // 获取当前角色在这个场景中可以执行的操作
  const getAvailableOperations = () => {
    if (!selectedRoleCode || !scene.operationPoints) return [];
    
    const operationPoint = scene.operationPoints.find(
      (point) => point.businessRoleCode === selectedRoleCode
    );
    
    return operationPoint?.allowedOperations || [];
  };

  const availableOperations = getAvailableOperations();

  const interactiveElements = [
    { id: "business", icon: Monitor, label: "业务系统", description: "进入业务系统操作界面" },
    { id: "files", icon: FolderOpen, label: "材料管理", description: "查看和提交备案材料" },
    { id: "printer", icon: Printer, label: "单据打印", description: "打印申报单据" },
    { id: "training", icon: PlayCircle, label: "指导视频", description: "观看操作指导" },
  ];

  const handleElementClick = (elementId: string) => {
    switch (elementId) {
      case "business":
        if (availableOperations.length > 0) {
          setShowOperationsMenu(true);
        }
        break;
      case "files":
        // TODO: Open file manager
        break;
      case "printer":
        // TODO: Open printer interface
        break;
      case "training":
        // TODO: Open training videos
        break;
    }
  };

  const handleOperationClick = (operation: string) => {
    switch (operation) {
      case "出口申报":
        setLocation("/customs-declaration-export");
        onOpenChange(false);
        break;
      case "备案申报":
        // TODO: 导航到备案相关页面
        break;
      case "退税申报":
        // TODO: 导航到退税相关页面
        break;
      case "买家签收":
        setLocation("/package-delivery");
        onOpenChange(false);
        break;
      default:
        break;
    }
    setShowOperationsMenu(false);
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case "出口申报":
        return <FileText className="h-4 w-4" />;
      case "备案申报":
        return <Building2 className="h-4 w-4" />;
      case "退税申报":
        return <FileText className="h-4 w-4" />;
      case "买家签收":
        return <Package className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto" data-testid="scene-modal">
        <DialogHeader>
          <DialogTitle data-testid="scene-modal-title">{scene.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scene Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {scene.imageUrl && (
                <img 
                  src={scene.imageUrl} 
                  alt={scene.name}
                  className="rounded-lg w-full h-64 object-cover"
                  data-testid="scene-modal-image"
                />
              )}
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">场景说明</h3>
              <p className="text-muted-foreground" data-testid="scene-modal-description">
                {scene.description || "本场景完整还原真实业务环境，包含多个功能区域和可操作元素。学员可以在此场景中体验完整的业务流程操作。"}
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium">可操作元素：</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {scene.interactiveElements?.map((element: string, index: number) => (
                    <li key={index} data-testid={`interactive-element-${index}`}>
                      • {element}
                    </li>
                  )) || [
                    "• 办公电脑 - 进入业务系统操作界面",
                    "• 文件柜 - 查看和提交备案材料", 
                    "• 打印机 - 打印申报单据",
                    "• 会议室 - 查看培训视频和指导"
                  ].map((element: string, index: number) => (
                    <li key={index}>{element}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Elements */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {interactiveElements.map((element) => (
              <Button
                key={element.id}
                variant="outline"
                className="p-4 h-auto flex-col space-y-2 hover:bg-muted transition-colors"
                onClick={() => handleElementClick(element.id)}
                data-testid={`element-button-${element.id}`}
                disabled={element.id === "business" && availableOperations.length === 0}
              >
                <element.icon className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <div className="text-sm font-medium">{element.label}</div>
                  <div className="text-xs text-muted-foreground">{element.description}</div>
                </div>
              </Button>
            ))}
          </div>

          {/* Operations Menu */}
          {showOperationsMenu && availableOperations.length > 0 && (
            <div className="p-4 bg-accent/10 rounded-lg border">
              <h4 className="font-medium mb-3">选择操作类型</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {availableOperations.map((operation: string, index: number) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="p-3 h-auto flex items-center space-x-2 hover:bg-muted transition-colors"
                    onClick={() => handleOperationClick(operation)}
                    data-testid={`operation-button-${operation}`}
                  >
                    {getOperationIcon(operation)}
                    <span className="text-sm">{operation}</span>
                  </Button>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-3"
                onClick={() => setShowOperationsMenu(false)}
              >
                取消
              </Button>
            </div>
          )}

          {/* Current Task */}
          <div className="p-4 bg-accent/10 rounded-lg border-l-4 border-accent">
            <h4 className="font-medium text-accent mb-2">
              当前任务
            </h4>
            <p className="text-sm" data-testid="current-task">
              请点击对应操作元素，完成"{currentTask}"相关操作
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="button-scene-close"
            >
              返回
            </Button>
            {availableOperations.length > 0 && (
              <Button 
                onClick={() => setShowOperationsMenu(true)}
                data-testid="button-scene-start"
              >
                开始操作
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
