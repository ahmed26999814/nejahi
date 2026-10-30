'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {parseEnv}=require('node:util');
const envPath='.env.neon-migration';
const vars=parseEnv(fs.readFileSync(envPath,'utf8'));
function conn(key,region){
  const raw=vars[key];if(!raw||/\[REDACTED\]|\*\*/.test(raw))throw Error('Missing '+key);
  const u=new URL(raw);const host=u.hostname.replace(/-pooler(?=\.)/,'');
  if(!['postgres:','postgresql:'].includes(u.protocol)
  ||!host.endsWith('.'+region+'.aws.neon.tech')||u.username!=='neondb_owner'
  ||u.pathname!=='/neondb'||!u.password)throw Error('Wrong '+key+' source or destination');
  return {host,port:u.port||'5432',user:u.username,password:decodeURIComponent(u.password),db:'neondb'};
}
const source=conn('NEON_STAGING_DATABASE_URL','eu-west-2');
const target=conn('NEON_FRANKFURT_DATABASE_URL','eu-central-1');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mauriresults-frankfurt-'));fs.chmodSync(dir,0o700);
function args(c){return ['-h',c.host,'-p',c.port,'-U',c.user,'-d',c.db]}
function run(cmd,a,c){
 const out=spawnSync(cmd,a,{cwd:dir,encoding:'utf8',maxBuffer:12*1024*1024,timeout:900000,
   env:{...process.env,PGPASSWORD:c.password,PGSSLMODE:'require',PGCONNECT_TIMEOUT:'30'}});
 if(out.error||out.status!==0)throw Error(cmd+' failed: '+String(out.stderr||out.error||'failure').replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[REDACTED]').slice(0,2300));
 return String(out.stdout||'');
}
function q(c,s){return run('psql',[...args(c),'-X','-A','-t','-v','ON_ERROR_STOP=1','-c',s],c).trim()}
function tables(c){return q(c,"SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name").split('\n').filter(Boolean)}
function counts(c,names){
 const fields=names.map(n=>{if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(n))throw Error('Unsafe table name');
 return "'"+n+"',(SELECT count(*)::bigint FROM public.\""+n+"\")"});
 return JSON.parse(q(c,'SELECT json_build_object('+fields.join(',')+')::text'));
}
try{
 const guard=q(target,"SELECT (current_database()='neondb')::int::text||':'||(to_regclass('migration_stage.copy_progress') IS NOT NULL)::int::text||':'||(SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE')::text");
 if(guard!=='1:1:0')throw Error('Frankfurt target is not isolated and empty: '+guard);
 const t=tables(source);if(t.length!==28)throw Error('Unexpected source table count');
 if(q(source,"SELECT count(*) FROM pg_policies WHERE schemaname='public'")!=='0')throw Error('Unexpected source access policies');
 console.log('Guards passed: Frankfurt empty, 28 London staging tables');
 const dump=path.join(dir,'stage.dump');
 run('pg_dump',[...args(source),'--format=custom','--schema=public','--no-owner','--no-acl','--file',dump],source);
 const toc=run('pg_restore',['--list',dump],target);
 const filtered=toc.split('\n').filter(line=>!(/^[0-9]+;.* SCHEMA - public /.test(line)||/^[0-9]+;.* COMMENT - SCHEMA public /.test(line))).join('\n');
 const tocfile=path.join(dir,'filtered.toc');fs.writeFileSync(tocfile,filtered,{mode:0o600});
 run('pg_restore',[...args(target),'--use-list',tocfile,'--no-owner','--no-acl','--single-transaction','--exit-on-error',dump],target);
 const imported=tables(target);if(JSON.stringify(imported)!==JSON.stringify(t))throw Error('Imported tables differ');
 const a=counts(source,t),b=counts(target,t);if(JSON.stringify(a)!==JSON.stringify(b))throw Error('Row counts differ');
 const views=q(target,"SELECT count(*) FROM information_schema.views WHERE table_schema='public'");
 const funcs=q(target,"SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'");
 if(views!=='31'||funcs!=='34')throw Error('Views/functions mismatch');
 console.log('Frankfurt database copy verified: '+t.length+' tables, '+views+' views, '+funcs+' functions, '+Object.values(b).reduce((sum,n)=>sum+Number(n),0)+' rows');
}finally{
 fs.rmSync(dir,{recursive:true,force:true});
 try{fs.unlinkSync(envPath)}catch{}
}
