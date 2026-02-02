import { StreamUploadService } from "../streamUploadService";
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

describe("StreamUploadService", () => {
  let service: StreamUploadService;

  beforeEach(() => {
    service = new StreamUploadService();
    jest.clearAllMocks();
  });

  describe("insertBatch", () => {
    it("should insert a batch of records", async () => {
      const records: NormalizedUsageRecord[] = [
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

      (prisma.usageRecord.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await service.insertBatch(records);

      expect(result).toBe(2);
      expect(prisma.usageRecord.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 1, bytesUsed: 1000 }),
          expect.objectContaining({ id: 2, bytesUsed: 2000 }),
        ]),
        skipDuplicates: true,
      });
    });

    it("should return 0 for empty batch", async () => {
      const result = await service.insertBatch([]);

      expect(result).toBe(0);
      expect(prisma.usageRecord.createMany).not.toHaveBeenCalled();
    });
  });

  describe("processStreamInBatches", () => {
    async function* createRecordGenerator(records: NormalizedUsageRecord[]) {
      for (const record of records) {
        yield record;
      }
    }

    it("should process records in batches", async () => {
      // Create 1500 records (should result in 3 batches of 500)
      const records: NormalizedUsageRecord[] = Array.from({ length: 1500 }, (_, i) => ({
        id: i + 1,
        mnc: 123,
        bytes_used: 1000,
        dmcc: "test",
        cellid: 456,
        ip: "192.168.1.1",
      }));

      (prisma.usageRecord.createMany as jest.Mock).mockResolvedValue({ count: 500 });

      const generator = createRecordGenerator(records);
      const result = await service.processStreamInBatches(generator);

      expect(result.totalProcessed).toBe(1500);
      expect(result.insertedCount).toBe(1500); // 500 * 3 batches
      expect(prisma.usageRecord.createMany).toHaveBeenCalledTimes(3);
    });

    it("should handle partial batch at end", async () => {
      // Create 750 records (1 full batch of 500 + partial batch of 250)
      const records: NormalizedUsageRecord[] = Array.from({ length: 750 }, (_, i) => ({
        id: i + 1,
        mnc: 123,
        bytes_used: 1000,
        dmcc: "test",
        cellid: 456,
        ip: "192.168.1.1",
      }));

      (prisma.usageRecord.createMany as jest.Mock).mockResolvedValue({ count: 500 });

      const generator = createRecordGenerator(records);
      const result = await service.processStreamInBatches(generator);

      expect(result.totalProcessed).toBe(750);
      expect(prisma.usageRecord.createMany).toHaveBeenCalledTimes(2);
    });

    it("should handle empty stream", async () => {
      const records: NormalizedUsageRecord[] = [];

      const generator = createRecordGenerator(records);
      const result = await service.processStreamInBatches(generator);

      expect(result.totalProcessed).toBe(0);
      expect(result.insertedCount).toBe(0);
      expect(prisma.usageRecord.createMany).not.toHaveBeenCalled();
    });

    it("should handle single record", async () => {
      const records: NormalizedUsageRecord[] = [
        {
          id: 1,
          mnc: 123,
          bytes_used: 1000,
          dmcc: "test",
          cellid: 456,
          ip: "192.168.1.1",
        },
      ];

      (prisma.usageRecord.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const generator = createRecordGenerator(records);
      const result = await service.processStreamInBatches(generator);

      expect(result.totalProcessed).toBe(1);
      expect(result.insertedCount).toBe(1);
      expect(prisma.usageRecord.createMany).toHaveBeenCalledTimes(1);
    });

    it("should handle duplicates with skipDuplicates", async () => {
      const records: NormalizedUsageRecord[] = Array.from({ length: 600 }, (_, i) => ({
        id: i + 1,
        mnc: 123,
        bytes_used: 1000,
        dmcc: "test",
        cellid: 456,
        ip: "192.168.1.1",
      }));

      // Simulate some duplicates being skipped
      (prisma.usageRecord.createMany as jest.Mock)
        .mockResolvedValueOnce({ count: 450 }) // First batch: 50 duplicates
        .mockResolvedValueOnce({ count: 90 }); // Second batch: 10 duplicates

      const generator = createRecordGenerator(records);
      const result = await service.processStreamInBatches(generator);

      expect(result.totalProcessed).toBe(600);
      expect(result.insertedCount).toBe(540); // 450 + 90
    });
  });
});
