import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-50 p-6">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
          Welcome to <span className="text-blue-500">ContractFlo</span>
        </h1>
        <p className="text-lg text-neutral-400 sm:text-xl max-w-2xl mx-auto">
          The AI-Native Contract Intelligence & Contract Operations Platform. Seamlessly manage, analyze, and operate on your contracts.
        </p>
        <div className="flex gap-4 justify-center pt-8">
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-neutral-900 border-neutral-200">
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
