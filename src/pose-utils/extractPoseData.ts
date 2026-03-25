/**
 * Utility to extract pose landmarks from images in src/assets/poses
 * and cache the results to IndexedDB for performance.
 *
 * Usage:
 * ```tsx
 * import { extractAllPosesFromAssets, getPoseLandmarks } from '@/pose-utils/extractPoseData';
 *
 * // Extract all poses from assets folder
 * await extractAllPosesFromAssets();
 *
 * // Get cached landmarks for a specific pose
 * const landmarks = await getPoseLandmarks('yoga_pose_1');
 * ```
 */

import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { Landmark } from "./comparePoses";

const DB_NAME = "StatuesqueDB";
const STORE_NAME = "PoseLandmarks";
const DB_VERSION = 1;

// Represents stored pose data.
export interface StoredPoseData {
  id: string;
  filename: string;
  imageUrl: string;
  landmarks: Landmark[];
  timestamp: number;
}

// Initialize IndexedDB for caching pose landmarks.
function initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

// Save pose landmarks to IndexedDB. 
async function savePoseToCache(data: StoredPoseData): Promise<void> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function normalizePoseId(value: string): string {
  const withoutQuery = value.split("?")[0];
  const filename = withoutQuery.split("/").pop() || withoutQuery;
  const decoded = decodeURIComponent(filename);
  const baseName = decoded.replace(/\.[^.]+$/, "");
  return baseName.toLowerCase().replace(/\s+/g, "_");
}

function isImagePath(value: string): boolean {
  return /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(value);
}

// Retrieve pose landmarks from IndexedDB cache. 
export async function getPoseLandmarks(poseId: string): Promise<Landmark[] | null> {
  const db = await initializeDB();

  const getById = (id: string) =>
    new Promise<StoredPoseData | undefined>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as StoredPoseData | undefined);
    });

  const getAll = () =>
    new Promise<StoredPoseData[]>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as StoredPoseData[]);
    });

  // 1) Direct lookup for callers already using cache IDs.
  const direct = await getById(poseId);
  if (direct?.landmarks?.length) return direct.landmarks;

  // 2) Derive ID from image URL/path and retry.
  const derivedId = normalizePoseId(poseId);
  if (derivedId !== poseId) {
    const derived = await getById(derivedId);
    if (derived?.landmarks?.length) return derived.landmarks;
  }

  // 3) Fuzzy match by stored filename or image URL.
  const allCached = await getAll();
  const byMetadata = allCached.find((pose) => {
    const filenameId = normalizePoseId(pose.filename || "");
    return pose.imageUrl === poseId || filenameId === derivedId;
  });
  if (byMetadata?.landmarks?.length) return byMetadata.landmarks;

  // 4) Final fallback: extract from image URL on demand, cache it, and return.
  if (isImagePath(poseId)) {
    try {
      const landmarks = await extractLandmarksFromImage(poseId);
      if (landmarks.length > 0) {
        const cacheId = derivedId || poseId.toLowerCase().replace(/\s+/g, "_");
        await savePoseToCache({
          id: cacheId,
          filename: cacheId,
          imageUrl: poseId,
          landmarks,
          timestamp: Date.now()
        });
      }
      return landmarks;
    } catch (error) {
      console.error("Failed to extract fallback landmarks for", poseId, error);
      return null;
    }
  }

  return null;
}

// Get all cached poses. 
export async function getAllCachedPoses(): Promise<StoredPoseData[]> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as StoredPoseData[]);
  });
}

// Delete a specific pose from the cache. 
async function deletePoseFromCache(poseId: string): Promise<void> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(poseId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Clear all cached poses from IndexedDB. 
export async function clearPoseCache(): Promise<void> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Initialize PoseLandmarker for pose extraction. 
let poseLandmarkerInstance: PoseLandmarker | null = null;
async function getPoseLandmarkerInstance(): Promise<PoseLandmarker> {
  if (poseLandmarkerInstance) {
    return poseLandmarkerInstance;
  }

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "CPU" 
    },
    runningMode: "IMAGE",
    numPoses: 1
  });

  return poseLandmarkerInstance;
}

// Extract landmarks from a single image.
async function extractLandmarksFromImage(imageUrl: string): Promise<Landmark[]> {
  const poseLandmarker = await getPoseLandmarkerInstance();

  // Load image
  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    img.src = imageUrl;
  });

  // Create canvas and draw image
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.drawImage(img, 0, 0);

  // Detect pose
  const result = poseLandmarker.detect(canvas);

  if (!result.landmarks || result.landmarks.length === 0) {
    console.warn(`No pose detected in image: ${imageUrl}`);
    return [];
  }

  // Convert to Landmark format
  return result.landmarks[0].map((lm: any) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z,
    visibility: lm.visibility
  }));
}

