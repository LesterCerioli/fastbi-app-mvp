import { jest } from "@jest/globals";

jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid") }));

jest.mock("@/services/dynamodb/workflows", () => ({
  createWorkflow: jest.fn(),
  getWorkflowById: jest.fn(),
  updateWorkflow: jest.fn(),
  listWorkflowsByOrganization: jest.fn(),
  deleteWorkflow: jest.fn(),
}));

jest.mock("@/services/dynamodb/workflowTemplates", () => ({
  createWorkflowTemplate: jest.fn(),
  getWorkflowTemplateById: jest.fn(),
  listWorkflowTemplatesByOrganization: jest.fn(),
  updateWorkflowTemplate: jest.fn(),
  deleteWorkflowTemplate: jest.fn(),
}));

jest.mock("@/services/dynamodb/workers", () => ({
  createWorker: jest.fn(),
  getWorkersByWorkflow: jest.fn(),
  updateWorkerStatus: jest.fn(),
}));

import { WorkflowService } from "@/services/workflows/workflow_service";
import {
  createWorkflow,
  getWorkflowById,
  updateWorkflow,
  listWorkflowsByOrganization,
  deleteWorkflow,
} from "@/services/dynamodb/workflows";
import {
  createWorkflowTemplate,
  getWorkflowTemplateById,
  listWorkflowTemplatesByOrganization,
  deleteWorkflowTemplate,
} from "@/services/dynamodb/workflowTemplates";
import {
  createWorker,
  getWorkersByWorkflow,
  updateWorkerStatus,
} from "@/services/dynamodb/workers";

const mockCreateWorkflow = createWorkflow as jest.Mock;
const mockGetWorkflowById = getWorkflowById as jest.Mock;
const mockUpdateWorkflow = updateWorkflow as jest.Mock;
const mockListWorkflowsByOrganization = listWorkflowsByOrganization as jest.Mock;
const mockDeleteWorkflow = deleteWorkflow as jest.Mock;
const mockCreateWorkflowTemplate = createWorkflowTemplate as jest.Mock;
const mockGetWorkflowTemplateById = getWorkflowTemplateById as jest.Mock;
const mockListWorkflowTemplatesByOrganization = listWorkflowTemplatesByOrganization as jest.Mock;
const mockDeleteWorkflowTemplate = deleteWorkflowTemplate as jest.Mock;
const mockCreateWorker = createWorker as jest.Mock;
const mockGetWorkersByWorkflow = getWorkersByWorkflow as jest.Mock;
const mockUpdateWorkerStatus = updateWorkerStatus as jest.Mock;

