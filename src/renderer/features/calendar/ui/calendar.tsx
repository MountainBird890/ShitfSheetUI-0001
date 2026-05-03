import { useState, useEffect } from 'react';
import type { BadgeProps, CalendarProps } from 'antd';
import { Badge, Calendar, Select, Space, Spin } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import 'dayjs/locale/ja';
import jaJP from 'antd/es/calendar/locale/ja_JP';
import type { StaffWork } from '../../../../backend/data/basetype';
import { handleSearch, HandleScheduleEditor, useEditor } from '../state/useCalendar';
import ScheduleEditModal from './editer';
import { DownloadButton } from './downloadCSV';
import { DlState } from '../state/useCalendar';
import AddNewPlanModal from './addNewPlan';
import CopyScheduleModal from './copySchedule';
import { apiUrl } from '../../../../lib/api';

dayjs.locale('ja');

const CalendarInner: React.FC = () => {
  // ★ 静的importをやめてstateで管理
  const [data, setData] = useState<StaffWork[]>([]);
  const [loading, setLoading] = useState(false);
  const { search, setSearch } = handleSearch();
  const { openEditor } = useEditor();
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  // ★ データをAPIから取得
  const fetchData = () => {
    setLoading(true);
    fetch(apiUrl('/api/staff'))
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('fetch失敗:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const staffOptions = data.map((staff) => ({
    value: staff.staffId,
    label: staff.name,
  }));

  const getListData = (value: Dayjs) => {
    const targetDate = value.format('YYYY-MM-DD');
    return data.flatMap((staff) => {
      const detail = staff.details?.[targetDate];
      if (!detail) return [];
      return [{
        content: staff.name,
        staffId: staff.staffId,
        dateKey: targetDate,
        staffRecord: staff,
      }];
    }).filter((item) => !search || item.staffId === search);
  };

  // ★ 現在月でフィルタ（CSV問題の修正）
  const visibleData = data.flatMap((staff) =>
    Object.entries(staff.details ?? {})
      .filter(([date]) => dayjs(date).isSame(currentMonth, 'month'))
      .map(([date, detail]) => ({
        staffId: staff.staffId,
        name: staff.name,
        user: detail.user ?? '',
        date,
        start: detail.start ? dayjs(detail.start).format('HH:mm') : '',
        end: detail.end ? dayjs(detail.end).format('HH:mm') : '',
        type: detail.type ?? '',
      }))
  ).filter((item) => !search || item.staffId === search);

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li
            key={`${item.staffId}-${item.dateKey}`}
            onClick={() => openEditor(item.staffRecord, item.dateKey)}
            style={{ cursor: 'pointer' }}
          >
            <Badge status='processing' text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    return info.originNode;
  };

  // ★ 保存後にfetchDataを呼ぶ（location.reloadをやめる）
  const handleSuccess = () => fetchData();

  return (
    <Spin spinning={loading}>
      <Space style={{ marginBottom: 8 }}>
        <Select
          showSearch
          allowClear
          placeholder="職員を選択"
          variant="filled"
          value={search || undefined}
          options={staffOptions}
          onChange={(value) => setSearch(value ?? '')}
          filterOption={(input, option) =>
            (option?.label ?? '').includes(input)
          }
          style={{ width: 200 }}
        />
        <AddNewPlanModal staffOptions={staffOptions} onSuccess={handleSuccess} />
        <CopyScheduleModal
          currentYear={currentMonth.year()}
          currentMonth={currentMonth.month() + 1}
          onSuccess={handleSuccess}
        />
      </Space>

      <DlState>
        <DownloadButton data={visibleData} />
      </DlState>
      <Calendar
        cellRender={cellRender}
        locale={jaJP}
        onPanelChange={(val) => setCurrentMonth(val)}
      />
      <ScheduleEditModal />
    </Spin>
  );
};

const CalendarUI: React.FC = () => (
  <HandleScheduleEditor>
    <CalendarInner />
  </HandleScheduleEditor>
);

export default CalendarUI;