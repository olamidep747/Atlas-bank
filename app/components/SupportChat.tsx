"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Paperclip, Send, Headphones, MessageCircle, FileText, Check, CheckCheck, Loader2, X, ArrowLeft } from "lucide-react";

type ChatMode = "customer" | "admin";
type Conversation = { conversation_id: string; user_id: string; display_name?: string; customer_email?: string; account_number?: string; last_message?: string; last_message_at?: string; status?: string };
type ChatMessage = { id: string; conversation_id: string; sender_id: string | null; sender_role: string; message_text: string | null; attachment_paths?: string[]; image_paths?: string[]; created_at: string; delivered_at?: string | null; read_at?: string | null };
type Attachment = { path: string; name: string; type: string; url?: string };

export default function SupportChat({ mode }: { mode: ChatMode }) {
  const supabase = getSupabaseBrowserClient();
  const [userId, setUserId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherTyping, setOtherTyping] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<any>(null);

  const loadConversations = useCallback(async () => {
    const { data, error: e } = await supabase.rpc("novexxa_admin_list_chat_conversations");
    if (e) { setError(e.message); return; }
    const rows = (data ?? []) as Conversation[];
    setConversations(rows);
    setConversationId(current => current && rows.some(c => c.conversation_id === current) ? current : rows[0]?.conversation_id ?? "");
  }, [supabase]);

  const loadMessages = useCallback(async (id: string) => {
    if (!id) { setMessages([]); return; }
    if (mode === "admin") {
      const { data, error: e } = await supabase.rpc("novexxa_admin_get_chat_messages", { p_conversation_id: id });
      if (e) { setError(e.message); return; }
      const rows = (data ?? []) as ChatMessage[];
      setMessages(rows);
      if (rows.some(m => m.sender_role === "customer" && !m.read_at)) await supabase.rpc("novexxa_admin_mark_chat_read", { p_conversation_id: id });
    } else {
      const { data, error: e } = await supabase.from("novexxa_chat_messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
      if (e) { setError(e.message); return; }
      const rows = (data ?? []) as ChatMessage[];
      setMessages(rows);
      if (rows.some(m => m.sender_role === "support" && !m.read_at)) await supabase.rpc("novexxa_customer_mark_support_read", { p_conversation_id: id });
    }
  }, [mode, supabase]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive || !data.session) { setLoading(false); return; }
      setUserId(data.session.user.id);
      if (mode === "admin") {
        await loadConversations();
      } else {
        const uid = data.session.user.id;
        const { data: existing, error: findError } = await supabase.from("novexxa_chat_conversations").select("id").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (findError) setError(findError.message);
        let id = existing?.id as string | undefined;
        if (!id) {
          const { data: created, error: createError } = await supabase.from("novexxa_chat_conversations").insert({ user_id: uid, subject: "Account support" }).select("id").single();
          if (createError) setError(createError.message);
          id = created?.id;
        }
        if (alive && id) setConversationId(id);
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [mode, supabase, loadConversations]);

  useEffect(() => {
    if (!conversationId) return;
    void loadMessages(conversationId);
    const channel = supabase.channel("atlas-support-" + conversationId, { config: { broadcast: { self: false } } });
    channel.on("broadcast", { event: "typing" }, ({ payload }) => setOtherTyping(Boolean(payload?.typing) && payload?.userId !== userId));
    channel.subscribe();
    channelRef.current = channel;
    let changeChannel: any;
    if (mode === "customer") {
      changeChannel = supabase.channel("atlas-customer-messages-" + conversationId)
        .on("postgres_changes", { event: "*", schema: "public", table: "novexxa_chat_messages", filter: "conversation_id=eq." + conversationId }, () => void loadMessages(conversationId))
        .subscribe();
    }
    const poll = setInterval(() => {
      void loadMessages(conversationId);
      if (mode === "admin") void loadConversations();
    }, mode === "admin" ? 3500 : 6000);
    return () => {
      clearInterval(poll);
      void supabase.removeChannel(channel);
      if (changeChannel) void supabase.removeChannel(changeChannel);
      channelRef.current = null;
    };
  }, [conversationId, mode, supabase, loadMessages, loadConversations, userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, otherTyping]);

  function announceTyping(value: string) {
    setDraft(value);
    if (!conversationId) return;
    void channelRef.current?.send({ type: "broadcast", event: "typing", payload: { typing: true, userId } });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      void channelRef.current?.send({ type: "broadcast", event: "typing", payload: { typing: false, userId } });
    }, 1300);
  }

  async function uploadAttachments(): Promise<string[]> {
    const paths: string[] = [];
    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) throw new Error(file.name + " exceeds the 15 MB limit.");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const attachmentOwnerId = mode === "admin" ? conversations.find(item => item.conversation_id === conversationId)?.user_id : userId;
      if (!attachmentOwnerId) throw new Error("Could not identify the customer account for this attachment.");
      const path = attachmentOwnerId + "/" + conversationId + "/" + crypto.randomUUID() + "-" + safeName;
      const { error: uploadError } = await supabase.storage.from("atlas-support-files").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      paths.push(path);
    }
    return paths;
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if ((!draft.trim() && files.length === 0) || busy || !conversationId) return;
    setBusy(true); setError("");
    try {
      const paths = await uploadAttachments();
      if (mode === "admin") {
        const { error: sendError } = await supabase.rpc("novexxa_admin_reply_chat", { p_conversation_id: conversationId, p_message: draft.trim() || null, p_attachment_paths: paths });
        if (sendError) throw sendError;
      } else {
        const { error: sendError } = await supabase.from("novexxa_chat_messages").insert({
          conversation_id: conversationId, sender_id: userId, sender_role: "customer",
          message_text: draft.trim() || null, attachment_paths: paths, image_paths: paths
        });
        if (sendError) throw sendError;
        await supabase.from("novexxa_chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      }
      setDraft(""); setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
      await loadMessages(conversationId);
      if (mode === "admin") await loadConversations();
    } catch (e) { setError(e instanceof Error ? e.message : "Message could not be sent."); }
    finally { setBusy(false); }
  }

  async function attachmentUrl(path: string) {
    const { data } = await supabase.storage.from("atlas-support-files").createSignedUrl(path, 3600);
    return data?.signedUrl ?? "";
  }

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500"><Loader2 className="mr-2 inline animate-spin" size={16}/>Loading support chat…</div>;

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-slate-900">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <a href={mode === "admin" ? "/admin" : "/dashboard"} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-[#17365f] hover:bg-blue-50"><ArrowLeft size={18}/> Back</a>
        <div className="text-right"><b className="block text-sm text-[#102344]">ATLAS BANK</b><small className="text-[11px] text-slate-500">{mode === "admin" ? "Support inbox" : "Customer support"}</small></div>
      </header>
      <section className="mx-auto max-w-7xl p-3 sm:p-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-[#102344] px-5 py-4 text-white">
        <span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Headphones size={20}/></span><span><b className="block text-sm">{mode === "admin" ? "Live customer support" : "ATLAS live support"}</b><small className="text-xs text-blue-100">{mode === "admin" ? conversations.length + " customer conversations" : "Chat directly with our support team"}</small></span></span>
        {mode === "customer" && <MessageCircle size={19}/>}
      </div>
      <div className={mode === "admin" ? "grid min-h-[calc(100vh-150px)] md:grid-cols-[300px_1fr]" : "block"}>
        {mode === "admin" && <aside className="border-b border-slate-100 md:border-b-0 md:border-r"><div className="p-4 text-xs font-extrabold uppercase tracking-wider text-slate-500">Conversations</div><div className="max-h-[560px] overflow-y-auto">{conversations.map(c=><button type="button" key={c.conversation_id} onClick={()=>setConversationId(c.conversation_id)} className={`block w-full border-t border-slate-100 p-4 text-left hover:bg-blue-50 ${conversationId===c.conversation_id?"bg-blue-50":""}`}><b className="block truncate text-sm text-slate-800">{c.display_name || c.customer_email || "Customer"}</b><small className="mt-1 block text-[11px] text-slate-500">{c.account_number || c.customer_email || "Customer account"}</small><span className="mt-2 block truncate text-xs text-slate-500">{c.last_message || "No messages yet"}</span></button>)}{!conversations.length && <p className="p-4 text-xs text-slate-500">No support conversations yet.</p>}</div></aside>}
        <div className="flex min-h-[480px] min-w-0 flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><b className="text-sm text-slate-800">{mode === "admin" ? conversations.find(c=>c.conversation_id===conversationId)?.display_name || "Select a customer" : "Customer care"}</b><small className="block text-[11px] text-emerald-600">● Live chat</small></div>{mode==="admin" && <span className="text-[10px] text-slate-400">Replies appear on the customer's screen</span>}</div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f5f7fb] p-4">
            {messages.map(m=><MessageBubble key={m.id} message={m} mine={m.sender_role===(mode==="admin"?"support":"customer")} getUrl={attachmentUrl}/>)}
            {otherTyping && <div className="flex items-center gap-2 text-xs text-slate-500"><span className="atlas-chat-typing"><i/><i/><i/></span>{mode==="admin"?"Customer is typing":"Support is typing"}…</div>}
            <div ref={bottomRef}/>
          </div>
          {error && <div className="px-4 pt-3 text-xs text-rose-600">{error}</div>}
          <form onSubmit={sendMessage} className="border-t border-slate-100 bg-white p-3">
            {files.length>0 && <div className="mb-2 flex flex-wrap gap-2">{files.map((f,i)=><span key={i} className="inline-flex max-w-full items-center gap-2 rounded-lg bg-blue-50 px-2 py-1 text-[11px] text-blue-800">{f.name}<button type="button" onClick={()=>setFiles(old=>old.filter((_,n)=>n!==i))} aria-label="Remove attachment"><X size={13}/></button></span>)}</div>}
            <div className="flex items-end gap-2"><input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={e=>setFiles(old=>[...old,...Array.from(e.target.files??[])])}/><button type="button" onClick={()=>fileRef.current?.click()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700" aria-label="Attach picture or document"><Paperclip size={18}/></button><textarea value={draft} onChange={e=>announceTyping(e.target.value)} rows={1} placeholder="Write a message…" className="max-h-28 min-h-10 flex-1 resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"/><button type="submit" disabled={busy||(!draft.trim()&&!files.length)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" aria-label="Send message">{busy?<Loader2 className="animate-spin" size={17}/>:<Send size={17}/>}</button></div>
            <p className="mt-2 pl-1 text-[10px] text-slate-400">Pictures and documents · Up to 15 MB per file</p>
          </form>
        </div>
      </div>
      </div>
      </section>
    </main>
  );
}

