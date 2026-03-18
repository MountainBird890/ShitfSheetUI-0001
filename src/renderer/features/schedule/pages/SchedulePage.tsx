import UserColumn from "../ui/tableUserColumns";
import Date from "../ui/dateSchedule";
import ToggleSchedule from "../ui/switchSchedules";

export default function Schedule(){
    return(
    <>
    <Date />
    <ToggleSchedule />
    <UserColumn />
    </>
)
}