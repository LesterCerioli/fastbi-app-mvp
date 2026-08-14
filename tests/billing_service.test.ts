import { jest } from "@jest/globals";

const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: class {},
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: () => ({ send: mockSend }),
  },
  QueryCommand: class {
    input: Record<string, unknown>;
    constructor(input: Record<string, unknown>) {
      this.input = input;
    }
  },
  ScanCommand: class {
    input: Record<string, unknown>;
    constructor(input: Record<string, unknown>) {
      this.input = input;
    }
  },
}));

import { getBillingOverview } from "../src/services/dynamodb/billingService";
import { getAdminSubscriptionsOverview } from "../src/services/dynamodb/adminBillingService";

let organizationItems: Record<string, unknown>[];
let customerItems: Record<string, unknown>[];
let orderItems: Record<string, unknown>[];
let captureItems: Record<string, unknown>[];

beforeEach(() => {
  organizationItems = [];
  customerItems = [];
  orderItems = [];
  captureItems = [];
  jest.clearAllMocks();

  mockSend.mockImplementation(async (command: { input: { TableName?: string } }) => {
    const input = command.input || {};
    switch (input.TableName) {
      case "FASTBI_ORGANIZATIONS":
        return { Items: organizationItems };
      case "FastBI_PayPal_customers":
        return { Items: customerItems };
      case "FastBI_PayPal_orders":
        return { Items: orderItems };
      case "FastBI_PayPal_captures":
        return { Items: captureItems };
      default:
        return { Items: [] };
    }
  });
});

function makeOrder(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "sub-1",
    paypal_order_id: "PAYPAL-ORDER-1",
    organization_id: "org-1",
    payment_method_id: "pm-1",
    plan_key: "professional",
    billing_cycle: "monthly",
    amount: 89,
    currency: "brl",
    status: "COMPLETED",
    created_at: "2026-08-14T16:06:17.645Z",
    ...overrides,
  };
}

function makeCapture(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "cap-1",
    capture_id: "CAPTURE-1",
    payment_method_id: "pm-1",
    amount: 89,
    currency: "brl",
    status: "COMPLETED",
    created_at: "2026-08-14T16:06:17.645Z",
    ...overrides,
  };
}

describe("getBillingOverview — consistência de moeda e valores das faturas", () => {
  beforeEach(() => {
    organizationItems = [{ id: "org-1", name: "Playboy LTDA" }];
    customerItems = [{ organization_id: "org-1", email: "cliente@teste.com" }];
  });

  it("cobra em R$ (brl) o mesmo valor pago no cadastro quando o pedido é brl", async () => {
    orderItems = [makeOrder({ amount: 89, currency: "brl" })];
    captureItems = [makeCapture({ amount: 89, currency: "brl" })];

    const overview = await getBillingOverview("Playboy LTDA", "cliente@teste.com");

    expect(overview.next_charge).not.toBeNull();
    expect(overview.next_charge!.currency).toBe("brl");
    expect(overview.next_charge!.amount_cents).toBe(8900);

    expect(overview.payments).toHaveLength(1);
    expect(overview.payments[0].currency).toBe("brl");
    expect(overview.payments[0].amount).toBe(89);
  });

  it("cobra em US$ (usd) o mesmo valor pago no cadastro quando o pedido é usd", async () => {
    orderItems = [makeOrder({ amount: 89, currency: "usd" })];
    captureItems = [makeCapture({ amount: 89, currency: "usd" })];

    const overview = await getBillingOverview("Playboy LTDA", "cliente@teste.com");

    expect(overview.next_charge!.currency).toBe("usd");
    expect(overview.next_charge!.amount_cents).toBe(8900);
    expect(overview.payments[0].currency).toBe("usd");
  });

  it("mantém a moeda do pedido mesmo se o valor for fracionado", async () => {
    orderItems = [makeOrder({ amount: 49.9, currency: "brl" })];
    captureItems = [makeCapture({ amount: 49.9, currency: "brl" })];

    const overview = await getBillingOverview("Playboy LTDA", "cliente@teste.com");

    expect(overview.next_charge!.amount_cents).toBe(4990);
    expect(overview.next_charge!.currency).toBe("brl");
  });

  it("usa o pedido mais recente quando há múltiplos pedidos para a mesma organização", async () => {
    orderItems = [
      makeOrder({ id: "sub-old", paypal_order_id: "P-OLD", created_at: "2026-07-01T10:00:00.000Z", amount: 100, currency: "usd" }),
      makeOrder({ id: "sub-new", paypal_order_id: "P-NEW", created_at: "2026-08-01T10:00:00.000Z", amount: 89, currency: "brl" }),
    ];

    const overview = await getBillingOverview("Playboy LTDA", "cliente@teste.com");

    expect(overview.next_charge!.stripe_subscription_id).toBe("P-NEW");
    expect(overview.next_charge!.amount_cents).toBe(8900);
    expect(overview.next_charge!.currency).toBe("brl");
  });

  it("multiplica o valor pelo user_quantity na fatura futura", async () => {
    orderItems = [makeOrder({ amount: 89, currency: "brl", user_quantity: 3 })];

    const overview = await getBillingOverview("Playboy LTDA", "cliente@teste.com");

    expect(overview.next_charge!.amount_cents).toBe(26700);
    expect(overview.next_charge!.currency).toBe("brl");
  });

  it("lista os pagamentos (faturas pagas) com moeda e valor pagos, do mais recente ao mais antigo", async () => {
    orderItems = [makeOrder({})];
    captureItems = [
      makeCapture({ id: "cap-old", capture_id: "C-OLD", created_at: "2026-08-01T10:00:00.000Z", amount: 100, currency: "usd" }),
      makeCapture({ id: "cap-new", capture_id: "C-NEW", created_at: "2026-08-14T16:06:17.645Z", amount: 89, currency: "brl" }),
    ];

    const overview = await getBillingOverview("Playboy LTDA", "cliente@teste.com");

    expect(overview.payments.map((p) => p.payment_intent_id)).toEqual(["C-NEW", "C-OLD"]);
    expect(overview.payments[0].amount).toBe(89);
    expect(overview.payments[0].currency).toBe("brl");
  });

  it("não retorna next_charge quando a organização não tem pedidos", async () => {
    orderItems = [];

    const overview = await getBillingOverview("Playboy LTDA", "cliente@teste.com");

    expect(overview.next_charge).toBeNull();
  });
});

