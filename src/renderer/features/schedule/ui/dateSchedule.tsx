import { DatePicker } from 'antd';
import locale from 'antd/es/date-picker/locale/ja_JP';
import { useSchedule } from '../state/useSchedule';

export default function DateSchedule() {
  const { currentMonth, setCurrentMonth } = useSchedule();

  return (
    <DatePicker
      picker="month"
      locale={locale}
      value={currentMonth}
      onChange={(val) => { if (val) setCurrentMonth(val) }}
      format="YYYY年M月"
      allowClear={false}
    />
  );
}