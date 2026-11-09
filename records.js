(() => {
  'use strict';
  const t=(k,v)=>window.SOKOL_I18N.t(k,v);
  const db=window.SOKOL_SUPABASE;
  const online=Boolean(db && /^https:\/\/[\w-]+\.supabase\.co$/.test(db.url) && db.publishableKey.startsWith('sb_publishable_'));
  const dialog=document.getElementById('gameDialog'),frame=document.getElementById('gameFrame');
  const popup=document.getElementById('recordPopup'),form=document.getElementById('recordForm'),input=document.getElementById('recordNameInput');
  const tbody=document.getElementById('leaderboardRows'),bestEl=document.getElementById('personalBest');
  const scoreEl=document.getElementById('recordPoints'),promptEl=document.getElementById('recordPrompt'),validation=document.getElementById('recordValidation');
  const note=document.querySelector('.records-note'),mode=document.getElementById('leaderboardMode');
  const submitButton=form.querySelector('button[type=submit]');
  const storage=id=>'sokol-scores-v1-'+id,personal=id=>'sokol-personal-v1-'+id;
  let pending=[],active=null,lastFocus=null,leaderboard=[],connection='loading',generation=0,submitting=false,lastError='';
  function loadLocal(id){try{const x=JSON.parse(localStorage.getItem(storage(id))||'[]');return Array.isArray(x)?x.filter(e=>e&&typeof e.name==='string'&&Number.isFinite(e.score)).sort((a,b)=>b.score-a.score).slice(0,5):[]}catch{return []}}
  function best(id){try{return Math.max(0,Number(localStorage.getItem(personal(id)))||0)}catch{return 0}}
  function setBest(id,value){if(!id)return;try{if(value>best(id))localStorage.setItem(personal(id),String(value))}catch{}}
  function saveLocal(id,name,score){const list=loadLocal(id);list.push({name,score});list.sort((a,b)=>b.score-a.score);try{localStorage.setItem(storage(id),JSON.stringify(list.slice(0,5)));localStorage.setItem('sokol-player-name',name)}catch{}}
  async function api(path,method='GET',body){
    const headers={'apikey':db.publishableKey};
    if(body!==undefined){headers['Content-Type']='application/json';headers['Prefer']='return=minimal';}
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
    try{
      const res=await fetch(db.url+'/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
      if(!res.ok){const detail=(await res.text()).slice(0,240);throw Error('Supabase HTTP '+res.status+': '+detail);}
      const raw=await res.text();return raw?JSON.parse(raw):null;
    }finally{clearTimeout(timeout)}
  }
  const safeGame=id=>['neon-dodge','apple-catcher','pong-arena','space-runner'].includes(id);
  async function refresh(){
    const id=dialog.dataset.game;if(!safeGame(id))return;
    const current=++generation;
    if(!online){connection='offline';lastError='No valid Supabase config';leaderboard=loadLocal(id);render();return;}
    connection='loading';lastError='';render();
    try{
      const data=await api('leaderboard?select=player_name,score&game_id=eq.'+encodeURIComponent(id)+'&order=score.desc,created_at.asc&limit=100');
      if(current!==generation||id!==dialog.dataset.game)return;
      const seen=new Set();
      leaderboard=(Array.isArray(data)?data:[]).filter(x=>{
        const k=x.player_name.toLocaleLowerCase();if(seen.has(k))return false;seen.add(k);return true;
      }).slice(0,5).map(x=>({name:x.player_name,score:x.score}));
      connection='online';lastError='';render();
    }catch(err){if(current!==generation)return;console.warn('SOKOL leaderboard:',err);connection='error';lastError=String(err.message || err).slice(0,220);leaderboard=loadLocal(id);render();}
  }
  function render(){
    const id=dialog.dataset.game;if(!id)return;
    const list=connection==='online'?leaderboard:loadLocal(id);
    bestEl.textContent=best(id).toLocaleString(window.SOKOL_I18N.lang);
    mode.textContent=t(connection==='online'?'leaderboardOnline':connection==='loading'?'leaderboardLoading':connection==='error'?'leaderboardError':'leaderboardLocal');
    note.textContent=t(connection==='online'?'recordNoticeOnline':connection==='loading'?'recordLoading':connection==='error'?'recordNoticeError':'recordNoticeOffline');
    note.dataset.state=connection;
    if(connection==='error')note.title=lastError;else note.removeAttribute('title');
    tbody.replaceChildren();
    if(!list.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=3;cell.className='no-records';cell.textContent=t(connection==='loading'?'recordLoading':'noRecords');row.append(cell);tbody.append(row);return;}
    list.forEach((r,i)=>{const row=document.createElement('tr');[String(i+1),r.name,Number(r.score).toLocaleString(window.SOKOL_I18N.lang)].forEach((v,j)=>{const cell=document.createElement('td');cell.textContent=v;if(j===0)cell.className='record-rank';if(j===2)cell.className='record-score';row.append(cell)});tbody.append(row)});
  }
  function showNext(){
    active=pending.shift()||null;if(!active){popup.hidden=true;document.body.classList.remove('record-active');lastFocus?.focus?.();render();return;}
    popup.hidden=false;document.body.classList.add('record-active');validation.textContent='';input.value='';
    promptEl.textContent=t('recordPrompt')+(active.label?' · '+t(active.label):'');scoreEl.textContent=t('recordPoints',{score:active.score});
    requestAnimationFrame(()=>input.focus({preventScroll:true}));
  }
  async function submit(){
    if(!active||submitting)return;
    const name=input.value.trim().replace(/\s+/g,' ').slice(0,20);
    if(!name){validation.textContent=t('recordInvalid');input.focus();return;}
    const id=dialog.dataset.game,score=active.score;
    if(connection==='offline'||connection==='error'||!online){saveLocal(id,name,score);showNext();return;}
    submitting=true;submitButton.disabled=true;validation.textContent=t('recordSaving');
    try{
      await api('rpc/submit_game_score','POST',{p_game_id:id,p_player_name:name,p_score:score});
      saveLocal(id,name,score);
      showNext();await refresh();
    }catch(err){console.warn('SOKOL submit score:',err);validation.textContent=t('recordSaveError');}
    finally{submitting=false;submitButton.disabled=false;}
  }
  form.addEventListener('submit',e=>{e.preventDefault();submit()});
  document.getElementById('recordSkip').addEventListener('click',()=>{if(!submitting)showNext()});
  document.addEventListener('keydown',e=>{if(!popup.hidden&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!submitting)showNext();}},true);
  function receive(e){
    if(e.source!==frame.contentWindow||!dialog.open)return;
    if(location.protocol!=='file:'&&e.origin!==location.origin)return;
    const d=e.data;if(!d||d.type!=='sokol-game-finished'||d.gameId!==dialog.dataset.game)return;
    const entries=Array.isArray(d.results)?d.results:[{score:d.score}],id=dialog.dataset.game;
    const valid=entries.filter(v=>v&&typeof v.score==='number'&&Number.isFinite(v.score)).map(v=>({score:Math.max(0,Math.floor(v.score)),label:v.label==='recordPlayerRed'||v.label==='recordPlayerBlue'?v.label:null}));
    if(!valid.length)return;
    valid.forEach(v=>{
      const previous=best(id);setBest(id,v.score);
      const list=connection==='online'?leaderboard:loadLocal(id);
      const qualifies=v.score>0&&(v.score>previous||list.length<5||v.score>list[list.length-1].score);
      if(qualifies)pending.push(v);
    });render();if(!active&&pending.length){lastFocus=document.activeElement;showNext();}
  }
  document.getElementById('recordRefresh').addEventListener('click',refresh);
  window.addEventListener('message',receive);
  window.SOKOL_RECORDS={open(id){generation++;pending=[];active=null;popup.hidden=true;dialog.dataset.game=id;leaderboard=[];connection='loading';refresh()},close(){generation++;pending=[];active=null;popup.hidden=true;document.body.classList.remove('record-active')},refresh};
  document.addEventListener('sokol-language-change',()=>{render();if(active){promptEl.textContent=t('recordPrompt')+(active.label?' · '+t(active.label):'');scoreEl.textContent=t('recordPoints',{score:active.score});if(!submitting)validation.textContent='';}});
})();
