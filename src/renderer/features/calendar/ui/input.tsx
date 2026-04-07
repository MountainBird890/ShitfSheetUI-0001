import { Button, Modal } from 'antd';
import { handleInput, handleLoading } from '../state/useCalendar';

// useCalendar.tsxの更新関数に、↓の状態更新を置き換える
// calendar.tsxに職員名を押せるonClickロジックを実装して、ここのreturnが返されてポップアップが表示されるロジックを書く
// 実際に編集できるUIはまだ作ってない。編集UIコンポーネントとこのクリックポップアップコンポーネントの更新は分離させる。別アプリとして扱う。



const InputUI: React.FC = () => {
  console.log("input.tsx is correct")

  const { loading, setLoading } = handleLoading();
  const { open, setOpen } = handleInput();

console.log("input.tsx2 is correct")
  const handleOk = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
    }, 3000);
  };
console.log("input.tsx3 is correct")
  const handleCancel = () => {
    setOpen(false);
  };
console.log("input.tsx4 is correct")
  return (
    <>
      <Modal
        open={open}
        title="佐藤様"
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            戻る
          </Button>,
          <Button loading={loading}>
            編集
          </Button>
        ]}
      >
        <div><p>介助者：</p><p>兵庫太郎</p></div>
        <div><p>開始時間：</p><p>9:00</p></div>
        <div><p>終了時間：</p><p>18:00</p></div>
        <div><p>種別：</p><p>身体</p></div>
      </Modal>
    </>
  );
};
console.log("input.tsx5W is correct")
export default InputUI;