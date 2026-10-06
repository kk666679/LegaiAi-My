"use client";
import * as React from "react";
import { MattersAnalyticsDashboard } from "@/components/matters/charts";
import { BillingAnalyticsDashboard } from "@/components/matters/charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MattersAnalyticsPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Matters analytics</h1>
        <p className="text-xs text-muted-foreground">Pipeline, workload, and revenue intelligence.</p>
      </header>
      <Tabs defaultValue="matters" className="p-4">
        <TabsList>
          <TabsTrigger value="matters">Matters</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="matters" className="mt-4">
          <MattersAnalyticsDashboard
            kpis={{ totalMatters: 0, openMatters: 0, deadlinesThisWeek: 0, avgCycleDays: 0 }}
            statusData={[]}
            practiceData={[]}
            openedData={[]}
            tasksData={[]}
            deadlineBuckets={[]}
            teamWorkload={[]}
          />
        </TabsContent>
        <TabsContent value="billing" className="mt-4">
          <BillingAnalyticsDashboard
            kpis={{ billedThisMonth: 0, collectedThisMonth: 0, outstanding: 0, unbilledHours: 0, realizationRate: 0 }}
            revenueTrend={[]}
            hoursTrend={[]}
            invoiceStatus={[]}
            billableHours={0}
            nonBillableHours={0}
            topClients={[]}
            practiceRevenue={[]}
            invoiceAging={[]}
            unbilledAging={[]}
            realizationData={[]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
