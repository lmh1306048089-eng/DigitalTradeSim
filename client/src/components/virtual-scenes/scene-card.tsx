import { ArrowRight, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VirtualScene } from "@/types";

interface SceneCardProps {
  scene: VirtualScene;
  status?: "completed" | "in_progress" | "locked";
  onClick?: () => void;
}

export function SceneCard({ scene, status = "locked", onClick }: SceneCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-secondary/20 text-secondary">已完成</Badge>;
      case "in_progress":
        return <Badge className="bg-primary/20 text-primary">进行中</Badge>;
      case "locked":
      default:
        return <Badge variant="outline" className="text-muted-foreground">未开始</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
      case "in_progress":
        return <ArrowRight className="h-4 w-4 text-muted-foreground" />;
      case "locked":
      default:
        return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card 
      className={`scene-card-hover cursor-pointer overflow-hidden ${
        status === "locked" ? "opacity-75" : ""
      }`}
      onClick={status !== "locked" ? onClick : undefined}
      data-testid={`scene-card-${scene.id}`}
    >
      {scene.imageUrl && (
        <img 
          src={scene.imageUrl} 
          alt={scene.name}
          className="w-full h-48 object-cover"
          data-testid="scene-image"
        />
      )}
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-2" data-testid="scene-name">
          {scene.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4" data-testid="scene-description">
          {scene.description}
        </p>
        <div className="flex items-center justify-between">
          {getStatusBadge()}
          {getStatusIcon()}
        </div>
      </CardContent>
    </Card>
  );
}
