import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import SideBar from "./features/setSideBar";
import Shift from "./features/list/pages/layout";
import Schedule from "./features/schedule/pages/SchedulePage";
import KimuKeitai from "./features/Kinmu/pages/kinmupage";
import Calendar from "./features/calendar/pages/calendarpage";
import { Sheet } from "./features/shift/pages/shiftpage";
import TitleBar from './components/TitleBar';

function Layout() {
  return (
    <div>
      <TitleBar />
      <div style={{ display: 'flex' }}>
        <SideBar />
      </div>
    </div>
  );
}

export default function App(){
  return(
    <div style={{paddingTop: 36}}>
    <HashRouter>
      <Routes>
        <Route path='/' element={<Layout />}>
          <Route path="/shift" element={<Shift />}/>
          <Route path="/schedule" element={<Schedule />}/>
          <Route path="/calendar" element={<Calendar />}/>
          <Route path="/kinmu" element={<KimuKeitai />}/>
          <Route path="/sheet" element={<Sheet />}/>
        </Route>
      </Routes>
    </HashRouter>
    </div>
  );
}