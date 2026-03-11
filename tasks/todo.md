# Current Tasks & Plan

## Active Plan: Video Playback & Interactive Seekbar
- [ ] Ensure `FeedScreen`'s `onViewableItemsChanged` strictly sets `isActive` only when a video is fully in view (itemVisiblePercentThreshold: 100).
- [ ] In `VideoPost.js`, strictly bind the `player.play()` / `player.pause()` to the `isActive` and `userPaused` states.
- [ ] Add `useEvent` listener for video progress to update the seekbar smoothly.
- [ ] Implement an interactive seekbar using `PanResponder` in `VideoPost.js` to allow dragging.
- [ ] Add `Animated` values to expand the seekbar track and thumb when the user is dragging.

## Backlog / To-Do
- [ ] Follow up on Collaboration/Sharing features
- [ ] Implement Rate Limiting / Security enhancements

## Review / Verification
- [ ] Ensure seekbar dragging effectively scrubs the video.
- [ ] Test video pause/play behavior during fast scroll.
