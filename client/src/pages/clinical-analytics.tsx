import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface CohortAnalytics {
  cohortId: number;
  cohortName: string;
  patientCount: number;
  avgTamScore: number;
  avgKapandjiScore: number;
  avgWristFlexion: number;
  avgWristExtension: number;
  stdDevTamScore: number;
  stdDevKapandjiScore: number;
  stdDevWristFlexion: number;
  stdDevWristExtension: number;
}

interface PatientAssessment {
  id: number;
  patientId: number;
  assessmentDate: string;
  tamScore: number;
  kapandjiScore: number;
  wristFlexionAngle: number;
  wristExtensionAngle: number;
  percentOfNormalRom: number;
  deviceConfidenceScore: number;
}

export default function ClinicalAnalytics() {
  const { hasRole } = useAuth();
  const [selectedCohort, setSelectedCohort] = useState<string>('all');

  const { data: cohorts } = useQuery({
    queryKey: ['/api/cohorts'],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<CohortAnalytics>({
    queryKey: [`/api/cohorts/${selectedCohort}/analytics`],
    enabled: selectedCohort !== 'all' && selectedCohort !== '',
  });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery<PatientAssessment[]>({
    queryKey: [`/api/cohorts/${selectedCohort}/assessments`],
    enabled: selectedCohort !== 'all' && selectedCohort !== '',
  });

  // Process assessment data for charts by days post surgery
  const processedData = assessments?.reduce((acc: any, assessment: any) => {
    const assessmentDate = new Date(assessment.assessmentDate);
    
    // Calculate days post surgery - using a baseline date for demonstration
    // In a real implementation, this would use patient.surgeryDate
    const baseDate = new Date('2025-01-01'); // Placeholder for surgery date
    const daysDiff = Math.floor((assessmentDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Group into meaningful post-surgery time periods
    let timeKey;
    if (daysDiff <= 14) {
      timeKey = `Day ${daysDiff}`;
    } else if (daysDiff <= 30) {
      const weekNumber = Math.floor(daysDiff / 7);
      timeKey = `Week ${weekNumber}`;
    } else if (daysDiff <= 90) {
      const weekNumber = Math.floor(daysDiff / 7);
      timeKey = `Week ${weekNumber}`;
    } else {
      const monthNumber = Math.floor(daysDiff / 30);
      timeKey = `Month ${monthNumber}`;
    }
    
    if (!acc[timeKey]) {
      acc[timeKey] = {
        period: timeKey,
        dayRange: daysDiff,
        tamScores: [],
        kapandjiScores: [],
        wristFlexionScores: [],
        romPercentages: [],
      };
    }
    
    if (assessment.tamScore) acc[timeKey].tamScores.push(Number(assessment.tamScore));
    if (assessment.kapandjiScore) acc[timeKey].kapandjiScores.push(Number(assessment.kapandjiScore));
    if (assessment.wristFlexionAngle) acc[timeKey].wristFlexionScores.push(Number(assessment.wristFlexionAngle));
    if (assessment.percentOfNormalRom) acc[timeKey].romPercentages.push(Number(assessment.percentOfNormalRom));
    
    return acc;
  }, {} as Record<string, any>) || {};
  
  // Debug logging
  console.log('Assessments data:', assessments?.slice(0, 3));
  console.log('Processed data:', processedData);
  console.log('Chart data:', Object.values(processedData).slice(0, 3));

  const chartData = Object.values(processedData).map((period: any) => ({
    period: period.period,
    dayRange: period.dayRange,
    avgTamScore: period.tamScores.length > 0 ? 
      Math.round((period.tamScores.reduce((a: number, b: number) => a + b, 0) / period.tamScores.length) * 10) / 10 : null,
    avgKapandjiScore: period.kapandjiScores.length > 0 ? 
      Math.round((period.kapandjiScores.reduce((a: number, b: number) => a + b, 0) / period.kapandjiScores.length) * 10) / 10 : null,
    avgWristFlexion: period.wristFlexionScores.length > 0 ? 
      Math.round((period.wristFlexionScores.reduce((a: number, b: number) => a + b, 0) / period.wristFlexionScores.length) * 10) / 10 : null,
    avgRomPercent: period.romPercentages.length > 0 ? 
      Math.round((period.romPercentages.reduce((a: number, b: number) => a + b, 0) / period.romPercentages.length) * 10) / 10 : null,
    patientCount: Math.max(
      period.tamScores.length,
      period.kapandjiScores.length,
      period.wristFlexionScores.length,
      period.romPercentages.length
    ),
  })).sort((a, b) => {
    return (a.dayRange || 0) - (b.dayRange || 0);
  });

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          exportType: 'cohort_data',
          filters: { cohortId: selectedCohort !== 'all' ? selectedCohort : null },
        }),
      });

      if (response.ok) {
        const { downloadUrl } = await response.json();
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Cohort performance metrics and trends
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExportData} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Cohort Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Cohort</CardTitle>
          <CardDescription>
            Choose a cohort to view detailed analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCohort} onValueChange={setSelectedCohort}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cohorts</SelectItem>
              {cohorts?.map((cohort: any) => (
                <SelectItem key={cohort.id} value={cohort.id.toString()}>
                  {cohort.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCohort === 'all' ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Select a Cohort</h3>
              <p className="text-muted-foreground">
                Choose a specific cohort to view detailed analytics and patient trends.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Analytics Overview */}
          {analyticsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : analytics ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.patientCount}</div>
                  <p className="text-xs text-muted-foreground">
                    In {analytics.cohortName}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg TAM Score</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.avgTamScore ? Number(analytics.avgTamScore).toFixed(1) : 'N/A'}</div>
                  <p className="text-xs text-muted-foreground">
                    ±{analytics.stdDevTamScore ? Number(analytics.stdDevTamScore).toFixed(1) : 'N/A'} std dev
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Kapandji</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.avgKapandjiScore ? Number(analytics.avgKapandjiScore).toFixed(1) : 'N/A'}</div>
                  <p className="text-xs text-muted-foreground">
                    ±{analytics.stdDevKapandjiScore ? Number(analytics.stdDevKapandjiScore).toFixed(1) : 'N/A'} std dev
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Wrist Flexion</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.avgWristFlexion ? Number(analytics.avgWristFlexion).toFixed(1) : 'N/A'}°</div>
                  <p className="text-xs text-muted-foreground">
                    ±{analytics.stdDevWristFlexion ? Number(analytics.stdDevWristFlexion).toFixed(1) : 'N/A'}° std dev
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No analytics data available for this cohort.
              </AlertDescription>
            </Alert>
          )}

          {/* Trend Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Trends</CardTitle>
                <CardDescription>
                  Recovery progression by days post surgery
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assessmentsLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          value !== null ? value : 'No data', 
                          name
                        ]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="avgTamScore" 
                        stroke="#8884d8" 
                        name="TAM Score"
                        strokeWidth={2}
                        connectNulls={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgKapandjiScore" 
                        stroke="#82ca9d" 
                        name="Kapandji Score"
                        strokeWidth={2}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No assessment data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROM Progress</CardTitle>
                <CardDescription>
                  Range of motion improvement over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assessmentsLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          value !== null ? value : 'No data', 
                          name
                        ]}
                      />
                      <Legend />
                      <Bar 
                        dataKey="avgWristFlexion" 
                        fill="#8884d8" 
                        name="Wrist Flexion (°)"
                      />
                      <Bar 
                        dataKey="avgRomPercent" 
                        fill="#82ca9d" 
                        name="ROM %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No ROM data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Patient Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Activity</CardTitle>
              <CardDescription>
                Assessment volume and patient engagement by recovery timeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessmentsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="patientCount" 
                      fill="#ffc658" 
                      name="Active Patients"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No activity data available
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!hasRole(['clinician', 'admin', 'researcher']) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view analytics data.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}