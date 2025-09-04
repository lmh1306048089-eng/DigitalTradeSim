import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const testSchema = z.object({
  contactPerson: z.string().min(1, "联系人不能为空"),
  contactPhone: z.string().min(1, "电话不能为空"),
  contactEmail: z.string().email("邮箱格式不正确"),
});

type TestFormData = z.infer<typeof testSchema>;

export function SimpleTestForm() {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
    }
  });

  const onSubmit = (data: TestFormData) => {
    console.log("Form data:", data);
    alert(`联系人: ${data.contactPerson}, 电话: ${data.contactPhone}, 邮箱: ${data.contactEmail}`);
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">简单测试表单</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>联系人</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="请输入联系人姓名" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>电话</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="请输入电话号码" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>邮箱</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="请输入邮箱地址" type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">提交测试</Button>
        </form>
      </Form>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>当前表单值：</p>
        <pre>{JSON.stringify(form.watch(), null, 2)}</pre>
      </div>
    </div>
  );
}