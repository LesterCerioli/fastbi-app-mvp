import { query } from "../db";
import { IntelligentAgentEngine, type AgentRequest, type Insight, type AgentResponse } from "../ai/intelligent_agent_engine";
import type { Goal } from "../ai/planner";
import type { DetectedAnomaly } from "../ai/reasoner";

export interface AgentTask {
  organizationId: string;
  taskType: string;
  priority: number;
  parameters: Record<string, unknown>;
}

export interface TaskItem {
  taskId: string;
  request: AgentRequest;
}

export interface TaskResult {
  result?: AgentResponse;
  error?: string;
  status: string;
}

export interface AgentResult {
  taskId: string;
  organizationId: string;
  insights: Insight[];
  anomalies: DetectedAnomaly[];
  recommendations: string[];
  confidence: number;
  executedAt: Date;
}

export interface TaskStatus {
  id: string;
  status: string;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  error?: string;
}

export class AgentCoordinatorImpl {
  private taskQueue: TaskItem[] = [];
  private results = new Map<string, TaskResult>();
  private workerCount: number;
  private processing = false;

  constructor(
    private agentEngine: IntelligentAgentEngine,
    workerCount = 5,
  ) {
    this.workerCount = workerCount;
  }

  private async startWorkers(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    const worker = async () => {
      while (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        if (!task) break;

        try {
          const result = await this.agentEngine.execute(task.request);
          this.results.set(task.taskId, {
            result,
            status: "completed",
          });
          await this.updateTaskResult(task.taskId, result);
        } catch (err: any) {
          this.results.set(task.taskId, {
            error: err.message,
            status: "failed",
          });
          await this.updateTaskStatus(task.taskId, "failed", err.message);
        }
      }
    };

    const workers = [];
    for (let i = 0; i < this.workerCount; i++) {
      workers.push(worker());
    }
    await Promise.all(workers);
    this.processing = false;
  }

