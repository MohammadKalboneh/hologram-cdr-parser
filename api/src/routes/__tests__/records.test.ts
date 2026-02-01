import { Request, Response } from "express";
import { getRecordsHandler, createRecordHandler } from "../records";
import { recordService } from "../../services/recordService";

// Mock the recordService
jest.mock("../../services/recordService", () => ({
  recordService: {
    getRecords: jest.fn(),
    createRecord: jest.fn(),
  },
}));

// Mock the serialize module
jest.mock("../../serialize", () => ({
  toJsonSafe: jest.fn((data) => data),
}));

describe("Records Route Handlers", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockReq = {};
    mockRes = {
      json: jsonMock,
      status: statusMock,
    };

    jest.clearAllMocks();
    console.error = jest.fn(); // Suppress error logs in tests
  });

  describe("getRecordsHandler", () => {
    it("should return records successfully", async () => {
      const mockRecords = [
        {
          id: 1,
          mnc: 123,
          bytesUsed: 1000,
          dmcc: "test",
          cellid: BigInt(456),
          ip: "192.168.1.1",
          createdAt: new Date(),
        },
      ];

      (recordService.getRecords as jest.Mock).mockResolvedValue(mockRecords);

      await getRecordsHandler(mockReq as Request, mockRes as Response);

      expect(recordService.getRecords).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(mockRecords);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should handle errors and return 500", async () => {
      const error = new Error("Database error");
      (recordService.getRecords as jest.Mock).mockRejectedValue(error);

      await getRecordsHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Failed to fetch records",
        error: "Database error",
      });
      expect(console.error).toHaveBeenCalledWith("Error fetching records:", error);
    });
  });

  describe("createRecordHandler", () => {
    it("should create a record successfully", async () => {
      mockReq.body = {
        id: 1,
        mnc: 123,
        bytes_used: 1000,
        dmcc: "test",
        cellid: 456,
        ip: "192.168.1.1",
      };

      const mockCreated = {
        id: 1,
        mnc: 123,
        bytesUsed: 1000,
        dmcc: "test",
        cellid: BigInt(456),
        ip: "192.168.1.1",
        createdAt: new Date(),
      };

      (recordService.createRecord as jest.Mock).mockResolvedValue(mockCreated);

      await createRecordHandler(mockReq as Request, mockRes as Response);

      expect(recordService.createRecord).toHaveBeenCalledWith({
        id: 1,
        mnc: 123,
        bytes_used: 1000,
        dmcc: "test",
        cellid: 456,
        ip: "192.168.1.1",
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        ...mockCreated,
        cellid: "456",
      });
    });

    it("should handle null cellid", async () => {
      mockReq.body = {
        id: 1,
        bytes_used: 1000,
      };

      const mockCreated = {
        id: 1,
        mnc: null,
        bytesUsed: 1000,
        dmcc: null,
        cellid: null,
        ip: null,
        createdAt: new Date(),
      };

      (recordService.createRecord as jest.Mock).mockResolvedValue(mockCreated);

      await createRecordHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        ...mockCreated,
        cellid: null,
      });
    });

    it("should return 400 when id is missing", async () => {
      mockReq.body = {
        bytes_used: 1000,
      };

      await createRecordHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "id and bytes_used are required and must be numbers",
      });
      expect(recordService.createRecord).not.toHaveBeenCalled();
    });

    it("should return 400 when bytes_used is missing", async () => {
      mockReq.body = {
        id: 1,
      };

      await createRecordHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "id and bytes_used are required and must be numbers",
      });
      expect(recordService.createRecord).not.toHaveBeenCalled();
    });

    it("should return 400 when id is not a number", async () => {
      mockReq.body = {
        id: "not-a-number",
        bytes_used: 1000,
      };

      await createRecordHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "id and bytes_used are required and must be numbers",
      });
      expect(recordService.createRecord).not.toHaveBeenCalled();
    });

    it("should return 400 when body is undefined", async () => {
      mockReq.body = undefined;

      await createRecordHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "id and bytes_used are required and must be numbers",
      });
    });

    it("should handle database errors and return 500", async () => {
      mockReq.body = {
        id: 1,
        bytes_used: 1000,
      };

      const error = new Error("Database error");
      (recordService.createRecord as jest.Mock).mockRejectedValue(error);

      await createRecordHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Failed to create record",
        error: "Database error",
      });
      expect(console.error).toHaveBeenCalledWith("Error creating record:", error);
    });
  });
});
