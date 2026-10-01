const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const views={login:$('#loginView'),home:$('#homeView'),task:$('#taskView'),result:$('#resultView'),lab:$('#labView'),admin:$('#adminView')};
const TASKS={radar:{name:'雷达信号识别',label:'雷达任务',icon:'◎',desc:'监视旋转雷达：亮点只在扫描线扫过时短暂出现，忽略背景噪点。'},medical:{name:'影像异常诊断',label:'医学影像',icon:'◉',desc:'观察含有正常亮斑与纹理干扰的模拟影像，判断是否存在更集中的可疑病灶。'},texture:{name:'纹理异常检测',label:'纹理检测',icon:'⌗',desc:'快速扫描带有轻微方向扰动的纹理，判断是否存在明显偏转的异常线条。'}};
let state={user:null,teacher:false,difficulty:1.7,currentTask:null,trials:[],index:0,answers:[],shownAt:0,result:null,timer:null,radarFrame:null};
const STORAGE='sdt_lab_records_v1';

function showView(name){Object.values(views).forEach(v=>v.classList.remove('active'));views[name].classList.add('active');window.scrollTo(0,0);if(name==='lab')renderLabModules();if(name==='admin')renderAdmin()}
function syncUser(){const u=state.user||{name:'游客',id:'未记录学号'};$('#userName').textContent=u.name;$('#userId').textContent=u.id;$('#userInitial').textContent=u.name.slice(0,1);$$('#adminNav,.admin-copy').forEach(x=>x.classList.toggle('hidden',!state.teacher))}
function login(user,teacher=false){state.user=user;state.teacher=teacher;syncUser();showView(teacher?'admin':'home')}
$('#studentLogin').addEventListener('submit',e=>{e.preventDefault();login({name:$('#nameInput').value.trim(),id:$('#idInput').value.trim()})});
$('#guestLogin').onclick=()=>login({name:'游客',id:'游客'});
$('#logoutBtn').onclick=()=>{state.user=null;state.teacher=false;showView('login')};
$('#teacherLoginOpen').onclick=()=>{$('#teacherError').textContent='';$('#teacherDialog').showModal()};
$('#teacherSubmit').onclick=e=>{e.preventDefault();if($('#teacherAccount').value==='admin666'&&$('#teacherPassword').value==='SDTliyun666'){$('#teacherDialog').close();login({name:'教师',id:'admin666'},true)}else $('#teacherError').textContent='账号或密码不正确'};
$('#adminLogout').onclick=()=>{state.teacher=false;login({name:'游客',id:'游客'})};
$$('[data-go]').forEach(b=>b.onclick=()=>{const dest=b.dataset.go;if(dest==='admin'&&!state.teacher)return;showView(dest)});

