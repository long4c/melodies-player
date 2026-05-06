export type AbcMetadata = {
  title: string;
  key: string;
  meter: string;
  tempo: string;
};

const UNKNOWN = '알 수 없음';

function findField(abc: string, field: string): string | undefined {
  const lines = abc.split(/\r?\n/);
  const match = lines.find((line) => line.trimStart().startsWith(`${field}:`));

  return match?.trim().slice(2).trim() || undefined;
}

export function extractAbcMetadata(abc: string): AbcMetadata {
  return {
    title: findField(abc, 'T') ?? UNKNOWN,
    key: findField(abc, 'K') ?? UNKNOWN,
    meter: findField(abc, 'M') ?? UNKNOWN,
    tempo: findField(abc, 'Q') ?? UNKNOWN,
  };
}
