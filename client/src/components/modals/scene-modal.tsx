import { useState } from "react";
import { ArrowRight, Monitor, FolderOpen, Printer, PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VirtualScene } from "@/types";

interface SceneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scene: VirtualScene | null;
}

export function SceneModal({ open, onOpenChange, scene }: SceneModalProps) {
  const [currentTask, setCurrentTask] = useState("目的国入境清关实验");

  if (!scene) return null;

  const interactiveElements = [
    { id: "business", icon: Monitor, label: "业务系统", description: "进入业务系统操作界面" },
    { id: "files", icon: FolderOpen, label: "材料管理", description: "查看和提交备案材料" },
    { id: "printer", icon: Printer, label: "单据打印", description: "打印申报单据" },
    { id: "training", icon: PlayCircle, label: "指导视频", description: "观看操作指导" },
  ];

  const handleElementClick = (elementId: string) => {
    switch (elementId) {
      case "business":
        // TODO: Open business system modal
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
                  {scene.interactiveElements?.map((element, index) => (
                    <li key={index} data-testid={`interactive-element-${index}`}>
                      • {element}
                    </li>
                  )) || [
                    "• 办公电脑 - 进入业务系统操作界面",
                    "• 文件柜 - 查看和提交备案材料", 
                    "• 打印机 - 打印申报单据",
                    "• 会议室 - 查看培训视频和指导"
                  ].map((element, index) => (
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
              >
                <element.icon className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <div className="text-sm font-medium">{element.label}</div>
                  <div className="text-xs text-muted-foreground">{element.description}</div>
                </div>
              </Button>
            ))}
          </div>

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
            <Button data-testid="button-scene-start">
              开始实验
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
