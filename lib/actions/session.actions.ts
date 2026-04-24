'use server';

import { connectToDatabase } from "@/database/mongoose";
import { StartSessionResult } from '@/types'
import { getCurrentBillingPeriodStart } from "../subscription-constants";
import VoiceSession from "@/database/models/voice-session.model";



export const startVoiceSession = async (clerkId: string, bookId: string): Promise<StartSessionResult> => {
    try {
        await connectToDatabase();


        //litmits/plan

        const session = await VoiceSession.create({ clerkId, bookId, startedAt: new Date(), billingPeriodStart: getCurrentBillingPeriodStart(), durationSeconds: 0 })

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
        await connectToDatabase();

        const session = await VoiceSession.findByIdAndUpdate(
            sessionId,
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
