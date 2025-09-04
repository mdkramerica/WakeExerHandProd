export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface KapandjiScore {
  maxScore: number;
  reachedLandmarks: string[];
  details: {
    indexProximalPhalanx: boolean;    // Score 1: Radial side of proximal phalanx of index
    indexMiddlePhalanx: boolean;      // Score 2: Radial side of middle phalanx of index
    indexTip: boolean;                // Score 3: Tip of index finger
    middleTip: boolean;               // Score 4: Tip of middle finger
    ringTip: boolean;                 // Score 5: Tip of ring finger
    littleTip: boolean;               // Score 6: Tip of little finger
    littleDipCrease: boolean;         // Score 7: DIP joint crease of little finger
    littlePipCrease: boolean;         // Score 8: PIP joint crease of little finger
    littleMcpCrease: boolean;         // Score 9: MCP joint crease of little finger
    distalPalmarCrease: boolean;      // Score 10: Distal palmar crease
  };
}

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

export function calculateKapandjiScore(landmarks: HandLandmark[]): KapandjiScore {
  if (landmarks.length !== 21) {
    throw new Error('MediaPipe hand landmarks must contain exactly 21 points');
  }

  const thumbTip = landmarks[4];
  
  // Define anatomical targets with correct Kapandji scoring locations
  // Kapandji scoring: 1=Index proximal radial, 2=Index middle radial, 3=Index tip, 
  // 4=Middle tip, 5=Ring tip, 6=Little tip, 7=Little DIP, 8=Little PIP, 9=Little MCP, 10=Distal palmar crease
  // Increased threshold to 0.055 for more clinically appropriate contact detection
  // This accounts for MediaPipe coordinate system and real-world hand anatomy
  const THRESHOLD = 0.055; // Distance threshold for contact detection
  
  // Calculate anatomical landmarks based on MediaPipe hand structure
  // Index finger landmarks: 5=MCP, 6=PIP, 7=DIP, 8=TIP
  const indexProximalSide = landmarks[6]; // Approximate radial side of proximal phalanx
  const indexMiddleSide = landmarks[7]; // Approximate radial side of middle phalanx
  
  // Little finger landmarks: 17=MCP, 18=PIP, 19=DIP, 20=TIP
  const littleDipCrease = landmarks[19]; // DIP joint crease area
  const littlePipCrease = landmarks[18]; // PIP joint crease area
  const littleMcpCrease = landmarks[17]; // MCP joint crease area
  
  // Palmar crease approximation using wrist and palm landmarks
  const distalPalmarCrease = averageLandmarks([0, 9, 13, 17], landmarks); // Distal palmar crease
  
  const targets = [
    { landmark: indexProximalSide, score: 1, name: 'Radial side of proximal phalanx of index finger', key: 'indexProximalPhalanx' },
    { landmark: indexMiddleSide, score: 2, name: 'Radial side of middle phalanx of index finger', key: 'indexMiddlePhalanx' },
    { landmark: landmarks[8], score: 3, name: 'Tip of index finger', key: 'indexTip' },
    { landmark: landmarks[12], score: 4, name: 'Tip of middle finger', key: 'middleTip' },
    { landmark: landmarks[16], score: 5, name: 'Tip of ring finger', key: 'ringTip' },
    { landmark: landmarks[20], score: 6, name: 'Tip of little finger', key: 'littleTip' },
    { landmark: littleDipCrease, score: 7, name: 'DIP joint crease of little finger', key: 'littleDipCrease' },
    { landmark: littlePipCrease, score: 8, name: 'PIP joint crease of little finger', key: 'littlePipCrease' },
    { landmark: littleMcpCrease, score: 9, name: 'MCP joint crease of little finger', key: 'littleMcpCrease' },
    { landmark: distalPalmarCrease, score: 10, name: 'Distal palmar crease', key: 'distalPalmarCrease' },
  ];

  let maxScore = 0;
  const reachedLandmarks: string[] = [];
  const details = {
    indexProximalPhalanx: false,
    indexMiddlePhalanx: false,
    indexTip: false,
    middleTip: false,
    ringTip: false,
    littleTip: false,
    littleDipCrease: false,
    littlePipCrease: false,
    littleMcpCrease: false,
    distalPalmarCrease: false
  };

  // Check each target in order - Kapandji requires sequential scoring
  for (const target of targets) {
    const distance = euclideanDistance(thumbTip, target.landmark);
    if (distance < THRESHOLD) {
      // Only allow this score if we've reached all previous levels
      if (target.score === 1 || maxScore >= target.score - 1) {
        maxScore = Math.max(maxScore, target.score);
        reachedLandmarks.push(target.name);
        (details as any)[target.key] = true;
      }
    }
  }

  // Score 10: Full opposition across palm to radial side (under pinky metacarpal)
  const wrist = landmarks[0];
  const pinkyMcp = landmarks[17];
  const isRightHand = landmarks[1].x > wrist.x;
  
  // For score 10, thumb must reach the radial side under the pinky metacarpal
  const radialTarget = {
    x: isRightHand ? pinkyMcp.x + 0.08 : pinkyMcp.x - 0.08,
    y: pinkyMcp.y + 0.02,
    z: pinkyMcp.z
  };
  
  const distanceToRadial = euclideanDistance(thumbTip, radialTarget);
  if (distanceToRadial < THRESHOLD * 1.5) { // Slightly more lenient for score 10
    maxScore = Math.max(maxScore, 10);
    reachedLandmarks.push('Full Opposition');
    details.distalPalmarCrease = true;
  }

  return {
    maxScore,
    reachedLandmarks,
    details
  };
}

export function calculateMaxKapandjiScore(motionFrames: Array<{landmarks: HandLandmark[]}>): KapandjiScore {
  let bestScore: KapandjiScore = {
    maxScore: 0,
    reachedLandmarks: [],
    details: {
      indexProximalPhalanx: false,
      indexMiddlePhalanx: false,
      indexTip: false,
      middleTip: false,
      ringTip: false,
      littleTip: false,
      littleDipCrease: false,
      littlePipCrease: false,
      littleMcpCrease: false,
      distalPalmarCrease: false
    }
  };

  for (const frame of motionFrames) {
    if (frame.landmarks && frame.landmarks.length === 21) {
      const frameScore = calculateKapandjiScore(frame.landmarks);
      if (frameScore.maxScore > bestScore.maxScore) {
        bestScore = frameScore;
      }
    }
  }

  return bestScore;
}