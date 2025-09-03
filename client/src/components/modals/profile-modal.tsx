import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/lib/auth";
import type { UserState } from "@/types";

const profileSchema = z.object({
  username: z.string().min(2, "用户名至少2位"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: z.string().min(6, "新密码至少6位"),
  confirmPassword: z.string().min(1, "请确认新密码"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次密码输入不一致",
  path: ["confirmPassword"],
});

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserState;
}

export function ProfileModal({ open, onOpenChange, user }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState("info");
  const { toast } = useToast();

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user.username,
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = async (data: any) => {
    try {
      // TODO: Implement profile update API call
      toast({
        title: "个人信息已更新",
        description: "您的个人信息已成功更新",
      });
    } catch (error: any) {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onPasswordSubmit = async (data: any) => {
    try {
      // TODO: Implement password change API call
      toast({
        title: "密码修改成功",
        description: "您的密码已成功修改",
      });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "密码修改失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "student": return "bg-primary";
      case "teacher": return "bg-secondary";
      case "admin": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="profile-modal">
        <DialogHeader>
          <DialogTitle>账号管理</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" data-testid="tab-info">基本信息</TabsTrigger>
            <TabsTrigger value="password" data-testid="tab-password">修改密码</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <div className="text-center">
              <div className={`w-20 h-20 ${getRoleColor(user.role)} text-white rounded-full flex items-center justify-center text-2xl font-medium mx-auto mb-4`}>
                {getInitial(user.username)}
              </div>
              <Button variant="outline" size="sm" data-testid="button-change-avatar">
                <Camera className="mr-2 h-4 w-4" />
                更换头像
              </Button>
            </div>

            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户名</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-profile-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <label className="block text-sm font-medium mb-2">手机号</label>
                  <Input 
                    value={formatPhoneNumber(user.phone)} 
                    disabled 
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                    data-testid="input-profile-phone"
                  />
                  <p className="text-xs text-muted-foreground mt-1">手机号不可修改</p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    data-testid="button-profile-cancel"
                  >
                    取消
                  </Button>
                  <Button type="submit" data-testid="button-profile-save">
                    保存
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>当前密码</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          data-testid="input-current-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>新密码</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          data-testid="input-new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>确认新密码</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          data-testid="input-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    data-testid="button-password-cancel"
                  >
                    取消
                  </Button>
                  <Button type="submit" data-testid="button-password-save">
                    修改密码
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
