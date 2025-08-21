export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface ElbowWristAngles {
  forearmToHandAngle: number;
  wristFlexionAngle: number;
  wristExtensionAngle: number;
  elbowDetected: boolean;
  handType: 'LEFT' | 'RIGHT' | 'UNKNOWN';
  confidence: number;
}

// Module-level session state for consistent elbow selection
let recordingSessionElbowLocked = false;
let recordingSessionElbowIndex: number | undefined;
let recordingSessionWristIndex: number | undefined;
let recordingSessionShoulderIndex: number | undefined;
let recordingSessionHandType: 'LEFT' | 'RIGHT' | 'UNKNOWN' | undefined;
let lastWristAngle: number | undefined;

// Reset function to clear session state
export function resetElbowSessionState() {
  recordingSessionElbowLocked = false;
  recordingSessionElbowIndex = undefined;
  recordingSessionWristIndex = undefined;
  recordingSessionShoulderIndex = undefined;
  recordingSessionHandType = undefined;
  lastWristAngle = undefined;
  console.log('🔄 ELBOW SESSION STATE RESET');
}

// MediaPipe Pose landmark indices
const POSE_LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24
};

// MediaPipe Hand landmark indices
const HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20
};

function euclideanDistance3D(a: HandLandmark | PoseLandmark, b: HandLandmark | PoseLandmark): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + 
    Math.pow(a.y - b.y, 2) + 
    Math.pow(a.z - b.z, 2)
  );
}

// New function for precise wrist angle calculation using arccos method
function calculateWristAngleUsingVectors(
  elbow: HandLandmark | PoseLandmark,
  wrist: HandLandmark | PoseLandmark,
  middleMcp: HandLandmark | PoseLandmark
): number {
  console.log('🔍 Vector calculation input landmarks:', {
    elbow: { x: elbow.x.toFixed(3), y: elbow.y.toFixed(3), z: elbow.z.toFixed(3) },
    wrist: { x: wrist.x.toFixed(3), y: wrist.y.toFixed(3), z: wrist.z.toFixed(3) },
    middleMcp: { x: middleMcp.x.toFixed(3), y: middleMcp.y.toFixed(3), z: middleMcp.z.toFixed(3) }
  });

  // CORRECTED VECTORS: Use pose elbow to hand wrist for forearm vector
  // Forearm vector: from pose elbow TO hand wrist (handLandmark[0])
  const forearmVector = {
    x: wrist.x - elbow.x,
    y: wrist.y - elbow.y,
    z: wrist.z - elbow.z
  };
  
  // Hand vector: from hand wrist TO middle MCP (handLandmark[9])
  const handVector = {
    x: middleMcp.x - wrist.x,
    y: middleMcp.y - wrist.y,
    z: middleMcp.z - wrist.z
  };
  
  // CRITICAL: Normalize vectors first to ensure accurate angle calculation
  const forearmLength = Math.sqrt(forearmVector.x**2 + forearmVector.y**2 + forearmVector.z**2);
  const handLength = Math.sqrt(handVector.x**2 + handVector.y**2 + handVector.z**2);
  
  if (forearmLength === 0 || handLength === 0) {
    console.log('⚠️ Zero length vector, returning 0°');
    return 0;
  }
  
  // Normalize the vectors
  const normalizedForearm = {
    x: forearmVector.x / forearmLength,
    y: forearmVector.y / forearmLength,
    z: forearmVector.z / forearmLength
  };
  
  const normalizedHand = {
    x: handVector.x / handLength,
    y: handVector.y / handLength,
    z: handVector.z / handLength
  };
  
  // Calculate dot product using normalized vectors
  const dotProduct = normalizedForearm.x * normalizedHand.x + normalizedForearm.y * normalizedHand.y + normalizedForearm.z * normalizedHand.z;
  
  console.log('🔍 Normalized vectors:', {
    forearmNormalized: { x: normalizedForearm.x.toFixed(3), y: normalizedForearm.y.toFixed(3), z: normalizedForearm.z.toFixed(3) },
    handNormalized: { x: normalizedHand.x.toFixed(3), y: normalizedHand.y.toFixed(3), z: normalizedHand.z.toFixed(3) }
  });
  
  // For normalized vectors, cosAngle = dotProduct directly
  const cosAngle = dotProduct;
  
  // Clamp to valid range for acos
  const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle));
  
  console.log('🔍 Angle calculation:', {
    dotProduct: dotProduct.toFixed(3),
    cosAngle: cosAngle.toFixed(3),
    clampedCosAngle: clampedCosAngle.toFixed(3)
  });
  
  // Calculate deflection angle from forearm baseline
  // For wrist flexion/extension, we want the deviation from neutral (180° = straight)
  const vectorAngleRadians = Math.acos(clampedCosAngle);
  const vectorAngleDegrees = vectorAngleRadians * (180 / Math.PI);
  
  // Convert to deflection angle: 180° = neutral, deviation gives actual bend
  // This gives us the actual wrist bend angle that matches visual perception
  let deflectionAngle = 180 - vectorAngleDegrees;
  
  // Use deflection angle as the final measurement
  let angleDegrees = deflectionAngle;
  console.log('🔍 DETAILED VECTOR ANALYSIS:');
  console.log(`   Forearm Length: ${forearmLength.toFixed(4)}`);
  console.log(`   Hand Length: ${handLength.toFixed(4)}`);
  console.log(`   Dot Product: ${dotProduct.toFixed(6)}`);
  console.log(`   Cos(Angle): ${cosAngle.toFixed(6)}`);
  console.log(`   Vector Angle (rad): ${vectorAngleRadians.toFixed(6)}`);
  console.log(`   Vector Angle (deg): ${vectorAngleDegrees.toFixed(2)}`);
  console.log(`   Deflection Angle (deg): ${deflectionAngle.toFixed(2)}`);
  console.log(`   Expected Visual: 20-60° for visible flexion`);
  
  // Validate angle against expected physiological range and apply smoothing
  let finalAngle = angleDegrees;
  
  if (finalAngle > 90) {
    console.log(`⚠️ UNREALISTIC ANGLE DETECTED: ${finalAngle.toFixed(1)}° - clamping to 90°`);
    finalAngle = 90; // Maximum physiological wrist flexion/extension
  }
  
  // DISABLE TEMPORAL SMOOTHING FOR FRAME-INDEPENDENT CALCULATIONS
  // Temporal smoothing causes directional dependency - frame 137 gives different results
  // when navigated from 136→137 vs 138→137 due to smoothing state contamination
  
  // Store the raw calculation for debugging but don't apply smoothing during replay
  lastWristAngle = finalAngle;
  
  console.log(`📊 FRAME-INDEPENDENT RESULT: ${finalAngle.toFixed(2)}° (no temporal smoothing applied)`);
  return finalAngle;
}

