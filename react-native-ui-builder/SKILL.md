---
name: react-native-ui-builder
description: Use this skill whenever the user asks to build, create, or update a UI component, button, modal, or screen in React Native (Expo) for the RezeptTok app. This ensures the component follows the project's specific styling rules, uses the correct color constants, and implements performance best practices for lists and animations.
---

# React Native UI Builder (RezeptTok)

Whenever you are tasked with creating or modifying a React Native UI component for the RezeptTok project, use these instructions to ensure the code matches the project's architecture and performance standards. 

## 1. Imports & Constants
Always use the global configuration for colors and base URLs. DO NOT hardcode colors like `#FF4500` if they represent the theme color.
- Import `THEME_COLOR` from `../constants/Config` (adjust relative path based on file location).
- For icons, use `@expo/vector-icons` (e.g., `Ionicons`, `MaterialCommunityIcons`).

## 2. Component Structure
- Always use functional components with ES6 arrow function syntax.
- Ensure components that receive props destructure them cleanly at the top.

## 3. Styling Rules
- **No Tailwind/NativeWind:** The project uses `StyleSheet.create`. Do not use inline styles unless absolutely necessary for dynamic layout calculations.
- Layouts should default to `flex` with appropriate `justifyContent` and `alignItems`.
- When dealing with absolute positioning (e.g., modals, overlays, custom scrollbars), ensure `zIndex` is explicitly defined.

## 4. Performance (Critical for Video/Feed)
The RezeptTok app is highly sensitive to performance issues due to video playback.
- If the component handles state that causes frequent re-renders (like scrolling or dragging), use `useRef` and `Animated.Value` instead of standard React `useState` where possible.
- When passing functions down to child components in lists, ALWAYS wrap them in `useCallback` to prevent unnecessary re-renders.
- Heavy objects should use `useMemo`.

## 5. Touchables & Interactions
- Prefer `TouchableOpacity` for standard buttons.
- For complex tap interactions (e.g., double-tap to like on a video), use `Pressable` with a timestamp check, rather than generic wrappers.

## Example: A Standard Button

```javascript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME_COLOR } from '../constants/Config';

const ActionButton = ({ iconName, label, onPress }) => {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.7}>
            <Ionicons name={iconName} size={24} color="white" />
            <Text style={styles.text}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME_COLOR,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
        gap: 8,
    },
    text: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default ActionButton;
```

## 6. Verification
Before presenting the code, double-check that you haven't introduced any hardcoded colors that should be `THEME_COLOR` and that any lists (`FlatList`) have `initialNumToRender` and `windowSize` optimally configured if applicable.
