"use client";

import { useAuth } from "@clerk/nextjs";
import { getLimitsForPlan, PLAN_SLUGS } from "./subscription-constants";
import type { PlanKey, UserPlanContext } from "@/types";

export const useUserPlan = (): UserPlanContext => {
  const { has, isLoaded, isSignedIn } = useAuth();

  let plan: PlanKey = "free";

  if (isLoaded && isSignedIn && has) {
    if (has({ plan: PLAN_SLUGS.pro })) plan = "pro";
    else if (has({ plan: PLAN_SLUGS.standard })) plan = "standard";
  }

  return { plan, limits: getLimitsForPlan(plan) };
};
