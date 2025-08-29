import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Play, Info, AlertTriangle, CheckCircle } from "lucide-react";
import ProgressBar from "@/components/progress-bar";
import { apiRequest } from "@/lib/queryClient";

export default function VideoInstruction() {
  const { id, code } = useParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [videoWatched, setVideoWatched] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else if (code) {
      // If we have a code parameter, try to verify and set the user
      fetch(`/api/users/by-code/${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setCurrentUser(data.user);
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
          } else {
            setLocation("/");
          }
        })
        .catch(() => setLocation("/"));
    } else {
      setLocation("/");
    }
  }, [setLocation, code]);

  const { data: assessmentData, isLoading } = useQuery({
    queryKey: [`/api/assessments/${id}`],
    enabled: !!id,
  });

  const startAssessmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/users/${currentUser.id}/assessments/${id}/start`);
      return response;
    },
  });

  const handleVideoPlay = () => {
    // In a real implementation, this would control actual video playback
    setVideoWatched(true);
  };

  const handleProceedToRecording = () => {
    console.log('🎬 VIDEO INSTRUCTION: Navigating to recording page (NO auto-start)');
    // Remove the auto-start mutation - let the recording page handle it properly
    // startAssessmentMutation.mutate(); // REMOVED: This was auto-starting recording
    const recordUrl = code ? `/assessment/${id}/record/${code}` : `/assessment/${id}/record`;
    setLocation(recordUrl);
  };

  const handleBack = () => {
    const backUrl = code ? `/patient/${code}/dashboard` : "/patient";
    setLocation(backUrl);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="medical-card">
          <CardContent>
            <div className="text-center py-8">Loading assessment...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assessment = (assessmentData as any)?.assessment;

  if (!assessment) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="medical-card">
          <CardContent>
            <div className="text-center py-8">Assessment not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="medical-card">
        <CardContent>
          <div className="mb-8">
            <ProgressBar currentStep={3} totalSteps={3} />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Assessment Instructions</h2>
            <p className="text-medical-gray">
              Follow these instructions carefully to perform the {assessment.name.toLowerCase()} assessment.
            </p>
          </div>

          {/* Prominent Instructions Section */}
          {assessment.instructions && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Info className="w-6 h-6 text-blue-600 mr-3" />
                How to Perform This Assessment
              </h3>
              <p className="text-lg text-gray-800 leading-relaxed">{assessment.instructions}</p>
            </div>
          )}

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <div className="bg-gray-900 rounded-xl aspect-video mb-4 lg:mb-6 relative overflow-hidden min-h-[250px] sm:min-h-[400px] lg:min-h-[500px]">
                <video 
                  controls
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-contain"
                  onPlay={handleVideoPlay}
                  preload="metadata"
                >
                  <source src={assessment.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              
              <div className="text-center space-y-3">
                <Button
                  onClick={handleProceedToRecording}
                  className="medical-button w-full h-12 lg:h-auto text-lg lg:text-base"
                >
                  Ready to Record
                  <ArrowRight className="w-5 h-5 lg:w-4 lg:h-4 ml-2" />
                </Button>
                {!videoWatched && (
                  <p className="text-xs text-gray-600 mt-2">
                    You can proceed directly to recording or watch the video first for guidance
                  </p>
                )}
                {videoWatched && (
                  <div className="flex items-center justify-center text-sm text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Video watched - ready to proceed
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Info className="w-5 h-5 text-medical-blue mr-2" />
                  Assessment Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-800">Assessment:</span>
                    <span className="font-medium">{assessment.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">Duration:</span>
                    <span className="font-medium">{assessment.duration} seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">Repetitions:</span>
                    <span className="font-medium">{assessment.repetitions} times</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-gray-800 mr-2" />
                  Important Reminders
                </h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-800 mr-2 mt-0.5 flex-shrink-0" />
                    Ensure good lighting and clear camera view
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-800 mr-2 mt-0.5 flex-shrink-0" />
                    Keep your hand in frame throughout the movement
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-800 mr-2 mt-0.5 flex-shrink-0" />
                    Move slowly and smoothly as demonstrated
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-800 mr-2 mt-0.5 flex-shrink-0" />
                    Stop if you experience pain or discomfort
                  </li>
                </ul>
              </div>



              <div className="text-center pt-4">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="flex items-center text-gray-800 hover:text-gray-900 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assessment List
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
