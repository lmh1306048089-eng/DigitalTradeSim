import { Clock, CheckCircle, Circle, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Experiment, StudentProgress } from "@/types";

interface ExperimentCardProps {
  experiment: Experiment;
  progress?: StudentProgress;
  onClick?: () => void;
  disabled?: boolean;
}

export function ExperimentCard({ experiment, progress, onClick, disabled }: ExperimentCardProps) {
  const getStatusBadge = () => {
    if (!progress) {
      return <Badge variant="outline" className="text-muted-foreground">未开始</Badge>;
    }
    
    switch (progress.status) {
      case "completed":
        return <Badge variant="secondary" className="bg-secondary/20 text-secondary">已完成</Badge>;
      case "in_progress":
        return <Badge className="bg-primary/20 text-primary">进行中</Badge>;
      case "not_started":
      default:
        return <Badge variant="outline" className="text-muted-foreground">未开始</Badge>;
    }
  };

  const getActionButton = () => {
    if (disabled) {
      return (
        <Button disabled className="w-full" data-testid="button-experiment-disabled">
          <Lock className="mr-2 h-4 w-4" />
          需完成前置实验
        </Button>
      );
    }

    if (!progress || progress.status === "not_started") {
      return (
        <Button 
          onClick={onClick} 
          className="w-full"
          data-testid="button-experiment-start"
        >
          开始实验
        </Button>
      );
    }

    if (progress.status === "in_progress") {
      return (
        <Button 
          onClick={onClick} 
          className="w-full bg-primary"
          data-testid="button-experiment-continue"
        >
          继续实验
        </Button>
      );
    }

    return (
      <Button 
        variant="outline" 
        onClick={onClick} 
        className="w-full"
        data-testid="button-experiment-view"
      >
        查看详情
      </Button>
    );
  };

  const getStepIcons = () => {
    if (!experiment.steps) return null;

    return experiment.steps.map((step, index) => {
      const isCompleted = progress && progress.currentStep && index < progress.currentStep;
      const isCurrent = progress && progress.currentStep === index;
      
      return (
        <div 
          key={index} 
          className="flex items-center space-x-3 p-3 rounded-lg"
          style={{
            backgroundColor: isCompleted 
              ? "hsl(var(--secondary) / 0.1)" 
              : isCurrent 
                ? "hsl(var(--primary) / 0.1)"
                : "hsl(var(--muted))"
          }}
          data-testid={`step-${index}`}
        >
          {isCompleted ? (
            <CheckCircle className="h-4 w-4 text-secondary" />
          ) : isCurrent ? (
            <Clock className="h-4 w-4 text-primary" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm">{step.name || `步骤 ${index + 1}`}</span>
        </div>
      );
    });
  };

  return (
    <Card className="h-full" data-testid={`experiment-card-${experiment.id}`}>
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg" data-testid="experiment-name">
            {experiment.name}
          </h3>
          {getStatusBadge()}
        </div>

        <p className="text-muted-foreground text-sm mb-4 flex-1" data-testid="experiment-description">
          {experiment.description}
        </p>

        {progress && progress.progress > 0 && (
          <div className="mb-4">
            <ProgressBar 
              value={progress.progress} 
              max={100}
              data-testid="experiment-progress"
            />
          </div>
        )}

        {experiment.steps && experiment.steps.length > 0 && (
          <div className="space-y-2 mb-4" data-testid="experiment-steps">
            {getStepIcons()}
          </div>
        )}

        {getActionButton()}
      </CardContent>
    </Card>
  );
}
