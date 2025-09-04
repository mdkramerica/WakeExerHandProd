import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, CheckCircle, Download, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getKapandjiInterpretation } from "@shared/kapandji-interpretation";

interface KapandjiAssessment {
  userAssessment: {
    id: number;
    userId: number;
    assessmentId: number;
    sessionNumber: number;
    isCompleted: boolean;
    completedAt: string;
    qualityScore: number;
    kapandjiScore?: string;
    totalActiveRom?: string;
    handType?: string;
    injuryType: string;
  };
}

const KAPANDJI_LANDMARKS = [
  { level: 1, description: "Radial side of proximal phalanx of index finger", anatomical: "Index proximal phalanx" },
  { level: 2, description: "Radial side of middle phalanx of index finger", anatomical: "Index middle phalanx" },
  { level: 3, description: "Tip of index finger", anatomical: "Index fingertip" },
  { level: 4, description: "Tip of middle finger", anatomical: "Middle fingertip" },
  { level: 5, description: "Tip of ring finger", anatomical: "Ring fingertip" },
  { level: 6, description: "Tip of little finger", anatomical: "Little fingertip" },
  { level: 7, description: "DIP joint crease of little finger", anatomical: "Little DIP crease" },
  { level: 8, description: "PIP joint crease of little finger", anatomical: "Little PIP crease" },
  { level: 9, description: "MCP joint crease of little finger", anatomical: "Little MCP crease" },
  { level: 10, description: "Distal palmar crease", anatomical: "Distal palm crease" }
];

export default function AdminKapandjiResults() {
  const { patientCode, assessmentId } = useParams();
  const { toast } = useToast();

  // Download Kapandji assessment as JSON
  const handleJsonDownload = () => {
    window.open(`/api/user-assessments/${assessmentId}/download?format=json`, '_blank');
    
    toast({
      title: "Download Started",
      description: "Kapandji assessment data download has started."
    });
  };

  // Use the same working endpoint as patient side
  const { data: assessmentData, isLoading, error } = useQuery({
    queryKey: [`/api/user-assessments/${assessmentId}/details`],
    enabled: !!assessmentId
  });

  // Extract assessment data
  const userAssessment = (assessmentData as any)?.userAssessment;
  const kapandjiScore = parseFloat(userAssessment?.kapandjiScore || userAssessment?.totalActiveRom || '0');
  const interpretation = getKapandjiInterpretation(kapandjiScore);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Kapandji assessment results...</p>
        </div>
      </div>
    );
  }

  if (error || !userAssessment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Assessment Not Found</h3>
              <p className="text-red-600 mb-4">The requested Kapandji assessment could not be found.</p>
              <Link href="/admin">
                <Button>Return to Admin Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kapandji Assessment Results</h1>
              <p className="text-gray-600">Patient {patientCode} • Assessment #{assessmentId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleJsonDownload}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download JSON
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-teal-500">
            <CardHeader className="bg-teal-50">
              <CardTitle className="flex items-center gap-2 text-teal-900">
                <Target className="h-5 w-5" />
                Kapandji Score
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-black text-teal-600 mb-2">
                  {interpretation.score}/10
                </div>
                <div className="text-sm text-gray-600">Opposition Level</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Opposition Level</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center">
                <Badge variant={interpretation.color as any} className="text-lg px-4 py-2 mb-2">
                  {interpretation.level}
                </Badge>
                <div className="text-sm text-gray-600">{interpretation.description}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Assessment Info</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div><strong>Patient Code:</strong> {patientCode}</div>
                <div><strong>Assessment ID:</strong> {assessmentId}</div>
                <div><strong>Session:</strong> {userAssessment.sessionNumber || 1}</div>
                <div><strong>Quality:</strong> {userAssessment.qualityScore || 100}%</div>
                <div><strong>Hand Used:</strong> {userAssessment.handType || 'Unknown'}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clinical Interpretation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Clinical Interpretation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-6 rounded-lg border-2 ${interpretation.color}`}>
              <div className="text-lg font-medium mb-2">{interpretation.clinicalMeaning}</div>
              <div className="text-sm text-gray-600">
                The patient achieved thumb opposition to level {interpretation.score} on the Kapandji scale, 
                indicating {interpretation.level.toLowerCase()} thumb opposition function.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opposition Levels Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Opposition Levels Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {KAPANDJI_LANDMARKS.map((landmark) => {
                const achieved = kapandjiScore >= landmark.level;
                return (
                  <div 
                    key={landmark.level} 
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      achieved 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        achieved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {landmark.level}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{landmark.anatomical}</div>
                        <div className="text-sm text-gray-600">{landmark.description}</div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      achieved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {achieved ? 'Achieved' : 'Not Reached'}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Assessment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Assessment Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium">
                      {new Date(userAssessment.completedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session Number:</span>
                    <span className="font-medium">{userAssessment.sessionNumber || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality Score:</span>
                    <span className="font-medium">{userAssessment.qualityScore || 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hand Used:</span>
                    <span className="font-medium">{userAssessment.handType || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Score Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Raw Score:</span>
                    <span className="font-medium">{kapandjiScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Opposition Level:</span>
                    <span className="font-medium">Level {interpretation.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Function Level:</span>
                    <span className="font-medium">{interpretation.level}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
