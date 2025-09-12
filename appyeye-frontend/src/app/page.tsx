"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Github, Eye, Shield, BarChart3, Zap, Database } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  const handleGitHubAuth = () => {
    window.location.href = "/api/auth/github";
  };

  const handleLookAround = () => {
    router.push("/dashboard");
  };

  const handleExplorePublic = () => {
    router.push("/publicdb");
  };

  const features = [
    {
      title: "Public API Database",
      description:
        "Browse and explore popular monitored APIs freely. No signup required—search, filter, and discover instantly.",
      icon: <Database className="h-7 w-7 text-chart-3" />,
      status: "available",
    },
    {
      title: "API Change Tracking",
      description:
        "Detect changes to your APIs quickly and stay on top of modifications without manual checks.",
      icon: <BarChart3 className="h-7 w-7 text-primary" />,
      status: "available",
    },
    {
      title: "Security Monitoring (Coming Soon)",
      description:
        "Proactive vulnerability alerts and compliance checks will help you keep APIs secure.",
      icon: <Shield className="h-7 w-7 text-accent" />,
      status: "coming",
    },
    {
      title: "Auto-Scaling Alerts (Coming Soon)",
      description:
        "Dynamic thresholds for API load and usage patterns will notify you instantly when needed.",
      icon: <Zap className="h-7 w-7 text-chart-5" />,
      status: "coming",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 glow-effect">
                <Eye className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary">AppyEye</span>
              <span className="text-xs text-muted-foreground font-mono">v2.0.1</span>
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={handleGitHubAuth}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20 font-mono"
            >
              <Github className="h-4 w-4" />
              Get Started
            </Button>
            <Button
              variant="outline"
              onClick={handleLookAround}
              className="gap-2 border-border/50 hover:bg-card/50 font-mono"
            >
              Look Around
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-32 text-center relative">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
          Simple, Developer-First API Monitoring
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-mono">
          Track API changes, get notified, and ensure smooth API usage—all without complex setup.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-6">
          <Button
            size="lg"
            onClick={handleGitHubAuth}
            className="gap-3 px-10 py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20 font-mono"
          >
            <Github className="h-5 w-5" />
            Get Started (Free)
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleExplorePublic}
            className="px-10 py-4 text-lg border-border/50 hover:bg-card/50 font-mono"
          >
            Explore Public APIs
          </Button>
        </div>

        {/* Hero Illustration */}
        <div className="mt-16">
          <img
            src="/mock-dashboard.png"
            alt="Dashboard Preview"
            className="mx-auto rounded-xl shadow-lg w-full max-w-4xl"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-primary">
          What AppyEye Offers
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <Card
              key={i}
              className={`p-8 hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-md ${
                feature.status === "coming" ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                {feature.icon}
                <h3 className="text-xl font-semibold font-mono">{feature.title}</h3>
              </div>
              <p className="text-muted-foreground font-mono">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="p-16 text-center bg-gradient-to-br from-card/50 via-primary/5 to-accent/5 border-border/50 backdrop-blur-sm">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to simplify API monitoring?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 font-mono">
            Start tracking changes today with zero setup hassle.
          </p>
          <Button
            size="lg"
            onClick={handleGitHubAuth}
            className="gap-3 px-12 py-6 text-xl bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20 font-mono"
          >
            <Github className="h-6 w-6" />
            Get Started (Free)
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/20 backdrop-blur-sm py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-primary">AppyEye</span>
              <span className="text-xs text-muted-foreground font-mono">
                Professional API Monitoring
              </span>
            </div>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground font-mono">
            <a href="#" className="hover:text-primary transition-colors">
              Docs
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              API
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Support
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
