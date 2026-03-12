# Feed Optimization Strategy

To make the video feed feel like a native, premium TikTok-style experience, we must optimize it across three distinct layers. This document outlines the strategies to be implemented.

## 1. Frontend: FlatList Memory Management (Quick Wins)
Currently, `FeedScreen.js` uses a `FlatList` with `pagingEnabled`. This is a good start, but it will consume too much memory as the list grows, causing lag and crashes.

**Implementation Steps:**
*   **Window Size:** Set `windowSize={3}` (or less). This ensures only the currently viewing item, plus one above and one below, are fully rendered. The rest of the off-screen items are replaced with blank views.
*   **Max to Render:** Set `maxToRenderPerBatch={2}` and `updateCellsBatchingPeriod={50}`. This prevents the UI thread from locking up when scrolling fast.
*   **Initial Render:** Set `initialNumToRender={2}` so the app starts up immediately without trying to render 10 videos off-screen.
*   **Clipping:** Enable `removeClippedSubviews={true}` to force React Native to unmount views that are far outside the viewport.

## 2. Video Player: Preloading & Caching
The most common cause of a "janky" feed is the video player buffering when the user swipes.

**Implementation Steps:**
*   **Active State Tracking:** Only the video currently fully visible (Index 0) should have `isActive={true}` and be playing.
*   **Preloading:** The *next* video in the list (Index 1) should be loaded into memory but kept `paused={true}` and muted. When the user swipes, it plays instantly because it's already buffered.
*   **Dismounting:** Videos at Index 2+ and Index -2 (already watched) should ideally be replaced with thumbnail images or completely unmounted video components to save RAM and connection limits.
*   **File Caching:** Use `expo-video` or a caching library to save the downloaded video chunks to the local file system. If a user swipes up and back down, the video shouldn't download twice.

## 3. Backend: Cursor-Based Pagination
Fetching all videos at once (e.g., `GET /recipes`) scales poorly. Offset pagination (`LIMIT 10 OFFSET 20`) also becomes slow as the database grows and can cause duplicate items if new videos are added while the user scrolls.

**Implementation Steps:**
*   **API Update:** Change the `/feed` endpoint to accept a `cursor` (usually the timestamp of the last seen video).
*   **Response Structure:** Return `{ data: [...videos], nextCursor: "2026-03-12T10:00:00Z" }`.
*   **Frontend Trigger:** Use `onEndReached` and `onEndReachedThreshold={0.5}` in the `FlatList` to trigger a fetch for the *next* batch of videos using the `nextCursor` when the user is halfway through the current list.

## 4. Feed Algorithm
To move beyond a simple chronological feed:
*   Calculate an "Edge Score" using Supabase Edge Functions or a PostgreSQL Materialized View.
*   **Weighting Example:**
    *   40%: Recent recipes from people the user follows.
    *   40%: Highly engaged recipes (many likes/saves).
    *   20%: Fresh, undiscovered recipes to give new creators a chance.
