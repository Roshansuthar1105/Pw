# Angular + Spring Boot Application Template

A production-ready full-stack template with:
- 🅰️ **Angular** frontend
- 🍃 **Spring Boot 3.3** backend (Java 21)
- 🐘 **PostgreSQL** database
- 🔨 **Gradle** (Groovy DSL) build

---

## Project Structure

```
angular-springboot-template/
├── backend/                        # Spring Boot application
│   ├── build.gradle
│   ├── settings.gradle
│   ├── gradlew / gradlew.bat
│   └── src/
│       └── main/
│           ├── java/com/template/app/
│           │   ├── AppApplication.java        # Entry point
│           │   ├── config/
│           │   │   ├── CorsConfig.java        # Angular CORS
│           │   │   └── WebConfig.java         # MVC config
│           │   ├── controller/
│           │   │   ├── HealthController.java  # GET /api/health
│           │   │   └── ItemController.java    # CRUD /api/items
│           │   ├── service/
│           │   │   └── ItemService.java
│           │   ├── repository/
│           │   │   └── ItemRepository.java
│           │   ├── model/
│           │   │   └── Item.java              # Sample JPA entity
│           │   ├── dto/
│           │   │   ├── ApiResponse.java       # Generic response wrapper
│           │   │   ├── ItemRequest.java
│           │   │   └── ItemResponse.java
│           │   └── exception/
│           │       ├── ResourceNotFoundException.java
│           │       └── GlobalExceptionHandler.java
│           └── resources/
│               ├── application.properties         # Base config
│               ├── application-dev.properties     # Dev profile
│               └── application-prod.properties    # Prod profile
└── frontend/                       # Angular app (create with `ng new`)
```

---

## Getting Started

### Prerequisites
- Java 21+
- PostgreSQL (local or Docker)
- Node.js 18+ & Angular CLI (for frontend)

### 1. Setup PostgreSQL (Dev)

```sql
CREATE DATABASE appdb_dev;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE appdb_dev TO postgres;
```

Or use Docker:
```bash
docker run -d \
  --name postgres-dev \
  -e POSTGRES_DB=appdb_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Run the Backend

```bash
cd backend
./gradlew bootRun
# On Windows:
gradlew.bat bootRun
```

The API starts on **http://localhost:8080/api**

### 3. Verify Health Check

```bash
curl http://localhost:8080/api/health
```
Response:
```json
{
  "status": "UP",
  "service": "angular-springboot-template",
  "profile": "dev",
  "timestamp": "2026-10-08T17:15:00Z"
}
```

### 4. Actuator Endpoints
- `GET /actuator/health` – Spring Boot health with DB connectivity
- `GET /actuator/info` – App info
- `GET /actuator/metrics` – Metrics

### 5. Setup Angular Frontend

```bash
cd ..
ng new frontend --routing --style=scss
cd frontend
```

The backend CORS is pre-configured to allow `http://localhost:4200`.

Add a proxy config (`frontend/proxy.conf.json`):
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

Then run with: `ng serve --proxy-config proxy.conf.json`

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/health` | Custom health check |
| `GET` | `/actuator/health` | Spring Actuator health (incl. DB) |
| `GET` | `/api/items` | Get all items |
| `GET` | `/api/items/active` | Get active items |
| `GET` | `/api/items/{id}` | Get item by ID |
| `GET` | `/api/items/search?q=` | Search items by name |
| `POST` | `/api/items` | Create item |
| `PUT` | `/api/items/{id}` | Update item |
| `DELETE` | `/api/items/{id}` | Delete item |

---

## API Response Format

All endpoints return a consistent JSON envelope:
```json
{
  "success": true,
  "message": "OK",
  "data": { ... },
  "timestamp": "2026-10-08T17:15:00Z"
}
```

---

## Profiles

| Profile | Description |
|---------|-------------|
| `dev` | Local PostgreSQL, verbose SQL logging, DDL auto create-drop |
| `prod` | Env-var secrets, tuned HikariCP, DDL none, minimal logging |

Switch profiles:
```bash
# Dev (default)
./gradlew bootRun

# Prod
./gradlew bootRun --args='--spring.profiles.active=prod'
```

---

## Production Deployment

Set environment variables for the prod profile:
```bash
export DB_URL=jdbc:postgresql://prod-db:5432/appdb
export DB_USERNAME=appuser
export DB_PASSWORD=securepassword
export FRONTEND_URL=https://yourapp.com
```

Build JAR:
```bash
./gradlew build
java -jar build/libs/angular-springboot-template-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```
