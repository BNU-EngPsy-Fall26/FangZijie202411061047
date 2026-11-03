export function shouldEnhance({condition,event,elapsed,looked,shown,signalFresh}){return condition===1&&['panel','speed','map'].includes(event)&&elapsed>=600&&!looked&&!shown&&signalFresh===true;}
