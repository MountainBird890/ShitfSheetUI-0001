import { Button, Space } from "antd"
import { DownloadOutlined } from '@ant-design/icons'
import { useState } from "react"
import { PDFDocument, rgb, PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"

type VisibleData = {
  staffId: string
  name: string
  date: string
  type: string
}

type Props = { data: VisibleData[] }

export const DownloadButton = ({ data }: Props) => {
  const [dlCsv, setDlCsv] = useState(false)
  const [dlPdf, setDlPdf] = useState(false)

  // --- CSV ---
  const handleDownloadCsv = async () => {
    setDlCsv(true)
    try {
      const res = await fetch('/api/download/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '勤務表.csv'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDlCsv(false)
    }
  }

  // --- PDF ---
  const handleDownloadPdf = async () => {
    setDlPdf(true)
    try {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.registerFontkit(fontkit)
      const fontBytes = await fetch('../../../../../public/fonts/NotoSansJP-VariableFont_wght.ttf').then(r => r.arrayBuffer())
      const font = await pdfDoc.embedFont(fontBytes)

      const ROW_HEIGHT = 20
      const MARGIN = 40
      const COL_WIDTHS = [80, 120, 100, 100]
      const HEADERS = ['スタッフID', '氏名', '日付', '種別']
      const PAGE_WIDTH = COL_WIDTHS.reduce((a, b) => a + b, 0) + MARGIN * 2
      const ROWS_PER_PAGE = 30

      const drawPage = (rows: VisibleData[], pageIndex: number) => {
        const page: PDFPage = pdfDoc.addPage([PAGE_WIDTH, 842])
        const { height } = page.getSize()

        page.drawText('勤務表', {
          x: MARGIN,
          y: height - MARGIN,
          size: 14,
          font,
          color: rgb(0, 0, 0),
        })

        page.drawText(`${pageIndex + 1} ページ`, {
          x: PAGE_WIDTH - MARGIN - 50,
          y: height - MARGIN,
          size: 10,
          font,
          color: rgb(0.4, 0.4, 0.4),
        })

        let startY = height - MARGIN - ROW_HEIGHT * 2
        let x = MARGIN
        HEADERS.forEach((header, i) => {
          page.drawRectangle({
            x,
            y: startY,
            width: COL_WIDTHS[i],
            height: ROW_HEIGHT,
            color: rgb(0.2, 0.4, 0.8),
          })
          page.drawText(header, {
            x: x + 4,
            y: startY + 5,
            size: 10,
            font,
            color: rgb(1, 1, 1),
          })
          x += COL_WIDTHS[i]
        })

        rows.forEach((row, rowIdx) => {
          const y = startY - ROW_HEIGHT * (rowIdx + 1)
          const cells = [row.staffId, row.name, row.date, row.type]
          let cx = MARGIN

          if (rowIdx % 2 === 0) {
            page.drawRectangle({
              x: MARGIN,
              y,
              width: COL_WIDTHS.reduce((a, b) => a + b, 0),
              height: ROW_HEIGHT,
              color: rgb(0.95, 0.95, 0.95),
            })
          }

          cells.forEach((cell, i) => {
            page.drawText(cell, {
              x: cx + 4,
              y: y + 5,
              size: 9,
              font,
              color: rgb(0, 0, 0),
            })
            cx += COL_WIDTHS[i]
          })
        })
      }

      const totalPages = Math.ceil(data.length / ROWS_PER_PAGE)
      for (let i = 0; i < totalPages; i++) {
        drawPage(data.slice(i * ROWS_PER_PAGE, (i + 1) * ROWS_PER_PAGE), i)
      }
      if (data.length === 0) drawPage([], 0)

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '勤務表.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDlPdf(false)
    }
  }

  return (
    <Space>
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        loading={dlCsv}
        onClick={handleDownloadCsv}
      >
        CSVダウンロード
      </Button>
      <Button
        icon={<DownloadOutlined />}
        loading={dlPdf}
        onClick={handleDownloadPdf}
      >
        PDFダウンロード
      </Button>
    </Space>
  )
}