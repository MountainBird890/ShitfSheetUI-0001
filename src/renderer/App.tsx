import SideBar from "./features/setSideBar";
import Shift from "./features/list/pages/layout";
import Schedule from "./features/schedule/pages/SchedulePage";
import KimuKeitai from "./features/Kinmu/pages/kinmupage";
import Calendar from "./features/calendar/pages/calendarpage";
import UserShift from "./features/shift/ui/usershift";
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App(){
    return(
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<SideBar />}>
            <Route path="/shift" element={<Shift />}/>
            <Route path="/schedule" element={<Schedule />}/>
            <Route path="/calendar" element={<Calendar />}/>
            <Route path="/kinmu" element={<KimuKeitai />}/>
            <Route path="/usershift" element={<UserShift />}/>
            </Route>
        </Routes>
        </BrowserRouter>
    );
};
