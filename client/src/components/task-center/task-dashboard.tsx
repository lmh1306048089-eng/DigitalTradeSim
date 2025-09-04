import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users, 
  ArrowRight, 
  Play,
  FileText,
  Building2,
  Truck,
  Package,
  MapPin,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessRole } from "@/hooks/useBusinessRole";

// 任务状态类型
type TaskStatus = "available" | "in_progress" | "waiting_collaboration" | "completed" | "blocked";

// 统一的任务接口
interface BusinessTask {
  id: string;
  title: string;
  description: string;
  category: "preparation" | "declaration" | "logistics" | "customs";
  status: TaskStatus;
  progress: number;
  estimatedTime: string;
  requiredRole: string;
  collaborationWith?: string[];
  nextAction?: string;
  dueDate?: string;
  priority: "high" | "medium" | "low";
  steps: {
    id: string;
    title: string;
    description: string;
    status: "completed" | "current" | "pending";
    scene?: string;
    estimatedTime: string;
  }[];
}

export function TaskDashboard() {
  const { user } = useAuth();
  const { selectedRoleCode, getCurrentRole } = useBusinessRole();
  const [selectedTask, setSelectedTask] = useState<BusinessTask | null>(null);

  const currentRole = getCurrentRole();

  // 模拟任务数据 - 在实际项目中这些应该来自API
  const businessTasks: BusinessTask[] = [
    {
      id: "customs-qualification",
      title: "海关企业资质备案",
      description: "完成企业向海关的资质备案申请，这是开展跨境电商业务的前提条件",
      category: "preparation",
      status: "available",
      progress: 0,
      estimatedTime: "30分钟",
      requiredRole: "enterprise_operator",
      priority: "high",
      nextAction: "填写企业基本信息",
      steps: [
        {
          id: "step1",
          title: "企业信息填报",
          description: "在电商企业办公场景中填写企业基本信息",
          status: "current",
          scene: "电商企业办公场景",
          estimatedTime: "10分钟"
        },
        {
          id: "step2", 
          title: "经营范围确认",
          description: "选择企业进出口经营范围",
          status: "pending",
          estimatedTime: "5分钟"
        },
        {
          id: "step3",
          title: "材料上传",
          description: "上传报关单位备案信息表等材料",
          status: "pending",
          estimatedTime: "10分钟"
        },
        {
          id: "step4",
          title: "提交审核",
          description: "提交备案申请等待海关审核",
          status: "pending",
          estimatedTime: "5分钟"
        }
      ]
    },
    {
      id: "customs-declaration",
      title: "海关申报单填报",
      description: "根据订单信息填写海关申报单据，确保货物顺利通关",
      category: "declaration", 
      status: "blocked",
      progress: 0,
      estimatedTime: "45分钟",
      requiredRole: "enterprise_operator",
      priority: "high",
      nextAction: "需先完成企业资质备案",
      steps: [
        {
          id: "step1",
          title: "订单信息整理",
          description: "收集和整理订单商品信息",
          status: "pending",
          scene: "电商企业办公场景", 
          estimatedTime: "15分钟"
        },
        {
          id: "step2",
          title: "申报单填写",
          description: "在海关申报系统填写申报信息",
          status: "pending",
          scene: "海关申报大厅",
          estimatedTime: "20分钟"
        },
        {
          id: "step3",
          title: "单证上传",
          description: "上传发票、装箱单等随附单证",
          status: "pending",
          estimatedTime: "10分钟"
        }
      ]
    },
    {
      id: "warehouse-booking",
      title: "海外仓预约入库",
      description: "联系海外仓服务商，预约货物入库时间和流程",
      category: "logistics",
      status: "blocked", 
      progress: 0,
      estimatedTime: "25分钟",
      requiredRole: "logistics_operator",
      collaborationWith: ["warehouse_operator"],
      priority: "medium",
      nextAction: "等待申报完成",
      steps: [
        {
          id: "step1",
          title: "仓库联系",
          description: "联系海外仓确认库存和入库安排",
          status: "pending",
          scene: "物流协调中心",
          estimatedTime: "10分钟"
        },
        {
          id: "step2",
          title: "预约确认",
          description: "确认入库时间和要求",
          status: "pending",
          estimatedTime: "15分钟"
        }
      ]
    }
  ];

  // 根据角色筛选任务
  const availableTasks = businessTasks.filter(task => 
    !selectedRoleCode || task.requiredRole === selectedRoleCode
  );

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "waiting_collaboration": return "bg-amber-100 text-amber-800 border-amber-200";
      case "available": return "bg-purple-100 text-purple-800 border-purple-200";
      case "blocked": return "bg-gray-100 text-gray-600 border-gray-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case "completed": return "已完成";
      case "in_progress": return "进行中";
      case "waiting_collaboration": return "等待协作";
      case "available": return "可开始";
      case "blocked": return "未解锁";
      default: return "未知";
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "waiting_collaboration": return <Users className="h-4 w-4" />;
      case "available": return <Play className="h-4 w-4" />;
      case "blocked": return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "preparation": return <FileText className="h-5 w-5" />;
      case "declaration": return <Building2 className="h-5 w-5" />;
      case "logistics": return <Truck className="h-5 w-5" />;
      case "customs": return <Package className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const handleStartTask = (task: BusinessTask) => {
    // 这里集成现有的实验系统
    console.log("启动任务:", task.title);
    // 根据任务类型，自动跳转到相应的实验流程
    if (task.id === "customs-qualification") {
      // 启动海关企业资质备案流程
      setSelectedTask(task);
    }
  };

  const TaskCard = ({ task }: { task: BusinessTask }) => (
    <Card className={`transition-all hover:shadow-md ${
      task.status === "available" ? "border-primary/20 hover:border-primary/40" : ""
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              {getCategoryIcon(task.category)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{task.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(task.status)}>
              {getStatusIcon(task.status)}
              <span className="ml-1">{getStatusText(task.status)}</span>
            </Badge>
            {task.priority === "high" && (
              <Badge variant="destructive" className="text-xs">
                优先
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* 进度条 */}
          {task.progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>进度</span>
                <span>{task.progress}%</span>
              </div>
              <Progress value={task.progress} />
            </div>
          )}

          {/* 任务信息 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>预计 {task.estimatedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{currentRole?.roleName || "未指定角色"}</span>
            </div>
          </div>

          {/* 下一步行动 */}
          {task.nextAction && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                下一步：{task.nextAction}
              </p>
            </div>
          )}

          {/* 协作信息 */}
          {task.collaborationWith && task.collaborationWith.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                需要协作：{task.collaborationWith.join("、")}
              </p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2">
            {task.status === "available" && (
              <Button 
                onClick={() => handleStartTask(task)}
                className="flex-1"
                data-testid={`button-start-${task.id}`}
              >
                <Play className="mr-2 h-4 w-4" />
                开始任务
              </Button>
            )}
            {task.status === "in_progress" && (
              <Button 
                onClick={() => handleStartTask(task)}
                className="flex-1"
                data-testid={`button-continue-${task.id}`}
              >
                继续任务
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {task.status === "blocked" && (
              <Button 
                variant="outline" 
                disabled 
                className="flex-1"
                data-testid={`button-blocked-${task.id}`}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                暂不可用
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const currentTasks = availableTasks.filter(task => 
    ["available", "in_progress", "waiting_collaboration"].includes(task.status)
  );
  const completedTasks = availableTasks.filter(task => task.status === "completed");

  return (
    <div className="space-y-6" data-testid="task-dashboard">
      {/* 欢迎和状态概览 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              实训任务中心
            </h2>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              欢迎，{currentRole?.roleName || "学员"}！完成下方任务来掌握跨境电商业务流程
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {currentTasks.length}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              待完成任务
            </div>
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">
            当前任务 ({currentTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            已完成 ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {currentTasks.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">所有任务已完成！</h3>
              <p className="text-muted-foreground">
                恭喜您完成了当前角色的所有实训任务
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {completedTasks.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">还没有完成的任务</h3>
              <p className="text-muted-foreground">
                完成任务后会在这里显示
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}