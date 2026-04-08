import React from 'react';
import type { BadgeProps, CalendarProps } from 'antd';
import { Badge, Calendar } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import 'dayjs/locale/ja';
import jaJP from 'antd/es/calendar/locale/ja_JP';

dayjs.locale('ja');

const getListData = (value: Dayjs) => {
  let listData: { type: string; content: string }[] = []; // Specify the type of listData
  switch (value.date()) {
    case 8:
      listData = [
        { type: 'warning', content: 'これは鈴木さんの予定表です。' },
        { type: 'success', content: 'これは鈴木さんの予定表です。' },
      ];
      break;
    case 10:
      listData = [
        { type: 'warning', content: 'これは鈴木さんの予定表です。' },
        { type: 'success', content: 'これは鈴木さんの予定表です。' },
        { type: 'error', content: 'これは鈴木さんの予定表です。' },
      ];
      break;
    case 15:
      listData = [
        { type: 'warning', content: 'これは鈴木さんの予定表です。' },
        { type: 'success', content: 'これは鈴木さんの予定表です。' },
        { type: 'error', content: 'これは鈴木さんの予定表です。' },
        { type: 'error', content: 'これは鈴木さんの予定表です。' },
        { type: 'error', content: 'これは鈴木さんの予定表です。' },
        { type: 'error', content: 'これは鈴木さんの予定表です。' },
      ];
      break;
    default:
  }
  return listData || [];
};

const getMonthData = (value: Dayjs) => {
  if (value.month() === 8) {
    return 1394;
  }
};

const UserShift: React.FC = () => {
  const monthCellRender = (value: Dayjs) => {
    const num = getMonthData(value);
    return num ? (
      <div className="notes-month">
        <section>{num}</section>
        <span>Backlog number</span>
      </div>
    ) : null;
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li key={item.content}>
            <Badge status={item.type as BadgeProps['status']} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') {
      return dateCellRender(current);
    }
    if (info.type === 'month') {
      return monthCellRender(current);
    }
    return info.originNode;
  };

  return <Calendar cellRender={cellRender} locale={jaJP} />;
};

export default UserShift;