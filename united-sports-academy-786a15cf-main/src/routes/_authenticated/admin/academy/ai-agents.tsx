import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bot, Webhook, Workflow, Copy, Check, Eye, EyeOff, Send,
  Sparkles, MessageSquare, Plus, Trash2, Pencil, Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { getAgentWebhookInfo } from "@/lib/legends/agent-webhook.functions";

export const Route = createFileRoute("/_authenticated/admin/academy/ai-agents")({
  head: () => ({ meta: [{ title: "AI Agents · United Sports Academy" }] }),
  component: AiAgentsPage,
});

type AgentDef = {
  id: string;
  name: string;
  role: string;
  description: string;
  model: string;
  system: string;
};

const MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-5-mini",
  "openai/gpt-5",
];

const DEFAULT_AGENTS: AgentDef[] = [
  {
    id: "sales-coach",
    name: "مدرب المبيعات",
    role: "تدريب فريق المبيعات",
    description: "يساعد فريق المبيعات على تحويل العملاء المحتملين إلى مشتركين.",
    model: "google/gemini-3-flash-preview",
    system:
      "أنت مدرب مبيعات خبير في يونايتد سبورت أكاديمي للسباحة. مهمتك تدريب فريق المبيعات على التعامل مع العملاء المحتملين (Leads) وتحويلهم إلى مشتركين. أعطِ نصائح عملية وسيناريوهات حوار قصيرة، وردّ دائمًا بالعربية الفصحى المبسطة.",
  },
  {
    id: "inventory-analyst",
    name: "محلل المخزون",
    role: "تحليل المخزون والمشتريات",
    description: "يراجع حركة المخزون ويقترح إعادة الطلب وتقليل الهدر.",
    model: "google/gemini-3-flash-preview",
    system:
      "أنت محلل مخزون لأكاديمية رياضية متعددة الفروع. حلل بيانات المخزون التي يعطيها لك المستخدم، حدد العناصر منخفضة الكمية، اقترح أوامر شراء (Purchase Orders) واضحة بالكميات والأسبقية، ونبّه على أي فاقد أو حركة شاذة. اكتب بالعربية وبأسلوب تنفيذي مختصر.",
  },
  {
    id: "marketing-writer",
    name: "كاتب المحتوى التسويقي",
    role: "كتابة محتوى تسويقي",
    description: "ينشئ منشورات سوشيال ميديا وحملات لأكاديمية السباحة.",
    model: "google/gemini-3-flash-preview",
    system:
      "أنت كاتب محتوى تسويقي محترف ليونايتد سبورت أكاديمي للسباحة. اكتب منشورات قصيرة جذابة لفيسبوك وانستجرام وتيك توك، مع Hook قوي في أول سطر، Call to Action واضح، وهاشتاجات مناسبة. استخدم العربية المصرية الراقية وأضف بدائل إنجليزية عند الحاجة.",
  },
  {
    id: "hr-assistant",
    name: "مساعد الموارد البشرية",
    role: "دعم الموارد البشرية",
    description: "يصيغ الإعلانات الوظيفية ويقيّم السير الذاتية ويرد على استفسارات الموظفين.",
    model: "google/gemini-3-flash-preview",
    system:
      "أنت مساعد موارد بشرية لأكاديمية United Sports Academy. ساعد في صياغة إعلانات وظيفية، تقييم السير الذاتية بسرعة (نقاط القوة، الفجوات، التوصية)، الرد على استفسارات الموظفين عن الإجازات والحضور والمرتبات بأسلوب رسمي ومحترم بالعربية.",
  },
];

const STORAGE_KEY = "legends.ai-agents.v1";

function loadAgents(): AgentDef[] {
  if (typeof window === "undefined") return DEFAULT_AGENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AGENTS;
    const parsed = JSON.parse(raw) as AgentDef[];
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {}
  return DEFAULT_AGENTS;
}

