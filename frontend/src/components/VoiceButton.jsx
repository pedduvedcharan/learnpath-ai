import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function VoiceButton({ onTranscript, compact = false }) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += t
        } else {
          interimTranscript += t
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript)
        onTranscript?.(finalTranscript)
        setListening(false)
      } else {
        setTranscript(interimTranscript)
      }
    }

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error)
      setListening(false)
      setTranscript('')
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
  }, [onTranscript])

  const toggleListening = () => {
    if (!supported) {
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 2500)
      return
    }

    if (listening) {
      try { recognitionRef.current?.stop() } catch {}
      setListening(false)
      setTranscript('')
    } else {
      try {
        setTranscript('')
        recognitionRef.current?.start()
        setListening(true)
      } catch {
        // Already started
      }
    }
  }

  // Compact mode for chat input bar
  if (compact) {
    return (
      <div className="relative">
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg shadow-sm"
            >
              Voice not supported
            </motion.div>
          )}
          {listening && transcript && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-indigo-50 border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg max-w-[200px] truncate"
            >
              {transcript}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleListening}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
            listening
              ? 'bg-red-50 border-2 border-red-400 text-red-500'
              : 'bg-slate-50 border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-600'
          }`}
        >
          {listening ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </motion.div>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z" />
            </svg>
          )}
        </button>
      </div>
    )
  }

  // Full mode (standalone voice button)
  return (
    <div className="relative flex flex-col items-center gap-1">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-10 whitespace-nowrap text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg shadow-sm"
          >
            Voice not supported in this browser
          </motion.div>
        )}
        {listening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-14 whitespace-nowrap text-xs bg-indigo-50 border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg max-w-[250px] truncate"
          >
            {transcript}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleListening}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
          listening
            ? 'bg-red-50 border-2 border-red-500'
            : 'bg-slate-50 border-2 border-slate-200 hover:border-slate-300'
        }`}
      >
        {listening && (
          <>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute inset-0 rounded-full border-2 border-red-500 pointer-events-none"
                style={{
                  animation: `voiceRing 1.5s ease-out ${i * 0.3}s infinite`,
                }}
              />
            ))}
          </>
        )}
        <span className="text-xl relative z-10">
          {listening ? (
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z" />
            </svg>
          )}
        </span>
      </button>

      <span className={`text-xs ${listening ? 'text-red-500' : 'text-slate-400'}`}>
        {listening ? 'Listening...' : 'Tap to speak'}
      </span>

      <style>{`
        @keyframes voiceRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
