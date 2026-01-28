export interface PoseDetectionResult {
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>
  worldLandmarks?: Array<{ x: number; y: number; z: number }>
}

export interface WebcamProps {
  onPoseDetected?: (result: PoseDetectionResult) => void
  width?: number
  height?: number
}
