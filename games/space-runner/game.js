(() => {
  'use strict';
  // Browser adaptation of spaceXshooter.pde. All art and sounds are generated in code.
  const canvas=document.getElementById('game'), ctx=canvas.getContext('2d');
  const W=1000,H=650,TAU=Math.PI*2;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  let meteors=[],junks=[],lasers=[],particles=[],stars=[];
  let ship={x:110,y:325},targetY=325,score=0,lives=3,frames=0,invincible=0,over=false,shooting=false;
  let last=0,acc=0,audio=null;
  function sound(kind){
    try{
      audio ||= new (window.AudioContext||window.webkitAudioContext)();
      if(audio.state==='suspended')audio.resume();
      const t=audio.currentTime,d=kind==='explosion'?.27:kind==='collect'?.17:.09;
      const gain=audio.createGain();gain.gain.setValueAtTime(.11,t);gain.gain.exponentialRampToValueAtTime(.001,t+d);
      gain.connect(audio.destination);
      if(kind==='explosion'){
        const samples=Math.round(audio.sampleRate*d),buf=audio.createBuffer(1,samples,audio.sampleRate),arr=buf.getChannelData(0);
        for(let i=0;i<samples;i++){const f=i/samples;arr[i]=(Math.random()*2-1)*Math.pow(1-f,1.5)*.55+Math.sin(i/audio.sampleRate*TAU*(110-55*f))*.3;}
        const n=audio.createBufferSource();n.buffer=buf;n.connect(gain);n.start(t);n.stop(t+d);
      }else{
        const o=audio.createOscillator();o.type='sine';o.frequency.setValueAtTime(kind==='collect'?850:650,t);
        o.frequency.exponentialRampToValueAtTime(kind==='collect'?1350:320,t+d);o.connect(gain);o.start(t);o.stop(t+d);
      }
    }catch(e){} // Audio is optional, including in privacy-restricted browsers.
  }
  const star=()=>({x:rnd(0,W),y:rnd(0,H),speed:rnd(.5,3.5),r:rnd(1,3)});
  function reset(){meteors=[];junks=[];lasers=[];particles=[];stars=Array.from({length:150},star);ship.y=H/2;targetY=ship.y;score=0;lives=3;frames=0;invincible=0;over=false;shooting=false;acc=0;}
  function particlesAt(x,y,c,n){for(let i=0;i<n;i++)particles.push({x,y,vx:rnd(-5,5),vy:rnd(-5,5),life:255,c});}
  function meteor(){return {x:W+70,y:rnd(45,H-45),r:rnd(20,38),speed:rnd(3.2,6)+Math.min(score*.035,3),angle:rnd(0,TAU),spin:rnd(-.035,.035),shape:Array.from({length:10},()=>rnd(.75,1.15))};}
  function junk(){return {x:W+40,y:rnd(45,H-45),speed:rnd(2.5,4.2),angle:rnd(0,TAU),type:Math.floor(rnd(0,3))};}
  function step(){
    for(const s of stars){s.x-=s.speed;if(s.x<0){s.x=W;s.y=rnd(0,H);}}
    if(over){updateParticles();return;}
    frames++;ship.y+=(targetY-ship.y)*.20;if(invincible>0)invincible--;
    if(frames%42===0)meteors.push(meteor());
    if(frames%65===0)junks.push(junk());
    if(shooting&&frames%10===0){lasers.push({x:ship.x+42,y:ship.y});sound('laser');particlesAt(ship.x+42,ship.y,'#00dcff',3);}
    for(let i=lasers.length-1;i>=0;i--){lasers[i].x+=13;if(lasers[i].x>W+30)lasers.splice(i,1);}
    for(let i=meteors.length-1;i>=0;i--){
      const m=meteors[i];m.x-=m.speed;m.angle+=m.spin;
      let destroyed=false;
      for(let j=lasers.length-1;j>=0;j--){if(distance(lasers[j],m)<m.r+8){sound('explosion');particlesAt(m.x,m.y,'#ff8228',25);lasers.splice(j,1);meteors.splice(i,1);score++;destroyed=true;break;}}
      if(destroyed)continue;
      if(invincible===0&&distance(ship,m)<m.r+24){lives--;score=Math.max(0,score-1);invincible=85;sound('explosion');particlesAt(ship.x,ship.y,'#ff501e',30);meteors.splice(i,1);if(lives<=0){over=true;shooting=false;}continue;}
      if(m.x< -100)meteors.splice(i,1);
    }
    for(let i=junks.length-1;i>=0;i--){const j=junks[i];j.x-=j.speed;j.angle+=.025;if(distance(ship,j)<33){score++;sound('collect');particlesAt(j.x,j.y,'#00ffb4',15);junks.splice(i,1);continue;}if(j.x< -50)junks.splice(i,1);}
    updateParticles();
  }
  function updateParticles(){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.97;p.vy*=.97;p.life-=7;if(p.life<=0)particles.splice(i,1);}}
  function ellipse(x,y,w,h,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,w/2,h/2,0,0,TAU);ctx.fill();}
  function polygon(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
  function heart(x,y,size){ctx.save();ctx.translate(x,y);ctx.scale(size/30,size/30);ctx.fillStyle='#ff415f';ctx.beginPath();ctx.moveTo(0,13);ctx.bezierCurveTo(-5,8,-16,1,-15,-7);ctx.bezierCurveTo(-14,-17,-3,-19,0,-11);ctx.bezierCurveTo(3,-19,14,-17,15,-7);ctx.bezierCurveTo(16,1,5,8,0,13);ctx.fill();ctx.restore();}
  function drawShip(){ctx.save();ctx.translate(ship.x,ship.y);const flame=rnd(20,38);polygon([[-32,-12],[-32,12],[-32-flame,0]],'rgba(255,90,10,.52)');polygon([[-30,-7],[-30,7],[-30-flame*.7,0]],'#ffd228');polygon([[-25,-10],[-38,-34],[12,-12]],'#2373c3');polygon([[-25,10],[-38,34],[12,12]],'#2373c3');polygon([[-35,-14],[10,-17],[43,0],[10,17],[-35,14]],'#afcde1');ellipse(10,0,24,19,'#00d7ff');ellipse(15,-4,8,5,'#beffff');ctx.fillStyle='#28416e';ctx.fillRect(-25,-8,18,16);ctx.fillStyle='#00f0ff';ctx.fillRect(-22,-5,10,10);ctx.restore();}
  function drawMeteor(m){ctx.save();ctx.translate(m.x,m.y);ctx.rotate(m.angle);ctx.beginPath();for(let i=0;i<10;i++){const a=TAU*i/10,x=Math.cos(a)*m.r*m.shape[i],y=Math.sin(a)*m.r*m.shape[i];i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fillStyle='#7d5a46';ctx.strokeStyle='#6e4b37';ctx.lineWidth=2;ctx.fill();ctx.stroke();ellipse(-m.r*.25,-m.r*.2,m.r*.42,m.r*.32,'#4b342d');ellipse(m.r*.3,m.r*.2,m.r*.32,m.r*.25,'#4b342d');ellipse(m.r*.12,-m.r*.45,m.r*.2,m.r*.15,'#aa7d5f');ctx.restore();}
  function drawJunk(j){ctx.save();ctx.translate(j.x,j.y);ctx.rotate(j.angle);ctx.lineWidth=2;
    if(j.type===0){ctx.fillStyle='#195f91';ctx.strokeStyle='#00f0ff';for(const x of [-23,23]){ctx.fillRect(x-12.5,-8.5,25,17);ctx.strokeRect(x-12.5,-8.5,25,17);}ctx.strokeStyle='#b4b4b4';ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.stroke();ctx.fillStyle='#afb4be';ctx.fillRect(-9,-10,18,20);ellipse(0,0,7,7,'#ffc81e');}
    else if(j.type===1){ctx.fillStyle='#879ba5';ctx.strokeStyle='#c8c8c8';for(let i=0;i<8;i++){ctx.save();ctx.rotate(TAU*i/8);ctx.fillRect(-4.5,-23.5,9,13);ctx.strokeRect(-4.5,-23.5,9,13);ctx.restore();}ellipse(0,0,30,30,'#879ba5');ellipse(0,0,12,12,'#0f1928');}
    else{polygon([[-22,-12],[10,-18],[23,2],[8,18],[-18,12]],'#648296');ctx.strokeStyle='#becfdc';ctx.beginPath();ctx.moveTo(-22,-12);ctx.lineTo(10,-18);ctx.lineTo(23,2);ctx.lineTo(8,18);ctx.lineTo(-18,12);ctx.closePath();ctx.stroke();ctx.strokeStyle='#ffbe28';ctx.beginPath();ctx.moveTo(-13,-7);ctx.lineTo(7,9);ctx.lineTo(15,3);ctx.stroke();ellipse(-8,4,6,6,'#ff5a28');}
    ctx.restore();}
  function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#05081a';ctx.fillRect(0,0,W,H);
    for(const s of stars)ellipse(s.x,s.y,s.r,s.r,'rgba(160,190,255,.67)');
    ellipse(790,440,330,330,'rgba(30,45,95,.22)');ellipse(790,440,260,260,'rgba(30,55,105,.35)');ellipse(790,440,210,210,'rgba(45,70,125,.47)');
    for(const l of lasers){ellipse(l.x,l.y,38,16,'rgba(0,200,255,.26)');ctx.fillStyle='#00ebff';ctx.fillRect(l.x-12,l.y-3,28,6);ctx.fillStyle='#fff';ctx.fillRect(l.x-8,l.y-1,22,2);}
    for(const m of meteors)drawMeteor(m);for(const j of junks)drawJunk(j);
    for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/255);ellipse(p.x,p.y,5,5,p.c);}ctx.globalAlpha=1;
    // Draw particles with alpha through canvas context so #hex colours remain valid.
    if(!over&&(invincible===0||frames%8<4))drawShip();
    ctx.fillStyle='#fff';ctx.font='bold 24px system-ui, sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText('SCORE: '+score,25,32);
    for(let i=0;i<lives;i++)heart(W-120+i*40,32,27);
    ctx.fillStyle='#96b4d2';ctx.font='13px system-ui, sans-serif';ctx.textAlign='center';ctx.fillText('MOVE: MOUSE UP / DOWN  |  FIRE: LEFT CLICK',W/2,H-20);
    if(over){ctx.fillStyle='rgba(0,0,0,.73)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.font='bold 72px system-ui';ctx.fillStyle='#ff465a';ctx.fillText('GAME OVER',W/2,235);ctx.font='bold 32px system-ui';ctx.fillStyle='#fff';ctx.fillText('FINAL SCORE: '+score,W/2,320);ctx.font='22px system-ui';ctx.fillStyle='#00dcff';ctx.fillText('PRESS R OR TAP RESTART',W/2,390);}
  }
  function animate(t){if(!last)last=t;acc+=Math.min(t-last,100);last=t;let n=0;while(acc>=1000/60&&n<6){step();acc-=1000/60;n++;}draw();requestAnimationFrame(animate);}
  function pointY(event){const rect=canvas.getBoundingClientRect();return clamp((event.clientY-rect.top)/rect.height*H,35,H-35);}
  canvas.addEventListener('pointermove',e=>{targetY=pointY(e);});
  canvas.addEventListener('pointerdown',e=>{if(over){reset();return;}targetY=pointY(e);shooting=true;canvas.setPointerCapture?.(e.pointerId);canvas.focus();e.preventDefault();});
  canvas.addEventListener('pointerup',()=>{shooting=false;});canvas.addEventListener('pointercancel',()=>{shooting=false;});window.addEventListener('pointerup',()=>{shooting=false;});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r')reset();if(['ArrowUp','ArrowDown',' '].includes(e.key)){e.preventDefault();if(e.key==='ArrowUp')targetY=clamp(targetY-35,35,H-35);if(e.key==='ArrowDown')targetY=clamp(targetY+35,35,H-35);if(e.key===' ')shooting=true;}});
  document.addEventListener('keyup',e=>{if(e.key===' ')shooting=false;});window.addEventListener('blur',()=>shooting=false);
  document.getElementById('restart').addEventListener('click',reset);
  for(const [id,dy] of [['up',-17],['down',17]]){const b=document.getElementById(id);let timer=null;function move(){targetY=clamp(targetY+dy,35,H-35);}b.addEventListener('pointerdown',e=>{e.preventDefault();move();timer=setInterval(move,25);b.setPointerCapture?.(e.pointerId);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>{clearInterval(timer);timer=null;});}
  const fire=document.getElementById('fire');fire.addEventListener('pointerdown',e=>{e.preventDefault();shooting=true;fire.setPointerCapture?.(e.pointerId);});for(const type of ['pointerup','pointercancel','lostpointercapture'])fire.addEventListener(type,()=>shooting=false);
  reset();requestAnimationFrame(animate);
})();
