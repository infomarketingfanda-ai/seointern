'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Send, Loader2, Bot, User, ArrowLeft, Lightbulb } from 'lucide-react'
import Link from 'next/link'

type Message = { id: string; role: 'user' | 'assistant'; content: string; created_at: string }

const SUGGESTIONS = [
  "What should I fix first?",
  "Why did my score drop?",
  "How do I allow ChatGPT to crawl my site?",
  "What's missing on my homepage?",
  "How do I add schema markup?",
  "Explain my performance issues",
]

export default function CopilotPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchHistory = useCallback(async () => {
    const res = await fetch(`/api/sites/${siteId}/copilot`)
    if (res.ok) setMessages(await res.json())
  }, [siteId])

  useEffect(() => { fetchHistory() }, [fetchHistory])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streaming])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    setInput('')
    setLoading(true)

    const userMsg: Message = {
      id: Date.now().toString(), role: 'user', content: text, created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])

    let response = ''
    setStreaming('')

    const res = await fetch(`/api/sites/${siteId}/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    })

    if (!res.ok) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      }])
      setLoading(false)
      return
    }

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        const data = line.slice(6)
        if (data === '[DONE]') break
        try {
          const { text: t } = JSON.parse(data)
          response += t
          setStreaming(response)
        } catch {}
      }
    }

    if (response) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant', content: response, created_at: new Date().toISOString()
      }])
    }
    setStreaming('')
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/sites/${siteId}`}
          className="text-teal-400 hover:text-teal-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h1 className="text-white font-bold">SEO Co-pilot</h1>
            <p className="text-teal-500 text-xs">Powered by Claude · Knows your site's full audit data</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && !loading && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-teal-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Ask me anything about your SEO</h3>
            <p className="text-teal-400 text-sm mb-8">I have full context of your site's audit results.</p>
            <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="flex items-center gap-2 text-left text-sm text-teal-300 bg-teal-900/60 border border-teal-800/50 hover:border-teal-500/40 rounded-xl p-3 transition-all">
                  <Lightbulb className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-teal-400" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-teal-500 text-white rounded-tr-sm'
                : 'bg-teal-900/60 border border-teal-800/50 text-teal-200 rounded-tl-sm prose-dark'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-teal-700/50 flex items-center justify-center shrink-0 mt-1">
                <User className="w-3.5 h-3.5 text-teal-300" />
              </div>
            )}
          </div>
        ))}

        {streaming && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="max-w-[80%] bg-teal-900/60 border border-teal-800/50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-teal-200 whitespace-pre-wrap prose-dark">
              {streaming}
              <span className="inline-block w-1.5 h-4 bg-teal-400 animate-pulse ml-0.5 align-middle" />
            </div>
          </div>
        )}

        {loading && !streaming && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="bg-teal-900/60 border border-teal-800/50 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
          placeholder="Ask about your SEO…"
          disabled={loading}
          className="flex-1 bg-teal-900/60 border border-teal-700/50 text-white placeholder-teal-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 transition-colors"
        />
        <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
          className="bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-white p-3 rounded-xl transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