function setDifficulty(v){state.difficulty=+v;$('#difficultyRange').value=v;$('#dValue').textContent=`清晰度 = ${(+v).toFixed(1)}`;const lab=v<1.2?'困难':v>2.4?'简单':'默认';$('#difficultyLabel').textContent=lab;$$('[data-d]').forEach(b=>b.classList.toggle('selected',+b.dataset.d===+v))}
$('#difficultyRange').oninput=e=>setDifficulty(e.target.value);$$('[data-d]').forEach(b=>b.onclick=()=>setDifficulty(b.dataset.d));
$$('.task-card[data-task]').forEach(card=>{
  const open=()=>openTask(card.dataset.task);
  card.onclick=open;
  card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}};
});
function openTask(type){state.currentTask=type;const t=TASKS[type];$('#taskTypeLabel').textContent=t.name;$('#experimentTitle').textContent=t.name;$('#experimentDescription').textContent=t.desc;$('#instructionIcon').textContent=t.icon;$('#instructionPanel').classList.remove('hidden');$('#trialPanel').classList.add('hidden');$('#trialCounter').textContent='01 / 20';$('#trialProgress').style.width='0%';showView('task')}
$('#quitTask').onclick=()=>{clearTimeout(state.timer);stopRadar();showView('home')};
$('#startTrials').onclick=startExperiment;
function startExperiment(){state.index=0;state.answers=[];state.trials=shuffleTrials(Array.from({length:20},(_,i)=>({signal:i<10,seed:Math.random()})));$('#instructionPanel').classList.add('hidden');$('#trialPanel').classList.remove('hidden');nextTrial()}
function shuffleTrials(trials){for(let i=trials.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[trials[i],trials[j]]=[trials[j],trials[i]]}return trials}
function nextTrial(){if(state.index>=state.trials.length)return finishExperiment();const trial=state.trials[state.index];$('#trialCounter').textContent=`${String(state.index+1).padStart(2,'0')} / 20`;$('#trialProgress').style.width=`${state.index/20*100}%`;$('#maskLayer').classList.add('hidden');setAnswers(false);setFeedback('neutral','·','仔细观察','刺激将在 1.2 秒后隐藏');drawStimulus(state.currentTask,trial.signal,trial.seed,state.difficulty);state.timer=setTimeout(()=>{stopRadar();$('#maskLayer').classList.remove('hidden');setAnswers(true);state.shownAt=performance.now();setFeedback('neutral','?','请作答','选择“出现信号”或“未出现信号”')},1200)}
function setAnswers(on){$('#answerPresent').disabled=!on;$('#answerAbsent').disabled=!on}
function setFeedback(kind,symbol,title,detail){const b=$('#feedbackBar');b.className=`feedback-bar ${kind}`;$('#feedbackSymbol').textContent=symbol;$('#feedbackTitle').textContent=title;$('#feedbackDetail').textContent=detail}
function answer(present){if($('#answerPresent').disabled)return;setAnswers(false);const tr=state.trials[state.index],rt=Math.round(performance.now()-state.shownAt);let outcome,correct;if(tr.signal&&present){outcome='H';correct=true}else if(tr.signal&&!present){outcome='M';correct=false}else if(!tr.signal&&present){outcome='FA';correct=false}else{outcome='CR';correct=true}state.answers.push({signal:tr.signal,present,outcome,rt});const labels={H:['命中','有信号，你成功发现了目标'],M:['漏报','有信号，但你判断为没有'],FA:['虚报','没有信号，但你判断为出现'],CR:['正确驳斥','没有信号，你正确排除了目标']};setFeedback(correct?'correct':'wrong',correct?'✓':'×',labels[outcome][0],labels[outcome][1]);state.index++;state.timer=setTimeout(nextTrial,720)}
$('#answerPresent').onclick=()=>answer(true);$('#answerAbsent').onclick=()=>answer(false);document.addEventListener('keydown',e=>{if(views.task.classList.contains('active')){if(e.key.toLowerCase()==='f')answer(true);if(e.key.toLowerCase()==='j')answer(false)}});

