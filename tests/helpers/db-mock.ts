import { jest } from "@jest/globals";

export const mockPoolQuery = jest.fn();
export const mockClientQuery = jest.fn();
const mockRelease = jest.fn();

const buildClient = () => ({
  query: mockClientQuery,
  release: mockRelease,
});

export const mockConnect = jest.fn().mockImplementation(() => Promise.resolve(buildClient()));

export const createPgMock = () => ({
  Pool: jest.fn(() => ({
    query: mockPoolQuery,
    connect: mockConnect,
    end: jest.fn(),
  })),
});

export const resetMock = () => {
  mockPoolQuery.mockReset();
  mockClientQuery.mockReset();
  mockRelease.mockReset();
  mockConnect.mockReset();
  mockConnect.mockImplementation(() => Promise.resolve(buildClient()));
};

export const mockQueryOnce = (result: unknown) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockClientQuery as any).mockResolvedValueOnce(result);
};