async function getImageFilesFromAssets(): Promise<Array<{ name: string; path: string }>> {
  try {
    const poseImages = import.meta.glob(
      "../../game/statuesque/assets/*.{jpg,jpeg,png,webp}",
      { eager: true }
    );

    const files = Object.entries(poseImages).map(([path, module]) => {
      const filename = path.split("/").pop() || path;
      const name = filename.replace(/\.[^.]+$/, "");
      return { name, path: (module as {default: string}).default };
    });

    console.log("Statuesque pose images found:", files);

    if (files.length === 0) {
      console.warn("No pose images found. Check that images exist in /src/assets/poses/");
    }

    return files;
  } catch (error) {
    console.error("Error discovering pose images:", error);
    return [];
  }
}

/**
 * Extract landmarks from all images in src/assets/poses directory.
 * Caches results in IndexedDB. Skips images that have already been processed.
 *
 * @param options - Configuration options
 * @param options.force - Force re-extraction even if cached (default: false)
 * @param options.onProgress - Callback for progress updates
 *
 * @returns Array of extracted pose data
 */
export async function extractAllPosesFromAssets(options?: {
  force?: boolean;
  onProgress?: (current: number, total: number, filename: string) => void;
}): Promise<StoredPoseData[]> {
  const { force = false, onProgress } = options || {};

  try {
    // Discover image files
    const imageFiles = await getImageFilesFromAssets();

    if (imageFiles.length === 0) {
      console.warn("No images found in src/assets/poses");
      return [];
    }

    // Get all cached poses
    const allCachedPoses = await getAllCachedPoses();
    const discoveredIds = new Set(
      imageFiles.map(f => f.name.toLowerCase().replace(/\s+/g, "_"))
    );

    // Purge cached poses that no longer exist in assets
    for (const cachedPose of allCachedPoses) {
      if (!discoveredIds.has(cachedPose.id)) {
        console.log(`[Pose Cache] Purging deleted pose: ${cachedPose.id}`);
        await deletePoseFromCache(cachedPose.id);
      }
    }

    const results: StoredPoseData[] = [];
    const cachedPoses = force ? new Map() : new Map(
      (await getAllCachedPoses()).map(p => [p.id, p])
    );

    for (let i = 0; i < imageFiles.length; i++) {
      const { name, path: imagePath } = imageFiles[i];
      const poseId = name.toLowerCase().replace(/\s+/g, "_");

      onProgress?.(i + 1, imageFiles.length, name);

      if (cachedPoses.has(poseId) && !force) {
        console.log(`[Pose Cache] Skipping already cached: ${name}`);
        results.push(cachedPoses.get(poseId)!);
        continue;
      }

      try {
        console.log(`[Pose Extraction] Processing: ${name}...`);
        const landmarks = await extractLandmarksFromImage(imagePath);

        // Always create poseData, even if landmarks are empty
        const poseData: StoredPoseData = {
          id: poseId,
          filename: name,
          imageUrl: imagePath,
          landmarks,
          timestamp: Date.now()
        };

        await savePoseToCache(poseData);
        results.push(poseData);
        if (landmarks.length > 0) {
          console.log(`[Pose Extraction] ✓ Extracted: ${name}`);
        } else {
          console.warn(`[Pose Extraction] No pose detected in: ${name} (will still show image)`);
        }
      } catch (error) {
        console.error(`[Pose Extraction] Failed to extract from ${name}:`, error);
        // Still show image even if extraction fails
        const poseData: StoredPoseData = {
          id: poseId,
          filename: name,
          imageUrl: imagePath,
          landmarks: [],
          timestamp: Date.now()
        };
        await savePoseToCache(poseData);
        results.push(poseData);
      }
    }

    console.log(`[Pose Extraction] Complete. Extracted ${results.length} poses.`);
    return results;
  } catch (error) {
    console.error("Error extracting all poses:", error);
    throw error;
  }
}

export async function getPoseExtractionStatus(): Promise<{
  cached: string[];
  discovered: string[];
  missing: string[];
}> {
  const imageFiles = await getImageFilesFromAssets();
  const discoveredNames = new Set(imageFiles.map(f => f.name.toLowerCase().replace(/\s+/g, "_")));

  const cached = await getAllCachedPoses();
  const cachedIds = new Set(cached.map(p => p.id));

  return {
    cached: Array.from(cachedIds),
    discovered: Array.from(discoveredNames),
    missing: Array.from(discoveredNames).filter(name => !cachedIds.has(name))
  };
}
