"use client"

import { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Component() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const buttonCanvasRef = useRef<HTMLCanvasElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const isTouchingRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const router = useRouter()
  const navigatedRef = useRef(false)
  const infoSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      setIsMobile(window.innerWidth < 768) // Set mobile breakpoint
    }

    updateCanvasSize()

    let particles: {
      x: number
      y: number
      baseX: number
      baseY: number
      size: number
      color: string
      scatteredColor: string
      life: number
    }[] = []

    let textImageData: ImageData | null = null

    function createTextImage() {
      if (!ctx || !canvas) return 0

      ctx.fillStyle = "white"
      ctx.save()

      // Calculate text size based on screen width with better mobile support
      const baseFontSize = isMobile ? 14 : 20 // Smaller minimum font size on mobile
      const scaleFactor = isMobile ? 0.05 : 0.08 // Reduced scaling factor on mobile
      const maxFontSize = isMobile ? 60 : 120 // Smaller maximum font size on mobile
      let fontSize = baseFontSize + canvas.width * scaleFactor
      fontSize = Math.max(baseFontSize, Math.min(maxFontSize, fontSize)) // Clamp font size

      ctx.font = `bold ${fontSize}px sans-serif`

      // Measure text width to center it
      const text = "The Freedom Layer"
      const textMetrics = ctx.measureText(text)
      const textWidth = textMetrics.width

      // If text is too wide for mobile screens, reduce font size further
      if (isMobile && textWidth > canvas.width * 0.9) {
        fontSize = fontSize * (canvas.width * 0.9 / textWidth)
        ctx.font = `bold ${fontSize}px sans-serif`
      }

      // Center the text
      ctx.translate(canvas.width / 2 - textWidth / 2, canvas.height / 2)
      ctx.textBaseline = "middle"
      ctx.fillText(text, 0, 0)

      ctx.restore()

      textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      return fontSize / 40 // Return scale based on font size
    }

    function createParticle(scale: number) {
      if (!ctx || !canvas || !textImageData) return null

      const data = textImageData.data
      const particleGap = 2

      for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * canvas.width)
        const y = Math.floor(Math.random() * canvas.height)

        if (data[(y * canvas.width + x) * 4 + 3] > 128) {
          return {
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            size: Math.random() * 1 + 0.5,
            color: "white",
            scatteredColor: getRandomGradientColor(),
            life: Math.random() * 100 + 50,
          }
        }
      }

      return null
    }

    function createInitialParticles(scale: number) {
      if (!canvas) return
      // Adjust particle count for mobile devices
      const baseParticleCount = isMobile ? 4000 : 7000 // Reduced count for mobile
      const particleCount = Math.floor(baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)))
      for (let i = 0; i < particleCount; i++) {
        const particle = createParticle(scale)
        if (particle) particles.push(particle)
      }
    }

    let animationFrameId: number

    function animate(scale: number) {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "black"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const { x: mouseX, y: mouseY } = mousePositionRef.current
      const maxDistance = isMobile ? 160 : 240 // Smaller interaction area on mobile

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance && (isTouchingRef.current || !("ontouchstart" in window))) {
          const force = (maxDistance - distance) / maxDistance
          const angle = Math.atan2(dy, dx)
          const moveX = Math.cos(angle) * force * 60
          const moveY = Math.sin(angle) * force * 60
          p.x = p.baseX - moveX
          p.y = p.baseY - moveY
          
          // Use scatteredColor instead of hardcoding white
          // Remove the color change on hover, keep the particles white
          ctx.fillStyle = "white"
          
        } else {
          p.x += (p.baseX - p.x) * 0.1
          p.y += (p.baseY - p.y) * 0.1
          ctx.fillStyle = "white"
        }

        ctx.fillRect(p.x, p.y, p.size, p.size)

        p.life--
        if (p.life <= 0) {
          const newParticle = createParticle(scale)
          if (newParticle) {
            particles[i] = newParticle
          } else {
            particles.splice(i, 1)
            i--
          }
        }
      }

      const baseParticleCount = isMobile ? 4000 : 7000 // Reduced count for mobile
      const targetParticleCount = Math.floor(
        baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)),
      )
      while (particles.length < targetParticleCount) {
        const newParticle = createParticle(scale)
        if (newParticle) particles.push(newParticle)
      }

      animationFrameId = requestAnimationFrame(() => animate(scale))
    }

    const scale = createTextImage()
    createInitialParticles(scale)
    animate(scale)

    const handleResize = () => {
      updateCanvasSize()
      const newScale = createTextImage()
      particles = []
      createInitialParticles(newScale)
    }

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setShowInfo(true)
      }
    }

    const handleMove = (x: number, y: number) => {
      mousePositionRef.current = { x, y }
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault()
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const handleTouchStart = () => {
      isTouchingRef.current = true
    }

    const handleTouchEnd = () => {
      isTouchingRef.current = false
      mousePositionRef.current = { x: 0, y: 0 }
    }

    const handleMouseLeave = () => {
      if (!("ontouchstart" in window)) {
        mousePositionRef.current = { x: 0, y: 0 }
      }
    }

    window.addEventListener("resize", handleResize)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
    canvas.addEventListener("mouseleave", handleMouseLeave)
    canvas.addEventListener("touchstart", handleTouchStart)
    canvas.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("resize", handleResize)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
      canvas.removeEventListener("touchstart", handleTouchStart)
      canvas.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("scroll", handleScroll)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isMobile, router])

  // Add button particle effect
  useEffect(() => {
    const canvas = buttonCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 100
    canvas.height = 100

    const particles: {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      life: number
      color: string
    }[] = []

    // Create particles
    const createParticles = () => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = 14

      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2
        const distance = radius + Math.random() * 10
        const x = centerX + Math.cos(angle) * distance
        const y = centerY + Math.sin(angle) * distance
        
        // Direction toward center
        const speedX = (centerX - x) * 0.01
        const speedY = (centerY - y) * 0.01
        
        particles.push({
          x,
          y,
          size: Math.random() * 1.2 + 0.5,
          speedX,
          speedY,
          life: 30 + Math.random() * 60,
          color: `rgba(255, 255, 255, ${Math.random() * 0.6 + 0.2})`
        })
      }
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Add new particles occasionally
      if (Math.random() < 0.2) {
        createParticles()
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        
        p.x += p.speedX
        p.y += p.speedY
        p.life--

        if (p.life <= 0) {
          particles.splice(i, 1)
          i--
          continue
        }

        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, p.size, p.size)
      }

      animationId = requestAnimationFrame(animate)
    }

    createParticles()
    animate()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  const scrollToInfo = () => {
    setShowInfo(true)
    infoSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function getRandomGradientColor() {
    // Array of blue to purple gradient colors
    const colors = [
      "#60A5FA", // blue-400
      "#3B82F6", // blue-500
      "#2563EB", // blue-600
      "#4F46E5", // indigo-600
      "#6366F1", // indigo-500
      "#8B5CF6", // violet-500
      "#A78BFA", // violet-400
      "#C084FC", // purple-400
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  return (
    <div className="flex flex-col bg-black">
      <div className="relative w-full h-dvh flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full absolute top-0 left-0 touch-none"
          aria-label="Interactive particle effect with The Freedom Layer text"
        />
        
        <div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-24 h-24 flex items-center justify-center cursor-pointer"
          onClick={scrollToInfo}
        >
          <canvas 
            ref={buttonCanvasRef} 
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      </div>
      
      <div 
        ref={infoSectionRef}
        className={`w-full min-h-screen bg-black text-white p-8 transition-opacity duration-500 ${showInfo ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold mb-10 text-white">The Freedom Layer</h2>
          
          <div className="mb-12 backdrop-blur-sm bg-gray-900/30 rounded-xl p-6 border border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-2xl font-semibold mb-4 text-white">Secure Messaging</h3>
            <p className="text-lg mb-4 text-gray-200 leading-relaxed">
              The Freedom Layer is a secure messaging app designed to protect your conversations so that only you and the person you're communicating with can read them. Built with SwiftUI, the app boasts a modern and clean design that makes it easy to navigate while employing advanced end-to-end encryption. When you first launch the app, it automatically generates a unique set of security keys, your private key stays safely on your device, and your public key is uploaded to our secure server. This makes sure that all messages, photos, and files are encrypted on your phone before they're sent.
            </p>
          </div>
          
          <div className="mb-12 backdrop-blur-sm bg-gray-900/30 rounded-xl p-6 border border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-2xl font-semibold mb-4 text-white">User Control & Privacy</h3>
            <p className="text-lg mb-4 text-gray-200 leading-relaxed">
              My goal is to give you complete control over your digital communications. With features like QR code sharing for quick contact setup and user-friendly controls to manage who you talk to, The Freedom Layer not only keeps your data secure but also makes sure you can express yourself freely without worrying about privacy breaches. We believe that everyone deserves a safe space for honest, open communication, whether it's for casual chats or important discussions, this app is dedicated to protecting your privacy and supporting your freedom of speech.
            </p>
          </div>
          
          <div className="mb-12 backdrop-blur-sm bg-gray-900/30 rounded-xl p-6 border border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-2xl font-semibold mb-4 text-white">Our Philosophy</h3>
            <p className="text-lg mb-4 text-gray-200 leading-relaxed">
              By choosing The Freedom Layer, you're opting for a messaging platform that combines cutting-edge security with a simple, accessible interface. Our focus on transparency and state-of-the-art encryption means that your conversations remain yours alone, and reinforcing trust and ensuring peace of mind in today's ever-evolving digital world. Explore our features, learn about our robust security approach, and discover how The Freedom Layer is redefining digital communication for a safer, freer society.
            </p>
          </div>
          
          <div className="pt-8 border-t border-gray-800">
            <div className="flex justify-between items-center">
              <p className="text-xl font-medium text-white">
                Your conversations. Your privacy. Your freedom.
              </p>
              <a 
                href="https://github.com/ib729/The-Freedom-Layer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white hover:scale-110 transition-all duration-300"
                aria-label="GitHub repository"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
