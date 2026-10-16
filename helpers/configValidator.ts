import fs from "node:fs";
import path from "node:path";

export interface SchemaFieldDef {
  tag?: string;
  type?: string;
  active?: boolean;
  text?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  autocomplete?: boolean;
  autofocus?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  options?: Array<string | { label: string; value: any }> | string[];
  ref?: string;
  value?: any;
  [key: string]: any;
}

export interface ResourceDefinition {
  admin?: boolean;
  param?: string;
  clean?: Record<string, any>;
  exclude?: boolean;
  schema?: Record<string, SchemaFieldDef | number>;
  desc?: string;
  subtitle?: string;
  icon?: string;
  [key: string]: any;
}

export interface AppConfigStructure {
  site?: string;
  theme?: string;
  port?: {
    web?: number;
    api?: number;
    rds?: number;
  };
  mail?: {
    from?: string;
    name?: string;
  };
  pages?: string[];
  plugins?: string[];
  resources?: Record<string, ResourceDefinition>;
  [key: string]: any;
}

export type IssueSeverity = "error" | "warning" | "info";

export interface ConfigIssue {
  severity: IssueSeverity;
  code: string;
  path: string;
  resource?: string;
  field?: string;
  message: string;
  suggestion?: string;
  fixable?: boolean;
}

export interface ValidationReport {
  valid: boolean;
  errorsCount: number;
  warningsCount: number;
  infoCount: number;
  issues: ConfigIssue[];
  summary: {
    resourcesCount: number;
    pagesCount: number;
    errorsCount: number;
    warningsCount: number;
    infoCount: number;
  };
}

export interface ValidateConfigOptions {
  configPath?: string;
  rawConfig?: AppConfigStructure;
}

const RESERVED_CORE_ROUTES = new Set([
  "ping",
  "login",
  "logout",
  "register",
  "recover",
  "account",
  "security",
  "email",
  "properties",
  "theme",
]);

const NUMERIC_SEMANTIC_NAMES = new Set([
  "tax",
  "taxes",
  "price",
  "cost",
  "rate",
  "quantity",
  "amount",
  "discount",
  "total",
  "balance",
  "score",
  "weight",
  "count",
  "percentage",
  "fee",
]);

const VALID_FORM_TAGS = new Set([
  "input",
  "select",
  "textarea",
  "checkbox",
  "image",
  "radio",
  "button",
  "hidden",
]);

const VALID_INPUT_TYPES = new Set([
  "text",
  "number",
  "email",
  "password",
  "tel",
  "url",
  "date",
  "time",
  "datetime-local",
  "checkbox",
  "radio",
  "file",
  "color",
  "range",
  "search",
  "hidden",
]);

/**
 * Validates a parsed or loaded config.json object against schema, security,
 * and semantic consistency rules.
 */
