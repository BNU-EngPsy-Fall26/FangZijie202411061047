export const DEFAULT_PROJECT='8PQND4';
// Only migrate the retired default. Keep explicitly configured other projects.
export function projectCode(storage=localStorage){
 const saved=storage.getItem('starparcel.project');
 if(!saved||saved==='KJBQEM'){
  storage.setItem('starparcel.project',DEFAULT_PROJECT);
  return DEFAULT_PROJECT;
 }
 return saved;
}
