"use client";
import * as React from "react";
import { HITLStatsCards, HITLThroughputChart, HITLSlAComplianceChart, type HITLStats } from "@/components/hitl";

export function HITLAnalyticsPage() {
  const stats: HITLStats = { total: 0, pending: 0, inReview: 0, escalated: 0, breachedSLAs: 0, approvedToday: 0, rejectedToday: 0, avgDecisionMinutes: 0, autoApprovalRate: 0 };
  return (
    <div className="space-y-4 p-4 lg:p-6">
      <HITLStatsCards stats={stats} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HITLThroughputChart data={[]} />
        <HITLSlAComplianceChart data={[]} />
      </div>
    </div>
  );
}
