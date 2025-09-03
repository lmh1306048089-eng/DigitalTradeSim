import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconColor?: string;
}

export function StatsCard({ title, value, icon, iconColor = "text-primary" }: StatsCardProps) {
  return (
    <Card data-testid="stats-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground" data-testid="stats-title">{title}</p>
            <p className="text-2xl font-bold" data-testid="stats-value">{value}</p>
          </div>
          <div className={`text-2xl ${iconColor}`} data-testid="stats-icon">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
