import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Target, Clock, Zap } from 'lucide-react';
import { Link } from 'wouter';

interface NextAssessmentCTAProps {
  userCode: string;
  onClose: () => void;
  compact?: boolean;
}

export function NextAssessmentCTA({ userCode, onClose, compact = false }: NextAssessmentCTAProps) {
  // Get today's assessments to find the next one
  const { data: todayAssessments, isLoading } = useQuery({
    queryKey: [`/api/patients/${userCode}/daily-assessments`],
    enabled: !!userCode,
  });

  if (isLoading || !todayAssessments) {
    return null;
  }

  // Find the next incomplete assessment
  const nextAssessment = Array.isArray(todayAssessments) 
    ? todayAssessments.find((assessment: any) => !assessment.isCompleted)
    : null;

  if (!nextAssessment) {
    // All assessments completed for today
    if (compact) {
      return (
        <Button 
          onClick={onClose}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 text-sm"
        >
          ✓ All Complete - Dashboard
        </Button>
      );
    }
    
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg">
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-2">
              🎉 All Assessments Complete!
            </h3>
            <p className="text-green-800 font-medium mb-4">
              Outstanding work! You've completed all your assessments for today. Keep up the great progress!
            </p>
            <Button 
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3"
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact version - just the button
  if (compact) {
    return (
      <Link href={nextAssessment.assessmentUrl}>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-sm"
        >
          <Target className="w-4 h-4 mr-2" />
          Complete Next Assessment
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    );
  }

  // Full version - original large card
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-xl">
      <CardContent className="pt-6 pb-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-blue-900 mb-2">
            Keep Your Momentum Going! 🚀
          </h3>
          <p className="text-blue-800 font-medium mb-4">
            You're doing great! Complete your next assessment to maintain your recovery progress.
          </p>
          
          {/* Next Assessment Details */}
          <div className="bg-white rounded-lg p-4 mb-6 border border-blue-200">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-gray-900 text-lg">{nextAssessment.name}</h4>
            </div>
            <p className="text-gray-700 mb-3">{nextAssessment.description}</p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{nextAssessment.estimatedMinutes} minutes</span>
              </div>
              {nextAssessment.isRequired && (
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                  Required
                </span>
              )}
            </div>
          </div>

          {/* Call to Action Button */}
          <Link href={nextAssessment.assessmentUrl}>
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 text-lg shadow-lg transform transition-all duration-200 hover:scale-105"
            >
              <Target className="w-5 h-5 mr-2" />
              Complete Next Assessment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          
          <p className="text-blue-600 text-sm mt-3 font-medium">
            ✨ Stay consistent with your recovery journey
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
