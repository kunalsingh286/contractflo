import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  FileText, Shield, Search, ArrowRight, ShieldCheck,
  Scale, Zap, Brain, ListTodo, MessageSquare, ChevronRight,
  CheckCircle2, AlertTriangle, CalendarClock, BarChart3
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Brain,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    title: 'AI Contract Intelligence',
    desc: 'Upload any PDF or DOCX and get instant metadata extraction — parties, dates, payment terms, and governing law — in seconds.',
  },
  {
    icon: Shield,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    title: 'Automated Risk Scoring',
    desc: 'Every contract is scored 0–100 with detailed findings across high, medium, and low risk categories. Never sign blindly again.',
  },
  {
    icon: ListTodo,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'Obligation Tracking',
    desc: 'AI extracts every deadline, payment, and notice requirement. Track open, due soon, and overdue obligations across your portfolio.',
  },
  {
    icon: Search,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    title: 'Semantic Portfolio Search',
    desc: 'Ask "contracts with unlimited liability" in plain English. Our vector search finds matching clauses across all your contracts instantly.',
  },
  {
    icon: MessageSquare,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    title: 'AI Copilot per Contract',
    desc: 'Chat with any contract. Ask "What are our termination rights?" and get grounded, citation-backed answers from your document.',
  },
  {
    icon: BarChart3,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    title: 'Portfolio Analytics',
    desc: 'A live dashboard showing risk distribution, upcoming renewals, and obligation health across your entire contract repository.',
  },
]

const PIPELINE_STEPS = [
  { step: '01', title: 'Upload', desc: 'Drop any PDF or DOCX contract. We store it securely with bank-grade encryption.', icon: FileText },
  { step: '02', title: 'Analyze', desc: 'Our AI pipeline extracts text, generates embeddings, and runs 3 parallel intelligence engines.', icon: Zap },
  { step: '03', title: 'Act', desc: 'View risks, track obligations, chat with your contract, and search across your full portfolio.', icon: Brain },
]

const STATS = [
  { value: '< 60s', label: 'Average analysis time' },
  { value: '3 engines', label: 'Intelligence, Risk & Obligations' },
  { value: '100%', label: 'Data isolated per organization' },
  { value: 'Free', label: 'To start, no credit card' },
]

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: 'Bank-Grade Encryption', desc: 'AES-256 at rest, TLS 1.3 in transit' },
  { icon: Scale, label: 'Multi-tenant Isolation', desc: 'Row-level security — your data is yours only' },
  { icon: AlertTriangle, label: 'No Model Training', desc: 'Your contracts never train our AI models' },
]

// ─── Dashboard Preview Mock ───────────────────────────────────────────────────

