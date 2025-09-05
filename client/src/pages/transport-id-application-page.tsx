import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { TransportIdForm } from "@/components/enterprise/transport-id-form";

export default function TransportIdApplicationPage() {
  const [, setLocation] = useLocation();

  const handleComplete = () => {
    // 返回到任务列表页面
    setLocation("/tasks?section=enterprise_scene");
  };

  const handleCancel = () => {
    // 返回到任务列表页面
    setLocation("/tasks?section=enterprise_scene");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <TransportIdForm 
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}