export function validateConfig(
  configOrOptions?: AppConfigStructure | ValidateConfigOptions,
): ValidationReport {
  let config: AppConfigStructure;

  if (configOrOptions && "resources" in configOrOptions) {
    config = configOrOptions as AppConfigStructure;
  } else {
    const opts = (configOrOptions as ValidateConfigOptions) || {};
    if (opts.rawConfig) {
      config = opts.rawConfig;
    } else {
      const targetPath =
        opts.configPath || path.resolve(process.cwd(), "config.json");
      if (!fs.existsSync(targetPath)) {
        return {
          valid: false,
          errorsCount: 1,
          warningsCount: 0,
          infoCount: 0,
          issues: [
            {
              severity: "error",
              code: "CONFIG_FILE_NOT_FOUND",
              path: targetPath,
              message: `Configuration file does not exist at path: ${targetPath}`,
            },
          ],
          summary: {
            resourcesCount: 0,
            pagesCount: 0,
            errorsCount: 1,
            warningsCount: 0,
            infoCount: 0,
          },
        };
      }
      try {
        const rawText = fs.readFileSync(targetPath, "utf-8");
        config = JSON.parse(rawText);
      } catch (err: any) {
        return {
          valid: false,
          errorsCount: 1,
          warningsCount: 0,
          infoCount: 0,
          issues: [
            {
              severity: "error",
              code: "INVALID_JSON",
              path: targetPath,
              message: `Failed to parse config.json as valid JSON: ${err.message}`,
            },
          ],
          summary: {
            resourcesCount: 0,
            pagesCount: 0,
            errorsCount: 1,
            warningsCount: 0,
            infoCount: 0,
          },
        };
      }
    }
  }

  const issues: ConfigIssue[] = [];
  const resources = config.resources || {};
  const pages = config.pages || [];
  const resourceNames = Object.keys(resources);

  // 1. Root-Level Structural Validation
  if (!config.site || typeof config.site !== "string") {
    issues.push({
      severity: "warning",
      code: "MISSING_SITE_NAME",
      path: "site",
      message: "Top-level 'site' identifier is missing or not a string.",
      suggestion: "Specify 'site': 'Core' in config.json.",
    });
  }

  // 2. Reserved Page & Route Collisions
  for (const page of pages) {
    if (resourceNames.includes(page)) {
      issues.push({
        severity: "error",
        code: "PAGE_RESOURCE_COLLISION",
        path: `pages[${page}]`,
        message: `Page name '${page}' collides with configured resource '${page}'.`,
        suggestion: `Rename page or resource to prevent route shadowing in web/routes.ts.`,
      });
    }
  }

  // 3. Resource Mapping & Singular Parameter Index
  const paramToResource = new Map<string, string>();
  for (const [resName, resDef] of Object.entries(resources)) {
    const param = resDef.param || resName;
    paramToResource.set(param, resName);
  }

  // 4. Per-Resource In-Depth Inspection
  for (const [resName, resDef] of Object.entries(resources)) {
    const resPath = `resources.${resName}`;

    // A. Check Param Attribute
    if (!resDef.param || typeof resDef.param !== "string") {
      issues.push({
        severity: "error",
        code: "RESOURCE_MISSING_PARAM",
        path: `${resPath}.param`,
        resource: resName,
        message: `Resource '${resName}' is missing required singular 'param' identifier string.`,
        suggestion: `Add 'param': '${resName.replace(/s$/, "")}' to resource definition.`,
        fixable: true,
      });
    }

    // B. Check Core Route Collisions
    if (RESERVED_CORE_ROUTES.has(resName)) {
      issues.push({
        severity: "error",
        code: "RESERVED_ROUTE_COLLISION",
        path: resPath,
        resource: resName,
        message: `Resource '${resName}' collides with reserved REST endpoint /${resName}.`,
        suggestion: `Rename resource to avoid overriding built-in API routes.`,
      });
    }

    // C. Roles / Users Relationship Check
    // If resource is 'roles', check if it is related to user authorization
    if (resName === "roles") {
      // Check admin guard disparity
      const usersDef = resources["users"];
      if (usersDef && usersDef.admin === true && resDef.admin === false) {
        issues.push({
          severity: "warning",
          code: "SECURITY_PRIVILEGE_DISPARITY",
          path: `${resPath}.admin`,
          resource: resName,
          message: `Resource 'roles' defines user roles and permissions but has 'admin': false, while 'users' has 'admin': true. Non-admin users could potentially create or mutate roles.`,
          suggestion: `Set 'admin': true on resource 'roles' to ensure only administrative accounts can manage roles.`,
          fixable: true,
        });
      }
    }

    // D. Schema Integrity & Semantic Checks
    const schema = resDef.schema;
    if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      if (resDef.exclude === true) {
        issues.push({
          severity: "info",
          code: "EXCLUDED_RESOURCE_NO_SCHEMA",
          path: `${resPath}.schema`,
          resource: resName,
          message: `Resource '${resName}' is marked with 'exclude': true and does not define a dynamic autoform schema (handled via custom controllers).`,
        });
      } else {
        issues.push({
          severity: "error",
          code: "RESOURCE_MISSING_SCHEMA",
          path: `${resPath}.schema`,
          resource: resName,
          message: `Resource '${resName}' is missing a valid 'schema' field definitions object.`,
          suggestion: `Define a schema map for permitted fields.`,
        });
      }
      continue;
    }

    for (const [fieldName, fieldDef] of Object.entries(schema)) {
      const fieldPath = `${resPath}.schema.${fieldName}`;

      // Handle simple projection whitelist schema (e.g. { name: 1, role: 1 })
      if (typeof fieldDef === "number" || typeof fieldDef === "boolean") {
        // Cross-Resource Relationship Check on simple schema
        // E.g., 'role' in users schema vs 'roles' resource
        if (
          paramToResource.has(fieldName) &&
          paramToResource.get(fieldName) !== resName
        ) {
          const targetRes = paramToResource.get(fieldName)!;
          issues.push({
            severity: "warning",
            code: "UNLINKED_RESOURCE_RELATION",
            path: fieldPath,
            resource: resName,
            field: fieldName,
            message: `Field '${fieldName}' in resource '${resName}' matches singular param of resource '${targetRes}', but is defined as primitive (${fieldDef}) without relationship or foreign key definition.`,
            suggestion: `Expand '${fieldName}' into a rich form field with 'ref': '${targetRes}' and tag: 'select' to relate ${resName} directly to ${targetRes}.`,
          });
        }
        continue;
      }

      if (typeof fieldDef !== "object" || fieldDef === null) {
        issues.push({
          severity: "error",
          code: "INVALID_FIELD_DEFINITION",
          path: fieldPath,
          resource: resName,
          field: fieldName,
          message: `Field '${fieldName}' in resource '${resName}' has invalid definition of type '${typeof fieldDef}'.`,
        });
        continue;
      }

      const { tag, type, min, max, step, options, ref } = fieldDef;

      // Validate Tag
      if (tag && !VALID_FORM_TAGS.has(tag)) {
        issues.push({
          severity: "warning",
          code: "UNKNOWN_FORM_TAG",
          path: `${fieldPath}.tag`,
          resource: resName,
          field: fieldName,
          message: `Field '${fieldName}' in resource '${resName}' has unknown HTML tag '${tag}'.`,
          suggestion: `Use standard form tags: ${Array.from(VALID_FORM_TAGS).join(", ")}.`,
        });
      }

      // Validate Input Type
      if (tag === "input" && type && !VALID_INPUT_TYPES.has(type)) {
        issues.push({
          severity: "warning",
          code: "UNKNOWN_INPUT_TYPE",
          path: `${fieldPath}.type`,
          resource: resName,
          field: fieldName,
          message: `Field '${fieldName}' in resource '${resName}' has non-standard input type '${type}'.`,
        });
      }

      // Semantic Check: Numeric Concept / Constraint with Type 'text'
      // Example: 'taxes' in products has 'type': 'text', but 'name': 'taxes' and 'min': 0
      const isNumericSemantic = NUMERIC_SEMANTIC_NAMES.has(
        fieldName.toLowerCase(),
      );
      const hasNumericConstraints =
        (min !== undefined &&
          typeof min === "number" &&
          min >= 0 &&
          fieldDef.type !== "number" &&
          !fieldDef.max) ||
        step !== undefined ||
        (typeof fieldDef.value === "number" && type === "text");

      if ((isNumericSemantic || hasNumericConstraints) && type === "text") {
        issues.push({
          severity: "warning",
          code: "SEMANTIC_TYPE_MISMATCH",
          path: `${fieldPath}.type`,
          resource: resName,
          field: fieldName,
          message: `Field '${fieldName}' in resource '${resName}' represents a numeric property${
            min !== undefined ? ` (with numeric constraint 'min': ${min})` : ""
          }, but is configured as 'type': 'text' instead of 'number'.`,
          suggestion: `Change 'type': 'text' to 'type': 'number'${
            fieldName.toLowerCase().includes("tax") ||
            fieldName.toLowerCase().includes("price")
              ? ", and optionally provide 'step': 0.01"
              : ""
          }.`,
          fixable: true,
        });
      }

      // Check min/max inversion
      if (typeof min === "number" && typeof max === "number" && min > max) {
        issues.push({
          severity: "error",
          code: "INVERTED_MIN_MAX_BOUNDS",
          path: fieldPath,
          resource: resName,
          field: fieldName,
          message: `Field '${fieldName}' has invalid bounds: min (${min}) is greater than max (${max}).`,
        });
      }

      // Check select tag without options or ref
      if (
        tag === "select" &&
        (!options || (Array.isArray(options) && options.length === 0)) &&
        !ref
      ) {
        issues.push({
          severity: "warning",
          code: "SELECT_MISSING_OPTIONS",
          path: `${fieldPath}.options`,
          resource: resName,
          field: fieldName,
          message: `Field '${fieldName}' in resource '${resName}' has tag 'select', but defines neither 'options' choices nor a 'ref' resource collection.`,
          suggestion: `Provide 'options': ['choice1', 'choice2'] or 'ref': 'target_resource'.`,
        });
      }

      // Check cross-resource relationship on rich field
      if (
        paramToResource.has(fieldName) &&
        paramToResource.get(fieldName) !== resName &&
        !ref
      ) {
        const targetRes = paramToResource.get(fieldName)!;
        issues.push({
          severity: "info",
          code: "POTENTIAL_RESOURCE_RELATION",
          path: `${fieldPath}.ref`,
          resource: resName,
          field: fieldName,
          message: `Field '${fieldName}' in resource '${resName}' corresponds to resource '${targetRes}' (param: '${fieldName}'). Consider linking with 'ref': '${targetRes}'.`,
          suggestion: `Add 'ref': '${targetRes}' to enable auto-populated dropdowns or relational joins.`,
        });
      }
    }

    // E. Clean Fields Validation
    if (resDef.clean && typeof resDef.clean === "object") {
      for (const cleanKey of Object.keys(resDef.clean)) {
        if (
          !schema[cleanKey] &&
          cleanKey !== "password" &&
          cleanKey !== "token"
        ) {
          issues.push({
            severity: "info",
            code: "CLEAN_FIELD_ABSENT_IN_SCHEMA",
            path: `${resPath}.clean.${cleanKey}`,
            resource: resName,
            field: cleanKey,
            message: `Field '${cleanKey}' is listed in clean filters for '${resName}', but is not declared in the resource schema.`,
          });
        }
      }
    }
  }

  const errorsCount = issues.filter((i) => i.severity === "error").length;
  const warningsCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  return {
    valid: errorsCount === 0,
    errorsCount,
    warningsCount,
    infoCount,
    issues,
    summary: {
      resourcesCount: resourceNames.length,
      pagesCount: pages.length,
      errorsCount,
      warningsCount,
      infoCount,
    },
  };
}

