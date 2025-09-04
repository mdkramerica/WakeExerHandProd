import { useEffect, useRef } from 'react';
import { 
  KAPANDJI_TARGETS, 
  TargetState, 
  getCurrentTarget, 
  getTargetPosition, 
  getProgressMessage,
  type HandLandmark 
} from '@shared/kapandji-target-system';

interface KapandjiTargetOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  handLandmarks: HandLandmark[];
  targetState: TargetState;
  bestEverScore: number | null;
  isVisible: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export function KapandjiTargetOverlay({ 
  canvasRef, 
  handLandmarks, 
  targetState, 
  bestEverScore,
  isVisible, 
  canvasWidth, 
  canvasHeight 
}: KapandjiTargetOverlayProps) {
  const animationRef = useRef<number>();
  const pulsePhaseRef = useRef<number>(0);

  useEffect(() => {
    if (!isVisible || !canvasRef.current || handLandmarks.length !== 21) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Update pulse animation
      pulsePhaseRef.current += 0.1;
      
      drawTargetOverlay(ctx);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, handLandmarks, targetState, bestEverScore, canvasWidth, canvasHeight]);

  const drawTargetOverlay = (ctx: CanvasRenderingContext2D) => {
    if (handLandmarks.length !== 21) return;

    const currentTarget = getCurrentTarget(targetState);
    
    try {
      const targetPosition = getTargetPosition(currentTarget, handLandmarks);
      
      // Convert normalized coordinates to canvas coordinates
      const targetX = targetPosition.x * canvasWidth;
      const targetY = targetPosition.y * canvasHeight;
      
      // Draw animated pulsing target
      drawAnimatedTarget(ctx, targetX, targetY, targetState.isTargetReached);
      
      // Draw progress indicators for achieved targets
      drawAchievedTargets(ctx);
      
      // Draw progress message
      drawProgressMessage(ctx);
      
    } catch (error) {
      console.warn('Error drawing Kapandji target overlay:', error);
    }
  };

  const drawAnimatedTarget = (ctx: CanvasRenderingContext2D, x: number, y: number, isAchieved: boolean) => {
    const pulse = Math.sin(pulsePhaseRef.current) * 0.3 + 0.7; // Pulse between 0.4 and 1.0
    const baseRadius = 25;
    const pulseRadius = baseRadius * pulse;
    
    // Outer pulsing ring
    ctx.strokeStyle = isAchieved ? '#10B981' : '#3B82F6'; // Green if achieved, blue otherwise
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 * pulse;
    ctx.beginPath();
    ctx.arc(x, y, pulseRadius + 10, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Inner target circle
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = isAchieved ? '#059669' : '#2563EB';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, baseRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Target center dot
    ctx.fillStyle = isAchieved ? '#10B981' : '#3B82F6';
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Target crosshairs
    ctx.strokeStyle = isAchieved ? '#059669' : '#2563EB';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x - 15, y);
    ctx.lineTo(x + 15, y);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x, y + 15);
    ctx.stroke();
    
    ctx.globalAlpha = 1;
  };

  const drawAchievedTargets = (ctx: CanvasRenderingContext2D) => {
    // Draw small indicators for achieved targets
    targetState.achievedTargets.forEach((achievedScore, index) => {
      const target = KAPANDJI_TARGETS.find(t => t.score === achievedScore);
      if (!target) return;
      
      try {
        const position = getTargetPosition(target, handLandmarks);
        const x = position.x * canvasWidth;
        const y = position.y * canvasHeight;
        
        // Small green checkmark circle
        ctx.fillStyle = '#10B981';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Checkmark
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x - 1, y + 2);
        ctx.lineTo(x + 3, y - 2);
        ctx.stroke();
        
      } catch (error) {
        console.warn('Error drawing achieved target:', error);
      }
    });
    
    ctx.globalAlpha = 1;
  };

  const drawProgressMessage = (ctx: CanvasRenderingContext2D) => {
    const message = getProgressMessage(targetState, bestEverScore);
    
    // Message background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, canvasWidth - 20, 60);
    
    // Message text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(message, 20, 35);
    
    // Progress bar
    const maxTargets = bestEverScore ? Math.min(bestEverScore, 10) : 3;
    const progress = targetState.achievedTargets.length / maxTargets;
    const barWidth = canvasWidth - 40;
    
    // Progress bar background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(20, 45, barWidth, 8);
    
    // Progress bar fill
    ctx.fillStyle = targetState.maxScoreAchieved >= (bestEverScore || 3) ? '#10B981' : '#3B82F6';
    ctx.fillRect(20, 45, barWidth * progress, 8);
    
    // Progress text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText(`${targetState.achievedTargets.length}/${maxTargets} targets achieved`, 20, 65);
  };

  return null; // This component only draws on the canvas, no JSX elements
}

export default KapandjiTargetOverlay;
