# Wrist Practice Mode Implementation Documentation

## Overview

The Wrist Practice Mode is a standalone feature that allows users to practice wrist flexion and extension movements with real-time feedback. It includes a live gauge that shows current wrist angles and compares them to historical performance and normal range goals.

## Architecture

### Core Components

1. **Wrist Practice Page** (`client/src/pages/wrist-practice.tsx`)
2. **Live Wrist Gauge Component** (`client/src/components/live-wrist-gauge.tsx`)
3. **MediaPipe Integration** (via `holistic-tracker.tsx`)
4. **Wrist Angle Calculation** (`shared/wrist-calculator.ts`)

## Implementation Details

### 1. Wrist Practice Page (`wrist-practice.tsx`)

**Purpose**: Provides a dedicated practice environment for wrist movements without the formal assessment structure.

**Key Features**:
- Real-time wrist angle tracking
- Historical data comparison
- Live visual feedback via semicircle gauge
- Mobile-responsive design with touch gestures

**Dependencies**:
```typescript
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { calculateWristAngles } from "@shared/wrist-calculator";
import LiveWristGauge from "@/components/live-wrist-gauge";
import HolisticTracker from "@/components/holistic-tracker";
```

**State Management**:
```typescript
const [currentAngles, setCurrentAngles] = useState({ flexion: 0, extension: 0 });
const [historicalWristData, setHistoricalWristData] = useState({
  maxFlexion: 0,
  maxExtension: 0
});
const [isTracking, setIsTracking] = useState(false);
```

**Data Flow**:
1. Fetch user's historical wrist data via React Query
2. Initialize MediaPipe for real-time pose detection
3. Process landmarks through wrist angle calculator
4. Update live gauge with current angles
5. Compare against historical maximums

### 2. Live Wrist Gauge Component (`live-wrist-gauge.tsx`)

**Purpose**: Visual feedback component that displays current wrist angles in a semicircle gauge format.

**Key Features**:
- SVG-based semicircle visualization
- Real-time angle updates (30fps)
- Color-coded feedback (green/yellow/red zones)
- Historical comparison indicators
- Smooth animations with CSS transitions

**Gauge Design**:
```typescript
// Semicircle parameters
const radius = 80;
const centerX = 100;
const centerY = 100;
const startAngle = 180; // Start at left (180°)
const endAngle = 360;   // End at right (360°/0°)
```

**Angle Mapping**:
- **Flexion Range**: 0° to 90° (mapped to left half of semicircle)
- **Extension Range**: 0° to 70° (mapped to right half of semicircle)
- **Normal Ranges**: 
  - Flexion: 0-80° (target range)
  - Extension: 0-70° (target range)

**Color Coding**:
- **Green**: Within normal range
- **Yellow**: Approaching limits
- **Red**: Exceeding normal range or poor tracking quality

### 3. MediaPipe Integration

**Real-time Processing**:
```typescript
const handleResults = (results: any) => {
  if (results.poseLandmarks) {
    try {
      const angles = calculateWristAngles(results.poseLandmarks);
      if (angles && (angles.flexion > 0 || angles.extension > 0)) {
        setCurrentAngles({
          flexion: Math.max(0, angles.flexion),
          extension: Math.max(0, angles.extension)
        });
      }
    } catch (error) {
      console.error('Error calculating wrist angles:', error);
    }
  }
};
```

**Performance Optimizations**:
- Throttled updates at 30fps
- Error boundary handling
- Automatic cleanup on component unmount

### 4. Historical Data Integration

**Data Fetching**:
```typescript
const { data: userHistory } = useQuery({
  queryKey: [`/api/users/by-code/${userCode}/history`],
  enabled: !!userCode,
  staleTime: 30000, // Cache for 30 seconds
});
```

**Data Processing**:
```typescript
useEffect(() => {
  if (userHistory && typeof userHistory === 'object' && 'history' in userHistory && Array.isArray((userHistory as any).history)) {
    const wristAssessments = (userHistory as any).history.filter((assessment: any) => 
      assessment.assessmentName?.toLowerCase().includes('wrist') ||
      assessment.assessmentName?.toLowerCase().includes('flexion') ||
      assessment.assessmentName?.toLowerCase().includes('extension')
    );
    
    if (wristAssessments.length > 0) {
      const maxFlexion = Math.max(...wristAssessments.map((a: any) => parseFloat(a.maxWristFlexion) || 0));
      const maxExtension = Math.max(...wristAssessments.map((a: any) => parseFloat(a.maxWristExtension) || 0));
      
      setHistoricalWristData({ maxFlexion, maxExtension });
    }
  }
}, [userHistory]);
```

## Integration Points

### 1. Main Application Routes

**Added to `client/src/App.tsx`**:
```typescript
import WristPractice from "./pages/wrist-practice";

// Route definition
<Route path="/wrist-practice/:userCode?" component={WristPractice} />
```

### 2. Assessment Recording Integration

**Enhanced `client/src/pages/recording.tsx`**:
- Added `LiveWristGauge` component for real-time feedback during assessments
- Integrated historical data comparison
- Maintained existing assessment flow while adding live feedback

**Integration Code**:
```typescript
{assessment?.name?.toLowerCase().includes('wrist') && (
  <div className="mt-6">
    <LiveWristGauge
      currentFlexion={currentWristAngles.flexion}
      currentExtension={currentWristAngles.extension}
      historicalMaxFlexion={historicalWristData.maxFlexion}
      historicalMaxExtension={historicalWristData.maxExtension}
      className="mx-auto"
    />
  </div>
)}
```

