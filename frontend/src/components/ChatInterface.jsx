import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import VoiceButton from './VoiceButton'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-slate-50 border border-slate-200 rounded-xl rounded-bl-sm p-3 max-w-[80%] flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 bg-indigo-400 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function AudioPlayer({ audioUrl }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.onended = () => setPlaying(false)
      audio.onerror = () => setPlaying(false)
      // Auto-play
      audio.play().then(() => setPlaying(true)).catch(() => {})
      return () => { audio.pause(); audio.src = '' }
    }
  }, [audioUrl])

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {})
    }
  }

  return (
    <button onClick={toggle} className="inline-flex items-center gap-1 mt-1.5 text-xs text-indigo-500 hover:text-indigo-600 transition-colors">
      {playing ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
          </svg>
          Pause
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707a1 1 0 011.707.707v13.414a1 1 0 01-1.707.707L5.586 15z" />
          </svg>
          Play
        </>
      )}
    </button>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'

  // Simple markdown-like rendering for AI messages
  const renderText = (text) => {
    if (isUser) return text

    // Split by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g)
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).replace(/^\w+\n/, '') // Remove language identifier
        return (
          <pre key={i} className="bg-slate-100 border border-slate-200 rounded-lg p-3 my-2 text-xs overflow-x-auto">
            <code>{code}</code>
          </pre>
        )
      }
      // Bold
      const formatted = part.split(/(\*\*.*?\*\*)/g).map((seg, j) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return <strong key={j}>{seg.slice(2, -2)}</strong>
        }
        return seg
      })
      return <span key={i}>{formatted}</span>
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex-shrink-0 mr-2 mt-1" />
      )}
      <div className="max-w-[80%]">
        <div
          className={`p-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-indigo-600 rounded-xl rounded-br-sm text-white'
              : 'bg-slate-50 border border-slate-200 rounded-xl rounded-bl-sm text-slate-700'
          }`}
        >
          {renderText(msg.text)}
        </div>
        {!isUser && msg.audio_url && (
          <AudioPlayer audioUrl={msg.audio_url} />
        )}
      </div>
    </motion.div>
  )
}

export default function ChatInterface({ userId, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hi! I'm Coach Sarah. I can help you with your learning journey — ask me anything about your roadmap, concepts, career advice, or any topic you're curious about! You can also use the mic to speak.",
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = async (text, isVoice = false) => {
    if (!text.trim()) return

    const userMsg = { role: 'user', text: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const { data } = await axios.post(`${API_BASE}/api/chat`, {
        user_id: userId,
        message: text.trim(),
        is_voice: isVoice,
      })

      const aiMsg = {
        role: 'ai',
        text: data.response || data.message,
        audio_url: data.audio_url || null,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      // Mock fallback
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: "I'm having trouble connecting right now. Please try again in a moment!",
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleVoiceTranscript = (transcript) => {
    if (transcript.trim()) {
      sendMessage(transcript, true)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
          />

          {/* Chat panel */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-16 bottom-0 w-full md:w-[420px] bg-white border-l border-slate-200 z-50 flex flex-col shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex-shrink-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Coach Sarah</h3>
                  <span className="text-xs text-emerald-500 font-medium">Online</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="p-3 border-t border-slate-200">
              <div className="flex items-end gap-2">
                <VoiceButton onTranscript={handleVoiceTranscript} compact />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
