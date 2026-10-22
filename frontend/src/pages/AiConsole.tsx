import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, TriangleAlert } from 'lucide-react'
import { aiApi, apiErrorMessage } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'

interface Msg {
  role: 'user' | 'assistant'
  text: string
  source?: string
  time: string
}

const SUGGESTIONS = [
  'Which products are at critical expiry risk?',
  'Summarise the reorder position',
  'Which categories waste the most?',
  'Suggest discount ideas for high-risk produce',
  'Which suppliers are most reliable?',
]

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export default function AiConsole() {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      text: 'Welcome to the SmartCart AI executive console. Ask about expiry risk, discount strategy, reorder priorities or supplier performance. Answers come from /api/ai/chat.',
      time: now(),
    },
  ])
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    inputRef.current?.focus()
  }, [messages, busy])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || busy) return
    setInput('')
    const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.text }))
    setMessages((m) => [...m, { role: 'user', text: message, time: now() }])
    setBusy(true)
    try {
      const res = await aiApi.chat(message, history)
      const data = res.data as { reply?: string; source?: string; error?: string } | null
      const reply = data?.reply || data?.error
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: reply || 'The assistant returned an empty response. The AI microservice may be offline — the API falls back to the rule engine when that happens.',
          source: data?.source,
          time: now(),
        },
      ])
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: apiErrorMessage(err, 'The assistant could not be reached.'), time: now() },
      ])
    } finally {
      setBusy(false)
    }
  }

  const lastFallback = [...messages].reverse().find((m) => m.role === 'assistant' && m.source?.includes('fallback'))

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <PageHeader
        title="AI console"
        subtitle="Full-page executive intelligence assistant powered by /api/ai/chat. Every reply carries its server-declared source."
      />

      {lastFallback ? (
        <div
          role="status"
          className="card"
          style={{
            marginBottom: 14,
            padding: '12px 14px',
            border: '1px solid var(--warning)',
            background: 'var(--warning-soft, #fdf6e3)',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            fontSize: '0.84rem',
            lineHeight: 1.5,
          }}
        >
          <TriangleAlert size={16} aria-hidden="true" style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Canned fallback active.</strong> The backend's FastAPI microservice is offline
            (<code>AI_SERVICE_URL</code> unreachable), so the Express server answered from its hardcoded rule-engine
            fallback. Names, percentages and discount figures in these replies are scripted examples — do not treat
            them as live readings.
          </div>
        </div>
      ) : null}

      <div
        ref={listRef}
        aria-live="polite"
        className="card"
        style={{
          height: 'min(600px, calc(100dvh - 260px))',
          minHeight: 380,
          overflowY: 'auto',
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
            }}
          >
            <div
              style={{
                background: m.role === 'user' ? 'var(--brand)' : 'var(--bg-sunken)',
                color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                padding: '12px 15px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                fontSize: '0.9rem',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.text}
              {m.source ? (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: '0.7rem',
                    fontWeight: m.source.includes('fallback') ? 600 : 400,
                    color: m.source.includes('fallback') ? 'var(--warning)' : 'var(--text-secondary)',
                    opacity: m.role === 'user' ? 0.85 : 1,
                  }}
                >
                  {m.source.includes('fallback')
                    ? `⚠ Canned fallback — not live data. (source: ${m.source})`
                    : `source: ${m.source}`}
                </div>
              ) : null}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: '0.68rem',
                color: 'var(--text-secondary)',
                textAlign: m.role === 'user' ? 'right' : 'left',
              }}
            >
              {m.role === 'user' ? 'you' : 'assistant'} · {m.time}
            </div>
          </div>
        ))}
        {busy ? (
          <div style={{ alignSelf: 'flex-start', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <Sparkles size={13} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 5 }} />
            Consulting the rule engine…
          </div>
        ) : null}
      </div>

      {messages.length <= 2 ? (
        <div className="row" style={{ gap: 6, padding: '12px 0 0', flexWrap: 'wrap' }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip" style={{ cursor: 'pointer' }} onClick={() => void send(s)}>
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
        className="row"
        style={{ marginTop: 14, gap: 8, position: 'sticky', bottom: 0, background: 'var(--bg)', padding: '10px 0' }}
      >
        <label className="sr-only" htmlFor="console-input">
          Message
        </label>
        <input
          id="console-input"
          ref={inputRef}
          className="input"
          placeholder="Ask about inventory risk, discounts, reorders…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          style={{ flex: 1, fontSize: '0.95rem' }}
        />
        <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()} aria-label="Send message">
          <Send size={16} aria-hidden="true" /> Send
        </button>
      </form>
    </div>
  )
}
