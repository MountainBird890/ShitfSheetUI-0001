import React from 'react';
import type { BadgeProps, CalendarProps } from 'antd';
import { Badge, Calendar } from 'antd';
import type { Dayjs } from 'dayjs';
import baseData from '../../../../backend/data/users/base.json';
import type { StaffWork } from '../../../../backend/data/basetype';

const data = baseData.basedata as StaffWork[];

const getListData = (value: Dayjs) => {
  const targetDate = value.format('YYYY-MM-DD');

  return data.flatMap((staff) =>
    staff.schedule
      .filter((s) => s.date === targetDate)
      .map((s) => ({
        type: s.type,
        content: staff.name, 
        staffId: staff.staffId,
      }))
  );
};

const CalendarUI: React.FC = () => {
  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li key={`${item.staffId}-${item.content}`}>
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

  return <Calendar cellRender={cellRender} />;
};

export default CalendarUI;