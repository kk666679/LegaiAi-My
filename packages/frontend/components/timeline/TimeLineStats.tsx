"use client";

import {
  CalendarDays,
  Scale,
  Shield,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

type Props = {
  total: number;
  active: number;
  pending: number;
};

export function TimelineStats({
  total,
  active,
  pending,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Total Developments
            </p>

            <h3 className="text-3xl font-bold">
              {total}
            </h3>
          </div>

          <CalendarDays className="h-8 w-8 text-muted-foreground" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Active
            </p>

            <h3 className="text-3xl font-bold text-emerald-600">
              {active}
            </h3>
          </div>

          <Shield className="h-8 w-8 text-emerald-500" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Pending
            </p>

            <h3 className="text-3xl font-bold text-amber-600">
              {pending}
            </h3>
          </div>

          <Scale className="h-8 w-8 text-amber-500" />
        </CardContent>
      </Card>
    </div>
  );
}