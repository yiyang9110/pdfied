'use server';

import { connectToDatabase } from "@/database/mongoose";
import { StartSessionResult } from '@/types'
import {
    getCurrentBillingPeriodStart,
} from "../subscription-constants";
import Book from "@/database/models/book.model";
import VoiceSession from "@/database/models/voice-session.model";
import VoiceSessionReservation from "@/database/models/voice-session-reservation.model";
import { auth } from "@clerk/nextjs/server";
import { getUserPlanContext } from "../plan.server";


export const startVoiceSession = async (bookId: string): Promise<StartSessionResult> => {
    let clerkId: string | null = null;
    let billingPeriodStart: Date | null = null;
    let didReserveSession = false;

    try {
        const { userId } = await auth();
        clerkId = userId;

        if (!clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        await connectToDatabase();

        const { plan, limits } = await getUserPlanContext();
        billingPeriodStart = getCurrentBillingPeriodStart();

        if (Number.isFinite(limits.maxSessionsPerMonth)) {
            const reservationToken = crypto.randomUUID();
            const reservation = await VoiceSessionReservation.findOneAndUpdate(
                { clerkId, billingPeriodStart },
                [
                    {
                        $set: {
                            clerkId: { $ifNull: ["$clerkId", clerkId] },
                            billingPeriodStart: {
                                $ifNull: ["$billingPeriodStart", billingPeriodStart],
                            },
                            reservationCount: { $ifNull: ["$reservationCount", 0] },
                        },
                    },
                    {
                        $set: {
                            reservationCount: {
                                $cond: [
                                    { $lt: ["$reservationCount", limits.maxSessionsPerMonth] },
                                    { $add: ["$reservationCount", 1] },
                                    "$reservationCount",
                                ],
                            },
                            lastReservationToken: {
                                $cond: [
                                    { $lt: ["$reservationCount", limits.maxSessionsPerMonth] },
                                    reservationToken,
                                    "$lastReservationToken",
                                ],
                            },
                        },
                    },
                ],
                { new: true, upsert: true },
            );

            didReserveSession =
                reservation?.lastReservationToken === reservationToken;

            if (!didReserveSession) {
                return {
                    success: false,
                    error: `You've used all ${limits.maxSessionsPerMonth} voice sessions on the ${limits.name} plan this month. Upgrade for more.`,
                    limitReached: true,
                    plan,
                };
            }
        }

        const book = await Book.findOne({ _id: bookId, clerkId });

        if (!book) {
            if (didReserveSession && clerkId && billingPeriodStart) {
                await VoiceSessionReservation.findOneAndUpdate(
                    { clerkId, billingPeriodStart, reservationCount: { $gt: 0 } },
                    { $inc: { reservationCount: -1 } },
                );
            }
            return {
                success: false,
                error: "Book not found or unauthorized",
            };
        }

        const session = await VoiceSession.create({
            clerkId,
            bookId,
            startedAt: new Date(),
            billingPeriodStart,
            durationSeconds: 0,
        });

        return {
            success: true,
            sessionId: session._id.toString(),
            maxDurationMinutes: limits.maxSessionMinutes,
        };
    } catch (error) {
        if (didReserveSession && clerkId && billingPeriodStart) {
            await VoiceSessionReservation.findOneAndUpdate(
                { clerkId, billingPeriodStart, reservationCount: { $gt: 0 } },
                { $inc: { reservationCount: -1 } },
            );
        }

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

        if (
            typeof durationSeconds !== "number"
            || Number.isNaN(durationSeconds)
            || !Number.isFinite(durationSeconds)
            || durationSeconds < 0
            || !Number.isInteger(durationSeconds)
        ) {
            return {
                success: false,
                error: "Invalid durationSeconds",
            };
        }

        await connectToDatabase();

        const session = await VoiceSession.findOneAndUpdate(
            {
                _id: sessionId,
                clerkId: userId,
                $or: [
                    { endedAt: { $exists: false } },
                    { endedAt: null },
                ],
            },
            {
                endedAt: new Date(),
                durationSeconds,
            },
            { new: true }
        );

        if (!session) {
            return { success: false, error: "Session not found or already closed" };
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
