import { ExpandOutlined } from '@ant-design/icons';
import { getWidgetDef, type WidgetId } from '../../lib/dashboardWidgets';
import type { DashboardWidgetCtx } from './dashboardWidgetTypes';
import DashboardWidgetContent from './DashboardWidgetContent';

interface Props {
  order: WidgetId[];
  widgetCtx: DashboardWidgetCtx;
  onExpand: () => void;
}

export default function DashboardTray({ order, widgetCtx, onExpand }: Props) {
  return (
    <div className="cp-dock-anchor">
      <div className="cp-dock-wrap">
        <aside className="cp-stage cp-dock" aria-label="Control panel (collapsed)">
          <header className="cp-dock-head">
            <div>
              <h2>Control panel</h2>
              <p>{order.length} controls · tap Customize to rearrange</p>
            </div>
            <button type="button" className="cp-btn cp-btn-primary" onClick={onExpand}>
              <ExpandOutlined />
              <span>Expand</span>
            </button>
          </header>

          <div className="cp-dock-grid">
            {order.map((id) => {
              const def = getWidgetDef(id);
              return (
                <div key={id} className={`cp-dock-tile cp-dock-tile-${def.size}`}>
                  <DashboardWidgetContent id={id} variant="compact" ctx={widgetCtx} />
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
