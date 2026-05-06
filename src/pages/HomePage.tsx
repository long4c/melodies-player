import { useEffect, useMemo, useRef, useState } from 'react';

type Track = {
  id: string;
  name: string;
  url: string;
  file: File;
};

type RepeatMode = 'off' | 'one' | 'all';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${remainingSeconds}`;
}

function cleanTrackName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() || fileName;
}

export default function HomePage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tracksRef = useRef<Track[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.86);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [shuffle, setShuffle] = useState(false);
  const [message, setMessage] = useState('음악 파일을 선택하면 바로 재생 목록이 만들어집니다.');

  const currentTrack = tracks[currentIndex];
  const totalDurationLabel = useMemo(() => formatTime(duration), [duration]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    return () => {
      tracksRef.current.forEach((track) => URL.revokeObjectURL(track.url));
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) {
      return;
    }

    audioRef.current.src = currentTrack.url;
    audioRef.current.load();
    setCurrentTime(0);
    setDuration(0);

    if (isPlaying) {
      void audioRef.current.play().catch(() => {
        setIsPlaying(false);
        setMessage('브라우저가 자동 재생을 막았습니다. 재생 버튼을 눌러 주세요.');
      });
    }
  }, [currentTrack, isPlaying]);

  function addFiles(fileList: FileList | null) {
    const audioFiles = Array.from(fileList ?? []).filter((file) => file.type.startsWith('audio/'));

    if (audioFiles.length === 0) {
      setMessage('MP3, WAV, M4A 같은 오디오 파일을 선택해 주세요.');
      return;
    }

    const nextTracks = audioFiles.map((file, index) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
      name: cleanTrackName(file.name),
      url: URL.createObjectURL(file),
      file,
    }));

    setTracks((previousTracks) => {
      if (previousTracks.length === 0) {
        setCurrentIndex(0);
      }

      return [...previousTracks, ...nextTracks];
    });
    setMessage(`${audioFiles.length}곡을 재생 목록에 추가했습니다.`);
  }

  async function togglePlay() {
    if (!audioRef.current || !currentTrack) {
      fileInputRef.current?.click();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setMessage('재생 중입니다.');
    } catch {
      setMessage('이 파일을 재생할 수 없습니다. 다른 오디오 파일을 선택해 주세요.');
    }
  }

  function pickTrack(index: number) {
    setCurrentIndex(index);
    setIsPlaying(true);
  }

  function getRandomIndex() {
    if (tracks.length <= 1) {
      return currentIndex;
    }

    let nextIndex = currentIndex;
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    }

    return nextIndex;
  }

  function playPrevious() {
    if (tracks.length === 0) {
      return;
    }

    if (currentTime > 4 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }

    setCurrentIndex((index) => (index - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }

  function playNext() {
    if (tracks.length === 0) {
      return;
    }

    setCurrentIndex((index) => (shuffle ? getRandomIndex() : (index + 1) % tracks.length));
    setIsPlaying(true);
  }

  function handleEnded() {
    if (!audioRef.current) {
      return;
    }

    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
      return;
    }

    if (currentIndex < tracks.length - 1 || repeatMode === 'all' || shuffle) {
      playNext();
      return;
    }

    setIsPlaying(false);
  }

  function seek(value: string) {
    const nextTime = Number(value);
    setCurrentTime(nextTime);

    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
  }

  function clearPlaylist() {
    tracks.forEach((track) => URL.revokeObjectURL(track.url));
    setTracks([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setMessage('재생 목록을 비웠습니다.');
  }

  return (
    <main className="music-shell">
      <audio
        ref={audioRef}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      />

      <input
        ref={fileInputRef}
        className="visually-hidden"
        type="file"
        accept="audio/*"
        multiple
        onChange={(event) => addFiles(event.currentTarget.files)}
      />

      <section className="player-layout" aria-label="Music player">
        <div className="now-playing">
          <div className="album-art" aria-hidden="true">
            <div className={isPlaying ? 'vinyl-disc playing' : 'vinyl-disc'}>
              <span />
            </div>
          </div>

          <div className="track-copy">
            <p className="eyebrow">Melodies Player</p>
            <h1>{currentTrack?.name ?? '내 음악 플레이어'}</h1>
            <p className="lead">
              {currentTrack
                ? `${currentIndex + 1} / ${tracks.length}곡`
                : '로컬 오디오 파일을 선택해서 재생 목록을 만들 수 있습니다.'}
            </p>
          </div>

          <div className="transport">
            <div className="time-row">
              <span>{formatTime(currentTime)}</span>
              <span>{totalDurationLabel}</span>
            </div>
            <input
              className="seek-slider"
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={(event) => seek(event.currentTarget.value)}
              aria-label="재생 위치"
            />

            <div className="control-row">
              <button
                className={shuffle ? 'icon-button active' : 'icon-button'}
                type="button"
                onClick={() => setShuffle((value) => !value)}
                aria-label="셔플"
                title="셔플"
              >
                SH
              </button>
              <button className="icon-button" type="button" onClick={playPrevious} aria-label="이전 곡" title="이전 곡">
                |&lt;
              </button>
              <button className="play-button" type="button" onClick={togglePlay} aria-label={isPlaying ? '일시정지' : '재생'}>
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button className="icon-button" type="button" onClick={playNext} aria-label="다음 곡" title="다음 곡">
                &gt;|
              </button>
              <button
                className={repeatMode !== 'off' ? 'icon-button active' : 'icon-button'}
                type="button"
                onClick={() =>
                  setRepeatMode((mode) => (mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off'))
                }
                aria-label="반복"
                title="반복"
              >
                {repeatMode === 'one' ? 'R1' : 'RP'}
              </button>
            </div>

            <div className="volume-row">
              <span>Vol</span>
              <input
                className="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) => setVolume(Number(event.currentTarget.value))}
                aria-label="볼륨"
              />
              <span>{Math.round(volume * 100)}</span>
            </div>
          </div>
        </div>

        <aside className="playlist-panel" aria-label="Playlist">
          <div className="playlist-heading">
            <div>
              <p className="eyebrow">Queue</p>
              <h2>재생 목록</h2>
            </div>
            <button className="button secondary" type="button" onClick={() => fileInputRef.current?.click()}>
              파일 추가
            </button>
          </div>

          <div className="playlist-actions">
            <button className="button primary" type="button" onClick={() => fileInputRef.current?.click()}>
              음악 선택
            </button>
            <button className="button secondary" type="button" onClick={clearPlaylist} disabled={tracks.length === 0}>
              비우기
            </button>
          </div>

          <p className="status-message" role="status">
            {message}
          </p>

          <div className="track-list">
            {tracks.length === 0 ? (
              <div className="empty-state">
                <strong>아직 추가된 곡이 없습니다.</strong>
                <span>기기의 음악 파일을 선택하면 이곳에 표시됩니다.</span>
              </div>
            ) : (
              tracks.map((track, index) => (
                <button
                  className={index === currentIndex ? 'track-item active' : 'track-item'}
                  key={track.id}
                  type="button"
                  onClick={() => pickTrack(index)}
                >
                  <span className="track-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="track-info">
                    <strong>{track.name}</strong>
                    <span>{(track.file.size / 1024 / 1024).toFixed(1)} MB</span>
                  </span>
                  <span className="track-state">{index === currentIndex && isPlaying ? 'Playing' : 'Ready'}</span>
                </button>
              ))
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
