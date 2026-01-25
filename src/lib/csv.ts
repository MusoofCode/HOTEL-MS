export function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
  const headerSet = rows.reduce((set, r) => {
    Object.keys(r).forEach((k) => set.add(k));
    return set;
  }, new Set<string>());
  const headers: string[] = [];
  headerSet.forEach((h) => headers.push(h));

  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[\n\r,\"]/g.test(s)) return `"${s.replace(/\"/g, '""')}"`;
    return s;
  };

  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
