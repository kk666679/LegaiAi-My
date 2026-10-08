// components/matters/charts/dashboards/billing-analytics-dashboard.tsx
"use client";

import * as React from "react";
import { CircleDollarSign, Clock, Receipt, TrendingUp } from "lucide-react";
import { KpiCard } from "../kpi/kpi-card";
import { RevenueTrendChart, type RevenueTrendDatum } from "../timeseries/revenue-trend-chart";
import { HoursTrendChart, type HoursTrendDatum } from "../timeseries/hours-trend-chart";
import { InvoiceStatusChart, type InvoiceStatusChartDatum } from "../distributions/invoice-status-chart";
import { BillableVsNonBillableChart } from "../comparisons/billable-vs-nonbillable-chart";
import { ClientConcentrationChart, type ClientConcentrationDatum } from "../comparisons/client-concentration-chart";
import { PracticeAreaRevenueChart, type PracticeAreaRevenueDatum } from "../comparisons/practice-area-revenue-chart";
import { InvoiceAgingChart, type InvoiceAgingBucket } from "../operational/invoice-aging-chart";
import { UnbilledAgingChart, type UnbilledAgingRow } from "../operational/unbilled-aging-chart";
import { RealizationRateChart, type RealizationDatum } from "../operational/realization-rate-chart";

export interface BillingAnalyticsDashboardProps {
  currency?: string;
  kpis: {
    billedThisMonth: number;
    collectedThisMonth: number;
    outstanding: number;
    unbilledHours: number;
    realizationRate: number;
    deltas?: {
      billedThisMonth?: number;
      collectedThisMonth?: number;
      outstanding?: number;
      realizationRate?: number;
    };
  };
  revenueTrend: RevenueTrendDatum[];
  hoursTrend: HoursTrendDatum[];
  invoiceStatus: InvoiceStatusChartDatum[];
  billableHours: number;
  nonBillableHours: number;
  topClients: ClientConcentrationDatum[];
  practiceRevenue: PracticeAreaRevenueDatum[];
  invoiceAging: InvoiceAgingBucket[];
  unbilledAging: UnbilledAgingRow[];
  realizationData: RealizationDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function BillingAnalyticsDashboard({
  currency = "RM",
  kpis,
  revenueTrend,
  hoursTrend,
  invoiceStatus,
  billableHours,
  nonBillableHours,
  topClients,
  practiceRevenue,
  invoiceAging,
  unbilledAging,
  realizationData,
  loading,
  error,
  onRetry,
}: BillingAnalyticsDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Billed this month"
          value={`${currency} ${Math.round(kpis.billedThisMonth).toLocaleString()}`}
          delta={kpis.deltas?.billedThisMonth}
          deltaLabel="vs last month"
          icon={<Receipt className="size-4" />}
          trend={revenueTrend.map((r) => r.billed)}
        />
        <KpiCard
          label="Collected"
          value={`${currency} ${Math.round(kpis.collectedThisMonth).toLocaleString()}`}
          delta={kpis.deltas?.collectedThisMonth}
          deltaLabel="vs last month"
          icon={<TrendingUp className="size-4" />}
          color="hsl(160 84% 39%)"
          trend={revenueTrend.map((r) => r.collected)}
        />
        <KpiCard
          label="Outstanding"
          value={`${currency} ${Math.round(kpis.outstanding).toLocaleString()}`}
          delta={kpis.deltas?.outstanding}
          deltaLabel="vs last month"
          invertColor
          icon={<CircleDollarSign className="size-4" />}
          color="hsl(32 95% 44%)"
        />
        <KpiCard
          label="Realization"
          value={`${kpis.realizationRate.toFixed(0)}%`}
          delta={kpis.deltas?.realizationRate}
          deltaLabel="vs last period"
          icon={<Clock className="size-4" />}
          color="hsl(262 83% 58%)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueTrendChart data={revenueTrend} loading={loading} error={error} onRetry={onRetry} currency={currency} />
        <HoursTrendChart data={hoursTrend} loading={loading} error={error} onRetry={onRetry} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InvoiceStatusChart
          data={invoiceStatus}
          loading={loading}
          error={error}
          onRetry={onRetry}
          currency={currency}
        />
        <BillableVsNonBillableChart
          billableHours={billableHours}
          nonBillableHours={nonBillableHours}
          loading={loading}
          error={error}
          onRetry={onRetry}
        />
        <InvoiceAgingChart
          data={invoiceAging}
          loading={loading}
          error={error}
          onRetry={onRetry}
          currency={currency}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ClientConcentrationChart
          data={topClients}
          loading={loading}
          error={error}
          onRetry={onRetry}
          currency={currency}
        />
        <PracticeAreaRevenueChart
          data={practiceRevenue}
          loading={loading}
          error={error}
          onRetry={onRetry}
          currency={currency}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UnbilledAgingChart
          data={unbilledAging}
          loading={loading}
          error={error}
          onRetry={onRetry}
          currency={currency}
        />
        <RealizationRateChart
          data={realizationData}
          loading={loading}
          error={error}
          onRetry={onRetry}
        />
      </div>
    </div>
  );
}
