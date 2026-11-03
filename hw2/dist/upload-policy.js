// Allow previously saved camera pilot sessions without changing their tier or eligibility.
export function canUploadSession(session){
 return session.mode==='formal'&&(session.courseEligible===true||['medium','quick'].includes(session.tier));
}
export function recordClass(session){
 return session.courseEligible===true?'formal':'pilot';
}
export function uploadTrial(row){
 // The course endpoint accepts scalar fields; omit missing values rather than fabricate an RT.
 const result=Object.fromEntries(Object.entries(row).filter(([,value])=>value!==null&&value!==undefined));
 if(row.rt===null)result.rt_missing=true;
 return result;
}
