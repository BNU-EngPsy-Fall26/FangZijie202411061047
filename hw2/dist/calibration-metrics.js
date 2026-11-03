export function calibrationMetrics(errors,counts,width,height){
 const valid=errors.filter(Number.isFinite),mean=valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:null;
 const threshold=Math.round(Math.min(width,height)*.18);
 return {at:new Date().toISOString(),meanError:mean===null?null:Math.round(mean),threshold,points:valid.map(Math.round),samples:[...counts],qualityPass:valid.length===5&&counts.every(n=>n>=6)&&mean<threshold,errorGateEnabled:false,pass:valid.length>0};
}
