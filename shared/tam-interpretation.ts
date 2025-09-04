// TAM (Total Active Motion) Clinical Interpretation Helper

export interface FingerTAM {
  finger: 'Index' | 'Middle' | 'Ring' | 'Pinky';
  rom: number;
  level: 'Excellent' | 'Good' | 'Fair' | 'Limited' | 'Severely Limited';
  description: string;
  color: string;
  percentage: number; // Percentage of normal ROM
}

export interface TAMInterpretation {
  overallScore: number;
  overallLevel: 'Excellent' | 'Good' | 'Fair' | 'Limited' | 'Severely Limited';
  overallDescription: string;
  overallColor: string;
  fingers: FingerTAM[];
  clinicalMeaning: string;
  functionalImplications: string;
}

// Normal ROM ranges for each finger (in degrees)
export const NORMAL_ROM_RANGES = {
  Index: { min: 220, max: 260 },    // Typical range 220-260°
  Middle: { min: 230, max: 270 },   // Typically highest ROM
  Ring: { min: 220, max: 260 },     // Similar to index
  Pinky: { min: 200, max: 240 }     // Slightly less due to shorter segments
};

function getFingerInterpretation(finger: 'Index' | 'Middle' | 'Ring' | 'Pinky', rom: number): FingerTAM {
  const normalRange = NORMAL_ROM_RANGES[finger];
  const percentage = Math.round((rom / normalRange.max) * 100);
  
  let level: FingerTAM['level'];
  let description: string;
  let color: string;
  
  if (percentage >= 90) {
    level = 'Excellent';
    description = 'Near-normal ROM';
    color = 'text-green-700 bg-green-50 border-green-200';
  } else if (percentage >= 75) {
    level = 'Good';
    description = 'Good functional ROM';
    color = 'text-blue-700 bg-blue-50 border-blue-200';
  } else if (percentage >= 60) {
    level = 'Fair';
    description = 'Adequate ROM';
    color = 'text-yellow-700 bg-yellow-50 border-yellow-200';
  } else if (percentage >= 40) {
    level = 'Limited';
    description = 'Limited ROM';
    color = 'text-orange-700 bg-orange-50 border-orange-200';
  } else {
    level = 'Severely Limited';
    description = 'Severely limited ROM';
    color = 'text-red-700 bg-red-50 border-red-200';
  }
  
  return {
    finger,
    rom,
    level,
    description,
    color,
    percentage: Math.max(0, Math.min(100, percentage))
  };
}

function getOverallInterpretation(fingers: FingerTAM[]): {
  level: TAMInterpretation['overallLevel'];
  description: string;
  color: string;
  clinicalMeaning: string;
  functionalImplications: string;
} {
  const averagePercentage = fingers.reduce((sum, finger) => sum + finger.percentage, 0) / fingers.length;
  
  if (averagePercentage >= 90) {
    return {
      level: 'Excellent',
      description: 'Excellent hand function',
      color: 'text-green-700 bg-green-50 border-green-200',
      clinicalMeaning: 'Near-normal or normal finger flexion across all digits. Excellent functional capacity.',
      functionalImplications: 'Full grip strength and dexterity. Suitable for all daily activities and occupational tasks.'
    };
  } else if (averagePercentage >= 75) {
    return {
      level: 'Good',
      description: 'Good hand function',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      clinicalMeaning: 'Good functional range with minor limitations. Most daily activities achievable.',
      functionalImplications: 'Adequate grip strength. May have minor limitations with fine motor tasks or power grip.'
    };
  } else if (averagePercentage >= 60) {
    return {
      level: 'Fair',
      description: 'Fair hand function',
      color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      clinicalMeaning: 'Moderate functional limitations. Some difficulty with grip and manipulation tasks.',
      functionalImplications: 'May require adaptive strategies. Difficulty with tight grips or small object manipulation.'
    };
  } else if (averagePercentage >= 40) {
    return {
      level: 'Limited',
      description: 'Limited hand function',
      color: 'text-orange-700 bg-orange-50 border-orange-200',
      clinicalMeaning: 'Significant functional limitations. Substantial difficulty with most hand activities.',
      functionalImplications: 'Requires assistive devices or adaptive techniques. Limited grip strength and dexterity.'
    };
  } else {
    return {
      level: 'Severely Limited',
      description: 'Severely limited hand function',
      color: 'text-red-700 bg-red-50 border-red-200',
      clinicalMeaning: 'Severely compromised hand function. Major limitations in all activities.',
      functionalImplications: 'Significant functional impairment. May require surgical intervention or intensive therapy.'
    };
  }
}

export function getTAMInterpretation(
  indexRom: number,
  middleRom: number,
  ringRom: number,
  pinkyRom: number,
  totalActiveRom?: number
): TAMInterpretation {
  const fingers = [
    getFingerInterpretation('Index', indexRom),
    getFingerInterpretation('Middle', middleRom),
    getFingerInterpretation('Ring', ringRom),
    getFingerInterpretation('Pinky', pinkyRom)
  ];
  
  // Use totalActiveRom if provided, otherwise calculate average of individual fingers
  const overallScore = totalActiveRom ? Math.round(totalActiveRom / 4) : Math.round(fingers.reduce((sum, finger) => sum + finger.rom, 0) / 4);
  const overall = getOverallInterpretation(fingers);
  
  return {
    overallScore,
    overallLevel: overall.level,
    overallDescription: overall.description,
    overallColor: overall.color,
    fingers,
    clinicalMeaning: overall.clinicalMeaning,
    functionalImplications: overall.functionalImplications
  };
}

export function getFingerColorByPercentage(percentage: number): string {
  if (percentage >= 90) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 60) return 'bg-yellow-500';
  if (percentage >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}
