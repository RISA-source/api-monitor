import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, User, Bell, Shield, Github, Mail, Save, ExternalLink, Trash2, Key } from "lucide-react"
import Link from "next/link"

// Mock user data
const mockUser = {
  name: "Alex Developer",
  email: "alex@example.com",
  avatar: "/developer-avatar.png",
  githubUsername: "alexdev",
  githubUrl: "https://github.com/alexdev",
  joinDate: "January 15, 2024",
  totalApis: 4,
  totalChanges: 12,
}

const notificationSettings = {
  emailNotifications: true,
  breakingChanges: true,
  schemaChanges: true,
  versionUpdates: false,
  weeklyDigest: true,
  instantAlerts: true,
  frequency: "immediate",
}

export default function SettingsPage() {
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
                <AvatarImage src={mockUser.avatar || "/placeholder.svg"} alt={mockUser.name} />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences and notification settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>Your profile information from GitHub OAuth</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={mockUser.avatar || "/placeholder.svg"} alt={mockUser.name} />
                    <AvatarFallback className="text-lg">AD</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{mockUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{mockUser.email}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Github className="h-3 w-3" />
                        {mockUser.githubUsername}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={mockUser.githubUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" value={mockUser.name} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={mockUser.email} disabled className="mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">Email is managed by GitHub OAuth</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself and what APIs you work with..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{mockUser.totalApis}</p>
                    <p className="text-sm text-muted-foreground">APIs Monitored</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{mockUser.totalChanges}</p>
                    <p className="text-sm text-muted-foreground">Changes Detected</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Member since</p>
                    <p className="text-sm text-muted-foreground">{mockUser.joinDate}</p>
                  </div>
                </div>

                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Configure how and when you receive notifications about API changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="text-base font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch id="email-notifications" checked={notificationSettings.emailNotifications} />
                  </div>

                  <div className="border-t border-border/30 pt-4 space-y-4">
                    <h4 className="font-medium">Change Types</h4>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="breaking-changes" className="font-medium">
                          Breaking Changes
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Critical changes that may break your integrations
                        </p>
                      </div>
                      <Switch id="breaking-changes" checked={notificationSettings.breakingChanges} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="schema-changes" className="font-medium">
                          Schema Changes
                        </Label>
                        <p className="text-sm text-muted-foreground">API structure and field modifications</p>
                      </div>
                      <Switch id="schema-changes" checked={notificationSettings.schemaChanges} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="version-updates" className="font-medium">
                          Version Updates
                        </Label>
                        <p className="text-sm text-muted-foreground">API version changes and updates</p>
                      </div>
                      <Switch id="version-updates" checked={notificationSettings.versionUpdates} />
                    </div>
                  </div>

                  <div className="border-t border-border/30 pt-4 space-y-4">
                    <h4 className="font-medium">Delivery Options</h4>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="instant-alerts" className="font-medium">
                          Instant Alerts
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified immediately when changes are detected
                        </p>
                      </div>
                      <Switch id="instant-alerts" checked={notificationSettings.instantAlerts} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="weekly-digest" className="font-medium">
                          Weekly Digest
                        </Label>
                        <p className="text-sm text-muted-foreground">Summary of all changes from the past week</p>
                      </div>
                      <Switch id="weekly-digest" checked={notificationSettings.weeklyDigest} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="frequency">Notification Frequency</Label>
                      <Select value={notificationSettings.frequency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="hourly">Hourly Digest</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Github className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">GitHub OAuth</h4>
                        <p className="text-sm text-muted-foreground">Connected as {mockUser.githubUsername}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Connected</Badge>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">API Access</h4>
                    <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <h5 className="font-medium">API Key</h5>
                          <p className="text-sm text-muted-foreground">For programmatic access to your data</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Generate Key
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Account Actions</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                        <Mail className="h-4 w-4" />
                        Export Account Data
                      </Button>
                      <Button variant="destructive" className="w-full justify-start gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>Manage your subscription and billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-8 border border-border/50 rounded-lg bg-muted/20">
                  <h3 className="text-lg font-semibold mb-2">Free Plan</h3>
                  <p className="text-muted-foreground mb-4">
                    You're currently on the free plan with full access to AppyEye features
                  </p>
                  <Badge variant="secondary" className="mb-4">
                    No billing required
                  </Badge>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">10</p>
                      <p className="text-sm text-muted-foreground">APIs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">∞</p>
                      <p className="text-sm text-muted-foreground">Checks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">✓</p>
                      <p className="text-sm text-muted-foreground">All Features</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Usage This Month</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-border/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">APIs Monitored</p>
                      <p className="text-2xl font-bold">{mockUser.totalApis}/10</p>
                    </div>
                    <div className="p-4 border border-border/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Checks Performed</p>
                      <p className="text-2xl font-bold">2,847</p>
                    </div>
                    <div className="p-4 border border-border/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Changes Detected</p>
                      <p className="text-2xl font-bold">{mockUser.totalChanges}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
