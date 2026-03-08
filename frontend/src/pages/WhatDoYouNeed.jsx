import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const steps = ['Profile', 'Resume', 'Questions', 'Goal']

const NEED_CARDS = [
  { emoji: '\uD83D\uDD34', title: "I'm STUCK", desc: "Hit a wall and can't move forward. Help me break through.", accent: '#EF4444', key: 'stuck' },
  { emoji: '\uD83C\uDF31', title: 'BUILD A NEW SKILL', desc: 'Learn something from scratch with a full plan.', accent: '#10B981', key: 'build' },
  { emoji: '\uD83D\uDDFA\uFE0F', title: 'PLAN MY FUTURE', desc: 'What should I learn next for my career goals?', accent: '#4F46E5', key: 'plan' },
  { emoji: '\uD83D\uDD0D', title: 'FIND ME RESOURCES', desc: 'I know what to learn, just find the best resources.', accent: '#8B5CF6', key: 'resources' },
  { emoji: '\uD83D\uDD00', title: 'SHOW ME ALTERNATIVES', desc: 'My current approach might be wrong. Give me options.', accent: '#F59E0B', key: 'alternatives' },
]

function ProgressBar({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-12">
      {steps.map((label, i) => {
        const isActive = i === currentStep
        const isCompleted = i < currentStep
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`mt-2 text-xs ${isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 md:w-20 h-0.5 mx-2 mb-6 ${i < currentStep ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const cardVariant = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }

export default function WhatDoYouNeed() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('uid') || ''
  const [selected, setSelected] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = async () => {
    if (!selected) return
    if (userId) {
      try {
        await axios.post(`${API_BASE}/api/save-need`, { user_id: userId, need_type: selected, note })
      } catch (err) {
        console.error('Failed to save need:', err.message)
      }
    }
    navigate(`/analysis?uid=${userId}`)
  }

  return (
    <div className="min-h-screen px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <ProgressBar currentStep={3} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <h1 className="font-heading text-3xl font-bold text-slate-900">What brings you here today?</h1>
          <div className="h-1 w-16 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full mt-2" />
        </motion.div>

        <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8" variants={containerVariants} initial="hidden" animate="show">
          {NEED_CARDS.map((card, idx) => {
            const isSelected = selected === card.key
            const isLast = idx === NEED_CARDS.length - 1
            return (
              <motion.button
                key={card.key}
                variants={cardVariant}
                onClick={() => setSelected(card.key)}
                className={`relative text-left rounded-xl p-6 cursor-pointer border transition-all duration-300 bg-white ${isLast ? 'sm:col-span-2' : ''} ${
                  isSelected ? 'shadow-lg' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: card.accent,
                  borderTopColor: isSelected ? card.accent + '40' : undefined,
                  borderRightColor: isSelected ? card.accent + '40' : undefined,
                  borderBottomColor: isSelected ? card.accent + '40' : undefined,
                  boxShadow: isSelected ? `0 10px 40px ${card.accent}12` : undefined,
                  transform: isSelected ? 'translateY(-8px)' : undefined,
                }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <span className="text-2xl block mb-2">{card.emoji}</span>
                <h3 className="text-slate-900 font-bold text-lg mb-1">{card.title}</h3>
                <p className="text-slate-500 text-sm">{card.desc}</p>
                {isSelected && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: card.accent }}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="max-w-2xl mx-auto mb-8">
          <textarea rows={3} placeholder="Anything specific to tell your AI coach? (optional)" value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }} className="max-w-2xl mx-auto">
          <button onClick={handleSubmit} disabled={!selected}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 cursor-pointer ${
              selected
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}>
            Analyze My Learning Profile &rarr;
          </button>
        </motion.div>
      </div>
    </div>
  )
}