function MessageBubble({ message, mine, getUrl }: { message: ChatMessage; mine: boolean; getUrl: (path: string) => Promise<string> }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const paths = message.attachment_paths?.length ? message.attachment_paths : message.image_paths ?? [];
  useEffect(() => {
    let active = true;
    Promise.all(paths.map(async path => ({ path, name: path.split("/").pop() || "Attachment", type: path.match(/\.(png|jpe?g|gif|webp)$/i) ? "image" : "file", url: await getUrl(path) }))).then(items => { if (active) setAttachments(items); });
    return () => { active = false; };
  }, [message.id]);
  return <div className={`flex ${mine?"justify-end":"justify-start"}`}><div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 shadow-sm ${mine?"rounded-br-sm bg-[#dceaff] text-[#18375e]":"rounded-bl-sm border border-slate-100 bg-white text-slate-800"}`}>
    {message.message_text && <p className="whitespace-pre-wrap break-words text-sm">{message.message_text}</p>}
    {attachments.map(a=><a key={a.path} href={a.url||"#"} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-xl bg-black/5 p-2 text-xs font-semibold">{a.type==="image"&&a.url?<img src={a.url} alt={a.name} className="max-h-36 max-w-full rounded-lg object-cover"/>:<><FileText size={19}/><span className="max-w-[180px] truncate">{a.name}</span></>}</a>)}
    <div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-60">{new Date(message.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}{mine&&<>{message.read_at?<CheckCheck size={13}/>:<Check size={13}/>}</>}</div>
  </div></div>;
}