function calculateAngleBetweenVectors(
  point1: HandLandmark | PoseLandmark,
  point2: HandLandmark | PoseLandmark,
  point3: HandLandmark | PoseLandmark
): number {
  // Vector from point2 to point1
  const vector1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
    z: point1.z - point2.z
  };
  
  // Vector from point2 to point3
  const vector2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y,
    z: point3.z - point2.z
  };
  
  // Calculate dot product
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
  
  // Calculate magnitudes
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y + vector1.z * vector1.z);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y + vector2.z * vector2.z);
  
  // Calculate angle in radians then convert to degrees
  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle)); // Clamp to prevent NaN
  const angleRadians = Math.acos(clampedCosAngle);
  const angleDegrees = angleRadians * (180 / Math.PI);
  
  return angleDegrees;
}

function determineHandType(
  handLandmarks: HandLandmark[],
  poseLandmarks: PoseLandmark[]
): 'LEFT' | 'RIGHT' | 'UNKNOWN' {
  if (!handLandmarks || handLandmarks.length === 0 || !poseLandmarks || poseLandmarks.length === 0) {
    return 'UNKNOWN';
  }

  const handWrist = handLandmarks[HAND_LANDMARKS.WRIST];
  const leftElbow = poseLandmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const rightElbow = poseLandmarks[POSE_LANDMARKS.RIGHT_ELBOW];

  if (!handWrist || !leftElbow || !rightElbow) {
    return 'UNKNOWN';
  }

  // Get shoulder landmarks for body centerline approach
  const leftShoulder = poseLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = poseLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

  if (!leftShoulder || !rightShoulder) {
    console.log(`❌ HAND TYPE: Missing shoulder landmarks`);
    return 'UNKNOWN';
  }

  // Use body centerline approach instead of proximity matching
  // Calculate body center between shoulders
  const bodyCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  
  // Determine handedness based on hand position relative to body center
  // MediaPipe coordinates: x=0 is left edge, x=1 is right edge (from camera perspective)
  // IMPORTANT: Front-facing camera creates mirror effect - need to invert logic
  const handRelativeToCenter = handWrist.x - bodyCenterX;
  
  console.log(`🔍 BODY CENTER DETECTION - Body center X: ${bodyCenterX.toFixed(3)}, Hand X: ${handWrist.x.toFixed(3)}`);
  console.log(`🔍 HAND RELATIVE TO CENTER: ${handRelativeToCenter.toFixed(3)} (negative=left side, positive=right side)`);
  
  // MIRROR CORRECTION: Front-facing camera flips the image
  // When user raises LEFT hand, it appears on RIGHT side of screen (positive handRelativeToCenter)
  // When user raises RIGHT hand, it appears on LEFT side of screen (negative handRelativeToCenter)
  if (handRelativeToCenter < -0.05) { // Hand significantly left of screen = user's RIGHT hand
    console.log(`✅ HAND TYPE DETERMINED: RIGHT (user's right hand appears left on mirrored camera)`);
    return 'RIGHT';
  } else if (handRelativeToCenter > 0.05) { // Hand significantly right of screen = user's LEFT hand
    console.log(`✅ HAND TYPE DETERMINED: LEFT (user's left hand appears right on mirrored camera)`);
    return 'LEFT';
  } else {
    // Hand very close to center - use shoulder visibility as tiebreaker
    // MIRROR CORRECTION: Higher right shoulder visibility = user's LEFT hand (mirrored)
    // Higher left shoulder visibility = user's RIGHT hand (mirrored)
    const leftShoulderVisibility = leftShoulder.visibility || 0;
    const rightShoulderVisibility = rightShoulder.visibility || 0;
    
    if (rightShoulderVisibility > leftShoulderVisibility) {
      console.log(`✅ HAND TYPE DETERMINED: LEFT (center position, better right shoulder visibility on mirrored camera)`);
      return 'LEFT';
    } else {
      console.log(`✅ HAND TYPE DETERMINED: RIGHT (center position, better left shoulder visibility on mirrored camera)`);
      return 'RIGHT';
    }
  }
}

