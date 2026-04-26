import type { StaffWork } from "../../../../backend/data/basetype";
import { Button } from "antd"
import { DownloadOutlined } from '@ant-design/icons';
import { handleDownloadCSV } from "../state/useCalendar";
// DownloadButton.tsx
type Props = { data: StaffWork[] }

export const DownloadButton = ({ data }: Props) => {
  const {dl, setDl} = handleDownloadCSV()

  const handleDownload = async () => {
    setDl(true)
    try {
      const res = await fetch('/api/download/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),  // 表示中データをそのまま送る
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '勤務表.csv'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDl(false)
    }
  }

  return (
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      loading={dl}
      onClick={handleDownload}
    >
      CSVダウンロード
    </Button>
  )
}

