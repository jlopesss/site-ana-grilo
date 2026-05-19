#!/usr/bin/env node
// Roda via GitHub Actions após push.
// Se uma categoria deletada ainda é usada por posts, restaura o arquivo.

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const ROOT     = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(ROOT, 'blog', '_posts');

// Categorias deletadas neste commit
const diff = execSync('git diff --name-status HEAD~1 HEAD').toString();
const deleted = diff.split('\n')
  .filter(l => l.startsWith('D\t') && l.includes('blog/_categories/'))
  .map(l => l.replace(/^D\t/, '').trim());

if (deleted.length === 0) {
  console.log('Nenhuma categoria deletada neste commit.');
  process.exit(0);
}

const postFiles = fs.existsSync(POSTS_DIR)
  ? fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))
  : [];

let restored = 0;

for (const catFile of deleted) {
  // Recupera o conteúdo da categoria antes da deleção
  let catContent;
  try {
    catContent = execSync(`git show HEAD~1:${catFile}`, { encoding: 'utf8' });
  } catch {
    console.warn(`Não foi possível ler ${catFile} do histórico. Pulando.`);
    continue;
  }

  const { data } = matter(catContent);
  const catTitle = data.title;

  if (!catTitle) continue;

  // Verifica se algum post usa essa categoria
  const usedBy = postFiles.filter(postFile => {
    try {
      const raw = fs.readFileSync(path.join(POSTS_DIR, postFile), 'utf8');
      return matter(raw).data.category === catTitle;
    } catch {
      return false;
    }
  });

  if (usedBy.length > 0) {
    fs.mkdirSync(path.dirname(path.join(ROOT, catFile)), { recursive: true });
    fs.writeFileSync(path.join(ROOT, catFile), catContent, 'utf8');
    console.log(`Restaurado: ${catFile}`);
    console.log(`  → usada por: ${usedBy.join(', ')}`);
    restored++;
  } else {
    console.log(`OK para deletar: "${catTitle}" — nenhum post a usa.`);
  }
}

if (restored > 0) {
  console.log(`\n${restored} categoria(s) restaurada(s) por ainda estarem em uso.`);
  process.exit(0);
}
