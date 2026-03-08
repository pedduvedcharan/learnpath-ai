import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import VoiceButton from './VoiceButton'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-slate-800 border border-slate-700 rounded-xl rounded-bl-sm p-3 max-w-[80%] flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 bg-cyan-400 rounded-full"
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

export default function ChatInterface({ userId, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hi! I'm Coach Sarah. I can help you with your learning journey. Ask me anything about your roadmap, resources, or concepts!",
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

      const aiMsg = { role: 'ai', text: data.response || data.message }
      setMessages((prev) => [...prev, aiMsg])

      // Play audio if available
      if (data.audio_url) {
        try {
          const audio = new Audio(data.audio_url)
          audio.play().catch(() => {})
        } catch {
          // Audio playback failed silently
        }
      }
    } catch {
      // Mock fallback
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: "I'm your AI coach Sarah! I can help you with your learning journey. What would you like to know?",
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
    sendMessage(transcript, true)
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
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
          />

          {/* Chat panel */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-16 bottom-0 w-full md:w-[400px] bg-slate-900 border-l border-slate-700 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                {/* AI orb */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 animate-pulse flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Chat with Coach Sarah</h3>
                  <span className="text-xs text-slate-400">AI Learning Coach</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 flex-shrink-0 mr-2 mt-1" />
                  )}
                  <div
                    className={`max-w-[80%] p-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-violet-500/20 border border-violet-500/30 rounded-xl rounded-br-sm text-white'
                        : 'bg-slate-800 border border-slate-700 rounded-xl rounded-bl-sm text-slate-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-end gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Coach Sarah..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  className="w-11 h-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                </button>
                <VoiceButton onTranscript={handleVoiceTranscript} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
