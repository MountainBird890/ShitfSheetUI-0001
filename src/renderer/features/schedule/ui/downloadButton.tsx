import React, { useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { Button, Radio } from 'antd';
import type { ConfigProviderProps } from 'antd';

type SizeType = ConfigProviderProps['componentSize'];

const App: React.FC = () => {
  const [size, setSize] = useState<SizeType>('large'); // default is 'medium'
  return (
    <>
    <Radio.Group value={size} onChange={(e) => setSize(e.target.value)}>
      </Radio.Group>
          <Button type="primary" icon={<DownloadOutlined />}>
            Download
          </Button>
    </>
  );
};

export default App;