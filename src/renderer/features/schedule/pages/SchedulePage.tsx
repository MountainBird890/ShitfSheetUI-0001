import { HandleSchedule } from '../state/useSchedule';
import DateSchedule from '../ui/dateSchedule';
import ToggleSchedule from '../ui/switchSchedules';
import DownloadButton from '../ui/downloadButton';
import UserColumn from '../ui/tableUserColumns';

export default function Schedule() {

  return (
    <HandleSchedule>
      <DateSchedule />
      <ToggleSchedule />
      <DownloadButton />
      <UserColumn />
    </HandleSchedule>
  );
}