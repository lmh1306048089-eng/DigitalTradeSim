import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { EnterpriseQualificationForm } from "@/components/enterprise/enterprise-qualification-form";

export default function EnterpriseQualificationPage() {
  const [, setLocation] = useLocation();

  const handleFormComplete = (data: any) => {
    console.log("企业资质备案完成:", data);
    
    // 返回到电商企业场景
    setTimeout(() => {
      setLocation("/?section=enterprise_scene");
    }, 2000);
  };

  const handleCancel = () => {
    // 返回到电商企业场景
    setLocation("/?section=enterprise_scene");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/50">
      <Header title="电商企业资质备案">
        <Button 
          variant="outline" 
          onClick={handleCancel}
          className="hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
          data-testid="button-back-to-enterprise-scene"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回电商企业场景
        </Button>
      </Header>

      <div className="container mx-auto py-8 px-6">
        <EnterpriseQualificationForm
          onComplete={handleFormComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}