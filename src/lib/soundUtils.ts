
// src/lib/soundUtils.ts
'use client';

// Sound file paths (assuming they are in public/assets/sounds/)
const SOUND_FILES = {
  click: '/assets/sounds/click.mp3',
  complete: '/assets/sounds/complete.mp3',
  levelUp: '/assets/sounds/levelup.mp3',
  transform: '/assets/sounds/transform.mp3',
};

type SoundKeys = keyof typeof SOUND_FILES;

// Cache for Audio objects
let audioCache: { [key in SoundKeys]?: HTMLAudioElement } = {};
// Global mute state
let isMutedGlobal = false;
// localStorage key for persisting mute state
const MUTE_STORAGE_KEY = 'heroicTasksMuteState';
// Flag to ensure mute state is initialized once
let muteStateInitialized = false;

// Initializes the mute state from localStorage or defaults to false (not muted).
const initializeMuteStateOnce = (): void => {
  if (typeof window === 'undefined' || muteStateInitialized) return;

  const storedMuteState = localStorage.getItem(MUTE_STORAGE_KEY);
  if (storedMuteState !== null) {
    try {
      isMutedGlobal = JSON.parse(storedMuteState);
    } catch (e) {
      console.warn("Could not parse stored mute state, defaulting to false.", e);
      isMutedGlobal = false;
    }
  } else {
    // Default to not muted and store it
    isMutedGlobal = false;
    localStorage.setItem(MUTE_STORAGE_KEY, JSON.stringify(isMutedGlobal));
  }
  muteStateInitialized = true;
  // console.log('Mute state initialized:', isMutedGlobal); // Optional: for debugging
};


// Function to initialize and preload sounds
export const preloadSounds = (): void => {
  if (typeof window === 'undefined') return;

  // Ensure mute state is loaded before preloading
  initializeMuteStateOnce();

  (Object.keys(SOUND_FILES) as SoundKeys[]).forEach((key) => {
    if (!audioCache[key]) {
      const audio = new Audio(SOUND_FILES[key]);
      audio.preload = 'auto'; // Suggests the browser to preload
      audio.load(); // Start loading the audio file
      audio.volume = 0.5; // Set volume to medium (0.0 to 1.0)
      audioCache[key] = audio;
    }
  });
  // console.log('Sounds preloaded.'); // Optional: for debugging
};

// Function to play a specified sound
export const playSound = (soundName: SoundKeys): void => {
  if (typeof window === 'undefined') return;
  initializeMuteStateOnce(); // Ensure mute state is known

  if (isMutedGlobal) return; // Don't play if muted

  const audio = audioCache[soundName];
  if (audio) {
    audio.currentTime = 0; // Rewind to start if it was already playing
    audio.play().catch(error => console.warn(`Error playing sound ${soundName}:`, error));
  } else {
    // Attempt to load and play dynamically if not in cache (fallback, less ideal)
    console.warn(`Sound ${soundName} not preloaded. Attempting dynamic load.`);
    const dynamicAudio = new Audio(SOUND_FILES[soundName]);
    dynamicAudio.volume = 0.5;
    dynamicAudio.play().catch(error => console.error(`Error playing dynamic sound ${soundName}:`, error));
  }
};

// Convenience functions for specific sounds
export const playClickSound = () => playSound('click');
export const playCompleteSound = () => playSound('complete');
export const playLevelUpSound = () => playSound('levelUp');
export const playTransformSound = () => playSound('transform');

// Function to toggle the global mute state
export const toggleMute = (): boolean => {
  if (typeof window === 'undefined') return false;
  initializeMuteStateOnce(); // Ensure initial state is loaded

  isMutedGlobal = !isMutedGlobal;
  localStorage.setItem(MUTE_STORAGE_KEY, JSON.stringify(isMutedGlobal));
  // console.log('Mute toggled. New state:', isMutedGlobal); // Optional: for debugging
  return isMutedGlobal;
};

// Function to get the current mute state
export const getMuteState = (): boolean => {
  if (typeof window === 'undefined') return false; // Default to not muted on server
  initializeMuteStateOnce(); // Ensure state is loaded if called independently
  return isMutedGlobal;
};
