import dayjs from "dayjs"
import data from '../../../../backend/data/users/base.json'
import type { StaffWork } from "../../../../backend/data/basetype";
import { OpenCard, HandleCard } from "../state/useShift";
import { Dayjs } from "dayjs";
import { Badge, Calendar, type BadgeProps, type CalendarProps } from "antd";
import jaJP from 'antd/es/calendar/locale/ja_JP';

dayjs.locale('ja');

const StaffCalendar: React.FC = () => {
    const useData = data.basedata as unknown as StaffWork[];
    const { openCard } = OpenCard();

      const getListData = (value: Dayjs) => {
        const targetDate = value.format('YYYY-MM-DD');
        return useData.flatMap((staff) =>
          staff.schedule
            .filter((s) => s.date === targetDate)
            .map((s) => ({
              type: s.type,
              content: staff.name,
              staffId: staff.staffId,
              dateKey: targetDate,
              staffRecord: staff, // StaffRecordをそのまま渡す
            }))
        )}
    
      const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li
            key={`${item.staffId}-${item.dateKey}`}
            onClick={() => openCard(item.staffRecord, item.dateKey)} // ← staffとdateKeyを渡す
            style={{ cursor: 'pointer' }}
          >
            <Badge
              status={item.type as BadgeProps['status']}
              text={item.content}
            />
          </li>
        ))}
      </ul>
    );
  };

    const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
      if (info.type === 'date') return dateCellRender(current);
      return info.originNode;
    };
    return(
        <Calendar cellRender={cellRender} locale={jaJP} />
    )
};

const StaffSheetCalendar: React.FC = () => {
  return(
  <HandleCard>
    <StaffCalendar />
  </HandleCard>
  )
}

export default StaffSheetCalendar;