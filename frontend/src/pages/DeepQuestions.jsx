import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/* ─── topic → subtopic map ─── */
const SUBTOPIC_MAP = {
  'Machine Learning': ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Computer Vision', 'Model Deployment', 'MLOps', 'Feature Engineering', 'Time Series', 'Recommendation Systems'],
  'Deep Learning': ['CNNs', 'RNNs/LSTMs', 'Transformers', 'GANs', 'Autoencoders', 'Transfer Learning', 'Model Optimization', 'Neural Architecture Search'],
  'NLP/LLMs': ['Text Classification', 'Named Entity Recognition', 'Sentiment Analysis', 'Language Models', 'Prompt Engineering', 'Fine-Tuning LLMs', 'RAG Systems', 'Embeddings & Vector DBs'],
  'Web Development': ['React/Next.js', 'Vue/Nuxt', 'Angular', 'Node.js/Express', 'REST APIs', 'GraphQL', 'Authentication', 'Performance', 'Testing'],
  'Mobile Dev': ['React Native', 'Flutter', 'Swift/iOS', 'Kotlin/Android', 'App Architecture', 'State Management', 'Push Notifications', 'App Store Deployment'],
  'Game Dev': ['Unity/C#', 'Unreal/C++', 'Godot', 'Game Physics', '2D Game Design', '3D Modeling', 'Multiplayer Networking', 'Shader Programming'],
  'Cloud (AWS)': ['EC2 & Compute', 'S3 & Storage', 'Lambda & Serverless', 'IAM & Security', 'VPC & Networking', 'RDS & Databases', 'CloudFormation/CDK', 'Cost Optimization'],
  'Cloud (GCP)': ['Compute Engine', 'Cloud Functions', 'BigQuery', 'GKE', 'Cloud Storage', 'IAM', 'Pub/Sub', 'Cloud Run'],
  'Cloud (Azure)': ['Azure VMs', 'Azure Functions', 'Cosmos DB', 'AKS', 'Azure DevOps', 'Active Directory', 'Blob Storage', 'Logic Apps'],
  'DevOps/CI-CD': ['GitHub Actions', 'Jenkins', 'Terraform', 'Ansible', 'Monitoring/Observability', 'GitOps', 'Infrastructure as Code', 'Release Strategies'],
  'Kubernetes': ['Pod Management', 'Services & Networking', 'Helm Charts', 'RBAC & Security', 'Autoscaling', 'Service Mesh', 'Operators', 'Troubleshooting'],
  'Docker': ['Dockerfile Best Practices', 'Docker Compose', 'Networking', 'Volume Management', 'Multi-Stage Builds', 'Security Scanning', 'Registry Management'],
  'Data Science': ['Statistical Analysis', 'Data Visualization', 'Pandas/NumPy', 'SQL Mastery', 'A/B Testing', 'Predictive Modeling', 'Data Cleaning', 'Storytelling with Data'],
  'Data Engineering': ['ETL Pipelines', 'Apache Spark', 'Airflow', 'Data Warehousing', 'Streaming (Kafka)', 'Data Modeling', 'dbt', 'Data Quality'],
  'Analytics': ['SQL Analytics', 'Dashboarding', 'Cohort Analysis', 'Funnel Analysis', 'Attribution Modeling', 'Forecasting', 'Data Storytelling'],
  'Cybersecurity': ['Network Security', 'Penetration Testing', 'OWASP Top 10', 'Incident Response', 'Cryptography', 'Identity & Access', 'Cloud Security', 'Compliance/GRC'],
  'Blockchain': ['Smart Contracts', 'Solidity', 'DeFi Protocols', 'NFTs', 'Consensus Mechanisms', 'Web3.js/Ethers', 'Layer 2 Solutions'],
  'Embedded Systems': ['Microcontrollers', 'RTOS', 'Firmware Development', 'IoT Protocols', 'Sensor Integration', 'Low-Power Design', 'Debugging Hardware'],
  'System Design': ['Scalability', 'Load Balancing', 'Caching Strategies', 'Database Sharding', 'Message Queues', 'Microservices', 'API Design', 'CAP Theorem'],
  'Algorithms/DSA': ['Arrays & Strings', 'Trees & Graphs', 'Dynamic Programming', 'Sorting & Searching', 'Greedy Algorithms', 'Backtracking', 'Bit Manipulation', 'System Design Patterns'],
  'Database Design': ['Normalization', 'Indexing', 'Query Optimization', 'NoSQL vs SQL', 'Transactions & ACID', 'Replication', 'Partitioning', 'Schema Migration'],
  'Product Management': ['User Research', 'Roadmapping', 'Metrics/KPIs', 'Prioritization Frameworks', 'Stakeholder Management', 'Agile/Scrum', 'Go-to-Market', 'A/B Testing'],
  'UI/UX Design': ['Design Systems', 'Figma Mastery', 'User Research', 'Wireframing', 'Prototyping', 'Accessibility', 'Interaction Design', 'Usability Testing'],
  'AI Engineering': ['LLM Integration', 'Prompt Engineering', 'Vector Databases', 'RAG Architecture', 'AI Agents', 'Model Serving', 'Evaluation & Testing', 'Fine-Tuning'],
}

