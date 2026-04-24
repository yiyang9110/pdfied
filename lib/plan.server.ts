import "server-only";
import { auth } from "@clerk/nextjs/server";
import { getLimitsForPlan, PLAN_SLUGS } from "./subscription-constants";
import type { PlanKey, UserPlanContext } from "@/types";

export const getUserPlan = async (): Promise<PlanKey> => {
  const { has, userId } = await auth();

  if (!userId) return "free";

  if (has({ plan: PLAN_SLUGS.pro })) return "pro";
  if (has({ plan: PLAN_SLUGS.standard })) return "standard";
  return "free";
};

export const getUserPlanContext = async (): Promise<UserPlanContext> => {
  const plan = await getUserPlan();
  return { plan, limits: getLimitsForPlan(plan) };
};
