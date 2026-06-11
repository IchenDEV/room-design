// 工程约束：src 下单个源码文件不得超过 150 行
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LIMIT = 150;
const exts = new Set(['.ts', '.tsx', '.css']);
const bad = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (exts.has(p.slice(p.lastIndexOf('.')))) {
      const lines = readFileSync(p, 'utf8').split('\n').length;
      if (lines > LIMIT) bad.push(`${p}: ${lines} 行`);
    }
  }
}

walk('src');
if (bad.length) {
  console.error(`超过 ${LIMIT} 行的文件：\n` + bad.join('\n'));
  process.exit(1);
}
console.log(`OK：src 全部源码文件均 ≤ ${LIMIT} 行`);
