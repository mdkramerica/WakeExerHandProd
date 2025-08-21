import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, CheckCircle, AlertCircle, TrendingUp, Activity, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function DailyAssessments() {
  // Get user code from sessionStorage or URL
  const storedUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  const userCode = storedUser.code || localStorage.getItem('currentUserCode') || 'DEMO01';
  const userId = storedUser.id || 1;

  const { data: user } = useQuery({
    queryKey: [`/api/users/by-code/${userCode}`],
  });

  const { data: progress } = useQuery({
    queryKey: [`/api/users/${userId}/progress`],
    enabled: !!userId,
  });

  const { data: todaysAssessments } = useQuery({
    queryKey: [`/api/users/${userId}/assessments/today`],
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const injuryType = user?.user?.injuryType;
  
  // Calculate days remaining
  const studyDuration = injuryType === 'Trigger Finger' || injuryType === 'Metacarpal ORIF' || injuryType === 'Phalanx Fracture' ? 28 : 84;
  const createdDate = new Date(user?.user?.createdAt || Date.now());
  const currentDate = new Date();
  const daysSinceStart = Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, studyDuration - daysSinceStart);
  const currentDay = daysSinceStart + 1;

  const assessments = todaysAssessments?.assessments || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'due_today': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'due_today': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed Today';
      case 'due_today': return 'Due Today';
      default: return 'Available';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Daily Assessments</h1>
            <p className="text-muted-foreground">
              Complete your daily assessments to track your recovery progress
            </p>
          </div>
          
          {/* Navigation Hub */}
          <div className="flex gap-2">
            <Link href={`/assessment-list/${userCode}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <Link href="/progress">
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Progress
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Study Progress Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Study Progress
              </CardTitle>
              <CardDescription>
                {user?.user?.injuryType} Recovery Study
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">Day {currentDay}</div>
              <div className="text-sm text-muted-foreground">
                {daysRemaining} days remaining
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Today's Progress</span>
              <span className="text-sm text-muted-foreground">
                {progress?.completed || 0} of {progress?.total || 0} completed
              </span>
            </div>
            <Progress value={progress?.percentage || 0} />
            <div className="flex items-center justify-between text-sm">
              <span>Study Duration: {studyDuration} days</span>
              <Link href="/progress">
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Progress Charts
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Assessments</CardTitle>
          <CardDescription>
            Complete each assessment once per day to track your recovery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{assessment.name}</h3>
                    <Badge className={getStatusColor(assessment.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(assessment.status)}
                        {getStatusText(assessment.status)}
                      </div>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {assessment.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.floor(assessment.duration / 60)} min
                    </span>
                    {assessment.lastScore && (
                      <span>
                        Last score: {assessment.lastScore}
                        {assessment.name.includes('Kapandji') ? '' : '°'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {assessment.status === 'completed' ? (
                    <Button variant="outline" disabled>
                      Completed
                    </Button>
                  ) : (
                    <Link href={`/assessment/${assessment.id}/video/${userCode}`}>
                      <Button>Start Assessment</Button>
                    </Link>
                  )}
                  {assessment.status === 'completed' && (
                    <Link href={`/wrist-results/${userCode}/${assessment.lastUserAssessmentId || 1}`}>
                      <Button variant="ghost" size="sm">
                        View Results
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {assessments.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Assessments Available</h3>
              <p className="text-muted-foreground">
                Your daily assessments will appear here when available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}