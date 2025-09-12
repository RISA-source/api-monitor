import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Eye,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings,
  Edit,
  Trash2,
  ExternalLink,
  Activity,
  TrendingUp,
  Zap,
} from "lucide-react"
import Link from "next/link"

// Mock data for API details
const mockApi = {
  id: 1,
  name: "Stripe Payments API",
  url: "https://api.stripe.com/v1",
  endpoint: "/charges",
  method: "GET",
  status: "healthy",
  lastChecked: "2 minutes ago",
  changes: 3,
  uptime: "99.9%",
  addedDate: "2024-01-15",
  checkFrequency: "1 hour",
  description: "Monitor Stripe payment charges endpoint for schema and response changes",
}

const mockChanges = [
  {
    id: 1,
    type: "Schema Change",
    severity: "medium",
    description: "New optional field 'payment_method_details.card.network_token' added",
    timestamp: "2024-01-20 14:30:00",
    diff: "+  payment_method_details.card.network_token: string (optional)",
  },
  {
    id: 2,
    type: "Version Update",
    severity: "low",
    description: "API version header updated to 2024-01-15",
    timestamp: "2024-01-15 09:15:00",
    diff: "- Stripe-Version: 2023-12-15\n+ Stripe-Version: 2024-01-15",
  },
  {
    id: 3,
    type: "Response Change",
    severity: "low",
    description: "Default currency format updated for international charges",
    timestamp: "2024-01-10 16:45:00",
    diff: "- currency: 'usd'\n+ currency: 'USD'",
  },
]

const mockMetrics = {
  totalChecks: 1247,
  successRate: 99.9,
  avgResponseTime: 245,
  lastWeekChanges: 1,
}

export default function APIDetailPage({ params }: { params: { id: string } }) {
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
        {/* Back Button */}
        <Button variant="ghost" className="gap-2 mb-6" asChild>
          <Link href="/apis">
            <ArrowLeft className="h-4 w-4" />
            Back to APIs
          </Link>
        </Button>

        {/* API Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 mt-1">
              {mockApi.status === "healthy" && <CheckCircle className="h-6 w-6 text-green-500" />}
              {mockApi.status === "warning" && <AlertTriangle className="h-6 w-6 text-yellow-500" />}
              {mockApi.status === "error" && <AlertTriangle className="h-6 w-6 text-red-500" />}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{mockApi.name}</h1>
                <Badge variant="outline">{mockApi.method}</Badge>
                <Badge
                  variant={
                    mockApi.status === "healthy"
                      ? "default"
                      : mockApi.status === "warning"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {mockApi.status}
                </Badge>
              </div>

              <div className="space-y-1 text-muted-foreground">
                <p className="font-mono text-sm">
                  {mockApi.url}
                  {mockApi.endpoint}
                </p>
                <p className="text-sm">
                  Last checked {mockApi.lastChecked} • Checks every {mockApi.checkFrequency}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
              <Link href={`/apis/${mockApi.id}/edit`}>
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{mockApi.uptime}</div>
              <p className="text-xs text-muted-foreground">{mockMetrics.totalChecks} total checks</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Changes Detected</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockApi.changes}</div>
              <p className="text-xs text-muted-foreground">{mockMetrics.lastWeekChanges} this week</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.successRate}%</div>
              <p className="text-xs text-muted-foreground">Monitoring reliability</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="changes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="changes">Change History</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="changes" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Recent Changes</CardTitle>
                <CardDescription>All detected changes for this API endpoint</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {mockChanges.map((change) => (
                  <div key={change.id} className="space-y-3 pb-6 border-b border-border/30 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
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
                        <span className="text-sm text-muted-foreground">{change.timestamp}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <p className="font-medium mb-2">{change.description}</p>
                      <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm">
                        <pre className="whitespace-pre-wrap">{change.diff}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Monitoring Configuration</CardTitle>
                <CardDescription>Current monitoring settings and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Check Frequency</Label>
                    <p className="text-sm text-muted-foreground">{mockApi.checkFrequency}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Added Date</Label>
                    <p className="text-sm text-muted-foreground">{mockApi.addedDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Detection Phases</Label>
                    <p className="text-sm text-muted-foreground">Hash, Schema, Full Diff</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Notifications</Label>
                    <p className="text-sm text-muted-foreground">Email enabled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription>Manage this API's configuration and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                    <Edit className="h-4 w-4" />
                    Edit API Configuration
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                    <Settings className="h-4 w-4" />
                    Notification Settings
                  </Button>
                  <Button variant="destructive" className="w-full justify-start gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete API
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