describe("deriveNextChargeAt — data da próxima cobrança", () => {
  beforeEach(() => {
    organizationItems = [{ id: "org-1", name: "Playboy LTDA" }];
    customerItems = [{ organization_id: "org-1", email: "cliente@teste.com" }];
  });

  it("usa next_charge_at explícito quando existir", async () => {
    orderItems = [
      makeOrder({ next_charge_at: "2026-09-01T10:00:00.000Z" }),
    ];

    const overview = await getBillingOverview("Playboy LTDA", "cliente@teste.com");

    expect(overview.next_charge!.next_charge_at).toBe("2026-09-01T10:00:00.000Z");
  });

  it("deriva mensal como created_at + 30 dias quando não há next_charge_at", async () => {
    orderItems = [makeOrder({ billing_cycle: "monthly", created_at: "2026-08-14T16:06:17.645Z" })];

    const overview = await getBillingOverview("Playboy LTDA", "cliente@teste.com");

    expect(overview.next_charge!.next_charge_at).toBe("2026-09-13T16:06:17.645Z");
  });

  it("deriva anual como created_at + 365 dias quando não há next_charge_at", async () => {
    orderItems = [makeOrder({ billing_cycle: "annual", created_at: "2026-08-14T16:06:17.645Z" })];

    const overview = await getBillingOverview("Playboy LTDA", "cliente@teste.com");

    expect(overview.next_charge!.next_charge_at).toBe("2027-08-14T16:06:17.645Z");
  });
});

describe("getAdminSubscriptionsOverview — consistência na visão do admin", () => {
  beforeEach(() => {
    organizationItems = [{ id: "org-1", name: "Playboy LTDA" }];
  });

  it("exibe moeda e valor em centavos consistentes com o cadastro (brl)", async () => {
    orderItems = [makeOrder({ amount: 89, currency: "brl" })];
    captureItems = [makeCapture({ amount: 89, currency: "brl" })];

    const overview = await getAdminSubscriptionsOverview();

    expect(overview.subscriptions).toHaveLength(1);
    expect(overview.subscriptions[0].currency).toBe("brl");
    expect(overview.subscriptions[0].amount_cents).toBe(8900);
    expect(overview.subscriptions[0].last_payment!.currency).toBe("brl");
    expect(overview.subscriptions[0].last_payment!.amount).toBe(8900);
  });

  it("exibe moeda e valor consistentes com o cadastro (usd)", async () => {
    orderItems = [makeOrder({ amount: 89, currency: "usd" })];
    captureItems = [makeCapture({ amount: 89, currency: "usd" })];

    const overview = await getAdminSubscriptionsOverview();

    expect(overview.subscriptions[0].currency).toBe("usd");
    expect(overview.subscriptions[0].amount_cents).toBe(8900);
    expect(overview.subscriptions[0].last_payment!.currency).toBe("usd");
  });

  it("usa o último pagamento (mais recente) do método de pagamento", async () => {
    orderItems = [makeOrder({})];
    captureItems = [
      makeCapture({ id: "cap-old", created_at: "2026-08-01T10:00:00.000Z", amount: 100, currency: "usd" }),
      makeCapture({ id: "cap-new", created_at: "2026-08-14T16:06:17.645Z", amount: 89, currency: "brl" }),
    ];

    const overview = await getAdminSubscriptionsOverview();

    expect(overview.subscriptions[0].last_payment!.amount).toBe(8900);
    expect(overview.subscriptions[0].last_payment!.currency).toBe("brl");
  });

  it("mantém moeda e valor consistentes por pedido na visão do admin (múltiplos pedidos)", async () => {
    orderItems = [
      makeOrder({ id: "sub-old", created_at: "2026-07-01T10:00:00.000Z", billing_cycle: "monthly", amount: 100, currency: "usd" }),
      makeOrder({ id: "sub-new", created_at: "2026-08-14T16:06:17.645Z", billing_cycle: "monthly", amount: 89, currency: "brl" }),
    ];

    const overview = await getAdminSubscriptionsOverview();

    const old = overview.subscriptions.find((s) => s.id === "sub-old");
    const newest = overview.subscriptions.find((s) => s.id === "sub-new");
    expect(old).toBeDefined();
    expect(old!.amount_cents).toBe(10000);
    expect(old!.currency).toBe("usd");
    expect(old!.next_charge_at).toBe("2026-07-31T10:00:00.000Z");
    expect(newest).toBeDefined();
    expect(newest!.amount_cents).toBe(8900);
    expect(newest!.currency).toBe("brl");
    expect(newest!.next_charge_at).toBe("2026-09-13T16:06:17.645Z");
  });

  it("ignora pedidos deletados (deleted_at) na listagem", async () => {
    orderItems = [
      makeOrder({ id: "sub-deleted", deleted_at: "2026-08-10T10:00:00.000Z" }),
      makeOrder({ id: "sub-active" }),
    ];

    const overview = await getAdminSubscriptionsOverview();

    expect(overview.subscriptions.map((s) => s.id)).toEqual(["sub-active"]);
  });
});
