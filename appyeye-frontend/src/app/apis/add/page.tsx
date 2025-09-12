import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, ArrowLeft, Plus, Zap, TestTube, Save } from "lucide-react"
import Link from "next/link"

export default function AddAPIPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <Eye className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">AppyEye</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link href="/apis" className="text-sm font-medium text-primary">
                  APIs
                </Link>
                <Link
                  href="/changes"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Changes
                </Link>
                <Link
                  href="/public"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Public Database
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/developer-avatar.png" alt="User" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <Button variant="ghost" className="gap-2 mb-6" asChild>
          <Link href="/apis">
            <ArrowLeft className="h-4 w-4" />
            Back to APIs
          </Link>
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Add New API</h1>
          <p className="text-muted-foreground mt-1">Start monitoring a new API endpoint for changes</p>
        </div>

        {/* Add API Form */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>Configure your API endpoint for intelligent monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">API Name</Label>
                  <Input id="name" placeholder="e.g., Stripe Payments API" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">A friendly name to identify this API</p>
                </div>

                <div>
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input id="baseUrl" placeholder="https://api.example.com" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">The base URL of the API</p>
                </div>

                <div>
                  <Label htmlFor="endpoint">Endpoint Path</Label>
                  <Input id="endpoint" placeholder="/v1/users" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">The specific endpoint path to monitor</p>
                </div>

                <div>
                  <Label htmlFor="method">HTTP Method</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Configuration */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <h3 className="text-lg font-semibold">Advanced Configuration</h3>

                <div>
                  <Label htmlFor="headers">Custom Headers (Optional)</Label>
                  <Textarea
                    id="headers"
                    placeholder={`Authorization: Bearer your-token\nContent-Type: application/json`}
                    className="mt-1 font-mono text-sm"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">One header per line in "Key: Value" format</p>
                </div>

                <div>
                  <Label htmlFor="frequency">Check Frequency</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15min">Every 15 minutes</SelectItem>
                      <SelectItem value="30min">Every 30 minutes</SelectItem>
                      <SelectItem value="1hour">Every hour</SelectItem>
                      <SelectItem value="6hours">Every 6 hours</SelectItem>
                      <SelectItem value="24hours">Every 24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">How often to check for changes</p>
                </div>
              </div>

              {/* Test Connection */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Test Connection</h3>
                    <p className="text-sm text-muted-foreground">Verify the API endpoint is accessible</p>
                  </div>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <TestTube className="h-4 w-4" />
                    Test API
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <Button type="submit" className="gap-2 flex-1">
                  <Save className="h-4 w-4" />
                  Add API for Monitoring
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/apis">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-border/50 bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">3-Phase Detection</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AppyEye uses intelligent 3-phase detection: hash checking for quick changes, schema analysis for
                  structure modifications, and full diff comparison for detailed changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
