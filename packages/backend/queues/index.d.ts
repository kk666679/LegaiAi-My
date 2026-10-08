export namespace queues {
    let retrieval: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
    let analysis: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
    let drafting: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
    let validation: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
    let audit: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
    let orchestrator: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
    let copilot: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
    let privacy: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
    let debate: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
    let monitoring: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
    let indexing: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
    let testing: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
    let aiDeveloper: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
}
import { Queue } from "bullmq/dist/esm/classes/queue";