export function calculateElbowReferencedWristAngleWithForce(
  handLandmarks: HandLandmark[],
  poseLandmarks: PoseLandmark[],
  forceHandType: 'LEFT' | 'RIGHT'
): ElbowWristAngles {
  const result: ElbowWristAngles = {
    forearmToHandAngle: 0,
    wristFlexionAngle: 0,
    wristExtensionAngle: 0,
    elbowDetected: false,
    handType: forceHandType,
    confidence: 0
  };

  console.log(`🔍 Starting calculation - handLandmarks: ${handLandmarks?.length || 0}, poseLandmarks: ${poseLandmarks?.length || 0}, forceHandType: ${forceHandType}`);

  if (!handLandmarks || handLandmarks.length < 21 || !poseLandmarks || poseLandmarks.length <= 16) {
    console.log('❌ Insufficient landmarks for calculation');
    return result;
  }

  // PROXIMITY-BASED STABLE SELECTION: Use closest elbow and lock for session consistency
  let elbowIndex: number;
  let wristIndex: number;
  let shoulderIndex: number;
  
  // ANATOMICAL ELBOW LOCKING: Lock elbow based on hand type for anatomical consistency
  // RIGHT hand ALWAYS uses RIGHT elbow, LEFT hand ALWAYS uses LEFT elbow
  
  // Reset session lock if hand type changes to prevent elbow mismatch
  if (recordingSessionElbowLocked && recordingSessionHandType && recordingSessionHandType !== forceHandType) {
    console.log(`🔄 HAND TYPE CHANGED: ${recordingSessionHandType} → ${forceHandType}, resetting session lock`);
    recordingSessionElbowLocked = false;
    recordingSessionElbowIndex = undefined;
    recordingSessionWristIndex = undefined;
    recordingSessionShoulderIndex = undefined;
    recordingSessionHandType = undefined;
  }
  
  if (!recordingSessionElbowLocked) {
    // PURE ANATOMICAL MATCHING: LEFT hand → LEFT elbow, RIGHT hand → RIGHT elbow
    // MediaPipe Pose landmarks: LEFT_ELBOW=13, RIGHT_ELBOW=14
    if (forceHandType === 'LEFT') {
      recordingSessionElbowIndex = POSE_LANDMARKS.LEFT_ELBOW; // 13
      recordingSessionWristIndex = POSE_LANDMARKS.LEFT_WRIST; // 15
      recordingSessionShoulderIndex = POSE_LANDMARKS.LEFT_SHOULDER; // 11
    } else {
      recordingSessionElbowIndex = POSE_LANDMARKS.RIGHT_ELBOW; // 14
      recordingSessionWristIndex = POSE_LANDMARKS.RIGHT_WRIST; // 16
      recordingSessionShoulderIndex = POSE_LANDMARKS.RIGHT_SHOULDER; // 12
    }
    recordingSessionHandType = forceHandType;
    recordingSessionElbowLocked = true;
    
    console.log(`🔒 ANATOMICAL LOCK: ${forceHandType} hand → ${forceHandType} elbow (index ${recordingSessionElbowIndex})`);
  }
  
  // Use locked session selection
  elbowIndex = recordingSessionElbowIndex!;
  wristIndex = recordingSessionWristIndex!;
  shoulderIndex = recordingSessionShoulderIndex!;

  console.log(`🔍 Using landmark indices - elbow: ${elbowIndex}, wrist: ${wristIndex}, shoulder: ${shoulderIndex}`);

  const elbow = poseLandmarks[elbowIndex];
  const poseWrist = poseLandmarks[wristIndex];
  const shoulder = poseLandmarks[shoulderIndex];
  
  // DEBUG: Log all pose landmark positions to understand coordinate system
  console.log(`🔍 COORDINATE DEBUG - Hand Type: ${forceHandType}`);
  console.log(`Left Elbow (13): x=${poseLandmarks[13]?.x?.toFixed(3)}, y=${poseLandmarks[13]?.y?.toFixed(3)}`);
  console.log(`Right Elbow (14): x=${poseLandmarks[14]?.x?.toFixed(3)}, y=${poseLandmarks[14]?.y?.toFixed(3)}`);
  console.log(`Selected Elbow (${elbowIndex}): x=${elbow?.x?.toFixed(3)}, y=${elbow?.y?.toFixed(3)}`);
  console.log(`Hand Wrist (0): x=${handLandmarks[0]?.x?.toFixed(3)}, y=${handLandmarks[0]?.y?.toFixed(3)}`);
  
  // ANATOMICAL VALIDATION: Confirm we're using the correct anatomical elbow
  const expectedElbowIndex = forceHandType === 'LEFT' ? 13 : 14;
  if (elbowIndex === expectedElbowIndex) {
    console.log(`✅ ANATOMICAL VALIDATION: ${forceHandType} hand correctly using ${forceHandType} elbow (index ${elbowIndex})`);
  } else {
    console.warn(`⚠️ ANATOMICAL MISMATCH: ${forceHandType} hand using elbow index ${elbowIndex}, expected ${expectedElbowIndex}`);
  }

  console.log(`🔍 Pose landmarks availability:`, {
    elbow: { exists: !!elbow, visibility: elbow?.visibility || 'N/A' },
    poseWrist: { exists: !!poseWrist, visibility: poseWrist?.visibility || 'N/A' },
    shoulder: { exists: !!shoulder, visibility: shoulder?.visibility || 'N/A' }
  });

  if (elbow && poseWrist && shoulder && 
      (elbow.visibility || 1) > 0.3 && (poseWrist.visibility || 1) > 0.3) {
    
    console.log('✅ Pose landmarks passed visibility check');
    
    result.elbowDetected = true;
    result.confidence = Math.min(elbow.visibility || 1, poseWrist.visibility || 1, shoulder.visibility || 1);

    // Get hand landmarks for wrist analysis
    const handWrist = handLandmarks[HAND_LANDMARKS.WRIST]; // Base of hand (point 0)
    const middleMcp = handLandmarks[HAND_LANDMARKS.MIDDLE_MCP]; // Point 9

    if (handWrist && middleMcp) {
      // Use precise vector calculation method with arccos formula
      const wristAngle = calculateWristAngleUsingVectors(elbow, handWrist, middleMcp);
      result.forearmToHandAngle = wristAngle;

      console.log(`🔬 FRAME CALCULATION DETAILS for ${forceHandType} hand:`);
      console.log(`   Elbow: (${elbow.x.toFixed(4)}, ${elbow.y.toFixed(4)}, ${elbow.z.toFixed(4)})`);
      console.log(`   Wrist: (${handWrist.x.toFixed(4)}, ${handWrist.y.toFixed(4)}, ${handWrist.z.toFixed(4)})`);
      console.log(`   MCP: (${middleMcp.x.toFixed(4)}, ${middleMcp.y.toFixed(4)}, ${middleMcp.z.toFixed(4)})`);
      console.log(`   Calculated Angle: ${wristAngle.toFixed(1)}°`);

      // Store the raw angle for display
      result.forearmToHandAngle = wristAngle;

      // Determine flexion vs extension based on hand direction relative to forearm
      // Use the middle finger direction to determine movement type
      const wristToMcp = {
        x: middleMcp.x - handWrist.x,
        y: middleMcp.y - handWrist.y,
        z: middleMcp.z - handWrist.z
      };
      
      const elbowToWrist = {
        x: handWrist.x - elbow.x,
        y: handWrist.y - elbow.y,
        z: handWrist.z - elbow.z
      };
      
      // VECTOR-BASED DIRECTIONAL DETERMINATION
      // ANATOMICAL POSITION-BASED CLASSIFICATION (Universal for both hands)
      // Project hand position relative to neutral forearm line
      
      // Create forearm reference vector
      const forearmVector = {
        x: elbowToWrist.x,
        y: elbowToWrist.y,
        z: elbowToWrist.z
      };
      
      // Normalize forearm vector
      const forearmLength = Math.sqrt(forearmVector.x**2 + forearmVector.y**2 + forearmVector.z**2);
      const forearmNorm = {
        x: forearmVector.x / forearmLength,
        y: forearmVector.y / forearmLength,
        z: forearmVector.z / forearmLength
      };
      
      // Project hand deviation onto perpendicular plane
      const alongForearm = wristToMcp.x * forearmNorm.x + wristToMcp.y * forearmNorm.y + wristToMcp.z * forearmNorm.z;
      
      const perpendicularDeviation = {
        x: wristToMcp.x - (alongForearm * forearmNorm.x),
        y: wristToMcp.y - (alongForearm * forearmNorm.y),
        z: wristToMcp.z - (alongForearm * forearmNorm.z)
      };
      
      // MULTI-AXIS CALIBRATED CLASSIFICATION (Universal method)
      
      // Use the new anatomical landmark method for universal calculation
      const signedAngle = calculateAnatomicalWristAngle(
        { x: elbow.x, y: elbow.y, z: elbow.z },
        { x: handWrist.x, y: handWrist.y, z: handWrist.z },
        { x: middleMcp.x, y: middleMcp.y, z: middleMcp.z }
      );
      
      // Store the anatomical angle for reference
      result.forearmToHandAngle = 180 + signedAngle; // Convert to 0-360° scale for compatibility
      
      console.log(`🎯 ANATOMICAL ${forceHandType} - Signed:${signedAngle.toFixed(1)}°, Anatomical:${result.forearmToHandAngle.toFixed(1)}°`);
      
      // Apply tighter neutral zone for signed angles (±3° around 0) to capture more motion
      if (Math.abs(signedAngle) <= 3) {
        result.wristFlexionAngle = 0;
        result.wristExtensionAngle = 0;
        console.log(`${forceHandType} Wrist NEUTRAL: ${signedAngle.toFixed(1)}° (within neutral zone)`);
      } else if (signedAngle > 0) {
        // Positive = flexion
        result.wristFlexionAngle = Math.abs(signedAngle);
        result.wristExtensionAngle = 0;
        console.log(`${forceHandType} Wrist FLEXION: ${Math.abs(signedAngle).toFixed(1)}°`);
      } else {
        // Negative = extension
        result.wristExtensionAngle = Math.abs(signedAngle);
        result.wristFlexionAngle = 0;
        console.log(`${forceHandType} Wrist EXTENSION: ${Math.abs(signedAngle).toFixed(1)}°`);
      }

      // Set high confidence for successful calculation
      result.confidence = 0.95;
      result.elbowDetected = true;


    }
  }

  return result;
}

