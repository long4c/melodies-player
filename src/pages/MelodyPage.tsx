import { useEffect, useMemo, useRef, useState } from 'react';
import abcjs from 'abcjs';
import type { TuneObject } from 'abcjs';
import { decodeBase64Url } from '../lib/abcCodec';
import { extractAbcMetadata } from '../lib/abcMeta';
import {
  getFirebaseErrorMessage,
  isFirebaseConfigured,
  signInWithGoogle,
  watchAuth,
  type User,
} from '../lib/firebase';
import { isMelodySaved, MELODY_CATEGORIES, saveMelody } from '../lib/savedMelodies';

function getAbcFromUrl(): { abc: string; error: string } {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('a');

  if (!encoded) {
    return { abc: '', error: 'No ABC data was found in this URL.' };
  }

  try {
    return { abc: decodeBase64Url(encoded), error: '' };
  } catch {
    return {
      abc: '',
      error: 'This melody link could not be decoded. It may be broken or copied incorrectly.',
    };
  }
}

export default function MelodyPage() {
  const scoreRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [copyMessage, setCopyMessage] = useState('');
  const [synthError, setSynthError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [category, setCategory] = useState('Uncategorized');
  const [note, setNote] = useState('');

  const { abc, error } = useMemo(getAbcFromUrl, []);
  const metadata = useMemo(() => extractAbcMetadata(abc), [abc]);

  useEffect(() => {
    return watchAuth((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!abc || !user) {
      setSaved(false);
      return;
    }

    let ignore = false;

    void isMelodySaved(user.uid, abc)
      .then((nextSaved) => {
        if (!ignore) {
          setSaved(nextSaved);
        }
      })
      .catch((savedCheckError) => {
        if (!ignore) {
          setCopyMessage(`Could not check saved status. ${getFirebaseErrorMessage(savedCheckError)}`);
        }
      });

    return () => {
      ignore = true;
    };
  }, [abc, user]);

  useEffect(() => {
    if (!scoreRef.current || !controlsRef.current || !abc) {
      return;
    }

    scoreRef.current.innerHTML = '';
    controlsRef.current.innerHTML = '';
    setSynthError('');

    try {
      const visualObj = abcjs.renderAbc(scoreRef.current, abc, {
        responsive: 'resize',
        add_classes: true,
      })[0] as TuneObject;

      const synthControl = new abcjs.synth.SynthController();
      synthControl.load(controlsRef.current, undefined, {
        displayLoop: true,
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: true,
      });

      const synth = new abcjs.synth.CreateSynth();

      void synth
        .init({
          visualObj,
        })
        .then(() => synthControl.setTune(visualObj, false, { chordsOff: false }))
        .catch(() => {
          setSynthError('Could not initialize audio playback. Check browser audio permission or ABC syntax.');
        });
    } catch {
      setSynthError('Could not render the score. Check the ABC notation format.');
    }
  }, [abc]);

  async function copyAbc() {
    await navigator.clipboard.writeText(abc);
    setCopyMessage('ABC code copied.');
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(window.location.href);
    setCopyMessage('Current URL copied.');
  }

  async function saveCurrentMelody() {
    if (!isFirebaseConfigured) {
      setCopyMessage('Firebase config is missing. Add your project keys to .env first.');
      return;
    }

    setSaving(true);

    try {
      const activeUser = user ?? (await signInWithGoogle());
      await saveMelody(activeUser.uid, abc, metadata, {
        category,
        note,
      });
      setSaved(true);
      setCopyMessage('Saved to your account.');
    } catch (saveError) {
      setCopyMessage(`Could not save this melody. ${getFirebaseErrorMessage(saveError)}`);
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <main className="page-shell">
        <section className="workspace error-panel" role="alert">
          <h1>Melody unavailable</h1>
          <p>{error}</p>
          <a className="button primary link-button" href="/">
            Go home
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="app-header">
        <div className="header-copy">
          <p className="eyebrow">Melody Player</p>
          <h1>{metadata.title}</h1>
        </div>
        <div className="header-side">
          <nav className="header-actions" aria-label="Primary navigation">
            <a className="button secondary link-button" href="/saved">
              Saved list
            </a>
            <a className="button secondary link-button" href="/">
              New link
            </a>
          </nav>
          {user ? <p className="auth-note">Signed in as {user.email ?? user.displayName ?? 'Google user'}</p> : null}
        </div>
      </section>

      <section className="meta-grid" aria-label="ABC metadata">
        <div>
          <span>Key</span>
          <strong>{metadata.key}</strong>
        </div>
        <div>
          <span>Meter</span>
          <strong>{metadata.meter}</strong>
        </div>
        <div>
          <span>Tempo</span>
          <strong>{metadata.tempo}</strong>
        </div>
      </section>

      {!saved ? (
        <section className="workspace">
          <div className="section-heading">
            <h2>Save details</h2>
            <button
              className="button primary"
              type="button"
              onClick={saveCurrentMelody}
              disabled={!authReady || saving}
            >
              {user ? (saving ? 'Saving' : 'Save melody') : 'Sign in and save'}
            </button>
          </div>
          <div className="saved-fields">
            <label>
              Category
              <select
                className="saved-select"
                value={category}
                onChange={(event) => setCategory(event.currentTarget.value)}
              >
                {MELODY_CATEGORIES.map((melodyCategory) => (
                  <option key={melodyCategory} value={melodyCategory}>
                    {melodyCategory}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Memo
              <textarea
                className="saved-note"
                value={note}
                onChange={(event) => setNote(event.currentTarget.value)}
                placeholder="Why this melody works, where to use it, arrangement ideas..."
              />
            </label>
          </div>
        </section>
      ) : null}

      <section className="workspace">
        <h2>Score</h2>
        <div ref={scoreRef} className="score-surface" aria-label="Rendered sheet music" />
      </section>

      <section className="workspace">
        <h2>Playback</h2>
        <div ref={controlsRef} className="audio-controls" />
        {synthError ? (
          <p className="error-message" role="alert">
            {synthError}
          </p>
        ) : null}
      </section>

      <section className="workspace">
        <div className="section-heading">
          <h2>ABC code</h2>
          <div className="button-row compact">
            <button className="button secondary" type="button" onClick={copyAbc}>
              Copy ABC
            </button>
            <button className="button secondary" type="button" onClick={copyUrl}>
              Copy URL
            </button>
          </div>
        </div>
        <pre className="abc-source">{abc}</pre>
        {copyMessage ? (
          <p className="status-message" role="status">
            {copyMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}
