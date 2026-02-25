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
        console.log(data);
        const lastKey = data.length > 0 ? data[data.length - 1].key : '0';
        console.log(lastKey);
        const newKey = String(Number(lastKey) + 1);
        console.log(newKey);
        setRow([{ ...newData, key: newKey }, ...data]);
      };

return(
     <div className="layout">
        <SideBar />
    <div className="list">
        <Button onClick={AddRow}>行を追加</Button>
        <SetTable />
    </div>
    </div>
)
};

export default App;
