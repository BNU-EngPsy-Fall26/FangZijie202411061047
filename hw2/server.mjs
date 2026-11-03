import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.glb':'model/gltf-binary','.wasm':'application/wasm','.json':'application/json','.data':'application/octet-stream','.binarypb':'application/octet-stream'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');let p=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}if((await stat(p)).isDirectory())p=path.join(p,'index.html');const b=await readFile(p);res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream','Cache-Control':'no-cache'}).end(b);}catch{res.writeHead(404).end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://localhost:4173'));
