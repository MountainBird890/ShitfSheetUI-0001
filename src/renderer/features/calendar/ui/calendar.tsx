// 今日は編集した内容がJsonファイルのデータを書き換えるロジックを作る


import type { BadgeProps, CalendarProps } from 'antd';
import { Badge, Calendar, Input } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import 'dayjs/locale/ja';
import jaJP from 'antd/es/calendar/locale/ja_JP';
import baseData from '../../../../backend/data/users/base.json';
import type { StaffWork } from '../../../../backend/data/basetype';
import { handleSearch, HandleScheduleEditor, useEditor } from '../state/useCalendar';
import ScheduleEditModal from './editer';

dayjs.locale('ja');

// カレンダー本体（Context内で使う）
const CalendarInner: React.FC = () => {
  const data = baseData.basedata as StaffWork[];
  const { search, setSearch } = handleSearch();
  const { openEditor } = useEditor(); // ← ContextからopenEditorを取得

  const getListData = (value: Dayjs) => {
    const targetDate = value.format('YYYY-MM-DD');
    return data.flatMap((staff) =>
      staff.schedule
        .filter((s) => s.date === targetDate)
        .map((s) => ({
          type: s.type,
          content: staff.name,
          staffId: staff.staffId,
          dateKey: targetDate,
          staffRecord: staff, // StaffRecordをそのまま渡す
        }))
    ).filter((item) =>
      !search || item.content.includes(search)
    );
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li
            key={`${item.staffId}-${item.dateKey}`}
            onClick={() => openEditor(item.staffRecord, item.dateKey)} // ← staffとdateKeyを渡す
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

  return (
    <>
      <Input.Search
        placeholder="ここで検索"
        variant="filled"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onSearch={(q) => setSearch(q)}
      />
      <Calendar cellRender={cellRender} locale={jaJP} />
      {/* Modalはここに置かない。ScheduleEditModal自身がModalを持つ */}
      <ScheduleEditModal />
    </>
  );
};

const CalendarUI: React.FC = () => (
  <HandleScheduleEditor>
    <CalendarInner />
  </HandleScheduleEditor>
);

export default CalendarUI;