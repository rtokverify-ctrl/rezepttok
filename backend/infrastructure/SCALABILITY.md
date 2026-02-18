# Scalability & Data Strategy

To prevent data bottlenecks as the app grows, we need to move away from the current simple setup.

## 1. Database Migration (SQLite -> PostgreSQL)
**Why?** SQLite locks the database during writes. PostgreSQL handles millions of concurrent actions safe and fast.
-   **Action**: Switch to PostgreSQL.

## 2. Caching Layer (Redis)
**Why?** Calculating feeds is expensive.
-   **Action**: Implement Redis to cache feeds and sessions.

## 3. Object Storage (S3 / MinIO)
**Why?** Storing videos on the server disk is not scalable.
-   **Action**: Move media to AWS S3 or MinIO.

## 4. Search Engine (Meilisearch)
**Why?** SQL `LIKE` queries are slow.
-   **Action**: Index recipes for sub-millisecond search.
