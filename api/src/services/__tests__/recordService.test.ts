import { RecordService } from "../recordService";
import { prisma } from "../../db";

// Mock the prisma client
jest.mock("../../db", () => ({
  prisma: {
    usageRecord: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("RecordService", () => {
  let recordService: RecordService;

  beforeEach(() => {
    recordService = new RecordService();
    jest.clearAllMocks();
  });

  describe("getRecords", () => {
    it("should fetch records with default limit", async () => {
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

      (prisma.usageRecord.findMany as jest.Mock).mockResolvedValue(mockRecords);

      const result = await recordService.getRecords();

      expect(prisma.usageRecord.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 500,
      });
      expect(result).toEqual(mockRecords);
    });

    it("should fetch records with custom limit", async () => {
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

      (prisma.usageRecord.findMany as jest.Mock).mockResolvedValue(mockRecords);

      const result = await recordService.getRecords(50);

      expect(prisma.usageRecord.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      expect(result).toEqual(mockRecords);
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      (prisma.usageRecord.findMany as jest.Mock).mockRejectedValue(dbError);

      await expect(recordService.getRecords()).rejects.toThrow("Database connection failed");
    });
  });

  describe("createRecord", () => {
    it("should create a record with all fields", async () => {
      const input = {
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

      (prisma.usageRecord.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await recordService.createRecord(input);

      expect(prisma.usageRecord.create).toHaveBeenCalledWith({
        data: {
          id: 1,
          mnc: 123,
          bytesUsed: 1000,
          dmcc: "test",
          cellid: BigInt(456),
          ip: "192.168.1.1",
        },
      });
      expect(result).toEqual(mockCreated);
    });

    it("should create a record with only required fields", async () => {
      const input = {
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

      (prisma.usageRecord.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await recordService.createRecord(input);

      expect(prisma.usageRecord.create).toHaveBeenCalledWith({
        data: {
          id: 1,
          mnc: null,
          bytesUsed: 1000,
          dmcc: null,
          cellid: null,
          ip: null,
        },
      });
      expect(result).toEqual(mockCreated);
    });

    it("should handle database errors", async () => {
      const input = {
        id: 1,
        bytes_used: 1000,
      };

      const dbError = new Error("Unique constraint violation");
      (prisma.usageRecord.create as jest.Mock).mockRejectedValue(dbError);

      await expect(recordService.createRecord(input)).rejects.toThrow("Unique constraint violation");
    });
  });
});
