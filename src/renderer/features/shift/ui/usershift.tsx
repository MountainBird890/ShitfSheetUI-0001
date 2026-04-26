import React from 'react';
import type { BadgeProps, CalendarProps } from 'antd';
import { Badge, Calendar, Table } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { title } from 'process';
import data from '../../../../backend/data/users/base.json';

// ここをExcelの勤怠表に合わせて修正
export default function DaysColumns(value: Dayjs){
  const startDate = dayjs().startOf('week');

  const weekColumns: ColumnsType<any> = 
    [...Array(31)].flatMap((_, index) => {
      const day = startDate.add(index, 'day');
      const dateString = day.format('YYYY-MM-DD');

      return[
        {
        title: '介助者',
        dataIndex: ['details', dateString, 'user'],
        key: `${dateString}_name`,
        width: 100,
        render: (text:string) => text || '-',
      },{
        title: '開始',
        dataIndex: ['details', dateString, 'start'],
        key: `${dateString}_start`,
        width: 80,
        render: (text:string) => text ? dayjs(text).format('HH:mm') : '-',
      },{
        title: '終了',
        dataIndex: ['details', dateString, 'end'],
        key: `${dateString}_end`,
        width: 80,
        render: (text:string) => text ? dayjs(text).format('HH:mm') : '-',
      },{
        title: '種別',
        dataIndex: ['details', dateString, 'type'],
        key: `${dateString}_type`,
        width: 100,
        render: (text:string) => text || '-',
      }
    ]
    })

  return(
    <Table
    columns={weekColumns}
    dataSource={data.basedata}
    bordered
    size='middle'
    scroll={{x: 'max-content', y:'min-content'}}
    />
  )
}