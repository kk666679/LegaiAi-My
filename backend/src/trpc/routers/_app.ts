import { router } from '../trpc';
import { vectorsRouter } from './vectors';
import { embeddingsRouter } from './embeddings';
import { agentsRouter } from './agents';
import { debateRouter } from './debate';
import { documentsRouter } from './documents';
import { authRouter } from './auth';
import { mattersRouter } from './matters';
import { clientsRouter } from './clients';
import { contractsRouter } from './contracts';
import { hitlRouter } from './hitl';
import { governanceRouter } from './governance';
import { providerRouter } from './provider';
import { subscriptionRouter } from './subscription';
import { billingRouter } from './billing';
import type { AnyRouter } from '@trpc/server';

export const appRouter: AnyRouter = router({
  auth: authRouter,
  vectors: vectorsRouter,
  embeddings: embeddingsRouter,
  agents: agentsRouter,
  debate: debateRouter,
  documents: documentsRouter,
  matters: mattersRouter,
  clients: clientsRouter,
  contracts: contractsRouter,
  hitl: hitlRouter,
  governance: governanceRouter,
  provider: providerRouter,
  subscription: subscriptionRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
