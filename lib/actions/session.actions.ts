'use server';

import { connectToDatabase } from "@/database/mongoose";
import { StartSessionResult } from '@/types'
import { getCurrentBillingPeriodStart } from "../subscription-constants";
import VoiceSession from "@/database/models/voice-session.model";
import { auth } from "@clerk/nextjs/server";



export const startVoiceSession = async (bookId: string): Promise<StartSessionResult> => {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        await connectToDatabase();


        //litmits/plan

        const session = await VoiceSession.create({ clerkId: userId, bookId, startedAt: new Date(), billingPeriodStart: getCurrentBillingPeriodStart(), durationSeconds: 0 })

        return {
            success: true,
            sessionId: session._id.toString(),
            // maxDurationMinutes: 15
        }

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
