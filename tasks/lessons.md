# Project Lessons & Rules

This document tracks lessons learned from corrections, bugs, and architectural decisions. Before starting any major task, review this document to prevent repeating mistakes.

## Rules Checklist
- [ ] **Verification Before Done**: Never mark a task complete without proving it works (tests, logs, visual check).
- [ ] **Demand Elegance**: Do not settle for hacky fixes. If a fix feels hacky, pause and refactor to the elegant solution.
- [ ] **Autonomous Bug Fixing**: Fix bugs directly based on logs/errors without asking for hand-holding.
- [ ] **Minimal Impact**: Touch only what's necessary. Avoid introducing new bugs.
- [ ] **Self-Improvement**: After any correction, update this file to prevent it in the future.

## Specific Lessons

### L1: Loading-State Race Conditions (2026-03-11)
**Mistake:** `feedLoading` turned `false` before `videos` state updated → EmptyFeed flashed briefly.
**Rule:** When a loading flag guards a fallback UI (e.g. empty state), always check `!loading AND data.length === 0`, never just `data.length === 0`. The loading flag must stay `true` until *after* the data state is set.

### L2: Optimistic UI Updates for Counters (2026-03-11)
**Mistake:** `sendComment` added the comment to the list but didn't update the video's `comments_count` in the feed.
**Rule:** When mutating a sub-entity (comment, like), always also update the parent's counter in the global state immediately (`setVideos(prev => ...)`). Don't rely on a full reload.
