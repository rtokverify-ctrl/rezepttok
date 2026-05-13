# Consolidated To-Do List & Next Steps

## 1. Feed Optimization (from `feed_optimization_strategy.md`)
- [x] **Frontend**: Implement `FlatList` memory management (`windowSize=3`, `maxToRenderPerBatch=2`, `initialNumToRender=2`, `removeClippedSubviews=true`).
- [x] **Video Player**: Implement preloading & caching (track active state, preload next video, unmount old videos, file caching).
- [x] **Backend**: Implement Cursor-Based Pagination for `/feed` endpoint.
- [x] **Feed Algorithm**: Create "Edge Score" for feed weighting (40% following, 40% engaged, 20% fresh).

## 2. Infrastructure & Production (from `EMAIL_SETUP.md` & `todo.md`)
- [ ] **Email Integration**: Configure SMTP settings in `.env` and switch `mail_manager.py` to use real email dispatch instead of console prints.
- [ ] **Frontend Testing**: Add Unit/E2E tests and improve offline caching.
- [ ] **Profile Features**: Expand user profile (avatars, bio, theme toggle).

## 3. General Development Rules (from `lessons.md`)
- [ ] **Verify Before Done**: Always test and log before marking a task complete.
- [ ] **Elegance over Hacks**: Refactor code instead of applying hacky fixes.
- [ ] **Autonomous Bug Fixing**: Use logs to fix issues directly.
- [ ] **Minimal Impact**: Avoid breaking existing functionality.

## 4. New Feature Backlog (Brainstorming)
- [x] **Cooking Mode (Hands-Free)**: Keep awake, large steps, voice control ("Springe zu Schritt 2"), video segmented by steps.
- [ ] **Deep Linking & Social Sharing**: Expo Linking (`rezepttok://recipe/123`) to share and open directly in app.
- [ ] **Remix / Duett Funktion**: "Nachgekocht"-Feature, um eigene Videos mit dem Original zu verlinken.
- [ ] **AI-Zutaten-Extraktion**: KI-basiertes Auto-Fill der Zutatenliste beim Video-Upload.
- [ ] **Creator Analytics Dashboard**: Profil-Tab für Views, meistgespeicherte Videos und Follower-Wachstum.
- [ ] **Gamification**: Badges ("Trendsetter", "Vegan Master") für User-Profile.
