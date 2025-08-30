import { Shield, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import exerLogoPath from "@assets/ExerLogoColor_1750399504621.png";

export default function Header() {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem('currentUser');
    // Navigate back to landing page
    setLocation("/");
  };

  // Check if user is logged in and not on landing page
  const currentUser = sessionStorage.getItem('currentUser');
  const isLoggedIn = !!currentUser;
  const isOnLandingPage = location === "/";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative z-10">
      <div className="max-w-7xl mx-auto px-1 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-10 sm:h-16">
          <div className="flex items-center space-x-1 sm:space-x-3">
            <img 
              src={exerLogoPath} 
              alt="Exer AI Logo" 
              className="h-4 sm:h-8 w-auto"
            />
            <div>
              <h1 className="text-xs sm:text-xl font-semibold text-exer-navy">ROM Research Platform</h1>
              <p className="text-xs sm:text-sm text-exer-gray hidden sm:block">Hand & Wrist Recovery Assessment</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-exer-gray">
              <Shield className="w-4 h-4 text-exer-purple" />
              <span>Secure & Private</span>
            </div>
            {isLoggedIn && !isOnLandingPage && (
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 min-h-[24px] px-1 text-xs"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
