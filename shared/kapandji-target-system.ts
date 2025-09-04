export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface KapandjiTarget {
  score: number;
  name: string;
  landmarkIndex: number;
  description: string;
  position?: HandLandmark; // Calculated position for complex targets
}

export interface TargetState {
  currentTargetIndex: number;
  achievedTargets: number[];
  isTargetReached: boolean;
  maxScoreAchieved: number;
}

// Distance threshold for target achievement (same as calculator)
const ACHIEVEMENT_THRESHOLD = 0.055;

// Define the progressive target sequence for Kapandji assessment
export const KAPANDJI_TARGETS: KapandjiTarget[] = [
  { score: 1, name: 'Index Proximal Phalanx', landmarkIndex: 6, description: 'Touch radial side of index proximal phalanx' },
  { score: 2, name: 'Index Middle Phalanx', landmarkIndex: 7, description: 'Touch radial side of index middle phalanx' },
  { score: 3, name: 'Index Finger Tip', landmarkIndex: 8, description: 'Touch tip of index finger' },
  { score: 4, name: 'Middle Finger Tip', landmarkIndex: 12, description: 'Touch tip of middle finger' },
  { score: 5, name: 'Ring Finger Tip', landmarkIndex: 16, description: 'Touch tip of ring finger' },
  { score: 6, name: 'Little Finger Tip', landmarkIndex: 20, description: 'Touch tip of little finger' },
  { score: 7, name: 'Little DIP Joint', landmarkIndex: 19, description: 'Touch little finger DIP joint crease' },
  { score: 8, name: 'Little PIP Joint', landmarkIndex: 18, description: 'Touch little finger PIP joint crease' },
  { score: 9, name: 'Little MCP Joint', landmarkIndex: 17, description: 'Touch little finger MCP joint crease' },
  { score: 10, name: 'Distal Palmar Crease', landmarkIndex: -1, description: 'Touch distal palmar crease' } // Special case
];

function euclideanDistance(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + 
    Math.pow(a.y - b.y, 2) + 
    Math.pow(a.z - b.z, 2)
  );
}

function averageLandmarks(indices: number[], landmarks: HandLandmark[]): HandLandmark {
  const x = indices.reduce((sum, i) => sum + landmarks[i].x, 0) / indices.length;
  const y = indices.reduce((sum, i) => sum + landmarks[i].y, 0) / indices.length;
  const z = indices.reduce((sum, i) => sum + landmarks[i].z, 0) / indices.length;
  return { x, y, z };
}

export function getTargetPosition(target: KapandjiTarget, landmarks: HandLandmark[]): HandLandmark {
  if (landmarks.length !== 21) {
    throw new Error('MediaPipe hand landmarks must contain exactly 21 points');
  }

  // Special case for score 10 (distal palmar crease)
  if (target.score === 10) {
    return averageLandmarks([0, 9, 13, 17], landmarks);
  }

  // Regular landmark-based targets
  return landmarks[target.landmarkIndex];
}

export function checkTargetAchievement(
  thumbTip: HandLandmark, 
  target: KapandjiTarget, 
  landmarks: HandLandmark[]
): boolean {
  const targetPosition = getTargetPosition(target, landmarks);
  const distance = euclideanDistance(thumbTip, targetPosition);
  return distance < ACHIEVEMENT_THRESHOLD;
}

export function updateTargetState(
  currentState: TargetState,
  landmarks: HandLandmark[],
  bestEverScore: number | null
): TargetState {
  if (landmarks.length !== 21) {
    return currentState;
  }

  const thumbTip = landmarks[4];
  const maxTargetIndex = bestEverScore ? Math.min(bestEverScore, 10) - 1 : 2; // Default to score 3 for first-timers
  
  // Check if current target is achieved
  const currentTarget = KAPANDJI_TARGETS[currentState.currentTargetIndex];
  const isCurrentTargetReached = checkTargetAchievement(thumbTip, currentTarget, landmarks);
  
  let newState = { ...currentState };
  
  if (isCurrentTargetReached && !currentState.achievedTargets.includes(currentTarget.score)) {
    // Target achieved! Add to achieved targets
    newState.achievedTargets = [...currentState.achievedTargets, currentTarget.score];
    newState.maxScoreAchieved = Math.max(currentState.maxScoreAchieved, currentTarget.score);
    
    // Move to next target if we haven't reached the best score yet
    if (currentState.currentTargetIndex < maxTargetIndex) {
      newState.currentTargetIndex = currentState.currentTargetIndex + 1;
      newState.isTargetReached = false;
    } else {
      newState.isTargetReached = true;
    }
  } else {
    newState.isTargetReached = isCurrentTargetReached;
  }
  
  return newState;
}

export function initializeTargetState(bestEverScore: number | null): TargetState {
  return {
    currentTargetIndex: 0,
    achievedTargets: [],
    isTargetReached: false,
    maxScoreAchieved: 0
  };
}

export function getCurrentTarget(state: TargetState): KapandjiTarget {
  return KAPANDJI_TARGETS[state.currentTargetIndex];
}

export function getProgressMessage(state: TargetState, bestEverScore: number | null): string {
  const currentTarget = getCurrentTarget(state);
  const totalTargets = bestEverScore ? Math.min(bestEverScore, 10) : 3;
  const progress = state.achievedTargets.length;
  
  if (state.maxScoreAchieved >= (bestEverScore || 3)) {
    return `🎉 Excellent! You've matched your best score of ${bestEverScore}/10!`;
  }
  
  if (state.isTargetReached) {
    return `✅ Target ${currentTarget.score} achieved! ${currentTarget.description}`;
  }
  
  return `🎯 Target ${currentTarget.score}/${totalTargets}: ${currentTarget.description}`;
}
