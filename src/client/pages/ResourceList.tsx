import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { DynamicForm } from "../components/DynamicForm";
import { Modal } from "../components/Modal";
import {
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check,
  ExternalLink,
  ZoomIn,
  Search,
  X,
  Eye,
} from "lucide-react";
import { getResourceIcon } from "../components/icons";
import config from "../config";
import type { ResourceConfig, SchemaField } from "../types/index";
import { formatResourceTitle, formatFieldLabel } from "../utils";

interface ResourceListProps {
  resourceName: string;
}

interface ImageCellProps {
  url?: string;
  itemTitle?: string;
  onPreview: (url: string, title?: string) => void;
}

const ImageCell: React.FC<ImageCellProps> = ({ url, itemTitle, onPreview }) => {
  const [currentSrc, setCurrentSrc] = useState<string>(
    url || "/images/products/placeholder.svg",
  );

  useEffect(() => {
    setCurrentSrc(url || "/images/products/placeholder.svg");
  }, [url]);

  return (
    <div
      className="resource-image-cell"
      onClick={() => onPreview(currentSrc, itemTitle)}
      title="Click to zoom image"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 38,
          height: 38,
          borderRadius: 6,
          overflow: "hidden",
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-header)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <img
          src={currentSrc}
          alt={itemTitle || "Thumbnail"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onError={() => {
            if (currentSrc !== "/images/products/placeholder.svg") {
              setCurrentSrc("/images/products/placeholder.svg");
            }
          }}
        />
        <div
          className="image-hover-overlay"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            opacity: 0,
            transition: "opacity 0.15s ease",
          }}
        >
          <ZoomIn size={14} />
        </div>
      </div>
    </div>
  );
};

