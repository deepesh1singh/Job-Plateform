import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  Moon, 
  Sun 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { currentUser, logoutUser } = useStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    logoutUser();
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center space-x-2 group">
              <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight">JobPortal</span>
            </a>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/"><a className="text-sm font-medium hover:text-primary transition-colors">Find Jobs</a></Link>
            {currentUser?.role === 'employer' && (
               <Link href="/dashboard"><a className="text-sm font-medium hover:text-primary transition-colors">Employer Dashboard</a></Link>
            )}
             {currentUser?.role === 'admin' && (
               <Link href="/dashboard"><a className="text-sm font-medium hover:text-primary transition-colors">Admin Dashboard</a></Link>
            )}
            {currentUser?.role === 'job_seeker' && (
               <Link href="/dashboard"><a className="text-sm font-medium hover:text-primary transition-colors">My Applications</a></Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-muted">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full border shadow-sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 font-sans">
                  <div className="flex items-center justify-start gap-2 p-2 bg-muted/50 rounded-t-sm">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium truncate">{currentUser.legalName || currentUser.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{currentUser.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {currentUser.role === 'job_seeker' && (
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer w-full">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="hidden sm:flex">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button className="shadow-md">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <Link href="/">
                <a className="flex items-center space-x-2 mb-4 group">
                  <Briefcase className="h-6 w-6 text-primary" />
                  <span className="font-heading font-bold text-xl">JobPortal</span>
                </a>
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Connecting talent with opportunity. Find your dream job or the perfect candidate today with our advanced matching platform.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-foreground">For Job Seekers</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/"><a className="hover:text-primary transition-colors">Browse Jobs</a></Link></li>
                <li><Link href="/login"><a className="hover:text-primary transition-colors">Login</a></Link></li>
                <li><Link href="/register"><a className="hover:text-primary transition-colors">Register</a></Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-foreground">For Employers</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/register"><a className="hover:text-primary transition-colors">Post a Job</a></Link></li>
                <li><Link href="/login"><a className="hover:text-primary transition-colors">Employer Login</a></Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8">
            <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-wider font-semibold">Trusted by industry leaders</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Placeholder Logos */}
              <div className="h-8 flex items-center font-bold text-xl font-heading text-foreground/80">GOOGLE</div>
              <div className="h-8 flex items-center font-bold text-xl font-heading text-foreground/80">MICROSOFT</div>
              <div className="h-8 flex items-center font-bold text-xl font-heading text-foreground/80">AMAZON</div>
              <div className="h-8 flex items-center font-bold text-xl font-heading text-foreground/80">META</div>
              <div className="h-8 flex items-center font-bold text-xl font-heading text-foreground/80">NETFLIX</div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-10">
              © 2025 JobPortal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
