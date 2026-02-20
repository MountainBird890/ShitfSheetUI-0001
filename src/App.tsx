import staffName from "./useName";
import sideBar from './setSideBar';
import { Menu } from 'antd';

function App(){
    const {staff, inputName}= staffName();

return(
     <div className="layout">
        <Menu>{sideBar()}</Menu>
    <div className="list">
        <div className="grid">
            <div></div>
            <div></div>
            <div>No</div>
            <div>1</div>
            <div>2</div>
            <div>3</div>
            <div>4</div>
            <div>5</div>
        </div>
        <div className="grid">
            <div>常勤</div>
            <div>氏名</div>
            <div>表記</div>
            <div>内勤</div>
            <div>公休</div>
            <div>有給</div>
            <div>山田</div>
        </div>
        <div className="grid">
            <div>1</div>
            <input 
            type="text"
            value={staff}
            onChange={inputName}
            placeholder="氏名を入力"
            required
            />
            <div>{staff}</div>
            <div>○</div>
            <div>○</div>
            <div>○</div>
            <div>○</div>
        </div>
    </div>
    </div>
)
};

export default App;
