import { model, models, Schema } from "mongoose";

import { IVoiceSessionReservation } from "@/types";

const VoiceSessionReservationSchema = new Schema<IVoiceSessionReservation>(
  {
    clerkId: { type: String, required: true, index: true },
    billingPeriodStart: { type: Date, required: true, index: true },
    reservationCount: { type: Number, required: true, default: 0 },
    lastReservationToken: { type: String },
  },
  { timestamps: true },
);

VoiceSessionReservationSchema.index(
  { clerkId: 1, billingPeriodStart: 1 },
  { unique: true },
);

const VoiceSessionReservation =
  models.VoiceSessionReservation ||
  model<IVoiceSessionReservation>(
    "VoiceSessionReservation",
    VoiceSessionReservationSchema,
  );

export default VoiceSessionReservation;
