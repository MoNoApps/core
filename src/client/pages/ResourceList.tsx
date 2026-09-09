import React, { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { DynamicForm } from "../components/DynamicForm";
import { Modal } from "../components/Modal";
import {
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Database,
} from "lucide-react";
import config from "../config";
import type { ResourceConfig, SchemaField } from "../types/index";

interface ResourceListProps {
  resourceName: string;
}

export const ResourceList: React.FC<ResourceListProps> = ({ resourceName }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { subscribe } = useSocket();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const resourceConfig: ResourceConfig =
    (config.resources as Record<string, ResourceConfig>)[resourceName] || {};
  const schema: Record<string, SchemaField | number> =
    resourceConfig.schema || { name: 1 };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.getResources(resourceName);
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data);
      } else if (res.success && Array.isArray(res)) {
        setItems(res as any);
      } else {
        setItems([]);
        if (res.error) {
          setStatusMessage({ type: "error", text: res.error });
        }
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to load data",
      });
    } finally {
      setIsLoading(false);
    }
  }, [resourceName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription: updates table when modifications occur
  useEffect(() => {
    const unsub = subscribe(`resource:${resourceName}:change`, () => {
      loadData();
    });
    return () => {
      unsub();
    };
  }, [resourceName, subscribe, loadData]);

  const handleCreate = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const res = await api.createResource(resourceName, values);
      if (res.success) {
        setIsCreateOpen(false);
        setStatusMessage({
          type: "success",
          text: `Created new ${resourceName} record successfully!`,
        });
        await loadData();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Creation failed",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Creation error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (values: Record<string, any>) => {
    if (!editItem?._id) return;
    setIsSubmitting(true);
    try {
      const res = await api.updateResource(resourceName, editItem._id, values);
      if (res.success) {
        setEditItem(null);
        setStatusMessage({
          type: "success",
          text: `Updated ${resourceName} record successfully!`,
        });
        await loadData();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Update failed",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Update error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    setIsSubmitting(true);
    try {
      const res = await api.deleteResource(resourceName, deleteTarget._id);
      if (res.success) {
        setDeleteTarget(null);
        setStatusMessage({
          type: "success",
          text: `Deleted ${resourceName} record successfully!`,
        });
        await loadData();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Delete failed",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Delete error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter items by search query
  const schemaKeys = Object.keys(schema);
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item._id?.toLowerCase().includes(q) ||
      schemaKeys.some((k) => {
        const val = item[k];
        return val !== undefined && String(val).toLowerCase().includes(q);
      })
    );
  });

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* Header & Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{ margin: 0, fontWeight: 700, textTransform: "capitalize" }}
          >
            {resourceName}
          </h2>
          <p
            className="text-muted"
            style={{ margin: "4px 0 0 0", fontSize: 13 }}
          >
            Managed NoSQL collection schema with real-time sync & auto-generated
            CRUD.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="btn btn-default"
            onClick={loadData}
            disabled={isLoading}
            title="Refresh table"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={16} className={isLoading ? "spin" : ""} />
            Refresh
          </button>

          {isAuthenticated && (
            <button
              className="btn btn-primary"
              onClick={() => setIsCreateOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={16} />
              New {resourceName.slice(0, -1) || resourceName}
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`alert alert-${statusMessage.type === "success" ? "success" : "danger"}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="panel panel-default" style={{ marginBottom: 20 }}>
        <div className="panel-body" style={{ padding: "12px 16px" }}>
          <div className="input-group">
            <span className="input-group-addon">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder={`Search ${resourceName} by any attribute or ID...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <span className="input-group-btn">
                <button
                  className="btn btn-default"
                  onClick={() => setSearchQuery("")}
                >
                  Clear
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div
        className="panel panel-default"
        style={{
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <div className="table-responsive">
          <table
            className="table table-striped table-hover"
            style={{ margin: 0 }}
          >
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                <th style={{ width: 140 }}>ID</th>
                {schemaKeys.map((key) => {
                  const fieldDef = schema[key];
                  const label =
                    typeof fieldDef === "object" &&
                    fieldDef !== null &&
                    fieldDef.text
                      ? fieldDef.text
                      : key;
                  return (
                    <th key={key} style={{ textTransform: "capitalize" }}>
                      {label}
                    </th>
                  );
                })}
                <th style={{ textAlign: "right", width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && items.length === 0 ? (
                <tr>
                  <td
                    colSpan={schemaKeys.length + 2}
                    style={{ textAlign: "center", padding: "40px 0" }}
                  >
                    <RefreshCw
                      size={24}
                      className="spin text-primary"
                      style={{ margin: "0 auto 8px auto", display: "block" }}
                    />
                    <span className="text-muted">
                      Loading {resourceName}...
                    </span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={schemaKeys.length + 2}
                    style={{ textAlign: "center", padding: "40px 0" }}
                  >
                    <Database
                      size={32}
                      className="text-muted"
                      style={{ margin: "0 auto 8px auto", display: "block" }}
                    />
                    <p className="text-muted" style={{ margin: 0 }}>
                      No {resourceName} found.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id || Math.random()}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                      {item._id ? item._id.substring(0, 10) + "..." : "—"}
                    </td>
                    {schemaKeys.map((key) => {
                      const val = item[key];
                      const fieldDef = schema[key];
                      const isImage =
                        typeof fieldDef === "object" &&
                        fieldDef?.tag === "image";

                      if (isImage && val) {
                        return (
                          <td key={key}>
                            <img
                              src={val}
                              alt="Thumbnail"
                              style={{
                                height: 32,
                                width: 32,
                                objectFit: "cover",
                                borderRadius: 4,
                              }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display =
                                  "none";
                              }}
                            />
                          </td>
                        );
                      }

                      return (
                        <td key={key}>
                          {val !== undefined && val !== null
                            ? String(val)
                            : "—"}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {isAuthenticated && (
                        <>
                          <button
                            className="btn btn-default btn-xs"
                            onClick={() => setEditItem(item)}
                            title="Edit"
                            style={{ marginRight: 6 }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-danger btn-xs"
                            onClick={() => setDeleteTarget(item)}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        title={`Create New ${resourceName.slice(0, -1) || resourceName}`}
        onClose={() => setIsCreateOpen(false)}
      >
        <DynamicForm
          schema={schema}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          submitLabel="Create Record"
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editItem}
        title={`Edit ${resourceName.slice(0, -1) || resourceName}`}
        onClose={() => setEditItem(null)}
      >
        {editItem && (
          <DynamicForm
            schema={schema}
            initialValues={editItem}
            onSubmit={handleUpdate}
            onCancel={() => setEditItem(null)}
            submitLabel="Update Record"
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        title="Confirm Deletion"
        onClose={() => setDeleteTarget(null)}
        size="sm"
      >
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <Trash2
            size={40}
            className="text-danger"
            style={{ marginBottom: 12 }}
          />
          <p>Are you sure you want to delete this {resourceName} item?</p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginTop: 20,
            }}
          >
            <button
              className="btn btn-default"
              onClick={() => setDeleteTarget(null)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ResourceList;
