import { parseFileContent } from "../parseFileContent";

describe("parseFileContent", () => {
  test("parses the provided example file with partial-success model (no errors expected)", () => {
    const content = `4,0d39f,0,495594,214
16,be833279000000c063e5e63d
9991,2935
316,0e893279227712cac0014aff
7194,b33,394,495593,192
7291,293451
`;

    const result = parseFileContent(content);

    expect(result.errors).toEqual([]);

    expect(result.records).toEqual([
      {
        id: 4,
        mnc: 0,
        bytes_used: 495594,
        dmcc: "0d39f",
        cellid: 214,
        ip: null,
      },
      {
        id: 16,
        mnc: 48771, // 0xbe83
        bytes_used: 12921, // 0x3279
        dmcc: null,
        cellid: 192, // 0x000000c0
        ip: "99.229.230.61", // 0x63e5e63d
      },
      {
        id: 9991,
        mnc: null,
        bytes_used: 2935,
        dmcc: null,
        cellid: null,
        ip: null,
      },
      {
        id: 316,
        mnc: 3721, // 0x0e89
        bytes_used: 12921, // 0x3279
        dmcc: null,
        cellid: 578228938, // 0x227712ca
        ip: "192.1.74.255", // 0xc0014aff
      },
      {
        id: 7194,
        mnc: 394,
        bytes_used: 495593,
        dmcc: "b33",
        cellid: 192,
        ip: null,
      },
      {
        id: 7291,
        mnc: null,
        bytes_used: 293451,
        dmcc: null,
        cellid: null,
        ip: null,
      },
    ]);
  });
});
