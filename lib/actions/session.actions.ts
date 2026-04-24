'use server';

import { connectToDatabase } from "@/database/mongoose";
import { StartSessionResult } from '@/types'
import {
    getCurrentBillingPeriodEnd,
    getCurrentBillingPeriodStart,
} from "../subscription-constants";
import VoiceSession from "@/database/models/voice-session.model";
import { auth } from "@clerk/nextjs/server";
import { getUserPlanContext } from "../plan.server";


export const startVoiceSession = async (bookId: string): Promise<StartSessionResult> => {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        await connectToDatabase();

        const { plan, limits } = await getUserPlanContext();

        if (Number.isFinite(limits.maxSessionsPerMonth)) {
            const periodStart = getCurrentBillingPeriodStart();
            const periodEnd = getCurrentBillingPeriodEnd();

            const sessionsThisMonth = await VoiceSession.countDocuments({
                clerkId: userId,
                startedAt: { $gte: periodStart, $lt: periodEnd },
            });

            if (sessionsThisMonth >= limits.maxSessionsPerMonth) {
                return {
                    success: false,
                    error: `You've used all ${limits.maxSessionsPerMonth} voice sessions on the ${limits.name} plan this month. Upgrade for more.`,
                    limitReached: true,
                    plan,
                };
            }
        }

        const session = await VoiceSession.create({
            clerkId: userId,
            bookId,
            startedAt: new Date(),
            billingPeriodStart: getCurrentBillingPeriodStart(),
            durationSeconds: 0,
        });

        return {
            success: true,
            sessionId: session._id.toString(),
            maxDurationMinutes: limits.maxSessionMinutes,
        };
    } catch (error) {
        console.error("Error starting voice session", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export const endVoiceSession = async (sessionId: string, durationSeconds: number) => {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        await connectToDatabase();

        const session = await VoiceSession.findOneAndUpdate(
            { _id: sessionId, clerkId: userId },
            {
                endedAt: new Date(),
                durationSeconds,
            },
            { new: true }
        );

        if (!session) {
            return { success: false, error: "Session not found" };
        }

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error ending voice session", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
