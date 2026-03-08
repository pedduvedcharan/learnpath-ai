import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function VoiceButton({ onTranscript, isListening: externalListening }) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)
  const recognitionRef = useRef(null)

  const isActive = externalListening ?? listening

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onTranscript?.(transcript)
    }

    recognition.onerror = () => {
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
  }, [onTranscript])

  const startListening = () => {
    if (!supported) {
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 2500)
      return
    }
    try {
      recognitionRef.current?.start()
      setListening(true)
    } catch {
      // Already started
    }
  }

  const stopListening = () => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // Not started
    }
    setListening(false)
  }

  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* Tooltip for unsupported browsers */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-10 whitespace-nowrap text-xs bg-slate-800 border border-slate-600 text-slate-300 px-3 py-1.5 rounded-lg"
          >
            Voice not supported in this browser
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <button
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onTouchStart={startListening}
        onTouchEnd={stopListening}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
          isActive
            ? 'bg-red-500/20 border-2 border-red-500'
            : 'bg-slate-800 border-2 border-slate-600 hover:border-slate-500'
        }`}
      >
        {/* Pulsing rings when active */}
        {isActive && (
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
        <span className="text-xl relative z-10">&#127897;&#65039;</span>
      </button>

      {/* Label */}
      <span className={`text-xs ${isActive ? 'text-red-400' : 'text-slate-500'}`}>
        {isActive ? 'Listening...' : 'Hold to speak'}
      </span>

      {/* CSS for ring animation */}
      <style>{`
        @keyframes voiceRing {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