const DEFAULT_SUBTOPICS = ['Fundamentals', 'Intermediate Concepts', 'Advanced Topics', 'Real-World Projects', 'Best Practices', 'Tools & Frameworks']

const TOPICS = [
  'Machine Learning', 'Deep Learning', 'NLP/LLMs', 'Web Development', 'Mobile Dev', 'Game Dev',
  'Cloud (AWS)', 'Cloud (GCP)', 'Cloud (Azure)', 'DevOps/CI-CD', 'Kubernetes', 'Docker',
  'Data Science', 'Data Engineering', 'Analytics', 'Cybersecurity', 'Blockchain', 'Embedded Systems',
  'System Design', 'Algorithms/DSA', 'Database Design', 'Product Management', 'UI/UX Design', 'AI Engineering',
]

const LEVELS = [
  { emoji: '\uD83C\uDF31', label: 'Complete Beginner', desc: "I've barely touched this." },
  { emoji: '\uD83D\uDCDA', label: 'Some Exposure', desc: 'Tutorials/articles but never built anything real.' },
  { emoji: '\uD83D\uDD28', label: "I've Built Things", desc: 'Completed projects but still have major gaps.' },
  { emoji: '\u26A1', label: 'Solid Foundation', desc: 'Comfortable, but hit walls on advanced topics.' },
  { emoji: '\uD83C\uDFAF', label: 'Near Expert', desc: 'Know it deeply, filling edge-case gaps.' },
]

const SLIDER_DIMENSIONS = [
  { key: 'theory', label: 'Theory & Concepts', desc: 'Do you understand WHY things work?' },
  { key: 'practical', label: 'Practical Application', desc: 'Can you build without Googling every step?' },
  { key: 'debugging', label: 'Debugging & Problem Solving', desc: 'When things break, can you figure out why?' },
  { key: 'docs', label: 'Reading Documentation', desc: 'Can you learn from official docs?' },
  { key: 'teaching', label: 'Teaching Others', desc: 'Could you explain this to a colleague?' },
]

const TRIED_RESOURCES = [
  'YouTube tutorials', 'Udemy/Coursera courses', 'College courses', 'Books/textbooks',
  'Bootcamp', 'Official documentation', 'Paid mentorship', 'Personal projects', 'Work/Job experience', 'Starting fresh',
]

const COMPLETION_LEVELS = [
  'Just started, lost motivation quickly',
  'Got halfway through but stopped',
  'Finished but didn\'t retain much',
  'Completed and applied it',
]

const STOP_REASONS = [
  'Too boring', 'Too hard', 'Too slow', 'Not practical enough',
  'Life got busy', 'Couldn\'t find good resources', 'Didn\'t know what to build',
]

const WALL_QUICK_TAGS = [
  'I get errors I can\'t fix', 'Understand theory but can\'t build', 'Don\'t know what to learn next',
  'Can\'t find good resources', 'Keep starting over', 'Learn but forget quickly',
]

const LEARNING_STYLES = [
  { emoji: '\uD83C\uDFAC', label: 'Watch & Follow', desc: 'Watch someone do it, then copy step by step' },
  { emoji: '\uD83D\uDCD6', label: 'Read & Understand', desc: 'Text, articles, docs. Think before doing.' },
  { emoji: '\uD83D\uDCBB', label: 'Build First', desc: 'Point me to docs, I learn by breaking things' },
  { emoji: '\uD83C\uDFA7', label: 'Listen & Reflect', desc: 'Podcasts, talks, audio while commuting' },
  { emoji: '\uD83D\uDC65', label: 'Teach & Discuss', desc: 'Only learn when explaining to others' },
]

const ENVIRONMENT_OPTIONS = [
  'Short bursts (< 30 min)', 'Deep focus (2+ hrs)', 'Need deadlines', 'Project-driven',
  'Like gamification', 'Structured curriculum', 'Community/accountability',
]

