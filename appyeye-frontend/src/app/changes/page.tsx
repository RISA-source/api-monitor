import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Search, ExternalLink, Clock, AlertTriangle, CheckCircle, Zap, TrendingUp, Calendar } from "lucide-react"
import Link from "next/link"

// Mock data for changes
const mockChanges = [
  {
    id: 1,
    api: {
      name: "GitHub REST API",
      url: "https://api.github.com",
      endpoint: "/user/repos",
    },
    type: "Schema Change",
    severity: "medium",
    description: "New optional field 'visibility' added to repository object",
    timestamp: "2024-01-20 14:30:00",
    timeAgo: "2 hours ago",
    diff: "+  visibility: string (optional)\n   Values: 'public', 'private', 'internal'",
    impact: "Non-breaking change - existing integrations unaffected",
  },
  {
    id: 2,
    api: {
      name: "Vercel API",
      url: "https://api.vercel.com",
      endpoint: "/v9/projects",
    },
    type: "Breaking Change",
    severity: "high",
    description: "Deprecated endpoint /v1/projects removed",
    timestamp: "2024-01-20 10:15:00",
    timeAgo: "4 hours ago",
    diff: "- GET /v1/projects (REMOVED)\n+ Use GET /v9/projects instead",
    impact: "Breaking change - update your API calls immediately",
  },
  {
    id: 3,
    api: {
      name: "Stripe Payments API",
      url: "https://api.stripe.com/v1",
      endpoint: "/charges",
    },
    type: "Version Update",
    severity: "low",
    description: "API version updated to 2024-01-15",
    timestamp: "2024-01-20 09:00:00",
    timeAgo: "6 hours ago",
    diff: "- Stripe-Version: 2023-12-15\n+ Stripe-Version: 2024-01-15",
    impact: "Version update - review changelog for new features",
  },
  {
    id: 4,
    api: {
      name: "OpenAI API",
      url: "https://api.openai.com/v1",
      endpoint: "/chat/completions",
    },
    type: "Response Change",
    severity: "medium",
    description: "New 'system_fingerprint' field added to response",
    timestamp: "2024-01-19 16:45:00",
    timeAgo: "1 day ago",
    diff: "+  system_fingerprint: string\n   Unique identifier for the model configuration",
    impact: "Additive change - safe to ignore or utilize",
  },
  {
    id: 5,
    api: {
      name: "Discord API",
      url: "https://discord.com/api/v10",
      endpoint: "/users/@me",
    },
    type: "Rate Limit Change",
    severity: "medium",
    description: "Rate limit reduced from 1000 to 500 requests per hour",
    timestamp: "2024-01-19 12:20:00",
    timeAgo: "1 day ago",
    diff: "- X-RateLimit-Limit: 1000\n+ X-RateLimit-Limit: 500",
    impact: "Rate limit change - adjust your request frequency",
  },
  {
    id: 6,
    api: {
      name: "Stripe Payments API",
      url: "https://api.stripe.com/v1",
      endpoint: "/payment_intents",
    },
    type: "Schema Change",
    severity: "low",
    description: "Default currency format updated for international payments",
    timestamp: "2024-01-18 14:10:00",
    timeAgo: "2 days ago",
    diff: "- currency: 'usd'\n+ currency: 'USD'",
    impact: "Format change - verify currency handling in your code",
  },
]

const stats = {
  totalChanges: 47,
  thisWeek: 12,
  highSeverity: 3,
  mediumSeverity: 8,
}

export default function ChangesPage() {
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
                <Link
                  href="/apis"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  APIs
                </Link>
                <Link href="/changes" className="text-sm font-medium text-primary">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Change History</h1>
          <p className="text-muted-foreground mt-1">Track all API changes detected across your monitored endpoints</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChanges}</div>
              <p className="text-xs text-muted-foreground">All time detections</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisWeek}</div>
              <p className="text-xs text-muted-foreground">+4 from last week</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Severity</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.highSeverity}</div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.7%</div>
              <p className="text-xs text-muted-foreground">Changes caught successfully</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search changes by API name or description..." className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="breaking">Breaking</SelectItem>
                    <SelectItem value="schema">Schema</SelectItem>
                    <SelectItem value="version">Version</SelectItem>
                    <SelectItem value="response">Response</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Changes List */}
        <div className="space-y-6">
          {mockChanges.map((change) => (
            <Card key={change.id} className="border-border/50 hover:bg-muted/20 transition-colors">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex items-center gap-2 mt-1">
                        {change.severity === "high" && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        {change.severity === "medium" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                        {change.severity === "low" && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            variant={
                              change.severity === "high"
                                ? "destructive"
                                : change.severity === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {change.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {change.timeAgo}
                          </span>
                        </div>

                        <h3 className="font-semibold text-lg mb-1">{change.description}</h3>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <span className="font-medium">{change.api.name}</span>
                          <span>•</span>
                          <span className="font-mono">{change.api.endpoint}</span>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">{change.impact}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/apis/${change.api.name.toLowerCase().replace(/\s+/g, "-")}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Diff Display */}
                  <div className="bg-muted/50 rounded-lg p-4 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Detected Changes</span>
                      <Badge variant="outline" className="text-xs">
                        3-Phase Detection
                      </Badge>
                    </div>
                    <pre className="text-sm font-mono whitespace-pre-wrap text-foreground">{change.diff}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="outline" className="gap-2 bg-transparent">
            Load More Changes
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
