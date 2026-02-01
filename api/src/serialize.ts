export function toJsonSafe<T>(value: T): any {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => {
      if (typeof v === "bigint") {
        const n = Number(v);
        return Number.isSafeInteger(n) ? n : v.toString();
      }
      return v;
    })
  );
}
