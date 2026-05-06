import { useMemo, useState } from 'react';
import { encodeBase64Url } from '../lib/abcCodec';

const SAMPLE_ABC = `X:1
T:Sample Moonlit Pop Hook
M:4/4
L:1/8
Q:1/4=98
K:Am
"Am" E A B c B A E2 | "F" F A c d c A F2 | "C" G E G c B G E2 | "G" D G A B A G G2 |`;

export default function HomePage() {
  const [abc, setAbc] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [message, setMessage] = useState('');

  const canCreate = abc.trim().length > 0;

  const origin = useMemo(() => window.location.origin, []);

  function createLink() {
    if (!canCreate) {
      setMessage('ABC notation을 먼저 입력해 주세요.');
      return;
    }

    const encoded = encodeBase64Url(abc);
    const link = `${origin}/m?a=${encoded}`;
    setGeneratedLink(link);
    setMessage('재생 링크를 만들었습니다.');
  }

  async function copyLink() {
    if (!generatedLink) {
      setMessage('복사할 링크가 없습니다.');
      return;
    }

    await navigator.clipboard.writeText(generatedLink);
    setMessage('링크를 복사했습니다.');
  }

  function openLink() {
    if (!generatedLink) {
      setMessage('먼저 재생 링크를 만들어 주세요.');
      return;
    }

    window.location.href = generatedLink;
  }

  function fillSample() {
    setAbc(SAMPLE_ABC);
    setGeneratedLink('');
    setMessage('샘플 ABC를 입력했습니다.');
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <p className="eyebrow">ABC notation mini player</p>
        <h1>Melodies Player</h1>
        <p className="lead">
          ChatGPT가 만든 ABC notation 멜로디를 링크 하나로 악보와 브라우저 재생 컨트롤까지
          열어볼 수 있는 정적 웹 플레이어입니다.
        </p>
      </section>

      <section className="workspace" aria-labelledby="abc-input-title">
        <div className="section-heading">
          <h2 id="abc-input-title">ABC 입력</h2>
          <button className="button secondary" type="button" onClick={fillSample}>
            샘플 입력
          </button>
        </div>

        <label className="field-label" htmlFor="abc-input">
          ABC notation
        </label>
        <textarea
          id="abc-input"
          className="abc-textarea"
          value={abc}
          onChange={(event) => setAbc(event.target.value)}
          placeholder="X:1&#10;T:My Melody&#10;M:4/4&#10;L:1/8&#10;Q:1/4=100&#10;K:C&#10;C D E F | G A B c |"
        />

        <p className="privacy-note">
          생성된 링크 안에 ABC 원문이 포함됩니다. 개인정보나 비공개 데이터는 넣지 마세요.
        </p>

        <div className="button-row">
          <button className="button primary" type="button" onClick={createLink}>
            재생 링크 만들기
          </button>
          <button className="button secondary" type="button" onClick={copyLink}>
            링크 복사
          </button>
          <button className="button secondary" type="button" onClick={openLink}>
            바로 열기
          </button>
        </div>

        {message ? (
          <p className="status-message" role="status">
            {message}
          </p>
        ) : null}

        {generatedLink ? (
          <div className="link-output">
            <span className="output-label">생성된 링크</span>
            <a href={generatedLink}>{generatedLink}</a>
          </div>
        ) : null}
      </section>
    </main>
  );
}
