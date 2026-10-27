import { mkdir, writeFile } from 'node:fs/promises';
const slug = process.argv[2];
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('사용법: npm run new-case -- 영문-사례주소');
await mkdir('content/cases',{recursive:true});
const item = {slug,status:'draft',title:'사례 제목을 작성하세요',category:'업종',summary:'실제 작업을 한두 문장으로 요약하세요.',updated:new Date().toISOString().slice(0,10),source:'공개 허락 및 내용 확인 근거를 기록하세요.',images:[{src:'/assets/img/portfolio/'+slug+'.jpg',alt:'이미지에서 볼 수 있는 내용을 적으세요.',caption:'이 페이지의 기획·디자인 설명'}],sections:[{heading:'제작 배경',text:'고객에게 확인한 실제 목적과 요구사항을 적으세요.'},{heading:'기획과 디자인',text:'실제로 진행한 작업만 적으세요.'}],highlights:['구체적인 구성 특징을 작성하세요.']};
await writeFile('content/cases/'+slug+'.json',JSON.stringify(item,null,2)+'\n',{flag:'wx'});
console.log('초안 생성: content/cases/'+slug+'.json — 검수 후 status를 ready로 바꾸세요.');
