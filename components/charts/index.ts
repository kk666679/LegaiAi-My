// components/matters/charts/index.ts

// primitives
export * from "./primitives";
export { ChartContainer } from "./primitives/chart-container";
export { ChartCard } from "./primitives/chart-card";
export { ChartTooltip } from "./primitives/chart-tooltip";
export { ChartLegend } from "./primitives/chart-legend";
export { ChartEmpty, ChartLoading, ChartError } from "./primitives/chart-states";
export { VerticalBarChart } from "./primitives/vertical-bar-chart";
export { LineChart } from "./primitives/line-chart";
export { DonutChart } from "./primitives/donut-chart";
export { HorizontalBarChart } from "./primitives/horizontal-bar-chart";
export { Sparkline } from "./primitives/sparkline";

// kpi
export { KpiCard } from "./kpi/kpi-card";

// distributions
export { MatterStatusChart } from "./distributions/matter-status-chart";
export { PracticeAreaChart } from "./distributions/practice-area-chart";
export { PriorityChart } from "./distributions/priority-chart";
export { InvoiceStatusChart } from "./distributions/invoice-status-chart";

// time series
export { MattersOpenedChart } from "./timeseries/matters-opened-chart";
export { RevenueTrendChart } from "./timeseries/revenue-trend-chart";
export { HoursTrendChart } from "./timeseries/hours-trend-chart";
export { TaskCompletionChart } from "./timeseries/task-completion-chart";

// comparisons
export { BillableVsNonBillableChart } from "./comparisons/billable-vs-nonbillable-chart";
export { TeamWorkloadChart } from "./comparisons/team-workload-chart";
export { PracticeAreaRevenueChart } from "./comparisons/practice-area-revenue-chart";
export { ClientConcentrationChart } from "./comparisons/client-concentration-chart";

// operational
export { DeadlinePressureChart, DEADLINE_BUCKET_COLORS } from "./operational/deadline-pressure-chart";
export { InvoiceAgingChart, AGING_COLORS } from "./operational/invoice-aging-chart";
export { UnbilledAgingChart } from "./operational/unbilled-aging-chart";
export { RealizationRateChart } from "./operational/realization-rate-chart";

// dashboards
export { MattersAnalyticsDashboard } from "./dashboards/matters-analytics-dashboard";
export { BillingAnalyticsDashboard } from "./dashboards/billing-analytics-dashboard";

// utils
export {
  CHART_COLORS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  INVOICE_COLORS,
  colorAt,
  formatNumber,
  formatCompact,
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
  formatHours,
  niceTicks,
} from "./primitives/chart-utils";

// types
export type { DonutDatum } from "./primitives/donut-chart";
export type { LineDatum, LineSeries } from "./primitives/line-chart";
export type { VerticalBarDatum, VerticalBarSeries } from "./primitives/vertical-bar-chart";
export type { HBarDatum } from "./primitives/horizontal-bar-chart";
export type { ChartLegendItem } from "./primitives/chart-legend";
export type { ChartTooltipState } from "./primitives/chart-tooltip";
export type { MatterStatusChartDatum } from "./distributions/matter-status-chart";
export type { PracticeAreaDatum } from "./distributions/practice-area-chart";
export type { PriorityChartDatum } from "./distributions/priority-chart";
export type { InvoiceStatusChartDatum } from "./distributions/invoice-status-chart";
export type { MattersOpenedDatum } from "./timeseries/matters-opened-chart";
export type { RevenueTrendDatum } from "./timeseries/revenue-trend-chart";
export type { HoursTrendDatum } from "./timeseries/hours-trend-chart";
export type { TaskCompletionDatum } from "./timeseries/task-completion-chart";
export type { TeamWorkloadDatum } from "./comparisons/team-workload-chart";
export type { ClientConcentrationDatum } from "./comparisons/client-concentration-chart";
export type { PracticeAreaRevenueDatum } from "./comparisons/practice-area-revenue-chart";
export type { DeadlinePressureBucket } from "./operational/deadline-pressure-chart";
export type { InvoiceAgingBucket } from "./operational/invoice-aging-chart";
export type { UnbilledAgingRow } from "./operational/unbilled-aging-chart";
export type { RealizationDatum } from "./operational/realization-rate-chart";