// LEFT hand specific calculation with inverted cross product logic
function calculateLeftHandWristAngle(
  handLandmarks: HandLandmark[],
  poseLandmarks?: PoseLandmark[]
): ElbowWristAngles {
  const result: ElbowWristAngles = {
    forearmToHandAngle: 0,
    wristFlexionAngle: 0,
    wristExtensionAngle: 0,
    elbowDetected: false,
    handType: 'LEFT',
    confidence: 0
  };

  if (!handLandmarks || handLandmarks.length < 21) {
    return result;
  }

  // Determine hand type and get corresponding pose landmarks
  if (poseLandmarks && poseLandmarks.length > 16) {
    // Force LEFT hand type for this function
    const handType = 'LEFT';
    
    if (!recordingSessionHandType) {
      recordingSessionHandType = handType;
      console.log(`🔒 LEFT HAND METHOD - Session locked to LEFT hand`);
    }
    
    result.handType = handType;

    // Use LEFT elbow landmarks
    const elbowIndex = POSE_LANDMARKS.LEFT_ELBOW;
    const wristIndex = POSE_LANDMARKS.LEFT_WRIST;
    const shoulderIndex = POSE_LANDMARKS.LEFT_SHOULDER;

    const elbow = poseLandmarks[elbowIndex];
    const poseWrist = poseLandmarks[wristIndex];
    const shoulder = poseLandmarks[shoulderIndex];

    if (elbow && poseWrist && shoulder && 
        (elbow.visibility || 1) > 0.5 && (poseWrist.visibility || 1) > 0.5 && (shoulder.visibility || 1) > 0.5) {
      
      result.elbowDetected = true;
      result.confidence = Math.min(elbow.visibility || 1, poseWrist.visibility || 1, shoulder.visibility || 1);

      // Get hand landmarks for wrist analysis
      const handWrist = handLandmarks[HAND_LANDMARKS.WRIST];
      const middleMcp = handLandmarks[HAND_LANDMARKS.MIDDLE_MCP];

      if (handWrist && middleMcp) {
        // Calculate reference line (elbow to wrist/base of hand)
        const referenceVector = {
          x: handWrist.x - elbow.x,
          y: handWrist.y - elbow.y,
          z: handWrist.z - elbow.z
        };

        // Calculate measurement line (base of hand to middle finger MCP)
        const measurementVector = {
          x: middleMcp.x - handWrist.x,
          y: middleMcp.y - handWrist.y,
          z: middleMcp.z - handWrist.z
        };

        // Calculate the angle between reference line and measurement line
        const forearmToHandAngle = calculateAngleBetweenVectors(
          { x: elbow.x, y: elbow.y, z: elbow.z },
          { x: handWrist.x, y: handWrist.y, z: handWrist.z },
          { x: middleMcp.x, y: middleMcp.y, z: middleMcp.z }
        );

        result.forearmToHandAngle = forearmToHandAngle;

        const referenceLength = Math.sqrt(referenceVector.x**2 + referenceVector.y**2 + referenceVector.z**2);
        const measurementLength = Math.sqrt(measurementVector.x**2 + measurementVector.y**2 + measurementVector.z**2);
        
        if (referenceLength > 0 && measurementLength > 0) {
          // Normalize vectors
          const referenceNorm = {
            x: referenceVector.x / referenceLength,
            y: referenceVector.y / referenceLength,
            z: referenceVector.z / referenceLength
          };
          
          const measurementNorm = {
            x: measurementVector.x / measurementLength,
            y: measurementVector.y / measurementLength,
            z: measurementVector.z / measurementLength
          };
          
          // Calculate angle between vectors
          const dotProduct = referenceNorm.x * measurementNorm.x + referenceNorm.y * measurementNorm.y + referenceNorm.z * measurementNorm.z;
          const clampedDot = Math.max(-1, Math.min(1, dotProduct));
          const angleRadians = Math.acos(clampedDot);
          const angleDegrees = angleRadians * (180 / Math.PI);
          
        // USE NEW CORRECTED ANATOMICAL CALCULATION
        const signedAngle = calculateAnatomicalWristAngle(
          { x: elbow.x, y: elbow.y, z: elbow.z },
          { x: handWrist.x, y: handWrist.y, z: handWrist.z },
          { x: middleMcp.x, y: middleMcp.y, z: middleMcp.z }
        );
        
        // Store the anatomical angle for reference - now properly scaled
        result.forearmToHandAngle = 180 + signedAngle;
        
        console.log(`🎯 CORRECTED LEFT - Signed:${signedAngle.toFixed(1)}°`);
        
        // Apply tighter neutral zone (±3° around 0) to capture more motion
        if (Math.abs(signedAngle) <= 3) {
          result.wristFlexionAngle = 0;
          result.wristExtensionAngle = 0;
          console.log(`LEFT Wrist NEUTRAL: ${signedAngle.toFixed(1)}°`);
        } else if (signedAngle > 0) {
          result.wristFlexionAngle = Math.abs(signedAngle);
          result.wristExtensionAngle = 0;
          console.log(`LEFT Wrist FLEXION: ${Math.abs(signedAngle).toFixed(1)}°`);
        } else {
          result.wristExtensionAngle = Math.abs(signedAngle);
          result.wristFlexionAngle = 0;
          console.log(`LEFT Wrist EXTENSION: ${Math.abs(signedAngle).toFixed(1)}°`);
        }
        }
      }
    }
  }

  return result;
}

