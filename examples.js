const GAME_EXAMPLES = {
  maze: {
    name: 'Maze',
    code: `// Maze explorer — collect all coins (*). r=reset
G.init({ cols: 21, rows: 15, tileSize: 24, fps: 15 });
G.tiles = {
  '#': { bg: '#3a4a5c', passable: false },
  '.': { bg: '#111' },
  '@': { bg: '#111', fg: '#4af', ch: '@' },
  '*': { bg: '#111', fg: '#fd0', ch: '*' },
};
const MAP = [
  '#####################',
  '#*..#.....#.....#..*#',
  '#.#.#.###.#.###.#.#.#',
  '#.#...#.......#...#.#',
  '#.#####.#####.#####.#',
  '#.......#...#.......#',
  '#.#####.#.#.#.#####.#',
  '#.#...#...#...#..*#.#',
  '#.#.#.#########.###.#',
  '#*..#.....@.......#*#',
  '#.###.###.###.###.#.#',
  '#.#...#.......#...#.#',
  '#.#.###.#####.#.###.#',
  '#...............#..*#',
  '#####################',
];
const s = G.state;
function reset() {
  G.map = MAP.map(r => r);
  s.px = 10; s.py = 9; s.coins = 0;
  s.total = G.countCell('*');
}
reset();
G.onKey = key => {
  if (s.coins === s.total) { if (key==='r'||key==='ArrowRight') reset(); return; }
  if (key === 'r') { reset(); return; }
  const d = G.dirFromKey(key);
  if (!d) return;
  const nx = s.px + d.dx, ny = s.py + d.dy;
  if (!G.isPassable(nx, ny)) return;
  G.setCell(s.px, s.py, '.');
  if (G.getCell(nx, ny) === '*') { s.coins++; G.beep(s.coins===s.total?880:660,0.1); }
  s.px = nx; s.py = ny;
  G.setCell(s.px, s.py, '@');
};
G.onDraw = () => {
  const won = s.coins === s.total;
  G.text(4, 4, won ? 'YOU WIN!  r/▶ restart' : \`Coins: \${s.coins}/\${s.total}  r=reset\`, won ? '#4f4' : '#fff', 13);
};
G.start();`,
  },

  snake: {
    name: 'Snake',
    code: `// Snake — eat food, avoid walls & self; r/▶ restarts
G.init({ cols: 20, rows: 16, tileSize: 24, fps: 5 });
G.tiles = {
  '#': { bg: '#2d4a1e', passable: false },
  '.': { bg: '#111' },
  'O': { bg: '#3a8c1e', fg: '#6cf', ch: 'O', passable: false },
  'o': { bg: '#3a8c1e', fg: '#4af', ch: 'o', passable: false },
  'F': { bg: '#111', fg: '#f64', ch: 'F' },
};
const s = G.state;
function reset() {
  G.map = G.borderedMap(20, 16);
  s.body = [{x:10,y:8},{x:9,y:8},{x:8,y:8}];
  s.dir = {x:1,y:0}; s.next = {x:1,y:0};
  s.alive = true; s.score = 0;
  s.body.forEach((p,i) => G.setCell(p.x, p.y, i===0?'O':'o'));
  const {x,y} = G.randomEmpty(); G.setCell(x, y, 'F');
}
reset();
G.onKey = key => {
  if (!s.alive) { if (key==='r'||key==='ArrowRight') reset(); return; }
  const d = G.dirFromKey(key);
  if (d && (d.dx ? !s.dir.x : !s.dir.y)) s.next = {x:d.dx, y:d.dy};
};
G.onUpdate = () => {
  if (!s.alive) return;
  s.dir = s.next;
  const head = s.body[0];
  const nx = head.x + s.dir.x, ny = head.y + s.dir.y;
  const cell = G.getCell(nx, ny);
  if (cell==='#'||cell==='O'||cell==='o') { s.alive=false; G.beep(110,0.3,'sawtooth'); return; }
  const ate = cell === 'F';
  const tail = s.body[s.body.length-1];
  if (!ate) { G.setCell(tail.x, tail.y, '.'); s.body.pop(); }
  else { s.score++; const {x,y}=G.randomEmpty(); G.setCell(x,y,'F'); G.beep(660,0.1,'sine'); }
  G.setCell(head.x, head.y, 'o');
  s.body.unshift({x:nx, y:ny});
  G.setCell(nx, ny, 'O');
};
G.onDraw = () => {
  const msg = s.alive ? \`Score: \${s.score}\` : \`GAME OVER — \${s.score}pts — r/▶\`;
  G.text(4, 4, msg, s.alive?'#fff':'#f64', 13);
};
G.start();`,
  },

  sokoban: {
    name: 'Sokoban',
    code: `// Sokoban — 4 levels. Push boxes onto targets. ▶=next level r=reset
G.init({ cols: 10, rows: 8, tileSize: 30, fps: 15 });
G.tiles = {
  '#': { bg: '#334', passable: false },
  '.': { bg: '#111' },
  '*': { bg: '#111', fg: '#f80', ch: '●' },
  '@': { bg: '#111', fg: '#4af', ch: '@' },
  '+': { bg: '#111', fg: '#4af', ch: '@' },
  'B': { bg: '#321', fg: '#fa0', ch: '■' },
  'X': { bg: '#121', fg: '#4f4', ch: '■' },
};
const LEVELS = [
  ['##########','#........#','#..*.*...#','#..B.B...#','#...@....#','#........#','#........#','##########'],
  ['##########','#........#','#.*....*.#','#.B....B.#','#...#....#','#...@....#','#........#','##########'],
  ['##########','#........#','#.##.##..#','#.#*.*#..#','#.#B.B#..#','#...@....#','#........#','##########'],
  ['##########','#....#...#','#.*..*...#','#.B..B...#','#...#....#','#...@....#','#.....B*.#','##########'],
];
const s = G.state; s.level = 0;
function load(n) { G.map = LEVELS[n].map(r=>r); s.moves = 0; }
load(0);
G.onKey = key => {
  if (key==='r') { load(s.level); return; }
  const won = !G.map.join('').includes('B');
  if (won) {
    if (key==='ArrowRight') { s.level=(s.level+1)%LEVELS.length; load(s.level); }
    return;
  }
  const d = G.dirFromKey(key);
  if (!d) return;
  const {dx, dy} = d;
  const {x:px, y:py} = G.findCell('@') ?? G.findCell('+');
  const nx=px+dx,ny=py+dy,nc=G.getCell(nx,ny);
  if(nc==='#') return;
  if(nc==='B'||nc==='X'){
    const bx=nx+dx,by=ny+dy,bc=G.getCell(bx,by);
    if(bc==='#'||bc==='B'||bc==='X') return;
    G.setCell(bx,by,bc==='*'?'X':'B');
    G.beep(bc==='*'?660:220,0.08);
    G.setCell(nx,ny,nc==='X'?'*':'.');
  }
  G.setCell(px,py,G.getCell(px,py)==='+'?'*':'.');
  G.setCell(nx,ny,G.getCell(nx,ny)==='*'?'+':'@');
  s.moves++;
  if(!G.map.join('').includes('B'))G.beep(880,0.3,'sine');
};
G.onDraw = () => {
  const won=!G.map.join('').includes('B'),last=s.level===LEVELS.length-1;
  G.text(4,4,won?(last?'ALL DONE! ▶ restart':\`Lv\${s.level+1} done! ▶ next\`):\`Lv\${s.level+1}  Moves:\${s.moves}  r=reset\`,won?'#4f4':'#fff',12);
};
G.start();`,
  },

  flood: {
    name: 'Flood',
    code: `// Flood — fill the whole board in 25 moves.
// Each arrow picks a color to flood-fill from the top-left corner.
G.init({ cols: 12, rows: 14, tileSize: 20, fps: 20 });
const GH=12,GW=12,MAX=25;
const COLS={ArrowLeft:'#e44',ArrowUp:'#4af',ArrowDown:'#4c4',ArrowRight:'#fa0'};
const s=G.state;
function rnd(){return Object.values(COLS)[Math.floor(Math.random()*4)];}
function newGrid(){return Array.from({length:GH},()=>Array.from({length:GW},rnd));}
s.g=newGrid(); s.moves=0;
function isWon(){const c=s.g[0][0];return s.g.every(r=>r.every(v=>v===c));}
function flood(nc){
  const oc=s.g[0][0]; if(nc===oc)return;
  const q=[[0,0]],vis=Array.from({length:GH},()=>new Uint8Array(GW));
  vis[0][0]=1;
  while(q.length){
    const[r,c]=q.shift(); s.g[r][c]=nc;
    for(const[dr,dc]of[[-1,0],[1,0],[0,-1],[0,1]]){
      const nr=r+dr,nc2=c+dc;
      if(nr>=0&&nr<GH&&nc2>=0&&nc2<GW&&!vis[nr][nc2]&&s.g[nr][nc2]===oc){
        vis[nr][nc2]=1; q.push([nr,nc2]);
      }
    }
  }
  s.moves++;
}
G.onKey=key=>{
  if(key==='r'){s.g=newGrid();s.moves=0;return;}
  if(!COLS[key])return;
  if(isWon()||s.moves>=MAX){s.g=newGrid();s.moves=0;return;}
  flood(COLS[key]);
  isWon()?G.beep(880,0.2,'sine'):G.beep(440,0.05);
};
G.onDraw=ctx=>{
  const t=G.tileSize;
  for(let r=0;r<GH;r++)for(let c=0;c<GW;c++){
    ctx.fillStyle=s.g[r][c]; ctx.fillRect(c*t+1,r*t+1,t-2,t-2);
  }
  const y0=GH*t+5,won=isWon(),lost=!won&&s.moves>=MAX;
  if(won){G.text(4,y0,'YOU WIN!  r/▶ = new game','#4f4',11);return;}
  if(lost){G.text(4,y0,'Out of moves!  r/▶ = new','#f64',11);return;}
  G.text(4,y0,\`Moves: \${s.moves}/\${MAX}\`,'#fff',11);
  const sy=y0+16;
  [['#e44','◀'],['#4af','▲'],['#4c4','▼'],['#fa0','▶']].forEach(([c,lbl],i)=>{
    ctx.fillStyle=c; ctx.fillRect(4+i*58,sy,50,11);
    G.text(20+i*58,sy+13,lbl,c,10);
  });
};
G.start();`,
  },

  invaders: {
    name: 'Invaders',
    code: `// Space Invaders — arrows to move, Space to shoot; r/▶=retry on end
G.init({ cols: 20, rows: 16, tileSize: 20, fps: 12 });
const W=G.cols*G.tileSize, H=G.rows*G.tileSize, s=G.state;
function reset() {
  s.px=9; s.bullet=null; s.bombs=[];
  s.invaders=[];
  for(let r=0;r<3;r++) for(let c=0;c<8;c++) s.invaders.push({x:2+c*2,y:1+r});
  s.dx=1; s.tick=0; s.score=0; s.alive=true;
}
reset();
G.onKey=key=>{
  if(!s.alive||!s.invaders.length){if(key==='r'||key==='ArrowRight')reset();return;}
  const d=G.dirFromKey(key);
  if(d&&d.dx)s.px=Math.max(0,Math.min(G.cols-1,s.px+d.dx));
  if((key===' '||key==='ArrowUp')&&!s.bullet){s.bullet={x:s.px,y:G.rows-2};G.beep(440,0.08,'square');}
};
G.onUpdate=()=>{
  if(!s.alive||!s.invaders.length)return;
  s.tick++;
  if(s.bullet){
    s.bullet.y--;
    if(s.bullet.y<0){s.bullet=null;}
    else{
      const i=s.invaders.findIndex(v=>v.x===s.bullet.x&&v.y===s.bullet.y);
      if(i>=0){s.invaders.splice(i,1);s.bullet=null;s.score+=10;G.beep(220,0.12,'sawtooth');}
    }
  }
  s.bombs=s.bombs.map(b=>({...b,y:b.y+1})).filter(b=>b.y<G.rows);
  if(s.bombs.some(b=>b.x===s.px&&b.y===G.rows-1)){s.alive=false;G.beep(110,0.3,'sawtooth');}
  if(s.tick%12===0){
    const inv=s.invaders[Math.floor(Math.random()*s.invaders.length)];
    s.bombs.push({x:inv.x,y:inv.y+1});
  }
  if(s.tick%6===0){
    const edge=s.invaders.some(i=>(s.dx>0&&i.x>=G.cols-1)||(s.dx<0&&i.x<=0));
    if(edge){s.dx*=-1;s.invaders.forEach(i=>i.y++);}
    else s.invaders.forEach(i=>i.x+=s.dx);
    if(s.invaders.some(i=>i.y>=G.rows-1)){s.alive=false;G.beep(110,0.3,'sawtooth');}
  }
};
G.onDraw=ctx=>{
  const t=G.tileSize;
  ctx.fillStyle='#4af';ctx.fillRect(s.px*t,(G.rows-1)*t,t,t);
  if(s.bullet){ctx.fillStyle='#ff4';ctx.fillRect(s.bullet.x*t+t/2-2,s.bullet.y*t,4,t);}
  ctx.fillStyle='#f84';s.bombs.forEach(b=>ctx.fillRect(b.x*t+t/2-2,b.y*t,4,t));
  ctx.fillStyle='#f64';s.invaders.forEach(i=>ctx.fillRect(i.x*t+2,i.y*t+2,t-4,t-4));
  G.text(4,4,\`Score: \${s.score}\`,'#fff',12);
  if(!s.alive)G.text(W/2-80,H/2,'GAME OVER  r/▶=retry','#f64',16);
  if(s.alive&&!s.invaders.length)G.text(W/2-70,H/2,'YOU WIN!  r/▶=retry','#4f4',16);
};
G.start();`,
  },

  flappy: {
    name: 'Flappy',
    code: `// Flappy — tap any key to flap, avoid the pipes
G.init({ cols: 20, rows: 15, tileSize: 24, fps: 15 });
G.tiles = { '.': { bg: '#7cf' } };
G.map = Array(15).fill('.'.repeat(20));

const s = G.state;
function reset() {
  s.y = 7; s.vy = 0; s.pipes = []; s.tick = 0; s.score = 0; s.alive = true;
}
reset();

G.onKey = key => {
  if (!s.alive) { if (key==='r'||key==='ArrowRight') reset(); return; }
  s.vy = -1.1; G.beep(330, 0.06, 'square');
};

G.onUpdate = () => {
  if (!s.alive) return;
  s.tick++;
  if (s.tick % 20 === 0) s.pipes.push({ x: 19, gap: 4 + Math.floor(Math.random() * 6) });
  s.vy += 0.2; s.y += s.vy;
  s.pipes = s.pipes.filter(p => --p.x > -2);
  for (const p of s.pipes) {
    if (p.x === 2) { s.score++; G.beep(660, 0.08, 'sine'); }
    if (p.x === 2 && (s.y < p.gap || s.y > p.gap + 3)) { s.alive = false; G.beep(110,0.25,'sawtooth'); return; }
  }
  if (s.y < 0 || s.y > 14) { s.alive = false; G.beep(110,0.25,'sawtooth'); }
};

G.onDraw = ctx => {
  const t = G.tileSize;
  ctx.fillStyle = '#fd0';
  ctx.fillRect(2 * t + 3, s.y * t + 3, t - 6, t - 6);
  ctx.fillStyle = '#3c3';
  for (const p of s.pipes) {
    ctx.fillRect(p.x * t, 0, t - 4, p.gap * t);
    ctx.fillRect(p.x * t, (p.gap + 4) * t, t - 4, G.rows * t);
  }
  G.text(4, 4, \`Score: \${s.score}\`, '#fff', 13);
  if (!s.alive) G.text(60, 188, 'GAME OVER — r/▶ restart', '#f64', 14);
};

G.start();`,
  },

  pong: {
    name: 'Pong',
    code: `// Pong — ↑/↓ move your paddle (blue), beat the AI (red); r/▶=restart
G.init({ cols: 20, rows: 15, tileSize: 24, fps: 15 });
G.tiles = { '.': { bg: '#111' } };
G.map = Array(15).fill('.'.repeat(20));
const s = G.state;

function reset() {
  s.py = 6; s.ay = 6;
  s.bx = 10; s.by = 7;
  s.vx = 1; s.vy = 1;
  s.score = 0; s.alive = true;
}
reset();

G.onKey = key => {
  if (!s.alive) { if (key === 'r' || key === 'ArrowRight') reset(); return; }
  if (key === 'ArrowUp')   s.py = Math.max(0, s.py - 2);
  if (key === 'ArrowDown') s.py = Math.min(12, s.py + 2);
};

G.onUpdate = () => {
  if (!s.alive) return;
  s.ay += s.by > s.ay + 1 ? 1 : s.by < s.ay + 1 ? -1 : 0;
  s.bx += s.vx; s.by += s.vy;
  if (s.by < 0 || s.by > 14) { s.vy *= -1; G.beep(440, 0.05); }
  if (s.bx === 1  && s.by >= s.py && s.by < s.py + 3) { s.vx = 1;  s.score++; G.beep(660, 0.05); }
  if (s.bx === 18 && s.by >= s.ay && s.by < s.ay + 3) { s.vx = -1; G.beep(660, 0.05); }
  if (s.bx < 0 || s.bx > 19) { s.alive = false; G.beep(110, 0.3, 'sawtooth'); }
};

G.onDraw = () => {
  for (let i = 0; i < 3; i++) {
    G.fillTile(0,  s.py + i, '#4af');
    G.fillTile(19, s.ay + i, '#f44');
  }
  G.fillTile(s.bx, s.by, '#fd0');
  G.text(4, 4, \`Score: \${s.score}\`, '#fff', 13);
  if (!s.alive) G.text(60, 188, 'GAME OVER — r/▶ restart', '#f44', 14);
};

G.start();`,
  },

  new: {
    name: 'New',
    code: `// Your game — edit tiles, map, and logic below

G.init({ cols: 20, rows: 15, tileSize: 24, fps: 15 });

G.tiles = {
  '#': { bg: '#334', passable: false },
  '.': { bg: '#111' },
  '@': { bg: '#111', fg: '#4af', ch: '@' },
};

G.map = G.borderedMap(20, 15);

const s = G.state;
s.x = 10; s.y = 7;
G.setCell(s.x, s.y, '@');

G.onKey = key => {
  const d = G.dirFromKey(key);
  if (!d) return;
  const nx = s.x + d.dx, ny = s.y + d.dy;
  if (!G.isPassable(nx, ny)) return;
  G.setCell(s.x, s.y, '.');
  s.x = nx; s.y = ny;
  G.setCell(s.x, s.y, '@');
};

G.onUpdate = () => {};

G.onDraw = ctx => {};

G.start();`,
  },
};