function stopRadar(){if(state.radarFrame!==null){cancelAnimationFrame(state.radarFrame);state.radarFrame=null}}
function drawStimulus(type,signal,seed,d){
  stopRadar();
  const canvas=$('#stimulusCanvas'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  const random=mulberry32(Math.floor(seed*1e9)),clarity=(d-.5)/3;
  ctx.clearRect(0,0,w,h);
  if(type==='radar'){
    const cx=w/2,cy=h/2,targetAngle=-2.35+random()*4.5;
    const targetRadius=115+random()*95,targetX=cx+Math.cos(targetAngle)*targetRadius,targetY=cy+Math.sin(targetAngle)*targetRadius;
    const specks=Array.from({length:145},()=>({x:random()*w,y:random()*h,size:1+random()*2,alpha:.08+random()*.24}));
    const decoys=Array.from({length:5},()=>({angle:random()*Math.PI*2,radius:65+random()*185,size:2+random()*2}));
    const started=performance.now();
    function frame(now){
      const elapsed=now-started,angle=-Math.PI+elapsed/1200*Math.PI*2.4;
      ctx.fillStyle='#071f28';ctx.fillRect(0,0,w,h);
      ctx.strokeStyle='rgba(113,222,191,.18)';ctx.lineWidth=1;
      for(let rr=55;rr<260;rr+=55){ctx.beginPath();ctx.arc(cx,cy,rr,0,Math.PI*2);ctx.stroke()}
      for(let a=0;a<8;a++){ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a*Math.PI/4)*330,cy+Math.sin(a*Math.PI/4)*330);ctx.stroke()}
      specks.forEach(p=>{ctx.fillStyle=`rgba(119,213,185,${p.alpha})`;ctx.fillRect(p.x,p.y,p.size,p.size)});
      decoys.forEach(p=>{ctx.fillStyle='rgba(119,213,185,.32)';ctx.beginPath();ctx.arc(cx+Math.cos(p.angle)*p.radius,cy+Math.sin(p.angle)*p.radius,p.size,0,Math.PI*2);ctx.fill()});
      const beam=ctx.createRadialGradient(cx,cy,0,cx,cy,285);beam.addColorStop(0,'rgba(143,247,185,.01)');beam.addColorStop(1,'rgba(143,247,185,.20)');
      ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,285,angle-.22,angle);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(172,249,197,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(angle)*285,cy+Math.sin(angle)*285);ctx.stroke();
      const delta=Math.atan2(Math.sin(angle-targetAngle),Math.cos(angle-targetAngle));
      if(signal&&delta>=0&&delta<.5){ctx.fillStyle=`rgba(200,242,107,${.65+clarity*.3})`;ctx.shadowColor='#c8f26b';ctx.shadowBlur=8+clarity*14;ctx.beginPath();ctx.arc(targetX,targetY,4+clarity*5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
      if(elapsed<1200)state.radarFrame=requestAnimationFrame(frame);else state.radarFrame=null;
    }
    frame(started);
  }else if(type==='medical'){
    const image=ctx.createImageData(w,h);
    for(let py=0;py<h;py++)for(let px=0;px<w;px++){
      const dx=(px-w/2)/(w*.38),dy=(py-h/2)/(h*.42),inside=dx*dx+dy*dy<1;
      const noise=88+random()*54+22*Math.sin(px*.035)*Math.cos(py*.03)+9*Math.sin(px*.11+py*.08);
      const k=(py*w+px)*4,v=inside?noise:22;
      image.data[k]=v*.75;image.data[k+1]=v*.95;image.data[k+2]=v;image.data[k+3]=255;
    }
    ctx.putImageData(image,0,0);
    function spot(px,py,radius,opacity){const grad=ctx.createRadialGradient(px,py,0,px,py,radius);grad.addColorStop(0,`rgba(245,250,238,${opacity})`);grad.addColorStop(.45,`rgba(231,246,239,${opacity*.45})`);grad.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(px,py,radius,0,Math.PI*2);ctx.fill()}
    for(let i=0;i<7;i++){const a=random()*Math.PI*2,radius=35+random()*105;spot(w/2+Math.cos(a)*radius,h/2+Math.sin(a)*radius,11+random()*12,.14+random()*.12)}
    if(signal)spot(w*(.35+random()*.3),h*(.35+random()*.3),13+clarity*12,.35+clarity*.43);
  }else{
    ctx.fillStyle='#f4ead6';ctx.fillRect(0,0,w,h);
    const cols=19,rows=10,gx=w/(cols+1),gy=h/(rows+1),tx=4+Math.floor(random()*(cols-8)),ty=2+Math.floor(random()*(rows-4));
    const decoys=new Set();while(decoys.size<13){const xx=1+Math.floor(random()*cols),yy=1+Math.floor(random()*rows);if(xx!==tx||yy!==ty)decoys.add(`${xx},${yy}`)}
    for(let yy=1;yy<=rows;yy++)for(let xx=1;xx<=cols;xx++){
      const target=signal&&xx===tx&&yy===ty,decoy=decoys.has(`${xx},${yy}`);
      const angle=(target ? .52+clarity*.65 : decoy ? (random()<.5?-1:1)*(.16+random()*.13) : 0)+(random()-.5)*.12;
      ctx.save();ctx.translate(xx*gx,yy*gy);ctx.rotate(angle);ctx.strokeStyle=target?'#245f5c':'#346a67';ctx.lineWidth=target?2.4:2.2;ctx.globalAlpha=target?.72+clarity*.28:.72;
      ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(9,0);ctx.stroke();ctx.restore();
    }
  }
}
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

