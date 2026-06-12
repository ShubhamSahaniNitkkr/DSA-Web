import { Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { WidgetDef } from '../../lib/dashboardWidgets';

interface Props {
  open: boolean;
  available: WidgetDef[];
  onClose: () => void;
  onAdd: (id: WidgetDef['id']) => void;
}

export default function AddWidgetModal({ open, available, onClose, onAdd }: Props) {
  return (
    <Modal
      title="Add control"
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      className="dash-add-widget-modal"
      destroyOnClose
    >
      {available.length === 0 ? (
        <p className="dash-add-empty">All controls are already on your panel.</p>
      ) : (
        <ul className="dash-add-list">
          {available.map((w) => (
            <li key={w.id}>
              <button type="button" className="dash-add-item" onClick={() => onAdd(w.id)}>
                <span className="dash-add-item-copy">
                  <strong>{w.title}</strong>
                  <span>{w.description}</span>
                </span>
                <PlusOutlined />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
