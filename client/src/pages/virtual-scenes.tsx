import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { SceneCard } from "@/components/virtual-scenes/scene-card";
import { SceneModal } from "@/components/modals/scene-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VirtualScene, StudentProgress } from "@/types";

export default function VirtualScenesPage() {
  const [, setLocation] = useLocation();
  const [selectedScene, setSelectedScene] = useState<VirtualScene | null>(null);

  // Fetch data
  const { data: scenes = [] } = useQuery<VirtualScene[]>({
    queryKey: ["/api/scenes"],
  });

  const { data: progress = [] } = useQuery<StudentProgress[]>({
    queryKey: ["/api/progress"],
  });

  // Helper functions
  const getSceneStatus = (sceneId: string) => {
    const sceneProgress = progress.find(p => p.sceneId === sceneId);
    if (!sceneProgress) return "locked";
    return sceneProgress.status === "completed" ? "completed" : "in_progress";
  };

  const getSceneProgress = (sceneId: string) => {
    return progress.find(p => p.sceneId === sceneId);
  };

  // Scene data with images from design reference
  const scenesWithImages = scenes.map((scene, index) => {
    const imageUrls = [
      "https://images.unsplash.com/photo-1560472355-109703aa3edc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300", // E-commerce office
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300", // Customs office
      "https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300", // Logistics warehouse
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300", // Overseas warehouse
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300", // Digital interface
    ];
    
    return {
      ...scene,
      imageUrl: scene.imageUrl || imageUrls[index % imageUrls.length],
    };
  });

  const completedScenes = scenesWithImages.filter(scene => getSceneStatus(scene.id) === "completed").length;
  const inProgressScenes = scenesWithImages.filter(scene => getSceneStatus(scene.id) === "in_progress").length;

  return (
    <div className="min-h-screen bg-muted">
      <Header title="虚拟场景体验">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/")}
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Button>
      </Header>

      <div className="p-6 space-y-6">
        {/* Scene Overview */}
        <div className="gradient-header text-white rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-2">虚拟场景体验中心</h2>
          <p className="opacity-90 mb-4">5个真实业务场景完整还原，沉浸式体验跨境电商全流程</p>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full opacity-75"></div>
              <span className="text-sm">已完成: {completedScenes}个</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <span className="text-sm">进行中: {inProgressScenes}个</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white/50 rounded-full"></div>
              <span className="text-sm">总计: {scenesWithImages.length}个</span>
            </div>
          </div>
        </div>

        {/* Scene Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-secondary mb-2">{completedScenes}</div>
              <p className="text-sm text-muted-foreground">已完成场景</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">{inProgressScenes}</div>
              <p className="text-sm text-muted-foreground">进行中场景</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-accent mb-2">
                {completedScenes > 0 ? Math.round((completedScenes / scenesWithImages.length) * 100) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">完成进度</p>
            </CardContent>
          </Card>
        </div>

        {/* Scene Categories */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>主要业务场景</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-6">
                完整还原跨境电商出口海外仓业务涉及的5大核心场景，每个场景都包含真实的交互元素和业务操作。
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {scenesWithImages.map((scene, index) => {
                  const sceneProgress = getSceneProgress(scene.id);
                  const status = getSceneStatus(scene.id);
                  
                  return (
                    <div key={scene.id} className="relative">
                      <SceneCard
                        scene={scene}
                        status={status}
                        onClick={() => setSelectedScene(scene)}
                      />
                      
                      {/* Progress indicator */}
                      {sceneProgress && sceneProgress.progress > 0 && (
                        <div className="absolute top-4 right-4">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                            <span className="text-xs font-medium">
                              {sceneProgress.progress}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Scene Details */}
          <Card>
            <CardHeader>
              <CardTitle>场景详细说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">学习目标</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>掌握跨境电商企业日常业务操作流程</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>熟悉海关监管要求和申报流程</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>了解跨境物流和海外仓库操作</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>体验完整的国际贸易业务链条</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">交互特色</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                      <span>真实还原的办公环境和操作界面</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                      <span>丰富的可点击交互元素</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                      <span>实时任务指导和操作反馈</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                      <span>沉浸式的场景切换体验</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Progress */}
          {progress.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>我的学习进度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scenesWithImages.map((scene) => {
                    const sceneProgress = getSceneProgress(scene.id);
                    const status = getSceneStatus(scene.id);
                    
                    return (
                      <div key={scene.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Building className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium">{scene.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {sceneProgress ? `用时: ${Math.round((sceneProgress.timeSpent || 0) / 60)}分钟` : "未开始"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge 
                            variant={status === "completed" ? "secondary" : status === "in_progress" ? "default" : "outline"}
                            className={
                              status === "completed" 
                                ? "bg-secondary/20 text-secondary" 
                                : status === "in_progress" 
                                  ? "bg-primary/20 text-primary"
                                  : ""
                            }
                          >
                            {status === "completed" ? "已完成" : status === "in_progress" ? "进行中" : "未开始"}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedScene(scene)}
                            data-testid={`button-view-scene-${scene.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Scene Modal */}
      <SceneModal
        open={!!selectedScene}
        onOpenChange={(open) => !open && setSelectedScene(null)}
        scene={selectedScene}
      />
    </div>
  );
}
