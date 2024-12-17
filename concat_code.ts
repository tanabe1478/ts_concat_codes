import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import ignore from 'ignore';
import { Writable } from 'stream';

interface Options {
  directory: string;
  output?: string;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  let directory = '';
  let output: string | undefined = undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-o' || arg === '--output') {
      output = args[i+1];
      i++;
    } else {
      // 最初の非オプション引数をディレクトリとみなす
      if (!directory) {
        directory = arg;
      }
    }
  }

  if (!directory) {
    console.error('Usage: concat_code <directory> [-o output]');
    process.exit(1);
  }

  return { directory, output };
}

function gatherFiles(dir: string): string[] {
  let fileList: string[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      fileList = fileList.concat(gatherFiles(fullPath));
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function main() {
  const { directory, output } = parseArgs();
  const absDir = path.resolve(directory);
  process.chdir(absDir);

  // .gitignore の読み込みと ignore インスタンス作成
  const gitignorePath = path.join(absDir, '.gitignore');
  let ig = ignore();
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    ig = ignore().add(gitignoreContent);
  }

  const files = gatherFiles('.').filter(f => {
    // ignoreパターンは相対パスで評価する
    return !ig.ignores(f); 
  });

  // outStream を Writable として扱う
  let outStream: Writable = process.stdout;
  if (output) {
    outStream = fs.createWriteStream(output, { encoding: 'utf-8' });
  }

  for (const f of files) {
    const code = fs.readFileSync(f, { encoding: 'utf-8' });
    outStream.write(`## ${f}\n`);
    outStream.write("```\n");
    outStream.write(code);
    outStream.write("\n```\n\n");
  }

  if (outStream !== process.stdout && (outStream as fs.WriteStream).end) {
    (outStream as fs.WriteStream).end();
  }
}

main();