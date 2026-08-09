"use client";
import { useState, useEffect, useCallback } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import WorkflowDesigner from "@/components/workflows/templates/workflowDesigner/workflowDesigner";
import { WorkflowDefinition } from "@/components/workflows/templates/workflowTypes";

function getFreshToken(): Promise<string | null> {
  return fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  })
    .then((res) => {
      if (!res.ok) return null;
      return res.json().then((d) => d.token);
    })
    .catch(() => null);
}

export default function WorkflowsPage() {
  const { t } = useTranslations();
  const [definition, setDefinition] = useState<WorkflowDefinition>({
    nodes: [],
    edges: [],
    metadata: { name: "", description: "" },
  });
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "workflows" | "templates">("editor");

  useEffect(() => {
    loadWorkflows();
    loadTemplates();
  }, []);

  async function loadWorkflows() {
    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/workflows", { headers });
      if (res.ok) {
        const data = await res.json();
        setSavedWorkflows(data.data || []);
      }
    } catch { /* silently fail */ }
  }

  async function loadTemplates() {
    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/workflows/templates", { headers });
      if (res.ok) {
        const data = await res.json();
        setSavedTemplates(data.data || []);
      }
    } catch { /* silently fail */ }
  }

  const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSaveWorkflow = useCallback(async () => {
    if (!workflowName.trim()) {
      showToast("Workflow name is required", "error");
      return;
    }
    setLoading(true);
    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const payload = {
        name: workflowName,
        description: workflowDescription || null,
        definition: definition,
        steps: definition.nodes.map((n) => ({
          step_id: n.id,
          step_name: n.label,
          step_type: n.type,
          position: n.position,
          config: n.config || {},
          status: "pending",
          order: definition.nodes.indexOf(n),
        })),
      };

      const res = await fetch("/api/workflows", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("Workflow saved successfully", "success");
        loadWorkflows();
        setActiveTab("workflows");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save workflow", "error");
      }
    } catch {
      showToast("Failed to save workflow", "error");
    } finally {
      setLoading(false);
    }
  }, [workflowName, workflowDescription, definition, showToast]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!workflowName.trim()) {
      showToast("Workflow name is required", "error");
      return;
    }
    setLoading(true);
    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const payload = {
        name: workflowName,
        description: workflowDescription || null,
        category: "custom",
        definition: definition,
      };

      const res = await fetch("/api/workflows/templates", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("Template saved successfully", "success");
        loadTemplates();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save template", "error");
      }
    } catch {
      showToast("Failed to save template", "error");
    } finally {
      setLoading(false);
    }
  }, [workflowName, workflowDescription, definition, showToast]);

  const handleLoadWorkflow = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/workflows?id=${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const wf = data.data;
        setDefinition(wf.definition || { nodes: [], edges: [] });
        setWorkflowName(wf.name || "");
        setWorkflowDescription(wf.description || "");
        setActiveTab("editor");
        showToast("Workflow loaded", "info");
      }
    } catch {
      showToast("Failed to load workflow", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleLoadTemplate = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/workflows/templates?id=${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const tpl = data.data;
        setDefinition(tpl.definition || { nodes: [], edges: [] });
        setWorkflowName(tpl.name || "");
        setWorkflowDescription(tpl.description || "");
        setActiveTab("editor");
        showToast("Template loaded", "info");
      }
    } catch {
      showToast("Failed to load template", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleDeleteWorkflow = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/workflows?id=${id}`, { method: "DELETE", headers });
      if (res.ok) {
        showToast("Workflow deleted", "success");
        loadWorkflows();
        if (workflowName && definition.nodes.length === 0) {
          setDefinition({ nodes: [], edges: [], metadata: { name: "", description: "" } });
          setWorkflowName("");
        }
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete", "error");
      }
    } catch {
      showToast("Failed to delete workflow", "error");
    } finally {
      setLoading(false);
    }
  }, [workflowName, definition, showToast, loadWorkflows]);

  const handleDeleteTemplate = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/workflows/templates?id=${id}`, { method: "DELETE", headers });
      if (res.ok) {
        showToast("Template deleted", "success");
        loadTemplates();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete", "error");
      }
    } catch {
      showToast("Failed to delete template", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, loadTemplates]);

  const handleNewWorkflow = useCallback(() => {
    setDefinition({ nodes: [], edges: [], metadata: { name: "", description: "" } });
    setWorkflowName("");
    setWorkflowDescription("");
    setActiveTab("editor");
  }, []);

  return (
    <S.Container>
      <S.Content>
        <S.PageHeader>
          <S.PageTitle>Workflows</S.PageTitle>
        </S.PageHeader>

        <S.Toolbar style={{ marginBottom: 24 }}>
          <S.Select value={activeTab} onChange={(e) => setActiveTab(e.target.value as any)}>
            <option value="editor">Editor</option>
            <option value="workflows">My Workflows</option>
            <option value="templates">Templates</option>
          </S.Select>
          {activeTab === "editor" && (
            <>
              <S.Input
                placeholder="Workflow name..."
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                style={{ width: 200 }}
              />
              <S.SuccessButton onClick={handleSaveWorkflow} disabled={loading}>
                {loading ? "Saving..." : "Save Workflow"}
              </S.SuccessButton>
              <S.Button onClick={handleSaveAsTemplate} disabled={loading}>
                {loading ? "Saving..." : "Save as Template"}
              </S.Button>
              <S.Button onClick={handleNewWorkflow}>New</S.Button>
            </>
          )}
        </S.Toolbar>

        {activeTab === "editor" && (
          <WorkflowDesigner
            definition={definition}
            onChange={setDefinition}
          />
        )}

        {activeTab === "workflows" && (
          <div>
            {savedWorkflows.length === 0 && (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>No workflows yet. Create one in the editor.</p>
            )}
            {savedWorkflows.map((wf) => (
              <div
                key={wf.id}
                style={{
                  background: "rgba(17, 34, 61, 0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{wf.name}</h3>
                  <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>
                    {wf.description || "No description"} · Status: {wf.status}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <S.Button onClick={() => handleLoadWorkflow(wf.id)}>Edit</S.Button>
                  <S.DangerButton onClick={() => handleDeleteWorkflow(wf.id)}>Delete</S.DangerButton>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "templates" && (
          <div>
            {savedTemplates.length === 0 && (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>No templates yet. Save a workflow as a template.</p>
            )}
            {savedTemplates.map((tpl) => (
              <div
                key={tpl.id}
                style={{
                  background: "rgba(17, 34, 61, 0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{tpl.name}</h3>
                  <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>
                    {tpl.description || "No description"} · Category: {tpl.category || "general"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <S.Button onClick={() => handleLoadTemplate(tpl.id)}>Load</S.Button>
                  <S.DangerButton onClick={() => handleDeleteTemplate(tpl.id)}>Delete</S.DangerButton>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <S.LoadingOverlay>Loading...</S.LoadingOverlay>
        )}

        {toast && (
          <S.Toast
            $type={toast.type}
            onClick={() => setToast(null)}
            style={{ cursor: "pointer" }}
          >
            {toast.message}
          </S.Toast>
        )}
      </S.Content>
    </S.Container>
  );
}