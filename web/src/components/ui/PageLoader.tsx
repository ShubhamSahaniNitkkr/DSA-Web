import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface Props {
  label?: string;
  fullPage?: boolean;
}

export default function PageLoader({ label = 'Loading...', fullPage }: Props) {
  return (
    <div className={`page-loader ${fullPage ? 'page-loader-full' : ''}`} role="status" aria-live="polite">
      <div className="page-loader-inner">
        <Spin indicator={<LoadingOutlined className="page-loader-spin" spin />} size="large" />
        <p className="page-loader-label">{label}</p>
        {fullPage && <span className="page-loader-sub">Please wait…</span>}
      </div>
    </div>
  );
}
