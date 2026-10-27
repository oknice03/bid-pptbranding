// GitHub Pages publishes reviewed generated files from main:/docs.
// Run after npm run build; never upload the source root as the website.
import {readFile,writeFile,mkdir,cp,lstat,access,rm} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
assert.equal(path.resolve(process.cwd()),root,'프로젝트 루트에서 실행하세요.');
if(process.env.SITE_NOINDEX==='1'||['deploy-preview','branch-deploy'].includes(process.env.CONTEXT)){
 console.log('검수 전용 빌드: 공개용 docs 폴더 갱신 생략');
}else{
 const domain=(await readFile(path.join(root,'CNAME'),'utf8')).trim();assert.equal(domain,'bid.pptbranding.com');
 const checks=JSON.parse(execFileSync(process.execPath,['scripts/check.mjs'],{cwd:root,encoding:'utf8'}));assert.equal(checks.result,'PASS');assert.equal(checks.previewNoindex,false);
 const out=path.resolve(root,'docs');assert(out===path.join(root,'docs')&&out!==root,'출력 폴더 확인');
 const existing=await lstat(out).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
 if(existing){assert(existing.isDirectory()&&!existing.isSymbolicLink(),'실제 생성 폴더여야 합니다.');await access(path.join(out,'.pptbranding-pages'));await rm(out,{recursive:true});}
 await mkdir(out);await cp(path.join(root,'dist'),out,{recursive:true});
 await writeFile(path.join(out,'.pptbranding-pages'),'Generated public output. Rebuild with npm run build.\n');
 await writeFile(path.join(out,'.nojekyll'),'');
 await writeFile(path.join(out,'CNAME'),domain+'\n');
 console.log(JSON.stringify({pagesSource:'main:/docs',domain,pages:checks.sitemapURLs,sourceAndOriginalsExcluded:true}));
}
