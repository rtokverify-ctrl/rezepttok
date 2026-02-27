# 🧠 02_BACKEND_ARCHITECTURE

## 📂 Ordnerstruktur & Verantwortung

- **`routers/`**: Beinhaltet die API-Endpoints der FastAPI-App (Controller-Schicht). Die Logik ist pro Funktionseinheit aufgeteilt (z. B. `auth_router.py` für Login/Register, `recipes_router.py` für Rezepte).
- **`services/`**: Enthält ausgelagerte Geschäftslogik und helper-Funktionen, um die Router nicht zu überladen.
- **`algorithms/`**: Spezifische Logiken für Datenverarbeitung, z. B. für den Feed-Algorithmus, Sortierungen oder KI-Empfehlungen.
- **`infrastructure/`**: Logik zur Integration dritter Systeme (z. B. File-Storage, Mailer, etc.).

## 🔄 Datenfluss (Data Flow)

**Request -> Router -> (Service) -> Database -> Response**

1. **Request:** Der Client sendet einen HTTP-Request an die FastAPI Anwendung.
2. **Router/Endpoint:** In `main.py` wird der Request an den passenden Router geleitet (z. B. `recipes_router.py`).
3. **Pydantic Validation:** Hier validiert FastAPI automatisch anhand der in `schemas.py` definierten Pydantic-Modelle die Eingabedaten.
4. **Geschäftslogik:** Die Funktion im Router (oder ein aufgerufener Service) wendet die Geschäftslogik an. Dabei wird oft eine Datenbank-Session (`db: Session = Depends(get_db)`) übergeben.
5. **Database (ORM):** Via SQLAlchemy (`models.py`) wird ein Query erstellt und ausgeführt, um Daten aus SQLite oder PostgreSQL zu lesen / schreiben.
6. **Response:** Die Daten werden aus dem ORM-Modell wieder in ein Pydantic-Schema bzw. ein JSON-Objekt gewandelt und an den Client zurückgespielt.

## ⚙️ Wichtige Umgebungsvariablen / Config (ohne Secrets)

Die Konfiguration wird primär über eine `.env` Datei gesteuert und im Backend oft via `os.getenv` abgerufen.

- `DATABASE_URL`: Der Connection-String für die Datenbank (**Supabase PostgreSQL** in Prod). Fehlt diese Variable, fällt das System automatisch auf eine lokale SQLite-Datenbank (`sqlite:///./sql_app.db`) zurück.
- `S3_ENDPOINT_URL` / `S3_BUCKET_NAME`: Konfiguration für den S3-kompatiblen Video-Upload (Produktion nutzt **Supabase Storage**).
- `MAIL_USERNAME`: Mail-Adresse für den E-Mail Service.
- `MAIL_FROM`: Absenderadresse der E-Mail.
- `MAIL_PORT`: Port des SMTP-Servers (meist 587).
- `MAIL_SERVER`: SMTP Hostname (z. B. smtp.gmail.com).
- `MAIL_FROM_NAME`: Der Anzeige-Name für ausgehende Mails ("RezeptTok Security").
