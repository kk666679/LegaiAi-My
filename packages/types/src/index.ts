/**
 * @lawmate/types — Shared contracts and type definitions for the LAWMATE platform.
 *
 * This package is the foundation of the LAWMATE dependency graph. Every other
 * package depends on it for stable, versioned contracts. It must remain free
 * of any runtime dependencies other than `zod` for schema validation.
 */

// Re-export all public contracts.
export * from './agent';
export * from './skill';
export * from './tool';
export * from './memory';
export * from './kg';
export * from './kdream';
export * from './vector';
export * from './evidence';
export * from './dataset';
export * from './eval';
export * from './learning';
export * from './policy';
export * from './registry';
export * from './event';
export * from './execution';
export * from './common';
export * from './audit';
export * from './comms';
export * from './adapter';
export * from './autobuild';