'use client'

import { useState, useRef, useEffect } from 'react'
import { TherapyResponse, TherapySession } from '@/lib/therapy/types'
import { useAuth } from '@/contexts/AuthContext'

interface TherapyInterfaceProps {
  sessionId: string
  onClose: () => void
}

interface CaptionMessage {
  role: 'therapist' | 'user'
  content: string
  timestamp: number // seconds into session
  displayTime: string // formatted as MM:SS
}

export default function TherapyInterface({ sessionId, onClose }: TherapyInterfaceProps) {
  const { userName } = useAuth()
  const [captions, setCaptions] = useState<CaptionMessage[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<'active' | 'closed'>('active')
  const [sessionTime, setSessionTime] = useState(0) // in seconds
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0) // 0-100 for mic level
  const [micTestActive, setMicTestActive] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true) // Mori speaks responses aloud
  const [isProcessing, setIsProcessing] = useState(false) // Show when processing AI response
  
  // Refs for video/audio
  const userVideoRef = useRef<HTMLVideoElement>(null)
  const userStreamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)
  const captionsEndRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const initializationRef = useRef(false) // Prevent multiple initializations
  const processedTranscriptsRef = useRef<Set<string>>(new Set()) // Track processed transcripts to avoid duplicates
  const interimTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Timeout for processing interim transcripts
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Timeout for restarting recognition
  const isRestartingRef = useRef(false) // Prevent rapid restart loops
  const recognitionStateRef = useRef<'idle' | 'starting' | 'listening' | 'stopping'>('idle') // Track actual recognition state
  const lastStateChangeRef = useRef<number>(0) // Track when we last changed the UI state
  const stateChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Debounce state changes
  const lastEndTimeRef = useRef<number>(0) // Track when onend last fired
  const lastStartTimeRef = useRef<number>(0) // Track when onstart last fired
  const rapidCycleCountRef = useRef<number>(0) // Count rapid onend/onstart cycles

  // Handle session status changes for speech recognition
  useEffect(() => {
    if (recognitionRef.current) {
      if (sessionStatus === 'active' && !isMuted) {
        try {
          recognitionRef.current.start()
          setIsRecognizing(true)
        } catch (e) {
          // Recognition already started
        }
      } else {
        recognitionRef.current.stop()
        setIsRecognizing(false)
      }
    }
  }, [sessionStatus, isMuted])

  // Timer
  useEffect(() => {
    if (sessionStatus === 'active') {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [sessionStatus])

  // Auto-scroll captions
  useEffect(() => {
    captionsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [captions])

  // Initialize media function - defined outside useEffect so it can be called from buttons
  const initializeMedia = async () => {
    // Prevent multiple simultaneous initializations
    if (initializationRef.current) {
      console.log('⚠️ Already initializing, skipping...')
      return
    }
    
    initializationRef.current = true
    let stream: MediaStream | null = null
    
    try {
      console.log('Requesting media access...')
      setMicError(null)
        
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia is not supported in this browser')
        }

        // Check current permissions
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
          const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          console.log('Camera permission:', cameraPermission.state)
          console.log('Microphone permission:', microphonePermission.state)
          
          if (cameraPermission.state === 'denied' || microphonePermission.state === 'denied') {
            throw new Error('Camera or microphone permission was denied. Please reset permissions in your browser settings.')
          }
        } catch (permError) {
          console.log('Permission query not supported or error:', permError)
          // Continue anyway - some browsers don't support permission query
        }

        console.log('Calling getUserMedia...')
        // Request camera and microphone access
        // Use exact constraints to force permission prompt
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
          },
        })

        console.log('✅ Media access granted!')
        console.log('Stream:', stream)
        console.log('Stream active:', stream.active)
        console.log('Audio tracks:', stream.getAudioTracks())
        console.log('Video tracks:', stream.getVideoTracks())

        // Check if we actually got audio tracks
        const audioTracks = stream.getAudioTracks()
        if (audioTracks.length === 0) {
          throw new Error('No audio tracks found in stream')
        }

        const audioTrack = audioTracks[0]
        console.log('✅ Audio track found:')
        console.log('  - Label:', audioTrack.label)
        console.log('  - Enabled:', audioTrack.enabled)
        console.log('  - ReadyState:', audioTrack.readyState)
        console.log('  - Muted:', audioTrack.muted)
        console.log('  - Settings:', audioTrack.getSettings())

        userStreamRef.current = stream
        setMicPermissionGranted(true)

        // Set up user video
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream
          userVideoRef.current.play().then(() => {
            console.log('✅ Video playing')
          }).catch((err) => {
            console.error('❌ Video play error:', err)
          })
        }

        // Set up audio level monitoring
        try {
          console.log('Setting up audio monitoring...')
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const analyser = audioContext.createAnalyser()
          const microphone = audioContext.createMediaStreamSource(stream)
          
          analyser.fftSize = 256
          analyser.smoothingTimeConstant = 0.8
          microphone.connect(analyser)
          
          audioContextRef.current = audioContext
          analyserRef.current = analyser
          
          console.log('✅ Audio context created')
          console.log('  - AudioContext state:', audioContext.state)
          console.log('  - Analyser connected')
          
          // Start monitoring audio levels
          const monitorAudio = () => {
            if (!analyserRef.current) return
            
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
            analyserRef.current.getByteFrequencyData(dataArray)
            
            // Calculate average volume
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length
            const level = Math.min(100, (average / 255) * 100)
            
            setAudioLevel(level)
            // Log occasionally for debugging
            if (Math.random() < 0.01) { // Log 1% of the time
              console.log('Audio level:', level.toFixed(1) + '%', 'Average:', average.toFixed(1))
            }
            
            animationFrameRef.current = requestAnimationFrame(monitorAudio)
          }
          
          monitorAudio()
          setMicTestActive(true)
          console.log('✅ Audio monitoring started')
        } catch (error) {
          console.error('❌ Error setting up audio monitoring:', error)
          setMicError('Audio monitoring setup failed: ' + (error as Error).message)
          setMicTestActive(true)
        }

        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
          const recognition = new SpeechRecognition()
          
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'en-US'
          recognition.maxAlternatives = 1
          
          console.log('Speech recognition initialized')

          recognition.onresult = (event: any) => {
            let interimTranscript = ''
            let finalTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript
              if (event.results[i].isFinal) {
                finalTranscript += transcript + ' '
              } else {
                interimTranscript += transcript
              }
            }

            // Log for debugging
            if (interimTranscript) {
              console.log('📝 Interim transcript:', interimTranscript)
            }
            if (finalTranscript.trim()) {
              console.log('✅ Final transcript detected:', finalTranscript.trim())
              // Clear any pending interim timeout since we have a final transcript
              if (interimTimeoutRef.current) {
                clearTimeout(interimTimeoutRef.current)
                interimTimeoutRef.current = null
              }
              processUserSpeech(finalTranscript.trim())
            } else if (interimTranscript.trim().length > 5) {
              // If we have a substantial interim transcript but no final yet,
              // set a timeout to process it if it doesn't become final
              // This handles cases where webkitSpeechRecognition doesn't mark things as final
              if (interimTimeoutRef.current) {
                clearTimeout(interimTimeoutRef.current)
              }
              const interimText = interimTranscript.trim()
              interimTimeoutRef.current = setTimeout(() => {
                // Only process if it's still substantial and hasn't been processed
                if (interimText.length > 5 && !processedTranscriptsRef.current.has(interimText.toLowerCase())) {
                  console.log('⏱️ Processing interim transcript after pause:', interimText)
                  processUserSpeech(interimText)
                }
                interimTimeoutRef.current = null
              }, 2000) // 2 second pause = user stopped speaking
            }
          }

          recognition.onstart = () => {
            const now = Date.now()
            lastStartTimeRef.current = now
            
            console.log('✅ Speech recognition started')
            recognitionStateRef.current = 'listening'
            isRestartingRef.current = false
            
            // Check if this is a rapid cycle (onend fired very recently)
            const isRapidCycle = now - lastEndTimeRef.current < 200
            if (isRapidCycle) {
              rapidCycleCountRef.current++
              console.log(`⚠️ Rapid cycle detected (${rapidCycleCountRef.current}) - keeping UI stable`)
            } else {
              // Reset counter if cycles are normal
              rapidCycleCountRef.current = 0
            }
            
            // Only update UI state if NOT in a rapid cycle (to prevent flickering)
            // But always allow recognition to work normally
            if (!isRapidCycle || rapidCycleCountRef.current <= 2) {
              if (!isRecognizing) {
                setIsRecognizing(true)
                lastStateChangeRef.current = now
              }
            } else {
              console.log('🔇 Rapid cycles - keeping UI state stable but recognition is active')
            }
          }

          recognition.onend = () => {
            const now = Date.now()
            lastEndTimeRef.current = now
            
            console.log('⏸️ Speech recognition ended')
            recognitionStateRef.current = 'idle'
            
            // Check if this is a rapid cycle (onstart fired very recently)
            const isRapidCycle = now - lastStartTimeRef.current < 200
            if (isRapidCycle) {
              rapidCycleCountRef.current++
              console.log(`⚠️ Rapid cycle detected (${rapidCycleCountRef.current}) - keeping UI stable`)
            } else {
              // Reset counter if cycles are normal
              if (rapidCycleCountRef.current > 0) {
                rapidCycleCountRef.current = 0
              }
            }
            
            // Clear any pending restart
            if (restartTimeoutRef.current) {
              clearTimeout(restartTimeoutRef.current)
              restartTimeoutRef.current = null
            }
            
            // Only restart if we're not already restarting and conditions are met
            if (isRestartingRef.current) {
              console.log('⏭️ Already restarting, skipping')
              return
            }
            
            // ALWAYS restart recognition if session is active (don't block this!)
            // Only block UI updates during rapid cycles
            if (sessionStatus === 'active' && !isMuted && recognitionRef.current) {
              isRestartingRef.current = true
              recognitionStateRef.current = 'starting'
              
              // Use a longer delay during rapid cycles to break the cycle
              const delay = isRapidCycle && rapidCycleCountRef.current > 2 ? 1500 : 800
              
              restartTimeoutRef.current = setTimeout(() => {
                if (sessionStatus === 'active' && !isMuted && recognitionRef.current) {
                  try {
                    console.log('🔄 Attempting to restart speech recognition...')
                    recognitionRef.current.start()
                  } catch (e: any) {
                    console.log('⚠️ Recognition restart error:', e.message)
                    recognitionStateRef.current = 'idle'
                    // If it's already running, that's fine - reset the flag
                    if (e.message?.includes('already') || e.message?.includes('started')) {
                      isRestartingRef.current = false
                      recognitionStateRef.current = 'listening'
                      // Only update UI if not in rapid cycle
                      if (!isRapidCycle || rapidCycleCountRef.current <= 2) {
                        setIsRecognizing(true)
                      }
                    } else {
                      // For other errors, wait longer before retrying
                      isRestartingRef.current = false
                      restartTimeoutRef.current = setTimeout(() => {
                        if (recognitionRef.current && sessionStatus === 'active' && !isMuted) {
                          try {
                            recognitionRef.current.start()
                          } catch (e2) {
                            console.error('❌ Failed to restart after error:', e2)
                            recognitionStateRef.current = 'idle'
                          }
                        }
                      }, 2000)
                    }
                  }
                } else {
                  isRestartingRef.current = false
                  recognitionStateRef.current = 'idle'
                }
                restartTimeoutRef.current = null
              }, delay)
            } else {
              console.log('⏸️ Not restarting - status:', sessionStatus, 'muted:', isMuted)
            }
            
            // Only update UI state if NOT in a rapid cycle (to prevent flickering)
            if (isRecognizing && !isRestartingRef.current && (!isRapidCycle || rapidCycleCountRef.current <= 2)) {
              // Wait a bit to see if it restarts (which would indicate a rapid cycle)
              setTimeout(() => {
                // Only set to false if recognition is actually idle and not restarting
                if (recognitionStateRef.current === 'idle' && !isRestartingRef.current) {
                  setIsRecognizing(false)
                  lastStateChangeRef.current = Date.now()
                }
              }, 600)
            }
          }

          recognition.onerror = (event: any) => {
            console.error('❌ Speech recognition error:', event.error, event)
            if (event.error === 'no-speech') {
              // This is normal - recognition continues, don't change state
              console.log('ℹ️ No speech detected (this is normal, continuing to listen)')
              // Don't set isRecognizing to false for no-speech errors
              return
            } else if (event.error === 'audio-capture') {
              console.error('❌ No microphone found or microphone not accessible')
              setIsRecognizing(false)
            } else if (event.error === 'not-allowed') {
              console.error('❌ Microphone permission denied')
              setIsRecognizing(false)
              alert('Please allow microphone access to use speech recognition.')
            } else {
              // For other errors, try to restart (but prevent rapid loops)
              if (!isRestartingRef.current) {
                isRestartingRef.current = true
                setTimeout(() => {
                  if (sessionStatus === 'active' && !isMuted && recognitionRef.current) {
                    try {
                      recognitionRef.current.start()
                    } catch (e) {
                      console.log('Could not restart recognition:', e)
                      isRestartingRef.current = false
                    }
                  } else {
                    isRestartingRef.current = false
                  }
                }, 1000)
              }
            }
          }

          recognitionRef.current = recognition

          // Start recognition after a short delay to ensure everything is set up
          setTimeout(() => {
            if (sessionStatus === 'active' && !isMuted) {
              try {
                console.log('Starting speech recognition...')
                recognition.start()
                setIsRecognizing(true)
              } catch (e) {
                console.error('Error starting recognition:', e)
              }
            }
          }, 500)
        } else {
          console.warn('Speech recognition not supported in this browser')
        }
    } catch (error: any) {
      console.error('❌ Error accessing media devices:', error)
      
      const errorMessage = error.name === 'NotAllowedError' 
        ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
        : error.name === 'NotFoundError'
        ? 'No microphone found. Please connect a microphone and try again.'
        : error.name === 'NotReadableError'
        ? 'Microphone is being used by another application. Please close other apps using the microphone.'
        : `Error accessing microphone: ${error.message || error.name}`
      
      setMicError(errorMessage)
      alert(errorMessage)
    } finally {
      initializationRef.current = false // Reset so it can be called again
    }
  }

  // Initialize media and speech recognition on mount
  useEffect(() => {
    // Only initialize once - use a small delay to avoid React Strict Mode double-mount issues
    console.log('🔄 useEffect running, initializing media...')
    
    // Small delay to ensure component is fully mounted
    const initTimeout = setTimeout(() => {
      initializeMedia()
    }, 100)

    // Cleanup on unmount
    return () => {
      clearTimeout(initTimeout)
      console.log('🧹 Cleaning up media...')
      
      // Clear all timeouts
      if (interimTimeoutRef.current) {
        clearTimeout(interimTimeoutRef.current)
        interimTimeoutRef.current = null
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
        restartTimeoutRef.current = null
      }
      if (stateChangeTimeoutRef.current) {
        clearTimeout(stateChangeTimeoutRef.current)
        stateChangeTimeoutRef.current = null
      }
      
      // Cleanup resources
      initializationRef.current = false // Allow re-initialization if component remounts
      isRestartingRef.current = false
      
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind, track.label)
          track.stop()
        })
        userStreamRef.current = null
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.log('Error stopping recognition:', e)
        }
        recognitionRef.current = null
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
        audioContextRef.current = null
      }
      console.log('✅ Cleanup complete')
    }
  }, []) // Empty dependency array - only run once on mount

  // Initialize session with welcome message
  useEffect(() => {
    const welcomeText = `Hi ${userName || 'there'}, it's so nice to see you today. How are you feeling?`
    const welcomeMessage: CaptionMessage = {
      role: 'therapist',
      content: welcomeText,
      timestamp: 2,
      displayTime: '0:02',
    }
    setCaptions([welcomeMessage])
    setIsListening(true)
    const t = setTimeout(() => {
      if (ttsEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
        speakResponse(welcomeText)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [userName])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const addCaption = (role: 'therapist' | 'user', content: string) => {
    const newCaption: CaptionMessage = {
      role,
      content,
      timestamp: sessionTime,
      displayTime: formatTime(sessionTime),
    }
    setCaptions(prev => [...prev, newCaption])
  }

  // Speak Mori's response aloud using Text-to-Speech
  const speakResponse = (text: string) => {
    if (!ttsEnabled || !text.trim()) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    window.speechSynthesis.cancel() // Cancel any ongoing speech
    
    // Make text more natural for speech - add pauses, fix punctuation for TTS
    const naturalText = text
      .replace(/\. /g, '. ') // Ensure space after periods
      .replace(/\? /g, '? ') // Ensure space after questions
      .replace(/\! /g, '! ') // Ensure space after exclamations
      .replace(/\.\.\./g, ',') // Replace ellipses with commas for natural pause
    
    const utterance = new SpeechSynthesisUtterance(naturalText)
    
    // Natural human voice settings
    utterance.rate = 0.85 // Slower, more thoughtful pace
    utterance.pitch = 0.95 // Slightly lower pitch for warmth
    utterance.volume = 0.9 // Slightly softer
    utterance.lang = 'en-US'
    
    // Wait for voices to load if needed
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      
      // Priority order for natural human voices
      const preferredVoices = [
        'Samantha', // Mac - very natural, warm
        'Karen', // Mac - gentle
        'Victoria', // Mac - clear and warm
        'Alex', // Mac - natural male voice
        'Google UK English Female', // Chrome - natural
        'Google US English Female', // Chrome - natural
        'Microsoft Zira', // Windows - natural
        'Microsoft David', // Windows - natural male
      ]
      
      // Try to find a preferred human voice
      let selectedVoice = null
      for (const preferred of preferredVoices) {
        selectedVoice = voices.find(v => 
          v.name.includes(preferred) || 
          v.name.toLowerCase().includes(preferred.toLowerCase())
        )
        if (selectedVoice) break
      }
      
      // Fallback: find any English voice that sounds natural
      if (!selectedVoice) {
        selectedVoice = voices.find(v => 
          v.lang.startsWith('en') && 
          (v.name.includes('Female') || v.name.includes('Woman') || v.name.includes('Samantha') || v.name.includes('Karen'))
        )
      }
      
      // Final fallback: any English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en'))
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice
        console.log('🎤 Using human voice:', selectedVoice.name)
      } else {
        console.log('⚠️ No preferred voice found, using default')
      }
      
      window.speechSynthesis.speak(utterance)
    }
    
    // Voices might not be loaded yet, especially on first load
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      setVoice()
    } else {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = () => {
        setVoice()
        window.speechSynthesis.onvoiceschanged = null // Remove listener after first use
      }
    }
  }

  const processUserSpeech = async (transcript: string) => {
    const trimmed = transcript.trim()
    if (!trimmed) {
      console.log('⚠️ Empty transcript, skipping')
      return
    }
    
    // Check if we've already processed this transcript (avoid duplicates)
    if (processedTranscriptsRef.current.has(trimmed.toLowerCase())) {
      console.log('⚠️ Already processed this transcript, skipping:', trimmed)
      return
    }
    
    if (sessionStatus !== 'active') {
      console.log('⚠️ Session not active, status:', sessionStatus)
      return
    }

    // Mark as processed
    processedTranscriptsRef.current.add(trimmed.toLowerCase())
    // Clean up old entries (keep last 10)
    if (processedTranscriptsRef.current.size > 10) {
      const entries = Array.from(processedTranscriptsRef.current)
      processedTranscriptsRef.current = new Set(entries.slice(-10))
    }

    // Add user caption immediately
    console.log('🎤 Processing user speech:', trimmed)
    addCaption('user', trimmed)
    setIsProcessing(true)

    try {
      // Backend loads Memory Library and Family Space by session.user_id (account-specific)
      console.log('📡 Calling API with session_id:', sessionId, 'message:', transcript)
      const response = await fetch('/api/therapy/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_message: transcript,
        }),
      })

      console.log('📥 API response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API error response:', errorText)
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ API response data:', data)
      
      if (!data.response) {
        throw new Error('No response in API data')
      }

      const therapyResponse: TherapyResponse = data.response
      const fullResponse = `${therapyResponse.spoken_response} ${therapyResponse.next_question}`.trim()

      console.log('💬 Mori will say:', fullResponse)

      // Add therapist response with slight delay, then speak it
      setTimeout(() => {
        addCaption('therapist', fullResponse)
        speakResponse(fullResponse)
        setIsProcessing(false)
      }, 800)

      // Handle photo
      if (therapyResponse.show_photo && therapyResponse.photo_id) {
        setCurrentPhoto(therapyResponse.photo_id)
      }

      // Handle session actions
      if (therapyResponse.session_action === 'close') {
        setSessionStatus('closed')
        setTimeout(() => {
          onClose()
        }, 5000)
      }
    } catch (error) {
      console.error('❌ Error processing speech:', error)
      setIsProcessing(false)
      addCaption('therapist', "I'm having trouble right now. Let's take a moment.")
    }
  }

  const toggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)

    // Stop/start speech recognition
    if (recognitionRef.current) {
      if (newMutedState) {
        recognitionRef.current.stop()
        setIsRecognizing(false)
      } else {
        try {
          recognitionRef.current.start()
          setIsRecognizing(true)
        } catch (e) {
          // Recognition already started
        }
      }
    }

    // Mute/unmute audio track
    if (userStreamRef.current) {
      userStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState
      })
    }
  }

  const toggleVideo = () => {
    const newVideoState = !isVideoOff
    setIsVideoOff(newVideoState)

    // Enable/disable video track
    if (userStreamRef.current) {
      userStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newVideoState
      })
    }
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Video Call Window - Left Side */}
      <div className="flex-1 flex flex-col bg-secondary/10 overflow-hidden">
        {/* Video Feed */}
        <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
          {/* Mori Video Feed */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              {/* Placeholder for Mori video - in production, this would be actual video stream */}
              <div className="w-96 h-96 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <div className="text-6xl">👩</div>
              </div>
              <div className="bg-black/50 text-white px-4 py-2 rounded-lg inline-block">
                <p className="text-lg font-medium">Mori Therapist</p>
                <p className="text-sm">{formatTime(sessionTime)}</p>
              </div>
            </div>
          </div>

          {/* User Video Thumbnail (bottom left) */}
          <div className="absolute bottom-4 left-4">
            {isVideoOff ? (
              <div className="w-32 h-32 rounded-full bg-secondary/50 flex items-center justify-center border-4 border-white relative overflow-hidden">
                <span className="text-3xl">{userName?.[0]?.toUpperCase() || 'U'}</span>
                {/* Audio level indicator */}
                {micTestActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                    <div 
                      className="h-full bg-green-500 transition-all duration-100"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <video
                  ref={userVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-32 h-32 rounded-full object-cover border-4 border-white"
                />
                {/* Audio level indicator */}
                {micTestActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600 rounded-b-full">
                    <div 
                      className="h-full bg-green-500 transition-all duration-100"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Call Controls (bottom right) */}
          <div className="absolute bottom-4 right-4 flex gap-3">
            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMuted ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                )}
              </svg>
            </button>
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isVideoOff ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isVideoOff ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                )}
              </svg>
            </button>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Photo Display (if shown) */}
        {currentPhoto && (
          <div className="bg-secondary/20 border-t border-secondary/50 p-4">
            <div className="max-w-md mx-auto">
              <img
                src={`/images/${currentPhoto}`}
                alt="Memory photo"
                className="w-full h-48 object-cover rounded-xl shadow-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Conversation Transcript - Right Side */}
      <div className="w-96 bg-white border-l border-secondary/50 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-secondary/50 flex-shrink-0">
          <h3 className="text-2xl font-semibold text-text mb-1">Live Conversation</h3>
          <p className="text-sm text-text/60">Captions from your session</p>
        </div>

        {/* Captions - Scrollable area only */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {captions.map((caption, idx) => (
            <div key={idx} className="flex items-start gap-3">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                caption.role === 'therapist' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {caption.role === 'therapist' ? (
                  <span className="text-lg">🌸</span>
                ) : (
                  <span className="text-lg font-semibold">{userName?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>

              {/* Message */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-text">
                    {caption.role === 'therapist' ? 'Mori' : userName || 'You'}
                  </span>
                  <span className="text-xs text-text/50">{caption.displayTime}</span>
                </div>
                <p className="text-text/80 leading-relaxed">{caption.content}</p>
              </div>
            </div>
          ))}
          <div ref={captionsEndRef} />
        </div>

        {/* Status Bar */}
        <div className="p-4 bg-secondary/30 border-t border-secondary/50 flex-shrink-0">
          {sessionStatus === 'active' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isProcessing ? 'bg-blue-500 animate-pulse' : 
                    isRecognizing ? 'bg-green-500 animate-pulse' : 
                    'bg-gray-400'
                  }`}></div>
                  <span className="text-sm text-text/70">
                    {isProcessing ? 'Mori is thinking...' :
                     isMuted ? 'Microphone muted' : 
                     isRecognizing ? 'Listening...' : 
                     'Ready to listen'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTtsEnabled(!ttsEnabled)}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${ttsEnabled ? 'bg-primary/20 text-primary' : 'text-text/50'}`}
                    title={ttsEnabled ? 'Mori speaks responses (click to turn off)' : 'Mori is silent (click to turn on)'}
                  >
                    {ttsEnabled ? '🔊 Mori speaks' : '🔇 Mori silent'}
                  </button>
                  {!isMuted && !isRecognizing && (
                    <button
                      onClick={() => {
                        if (recognitionRef.current) {
                          try {
                            recognitionRef.current.start()
                            setIsRecognizing(true)
                          } catch (e) {
                            console.error('Error manually starting recognition:', e)
                            alert('Speech recognition may require HTTPS. Please check the browser console for details.')
                          }
                        }
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Start listening
                    </button>
                  )}
                </div>
              </div>
              {/* Mic Level Indicator - Always visible */}
              <div className="bg-white/50 rounded-lg p-3 border border-secondary/50">
                {micError ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">Microphone Error</span>
                    </div>
                    <p className="text-xs text-red-600">{micError}</p>
                    <button
                      onClick={async () => {
                        setMicError(null)
                        await initializeMedia()
                      }}
                      className="text-xs bg-primary text-white px-3 py-1 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Retry Microphone Access
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text">Microphone Level:</span>
                      <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full transition-all duration-100 ${
                            audioLevel > 10 ? 'bg-green-500' : audioLevel > 0 ? 'bg-yellow-400' : 'bg-gray-400'
                          }`}
                          style={{ width: `${Math.max(2, audioLevel)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold w-12 text-right ${
                        audioLevel > 10 ? 'text-green-600' : audioLevel > 0 ? 'text-yellow-600' : 'text-gray-500'
                      }`}>
                        {Math.round(audioLevel)}%
                      </span>
                    </div>
                    <p className="text-xs text-text/60 mt-1">
                      {!micPermissionGranted ? 'Requesting microphone access...' :
                       audioLevel === 0 ? 'No audio detected - speak into your microphone' : 
                       audioLevel < 10 ? 'Low audio level - speak louder' : 
                       'Microphone working ✓'}
                    </p>
                    {micPermissionGranted && audioLevel === 0 && (
                      <button
                        onClick={async () => {
                          console.log('Manual mic test triggered')
                          if (userStreamRef.current) {
                            const tracks = userStreamRef.current.getAudioTracks()
                            console.log('Audio tracks:', tracks)
                            tracks.forEach(track => {
                              console.log(`Track ${track.label}: enabled=${track.enabled}, readyState=${track.readyState}, muted=${track.muted}`)
                            })
                          }
                          await initializeMedia()
                        }}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        Test Microphone
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          {sessionStatus === 'closed' && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-text/70">Session ended</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
