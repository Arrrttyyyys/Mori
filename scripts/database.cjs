const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');require('@next/env').loadEnvConfig(process.cwd(),false,{info(){},error(){}});
function run(sql){let url;try{url=new URL(process.env.DATABASE_URL)}catch{throw Error('DATABASE_URL is missing or is not a valid PostgreSQL URL.')}
 const password=decodeURIComponent(url.password);if(!password||password.includes('[YOUR-PASSWORD]'))throw Error('Replace the password placeholder in DATABASE_URL with the database password.')
 const result=spawnSync('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',env:{...process.env,PGHOST:url.hostname,PGPORT:url.port||'5432',PGUSER:decodeURIComponent(url.username),PGPASSWORD:password,PGDATABASE:url.pathname.slice(1)||'postgres',PGSSLMODE:'require',PGCONNECT_TIMEOUT:'15'},maxBuffer:4*1024*1024})
 if(result.status!==0){let error=result.stderr||result.error?.message||'Database command failed';for(const secret of [process.env.DATABASE_URL,password,process.env.SUPABASE_SERVICE_ROLE_KEY,process.env.SUPABASE_SECRET_KEY].filter(Boolean))error=error.split(secret).join('[redacted]');throw Error(error)}return result.stdout.trim()}
try{const mode=process.argv[2]||'status';if(mode==='status'){console.log(run("select tablename from pg_tables where schemaname='public' order by tablename;"));}
 else if(mode==='apply'||mode==='apply-one'){
 const tables=run("select tablename from pg_tables where schemaname='public';").split('\n');
 const migrations=fs.readdirSync('supabase/migrations').filter(x=>x.endsWith('.sql')).sort();
 const tracked=tables.includes('mori_schema_migrations')?run('select name from public.mori_schema_migrations;').split('\n'):[];
 if(!tracked.length&&tables.includes('memories'))throw Error('An existing untracked Mori schema was detected. Inspect its migrations before applying new ones.');
 let pending=migrations.filter(name=>!tracked.includes(name));
 if(mode==='apply-one'){
  const requested=path.basename(process.argv[3]||'');
  if(!/^\d{12}_[a-z0-9_]+\.sql$/.test(requested)||!migrations.includes(requested))throw Error('Provide one existing migration filename.');
  pending=pending.filter(name=>name===requested);
 }
 if(!pending.length){console.log(mode==='apply-one'?'Requested migration is already applied.':'All tracked migrations are applied.');process.exit(0)}
 const statements=["begin;create table if not exists public.mori_schema_migrations(name text primary key,applied_at timestamptz not null default now());alter table public.mori_schema_migrations enable row level security;"];
 for(const name of pending){statements.push(fs.readFileSync(path.join('supabase/migrations',name),'utf8'));statements.push(`insert into public.mori_schema_migrations(name) values ('${name.replaceAll("'","''")}');`)}statements.push("notify pgrst, 'reload schema';commit;");run(statements.join('\n'));console.log('Applied migrations:',pending.join(', '));
 }else throw Error('Use status or apply.');}catch(e){console.error(e.message);process.exitCode=1}