function calculateElbowReferencedWristAngle(
  handLandmarks: HandLandmark[],
  poseLandmarks?: PoseLandmark[]
): ElbowWristAngles {
  const result: ElbowWristAngles = {
    forearmToHandAngle: 0,
    wristFlexionAngle: 0,
    wristExtensionAngle: 0,
    elbowDetected: false,
    handType: 'UNKNOWN',
    confidence: 0
  };

  if (!handLandmarks || handLandmarks.length < 21) {
    return result;
  }

  // Determine hand type and get corresponding pose landmarks
  if (poseLandmarks && poseLandmarks.length > 16) {
    // Use session-locked handedness to prevent flipping during assessment
    let handType: 'LEFT' | 'RIGHT' | 'UNKNOWN';
    
    if (!recordingSessionHandType) {
      // First detection - determine and lock handedness for session
      handType = determineHandType(handLandmarks, poseLandmarks);
      if (handType !== 'UNKNOWN') {
        recordingSessionHandType = handType;
        console.log(`🔒 SESSION HANDEDNESS LOCKED: ${handType} hand detected and locked for assessment duration`);
      }
    } else {
      // Use locked handedness for consistent tracking
      handType = recordingSessionHandType;
    }
    
    result.handType = handType;

    // Correct hand-elbow matching: LEFT hand should use LEFT elbow landmarks
    const elbowIndex = handType === 'LEFT' ? POSE_LANDMARKS.LEFT_ELBOW : POSE_LANDMARKS.RIGHT_ELBOW;
    const wristIndex = handType === 'LEFT' ? POSE_LANDMARKS.LEFT_WRIST : POSE_LANDMARKS.RIGHT_WRIST;
    const shoulderIndex = handType === 'LEFT' ? POSE_LANDMARKS.LEFT_SHOULDER : POSE_LANDMARKS.RIGHT_SHOULDER;

    const elbow = poseLandmarks[elbowIndex];
    const poseWrist = poseLandmarks[wristIndex];
    const shoulder = poseLandmarks[shoulderIndex];

    if (elbow && poseWrist && shoulder && 
        (elbow.visibility || 1) > 0.5 && (poseWrist.visibility || 1) > 0.5 && (shoulder.visibility || 1) > 0.5) {
      
      result.elbowDetected = true;
      result.confidence = Math.min(elbow.visibility || 1, poseWrist.visibility || 1, shoulder.visibility || 1);

      // Get hand landmarks for wrist analysis
      const handWrist = handLandmarks[HAND_LANDMARKS.WRIST]; // Base of hand (point 0)
      const middleMcp = handLandmarks[HAND_LANDMARKS.MIDDLE_MCP]; // Point 9

      if (handWrist && middleMcp) {
        // Calculate reference line (elbow to wrist/base of hand)
        const referenceVector = {
          x: handWrist.x - elbow.x,
          y: handWrist.y - elbow.y,
          z: handWrist.z - elbow.z
        };

        // Calculate measurement line (base of hand to middle finger MCP)
        const measurementVector = {
          x: middleMcp.x - handWrist.x,
          y: middleMcp.y - handWrist.y,
          z: middleMcp.z - handWrist.z
        };

        // Calculate the angle between reference line (elbow-wrist) and measurement line (wrist-middle-MCP)
        const forearmToHandAngle = calculateAngleBetweenVectors(
          { x: elbow.x, y: elbow.y, z: elbow.z },
          { x: handWrist.x, y: handWrist.y, z: handWrist.z },
          { x: middleMcp.x, y: middleMcp.y, z: middleMcp.z }
        );

        result.forearmToHandAngle = forearmToHandAngle;

        // Calculate anatomically correct wrist flexion/extension angles
        // Using elbow-to-wrist as reference line and elbow-to-index-tip as measurement line
        
        const referenceLength = Math.sqrt(referenceVector.x**2 + referenceVector.y**2 + referenceVector.z**2);
        const measurementLength = Math.sqrt(measurementVector.x**2 + measurementVector.y**2 + measurementVector.z**2);
        
        if (referenceLength > 0 && measurementLength > 0) {
          // Normalize vectors
          const referenceNorm = {
            x: referenceVector.x / referenceLength,
            y: referenceVector.y / referenceLength,
            z: referenceVector.z / referenceLength
          };
          
          const measurementNorm = {
            x: measurementVector.x / measurementLength,
            y: measurementVector.y / measurementLength,
            z: measurementVector.z / measurementLength
          };
          
          // Calculate angle between reference line (elbow-wrist) and measurement line (elbow-index-tip)
          const dotProduct = referenceNorm.x * measurementNorm.x + referenceNorm.y * measurementNorm.y + referenceNorm.z * measurementNorm.z;
          const clampedDot = Math.max(-1, Math.min(1, dotProduct));
          const angleRadians = Math.acos(clampedDot);
          const angleDegrees = angleRadians * (180 / Math.PI);
          
          // In neutral position, vectors should be aligned (0° angle between them)
          // Capture all wrist movement - reduce threshold for better sensitivity
          if (angleDegrees > 2) { // Lower threshold for detection
            // Use cross product to determine flexion vs extension direction
            const crossProduct = {
              x: referenceNorm.y * measurementNorm.z - referenceNorm.z * measurementNorm.y,
              y: referenceNorm.z * measurementNorm.x - referenceNorm.x * measurementNorm.z,
              z: referenceNorm.x * measurementNorm.y - referenceNorm.y * measurementNorm.x
            };
            
            // FINAL CORRECTED LOGIC: Inverted the classification based on visual evidence
            // From user feedback: clear flexion was showing as extension, so inverting
            // For RIGHT hand: positive Y = flexion (forward bend), negative Y = extension (backward bend)
            // For LEFT hand: negative Y = flexion (forward bend), positive Y = extension (backward bend)
            const isFlexion = handType === 'LEFT' ? crossProduct.y < 0 : crossProduct.y > 0;
            
            console.log(`🔍 WRIST MOTION - Hand: ${handType}, Angle: ${angleDegrees.toFixed(1)}°, Y: ${crossProduct.y.toFixed(4)}, Flexion: ${isFlexion}`);
            
            if (isFlexion) {
              result.wristFlexionAngle = angleDegrees;
              result.wristExtensionAngle = 0;
              console.log(`${handType} Wrist flexion: ${result.wristFlexionAngle.toFixed(1)}°`);
            } else {
              result.wristExtensionAngle = angleDegrees;
              result.wristFlexionAngle = 0;
              console.log(`${handType} Wrist extension: ${result.wristExtensionAngle.toFixed(1)}°`);
            }
          } else {
            // Neutral position - vectors are aligned
            result.wristFlexionAngle = 0;
            result.wristExtensionAngle = 0;
            console.log(`Wrist neutral: ${angleDegrees.toFixed(1)}° deviation from alignment`);
          }
        }

        console.log(`Elbow-referenced calculation (${handType}): ${Math.abs(forearmToHandAngle - 180).toFixed(1)}° deviation from neutral (${forearmToHandAngle.toFixed(1)}° raw angle)`);
      }
    }
  }

  // Disable fallback hand-only calculation to prevent unrealistic angles
  // Only use elbow-referenced calculations for accuracy

  return result;
}

