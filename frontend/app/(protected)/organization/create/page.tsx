import { createOrganization } from '@/app/actions/orgs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreateOrgPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <Card className="w-full max-w-md bg-neutral-900 border-neutral-800 text-neutral-50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create Organization</CardTitle>
          <CardDescription className="text-center text-neutral-400">
            Set up your organization workspace
          </CardDescription>
        </CardHeader>
        <form action={createOrganization}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input id="name" name="name" type="text" placeholder="Acme Corp" required className="bg-neutral-950 border-neutral-800" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Create Workspace</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
