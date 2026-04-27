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
import { DownloadButton } from './downloadCSV';
import { DlState } from '../state/useCalendar';

dayjs.locale('ja');

// カレンダー本体（Context内で使う）
const CalendarInner: React.FC = () => {
  const data = baseData.basedata as unknown as StaffWork[];
  const { search, setSearch } = handleSearch();
  const { openEditor } = useEditor(); // ← ContextからopenEditorを取得

const getListData = (value: Dayjs) => {
  const targetDate = value.format('YYYY-MM-DD');

  return data.flatMap((staff) => {
    const detail = staff.details?.[targetDate];
    if (!detail) return [];

    // details には type がないので、表示上の badge タイプを決める
    // ここでは固定で "success" にするか、必要なら別ロジックで判定
    return [{
      content: staff.name,
      staffId: staff.staffId,
      dateKey: targetDate,
      staffRecord: staff,
    }];
  }).filter((item) =>
    !search || item.content.includes(search)
  );
};

  const visibleData = data.flatMap((staff) =>
  Object.entries(staff.details ?? {}).map(([date, detail]) => ({
    staffId: staff.staffId,
    name: staff.name,
    date,
    type: detail.type,
  }))
).filter((item) =>
  !search || item.name.includes(search)
)

console.log('visibleData:', visibleData)

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
            <Badge status='processing' text={`${item.content}`} />
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
      <DlState>
        <DownloadButton data={visibleData} />
      </DlState>
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