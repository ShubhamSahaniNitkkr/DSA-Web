import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Button, Radio, Table, Tag, message, Spin, Row, Col } from 'antd';
import { WalletOutlined, ArrowUpOutlined, GiftOutlined } from '@ant-design/icons';
import { api, type WalletData } from '../../lib/api';
import DonezoShell from '../layout/DonezoShell';
import CoinCounter, { formatMoney } from '../ui/CoinCounter';
import { tintForIndex } from '../../lib/bentoTints';

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => api.getWallet().then(setWallet);
  useEffect(() => { load(); }, []);

  const onSubmit = async (v: { type: string; amount: number; upiId?: string }) => {
    setLoading(true);
    try {
      const res = await api.requestWithdrawal(v);
      message.success(res.message);
      load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Failed');
    } finally { setLoading(false); }
  };

  if (!wallet) {
    return <DonezoShell><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div></DonezoShell>;
  }

  const t = tintForIndex(0);

  return (
    <DonezoShell coins={wallet.coins}>
      <div className="dz-page-head">
        <div>
          <h1><WalletOutlined /> Wallet</h1>
          <p>Earn by solving · withdraw via UPI · 1 coin = 10 paise</p>
        </div>
      </div>

      <div className="wallet-bento">
        <div className="glass-card wallet-balance" style={{ background: t.bg, borderColor: t.border }}>
          <span className="cell-title">Total Balance</span>
          <CoinCounter coins={wallet.coins} size="lg" clickable={false} />
          <div className="wallet-rupees">= {formatMoney(wallet.coins)}</div>
          <p className="wallet-hint">5 coins per problem solved · 2 per quiz</p>
        </div>

        <div className="glass-card">
          <span className="cell-title"><ArrowUpOutlined /> Withdraw</span>
          <Form layout="vertical" onFinish={onSubmit} initialValues={{ type: 'withdraw' }} size="middle">
            <Form.Item name="type">
              <Radio.Group>
                <Radio value="withdraw">UPI Withdraw</Radio>
                <Radio value="donate">Donate</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="amount" label="Coins" rules={[{ required: true }]}>
              <InputNumber min={1} max={wallet.coins} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => getFieldValue('type') === 'withdraw' && (
                <Form.Item name="upiId" label="UPI ID" rules={[{ required: true }]} initialValue={wallet.upiId}>
                  <Input placeholder="name@upi" />
                </Form.Item>
              )}
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>Submit</Button>
          </Form>
        </div>

        <div className="glass-card">
          <span className="cell-title"><GiftOutlined /> Quick info</span>
          <ul className="wallet-info-list">
            <li><strong>1 coin</strong> = ₹0.10 (10 paise)</li>
            <li><strong>5 coins</strong> per problem marked solved</li>
            <li>Min withdrawal: 1 coin</li>
            <li>UPI: {wallet.upiId || 'Add when withdrawing'}</li>
          </ul>
        </div>

        <div className="glass-card bento-full">
          <span className="cell-title">Transaction History</span>
          <Table
            size="small"
            pagination={{ pageSize: 8 }}
            dataSource={wallet.withdrawals}
            rowKey={(r) => `${r.createdAt}-${r.amount}`}
            columns={[
              { title: 'Type', dataIndex: 'type', render: (t: string) => <Tag color={t === 'donate' ? 'green' : 'blue'}>{t}</Tag> },
              { title: 'Coins', dataIndex: 'amount' },
              { title: 'Value', dataIndex: 'amount', render: (a: number) => formatMoney(a) },
              { title: 'Status', dataIndex: 'status', render: (s: string) => <span className={`dz-badge ${s === 'completed' ? 'done' : 'progress'}`}>{s}</span> },
              { title: 'Date', dataIndex: 'createdAt', render: (d: string) => new Date(d).toLocaleDateString() },
            ]}
          />
        </div>
      </div>
    </DonezoShell>
  );
}
