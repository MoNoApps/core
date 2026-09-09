import React, { useState } from "react";
import config from "../config";
import { BookOpen, Terminal, CheckCircle2, Play } from "lucide-react";
import api from "../api/client";

export const Docs: React.FC = () => {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);

  const resources = Object.entries(config.resources || {}).filter(
    ([name, res]: [string, any]) => !res.exclude,
  );

  const runPingTest = async () => {
    setTestingEndpoint("ping");
    setTestResult(null);
    try {
      const res = await api.getPing();
      setTestResult(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setTestResult(JSON.stringify({ error: err?.message }, null, 2));
    } finally {
      setTestingEndpoint(null);
    }
  };

  const runThemeTest = async () => {
    setTestingEndpoint("theme");
    setTestResult(null);
    try {
      const res = await api.getTheme();
      setTestResult(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setTestResult(JSON.stringify({ error: err?.message }, null, 2));
    } finally {
      setTestingEndpoint(null);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <BookOpen size={28} className="text-primary" />
          API & Schema Documentation
        </h2>
        <p className="lead" style={{ fontSize: 16, margin: "6px 0 0 0" }}>
          Interactive reference for MoNoApps Core REST endpoints and dynamic
          resource generators.
        </p>
      </div>

      {/* System Utility Endpoints */}
      <div
        className="panel panel-default"
        style={{ borderRadius: 6, marginBottom: 24 }}
      >
        <div className="panel-heading">
          <h3 className="panel-title" style={{ fontWeight: 600 }}>
            Core System Endpoints
          </h3>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 100 }}>Method</th>
                <th style={{ width: 220 }}>Route</th>
                <th>Description</th>
                <th style={{ width: 120 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="label label-success">GET</span>
                </td>
                <td>
                  <code>/ping</code>
                </td>
                <td>Health check and server uptime status</td>
                <td>
                  <button
                    className="btn btn-default btn-xs"
                    onClick={runPingTest}
                    disabled={testingEndpoint === "ping"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Play size={12} /> Test
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="label label-success">GET</span>
                </td>
                <td>
                  <code>/theme</code>
                </td>
                <td>Fetch configured CSS theme stylesheet URL</td>
                <td>
                  <button
                    className="btn btn-default btn-xs"
                    onClick={runThemeTest}
                    disabled={testingEndpoint === "theme"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Play size={12} /> Test
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="label label-primary">POST</span>
                </td>
                <td>
                  <code>/login</code>
                </td>
                <td>
                  Authenticate with access key/password payload{" "}
                  <code>{"{ password: '...' }"}</code>
                </td>
                <td>—</td>
              </tr>
              <tr>
                <td>
                  <span className="label label-primary">POST</span>
                </td>
                <td>
                  <code>/register/:email</code>
                </td>
                <td>Initiate self-service account registration</td>
                <td>—</td>
              </tr>
              <tr>
                <td>
                  <span className="label label-primary">POST</span>
                </td>
                <td>
                  <code>/recover/:email</code>
                </td>
                <td>Send password recovery email instructions</td>
                <td>—</td>
              </tr>
              <tr>
                <td>
                  <span className="label label-success">GET</span>
                </td>
                <td>
                  <code>/account</code>
                </td>
                <td>
                  Retrieve authenticated profile (Requires <code>token</code>{" "}
                  header)
                </td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Test Output Console */}
      {testResult && (
        <div
          className="panel panel-default"
          style={{
            borderRadius: 6,
            marginBottom: 24,
            borderLeft: "4px solid #007bff",
          }}
        >
          <div
            className="panel-heading"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h4
              className="panel-title"
              style={{
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Terminal size={16} /> Live Response Output
            </h4>
            <button
              className="btn btn-link btn-xs"
              onClick={() => setTestResult(null)}
            >
              Clear
            </button>
          </div>
          <div
            className="panel-body"
            style={{ background: "#272822", color: "#a6e22e", padding: 16 }}
          >
            <pre
              style={{
                margin: 0,
                background: "transparent",
                color: "inherit",
                border: "none",
                padding: 0,
              }}
            >
              {testResult}
            </pre>
          </div>
        </div>
      )}

      {/* Auto-Generated Dynamic Resource Endpoints */}
      <div className="panel panel-default" style={{ borderRadius: 6 }}>
        <div className="panel-heading">
          <h3 className="panel-title" style={{ fontWeight: 600 }}>
            Dynamic Resource CRUD Endpoints
          </h3>
        </div>
        <div className="panel-body">
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
            Each configured resource automatically exposes 5 standard REST
            endpoints governed by schema whitelists and field sanitizers:
          </p>

          <div className="row">
            {resources.map(([key, res]: [string, any]) => (
              <div key={key} className="col-md-6" style={{ marginBottom: 20 }}>
                <div
                  className="panel panel-default"
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    background: "#fafafa",
                  }}
                >
                  <div
                    className="panel-heading"
                    style={{ fontWeight: 600, textTransform: "capitalize" }}
                  >
                    /{key}
                    {res.admin && (
                      <span className="label label-danger pull-right">
                        Admin Only
                      </span>
                    )}
                  </div>
                  <div className="panel-body" style={{ padding: 12 }}>
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        fontSize: 12,
                        lineHeight: "24px",
                      }}
                    >
                      <li>
                        <span
                          className="label label-success"
                          style={{ width: 50, display: "inline-block" }}
                        >
                          GET
                        </span>{" "}
                        <code>/{key}</code> - Query & list records
                      </li>
                      <li>
                        <span
                          className="label label-primary"
                          style={{ width: 50, display: "inline-block" }}
                        >
                          POST
                        </span>{" "}
                        <code>/{key}</code> - Create new record
                      </li>
                      <li>
                        <span
                          className="label label-success"
                          style={{ width: 50, display: "inline-block" }}
                        >
                          GET
                        </span>{" "}
                        <code>/{key}/:id</code> - Retrieve single record
                      </li>
                      <li>
                        <span
                          className="label label-warning"
                          style={{ width: 50, display: "inline-block" }}
                        >
                          PUT
                        </span>{" "}
                        <code>/{key}/:id</code> - Update record by ID
                      </li>
                      <li>
                        <span
                          className="label label-danger"
                          style={{ width: 50, display: "inline-block" }}
                        >
                          DELETE
                        </span>{" "}
                        <code>/{key}/:id</code> - Remove record
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
