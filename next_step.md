# 🚀 Master Task: Stability, Security & Playback Optimization

**System Context & Execution Rules (STRICTLY ENFORCED):**
Du befindest dich im "Execute (Automate)" Modus. Beachte zwingend die Architektur-Regeln aus `01_TECH_STACK_AND_RULES.md`. Schreibe alle temporären Logs und Test-Skripte nach `.tmp/`. Frage vor jedem `git push` den Nutzer ausdrücklich um Erlaubnis. Keine Aufgabe ist abgeschlossen ohne "Verification Before Done". Wenn du auf Fehler stößt: Fixe sie autonom anhand der Logs ("Autonomous Bug Fixing").

---

## 🧱 Sub-Task 1: Backend Security Hardening (Rate Limiter & CORS)

**The Task:**
Implementiere einen robusten Rate-Limiter und strikte CORS-Richtlinien im FastAPI Backend, um DDoS und unautorisierte Zugriffe zu verhindern.
1. Füge `slowapi` zur `backend/requirements.txt` hinzu.
2. Konfiguriere in `backend/main.py` den `Limiter` (basierend auf der Client-IP). Setze ein globales Limit von `100/minute`.
3. Überschreibe in `backend/routers/auth_router.py` das Limit für Login/Register-Routen auf strikte `5/minute`.
4. Ersetze in `main.py` die Wildcard `allow_origins=["*"]` der `CORSMiddleware`. Lade stattdessen eine Liste erlaubter Origins aus der Umgebungsvariable `ALLOWED_ORIGINS` (Fallback für lokale Entwicklung nutzen).
5. **Verification Before Done:** Erstelle ein temporäres Python-Skript in `.tmp/test_rate_limit.py`, das 6 Requests gegen die Login-Route abfeuert. Verifiziere, dass der 6. Request mit HTTP 429 (Too Many Requests) fehlschlägt.

**Background Information:**
* **Tech Stack:** Python 3, FastAPI, Uvicorn.
* Architektur: Die App läuft in Produktion auf Render. Die IP-Erkennung muss Proxy-Header (z.B. `X-Forwarded-For`) respektieren.

**Do NOT:**
* Nutze **kein** Redis für dieses initiale Rate-Limiting, halte es vorerst im Memory, um die Infrastruktur-Komplexität nicht sofort zu sprengen.
* Fasse keine bestehende Geschäftslogik in den Routern an.
* Beende den Task **nicht**, bevor `test_rate_limit.py` erfolgreich lief und du dem User die Logs gezeigt hast.

---

## 🧱 Sub-Task 2: Cursor-Based Pagination (Feed API)

**The Task:**
Baue den `/feed` Endpunkt auf Cursor-basierte Pagination um, um Skalierbarkeit für wachsende Video-Zahlen zu gewährleisten.
1. Aktualisiere in `backend/schemas.py` das Response-Model des Feeds. Es muss exakt diese Struktur haben: `{ data: list[Recipe], nextCursor: str | None }`.
2. Modifiziere den Feed-Endpunkt in den entsprechenden Routern (z.B. `backend/routers/recipes_router.py`). Er muss einen optionalen Query-Parameter `cursor` (Typ: ISO-8601 Timestamp String) akzeptieren.
3. Passe den SQLAlchemy-Query in `models.py` an: `WHERE created_at < cursor ORDER BY created_at DESC LIMIT 10` (Wenn kein Cursor übergeben wird, nimm die aktuellste Zeit).
4. Berechne den `nextCursor` aus dem `created_at` Feld des *letzten* Elements der zurückgegebenen Liste.
5. **Verification Before Done:** Schreibe einen Test in `backend/tests/` (oder `.tmp/`), der den Endpunkt zweimal aufruft (einmal ohne Cursor, einmal mit dem `nextCursor` der ersten Response) und verifiziert, dass keine Duplikate geliefert werden.

**Background Information:**
* **Datenbank:** Supabase PostgreSQL via SQLAlchemy.
* SOP: Nutze `create_backend_endpoint.md` als Referenz für saubere Endpunkte.