function DashboardMock() {
  return (
    <div className="w-full rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden shadow-2xl text-left">
      {/* Top bar */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        <span className="ml-3 text-xs text-neutral-600 font-mono">contractflo.app/dashboard</span>
      </div>
      {/* Content */}
      <div className="p-5 space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Contracts', value: '24', color: 'text-white' },
            { label: 'High Risk', value: '3', color: 'text-red-400' },
            { label: 'Renewals', value: '5', color: 'text-amber-400' },
            { label: 'Open Obligations', value: '12', color: 'text-blue-400' },
          ].map(k => (
            <div key={k.label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">{k.label}</p>
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
        {/* Contract rows */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-neutral-800">
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Action Required: High Risk</p>
          </div>
          {[
            { name: 'Acme Corp MSA', type: 'MSA', score: 82, level: 'High', levelColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
            { name: 'Vendor NDA — TechCo', type: 'NDA', score: 71, level: 'High', levelColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
            { name: 'Investor SPA', type: 'SPA', score: 91, level: 'Critical', levelColor: 'text-red-400 bg-red-500/10 border-red-500/20' },
          ].map(c => (
            <div key={c.name} className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-800/60 last:border-0">
              <div>
                <p className="text-xs font-medium text-neutral-200">{c.name}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">{c.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.levelColor}`}>{c.level}</span>
                <span className="text-xs font-bold text-neutral-300">{c.score}/100</span>
              </div>
            </div>
          ))}
        </div>
        {/* Pipeline indicator */}
        <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          <p className="text-[10px] text-blue-400">AI analyzing &quot;Partnership Agreement — Series B&quot; · Text Extraction complete · Running Risk Analysis...</p>
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/60">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">ContractFlo</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="#security" className="hover:text-white transition-colors">Security</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-neutral-400 hover:text-white text-sm h-8 px-3">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white text-sm h-8 px-4 font-medium">
                Get Started <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6 relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)]" />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              AI-Native Contract Intelligence Platform
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white mb-6">
              Your contracts,{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
                intelligently analyzed
              </span>
            </h1>

            <p className="text-lg text-neutral-400 leading-relaxed max-w-2xl mx-auto mb-8">
              ContractFlo uses generative AI to extract risks, track obligations, and answer questions about any contract — in under 60 seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="h-11 px-6 text-sm bg-white text-black hover:bg-neutral-200 font-semibold w-full sm:w-auto">
                  Start Free — No Credit Card <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-11 px-6 text-sm border-neutral-700 hover:bg-neutral-900 hover:border-neutral-600 text-neutral-300 w-full sm:w-auto bg-transparent">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute -inset-px bg-gradient-to-r from-blue-500/30 via-violet-500/20 to-blue-500/30 rounded-2xl blur-sm" />
            <div className="relative rounded-2xl p-px bg-gradient-to-b from-neutral-700 to-neutral-900">
              <div className="rounded-2xl overflow-hidden bg-neutral-950 p-3">
                <DashboardMock />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-14 border-y border-neutral-800/60 bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-white tracking-tight mb-1">{s.value}</p>
                <p className="text-sm text-neutral-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              From upload to insight in 3 steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-neutral-800 via-blue-500/30 to-neutral-800" />
            {PIPELINE_STEPS.map((s) => (
              <div key={s.step} className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-xs font-mono text-neutral-600">{s.step}</span>
                </div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-neutral-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Platform Features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              Everything legal teams need
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto text-sm">
              One platform that replaces manual contract review, spreadsheet tracking, and ad-hoc risk assessment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-all hover:bg-neutral-900/80 group"
              >
                <div className={`w-10 h-10 rounded-lg ${f.bg} border flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-white mb-2 group-hover:text-white">{f.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section id="security" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 md:p-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">Enterprise Security</p>
                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
                  Your contracts are your most sensitive data. We treat them that way.
                </h2>
                <p className="text-neutral-400 text-sm leading-relaxed mb-8">
                  Built with a multi-tenant architecture where every organization is fully isolated at the database level using Row Level Security. Your data never touches another customer&apos;s workspace.
                </p>
                <Link href="/signup">
                  <Button className="bg-white text-black hover:bg-neutral-200 font-medium h-9 px-5 text-sm">
                    Start Secure Trial <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {TRUST_ITEMS.map(t => (
                  <div key={t.label} className="flex items-start gap-4 p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                    <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <t.icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">{t.label}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-14 h-14 bg-blue-600/15 border border-blue-500/30 rounded-2xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-blue-400" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Ready to transform how your team handles contracts?
          </h2>
          <p className="text-neutral-400 mb-8 text-sm">
            Join teams that have replaced manual review with AI-powered contract intelligence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="h-11 px-6 text-sm bg-white text-black hover:bg-neutral-200 font-semibold">
                Start Free — No Credit Card <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-neutral-600">
            {['No setup fees', 'Cancel anytime', 'DPDP compliant', 'Data never leaves your org'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-800/60 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-white">ContractFlo</span>
            <span className="text-neutral-600 text-sm ml-2">© 2026 All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-neutral-500">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#security" className="hover:text-white transition-colors">Security</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
