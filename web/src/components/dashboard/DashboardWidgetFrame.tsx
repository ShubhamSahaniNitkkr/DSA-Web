import { MinusOutlined, HolderOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { getWidgetDef, type WidgetId, type WidgetSize } from '../../lib/dashboardWidgets';

interface Props {
  id: WidgetId;
  size: WidgetSize;
  editMode: boolean;
  dragging: boolean;
  dragOver: boolean;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  variant: 'full' | 'compact';
  children: ReactNode;
}

export default function DashboardWidgetFrame({
  id, size, editMode, dragging, dragOver, onRemove,
  onDragStart, onDragEnd, onDragOver, onDrop, variant, children,
}: Props) {
  const def = getWidgetDef(id);
  const cls = [
    'cp-widget',
    `cp-widget-${size}`,
    `cp-widget-${variant}`,
    editMode ? 'is-editing' : '',
    dragging ? 'is-dragging' : '',
    dragOver ? 'is-drag-over' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      data-widget={id}
      draggable={editMode}
      onDragStart={(e) => {
        if (!editMode) return;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        if (!editMode) return;
        e.preventDefault();
        onDragOver(e);
      }}
      onDrop={(e) => {
        if (!editMode) return;
        e.preventDefault();
        onDrop();
      }}
    >
      {editMode && (
        <>
          <button
            type="button"
            className="cp-widget-remove"
            onClick={onRemove}
            aria-label={`Remove ${def.title}`}
          >
            <MinusOutlined />
          </button>
          <span className="cp-widget-handle" aria-hidden>
            <HolderOutlined />
          </span>
        </>
      )}
      {children}
    </div>
  );
}
