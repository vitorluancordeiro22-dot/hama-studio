/* Nosso Mundinho — Pixel Engine 2.0
 * Conversão 100% local: remoção de fundo contíguo, recorte, enquadramento,
 * preservação de linhas e simplificação de sprites. Sem rede, sem IA.
 */
"use strict";
window.PixelEngine=(()=>{
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const canvas=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c;};
const luminance=p=>p[0]*.2126+p[1]*.7152+p[2]*.0722;
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
function cropSource(board){
 const im=board.img,nw=im.naturalWidth,nh=im.naturalHeight;
 let sx=nw*(board.cropLeft||0)/100,sy=nh*(board.cropTop||0)/100;
 let sw=nw*(1-((board.cropLeft||0)+(board.cropRight||0))/100),sh=nh*(1-((board.cropTop||0)+(board.cropBottom||0))/100);
 sw=Math.max(1,sw);sh=Math.max(1,sh);
 const scale=Math.min(1,640/Math.max(sw,sh));
 const w=Math.max(2,Math.round(sw*scale)),h=Math.max(2,Math.round(sh*scale));
 const c=canvas(w,h),ctx=c.getContext("2d",{willReadFrequently:true});
 ctx.imageSmoothingQuality="high";
 ctx.drawImage(im,sx,sy,sw,sh,0,0,w,h);
 return c;
}
function removeConnectedBackground(src,tolerance){
 const w=src.width,h=src.height,ctx=src.getContext("2d",{willReadFrequently:true});
 const frame=ctx.getImageData(0,0,w,h),d=frame.data;
// PNGs recortados já têm transparência; não apague traços escuros próximos da borda.
let transparentCorners=0;
for(const [x,y] of [[1,1],[w-2,1],[1,h-2],[w-2,h-2]])if(d[(y*w+x)*4+3]<110)transparentCorners++;
if(transparentCorners>=2)return src;
 const pick=(x,y)=>{let n=4*(y*w+x);return [d[n],d[n+1],d[n+2]];};
 const corners=[[1,1],[w-2,1],[1,h-2],[w-2,h-2]].map(([x,y])=>pick(x,y));
 let best=0,bestVotes=-1;for(let i=0;i<4;i++){let votes=0;for(let j=0;j<4;j++)if(dist(corners[i],corners[j])<45)votes++;if(votes>bestVotes){best=i;bestVotes=votes;}}
 const reference=corners[best],visited=new Uint8Array(w*h),queue=new Int32Array(w*h);
 let head=0,tail=0;
 function enqueue(n){if(n<0||n>=w*h||visited[n])return;visited[n]=1;const o=4*n;if(d[o+3]<90||dist([d[o],d[o+1],d[o+2]],reference)<=tolerance){queue[tail++]=n;}}
 for(let x=0;x<w;x++){enqueue(x);enqueue((h-1)*w+x);}
 for(let y=0;y<h;y++){enqueue(y*w);enqueue(y*w+w-1);}
 while(head<tail){let n=queue[head++];let x=n%w,y=(n/w)|0;d[4*n+3]=0;if(x>0)enqueue(n-1);if(x<w-1)enqueue(n+1);if(y>0)enqueue(n-w);if(y<h-1)enqueue(n+w);}
 ctx.putImageData(frame,0,0);
 return src;
}
function boundingBox(src){
 const w=src.width,h=src.height,ctx=src.getContext("2d",{willReadFrequently:true});
 const d=ctx.getImageData(0,0,w,h).data;let left=w,top=h,right=-1,bottom=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(d[(y*w+x)*4+3]>90){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
 if(right<left)return null;
 return {x:left,y:top,w:right-left+1,h:bottom-top+1};
}
function fitCrop(board,src){
 let box=board.autoCrop?boundingBox(src):null;
 if(!box)box={x:0,y:0,w:src.width,h:src.height};
 const margin=board.autoCrop?Math.max(2,Math.round(Math.max(box.w,box.h)*.045)):0;
 let x=Math.max(0,box.x-margin),y=Math.max(0,box.y-margin);
 let right=Math.min(src.width,box.x+box.w+margin),bottom=Math.min(src.height,box.y+box.h+margin);
 const trimmed=canvas(Math.max(1,right-x),Math.max(1,bottom-y));
 trimmed.getContext("2d").drawImage(src,x,y,right-x,bottom-y,0,0,trimmed.width,trimmed.height);
 return trimmed;
}
function process(board){
 let source=cropSource(board);
 if(board.erase)source=removeConnectedBackground(source,Number(board.bgTolerance??45));
 const cropped=fitCrop(board,source);
 const cutout=cropped;
 const factor=6,w=board.w,h=board.h,stage=canvas(w*factor,h*factor);
 const ctx=stage.getContext("2d",{willReadFrequently:true});
 ctx.clearRect(0,0,stage.width,stage.height);
 // Mantém proporções e deixa 1 célula de respiro em cada borda.
 const scale=Math.min((w-2)*factor/cropped.width,(h-2)*factor/cropped.height)*Number(board.zoom||1);
 const dw=cropped.width*scale,dh=cropped.height*scale;
 const shiftX=(Number(board.shiftX||0)/100)*w*factor,shiftY=(Number(board.shiftY||0)/100)*h*factor;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 const x=(stage.width-dw)/2+shiftX,y=(stage.height-dh)/2+shiftY;
 // Amostragem a 6x preserva linhas finas melhor que reduzir direto a 29x29.
 ctx.drawImage(cropped,x,y,dw,dh);
 const raw=ctx.getImageData(0,0,stage.width,stage.height).data;
 const pixels=[],dark=[],detail=[];
 const isSticker=board.style==="sticker",isCute=board.style==="fofinho";
 for(let cy=0;cy<h;cy++)for(let cx=0;cx<w;cx++){
  let count=0,rs=0,gs=0,bs=0,black=0,mid=0,rr=0,gg=0,bb=0,lumSum=0;
  const samples=[];
  for(let v=0;v<factor;v++)for(let u=0;u<factor;u++){
   const i=4*((cy*factor+v)*stage.width+(cx*factor+u));
   let a=raw[i+3]/255;if(a<.33)continue;
   const r=raw[i],g=raw[i+1],b=raw[i+2],l=r*.2126+g*.7152+b*.0722;
   count++;rs+=r;gs+=g;bs+=b;lumSum+=l;
   if(l<105){black++;rr+=r;gg+=g;bb+=b;}else if(l<165)mid++;
   samples.push([r,g,b,l]);
  }
  if(count<Math.max(5,(isCute?9:7))){pixels.push(-1);dark.push(false);detail.push(0);continue;}
  let r=rs/count,g=gs/count,b=bs/count;
  const fraction=black/count;
  // Fios e linhas pretas originais recebem prioridade para não virar cinza.
  const preserveDark=fraction>=(isSticker ? .14 : (isCute ? .21 : .29))&&black>=5;
  if(preserveDark){r=rr/black;g=gg/black;b=bb/black;}
  // Em vez de usar somente uma média que mistura duas regiões,
  // usa-se a mediana cromática local, quando há contraste forte.
  else if((isCute||isSticker)&&samples.length){
   const group=samples.filter(p=>p[3] >= 105);
   if(group.length>=5){
    group.sort((a,b)=>a[3]-b[3]);
    const pivot=group[(group.length/2)|0];
    if(Math.abs(lumSum/count-pivot[3])>15){r=(r+pivot[0])/2;g=(g+pivot[1])/2;b=(b+pivot[2])/2;}
   }
  }
  pixels.push([clamp(Math.round(r),0,255),clamp(Math.round(g),0,255),clamp(Math.round(b),0,255)]);
  dark.push(preserveDark);detail.push(fraction);
 }
 return {items:pixels,dark,detail,cutout,hasTransparency:!!board.erase||!!boundingBox(source)};
}
function chooseClosest(p,palette){let best=0,d=Infinity;for(let i=0;i<palette.length;i++){const v=palette[i],dd=(p[0]-v[0])**2+(p[1]-v[1])**2+(p[2]-v[2])**2;if(dd<d){d=dd;best=i;}}return best;}
function hsl(rgb){const [r,g,b]=rgb.map(x=>x/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let hue=0,s=0,l=(max+min)/2;if(d){s=d/(1-Math.abs(2*l-1));switch(max){case r:hue=((g-b)/d)%6;break;case g:hue=(b-r)/d+2;break;default:hue=(r-g)/d+4;}hue*=60;}return [((hue%360)+360)%360,s,l];}
function fromHSL(h,s,l){const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))));};return [f(0),f(8),f(4)];}
function adjustPalette(palette,theme){
 if(theme==="original")return palette;
 return palette.map(p=>{
  let [h,s,l]=hsl(p);
  if(l<.19 || (s<.1&&l<.32))return p;
  if(theme==="pastel"){s=clamp(s*.82+.12,0,.68);l=clamp(l*.78+.18,.40,.85);}
  if(theme==="viva"){s=clamp(s*1.30+.10,0,1);l=clamp((l-.5)*1.08+.5,.19,.90);}
  return fromHSL(h,s,l);
 });
}
function cleanup(points,w,h,levels,passes){
 let current=points.slice();
 for(let turn=0;turn<passes;turn++){
  const next=current.slice();
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
   const at=y*w+x,own=current[at];if(own<0)continue;
   const counts=new Map();
   for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++){
    if(x===xx&&y===yy)continue;
    const t=current[yy*w+xx];if(t>=0)counts.set(t,(counts.get(t)||0)+1);
   }
   let best=own,votes=0;
   for(const [n,nv]of counts){if(nv>votes){best=n;votes=nv;}}
   if(best!==own&&votes>=5&&(counts.get(own)||0)<=1&&levels[at]<.10)next[at]=best;
  }
  current=next;
 }
 return current;
}
function finish(board,result,source){
 let pixels=result.pixels.slice(),palette=result.palette.map(p=>p.slice());
 const w=board.w,h=board.h;
 if(board.cleanup && (board.style==="fofinho"||board.style==="sticker"))pixels=cleanup(pixels,w,h,source.detail,1);
 const darkColor=board.style==="sticker"?[36,32,45]:[47,42,58];
 let outlineIdx=-1;
 function outlineColor(){
  if(outlineIdx>=0)return outlineIdx;
  let darkest=-1,lum=999;
  palette.forEach((p,i)=>{const l=luminance(p);if(l<lum){lum=l;darkest=i;}});
  if(lum<78){outlineIdx=darkest;palette[outlineIdx]=darkColor.slice();}
  else{outlineIdx=palette.length;palette.push(darkColor.slice());}
  return outlineIdx;
 }
 if(board.outline){
  const output=pixels.slice();
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x;if(pixels[i]<0)continue;
   const adjacentBlank=x===0||y===0||x===w-1||y===h-1||pixels[i-1]<0||pixels[i+1]<0||pixels[i-w]<0||pixels[i+w]<0;
   const preserve=source.dark[i]&&source.detail[i]>.17;
   if(preserve || board.style==="sticker"&&adjacentBlank)output[i]=outlineColor();
  }
  pixels=output;
 }
 // Paletas pastéis/vivas aplicadas ao final, sem alterar os contornos escuros.
 palette=adjustPalette(palette,board.paletteMode||"original");
 if(outlineIdx>=0)palette[outlineIdx]=darkColor;
 return {pixels,palette,cutout:source.cutout};
}
return {process,finish};
})();