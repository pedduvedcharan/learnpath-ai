import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const steps = ['Profile', 'Resume', 'Questions', 'Goal']

const NEED_CARDS = [
  {
    emoji: '\uD83D\uDD34',
    title: "I'm STUCK",
    desc: "Hit a wall and can't move forward. Help me break through.",
    accent: '#ef4444',
    key: 'stuck',
  },
  {
    emoji: '\uD83C\uDF31',
    title: 'BUILD A NEW SKILL',
    desc: 'Learn something from scratch with a full plan.',
    accent: '#22c55e',
    key: 'build',
  },
  {
    emoji: '\uD83D\uDDFA\uFE0F',
    title: 'PLAN MY FUTURE',
    desc: 'What should I learn next for my career goals?',
    accent: '#3b82f6',
    key: 'plan',
  },
  {
    emoji: '\uD83D\uDD0D',
    title: 'FIND ME RESOURCES',
    desc: 'I know what to learn, just find the best resources.',
    accent: '#8b5cf6',
    key: 'resources',
  },
  {
    emoji: '\uD83D\uDD00',
    title: 'SHOW ME ALTERNATIVES',
    desc: 'My current approach might be wrong. Give me options.',
    accent: '#f59e0b',
    key: 'alternatives',
  },
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
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
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
              <span
                className={`mt-2 text-xs ${
                  isActive ? 'text-cyan-400' : isCompleted ? 'text-green-400' : 'text-slate-500'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 md:w-20 h-0.5 mx-2 mb-6 ${
                  i < currentStep ? 'bg-green-500' : 'bg-slate-700'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function WhatDoYouNeed() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    if (!selected) return
    localStorage.setItem('needType', JSON.stringify({ type: selected, note }))
    navigate('/analysis')
  }

  return (
    <div className="min-h-screen px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <ProgressBar currentStep={3} />

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="font-heading text-3xl font-bold text-white">What brings you here today?</h1>
          <div className="h-1 w-16 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-full mt-2" />
        </motion.div>

        {/* Cards grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {NEED_CARDS.map((card, idx) => {
            const isSelected = selected === card.key
            const isLast = idx === NEED_CARDS.length - 1
            return (
              <motion.button
                key={card.key}
                variants={cardVariant}
                onClick={() => setSelected(card.key)}
                className={`relative text-left rounded-xl p-6 cursor-pointer border transition-all duration-300 ${
                  isLast ? 'sm:col-span-2' : ''
                } ${
                  isSelected
                    ? 'bg-slate-900/80 shadow-lg'
                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'
                }`}
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: card.accent,
                  borderTopColor: isSelected ? card.accent + '60' : undefined,
                  borderRightColor: isSelected ? card.accent + '60' : undefined,
                  borderBottomColor: isSelected ? card.accent + '60' : undefined,
                  boxShadow: isSelected ? `0 10px 40px ${card.accent}15` : undefined,
                  transform: isSelected ? 'translateY(-8px)' : undefined,
                }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <span className="text-2xl block mb-2">{card.emoji}</span>
                <h3 className="text-white font-bold text-lg mb-1">{card.title}</h3>
                <p className="text-slate-400 text-sm">{card.desc}</p>

                {/* Checkmark */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: card.accent }}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </motion.div>

        {/* Optional note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <textarea
            rows={3}
            placeholder="Anything specific to tell your AI coach? (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
          />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 cursor-pointer ${
              selected
                ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/25 hover:scale-[1.02] hover:shadow-cyan-500/40 active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Analyze My Learning Profile &rarr;
          </button>
        </motion.div>
      </div>
    </div>
  )
}
