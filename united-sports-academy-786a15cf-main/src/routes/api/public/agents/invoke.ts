import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

type Msg = { role: "user" | "assistant" | "system"; content: string };

export const Route = createFileRoute("/api/public/agents/invoke")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const expected = process.env.AGENT_WEBHOOK_TOKEN;
        if (!expected) {
          return Response.json({ ok: false, error: "Server token not configured" }, { status: 500, headers: CORS });
        }
        const auth = request.headers.get("authorization") ?? "";
        const provided = auth.replace(/^Bearer\s+/i, "").trim();
        if (!provided || !timingSafeEqual(provided, expected)) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: CORS });
        }
        const lovableKey = process.env.LOVABLE_API_KEY;
        if (!lovableKey) {
          return Response.json({ ok: false, error: "Missing LOVABLE_API_KEY" }, { status: 500, headers: CORS });
        }

        let body: {
          message?: string;
          system?: string;
          model?: string;
          history?: Msg[];
          temperature?: number;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400, headers: CORS });
        }
        const { message, system, model, history, temperature } = body ?? {};
        if (!message || typeof message !== "string") {
          return Response.json({ ok: false, error: "`message` (string) is required" }, { status: 400, headers: CORS });
        }

        const messages: Msg[] = [
          ...(Array.isArray(history) ? history.filter((m) => m && typeof m.content === "string") : []),
          { role: "user", content: message },
        ];

        try {
          const gateway = createLovableAiGatewayProvider(lovableKey);
          const res = await generateText({
            model: gateway(model || "google/gemini-3-flash-preview"),
            system: system || "أنت مساعد ذكي محترف.",
            messages: messages as any,
            temperature: typeof temperature === "number" ? temperature : undefined,
          });
          return Response.json(
            {
              ok: true,
              text: res.text,
              model: model || "google/gemini-3-flash-preview",
              usage: res.usage,
              finishReason: res.finishReason,
            },
            { headers: CORS },
          );
        } catch (e: any) {
          const msg = String(e?.message ?? "AI error");
          const status = /402|credit/i.test(msg) ? 402 : /429|rate/i.test(msg) ? 429 : 500;
          return Response.json({ ok: false, error: msg }, { status, headers: CORS });
        }
      },
    },
  },
});
