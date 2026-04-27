// utils/downloadCsv.ts
export function downloadCsv(filename: string, rows: string[][]) {
    const bom = '\uFEFF'; // 日本語文字化け防止
    const csv = bom + rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}