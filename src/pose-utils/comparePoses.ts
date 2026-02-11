import type { PoseDetectionResult } from '../pose-detection/types'

export interface PoseComparison {
  similarity: number
  differences: Array<{ joint: string; angle: number }>
}

export function comparePoses(
  userPose: PoseDetectionResult,
  targetPose: PoseDetectionResult
): PoseComparison {
  // Placeholder implementation
  // TODO: Implement actual pose comparison logic
  return {
    similarity: 0.85,
    differences: []
  }
}

export function calculateAngle(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): number {
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - 
                  Math.atan2(p1.y - p2.y, p1.x - p2.x)
  let angle = Math.abs(radians * 180.0 / Math.PI)
  
  if (angle > 180.0) {
    angle = 360 - angle
  }
  
  return angle
}
