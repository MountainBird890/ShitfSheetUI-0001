import Date from "../ui/dateSchedule";
import ToggleSchedule from "../ui/switchSchedules";
import App from "../ui/downloadButton";
import UserColumn from "../ui/tableUserColumns";
import dayjs from "dayjs";

export default function Schedule(){
  return(
    <>
      <Date />
      <ToggleSchedule />
      <App />
      <UserColumn value={dayjs()} />
    </>
  )
}