import { jest } from "@jest/globals";
import { mockSend } from "./helpers/dynamodb-mock";

const mockFetch = jest.fn();
Object.defineProperty(global, "fetch", { value: mockFetch });

jest.mock("uuid", () => ({
  v4: jest.fn(() => "11111111-1111-4111-8111-111111111111"),
}));

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn(() => ({})),
}));

jest.mock("@aws-sdk/lib-dynamodb", () => {
  const { mockSend } = jest.requireActual("./helpers/dynamodb-mock");
  return {
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({ send: mockSend })),
    },
    PutCommand: jest.fn((input: unknown) => ({ input })),
    QueryCommand: jest.fn(),
  };
});

const MOCK_UUID = "11111111-1111-4111-8111-111111111111";

function buildCardResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: "pm_1Q0PsIJvEtkwdCNYMSaVuRz6",
    object: "payment_method",
    allow_redisplay: "unspecified",
    billing_details: {
      address: {
        city: null,
        country: "US",
        line1: null,
        line2: null,
        postal_code: null,
        state: null,
      },
      email: "maria@example.com",
      name: "Maria Silva",
      phone: null,
    },
    card: {
      brand: "visa",
      last4: "4242",
      exp_month: 12,
      exp_year: 2028,
      fingerprint: "mocked-fingerprint",
      country: "US",
    },
    created: 1726673582,
    customer: null,
    livemode: false,
    metadata: {},
    type: "card",
    ...overrides,
  };
}

function buildBankResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: "pm_2Q0PsIJvEtkwdCNYMSaVuRz7",
    object: "payment_method",
    allow_redisplay: "unspecified",
    billing_details: {
      address: {
        city: "New York",
        country: "US",
        line1: "123 Main St",
        line2: null,
        postal_code: "10001",
        state: "NY",
      },
      email: "john@example.com",
      name: "John Doe",
      phone: null,
    },
    us_bank_account: {
      account_holder_type: "individual",
      account_type: "checking",
      bank_name: "STRIPE TEST BANK",
      financial_connections_account: null,
      fingerprint: "bank-fingerprint",
      last4: "6789",
      networks: {
        preferred: "ach",
        supported: ["ach"],
      },
      routing_number: "110000000",
      status_details: {},
    },
    created: 1726673582,
    customer: null,
    livemode: false,
    metadata: {},
    type: "us_bank_account",
    ...overrides,
  };
}

let processSingleToken: any;

beforeAll(() => {
  process.env.STRIPE_SECRET_API_KEY = "sk_test_mockedkey";
  process.env.AWS_DEFAULT_REGION = "us-east-1";
  process.env.AWS_ACCESS_KEY_ID = "test-key";
  process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
});

beforeAll(async () => {
  const mod = await import(
    "../src/services/get_token_transform_pm_service"
  );
  processSingleToken = mod.processSingleToken;
});

beforeEach(() => {
  mockFetch.mockReset();
  mockSend.mockReset();
  mockSend.mockResolvedValue({});
});

afterAll(() => {
  delete process.env.STRIPE_SECRET_API_KEY;
  delete process.env.AWS_DEFAULT_REGION;
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;
});

function buildCustomerListResponse(hasCustomer: boolean) {
  if (hasCustomer) {
    return {
      data: [{ id: "cus_existing123", email: "maria@example.com" }],
      has_more: false,
      object: "list",
      url: "/v1/customers",
    };
  }
  return {
    data: [],
    has_more: false,
    object: "list",
    url: "/v1/customers",
  };
}

function buildCustomerCreateResponse() {
  return {
    id: "cus_new123",
    object: "customer",
    email: "maria@example.com",
    name: "Maria Silva",
    created: 1726673582,
    livemode: false,
  };
}

