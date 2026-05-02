import React, { useState } from "react";
import {
  Modal,
  DatePicker,
  Button,
  Typography,
  Space,
  Alert,
  message,
} from "antd";
import {
  CopyOutlined,
  CalendarOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ja";
import locale from "antd/es/date-picker/locale/ja_JP";
import { apiUrl } from "../../../../lib/api";

dayjs.locale("ja");

const { Title, Text } = Typography;

type Props = {
  /** カレンダーで現在表示している年月 */
  currentYear: number;
  currentMonth: number;
  onSuccess?: () => void;
};

const CopyScheduleModal: React.FC<Props> = ({
  currentYear,
  currentMonth,
  onSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [targetMonth, setTargetMonth] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);

  const currentLabel = `${currentYear}年${currentMonth}月`;

  const handleOpen = () => {
    setTargetMonth(null);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleCopy = async () => {
    if (!targetMonth) return;

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/schedule/copy"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromYear: currentYear,
          fromMonth: currentMonth,
          toYear: targetMonth.year(),
          toMonth: targetMonth.month() + 1, // dayjsは0始まり
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "コピーに失敗しました");
      }

      const result = await res.json();
      message.success(
        `${currentLabel} → ${targetMonth.year()}年${targetMonth.month() + 1}月 にコピーしました（${result.copiedDays}日分）`
      );
      setOpen(false);
      onSuccess?.();
    } catch (e: any) {
      message.error(e.message ?? "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // コピー先として現在月は選択不可
  const disabledDate = (d: Dayjs) =>
    d.year() === currentYear && d.month() + 1 === currentMonth;

  return (
    <>
      <Button
        icon={<CopyOutlined />}
        onClick={handleOpen}
        style={{ borderColor: "#0d5c8f", color: "#0d5c8f" }}
      >
        月コピー
      </Button>

      <Modal
        open={open}
        onCancel={handleClose}
        footer={null}
        width={440}
        destroyOnHidden
        title={null}
      >
        {/* ── Header ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #1a3a5c 0%, #0d5c8f 100%)",
            padding: "24px 28px 20px",
            color: "#fff",
            margin: "-20px -24px 24px",
          }}
        >
          <Space align="center" size={10}>
            <CopyOutlined style={{ fontSize: 20, opacity: 0.85 }} />
            <Title level={5} style={{ margin: 0, color: "#fff", fontWeight: 600 }}>
              予定を別の月にコピー
            </Title>
          </Space>
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              display: "block",
              marginTop: 4,
            }}
          >
            コピー元：{currentLabel}
          </Text>
        </div>

        {/* ── Body ── */}
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            message={
              <Text style={{ fontSize: 13 }}>
                <b>{currentLabel}</b> の全スタッフの予定を、日付の「日」を維持したまま
                コピー先の月に複製します。
                <br />
                コピー先に既存の予定がある日は上書きされます。
              </Text>
            }
          />

          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              <CalendarOutlined style={{ marginRight: 6, color: "#0d5c8f" }} />
              コピー先の月を選択
            </Text>
            <DatePicker
              picker="month"
              locale={locale}
              value={targetMonth}
              onChange={(val) => setTargetMonth(val)}
              disabledDate={disabledDate}
              format="YYYY年M月"
              size="large"
              style={{ width: "100%" }}
              placeholder="コピー先の月を選択"
            />
          </div>

          {targetMonth && (
            <Alert
              type="warning"
              showIcon
              message={`${targetMonth.year()}年${targetMonth.month() + 1}月 の同日に既存データがある場合は上書きされます`}
            />
          )}
        </Space>

        {/* ── Footer ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <Button icon={<CloseOutlined />} onClick={handleClose} size="large">
            キャンセル
          </Button>
          <Button
            type="primary"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            loading={loading}
            disabled={!targetMonth}
            size="large"
            style={{
              background: "linear-gradient(135deg, #1a3a5c, #0d5c8f)",
              border: "none",
              minWidth: 120,
            }}
          >
            コピーする
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default CopyScheduleModal;