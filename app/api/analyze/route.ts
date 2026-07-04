import { NextRequest, NextResponse } from "next/server";

/**
 * Transparent proxy to the Anthropic Messages API.
 *
 * The dashboard component sends the SAME request body it would send to
 * api.anthropic.com directly ({ model, max_tokens, messages, tools? }).
 * This route forwards it verbatim and injects the API key server-side,
 * then returns Anthropic's response unchanged.
 *
 * Because the request/response shapes are identical to the direct API,
 * porting artifact code only requires rewriting the URL — nothing else.
 */
export const maxDuration = 30; // seconds (Vercel Hobby caps at 10s; Pro allows up to 60s)

const DEFAULT_MODEL = "claude-sonnet-4-6";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: { message: "ANTHROPIC_API_KEY not configured on server." } },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { message: "Invalid JSON body." } }, { status: 400 });
  }

  // sensible defaults if the client omitted them
  if (!body.model) body.model = DEFAULT_MODEL;
  if (!body.max_tokens) body.max_tokens = 1500;

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  // pass Anthropic's response straight through (same shape the artifact expects)
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
