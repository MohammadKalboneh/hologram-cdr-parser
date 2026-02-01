import { Request, Response } from "express";
import { uploadHandler } from "../upload";
import { uploadService } from "../../services/uploadService";
import { parseFileContent } from "../../parsers/parseFileContent";

// Mock the dependencies
jest.mock("../../services/uploadService", () => ({
  uploadService: {
    bulkCreateRecords: jest.fn(),
  },
}));

jest.mock("../../parsers/parseFileContent", () => ({
  parseFileContent: jest.fn(),
}));

describe("Upload Route Handler", () => {
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

  describe("uploadHandler", () => {
    it("should process file upload successfully", async () => {
      const fileContent = "1,123,1000,test,456,192.168.1.1\n2,124,2000,test2,457,192.168.1.2";
      mockReq.file = {
        buffer: Buffer.from(fileContent),
      } as Express.Multer.File;

      const mockRecords = [
        {
          id: 1,
          mnc: 123,
          bytes_used: 1000,
          dmcc: "test",
          cellid: 456,
          ip: "192.168.1.1",
        },
        {
          id: 2,
          mnc: 124,
          bytes_used: 2000,
          dmcc: "test2",
          cellid: 457,
          ip: "192.168.1.2",
        },
      ];

      (parseFileContent as jest.Mock).mockReturnValue({
        records: mockRecords,
        errors: [],
      });

      (uploadService.bulkCreateRecords as jest.Mock).mockResolvedValue({
        insertedCount: 2,
      });

      await uploadHandler(mockReq as Request, mockRes as Response);

      expect(parseFileContent).toHaveBeenCalledWith(fileContent);
      expect(uploadService.bulkCreateRecords).toHaveBeenCalledWith(mockRecords);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        meta: {
          totalLines: 2,
          parsedRecords: 2,
          insertedRecords: 2,
          errorCount: 0,
        },
        records: mockRecords,
        errors: [],
      });
    });

    it("should handle parsing errors", async () => {
      const fileContent = "1,123,1000,test,456,192.168.1.1\ninvalid-line\n3,125,3000,test3,458,192.168.1.3";
      mockReq.file = {
        buffer: Buffer.from(fileContent),
      } as Express.Multer.File;

      const mockRecords = [
        {
          id: 1,
          mnc: 123,
          bytes_used: 1000,
          dmcc: "test",
          cellid: 456,
          ip: "192.168.1.1",
        },
        {
          id: 3,
          mnc: 125,
          bytes_used: 3000,
          dmcc: "test3",
          cellid: 458,
          ip: "192.168.1.3",
        },
      ];

      const mockErrors = [
        {
          lineNumber: 2,
          line: "invalid-line",
          message: "Invalid format",
        },
      ];

      (parseFileContent as jest.Mock).mockReturnValue({
        records: mockRecords,
        errors: mockErrors,
      });

      (uploadService.bulkCreateRecords as jest.Mock).mockResolvedValue({
        insertedCount: 2,
      });

      await uploadHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        meta: {
          totalLines: 3,
          parsedRecords: 2,
          insertedRecords: 2,
          errorCount: 1,
        },
        records: mockRecords,
        errors: mockErrors,
      });
    });

    it("should return 400 when file is missing", async () => {
      mockReq.file = undefined;

      await uploadHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Missing file field 'file' in multipart form-data.",
      });
      expect(parseFileContent).not.toHaveBeenCalled();
      expect(uploadService.bulkCreateRecords).not.toHaveBeenCalled();
    });

    it("should handle empty file", async () => {
      mockReq.file = {
        buffer: Buffer.from(""),
      } as Express.Multer.File;

      (parseFileContent as jest.Mock).mockReturnValue({
        records: [],
        errors: [],
      });

      (uploadService.bulkCreateRecords as jest.Mock).mockResolvedValue({
        insertedCount: 0,
      });

      await uploadHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        meta: {
          totalLines: 0,
          parsedRecords: 0,
          insertedRecords: 0,
          errorCount: 0,
        },
        records: [],
        errors: [],
      });
    });

    it("should handle database errors and return 500", async () => {
      const fileContent = "1,123,1000,test,456,192.168.1.1";
      mockReq.file = {
        buffer: Buffer.from(fileContent),
      } as Express.Multer.File;

      const mockRecords = [
        {
          id: 1,
          mnc: 123,
          bytes_used: 1000,
          dmcc: "test",
          cellid: 456,
          ip: "192.168.1.1",
        },
      ];

      (parseFileContent as jest.Mock).mockReturnValue({
        records: mockRecords,
        errors: [],
      });

      const dbError = new Error("Database connection failed");
      (uploadService.bulkCreateRecords as jest.Mock).mockRejectedValue(dbError);

      await uploadHandler(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Failed to process uploaded file",
        error: "Database connection failed",
      });
      expect(console.error).toHaveBeenCalledWith("Error uploading file:", dbError);
    });

    it("should count lines correctly with different line endings", async () => {
      const fileContent = "1,123,1000,test,456,192.168.1.1\r\n2,124,2000,test2,457,192.168.1.2\n";
      mockReq.file = {
        buffer: Buffer.from(fileContent),
      } as Express.Multer.File;

      (parseFileContent as jest.Mock).mockReturnValue({
        records: [],
        errors: [],
      });

      (uploadService.bulkCreateRecords as jest.Mock).mockResolvedValue({
        insertedCount: 0,
      });

      await uploadHandler(mockReq as Request, mockRes as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response.meta.totalLines).toBe(2);
    });
  });
});
