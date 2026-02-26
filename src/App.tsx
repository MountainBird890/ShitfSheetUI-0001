import SideBar from './setSideBar';
import SetTable from './setTable';
import { Button } from 'antd';
import { useState } from 'react';
import useData from './sampleData';

function App(){
    const [data, setRow] = useState(useData());

      const newData = {
        key: '',
        name: '',
        office: '',
        holiday: '',
        pto: '',
        yamada: '',
        suzuki: '',
      };

      const AddRow =()=> {
        setRow((data) =>{
          // データを参照してオプショナルチェーンでnull検知(三項演算子でバリデーションチェック)
           const refData = data[0]?.key ? data[0].key : '0'; 
          // 数値に変換。その後文字列に変換
          const newKey = String(Number(refData) + 1);
          // ログ出力でデバッグ
          console.log('追加された行のキー数',newKey);
          // データ配列の頭にセット(オブジェクトで返す)
          return[{...newData, key: newKey}, ...data]
        });
      };

return(
     <div className="layout">
        <SideBar />
    <div className="list">
        <Button onClick={AddRow}>行を追加</Button>
        <SetTable data={data} />
    </div>
    </div>
)
};

export default App;
