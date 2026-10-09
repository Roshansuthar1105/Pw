# Angular Frontend (Spring Boot Fullstack Template)

Modular Angular 21 frontend configured with strict separation of concerns, standalone components, Angular Signals, and a direct proxy connection to the Spring Boot REST API (`http://localhost:8080`).

---

## 🏗️ Component Architecture & Rules

Every component strictly consists of 4 distinct files:
1. `*.component.ts`: TypeScript class logic only. **Strictly no inline HTML and no inline CSS** (uses `templateUrl` and `styleUrl`).
2. `*.component.html`: HTML template markup only.
3. `*.component.scss`: SCSS stylesheet only.
4. `*.component.spec.ts`: Unit test file only.

The Angular workspace schematic (`angular.json`) is configured to enforce this on every `ng generate component`:
```json
"@schematics/angular:component": {
  "style": "scss",
  "type": "component",
  "inlineStyle": false,
  "inlineTemplate": false,
  "skipTests": false
}
```

---

## 🚀 Getting Started

### 1. Run Development Server
```bash
npm start
# or
ng serve
```
The application runs at `http://localhost:4200`. Backend API requests (`/api/*`) are automatically routed to `http://localhost:8080` via [proxy.conf.json](file:///d:/Projects/JAVA%20Projects/angular-springboot-template/frontend/proxy.conf.json).

### 2. Generate New Components
To generate a new component matching the exact 4-file skeleton:
```bash
ng g c components/<component-name>
```

Output:
```
CREATE src/app/components/<name>/<name>.component.spec.ts
CREATE src/app/components/<name>/<name>.component.ts
CREATE src/app/components/<name>/<name>.component.scss
CREATE src/app/components/<name>/<name>.component.html
```

### 3. Run Unit Tests
```bash
npm test -- --watch=false
```

### 4. Build for Production
```bash
npm run build
```
Production output will be generated in `dist/frontend`.
