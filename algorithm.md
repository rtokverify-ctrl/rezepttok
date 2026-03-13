# 🚀 Master Task: Epic 1 - "For You" Feed Algorithm (Time-Decayed Edge Rank)

**System Context & Execution Rules (STRICTLY ENFORCED):**
Du befindest dich im "Execute (Automate)" Modus. Beachte zwingend die Architektur-Regeln aus `01_TECH_STACK_AND_RULES.md`. Schreibe alle temporären Logs/Tests nach `.tmp/`. "Verification Before Done" ist obligatorisch. Keine Machine-Learning-Bibliotheken (TensorFlow, scikit-learn) verwenden – wir bauen einen reinen SQL/Backend-basierten Algorithmus.

---

## 🧱 Sub-Task 1: Database-Level Feed Scoring (Edge Rank mit Time Decay)

**The Task:**
Ersetze den chronologischen Feed in `backend/algorithms/feed_logic.py` durch einen mathematischen "Time-Decayed Edge Rank" Algorithmus auf Datenbankebene.
1. Implementiere den Score **zwingend** nach folgender HackerNews-inspirierter Formel als SQLAlchemy-Query oder PostgreSQL-Function:
   - `Base Score = (Likes * 2) + (Saves * 3) + (Comments * 2) + (Views * 0.1)`
   - `Time Penalty = (Age_in_hours + 2) ^ 1.5`
   - `Raw Score = Base Score / Time Penalty`
2. **Cold Start Boost (Discovery):** Wenn ein Rezept weniger als 50 Views hat UND jünger als 24 Stunden ist, addiere künstlich `+50` zum `Raw Score`, um neuen Creatorn initiale Sichtbarkeit zu garantieren.
3. **Personalization Boost:** Multipliziere den finalen Score mit `1.5`, wenn der anfragende Nutzer dem Creator des Rezeptes folgt.
4. **Pagination (Composite Cursor):** Da sich Scores ständig ändern, nutze einen Tuple-Cursor. Der Endpunkt muss den Cursor im Format `score_id` (z.B. `150.5_9` für Score 150.5 und Recipe-ID 9) akzeptieren. 
   - Der Query lautet logisch: `WHERE (score, recipe_id) < (cursor_score, cursor_id) ORDER BY score DESC, recipe_id DESC LIMIT 10`.
5. **Verification Before Done:** Erstelle `.tmp/test_feed_algo.py`. Füge 4 Test-Rezepte ein: 
   - A: Viral aber alt (1 Woche, 10k Likes)
   - B: Neu aber unbeliebt (2 Stunden, 1 Like)
   - C: Neu vom gefolgten Creator (1 Stunde, 5 Likes)
   - D: Nagelneu (0 Views, Cold Start)
   - Printe die sortierte Ausgabe des Algorithmus. Beweise, dass C oder D durch den Boost/Decay über A stehen!

**Background Information:**
* **Tech Stack:** FastAPI, SQLAlchemy, PostgreSQL (Supabase).
* **Zielbild:** Ein TikTok-ähnlicher Feed, der dynamisch bleibt und wo alte virale Hits langsam nach unten sinken, während frischer Content getestet wird.

**Do NOT:**
* Implementiere **keine** Machine Learning Modelle, Neuronale Netze oder Kafka-Queues. Halte es simpel und relational.
* Lade **niemals** alle Rezepte mit `.all()` in den Python-Speicher, um dort eine `sort()`-Funktion auszuführen. Das führt zu Out-of-Memory. Die Mathematik (`power()`, `extract(epoch from...)`) muss in der SQL-Abfrage passieren.
* Nutze **kein** `OFFSET` für die Pagination, da dies bei sich sekündlich ändernden Scores zu Duplikaten im Frontend führt.