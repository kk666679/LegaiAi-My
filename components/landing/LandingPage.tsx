'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Zap,
  Shield,
  Users,
  ChevronDown,
  X,
  Scale3D,
  Landmark,
  Briefcase,
  Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { HeroDemo } from './HeroDemo'
import { AgentSwarm } from './AgentSwarm'
import { ShimmerHero } from './ShimmerHero'

type PillarKey = 'Efficiency Gains' | 'Judicial Independence' | 'Access to Justice'

const pillarDetails: Record<
  PillarKey,
  { icon: typeof Zap; color: string; title: PillarKey; description: string; content: React.ReactNode }
> = {
  'Efficiency Gains': {
    icon: Zap,
    color: '#00c8ff',
    title: 'Efficiency Gains',
    description:
      'Automating routine legal tasks, document analysis, and case research to accelerate justice delivery.',
    content: (
      <>
        <p>
          <strong className="text-cyan-400">Accelerating Justice Delivery</strong>
        </p>
        <p className="mt-3">Routine legal tasks consume significant judicial resources. Multi-agent systems can:</p>
        <ul className="space-y-2 list-disc list-inside mt-3">
          <li>Analyze case law and precedents in milliseconds</li>
          <li>Prepare legal briefs and document summaries</li>
          <li>Identify relevant statutes and regulations automatically</li>
          <li>Flag inconsistencies in legal arguments</li>
          <li>Reduce case processing time by up to 60%</li>
        </ul>
        <p className="mt-3 text-sm text-gray-500">This translates to faster resolution for litigants and reduced backlog in courts.</p>
      </>
    ),
  },
  'Judicial Independence': {
    icon: Shield,
    color: '#a855f7',
    title: 'Judicial Independence',
    description:
      'Ensuring AI augments—not replaces—human judgment, preserving judicial independence.',
    content: (
      <>
        <p>
          <strong className="text-purple-400">Preserving Human Decision-Making</strong>
        </p>
        <p className="mt-3">AI augments judicial authority—it never replaces it. Core principles:</p>
        <ul className="space-y-2 list-disc list-inside mt-3">
          <li>Judges retain full discretion over final decisions</li>
          <li>AI recommendations are transparent and explainable</li>
          <li>All decisions can be appealed and reviewed</li>
          <li>Constitutional protections remain inviolable</li>
          <li>Regular audits ensure systems remain neutral</li>
        </ul>
        <p className="mt-3 text-sm text-gray-500">The independence of the judiciary is not negotiable—technology serves that independence.</p>
      </>
    ),
  },
  'Access to Justice': {
    icon: Users,
    color: '#00ffb4',
    title: 'Access to Justice',
    description:
      'Democratizing legal resources for every Malaysian—regardless of geography or income.',
    content: (
      <>
        <p>
          <strong className="text-teal-400">Democratizing Legal Services</strong>
        </p>
        <p className="mt-3">Geographic and economic barriers to justice can be overcome through AI:</p>
        <ul className="space-y-2 list-disc list-inside mt-3">
          <li>24/7 availability of legal information and guidance</li>
          <li>Reduced need for expensive legal consultations</li>
          <li>Legal support for underserved rural communities</li>
          <li>Multilingual support for all Malaysian languages</li>
          <li>Affordable preliminary legal analysis for all citizens</li>
        </ul>
        <p className="mt-3 text-sm text-gray-500">Every Malaysian deserves equal access to the law and to justice.</p>
      </>
    ),
  },
}

