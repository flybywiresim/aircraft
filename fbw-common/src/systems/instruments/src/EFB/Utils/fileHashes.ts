import { cyrb53_bytes } from '@flybywiresim/fbw-sdk';

export interface HashMismatchResult {
  vfsPath: string;
  expectedHash: number;
  actualHash: number;
}

export async function checkFileHashes(hashFile: string, hashSeed = 0): Promise<HashMismatchResult[]> {
  let hashes: Record<string, number>;
  try {
    hashes = JSON.parse(await (await fetch(hashFile)).text());
  } catch (e) {
    console.error('[checkFileHashes] Failed to read hash file!', hashFile, e);
    return [];
  }

  const result: HashMismatchResult[] = [];

  for (const [vfsPath, expectedHash] of Object.entries(hashes)) {
    const buffer = await (await fetch(`/VFS/${vfsPath}`)).arrayBuffer();
    const actualHash = cyrb53_bytes(buffer, hashSeed);

    if (actualHash !== expectedHash) {
      result.push({
        vfsPath,
        actualHash,
        expectedHash,
      });
    }
  }

  return result;
}
