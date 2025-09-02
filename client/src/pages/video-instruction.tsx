import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Play, Info, AlertTriangle, CheckCircle } from "lucide-react";
import ProgressBar from "@/components/progress-bar";
import { apiRequest } from "@/lib/queryClient";
import { useDeviceDetection } from "@/hooks/use-device-detection";

export default function VideoInstruction() {
  const { id, code } = useParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [videoWatched, setVideoWatched] = useState(false);
  const [, setLocation] = useLocation();
  const deviceInfo = useDeviceDetection();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else if (code) {
      // If we have a code parameter, try to verify and set the user
      fetch(`${import.meta.env.VITE_API_URL}/api/users/by-code/${code}`)
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

  // Auto-start video with fallback for autoplay restrictions
  useEffect(() => {
    const attemptAutoplay = async () => {
      if (videoRef.current && assessmentData?.assessment) {
        try {
          // Try to play the video automatically
          await videoRef.current.play();
          // Video autoplay successful - no console logging needed
        } catch (error) {
          // Autoplay blocked - this is expected behavior in many browsers
          // Autoplay was blocked, but that's okay - the video will be ready to play
          // when user clicks the play button or interacts with the page
        }
      }
    };

    // Small delay to ensure video element is fully loaded
    const timer = setTimeout(attemptAutoplay, 500);
    return () => clearTimeout(timer);
  }, [assessmentData?.assessment]);

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
      <div className="w-full">
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
      <div className="w-full">
        <Card className="medical-card">
          <CardContent>
            <div className="text-center py-8">Assessment not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
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

          <div className="flex flex-col gap-6">
            <div className="w-full">
              <div className="bg-gray-900 rounded-xl mb-4 lg:mb-6 relative overflow-hidden" style={{ 
                aspectRatio: deviceInfo.isMobile ? 'auto' : '16/9',
                minHeight: deviceInfo.isMobile ? '300px' : '350px',
                maxHeight: deviceInfo.isMobile ? '70vh' : '400px'
              }}>
                <video 
                  ref={videoRef}
                  controls
                  autoPlay // Always attempt autoplay on all devices
                  loop
                  muted // Required for autoplay to work in most browsers
                  playsInline // Critical for iOS Safari
                  {...(deviceInfo.isIOS && { 'webkit-playsinline': 'true' })} // Legacy iOS support
                  className="w-full h-full object-contain"
                  onPlay={handleVideoPlay}
                  preload="metadata" // Load video metadata to prepare for autoplay
                  onLoadedData={() => {
                    // Additional attempt to play when video data is loaded
                    if (videoRef.current) {
                      videoRef.current.play().catch(() => {
                        // Silently handle autoplay failures - this is expected in many browsers
                        // Video will be available for manual play via controls
                      });
                    }
                  }}
                  onError={(e) => {
                    // Handle video loading errors gracefully
                    console.warn('Video failed to load, using fallback message');
                  }}
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

            {/* Assessment Details and Reminders - Now in separate section */}
            <div className="w-full space-y-4 lg:space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 lg:p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm lg:text-base">
                  <Info className="w-4 h-4 lg:w-5 lg:h-5 text-medical-blue mr-2" />
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

              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 lg:p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm lg:text-base">
                  <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-gray-800 mr-2" />
                  Important Reminders
                </h3>
                <ul className="text-xs lg:text-sm text-gray-700 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-gray-800 mr-2 mt-0.5 flex-shrink-0" />
                    Ensure good lighting and clear camera view
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-gray-800 mr-2 mt-0.5 flex-shrink-0" />
                    Keep your hand in frame throughout the movement
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-gray-800 mr-2 mt-0.5 flex-shrink-0" />
                    Move slowly and smoothly as demonstrated
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-gray-800 mr-2 mt-0.5 flex-shrink-0" />
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
