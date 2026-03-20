import { strToU8, gzipSync } from 'fflate';

/**
 * Formats a title and description into a Python block comment.
 * Wraps text at 120 characters per line.
 */
export function formatPythonComment(title: string, description: string): string {
  const MAX_LEN = 120;
  const prefix = '# ';
  
  const breakText = (text: string) => {
    if (!text) return '#';
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const result: string[] = [];
    
    for (const line of lines) {
      if (line.trim().length === 0) {
        result.push('#');
        continue;
      }
      if (prefix.length + line.length <= MAX_LEN) {
        result.push(prefix + line);
        continue;
      }
      
      let currentLine = prefix;
      const words = line.split(' ');
      
      for (const word of words) {
        if (!word) continue;
        if (currentLine === prefix) {
          currentLine += word;
        } else if (currentLine.length + 1 + word.length <= MAX_LEN) {
          currentLine += ' ' + word;
        } else {
          result.push(currentLine);
          currentLine = prefix + word;
        }
      }
      if (currentLine !== prefix) {
        result.push(currentLine);
      }
    }
    return result.join('\n');
  };

  return `${breakText(title)}\n#\n${breakText(description)}\n\n`;
}

/**
 * Creates a .tar.gz archive from a list of files.
 */
export function createTarArchive(files: { name: string; content: string }[]): Uint8Array {
  // A standard tar block is 512 bytes.
  let totalSize = 0;
  for (const file of files) {
    const contentBytes = strToU8(file.content);
    const contentBlocks = Math.ceil(contentBytes.length / 512);
    totalSize += 512 + contentBlocks * 512;
  }
  totalSize += 1024; // 2 end blocks

  const out = new Uint8Array(totalSize);
  let offset = 0;

  for (const file of files) {
    const contentBytes = strToU8(file.content);
    const header = new Uint8Array(512);
    
    // File name
    const nameBytes = strToU8(file.name);
    header.set(nameBytes.subarray(0, 100), 0);
    // File mode
    header.set(strToU8('0000644\0'), 100);
    // Owner
    header.set(strToU8('0001750\0'), 108);
    // Group
    header.set(strToU8('0001750\0'), 116);
    // File size
    let sizeStr = contentBytes.length.toString(8);
    header.set(strToU8(sizeStr.padStart(11, '0') + '\0'), 124);
    // Mtime
    const mtime = Math.floor(Date.now() / 1000).toString(8);
    header.set(strToU8(mtime.padStart(11, '0') + '\0'), 136);
    // Checksum placeholder
    header.set(strToU8('        '), 148);
    // Typeflag
    header[156] = 48; // '0'

    let checksum = 0;
    for (let i = 0; i < 512; i++) {
      checksum += header[i];
    }
    header.set(strToU8(checksum.toString(8).padStart(6, '0') + '\0 '), 148);

    out.set(header, offset);
    offset += 512;

    out.set(contentBytes, offset);
    offset += Math.ceil(contentBytes.length / 512) * 512;
  }

  // The remaining bytes are 0 marking EOF.
  return out;
}

export function downloadCodeArchive(
  examTitle: string, 
  storageKeyPrefix: string, 
  problems: { title: string, description: string }[]
) {
  const files = problems.map((p, i) => {
    // Note: in practice page it uses `practice_mode_i`, in normal exam mode it uses `prog_code_XYZ_i`
    // We pass the exact prefix. If prefix is "practice_mode", key is `practice_mode_0`
    const storageKeyForCode = storageKeyPrefix.includes('prog_code') 
      ? `${storageKeyPrefix}_${i}` // app/programming uses this format
      : `${storageKeyPrefix}_${i}`; // app/programming/create uses this format too.
      
    let code = '';
    try {
      const raw = localStorage.getItem(storageKeyForCode);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'string') {
          code = parsed;
        }
      }
    } catch {
      // ignore
    }
    return {
      name: `${p.title}.py`,
      content: formatPythonComment(p.title, p.description) + code
    };
  });

  const tarBytes = createTarArchive(files);
  const gzipped = gzipSync(tarBytes);
  
  const blob = new Blob([gzipped as globalThis.BlobPart], { type: 'application/gzip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = examTitle.replace(/[^A-Za-z0-9_-]/g, '_');
  a.download = `${safeTitle}-codigo.tar.gz`;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