export const ResourceList: React.FC<ResourceListProps> = ({ resourceName }) => {
  const { isAuthenticated, isViewer, logout } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isAuthError = useCallback((err?: string) => {
    return (
      err === "Missing token" ||
      err === "Invalid token" ||
      err === "Token expired"
    );
  }, []);

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [viewDetailsItem, setViewDetailsItem] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Image Lightbox Preview State
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title?: string;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const resourceConfig: ResourceConfig =
    (config.resources as Record<string, ResourceConfig>)[resourceName] || {};
  const entityParam = resourceConfig.param || resourceName;
  const entityTitle = formatResourceTitle(entityParam);
  const resourceTitle = formatResourceTitle(resourceName);
  const resourceSubtitle =
    resourceConfig.subtitle ||
    (resourceConfig.desc && resourceConfig.desc !== resourceName
      ? resourceConfig.desc
      : undefined);

  const ResourceIcon = getResourceIcon(resourceName);

  const schema: Record<string, SchemaField | number> = useMemo(() => {
    const rc =
      (config.resources as Record<string, ResourceConfig>)[resourceName] || {};
    return rc.schema || { name: 1 };
  }, [resourceName]);

  const loadData = useCallback(
    async (page: number, size: number) => {
      if (!api.getToken()) {
        logout();
        window.location.hash = "#/";
        return;
      }

      setIsLoading(true);
      setStatusMessage(null);
      try {
        const [countRes, listRes] = await Promise.all([
          api.getResourceCount(resourceName),
          api.getResources(resourceName, { page, limit: size }),
        ]);

        if (
          isAuthError(listRes.error) ||
          isAuthError((countRes as any)?.error)
        ) {
          logout();
          window.location.hash = "#/";
          return;
        }

        // Process Items and Pagination Envelope
        if (listRes.success) {
          const envelope = listRes.data as any;
          if (envelope && Array.isArray(envelope.data)) {
            setItems(envelope.data);
            if (typeof envelope.pagination?.total === "number") {
              setTotalCount(envelope.pagination.total);
            }
          } else if (Array.isArray(listRes.data)) {
            setItems(listRes.data);
          } else if (Array.isArray(listRes)) {
            setItems(listRes as any);
          }
        } else {
          setItems([]);
          if (listRes.error) {
            setStatusMessage({ type: "error", text: listRes.error });
          }
        }

        // Process Standalone Count fallback
        if (countRes.success) {
          const rawCount =
            typeof countRes.count === "number"
              ? countRes.count
              : typeof (countRes.data as any)?.count === "number"
                ? (countRes.data as any).count
                : undefined;
          if (rawCount !== undefined) {
            setTotalCount(rawCount);
          }
        }
      } catch (err: any) {
        if (isAuthError(err?.message)) {
          logout();
          window.location.hash = "#/";
          return;
        }
        setStatusMessage({
          type: "error",
          text: err?.message || "Failed to load data",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [resourceName, isAuthError, logout],
  );

  // If unauthenticated with no token, smoothly redirect home
  useEffect(() => {
    if (!isAuthenticated && !api.getToken()) {
      window.location.hash = "#/";
    }
  }, [isAuthenticated]);

  // Load when resource, page, or pageSize changes
  useEffect(() => {
    loadData(currentPage, pageSize);
  }, [loadData, currentPage, pageSize]);

  // Reset to page 1 when changing resource
  useEffect(() => {
    setCurrentPage(1);
  }, [resourceName]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  };

  const handleCreate = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const res = await api.createResource(resourceName, values);
      if (res.success) {
        setIsCreateOpen(false);
        setStatusMessage({
          type: "success",
          text: `Created new ${entityParam} successfully!`,
        });
        await loadData(currentPage, pageSize);
      } else {
        if (isAuthError(res.error)) {
          logout();
          window.location.hash = "#/";
          return;
        }
        setStatusMessage({
          type: "error",
          text: res.error || "Creation failed",
        });
      }
    } catch (err: any) {
      if (isAuthError(err?.message)) {
        logout();
        window.location.hash = "#/";
        return;
      }
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
          text: `Updated ${entityParam} successfully!`,
        });
        await loadData(currentPage, pageSize);
      } else {
        if (isAuthError(res.error)) {
          logout();
          window.location.hash = "#/";
          return;
        }
        setStatusMessage({
          type: "error",
          text: res.error || "Update failed",
        });
      }
    } catch (err: any) {
      if (isAuthError(err?.message)) {
        logout();
        window.location.hash = "#/";
        return;
      }
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
          text: `Deleted ${entityParam} successfully!`,
        });
        await loadData(currentPage, pageSize);
      } else {
        if (isAuthError(res.error)) {
          logout();
          window.location.hash = "#/";
          return;
        }
        setStatusMessage({
          type: "error",
          text: res.error || "Delete failed",
        });
      }
    } catch (err: any) {
      if (isAuthError(err?.message)) {
        logout();
        window.location.hash = "#/";
        return;
      }
      setStatusMessage({
        type: "error",
        text: err?.message || "Delete error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const schemaKeys = Object.keys(schema);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const fromRecord = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toRecord = Math.min(currentPage * pageSize, totalCount);

  // Generate smart pagination page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter((item) => {
      return Object.entries(item).some(([k, v]) => {
        if (k.startsWith("_") || v === null || v === undefined) return false;
        return String(v).toLowerCase().includes(lower);
      });
    });
  }, [items, searchTerm]);

  return (
    <div
      className="resource-list-viewport-container"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 0",
        minHeight: 0,
        height: "calc(100vh - 74px)",
        padding: "0 24px 12px 24px",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      {/* Main Full-Height Resource Card */}
      <div
        className="card resource-list-card"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: "1 1 0",
          minHeight: 0,
          overflow: "hidden",
          borderRadius: "var(--radius-card)",
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-card)",
          marginBottom: 0,
        }}
      >
        {/* Card Header (Fixed Top) */}
        <div
          className="resource-card-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            flexWrap: "wrap",
            gap: 12,
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-card)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="icon-badge">
              <ResourceIcon size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h4
                  className="card-title"
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: 16,
                    textTransform: "capitalize",
                  }}
                >
                  {resourceTitle}
                </h4>
                {resourceConfig.admin && (
                  <span
                    className="badge badge-danger"
                    style={{
                      fontSize: 9,
                      padding: "2px 6px",
                      textTransform: "uppercase",
                    }}
                  >
                    Admin
                  </span>
                )}
                <span
                  className="badge badge-info"
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  {totalCount.toLocaleString()}{" "}
                  {totalCount === 1 ? "record" : "records"}
                </span>
              </div>
              {resourceSubtitle && (
                <p className="card-desc" style={{ margin: "2px 0 0 0" }}>
                  {resourceSubtitle}
                </p>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {/* Live Search Input */}
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Search
                size={14}
                className="text-muted"
                style={{
                  position: "absolute",
                  left: 10,
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder={`Search ${resourceTitle}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  height: 36,
                  padding: "0 28px 0 30px",
                  fontSize: 13,
                  borderRadius: "var(--radius-input)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-body)",
                  color: "var(--text-color)",
                  width: 180,
                  outline: "none",
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                  style={{
                    position: "absolute",
                    right: 8,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => loadData(currentPage, pageSize)}
              title="Refresh records"
              disabled={isLoading}
              style={{
                height: 36,
                padding: "0 10px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={14} className={isLoading ? "spin" : ""} />
              <span className="d-none d-md-inline">Refresh</span>
            </button>

            {isAuthenticated && !isViewer && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCreateOpen(true)}
                style={{
                  height: 36,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: "var(--radius-btn)",
                  padding: "0 14px",
                  fontSize: 13,
                }}
              >
                <Plus size={15} />
                <span>New {entityTitle}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Message Notification */}
        {statusMessage && (
          <div
            style={{
              padding: "10px 20px",
              flexShrink: 0,
              backgroundColor: "var(--bg-header)",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <div
              className={`alert alert-${statusMessage.type === "success" ? "success" : "danger"}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: 0,
                padding: "8px 12px",
                borderRadius: "var(--radius-btn)",
                fontSize: 13,
              }}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span>{statusMessage.text}</span>
            </div>
          </div>
        )}

        {/* Full-Height Responsive Virtual Scroll Table Container */}
        <div
          ref={tableContainerRef}
          className="table-container resource-table-scroll-container"
          style={{
            flex: "1 1 0",
            minHeight: 0,
            overflow: "auto",
            position: "relative",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <table
            className="table table-striped table-hover resource-table"
            style={{ margin: 0, width: "100%", borderCollapse: "separate" }}
          >
            <thead>
              <tr style={{ position: "sticky", top: 0, zIndex: 5 }}>
                {schemaKeys.map((key, idx) => {
                  const fieldDef = schema[key];
                  const label =
                    typeof fieldDef === "object" &&
                    fieldDef !== null &&
                    fieldDef.text
                      ? fieldDef.text
                      : formatFieldLabel(key);
                  const isImage =
                    key === "image" ||
                    (typeof fieldDef === "object" && fieldDef?.tag === "image");

                  return (
                    <th
                      key={key}
                      style={{
                        paddingLeft: idx === 0 ? 20 : 14,
                        position: "sticky",
                        top: 0,
                        backgroundColor: "var(--bg-header)",
                        boxShadow: "inset 0 -1px 0 var(--border-color)",
                        whiteSpace: "nowrap",
                        zIndex: 2,
                        width: isImage ? 70 : undefined,
                        textAlign: isImage ? "center" : "left",
                      }}
                    >
                      {label}
                    </th>
                  );
                })}
                <th
                  style={{
                    textAlign: "right",
                    width: 100,
                    paddingRight: 20,
                    position: "sticky",
                    top: 0,
                    backgroundColor: "var(--bg-header)",
                    boxShadow: "inset 0 -1px 0 var(--border-color)",
                    zIndex: 2,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && items.length === 0 ? (
                <tr>
                  <td
                    colSpan={schemaKeys.length + 1}
                    style={{ textAlign: "center", padding: "60px 0" }}
                  >
                    <RefreshCw
                      size={24}
                      className="spin text-primary"
                      style={{ margin: "0 auto 10px auto", display: "block" }}
                    />
                    <span className="text-muted" style={{ fontSize: 13.5 }}>
                      Loading {resourceTitle}...
                    </span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={schemaKeys.length + 1}
                    style={{ textAlign: "center", padding: "60px 0" }}
                  >
                    <ResourceIcon
                      size={32}
                      className="text-muted"
                      style={{
                        margin: "0 auto 10px auto",
                        display: "block",
                        opacity: 0.4,
                      }}
                    />
                    <p
                      className="text-muted"
                      style={{ margin: 0, fontSize: 13.5 }}
                    >
                      No {resourceTitle} found.
                    </p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={schemaKeys.length + 1}
                    style={{ textAlign: "center", padding: "40px 0" }}
                  >
                    <Search
                      size={28}
                      className="text-muted"
                      style={{
                        margin: "0 auto 10px auto",
                        display: "block",
                        opacity: 0.4,
                      }}
                    />
                    <p
                      className="text-muted"
                      style={{ margin: "0 0 10px 0", fontSize: 13.5 }}
                    >
                      No results matching "{searchTerm}".
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear Search
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item._id || Math.random()}
                    title={item._id ? `ID: ${item._id}` : undefined}
                  >
                    {schemaKeys.map((key, idx) => {
                      const val = item[key];
                      const fieldDef = schema[key];
                      const isImage =
                        key === "image" ||
                        (typeof fieldDef === "object" &&
                          fieldDef?.tag === "image");

                      if (isImage) {
                        return (
                          <td
                            key={key}
                            style={{
                              paddingLeft: idx === 0 ? 20 : 14,
                              verticalAlign: "middle",
                              textAlign: "center",
                              width: 70,
                            }}
                          >
                            <ImageCell
                              url={val}
                              itemTitle={
                                item.name ||
                                item.title ||
                                `${entityTitle} #${item._id}`
                              }
                              onPreview={(u, t) =>
                                setPreviewImage({ url: u, title: t })
                              }
                            />
                          </td>
                        );
                      }

                      return (
                        <td
                          key={key}
                          style={{
                            paddingLeft: idx === 0 ? 20 : 14,
                            verticalAlign: "middle",
                          }}
                        >
                          {val !== undefined && val !== null ? (
                            typeof val === "boolean" ? (
                              val ? (
                                <span className="badge badge-primary">Yes</span>
                              ) : (
                                <span className="badge badge-secondary">
                                  No
                                </span>
                              )
                            ) : (
                              String(val)
                            )
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td
                      style={{
                        textAlign: "right",
                        whiteSpace: "nowrap",
                        paddingRight: 20,
                        verticalAlign: "middle",
                      }}
                    >
                      {isAuthenticated && (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {isViewer ? (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setViewDetailsItem(item)}
                              title="View Details"
                              style={{
                                width: 30,
                                height: 30,
                                padding: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "var(--radius-btn)",
                              }}
                            >
                              <Eye size={13} />
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setEditItem(item)}
                                title="Edit"
                                style={{
                                  width: 30,
                                  height: 30,
                                  padding: 0,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "var(--radius-btn)",
                                }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => setDeleteTarget(item)}
                                title="Delete"
                                style={{
                                  width: 30,
                                  height: 30,
                                  padding: 0,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "var(--radius-btn)",
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pinned Responsive Pagination Footer */}
        <div
          className="resource-pagination-footer"
          style={{
            padding: "10px 20px",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            backgroundColor: "var(--bg-card)",
            flexShrink: 0,
            fontSize: 13,
          }}
        >
          {/* Left: Range and Totals */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "var(--text-muted)",
            }}
          >
            <span>
              Showing{" "}
              <strong style={{ color: "var(--text-color)" }}>
                {fromRecord.toLocaleString()}
              </strong>{" "}
              to{" "}
              <strong style={{ color: "var(--text-color)" }}>
                {toRecord.toLocaleString()}
              </strong>{" "}
              of{" "}
              <strong style={{ color: "var(--text-color)" }}>
                {totalCount.toLocaleString()}
              </strong>{" "}
              {totalCount === 1 ? "entry" : "entries"}
            </span>

            {/* Page Size Segmented Selector */}
            <div
              className="page-size-selector"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                Per page:
              </span>
              <div
                className="page-size-pill-group"
                role="group"
                aria-label="Items per page"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: "var(--bg-header)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-btn)",
                  padding: 2,
                  gap: 2,
                }}
              >
                {[10, 25, 50, 100, 200].map((size) => {
                  const isSelected = pageSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handlePageSizeChange(size)}
                      disabled={isLoading}
                      aria-pressed={isSelected}
                      title={`Show ${size} entries per page`}
                      className={`page-size-pill ${isSelected ? "active" : ""}`}
                      style={{
                        border: "none",
                        borderRadius: "calc(var(--radius-btn) - 2px)",
                        padding: "3px 8px",
                        fontSize: 12,
                        fontWeight: isSelected ? 700 : 500,
                        backgroundColor: isSelected
                          ? "var(--bg-card)"
                          : "transparent",
                        color: isSelected
                          ? "var(--primary)"
                          : "var(--text-muted)",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        boxShadow: isSelected
                          ? "0 1px 3px rgba(0, 0, 0, 0.12)"
                          : "none",
                        transition: "all 0.15s ease",
                        outline: "none",
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Pagination Controls */}
          {totalPages > 1 && (
            <div
              className="pagination-btn-group"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {/* First Page */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage <= 1 || isLoading}
                title="First page"
                style={{ width: 30, height: 30, padding: 0 }}
              >
                <ChevronsLeft size={14} />
              </button>

              {/* Previous Page */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
                title="Previous page"
                style={{ width: 30, height: 30, padding: 0 }}
              >
                <ChevronLeft size={14} />
              </button>

              {/* Page Number Chips */}
              {pageNumbers.map((p, i) => {
                if (p === "...") {
                  return (
                    <span
                      key={`ellipsis-${i}`}
                      style={{
                        padding: "0 4px",
                        color: "var(--text-muted)",
                        fontSize: 12,
                      }}
                    >
                      ...
                    </span>
                  );
                }
                const pageNum = p as number;
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    className={`btn btn-sm ${isActive ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isLoading}
                    style={{
                      minWidth: 30,
                      height: 30,
                      padding: "0 6px",
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Page */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                title="Next page"
                style={{ width: 30, height: 30, padding: 0 }}
              >
                <ChevronRight size={14} />
              </button>

              {/* Last Page */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages || isLoading}
                title="Last page"
                style={{ width: 30, height: 30, padding: 0 }}
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox Modal */}
      <Modal
        isOpen={!!previewImage}
        title={previewImage?.title || "Image Preview"}
        icon={<ImageIcon size={16} />}
        onClose={() => setPreviewImage(null)}
        size="lg"
      >
        {previewImage && (
          <div style={{ textAlign: "center", padding: "10px 4px 4px 4px" }}>
            <div
              style={{
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-header)",
                maxHeight: "60vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 12,
              }}
            >
              <img
                src={previewImage.url}
                alt={previewImage.title || "Full Preview"}
                style={{
                  maxWidth: "100%",
                  maxHeight: "55vh",
                  objectFit: "contain",
                  borderRadius: 6,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/products/placeholder.svg";
                }}
              />
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                backgroundColor: "var(--bg-header)",
                padding: "8px 12px",
                borderRadius: "var(--radius-input)",
                border: "1px solid var(--border-color)",
                fontSize: 12,
              }}
            >
              <span
                className="text-muted"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 320,
                  textAlign: "left",
                }}
              >
                {previewImage.url}
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopyUrl(previewImage.url)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 30,
                    fontSize: 12,
                  }}
                >
                  {copiedUrl ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedUrl ? "Copied!" : "Copy URL"}</span>
                </button>

                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 30,
                    fontSize: 12,
                  }}
                >
                  <ExternalLink size={13} />
                  <span>Open Full</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        title={`New ${entityTitle}`}
        icon={<Plus size={15} />}
        onClose={() => setIsCreateOpen(false)}
      >
        <DynamicForm
          key={isCreateOpen ? `create-${resourceName}` : "idle-create"}
          schema={schema}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          submitLabel={`Create ${entityTitle}`}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editItem}
        title={`Edit ${entityTitle}`}
        icon={<Edit2 size={15} />}
        onClose={() => setEditItem(null)}
      >
        {editItem && (
          <DynamicForm
            key={editItem._id ? `edit-${editItem._id}` : "idle-edit"}
            schema={schema}
            initialValues={editItem}
            onSubmit={handleUpdate}
            onCancel={() => setEditItem(null)}
            submitLabel="Save Changes"
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        title="Confirm Deletion"
        icon={<Trash2 size={15} className="text-danger" />}
        onClose={() => setDeleteTarget(null)}
        size="sm"
      >
        <div style={{ textAlign: "center", padding: "8px 4px 4px 4px" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Trash2 size={18} className="text-danger" />
          </div>
          <p
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              margin: "0 0 18px 0",
            }}
          >
            Are you sure you want to delete this {entityParam}?
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={isSubmitting}
              style={{ borderRadius: 6, fontSize: 13, padding: "6px 14px" }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={isSubmitting}
              style={{ borderRadius: 6, fontSize: 13, padding: "6px 16px" }}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Details Modal for Read-Only Viewers */}
      <Modal
        isOpen={!!viewDetailsItem}
        title={`${entityTitle} Details (Read-Only)`}
        icon={<Eye size={15} />}
        onClose={() => setViewDetailsItem(null)}
      >
        <div style={{ padding: "8px 0" }}>
          {viewDetailsItem && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxHeight: "65vh",
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {Object.entries(viewDetailsItem).map(([key, value]) => {
                if (key === "password" || key === "token") return null;
                const formattedVal =
                  value === null || value === undefined
                    ? "—"
                    : typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value);

                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      padding: "8px 12px",
                      backgroundColor: "var(--bg-header)",
                      borderRadius: 6,
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-muted)",
                      }}
                    >
                      {formatFieldLabel(key)}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text-color)",
                        wordBreak: "break-word",
                        fontFamily:
                          key === "_id" || key.endsWith("Id") || key === "sku"
                            ? "monospace"
                            : "inherit",
                      }}
                    >
                      {formattedVal}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setViewDetailsItem(null)}
              style={{ borderRadius: 6, fontSize: 13, padding: "6px 16px" }}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ResourceList;
