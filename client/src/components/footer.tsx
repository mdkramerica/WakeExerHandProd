import { Shield, Lock, ShieldX } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-6 mb-4 md:mb-0">
            <div className="text-sm text-gray-800">
              © 2025 ROM Research Platform.
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-800">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
              <a href="/admin" className="hover:text-blue-600 transition-colors font-medium">Clinical Portal</a>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-800">
            <Link href="/overview">
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                Browse All Assessments
              </Button>
            </Link>
            <div className="flex items-center">
              <Shield className="w-4 h-4 text-green-600 mr-1" />
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
