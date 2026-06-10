import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Spin, message } from 'antd';
import { VideoCameraOutlined, RocketOutlined, UserAddOutlined } from '@ant-design/icons';
import { api, type CollabInviteInfo, type CollabInvitePreview } from '../../lib/api';
import { useAuth } from './AuthContext';
import DonezoShell from '../layout/DonezoShell';

export default function CollabAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [invite, setInvite] = useState<CollabInviteInfo | null>(null);
  const [preview, setPreview] = useState<CollabInvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [wrongAccount, setWrongAccount] = useState('');
  const autoAccepted = useRef(false);

  const joinSession = useCallback((meetLink: string, problemSlug: string) => {
    window.open(meetLink, '_blank', 'noopener,noreferrer');
    navigate(`/problem/${problemSlug}?collab=1`);
  }, [navigate]);

  const acceptAndJoin = useCallback(async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const result = await api.acceptCollab(token);
      message.success('Challenge accepted — joining Meet & problem');
      joinSession(result.meetLink, result.problemSlug);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Could not accept challenge');
    } finally {
      setAccepting(false);
    }
  }, [token, joinSession]);

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }
    if (authLoading) return;

    const load = async () => {
      setLoading(true);
      setError('');
      setWrongAccount('');
      try {
        if (!user) {
          const data = await api.previewCollabInvite(token);
          setPreview(data);
          setInvite(null);
        } else {
          try {
            const data = await api.getCollabInvite(token);
            setInvite(data);
            setPreview(null);
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Could not load invite';
            if (msg.includes('Sign in with')) {
              setWrongAccount(msg.replace('Sign in with ', '').replace(' to accept this challenge', ''));
              const data = await api.previewCollabInvite(token);
              setPreview(data);
            } else {
              throw e;
            }
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Could not load invite');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, user, authLoading]);

  useEffect(() => {
    if (!user || !invite || !token || autoAccepted.current) return;
    if (!invite.isInvitee || invite.status === 'accepted') return;
    autoAccepted.current = true;
    acceptAndJoin();
  }, [user, invite, token, acceptAndJoin]);

  const display = invite || preview;

  const goToSignup = () => {
    if (!token) return;
    const inviteeEmail = preview?.inviteeEmail || invite?.inviteeEmail || wrongAccount;
    if (!inviteeEmail) return;
    navigate('/login', {
      state: {
        from: { pathname: `/collab/accept/${token}` },
        collab: {
          token,
          inviteeEmail,
          challengerName: display?.challengerName || 'Someone',
          problemTitle: display?.problemTitle || 'a DSA problem',
        },
      },
    });
  };

  const handleRejoin = () => {
    if (!invite) return;
    joinSession(invite.meetLink, invite.problemSlug);
  };

  if (authLoading || loading) {
    return (
      <div className="collab-accept-page collab-accept-standalone">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !display) {
    return (
      <div className="collab-accept-page collab-accept-standalone">
        <div className="glass-card collab-accept-card">
          <h2>Invite unavailable</h2>
          <p>{error || 'This challenge link is invalid or has expired.'}</p>
          <Button type="primary" onClick={() => navigate(user ? '/' : '/login')}>
            {user ? 'Back to dashboard' : 'Sign in'}
          </Button>
        </div>
      </div>
    );
  }

  const alreadyAccepted = display.status === 'accepted';
  const needsSignup = !user && preview;
  const isChallengerView = invite?.isChallenger && !invite?.isInvitee;

  const body = (
    <div className="collab-accept-page collab-accept-standalone">
      <div className="glass-card collab-accept-card">
        <span className="collab-accept-emoji">🤝</span>
        <h2>
          {isChallengerView
            ? 'Your challenge is live'
            : `${display.challengerName} challenged you!`}
        </h2>
        <p className="collab-accept-desc">
          {needsSignup ? (
            <>
              <strong>{display.challengerName}</strong> wants to compete with you on{' '}
              <strong>{display.problemTitle}</strong>. Create a free account to accept and join the Meet.
            </>
          ) : isChallengerView ? (
            <>Waiting for <strong>{invite?.inviteeName || preview?.inviteeEmail}</strong> to accept on <strong>{display.problemTitle}</strong>.</>
          ) : (
            <>
              <strong>{display.challengerName}</strong> wants to compete with you and collaborate on{' '}
              <strong>{display.problemTitle}</strong>.
            </>
          )}
        </p>

        {wrongAccount && (
          <p className="collab-email-hint error collab-wrong-account">
            You&apos;re signed in as {user?.email}. Use <strong>{wrongAccount}</strong> for this challenge.
          </p>
        )}

        {invite?.meetLink && (
          <div className="collab-accept-meet">
            <VideoCameraOutlined />
            <a href={invite.meetLink} target="_blank" rel="noopener noreferrer">{invite.meetLink}</a>
          </div>
        )}

        <div className="collab-accept-actions">
          {needsSignup && (
            <Button type="primary" size="large" icon={<UserAddOutlined />} onClick={goToSignup}>
              Sign up or sign in to accept
            </Button>
          )}
          {wrongAccount && (
            <Button type="primary" size="large" onClick={() => { logout(); goToSignup(); }}>
              Switch account &amp; sign up
            </Button>
          )}
          {invite?.isInvitee && !alreadyAccepted && !accepting && (
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              loading={accepting}
              onClick={acceptAndJoin}
            >
              Accept Challenge
            </Button>
          )}
          {accepting && (
            <Button type="primary" size="large" loading>
              Joining session…
            </Button>
          )}
          {(alreadyAccepted || isChallengerView) && invite && (
            <Button type="primary" size="large" icon={<RocketOutlined />} onClick={handleRejoin}>
              {alreadyAccepted ? 'Join Meet & Problem' : 'Open Meet & Problem'}
            </Button>
          )}
          {user && (
            <Button size="large" onClick={() => navigate('/')}>Dashboard</Button>
          )}
        </div>
      </div>
    </div>
  );

  return user ? <DonezoShell>{body}</DonezoShell> : body;
}
