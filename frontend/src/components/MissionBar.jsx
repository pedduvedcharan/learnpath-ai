import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const defaultMissions = [
  'Complete diagnosis review',
  'Study first roadmap node',
  'Do practice challenge',
]

export default function MissionBar({ xp = 100, streak = 1, missions }) {
  const missionItems = missions || defaultMissions
  const [checkedMissions, setCheckedMissions] = useState([])
  const [displayXp, setDisplayXp] = useState(0)
  const level = Math.floor(xp / 500) + 1
  const maxXpForBar = 500
  const xpInLevel = xp % 500

  useEffect(() => {
    let start = 0
    const end = xp
    const duration = 1500
    const stepTime = 16
    const steps = Math.ceil(duration / stepTime)
    const increment = end / steps
    let current = start

    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        current = end
        clearInterval(timer)
      }
      setDisplayXp(Math.round(current))
    }, stepTime)

    return () => clearInterval(timer)
  }, [xp])

  const toggleMission = (index) => {
    setCheckedMissions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
    >
      <div className="flex flex-col md:flex-row gap-8">
        {/* XP Bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-900">
              &#9889; {displayXp} XP
            </span>
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full"
            >
              Level {level}
            </motion.span>
          </div>
          <div className="bg-slate-200 h-3 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(xpInLevel / maxXpForBar) * 100}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            />
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {maxXpForBar - xpInLevel} XP to Level {level + 1}
          </span>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">&#128293;</span>
          <div>
            <motion.span
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 10 }}
              className="text-3xl font-bold text-slate-900 font-heading inline-block"
            >
              {streak}
            </motion.span>
            <span className="text-sm text-slate-500 ml-1">Day Streak</span>
          </div>
        </div>

        {/* Missions */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">
            Today&apos;s Missions
          </h4>
          <ul className="space-y-2">
            {missionItems.map((mission, i) => (
              <li key={i} className="flex items-center gap-2">
                <button
                  onClick={() => toggleMission(i)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    checkedMissions.includes(i)
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {checkedMissions.includes(i) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span
                  className={`text-sm transition-all duration-200 ${
                    checkedMissions.includes(i) ? 'text-slate-400 line-through' : 'text-slate-600'
                  }`}
                >
                  {mission}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