export function calculateMaxElbowWristAngles(
  motionFrames: Array<{
    landmarks: HandLandmark[];
    poseLandmarks?: PoseLandmark[];
  }>
): ElbowWristAngles {
  let maxResult: ElbowWristAngles = {
    forearmToHandAngle: 0,
    wristFlexionAngle: 0,
    wristExtensionAngle: 0,
    elbowDetected: false,
    handType: 'UNKNOWN',
    confidence: 0
  };

  for (const frame of motionFrames) {
    // Detect correct hand type for each frame instead of hardcoding LEFT
    let frameHandType: 'LEFT' | 'RIGHT' = 'RIGHT'; // Default fallback
    
    if (frame.landmarks && frame.poseLandmarks && frame.poseLandmarks.length > 16) {
      const detectedType = determineHandType(frame.landmarks, frame.poseLandmarks);
      if (detectedType && detectedType !== 'UNKNOWN') {
        frameHandType = detectedType;
      }
    }
    
    const frameResult = calculateElbowReferencedWristAngleWithForce(frame.landmarks, frame.poseLandmarks || [], frameHandType);
    
    // Track all maximum values regardless of confidence for session tracking
    if (frameResult.elbowDetected) {
      // Update hand type and confidence if better
      if (frameResult.confidence > maxResult.confidence) {
        maxResult.handType = frameResult.handType;
        maxResult.confidence = frameResult.confidence;
        maxResult.elbowDetected = true;
      }
      
      // Always track maximum flexion and extension values
      maxResult.wristFlexionAngle = Math.max(maxResult.wristFlexionAngle, frameResult.wristFlexionAngle);
      maxResult.wristExtensionAngle = Math.max(maxResult.wristExtensionAngle, frameResult.wristExtensionAngle);
      maxResult.forearmToHandAngle = Math.max(maxResult.forearmToHandAngle, frameResult.forearmToHandAngle);
    }
  }

  console.log(`Session maximums calculated: Flexion=${maxResult.wristFlexionAngle.toFixed(1)}°, Extension=${maxResult.wristExtensionAngle.toFixed(1)}°, Raw=${maxResult.forearmToHandAngle.toFixed(1)}°`);

  return maxResult;
}