describe("get_token_transform_pm_service", () => {
  describe("processSingleToken - positive scenarios", () => {
    it("converts a card token and persists to DynamoDB", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerListResponse(false),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerCreateResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCardResponse({ customer: "cus_new123" }),
        });

      const result = await processSingleToken(
        "tok_visa_123",
        "Maria Silva",
        "maria@example.com"
      );

      expect(result).toEqual({
        id: MOCK_UUID,
        paymentMethodId: "pm_1Q0PsIJvEtkwdCNYMSaVuRz6",
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      const putCall = mockSend.mock.calls[0][0];
      expect(putCall.input.TableName).toBe("FASTBI_stripe_payment_methods");
    });

    it("reuses an existing customer when one exists", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerListResponse(true),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCardResponse({ customer: "cus_existing123" }),
        });

      const result = await processSingleToken(
        "tok_visa_456",
        "Maria Silva",
        "maria@example.com"
      );

      expect(result).toEqual({
        id: MOCK_UUID,
        paymentMethodId: "pm_1Q0PsIJvEtkwdCNYMSaVuRz6",
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("converts a us_bank_account token and persists to DynamoDB", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerListResponse(false),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerCreateResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildBankResponse({ customer: "cus_new123" }),
        });

      const result = await processSingleToken(
        "tok_bank_456",
        "John Doe",
        "john@example.com"
      );

      expect(result).toEqual({
        id: MOCK_UUID,
        paymentMethodId: "pm_2Q0PsIJvEtkwdCNYMSaVuRz7",
      });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("succeeds on retry after first Stripe failure", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerListResponse(false),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerCreateResponse(),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => "Internal Server Error",
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCardResponse({ customer: "cus_new123" }),
        });

      const result = await processSingleToken(
        "tok_retry_789",
        "Retry User",
        "retry@example.com"
      );

      expect(result).toEqual({
        id: MOCK_UUID,
        paymentMethodId: "pm_1Q0PsIJvEtkwdCNYMSaVuRz6",
      });
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it("persists full Stripe response with all nested fields to DynamoDB", async () => {
      const stripeResponse = buildCardResponse({
        customer: "cus_new123",
        billing_details: {
          address: {
            city: "Sao Paulo",
            country: "BR",
            line1: "Av. Paulista, 1000",
            line2: "Apto 42",
            postal_code: "01310-100",
            state: "SP",
          },
          email: "fulano@example.com",
          name: "Fulano de Tal",
          phone: "+5511999999999",
        },
        metadata: { order_id: "ord_123" },
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerListResponse(false),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerCreateResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => stripeResponse,
        });

      await processSingleToken(
        "tok_full_001",
        "Fulano de Tal",
        "fulano@example.com"
      );

      const putCall = mockSend.mock.calls[0][0];
      const item = putCall.input.Item;

      expect(item.id).toBe(MOCK_UUID);
      expect(item.payment_method_id).toBe("pm_1Q0PsIJvEtkwdCNYMSaVuRz6");
      expect(item.type).toBe("card");
      expect(item.billing_details.name).toBe("Fulano de Tal");
      expect(item.billing_details.address.city).toBe("Sao Paulo");
      expect(item.card.brand).toBe("visa");
      expect(item.card.last4).toBe("4242");
      expect(item.card.exp_month).toBe(12);
      expect(item.metadata.order_id).toBe("ord_123");
      expect(item.created_at).toBeDefined();
      expect(item.updated_at).toBeDefined();
      expect(item.customer).toBe("cus_new123");
    });

    it("handles bank account with full nested details in DynamoDB item", async () => {
      const stripeResponse = buildBankResponse({
        customer: "cus_new123",
        us_bank_account: {
          account_holder_type: "company",
          account_type: "savings",
          bank_name: "MOCK BANK",
          financial_connections_account: "fca_123",
          fingerprint: "bank-fp-001",
          last4: "1111",
          networks: { preferred: "ach", supported: ["ach", "sepa"] },
          routing_number: "021000021",
          status_details: { reason: null },
        },
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerListResponse(false),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerCreateResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => stripeResponse,
        });

      await processSingleToken(
        "tok_bank_full_002",
        "Company Inc",
        "finance@company.com"
      );

      const putCall = mockSend.mock.calls[0][0];
      const item = putCall.input.Item;

      expect(item.type).toBe("us_bank_account");
      expect(item.us_bank_account.bank_name).toBe("MOCK BANK");
      expect(item.us_bank_account.last4).toBe("1111");
      expect(item.us_bank_account.routing_number).toBe("021000021");
      expect(item.us_bank_account.account_holder_type).toBe("company");
      expect(item.us_bank_account.networks.supported).toEqual(["ach", "sepa"]);
      expect(item.customer).toBe("cus_new123");
    });
  });

  describe("processSingleToken - negative scenarios", () => {
    it("returns null when STRIPE_SECRET_API_KEY is missing", async () => {
      delete process.env.STRIPE_SECRET_API_KEY;

      const result = await processSingleToken(
        "tok_no_key",
        "No Key",
        "nokey@example.com"
      );

      expect(result).toBeNull();

      process.env.STRIPE_SECRET_API_KEY = "sk_test_mockedkey";
    });

    it("returns null when Stripe returns 400 - token_already_used", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerListResponse(false),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerCreateResponse(),
        })
        .mockResolvedValue({
          ok: false,
          status: 400,
          text: async () =>
            JSON.stringify({
              error: {
                code: "token_already_used",
                message: "The token tok_used has already been used.",
                type: "invalid_request_error",
              },
            }),
        });

      const result = await processSingleToken(
        "tok_used",
        "Used Token",
        "used@example.com"
      );

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("returns null when Stripe returns invalid payment method ID", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerListResponse(false),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerCreateResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "src_abc123",
            object: "source",
            type: "card",
            billing_details: { name: null, email: null },
            created: 1726673582,
            livemode: false,
          }),
        });

      const result = await processSingleToken(
        "tok_invalid_pm",
        "Invalid",
        "invalid@example.com"
      );

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("returns null when all 3 retry attempts fail", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerListResponse(false),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCustomerCreateResponse(),
        })
        .mockResolvedValue({
          ok: false,
          status: 502,
          text: async () => "Bad Gateway",
        });

      const result = await processSingleToken(
        "tok_all_fail",
        "Fail User",
        "fail@example.com"
      );

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("returns null when fetch throws a network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await processSingleToken(
        "tok_network_err",
        "Network",
        "network@example.com"
      );

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