describe("WorkflowService", () => {
  let service: WorkflowService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkflowService();
  });

  describe("createWorkflow", () => {
    it("creates a workflow successfully", async () => {
      mockCreateWorkflow.mockResolvedValue(undefined);

      const result = await service.createWorkflow({
        organization_id: "org-1",
        name: "Test Workflow",
        definition: { nodes: [], edges: [] },
        steps: [],
      });

      expect(result.name).toBe("Test Workflow");
      expect(result.organization_id).toBe("org-1");
      expect(mockCreateWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Workflow",
          organization_id: "org-1",
          status: "draft",
        })
      );
    });

    it("creates a workflow with empty name", async () => {
      const mockWorkflow = {
        id: "wf-1",
        organization_id: "org-1",
        name: "",
        description: null,
        status: "draft",
        definition: { nodes: [], edges: [] },
        steps: [],
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      };
      mockCreateWorkflow.mockResolvedValue(undefined);

      const result = await service.createWorkflow({
        organization_id: "org-1",
        name: "",
        definition: { nodes: [], edges: [] },
        steps: [],
      });

      expect(result.name).toBe("");
      expect(mockCreateWorkflow).toHaveBeenCalled();
    });
  });

  describe("getWorkflow", () => {
    it("returns a workflow when found", async () => {
      const mockWorkflow = {
        id: "wf-1",
        organization_id: "org-1",
        name: "Test Workflow",
        status: "active",
        definition: { nodes: [], edges: [] },
        steps: [],
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      };
      mockGetWorkflowById.mockResolvedValue(mockWorkflow);

      const result = await service.getWorkflow("wf-1");
      expect(result).toEqual(mockWorkflow);
    });

    it("returns null when workflow not found", async () => {
      mockGetWorkflowById.mockResolvedValue(null);
      const result = await service.getWorkflow("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("listWorkflows", () => {
    it("returns workflows for an organization", async () => {
      const mockWorkflows = [
        {
          id: "wf-1",
          organization_id: "org-1",
          name: "Workflow 1",
          status: "draft",
          definition: { nodes: [], edges: [] },
          steps: [],
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      ];
      mockListWorkflowsByOrganization.mockResolvedValue(mockWorkflows);

      const result = await service.listWorkflows("org-1");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Workflow 1");
    });
  });

  describe("updateWorkflow", () => {
    it("updates a workflow successfully", async () => {
      const existingWorkflow = {
        id: "wf-1",
        organization_id: "org-1",
        name: "Old Name",
        status: "draft",
        definition: { nodes: [], edges: [] },
        steps: [],
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      };
      const updatedWorkflow = {
        ...existingWorkflow,
        name: "New Name",
        updated_at: "2024-01-02T00:00:00.000Z",
      };

      mockGetWorkflowById.mockResolvedValueOnce(existingWorkflow);
      mockUpdateWorkflow.mockResolvedValue(undefined);
      mockGetWorkflowById.mockResolvedValueOnce(updatedWorkflow);

      const result = await service.updateWorkflow("wf-1", { name: "New Name" });
      expect(result?.name).toBe("New Name");
    });

    it("returns null when workflow not found", async () => {
      mockGetWorkflowById.mockResolvedValue(null);
      const result = await service.updateWorkflow("nonexistent", { name: "New" });
      expect(result).toBeNull();
    });
  });

  describe("deleteWorkflow", () => {
    it("deletes a workflow successfully", async () => {
      mockDeleteWorkflow.mockResolvedValue(undefined);
      await service.deleteWorkflow("wf-1");
      expect(mockDeleteWorkflow).toHaveBeenCalledWith("wf-1");
    });
  });

  describe("saveAsTemplate", () => {
    it("saves a workflow as template successfully", async () => {
      const mockTemplate = {
        id: "tpl-1",
        organization_id: "org-1",
        name: "My Template",
        description: null,
        category: null,
        definition: { nodes: [], edges: [] },
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      };
      mockCreateWorkflowTemplate.mockResolvedValue(undefined);

      const result = await service.saveAsTemplate({
        organization_id: "org-1",
        name: "My Template",
        definition: { nodes: [], edges: [] },
      });

      expect(result.name).toBe("My Template");
      expect(mockCreateWorkflowTemplate).toHaveBeenCalled();
    });
  });

  describe("getTemplate", () => {
    it("returns a template when found", async () => {
      const mockTemplate = {
        id: "tpl-1",
        organization_id: "org-1",
        name: "My Template",
        definition: { nodes: [], edges: [] },
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      };
      mockGetWorkflowTemplateById.mockResolvedValue(mockTemplate);

      const result = await service.getTemplate("tpl-1");
      expect(result).toEqual(mockTemplate);
    });

    it("returns null when template not found", async () => {
      mockGetWorkflowTemplateById.mockResolvedValue(null);
      const result = await service.getTemplate("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("listTemplates", () => {
    it("returns templates for an organization", async () => {
      const mockTemplates = [
        {
          id: "tpl-1",
          organization_id: "org-1",
          name: "Template 1",
          definition: { nodes: [], edges: [] },
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      ];
      mockListWorkflowTemplatesByOrganization.mockResolvedValue(mockTemplates);

      const result = await service.listTemplates("org-1");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Template 1");
    });
  });

  describe("deleteWorkflowTemplate", () => {
    it("deletes a template successfully", async () => {
      mockDeleteWorkflowTemplate.mockResolvedValue(undefined);
      await service.deleteWorkflowTemplate("tpl-1");
      expect(mockDeleteWorkflowTemplate).toHaveBeenCalledWith("tpl-1");
    });
  });

  describe("worker operations", () => {
    it("creates a worker successfully", async () => {
      mockCreateWorker.mockResolvedValue(undefined);
      const worker = {
        id: "w-1",
        organization_id: "org-1",
        worker_id: "worker-1",
        workflow_id: "wf-1",
        step_name: "step1",
        status: "pending",
        payload: {},
        result: null,
        error: null,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      };
      await service.createWorker(worker);
      expect(mockCreateWorker).toHaveBeenCalledWith(worker);
    });

    it("returns workers for a workflow", async () => {
      const mockWorkers = [
        {
          id: "w-1",
          organization_id: "org-1",
          worker_id: "worker-1",
          workflow_id: "wf-1",
          step_name: "step1",
          status: "completed",
          payload: {},
          result: { output: "done" },
          error: null,
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      ];
      mockGetWorkersByWorkflow.mockResolvedValue(mockWorkers);

      const result = await service.getWorkersForWorkflow("wf-1");
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("completed");
    });

    it("updates worker status", async () => {
      mockUpdateWorkerStatus.mockResolvedValue(undefined);
      await service.updateWorkerStatus("w-1", "completed", { output: "done" }, null);
      expect(mockUpdateWorkerStatus).toHaveBeenCalledWith("w-1", "completed", { output: "done" }, null);
    });
  });
});