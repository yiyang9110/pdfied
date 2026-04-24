# PDFied

PDFied is an AI-powered book conversation app I built by following a tutorial project.

The idea is simple: upload a PDF, turn it into structured book content, and then have real-time voice conversations with it. The app uses Vapi for live voice calls, MongoDB for persistence, and Next.js 16 for the full-stack app layer.

## What It Does

- Upload PDF books and extract their text into searchable segments
- Generate a voice-based reading and conversation experience
- Talk to your books in real time with AI voice synthesis
- Preview different voice personas inspired by ElevenLabs-style voices
- Store books, transcripts, and voice session history
- Protect user data with authentication and per-user ownership checks

## Tech Stack

- Next.js 16
- React 19
- MongoDB + Mongoose
- Vapi
- Clerk
- Vercel Blob

## Project Context

This project was originally built by following a tutorial and then adapted with my own changes.

Tutorial:

- [Build Bookified with Next.js, Vapi, and MongoDB](https://www.youtube.com/watch?v=NiwawEe92Co&t=344s)

The tutorial description was:

> In this video, you'll learn how to build Bookified, an AI-powered platform for real-time voice conversations with your books. Using Next.js 16, Vapi, and MongoDB, you will transform static PDFs into interactive experiences with natural voice synthesis and ElevenLabs persona previews. You’ll master PDF text extraction, secure authentication, and session transcripts to create a seamless library where you can literally talk to your data.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

You will need the relevant keys/config for the services used by the app, including:

- Clerk
- MongoDB
- Vapi
- Vercel Blob

## Notes

- The app uses App Router with Next.js 16.
- Voice sessions and uploaded books are scoped to the signed-in user.
- Pricing and feature limits are enforced based on the current user plan.
