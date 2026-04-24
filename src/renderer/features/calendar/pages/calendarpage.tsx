import CalendarUI from "../ui/calendar";
import { HandleEditor, LoadingState, SearchState} from "../state/useCalendar";

export default function Calendar(){
    console.log("calendarapage.tsx is correct")
    return(
        <>
        <LoadingState>
            <HandleEditor>
                <SearchState>
                    <CalendarUI />
                </SearchState>
            </HandleEditor>
        </LoadingState>
        </>
    )
}