import http from 'node:http';
import {readFile} from 'node:fs/promises';
const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/logic.js':'logic.js'};
http.createServer(async(req,res)=>{const name=files[new URL(req.url,'http://localhost').pathname];if(!name){res.writeHead(404);res.end();return;}try{const data=await readFile(new URL(name,import.meta.url));res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(data);}catch{res.writeHead(500);res.end('Unable to load application');}}).listen(Number(process.env.PORT||3000),'0.0.0.0');
