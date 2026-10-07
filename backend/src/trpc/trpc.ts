import { initTRPC, TRPCError } from '@trpc/server';
import { type Context } from './context';
import { hasPermission, type Permission } from '../lib/auth';
import superjson from 'superjson';

export const t = initTRPC.context<Context>().create({
  errorFormatter(opts) {
    const { shape, error } = opts;
    return { ...shape, data: error.cause };
  },
  transformer: superjson,
});

export const router = t.router;
export type Router = typeof router;

export const publicProcedure = t.procedure;
export type PublicProcedure = typeof publicProcedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx });
});

export function permissionProcedure(permission: Permission) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!hasPermission(ctx.user.role, permission))
      throw new TRPCError({ code: 'FORBIDDEN', message: `Requires permission: ${permission}` });
    return next({ ctx });
  });
}
