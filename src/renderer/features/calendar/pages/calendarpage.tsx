import CalendarUI from "../ui/calendar";
import ScheduleEditModal from "../ui/editer";
import { HandleEditor, LoadingState, SearchState } from "../state/useCalendar";

export default function Calendar(){
    console.log("calendarapage.tsx is correct")
    return(
        <LoadingState>
            <HandleEditor>
                <SearchState>
                    <CalendarUI />
                    <ScheduleEditModal />
                </SearchState>
            </HandleEditor>
        </LoadingState>
    
    )
}