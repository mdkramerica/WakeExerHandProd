// Kapandji Score Clinical Interpretation Helper

export interface KapandjiInterpretation {
  score: number;
  level: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Severe Limitation';
  description: string;
  clinicalMeaning: string;
  color: string;
  landmarks: string[];
}

export const KAPANDJI_LANDMARKS = [
  { level: 1, name: 'Index Proximal Phalanx', key: 'indexProximalPhalanx' },
  { level: 2, name: 'Index Middle Phalanx', key: 'indexMiddlePhalanx' },
  { level: 3, name: 'Index Fingertip', key: 'indexTip' },
  { level: 4, name: 'Middle Fingertip', key: 'middleTip' },
  { level: 5, name: 'Ring Fingertip', key: 'ringTip' },
  { level: 6, name: 'Little Fingertip', key: 'littleTip' },
  { level: 7, name: 'Little DIP Joint Crease', key: 'littleDipCrease' },
  { level: 8, name: 'Little PIP Joint Crease', key: 'littlePipCrease' },
  { level: 9, name: 'Little MCP Joint Crease', key: 'littleMcpCrease' },
  { level: 10, name: 'Distal Palmar Crease', key: 'distalPalmarCrease' }
];

export function getKapandjiInterpretation(score: number): KapandjiInterpretation {
  if (score >= 9) {
    return {
      score,
      level: 'Excellent',
      description: 'Excellent thumb opposition function',
      clinicalMeaning: 'Near-normal or normal thumb opposition. Excellent functional capacity for pinch and grip activities.',
      color: 'text-green-700 bg-green-50 border-green-200',
      landmarks: KAPANDJI_LANDMARKS.slice(0, score).map(l => l.name)
    };
  } else if (score >= 7) {
    return {
      score,
      level: 'Good',
      description: 'Good thumb opposition function',
      clinicalMeaning: 'Good functional capacity with minor limitations. Suitable for most daily activities.',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      landmarks: KAPANDJI_LANDMARKS.slice(0, score).map(l => l.name)
    };
  } else if (score >= 5) {
    return {
      score,
      level: 'Fair',
      description: 'Fair thumb opposition function',
      clinicalMeaning: 'Moderate functional limitations. May require adaptive strategies for some activities.',
      color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      landmarks: KAPANDJI_LANDMARKS.slice(0, score).map(l => l.name)
    };
  } else if (score >= 3) {
    return {
      score,
      level: 'Poor',
      description: 'Poor thumb opposition function',
      clinicalMeaning: 'Significant functional limitations. Difficulty with pinch and grip activities.',
      color: 'text-orange-700 bg-orange-50 border-orange-200',
      landmarks: KAPANDJI_LANDMARKS.slice(0, score).map(l => l.name)
    };
  } else {
    return {
      score,
      level: 'Severe Limitation',
      description: 'Severe thumb opposition limitation',
      clinicalMeaning: 'Severely limited functional capacity. May require surgical intervention or intensive therapy.',
      color: 'text-red-700 bg-red-50 border-red-200',
      landmarks: KAPANDJI_LANDMARKS.slice(0, score).map(l => l.name)
    };
  }
}

export function getAchievedLandmarks(details: any): string[] {
  return KAPANDJI_LANDMARKS.filter(landmark => details[landmark.key]).map(l => l.name);
}
