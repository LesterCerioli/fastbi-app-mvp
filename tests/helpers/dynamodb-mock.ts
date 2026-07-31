import { jest } from "@jest/globals";

export const mockSend = jest.fn();

export const createDynamoDBMock = () => ({
  DynamoDBClient: jest.fn(() => ({})),
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: mockSend,
    })),
  },
  PutCommand: jest.fn(),
  QueryCommand: jest.fn(),
});

export const resetDynamoDBMock = () => {
  mockSend.mockReset();
};
