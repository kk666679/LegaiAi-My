"use client";
import * as React from "react";

export interface DocumentDatesProps { createdAt?: string; updatedAt?: string; expiresAt?: string; className?: string; }

export function DocumentDates({ createdAt, updatedAt, expiresAt, className }: DocumentDatesProps) {
  return (
    <dl className={className}>
      {createdAt ? <div className="flex justify-between py-1"><dt className="text-xs text-muted-foreground">Created</dt><dd className="text-xs">{new Date(createdAt).toLocaleDateString()}</dd></div> : null}
      {updatedAt ? <div className="flex justify-between py-1"><dt className="text-xs text-muted-foreground">Updated</dt><dd className="text-xs">{new Date(updatedAt).toLocaleDateString()}</dd></div> : null}
      {expiresAt ? <div className="flex justify-between py-1"><dt className="text-xs text-muted-foreground">Expires</dt><dd className="text-xs">{new Date(expiresAt).toLocaleDateString()}</dd></div> : null}
    </dl>
  );
}
