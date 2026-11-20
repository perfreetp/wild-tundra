(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function e(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=e(r);fetch(r.href,s)}})();/**
* @vue/shared v3.5.46
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/function Oc(n){const t=Object.create(null);for(const e of n.split(","))t[e]=1;return e=>e in t}const Fe={},xr=[],si=()=>{},_h=()=>!1,va=n=>n.charCodeAt(0)===111&&n.charCodeAt(1)===110&&(n.charCodeAt(2)>122||n.charCodeAt(2)<97),xa=n=>n.startsWith("onUpdate:"),Ze=Object.assign,Bc=(n,t)=>{const e=n.indexOf(t);e>-1&&n.splice(e,1)},um=Object.prototype.hasOwnProperty,Te=(n,t)=>um.call(n,t),se=Array.isArray,Yi=n=>Ms(n)==="[object Map]",us=n=>Ms(n)==="[object Set]",Au=n=>Ms(n)==="[object Date]",he=n=>typeof n=="function",Ye=n=>typeof n=="string",ai=n=>typeof n=="symbol",Oe=n=>n!==null&&typeof n=="object",gh=n=>(Oe(n)||he(n))&&he(n.then)&&he(n.catch),vh=Object.prototype.toString,Ms=n=>vh.call(n),fm=n=>Ms(n).slice(8,-1),xh=n=>Ms(n)==="[object Object]",zc=n=>Ye(n)&&n!=="NaN"&&n[0]!=="-"&&""+parseInt(n,10)===n,Os=Oc(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"),hm=1e4,Ma=n=>{let t=Object.create(null),e=0;return(i=>{const r=t[i];return r!==void 0?r:(++e>hm&&(t=Object.create(null),e=1),t[i]=n(i))})},dm=/-\w/g,Wn=Ma(n=>n.replace(dm,t=>t.slice(1).toUpperCase())),pm=/\B([A-Z])/g,Dr=Ma(n=>n.replace(pm,"-$1").toLowerCase()),Mh=Ma(n=>n.charAt(0).toUpperCase()+n.slice(1)),Wa=Ma(n=>n?`on${Mh(n)}`:""),ii=(n,t)=>!Object.is(n,t),$o=(n,...t)=>{for(let e=0;e<n.length;e++)n[e](...t)},Sh=(n,t,e,i=!1)=>{Object.defineProperty(n,t,{configurable:!0,enumerable:!1,writable:i,value:e})},Vc=n=>{const t=parseFloat(n);return isNaN(t)?n:t};let wu;const Sa=()=>wu||(wu=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{});function ya(n){if(se(n)){const t={};for(let e=0;e<n.length;e++){const i=n[e],r=Ye(i)?vm(i):ya(i);if(r)for(const s in r)t[s]=r[s]}return t}else if(Ye(n)||Oe(n))return n}const mm=/;(?![^(]*\))/g,_m=/:([^]+)/,gm=/"(?:[^"\\]|\\[^])*"|'(?:[^'\\]|\\[^])*'|\\[^]|\/\*[^]*?\*\//g;function vm(n){const t={};return n.replace(gm,e=>e.startsWith("/*")?"":e).split(mm).forEach(e=>{if(e){const i=e.split(_m);i.length>1&&(t[i[0].trim()]=i[1].trim())}}),t}function Ea(n){let t="";if(Ye(n))t=n;else if(se(n))for(let e=0;e<n.length;e++){const i=Ea(n[e]);i&&(t+=i+" ")}else if(Oe(n))for(const e in n)n[e]&&(t+=e+" ");return t.trim()}const xm="itemscope,allowfullscreen,disablepictureinpicture,disableremoteplayback,formnovalidate,ismap,nomodule,novalidate,playsinline,readonly",Mm=Oc(xm);function yh(n){return!!n||n===""}function Sm(n,t,e){if(n.length!==t.length)return!1;let i=!0;for(let r=0;i&&r<n.length;r++)i=Ss(n[r],t[r],e);return i}function Ru(n,t,e){if(n.size!==t.size)return!1;const i=Array.from(t),r=new Uint8Array(i.length);for(const s of n){let o=-1;for(let a=0;a<i.length;a++)if(!r[a]&&Ss(s,i[a],e)){o=a;break}if(o<0)return!1;r[o]=1}return!0}function ym(n,t,e){let i=Yi(n),r=Yi(t);if(i||r||(i=us(n),r=us(t),i||r))return i&&r?Ru(n,t,e):!1;const s=Object.keys(n).length,o=Object.keys(t).length;if(s!==o)return!1;for(const a in n){const l=Te(n,a),c=Te(t,a);if(l&&!c||!l&&c||!Ss(n[a],t[a],e))return!1}return Pu(n)===Pu(t)}function Cu(n,t,e,i){e||(e=[new Map,new Map]);const[r,s]=e;if(r.has(n)||s.has(t))return r.get(n)===t&&s.get(t)===n;r.set(n,t),s.set(t,n);const o=i(n,t,e);return r.delete(n),s.delete(t),o}function Ss(n,t,e){if(n===t)return!0;let i=Au(n),r=Au(t);return i||r?i&&r?n.getTime()===t.getTime():!1:(i=ai(n),r=ai(t),i||r?n===t:(i=se(n),r=se(t),i||r?i&&r?Cu(n,t,e,Sm):!1:(i=Oe(n),r=Oe(t),i||r?!i||!r?!1:Cu(n,t,e,ym):String(n)===String(t))))}function Eh(n,t){return n.findIndex(e=>Ss(e,t))}function Pu(n){return Object.getPrototypeOf(n)===null&&n[Symbol.toPrimitive]==null&&typeof n.toString!="function"&&typeof n.valueOf!="function"?Ms(n):String(n)}const bh=n=>!!(n&&n.__v_isRef===!0),yn=n=>Ye(n)?n:n==null?"":se(n)||Oe(n)&&(n.toString===vh||!he(n.toString))?bh(n)?yn(n.value):JSON.stringify(n,Th,2):String(n),Th=(n,t)=>bh(t)?Th(n,t.value):Yi(t)?{[`Map(${t.size})`]:[...t.entries()].reduce((e,[i,r],s)=>(e[Xa(i,s)+" =>"]=r,e),{})}:us(t)?{[`Set(${t.size})`]:[...t.values()].map(e=>Xa(e))}:ai(t)?Xa(t):Oe(t)&&!se(t)&&!xh(t)?String(t):t,Xa=(n,t="")=>{var e;return ai(n)?`Symbol(${(e=n.description)!=null?e:t})`:n};/**
* @vue/reactivity v3.5.46
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let rn;class Em{constructor(t=!1){this.detached=t,this._active=!0,this._on=0,this.effects=[],this.cleanups=[],this._isPaused=!1,this._warnOnRun=!0,this.__v_skip=!0,!t&&rn&&(rn.active?(this.parent=rn,this.index=(rn.scopes||(rn.scopes=[])).push(this)-1):(this._active=!1,this._warnOnRun=!1))}get active(){return this._active}pause(){if(this._active){this._isPaused=!0;let t,e;if(this.scopes){const i=this.scopes.slice();for(t=0,e=i.length;t<e;t++)i[t].pause()}for(t=0,e=this.effects.length;t<e;t++)this.effects[t].pause()}}resume(){if(this._active&&this._isPaused){this._isPaused=!1;let t,e;if(this.scopes){const r=this.scopes.slice();for(t=0,e=r.length;t<e;t++)r[t].resume()}const i=this.effects.slice();for(t=0,e=i.length;t<e;t++)i[t].resume()}}run(t){if(this._active){const e=rn;try{return rn=this,t()}finally{rn=e}}}on(){++this._on===1&&(this.prevScope=rn,rn=this)}off(){if(this._on>0&&--this._on===0){if(rn===this)rn=this.prevScope;else{let t=rn;for(;t;){if(t.prevScope===this){t.prevScope=this.prevScope;break}t=t.prevScope}}this.prevScope=void 0}}stop(t){if(this._active){this._active=!1;let e,i;for(e=0,i=this.effects.length;e<i;e++)this.effects[e].stop();for(this.effects.length=0,e=0,i=this.cleanups.length;e<i;e++)this.cleanups[e]();if(this.cleanups.length=0,this.scopes){const r=this.scopes.slice();for(e=0,i=r.length;e<i;e++)r[e].stop(!0);this.scopes.length=0}if(!this.detached&&this.parent&&!t){const r=this.parent.scopes.pop();r&&r!==this&&(this.parent.scopes[this.index]=r,r.index=this.index)}this.parent=void 0}}}function bm(){return rn}let Ve;const $a=new WeakSet;class Ah{constructor(t){this.fn=t,this.deps=void 0,this.depsTail=void 0,this.flags=5,this.next=void 0,this.cleanup=void 0,this.scheduler=void 0,rn&&(rn.active?rn.effects.push(this):this.flags&=-2)}pause(){this.flags|=64}resume(){this.flags&64&&(this.flags&=-65,$a.has(this)&&($a.delete(this),this.trigger()))}notify(){this.flags&2&&!(this.flags&32)||this.flags&8||Rh(this)}run(){if(!(this.flags&1))return this.fn();this.flags|=2,Du(this),Ch(this);const t=Ve,e=Xn;Ve=this,Xn=!0;try{return this.fn()}finally{Ph(this),Ve=t,Xn=e,this.flags&=-3}}stop(){if(this.flags&1){for(let t=this.deps;t;t=t.nextDep)Gc(t);this.deps=this.depsTail=void 0,Du(this),this.onStop&&this.onStop(),this.flags&=-2}}trigger(){this.flags&64?$a.add(this):this.scheduler?this.scheduler():this.runIfDirty()}runIfDirty(){Fl(this)&&this.run()}get dirty(){return Fl(this)}}let wh=0,Bs,zs;function Rh(n,t=!1){if(n.flags|=8,t){n.next=zs,zs=n;return}n.next=Bs,Bs=n}function Hc(){wh++}function kc(){if(--wh>0)return;if(zs){let t=zs;for(zs=void 0;t;){const e=t.next;t.next=void 0,t.flags&=-9,t=e}}let n;for(;Bs;){let t=Bs;for(Bs=void 0;t;){const e=t.next;if(t.next=void 0,t.flags&=-9,t.flags&1)try{t.trigger()}catch(i){n||(n=i)}t=e}}if(n)throw n}function Ch(n){for(let t=n.deps;t;t=t.nextDep)t.version=-1,t.prevActiveLink=t.dep.activeLink,t.dep.activeLink=t}function Ph(n){let t,e=n.depsTail,i=e;for(;i;){const r=i.prevDep;i.version===-1?(i===e&&(e=r),Gc(i),Tm(i)):t=i,i.dep.activeLink=i.prevActiveLink,i.prevActiveLink=void 0,i=r}n.deps=t,n.depsTail=e}function Fl(n){for(let t=n.deps;t;t=t.nextDep)if(t.dep.version!==t.version||t.dep.computed&&(Dh(t.dep.computed)||t.dep.version!==t.version))return!0;return!!n._dirty}function Dh(n){if(n.flags&4&&!(n.flags&16)||(n.flags&=-17,n.globalVersion===Ys)||(n.globalVersion=Ys,!n.isSSR&&n.flags&128&&(!n.deps&&!n._dirty||!Fl(n))))return;n.flags|=2;const t=n.dep,e=Ve,i=Xn;Ve=n,Xn=!0;try{Ch(n);const r=n.fn(n._value);(t.version===0||ii(r,n._value))&&(n.flags|=128,n._value=r,t.version++)}catch(r){throw t.version++,r}finally{Ve=e,Xn=i,Ph(n),n.flags&=-3}}function Gc(n,t=!1){const{dep:e,prevSub:i,nextSub:r}=n;if(i&&(i.nextSub=r,n.prevSub=void 0),r&&(r.prevSub=i,n.nextSub=void 0),e.subs===n&&(e.subs=i,!i&&e.computed)){e.computed.flags&=-5;for(let s=e.computed.deps;s;s=s.nextDep)Gc(s,!0)}!t&&!--e.sc&&e.map&&e.map.delete(e.key)}function Tm(n){const{prevDep:t,nextDep:e}=n;t&&(t.nextDep=e,n.prevDep=void 0),e&&(e.prevDep=t,n.nextDep=void 0)}let Xn=!0;const Lh=[];function li(){Lh.push(Xn),Xn=!1}function ci(){const n=Lh.pop();Xn=n===void 0?!0:n}function Du(n){const{cleanup:t}=n;if(n.cleanup=void 0,t){const e=Ve;Ve=void 0;try{t()}finally{Ve=e}}}let Ys=0;class Am{constructor(t,e){this.sub=t,this.dep=e,this.version=e.version,this.nextDep=this.prevDep=this.nextSub=this.prevSub=this.prevActiveLink=void 0}}class Wc{constructor(t){this.computed=t,this.version=0,this.activeLink=void 0,this.subs=void 0,this.map=void 0,this.key=void 0,this.sc=0,this.__v_skip=!0}track(t){if(!Ve||!Xn||Ve===this.computed)return;let e=this.activeLink;if(e===void 0||e.sub!==Ve)e=this.activeLink=new Am(Ve,this),Ve.deps?(e.prevDep=Ve.depsTail,Ve.depsTail.nextDep=e,Ve.depsTail=e):Ve.deps=Ve.depsTail=e,Ih(e);else if(e.version===-1&&(e.version=this.version,e.nextDep)){const i=e.nextDep;i.prevDep=e.prevDep,e.prevDep&&(e.prevDep.nextDep=i),e.prevDep=Ve.depsTail,e.nextDep=void 0,Ve.depsTail.nextDep=e,Ve.depsTail=e,Ve.deps===e&&(Ve.deps=i)}return e}trigger(t){this.version++,Ys++,this.notify(t)}notify(t){Hc();try{for(let e=this.subs;e;e=e.prevSub)e.sub.notify()&&e.sub.dep.notify()}finally{kc()}}}function Ih(n){if(n.dep.sc++,n.sub.flags&4){const t=n.dep.computed;if(t&&!n.dep.subs){t.flags|=20;for(let i=t.deps;i;i=i.nextDep)Ih(i)}const e=n.dep.subs;e!==n&&(n.prevSub=e,e&&(e.nextSub=n)),n.dep.subs=n}}const Ol=new WeakMap,Er=Symbol(""),Bl=Symbol(""),qs=Symbol("");function cn(n,t,e){if(Xn&&Ve){let i=Ol.get(n);i||Ol.set(n,i=new Map);let r=i.get(e);r||(i.set(e,r=new Wc),r.map=i,r.key=e),r.track()}}function Ti(n,t,e,i,r,s){const o=Ol.get(n);if(!o){Ys++;return}const a=l=>{l&&l.trigger()};if(Hc(),t==="clear")o.forEach(a);else{const l=se(n),c=l&&zc(e);if(l&&e==="length"){const u=Number(i);o.forEach((f,p)=>{(p==="length"||p===qs||!ai(p)&&p>=u)&&a(f)})}else switch((e!==void 0||o.has(void 0))&&a(o.get(e)),c&&a(o.get(qs)),t){case"add":l?c&&a(o.get("length")):(a(o.get(Er)),Yi(n)&&a(o.get(Bl)));break;case"delete":l||(a(o.get(Er)),Yi(n)&&a(o.get(Bl)));break;case"set":Yi(n)&&a(o.get(Er));break}}kc()}function Or(n){const t=Le(n);return t===n||(cn(t,"iterate",qs),$n(n))?t:Pi(n)?br(n)?t.map(e=>Rr(ui(e))):t.map(Rr):t.map(ui)}function Xc(n){return cn(n=Le(n),"iterate",qs),n}function Qn(n,t){return Pi(n)?Rr(br(n)?ui(t):t):ui(t)}const wm={__proto__:null,[Symbol.iterator](){return Ya(this,Symbol.iterator,n=>Qn(this,n))},concat(...n){return Or(this).concat(...n.map(t=>se(t)?Or(t):t))},entries(){return Ya(this,"entries",n=>(n[1]=Qn(this,n[1]),n))},every(n,t){return _i(this,"every",n,t,void 0,arguments)},filter(n,t){return _i(this,"filter",n,t,e=>e.map(i=>Qn(this,i)),arguments)},find(n,t){return _i(this,"find",n,t,e=>Qn(this,e),arguments)},findIndex(n,t){return _i(this,"findIndex",n,t,void 0,arguments)},findLast(n,t){return _i(this,"findLast",n,t,e=>Qn(this,e),arguments)},findLastIndex(n,t){return _i(this,"findLastIndex",n,t,void 0,arguments)},forEach(n,t){return _i(this,"forEach",n,t,void 0,arguments)},includes(...n){return qa(this,"includes",n)},indexOf(...n){return qa(this,"indexOf",n)},join(n){return Or(this).join(n)},lastIndexOf(...n){return qa(this,"lastIndexOf",n)},map(n,t){return _i(this,"map",n,t,void 0,arguments)},pop(){return ws(this,"pop")},push(...n){return ws(this,"push",n)},reduce(n,...t){return Iu(this,"reduce",n,t)},reduceRight(n,...t){return Iu(this,"reduceRight",n,t)},shift(){return ws(this,"shift")},some(n,t){return _i(this,"some",n,t,void 0,arguments)},splice(...n){return ws(this,"splice",n)},toReversed(){return Or(this).toReversed()},toSorted(n){return Or(this).toSorted(n)},toSpliced(...n){return Or(this).toSpliced(...n)},unshift(...n){return ws(this,"unshift",n)},values(){return Ya(this,"values",n=>Qn(this,n))}};function Ya(n,t,e){const i=Xc(n),r=i[t],s=r.call(i);if(i!==n&&!$n(n)){if(s[Symbol.toStringTag]==="Array Iterator"){const o=Object.create(Object.getPrototypeOf(s));return o.next=()=>Lu(s.next(),e),r!==Uh[t]&&Object.defineProperties(o,{return:{get(){const a=s.return;return typeof a=="function"?a.bind(s):a}},throw:{get(){const a=s.throw;return typeof a=="function"?a.bind(s):a}}}),o}s._next=s.next,s.next=()=>Lu(s._next(),e)}return s}function Lu(n,t){return n.done||(n.value=t(n.value)),n}const Uh=Array.prototype;function _i(n,t,e,i,r,s){const o=Xc(n),a=o!==n&&!$n(n),l=o[t];if(l!==Uh[t]){const f=l.apply(n,s);return a?ui(f):f}let c=e;o!==n&&(a?c=function(f,p){return e.call(this,Qn(n,f),p,n)}:e.length>2&&(c=function(f,p){return e.call(this,f,p,n)}));const u=l.call(o,c,i);return a&&r?r(u):u}function Iu(n,t,e,i){const r=Xc(n),s=r!==n&&!$n(n);let o=e,a=!1;r!==n&&(s?(a=i.length===0,o=function(c,u,f){return a&&(a=!1,c=Qn(n,c)),e.call(this,c,Qn(n,u),f,n)}):e.length>3&&(o=function(c,u,f){return e.call(this,c,u,f,n)}));const l=r[t](o,...i);return a?Qn(n,l):l}function qa(n,t,e){const i=Le(n);cn(i,"iterate",qs);const r=i[t](...e);return(r===-1||r===!1)&&qc(e[0])?(e[0]=Le(e[0]),i[t](...e)):r}function ws(n,t,e=[]){li(),Hc();const i=Le(n)[t].apply(n,e);return kc(),ci(),i}const Rm=Oc("__proto__,__v_isRef,__isVue"),Nh=new Set(Object.getOwnPropertyNames(Symbol).filter(n=>n!=="arguments"&&n!=="caller").map(n=>Symbol[n]).filter(ai));function Cm(n){ai(n)||(n=String(n));const t=Le(this);return cn(t,"has",n),t.hasOwnProperty(n)}class Fh{constructor(t=!1,e=!1){this._isReadonly=t,this._isShallow=e}get(t,e,i){if(e==="__v_skip")return t.__v_skip;const r=this._isReadonly,s=this._isShallow;if(e==="__v_isReactive")return!r;if(e==="__v_isReadonly")return r;if(e==="__v_isShallow")return s;if(e==="__v_raw")return i===(r?s?zm:Vh:s?zh:Bh).get(t)||Object.getPrototypeOf(t)===Object.getPrototypeOf(i)?t:void 0;const o=se(t);if(!r){let l;if(o&&(l=wm[e]))return l;if(e==="hasOwnProperty")return Cm}const a=Reflect.get(t,e,un(t)?t:i);if((ai(e)?Nh.has(e):Rm(e))||(r||cn(t,"get",e),s))return a;if(un(a)){const l=o&&zc(e)?a:a.value;return r&&Oe(l)?Vl(l):l}return Oe(a)?r?Vl(a):ba(a):a}}class Oh extends Fh{constructor(t=!1){super(!1,t)}set(t,e,i,r){let s=t[e];const o=se(t)&&zc(e);if(!this._isShallow){const c=Pi(s);if(!$n(i)&&!Pi(i)&&(s=Le(s),i=Le(i)),!o&&un(s)&&!un(i))return c||(s.value=i),!0}const a=o?Number(e)<t.length:Te(t,e),l=Reflect.set(t,e,i,un(t)?t:r);return t===Le(r)&&l&&(a?ii(i,s)&&Ti(t,"set",e,i):Ti(t,"add",e,i)),l}deleteProperty(t,e){const i=Te(t,e);t[e];const r=Reflect.deleteProperty(t,e);return r&&i&&Ti(t,"delete",e,void 0),r}has(t,e){const i=Reflect.has(t,e);return(!ai(e)||!Nh.has(e))&&cn(t,"has",e),i}ownKeys(t){return cn(t,"iterate",se(t)?"length":Er),Reflect.ownKeys(t)}}class Pm extends Fh{constructor(t=!1){super(!0,t)}set(t,e){return!0}deleteProperty(t,e){return!0}}const Dm=new Oh,Lm=new Pm,Im=new Oh(!0);const zl=n=>n,mo=n=>Reflect.getPrototypeOf(n);function Um(n,t,e){return function(...i){const r=this.__v_raw,s=Le(r),o=Yi(s),a=n==="entries"||n===Symbol.iterator&&o,l=n==="keys"&&o,c=r[n](...i),u=e?zl:t?Rr:ui;return!t&&cn(s,"iterate",l?Bl:Er),Ze(Object.create(c),{next(){const{value:f,done:p}=c.next();return p?{value:f,done:p}:{value:a?[u(f[0]),u(f[1])]:u(f),done:p}}})}}function _o(n){return function(...t){return n==="delete"?!1:n==="clear"?void 0:this}}function Nm(n,t){const e={get(r){const s=this.__v_raw,o=Le(s),a=Le(r);n||(ii(r,a)&&cn(o,"get",r),cn(o,"get",a));const{has:l}=mo(o),c=t?zl:n?Rr:ui;if(l.call(o,r))return c(s.get(r));if(l.call(o,a))return c(s.get(a));s!==o&&s.get(r)},get size(){const r=this.__v_raw;return!n&&cn(Le(r),"iterate",Er),r.size},has(r){const s=this.__v_raw,o=Le(s),a=Le(r);return n||(ii(r,a)&&cn(o,"has",r),cn(o,"has",a)),r===a?s.has(r):s.has(r)||s.has(a)},forEach(r,s){const o=this,a=o.__v_raw,l=Le(a),c=t?zl:n?Rr:ui;return!n&&cn(l,"iterate",Er),a.forEach((u,f)=>r.call(s,c(u),c(f),o))}};return Ze(e,n?{add:_o("add"),set:_o("set"),delete:_o("delete"),clear:_o("clear")}:{add(r){const s=Le(this),o=mo(s),a=Le(r),l=!t&&!$n(r)&&!Pi(r)?a:r;return o.has.call(s,l)||ii(r,l)&&o.has.call(s,r)||ii(a,l)&&o.has.call(s,a)||(s.add(l),Ti(s,"add",l,l)),this},set(r,s){!t&&!$n(s)&&!Pi(s)&&(s=Le(s));const o=Le(this),{has:a,get:l}=mo(o);let c=a.call(o,r);c||(r=Le(r),c=a.call(o,r));const u=l.call(o,r);return o.set(r,s),c?ii(s,u)&&Ti(o,"set",r,s):Ti(o,"add",r,s),this},delete(r){const s=Le(this),{has:o,get:a}=mo(s);let l=o.call(s,r);l||(r=Le(r),l=o.call(s,r)),a&&a.call(s,r);const c=s.delete(r);return l&&Ti(s,"delete",r,void 0),c},clear(){const r=Le(this),s=r.size!==0,o=r.clear();return s&&Ti(r,"clear",void 0,void 0),o}}),["keys","values","entries",Symbol.iterator].forEach(r=>{e[r]=Um(r,n,t)}),e}function $c(n,t){const e=Nm(n,t);return(i,r,s)=>r==="__v_isReactive"?!n:r==="__v_isReadonly"?n:r==="__v_isShallow"?t:r==="__v_raw"?i:Reflect.get(Te(e,r)&&r in i?e:i,r,s)}const Fm={get:$c(!1,!1)},Om={get:$c(!1,!0)},Bm={get:$c(!0,!1)};const Bh=new WeakMap,zh=new WeakMap,Vh=new WeakMap,zm=new WeakMap;function Vm(n){switch(n){case"Object":case"Array":return 1;case"Map":case"Set":case"WeakMap":case"WeakSet":return 2;default:return 0}}function ba(n){return Pi(n)?n:Yc(n,!1,Dm,Fm,Bh)}function Hm(n){return Yc(n,!1,Im,Om,zh)}function Vl(n){return Yc(n,!0,Lm,Bm,Vh)}function Yc(n,t,e,i,r){if(!Oe(n)||n.__v_raw&&!(t&&n.__v_isReactive)||n.__v_skip||!Object.isExtensible(n))return n;const s=r.get(n);if(s)return s;const o=Vm(fm(n));if(o===0)return n;const a=new Proxy(n,o===2?i:e);return r.set(n,a),a}function br(n){return Pi(n)?br(n.__v_raw):!!(n&&n.__v_isReactive)}function Pi(n){return!!(n&&n.__v_isReadonly)}function $n(n){return!!(n&&n.__v_isShallow)}function qc(n){return n?!!n.__v_raw:!1}function Le(n){const t=n&&n.__v_raw;return t?Le(t):n}function km(n){return!Te(n,"__v_skip")&&Object.isExtensible(n)&&Sh(n,"__v_skip",!0),n}const ui=n=>Oe(n)?ba(n):n,Rr=n=>Oe(n)?Vl(n):n;function un(n){return n?n.__v_isRef===!0:!1}function na(n){return Gm(n,!1)}function Gm(n,t){return un(n)?n:new Wm(n,t)}class Wm{constructor(t,e){this.dep=new Wc,this.__v_isRef=!0,this.__v_isShallow=!1,this._rawValue=e?t:Le(t),this._value=e?t:ui(t),this.__v_isShallow=e}get value(){return this.dep.track(),this._value}set value(t){const e=this._rawValue,i=this.__v_isShallow||$n(t)||Pi(t);t=i?t:Le(t),ii(t,e)&&(this._rawValue=t,this._value=i?t:ui(t),this.dep.trigger())}}function fe(n){return un(n)?n.value:n}const Xm={get:(n,t,e)=>t==="__v_raw"?n:fe(Reflect.get(n,t,e)),set:(n,t,e,i)=>{const r=n[t];return un(r)&&!un(e)?(r.value=e,!0):Reflect.set(n,t,e,i)}};function Hh(n){return br(n)?n:new Proxy(n,Xm)}class $m{constructor(t,e,i){this.fn=t,this.setter=e,this._value=void 0,this.dep=new Wc(this),this.__v_isRef=!0,this.deps=void 0,this.depsTail=void 0,this.flags=16,this.globalVersion=Ys-1,this.next=void 0,this.effect=this,this.__v_isReadonly=!e,this.isSSR=i}notify(){if(this.flags|=16,!(this.flags&8)&&Ve!==this)return Rh(this,!0),!0}get value(){const t=this.dep.track();return Dh(this),t&&(t.version=this.dep.version),this._value}set value(t){this.setter&&this.setter(t)}}function Ym(n,t,e=!1){let i,r;return he(n)?i=n:(i=n.get,r=n.set),new $m(i,r,e)}const go={},ia=new WeakMap;let dr;function qm(n,t=!1,e=dr){if(e){let i=ia.get(e);i||ia.set(e,i=[]),i.push(n)}}function jm(n,t,e=Fe){const{immediate:i,deep:r,once:s,scheduler:o,augmentJob:a,call:l}=e,c=S=>r?S:$n(S)||r===!1||r===0?Ai(S,1):Ai(S);let u,f,p,_,x=!1,M=!1;if(un(n)?(f=()=>n.value,x=$n(n)):br(n)?(f=()=>c(n),x=!0):se(n)?(M=!0,x=n.some(S=>br(S)||$n(S)),f=()=>n.map(S=>{if(un(S))return S.value;if(br(S))return c(S);if(he(S))return l?l(S,2):S()})):he(n)?t?f=l?()=>l(n,2):n:f=()=>{if(p){li();try{p()}finally{ci()}}const S=dr;dr=u;try{return l?l(n,3,[_]):n(_)}finally{dr=S}}:f=si,t&&r){const S=f,V=r===!0?1/0:r;f=()=>Ai(S(),V)}const g=bm(),m=()=>{u.stop(),g&&g.active&&Bc(g.effects,u)};if(s&&t){const S=t;t=(...V)=>{try{return S(...V)}finally{m()}}}let L=M?new Array(n.length).fill(go):go;const R=S=>{if(!(!(u.flags&1)||!u.dirty&&!S))if(t){const V=u.run();if(S||r||x||(M?V.some((C,I)=>ii(C,L[I])):ii(V,L))){const C=dr;li();try{p&&p(),dr=u;const I=[V,L===go?void 0:M&&L[0]===go?[]:L,_];L=V,l?l(t,3,I):t(...I)}finally{dr=C,ci()}}}else u.run()};return a&&a(R),u=new Ah(f),u.scheduler=o?()=>o(R,!1):R,_=S=>qm(S,!1,u),p=u.onStop=()=>{const S=ia.get(u);if(S){if(l)l(S,4);else for(const V of S)V();ia.delete(u)}},t?i?R(!0):L=u.run():o?o(R.bind(null,!0),!0):u.run(),m.pause=u.pause.bind(u),m.resume=u.resume.bind(u),m.stop=m,m}function Ai(n,t=1/0,e){if(t<=0||!Oe(n)||n.__v_skip||(e=e||new Map,(e.get(n)||0)>=t))return n;if(e.set(n,t),t--,un(n))Ai(n.value,t,e);else if(se(n))for(let i=0;i<n.length;i++)Ai(n[i],t,e);else if(us(n)||Yi(n))n.forEach(i=>{Ai(i,t,e)});else if(xh(n)){for(const i in n)Ai(n[i],t,e);for(const i of Object.getOwnPropertySymbols(n))Object.prototype.propertyIsEnumerable.call(n,i)&&Ai(n[i],t,e)}return n}/**
* @vue/runtime-core v3.5.46
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/function no(n,t,e,i){try{return i?n(...i):n()}catch(r){Ta(r,t,e)}}function jn(n,t,e,i){if(he(n)){const r=no(n,t,e,i);return r&&gh(r)&&r.catch(s=>{Ta(s,t,e,void 0,!0)}),r}if(se(n)){const r=[];for(let s=0;s<n.length;s++)r.push(jn(n[s],t,e,i));return r}}function Ta(n,t,e,i=!0,r=!1){const s=t?t.vnode:null,{errorHandler:o,throwUnhandledErrorInProduction:a}=t&&t.appContext.config||Fe;if(t){let l=t.parent;const c=t.proxy,u=`https://vuejs.org/error-reference/#runtime-${e}`;for(;l;){const f=l.ec;if(f&&!l.isUnmounted&&(!r||l.scope.active)){for(let p=0;p<f.length;p++)if(f[p](n,c,u)===!1)return}l=l.parent}if(o){li(),no(o,null,10,[n,c,u]),ci();return}}Km(n,e,s,i,a)}function Km(n,t,e,i=!0,r=!1){if(r)throw n;console.error(n)}const gn=[];let Hn=-1;const ti=[];let Gi=null,Jr=0;const kh=Promise.resolve();let ra=null;function Zm(n){const t=ra||kh;return n?t.then(this?n.bind(this):n):t}function Jm(n){let t=Hn+1,e=gn.length;for(;t<e;){const i=t+e>>>1,r=gn[i],s=js(r);s<n||s===n&&r.flags&2?t=i+1:e=i}return t}function jc(n){if(!(n.flags&1)){const t=js(n),e=gn[gn.length-1];!e||!(n.flags&2)&&t>=js(e)?gn.push(n):gn.splice(Jm(t),0,n),n.flags|=1,Gh()}}function Gh(){ra||(ra=kh.then($h))}function Qm(n){if(!se(n))Gi&&n.id===-1?Gi.splice(Jr+1,0,n):n.flags&1||(ti.push(n),n.flags|=1);else for(let t=0;t<n.length;t++)ti.push(n[t]);Gh()}function Wh(n,t,e,i=Hn+1){for(;i<gn.length;i++){const r=gn[i];if(r&&r.flags&2){if(n&&r.id!==n.uid||t!==void 0&&!(r.id>=t))continue;gn.splice(i,1),i=n?i-1:Hn,r.flags&4&&(r.flags&=-2),r(),r.flags&4||(r.flags&=-2)}}}function Xh(n,t,e=0){if(ti.length){let i=ti,r=0;if(t){i=[];for(let o=0;o<ti.length;o++){const a=ti[o];(a.i!==void 0?!a.i||a.i.uid<e:t.has(a))?ti[r++]=a:i.push(a)}}const s=[...new Set(i)].sort((o,a)=>js(o)-js(a));if(ti.length=r,Gi){for(let o=0;o<s.length;o++)Gi.push(s[o]);return}for(Gi=s,Jr=0;Jr<Gi.length;Jr++){const o=Gi[Jr];o.flags&4&&(o.flags&=-2),o.flags&8||o(),o.flags&=-2}Gi=null,Jr=0}}let ja=!1;function t_(n,t){if(ja){n();return}const e=t===void 0?void 0:new Set(ti);n(),ja=!0;try{Wh(void 0,t),Xh(void 0,e,t)}finally{ja=!1}}const js=n=>n.id==null?n.flags&2?-1:1/0:n.id;function $h(n){try{for(Hn=0;Hn<gn.length;Hn++){const t=gn[Hn];t&&!(t.flags&8)&&(t.flags&4&&(t.flags&=-2),no(t,t.i,t.i?15:14),t.flags&4||(t.flags&=-2))}}finally{for(;Hn<gn.length;Hn++){const t=gn[Hn];t&&(t.flags&=-2)}Hn=-1,gn.length=0,Xh(),ra=null,(gn.length||ti.length)&&$h()}}let In=null,Yh=null;function sa(n){const t=In;return In=n,Yh=n&&n.type.__scopeId||null,t}function e_(n,t=In,e){if(!t||n._n)return n;const i=(...r)=>{i._d&&Wu(-1);const s=sa(t),o=Ar.length;let a;try{a=n(...r)}finally{for(let l=Ar.length;l>o;l--)gd();sa(s),i._d&&Wu(1)}return a};return i._n=!0,i._c=!0,i._d=!0,i}function pr(n,t){if(In===null)return n;const e=Da(In),i=n.dirs||(n.dirs=[]);for(let r=0;r<t.length;r++){let[s,o,a,l=Fe]=t[r];s&&(he(s)&&(s={mounted:s,updated:s}),s.deep&&Ai(o),i.push({dir:s,instance:e,value:o,oldValue:void 0,arg:a,modifiers:l}))}return n}function sr(n,t,e,i){let r=n;if(i==="beforeMount")n._mount=n;else if(i==="beforeUpdate"){const a=t&&t._mount;a&&(a._latest=n,n._mount=a)}else if(i==="mounted"){const a=n._latest;n._mount=n._latest=void 0,a&&(r=a,a._mount=void 0)}const s=r.dirs,o=t&&t.dirs;for(let a=0;a<s.length;a++){let l=s[a];o?l.oldValue=o[a].value:i==="mounted"&&l.oldValue!==void 0&&(l=Ze({},l,{oldValue:void 0}));let c=l.dir[i];c&&(li(),jn(c,e,8,[n.el,l,r,t]),ci())}}function n_(n,t){if(xn){let e=xn.provides;const i=xn.parent&&xn.parent.provides;i===e&&(e=xn.provides=Object.create(i)),e[n]=t}}function Yo(n,t,e=!1){const i=eg();if(i||rs){let r=rs?rs._context.provides:i?i.parent==null||i.ce?i.vnode.appContext&&i.vnode.appContext.provides:i.parent.provides:void 0;if(r&&n in r)return r[n];if(arguments.length>1)return e&&he(t)?t.call(i&&i.proxy):t}}const i_=Symbol.for("v-scx"),r_=()=>Yo(i_);function Tr(n,t,e){return qh(n,t,e)}function qh(n,t,e=Fe){const{immediate:i,deep:r,flush:s,once:o}=e,a=Ze({},e),l=t&&i||!t&&s!=="post";let c;if(Qs){if(s==="sync"){const _=r_();c=_.__watcherHandles||(_.__watcherHandles=[])}else if(!l){const _=()=>{};return _.stop=si,_.resume=si,_.pause=si,_}}const u=xn;a.call=(_,x,M)=>jn(_,u,x,M);let f=!1;s==="post"?a.scheduler=_=>{_.i=u,mn(_,u&&u.suspense)}:s!=="sync"&&(f=!0,a.scheduler=(_,x)=>{x?_():jc(_)}),a.augmentJob=_=>{t&&(_.flags|=4),f&&(_.flags|=2,u&&(_.id=u.uid,_.i=u))};const p=jm(n,t,a);return Qs&&(c?c.push(p):l&&p()),p}function s_(n,t,e){const i=this.proxy,r=Ye(n)?n.includes(".")?jh(i,n):()=>i[n]:n.bind(i,i);let s;he(t)?s=t:(s=t.handler,e=t);const o=io(this),a=qh(r,s.bind(i),e);return o(),a}function jh(n,t){const e=t.split(".");return()=>{let i=n;for(let r=0;r<e.length&&i;r++)i=i[e[r]];return i}}const o_=Symbol("_vte"),Aa=n=>n.__isTeleport,Ka=Symbol("_leaveCb");function a_(n){let t=n[0];if(n.length>1){for(const e of n)if(e.type!==Kn){t=e;break}}return t}function Kh(n){if(!Kc(n))return Aa(n.type)&&n.children?a_(n.children):n;if(n.component)return n.component.subTree;const{shapeFlag:t,children:e}=n;if(e){if(t&16)return e[0];if(t&32&&he(e.default))return e.default()}}function Vs(n,t){if(n.shapeFlag&6&&n.component){n.transition=t;const e=n.component.subTree;Vs(Aa(e.type)&&Kh(e)||e,t)}else if(n.shapeFlag&128){const e=n.suspense;if(e){const i=e.isHydrating?e.pendingBranch:e.activeBranch;i&&Vs(i,t.clone(i))}else n.ssContent.transition=t.clone(n.ssContent),n.ssFallback.transition=t.clone(n.ssFallback)}else if(n.transition=t,n.type===Pn&&se(n.children)){const e=rd(n.children,!1);e&&Vs(e,t)}}function Hl(n){if(n.component)return Hl(n.component.subTree);if(n.type===Pn){const t=se(n.children)&&rd(n.children,!1);return t?Hl(t):void 0}if(n.type!==Kn)return n}function wa(n,t){return he(n)?Ze({name:n.name},t,{setup:n}):n}function Zh(n){n.ids=[n.ids[0]+n.ids[2]+++"-",0,0]}function Uu(n,t){let e;return!!((e=Object.getOwnPropertyDescriptor(n,t))&&!e.configurable)}const oa=new WeakMap;function Hs(n,t,e,i,r=!1){if(se(n)){n.forEach((M,g)=>Hs(M,t&&(se(t)?t[g]:t),e,i,r));return}if(ks(i)&&!r){i.shapeFlag&512&&i.type.__asyncResolved&&i.component.subTree.component&&Hs(n,t,e,i.component.subTree);return}const s=i.shapeFlag&4?Da(i.component):i.el,o=r?null:s,{i:a,r:l}=n,c=t&&t.r,u=a.refs===Fe?a.refs={}:a.refs,f=a.setupState,p=Le(f),_=f===Fe?_h:M=>Uu(u,M)?!1:Te(p,M),x=(M,g)=>!(g&&Uu(u,g));if(c!=null&&c!==l){if(Nu(t),Ye(c))u[c]=null,_(c)&&(f[c]=null);else if(un(c)){const M=t;x(c,M.k)&&(c.value=null),M.k&&(u[M.k]=null)}}if(he(l))no(l,a,12,[o,u]);else{const M=Ye(l),g=un(l);if(M||g){const m=()=>{if(n.f){const L=M?_(l)?f[l]:u[l]:x()||!n.k?l.value:u[n.k];if(r)se(L)&&Bc(L,s);else if(se(L))L.includes(s)||L.push(s);else if(M)u[l]=[s],_(l)&&(f[l]=u[l]);else{const R=[s];x(l,n.k)&&(l.value=R),n.k&&(u[n.k]=R)}}else M?(u[l]=o,_(l)&&(f[l]=o)):g&&(x(l,n.k)&&(l.value=o),n.k&&(u[n.k]=o))};if(o){const L=()=>{m(),oa.delete(n)};L.id=-1,oa.set(n,L),mn(L,e)}else Nu(n),m()}}}function Nu(n){const t=oa.get(n);t&&(t.flags|=8,oa.delete(n))}Sa().requestIdleCallback;Sa().cancelIdleCallback;const ks=n=>!!n.type.__asyncLoader,Kc=n=>n.type.__isKeepAlive;function l_(n,t){Jh(n,"a",t)}function c_(n,t){Jh(n,"da",t)}function Jh(n,t,e=xn){const i=n.__wdc||(n.__wdc=()=>{let r=e;for(;r;){if(r.isDeactivated)return;r=r.parent}return n()});if(Ks(t,i,e),e){let r=e.parent;for(;r&&r.parent;)Kc(r.parent.vnode)&&u_(i,t,e,r),r=r.parent}}function u_(n,t,e,i){const r=Ks(t,n,i,!0),s=Ks("um",()=>Bc(i[t],r),e);s.flags=16}function Ks(n,t,e=xn,i=!1){if(e){const r=e[n]||(e[n]=[]),s=t.__weh||(t.__weh=(...o)=>{li();const a=io(e),l=jn(t,e,n,o);return a(),ci(),l});return i?r.unshift(s):r.push(s),s}}const Li=n=>(t,e=xn)=>{(!Qs||n==="sp")&&Ks(n,(...i)=>t(...i),e)},f_=Li("bm"),Ra=Li("m"),h_=Li("bu"),d_=Li("u"),Qh=Li("bum"),p_=Li("um"),m_=Li("sp"),__=Li("rtg"),g_=Li("rtc");function v_(n,t=xn){Ks("ec",n,t)}const x_=Symbol.for("v-ndc"),kl=n=>n?Sd(n)?Da(n):kl(n.parent):null,Gs=Ze(Object.create(null),{$:n=>n,$el:n=>n.vnode.el,$data:n=>n.data,$props:n=>n.props,$attrs:n=>n.attrs,$slots:n=>n.slots,$refs:n=>n.refs,$parent:n=>kl(n.parent),$root:n=>kl(n.root),$host:n=>n.ce,$emit:n=>n.emit,$options:n=>ed(n),$forceUpdate:n=>n.f||(n.f=()=>{jc(n.update)}),$nextTick:n=>n.n||(n.n=Zm.bind(n.proxy)),$watch:n=>s_.bind(n)}),Za=(n,t)=>n!==Fe&&!n.__isScriptSetup&&Te(n,t),M_={get({_:n},t){if(t==="__v_skip")return!0;const{ctx:e,setupState:i,data:r,props:s,accessCache:o,type:a,appContext:l}=n;if(t[0]!=="$"){const p=o[t];if(p!==void 0)switch(p){case 1:return i[t];case 2:return r[t];case 4:return e[t];case 3:return s[t]}else{if(Za(i,t))return o[t]=1,i[t];if(r!==Fe&&Te(r,t))return o[t]=2,r[t];if(Te(s,t))return o[t]=3,s[t];if(e!==Fe&&Te(e,t))return o[t]=4,e[t];Gl&&(o[t]=0)}}const c=Gs[t];let u,f;if(c)return t==="$attrs"&&cn(n.attrs,"get",""),c(n);if((u=a.__cssModules)&&(u=u[t]))return u;if(e!==Fe&&Te(e,t))return o[t]=4,e[t];if(f=l.config.globalProperties,Te(f,t))return f[t]},set({_:n},t,e){const{data:i,setupState:r,ctx:s}=n;return Za(r,t)?(r[t]=e,!0):i!==Fe&&Te(i,t)?(i[t]=e,!0):Te(n.props,t)||t[0]==="$"&&t.slice(1)in n?!1:(s[t]=e,!0)},has({_:{data:n,setupState:t,accessCache:e,ctx:i,appContext:r,props:s,type:o}},a){let l;return!!(e[a]||n!==Fe&&a[0]!=="$"&&Te(n,a)||Za(t,a)||Te(s,a)||Te(i,a)||Te(Gs,a)||Te(r.config.globalProperties,a)||(l=o.__cssModules)&&l[a])},defineProperty(n,t,e){return e.get!=null?n._.accessCache[t]=0:Te(e,"value")&&this.set(n,t,e.value,null),Reflect.defineProperty(n,t,e)}};function Fu(n){return se(n)?n.reduce((t,e)=>(t[e]=null,t),{}):n}let Gl=!0;function S_(n){const t=ed(n),e=n.proxy,i=n.ctx;Gl=!1,t.beforeCreate&&Ou(t.beforeCreate,n,"bc");const{data:r,computed:s,methods:o,watch:a,provide:l,inject:c,created:u,beforeMount:f,mounted:p,beforeUpdate:_,updated:x,activated:M,deactivated:g,beforeDestroy:m,beforeUnmount:L,destroyed:R,unmounted:S,render:V,renderTracked:C,renderTriggered:I,errorCaptured:z,serverPrefetch:A,expose:y,inheritAttrs:O,components:lt,directives:Q,filters:ht}=t;if(c&&y_(c,i,null),o)for(const dt in o){const K=o[dt];he(K)&&(i[dt]=K.bind(e))}if(r){const dt=r.call(e,e);Oe(dt)&&(n.data=ba(dt))}if(Gl=!0,s)for(const dt in s){const K=s[dt],Rt=he(K)?K.bind(e,e):he(K.get)?K.get.bind(e,e):si,Dt=!he(K)&&he(K.set)?K.set.bind(e):si,Xt=$l({get:Rt,set:Dt});Object.defineProperty(i,dt,{enumerable:!0,configurable:!0,get:()=>Xt.value,set:te=>Xt.value=te})}if(a)for(const dt in a)td(a[dt],i,e,dt);if(l){const dt=he(l)?l.call(e):l;Reflect.ownKeys(dt).forEach(K=>{n_(K,dt[K])})}u&&Ou(u,n,"c");function tt(dt,K){se(K)?K.forEach(Rt=>dt(Rt.bind(e))):K&&dt(K.bind(e))}if(tt(f_,f),tt(Ra,p),tt(h_,_),tt(d_,x),tt(l_,M),tt(c_,g),tt(v_,z),tt(g_,C),tt(__,I),tt(Qh,L),tt(p_,S),tt(m_,A),se(y))if(y.length){const dt=n.exposed||(n.exposed={});y.forEach(K=>{Object.defineProperty(dt,K,{get:()=>e[K],set:Rt=>e[K]=Rt,enumerable:!0})})}else n.exposed||(n.exposed={});V&&n.render===si&&(n.render=V),O!=null&&(n.inheritAttrs=O),lt&&(n.components=lt),Q&&(n.directives=Q),A&&Zh(n)}function y_(n,t,e=si){se(n)&&(n=Wl(n));for(const i in n){const r=n[i];let s;Oe(r)?"default"in r?s=Yo(r.from||i,r.default,!0):s=Yo(r.from||i):s=Yo(r),un(s)?Object.defineProperty(t,i,{enumerable:!0,configurable:!0,get:()=>s.value,set:o=>s.value=o}):t[i]=s}}function Ou(n,t,e){jn(se(n)?n.map(i=>i.bind(t.proxy)):n.bind(t.proxy),t,e)}function td(n,t,e,i){let r=i.includes(".")?jh(e,i):()=>e[i];if(Ye(n)){const s=t[n];he(s)&&Tr(r,s)}else if(he(n))Tr(r,n.bind(e));else if(Oe(n))if(se(n))n.forEach(s=>td(s,t,e,i));else{const s=he(n.handler)?n.handler.bind(e):t[n.handler];he(s)&&Tr(r,s,n)}}function ed(n){const t=n.type,{mixins:e,extends:i}=t,{mixins:r,optionsCache:s,config:{optionMergeStrategies:o}}=n.appContext,a=s.get(t);let l;return a?l=a:!r.length&&!e&&!i?l=t:(l={},r.length&&r.forEach(c=>aa(l,c,o,!0)),aa(l,t,o)),Oe(t)&&s.set(t,l),l}function aa(n,t,e,i=!1){const{mixins:r,extends:s}=t;s&&aa(n,s,e,!0),r&&r.forEach(o=>aa(n,o,e,!0));for(const o in t)if(!(i&&o==="expose")){const a=E_[o]||e&&e[o];n[o]=a?a(n[o],t[o]):t[o]}return n}const E_={data:Bu,props:zu,emits:zu,methods:Us,computed:Us,beforeCreate:dn,created:dn,beforeMount:dn,mounted:dn,beforeUpdate:dn,updated:dn,beforeDestroy:dn,beforeUnmount:dn,destroyed:dn,unmounted:dn,activated:dn,deactivated:dn,errorCaptured:dn,serverPrefetch:dn,components:Us,directives:Us,watch:T_,provide:Bu,inject:b_};function Bu(n,t){return t?n?function(){return Ze(he(n)?n.call(this,this):n,he(t)?t.call(this,this):t)}:t:n}function b_(n,t){return Us(Wl(n),Wl(t))}function Wl(n){if(se(n)){const t={};for(let e=0;e<n.length;e++)t[n[e]]=n[e];return t}return n}function dn(n,t){return n?[...new Set([].concat(n,t))]:t}function Us(n,t){return n?Ze(Object.create(null),n,t):t}function zu(n,t){return n?se(n)&&se(t)?[...new Set([...n,...t])]:Ze(Object.create(null),Fu(n),Fu(t??{})):t}function T_(n,t){if(!n)return t;if(!t)return n;const e=Ze(Object.create(null),n);for(const i in t)e[i]=dn(n[i],t[i]);return e}function nd(){return{app:null,config:{isNativeTag:_h,performance:!1,globalProperties:{},optionMergeStrategies:{},errorHandler:void 0,warnHandler:void 0,compilerOptions:{}},mixins:[],components:{},directives:{},provides:Object.create(null),optionsCache:new WeakMap,propsCache:new WeakMap,emitsCache:new WeakMap}}let A_=0;function w_(n,t){return function(i,r=null){he(i)||(i=Ze({},i)),r!=null&&!Oe(r)&&(r=null);const s=nd(),o=new WeakSet,a=[];let l=!1;const c=s.app={_uid:A_++,_component:i,_props:r,_container:null,_context:s,_instance:null,version:ag,get config(){return s.config},set config(u){},use(u,...f){return o.has(u)||(u&&he(u.install)?(o.add(u),u.install(c,...f)):he(u)&&(o.add(u),u(c,...f))),c},mixin(u){return s.mixins.includes(u)||s.mixins.push(u),c},component(u,f){return f?(s.components[u]=f,c):s.components[u]},directive(u,f){return f?(s.directives[u]=f,c):s.directives[u]},mount(u,f,p){if(!l){const _=c._ceVNode||Nn(i,r);return _.appContext=s,p===!0?p="svg":p===!1&&(p=void 0),n(_,u,p),l=!0,c._container=u,u.__vue_app__=c,Da(_.component)}},onUnmount(u){a.push(u)},unmount(){l&&(jn(a,c._instance,16),n(null,c._container),delete c._container.__vue_app__)},provide(u,f){return s.provides[u]=f,c},runWithContext(u){const f=rs;rs=c;try{return u()}finally{rs=f}}};return c}}let rs=null;const R_=(n,t)=>t==="modelValue"||t==="model-value"?n.modelModifiers:n[`${t}Modifiers`]||n[`${Wn(t)}Modifiers`]||n[`${Dr(t)}Modifiers`];function C_(n,t,...e){if(n.isUnmounted)return;const i=n.vnode.props||Fe;let r=e;const s=t.startsWith("update:"),o=s&&R_(i,t.slice(7));o&&(o.trim&&(r=e.map(u=>Ye(u)?u.trim():u)),o.number&&(r=r.map(Vc)));let a,l=i[a=Wa(t)]||i[a=Wa(Wn(t))];!l&&s&&(l=i[a=Wa(Dr(t))]),l&&jn(l,n,6,r);const c=i[a+"Once"];if(c){if(!n.emitted)n.emitted={};else if(n.emitted[a])return;n.emitted[a]=!0,jn(c,n,6,r)}}const P_=new WeakMap;function id(n,t,e=!1){const i=e?P_:t.emitsCache,r=i.get(n);if(r!==void 0)return r;const s=n.emits;let o={},a=!1;if(!he(n)){const l=c=>{const u=id(c,t,!0);u&&(a=!0,Ze(o,u))};!e&&t.mixins.length&&t.mixins.forEach(l),n.extends&&l(n.extends),n.mixins&&n.mixins.forEach(l)}return!s&&!a?(Oe(n)&&i.set(n,null),null):(se(s)?s.forEach(l=>o[l]=null):Ze(o,s),Oe(n)&&i.set(n,o),o)}function Ca(n,t){return!n||!va(t)?!1:(t=t.slice(2),t=t==="Once"?t:t.replace(/Once$/,""),Te(n,t[0].toLowerCase()+t.slice(1))||Te(n,Dr(t))||Te(n,t))}function Vu(n){const{type:t,vnode:e,proxy:i,withProxy:r,propsOptions:[s],slots:o,attrs:a,emit:l,render:c,renderCache:u,props:f,data:p,setupState:_,ctx:x,inheritAttrs:M}=n,g=sa(n);let m,L;try{if(e.shapeFlag&4){const S=r||i,V=S;m=ei(c.call(V,S,u,f,_,p,x)),L=a}else{const S=t;m=ei(S.length>1?S(f,{attrs:a,slots:o,emit:l}):S(f,null)),L=t.props?a:D_(a)}}catch(S){Ar.length=0,Ta(S,n,1),m=Nn(Kn)}let R=m;if(L&&M!==!1){const S=Object.keys(L),{shapeFlag:V}=R;S.length&&V&7&&(s&&S.some(xa)&&(L=L_(L,s)),R=fs(R,L,!1,!0))}if(e.dirs&&(R=fs(R,null,!1,!0),R.dirs=R.dirs?R.dirs.concat(e.dirs):e.dirs),e.transition){const S=Aa(R.type)&&Kh(R)||R;Vs(S,e.transition)}return m=R,sa(g),m}function rd(n,t=!0){let e;for(let i=0;i<n.length;i++){const r=n[i];if(Qc(r)){if(r.type!==Kn||r.children==="v-if"){if(e)return;e=r}}else return}return e}const D_=n=>{let t;for(const e in n)(e==="class"||e==="style"||va(e))&&((t||(t={}))[e]=n[e]);return t},L_=(n,t)=>{const e={};for(const i in n)(!xa(i)||!(i.slice(9)in t))&&(e[i]=n[i]);return e};function I_(n,t,e){const{props:i,children:r,component:s}=n,{props:o,children:a,patchFlag:l}=t,c=s.emitsOptions;if(t.dirs||t.transition)return!0;if(e&&l>=0){if(l&1024)return!0;if(l&16)return i?Hu(i,o,c):!!o;if(l&8){const u=t.dynamicProps;for(let f=0;f<u.length;f++){const p=u[f];if(sd(o,i,p)&&!Ca(c,p))return!0}}}else return(r||a)&&(!a||!a.$stable)?!0:i===o?!1:i?o?Hu(i,o,c):!0:!!o;return!1}function Hu(n,t,e){const i=Object.keys(t);if(i.length!==Object.keys(n).length)return!0;for(let r=0;r<i.length;r++){const s=i[r];if(!Te(n,s)||sd(t,n,s)&&!Ca(e,s))return!0}return!1}function sd(n,t,e){const i=n[e],r=t[e];return e==="style"&&Oe(i)&&Oe(r)?!Ss(i,r):i!==r}function U_({vnode:n,parent:t,suspense:e},i){for(;t;){const r=t.subTree;if(r.suspense&&r.suspense.activeBranch===n&&(r.suspense.vnode.el=r.el=i,n=r),r===n)(n=t.vnode).el=i,t=t.parent;else break}e&&e.activeBranch===n&&(e.vnode.el=i)}const od={},ad=()=>Object.create(od),ld=n=>Object.getPrototypeOf(n)===od;function N_(n,t,e,i=!1){const r={},s=ad();n.propsDefaults=Object.create(null),cd(n,t,r,s);for(const o in n.propsOptions[0])o in r||(r[o]=void 0);e?n.props=i?r:Hm(r):n.type.props?n.props=r:n.props=s,n.attrs=s}function F_(n,t,e,i){const{props:r,attrs:s,vnode:{patchFlag:o}}=n,a=Le(r),[l]=n.propsOptions;let c=!1;if((i||o>0)&&!(o&16)){if(o&8){const u=n.vnode.dynamicProps;for(let f=0;f<u.length;f++){let p=u[f];if(Ca(n.emitsOptions,p))continue;const _=t[p];if(l)if(Te(s,p))_!==s[p]&&(s[p]=_,c=!0);else{const x=Wn(p);r[x]=Xl(l,a,x,_,n,!1)}else _!==s[p]&&(s[p]=_,c=!0)}}}else{cd(n,t,r,s)&&(c=!0);let u;for(const f in a)(!t||!Te(t,f)&&((u=Dr(f))===f||!Te(t,u)))&&(l?e&&(e[f]!==void 0||e[u]!==void 0)&&(r[f]=Xl(l,a,f,void 0,n,!0)):delete r[f]);if(s!==a)for(const f in s)(!t||!Te(t,f))&&(delete s[f],c=!0)}c&&Ti(n.attrs,"set","")}function cd(n,t,e,i){const[r,s]=n.propsOptions;let o=!1,a;if(t)for(let l in t){if(Os(l))continue;const c=t[l];let u;r&&Te(r,u=Wn(l))?!s||!s.includes(u)?e[u]=c:(a||(a={}))[u]=c:Ca(n.emitsOptions,l)||(!(l in i)||c!==i[l])&&(i[l]=c,o=!0)}if(s){const l=Le(e),c=a||Fe;for(let u=0;u<s.length;u++){const f=s[u];e[f]=Xl(r,l,f,c[f],n,!Te(c,f))}}return o}function Xl(n,t,e,i,r,s){const o=n[e];if(o!=null){const a=Te(o,"default");if(a&&i===void 0){const l=o.default;if(o.type!==Function&&!o.skipFactory&&he(l)){const{propsDefaults:c}=r;if(e in c)i=c[e];else{const u=io(r);i=c[e]=l.call(null,t),u()}}else i=l;r.ce&&r.ce._setProp(e,i)}o[0]&&(s&&!a?i=!1:o[1]&&(i===""||i===Dr(e))&&(i=!0))}return i}const O_=new WeakMap;function ud(n,t,e=!1){const i=e?O_:t.propsCache,r=i.get(n);if(r)return r;const s=n.props,o={},a=[];let l=!1;if(!he(n)){const u=f=>{l=!0;const[p,_]=ud(f,t,!0);Ze(o,p),_&&a.push(..._)};!e&&t.mixins.length&&t.mixins.forEach(u),n.extends&&u(n.extends),n.mixins&&n.mixins.forEach(u)}if(!s&&!l)return Oe(n)&&i.set(n,xr),xr;if(se(s))for(let u=0;u<s.length;u++){const f=Wn(s[u]);ku(f)&&(o[f]=Fe)}else if(s)for(const u in s){const f=Wn(u);if(ku(f)){const p=s[u],_=o[f]=se(p)||he(p)?{type:p}:Ze({},p),x=_.type;let M=!1,g=!0;if(se(x))for(let m=0;m<x.length;++m){const L=x[m],R=he(L)&&L.name;if(R==="Boolean"){M=!0;break}else R==="String"&&(g=!1)}else M=he(x)&&x.name==="Boolean";_[0]=M,_[1]=g,(M||Te(_,"default"))&&a.push(f)}}const c=[o,a];return Oe(n)&&i.set(n,c),c}function ku(n){return n[0]!=="$"&&!Os(n)}const Zc=n=>n==="_"||n==="_ctx"||n==="$stable",Jc=n=>se(n)?n.map(ei):[ei(n)],B_=(n,t,e)=>{if(t._n)return t;const i=e_((...r)=>Jc(t(...r)),e);return i._c=!1,i},fd=(n,t,e)=>{const i=n._ctx;for(const r in n){if(Zc(r))continue;const s=n[r];if(he(s))t[r]=B_(r,s,i);else if(s!=null){const o=Jc(s);t[r]=()=>o}}},hd=(n,t)=>{const e=Jc(t);n.slots.default=()=>e},dd=(n,t,e)=>{for(const i in t)(e||!Zc(i))&&(n[i]=t[i])},z_=(n,t,e)=>{const i=n.slots=ad();if(n.vnode.shapeFlag&32){const r=t._;r?(dd(i,t,e),e&&Sh(i,"_",r,!0)):fd(t,i)}else t&&hd(n,t)},V_=(n,t,e)=>{const{vnode:i,slots:r}=n;let s=!0,o=Fe;if(i.shapeFlag&32){const a=t._;a?e&&a===1?s=!1:dd(r,t,e):(s=!t.$stable,fd(t,r)),o=t}else t&&(hd(n,t),o={default:1});if(s)for(const a in r)!Zc(a)&&o[a]==null&&delete r[a]},mn=$_;function H_(n){return k_(n)}function k_(n,t){const e=Sa();e.__VUE__=!0;const{insert:i,remove:r,patchProp:s,createElement:o,createText:a,createComment:l,setText:c,setElementText:u,parentNode:f,nextSibling:p,setScopeId:_=si,insertStaticContent:x}=n,M=(D,N,Y,w=null,pt=null,rt=null,gt=void 0,st=null,xt=!!N.dynamicChildren)=>{if(D===N)return;D&&!Rs(D,N)&&(w=Lt(D),te(D,pt,rt,!0),D=null),N.patchFlag===-2&&(xt=!1,N.dynamicChildren=null),N.dynamicChildren&&D&&D.dynamicChildren&&D.dynamicChildren.hasOnce&&(N.dynamicChildren===xr&&(N.dynamicChildren=[]),N.dynamicChildren.hasOnce=!0);const{type:q,ref:T,shapeFlag:v}=N;switch(q){case Pa:g(D,N,Y,w);break;case Kn:m(D,N,Y,w);break;case Qa:D==null&&L(N,Y,w,gt);break;case Pn:lt(D,N,Y,w,pt,rt,gt,st,xt);break;default:v&1?V(D,N,Y,w,pt,rt,gt,st,xt):v&6?Q(D,N,Y,w,pt,rt,gt,st,xt):(v&64||v&128)&&q.process(D,N,Y,w,pt,rt,gt,st,xt,ee)}T!=null&&pt?Hs(T,D&&D.ref,rt,N||D,!N):T==null&&D&&D.ref!=null&&Hs(D.ref,null,rt,D,!0)},g=(D,N,Y,w)=>{if(D==null)i(N.el=a(N.children),Y,w);else{const pt=N.el=D.el;N.children!==D.children&&c(pt,N.children)}},m=(D,N,Y,w)=>{D==null?i(N.el=l(N.children||""),Y,w):N.el=D.el},L=(D,N,Y,w)=>{[D.el,D.anchor]=x(D.children,N,Y,w,D.el,D.anchor)},R=({el:D,anchor:N},Y,w)=>{let pt;for(;D&&D!==N;)pt=p(D),i(D,Y,w),D=pt;i(N,Y,w)},S=({el:D,anchor:N})=>{let Y;for(;D&&D!==N;)Y=p(D),r(D),D=Y;r(N)},V=(D,N,Y,w,pt,rt,gt,st,xt)=>{if(N.type==="svg"?gt="svg":N.type==="math"&&(gt="mathml"),D==null)C(N,Y,w,pt,rt,gt,st,xt);else{const q=D.el&&D.el._isVueCE?D.el:null;try{q&&q._beginPatch(),A(D,N,pt,rt,gt,st,xt)}finally{q&&q._endPatch()}}},C=(D,N,Y,w,pt,rt,gt,st)=>{let xt,q;const{props:T,shapeFlag:v,transition:B,dirs:Z}=D;if(xt=D.el=o(D.type,rt,T&&T.is,T),v&8?u(xt,D.children):v&16&&z(D.children,xt,null,w,pt,Ja(D,rt),gt,st),Z&&sr(D,null,w,"created"),I(xt,D,D.scopeId,gt,w),T){for(const et in T)et!=="value"&&!Os(et)&&s(xt,et,null,T[et],rt,w);"value"in T&&s(xt,"value",null,T.value,rt),(q=T.onVnodeBeforeMount)&&Jn(q,w,D)}Z&&sr(D,null,w,"beforeMount");const ot=G_(pt,B);ot?B.beforeEnter(xt):B&&!B.persisted&&(xt[X_]=!0),i(xt,N,Y),((q=T&&T.onVnodeMounted)||ot||Z)&&mn(()=>{try{q&&Jn(q,w,D),ot&&B.enter(xt),Z&&sr(D,null,w,"mounted")}finally{}},pt)},I=(D,N,Y,w,pt)=>{if(Y&&_(D,Y),w)for(let rt=0;rt<w.length;rt++)_(D,w[rt]);if(pt){let rt=pt.subTree;if(N===rt||_d(rt.type)&&(rt.ssContent===N||rt.ssFallback===N)){const gt=pt.vnode;I(D,gt,gt.scopeId,gt.slotScopeIds,pt.parent)}}},z=(D,N,Y,w,pt,rt,gt,st,xt=0)=>{for(let q=xt;q<D.length;q++){const T=D[q]=st?bi(D[q]):ei(D[q]);M(null,T,N,Y,w,pt,rt,gt,st)}},A=(D,N,Y,w,pt,rt,gt)=>{const st=N.el=D.el;let{patchFlag:xt,dynamicChildren:q,dirs:T}=N;xt|=D.patchFlag&16;const v=D.props||Fe,B=N.props||Fe;let Z;if(Y&&or(Y,!1),(Z=B.onVnodeBeforeUpdate)&&Jn(Z,Y,N,D),T&&sr(N,D,Y,"beforeUpdate"),Y&&or(Y,!0),q&&(!D.dynamicChildren||D.dynamicChildren.length!==q.length)&&(xt=0,gt=!1,q=null),(v.innerHTML&&B.innerHTML==null||v.textContent&&B.textContent==null)&&u(st,""),q?y(D.dynamicChildren,q,st,Y,w,Ja(N,pt),rt):gt||K(D,N,st,null,Y,w,Ja(N,pt),rt,!1),xt>0){if(xt&16)O(st,v,B,Y,pt);else if(xt&2&&v.class!==B.class&&s(st,"class",null,B.class,pt),xt&4&&s(st,"style",v.style,B.style,pt),xt&8){const ot=N.dynamicProps;for(let et=0;et<ot.length;et++){const bt=ot[et],Tt=v[bt],Et=B[bt];(Et!==Tt||bt==="value")&&s(st,bt,Tt,Et,pt,Y)}}xt&1&&D.children!==N.children&&u(st,N.children)}else!gt&&q==null&&O(st,v,B,Y,pt);((Z=B.onVnodeUpdated)||T)&&mn(()=>{Z&&Jn(Z,Y,N,D),T&&sr(N,D,Y,"updated")},w)},y=(D,N,Y,w,pt,rt,gt)=>{for(let st=0;st<N.length;st++){const xt=D[st],q=N[st],T=xt.el||Ws(xt),v=T&&(xt.type===Pn||!Rs(xt,q)||xt.shapeFlag&198)?f(T):Y;M(xt,q,v,null,w,pt,rt,gt,!0)}},O=(D,N,Y,w,pt)=>{if(N!==Y){if(N!==Fe)for(const rt in N)!Os(rt)&&!(rt in Y)&&s(D,rt,N[rt],null,pt,w);for(const rt in Y){if(Os(rt))continue;const gt=Y[rt],st=N[rt];gt!==st&&rt!=="value"&&s(D,rt,st,gt,pt,w)}"value"in Y&&s(D,"value",N.value,Y.value,pt)}},lt=(D,N,Y,w,pt,rt,gt,st,xt)=>{const q=N.el=D?D.el:a(""),T=N.anchor=D?D.anchor:a("");let{patchFlag:v,dynamicChildren:B,slotScopeIds:Z}=N;Z&&(st=st?st.concat(Z):Z),D==null?(i(q,Y,w),i(T,Y,w),z(N.children||[],Y,T,pt,rt,gt,st,xt)):v>0&&v&64&&B&&D.dynamicChildren&&D.dynamicChildren.length===B.length?(y(D.dynamicChildren,B,Y,pt,rt,gt,st),(N.key!=null||pt&&N===pt.subTree)&&pd(D,N,!0)):K(D,N,Y,T,pt,rt,gt,st,xt)},Q=(D,N,Y,w,pt,rt,gt,st,xt)=>{N.slotScopeIds=st,D==null?N.shapeFlag&512?pt.ctx.activate(N,Y,w,gt,xt):ht(N,Y,w,pt,rt,gt,xt):St(D,N,xt)},ht=(D,N,Y,w,pt,rt,gt)=>{const st=D.component=tg(D,w,pt);if(Kc(D)&&(st.ctx.renderer=ee),ng(st,!1,gt),st.asyncDep){if(pt&&pt.registerDep(st,tt,gt,rt),!D.el){const xt=st.subTree=Nn(Kn);m(null,xt,N,Y),D.placeholder=xt.el}}else tt(st,D,N,Y,pt,rt,gt)},St=(D,N,Y)=>{const w=N.component=D.component;if(I_(D,N,Y))if(w.asyncDep&&!w.asyncResolved){N.el=D.el,N.placeholder=D.placeholder,dt(w,N,Y);return}else w.next=N,w.update();else N.el=D.el,N.placeholder=D.placeholder,w.vnode=N},tt=(D,N,Y,w,pt,rt,gt)=>{const st=()=>{if(D.isMounted){let{next:v,bu:B,u:Z,parent:ot,vnode:et}=D;{const ct=md(D);if(ct){v&&(v.el=et.el,dt(D,v,gt)),ct.asyncDep.then(()=>{const Ut=()=>{D.job.flags&8||(pt&&pt.pendingBranch?mn(Ut,pt):q())};Ut.flags=48,mn(Ut,pt)});return}}let bt=v,Tt;or(D,!1),v?(v.el=et.el,dt(D,v,gt)):v=et,B&&$o(B),(Tt=v.props&&v.props.onVnodeBeforeUpdate)&&Jn(Tt,ot,v,et),or(D,!0);const Et=Vu(D),ne=D.subTree;D.subTree=Et,M(ne,Et,f(ne.el||Ws(ne)),Lt(ne),D,pt,rt),v.el=Et.el,bt===null&&U_(D,Et.el),Z&&mn(Z,pt),(Tt=v.props&&v.props.onVnodeUpdated)&&mn(()=>Jn(Tt,ot,v,et),pt)}else{let v;const{el:B,props:Z}=N,{bm:ot,m:et,parent:bt,root:Tt,type:Et}=D,ne=ks(N);or(D,!1),ot&&$o(ot),!ne&&(v=Z&&Z.onVnodeBeforeMount)&&Jn(v,bt,N),or(D,!0);{Tt.ce&&Tt.ce._hasShadowRoot()&&Tt.ce._injectChildStyle(Et,D.parent?D.parent.type:void 0);const ct=D.subTree=Vu(D);M(null,ct,Y,w,D,pt,rt),N.el=ct.el}if(et&&mn(et,pt),!ne&&(v=Z&&Z.onVnodeMounted)){const ct=N;mn(()=>Jn(v,bt,ct),pt)}(N.shapeFlag&256||bt&&ks(bt.vnode)&&bt.vnode.shapeFlag&256)&&D.a&&mn(D.a,pt),D.isMounted=!0,N=Y=w=null}};D.scope.on();const xt=D.effect=new Ah(st);D.scope.off();const q=D.update=xt.run.bind(xt),T=D.job=xt.runIfDirty.bind(xt);T.i=D,T.id=D.uid,xt.scheduler=()=>jc(T),or(D,!0),q()},dt=(D,N,Y)=>{N.component=D;const w=D.vnode.props;D.vnode=N,D.next=null,F_(D,N.props,w,Y),V_(D,N.children,Y),li(),Wh(D),ci()},K=(D,N,Y,w,pt,rt,gt,st,xt=!1)=>{const q=D&&D.children,T=D?D.shapeFlag:0,v=N.children,{patchFlag:B,shapeFlag:Z}=N;if(B>0){if(B&128){Dt(q,v,Y,w,pt,rt,gt,st,xt);return}else if(B&256){Rt(q,v,Y,w,pt,rt,gt,st,xt);return}}Z&8?(T&16&&Gt(q,pt,rt),v!==q&&u(Y,v)):T&16?Z&16?Dt(q,v,Y,w,pt,rt,gt,st,xt):Gt(q,pt,rt,!0):(T&8&&u(Y,""),Z&16&&z(v,Y,w,pt,rt,gt,st,xt))},Rt=(D,N,Y,w,pt,rt,gt,st,xt)=>{D=D||xr,N=N||xr;const q=D.length,T=N.length,v=Math.min(q,T);let B;for(B=0;B<v;B++){const Z=N[B]=xt?bi(N[B]):ei(N[B]);M(D[B],Z,Y,null,pt,rt,gt,st,xt)}q>T?Gt(D,pt,rt,!0,!1,v):z(N,Y,w,pt,rt,gt,st,xt,v)},Dt=(D,N,Y,w,pt,rt,gt,st,xt)=>{let q=0;const T=N.length;let v=D.length-1,B=T-1;for(;q<=v&&q<=B;){const Z=D[q],ot=N[q]=xt?bi(N[q]):ei(N[q]);if(Rs(Z,ot))M(Z,ot,Y,null,pt,rt,gt,st,xt);else break;q++}for(;q<=v&&q<=B;){const Z=D[v],ot=N[B]=xt?bi(N[B]):ei(N[B]);if(Rs(Z,ot))M(Z,ot,Y,null,pt,rt,gt,st,xt);else break;v--,B--}if(q>v){if(q<=B){const Z=B+1,ot=Z<T?N[Z].el:w;for(;q<=B;)M(null,N[q]=xt?bi(N[q]):ei(N[q]),Y,ot,pt,rt,gt,st,xt),q++}}else if(q>B)for(;q<=v;)te(D[q],pt,rt,!0),q++;else{const Z=q,ot=q,et=new Map;for(q=ot;q<=B;q++){const qt=N[q]=xt?bi(N[q]):ei(N[q]);qt.key!=null&&et.set(qt.key,q)}let bt,Tt=0;const Et=B-ot+1;let ne=!1,ct=0;const Ut=new Array(Et);for(q=0;q<Et;q++)Ut[q]=0;for(q=Z;q<=v;q++){const qt=D[q];if(Tt>=Et){te(qt,pt,rt,!0);continue}let It;if(qt.key!=null)It=et.get(qt.key);else for(bt=ot;bt<=B;bt++)if(Ut[bt-ot]===0&&Rs(qt,N[bt])){It=bt;break}It===void 0?te(qt,pt,rt,!0):(Ut[It-ot]=q+1,It>=ct?ct=It:ne=!0,M(qt,N[It],Y,null,pt,rt,gt,st,xt),Tt++)}const kt=ne?W_(Ut):xr;for(bt=kt.length-1,q=Et-1;q>=0;q--){const qt=ot+q,It=N[qt],ge=N[qt+1],ce=qt+1<T?ge.el||Ws(ge):w;Ut[q]===0?M(null,It,Y,ce,pt,rt,gt,st,xt):ne&&(bt<0||q!==kt[bt]?Xt(It,Y,ce,2):bt--)}}},Xt=(D,N,Y,w,pt=null)=>{const{el:rt,type:gt,transition:st,children:xt,shapeFlag:q}=D;if(q&6){Xt(D.component.subTree,N,Y,w);return}if(q&128){D.suspense.move(N,Y,w);return}if(q&64){gt.move(D,N,Y,ee);return}if(gt===Pn){i(rt,N,Y);for(let v=0;v<xt.length;v++)Xt(xt[v],N,Y,w);i(D.anchor,N,Y);return}if(gt===Qa){R(D,N,Y);return}if(w!==2&&q&1&&st)if(w===0)st.persisted&&!rt[Ka]?i(rt,N,Y):(st.beforeEnter(rt),i(rt,N,Y),mn(()=>st.enter(rt),pt));else{const{leave:v,delayLeave:B,afterLeave:Z}=st,ot=()=>{D.ctx.isUnmounted?r(rt):i(rt,N,Y)},et=()=>{const bt=rt._isLeaving||!!rt[Ka];rt._isLeaving&&rt[Ka](!0),st.persisted&&!bt?ot():v(rt,()=>{ot(),Z&&Z()})};B?B(rt,ot,et):et()}else i(rt,N,Y)},te=(D,N,Y,w=!1,pt=!1)=>{const{type:rt,props:gt,ref:st,children:xt,dynamicChildren:q,shapeFlag:T,patchFlag:v,dirs:B,cacheIndex:Z,memo:ot}=D;if((v===-2||q&&q.hasOnce)&&(pt=!1),st!=null&&(li(),Hs(st,null,Y,D,!0),ci()),Z!=null&&(!D.ctx||D.ctx===N)&&(N.renderCache[Z]=void 0),T&256&&N.ctx.deactivate(D))return;const et=T&1&&B,bt=!ks(D);let Tt;if(bt&&(Tt=gt&&gt.onVnodeBeforeUnmount)&&Jn(Tt,N,D),T&6)Ct(D.component,Y,w);else{if(T&128){D.suspense.unmount(Y,w);return}et&&sr(D,null,N,"beforeUnmount"),T&64?D.type.remove(D,N,Y,ee,w):q&&!q.hasOnce&&(rt!==Pn||v>0&&v&64)?Gt(q,N,Y,!1,!0):(rt===Pn&&v&384||!pt&&T&16)&&Gt(xt,N,Y),w&&Ae(D)}const Et=ot!=null&&Z==null;(bt&&(Tt=gt&&gt.onVnodeUnmounted)||et||Et)&&mn(()=>{Tt&&Jn(Tt,N,D),et&&sr(D,null,N,"unmounted"),Et&&(D.el=null)},Y)},Ae=D=>{const{type:N,el:Y,anchor:w,transition:pt}=D,rt=N===Pn;if(rt&&!pt){_t(Y,w);return}if(N===Qa){S(D),pt&&!pt.persisted&&pt.afterLeave&&pt.afterLeave();return}const gt=rt?Hl(D):D,st=()=>{rt?f(Y)&&_t(Y,w):r(Y),pt&&!pt.persisted&&pt.afterLeave&&pt.afterLeave()};if(gt&&gt.shapeFlag&1&&pt&&!pt.persisted){const{leave:xt,delayLeave:q}=pt,T=gt.el,v=()=>xt(T,st);q?q(T,st,v):v()}else st()},_t=(D,N)=>{let Y;for(;D!==N;)Y=p(D),r(D),D=Y;r(N)},Ct=(D,N,Y)=>{const{bum:w,scope:pt,job:rt,subTree:gt,um:st,m:xt,a:q}=D;Gu(xt),Gu(q),w&&$o(w),pt.stop(),rt?(rt.flags|=8,te(gt,D,N,Y)):gt&&(gt.transition=D.vnode.transition,te(gt,D,N,Y)),st&&mn(st,N);const T=()=>{D.isUnmounted=!0};T.flags=16,mn(T,N)},Gt=(D,N,Y,w=!1,pt=!1,rt=0)=>{for(let gt=rt;gt<D.length;gt++)te(D[gt],N,Y,w,pt)},Lt=D=>{if(D.shapeFlag&6)return Lt(D.component.subTree);if(D.shapeFlag&128)return D.suspense.next();const N=p(D.anchor||D.el),Y=N&&N[o_];return Y?p(Y):N},Qt=(D,N,Y)=>{const w=D&&N._vnode?void 0:D&&D.component?D.component.uid:Q_();t_(()=>{D==null?N._vnode&&te(N._vnode,null,null,!0):M(N._vnode||null,D,N,null,null,null,Y),N._vnode=D},w)},ee={p:M,um:te,m:Xt,r:Ae,mt:ht,mc:z,pc:K,pbc:y,n:Lt,o:n};return{render:Qt,hydrate:void 0,createApp:w_(Qt)}}function Ja({type:n,props:t},e){return e==="svg"&&n==="foreignObject"||e==="mathml"&&n==="annotation-xml"&&t&&t.encoding&&t.encoding.includes("html")?void 0:e}function or({effect:n,job:t},e){e?(n.flags|=32,t.flags|=4):(n.flags&=-33,t.flags&=-5)}function G_(n,t){return(!n||n&&!n.pendingBranch)&&t&&!t.persisted}function pd(n,t,e=!1){const i=n.children,r=t.children;if(se(i)&&se(r))for(let s=0;s<i.length;s++){const o=i[s];let a=r[s];a.shapeFlag&1&&!a.dynamicChildren&&((a.patchFlag<=0||a.patchFlag===32)&&(a=r[s]=bi(r[s]),a.el=o.el),!e&&a.patchFlag!==-2&&pd(o,a)),a.type===Pa&&(a.patchFlag===-1&&(a=r[s]=bi(a)),a.el=o.el),a.type===Kn&&!a.el&&(a.el=o.el)}}function W_(n){const t=n.slice(),e=[0];let i,r,s,o,a;const l=n.length;for(i=0;i<l;i++){const c=n[i];if(c!==0){if(r=e[e.length-1],n[r]<c){t[i]=r,e.push(i);continue}for(s=0,o=e.length-1;s<o;)a=s+o>>1,n[e[a]]<c?s=a+1:o=a;c<n[e[s]]&&(s>0&&(t[i]=e[s-1]),e[s]=i)}}for(s=e.length,o=e[s-1];s-- >0;)e[s]=o,o=t[o];return e}function md(n){const t=n.subTree.component;if(t)return t.asyncDep&&!t.asyncResolved?t:md(t)}function Gu(n){if(n)for(let t=0;t<n.length;t++)n[t].flags|=8}function Ws(n){if(n.placeholder)return n.placeholder;const t=n.component;if(t)return Ws(t.subTree);const e=n.suspense;return e&&e.activeBranch?Ws(e.activeBranch):null}const _d=n=>n.__isSuspense,X_=Symbol("_deferredEnter");function $_(n,t){t&&t.pendingBranch?se(n)?t.effects.push(...n):t.effects.push(n):Qm(n)}const Pn=Symbol.for("v-fgt"),Pa=Symbol.for("v-txt"),Kn=Symbol.for("v-cmt"),Qa=Symbol.for("v-stc"),Ar=[];let wn=null;function qi(n=!1){Ar.push(wn=n?null:[])}function gd(){Ar.pop(),wn=Ar[Ar.length-1]||null}let Zs=1;function Wu(n,t=!1){Zs+=n,n<0&&wn&&t&&(wn.hasOnce=!0)}function vd(n){return n.dynamicChildren=Zs>0?wn||xr:null,gd(),Zs>0&&wn&&wn.push(n),n}function wr(n,t,e,i,r,s){return vd(jt(n,t,e,i,r,s,!0))}function Y_(n,t,e,i,r){return vd(Nn(n,t,e,i,r,!0))}function Qc(n){return n?n.__v_isVNode===!0:!1}function Rs(n,t){return n.type===t.type&&n.key===t.key}const xd=({key:n})=>n??null,qo=({ref:n,ref_key:t,ref_for:e})=>(typeof n=="number"&&(n=""+n),n!=null?Ye(n)||un(n)||he(n)?{i:In,r:n,k:t,f:!!e}:n:null);function jt(n,t=null,e=null,i=0,r=null,s=n===Pn?0:1,o=!1,a=!1){const l={__v_isVNode:!0,__v_skip:!0,type:n,props:t,key:t&&xd(t),ref:t&&qo(t),scopeId:Yh,slotScopeIds:null,children:e,component:null,suspense:null,ssContent:null,ssFallback:null,dirs:null,transition:null,el:null,anchor:null,target:null,targetStart:null,targetAnchor:null,staticCount:0,shapeFlag:s,patchFlag:i,dynamicProps:r,dynamicChildren:null,appContext:null,ctx:In};return a?(la(l,e),s&128&&n.normalize(l)):e&&(l.shapeFlag|=Ye(e)?8:16),Zs>0&&!o&&wn&&(l.patchFlag>0||s&6)&&l.patchFlag!==32&&wn.push(l),l}const Nn=q_;function q_(n,t=null,e=null,i=0,r=null,s=!1){if((!n||n===x_)&&(n=Kn),Qc(n)){const a=fs(n,t,!0);return e&&la(a,e),Zs>0&&!s&&wn&&(a.shapeFlag&6?wn[wn.indexOf(n)]=a:wn.push(a)),a.patchFlag=-2,a}if(og(n)&&(n=n.__vccOpts),t){t=j_(t);let{class:a,style:l}=t;a&&!Ye(a)&&(t.class=Ea(a)),Oe(l)&&(qc(l)&&!se(l)&&(l=Ze({},l)),t.style=ya(l))}const o=Ye(n)?1:_d(n)?128:Aa(n)?64:Oe(n)?4:he(n)?2:0;return jt(n,t,e,i,r,o,s,!0)}function j_(n){return n?qc(n)?Ze({},n):ld(n)?Ze({},n[Ed]||n):n:null}function fs(n,t,e=!1,i=!1){const{props:r,ref:s,patchFlag:o,children:a,transition:l}=n,c=t?Z_(r||{},t):r,u={__v_isVNode:!0,__v_skip:!0,type:n.type,props:c,key:c&&xd(c),ref:t&&t.ref?e&&s?se(s)?s.concat(qo(t)):[s,qo(t)]:qo(t):s,scopeId:n.scopeId,slotScopeIds:n.slotScopeIds,children:a,target:n.target,targetStart:n.targetStart,targetAnchor:n.targetAnchor,staticCount:n.staticCount,shapeFlag:n.shapeFlag,patchFlag:t&&n.type!==Pn?o===-1?16:o|16:o,dynamicProps:n.dynamicProps,dynamicChildren:n.dynamicChildren,appContext:n.appContext,dirs:n.dirs,transition:l,component:n.component,suspense:n.suspense,ssContent:n.ssContent&&fs(n.ssContent),ssFallback:n.ssFallback&&fs(n.ssFallback),placeholder:n.placeholder,el:n.el,anchor:n.anchor,ctx:n.ctx,ce:n.ce,cacheIndex:n.cacheIndex};return l&&i&&Vs(u,l.clone(u)),u}function Wi(n=" ",t=0){return Nn(Pa,null,n,t)}function K_(n="",t=!1){return t?(qi(),Y_(Kn,null,n)):Nn(Kn,null,n)}function ei(n){return n==null||typeof n=="boolean"?Nn(Kn):se(n)?Nn(Pn,null,n.slice()):Qc(n)?bi(n):Nn(Pa,null,String(n))}function bi(n){return n.el===null&&n.patchFlag!==-1||n.memo?n:fs(n)}function la(n,t){let e=0;const{shapeFlag:i}=n;if(t==null)t=null;else if(se(t))e=16;else if(typeof t=="object")if(i&65){const r=t.default;r&&(r._c&&(r._d=!1),la(n,r()),r._c&&(r._d=!0));return}else{e=32;const r=t._;!r&&!ld(t)?t._ctx=In:r===3&&In&&(In.slots._===1?t._=1:(t._=2,n.patchFlag|=1024))}else if(he(t)){if(i&65){la(n,{default:t});return}t={default:t,_ctx:In},e=32}else t=String(t),i&64?(e=16,t=[Wi(t)]):e=8;n.children=t,n.shapeFlag|=e}function Z_(...n){const t={};for(let e=0;e<n.length;e++){const i=n[e];for(const r in i)if(r==="class")t.class!==i.class&&(t.class=Ea([t.class,i.class]));else if(r==="style")t.style=ya([t.style,i.style]);else if(va(r)){const s=t[r],o=i[r];o&&s!==o&&!(se(s)&&s.includes(o))?t[r]=s?[].concat(s,o):o:o==null&&s==null&&!xa(r)&&(t[r]=o)}else r!==""&&(t[r]=i[r])}return t}function Jn(n,t,e,i=null){jn(n,t,7,[e,i])}const J_=nd();let Md=0;function Q_(){return Md}function tg(n,t,e){const i=n.type,r=(t?t.appContext:n.appContext)||J_,s={uid:Md++,vnode:n,type:i,parent:t,appContext:r,root:null,next:null,subTree:null,effect:null,update:null,job:null,scope:new Em(!0),render:null,proxy:null,exposed:null,exposeProxy:null,withProxy:null,provides:t?t.provides:Object.create(r.provides),ids:t?t.ids:["",0,0],accessCache:null,renderCache:[],components:null,directives:null,propsOptions:ud(i,r),emitsOptions:id(i,r),emit:null,emitted:null,propsDefaults:Fe,inheritAttrs:i.inheritAttrs,ctx:Fe,data:Fe,props:Fe,attrs:Fe,slots:Fe,refs:Fe,setupState:Fe,setupContext:null,suspense:e,suspenseId:e?e.pendingId:0,asyncDep:null,asyncResolved:!1,isMounted:!1,isUnmounted:!1,isDeactivated:!1,bc:null,c:null,bm:null,m:null,bu:null,u:null,um:null,bum:null,da:null,a:null,rtg:null,rtc:null,ec:null,sp:null};return s.ctx={_:s},s.root=t?t.root:s,s.emit=C_.bind(null,s),n.ce&&n.ce(s),s}let xn=null;const eg=()=>xn||In;let ca,Js;{const n=Sa(),t=(e,i)=>{let r;return(r=n[e])||(r=n[e]=[]),r.push(i),s=>{r.length>1?r.forEach(o=>o(s)):r[0](s)}};ca=t("__VUE_INSTANCE_SETTERS__",e=>xn=e),Js=t("__VUE_SSR_SETTERS__",e=>Qs=e)}const io=n=>{const t=xn;return ca(n),n.scope.on(),()=>{n.scope.off(),ca(t)}},Xu=()=>{xn&&xn.scope.off(),ca(null)};function Sd(n){return n.vnode.shapeFlag&4}let Qs=!1;function ng(n,t=!1,e=!1){t&&Js(t);const{props:i,children:r}=n.vnode,s=Sd(n);N_(n,i,s,t),z_(n,r,e||t);const o=s?ig(n,t):void 0;return t&&Js(!1),o}function ig(n,t){const e=n.type;n.accessCache=Object.create(null),n.proxy=new Proxy(n.ctx,M_);const{setup:i}=e;if(i){li();const r=n.setupContext=i.length>1?sg(n):null,s=io(n),o=no(i,n,0,[n.props,r]),a=gh(o);if(ci(),s(),(a||n.sp)&&!ks(n)&&Zh(n),a){if(o.then(Xu,Xu),t)return o.then(l=>{Js(!0);try{$u(n,l,t)}finally{Js(!1)}}).catch(l=>{Ta(l,n,0,void 0,!0),n.ssrRender=(c,u)=>u("<!---->")});n.asyncDep=o}else $u(n,o)}else yd(n)}function $u(n,t,e){he(t)?n.type.__ssrInlineRender?n.ssrRender=t:n.render=t:Oe(t)&&(n.setupState=Hh(t)),yd(n)}function yd(n,t,e){const i=n.type;n.render||(n.render=i.render||si);{const r=io(n);li();try{S_(n)}finally{ci(),r()}}}const Ed=Symbol(),rg={get(n,t){return cn(n,"get",""),t===Ed?n:n[t]}};function sg(n){const t=e=>{n.exposed=e||{}};return{attrs:new Proxy(n.attrs,rg),slots:n.slots,emit:n.emit,expose:t}}function Da(n){return n.exposed?n.exposeProxy||(n.exposeProxy=new Proxy(Hh(km(n.exposed)),{get(t,e){if(e in t)return t[e];if(e in Gs)return Gs[e](n)},has(t,e){return e in t||e in Gs}})):n.proxy}function og(n){return he(n)&&"__vccOpts"in n}const $l=(n,t)=>Ym(n,t,Qs),ag="3.5.46";/**
* @vue/runtime-dom v3.5.46
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let Yl;const Yu=typeof window<"u"&&window.trustedTypes;if(Yu)try{Yl=Yu.createPolicy("vue",{createHTML:n=>n})}catch{}const bd=Yl?n=>Yl.createHTML(n):n=>n,lg="http://www.w3.org/2000/svg",cg="http://www.w3.org/1998/Math/MathML",Ei=typeof document<"u"?document:null,qu=Ei&&Ei.createElement("template"),ug={insert:(n,t,e)=>{t.insertBefore(n,e||null)},remove:n=>{const t=n.parentNode;t&&t.removeChild(n)},createElement:(n,t,e,i)=>{const r=t==="svg"?Ei.createElementNS(lg,n):t==="mathml"?Ei.createElementNS(cg,n):e?Ei.createElement(n,{is:e}):Ei.createElement(n);return n==="select"&&i&&i.multiple!=null&&r.setAttribute("multiple",i.multiple),r},createText:n=>Ei.createTextNode(n),createComment:n=>Ei.createComment(n),setText:(n,t)=>{n.nodeValue=t},setElementText:(n,t)=>{n.textContent=t},parentNode:n=>n.parentNode,nextSibling:n=>n.nextSibling,querySelector:n=>Ei.querySelector(n),setScopeId(n,t){n.setAttribute(t,"")},insertStaticContent(n,t,e,i,r,s){const o=e?e.previousSibling:t.lastChild;if(r&&(r===s||r.nextSibling))for(;t.insertBefore(r.cloneNode(!0),e),!(r===s||!(r=r.nextSibling)););else{qu.innerHTML=bd(i==="svg"?`<svg>${n}</svg>`:i==="mathml"?`<math>${n}</math>`:n);const a=qu.content;if(i==="svg"||i==="mathml"){const l=a.firstChild;for(;l.firstChild;)a.appendChild(l.firstChild);a.removeChild(l)}t.insertBefore(a,e)}return[o?o.nextSibling:t.firstChild,e?e.previousSibling:t.lastChild]}},fg=Symbol("_vtc");function hg(n,t,e){const i=n[fg];i&&(t=(t?[t,...i]:[...i]).join(" ")),t==null?n.removeAttribute("class"):e?n.setAttribute("class",t):n.className=t}const ju=Symbol("_vod"),dg=Symbol("_vsh"),pg=Symbol(""),mg=/(?:^|;)\s*display\s*:/;function _g(n,t,e){const i=n.style,r=Ye(e);let s=!1;if(e&&!r){if(t)if(Ye(t))for(const o of t.split(";")){const a=o.slice(0,o.indexOf(":")).trim();e[a]==null&&Ns(i,a,"")}else for(const o in t)e[o]==null&&Ns(i,o,"");for(const o in e){o==="display"&&(s=!0);const a=e[o];a!=null?vg(n,o,!Ye(t)&&t?t[o]:void 0,a)||Ns(i,o,a):Ns(i,o,"")}}else if(r){if(t!==e){const o=i[pg];o&&(e+=";"+o),i.cssText=e,s=mg.test(e)}}else t&&n.removeAttribute("style");ju in n&&((!r||t!==e)&&(n[ju]=s?i.display:""),n[dg]&&(i.display="none"))}const vo=/\s*!important$/;function Ns(n,t,e){if(se(e))e.forEach(i=>Ns(n,t,i));else if(e==null&&(e=""),t.startsWith("--"))vo.test(e)?n.setProperty(t,e.replace(vo,""),"important"):n.setProperty(t,e);else{const i=gg(n,t);vo.test(e)?n.setProperty(Dr(i),e.replace(vo,""),"important"):n[i]=e}}const Ku=["Webkit","Moz","ms"],tl={};function gg(n,t){const e=tl[t];if(e)return e;let i=Wn(t);if(i!=="filter"&&i in n)return tl[t]=i;i=Mh(i);for(let r=0;r<Ku.length;r++){const s=Ku[r]+i;if(s in n)return tl[t]=s}return t}function vg(n,t,e,i){return n.tagName==="TEXTAREA"&&(t==="width"||t==="height")&&Ye(i)&&e===i}const Zu="http://www.w3.org/1999/xlink";function Ju(n,t,e,i,r,s=Mm(t)){i&&t.startsWith("xlink:")?e==null?n.removeAttributeNS(Zu,t.slice(6,t.length)):n.setAttributeNS(Zu,t,e):e==null||s&&!yh(e)?n.removeAttribute(t):n.setAttribute(t,s?"":ai(e)?String(e):e)}function Qu(n,t,e,i,r){if(t==="innerHTML"||t==="textContent"){e!=null&&(n[t]=t==="innerHTML"?bd(e):e);return}const s=n.tagName;if(t==="value"&&s!=="PROGRESS"&&!s.includes("-")){const a=s==="OPTION"?n.getAttribute("value")||"":n.value,l=e==null?n.type==="checkbox"?"on":"":String(e);(a!==l||!("_value"in n))&&(n.value=l),e==null&&n.removeAttribute(t),n._value=e;return}let o=!1;if(e===""||e==null){const a=typeof n[t];a==="boolean"?e=yh(e):e==null&&a==="string"?(e="",o=!0):a==="number"&&(e=0,o=!0)}try{n[t]=e}catch{}o&&n.removeAttribute(r||t)}function _r(n,t,e,i){n.addEventListener(t,e,i)}function xg(n,t,e,i){n.removeEventListener(t,e,i)}const tf=Symbol("_vei");function Mg(n,t,e,i,r=null){const s=n[tf]||(n[tf]={}),o=s[t];if(i&&o)o.value=i;else{const[a,l]=Eg(t);if(i){const c=s[t]=Ag(i,r);_r(n,a,c,l)}else o&&(xg(n,a,o,l),s[t]=void 0)}}const Sg=/(Once|Passive|Capture)$/,yg=/^on:?(?:Once|Passive|Capture)$/;function Eg(n){let t,e;for(;(e=n.match(Sg))&&!yg.test(n);)t||(t={}),n=n.slice(0,n.length-e[1].length),t[e[1].toLowerCase()]=!0;return[n[2]===":"?n.slice(3):Dr(n.slice(2)),t]}let el=0;const bg=Promise.resolve(),Tg=()=>el||(bg.then(()=>el=0),el=Date.now());function Ag(n,t){const e=i=>{if(!i._vts)i._vts=Date.now();else if(i._vts<=e.attached)return;const r=e.value;if(se(r)){const s=i.stopImmediatePropagation;i.stopImmediatePropagation=()=>{s.call(i),i._stopped=!0};const o=r.slice(),a=[i];for(let l=0;l<o.length&&!i._stopped;l++){const c=o[l];c&&jn(c,t,5,a)}}else jn(r,t,5,[i])};return e.value=n,e.attached=Tg(),e}const ef=n=>n.charCodeAt(0)===111&&n.charCodeAt(1)===110&&n.charCodeAt(2)>96&&n.charCodeAt(2)<123,wg=(n,t,e,i,r,s)=>{const o=r==="svg";t==="class"?hg(n,i,o):t==="style"?_g(n,e,i):va(t)?xa(t)||Mg(n,t,e,i,s):(t[0]==="."?(t=t.slice(1),!0):t[0]==="^"?(t=t.slice(1),!1):Rg(n,t,i,o))?(Qu(n,t,i),!n.tagName.includes("-")&&(t==="value"||t==="checked"||t==="selected")&&Ju(n,t,i,o,s,t!=="value")):n._isVueCE&&(Cg(n,t)||n._def.__asyncLoader&&(/[A-Z]/.test(t)||!Ye(i)))?Qu(n,Wn(t),i,s,t):(t==="true-value"?n._trueValue=i:t==="false-value"&&(n._falseValue=i),Ju(n,t,i,o))};function Rg(n,t,e,i){if(i)return!!(t==="innerHTML"||t==="textContent"||t in n&&ef(t)&&he(e));if(t==="spellcheck"||t==="draggable"||t==="translate"||t==="autocorrect"||t==="sandbox"&&n.tagName==="IFRAME"||t==="form"||t==="list"&&n.tagName==="INPUT"||t==="type"&&n.tagName==="TEXTAREA")return!1;if(t==="width"||t==="height"){const r=n.tagName;if(r==="IMG"||r==="VIDEO"||r==="CANVAS"||r==="SOURCE")return!1}return ef(t)&&Ye(e)?!1:t in n}function Cg(n,t){const e=n._def.props;if(!e)return!1;const i=Wn(t);return Array.isArray(e)?e.some(r=>Wn(r)===i):Object.keys(e).some(r=>Wn(r)===i)}const ua=n=>{const t=n.props["onUpdate:modelValue"]||!1;return se(t)?e=>$o(t,e):t};function Pg(n){n.target.composing=!0}function nf(n){const t=n.target;t.composing&&(t.composing=!1,t.dispatchEvent(new Event("input")))}const Mr=Symbol("_assign"),xo=Symbol("_initialValue");function nl(n,t,e){return t&&(n=n.trim()),e&&(n=Vc(n)),n}const Qr={created(n,{modifiers:{lazy:t,trim:e,number:i}},r){n.parentNode&&(n.type==="text"?n[xo]=n.defaultValue.replace(/[\r\n]/g,""):n.type==="textarea"&&(n[xo]=n.defaultValue.replace(/\r\n?/g,`
`))),n[Mr]=ua(r);const s=i||r.props&&r.props.type==="number";_r(n,t?"change":"input",o=>{o.target.composing||n[Mr](nl(n.value,e,s))}),(e||s)&&_r(n,"change",()=>{n.value=nl(n.value,e,s)}),t||(_r(n,"compositionstart",Pg),_r(n,"compositionend",nf),_r(n,"change",nf))},mounted(n,{value:t,modifiers:{trim:e,number:i}}){const r=t??"",s=n[xo];delete n[xo],s!==void 0&&(n.type==="text"||n.type==="textarea")&&n.value!==s?n[Mr](nl(n.value,e,i)):n.value=r},beforeUpdate(n,{value:t,oldValue:e,modifiers:{lazy:i,trim:r,number:s}},o){if(n[Mr]=ua(o),n.composing)return;const a=(s||n.type==="number")&&!/^0\d/.test(n.value)?Vc(n.value):n.value,l=t??"";if(a===l)return;const c=n.getRootNode();(c instanceof Document||c instanceof ShadowRoot)&&c.activeElement===n&&n.type!=="range"&&(i&&t===e||r&&n.value.trim()===l)||(n.value=l)}},Dg={deep:!0,created(n,t,e){n[Mr]=ua(e),_r(n,"change",()=>{const i=n._modelValue,r=Lg(n),s=n.checked,o=n[Mr];if(se(i)){const a=Eh(i,r),l=a!==-1;if(s&&!l)o(i.concat(r));else if(!s&&l){const c=[...i];c.splice(a,1),o(c)}}else if(us(i)){const a=new Set(i);s?a.add(r):a.delete(r),o(a)}else o(Td(n,s))})},mounted:rf,beforeUpdate(n,t,e){n[Mr]=ua(e),rf(n,t,e)}};function rf(n,{value:t,oldValue:e},i){n._modelValue=t;let r;if(se(t))r=Eh(t,i.props.value)>-1;else if(us(t))r=t.has(i.props.value);else{if(t===e)return;r=Ss(t,Td(n,!0))}n.checked!==r&&(n.checked=r)}function Lg(n){return"_value"in n?n._value:n.value}function Td(n,t){const e=t?"_trueValue":"_falseValue";return e in n?n[e]:t}const Ig=Ze({patchProp:wg},ug);let sf;function Ug(){return sf||(sf=H_(Ig))}const Ng=((...n)=>{const t=Ug().createApp(...n),{mount:e}=t;return t.mount=i=>{const r=Og(i);if(!r)return;const s=t._component;!he(s)&&!s.render&&!s.template&&(s.template=r.innerHTML),r.nodeType===1&&(r.textContent="");const o=e(r,!1,Fg(r));return r instanceof Element&&(r.removeAttribute("v-cloak"),r.setAttribute("data-v-app","")),o},t});function Fg(n){if(n instanceof SVGElement)return"svg";if(typeof MathMLElement=="function"&&n instanceof MathMLElement)return"mathml"}function Og(n){return Ye(n)?document.querySelector(n):n}/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const tu="171",ss={ROTATE:0,DOLLY:1,PAN:2},ns={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Bg=0,of=1,zg=2,Ad=1,Vg=2,yi=3,Zi=0,En=1,Ln=2,ji=0,os=1,af=2,lf=3,cf=4,Hg=5,gr=100,kg=101,Gg=102,Wg=103,Xg=104,$g=200,Yg=201,qg=202,jg=203,ql=204,jl=205,Kg=206,Zg=207,Jg=208,Qg=209,tv=210,ev=211,nv=212,iv=213,rv=214,Kl=0,Zl=1,Jl=2,hs=3,Ql=4,tc=5,ec=6,nc=7,wd=0,sv=1,ov=2,Ki=0,av=1,lv=2,cv=3,uv=4,fv=5,hv=6,dv=7,Rd=300,ds=301,ps=302,ic=303,rc=304,La=306,sc=1e3,Sr=1001,oc=1002,Yn=1003,pv=1004,Mo=1005,ri=1006,il=1007,yr=1008,Di=1009,Cd=1010,Pd=1011,to=1012,eu=1013,Cr=1014,wi=1015,ro=1016,nu=1017,iu=1018,ms=1020,Dd=35902,Ld=1021,Id=1022,Gn=1023,Ud=1024,Nd=1025,as=1026,_s=1027,Fd=1028,ru=1029,Od=1030,su=1031,ou=1033,jo=33776,Ko=33777,Zo=33778,Jo=33779,ac=35840,lc=35841,cc=35842,uc=35843,fc=36196,hc=37492,dc=37496,pc=37808,mc=37809,_c=37810,gc=37811,vc=37812,xc=37813,Mc=37814,Sc=37815,yc=37816,Ec=37817,bc=37818,Tc=37819,Ac=37820,wc=37821,Qo=36492,Rc=36494,Cc=36495,Bd=36283,Pc=36284,Dc=36285,Lc=36286,mv=3200,_v=3201,zd=0,gv=1,$i="",Cn="srgb",gs="srgb-linear",fa="linear",Ie="srgb",Br=7680,uf=519,vv=512,xv=513,Mv=514,Vd=515,Sv=516,yv=517,Ev=518,bv=519,ff=35044,hf="300 es",Ri=2e3,ha=2001;class Lr{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const i=this._listeners;return i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const r=this._listeners[t];if(r!==void 0){const s=r.indexOf(e);s!==-1&&r.splice(s,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const i=this._listeners[t.type];if(i!==void 0){t.target=this;const r=i.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,t);t.target=null}}}const an=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let df=1234567;const Xs=Math.PI/180,eo=180/Math.PI;function ys(){const n=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(an[n&255]+an[n>>8&255]+an[n>>16&255]+an[n>>24&255]+"-"+an[t&255]+an[t>>8&255]+"-"+an[t>>16&15|64]+an[t>>24&255]+"-"+an[e&63|128]+an[e>>8&255]+"-"+an[e>>16&255]+an[e>>24&255]+an[i&255]+an[i>>8&255]+an[i>>16&255]+an[i>>24&255]).toLowerCase()}function ve(n,t,e){return Math.max(t,Math.min(e,n))}function au(n,t){return(n%t+t)%t}function Tv(n,t,e,i,r){return i+(n-t)*(r-i)/(e-t)}function Av(n,t,e){return n!==t?(e-n)/(t-n):0}function $s(n,t,e){return(1-e)*n+e*t}function wv(n,t,e,i){return $s(n,t,1-Math.exp(-e*i))}function Rv(n,t=1){return t-Math.abs(au(n,t*2)-t)}function Cv(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*(3-2*n))}function Pv(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*n*(n*(n*6-15)+10))}function Dv(n,t){return n+Math.floor(Math.random()*(t-n+1))}function Lv(n,t){return n+Math.random()*(t-n)}function Iv(n){return n*(.5-Math.random())}function Uv(n){n!==void 0&&(df=n);let t=df+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Nv(n){return n*Xs}function Fv(n){return n*eo}function Ov(n){return(n&n-1)===0&&n!==0}function Bv(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function zv(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function Vv(n,t,e,i,r){const s=Math.cos,o=Math.sin,a=s(e/2),l=o(e/2),c=s((t+i)/2),u=o((t+i)/2),f=s((t-i)/2),p=o((t-i)/2),_=s((i-t)/2),x=o((i-t)/2);switch(r){case"XYX":n.set(a*u,l*f,l*p,a*c);break;case"YZY":n.set(l*p,a*u,l*f,a*c);break;case"ZXZ":n.set(l*f,l*p,a*u,a*c);break;case"XZX":n.set(a*u,l*x,l*_,a*c);break;case"YXY":n.set(l*_,a*u,l*x,a*c);break;case"ZYZ":n.set(l*x,l*_,a*u,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function ts(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function pn(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const Ic={DEG2RAD:Xs,RAD2DEG:eo,generateUUID:ys,clamp:ve,euclideanModulo:au,mapLinear:Tv,inverseLerp:Av,lerp:$s,damp:wv,pingpong:Rv,smoothstep:Cv,smootherstep:Pv,randInt:Dv,randFloat:Lv,randFloatSpread:Iv,seededRandom:Uv,degToRad:Nv,radToDeg:Fv,isPowerOfTwo:Ov,ceilPowerOfTwo:Bv,floorPowerOfTwo:zv,setQuaternionFromProperEuler:Vv,normalize:pn,denormalize:ts};class pe{constructor(t=0,e=0){pe.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,i=this.y,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6],this.y=r[1]*e+r[4]*i+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=ve(this.x,t.x,e.x),this.y=ve(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=ve(this.x,t,e),this.y=ve(this.y,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ve(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(ve(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const i=Math.cos(e),r=Math.sin(e),s=this.x-t.x,o=this.y-t.y;return this.x=s*i-o*r+t.x,this.y=s*r+o*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class de{constructor(t,e,i,r,s,o,a,l,c){de.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,r,s,o,a,l,c)}set(t,e,i,r,s,o,a,l,c){const u=this.elements;return u[0]=t,u[1]=r,u[2]=a,u[3]=e,u[4]=s,u[5]=l,u[6]=i,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,s=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],u=i[4],f=i[7],p=i[2],_=i[5],x=i[8],M=r[0],g=r[3],m=r[6],L=r[1],R=r[4],S=r[7],V=r[2],C=r[5],I=r[8];return s[0]=o*M+a*L+l*V,s[3]=o*g+a*R+l*C,s[6]=o*m+a*S+l*I,s[1]=c*M+u*L+f*V,s[4]=c*g+u*R+f*C,s[7]=c*m+u*S+f*I,s[2]=p*M+_*L+x*V,s[5]=p*g+_*R+x*C,s[8]=p*m+_*S+x*I,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[1],r=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8];return e*o*u-e*a*c-i*s*u+i*a*l+r*s*c-r*o*l}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],f=u*o-a*c,p=a*l-u*s,_=c*s-o*l,x=e*f+i*p+r*_;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);const M=1/x;return t[0]=f*M,t[1]=(r*c-u*i)*M,t[2]=(a*i-r*o)*M,t[3]=p*M,t[4]=(u*e-r*l)*M,t[5]=(r*s-a*e)*M,t[6]=_*M,t[7]=(i*l-c*e)*M,t[8]=(o*e-i*s)*M,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,r,s,o,a){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*o+c*a)+o+t,-r*c,r*l,-r*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(rl.makeScale(t,e)),this}rotate(t){return this.premultiply(rl.makeRotation(-t)),this}translate(t,e){return this.premultiply(rl.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<9;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const rl=new de;function Hd(n){for(let t=n.length-1;t>=0;--t)if(n[t]>=65535)return!0;return!1}function da(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Hv(){const n=da("canvas");return n.style.display="block",n}const pf={};function es(n){n in pf||(pf[n]=!0,console.warn(n))}function kv(n,t,e){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(t,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:i()}}setTimeout(s,e)})}function Gv(n){const t=n.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Wv(n){const t=n.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const mf=new de().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),_f=new de().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Xv(){const n={enabled:!0,workingColorSpace:gs,spaces:{},convert:function(r,s,o){return this.enabled===!1||s===o||!s||!o||(this.spaces[s].transfer===Ie&&(r.r=Ci(r.r),r.g=Ci(r.g),r.b=Ci(r.b)),this.spaces[s].primaries!==this.spaces[o].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===Ie&&(r.r=ls(r.r),r.g=ls(r.g),r.b=ls(r.b))),r},fromWorkingColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},toWorkingColorSpace:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===$i?fa:this.spaces[r].transfer},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,o){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[gs]:{primaries:t,whitePoint:i,transfer:fa,toXYZ:mf,fromXYZ:_f,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Cn},outputColorSpaceConfig:{drawingBufferColorSpace:Cn}},[Cn]:{primaries:t,whitePoint:i,transfer:Ie,toXYZ:mf,fromXYZ:_f,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Cn}}}),n}const Ce=Xv();function Ci(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function ls(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let zr;class $v{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{zr===void 0&&(zr=da("canvas")),zr.width=t.width,zr.height=t.height;const i=zr.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),e=zr}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=da("canvas");e.width=t.width,e.height=t.height;const i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);const r=i.getImageData(0,0,t.width,t.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=Ci(s[o]/255)*255;return i.putImageData(r,0,0),e}else if(t.data){const e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(Ci(e[i]/255)*255):e[i]=Ci(e[i]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Yv=0;class kd{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Yv++}),this.uuid=ys(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(sl(r[o].image)):s.push(sl(r[o]))}else s=sl(r);i.url=s}return e||(t.images[this.uuid]=i),i}}function sl(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?$v.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let qv=0;class bn extends Lr{constructor(t=bn.DEFAULT_IMAGE,e=bn.DEFAULT_MAPPING,i=Sr,r=Sr,s=ri,o=yr,a=Gn,l=Di,c=bn.DEFAULT_ANISOTROPY,u=$i){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:qv++}),this.uuid=ys(),this.name="",this.source=new kd(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new pe(0,0),this.repeat=new pe(1,1),this.center=new pe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new de,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Rd)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case sc:t.x=t.x-Math.floor(t.x);break;case Sr:t.x=t.x<0?0:1;break;case oc:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case sc:t.y=t.y-Math.floor(t.y);break;case Sr:t.y=t.y<0?0:1;break;case oc:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}bn.DEFAULT_IMAGE=null;bn.DEFAULT_MAPPING=Rd;bn.DEFAULT_ANISOTROPY=1;class $e{constructor(t=0,e=0,i=0,r=1){$e.prototype.isVector4=!0,this.x=t,this.y=e,this.z=i,this.w=r}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,r){return this.x=t,this.y=e,this.z=i,this.w=r,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,s=this.w,o=t.elements;return this.x=o[0]*e+o[4]*i+o[8]*r+o[12]*s,this.y=o[1]*e+o[5]*i+o[9]*r+o[13]*s,this.z=o[2]*e+o[6]*i+o[10]*r+o[14]*s,this.w=o[3]*e+o[7]*i+o[11]*r+o[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,r,s;const l=t.elements,c=l[0],u=l[4],f=l[8],p=l[1],_=l[5],x=l[9],M=l[2],g=l[6],m=l[10];if(Math.abs(u-p)<.01&&Math.abs(f-M)<.01&&Math.abs(x-g)<.01){if(Math.abs(u+p)<.1&&Math.abs(f+M)<.1&&Math.abs(x+g)<.1&&Math.abs(c+_+m-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const R=(c+1)/2,S=(_+1)/2,V=(m+1)/2,C=(u+p)/4,I=(f+M)/4,z=(x+g)/4;return R>S&&R>V?R<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(R),r=C/i,s=I/i):S>V?S<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(S),i=C/r,s=z/r):V<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(V),i=I/s,r=z/s),this.set(i,r,s,e),this}let L=Math.sqrt((g-x)*(g-x)+(f-M)*(f-M)+(p-u)*(p-u));return Math.abs(L)<.001&&(L=1),this.x=(g-x)/L,this.y=(f-M)/L,this.z=(p-u)/L,this.w=Math.acos((c+_+m-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=ve(this.x,t.x,e.x),this.y=ve(this.y,t.y,e.y),this.z=ve(this.z,t.z,e.z),this.w=ve(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=ve(this.x,t,e),this.y=ve(this.y,t,e),this.z=ve(this.z,t,e),this.w=ve(this.w,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ve(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class jv extends Lr{constructor(t=1,e=1,i={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new $e(0,0,t,e),this.scissorTest=!1,this.viewport=new $e(0,0,t,e);const r={width:t,height:e,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:ri,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);const s=new bn(r,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);s.flipY=!1,s.generateMipmaps=i.generateMipmaps,s.internalFormat=i.internalFormat,this.textures=[];const o=i.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,i=1){if(this.width!==t||this.height!==e||this.depth!==i){this.width=t,this.height=e,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=t,this.textures[r].image.height=e,this.textures[r].image.depth=i;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let i=0,r=t.textures.length;i<r;i++)this.textures[i]=t.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new kd(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Pr extends jv{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}}class Gd extends bn{constructor(t=null,e=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=Yn,this.minFilter=Yn,this.wrapR=Sr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Kv extends bn{constructor(t=null,e=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=Yn,this.minFilter=Yn,this.wrapR=Sr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class oi{constructor(t=0,e=0,i=0,r=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=r}static slerpFlat(t,e,i,r,s,o,a){let l=i[r+0],c=i[r+1],u=i[r+2],f=i[r+3];const p=s[o+0],_=s[o+1],x=s[o+2],M=s[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=f;return}if(a===1){t[e+0]=p,t[e+1]=_,t[e+2]=x,t[e+3]=M;return}if(f!==M||l!==p||c!==_||u!==x){let g=1-a;const m=l*p+c*_+u*x+f*M,L=m>=0?1:-1,R=1-m*m;if(R>Number.EPSILON){const V=Math.sqrt(R),C=Math.atan2(V,m*L);g=Math.sin(g*C)/V,a=Math.sin(a*C)/V}const S=a*L;if(l=l*g+p*S,c=c*g+_*S,u=u*g+x*S,f=f*g+M*S,g===1-a){const V=1/Math.sqrt(l*l+c*c+u*u+f*f);l*=V,c*=V,u*=V,f*=V}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=f}static multiplyQuaternionsFlat(t,e,i,r,s,o){const a=i[r],l=i[r+1],c=i[r+2],u=i[r+3],f=s[o],p=s[o+1],_=s[o+2],x=s[o+3];return t[e]=a*x+u*f+l*_-c*p,t[e+1]=l*x+u*p+c*f-a*_,t[e+2]=c*x+u*_+a*p-l*f,t[e+3]=u*x-a*f-l*p-c*_,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,r){return this._x=t,this._y=e,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const i=t._x,r=t._y,s=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(i/2),u=a(r/2),f=a(s/2),p=l(i/2),_=l(r/2),x=l(s/2);switch(o){case"XYZ":this._x=p*u*f+c*_*x,this._y=c*_*f-p*u*x,this._z=c*u*x+p*_*f,this._w=c*u*f-p*_*x;break;case"YXZ":this._x=p*u*f+c*_*x,this._y=c*_*f-p*u*x,this._z=c*u*x-p*_*f,this._w=c*u*f+p*_*x;break;case"ZXY":this._x=p*u*f-c*_*x,this._y=c*_*f+p*u*x,this._z=c*u*x+p*_*f,this._w=c*u*f-p*_*x;break;case"ZYX":this._x=p*u*f-c*_*x,this._y=c*_*f+p*u*x,this._z=c*u*x-p*_*f,this._w=c*u*f+p*_*x;break;case"YZX":this._x=p*u*f+c*_*x,this._y=c*_*f+p*u*x,this._z=c*u*x-p*_*f,this._w=c*u*f-p*_*x;break;case"XZY":this._x=p*u*f-c*_*x,this._y=c*_*f-p*u*x,this._z=c*u*x+p*_*f,this._w=c*u*f+p*_*x;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const i=e/2,r=Math.sin(i);return this._x=t.x*r,this._y=t.y*r,this._z=t.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,i=e[0],r=e[4],s=e[8],o=e[1],a=e[5],l=e[9],c=e[2],u=e[6],f=e[10],p=i+a+f;if(p>0){const _=.5/Math.sqrt(p+1);this._w=.25/_,this._x=(u-l)*_,this._y=(s-c)*_,this._z=(o-r)*_}else if(i>a&&i>f){const _=2*Math.sqrt(1+i-a-f);this._w=(u-l)/_,this._x=.25*_,this._y=(r+o)/_,this._z=(s+c)/_}else if(a>f){const _=2*Math.sqrt(1+a-i-f);this._w=(s-c)/_,this._x=(r+o)/_,this._y=.25*_,this._z=(l+u)/_}else{const _=2*Math.sqrt(1+f-i-a);this._w=(o-r)/_,this._x=(s+c)/_,this._y=(l+u)/_,this._z=.25*_}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<Number.EPSILON?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ve(this.dot(t),-1,1)))}rotateTowards(t,e){const i=this.angleTo(t);if(i===0)return this;const r=Math.min(1,e/i);return this.slerp(t,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const i=t._x,r=t._y,s=t._z,o=t._w,a=e._x,l=e._y,c=e._z,u=e._w;return this._x=i*u+o*a+r*c-s*l,this._y=r*u+o*l+s*a-i*c,this._z=s*u+o*c+i*l-r*a,this._w=o*u-i*a-r*l-s*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const i=this._x,r=this._y,s=this._z,o=this._w;let a=o*t._w+i*t._x+r*t._y+s*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=i,this._y=r,this._z=s,this;const l=1-a*a;if(l<=Number.EPSILON){const _=1-e;return this._w=_*o+e*this._w,this._x=_*i+e*this._x,this._y=_*r+e*this._y,this._z=_*s+e*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,a),f=Math.sin((1-e)*u)/c,p=Math.sin(e*u)/c;return this._w=o*f+this._w*p,this._x=i*f+this._x*p,this._y=r*f+this._y*p,this._z=s*f+this._z*p,this._onChangeCallback(),this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(t),r*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class j{constructor(t=0,e=0,i=0){j.prototype.isVector3=!0,this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(gf.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(gf.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,i=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[3]*i+s[6]*r,this.y=s[1]*e+s[4]*i+s[7]*r,this.z=s[2]*e+s[5]*i+s[8]*r,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,s=t.elements,o=1/(s[3]*e+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*e+s[4]*i+s[8]*r+s[12])*o,this.y=(s[1]*e+s[5]*i+s[9]*r+s[13])*o,this.z=(s[2]*e+s[6]*i+s[10]*r+s[14])*o,this}applyQuaternion(t){const e=this.x,i=this.y,r=this.z,s=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*r-a*i),u=2*(a*e-s*r),f=2*(s*i-o*e);return this.x=e+l*c+o*f-a*u,this.y=i+l*u+a*c-s*f,this.z=r+l*f+s*u-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,i=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[4]*i+s[8]*r,this.y=s[1]*e+s[5]*i+s[9]*r,this.z=s[2]*e+s[6]*i+s[10]*r,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=ve(this.x,t.x,e.x),this.y=ve(this.y,t.y,e.y),this.z=ve(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=ve(this.x,t,e),this.y=ve(this.y,t,e),this.z=ve(this.z,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ve(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const i=t.x,r=t.y,s=t.z,o=e.x,a=e.y,l=e.z;return this.x=r*l-s*a,this.y=s*o-i*l,this.z=i*a-r*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return ol.copy(this).projectOnVector(t),this.sub(ol)}reflect(t){return this.sub(ol.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(ve(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y,r=this.z-t.z;return e*e+i*i+r*r}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){const r=Math.sin(e)*t;return this.x=r*Math.sin(i),this.y=Math.cos(e)*t,this.z=r*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),r=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=r,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,i=Math.sqrt(1-e*e);return this.x=i*Math.cos(t),this.y=e,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const ol=new j,gf=new oi;class so{constructor(t=new j(1/0,1/0,1/0),e=new j(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(Bn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(Bn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const i=Bn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const i=t.geometry;if(i!==void 0){const s=i.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,Bn):Bn.fromBufferAttribute(s,o),Bn.applyMatrix4(t.matrixWorld),this.expandByPoint(Bn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),So.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),So.copy(i.boundingBox)),So.applyMatrix4(t.matrixWorld),this.union(So)}const r=t.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Bn),Bn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Cs),yo.subVectors(this.max,Cs),Vr.subVectors(t.a,Cs),Hr.subVectors(t.b,Cs),kr.subVectors(t.c,Cs),Ni.subVectors(Hr,Vr),Fi.subVectors(kr,Hr),ar.subVectors(Vr,kr);let e=[0,-Ni.z,Ni.y,0,-Fi.z,Fi.y,0,-ar.z,ar.y,Ni.z,0,-Ni.x,Fi.z,0,-Fi.x,ar.z,0,-ar.x,-Ni.y,Ni.x,0,-Fi.y,Fi.x,0,-ar.y,ar.x,0];return!al(e,Vr,Hr,kr,yo)||(e=[1,0,0,0,1,0,0,0,1],!al(e,Vr,Hr,kr,yo))?!1:(Eo.crossVectors(Ni,Fi),e=[Eo.x,Eo.y,Eo.z],al(e,Vr,Hr,kr,yo))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Bn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Bn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(gi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),gi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),gi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),gi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),gi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),gi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),gi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),gi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(gi),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const gi=[new j,new j,new j,new j,new j,new j,new j,new j],Bn=new j,So=new so,Vr=new j,Hr=new j,kr=new j,Ni=new j,Fi=new j,ar=new j,Cs=new j,yo=new j,Eo=new j,lr=new j;function al(n,t,e,i,r){for(let s=0,o=n.length-3;s<=o;s+=3){lr.fromArray(n,s);const a=r.x*Math.abs(lr.x)+r.y*Math.abs(lr.y)+r.z*Math.abs(lr.z),l=t.dot(lr),c=e.dot(lr),u=i.dot(lr);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}const Zv=new so,Ps=new j,ll=new j;class Ia{constructor(t=new j,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const i=this.center;e!==void 0?i.copy(e):Zv.setFromPoints(t).getCenter(i);let r=0;for(let s=0,o=t.length;s<o;s++)r=Math.max(r,i.distanceToSquared(t[s]));return this.radius=Math.sqrt(r),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Ps.subVectors(t,this.center);const e=Ps.lengthSq();if(e>this.radius*this.radius){const i=Math.sqrt(e),r=(i-this.radius)*.5;this.center.addScaledVector(Ps,r/i),this.radius+=r}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(ll.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Ps.copy(t.center).add(ll)),this.expandByPoint(Ps.copy(t.center).sub(ll))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const vi=new j,cl=new j,bo=new j,Oi=new j,ul=new j,To=new j,fl=new j;class lu{constructor(t=new j,e=new j(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,vi)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=vi.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(vi.copy(this.origin).addScaledVector(this.direction,e),vi.distanceToSquared(t))}distanceSqToSegment(t,e,i,r){cl.copy(t).add(e).multiplyScalar(.5),bo.copy(e).sub(t).normalize(),Oi.copy(this.origin).sub(cl);const s=t.distanceTo(e)*.5,o=-this.direction.dot(bo),a=Oi.dot(this.direction),l=-Oi.dot(bo),c=Oi.lengthSq(),u=Math.abs(1-o*o);let f,p,_,x;if(u>0)if(f=o*l-a,p=o*a-l,x=s*u,f>=0)if(p>=-x)if(p<=x){const M=1/u;f*=M,p*=M,_=f*(f+o*p+2*a)+p*(o*f+p+2*l)+c}else p=s,f=Math.max(0,-(o*p+a)),_=-f*f+p*(p+2*l)+c;else p=-s,f=Math.max(0,-(o*p+a)),_=-f*f+p*(p+2*l)+c;else p<=-x?(f=Math.max(0,-(-o*s+a)),p=f>0?-s:Math.min(Math.max(-s,-l),s),_=-f*f+p*(p+2*l)+c):p<=x?(f=0,p=Math.min(Math.max(-s,-l),s),_=p*(p+2*l)+c):(f=Math.max(0,-(o*s+a)),p=f>0?s:Math.min(Math.max(-s,-l),s),_=-f*f+p*(p+2*l)+c);else p=o>0?-s:s,f=Math.max(0,-(o*p+a)),_=-f*f+p*(p+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,f),r&&r.copy(cl).addScaledVector(bo,p),_}intersectSphere(t,e){vi.subVectors(t.center,this.origin);const i=vi.dot(this.direction),r=vi.dot(vi)-i*i,s=t.radius*t.radius;if(r>s)return null;const o=Math.sqrt(s-r),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){const i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,r,s,o,a,l;const c=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,p=this.origin;return c>=0?(i=(t.min.x-p.x)*c,r=(t.max.x-p.x)*c):(i=(t.max.x-p.x)*c,r=(t.min.x-p.x)*c),u>=0?(s=(t.min.y-p.y)*u,o=(t.max.y-p.y)*u):(s=(t.max.y-p.y)*u,o=(t.min.y-p.y)*u),i>o||s>r||((s>i||isNaN(i))&&(i=s),(o<r||isNaN(r))&&(r=o),f>=0?(a=(t.min.z-p.z)*f,l=(t.max.z-p.z)*f):(a=(t.max.z-p.z)*f,l=(t.min.z-p.z)*f),i>l||a>r)||((a>i||i!==i)&&(i=a),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,e)}intersectsBox(t){return this.intersectBox(t,vi)!==null}intersectTriangle(t,e,i,r,s){ul.subVectors(e,t),To.subVectors(i,t),fl.crossVectors(ul,To);let o=this.direction.dot(fl),a;if(o>0){if(r)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Oi.subVectors(this.origin,t);const l=a*this.direction.dot(To.crossVectors(Oi,To));if(l<0)return null;const c=a*this.direction.dot(ul.cross(Oi));if(c<0||l+c>o)return null;const u=-a*Oi.dot(fl);return u<0?null:this.at(u/o,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class We{constructor(t,e,i,r,s,o,a,l,c,u,f,p,_,x,M,g){We.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,r,s,o,a,l,c,u,f,p,_,x,M,g)}set(t,e,i,r,s,o,a,l,c,u,f,p,_,x,M,g){const m=this.elements;return m[0]=t,m[4]=e,m[8]=i,m[12]=r,m[1]=s,m[5]=o,m[9]=a,m[13]=l,m[2]=c,m[6]=u,m[10]=f,m[14]=p,m[3]=_,m[7]=x,m[11]=M,m[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new We().fromArray(this.elements)}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){const e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,i=t.elements,r=1/Gr.setFromMatrixColumn(t,0).length(),s=1/Gr.setFromMatrixColumn(t,1).length(),o=1/Gr.setFromMatrixColumn(t,2).length();return e[0]=i[0]*r,e[1]=i[1]*r,e[2]=i[2]*r,e[3]=0,e[4]=i[4]*s,e[5]=i[5]*s,e[6]=i[6]*s,e[7]=0,e[8]=i[8]*o,e[9]=i[9]*o,e[10]=i[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,i=t.x,r=t.y,s=t.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(r),c=Math.sin(r),u=Math.cos(s),f=Math.sin(s);if(t.order==="XYZ"){const p=o*u,_=o*f,x=a*u,M=a*f;e[0]=l*u,e[4]=-l*f,e[8]=c,e[1]=_+x*c,e[5]=p-M*c,e[9]=-a*l,e[2]=M-p*c,e[6]=x+_*c,e[10]=o*l}else if(t.order==="YXZ"){const p=l*u,_=l*f,x=c*u,M=c*f;e[0]=p+M*a,e[4]=x*a-_,e[8]=o*c,e[1]=o*f,e[5]=o*u,e[9]=-a,e[2]=_*a-x,e[6]=M+p*a,e[10]=o*l}else if(t.order==="ZXY"){const p=l*u,_=l*f,x=c*u,M=c*f;e[0]=p-M*a,e[4]=-o*f,e[8]=x+_*a,e[1]=_+x*a,e[5]=o*u,e[9]=M-p*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const p=o*u,_=o*f,x=a*u,M=a*f;e[0]=l*u,e[4]=x*c-_,e[8]=p*c+M,e[1]=l*f,e[5]=M*c+p,e[9]=_*c-x,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const p=o*l,_=o*c,x=a*l,M=a*c;e[0]=l*u,e[4]=M-p*f,e[8]=x*f+_,e[1]=f,e[5]=o*u,e[9]=-a*u,e[2]=-c*u,e[6]=_*f+x,e[10]=p-M*f}else if(t.order==="XZY"){const p=o*l,_=o*c,x=a*l,M=a*c;e[0]=l*u,e[4]=-f,e[8]=c*u,e[1]=p*f+M,e[5]=o*u,e[9]=_*f-x,e[2]=x*f-_,e[6]=a*u,e[10]=M*f+p}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Jv,t,Qv)}lookAt(t,e,i){const r=this.elements;return Tn.subVectors(t,e),Tn.lengthSq()===0&&(Tn.z=1),Tn.normalize(),Bi.crossVectors(i,Tn),Bi.lengthSq()===0&&(Math.abs(i.z)===1?Tn.x+=1e-4:Tn.z+=1e-4,Tn.normalize(),Bi.crossVectors(i,Tn)),Bi.normalize(),Ao.crossVectors(Tn,Bi),r[0]=Bi.x,r[4]=Ao.x,r[8]=Tn.x,r[1]=Bi.y,r[5]=Ao.y,r[9]=Tn.y,r[2]=Bi.z,r[6]=Ao.z,r[10]=Tn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,s=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],u=i[1],f=i[5],p=i[9],_=i[13],x=i[2],M=i[6],g=i[10],m=i[14],L=i[3],R=i[7],S=i[11],V=i[15],C=r[0],I=r[4],z=r[8],A=r[12],y=r[1],O=r[5],lt=r[9],Q=r[13],ht=r[2],St=r[6],tt=r[10],dt=r[14],K=r[3],Rt=r[7],Dt=r[11],Xt=r[15];return s[0]=o*C+a*y+l*ht+c*K,s[4]=o*I+a*O+l*St+c*Rt,s[8]=o*z+a*lt+l*tt+c*Dt,s[12]=o*A+a*Q+l*dt+c*Xt,s[1]=u*C+f*y+p*ht+_*K,s[5]=u*I+f*O+p*St+_*Rt,s[9]=u*z+f*lt+p*tt+_*Dt,s[13]=u*A+f*Q+p*dt+_*Xt,s[2]=x*C+M*y+g*ht+m*K,s[6]=x*I+M*O+g*St+m*Rt,s[10]=x*z+M*lt+g*tt+m*Dt,s[14]=x*A+M*Q+g*dt+m*Xt,s[3]=L*C+R*y+S*ht+V*K,s[7]=L*I+R*O+S*St+V*Rt,s[11]=L*z+R*lt+S*tt+V*Dt,s[15]=L*A+R*Q+S*dt+V*Xt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[4],r=t[8],s=t[12],o=t[1],a=t[5],l=t[9],c=t[13],u=t[2],f=t[6],p=t[10],_=t[14],x=t[3],M=t[7],g=t[11],m=t[15];return x*(+s*l*f-r*c*f-s*a*p+i*c*p+r*a*_-i*l*_)+M*(+e*l*_-e*c*p+s*o*p-r*o*_+r*c*u-s*l*u)+g*(+e*c*f-e*a*_-s*o*f+i*o*_+s*a*u-i*c*u)+m*(-r*a*u-e*l*f+e*a*p+r*o*f-i*o*p+i*l*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){const r=this.elements;return t.isVector3?(r[12]=t.x,r[13]=t.y,r[14]=t.z):(r[12]=t,r[13]=e,r[14]=i),this}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],f=t[9],p=t[10],_=t[11],x=t[12],M=t[13],g=t[14],m=t[15],L=f*g*c-M*p*c+M*l*_-a*g*_-f*l*m+a*p*m,R=x*p*c-u*g*c-x*l*_+o*g*_+u*l*m-o*p*m,S=u*M*c-x*f*c+x*a*_-o*M*_-u*a*m+o*f*m,V=x*f*l-u*M*l-x*a*p+o*M*p+u*a*g-o*f*g,C=e*L+i*R+r*S+s*V;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const I=1/C;return t[0]=L*I,t[1]=(M*p*s-f*g*s-M*r*_+i*g*_+f*r*m-i*p*m)*I,t[2]=(a*g*s-M*l*s+M*r*c-i*g*c-a*r*m+i*l*m)*I,t[3]=(f*l*s-a*p*s-f*r*c+i*p*c+a*r*_-i*l*_)*I,t[4]=R*I,t[5]=(u*g*s-x*p*s+x*r*_-e*g*_-u*r*m+e*p*m)*I,t[6]=(x*l*s-o*g*s-x*r*c+e*g*c+o*r*m-e*l*m)*I,t[7]=(o*p*s-u*l*s+u*r*c-e*p*c-o*r*_+e*l*_)*I,t[8]=S*I,t[9]=(x*f*s-u*M*s-x*i*_+e*M*_+u*i*m-e*f*m)*I,t[10]=(o*M*s-x*a*s+x*i*c-e*M*c-o*i*m+e*a*m)*I,t[11]=(u*a*s-o*f*s-u*i*c+e*f*c+o*i*_-e*a*_)*I,t[12]=V*I,t[13]=(u*M*r-x*f*r+x*i*p-e*M*p-u*i*g+e*f*g)*I,t[14]=(x*a*r-o*M*r-x*i*l+e*M*l+o*i*g-e*a*g)*I,t[15]=(o*f*r-u*a*r+u*i*l-e*f*l-o*i*p+e*a*p)*I,this}scale(t){const e=this.elements,i=t.x,r=t.y,s=t.z;return e[0]*=i,e[4]*=r,e[8]*=s,e[1]*=i,e[5]*=r,e[9]*=s,e[2]*=i,e[6]*=r,e[10]*=s,e[3]*=i,e[7]*=r,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],r=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,r))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const i=Math.cos(e),r=Math.sin(e),s=1-i,o=t.x,a=t.y,l=t.z,c=s*o,u=s*a;return this.set(c*o+i,c*a-r*l,c*l+r*a,0,c*a+r*l,u*a+i,u*l-r*o,0,c*l-r*a,u*l+r*o,s*l*l+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,r,s,o){return this.set(1,i,s,0,t,1,o,0,e,r,1,0,0,0,0,1),this}compose(t,e,i){const r=this.elements,s=e._x,o=e._y,a=e._z,l=e._w,c=s+s,u=o+o,f=a+a,p=s*c,_=s*u,x=s*f,M=o*u,g=o*f,m=a*f,L=l*c,R=l*u,S=l*f,V=i.x,C=i.y,I=i.z;return r[0]=(1-(M+m))*V,r[1]=(_+S)*V,r[2]=(x-R)*V,r[3]=0,r[4]=(_-S)*C,r[5]=(1-(p+m))*C,r[6]=(g+L)*C,r[7]=0,r[8]=(x+R)*I,r[9]=(g-L)*I,r[10]=(1-(p+M))*I,r[11]=0,r[12]=t.x,r[13]=t.y,r[14]=t.z,r[15]=1,this}decompose(t,e,i){const r=this.elements;let s=Gr.set(r[0],r[1],r[2]).length();const o=Gr.set(r[4],r[5],r[6]).length(),a=Gr.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),t.x=r[12],t.y=r[13],t.z=r[14],zn.copy(this);const c=1/s,u=1/o,f=1/a;return zn.elements[0]*=c,zn.elements[1]*=c,zn.elements[2]*=c,zn.elements[4]*=u,zn.elements[5]*=u,zn.elements[6]*=u,zn.elements[8]*=f,zn.elements[9]*=f,zn.elements[10]*=f,e.setFromRotationMatrix(zn),i.x=s,i.y=o,i.z=a,this}makePerspective(t,e,i,r,s,o,a=Ri){const l=this.elements,c=2*s/(e-t),u=2*s/(i-r),f=(e+t)/(e-t),p=(i+r)/(i-r);let _,x;if(a===Ri)_=-(o+s)/(o-s),x=-2*o*s/(o-s);else if(a===ha)_=-o/(o-s),x=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=f,l[12]=0,l[1]=0,l[5]=u,l[9]=p,l[13]=0,l[2]=0,l[6]=0,l[10]=_,l[14]=x,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,i,r,s,o,a=Ri){const l=this.elements,c=1/(e-t),u=1/(i-r),f=1/(o-s),p=(e+t)*c,_=(i+r)*u;let x,M;if(a===Ri)x=(o+s)*f,M=-2*f;else if(a===ha)x=s*f,M=-1*f;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-p,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-_,l[2]=0,l[6]=0,l[10]=M,l[14]=-x,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<16;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}}const Gr=new j,zn=new We,Jv=new j(0,0,0),Qv=new j(1,1,1),Bi=new j,Ao=new j,Tn=new j,vf=new We,xf=new oi;class fi{constructor(t=0,e=0,i=0,r=fi.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=r}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,r=this._order){return this._x=t,this._y=e,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){const r=t.elements,s=r[0],o=r[4],a=r[8],l=r[1],c=r[5],u=r[9],f=r[2],p=r[6],_=r[10];switch(e){case"XYZ":this._y=Math.asin(ve(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,_),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(p,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ve(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,_),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(ve(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-f,_),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-ve(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(p,_),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(ve(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(a,_));break;case"XZY":this._z=Math.asin(-ve(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(p,c),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-u,_),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return vf.makeRotationFromQuaternion(t),this.setFromRotationMatrix(vf,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return xf.setFromEuler(this),this.setFromQuaternion(xf,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}fi.DEFAULT_ORDER="XYZ";class Wd{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let t0=0;const Mf=new j,Wr=new oi,xi=new We,wo=new j,Ds=new j,e0=new j,n0=new oi,Sf=new j(1,0,0),yf=new j(0,1,0),Ef=new j(0,0,1),bf={type:"added"},i0={type:"removed"},Xr={type:"childadded",child:null},hl={type:"childremoved",child:null};class sn extends Lr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:t0++}),this.uuid=ys(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=sn.DEFAULT_UP.clone();const t=new j,e=new fi,i=new oi,r=new j(1,1,1);function s(){i.setFromEuler(e,!1)}function o(){e.setFromQuaternion(i,void 0,!1)}e._onChange(s),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new We},normalMatrix:{value:new de}}),this.matrix=new We,this.matrixWorld=new We,this.matrixAutoUpdate=sn.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=sn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Wd,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Wr.setFromAxisAngle(t,e),this.quaternion.multiply(Wr),this}rotateOnWorldAxis(t,e){return Wr.setFromAxisAngle(t,e),this.quaternion.premultiply(Wr),this}rotateX(t){return this.rotateOnAxis(Sf,t)}rotateY(t){return this.rotateOnAxis(yf,t)}rotateZ(t){return this.rotateOnAxis(Ef,t)}translateOnAxis(t,e){return Mf.copy(t).applyQuaternion(this.quaternion),this.position.add(Mf.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Sf,t)}translateY(t){return this.translateOnAxis(yf,t)}translateZ(t){return this.translateOnAxis(Ef,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(xi.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?wo.copy(t):wo.set(t,e,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Ds.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?xi.lookAt(Ds,wo,this.up):xi.lookAt(wo,Ds,this.up),this.quaternion.setFromRotationMatrix(xi),r&&(xi.extractRotation(r.matrixWorld),Wr.setFromRotationMatrix(xi),this.quaternion.premultiply(Wr.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(bf),Xr.child=t,this.dispatchEvent(Xr),Xr.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(i0),hl.child=t,this.dispatchEvent(hl),hl.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),xi.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),xi.multiply(t.parent.matrixWorld)),t.applyMatrix4(xi),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(bf),Xr.child=t,this.dispatchEvent(Xr),Xr.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ds,t,e0),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ds,n0,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].updateMatrixWorld(t)}updateWorldMatrix(t,e){const i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function s(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const f=l[c];s(t.shapes,f)}else s(t.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(s(t.materials,this.material[l]));r.material=a}else r.material=s(t.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];r.animations.push(s(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),c=o(t.textures),u=o(t.images),f=o(t.shapes),p=o(t.skeletons),_=o(t.animations),x=o(t.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),f.length>0&&(i.shapes=f),p.length>0&&(i.skeletons=p),_.length>0&&(i.animations=_),x.length>0&&(i.nodes=x)}return i.object=r,i;function o(a){const l=[];for(const c in a){const u=a[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){const r=t.children[i];this.add(r.clone())}return this}}sn.DEFAULT_UP=new j(0,1,0);sn.DEFAULT_MATRIX_AUTO_UPDATE=!0;sn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Vn=new j,Mi=new j,dl=new j,Si=new j,$r=new j,Yr=new j,Tf=new j,pl=new j,ml=new j,_l=new j,gl=new $e,vl=new $e,xl=new $e;class kn{constructor(t=new j,e=new j,i=new j){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,r){r.subVectors(i,e),Vn.subVectors(t,e),r.cross(Vn);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(t,e,i,r,s){Vn.subVectors(r,e),Mi.subVectors(i,e),dl.subVectors(t,e);const o=Vn.dot(Vn),a=Vn.dot(Mi),l=Vn.dot(dl),c=Mi.dot(Mi),u=Mi.dot(dl),f=o*c-a*a;if(f===0)return s.set(0,0,0),null;const p=1/f,_=(c*l-a*u)*p,x=(o*u-a*l)*p;return s.set(1-_-x,x,_)}static containsPoint(t,e,i,r){return this.getBarycoord(t,e,i,r,Si)===null?!1:Si.x>=0&&Si.y>=0&&Si.x+Si.y<=1}static getInterpolation(t,e,i,r,s,o,a,l){return this.getBarycoord(t,e,i,r,Si)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Si.x),l.addScaledVector(o,Si.y),l.addScaledVector(a,Si.z),l)}static getInterpolatedAttribute(t,e,i,r,s,o){return gl.setScalar(0),vl.setScalar(0),xl.setScalar(0),gl.fromBufferAttribute(t,e),vl.fromBufferAttribute(t,i),xl.fromBufferAttribute(t,r),o.setScalar(0),o.addScaledVector(gl,s.x),o.addScaledVector(vl,s.y),o.addScaledVector(xl,s.z),o}static isFrontFacing(t,e,i,r){return Vn.subVectors(i,e),Mi.subVectors(t,e),Vn.cross(Mi).dot(r)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,r){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[r]),this}setFromAttributeAndIndices(t,e,i,r){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,r),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Vn.subVectors(this.c,this.b),Mi.subVectors(this.a,this.b),Vn.cross(Mi).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return kn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return kn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,i,r,s){return kn.getInterpolation(t,this.a,this.b,this.c,e,i,r,s)}containsPoint(t){return kn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return kn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const i=this.a,r=this.b,s=this.c;let o,a;$r.subVectors(r,i),Yr.subVectors(s,i),pl.subVectors(t,i);const l=$r.dot(pl),c=Yr.dot(pl);if(l<=0&&c<=0)return e.copy(i);ml.subVectors(t,r);const u=$r.dot(ml),f=Yr.dot(ml);if(u>=0&&f<=u)return e.copy(r);const p=l*f-u*c;if(p<=0&&l>=0&&u<=0)return o=l/(l-u),e.copy(i).addScaledVector($r,o);_l.subVectors(t,s);const _=$r.dot(_l),x=Yr.dot(_l);if(x>=0&&_<=x)return e.copy(s);const M=_*c-l*x;if(M<=0&&c>=0&&x<=0)return a=c/(c-x),e.copy(i).addScaledVector(Yr,a);const g=u*x-_*f;if(g<=0&&f-u>=0&&_-x>=0)return Tf.subVectors(s,r),a=(f-u)/(f-u+(_-x)),e.copy(r).addScaledVector(Tf,a);const m=1/(g+M+p);return o=M*m,a=p*m,e.copy(i).addScaledVector($r,o).addScaledVector(Yr,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Xd={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},zi={h:0,s:0,l:0},Ro={h:0,s:0,l:0};function Ml(n,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?n+(t-n)*6*e:e<1/2?t:e<2/3?n+(t-n)*6*(2/3-e):n}class xe{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){const r=t;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Cn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Ce.toWorkingColorSpace(this,e),this}setRGB(t,e,i,r=Ce.workingColorSpace){return this.r=t,this.g=e,this.b=i,Ce.toWorkingColorSpace(this,r),this}setHSL(t,e,i,r=Ce.workingColorSpace){if(t=au(t,1),e=ve(e,0,1),i=ve(i,0,1),e===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+e):i+e-i*e,o=2*i-s;this.r=Ml(o,s,t+1/3),this.g=Ml(o,s,t),this.b=Ml(o,s,t-1/3)}return Ce.toWorkingColorSpace(this,r),this}setStyle(t,e=Cn){function i(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const o=r[1],a=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(s,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Cn){const i=Xd[t.toLowerCase()];return i!==void 0?this.setHex(i,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ci(t.r),this.g=Ci(t.g),this.b=Ci(t.b),this}copyLinearToSRGB(t){return this.r=ls(t.r),this.g=ls(t.g),this.b=ls(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Cn){return Ce.fromWorkingColorSpace(ln.copy(this),t),Math.round(ve(ln.r*255,0,255))*65536+Math.round(ve(ln.g*255,0,255))*256+Math.round(ve(ln.b*255,0,255))}getHexString(t=Cn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Ce.workingColorSpace){Ce.fromWorkingColorSpace(ln.copy(this),e);const i=ln.r,r=ln.g,s=ln.b,o=Math.max(i,r,s),a=Math.min(i,r,s);let l,c;const u=(a+o)/2;if(a===o)l=0,c=0;else{const f=o-a;switch(c=u<=.5?f/(o+a):f/(2-o-a),o){case i:l=(r-s)/f+(r<s?6:0);break;case r:l=(s-i)/f+2;break;case s:l=(i-r)/f+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=Ce.workingColorSpace){return Ce.fromWorkingColorSpace(ln.copy(this),e),t.r=ln.r,t.g=ln.g,t.b=ln.b,t}getStyle(t=Cn){Ce.fromWorkingColorSpace(ln.copy(this),t);const e=ln.r,i=ln.g,r=ln.b;return t!==Cn?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(t,e,i){return this.getHSL(zi),this.setHSL(zi.h+t,zi.s+e,zi.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(zi),t.getHSL(Ro);const i=$s(zi.h,Ro.h,e),r=$s(zi.s,Ro.s,e),s=$s(zi.l,Ro.l,e);return this.setHSL(i,r,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,i=this.g,r=this.b,s=t.elements;return this.r=s[0]*e+s[3]*i+s[6]*r,this.g=s[1]*e+s[4]*i+s[7]*r,this.b=s[2]*e+s[5]*i+s[8]*r,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const ln=new xe;xe.NAMES=Xd;let r0=0;class Es extends Lr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:r0++}),this.uuid=ys(),this.name="",this.type="Material",this.blending=os,this.side=Zi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ql,this.blendDst=jl,this.blendEquation=gr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new xe(0,0,0),this.blendAlpha=0,this.depthFunc=hs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=uf,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Br,this.stencilZFail=Br,this.stencilZPass=Br,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const i=t[e];if(i===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[e]=i}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==os&&(i.blending=this.blending),this.side!==Zi&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==ql&&(i.blendSrc=this.blendSrc),this.blendDst!==jl&&(i.blendDst=this.blendDst),this.blendEquation!==gr&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==hs&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==uf&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Br&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Br&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Br&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const o=[];for(const a in s){const l=s[a];delete l.metadata,o.push(l)}return o}if(e){const s=r(t.textures),o=r(t.images);s.length>0&&(i.textures=s),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let i=null;if(e!==null){const r=e.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=e[s].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class cu extends Es{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new xe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new fi,this.combine=wd,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const qe=new j,Co=new pe;class Fn{constructor(t,e,i=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=ff,this.updateRanges=[],this.gpuType=wi,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[t+r]=e.array[i+r];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)Co.fromBufferAttribute(this,e),Co.applyMatrix3(t),this.setXY(e,Co.x,Co.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)qe.fromBufferAttribute(this,e),qe.applyMatrix3(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)qe.fromBufferAttribute(this,e),qe.applyMatrix4(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)qe.fromBufferAttribute(this,e),qe.applyNormalMatrix(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)qe.fromBufferAttribute(this,e),qe.transformDirection(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=ts(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=pn(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=ts(e,this.array)),e}setX(t,e){return this.normalized&&(e=pn(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=ts(e,this.array)),e}setY(t,e){return this.normalized&&(e=pn(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=ts(e,this.array)),e}setZ(t,e){return this.normalized&&(e=pn(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=ts(e,this.array)),e}setW(t,e){return this.normalized&&(e=pn(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=pn(e,this.array),i=pn(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,r){return t*=this.itemSize,this.normalized&&(e=pn(e,this.array),i=pn(i,this.array),r=pn(r,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this}setXYZW(t,e,i,r,s){return t*=this.itemSize,this.normalized&&(e=pn(e,this.array),i=pn(i,this.array),r=pn(r,this.array),s=pn(s,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==ff&&(t.usage=this.usage),t}}class $d extends Fn{constructor(t,e,i){super(new Uint16Array(t),e,i)}}class Yd extends Fn{constructor(t,e,i){super(new Uint32Array(t),e,i)}}class qn extends Fn{constructor(t,e,i){super(new Float32Array(t),e,i)}}let s0=0;const Rn=new We,Sl=new sn,qr=new j,An=new so,Ls=new so,tn=new j;class vn extends Lr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:s0++}),this.uuid=ys(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Hd(t)?Yd:$d)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new de().getNormalMatrix(t);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(t),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Rn.makeRotationFromQuaternion(t),this.applyMatrix4(Rn),this}rotateX(t){return Rn.makeRotationX(t),this.applyMatrix4(Rn),this}rotateY(t){return Rn.makeRotationY(t),this.applyMatrix4(Rn),this}rotateZ(t){return Rn.makeRotationZ(t),this.applyMatrix4(Rn),this}translate(t,e,i){return Rn.makeTranslation(t,e,i),this.applyMatrix4(Rn),this}scale(t,e,i){return Rn.makeScale(t,e,i),this.applyMatrix4(Rn),this}lookAt(t){return Sl.lookAt(t),Sl.updateMatrix(),this.applyMatrix4(Sl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(qr).negate(),this.translate(qr.x,qr.y,qr.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const i=[];for(let r=0,s=t.length;r<s;r++){const o=t[r];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new qn(i,3))}else{const i=Math.min(t.length,e.count);for(let r=0;r<i;r++){const s=t[r];e.setXYZ(r,s.x,s.y,s.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new so);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new j(-1/0,-1/0,-1/0),new j(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,r=e.length;i<r;i++){const s=e[i];An.setFromBufferAttribute(s),this.morphTargetsRelative?(tn.addVectors(this.boundingBox.min,An.min),this.boundingBox.expandByPoint(tn),tn.addVectors(this.boundingBox.max,An.max),this.boundingBox.expandByPoint(tn)):(this.boundingBox.expandByPoint(An.min),this.boundingBox.expandByPoint(An.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ia);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new j,1/0);return}if(t){const i=this.boundingSphere.center;if(An.setFromBufferAttribute(t),e)for(let s=0,o=e.length;s<o;s++){const a=e[s];Ls.setFromBufferAttribute(a),this.morphTargetsRelative?(tn.addVectors(An.min,Ls.min),An.expandByPoint(tn),tn.addVectors(An.max,Ls.max),An.expandByPoint(tn)):(An.expandByPoint(Ls.min),An.expandByPoint(Ls.max))}An.getCenter(i);let r=0;for(let s=0,o=t.count;s<o;s++)tn.fromBufferAttribute(t,s),r=Math.max(r,i.distanceToSquared(tn));if(e)for(let s=0,o=e.length;s<o;s++){const a=e[s],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)tn.fromBufferAttribute(a,c),l&&(qr.fromBufferAttribute(t,c),tn.add(qr)),r=Math.max(r,i.distanceToSquared(tn))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=e.position,r=e.normal,s=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Fn(new Float32Array(4*i.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let z=0;z<i.count;z++)a[z]=new j,l[z]=new j;const c=new j,u=new j,f=new j,p=new pe,_=new pe,x=new pe,M=new j,g=new j;function m(z,A,y){c.fromBufferAttribute(i,z),u.fromBufferAttribute(i,A),f.fromBufferAttribute(i,y),p.fromBufferAttribute(s,z),_.fromBufferAttribute(s,A),x.fromBufferAttribute(s,y),u.sub(c),f.sub(c),_.sub(p),x.sub(p);const O=1/(_.x*x.y-x.x*_.y);isFinite(O)&&(M.copy(u).multiplyScalar(x.y).addScaledVector(f,-_.y).multiplyScalar(O),g.copy(f).multiplyScalar(_.x).addScaledVector(u,-x.x).multiplyScalar(O),a[z].add(M),a[A].add(M),a[y].add(M),l[z].add(g),l[A].add(g),l[y].add(g))}let L=this.groups;L.length===0&&(L=[{start:0,count:t.count}]);for(let z=0,A=L.length;z<A;++z){const y=L[z],O=y.start,lt=y.count;for(let Q=O,ht=O+lt;Q<ht;Q+=3)m(t.getX(Q+0),t.getX(Q+1),t.getX(Q+2))}const R=new j,S=new j,V=new j,C=new j;function I(z){V.fromBufferAttribute(r,z),C.copy(V);const A=a[z];R.copy(A),R.sub(V.multiplyScalar(V.dot(A))).normalize(),S.crossVectors(C,A);const O=S.dot(l[z])<0?-1:1;o.setXYZW(z,R.x,R.y,R.z,O)}for(let z=0,A=L.length;z<A;++z){const y=L[z],O=y.start,lt=y.count;for(let Q=O,ht=O+lt;Q<ht;Q+=3)I(t.getX(Q+0)),I(t.getX(Q+1)),I(t.getX(Q+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Fn(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let p=0,_=i.count;p<_;p++)i.setXYZ(p,0,0,0);const r=new j,s=new j,o=new j,a=new j,l=new j,c=new j,u=new j,f=new j;if(t)for(let p=0,_=t.count;p<_;p+=3){const x=t.getX(p+0),M=t.getX(p+1),g=t.getX(p+2);r.fromBufferAttribute(e,x),s.fromBufferAttribute(e,M),o.fromBufferAttribute(e,g),u.subVectors(o,s),f.subVectors(r,s),u.cross(f),a.fromBufferAttribute(i,x),l.fromBufferAttribute(i,M),c.fromBufferAttribute(i,g),a.add(u),l.add(u),c.add(u),i.setXYZ(x,a.x,a.y,a.z),i.setXYZ(M,l.x,l.y,l.z),i.setXYZ(g,c.x,c.y,c.z)}else for(let p=0,_=e.count;p<_;p+=3)r.fromBufferAttribute(e,p+0),s.fromBufferAttribute(e,p+1),o.fromBufferAttribute(e,p+2),u.subVectors(o,s),f.subVectors(r,s),u.cross(f),i.setXYZ(p+0,u.x,u.y,u.z),i.setXYZ(p+1,u.x,u.y,u.z),i.setXYZ(p+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)tn.fromBufferAttribute(t,e),tn.normalize(),t.setXYZ(e,tn.x,tn.y,tn.z)}toNonIndexed(){function t(a,l){const c=a.array,u=a.itemSize,f=a.normalized,p=new c.constructor(l.length*u);let _=0,x=0;for(let M=0,g=l.length;M<g;M++){a.isInterleavedBufferAttribute?_=l[M]*a.data.stride+a.offset:_=l[M]*u;for(let m=0;m<u;m++)p[x++]=c[_++]}return new Fn(p,u,f)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new vn,i=this.index.array,r=this.attributes;for(const a in r){const l=r[a],c=t(l,i);e.setAttribute(a,c)}const s=this.morphAttributes;for(const a in s){const l=[],c=s[a];for(let u=0,f=c.length;u<f;u++){const p=c[u],_=t(p,i);l.push(_)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const i=this.attributes;for(const l in i){const c=i[l];t.data.attributes[l]=c.toJSON(t.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let f=0,p=c.length;f<p;f++){const _=c[f];u.push(_.toJSON(t.data))}u.length>0&&(r[l]=u,s=!0)}s&&(t.data.morphAttributes=r,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const i=t.index;i!==null&&this.setIndex(i.clone(e));const r=t.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(e))}const s=t.morphAttributes;for(const c in s){const u=[],f=s[c];for(let p=0,_=f.length;p<_;p++)u.push(f[p].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let c=0,u=o.length;c<u;c++){const f=o[c];this.addGroup(f.start,f.count,f.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Af=new We,cr=new lu,Po=new Ia,wf=new j,Do=new j,Lo=new j,Io=new j,yl=new j,Uo=new j,Rf=new j,No=new j;class Un extends sn{constructor(t=new vn,e=new cu){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(t,e){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,o=i.morphTargetsRelative;e.fromBufferAttribute(r,t);const a=this.morphTargetInfluences;if(s&&a){Uo.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const u=a[l],f=s[l];u!==0&&(yl.fromBufferAttribute(f,t),o?Uo.addScaledVector(yl,u):Uo.addScaledVector(yl.sub(e),u))}e.add(Uo)}return e}raycast(t,e){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Po.copy(i.boundingSphere),Po.applyMatrix4(s),cr.copy(t.ray).recast(t.near),!(Po.containsPoint(cr.origin)===!1&&(cr.intersectSphere(Po,wf)===null||cr.origin.distanceToSquared(wf)>(t.far-t.near)**2))&&(Af.copy(s).invert(),cr.copy(t.ray).applyMatrix4(Af),!(i.boundingBox!==null&&cr.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,cr)))}_computeIntersections(t,e,i){let r;const s=this.geometry,o=this.material,a=s.index,l=s.attributes.position,c=s.attributes.uv,u=s.attributes.uv1,f=s.attributes.normal,p=s.groups,_=s.drawRange;if(a!==null)if(Array.isArray(o))for(let x=0,M=p.length;x<M;x++){const g=p[x],m=o[g.materialIndex],L=Math.max(g.start,_.start),R=Math.min(a.count,Math.min(g.start+g.count,_.start+_.count));for(let S=L,V=R;S<V;S+=3){const C=a.getX(S),I=a.getX(S+1),z=a.getX(S+2);r=Fo(this,m,t,i,c,u,f,C,I,z),r&&(r.faceIndex=Math.floor(S/3),r.face.materialIndex=g.materialIndex,e.push(r))}}else{const x=Math.max(0,_.start),M=Math.min(a.count,_.start+_.count);for(let g=x,m=M;g<m;g+=3){const L=a.getX(g),R=a.getX(g+1),S=a.getX(g+2);r=Fo(this,o,t,i,c,u,f,L,R,S),r&&(r.faceIndex=Math.floor(g/3),e.push(r))}}else if(l!==void 0)if(Array.isArray(o))for(let x=0,M=p.length;x<M;x++){const g=p[x],m=o[g.materialIndex],L=Math.max(g.start,_.start),R=Math.min(l.count,Math.min(g.start+g.count,_.start+_.count));for(let S=L,V=R;S<V;S+=3){const C=S,I=S+1,z=S+2;r=Fo(this,m,t,i,c,u,f,C,I,z),r&&(r.faceIndex=Math.floor(S/3),r.face.materialIndex=g.materialIndex,e.push(r))}}else{const x=Math.max(0,_.start),M=Math.min(l.count,_.start+_.count);for(let g=x,m=M;g<m;g+=3){const L=g,R=g+1,S=g+2;r=Fo(this,o,t,i,c,u,f,L,R,S),r&&(r.faceIndex=Math.floor(g/3),e.push(r))}}}}function o0(n,t,e,i,r,s,o,a){let l;if(t.side===En?l=i.intersectTriangle(o,s,r,!0,a):l=i.intersectTriangle(r,s,o,t.side===Zi,a),l===null)return null;No.copy(a),No.applyMatrix4(n.matrixWorld);const c=e.ray.origin.distanceTo(No);return c<e.near||c>e.far?null:{distance:c,point:No.clone(),object:n}}function Fo(n,t,e,i,r,s,o,a,l,c){n.getVertexPosition(a,Do),n.getVertexPosition(l,Lo),n.getVertexPosition(c,Io);const u=o0(n,t,e,i,Do,Lo,Io,Rf);if(u){const f=new j;kn.getBarycoord(Rf,Do,Lo,Io,f),r&&(u.uv=kn.getInterpolatedAttribute(r,a,l,c,f,new pe)),s&&(u.uv1=kn.getInterpolatedAttribute(s,a,l,c,f,new pe)),o&&(u.normal=kn.getInterpolatedAttribute(o,a,l,c,f,new j),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));const p={a,b:l,c,normal:new j,materialIndex:0};kn.getNormal(Do,Lo,Io,p.normal),u.face=p,u.barycoord=f}return u}class oo extends vn{constructor(t=1,e=1,i=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:r,heightSegments:s,depthSegments:o};const a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);const l=[],c=[],u=[],f=[];let p=0,_=0;x("z","y","x",-1,-1,i,e,t,o,s,0),x("z","y","x",1,-1,i,e,-t,o,s,1),x("x","z","y",1,1,t,i,e,r,o,2),x("x","z","y",1,-1,t,i,-e,r,o,3),x("x","y","z",1,-1,t,e,i,r,s,4),x("x","y","z",-1,-1,t,e,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new qn(c,3)),this.setAttribute("normal",new qn(u,3)),this.setAttribute("uv",new qn(f,2));function x(M,g,m,L,R,S,V,C,I,z,A){const y=S/I,O=V/z,lt=S/2,Q=V/2,ht=C/2,St=I+1,tt=z+1;let dt=0,K=0;const Rt=new j;for(let Dt=0;Dt<tt;Dt++){const Xt=Dt*O-Q;for(let te=0;te<St;te++){const Ae=te*y-lt;Rt[M]=Ae*L,Rt[g]=Xt*R,Rt[m]=ht,c.push(Rt.x,Rt.y,Rt.z),Rt[M]=0,Rt[g]=0,Rt[m]=C>0?1:-1,u.push(Rt.x,Rt.y,Rt.z),f.push(te/I),f.push(1-Dt/z),dt+=1}}for(let Dt=0;Dt<z;Dt++)for(let Xt=0;Xt<I;Xt++){const te=p+Xt+St*Dt,Ae=p+Xt+St*(Dt+1),_t=p+(Xt+1)+St*(Dt+1),Ct=p+(Xt+1)+St*Dt;l.push(te,Ae,Ct),l.push(Ae,_t,Ct),K+=6}a.addGroup(_,K,A),_+=K,p+=dt}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new oo(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function vs(n){const t={};for(const e in n){t[e]={};for(const i in n[e]){const r=n[e][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=r.clone():Array.isArray(r)?t[e][i]=r.slice():t[e][i]=r}}return t}function _n(n){const t={};for(let e=0;e<n.length;e++){const i=vs(n[e]);for(const r in i)t[r]=i[r]}return t}function a0(n){const t=[];for(let e=0;e<n.length;e++)t.push(n[e].clone());return t}function qd(n){const t=n.getRenderTarget();return t===null?n.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Ce.workingColorSpace}const l0={clone:vs,merge:_n};var c0=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,u0=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Ji extends Es{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=c0,this.fragmentShader=u0,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=vs(t.uniforms),this.uniformsGroups=a0(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const r in this.uniforms){const o=this.uniforms[r].value;o&&o.isTexture?e.uniforms[r]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[r]={type:"m4",value:o.toArray()}:e.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}}class jd extends sn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new We,this.projectionMatrix=new We,this.projectionMatrixInverse=new We,this.coordinateSystem=Ri}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Vi=new j,Cf=new pe,Pf=new pe;class Dn extends jd{constructor(t=50,e=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=eo*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Xs*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return eo*2*Math.atan(Math.tan(Xs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,i){Vi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Vi.x,Vi.y).multiplyScalar(-t/Vi.z),Vi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Vi.x,Vi.y).multiplyScalar(-t/Vi.z)}getViewSize(t,e){return this.getViewBounds(t,Cf,Pf),e.subVectors(Pf,Cf)}setViewOffset(t,e,i,r,s,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Xs*.5*this.fov)/this.zoom,i=2*e,r=this.aspect*i,s=-.5*r;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;s+=o.offsetX*r/l,e-=o.offsetY*i/c,r*=o.width/l,i*=o.height/c}const a=this.filmOffset;a!==0&&(s+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,e,e-i,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const jr=-90,Kr=1;class f0 extends sn{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Dn(jr,Kr,t,e);r.layers=this.layers,this.add(r);const s=new Dn(jr,Kr,t,e);s.layers=this.layers,this.add(s);const o=new Dn(jr,Kr,t,e);o.layers=this.layers,this.add(o);const a=new Dn(jr,Kr,t,e);a.layers=this.layers,this.add(a);const l=new Dn(jr,Kr,t,e);l.layers=this.layers,this.add(l);const c=new Dn(jr,Kr,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[i,r,s,o,a,l]=e;for(const c of e)this.remove(c);if(t===Ri)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===ha)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,o,a,l,c,u]=this.children,f=t.getRenderTarget(),p=t.getActiveCubeFace(),_=t.getActiveMipmapLevel(),x=t.xr.enabled;t.xr.enabled=!1;const M=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,t.setRenderTarget(i,0,r),t.render(e,s),t.setRenderTarget(i,1,r),t.render(e,o),t.setRenderTarget(i,2,r),t.render(e,a),t.setRenderTarget(i,3,r),t.render(e,l),t.setRenderTarget(i,4,r),t.render(e,c),i.texture.generateMipmaps=M,t.setRenderTarget(i,5,r),t.render(e,u),t.setRenderTarget(f,p,_),t.xr.enabled=x,i.texture.needsPMREMUpdate=!0}}class Kd extends bn{constructor(t,e,i,r,s,o,a,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:ds,super(t,e,i,r,s,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class h0 extends Pr{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},r=[i,i,i,i,i,i];this.texture=new Kd(r,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:ri}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new oo(5,5,5),s=new Ji({name:"CubemapFromEquirect",uniforms:vs(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:En,blending:ji});s.uniforms.tEquirect.value=e;const o=new Un(r,s),a=e.minFilter;return e.minFilter===yr&&(e.minFilter=ri),new f0(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,i,r){const s=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,i,r);t.setRenderTarget(s)}}class uu{constructor(t,e=1,i=1e3){this.isFog=!0,this.name="",this.color=new xe(t),this.near=e,this.far=i}clone(){return new uu(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class d0 extends sn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new fi,this.environmentIntensity=1,this.environmentRotation=new fi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}const El=new j,p0=new j,m0=new de;class Xi{constructor(t=new j(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,r){return this.normal.set(t,e,i),this.constant=r,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){const r=El.subVectors(i,e).cross(p0.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(r,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const i=t.delta(El),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const s=-(t.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:e.copy(t.start).addScaledVector(i,s)}intersectsLine(t){const e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const i=e||m0.getNormalMatrix(t),r=this.coplanarPoint(El).applyMatrix4(t),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const ur=new Ia,Oo=new j;class fu{constructor(t=new Xi,e=new Xi,i=new Xi,r=new Xi,s=new Xi,o=new Xi){this.planes=[t,e,i,r,s,o]}set(t,e,i,r,s,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(i),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(t){const e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=Ri){const i=this.planes,r=t.elements,s=r[0],o=r[1],a=r[2],l=r[3],c=r[4],u=r[5],f=r[6],p=r[7],_=r[8],x=r[9],M=r[10],g=r[11],m=r[12],L=r[13],R=r[14],S=r[15];if(i[0].setComponents(l-s,p-c,g-_,S-m).normalize(),i[1].setComponents(l+s,p+c,g+_,S+m).normalize(),i[2].setComponents(l+o,p+u,g+x,S+L).normalize(),i[3].setComponents(l-o,p-u,g-x,S-L).normalize(),i[4].setComponents(l-a,p-f,g-M,S-R).normalize(),e===Ri)i[5].setComponents(l+a,p+f,g+M,S+R).normalize();else if(e===ha)i[5].setComponents(a,f,M,R).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),ur.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),ur.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(ur)}intersectsSprite(t){return ur.center.set(0,0,0),ur.radius=.7071067811865476,ur.applyMatrix4(t.matrixWorld),this.intersectsSphere(ur)}intersectsSphere(t){const e=this.planes,i=t.center,r=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(t){const e=this.planes;for(let i=0;i<6;i++){const r=e[i];if(Oo.x=r.normal.x>0?t.max.x:t.min.x,Oo.y=r.normal.y>0?t.max.y:t.min.y,Oo.z=r.normal.z>0?t.max.z:t.min.z,r.distanceToPoint(Oo)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Ua extends Es{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new xe(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const pa=new j,ma=new j,Df=new We,Is=new lu,Bo=new Ia,bl=new j,Lf=new j;class hu extends sn{constructor(t=new vn,e=new Ua){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,i=[0];for(let r=1,s=e.count;r<s;r++)pa.fromBufferAttribute(e,r-1),ma.fromBufferAttribute(e,r),i[r]=i[r-1],i[r]+=pa.distanceTo(ma);t.setAttribute("lineDistance",new qn(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const i=this.geometry,r=this.matrixWorld,s=t.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Bo.copy(i.boundingSphere),Bo.applyMatrix4(r),Bo.radius+=s,t.ray.intersectsSphere(Bo)===!1)return;Df.copy(r).invert(),Is.copy(t.ray).applyMatrix4(Df);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,u=i.index,p=i.attributes.position;if(u!==null){const _=Math.max(0,o.start),x=Math.min(u.count,o.start+o.count);for(let M=_,g=x-1;M<g;M+=c){const m=u.getX(M),L=u.getX(M+1),R=zo(this,t,Is,l,m,L);R&&e.push(R)}if(this.isLineLoop){const M=u.getX(x-1),g=u.getX(_),m=zo(this,t,Is,l,M,g);m&&e.push(m)}}else{const _=Math.max(0,o.start),x=Math.min(p.count,o.start+o.count);for(let M=_,g=x-1;M<g;M+=c){const m=zo(this,t,Is,l,M,M+1);m&&e.push(m)}if(this.isLineLoop){const M=zo(this,t,Is,l,x-1,_);M&&e.push(M)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function zo(n,t,e,i,r,s){const o=n.geometry.attributes.position;if(pa.fromBufferAttribute(o,r),ma.fromBufferAttribute(o,s),e.distanceSqToSegment(pa,ma,bl,Lf)>i)return;bl.applyMatrix4(n.matrixWorld);const l=t.ray.origin.distanceTo(bl);if(!(l<t.near||l>t.far))return{distance:l,point:Lf.clone().applyMatrix4(n.matrixWorld),index:r,face:null,faceIndex:null,barycoord:null,object:n}}const If=new j,Uf=new j;class _0 extends hu{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,i=[];for(let r=0,s=e.count;r<s;r+=2)If.fromBufferAttribute(e,r),Uf.fromBufferAttribute(e,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+If.distanceTo(Uf);t.setAttribute("lineDistance",new qn(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class g0 extends hu{constructor(t,e){super(t,e),this.isLineLoop=!0,this.type="LineLoop"}}class Vo extends sn{constructor(){super(),this.isGroup=!0,this.type="Group"}}class Zd extends bn{constructor(t,e,i,r,s,o,a,l,c,u=as){if(u!==as&&u!==_s)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&u===as&&(i=Cr),i===void 0&&u===_s&&(i=ms),super(null,r,s,o,a,l,u,i,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:Yn,this.minFilter=l!==void 0?l:Yn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}class xs extends vn{constructor(t=1,e=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:r};const s=t/2,o=e/2,a=Math.floor(i),l=Math.floor(r),c=a+1,u=l+1,f=t/a,p=e/l,_=[],x=[],M=[],g=[];for(let m=0;m<u;m++){const L=m*p-o;for(let R=0;R<c;R++){const S=R*f-s;x.push(S,-L,0),M.push(0,0,1),g.push(R/a),g.push(1-m/l)}}for(let m=0;m<l;m++)for(let L=0;L<a;L++){const R=L+c*m,S=L+c*(m+1),V=L+1+c*(m+1),C=L+1+c*m;_.push(R,S,C),_.push(S,V,C)}this.setIndex(_),this.setAttribute("position",new qn(x,3)),this.setAttribute("normal",new qn(M,3)),this.setAttribute("uv",new qn(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new xs(t.width,t.height,t.widthSegments,t.heightSegments)}}class Nf extends Es{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new xe(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new xe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=zd,this.normalScale=new pe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new fi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class v0 extends Es{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=mv,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class x0 extends Es{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class M0 extends Ua{constructor(t){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(t)}copy(t){return super.copy(t),this.scale=t.scale,this.dashSize=t.dashSize,this.gapSize=t.gapSize,this}}class Jd extends sn{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new xe(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}const Tl=new We,Ff=new j,Of=new j;class S0{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new pe(512,512),this.map=null,this.mapPass=null,this.matrix=new We,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new fu,this._frameExtents=new pe(1,1),this._viewportCount=1,this._viewports=[new $e(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,i=this.matrix;Ff.setFromMatrixPosition(t.matrixWorld),e.position.copy(Ff),Of.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Of),e.updateMatrixWorld(),Tl.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Tl),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Tl)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class Qd extends jd{constructor(t=-1,e=1,i=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-t,o=i+t,a=r+e,l=r-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,o=s+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class y0 extends S0{constructor(){super(new Qd(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Bf extends Jd{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(sn.DEFAULT_UP),this.updateMatrix(),this.target=new sn,this.shadow=new y0}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class E0 extends Jd{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}class b0 extends Dn{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class zf{constructor(t=1,e=0,i=0){return this.radius=t,this.phi=e,this.theta=i,this}set(t,e,i){return this.radius=t,this.phi=e,this.theta=i,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=ve(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,i){return this.radius=Math.sqrt(t*t+e*e+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,i),this.phi=Math.acos(ve(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class T0 extends _0{constructor(t=10,e=10,i=4473924,r=8947848){i=new xe(i),r=new xe(r);const s=e/2,o=t/e,a=t/2,l=[],c=[];for(let p=0,_=0,x=-a;p<=e;p++,x+=o){l.push(-a,0,x,a,0,x),l.push(x,0,-a,x,0,a);const M=p===s?i:r;M.toArray(c,_),_+=3,M.toArray(c,_),_+=3,M.toArray(c,_),_+=3,M.toArray(c,_),_+=3}const u=new vn;u.setAttribute("position",new qn(l,3)),u.setAttribute("color",new qn(c,3));const f=new Ua({vertexColors:!0,toneMapped:!1});super(u,f),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}}class A0 extends Lr{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}}function Vf(n,t,e,i){const r=w0(i);switch(e){case Ld:return n*t;case Ud:return n*t;case Nd:return n*t*2;case Fd:return n*t/r.components*r.byteLength;case ru:return n*t/r.components*r.byteLength;case Od:return n*t*2/r.components*r.byteLength;case su:return n*t*2/r.components*r.byteLength;case Id:return n*t*3/r.components*r.byteLength;case Gn:return n*t*4/r.components*r.byteLength;case ou:return n*t*4/r.components*r.byteLength;case jo:case Ko:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*8;case Zo:case Jo:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case lc:case uc:return Math.max(n,16)*Math.max(t,8)/4;case ac:case cc:return Math.max(n,8)*Math.max(t,8)/2;case fc:case hc:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*8;case dc:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case pc:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case mc:return Math.floor((n+4)/5)*Math.floor((t+3)/4)*16;case _c:return Math.floor((n+4)/5)*Math.floor((t+4)/5)*16;case gc:return Math.floor((n+5)/6)*Math.floor((t+4)/5)*16;case vc:return Math.floor((n+5)/6)*Math.floor((t+5)/6)*16;case xc:return Math.floor((n+7)/8)*Math.floor((t+4)/5)*16;case Mc:return Math.floor((n+7)/8)*Math.floor((t+5)/6)*16;case Sc:return Math.floor((n+7)/8)*Math.floor((t+7)/8)*16;case yc:return Math.floor((n+9)/10)*Math.floor((t+4)/5)*16;case Ec:return Math.floor((n+9)/10)*Math.floor((t+5)/6)*16;case bc:return Math.floor((n+9)/10)*Math.floor((t+7)/8)*16;case Tc:return Math.floor((n+9)/10)*Math.floor((t+9)/10)*16;case Ac:return Math.floor((n+11)/12)*Math.floor((t+9)/10)*16;case wc:return Math.floor((n+11)/12)*Math.floor((t+11)/12)*16;case Qo:case Rc:case Cc:return Math.ceil(n/4)*Math.ceil(t/4)*16;case Bd:case Pc:return Math.ceil(n/4)*Math.ceil(t/4)*8;case Dc:case Lc:return Math.ceil(n/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function w0(n){switch(n){case Di:case Cd:return{byteLength:1,components:1};case to:case Pd:case ro:return{byteLength:2,components:1};case nu:case iu:return{byteLength:2,components:4};case Cr:case eu:case wi:return{byteLength:4,components:1};case Dd:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:tu}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=tu);/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function tp(){let n=null,t=!1,e=null,i=null;function r(s,o){e(s,o),i=n.requestAnimationFrame(r)}return{start:function(){t!==!0&&e!==null&&(i=n.requestAnimationFrame(r),t=!0)},stop:function(){n.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){n=s}}}function R0(n){const t=new WeakMap;function e(a,l){const c=a.array,u=a.usage,f=c.byteLength,p=n.createBuffer();n.bindBuffer(l,p),n.bufferData(l,c,u),a.onUploadCallback();let _;if(c instanceof Float32Array)_=n.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?_=n.HALF_FLOAT:_=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)_=n.SHORT;else if(c instanceof Uint32Array)_=n.UNSIGNED_INT;else if(c instanceof Int32Array)_=n.INT;else if(c instanceof Int8Array)_=n.BYTE;else if(c instanceof Uint8Array)_=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)_=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:p,type:_,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:f}}function i(a,l,c){const u=l.array,f=l.updateRanges;if(n.bindBuffer(c,a),f.length===0)n.bufferSubData(c,0,u);else{f.sort((_,x)=>_.start-x.start);let p=0;for(let _=1;_<f.length;_++){const x=f[p],M=f[_];M.start<=x.start+x.count+1?x.count=Math.max(x.count,M.start+M.count-x.start):(++p,f[p]=M)}f.length=p+1;for(let _=0,x=f.length;_<x;_++){const M=f[_];n.bufferSubData(c,M.start*u.BYTES_PER_ELEMENT,u,M.start,M.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(n.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const u=t.get(a);(!u||u.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:r,remove:s,update:o}}var C0=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,P0=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,D0=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,L0=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,I0=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,U0=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,N0=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,F0=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,O0=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,B0=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,z0=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,V0=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,H0=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,k0=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,G0=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,W0=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,X0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,$0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Y0=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,q0=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,j0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,K0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Z0=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,J0=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Q0=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,tx=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,ex=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,nx=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,ix=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,rx=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,sx="gl_FragColor = linearToOutputTexel( gl_FragColor );",ox=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,ax=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,lx=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,cx=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,ux=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,fx=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,hx=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,dx=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,px=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,mx=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,_x=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,gx=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,vx=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,xx=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Mx=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Sx=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,yx=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ex=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,bx=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Tx=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Ax=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,wx=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Rx=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Cx=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Px=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Dx=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Lx=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ix=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ux=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Nx=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Fx=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Ox=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Bx=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,zx=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Vx=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Hx=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,kx=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Gx=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Wx=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Xx=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,$x=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Yx=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,qx=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,jx=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Kx=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Zx=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Jx=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Qx=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,tM=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,eM=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,nM=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,iM=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,rM=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,sM=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,oM=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,aM=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,lM=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,cM=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,uM=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,fM=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,hM=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,dM=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,pM=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,mM=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,_M=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,gM=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,vM=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,xM=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,MM=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,SM=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,yM=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,EM=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,bM=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,TM=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,AM=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,wM=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const RM=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,CM=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,PM=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,DM=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,LM=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,IM=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,UM=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,NM=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,FM=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,OM=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,BM=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,zM=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,VM=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,HM=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,kM=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,GM=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,WM=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,XM=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,$M=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,YM=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qM=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,jM=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,KM=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ZM=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,JM=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,QM=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,tS=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,eS=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,nS=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,iS=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,rS=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,sS=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,oS=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,aS=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,_e={alphahash_fragment:C0,alphahash_pars_fragment:P0,alphamap_fragment:D0,alphamap_pars_fragment:L0,alphatest_fragment:I0,alphatest_pars_fragment:U0,aomap_fragment:N0,aomap_pars_fragment:F0,batching_pars_vertex:O0,batching_vertex:B0,begin_vertex:z0,beginnormal_vertex:V0,bsdfs:H0,iridescence_fragment:k0,bumpmap_pars_fragment:G0,clipping_planes_fragment:W0,clipping_planes_pars_fragment:X0,clipping_planes_pars_vertex:$0,clipping_planes_vertex:Y0,color_fragment:q0,color_pars_fragment:j0,color_pars_vertex:K0,color_vertex:Z0,common:J0,cube_uv_reflection_fragment:Q0,defaultnormal_vertex:tx,displacementmap_pars_vertex:ex,displacementmap_vertex:nx,emissivemap_fragment:ix,emissivemap_pars_fragment:rx,colorspace_fragment:sx,colorspace_pars_fragment:ox,envmap_fragment:ax,envmap_common_pars_fragment:lx,envmap_pars_fragment:cx,envmap_pars_vertex:ux,envmap_physical_pars_fragment:Sx,envmap_vertex:fx,fog_vertex:hx,fog_pars_vertex:dx,fog_fragment:px,fog_pars_fragment:mx,gradientmap_pars_fragment:_x,lightmap_pars_fragment:gx,lights_lambert_fragment:vx,lights_lambert_pars_fragment:xx,lights_pars_begin:Mx,lights_toon_fragment:yx,lights_toon_pars_fragment:Ex,lights_phong_fragment:bx,lights_phong_pars_fragment:Tx,lights_physical_fragment:Ax,lights_physical_pars_fragment:wx,lights_fragment_begin:Rx,lights_fragment_maps:Cx,lights_fragment_end:Px,logdepthbuf_fragment:Dx,logdepthbuf_pars_fragment:Lx,logdepthbuf_pars_vertex:Ix,logdepthbuf_vertex:Ux,map_fragment:Nx,map_pars_fragment:Fx,map_particle_fragment:Ox,map_particle_pars_fragment:Bx,metalnessmap_fragment:zx,metalnessmap_pars_fragment:Vx,morphinstance_vertex:Hx,morphcolor_vertex:kx,morphnormal_vertex:Gx,morphtarget_pars_vertex:Wx,morphtarget_vertex:Xx,normal_fragment_begin:$x,normal_fragment_maps:Yx,normal_pars_fragment:qx,normal_pars_vertex:jx,normal_vertex:Kx,normalmap_pars_fragment:Zx,clearcoat_normal_fragment_begin:Jx,clearcoat_normal_fragment_maps:Qx,clearcoat_pars_fragment:tM,iridescence_pars_fragment:eM,opaque_fragment:nM,packing:iM,premultiplied_alpha_fragment:rM,project_vertex:sM,dithering_fragment:oM,dithering_pars_fragment:aM,roughnessmap_fragment:lM,roughnessmap_pars_fragment:cM,shadowmap_pars_fragment:uM,shadowmap_pars_vertex:fM,shadowmap_vertex:hM,shadowmask_pars_fragment:dM,skinbase_vertex:pM,skinning_pars_vertex:mM,skinning_vertex:_M,skinnormal_vertex:gM,specularmap_fragment:vM,specularmap_pars_fragment:xM,tonemapping_fragment:MM,tonemapping_pars_fragment:SM,transmission_fragment:yM,transmission_pars_fragment:EM,uv_pars_fragment:bM,uv_pars_vertex:TM,uv_vertex:AM,worldpos_vertex:wM,background_vert:RM,background_frag:CM,backgroundCube_vert:PM,backgroundCube_frag:DM,cube_vert:LM,cube_frag:IM,depth_vert:UM,depth_frag:NM,distanceRGBA_vert:FM,distanceRGBA_frag:OM,equirect_vert:BM,equirect_frag:zM,linedashed_vert:VM,linedashed_frag:HM,meshbasic_vert:kM,meshbasic_frag:GM,meshlambert_vert:WM,meshlambert_frag:XM,meshmatcap_vert:$M,meshmatcap_frag:YM,meshnormal_vert:qM,meshnormal_frag:jM,meshphong_vert:KM,meshphong_frag:ZM,meshphysical_vert:JM,meshphysical_frag:QM,meshtoon_vert:tS,meshtoon_frag:eS,points_vert:nS,points_frag:iS,shadow_vert:rS,shadow_frag:sS,sprite_vert:oS,sprite_frag:aS},Bt={common:{diffuse:{value:new xe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new de},alphaMap:{value:null},alphaMapTransform:{value:new de},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new de}},envmap:{envMap:{value:null},envMapRotation:{value:new de},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new de}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new de}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new de},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new de},normalScale:{value:new pe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new de},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new de}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new de}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new de}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new xe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new xe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new de},alphaTest:{value:0},uvTransform:{value:new de}},sprite:{diffuse:{value:new xe(16777215)},opacity:{value:1},center:{value:new pe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new de},alphaMap:{value:null},alphaMapTransform:{value:new de},alphaTest:{value:0}}},ni={basic:{uniforms:_n([Bt.common,Bt.specularmap,Bt.envmap,Bt.aomap,Bt.lightmap,Bt.fog]),vertexShader:_e.meshbasic_vert,fragmentShader:_e.meshbasic_frag},lambert:{uniforms:_n([Bt.common,Bt.specularmap,Bt.envmap,Bt.aomap,Bt.lightmap,Bt.emissivemap,Bt.bumpmap,Bt.normalmap,Bt.displacementmap,Bt.fog,Bt.lights,{emissive:{value:new xe(0)}}]),vertexShader:_e.meshlambert_vert,fragmentShader:_e.meshlambert_frag},phong:{uniforms:_n([Bt.common,Bt.specularmap,Bt.envmap,Bt.aomap,Bt.lightmap,Bt.emissivemap,Bt.bumpmap,Bt.normalmap,Bt.displacementmap,Bt.fog,Bt.lights,{emissive:{value:new xe(0)},specular:{value:new xe(1118481)},shininess:{value:30}}]),vertexShader:_e.meshphong_vert,fragmentShader:_e.meshphong_frag},standard:{uniforms:_n([Bt.common,Bt.envmap,Bt.aomap,Bt.lightmap,Bt.emissivemap,Bt.bumpmap,Bt.normalmap,Bt.displacementmap,Bt.roughnessmap,Bt.metalnessmap,Bt.fog,Bt.lights,{emissive:{value:new xe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:_e.meshphysical_vert,fragmentShader:_e.meshphysical_frag},toon:{uniforms:_n([Bt.common,Bt.aomap,Bt.lightmap,Bt.emissivemap,Bt.bumpmap,Bt.normalmap,Bt.displacementmap,Bt.gradientmap,Bt.fog,Bt.lights,{emissive:{value:new xe(0)}}]),vertexShader:_e.meshtoon_vert,fragmentShader:_e.meshtoon_frag},matcap:{uniforms:_n([Bt.common,Bt.bumpmap,Bt.normalmap,Bt.displacementmap,Bt.fog,{matcap:{value:null}}]),vertexShader:_e.meshmatcap_vert,fragmentShader:_e.meshmatcap_frag},points:{uniforms:_n([Bt.points,Bt.fog]),vertexShader:_e.points_vert,fragmentShader:_e.points_frag},dashed:{uniforms:_n([Bt.common,Bt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:_e.linedashed_vert,fragmentShader:_e.linedashed_frag},depth:{uniforms:_n([Bt.common,Bt.displacementmap]),vertexShader:_e.depth_vert,fragmentShader:_e.depth_frag},normal:{uniforms:_n([Bt.common,Bt.bumpmap,Bt.normalmap,Bt.displacementmap,{opacity:{value:1}}]),vertexShader:_e.meshnormal_vert,fragmentShader:_e.meshnormal_frag},sprite:{uniforms:_n([Bt.sprite,Bt.fog]),vertexShader:_e.sprite_vert,fragmentShader:_e.sprite_frag},background:{uniforms:{uvTransform:{value:new de},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:_e.background_vert,fragmentShader:_e.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new de}},vertexShader:_e.backgroundCube_vert,fragmentShader:_e.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:_e.cube_vert,fragmentShader:_e.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:_e.equirect_vert,fragmentShader:_e.equirect_frag},distanceRGBA:{uniforms:_n([Bt.common,Bt.displacementmap,{referencePosition:{value:new j},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:_e.distanceRGBA_vert,fragmentShader:_e.distanceRGBA_frag},shadow:{uniforms:_n([Bt.lights,Bt.fog,{color:{value:new xe(0)},opacity:{value:1}}]),vertexShader:_e.shadow_vert,fragmentShader:_e.shadow_frag}};ni.physical={uniforms:_n([ni.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new de},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new de},clearcoatNormalScale:{value:new pe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new de},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new de},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new de},sheen:{value:0},sheenColor:{value:new xe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new de},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new de},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new de},transmissionSamplerSize:{value:new pe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new de},attenuationDistance:{value:0},attenuationColor:{value:new xe(0)},specularColor:{value:new xe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new de},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new de},anisotropyVector:{value:new pe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new de}}]),vertexShader:_e.meshphysical_vert,fragmentShader:_e.meshphysical_frag};const Ho={r:0,b:0,g:0},fr=new fi,lS=new We;function cS(n,t,e,i,r,s,o){const a=new xe(0);let l=s===!0?0:1,c,u,f=null,p=0,_=null;function x(R){let S=R.isScene===!0?R.background:null;return S&&S.isTexture&&(S=(R.backgroundBlurriness>0?e:t).get(S)),S}function M(R){let S=!1;const V=x(R);V===null?m(a,l):V&&V.isColor&&(m(V,1),S=!0);const C=n.xr.getEnvironmentBlendMode();C==="additive"?i.buffers.color.setClear(0,0,0,1,o):C==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||S)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function g(R,S){const V=x(S);V&&(V.isCubeTexture||V.mapping===La)?(u===void 0&&(u=new Un(new oo(1,1,1),new Ji({name:"BackgroundCubeMaterial",uniforms:vs(ni.backgroundCube.uniforms),vertexShader:ni.backgroundCube.vertexShader,fragmentShader:ni.backgroundCube.fragmentShader,side:En,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(C,I,z){this.matrixWorld.copyPosition(z.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),fr.copy(S.backgroundRotation),fr.x*=-1,fr.y*=-1,fr.z*=-1,V.isCubeTexture&&V.isRenderTargetTexture===!1&&(fr.y*=-1,fr.z*=-1),u.material.uniforms.envMap.value=V,u.material.uniforms.flipEnvMap.value=V.isCubeTexture&&V.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(lS.makeRotationFromEuler(fr)),u.material.toneMapped=Ce.getTransfer(V.colorSpace)!==Ie,(f!==V||p!==V.version||_!==n.toneMapping)&&(u.material.needsUpdate=!0,f=V,p=V.version,_=n.toneMapping),u.layers.enableAll(),R.unshift(u,u.geometry,u.material,0,0,null)):V&&V.isTexture&&(c===void 0&&(c=new Un(new xs(2,2),new Ji({name:"BackgroundMaterial",uniforms:vs(ni.background.uniforms),vertexShader:ni.background.vertexShader,fragmentShader:ni.background.fragmentShader,side:Zi,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=V,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.toneMapped=Ce.getTransfer(V.colorSpace)!==Ie,V.matrixAutoUpdate===!0&&V.updateMatrix(),c.material.uniforms.uvTransform.value.copy(V.matrix),(f!==V||p!==V.version||_!==n.toneMapping)&&(c.material.needsUpdate=!0,f=V,p=V.version,_=n.toneMapping),c.layers.enableAll(),R.unshift(c,c.geometry,c.material,0,0,null))}function m(R,S){R.getRGB(Ho,qd(n)),i.buffers.color.setClear(Ho.r,Ho.g,Ho.b,S,o)}function L(){u!==void 0&&(u.geometry.dispose(),u.material.dispose()),c!==void 0&&(c.geometry.dispose(),c.material.dispose())}return{getClearColor:function(){return a},setClearColor:function(R,S=1){a.set(R),l=S,m(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(R){l=R,m(a,l)},render:M,addToRenderList:g,dispose:L}}function uS(n,t){const e=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=p(null);let s=r,o=!1;function a(y,O,lt,Q,ht){let St=!1;const tt=f(Q,lt,O);s!==tt&&(s=tt,c(s.object)),St=_(y,Q,lt,ht),St&&x(y,Q,lt,ht),ht!==null&&t.update(ht,n.ELEMENT_ARRAY_BUFFER),(St||o)&&(o=!1,S(y,O,lt,Q),ht!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,t.get(ht).buffer))}function l(){return n.createVertexArray()}function c(y){return n.bindVertexArray(y)}function u(y){return n.deleteVertexArray(y)}function f(y,O,lt){const Q=lt.wireframe===!0;let ht=i[y.id];ht===void 0&&(ht={},i[y.id]=ht);let St=ht[O.id];St===void 0&&(St={},ht[O.id]=St);let tt=St[Q];return tt===void 0&&(tt=p(l()),St[Q]=tt),tt}function p(y){const O=[],lt=[],Q=[];for(let ht=0;ht<e;ht++)O[ht]=0,lt[ht]=0,Q[ht]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:lt,attributeDivisors:Q,object:y,attributes:{},index:null}}function _(y,O,lt,Q){const ht=s.attributes,St=O.attributes;let tt=0;const dt=lt.getAttributes();for(const K in dt)if(dt[K].location>=0){const Dt=ht[K];let Xt=St[K];if(Xt===void 0&&(K==="instanceMatrix"&&y.instanceMatrix&&(Xt=y.instanceMatrix),K==="instanceColor"&&y.instanceColor&&(Xt=y.instanceColor)),Dt===void 0||Dt.attribute!==Xt||Xt&&Dt.data!==Xt.data)return!0;tt++}return s.attributesNum!==tt||s.index!==Q}function x(y,O,lt,Q){const ht={},St=O.attributes;let tt=0;const dt=lt.getAttributes();for(const K in dt)if(dt[K].location>=0){let Dt=St[K];Dt===void 0&&(K==="instanceMatrix"&&y.instanceMatrix&&(Dt=y.instanceMatrix),K==="instanceColor"&&y.instanceColor&&(Dt=y.instanceColor));const Xt={};Xt.attribute=Dt,Dt&&Dt.data&&(Xt.data=Dt.data),ht[K]=Xt,tt++}s.attributes=ht,s.attributesNum=tt,s.index=Q}function M(){const y=s.newAttributes;for(let O=0,lt=y.length;O<lt;O++)y[O]=0}function g(y){m(y,0)}function m(y,O){const lt=s.newAttributes,Q=s.enabledAttributes,ht=s.attributeDivisors;lt[y]=1,Q[y]===0&&(n.enableVertexAttribArray(y),Q[y]=1),ht[y]!==O&&(n.vertexAttribDivisor(y,O),ht[y]=O)}function L(){const y=s.newAttributes,O=s.enabledAttributes;for(let lt=0,Q=O.length;lt<Q;lt++)O[lt]!==y[lt]&&(n.disableVertexAttribArray(lt),O[lt]=0)}function R(y,O,lt,Q,ht,St,tt){tt===!0?n.vertexAttribIPointer(y,O,lt,ht,St):n.vertexAttribPointer(y,O,lt,Q,ht,St)}function S(y,O,lt,Q){M();const ht=Q.attributes,St=lt.getAttributes(),tt=O.defaultAttributeValues;for(const dt in St){const K=St[dt];if(K.location>=0){let Rt=ht[dt];if(Rt===void 0&&(dt==="instanceMatrix"&&y.instanceMatrix&&(Rt=y.instanceMatrix),dt==="instanceColor"&&y.instanceColor&&(Rt=y.instanceColor)),Rt!==void 0){const Dt=Rt.normalized,Xt=Rt.itemSize,te=t.get(Rt);if(te===void 0)continue;const Ae=te.buffer,_t=te.type,Ct=te.bytesPerElement,Gt=_t===n.INT||_t===n.UNSIGNED_INT||Rt.gpuType===eu;if(Rt.isInterleavedBufferAttribute){const Lt=Rt.data,Qt=Lt.stride,ee=Rt.offset;if(Lt.isInstancedInterleavedBuffer){for(let me=0;me<K.locationSize;me++)m(K.location+me,Lt.meshPerAttribute);y.isInstancedMesh!==!0&&Q._maxInstanceCount===void 0&&(Q._maxInstanceCount=Lt.meshPerAttribute*Lt.count)}else for(let me=0;me<K.locationSize;me++)g(K.location+me);n.bindBuffer(n.ARRAY_BUFFER,Ae);for(let me=0;me<K.locationSize;me++)R(K.location+me,Xt/K.locationSize,_t,Dt,Qt*Ct,(ee+Xt/K.locationSize*me)*Ct,Gt)}else{if(Rt.isInstancedBufferAttribute){for(let Lt=0;Lt<K.locationSize;Lt++)m(K.location+Lt,Rt.meshPerAttribute);y.isInstancedMesh!==!0&&Q._maxInstanceCount===void 0&&(Q._maxInstanceCount=Rt.meshPerAttribute*Rt.count)}else for(let Lt=0;Lt<K.locationSize;Lt++)g(K.location+Lt);n.bindBuffer(n.ARRAY_BUFFER,Ae);for(let Lt=0;Lt<K.locationSize;Lt++)R(K.location+Lt,Xt/K.locationSize,_t,Dt,Xt*Ct,Xt/K.locationSize*Lt*Ct,Gt)}}else if(tt!==void 0){const Dt=tt[dt];if(Dt!==void 0)switch(Dt.length){case 2:n.vertexAttrib2fv(K.location,Dt);break;case 3:n.vertexAttrib3fv(K.location,Dt);break;case 4:n.vertexAttrib4fv(K.location,Dt);break;default:n.vertexAttrib1fv(K.location,Dt)}}}}L()}function V(){z();for(const y in i){const O=i[y];for(const lt in O){const Q=O[lt];for(const ht in Q)u(Q[ht].object),delete Q[ht];delete O[lt]}delete i[y]}}function C(y){if(i[y.id]===void 0)return;const O=i[y.id];for(const lt in O){const Q=O[lt];for(const ht in Q)u(Q[ht].object),delete Q[ht];delete O[lt]}delete i[y.id]}function I(y){for(const O in i){const lt=i[O];if(lt[y.id]===void 0)continue;const Q=lt[y.id];for(const ht in Q)u(Q[ht].object),delete Q[ht];delete lt[y.id]}}function z(){A(),o=!0,s!==r&&(s=r,c(s.object))}function A(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:z,resetDefaultState:A,dispose:V,releaseStatesOfGeometry:C,releaseStatesOfProgram:I,initAttributes:M,enableAttribute:g,disableUnusedAttributes:L}}function fS(n,t,e){let i;function r(c){i=c}function s(c,u){n.drawArrays(i,c,u),e.update(u,i,1)}function o(c,u,f){f!==0&&(n.drawArraysInstanced(i,c,u,f),e.update(u,i,f))}function a(c,u,f){if(f===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,u,0,f);let _=0;for(let x=0;x<f;x++)_+=u[x];e.update(_,i,1)}function l(c,u,f,p){if(f===0)return;const _=t.get("WEBGL_multi_draw");if(_===null)for(let x=0;x<c.length;x++)o(c[x],u[x],p[x]);else{_.multiDrawArraysInstancedWEBGL(i,c,0,u,0,p,0,f);let x=0;for(let M=0;M<f;M++)x+=u[M]*p[M];e.update(x,i,1)}}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function hS(n,t,e,i){let r;function s(){if(r!==void 0)return r;if(t.has("EXT_texture_filter_anisotropic")===!0){const I=t.get("EXT_texture_filter_anisotropic");r=n.getParameter(I.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(I){return!(I!==Gn&&i.convert(I)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(I){const z=I===ro&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(I!==Di&&i.convert(I)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&I!==wi&&!z)}function l(I){if(I==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";I="mediump"}return I==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const f=e.logarithmicDepthBuffer===!0,p=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),_=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),x=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),M=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),m=n.getParameter(n.MAX_VERTEX_ATTRIBS),L=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),R=n.getParameter(n.MAX_VARYING_VECTORS),S=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),V=x>0,C=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:f,reverseDepthBuffer:p,maxTextures:_,maxVertexTextures:x,maxTextureSize:M,maxCubemapSize:g,maxAttributes:m,maxVertexUniforms:L,maxVaryings:R,maxFragmentUniforms:S,vertexTextures:V,maxSamples:C}}function dS(n){const t=this;let e=null,i=0,r=!1,s=!1;const o=new Xi,a=new de,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,p){const _=f.length!==0||p||i!==0||r;return r=p,i=f.length,_},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,p){e=u(f,p,0)},this.setState=function(f,p,_){const x=f.clippingPlanes,M=f.clipIntersection,g=f.clipShadows,m=n.get(f);if(!r||x===null||x.length===0||s&&!g)s?u(null):c();else{const L=s?0:i,R=L*4;let S=m.clippingState||null;l.value=S,S=u(x,p,R,_);for(let V=0;V!==R;++V)S[V]=e[V];m.clippingState=S,this.numIntersection=M?this.numPlanes:0,this.numPlanes+=L}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function u(f,p,_,x){const M=f!==null?f.length:0;let g=null;if(M!==0){if(g=l.value,x!==!0||g===null){const m=_+M*4,L=p.matrixWorldInverse;a.getNormalMatrix(L),(g===null||g.length<m)&&(g=new Float32Array(m));for(let R=0,S=_;R!==M;++R,S+=4)o.copy(f[R]).applyMatrix4(L,a),o.normal.toArray(g,S),g[S+3]=o.constant}l.value=g,l.needsUpdate=!0}return t.numPlanes=M,t.numIntersection=0,g}}function pS(n){let t=new WeakMap;function e(o,a){return a===ic?o.mapping=ds:a===rc&&(o.mapping=ps),o}function i(o){if(o&&o.isTexture){const a=o.mapping;if(a===ic||a===rc)if(t.has(o)){const l=t.get(o).texture;return e(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new h0(l.height);return c.fromEquirectangularTexture(n,o),t.set(o,c),o.addEventListener("dispose",r),e(c.texture,o.mapping)}else return null}}return o}function r(o){const a=o.target;a.removeEventListener("dispose",r);const l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function s(){t=new WeakMap}return{get:i,dispose:s}}const is=4,Hf=[.125,.215,.35,.446,.526,.582],vr=20,Al=new Qd,kf=new xe;let wl=null,Rl=0,Cl=0,Pl=!1;const mr=(1+Math.sqrt(5))/2,Zr=1/mr,Gf=[new j(-mr,Zr,0),new j(mr,Zr,0),new j(-Zr,0,mr),new j(Zr,0,mr),new j(0,mr,-Zr),new j(0,mr,Zr),new j(-1,1,-1),new j(1,1,-1),new j(-1,1,1),new j(1,1,1)];class Wf{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,i=.1,r=100){wl=this._renderer.getRenderTarget(),Rl=this._renderer.getActiveCubeFace(),Cl=this._renderer.getActiveMipmapLevel(),Pl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(t,i,r,s),e>0&&this._blur(s,0,0,e),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Yf(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=$f(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(wl,Rl,Cl),this._renderer.xr.enabled=Pl,t.scissorTest=!1,ko(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===ds||t.mapping===ps?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),wl=this._renderer.getRenderTarget(),Rl=this._renderer.getActiveCubeFace(),Cl=this._renderer.getActiveMipmapLevel(),Pl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:ri,minFilter:ri,generateMipmaps:!1,type:ro,format:Gn,colorSpace:gs,depthBuffer:!1},r=Xf(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Xf(t,e,i);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=mS(s)),this._blurMaterial=_S(s,t,e)}return r}_compileMaterial(t){const e=new Un(this._lodPlanes[0],t);this._renderer.compile(e,Al)}_sceneToCubeUV(t,e,i,r){const a=new Dn(90,1,e,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,p=u.toneMapping;u.getClearColor(kf),u.toneMapping=Ki,u.autoClear=!1;const _=new cu({name:"PMREM.Background",side:En,depthWrite:!1,depthTest:!1}),x=new Un(new oo,_);let M=!1;const g=t.background;g?g.isColor&&(_.color.copy(g),t.background=null,M=!0):(_.color.copy(kf),M=!0);for(let m=0;m<6;m++){const L=m%3;L===0?(a.up.set(0,l[m],0),a.lookAt(c[m],0,0)):L===1?(a.up.set(0,0,l[m]),a.lookAt(0,c[m],0)):(a.up.set(0,l[m],0),a.lookAt(0,0,c[m]));const R=this._cubeSize;ko(r,L*R,m>2?R:0,R,R),u.setRenderTarget(r),M&&u.render(x,a),u.render(t,a)}x.geometry.dispose(),x.material.dispose(),u.toneMapping=p,u.autoClear=f,t.background=g}_textureToCubeUV(t,e){const i=this._renderer,r=t.mapping===ds||t.mapping===ps;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Yf()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=$f());const s=r?this._cubemapMaterial:this._equirectMaterial,o=new Un(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=t;const l=this._cubeSize;ko(e,0,0,3*l,2*l),i.setRenderTarget(e),i.render(o,Al)}_applyPMREM(t){const e=this._renderer,i=e.autoClear;e.autoClear=!1;const r=this._lodPlanes.length;for(let s=1;s<r;s++){const o=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=Gf[(r-s-1)%Gf.length];this._blur(t,s-1,s,o,a)}e.autoClear=i}_blur(t,e,i,r,s){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,i,r,"latitudinal",s),this._halfBlur(o,t,i,i,r,"longitudinal",s)}_halfBlur(t,e,i,r,s,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,f=new Un(this._lodPlanes[r],c),p=c.uniforms,_=this._sizeLods[i]-1,x=isFinite(s)?Math.PI/(2*_):2*Math.PI/(2*vr-1),M=s/x,g=isFinite(s)?1+Math.floor(u*M):vr;g>vr&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${vr}`);const m=[];let L=0;for(let I=0;I<vr;++I){const z=I/M,A=Math.exp(-z*z/2);m.push(A),I===0?L+=A:I<g&&(L+=2*A)}for(let I=0;I<m.length;I++)m[I]=m[I]/L;p.envMap.value=t.texture,p.samples.value=g,p.weights.value=m,p.latitudinal.value=o==="latitudinal",a&&(p.poleAxis.value=a);const{_lodMax:R}=this;p.dTheta.value=x,p.mipInt.value=R-i;const S=this._sizeLods[r],V=3*S*(r>R-is?r-R+is:0),C=4*(this._cubeSize-S);ko(e,V,C,3*S,2*S),l.setRenderTarget(e),l.render(f,Al)}}function mS(n){const t=[],e=[],i=[];let r=n;const s=n-is+1+Hf.length;for(let o=0;o<s;o++){const a=Math.pow(2,r);e.push(a);let l=1/a;o>n-is?l=Hf[o-n+is-1]:o===0&&(l=0),i.push(l);const c=1/(a-2),u=-c,f=1+c,p=[u,u,f,u,f,f,u,u,f,f,u,f],_=6,x=6,M=3,g=2,m=1,L=new Float32Array(M*x*_),R=new Float32Array(g*x*_),S=new Float32Array(m*x*_);for(let C=0;C<_;C++){const I=C%3*2/3-1,z=C>2?0:-1,A=[I,z,0,I+2/3,z,0,I+2/3,z+1,0,I,z,0,I+2/3,z+1,0,I,z+1,0];L.set(A,M*x*C),R.set(p,g*x*C);const y=[C,C,C,C,C,C];S.set(y,m*x*C)}const V=new vn;V.setAttribute("position",new Fn(L,M)),V.setAttribute("uv",new Fn(R,g)),V.setAttribute("faceIndex",new Fn(S,m)),t.push(V),r>is&&r--}return{lodPlanes:t,sizeLods:e,sigmas:i}}function Xf(n,t,e){const i=new Pr(n,t,e);return i.texture.mapping=La,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function ko(n,t,e,i,r){n.viewport.set(t,e,i,r),n.scissor.set(t,e,i,r)}function _S(n,t,e){const i=new Float32Array(vr),r=new j(0,1,0);return new Ji({name:"SphericalGaussianBlur",defines:{n:vr,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:du(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:ji,depthTest:!1,depthWrite:!1})}function $f(){return new Ji({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:du(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:ji,depthTest:!1,depthWrite:!1})}function Yf(){return new Ji({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:du(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ji,depthTest:!1,depthWrite:!1})}function du(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function gS(n){let t=new WeakMap,e=null;function i(a){if(a&&a.isTexture){const l=a.mapping,c=l===ic||l===rc,u=l===ds||l===ps;if(c||u){let f=t.get(a);const p=f!==void 0?f.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==p)return e===null&&(e=new Wf(n)),f=c?e.fromEquirectangular(a,f):e.fromCubemap(a,f),f.texture.pmremVersion=a.pmremVersion,t.set(a,f),f.texture;if(f!==void 0)return f.texture;{const _=a.image;return c&&_&&_.height>0||u&&_&&r(_)?(e===null&&(e=new Wf(n)),f=c?e.fromEquirectangular(a):e.fromCubemap(a),f.texture.pmremVersion=a.pmremVersion,t.set(a,f),a.addEventListener("dispose",s),f.texture):null}}}return a}function r(a){let l=0;const c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function s(a){const l=a.target;l.removeEventListener("dispose",s);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:i,dispose:o}}function vS(n){const t={};function e(i){if(t[i]!==void 0)return t[i];let r;switch(i){case"WEBGL_depth_texture":r=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=n.getExtension(i)}return t[i]=r,r}return{has:function(i){return e(i)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(i){const r=e(i);return r===null&&es("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function xS(n,t,e,i){const r={},s=new WeakMap;function o(f){const p=f.target;p.index!==null&&t.remove(p.index);for(const x in p.attributes)t.remove(p.attributes[x]);p.removeEventListener("dispose",o),delete r[p.id];const _=s.get(p);_&&(t.remove(_),s.delete(p)),i.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,e.memory.geometries--}function a(f,p){return r[p.id]===!0||(p.addEventListener("dispose",o),r[p.id]=!0,e.memory.geometries++),p}function l(f){const p=f.attributes;for(const _ in p)t.update(p[_],n.ARRAY_BUFFER)}function c(f){const p=[],_=f.index,x=f.attributes.position;let M=0;if(_!==null){const L=_.array;M=_.version;for(let R=0,S=L.length;R<S;R+=3){const V=L[R+0],C=L[R+1],I=L[R+2];p.push(V,C,C,I,I,V)}}else if(x!==void 0){const L=x.array;M=x.version;for(let R=0,S=L.length/3-1;R<S;R+=3){const V=R+0,C=R+1,I=R+2;p.push(V,C,C,I,I,V)}}else return;const g=new(Hd(p)?Yd:$d)(p,1);g.version=M;const m=s.get(f);m&&t.remove(m),s.set(f,g)}function u(f){const p=s.get(f);if(p){const _=f.index;_!==null&&p.version<_.version&&c(f)}else c(f);return s.get(f)}return{get:a,update:l,getWireframeAttribute:u}}function MS(n,t,e){let i;function r(p){i=p}let s,o;function a(p){s=p.type,o=p.bytesPerElement}function l(p,_){n.drawElements(i,_,s,p*o),e.update(_,i,1)}function c(p,_,x){x!==0&&(n.drawElementsInstanced(i,_,s,p*o,x),e.update(_,i,x))}function u(p,_,x){if(x===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,_,0,s,p,0,x);let g=0;for(let m=0;m<x;m++)g+=_[m];e.update(g,i,1)}function f(p,_,x,M){if(x===0)return;const g=t.get("WEBGL_multi_draw");if(g===null)for(let m=0;m<p.length;m++)c(p[m]/o,_[m],M[m]);else{g.multiDrawElementsInstancedWEBGL(i,_,0,s,p,0,M,0,x);let m=0;for(let L=0;L<x;L++)m+=_[L]*M[L];e.update(m,i,1)}}this.setMode=r,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=f}function SS(n){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(e.calls++,o){case n.TRIANGLES:e.triangles+=a*(s/3);break;case n.LINES:e.lines+=a*(s/2);break;case n.LINE_STRIP:e.lines+=a*(s-1);break;case n.LINE_LOOP:e.lines+=a*s;break;case n.POINTS:e.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function r(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:r,update:i}}function yS(n,t,e){const i=new WeakMap,r=new $e;function s(o,a,l){const c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,f=u!==void 0?u.length:0;let p=i.get(a);if(p===void 0||p.count!==f){let A=function(){I.dispose(),i.delete(a),a.removeEventListener("dispose",A)};p!==void 0&&p.texture.dispose();const _=a.morphAttributes.position!==void 0,x=a.morphAttributes.normal!==void 0,M=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],m=a.morphAttributes.normal||[],L=a.morphAttributes.color||[];let R=0;_===!0&&(R=1),x===!0&&(R=2),M===!0&&(R=3);let S=a.attributes.position.count*R,V=1;S>t.maxTextureSize&&(V=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize);const C=new Float32Array(S*V*4*f),I=new Gd(C,S,V,f);I.type=wi,I.needsUpdate=!0;const z=R*4;for(let y=0;y<f;y++){const O=g[y],lt=m[y],Q=L[y],ht=S*V*4*y;for(let St=0;St<O.count;St++){const tt=St*z;_===!0&&(r.fromBufferAttribute(O,St),C[ht+tt+0]=r.x,C[ht+tt+1]=r.y,C[ht+tt+2]=r.z,C[ht+tt+3]=0),x===!0&&(r.fromBufferAttribute(lt,St),C[ht+tt+4]=r.x,C[ht+tt+5]=r.y,C[ht+tt+6]=r.z,C[ht+tt+7]=0),M===!0&&(r.fromBufferAttribute(Q,St),C[ht+tt+8]=r.x,C[ht+tt+9]=r.y,C[ht+tt+10]=r.z,C[ht+tt+11]=Q.itemSize===4?r.w:1)}}p={count:f,texture:I,size:new pe(S,V)},i.set(a,p),a.addEventListener("dispose",A)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,e);else{let _=0;for(let M=0;M<c.length;M++)_+=c[M];const x=a.morphTargetsRelative?1:1-_;l.getUniforms().setValue(n,"morphTargetBaseInfluence",x),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",p.texture,e),l.getUniforms().setValue(n,"morphTargetsTextureSize",p.size)}return{update:s}}function ES(n,t,e,i){let r=new WeakMap;function s(l){const c=i.render.frame,u=l.geometry,f=t.get(l,u);if(r.get(f)!==c&&(t.update(f),r.set(f,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),r.get(l)!==c&&(e.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,n.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){const p=l.skeleton;r.get(p)!==c&&(p.update(),r.set(p,c))}return f}function o(){r=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:s,dispose:o}}const ep=new bn,qf=new Zd(1,1),np=new Gd,ip=new Kv,rp=new Kd,jf=[],Kf=[],Zf=new Float32Array(16),Jf=new Float32Array(9),Qf=new Float32Array(4);function bs(n,t,e){const i=n[0];if(i<=0||i>0)return n;const r=t*e;let s=jf[r];if(s===void 0&&(s=new Float32Array(r),jf[r]=s),t!==0){i.toArray(s,0);for(let o=1,a=0;o!==t;++o)a+=e,n[o].toArray(s,a)}return s}function Je(n,t){if(n.length!==t.length)return!1;for(let e=0,i=n.length;e<i;e++)if(n[e]!==t[e])return!1;return!0}function Qe(n,t){for(let e=0,i=t.length;e<i;e++)n[e]=t[e]}function Na(n,t){let e=Kf[t];e===void 0&&(e=new Int32Array(t),Kf[t]=e);for(let i=0;i!==t;++i)e[i]=n.allocateTextureUnit();return e}function bS(n,t){const e=this.cache;e[0]!==t&&(n.uniform1f(this.addr,t),e[0]=t)}function TS(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Je(e,t))return;n.uniform2fv(this.addr,t),Qe(e,t)}}function AS(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(n.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Je(e,t))return;n.uniform3fv(this.addr,t),Qe(e,t)}}function wS(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Je(e,t))return;n.uniform4fv(this.addr,t),Qe(e,t)}}function RS(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Je(e,t))return;n.uniformMatrix2fv(this.addr,!1,t),Qe(e,t)}else{if(Je(e,i))return;Qf.set(i),n.uniformMatrix2fv(this.addr,!1,Qf),Qe(e,i)}}function CS(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Je(e,t))return;n.uniformMatrix3fv(this.addr,!1,t),Qe(e,t)}else{if(Je(e,i))return;Jf.set(i),n.uniformMatrix3fv(this.addr,!1,Jf),Qe(e,i)}}function PS(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Je(e,t))return;n.uniformMatrix4fv(this.addr,!1,t),Qe(e,t)}else{if(Je(e,i))return;Zf.set(i),n.uniformMatrix4fv(this.addr,!1,Zf),Qe(e,i)}}function DS(n,t){const e=this.cache;e[0]!==t&&(n.uniform1i(this.addr,t),e[0]=t)}function LS(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Je(e,t))return;n.uniform2iv(this.addr,t),Qe(e,t)}}function IS(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Je(e,t))return;n.uniform3iv(this.addr,t),Qe(e,t)}}function US(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Je(e,t))return;n.uniform4iv(this.addr,t),Qe(e,t)}}function NS(n,t){const e=this.cache;e[0]!==t&&(n.uniform1ui(this.addr,t),e[0]=t)}function FS(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Je(e,t))return;n.uniform2uiv(this.addr,t),Qe(e,t)}}function OS(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Je(e,t))return;n.uniform3uiv(this.addr,t),Qe(e,t)}}function BS(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Je(e,t))return;n.uniform4uiv(this.addr,t),Qe(e,t)}}function zS(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(qf.compareFunction=Vd,s=qf):s=ep,e.setTexture2D(t||s,r)}function VS(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture3D(t||ip,r)}function HS(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTextureCube(t||rp,r)}function kS(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture2DArray(t||np,r)}function GS(n){switch(n){case 5126:return bS;case 35664:return TS;case 35665:return AS;case 35666:return wS;case 35674:return RS;case 35675:return CS;case 35676:return PS;case 5124:case 35670:return DS;case 35667:case 35671:return LS;case 35668:case 35672:return IS;case 35669:case 35673:return US;case 5125:return NS;case 36294:return FS;case 36295:return OS;case 36296:return BS;case 35678:case 36198:case 36298:case 36306:case 35682:return zS;case 35679:case 36299:case 36307:return VS;case 35680:case 36300:case 36308:case 36293:return HS;case 36289:case 36303:case 36311:case 36292:return kS}}function WS(n,t){n.uniform1fv(this.addr,t)}function XS(n,t){const e=bs(t,this.size,2);n.uniform2fv(this.addr,e)}function $S(n,t){const e=bs(t,this.size,3);n.uniform3fv(this.addr,e)}function YS(n,t){const e=bs(t,this.size,4);n.uniform4fv(this.addr,e)}function qS(n,t){const e=bs(t,this.size,4);n.uniformMatrix2fv(this.addr,!1,e)}function jS(n,t){const e=bs(t,this.size,9);n.uniformMatrix3fv(this.addr,!1,e)}function KS(n,t){const e=bs(t,this.size,16);n.uniformMatrix4fv(this.addr,!1,e)}function ZS(n,t){n.uniform1iv(this.addr,t)}function JS(n,t){n.uniform2iv(this.addr,t)}function QS(n,t){n.uniform3iv(this.addr,t)}function ty(n,t){n.uniform4iv(this.addr,t)}function ey(n,t){n.uniform1uiv(this.addr,t)}function ny(n,t){n.uniform2uiv(this.addr,t)}function iy(n,t){n.uniform3uiv(this.addr,t)}function ry(n,t){n.uniform4uiv(this.addr,t)}function sy(n,t,e){const i=this.cache,r=t.length,s=Na(e,r);Je(i,s)||(n.uniform1iv(this.addr,s),Qe(i,s));for(let o=0;o!==r;++o)e.setTexture2D(t[o]||ep,s[o])}function oy(n,t,e){const i=this.cache,r=t.length,s=Na(e,r);Je(i,s)||(n.uniform1iv(this.addr,s),Qe(i,s));for(let o=0;o!==r;++o)e.setTexture3D(t[o]||ip,s[o])}function ay(n,t,e){const i=this.cache,r=t.length,s=Na(e,r);Je(i,s)||(n.uniform1iv(this.addr,s),Qe(i,s));for(let o=0;o!==r;++o)e.setTextureCube(t[o]||rp,s[o])}function ly(n,t,e){const i=this.cache,r=t.length,s=Na(e,r);Je(i,s)||(n.uniform1iv(this.addr,s),Qe(i,s));for(let o=0;o!==r;++o)e.setTexture2DArray(t[o]||np,s[o])}function cy(n){switch(n){case 5126:return WS;case 35664:return XS;case 35665:return $S;case 35666:return YS;case 35674:return qS;case 35675:return jS;case 35676:return KS;case 5124:case 35670:return ZS;case 35667:case 35671:return JS;case 35668:case 35672:return QS;case 35669:case 35673:return ty;case 5125:return ey;case 36294:return ny;case 36295:return iy;case 36296:return ry;case 35678:case 36198:case 36298:case 36306:case 35682:return sy;case 35679:case 36299:case 36307:return oy;case 35680:case 36300:case 36308:case 36293:return ay;case 36289:case 36303:case 36311:case 36292:return ly}}class uy{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=GS(e.type)}}class fy{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=cy(e.type)}}class hy{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){const r=this.seq;for(let s=0,o=r.length;s!==o;++s){const a=r[s];a.setValue(t,e[a.id],i)}}}const Dl=/(\w+)(\])?(\[|\.)?/g;function th(n,t){n.seq.push(t),n.map[t.id]=t}function dy(n,t,e){const i=n.name,r=i.length;for(Dl.lastIndex=0;;){const s=Dl.exec(i),o=Dl.lastIndex;let a=s[1];const l=s[2]==="]",c=s[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===r){th(e,c===void 0?new uy(a,n,t):new fy(a,n,t));break}else{let f=e.map[a];f===void 0&&(f=new hy(a),th(e,f)),e=f}}}class ta{constructor(t,e){this.seq=[],this.map={};const i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const s=t.getActiveUniform(e,r),o=t.getUniformLocation(e,s.name);dy(s,o,this)}}setValue(t,e,i,r){const s=this.map[e];s!==void 0&&s.setValue(t,i,r)}setOptional(t,e,i){const r=e[i];r!==void 0&&this.setValue(t,i,r)}static upload(t,e,i,r){for(let s=0,o=e.length;s!==o;++s){const a=e[s],l=i[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,r)}}static seqWithValue(t,e){const i=[];for(let r=0,s=t.length;r!==s;++r){const o=t[r];o.id in e&&i.push(o)}return i}}function eh(n,t,e){const i=n.createShader(t);return n.shaderSource(i,e),n.compileShader(i),i}const py=37297;let my=0;function _y(n,t){const e=n.split(`
`),i=[],r=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let o=r;o<s;o++){const a=o+1;i.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return i.join(`
`)}const nh=new de;function gy(n){Ce._getMatrix(nh,Ce.workingColorSpace,n);const t=`mat3( ${nh.elements.map(e=>e.toFixed(4))} )`;switch(Ce.getTransfer(n)){case fa:return[t,"LinearTransferOETF"];case Ie:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[t,"LinearTransferOETF"]}}function ih(n,t,e){const i=n.getShaderParameter(t,n.COMPILE_STATUS),r=n.getShaderInfoLog(t).trim();if(i&&r==="")return"";const s=/ERROR: 0:(\d+)/.exec(r);if(s){const o=parseInt(s[1]);return e.toUpperCase()+`

`+r+`

`+_y(n.getShaderSource(t),o)}else return r}function vy(n,t){const e=gy(t);return[`vec4 ${n}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function xy(n,t){let e;switch(t){case av:e="Linear";break;case lv:e="Reinhard";break;case cv:e="Cineon";break;case uv:e="ACESFilmic";break;case hv:e="AgX";break;case dv:e="Neutral";break;case fv:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+n+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const Go=new j;function My(){Ce.getLuminanceCoefficients(Go);const n=Go.x.toFixed(4),t=Go.y.toFixed(4),e=Go.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Sy(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Fs).join(`
`)}function yy(n){const t=[];for(const e in n){const i=n[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function Ey(n,t){const e={},i=n.getProgramParameter(t,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(t,r),o=s.name;let a=1;s.type===n.FLOAT_MAT2&&(a=2),s.type===n.FLOAT_MAT3&&(a=3),s.type===n.FLOAT_MAT4&&(a=4),e[o]={type:s.type,location:n.getAttribLocation(t,o),locationSize:a}}return e}function Fs(n){return n!==""}function rh(n,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function sh(n,t){return n.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const by=/^[ \t]*#include +<([\w\d./]+)>/gm;function Uc(n){return n.replace(by,Ay)}const Ty=new Map;function Ay(n,t){let e=_e[t];if(e===void 0){const i=Ty.get(t);if(i!==void 0)e=_e[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return Uc(e)}const wy=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function oh(n){return n.replace(wy,Ry)}function Ry(n,t,e,i){let r="";for(let s=parseInt(t);s<parseInt(e);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function ah(n){let t=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?t+=`
#define HIGH_PRECISION`:n.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Cy(n){let t="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Ad?t="SHADOWMAP_TYPE_PCF":n.shadowMapType===Vg?t="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===yi&&(t="SHADOWMAP_TYPE_VSM"),t}function Py(n){let t="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case ds:case ps:t="ENVMAP_TYPE_CUBE";break;case La:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Dy(n){let t="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case ps:t="ENVMAP_MODE_REFRACTION";break}return t}function Ly(n){let t="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case wd:t="ENVMAP_BLENDING_MULTIPLY";break;case sv:t="ENVMAP_BLENDING_MIX";break;case ov:t="ENVMAP_BLENDING_ADD";break}return t}function Iy(n){const t=n.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:i,maxMip:e}}function Uy(n,t,e,i){const r=n.getContext(),s=e.defines;let o=e.vertexShader,a=e.fragmentShader;const l=Cy(e),c=Py(e),u=Dy(e),f=Ly(e),p=Iy(e),_=Sy(e),x=yy(s),M=r.createProgram();let g,m,L=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x].filter(Fs).join(`
`),g.length>0&&(g+=`
`),m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x].filter(Fs).join(`
`),m.length>0&&(m+=`
`)):(g=[ah(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Fs).join(`
`),m=[ah(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+f:"",p?"#define CUBEUV_TEXEL_WIDTH "+p.texelWidth:"",p?"#define CUBEUV_TEXEL_HEIGHT "+p.texelHeight:"",p?"#define CUBEUV_MAX_MIP "+p.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Ki?"#define TONE_MAPPING":"",e.toneMapping!==Ki?_e.tonemapping_pars_fragment:"",e.toneMapping!==Ki?xy("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",_e.colorspace_pars_fragment,vy("linearToOutputTexel",e.outputColorSpace),My(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Fs).join(`
`)),o=Uc(o),o=rh(o,e),o=sh(o,e),a=Uc(a),a=rh(a,e),a=sh(a,e),o=oh(o),a=oh(a),e.isRawShaderMaterial!==!0&&(L=`#version 300 es
`,g=[_,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,m=["#define varying in",e.glslVersion===hf?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===hf?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const R=L+g+o,S=L+m+a,V=eh(r,r.VERTEX_SHADER,R),C=eh(r,r.FRAGMENT_SHADER,S);r.attachShader(M,V),r.attachShader(M,C),e.index0AttributeName!==void 0?r.bindAttribLocation(M,0,e.index0AttributeName):e.morphTargets===!0&&r.bindAttribLocation(M,0,"position"),r.linkProgram(M);function I(O){if(n.debug.checkShaderErrors){const lt=r.getProgramInfoLog(M).trim(),Q=r.getShaderInfoLog(V).trim(),ht=r.getShaderInfoLog(C).trim();let St=!0,tt=!0;if(r.getProgramParameter(M,r.LINK_STATUS)===!1)if(St=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,M,V,C);else{const dt=ih(r,V,"vertex"),K=ih(r,C,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(M,r.VALIDATE_STATUS)+`

Material Name: `+O.name+`
Material Type: `+O.type+`

Program Info Log: `+lt+`
`+dt+`
`+K)}else lt!==""?console.warn("THREE.WebGLProgram: Program Info Log:",lt):(Q===""||ht==="")&&(tt=!1);tt&&(O.diagnostics={runnable:St,programLog:lt,vertexShader:{log:Q,prefix:g},fragmentShader:{log:ht,prefix:m}})}r.deleteShader(V),r.deleteShader(C),z=new ta(r,M),A=Ey(r,M)}let z;this.getUniforms=function(){return z===void 0&&I(this),z};let A;this.getAttributes=function(){return A===void 0&&I(this),A};let y=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return y===!1&&(y=r.getProgramParameter(M,py)),y},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(M),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=my++,this.cacheKey=t,this.usedTimes=1,this.program=M,this.vertexShader=V,this.fragmentShader=C,this}let Ny=0;class Fy{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,i=t.fragmentShader,r=this._getShaderStage(e),s=this._getShaderStage(i),o=this._getShaderCacheForMaterial(t);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){const e=this.shaderCache;let i=e.get(t);return i===void 0&&(i=new Oy(t),e.set(t,i)),i}}class Oy{constructor(t){this.id=Ny++,this.code=t,this.usedTimes=0}}function By(n,t,e,i,r,s,o){const a=new Wd,l=new Fy,c=new Set,u=[],f=r.logarithmicDepthBuffer,p=r.vertexTextures;let _=r.precision;const x={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function M(A){return c.add(A),A===0?"uv":`uv${A}`}function g(A,y,O,lt,Q){const ht=lt.fog,St=Q.geometry,tt=A.isMeshStandardMaterial?lt.environment:null,dt=(A.isMeshStandardMaterial?e:t).get(A.envMap||tt),K=dt&&dt.mapping===La?dt.image.height:null,Rt=x[A.type];A.precision!==null&&(_=r.getMaxPrecision(A.precision),_!==A.precision&&console.warn("THREE.WebGLProgram.getParameters:",A.precision,"not supported, using",_,"instead."));const Dt=St.morphAttributes.position||St.morphAttributes.normal||St.morphAttributes.color,Xt=Dt!==void 0?Dt.length:0;let te=0;St.morphAttributes.position!==void 0&&(te=1),St.morphAttributes.normal!==void 0&&(te=2),St.morphAttributes.color!==void 0&&(te=3);let Ae,_t,Ct,Gt;if(Rt){const we=ni[Rt];Ae=we.vertexShader,_t=we.fragmentShader}else Ae=A.vertexShader,_t=A.fragmentShader,l.update(A),Ct=l.getVertexShaderID(A),Gt=l.getFragmentShaderID(A);const Lt=n.getRenderTarget(),Qt=n.state.buffers.depth.getReversed(),ee=Q.isInstancedMesh===!0,me=Q.isBatchedMesh===!0,D=!!A.map,N=!!A.matcap,Y=!!dt,w=!!A.aoMap,pt=!!A.lightMap,rt=!!A.bumpMap,gt=!!A.normalMap,st=!!A.displacementMap,xt=!!A.emissiveMap,q=!!A.metalnessMap,T=!!A.roughnessMap,v=A.anisotropy>0,B=A.clearcoat>0,Z=A.dispersion>0,ot=A.iridescence>0,et=A.sheen>0,bt=A.transmission>0,Tt=v&&!!A.anisotropyMap,Et=B&&!!A.clearcoatMap,ne=B&&!!A.clearcoatNormalMap,ct=B&&!!A.clearcoatRoughnessMap,Ut=ot&&!!A.iridescenceMap,kt=ot&&!!A.iridescenceThicknessMap,qt=et&&!!A.sheenColorMap,It=et&&!!A.sheenRoughnessMap,ge=!!A.specularMap,ce=!!A.specularColorMap,De=!!A.specularIntensityMap,k=bt&&!!A.transmissionMap,Nt=bt&&!!A.thicknessMap,ut=!!A.gradientMap,Mt=!!A.alphaMap,Ft=A.alphaTest>0,Vt=!!A.alphaHash,oe=!!A.extensions;let Ne=Ki;A.toneMapped&&(Lt===null||Lt.isXRRenderTarget===!0)&&(Ne=n.toneMapping);const je={shaderID:Rt,shaderType:A.type,shaderName:A.name,vertexShader:Ae,fragmentShader:_t,defines:A.defines,customVertexShaderID:Ct,customFragmentShaderID:Gt,isRawShaderMaterial:A.isRawShaderMaterial===!0,glslVersion:A.glslVersion,precision:_,batching:me,batchingColor:me&&Q._colorsTexture!==null,instancing:ee,instancingColor:ee&&Q.instanceColor!==null,instancingMorph:ee&&Q.morphTexture!==null,supportsVertexTextures:p,outputColorSpace:Lt===null?n.outputColorSpace:Lt.isXRRenderTarget===!0?Lt.texture.colorSpace:gs,alphaToCoverage:!!A.alphaToCoverage,map:D,matcap:N,envMap:Y,envMapMode:Y&&dt.mapping,envMapCubeUVHeight:K,aoMap:w,lightMap:pt,bumpMap:rt,normalMap:gt,displacementMap:p&&st,emissiveMap:xt,normalMapObjectSpace:gt&&A.normalMapType===gv,normalMapTangentSpace:gt&&A.normalMapType===zd,metalnessMap:q,roughnessMap:T,anisotropy:v,anisotropyMap:Tt,clearcoat:B,clearcoatMap:Et,clearcoatNormalMap:ne,clearcoatRoughnessMap:ct,dispersion:Z,iridescence:ot,iridescenceMap:Ut,iridescenceThicknessMap:kt,sheen:et,sheenColorMap:qt,sheenRoughnessMap:It,specularMap:ge,specularColorMap:ce,specularIntensityMap:De,transmission:bt,transmissionMap:k,thicknessMap:Nt,gradientMap:ut,opaque:A.transparent===!1&&A.blending===os&&A.alphaToCoverage===!1,alphaMap:Mt,alphaTest:Ft,alphaHash:Vt,combine:A.combine,mapUv:D&&M(A.map.channel),aoMapUv:w&&M(A.aoMap.channel),lightMapUv:pt&&M(A.lightMap.channel),bumpMapUv:rt&&M(A.bumpMap.channel),normalMapUv:gt&&M(A.normalMap.channel),displacementMapUv:st&&M(A.displacementMap.channel),emissiveMapUv:xt&&M(A.emissiveMap.channel),metalnessMapUv:q&&M(A.metalnessMap.channel),roughnessMapUv:T&&M(A.roughnessMap.channel),anisotropyMapUv:Tt&&M(A.anisotropyMap.channel),clearcoatMapUv:Et&&M(A.clearcoatMap.channel),clearcoatNormalMapUv:ne&&M(A.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ct&&M(A.clearcoatRoughnessMap.channel),iridescenceMapUv:Ut&&M(A.iridescenceMap.channel),iridescenceThicknessMapUv:kt&&M(A.iridescenceThicknessMap.channel),sheenColorMapUv:qt&&M(A.sheenColorMap.channel),sheenRoughnessMapUv:It&&M(A.sheenRoughnessMap.channel),specularMapUv:ge&&M(A.specularMap.channel),specularColorMapUv:ce&&M(A.specularColorMap.channel),specularIntensityMapUv:De&&M(A.specularIntensityMap.channel),transmissionMapUv:k&&M(A.transmissionMap.channel),thicknessMapUv:Nt&&M(A.thicknessMap.channel),alphaMapUv:Mt&&M(A.alphaMap.channel),vertexTangents:!!St.attributes.tangent&&(gt||v),vertexColors:A.vertexColors,vertexAlphas:A.vertexColors===!0&&!!St.attributes.color&&St.attributes.color.itemSize===4,pointsUvs:Q.isPoints===!0&&!!St.attributes.uv&&(D||Mt),fog:!!ht,useFog:A.fog===!0,fogExp2:!!ht&&ht.isFogExp2,flatShading:A.flatShading===!0,sizeAttenuation:A.sizeAttenuation===!0,logarithmicDepthBuffer:f,reverseDepthBuffer:Qt,skinning:Q.isSkinnedMesh===!0,morphTargets:St.morphAttributes.position!==void 0,morphNormals:St.morphAttributes.normal!==void 0,morphColors:St.morphAttributes.color!==void 0,morphTargetsCount:Xt,morphTextureStride:te,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:A.dithering,shadowMapEnabled:n.shadowMap.enabled&&O.length>0,shadowMapType:n.shadowMap.type,toneMapping:Ne,decodeVideoTexture:D&&A.map.isVideoTexture===!0&&Ce.getTransfer(A.map.colorSpace)===Ie,decodeVideoTextureEmissive:xt&&A.emissiveMap.isVideoTexture===!0&&Ce.getTransfer(A.emissiveMap.colorSpace)===Ie,premultipliedAlpha:A.premultipliedAlpha,doubleSided:A.side===Ln,flipSided:A.side===En,useDepthPacking:A.depthPacking>=0,depthPacking:A.depthPacking||0,index0AttributeName:A.index0AttributeName,extensionClipCullDistance:oe&&A.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(oe&&A.extensions.multiDraw===!0||me)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:A.customProgramCacheKey()};return je.vertexUv1s=c.has(1),je.vertexUv2s=c.has(2),je.vertexUv3s=c.has(3),c.clear(),je}function m(A){const y=[];if(A.shaderID?y.push(A.shaderID):(y.push(A.customVertexShaderID),y.push(A.customFragmentShaderID)),A.defines!==void 0)for(const O in A.defines)y.push(O),y.push(A.defines[O]);return A.isRawShaderMaterial===!1&&(L(y,A),R(y,A),y.push(n.outputColorSpace)),y.push(A.customProgramCacheKey),y.join()}function L(A,y){A.push(y.precision),A.push(y.outputColorSpace),A.push(y.envMapMode),A.push(y.envMapCubeUVHeight),A.push(y.mapUv),A.push(y.alphaMapUv),A.push(y.lightMapUv),A.push(y.aoMapUv),A.push(y.bumpMapUv),A.push(y.normalMapUv),A.push(y.displacementMapUv),A.push(y.emissiveMapUv),A.push(y.metalnessMapUv),A.push(y.roughnessMapUv),A.push(y.anisotropyMapUv),A.push(y.clearcoatMapUv),A.push(y.clearcoatNormalMapUv),A.push(y.clearcoatRoughnessMapUv),A.push(y.iridescenceMapUv),A.push(y.iridescenceThicknessMapUv),A.push(y.sheenColorMapUv),A.push(y.sheenRoughnessMapUv),A.push(y.specularMapUv),A.push(y.specularColorMapUv),A.push(y.specularIntensityMapUv),A.push(y.transmissionMapUv),A.push(y.thicknessMapUv),A.push(y.combine),A.push(y.fogExp2),A.push(y.sizeAttenuation),A.push(y.morphTargetsCount),A.push(y.morphAttributeCount),A.push(y.numDirLights),A.push(y.numPointLights),A.push(y.numSpotLights),A.push(y.numSpotLightMaps),A.push(y.numHemiLights),A.push(y.numRectAreaLights),A.push(y.numDirLightShadows),A.push(y.numPointLightShadows),A.push(y.numSpotLightShadows),A.push(y.numSpotLightShadowsWithMaps),A.push(y.numLightProbes),A.push(y.shadowMapType),A.push(y.toneMapping),A.push(y.numClippingPlanes),A.push(y.numClipIntersection),A.push(y.depthPacking)}function R(A,y){a.disableAll(),y.supportsVertexTextures&&a.enable(0),y.instancing&&a.enable(1),y.instancingColor&&a.enable(2),y.instancingMorph&&a.enable(3),y.matcap&&a.enable(4),y.envMap&&a.enable(5),y.normalMapObjectSpace&&a.enable(6),y.normalMapTangentSpace&&a.enable(7),y.clearcoat&&a.enable(8),y.iridescence&&a.enable(9),y.alphaTest&&a.enable(10),y.vertexColors&&a.enable(11),y.vertexAlphas&&a.enable(12),y.vertexUv1s&&a.enable(13),y.vertexUv2s&&a.enable(14),y.vertexUv3s&&a.enable(15),y.vertexTangents&&a.enable(16),y.anisotropy&&a.enable(17),y.alphaHash&&a.enable(18),y.batching&&a.enable(19),y.dispersion&&a.enable(20),y.batchingColor&&a.enable(21),A.push(a.mask),a.disableAll(),y.fog&&a.enable(0),y.useFog&&a.enable(1),y.flatShading&&a.enable(2),y.logarithmicDepthBuffer&&a.enable(3),y.reverseDepthBuffer&&a.enable(4),y.skinning&&a.enable(5),y.morphTargets&&a.enable(6),y.morphNormals&&a.enable(7),y.morphColors&&a.enable(8),y.premultipliedAlpha&&a.enable(9),y.shadowMapEnabled&&a.enable(10),y.doubleSided&&a.enable(11),y.flipSided&&a.enable(12),y.useDepthPacking&&a.enable(13),y.dithering&&a.enable(14),y.transmission&&a.enable(15),y.sheen&&a.enable(16),y.opaque&&a.enable(17),y.pointsUvs&&a.enable(18),y.decodeVideoTexture&&a.enable(19),y.decodeVideoTextureEmissive&&a.enable(20),y.alphaToCoverage&&a.enable(21),A.push(a.mask)}function S(A){const y=x[A.type];let O;if(y){const lt=ni[y];O=l0.clone(lt.uniforms)}else O=A.uniforms;return O}function V(A,y){let O;for(let lt=0,Q=u.length;lt<Q;lt++){const ht=u[lt];if(ht.cacheKey===y){O=ht,++O.usedTimes;break}}return O===void 0&&(O=new Uy(n,y,A,s),u.push(O)),O}function C(A){if(--A.usedTimes===0){const y=u.indexOf(A);u[y]=u[u.length-1],u.pop(),A.destroy()}}function I(A){l.remove(A)}function z(){l.dispose()}return{getParameters:g,getProgramCacheKey:m,getUniforms:S,acquireProgram:V,releaseProgram:C,releaseShaderCache:I,programs:u,dispose:z}}function zy(){let n=new WeakMap;function t(o){return n.has(o)}function e(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function r(o,a,l){n.get(o)[a]=l}function s(){n=new WeakMap}return{has:t,get:e,remove:i,update:r,dispose:s}}function Vy(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.material.id!==t.material.id?n.material.id-t.material.id:n.z!==t.z?n.z-t.z:n.id-t.id}function lh(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.z!==t.z?t.z-n.z:n.id-t.id}function ch(){const n=[];let t=0;const e=[],i=[],r=[];function s(){t=0,e.length=0,i.length=0,r.length=0}function o(f,p,_,x,M,g){let m=n[t];return m===void 0?(m={id:f.id,object:f,geometry:p,material:_,groupOrder:x,renderOrder:f.renderOrder,z:M,group:g},n[t]=m):(m.id=f.id,m.object=f,m.geometry=p,m.material=_,m.groupOrder=x,m.renderOrder=f.renderOrder,m.z=M,m.group=g),t++,m}function a(f,p,_,x,M,g){const m=o(f,p,_,x,M,g);_.transmission>0?i.push(m):_.transparent===!0?r.push(m):e.push(m)}function l(f,p,_,x,M,g){const m=o(f,p,_,x,M,g);_.transmission>0?i.unshift(m):_.transparent===!0?r.unshift(m):e.unshift(m)}function c(f,p){e.length>1&&e.sort(f||Vy),i.length>1&&i.sort(p||lh),r.length>1&&r.sort(p||lh)}function u(){for(let f=t,p=n.length;f<p;f++){const _=n[f];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:e,transmissive:i,transparent:r,init:s,push:a,unshift:l,finish:u,sort:c}}function Hy(){let n=new WeakMap;function t(i,r){const s=n.get(i);let o;return s===void 0?(o=new ch,n.set(i,[o])):r>=s.length?(o=new ch,s.push(o)):o=s[r],o}function e(){n=new WeakMap}return{get:t,dispose:e}}function ky(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new j,color:new xe};break;case"SpotLight":e={position:new j,direction:new j,color:new xe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new j,color:new xe,distance:0,decay:0};break;case"HemisphereLight":e={direction:new j,skyColor:new xe,groundColor:new xe};break;case"RectAreaLight":e={color:new xe,position:new j,halfWidth:new j,halfHeight:new j};break}return n[t.id]=e,e}}}function Gy(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new pe};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new pe};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new pe,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[t.id]=e,e}}}let Wy=0;function Xy(n,t){return(t.castShadow?2:0)-(n.castShadow?2:0)+(t.map?1:0)-(n.map?1:0)}function $y(n){const t=new ky,e=Gy(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new j);const r=new j,s=new We,o=new We;function a(c){let u=0,f=0,p=0;for(let A=0;A<9;A++)i.probe[A].set(0,0,0);let _=0,x=0,M=0,g=0,m=0,L=0,R=0,S=0,V=0,C=0,I=0;c.sort(Xy);for(let A=0,y=c.length;A<y;A++){const O=c[A],lt=O.color,Q=O.intensity,ht=O.distance,St=O.shadow&&O.shadow.map?O.shadow.map.texture:null;if(O.isAmbientLight)u+=lt.r*Q,f+=lt.g*Q,p+=lt.b*Q;else if(O.isLightProbe){for(let tt=0;tt<9;tt++)i.probe[tt].addScaledVector(O.sh.coefficients[tt],Q);I++}else if(O.isDirectionalLight){const tt=t.get(O);if(tt.color.copy(O.color).multiplyScalar(O.intensity),O.castShadow){const dt=O.shadow,K=e.get(O);K.shadowIntensity=dt.intensity,K.shadowBias=dt.bias,K.shadowNormalBias=dt.normalBias,K.shadowRadius=dt.radius,K.shadowMapSize=dt.mapSize,i.directionalShadow[_]=K,i.directionalShadowMap[_]=St,i.directionalShadowMatrix[_]=O.shadow.matrix,L++}i.directional[_]=tt,_++}else if(O.isSpotLight){const tt=t.get(O);tt.position.setFromMatrixPosition(O.matrixWorld),tt.color.copy(lt).multiplyScalar(Q),tt.distance=ht,tt.coneCos=Math.cos(O.angle),tt.penumbraCos=Math.cos(O.angle*(1-O.penumbra)),tt.decay=O.decay,i.spot[M]=tt;const dt=O.shadow;if(O.map&&(i.spotLightMap[V]=O.map,V++,dt.updateMatrices(O),O.castShadow&&C++),i.spotLightMatrix[M]=dt.matrix,O.castShadow){const K=e.get(O);K.shadowIntensity=dt.intensity,K.shadowBias=dt.bias,K.shadowNormalBias=dt.normalBias,K.shadowRadius=dt.radius,K.shadowMapSize=dt.mapSize,i.spotShadow[M]=K,i.spotShadowMap[M]=St,S++}M++}else if(O.isRectAreaLight){const tt=t.get(O);tt.color.copy(lt).multiplyScalar(Q),tt.halfWidth.set(O.width*.5,0,0),tt.halfHeight.set(0,O.height*.5,0),i.rectArea[g]=tt,g++}else if(O.isPointLight){const tt=t.get(O);if(tt.color.copy(O.color).multiplyScalar(O.intensity),tt.distance=O.distance,tt.decay=O.decay,O.castShadow){const dt=O.shadow,K=e.get(O);K.shadowIntensity=dt.intensity,K.shadowBias=dt.bias,K.shadowNormalBias=dt.normalBias,K.shadowRadius=dt.radius,K.shadowMapSize=dt.mapSize,K.shadowCameraNear=dt.camera.near,K.shadowCameraFar=dt.camera.far,i.pointShadow[x]=K,i.pointShadowMap[x]=St,i.pointShadowMatrix[x]=O.shadow.matrix,R++}i.point[x]=tt,x++}else if(O.isHemisphereLight){const tt=t.get(O);tt.skyColor.copy(O.color).multiplyScalar(Q),tt.groundColor.copy(O.groundColor).multiplyScalar(Q),i.hemi[m]=tt,m++}}g>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Bt.LTC_FLOAT_1,i.rectAreaLTC2=Bt.LTC_FLOAT_2):(i.rectAreaLTC1=Bt.LTC_HALF_1,i.rectAreaLTC2=Bt.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=f,i.ambient[2]=p;const z=i.hash;(z.directionalLength!==_||z.pointLength!==x||z.spotLength!==M||z.rectAreaLength!==g||z.hemiLength!==m||z.numDirectionalShadows!==L||z.numPointShadows!==R||z.numSpotShadows!==S||z.numSpotMaps!==V||z.numLightProbes!==I)&&(i.directional.length=_,i.spot.length=M,i.rectArea.length=g,i.point.length=x,i.hemi.length=m,i.directionalShadow.length=L,i.directionalShadowMap.length=L,i.pointShadow.length=R,i.pointShadowMap.length=R,i.spotShadow.length=S,i.spotShadowMap.length=S,i.directionalShadowMatrix.length=L,i.pointShadowMatrix.length=R,i.spotLightMatrix.length=S+V-C,i.spotLightMap.length=V,i.numSpotLightShadowsWithMaps=C,i.numLightProbes=I,z.directionalLength=_,z.pointLength=x,z.spotLength=M,z.rectAreaLength=g,z.hemiLength=m,z.numDirectionalShadows=L,z.numPointShadows=R,z.numSpotShadows=S,z.numSpotMaps=V,z.numLightProbes=I,i.version=Wy++)}function l(c,u){let f=0,p=0,_=0,x=0,M=0;const g=u.matrixWorldInverse;for(let m=0,L=c.length;m<L;m++){const R=c[m];if(R.isDirectionalLight){const S=i.directional[f];S.direction.setFromMatrixPosition(R.matrixWorld),r.setFromMatrixPosition(R.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(g),f++}else if(R.isSpotLight){const S=i.spot[_];S.position.setFromMatrixPosition(R.matrixWorld),S.position.applyMatrix4(g),S.direction.setFromMatrixPosition(R.matrixWorld),r.setFromMatrixPosition(R.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(g),_++}else if(R.isRectAreaLight){const S=i.rectArea[x];S.position.setFromMatrixPosition(R.matrixWorld),S.position.applyMatrix4(g),o.identity(),s.copy(R.matrixWorld),s.premultiply(g),o.extractRotation(s),S.halfWidth.set(R.width*.5,0,0),S.halfHeight.set(0,R.height*.5,0),S.halfWidth.applyMatrix4(o),S.halfHeight.applyMatrix4(o),x++}else if(R.isPointLight){const S=i.point[p];S.position.setFromMatrixPosition(R.matrixWorld),S.position.applyMatrix4(g),p++}else if(R.isHemisphereLight){const S=i.hemi[M];S.direction.setFromMatrixPosition(R.matrixWorld),S.direction.transformDirection(g),M++}}}return{setup:a,setupView:l,state:i}}function uh(n){const t=new $y(n),e=[],i=[];function r(u){c.camera=u,e.length=0,i.length=0}function s(u){e.push(u)}function o(u){i.push(u)}function a(){t.setup(e)}function l(u){t.setupView(e,u)}const c={lightsArray:e,shadowsArray:i,camera:null,lights:t,transmissionRenderTarget:{}};return{init:r,state:c,setupLights:a,setupLightsView:l,pushLight:s,pushShadow:o}}function Yy(n){let t=new WeakMap;function e(r,s=0){const o=t.get(r);let a;return o===void 0?(a=new uh(n),t.set(r,[a])):s>=o.length?(a=new uh(n),o.push(a)):a=o[s],a}function i(){t=new WeakMap}return{get:e,dispose:i}}const qy=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,jy=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Ky(n,t,e){let i=new fu;const r=new pe,s=new pe,o=new $e,a=new v0({depthPacking:_v}),l=new x0,c={},u=e.maxTextureSize,f={[Zi]:En,[En]:Zi,[Ln]:Ln},p=new Ji({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new pe},radius:{value:4}},vertexShader:qy,fragmentShader:jy}),_=p.clone();_.defines.HORIZONTAL_PASS=1;const x=new vn;x.setAttribute("position",new Fn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const M=new Un(x,p),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ad;let m=this.type;this.render=function(C,I,z){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||C.length===0)return;const A=n.getRenderTarget(),y=n.getActiveCubeFace(),O=n.getActiveMipmapLevel(),lt=n.state;lt.setBlending(ji),lt.buffers.color.setClear(1,1,1,1),lt.buffers.depth.setTest(!0),lt.setScissorTest(!1);const Q=m!==yi&&this.type===yi,ht=m===yi&&this.type!==yi;for(let St=0,tt=C.length;St<tt;St++){const dt=C[St],K=dt.shadow;if(K===void 0){console.warn("THREE.WebGLShadowMap:",dt,"has no shadow.");continue}if(K.autoUpdate===!1&&K.needsUpdate===!1)continue;r.copy(K.mapSize);const Rt=K.getFrameExtents();if(r.multiply(Rt),s.copy(K.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/Rt.x),r.x=s.x*Rt.x,K.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/Rt.y),r.y=s.y*Rt.y,K.mapSize.y=s.y)),K.map===null||Q===!0||ht===!0){const Xt=this.type!==yi?{minFilter:Yn,magFilter:Yn}:{};K.map!==null&&K.map.dispose(),K.map=new Pr(r.x,r.y,Xt),K.map.texture.name=dt.name+".shadowMap",K.camera.updateProjectionMatrix()}n.setRenderTarget(K.map),n.clear();const Dt=K.getViewportCount();for(let Xt=0;Xt<Dt;Xt++){const te=K.getViewport(Xt);o.set(s.x*te.x,s.y*te.y,s.x*te.z,s.y*te.w),lt.viewport(o),K.updateMatrices(dt,Xt),i=K.getFrustum(),S(I,z,K.camera,dt,this.type)}K.isPointLightShadow!==!0&&this.type===yi&&L(K,z),K.needsUpdate=!1}m=this.type,g.needsUpdate=!1,n.setRenderTarget(A,y,O)};function L(C,I){const z=t.update(M);p.defines.VSM_SAMPLES!==C.blurSamples&&(p.defines.VSM_SAMPLES=C.blurSamples,_.defines.VSM_SAMPLES=C.blurSamples,p.needsUpdate=!0,_.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new Pr(r.x,r.y)),p.uniforms.shadow_pass.value=C.map.texture,p.uniforms.resolution.value=C.mapSize,p.uniforms.radius.value=C.radius,n.setRenderTarget(C.mapPass),n.clear(),n.renderBufferDirect(I,null,z,p,M,null),_.uniforms.shadow_pass.value=C.mapPass.texture,_.uniforms.resolution.value=C.mapSize,_.uniforms.radius.value=C.radius,n.setRenderTarget(C.map),n.clear(),n.renderBufferDirect(I,null,z,_,M,null)}function R(C,I,z,A){let y=null;const O=z.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(O!==void 0)y=O;else if(y=z.isPointLight===!0?l:a,n.localClippingEnabled&&I.clipShadows===!0&&Array.isArray(I.clippingPlanes)&&I.clippingPlanes.length!==0||I.displacementMap&&I.displacementScale!==0||I.alphaMap&&I.alphaTest>0||I.map&&I.alphaTest>0){const lt=y.uuid,Q=I.uuid;let ht=c[lt];ht===void 0&&(ht={},c[lt]=ht);let St=ht[Q];St===void 0&&(St=y.clone(),ht[Q]=St,I.addEventListener("dispose",V)),y=St}if(y.visible=I.visible,y.wireframe=I.wireframe,A===yi?y.side=I.shadowSide!==null?I.shadowSide:I.side:y.side=I.shadowSide!==null?I.shadowSide:f[I.side],y.alphaMap=I.alphaMap,y.alphaTest=I.alphaTest,y.map=I.map,y.clipShadows=I.clipShadows,y.clippingPlanes=I.clippingPlanes,y.clipIntersection=I.clipIntersection,y.displacementMap=I.displacementMap,y.displacementScale=I.displacementScale,y.displacementBias=I.displacementBias,y.wireframeLinewidth=I.wireframeLinewidth,y.linewidth=I.linewidth,z.isPointLight===!0&&y.isMeshDistanceMaterial===!0){const lt=n.properties.get(y);lt.light=z}return y}function S(C,I,z,A,y){if(C.visible===!1)return;if(C.layers.test(I.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&y===yi)&&(!C.frustumCulled||i.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(z.matrixWorldInverse,C.matrixWorld);const Q=t.update(C),ht=C.material;if(Array.isArray(ht)){const St=Q.groups;for(let tt=0,dt=St.length;tt<dt;tt++){const K=St[tt],Rt=ht[K.materialIndex];if(Rt&&Rt.visible){const Dt=R(C,Rt,A,y);C.onBeforeShadow(n,C,I,z,Q,Dt,K),n.renderBufferDirect(z,null,Q,Dt,C,K),C.onAfterShadow(n,C,I,z,Q,Dt,K)}}}else if(ht.visible){const St=R(C,ht,A,y);C.onBeforeShadow(n,C,I,z,Q,St,null),n.renderBufferDirect(z,null,Q,St,C,null),C.onAfterShadow(n,C,I,z,Q,St,null)}}const lt=C.children;for(let Q=0,ht=lt.length;Q<ht;Q++)S(lt[Q],I,z,A,y)}function V(C){C.target.removeEventListener("dispose",V);for(const z in c){const A=c[z],y=C.target.uuid;y in A&&(A[y].dispose(),delete A[y])}}}const Zy={[Kl]:Zl,[Jl]:ec,[Ql]:nc,[hs]:tc,[Zl]:Kl,[ec]:Jl,[nc]:Ql,[tc]:hs};function Jy(n,t){function e(){let k=!1;const Nt=new $e;let ut=null;const Mt=new $e(0,0,0,0);return{setMask:function(Ft){ut!==Ft&&!k&&(n.colorMask(Ft,Ft,Ft,Ft),ut=Ft)},setLocked:function(Ft){k=Ft},setClear:function(Ft,Vt,oe,Ne,je){je===!0&&(Ft*=Ne,Vt*=Ne,oe*=Ne),Nt.set(Ft,Vt,oe,Ne),Mt.equals(Nt)===!1&&(n.clearColor(Ft,Vt,oe,Ne),Mt.copy(Nt))},reset:function(){k=!1,ut=null,Mt.set(-1,0,0,0)}}}function i(){let k=!1,Nt=!1,ut=null,Mt=null,Ft=null;return{setReversed:function(Vt){if(Nt!==Vt){const oe=t.get("EXT_clip_control");Nt?oe.clipControlEXT(oe.LOWER_LEFT_EXT,oe.ZERO_TO_ONE_EXT):oe.clipControlEXT(oe.LOWER_LEFT_EXT,oe.NEGATIVE_ONE_TO_ONE_EXT);const Ne=Ft;Ft=null,this.setClear(Ne)}Nt=Vt},getReversed:function(){return Nt},setTest:function(Vt){Vt?Lt(n.DEPTH_TEST):Qt(n.DEPTH_TEST)},setMask:function(Vt){ut!==Vt&&!k&&(n.depthMask(Vt),ut=Vt)},setFunc:function(Vt){if(Nt&&(Vt=Zy[Vt]),Mt!==Vt){switch(Vt){case Kl:n.depthFunc(n.NEVER);break;case Zl:n.depthFunc(n.ALWAYS);break;case Jl:n.depthFunc(n.LESS);break;case hs:n.depthFunc(n.LEQUAL);break;case Ql:n.depthFunc(n.EQUAL);break;case tc:n.depthFunc(n.GEQUAL);break;case ec:n.depthFunc(n.GREATER);break;case nc:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}Mt=Vt}},setLocked:function(Vt){k=Vt},setClear:function(Vt){Ft!==Vt&&(Nt&&(Vt=1-Vt),n.clearDepth(Vt),Ft=Vt)},reset:function(){k=!1,ut=null,Mt=null,Ft=null,Nt=!1}}}function r(){let k=!1,Nt=null,ut=null,Mt=null,Ft=null,Vt=null,oe=null,Ne=null,je=null;return{setTest:function(we){k||(we?Lt(n.STENCIL_TEST):Qt(n.STENCIL_TEST))},setMask:function(we){Nt!==we&&!k&&(n.stencilMask(we),Nt=we)},setFunc:function(we,en,On){(ut!==we||Mt!==en||Ft!==On)&&(n.stencilFunc(we,en,On),ut=we,Mt=en,Ft=On)},setOp:function(we,en,On){(Vt!==we||oe!==en||Ne!==On)&&(n.stencilOp(we,en,On),Vt=we,oe=en,Ne=On)},setLocked:function(we){k=we},setClear:function(we){je!==we&&(n.clearStencil(we),je=we)},reset:function(){k=!1,Nt=null,ut=null,Mt=null,Ft=null,Vt=null,oe=null,Ne=null,je=null}}}const s=new e,o=new i,a=new r,l=new WeakMap,c=new WeakMap;let u={},f={},p=new WeakMap,_=[],x=null,M=!1,g=null,m=null,L=null,R=null,S=null,V=null,C=null,I=new xe(0,0,0),z=0,A=!1,y=null,O=null,lt=null,Q=null,ht=null;const St=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let tt=!1,dt=0;const K=n.getParameter(n.VERSION);K.indexOf("WebGL")!==-1?(dt=parseFloat(/^WebGL (\d)/.exec(K)[1]),tt=dt>=1):K.indexOf("OpenGL ES")!==-1&&(dt=parseFloat(/^OpenGL ES (\d)/.exec(K)[1]),tt=dt>=2);let Rt=null,Dt={};const Xt=n.getParameter(n.SCISSOR_BOX),te=n.getParameter(n.VIEWPORT),Ae=new $e().fromArray(Xt),_t=new $e().fromArray(te);function Ct(k,Nt,ut,Mt){const Ft=new Uint8Array(4),Vt=n.createTexture();n.bindTexture(k,Vt),n.texParameteri(k,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(k,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let oe=0;oe<ut;oe++)k===n.TEXTURE_3D||k===n.TEXTURE_2D_ARRAY?n.texImage3D(Nt,0,n.RGBA,1,1,Mt,0,n.RGBA,n.UNSIGNED_BYTE,Ft):n.texImage2D(Nt+oe,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Ft);return Vt}const Gt={};Gt[n.TEXTURE_2D]=Ct(n.TEXTURE_2D,n.TEXTURE_2D,1),Gt[n.TEXTURE_CUBE_MAP]=Ct(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),Gt[n.TEXTURE_2D_ARRAY]=Ct(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Gt[n.TEXTURE_3D]=Ct(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),Lt(n.DEPTH_TEST),o.setFunc(hs),rt(!1),gt(of),Lt(n.CULL_FACE),w(ji);function Lt(k){u[k]!==!0&&(n.enable(k),u[k]=!0)}function Qt(k){u[k]!==!1&&(n.disable(k),u[k]=!1)}function ee(k,Nt){return f[k]!==Nt?(n.bindFramebuffer(k,Nt),f[k]=Nt,k===n.DRAW_FRAMEBUFFER&&(f[n.FRAMEBUFFER]=Nt),k===n.FRAMEBUFFER&&(f[n.DRAW_FRAMEBUFFER]=Nt),!0):!1}function me(k,Nt){let ut=_,Mt=!1;if(k){ut=p.get(Nt),ut===void 0&&(ut=[],p.set(Nt,ut));const Ft=k.textures;if(ut.length!==Ft.length||ut[0]!==n.COLOR_ATTACHMENT0){for(let Vt=0,oe=Ft.length;Vt<oe;Vt++)ut[Vt]=n.COLOR_ATTACHMENT0+Vt;ut.length=Ft.length,Mt=!0}}else ut[0]!==n.BACK&&(ut[0]=n.BACK,Mt=!0);Mt&&n.drawBuffers(ut)}function D(k){return x!==k?(n.useProgram(k),x=k,!0):!1}const N={[gr]:n.FUNC_ADD,[kg]:n.FUNC_SUBTRACT,[Gg]:n.FUNC_REVERSE_SUBTRACT};N[Wg]=n.MIN,N[Xg]=n.MAX;const Y={[$g]:n.ZERO,[Yg]:n.ONE,[qg]:n.SRC_COLOR,[ql]:n.SRC_ALPHA,[tv]:n.SRC_ALPHA_SATURATE,[Jg]:n.DST_COLOR,[Kg]:n.DST_ALPHA,[jg]:n.ONE_MINUS_SRC_COLOR,[jl]:n.ONE_MINUS_SRC_ALPHA,[Qg]:n.ONE_MINUS_DST_COLOR,[Zg]:n.ONE_MINUS_DST_ALPHA,[ev]:n.CONSTANT_COLOR,[nv]:n.ONE_MINUS_CONSTANT_COLOR,[iv]:n.CONSTANT_ALPHA,[rv]:n.ONE_MINUS_CONSTANT_ALPHA};function w(k,Nt,ut,Mt,Ft,Vt,oe,Ne,je,we){if(k===ji){M===!0&&(Qt(n.BLEND),M=!1);return}if(M===!1&&(Lt(n.BLEND),M=!0),k!==Hg){if(k!==g||we!==A){if((m!==gr||S!==gr)&&(n.blendEquation(n.FUNC_ADD),m=gr,S=gr),we)switch(k){case os:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case af:n.blendFunc(n.ONE,n.ONE);break;case lf:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case cf:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",k);break}else switch(k){case os:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case af:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case lf:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case cf:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",k);break}L=null,R=null,V=null,C=null,I.set(0,0,0),z=0,g=k,A=we}return}Ft=Ft||Nt,Vt=Vt||ut,oe=oe||Mt,(Nt!==m||Ft!==S)&&(n.blendEquationSeparate(N[Nt],N[Ft]),m=Nt,S=Ft),(ut!==L||Mt!==R||Vt!==V||oe!==C)&&(n.blendFuncSeparate(Y[ut],Y[Mt],Y[Vt],Y[oe]),L=ut,R=Mt,V=Vt,C=oe),(Ne.equals(I)===!1||je!==z)&&(n.blendColor(Ne.r,Ne.g,Ne.b,je),I.copy(Ne),z=je),g=k,A=!1}function pt(k,Nt){k.side===Ln?Qt(n.CULL_FACE):Lt(n.CULL_FACE);let ut=k.side===En;Nt&&(ut=!ut),rt(ut),k.blending===os&&k.transparent===!1?w(ji):w(k.blending,k.blendEquation,k.blendSrc,k.blendDst,k.blendEquationAlpha,k.blendSrcAlpha,k.blendDstAlpha,k.blendColor,k.blendAlpha,k.premultipliedAlpha),o.setFunc(k.depthFunc),o.setTest(k.depthTest),o.setMask(k.depthWrite),s.setMask(k.colorWrite);const Mt=k.stencilWrite;a.setTest(Mt),Mt&&(a.setMask(k.stencilWriteMask),a.setFunc(k.stencilFunc,k.stencilRef,k.stencilFuncMask),a.setOp(k.stencilFail,k.stencilZFail,k.stencilZPass)),xt(k.polygonOffset,k.polygonOffsetFactor,k.polygonOffsetUnits),k.alphaToCoverage===!0?Lt(n.SAMPLE_ALPHA_TO_COVERAGE):Qt(n.SAMPLE_ALPHA_TO_COVERAGE)}function rt(k){y!==k&&(k?n.frontFace(n.CW):n.frontFace(n.CCW),y=k)}function gt(k){k!==Bg?(Lt(n.CULL_FACE),k!==O&&(k===of?n.cullFace(n.BACK):k===zg?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Qt(n.CULL_FACE),O=k}function st(k){k!==lt&&(tt&&n.lineWidth(k),lt=k)}function xt(k,Nt,ut){k?(Lt(n.POLYGON_OFFSET_FILL),(Q!==Nt||ht!==ut)&&(n.polygonOffset(Nt,ut),Q=Nt,ht=ut)):Qt(n.POLYGON_OFFSET_FILL)}function q(k){k?Lt(n.SCISSOR_TEST):Qt(n.SCISSOR_TEST)}function T(k){k===void 0&&(k=n.TEXTURE0+St-1),Rt!==k&&(n.activeTexture(k),Rt=k)}function v(k,Nt,ut){ut===void 0&&(Rt===null?ut=n.TEXTURE0+St-1:ut=Rt);let Mt=Dt[ut];Mt===void 0&&(Mt={type:void 0,texture:void 0},Dt[ut]=Mt),(Mt.type!==k||Mt.texture!==Nt)&&(Rt!==ut&&(n.activeTexture(ut),Rt=ut),n.bindTexture(k,Nt||Gt[k]),Mt.type=k,Mt.texture=Nt)}function B(){const k=Dt[Rt];k!==void 0&&k.type!==void 0&&(n.bindTexture(k.type,null),k.type=void 0,k.texture=void 0)}function Z(){try{n.compressedTexImage2D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function ot(){try{n.compressedTexImage3D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function et(){try{n.texSubImage2D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function bt(){try{n.texSubImage3D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Tt(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Et(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function ne(){try{n.texStorage2D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function ct(){try{n.texStorage3D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Ut(){try{n.texImage2D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function kt(){try{n.texImage3D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function qt(k){Ae.equals(k)===!1&&(n.scissor(k.x,k.y,k.z,k.w),Ae.copy(k))}function It(k){_t.equals(k)===!1&&(n.viewport(k.x,k.y,k.z,k.w),_t.copy(k))}function ge(k,Nt){let ut=c.get(Nt);ut===void 0&&(ut=new WeakMap,c.set(Nt,ut));let Mt=ut.get(k);Mt===void 0&&(Mt=n.getUniformBlockIndex(Nt,k.name),ut.set(k,Mt))}function ce(k,Nt){const Mt=c.get(Nt).get(k);l.get(Nt)!==Mt&&(n.uniformBlockBinding(Nt,Mt,k.__bindingPointIndex),l.set(Nt,Mt))}function De(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),u={},Rt=null,Dt={},f={},p=new WeakMap,_=[],x=null,M=!1,g=null,m=null,L=null,R=null,S=null,V=null,C=null,I=new xe(0,0,0),z=0,A=!1,y=null,O=null,lt=null,Q=null,ht=null,Ae.set(0,0,n.canvas.width,n.canvas.height),_t.set(0,0,n.canvas.width,n.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:Lt,disable:Qt,bindFramebuffer:ee,drawBuffers:me,useProgram:D,setBlending:w,setMaterial:pt,setFlipSided:rt,setCullFace:gt,setLineWidth:st,setPolygonOffset:xt,setScissorTest:q,activeTexture:T,bindTexture:v,unbindTexture:B,compressedTexImage2D:Z,compressedTexImage3D:ot,texImage2D:Ut,texImage3D:kt,updateUBOMapping:ge,uniformBlockBinding:ce,texStorage2D:ne,texStorage3D:ct,texSubImage2D:et,texSubImage3D:bt,compressedTexSubImage2D:Tt,compressedTexSubImage3D:Et,scissor:qt,viewport:It,reset:De}}function Qy(n,t,e,i,r,s,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new pe,u=new WeakMap;let f;const p=new WeakMap;let _=!1;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function x(T,v){return _?new OffscreenCanvas(T,v):da("canvas")}function M(T,v,B){let Z=1;const ot=q(T);if((ot.width>B||ot.height>B)&&(Z=B/Math.max(ot.width,ot.height)),Z<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){const et=Math.floor(Z*ot.width),bt=Math.floor(Z*ot.height);f===void 0&&(f=x(et,bt));const Tt=v?x(et,bt):f;return Tt.width=et,Tt.height=bt,Tt.getContext("2d").drawImage(T,0,0,et,bt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+ot.width+"x"+ot.height+") to ("+et+"x"+bt+")."),Tt}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+ot.width+"x"+ot.height+")."),T;return T}function g(T){return T.generateMipmaps}function m(T){n.generateMipmap(T)}function L(T){return T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?n.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function R(T,v,B,Z,ot=!1){if(T!==null){if(n[T]!==void 0)return n[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let et=v;if(v===n.RED&&(B===n.FLOAT&&(et=n.R32F),B===n.HALF_FLOAT&&(et=n.R16F),B===n.UNSIGNED_BYTE&&(et=n.R8)),v===n.RED_INTEGER&&(B===n.UNSIGNED_BYTE&&(et=n.R8UI),B===n.UNSIGNED_SHORT&&(et=n.R16UI),B===n.UNSIGNED_INT&&(et=n.R32UI),B===n.BYTE&&(et=n.R8I),B===n.SHORT&&(et=n.R16I),B===n.INT&&(et=n.R32I)),v===n.RG&&(B===n.FLOAT&&(et=n.RG32F),B===n.HALF_FLOAT&&(et=n.RG16F),B===n.UNSIGNED_BYTE&&(et=n.RG8)),v===n.RG_INTEGER&&(B===n.UNSIGNED_BYTE&&(et=n.RG8UI),B===n.UNSIGNED_SHORT&&(et=n.RG16UI),B===n.UNSIGNED_INT&&(et=n.RG32UI),B===n.BYTE&&(et=n.RG8I),B===n.SHORT&&(et=n.RG16I),B===n.INT&&(et=n.RG32I)),v===n.RGB_INTEGER&&(B===n.UNSIGNED_BYTE&&(et=n.RGB8UI),B===n.UNSIGNED_SHORT&&(et=n.RGB16UI),B===n.UNSIGNED_INT&&(et=n.RGB32UI),B===n.BYTE&&(et=n.RGB8I),B===n.SHORT&&(et=n.RGB16I),B===n.INT&&(et=n.RGB32I)),v===n.RGBA_INTEGER&&(B===n.UNSIGNED_BYTE&&(et=n.RGBA8UI),B===n.UNSIGNED_SHORT&&(et=n.RGBA16UI),B===n.UNSIGNED_INT&&(et=n.RGBA32UI),B===n.BYTE&&(et=n.RGBA8I),B===n.SHORT&&(et=n.RGBA16I),B===n.INT&&(et=n.RGBA32I)),v===n.RGB&&B===n.UNSIGNED_INT_5_9_9_9_REV&&(et=n.RGB9_E5),v===n.RGBA){const bt=ot?fa:Ce.getTransfer(Z);B===n.FLOAT&&(et=n.RGBA32F),B===n.HALF_FLOAT&&(et=n.RGBA16F),B===n.UNSIGNED_BYTE&&(et=bt===Ie?n.SRGB8_ALPHA8:n.RGBA8),B===n.UNSIGNED_SHORT_4_4_4_4&&(et=n.RGBA4),B===n.UNSIGNED_SHORT_5_5_5_1&&(et=n.RGB5_A1)}return(et===n.R16F||et===n.R32F||et===n.RG16F||et===n.RG32F||et===n.RGBA16F||et===n.RGBA32F)&&t.get("EXT_color_buffer_float"),et}function S(T,v){let B;return T?v===null||v===Cr||v===ms?B=n.DEPTH24_STENCIL8:v===wi?B=n.DEPTH32F_STENCIL8:v===to&&(B=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===Cr||v===ms?B=n.DEPTH_COMPONENT24:v===wi?B=n.DEPTH_COMPONENT32F:v===to&&(B=n.DEPTH_COMPONENT16),B}function V(T,v){return g(T)===!0||T.isFramebufferTexture&&T.minFilter!==Yn&&T.minFilter!==ri?Math.log2(Math.max(v.width,v.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?v.mipmaps.length:1}function C(T){const v=T.target;v.removeEventListener("dispose",C),z(v),v.isVideoTexture&&u.delete(v)}function I(T){const v=T.target;v.removeEventListener("dispose",I),y(v)}function z(T){const v=i.get(T);if(v.__webglInit===void 0)return;const B=T.source,Z=p.get(B);if(Z){const ot=Z[v.__cacheKey];ot.usedTimes--,ot.usedTimes===0&&A(T),Object.keys(Z).length===0&&p.delete(B)}i.remove(T)}function A(T){const v=i.get(T);n.deleteTexture(v.__webglTexture);const B=T.source,Z=p.get(B);delete Z[v.__cacheKey],o.memory.textures--}function y(T){const v=i.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),i.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let Z=0;Z<6;Z++){if(Array.isArray(v.__webglFramebuffer[Z]))for(let ot=0;ot<v.__webglFramebuffer[Z].length;ot++)n.deleteFramebuffer(v.__webglFramebuffer[Z][ot]);else n.deleteFramebuffer(v.__webglFramebuffer[Z]);v.__webglDepthbuffer&&n.deleteRenderbuffer(v.__webglDepthbuffer[Z])}else{if(Array.isArray(v.__webglFramebuffer))for(let Z=0;Z<v.__webglFramebuffer.length;Z++)n.deleteFramebuffer(v.__webglFramebuffer[Z]);else n.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&n.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&n.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let Z=0;Z<v.__webglColorRenderbuffer.length;Z++)v.__webglColorRenderbuffer[Z]&&n.deleteRenderbuffer(v.__webglColorRenderbuffer[Z]);v.__webglDepthRenderbuffer&&n.deleteRenderbuffer(v.__webglDepthRenderbuffer)}const B=T.textures;for(let Z=0,ot=B.length;Z<ot;Z++){const et=i.get(B[Z]);et.__webglTexture&&(n.deleteTexture(et.__webglTexture),o.memory.textures--),i.remove(B[Z])}i.remove(T)}let O=0;function lt(){O=0}function Q(){const T=O;return T>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+r.maxTextures),O+=1,T}function ht(T){const v=[];return v.push(T.wrapS),v.push(T.wrapT),v.push(T.wrapR||0),v.push(T.magFilter),v.push(T.minFilter),v.push(T.anisotropy),v.push(T.internalFormat),v.push(T.format),v.push(T.type),v.push(T.generateMipmaps),v.push(T.premultiplyAlpha),v.push(T.flipY),v.push(T.unpackAlignment),v.push(T.colorSpace),v.join()}function St(T,v){const B=i.get(T);if(T.isVideoTexture&&st(T),T.isRenderTargetTexture===!1&&T.version>0&&B.__version!==T.version){const Z=T.image;if(Z===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Z.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{_t(B,T,v);return}}e.bindTexture(n.TEXTURE_2D,B.__webglTexture,n.TEXTURE0+v)}function tt(T,v){const B=i.get(T);if(T.version>0&&B.__version!==T.version){_t(B,T,v);return}e.bindTexture(n.TEXTURE_2D_ARRAY,B.__webglTexture,n.TEXTURE0+v)}function dt(T,v){const B=i.get(T);if(T.version>0&&B.__version!==T.version){_t(B,T,v);return}e.bindTexture(n.TEXTURE_3D,B.__webglTexture,n.TEXTURE0+v)}function K(T,v){const B=i.get(T);if(T.version>0&&B.__version!==T.version){Ct(B,T,v);return}e.bindTexture(n.TEXTURE_CUBE_MAP,B.__webglTexture,n.TEXTURE0+v)}const Rt={[sc]:n.REPEAT,[Sr]:n.CLAMP_TO_EDGE,[oc]:n.MIRRORED_REPEAT},Dt={[Yn]:n.NEAREST,[pv]:n.NEAREST_MIPMAP_NEAREST,[Mo]:n.NEAREST_MIPMAP_LINEAR,[ri]:n.LINEAR,[il]:n.LINEAR_MIPMAP_NEAREST,[yr]:n.LINEAR_MIPMAP_LINEAR},Xt={[vv]:n.NEVER,[bv]:n.ALWAYS,[xv]:n.LESS,[Vd]:n.LEQUAL,[Mv]:n.EQUAL,[Ev]:n.GEQUAL,[Sv]:n.GREATER,[yv]:n.NOTEQUAL};function te(T,v){if(v.type===wi&&t.has("OES_texture_float_linear")===!1&&(v.magFilter===ri||v.magFilter===il||v.magFilter===Mo||v.magFilter===yr||v.minFilter===ri||v.minFilter===il||v.minFilter===Mo||v.minFilter===yr)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(T,n.TEXTURE_WRAP_S,Rt[v.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,Rt[v.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,Rt[v.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,Dt[v.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,Dt[v.minFilter]),v.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,Xt[v.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===Yn||v.minFilter!==Mo&&v.minFilter!==yr||v.type===wi&&t.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||i.get(v).__currentAnisotropy){const B=t.get("EXT_texture_filter_anisotropic");n.texParameterf(T,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,r.getMaxAnisotropy())),i.get(v).__currentAnisotropy=v.anisotropy}}}function Ae(T,v){let B=!1;T.__webglInit===void 0&&(T.__webglInit=!0,v.addEventListener("dispose",C));const Z=v.source;let ot=p.get(Z);ot===void 0&&(ot={},p.set(Z,ot));const et=ht(v);if(et!==T.__cacheKey){ot[et]===void 0&&(ot[et]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,B=!0),ot[et].usedTimes++;const bt=ot[T.__cacheKey];bt!==void 0&&(ot[T.__cacheKey].usedTimes--,bt.usedTimes===0&&A(v)),T.__cacheKey=et,T.__webglTexture=ot[et].texture}return B}function _t(T,v,B){let Z=n.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(Z=n.TEXTURE_2D_ARRAY),v.isData3DTexture&&(Z=n.TEXTURE_3D);const ot=Ae(T,v),et=v.source;e.bindTexture(Z,T.__webglTexture,n.TEXTURE0+B);const bt=i.get(et);if(et.version!==bt.__version||ot===!0){e.activeTexture(n.TEXTURE0+B);const Tt=Ce.getPrimaries(Ce.workingColorSpace),Et=v.colorSpace===$i?null:Ce.getPrimaries(v.colorSpace),ne=v.colorSpace===$i||Tt===Et?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ne);let ct=M(v.image,!1,r.maxTextureSize);ct=xt(v,ct);const Ut=s.convert(v.format,v.colorSpace),kt=s.convert(v.type);let qt=R(v.internalFormat,Ut,kt,v.colorSpace,v.isVideoTexture);te(Z,v);let It;const ge=v.mipmaps,ce=v.isVideoTexture!==!0,De=bt.__version===void 0||ot===!0,k=et.dataReady,Nt=V(v,ct);if(v.isDepthTexture)qt=S(v.format===_s,v.type),De&&(ce?e.texStorage2D(n.TEXTURE_2D,1,qt,ct.width,ct.height):e.texImage2D(n.TEXTURE_2D,0,qt,ct.width,ct.height,0,Ut,kt,null));else if(v.isDataTexture)if(ge.length>0){ce&&De&&e.texStorage2D(n.TEXTURE_2D,Nt,qt,ge[0].width,ge[0].height);for(let ut=0,Mt=ge.length;ut<Mt;ut++)It=ge[ut],ce?k&&e.texSubImage2D(n.TEXTURE_2D,ut,0,0,It.width,It.height,Ut,kt,It.data):e.texImage2D(n.TEXTURE_2D,ut,qt,It.width,It.height,0,Ut,kt,It.data);v.generateMipmaps=!1}else ce?(De&&e.texStorage2D(n.TEXTURE_2D,Nt,qt,ct.width,ct.height),k&&e.texSubImage2D(n.TEXTURE_2D,0,0,0,ct.width,ct.height,Ut,kt,ct.data)):e.texImage2D(n.TEXTURE_2D,0,qt,ct.width,ct.height,0,Ut,kt,ct.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){ce&&De&&e.texStorage3D(n.TEXTURE_2D_ARRAY,Nt,qt,ge[0].width,ge[0].height,ct.depth);for(let ut=0,Mt=ge.length;ut<Mt;ut++)if(It=ge[ut],v.format!==Gn)if(Ut!==null)if(ce){if(k)if(v.layerUpdates.size>0){const Ft=Vf(It.width,It.height,v.format,v.type);for(const Vt of v.layerUpdates){const oe=It.data.subarray(Vt*Ft/It.data.BYTES_PER_ELEMENT,(Vt+1)*Ft/It.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ut,0,0,Vt,It.width,It.height,1,Ut,oe)}v.clearLayerUpdates()}else e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ut,0,0,0,It.width,It.height,ct.depth,Ut,It.data)}else e.compressedTexImage3D(n.TEXTURE_2D_ARRAY,ut,qt,It.width,It.height,ct.depth,0,It.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ce?k&&e.texSubImage3D(n.TEXTURE_2D_ARRAY,ut,0,0,0,It.width,It.height,ct.depth,Ut,kt,It.data):e.texImage3D(n.TEXTURE_2D_ARRAY,ut,qt,It.width,It.height,ct.depth,0,Ut,kt,It.data)}else{ce&&De&&e.texStorage2D(n.TEXTURE_2D,Nt,qt,ge[0].width,ge[0].height);for(let ut=0,Mt=ge.length;ut<Mt;ut++)It=ge[ut],v.format!==Gn?Ut!==null?ce?k&&e.compressedTexSubImage2D(n.TEXTURE_2D,ut,0,0,It.width,It.height,Ut,It.data):e.compressedTexImage2D(n.TEXTURE_2D,ut,qt,It.width,It.height,0,It.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ce?k&&e.texSubImage2D(n.TEXTURE_2D,ut,0,0,It.width,It.height,Ut,kt,It.data):e.texImage2D(n.TEXTURE_2D,ut,qt,It.width,It.height,0,Ut,kt,It.data)}else if(v.isDataArrayTexture)if(ce){if(De&&e.texStorage3D(n.TEXTURE_2D_ARRAY,Nt,qt,ct.width,ct.height,ct.depth),k)if(v.layerUpdates.size>0){const ut=Vf(ct.width,ct.height,v.format,v.type);for(const Mt of v.layerUpdates){const Ft=ct.data.subarray(Mt*ut/ct.data.BYTES_PER_ELEMENT,(Mt+1)*ut/ct.data.BYTES_PER_ELEMENT);e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,Mt,ct.width,ct.height,1,Ut,kt,Ft)}v.clearLayerUpdates()}else e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ct.width,ct.height,ct.depth,Ut,kt,ct.data)}else e.texImage3D(n.TEXTURE_2D_ARRAY,0,qt,ct.width,ct.height,ct.depth,0,Ut,kt,ct.data);else if(v.isData3DTexture)ce?(De&&e.texStorage3D(n.TEXTURE_3D,Nt,qt,ct.width,ct.height,ct.depth),k&&e.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ct.width,ct.height,ct.depth,Ut,kt,ct.data)):e.texImage3D(n.TEXTURE_3D,0,qt,ct.width,ct.height,ct.depth,0,Ut,kt,ct.data);else if(v.isFramebufferTexture){if(De)if(ce)e.texStorage2D(n.TEXTURE_2D,Nt,qt,ct.width,ct.height);else{let ut=ct.width,Mt=ct.height;for(let Ft=0;Ft<Nt;Ft++)e.texImage2D(n.TEXTURE_2D,Ft,qt,ut,Mt,0,Ut,kt,null),ut>>=1,Mt>>=1}}else if(ge.length>0){if(ce&&De){const ut=q(ge[0]);e.texStorage2D(n.TEXTURE_2D,Nt,qt,ut.width,ut.height)}for(let ut=0,Mt=ge.length;ut<Mt;ut++)It=ge[ut],ce?k&&e.texSubImage2D(n.TEXTURE_2D,ut,0,0,Ut,kt,It):e.texImage2D(n.TEXTURE_2D,ut,qt,Ut,kt,It);v.generateMipmaps=!1}else if(ce){if(De){const ut=q(ct);e.texStorage2D(n.TEXTURE_2D,Nt,qt,ut.width,ut.height)}k&&e.texSubImage2D(n.TEXTURE_2D,0,0,0,Ut,kt,ct)}else e.texImage2D(n.TEXTURE_2D,0,qt,Ut,kt,ct);g(v)&&m(Z),bt.__version=et.version,v.onUpdate&&v.onUpdate(v)}T.__version=v.version}function Ct(T,v,B){if(v.image.length!==6)return;const Z=Ae(T,v),ot=v.source;e.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+B);const et=i.get(ot);if(ot.version!==et.__version||Z===!0){e.activeTexture(n.TEXTURE0+B);const bt=Ce.getPrimaries(Ce.workingColorSpace),Tt=v.colorSpace===$i?null:Ce.getPrimaries(v.colorSpace),Et=v.colorSpace===$i||bt===Tt?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Et);const ne=v.isCompressedTexture||v.image[0].isCompressedTexture,ct=v.image[0]&&v.image[0].isDataTexture,Ut=[];for(let Mt=0;Mt<6;Mt++)!ne&&!ct?Ut[Mt]=M(v.image[Mt],!0,r.maxCubemapSize):Ut[Mt]=ct?v.image[Mt].image:v.image[Mt],Ut[Mt]=xt(v,Ut[Mt]);const kt=Ut[0],qt=s.convert(v.format,v.colorSpace),It=s.convert(v.type),ge=R(v.internalFormat,qt,It,v.colorSpace),ce=v.isVideoTexture!==!0,De=et.__version===void 0||Z===!0,k=ot.dataReady;let Nt=V(v,kt);te(n.TEXTURE_CUBE_MAP,v);let ut;if(ne){ce&&De&&e.texStorage2D(n.TEXTURE_CUBE_MAP,Nt,ge,kt.width,kt.height);for(let Mt=0;Mt<6;Mt++){ut=Ut[Mt].mipmaps;for(let Ft=0;Ft<ut.length;Ft++){const Vt=ut[Ft];v.format!==Gn?qt!==null?ce?k&&e.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,Ft,0,0,Vt.width,Vt.height,qt,Vt.data):e.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,Ft,ge,Vt.width,Vt.height,0,Vt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ce?k&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,Ft,0,0,Vt.width,Vt.height,qt,It,Vt.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,Ft,ge,Vt.width,Vt.height,0,qt,It,Vt.data)}}}else{if(ut=v.mipmaps,ce&&De){ut.length>0&&Nt++;const Mt=q(Ut[0]);e.texStorage2D(n.TEXTURE_CUBE_MAP,Nt,ge,Mt.width,Mt.height)}for(let Mt=0;Mt<6;Mt++)if(ct){ce?k&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,0,0,0,Ut[Mt].width,Ut[Mt].height,qt,It,Ut[Mt].data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,0,ge,Ut[Mt].width,Ut[Mt].height,0,qt,It,Ut[Mt].data);for(let Ft=0;Ft<ut.length;Ft++){const oe=ut[Ft].image[Mt].image;ce?k&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,Ft+1,0,0,oe.width,oe.height,qt,It,oe.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,Ft+1,ge,oe.width,oe.height,0,qt,It,oe.data)}}else{ce?k&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,0,0,0,qt,It,Ut[Mt]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,0,ge,qt,It,Ut[Mt]);for(let Ft=0;Ft<ut.length;Ft++){const Vt=ut[Ft];ce?k&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,Ft+1,0,0,qt,It,Vt.image[Mt]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,Ft+1,ge,qt,It,Vt.image[Mt])}}}g(v)&&m(n.TEXTURE_CUBE_MAP),et.__version=ot.version,v.onUpdate&&v.onUpdate(v)}T.__version=v.version}function Gt(T,v,B,Z,ot,et){const bt=s.convert(B.format,B.colorSpace),Tt=s.convert(B.type),Et=R(B.internalFormat,bt,Tt,B.colorSpace),ne=i.get(v),ct=i.get(B);if(ct.__renderTarget=v,!ne.__hasExternalTextures){const Ut=Math.max(1,v.width>>et),kt=Math.max(1,v.height>>et);ot===n.TEXTURE_3D||ot===n.TEXTURE_2D_ARRAY?e.texImage3D(ot,et,Et,Ut,kt,v.depth,0,bt,Tt,null):e.texImage2D(ot,et,Et,Ut,kt,0,bt,Tt,null)}e.bindFramebuffer(n.FRAMEBUFFER,T),gt(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Z,ot,ct.__webglTexture,0,rt(v)):(ot===n.TEXTURE_2D||ot>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&ot<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,Z,ot,ct.__webglTexture,et),e.bindFramebuffer(n.FRAMEBUFFER,null)}function Lt(T,v,B){if(n.bindRenderbuffer(n.RENDERBUFFER,T),v.depthBuffer){const Z=v.depthTexture,ot=Z&&Z.isDepthTexture?Z.type:null,et=S(v.stencilBuffer,ot),bt=v.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Tt=rt(v);gt(v)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Tt,et,v.width,v.height):B?n.renderbufferStorageMultisample(n.RENDERBUFFER,Tt,et,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,et,v.width,v.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,bt,n.RENDERBUFFER,T)}else{const Z=v.textures;for(let ot=0;ot<Z.length;ot++){const et=Z[ot],bt=s.convert(et.format,et.colorSpace),Tt=s.convert(et.type),Et=R(et.internalFormat,bt,Tt,et.colorSpace),ne=rt(v);B&&gt(v)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,ne,Et,v.width,v.height):gt(v)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ne,Et,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,Et,v.width,v.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Qt(T,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(n.FRAMEBUFFER,T),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const Z=i.get(v.depthTexture);Z.__renderTarget=v,(!Z.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),St(v.depthTexture,0);const ot=Z.__webglTexture,et=rt(v);if(v.depthTexture.format===as)gt(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,ot,0,et):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,ot,0);else if(v.depthTexture.format===_s)gt(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,ot,0,et):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,ot,0);else throw new Error("Unknown depthTexture format")}function ee(T){const v=i.get(T),B=T.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==T.depthTexture){const Z=T.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),Z){const ot=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,Z.removeEventListener("dispose",ot)};Z.addEventListener("dispose",ot),v.__depthDisposeCallback=ot}v.__boundDepthTexture=Z}if(T.depthTexture&&!v.__autoAllocateDepthBuffer){if(B)throw new Error("target.depthTexture not supported in Cube render targets");Qt(v.__webglFramebuffer,T)}else if(B){v.__webglDepthbuffer=[];for(let Z=0;Z<6;Z++)if(e.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer[Z]),v.__webglDepthbuffer[Z]===void 0)v.__webglDepthbuffer[Z]=n.createRenderbuffer(),Lt(v.__webglDepthbuffer[Z],T,!1);else{const ot=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,et=v.__webglDepthbuffer[Z];n.bindRenderbuffer(n.RENDERBUFFER,et),n.framebufferRenderbuffer(n.FRAMEBUFFER,ot,n.RENDERBUFFER,et)}}else if(e.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=n.createRenderbuffer(),Lt(v.__webglDepthbuffer,T,!1);else{const Z=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ot=v.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ot),n.framebufferRenderbuffer(n.FRAMEBUFFER,Z,n.RENDERBUFFER,ot)}e.bindFramebuffer(n.FRAMEBUFFER,null)}function me(T,v,B){const Z=i.get(T);v!==void 0&&Gt(Z.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),B!==void 0&&ee(T)}function D(T){const v=T.texture,B=i.get(T),Z=i.get(v);T.addEventListener("dispose",I);const ot=T.textures,et=T.isWebGLCubeRenderTarget===!0,bt=ot.length>1;if(bt||(Z.__webglTexture===void 0&&(Z.__webglTexture=n.createTexture()),Z.__version=v.version,o.memory.textures++),et){B.__webglFramebuffer=[];for(let Tt=0;Tt<6;Tt++)if(v.mipmaps&&v.mipmaps.length>0){B.__webglFramebuffer[Tt]=[];for(let Et=0;Et<v.mipmaps.length;Et++)B.__webglFramebuffer[Tt][Et]=n.createFramebuffer()}else B.__webglFramebuffer[Tt]=n.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){B.__webglFramebuffer=[];for(let Tt=0;Tt<v.mipmaps.length;Tt++)B.__webglFramebuffer[Tt]=n.createFramebuffer()}else B.__webglFramebuffer=n.createFramebuffer();if(bt)for(let Tt=0,Et=ot.length;Tt<Et;Tt++){const ne=i.get(ot[Tt]);ne.__webglTexture===void 0&&(ne.__webglTexture=n.createTexture(),o.memory.textures++)}if(T.samples>0&&gt(T)===!1){B.__webglMultisampledFramebuffer=n.createFramebuffer(),B.__webglColorRenderbuffer=[],e.bindFramebuffer(n.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let Tt=0;Tt<ot.length;Tt++){const Et=ot[Tt];B.__webglColorRenderbuffer[Tt]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,B.__webglColorRenderbuffer[Tt]);const ne=s.convert(Et.format,Et.colorSpace),ct=s.convert(Et.type),Ut=R(Et.internalFormat,ne,ct,Et.colorSpace,T.isXRRenderTarget===!0),kt=rt(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,kt,Ut,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Tt,n.RENDERBUFFER,B.__webglColorRenderbuffer[Tt])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(B.__webglDepthRenderbuffer=n.createRenderbuffer(),Lt(B.__webglDepthRenderbuffer,T,!0)),e.bindFramebuffer(n.FRAMEBUFFER,null)}}if(et){e.bindTexture(n.TEXTURE_CUBE_MAP,Z.__webglTexture),te(n.TEXTURE_CUBE_MAP,v);for(let Tt=0;Tt<6;Tt++)if(v.mipmaps&&v.mipmaps.length>0)for(let Et=0;Et<v.mipmaps.length;Et++)Gt(B.__webglFramebuffer[Tt][Et],T,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Tt,Et);else Gt(B.__webglFramebuffer[Tt],T,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Tt,0);g(v)&&m(n.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(bt){for(let Tt=0,Et=ot.length;Tt<Et;Tt++){const ne=ot[Tt],ct=i.get(ne);e.bindTexture(n.TEXTURE_2D,ct.__webglTexture),te(n.TEXTURE_2D,ne),Gt(B.__webglFramebuffer,T,ne,n.COLOR_ATTACHMENT0+Tt,n.TEXTURE_2D,0),g(ne)&&m(n.TEXTURE_2D)}e.unbindTexture()}else{let Tt=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(Tt=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),e.bindTexture(Tt,Z.__webglTexture),te(Tt,v),v.mipmaps&&v.mipmaps.length>0)for(let Et=0;Et<v.mipmaps.length;Et++)Gt(B.__webglFramebuffer[Et],T,v,n.COLOR_ATTACHMENT0,Tt,Et);else Gt(B.__webglFramebuffer,T,v,n.COLOR_ATTACHMENT0,Tt,0);g(v)&&m(Tt),e.unbindTexture()}T.depthBuffer&&ee(T)}function N(T){const v=T.textures;for(let B=0,Z=v.length;B<Z;B++){const ot=v[B];if(g(ot)){const et=L(T),bt=i.get(ot).__webglTexture;e.bindTexture(et,bt),m(et),e.unbindTexture()}}}const Y=[],w=[];function pt(T){if(T.samples>0){if(gt(T)===!1){const v=T.textures,B=T.width,Z=T.height;let ot=n.COLOR_BUFFER_BIT;const et=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,bt=i.get(T),Tt=v.length>1;if(Tt)for(let Et=0;Et<v.length;Et++)e.bindFramebuffer(n.FRAMEBUFFER,bt.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Et,n.RENDERBUFFER,null),e.bindFramebuffer(n.FRAMEBUFFER,bt.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Et,n.TEXTURE_2D,null,0);e.bindFramebuffer(n.READ_FRAMEBUFFER,bt.__webglMultisampledFramebuffer),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,bt.__webglFramebuffer);for(let Et=0;Et<v.length;Et++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(ot|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(ot|=n.STENCIL_BUFFER_BIT)),Tt){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,bt.__webglColorRenderbuffer[Et]);const ne=i.get(v[Et]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ne,0)}n.blitFramebuffer(0,0,B,Z,0,0,B,Z,ot,n.NEAREST),l===!0&&(Y.length=0,w.length=0,Y.push(n.COLOR_ATTACHMENT0+Et),T.depthBuffer&&T.resolveDepthBuffer===!1&&(Y.push(et),w.push(et),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,w)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Y))}if(e.bindFramebuffer(n.READ_FRAMEBUFFER,null),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),Tt)for(let Et=0;Et<v.length;Et++){e.bindFramebuffer(n.FRAMEBUFFER,bt.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Et,n.RENDERBUFFER,bt.__webglColorRenderbuffer[Et]);const ne=i.get(v[Et]).__webglTexture;e.bindFramebuffer(n.FRAMEBUFFER,bt.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Et,n.TEXTURE_2D,ne,0)}e.bindFramebuffer(n.DRAW_FRAMEBUFFER,bt.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&l){const v=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[v])}}}function rt(T){return Math.min(r.maxSamples,T.samples)}function gt(T){const v=i.get(T);return T.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function st(T){const v=o.render.frame;u.get(T)!==v&&(u.set(T,v),T.update())}function xt(T,v){const B=T.colorSpace,Z=T.format,ot=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||B!==gs&&B!==$i&&(Ce.getTransfer(B)===Ie?(Z!==Gn||ot!==Di)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",B)),v}function q(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(c.width=T.naturalWidth||T.width,c.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(c.width=T.displayWidth,c.height=T.displayHeight):(c.width=T.width,c.height=T.height),c}this.allocateTextureUnit=Q,this.resetTextureUnits=lt,this.setTexture2D=St,this.setTexture2DArray=tt,this.setTexture3D=dt,this.setTextureCube=K,this.rebindTextures=me,this.setupRenderTarget=D,this.updateRenderTargetMipmap=N,this.updateMultisampleRenderTarget=pt,this.setupDepthRenderbuffer=ee,this.setupFrameBufferTexture=Gt,this.useMultisampledRTT=gt}function tE(n,t){function e(i,r=$i){let s;const o=Ce.getTransfer(r);if(i===Di)return n.UNSIGNED_BYTE;if(i===nu)return n.UNSIGNED_SHORT_4_4_4_4;if(i===iu)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Dd)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Cd)return n.BYTE;if(i===Pd)return n.SHORT;if(i===to)return n.UNSIGNED_SHORT;if(i===eu)return n.INT;if(i===Cr)return n.UNSIGNED_INT;if(i===wi)return n.FLOAT;if(i===ro)return n.HALF_FLOAT;if(i===Ld)return n.ALPHA;if(i===Id)return n.RGB;if(i===Gn)return n.RGBA;if(i===Ud)return n.LUMINANCE;if(i===Nd)return n.LUMINANCE_ALPHA;if(i===as)return n.DEPTH_COMPONENT;if(i===_s)return n.DEPTH_STENCIL;if(i===Fd)return n.RED;if(i===ru)return n.RED_INTEGER;if(i===Od)return n.RG;if(i===su)return n.RG_INTEGER;if(i===ou)return n.RGBA_INTEGER;if(i===jo||i===Ko||i===Zo||i===Jo)if(o===Ie)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===jo)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Ko)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Zo)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Jo)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===jo)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Ko)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Zo)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Jo)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===ac||i===lc||i===cc||i===uc)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===ac)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===lc)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===cc)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===uc)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===fc||i===hc||i===dc)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(i===fc||i===hc)return o===Ie?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===dc)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===pc||i===mc||i===_c||i===gc||i===vc||i===xc||i===Mc||i===Sc||i===yc||i===Ec||i===bc||i===Tc||i===Ac||i===wc)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(i===pc)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===mc)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===_c)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===gc)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===vc)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===xc)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Mc)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Sc)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===yc)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Ec)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===bc)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Tc)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Ac)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===wc)return o===Ie?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Qo||i===Rc||i===Cc)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(i===Qo)return o===Ie?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Rc)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Cc)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Bd||i===Pc||i===Dc||i===Lc)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(i===Qo)return s.COMPRESSED_RED_RGTC1_EXT;if(i===Pc)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Dc)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Lc)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===ms?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:e}}const eE={type:"move"};class Ll{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Vo,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Vo,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new j,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new j),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Vo,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new j,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new j),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let r=null,s=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(const M of t.hand.values()){const g=e.getJointPose(M,i),m=this._getHandJoint(c,M);g!==null&&(m.matrix.fromArray(g.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=g.radius),m.visible=g!==null}const u=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],p=u.position.distanceTo(f.position),_=.02,x=.005;c.inputState.pinching&&p>_+x?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&p<=_-x&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(r=e.getPose(t.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(eE)))}return a!==null&&(a.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const i=new Vo;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}}const nE=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,iE=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class rE{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,i){if(this.texture===null){const r=new bn,s=t.properties.get(r);s.__webglTexture=e.texture,(e.depthNear!=i.depthNear||e.depthFar!=i.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=r}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,i=new Ji({vertexShader:nE,fragmentShader:iE,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Un(new xs(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class sE extends Lr{constructor(t,e){super();const i=this;let r=null,s=1,o=null,a="local-floor",l=1,c=null,u=null,f=null,p=null,_=null,x=null;const M=new rE,g=e.getContextAttributes();let m=null,L=null;const R=[],S=[],V=new pe;let C=null;const I=new Dn;I.viewport=new $e;const z=new Dn;z.viewport=new $e;const A=[I,z],y=new b0;let O=null,lt=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(_t){let Ct=R[_t];return Ct===void 0&&(Ct=new Ll,R[_t]=Ct),Ct.getTargetRaySpace()},this.getControllerGrip=function(_t){let Ct=R[_t];return Ct===void 0&&(Ct=new Ll,R[_t]=Ct),Ct.getGripSpace()},this.getHand=function(_t){let Ct=R[_t];return Ct===void 0&&(Ct=new Ll,R[_t]=Ct),Ct.getHandSpace()};function Q(_t){const Ct=S.indexOf(_t.inputSource);if(Ct===-1)return;const Gt=R[Ct];Gt!==void 0&&(Gt.update(_t.inputSource,_t.frame,c||o),Gt.dispatchEvent({type:_t.type,data:_t.inputSource}))}function ht(){r.removeEventListener("select",Q),r.removeEventListener("selectstart",Q),r.removeEventListener("selectend",Q),r.removeEventListener("squeeze",Q),r.removeEventListener("squeezestart",Q),r.removeEventListener("squeezeend",Q),r.removeEventListener("end",ht),r.removeEventListener("inputsourceschange",St);for(let _t=0;_t<R.length;_t++){const Ct=S[_t];Ct!==null&&(S[_t]=null,R[_t].disconnect(Ct))}O=null,lt=null,M.reset(),t.setRenderTarget(m),_=null,p=null,f=null,r=null,L=null,Ae.stop(),i.isPresenting=!1,t.setPixelRatio(C),t.setSize(V.width,V.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(_t){s=_t,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(_t){a=_t,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(_t){c=_t},this.getBaseLayer=function(){return p!==null?p:_},this.getBinding=function(){return f},this.getFrame=function(){return x},this.getSession=function(){return r},this.setSession=async function(_t){if(r=_t,r!==null){if(m=t.getRenderTarget(),r.addEventListener("select",Q),r.addEventListener("selectstart",Q),r.addEventListener("selectend",Q),r.addEventListener("squeeze",Q),r.addEventListener("squeezestart",Q),r.addEventListener("squeezeend",Q),r.addEventListener("end",ht),r.addEventListener("inputsourceschange",St),g.xrCompatible!==!0&&await e.makeXRCompatible(),C=t.getPixelRatio(),t.getSize(V),r.renderState.layers===void 0){const Ct={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:s};_=new XRWebGLLayer(r,e,Ct),r.updateRenderState({baseLayer:_}),t.setPixelRatio(1),t.setSize(_.framebufferWidth,_.framebufferHeight,!1),L=new Pr(_.framebufferWidth,_.framebufferHeight,{format:Gn,type:Di,colorSpace:t.outputColorSpace,stencilBuffer:g.stencil})}else{let Ct=null,Gt=null,Lt=null;g.depth&&(Lt=g.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,Ct=g.stencil?_s:as,Gt=g.stencil?ms:Cr);const Qt={colorFormat:e.RGBA8,depthFormat:Lt,scaleFactor:s};f=new XRWebGLBinding(r,e),p=f.createProjectionLayer(Qt),r.updateRenderState({layers:[p]}),t.setPixelRatio(1),t.setSize(p.textureWidth,p.textureHeight,!1),L=new Pr(p.textureWidth,p.textureHeight,{format:Gn,type:Di,depthTexture:new Zd(p.textureWidth,p.textureHeight,Gt,void 0,void 0,void 0,void 0,void 0,void 0,Ct),stencilBuffer:g.stencil,colorSpace:t.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:p.ignoreDepthValues===!1})}L.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await r.requestReferenceSpace(a),Ae.setContext(r),Ae.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return M.getDepthTexture()};function St(_t){for(let Ct=0;Ct<_t.removed.length;Ct++){const Gt=_t.removed[Ct],Lt=S.indexOf(Gt);Lt>=0&&(S[Lt]=null,R[Lt].disconnect(Gt))}for(let Ct=0;Ct<_t.added.length;Ct++){const Gt=_t.added[Ct];let Lt=S.indexOf(Gt);if(Lt===-1){for(let ee=0;ee<R.length;ee++)if(ee>=S.length){S.push(Gt),Lt=ee;break}else if(S[ee]===null){S[ee]=Gt,Lt=ee;break}if(Lt===-1)break}const Qt=R[Lt];Qt&&Qt.connect(Gt)}}const tt=new j,dt=new j;function K(_t,Ct,Gt){tt.setFromMatrixPosition(Ct.matrixWorld),dt.setFromMatrixPosition(Gt.matrixWorld);const Lt=tt.distanceTo(dt),Qt=Ct.projectionMatrix.elements,ee=Gt.projectionMatrix.elements,me=Qt[14]/(Qt[10]-1),D=Qt[14]/(Qt[10]+1),N=(Qt[9]+1)/Qt[5],Y=(Qt[9]-1)/Qt[5],w=(Qt[8]-1)/Qt[0],pt=(ee[8]+1)/ee[0],rt=me*w,gt=me*pt,st=Lt/(-w+pt),xt=st*-w;if(Ct.matrixWorld.decompose(_t.position,_t.quaternion,_t.scale),_t.translateX(xt),_t.translateZ(st),_t.matrixWorld.compose(_t.position,_t.quaternion,_t.scale),_t.matrixWorldInverse.copy(_t.matrixWorld).invert(),Qt[10]===-1)_t.projectionMatrix.copy(Ct.projectionMatrix),_t.projectionMatrixInverse.copy(Ct.projectionMatrixInverse);else{const q=me+st,T=D+st,v=rt-xt,B=gt+(Lt-xt),Z=N*D/T*q,ot=Y*D/T*q;_t.projectionMatrix.makePerspective(v,B,Z,ot,q,T),_t.projectionMatrixInverse.copy(_t.projectionMatrix).invert()}}function Rt(_t,Ct){Ct===null?_t.matrixWorld.copy(_t.matrix):_t.matrixWorld.multiplyMatrices(Ct.matrixWorld,_t.matrix),_t.matrixWorldInverse.copy(_t.matrixWorld).invert()}this.updateCamera=function(_t){if(r===null)return;let Ct=_t.near,Gt=_t.far;M.texture!==null&&(M.depthNear>0&&(Ct=M.depthNear),M.depthFar>0&&(Gt=M.depthFar)),y.near=z.near=I.near=Ct,y.far=z.far=I.far=Gt,(O!==y.near||lt!==y.far)&&(r.updateRenderState({depthNear:y.near,depthFar:y.far}),O=y.near,lt=y.far),I.layers.mask=_t.layers.mask|2,z.layers.mask=_t.layers.mask|4,y.layers.mask=I.layers.mask|z.layers.mask;const Lt=_t.parent,Qt=y.cameras;Rt(y,Lt);for(let ee=0;ee<Qt.length;ee++)Rt(Qt[ee],Lt);Qt.length===2?K(y,I,z):y.projectionMatrix.copy(I.projectionMatrix),Dt(_t,y,Lt)};function Dt(_t,Ct,Gt){Gt===null?_t.matrix.copy(Ct.matrixWorld):(_t.matrix.copy(Gt.matrixWorld),_t.matrix.invert(),_t.matrix.multiply(Ct.matrixWorld)),_t.matrix.decompose(_t.position,_t.quaternion,_t.scale),_t.updateMatrixWorld(!0),_t.projectionMatrix.copy(Ct.projectionMatrix),_t.projectionMatrixInverse.copy(Ct.projectionMatrixInverse),_t.isPerspectiveCamera&&(_t.fov=eo*2*Math.atan(1/_t.projectionMatrix.elements[5]),_t.zoom=1)}this.getCamera=function(){return y},this.getFoveation=function(){if(!(p===null&&_===null))return l},this.setFoveation=function(_t){l=_t,p!==null&&(p.fixedFoveation=_t),_!==null&&_.fixedFoveation!==void 0&&(_.fixedFoveation=_t)},this.hasDepthSensing=function(){return M.texture!==null},this.getDepthSensingMesh=function(){return M.getMesh(y)};let Xt=null;function te(_t,Ct){if(u=Ct.getViewerPose(c||o),x=Ct,u!==null){const Gt=u.views;_!==null&&(t.setRenderTargetFramebuffer(L,_.framebuffer),t.setRenderTarget(L));let Lt=!1;Gt.length!==y.cameras.length&&(y.cameras.length=0,Lt=!0);for(let ee=0;ee<Gt.length;ee++){const me=Gt[ee];let D=null;if(_!==null)D=_.getViewport(me);else{const Y=f.getViewSubImage(p,me);D=Y.viewport,ee===0&&(t.setRenderTargetTextures(L,Y.colorTexture,p.ignoreDepthValues?void 0:Y.depthStencilTexture),t.setRenderTarget(L))}let N=A[ee];N===void 0&&(N=new Dn,N.layers.enable(ee),N.viewport=new $e,A[ee]=N),N.matrix.fromArray(me.transform.matrix),N.matrix.decompose(N.position,N.quaternion,N.scale),N.projectionMatrix.fromArray(me.projectionMatrix),N.projectionMatrixInverse.copy(N.projectionMatrix).invert(),N.viewport.set(D.x,D.y,D.width,D.height),ee===0&&(y.matrix.copy(N.matrix),y.matrix.decompose(y.position,y.quaternion,y.scale)),Lt===!0&&y.cameras.push(N)}const Qt=r.enabledFeatures;if(Qt&&Qt.includes("depth-sensing")){const ee=f.getDepthInformation(Gt[0]);ee&&ee.isValid&&ee.texture&&M.init(t,ee,r.renderState)}}for(let Gt=0;Gt<R.length;Gt++){const Lt=S[Gt],Qt=R[Gt];Lt!==null&&Qt!==void 0&&Qt.update(Lt,Ct,c||o)}Xt&&Xt(_t,Ct),Ct.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:Ct}),x=null}const Ae=new tp;Ae.setAnimationLoop(te),this.setAnimationLoop=function(_t){Xt=_t},this.dispose=function(){}}}const hr=new fi,oE=new We;function aE(n,t){function e(g,m){g.matrixAutoUpdate===!0&&g.updateMatrix(),m.value.copy(g.matrix)}function i(g,m){m.color.getRGB(g.fogColor.value,qd(n)),m.isFog?(g.fogNear.value=m.near,g.fogFar.value=m.far):m.isFogExp2&&(g.fogDensity.value=m.density)}function r(g,m,L,R,S){m.isMeshBasicMaterial||m.isMeshLambertMaterial?s(g,m):m.isMeshToonMaterial?(s(g,m),f(g,m)):m.isMeshPhongMaterial?(s(g,m),u(g,m)):m.isMeshStandardMaterial?(s(g,m),p(g,m),m.isMeshPhysicalMaterial&&_(g,m,S)):m.isMeshMatcapMaterial?(s(g,m),x(g,m)):m.isMeshDepthMaterial?s(g,m):m.isMeshDistanceMaterial?(s(g,m),M(g,m)):m.isMeshNormalMaterial?s(g,m):m.isLineBasicMaterial?(o(g,m),m.isLineDashedMaterial&&a(g,m)):m.isPointsMaterial?l(g,m,L,R):m.isSpriteMaterial?c(g,m):m.isShadowMaterial?(g.color.value.copy(m.color),g.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function s(g,m){g.opacity.value=m.opacity,m.color&&g.diffuse.value.copy(m.color),m.emissive&&g.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(g.map.value=m.map,e(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,e(m.alphaMap,g.alphaMapTransform)),m.bumpMap&&(g.bumpMap.value=m.bumpMap,e(m.bumpMap,g.bumpMapTransform),g.bumpScale.value=m.bumpScale,m.side===En&&(g.bumpScale.value*=-1)),m.normalMap&&(g.normalMap.value=m.normalMap,e(m.normalMap,g.normalMapTransform),g.normalScale.value.copy(m.normalScale),m.side===En&&g.normalScale.value.negate()),m.displacementMap&&(g.displacementMap.value=m.displacementMap,e(m.displacementMap,g.displacementMapTransform),g.displacementScale.value=m.displacementScale,g.displacementBias.value=m.displacementBias),m.emissiveMap&&(g.emissiveMap.value=m.emissiveMap,e(m.emissiveMap,g.emissiveMapTransform)),m.specularMap&&(g.specularMap.value=m.specularMap,e(m.specularMap,g.specularMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest);const L=t.get(m),R=L.envMap,S=L.envMapRotation;R&&(g.envMap.value=R,hr.copy(S),hr.x*=-1,hr.y*=-1,hr.z*=-1,R.isCubeTexture&&R.isRenderTargetTexture===!1&&(hr.y*=-1,hr.z*=-1),g.envMapRotation.value.setFromMatrix4(oE.makeRotationFromEuler(hr)),g.flipEnvMap.value=R.isCubeTexture&&R.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=m.reflectivity,g.ior.value=m.ior,g.refractionRatio.value=m.refractionRatio),m.lightMap&&(g.lightMap.value=m.lightMap,g.lightMapIntensity.value=m.lightMapIntensity,e(m.lightMap,g.lightMapTransform)),m.aoMap&&(g.aoMap.value=m.aoMap,g.aoMapIntensity.value=m.aoMapIntensity,e(m.aoMap,g.aoMapTransform))}function o(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,m.map&&(g.map.value=m.map,e(m.map,g.mapTransform))}function a(g,m){g.dashSize.value=m.dashSize,g.totalSize.value=m.dashSize+m.gapSize,g.scale.value=m.scale}function l(g,m,L,R){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.size.value=m.size*L,g.scale.value=R*.5,m.map&&(g.map.value=m.map,e(m.map,g.uvTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,e(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function c(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.rotation.value=m.rotation,m.map&&(g.map.value=m.map,e(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,e(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function u(g,m){g.specular.value.copy(m.specular),g.shininess.value=Math.max(m.shininess,1e-4)}function f(g,m){m.gradientMap&&(g.gradientMap.value=m.gradientMap)}function p(g,m){g.metalness.value=m.metalness,m.metalnessMap&&(g.metalnessMap.value=m.metalnessMap,e(m.metalnessMap,g.metalnessMapTransform)),g.roughness.value=m.roughness,m.roughnessMap&&(g.roughnessMap.value=m.roughnessMap,e(m.roughnessMap,g.roughnessMapTransform)),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)}function _(g,m,L){g.ior.value=m.ior,m.sheen>0&&(g.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),g.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(g.sheenColorMap.value=m.sheenColorMap,e(m.sheenColorMap,g.sheenColorMapTransform)),m.sheenRoughnessMap&&(g.sheenRoughnessMap.value=m.sheenRoughnessMap,e(m.sheenRoughnessMap,g.sheenRoughnessMapTransform))),m.clearcoat>0&&(g.clearcoat.value=m.clearcoat,g.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(g.clearcoatMap.value=m.clearcoatMap,e(m.clearcoatMap,g.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,e(m.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(g.clearcoatNormalMap.value=m.clearcoatNormalMap,e(m.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===En&&g.clearcoatNormalScale.value.negate())),m.dispersion>0&&(g.dispersion.value=m.dispersion),m.iridescence>0&&(g.iridescence.value=m.iridescence,g.iridescenceIOR.value=m.iridescenceIOR,g.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(g.iridescenceMap.value=m.iridescenceMap,e(m.iridescenceMap,g.iridescenceMapTransform)),m.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=m.iridescenceThicknessMap,e(m.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),m.transmission>0&&(g.transmission.value=m.transmission,g.transmissionSamplerMap.value=L.texture,g.transmissionSamplerSize.value.set(L.width,L.height),m.transmissionMap&&(g.transmissionMap.value=m.transmissionMap,e(m.transmissionMap,g.transmissionMapTransform)),g.thickness.value=m.thickness,m.thicknessMap&&(g.thicknessMap.value=m.thicknessMap,e(m.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=m.attenuationDistance,g.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(g.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(g.anisotropyMap.value=m.anisotropyMap,e(m.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=m.specularIntensity,g.specularColor.value.copy(m.specularColor),m.specularColorMap&&(g.specularColorMap.value=m.specularColorMap,e(m.specularColorMap,g.specularColorMapTransform)),m.specularIntensityMap&&(g.specularIntensityMap.value=m.specularIntensityMap,e(m.specularIntensityMap,g.specularIntensityMapTransform))}function x(g,m){m.matcap&&(g.matcap.value=m.matcap)}function M(g,m){const L=t.get(m).light;g.referencePosition.value.setFromMatrixPosition(L.matrixWorld),g.nearDistance.value=L.shadow.camera.near,g.farDistance.value=L.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function lE(n,t,e,i){let r={},s={},o=[];const a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(L,R){const S=R.program;i.uniformBlockBinding(L,S)}function c(L,R){let S=r[L.id];S===void 0&&(x(L),S=u(L),r[L.id]=S,L.addEventListener("dispose",g));const V=R.program;i.updateUBOMapping(L,V);const C=t.render.frame;s[L.id]!==C&&(p(L),s[L.id]=C)}function u(L){const R=f();L.__bindingPointIndex=R;const S=n.createBuffer(),V=L.__size,C=L.usage;return n.bindBuffer(n.UNIFORM_BUFFER,S),n.bufferData(n.UNIFORM_BUFFER,V,C),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,R,S),S}function f(){for(let L=0;L<a;L++)if(o.indexOf(L)===-1)return o.push(L),L;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function p(L){const R=r[L.id],S=L.uniforms,V=L.__cache;n.bindBuffer(n.UNIFORM_BUFFER,R);for(let C=0,I=S.length;C<I;C++){const z=Array.isArray(S[C])?S[C]:[S[C]];for(let A=0,y=z.length;A<y;A++){const O=z[A];if(_(O,C,A,V)===!0){const lt=O.__offset,Q=Array.isArray(O.value)?O.value:[O.value];let ht=0;for(let St=0;St<Q.length;St++){const tt=Q[St],dt=M(tt);typeof tt=="number"||typeof tt=="boolean"?(O.__data[0]=tt,n.bufferSubData(n.UNIFORM_BUFFER,lt+ht,O.__data)):tt.isMatrix3?(O.__data[0]=tt.elements[0],O.__data[1]=tt.elements[1],O.__data[2]=tt.elements[2],O.__data[3]=0,O.__data[4]=tt.elements[3],O.__data[5]=tt.elements[4],O.__data[6]=tt.elements[5],O.__data[7]=0,O.__data[8]=tt.elements[6],O.__data[9]=tt.elements[7],O.__data[10]=tt.elements[8],O.__data[11]=0):(tt.toArray(O.__data,ht),ht+=dt.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,lt,O.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function _(L,R,S,V){const C=L.value,I=R+"_"+S;if(V[I]===void 0)return typeof C=="number"||typeof C=="boolean"?V[I]=C:V[I]=C.clone(),!0;{const z=V[I];if(typeof C=="number"||typeof C=="boolean"){if(z!==C)return V[I]=C,!0}else if(z.equals(C)===!1)return z.copy(C),!0}return!1}function x(L){const R=L.uniforms;let S=0;const V=16;for(let I=0,z=R.length;I<z;I++){const A=Array.isArray(R[I])?R[I]:[R[I]];for(let y=0,O=A.length;y<O;y++){const lt=A[y],Q=Array.isArray(lt.value)?lt.value:[lt.value];for(let ht=0,St=Q.length;ht<St;ht++){const tt=Q[ht],dt=M(tt),K=S%V,Rt=K%dt.boundary,Dt=K+Rt;S+=Rt,Dt!==0&&V-Dt<dt.storage&&(S+=V-Dt),lt.__data=new Float32Array(dt.storage/Float32Array.BYTES_PER_ELEMENT),lt.__offset=S,S+=dt.storage}}}const C=S%V;return C>0&&(S+=V-C),L.__size=S,L.__cache={},this}function M(L){const R={boundary:0,storage:0};return typeof L=="number"||typeof L=="boolean"?(R.boundary=4,R.storage=4):L.isVector2?(R.boundary=8,R.storage=8):L.isVector3||L.isColor?(R.boundary=16,R.storage=12):L.isVector4?(R.boundary=16,R.storage=16):L.isMatrix3?(R.boundary=48,R.storage=48):L.isMatrix4?(R.boundary=64,R.storage=64):L.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",L),R}function g(L){const R=L.target;R.removeEventListener("dispose",g);const S=o.indexOf(R.__bindingPointIndex);o.splice(S,1),n.deleteBuffer(r[R.id]),delete r[R.id],delete s[R.id]}function m(){for(const L in r)n.deleteBuffer(r[L]);o=[],r={},s={}}return{bind:l,update:c,dispose:m}}class cE{constructor(t={}){const{canvas:e=Hv(),context:i=null,depth:r=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reverseDepthBuffer:p=!1}=t;this.isWebGLRenderer=!0;let _;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=i.getContextAttributes().alpha}else _=o;const x=new Uint32Array(4),M=new Int32Array(4);let g=null,m=null;const L=[],R=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Cn,this.toneMapping=Ki,this.toneMappingExposure=1;const S=this;let V=!1,C=0,I=0,z=null,A=-1,y=null;const O=new $e,lt=new $e;let Q=null;const ht=new xe(0);let St=0,tt=e.width,dt=e.height,K=1,Rt=null,Dt=null;const Xt=new $e(0,0,tt,dt),te=new $e(0,0,tt,dt);let Ae=!1;const _t=new fu;let Ct=!1,Gt=!1;const Lt=new We,Qt=new We,ee=new j,me=new $e,D={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let N=!1;function Y(){return z===null?K:1}let w=i;function pt(E,W){return e.getContext(E,W)}try{const E={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${tu}`),e.addEventListener("webglcontextlost",Mt,!1),e.addEventListener("webglcontextrestored",Ft,!1),e.addEventListener("webglcontextcreationerror",Vt,!1),w===null){const W="webgl2";if(w=pt(W,E),w===null)throw pt(W)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let rt,gt,st,xt,q,T,v,B,Z,ot,et,bt,Tt,Et,ne,ct,Ut,kt,qt,It,ge,ce,De,k;function Nt(){rt=new vS(w),rt.init(),ce=new tE(w,rt),gt=new hS(w,rt,t,ce),st=new Jy(w,rt),gt.reverseDepthBuffer&&p&&st.buffers.depth.setReversed(!0),xt=new SS(w),q=new zy,T=new Qy(w,rt,st,q,gt,ce,xt),v=new pS(S),B=new gS(S),Z=new R0(w),De=new uS(w,Z),ot=new xS(w,Z,xt,De),et=new ES(w,ot,Z,xt),qt=new yS(w,gt,T),ct=new dS(q),bt=new By(S,v,B,rt,gt,De,ct),Tt=new aE(S,q),Et=new Hy,ne=new Yy(rt),kt=new cS(S,v,B,st,et,_,l),Ut=new Ky(S,et,gt),k=new lE(w,xt,gt,st),It=new fS(w,rt,xt),ge=new MS(w,rt,xt),xt.programs=bt.programs,S.capabilities=gt,S.extensions=rt,S.properties=q,S.renderLists=Et,S.shadowMap=Ut,S.state=st,S.info=xt}Nt();const ut=new sE(S,w);this.xr=ut,this.getContext=function(){return w},this.getContextAttributes=function(){return w.getContextAttributes()},this.forceContextLoss=function(){const E=rt.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){const E=rt.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return K},this.setPixelRatio=function(E){E!==void 0&&(K=E,this.setSize(tt,dt,!1))},this.getSize=function(E){return E.set(tt,dt)},this.setSize=function(E,W,nt=!0){if(ut.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}tt=E,dt=W,e.width=Math.floor(E*K),e.height=Math.floor(W*K),nt===!0&&(e.style.width=E+"px",e.style.height=W+"px"),this.setViewport(0,0,E,W)},this.getDrawingBufferSize=function(E){return E.set(tt*K,dt*K).floor()},this.setDrawingBufferSize=function(E,W,nt){tt=E,dt=W,K=nt,e.width=Math.floor(E*nt),e.height=Math.floor(W*nt),this.setViewport(0,0,E,W)},this.getCurrentViewport=function(E){return E.copy(O)},this.getViewport=function(E){return E.copy(Xt)},this.setViewport=function(E,W,nt,it){E.isVector4?Xt.set(E.x,E.y,E.z,E.w):Xt.set(E,W,nt,it),st.viewport(O.copy(Xt).multiplyScalar(K).round())},this.getScissor=function(E){return E.copy(te)},this.setScissor=function(E,W,nt,it){E.isVector4?te.set(E.x,E.y,E.z,E.w):te.set(E,W,nt,it),st.scissor(lt.copy(te).multiplyScalar(K).round())},this.getScissorTest=function(){return Ae},this.setScissorTest=function(E){st.setScissorTest(Ae=E)},this.setOpaqueSort=function(E){Rt=E},this.setTransparentSort=function(E){Dt=E},this.getClearColor=function(E){return E.copy(kt.getClearColor())},this.setClearColor=function(){kt.setClearColor.apply(kt,arguments)},this.getClearAlpha=function(){return kt.getClearAlpha()},this.setClearAlpha=function(){kt.setClearAlpha.apply(kt,arguments)},this.clear=function(E=!0,W=!0,nt=!0){let it=0;if(E){let G=!1;if(z!==null){const At=z.texture.format;G=At===ou||At===su||At===ru}if(G){const At=z.texture.type,Ot=At===Di||At===Cr||At===to||At===ms||At===nu||At===iu,Ht=kt.getClearColor(),$t=kt.getClearAlpha(),re=Ht.r,ae=Ht.g,Zt=Ht.b;Ot?(x[0]=re,x[1]=ae,x[2]=Zt,x[3]=$t,w.clearBufferuiv(w.COLOR,0,x)):(M[0]=re,M[1]=ae,M[2]=Zt,M[3]=$t,w.clearBufferiv(w.COLOR,0,M))}else it|=w.COLOR_BUFFER_BIT}W&&(it|=w.DEPTH_BUFFER_BIT),nt&&(it|=w.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),w.clear(it)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Mt,!1),e.removeEventListener("webglcontextrestored",Ft,!1),e.removeEventListener("webglcontextcreationerror",Vt,!1),kt.dispose(),Et.dispose(),ne.dispose(),q.dispose(),v.dispose(),B.dispose(),et.dispose(),De.dispose(),k.dispose(),bt.dispose(),ut.dispose(),ut.removeEventListener("sessionstart",ao),ut.removeEventListener("sessionend",lo),hi.stop()};function Mt(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),V=!0}function Ft(){console.log("THREE.WebGLRenderer: Context Restored."),V=!1;const E=xt.autoReset,W=Ut.enabled,nt=Ut.autoUpdate,it=Ut.needsUpdate,G=Ut.type;Nt(),xt.autoReset=E,Ut.enabled=W,Ut.autoUpdate=nt,Ut.needsUpdate=it,Ut.type=G}function Vt(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function oe(E){const W=E.target;W.removeEventListener("dispose",oe),Ne(W)}function Ne(E){je(E),q.remove(E)}function je(E){const W=q.get(E).programs;W!==void 0&&(W.forEach(function(nt){bt.releaseProgram(nt)}),E.isShaderMaterial&&bt.releaseShaderCache(E))}this.renderBufferDirect=function(E,W,nt,it,G,At){W===null&&(W=D);const Ot=G.isMesh&&G.matrixWorld.determinant()<0,Ht=Fa(E,W,nt,it,G);st.setMaterial(it,Ot);let $t=nt.index,re=1;if(it.wireframe===!0){if($t=ot.getWireframeAttribute(nt),$t===void 0)return;re=2}const ae=nt.drawRange,Zt=nt.attributes.position;let Me=ae.start*re,ye=(ae.start+ae.count)*re;At!==null&&(Me=Math.max(Me,At.start*re),ye=Math.min(ye,(At.start+At.count)*re)),$t!==null?(Me=Math.max(Me,0),ye=Math.min(ye,$t.count)):Zt!=null&&(Me=Math.max(Me,0),ye=Math.min(ye,Zt.count));const Xe=ye-Me;if(Xe<0||Xe===1/0)return;De.setup(G,it,Ht,nt,$t);let He,Ee=It;if($t!==null&&(He=Z.get($t),Ee=ge,Ee.setIndex(He)),G.isMesh)it.wireframe===!0?(st.setLineWidth(it.wireframeLinewidth*Y()),Ee.setMode(w.LINES)):Ee.setMode(w.TRIANGLES);else if(G.isLine){let Jt=it.linewidth;Jt===void 0&&(Jt=1),st.setLineWidth(Jt*Y()),G.isLineSegments?Ee.setMode(w.LINES):G.isLineLoop?Ee.setMode(w.LINE_LOOP):Ee.setMode(w.LINE_STRIP)}else G.isPoints?Ee.setMode(w.POINTS):G.isSprite&&Ee.setMode(w.TRIANGLES);if(G.isBatchedMesh)if(G._multiDrawInstances!==null)Ee.renderMultiDrawInstances(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount,G._multiDrawInstances);else if(rt.get("WEBGL_multi_draw"))Ee.renderMultiDraw(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount);else{const Jt=G._multiDrawStarts,ke=G._multiDrawCounts,be=G._multiDrawCount,Re=$t?Z.get($t).bytesPerElement:1,di=q.get(it).currentProgram.getUniforms();for(let fn=0;fn<be;fn++)di.setValue(w,"_gl_DrawID",fn),Ee.render(Jt[fn]/Re,ke[fn])}else if(G.isInstancedMesh)Ee.renderInstances(Me,Xe,G.count);else if(nt.isInstancedBufferGeometry){const Jt=nt._maxInstanceCount!==void 0?nt._maxInstanceCount:1/0,ke=Math.min(nt.instanceCount,Jt);Ee.renderInstances(Me,Xe,ke)}else Ee.render(Me,Xe)};function we(E,W,nt){E.transparent===!0&&E.side===Ln&&E.forceSinglePass===!1?(E.side=En,E.needsUpdate=!0,tr(E,W,nt),E.side=Zi,E.needsUpdate=!0,tr(E,W,nt),E.side=Ln):tr(E,W,nt)}this.compile=function(E,W,nt=null){nt===null&&(nt=E),m=ne.get(nt),m.init(W),R.push(m),nt.traverseVisible(function(G){G.isLight&&G.layers.test(W.layers)&&(m.pushLight(G),G.castShadow&&m.pushShadow(G))}),E!==nt&&E.traverseVisible(function(G){G.isLight&&G.layers.test(W.layers)&&(m.pushLight(G),G.castShadow&&m.pushShadow(G))}),m.setupLights();const it=new Set;return E.traverse(function(G){if(!(G.isMesh||G.isPoints||G.isLine||G.isSprite))return;const At=G.material;if(At)if(Array.isArray(At))for(let Ot=0;Ot<At.length;Ot++){const Ht=At[Ot];we(Ht,nt,G),it.add(Ht)}else we(At,nt,G),it.add(At)}),R.pop(),m=null,it},this.compileAsync=function(E,W,nt=null){const it=this.compile(E,W,nt);return new Promise(G=>{function At(){if(it.forEach(function(Ot){q.get(Ot).currentProgram.isReady()&&it.delete(Ot)}),it.size===0){G(E);return}setTimeout(At,10)}rt.get("KHR_parallel_shader_compile")!==null?At():setTimeout(At,10)})};let en=null;function On(E){en&&en(E)}function ao(){hi.stop()}function lo(){hi.start()}const hi=new tp;hi.setAnimationLoop(On),typeof self<"u"&&hi.setContext(self),this.setAnimationLoop=function(E){en=E,ut.setAnimationLoop(E),E===null?hi.stop():hi.start()},ut.addEventListener("sessionstart",ao),ut.addEventListener("sessionend",lo),this.render=function(E,W){if(W!==void 0&&W.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(V===!0)return;if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),W.parent===null&&W.matrixWorldAutoUpdate===!0&&W.updateMatrixWorld(),ut.enabled===!0&&ut.isPresenting===!0&&(ut.cameraAutoUpdate===!0&&ut.updateCamera(W),W=ut.getCamera()),E.isScene===!0&&E.onBeforeRender(S,E,W,z),m=ne.get(E,R.length),m.init(W),R.push(m),Qt.multiplyMatrices(W.projectionMatrix,W.matrixWorldInverse),_t.setFromProjectionMatrix(Qt),Gt=this.localClippingEnabled,Ct=ct.init(this.clippingPlanes,Gt),g=Et.get(E,L.length),g.init(),L.push(g),ut.enabled===!0&&ut.isPresenting===!0){const At=S.xr.getDepthSensingMesh();At!==null&&Qi(At,W,-1/0,S.sortObjects)}Qi(E,W,0,S.sortObjects),g.finish(),S.sortObjects===!0&&g.sort(Rt,Dt),N=ut.enabled===!1||ut.isPresenting===!1||ut.hasDepthSensing()===!1,N&&kt.addToRenderList(g,E),this.info.render.frame++,Ct===!0&&ct.beginShadows();const nt=m.state.shadowsArray;Ut.render(nt,E,W),Ct===!0&&ct.endShadows(),this.info.autoReset===!0&&this.info.reset();const it=g.opaque,G=g.transmissive;if(m.setupLights(),W.isArrayCamera){const At=W.cameras;if(G.length>0)for(let Ot=0,Ht=At.length;Ot<Ht;Ot++){const $t=At[Ot];co(it,G,E,$t)}N&&kt.render(E);for(let Ot=0,Ht=At.length;Ot<Ht;Ot++){const $t=At[Ot];Ir(g,E,$t,$t.viewport)}}else G.length>0&&co(it,G,E,W),N&&kt.render(E),Ir(g,E,W);z!==null&&(T.updateMultisampleRenderTarget(z),T.updateRenderTargetMipmap(z)),E.isScene===!0&&E.onAfterRender(S,E,W),De.resetDefaultState(),A=-1,y=null,R.pop(),R.length>0?(m=R[R.length-1],Ct===!0&&ct.setGlobalState(S.clippingPlanes,m.state.camera)):m=null,L.pop(),L.length>0?g=L[L.length-1]:g=null};function Qi(E,W,nt,it){if(E.visible===!1)return;if(E.layers.test(W.layers)){if(E.isGroup)nt=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(W);else if(E.isLight)m.pushLight(E),E.castShadow&&m.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||_t.intersectsSprite(E)){it&&me.setFromMatrixPosition(E.matrixWorld).applyMatrix4(Qt);const Ot=et.update(E),Ht=E.material;Ht.visible&&g.push(E,Ot,Ht,nt,me.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||_t.intersectsObject(E))){const Ot=et.update(E),Ht=E.material;if(it&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),me.copy(E.boundingSphere.center)):(Ot.boundingSphere===null&&Ot.computeBoundingSphere(),me.copy(Ot.boundingSphere.center)),me.applyMatrix4(E.matrixWorld).applyMatrix4(Qt)),Array.isArray(Ht)){const $t=Ot.groups;for(let re=0,ae=$t.length;re<ae;re++){const Zt=$t[re],Me=Ht[Zt.materialIndex];Me&&Me.visible&&g.push(E,Ot,Me,nt,me.z,Zt)}}else Ht.visible&&g.push(E,Ot,Ht,nt,me.z,null)}}const At=E.children;for(let Ot=0,Ht=At.length;Ot<Ht;Ot++)Qi(At[Ot],W,nt,it)}function Ir(E,W,nt,it){const G=E.opaque,At=E.transmissive,Ot=E.transparent;m.setupLightsView(nt),Ct===!0&&ct.setGlobalState(S.clippingPlanes,nt),it&&st.viewport(O.copy(it)),G.length>0&&Ur(G,W,nt),At.length>0&&Ur(At,W,nt),Ot.length>0&&Ur(Ot,W,nt),st.buffers.depth.setTest(!0),st.buffers.depth.setMask(!0),st.buffers.color.setMask(!0),st.setPolygonOffset(!1)}function co(E,W,nt,it){if((nt.isScene===!0?nt.overrideMaterial:null)!==null)return;m.state.transmissionRenderTarget[it.id]===void 0&&(m.state.transmissionRenderTarget[it.id]=new Pr(1,1,{generateMipmaps:!0,type:rt.has("EXT_color_buffer_half_float")||rt.has("EXT_color_buffer_float")?ro:Di,minFilter:yr,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ce.workingColorSpace}));const At=m.state.transmissionRenderTarget[it.id],Ot=it.viewport||O;At.setSize(Ot.z,Ot.w);const Ht=S.getRenderTarget();S.setRenderTarget(At),S.getClearColor(ht),St=S.getClearAlpha(),St<1&&S.setClearColor(16777215,.5),S.clear(),N&&kt.render(nt);const $t=S.toneMapping;S.toneMapping=Ki;const re=it.viewport;if(it.viewport!==void 0&&(it.viewport=void 0),m.setupLightsView(it),Ct===!0&&ct.setGlobalState(S.clippingPlanes,it),Ur(E,nt,it),T.updateMultisampleRenderTarget(At),T.updateRenderTargetMipmap(At),rt.has("WEBGL_multisampled_render_to_texture")===!1){let ae=!1;for(let Zt=0,Me=W.length;Zt<Me;Zt++){const ye=W[Zt],Xe=ye.object,He=ye.geometry,Ee=ye.material,Jt=ye.group;if(Ee.side===Ln&&Xe.layers.test(it.layers)){const ke=Ee.side;Ee.side=En,Ee.needsUpdate=!0,uo(Xe,nt,it,He,Ee,Jt),Ee.side=ke,Ee.needsUpdate=!0,ae=!0}}ae===!0&&(T.updateMultisampleRenderTarget(At),T.updateRenderTargetMipmap(At))}S.setRenderTarget(Ht),S.setClearColor(ht,St),re!==void 0&&(it.viewport=re),S.toneMapping=$t}function Ur(E,W,nt){const it=W.isScene===!0?W.overrideMaterial:null;for(let G=0,At=E.length;G<At;G++){const Ot=E[G],Ht=Ot.object,$t=Ot.geometry,re=it===null?Ot.material:it,ae=Ot.group;Ht.layers.test(nt.layers)&&uo(Ht,W,nt,$t,re,ae)}}function uo(E,W,nt,it,G,At){E.onBeforeRender(S,W,nt,it,G,At),E.modelViewMatrix.multiplyMatrices(nt.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),G.onBeforeRender(S,W,nt,it,E,At),G.transparent===!0&&G.side===Ln&&G.forceSinglePass===!1?(G.side=En,G.needsUpdate=!0,S.renderBufferDirect(nt,W,it,G,E,At),G.side=Zi,G.needsUpdate=!0,S.renderBufferDirect(nt,W,it,G,E,At),G.side=Ln):S.renderBufferDirect(nt,W,it,G,E,At),E.onAfterRender(S,W,nt,it,G,At)}function tr(E,W,nt){W.isScene!==!0&&(W=D);const it=q.get(E),G=m.state.lights,At=m.state.shadowsArray,Ot=G.state.version,Ht=bt.getParameters(E,G.state,At,W,nt),$t=bt.getProgramCacheKey(Ht);let re=it.programs;it.environment=E.isMeshStandardMaterial?W.environment:null,it.fog=W.fog,it.envMap=(E.isMeshStandardMaterial?B:v).get(E.envMap||it.environment),it.envMapRotation=it.environment!==null&&E.envMap===null?W.environmentRotation:E.envMapRotation,re===void 0&&(E.addEventListener("dispose",oe),re=new Map,it.programs=re);let ae=re.get($t);if(ae!==void 0){if(it.currentProgram===ae&&it.lightsStateVersion===Ot)return ho(E,Ht),ae}else Ht.uniforms=bt.getUniforms(E),E.onBeforeCompile(Ht,S),ae=bt.acquireProgram(Ht,$t),re.set($t,ae),it.uniforms=Ht.uniforms;const Zt=it.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Zt.clippingPlanes=ct.uniform),ho(E,Ht),it.needsLights=Oa(E),it.lightsStateVersion=Ot,it.needsLights&&(Zt.ambientLightColor.value=G.state.ambient,Zt.lightProbe.value=G.state.probe,Zt.directionalLights.value=G.state.directional,Zt.directionalLightShadows.value=G.state.directionalShadow,Zt.spotLights.value=G.state.spot,Zt.spotLightShadows.value=G.state.spotShadow,Zt.rectAreaLights.value=G.state.rectArea,Zt.ltc_1.value=G.state.rectAreaLTC1,Zt.ltc_2.value=G.state.rectAreaLTC2,Zt.pointLights.value=G.state.point,Zt.pointLightShadows.value=G.state.pointShadow,Zt.hemisphereLights.value=G.state.hemi,Zt.directionalShadowMap.value=G.state.directionalShadowMap,Zt.directionalShadowMatrix.value=G.state.directionalShadowMatrix,Zt.spotShadowMap.value=G.state.spotShadowMap,Zt.spotLightMatrix.value=G.state.spotLightMatrix,Zt.spotLightMap.value=G.state.spotLightMap,Zt.pointShadowMap.value=G.state.pointShadowMap,Zt.pointShadowMatrix.value=G.state.pointShadowMatrix),it.currentProgram=ae,it.uniformsList=null,ae}function fo(E){if(E.uniformsList===null){const W=E.currentProgram.getUniforms();E.uniformsList=ta.seqWithValue(W.seq,E.uniforms)}return E.uniformsList}function ho(E,W){const nt=q.get(E);nt.outputColorSpace=W.outputColorSpace,nt.batching=W.batching,nt.batchingColor=W.batchingColor,nt.instancing=W.instancing,nt.instancingColor=W.instancingColor,nt.instancingMorph=W.instancingMorph,nt.skinning=W.skinning,nt.morphTargets=W.morphTargets,nt.morphNormals=W.morphNormals,nt.morphColors=W.morphColors,nt.morphTargetsCount=W.morphTargetsCount,nt.numClippingPlanes=W.numClippingPlanes,nt.numIntersection=W.numClipIntersection,nt.vertexAlphas=W.vertexAlphas,nt.vertexTangents=W.vertexTangents,nt.toneMapping=W.toneMapping}function Fa(E,W,nt,it,G){W.isScene!==!0&&(W=D),T.resetTextureUnits();const At=W.fog,Ot=it.isMeshStandardMaterial?W.environment:null,Ht=z===null?S.outputColorSpace:z.isXRRenderTarget===!0?z.texture.colorSpace:gs,$t=(it.isMeshStandardMaterial?B:v).get(it.envMap||Ot),re=it.vertexColors===!0&&!!nt.attributes.color&&nt.attributes.color.itemSize===4,ae=!!nt.attributes.tangent&&(!!it.normalMap||it.anisotropy>0),Zt=!!nt.morphAttributes.position,Me=!!nt.morphAttributes.normal,ye=!!nt.morphAttributes.color;let Xe=Ki;it.toneMapped&&(z===null||z.isXRRenderTarget===!0)&&(Xe=S.toneMapping);const He=nt.morphAttributes.position||nt.morphAttributes.normal||nt.morphAttributes.color,Ee=He!==void 0?He.length:0,Jt=q.get(it),ke=m.state.lights;if(Ct===!0&&(Gt===!0||E!==y)){const nn=E===y&&it.id===A;ct.setState(it,E,nn)}let be=!1;it.version===Jt.__version?(Jt.needsLights&&Jt.lightsStateVersion!==ke.state.version||Jt.outputColorSpace!==Ht||G.isBatchedMesh&&Jt.batching===!1||!G.isBatchedMesh&&Jt.batching===!0||G.isBatchedMesh&&Jt.batchingColor===!0&&G.colorTexture===null||G.isBatchedMesh&&Jt.batchingColor===!1&&G.colorTexture!==null||G.isInstancedMesh&&Jt.instancing===!1||!G.isInstancedMesh&&Jt.instancing===!0||G.isSkinnedMesh&&Jt.skinning===!1||!G.isSkinnedMesh&&Jt.skinning===!0||G.isInstancedMesh&&Jt.instancingColor===!0&&G.instanceColor===null||G.isInstancedMesh&&Jt.instancingColor===!1&&G.instanceColor!==null||G.isInstancedMesh&&Jt.instancingMorph===!0&&G.morphTexture===null||G.isInstancedMesh&&Jt.instancingMorph===!1&&G.morphTexture!==null||Jt.envMap!==$t||it.fog===!0&&Jt.fog!==At||Jt.numClippingPlanes!==void 0&&(Jt.numClippingPlanes!==ct.numPlanes||Jt.numIntersection!==ct.numIntersection)||Jt.vertexAlphas!==re||Jt.vertexTangents!==ae||Jt.morphTargets!==Zt||Jt.morphNormals!==Me||Jt.morphColors!==ye||Jt.toneMapping!==Xe||Jt.morphTargetsCount!==Ee)&&(be=!0):(be=!0,Jt.__version=it.version);let Re=Jt.currentProgram;be===!0&&(Re=tr(it,W,G));let di=!1,fn=!1,pi=!1;const Be=Re.getUniforms(),Mn=Jt.uniforms;if(st.useProgram(Re.program)&&(di=!0,fn=!0,pi=!0),it.id!==A&&(A=it.id,fn=!0),di||y!==E){st.buffers.depth.getReversed()?(Lt.copy(E.projectionMatrix),Gv(Lt),Wv(Lt),Be.setValue(w,"projectionMatrix",Lt)):Be.setValue(w,"projectionMatrix",E.projectionMatrix),Be.setValue(w,"viewMatrix",E.matrixWorldInverse);const on=Be.map.cameraPosition;on!==void 0&&on.setValue(w,ee.setFromMatrixPosition(E.matrixWorld)),gt.logarithmicDepthBuffer&&Be.setValue(w,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(it.isMeshPhongMaterial||it.isMeshToonMaterial||it.isMeshLambertMaterial||it.isMeshBasicMaterial||it.isMeshStandardMaterial||it.isShaderMaterial)&&Be.setValue(w,"isOrthographic",E.isOrthographicCamera===!0),y!==E&&(y=E,fn=!0,pi=!0)}if(G.isSkinnedMesh){Be.setOptional(w,G,"bindMatrix"),Be.setOptional(w,G,"bindMatrixInverse");const nn=G.skeleton;nn&&(nn.boneTexture===null&&nn.computeBoneTexture(),Be.setValue(w,"boneTexture",nn.boneTexture,T))}G.isBatchedMesh&&(Be.setOptional(w,G,"batchingTexture"),Be.setValue(w,"batchingTexture",G._matricesTexture,T),Be.setOptional(w,G,"batchingIdTexture"),Be.setValue(w,"batchingIdTexture",G._indirectTexture,T),Be.setOptional(w,G,"batchingColorTexture"),G._colorsTexture!==null&&Be.setValue(w,"batchingColorTexture",G._colorsTexture,T));const hn=nt.morphAttributes;if((hn.position!==void 0||hn.normal!==void 0||hn.color!==void 0)&&qt.update(G,nt,Re),(fn||Jt.receiveShadow!==G.receiveShadow)&&(Jt.receiveShadow=G.receiveShadow,Be.setValue(w,"receiveShadow",G.receiveShadow)),it.isMeshGouraudMaterial&&it.envMap!==null&&(Mn.envMap.value=$t,Mn.flipEnvMap.value=$t.isCubeTexture&&$t.isRenderTargetTexture===!1?-1:1),it.isMeshStandardMaterial&&it.envMap===null&&W.environment!==null&&(Mn.envMapIntensity.value=W.environmentIntensity),fn&&(Be.setValue(w,"toneMappingExposure",S.toneMappingExposure),Jt.needsLights&&Nr(Mn,pi),At&&it.fog===!0&&Tt.refreshFogUniforms(Mn,At),Tt.refreshMaterialUniforms(Mn,it,K,dt,m.state.transmissionRenderTarget[E.id]),ta.upload(w,fo(Jt),Mn,T)),it.isShaderMaterial&&it.uniformsNeedUpdate===!0&&(ta.upload(w,fo(Jt),Mn,T),it.uniformsNeedUpdate=!1),it.isSpriteMaterial&&Be.setValue(w,"center",G.center),Be.setValue(w,"modelViewMatrix",G.modelViewMatrix),Be.setValue(w,"normalMatrix",G.normalMatrix),Be.setValue(w,"modelMatrix",G.matrixWorld),it.isShaderMaterial||it.isRawShaderMaterial){const nn=it.uniformsGroups;for(let on=0,Ts=nn.length;on<Ts;on++){const mi=nn[on];k.update(mi,Re),k.bind(mi,Re)}}return Re}function Nr(E,W){E.ambientLightColor.needsUpdate=W,E.lightProbe.needsUpdate=W,E.directionalLights.needsUpdate=W,E.directionalLightShadows.needsUpdate=W,E.pointLights.needsUpdate=W,E.pointLightShadows.needsUpdate=W,E.spotLights.needsUpdate=W,E.spotLightShadows.needsUpdate=W,E.rectAreaLights.needsUpdate=W,E.hemisphereLights.needsUpdate=W}function Oa(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return C},this.getActiveMipmapLevel=function(){return I},this.getRenderTarget=function(){return z},this.setRenderTargetTextures=function(E,W,nt){q.get(E.texture).__webglTexture=W,q.get(E.depthTexture).__webglTexture=nt;const it=q.get(E);it.__hasExternalTextures=!0,it.__autoAllocateDepthBuffer=nt===void 0,it.__autoAllocateDepthBuffer||rt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),it.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(E,W){const nt=q.get(E);nt.__webglFramebuffer=W,nt.__useDefaultFramebuffer=W===void 0},this.setRenderTarget=function(E,W=0,nt=0){z=E,C=W,I=nt;let it=!0,G=null,At=!1,Ot=!1;if(E){const $t=q.get(E);if($t.__useDefaultFramebuffer!==void 0)st.bindFramebuffer(w.FRAMEBUFFER,null),it=!1;else if($t.__webglFramebuffer===void 0)T.setupRenderTarget(E);else if($t.__hasExternalTextures)T.rebindTextures(E,q.get(E.texture).__webglTexture,q.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){const Zt=E.depthTexture;if($t.__boundDepthTexture!==Zt){if(Zt!==null&&q.has(Zt)&&(E.width!==Zt.image.width||E.height!==Zt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");T.setupDepthRenderbuffer(E)}}const re=E.texture;(re.isData3DTexture||re.isDataArrayTexture||re.isCompressedArrayTexture)&&(Ot=!0);const ae=q.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(ae[W])?G=ae[W][nt]:G=ae[W],At=!0):E.samples>0&&T.useMultisampledRTT(E)===!1?G=q.get(E).__webglMultisampledFramebuffer:Array.isArray(ae)?G=ae[nt]:G=ae,O.copy(E.viewport),lt.copy(E.scissor),Q=E.scissorTest}else O.copy(Xt).multiplyScalar(K).floor(),lt.copy(te).multiplyScalar(K).floor(),Q=Ae;if(st.bindFramebuffer(w.FRAMEBUFFER,G)&&it&&st.drawBuffers(E,G),st.viewport(O),st.scissor(lt),st.setScissorTest(Q),At){const $t=q.get(E.texture);w.framebufferTexture2D(w.FRAMEBUFFER,w.COLOR_ATTACHMENT0,w.TEXTURE_CUBE_MAP_POSITIVE_X+W,$t.__webglTexture,nt)}else if(Ot){const $t=q.get(E.texture),re=W||0;w.framebufferTextureLayer(w.FRAMEBUFFER,w.COLOR_ATTACHMENT0,$t.__webglTexture,nt||0,re)}A=-1},this.readRenderTargetPixels=function(E,W,nt,it,G,At,Ot){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ht=q.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Ot!==void 0&&(Ht=Ht[Ot]),Ht){st.bindFramebuffer(w.FRAMEBUFFER,Ht);try{const $t=E.texture,re=$t.format,ae=$t.type;if(!gt.textureFormatReadable(re)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!gt.textureTypeReadable(ae)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}W>=0&&W<=E.width-it&&nt>=0&&nt<=E.height-G&&w.readPixels(W,nt,it,G,ce.convert(re),ce.convert(ae),At)}finally{const $t=z!==null?q.get(z).__webglFramebuffer:null;st.bindFramebuffer(w.FRAMEBUFFER,$t)}}},this.readRenderTargetPixelsAsync=async function(E,W,nt,it,G,At,Ot){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ht=q.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Ot!==void 0&&(Ht=Ht[Ot]),Ht){const $t=E.texture,re=$t.format,ae=$t.type;if(!gt.textureFormatReadable(re))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!gt.textureTypeReadable(ae))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(W>=0&&W<=E.width-it&&nt>=0&&nt<=E.height-G){st.bindFramebuffer(w.FRAMEBUFFER,Ht);const Zt=w.createBuffer();w.bindBuffer(w.PIXEL_PACK_BUFFER,Zt),w.bufferData(w.PIXEL_PACK_BUFFER,At.byteLength,w.STREAM_READ),w.readPixels(W,nt,it,G,ce.convert(re),ce.convert(ae),0);const Me=z!==null?q.get(z).__webglFramebuffer:null;st.bindFramebuffer(w.FRAMEBUFFER,Me);const ye=w.fenceSync(w.SYNC_GPU_COMMANDS_COMPLETE,0);return w.flush(),await kv(w,ye,4),w.bindBuffer(w.PIXEL_PACK_BUFFER,Zt),w.getBufferSubData(w.PIXEL_PACK_BUFFER,0,At),w.deleteBuffer(Zt),w.deleteSync(ye),At}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(E,W=null,nt=0){E.isTexture!==!0&&(es("WebGLRenderer: copyFramebufferToTexture function signature has changed."),W=arguments[0]||null,E=arguments[1]);const it=Math.pow(2,-nt),G=Math.floor(E.image.width*it),At=Math.floor(E.image.height*it),Ot=W!==null?W.x:0,Ht=W!==null?W.y:0;T.setTexture2D(E,0),w.copyTexSubImage2D(w.TEXTURE_2D,nt,0,0,Ot,Ht,G,At),st.unbindTexture()};const Ba=w.createFramebuffer(),Fr=w.createFramebuffer();this.copyTextureToTexture=function(E,W,nt=null,it=null,G=0,At=null){E.isTexture!==!0&&(es("WebGLRenderer: copyTextureToTexture function signature has changed."),it=arguments[0]||null,E=arguments[1],W=arguments[2],At=arguments[3]||0,nt=null),At===null&&(G!==0?(es("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),At=G,G=0):At=0);let Ot,Ht,$t,re,ae,Zt,Me,ye,Xe;const He=E.isCompressedTexture?E.mipmaps[At]:E.image;if(nt!==null)Ot=nt.max.x-nt.min.x,Ht=nt.max.y-nt.min.y,$t=nt.isBox3?nt.max.z-nt.min.z:1,re=nt.min.x,ae=nt.min.y,Zt=nt.isBox3?nt.min.z:0;else{const hn=Math.pow(2,-G);Ot=Math.floor(He.width*hn),Ht=Math.floor(He.height*hn),E.isDataArrayTexture?$t=He.depth:E.isData3DTexture?$t=Math.floor(He.depth*hn):$t=1,re=0,ae=0,Zt=0}it!==null?(Me=it.x,ye=it.y,Xe=it.z):(Me=0,ye=0,Xe=0);const Ee=ce.convert(W.format),Jt=ce.convert(W.type);let ke;W.isData3DTexture?(T.setTexture3D(W,0),ke=w.TEXTURE_3D):W.isDataArrayTexture||W.isCompressedArrayTexture?(T.setTexture2DArray(W,0),ke=w.TEXTURE_2D_ARRAY):(T.setTexture2D(W,0),ke=w.TEXTURE_2D),w.pixelStorei(w.UNPACK_FLIP_Y_WEBGL,W.flipY),w.pixelStorei(w.UNPACK_PREMULTIPLY_ALPHA_WEBGL,W.premultiplyAlpha),w.pixelStorei(w.UNPACK_ALIGNMENT,W.unpackAlignment);const be=w.getParameter(w.UNPACK_ROW_LENGTH),Re=w.getParameter(w.UNPACK_IMAGE_HEIGHT),di=w.getParameter(w.UNPACK_SKIP_PIXELS),fn=w.getParameter(w.UNPACK_SKIP_ROWS),pi=w.getParameter(w.UNPACK_SKIP_IMAGES);w.pixelStorei(w.UNPACK_ROW_LENGTH,He.width),w.pixelStorei(w.UNPACK_IMAGE_HEIGHT,He.height),w.pixelStorei(w.UNPACK_SKIP_PIXELS,re),w.pixelStorei(w.UNPACK_SKIP_ROWS,ae),w.pixelStorei(w.UNPACK_SKIP_IMAGES,Zt);const Be=E.isDataArrayTexture||E.isData3DTexture,Mn=W.isDataArrayTexture||W.isData3DTexture;if(E.isDepthTexture){const hn=q.get(E),nn=q.get(W),on=q.get(hn.__renderTarget),Ts=q.get(nn.__renderTarget);st.bindFramebuffer(w.READ_FRAMEBUFFER,on.__webglFramebuffer),st.bindFramebuffer(w.DRAW_FRAMEBUFFER,Ts.__webglFramebuffer);for(let mi=0;mi<$t;mi++)Be&&(w.framebufferTextureLayer(w.READ_FRAMEBUFFER,w.COLOR_ATTACHMENT0,q.get(E).__webglTexture,G,Zt+mi),w.framebufferTextureLayer(w.DRAW_FRAMEBUFFER,w.COLOR_ATTACHMENT0,q.get(W).__webglTexture,At,Xe+mi)),w.blitFramebuffer(re,ae,Ot,Ht,Me,ye,Ot,Ht,w.DEPTH_BUFFER_BIT,w.NEAREST);st.bindFramebuffer(w.READ_FRAMEBUFFER,null),st.bindFramebuffer(w.DRAW_FRAMEBUFFER,null)}else if(G!==0||E.isRenderTargetTexture||q.has(E)){const hn=q.get(E),nn=q.get(W);st.bindFramebuffer(w.READ_FRAMEBUFFER,Ba),st.bindFramebuffer(w.DRAW_FRAMEBUFFER,Fr);for(let on=0;on<$t;on++)Be?w.framebufferTextureLayer(w.READ_FRAMEBUFFER,w.COLOR_ATTACHMENT0,hn.__webglTexture,G,Zt+on):w.framebufferTexture2D(w.READ_FRAMEBUFFER,w.COLOR_ATTACHMENT0,w.TEXTURE_2D,hn.__webglTexture,G),Mn?w.framebufferTextureLayer(w.DRAW_FRAMEBUFFER,w.COLOR_ATTACHMENT0,nn.__webglTexture,At,Xe+on):w.framebufferTexture2D(w.DRAW_FRAMEBUFFER,w.COLOR_ATTACHMENT0,w.TEXTURE_2D,nn.__webglTexture,At),G!==0?w.blitFramebuffer(re,ae,Ot,Ht,Me,ye,Ot,Ht,w.COLOR_BUFFER_BIT,w.NEAREST):Mn?w.copyTexSubImage3D(ke,At,Me,ye,Xe+on,re,ae,Ot,Ht):w.copyTexSubImage2D(ke,At,Me,ye,re,ae,Ot,Ht);st.bindFramebuffer(w.READ_FRAMEBUFFER,null),st.bindFramebuffer(w.DRAW_FRAMEBUFFER,null)}else Mn?E.isDataTexture||E.isData3DTexture?w.texSubImage3D(ke,At,Me,ye,Xe,Ot,Ht,$t,Ee,Jt,He.data):W.isCompressedArrayTexture?w.compressedTexSubImage3D(ke,At,Me,ye,Xe,Ot,Ht,$t,Ee,He.data):w.texSubImage3D(ke,At,Me,ye,Xe,Ot,Ht,$t,Ee,Jt,He):E.isDataTexture?w.texSubImage2D(w.TEXTURE_2D,At,Me,ye,Ot,Ht,Ee,Jt,He.data):E.isCompressedTexture?w.compressedTexSubImage2D(w.TEXTURE_2D,At,Me,ye,He.width,He.height,Ee,He.data):w.texSubImage2D(w.TEXTURE_2D,At,Me,ye,Ot,Ht,Ee,Jt,He);w.pixelStorei(w.UNPACK_ROW_LENGTH,be),w.pixelStorei(w.UNPACK_IMAGE_HEIGHT,Re),w.pixelStorei(w.UNPACK_SKIP_PIXELS,di),w.pixelStorei(w.UNPACK_SKIP_ROWS,fn),w.pixelStorei(w.UNPACK_SKIP_IMAGES,pi),At===0&&W.generateMipmaps&&w.generateMipmap(ke),st.unbindTexture()},this.copyTextureToTexture3D=function(E,W,nt=null,it=null,G=0){return E.isTexture!==!0&&(es("WebGLRenderer: copyTextureToTexture3D function signature has changed."),nt=arguments[0]||null,it=arguments[1]||null,E=arguments[2],W=arguments[3],G=arguments[4]||0),es('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(E,W,nt,it,G)},this.initRenderTarget=function(E){q.get(E).__webglFramebuffer===void 0&&T.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?T.setTextureCube(E,0):E.isData3DTexture?T.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?T.setTexture2DArray(E,0):T.setTexture2D(E,0),st.unbindTexture()},this.resetState=function(){C=0,I=0,z=null,st.reset(),De.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Ri}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=Ce._getDrawingBufferColorSpace(t),e.unpackColorSpace=Ce._getUnpackColorSpace()}}const fh={type:"change"},pu={type:"start"},sp={type:"end"},Wo=new lu,hh=new Xi,uE=Math.cos(70*Ic.DEG2RAD),Ke=new j,Sn=2*Math.PI,Ue={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Il=1e-6;class fE extends A0{constructor(t,e=null){super(t,e),this.state=Ue.NONE,this.enabled=!0,this.target=new j,this.cursor=new j,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:ss.ROTATE,MIDDLE:ss.DOLLY,RIGHT:ss.PAN},this.touches={ONE:ns.ROTATE,TWO:ns.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new j,this._lastQuaternion=new oi,this._lastTargetPosition=new j,this._quat=new oi().setFromUnitVectors(t.up,new j(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new zf,this._sphericalDelta=new zf,this._scale=1,this._panOffset=new j,this._rotateStart=new pe,this._rotateEnd=new pe,this._rotateDelta=new pe,this._panStart=new pe,this._panEnd=new pe,this._panDelta=new pe,this._dollyStart=new pe,this._dollyEnd=new pe,this._dollyDelta=new pe,this._dollyDirection=new j,this._mouse=new pe,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=dE.bind(this),this._onPointerDown=hE.bind(this),this._onPointerUp=pE.bind(this),this._onContextMenu=SE.bind(this),this._onMouseWheel=gE.bind(this),this._onKeyDown=vE.bind(this),this._onTouchStart=xE.bind(this),this._onTouchMove=ME.bind(this),this._onMouseDown=mE.bind(this),this._onMouseMove=_E.bind(this),this._interceptControlDown=yE.bind(this),this._interceptControlUp=EE.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(fh),this.update(),this.state=Ue.NONE}update(t=null){const e=this.object.position;Ke.copy(e).sub(this.target),Ke.applyQuaternion(this._quat),this._spherical.setFromVector3(Ke),this.autoRotate&&this.state===Ue.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(i)&&isFinite(r)&&(i<-Math.PI?i+=Sn:i>Math.PI&&(i-=Sn),r<-Math.PI?r+=Sn:r>Math.PI&&(r-=Sn),i<=r?this._spherical.theta=Math.max(i,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+r)/2?Math.max(i,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let s=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),s=o!=this._spherical.radius}if(Ke.setFromSpherical(this._spherical),Ke.applyQuaternion(this._quatInverse),e.copy(this.target).add(Ke),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){const a=Ke.length();o=this._clampDistance(a*this._scale);const l=a-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),s=!!l}else if(this.object.isOrthographicCamera){const a=new j(this._mouse.x,this._mouse.y,0);a.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),s=l!==this.object.zoom;const c=new j(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),o=Ke.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(Wo.origin.copy(this.object.position),Wo.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Wo.direction))<uE?this.object.lookAt(this.target):(hh.setFromNormalAndCoplanarPoint(this.object.up,this.target),Wo.intersectPlane(hh,this.target))))}else if(this.object.isOrthographicCamera){const o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),s=!0)}return this._scale=1,this._performCursorZoom=!1,s||this._lastPosition.distanceToSquared(this.object.position)>Il||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Il||this._lastTargetPosition.distanceToSquared(this.target)>Il?(this.dispatchEvent(fh),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?Sn/60*this.autoRotateSpeed*t:Sn/60/60*this.autoRotateSpeed}_getZoomScale(t){const e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){Ke.setFromMatrixColumn(e,0),Ke.multiplyScalar(-t),this._panOffset.add(Ke)}_panUp(t,e){this.screenSpacePanning===!0?Ke.setFromMatrixColumn(e,1):(Ke.setFromMatrixColumn(e,0),Ke.crossVectors(this.object.up,Ke)),Ke.multiplyScalar(t),this._panOffset.add(Ke)}_pan(t,e){const i=this.domElement;if(this.object.isPerspectiveCamera){const r=this.object.position;Ke.copy(r).sub(this.target);let s=Ke.length();s*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*s/i.clientHeight,this.object.matrix),this._panUp(2*e*s/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const i=this.domElement.getBoundingClientRect(),r=t-i.left,s=e-i.top,o=i.width,a=i.height;this._mouse.x=r/o*2-1,this._mouse.y=-(s/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(Sn*this._rotateDelta.x/e.clientHeight),this._rotateUp(Sn*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(Sn*this.rotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-Sn*this.rotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(Sn*this.rotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-Sn*this.rotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),i=.5*(t.pageX+e.x),r=.5*(t.pageY+e.y);this._rotateStart.set(i,r)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),i=.5*(t.pageX+e.x),r=.5*(t.pageY+e.y);this._panStart.set(i,r)}}_handleTouchStartDolly(t){const e=this._getSecondPointerPosition(t),i=t.pageX-e.x,r=t.pageY-e.y,s=Math.sqrt(i*i+r*r);this._dollyStart.set(0,s)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{const i=this._getSecondPointerPosition(t),r=.5*(t.pageX+i.x),s=.5*(t.pageY+i.y);this._rotateEnd.set(r,s)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(Sn*this._rotateDelta.x/e.clientHeight),this._rotateUp(Sn*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),i=.5*(t.pageX+e.x),r=.5*(t.pageY+e.y);this._panEnd.set(i,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){const e=this._getSecondPointerPosition(t),i=t.pageX-e.x,r=t.pageY-e.y,s=Math.sqrt(i*i+r*r);this._dollyEnd.set(0,s),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const o=(t.pageX+e.x)*.5,a=(t.pageY+e.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new pe,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){const e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){const e=t.deltaMode,i={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}}function hE(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n)))}function dE(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function pE(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(sp),this.state=Ue.NONE;break;case 1:const t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function mE(n){let t;switch(n.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case ss.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=Ue.DOLLY;break;case ss.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=Ue.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=Ue.ROTATE}break;case ss.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=Ue.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=Ue.PAN}break;default:this.state=Ue.NONE}this.state!==Ue.NONE&&this.dispatchEvent(pu)}function _E(n){switch(this.state){case Ue.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case Ue.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case Ue.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function gE(n){this.enabled===!1||this.enableZoom===!1||this.state!==Ue.NONE||(n.preventDefault(),this.dispatchEvent(pu),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(sp))}function vE(n){this.enabled!==!1&&this._handleKeyDown(n)}function xE(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case ns.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=Ue.TOUCH_ROTATE;break;case ns.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=Ue.TOUCH_PAN;break;default:this.state=Ue.NONE}break;case 2:switch(this.touches.TWO){case ns.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=Ue.TOUCH_DOLLY_PAN;break;case ns.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=Ue.TOUCH_DOLLY_ROTATE;break;default:this.state=Ue.NONE}break;default:this.state=Ue.NONE}this.state!==Ue.NONE&&this.dispatchEvent(pu)}function ME(n){switch(this._trackPointer(n),this.state){case Ue.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case Ue.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case Ue.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case Ue.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=Ue.NONE}}function SE(n){this.enabled!==!1&&n.preventDefault()}function yE(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function EE(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const bE="modulepreload",TE=function(n,t){return new URL(n,t).href},dh={},AE=function(t,e,i){let r=Promise.resolve();if(e&&e.length>0){let o=function(u){return Promise.all(u.map(f=>Promise.resolve(f).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};const a=document.getElementsByTagName("link"),l=document.querySelector("meta[property=csp-nonce]"),c=(l==null?void 0:l.nonce)||(l==null?void 0:l.getAttribute("nonce"));r=o(e.map(u=>{if(u=TE(u,i),u in dh)return;dh[u]=!0;const f=u.endsWith(".css"),p=f?'[rel="stylesheet"]':"";if(!!i)for(let M=a.length-1;M>=0;M--){const g=a[M];if(g.href===u&&(!f||g.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${u}"]${p}`))return;const x=document.createElement("link");if(x.rel=f?"stylesheet":bE,f||(x.as="script"),x.crossOrigin="",x.href=u,c&&x.setAttribute("nonce",c),document.head.appendChild(x),f)return new Promise((M,g)=>{x.addEventListener("load",M),x.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${u}`)))})}))}function s(o){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=o,window.dispatchEvent(a),!a.defaultPrevented)throw o}return r.then(o=>{for(const a of o||[])a.status==="rejected"&&s(a.reason);return t().catch(s)})};async function wE(n={}){var Eu,bu,Tu;var t,e=n,i=!!globalThis.window,r=!!globalThis.WorkerGlobalScope,s=((bu=(Eu=globalThis.process)==null?void 0:Eu.versions)==null?void 0:bu.node)&&((Tu=globalThis.process)==null?void 0:Tu.type)!="renderer";if(s){const{createRequire:h}=await AE(()=>import("./__vite-browser-external-BIHI7g3E.js"),[],import.meta.url);var o=h(import.meta.url)}var a=!1;e.setup=function(){if(a)return;a=!0,e.initTBB();function h(U,H,at=(vt=>vt)){if(H)for(let vt of H)U.push_back(at(vt));return U}function d(U,H=(at=>at)){const at=[],vt=U.size();for(let Wt=0;Wt<vt;Wt++)at.push(H(U.get(Wt)));return at}function b(U,H=(at=>at)){const at=[],vt=U.size();for(let Wt=0;Wt<vt;Wt++){const le=U.get(Wt),Se=le.size(),ze=[];for(let Pe=0;Pe<Se;Pe++)ze.push(H(le.get(Pe)));at.push(ze)}return at}function P(U){return U[0].length<3&&(U=[U]),h(new e.Vector2_vec2,U,H=>h(new e.Vector_vec2,H,at=>at instanceof Array?{x:at[0],y:at[1]}:at))}function F(U){for(let H=0;H<U.size();H++)U.get(H).delete();U.delete()}function X(U){return U[0]instanceof Array?{x:U[0][0],y:U[0][1]}:typeof U[0]=="number"?{x:U[0]||0,y:U[1]||0}:U[0]}function $(U){return U[0]instanceof Array?{x:U[0][0],y:U[0][1],z:U[0][2]}:typeof U[0]=="number"?{x:U[0]||0,y:U[1]||0,z:U[2]||0}:U[0]}function J(U){return U=="EvenOdd"?0:U=="NonZero"?1:U=="Negative"?3:2}function mt(U){return U=="Round"?1:U=="Miter"?2:0}const yt=e.CrossSection;function wt(U,H="Positive"){if(U instanceof yt)return U;{const at=P(U),vt=new yt(at,J(H));return F(at),vt}}e.CrossSection.prototype.translate=function(...U){return this._Translate(X(U))},e.CrossSection.prototype.scale=function(U){return typeof U=="number"?this._Scale({x:U,y:U}):this._Scale(X([U]))},e.CrossSection.prototype.mirror=function(U){return this._Mirror(X([U]))},e.CrossSection.prototype.warp=function(U){const H=nr(function(vt){const Wt=Y(vt,"double"),le=Y(vt+8,"double"),Se=[Wt,le];U(Se),w(vt,Se[0],"double"),w(vt+8,Se[1],"double")},"vi"),at=this._Warp(H);return ir(H),at},e.CrossSection.prototype.decompose=function(){const U=this._Decompose(),H=d(U);return U.delete(),H},e.CrossSection.prototype.bounds=function(){const U=this._Bounds();return{min:["x","y"].map(H=>U.min[H]),max:["x","y"].map(H=>U.max[H])}},e.CrossSection.prototype.offset=function(U,H="Round",at=2,vt=0){return this._Offset(U,mt(H),at,vt)},e.CrossSection.prototype.simplify=function(U=1e-6){return this._Simplify(U)},e.CrossSection.prototype.extrude=function(U,H=0,at=0,vt=[1,1],Wt=!1){vt=X([vt]);const le=e._Extrude(this._ToPolygons(),U,H,at,vt);return Wt?le.translate([0,0,-U/2]):le},e.CrossSection.prototype.revolve=function(U=0,H=360){return e._Revolve(this._ToPolygons(),U,H)},e.CrossSection.prototype.add=function(U){return this._add(wt(U))},e.CrossSection.prototype.subtract=function(U){return this._subtract(wt(U))},e.CrossSection.prototype.intersect=function(U){return this._intersect(wt(U))},e.CrossSection.prototype.toPolygons=function(){const U=this._ToPolygons(),H=b(U,at=>[at.x,at.y]);return U.delete(),H},e.Manifold.prototype.smoothOut=function(U=52.5,H=0){return this._SmoothOut(U,H)},e.Manifold.prototype.warp=function(U){const H=nr(function(Wt){const le=Y(Wt,"double"),Se=Y(Wt+8,"double"),ze=Y(Wt+16,"double"),Pe=[le,Se,ze];U(Pe),w(Wt,Pe[0],"double"),w(Wt+8,Pe[1],"double"),w(Wt+16,Pe[2],"double")},"vi"),at=this._Warp(H);ir(H);const vt=at.status();if(vt!=="NoError")throw new e.ManifoldError(vt);return at},e.Manifold.prototype.warpBatch=function(U){const H=nr(function(Wt,le){const Se=e.HEAPF64??O;if(!Se)throw new Error("WASM heap is not initialized (HEAPF64 unavailable)");const ze=new Float64Array(Se.buffer,Wt,le*3);U(ze,le)},"vii"),at=this._WarpBatch(H);ir(H);const vt=at.status();if(vt!=="NoError")throw new e.ManifoldError(vt);return at},e.Manifold.prototype.calculateNormals=function(U=0,H=52.5){return this._CalculateNormals(U,H)},e.Manifold.prototype.smoothByNormals=function(U=0){return this._SmoothByNormals(U)},e.Manifold.prototype.setProperties=function(U,H){const at=this.numProp(),vt=nr(function(le,Se,ze){const Pe=[];for(let Ge=0;Ge<U;++Ge)Pe[Ge]=Y(le+8*Ge,"double");const Zn=[];for(let Ge=0;Ge<3;++Ge)Zn[Ge]=Y(Se+8*Ge,"double");const Ui=[];for(let Ge=0;Ge<at;++Ge)Ui[Ge]=Y(ze+8*Ge,"double");H(Pe,Zn,Ui);for(let Ge=0;Ge<U;++Ge)w(le+8*Ge,Pe[Ge],"double")},"viii"),Wt=this._SetProperties(U,vt);return ir(vt),Wt},e.Manifold.prototype.translate=function(...U){return this._Translate($(U))},e.Manifold.prototype.rotate=function(U,H,at){return Array.isArray(U)?this._Rotate(...U):this._Rotate(U,H||0,at||0)},e.Manifold.prototype.scale=function(U){return typeof U=="number"?this._Scale({x:U,y:U,z:U}):this._Scale($([U]))},e.Manifold.prototype.mirror=function(U){return this._Mirror($([U]))},e.Manifold.prototype.trimByPlane=function(U,H=0){return this._TrimByPlane($([U]),H)},e.Manifold.prototype.slice=function(U=0){const H=this._Slice(U),at=new yt(H,J("Positive"));return F(H),at},e.Manifold.prototype.project=function(){const U=this._Project(),H=new yt(U,J("Positive"));return F(U),H},e.Manifold.prototype.rayCast=function(U,H){const at=this._RayCast($([U]),$([H])),vt=d(at,Wt=>({faceID:Wt.faceID,distance:Wt.distance,position:["x","y","z"].map(le=>Wt.position[le]),normal:["x","y","z"].map(le=>Wt.normal[le])}));return at.delete(),vt},e.Manifold.prototype.split=function(U){const H=this._Split(U),at=d(H);return H.delete(),at},e.Manifold.prototype.splitByPlane=function(U,H=0){const at=this._SplitByPlane($([U]),H),vt=d(at);return at.delete(),vt},e.Manifold.prototype.decompose=function(){const U=this._Decompose(),H=d(U);return U.delete(),H},e.Manifold.prototype.boundingBox=function(){const U=this._boundingBox();return{min:["x","y","z"].map(H=>U.min[H]),max:["x","y","z"].map(H=>U.max[H])}},e.Manifold.prototype.simplify=function(U=0){return this._Simplify(U)};class Pt{constructor({numProp:H=3,triVerts:at=new Uint32Array,vertProperties:vt=new Float32Array,mergeFromVert:Wt,mergeToVert:le,runIndex:Se,runOriginalID:ze,faceID:Pe,halfedgeTangent:Zn,runTransform:Ui,runFlags:Ge,tolerance:Ga=0}={}){this.numProp=H,this.triVerts=at,this.vertProperties=vt,this.mergeFromVert=Wt,this.mergeToVert=le,this.runIndex=Se,this.runOriginalID=ze,this.faceID=Pe,this.halfedgeTangent=Zn,this.runTransform=Ui,this.runFlags=Ge,this.tolerance=Ga}get numTri(){return this.triVerts.length/3}get numVert(){return this.vertProperties.length/this.numProp}get numRun(){return this.runOriginalID.length}merge(){const{changed:H,mesh:at}=e._Merge(this);return Object.assign(this,{...at}),H}verts(H){return this.triVerts.subarray(3*H,3*(H+1))}position(H){return this.vertProperties.subarray(this.numProp*H,this.numProp*H+3)}extras(H){return this.vertProperties.subarray(this.numProp*H+3,this.numProp*(H+1))}tangent(H){return this.halfedgeTangent.subarray(4*H,4*(H+1))}transform(H){const at=new Array(16);for(const vt of[0,1,2,3])for(const Wt of[0,1,2])at[4*vt+Wt]=this.runTransform[12*H+3*vt+Wt];return at[15]=1,at}backside(H){return this.runFlags!=null&&H<this.runFlags.length&&(this.runFlags[H]&1)!==0}hasNormals(H){return this.runFlags!=null&&H<this.runFlags.length&&(this.runFlags[H]&2)!==0}}e.Mesh=Pt,e.Manifold.prototype.getMesh=function(U=-1){return new Pt(this._GetMeshJS(U))},e.ManifoldError=function(H,...at){let vt="Unknown error";switch(H){case"NonFiniteVertex":vt="Non-finite vertex";break;case"NotManifold":vt="Not manifold";break;case"VertexOutOfBounds":vt="Vertex index out of bounds";break;case"PropertiesWrongLength":vt="Properties have wrong length";break;case"MissingPositionProperties":vt="Less than three properties";break;case"MergeVectorsDifferentLengths":vt="Merge vectors have different lengths";break;case"MergeIndexOutOfBounds":vt="Merge index out of bounds";break;case"TransformWrongLength":vt="Transform vector has wrong length";break;case"RunIndexWrongLength":vt="Run index vector has wrong length";break;case"FaceIDWrongLength":vt="Face ID vector has wrong length";break;case"InvalidConstruction":vt="Manifold constructed with invalid parameters";break;case"ResultTooLarge":vt="Result exceeds maximum size";break;case"InvalidTangents":vt="Invalid halfedge tangents";break}const Wt=Error.apply(this,[vt,...at]);Wt.name=this.name="ManifoldError",this.message=Wt.message,this.stack=Wt.stack,this.code=H},e.ManifoldError.prototype=Object.create(Error.prototype,{constructor:{value:e.ManifoldError,writable:!0,configurable:!0}}),e.CrossSection=function(U,H="Positive"){const at=P(U),vt=new yt(at,J(H));return F(at),vt},e.CrossSection.ofPolygons=function(U,H="Positive"){return new e.CrossSection(U,H)},e.CrossSection.square=function(...U){let H;U.length==0?H={x:1,y:1}:typeof U[0]=="number"?H={x:U[0],y:U[0]}:H=X(U);const at=U[1]||!1;return e._Square(H,at)},e.CrossSection.circle=function(U,H=0){return e._Circle(U,H)};function zt(U){return function(...H){H.length==1&&(H=H[0]);const at=new e.Vector_crossSection;for(const Wt of H)at.push_back(wt(Wt));const vt=e["_crossSection"+U](at);return at.delete(),vt}}e.CrossSection.compose=zt("Compose"),e.CrossSection.union=zt("UnionN"),e.CrossSection.difference=zt("DifferenceN"),e.CrossSection.intersection=zt("IntersectionN");function Yt(U,H){h(U,H,at=>at instanceof Array?{x:at[0],y:at[1]}:at)}e.CrossSection.hull=function(...U){U.length==1&&(U=U[0]);let H=new e.Vector_vec2;for(const vt of U)if(vt instanceof yt)e._crossSectionCollectVertices(H,vt);else if(vt instanceof Array&&vt.length==2&&typeof vt[0]=="number")H.push_back({x:vt[0],y:vt[1]});else if(vt.x)H.push_back(vt);else{const le=vt[0].length==2&&typeof vt[0][0]=="number"||vt[0].x?[vt]:vt;for(const Se of le)Yt(H,Se)}const at=e._crossSectionHullPoints(H);return H.delete(),at},e.CrossSection.prototype=Object.create(yt.prototype),Object.defineProperty(e.CrossSection,Symbol.hasInstance,{get:()=>U=>U instanceof yt});const Kt=e.Manifold;e.Manifold=function(U){const H=new Kt(U),at=H.status();if(at!=="NoError")throw new e.ManifoldError(at);return H},e.Manifold.ofMesh=function(U){return new e.Manifold(U)},e.Manifold.tetrahedron=function(){return e._Tetrahedron()},e.Manifold.cube=function(...U){let H;U.length==0?H={x:1,y:1,z:1}:typeof U[0]=="number"?H={x:U[0],y:U[0],z:U[0]}:H=$(U);const at=U[1]||!1;return e._Cube(H,at)},e.Manifold.cylinder=function(U,H,at=-1,vt=0,Wt=!1){return e._Cylinder(U,H,at,vt,Wt)},e.Manifold.sphere=function(U,H=0){return e._Sphere(U,H)},e.Manifold.smooth=function(U,H=[]){const at=new e.Vector_smoothness;h(at,H);const vt=e._Smooth(U,at);return at.delete(),vt},e.Manifold.extrude=function(U,H,at=0,vt=0,Wt=[1,1],le=!1){return(U instanceof yt?U:e.CrossSection(U,"Positive")).extrude(H,at,vt,Wt,le)},e.Manifold.revolve=function(U,H=0,at=360){return(U instanceof yt?U:e.CrossSection(U,"Positive")).revolve(H,at)},e.Manifold.reserveIDs=function(U){return e._ReserveIDs(U)};function ie(U){return function(...H){H.length==1&&(H=H[0]);const at=new e.Vector_manifold;for(const Wt of H)at.push_back(Wt);const vt=e["_manifold"+U+"N"](at);return at.delete(),vt}}e.Manifold.union=ie("Union"),e.Manifold.compose=e.Manifold.union,e.Manifold.difference=ie("Difference"),e.Manifold.intersection=ie("Intersection"),e.Manifold.levelSet=function(U,H,at,vt=0,Wt=-1){const le={min:{x:H.min[0],y:H.min[1],z:H.min[2]},max:{x:H.max[0],y:H.max[1],z:H.max[2]}},Se=nr(function(Pe){const Zn=Y(Pe,"double"),Ui=Y(Pe+8,"double"),Ge=Y(Pe+16,"double");return U([Zn,Ui,Ge])},"di"),ze=e._LevelSet(Se,le,at,vt,Wt);return ir(Se),ze},e.ExecutionContext.prototype.fromMesh=function(U){return this._FromMesh(U)},e.ExecutionContext.prototype.smooth=function(U,H=[]){const at=new e.Vector_smoothness;h(at,H);const vt=this._Smooth(U,at);return at.delete(),vt},e.ExecutionContext.prototype.levelSet=function(U,H,at,vt=0,Wt=-1){const le={min:{x:H.min[0],y:H.min[1],z:H.min[2]},max:{x:H.max[0],y:H.max[1],z:H.max[2]}},Se=nr(function(Pe){const Zn=Y(Pe,"double"),Ui=Y(Pe+8,"double"),Ge=Y(Pe+16,"double");return U([Zn,Ui,Ge])},"di"),ze=this._LevelSet(Se,le,at,vt,Wt);return ir(Se),ze};function ue(U,H){h(U,H,at=>at instanceof Array?{x:at[0],y:at[1],z:at[2]}:at)}e.Manifold.hull=function(...U){U.length==1&&(U=U[0]);let H=new e.Vector_vec3;for(const vt of U)vt instanceof Kt?e._manifoldCollectVertices(H,vt):vt instanceof Array&&vt.length==3&&typeof vt[0]=="number"?H.push_back({x:vt[0],y:vt[1],z:vt[2]}):vt.x?H.push_back(vt):ue(H,vt);const at=e._manifoldHullPoints(H);return H.delete(),at},e.Manifold.prototype=Object.create(Kt.prototype),Object.defineProperty(e.Manifold,Symbol.hasInstance,{get:()=>U=>U instanceof Kt}),e.triangulate=function(U,H=-1,at=!0){const vt=P(U),Wt=d(e._Triangulate(vt,H,at),le=>[le[0],le[1],le[2]]);return F(vt),Wt}};var l=import.meta.url,c="";function u(h){return e.locateFile?e.locateFile(h,c):c+h}var f,p;if(s){var _=o("node:fs");l.startsWith("file:")&&(c=o("node:path").dirname(o("node:url").fileURLToPath(l))+"/"),p=h=>{h=m(h)?new URL(h):h;var d=_.readFileSync(h);return d},f=async(h,d=!0)=>{h=m(h)?new URL(h):h;var b=_.readFileSync(h,d?void 0:"utf8");return b},process.argv.length>1&&process.argv[1].replace(/\\/g,"/"),process.argv.slice(2)}else if(i||r){try{c=new URL(".",l).href}catch{}r&&(p=h=>{var d=new XMLHttpRequest;return d.open("GET",h,!1),d.responseType="arraybuffer",d.send(null),new Uint8Array(d.response)}),f=async h=>{if(m(h))return new Promise((b,P)=>{var F=new XMLHttpRequest;F.open("GET",h,!0),F.responseType="arraybuffer",F.onload=()=>{if(F.status==200||F.status==0&&F.response){b(F.response);return}P(F.status)},F.onerror=P,F.send(null)});var d=await fetch(h,{credentials:"same-origin"});if(d.ok)return d.arrayBuffer();throw new Error(d.status+" : "+d.url)}}console.log.bind(console);var x=console.error.bind(console),M,g=!1,m=h=>h.startsWith("file://"),L,R,S,V,C,I,z,A,y,O,lt,Q,ht=!1;function St(){var h=po.buffer;S=new Int8Array(h),C=new Int16Array(h),V=new Uint8Array(h),I=new Uint16Array(h),z=new Int32Array(h),A=new Uint32Array(h),y=new Float32Array(h),O=new Float64Array(h),lt=new BigInt64Array(h),Q=new BigUint64Array(h)}function tt(){if(e.preRun)for(typeof e.preRun=="function"&&(e.preRun=[e.preRun]);e.preRun.length;)N(e.preRun.shift());Qt(D)}function dt(){ht=!0,rr.J()}function K(){if(e.postRun)for(typeof e.postRun=="function"&&(e.postRun=[e.postRun]);e.postRun.length;)me(e.postRun.shift());Qt(ee)}function Rt(h){var b;(b=e.onAbort)==null||b.call(e,h),h="Aborted("+h+")",x(h),g=!0,h+=". Build with -sASSERTIONS for more info.";var d=new WebAssembly.RuntimeError(h);throw R==null||R(d),d}var Dt;function Xt(){return e.locateFile?u("manifold.wasm"):new URL(""+new URL("manifold-B_yLhOkb.wasm",import.meta.url).href,import.meta.url).href}function te(h){if(h==Dt&&M)return new Uint8Array(M);if(p)return p(h);throw"both async and sync fetching of the wasm failed"}async function Ae(h){if(!M)try{var d=await f(h);return new Uint8Array(d)}catch{}return te(h)}async function _t(h,d){try{var b=await Ae(h),P=await WebAssembly.instantiate(b,d);return P}catch(F){x(`failed to asynchronously prepare wasm: ${F}`),Rt(F)}}async function Ct(h,d,b){if(!h&&!m(d)&&!s)try{var P=fetch(d,{credentials:"same-origin"}),F=await WebAssembly.instantiateStreaming(P,b);return F}catch(X){x(`wasm streaming compile failed: ${X}`),x("falling back to ArrayBuffer instantiation")}return _t(d,b)}function Gt(){var h={a:am};return h}async function Lt(){function h(X,$){return rr=X.exports,rr=lm(rr),om(rr),St(),rr}function d(X){return h(X.instance)}var b=Gt();if(e.instantiateWasm)return new Promise((X,$)=>{e.instantiateWasm(b,(J,mt)=>{X(h(J))})});Dt??(Dt=Xt());var P=await Ct(M,Dt,b),F=d(P);return F}var Qt=h=>{for(;h.length>0;)h.shift()(e)},ee=[],me=h=>ee.push(h),D=[],N=h=>D.push(h);function Y(h,d="i8"){switch(d.endsWith("*")&&(d="*"),d){case"i1":return S[h>>>0];case"i8":return S[h>>>0];case"i16":return C[h>>>1>>>0];case"i32":return z[h>>>2>>>0];case"i64":return lt[h>>>3>>>0];case"float":return y[h>>>2>>>0];case"double":return O[h>>>3>>>0];case"*":return A[h>>>2>>>0];default:Rt(`invalid type for getValue: ${d}`)}}function w(h,d,b="i8"){switch(b.endsWith("*")&&(b="*"),b){case"i1":S[h>>>0]=d;break;case"i8":S[h>>>0]=d;break;case"i16":C[h>>>1>>>0]=d;break;case"i32":z[h>>>2>>>0]=d;break;case"i64":lt[h>>>3>>>0]=BigInt(d);break;case"float":y[h>>>2>>>0]=d;break;case"double":O[h>>>3>>>0]=d;break;case"*":A[h>>>2>>>0]=d;break;default:Rt(`invalid type for setValue: ${b}`)}}class pt{constructor(d){this.excPtr=d,this.ptr=d-24}set_type(d){A[this.ptr+4>>>2>>>0]=d}get_type(){return A[this.ptr+4>>>2>>>0]}set_destructor(d){A[this.ptr+8>>>2>>>0]=d}get_destructor(){return A[this.ptr+8>>>2>>>0]}set_caught(d){d=d?1:0,S[this.ptr+12>>>0]=d}get_caught(){return S[this.ptr+12>>>0]!=0}set_rethrown(d){d=d?1:0,S[this.ptr+13>>>0]=d}get_rethrown(){return S[this.ptr+13>>>0]!=0}init(d,b){this.set_adjusted_ptr(0),this.set_type(d),this.set_destructor(b)}set_adjusted_ptr(d){A[this.ptr+16>>>2>>>0]=d}get_adjusted_ptr(){return A[this.ptr+16>>>2>>>0]}}var rt=0;function gt(h,d,b){h>>>=0,d>>>=0,b>>>=0;var P=new pt(h);throw P.init(d,b),rt=h,rt}var st=()=>Rt(""),xt={},q=h=>{for(;h.length;){var d=h.pop(),b=h.pop();b(d)}};function T(h){return this.fromWireType(A[h>>>2>>>0])}var v={},B={},Z={},ot=class extends Error{constructor(d){super(d),this.name="InternalError"}},et=h=>{throw new ot(h)},bt=(h,d,b)=>{h.forEach(J=>Z[J]=d);function P(J){var mt=b(J);mt.length!==h.length&&et("Mismatched type converter count");for(var yt=0;yt<h.length;++yt)kt(h[yt],mt[yt])}var F=new Array(d.length),X=[],$=0;for(let[J,mt]of d.entries())B.hasOwnProperty(mt)?F[J]=B[mt]:(X.push(mt),v.hasOwnProperty(mt)||(v[mt]=[]),v[mt].push(()=>{F[J]=B[mt],++$,$===X.length&&P(F)}));X.length===0&&P(F)},Tt=function(h){h>>>=0;var d=xt[h];delete xt[h];var b=d.rawConstructor,P=d.rawDestructor,F=d.fields,X=F.map($=>$.getterReturnType).concat(F.map($=>$.setterArgumentType));bt([h],X,$=>{var J={};for(var[mt,yt]of F.entries()){const wt=$[mt],Pt=yt.getter,zt=yt.getterContext,Yt=$[mt+F.length],Kt=yt.setter,ie=yt.setterContext;J[yt.fieldName]={read:ue=>wt.fromWireType(Pt(zt,ue)),write:(ue,U)=>{var H=[];Kt(ie,ue,Yt.toWireType(H,U)),q(H)},optional:wt.optional}}return[{name:d.name,fromWireType:wt=>{var Pt={};for(var zt in J)Pt[zt]=J[zt].read(wt);return P(wt),Pt},toWireType:(wt,Pt)=>{for(var zt in J)if(!(zt in Pt)&&!J[zt].optional)throw new TypeError(`Missing field: "${zt}"`);var Yt=b();for(zt in J)J[zt].write(Yt,Pt[zt]);return wt!==null&&wt.push(P,Yt),Yt},readValueFromPointer:T,destructorFunction:P}]})},Et=h=>{h>>>=0;for(var d="";;){var b=V[h++>>>0];if(!b)return d;d+=String.fromCharCode(b)}},ne=class extends Error{constructor(d){super(d),this.name="BindingError"}},ct=h=>{throw new ne(h)};function Ut(h,d,b={}){var P=d.name;if(h||ct(`type "${P}" must have a positive integer typeid pointer`),B.hasOwnProperty(h)){if(b.ignoreDuplicateRegistrations)return;ct(`Cannot register type '${P}' twice`)}if(B[h]=d,delete Z[h],v.hasOwnProperty(h)){var F=v[h];delete v[h],F.forEach(X=>X())}}function kt(h,d,b={}){return Ut(h,d,b)}var qt=(h,d,b)=>{switch(d){case 1:return b?P=>S[P>>>0]:P=>V[P>>>0];case 2:return b?P=>C[P>>>1>>>0]:P=>I[P>>>1>>>0];case 4:return b?P=>z[P>>>2>>>0]:P=>A[P>>>2>>>0];case 8:return b?P=>lt[P>>>3>>>0]:P=>Q[P>>>3>>>0];default:throw new TypeError(`invalid integer width (${d}): ${h}`)}},It=function(h,d,b,P,F){h>>>=0,d>>>=0,b>>>=0,d=Et(d);const X=P===0n;let $=J=>J;if(X){const J=b*8;$=mt=>BigInt.asUintN(J,mt),F=$(F)}kt(h,{name:d,fromWireType:$,toWireType:(J,mt)=>(typeof mt=="number"&&(mt=BigInt(mt)),mt),readValueFromPointer:qt(d,b,!X),destructorFunction:null})};function ge(h,d,b,P){h>>>=0,d>>>=0,d=Et(d),kt(h,{name:d,fromWireType:function(F){return!!F},toWireType:function(F,X){return X?b:P},readValueFromPointer:function(F){return this.fromWireType(V[F>>>0])},destructorFunction:null})}var ce=h=>({count:h.count,deleteScheduled:h.deleteScheduled,preservePointerOnDelete:h.preservePointerOnDelete,ptr:h.ptr,ptrType:h.ptrType,smartPtr:h.smartPtr,smartPtrType:h.smartPtrType}),De=h=>{function d(b){return b.$$.ptrType.registeredClass.name}ct(d(h)+" instance already deleted")},k=!1,Nt=h=>{},ut=h=>{h.smartPtr?h.smartPtrType.rawDestructor(h.smartPtr):h.ptrType.registeredClass.rawDestructor(h.ptr)},Mt=h=>{h.count.value-=1;var d=h.count.value===0;d&&ut(h)},Ft=h=>globalThis.FinalizationRegistry?(k=new FinalizationRegistry(d=>{Mt(d.$$)}),Ft=d=>{var b=d.$$,P=!!b.smartPtr;if(P){var F={$$:b};k.register(d,F,d)}return d},Nt=d=>k.unregister(d),Ft(h)):(Ft=d=>d,h),Vt=()=>{let h=oe.prototype;Object.assign(h,{isAliasOf(b){if(!(this instanceof oe)||!(b instanceof oe))return!1;var P=this.$$.ptrType.registeredClass,F=this.$$.ptr;b.$$=b.$$;for(var X=b.$$.ptrType.registeredClass,$=b.$$.ptr;P.baseClass;)F=P.upcast(F),P=P.baseClass;for(;X.baseClass;)$=X.upcast($),X=X.baseClass;return P===X&&F===$},clone(){if(this.$$.ptr||De(this),this.$$.preservePointerOnDelete)return this.$$.count.value+=1,this;var b=Ft(Object.create(Object.getPrototypeOf(this),{$$:{value:ce(this.$$)}}));return b.$$.count.value+=1,b.$$.deleteScheduled=!1,b},delete(){this.$$.ptr||De(this),this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete&&ct("Object already scheduled for deletion"),Nt(this),Mt(this.$$),this.$$.preservePointerOnDelete||(this.$$.smartPtr=void 0,this.$$.ptr=void 0)},isDeleted(){return!this.$$.ptr},deleteLater(){return this.$$.ptr||De(this),this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete&&ct("Object already scheduled for deletion"),this.$$.deleteScheduled=!0,this}});const d=Symbol.dispose;d&&(h[d]=h.delete)};function oe(){}var Ne=(h,d)=>Object.defineProperty(d,"name",{value:h}),je={},we=(h,d,b)=>{if(h[d].overloadTable===void 0){var P=h[d];h[d]=function(...F){return h[d].overloadTable.hasOwnProperty(F.length)||ct(`Function '${b}' called with an invalid number of arguments (${F.length}) - expects one of (${h[d].overloadTable})!`),h[d].overloadTable[F.length].apply(this,F)},h[d].overloadTable=[],h[d].overloadTable[P.argCount]=P}},en=(h,d,b)=>{e.hasOwnProperty(h)?((b===void 0||e[h].overloadTable!==void 0&&e[h].overloadTable[b]!==void 0)&&ct(`Cannot register public name '${h}' twice`),we(e,h,h),e[h].overloadTable.hasOwnProperty(b)&&ct(`Cannot register multiple overloads of a function with the same number of arguments (${b})!`),e[h].overloadTable[b]=d):(e[h]=d,e[h].argCount=b)},On=48,ao=57,lo=h=>{h=h.replace(/[^a-zA-Z0-9_]/g,"$");var d=h.charCodeAt(0);return d>=On&&d<=ao?`_${h}`:h};function hi(h,d,b,P,F,X,$,J){this.name=h,this.constructor=d,this.instancePrototype=b,this.rawDestructor=P,this.baseClass=F,this.getActualType=X,this.upcast=$,this.downcast=J,this.pureVirtualFunctions=[]}var Qi=(h,d,b)=>{for(;d!==b;)d.upcast||ct(`Expected null or instance of ${b.name}, got an instance of ${d.name}`),h=d.upcast(h),d=d.baseClass;return h},Ir=h=>{if(h===null)return"null";var d=typeof h;return d==="object"||d==="array"||d==="function"?h.toString():""+h};function co(h,d){if(d===null)return this.isReference&&ct(`null is not a valid ${this.name}`),0;d.$$||ct(`Cannot pass "${Ir(d)}" as a ${this.name}`),d.$$.ptr||ct(`Cannot pass deleted object as a pointer of type ${this.name}`);var b=d.$$.ptrType.registeredClass,P=Qi(d.$$.ptr,b,this.registeredClass);return P}function Ur(h,d){var b;if(d===null)return this.isReference&&ct(`null is not a valid ${this.name}`),this.isSmartPointer?(b=this.rawConstructor(),h!==null&&h.push(this.rawDestructor,b),b):0;(!d||!d.$$)&&ct(`Cannot pass "${Ir(d)}" as a ${this.name}`),d.$$.ptr||ct(`Cannot pass deleted object as a pointer of type ${this.name}`),!this.isConst&&d.$$.ptrType.isConst&&ct(`Cannot convert argument of type ${d.$$.smartPtrType?d.$$.smartPtrType.name:d.$$.ptrType.name} to parameter type ${this.name}`);var P=d.$$.ptrType.registeredClass;if(b=Qi(d.$$.ptr,P,this.registeredClass),this.isSmartPointer)switch(d.$$.smartPtr===void 0&&ct("Passing raw pointer to smart pointer is illegal"),this.sharingPolicy){case 0:d.$$.smartPtrType===this?b=d.$$.smartPtr:ct(`Cannot convert argument of type ${d.$$.smartPtrType?d.$$.smartPtrType.name:d.$$.ptrType.name} to parameter type ${this.name}`);break;case 1:b=d.$$.smartPtr;break;case 2:if(d.$$.smartPtrType===this)b=d.$$.smartPtr;else{var F=d.clone();b=this.rawShare(b,Re.toHandle(()=>F.delete())),h!==null&&h.push(this.rawDestructor,b)}break;default:ct("Unsupported sharing policy")}return b}function uo(h,d){if(d===null)return this.isReference&&ct(`null is not a valid ${this.name}`),0;d.$$||ct(`Cannot pass "${Ir(d)}" as a ${this.name}`),d.$$.ptr||ct(`Cannot pass deleted object as a pointer of type ${this.name}`),d.$$.ptrType.isConst&&ct(`Cannot convert argument of type ${d.$$.ptrType.name} to parameter type ${this.name}`);var b=d.$$.ptrType.registeredClass,P=Qi(d.$$.ptr,b,this.registeredClass);return P}var tr=(h,d,b)=>{if(d===b)return h;if(b.baseClass===void 0)return null;var P=tr(h,d,b.baseClass);return P===null?null:b.downcast(P)},fo={},ho=(h,d)=>{for(d===void 0&&ct("ptr should not be undefined");h.baseClass;)d=h.upcast(d),h=h.baseClass;return d},Fa=(h,d)=>(d=ho(h,d),fo[d]),Nr=(h,d)=>{(!d.ptrType||!d.ptr)&&et("makeClassHandle requires ptr and ptrType");var b=!!d.smartPtrType,P=!!d.smartPtr;return b!==P&&et("Both smartPtrType and smartPtr must be specified"),d.count={value:1},Ft(Object.create(h,{$$:{value:d,writable:!0}}))};function Oa(h){var d=this.getPointee(h);if(!d)return this.destructor(h),null;var b=Fa(this.registeredClass,d);if(b!==void 0){if(b.$$.count.value===0)return b.$$.ptr=d,b.$$.smartPtr=h,b.clone();var P=b.clone();return this.destructor(h),P}function F(){return this.isSmartPointer?Nr(this.registeredClass.instancePrototype,{ptrType:this.pointeeType,ptr:d,smartPtrType:this,smartPtr:h}):Nr(this.registeredClass.instancePrototype,{ptrType:this,ptr:h})}var X=this.registeredClass.getActualType(d),$=je[X];if(!$)return F.call(this);var J;this.isConst?J=$.constPointerType:J=$.pointerType;var mt=tr(d,this.registeredClass,J.registeredClass);return mt===null?F.call(this):this.isSmartPointer?Nr(J.registeredClass.instancePrototype,{ptrType:J,ptr:mt,smartPtrType:this,smartPtr:h}):Nr(J.registeredClass.instancePrototype,{ptrType:J,ptr:mt})}var Ba=()=>{Object.assign(Fr.prototype,{getPointee(h){return this.rawGetPointee&&(h=this.rawGetPointee(h)),h},destructor(h){var d;(d=this.rawDestructor)==null||d.call(this,h)},readValueFromPointer:T,fromWireType:Oa})};function Fr(h,d,b,P,F,X,$,J,mt,yt,wt){this.name=h,this.registeredClass=d,this.isReference=b,this.isConst=P,this.isSmartPointer=F,this.pointeeType=X,this.sharingPolicy=$,this.rawGetPointee=J,this.rawConstructor=mt,this.rawShare=yt,this.rawDestructor=wt,!F&&d.baseClass===void 0?P?(this.toWireType=co,this.destructorFunction=null):(this.toWireType=uo,this.destructorFunction=null):this.toWireType=Ur}var E=(h,d,b)=>{e.hasOwnProperty(h)||et("Replacing nonexistent public symbol"),e[h].overloadTable!==void 0&&b!==void 0?e[h].overloadTable[b]=d:(e[h]=d,e[h].argCount=b)},W=h=>As.get(h),nt=(h,d,b=[],P=!1)=>{var F=W(d),X=F(...b);function $(J){return h[0]=="p"?J>>>0:J}return $(X)},it=(h,d,b=!1)=>(...P)=>nt(h,d,P,b),G=(h,d,b=!1)=>{h=Et(h);function P(){if(h.includes("p"))return it(h,d,b);var X=W(d);return X}var F=P();return typeof F!="function"&&ct(`unknown function pointer with signature ${h}: ${d}`),F};class At extends Error{}var Ot=h=>{var d=yu(h),b=Et(d);return Ii(d),b},Ht=(h,d)=>{var b=[],P={};function F(X){if(!P[X]&&!B[X]){if(Z[X]){Z[X].forEach(F);return}b.push(X),P[X]=!0}}throw d.forEach(F),new At(`${h}: `+b.map(Ot).join([", "]))};function $t(h,d,b,P,F,X,$,J,mt,yt,wt,Pt,zt){h>>>=0,d>>>=0,b>>>=0,P>>>=0,F>>>=0,X>>>=0,$>>>=0,J>>>=0,mt>>>=0,yt>>>=0,wt>>>=0,Pt>>>=0,zt>>>=0,wt=Et(wt),X=G(F,X),J&&(J=G($,J)),yt&&(yt=G(mt,yt)),zt=G(Pt,zt);var Yt=lo(wt);en(Yt,function(){Ht(`Cannot construct ${wt} due to unbound types`,[P])}),bt([h,d,b],P?[P]:[],Kt=>{var Se;Kt=Kt[0];var ie,ue;P?(ie=Kt.registeredClass,ue=ie.instancePrototype):ue=oe.prototype;var U=Ne(wt,function(...ze){if(Object.getPrototypeOf(this)!==H)throw new ne(`Use 'new' to construct ${wt}`);if(at.constructor_body===void 0)throw new ne(`${wt} has no accessible constructor`);var Pe=at.constructor_body[ze.length];if(Pe===void 0)throw new ne(`Tried to invoke ctor of ${wt} with invalid number of parameters (${ze.length}) - expected (${Object.keys(at.constructor_body).toString()}) parameters instead!`);return Pe.apply(this,ze)}),H=Object.create(ue,{constructor:{value:U}});U.prototype=H;var at=new hi(wt,U,H,zt,ie,X,J,yt);at.baseClass&&((Se=at.baseClass).__derivedClasses??(Se.__derivedClasses=[]),at.baseClass.__derivedClasses.push(at));var vt=new Fr(wt,at,!0,!1,!1),Wt=new Fr(wt+"*",at,!1,!1,!1),le=new Fr(wt+" const*",at,!1,!0,!1);return je[h]={pointerType:Wt,constPointerType:le},E(Yt,U),[vt,Wt,le]})}var re=(h,d)=>{for(var b=[],P=0;P<h;P++)b.push(A[d+P*4>>>2>>>0]);return b};function ae(h){for(var d=1;d<h.length;++d)if(h[d]!==null&&h[d].destructorFunction===void 0)return!0;return!1}var Zt={ftf:function(d,b,P,F,X,$,J){return function(){var mt=P(F),yt=$(mt);return yt}},tffn:function(d,b,P,F,X,$,J){return function(){var mt=J(null,this);P(F,mt)}},ttfn:function(d,b,P,F,X,$,J){return function(){var mt=J(null,this),yt=P(F,mt),wt=$(yt);return wt}},ttfnn:function(d,b,P,F,X,$,J,mt){return function(yt){var wt=J(null,this),Pt=mt(null,yt),zt=P(F,wt,Pt),Yt=$(zt);return Yt}},ttfnnn:function(d,b,P,F,X,$,J,mt,yt){return function(wt,Pt){var zt=J(null,this),Yt=mt(null,wt),Kt=yt(null,Pt),ie=P(F,zt,Yt,Kt),ue=$(ie);return ue}},ttfnntnnn:function(d,b,P,F,X,$,J,mt,yt,wt,Pt,zt,Yt){return function(Kt,ie,ue,U,H){var at=J(null,this),vt=mt(null,Kt),Wt=yt(null,ie),le=wt(null,ue),Se=Pt(null,U),ze=zt(null,H),Pe=P(F,at,vt,Wt,le,Se,ze);Yt(Wt);var Zn=$(Pe);return Zn}},tffnt:function(d,b,P,F,X,$,J,mt,yt){return function(wt){var Pt=J(null,this),zt=mt(null,wt);P(F,Pt,zt),yt(zt)}},tffnnt:function(d,b,P,F,X,$,J,mt,yt,wt){return function(Pt,zt){var Yt=J(null,this),Kt=mt(null,Pt),ie=yt(null,zt);P(F,Yt,Kt,ie),wt(ie)}},ttfnnt:function(d,b,P,F,X,$,J,mt,yt,wt){return function(Pt,zt){var Yt=J(null,this),Kt=mt(null,Pt),ie=yt(null,zt),ue=P(F,Yt,Kt,ie);wt(ie);var U=$(ue);return U}},tffnn:function(d,b,P,F,X,$,J,mt){return function(yt){var wt=J(null,this),Pt=mt(null,yt);P(F,wt,Pt)}},tffnnn:function(d,b,P,F,X,$,J,mt,yt){return function(wt,Pt){var zt=J(null,this),Yt=mt(null,wt),Kt=yt(null,Pt);P(F,zt,Yt,Kt)}},ftfnn:function(d,b,P,F,X,$,J,mt,yt){return function(wt,Pt){var zt=mt(null,wt),Yt=yt(null,Pt),Kt=P(F,zt,Yt),ie=$(Kt);return ie}},ttfnt:function(d,b,P,F,X,$,J,mt,yt){return function(wt){var Pt=J(null,this),zt=mt(null,wt),Yt=P(F,Pt,zt);yt(zt);var Kt=$(Yt);return Kt}},ttfnnnnn:function(d,b,P,F,X,$,J,mt,yt,wt,Pt){return function(zt,Yt,Kt,ie){var ue=J(null,this),U=mt(null,zt),H=yt(null,Yt),at=wt(null,Kt),vt=Pt(null,ie),Wt=P(F,ue,U,H,at,vt),le=$(Wt);return le}},ftftn:function(d,b,P,F,X,$,J,mt,yt,wt){return function(Pt,zt){var Yt=mt(null,Pt),Kt=yt(null,zt),ie=P(F,Yt,Kt);wt(Yt);var ue=$(ie);return ue}},ftfn:function(d,b,P,F,X,$,J,mt){return function(yt){var wt=mt(null,yt),Pt=P(F,wt),zt=$(Pt);return zt}},fffnn:function(d,b,P,F,X,$,J,mt,yt){return function(wt,Pt){var zt=mt(null,wt),Yt=yt(null,Pt);P(F,zt,Yt)}},ttfntn:function(d,b,P,F,X,$,J,mt,yt,wt){return function(Pt,zt){var Yt=J(null,this),Kt=mt(null,Pt),ie=yt(null,zt),ue=P(F,Yt,Kt,ie);wt(Kt);var U=$(ue);return U}},ttfnnnn:function(d,b,P,F,X,$,J,mt,yt,wt){return function(Pt,zt,Yt){var Kt=J(null,this),ie=mt(null,Pt),ue=yt(null,zt),U=wt(null,Yt),H=P(F,Kt,ie,ue,U),at=$(H);return at}},ttfntt:function(d,b,P,F,X,$,J,mt,yt,wt,Pt){return function(zt,Yt){var Kt=J(null,this),ie=mt(null,zt),ue=yt(null,Yt),U=P(F,Kt,ie,ue);wt(ie),Pt(ue);var H=$(U);return H}},ftfnnnnn:function(d,b,P,F,X,$,J,mt,yt,wt,Pt,zt){return function(Yt,Kt,ie,ue,U){var H=mt(null,Yt),at=yt(null,Kt),vt=wt(null,ie),Wt=Pt(null,ue),le=zt(null,U),Se=P(F,H,at,vt,Wt,le),ze=$(Se);return ze}},ftfnnnnt:function(d,b,P,F,X,$,J,mt,yt,wt,Pt,zt,Yt){return function(Kt,ie,ue,U,H){var at=mt(null,Kt),vt=yt(null,ie),Wt=wt(null,ue),le=Pt(null,U),Se=zt(null,H),ze=P(F,at,vt,Wt,le,Se);Yt(Se);var Pe=$(ze);return Pe}},ftfnnn:function(d,b,P,F,X,$,J,mt,yt,wt){return function(Pt,zt,Yt){var Kt=mt(null,Pt),ie=yt(null,zt),ue=wt(null,Yt),U=P(F,Kt,ie,ue),H=$(U);return H}},ftfntnnn:function(d,b,P,F,X,$,J,mt,yt,wt,Pt,zt,Yt){return function(Kt,ie,ue,U,H){var at=mt(null,Kt),vt=yt(null,ie),Wt=wt(null,ue),le=Pt(null,U),Se=zt(null,H),ze=P(F,at,vt,Wt,le,Se);Yt(vt);var Pe=$(ze);return Pe}},fffn:function(d,b,P,F,X,$,J,mt){return function(yt){var wt=mt(null,yt);P(F,wt)}},fff:function(d,b,P,F,X,$,J){return function(){P(F)}}};function Me(h,d,b,P){const F=[d?"t":"f",b?"t":"f",P?"t":"f"];for(let X=d?1:2;X<h.length;++X){const $=h[X];let J="";$.destructorFunction===void 0?J="u":$.destructorFunction===null?J="n":J="t",F.push(J)}return F.join("")}function ye(h,d,b,P,F,X){var $=d.length;$<2&&ct("argTypes array size mismatch! Must at least get return value and 'this' types!");for(var J=d[1]!==null&&b!==null,mt=ae(d),yt=!d[0].isVoid,wt=d[0],Pt=d[1],zt=[h,ct,P,F,q,wt.fromWireType.bind(wt),Pt==null?void 0:Pt.toWireType.bind(Pt)],Yt=2;Yt<$;++Yt){var Kt=d[Yt];zt.push(Kt.toWireType.bind(Kt))}if(!mt)for(var Yt=J?1:2;Yt<d.length;++Yt)d[Yt].destructorFunction!==null&&zt.push(d[Yt].destructorFunction);var ie=Me(d,J,yt,X),ue=Zt[ie](...zt);return Ne(h,ue)}var Xe=function(h,d,b,P,F,X){h>>>=0,b>>>=0,P>>>=0,F>>>=0,X>>>=0;var $=re(d,b);F=G(P,F),bt([],[h],J=>{J=J[0];var mt=`constructor ${J.name}`;if(J.registeredClass.constructor_body===void 0&&(J.registeredClass.constructor_body=[]),J.registeredClass.constructor_body[d-1]!==void 0)throw new ne(`Cannot register multiple constructors with identical number of parameters (${d-1}) for class '${J.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`);return J.registeredClass.constructor_body[d-1]=()=>{Ht(`Cannot construct ${J.name} due to unbound types`,$)},bt([],$,yt=>(yt.splice(1,0,null),J.registeredClass.constructor_body[d-1]=ye(mt,yt,null,F,X),[])),[]})},He=h=>{h=h.trim();const d=h.indexOf("(");return d===-1?h:h.slice(0,d)},Ee=function(h,d,b,P,F,X,$,J,mt,yt){h>>>=0,d>>>=0,P>>>=0,F>>>=0,X>>>=0,$>>>=0;var wt=re(b,P);d=Et(d),d=He(d),X=G(F,X,mt),bt([],[h],Pt=>{Pt=Pt[0];var zt=`${Pt.name}.${d}`;d.startsWith("@@")&&(d=Symbol[d.substring(2)]),J&&Pt.registeredClass.pureVirtualFunctions.push(d);function Yt(){Ht(`Cannot call ${zt} due to unbound types`,wt)}var Kt=Pt.registeredClass.instancePrototype,ie=Kt[d];return ie===void 0||ie.overloadTable===void 0&&ie.className!==Pt.name&&ie.argCount===b-2?(Yt.argCount=b-2,Yt.className=Pt.name,Kt[d]=Yt):(we(Kt,d,zt),Kt[d].overloadTable[b-2]=Yt),bt([],wt,ue=>{var U=ye(zt,ue,Pt,X,$,mt);return Kt[d].overloadTable===void 0?(U.argCount=b-2,Kt[d]=U):Kt[d].overloadTable[b-2]=U,[]}),[]})},Jt=[],ke=[0,1,,1,null,1,!0,1,!1,1];function be(h){h>>>=0,h>9&&--ke[h+1]===0&&(ke[h]=void 0,Jt.push(h))}var Re={toValue:h=>(h||ct(`Cannot use deleted val. handle = ${h}`),ke[h]),toHandle:h=>{switch(h){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:{const d=Jt.pop()||ke.length;return ke[d]=h,ke[d+1]=1,d}}}},di={name:"emscripten::val",fromWireType:h=>{var d=Re.toValue(h);return be(h),d},toWireType:(h,d)=>Re.toHandle(d),readValueFromPointer:T,destructorFunction:null};function fn(h){return h>>>=0,kt(h,di)}var pi=(h,d,b)=>{switch(d){case 1:return b?function(P){return this.fromWireType(S[P>>>0])}:function(P){return this.fromWireType(V[P>>>0])};case 2:return b?function(P){return this.fromWireType(C[P>>>1>>>0])}:function(P){return this.fromWireType(I[P>>>1>>>0])};case 4:return b?function(P){return this.fromWireType(z[P>>>2>>>0])}:function(P){return this.fromWireType(A[P>>>2>>>0])};default:throw new TypeError(`invalid integer width (${d}): ${h}`)}};function Be(h){return h===0?"object":h===1?"number":"string"}function Mn(h,d,b,P,F){h>>>=0,d>>>=0,b>>>=0,d=Et(d);const X=Be(F);switch(X){case"object":{let yt=function(){};yt.values={},kt(h,{name:d,constructor:yt,valueType:X,fromWireType:function(wt){return this.constructor.values[wt]},toWireType:(wt,Pt)=>Pt.value,readValueFromPointer:pi(d,b,P),destructorFunction:null}),en(d,yt);break}case"number":{var $={};kt(h,{name:d,keysMap:$,valueType:X,fromWireType:yt=>yt,toWireType:(yt,wt)=>wt,readValueFromPointer:pi(d,b,P),destructorFunction:null}),en(d,$),delete e[d].argCount;break}case"string":{var J={},mt={},$={};kt(h,{name:d,valuesMap:J,reverseMap:mt,keysMap:$,valueType:X,fromWireType:function(wt){return this.reverseMap[wt]},toWireType:function(wt,Pt){return this.valuesMap[Pt]},readValueFromPointer:pi(d,b,P),destructorFunction:null}),en(d,$),delete e[d].argCount;break}}}var hn=(h,d)=>{var b=B[h];return b===void 0&&ct(`${d} has unknown type ${Ot(h)}`),b};function nn(h,d,b){h>>>=0,d>>>=0;var P=hn(h,"enum");switch(d=Et(d),P.valueType){case"object":{var F=P.constructor,X=Object.create(P.constructor.prototype,{value:{value:b},constructor:{value:Ne(`${P.name}_${d}`,function(){})}});F.values[b]=X,F[d]=X;break}case"number":{P.keysMap[d]=b;break}case"string":{P.valuesMap[d]=b,P.reverseMap[b]=d,P.keysMap[d]=d;break}}}var on=(h,d)=>{switch(d){case 4:return function(b){return this.fromWireType(y[b>>>2>>>0])};case 8:return function(b){return this.fromWireType(O[b>>>3>>>0])};default:throw new TypeError(`invalid float width (${d}): ${h}`)}},Ts=function(h,d,b){h>>>=0,d>>>=0,b>>>=0,d=Et(d),kt(h,{name:d,fromWireType:P=>P,toWireType:(P,F)=>F,readValueFromPointer:on(d,b),destructorFunction:null})};function mi(h,d,b,P,F,X,$,J){h>>>=0,b>>>=0,P>>>=0,F>>>=0,X>>>=0;var mt=re(d,b);h=Et(h),h=He(h),F=G(P,F,$),en(h,function(){Ht(`Cannot call ${h} due to unbound types`,mt)},d-1),bt([],mt,yt=>{var wt=[yt[0],null].concat(yt.slice(1));return E(h,ye(h,wt,null,F,X,$),d-1),[]})}var mp=function(h,d,b,P,F){h>>>=0,d>>>=0,b>>>=0,d=Et(d);const X=P===0;let $=mt=>mt;if(X){var J=32-8*b;$=mt=>mt<<J>>>J,F=$(F)}kt(h,{name:d,fromWireType:$,toWireType:(mt,yt)=>yt,readValueFromPointer:qt(d,b,P!==0),destructorFunction:null})},_p=(h,d,b)=>{const P=(F,X)=>{let $=0;return{next(){if($>=F)return{done:!0};const J=$;return $++,{value:X(J),done:!1}},[Symbol.iterator](){return this}}};h[Symbol.iterator]||(h[Symbol.iterator]=function(){const F=this[d]();return P(F,X=>this[b](X))})},gp=function(h,d,b,P){h>>>=0,d>>>=0,b>>>=0,P>>>=0,b=Et(b),P=Et(P),bt([],[h,d],F=>{const X=F[0];return _p(X.registeredClass.instancePrototype,b,P),[]})};function vp(h,d,b){h>>>=0,b>>>=0;var P=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array],F=P[d];function X($){var J=A[$>>>2>>>0],mt=A[$+4>>>2>>>0];return new F(S.buffer,mt,J)}b=Et(b),kt(h,{name:b,fromWireType:X,readValueFromPointer:X},{ignoreDuplicateRegistrations:!0})}var xp=Object.assign({optional:!0},di);function Mp(h,d){h>>>=0,kt(h,xp)}var Sp=(h,d,b,P)=>{if(b>>>=0,!(P>0))return 0;for(var F=b,X=b+P-1,$=0;$<h.length;++$){var J=h.codePointAt($);if(J<=127){if(b>=X)break;d[b++>>>0]=J}else if(J<=2047){if(b+1>=X)break;d[b++>>>0]=192|J>>6,d[b++>>>0]=128|J&63}else if(J<=65535){if(b+2>=X)break;d[b++>>>0]=224|J>>12,d[b++>>>0]=128|J>>6&63,d[b++>>>0]=128|J&63}else{if(b+3>=X)break;d[b++>>>0]=240|J>>18,d[b++>>>0]=128|J>>12&63,d[b++>>>0]=128|J>>6&63,d[b++>>>0]=128|J&63,$++}}return d[b>>>0]=0,b-F},yp=(h,d,b)=>Sp(h,V,d,b),Ep=h=>{for(var d=0,b=0;b<h.length;++b){var P=h.charCodeAt(b);P<=127?d++:P<=2047?d+=2:P>=55296&&P<=57343?(d+=4,++b):d+=3}return d},_u=globalThis.TextDecoder&&new TextDecoder,gu=(h,d,b,P)=>{var F=d+b;if(P)return F;for(;h[d]&&!(d>=F);)++d;return d},bp=(h,d=0,b,P)=>{d>>>=0;var F=gu(h,d,b,P);if(F-d>16&&h.buffer&&_u)return _u.decode(h.subarray(d,F));for(var X="";d<F;){var $=h[d++];if(!($&128)){X+=String.fromCharCode($);continue}var J=h[d++]&63;if(($&224)==192){X+=String.fromCharCode(($&31)<<6|J);continue}var mt=h[d++]&63;if(($&240)==224?$=($&15)<<12|J<<6|mt:$=($&7)<<18|J<<12|mt<<6|h[d++]&63,$<65536)X+=String.fromCharCode($);else{var yt=$-65536;X+=String.fromCharCode(55296|yt>>10,56320|yt&1023)}}return X},Tp=(h,d,b)=>(h>>>=0,h?bp(V,h,d,b):"");function Ap(h,d){h>>>=0,d>>>=0,d=Et(d),kt(h,{name:d,fromWireType(b){var P=A[b>>>2>>>0],F=b+4,X;return X=Tp(F,P,!0),Ii(b),X},toWireType(b,P){P instanceof ArrayBuffer&&(P=new Uint8Array(P));var F,X=typeof P=="string";X||ArrayBuffer.isView(P)&&P.BYTES_PER_ELEMENT==1||ct("Cannot pass non-string to std::string"),X?F=Ep(P):F=P.length;var $=ka(4+F+1),J=$+4;return A[$>>>2>>>0]=F,X?yp(P,J,F+1):V.set(P,J>>>0),b!==null&&b.push(Ii,$),$},readValueFromPointer:T,destructorFunction(b){Ii(b)}})}var vu=globalThis.TextDecoder?new TextDecoder("utf-16le"):void 0,wp=(h,d,b)=>{var P=h>>>1,F=gu(I,P,d/2,b);if(F-P>16&&vu)return vu.decode(I.subarray(P>>>0,F>>>0));for(var X="",$=P;$<F;++$){var J=I[$>>>0];X+=String.fromCharCode(J)}return X},Rp=(h,d,b)=>{if(b??(b=2147483647),b<2)return 0;b-=2;for(var P=d,F=b<h.length*2?b/2:h.length,X=0;X<F;++X){var $=h.charCodeAt(X);C[d>>>1>>>0]=$,d+=2}return C[d>>>1>>>0]=0,d-P},Cp=h=>h.length*2,Pp=(h,d,b)=>{for(var P="",F=h>>>2,X=0;!(X>=d/4);X++){var $=A[F+X>>>0];if(!$&&!b)break;P+=String.fromCodePoint($)}return P},Dp=(h,d,b)=>{if(d>>>=0,b??(b=2147483647),b<4)return 0;for(var P=d,F=P+b-4,X=0;X<h.length;++X){var $=h.codePointAt(X);if($>65535&&X++,z[d>>>2>>>0]=$,d+=4,d+4>F)break}return z[d>>>2>>>0]=0,d-P},Lp=h=>{for(var d=0,b=0;b<h.length;++b){var P=h.codePointAt(b);P>65535&&b++,d+=4}return d};function Ip(h,d,b){h>>>=0,d>>>=0,b>>>=0,b=Et(b);var P,F,X;d===2?(P=wp,F=Rp,X=Cp):(P=Pp,F=Dp,X=Lp),kt(h,{name:b,fromWireType:$=>{var J=A[$>>>2>>>0],mt=P($+4,J*d,!0);return Ii($),mt},toWireType:($,J)=>{typeof J!="string"&&ct(`Cannot pass non-string to C++ string type ${b}`);var mt=X(J),yt=ka(4+mt+d);return A[yt>>>2>>>0]=mt/d,F(J,yt+4,mt+d),$!==null&&$.push(Ii,yt),yt},readValueFromPointer:T,destructorFunction($){Ii($)}})}function Up(h,d,b,P,F,X){h>>>=0,d>>>=0,b>>>=0,P>>>=0,F>>>=0,X>>>=0,xt[h]={name:Et(d),rawConstructor:G(b,P),rawDestructor:G(F,X),fields:[]}}function Np(h,d,b,P,F,X,$,J,mt,yt){h>>>=0,d>>>=0,b>>>=0,P>>>=0,F>>>=0,X>>>=0,$>>>=0,J>>>=0,mt>>>=0,yt>>>=0,xt[h].fields.push({fieldName:Et(d),getterReturnType:b,getter:G(P,F),getterContext:X,setterArgumentType:$,setter:G(J,mt),setterContext:yt})}var Fp=function(h,d){h>>>=0,d>>>=0,d=Et(d),kt(h,{isVoid:!0,name:d,fromWireType:()=>{},toWireType:(b,P)=>{}})};function Op(h,d){h>>>=0,d>>>=0,h=Re.toValue(h),d=Re.toValue(d),h.set(d)}var za=[],Bp=h=>{var d=za.length;return za.push(h),d},zp=(h,d)=>{for(var b=new Array(h),P=0;P<h;++P)b[P]=hn(A[d+P*4>>>2>>>0],`parameter ${P}`);return b},Vp=(h,d,b)=>{var P=[],F=h(P,b);return P.length&&(A[d>>>2>>>0]=Re.toHandle(P)),F},Hp={},xu=h=>{var d=Hp[h];return d===void 0?Et(h):d},kp=function(h,d,b){d>>>=0;var P=8,[F,...X]=zp(h,d),$=F.toWireType.bind(F),J=X.map(Pt=>Pt.readValueFromPointer.bind(Pt));h--;var mt=new Array(h),yt=(Pt,zt,Yt,Kt)=>{for(var ie=0,ue=0;ue<h;++ue)mt[ue]=J[ue](Kt+ie),ie+=P;var U;switch(b){case 0:U=Re.toValue(Pt).apply(null,mt);break;case 2:U=Reflect.construct(Re.toValue(Pt),mt);break;case 3:U=mt[0];break;case 1:U=Re.toValue(Pt)[xu(zt)](...mt);break}return Vp($,Yt,U)},wt=`methodCaller<(${X.map(Pt=>Pt.name)}) => ${F.name}>`;return Bp(Ne(wt,yt))};function Gp(h,d){return h>>>=0,d>>>=0,h=Re.toValue(h),d=Re.toValue(d),h==d}function Wp(h,d){return h>>>=0,d>>>=0,h=Re.toValue(h),d=Re.toValue(d),Re.toHandle(h[d])}function Xp(h){h>>>=0,h>9&&(ke[h+1]+=1)}function $p(h,d,b,P,F){return h>>>=0,d>>>=0,b>>>=0,P>>>=0,F>>>=0,za[h](d,b,P,F)}function Yp(h){return h>>>=0,Re.toHandle(xu(h))}function qp(){return Re.toHandle({})}function jp(h){h>>>=0;var d=Re.toValue(h);q(d),be(h)}function Kp(h,d,b){h>>>=0,d>>>=0,b>>>=0,h=Re.toValue(h),d=Re.toValue(d),b=Re.toValue(b),h[d]=b}var Zp=()=>4294901760,Jp=(h,d)=>Math.ceil(h/d)*d,Qp=h=>{var d=po.buffer.byteLength,b=(h-d+65535)/65536|0;try{return po.grow(b),St(),1}catch{}};function tm(h){h>>>=0;var d=V.length,b=Zp();if(h>b)return!1;for(var P=1;P<=4;P*=2){var F=d*(1+.2/P);F=Math.min(F,h+100663296);var X=Math.min(b,Jp(Math.max(h,F),65536)),$=Qp(X);if($)return!0}return!1}var em=(h,d)=>{if(er)for(var b=h;b<h+d;b++){var P=W(b);P&&er.set(P,b)}},er,nm=h=>(er||(er=new WeakMap,em(0,As.length)),er.get(h)||0),Va=[],im=()=>Va.length?Va.pop():As.grow(1),Ha=(h,d)=>As.set(h,d),Mu=h=>{const d=h.length;return[d%128|128,d>>7,...h]},rm={i:127,p:127,j:126,f:125,d:124,e:111},Su=h=>Mu(Array.from(h,d=>{var b=rm[d];return b})),sm=(h,d)=>{var b=Uint8Array.of(0,97,115,109,1,0,0,0,1,...Mu([1,96,...Su(d.slice(1)),...Su(d[0]==="v"?"":d[0])]),2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0),P=new WebAssembly.Module(b),F=new WebAssembly.Instance(P,{e:{f:h}}),X=F.exports.f;return X},nr=(h,d)=>{var b=nm(h);if(b)return b;var P=im();try{Ha(P,h)}catch(X){if(!(X instanceof TypeError))throw X;var F=sm(h,d);Ha(P,F)}return er.set(h,P),P},ir=h=>{er.delete(W(h)),Ha(h,null),Va.push(h)};if(Vt(),Ba(),e.noExitRuntime&&e.noExitRuntime,e.print&&e.print,e.printErr&&(x=e.printErr),e.wasmBinary&&(M=e.wasmBinary),e.arguments&&e.arguments,e.thisProgram&&e.thisProgram,e.preInit)for(typeof e.preInit=="function"&&(e.preInit=[e.preInit]);e.preInit.length>0;)e.preInit.shift()();e.addFunction=nr,e.removeFunction=ir;var yu,ka,Ii,po,As;function om(h){yu=h.K,ka=h.M,Ii=h.N,po=h.I,As=h.L}var am={l:gt,C:st,q:Tt,z:It,G:ge,j:$t,i:Xe,a:Ee,E:fn,x:Mn,d:nn,y:Ts,c:mi,p:mp,m:gp,h:vp,n:Mp,F:Ap,w:Ip,r:Up,k:Np,H:Fp,u:Op,g:kp,b:be,o:Gp,B:Wp,t:Xp,f:$p,s:Yp,A:qp,e:jp,v:Kp,D:tm};function lm(h){h=Object.assign({},h);var d=P=>F=>P(F)>>>0,b=P=>()=>P()>>>0;return h.K=d(h.K),h.M=d(h.M),h._emscripten_stack_alloc=d(h._emscripten_stack_alloc),h.emscripten_stack_get_current=b(h.emscripten_stack_get_current),h}function cm(){tt();function h(){var d;e.calledRun=!0,!g&&(dt(),L==null||L(e),(d=e.onRuntimeInitialized)==null||d.call(e),K())}e.setStatus?(e.setStatus("Running..."),setTimeout(()=>{setTimeout(()=>e.setStatus(""),1),h()},1)):h()}var rr;return rr=await Lt(),cm(),ht?t=e:t=new Promise((h,d)=>{L=h,R=d}),t}const RE=""+new URL("manifold-B_yLhOkb.wasm",import.meta.url).href;let _a=null;async function CE(){if(_a)return;const n=await wE({locateFile:()=>RE});n.setup(),_a=n}function op(){if(!_a)throw new Error("manifold-3d 尚未初始化");return _a}function ap(...n){for(const t of n)try{t==null||t.delete()}catch{}}function lp(n){let t=0;for(let e=0;e<n.length;e++){const[i,r]=n[e],[s,o]=n[(e+1)%n.length];t+=i*o-s*r}return t>=0?n:[...n].reverse()}function PE(n,t,e,i,r,s){const{Manifold:o}=op(),a=lp(n),l=o.extrude(a,t);if(e<=0){const x=l.volume();return{solid:l,volume:x}}let c=1;for(const[x,M]of n)c=Math.max(c,Math.abs(x),Math.abs(M));const u=(c*2+t)*4,f=o.cube([u,u,u]).translate([-u/2,-u/2,-u]).rotate([0,s,0]).rotate([0,0,r]).translate([0,0,e*i]),p=o.difference(l,f),_=p.volume();return ap(l,f),{solid:p,volume:_}}function DE(n,t,e,i,r,s){if(e<=0)return null;const{Manifold:o}=op(),a=lp(n);let l=1;for(const[M,g]of a)l=Math.max(l,Math.abs(M),Math.abs(g));const c=(l*2+t)*4,u=o.extrude(a,t),f=o.cube([c,c,c]).translate([-c/2,-c/2,-c]).rotate([0,s,0]).rotate([0,0,r]).translate([0,0,e*i]),p=o.intersection(u,f),_=p.getMesh(),x=cp(_);return ap(u,f,p),x}function cp(n){const t=n.numProp,e=n.vertProperties,i=n.triVerts,r=n.numVert,s=new Float32Array(r*3);for(let o=0;o<r;o++)s[o*3]=e[o*t],s[o*3+1]=e[o*t+1],s[o*3+2]=e[o*t+2];return{positions:s,indices:new Uint32Array(i)}}function LE(n){const t=n.getMesh(),e=cp(t);return n.delete(),e}const up="tunnel-excavation-sim:v1",fp=[[5,0],[5,3],[4.6,4.4],[3.6,5.5],[2.1,6.3],[0,6.6],[-2.1,6.3],[-3.6,5.5],[-4.6,4.4],[-5,3],[-5,0]],ft=ba({profile:fp.map(n=>[...n]),stepLength:2,totalSteps:8,cutAngle:0,tiltAngle:30,currentStep:0,playing:!1,showGhost:!0,manifoldReady:!1,computing:!1,steps:[],initialVolume:0,status:"",statusError:!1}),ga=()=>ft.stepLength*ft.totalSteps;let Ul=0,Nl=null;function mu(n=!1){Nl&&clearTimeout(Nl),Nl=setTimeout(()=>hp(),n?0:250)}async function hp(){var t;const n=++Ul;ft.computing=!0,cs("正在计算开挖步序…");try{await CE(),ft.manifoldReady=!0;const e=ft.profile.map(s=>[...s]),i=ga(),r=[];for(let s=0;s<=ft.totalSteps;s++){const{solid:o,volume:a}=PE(e,i,s,ft.stepLength,ft.cutAngle,ft.tiltAngle);if(r.push({mesh:LE(o),volume:a}),n!==Ul)return}ft.steps=r,ft.initialVolume=((t=r[0])==null?void 0:t.volume)??0,ft.currentStep>ft.totalSteps&&(ft.currentStep=ft.totalSteps),cs("")}catch(e){cs(`计算失败:${e instanceof Error?e.message:String(e)}`,!0)}finally{n===Ul&&(ft.computing=!1)}}function cs(n,t=!1){ft.status=n,ft.statusError=t}let ea=null;function Nc(){ft.playing||ft.steps.length===0||(ft.currentStep>=ft.totalSteps&&(ft.currentStep=0),ft.playing=!0,ea=setInterval(()=>{if(ft.currentStep>=ft.totalSteps){Fc();return}ft.currentStep+=1},700))}function Fc(){ft.playing=!1,ea&&(clearInterval(ea),ea=null)}function dp(){return{version:1,profile:ft.profile.map(n=>[...n]),stepLength:ft.stepLength,totalSteps:ft.totalSteps,cutAngle:ft.cutAngle,tiltAngle:ft.tiltAngle}}function IE(){try{localStorage.setItem(up,JSON.stringify(dp()))}catch{}}function UE(){try{const n=localStorage.getItem(up);return n?pp(JSON.parse(n)):!1}catch{return!1}}function pp(n){const t=n;return!t||!Array.isArray(t.profile)||t.profile.length<3||!t.profile.every(e=>Array.isArray(e)&&e.length===2&&e.every(i=>Number.isFinite(i)))?(cs("数据无效:断面轮廓缺失或格式错误",!0),!1):(ft.profile=t.profile.map(e=>[Number(e[0]),Number(e[1])]),ft.stepLength=Xo(Number(t.stepLength)||2,1,5),ft.totalSteps=Math.round(Xo(Number(t.totalSteps)||8,3,20)),ft.cutAngle=Xo(Number(t.cutAngle)||0,0,360),ft.tiltAngle=Xo(Number(t.tiltAngle??30),0,60),ft.currentStep=0,mu(!0),!0)}function Xo(n,t,e){return Math.min(e,Math.max(t,n))}function ph(){const n=new Blob([JSON.stringify(dp(),null,2)],{type:"application/json"}),t=URL.createObjectURL(n),e=document.createElement("a");e.href=t,e.download=`tunnel-sim-${new Date().toISOString().slice(0,10)}.json`,e.click(),URL.revokeObjectURL(t)}async function NE(n){try{const t=await n.text();pp(JSON.parse(t))&&(cs(`已导入 ${n.name},开始回放`),ft.currentStep=0,Nc())}catch(t){cs(`导入失败:${t instanceof Error?t.message:String(t)}`,!0)}}Tr(()=>[ft.profile,ft.stepLength,ft.totalSteps,ft.cutAngle,ft.tiltAngle],()=>{IE(),mu()},{deep:!0});async function FE(){UE(),await hp()}const OE={class:"hud"},BE={key:0},zE=wa({__name:"Viewport",setup(n){const t=na();let e,i,r,s,o,a,l,c,u=0,f=null;function p(L){const R=new vn;R.setAttribute("position",new Fn(L.positions,3)),R.setIndex(new Fn(L.indices,1));const S=R.toNonIndexed();return S.computeVertexNormals(),R.dispose(),S}function _(){let L=1/0,R=-1/0,S=1/0,V=-1/0;for(const[C,I]of ft.profile)L=Math.min(L,C),R=Math.max(R,C),S=Math.min(S,I),V=Math.max(V,I);return{w:R-L,h:V-S,cx:(L+R)/2,cy:(S+V)/2}}function x(){const L=new oi,R=new oi().setFromAxisAngle(new j(0,1,0),Ic.degToRad(ft.tiltAngle)),S=new oi().setFromAxisAngle(new j(0,0,1),Ic.degToRad(ft.cutAngle));return L.copy(S).multiply(R),L}function M(){const L=ft.profile.map(([R,S])=>new j(R,S,0));c.geometry.dispose(),c.geometry=new vn().setFromPoints(L)}function g(){const L=ft.steps[ft.currentStep];if(!L)return;const R=o.geometry;if(o.geometry=p(L.mesh),R.dispose(),ft.showGhost&&ft.currentStep>0){const y=DE(ft.profile.map(O=>[...O]),ga(),ft.currentStep,ft.stepLength,ft.cutAngle,ft.tiltAngle);if(y){const O=a.geometry;a.geometry=p(y),O.dispose(),a.visible=!0}}else a.visible=!1;const S=ft.currentStep*ft.stepLength,{w:V,h:C,cx:I,cy:z}=_(),A=Math.max(V,C)*1.6;l.geometry.dispose(),l.geometry=new xs(A,A),l.position.set(I,z,S),l.quaternion.copy(x()),l.visible=ft.currentStep>0&&ft.currentStep<=ft.totalSteps,c.position.set(0,0,S)}function m(){const L=ga(),{w:R,h:S,cy:V}=_(),C=Math.max(R,S,L)*.9;r.position.set(C*.9,V+C*.6,L/2+C),s.target.set(0,V,L/2),s.update()}return Ra(()=>{const L=t.value;e=new cE({antialias:!0}),e.setPixelRatio(window.devicePixelRatio),L.appendChild(e.domElement),i=new d0,i.background=new xe(1316895),i.fog=new uu(1316895,120,400),r=new Dn(50,1,.1,2e3),s=new fE(r,e.domElement),s.enableDamping=!0,s.dampingFactor=.08,i.add(new E0(16777215,.45));const R=new Bf(16777215,1.4);R.position.set(40,80,30),i.add(R);const S=new Bf(8956671,.5);S.position.set(-30,20,-40),i.add(S),o=new Un(new vn,new Nf({color:10124111,roughness:.9,metalness:.05,side:Ln})),i.add(o),a=new Un(new vn,new Nf({color:5088255,transparent:!0,opacity:.14,depthWrite:!1,side:Ln})),i.add(a),l=new Un(new xs(1,1),new cu({color:16098851,transparent:!0,opacity:.3,side:Ln,depthWrite:!1})),i.add(l),c=new g0(new vn,new Ua({color:16769357})),i.add(c);const V=new vn().setFromPoints([new j(0,0,-5),new j(0,0,200)]);i.add(new hu(V,new M0({color:5088255,dashSize:1,gapSize:.8})));const C=new T0(200,40,2897218,2239030);C.material.transparent=!0,C.material.opacity=.5,i.add(C),M(),m(),g(),f=new ResizeObserver(()=>{const{clientWidth:z,clientHeight:A}=L;e.setSize(z,A),r.aspect=z/A,r.updateProjectionMatrix()}),f.observe(L);const I=()=>{u=requestAnimationFrame(I),s.update(),e.render(i,r)};I()}),Tr(()=>[ft.steps,ft.currentStep,ft.showGhost,ft.cutAngle,ft.tiltAngle],()=>g(),{deep:!0}),Tr(()=>[ft.profile,ft.stepLength,ft.totalSteps],()=>{M(),m(),g()},{deep:!0}),Qh(()=>{cancelAnimationFrame(u),f==null||f.disconnect(),s.dispose(),e.dispose(),e.domElement.remove()}),(L,R)=>{var S,V;return qi(),wr("div",{ref_key:"container",ref:t,class:"viewport-wrap"},[jt("div",OE,[jt("div",null,[R[0]||(R[0]=Wi("步序 ",-1)),jt("b",null,yn(fe(ft).currentStep),1),Wi(" / "+yn(fe(ft).totalSteps),1)]),jt("div",null,[R[1]||(R[1]=Wi("剩余体积 ",-1)),jt("b",null,yn((((S=fe(ft).steps[fe(ft).currentStep])==null?void 0:S.volume)??0).toFixed(1)),1),R[2]||(R[2]=Wi(" m³",-1))]),jt("div",null,[R[3]||(R[3]=Wi("剩余比例 ",-1)),jt("b",null,yn(fe(ft).initialVolume?((((V=fe(ft).steps[fe(ft).currentStep])==null?void 0:V.volume)??0)/fe(ft).initialVolume*100).toFixed(1):0),1),R[4]||(R[4]=Wi(" %",-1))]),fe(ft).manifoldReady?K_("",!0):(qi(),wr("div",BE,"正在加载 manifold-3d…"))])],512)}}}),VE={class:"panel-section"},Hi=332,ki=240,mh=24,HE=wa({__name:"ProfileEditor",setup(n){const t=na(),e=na("");let i=-1,r=20,s=0,o=0;function a(){let C=1/0,I=-1/0,z=1/0,A=-1/0;for(const[lt,Q]of ft.profile)C=Math.min(C,lt),I=Math.max(I,lt),z=Math.min(z,Q),A=Math.max(A,Q);const y=Math.max(I-C,1),O=Math.max(A-z,1);r=Math.min((Hi-mh*2)/y,(ki-mh*2)/O),s=Hi/2-(C+I)/2*r,o=ki/2+(z+A)/2*r}const l=(C,I)=>[C*r+s,-I*r+o],c=(C,I)=>[(C-s)/r,-(I-o)/r];function u(){var St;const C=(St=t.value)==null?void 0:St.getContext("2d");if(!C)return;a(),C.clearRect(0,0,Hi,ki),C.fillStyle="#10141b",C.fillRect(0,0,Hi,ki),C.strokeStyle="#222a36",C.lineWidth=1;const I=Math.max(1,Math.round(24/r)),[z,A]=c(0,0),[y,O]=c(Hi,ki);for(let tt=Math.floor(z/I)*I;tt<=y;tt+=I){const[dt]=l(tt,0);C.beginPath(),C.moveTo(dt,0),C.lineTo(dt,ki),C.stroke()}for(let tt=Math.floor(O/I)*I;tt<=A;tt+=I){const[,dt]=l(0,tt);C.beginPath(),C.moveTo(0,dt),C.lineTo(Hi,dt),C.stroke()}const[lt,Q]=l(0,0);C.strokeStyle="#3a4a63",C.beginPath(),C.moveTo(lt,0),C.lineTo(lt,ki),C.stroke(),C.beginPath(),C.moveTo(0,Q),C.lineTo(Hi,Q),C.stroke();const ht=ft.profile;C.beginPath(),ht.forEach(([tt,dt],K)=>{const[Rt,Dt]=l(tt,dt);K===0?C.moveTo(Rt,Dt):C.lineTo(Rt,Dt)}),C.closePath(),C.fillStyle="rgba(245,166,35,0.12)",C.fill(),C.strokeStyle="#f5a623",C.lineWidth=2,C.stroke(),ht.forEach(([tt,dt],K)=>{const[Rt,Dt]=l(tt,dt);C.beginPath(),C.arc(Rt,Dt,4,0,Math.PI*2),C.fillStyle=K===i?"#ffe14d":"#4da3ff",C.fill()})}function f(C,I){let z=-1,A=12;return ft.profile.forEach(([y,O],lt)=>{const[Q,ht]=l(y,O),St=Math.hypot(Q-C,ht-I);St<A&&(A=St,z=lt)}),z}function p(C,I){const z=ft.profile;let A=0,y=1/0;for(let O=0;O<z.length;O++){const[lt,Q]=l(z[O][0],z[O][1]),[ht,St]=l(z[(O+1)%z.length][0],z[(O+1)%z.length][1]),tt=ht-lt,dt=St-Q,K=tt*tt+dt*dt||1,Rt=Math.max(0,Math.min(1,((C-lt)*tt+(I-Q)*dt)/K)),Dt=Math.hypot(lt+Rt*tt-C,Q+Rt*dt-I);Dt<y&&(y=Dt,A=O)}return A}function _(C){const I=t.value.getBoundingClientRect();return[C.clientX-I.left,C.clientY-I.top]}function x(C){const[I,z]=_(C);i=f(I,z)}function M(C){if(i<0)return;const[I,z]=_(C),[A,y]=c(I,z);ft.profile[i]=[Math.round(A*10)/10,Math.round(y*10)/10]}function g(){i>=0&&R(),i=-1}function m(C){const[I,z]=_(C);if(f(I,z)>=0)return;const A=p(I,z),[y,O]=c(I,z);ft.profile.splice(A+1,0,[Math.round(y*10)/10,Math.round(O*10)/10]),R()}function L(C){if(C.preventDefault(),ft.profile.length<=3)return;const[I,z]=_(C),A=f(I,z);A>=0&&(ft.profile.splice(A,1),R())}function R(){e.value=ft.profile.map(([C,I])=>`${C}, ${I}`).join(`
`)}function S(){const C=[];for(const I of e.value.split(`
`)){const z=I.trim();if(!z)continue;const A=z.split(/[,\s]+/).map(Number);A.length>=2&&A.every(Number.isFinite)&&C.push([A[0],A[1]])}C.length>=3&&(ft.profile=C)}function V(){ft.profile=fp.map(C=>[...C])}return Tr(()=>ft.profile,()=>{u(),R()},{deep:!0}),Ra(()=>{R(),u(),mu()}),(C,I)=>(qi(),wr("div",VE,[I[1]||(I[1]=jt("h3",null,"断面轮廓",-1)),jt("canvas",{ref_key:"canvas",ref:t,width:Hi,height:ki,style:{"border-radius":"6px",cursor:"crosshair",width:"100%"},onMousedown:x,onMousemove:M,onMouseup:g,onMouseleave:g,onDblclick:m,onContextmenu:L},null,544),I[2]||(I[2]=jt("p",{class:"hint"},"拖拽移动顶点 · 双击空白加点 · 右键删点",-1)),pr(jt("textarea",{"onUpdate:modelValue":I[0]||(I[0]=z=>e.value=z),rows:"5",spellcheck:"false",onChange:S},null,544),[[Qr,e.value]]),jt("div",{class:"btn-row",style:{"margin-top":"6px"}},[jt("button",{onClick:S},"应用坐标"),jt("button",{onClick:V},"恢复默认断面")])]))}}),kE={class:"panel-section"},GE={class:"row"},WE={class:"row"},XE={class:"row"},$E={class:"row"},YE={class:"hint"},qE={class:"panel-section"},jE={class:"progress-outer"},KE={class:"progress-labels"},ZE={class:"step-slider-row"},JE=["max"],QE={class:"btn-row",style:{"margin-top":"8px"}},tb=["disabled"],eb={class:"row",style:{"margin-top":"8px"}},nb={style:{width:"auto"}},ib={class:"panel-section"},rb={class:"btn-row"},sb=wa({__name:"ControlPanel",setup(n){const t=na(),e=$l(()=>{var s;return!ft.initialVolume||ft.steps.length===0?1:(((s=ft.steps[ft.currentStep])==null?void 0:s.volume)??ft.initialVolume)/ft.initialVolume}),i=$l(()=>ft.totalSteps>0?ft.currentStep/ft.totalSteps:0);function r(s){var a;const o=(a=s.target.files)==null?void 0:a[0];o&&NE(o),s.target.value=""}return(s,o)=>(qi(),wr(Pn,null,[jt("div",kE,[o[16]||(o[16]=jt("h3",null,"开挖步序",-1)),jt("div",GE,[o[12]||(o[12]=jt("label",null,"步长",-1)),pr(jt("input",{type:"range",min:"1",max:"5",step:"0.5","onUpdate:modelValue":o[0]||(o[0]=a=>fe(ft).stepLength=a)},null,512),[[Qr,fe(ft).stepLength,void 0,{number:!0}]]),jt("output",null,yn(fe(ft).stepLength.toFixed(1))+" m",1)]),jt("div",WE,[o[13]||(o[13]=jt("label",null,"总步数",-1)),pr(jt("input",{type:"range",min:"3",max:"20",step:"1","onUpdate:modelValue":o[1]||(o[1]=a=>fe(ft).totalSteps=a)},null,512),[[Qr,fe(ft).totalSteps,void 0,{number:!0}]]),jt("output",null,yn(fe(ft).totalSteps)+" 步",1)]),jt("div",XE,[o[14]||(o[14]=jt("label",null,"剖切角度",-1)),pr(jt("input",{type:"range",min:"0",max:"360",step:"1","onUpdate:modelValue":o[2]||(o[2]=a=>fe(ft).cutAngle=a)},null,512),[[Qr,fe(ft).cutAngle,void 0,{number:!0}]]),jt("output",null,yn(fe(ft).cutAngle)+"°",1)]),jt("div",$E,[o[15]||(o[15]=jt("label",null,"平面倾角",-1)),pr(jt("input",{type:"range",min:"0",max:"60",step:"1","onUpdate:modelValue":o[3]||(o[3]=a=>fe(ft).tiltAngle=a)},null,512),[[Qr,fe(ft).tiltAngle,void 0,{number:!0}]]),jt("output",null,yn(fe(ft).tiltAngle)+"°",1)]),jt("p",YE,"总进尺 "+yn(fe(ga)().toFixed(1))+" m;倾角为 0 时剖切面垂直于轴线,旋转角无视觉效果。",1)]),jt("div",qE,[o[18]||(o[18]=jt("h3",null,"施工进度",-1)),jt("div",jE,[jt("div",{class:"progress-inner",style:ya({width:`${i.value*100}%`})},null,4)]),jt("div",KE,[jt("span",null,"步序 "+yn(fe(ft).currentStep)+" / "+yn(fe(ft).totalSteps),1),jt("span",null,"剩余体积 "+yn((e.value*100).toFixed(1))+"%",1)]),jt("div",ZE,[pr(jt("input",{type:"range",min:"0",max:fe(ft).totalSteps,step:"1","onUpdate:modelValue":o[4]||(o[4]=a=>fe(ft).currentStep=a),style:{flex:"1"}},null,8,JE),[[Qr,fe(ft).currentStep,void 0,{number:!0}]])]),jt("div",QE,[fe(ft).playing?(qi(),wr("button",{key:1,class:"primary",onClick:o[6]||(o[6]=(...a)=>fe(Fc)&&fe(Fc)(...a))},"⏸ 暂停")):(qi(),wr("button",{key:0,class:"primary",onClick:o[5]||(o[5]=(...a)=>fe(Nc)&&fe(Nc)(...a)),disabled:fe(ft).steps.length===0},"▶ 回放",8,tb)),jt("button",{onClick:o[7]||(o[7]=a=>fe(ft).currentStep=0)},"⏮ 复位"),jt("button",{onClick:o[8]||(o[8]=a=>fe(ft).currentStep=fe(ft).totalSteps)},"⏭ 完成")]),jt("div",eb,[jt("label",nb,[pr(jt("input",{type:"checkbox","onUpdate:modelValue":o[9]||(o[9]=a=>fe(ft).showGhost=a)},null,512),[[Dg,fe(ft).showGhost]]),o[17]||(o[17]=Wi(" 显示已开挖部分 ",-1))])])]),jt("div",ib,[o[19]||(o[19]=jt("h3",null,"保存 / 分享",-1)),jt("div",rb,[jt("button",{onClick:o[10]||(o[10]=(...a)=>fe(ph)&&fe(ph)(...a))},"导出 JSON"),jt("button",{onClick:o[11]||(o[11]=a=>{var l;return(l=t.value)==null?void 0:l.click()})},"导入 JSON"),jt("input",{ref_key:"fileInput",ref:t,type:"file",accept:".json,application/json",style:{display:"none"},onChange:r},null,544)]),o[20]||(o[20]=jt("p",{class:"hint"},"参数、断面与剖切角度自动保存到浏览器本地;导入 JSON 后自动按步序回放。",-1)),jt("div",{class:Ea(["status-line",{error:fe(ft).statusError}])},yn(fe(ft).status),3)])],64))}}),ob={class:"app-layout"},ab={class:"side-panel"},lb=wa({__name:"App",setup(n){return Ra(()=>{FE()}),(t,e)=>(qi(),wr("div",ob,[Nn(zE),jt("aside",ab,[Nn(sb),Nn(HE)])]))}});Ng(lb).mount("#app");
