import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconColor?: string;
  progress?: number;
  subtitle?: string;
}

export function StatsCard({ title, value, icon, iconColor = "text-primary", progress, subtitle }: StatsCardProps) {
  return (
    <Card data-testid="stats-card" className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground" data-testid="stats-title">{title}</p>
            <p className="text-2xl font-bold" data-testid="stats-value">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`text-2xl ${iconColor}`} data-testid="stats-icon">
            {icon}
          </div>
        </div>
        {progress !== undefined && (
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