function normInv(p){if(p<=0||p>=1)return p===0?-Infinity:Infinity;const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924],b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857],c=[-.00778489400243029,-.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878],d=[.00778469570904146,.32246712907004,2.445134137143,3.75440866190742],pl=.02425,ph=1-pl;let q,r;if(p<pl){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}if(p>ph){q=Math.sqrt(-2*Math.log(1-p));return-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}q=p-.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}
function calcResult(){const count=k=>state.answers.filter(a=>a.outcome===k).length,H=count('H'),M=count('M'),FA=count('FA'),CR=count('CR'),sig=H+M,noise=FA+CR,total=sig+noise,hit=sig?H/sig:0,fa=noise?FA/noise:0,hitAdjusted=(H+.5)/(sig+1),faAdjusted=(FA+.5)/(noise+1),zH=normInv(hitAdjusted),zF=normInv(faAdjusted),dp=zH-zF,c=-.5*(zH+zF),beta=Math.exp(dp*c),acc=total?(H+CR)/total:0,rt=total?state.answers.reduce((s,a)=>s+a.rt,0)/total:0;return{H,M,FA,CR,hit,fa,hitAdjusted,faAdjusted,dp,c,beta,acc,rt}}
function finishExperiment(){state.result=calcResult();const r=state.result,record={time:new Date().toISOString(),name:state.user?.name||'游客',studentId:state.user?.id||'游客',task:state.currentTask,taskName:TASKS[state.currentTask].label,setD:state.difficulty,...r};const all=getRecords();all.push(record);localStorage.setItem(STORAGE,JSON.stringify(all));renderResult();showView('result')}
function renderResult(){const r=state.result,pct=Math.round(r.acc*100);$('#accuracyScore').textContent=`${pct}%`;$('#scoreRing').style.background=`conic-gradient(var(--teal2) ${pct}%,#dce7e4 ${pct}%)`;$('#metricD').textContent=r.dp.toFixed(2);$('#metricC').textContent=r.c.toFixed(2);$('#metricBeta').textContent=r.beta.toFixed(2);$('#metricHit').textContent=`${Math.round(r.hit*100)}%`;$('#metricFa').textContent=`${Math.round(r.fa*100)}%`;$('#metricRt').textContent=`${Math.round(r.rt)} ms`;$('#resultTitle').textContent=`${TASKS[state.currentTask].name}完成`;$('#resultSummary').textContent=r.dp>1.5?'你较好地区分了信号与噪声。':r.dp>.5?'你捕捉到了一部分信号，但仍有提升空间。':'信号与噪声对你而言仍较难区分。';$('#confusionMatrix').innerHTML=`<div></div><div class="head">回答 有</div><div class="head">回答 无</div><div class="head">实际 有</div><div class="hit"><small>命中 H</small><strong>${r.H}</strong></div><div class="miss"><small>漏报 M</small><strong>${r.M}</strong></div><div class="head">实际 无</div><div class="fa"><small>虚报 FA</small><strong>${r.FA}</strong></div><div class="cr"><small>正确驳斥 CR</small><strong>${r.CR}</strong></div>`;drawROC($('#rocCanvas'),r.fa,r.hit)}
$('#retryTask').onclick=()=>openTask(state.currentTask);$('#resultHome').onclick=()=>showView('home');
function drawROC(canvas,fa,hit){const x=canvas.getContext('2d'),w=canvas.width,h=canvas.height,p=48;x.clearRect(0,0,w,h);x.fillStyle='#fff';x.fillRect(0,0,w,h);x.strokeStyle='#d9e4e1';x.lineWidth=1;for(let i=0;i<=5;i++){const xx=p+(w-p*2)*i/5,yy=h-p-(h-p*2)*i/5;x.beginPath();x.moveTo(xx,p);x.lineTo(xx,h-p);x.stroke();x.beginPath();x.moveTo(p,yy);x.lineTo(w-p,yy);x.stroke()}x.strokeStyle='#9aabad';x.setLineDash([6,6]);x.beginPath();x.moveTo(p,h-p);x.lineTo(w-p,p);x.stroke();x.setLineDash([]);const px=p+fa*(w-p*2),py=h-p-hit*(h-p*2);x.fillStyle='#105c6e';x.beginPath();x.arc(px,py,11,0,7);x.fill();x.strokeStyle='#c8f26b';x.lineWidth=4;x.beginPath();x.arc(px,py,16,0,7);x.stroke();x.fillStyle='#60737a';x.font='15px sans-serif';x.fillText('虚报率 P(FA)',w/2-45,h-10);x.save();x.translate(16,h/2+45);x.rotate(-Math.PI/2);x.fillText('命中率 P(H)',0,0);x.restore()}

