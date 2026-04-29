import SideBar from "./features/setSideBar";
import Shift from "./features/list/pages/layout";
import Schedule from "./features/schedule/pages/SchedulePage";
import KimuKeitai from "./features/Kinmu/pages/kinmupage";
import Calendar from "./features/calendar/pages/calendarpage";
import { Sheet } from "./features/shift/pages/shiftpage";
import { HashRouter as Routes, Route } from 'react-router-dom';

export default function App(){
    return(
        <Routes>
            <Route path="/" element={<SideBar />}>
            <Route path="/shift" element={<Shift />}/>
            <Route path="/schedule" element={<Schedule />}/>
            <Route path="/calendar" element={<Calendar />}/>
            <Route path="/kinmu" element={<KimuKeitai />}/>
            <Route path="/sheet" element={<Sheet />}/>
            </Route>
        </Routes>
    );
};
