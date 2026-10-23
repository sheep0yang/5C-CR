import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';

// Emulate a project hosted in a Pages subdirectory, without the Node development server.
test('靜態 Pages 子目錄可載入首頁、樣式、入口與模組',async t=>{
  const root=new URL('../',import.meta.url);
  const allowed=new Map([['/5C-CR/','index.html'],['/5C-CR/index.html','index.html'],['/5C-CR/style.css','style.css'],['/5C-CR/app.js','app.js'],['/5C-CR/logic.js','logic.js']]);
  const server=http.createServer(async(req,res)=>{
    const file=allowed.get(req.url);
    if(!file){res.writeHead(404);res.end();return;}
    const type=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html';
    res.setHeader('Content-Type',type);
    res.end(await readFile(new URL(file,root)));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}/5C-CR/`;
  const response=await fetch(base);assert.equal(response.status,200);
  const html=await response.text();assert.match(html,/<title>泊床/);
  const explicit=await fetch(base+'index.html');assert.equal(await explicit.text(),html);
  const assets=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]);
  assert.equal(assets.length,2);
  for(const asset of assets){
    const url=new URL(asset,base);assert.ok(url.pathname.startsWith('/5C-CR/'));
    const response=await fetch(url);assert.equal(response.status,200);
    const source=await response.text();
    if(asset.endsWith('.js')){
      assert.match(response.headers.get('content-type'),/javascript/);
      const imports=[...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(m=>m[1]);
      assert.deepEqual(imports,['./logic.js']);
      for(const path of imports){const moduleUrl=new URL(path,url);assert.ok(moduleUrl.pathname.startsWith('/5C-CR/'));assert.equal((await fetch(moduleUrl)).status,200);}
      assert.doesNotMatch(source,/\bfetch\s*\(/);
    }
  }
  assert.equal((await fetch(new URL('/app.js',base))).status,404,'root paths must not accidentally pass');
  assert.equal(await readFile(new URL('.nojekyll',root),'utf8'),'');
});