function normal(x,mu,s=1){return Math.exp(-.5*((x-mu)/s)**2)}
function drawDistributions(){const c=$('#distributionCanvas');if(!c)return;const x=c.getContext('2d'),w=c.width,h=c.height,p=48,d=+$('#labD').value,crit=+$('#labC').value,base=h-p;x.clearRect(0,0,w,h);x.strokeStyle='#d9e4e1';x.beginPath();x.moveTo(p,base);x.lineTo(w-p,base);x.stroke();const map=v=>p+(v+4)/8*(w-p*2),scale=190;function curve(mu,color,fill){x.beginPath();for(let v=-4;v<=4;v+=.03){const px=map(v),py=base-normal(v,mu)*scale;v===-4?x.moveTo(px,py):x.lineTo(px,py)}x.lineTo(map(4),base);x.lineTo(map(-4),base);x.fillStyle=fill;x.fill();x.strokeStyle=color;x.lineWidth=3;x.stroke()}curve(-d/2,'#17859a','rgba(23,133,154,.12)');curve(d/2,'#e58d31','rgba(229,141,49,.12)');const cp=map(crit);x.strokeStyle='#102a36';x.setLineDash([7,5]);x.beginPath();x.moveTo(cp,45);x.lineTo(cp,base);x.stroke();x.setLineDash([]);x.fillStyle='#102a36';x.font='bold 16px sans-serif';x.fillText('判断标准 c',Math.min(cp+8,w-150),65);x.fillStyle='#17859a';x.fillText('噪声分布',map(-d/2)-35,base-scale-12);x.fillStyle='#d77c23';x.fillText('信号分布',map(d/2)-35,base-scale-12);$('#labDValue').textContent=d.toFixed(1);$('#labCValue').textContent=crit.toFixed(1)}
$('#labD').oninput=()=>{drawDistributions();updateDecisionLab();drawZRoc()};$('#labC').oninput=drawDistributions;$('#rocDemoBtn').onclick=()=>{let v=+$('#labC').value+.5;if(v>1.5)v=-1.5;$('#labC').value=v;drawDistributions()};