let isReplayMode = false;

export function setReplayMode(replay: boolean) {
  isReplayMode = replay;
  console.log(`🎬 REPLAY MODE: ${replay ? 'ENABLED' : 'DISABLED'}`);
}

export function resetRecordingSession() {
  // Clear session state when starting a new recording
  recordingSessionElbowLocked = false;
  recordingSessionElbowIndex = undefined;
  recordingSessionWristIndex = undefined;
  recordingSessionShoulderIndex = undefined;
  recordingSessionHandType = undefined;
  lastWristAngle = undefined;
  console.log('🔄 RECORDING SESSION RESET: Cleared all session state including handedness for new recording');
}

export function getRecordingSessionElbowSelection() {
  return {
    elbowIndex: recordingSessionElbowIndex,
    wristIndex: recordingSessionWristIndex,
    shoulderIndex: recordingSessionShoulderIndex,
    isLocked: recordingSessionElbowLocked
  };
}

// Hand-specific dispatcher function
// Robust anatomical landmark-based wrist angle calculation
function calculateAnatomicalWristAngle(
  elbow: { x: number; y: number; z: number },
  wrist: { x: number; y: number; z: number },
  middleMcp: { x: number; y: number; z: number }
): number {
  // Vector from elbow to wrist (forearm direction)
  const forearm = {
    x: wrist.x - elbow.x,
    y: wrist.y - elbow.y,
    z: wrist.z - elbow.z
  };
  
  // Vector from wrist to middle MCP (hand direction)
  const handVec = {
    x: middleMcp.x - wrist.x,
    y: middleMcp.y - wrist.y,
    z: middleMcp.z - wrist.z
  };
  
  // Normalize vectors
  const forearmLength = Math.sqrt(forearm.x**2 + forearm.y**2 + forearm.z**2);
  const handLength = Math.sqrt(handVec.x**2 + handVec.y**2 + handVec.z**2);
  
  if (forearmLength === 0 || handLength === 0) {
    return 0; // Avoid division by zero
  }
  
  const uForearm = {
    x: forearm.x / forearmLength,
    y: forearm.y / forearmLength,
    z: forearm.z / forearmLength
  };
  
  const uHand = {
    x: handVec.x / handLength,
    y: handVec.y / handLength,
    z: handVec.z / handLength
  };
  
  // Raw angle (0-180°) using dot product
  const dotProduct = uForearm.x * uHand.x + uForearm.y * uHand.y + uForearm.z * uHand.z;
  const clampedDot = Math.max(-1, Math.min(1, dotProduct));
  const rawAngle = Math.acos(clampedDot) * (180 / Math.PI);
  
  // Sign determination using cross product Z-component
  const cross = {
    x: uForearm.y * uHand.z - uForearm.z * uHand.y,
    y: uForearm.z * uHand.x - uForearm.x * uHand.z,
    z: uForearm.x * uHand.y - uForearm.y * uHand.x
  };
  
  // IMPROVED SENSITIVITY: Tighter neutral zone for better clinical detection
  // Based on observation that raw angles range 44-66° for this dataset
  
  const NEUTRAL_CENTER = 55; // degrees - center of observed neutral range
  const NEUTRAL_TOLERANCE = 3; // degrees - ±3° around center considered neutral (reduced from 10°)
  
  // Calculate deviation from the data-driven neutral center
  const deviationFromNeutral = Math.abs(rawAngle - NEUTRAL_CENTER);
  
  let wristBendAngle = 0;
  
  if (deviationFromNeutral <= NEUTRAL_TOLERANCE) {
    // Within tight neutral tolerance (52-58°) - report as neutral
    wristBendAngle = 0;
  } else {
    // Outside neutral - calculate actual bend with improved sensitivity
    // Use higher scaling factor for better clinical resolution
    const bendMagnitude = (deviationFromNeutral - NEUTRAL_TOLERANCE) * 3; // Increased scale factor from 2 to 3
    
    // Use cross product for direction (flexion vs extension)
    const signRaw = Math.sign(cross.z + 1e-9);
    const sideFactor = wrist.x < elbow.x ? -1 : 1;
    
    // For this coordinate system, determine flexion/extension based on angle direction
    let directionSign = signRaw * sideFactor;
    
    // If raw angle is below neutral center, it's one direction; above is the other
    if (rawAngle < NEUTRAL_CENTER) {
      directionSign *= -1; // Invert for angles below neutral
    }
    
    wristBendAngle = bendMagnitude * directionSign;
    
    // Clamp to reasonable physiological range
    wristBendAngle = Math.max(-90, Math.min(90, wristBendAngle));
  }
  
  return wristBendAngle;
}

