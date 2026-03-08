import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/* ─── animation variants ─── */
const slideVariants = {
  enter: { opacity: 0, x: 100 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
}

/* ─── helper: slider color ─── */
function sliderColor(val) {
  if (val <= 3) return '#ef4444'
  if (val <= 6) return '#eab308'
  return '#22c55e'
}

function sliderGradient(val) {
  const pct = ((val - 1) / 9) * 100
  const c = sliderColor(val)
  return `linear-gradient(to right, ${c} 0%, ${c} ${pct}%, #334155 ${pct}%, #334155 100%)`
}

const pillBtn = (selected) =>
  `rounded-xl px-4 py-3 text-sm text-left cursor-pointer transition-all duration-200 border ${
    selected
      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:bg-cyan-500/5'
  }`

const chipBtn = (selected) =>
  `rounded-xl px-4 py-2 text-sm cursor-pointer transition-all duration-200 border ${
    selected
      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500 text-white'
      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/50'
  }`

/* ─── Component ─── */
export default function DeepQuestions() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('uid') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState(null)
  const [resumeData, setResumeData] = useState(null)

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [direction, setDirection] = useState(1)

  // Answers — keyed by question key (q1, q2, ... q10)
  const [answers, setAnswers] = useState({})

  const totalQuestions = questions ? Object.keys(questions).length : 0
  const questionKeys = questions ? Object.keys(questions).sort() : []
  const currentKey = questionKeys[currentQuestion] || ''
  const currentQ = questions ? questions[currentKey] : null
  const isReview = currentQuestion === totalQuestions

  const setAnswer = useCallback((key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }, [])

  /* ─── Load resume + generate questions from Gemini ─── */
  useEffect(() => {
    if (!userId) {
      setError('No user ID found. Please go back and upload your resume.')
      setLoading(false)
      return
    }

    const init = async () => {
      try {
        const userRes = await axios.get(`${API_BASE}/api/user/${userId}`)
        if (userRes.data.data) setResumeData(userRes.data.data)

        // Check if questions already cached
        const existingRes = await axios.get(`${API_BASE}/api/questions/${userId}`)
        if (existingRes.data.questions) {
          setQuestions(existingRes.data.questions)
          setLoading(false)
          return
        }

        // Generate new questions from Gemini
        const genRes = await axios.post(`${API_BASE}/api/generate-questions`, {
          user_id: userId,
        }, { timeout: 120000 })

        if (genRes.data.success && genRes.data.questions) {
          setQuestions(genRes.data.questions)
        } else {
          setError('Failed to generate questions. Please try again.')
        }
      } catch (err) {
        console.error('Failed to load questions:', err.message)
        setError('Failed to generate questions. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [userId])

  /* ─── navigation logic ─── */
  const canAdvance = (() => {
    if (!currentQ) return false
    const ans = answers[currentKey]
    switch (currentQ.type) {
      case 'single_select_grid': return !!ans
      case 'multi_select_chips': return Array.isArray(ans) && ans.length > 0
      case 'ranked_priority': return true // always has items
      case 'level_cards': return !!ans
      case 'multi_slider_panel': return true
      case 'conditional_checklist': return Array.isArray(ans?.triedResources) && ans.triedResources.length > 0
      case 'three_textarea_structured': return true
      case 'binary_toggle_list': return true
      case 'card_plus_conditional_input': return !!ans?.type
      case 'smart_slider_with_calculator': return true
      default: return true
    }
  })()

  const goNext = useCallback(() => {
    if (currentQuestion <= totalQuestions - 1 && canAdvance) {
      setDirection(1)
      setCurrentQuestion((q) => q + 1)
    }
  }, [currentQuestion, canAdvance, totalQuestions])

  const goPrev = useCallback(() => {
    if (currentQuestion > 0) {
      setDirection(-1)
      setCurrentQuestion((q) => q - 1)
    }
  }, [currentQuestion])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && canAdvance && !isReview) {
        if (e.target.tagName === 'TEXTAREA') return
        goNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, canAdvance, isReview])

  /* ─── Submit to MongoDB ─── */
  const handleSubmit = async () => {
    if (!userId) return

    const profile = {
      user_id: userId,
      topic: answers[questionKeys[0]] || '',
      subtopics: answers[questionKeys[1]] || [],
      priorities: answers[questionKeys[2]] || [],
      currentLevel: answers[questionKeys[3]] || '',
      selfAssessment: answers[questionKeys[4]] || {},
      learningHistory: {
        triedResources: (answers[questionKeys[5]] || {}).triedResources || [],
        completionLevel: (answers[questionKeys[5]] || {}).completionLevel || '',
        stopReasons: (answers[questionKeys[5]] || {}).stopReasons || [],
      },
      theWall: {
        trying: (answers[questionKeys[6]] || {}).trying || '',
        notWorking: (answers[questionKeys[6]] || {}).notWorking || '',
        alreadyTried: (answers[questionKeys[6]] || {}).alreadyTried || '',
        quickTags: (answers[questionKeys[6]] || {}).quickTags || [],
      },
      behaviorFlags: answers[questionKeys[7]] || [],
      goal: {
        type: (answers[questionKeys[8]] || {}).type || '',
        detail: (answers[questionKeys[8]] || {}).detail || '',
      },
      timeCommitment: {
        hoursPerWeek: (answers[questionKeys[9]] || {}).hoursPerWeek || 10,
        deadline: (answers[questionKeys[9]] || {}).deadline || '3 months',
      },
    }

    try {
      await axios.post(`${API_BASE}/api/save-profile`, profile)
    } catch (err) {
      console.error('Failed to save profile:', err.message)
    }
    navigate(`/need?uid=${userId}`)
  }

  /* ══════════════════════════════════════════════════════════
     RENDERERS — one per question type
     ══════════════════════════════════════════════════════════ */

  const renderByType = () => {
    if (!currentQ) return null
    const renderers = {
      single_select_grid: renderSingleSelectGrid,
      multi_select_chips: renderMultiSelectChips,
      ranked_priority: renderRankedPriority,
      level_cards: renderLevelCards,
      multi_slider_panel: renderMultiSliderPanel,
      conditional_checklist: renderConditionalChecklist,
      three_textarea_structured: renderThreeTextareas,
      binary_toggle_list: renderBinaryToggleList,
      card_plus_conditional_input: renderCardConditionalInput,
      smart_slider_with_calculator: renderSmartSlider,
    }
    const fn = renderers[currentQ.type]
    if (!fn) return <p className="text-slate-400">Unknown question type: {currentQ.type}</p>
    return fn()
  }

  /* ── 1. single_select_grid ── */
  const renderSingleSelectGrid = () => {
    const selected = answers[currentKey] || ''
    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-white mb-2">{currentQ.question}</h2>
        <p className="text-slate-400 mb-6">{currentQ.subtitle}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(currentQ.options || []).map((opt) => {
            const label = typeof opt === 'string' ? opt : opt.label
            const icon = typeof opt === 'object' ? opt.icon : ''
            return (
              <button key={label} onClick={() => setAnswer(currentKey, label)} className={pillBtn(selected === label)}>
                {icon && <span className="mr-1">{icon}</span>}{label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── 2. multi_select_chips ── */
  const renderMultiSelectChips = () => {
    const selected = answers[currentKey] || []
    const q1Answer = answers[questionKeys[0]] || ''
    const subtopicMap = currentQ.subtopicMap || {}
    const options = subtopicMap[q1Answer] || Object.values(subtopicMap).flat().slice(0, 12)

    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-white mb-2">{currentQ.question}</h2>
        <p className="text-slate-400 mb-6">{currentQ.subtitle}</p>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selected.map((s) => (
              <span key={s} className="bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 rounded-full px-3 py-1 text-sm flex items-center gap-1.5">
                {s}
                <button onClick={() => setAnswer(currentKey, selected.filter((x) => x !== s))} className="hover:text-red-400 cursor-pointer">&times;</button>
              </span>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {options.map((s) => {
            const sel = selected.includes(s)
            return (
              <button
                key={s}
                onClick={() => {
                  if (sel) setAnswer(currentKey, selected.filter((x) => x !== s))
                  else if (selected.length < 4) setAnswer(currentKey, [...selected, s])
                }}
                className={pillBtn(sel)}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── 3. ranked_priority ── */
  const renderRankedPriority = () => {
    const items = currentQ.items || []
    // Initialize order if not set
    const ranked = answers[currentKey] || items.map((it) => it.label)

    const moveUp = (idx) => {
      if (idx === 0) return
      const next = [...ranked]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      setAnswer(currentKey, next)
    }

    const moveDown = (idx) => {
      if (idx >= ranked.length - 1) return
      const next = [...ranked]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      setAnswer(currentKey, next)
    }

    const itemMap = {}
    items.forEach((it) => { itemMap[it.label] = it })

    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-white mb-2">{currentQ.question}</h2>
        <p className="text-slate-400 mb-6">{currentQ.subtitle}</p>
        <div className="flex flex-col gap-2">
          {ranked.map((label, idx) => {
            const item = itemMap[label] || { icon: '', label }
            const isTop = idx === 0
            const rankColors = ['text-amber-400 border-amber-500/40 bg-amber-500/10', 'text-slate-300 border-slate-500/40 bg-slate-500/10', 'text-orange-400 border-orange-500/40 bg-orange-500/10']
            const rankBorder = idx < 3 ? rankColors[idx] : 'text-slate-400 border-slate-700 bg-slate-800/50'

            return (
              <motion.div
                key={label}
                layout
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-3 rounded-xl p-3 border ${rankBorder}`}
              >
                {/* Rank badge */}
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  idx === 0 ? 'bg-amber-500/20 text-amber-400' : idx === 1 ? 'bg-slate-600/30 text-slate-300' : idx === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {idx + 1}
                </span>

                <span className="text-lg mr-1">{item.icon}</span>
                <span className="text-white font-medium flex-1">{label}</span>

                {/* Up/Down buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs cursor-pointer transition-colors ${idx === 0 ? 'text-slate-700' : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx >= ranked.length - 1}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs cursor-pointer transition-colors ${idx >= ranked.length - 1 ? 'text-slate-700' : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
                  >
                    ▼
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
        <p className="text-slate-500 text-xs mt-3">Use the arrows to reorder. #1 = highest priority.</p>
      </div>
    )
  }

  /* ── 4. level_cards ── */
  const renderLevelCards = () => {
    const selected = answers[currentKey] || ''
    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-white mb-2">{currentQ.question}</h2>
        <p className="text-slate-400 mb-6">{currentQ.subtitle}</p>
        <div className="flex flex-col gap-4">
          {(currentQ.options || []).map((opt) => {
            const sel = selected === opt.label
            return (
              <button
                key={opt.label}
                onClick={() => setAnswer(currentKey, opt.label)}
                className={`relative w-full text-left rounded-xl p-4 cursor-pointer transition-all duration-200 border ${
                  sel ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10' : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <div className="text-white font-semibold">{opt.label}</div>
                    <div className="text-slate-400 text-sm">{opt.description}</div>
                  </div>
                </div>
                {sel && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── 5. multi_slider_panel ── */
  const renderMultiSliderPanel = () => {
    const dims = currentQ.dimensions || []
    const vals = answers[currentKey] || {}
    const getVal = (key) => vals[key] ?? 5
    const avg = dims.length > 0 ? (dims.reduce((sum, d) => sum + getVal(d.key), 0) / dims.length).toFixed(1) : 0

    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-white mb-2">{currentQ.question}</h2>
        <p className="text-slate-400 mb-4">{currentQ.subtitle}</p>

        {/* Average score badge */}
        <div className="flex items-center gap-2 mb-6 bg-slate-800/50 rounded-xl px-4 py-2 border border-slate-700 w-fit">
          <span className="text-slate-400 text-sm">Average:</span>
          <span className="text-2xl font-bold" style={{ color: sliderColor(parseFloat(avg)) }}>{avg}</span>
          <span className="text-slate-500 text-sm">/10</span>
        </div>

        <div className="flex flex-col gap-8">
          {dims.map((dim) => {
            const val = getVal(dim.key)
            return (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="text-white font-medium">{dim.label}</div>
                    <div className="text-slate-400 text-sm">{dim.description}</div>
                  </div>
                  <span className="text-3xl font-bold ml-4 tabular-nums min-w-[2.5rem] text-right" style={{ color: sliderColor(val) }}>{val}</span>
                </div>
                <input
                  type="range" min={1} max={10} value={val}
                  onChange={(e) => setAnswer(currentKey, { ...vals, [dim.key]: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-cyan-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                  style={{ background: sliderGradient(val) }}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── 6. conditional_checklist ── */
  const renderConditionalChecklist = () => {
    const ans = answers[currentKey] || { triedResources: [], completionLevel: '', stopReasons: [] }
    const showCompletion = ans.triedResources.length > 0 && !ans.triedResources.includes('Starting fresh')
    const showStop = showCompletion && ans.completionLevel && ans.completionLevel !== 'Completed and applied it'
    const update = (patch) => setAnswer(currentKey, { ...ans, ...patch })

    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-white mb-2">{currentQ.question}</h2>
        <p className="text-slate-400 mb-6">{currentQ.subtitle}</p>

        <div className="mb-6">
          <div className="text-slate-300 text-sm font-medium mb-3">Resources you've tried:</div>
          <div className="flex flex-wrap gap-2">
            {(currentQ.resources || []).map((r) => {
              const sel = ans.triedResources.includes(r)
              return (
                <button key={r} onClick={() => {
                  const next = sel ? ans.triedResources.filter((x) => x !== r) : [...ans.triedResources, r]
                  update({ triedResources: next })
                }} className={chipBtn(sel)}>{r}</button>
              )
            })}
          </div>
        </div>

        {showCompletion && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="text-slate-300 text-sm font-medium mb-3">How far did you get?</div>
            <div className="flex flex-col gap-2">
              {(currentQ.completionOptions || []).map((cl) => (
                <button key={cl} onClick={() => update({ completionLevel: cl })}
                  className={`text-left rounded-xl px-4 py-3 text-sm cursor-pointer transition-all duration-200 border ${
                    ans.completionLevel === cl ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/50'
                  }`}>{cl}</button>
              ))}
            </div>
          </motion.div>
        )}

        {showStop && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-slate-300 text-sm font-medium mb-3">What caused you to stop?</div>
            <div className="flex flex-wrap gap-2">
              {(currentQ.stopReasons || []).map((sr) => {
                const sel = (ans.stopReasons || []).includes(sr)
                return (
                  <button key={sr} onClick={() => {
                    const next = sel ? ans.stopReasons.filter((x) => x !== sr) : [...(ans.stopReasons || []), sr]
                    update({ stopReasons: next })
                  }} className={chipBtn(sel)}>{sr}</button>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  /* ── 7. three_textarea_structured ── */
  const renderThreeTextareas = () => {
    const ans = answers[currentKey] || { trying: '', notWorking: '', alreadyTried: '', quickTags: [] }
    const ph = currentQ.placeholders || {}
    const update = (patch) => setAnswer(currentKey, { ...ans, ...patch })

    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-white mb-2">{currentQ.question}</h2>
        <p className="text-slate-400 mb-6">{currentQ.subtitle}</p>

        <div className="flex flex-col gap-5 mb-6">
          {[
            { key: 'trying', label: 'What are you trying to DO?', ph: ph.trying },
            { key: 'notWorking', label: 'What specifically is NOT working?', ph: ph.notWorking },
            { key: 'alreadyTried', label: 'What have you tried?', ph: ph.alreadyTried },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-sm text-slate-300 font-medium mb-1 block">{field.label}</label>
              <div className="relative">
                <textarea rows={2} maxLength={300} placeholder={field.ph || ''}
                  value={ans[field.key]}
                  onChange={(e) => update({ [field.key]: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                />
                <span className="absolute bottom-2 right-3 text-xs text-slate-500">{ans[field.key].length}/300</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(currentQ.quickTags || []).map((tag) => {
            const sel = (ans.quickTags || []).includes(tag)
            return (
              <button key={tag} onClick={() => {
                const next = sel ? ans.quickTags.filter((x) => x !== tag) : [...(ans.quickTags || []), tag]
                update({ quickTags: next })
              }} className={`rounded-xl px-3 py-1.5 text-xs cursor-pointer transition-all duration-200 border ${
                sel ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-cyan-500/50'
              }`}>{tag}</button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── 8. binary_toggle_list ── */
  const renderBinaryToggleList = () => {
    const selected = answers[currentKey] || []

    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-white mb-2">{currentQ.question}</h2>
        <p className="text-slate-400 mb-6">{currentQ.subtitle}</p>
        <div className="flex flex-col gap-3">
          {(currentQ.toggles || []).map((toggle) => {
            const isOn = selected.includes(toggle)
            return (
              <button
                key={toggle}
                onClick={() => {
                  const next = isOn ? selected.filter((x) => x !== toggle) : [...selected, toggle]
                  setAnswer(currentKey, next)
                }}
                className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-left cursor-pointer transition-all duration-200 border ${
                  isOn
                    ? 'border-cyan-500/50 bg-cyan-500/5'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                }`}
              >
                {/* Toggle switch */}
                <div className={`w-11 h-6 rounded-full flex-shrink-0 relative transition-colors duration-200 ${isOn ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                    animate={{ left: isOn ? '22px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </div>
                <span className={`text-sm ${isOn ? 'text-white' : 'text-slate-400'}`}>{toggle}</span>
              </button>
            )
          })}
        </div>
        <p className="text-slate-500 text-xs mt-3">{selected.length} of {(currentQ.toggles || []).length} selected</p>
      </div>
    )
  }

  /* ── 9. card_plus_conditional_input ── */
  const renderCardConditionalInput = () => {
    const ans = answers[currentKey] || { type: '', detail: '' }
    const goals = currentQ.goals || []
    const update = (patch) => setAnswer(currentKey, { ...ans, ...patch })

    const selectedGoal = goals.find((g) => g.label === ans.type)
    const followUp = selectedGoal?.followUp

    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-white mb-2">{currentQ.question}</h2>
        <p className="text-slate-400 mb-6">{currentQ.subtitle}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {goals.map((gt) => {
            const selected = ans.type === gt.label
            return (
              <button key={gt.label} onClick={() => update({ type: gt.label, detail: '' })}
                className={`rounded-xl p-4 text-left cursor-pointer transition-all duration-200 border ${
                  selected ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10' : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5'
                }`}>
                <span className="text-2xl block mb-1">{gt.icon}</span>
                <span className="text-white text-sm font-medium">{gt.label}</span>
              </button>
            )
          })}
        </div>

        {/* Conditional follow-up input */}
        {followUp && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {followUp.type === 'textarea' ? (
              <textarea rows={3} placeholder={followUp.placeholder}
                value={ans.detail}
                onChange={(e) => update({ detail: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
              />
            ) : (
              <input type="text" placeholder={followUp.placeholder}
                value={ans.detail}
                onChange={(e) => update({ detail: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
            )}
          </motion.div>
        )}
      </div>
    )
  }

  /* ── 10. smart_slider_with_calculator ── */
  const renderSmartSlider = () => {
    const ans = answers[currentKey] || { hoursPerWeek: 10, deadline: '3 months' }
    const update = (patch) => setAnswer(currentKey, { ...ans, ...patch })

    const deadlineOptions = currentQ.deadlineOptions || ['1 week', '2 weeks', '1 month', '2 months', '3 months', '6 months', '1 year']
    const weeksMap = currentQ.deadlineWeeksMap || { '1 week': 1, '2 weeks': 2, '1 month': 4, '2 months': 9, '3 months': 13, '6 months': 26, '1 year': 52 }
    const hoursRange = currentQ.hoursRange || [1, 40]

    const deadlineIdx = deadlineOptions.indexOf(ans.deadline)
    const deadlineWeeks = weeksMap[ans.deadline] || 13
    const totalHours = deadlineWeeks * ans.hoursPerWeek

    // Effort rating
    let effortLabel, effortColor
    if (totalHours >= 200) { effortLabel = 'Solid commitment'; effortColor = 'text-green-400' }
    else if (totalHours >= 100) { effortLabel = 'Enough for focused learning'; effortColor = 'text-cyan-400' }
    else if (totalHours >= 50) { effortLabel = 'Tight — stay consistent'; effortColor = 'text-amber-400' }
    else { effortLabel = 'Very tight — every hour counts'; effortColor = 'text-red-400' }

    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-white mb-2">{currentQ.question}</h2>
        <p className="text-slate-400 mb-8">{currentQ.subtitle}</p>

        {/* Hours per week */}
        <div className="mb-8">
          <div className="text-slate-300 text-sm font-medium mb-3">Hours per week</div>
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => update({ hoursPerWeek: Math.max(hoursRange[0], ans.hoursPerWeek - 1) })}
              className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-white text-xl flex items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-all">-</button>
            <span className="text-5xl font-bold text-white tabular-nums min-w-[4rem] text-center">{ans.hoursPerWeek}</span>
            <button onClick={() => update({ hoursPerWeek: Math.min(hoursRange[1], ans.hoursPerWeek + 1) })}
              className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-white text-xl flex items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-all">+</button>
          </div>
        </div>

        {/* Deadline */}
        <div className="mb-8">
          <div className="text-slate-300 text-sm font-medium mb-3">Deadline</div>
          <input type="range" min={0} max={deadlineOptions.length - 1}
            value={deadlineIdx >= 0 ? deadlineIdx : 4}
            onChange={(e) => update({ deadline: deadlineOptions[parseInt(e.target.value)] })}
            className="w-full h-2 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-cyan-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((deadlineIdx >= 0 ? deadlineIdx : 4) / (deadlineOptions.length - 1)) * 100}%, #334155 ${((deadlineIdx >= 0 ? deadlineIdx : 4) / (deadlineOptions.length - 1)) * 100}%, #334155 100%)`,
            }}
          />
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            {deadlineOptions.map((d) => <span key={d}>{d}</span>)}
          </div>
        </div>

        {/* Live calculator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5"
        >
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-bold text-white tabular-nums">{totalHours}</span>
            <span className="text-slate-400">total hours</span>
          </div>
          <p className="text-slate-400 text-sm mb-2">
            {ans.hoursPerWeek} hrs/week &times; {deadlineWeeks} weeks = {totalHours} hours by {ans.deadline}
          </p>
          <div className={`text-sm font-semibold ${effortColor}`}>
            {effortLabel}
          </div>
        </motion.div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════════
     REVIEW PAGE
     ══════════════════════════════════════════════════════════ */
  const renderReview = () => {
    const q1 = answers[questionKeys[0]]
    const q2 = answers[questionKeys[1]] || []
    const q3 = answers[questionKeys[2]] || []
    const q4 = answers[questionKeys[3]]
    const q5 = answers[questionKeys[4]] || {}
    const q6 = answers[questionKeys[5]] || {}
    const q7 = answers[questionKeys[6]] || {}
    const q8 = answers[questionKeys[7]] || []
    const q9 = answers[questionKeys[8]] || {}
    const q10 = answers[questionKeys[9]] || {}
    const q5Dims = questions[questionKeys[4]]?.dimensions || []

    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-white mb-2">Here's what we know about you</h2>
        <p className="text-slate-400 mb-6">Review your profile before we generate your plan</p>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 space-y-5">
          {q1 && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Topic</span>
              <div className="mt-1">
                <span className="inline-block bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 rounded-full px-4 py-1 text-sm font-medium shadow-[0_0_12px_rgba(0,212,255,0.15)]">{q1}</span>
              </div>
            </div>
          )}

          {q2.length > 0 && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Focus Areas</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {q2.map((s) => <span key={s} className="bg-violet-500/15 border border-violet-500/30 text-violet-300 rounded-full px-3 py-1 text-xs">{s}</span>)}
              </div>
            </div>
          )}

          {q3.length > 0 && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Priorities</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {q3.slice(0, 3).map((p, i) => (
                  <span key={p} className={`rounded-full px-3 py-1 text-xs border ${
                    i === 0 ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-slate-700/50 border-slate-600 text-slate-300'
                  }`}>#{i + 1} {p}</span>
                ))}
              </div>
            </div>
          )}

          {q4 && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Level</span>
              <div className="mt-1 text-white font-medium">{q4}</div>
            </div>
          )}

          {q5Dims.length > 0 && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Self Assessment</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {q5Dims.map((dim) => {
                  const val = q5[dim.key] ?? 5
                  return (
                    <div key={dim.key} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-24 truncate">{dim.label}</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(val / 10) * 100}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ backgroundColor: sliderColor(val) }} />
                      </div>
                      <span className="text-xs font-bold tabular-nums" style={{ color: sliderColor(val) }}>{val}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {q8.length > 0 && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Learning Profile</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {q8.slice(0, 4).map((flag) => <span key={flag} className="bg-slate-700/50 border border-slate-600 text-slate-300 rounded-full px-3 py-1 text-xs">{flag.length > 40 ? flag.slice(0, 40) + '...' : flag}</span>)}
                {q8.length > 4 && <span className="text-slate-500 text-xs">+{q8.length - 4} more</span>}
              </div>
            </div>
          )}

          {q9.type && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Goal</span>
              <div className="mt-1 text-white font-medium">{q9.type}</div>
              {q9.detail && <div className="text-slate-400 text-sm">{q9.detail}</div>}
            </div>
          )}

          {q10.hoursPerWeek && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Time Commitment</span>
              <div className="mt-1 text-white font-medium">{q10.hoursPerWeek} hrs/week by {q10.deadline}</div>
            </div>
          )}

          {(q7.trying || q7.notWorking) && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Where You're Stuck</span>
              <div className="mt-1 text-slate-300 text-sm">
                {q7.trying && <span>Trying: {q7.trying.slice(0, 120)}{q7.trying.length > 120 ? '...' : ''}</span>}
                {q7.notWorking && <span className="block">Issue: {q7.notWorking.slice(0, 120)}{q7.notWorking.length > 120 ? '...' : ''}</span>}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button onClick={() => { setDirection(-1); setCurrentQuestion(0) }}
            className="flex-1 px-6 py-4 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:border-slate-500 hover:text-white transition-all cursor-pointer">
            Edit Answers
          </button>
          <button onClick={handleSubmit}
            className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25 hover:scale-[1.02] hover:shadow-cyan-500/40 active:scale-[0.98] transition-all cursor-pointer">
            Generate My Learning Plan &rarr;
          </button>
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════════
     LOADING / ERROR / MAIN RENDER
     ══════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-b-violet-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
          </div>
          <div className="text-center">
            <h2 className="font-heading text-xl font-bold text-white mb-2">Analyzing your resume...</h2>
            <p className="text-slate-400 text-sm">Gemini is crafting personalized questions based on your background</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <h2 className="font-heading text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold cursor-pointer">Try Again</button>
        </div>
      </div>
    )
  }

  if (!questions) return null

  const answerChips = []
  if (currentQuestion > 0 && answers[questionKeys[0]]) answerChips.push(answers[questionKeys[0]])
  if (currentQuestion > 1 && (answers[questionKeys[1]] || []).length > 0) answerChips.push((answers[questionKeys[1]] || []).join(', '))
  if (currentQuestion > 2 && answers[questionKeys[3]]) answerChips.push(answers[questionKeys[3]])

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Resume banner */}
        {resumeData && resumeData.name && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">Resume loaded: {resumeData.name}</p>
              <p className="text-xs text-slate-400 truncate">{resumeData.role} &middot; {(resumeData.skills || []).slice(0, 4).join(', ')}</p>
            </div>
          </motion.div>
        )}

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">{isReview ? 'Review' : `Question ${currentQuestion + 1} of ${totalQuestions}`}</span>
            <span className="text-sm text-slate-500">{Math.round(((currentQuestion + 1) / (totalQuestions + 1)) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full" initial={false}
              animate={{ width: `${((currentQuestion + 1) / (totalQuestions + 1)) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }} />
          </div>
        </div>

        {/* Previous answer chips */}
        {answerChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {answerChips.map((chip, i) => (
              <span key={i} className="bg-slate-800/50 border border-slate-700 text-slate-400 rounded-full px-3 py-1 text-xs">
                {chip.length > 50 ? chip.slice(0, 50) + '...' : chip}
              </span>
            ))}
          </div>
        )}

        {/* Question card */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentQuestion} custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 md:p-8 min-h-[400px]">
            {isReview ? renderReview() : renderByType()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        {!isReview && (
          <div className="flex justify-between mt-6">
            <button onClick={goPrev} disabled={currentQuestion === 0}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer ${
                currentQuestion === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white'
              }`}>&larr; Back</button>
            <button onClick={goNext} disabled={!canAdvance}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer ${
                canAdvance
                  ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/25 hover:scale-[1.03] hover:shadow-cyan-500/40 active:scale-[0.97]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}>{currentQuestion === totalQuestions - 1 ? 'Review' : 'Continue'} &rarr;</button>
          </div>
        )}
      </div>
    </div>
  )
}
