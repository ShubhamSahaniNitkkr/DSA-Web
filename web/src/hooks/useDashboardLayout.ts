import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_WIDGET_ORDER,
  LAYOUT_STORAGE_KEY,
  WIDGET_CATALOG,
  type WidgetId,
} from '../lib/dashboardWidgets';

function loadOrder(): WidgetId[] {
  if (typeof window === 'undefined') return [...DEFAULT_WIDGET_ORDER];
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return [...DEFAULT_WIDGET_ORDER];
    const parsed = JSON.parse(raw) as WidgetId[];
    const valid = new Set(WIDGET_CATALOG.map((w) => w.id));
    const cleaned = parsed.filter((id) => valid.has(id));
    return cleaned.length ? cleaned : [...DEFAULT_WIDGET_ORDER];
  } catch {
    return [...DEFAULT_WIDGET_ORDER];
  }
}

export function useDashboardLayout() {
  const [order, setOrder] = useState<WidgetId[]>(loadOrder);
  const [editMode, setEditMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [dragId, setDragId] = useState<WidgetId | null>(null);

  useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(order));
  }, [order]);

  const available = WIDGET_CATALOG.filter((w) => !order.includes(w.id));

  const reorder = useCallback((from: WidgetId, to: WidgetId) => {
    if (from === to) return;
    setOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(from);
      const toIdx = next.indexOf(to);
      if (fromIdx < 0 || toIdx < 0) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, from);
      return next;
    });
  }, []);

  const remove = useCallback((id: WidgetId) => {
    setOrder((prev) => (prev.length <= 1 ? prev : prev.filter((w) => w !== id)));
  }, []);

  const add = useCallback((id: WidgetId) => {
    setOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setAddOpen(false);
  }, []);

  const reset = useCallback(() => {
    setOrder([...DEFAULT_WIDGET_ORDER]);
  }, []);

  const onDragStart = useCallback((id: WidgetId) => setDragId(id), []);
  const onDragEnd = useCallback(() => setDragId(null), []);

  const onDropOn = useCallback((targetId: WidgetId) => {
    if (dragId) reorder(dragId, targetId);
    setDragId(null);
  }, [dragId, reorder]);

  return {
    order,
    editMode,
    setEditMode,
    addOpen,
    setAddOpen,
    available,
    dragId,
    reorder,
    remove,
    add,
    reset,
    onDragStart,
    onDragEnd,
    onDropOn,
  };
}
