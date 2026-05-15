// app/api/open-ai/route.ts
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";


const endpoint = "https://models.github.ai/inference";
const key = process.env.AZURE_KEY!;

export async function POST(req: Request) {
  if (!key || !endpoint) {
    return new Response(JSON.stringify({ error: "Azure key or endpoint not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();

  const client = ModelClient(endpoint, new AzureKeyCredential(key));

  const response = await client.path("/chat/completions").post({
    body: {
      model: "openai/gpt-4.1",
      messages: body.messages,
    },
  });

  if (isUnexpected(response)) {
    return new Response(JSON.stringify({ error: response.body }), { status: 500 });
  }

  const result = response.body.choices[0].message.content;

  return new Response(JSON.stringify({ result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
