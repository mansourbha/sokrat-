import { useState, useRef, useEffect, useCallback } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/claude-proxy`

const SYSTEM_PROMPT = `Tu es Sokrat, un assistant IA intelligent, curieux et bienveillant.
Tu réponds en français par défaut, sauf si l'utilisateur s'adresse à toi dans une autre langue.
Tu es précis, honnête et tu admets quand tu ne sais pas quelque chose.
Tu structures tes réponses clairement avec des paragraphes, listes ou blocs de code quand c'est pertinent.
Tu fais preuve d'empathie et tu adaptes ton ton au contexte de la conversation.`

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content: `Bonjour ! Je suis **Sokrat**, votre assistant IA.

Je suis là pour vous aider avec vos questions, vos projets, vos analyses ou simplement pour discuter. Comment puis-je vous aider aujourd'hui ?`,
}

function parseContent(text) {
  const lines = text.split('\n')
  const elements = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={key++}>
          {lang && <span style={{ color: '#6c63ff', fontSize: 11, display: 'block', marginBottom: 6 }}>{lang}</span>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      i++
      continue
    }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} style={{ fontSize: 15, fontWeight: 700, color: '#c8c4ff', margin: '12px 0 4px' }}>{inlineFormat(line.slice(4))}</h3>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} style={{ fontSize: 16, fontWeight: 700, color: '#c8c4ff', margin: '14px 0 5px' }}>{inlineFormat(line.slice(3))}</h2>)
      i++; continue
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} style={{ fontSize: 18, fontWeight: 700, color: '#c8c4ff', margin: '16px 0 6px' }}>{inlineFormat(line.slice(2))}</h1>)
      i++; continue
    }

    if (line.match(/^[-*] /)) {
      const items = []
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(<li key={i} style={{ marginBottom: 3 }}>{inlineFormat(lines[i].slice(2))}</li>)
        i++
      }
      elements.push(<ul key={key++} style={{ paddingLeft: 20, margin: '6px 0' }}>{items}</ul>)
      continue
    }

    if (line.match(/^\d+\. /)) {
      const items = []
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(<li key={i} style={{ marginBottom: 3 }}>{inlineFormat(lines[i].replace(/^\d+\. /, ''))}</li>)
        i++
      }
      elements.push(<ol key={key++} style={{ paddingLeft: 20, margin: '6px 0' }}>{items}</ol>)
      continue
    }

    if (line.trim() === '') {
      elements.push(<div key={key++} style={{ height: 8 }} />)
      i++; continue
    }

    elements.push(<p key={key++} style={{ margin: '2px 0' }}>{inlineFormat(line)}</p>)
    i++
  }

  return elements
}

