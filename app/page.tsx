"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

type AgentResponse = {
  text: string;
  actions?: { label: string; value: string }[];
  notice?: string;
};

const QUICK_ACTIONS: { label: string; value: string }[] = [
  { label: "Show popular items", value: "What are popular items?" },
  { label: "View menu", value: "Show me the menu" },
  { label: "Calories for Big Mac", value: "How many calories are in a Big Mac?" },
  { label: "Find nearest store", value: "Find the nearest McDonald's" },
  { label: "Any deals now?", value: "What deals are available?" }
];

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: "assistant",
    content: "Hi! I?m your McDonald?s helper. Ask me about menu, calories, deals, or finding a nearby restaurant."
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;
    setInput("");
    setMessages(m => [...m, { role: "user", content }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      const data: AgentResponse = await res.json();
      setMessages(m => [
        ...m,
        { role: "assistant", content: data.text + (data.notice ? `\n\n${data.notice}` : "") }
      ]);
      if (data.actions && data.actions.length) {
        const tips = data.actions.map(a => `? ${a.label}`).join("\n");
        setMessages(m => [
          ...m,
          { role: "assistant", content: `You can also try:\n${tips}` }
        ]);
      }
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: "Sorry, I had trouble responding. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card hero">
        <div style={{display:"flex", alignItems:"center", gap:12, flexWrap:"wrap"}}>
          <span className="badge">McDonald's Assistant</span>
          <span className="note">Menu ? Nutrition ? Deals ? Locations</span>
        </div>
        <h1>Welcome to McDonald's AI Agent</h1>
        <p>Ask about items, calories, allergens, deals, or find nearby restaurants.</p>
        <div className="quick-actions">
          {QUICK_ACTIONS.map(a => (
            <button key={a.label} className="qa-btn" onClick={() => send(a.value)}>{a.label}</button>
          ))}
        </div>
      </div>

      <div className="card chat">
        <div ref={listRef} className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === "user" ? "user" : "bot"}`}>{m.content}</div>
          ))}
        </div>
        <div className="input-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") send(); }}
            placeholder="Ask about menu, calories, deals, or locations"
            className="input"
            aria-label="Message"
          />
          <button className="send" onClick={() => send()} disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
