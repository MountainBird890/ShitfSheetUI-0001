import SideBar from "./features/setSideBar";
import Shift from "./features/shift/pages/layout";
import Schedule from "./features/schedule/pages/SchedulePage";
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App(){
    return(
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<SideBar />}>
            <Route path="/shift" element={<Shift />}/>
            <Route path="schedule" element={<Schedule />}/>
            </Route>
        </Routes>
        </BrowserRouter>
    );
};
