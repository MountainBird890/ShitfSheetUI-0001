import { handleContext } from "../state/useShift";
import { initialData } from "../domain/sampleData";

 export const setAdd = () =>{
  const {data, setData} = handleContext();

  const newData = {
        key: '',
        name: '',
        office: '',
        holiday: '',
        pto: '',
        yamada: '',
        suzuki: '',
      };
      
      // データを参照してオプショナルチェーンでnull検知(三項演算子でバリデーションチェック)
           const refData = data[0]?.key ? data[0].key : '0'; 
          // 数値に変換。その後文字列に変換
          const newKey = String(Number(refData) + 1);
          // ログ出力でデバッグ
          console.log('追加された行のキー数',newKey);


          //data
        setData(() =>{
          // データ配列の頭にセット(オブジェクトで返す)
          return[{...newData, key: newKey}, ...initialData]
        });
 }


