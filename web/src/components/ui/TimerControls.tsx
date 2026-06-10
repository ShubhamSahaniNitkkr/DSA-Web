import { Button } from 'antd';
import { PlayCircleFilled, PauseCircleFilled } from '@ant-design/icons';

interface Props {
  running: boolean;
  onPlay: () => void;
  onStop: () => void;
  onReset?: () => void;
}

const BTN_SIZE = 'large' as const;

export default function TimerControls({ running, onPlay, onStop, onReset }: Props) {
  return (
    <div className="timer-controls">
      {!running ? (
        <Button
          type="primary"
          size={BTN_SIZE}
          icon={<PlayCircleFilled />}
          onClick={onPlay}
          className="timer-btn timer-btn-play"
        >
          Play
        </Button>
      ) : (
        <Button
          danger
          type="primary"
          size={BTN_SIZE}
          icon={<PauseCircleFilled />}
          onClick={onStop}
          className="timer-btn timer-btn-stop"
        >
          Stop
        </Button>
      )}
      {onReset && (
        <Button size={BTN_SIZE} onClick={onReset} className="timer-btn timer-btn-reset">
          Reset
        </Button>
      )}
    </div>
  );
}
