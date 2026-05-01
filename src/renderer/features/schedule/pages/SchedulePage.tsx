import { HandleSchedule } from '../state/useSchedule';
import DateSchedule from '../ui/dateSchedule';
import ToggleSchedule from '../ui/switchSchedules';
import DownloadButton from '../ui/downloadButton';

export default function Schedule() {

  return (
    <HandleSchedule>
      <DateSchedule />
      <DownloadButton />
      <ToggleSchedule />
    </HandleSchedule>
  );
}