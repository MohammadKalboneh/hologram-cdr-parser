import { UploadService } from "../uploadService";
import { prisma } from "../../db";
import { NormalizedUsageRecord } from "../../types";

// Mock the prisma client
jest.mock("../../db", () => ({
  prisma: {
    usageRecord: {
      createMany: jest.fn(),
    },
  },
}));

describe("UploadService", () => {
  let uploadService: UploadService;

  beforeEach(() => {
    uploadService = new UploadService();
    jest.clearAllMocks();
  });

  describe("bulkCreateRecords", () => {
    it("should insert multiple records successfully", async () => {
      const records: NormalizedUsageRecord[] = [
        {
          id: 1,
          mnc: 123,
          bytes_used: 1000,
          dmcc: "test1",
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

      (prisma.usageRecord.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await uploadService.bulkCreateRecords(records);

      expect(prisma.usageRecord.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: 1,
            mnc: 123,
            bytesUsed: 1000,
            dmcc: "test1",
            cellid: BigInt(456),
            ip: "192.168.1.1",
          },
          {
            id: 2,
            mnc: 124,
            bytesUsed: 2000,
            dmcc: "test2",
            cellid: BigInt(457),
            ip: "192.168.1.2",
          },
        ],
        skipDuplicates: true,
      });
      expect(result.insertedCount).toBe(2);
    });

    it("should handle records with null fields", async () => {
      const records: NormalizedUsageRecord[] = [
        {
          id: 1,
          mnc: null,
          bytes_used: 1000,
          dmcc: null,
          cellid: null,
          ip: null,
        },
      ];

      (prisma.usageRecord.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await uploadService.bulkCreateRecords(records);

      expect(prisma.usageRecord.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: 1,
            mnc: null,
            bytesUsed: 1000,
            dmcc: null,
            cellid: null,
            ip: null,
          },
        ],
        skipDuplicates: true,
      });
      expect(result.insertedCount).toBe(1);
    });

    it("should return 0 when no records provided", async () => {
      const records: NormalizedUsageRecord[] = [];

      const result = await uploadService.bulkCreateRecords(records);

      expect(prisma.usageRecord.createMany).not.toHaveBeenCalled();
      expect(result.insertedCount).toBe(0);
    });

    it("should handle partial inserts with skipDuplicates", async () => {
      const records: NormalizedUsageRecord[] = [
        {
          id: 1,
          mnc: 123,
          bytes_used: 1000,
          dmcc: "test1",
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

      // Simulate one record being skipped as duplicate
      (prisma.usageRecord.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await uploadService.bulkCreateRecords(records);

      expect(result.insertedCount).toBe(1);
    });

    it("should handle database errors", async () => {
      const records: NormalizedUsageRecord[] = [
        {
          id: 1,
          mnc: 123,
          bytes_used: 1000,
          dmcc: "test1",
          cellid: 456,
          ip: "192.168.1.1",
        },
      ];

      const dbError = new Error("Database error");
      (prisma.usageRecord.createMany as jest.Mock).mockRejectedValue(dbError);

      await expect(uploadService.bulkCreateRecords(records)).rejects.toThrow("Database error");
    });
  });
});
