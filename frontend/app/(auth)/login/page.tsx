import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <Card className="w-full max-w-md bg-neutral-900 border-neutral-800 text-neutral-50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Log In</CardTitle>
          <CardDescription className="text-center text-neutral-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form action={signIn}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required className="bg-neutral-950 border-neutral-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required className="bg-neutral-950 border-neutral-800" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Log In</Button>
            <p className="text-sm text-neutral-400 text-center">
              Don't have an account? <Link href="/signup" className="text-blue-500 hover:underline">Sign up</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
