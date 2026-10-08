import type { Task } from './task.js';
export interface BoardColumn { name: string; status: Task['status']; }
const DEFAULT_COLUMNS: BoardColumn[] = [
  { name: 'Queued', status: 'queued' },
  { name: 'Running', status: 'running' },
  { name: 'Completed', status: 'completed' },
  { name: 'Failed', status: 'failed' },
  { name: 'Cancelled', status: 'cancelled' },
];
export class SprintBoard {
  constructor(private readonly columns: BoardColumn[] = DEFAULT_COLUMNS) {}
  render(tasks: Task[]): Array<{ column: string; tasks: Task[] }> {
    return this.columns.map((c) => ({ column: c.name, tasks: tasks.filter((t) => t.status === c.status) }));
  }
}
