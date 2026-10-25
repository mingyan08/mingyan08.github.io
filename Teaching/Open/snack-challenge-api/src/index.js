// 100元零食挑战赛 · Cloudflare Worker 后端
// 无第三方依赖。比赛起止时间、题目与得分以服务器为准。
const BUDGET = 100;
const MIN_KINDS = 3;
const GAME_MS = 30_000;
const COUNTDOWN_MS = 10_000;
const ORIGIN = 'https://mingyan08.github.io';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function respond(data, status = 200, request) {
  const headers = new Headers(HEADERS);
  const origin = request?.headers.get('Origin');
  if (origin === ORIGIN) headers.set('Access-Control-Allow-Origin', ORIGIN);
  headers.set('Vary', 'Origin');
  return new Response(JSON.stringify(data), {status, headers});
}
function error(message, status = 400, request) {
  return respond({ok:false,error:message},status,request);
}
function id() { return crypto.randomUUID(); }
function rand6() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 900000 + 100000);
}
function todayCN() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date()).map(p=>[p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
// 用小型动态规划快速求出整数规划全局最优解，避免创建场次时耗费过多CPU。
function bestCombination(items) {
  const dp=Array.from({length:BUDGET+1},()=>Array(16).fill(null));
  dp[0][0]={score:0,combo:[0,0,0,0]};
  for(let i=0;i<items.length;i++) {
    for(let cost=items[i].price;cost<=BUDGET;cost++) {
      for(let mask=0;mask<16;mask++) {
        const prior=dp[cost-items[i].price][mask];
        if(!prior)continue;
        const nextMask=mask|(1<<i),newScore=prior.score+items[i].sat;
        if(!dp[cost][nextMask]||dp[cost][nextMask].score<newScore) {
          const combo=prior.combo.slice();combo[i]++;
          dp[cost][nextMask]={score:newScore,combo};
        }
      }
    }
  }
  let best={score:-1,cost:Infinity,combo:null};
  for(let cost=0;cost<=BUDGET;cost++) for(let mask=0;mask<16;mask++) {
    if(mask.toString(2).replaceAll('0','').length<MIN_KINDS)continue;
    const v=dp[cost][mask];
    if(v&&(v.score>best.score||(v.score===best.score&&cost<best.cost)))
      best={score:v.score,cost,combo:v.combo};
  }
  return best;
}
// 每次创建讲座均使用服务器新生成的随机数，不能靠原版练习网页或讲座口令推算赛前答案。
function puzzleForDate(day) {
  const secret=new Uint32Array(1);crypto.getRandomValues(secret);
  const baseSeed=Number(day.replaceAll('-',''))+secret[0];
  const names=['🥔 薯片','🥤 可乐','🍫 巧克力','🍎 鲜切水果'];
  let selected=null;
  for(let offset=0;offset<100;offset++) {
    let seed=baseSeed+offset*997;
    const random=()=>{const x=Math.sin(seed++)*10000;return x-Math.floor(x);};
    const items=names.map(name=>({name,price:5+Math.floor(random()*14),sat:2+Math.floor(random()*7)}));
    const optimal=bestCombination(items);
    selected={items,optimal};
    if(optimal.combo && optimal.combo.filter(q=>q===1).length<2)break;
  }
  return selected;
}
function derivePhase(s, now=Date.now()) {
  if(s.revealed_at) return 'revealed';
  if(!s.start_at) return 'waiting';
  if(now<s.start_at) return 'countdown';
  if(now<s.end_at) return 'running';
  return 'ended';
}
function sessionPublic(s, now=Date.now()) {
  const phase=derivePhase(s,now);
  const showPuzzle=phase==='running'||phase==='ended'||phase==='revealed';
  const reveal=phase==='revealed';
  return {
    id:s.id,title:s.title,code:s.code,date:s.game_date,
    phase,serverNow:now,startAt:s.start_at,endAt:s.end_at,
    items:showPuzzle?JSON.parse(s.items_json):null,
    optimal:reveal?{score:s.optimal_score,combo:JSON.parse(s.optimal_combo_json)}:null,
  };
}
async function readJSON(request) {
  const raw=await request.text();
  if(raw.length>4096) throw Error('请求内容过大');
  let data;
  try {data=JSON.parse(raw);} catch {throw Error('请求不是有效的 JSON');}
  if(!data || typeof data!=='object'||Array.isArray(data)) throw Error('请求格式不正确');
  return data;
}
function validCode(code) {return typeof code==='string'&&/^\d{6}$/.test(code);}
function validId(v) {return typeof v==='string'&&/^[a-zA-Z0-9-]{16,64}$/.test(v);}
function adminAuthorized(request, env) {
  const header=request.headers.get('Authorization')||'';
  return typeof env.ADMIN_TOKEN==='string'&&env.ADMIN_TOKEN.length>=24&&header===`Bearer ${env.ADMIN_TOKEN}`;
}
async function byCode(env, code) {
  return env.DB.prepare('SELECT * FROM sessions WHERE code=?').bind(code).first();
}
async function bySessionId(env, sessionId) {
  return env.DB.prepare('SELECT * FROM sessions WHERE id=?').bind(sessionId).first();
}
async function getPlayer(env, token) {
  if(typeof token!=='string'||token.length<30||token.length>150) return null;
  return env.DB.prepare('SELECT * FROM players WHERE token=?').bind(token).first();
}
function scoreQty(items,qty) {
  if(!Array.isArray(qty)||qty.length!==4||qty.some(v=>!Number.isInteger(v)||v<0||v>25)) throw Error('零食数量不正确');
  let cost=0,score=0,kinds=0;
  for(let i=0;i<4;i++) {
    cost+=qty[i]*items[i].price;
    score+=qty[i]*items[i].sat;
    if(qty[i]>0) kinds++;
  }
  const valid=cost<=BUDGET&&kinds>=MIN_KINDS;
  return {cost,score:valid?score:0,kinds,valid};
}
async function saveScore(env, player, session, qty, isFinal) {
  const now=Date.now();
  if(!session.start_at||now<session.start_at||now>session.end_at)
    throw Error('当前不在比赛计分时间内');
  const {cost,score,kinds,valid}=scoreQty(JSON.parse(session.items_json),qty);
  await env.DB.prepare(`INSERT INTO scores
    (player_id,session_id,qty_json,cost,score,is_valid,updated_at,finished_at)
    VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(player_id) DO UPDATE SET
      qty_json=excluded.qty_json,cost=excluded.cost,score=excluded.score,
      is_valid=excluded.is_valid,updated_at=excluded.updated_at,
      finished_at=excluded.finished_at
    WHERE scores.finished_at IS NULL`)
    .bind(player.id,session.id,JSON.stringify(qty),cost,score,valid?1:0,now,isFinal?now:null)
    .run();
  const saved=await env.DB.prepare('SELECT * FROM scores WHERE player_id=?').bind(player.id).first();
  return {score:saved?.score??0,cost:saved?.cost??0,valid:!!saved?.is_valid,
    finished:!!saved?.finished_at};
}
async function ranking(env, sessionId, limit=20) {
  return env.DB.prepare(`SELECT p.nickname,s.score,s.cost,s.finished_at,
    RANK() OVER (ORDER BY s.score DESC,s.cost ASC,COALESCE(s.finished_at,9999999999999) ASC) AS place
    FROM scores s JOIN players p ON p.id=s.player_id
    WHERE s.session_id=? AND s.is_valid=1
    ORDER BY s.score DESC,s.cost ASC,COALESCE(s.finished_at,9999999999999) ASC
    LIMIT ?`).bind(sessionId,limit).all();
}
async function stats(env, sessionId) {
  const a=await env.DB.prepare('SELECT COUNT(*) AS n FROM players WHERE session_id=?').bind(sessionId).first();
  const b=await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE session_id=?').bind(sessionId).first();
  const c=await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE session_id=? AND is_valid=1').bind(sessionId).first();
  return {joined:a?.n??0,submitted:b?.n??0,valid:c?.n??0};
}
async function handler(request, env) {
  if(!env.DB) return error('尚未绑定 D1 数据库（变量名 DB）',503,request);
  const url=new URL(request.url), path=url.pathname;
  if(path==='/api/health'&&request.method==='GET') return respond({ok:true,service:'snack-challenge-api',serverNow:Date.now()},200,request);
  if(path==='/api/session'&&request.method==='GET') {
    const code=url.searchParams.get('code');
    if(!validCode(code)) return error('请输入 6 位比赛口令',400,request);
    const s=await byCode(env,code);
    if(!s) return error('比赛口令不存在',404,request);
    return respond({ok:true,session:sessionPublic(s)},200,request);
  }
  if(path==='/api/join'&&request.method==='POST') {
    const {code,nickname,deviceId}=await readJSON(request);
    if(!validCode(code)) return error('比赛口令必须是 6 位数字',400,request);
    const name=typeof nickname==='string'?nickname.trim():'';
    if(!name||[...name].length>20||/[<>\r\n]/.test(name)) return error('昵称需要 1–20 个字符，不能包含尖括号或换行',400,request);
    if(!validId(deviceId)) return error('浏览器身份参数无效',400,request);
    const s=await byCode(env,code);
    if(!s) return error('比赛口令不存在',404,request);
    // 相同浏览器即使刷新，也可以恢复原来的身份。
    let p=await env.DB.prepare('SELECT * FROM players WHERE session_id=? AND device_id=?').bind(s.id,deviceId).first();
    if(p) return respond({ok:true,playerToken:p.token,nickname:p.nickname,session:sessionPublic(s)},200,request);
    if(derivePhase(s)!=='waiting') return error('入场已关闭，请联系教师',409,request);
    const token=`${id()}-${id()}`;
    try {
      await env.DB.prepare('INSERT INTO players(id,session_id,nickname,device_id,token,joined_at) VALUES(?,?,?,?,?,?)')
        .bind(id(),s.id,name,deviceId,token,Date.now()).run();
    } catch {
      p=await env.DB.prepare('SELECT * FROM players WHERE session_id=? AND device_id=?').bind(s.id,deviceId).first();
      if(!p) return error('入场人数较多，请稍后重新尝试',503,request);
      return respond({ok:true,playerToken:p.token,nickname:p.nickname,session:sessionPublic(s)},200,request);
    }
    return respond({ok:true,playerToken:token,nickname:name,session:sessionPublic(s)},200,request);
  }
  if((path==='/api/score'||path==='/api/finish')&&request.method==='POST') {
    const {playerToken,qty}=await readJSON(request);
    const p=await getPlayer(env,playerToken);
    if(!p) return error('身份已失效，请重新进入比赛',401,request);
    const s=await bySessionId(env,p.session_id);
    if(!s) return error('比赛不存在',404,request);
    try {
      const result=await saveScore(env,p,s,qty,path==='/api/finish');
      return respond({ok:true,...result},200,request);
    } catch(e) {return error(e.message,409,request);}
  }
  if(path==='/api/leaderboard'&&request.method==='GET') {
    const code=url.searchParams.get('code');
    if(!validCode(code)) return error('口令不正确',400,request);
    const s=await byCode(env,code);
    if(!s) return error('比赛不存在',404,request);
    if(derivePhase(s)!=='revealed') return error('教师尚未公布结果',403,request);
    const [rows,counts]=await Promise.all([ranking(env,s.id),stats(env,s.id)]);
    return respond({ok:true,leaders:rows.results,stats:counts,optimal:{score:s.optimal_score,combo:JSON.parse(s.optimal_combo_json)}},200,request);
  }
  if(path==='/api/me'&&request.method==='POST') {
    const {playerToken}=await readJSON(request);
    const p=await getPlayer(env,playerToken);
    if(!p) return error('没有找到你的参赛身份',401,request);
    const s=await bySessionId(env,p.session_id);
    if(derivePhase(s)!=='revealed') return error('尚未公布结果',403,request);
    const score=await env.DB.prepare('SELECT * FROM scores WHERE player_id=?').bind(p.id).first();
    if(!score?.is_valid) return respond({ok:true,rank:null,score:0,valid:false},200,request);
    const rank=await env.DB.prepare(`SELECT COUNT(*)+1 AS n FROM scores
      WHERE session_id=? AND is_valid=1 AND
        (score>? OR (score=? AND cost<?) OR
         (score=? AND cost=? AND COALESCE(finished_at,9999999999999)<?))`)
      .bind(s.id,score.score,score.score,score.cost,score.score,score.cost,score.finished_at??9999999999999).first();
    return respond({ok:true,rank:rank?.n??null,score:score.score,cost:score.cost,valid:true,
      optimalScore:s.optimal_score,scoreRate:Math.round(1000*score.score/s.optimal_score)/10},200,request);
  }
  if(path.startsWith('/api/admin/')) {
    if(!adminAuthorized(request,env)) return error('教师授权失败，请检查 ADMIN_TOKEN',401,request);
    if(path==='/api/admin/sessions'&&request.method==='GET') {
      const found=await env.DB.prepare('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 20').all();
      return respond({ok:true,sessions:found.results.map(s=>({...sessionPublic(s),optimalScore:s.optimal_score}))},200,request);
    }
    if(path==='/api/admin/create'&&request.method==='POST') {
      const data=await readJSON(request);
      const title=typeof data.title==='string'?data.title.trim().slice(0,70):'';
      if(!title) return error('请填写讲座名称',400,request);
      const game_date=todayCN();
      for(let trial=0;trial<10;trial++) {
        const code=rand6(),newId=id(),now=Date.now();
        const {items,optimal}=puzzleForDate(game_date);
        try {
          await env.DB.prepare(`INSERT INTO sessions
            (id,code,title,game_date,items_json,optimal_score,optimal_combo_json,created_at)
            VALUES(?,?,?,?,?,?,?,?)`).bind(newId,code,title,game_date,
              JSON.stringify(items),optimal.score,JSON.stringify(optimal.combo),now).run();
          return respond({ok:true,code,id:newId,title,game_date,optimalScore:optimal.score},200,request);
        } catch(e) {
          if(!String(e.message).includes('UNIQUE')) throw e;
        }
      }
      return error('口令创建失败，请重试',500,request);
    }
    if(path==='/api/admin/start'&&request.method==='POST') {
      const {sessionId}=await readJSON(request);
      const s=await bySessionId(env,sessionId);
      if(!s) return error('比赛不存在',404,request);
      if(derivePhase(s)!=='waiting') return error('本场比赛已开始，不可重复开赛',409,request);
      const start=Date.now()+COUNTDOWN_MS,end=start+GAME_MS;
      const update=await env.DB.prepare('UPDATE sessions SET start_at=?,end_at=? WHERE id=? AND start_at IS NULL')
        .bind(start,end,s.id).run();
      if(!update.meta?.changes) return error('比赛已开始',409,request);
      return respond({ok:true,startAt:start,endAt:end},200,request);
    }
    if(path==='/api/admin/reveal'&&request.method==='POST') {
      const {sessionId}=await readJSON(request);
      const s=await bySessionId(env,sessionId);
      if(!s) return error('比赛不存在',404,request);
      if(derivePhase(s)!=='ended'&&derivePhase(s)!=='revealed') return error('30 秒比赛尚未结束',409,request);
      await env.DB.prepare('UPDATE sessions SET revealed_at=COALESCE(revealed_at,?) WHERE id=?').bind(Date.now(),s.id).run();
      return respond({ok:true},200,request);
    }
    if(path==='/api/admin/leaderboard'&&request.method==='GET') {
      const sessionId=url.searchParams.get('id');
      const s=await bySessionId(env,sessionId);
      if(!s) return error('比赛不存在',404,request);
      const [rows,counts]=await Promise.all([ranking(env,s.id,100),stats(env,s.id)]);
      return respond({ok:true,leaders:rows.results,stats:counts,
        session:sessionPublic(s),optimal:{score:s.optimal_score,combo:JSON.parse(s.optimal_combo_json)}},200,request);
    }
  }
  return error('接口不存在',404,request);
}
export default {
  async fetch(request,env) {
    if(request.method==='OPTIONS') {
      const origin=request.headers.get('Origin');
      if(origin!==ORIGIN) return new Response(null,{status:403});
      return new Response(null,{status:204,headers:{
        'Access-Control-Allow-Origin':ORIGIN,
        'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers':'Content-Type,Authorization',
        'Access-Control-Max-Age':'600',
        'Vary':'Origin'
      }});
    }
    try {return await handler(request,env);}
    catch(e) {
      // 不将 D1/SQL 细节暴露给学生。
      console.error('API request failed',e);
      return error(e?.message?.startsWith('请求')?e.message:'服务器暂时出现问题，请稍后再试',500,request);
    }
  }
};
