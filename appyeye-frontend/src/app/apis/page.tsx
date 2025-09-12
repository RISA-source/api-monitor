import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Eye,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Settings,
  Trash2,
  Edit,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

// Mock data
const mockApis = [
  {
    id: 1,
    name: "Stripe Payments API",
    url: "https://api.stripe.com/v1",
    endpoint: "/charges",
    method: "GET",
    status: "healthy",
    lastChecked: "2 minutes ago",
    changes: 0,
    uptime: "99.9%",
    addedDate: "2024-01-15",
    checkFrequency: "1 hour",
  },
  {
    id: 2,
    name: "GitHub REST API",
    url: "https://api.github.com",
    endpoint: "/user/repos",
    method: "GET",
    status: "warning",
    lastChecked: "5 minutes ago",
    changes: 2,
    uptime: "99.8%",
    addedDate: "2024-01-10",
    checkFrequency: "30 minutes",
  },
  {
    id: 3,
    name: "OpenAI API",
    url: "https://api.openai.com/v1",
    endpoint: "/chat/completions",
    method: "POST",
    status: "healthy",
    lastChecked: "1 minute ago",
    changes: 0,
    uptime: "99.9%",
    addedDate: "2024-01-20",
    checkFrequency: "15 minutes",
  },
  {
    id: 4,
    name: "Vercel API",
    url: "https://api.vercel.com",
    endpoint: "/v9/projects",
    method: "GET",
    status: "error",
    lastChecked: "10 minutes ago",
    changes: 5,
    uptime: "98.2%",
    addedDate: "2024-01-05",
    checkFrequency: "1 hour",
  },
  {
    id: 5,
    name: "Discord API",
    url: "https://discord.com/api/v10",
    endpoint: "/users/@me",
    method: "GET",
    status: "healthy",
    lastChecked: "3 minutes ago",
    changes: 1,
    uptime: "99.5%",
    addedDate: "2024-01-18",
    checkFrequency: "1 hour",
  },
]

export default function APIsPage() {
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

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-balance">API Management</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage all your API endpoints</p>
          </div>
          <Button className="gap-2" asChild>
            <Link href="/apis/add">
              <Plus className="h-4 w-4" />
              Add New API
            </Link>
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8 border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search APIs by name or URL..." className="pl-10" />
              </div>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* APIs Grid */}
        <div className="grid gap-6">
          {mockApis.map((api) => (
            <Card key={api.id} className="border-border/50 hover:bg-muted/20 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center gap-2 mt-1">
                      {api.status === "healthy" && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {api.status === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                      {api.status === "error" && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{api.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {api.method}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="font-mono">
                          {api.url}
                          {api.endpoint}
                        </p>
                        <div className="flex items-center gap-4">
                          <span>Added {api.addedDate}</span>
                          <span>•</span>
                          <span>Checks every {api.checkFrequency}</span>
                          <span>•</span>
                          <span>Last checked {api.lastChecked}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-lg">{api.uptime}</p>
                        <p className="text-muted-foreground">Uptime</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-lg">{api.changes}</p>
                        <p className="text-muted-foreground">Changes</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/apis/${api.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/apis/${api.id}/edit`} className="flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Edit API
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/apis/${api.id}/settings`} className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Settings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete API
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State (if no APIs) */}
        {mockApis.length === 0 && (
          <Card className="border-border/50 border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No APIs yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start monitoring your first API endpoint. Add an API to get real-time change notifications.
              </p>
              <Button className="gap-2" asChild>
                <Link href="/apis/add">
                  <Plus className="h-4 w-4" />
                  Add Your First API
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
