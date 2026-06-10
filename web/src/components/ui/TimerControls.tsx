import { Button } from 'antd';
import { PlayCircleFilled, PauseCircleFilled } from '@ant-design/icons';

interface Props {
  running: boolean;
  onPlay: () => void;
  onStop: () => void;
  onReset?: () => void;
}

export default function TimerControls({ running, onPlay, onStop, onReset }: Props) {
  return (
    <div className="timer-controls">
      {!running ? (
        <Button
          type="primary"
          className="dash-btn dash-btn-primary timer-btn timer-btn-play"
          icon={<PlayCircleFilled />}
          onClick={onPlay}
        >
          Play
        </Button>
      ) : (
        <Button
          danger
          type="primary"
          icon={<PauseCircleFilled />}
          onClick={onStop}
          className="dash-btn dash-btn-danger timer-btn timer-btn-stop"
        >
          Stop
        </Button>
      )}
      {onReset && (
        <Button onClick={onReset} className="dash-btn dash-btn-ghost timer-btn timer-btn-reset">
          Reset
        </Button>
      )}
    </div>
  );
}
