import UserColumn from "../ui/tableUserColumns";
import Date from "../ui/dateSchedule";
import ToggleSchedule from "../ui/switchSchedules";
import App from "../ui/downloadButton";

export default function Schedule(){
    return(
    <>
    <Date />
    <ToggleSchedule />
    <App />
    <UserColumn />
    </>
)
}