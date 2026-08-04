import { v4 as uuidv4 } from "uuid";
import { createWorkflow, getWorkflowById, updateWorkflow, listWorkflowsByOrganization, deleteWorkflow } from "@/services/dynamodb/workflows";
import { createWorkflowTemplate, getWorkflowTemplateById, listWorkflowTemplatesByOrganization, deleteWorkflowTemplate } from "@/services/dynamodb/workflowTemplates";
import { createWorker, getWorkersByWorkflow, updateWorkerStatus } from "@/services/dynamodb/workers";
import type { WorkflowRecord, WorkflowStep } from "@/services/dynamodb/workflows";
import type { WorkflowTemplateRecord } from "@/services/dynamodb/workflowTemplates";
import type { WorkerRecord } from "@/services/dynamodb/workers";

export interface CreateWorkflowDTO {
  organization_id: string;
  name: string;
  description?: string;
  definition: Record<string, unknown>;
  steps: WorkflowStep[];
}

export interface UpdateWorkflowDTO {
  name?: string;
  description?: string;
  status?: string;
  definition?: Record<string, unknown>;
  steps?: WorkflowStep[];
}

export interface CreateTemplateDTO {
  organization_id: string;
  name: string;
  description?: string;
  category?: string;
  definition: Record<string, unknown>;
}

export class WorkflowService {
  async createWorkflow(data: CreateWorkflowDTO): Promise<WorkflowRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const workflow: WorkflowRecord = {
      id,
      organization_id: data.organization_id,
      name: data.name,
      description: data.description || null,
      status: "draft",
      definition: data.definition,
      steps: data.steps,
      created_at: now,
      updated_at: now,
    };

    await createWorkflow(workflow);
    return workflow;
  }

  async getWorkflow(id: string): Promise<WorkflowRecord | null> {
    return getWorkflowById(id);
  }

  async listWorkflows(organizationId: string): Promise<WorkflowRecord[]> {
    return listWorkflowsByOrganization(organizationId);
  }

  async updateWorkflow(id: string, data: UpdateWorkflowDTO): Promise<WorkflowRecord | null> {
    const existing = await getWorkflowById(id);
    if (!existing) return null;

    await updateWorkflow(id, data);
    return getWorkflowById(id);
  }

  async deleteWorkflow(id: string): Promise<void> {
    await deleteWorkflow(id);
  }

  async deleteWorkflowTemplate(id: string): Promise<void> {
    await deleteWorkflowTemplate(id);
  }

  async saveAsTemplate(data: CreateTemplateDTO): Promise<WorkflowTemplateRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const template: WorkflowTemplateRecord = {
      id,
      organization_id: data.organization_id,
      name: data.name,
      description: data.description || null,
      category: data.category || null,
      definition: data.definition,
      created_at: now,
      updated_at: now,
    };

    await createWorkflowTemplate(template);
    return template;
  }

  async getTemplate(id: string): Promise<WorkflowTemplateRecord | null> {
    return getWorkflowTemplateById(id);
  }

  async listTemplates(organizationId: string): Promise<WorkflowTemplateRecord[]> {
    return listWorkflowTemplatesByOrganization(organizationId);
  }

  async createWorker(worker: WorkerRecord): Promise<void> {
    await createWorker(worker);
  }

  async getWorkersForWorkflow(workflowId: string): Promise<WorkerRecord[]> {
    return getWorkersByWorkflow(workflowId);
  }

  async updateWorkerStatus(id: string, status: string, result: Record<string, unknown> | null, error: string | null): Promise<void> {
    await updateWorkerStatus(id, status, result, error);
  }
}

export const workflowService = new WorkflowService();