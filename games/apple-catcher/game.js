/* Apple Catcher — browser port of lucky_bombs.pde. Self-contained Canvas 2D. */
'use strict';
const canvas = document.querySelector('#c'), ctx = canvas.getContext('2d');
const W = 850, H = 700, rand = (a,b)=>a+Math.random()*(b-a);
let objects=[], basketX=425, moveLeft=false, moveRight=false, pointerX=null;
let score=0,lives=3,gameOver=false,roulette=false,rouletteTimer=0,flashTimer=0;
let spawnTimer=0,luckyTimer=0,slowTimer=0,speedTimer=0,fewerBombsTimer=0,bigBombsTimer=0,bombRainTimer=0,fastFallTimer=0;
let effectMessage='',messageTimer=0,goodEffect=true,explosionX=-100,explosionY=-100,explosionTimer=0;
let frame=0,acc=0,last=0;
function reset(){objects=[];basketX=425;moveLeft=moveRight=false;pointerX=null;score=0;lives=3;gameOver=false;roulette=false;rouletteTimer=0;flashTimer=0;spawnTimer=0;luckyTimer=0;slowTimer=0;speedTimer=0;fewerBombsTimer=0;bigBombsTimer=0;bombRainTimer=0;fastFallTimer=0;messageTimer=0;explosionTimer=0;}
document.querySelector('#reset').addEventListener('click',reset);
function addObj(type){objects.push({x:rand(type===2?45:40,W-(type===2?45:40)),y:-40,type,speed:rand(3.2,5.2),angle:0});}
function effect(){goodEffect=true;switch(Math.floor(rand(0,8))){
case 0:score+=10;effectMessage='JACKPOT! +10 POINTS';break;
case 1:lives=Math.min(5,lives+1);effectMessage='EXTRA LIFE!';break;
case 2:slowTimer=600;effectMessage='SLOW FALL - 10 SEC';break;
case 3:speedTimer=600;effectMessage='SUPER SPEED - 10 SEC';break;
case 4:fewerBombsTimer=600;effectMessage='FEWER BOMBS - 10 SEC';break;
case 5:bigBombsTimer=600;goodEffect=false;effectMessage='BIG BOMBS - 10 SEC!';break;
case 6:bombRainTimer=300;goodEffect=false;effectMessage='BOMB RAIN - 5 SEC!';break;
case 7:fastFallTimer=600;goodEffect=false;effectMessage='FAST FALL - 10 SEC!';break;
}messageTimer=150;}
function tick(){frame++;
if(roulette){rouletteTimer++;flashTimer++;if(rouletteTimer>=120){roulette=false;effect();}return;}
if(!gameOver){
const speed=speedTimer>0?15:8;
if(pointerX!==null){const diff=pointerX-basketX;basketX+=Math.sign(diff)*Math.min(Math.abs(diff),speed*1.65);}else{if(moveLeft)basketX-=speed;if(moveRight)basketX+=speed;}
basketX=Math.max(60,Math.min(W-60,basketX));
if(++spawnTimer>=38){addObj(bombRainTimer>0?1:Math.random()<(fewerBombsTimer>0?.07:.23)?1:0);spawnTimer=0;}
if(++luckyTimer>=600){addObj(2);luckyTimer=0;}
for(let i=objects.length-1;i>=0;i--){const obj=objects[i];let v=obj.speed;if(slowTimer>0)v*=.55;if(fastFallTimer>0)v*=1.7;obj.y+=v;obj.angle+=.035;
const radius=obj.type===2?22:obj.type===1&&bigBombsTimer>0?33:18;
const caught=obj.y+radius>=590&&obj.y-radius<=630&&Math.abs(obj.x-basketX)<60+radius*.3;
if(caught){if(obj.type===0)score++;if(obj.type===1){lives--;explosionX=obj.x;explosionY=obj.y;explosionTimer=24;if(lives<=0)gameOver=true;}
if(obj.type===2){roulette=true;rouletteTimer=0;flashTimer=0;}
objects.splice(i,1);if(gameOver||roulette)break;
}else if(obj.y>740){if(obj.type===0)score--;objects.splice(i,1);}
}
if(slowTimer>0)slowTimer--;if(speedTimer>0)speedTimer--;if(fewerBombsTimer>0)fewerBombsTimer--;if(bigBombsTimer>0)bigBombsTimer--;if(bombRainTimer>0)bombRainTimer--;if(fastFallTimer>0)fastFallTimer--;
}
if(messageTimer>0)messageTimer--;if(explosionTimer>0)explosionTimer--;
}
function fill(color){ctx.fillStyle=color;}function stroke(color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;}function rect(x,y,w,h,r=0){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}function ellipse(x,y,w,h){ctx.beginPath();ctx.ellipse(x,y,w/2,h/2,0,0,Math.PI*2);ctx.fill();}
function line(x,y,xx,yy){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();}function txt(t,x,y,size=20,color='#fff',align='center'){ctx.textAlign=align;ctx.textBaseline='middle';ctx.font=`bold ${size}px system-ui,sans-serif`;fill(color);ctx.fillText(t,x,y);}function polygon(coords){ctx.beginPath();ctx.moveTo(coords[0],coords[1]);for(let i=2;i<coords.length;i+=2)ctx.lineTo(coords[i],coords[i+1]);ctx.closePath();ctx.fill();}
function background(){fill('#82cdf8');ctx.fillRect(0,0,W,H);fill('#ffffff80');ellipse(130,100,190,65);ellipse(620,125,220,70);ellipse(420,60,140,40);fill('#69be6e');ellipse(170,750,700,260);ellipse(680,750,720,260);fill('#4ba050');ctx.fillRect(0,665,W,35);}
function basket(){ctx.save();ctx.translate(basketX,605);fill('#1e50284b');ellipse(0,50,130,18);stroke('#78461e',9);ctx.beginPath();ctx.ellipse(0,-5,50,47.5,0,Math.PI,Math.PI*2);ctx.stroke();fill('#9b551e');polygon([-60,-15,60,-15,45,40,-45,40]);fill('#d79146');polygon([-53,-12,53,-12,39,32,-39,32]);stroke('#915523',3);for(let i=-36;i<=36;i+=18)line(i-8,-10,i+8,30);for(let j=0;j<3;j++)line(-48+j*3,j*13-5,48-j*3,j*13-5);fill('#6e3c19');rect(-62,-18,124,13,7);ctx.restore();}
function apple(){fill('#be1e23');ellipse(-10,3,29,34);ellipse(10,3,29,34);fill('#f53c32');ellipse(0,6,36,34);fill('#ffa08c91');ellipse(-10,-3,9,14);stroke('#643c14',4);line(0,-11,3,-22);fill('#41a541');ellipse(12,-18,19,9);}
function bomb(){ctx.save();if(bigBombsTimer>0)ctx.scale(1.8,1.8);fill('#731919');rect(-21,-16,42,40,7);fill('#eb3730');rect(-17,-20,34,40,6);fill('#ffb946');rect(-17,-2,34,9);stroke('#414141',3);line(0,-20,4,-32);fill('#ffdc2d');ellipse(4,-34,12,12);fill('#ff8214');ellipse(4,-34,6,6);ctx.restore();}
function lucky(){fill('#ffe1374b');ellipse(0,0,65,65);fill('#ffbe1e');rect(-22,-22,44,44,7);stroke('#965c0a',4);ctx.strokeRect(-22,-22,44,44);fill('#ffe65a');rect(-17,-17,34,34,4);txt('?',0,-2,31,'#91500a');fill('#fff');ellipse(-15,-15,5,5);ellipse(15,15,5,5);}
function drawObjects(){for(const o of objects){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(Math.sin(o.angle)*.12);if(o.type===0)apple();else if(o.type===1)bomb();else lucky();ctx.restore();}}
function heart(x,y,s,col){fill(col);ctx.beginPath();ctx.moveTo(x,y+s);ctx.bezierCurveTo(x-2*s,y,x-s,y-1.3*s,x,y-.5*s);ctx.bezierCurveTo(x+s,y-1.3*s,x+2*s,y,x,y+s);ctx.fill();}
function ui(){fill('#19374bc3');rect(625,18,205,65,18);txt('SCORE: '+score,727,49,27);fill('#19374bc3');rect(20,18,315,65,18);for(let i=0;i<Math.max(3,lives);i++)heart(55+i*55,49,14,i<lives?'#ff3c5a':'#646e78');let y=98;for(const [timer,label,bad] of [[slowTimer,'SLOW FALL',false],[speedTimer,'SUPER SPEED',false],[fewerBombsTimer,'FEWER BOMBS',false],[bigBombsTimer,'BIG BOMBS',true],[bombRainTimer,'BOMB RAIN',true],[fastFallTimer,'FAST FALL',true]]){if(timer>0){txt(`${label}: ${Math.ceil(timer/60)}s`,22,y,16,bad?'#af2323':'#19734b','left');y+=23;}}}
function explosion(){if(explosionTimer<=0)return;const radius=(25-explosionTimer)*5+15;fill(`rgba(255,115,0,${Math.min(1,explosionTimer*9/255)})`);ellipse(explosionX,explosionY,radius*2,radius*2);fill(`rgba(255,230,40,${Math.min(1,explosionTimer*8/255)})`);ellipse(explosionX,explosionY,radius,radius);}
function rouletteView(){fill('#050a19be');ctx.fillRect(0,0,W,H);txt('LUCKY BLOCK!',W/2,175,45,'#ffdc4b');txt('MYSTERY REWARD...',W/2,230,21);ctx.save();ctx.translate(W/2,355);const size=100+Math.sin(frame*.25)*12;fill(Math.floor(flashTimer/7)%2===0?'#000':'#50505f');rect(-size/2,-size/2,size,size,15);stroke('#ffd223',5);ctx.strokeRect(-size/2,-size/2,size,size);txt('?',0,-5,65);ctx.restore();txt('ROLLING'+'.'.repeat(Math.floor(rouletteTimer/15)%4),W/2,480,30);}
function gameOverView(){fill('#0a1928d2');ctx.fillRect(0,0,W,H);txt('GAME OVER',W/2,275,65,'#ff5f64');txt('FINAL SCORE: '+score,W/2,355,32);txt('PRESS SPACE TO RESTART',W/2,425,23);}
function render(){background();drawObjects();basket();ui();explosion();if(messageTimer>0&&!roulette){fill(goodEffect?'#19874bdc':'#be2d2de1');rect(175,110,500,60,16);txt(effectMessage,W/2,140,26);}if(roulette)rouletteView();if(gameOver)gameOverView();}
function animate(time){if(!last)last=time;acc+=Math.min(60,time-last);last=time;while(acc>=1000/60){tick();acc-=1000/60;}render();requestAnimationFrame(animate);}requestAnimationFrame(animate);
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='ArrowLeft'){moveLeft=true;pointerX=null;}if(e.code==='ArrowRight'){moveRight=true;pointerX=null;}if(e.code==='Space'&&gameOver)reset();});window.addEventListener('keyup',e=>{if(e.code==='ArrowLeft')moveLeft=false;if(e.code==='ArrowRight')moveRight=false;});window.addEventListener('blur',()=>{moveLeft=moveRight=false;pointerX=null;});
function touchMove(e){const r=canvas.getBoundingClientRect();pointerX=(e.clientX-r.left)*W/r.width;pointerX=Math.max(60,Math.min(W-60,pointerX));}canvas.addEventListener('pointerdown',e=>{touchMove(e);canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)touchMove(e);});canvas.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')pointerX=null;});canvas.addEventListener('pointercancel',()=>pointerX=null);
for(const [id,key] of [['left','moveLeft'],['right','moveRight']]){const b=document.getElementById(id);const set=v=>{if(key==='moveLeft')moveLeft=v;else moveRight=v;pointerX=null;};b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);set(true);});b.addEventListener('pointerup',()=>set(false));b.addEventListener('pointercancel',()=>set(false));}