const STUDY_TIMES = ['Morning', 'Afternoon', 'Evening', 'Night', 'Varies']

const GOAL_TYPES = [
  { emoji: '\uD83C\uDFE2', label: 'Get a Job / Switch Roles' },
  { emoji: '\uD83D\uDE80', label: 'Build a Product' },
  { emoji: '\uD83D\uDCDC', label: 'Pass Certification' },
  { emoji: '\uD83D\uDCBC', label: 'Improve at Current Job' },
  { emoji: '\uD83D\uDD2C', label: 'Academic / Research' },
  { emoji: '\uD83E\uDDE0', label: 'Pure Curiosity' },
]

const DEADLINE_STOPS = ['1 week', '2 weeks', '1 month', '2 months', '3 months', '6 months', '1 year']
const DEADLINE_HOURS_MAP = { '1 week': 1, '2 weeks': 2, '1 month': 4, '2 months': 9, '3 months': 13, '6 months': 26, '1 year': 52 }

const PROFESSIONAL_BG = [
  'Student (High School)', 'Student (University)', 'Recent Graduate', 'Software Engineer',
  'Data Analyst', 'Product Manager', 'Designer', 'Researcher', 'Entrepreneur', 'Career Changer', 'Other',
]

const INDUSTRY_OPTIONS = [
  'Tech/SaaS', 'Finance', 'Healthcare', 'E-commerce', 'Gaming', 'Education', 'Government', 'Consulting', 'Startup', 'Other',
]

const LANGUAGE_OPTIONS = ['English', 'Spanish', 'Hindi', 'Mandarin', 'French', 'Other']

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

