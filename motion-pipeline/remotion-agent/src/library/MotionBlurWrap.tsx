import React from "react";
import { CameraMotionBlur } from "@remotion/motion-blur";

// Cinematic motion blur (V8). Wrap a scene's CONTENT in this when the scene
// contains FAST motion: zoom-whip entrances, HeroCascade, slide-ins, big
// scale punches. Do NOT wrap slow/idle scenes (drift + breathing) — blur
// costs ~`samples`× the wrapped content's render time and adds nothing
// to slow motion.
//
// Constraints (from @remotion/motion-blur docs):
//   - children must be absolutely positioned
//   - useCurrentFrame() must be called INSIDE the wrapper (components do this)
export const MotionBlurWrap: React.FC<{
  children: React.ReactNode;
  enabled?: boolean; // flip off per-scene without restructuring JSX
  shutterAngle?: number;
  samples?: number;
}> = ({ children, enabled = true, shutterAngle = 200, samples = 6 }) => {
  if (!enabled) return <>{children}</>;
  return (
    <CameraMotionBlur shutterAngle={shutterAngle} samples={samples}>
      {children}
    </CameraMotionBlur>
  );
};