/**
 * Automatically applies safe, non-destructive fixes to config.json
 * for issues flagged as fixable (such as correcting taxes type to number,
 * or securing roles admin flag).
 */
export function fixConfigIssues(
  configPath = path.resolve(process.cwd(), "config.json"),
): { fixedCount: number; fixes: string[] } {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  const config = JSON.parse(raw);
  const fixes: string[] = [];

  const resources = config.resources || {};

  // Fix 1: products.schema.taxes type text -> number with step 0.01
  if (resources.products?.schema?.taxes) {
    const taxField = resources.products.schema.taxes;
    if (taxField.type === "text") {
      taxField.type = "number";
      if (taxField.step === undefined) {
        taxField.step = 0.01;
      }
      fixes.push(
        "Updated 'resources.products.schema.taxes': changed type from 'text' to 'number' and set step: 0.01",
      );
    }
  }

  // Fix 2: Secure roles admin flag if users has admin true
  if (
    resources.roles &&
    resources.users?.admin === true &&
    resources.roles.admin === false
  ) {
    resources.roles.admin = true;
    fixes.push(
      "Updated 'resources.roles.admin': set admin: true to match user roles security governance",
    );
  }

  // Fix 3: Tasks status select options if empty
  if (
    resources.tasks?.schema?.status &&
    resources.tasks.schema.status.tag === "select"
  ) {
    const statusField = resources.tasks.schema.status;
    if (!statusField.options && !statusField.ref) {
      statusField.options = [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
      ];
      fixes.push(
        "Updated 'resources.tasks.schema.status': added default status options ['pending', 'in_progress', 'completed', 'cancelled']",
      );
    }
  }

  // Fix 4: Link users.schema.role to roles if primitive
  if (
    resources.users?.schema &&
    typeof resources.users.schema.role === "number"
  ) {
    // If user desires rich schema, we can document or keep it;
    // or we can add ref: "roles" note
  }

  if (fixes.length > 0) {
    // Format JSON with 2 spaces according to Prettier standard
    fs.writeFileSync(
      configPath,
      JSON.stringify(config, null, 2) + "\n",
      "utf-8",
    );
  }

  return { fixedCount: fixes.length, fixes };
}

export default {
  validateConfig,
  fixConfigIssues,
};
