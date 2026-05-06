import { useEffect, useMemo, useRef, useState } from 'react';
import abcjs from 'abcjs';
import type { TuneObject } from 'abcjs';
import { decodeBase64Url } from '../lib/abcCodec';
import { extractAbcMetadata } from '../lib/abcMeta';

function getAbcFromUrl(): { abc: string; error: string } {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('a');

  if (!encoded) {
    return { abc: '', error: 'URL에 ABC 데이터가 없습니다.' };
  }

  try {
    return { abc: decodeBase64Url(encoded), error: '' };
  } catch {
    return {
      abc: '',
      error: '재생 링크를 읽을 수 없습니다. 링크가 잘렸거나 잘못 복사되었을 수 있습니다.',
    };
  }
}

export default function MelodyPage() {
  const scoreRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [copyMessage, setCopyMessage] = useState('');
  const [synthError, setSynthError] = useState('');

  const { abc, error } = useMemo(getAbcFromUrl, []);
  const metadata = useMemo(() => extractAbcMetadata(abc), [abc]);

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
          setSynthError(
            '브라우저 오디오 재생 컨트롤을 초기화하지 못했습니다. ABC 문법 또는 브라우저 오디오 권한을 확인해 주세요.',
          );
        });
    } catch {
      setSynthError('악보를 렌더링하지 못했습니다. ABC notation 형식을 확인해 주세요.');
    }
  }, [abc]);

  async function copyAbc() {
    await navigator.clipboard.writeText(abc);
    setCopyMessage('ABC 원문을 복사했습니다.');
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(window.location.href);
    setCopyMessage('현재 URL을 복사했습니다.');
  }

  if (error) {
    return (
      <main className="page-shell">
        <section className="workspace error-panel" role="alert">
          <h1>멜로디를 열 수 없습니다</h1>
          <p>{error}</p>
          <a className="button primary link-button" href="/">
            홈으로 가기
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="player-header">
        <div>
          <p className="eyebrow">Melody Player</p>
          <h1>{metadata.title}</h1>
        </div>
        <a className="button secondary link-button" href="/">
          새 링크 만들기
        </a>
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

      <section className="workspace">
        <h2>악보</h2>
        <div ref={scoreRef} className="score-surface" aria-label="Rendered sheet music" />
      </section>

      <section className="workspace">
        <h2>재생</h2>
        <div ref={controlsRef} className="audio-controls" />
        {synthError ? (
          <p className="error-message" role="alert">
            {synthError}
          </p>
        ) : null}
      </section>

      <section className="workspace">
        <div className="section-heading">
          <h2>ABC 원문</h2>
          <div className="button-row compact">
            <button className="button secondary" type="button" onClick={copyAbc}>
              ABC 복사
            </button>
            <button className="button secondary" type="button" onClick={copyUrl}>
              현재 URL 복사
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
