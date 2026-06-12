import { PlusOutlined, CompressOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { getWidgetDef, type WidgetId } from '../../lib/dashboardWidgets';
import type { useDashboardLayout } from '../../hooks/useDashboardLayout';
import type { DashboardWidgetCtx } from './dashboardWidgetTypes';
import AddWidgetModal from './AddWidgetModal';
import DashboardWidgetContent from './DashboardWidgetContent';
import DashboardWidgetFrame from './DashboardWidgetFrame';

type Layout = ReturnType<typeof useDashboardLayout>;

interface Props {
  layout: Layout;
  widgetCtx: DashboardWidgetCtx;
  onCollapse: () => void;
}

export default function DashboardControlPanel({ layout, widgetCtx, onCollapse }: Props) {
  const {
    order, editMode, setEditMode, addOpen, setAddOpen, available,
    dragId, remove, add, onDragStart, onDragEnd, onDropOn,
  } = layout;
  const [dragOverId, setDragOverId] = useState<WidgetId | null>(null);

  return (
    <div className="cp-stage">
    <div className="cp-shell">
      <header className="cp-toolbar">
        <div className="cp-toolbar-title">
          <h2>Control panel</h2>
          <p>Customize layout, reorder controls, or collapse to compact view.</p>
        </div>
        <div className="cp-toolbar-actions">
          <button
            type="button"
            className={`cp-btn${editMode ? ' cp-btn-active' : ''}`}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Done' : 'Customize'}
          </button>
          <button type="button" className="cp-btn cp-btn-ghost" onClick={onCollapse}>
            <CompressOutlined />
            <span>Collapse</span>
          </button>
        </div>
      </header>

      {editMode && (
        <p className="cp-edit-hint">Drag to reorder. Tap − to remove. Use + to add a control.</p>
      )}

      <div className={`cp-grid${editMode ? ' is-editing' : ''}`}>
        {order.map((id) => {
          const def = getWidgetDef(id);
          return (
            <DashboardWidgetFrame
              key={id}
              id={id}
              size={def.size}
              variant="full"
              editMode={editMode}
              dragging={dragId === id}
              dragOver={dragOverId === id && dragId !== id}
              onRemove={() => remove(id)}
              onDragStart={() => onDragStart(id)}
              onDragEnd={() => { onDragEnd(); setDragOverId(null); }}
              onDragOver={() => setDragOverId(id)}
              onDrop={() => { onDropOn(id); setDragOverId(null); }}
            >
              <DashboardWidgetContent id={id} variant="full" ctx={widgetCtx} />
            </DashboardWidgetFrame>
          );
        })}

        {editMode && (
          <button
            type="button"
            className="cp-widget cp-widget-add"
            onClick={() => setAddOpen(true)}
            aria-label="Add control"
          >
            <PlusOutlined />
            <span>Add control</span>
          </button>
        )}
      </div>

      <AddWidgetModal
        open={addOpen}
        available={available}
        onClose={() => setAddOpen(false)}
        onAdd={add}
      />
    </div>
    </div>
  );
}
