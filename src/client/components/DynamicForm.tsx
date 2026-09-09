import React, { useState, useEffect } from "react";
import type { SchemaField } from "../types/index";

interface DynamicFormProps {
  schema: Record<string, SchemaField | number>;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Save Changes",
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, any> = {};
    for (const [key, fieldDef] of Object.entries(schema)) {
      if (initialValues && initialValues[key] !== undefined) {
        initial[key] = initialValues[key];
      } else if (
        typeof fieldDef === "object" &&
        fieldDef !== null &&
        fieldDef.value !== undefined
      ) {
        initial[key] = fieldDef.value;
      } else {
        initial[key] = "";
      }
    }
    setFormData(initial);
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
      const val = formData[key];
      if (typeof fieldDef === "object" && fieldDef !== null) {
        if (
          fieldDef.required &&
          (val === undefined || val === null || val === "")
        ) {
          newErrors[key] = `${fieldDef.text || key} is required`;
        }
        if (fieldDef.min !== undefined && val !== undefined) {
          if (fieldDef.type === "number" && Number(val) < fieldDef.min) {
            newErrors[key] =
              `${fieldDef.text || key} must be at least ${fieldDef.min}`;
          } else if (typeof val === "string" && val.length < fieldDef.min) {
            newErrors[key] =
              `${fieldDef.text || key} must have at least ${fieldDef.min} characters`;
          }
        }
        if (fieldDef.max !== undefined && val !== undefined) {
          if (fieldDef.type === "number" && Number(val) > fieldDef.max) {
            newErrors[key] =
              `${fieldDef.text || key} must be at most ${fieldDef.max}`;
          } else if (typeof val === "string" && val.length > fieldDef.max) {
            newErrors[key] =
              `${fieldDef.text || key} must have at most ${fieldDef.max} characters`;
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
    <form onSubmit={handleSubmit}>
      {Object.entries(schema).map(([key, fieldDef]) => {
        const isSimpleNumber = typeof fieldDef === "number";
        const field: Partial<SchemaField> = isSimpleNumber
          ? { name: key, text: key, type: "text", tag: "input" }
          : (fieldDef as SchemaField);

        const fieldName = field.name || key;
        const fieldLabel = field.text || key;
        const fieldType = field.type || "text";
        const placeholder = field.placeholder || `Enter ${fieldLabel}`;
        const error = errors[fieldName];
        const value = formData[fieldName] ?? "";

        return (
          <div
            key={fieldName}
            className={`form-group ${error ? "has-error" : ""}`}
            style={{ marginBottom: 16 }}
          >
            <label
              className="control-label"
              style={{ fontWeight: 600, textTransform: "capitalize" }}
            >
              {fieldLabel}
              {field.required && (
                <span className="text-danger" style={{ marginLeft: 4 }}>
                  *
                </span>
              )}
            </label>

            {field.tag === "select" ? (
              <select
                className="form-control"
                value={value}
                onChange={(e) => handleChange(fieldName, e.target.value)}
              >
                <option value="">Select {fieldLabel}...</option>
                {field.options ? (
                  field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </>
                )}
              </select>
            ) : field.tag === "textarea" ? (
              <textarea
                className="form-control"
                rows={3}
                placeholder={placeholder}
                value={value}
                onChange={(e) => handleChange(fieldName, e.target.value)}
              />
            ) : field.tag === "image" ? (
              <div>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Image URL or Path (e.g. /images/item.png)"
                  value={value}
                  onChange={(e) => handleChange(fieldName, e.target.value)}
                />
                {value && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={value}
                      alt="Preview"
                      style={{
                        maxHeight: 80,
                        borderRadius: 4,
                        border: "1px solid #ddd",
                      }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <input
                type={fieldType}
                className="form-control"
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
                autoFocus={field.autofocus}
                autoComplete={field.autocomplete ? "on" : "off"}
              />
            )}

            {error && <span className="help-block text-danger">{error}</span>}
          </div>
        );
      })}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 24,
        }}
      >
        {onCancel && (
          <button
            type="button"
            className="btn btn-default"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          style={{ minWidth: 100 }}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default DynamicForm;
