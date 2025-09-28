import { useState, useEffect, useMemo } from "react";
import { 
  Bell, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  X, 
  PhoneCall,
  MessageCircle,
  AlertTriangle,
  Navigation,
  Home,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Types for notifications
interface DeliveryNotification {
  id: string;
  experimentId: string;
  notificationType: 'pickup' | 'in_transit' | 'out_for_delivery' | 'arrival' | 'attempted' | 'delivered' | 'failed';
  notificationContent: string;
  status: 'pending' | 'delivered' | 'read' | 'responded';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  respondedAt?: Date;
  responseData?: {
    action: string;
    responseTime: number;
    response: string;
  };
  location?: string;
  estimatedArrival?: Date;
  courierInfo?: {
    name: string;
    phone: string;
    vehicle: string;
  };
}

interface PackageInfo {
  trackingNumber: string;
  senderName: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  packageDescription: string;
  currentLocation?: string;
  estimatedDelivery?: Date;
}

interface DeliveryNotificationSystemProps {
  experimentId?: string;
  packageInfo?: PackageInfo;
  autoShow?: boolean;
  onNotificationResponse?: (notificationId: string, response: any) => void;
  onStartDeliveryExperiment?: () => void;
}

// Notification type configurations
const NOTIFICATION_CONFIGS = {
  pickup: {
    icon: Package,
    title: "包裹已发货",
    color: "bg-blue-500",
    priority: "normal" as const,
    soundAlert: false
  },
  in_transit: {
    icon: Truck,
    title: "包裹运输中",
    color: "bg-orange-500", 
    priority: "low" as const,
    soundAlert: false
  },
  out_for_delivery: {
    icon: Navigation,
    title: "包裹派送中",
    color: "bg-yellow-500",
    priority: "high" as const,
    soundAlert: true
  },
  arrival: {
    icon: Bell,
    title: "包裹已到达",
    color: "bg-green-500",
    priority: "urgent" as const,
    soundAlert: true
  },
  attempted: {
    icon: AlertTriangle,
    title: "投递失败",
    color: "bg-red-500",
    priority: "urgent" as const,
    soundAlert: true
  },
  delivered: {
    icon: CheckCircle,
    title: "签收成功",
    color: "bg-green-600",
    priority: "normal" as const,
    soundAlert: false
  },
  failed: {
    icon: X,
    title: "配送失败",
    color: "bg-red-600",
    priority: "urgent" as const,
    soundAlert: true
  }
};

export function DeliveryNotificationSystem({ 
  experimentId, 
  packageInfo, 
  autoShow = true,
  onNotificationResponse,
  onStartDeliveryExperiment 
}: DeliveryNotificationSystemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([]);
  const [activeNotification, setActiveNotification] = useState<DeliveryNotification | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationHistory, setNotificationHistory] = useState<DeliveryNotification[]>([]);

  // Fetch notifications for experiment
  const { data: notificationsData, refetch } = useQuery({
    queryKey: ['delivery-notifications', experimentId],
    queryFn: () => experimentId ? apiRequest(`/api/package-delivery/experiments/${experimentId}/notifications/unread`) : [],
    enabled: !!experimentId,
    refetchInterval: 5000 // Poll every 5 seconds for new notifications
  });

  // Update notification mutation
  const updateNotificationMutation = useMutation({
    mutationFn: ({ notificationId, ...data }: any) => 
      apiRequest(`/api/package-delivery/notifications/${notificationId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-notifications'] });
      refetch();
    }
  });

  // Create notification response mutation
  const createResponseMutation = useMutation({
    mutationFn: (responseData: any) => 
      apiRequest(`/api/package-delivery/experiments/${experimentId}/notifications`, {
        method: 'POST',
        body: JSON.stringify(responseData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-notifications'] });
      refetch();
    }
  });

  // Update notifications when data changes
  useEffect(() => {
    if (notificationsData) {
      const newNotifications = Array.isArray(notificationsData) ? notificationsData : [];
      setNotifications(newNotifications);
      
      const unread = newNotifications.filter(n => n.status === 'delivered' || n.status === 'pending');
      setUnreadCount(unread.length);

      // Auto-show important notifications
      if (autoShow && unread.length > 0) {
        const urgentNotification = unread.find(n => 
          NOTIFICATION_CONFIGS[n.notificationType]?.priority === 'urgent'
        );
        if (urgentNotification && !activeNotification) {
          setActiveNotification(urgentNotification);
          setIsNotificationOpen(true);
          
          // Mark as delivered
          updateNotificationMutation.mutate({
            notificationId: urgentNotification.id,
            status: 'delivered',
            deliveredAt: new Date()
          });
        }
      }
    }
  }, [notificationsData, autoShow, activeNotification, updateNotificationMutation]);

  // Handle notification response
  const handleNotificationResponse = (notificationId: string, action: string, response?: string) => {
    const responseTime = Date.now();
    const responseData = {
      action,
      responseTime,
      response: response || action
    };

    // Update notification status
    updateNotificationMutation.mutate({
      notificationId,
      status: 'responded',
      respondedAt: new Date(),
      responseData
    });

    // Call parent callback
    if (onNotificationResponse) {
      onNotificationResponse(notificationId, responseData);
    }

    // Close notification dialog
    setIsNotificationOpen(false);
    setActiveNotification(null);

    // Show response toast
    toast({
      title: "已响应通知",
      description: `您选择了: ${response || action}`
    });
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    updateNotificationMutation.mutate({
      notificationId,
      status: 'read',
      readAt: new Date()
    });
  };

  // Simulate different notification scenarios for testing
  const simulateNotifications = () => {
    if (!experimentId) return;

    const mockNotifications = [
      {
        notificationType: 'out_for_delivery',
        notificationContent: `您的包裹 ${packageInfo?.trackingNumber || 'SF123456789'} 正在派送途中，预计30分钟内送达`,
        status: 'delivered',
        priority: 'high'
      },
      {
        notificationType: 'arrival',
        notificationContent: `快递员已到达 ${packageInfo?.recipientAddress || '您的地址'}，请准备签收`,
        status: 'delivered',
        priority: 'urgent'
      }
    ];

    mockNotifications.forEach((notification, index) => {
      setTimeout(() => {
        createResponseMutation.mutate(notification);
      }, index * 2000);
    });
  };

  // Get notification display info
  const getNotificationDisplayInfo = (notification: DeliveryNotification) => {
    const config = NOTIFICATION_CONFIGS[notification.notificationType];
    const Icon = config.icon;
    
    return {
      ...config,
      Icon,
      timeAgo: getTimeAgo(notification.sentAt),
      isUrgent: config.priority === 'urgent',
      isImportant: config.priority === 'high' || config.priority === 'urgent'
    };
  };

  // Calculate time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
  };

  // Render notification content based on type
  const renderNotificationContent = (notification: DeliveryNotification) => {
    const displayInfo = getNotificationDisplayInfo(notification);
    const { Icon } = displayInfo;

    switch (notification.notificationType) {
      case 'out_for_delivery':
        return (
          <div className="space-y-4" data-testid="notification-out-for-delivery">
            <div className="text-center">
              <Truck className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
              <h3 className="font-semibold text-lg">{displayInfo.title}</h3>
              <p className="text-muted-foreground mt-1">
                {notification.notificationContent}
              </p>
            </div>
            
            {packageInfo && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">运单号:</span>
                      <span className="font-medium">{packageInfo.trackingNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">收件人:</span>
                      <span className="font-medium">{packageInfo.recipientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">预计送达:</span>
                      <span className="font-medium">30分钟内</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={() => handleNotificationResponse(notification.id, 'acknowledged', '已知悉')}
                className="flex-1"
                data-testid="button-acknowledge-delivery"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                知道了
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleNotificationResponse(notification.id, 'track_package', '查看配送进度')}
                className="flex-1"
                data-testid="button-track-package"
              >
                <Navigation className="h-4 w-4 mr-2" />
                查看进度
              </Button>
            </div>
          </div>
        );

      case 'arrival':
        return (
          <div className="space-y-4" data-testid="notification-arrival">
            <div className="text-center">
              <Bell className="h-12 w-12 mx-auto text-green-500 mb-3 animate-pulse" />
              <h3 className="font-semibold text-lg text-green-700">{displayInfo.title}</h3>
              <p className="text-muted-foreground mt-1">
                {notification.notificationContent}
              </p>
            </div>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-3">
                <div className="flex items-center gap-3 mb-3">
                  <PhoneCall className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">快递员联系方式</p>
                    <p className="text-sm text-muted-foreground">186****8888</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Home className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">配送地址</p>
                    <p className="text-sm text-muted-foreground">{packageInfo?.recipientAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  handleNotificationResponse(notification.id, 'start_signing', '开始签收');
                  if (onStartDeliveryExperiment) {
                    onStartDeliveryExperiment();
                  }
                }}
                className="flex-1"
                data-testid="button-start-signing"
              >
                <Package className="h-4 w-4 mr-2" />
                开始签收
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleNotificationResponse(notification.id, 'request_wait', '请稍等')}
                className="flex-1"
                data-testid="button-request-wait"
              >
                <Clock className="h-4 w-4 mr-2" />
                请稍等
              </Button>
            </div>
          </div>
        );

      case 'attempted':
        return (
          <div className="space-y-4" data-testid="notification-attempted">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-3" />
              <h3 className="font-semibold text-lg text-red-700">{displayInfo.title}</h3>
              <p className="text-muted-foreground mt-1">
                {notification.notificationContent}
              </p>
            </div>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">失败原因:</span>
                    <span className="font-medium text-red-600">无人应答</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">下次投递:</span>
                    <span className="font-medium">明天上午</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                onClick={() => handleNotificationResponse(notification.id, 'reschedule', '重新安排')}
                className="flex-1"
                data-testid="button-reschedule-delivery"
              >
                <Clock className="h-4 w-4 mr-2" />
                重新安排
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleNotificationResponse(notification.id, 'pickup_point', '自提点取件')}
                className="flex-1"
                data-testid="button-pickup-point"
              >
                <Navigation className="h-4 w-4 mr-2" />
                自提点取件
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4" data-testid={`notification-${notification.notificationType}`}>
            <div className="text-center">
              <Icon className="h-12 w-12 mx-auto text-blue-500 mb-3" />
              <h3 className="font-semibold text-lg">{displayInfo.title}</h3>
              <p className="text-muted-foreground mt-1">
                {notification.notificationContent}
              </p>
            </div>
            
            <Button 
              onClick={() => handleNotificationResponse(notification.id, 'acknowledged', '已读')}
              className="w-full"
              data-testid="button-acknowledge-notification"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              确认
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4" data-testid="delivery-notification-system">
      {/* Notification Badge */}
      {unreadCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="h-6 w-6 text-orange-600" />
                  {unreadCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      variant="destructive"
                      data-testid="badge-unread-count"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">配送通知</p>
                  <p className="text-sm text-muted-foreground">
                    您有 {unreadCount} 条未读通知
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (notifications.length > 0) {
                    setActiveNotification(notifications[0]);
                    setIsNotificationOpen(true);
                  }
                }}
                data-testid="button-view-notifications"
              >
                查看
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Notifications List */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              配送通知历史
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => {
                const displayInfo = getNotificationDisplayInfo(notification);
                const { Icon } = displayInfo;
                
                return (
                  <div 
                    key={notification.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      notification.status === 'delivered' || notification.status === 'pending' 
                        ? "bg-blue-50 border-blue-200" 
                        : "bg-gray-50 border-gray-200"
                    )}
                    onClick={() => {
                      setActiveNotification(notification);
                      setIsNotificationOpen(true);
                      if (notification.status === 'delivered') {
                        markAsRead(notification.id);
                      }
                    }}
                    data-testid={`notification-item-${notification.id}`}
                  >
                    <Icon className={cn("h-5 w-5", displayInfo.isUrgent && "animate-pulse")} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{displayInfo.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.notificationContent}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{displayInfo.timeAgo}</p>
                      {(notification.status === 'delivered' || notification.status === 'pending') && (
                        <Badge size="sm" className="mt-1">未读</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testing Controls (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">通知系统测试</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={simulateNotifications}
              variant="outline"
              size="sm"
              data-testid="button-simulate-notifications"
            >
              模拟配送通知
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notification Dialog */}
      <Dialog open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-notification">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              配送通知
            </DialogTitle>
            <DialogDescription>
              {activeNotification && getNotificationDisplayInfo(activeNotification).timeAgo}
            </DialogDescription>
          </DialogHeader>
          
          {activeNotification && renderNotificationContent(activeNotification)}
        </DialogContent>
      </Dialog>
    </div>
  );
}