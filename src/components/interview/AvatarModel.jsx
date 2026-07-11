import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const DEFAULT_MODEL_URL = '/avatar.glb';

export function AvatarModel({ 
  modelUrl = DEFAULT_MODEL_URL, 
  isPlaying = false, 
  volume = 0 
}) {
  const { scene } = useGLTF(modelUrl);
  const group = useRef();
  const isVroidRef = useRef(false);
  
  // Auto-detect model type and configure position/scale
  useEffect(() => {
    if (scene) {
      let isVroid = false;
      scene.traverse((child) => {
        if (child.name && (child.name.includes('J_Bip') || child.name.includes('F00_000'))) {
          isVroid = true;
        }
      });
      isVroidRef.current = isVroid;

      isVroidRef.current = isVroid;

      // Auto-position and scale based on bounding box
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      
      // Normalize scale so the model is approx 1.7 units tall
      const targetHeight = 1.7;
      const scaleFactor = targetHeight / (size.y || 1);
      scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
      
      // Recompute bounding box after scale
      const newBox = new THREE.Box3().setFromObject(scene);
      const newSize = newBox.getSize(new THREE.Vector3());
      const newCenter = newBox.getCenter(new THREE.Vector3());
      
      // Position the face (approx 85% of height from bottom) at Y = 0.22 (camera Y level)
      // Top of bounding box is newCenter.y + newSize.y / 2. Face is slightly below top.
      const faceY = newCenter.y + newSize.y * 0.35; 
      scene.position.set(-newCenter.x, 0.22 - faceY, -newCenter.z);

      console.log(`[AvatarModel] Auto-positioned avatar. Scale: ${scaleFactor.toFixed(2)}, ShiftY: ${(0.22 - faceY).toFixed(2)}`);
      
      // Enable shadow casting and optimize textures for maximum sharpness
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Enable texture filtering optimization
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              // Iterate through common map channels
              ['map', 'normalMap', 'roughnessMap', 'metalnessMap'].forEach((mapName) => {
                if (mat[mapName]) {
                  mat[mapName].anisotropy = 8; // High anisotropy for texture crispness
                  mat[mapName].minFilter = THREE.LinearMipmapLinearFilter;
                  mat[mapName].magFilter = THREE.LinearFilter;
                  mat[mapName].needsUpdate = true;
                }
              });
            });
          }
        }
      });
    }
  }, [scene]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // 1. Natural idle breathing animation (compatible with both bone naming conventions)
    if (group.current) {
      // Find spine bone
      const spine = group.current.getObjectByName('Spine') || 
                    group.current.getObjectByName('J_Bip_C_Spine') || 
                    group.current.getObjectByName('J_Bip_C_UpperChest');
      if (spine) {
        spine.rotation.x = Math.sin(time * 1.5) * 0.008;
        spine.rotation.z = Math.cos(time * 0.8) * 0.003;
      }
      
      // Find neck bone
      const neck = group.current.getObjectByName('Neck') || 
                   group.current.getObjectByName('J_Bip_C_Neck');
      if (neck) {
        neck.rotation.x = Math.sin(time * 1.2) * 0.01 + 0.04;
        neck.rotation.y = Math.cos(time * 0.6) * 0.008;
      }
      
      // Find head bone
      const head = group.current.getObjectByName('Head') || 
                   group.current.getObjectByName('J_Bip_C_Head');
      if (head) {
        head.rotation.y = Math.sin(time * 0.5) * 0.015;
        head.rotation.z = Math.cos(time * 0.7) * 0.006;
      }

      // 1b. Apply resting arms pose specifically for VRoid models to eliminate T-pose
      if (isVroidRef.current) {
        const leftUpperArm = group.current.getObjectByName('J_Bip_L_UpperArm');
        const rightUpperArm = group.current.getObjectByName('J_Bip_R_UpperArm');
        const leftLowerArm = group.current.getObjectByName('J_Bip_L_LowerArm');
        const rightLowerArm = group.current.getObjectByName('J_Bip_R_LowerArm');

        if (leftUpperArm) {
          leftUpperArm.rotation.z = -1.35; // Rotate arm down (approx -77 degrees)
          leftUpperArm.rotation.y = 0.1;
          leftUpperArm.rotation.x = 0.15;
        }
        if (rightUpperArm) {
          rightUpperArm.rotation.z = 1.35; // Rotate arm down (approx 77 degrees)
          rightUpperArm.rotation.y = -0.1;
          rightUpperArm.rotation.x = 0.15;
        }
        if (leftLowerArm) {
          leftLowerArm.rotation.y = -0.3; // Bend elbow slightly forward
        }
        if (rightLowerArm) {
          rightLowerArm.rotation.y = 0.3; // Bend elbow slightly forward
        }
      }
    }

    // 2. Lip-Sync mouth movement and 3. Blinking eyes
    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        const keys = Object.keys(child.morphTargetDictionary);
        
        // --- Lip-Sync (Mouth opening) ---
        // Look for RPM shapes or VRoid mouth open shapes ('A', 'mouth_a', etc.)
        const visemeAaIndex = child.morphTargetDictionary['viseme_aa'];
        const mouthOpenIndex = child.morphTargetDictionary['mouthOpen'];
        const jawOpenIndex = child.morphTargetDictionary['jawOpen'];
        
        // Dynamic detection for VRoid VRM mouth 'A' shape
        const vrmMouthKey = keys.find(k => /fcl_mth_a|mouth_a|^a$/i.test(k));
        const vrmMouthIndex = vrmMouthKey ? child.morphTargetDictionary[vrmMouthKey] : undefined;
        
        // Target mouth opening ratio: base threshold + volume scaling for vibrant visibility
        const targetOpening = isPlaying 
          ? 0.15 + Math.min(0.75, (volume / 100) * 1.6) 
          : 0;
        const lerpFactor = 0.25;

        // Apply mouth opening changes smoothly
        if (vrmMouthIndex !== undefined) {
          child.morphTargetInfluences[vrmMouthIndex] = THREE.MathUtils.lerp(
            child.morphTargetInfluences[vrmMouthIndex],
            targetOpening * 1.1, // VRoid morphs sometimes need slightly more amplitude
            lerpFactor
          );
        }
        if (visemeAaIndex !== undefined) {
          child.morphTargetInfluences[visemeAaIndex] = THREE.MathUtils.lerp(
            child.morphTargetInfluences[visemeAaIndex],
            targetOpening,
            lerpFactor
          );
        }
        if (mouthOpenIndex !== undefined) {
          child.morphTargetInfluences[mouthOpenIndex] = THREE.MathUtils.lerp(
            child.morphTargetInfluences[mouthOpenIndex],
            targetOpening * 0.8,
            lerpFactor
          );
        }
        if (jawOpenIndex !== undefined) {
          child.morphTargetInfluences[jawOpenIndex] = THREE.MathUtils.lerp(
            child.morphTargetInfluences[jawOpenIndex],
            targetOpening * 0.5,
            lerpFactor
          );
        }

        // --- Auto Blinking (Blink 150ms every 3.5 seconds) ---
        // Look for RPM blink or VRoid blink shapes
        const eyeBlinkLeftIndex = child.morphTargetDictionary['eyeBlinkLeft'] || child.morphTargetDictionary['eyesClosed'];
        const eyeBlinkRightIndex = child.morphTargetDictionary['eyeBlinkRight'] || child.morphTargetDictionary['eyesClosed'];
        
        const vrmBlinkLKey = keys.find(k => /fcl_eye_close_l|blink_l|eye_close_l/i.test(k));
        const vrmBlinkRKey = keys.find(k => /fcl_eye_close_r|blink_r|eye_close_r/i.test(k));
        const vrmBlinkLIndex = vrmBlinkLKey ? child.morphTargetDictionary[vrmBlinkLKey] : undefined;
        const vrmBlinkRIndex = vrmBlinkRKey ? child.morphTargetDictionary[vrmBlinkRKey] : undefined;

        const blinkCycle = Math.floor(time) % 4 === 0;
        const blinkTime = time % 4;
        const isBlinking = blinkCycle && blinkTime < 0.15;
        const blinkTarget = isBlinking ? 1.0 : 0.0;
        const blinkLerpFactor = 0.45;

        // Apply blinking
        if (vrmBlinkLIndex !== undefined) {
          child.morphTargetInfluences[vrmBlinkLIndex] = THREE.MathUtils.lerp(
            child.morphTargetInfluences[vrmBlinkLIndex],
            blinkTarget,
            blinkLerpFactor
          );
        }
        if (vrmBlinkRIndex !== undefined) {
          child.morphTargetInfluences[vrmBlinkRIndex] = THREE.MathUtils.lerp(
            child.morphTargetInfluences[vrmBlinkRIndex],
            blinkTarget,
            blinkLerpFactor
          );
        }
        if (eyeBlinkLeftIndex !== undefined) {
          child.morphTargetInfluences[eyeBlinkLeftIndex] = THREE.MathUtils.lerp(
            child.morphTargetInfluences[eyeBlinkLeftIndex],
            blinkTarget,
            blinkLerpFactor
          );
        }
        if (eyeBlinkRightIndex !== undefined) {
          child.morphTargetInfluences[eyeBlinkRightIndex] = THREE.MathUtils.lerp(
            child.morphTargetInfluences[eyeBlinkRightIndex],
            blinkTarget,
            blinkLerpFactor
          );
        }
      }
    });
  });

  return <primitive ref={group} object={scene} dispose={null} />;
}

// Preload standard URL
useGLTF.preload(DEFAULT_MODEL_URL);
