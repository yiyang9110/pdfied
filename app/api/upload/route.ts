import { MAX_FILE_SIZE } from "@/lib/constants";
import { auth } from "@clerk/nextjs/server";
import { handleUpload, HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const POST = async (request: Request): Promise<NextResponse> => {
    try {
        const body = await request.json() as HandleUploadBody;

        const jsonResponse = await handleUpload({
            body, request,
            onBeforeGenerateToken: async (token) => {
                const { userId } = await auth();

                if (!userId) {
                    throw new Error('Unauthorized')
                }

                return {
                    allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
                    addRandomSuffix: true,
                    maximumFileSize: MAX_FILE_SIZE,
                    tokenPayload: JSON.stringify({
                        userId
                    })
                }
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log("File uploaded to blob");

                const payload = tokenPayload ? JSON.parse(tokenPayload) : null;
                const userId = payload?.userId;


            }
        })

        return NextResponse.json(jsonResponse);

    } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : "An unknown error occurred during upload";
        const status = message.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, message }, { status });
    }
}