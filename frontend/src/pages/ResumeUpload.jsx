import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'

const steps = ['Profile', 'Resume', 'Questions', 'Goal']

const processingTexts = [
  'Reading resume...',
  'Extracting your skills...',
  'Understanding your background...',
  'Building your profile...',
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

export default function ResumeUpload() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('idle') // idle | processing | done
  const [processingIndex, setProcessingIndex] = useState(0)
  const [resumeData, setResumeData] = useState(null)

  // Cycle processing texts
  useEffect(() => {
    if (status !== 'processing') return
    const interval = setInterval(() => {
      setProcessingIndex((prev) => (prev + 1) % processingTexts.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [status])

  const processResume = useCallback(
    async (file) => {
      setStatus('processing')
      setProcessingIndex(0)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const response = await axios.post(`${apiUrl}/api/extract-resume`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        })

        const result = response.data
        const extracted = result.data || result
        setResumeData(extracted)
        localStorage.setItem('resumeData', JSON.stringify(extracted))
        if (result.user_id) {
          localStorage.setItem('user_id', result.user_id)
        }
        setStatus('done')
        toast.success('Resume extracted successfully!')
      } catch (err) {
        console.error('Resume extraction failed:', err.message)
        toast.error('Resume extraction failed. Please try again.')
        setStatus('idle')
      }
    },
    []
  )

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        processResume(acceptedFiles[0])
      }
    },
    [processResume]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: status === 'processing',
  })

  const handleContinue = () => {
    navigate('/questions')
  }

  return (
    <div className="min-h-screen px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <ProgressBar currentStep={1} />

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-heading text-3xl font-bold text-white">Upload Your Resume</h1>
          <div className="h-1 w-16 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-full mt-2" />
        </motion.div>

        {/* Upload zone */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {status === 'idle' && (
            <div
              {...getRootProps()}
              className={`w-full max-w-xl mx-auto py-20 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-center gap-4 ${
                isDragActive
                  ? 'border-2 border-cyan-500 bg-cyan-500/5 shadow-lg shadow-cyan-500/10'
                  : 'border-2 border-dashed border-slate-600 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-900/50'
              }`}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-5xl"
              >
                &#128196;
              </motion.div>
              <p className="text-lg text-slate-300">Drag & drop your PDF resume here</p>
              <p className="text-sm text-slate-500">or click to browse files</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="w-full max-w-xl mx-auto py-20 rounded-2xl border-2 border-slate-700 bg-slate-900/30 flex flex-col items-center gap-6">
              {/* Spinning ring */}
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              {/* Cycling text */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={processingIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg text-slate-300"
                >
                  {processingTexts[processingIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          )}

          {status === 'done' && resumeData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xl mx-auto"
            >
              {/* Green checkmark */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              </div>

              {/* Profile card */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{resumeData.name}</h3>
                <p className="text-slate-400 mb-4">{resumeData.role}</p>

                {/* Skills */}
                <div className="mb-4">
                  <p className="text-sm text-slate-500 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills?.map((skill) => (
                      <span
                        key={skill}
                        className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full px-3 py-1 text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                {resumeData.experience && (
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-1">Experience</p>
                    <p className="text-slate-300 text-sm">{resumeData.experience}</p>
                  </div>
                )}

                {/* Education */}
                {resumeData.education && (
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-1">Education</p>
                    <p className="text-slate-300 text-sm">{resumeData.education}</p>
                  </div>
                )}

                {/* Certifications */}
                {resumeData.certifications?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-1">Certifications</p>
                    <p className="text-slate-300 text-sm">{resumeData.certifications.join(', ')}</p>
                  </div>
                )}

                {/* Projects */}
                {resumeData.projects?.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Projects</p>
                    <p className="text-slate-300 text-sm">{resumeData.projects.join(', ')}</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => navigate('/details')}
                  className="px-6 py-3 rounded-xl border border-slate-600 text-slate-300 font-medium hover:bg-slate-800 transition-all cursor-pointer"
                >
                  &#9999;&#65039; Edit
                </button>
                <button
                  onClick={handleContinue}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:scale-[1.03] hover:shadow-cyan-500/40 active:scale-[0.97] transition-all cursor-pointer"
                >
                  Looks Good! Continue &rarr;
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Skip link */}
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8"
          >
            <button
              onClick={() => navigate('/questions')}
              className="text-slate-500 hover:text-slate-300 text-sm underline underline-offset-4 transition-colors cursor-pointer"
            >
              Skip — fill manually &rarr;
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