function AiAgentsPage() {
  const [agents, setAgents] = useState<AgentDef[]>(loadAgents);
  const [activeId, setActiveId] = useState<string>(() => loadAgents()[0]?.id ?? "");
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
    } catch {}
  }, [agents]);

  const active = useMemo(() => agents.find((a) => a.id === activeId) ?? agents[0], [agents, activeId]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div dir="rtl" className="space-y-4 max-w-full overflow-x-hidden" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-cyan-glow/30 blur-md" />
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-glow to-primary grid place-items-center shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight">وكلاء الذكاء الاصطناعي</h2>
            <p className="text-[11px] text-muted-foreground">محادثة مباشرة + ربط جاهز بـ n8n عبر Webhook</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[260px_minmax(0,1fr)] gap-4 items-start">
        {/* Right (RTL first child): agent list */}
        <Card className="p-3 space-y-3 bg-gradient-to-b from-card to-card/60 backdrop-blur self-start">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-cyan-glow" /> الوكلاء
              <Badge variant="secondary" className="text-[10px] font-mono ms-1">{agents.length}</Badge>
            </span>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 h-8">
              <Plus className="h-3.5 w-3.5" /> وكيل جديد
            </Button>
          </div>
          <div className="space-y-1.5">
            {agents.map((a) => {
              const isActive = a.id === active?.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setActiveId(a.id)}
                  className={`group relative w-full text-right rounded-xl border p-2.5 transition-all overflow-hidden ${
                    isActive
                      ? "border-cyan-glow/50 bg-gradient-to-l from-cyan-glow/10 via-cyan-glow/5 to-transparent shadow-[0_0_0_1px_rgba(65,201,226,0.25),0_8px_24px_-12px_rgba(65,201,226,0.4)]"
                      : "border-border/60 hover:border-border hover:bg-muted/40"
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-y-2 end-0 w-0.5 rounded-full bg-cyan-glow" />
                  )}
                  <div className="flex items-start gap-2.5">
                    <AgentAvatar agent={a} active={isActive} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-semibold text-sm truncate ${isActive ? "text-foreground" : ""}`}>
                          {a.name}
                        </span>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isActive ? "bg-cyan-glow shadow-[0_0_8px_rgba(65,201,226,0.8)]" : "bg-muted-foreground/30"}`} />
                      </div>
                      <div className="text-[10.5px] text-muted-foreground/90 mt-0.5 truncate">{a.role}</div>
                      <div className="text-[10.5px] text-muted-foreground/70 mt-1 line-clamp-2 leading-snug">{a.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>


        {/* Right: tabs */}
        <Card className="p-3 min-w-0 overflow-hidden">
          {active ? (
            <Tabs defaultValue="chat" className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <TabsList>
                  <TabsTrigger value="n8n" className="gap-1.5">
                    <Webhook className="h-4 w-4" /> ربط n8n
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="gap-1.5">
                    <MessageSquare className="h-4 w-4" /> محادثة
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="chat" className="m-0">
                <ChatPanel key={active.id} agent={active} onEdit={() => setEditOpen(true)} />
              </TabsContent>
              <TabsContent value="n8n" className="m-0">
                <N8nPanel agent={active} />
              </TabsContent>
            </Tabs>
          ) : (
            <p className="text-sm text-muted-foreground p-6 text-center">اختر وكيلًا من القائمة.</p>
          )}
        </Card>
      </div>

      <AgentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="وكيل جديد"
        initial={{ name: "", role: "", system: "", model: MODELS[0] }}
        showModel
        onSave={(v) => {
          const id = `agent-${Date.now().toString(36)}`;
          const a: AgentDef = { id, description: v.role, ...v } as AgentDef;
          setAgents((p) => [...p, a]);
          setActiveId(id);
          toast.success("تم إنشاء الوكيل");
        }}
      />
      {active && (
        <AgentDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          title={`تعديل: ${active.name}`}
          initial={{
            name: active.name, role: active.role, system: active.system, model: active.model,
          }}
          showModel
          onSave={(v) => {
            setAgents((p) => p.map((a) => (a.id === active.id ? { ...a, ...v, description: v.role || a.description } : a)));
            toast.success("تم الحفظ");
          }}
        />
      )}
    </div>
  );
}

/* ────────────────────────── Chat ────────────────────────── */

function ChatPanel({ agent, onEdit }: { agent: AgentDef; onEdit: () => void }) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { system: agent.system, model: agent.model },
      }),
    [agent.id, agent.system, agent.model],
  );

  const { messages, sendMessage, status } = useChat({
    id: agent.id,
    transport,
    onError: (e) => toast.error(e.message || "حدث خطأ"),
  });

  const [input, setInput] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const loading = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);
  useEffect(() => {
    taRef.current?.focus();
  }, [agent.id, loading]);

  async function submit() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await sendMessage({ text });
  }

  return (
    <div className="flex flex-col h-[65vh] min-h-[480px]">
      {/* Chat header */}
      <div className="flex items-center justify-between gap-3 mb-3 rounded-xl border bg-gradient-to-l from-cyan-glow/8 via-card to-card p-3">
        <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5 shrink-0">
          <Settings2 className="h-3.5 w-3.5" /> تعديل
        </Button>
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0 text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="font-bold truncate">{agent.name}</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                متصل
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">{agent.role} · {agent.model}</div>
          </div>
          <AgentAvatar agent={agent} active size="lg" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border p-3 bg-gradient-to-b from-muted/10 to-muted/5 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12 space-y-2">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-glow/30 to-primary/20 grid place-items-center">
              <Sparkles className="h-7 w-7 text-cyan-glow" />
            </div>
            <p>ابدأ محادثة مع <b>{agent.name}</b></p>
            <p className="text-xs max-w-sm mx-auto">{agent.description}</p>
            <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1.5">
              <Pencil className="h-3 w-3" /> تعديل التعليمات
            </Button>
          </div>
        )}
        {messages.map((m) => {
          const text = m.parts
            .map((p: any) => (p.type === "text" ? p.text : ""))
            .join("");
          const mine = m.role === "user";
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && <AgentAvatar agent={agent} size="sm" />}
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                  mine
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border rounded-bl-sm"
                }`}
              >
                {mine ? (
                  <p className="whitespace-pre-wrap">{text}</p>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-pre:my-2">

                    <ReactMarkdown>{text || "..."}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border rounded-2xl px-3.5 py-2 text-sm text-muted-foreground animate-pulse">
              يفكر…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <Textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={`اكتب رسالتك لـ ${agent.name}…`}
          rows={2}
          className="resize-none"
        />
        <Button onClick={submit} disabled={loading || !input.trim()} className="gap-1.5 h-auto py-2.5">
          <Send className="h-4 w-4" /> إرسال
        </Button>
      </div>
    </div>
  );
}

/* ────────────────────────── n8n Panel ────────────────────────── */

function N8nPanel({ agent }: { agent: AgentDef }) {
  const fetchInfo = useServerFn(getAgentWebhookInfo);
  const infoQ = useQuery({
    queryKey: ["agent-webhook-info"],
    queryFn: () => fetchInfo(),
  });

  const endpoint = useMemo(() => {
    if (typeof window === "undefined") return "/api/public/agents/invoke";
    return `${window.location.origin}/api/public/agents/invoke`;
  }, []);

  const token = infoQ.data?.token ?? "";
  const configured = infoQ.data?.configured ?? false;

  const bodyExample = useMemo(
    () =>
      JSON.stringify(
        {
          message: "اقترح 3 سيناريوهات لمتابعة عميل مهتم لم يشترك بعد.",
          system: agent.system,
          model: agent.model,
          history: [
            { role: "user", content: "السلام عليكم" },
            { role: "assistant", content: "وعليكم السلام، أهلاً بك!" },
          ],
          temperature: 0.4,
        },
        null,
        2,
      ),
    [agent],
  );

  const curlExample = useMemo(
    () =>
      `curl -X POST '${endpoint}' \\
  -H 'Authorization: Bearer ${token || "<AGENT_WEBHOOK_TOKEN>"}' \\
  -H 'Content-Type: application/json' \\
  -d '${bodyExample.replace(/'/g, "'\\''")}'`,
    [endpoint, token, bodyExample],
  );

  const n8nNode = useMemo(
    () =>
      JSON.stringify(
        {
          parameters: {
            method: "POST",
            url: endpoint,
            authentication: "httpHeaderAuth",
            sendHeaders: true,
            headerParameters: { parameters: [{ name: "Content-Type", value: "application/json" }] },
            sendBody: true,
            specifyBody: "json",
            jsonBody:
              `={{ JSON.stringify({ message: $json.message, system: ${JSON.stringify(agent.system)}, model: ${JSON.stringify(agent.model)} }) }}`,
            options: {},
          },
          name: `United Sports Agent · ${agent.name}`,
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          credentials: {
            httpHeaderAuth: { name: "United Sports Agent Webhook" },
          },
        },
        null,
        2,
      ),
    [endpoint, agent],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-cyan-glow" />
          <span className="font-semibold">ربط الوكيل بـ n8n</span>
          <Badge variant={configured ? "default" : "secondary"}>
            {configured ? "جاهز" : "غير مهيأ"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          استدعِ هذا الـ Webhook من n8n لأي رسالة، وسيستخدم تلقائيًا System Prompt الوكيل المختار.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Card className="p-3 space-y-2">
          <Label className="text-xs">رابط الـ Endpoint</Label>
          <SecretField value={endpoint} />
        </Card>
        <Card className="p-3 space-y-2">
          <Label className="text-xs">التوكن (Authorization: Bearer)</Label>
          <SecretField value={token} mask placeholder={configured ? "" : "غير مهيأ — أعد توليد AGENT_WEBHOOK_TOKEN"} />
        </Card>
      </div>

      <Card className="p-3 space-y-2">
        <div className="text-xs font-semibold flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5" /> إعدادات الوكيل المُستخدمة
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-muted/30 px-2 py-1.5">
            <span className="text-muted-foreground">Model: </span>
            <span className="font-mono">{agent.model}</span>
          </div>
          <div className="rounded-md bg-muted/30 px-2 py-1.5">
            <span className="text-muted-foreground">Role: </span>
            <span>{agent.role}</span>
          </div>
        </div>
        <Textarea readOnly rows={3} value={agent.system} className="font-mono text-[11px]" />
      </Card>

      <div className="space-y-2">
        <Label className="text-xs">نموذج JSON Body</Label>
        <CodeBlock code={bodyExample} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">مثال cURL</Label>
        <CodeBlock code={curlExample} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">HTTP Request Node — الصقها في n8n</Label>
        <CodeBlock code={n8nNode} />
      </div>

      <Card className="p-3 space-y-2 text-xs">
        <div className="font-semibold flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-cyan-glow" /> شكل الـ Response
        </div>
        <CodeBlock
          code={JSON.stringify(
            { ok: true, text: "...", model: agent.model, usage: { totalTokens: 123 }, finishReason: "stop" },
            null,
            2,
          )}
        />
        <ul className="list-disc ms-5 space-y-1 text-muted-foreground">
          <li><code className="font-mono">message</code> — نص المستخدم (مطلوب).</li>
          <li><code className="font-mono">system</code> — تعليمات تتجاوز System Prompt للوكيل (اختياري).</li>
          <li><code className="font-mono">model</code> — موديل بديل (اختياري).</li>
          <li><code className="font-mono">history</code> — رسائل سابقة [user/assistant/system].</li>
          <li><code className="font-mono">temperature</code> — رقم بين 0 و 2 (اختياري).</li>
        </ul>
      </Card>
    </div>
  );
}

/* ────────────────────────── Helpers ────────────────────────── */

const AVATAR_GRADIENTS = [
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-fuchsia-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-purple-600",
];
function hashIdx(s: string, mod: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}
function AgentAvatar({
  agent, active = false, size = "md",
}: { agent: AgentDef; active?: boolean; size?: "sm" | "md" | "lg" }) {
  const initials = agent.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("");
  const grad = AVATAR_GRADIENTS[hashIdx(agent.id, AVATAR_GRADIENTS.length)];
  const dim = size === "lg" ? "h-11 w-11 text-sm" : size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <div className="relative shrink-0">
      {active && (
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${grad} opacity-50 blur-md`} />
      )}
      <div
        className={`relative ${dim} rounded-xl bg-gradient-to-br ${grad} grid place-items-center font-bold text-white shadow-md ring-1 ring-white/10`}
      >
        {initials || <Bot className="h-4 w-4" />}
      </div>
      {active && size !== "sm" && (
        <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
      )}
    </div>
  );
}



function SecretField({ value, mask = false, placeholder }: { value: string; mask?: boolean; placeholder?: string }) {
  const [show, setShow] = useState(!mask);
  const [copied, setCopied] = useState(false);
  const display = mask && !show ? (value ? "•".repeat(Math.min(value.length, 24)) : "") : value;

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("تم النسخ");
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("تعذّر النسخ");
    }
  }

  return (
    <div className="flex gap-2">
      <Input dir="ltr" readOnly value={display} placeholder={placeholder} className="font-mono text-xs" />
      {mask && (
        <Button variant="outline" size="icon" type="button" onClick={() => setShow((v) => !v)}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      )}
      <Button variant="outline" size="icon" type="button" onClick={copy} disabled={!value}>
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("تعذّر النسخ");
    }
  }
  return (
    <div className="relative">
      <pre
        dir="ltr"
        className="text-[11px] font-mono bg-muted/40 border rounded-lg p-3 overflow-x-auto leading-relaxed max-h-72"
      >
        {code}
      </pre>
      <Button
        variant="outline"
        size="icon"
        onClick={copy}
        className="absolute top-2 end-2 h-7 w-7"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

/* ────────────────────────── Agent dialog ────────────────────────── */

function AgentDialog({
  open, onOpenChange, title, initial, showModel, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  initial: { name: string; role: string; system: string; model: string };
  showModel?: boolean;
  onSave: (v: { name: string; role: string; system: string; model: string }) => void;
}) {
  const [v, setV] = useState(initial);
  useEffect(() => { if (open) setV(initial); }, [open, initial]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>الاسم</Label>
            <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
          </div>
          <div>
            <Label>الوظيفة / الدور</Label>
            <Input value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })} />
          </div>
          {showModel && (
            <div>
              <Label>الموديل</Label>
              <Select value={v.model} onValueChange={(m) => setV({ ...v, model: m })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>System Prompt</Label>
            <Textarea rows={6} value={v.system} onChange={(e) => setV({ ...v, system: e.target.value })} className="font-mono text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button
            onClick={() => {
              if (!v.name.trim()) { toast.error("الاسم مطلوب"); return; }
              if (!v.system.trim()) { toast.error("System Prompt مطلوب"); return; }
              onSave(v);
              onOpenChange(false);
            }}
          >
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
