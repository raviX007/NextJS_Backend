import { NextRequest, NextResponse } from "next/server";
import { HfInference } from '@huggingface/inference';
import { HuggingFaceStream, StreamingTextResponse } from 'ai';
import { experimental_buildOpenAssistantPrompt } from 'ai/prompts';

const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export const runtime = 'edge';

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    console.log("Messages:",messages);

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    const response = await Hf.textGenerationStream({
      model: 'OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5',
      inputs: experimental_buildOpenAssistantPrompt(messages),
      parameters: {
        max_new_tokens: 200,
        typical_p: 0.2,
        repetition_penalty: 1,
        truncate: 1000,
        return_full_text: false,
      },
    });

    const stream = HuggingFaceStream(response);

    return new StreamingTextResponse(stream, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return NextResponse.json({ error :error.message }, { status: 500 });
  }
}