  async submitTask(task: AgentTask): Promise<string> {
    const { v4: uuid } = await import("uuid");
    const taskId = uuid();

    const paramsJson = JSON.stringify(task.parameters);

    await query(
      `INSERT INTO agent_tasks (id, organization_id, task_type, status, priority, input_params)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [taskId, task.organizationId, task.taskType, "pending", task.priority, paramsJson],
    );

    if (this.taskQueue.length >= 100) {
      throw new Error("task queue is full");
    }

    this.taskQueue.push({
      taskId,
      request: {
        organizationId: task.organizationId,
        goal: this.mapTaskTypeToGoal(task.taskType) as Goal,
        parameters: task.parameters,
        includeHistory: true,
      },
    });

    this.startWorkers();

    return taskId;
  }

  async getTaskResult(taskId: string): Promise<AgentResult> {
    const result = this.results.get(taskId);

    if (!result) {
      return this.getTaskResultFromDB(taskId);
    }

    if (result.error) {
      throw new Error(result.error);
    }

    if (!result.result) {
      throw new Error("task result not available yet");
    }

    const orgId = await this.getOrganizationIdForTask(taskId);

    return {
      taskId,
      organizationId: orgId,
      insights: result.result.insights,
      anomalies: result.result.anomalies,
      recommendations: result.result.recommendations,
      confidence: result.result.confidence,
      executedAt: result.result.executedAt,
    };
  }

  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const r = await query(
      `SELECT status, created_at, started_at, completed_at, error_message
       FROM public.agent_tasks
       WHERE id = $1`,
      [taskId],
    );

    if (r.rows.length === 0) {
      throw new Error(`task not found: ${taskId}`);
    }

    const row = r.rows[0];
    const status: TaskStatus = {
      id: taskId,
      status: row.status,
      createdAt: row.created_at,
      startedAt: row.started_at ?? null,
      completedAt: row.completed_at ?? null,
    };

    if (row.error_message) {
      status.error = row.error_message;
    }

    return status;
  }

  async executeAnalysis(
    orgId: string,
    goal: Goal,
    params: Record<string, unknown>,
  ): Promise<AgentResult> {
    const request: AgentRequest = {
      organizationId: orgId,
      goal,
      parameters: params,
      includeHistory: true,
    };

    const response = await this.agentEngine.execute(request);

    const { v4: uuid } = await import("uuid");
    return {
      taskId: uuid(),
      organizationId: orgId,
      insights: response.insights,
      anomalies: response.anomalies,
      recommendations: response.recommendations,
      confidence: response.confidence,
      executedAt: response.executedAt,
    };
  }

  async scheduleRecurringAnalysis(
    orgId: string,
    schedule: string,
    goal: Goal,
  ): Promise<void> {
    const params = { schedule, goal };
    const paramsJson = JSON.stringify(params);

    await query(
      `INSERT INTO agent_tasks (organization_id, task_type, status, priority, input_params)
       VALUES ($1, $2, $3, $4, $5)`,
      [orgId, `scheduled_${goal}`, "pending", 3, paramsJson],
    );
  }

  async listPendingInsights(orgId: string): Promise<Insight[]> {
    const r = await query(
      `SELECT insight_type, severity, title, description, confidence, metadata, created_at
       FROM public.agent_insights
       WHERE organization_id = $1 AND is_dismissed = FALSE
       ORDER BY created_at DESC
       LIMIT 50`,
      [orgId],
    );

    return r.rows.map((row: any) => ({
      type: row.insight_type,
      severity: row.severity,
      title: row.title,
      description: row.description,
      confidence: Number(row.confidence),
      metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : (row.metadata ?? {}),
    }));
  }

  async listPendingAnomalies(orgId: string): Promise<DetectedAnomaly[]> {
    const r = await query(
      `SELECT metric_name, dimension_name, dimension_value, expected_value, actual_value, deviation_zscore, detected_at
       FROM public.agent_anomalies
       WHERE organization_id = $1 AND resolved_at IS NULL
       ORDER BY deviation_zscore DESC, detected_at DESC
       LIMIT 50`,
      [orgId],
    );

    return r.rows.map((row: any) => ({
      metric: row.metric_name,
      dimension: row.dimension_name ?? "",
      dimensionValue: row.dimension_value ?? "",
      expectedValue: Number(row.expected_value),
      actualValue: Number(row.actual_value),
      zScore: Number(row.deviation_zscore),
      detectedAt: row.detected_at,
    }));
  }

  private mapTaskTypeToGoal(taskType: string): string {
    switch (taskType) {
      case "diagnose":
        return "diagnose_decline";
      case "forecast":
        return "forecast";
      case "monitor":
        return "monitor_anomalies";
      case "opportunities":
        return "find_opportunities";
      case "compare":
        return "compare_periods";
      default:
        return "generate_insights";
    }
  }

  private async updateTaskStatus(
    taskId: string,
    status: string,
    errorMsg: string,
  ): Promise<void> {
    await query(
      `UPDATE public.agent_tasks
       SET status = $2,
           completed_at = CASE WHEN $2 IN ('completed', 'failed') THEN NOW() ELSE completed_at END,
           error_message = $3
       WHERE id = $1`,
      [taskId, status, errorMsg],
    );
  }

  private async updateTaskResult(
    taskId: string,
    result: AgentResponse,
  ): Promise<void> {
    const outputJson = JSON.stringify({
      insights: result.insights,
      recommendations: result.recommendations,
      anomalies: result.anomalies,
      rootCauses: (result as any).rootCauses,
      confidence: result.confidence,
    });

    await query(
      `UPDATE public.agent_tasks
       SET status = 'completed', output_result = $2, completed_at = NOW()
       WHERE id = $1`,
      [taskId, outputJson],
    );
  }

  private async getTaskResultFromDB(taskId: string): Promise<AgentResult> {
    const r = await query(
      `SELECT status, output_result, error_message, organization_id
       FROM public.agent_tasks
       WHERE id = $1`,
      [taskId],
    );

    if (r.rows.length === 0) {
      throw new Error(`task not found: ${taskId}`);
    }

    const row = r.rows[0];

    if (row.status !== "completed") {
      throw new Error(`task not completed, status: ${row.status}`);
    }

    if (row.error_message) {
      throw new Error(`task failed: ${row.error_message}`);
    }

    if (!row.output_result) {
      throw new Error("task result not available");
    }

    const resultData = typeof row.output_result === "string"
      ? JSON.parse(row.output_result)
      : row.output_result;

    return {
      taskId,
      organizationId: row.organization_id,
      insights: resultData.insights ?? [],
      anomalies: resultData.anomalies ?? [],
      recommendations: resultData.recommendations ?? [],
      confidence: resultData.confidence ?? 0,
      executedAt: new Date(),
    };
  }

  private async getOrganizationIdForTask(taskId: string): Promise<string> {
    const r = await query(
      `SELECT organization_id FROM public.agent_tasks WHERE id = $1`,
      [taskId],
    );
    return r.rows[0]?.organization_id ?? "";
  }
}
