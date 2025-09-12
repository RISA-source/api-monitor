"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Eye,
  Plus,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity,
  Settings,
  Bell,
  ExternalLink,
  Zap,
} from "lucide-react"

// Mock data - Demo only
const mockUser = {
  name: "Alex Developer",
  email: "alex@example.com",
  avatar: "/developer-avatar.png",
  githubUsername: "alexdev",
}

const mockApis = [
  { id: 1, name: "Stripe Payments API", url: "https://api.stripe.com/v1", status: "healthy", lastChecked: "2 mins ago", changes: "-", uptime: "-" },
  { id: 2, name: "GitHub REST API", url: "https://api.github.com", status: "warning", lastChecked: "5 mins ago", changes: "-", uptime: "-" },
  { id: 3, name: "OpenAI API", url: "https://api.openai.com/v1", status: "healthy", lastChecked: "1 min ago", changes: "-", uptime: "-" },
  { id: 4, name: "Vercel API", url: "https://api.vercel.com", status: "error", lastChecked: "10 mins ago", changes: "-", uptime: "-" },
]

const recentChanges = [
  { id: 1, api: "GitHub REST API", type: "Schema Change", severity: "medium", description: "New optional field 'visibility' added", timestamp: "2 hours ago" },
  { id: 2, api: "Vercel API", type: "Breaking Change", severity: "high", description: "Deprecated endpoint /v1/projects removed", timestamp: "4 hours ago" },
  { id: 3, api: "Stripe Payments API", type: "Version Update", severity: "low", description: "API version updated to 2024-01-15", timestamp: "1 day ago" },
]

const getBadgeVariant = (severity: string) => {
  switch (severity) {
    case "high": return "destructive"
    case "medium": return "default"
    case "low": return "secondary"
    default: return "default" // fallback
  }
}

// --- Components ---
function ApiRow({ api }: { api: typeof mockApis[0] }) {
  const statusColor = api.status === "healthy" ? "text-green-500" : api.status === "warning" ? "text-yellow-500" : "text-red-500"
  const StatusIcon = api.status === "healthy" ? CheckCircle : AlertTriangle

  return (
    <div
      className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => window.open(api.url, "_blank")}
      aria-label={`Open ${api.name}`}
    >
      <div className="flex items-center gap-4">
        <StatusIcon className={`h-5 w-5 ${statusColor}`} />
        <div className="truncate">
          <h3 className="font-medium truncate">{api.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{api.url}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="text-right">
          <p className="font-medium">{api.uptime}</p>
          <p className="text-muted-foreground">uptime</p>
        </div>
        <div className="text-right">
          <p className="font-medium">{api.changes}</p>
          <p className="text-muted-foreground">changes</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground">{api.lastChecked}</p>
        </div>
        <Button variant="ghost" size="sm" aria-label={`Open ${api.name} API`} onClick={(e) => { e.stopPropagation(); window.open(api.url, "_blank") }}>
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ChangeRow({ change, isLast }: { change: typeof recentChanges[0]; isLast: boolean }) {
  const severityMap = { high: "destructive", medium: "default", low: "secondary" }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant={getBadgeVariant(change.severity)} className="text-xs">{change.type}</Badge>
        <span className="text-xs text-muted-foreground">{change.timestamp}</span>
      </div>
      <div>
        <p className="text-sm font-medium">{change.api}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{change.description}</p>
      </div>
      {!isLast && <div className="border-b border-border/30 pt-2" />}
    </div>
  )
}

// --- Dashboard ---
export default function Dashboard() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">AppyEye</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "APIs", href: "/apis" },
                { name: "Changes", href: "/changes" },
                { name: "Public Database", href: "/public" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => router.push("/notifications")} aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => router.push("/settings")} aria-label="Settings">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={mockUser.avatar || "/placeholder.svg"} alt={mockUser.name} />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Welcome back, {mockUser.name}</h1>
            <p className="text-muted-foreground mt-1">This is a demo dashboard. Live monitoring coming soon!</p>
          </div>
          <Button className="gap-2" onClick={() => router.push("/apis/new")}>
            <Plus className="h-4 w-4" /> Add API
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Total APIs", value: mockApis.length, icon: Eye, desc: "APIs added" },
            { title: "Active Monitors", value: "-", icon: Activity, desc: "Coming soon" },
            { title: "Changes Detected", value: "-", icon: Zap, desc: "Coming soon" },
            { title: "Avg Uptime", value: "-", icon: TrendingUp, desc: "Coming soon" },
          ].map((card) => (
            <Card key={card.title} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* APIs List */}
          <div className="lg:col-span-2">
            <Card className="border-border/50">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Your APIs</CardTitle>
                  <CardDescription>Click a row to open API endpoint (demo links)</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/apis">View All</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockApis.map((api) => <ApiRow key={api.id} api={api} />)}
              </CardContent>
            </Card>
          </div>

          {/* Recent Changes */}
          <div>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Recent Changes</CardTitle>
                <CardDescription>Latest API modifications detected</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentChanges.map((change, idx) => (
                  <ChangeRow key={change.id} change={change} isLast={idx === recentChanges.length - 1} />
                ))}
                <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent" asChild>
                  <Link href="/changes">View All Changes</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
