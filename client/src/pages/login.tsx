import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  password: z.string().min(6, "密码至少6位"),
  role: z.enum(["student", "teacher", "admin"], { required_error: "请选择角色" }),
});

const registerSchema = loginSchema.extend({
  username: z.string().min(2, "用户名至少2位"),
});

export default function LoginPage({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const { login, register, isLoginPending, isRegisterPending } = useAuth();

  const form = useForm({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
    defaultValues: {
      phone: "",
      password: "",
      username: "",
      role: "student" as const,
    },
  });

  const onSubmit = (data: any) => {
    if (isRegister) {
      register(data, {
        onSuccess: () => {
          onLoginSuccess?.();
        }
      });
    } else {
      login(data, {
        onSuccess: () => {
          onLoginSuccess?.();
        }
      });
    }
  };

  const isPending = isLoginPending || isRegisterPending;

  return (
    <div className="min-h-screen gradient-header flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">数字贸易生态虚拟仿真实训系统</h1>
            <p className="text-muted-foreground text-sm">Digital Trade Ecosystem Virtual Simulation Training</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>手机号</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="请输入手机号" 
                        {...field}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="请输入密码" 
                        {...field}
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isRegister && (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户名</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="请输入用户名" 
                          {...field}
                          data-testid="input-username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色选择</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="请选择角色" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">实训学员</SelectItem>
                        <SelectItem value="teacher">实训教师</SelectItem>
                        <SelectItem value="admin">系统管理员</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isPending}
                data-testid="button-submit"
              >
                {isPending ? "处理中..." : (isRegister ? "注册账户" : "登录系统")}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {isRegister ? "已有账户？" : "没有账户？"}
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-primary hover:underline ml-1"
                  data-testid="button-toggle-mode"
                >
                  {isRegister ? "立即登录" : "立即注册"}
                </button>
              </div>

              {!isRegister && (
                <div className="text-center text-sm text-muted-foreground">
                  首次登录将自动创建账户
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
