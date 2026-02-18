// Voice Control Service
// Purpose: Handle microphone permissions and speech-to-text commands.

import { Audio } from 'expo-av';

export const startListening = async (onCommandDetected) => {
    // TODO: Implement Expo Speech or a 3rd party STT library (like Google Cloud Speech or a local model if possible)
    // Commands to listen for: "Next", "Back", "Repeat", "Read timer"
    console.log("Starting voice listener...");
};

export const stopListening = () => {
    console.log("Stopping voice listener...");
};