### 3. Assessment Replay Integration

**Enhanced `client/src/components/assessment-replay.tsx`**:
- Added live gauge for replay visualization
- Shows historical angles during motion replay
- Maintains synchronization with replay timeline

## Technical Challenges Solved

### 1. React Query Hook Ordering

**Problem**: `userHistory` was accessed before initialization, causing runtime errors.

**Solution**: Moved `useQuery` hooks before `useEffect` dependencies:
```typescript
// ✅ Correct order
const { data: userHistory } = useQuery({ ... });
const { data: assessmentData } = useQuery({ ... });

useEffect(() => {
  if (userHistory?.history) {
    // Process data
  }
}, [userHistory]);
```

### 2. Type Safety with Dynamic Data

**Problem**: Historical data structure was dynamically typed, causing TypeScript errors.

**Solution**: Implemented proper type guards:
```typescript
if (userHistory && typeof userHistory === 'object' && 'history' in userHistory && Array.isArray((userHistory as any).history)) {
  // Safe to access userHistory.history
}
```

### 3. Performance Optimization

**Problem**: Real-time angle calculations causing frame drops.

**Solution**: 
- Throttled updates to 30fps
- Implemented error boundaries
- Added stale time caching for historical data

### 4. Mobile Responsiveness

**Problem**: Touch interface needed for mobile users.

**Solution**: Integrated touch gesture handling:
```typescript
const { attachGestures } = useTouchGestures({
  onSwipeRight: () => navigate('/patient/dashboard'),
  onSwipeLeft: () => console.log('Future: Could trigger retake')
});
```

## User Experience Features

### 1. Visual Feedback

- **Real-time gauge**: Shows current wrist position
- **Historical markers**: Indicates personal best performance
- **Color coding**: Intuitive feedback (green = good, red = needs attention)
- **Smooth animations**: CSS transitions for fluid movement

### 2. Accessibility

- **High contrast colors**: Ensures visibility for all users
- **Large touch targets**: Mobile-friendly interaction
- **Clear instructions**: Step-by-step guidance
- **Error messaging**: Helpful feedback when tracking fails

### 3. Mobile Optimization

- **Responsive design**: Adapts to all screen sizes
- **Touch gestures**: Swipe navigation
- **Camera permissions**: Proper handling of mobile camera access
- **Reduced motion options**: Respects user preferences

## API Endpoints Used

### 1. User History
- **Endpoint**: `/api/users/by-code/{userCode}/history`
- **Purpose**: Fetch historical wrist assessment data
- **Response**: Array of past assessments with wrist angle metrics

### 2. User Lookup
- **Endpoint**: `/api/users/by-code/{userCode}`
- **Purpose**: Validate user and get basic info
- **Response**: User object with ID and metadata

## File Structure

```
client/src/
├── pages/
│   ├── wrist-practice.tsx          # Main practice page
│   ├── recording.tsx               # Enhanced with live gauge
│   └── patient-daily-dashboard.tsx # Navigation entry point
├── components/
│   ├── live-wrist-gauge.tsx        # Gauge visualization
│   ├── holistic-tracker.tsx        # MediaPipe integration
│   └── assessment-replay.tsx       # Enhanced with live gauge
└── shared/
    └── wrist-calculator.ts         # Angle calculation logic
```

## Future Enhancements

### 1. Progress Tracking
- Daily improvement metrics
- Weekly/monthly progress reports
- Goal setting and achievement tracking

### 2. Exercise Variations
- Guided exercise routines
- Difficulty levels
- Custom exercise creation

### 3. Gamification
- Achievement badges
- Progress streaks
- Social sharing features

### 4. Advanced Analytics
- Movement quality scoring
- Detailed biomechanical analysis
- Injury prevention insights

## Testing Strategy

### 1. Unit Tests
- Wrist angle calculation accuracy
- Component state management
- API integration mocking

### 2. Integration Tests
- MediaPipe camera access
- Real-time data flow
- Historical data processing

### 3. User Acceptance Tests
- Cross-browser compatibility
- Mobile device testing
- Accessibility compliance

## Performance Metrics

### 1. Real-time Processing
- **Target**: 30 FPS angle calculations
- **Latency**: <50ms from detection to display
- **Accuracy**: ±2° angle precision

### 2. Data Loading
- **Historical data**: <2 seconds initial load
- **Caching**: 30-second stale time for efficiency
- **Error recovery**: Automatic retry with exponential backoff

## Deployment Considerations

### 1. Browser Compatibility
- **Chrome/Edge**: Full MediaPipe support
- **Firefox**: Experimental WebGL support
- **Safari**: Limited MediaPipe capabilities
- **Mobile browsers**: Camera permission handling

### 2. Performance Requirements
- **Minimum**: Dual-core processor, 4GB RAM
- **Recommended**: Quad-core processor, 8GB RAM
- **Camera**: 720p minimum resolution
- **Internet**: Stable connection for data synchronization

## Conclusion

The Wrist Practice Mode successfully integrates real-time motion tracking with historical data comparison to provide users with immediate feedback on their wrist movement exercises. The implementation demonstrates effective use of modern web technologies (React, MediaPipe, SVG) while maintaining performance and accessibility standards.

The modular architecture allows for easy extension and integration with other assessment types, making it a valuable addition to the hand assessment compliance portal ecosystem.

