"use strict";
// Browser adaptation of sketchpiponGPT.pde. All coordinates use the original 800 × 800 playfield.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const held = new Set();
const GAME_DURATION = 300000;
const PADDLE_H = 150, PADDLE_SPEED = 600, BALL_RADIUS = 25;
let audioContext = null, previous = performance.now();
let game;
function restart() {
  game = {x:400,y:400,vx:360,vy:240,left:325,right:325,red:0,blue:0,elapsed:0,over:false};
  held.clear(); previous=performance.now(); canvas.focus({preventScroll:true});
}
function sound(freq,duration) {
  try {
    audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime;
    o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.13,t);
    g.gain.exponentialRampToValueAtTime(.001,t+duration);
    o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+duration+.01);
  } catch(e) { /* Audio is optional. */ }
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function tick(dt){
  if(game.over)return;
  game.elapsed=Math.min(GAME_DURATION,game.elapsed+dt*1000);
  if(game.elapsed>=GAME_DURATION){game.over=true;return;}
  if(held.has('w'))game.left-=PADDLE_SPEED*dt;
  if(held.has('s'))game.left+=PADDLE_SPEED*dt;
  if(held.has('ArrowUp'))game.right-=PADDLE_SPEED*dt;
  if(held.has('ArrowDown'))game.right+=PADDLE_SPEED*dt;
  game.left=clamp(game.left,0,650);game.right=clamp(game.right,0,650);
  game.x+=game.vx*dt;game.y+=game.vy*dt;
  if(game.y+BALL_RADIUS>=800){game.y=800-BALL_RADIUS;game.vy=-Math.abs(game.vy);}
  if(game.y-BALL_RADIUS<=0){game.y=BALL_RADIUS;game.vy=Math.abs(game.vy);}
  if(game.vx<0&&game.x-BALL_RADIUS<=45&&game.x+BALL_RADIUS>=20&&game.y+BALL_RADIUS>=game.left&&game.y-BALL_RADIUS<=game.left+PADDLE_H){game.vx=Math.abs(game.vx);game.x=70;sound(700,.12);}
  if(game.vx>0&&game.x+BALL_RADIUS>=755&&game.x-BALL_RADIUS<=780&&game.y+BALL_RADIUS>=game.right&&game.y-BALL_RADIUS<=game.right+PADDLE_H){game.vx=-Math.abs(game.vx);game.x=730;sound(700,.12);}
  // Preserve original Processing scoring: the red player scores on the right side.
  if(game.x>825){game.red++;game.x=400;game.y=400;game.vx=-360;game.vy=240;sound(250,.3);}
  if(game.x< -25){game.blue++;game.x=400;game.y=400;game.vx=360;game.vy=240;sound(250,.3);}
}
function draw(){
  ctx.fillStyle='#09c9e2';ctx.fillRect(0,0,800,800);
  ctx.strokeStyle='#f7ffff';ctx.lineWidth=7;ctx.setLineDash([25,18]);ctx.beginPath();ctx.moveTo(400,0);ctx.lineTo(400,800);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#ff173b';ctx.fillRect(20,game.left,25,PADDLE_H);
  ctx.fillStyle='#124eff';ctx.fillRect(755,game.right,25,PADDLE_H);
  ctx.beginPath();ctx.fillStyle='#ff2de6';ctx.arc(game.x,game.y,BALL_RADIUS,0,Math.PI*2);ctx.fill();
  ctx.textAlign='center';ctx.font='bold 54px system-ui';ctx.fillStyle='#e90020';ctx.fillText(String(game.red),300,72);ctx.fillStyle='#123fe7';ctx.fillText(String(game.blue),500,72);
  const remaining=Math.ceil((GAME_DURATION-game.elapsed)/1000);
  ctx.font='bold 42px system-ui';ctx.fillStyle='#091529';ctx.fillText(String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0'),400,755);
  if(game.over){ctx.fillStyle='rgba(2,12,29,.77)';ctx.fillRect(0,300,800,235);ctx.textAlign='center';ctx.font='bold 76px system-ui';ctx.fillStyle=game.red>game.blue?'#ff354f':game.blue>game.red?'#64a5ff':'#ffffff';ctx.fillText(game.red>game.blue?'RED WINS!':game.blue>game.red?'BLUE WINS!':'DRAW!',400,404);ctx.fillStyle='#fff';ctx.font='28px system-ui';ctx.fillText('R — сыграть ещё раз',400,465);}
}
function loop(now){const dt=Math.min((now-previous)/1000,.04);previous=now;tick(dt);draw();requestAnimationFrame(loop);}
const keys=new Set(['w','s','ArrowUp','ArrowDown']);
function normalize(k){return k.length===1?k.toLowerCase():k;}
window.addEventListener('keydown',e=>{const k=normalize(e.key);if(keys.has(k)){held.add(k);e.preventDefault();}if(k==='r'){restart();e.preventDefault();}});
window.addEventListener('keyup',e=>{held.delete(normalize(e.key));});
window.addEventListener('blur',()=>held.clear());
document.addEventListener('visibilitychange',()=>{held.clear();previous=performance.now();});
for(const b of document.querySelectorAll('[data-k]')){
  const k=b.dataset.k;
  const start=e=>{e.preventDefault();held.add(k);b.setPointerCapture?.(e.pointerId);};
  const stop=e=>{e.preventDefault();held.delete(k);};
  b.addEventListener('pointerdown',start);b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);b.addEventListener('lostpointercapture',()=>held.delete(k));
}
document.getElementById('restart').addEventListener('click',restart);
restart();requestAnimationFrame(loop);
