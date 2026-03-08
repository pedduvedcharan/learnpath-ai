import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const steps = ['Profile', 'Resume', 'Questions', 'Goal']

const industries = [
  'Tech/SaaS',
  'Finance',
  'Healthcare',
  'E-commerce',
  'Gaming',
  'Education',
  'Government',
  'Consulting',
  'Startup',
  'Other',
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
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-cyan-500 text-white animate-pulse-glow'
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

export default function Details() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    role: '',
    industry: '',
    experience: 2,
    skills: [],
    learningGoal: '',
    hoursPerWeek: 10,
  })
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('userDetails')
    if (saved) {
      try {
        setForm(JSON.parse(saved))
      } catch {}
    }
  }, [])

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

  const removeSkill = (skill) => {
    update('skills', form.skills.filter((s) => s !== skill))
  }

  const isValid = form.name.trim() && form.role.trim() && form.skills.length > 0

  const handleNext = () => {
    localStorage.setItem('userDetails', JSON.stringify(form))
    navigate('/resume')
  }

  const fieldClass = (hasValue) =>
    `w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none transition-all duration-300 ${
      hasValue
        ? 'border-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.1)]'
        : 'border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50'
    }`

  return (
    <div className="min-h-screen px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <ProgressBar currentStep={0} />

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-heading text-3xl font-bold text-white">Tell us about yourself</h1>
          <div className="h-1 w-16 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-full mt-2" />
        </motion.div>

        {/* Form */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Full Name */}
          <motion.div variants={fadeUp} className="flex flex-col gap-2">
            <label className="text-sm text-slate-400 font-medium">Full Name *</label>
            <input
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className={fieldClass(form.name.trim())}
            />
          </motion.div>

          {/* Current Role */}
          <motion.div variants={fadeUp} className="flex flex-col gap-2">
            <label className="text-sm text-slate-400 font-medium">Current Role *</label>
            <input
              type="text"
              placeholder="e.g. Software Engineer"
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              className={fieldClass(form.role.trim())}
            />
          </motion.div>

          {/* Industry */}
          <motion.div variants={fadeUp} className="flex flex-col gap-2">
            <label className="text-sm text-slate-400 font-medium">Industry</label>
            <select
              value={form.industry}
              onChange={(e) => update('industry', e.target.value)}
              className={fieldClass(form.industry)}
            >
              <option value="" className="bg-slate-900">Select industry</option>
              {industries.map((ind) => (
                <option key={ind} value={ind} className="bg-slate-900">
                  {ind}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Years of Experience */}
          <motion.div variants={fadeUp} className="flex flex-col gap-2">
            <label className="text-sm text-slate-400 font-medium">
              Years of Experience: <span className="text-cyan-400 font-semibold">{form.experience}</span>
            </label>
            <div className="relative mt-1">
              <input
                type="range"
                min={0}
                max={20}
                value={form.experience}
                onChange={(e) => update('experience', parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-track]:rounded-full [&::-webkit-slider-track]:bg-slate-800
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500
                  [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.5)]
                  [&::-webkit-slider-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${(form.experience / 20) * 100}%, #1e293b ${(form.experience / 20) * 100}%, #1e293b 100%)`,
                }}
              />
            </div>
          </motion.div>

          {/* Top Skills */}
          <motion.div variants={fadeUp} className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm text-slate-400 font-medium">
              Top Skills * <span className="text-slate-600">({form.skills.length}/5)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full px-3 py-1 text-sm"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:text-red-400 transition-colors cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder={form.skills.length >= 5 ? 'Maximum 5 skills' : 'Type a skill and press Enter'}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={addSkill}
              disabled={form.skills.length >= 5}
              className={fieldClass(form.skills.length > 0)}
            />
          </motion.div>

          {/* Learning Goal */}
          <motion.div variants={fadeUp} className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm text-slate-400 font-medium">Learning Goal</label>
            <textarea
              rows={3}
              placeholder="What do you want to achieve?"
              value={form.learningGoal}
              onChange={(e) => update('learningGoal', e.target.value)}
              className={fieldClass(form.learningGoal.trim())}
            />
          </motion.div>

          {/* Hours per week */}
          <motion.div variants={fadeUp} className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm text-slate-400 font-medium">
              Hours per week: <span className="text-cyan-400 font-semibold">{form.hoursPerWeek}h</span>
            </label>
            <input
              type="range"
              min={1}
              max={40}
              value={form.hoursPerWeek}
              onChange={(e) => update('hoursPerWeek', parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-track]:rounded-full [&::-webkit-slider-track]:bg-slate-800
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500
                [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.5)]
                [&::-webkit-slider-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((form.hoursPerWeek - 1) / 39) * 100}%, #1e293b ${((form.hoursPerWeek - 1) / 39) * 100}%, #1e293b 100%)`,
              }}
            />
          </motion.div>
        </motion.div>

        {/* Next button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-end mt-10"
        >
          <button
            onClick={handleNext}
            disabled={!isValid}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 cursor-pointer ${
              isValid
                ? 'bg-gradient-to-r from-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/25 hover:scale-[1.03] hover:shadow-cyan-500/40 active:scale-[0.97]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Next: Upload Resume &rarr;
          </button>
        </motion.div>
      </div>
    </div>
  )
}
