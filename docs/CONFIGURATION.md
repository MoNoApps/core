# Configuration Guide & Schema Specification

Core Platform utilizes a centralized configuration file, [`config.json`](../config.json), to declare network bindings, system themes, database connections, and dynamic resource schemas.

---

## Configuration Structure

```json
{
  "site": "Core",
  "theme": "lumen",
  "port": {
    "web": 1344,
    "api": 1345
  },
  "APIVARS": {
    "PRE": ""
  },
  "resources": {
    "products": {
      "desc": "Product Catalog",
      "admin": false,
      "param": "product",
      "clean": { "internalSecret": 1 },
      "schema": {
        "name": { "type": "text", "required": true },
        "price": { "type": "number", "min": 0 },
        "status": {
          "type": "select",
          "options": ["draft", "active", "archived"]
        },
        "inStock": { "type": "checkbox" },
        "launchDate": { "type": "date" }
      }
    }
  }
}
```

---

## Top-Level Configuration Properties

| Property      | Type     | Default   | Description                                                   |
| :------------ | :------- | :-------- | :------------------------------------------------------------ |
| `site`        | `string` | `"Core"`  | Platform display name and Redis channel namespace prefix.     |
| `theme`       | `string` | `"lumen"` | Default theme name used on initial frontend render.           |
| `port.web`    | `number` | `1344`    | HTTP listening port for Express Web / React 19 SPA server.    |
| `port.api`    | `number` | `1345`    | HTTP listening port for REST API service.                     |
| `APIVARS.PRE` | `string` | `""`      | Optional API version prefix (e.g. `"/v1"`).                   |
| `resources`   | `object` | `{}`      | Map of dynamically generated NoSQL collections and endpoints. |
| `plugins`     | `array`  | `[]`      | Array of plugin directory names loaded from `plugins/`.       |
| `pages`       | `array`  | `[]`      | Static route names served by the web application.             |

---

## Resource Schema Options

Each entry in `resources` defines a MongoDB collection and its associated RESTful endpoints:

```json
"tasks": {
  "desc": "Task Management",
  "admin": false,
  "param": "task",
  "clean": { "secretKey": 1 },
  "schema": { ... },
  "exclude": false
}
```

- **`desc` (`string`):** User-friendly description displayed in UI headers and API documentation.
- **`admin` (`boolean`):** When `true`, restricts all CRUD operations to users with `role: "admin"` or `admin: true`.
- **`param` (`string`):** The singular parameter identifier for route URL bindings (e.g., `:task`).
- **`clean` (`object`):** Whitelist of sensitive fields stripped from outgoing JSON responses.
- **`exclude` (`boolean`):** When `true`, creates the underlying database model but skips mounting public REST endpoints.
- **`schema` (`object`):** Defines field validation rules and dynamic form input rendering.

---

## Supported Field Types in `schema`

| Type       | HTML/Input Tag            | Accepted Attributes                | Example Definition                                              |
| :--------- | :------------------------ | :--------------------------------- | :-------------------------------------------------------------- |
| `text`     | `<input type="text">`     | `required`, `placeholder`          | `"name": { "type": "text", "required": true }`                  |
| `number`   | `<input type="number">`   | `min`, `max`, `step`, `required`   | `"price": { "type": "number", "min": 0 }`                       |
| `select`   | `<select>`                | `options` (`string[]`), `required` | `"status": { "type": "select", "options": ["open", "closed"] }` |
| `checkbox` | `<input type="checkbox">` | `required`                         | `"inStock": { "type": "checkbox" }`                             |
| `date`     | `<input type="date">`     | `required`                         | `"dueDate": { "type": "date" }`                                 |

---

## Configuration Validator CLI (`scripts/validate_config.ts`)

The Core Platform includes a static configuration validation engine in [`helpers/configValidator.ts`](../helpers/configValidator.ts) accessible via CLI:

```bash
# Validate config.json
npm run validate:config

# Enforce strict validation (treat warnings as non-zero exit codes)
npx tsx scripts/validate_config.ts --strict

# Output machine-readable JSON validation report
npx tsx scripts/validate_config.ts --json

# Automatically apply recommended fixes to config.json
npx tsx scripts/validate_config.ts --fix

# Validate a custom configuration file path
npx tsx scripts/validate_config.ts --file path/to/custom-config.json
```

### Validation Rules Enforced:

1. Valid port numbers (`1024 - 65535`) without port collision between `port.web` and `port.api`.
2. Resource parameter (`param`) validity and absence of namespace collisions.
3. Schema field types match supported input descriptors.
4. Select fields contain non-empty options arrays.
5. Cleaner objects match valid projection maps (`{ [fieldName]: 1 }`).