function normCdf(z){return .5*(1+erf(z/Math.SQRT2))}
function erf(x){const sign=x<0?-1:1,a=Math.abs(x),t=1/(1+.3275911*a),y=1-(((((1.061405429*t-1.453152027)*t+1.421413741)*t-.284496736)*t+.254829592)*t)*Math.exp(-a*a);return sign*y}
function chartAxes(ctx,w,h,{xLabel='',yLabel='',xMin=0,xMax=1,yMin=0,yMax=1,xTicks=5,yTicks=5}={}){const p={l:58,r:24,t:28,b:50};ctx.clearRect(0,0,w,h);ctx.fillStyle='#fbfcfd';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#d8e2e7';ctx.lineWidth=1;ctx.font='13px sans-serif';ctx.fillStyle='#60737a';ctx.textAlign='center';for(let i=0;i<=xTicks;i++){const x=p.l+(w-p.l-p.r)*i/xTicks;ctx.beginPath();ctx.moveTo(x,p.t);ctx.lineTo(x,h-p.b);ctx.stroke();ctx.fillText((xMin+(xMax-xMin)*i/xTicks).toFixed(xMin<0?1:1),x,h-p.b+22)}ctx.textAlign='right';for(let i=0;i<=yTicks;i++){const y=h-p.b-(h-p.t-p.b)*i/yTicks;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillText((yMin+(yMax-yMin)*i/yTicks).toFixed(yMin<0?1:1),p.l-9,y+4)}ctx.textAlign='center';ctx.fillText(xLabel,(p.l+w-p.r)/2,h-8);ctx.save();ctx.translate(15,(p.t+h-p.b)/2);ctx.rotate(-Math.PI/2);ctx.fillText(yLabel,0,0);ctx.restore();return{...p,mapX:v=>p.l+(v-xMin)/(xMax-xMin)*(w-p.l-p.r),mapY:v=>h-p.b-(v-yMin)/(yMax-yMin)*(h-p.t-p.b)}}

function drawZRoc(){const canvas=$('#zRocCanvas');if(!canvas)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,b=+$('#zSlope').value,a=+$('#labD').value,ax=chartAxes(ctx,w,h,{xLabel:'z(FA)',yLabel:'z(H)',xMin:-2.5,xMax:2.5,yMin:-2.5,yMax:2.5});ctx.strokeStyle='#9aabad';ctx.setLineDash([7,6]);ctx.beginPath();ctx.moveTo(ax.mapX(-2.5),ax.mapY(-2.5));ctx.lineTo(ax.mapX(2.5),ax.mapY(2.5));ctx.stroke();ctx.setLineDash([]);ctx.save();ctx.beginPath();ctx.rect(ax.l,ax.t,w-ax.l-ax.r,h-ax.t-ax.b);ctx.clip();ctx.strokeStyle='#17376a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(ax.mapX(-2.5),ax.mapY(a+b*-2.5));ctx.lineTo(ax.mapX(2.5),ax.mapY(a+b*2.5));ctx.stroke();ctx.restore();ctx.fillStyle='#e95d55';ctx.beginPath();ctx.arc(ax.mapX(-.8),ax.mapY(a-b*.8),8,0,Math.PI*2);ctx.fill();$('#zSlopeValue').textContent=b.toFixed(2);$('#zIntercept').textContent=a.toFixed(2);$('#zVarianceLabel').textContent=Math.abs(b-1)<.01?'等方差':b<1?'信号方差较大':'噪声方差较大'}

function updateDecisionLab(){if(!$('#priorSignal'))return;const ps=+$('#priorSignal').value,pn=1-ps,hit=+$('#payHit').value,miss=+$('#payMiss').value,fa=+$('#payFa').value,cr=+$('#payCr').value,d=+$('#labD').value;const gainSignal=hit-miss,gainNoise=cr-fa,valid=gainSignal>0&&gainNoise>0;const beta=valid?(pn/ps)*(gainNoise/gainSignal):NaN,c=valid?Math.log(beta)/d:NaN;$('#priorValue').textContent=ps.toFixed(2);$('#priorS').textContent=ps.toFixed(2);$('#priorN').textContent=pn.toFixed(2);$('#optimalBeta').textContent=valid?beta.toFixed(2):'—';$('#optimalC').textContent=valid?c.toFixed(2):'—';let insight='请保证命中优于漏报、正确驳斥优于虚报。';if(valid)insight=beta<.9?'当前条件鼓励较宽松的判断标准，以减少漏报。':beta>1.1?'当前条件鼓励较保守的判断标准，以减少虚报。':'当前条件下没有明显的反应偏向。';$('#betaInsight').textContent=insight}

function updateMachineLearning(){const auc=+$('#modelAuc').value,threshold=+$('#modelThreshold').value,d=Math.SQRT2*normInv(auc),criterion=(threshold-.5)*5,tpr=1-normCdf(criterion-d/2),fpr=1-normCdf(criterion+d/2),P=500,N=500,tp=Math.round(P*tpr),fn=P-tp,fp=Math.round(N*fpr),tn=N-fp,precision=tp/Math.max(1,tp+fp),recall=tp/P,f1=2*precision*recall/Math.max(.0001,precision+recall),spec=tn/N,acc=(tp+tn)/(P+N);$('#aucValue').textContent=auc.toFixed(2);$('#thresholdValue').textContent=threshold.toFixed(2);$('#mlPrecision').textContent=precision.toFixed(3);$('#mlRecall').textContent=recall.toFixed(3);$('#mlF1').textContent=f1.toFixed(3);$('#mlSpecificity').textContent=spec.toFixed(3);$('#mlAccuracy').textContent=acc.toFixed(3);$('#mlMatrix').innerHTML=`<div></div><div class="head">实际正例</div><div class="head">实际负例</div><div class="head">预测正例</div><div class="tp">TP<strong>${tp}</strong></div><div class="fp">FP<strong>${fp}</strong></div><div class="head">预测负例</div><div class="fn">FN<strong>${fn}</strong></div><div class="tn">TN<strong>${tn}</strong></div>`;drawMlRoc(d,fpr,tpr)}
function drawMlRoc(d,markerFpr,markerTpr){const c=$('#mlRocCanvas'),ctx=c.getContext('2d'),w=c.width,h=c.height,ax=chartAxes(ctx,w,h,{xLabel:'虚报率 FPR',yLabel:'命中率 TPR',xMin:0,xMax:1,yMin:0,yMax:1});ctx.strokeStyle='#9aabad';ctx.setLineDash([7,6]);ctx.beginPath();ctx.moveTo(ax.mapX(0),ax.mapY(0));ctx.lineTo(ax.mapX(1),ax.mapY(1));ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#17376a';ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<=100;i++){const f=Math.max(.0001,Math.min(.9999,i/100)),t=normCdf(normInv(f)+d),x=ax.mapX(i/100),y=ax.mapY(t);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();ctx.fillStyle='#e95d55';ctx.beginPath();ctx.arc(ax.mapX(markerFpr),ax.mapY(markerTpr),9,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffb34e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ax.mapX(markerFpr),ax.mapY(markerTpr),14,0,Math.PI*2);ctx.stroke()}

// Nonlinear teaching model; curves are predictions, not participant measurements.
let vigilanceFrame=null,vigilancePoints=[],vigilanceRunning=false;
function vigilanceModel(decay,shift){return Array.from({length:121},(_,i)=>{const time=i/60,trend=1-Math.exp(-time/0.7),wave=Math.sin(time*8)*Math.sin(time*2)*.035;
const d=2.05-(decay?.85*trend+wave:0),crit=.08+(shift?.48*(1-Math.exp(-time/1.05))+.012*Math.sin(time*7)*Math.sin(time):0);
return{time,d,crit,hit:1-normCdf(crit-d/2),fa:1-normCdf(crit+d/2)}})}
function resetVigilance(){if(vigilanceFrame!==null)cancelAnimationFrame(vigilanceFrame);vigilanceFrame=null;vigilanceRunning=false;vigilancePoints=[];$('#vigilanceChart').classList.add('hidden');$('#vigilancePlaceholder').classList.remove('hidden');$('#vigilanceStatus').textContent='选择机制后点击“开始模拟”。';$('#runVigilance').disabled=false;$('#runVigilance').textContent='开始模拟 →'}
function drawVigilance(progress=1){const c=$('#vigilanceCanvas'),ctx=c.getContext('2d'),w=c.width,h=c.height,ax=chartAxes(ctx,w,h,{xLabel:'持续监控时间（小时）',yLabel:'命中率 / 虚报率',xMin:0,xMax:2,yMin:0,yMax:1,xTicks:8,yTicks:5}),points=vigilancePoints.filter(v=>v.time<=2*progress);
const lines=[['命中率','#2f7d32',v=>v.hit],['虚报率','#ef6c00',v=>v.fa],['d′（÷3）','#17376a',v=>v.d/3],['c（÷1.2）','#d32f2f',v=>v.crit/1.2]];
for(const[label,color,get]of lines){ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();points.forEach((v,i)=>{const x=ax.mapX(v.time),y=ax.mapY(get(v));i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
ctx.font='bold 14px sans-serif';ctx.textAlign='left';lines.forEach(([label,color],i)=>{const x=ax.l+10+i*180;ctx.fillStyle=color;ctx.fillRect(x,10,20,3);ctx.fillText(label,x+28,15)});ctx.textAlign='center'}
function startVigilance(){resetVigilance();vigilancePoints=vigilanceModel($('#decaySensitivity').checked,$('#shiftCriterion').checked);vigilanceRunning=true;$('#vigilanceChart').classList.remove('hidden');$('#vigilancePlaceholder').classList.add('hidden');$('#runVigilance').disabled=true;$('#runVigilance').textContent='模拟中…';const started=performance.now();
function frame(now){if(!views.lab.classList.contains('active')){resetVigilance();return}const p=Math.min(1,(now-started)/6000);drawVigilance(p);$('#vigilanceStatus').textContent='模拟进度：'+Math.round(p*120)+' / 120分钟';if(p<1)vigilanceFrame=requestAnimationFrame(frame);else{vigilanceFrame=null;vigilanceRunning=false;$('#runVigilance').disabled=false;$('#runVigilance').textContent='重新模拟 ↻';$('#vigilanceStatus').textContent='模拟完成：两小时的非线性理论预测。'}}vigilanceFrame=requestAnimationFrame(frame)}
function renderLabModules(){drawDistributions();drawZRoc();updateDecisionLab();updateMachineLearning();resetVigilance()}
$('#zSlope').oninput=drawZRoc;$('#priorSignal').oninput=updateDecisionLab;['#payHit','#payMiss','#payFa','#payCr'].forEach(id=>$(id).oninput=updateDecisionLab);$('#modelAuc').oninput=updateMachineLearning;$('#modelThreshold').oninput=updateMachineLearning;$('#decaySensitivity').onchange=resetVigilance;$('#shiftCriterion').onchange=resetVigilance;$('#runVigilance').onclick=startVigilance;

function getRecords(){try{return JSON.parse(localStorage.getItem(STORAGE)||'[]')}catch{return[]}}
function rawRates(r){const sig=r.H+r.M,noise=r.FA+r.CR;return{hit:sig?r.H/sig:0,fa:noise?r.FA/noise:0}}
function renderAdmin(){const all=getRecords(),filter=$('#taskFilter').value,rows=filter==='all'?all:all.filter(r=>r.task===filter);$('#adminCount').textContent=all.length;$('#adminAccuracy').textContent=all.length?`${Math.round(all.reduce((s,r)=>s+r.acc,0)/all.length*100)}%`:'—';$('#adminD').textContent=all.length?(all.reduce((s,r)=>s+r.dp,0)/all.length).toFixed(2):'—';$('#adminRt').textContent=all.length?`${Math.round(all.reduce((s,r)=>s+r.rt,0)/all.length)} ms`:'—';$('#recordsBody').innerHTML=rows.slice().reverse().map(r=>{const beta=Number.isFinite(r.beta)?r.beta:Math.exp(r.dp*r.c),rates=rawRates(r);return`<tr><td>${new Date(r.time).toLocaleString('zh-CN',{hour12:false})}</td><td><strong>${esc(r.name)}</strong><br>${esc(r.studentId)}</td><td>${esc(r.taskName)}</td><td>${r.setD.toFixed(1)}</td><td>${r.H} / ${r.M} / ${r.FA} / ${r.CR}</td><td>${(rates.hit*100).toFixed(1)}%</td><td>${(rates.fa*100).toFixed(1)}%</td><td>${r.dp.toFixed(2)}</td><td>${beta.toFixed(2)}</td><td>${r.c.toFixed(2)}</td><td>${(r.acc*100).toFixed(0)}%</td><td>${Math.round(r.rt)} ms</td></tr>`}).join('');$('#emptyRecords').classList.toggle('hidden',rows.length>0);$('.table-scroll').classList.toggle('hidden',rows.length===0)}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('#taskFilter').onchange=renderAdmin;
$('#exportCsv').onclick=()=>{const data=getRecords();if(!data.length)return alert('暂无可导出的实验记录');const head=['时间','姓名','学号','任务','难度设置','H','M','FA','CR','P(H)原始','P(FA)原始','实测d′修正率','β修正率','c修正率','正确率','平均RT（隐藏后ms）','试次数','信号比例','指标计算说明'];const note='d′/β/c 使用 (H+0.5)/(H+M+1) 与 (FA+0.5)/(FA+CR+1) 修正率；P(H)/P(FA) 为原始比率';const rows=data.map(r=>{const rates=rawRates(r);return[r.time,r.name,r.studentId,r.taskName,r.setD,r.H,r.M,r.FA,r.CR,rates.hit,rates.fa,r.dp,Number.isFinite(r.beta)?r.beta:Math.exp(r.dp*r.c),r.c,r.acc,r.rt,r.trialCount??(r.H+r.M+r.FA+r.CR),r.prior??((r.H+r.M)/(r.H+r.M+r.FA+r.CR)),note]});const csv='\ufeff'+[head,...rows].map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`SDT实验记录_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href)};

setDifficulty(1.7);renderLabModules();
