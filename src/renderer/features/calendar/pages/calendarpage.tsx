import CalendarUI from "../ui/calendar";
import InputUI from "../ui/input";
import { HandleEditor, LoadingState } from "../state/useCalendar";

export default function Calendar(){
    console.log("calendarapage.tsx is correct")
    return(
        <LoadingState>
            <HandleEditor>
                <CalendarUI />
                </HandleEditor>
        </LoadingState>
    
    )
}