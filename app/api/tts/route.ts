import { NextResponse } from "next/server";
import textToSpeech from "@google-cloud/text-to-speech";

const client = new textToSpeech.TextToSpeechClient();

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: "en-US",
        name: "en-US-Neural2-J",
      },
      audioConfig: {
        audioEncoding: "MP3",
      },
    });

    if (!response.audioContent) {
      return NextResponse.json({ error: "No audio returned" }, { status: 500 });
    }

    const buffer = Buffer.from(response.audioContent);

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
