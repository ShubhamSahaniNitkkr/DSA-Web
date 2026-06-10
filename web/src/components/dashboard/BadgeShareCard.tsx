import { useEffect, useRef, useState } from 'react';
import { Button, Upload, message, Select } from 'antd';
import { UploadOutlined, DownloadOutlined, LinkOutlined, CopyOutlined } from '@ant-design/icons';
import type { Badge } from '../../lib/api';
import { api } from '../../lib/api';
import {
  generateBadgeShareImage, downloadDataUrl, copyImageToClipboard, getShareText, getShareLink,
} from '../../lib/badgeShare';

interface Props {
  userName: string;
  earnedBadges: Badge[];
  badgeCatalog: Badge[];
  avatarData?: string;
  onAvatarSaved?: () => void;
  /** Inside modal — no outer card wrapper */
  embedded?: boolean;
}

export default function BadgeShareCard({
  userName, earnedBadges, badgeCatalog, avatarData, onAvatarSaved, embedded = false,
}: Props) {
  const [selectedId, setSelectedId] = useState(earnedBadges[0]?.id || badgeCatalog[0]?.id);
  const [photo, setPhoto] = useState(avatarData || '');
  const [preview, setPreview] = useState('');
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<string>('');

  const catalogMap = Object.fromEntries(badgeCatalog.map((b) => [b.id, b]));
  const selected = catalogMap[selectedId] || badgeCatalog[0];
  const hasEarned = earnedBadges.some((b) => b.id === selectedId);

  useEffect(() => {
    if (avatarData && !fileRef.current) setPhoto(avatarData);
  }, [avatarData]);

  useEffect(() => {
    if (!photo || !selected) { setPreview(''); return; }
    let cancelled = false;
    setGenerating(true);
    generateBadgeShareImage({ photoSrc: photo, userName, badge: selected })
      .then((url) => { if (!cancelled) setPreview(url); })
      .catch(() => { if (!cancelled) setPreview(''); })
      .finally(() => { if (!cancelled) setGenerating(false); });
    return () => { cancelled = true; };
  }, [photo, selectedId, userName, selected]);

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const data = reader.result as string;
      if (data.length > 500000) {
        message.error('Photo too large — use under 400KB');
        return;
      }
      fileRef.current = data;
      setPhoto(data);
      try {
        await api.updateAvatar(data);
        onAvatarSaved?.();
        message.success('Photo saved to profile');
      } catch (e: unknown) {
        message.error(e instanceof Error ? e.message : 'Upload failed');
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

  if (!badgeCatalog.length) return null;

  const inner = (
      <div className="badge-share-layout">
        <div className="badge-share-controls">
          <div className="badge-earned-row">
            {badgeCatalog.map((b) => {
              const earned = earnedBadges.some((e) => e.id === b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  className={`badge-pill ${selectedId === b.id ? 'active' : ''} ${earned ? 'earned' : 'locked'}`}
                  onClick={() => setSelectedId(b.id)}
                  title={earned ? b.desc : `Locked — ${b.desc}`}
                >
                  <span>{b.emoji || '🏆'}</span>
                  <small>{b.name}</small>
                </button>
              );
            })}
          </div>

          <Select
            value={selectedId}
            onChange={setSelectedId}
            style={{ width: '100%', marginBottom: 12 }}
            options={badgeCatalog.map((b) => ({
              value: b.id,
              label: `${b.emoji || ''} ${b.name}${earnedBadges.some((e) => e.id === b.id) ? '' : ' 🔒'}`,
            }))}
          />

          <Upload showUploadList={false} beforeUpload={handleUpload} accept="image/*">
            <Button block icon={<UploadOutlined />}>📷 Upload your photo</Button>
          </Upload>

          {!hasEarned && (
            <p className="badge-lock-hint">🔒 Earn this badge by solving more problems — preview still works!</p>
          )}

          <div className="badge-share-actions">
            <Button
              type="primary"
              block
              icon={<DownloadOutlined />}
              disabled={!preview || generating}
              onClick={() => preview && downloadDataUrl(preview, `sheetstack-${selectedId}.png`)}
            >
              ⬇️ Download image
            </Button>
            <Button
              block
              icon={<CopyOutlined />}
              disabled={!preview}
              onClick={async () => {
                if (!preview || !selected) return;
                try {
                  await copyImageToClipboard(preview);
                  message.success('Image copied! Paste in Instagram, WhatsApp, etc.');
                } catch {
                  message.info('Copy not supported — use Download instead');
                }
              }}
            >
              📋 Copy image
            </Button>
            <Button
              block
              icon={<LinkOutlined />}
              onClick={async () => {
                if (!selected) return;
                const text = `${getShareText(userName, selected)}\n${getShareLink()}`;
                await navigator.clipboard.writeText(text);
                message.success('Share text + link copied!');
              }}
            >
              🔗 Copy share link
            </Button>
          </div>
        </div>

        <div className="badge-share-preview">
          {generating && <div className="badge-preview-loading">Generating…</div>}
          {!photo && (
            <div className="badge-preview-empty">
              <span>📷</span>
              <p>Upload a photo to preview your badge card</p>
            </div>
          )}
          {photo && preview && !generating && (
            <img src={preview} alt="Badge share preview" className="badge-preview-img" />
          )}
        </div>
      </div>
  );

  if (embedded) {
    return (
      <div className="badge-share-embedded">
        <p className="card-desc">Upload your photo, pick a badge, then download or share</p>
        {inner}
      </div>
    );
  }

  return (
    <div className="glass-card card-badge-share">
      <div className="card-head"><span className="card-emoji">🏅</span><h3>Badges & Share</h3></div>
      <p className="card-desc">Upload your photo, pick a badge, download or share on social media</p>
      {inner}
    </div>
  );
}