function inlineFormat(text) {
  const parts = []
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let last = 0
  let m
  let k = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>)
    if (m[2]) parts.push(<strong key={k++}><em>{m[2]}</em></strong>)
    else if (m[3]) parts.push(<strong key={k++}>{m[3]}</strong>)
    else if (m[4]) parts.push(<em key={k++}>{m[4]}</em>)
    else if (m[5]) parts.push(<code key={k++}>{m[5]}</code>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>)
  return parts.length ? parts : text
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 16,
      animation: 'fadeUp 0.2s ease',
    }}>
      {!isUser && (
        <div style={{
          width: 34, height: 34,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
          marginRight: 10, marginTop: 2,
          boxShadow: '0 0 12px rgba(108,99,255,0.4)',
          color: 'white', fontWeight: 700,
        }}>S</div>
      )}
      <div style={{
        maxWidth: '78%',
        background: isUser ? '#6c63ff' : '#22222d',
        color: '#e8e8f0',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '12px 16px',
        boxShadow: isUser ? '0 2px 12px rgba(108,99,255,0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
        border: isUser ? 'none' : '1px solid #2e2e3a',
        wordBreak: 'break-word',
      }}>
        {parseContent(msg.content)}
      </div>
      {isUser && (
        <div style={{
          width: 34, height: 34,
          borderRadius: '50%',
          background: '#22222d',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, flexShrink: 0,
          marginLeft: 10, marginTop: 2,
          border: '1px solid #2e2e3a',
        }}>👤</div>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, marginRight: 10, flexShrink: 0,
        boxShadow: '0 0 12px rgba(108,99,255,0.4)',
        color: 'white', fontWeight: 700,
      }}>S</div>
      <div style={{
        background: '#22222d',
        border: '1px solid #2e2e3a',
        borderRadius: '18px 18px 18px 4px',
        padding: '14px 18px',
        display: 'flex',
        gap: 5,
        alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7,
            borderRadius: '50%',
            background: '#6c63ff',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

const suggestions = [
  'Explique-moi la récursivité',
  'Aide-moi à rédiger un email',
  'Quels sont les avantages du cloud ?',
  'Écris un poème sur Paris',
]

export default function App() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { id: Date.now(), role: 'user', content: text }
    const history = [...messages.filter(m => m.id !== 'welcome'), userMsg]

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          system: SYSTEM_PROMPT,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Erreur ${res.status}: ${errText}`)
      }

      const data = await res.json()
      const reply = data?.content?.[0]?.text ?? data?.text ?? JSON.stringify(data)

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Désolé, une erreur est survenue :\n\`${err.message}\`\n\nVeuillez réessayer.`,
      }])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }, [input, loading, messages])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const clearChat = () => {
    setMessages([WELCOME])
    textareaRef.current?.focus()
  }

  const autoResize = (e) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
    setInput(e.target.value)
  }

  const showSuggestions = messages.length === 1

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f0f13' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid #2e2e3a',
        background: '#18181f',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: 'white',
            boxShadow: '0 0 16px rgba(108,99,255,0.5)',
          }}>S</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#e8e8f0' }}>Sokrat</div>
            <div style={{ fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              En ligne
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{
            background: 'none', border: '1px solid #2e2e3a',
            color: '#8888a0', borderRadius: 8,
            padding: '6px 12px', fontSize: 13, cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6c63ff'; e.currentTarget.style.color = '#6c63ff' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2e3a'; e.currentTarget.style.color = '#8888a0' }}
        >
          Nouvelle conversation
        </button>
      </header>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '20px',
        maxWidth: 800, width: '100%', margin: '0 auto', alignSelf: 'stretch',
      }}>
        {messages.map(msg => <Message key={msg.id} msg={msg} />)}
        {loading && <TypingIndicator />}

        {showSuggestions && (
          <div style={{ marginTop: 20 }}>
            <p style={{ color: '#8888a0', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>
              Suggestions pour commencer :
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); textareaRef.current?.focus() }}
                  style={{
                    background: '#22222d', border: '1px solid #2e2e3a',
                    color: '#e8e8f0', borderRadius: 20,
                    padding: '7px 14px', fontSize: 13, cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#6c63ff'; e.currentTarget.style.background = 'rgba(108,99,255,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2e3a'; e.currentTarget.style.background = '#22222d' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid #2e2e3a', background: '#18181f', padding: '14px 20px', flexShrink: 0 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{
            flex: 1, background: '#22222d',
            border: '1px solid #2e2e3a', borderRadius: 16,
            padding: '10px 14px',
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={autoResize}
              onKeyDown={handleKey}
              placeholder="Écrivez votre message… (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)"
              rows={1}
              style={{
                width: '100%', background: 'none', border: 'none', outline: 'none',
                color: '#e8e8f0', fontSize: 15,
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                resize: 'none', lineHeight: 1.5,
                minHeight: 24, maxHeight: 160, overflow: 'hidden',
                display: 'block',
              }}
            />
          </div>
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: loading || !input.trim()
                ? '#22222d'
                : 'linear-gradient(135deg, #6c63ff, #a78bfa)',
              border: '1px solid #2e2e3a',
              color: loading || !input.trim() ? '#8888a0' : 'white',
              fontSize: 20, cursor: loading || !input.trim() ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: loading || !input.trim() ? 'none' : '0 2px 12px rgba(108,99,255,0.4)',
            }}
          >
            {loading ? '⏳' : '↑'}
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#8888a0', marginTop: 8 }}>
          Sokrat peut faire des erreurs. Vérifiez les informations importantes.
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
