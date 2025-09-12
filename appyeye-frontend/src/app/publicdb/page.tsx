import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Eye,
  Search,
  ExternalLink,
  Users,
  TrendingUp,
  Globe,
  Star,
  Clock,
} from "lucide-react"
import Link from "next/link"

// Mock data for public APIs
const mockPublicApis = [
  {
    id: 1,
    name: "GitHub REST API",
    url: "https://api.github.com",
    description: "Access GitHub's REST API for repositories, users, and organizations",
    category: "Developer Tools",
    subscribers: 1247,
    lastChange: "2 hours ago",
    changeType: "Schema Change",
    totalChanges: 42,
    isPopular: true,
  },
  {
    id: 2,
    name: "Stripe Payments API",
    url: "https://api.stripe.com/v1",
    description: "Process payments, manage subscriptions, and handle financial transactions",
    category: "Payments",
    subscribers: 892,
    lastChange: "6 hours ago",
    changeType: "Version Update",
    totalChanges: 19,
    isPopular: true,
  },
  {
    id: 3,
    name: "OpenAI API",
    url: "https://api.openai.com/v1",
    description: "Access GPT models for text generation, completion, and AI capabilities",
    category: "AI/ML",
    subscribers: 2156,
    lastChange: "1 day ago",
    changeType: "Response Change",
    totalChanges: 57,
    isPopular: true,
  },
]

const categories = ["All", "Developer Tools", "Payments", "AI/ML", "Social", "Communications"]

const stats = {
  totalApis: 1247,
  trackedApis: 786,
  changesDetected: 15672,
}

export default function PublicDatabasePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
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
                  href="/public"
                  className="text-sm font-medium text-primary"
                >
                  Public Database
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </nav>
            </div>

            <Button size="sm" className="rounded-full">
              Start Monitoring
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Public API Database</h1>
          <p className="text-muted-foreground mt-1">
            A living index of APIs tracked for schema & version changes.  
            Updated automatically by AppyEye crawlers — no manual submissions.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApis.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tracked APIs</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trackedApis.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Changes Detected</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.changesDetected.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search APIs by name, category, or description..." className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="recent">Recently Added</SelectItem>
                    <SelectItem value="changes">Most Changed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* APIs Grid */}
        <div className="grid gap-6">
          {mockPublicApis.map((api) => (
            <Card key={api.id} className="border-border/50 hover:bg-muted/20 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{api.name}</h3>
                      {api.isPopular && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          Popular
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {api.category}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                      {api.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-mono">{api.url}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {api.subscribers} subscribers
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Badge
                        variant={
                          api.changeType === "Breaking Change"
                            ? "destructive"
                            : api.changeType === "Schema Change"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {api.changeType}
                      </Badge>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {api.lastChange}
                      </span>
                      <span className="text-muted-foreground">
                        • {api.totalChanges} total changes tracked
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Eye className="h-4 w-4" />
                      Monitor
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={api.url} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="outline" className="gap-2 bg-transparent">
            Load More APIs
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-12 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} AppyEye — API Monitoring Simplified
      </footer>
    </div>
  )
}