function HexScene() {
  const sceneRef = useRef<HTMLDivElement>(null)

  const hexConfigs = [
    { size: 120, x: '10%', y: '15%', rx: 10, ry: 20, delay: 0 },
    { size: 90, x: '80%', y: '10%', rx: -15, ry: 30, delay: -2 },
    { size: 70, x: '70%', y: '55%', rx: 20, ry: -10, delay: -4 },
    { size: 100, x: '15%', y: '65%', rx: -5, ry: 15, delay: -6 },
    { size: 60, x: '50%', y: '80%', rx: 25, ry: -20, delay: -3 },
    { size: 80, x: '90%', y: '75%', rx: -10, ry: 25, delay: -1 },
  ]

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    scene.innerHTML = ''

    hexConfigs.forEach(cfg => {
      const hex = document.createElement('div')
      hex.className = 'hexagon-3d'
      hex.style.cssText = `width:${cfg.size}px;height:${cfg.size}px;left:${cfg.x};top:${cfg.y};--rx:${cfg.rx}deg;--ry:${cfg.ry}deg;animation-delay:${cfg.delay}s;`

      const face = document.createElement('div')
      face.className = 'hex-face'

      const glow = document.createElement('div')
      glow.className = 'hex-face hex-face-glow'
      glow.style.animation = `pulseGlow 4s ease-in-out infinite ${cfg.delay}s`

      hex.appendChild(face)
      hex.appendChild(glow)
      scene.appendChild(hex)
    })

    let raf = 0
    let targetX = 0
    let targetY = 0

    const apply = () => {
      raf = 0
      // Uses cached targets to avoid per-mouse-event work.
      scene.style.transform = `rotateY(${targetX}deg) rotateX(${-targetY}deg)`
    }

    const handleMouseMove = (e: MouseEvent) => {
      const mx = (e.clientX / window.innerWidth - 0.5) * 20
      const my = (e.clientY / window.innerHeight - 0.5) * 20
      targetX = mx
      targetY = my
      if (!raf) raf = window.requestAnimationFrame(apply)
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  return <div ref={sceneRef} className="hex-scene fixed inset-0 pointer-events-none" />
}

export default function LandingPage() {
  const [visionOpen, setVisionOpen] = useState(false)
  const [paperOpen, setPaperOpen] = useState(false)
  const [pillarOpen, setPillarOpen] = useState<PillarKey | ''>('')

  const pillars = [pillarDetails['Efficiency Gains'], pillarDetails['Judicial Independence'], pillarDetails['Access to Justice']]

  return (
    <div id="app" className="min-h-screen w-full overflow-auto bg-black font-body [&>*]:animate-slide-up">
      {/* Ambient Orbs */}
      <div className="orb fixed w-[400px] h-[400px] bg-cyan-500/8 blur-3xl top-10 -left-5" />
      <div className="orb fixed w-[350px] h-[350px] bg-purple-500/7 blur-3xl top-1/2 -right-5 [animation-delay:-4s]" />
      <div className="orb fixed w-[300px] h-[300px] bg-cyan-500/5 blur-3xl bottom-5 left-1/4 [animation-delay:-8s]" />

      {/* Hex Scene */}
      <HexScene />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-16 py-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 flex items-center justify-center rounded-lg"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              background: 'linear-gradient(135deg, rgba(0,200,255,0.3), rgba(120,0,255,0.2))',
            }}
          >
            <Scale3D className="w-4.5 h-4.5 text-cyan-400" />
          </div>
          <span className="font-semibold text-lg tracking-tight font-heading text-white">LegalAi-My</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#about" className="hover:text-cyan-400 transition-colors">About</a>
          <a href="#pillars" className="hover:text-cyan-400 transition-colors">Pillars</a>
          <a href="#stats" className="hover:text-cyan-400 transition-colors">Impact</a>
          <a href="#stakeholders" className="hover:text-cyan-400 transition-colors">Stakeholders</a>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <a
            href="/legalai/agent"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
          >
            Copilot
          </a>
          <a
            href="/legalai/draft"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white border border-white/8 hover:border-white/25 transition-all"
          >
            Draft
          </a>
          <a
            href="/legalai"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white border border-white/8 hover:border-white/25 transition-all"
          >
            Chat
          </a>
          <a
            href="/legalai"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white border border-white/8 hover:border-white/25 transition-all"
          >
            Dashboard
          </a>
          <a
            href="/legalai/monitor"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white border border-white/8 hover:border-white/25 transition-all"
          >
            Monitor
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section
        id="about"
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-12 lg:pt-24 lg:pb-16 max-w-5xl mx-auto"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse [animation-duration:2s]" />
          Multi-Agent Systems
        </span>

        <ShimmerHero />

        <p className="text-gray-400 text-base md:text-lg lg:text-xl max-w-3xl leading-relaxed mb-8">
          Multi-agent systems represent a promising frontier for Malaysia&apos;s legal ecosystem, offering efficiency gains and enhanced access to justice—deployed responsibly, respecting judicial independence and constitutional rights.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <Button
            onClick={() => setVisionOpen(true)}
            className="glass-btn px-8 py-3.5 rounded-xl text-white font-semibold tracking-wide flex items-center gap-2"
          >
            <ArrowRight className="w-4.5 h-4.5" />
            Explore the Vision
          </Button>

          <Button
            variant="outline"
            onClick={() => setPaperOpen(true)}
            className="px-8 py-3.5 rounded-xl text-gray-300 font-medium border-white/10 hover:border-white/25 transition-all hover:bg-white/5"
          >
            <BookOpen className="w-4.5 h-4.5" />
            Read the Paper
          </Button>
        </div>

        <HeroDemo />

        <div className="scroll-indicator mt-12 text-gray-600">
          <ChevronDown className="w-6 h-6 animate-bounce" />
        </div>
      </section>

      <AgentSwarm />

      {/* Pillars */}
      <section id="pillars" className="relative z-10 px-6 lg:px-16 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 font-heading">Core Pillars</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Balancing technological innovation with constitutional safeguards</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map(pillar => (
            <Card
              key={pillar.title}
              className="glass-card rounded-2xl p-7 cursor-pointer hover:-translate-y-1 transition-all group"
              onClick={() => setPillarOpen(pillar.title)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setPillarOpen(pillar.title)
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-all"
                style={{ backgroundColor: `${pillar.color}20` }}
              >
                <pillar.icon className="w-5.5 h-5.5" style={{ color: pillar.color }} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{pillar.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{pillar.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="relative z-10 px-6 lg:px-16 py-16 max-w-5xl mx-auto">
        <Card className="glass-card rounded-2xl p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="gradient-text text-3xl md:text-4xl font-bold stat-num font-heading">60%</div>
            <div className="text-gray-500 text-sm mt-1">Faster Processing</div>
          </div>
          <div>
            <div className="gradient-text text-3xl md:text-4xl font-bold stat-num font-heading">32M</div>
            <div className="text-gray-500 text-sm mt-1">Citizens Served</div>
          </div>
          <div>
            <div className="gradient-text text-3xl md:text-4xl font-bold stat-num font-heading">4.8K</div>
            <div className="text-gray-500 text-sm mt-1">Legal Agents</div>
          </div>
          <div>
            <div className="gradient-text text-3xl md:text-4xl font-bold stat-num font-heading">99.2%</div>
            <div className="text-gray-500 text-sm mt-1">Accuracy Rate</div>
          </div>
        </Card>
      </section>

      {/* Stakeholders */}
      <section id="stakeholders" className="relative z-10 px-6 lg:px-16 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 font-heading">Key Stakeholders</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Shaping this technological transition to serve the public interest</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card rounded-2xl p-7 text-center group cursor-pointer hover:-translate-y-1">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 bg-cyan-500/8 border border-cyan-500/15">
              <Landmark className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2 font-heading">Malaysian Bar Council</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Setting ethical standards and regulatory frameworks for AI adoption in legal practice.
            </p>
          </Card>

          <Card className="glass-card rounded-2xl p-7 text-center group cursor-pointer hover:-translate-y-1">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 bg-purple-500/8 border border-purple-500/15">
              <Briefcase className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2 font-heading">Legal Practitioners</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Integrating AI tools into daily practice while maintaining professional responsibility and client trust.
            </p>
          </Card>

          <Card className="glass-card rounded-2xl p-7 text-center group cursor-pointer hover:-translate-y-1">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 bg-teal-500/8 border border-teal-500/15">
              <Heart className="w-7 h-7 text-teal-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2 font-heading">Civil Society</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Advocating for transparency, accountability, and fundamental rights in AI-driven legal processes.
            </p>
          </Card>
        </div>
      </section>

      <footer className="relative z-10 px-6 lg:px-16 py-10 border-t border-white/5 text-center">
        <p className="text-gray-600 text-sm font-body">
          Responsible AI for Malaysia&apos;s Legal Future · Respecting the Constitution
        </p>
      </footer>

      {/* Vision Modal */}
      <Dialog open={visionOpen} onOpenChange={setVisionOpen}>
        <DialogContent className="glass-card max-w-2xl max-h-[80vh] overflow-auto p-0 m-0 bg-transparent border-none max-[450px]:h-[90vh]">
          <div className="flex items-center justify-between p-8 pb-6">
            <DialogTitle className="text-2xl font-bold text-white font-heading">The Vision</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setVisionOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="space-y-4 p-8 pt-0 text-gray-300 [& strong]:text-white [& ul]:space-y-2 [& li]:ml-4 prose prose-sm max-w-none">
            <p>
              Multi-agent systems (MAS) represent a paradigm shift in how technology can serve Malaysia&apos;s legal ecosystem. These intelligent systems—comprising autonomous AI agents working in concert—can:
            </p>
            <ul className="space-y-3 list-disc list-inside">
              <li>
                <strong className="text-cyan-400">Accelerate case processing</strong> by 60%, reducing backlog and delay
              </li>
              <li>
                <strong className="text-cyan-400">Democratize legal access</strong> for 32 million Malaysians across all income levels
              </li>
              <li>
                <strong className="text-cyan-400">Maintain judicial independence</strong> by augmenting—never replacing—human decision-making
              </li>
              <li>
                <strong className="text-cyan-400">Ensure constitutional compliance</strong> at every step of the legal process
              </li>
            </ul>
            <p>
              The Malaysian Bar Council, legal practitioners, and civil society stakeholders are critical partners in ensuring this transition serves the public interest and upholds the rule of law.
            </p>
            <div className="mt-6">
              <HeroDemo />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paper Modal */}
      <Dialog open={paperOpen} onOpenChange={setPaperOpen}>
        <DialogContent className="glass-card max-w-2xl max-h-[80vh] overflow-auto p-0 m-0 bg-transparent border-none">
          <div className="flex items-center justify-between p-8 pb-6">
            <DialogTitle className="text-2xl font-bold text-white font-heading">Research Paper</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setPaperOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="p-8 space-y-4 text-gray-300">
            <div className="p-4 rounded-xl bg-cyan-500/8 border border-cyan-500/15">
              <h3 className="font-semibold text-white mb-2 font-heading">Multi-Agent Systems for Malaysia&apos;s Legal Ecosystem</h3>
              <p className="text-sm text-gray-400 mb-3">A comprehensive analysis of AI deployment in the Malaysian legal system</p>
              <div className="flex flex-wrap gap-3">
                <Button size="sm" className="bg-cyan-500/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30">
                  PDF Download
                </Button>
                <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                  View Online
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2 font-heading">Key Sections:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2"><span className="text-cyan-400">→</span> Executive Summary &amp; Constitutional Framework</li>
                <li className="flex gap-2"><span className="text-cyan-400">→</span> Technical Architecture of Multi-Agent Systems</li>
                <li className="flex gap-2"><span className="text-cyan-400">→</span> Implementation Roadmap for Malaysia</li>
                <li className="flex gap-2"><span className="text-cyan-400">→</span> Ethical Guidelines &amp; Regulatory Requirements</li>
                <li className="flex gap-2"><span className="text-cyan-400">→</span> Case Studies from Regional Deployments</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pillar Modal */}
      <Dialog open={!!pillarOpen} onOpenChange={() => setPillarOpen('')}>
        <DialogContent className="glass-card max-w-2xl max-h-[80vh] overflow-auto p-0 m-0 bg-transparent border-none">
          <div className="flex items-center justify-between p-8 pb-6">
            <DialogTitle className="text-2xl font-bold text-white font-heading">{pillarOpen}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setPillarOpen('')}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="p-8 pt-0 text-gray-300 prose prose-sm max-w-none [& strong]:text-white [& ul]:space-y-2 [& li]:ml-4">
            {pillarOpen ? pillarDetails[pillarOpen].content : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

