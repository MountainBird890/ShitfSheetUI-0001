import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";

interface ScheduleDetail {
  user: string;
  start: string;
  end: string;
  type: string;
}

interface StaffWork {
  staffId: string;
  name: string;
  details?: Record<string, ScheduleDetail>;
}

type Props = {
  staffList: StaffWork[];
  month: Dayjs;
};

function calcWorkHours(detail: ScheduleDetail): number {
  const s = dayjs(detail.start);
  const e = dayjs(detail.end);
  const diffMin = e.diff(s, "minute");
  const adjMin = diffMin <= 0 ? diffMin + 1440 : diffMin; // 日跨ぎ補正
  return Math.round((adjMin / 60) * 10) / 10;
}

export default function KimukeitaiCsvDl({ staffList, month }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    setLoading(true);
    try {
      const BOM = "\uFEFF";
      const headers = ["日付", "氏名", "開始", "終了", "ご利用者", "種別", "合計労働時間"];
      const daysInMonth = month.daysInMonth();
      const monthPrefix = month.format("YYYY-MM");

      const rows: string[][] = [];

      for (const staff of staffList) {
        for (let i = 0; i < daysInMonth; i++) {
          const day = month.startOf("month").add(i, "day");
          const dateStr = day.format("YYYY-MM-DD");
          const detail = staff.details?.[dateStr];

          if (detail) {
            const workHours = calcWorkHours(detail);
            rows.push([
              dateStr,
              staff.name,
              dayjs(detail.start).format("HH:mm"),
              dayjs(detail.end).format("HH:mm"),
              detail.user,
              detail.type,
              String(workHours),
            ]);
          } else {
            rows.push([
              dateStr,
              staff.name,
              "ー",
              "ー",
              "ー",
              "ー",
              "0",
            ]);
          }
        }
      }

      const csv = BOM + [headers, ...rows]
        .map(r => r.map(cell => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `勤務形態表-${month.format("YYYY年M月")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      icon={<DownloadOutlined />}
      loading={loading}
      onClick={handleDownload}
    >
      CSVダウンロード
    </Button>
  );
}