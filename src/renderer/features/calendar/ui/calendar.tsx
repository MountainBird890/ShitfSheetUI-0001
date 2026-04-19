import type { BadgeProps, CalendarProps } from 'antd';
import { Badge, Calendar, Modal, Input } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import 'dayjs/locale/ja';
import jaJP from 'antd/es/calendar/locale/ja_JP';
import baseData from '../../../../backend/data/users/base.json';
import type { StaffWork } from '../../../../backend/data/basetype';
import InputUI from './input';
import { handleInput, handleSearch } from '../state/useCalendar';




// dayjsのデフォルトロケールを日本語に設定
dayjs.locale('ja');



const CalendarUI: React.FC = () => {
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
  ).filter((item) => 
    !search || item.content.includes(search)
  )
};


  console.log("CalendarUI(calendar.tsx) is correct")
  const { search, setSearch } = handleSearch(); // 型をつくるsearchContextTypeで
  const { open , setOpen } = handleInput();
  
  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li key={`${item.staffId}-${item.content}`} onClick={() => setOpen(true)}>
            <Badge
              status={item.type as BadgeProps['status']}
              text={
                <span onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
                  {item.content}
                </span>
              }
            />
            <Modal />
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
    <> // 検索欄入力中にカレンダーが白紙になるバグあり
      <Input.Search
      placeholder='ここで検索'
      variant='filled'
      value={search}
      onChange={
        (e) => setSearch(e.target.value)
      }
      onSearch={
        (q) => setSearch(q)
      }
      />
      <Calendar cellRender={cellRender} locale={jaJP} />
      <Modal open={open} onCancel={() => setOpen(false)} footer={null}>
        <InputUI />
      </Modal>
      
    </>

  )
};

export default CalendarUI;