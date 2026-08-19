import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Building2 } from 'lucide-react'
import Link from 'next/link'

export default async function SignupPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error;

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-neutral-950 font-sans">
      {/* Left Pane - Branding & Trust */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-neutral-900 relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-neutral-900 to-indigo-900/40 z-0" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[100px] rounded-full z-0" />
        
        <div className="relative z-10 flex items-center gap-2">
           <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
             <FileText className="w-6 h-6 text-white" />
           </div>
           <span className="text-xl font-bold tracking-tight text-white">ContractFlo</span>
        </div>
        
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight">
            "We accelerated our legal review cycle by 70% with ContractFlo's automated intelligence."
          </h2>
          <p className="text-neutral-400 text-lg">
            — General Counsel, Rapidly Scaling Fintech
          </p>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="flex items-center justify-center p-6 relative">
        {/* Mobile Logo */}
        <div className="md:hidden absolute top-6 left-6 flex items-center gap-2">
           <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
             <FileText className="w-5 h-5 text-white" />
           </div>
           <span className="text-lg font-bold tracking-tight text-white">ContractFlo</span>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white tracking-tight">Create an account</h1>
            <p className="text-neutral-400">Join ContractFlo to manage your portfolio.</p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form action={signUp} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-neutral-300">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  type="text" 
                  placeholder="John Doe" 
                  required 
                  className="bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-600 h-12 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-300">Work Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="you@company.com" 
                  required 
                  className="bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-600 h-12 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-300">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  className="bg-neutral-900/50 border-neutral-800 text-white h-12 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
              Create Account
            </Button>
          </form>

          <p className="text-center text-neutral-400">
            Already have an account? <Link href="/login" className="text-blue-500 hover:text-blue-400 font-medium">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