/* ─── Component ─── */
export default function DeepQuestions() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('uid') || ''
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [direction, setDirection] = useState(1)
  const [customTopic, setCustomTopic] = useState('')
  const [learningProfile, setLearningProfile] = useState({
    topic: '',
    subtopics: [],
    currentLevel: '',
    selfAssessment: { theory: 5, practical: 5, debugging: 5, docs: 5, teaching: 5 },
    learningHistory: { triedResources: [], completionLevel: '', stopReasons: [] },
    theWall: { trying: '', notWorking: '', alreadyTried: '', quickTags: [] },
    learningStyle: { primary: '', environment: [], studyTime: '' },
    goal: { type: '', deadline: '3 months', hoursPerWeek: 10, targetRole: '', projectDescription: '' },
    context: { professionalBackground: '', industry: '', preferredLanguage: 'English', additionalContext: '' },
  })

  const [resumeData, setResumeData] = useState(null)

  /* Load resume data from MongoDB */
  useEffect(() => {
    if (!userId) return
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/user/${userId}`)
        const user = res.data.data
        if (user) {
          setResumeData(user)
          // Pre-fill context from resume
          setLearningProfile((prev) => ({
            ...prev,
            context: {
              ...prev.context,
              professionalBackground: prev.context.professionalBackground || user.role || '',
              additionalContext: prev.context.additionalContext || `Skills: ${(user.skills || []).join(', ')}. Experience: ${user.experience || ''}. Education: ${user.education || ''}.`,
            },
          }))
        }
      } catch (err) {
        console.error('Failed to load user:', err.message)
      }
    }
    fetchUser()

    // Also load saved learning profile from MongoDB
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/profile/${userId}`)
        if (res.data.data) {
          setLearningProfile((prev) => ({ ...prev, ...res.data.data }))
        }
      } catch { /* no saved profile yet */ }
    }
    fetchProfile()
  }, [userId])

  const updateProfile = useCallback((path, value) => {
    setLearningProfile((prev) => {
      const parts = path.split('.')
      if (parts.length === 1) return { ...prev, [parts[0]]: value }
      const outer = { ...prev[parts[0]], [parts[1]]: value }
      return { ...prev, [parts[0]]: outer }
    })
  }, [])

  const topic = learningProfile.topic

  /* ─── navigation ─── */
  const canAdvance = (() => {
    switch (currentQuestion) {
      case 0: return !!learningProfile.topic
      case 1: return learningProfile.subtopics.length > 0
      case 2: return !!learningProfile.currentLevel
      case 3: return true
      case 4: return learningProfile.learningHistory.triedResources.length > 0
      case 5: return true
      case 6: return !!learningProfile.learningStyle.primary
      case 7: return !!learningProfile.goal.type
      case 8: return !!learningProfile.context.professionalBackground
      case 9: return true
      default: return false
    }
  })()

  const goNext = useCallback(() => {
    if (currentQuestion < 9 && canAdvance) {
      setDirection(1)
      setCurrentQuestion((q) => q + 1)
    }
  }, [currentQuestion, canAdvance])

  const goPrev = useCallback(() => {
    if (currentQuestion > 0) {
      setDirection(-1)
      setCurrentQuestion((q) => q - 1)
    }
  }, [currentQuestion])

  /* keyboard Enter */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && canAdvance) {
        const tag = e.target.tagName
        if (tag === 'TEXTAREA') return
        goNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, canAdvance])

  /* ─── previous answers as chips ─── */
  const answerChips = []
  if (currentQuestion > 0 && learningProfile.topic) answerChips.push(learningProfile.topic)
  if (currentQuestion > 1 && learningProfile.subtopics.length) answerChips.push(learningProfile.subtopics.join(', '))
  if (currentQuestion > 2 && learningProfile.currentLevel) answerChips.push(learningProfile.currentLevel)

  /* ─── total hours calc ─── */
  const deadlineWeeks = DEADLINE_HOURS_MAP[learningProfile.goal.deadline] || 13
  const totalHours = deadlineWeeks * learningProfile.goal.hoursPerWeek
  const effortLabel = totalHours >= 200 ? 'enough' : totalHours >= 80 ? 'tight' : 'very tight'

  /* ─── render question content ─── */
  const renderQuestion = () => {
    switch (currentQuestion) {
      /* ────── Q1: Topic ────── */
      case 0:
        return (
          <div>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">What do you want to master?</h2>
            <p className="text-slate-400 mb-6">Pick the area you're focusing on right now</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => { updateProfile('topic', t); updateProfile('subtopics', []) }}
                  className={`rounded-xl px-4 py-3 text-sm text-left cursor-pointer transition-all duration-200 border ${
                    learningProfile.topic === t
                      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:bg-cyan-500/5'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Don't see yours? Type it here"
              value={customTopic}
              onChange={(e) => {
                setCustomTopic(e.target.value)
                if (e.target.value.trim()) {
                  updateProfile('topic', e.target.value.trim())
                  updateProfile('subtopics', [])
                }
              }}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
          </div>
        )

      /* ────── Q2: Subtopics ────── */
      case 1: {
        const subs = SUBTOPIC_MAP[topic] || DEFAULT_SUBTOPICS
        return (
          <div>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">Which part of {topic} are you focused on?</h2>
            <p className="text-slate-400 mb-6">Select all that apply (up to 4)</p>
            {learningProfile.subtopics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {learningProfile.subtopics.map((s) => (
                  <span key={s} className="bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 rounded-full px-3 py-1 text-sm flex items-center gap-1.5">
                    {s}
                    <button onClick={() => updateProfile('subtopics', learningProfile.subtopics.filter((x) => x !== s))} className="hover:text-red-400 cursor-pointer">&times;</button>
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {subs.map((s) => {
                const selected = learningProfile.subtopics.includes(s)
                return (
                  <button
                    key={s}
                    onClick={() => {
                      if (selected) {
                        updateProfile('subtopics', learningProfile.subtopics.filter((x) => x !== s))
                      } else if (learningProfile.subtopics.length < 4) {
                        updateProfile('subtopics', [...learningProfile.subtopics, s])
                      }
                    }}
                    className={`rounded-xl px-4 py-3 text-sm text-left cursor-pointer transition-all duration-200 border ${
                      selected
                        ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:bg-cyan-500/5'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        )
      }

      /* ────── Q3: Level ────── */
      case 2:
        return (
          <div>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">How honest are you about your level in {topic}?</h2>
            <p className="text-slate-400 mb-6">Don't undersell or oversell — this affects your recommendations</p>
            <div className="flex flex-col gap-4">
              {LEVELS.map((l) => {
                const selected = learningProfile.currentLevel === l.label
                return (
                  <button
                    key={l.label}
                    onClick={() => updateProfile('currentLevel', l.label)}
                    className={`relative w-full text-left rounded-xl p-4 cursor-pointer transition-all duration-200 border ${
                      selected
                        ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{l.emoji}</span>
                      <div>
                        <div className="text-white font-semibold">{l.label}</div>
                        <div className="text-slate-400 text-sm">{l.desc}</div>
                      </div>
                    </div>
                    {selected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )

      /* ────── Q4: Self-assessment sliders ────── */
      case 3:
        return (
          <div>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">Rate yourself honestly on these dimensions</h2>
            <p className="text-slate-400 mb-6">1 = barely know it, 10 = could teach it</p>
            <div className="flex flex-col gap-8">
              {SLIDER_DIMENSIONS.map((dim) => {
                const val = learningProfile.selfAssessment[dim.key]
                return (
                  <div key={dim.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <div className="text-white font-medium">{dim.label}</div>
                        <div className="text-slate-400 text-sm">{dim.desc}</div>
                      </div>
                      <span className="text-3xl font-bold ml-4 tabular-nums min-w-[2.5rem] text-right" style={{ color: sliderColor(val) }}>{val}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={val}
                      onChange={(e) => updateProfile('selfAssessment', { ...learningProfile.selfAssessment, [dim.key]: parseInt(e.target.value) })}
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

      /* ────── Q5: Learning History ────── */
      case 4: {
        const hist = learningProfile.learningHistory
        const showCompletion = hist.triedResources.length > 0 && !hist.triedResources.includes('Starting fresh')
        const showStop = showCompletion && hist.completionLevel && hist.completionLevel !== 'Completed and applied it'
        return (
          <div>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">What have you already tried to learn {topic}?</h2>
            <p className="text-slate-400 mb-6">This prevents recommending what didn't work</p>

            <div className="mb-6">
              <div className="text-slate-300 text-sm font-medium mb-3">Resources you've tried:</div>
              <div className="flex flex-wrap gap-2">
                {TRIED_RESOURCES.map((r) => {
                  const selected = hist.triedResources.includes(r)
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        const next = selected ? hist.triedResources.filter((x) => x !== r) : [...hist.triedResources, r]
                        updateProfile('learningHistory', { ...hist, triedResources: next })
                      }}
                      className={`rounded-xl px-4 py-2 text-sm cursor-pointer transition-all duration-200 border ${
                        selected
                          ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500 text-white'
                          : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/50'
                      }`}
                    >
                      {r}
                    </button>
                  )
                })}
              </div>
            </div>

            {showCompletion && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="text-slate-300 text-sm font-medium mb-3">How far did you get?</div>
                <div className="flex flex-col gap-2">
                  {COMPLETION_LEVELS.map((cl) => (
                    <button
                      key={cl}
                      onClick={() => updateProfile('learningHistory', { ...hist, completionLevel: cl })}
                      className={`text-left rounded-xl px-4 py-3 text-sm cursor-pointer transition-all duration-200 border ${
                        hist.completionLevel === cl
                          ? 'border-cyan-500 bg-cyan-500/10 text-white'
                          : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/50'
                      }`}
                    >
                      {cl}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {showStop && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-slate-300 text-sm font-medium mb-3">What caused you to stop?</div>
                <div className="flex flex-wrap gap-2">
                  {STOP_REASONS.map((sr) => {
                    const sel = hist.stopReasons.includes(sr)
                    return (
                      <button
                        key={sr}
                        onClick={() => {
                          const next = sel ? hist.stopReasons.filter((x) => x !== sr) : [...hist.stopReasons, sr]
                          updateProfile('learningHistory', { ...hist, stopReasons: next })
                        }}
                        className={`rounded-xl px-4 py-2 text-sm cursor-pointer transition-all duration-200 border ${
                          sel
                            ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500 text-white'
                            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/50'
                        }`}
                      >
                        {sr}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )
      }

      /* ────── Q6: The Wall ────── */
      case 5: {
        const wall = learningProfile.theWall
        const anyEmpty = !wall.trying.trim() && !wall.notWorking.trim() && !wall.alreadyTried.trim()
        return (
          <div>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">Tell me exactly where you're stuck</h2>
            <p className="text-slate-400 mb-6">The more specific, the better your diagnosis</p>

            <div className="flex flex-col gap-5 mb-6">
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">What are you trying to DO?</label>
                <div className="relative">
                  <textarea
                    rows={2}
                    maxLength={300}
                    placeholder="e.g., Build a REST API with auth in Node.js"
                    value={wall.trying}
                    onChange={(e) => updateProfile('theWall', { ...wall, trying: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-slate-500">{wall.trying.length}/300</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">What specifically is NOT working?</label>
                <div className="relative">
                  <textarea
                    rows={2}
                    maxLength={300}
                    placeholder="e.g., JWT tokens confuse me, auth keeps failing"
                    value={wall.notWorking}
                    onChange={(e) => updateProfile('theWall', { ...wall, notWorking: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-slate-500">{wall.notWorking.length}/300</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">What have you tried?</label>
                <div className="relative">
                  <textarea
                    rows={2}
                    maxLength={300}
                    placeholder="e.g., Watched 3 YouTube videos but they all differ"
                    value={wall.alreadyTried}
                    onChange={(e) => updateProfile('theWall', { ...wall, alreadyTried: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-slate-500">{wall.alreadyTried.length}/300</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {WALL_QUICK_TAGS.map((tag) => {
                const sel = wall.quickTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      const nextTags = sel ? wall.quickTags.filter((x) => x !== tag) : [...wall.quickTags, tag]
                      let updated = { ...wall, quickTags: nextTags }
                      if (!sel) {
                        if (tag === 'I get errors I can\'t fix') updated.notWorking = updated.notWorking || tag
                        else if (tag === 'Understand theory but can\'t build') updated.trying = updated.trying || tag
                        else if (tag === 'Don\'t know what to learn next') updated.trying = updated.trying || tag
                        else if (tag === 'Can\'t find good resources') updated.alreadyTried = updated.alreadyTried || tag
                        else if (tag === 'Keep starting over') updated.notWorking = updated.notWorking || tag
                        else if (tag === 'Learn but forget quickly') updated.notWorking = updated.notWorking || tag
                      }
                      updateProfile('theWall', updated)
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs cursor-pointer transition-all duration-200 border ${
                      sel
                        ? 'bg-cyan-500/20 border-cyan-500 text-white'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-cyan-500/50'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>

            {anyEmpty && wall.quickTags.length === 0 && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                More detail = better roadmap
              </div>
            )}
          </div>
        )
      }

      /* ────── Q7: Learning Style ────── */
      case 6: {
        const ls = learningProfile.learningStyle
        return (
          <div>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">How do you actually learn best?</h2>
            <p className="text-slate-400 mb-6">Not how you think you should — how you actually retain info</p>

            <div className="flex flex-col gap-3 mb-8">
              {LEARNING_STYLES.map((s) => {
                const selected = ls.primary === s.label
                return (
                  <button
                    key={s.label}
                    onClick={() => updateProfile('learningStyle', { ...ls, primary: s.label })}
                    className={`w-full text-left rounded-xl p-4 cursor-pointer transition-all duration-200 border ${
                      selected
                        ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{s.emoji}</span>
                      <div>
                        <div className="text-white font-semibold">{s.label}</div>
                        <div className="text-slate-400 text-sm">{s.desc}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mb-8">
              <div className="text-slate-300 text-sm font-medium mb-3">Your learning environment:</div>
              <div className="flex flex-wrap gap-2">
                {ENVIRONMENT_OPTIONS.map((opt) => {
                  const sel = ls.environment.includes(opt)
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        const next = sel ? ls.environment.filter((x) => x !== opt) : [...ls.environment, opt]
                        updateProfile('learningStyle', { ...ls, environment: next })
                      }}
                      className={`rounded-xl px-4 py-2 text-sm cursor-pointer transition-all duration-200 border ${
                        sel ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/50'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="text-slate-300 text-sm font-medium mb-3">Best study time:</div>
              <div className="flex flex-wrap gap-2">
                {STUDY_TIMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => updateProfile('learningStyle', { ...ls, studyTime: t })}
                    className={`rounded-xl px-5 py-2 text-sm cursor-pointer transition-all duration-200 border ${
                      ls.studyTime === t ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      }

      /* ────── Q8: Goal & Stakes ────── */
      case 7: {
        const g = learningProfile.goal
        const showDeadline = g.type && g.type !== 'Pure Curiosity'
        const deadlineIdx = DEADLINE_STOPS.indexOf(g.deadline)
        return (
          <div>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">What's your end goal with {topic}?</h2>
            <p className="text-slate-400 mb-6">Your 'why' helps us prioritize</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {GOAL_TYPES.map((gt) => {
                const selected = g.type === gt.label
                return (
                  <button
                    key={gt.label}
                    onClick={() => updateProfile('goal', { ...g, type: gt.label })}
                    className={`rounded-xl p-4 text-left cursor-pointer transition-all duration-200 border ${
                      selected
                        ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{gt.emoji}</span>
                    <span className="text-white text-sm font-medium">{gt.label}</span>
                  </button>
                )
              })}
            </div>

            {showDeadline && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="text-slate-300 text-sm font-medium mb-3">Deadline:</div>
                <input
                  type="range"
                  min={0}
                  max={DEADLINE_STOPS.length - 1}
                  value={deadlineIdx >= 0 ? deadlineIdx : 4}
                  onChange={(e) => updateProfile('goal', { ...g, deadline: DEADLINE_STOPS[parseInt(e.target.value)] })}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-cyan-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((deadlineIdx >= 0 ? deadlineIdx : 4) / (DEADLINE_STOPS.length - 1)) * 100}%, #334155 ${((deadlineIdx >= 0 ? deadlineIdx : 4) / (DEADLINE_STOPS.length - 1)) * 100}%, #334155 100%)`,
                  }}
                />
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  {DEADLINE_STOPS.map((d) => <span key={d}>{d}</span>)}
                </div>
              </motion.div>
            )}

            {showDeadline && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="text-slate-300 text-sm font-medium mb-3">Hours per week:</div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => updateProfile('goal', { ...g, hoursPerWeek: Math.max(1, g.hoursPerWeek - 1) })}
                    className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-white text-xl flex items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-all"
                  >
                    -
                  </button>
                  <span className="text-4xl font-bold text-white tabular-nums min-w-[3rem] text-center">{g.hoursPerWeek}</span>
                  <button
                    onClick={() => updateProfile('goal', { ...g, hoursPerWeek: Math.min(40, g.hoursPerWeek + 1) })}
                    className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-white text-xl flex items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-all"
                  >
                    +
                  </button>
                </div>
                <p className="text-slate-400 text-sm mt-2">
                  At {g.hoursPerWeek} hrs/week, that's <span className="text-cyan-400 font-semibold">{totalHours} total hours</span> by {g.deadline}. That's <span className={effortLabel === 'enough' ? 'text-green-400' : effortLabel === 'tight' ? 'text-amber-400' : 'text-red-400'}>{effortLabel}</span>.
                </p>
              </motion.div>
            )}

            {g.type === 'Get a Job / Switch Roles' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                <label className="text-sm text-slate-300 font-medium mb-1 block">Target role?</label>
                <input
                  type="text"
                  placeholder="e.g., Senior ML Engineer at FAANG"
                  value={g.targetRole}
                  onChange={(e) => updateProfile('goal', { ...g, targetRole: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </motion.div>
            )}

            {g.type === 'Build a Product' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                <label className="text-sm text-slate-300 font-medium mb-1 block">What do you want to build?</label>
                <textarea
                  rows={2}
                  placeholder="Describe your project idea..."
                  value={g.projectDescription}
                  onChange={(e) => updateProfile('goal', { ...g, projectDescription: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                />
              </motion.div>
            )}
          </div>
        )
      }

      /* ────── Q9: Context ────── */
      case 8: {
        const ctx = learningProfile.context
        return (
          <div>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">Last few things about you</h2>
            <p className="text-slate-400 mb-6">So your coach can speak your language</p>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">Professional background</label>
                <select
                  value={ctx.professionalBackground}
                  onChange={(e) => updateProfile('context', { ...ctx, professionalBackground: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                >
                  <option value="" className="bg-slate-900">Select...</option>
                  {PROFESSIONAL_BG.map((bg) => (
                    <option key={bg} value={bg} className="bg-slate-900">{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">Industry</label>
                <select
                  value={ctx.industry}
                  onChange={(e) => updateProfile('context', { ...ctx, industry: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                >
                  <option value="" className="bg-slate-900">Select...</option>
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <option key={ind} value={ind} className="bg-slate-900">{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">Language preference</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => updateProfile('context', { ...ctx, preferredLanguage: lang })}
                      className={`rounded-xl px-5 py-2 text-sm cursor-pointer transition-all duration-200 border ${
                        ctx.preferredLanguage === lang ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/50'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">Anything else?</label>
                <div className="relative">
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Anything the AI coach should know about you..."
                    value={ctx.additionalContext}
                    onChange={(e) => updateProfile('context', { ...ctx, additionalContext: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-slate-500">{ctx.additionalContext.length}/500</span>
                </div>
              </div>
            </div>
          </div>
        )
      }

      /* ────── Q10: Review ────── */
      case 9: {
        const sa = learningProfile.selfAssessment
        return (
          <div>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">Here's what we know about you</h2>
            <p className="text-slate-400 mb-6">Review your profile before we generate your plan</p>

            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 space-y-5">
              {/* Topic */}
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Topic</span>
                <div className="mt-1">
                  <span className="inline-block bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 rounded-full px-4 py-1 text-sm font-medium shadow-[0_0_12px_rgba(0,212,255,0.15)]">
                    {learningProfile.topic}
                  </span>
                </div>
              </div>

              {/* Subtopics */}
              {learningProfile.subtopics.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Focus Areas</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {learningProfile.subtopics.map((s) => (
                      <span key={s} className="bg-violet-500/15 border border-violet-500/30 text-violet-300 rounded-full px-3 py-1 text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Level */}
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Level</span>
                <div className="mt-1 text-white font-medium">{learningProfile.currentLevel}</div>
              </div>

              {/* Self-assessment mini bars */}
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Self Assessment</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {SLIDER_DIMENSIONS.map((dim) => (
                    <div key={dim.key} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-24 truncate">{dim.label}</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(sa[dim.key] / 10) * 100}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: sliderColor(sa[dim.key]) }}
                        />
                      </div>
                      <span className="text-xs font-bold tabular-nums" style={{ color: sliderColor(sa[dim.key]) }}>{sa[dim.key]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goal + deadline */}
              {learningProfile.goal.type && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Goal</span>
                  <div className="mt-1 text-white font-medium">{learningProfile.goal.type}</div>
                  {learningProfile.goal.type !== 'Pure Curiosity' && (
                    <div className="text-slate-400 text-sm">Deadline: {learningProfile.goal.deadline} &middot; {learningProfile.goal.hoursPerWeek} hrs/week ({totalHours} total hrs)</div>
                  )}
                </div>
              )}

              {/* The Wall */}
              {(learningProfile.theWall.trying || learningProfile.theWall.notWorking) && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Where You're Stuck</span>
                  <div className="mt-1 text-slate-300 text-sm line-clamp-3">
                    {learningProfile.theWall.trying && <span>Trying: {learningProfile.theWall.trying.slice(0, 120)}{learningProfile.theWall.trying.length > 120 ? '...' : ''}</span>}
                    {learningProfile.theWall.notWorking && <span className="block">Issue: {learningProfile.theWall.notWorking.slice(0, 120)}{learningProfile.theWall.notWorking.length > 120 ? '...' : ''}</span>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={() => { setDirection(-1); setCurrentQuestion(0) }}
                className="flex-1 px-6 py-4 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:border-slate-500 hover:text-white transition-all cursor-pointer"
              >
                Edit Answers
              </button>
              <button
                onClick={async () => {
                  if (userId) {
                    try {
                      await axios.post(`${API_BASE}/api/save-profile`, {
                        user_id: userId,
                        ...learningProfile,
                      })
                    } catch (err) {
                      console.error('Failed to save profile:', err.message)
                    }
                  }
                  navigate(`/need?uid=${userId}`)
                }}
                className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25 hover:scale-[1.02] hover:shadow-cyan-500/40 active:scale-[0.98] transition-all cursor-pointer"
              >
                Generate My Learning Plan &rarr;
              </button>
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        {/* ─── Resume banner ─── */}
        {resumeData && resumeData.name && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">Resume loaded: {resumeData.name}</p>
              <p className="text-xs text-slate-400 truncate">{resumeData.role} &middot; {(resumeData.skills || []).slice(0, 4).join(', ')}</p>
            </div>
          </motion.div>
        )}

        {/* ─── Progress bar ─── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Question {currentQuestion + 1} of 10</span>
            <span className="text-sm text-slate-500">{Math.round(((currentQuestion + 1) / 10) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
              initial={false}
              animate={{ width: `${((currentQuestion + 1) / 10) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* ─── Previous answer chips ─── */}
        {answerChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {answerChips.map((chip, i) => (
              <span key={i} className="bg-slate-800/50 border border-slate-700 text-slate-400 rounded-full px-3 py-1 text-xs">
                {chip.length > 50 ? chip.slice(0, 50) + '...' : chip}
              </span>
            ))}
          </div>
        )}

        {/* ─── Question card ─── */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 md:p-8 min-h-[400px]"
            style={{
              // dynamic enter/exit direction based on navigation
            }}
          >
            {renderQuestion()}
          </motion.div>
        </AnimatePresence>

        {/* ─── Navigation buttons ─── */}
        {currentQuestion < 9 && (
          <div className="flex justify-between mt-6">
            <button
              onClick={goPrev}
              disabled={currentQuestion === 0}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer ${
                currentQuestion === 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white'
              }`}
            >
              &larr; Back
            </button>
            <button
              onClick={goNext}
              disabled={!canAdvance}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer ${
                canAdvance
                  ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/25 hover:scale-[1.03] hover:shadow-cyan-500/40 active:scale-[0.97]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Continue &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
