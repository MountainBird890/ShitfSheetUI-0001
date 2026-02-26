import { useState } from "react";
import { Button } from 'antd';

function Layout(){
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

export default Layout;