// RIGHT hand specific calculation using anatomical landmark method
function calculateRightHandWristAngle(
  handLandmarks: HandLandmark[],
  poseLandmarks?: PoseLandmark[]
): ElbowWristAngles {
  const result: ElbowWristAngles = {
    forearmToHandAngle: 0,
    wristFlexionAngle: 0,
    wristExtensionAngle: 0,
    elbowDetected: false,
    handType: 'RIGHT',
    confidence: 0
  };

  if (!handLandmarks || handLandmarks.length < 21) {
    return result;
  }

  if (poseLandmarks && poseLandmarks.length > 16) {
    const elbow = poseLandmarks[POSE_LANDMARKS.RIGHT_ELBOW];
    const poseWrist = poseLandmarks[POSE_LANDMARKS.RIGHT_WRIST];
    const shoulder = poseLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

    if (elbow && poseWrist && shoulder && 
        (elbow.visibility || 1) > 0.5 && (poseWrist.visibility || 1) > 0.5 && (shoulder.visibility || 1) > 0.5) {
      
      result.elbowDetected = true;
      result.confidence = Math.min(elbow.visibility || 1, poseWrist.visibility || 1, shoulder.visibility || 1);

      const handWrist = handLandmarks[HAND_LANDMARKS.WRIST];
      const middleMcp = handLandmarks[HAND_LANDMARKS.MIDDLE_MCP];

      if (handWrist && middleMcp) {
        // Calculate signed anatomical angle
        const signedAngle = calculateAnatomicalWristAngle(
          { x: elbow.x, y: elbow.y, z: elbow.z },
          { x: handWrist.x, y: handWrist.y, z: handWrist.z },
          { x: middleMcp.x, y: middleMcp.y, z: middleMcp.z }
        );
        
        // Store the raw anatomical angle for reference
        result.forearmToHandAngle = 180 + signedAngle; // Convert to 0-360° scale for compatibility
        
        console.log(`🎯 ANATOMICAL RIGHT - Signed:${signedAngle.toFixed(1)}°, Anatomical:${result.forearmToHandAngle.toFixed(1)}°`);
        
        // Apply neutral zone for signed angles (±10° around 0)
        if (Math.abs(signedAngle) <= 10) {
          result.wristFlexionAngle = 0;
          result.wristExtensionAngle = 0;
          console.log(`RIGHT Wrist NEUTRAL: ${signedAngle.toFixed(1)}° (within neutral zone)`);
        } else if (signedAngle > 0) {
          // Positive = flexion
          result.wristFlexionAngle = signedAngle;
          result.wristExtensionAngle = 0;
          console.log(`RIGHT Wrist FLEXION: ${signedAngle.toFixed(1)}°`);
        } else {
          // Negative = extension
          result.wristExtensionAngle = Math.abs(signedAngle);
          result.wristFlexionAngle = 0;
          console.log(`RIGHT Wrist EXTENSION: ${Math.abs(signedAngle).toFixed(1)}°`);
        }
        
        console.log(`RIGHT Anatomical calculation: ${signedAngle.toFixed(1)}° signed angle`);
      }
    }
  }

  return result;
}

function calculateWristAngleByHandType(
  handLandmarks: HandLandmark[],
  poseLandmarks?: PoseLandmark[],
  forceHandType?: 'LEFT' | 'RIGHT'
): ElbowWristAngles {
  // Always use forced hand type if provided (for replay consistency)
  let handType = forceHandType;
  
  // If no forced type, determine from current frame data
  if (!handType && poseLandmarks && poseLandmarks.length > 16) {
    // Always determine handedness from current frame data for consistency
    const detectedHandType = determineHandType(handLandmarks, poseLandmarks);
    
    // Only use detected type if it's not UNKNOWN
    if (detectedHandType && detectedHandType !== 'UNKNOWN') {
      handType = detectedHandType;
      
      // If session variables exist and match, use them for logging consistency
      if (recordingSessionHandType && recordingSessionHandType === handType) {
        console.log(`🔐 USING LOCKED HANDEDNESS: ${handType} (session-locked)`);
      } else {
        // Update session variables to match current detection
        recordingSessionHandType = handType;
        console.log(`🔒 HANDEDNESS DETERMINED: ${handType} hand detected from current frame`);
        
        // Clear any previous elbow locking to ensure fresh session start
        recordingSessionElbowLocked = false;
        recordingSessionElbowIndex = undefined;
        recordingSessionWristIndex = undefined;
        recordingSessionShoulderIndex = undefined;
      }
    }
  }
  
  console.log(`🔄 DISPATCHER - Using ${handType} hand calculation method`);
  
  // Route to appropriate calculation method
  if (handType === 'LEFT') {
    return calculateLeftHandWristAngle(handLandmarks, poseLandmarks);
  } else if (handType === 'RIGHT') {
    return calculateRightHandWristAngle(handLandmarks, poseLandmarks);
  } else {
    // Fallback to old method for UNKNOWN hand type
    return calculateElbowReferencedWristAngle(handLandmarks, poseLandmarks);
  }
}

// Export all wrist calculation functions
export { 
  calculateWristAngleByHandType, 
  calculateLeftHandWristAngle, 
  calculateElbowReferencedWristAngle 
};