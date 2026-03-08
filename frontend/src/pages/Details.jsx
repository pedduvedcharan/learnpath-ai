import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const steps = ['Profile', 'Resume', 'Questions', 'Goal']

const industries = [
  'Tech/SaaS', 'Finance', 'Healthcare', 'E-commerce', 'Gaming',
  'Education', 'Government', 'Consulting', 'Startup', 'Other',
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

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
                    ? 'bg-indigo-600 text-white animate-pulse-glow'
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

export default function Details() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('uid') || ''

  const [form, setForm] = useState({
    name: '', role: '', industry: '', experience: 2, skills: [], learningGoal: '', hoursPerWeek: 10,
  })
  const [skillInput, setSkillInput] = useState('')

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const addSkill = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = skillInput.trim()
      if (val && form.skills.length < 5 && !form.skills.includes(val)) {
        update('skills', [...form.skills, val])
        setSkillInput('')
      }
    }
  }

  const removeSkill = (skill) => update('skills', form.skills.filter((s) => s !== skill))
  const isValid = form.name.trim() && form.role.trim() && form.skills.length > 0

  const handleNext = async () => {
    try {
      if (userId) {
        // Update existing user (created during signup)
        await axios.post(`${API_BASE}/api/create-user`, { ...form, user_id: userId })
        navigate(`/resume?uid=${userId}`)
      } else {
        // No uid — create new user
        const res = await axios.post(`${API_BASE}/api/create-user`, form)
        navigate(`/resume?uid=${res.data.user_id}`)
      }
    } catch (err) {
      console.error('Failed to save profile:', err.message)
      navigate(`/resume${userId ? `?uid=${userId}` : ''}`)
    }
  }

  const fieldClass = (hasValue) =>
    `w-full bg-white border rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300 ${
      hasValue
        ? 'border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.08)]'
        : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
    }`

  return (
    <div className="min-h-screen px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <ProgressBar currentStep={0} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-heading text-3xl font-bold text-slate-900">Tell us about yourself</h1>
          <div className="h-1 w-16 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full mt-2" />
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={container} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="flex flex-col gap-2">
            <label className="text-sm text-slate-500 font-medium">Full Name *</label>
            <input type="text" placeholder="John Doe" value={form.name} onChange={(e) => update('name', e.target.value)} className={fieldClass(form.name.trim())} />
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col gap-2">
            <label className="text-sm text-slate-500 font-medium">Current Role *</label>
            <input type="text" placeholder="e.g. Software Engineer" value={form.role} onChange={(e) => update('role', e.target.value)} className={fieldClass(form.role.trim())} />
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col gap-2">
            <label className="text-sm text-slate-500 font-medium">Industry</label>
            <select value={form.industry} onChange={(e) => update('industry', e.target.value)} className={fieldClass(form.industry)}>
              <option value="">Select industry</option>
              {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col gap-2">
            <label className="text-sm text-slate-500 font-medium">
              Years of Experience: <span className="text-indigo-600 font-semibold">{form.experience}</span>
            </label>
            <div className="relative mt-1">
              <input
                type="range" min={0} max={20} value={form.experience}
                onChange={(e) => update('experience', parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-track]:rounded-full [&::-webkit-slider-track]:bg-slate-200
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600
                  [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(79,70,229,0.3)]
                  [&::-webkit-slider-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${(form.experience / 20) * 100}%, #E2E8F0 ${(form.experience / 20) * 100}%, #E2E8F0 100%)`,
                }}
              />
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm text-slate-500 font-medium">
              Top Skills * <span className="text-slate-400">({form.skills.length}/5)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.skills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full px-3 py-1 text-sm">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors cursor-pointer">&times;</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder={form.skills.length >= 5 ? 'Maximum 5 skills' : 'Type a skill and press Enter'}
              value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addSkill}
              disabled={form.skills.length >= 5} className={fieldClass(form.skills.length > 0)}
            />
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm text-slate-500 font-medium">Learning Goal</label>
            <textarea rows={3} placeholder="What do you want to achieve?" value={form.learningGoal}
              onChange={(e) => update('learningGoal', e.target.value)} className={fieldClass(form.learningGoal.trim())} />
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm text-slate-500 font-medium">
              Hours per week: <span className="text-indigo-600 font-semibold">{form.hoursPerWeek}h</span>
            </label>
            <input
              type="range" min={1} max={40} value={form.hoursPerWeek}
              onChange={(e) => update('hoursPerWeek', parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-track]:rounded-full [&::-webkit-slider-track]:bg-slate-200
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600
                [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(79,70,229,0.3)]
                [&::-webkit-slider-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${((form.hoursPerWeek - 1) / 39) * 100}%, #E2E8F0 ${((form.hoursPerWeek - 1) / 39) * 100}%, #E2E8F0 100%)`,
              }}
            />
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex justify-end mt-10">
          <button onClick={handleNext} disabled={!isValid}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 cursor-pointer ${
              isValid
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20 hover:scale-[1.03] hover:shadow-indigo-500/30 active:scale-[0.97]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}>
            Next: Upload Resume &rarr;
          </button>
        </motion.div>
      </div>
    </div>
  )
}