**Do NOT:**
* Nutze **keine** Offset-Pagination (`LIMIT 10 OFFSET 20`). Das ist ineffizient und fehleranfällig.
* Ändere **nicht** die Struktur des einzelnen `Recipe` Models, packe es nur in das neue `{ data, nextCursor }` Wrapper-Objekt.

---

## 🧱 Sub-Task 3: FlatList & Video Player Memory Management

**The Task:**
Optimiere die `FlatList` in `mobile/screens/FeedScreen.js` und das Video-Playback in `mobile/components/VideoPost.js`, um Out-of-Memory Crashes zu verhindern.
1. Füge der `FlatList` in `FeedScreen.js` zwingend folgende Props hinzu: `windowSize={3}`, `maxToRenderPerBatch={2}`, `updateCellsBatchingPeriod={50}`, `initialNumToRender={2}`, `removeClippedSubviews={true}`.
2. Implementiere in `FeedScreen.js` die Cursor-Pagination: Nutze `onEndReached` und `onEndReachedThreshold={0.5}`, um den Endpunkt aus Sub-Task 2 mit dem `nextCursor` aufzurufen und die alten Videos im State zu behalten.
3. Implementiere `onViewableItemsChanged` in `FeedScreen.js` mit `itemVisiblePercentThreshold: 100`. Speichere den Index des aktuell voll sichtbaren Elements im State `activeVideoIndex`. Übergebe der `<VideoPost />` Komponente die Prop `isActive={index === activeVideoIndex}`.
4. In `VideoPost.js`: Binde `player.play()` und `player.pause()` exakt an die `isActive` Prop (und den `userPaused` State). Wenn `!isActive`, muss das Video pausiert sein.
5. **Verification Before Done:** Füge `console.log` Statements in `VideoPost.js` ein ("Video [ID] spielt ab" / "Video [ID] pausiert"). Zeige dem User den Konsolen-Output während eines simulierten Scrolls.

**Background Information:**
* **Tech Stack:** React Native (Expo), `expo-video`.
* **Zielbild:** Nur das vollständig sichtbare Video spielt ab. Das nächste Video im Index wird vorgeladen (`paused={true}`).

**Do NOT:**
* Deklariere die `onViewableItemsChanged` Funktion **niemals** direkt in der Render-Methode. Nutze `useRef` oder `useCallback`.
* Entferne **keinesfalls** das `onLayout` Tracking des Hauptcontainers (siehe Lektion L4 in `lessons.md`).

---

## 🧱 Sub-Task 4: Interactive Video Seekbar

**The Task:**
Implementiere eine interaktive Video-Seekbar in `mobile/components/VideoPost.js`, die es dem Nutzer erlaubt, im Video zu spulen.
1. Nutze `useEvent` Listener für den Video-Progress, um die Seekbar visuell flüssig zu aktualisieren.
2. Implementiere die interaktive Seekbar mittels `PanResponder` in `VideoPost.js`, um Dragging (Scrubbing) zu ermöglichen.
3. Füge `Animated` Werte hinzu, um den Seekbar-Track und den Thumb visuell zu vergrößern (expand), während der Nutzer scrollt/draggt.
4. Stelle sicher, dass das Ziehen der Seekbar das Video effektiv vor- und zurückspult.
5. **Verification Before Done:** Teste das Spulen. Verifiziere das Video-Pause/Play-Verhalten während schnellem Scrollen im Feed.

**Background Information:**
* **Design Guidelines:** Halte dich an die "RezeptTok Premium UI". Nutze starke Abrundungen (Pill Shapes), den Dark Mode und die Akzentfarbe `THEME_COLOR` für die aktive Track-Leiste.

**Do NOT:**
* Nutze keine veralteten Animation-APIs, bleibe bei nativen `Animated` oder standardisierten React Native Hooks.
* Blockiere durch den `PanResponder` **nicht** das vertikale Scrollen der `FlatList`. Das Dragging darf nur horizontal auf der Leiste greifen.