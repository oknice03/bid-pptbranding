import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist'), port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.xml':'application/xml','.txt':'text/plain; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname.includes('\\')||pathname.split('/').some(p=>p.startsWith('.'))) throw Error('bad path');
    let file=path.resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+path.sep)) throw Error('bad path');
    let info; try {info=await stat(file)} catch {}
    if(info?.isDirectory()) {
      if(!pathname.endsWith('/')) {res.writeHead(301,{Location:pathname+'/'});res.end();return;}
      file=path.join(file,'index.html');
    }
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'});res.end(data);
  } catch {res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex'});res.end(await readFile(path.join(root,'404.html')));}
}).listen(port,'127.0.0.1',()=>console.log('검수 전용: http://127.0.0.1:'+port));
