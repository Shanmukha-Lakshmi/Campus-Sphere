import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 px-4 md:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-serif font-bold text-primary">
              Campusphere
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-primary font-medium">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="btn-primary-gradient">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-card border-b border-border shadow-lg animate-slide-up">
            <div className="flex flex-col p-4 gap-4">
              <a href="#features" className="nav-link py-2" onClick={() => setIsOpen(false)}>Features</a>
              <a href="#how-it-works" className="nav-link py-2" onClick={() => setIsOpen(false)}>How It Works</a>
              <a href="#about" className="nav-link py-2" onClick={() => setIsOpen(false)}>About</a>
              <a href="#contact" className="nav-link py-2" onClick={() => setIsOpen(false)}>Contact</a>
              <hr className="border-border" />
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-primary">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button className="btn-primary-gradient w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
