import React, { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  Check,
  RefreshCw,
  Image as ImageIcon,
  X as XIcon,
} from "lucide-react";
import type { SchemaField } from "../types/index";
import { CustomSelect } from "./CustomSelect";
import { formatFieldLabel } from "../utils";
import api from "../api/client";

interface DynamicFormProps {
  schema: Record<string, SchemaField | number>;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

const EMPTY_INITIAL_VALUES: Record<string, any> = Object.freeze({});

function getInitialFormData(
  schema: Record<string, SchemaField | number>,
  values?: Record<string, any>,
): Record<string, any> {
  const initial: Record<string, any> = {};
  for (const [key, fieldDef] of Object.entries(schema || {})) {
    if (
      typeof fieldDef === "object" &&
      fieldDef !== null &&
      fieldDef.active === false
    ) {
      continue;
    }
    const fieldName =
      typeof fieldDef === "object" && fieldDef !== null && fieldDef.name
        ? fieldDef.name
        : key;

    if (
      values &&
      values[fieldName] !== undefined &&
      values[fieldName] !== null
    ) {
      initial[fieldName] = values[fieldName];
    } else if (values && values[key] !== undefined && values[key] !== null) {
      initial[fieldName] = values[key];
    } else if (
      typeof fieldDef === "object" &&
      fieldDef !== null &&
      fieldDef.value !== undefined
    ) {
      initial[fieldName] = fieldDef.value;
    } else {
      initial[fieldName] = "";
    }
  }
  return initial;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  initialValues = EMPTY_INITIAL_VALUES,
  onSubmit,
  onCancel,
  submitLabel = "Save Changes",
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(() =>
    getInitialFormData(schema, initialValues),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dynamicRefOptions, setDynamicRefOptions] = useState<
    Record<string, string[]>
  >({});

  const prevRecordIdRef = useRef<string | undefined>(initialValues?._id);
  const prevSchemaRef = useRef(schema);

  useEffect(() => {
    let isMounted = true;
    const refFields: { fieldName: string; refResource: string }[] = [];

    for (const [key, fieldDef] of Object.entries(schema || {})) {
      if (
        typeof fieldDef === "object" &&
        fieldDef !== null &&
        fieldDef.ref &&
        fieldDef.tag === "select"
      ) {
        const fieldName = fieldDef.name || key;
        refFields.push({ fieldName, refResource: fieldDef.ref });
      }
    }

    if (refFields.length === 0) return;

    Promise.all(
      refFields.map(async ({ fieldName, refResource }) => {
        try {
          const res = await api.getResources(refResource, { limit: 100 });
          let list: any[] = [];
          if (res.success && Array.isArray((res.data as any)?.data)) {
            list = (res.data as any).data;
          } else if (res.success && Array.isArray(res.data)) {
            list = res.data;
          } else if (Array.isArray(res)) {
            list = res;
          }

          if (list.length > 0) {
            const labels = list
              .map(
                (item) =>
                  item.name ||
                  item.orderNumber ||
                  item.invoiceNumber ||
                  item.code ||
                  item.title ||
                  item.slug ||
                  String(item._id),
              )
              .filter(Boolean);

            if (labels.length > 0) {
              return { fieldName, labels };
            }
          }
        } catch {
          // Graceful fallback to static options
        }
        return null;
      }),
    ).then((results) => {
      if (!isMounted) return;
      const newOpts: Record<string, string[]> = {};
      for (const r of results) {
        if (r && r.labels.length > 0) {
          newOpts[r.fieldName] = r.labels;
        }
      }
      if (Object.keys(newOpts).length > 0) {
        setDynamicRefOptions((prev) => ({ ...prev, ...newOpts }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [schema]);

  useEffect(() => {
    const currentId = initialValues?._id;
    const isDifferentRecord = prevRecordIdRef.current !== currentId;
    const isDifferentSchema = prevSchemaRef.current !== schema;

    if (isDifferentRecord || isDifferentSchema) {
      prevRecordIdRef.current = currentId;
      prevSchemaRef.current = schema;
      setFormData(getInitialFormData(schema, initialValues));
      setErrors({});
    }
  }, [schema, initialValues]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate fields against schema constraints
    for (const [key, fieldDef] of Object.entries(schema)) {
      if (
        typeof fieldDef === "object" &&
        fieldDef !== null &&
        fieldDef.active === false
      ) {
        continue;
      }
      const fieldName =
        typeof fieldDef === "object" && fieldDef !== null && fieldDef.name
          ? fieldDef.name
          : key;
      const val = formData[fieldName];

      if (typeof fieldDef === "object" && fieldDef !== null) {
        const label = fieldDef.text || key;
        if (
          fieldDef.required &&
          (val === undefined || val === null || String(val).trim() === "")
        ) {
          newErrors[fieldName] = `${label} is required`;
          continue;
        }

        if (
          fieldDef.min !== undefined &&
          val !== undefined &&
          val !== null &&
          val !== ""
        ) {
          if (fieldDef.type === "number" && Number(val) < fieldDef.min) {
            newErrors[fieldName] = `${label} must be at least ${fieldDef.min}`;
          } else if (
            fieldDef.type !== "number" &&
            String(val).length < fieldDef.min
          ) {
            newErrors[fieldName] =
              `${label} must have at least ${fieldDef.min} characters`;
          }
        }

        if (
          fieldDef.max !== undefined &&
          val !== undefined &&
          val !== null &&
          val !== ""
        ) {
          if (fieldDef.type === "number" && Number(val) > fieldDef.max) {
            newErrors[fieldName] = `${label} must be at most ${fieldDef.max}`;
          } else if (
            fieldDef.type !== "number" &&
            String(val).length > fieldDef.max
          ) {
            newErrors[fieldName] =
              `${label} must have at most ${fieldDef.max} characters`;
          }
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {Object.entries(schema).map(([key, fieldDef]) => {
        if (
          typeof fieldDef === "object" &&
          fieldDef !== null &&
          fieldDef.active === false
        ) {
          return null;
        }

        const isSimpleNumber = typeof fieldDef === "number";
        const field: Partial<SchemaField> = isSimpleNumber
          ? { name: key, text: key, type: "text", tag: "input" }
          : (fieldDef as SchemaField);

        const fieldName = field.name || key;
        const fieldLabel = field.text || formatFieldLabel(key);
        const fieldType = field.type || "text";
        const placeholder =
          field.placeholder !== undefined
            ? field.placeholder
            : `Enter ${fieldLabel.toLowerCase()}`;
        const error = errors[fieldName];
        const value = formData[fieldName] ?? "";

        return (
          <div key={fieldName} className="modern-form-group">
            <label className="modern-form-label" htmlFor={`field-${fieldName}`}>
              {fieldLabel}
              {field.required && (
                <span className="modern-required-dot" title="Required">
                  *
                </span>
              )}
            </label>

            {field.tag === "select" ? (
              <CustomSelect
                id={`field-${fieldName}`}
                name={fieldName}
                value={value}
                onChange={(val) => handleChange(fieldName, val)}
                options={
                  dynamicRefOptions[fieldName] ||
                  field.options || [
                    "pending",
                    "active",
                    "completed",
                    "archived",
                  ]
                }
                placeholder={`Select ${fieldLabel}...`}
                required={field.required}
                hasError={!!error}
              />
            ) : field.tag === "textarea" ? (
              <textarea
                id={`field-${fieldName}`}
                className={`modern-form-input ${error ? "has-error" : ""}`}
                rows={3}
                placeholder={placeholder}
                value={value}
                onChange={(e) => handleChange(fieldName, e.target.value)}
              />
            ) : field.tag === "image" ? (
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    id={`field-${fieldName}`}
                    type="text"
                    className={`modern-form-input ${error ? "has-error" : ""}`}
                    placeholder={
                      placeholder ||
                      "Image URL (e.g. /images/products/placeholder.svg)"
                    }
                    value={value}
                    onChange={(e) => handleChange(fieldName, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {value && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleChange(fieldName, "")}
                      title="Clear image"
                      style={{ padding: "0 10px", height: 38 }}
                    >
                      <XIcon size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      handleChange(
                        fieldName,
                        "/images/products/placeholder.svg",
                      )
                    }
                    title="Set to standard placeholder SVG"
                    style={{ whiteSpace: "nowrap", height: 38, fontSize: 12 }}
                  >
                    Default SVG
                  </button>
                </div>

                {value ? (
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 8,
                      borderRadius: "var(--radius-input)",
                      backgroundColor: "var(--bg-header)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <img
                      src={value}
                      alt="Preview"
                      style={{
                        height: 52,
                        width: 52,
                        objectFit: "cover",
                        borderRadius: "var(--radius-btn)",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-card)",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/images/products/placeholder.svg";
                      }}
                    />
                    <div style={{ fontSize: 12, overflow: "hidden" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text-color)",
                          marginBottom: 2,
                        }}
                      >
                        Image Preview
                      </div>
                      <div
                        className="text-muted"
                        style={{
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          maxWidth: 280,
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <ImageIcon size={12} />
                    <span>
                      Enter an image URL or use the default placeholder SVG.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <input
                id={`field-${fieldName}`}
                name={fieldName}
                type={fieldType}
                className={`modern-form-input ${error ? "has-error" : ""}`}
                placeholder={placeholder}
                value={value}
                onChange={(e) =>
                  handleChange(
                    fieldName,
                    fieldType === "number"
                      ? e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                      : e.target.value,
                  )
                }
                autoFocus={field.autofocus === true}
                autoComplete={field.autocomplete ? "on" : "off"}
                min={
                  fieldType === "number" && field.min !== undefined
                    ? field.min
                    : undefined
                }
                max={
                  fieldType === "number" && field.max !== undefined
                    ? field.max
                    : undefined
                }
                minLength={
                  fieldType !== "number" && field.min !== undefined
                    ? field.min
                    : undefined
                }
                maxLength={
                  fieldType !== "number" && field.max !== undefined
                    ? field.max
                    : undefined
                }
              />
            )}

            {error && (
              <div className="modern-field-error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>
        );
      })}

      <div className="modal-footer-custom">
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{ borderRadius: 6, fontSize: 13, padding: "6px 14px" }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          style={{
            borderRadius: 6,
            fontSize: 13,
            padding: "6px 16px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="spin" size={14} />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check size={14} />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default DynamicForm;
