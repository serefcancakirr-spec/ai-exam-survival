// Stage 23: writes sw.js (from pwa/service-worker.js) into the build with the list of files to keep offline.
// The version is a hash of every file, so each new build that changes anything makes a new sw.js,
// and the app then shows "Yeni sürüm hazır – Yenile".
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

const ROOT = import.meta.dirname;

/** Files under public/ to keep offline (recordings are saved when first played, robots.txt is not needed). */
function publicFiles(dir: string, base = ''): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (rel !== 'audio') out.push(...publicFiles(path.join(dir, entry.name), rel));
    } else if (rel !== 'robots.txt') {
      out.push(rel);
    }
  }
  return out;
}

export function pwaPlugin(): Plugin {
  return {
    name: 'ai-exam-survival-pwa',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const hash = createHash('sha256');
      const files: string[] = [];
      for (const [name, item] of Object.entries(bundle)) {
        if (name.endsWith('.map')) continue;
        files.push(name);
        hash.update(name).update(item.type === 'chunk' ? item.code : item.source);
      }
      const publicDir = path.join(ROOT, '..', 'public');
      for (const name of publicFiles(publicDir)) {
        files.push(name);
        hash.update(name).update(fs.readFileSync(path.join(publicDir, name)));
      }
      files.sort();
      const template = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
      const version = hash.digest('hex').slice(0, 12);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template.replace("'__VERSION__'", JSON.stringify(version)).replace('__FILES__', JSON.stringify(files)),
      });
    },
  };
}
