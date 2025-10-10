'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut,
  BarChart3,
  FileText
} from 'lucide-react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Sales Call Analyzer</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Analytics</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Analyses
            </Button>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="outline">Free Plan</Badge>
              <div className="text-sm">
                <span className="text-muted-foreground">Welcome,</span>
                <span className="ml-1 font-medium">Demo User</span>
              </div>
            </div>

            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="icon">
              <User className="w-4 h-4" />
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col gap-2">
              <Button variant="ghost" className="justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" className="justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Analyses
              </Button>
              <Button variant="ghost" className="justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" className="justify-start">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
