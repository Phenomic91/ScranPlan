import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';

/**
 * While switched on, reads `text` aloud on the phone (no network), and reads
 * again whenever the text changes, so each new step is read as you reach it.
 */
export function useReadAloud(text: string) {
  const [reading, setReading] = useState(false);

  useEffect(() => {
    if (!reading) return;
    Speech.speak(text, { language: 'en-GB' });
    return () => {
      Speech.stop();
    };
  }, [reading, text]);

  return { reading, toggleReading: () => setReading((on) => !on) };
}
