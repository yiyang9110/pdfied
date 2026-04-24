import type { PlanKey, PlanLimits } from "@/types";

export const PLAN_SLUGS = {
  standard: "standard",
  pro: "pro",
} as const;

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  free: {
    key: "free",
    name: "Free",
    maxBooks: 1,
    maxSessionsPerMonth: 5,
    maxSessionMinutes: 5,
    sessionHistory: false,
  },
  standard: {
    key: "standard",
    name: "Standard",
    maxBooks: 10,
    maxSessionsPerMonth: 100,
    maxSessionMinutes: 15,
    sessionHistory: true,
  },
  pro: {
    key: "pro",
    name: "Pro",
    maxBooks: 100,
    maxSessionsPerMonth: Infinity,
    maxSessionMinutes: 60,
    sessionHistory: true,
  },
};

export const getLimitsForPlan = (plan: PlanKey): PlanLimits => PLAN_LIMITS[plan];

export const getCurrentBillingPeriodStart = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};

export const getCurrentBillingPeriodEnd = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
};
