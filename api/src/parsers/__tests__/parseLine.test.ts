import { parseLine } from "../parseLine";

describe("parseLine", () => {
  test("basic parsing (id not ending 4/6)", () => {
    const r = parseLine("3,1024");
    expect(r).toEqual({
      ok: true,
      record: {
        id: 3,
        mnc: null,
        bytes_used: 1024,
        dmcc: null,
        cellid: null,
        ip: null,
      },
    });
  });

  test("extended parsing (id ending with 4)", () => {
    const r = parseLine("7294,a03,9523,1024,193955");
    expect(r).toEqual({
      ok: true,
      record: {
        id: 7294,
        mnc: 9523,
        bytes_used: 1024,
        dmcc: "a03",
        cellid: 193955,
        ip: null,
      },
    });
  });

  test("hex parsing (id ending with 6)", () => {
    // mnc=0x00b6=182
    // bytes_used=0x03e8=1000
    // cellid=0x00007bda=31706
    // ip=c0a80001 => 192.168.0.1
    const r = parseLine("1016,00b603e800007bdac0a80001");
    expect(r).toEqual({
      ok: true,
      record: {
        id: 1016,
        mnc: 182,
        bytes_used: 1000,
        dmcc: null,
        cellid: 31706,
        ip: "192.168.0.1",
      },
    });
  });

  test("returns error for empty line", () => {
    const r = parseLine("   ");
    expect(r.ok).toBe(false);
  });

  test("returns error for malformed hex length", () => {
    const r = parseLine("1016,deadbeef");
    expect(r.ok).toBe(false);
  });
});
