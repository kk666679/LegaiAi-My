export interface Dataset<T = unknown> {
  id: string; name: string; description?: string;
  version: string; size: number; tags: string[]; data: T[];
}
