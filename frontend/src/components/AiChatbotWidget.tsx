import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { aiApi, apiErrorMessage } from '../lib/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  source?: string
}

const SUGGESTIONS = [
  'Which products are at critical expiry risk?',
  'Summarise the reorder position',
  'Which categories waste the most?',
]

export default function AiChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Ask me about inventory risk, expiry exposure or reorder priorities. Answers come from the SmartCart API.',
    },
  ])
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    if (open) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
      inputRef.current?.focus()
      wasOpen.current = true
    } else if (wasOpen.current) {
      wasOpen.current = false
      launcherRef.current?.focus()
    }
  }, [open, messages, busy])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || busy) return
    setInput('')
    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.text }))
    setMessages((m) => [...m, { role: 'user', text: message }])
    setBusy(true)
    try {
      const res = await aiApi.chat(message, history)
      const data = res.data as { reply?: string; source?: string; error?: string } | null
      const reply = data?.reply || data?.error
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text:
            reply ||
            'The assistant returned an empty response. The AI microservice may be offline — the API falls back to the rule engine when that happens.',
          source: data?.source,
        },
      ])
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: apiErrorMessage(err, 'The assistant could not be reached.') },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        ref={launcherRef}
        className="btn btn-primary"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="smartcart-assistant"
        style={{
          position: 'fixed',
          right: 22,
          bottom: 22,
          zIndex: 100,
          borderRadius: 999,
          boxShadow: 'var(--shadow-3)',
          padding: '12px 18px',
        }}
      >
        {open ? <X size={17} aria-hidden="true" /> : <MessageSquare size={17} aria-hidden="true" />}
        {open ? 'Close assistant' : 'Ask the assistant'}
      </button>

      {open ? (
        <div
          id="smartcart-assistant"
          role="dialog"
          aria-label="SmartCart assistant"
          className="card animate-pop"
          style={{
            position: 'fixed',
            right: 22,
            top: 'calc(var(--topbar-h) + 12px)',
            bottom: 84,
            zIndex: 100,
            width: 'min(400px, calc(100vw - 32px))',
            maxHeight: 'calc(100dvh - var(--topbar-h) - 96px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-3)',
          }}
        >
          <div className="card-header" style={{ padding: '14px 16px' }}>
            <div>
              <div className="card-title">SmartCart assistant</div>
              <div className="card-subtitle">Answers via /api/ai/chat — no fabricated data</div>
            </div>
          </div>

          <div
            ref={listRef}
            style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
            aria-live="polite"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '86%',
                  background: m.role === 'user' ? 'var(--brand)' : 'var(--bg-sunken)',
                  color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                  padding: '10px 13px',
                  borderRadius: '14px 14px 14px 4px',
                  fontSize: '0.87rem',
                  lineHeight: 1.5,
                }}
              >
                {m.text}
                {m.source ? (
                  m.source.includes('fallback') ? (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: '0.7rem',
                        color: 'var(--warning)',
                        fontWeight: 600,
                        lineHeight: 1.4,
                      }}
                    >
                      ⚠ Canned fallback — its AI microservice is offline, so names/figures here are scripted
                      examples, not live readings. (source: {m.source})
                    </div>
                  ) : (
                    <div style={{ marginTop: 6, fontSize: '0.7rem', opacity: 0.75 }}>source: {m.source}</div>
                  )
                ) : null}
              </div>
            ))}
            {busy ? (
              <div style={{ alignSelf: 'flex-start', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Thinking…
              </div>
            ) : null}
          </div>

          {messages.length <= 2 ? (
            <div className="row" style={{ gap: 6, padding: '0 12px 8px', flexWrap: 'wrap' }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="chip"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    void send(s)
                    return
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void send(input)
              return
            }}
            className="row"
            style={{ padding: 12, borderTop: '1px solid var(--border)', gap: 8, flexWrap: 'nowrap' }}
          >
            <label className="sr-only" htmlFor="assistant-input">
              Message
            </label>
            <input
              id="assistant-input"
              ref={inputRef}
              className="input"
              placeholder="Ask about inventory…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
            <button
              type="submit"
              className="icon-btn"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              onClick={() => {
                if (!input.trim()) toast.error('Type a message first')
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : null}
    </>
  )
}
