import { Queue } from 'bullmq';

const aiAgentQueue = new Queue('ai-developer', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

export { aiAgentQueue };

export default aiAgentQueue;

