"use client";

import { useMemo } from "react";
import { trpcReact } from "@/clients";

export interface JobProgress {
  stage: string;
  percent: number;
  message: string;
  timestamp: string;
}

export interface Job {
  id: string;
  orgId: string | null;
  userId: string | null;
  traceId: string | null;
  jobType: string;
  status: string;
  priority: number;
  input: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  errorCode: string | null;
  progress: JobProgress | null;
  attempts: number;
  maxAttempts: number;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  queuedAt: string;
  workerId: string | null;
  idempotencyKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseJobsResult {
  jobs: Job[];
  loading: boolean;
  error?: string;
  refetch: () => void;
}

export function useJobs(options: { enabled?: boolean } = {}) {
  const {
    data: jobsData,
    isLoading,
    isError,
    error,
    refetch,
  } = trpcReact.jobs.list.useQuery(
    { limit: 50 },
    { enabled: options.enabled !== false }
  );

  const jobs = useMemo(() => {
    return jobsData?.jobs ?? [];
  }, [jobsData]);

  return {
    jobs,
    loading: isLoading,
    error: isError ? (error as Error)?.message : undefined,
    refetch,
  };
}

export function useJob(jobId: string) {
  const {
    data: job,
    isLoading,
    isError,
    error,
    refetch,
  } = trpcReact.jobs.get.useQuery(
    { id: jobId },
    { enabled: Boolean(jobId) }
  );

  return {
    job: job as Job | undefined,
    loading: isLoading,
    error: isError ? (error as Error)?.message : undefined,
    refetch,
  };
}

export function useJobStatus(jobId: string, pollMs: number = 2000) {
  const { job, loading } = useJob(jobId);

  return {
    status: job?.status as string | undefined,
    progress: job?.progress ?? null,
    result: job?.result ?? null,
    error: job?.errorMessage ?? null,
    errorCode: job?.errorCode ?? null,
    attempts: job?.attempts ?? 0,
    maxAttempts: job?.maxAttempts ?? 3,
    loading,
  };
}

export function useJobActions() {
  const cancel = trpcReact.jobs.cancel.useMutation();
  const retry = trpcReact.jobs.retry.useMutation();
  const create = trpcReact.jobs.create.useMutation();

  return {
    cancel: cancel.mutateAsync,
    retry: retry.mutateAsync,
    create: create.mutateAsync,
  };
}