const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === 'ENOTDIR' || err.code === 'EBADF') {
         if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
             filelist.push(dirFile);
         }
      } else throw err;
    }
  });
  return filelist;
};

const files = walkSync('src');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // replace `something.id ===` with `something?.id ===`
  // looking for patterns like `p => p.id ===` or `r => r.id ===`
  content = content.replace(/([a-zA-Z0-9_]+)\s*=>\s*\1\.id/g, '$1 => $1?.id');
  
  // Also fix `r => r.id !==`
  content = content.replace(/([a-zA-Z0-9_]+)\s*=>\s*\1\.id/g, '$1 => $1?.id'); // Already covered by above if it just looks for .id

  // What about `c.id` where it's `(c: any) => c.id`
  content = content.replace(/\(\s*([a-zA-Z0-9_]+)(\s*:\s*[a-zA-Z0-9_]+)?\s*\)\s*=>\s*\1\.id/g, '($1$2) => $1?.id');

  // Also replace `nominee.id` if no arrow function? Only if nominee might be undefined.
  if (file.includes('GrammysView.tsx')) {
     content = content.replace(/nominee\.id/g, 'nominee?.id');
  }

  // Radio chart
  if (file.includes('RadioChart.tsx')) {
     content = content.replace(/song\.id/g, 'song?.id');
  }

  // GoogleView
  if (file.includes('GoogleView.tsx')) {
     content = content.replace(/item\.id/g, 'item?.id');
     content = content.replace(/al\.id/g, 'al?.id');
  }

  fs.writeFileSync(file, content);
}
console.log('Patched optionally chaining .id');
