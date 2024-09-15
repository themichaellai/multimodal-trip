import { getAuthUserId } from '@convex-dev/auth/server';
import { query } from './_generated/server';
import { GenericQueryCtx } from 'convex/server';
import { DataModel } from './_generated/dataModel';

const userHasAccess = async (
  ctx: GenericQueryCtx<DataModel>,
): Promise<boolean> => {
  const userId = await getAuthUserId(ctx);
  if (userId == null) {
    return false;
  }
  const user = await ctx.db.get(userId);
  return user?.hasAccess ?? false;
};

export const getUserAccess = query({
  args: {},
  handler: async (ctx): Promise<{ hasAccess: boolean }> => {
    return {
      hasAccess: await userHasAccess(ctx),
    };
  },
});
