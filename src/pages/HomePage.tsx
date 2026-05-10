import { useMemo, useState } from 'react';
import { encodeBase64Url } from '../lib/abcCodec';

const sampleAbc = `X:1
T:Sample Melody
M:4/4
L:1/8
Q:1/4=98
K:C
C D E F G A B c | c B A G F E D C |`;

export default function HomePage() {
  const [abc, setAbc] = useState(sampleAbc);
  const [copyMessage, setCopyMessage] = useState('');

  const melodyUrl = useMemo(() => {
    const trimmedAbc = abc.trim();

    if (!trimmedAbc) {
      return '';
    }

    return `${window.location.origin}/m?a=${encodeBase64Url(trimmedAbc)}`;
  }, [abc]);

  async function copyUrl() {
    if (!melodyUrl) {
      setCopyMessage('ABC code is empty.');
      return;
    }

    await navigator.clipboard.writeText(melodyUrl);
    setCopyMessage('Melody URL copied.');
  }

  return (
    <main className="page-shell">
      <section className="app-header">
        <div className="header-copy">
          <p className="eyebrow">Melody Player</p>
          <h1>ABC melody link maker</h1>
          <p className="lead">
            Paste ABC notation, make a playback link, then save favorites from the melody page with your Google account.
          </p>
        </div>
        <nav className="header-actions" aria-label="Primary navigation">
          <a className="button secondary link-button" href="/saved">
            Saved melodies
          </a>
        </nav>
      </section>

      <section className="workspace">
        <label className="field-label" htmlFor="abc-input">
          ABC notation
        </label>
        <textarea
          id="abc-input"
          className="abc-textarea"
          value={abc}
          onChange={(event) => setAbc(event.currentTarget.value)}
          spellCheck={false}
        />

        <div className="button-row">
          <a className="button primary link-button" href={melodyUrl || undefined} aria-disabled={!melodyUrl}>
            Play melody
          </a>
          <button className="button secondary" type="button" onClick={copyUrl}>
            Copy URL
          </button>
        </div>

        {melodyUrl ? (
          <div className="link-output">
            <span className="output-label">Playback URL</span>
            <a href={melodyUrl}>{melodyUrl}</a>
          </div>
        ) : null}

        {copyMessage ? (
          <p className="status-message" role="status">
            {copyMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}
