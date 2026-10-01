/* Receiver camera faces the server. The depth inset makes backward toss visible.
   Ground truth uses the supplied 30-degree teaching threshold. */
TASKS.receiver={name:'接球方视角：遮挡与回抛',label:'接球方发球判断',icon:'◒',desc:'站在对面观察发球：判断击球瞬间是否遮挡，或是否向身体方向回抛且超过30°。F 判违规，J 判合规。'};
let receiverN=20;
function validateReceiverCount(){const n=Number($('#receiverCount').value),valid=Number.isInteger(n)&&n>=20&&n<=100;$('#receiverCountError').textContent=valid?'':'请输入20到100之间的整数。';if(valid)receiverN=n;return valid}
$('#receiverCount').oninput=validateReceiverCount;
$('#receiverOpen').onclick=()=>{if(validateReceiverCount())openTask('receiver');else $('#receiverCount').focus()};
$('#pingInstructions').insertAdjacentHTML('afterend',`<div id="receiverInstructions" class="ping-instructions hidden"><p>你现在站在接球方的位置，面对对面的发球者。本任务只考察以下两类违规：</p><h3>1. 发球遮挡</h3><p>观察击球瞬间：球与球拍应可见。若发球者的身体或前臂遮住击球位置，判为违规。前臂靠近但没有遮住球与球拍时，判为合规。</p><h3>2. 回抛：向身体方向抛球且角度过大</h3><p>球应向上抛起。在本教学任务中，向身体方向偏斜与垂直线的夹角超过30°，判为违规；未超过30°，且没有遮挡时，判为合规。小侧视图显示向身体方向的深度运动，虚线标出垂直方向。</p><p>球先触及发球者台区，再落到你所在的台区；其余动作按合规生成。刺激呈现3.6秒后隐藏。F：违规；J：合规。命中=违规且判违规，漏报=违规却判合规，虚报=合规却判违规，正确驳斥=合规且判合规。</p><p class="calculation-note">回抛指向身体方向抛球，不是接回球重新发球。本任务沿用给定的30°教学阈值，不作为正式赛事执裁规则认证。作答前只呈现动作，不显示角度数值或违规标签。</p></div>`);
const sharedOpenTask=openTask;
openTask=function(type){sharedOpenTask(type);$('#receiverInstructions').classList.toggle('hidden',type!=='receiver');if(type==='receiver')$('#pingInstructions').classList.add('hidden')};
$('#taskFilter').insertAdjacentHTML('beforeend','<option value="receiver">接球方：遮挡与回抛</option>');
function receiverSpec(tr,d){const random=mulberry32(Math.floor(tr.seed*1e9)),q=(d-.5)/3;return{kind:tr.kind,bad:tr.signal,q,angle:tr.kind==='backtoss'?30+(tr.signal?1:-1)*(2+q*20+random()):8+random()*4,covered:tr.kind==='occlusion'&&tr.signal,variation:(random()-.5)*8}}
function receiverExplanation(s){return s.kind==='backtoss'?`向身体方向抛球，夹角 ${s.angle.toFixed(1)}°；本任务以超过30°判为回抛违规。`:s.covered?'击球瞬间，前臂遮住球与球拍，属于遮挡。':'击球瞬间，前臂已离开，球与球拍保持可见。'}
function drawReceiverFrame(c,s,t){
  c.clearRect(0,0,760,420);c.fillStyle='#eaf1ef';c.fillRect(0,0,760,420);
  const line=(a,b,x,y,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(a,b);c.lineTo(x,y);c.stroke()},text=(str,x,y,size=14)=>{c.fillStyle='#244a50';c.font=`${size}px sans-serif`;c.fillText(str,x,y)},dot=(x,y,r=6)=>{c.fillStyle='#fff';c.strokeStyle='#e39534';c.lineWidth=2;c.beginPath();c.arc(x,y,r,0,7);c.fill();c.stroke()};
  text('接球方视角 · 你面对发球者',24,28,18);text('观察球、前臂和击球位置',24,53,14);
  // Table perspective: camera is on the near side; server stands beyond far end.
  c.fillStyle='#17697a';c.beginPath();c.moveTo(194,240);c.lineTo(452,240);c.lineTo(510,400);c.lineTo(110,400);c.closePath();c.fill();line(194,240,452,240,'#e3eff0',3);line(322,240,310,400,'#d6e7e6',1);line(164,323,483,323,'#e3eff0',3);c.fillStyle='rgba(228,239,237,.75)';c.fillRect(163,303,319,19);for(let x=165;x<484;x+=12)line(x,304,x,321,'#7c9698',1);text('发球者台区',205,286,12);text('你的台区',212,378,12);
  // Player is behind the far end line. The release is beside the torso.
  const bodyX=382+s.variation,releaseX=325+s.variation,releaseY=183,hitY=194;
  c.fillStyle='#e6a179';c.beginPath();c.arc(bodyX,99,22,0,7);c.fill();c.fillStyle='#244a50';c.beginPath();c.moveTo(bodyX-27,124);c.lineTo(bodyX+30,124);c.lineTo(bodyX+39,225);c.lineTo(bodyX-23,225);c.closePath();c.fill();line(bodyX-9,225,bodyX-18,240,'#244a50',12);line(bodyX+23,225,bodyX+29,240,'#244a50',12);
  const toss=Math.max(0,Math.min(1,(t-.1)/.4)),rise=Math.sin(toss*Math.PI),depth=Math.tan(s.angle*Math.PI/180)*48*rise;
  let bx=releaseX+depth*.16,by=releaseY-64*rise,radius=6/(1+depth/360);
  if(t>=.5){bx=releaseX;by=hitY;radius=6;if(t>=.58){const f=Math.min(1,(t-.58)/.34),nodes=[[releaseX,hitY],[321,268],[314,283],[304,357],[282,382]],v=f*4,i=Math.min(3,Math.floor(v)),a=v-i;bx=nodes[i][0]+(nodes[i+1][0]-nodes[i][0])*a;by=nodes[i][1]+(nodes[i+1][1]-nodes[i][1])*a-14*Math.sin(Math.PI*a);radius=6+f*3}}
  const hitPhase=t>.48&&t<.59;
  // Racket is painted before the foreground arm, so an occluded hit disappears.
  const swing=Math.max(0,1-Math.abs(t-.54)/.09),racketX=releaseX-15+(1-swing)*-24,racketY=hitY+7;
  line(bodyX+26,151,racketX-9,racketY+22,'#e6a179',9);c.fillStyle='#cf6747';c.beginPath();c.ellipse(racketX,racketY,11,16,-.3,0,7);c.fill();line(racketX-5,racketY+13,racketX-9,racketY+22,'#815e42',5);dot(bx,by,radius);
  // Same pre-hit arm pose for all clips; only its withdrawal timing changes.
  const withdraw=Math.max(0,Math.min(1,(t-.36)/.12));
  if(s.covered&&hitPhase){const width=14+s.q*9;line(releaseX-26,hitY-6,releaseX+18,hitY+5,'#e6a179',width);line(bodyX-20,154,releaseX+18,hitY+5,'#e6a179',11)}else{const handX=releaseX-9-withdraw*(20+s.q*15),handY=releaseY+12+withdraw*14;line(bodyX-20,150,releaseX-42,157,'#e6a179',10);line(releaseX-42,157,handX+16,handY,'#e6a179',10);line(handX+16,handY,handX,handY,'#e6a179',7)}
  // Depth-only side inset. Right = toward server's body, left = toward receiver.
  c.fillStyle='#fff';c.fillRect(528,86,210,211);text('小侧视图 · 观察回抛方向',541,107,13);text('接球方 ←     → 身体',540,130,12);
  const ix=573,iy=255,ih=74,id=ih*Math.tan(s.angle*Math.PI/180);
  c.setLineDash([4,4]);line(ix,iy,ix,iy-ih,'#98acae',1);c.setLineDash([]);
  line(715,207,715,272,'#244a50',16);c.fillStyle='#e6a179';c.beginPath();c.arc(715,190,11,0,7);c.fill();line(704,226,ix+7,iy+10,'#e6a179',6);
  if(t<.5){const f=Math.sin(toss*Math.PI);line(ix,iy,ix+id*f,iy-ih*f,'#a7c1c2',1);dot(ix+id*f,iy-ih*f,4)}else{dot(ix,iy,4)}
  text('虚线为垂直方向',541,285,12);
  text(t<.1?'准备持球':t<.5?'抛球':t<.59?'击球瞬间':'飞行与落台',543,336,18);c.fillStyle='#c8f26b';c.fillRect(540,355,190*t,4);
  text('F 违规 / J 合规 · 动画结束后作答',25,414,13);
}
