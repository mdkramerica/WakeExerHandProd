import React from 'react';
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useLocation } from "wouter";

interface PatientHeaderProps {
  patientCode: string;
  patientAlias?: string;
}

export function PatientHeader({ patientCode, patientAlias }: PatientHeaderProps) {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    // Clear any stored patient session data
    localStorage.removeItem('patientCode');
    localStorage.removeItem('patientSession');
    
    // Redirect to login/verification page
    setLocation('/');
    
    // Optional: Show confirmation
    console.log('Patient logged out successfully');
  };

  return (
    <div className="patient-header bg-white border-b border-gray-200 px-2 sm:px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto min-h-[44px]">
        {/* Patient Info */}
        <div className="flex items-center gap-1 sm:gap-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-md">
            <User className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">
              {patientCode}
            </span>
          </div>
          <span className="text-xs text-gray-500 hidden sm:inline">Code: {patientCode}</span>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-1 text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 min-h-[32px] px-2 text-xs"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </div>
  );
}