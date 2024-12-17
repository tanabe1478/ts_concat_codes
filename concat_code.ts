#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import ignore from 'ignore';
import { Writable } from 'stream';

interface Options {
  directories: string[];
  output?: string;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const directories: string[] = [];
  let output: string | undefined = undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-o' || arg === '--output') {
      output = args[i + 1];
      i++;
    } else {
      // 出力指定以外はディレクトリとみなす
      directories.push(arg);
    }
  }

  if (directories.length === 0) {
    console.error('Usage: concat_code <directory1> <directory2> ... [-o output]');
    process.exit(1);
  }

  return { directories, output };
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

function getFilteredFiles(directory: string, ig: ReturnType<typeof ignore>): string[] {
  const absDir = path.resolve(directory);
  const allFiles = gatherFiles(absDir);
  const relFiles = allFiles.map(f => path.relative(absDir, f));
  const filtered = relFiles.filter(f => !ig.ignores(f));
  return filtered;
}

function main() {
  const { directories, output } = parseArgs();

  let outStream: Writable = process.stdout;
  if (output) {
    outStream = fs.createWriteStream(output, { encoding: 'utf-8' });
  }

  for (const dir of directories) {
    const absDir = path.resolve(dir);
    const gitignorePath = path.join(absDir, '.gitignore');
    let ig = ignore();
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      ig = ignore().add(gitignoreContent);
    }

    const filteredFiles = getFilteredFiles(dir, ig);

    for (const f of filteredFiles) {
      const fullPath = path.join(absDir, f);
      const code = fs.readFileSync(fullPath, { encoding: 'utf-8' });
      outStream.write(`## ${dir}/${f}\n`);
      outStream.write("```\n");
      outStream.write(code);
      outStream.write("\n```\n\n");
    }
  }

  if (outStream !== process.stdout && (outStream as fs.WriteStream).end) {
    (outStream as fs.WriteStream).end();
  }
}

main();
