import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    landingUrl: v.string(),
    valueProp: v.string(),
    targetCustomer: v.string(),
    pricing: v.string(),
    painPoint: v.string(),
    dailyBudget: v.number(),
    totalBudget: v.number(),
    maxCPC: v.number(),
    targetCAC: v.number(),
    goal: v.string(),
  },
  handler: async (ctx, args) => {
    const productId = await ctx.db.insert("products", args);
    return { productId };
  },
});
