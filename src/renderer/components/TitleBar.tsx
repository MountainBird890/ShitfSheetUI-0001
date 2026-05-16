export default function TitleBar() {
  const handleMinimize = () => (window as any).electronAPI?.minimize();
  const handleMaximize = () => (window as any).electronAPI?.maximize();
  const handleClose    = () => (window as any).electronAPI?.close();

  console.log((window as any).electronAPI)
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 36,
      background: '#1a3a5c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 9999,
      WebkitAppRegion: 'drag',  // ドラッグでウィンドウ移動できるように
    } as React.CSSProperties}>
      {/* 左：アプリ名 */}
      <span style={{
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        paddingLeft: 12,
        letterSpacing: 1,
      }}>
        care-app
      </span>

      {/* 右：ウィンドウ操作ボタン */}
      <div style={{
        display: 'flex',
        WebkitAppRegion: 'no-drag',  // ボタンはクリック可能に
      } as React.CSSProperties}>
        {/* 縮小 */}
        <button onClick={handleMinimize} style={btnStyle('#666')}>
          ＿
        </button>
        {/* 最大化 */}
        <button onClick={handleMaximize} style={btnStyle('#666')}>
          ◻
        </button>
        {/* 閉じる */}
        <button
          onClick={handleClose}
          style={btnStyle('#666')}
          onMouseEnter={e => (e.currentTarget.style.background = '#e81123')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const btnStyle = (color: string): React.CSSProperties => ({
  background: 'transparent',
  border: 'none',
  color: '#fff',
  width: 46,
  height: 36,
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s',
});