import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  BUSINESS_ROLE_CONFIGS, 
  getBusinessRolesByProductRole, 
  type BusinessRoleConfig 
} from "@shared/business-roles";
import { User, Building, Truck, UserCheck, Settings } from "lucide-react";

interface BusinessRoleSelectorProps {
  userProductRole: string;
  onRoleSelect: (roleCode: string) => void;
  selectedRoleCode?: string;
}

const getRoleIcon = (roleCode: string) => {
  switch (roleCode) {
    case "enterprise_operator":
      return <Building className="h-8 w-8" />;
    case "customs_officer":
      return <UserCheck className="h-8 w-8" />;
    case "logistics_operator":
      return <Truck className="h-8 w-8" />;
    default:
      return <User className="h-8 w-8" />;
  }
};

const getRoleColor = (roleCode: string) => {
  switch (roleCode) {
    case "enterprise_operator":
      return "text-primary";
    case "customs_officer":
      return "text-secondary";
    case "logistics_operator":
      return "text-accent";
    default:
      return "text-muted-foreground";
  }
};

export function BusinessRoleSelector({ userProductRole, onRoleSelect, selectedRoleCode }: BusinessRoleSelectorProps) {
  const [showDetails, setShowDetails] = useState<BusinessRoleConfig | null>(null);
  
  const availableRoles = getBusinessRolesByProductRole(userProductRole);

  if (userProductRole !== "student") {
    return null; // 只有学生才能选择业务角色
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">选择你的实训角色</h2>
        <p className="text-muted-foreground">
          在数字贸易生态中，你将扮演不同的业务角色完成实训任务
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableRoles.map((role) => (
          <Card
            key={role.roleCode}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRoleCode === role.roleCode
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:border-primary/50"
            }`}
            data-testid={`role-card-${role.roleCode}`}
          >
            <CardHeader className="text-center pb-4">
              <div className={`mx-auto mb-3 ${getRoleColor(role.roleCode)}`}>
                {getRoleIcon(role.roleCode)}
              </div>
              <CardTitle className="text-lg">{role.roleName}</CardTitle>
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                <Badge variant="outline" className="text-xs">
                  {role.availableScenes.length} 个场景
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {role.availableOperations.length} 项操作
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {role.description}
              </p>
              <div className="flex gap-2">
                <Button
                  variant={selectedRoleCode === role.roleCode ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => onRoleSelect(role.roleCode)}
                  data-testid={`button-select-${role.roleCode}`}
                >
                  {selectedRoleCode === role.roleCode ? "已选择" : "选择角色"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(role)}
                  data-testid={`button-details-${role.roleCode}`}
                >
                  详情
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 角色详情对话框 */}
      <Dialog open={!!showDetails} onOpenChange={() => setShowDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {showDetails && (
                <>
                  <div className={getRoleColor(showDetails.roleCode)}>
                    {getRoleIcon(showDetails.roleCode)}
                  </div>
                  {showDetails.roleName}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {showDetails && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">角色描述</h4>
                <p className="text-sm text-muted-foreground">
                  {showDetails.description}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">可访问的场景</h4>
                <div className="grid grid-cols-2 gap-2">
                  {showDetails.availableScenes.map((scene) => (
                    <Badge key={scene} variant="secondary" className="justify-center">
                      {scene.replace('_scene', '').replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">可执行的操作</h4>
                <div className="grid grid-cols-2 gap-2">
                  {showDetails.availableOperations.map((operation, index) => (
                    <Badge key={index} variant="outline" className="justify-center">
                      {operation}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => {
                    onRoleSelect(showDetails.roleCode);
                    setShowDetails(null);
                  }}
                  data-testid={`button-select-from-details-${showDetails.roleCode}`}
                >
                  选择这个角色
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}