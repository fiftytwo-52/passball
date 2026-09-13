/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const jt="srgb",di="srgb-linear";const Ur="300 es";class Xn{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const i=this._listeners[e];if(i!==void 0){const r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const n=this._listeners[e.type];if(n!==void 0){e.target=this;const i=n.slice(0);for(let r=0,o=i.length;r<o;r++)i[r].call(this,e);e.target=null}}}const Tt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Br=1234567;const ci=Math.PI/180,Gi=180/Math.PI;function Yn(){const s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Tt[s&255]+Tt[s>>8&255]+Tt[s>>16&255]+Tt[s>>24&255]+"-"+Tt[e&255]+Tt[e>>8&255]+"-"+Tt[e>>16&15|64]+Tt[e>>24&255]+"-"+Tt[t&63|128]+Tt[t>>8&255]+"-"+Tt[t>>16&255]+Tt[t>>24&255]+Tt[n&255]+Tt[n>>8&255]+Tt[n>>16&255]+Tt[n>>24&255]).toLowerCase()}function Dt(s,e,t){return Math.max(e,Math.min(t,s))}function Er(s,e){return(s%e+e)%e}function Hs(s,e,t,n,i){return n+(s-e)*(i-n)/(t-e)}function qs(s,e,t){return s!==e?(t-s)/(e-s):0}function ui(s,e,t){return(1-t)*s+t*e}function Xs(s,e,t,n){return ui(s,e,1-Math.exp(-t*n))}function Ys(s,e=1){return e-Math.abs(Er(s,e*2)-e)}function js(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*(3-2*s))}function Zs(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*s*(s*(s*6-15)+10))}function $s(s,e){return s+Math.floor(Math.random()*(e-s+1))}function Ks(s,e){return s+Math.random()*(e-s)}function Js(s){return s*(.5-Math.random())}function Qs(s){s!==void 0&&(Br=s);let e=Br+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function ea(s){return s*ci}function ta(s){return s*Gi}function wr(s){return(s&s-1)===0&&s!==0}function na(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function ki(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function ia(s,e,t,n,i){const r=Math.cos,o=Math.sin,a=r(t/2),c=o(t/2),l=r((e+n)/2),u=o((e+n)/2),f=r((e-n)/2),d=o((e-n)/2),g=r((n-e)/2),M=o((n-e)/2);switch(i){case"XYX":s.set(a*u,c*f,c*d,a*l);break;case"YZY":s.set(c*d,a*u,c*f,a*l);break;case"ZXZ":s.set(c*f,c*d,a*u,a*l);break;case"XZX":s.set(a*u,c*M,c*g,a*l);break;case"YXY":s.set(c*g,a*u,c*M,a*l);break;case"ZYZ":s.set(c*M,c*g,a*u,a*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function oi(s,e){switch(e.constructor){case Float32Array:return s;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function Rt(s,e){switch(e.constructor){case Float32Array:return s;case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}var ra=Object.freeze({__proto__:null,DEG2RAD:ci,RAD2DEG:Gi,ceilPowerOfTwo:na,clamp:Dt,damp:Xs,degToRad:ea,denormalize:oi,euclideanModulo:Er,floorPowerOfTwo:ki,generateUUID:Yn,inverseLerp:qs,isPowerOfTwo:wr,lerp:ui,mapLinear:Hs,normalize:Rt,pingpong:Ys,radToDeg:ta,randFloat:Ks,randFloatSpread:Js,randInt:$s,seededRandom:Qs,setQuaternionFromProperEuler:ia,smootherstep:Zs,smoothstep:js});class je{constructor(e=0,t=0){je.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*i+e.x,this.y=r*i+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ut{constructor(){Ut.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1]}set(e,t,n,i,r,o,a,c,l){const u=this.elements;return u[0]=e,u[1]=i,u[2]=a,u[3]=t,u[4]=r,u[5]=c,u[6]=n,u[7]=o,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],u=n[4],f=n[7],d=n[2],g=n[5],M=n[8],m=i[0],h=i[3],y=i[6],A=i[1],p=i[4],b=i[7],w=i[2],D=i[5],O=i[8];return r[0]=o*m+a*A+c*w,r[3]=o*h+a*p+c*D,r[6]=o*y+a*b+c*O,r[1]=l*m+u*A+f*w,r[4]=l*h+u*p+f*D,r[7]=l*y+u*b+f*O,r[2]=d*m+g*A+M*w,r[5]=d*h+g*p+M*D,r[8]=d*y+g*b+M*O,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8];return t*o*u-t*a*l-n*r*u+n*a*c+i*r*l-i*o*c}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],f=u*o-a*l,d=a*c-u*r,g=l*r-o*c,M=t*f+n*d+i*g;if(M===0)return this.set(0,0,0,0,0,0,0,0,0);const m=1/M;return e[0]=f*m,e[1]=(i*l-u*n)*m,e[2]=(a*n-i*o)*m,e[3]=d*m,e[4]=(u*t-i*c)*m,e[5]=(i*r-a*t)*m,e[6]=g*m,e[7]=(n*c-l*t)*m,e[8]=(o*t-n*r)*m,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,o,a){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+e,-i*l,i*c,-i*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Ki.makeScale(e,t)),this}rotate(e){return this.premultiply(Ki.makeRotation(-e)),this}translate(e,t){return this.premultiply(Ki.makeTranslation(e,t)),this}makeTranslation(e,t){return this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Ki=new Ut;function ws(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function Vi(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function bn(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function Oi(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}const Ji={[jt]:{[di]:bn},[di]:{[jt]:Oi}},Et={legacyMode:!0,get workingColorSpace(){return di},set workingColorSpace(s){console.warn("THREE.ColorManagement: .workingColorSpace is readonly.")},convert:function(s,e,t){if(this.legacyMode||e===t||!e||!t)return s;if(Ji[e]&&Ji[e][t]!==void 0){const n=Ji[e][t];return s.r=n(s.r),s.g=n(s.g),s.b=n(s.b),s}throw new Error("Unsupported color space conversion.")},fromWorkingColorSpace:function(s,e){return this.convert(s,this.workingColorSpace,e)},toWorkingColorSpace:function(s,e){return this.convert(s,e,this.workingColorSpace)}},Ts={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},gt={r:0,g:0,b:0},Vt={h:0,s:0,l:0},vi={h:0,s:0,l:0};function Qi(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}function yi(s,e){return e.r=s.r,e.g=s.g,e.b=s.b,e}class et{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,t===void 0&&n===void 0?this.set(e):this.setRGB(e,t,n)}set(e){return e&&e.isColor?this.copy(e):typeof e=="number"?this.setHex(e):typeof e=="string"&&this.setStyle(e),this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=jt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Et.toWorkingColorSpace(this,t),this}setRGB(e,t,n,i=Et.workingColorSpace){return this.r=e,this.g=t,this.b=n,Et.toWorkingColorSpace(this,i),this}setHSL(e,t,n,i=Et.workingColorSpace){if(e=Er(e,1),t=Dt(t,0,1),n=Dt(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=Qi(o,r,e+1/3),this.g=Qi(o,r,e),this.b=Qi(o,r,e-1/3)}return Et.toWorkingColorSpace(this,i),this}setStyle(e,t=jt){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^((?:rgb|hsl)a?)\(([^\)]*)\)/.exec(e)){let r;const o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return this.r=Math.min(255,parseInt(r[1],10))/255,this.g=Math.min(255,parseInt(r[2],10))/255,this.b=Math.min(255,parseInt(r[3],10))/255,Et.toWorkingColorSpace(this,t),n(r[4]),this;if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return this.r=Math.min(100,parseInt(r[1],10))/100,this.g=Math.min(100,parseInt(r[2],10))/100,this.b=Math.min(100,parseInt(r[3],10))/100,Et.toWorkingColorSpace(this,t),n(r[4]),this;break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a)){const c=parseFloat(r[1])/360,l=parseFloat(r[2])/100,u=parseFloat(r[3])/100;return n(r[4]),this.setHSL(c,l,u,t)}break}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=i[1],o=r.length;if(o===3)return this.r=parseInt(r.charAt(0)+r.charAt(0),16)/255,this.g=parseInt(r.charAt(1)+r.charAt(1),16)/255,this.b=parseInt(r.charAt(2)+r.charAt(2),16)/255,Et.toWorkingColorSpace(this,t),this;if(o===6)return this.r=parseInt(r.charAt(0)+r.charAt(1),16)/255,this.g=parseInt(r.charAt(2)+r.charAt(3),16)/255,this.b=parseInt(r.charAt(4)+r.charAt(5),16)/255,Et.toWorkingColorSpace(this,t),this}return e&&e.length>0?this.setColorName(e,t):this}setColorName(e,t=jt){const n=Ts[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=bn(e.r),this.g=bn(e.g),this.b=bn(e.b),this}copyLinearToSRGB(e){return this.r=Oi(e.r),this.g=Oi(e.g),this.b=Oi(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=jt){return Et.fromWorkingColorSpace(yi(this,gt),e),Dt(gt.r*255,0,255)<<16^Dt(gt.g*255,0,255)<<8^Dt(gt.b*255,0,255)<<0}getHexString(e=jt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Et.workingColorSpace){Et.fromWorkingColorSpace(yi(this,gt),t);const n=gt.r,i=gt.g,r=gt.b,o=Math.max(n,i,r),a=Math.min(n,i,r);let c,l;const u=(a+o)/2;if(a===o)c=0,l=0;else{const f=o-a;switch(l=u<=.5?f/(o+a):f/(2-o-a),o){case n:c=(i-r)/f+(i<r?6:0);break;case i:c=(r-n)/f+2;break;case r:c=(n-i)/f+4;break}c/=6}return e.h=c,e.s=l,e.l=u,e}getRGB(e,t=Et.workingColorSpace){return Et.fromWorkingColorSpace(yi(this,gt),t),e.r=gt.r,e.g=gt.g,e.b=gt.b,e}getStyle(e=jt){return Et.fromWorkingColorSpace(yi(this,gt),e),e!==jt?`color(${e} ${gt.r} ${gt.g} ${gt.b})`:`rgb(${gt.r*255|0},${gt.g*255|0},${gt.b*255|0})`}offsetHSL(e,t,n){return this.getHSL(Vt),Vt.h+=e,Vt.s+=t,Vt.l+=n,this.setHSL(Vt.h,Vt.s,Vt.l),this}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Vt),e.getHSL(vi);const n=ui(Vt.h,vi.h,t),i=ui(Vt.s,vi.s,t),r=ui(Vt.l,vi.l,t);return this.setHSL(n,i,r),this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}et.NAMES=Ts;let Cn;class Es{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Cn===void 0&&(Cn=Vi("canvas")),Cn.width=e.width,Cn.height=e.height;const n=Cn.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=Cn}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Vi("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let o=0;o<r.length;o++)r[o]=bn(r[o]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(bn(t[n]/255)*255):t[n]=bn(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}class As{constructor(e=null){this.isSource=!0,this.uuid=Yn(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?r.push(er(i[o].image)):r.push(er(i[o]))}else r=er(i);n.url=r}return t||(e.images[this.uuid]=n),n}}function er(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?Es.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let sa=0;class Pt extends Xn{constructor(e=Pt.DEFAULT_IMAGE,t=Pt.DEFAULT_MAPPING,n=1001,i=1001,r=1006,o=1008,a=1023,c=1009,l=Pt.DEFAULT_ANISOTROPY,u=3e3){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:sa++}),this.uuid=Yn(),this.name="",this.source=new As(e),this.mipmaps=[],this.mapping=t,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new je(0,0),this.repeat=new je(1,1),this.center=new je(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ut,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.encoding=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.encoding=e.encoding,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.5,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,type:this.type,encoding:this.encoding,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case 1e3:e.x=e.x-Math.floor(e.x);break;case 1001:e.x=e.x<0?0:1;break;case 1002:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case 1e3:e.y=e.y-Math.floor(e.y);break;case 1001:e.y=e.y<0?0:1;break;case 1002:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}}Pt.DEFAULT_IMAGE=null;Pt.DEFAULT_MAPPING=300;Pt.DEFAULT_ANISOTROPY=1;class Mt{constructor(e=0,t=0,n=0,i=1){Mt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*i+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*i+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*i+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*i+o[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r;const c=e.elements,l=c[0],u=c[4],f=c[8],d=c[1],g=c[5],M=c[9],m=c[2],h=c[6],y=c[10];if(Math.abs(u-d)<.01&&Math.abs(f-m)<.01&&Math.abs(M-h)<.01){if(Math.abs(u+d)<.1&&Math.abs(f+m)<.1&&Math.abs(M+h)<.1&&Math.abs(l+g+y-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const p=(l+1)/2,b=(g+1)/2,w=(y+1)/2,D=(u+d)/4,O=(f+m)/4,v=(M+h)/4;return p>b&&p>w?p<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(p),i=D/n,r=O/n):b>w?b<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(b),n=D/i,r=v/i):w<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(w),n=O/r,i=v/r),this.set(n,i,r,t),this}let A=Math.sqrt((h-M)*(h-M)+(f-m)*(f-m)+(d-u)*(d-u));return Math.abs(A)<.001&&(A=1),this.x=(h-M)/A,this.y=(f-m)/A,this.z=(d-u)/A,this.w=Math.acos((l+g+y-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this.w=this.w<0?Math.ceil(this.w):Math.floor(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class wn extends Xn{constructor(e=1,t=1,n={}){super(),this.isWebGLRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new Mt(0,0,e,t),this.scissorTest=!1,this.viewport=new Mt(0,0,e,t);const i={width:e,height:t,depth:1};this.texture=new Pt(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.encoding),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=n.generateMipmaps!==void 0?n.generateMipmaps:!1,this.texture.internalFormat=n.internalFormat!==void 0?n.internalFormat:null,this.texture.minFilter=n.minFilter!==void 0?n.minFilter:1006,this.depthBuffer=n.depthBuffer!==void 0?n.depthBuffer:!0,this.stencilBuffer=n.stencilBuffer!==void 0?n.stencilBuffer:!1,this.depthTexture=n.depthTexture!==void 0?n.depthTexture:null,this.samples=n.samples!==void 0?n.samples:0}setSize(e,t,n=1){(this.width!==e||this.height!==t||this.depth!==n)&&(this.width=e,this.height=t,this.depth=n,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=n,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new As(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Cs extends Pt{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class aa extends Pt{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class pi{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,o,a){let c=n[i+0],l=n[i+1],u=n[i+2],f=n[i+3];const d=r[o+0],g=r[o+1],M=r[o+2],m=r[o+3];if(a===0){e[t+0]=c,e[t+1]=l,e[t+2]=u,e[t+3]=f;return}if(a===1){e[t+0]=d,e[t+1]=g,e[t+2]=M,e[t+3]=m;return}if(f!==m||c!==d||l!==g||u!==M){let h=1-a;const y=c*d+l*g+u*M+f*m,A=y>=0?1:-1,p=1-y*y;if(p>Number.EPSILON){const w=Math.sqrt(p),D=Math.atan2(w,y*A);h=Math.sin(h*D)/w,a=Math.sin(a*D)/w}const b=a*A;if(c=c*h+d*b,l=l*h+g*b,u=u*h+M*b,f=f*h+m*b,h===1-a){const w=1/Math.sqrt(c*c+l*l+u*u+f*f);c*=w,l*=w,u*=w,f*=w}}e[t]=c,e[t+1]=l,e[t+2]=u,e[t+3]=f}static multiplyQuaternionsFlat(e,t,n,i,r,o){const a=n[i],c=n[i+1],l=n[i+2],u=n[i+3],f=r[o],d=r[o+1],g=r[o+2],M=r[o+3];return e[t]=a*M+u*f+c*g-l*d,e[t+1]=c*M+u*d+l*f-a*g,e[t+2]=l*M+u*g+a*d-c*f,e[t+3]=u*M-a*f-c*d-l*g,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t){const n=e._x,i=e._y,r=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(n/2),u=a(i/2),f=a(r/2),d=c(n/2),g=c(i/2),M=c(r/2);switch(o){case"XYZ":this._x=d*u*f+l*g*M,this._y=l*g*f-d*u*M,this._z=l*u*M+d*g*f,this._w=l*u*f-d*g*M;break;case"YXZ":this._x=d*u*f+l*g*M,this._y=l*g*f-d*u*M,this._z=l*u*M-d*g*f,this._w=l*u*f+d*g*M;break;case"ZXY":this._x=d*u*f-l*g*M,this._y=l*g*f+d*u*M,this._z=l*u*M+d*g*f,this._w=l*u*f-d*g*M;break;case"ZYX":this._x=d*u*f-l*g*M,this._y=l*g*f+d*u*M,this._z=l*u*M-d*g*f,this._w=l*u*f+d*g*M;break;case"YZX":this._x=d*u*f+l*g*M,this._y=l*g*f+d*u*M,this._z=l*u*M-d*g*f,this._w=l*u*f-d*g*M;break;case"XZY":this._x=d*u*f-l*g*M,this._y=l*g*f-d*u*M,this._z=l*u*M+d*g*f,this._w=l*u*f+d*g*M;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t!==!1&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],i=t[4],r=t[8],o=t[1],a=t[5],c=t[9],l=t[2],u=t[6],f=t[10],d=n+a+f;if(d>0){const g=.5/Math.sqrt(d+1);this._w=.25/g,this._x=(u-c)*g,this._y=(r-l)*g,this._z=(o-i)*g}else if(n>a&&n>f){const g=2*Math.sqrt(1+n-a-f);this._w=(u-c)/g,this._x=.25*g,this._y=(i+o)/g,this._z=(r+l)/g}else if(a>f){const g=2*Math.sqrt(1+a-n-f);this._w=(r-l)/g,this._x=(i+o)/g,this._y=.25*g,this._z=(c+u)/g}else{const g=2*Math.sqrt(1+f-n-a);this._w=(o-i)/g,this._x=(r+l)/g,this._y=(c+u)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Dt(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,i=e._y,r=e._z,o=e._w,a=t._x,c=t._y,l=t._z,u=t._w;return this._x=n*u+o*a+i*l-r*c,this._y=i*u+o*c+r*a-n*l,this._z=r*u+o*l+n*c-i*a,this._w=o*u-n*a-i*c-r*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,i=this._y,r=this._z,o=this._w;let a=o*e._w+n*e._x+i*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=i,this._z=r,this;const c=1-a*a;if(c<=Number.EPSILON){const g=1-t;return this._w=g*o+t*this._w,this._x=g*n+t*this._x,this._y=g*i+t*this._y,this._z=g*r+t*this._z,this.normalize(),this._onChangeCallback(),this}const l=Math.sqrt(c),u=Math.atan2(l,a),f=Math.sin((1-t)*u)/l,d=Math.sin(t*u)/l;return this._w=o*f+this._w*d,this._x=n*f+this._x*d,this._y=i*f+this._y*d,this._z=r*f+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=Math.random(),t=Math.sqrt(1-e),n=Math.sqrt(e),i=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(t*Math.cos(i),n*Math.sin(r),n*Math.cos(r),t*Math.sin(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class G{constructor(e=0,t=0,n=0){G.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Or.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Or.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*o,this}applyQuaternion(e){const t=this.x,n=this.y,i=this.z,r=e.x,o=e.y,a=e.z,c=e.w,l=c*t+o*i-a*n,u=c*n+a*t-r*i,f=c*i+r*n-o*t,d=-r*t-o*n-a*i;return this.x=l*c+d*-r+u*-a-f*-o,this.y=u*c+d*-o+f*-r-l*-a,this.z=f*c+d*-a+l*-o-u*-r,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,i=e.y,r=e.z,o=t.x,a=t.y,c=t.z;return this.x=i*c-r*a,this.y=r*o-n*c,this.z=n*a-i*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return tr.copy(this).projectOnVector(e),this.sub(tr)}reflect(e){return this.sub(tr.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Dt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,n=Math.sqrt(1-e**2);return this.x=n*Math.cos(t),this.y=n*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const tr=new G,Or=new pi;class mi{constructor(e=new G(1/0,1/0,1/0),t=new G(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){let t=1/0,n=1/0,i=1/0,r=-1/0,o=-1/0,a=-1/0;for(let c=0,l=e.length;c<l;c+=3){const u=e[c],f=e[c+1],d=e[c+2];u<t&&(t=u),f<n&&(n=f),d<i&&(i=d),u>r&&(r=u),f>o&&(o=f),d>a&&(a=d)}return this.min.set(t,n,i),this.max.set(r,o,a),this}setFromBufferAttribute(e){let t=1/0,n=1/0,i=1/0,r=-1/0,o=-1/0,a=-1/0;for(let c=0,l=e.count;c<l;c++){const u=e.getX(c),f=e.getY(c),d=e.getZ(c);u<t&&(t=u),f<n&&(n=f),d<i&&(i=d),u>r&&(r=u),f>o&&(o=f),d>a&&(a=d)}return this.min.set(t,n,i),this.max.set(r,o,a),this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=_n.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0)if(t&&n.attributes!=null&&n.attributes.position!==void 0){const r=n.attributes.position;for(let o=0,a=r.count;o<a;o++)_n.fromBufferAttribute(r,o).applyMatrix4(e.matrixWorld),this.expandByPoint(_n)}else n.boundingBox===null&&n.computeBoundingBox(),nr.copy(n.boundingBox),nr.applyMatrix4(e.matrixWorld),this.union(nr);const i=e.children;for(let r=0,o=i.length;r<o;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,_n),_n.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ei),Mi.subVectors(this.max,ei),Ln.subVectors(e.a,ei),Rn.subVectors(e.b,ei),Dn.subVectors(e.c,ei),un.subVectors(Rn,Ln),hn.subVectors(Dn,Rn),xn.subVectors(Ln,Dn);let t=[0,-un.z,un.y,0,-hn.z,hn.y,0,-xn.z,xn.y,un.z,0,-un.x,hn.z,0,-hn.x,xn.z,0,-xn.x,-un.y,un.x,0,-hn.y,hn.x,0,-xn.y,xn.x,0];return!ir(t,Ln,Rn,Dn,Mi)||(t=[1,0,0,0,1,0,0,0,1],!ir(t,Ln,Rn,Dn,Mi))?!1:(Si.crossVectors(un,hn),t=[Si.x,Si.y,Si.z],ir(t,Ln,Rn,Dn,Mi))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return _n.copy(e).clamp(this.min,this.max).sub(e).length()}getBoundingSphere(e){return this.getCenter(e.center),e.radius=this.getSize(_n).length()*.5,e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(nn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),nn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),nn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),nn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),nn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),nn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),nn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),nn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(nn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const nn=[new G,new G,new G,new G,new G,new G,new G,new G],_n=new G,nr=new mi,Ln=new G,Rn=new G,Dn=new G,un=new G,hn=new G,xn=new G,ei=new G,Mi=new G,Si=new G,vn=new G;function ir(s,e,t,n,i){for(let r=0,o=s.length-3;r<=o;r+=3){vn.fromArray(s,r);const a=i.x*Math.abs(vn.x)+i.y*Math.abs(vn.y)+i.z*Math.abs(vn.z),c=e.dot(vn),l=t.dot(vn),u=n.dot(vn);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}const oa=new mi,ti=new G,rr=new G;class Hi{constructor(e=new G,t=-1){this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):oa.setFromPoints(e).getCenter(n);let i=0;for(let r=0,o=e.length;r<o;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ti.subVectors(e,this.center);const t=ti.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(ti,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(rr.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ti.copy(e.center).add(rr)),this.expandByPoint(ti.copy(e.center).sub(rr))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const rn=new G,sr=new G,bi=new G,dn=new G,ar=new G,wi=new G,or=new G;class Ls{constructor(e=new G,t=new G(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.direction).multiplyScalar(e).add(this.origin)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,rn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.direction).multiplyScalar(n).add(this.origin)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=rn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(rn.copy(this.direction).multiplyScalar(t).add(this.origin),rn.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){sr.copy(e).add(t).multiplyScalar(.5),bi.copy(t).sub(e).normalize(),dn.copy(this.origin).sub(sr);const r=e.distanceTo(t)*.5,o=-this.direction.dot(bi),a=dn.dot(this.direction),c=-dn.dot(bi),l=dn.lengthSq(),u=Math.abs(1-o*o);let f,d,g,M;if(u>0)if(f=o*c-a,d=o*a-c,M=r*u,f>=0)if(d>=-M)if(d<=M){const m=1/u;f*=m,d*=m,g=f*(f+o*d+2*a)+d*(o*f+d+2*c)+l}else d=r,f=Math.max(0,-(o*d+a)),g=-f*f+d*(d+2*c)+l;else d=-r,f=Math.max(0,-(o*d+a)),g=-f*f+d*(d+2*c)+l;else d<=-M?(f=Math.max(0,-(-o*r+a)),d=f>0?-r:Math.min(Math.max(-r,-c),r),g=-f*f+d*(d+2*c)+l):d<=M?(f=0,d=Math.min(Math.max(-r,-c),r),g=d*(d+2*c)+l):(f=Math.max(0,-(o*r+a)),d=f>0?r:Math.min(Math.max(-r,-c),r),g=-f*f+d*(d+2*c)+l);else d=o>0?-r:r,f=Math.max(0,-(o*d+a)),g=-f*f+d*(d+2*c)+l;return n&&n.copy(this.direction).multiplyScalar(f).add(this.origin),i&&i.copy(bi).multiplyScalar(d).add(sr),g}intersectSphere(e,t){rn.subVectors(e.center,this.origin);const n=rn.dot(this.direction),i=rn.dot(rn)-n*n,r=e.radius*e.radius;if(i>r)return null;const o=Math.sqrt(r-i),a=n-o,c=n+o;return a<0&&c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,o,a,c;const l=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,d=this.origin;return l>=0?(n=(e.min.x-d.x)*l,i=(e.max.x-d.x)*l):(n=(e.max.x-d.x)*l,i=(e.min.x-d.x)*l),u>=0?(r=(e.min.y-d.y)*u,o=(e.max.y-d.y)*u):(r=(e.max.y-d.y)*u,o=(e.min.y-d.y)*u),n>o||r>i||((r>n||isNaN(n))&&(n=r),(o<i||isNaN(i))&&(i=o),f>=0?(a=(e.min.z-d.z)*f,c=(e.max.z-d.z)*f):(a=(e.max.z-d.z)*f,c=(e.min.z-d.z)*f),n>c||a>i)||((a>n||n!==n)&&(n=a),(c<i||i!==i)&&(i=c),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,rn)!==null}intersectTriangle(e,t,n,i,r){ar.subVectors(t,e),wi.subVectors(n,e),or.crossVectors(ar,wi);let o=this.direction.dot(or),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;dn.subVectors(this.origin,e);const c=a*this.direction.dot(wi.crossVectors(dn,wi));if(c<0)return null;const l=a*this.direction.dot(ar.cross(dn));if(l<0||c+l>o)return null;const u=-a*dn.dot(or);return u<0?null:this.at(u/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class pt{constructor(){pt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}set(e,t,n,i,r,o,a,c,l,u,f,d,g,M,m,h){const y=this.elements;return y[0]=e,y[4]=t,y[8]=n,y[12]=i,y[1]=r,y[5]=o,y[9]=a,y[13]=c,y[2]=l,y[6]=u,y[10]=f,y[14]=d,y[3]=g,y[7]=M,y[11]=m,y[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new pt().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,i=1/Pn.setFromMatrixColumn(e,0).length(),r=1/Pn.setFromMatrixColumn(e,1).length(),o=1/Pn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,i=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(i),l=Math.sin(i),u=Math.cos(r),f=Math.sin(r);if(e.order==="XYZ"){const d=o*u,g=o*f,M=a*u,m=a*f;t[0]=c*u,t[4]=-c*f,t[8]=l,t[1]=g+M*l,t[5]=d-m*l,t[9]=-a*c,t[2]=m-d*l,t[6]=M+g*l,t[10]=o*c}else if(e.order==="YXZ"){const d=c*u,g=c*f,M=l*u,m=l*f;t[0]=d+m*a,t[4]=M*a-g,t[8]=o*l,t[1]=o*f,t[5]=o*u,t[9]=-a,t[2]=g*a-M,t[6]=m+d*a,t[10]=o*c}else if(e.order==="ZXY"){const d=c*u,g=c*f,M=l*u,m=l*f;t[0]=d-m*a,t[4]=-o*f,t[8]=M+g*a,t[1]=g+M*a,t[5]=o*u,t[9]=m-d*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){const d=o*u,g=o*f,M=a*u,m=a*f;t[0]=c*u,t[4]=M*l-g,t[8]=d*l+m,t[1]=c*f,t[5]=m*l+d,t[9]=g*l-M,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){const d=o*c,g=o*l,M=a*c,m=a*l;t[0]=c*u,t[4]=m-d*f,t[8]=M*f+g,t[1]=f,t[5]=o*u,t[9]=-a*u,t[2]=-l*u,t[6]=g*f+M,t[10]=d-m*f}else if(e.order==="XZY"){const d=o*c,g=o*l,M=a*c,m=a*l;t[0]=c*u,t[4]=-f,t[8]=l*u,t[1]=d*f+m,t[5]=o*u,t[9]=g*f-M,t[2]=M*f-g,t[6]=a*u,t[10]=m*f+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(la,e,ca)}lookAt(e,t,n){const i=this.elements;return Ft.subVectors(e,t),Ft.lengthSq()===0&&(Ft.z=1),Ft.normalize(),fn.crossVectors(n,Ft),fn.lengthSq()===0&&(Math.abs(n.z)===1?Ft.x+=1e-4:Ft.z+=1e-4,Ft.normalize(),fn.crossVectors(n,Ft)),fn.normalize(),Ti.crossVectors(Ft,fn),i[0]=fn.x,i[4]=Ti.x,i[8]=Ft.x,i[1]=fn.y,i[5]=Ti.y,i[9]=Ft.y,i[2]=fn.z,i[6]=Ti.z,i[10]=Ft.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],u=n[1],f=n[5],d=n[9],g=n[13],M=n[2],m=n[6],h=n[10],y=n[14],A=n[3],p=n[7],b=n[11],w=n[15],D=i[0],O=i[4],v=i[8],L=i[12],B=i[1],$=i[5],K=i[9],z=i[13],F=i[2],Y=i[6],te=i[10],ne=i[14],J=i[3],ue=i[7],oe=i[11],ve=i[15];return r[0]=o*D+a*B+c*F+l*J,r[4]=o*O+a*$+c*Y+l*ue,r[8]=o*v+a*K+c*te+l*oe,r[12]=o*L+a*z+c*ne+l*ve,r[1]=u*D+f*B+d*F+g*J,r[5]=u*O+f*$+d*Y+g*ue,r[9]=u*v+f*K+d*te+g*oe,r[13]=u*L+f*z+d*ne+g*ve,r[2]=M*D+m*B+h*F+y*J,r[6]=M*O+m*$+h*Y+y*ue,r[10]=M*v+m*K+h*te+y*oe,r[14]=M*L+m*z+h*ne+y*ve,r[3]=A*D+p*B+b*F+w*J,r[7]=A*O+p*$+b*Y+w*ue,r[11]=A*v+p*K+b*te+w*oe,r[15]=A*L+p*z+b*ne+w*ve,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],o=e[1],a=e[5],c=e[9],l=e[13],u=e[2],f=e[6],d=e[10],g=e[14],M=e[3],m=e[7],h=e[11],y=e[15];return M*(+r*c*f-i*l*f-r*a*d+n*l*d+i*a*g-n*c*g)+m*(+t*c*g-t*l*d+r*o*d-i*o*g+i*l*u-r*c*u)+h*(+t*l*f-t*a*g-r*o*f+n*o*g+r*a*u-n*l*u)+y*(-i*a*u-t*c*f+t*a*d+i*o*f-n*o*d+n*c*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],f=e[9],d=e[10],g=e[11],M=e[12],m=e[13],h=e[14],y=e[15],A=f*h*l-m*d*l+m*c*g-a*h*g-f*c*y+a*d*y,p=M*d*l-u*h*l-M*c*g+o*h*g+u*c*y-o*d*y,b=u*m*l-M*f*l+M*a*g-o*m*g-u*a*y+o*f*y,w=M*f*c-u*m*c-M*a*d+o*m*d+u*a*h-o*f*h,D=t*A+n*p+i*b+r*w;if(D===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const O=1/D;return e[0]=A*O,e[1]=(m*d*r-f*h*r-m*i*g+n*h*g+f*i*y-n*d*y)*O,e[2]=(a*h*r-m*c*r+m*i*l-n*h*l-a*i*y+n*c*y)*O,e[3]=(f*c*r-a*d*r-f*i*l+n*d*l+a*i*g-n*c*g)*O,e[4]=p*O,e[5]=(u*h*r-M*d*r+M*i*g-t*h*g-u*i*y+t*d*y)*O,e[6]=(M*c*r-o*h*r-M*i*l+t*h*l+o*i*y-t*c*y)*O,e[7]=(o*d*r-u*c*r+u*i*l-t*d*l-o*i*g+t*c*g)*O,e[8]=b*O,e[9]=(M*f*r-u*m*r-M*n*g+t*m*g+u*n*y-t*f*y)*O,e[10]=(o*m*r-M*a*r+M*n*l-t*m*l-o*n*y+t*a*y)*O,e[11]=(u*a*r-o*f*r-u*n*l+t*f*l+o*n*g-t*a*g)*O,e[12]=w*O,e[13]=(u*m*i-M*f*i+M*n*d-t*m*d-u*n*h+t*f*h)*O,e[14]=(M*a*i-o*m*i-M*n*c+t*m*c+o*n*h-t*a*h)*O,e[15]=(o*f*i-u*a*i+u*n*c-t*f*c-o*n*d+t*a*d)*O,this}scale(e){const t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),i=Math.sin(t),r=1-n,o=e.x,a=e.y,c=e.z,l=r*o,u=r*a;return this.set(l*o+n,l*a-i*c,l*c+i*a,0,l*a+i*c,u*a+n,u*c-i*o,0,l*c-i*a,u*c+i*o,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,o){return this.set(1,n,r,0,e,1,o,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){const i=this.elements,r=t._x,o=t._y,a=t._z,c=t._w,l=r+r,u=o+o,f=a+a,d=r*l,g=r*u,M=r*f,m=o*u,h=o*f,y=a*f,A=c*l,p=c*u,b=c*f,w=n.x,D=n.y,O=n.z;return i[0]=(1-(m+y))*w,i[1]=(g+b)*w,i[2]=(M-p)*w,i[3]=0,i[4]=(g-b)*D,i[5]=(1-(d+y))*D,i[6]=(h+A)*D,i[7]=0,i[8]=(M+p)*O,i[9]=(h-A)*O,i[10]=(1-(d+m))*O,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){const i=this.elements;let r=Pn.set(i[0],i[1],i[2]).length();const o=Pn.set(i[4],i[5],i[6]).length(),a=Pn.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),e.x=i[12],e.y=i[13],e.z=i[14],Wt.copy(this);const l=1/r,u=1/o,f=1/a;return Wt.elements[0]*=l,Wt.elements[1]*=l,Wt.elements[2]*=l,Wt.elements[4]*=u,Wt.elements[5]*=u,Wt.elements[6]*=u,Wt.elements[8]*=f,Wt.elements[9]*=f,Wt.elements[10]*=f,t.setFromRotationMatrix(Wt),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,i,r,o){const a=this.elements,c=2*r/(t-e),l=2*r/(n-i),u=(t+e)/(t-e),f=(n+i)/(n-i),d=-(o+r)/(o-r),g=-2*o*r/(o-r);return a[0]=c,a[4]=0,a[8]=u,a[12]=0,a[1]=0,a[5]=l,a[9]=f,a[13]=0,a[2]=0,a[6]=0,a[10]=d,a[14]=g,a[3]=0,a[7]=0,a[11]=-1,a[15]=0,this}makeOrthographic(e,t,n,i,r,o){const a=this.elements,c=1/(t-e),l=1/(n-i),u=1/(o-r),f=(t+e)*c,d=(n+i)*l,g=(o+r)*u;return a[0]=2*c,a[4]=0,a[8]=0,a[12]=-f,a[1]=0,a[5]=2*l,a[9]=0,a[13]=-d,a[2]=0,a[6]=0,a[10]=-2*u,a[14]=-g,a[3]=0,a[7]=0,a[11]=0,a[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const Pn=new G,Wt=new pt,la=new G(0,0,0),ca=new G(1,1,1),fn=new G,Ti=new G,Ft=new G,zr=new pt,Gr=new pi;class qi{constructor(e=0,t=0,n=0,i=qi.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const i=e.elements,r=i[0],o=i[4],a=i[8],c=i[1],l=i[5],u=i[9],f=i[2],d=i[6],g=i[10];switch(t){case"XYZ":this._y=Math.asin(Dt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,g),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Dt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,g),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(Dt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-f,g),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Dt(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(d,g),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(Dt(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(a,g));break;case"XZY":this._z=Math.asin(-Dt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,g),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return zr.makeRotationFromQuaternion(e),this.setFromRotationMatrix(zr,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Gr.setFromEuler(this),this.setFromQuaternion(Gr,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}qi.DEFAULT_ORDER="XYZ";class Rs{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let ua=0;const kr=new G,In=new pi,sn=new pt,Ei=new G,ni=new G,ha=new G,da=new pi,Vr=new G(1,0,0),Wr=new G(0,1,0),Hr=new G(0,0,1),fa={type:"added"},qr={type:"removed"};class St extends Xn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:ua++}),this.uuid=Yn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=St.DEFAULT_UP.clone();const e=new G,t=new qi,n=new pi,i=new G(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new pt},normalMatrix:{value:new Ut}}),this.matrix=new pt,this.matrixWorld=new pt,this.matrixAutoUpdate=St.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.matrixWorldAutoUpdate=St.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.layers=new Rs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return In.setFromAxisAngle(e,t),this.quaternion.multiply(In),this}rotateOnWorldAxis(e,t){return In.setFromAxisAngle(e,t),this.quaternion.premultiply(In),this}rotateX(e){return this.rotateOnAxis(Vr,e)}rotateY(e){return this.rotateOnAxis(Wr,e)}rotateZ(e){return this.rotateOnAxis(Hr,e)}translateOnAxis(e,t){return kr.copy(e).applyQuaternion(this.quaternion),this.position.add(kr.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Vr,e)}translateY(e){return this.translateOnAxis(Wr,e)}translateZ(e){return this.translateOnAxis(Hr,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(sn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ei.copy(e):Ei.set(e,t,n);const i=this.parent;this.updateWorldMatrix(!0,!1),ni.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?sn.lookAt(ni,Ei,this.up):sn.lookAt(Ei,ni,this.up),this.quaternion.setFromRotationMatrix(sn),i&&(sn.extractRotation(i.matrixWorld),In.setFromRotationMatrix(sn),this.quaternion.premultiply(In.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(fa)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(qr)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){for(let e=0;e<this.children.length;e++){const t=this.children[e];t.parent=null,t.dispatchEvent(qr)}return this.children.length=0,this}attach(e){return this.updateWorldMatrix(!0,!1),sn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),sn.multiply(e.parent.matrixWorld)),e.applyMatrix4(sn),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){const o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t){let n=[];this[e]===t&&n.push(this);for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectsByProperty(e,t);o.length>0&&(n=n.concat(o))}return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ni,e,ha),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ni,da,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,i=t.length;n<i;n++){const r=t[n];(r.matrixWorldAutoUpdate===!0||e===!0)&&r.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const i=this.children;for(let r=0,o=i.length;r<o;r++){const a=i[r];a.matrixWorldAutoUpdate===!0&&a.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.5,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON()));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const c=a.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){const f=c[l];r(e.shapes,f)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(e.materials,this.material[c]));i.material=a}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){const c=this.animations[a];i.animations.push(r(e.animations,c))}}if(t){const a=o(e.geometries),c=o(e.materials),l=o(e.textures),u=o(e.images),f=o(e.shapes),d=o(e.skeletons),g=o(e.animations),M=o(e.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),u.length>0&&(n.images=u),f.length>0&&(n.shapes=f),d.length>0&&(n.skeletons=d),g.length>0&&(n.animations=g),M.length>0&&(n.nodes=M)}return n.object=i,n;function o(a){const c=[];for(const l in a){const u=a[l];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const i=e.children[n];this.add(i.clone())}return this}}St.DEFAULT_UP=new G(0,1,0);St.DEFAULT_MATRIX_AUTO_UPDATE=!0;St.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Ht=new G,an=new G,lr=new G,on=new G,Fn=new G,Nn=new G,Xr=new G,cr=new G,ur=new G,hr=new G;class cn{constructor(e=new G,t=new G,n=new G){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Ht.subVectors(e,t),i.cross(Ht);const r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){Ht.subVectors(i,t),an.subVectors(n,t),lr.subVectors(e,t);const o=Ht.dot(Ht),a=Ht.dot(an),c=Ht.dot(lr),l=an.dot(an),u=an.dot(lr),f=o*l-a*a;if(f===0)return r.set(-2,-1,-1);const d=1/f,g=(l*c-a*u)*d,M=(o*u-a*c)*d;return r.set(1-g-M,M,g)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,on),on.x>=0&&on.y>=0&&on.x+on.y<=1}static getUV(e,t,n,i,r,o,a,c){return this.getBarycoord(e,t,n,i,on),c.set(0,0),c.addScaledVector(r,on.x),c.addScaledVector(o,on.y),c.addScaledVector(a,on.z),c}static isFrontFacing(e,t,n,i){return Ht.subVectors(n,t),an.subVectors(e,t),Ht.cross(an).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ht.subVectors(this.c,this.b),an.subVectors(this.a,this.b),Ht.cross(an).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return cn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return cn.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,n,i,r){return cn.getUV(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return cn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return cn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,i=this.b,r=this.c;let o,a;Fn.subVectors(i,n),Nn.subVectors(r,n),cr.subVectors(e,n);const c=Fn.dot(cr),l=Nn.dot(cr);if(c<=0&&l<=0)return t.copy(n);ur.subVectors(e,i);const u=Fn.dot(ur),f=Nn.dot(ur);if(u>=0&&f<=u)return t.copy(i);const d=c*f-u*l;if(d<=0&&c>=0&&u<=0)return o=c/(c-u),t.copy(n).addScaledVector(Fn,o);hr.subVectors(e,r);const g=Fn.dot(hr),M=Nn.dot(hr);if(M>=0&&g<=M)return t.copy(r);const m=g*l-c*M;if(m<=0&&l>=0&&M<=0)return a=l/(l-M),t.copy(n).addScaledVector(Nn,a);const h=u*M-g*f;if(h<=0&&f-u>=0&&g-M>=0)return Xr.subVectors(r,i),a=(f-u)/(f-u+(g-M)),t.copy(i).addScaledVector(Xr,a);const y=1/(h+m+d);return o=m*y,a=d*y,t.copy(n).addScaledVector(Fn,o).addScaledVector(Nn,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}let pa=0;class jn extends Xn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:pa++}),this.uuid=Yn(),this.name="",this.type="Material",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn("THREE.Material: '"+t+"' parameter is undefined.");continue}const i=this[t];if(i===void 0){console.warn("THREE."+this.type+": '"+t+"' is not a property of this material.");continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.5,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(n.blending=this.blending),this.side!==0&&(n.side=this.side),this.vertexColors&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=this.transparent),n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.stencilWrite=this.stencilWrite,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaToCoverage===!0&&(n.alphaToCoverage=this.alphaToCoverage),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=this.premultipliedAlpha),this.forceSinglePass===!0&&(n.forceSinglePass=this.forceSinglePass),this.wireframe===!0&&(n.wireframe=this.wireframe),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=this.flatShading),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){const o=[];for(const a in r){const c=r[a];delete c.metadata,o.push(c)}return o}if(t){const r=i(e.textures),o=i(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class Vn extends jn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new et(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const ft=new G,Ai=new je;class $t{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=35044,this.updateRange={offset:0,count:-1},this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Ai.fromBufferAttribute(this,t),Ai.applyMatrix3(e),this.setXY(t,Ai.x,Ai.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.applyMatrix3(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.applyMatrix4(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.applyNormalMatrix(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.transformDirection(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}set(e,t=0){return this.array.set(e,t),this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=oi(t,this.array)),t}setX(e,t){return this.normalized&&(t=Rt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=oi(t,this.array)),t}setY(e,t){return this.normalized&&(t=Rt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=oi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Rt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=oi(t,this.array)),t}setW(e,t){return this.normalized&&(t=Rt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Rt(t,this.array),n=Rt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=Rt(t,this.array),n=Rt(n,this.array),i=Rt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=Rt(t,this.array),n=Rt(n,this.array),i=Rt(i,this.array),r=Rt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==35044&&(e.usage=this.usage),(this.updateRange.offset!==0||this.updateRange.count!==-1)&&(e.updateRange=this.updateRange),e}copyColorsArray(){console.error("THREE.BufferAttribute: copyColorsArray() was removed in r144.")}copyVector2sArray(){console.error("THREE.BufferAttribute: copyVector2sArray() was removed in r144.")}copyVector3sArray(){console.error("THREE.BufferAttribute: copyVector3sArray() was removed in r144.")}copyVector4sArray(){console.error("THREE.BufferAttribute: copyVector4sArray() was removed in r144.")}}class Ds extends $t{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class Ps extends $t{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class mt extends $t{constructor(e,t,n){super(new Float32Array(e),t,n)}}let ma=0;const zt=new pt,dr=new St,Un=new G,Nt=new mi,ii=new mi,yt=new G;class Bt extends Xn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ma++}),this.uuid=Yn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(ws(e)?Ps:Ds)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Ut().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return zt.makeRotationFromQuaternion(e),this.applyMatrix4(zt),this}rotateX(e){return zt.makeRotationX(e),this.applyMatrix4(zt),this}rotateY(e){return zt.makeRotationY(e),this.applyMatrix4(zt),this}rotateZ(e){return zt.makeRotationZ(e),this.applyMatrix4(zt),this}translate(e,t,n){return zt.makeTranslation(e,t,n),this.applyMatrix4(zt),this}scale(e,t,n){return zt.makeScale(e,t,n),this.applyMatrix4(zt),this}lookAt(e){return dr.lookAt(e),dr.updateMatrix(),this.applyMatrix4(dr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Un).negate(),this.translate(Un.x,Un.y,Un.z),this}setFromPoints(e){const t=[];for(let n=0,i=e.length;n<i;n++){const r=e[n];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new mt(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new mi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new G(-1/0,-1/0,-1/0),new G(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){const r=t[n];Nt.setFromBufferAttribute(r),this.morphTargetsRelative?(yt.addVectors(this.boundingBox.min,Nt.min),this.boundingBox.expandByPoint(yt),yt.addVectors(this.boundingBox.max,Nt.max),this.boundingBox.expandByPoint(yt)):(this.boundingBox.expandByPoint(Nt.min),this.boundingBox.expandByPoint(Nt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Hi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new G,1/0);return}if(e){const n=this.boundingSphere.center;if(Nt.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){const a=t[r];ii.setFromBufferAttribute(a),this.morphTargetsRelative?(yt.addVectors(Nt.min,ii.min),Nt.expandByPoint(yt),yt.addVectors(Nt.max,ii.max),Nt.expandByPoint(yt)):(Nt.expandByPoint(ii.min),Nt.expandByPoint(ii.max))}Nt.getCenter(n);let i=0;for(let r=0,o=e.count;r<o;r++)yt.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(yt));if(t)for(let r=0,o=t.length;r<o;r++){const a=t[r],c=this.morphTargetsRelative;for(let l=0,u=a.count;l<u;l++)yt.fromBufferAttribute(a,l),c&&(Un.fromBufferAttribute(e,l),yt.add(Un)),i=Math.max(i,n.distanceToSquared(yt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.array,i=t.position.array,r=t.normal.array,o=t.uv.array,a=i.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new $t(new Float32Array(4*a),4));const c=this.getAttribute("tangent").array,l=[],u=[];for(let B=0;B<a;B++)l[B]=new G,u[B]=new G;const f=new G,d=new G,g=new G,M=new je,m=new je,h=new je,y=new G,A=new G;function p(B,$,K){f.fromArray(i,B*3),d.fromArray(i,$*3),g.fromArray(i,K*3),M.fromArray(o,B*2),m.fromArray(o,$*2),h.fromArray(o,K*2),d.sub(f),g.sub(f),m.sub(M),h.sub(M);const z=1/(m.x*h.y-h.x*m.y);isFinite(z)&&(y.copy(d).multiplyScalar(h.y).addScaledVector(g,-m.y).multiplyScalar(z),A.copy(g).multiplyScalar(m.x).addScaledVector(d,-h.x).multiplyScalar(z),l[B].add(y),l[$].add(y),l[K].add(y),u[B].add(A),u[$].add(A),u[K].add(A))}let b=this.groups;b.length===0&&(b=[{start:0,count:n.length}]);for(let B=0,$=b.length;B<$;++B){const K=b[B],z=K.start,F=K.count;for(let Y=z,te=z+F;Y<te;Y+=3)p(n[Y+0],n[Y+1],n[Y+2])}const w=new G,D=new G,O=new G,v=new G;function L(B){O.fromArray(r,B*3),v.copy(O);const $=l[B];w.copy($),w.sub(O.multiplyScalar(O.dot($))).normalize(),D.crossVectors(v,$);const z=D.dot(u[B])<0?-1:1;c[B*4]=w.x,c[B*4+1]=w.y,c[B*4+2]=w.z,c[B*4+3]=z}for(let B=0,$=b.length;B<$;++B){const K=b[B],z=K.start,F=K.count;for(let Y=z,te=z+F;Y<te;Y+=3)L(n[Y+0]),L(n[Y+1]),L(n[Y+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new $t(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,g=n.count;d<g;d++)n.setXYZ(d,0,0,0);const i=new G,r=new G,o=new G,a=new G,c=new G,l=new G,u=new G,f=new G;if(e)for(let d=0,g=e.count;d<g;d+=3){const M=e.getX(d+0),m=e.getX(d+1),h=e.getX(d+2);i.fromBufferAttribute(t,M),r.fromBufferAttribute(t,m),o.fromBufferAttribute(t,h),u.subVectors(o,r),f.subVectors(i,r),u.cross(f),a.fromBufferAttribute(n,M),c.fromBufferAttribute(n,m),l.fromBufferAttribute(n,h),a.add(u),c.add(u),l.add(u),n.setXYZ(M,a.x,a.y,a.z),n.setXYZ(m,c.x,c.y,c.z),n.setXYZ(h,l.x,l.y,l.z)}else for(let d=0,g=t.count;d<g;d+=3)i.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),u.subVectors(o,r),f.subVectors(i,r),u.cross(f),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}merge(){return console.error("THREE.BufferGeometry.merge() has been removed. Use THREE.BufferGeometryUtils.mergeBufferGeometries() instead."),this}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)yt.fromBufferAttribute(e,t),yt.normalize(),e.setXYZ(t,yt.x,yt.y,yt.z)}toNonIndexed(){function e(a,c){const l=a.array,u=a.itemSize,f=a.normalized,d=new l.constructor(c.length*u);let g=0,M=0;for(let m=0,h=c.length;m<h;m++){a.isInterleavedBufferAttribute?g=c[m]*a.data.stride+a.offset:g=c[m]*u;for(let y=0;y<u;y++)d[M++]=l[g++]}return new $t(d,u,f)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Bt,n=this.index.array,i=this.attributes;for(const a in i){const c=i[a],l=e(c,n);t.setAttribute(a,l)}const r=this.morphAttributes;for(const a in r){const c=[],l=r[a];for(let u=0,f=l.length;u<f;u++){const d=l[u],g=e(d,n);c.push(g)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,c=o.length;a<c;a++){const l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.5,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const l=n[c];e.data.attributes[c]=l.toJSON(e.data)}const i={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],u=[];for(let f=0,d=l.length;f<d;f++){const g=l[f];u.push(g.toJSON(e.data))}u.length>0&&(i[c]=u,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const i=e.attributes;for(const l in i){const u=i[l];this.setAttribute(l,u.clone(t))}const r=e.morphAttributes;for(const l in r){const u=[],f=r[l];for(let d=0,g=f.length;d<g;d++)u.push(f[d].clone(t));this.morphAttributes[l]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let l=0,u=o.length;l<u;l++){const f=o[l];this.addGroup(f.start,f.count,f.materialIndex)}const a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,e.parameters!==void 0&&(this.parameters=Object.assign({},e.parameters)),this}dispose(){this.dispatchEvent({type:"dispose"})}}const Yr=new pt,Bn=new Ls,fr=new Hi,ri=new G,si=new G,ai=new G,pr=new G,Ci=new G,Li=new je,Ri=new je,Di=new je,mr=new G,Pi=new G;class tt extends St{constructor(e=new Bt,t=new Vn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){const a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){const n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(i,e);const a=this.morphTargetInfluences;if(r&&a){Ci.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const u=a[c],f=r[c];u!==0&&(pr.fromBufferAttribute(f,e),o?Ci.addScaledVector(pr,u):Ci.addScaledVector(pr.sub(t),u))}t.add(Ci)}return this.isSkinnedMesh&&this.boneTransform(e,t),t}raycast(e,t){const n=this.geometry,i=this.material,r=this.matrixWorld;if(i===void 0||(n.boundingSphere===null&&n.computeBoundingSphere(),fr.copy(n.boundingSphere),fr.applyMatrix4(r),e.ray.intersectsSphere(fr)===!1)||(Yr.copy(r).invert(),Bn.copy(e.ray).applyMatrix4(Yr),n.boundingBox!==null&&Bn.intersectsBox(n.boundingBox)===!1))return;let o;const a=n.index,c=n.attributes.position,l=n.attributes.uv,u=n.attributes.uv2,f=n.groups,d=n.drawRange;if(a!==null)if(Array.isArray(i))for(let g=0,M=f.length;g<M;g++){const m=f[g],h=i[m.materialIndex],y=Math.max(m.start,d.start),A=Math.min(a.count,Math.min(m.start+m.count,d.start+d.count));for(let p=y,b=A;p<b;p+=3){const w=a.getX(p),D=a.getX(p+1),O=a.getX(p+2);o=Ii(this,h,e,Bn,l,u,w,D,O),o&&(o.faceIndex=Math.floor(p/3),o.face.materialIndex=m.materialIndex,t.push(o))}}else{const g=Math.max(0,d.start),M=Math.min(a.count,d.start+d.count);for(let m=g,h=M;m<h;m+=3){const y=a.getX(m),A=a.getX(m+1),p=a.getX(m+2);o=Ii(this,i,e,Bn,l,u,y,A,p),o&&(o.faceIndex=Math.floor(m/3),t.push(o))}}else if(c!==void 0)if(Array.isArray(i))for(let g=0,M=f.length;g<M;g++){const m=f[g],h=i[m.materialIndex],y=Math.max(m.start,d.start),A=Math.min(c.count,Math.min(m.start+m.count,d.start+d.count));for(let p=y,b=A;p<b;p+=3){const w=p,D=p+1,O=p+2;o=Ii(this,h,e,Bn,l,u,w,D,O),o&&(o.faceIndex=Math.floor(p/3),o.face.materialIndex=m.materialIndex,t.push(o))}}else{const g=Math.max(0,d.start),M=Math.min(c.count,d.start+d.count);for(let m=g,h=M;m<h;m+=3){const y=m,A=m+1,p=m+2;o=Ii(this,i,e,Bn,l,u,y,A,p),o&&(o.faceIndex=Math.floor(m/3),t.push(o))}}}}function ga(s,e,t,n,i,r,o,a){let c;if(e.side===1?c=n.intersectTriangle(o,r,i,!0,a):c=n.intersectTriangle(i,r,o,e.side===0,a),c===null)return null;Pi.copy(a),Pi.applyMatrix4(s.matrixWorld);const l=t.ray.origin.distanceTo(Pi);return l<t.near||l>t.far?null:{distance:l,point:Pi.clone(),object:s}}function Ii(s,e,t,n,i,r,o,a,c){s.getVertexPosition(o,ri),s.getVertexPosition(a,si),s.getVertexPosition(c,ai);const l=ga(s,e,t,n,ri,si,ai,mr);if(l){i&&(Li.fromBufferAttribute(i,o),Ri.fromBufferAttribute(i,a),Di.fromBufferAttribute(i,c),l.uv=cn.getUV(mr,ri,si,ai,Li,Ri,Di,new je)),r&&(Li.fromBufferAttribute(r,o),Ri.fromBufferAttribute(r,a),Di.fromBufferAttribute(r,c),l.uv2=cn.getUV(mr,ri,si,ai,Li,Ri,Di,new je));const u={a:o,b:a,c,normal:new G,materialIndex:0};cn.getNormal(ri,si,ai,u.normal),l.face=u}return l}class gi extends Bt{constructor(e=1,t=1,n=1,i=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:o};const a=this;i=Math.floor(i),r=Math.floor(r),o=Math.floor(o);const c=[],l=[],u=[],f=[];let d=0,g=0;M("z","y","x",-1,-1,n,t,e,o,r,0),M("z","y","x",1,-1,n,t,-e,o,r,1),M("x","z","y",1,1,e,n,t,i,o,2),M("x","z","y",1,-1,e,n,-t,i,o,3),M("x","y","z",1,-1,e,t,n,i,r,4),M("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(c),this.setAttribute("position",new mt(l,3)),this.setAttribute("normal",new mt(u,3)),this.setAttribute("uv",new mt(f,2));function M(m,h,y,A,p,b,w,D,O,v,L){const B=b/O,$=w/v,K=b/2,z=w/2,F=D/2,Y=O+1,te=v+1;let ne=0,J=0;const ue=new G;for(let oe=0;oe<te;oe++){const ve=oe*$-z;for(let W=0;W<Y;W++){const Q=W*B-K;ue[m]=Q*A,ue[h]=ve*p,ue[y]=F,l.push(ue.x,ue.y,ue.z),ue[m]=0,ue[h]=0,ue[y]=D>0?1:-1,u.push(ue.x,ue.y,ue.z),f.push(W/O),f.push(1-oe/v),ne+=1}}for(let oe=0;oe<v;oe++)for(let ve=0;ve<O;ve++){const W=d+ve+Y*oe,Q=d+ve+Y*(oe+1),de=d+(ve+1)+Y*(oe+1),me=d+(ve+1)+Y*oe;c.push(W,Q,me),c.push(Q,de,me),J+=6}a.addGroup(g,J,L),g+=J,d+=ne}}static fromJSON(e){return new gi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function qn(s){const e={};for(const t in s){e[t]={};for(const n in s[t]){const i=s[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function At(s){const e={};for(let t=0;t<s.length;t++){const n=qn(s[t]);for(const i in n)e[i]=n[i]}return e}function _a(s){const e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function Is(s){return s.getRenderTarget()===null&&s.outputEncoding===3001?jt:di}const xa={clone:qn,merge:At};var va=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ya=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Tn extends jn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=va,this.fragmentShader=ya,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv2:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=qn(e.uniforms),this.uniformsGroups=_a(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const i in this.uniforms){const o=this.uniforms[i].value;o&&o.isTexture?t.uniforms[i]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[i]={type:"m4",value:o.toArray()}:t.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class Fs extends St{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new pt,this.projectionMatrix=new pt,this.projectionMatrixInverse=new pt}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(-t[8],-t[9],-t[10]).normalize()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class qt extends Fs{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Gi*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(ci*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Gi*2*Math.atan(Math.tan(ci*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,n,i,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(ci*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*i/c,t-=o.offsetY*n/l,i*=o.width/c,n*=o.height/l}const a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const On=-90,zn=1;class Ma extends St{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n;const i=new qt(On,zn,e,t);i.layers=this.layers,i.up.set(0,1,0),i.lookAt(1,0,0),this.add(i);const r=new qt(On,zn,e,t);r.layers=this.layers,r.up.set(0,1,0),r.lookAt(-1,0,0),this.add(r);const o=new qt(On,zn,e,t);o.layers=this.layers,o.up.set(0,0,-1),o.lookAt(0,1,0),this.add(o);const a=new qt(On,zn,e,t);a.layers=this.layers,a.up.set(0,0,1),a.lookAt(0,-1,0),this.add(a);const c=new qt(On,zn,e,t);c.layers=this.layers,c.up.set(0,1,0),c.lookAt(0,0,1),this.add(c);const l=new qt(On,zn,e,t);l.layers=this.layers,l.up.set(0,1,0),l.lookAt(0,0,-1),this.add(l)}update(e,t){this.parent===null&&this.updateMatrixWorld();const n=this.renderTarget,[i,r,o,a,c,l]=this.children,u=e.getRenderTarget(),f=e.toneMapping,d=e.xr.enabled;e.toneMapping=0,e.xr.enabled=!1;const g=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0),e.render(t,i),e.setRenderTarget(n,1),e.render(t,r),e.setRenderTarget(n,2),e.render(t,o),e.setRenderTarget(n,3),e.render(t,a),e.setRenderTarget(n,4),e.render(t,c),n.texture.generateMipmaps=g,e.setRenderTarget(n,5),e.render(t,l),e.setRenderTarget(u),e.toneMapping=f,e.xr.enabled=d,n.texture.needsPMREMUpdate=!0}}class Ns extends Pt{constructor(e,t,n,i,r,o,a,c,l,u){e=e!==void 0?e:[],t=t!==void 0?t:301,super(e,t,n,i,r,o,a,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Sa extends wn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new Ns(i,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.encoding),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:1006}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.encoding=t.encoding,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},i=new gi(5,5,5),r=new Tn({name:"CubemapFromEquirect",uniforms:qn(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});r.uniforms.tEquirect.value=t;const o=new tt(i,r),a=t.minFilter;return t.minFilter===1008&&(t.minFilter=1006),new Ma(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,n,i){const r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,i);e.setRenderTarget(r)}}const gr=new G,ba=new G,wa=new Ut;class yn{constructor(e=new G(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const i=gr.subVectors(n,t).cross(ba.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(this.normal).multiplyScalar(-this.distanceToPoint(e)).add(e)}intersectLine(e,t){const n=e.delta(gr),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const r=-(e.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:t.copy(n).multiplyScalar(r).add(e.start)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||wa.getNormalMatrix(e),i=this.coplanarPoint(gr).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Gn=new Hi,Fi=new G;class Ar{constructor(e=new yn,t=new yn,n=new yn,i=new yn,r=new yn,o=new yn){this.planes=[e,t,n,i,r,o]}set(e,t,n,i,r,o){const a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(i),a[4].copy(r),a[5].copy(o),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e){const t=this.planes,n=e.elements,i=n[0],r=n[1],o=n[2],a=n[3],c=n[4],l=n[5],u=n[6],f=n[7],d=n[8],g=n[9],M=n[10],m=n[11],h=n[12],y=n[13],A=n[14],p=n[15];return t[0].setComponents(a-i,f-c,m-d,p-h).normalize(),t[1].setComponents(a+i,f+c,m+d,p+h).normalize(),t[2].setComponents(a+r,f+l,m+g,p+y).normalize(),t[3].setComponents(a-r,f-l,m-g,p-y).normalize(),t[4].setComponents(a-o,f-u,m-M,p-A).normalize(),t[5].setComponents(a+o,f+u,m+M,p+A).normalize(),this}intersectsObject(e){const t=e.geometry;return t.boundingSphere===null&&t.computeBoundingSphere(),Gn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld),this.intersectsSphere(Gn)}intersectsSprite(e){return Gn.center.set(0,0,0),Gn.radius=.7071067811865476,Gn.applyMatrix4(e.matrixWorld),this.intersectsSphere(Gn)}intersectsSphere(e){const t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const i=t[n];if(Fi.x=i.normal.x>0?e.max.x:e.min.x,Fi.y=i.normal.y>0?e.max.y:e.min.y,Fi.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(Fi)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Us(){let s=null,e=!1,t=null,n=null;function i(r,o){t(r,o),n=s.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function Ta(s,e){const t=e.isWebGL2,n=new WeakMap;function i(l,u){const f=l.array,d=l.usage,g=s.createBuffer();s.bindBuffer(u,g),s.bufferData(u,f,d),l.onUploadCallback();let M;if(f instanceof Float32Array)M=5126;else if(f instanceof Uint16Array)if(l.isFloat16BufferAttribute)if(t)M=5131;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else M=5123;else if(f instanceof Int16Array)M=5122;else if(f instanceof Uint32Array)M=5125;else if(f instanceof Int32Array)M=5124;else if(f instanceof Int8Array)M=5120;else if(f instanceof Uint8Array)M=5121;else if(f instanceof Uint8ClampedArray)M=5121;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+f);return{buffer:g,type:M,bytesPerElement:f.BYTES_PER_ELEMENT,version:l.version}}function r(l,u,f){const d=u.array,g=u.updateRange;s.bindBuffer(f,l),g.count===-1?s.bufferSubData(f,0,d):(t?s.bufferSubData(f,g.offset*d.BYTES_PER_ELEMENT,d,g.offset,g.count):s.bufferSubData(f,g.offset*d.BYTES_PER_ELEMENT,d.subarray(g.offset,g.offset+g.count)),g.count=-1),u.onUploadCallback()}function o(l){return l.isInterleavedBufferAttribute&&(l=l.data),n.get(l)}function a(l){l.isInterleavedBufferAttribute&&(l=l.data);const u=n.get(l);u&&(s.deleteBuffer(u.buffer),n.delete(l))}function c(l,u){if(l.isGLBufferAttribute){const d=n.get(l);(!d||d.version<l.version)&&n.set(l,{buffer:l.buffer,type:l.type,bytesPerElement:l.elementSize,version:l.version});return}l.isInterleavedBufferAttribute&&(l=l.data);const f=n.get(l);f===void 0?n.set(l,i(l,u)):f.version<l.version&&(r(f.buffer,l,u),f.version=l.version)}return{get:o,remove:a,update:c}}class fi extends Bt{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};const r=e/2,o=t/2,a=Math.floor(n),c=Math.floor(i),l=a+1,u=c+1,f=e/a,d=t/c,g=[],M=[],m=[],h=[];for(let y=0;y<u;y++){const A=y*d-o;for(let p=0;p<l;p++){const b=p*f-r;M.push(b,-A,0),m.push(0,0,1),h.push(p/a),h.push(1-y/c)}}for(let y=0;y<c;y++)for(let A=0;A<a;A++){const p=A+l*y,b=A+l*(y+1),w=A+1+l*(y+1),D=A+1+l*y;g.push(p,b,D),g.push(b,w,D)}this.setIndex(g),this.setAttribute("position",new mt(M,3)),this.setAttribute("normal",new mt(m,3)),this.setAttribute("uv",new mt(h,2))}static fromJSON(e){return new fi(e.width,e.height,e.widthSegments,e.heightSegments)}}var Ea=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vUv ).g;
#endif`,Aa=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ca=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,La=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ra=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Da=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Pa="vec3 transformed = vec3( position );",Ia=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Fa=`vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
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
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 f0, const in float f90, const in float roughness ) {
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
#ifdef USE_IRIDESCENCE
	vec3 BRDF_GGX_Iridescence( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 f0, const in float f90, const in float iridescence, const in vec3 iridescenceFresnel, const in float roughness ) {
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = mix( F_Schlick( f0, f90, dotVH ), iridescenceFresnel, iridescence );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
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
float G_BlinnPhong_Implicit( ) {
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
#endif`,Na=`#ifdef USE_IRIDESCENCE
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
		float R21 = R12;
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
#endif`,Ua=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vUv );
		vec2 dSTdy = dFdy( vUv );
		float Hll = bumpScale * texture2D( bumpMap, vUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = dFdx( surf_pos.xyz );
		vec3 vSigmaY = dFdy( surf_pos.xyz );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Ba=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
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
#endif`,Oa=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,za=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Ga=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,ka=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Va=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Wa=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,Ha=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,qa=`#define PI 3.141592653589793
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
struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal;
#endif
};
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
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}`,Xa=`#ifdef ENVMAP_TYPE_CUBE_UV
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
	#define cubeUV_v0 0.339
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_v1 0.276
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_v4 0.046
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_v5 0.016
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_v6 0.0038
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
#endif`,Ya=`vec3 transformedNormal = objectNormal;
#ifdef USE_INSTANCING
	mat3 m = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
	transformedNormal = m * transformedNormal;
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	vec3 transformedTangent = ( modelViewMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,ja=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Za=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vUv ).x * displacementScale + displacementBias );
#endif`,$a=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Ka=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Ja="gl_FragColor = linearToOutputTexel( gl_FragColor );",Qa=`vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,eo=`#ifdef USE_ENVMAP
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
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
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
#endif`,to=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,no=`#ifdef USE_ENVMAP
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
#endif`,io=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,ro=`#ifdef USE_ENVMAP
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
#endif`,so=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ao=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,oo=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,lo=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,co=`#ifdef USE_GRADIENTMAP
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
}`,uo=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vUv2 );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,ho=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,fo=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,po=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in GeometricContext geometry, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in GeometricContext geometry, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,mo=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
uniform vec3 lightProbe[ 9 ];
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
	#if defined ( PHYSICALLY_CORRECT_LIGHTS )
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#else
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#endif
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
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight light ) {
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
	void getPointLightInfo( const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometry.position;
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
	void getSpotLightInfo( const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometry.position;
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
#endif`,go=`#if defined( USE_ENVMAP )
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#if defined( ENVMAP_TYPE_CUBE_UV )
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#if defined( ENVMAP_TYPE_CUBE_UV )
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
#endif`,_o=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,xo=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometry.normal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,vo=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,yo=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Mo=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULARINTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vUv ).a;
		#endif
		#ifdef USE_SPECULARCOLORMAP
			specularColorFactor *= texture2D( specularColorMap, vUv ).rgb;
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
		material.clearcoat *= texture2D( clearcoatMap, vUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEENCOLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEENROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vUv ).a;
	#endif
#endif`,So=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
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
};
vec3 clearcoatSpecular = vec3( 0.0 );
vec3 sheenSpecular = vec3( 0.0 );
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
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometry.normal;
		vec3 viewDir = geometry.viewDir;
		vec3 position = geometry.position;
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
void RE_Direct_Physical( const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometry.clearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecular += ccIrradiance * BRDF_GGX( directLight.direction, geometry.viewDir, geometry.clearcoatNormal, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecular += irradiance * BRDF_Sheen( directLight.direction, geometry.viewDir, geometry.normal, material.sheenColor, material.sheenRoughness );
	#endif
	#ifdef USE_IRIDESCENCE
		reflectedLight.directSpecular += irradiance * BRDF_GGX_Iridescence( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness );
	#else
		reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularF90, material.roughness );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecular += clearcoatRadiance * EnvironmentBRDF( geometry.clearcoatNormal, geometry.viewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecular += irradiance * material.sheenColor * IBLSheenBRDF( geometry.normal, geometry.viewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometry.normal, geometry.viewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometry.normal, geometry.viewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
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
}`,bo=`
GeometricContext geometry;
geometry.position = - vViewPosition;
geometry.normal = normal;
geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
#ifdef USE_CLEARCOAT
	geometry.clearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometry.viewDir ) );
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
		getPointLightInfo( pointLight, geometry, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
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
		getSpotLightInfo( spotLight, geometry, directLight );
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
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
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
		getDirectionalLightInfo( directionalLight, geometry, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	irradiance += getLightProbeIrradiance( lightProbe, geometry.normal );
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry.normal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,wo=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vUv2 );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometry.normal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	radiance += getIBLRadiance( geometry.viewDir, geometry.normal, material.roughness );
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometry.viewDir, geometry.clearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,To=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometry, material, reflectedLight );
#endif`,Eo=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Ao=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Co=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,Lo=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,Ro=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Do=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Po=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Io=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	uniform mat3 uvTransform;
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Fo=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vUv );
	metalnessFactor *= texelMetalness.b;
#endif`,No=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Uo=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Bo=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,Oo=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,zo=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,Go=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	#ifdef USE_TANGENT
		vec3 tangent = normalize( vTangent );
		vec3 bitangent = normalize( vBitangent );
		#ifdef DOUBLE_SIDED
			tangent = tangent * faceDirection;
			bitangent = bitangent * faceDirection;
		#endif
		#if defined( TANGENTSPACE_NORMALMAP ) || defined( USE_CLEARCOAT_NORMALMAP )
			mat3 vTBN = mat3( tangent, bitangent, normal );
		#endif
	#endif
#endif
vec3 geometryNormal = normal;`,ko=`#ifdef OBJECTSPACE_NORMALMAP
	normal = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( TANGENTSPACE_NORMALMAP )
	vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	#ifdef USE_TANGENT
		normal = normalize( vTBN * mapN );
	#else
		normal = perturbNormal2Arb( - vViewPosition, normal, mapN, faceDirection );
	#endif
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Vo=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Wo=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ho=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,qo=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef OBJECTSPACE_NORMALMAP
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( TANGENTSPACE_NORMALMAP ) || defined ( USE_CLEARCOAT_NORMALMAP ) )
	vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm, vec3 mapN, float faceDirection ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( vUv.st );
		vec2 st1 = dFdy( vUv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : faceDirection * inversesqrt( det );
		return normalize( T * ( mapN.x * scale ) + B * ( mapN.y * scale ) + N * mapN.z );
	}
#endif`,Xo=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = geometryNormal;
#endif`,Yo=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	#ifdef USE_TANGENT
		clearcoatNormal = normalize( vTBN * clearcoatMapN );
	#else
		clearcoatNormal = perturbNormal2Arb( - vViewPosition, clearcoatNormal, clearcoatMapN, faceDirection );
	#endif
#endif`,jo=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif`,Zo=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,$o=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha + 0.1;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Ko=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float linearClipZ, const in float near, const in float far ) {
	return linearClipZ * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * invClipZ - far );
}`,Jo=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Qo=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,el=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,tl=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,nl=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vUv );
	roughnessFactor *= texelRoughness.g;
#endif`,il=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,rl=`#if NUM_SPOT_LIGHT_COORDS > 0
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
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
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
		return shadow;
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
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
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
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,sl=`#if NUM_SPOT_LIGHT_COORDS > 0
  uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
  varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
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
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,al=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,ol=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,ll=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,cl=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	uniform int boneTextureSize;
	mat4 getBoneMatrix( const in float i ) {
		float j = i * 4.0;
		float x = mod( j, float( boneTextureSize ) );
		float y = floor( j / float( boneTextureSize ) );
		float dx = 1.0 / float( boneTextureSize );
		float dy = 1.0 / float( boneTextureSize );
		y = dy * ( y + 0.5 );
		vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
		vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
		vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
		vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
		mat4 bone = mat4( v1, v2, v3, v4 );
		return bone;
	}
#endif`,ul=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,hl=`#ifdef USE_SKINNING
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
#endif`,dl=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,fl=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,pl=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,ml=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return toneMappingExposure * color;
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,gl=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmission = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmission.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmission.rgb, material.transmission );
#endif`,_l=`#ifdef USE_TRANSMISSION
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
		float framebufferLod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		#ifdef texture2DLodEXT
			return texture2DLodEXT( transmissionSamplerMap, fragCoord.xy, framebufferLod );
		#else
			return texture2D( transmissionSamplerMap, fragCoord.xy, framebufferLod );
		#endif
	}
	vec3 applyVolumeAttenuation( const in vec3 radiance, const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return radiance;
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance * radiance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 attenuatedColor = applyVolumeAttenuation( transmittedLight.rgb, length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		return vec4( ( 1.0 - F ) * attenuatedColor * diffuseColor, transmittedLight.a );
	}
#endif`,xl=`#if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )
	varying vec2 vUv;
#endif`,vl=`#ifdef USE_UV
	#ifdef UVS_VERTEX_ONLY
		vec2 vUv;
	#else
		varying vec2 vUv;
	#endif
	uniform mat3 uvTransform;
#endif`,yl=`#ifdef USE_UV
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
#endif`,Ml=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	varying vec2 vUv2;
#endif`,Sl=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	attribute vec2 uv2;
	varying vec2 vUv2;
	uniform mat3 uv2Transform;
#endif`,bl=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;
#endif`,wl=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Tl=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,El=`uniform sampler2D t2D;
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
	#include <encodings_fragment>
}`,Al=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Cl=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,Ll=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Rl=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,Dl=`#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <skinbase_vertex>
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
}`,Pl=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,Il=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <skinbase_vertex>
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
}`,Fl=`#define DISTANCE
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
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Nl=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Ul=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,Bl=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Ol=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,zl=`#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
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
}`,Gl=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vUv2 );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,kl=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
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
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
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
}`,Vl=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
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
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
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
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Wl=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
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
	#include <morphcolor_vertex>
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
}`,Hl=`#define MATCAP
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
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
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
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ql=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
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
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Xl=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
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
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Yl=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
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
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
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
}`,jl=`#define PHONG
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
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
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
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
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
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zl=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
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
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
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
}`,$l=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULARINTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
	#ifdef USE_SPECULARCOLORMAP
		uniform sampler2D specularColorMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
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
	#ifdef USE_SHEENCOLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEENROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <bsdfs>
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
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
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
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecular;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometry.clearcoatNormal, geometry.viewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + clearcoatSpecular * material.clearcoat;
	#endif
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Kl=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
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
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
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
}`,Jl=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
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
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ql=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <color_vertex>
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
}`,ec=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,tc=`#include <common>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,nc=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}`,ic=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
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
}`,rc=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}`,Ve={alphamap_fragment:Ea,alphamap_pars_fragment:Aa,alphatest_fragment:Ca,alphatest_pars_fragment:La,aomap_fragment:Ra,aomap_pars_fragment:Da,begin_vertex:Pa,beginnormal_vertex:Ia,bsdfs:Fa,iridescence_fragment:Na,bumpmap_pars_fragment:Ua,clipping_planes_fragment:Ba,clipping_planes_pars_fragment:Oa,clipping_planes_pars_vertex:za,clipping_planes_vertex:Ga,color_fragment:ka,color_pars_fragment:Va,color_pars_vertex:Wa,color_vertex:Ha,common:qa,cube_uv_reflection_fragment:Xa,defaultnormal_vertex:Ya,displacementmap_pars_vertex:ja,displacementmap_vertex:Za,emissivemap_fragment:$a,emissivemap_pars_fragment:Ka,encodings_fragment:Ja,encodings_pars_fragment:Qa,envmap_fragment:eo,envmap_common_pars_fragment:to,envmap_pars_fragment:no,envmap_pars_vertex:io,envmap_physical_pars_fragment:go,envmap_vertex:ro,fog_vertex:so,fog_pars_vertex:ao,fog_fragment:oo,fog_pars_fragment:lo,gradientmap_pars_fragment:co,lightmap_fragment:uo,lightmap_pars_fragment:ho,lights_lambert_fragment:fo,lights_lambert_pars_fragment:po,lights_pars_begin:mo,lights_toon_fragment:_o,lights_toon_pars_fragment:xo,lights_phong_fragment:vo,lights_phong_pars_fragment:yo,lights_physical_fragment:Mo,lights_physical_pars_fragment:So,lights_fragment_begin:bo,lights_fragment_maps:wo,lights_fragment_end:To,logdepthbuf_fragment:Eo,logdepthbuf_pars_fragment:Ao,logdepthbuf_pars_vertex:Co,logdepthbuf_vertex:Lo,map_fragment:Ro,map_pars_fragment:Do,map_particle_fragment:Po,map_particle_pars_fragment:Io,metalnessmap_fragment:Fo,metalnessmap_pars_fragment:No,morphcolor_vertex:Uo,morphnormal_vertex:Bo,morphtarget_pars_vertex:Oo,morphtarget_vertex:zo,normal_fragment_begin:Go,normal_fragment_maps:ko,normal_pars_fragment:Vo,normal_pars_vertex:Wo,normal_vertex:Ho,normalmap_pars_fragment:qo,clearcoat_normal_fragment_begin:Xo,clearcoat_normal_fragment_maps:Yo,clearcoat_pars_fragment:jo,iridescence_pars_fragment:Zo,output_fragment:$o,packing:Ko,premultiplied_alpha_fragment:Jo,project_vertex:Qo,dithering_fragment:el,dithering_pars_fragment:tl,roughnessmap_fragment:nl,roughnessmap_pars_fragment:il,shadowmap_pars_fragment:rl,shadowmap_pars_vertex:sl,shadowmap_vertex:al,shadowmask_pars_fragment:ol,skinbase_vertex:ll,skinning_pars_vertex:cl,skinning_vertex:ul,skinnormal_vertex:hl,specularmap_fragment:dl,specularmap_pars_fragment:fl,tonemapping_fragment:pl,tonemapping_pars_fragment:ml,transmission_fragment:gl,transmission_pars_fragment:_l,uv_pars_fragment:xl,uv_pars_vertex:vl,uv_vertex:yl,uv2_pars_fragment:Ml,uv2_pars_vertex:Sl,uv2_vertex:bl,worldpos_vertex:wl,background_vert:Tl,background_frag:El,backgroundCube_vert:Al,backgroundCube_frag:Cl,cube_vert:Ll,cube_frag:Rl,depth_vert:Dl,depth_frag:Pl,distanceRGBA_vert:Il,distanceRGBA_frag:Fl,equirect_vert:Nl,equirect_frag:Ul,linedashed_vert:Bl,linedashed_frag:Ol,meshbasic_vert:zl,meshbasic_frag:Gl,meshlambert_vert:kl,meshlambert_frag:Vl,meshmatcap_vert:Wl,meshmatcap_frag:Hl,meshnormal_vert:ql,meshnormal_frag:Xl,meshphong_vert:Yl,meshphong_frag:jl,meshphysical_vert:Zl,meshphysical_frag:$l,meshtoon_vert:Kl,meshtoon_frag:Jl,points_vert:Ql,points_frag:ec,shadow_vert:tc,shadow_frag:nc,sprite_vert:ic,sprite_frag:rc},pe={common:{diffuse:{value:new et(16777215)},opacity:{value:1},map:{value:null},uvTransform:{value:new Ut},uv2Transform:{value:new Ut},alphaMap:{value:null},alphaTest:{value:0}},specularmap:{specularMap:{value:null}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1}},emissivemap:{emissiveMap:{value:null}},bumpmap:{bumpMap:{value:null},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalScale:{value:new je(1,1)}},displacementmap:{displacementMap:{value:null},displacementScale:{value:1},displacementBias:{value:0}},roughnessmap:{roughnessMap:{value:null}},metalnessmap:{metalnessMap:{value:null}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new et(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new et(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaTest:{value:0},uvTransform:{value:new Ut}},sprite:{diffuse:{value:new et(16777215)},opacity:{value:1},center:{value:new je(.5,.5)},rotation:{value:0},map:{value:null},alphaMap:{value:null},alphaTest:{value:0},uvTransform:{value:new Ut}}},Zt={basic:{uniforms:At([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.fog]),vertexShader:Ve.meshbasic_vert,fragmentShader:Ve.meshbasic_frag},lambert:{uniforms:At([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,pe.lights,{emissive:{value:new et(0)}}]),vertexShader:Ve.meshlambert_vert,fragmentShader:Ve.meshlambert_frag},phong:{uniforms:At([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,pe.lights,{emissive:{value:new et(0)},specular:{value:new et(1118481)},shininess:{value:30}}]),vertexShader:Ve.meshphong_vert,fragmentShader:Ve.meshphong_frag},standard:{uniforms:At([pe.common,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.roughnessmap,pe.metalnessmap,pe.fog,pe.lights,{emissive:{value:new et(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag},toon:{uniforms:At([pe.common,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.gradientmap,pe.fog,pe.lights,{emissive:{value:new et(0)}}]),vertexShader:Ve.meshtoon_vert,fragmentShader:Ve.meshtoon_frag},matcap:{uniforms:At([pe.common,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,{matcap:{value:null}}]),vertexShader:Ve.meshmatcap_vert,fragmentShader:Ve.meshmatcap_frag},points:{uniforms:At([pe.points,pe.fog]),vertexShader:Ve.points_vert,fragmentShader:Ve.points_frag},dashed:{uniforms:At([pe.common,pe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ve.linedashed_vert,fragmentShader:Ve.linedashed_frag},depth:{uniforms:At([pe.common,pe.displacementmap]),vertexShader:Ve.depth_vert,fragmentShader:Ve.depth_frag},normal:{uniforms:At([pe.common,pe.bumpmap,pe.normalmap,pe.displacementmap,{opacity:{value:1}}]),vertexShader:Ve.meshnormal_vert,fragmentShader:Ve.meshnormal_frag},sprite:{uniforms:At([pe.sprite,pe.fog]),vertexShader:Ve.sprite_vert,fragmentShader:Ve.sprite_frag},background:{uniforms:{uvTransform:{value:new Ut},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ve.background_vert,fragmentShader:Ve.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:Ve.backgroundCube_vert,fragmentShader:Ve.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ve.cube_vert,fragmentShader:Ve.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ve.equirect_vert,fragmentShader:Ve.equirect_frag},distanceRGBA:{uniforms:At([pe.common,pe.displacementmap,{referencePosition:{value:new G},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ve.distanceRGBA_vert,fragmentShader:Ve.distanceRGBA_frag},shadow:{uniforms:At([pe.lights,pe.fog,{color:{value:new et(0)},opacity:{value:1}}]),vertexShader:Ve.shadow_vert,fragmentShader:Ve.shadow_frag}};Zt.physical={uniforms:At([Zt.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatNormalScale:{value:new je(1,1)},clearcoatNormalMap:{value:null},iridescence:{value:0},iridescenceMap:{value:null},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},sheen:{value:0},sheenColor:{value:new et(0)},sheenColorMap:{value:null},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},transmission:{value:0},transmissionMap:{value:null},transmissionSamplerSize:{value:new je},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},attenuationDistance:{value:0},attenuationColor:{value:new et(0)},specularIntensity:{value:1},specularIntensityMap:{value:null},specularColor:{value:new et(1,1,1)},specularColorMap:{value:null}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag};const Ni={r:0,b:0,g:0};function sc(s,e,t,n,i,r,o){const a=new et(0);let c=r===!0?0:1,l,u,f=null,d=0,g=null;function M(h,y){let A=!1,p=y.isScene===!0?y.background:null;p&&p.isTexture&&(p=(y.backgroundBlurriness>0?t:e).get(p));const b=s.xr,w=b.getSession&&b.getSession();w&&w.environmentBlendMode==="additive"&&(p=null),p===null?m(a,c):p&&p.isColor&&(m(p,1),A=!0),(s.autoClear||A)&&s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil),p&&(p.isCubeTexture||p.mapping===306)?(u===void 0&&(u=new tt(new gi(1,1,1),new Tn({name:"BackgroundCubeMaterial",uniforms:qn(Zt.backgroundCube.uniforms),vertexShader:Zt.backgroundCube.vertexShader,fragmentShader:Zt.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(D,O,v){this.matrixWorld.copyPosition(v.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(u)),u.material.uniforms.envMap.value=p,u.material.uniforms.flipEnvMap.value=p.isCubeTexture&&p.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,u.material.toneMapped=p.encoding!==3001,(f!==p||d!==p.version||g!==s.toneMapping)&&(u.material.needsUpdate=!0,f=p,d=p.version,g=s.toneMapping),u.layers.enableAll(),h.unshift(u,u.geometry,u.material,0,0,null)):p&&p.isTexture&&(l===void 0&&(l=new tt(new fi(2,2),new Tn({name:"BackgroundMaterial",uniforms:qn(Zt.background.uniforms),vertexShader:Zt.background.vertexShader,fragmentShader:Zt.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=p,l.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,l.material.toneMapped=p.encoding!==3001,p.matrixAutoUpdate===!0&&p.updateMatrix(),l.material.uniforms.uvTransform.value.copy(p.matrix),(f!==p||d!==p.version||g!==s.toneMapping)&&(l.material.needsUpdate=!0,f=p,d=p.version,g=s.toneMapping),l.layers.enableAll(),h.unshift(l,l.geometry,l.material,0,0,null))}function m(h,y){h.getRGB(Ni,Is(s)),n.buffers.color.setClear(Ni.r,Ni.g,Ni.b,y,o)}return{getClearColor:function(){return a},setClearColor:function(h,y=1){a.set(h),c=y,m(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(h){c=h,m(a,c)},render:M}}function ac(s,e,t,n){const i=s.getParameter(34921),r=n.isWebGL2?null:e.get("OES_vertex_array_object"),o=n.isWebGL2||r!==null,a={},c=h(null);let l=c,u=!1;function f(F,Y,te,ne,J){let ue=!1;if(o){const oe=m(ne,te,Y);l!==oe&&(l=oe,g(l.object)),ue=y(F,ne,te,J),ue&&A(F,ne,te,J)}else{const oe=Y.wireframe===!0;(l.geometry!==ne.id||l.program!==te.id||l.wireframe!==oe)&&(l.geometry=ne.id,l.program=te.id,l.wireframe=oe,ue=!0)}J!==null&&t.update(J,34963),(ue||u)&&(u=!1,v(F,Y,te,ne),J!==null&&s.bindBuffer(34963,t.get(J).buffer))}function d(){return n.isWebGL2?s.createVertexArray():r.createVertexArrayOES()}function g(F){return n.isWebGL2?s.bindVertexArray(F):r.bindVertexArrayOES(F)}function M(F){return n.isWebGL2?s.deleteVertexArray(F):r.deleteVertexArrayOES(F)}function m(F,Y,te){const ne=te.wireframe===!0;let J=a[F.id];J===void 0&&(J={},a[F.id]=J);let ue=J[Y.id];ue===void 0&&(ue={},J[Y.id]=ue);let oe=ue[ne];return oe===void 0&&(oe=h(d()),ue[ne]=oe),oe}function h(F){const Y=[],te=[],ne=[];for(let J=0;J<i;J++)Y[J]=0,te[J]=0,ne[J]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:Y,enabledAttributes:te,attributeDivisors:ne,object:F,attributes:{},index:null}}function y(F,Y,te,ne){const J=l.attributes,ue=Y.attributes;let oe=0;const ve=te.getAttributes();for(const W in ve)if(ve[W].location>=0){const de=J[W];let me=ue[W];if(me===void 0&&(W==="instanceMatrix"&&F.instanceMatrix&&(me=F.instanceMatrix),W==="instanceColor"&&F.instanceColor&&(me=F.instanceColor)),de===void 0||de.attribute!==me||me&&de.data!==me.data)return!0;oe++}return l.attributesNum!==oe||l.index!==ne}function A(F,Y,te,ne){const J={},ue=Y.attributes;let oe=0;const ve=te.getAttributes();for(const W in ve)if(ve[W].location>=0){let de=ue[W];de===void 0&&(W==="instanceMatrix"&&F.instanceMatrix&&(de=F.instanceMatrix),W==="instanceColor"&&F.instanceColor&&(de=F.instanceColor));const me={};me.attribute=de,de&&de.data&&(me.data=de.data),J[W]=me,oe++}l.attributes=J,l.attributesNum=oe,l.index=ne}function p(){const F=l.newAttributes;for(let Y=0,te=F.length;Y<te;Y++)F[Y]=0}function b(F){w(F,0)}function w(F,Y){const te=l.newAttributes,ne=l.enabledAttributes,J=l.attributeDivisors;te[F]=1,ne[F]===0&&(s.enableVertexAttribArray(F),ne[F]=1),J[F]!==Y&&((n.isWebGL2?s:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](F,Y),J[F]=Y)}function D(){const F=l.newAttributes,Y=l.enabledAttributes;for(let te=0,ne=Y.length;te<ne;te++)Y[te]!==F[te]&&(s.disableVertexAttribArray(te),Y[te]=0)}function O(F,Y,te,ne,J,ue){n.isWebGL2===!0&&(te===5124||te===5125)?s.vertexAttribIPointer(F,Y,te,J,ue):s.vertexAttribPointer(F,Y,te,ne,J,ue)}function v(F,Y,te,ne){if(n.isWebGL2===!1&&(F.isInstancedMesh||ne.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;p();const J=ne.attributes,ue=te.getAttributes(),oe=Y.defaultAttributeValues;for(const ve in ue){const W=ue[ve];if(W.location>=0){let Q=J[ve];if(Q===void 0&&(ve==="instanceMatrix"&&F.instanceMatrix&&(Q=F.instanceMatrix),ve==="instanceColor"&&F.instanceColor&&(Q=F.instanceColor)),Q!==void 0){const de=Q.normalized,me=Q.itemSize,H=t.get(Q);if(H===void 0)continue;const Ne=H.buffer,be=H.type,Te=H.bytesPerElement;if(Q.isInterleavedBufferAttribute){const ye=Q.data,Je=ye.stride,Be=Q.offset;if(ye.isInstancedInterleavedBuffer){for(let Pe=0;Pe<W.locationSize;Pe++)w(W.location+Pe,ye.meshPerAttribute);F.isInstancedMesh!==!0&&ne._maxInstanceCount===void 0&&(ne._maxInstanceCount=ye.meshPerAttribute*ye.count)}else for(let Pe=0;Pe<W.locationSize;Pe++)b(W.location+Pe);s.bindBuffer(34962,Ne);for(let Pe=0;Pe<W.locationSize;Pe++)O(W.location+Pe,me/W.locationSize,be,de,Je*Te,(Be+me/W.locationSize*Pe)*Te)}else{if(Q.isInstancedBufferAttribute){for(let ye=0;ye<W.locationSize;ye++)w(W.location+ye,Q.meshPerAttribute);F.isInstancedMesh!==!0&&ne._maxInstanceCount===void 0&&(ne._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let ye=0;ye<W.locationSize;ye++)b(W.location+ye);s.bindBuffer(34962,Ne);for(let ye=0;ye<W.locationSize;ye++)O(W.location+ye,me/W.locationSize,be,de,me*Te,me/W.locationSize*ye*Te)}}else if(oe!==void 0){const de=oe[ve];if(de!==void 0)switch(de.length){case 2:s.vertexAttrib2fv(W.location,de);break;case 3:s.vertexAttrib3fv(W.location,de);break;case 4:s.vertexAttrib4fv(W.location,de);break;default:s.vertexAttrib1fv(W.location,de)}}}}D()}function L(){K();for(const F in a){const Y=a[F];for(const te in Y){const ne=Y[te];for(const J in ne)M(ne[J].object),delete ne[J];delete Y[te]}delete a[F]}}function B(F){if(a[F.id]===void 0)return;const Y=a[F.id];for(const te in Y){const ne=Y[te];for(const J in ne)M(ne[J].object),delete ne[J];delete Y[te]}delete a[F.id]}function $(F){for(const Y in a){const te=a[Y];if(te[F.id]===void 0)continue;const ne=te[F.id];for(const J in ne)M(ne[J].object),delete ne[J];delete te[F.id]}}function K(){z(),u=!0,l!==c&&(l=c,g(l.object))}function z(){c.geometry=null,c.program=null,c.wireframe=!1}return{setup:f,reset:K,resetDefaultState:z,dispose:L,releaseStatesOfGeometry:B,releaseStatesOfProgram:$,initAttributes:p,enableAttribute:b,disableUnusedAttributes:D}}function oc(s,e,t,n){const i=n.isWebGL2;let r;function o(l){r=l}function a(l,u){s.drawArrays(r,l,u),t.update(u,r,1)}function c(l,u,f){if(f===0)return;let d,g;if(i)d=s,g="drawArraysInstanced";else if(d=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",d===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}d[g](r,l,u,f),t.update(u,r,f)}this.setMode=o,this.render=a,this.renderInstances=c}function lc(s,e,t){let n;function i(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){const O=e.get("EXT_texture_filter_anisotropic");n=s.getParameter(O.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function r(O){if(O==="highp"){if(s.getShaderPrecisionFormat(35633,36338).precision>0&&s.getShaderPrecisionFormat(35632,36338).precision>0)return"highp";O="mediump"}return O==="mediump"&&s.getShaderPrecisionFormat(35633,36337).precision>0&&s.getShaderPrecisionFormat(35632,36337).precision>0?"mediump":"lowp"}const o=typeof WebGL2RenderingContext<"u"&&s instanceof WebGL2RenderingContext;let a=t.precision!==void 0?t.precision:"highp";const c=r(a);c!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",c,"instead."),a=c);const l=o||e.has("WEBGL_draw_buffers"),u=t.logarithmicDepthBuffer===!0,f=s.getParameter(34930),d=s.getParameter(35660),g=s.getParameter(3379),M=s.getParameter(34076),m=s.getParameter(34921),h=s.getParameter(36347),y=s.getParameter(36348),A=s.getParameter(36349),p=d>0,b=o||e.has("OES_texture_float"),w=p&&b,D=o?s.getParameter(36183):0;return{isWebGL2:o,drawBuffers:l,getMaxAnisotropy:i,getMaxPrecision:r,precision:a,logarithmicDepthBuffer:u,maxTextures:f,maxVertexTextures:d,maxTextureSize:g,maxCubemapSize:M,maxAttributes:m,maxVertexUniforms:h,maxVaryings:y,maxFragmentUniforms:A,vertexTextures:p,floatFragmentTextures:b,floatVertexTextures:w,maxSamples:D}}function cc(s){const e=this;let t=null,n=0,i=!1,r=!1;const o=new yn,a=new Ut,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,d){const g=f.length!==0||d||n!==0||i;return i=d,n=f.length,g},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,d){t=u(f,d,0)},this.setState=function(f,d,g){const M=f.clippingPlanes,m=f.clipIntersection,h=f.clipShadows,y=s.get(f);if(!i||M===null||M.length===0||r&&!h)r?u(null):l();else{const A=r?0:n,p=A*4;let b=y.clippingState||null;c.value=b,b=u(M,d,p,g);for(let w=0;w!==p;++w)b[w]=t[w];y.clippingState=b,this.numIntersection=m?this.numPlanes:0,this.numPlanes+=A}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(f,d,g,M){const m=f!==null?f.length:0;let h=null;if(m!==0){if(h=c.value,M!==!0||h===null){const y=g+m*4,A=d.matrixWorldInverse;a.getNormalMatrix(A),(h===null||h.length<y)&&(h=new Float32Array(y));for(let p=0,b=g;p!==m;++p,b+=4)o.copy(f[p]).applyMatrix4(A,a),o.normal.toArray(h,b),h[b+3]=o.constant}c.value=h,c.needsUpdate=!0}return e.numPlanes=m,e.numIntersection=0,h}}function uc(s){let e=new WeakMap;function t(o,a){return a===303?o.mapping=301:a===304&&(o.mapping=302),o}function n(o){if(o&&o.isTexture&&o.isRenderTargetTexture===!1){const a=o.mapping;if(a===303||a===304)if(e.has(o)){const c=e.get(o).texture;return t(c,o.mapping)}else{const c=o.image;if(c&&c.height>0){const l=new Sa(c.height/2);return l.fromEquirectangularTexture(s,o),e.set(o,l),o.addEventListener("dispose",i),t(l.texture,o.mapping)}else return null}}return o}function i(o){const a=o.target;a.removeEventListener("dispose",i);const c=e.get(a);c!==void 0&&(e.delete(a),c.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}class Cr extends Fs{constructor(e=-1,t=1,n=1,i=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let r=n-e,o=n+e,a=i+t,c=i-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=u*this.view.offsetY,c=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const Wn=4,jr=[.125,.215,.35,.446,.526,.582],Sn=20,_r=new Cr,Zr=new et;let xr=null;const Mn=(1+Math.sqrt(5))/2,kn=1/Mn,$r=[new G(1,1,1),new G(-1,1,1),new G(1,1,-1),new G(-1,1,-1),new G(0,Mn,kn),new G(0,Mn,-kn),new G(kn,0,Mn),new G(-kn,0,Mn),new G(Mn,kn,0),new G(-Mn,kn,0)];class Kr{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100){xr=this._renderer.getRenderTarget(),this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,i,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=es(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Qr(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(xr),e.scissorTest=!1,Ui(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),xr=this._renderer.getRenderTarget();const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:1006,minFilter:1006,generateMipmaps:!1,type:1016,format:1023,encoding:3e3,depthBuffer:!1},i=Jr(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Jr(e,t,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=hc(r)),this._blurMaterial=dc(r,e,t)}return i}_compileMaterial(e){const t=new tt(this._lodPlanes[0],e);this._renderer.compile(t,_r)}_sceneToCubeUV(e,t,n,i){const a=new qt(90,1,t,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,d=u.toneMapping;u.getClearColor(Zr),u.toneMapping=0,u.autoClear=!1;const g=new Vn({name:"PMREM.Background",side:1,depthWrite:!1,depthTest:!1}),M=new tt(new gi,g);let m=!1;const h=e.background;h?h.isColor&&(g.color.copy(h),e.background=null,m=!0):(g.color.copy(Zr),m=!0);for(let y=0;y<6;y++){const A=y%3;A===0?(a.up.set(0,c[y],0),a.lookAt(l[y],0,0)):A===1?(a.up.set(0,0,c[y]),a.lookAt(0,l[y],0)):(a.up.set(0,c[y],0),a.lookAt(0,0,l[y]));const p=this._cubeSize;Ui(i,A*p,y>2?p:0,p,p),u.setRenderTarget(i),m&&u.render(M,a),u.render(e,a)}M.geometry.dispose(),M.material.dispose(),u.toneMapping=d,u.autoClear=f,e.background=h}_textureToCubeUV(e,t){const n=this._renderer,i=e.mapping===301||e.mapping===302;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=es()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Qr());const r=i?this._cubemapMaterial:this._equirectMaterial,o=new tt(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;const c=this._cubeSize;Ui(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(o,_r)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;for(let i=1;i<this._lodPlanes.length;i++){const r=Math.sqrt(this._sigmas[i]*this._sigmas[i]-this._sigmas[i-1]*this._sigmas[i-1]),o=$r[(i-1)%$r.length];this._blur(e,i-1,i,r,o)}t.autoClear=n}_blur(e,t,n,i,r){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,i,"latitudinal",r),this._halfBlur(o,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,o,a){const c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,f=new tt(this._lodPlanes[i],l),d=l.uniforms,g=this._sizeLods[n]-1,M=isFinite(r)?Math.PI/(2*g):2*Math.PI/(2*Sn-1),m=r/M,h=isFinite(r)?1+Math.floor(u*m):Sn;h>Sn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${h} samples when the maximum is set to ${Sn}`);const y=[];let A=0;for(let O=0;O<Sn;++O){const v=O/m,L=Math.exp(-v*v/2);y.push(L),O===0?A+=L:O<h&&(A+=2*L)}for(let O=0;O<y.length;O++)y[O]=y[O]/A;d.envMap.value=e.texture,d.samples.value=h,d.weights.value=y,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:p}=this;d.dTheta.value=M,d.mipInt.value=p-n;const b=this._sizeLods[i],w=3*b*(i>p-Wn?i-p+Wn:0),D=4*(this._cubeSize-b);Ui(t,w,D,3*b,2*b),c.setRenderTarget(t),c.render(f,_r)}}function hc(s){const e=[],t=[],n=[];let i=s;const r=s-Wn+1+jr.length;for(let o=0;o<r;o++){const a=Math.pow(2,i);t.push(a);let c=1/a;o>s-Wn?c=jr[o-s+Wn-1]:o===0&&(c=0),n.push(c);const l=1/(a-2),u=-l,f=1+l,d=[u,u,f,u,f,f,u,u,f,f,u,f],g=6,M=6,m=3,h=2,y=1,A=new Float32Array(m*M*g),p=new Float32Array(h*M*g),b=new Float32Array(y*M*g);for(let D=0;D<g;D++){const O=D%3*2/3-1,v=D>2?0:-1,L=[O,v,0,O+2/3,v,0,O+2/3,v+1,0,O,v,0,O+2/3,v+1,0,O,v+1,0];A.set(L,m*M*D),p.set(d,h*M*D);const B=[D,D,D,D,D,D];b.set(B,y*M*D)}const w=new Bt;w.setAttribute("position",new $t(A,m)),w.setAttribute("uv",new $t(p,h)),w.setAttribute("faceIndex",new $t(b,y)),e.push(w),i>Wn&&i--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Jr(s,e,t){const n=new wn(s,e,t);return n.texture.mapping=306,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ui(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function dc(s,e,t){const n=new Float32Array(Sn),i=new G(0,1,0);return new Tn({name:"SphericalGaussianBlur",defines:{n:Sn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Lr(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function Qr(){return new Tn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Lr(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function es(){return new Tn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Lr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Lr(){return`

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
	`}function fc(s){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){const c=a.mapping,l=c===303||c===304,u=c===301||c===302;if(l||u)if(a.isRenderTargetTexture&&a.needsPMREMUpdate===!0){a.needsPMREMUpdate=!1;let f=e.get(a);return t===null&&(t=new Kr(s)),f=l?t.fromEquirectangular(a,f):t.fromCubemap(a,f),e.set(a,f),f.texture}else{if(e.has(a))return e.get(a).texture;{const f=a.image;if(l&&f&&f.height>0||u&&f&&i(f)){t===null&&(t=new Kr(s));const d=l?t.fromEquirectangular(a):t.fromCubemap(a);return e.set(a,d),a.addEventListener("dispose",r),d.texture}else return null}}}return a}function i(a){let c=0;const l=6;for(let u=0;u<l;u++)a[u]!==void 0&&c++;return c===l}function r(a){const c=a.target;c.removeEventListener("dispose",r);const l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function pc(s){const e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(n){n.isWebGL2?t("EXT_color_buffer_float"):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(n){const i=t(n);return i===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function mc(s,e,t,n){const i={},r=new WeakMap;function o(f){const d=f.target;d.index!==null&&e.remove(d.index);for(const M in d.attributes)e.remove(d.attributes[M]);d.removeEventListener("dispose",o),delete i[d.id];const g=r.get(d);g&&(e.remove(g),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(f,d){return i[d.id]===!0||(d.addEventListener("dispose",o),i[d.id]=!0,t.memory.geometries++),d}function c(f){const d=f.attributes;for(const M in d)e.update(d[M],34962);const g=f.morphAttributes;for(const M in g){const m=g[M];for(let h=0,y=m.length;h<y;h++)e.update(m[h],34962)}}function l(f){const d=[],g=f.index,M=f.attributes.position;let m=0;if(g!==null){const A=g.array;m=g.version;for(let p=0,b=A.length;p<b;p+=3){const w=A[p+0],D=A[p+1],O=A[p+2];d.push(w,D,D,O,O,w)}}else{const A=M.array;m=M.version;for(let p=0,b=A.length/3-1;p<b;p+=3){const w=p+0,D=p+1,O=p+2;d.push(w,D,D,O,O,w)}}const h=new(ws(d)?Ps:Ds)(d,1);h.version=m;const y=r.get(f);y&&e.remove(y),r.set(f,h)}function u(f){const d=r.get(f);if(d){const g=f.index;g!==null&&d.version<g.version&&l(f)}else l(f);return r.get(f)}return{get:a,update:c,getWireframeAttribute:u}}function gc(s,e,t,n){const i=n.isWebGL2;let r;function o(d){r=d}let a,c;function l(d){a=d.type,c=d.bytesPerElement}function u(d,g){s.drawElements(r,g,a,d*c),t.update(g,r,1)}function f(d,g,M){if(M===0)return;let m,h;if(i)m=s,h="drawElementsInstanced";else if(m=e.get("ANGLE_instanced_arrays"),h="drawElementsInstancedANGLE",m===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[h](r,g,a,d*c,M),t.update(g,r,M)}this.setMode=o,this.setIndex=l,this.render=u,this.renderInstances=f}function _c(s){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case 4:t.triangles+=a*(r/3);break;case 1:t.lines+=a*(r/2);break;case 3:t.lines+=a*(r-1);break;case 2:t.lines+=a*r;break;case 0:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){t.frame++,t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function xc(s,e){return s[0]-e[0]}function vc(s,e){return Math.abs(e[1])-Math.abs(s[1])}function yc(s,e,t){const n={},i=new Float32Array(8),r=new WeakMap,o=new Mt,a=[];for(let l=0;l<8;l++)a[l]=[l,0];function c(l,u,f,d){const g=l.morphTargetInfluences;if(e.isWebGL2===!0){const m=u.morphAttributes.position||u.morphAttributes.normal||u.morphAttributes.color,h=m!==void 0?m.length:0;let y=r.get(u);if(y===void 0||y.count!==h){let te=function(){F.dispose(),r.delete(u),u.removeEventListener("dispose",te)};var M=te;y!==void 0&&y.texture.dispose();const b=u.morphAttributes.position!==void 0,w=u.morphAttributes.normal!==void 0,D=u.morphAttributes.color!==void 0,O=u.morphAttributes.position||[],v=u.morphAttributes.normal||[],L=u.morphAttributes.color||[];let B=0;b===!0&&(B=1),w===!0&&(B=2),D===!0&&(B=3);let $=u.attributes.position.count*B,K=1;$>e.maxTextureSize&&(K=Math.ceil($/e.maxTextureSize),$=e.maxTextureSize);const z=new Float32Array($*K*4*h),F=new Cs(z,$,K,h);F.type=1015,F.needsUpdate=!0;const Y=B*4;for(let ne=0;ne<h;ne++){const J=O[ne],ue=v[ne],oe=L[ne],ve=$*K*4*ne;for(let W=0;W<J.count;W++){const Q=W*Y;b===!0&&(o.fromBufferAttribute(J,W),z[ve+Q+0]=o.x,z[ve+Q+1]=o.y,z[ve+Q+2]=o.z,z[ve+Q+3]=0),w===!0&&(o.fromBufferAttribute(ue,W),z[ve+Q+4]=o.x,z[ve+Q+5]=o.y,z[ve+Q+6]=o.z,z[ve+Q+7]=0),D===!0&&(o.fromBufferAttribute(oe,W),z[ve+Q+8]=o.x,z[ve+Q+9]=o.y,z[ve+Q+10]=o.z,z[ve+Q+11]=oe.itemSize===4?o.w:1)}}y={count:h,texture:F,size:new je($,K)},r.set(u,y),u.addEventListener("dispose",te)}let A=0;for(let b=0;b<g.length;b++)A+=g[b];const p=u.morphTargetsRelative?1:1-A;d.getUniforms().setValue(s,"morphTargetBaseInfluence",p),d.getUniforms().setValue(s,"morphTargetInfluences",g),d.getUniforms().setValue(s,"morphTargetsTexture",y.texture,t),d.getUniforms().setValue(s,"morphTargetsTextureSize",y.size)}else{const m=g===void 0?0:g.length;let h=n[u.id];if(h===void 0||h.length!==m){h=[];for(let w=0;w<m;w++)h[w]=[w,0];n[u.id]=h}for(let w=0;w<m;w++){const D=h[w];D[0]=w,D[1]=g[w]}h.sort(vc);for(let w=0;w<8;w++)w<m&&h[w][1]?(a[w][0]=h[w][0],a[w][1]=h[w][1]):(a[w][0]=Number.MAX_SAFE_INTEGER,a[w][1]=0);a.sort(xc);const y=u.morphAttributes.position,A=u.morphAttributes.normal;let p=0;for(let w=0;w<8;w++){const D=a[w],O=D[0],v=D[1];O!==Number.MAX_SAFE_INTEGER&&v?(y&&u.getAttribute("morphTarget"+w)!==y[O]&&u.setAttribute("morphTarget"+w,y[O]),A&&u.getAttribute("morphNormal"+w)!==A[O]&&u.setAttribute("morphNormal"+w,A[O]),i[w]=v,p+=v):(y&&u.hasAttribute("morphTarget"+w)===!0&&u.deleteAttribute("morphTarget"+w),A&&u.hasAttribute("morphNormal"+w)===!0&&u.deleteAttribute("morphNormal"+w),i[w]=0)}const b=u.morphTargetsRelative?1:1-p;d.getUniforms().setValue(s,"morphTargetBaseInfluence",b),d.getUniforms().setValue(s,"morphTargetInfluences",i)}}return{update:c}}function Mc(s,e,t,n){let i=new WeakMap;function r(c){const l=n.render.frame,u=c.geometry,f=e.get(c,u);return i.get(f)!==l&&(e.update(f),i.set(f,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),t.update(c.instanceMatrix,34962),c.instanceColor!==null&&t.update(c.instanceColor,34962)),f}function o(){i=new WeakMap}function a(c){const l=c.target;l.removeEventListener("dispose",a),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:r,dispose:o}}const Bs=new Pt,Os=new Cs,zs=new aa,Gs=new Ns,ts=[],ns=[],is=new Float32Array(16),rs=new Float32Array(9),ss=new Float32Array(4);function Zn(s,e,t){const n=s[0];if(n<=0||n>0)return s;const i=e*t;let r=ts[i];if(r===void 0&&(r=new Float32Array(i),ts[i]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,s[o].toArray(r,a)}return r}function _t(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function xt(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function Xi(s,e){let t=ns[e];t===void 0&&(t=new Int32Array(e),ns[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function Sc(s,e){const t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function bc(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;s.uniform2fv(this.addr,e),xt(t,e)}}function wc(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(_t(t,e))return;s.uniform3fv(this.addr,e),xt(t,e)}}function Tc(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;s.uniform4fv(this.addr,e),xt(t,e)}}function Ec(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),xt(t,e)}else{if(_t(t,n))return;ss.set(n),s.uniformMatrix2fv(this.addr,!1,ss),xt(t,n)}}function Ac(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),xt(t,e)}else{if(_t(t,n))return;rs.set(n),s.uniformMatrix3fv(this.addr,!1,rs),xt(t,n)}}function Cc(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),xt(t,e)}else{if(_t(t,n))return;is.set(n),s.uniformMatrix4fv(this.addr,!1,is),xt(t,n)}}function Lc(s,e){const t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function Rc(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;s.uniform2iv(this.addr,e),xt(t,e)}}function Dc(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(_t(t,e))return;s.uniform3iv(this.addr,e),xt(t,e)}}function Pc(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;s.uniform4iv(this.addr,e),xt(t,e)}}function Ic(s,e){const t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function Fc(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;s.uniform2uiv(this.addr,e),xt(t,e)}}function Nc(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(_t(t,e))return;s.uniform3uiv(this.addr,e),xt(t,e)}}function Uc(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;s.uniform4uiv(this.addr,e),xt(t,e)}}function Bc(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2D(e||Bs,i)}function Oc(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||zs,i)}function zc(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||Gs,i)}function Gc(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||Os,i)}function kc(s){switch(s){case 5126:return Sc;case 35664:return bc;case 35665:return wc;case 35666:return Tc;case 35674:return Ec;case 35675:return Ac;case 35676:return Cc;case 5124:case 35670:return Lc;case 35667:case 35671:return Rc;case 35668:case 35672:return Dc;case 35669:case 35673:return Pc;case 5125:return Ic;case 36294:return Fc;case 36295:return Nc;case 36296:return Uc;case 35678:case 36198:case 36298:case 36306:case 35682:return Bc;case 35679:case 36299:case 36307:return Oc;case 35680:case 36300:case 36308:case 36293:return zc;case 36289:case 36303:case 36311:case 36292:return Gc}}function Vc(s,e){s.uniform1fv(this.addr,e)}function Wc(s,e){const t=Zn(e,this.size,2);s.uniform2fv(this.addr,t)}function Hc(s,e){const t=Zn(e,this.size,3);s.uniform3fv(this.addr,t)}function qc(s,e){const t=Zn(e,this.size,4);s.uniform4fv(this.addr,t)}function Xc(s,e){const t=Zn(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function Yc(s,e){const t=Zn(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function jc(s,e){const t=Zn(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function Zc(s,e){s.uniform1iv(this.addr,e)}function $c(s,e){s.uniform2iv(this.addr,e)}function Kc(s,e){s.uniform3iv(this.addr,e)}function Jc(s,e){s.uniform4iv(this.addr,e)}function Qc(s,e){s.uniform1uiv(this.addr,e)}function eu(s,e){s.uniform2uiv(this.addr,e)}function tu(s,e){s.uniform3uiv(this.addr,e)}function nu(s,e){s.uniform4uiv(this.addr,e)}function iu(s,e,t){const n=this.cache,i=e.length,r=Xi(t,i);_t(n,r)||(s.uniform1iv(this.addr,r),xt(n,r));for(let o=0;o!==i;++o)t.setTexture2D(e[o]||Bs,r[o])}function ru(s,e,t){const n=this.cache,i=e.length,r=Xi(t,i);_t(n,r)||(s.uniform1iv(this.addr,r),xt(n,r));for(let o=0;o!==i;++o)t.setTexture3D(e[o]||zs,r[o])}function su(s,e,t){const n=this.cache,i=e.length,r=Xi(t,i);_t(n,r)||(s.uniform1iv(this.addr,r),xt(n,r));for(let o=0;o!==i;++o)t.setTextureCube(e[o]||Gs,r[o])}function au(s,e,t){const n=this.cache,i=e.length,r=Xi(t,i);_t(n,r)||(s.uniform1iv(this.addr,r),xt(n,r));for(let o=0;o!==i;++o)t.setTexture2DArray(e[o]||Os,r[o])}function ou(s){switch(s){case 5126:return Vc;case 35664:return Wc;case 35665:return Hc;case 35666:return qc;case 35674:return Xc;case 35675:return Yc;case 35676:return jc;case 5124:case 35670:return Zc;case 35667:case 35671:return $c;case 35668:case 35672:return Kc;case 35669:case 35673:return Jc;case 5125:return Qc;case 36294:return eu;case 36295:return tu;case 36296:return nu;case 35678:case 36198:case 36298:case 36306:case 35682:return iu;case 35679:case 36299:case 36307:return ru;case 35680:case 36300:case 36308:case 36293:return su;case 36289:case 36303:case 36311:case 36292:return au}}class lu{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.setValue=kc(t.type)}}class cu{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.size=t.size,this.setValue=ou(t.type)}}class uu{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const i=this.seq;for(let r=0,o=i.length;r!==o;++r){const a=i[r];a.setValue(e,t[a.id],n)}}}const vr=/(\w+)(\])?(\[|\.)?/g;function as(s,e){s.seq.push(e),s.map[e.id]=e}function hu(s,e,t){const n=s.name,i=n.length;for(vr.lastIndex=0;;){const r=vr.exec(n),o=vr.lastIndex;let a=r[1];const c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===i){as(t,l===void 0?new lu(a,s,e):new cu(a,s,e));break}else{let f=t.map[a];f===void 0&&(f=new uu(a),as(t,f)),t=f}}}class zi{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,35718);for(let i=0;i<n;++i){const r=e.getActiveUniform(t,i),o=e.getUniformLocation(t,r.name);hu(r,o,this)}}setValue(e,t,n,i){const r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){const i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,o=t.length;r!==o;++r){const a=t[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,i)}}static seqWithValue(e,t){const n=[];for(let i=0,r=e.length;i!==r;++i){const o=e[i];o.id in t&&n.push(o)}return n}}function os(s,e,t){const n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}let du=0;function fu(s,e){const t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=i;o<r;o++){const a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}function pu(s){switch(s){case 3e3:return["Linear","( value )"];case 3001:return["sRGB","( value )"];default:return console.warn("THREE.WebGLProgram: Unsupported encoding:",s),["Linear","( value )"]}}function ls(s,e,t){const n=s.getShaderParameter(e,35713),i=s.getShaderInfoLog(e).trim();if(n&&i==="")return"";const r=/ERROR: 0:(\d+)/.exec(i);if(r){const o=parseInt(r[1]);return t.toUpperCase()+`

`+i+`

`+fu(s.getShaderSource(e),o)}else return i}function mu(s,e){const t=pu(e);return"vec4 "+s+"( vec4 value ) { return LinearTo"+t[0]+t[1]+"; }"}function gu(s,e){let t;switch(e){case 1:t="Linear";break;case 2:t="Reinhard";break;case 3:t="OptimizedCineon";break;case 4:t="ACESFilmic";break;case 5:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function _u(s){return[s.extensionDerivatives||s.envMapCubeUVHeight||s.bumpMap||s.tangentSpaceNormalMap||s.clearcoatNormalMap||s.flatShading||s.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(s.extensionFragDepth||s.logarithmicDepthBuffer)&&s.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",s.extensionDrawBuffers&&s.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(s.extensionShaderTextureLOD||s.envMap||s.transmission)&&s.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(li).join(`
`)}function xu(s){const e=[];for(const t in s){const n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function vu(s,e){const t={},n=s.getProgramParameter(e,35721);for(let i=0;i<n;i++){const r=s.getActiveAttrib(e,i),o=r.name;let a=1;r.type===35674&&(a=2),r.type===35675&&(a=3),r.type===35676&&(a=4),t[o]={type:r.type,location:s.getAttribLocation(e,o),locationSize:a}}return t}function li(s){return s!==""}function cs(s,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function us(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const yu=/^[ \t]*#include +<([\w\d./]+)>/gm;function Tr(s){return s.replace(yu,Mu)}function Mu(s,e){const t=Ve[e];if(t===void 0)throw new Error("Can not resolve #include <"+e+">");return Tr(t)}const Su=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function hs(s){return s.replace(Su,bu)}function bu(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function ds(s){let e="precision "+s.precision+` float;
precision `+s.precision+" int;";return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function wu(s){let e="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===1?e="SHADOWMAP_TYPE_PCF":s.shadowMapType===2?e="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===3&&(e="SHADOWMAP_TYPE_VSM"),e}function Tu(s){let e="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case 301:case 302:e="ENVMAP_TYPE_CUBE";break;case 306:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Eu(s){let e="ENVMAP_MODE_REFLECTION";if(s.envMap)switch(s.envMapMode){case 302:e="ENVMAP_MODE_REFRACTION";break}return e}function Au(s){let e="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case 0:e="ENVMAP_BLENDING_MULTIPLY";break;case 1:e="ENVMAP_BLENDING_MIX";break;case 2:e="ENVMAP_BLENDING_ADD";break}return e}function Cu(s){const e=s.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Lu(s,e,t,n){const i=s.getContext(),r=t.defines;let o=t.vertexShader,a=t.fragmentShader;const c=wu(t),l=Tu(t),u=Eu(t),f=Au(t),d=Cu(t),g=t.isWebGL2?"":_u(t),M=xu(r),m=i.createProgram();let h,y,A=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(h=[M].filter(li).join(`
`),h.length>0&&(h+=`
`),y=[g,M].filter(li).join(`
`),y.length>0&&(y+=`
`)):(h=[ds(t),"#define SHADER_NAME "+t.shaderName,M,t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.supportsVertexTextures?"#define VERTEX_TEXTURES":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMap&&t.objectSpaceNormalMap?"#define OBJECTSPACE_NORMALMAP":"",t.normalMap&&t.tangentSpaceNormalMap?"#define TANGENTSPACE_NORMALMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.displacementMap&&t.supportsVertexTextures?"#define USE_DISPLACEMENTMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularIntensityMap?"#define USE_SPECULARINTENSITYMAP":"",t.specularColorMap?"#define USE_SPECULARCOLORMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEENCOLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEENROUGHNESSMAP":"",t.vertexTangents?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUvs?"#define USE_UV":"",t.uvsVertexOnly?"#define UVS_VERTEX_ONLY":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(li).join(`
`),y=[g,ds(t),"#define SHADER_NAME "+t.shaderName,M,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+u:"",t.envMap?"#define "+f:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMap&&t.objectSpaceNormalMap?"#define OBJECTSPACE_NORMALMAP":"",t.normalMap&&t.tangentSpaceNormalMap?"#define TANGENTSPACE_NORMALMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularIntensityMap?"#define USE_SPECULARINTENSITYMAP":"",t.specularColorMap?"#define USE_SPECULARCOLORMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEENCOLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEENROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.vertexTangents?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUvs?"#define USE_UV":"",t.uvsVertexOnly?"#define UVS_VERTEX_ONLY":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.physicallyCorrectLights?"#define PHYSICALLY_CORRECT_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==0?"#define TONE_MAPPING":"",t.toneMapping!==0?Ve.tonemapping_pars_fragment:"",t.toneMapping!==0?gu("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ve.encodings_pars_fragment,mu("linearToOutputTexel",t.outputEncoding),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(li).join(`
`)),o=Tr(o),o=cs(o,t),o=us(o,t),a=Tr(a),a=cs(a,t),a=us(a,t),o=hs(o),a=hs(a),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(A=`#version 300 es
`,h=["precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+h,y=["#define varying in",t.glslVersion===Ur?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Ur?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+y);const p=A+h+o,b=A+y+a,w=os(i,35633,p),D=os(i,35632,b);if(i.attachShader(m,w),i.attachShader(m,D),t.index0AttributeName!==void 0?i.bindAttribLocation(m,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(m,0,"position"),i.linkProgram(m),s.debug.checkShaderErrors){const L=i.getProgramInfoLog(m).trim(),B=i.getShaderInfoLog(w).trim(),$=i.getShaderInfoLog(D).trim();let K=!0,z=!0;if(i.getProgramParameter(m,35714)===!1){K=!1;const F=ls(i,w,"vertex"),Y=ls(i,D,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(m,35715)+`

Program Info Log: `+L+`
`+F+`
`+Y)}else L!==""?console.warn("THREE.WebGLProgram: Program Info Log:",L):(B===""||$==="")&&(z=!1);z&&(this.diagnostics={runnable:K,programLog:L,vertexShader:{log:B,prefix:h},fragmentShader:{log:$,prefix:y}})}i.deleteShader(w),i.deleteShader(D);let O;this.getUniforms=function(){return O===void 0&&(O=new zi(i,m)),O};let v;return this.getAttributes=function(){return v===void 0&&(v=vu(i,m)),v},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.name=t.shaderName,this.id=du++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=w,this.fragmentShader=D,this}let Ru=0;class Du{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new Pu(e),t.set(e,n)),n}}class Pu{constructor(e){this.id=Ru++,this.code=e,this.usedTimes=0}}function Iu(s,e,t,n,i,r,o){const a=new Rs,c=new Du,l=[],u=i.isWebGL2,f=i.logarithmicDepthBuffer,d=i.vertexTextures;let g=i.precision;const M={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(v,L,B,$,K){const z=$.fog,F=K.geometry,Y=v.isMeshStandardMaterial?$.environment:null,te=(v.isMeshStandardMaterial?t:e).get(v.envMap||Y),ne=te&&te.mapping===306?te.image.height:null,J=M[v.type];v.precision!==null&&(g=i.getMaxPrecision(v.precision),g!==v.precision&&console.warn("THREE.WebGLProgram.getParameters:",v.precision,"not supported, using",g,"instead."));const ue=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,oe=ue!==void 0?ue.length:0;let ve=0;F.morphAttributes.position!==void 0&&(ve=1),F.morphAttributes.normal!==void 0&&(ve=2),F.morphAttributes.color!==void 0&&(ve=3);let W,Q,de,me;if(J){const Je=Zt[J];W=Je.vertexShader,Q=Je.fragmentShader}else W=v.vertexShader,Q=v.fragmentShader,c.update(v),de=c.getVertexShaderID(v),me=c.getFragmentShaderID(v);const H=s.getRenderTarget(),Ne=v.alphaTest>0,be=v.clearcoat>0,Te=v.iridescence>0;return{isWebGL2:u,shaderID:J,shaderName:v.type,vertexShader:W,fragmentShader:Q,defines:v.defines,customVertexShaderID:de,customFragmentShaderID:me,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:g,instancing:K.isInstancedMesh===!0,instancingColor:K.isInstancedMesh===!0&&K.instanceColor!==null,supportsVertexTextures:d,outputEncoding:H===null?s.outputEncoding:H.isXRRenderTarget===!0?H.texture.encoding:3e3,map:!!v.map,matcap:!!v.matcap,envMap:!!te,envMapMode:te&&te.mapping,envMapCubeUVHeight:ne,lightMap:!!v.lightMap,aoMap:!!v.aoMap,emissiveMap:!!v.emissiveMap,bumpMap:!!v.bumpMap,normalMap:!!v.normalMap,objectSpaceNormalMap:v.normalMapType===1,tangentSpaceNormalMap:v.normalMapType===0,decodeVideoTexture:!!v.map&&v.map.isVideoTexture===!0&&v.map.encoding===3001,clearcoat:be,clearcoatMap:be&&!!v.clearcoatMap,clearcoatRoughnessMap:be&&!!v.clearcoatRoughnessMap,clearcoatNormalMap:be&&!!v.clearcoatNormalMap,iridescence:Te,iridescenceMap:Te&&!!v.iridescenceMap,iridescenceThicknessMap:Te&&!!v.iridescenceThicknessMap,displacementMap:!!v.displacementMap,roughnessMap:!!v.roughnessMap,metalnessMap:!!v.metalnessMap,specularMap:!!v.specularMap,specularIntensityMap:!!v.specularIntensityMap,specularColorMap:!!v.specularColorMap,opaque:v.transparent===!1&&v.blending===1,alphaMap:!!v.alphaMap,alphaTest:Ne,gradientMap:!!v.gradientMap,sheen:v.sheen>0,sheenColorMap:!!v.sheenColorMap,sheenRoughnessMap:!!v.sheenRoughnessMap,transmission:v.transmission>0,transmissionMap:!!v.transmissionMap,thicknessMap:!!v.thicknessMap,combine:v.combine,vertexTangents:!!v.normalMap&&!!F.attributes.tangent,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,vertexUvs:!!v.map||!!v.bumpMap||!!v.normalMap||!!v.specularMap||!!v.alphaMap||!!v.emissiveMap||!!v.roughnessMap||!!v.metalnessMap||!!v.clearcoatMap||!!v.clearcoatRoughnessMap||!!v.clearcoatNormalMap||!!v.iridescenceMap||!!v.iridescenceThicknessMap||!!v.displacementMap||!!v.transmissionMap||!!v.thicknessMap||!!v.specularIntensityMap||!!v.specularColorMap||!!v.sheenColorMap||!!v.sheenRoughnessMap,uvsVertexOnly:!(v.map||v.bumpMap||v.normalMap||v.specularMap||v.alphaMap||v.emissiveMap||v.roughnessMap||v.metalnessMap||v.clearcoatNormalMap||v.iridescenceMap||v.iridescenceThicknessMap||v.transmission>0||v.transmissionMap||v.thicknessMap||v.specularIntensityMap||v.specularColorMap||v.sheen>0||v.sheenColorMap||v.sheenRoughnessMap)&&!!v.displacementMap,fog:!!z,useFog:v.fog===!0,fogExp2:z&&z.isFogExp2,flatShading:!!v.flatShading,sizeAttenuation:v.sizeAttenuation,logarithmicDepthBuffer:f,skinning:K.isSkinnedMesh===!0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:oe,morphTextureStride:ve,numDirLights:L.directional.length,numPointLights:L.point.length,numSpotLights:L.spot.length,numSpotLightMaps:L.spotLightMap.length,numRectAreaLights:L.rectArea.length,numHemiLights:L.hemi.length,numDirLightShadows:L.directionalShadowMap.length,numPointLightShadows:L.pointShadowMap.length,numSpotLightShadows:L.spotShadowMap.length,numSpotLightShadowsWithMaps:L.numSpotLightShadowsWithMaps,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:v.dithering,shadowMapEnabled:s.shadowMap.enabled&&B.length>0,shadowMapType:s.shadowMap.type,toneMapping:v.toneMapped?s.toneMapping:0,physicallyCorrectLights:s.physicallyCorrectLights,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===2,flipSided:v.side===1,useDepthPacking:!!v.depthPacking,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionDerivatives:v.extensions&&v.extensions.derivatives,extensionFragDepth:v.extensions&&v.extensions.fragDepth,extensionDrawBuffers:v.extensions&&v.extensions.drawBuffers,extensionShaderTextureLOD:v.extensions&&v.extensions.shaderTextureLOD,rendererExtensionFragDepth:u||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||n.has("EXT_shader_texture_lod"),customProgramCacheKey:v.customProgramCacheKey()}}function h(v){const L=[];if(v.shaderID?L.push(v.shaderID):(L.push(v.customVertexShaderID),L.push(v.customFragmentShaderID)),v.defines!==void 0)for(const B in v.defines)L.push(B),L.push(v.defines[B]);return v.isRawShaderMaterial===!1&&(y(L,v),A(L,v),L.push(s.outputEncoding)),L.push(v.customProgramCacheKey),L.join()}function y(v,L){v.push(L.precision),v.push(L.outputEncoding),v.push(L.envMapMode),v.push(L.envMapCubeUVHeight),v.push(L.combine),v.push(L.vertexUvs),v.push(L.fogExp2),v.push(L.sizeAttenuation),v.push(L.morphTargetsCount),v.push(L.morphAttributeCount),v.push(L.numDirLights),v.push(L.numPointLights),v.push(L.numSpotLights),v.push(L.numSpotLightMaps),v.push(L.numHemiLights),v.push(L.numRectAreaLights),v.push(L.numDirLightShadows),v.push(L.numPointLightShadows),v.push(L.numSpotLightShadows),v.push(L.numSpotLightShadowsWithMaps),v.push(L.shadowMapType),v.push(L.toneMapping),v.push(L.numClippingPlanes),v.push(L.numClipIntersection),v.push(L.depthPacking)}function A(v,L){a.disableAll(),L.isWebGL2&&a.enable(0),L.supportsVertexTextures&&a.enable(1),L.instancing&&a.enable(2),L.instancingColor&&a.enable(3),L.map&&a.enable(4),L.matcap&&a.enable(5),L.envMap&&a.enable(6),L.lightMap&&a.enable(7),L.aoMap&&a.enable(8),L.emissiveMap&&a.enable(9),L.bumpMap&&a.enable(10),L.normalMap&&a.enable(11),L.objectSpaceNormalMap&&a.enable(12),L.tangentSpaceNormalMap&&a.enable(13),L.clearcoat&&a.enable(14),L.clearcoatMap&&a.enable(15),L.clearcoatRoughnessMap&&a.enable(16),L.clearcoatNormalMap&&a.enable(17),L.iridescence&&a.enable(18),L.iridescenceMap&&a.enable(19),L.iridescenceThicknessMap&&a.enable(20),L.displacementMap&&a.enable(21),L.specularMap&&a.enable(22),L.roughnessMap&&a.enable(23),L.metalnessMap&&a.enable(24),L.gradientMap&&a.enable(25),L.alphaMap&&a.enable(26),L.alphaTest&&a.enable(27),L.vertexColors&&a.enable(28),L.vertexAlphas&&a.enable(29),L.vertexUvs&&a.enable(30),L.vertexTangents&&a.enable(31),L.uvsVertexOnly&&a.enable(32),v.push(a.mask),a.disableAll(),L.fog&&a.enable(0),L.useFog&&a.enable(1),L.flatShading&&a.enable(2),L.logarithmicDepthBuffer&&a.enable(3),L.skinning&&a.enable(4),L.morphTargets&&a.enable(5),L.morphNormals&&a.enable(6),L.morphColors&&a.enable(7),L.premultipliedAlpha&&a.enable(8),L.shadowMapEnabled&&a.enable(9),L.physicallyCorrectLights&&a.enable(10),L.doubleSided&&a.enable(11),L.flipSided&&a.enable(12),L.useDepthPacking&&a.enable(13),L.dithering&&a.enable(14),L.specularIntensityMap&&a.enable(15),L.specularColorMap&&a.enable(16),L.transmission&&a.enable(17),L.transmissionMap&&a.enable(18),L.thicknessMap&&a.enable(19),L.sheen&&a.enable(20),L.sheenColorMap&&a.enable(21),L.sheenRoughnessMap&&a.enable(22),L.decodeVideoTexture&&a.enable(23),L.opaque&&a.enable(24),v.push(a.mask)}function p(v){const L=M[v.type];let B;if(L){const $=Zt[L];B=xa.clone($.uniforms)}else B=v.uniforms;return B}function b(v,L){let B;for(let $=0,K=l.length;$<K;$++){const z=l[$];if(z.cacheKey===L){B=z,++B.usedTimes;break}}return B===void 0&&(B=new Lu(s,L,v,r),l.push(B)),B}function w(v){if(--v.usedTimes===0){const L=l.indexOf(v);l[L]=l[l.length-1],l.pop(),v.destroy()}}function D(v){c.remove(v)}function O(){c.dispose()}return{getParameters:m,getProgramCacheKey:h,getUniforms:p,acquireProgram:b,releaseProgram:w,releaseShaderCache:D,programs:l,dispose:O}}function Fu(){let s=new WeakMap;function e(r){let o=s.get(r);return o===void 0&&(o={},s.set(r,o)),o}function t(r){s.delete(r)}function n(r,o,a){s.get(r)[o]=a}function i(){s=new WeakMap}return{get:e,remove:t,update:n,dispose:i}}function Nu(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.z!==e.z?s.z-e.z:s.id-e.id}function fs(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function ps(){const s=[];let e=0;const t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function o(f,d,g,M,m,h){let y=s[e];return y===void 0?(y={id:f.id,object:f,geometry:d,material:g,groupOrder:M,renderOrder:f.renderOrder,z:m,group:h},s[e]=y):(y.id=f.id,y.object=f,y.geometry=d,y.material=g,y.groupOrder=M,y.renderOrder=f.renderOrder,y.z=m,y.group=h),e++,y}function a(f,d,g,M,m,h){const y=o(f,d,g,M,m,h);g.transmission>0?n.push(y):g.transparent===!0?i.push(y):t.push(y)}function c(f,d,g,M,m,h){const y=o(f,d,g,M,m,h);g.transmission>0?n.unshift(y):g.transparent===!0?i.unshift(y):t.unshift(y)}function l(f,d){t.length>1&&t.sort(f||Nu),n.length>1&&n.sort(d||fs),i.length>1&&i.sort(d||fs)}function u(){for(let f=e,d=s.length;f<d;f++){const g=s[f];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:a,unshift:c,finish:u,sort:l}}function Uu(){let s=new WeakMap;function e(n,i){const r=s.get(n);let o;return r===void 0?(o=new ps,s.set(n,[o])):i>=r.length?(o=new ps,r.push(o)):o=r[i],o}function t(){s=new WeakMap}return{get:e,dispose:t}}function Bu(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new G,color:new et};break;case"SpotLight":t={position:new G,direction:new G,color:new et,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new G,color:new et,distance:0,decay:0};break;case"HemisphereLight":t={direction:new G,skyColor:new et,groundColor:new et};break;case"RectAreaLight":t={color:new et,position:new G,halfWidth:new G,halfHeight:new G};break}return s[e.id]=t,t}}}function Ou(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}let zu=0;function Gu(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function ku(s,e){const t=new Bu,n=Ou(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0};for(let u=0;u<9;u++)i.probe.push(new G);const r=new G,o=new pt,a=new pt;function c(u,f){let d=0,g=0,M=0;for(let $=0;$<9;$++)i.probe[$].set(0,0,0);let m=0,h=0,y=0,A=0,p=0,b=0,w=0,D=0,O=0,v=0;u.sort(Gu);const L=f!==!0?Math.PI:1;for(let $=0,K=u.length;$<K;$++){const z=u[$],F=z.color,Y=z.intensity,te=z.distance,ne=z.shadow&&z.shadow.map?z.shadow.map.texture:null;if(z.isAmbientLight)d+=F.r*Y*L,g+=F.g*Y*L,M+=F.b*Y*L;else if(z.isLightProbe)for(let J=0;J<9;J++)i.probe[J].addScaledVector(z.sh.coefficients[J],Y);else if(z.isDirectionalLight){const J=t.get(z);if(J.color.copy(z.color).multiplyScalar(z.intensity*L),z.castShadow){const ue=z.shadow,oe=n.get(z);oe.shadowBias=ue.bias,oe.shadowNormalBias=ue.normalBias,oe.shadowRadius=ue.radius,oe.shadowMapSize=ue.mapSize,i.directionalShadow[m]=oe,i.directionalShadowMap[m]=ne,i.directionalShadowMatrix[m]=z.shadow.matrix,b++}i.directional[m]=J,m++}else if(z.isSpotLight){const J=t.get(z);J.position.setFromMatrixPosition(z.matrixWorld),J.color.copy(F).multiplyScalar(Y*L),J.distance=te,J.coneCos=Math.cos(z.angle),J.penumbraCos=Math.cos(z.angle*(1-z.penumbra)),J.decay=z.decay,i.spot[y]=J;const ue=z.shadow;if(z.map&&(i.spotLightMap[O]=z.map,O++,ue.updateMatrices(z),z.castShadow&&v++),i.spotLightMatrix[y]=ue.matrix,z.castShadow){const oe=n.get(z);oe.shadowBias=ue.bias,oe.shadowNormalBias=ue.normalBias,oe.shadowRadius=ue.radius,oe.shadowMapSize=ue.mapSize,i.spotShadow[y]=oe,i.spotShadowMap[y]=ne,D++}y++}else if(z.isRectAreaLight){const J=t.get(z);J.color.copy(F).multiplyScalar(Y),J.halfWidth.set(z.width*.5,0,0),J.halfHeight.set(0,z.height*.5,0),i.rectArea[A]=J,A++}else if(z.isPointLight){const J=t.get(z);if(J.color.copy(z.color).multiplyScalar(z.intensity*L),J.distance=z.distance,J.decay=z.decay,z.castShadow){const ue=z.shadow,oe=n.get(z);oe.shadowBias=ue.bias,oe.shadowNormalBias=ue.normalBias,oe.shadowRadius=ue.radius,oe.shadowMapSize=ue.mapSize,oe.shadowCameraNear=ue.camera.near,oe.shadowCameraFar=ue.camera.far,i.pointShadow[h]=oe,i.pointShadowMap[h]=ne,i.pointShadowMatrix[h]=z.shadow.matrix,w++}i.point[h]=J,h++}else if(z.isHemisphereLight){const J=t.get(z);J.skyColor.copy(z.color).multiplyScalar(Y*L),J.groundColor.copy(z.groundColor).multiplyScalar(Y*L),i.hemi[p]=J,p++}}A>0&&(e.isWebGL2||s.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=pe.LTC_FLOAT_1,i.rectAreaLTC2=pe.LTC_FLOAT_2):s.has("OES_texture_half_float_linear")===!0?(i.rectAreaLTC1=pe.LTC_HALF_1,i.rectAreaLTC2=pe.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),i.ambient[0]=d,i.ambient[1]=g,i.ambient[2]=M;const B=i.hash;(B.directionalLength!==m||B.pointLength!==h||B.spotLength!==y||B.rectAreaLength!==A||B.hemiLength!==p||B.numDirectionalShadows!==b||B.numPointShadows!==w||B.numSpotShadows!==D||B.numSpotMaps!==O)&&(i.directional.length=m,i.spot.length=y,i.rectArea.length=A,i.point.length=h,i.hemi.length=p,i.directionalShadow.length=b,i.directionalShadowMap.length=b,i.pointShadow.length=w,i.pointShadowMap.length=w,i.spotShadow.length=D,i.spotShadowMap.length=D,i.directionalShadowMatrix.length=b,i.pointShadowMatrix.length=w,i.spotLightMatrix.length=D+O-v,i.spotLightMap.length=O,i.numSpotLightShadowsWithMaps=v,B.directionalLength=m,B.pointLength=h,B.spotLength=y,B.rectAreaLength=A,B.hemiLength=p,B.numDirectionalShadows=b,B.numPointShadows=w,B.numSpotShadows=D,B.numSpotMaps=O,i.version=zu++)}function l(u,f){let d=0,g=0,M=0,m=0,h=0;const y=f.matrixWorldInverse;for(let A=0,p=u.length;A<p;A++){const b=u[A];if(b.isDirectionalLight){const w=i.directional[d];w.direction.setFromMatrixPosition(b.matrixWorld),r.setFromMatrixPosition(b.target.matrixWorld),w.direction.sub(r),w.direction.transformDirection(y),d++}else if(b.isSpotLight){const w=i.spot[M];w.position.setFromMatrixPosition(b.matrixWorld),w.position.applyMatrix4(y),w.direction.setFromMatrixPosition(b.matrixWorld),r.setFromMatrixPosition(b.target.matrixWorld),w.direction.sub(r),w.direction.transformDirection(y),M++}else if(b.isRectAreaLight){const w=i.rectArea[m];w.position.setFromMatrixPosition(b.matrixWorld),w.position.applyMatrix4(y),a.identity(),o.copy(b.matrixWorld),o.premultiply(y),a.extractRotation(o),w.halfWidth.set(b.width*.5,0,0),w.halfHeight.set(0,b.height*.5,0),w.halfWidth.applyMatrix4(a),w.halfHeight.applyMatrix4(a),m++}else if(b.isPointLight){const w=i.point[g];w.position.setFromMatrixPosition(b.matrixWorld),w.position.applyMatrix4(y),g++}else if(b.isHemisphereLight){const w=i.hemi[h];w.direction.setFromMatrixPosition(b.matrixWorld),w.direction.transformDirection(y),h++}}}return{setup:c,setupView:l,state:i}}function ms(s,e){const t=new ku(s,e),n=[],i=[];function r(){n.length=0,i.length=0}function o(f){n.push(f)}function a(f){i.push(f)}function c(f){t.setup(n,f)}function l(f){t.setupView(n,f)}return{init:r,state:{lightsArray:n,shadowsArray:i,lights:t},setupLights:c,setupLightsView:l,pushLight:o,pushShadow:a}}function Vu(s,e){let t=new WeakMap;function n(r,o=0){const a=t.get(r);let c;return a===void 0?(c=new ms(s,e),t.set(r,[c])):o>=a.length?(c=new ms(s,e),a.push(c)):c=a[o],c}function i(){t=new WeakMap}return{get:n,dispose:i}}class Wu extends jn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Hu extends jn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.referencePosition=new G,this.nearDistance=1,this.farDistance=1e3,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.referencePosition.copy(e.referencePosition),this.nearDistance=e.nearDistance,this.farDistance=e.farDistance,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const qu=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Xu=`uniform sampler2D shadow_pass;
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
}`;function Yu(s,e,t){let n=new Ar;const i=new je,r=new je,o=new Mt,a=new Wu({depthPacking:3201}),c=new Hu,l={},u=t.maxTextureSize,f={0:1,1:0,2:2},d=new Tn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new je},radius:{value:4}},vertexShader:qu,fragmentShader:Xu}),g=d.clone();g.defines.HORIZONTAL_PASS=1;const M=new Bt;M.setAttribute("position",new $t(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const m=new tt(M,d),h=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1,this.render=function(b,w,D){if(h.enabled===!1||h.autoUpdate===!1&&h.needsUpdate===!1||b.length===0)return;const O=s.getRenderTarget(),v=s.getActiveCubeFace(),L=s.getActiveMipmapLevel(),B=s.state;B.setBlending(0),B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);for(let $=0,K=b.length;$<K;$++){const z=b[$],F=z.shadow;if(F===void 0){console.warn("THREE.WebGLShadowMap:",z,"has no shadow.");continue}if(F.autoUpdate===!1&&F.needsUpdate===!1)continue;i.copy(F.mapSize);const Y=F.getFrameExtents();if(i.multiply(Y),r.copy(F.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(r.x=Math.floor(u/Y.x),i.x=r.x*Y.x,F.mapSize.x=r.x),i.y>u&&(r.y=Math.floor(u/Y.y),i.y=r.y*Y.y,F.mapSize.y=r.y)),F.map===null){const ne=this.type!==3?{minFilter:1003,magFilter:1003}:{};F.map=new wn(i.x,i.y,ne),F.map.texture.name=z.name+".shadowMap",F.camera.updateProjectionMatrix()}s.setRenderTarget(F.map),s.clear();const te=F.getViewportCount();for(let ne=0;ne<te;ne++){const J=F.getViewport(ne);o.set(r.x*J.x,r.y*J.y,r.x*J.z,r.y*J.w),B.viewport(o),F.updateMatrices(z,ne),n=F.getFrustum(),p(w,D,F.camera,z,this.type)}F.isPointLightShadow!==!0&&this.type===3&&y(F,D),F.needsUpdate=!1}h.needsUpdate=!1,s.setRenderTarget(O,v,L)};function y(b,w){const D=e.update(m);d.defines.VSM_SAMPLES!==b.blurSamples&&(d.defines.VSM_SAMPLES=b.blurSamples,g.defines.VSM_SAMPLES=b.blurSamples,d.needsUpdate=!0,g.needsUpdate=!0),b.mapPass===null&&(b.mapPass=new wn(i.x,i.y)),d.uniforms.shadow_pass.value=b.map.texture,d.uniforms.resolution.value=b.mapSize,d.uniforms.radius.value=b.radius,s.setRenderTarget(b.mapPass),s.clear(),s.renderBufferDirect(w,null,D,d,m,null),g.uniforms.shadow_pass.value=b.mapPass.texture,g.uniforms.resolution.value=b.mapSize,g.uniforms.radius.value=b.radius,s.setRenderTarget(b.map),s.clear(),s.renderBufferDirect(w,null,D,g,m,null)}function A(b,w,D,O,v,L){let B=null;const $=D.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if($!==void 0)B=$;else if(B=D.isPointLight===!0?c:a,s.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0){const K=B.uuid,z=w.uuid;let F=l[K];F===void 0&&(F={},l[K]=F);let Y=F[z];Y===void 0&&(Y=B.clone(),F[z]=Y),B=Y}return B.visible=w.visible,B.wireframe=w.wireframe,L===3?B.side=w.shadowSide!==null?w.shadowSide:w.side:B.side=w.shadowSide!==null?w.shadowSide:f[w.side],B.alphaMap=w.alphaMap,B.alphaTest=w.alphaTest,B.map=w.map,B.clipShadows=w.clipShadows,B.clippingPlanes=w.clippingPlanes,B.clipIntersection=w.clipIntersection,B.displacementMap=w.displacementMap,B.displacementScale=w.displacementScale,B.displacementBias=w.displacementBias,B.wireframeLinewidth=w.wireframeLinewidth,B.linewidth=w.linewidth,D.isPointLight===!0&&B.isMeshDistanceMaterial===!0&&(B.referencePosition.setFromMatrixPosition(D.matrixWorld),B.nearDistance=O,B.farDistance=v),B}function p(b,w,D,O,v){if(b.visible===!1)return;if(b.layers.test(w.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&v===3)&&(!b.frustumCulled||n.intersectsObject(b))){b.modelViewMatrix.multiplyMatrices(D.matrixWorldInverse,b.matrixWorld);const $=e.update(b),K=b.material;if(Array.isArray(K)){const z=$.groups;for(let F=0,Y=z.length;F<Y;F++){const te=z[F],ne=K[te.materialIndex];if(ne&&ne.visible){const J=A(b,ne,O,D.near,D.far,v);s.renderBufferDirect(D,null,$,J,b,te)}}}else if(K.visible){const z=A(b,K,O,D.near,D.far,v);s.renderBufferDirect(D,null,$,z,b,null)}}const B=b.children;for(let $=0,K=B.length;$<K;$++)p(B[$],w,D,O,v)}}function ju(s,e,t){const n=t.isWebGL2;function i(){let I=!1;const q=new Mt;let re=null;const ie=new Mt(0,0,0,0);return{setMask:function(he){re!==he&&!I&&(s.colorMask(he,he,he,he),re=he)},setLocked:function(he){I=he},setClear:function(he,Xe,ut,nt,Xt){Xt===!0&&(he*=nt,Xe*=nt,ut*=nt),q.set(he,Xe,ut,nt),ie.equals(q)===!1&&(s.clearColor(he,Xe,ut,nt),ie.copy(q))},reset:function(){I=!1,re=null,ie.set(-1,0,0,0)}}}function r(){let I=!1,q=null,re=null,ie=null;return{setTest:function(he){he?Ne(2929):be(2929)},setMask:function(he){q!==he&&!I&&(s.depthMask(he),q=he)},setFunc:function(he){if(re!==he){switch(he){case 0:s.depthFunc(512);break;case 1:s.depthFunc(519);break;case 2:s.depthFunc(513);break;case 3:s.depthFunc(515);break;case 4:s.depthFunc(514);break;case 5:s.depthFunc(518);break;case 6:s.depthFunc(516);break;case 7:s.depthFunc(517);break;default:s.depthFunc(515)}re=he}},setLocked:function(he){I=he},setClear:function(he){ie!==he&&(s.clearDepth(he),ie=he)},reset:function(){I=!1,q=null,re=null,ie=null}}}function o(){let I=!1,q=null,re=null,ie=null,he=null,Xe=null,ut=null,nt=null,Xt=null;return{setTest:function($e){I||($e?Ne(2960):be(2960))},setMask:function($e){q!==$e&&!I&&(s.stencilMask($e),q=$e)},setFunc:function($e,Ot,it){(re!==$e||ie!==Ot||he!==it)&&(s.stencilFunc($e,Ot,it),re=$e,ie=Ot,he=it)},setOp:function($e,Ot,it){(Xe!==$e||ut!==Ot||nt!==it)&&(s.stencilOp($e,Ot,it),Xe=$e,ut=Ot,nt=it)},setLocked:function($e){I=$e},setClear:function($e){Xt!==$e&&(s.clearStencil($e),Xt=$e)},reset:function(){I=!1,q=null,re=null,ie=null,he=null,Xe=null,ut=null,nt=null,Xt=null}}}const a=new i,c=new r,l=new o,u=new WeakMap,f=new WeakMap;let d={},g={},M=new WeakMap,m=[],h=null,y=!1,A=null,p=null,b=null,w=null,D=null,O=null,v=null,L=!1,B=null,$=null,K=null,z=null,F=null;const Y=s.getParameter(35661);let te=!1,ne=0;const J=s.getParameter(7938);J.indexOf("WebGL")!==-1?(ne=parseFloat(/^WebGL (\d)/.exec(J)[1]),te=ne>=1):J.indexOf("OpenGL ES")!==-1&&(ne=parseFloat(/^OpenGL ES (\d)/.exec(J)[1]),te=ne>=2);let ue=null,oe={};const ve=s.getParameter(3088),W=s.getParameter(2978),Q=new Mt().fromArray(ve),de=new Mt().fromArray(W);function me(I,q,re){const ie=new Uint8Array(4),he=s.createTexture();s.bindTexture(I,he),s.texParameteri(I,10241,9728),s.texParameteri(I,10240,9728);for(let Xe=0;Xe<re;Xe++)s.texImage2D(q+Xe,0,6408,1,1,0,6408,5121,ie);return he}const H={};H[3553]=me(3553,3553,1),H[34067]=me(34067,34069,6),a.setClear(0,0,0,1),c.setClear(1),l.setClear(0),Ne(2929),c.setFunc(3),ct(!1),vt(1),Ne(2884),rt(0);function Ne(I){d[I]!==!0&&(s.enable(I),d[I]=!0)}function be(I){d[I]!==!1&&(s.disable(I),d[I]=!1)}function Te(I,q){return g[I]!==q?(s.bindFramebuffer(I,q),g[I]=q,n&&(I===36009&&(g[36160]=q),I===36160&&(g[36009]=q)),!0):!1}function ye(I,q){let re=m,ie=!1;if(I)if(re=M.get(q),re===void 0&&(re=[],M.set(q,re)),I.isWebGLMultipleRenderTargets){const he=I.texture;if(re.length!==he.length||re[0]!==36064){for(let Xe=0,ut=he.length;Xe<ut;Xe++)re[Xe]=36064+Xe;re.length=he.length,ie=!0}}else re[0]!==36064&&(re[0]=36064,ie=!0);else re[0]!==1029&&(re[0]=1029,ie=!0);ie&&(t.isWebGL2?s.drawBuffers(re):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(re))}function Je(I){return h!==I?(s.useProgram(I),h=I,!0):!1}const Be={100:32774,101:32778,102:32779};if(n)Be[103]=32775,Be[104]=32776;else{const I=e.get("EXT_blend_minmax");I!==null&&(Be[103]=I.MIN_EXT,Be[104]=I.MAX_EXT)}const Pe={200:0,201:1,202:768,204:770,210:776,208:774,206:772,203:769,205:771,209:775,207:773};function rt(I,q,re,ie,he,Xe,ut,nt){if(I===0){y===!0&&(be(3042),y=!1);return}if(y===!1&&(Ne(3042),y=!0),I!==5){if(I!==A||nt!==L){if((p!==100||D!==100)&&(s.blendEquation(32774),p=100,D=100),nt)switch(I){case 1:s.blendFuncSeparate(1,771,1,771);break;case 2:s.blendFunc(1,1);break;case 3:s.blendFuncSeparate(0,769,0,1);break;case 4:s.blendFuncSeparate(0,768,0,770);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}else switch(I){case 1:s.blendFuncSeparate(770,771,1,771);break;case 2:s.blendFunc(770,1);break;case 3:s.blendFuncSeparate(0,769,0,1);break;case 4:s.blendFunc(0,768);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}b=null,w=null,O=null,v=null,A=I,L=nt}return}he=he||q,Xe=Xe||re,ut=ut||ie,(q!==p||he!==D)&&(s.blendEquationSeparate(Be[q],Be[he]),p=q,D=he),(re!==b||ie!==w||Xe!==O||ut!==v)&&(s.blendFuncSeparate(Pe[re],Pe[ie],Pe[Xe],Pe[ut]),b=re,w=ie,O=Xe,v=ut),A=I,L=!1}function ht(I,q){I.side===2?be(2884):Ne(2884);let re=I.side===1;q&&(re=!re),ct(re),I.blending===1&&I.transparent===!1?rt(0):rt(I.blending,I.blendEquation,I.blendSrc,I.blendDst,I.blendEquationAlpha,I.blendSrcAlpha,I.blendDstAlpha,I.premultipliedAlpha),c.setFunc(I.depthFunc),c.setTest(I.depthTest),c.setMask(I.depthWrite),a.setMask(I.colorWrite);const ie=I.stencilWrite;l.setTest(ie),ie&&(l.setMask(I.stencilWriteMask),l.setFunc(I.stencilFunc,I.stencilRef,I.stencilFuncMask),l.setOp(I.stencilFail,I.stencilZFail,I.stencilZPass)),Ze(I.polygonOffset,I.polygonOffsetFactor,I.polygonOffsetUnits),I.alphaToCoverage===!0?Ne(32926):be(32926)}function ct(I){B!==I&&(I?s.frontFace(2304):s.frontFace(2305),B=I)}function vt(I){I!==0?(Ne(2884),I!==$&&(I===1?s.cullFace(1029):I===2?s.cullFace(1028):s.cullFace(1032))):be(2884),$=I}function st(I){I!==K&&(te&&s.lineWidth(I),K=I)}function Ze(I,q,re){I?(Ne(32823),(z!==q||F!==re)&&(s.polygonOffset(q,re),z=q,F=re)):be(32823)}function Ct(I){I?Ne(3089):be(3089)}function Lt(I){I===void 0&&(I=33984+Y-1),ue!==I&&(s.activeTexture(I),ue=I)}function T(I,q,re){re===void 0&&(ue===null?re=33984+Y-1:re=ue);let ie=oe[re];ie===void 0&&(ie={type:void 0,texture:void 0},oe[re]=ie),(ie.type!==I||ie.texture!==q)&&(ue!==re&&(s.activeTexture(re),ue=re),s.bindTexture(I,q||H[I]),ie.type=I,ie.texture=q)}function x(){const I=oe[ue];I!==void 0&&I.type!==void 0&&(s.bindTexture(I.type,null),I.type=void 0,I.texture=void 0)}function j(){try{s.compressedTexImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function ce(){try{s.compressedTexImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function le(){try{s.texSubImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function fe(){try{s.texSubImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Ce(){try{s.compressedTexSubImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function xe(){try{s.compressedTexSubImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function C(){try{s.texStorage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Le(){try{s.texStorage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function De(){try{s.texImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Se(){try{s.texImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Re(I){Q.equals(I)===!1&&(s.scissor(I.x,I.y,I.z,I.w),Q.copy(I))}function Ae(I){de.equals(I)===!1&&(s.viewport(I.x,I.y,I.z,I.w),de.copy(I))}function Ue(I,q){let re=f.get(q);re===void 0&&(re=new WeakMap,f.set(q,re));let ie=re.get(I);ie===void 0&&(ie=s.getUniformBlockIndex(q,I.name),re.set(I,ie))}function Ke(I,q){const ie=f.get(q).get(I);u.get(q)!==ie&&(s.uniformBlockBinding(q,ie,I.__bindingPointIndex),u.set(q,ie))}function at(){s.disable(3042),s.disable(2884),s.disable(2929),s.disable(32823),s.disable(3089),s.disable(2960),s.disable(32926),s.blendEquation(32774),s.blendFunc(1,0),s.blendFuncSeparate(1,0,1,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(513),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(519,0,4294967295),s.stencilOp(7680,7680,7680),s.clearStencil(0),s.cullFace(1029),s.frontFace(2305),s.polygonOffset(0,0),s.activeTexture(33984),s.bindFramebuffer(36160,null),n===!0&&(s.bindFramebuffer(36009,null),s.bindFramebuffer(36008,null)),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),d={},ue=null,oe={},g={},M=new WeakMap,m=[],h=null,y=!1,A=null,p=null,b=null,w=null,D=null,O=null,v=null,L=!1,B=null,$=null,K=null,z=null,F=null,Q.set(0,0,s.canvas.width,s.canvas.height),de.set(0,0,s.canvas.width,s.canvas.height),a.reset(),c.reset(),l.reset()}return{buffers:{color:a,depth:c,stencil:l},enable:Ne,disable:be,bindFramebuffer:Te,drawBuffers:ye,useProgram:Je,setBlending:rt,setMaterial:ht,setFlipSided:ct,setCullFace:vt,setLineWidth:st,setPolygonOffset:Ze,setScissorTest:Ct,activeTexture:Lt,bindTexture:T,unbindTexture:x,compressedTexImage2D:j,compressedTexImage3D:ce,texImage2D:De,texImage3D:Se,updateUBOMapping:Ue,uniformBlockBinding:Ke,texStorage2D:C,texStorage3D:Le,texSubImage2D:le,texSubImage3D:fe,compressedTexSubImage2D:Ce,compressedTexSubImage3D:xe,scissor:Re,viewport:Ae,reset:at}}function Zu(s,e,t,n,i,r,o){const a=i.isWebGL2,c=i.maxTextures,l=i.maxCubemapSize,u=i.maxTextureSize,f=i.maxSamples,d=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,g=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),M=new WeakMap;let m;const h=new WeakMap;let y=!1;try{y=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function A(T,x){return y?new OffscreenCanvas(T,x):Vi("canvas")}function p(T,x,j,ce){let le=1;if((T.width>ce||T.height>ce)&&(le=ce/Math.max(T.width,T.height)),le<1||x===!0)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap){const fe=x?ki:Math.floor,Ce=fe(le*T.width),xe=fe(le*T.height);m===void 0&&(m=A(Ce,xe));const C=j?A(Ce,xe):m;return C.width=Ce,C.height=xe,C.getContext("2d").drawImage(T,0,0,Ce,xe),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+T.width+"x"+T.height+") to ("+Ce+"x"+xe+")."),C}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+T.width+"x"+T.height+")."),T;return T}function b(T){return wr(T.width)&&wr(T.height)}function w(T){return a?!1:T.wrapS!==1001||T.wrapT!==1001||T.minFilter!==1003&&T.minFilter!==1006}function D(T,x){return T.generateMipmaps&&x&&T.minFilter!==1003&&T.minFilter!==1006}function O(T){s.generateMipmap(T)}function v(T,x,j,ce,le=!1){if(a===!1)return x;if(T!==null){if(s[T]!==void 0)return s[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let fe=x;return x===6403&&(j===5126&&(fe=33326),j===5131&&(fe=33325),j===5121&&(fe=33321)),x===33319&&(j===5126&&(fe=33328),j===5131&&(fe=33327),j===5121&&(fe=33323)),x===6408&&(j===5126&&(fe=34836),j===5131&&(fe=34842),j===5121&&(fe=ce===3001&&le===!1?35907:32856),j===32819&&(fe=32854),j===32820&&(fe=32855)),(fe===33325||fe===33326||fe===33327||fe===33328||fe===34842||fe===34836)&&e.get("EXT_color_buffer_float"),fe}function L(T,x,j){return D(T,j)===!0||T.isFramebufferTexture&&T.minFilter!==1003&&T.minFilter!==1006?Math.log2(Math.max(x.width,x.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?x.mipmaps.length:1}function B(T){return T===1003||T===1004||T===1005?9728:9729}function $(T){const x=T.target;x.removeEventListener("dispose",$),z(x),x.isVideoTexture&&M.delete(x)}function K(T){const x=T.target;x.removeEventListener("dispose",K),Y(x)}function z(T){const x=n.get(T);if(x.__webglInit===void 0)return;const j=T.source,ce=h.get(j);if(ce){const le=ce[x.__cacheKey];le.usedTimes--,le.usedTimes===0&&F(T),Object.keys(ce).length===0&&h.delete(j)}n.remove(T)}function F(T){const x=n.get(T);s.deleteTexture(x.__webglTexture);const j=T.source,ce=h.get(j);delete ce[x.__cacheKey],o.memory.textures--}function Y(T){const x=T.texture,j=n.get(T),ce=n.get(x);if(ce.__webglTexture!==void 0&&(s.deleteTexture(ce.__webglTexture),o.memory.textures--),T.depthTexture&&T.depthTexture.dispose(),T.isWebGLCubeRenderTarget)for(let le=0;le<6;le++)s.deleteFramebuffer(j.__webglFramebuffer[le]),j.__webglDepthbuffer&&s.deleteRenderbuffer(j.__webglDepthbuffer[le]);else{if(s.deleteFramebuffer(j.__webglFramebuffer),j.__webglDepthbuffer&&s.deleteRenderbuffer(j.__webglDepthbuffer),j.__webglMultisampledFramebuffer&&s.deleteFramebuffer(j.__webglMultisampledFramebuffer),j.__webglColorRenderbuffer)for(let le=0;le<j.__webglColorRenderbuffer.length;le++)j.__webglColorRenderbuffer[le]&&s.deleteRenderbuffer(j.__webglColorRenderbuffer[le]);j.__webglDepthRenderbuffer&&s.deleteRenderbuffer(j.__webglDepthRenderbuffer)}if(T.isWebGLMultipleRenderTargets)for(let le=0,fe=x.length;le<fe;le++){const Ce=n.get(x[le]);Ce.__webglTexture&&(s.deleteTexture(Ce.__webglTexture),o.memory.textures--),n.remove(x[le])}n.remove(x),n.remove(T)}let te=0;function ne(){te=0}function J(){const T=te;return T>=c&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+c),te+=1,T}function ue(T){const x=[];return x.push(T.wrapS),x.push(T.wrapT),x.push(T.wrapR||0),x.push(T.magFilter),x.push(T.minFilter),x.push(T.anisotropy),x.push(T.internalFormat),x.push(T.format),x.push(T.type),x.push(T.generateMipmaps),x.push(T.premultiplyAlpha),x.push(T.flipY),x.push(T.unpackAlignment),x.push(T.encoding),x.join()}function oe(T,x){const j=n.get(T);if(T.isVideoTexture&&Ct(T),T.isRenderTargetTexture===!1&&T.version>0&&j.__version!==T.version){const ce=T.image;if(ce===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(ce.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{be(j,T,x);return}}t.bindTexture(3553,j.__webglTexture,33984+x)}function ve(T,x){const j=n.get(T);if(T.version>0&&j.__version!==T.version){be(j,T,x);return}t.bindTexture(35866,j.__webglTexture,33984+x)}function W(T,x){const j=n.get(T);if(T.version>0&&j.__version!==T.version){be(j,T,x);return}t.bindTexture(32879,j.__webglTexture,33984+x)}function Q(T,x){const j=n.get(T);if(T.version>0&&j.__version!==T.version){Te(j,T,x);return}t.bindTexture(34067,j.__webglTexture,33984+x)}const de={1e3:10497,1001:33071,1002:33648},me={1003:9728,1004:9984,1005:9986,1006:9729,1007:9985,1008:9987};function H(T,x,j){if(j?(s.texParameteri(T,10242,de[x.wrapS]),s.texParameteri(T,10243,de[x.wrapT]),(T===32879||T===35866)&&s.texParameteri(T,32882,de[x.wrapR]),s.texParameteri(T,10240,me[x.magFilter]),s.texParameteri(T,10241,me[x.minFilter])):(s.texParameteri(T,10242,33071),s.texParameteri(T,10243,33071),(T===32879||T===35866)&&s.texParameteri(T,32882,33071),(x.wrapS!==1001||x.wrapT!==1001)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),s.texParameteri(T,10240,B(x.magFilter)),s.texParameteri(T,10241,B(x.minFilter)),x.minFilter!==1003&&x.minFilter!==1006&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),e.has("EXT_texture_filter_anisotropic")===!0){const ce=e.get("EXT_texture_filter_anisotropic");if(x.magFilter===1003||x.minFilter!==1005&&x.minFilter!==1008||x.type===1015&&e.has("OES_texture_float_linear")===!1||a===!1&&x.type===1016&&e.has("OES_texture_half_float_linear")===!1)return;(x.anisotropy>1||n.get(x).__currentAnisotropy)&&(s.texParameterf(T,ce.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,i.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy)}}function Ne(T,x){let j=!1;T.__webglInit===void 0&&(T.__webglInit=!0,x.addEventListener("dispose",$));const ce=x.source;let le=h.get(ce);le===void 0&&(le={},h.set(ce,le));const fe=ue(x);if(fe!==T.__cacheKey){le[fe]===void 0&&(le[fe]={texture:s.createTexture(),usedTimes:0},o.memory.textures++,j=!0),le[fe].usedTimes++;const Ce=le[T.__cacheKey];Ce!==void 0&&(le[T.__cacheKey].usedTimes--,Ce.usedTimes===0&&F(x)),T.__cacheKey=fe,T.__webglTexture=le[fe].texture}return j}function be(T,x,j){let ce=3553;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(ce=35866),x.isData3DTexture&&(ce=32879);const le=Ne(T,x),fe=x.source;t.bindTexture(ce,T.__webglTexture,33984+j);const Ce=n.get(fe);if(fe.version!==Ce.__version||le===!0){t.activeTexture(33984+j),s.pixelStorei(37440,x.flipY),s.pixelStorei(37441,x.premultiplyAlpha),s.pixelStorei(3317,x.unpackAlignment),s.pixelStorei(37443,0);const xe=w(x)&&b(x.image)===!1;let C=p(x.image,xe,!1,u);C=Lt(x,C);const Le=b(C)||a,De=r.convert(x.format,x.encoding);let Se=r.convert(x.type),Re=v(x.internalFormat,De,Se,x.encoding,x.isVideoTexture);H(ce,x,Le);let Ae;const Ue=x.mipmaps,Ke=a&&x.isVideoTexture!==!0,at=Ce.__version===void 0||le===!0,I=L(x,C,Le);if(x.isDepthTexture)Re=6402,a?x.type===1015?Re=36012:x.type===1014?Re=33190:x.type===1020?Re=35056:Re=33189:x.type===1015&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),x.format===1026&&Re===6402&&x.type!==1012&&x.type!==1014&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),x.type=1014,Se=r.convert(x.type)),x.format===1027&&Re===6402&&(Re=34041,x.type!==1020&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),x.type=1020,Se=r.convert(x.type))),at&&(Ke?t.texStorage2D(3553,1,Re,C.width,C.height):t.texImage2D(3553,0,Re,C.width,C.height,0,De,Se,null));else if(x.isDataTexture)if(Ue.length>0&&Le){Ke&&at&&t.texStorage2D(3553,I,Re,Ue[0].width,Ue[0].height);for(let q=0,re=Ue.length;q<re;q++)Ae=Ue[q],Ke?t.texSubImage2D(3553,q,0,0,Ae.width,Ae.height,De,Se,Ae.data):t.texImage2D(3553,q,Re,Ae.width,Ae.height,0,De,Se,Ae.data);x.generateMipmaps=!1}else Ke?(at&&t.texStorage2D(3553,I,Re,C.width,C.height),t.texSubImage2D(3553,0,0,0,C.width,C.height,De,Se,C.data)):t.texImage2D(3553,0,Re,C.width,C.height,0,De,Se,C.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Ke&&at&&t.texStorage3D(35866,I,Re,Ue[0].width,Ue[0].height,C.depth);for(let q=0,re=Ue.length;q<re;q++)Ae=Ue[q],x.format!==1023?De!==null?Ke?t.compressedTexSubImage3D(35866,q,0,0,0,Ae.width,Ae.height,C.depth,De,Ae.data,0,0):t.compressedTexImage3D(35866,q,Re,Ae.width,Ae.height,C.depth,0,Ae.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ke?t.texSubImage3D(35866,q,0,0,0,Ae.width,Ae.height,C.depth,De,Se,Ae.data):t.texImage3D(35866,q,Re,Ae.width,Ae.height,C.depth,0,De,Se,Ae.data)}else{Ke&&at&&t.texStorage2D(3553,I,Re,Ue[0].width,Ue[0].height);for(let q=0,re=Ue.length;q<re;q++)Ae=Ue[q],x.format!==1023?De!==null?Ke?t.compressedTexSubImage2D(3553,q,0,0,Ae.width,Ae.height,De,Ae.data):t.compressedTexImage2D(3553,q,Re,Ae.width,Ae.height,0,Ae.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ke?t.texSubImage2D(3553,q,0,0,Ae.width,Ae.height,De,Se,Ae.data):t.texImage2D(3553,q,Re,Ae.width,Ae.height,0,De,Se,Ae.data)}else if(x.isDataArrayTexture)Ke?(at&&t.texStorage3D(35866,I,Re,C.width,C.height,C.depth),t.texSubImage3D(35866,0,0,0,0,C.width,C.height,C.depth,De,Se,C.data)):t.texImage3D(35866,0,Re,C.width,C.height,C.depth,0,De,Se,C.data);else if(x.isData3DTexture)Ke?(at&&t.texStorage3D(32879,I,Re,C.width,C.height,C.depth),t.texSubImage3D(32879,0,0,0,0,C.width,C.height,C.depth,De,Se,C.data)):t.texImage3D(32879,0,Re,C.width,C.height,C.depth,0,De,Se,C.data);else if(x.isFramebufferTexture){if(at)if(Ke)t.texStorage2D(3553,I,Re,C.width,C.height);else{let q=C.width,re=C.height;for(let ie=0;ie<I;ie++)t.texImage2D(3553,ie,Re,q,re,0,De,Se,null),q>>=1,re>>=1}}else if(Ue.length>0&&Le){Ke&&at&&t.texStorage2D(3553,I,Re,Ue[0].width,Ue[0].height);for(let q=0,re=Ue.length;q<re;q++)Ae=Ue[q],Ke?t.texSubImage2D(3553,q,0,0,De,Se,Ae):t.texImage2D(3553,q,Re,De,Se,Ae);x.generateMipmaps=!1}else Ke?(at&&t.texStorage2D(3553,I,Re,C.width,C.height),t.texSubImage2D(3553,0,0,0,De,Se,C)):t.texImage2D(3553,0,Re,De,Se,C);D(x,Le)&&O(ce),Ce.__version=fe.version,x.onUpdate&&x.onUpdate(x)}T.__version=x.version}function Te(T,x,j){if(x.image.length!==6)return;const ce=Ne(T,x),le=x.source;t.bindTexture(34067,T.__webglTexture,33984+j);const fe=n.get(le);if(le.version!==fe.__version||ce===!0){t.activeTexture(33984+j),s.pixelStorei(37440,x.flipY),s.pixelStorei(37441,x.premultiplyAlpha),s.pixelStorei(3317,x.unpackAlignment),s.pixelStorei(37443,0);const Ce=x.isCompressedTexture||x.image[0].isCompressedTexture,xe=x.image[0]&&x.image[0].isDataTexture,C=[];for(let q=0;q<6;q++)!Ce&&!xe?C[q]=p(x.image[q],!1,!0,l):C[q]=xe?x.image[q].image:x.image[q],C[q]=Lt(x,C[q]);const Le=C[0],De=b(Le)||a,Se=r.convert(x.format,x.encoding),Re=r.convert(x.type),Ae=v(x.internalFormat,Se,Re,x.encoding),Ue=a&&x.isVideoTexture!==!0,Ke=fe.__version===void 0||ce===!0;let at=L(x,Le,De);H(34067,x,De);let I;if(Ce){Ue&&Ke&&t.texStorage2D(34067,at,Ae,Le.width,Le.height);for(let q=0;q<6;q++){I=C[q].mipmaps;for(let re=0;re<I.length;re++){const ie=I[re];x.format!==1023?Se!==null?Ue?t.compressedTexSubImage2D(34069+q,re,0,0,ie.width,ie.height,Se,ie.data):t.compressedTexImage2D(34069+q,re,Ae,ie.width,ie.height,0,ie.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ue?t.texSubImage2D(34069+q,re,0,0,ie.width,ie.height,Se,Re,ie.data):t.texImage2D(34069+q,re,Ae,ie.width,ie.height,0,Se,Re,ie.data)}}}else{I=x.mipmaps,Ue&&Ke&&(I.length>0&&at++,t.texStorage2D(34067,at,Ae,C[0].width,C[0].height));for(let q=0;q<6;q++)if(xe){Ue?t.texSubImage2D(34069+q,0,0,0,C[q].width,C[q].height,Se,Re,C[q].data):t.texImage2D(34069+q,0,Ae,C[q].width,C[q].height,0,Se,Re,C[q].data);for(let re=0;re<I.length;re++){const he=I[re].image[q].image;Ue?t.texSubImage2D(34069+q,re+1,0,0,he.width,he.height,Se,Re,he.data):t.texImage2D(34069+q,re+1,Ae,he.width,he.height,0,Se,Re,he.data)}}else{Ue?t.texSubImage2D(34069+q,0,0,0,Se,Re,C[q]):t.texImage2D(34069+q,0,Ae,Se,Re,C[q]);for(let re=0;re<I.length;re++){const ie=I[re];Ue?t.texSubImage2D(34069+q,re+1,0,0,Se,Re,ie.image[q]):t.texImage2D(34069+q,re+1,Ae,Se,Re,ie.image[q])}}}D(x,De)&&O(34067),fe.__version=le.version,x.onUpdate&&x.onUpdate(x)}T.__version=x.version}function ye(T,x,j,ce,le){const fe=r.convert(j.format,j.encoding),Ce=r.convert(j.type),xe=v(j.internalFormat,fe,Ce,j.encoding);n.get(x).__hasExternalTextures||(le===32879||le===35866?t.texImage3D(le,0,xe,x.width,x.height,x.depth,0,fe,Ce,null):t.texImage2D(le,0,xe,x.width,x.height,0,fe,Ce,null)),t.bindFramebuffer(36160,T),Ze(x)?d.framebufferTexture2DMultisampleEXT(36160,ce,le,n.get(j).__webglTexture,0,st(x)):(le===3553||le>=34069&&le<=34074)&&s.framebufferTexture2D(36160,ce,le,n.get(j).__webglTexture,0),t.bindFramebuffer(36160,null)}function Je(T,x,j){if(s.bindRenderbuffer(36161,T),x.depthBuffer&&!x.stencilBuffer){let ce=33189;if(j||Ze(x)){const le=x.depthTexture;le&&le.isDepthTexture&&(le.type===1015?ce=36012:le.type===1014&&(ce=33190));const fe=st(x);Ze(x)?d.renderbufferStorageMultisampleEXT(36161,fe,ce,x.width,x.height):s.renderbufferStorageMultisample(36161,fe,ce,x.width,x.height)}else s.renderbufferStorage(36161,ce,x.width,x.height);s.framebufferRenderbuffer(36160,36096,36161,T)}else if(x.depthBuffer&&x.stencilBuffer){const ce=st(x);j&&Ze(x)===!1?s.renderbufferStorageMultisample(36161,ce,35056,x.width,x.height):Ze(x)?d.renderbufferStorageMultisampleEXT(36161,ce,35056,x.width,x.height):s.renderbufferStorage(36161,34041,x.width,x.height),s.framebufferRenderbuffer(36160,33306,36161,T)}else{const ce=x.isWebGLMultipleRenderTargets===!0?x.texture:[x.texture];for(let le=0;le<ce.length;le++){const fe=ce[le],Ce=r.convert(fe.format,fe.encoding),xe=r.convert(fe.type),C=v(fe.internalFormat,Ce,xe,fe.encoding),Le=st(x);j&&Ze(x)===!1?s.renderbufferStorageMultisample(36161,Le,C,x.width,x.height):Ze(x)?d.renderbufferStorageMultisampleEXT(36161,Le,C,x.width,x.height):s.renderbufferStorage(36161,C,x.width,x.height)}}s.bindRenderbuffer(36161,null)}function Be(T,x){if(x&&x.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(36160,T),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(x.depthTexture).__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),oe(x.depthTexture,0);const ce=n.get(x.depthTexture).__webglTexture,le=st(x);if(x.depthTexture.format===1026)Ze(x)?d.framebufferTexture2DMultisampleEXT(36160,36096,3553,ce,0,le):s.framebufferTexture2D(36160,36096,3553,ce,0);else if(x.depthTexture.format===1027)Ze(x)?d.framebufferTexture2DMultisampleEXT(36160,33306,3553,ce,0,le):s.framebufferTexture2D(36160,33306,3553,ce,0);else throw new Error("Unknown depthTexture format")}function Pe(T){const x=n.get(T),j=T.isWebGLCubeRenderTarget===!0;if(T.depthTexture&&!x.__autoAllocateDepthBuffer){if(j)throw new Error("target.depthTexture not supported in Cube render targets");Be(x.__webglFramebuffer,T)}else if(j){x.__webglDepthbuffer=[];for(let ce=0;ce<6;ce++)t.bindFramebuffer(36160,x.__webglFramebuffer[ce]),x.__webglDepthbuffer[ce]=s.createRenderbuffer(),Je(x.__webglDepthbuffer[ce],T,!1)}else t.bindFramebuffer(36160,x.__webglFramebuffer),x.__webglDepthbuffer=s.createRenderbuffer(),Je(x.__webglDepthbuffer,T,!1);t.bindFramebuffer(36160,null)}function rt(T,x,j){const ce=n.get(T);x!==void 0&&ye(ce.__webglFramebuffer,T,T.texture,36064,3553),j!==void 0&&Pe(T)}function ht(T){const x=T.texture,j=n.get(T),ce=n.get(x);T.addEventListener("dispose",K),T.isWebGLMultipleRenderTargets!==!0&&(ce.__webglTexture===void 0&&(ce.__webglTexture=s.createTexture()),ce.__version=x.version,o.memory.textures++);const le=T.isWebGLCubeRenderTarget===!0,fe=T.isWebGLMultipleRenderTargets===!0,Ce=b(T)||a;if(le){j.__webglFramebuffer=[];for(let xe=0;xe<6;xe++)j.__webglFramebuffer[xe]=s.createFramebuffer()}else{if(j.__webglFramebuffer=s.createFramebuffer(),fe)if(i.drawBuffers){const xe=T.texture;for(let C=0,Le=xe.length;C<Le;C++){const De=n.get(xe[C]);De.__webglTexture===void 0&&(De.__webglTexture=s.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(a&&T.samples>0&&Ze(T)===!1){const xe=fe?x:[x];j.__webglMultisampledFramebuffer=s.createFramebuffer(),j.__webglColorRenderbuffer=[],t.bindFramebuffer(36160,j.__webglMultisampledFramebuffer);for(let C=0;C<xe.length;C++){const Le=xe[C];j.__webglColorRenderbuffer[C]=s.createRenderbuffer(),s.bindRenderbuffer(36161,j.__webglColorRenderbuffer[C]);const De=r.convert(Le.format,Le.encoding),Se=r.convert(Le.type),Re=v(Le.internalFormat,De,Se,Le.encoding,T.isXRRenderTarget===!0),Ae=st(T);s.renderbufferStorageMultisample(36161,Ae,Re,T.width,T.height),s.framebufferRenderbuffer(36160,36064+C,36161,j.__webglColorRenderbuffer[C])}s.bindRenderbuffer(36161,null),T.depthBuffer&&(j.__webglDepthRenderbuffer=s.createRenderbuffer(),Je(j.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(36160,null)}}if(le){t.bindTexture(34067,ce.__webglTexture),H(34067,x,Ce);for(let xe=0;xe<6;xe++)ye(j.__webglFramebuffer[xe],T,x,36064,34069+xe);D(x,Ce)&&O(34067),t.unbindTexture()}else if(fe){const xe=T.texture;for(let C=0,Le=xe.length;C<Le;C++){const De=xe[C],Se=n.get(De);t.bindTexture(3553,Se.__webglTexture),H(3553,De,Ce),ye(j.__webglFramebuffer,T,De,36064+C,3553),D(De,Ce)&&O(3553)}t.unbindTexture()}else{let xe=3553;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(a?xe=T.isWebGL3DRenderTarget?32879:35866:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(xe,ce.__webglTexture),H(xe,x,Ce),ye(j.__webglFramebuffer,T,x,36064,xe),D(x,Ce)&&O(xe),t.unbindTexture()}T.depthBuffer&&Pe(T)}function ct(T){const x=b(T)||a,j=T.isWebGLMultipleRenderTargets===!0?T.texture:[T.texture];for(let ce=0,le=j.length;ce<le;ce++){const fe=j[ce];if(D(fe,x)){const Ce=T.isWebGLCubeRenderTarget?34067:3553,xe=n.get(fe).__webglTexture;t.bindTexture(Ce,xe),O(Ce),t.unbindTexture()}}}function vt(T){if(a&&T.samples>0&&Ze(T)===!1){const x=T.isWebGLMultipleRenderTargets?T.texture:[T.texture],j=T.width,ce=T.height;let le=16384;const fe=[],Ce=T.stencilBuffer?33306:36096,xe=n.get(T),C=T.isWebGLMultipleRenderTargets===!0;if(C)for(let Le=0;Le<x.length;Le++)t.bindFramebuffer(36160,xe.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(36160,36064+Le,36161,null),t.bindFramebuffer(36160,xe.__webglFramebuffer),s.framebufferTexture2D(36009,36064+Le,3553,null,0);t.bindFramebuffer(36008,xe.__webglMultisampledFramebuffer),t.bindFramebuffer(36009,xe.__webglFramebuffer);for(let Le=0;Le<x.length;Le++){fe.push(36064+Le),T.depthBuffer&&fe.push(Ce);const De=xe.__ignoreDepthValues!==void 0?xe.__ignoreDepthValues:!1;if(De===!1&&(T.depthBuffer&&(le|=256),T.stencilBuffer&&(le|=1024)),C&&s.framebufferRenderbuffer(36008,36064,36161,xe.__webglColorRenderbuffer[Le]),De===!0&&(s.invalidateFramebuffer(36008,[Ce]),s.invalidateFramebuffer(36009,[Ce])),C){const Se=n.get(x[Le]).__webglTexture;s.framebufferTexture2D(36009,36064,3553,Se,0)}s.blitFramebuffer(0,0,j,ce,0,0,j,ce,le,9728),g&&s.invalidateFramebuffer(36008,fe)}if(t.bindFramebuffer(36008,null),t.bindFramebuffer(36009,null),C)for(let Le=0;Le<x.length;Le++){t.bindFramebuffer(36160,xe.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(36160,36064+Le,36161,xe.__webglColorRenderbuffer[Le]);const De=n.get(x[Le]).__webglTexture;t.bindFramebuffer(36160,xe.__webglFramebuffer),s.framebufferTexture2D(36009,36064+Le,3553,De,0)}t.bindFramebuffer(36009,xe.__webglMultisampledFramebuffer)}}function st(T){return Math.min(f,T.samples)}function Ze(T){const x=n.get(T);return a&&T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function Ct(T){const x=o.render.frame;M.get(T)!==x&&(M.set(T,x),T.update())}function Lt(T,x){const j=T.encoding,ce=T.format,le=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||T.format===1035||j!==3e3&&(j===3001?a===!1?e.has("EXT_sRGB")===!0&&ce===1023?(T.format=1035,T.minFilter=1006,T.generateMipmaps=!1):x=Es.sRGBToLinear(x):(ce!==1023||le!==1009)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture encoding:",j)),x}this.allocateTextureUnit=J,this.resetTextureUnits=ne,this.setTexture2D=oe,this.setTexture2DArray=ve,this.setTexture3D=W,this.setTextureCube=Q,this.rebindTextures=rt,this.setupRenderTarget=ht,this.updateRenderTargetMipmap=ct,this.updateMultisampleRenderTarget=vt,this.setupDepthRenderbuffer=Pe,this.setupFrameBufferTexture=ye,this.useMultisampledRTT=Ze}function $u(s,e,t){const n=t.isWebGL2;function i(r,o=null){let a;if(r===1009)return 5121;if(r===1017)return 32819;if(r===1018)return 32820;if(r===1010)return 5120;if(r===1011)return 5122;if(r===1012)return 5123;if(r===1013)return 5124;if(r===1014)return 5125;if(r===1015)return 5126;if(r===1016)return n?5131:(a=e.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(r===1021)return 6406;if(r===1023)return 6408;if(r===1024)return 6409;if(r===1025)return 6410;if(r===1026)return 6402;if(r===1027)return 34041;if(r===1035)return a=e.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(r===1028)return 6403;if(r===1029)return 36244;if(r===1030)return 33319;if(r===1031)return 33320;if(r===1033)return 36249;if(r===33776||r===33777||r===33778||r===33779)if(o===3001)if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(r===33776)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===33777)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===33778)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===33779)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=e.get("WEBGL_compressed_texture_s3tc"),a!==null){if(r===33776)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===33777)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===33778)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===33779)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===35840||r===35841||r===35842||r===35843)if(a=e.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(r===35840)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===35841)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===35842)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===35843)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===36196)return a=e.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(r===37492||r===37496)if(a=e.get("WEBGL_compressed_texture_etc"),a!==null){if(r===37492)return o===3001?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(r===37496)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===37808||r===37809||r===37810||r===37811||r===37812||r===37813||r===37814||r===37815||r===37816||r===37817||r===37818||r===37819||r===37820||r===37821)if(a=e.get("WEBGL_compressed_texture_astc"),a!==null){if(r===37808)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===37809)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===37810)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===37811)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===37812)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===37813)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===37814)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===37815)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===37816)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===37817)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===37818)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===37819)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===37820)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===37821)return o===3001?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===36492)if(a=e.get("EXT_texture_compression_bptc"),a!==null){if(r===36492)return o===3001?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT}else return null;if(r===36283||r===36284||r===36285||r===36286)if(a=e.get("EXT_texture_compression_rgtc"),a!==null){if(r===36492)return a.COMPRESSED_RED_RGTC1_EXT;if(r===36284)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===36285)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===36286)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===1020?n?34042:(a=e.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):s[r]!==void 0?s[r]:null}return{convert:i}}class Ku extends qt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class Hn extends St{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Ju={type:"move"};class yr{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Hn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Hn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new G,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new G),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Hn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new G,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new G),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,o=null;const a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(const m of e.hand.values()){const h=t.getJointPose(m,n),y=this._getHandJoint(l,m);h!==null&&(y.matrix.fromArray(h.transform.matrix),y.matrix.decompose(y.position,y.rotation,y.scale),y.jointRadius=h.radius),y.visible=h!==null}const u=l.joints["index-finger-tip"],f=l.joints["thumb-tip"],d=u.position.distanceTo(f.position),g=.02,M=.005;l.inputState.pinching&&d>g+M?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=g-M&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Ju)))}return a!==null&&(a.visible=i!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Hn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}class Qu extends Pt{constructor(e,t,n,i,r,o,a,c,l,u){if(u=u!==void 0?u:1026,u!==1026&&u!==1027)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===1026&&(n=1014),n===void 0&&u===1027&&(n=1020),super(null,i,r,o,a,c,u,n,l),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:1003,this.minFilter=c!==void 0?c:1003,this.flipY=!1,this.generateMipmaps=!1}}class eh extends Xn{constructor(e,t){super();const n=this;let i=null,r=1,o=null,a="local-floor",c=1,l=null,u=null,f=null,d=null,g=null,M=null;const m=t.getContextAttributes();let h=null,y=null;const A=[],p=[],b=new Set,w=new Map,D=new qt;D.layers.enable(1),D.viewport=new Mt;const O=new qt;O.layers.enable(2),O.viewport=new Mt;const v=[D,O],L=new Ku;L.layers.enable(1),L.layers.enable(2);let B=null,$=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let Q=A[W];return Q===void 0&&(Q=new yr,A[W]=Q),Q.getTargetRaySpace()},this.getControllerGrip=function(W){let Q=A[W];return Q===void 0&&(Q=new yr,A[W]=Q),Q.getGripSpace()},this.getHand=function(W){let Q=A[W];return Q===void 0&&(Q=new yr,A[W]=Q),Q.getHandSpace()};function K(W){const Q=p.indexOf(W.inputSource);if(Q===-1)return;const de=A[Q];de!==void 0&&de.dispatchEvent({type:W.type,data:W.inputSource})}function z(){i.removeEventListener("select",K),i.removeEventListener("selectstart",K),i.removeEventListener("selectend",K),i.removeEventListener("squeeze",K),i.removeEventListener("squeezestart",K),i.removeEventListener("squeezeend",K),i.removeEventListener("end",z),i.removeEventListener("inputsourceschange",F);for(let W=0;W<A.length;W++){const Q=p[W];Q!==null&&(p[W]=null,A[W].disconnect(Q))}B=null,$=null,e.setRenderTarget(h),g=null,d=null,f=null,i=null,y=null,ve.stop(),n.isPresenting=!1,n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){r=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){a=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(W){l=W},this.getBaseLayer=function(){return d!==null?d:g},this.getBinding=function(){return f},this.getFrame=function(){return M},this.getSession=function(){return i},this.setSession=async function(W){if(i=W,i!==null){if(h=e.getRenderTarget(),i.addEventListener("select",K),i.addEventListener("selectstart",K),i.addEventListener("selectend",K),i.addEventListener("squeeze",K),i.addEventListener("squeezestart",K),i.addEventListener("squeezeend",K),i.addEventListener("end",z),i.addEventListener("inputsourceschange",F),m.xrCompatible!==!0&&await t.makeXRCompatible(),i.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const Q={antialias:i.renderState.layers===void 0?m.antialias:!0,alpha:m.alpha,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};g=new XRWebGLLayer(i,t,Q),i.updateRenderState({baseLayer:g}),y=new wn(g.framebufferWidth,g.framebufferHeight,{format:1023,type:1009,encoding:e.outputEncoding,stencilBuffer:m.stencil})}else{let Q=null,de=null,me=null;m.depth&&(me=m.stencil?35056:33190,Q=m.stencil?1027:1026,de=m.stencil?1020:1014);const H={colorFormat:32856,depthFormat:me,scaleFactor:r};f=new XRWebGLBinding(i,t),d=f.createProjectionLayer(H),i.updateRenderState({layers:[d]}),y=new wn(d.textureWidth,d.textureHeight,{format:1023,type:1009,depthTexture:new Qu(d.textureWidth,d.textureHeight,de,void 0,void 0,void 0,void 0,void 0,void 0,Q),stencilBuffer:m.stencil,encoding:e.outputEncoding,samples:m.antialias?4:0});const Ne=e.properties.get(y);Ne.__ignoreDepthValues=d.ignoreDepthValues}y.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await i.requestReferenceSpace(a),ve.setContext(i),ve.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}};function F(W){for(let Q=0;Q<W.removed.length;Q++){const de=W.removed[Q],me=p.indexOf(de);me>=0&&(p[me]=null,A[me].disconnect(de))}for(let Q=0;Q<W.added.length;Q++){const de=W.added[Q];let me=p.indexOf(de);if(me===-1){for(let Ne=0;Ne<A.length;Ne++)if(Ne>=p.length){p.push(de),me=Ne;break}else if(p[Ne]===null){p[Ne]=de,me=Ne;break}if(me===-1)break}const H=A[me];H&&H.connect(de)}}const Y=new G,te=new G;function ne(W,Q,de){Y.setFromMatrixPosition(Q.matrixWorld),te.setFromMatrixPosition(de.matrixWorld);const me=Y.distanceTo(te),H=Q.projectionMatrix.elements,Ne=de.projectionMatrix.elements,be=H[14]/(H[10]-1),Te=H[14]/(H[10]+1),ye=(H[9]+1)/H[5],Je=(H[9]-1)/H[5],Be=(H[8]-1)/H[0],Pe=(Ne[8]+1)/Ne[0],rt=be*Be,ht=be*Pe,ct=me/(-Be+Pe),vt=ct*-Be;Q.matrixWorld.decompose(W.position,W.quaternion,W.scale),W.translateX(vt),W.translateZ(ct),W.matrixWorld.compose(W.position,W.quaternion,W.scale),W.matrixWorldInverse.copy(W.matrixWorld).invert();const st=be+ct,Ze=Te+ct,Ct=rt-vt,Lt=ht+(me-vt),T=ye*Te/Ze*st,x=Je*Te/Ze*st;W.projectionMatrix.makePerspective(Ct,Lt,T,x,st,Ze)}function J(W,Q){Q===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices(Q.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(i===null)return;L.near=O.near=D.near=W.near,L.far=O.far=D.far=W.far,(B!==L.near||$!==L.far)&&(i.updateRenderState({depthNear:L.near,depthFar:L.far}),B=L.near,$=L.far);const Q=W.parent,de=L.cameras;J(L,Q);for(let H=0;H<de.length;H++)J(de[H],Q);L.matrixWorld.decompose(L.position,L.quaternion,L.scale),W.matrix.copy(L.matrix),W.matrix.decompose(W.position,W.quaternion,W.scale);const me=W.children;for(let H=0,Ne=me.length;H<Ne;H++)me[H].updateMatrixWorld(!0);de.length===2?ne(L,D,O):L.projectionMatrix.copy(D.projectionMatrix)},this.getCamera=function(){return L},this.getFoveation=function(){if(!(d===null&&g===null))return c},this.setFoveation=function(W){c=W,d!==null&&(d.fixedFoveation=W),g!==null&&g.fixedFoveation!==void 0&&(g.fixedFoveation=W)},this.getPlanes=function(){return b};let ue=null;function oe(W,Q){if(u=Q.getViewerPose(l||o),M=Q,u!==null){const de=u.views;g!==null&&(e.setRenderTargetFramebuffer(y,g.framebuffer),e.setRenderTarget(y));let me=!1;de.length!==L.cameras.length&&(L.cameras.length=0,me=!0);for(let H=0;H<de.length;H++){const Ne=de[H];let be=null;if(g!==null)be=g.getViewport(Ne);else{const ye=f.getViewSubImage(d,Ne);be=ye.viewport,H===0&&(e.setRenderTargetTextures(y,ye.colorTexture,d.ignoreDepthValues?void 0:ye.depthStencilTexture),e.setRenderTarget(y))}let Te=v[H];Te===void 0&&(Te=new qt,Te.layers.enable(H),Te.viewport=new Mt,v[H]=Te),Te.matrix.fromArray(Ne.transform.matrix),Te.projectionMatrix.fromArray(Ne.projectionMatrix),Te.viewport.set(be.x,be.y,be.width,be.height),H===0&&L.matrix.copy(Te.matrix),me===!0&&L.cameras.push(Te)}}for(let de=0;de<A.length;de++){const me=p[de],H=A[de];me!==null&&H!==void 0&&H.update(me,Q,l||o)}if(ue&&ue(W,Q),Q.detectedPlanes){n.dispatchEvent({type:"planesdetected",data:Q.detectedPlanes});let de=null;for(const me of b)Q.detectedPlanes.has(me)||(de===null&&(de=[]),de.push(me));if(de!==null)for(const me of de)b.delete(me),w.delete(me),n.dispatchEvent({type:"planeremoved",data:me});for(const me of Q.detectedPlanes)if(!b.has(me))b.add(me),w.set(me,Q.lastChangedTime),n.dispatchEvent({type:"planeadded",data:me});else{const H=w.get(me);me.lastChangedTime>H&&(w.set(me,me.lastChangedTime),n.dispatchEvent({type:"planechanged",data:me}))}}M=null}const ve=new Us;ve.setAnimationLoop(oe),this.setAnimationLoop=function(W){ue=W},this.dispose=function(){}}}function th(s,e){function t(m,h){h.color.getRGB(m.fogColor.value,Is(s)),h.isFog?(m.fogNear.value=h.near,m.fogFar.value=h.far):h.isFogExp2&&(m.fogDensity.value=h.density)}function n(m,h,y,A,p){h.isMeshBasicMaterial||h.isMeshLambertMaterial?i(m,h):h.isMeshToonMaterial?(i(m,h),u(m,h)):h.isMeshPhongMaterial?(i(m,h),l(m,h)):h.isMeshStandardMaterial?(i(m,h),f(m,h),h.isMeshPhysicalMaterial&&d(m,h,p)):h.isMeshMatcapMaterial?(i(m,h),g(m,h)):h.isMeshDepthMaterial?i(m,h):h.isMeshDistanceMaterial?(i(m,h),M(m,h)):h.isMeshNormalMaterial?i(m,h):h.isLineBasicMaterial?(r(m,h),h.isLineDashedMaterial&&o(m,h)):h.isPointsMaterial?a(m,h,y,A):h.isSpriteMaterial?c(m,h):h.isShadowMaterial?(m.color.value.copy(h.color),m.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=!1)}function i(m,h){m.opacity.value=h.opacity,h.color&&m.diffuse.value.copy(h.color),h.emissive&&m.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(m.map.value=h.map),h.alphaMap&&(m.alphaMap.value=h.alphaMap),h.bumpMap&&(m.bumpMap.value=h.bumpMap,m.bumpScale.value=h.bumpScale,h.side===1&&(m.bumpScale.value*=-1)),h.displacementMap&&(m.displacementMap.value=h.displacementMap,m.displacementScale.value=h.displacementScale,m.displacementBias.value=h.displacementBias),h.emissiveMap&&(m.emissiveMap.value=h.emissiveMap),h.normalMap&&(m.normalMap.value=h.normalMap,m.normalScale.value.copy(h.normalScale),h.side===1&&m.normalScale.value.negate()),h.specularMap&&(m.specularMap.value=h.specularMap),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest);const y=e.get(h).envMap;if(y&&(m.envMap.value=y,m.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=h.reflectivity,m.ior.value=h.ior,m.refractionRatio.value=h.refractionRatio),h.lightMap){m.lightMap.value=h.lightMap;const b=s.physicallyCorrectLights!==!0?Math.PI:1;m.lightMapIntensity.value=h.lightMapIntensity*b}h.aoMap&&(m.aoMap.value=h.aoMap,m.aoMapIntensity.value=h.aoMapIntensity);let A;h.map?A=h.map:h.specularMap?A=h.specularMap:h.displacementMap?A=h.displacementMap:h.normalMap?A=h.normalMap:h.bumpMap?A=h.bumpMap:h.roughnessMap?A=h.roughnessMap:h.metalnessMap?A=h.metalnessMap:h.alphaMap?A=h.alphaMap:h.emissiveMap?A=h.emissiveMap:h.clearcoatMap?A=h.clearcoatMap:h.clearcoatNormalMap?A=h.clearcoatNormalMap:h.clearcoatRoughnessMap?A=h.clearcoatRoughnessMap:h.iridescenceMap?A=h.iridescenceMap:h.iridescenceThicknessMap?A=h.iridescenceThicknessMap:h.specularIntensityMap?A=h.specularIntensityMap:h.specularColorMap?A=h.specularColorMap:h.transmissionMap?A=h.transmissionMap:h.thicknessMap?A=h.thicknessMap:h.sheenColorMap?A=h.sheenColorMap:h.sheenRoughnessMap&&(A=h.sheenRoughnessMap),A!==void 0&&(A.isWebGLRenderTarget&&(A=A.texture),A.matrixAutoUpdate===!0&&A.updateMatrix(),m.uvTransform.value.copy(A.matrix));let p;h.aoMap?p=h.aoMap:h.lightMap&&(p=h.lightMap),p!==void 0&&(p.isWebGLRenderTarget&&(p=p.texture),p.matrixAutoUpdate===!0&&p.updateMatrix(),m.uv2Transform.value.copy(p.matrix))}function r(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity}function o(m,h){m.dashSize.value=h.dashSize,m.totalSize.value=h.dashSize+h.gapSize,m.scale.value=h.scale}function a(m,h,y,A){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.size.value=h.size*y,m.scale.value=A*.5,h.map&&(m.map.value=h.map),h.alphaMap&&(m.alphaMap.value=h.alphaMap),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest);let p;h.map?p=h.map:h.alphaMap&&(p=h.alphaMap),p!==void 0&&(p.matrixAutoUpdate===!0&&p.updateMatrix(),m.uvTransform.value.copy(p.matrix))}function c(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.rotation.value=h.rotation,h.map&&(m.map.value=h.map),h.alphaMap&&(m.alphaMap.value=h.alphaMap),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest);let y;h.map?y=h.map:h.alphaMap&&(y=h.alphaMap),y!==void 0&&(y.matrixAutoUpdate===!0&&y.updateMatrix(),m.uvTransform.value.copy(y.matrix))}function l(m,h){m.specular.value.copy(h.specular),m.shininess.value=Math.max(h.shininess,1e-4)}function u(m,h){h.gradientMap&&(m.gradientMap.value=h.gradientMap)}function f(m,h){m.roughness.value=h.roughness,m.metalness.value=h.metalness,h.roughnessMap&&(m.roughnessMap.value=h.roughnessMap),h.metalnessMap&&(m.metalnessMap.value=h.metalnessMap),e.get(h).envMap&&(m.envMapIntensity.value=h.envMapIntensity)}function d(m,h,y){m.ior.value=h.ior,h.sheen>0&&(m.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),m.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(m.sheenColorMap.value=h.sheenColorMap),h.sheenRoughnessMap&&(m.sheenRoughnessMap.value=h.sheenRoughnessMap)),h.clearcoat>0&&(m.clearcoat.value=h.clearcoat,m.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(m.clearcoatMap.value=h.clearcoatMap),h.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap),h.clearcoatNormalMap&&(m.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),m.clearcoatNormalMap.value=h.clearcoatNormalMap,h.side===1&&m.clearcoatNormalScale.value.negate())),h.iridescence>0&&(m.iridescence.value=h.iridescence,m.iridescenceIOR.value=h.iridescenceIOR,m.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(m.iridescenceMap.value=h.iridescenceMap),h.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=h.iridescenceThicknessMap)),h.transmission>0&&(m.transmission.value=h.transmission,m.transmissionSamplerMap.value=y.texture,m.transmissionSamplerSize.value.set(y.width,y.height),h.transmissionMap&&(m.transmissionMap.value=h.transmissionMap),m.thickness.value=h.thickness,h.thicknessMap&&(m.thicknessMap.value=h.thicknessMap),m.attenuationDistance.value=h.attenuationDistance,m.attenuationColor.value.copy(h.attenuationColor)),m.specularIntensity.value=h.specularIntensity,m.specularColor.value.copy(h.specularColor),h.specularIntensityMap&&(m.specularIntensityMap.value=h.specularIntensityMap),h.specularColorMap&&(m.specularColorMap.value=h.specularColorMap)}function g(m,h){h.matcap&&(m.matcap.value=h.matcap)}function M(m,h){m.referencePosition.value.copy(h.referencePosition),m.nearDistance.value=h.nearDistance,m.farDistance.value=h.farDistance}return{refreshFogUniforms:t,refreshMaterialUniforms:n}}function nh(s,e,t,n){let i={},r={},o=[];const a=t.isWebGL2?s.getParameter(35375):0;function c(A,p){const b=p.program;n.uniformBlockBinding(A,b)}function l(A,p){let b=i[A.id];b===void 0&&(M(A),b=u(A),i[A.id]=b,A.addEventListener("dispose",h));const w=p.program;n.updateUBOMapping(A,w);const D=e.render.frame;r[A.id]!==D&&(d(A),r[A.id]=D)}function u(A){const p=f();A.__bindingPointIndex=p;const b=s.createBuffer(),w=A.__size,D=A.usage;return s.bindBuffer(35345,b),s.bufferData(35345,w,D),s.bindBuffer(35345,null),s.bindBufferBase(35345,p,b),b}function f(){for(let A=0;A<a;A++)if(o.indexOf(A)===-1)return o.push(A),A;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(A){const p=i[A.id],b=A.uniforms,w=A.__cache;s.bindBuffer(35345,p);for(let D=0,O=b.length;D<O;D++){const v=b[D];if(g(v,D,w)===!0){const L=v.__offset,B=Array.isArray(v.value)?v.value:[v.value];let $=0;for(let K=0;K<B.length;K++){const z=B[K],F=m(z);typeof z=="number"?(v.__data[0]=z,s.bufferSubData(35345,L+$,v.__data)):z.isMatrix3?(v.__data[0]=z.elements[0],v.__data[1]=z.elements[1],v.__data[2]=z.elements[2],v.__data[3]=z.elements[0],v.__data[4]=z.elements[3],v.__data[5]=z.elements[4],v.__data[6]=z.elements[5],v.__data[7]=z.elements[0],v.__data[8]=z.elements[6],v.__data[9]=z.elements[7],v.__data[10]=z.elements[8],v.__data[11]=z.elements[0]):(z.toArray(v.__data,$),$+=F.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(35345,L,v.__data)}}s.bindBuffer(35345,null)}function g(A,p,b){const w=A.value;if(b[p]===void 0){if(typeof w=="number")b[p]=w;else{const D=Array.isArray(w)?w:[w],O=[];for(let v=0;v<D.length;v++)O.push(D[v].clone());b[p]=O}return!0}else if(typeof w=="number"){if(b[p]!==w)return b[p]=w,!0}else{const D=Array.isArray(b[p])?b[p]:[b[p]],O=Array.isArray(w)?w:[w];for(let v=0;v<D.length;v++){const L=D[v];if(L.equals(O[v])===!1)return L.copy(O[v]),!0}}return!1}function M(A){const p=A.uniforms;let b=0;const w=16;let D=0;for(let O=0,v=p.length;O<v;O++){const L=p[O],B={boundary:0,storage:0},$=Array.isArray(L.value)?L.value:[L.value];for(let K=0,z=$.length;K<z;K++){const F=$[K],Y=m(F);B.boundary+=Y.boundary,B.storage+=Y.storage}if(L.__data=new Float32Array(B.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=b,O>0){D=b%w;const K=w-D;D!==0&&K-B.boundary<0&&(b+=w-D,L.__offset=b)}b+=B.storage}return D=b%w,D>0&&(b+=w-D),A.__size=b,A.__cache={},this}function m(A){const p={boundary:0,storage:0};return typeof A=="number"?(p.boundary=4,p.storage=4):A.isVector2?(p.boundary=8,p.storage=8):A.isVector3||A.isColor?(p.boundary=16,p.storage=12):A.isVector4?(p.boundary=16,p.storage=16):A.isMatrix3?(p.boundary=48,p.storage=48):A.isMatrix4?(p.boundary=64,p.storage=64):A.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",A),p}function h(A){const p=A.target;p.removeEventListener("dispose",h);const b=o.indexOf(p.__bindingPointIndex);o.splice(b,1),s.deleteBuffer(i[p.id]),delete i[p.id],delete r[p.id]}function y(){for(const A in i)s.deleteBuffer(i[A]);o=[],i={},r={}}return{bind:c,update:l,dispose:y}}function ih(){const s=Vi("canvas");return s.style.display="block",s}function ks(s={}){this.isWebGLRenderer=!0;const e=s.canvas!==void 0?s.canvas:ih(),t=s.context!==void 0?s.context:null,n=s.depth!==void 0?s.depth:!0,i=s.stencil!==void 0?s.stencil:!0,r=s.antialias!==void 0?s.antialias:!1,o=s.premultipliedAlpha!==void 0?s.premultipliedAlpha:!0,a=s.preserveDrawingBuffer!==void 0?s.preserveDrawingBuffer:!1,c=s.powerPreference!==void 0?s.powerPreference:"default",l=s.failIfMajorPerformanceCaveat!==void 0?s.failIfMajorPerformanceCaveat:!1;let u;t!==null?u=t.getContextAttributes().alpha:u=s.alpha!==void 0?s.alpha:!1;let f=null,d=null;const g=[],M=[];this.domElement=e,this.debug={checkShaderErrors:!0},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.outputEncoding=3e3,this.physicallyCorrectLights=!1,this.toneMapping=0,this.toneMappingExposure=1;const m=this;let h=!1,y=0,A=0,p=null,b=-1,w=null;const D=new Mt,O=new Mt;let v=null,L=e.width,B=e.height,$=1,K=null,z=null;const F=new Mt(0,0,L,B),Y=new Mt(0,0,L,B);let te=!1;const ne=new Ar;let J=!1,ue=!1,oe=null;const ve=new pt,W=new je,Q=new G,de={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function me(){return p===null?$:1}let H=t;function Ne(S,k){for(let X=0;X<S.length;X++){const U=S[X],Z=e.getContext(U,k);if(Z!==null)return Z}return null}try{const S={alpha:!0,depth:n,stencil:i,antialias:r,premultipliedAlpha:o,preserveDrawingBuffer:a,powerPreference:c,failIfMajorPerformanceCaveat:l};if("setAttribute"in e&&e.setAttribute("data-engine","three.js r149"),e.addEventListener("webglcontextlost",Re,!1),e.addEventListener("webglcontextrestored",Ae,!1),e.addEventListener("webglcontextcreationerror",Ue,!1),H===null){const k=["webgl2","webgl","experimental-webgl"];if(m.isWebGL1Renderer===!0&&k.shift(),H=Ne(k,S),H===null)throw Ne(k)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}H.getShaderPrecisionFormat===void 0&&(H.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(S){throw console.error("THREE.WebGLRenderer: "+S.message),S}let be,Te,ye,Je,Be,Pe,rt,ht,ct,vt,st,Ze,Ct,Lt,T,x,j,ce,le,fe,Ce,xe,C,Le;function De(){be=new pc(H),Te=new lc(H,be,s),be.init(Te),xe=new $u(H,be,Te),ye=new ju(H,be,Te),Je=new _c,Be=new Fu,Pe=new Zu(H,be,ye,Be,Te,xe,Je),rt=new uc(m),ht=new fc(m),ct=new Ta(H,Te),C=new ac(H,be,ct,Te),vt=new mc(H,ct,Je,C),st=new Mc(H,vt,ct,Je),le=new yc(H,Te,Pe),x=new cc(Be),Ze=new Iu(m,rt,ht,be,Te,C,x),Ct=new th(m,Be),Lt=new Uu,T=new Vu(be,Te),ce=new sc(m,rt,ht,ye,st,u,o),j=new Yu(m,st,Te),Le=new nh(H,Je,Te,ye),fe=new oc(H,be,Je,Te),Ce=new gc(H,be,Je,Te),Je.programs=Ze.programs,m.capabilities=Te,m.extensions=be,m.properties=Be,m.renderLists=Lt,m.shadowMap=j,m.state=ye,m.info=Je}De();const Se=new eh(m,H);this.xr=Se,this.getContext=function(){return H},this.getContextAttributes=function(){return H.getContextAttributes()},this.forceContextLoss=function(){const S=be.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){const S=be.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return $},this.setPixelRatio=function(S){S!==void 0&&($=S,this.setSize(L,B,!1))},this.getSize=function(S){return S.set(L,B)},this.setSize=function(S,k,X){if(Se.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}L=S,B=k,e.width=Math.floor(S*$),e.height=Math.floor(k*$),X!==!1&&(e.style.width=S+"px",e.style.height=k+"px"),this.setViewport(0,0,S,k)},this.getDrawingBufferSize=function(S){return S.set(L*$,B*$).floor()},this.setDrawingBufferSize=function(S,k,X){L=S,B=k,$=X,e.width=Math.floor(S*X),e.height=Math.floor(k*X),this.setViewport(0,0,S,k)},this.getCurrentViewport=function(S){return S.copy(D)},this.getViewport=function(S){return S.copy(F)},this.setViewport=function(S,k,X,U){S.isVector4?F.set(S.x,S.y,S.z,S.w):F.set(S,k,X,U),ye.viewport(D.copy(F).multiplyScalar($).floor())},this.getScissor=function(S){return S.copy(Y)},this.setScissor=function(S,k,X,U){S.isVector4?Y.set(S.x,S.y,S.z,S.w):Y.set(S,k,X,U),ye.scissor(O.copy(Y).multiplyScalar($).floor())},this.getScissorTest=function(){return te},this.setScissorTest=function(S){ye.setScissorTest(te=S)},this.setOpaqueSort=function(S){K=S},this.setTransparentSort=function(S){z=S},this.getClearColor=function(S){return S.copy(ce.getClearColor())},this.setClearColor=function(){ce.setClearColor.apply(ce,arguments)},this.getClearAlpha=function(){return ce.getClearAlpha()},this.setClearAlpha=function(){ce.setClearAlpha.apply(ce,arguments)},this.clear=function(S=!0,k=!0,X=!0){let U=0;S&&(U|=16384),k&&(U|=256),X&&(U|=1024),H.clear(U)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Re,!1),e.removeEventListener("webglcontextrestored",Ae,!1),e.removeEventListener("webglcontextcreationerror",Ue,!1),Lt.dispose(),T.dispose(),Be.dispose(),rt.dispose(),ht.dispose(),st.dispose(),C.dispose(),Le.dispose(),Ze.dispose(),Se.dispose(),Se.removeEventListener("sessionstart",ie),Se.removeEventListener("sessionend",he),oe&&(oe.dispose(),oe=null),Xe.stop()};function Re(S){S.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),h=!0}function Ae(){console.log("THREE.WebGLRenderer: Context Restored."),h=!1;const S=Je.autoReset,k=j.enabled,X=j.autoUpdate,U=j.needsUpdate,Z=j.type;De(),Je.autoReset=S,j.enabled=k,j.autoUpdate=X,j.needsUpdate=U,j.type=Z}function Ue(S){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function Ke(S){const k=S.target;k.removeEventListener("dispose",Ke),at(k)}function at(S){I(S),Be.remove(S)}function I(S){const k=Be.get(S).programs;k!==void 0&&(k.forEach(function(X){Ze.releaseProgram(X)}),S.isShaderMaterial&&Ze.releaseShaderCache(S))}this.renderBufferDirect=function(S,k,X,U,Z,Ee){k===null&&(k=de);const Ie=Z.isMesh&&Z.matrixWorld.determinant()<0,Oe=kt(S,k,X,U,Z);ye.setMaterial(U,Ie);let ze=X.index,qe=1;U.wireframe===!0&&(ze=vt.getWireframeAttribute(X),qe=2);const We=X.drawRange,He=X.attributes.position;let ot=We.start*qe,ge=(We.start+We.count)*qe;Ee!==null&&(ot=Math.max(ot,Ee.start*qe),ge=Math.min(ge,(Ee.start+Ee.count)*qe)),ze!==null?(ot=Math.max(ot,0),ge=Math.min(ge,ze.count)):He!=null&&(ot=Math.max(ot,0),ge=Math.min(ge,He.count));const It=ge-ot;if(It<0||It===1/0)return;C.setup(Z,U,Oe,X,ze);let Kt,lt=fe;if(ze!==null&&(Kt=ct.get(ze),lt=Ce,lt.setIndex(Kt)),Z.isMesh)U.wireframe===!0?(ye.setLineWidth(U.wireframeLinewidth*me()),lt.setMode(1)):lt.setMode(4);else if(Z.isLine){let ke=U.linewidth;ke===void 0&&(ke=1),ye.setLineWidth(ke*me()),Z.isLineSegments?lt.setMode(1):Z.isLineLoop?lt.setMode(2):lt.setMode(3)}else Z.isPoints?lt.setMode(0):Z.isSprite&&lt.setMode(4);if(Z.isInstancedMesh)lt.renderInstances(ot,It,Z.count);else if(X.isInstancedBufferGeometry){const ke=X._maxInstanceCount!==void 0?X._maxInstanceCount:1/0,En=Math.min(X.instanceCount,ke);lt.renderInstances(ot,It,En)}else lt.render(ot,It)},this.compile=function(S,k){function X(U,Z,Ee){U.transparent===!0&&U.side===2&&U.forceSinglePass===!1?(U.side=1,U.needsUpdate=!0,it(U,Z,Ee),U.side=0,U.needsUpdate=!0,it(U,Z,Ee),U.side=2):it(U,Z,Ee)}d=T.get(S),d.init(),M.push(d),S.traverseVisible(function(U){U.isLight&&U.layers.test(k.layers)&&(d.pushLight(U),U.castShadow&&d.pushShadow(U))}),d.setupLights(m.physicallyCorrectLights),S.traverse(function(U){const Z=U.material;if(Z)if(Array.isArray(Z))for(let Ee=0;Ee<Z.length;Ee++){const Ie=Z[Ee];X(Ie,S,U)}else X(Z,S,U)}),M.pop(),d=null};let q=null;function re(S){q&&q(S)}function ie(){Xe.stop()}function he(){Xe.start()}const Xe=new Us;Xe.setAnimationLoop(re),typeof self<"u"&&Xe.setContext(self),this.setAnimationLoop=function(S){q=S,Se.setAnimationLoop(S),S===null?Xe.stop():Xe.start()},Se.addEventListener("sessionstart",ie),Se.addEventListener("sessionend",he),this.render=function(S,k){if(k!==void 0&&k.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(h===!0)return;S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),k.parent===null&&k.matrixWorldAutoUpdate===!0&&k.updateMatrixWorld(),Se.enabled===!0&&Se.isPresenting===!0&&(Se.cameraAutoUpdate===!0&&Se.updateCamera(k),k=Se.getCamera()),S.isScene===!0&&S.onBeforeRender(m,S,k,p),d=T.get(S,M.length),d.init(),M.push(d),ve.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),ne.setFromProjectionMatrix(ve),ue=this.localClippingEnabled,J=x.init(this.clippingPlanes,ue),f=Lt.get(S,g.length),f.init(),g.push(f),ut(S,k,0,m.sortObjects),f.finish(),m.sortObjects===!0&&f.sort(K,z),J===!0&&x.beginShadows();const X=d.state.shadowsArray;if(j.render(X,S,k),J===!0&&x.endShadows(),this.info.autoReset===!0&&this.info.reset(),ce.render(f,S),d.setupLights(m.physicallyCorrectLights),k.isArrayCamera){const U=k.cameras;for(let Z=0,Ee=U.length;Z<Ee;Z++){const Ie=U[Z];nt(f,S,Ie,Ie.viewport)}}else nt(f,S,k);p!==null&&(Pe.updateMultisampleRenderTarget(p),Pe.updateRenderTargetMipmap(p)),S.isScene===!0&&S.onAfterRender(m,S,k),C.resetDefaultState(),b=-1,w=null,M.pop(),M.length>0?d=M[M.length-1]:d=null,g.pop(),g.length>0?f=g[g.length-1]:f=null};function ut(S,k,X,U){if(S.visible===!1)return;if(S.layers.test(k.layers)){if(S.isGroup)X=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(k);else if(S.isLight)d.pushLight(S),S.castShadow&&d.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||ne.intersectsSprite(S)){U&&Q.setFromMatrixPosition(S.matrixWorld).applyMatrix4(ve);const Ie=st.update(S),Oe=S.material;Oe.visible&&f.push(S,Ie,Oe,X,Q.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(S.isSkinnedMesh&&S.skeleton.frame!==Je.render.frame&&(S.skeleton.update(),S.skeleton.frame=Je.render.frame),!S.frustumCulled||ne.intersectsObject(S))){U&&Q.setFromMatrixPosition(S.matrixWorld).applyMatrix4(ve);const Ie=st.update(S),Oe=S.material;if(Array.isArray(Oe)){const ze=Ie.groups;for(let qe=0,We=ze.length;qe<We;qe++){const He=ze[qe],ot=Oe[He.materialIndex];ot&&ot.visible&&f.push(S,Ie,ot,X,Q.z,He)}}else Oe.visible&&f.push(S,Ie,Oe,X,Q.z,null)}}const Ee=S.children;for(let Ie=0,Oe=Ee.length;Ie<Oe;Ie++)ut(Ee[Ie],k,X,U)}function nt(S,k,X,U){const Z=S.opaque,Ee=S.transmissive,Ie=S.transparent;d.setupLightsView(X),J===!0&&x.setGlobalState(m.clippingPlanes,X),Ee.length>0&&Xt(Z,k,X),U&&ye.viewport(D.copy(U)),Z.length>0&&$e(Z,k,X),Ee.length>0&&$e(Ee,k,X),Ie.length>0&&$e(Ie,k,X),ye.buffers.depth.setTest(!0),ye.buffers.depth.setMask(!0),ye.buffers.color.setMask(!0),ye.setPolygonOffset(!1)}function Xt(S,k,X){const U=Te.isWebGL2;oe===null&&(oe=new wn(1,1,{generateMipmaps:!0,type:be.has("EXT_color_buffer_half_float")?1016:1009,minFilter:1008,samples:U&&r===!0?4:0})),m.getDrawingBufferSize(W),U?oe.setSize(W.x,W.y):oe.setSize(ki(W.x),ki(W.y));const Z=m.getRenderTarget();m.setRenderTarget(oe),m.clear();const Ee=m.toneMapping;m.toneMapping=0,$e(S,k,X),m.toneMapping=Ee,Pe.updateMultisampleRenderTarget(oe),Pe.updateRenderTargetMipmap(oe),m.setRenderTarget(Z)}function $e(S,k,X){const U=k.isScene===!0?k.overrideMaterial:null;for(let Z=0,Ee=S.length;Z<Ee;Z++){const Ie=S[Z],Oe=Ie.object,ze=Ie.geometry,qe=U===null?Ie.material:U,We=Ie.group;Oe.layers.test(X.layers)&&Ot(Oe,k,X,ze,qe,We)}}function Ot(S,k,X,U,Z,Ee){S.onBeforeRender(m,k,X,U,Z,Ee),S.modelViewMatrix.multiplyMatrices(X.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),Z.onBeforeRender(m,k,X,U,S,Ee),Z.transparent===!0&&Z.side===2&&Z.forceSinglePass===!1?(Z.side=1,Z.needsUpdate=!0,m.renderBufferDirect(X,k,U,Z,S,Ee),Z.side=0,Z.needsUpdate=!0,m.renderBufferDirect(X,k,U,Z,S,Ee),Z.side=2):m.renderBufferDirect(X,k,U,Z,S,Ee),S.onAfterRender(m,k,X,U,Z,Ee)}function it(S,k,X){k.isScene!==!0&&(k=de);const U=Be.get(S),Z=d.state.lights,Ee=d.state.shadowsArray,Ie=Z.state.version,Oe=Ze.getParameters(S,Z.state,Ee,k,X),ze=Ze.getProgramCacheKey(Oe);let qe=U.programs;U.environment=S.isMeshStandardMaterial?k.environment:null,U.fog=k.fog,U.envMap=(S.isMeshStandardMaterial?ht:rt).get(S.envMap||U.environment),qe===void 0&&(S.addEventListener("dispose",Ke),qe=new Map,U.programs=qe);let We=qe.get(ze);if(We!==void 0){if(U.currentProgram===We&&U.lightsStateVersion===Ie)return Gt(S,Oe),We}else Oe.uniforms=Ze.getUniforms(S),S.onBuild(X,Oe,m),S.onBeforeCompile(Oe,m),We=Ze.acquireProgram(Oe,ze),qe.set(ze,We),U.uniforms=Oe.uniforms;const He=U.uniforms;(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(He.clippingPlanes=x.uniform),Gt(S,Oe),U.needsLights=$n(S),U.lightsStateVersion=Ie,U.needsLights&&(He.ambientLightColor.value=Z.state.ambient,He.lightProbe.value=Z.state.probe,He.directionalLights.value=Z.state.directional,He.directionalLightShadows.value=Z.state.directionalShadow,He.spotLights.value=Z.state.spot,He.spotLightShadows.value=Z.state.spotShadow,He.rectAreaLights.value=Z.state.rectArea,He.ltc_1.value=Z.state.rectAreaLTC1,He.ltc_2.value=Z.state.rectAreaLTC2,He.pointLights.value=Z.state.point,He.pointLightShadows.value=Z.state.pointShadow,He.hemisphereLights.value=Z.state.hemi,He.directionalShadowMap.value=Z.state.directionalShadowMap,He.directionalShadowMatrix.value=Z.state.directionalShadowMatrix,He.spotShadowMap.value=Z.state.spotShadowMap,He.spotLightMatrix.value=Z.state.spotLightMatrix,He.spotLightMap.value=Z.state.spotLightMap,He.pointShadowMap.value=Z.state.pointShadowMap,He.pointShadowMatrix.value=Z.state.pointShadowMatrix);const ot=We.getUniforms(),ge=zi.seqWithValue(ot.seq,He);return U.currentProgram=We,U.uniformsList=ge,We}function Gt(S,k){const X=Be.get(S);X.outputEncoding=k.outputEncoding,X.instancing=k.instancing,X.skinning=k.skinning,X.morphTargets=k.morphTargets,X.morphNormals=k.morphNormals,X.morphColors=k.morphColors,X.morphTargetsCount=k.morphTargetsCount,X.numClippingPlanes=k.numClippingPlanes,X.numIntersection=k.numClipIntersection,X.vertexAlphas=k.vertexAlphas,X.vertexTangents=k.vertexTangents,X.toneMapping=k.toneMapping}function kt(S,k,X,U,Z){k.isScene!==!0&&(k=de),Pe.resetTextureUnits();const Ee=k.fog,Ie=U.isMeshStandardMaterial?k.environment:null,Oe=p===null?m.outputEncoding:p.isXRRenderTarget===!0?p.texture.encoding:3e3,ze=(U.isMeshStandardMaterial?ht:rt).get(U.envMap||Ie),qe=U.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,We=!!U.normalMap&&!!X.attributes.tangent,He=!!X.morphAttributes.position,ot=!!X.morphAttributes.normal,ge=!!X.morphAttributes.color,It=U.toneMapped?m.toneMapping:0,Kt=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,lt=Kt!==void 0?Kt.length:0,ke=Be.get(U),En=d.state.lights;if(J===!0&&(ue===!0||S!==w)){const wt=S===w&&U.id===b;x.setState(U,S,wt)}let dt=!1;U.version===ke.__version?(ke.needsLights&&ke.lightsStateVersion!==En.state.version||ke.outputEncoding!==Oe||Z.isInstancedMesh&&ke.instancing===!1||!Z.isInstancedMesh&&ke.instancing===!0||Z.isSkinnedMesh&&ke.skinning===!1||!Z.isSkinnedMesh&&ke.skinning===!0||ke.envMap!==ze||U.fog===!0&&ke.fog!==Ee||ke.numClippingPlanes!==void 0&&(ke.numClippingPlanes!==x.numPlanes||ke.numIntersection!==x.numIntersection)||ke.vertexAlphas!==qe||ke.vertexTangents!==We||ke.morphTargets!==He||ke.morphNormals!==ot||ke.morphColors!==ge||ke.toneMapping!==It||Te.isWebGL2===!0&&ke.morphTargetsCount!==lt)&&(dt=!0):(dt=!0,ke.__version=U.version);let Jt=ke.currentProgram;dt===!0&&(Jt=it(U,k,Z));let _i=!1,mn=!1,An=!1;const bt=Jt.getUniforms(),Qt=ke.uniforms;if(ye.useProgram(Jt.program)&&(_i=!0,mn=!0,An=!0),U.id!==b&&(b=U.id,mn=!0),_i||w!==S){if(bt.setValue(H,"projectionMatrix",S.projectionMatrix),Te.logarithmicDepthBuffer&&bt.setValue(H,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),w!==S&&(w=S,mn=!0,An=!0),U.isShaderMaterial||U.isMeshPhongMaterial||U.isMeshToonMaterial||U.isMeshStandardMaterial||U.envMap){const wt=bt.map.cameraPosition;wt!==void 0&&wt.setValue(H,Q.setFromMatrixPosition(S.matrixWorld))}(U.isMeshPhongMaterial||U.isMeshToonMaterial||U.isMeshLambertMaterial||U.isMeshBasicMaterial||U.isMeshStandardMaterial||U.isShaderMaterial)&&bt.setValue(H,"isOrthographic",S.isOrthographicCamera===!0),(U.isMeshPhongMaterial||U.isMeshToonMaterial||U.isMeshLambertMaterial||U.isMeshBasicMaterial||U.isMeshStandardMaterial||U.isShaderMaterial||U.isShadowMaterial||Z.isSkinnedMesh)&&bt.setValue(H,"viewMatrix",S.matrixWorldInverse)}if(Z.isSkinnedMesh){bt.setOptional(H,Z,"bindMatrix"),bt.setOptional(H,Z,"bindMatrixInverse");const wt=Z.skeleton;wt&&(Te.floatVertexTextures?(wt.boneTexture===null&&wt.computeBoneTexture(),bt.setValue(H,"boneTexture",wt.boneTexture,Pe),bt.setValue(H,"boneTextureSize",wt.boneTextureSize)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}const Kn=X.morphAttributes;if((Kn.position!==void 0||Kn.normal!==void 0||Kn.color!==void 0&&Te.isWebGL2===!0)&&le.update(Z,X,U,Jt),(mn||ke.receiveShadow!==Z.receiveShadow)&&(ke.receiveShadow=Z.receiveShadow,bt.setValue(H,"receiveShadow",Z.receiveShadow)),U.isMeshGouraudMaterial&&U.envMap!==null&&(Qt.envMap.value=ze,Qt.flipEnvMap.value=ze.isCubeTexture&&ze.isRenderTargetTexture===!1?-1:1),mn&&(bt.setValue(H,"toneMappingExposure",m.toneMappingExposure),ke.needsLights&&pn(Qt,An),Ee&&U.fog===!0&&Ct.refreshFogUniforms(Qt,Ee),Ct.refreshMaterialUniforms(Qt,U,$,B,oe),zi.upload(H,ke.uniformsList,Qt,Pe)),U.isShaderMaterial&&U.uniformsNeedUpdate===!0&&(zi.upload(H,ke.uniformsList,Qt,Pe),U.uniformsNeedUpdate=!1),U.isSpriteMaterial&&bt.setValue(H,"center",Z.center),bt.setValue(H,"modelViewMatrix",Z.modelViewMatrix),bt.setValue(H,"normalMatrix",Z.normalMatrix),bt.setValue(H,"modelMatrix",Z.matrixWorld),U.isShaderMaterial||U.isRawShaderMaterial){const wt=U.uniformsGroups;for(let Jn=0,Yi=wt.length;Jn<Yi;Jn++)if(Te.isWebGL2){const gn=wt[Jn];Le.update(gn,Jt),Le.bind(gn,Jt)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return Jt}function pn(S,k){S.ambientLightColor.needsUpdate=k,S.lightProbe.needsUpdate=k,S.directionalLights.needsUpdate=k,S.directionalLightShadows.needsUpdate=k,S.pointLights.needsUpdate=k,S.pointLightShadows.needsUpdate=k,S.spotLights.needsUpdate=k,S.spotLightShadows.needsUpdate=k,S.rectAreaLights.needsUpdate=k,S.hemisphereLights.needsUpdate=k}function $n(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return y},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return p},this.setRenderTargetTextures=function(S,k,X){Be.get(S.texture).__webglTexture=k,Be.get(S.depthTexture).__webglTexture=X;const U=Be.get(S);U.__hasExternalTextures=!0,U.__hasExternalTextures&&(U.__autoAllocateDepthBuffer=X===void 0,U.__autoAllocateDepthBuffer||be.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),U.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(S,k){const X=Be.get(S);X.__webglFramebuffer=k,X.__useDefaultFramebuffer=k===void 0},this.setRenderTarget=function(S,k=0,X=0){p=S,y=k,A=X;let U=!0,Z=null,Ee=!1,Ie=!1;if(S){const ze=Be.get(S);ze.__useDefaultFramebuffer!==void 0?(ye.bindFramebuffer(36160,null),U=!1):ze.__webglFramebuffer===void 0?Pe.setupRenderTarget(S):ze.__hasExternalTextures&&Pe.rebindTextures(S,Be.get(S.texture).__webglTexture,Be.get(S.depthTexture).__webglTexture);const qe=S.texture;(qe.isData3DTexture||qe.isDataArrayTexture||qe.isCompressedArrayTexture)&&(Ie=!0);const We=Be.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Z=We[k],Ee=!0):Te.isWebGL2&&S.samples>0&&Pe.useMultisampledRTT(S)===!1?Z=Be.get(S).__webglMultisampledFramebuffer:Z=We,D.copy(S.viewport),O.copy(S.scissor),v=S.scissorTest}else D.copy(F).multiplyScalar($).floor(),O.copy(Y).multiplyScalar($).floor(),v=te;if(ye.bindFramebuffer(36160,Z)&&Te.drawBuffers&&U&&ye.drawBuffers(S,Z),ye.viewport(D),ye.scissor(O),ye.setScissorTest(v),Ee){const ze=Be.get(S.texture);H.framebufferTexture2D(36160,36064,34069+k,ze.__webglTexture,X)}else if(Ie){const ze=Be.get(S.texture),qe=k||0;H.framebufferTextureLayer(36160,36064,ze.__webglTexture,X||0,qe)}b=-1},this.readRenderTargetPixels=function(S,k,X,U,Z,Ee,Ie){if(!(S&&S.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Oe=Be.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&Ie!==void 0&&(Oe=Oe[Ie]),Oe){ye.bindFramebuffer(36160,Oe);try{const ze=S.texture,qe=ze.format,We=ze.type;if(qe!==1023&&xe.convert(qe)!==H.getParameter(35739)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const He=We===1016&&(be.has("EXT_color_buffer_half_float")||Te.isWebGL2&&be.has("EXT_color_buffer_float"));if(We!==1009&&xe.convert(We)!==H.getParameter(35738)&&!(We===1015&&(Te.isWebGL2||be.has("OES_texture_float")||be.has("WEBGL_color_buffer_float")))&&!He){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}k>=0&&k<=S.width-U&&X>=0&&X<=S.height-Z&&H.readPixels(k,X,U,Z,xe.convert(qe),xe.convert(We),Ee)}finally{const ze=p!==null?Be.get(p).__webglFramebuffer:null;ye.bindFramebuffer(36160,ze)}}},this.copyFramebufferToTexture=function(S,k,X=0){const U=Math.pow(2,-X),Z=Math.floor(k.image.width*U),Ee=Math.floor(k.image.height*U);Pe.setTexture2D(k,0),H.copyTexSubImage2D(3553,X,0,0,S.x,S.y,Z,Ee),ye.unbindTexture()},this.copyTextureToTexture=function(S,k,X,U=0){const Z=k.image.width,Ee=k.image.height,Ie=xe.convert(X.format),Oe=xe.convert(X.type);Pe.setTexture2D(X,0),H.pixelStorei(37440,X.flipY),H.pixelStorei(37441,X.premultiplyAlpha),H.pixelStorei(3317,X.unpackAlignment),k.isDataTexture?H.texSubImage2D(3553,U,S.x,S.y,Z,Ee,Ie,Oe,k.image.data):k.isCompressedTexture?H.compressedTexSubImage2D(3553,U,S.x,S.y,k.mipmaps[0].width,k.mipmaps[0].height,Ie,k.mipmaps[0].data):H.texSubImage2D(3553,U,S.x,S.y,Ie,Oe,k.image),U===0&&X.generateMipmaps&&H.generateMipmap(3553),ye.unbindTexture()},this.copyTextureToTexture3D=function(S,k,X,U,Z=0){if(m.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const Ee=S.max.x-S.min.x+1,Ie=S.max.y-S.min.y+1,Oe=S.max.z-S.min.z+1,ze=xe.convert(U.format),qe=xe.convert(U.type);let We;if(U.isData3DTexture)Pe.setTexture3D(U,0),We=32879;else if(U.isDataArrayTexture)Pe.setTexture2DArray(U,0),We=35866;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}H.pixelStorei(37440,U.flipY),H.pixelStorei(37441,U.premultiplyAlpha),H.pixelStorei(3317,U.unpackAlignment);const He=H.getParameter(3314),ot=H.getParameter(32878),ge=H.getParameter(3316),It=H.getParameter(3315),Kt=H.getParameter(32877),lt=X.isCompressedTexture?X.mipmaps[0]:X.image;H.pixelStorei(3314,lt.width),H.pixelStorei(32878,lt.height),H.pixelStorei(3316,S.min.x),H.pixelStorei(3315,S.min.y),H.pixelStorei(32877,S.min.z),X.isDataTexture||X.isData3DTexture?H.texSubImage3D(We,Z,k.x,k.y,k.z,Ee,Ie,Oe,ze,qe,lt.data):X.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),H.compressedTexSubImage3D(We,Z,k.x,k.y,k.z,Ee,Ie,Oe,ze,lt.data)):H.texSubImage3D(We,Z,k.x,k.y,k.z,Ee,Ie,Oe,ze,qe,lt),H.pixelStorei(3314,He),H.pixelStorei(32878,ot),H.pixelStorei(3316,ge),H.pixelStorei(3315,It),H.pixelStorei(32877,Kt),Z===0&&U.generateMipmaps&&H.generateMipmap(We),ye.unbindTexture()},this.initTexture=function(S){S.isCubeTexture?Pe.setTextureCube(S,0):S.isData3DTexture?Pe.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?Pe.setTexture2DArray(S,0):Pe.setTexture2D(S,0),ye.unbindTexture()},this.resetState=function(){y=0,A=0,p=null,ye.reset(),C.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}class rh extends ks{}rh.prototype.isWebGL1Renderer=!0;class sh extends St{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}get autoUpdate(){return console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."),this.matrixWorldAutoUpdate}set autoUpdate(e){console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."),this.matrixWorldAutoUpdate=e}}class Vs extends jn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new et(16777215),this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const gs=new G,_s=new G,xs=new pt,Mr=new Ls,Bi=new Hi;class ah extends St{constructor(e=new Bt,t=new Vs){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let i=1,r=t.count;i<r;i++)gs.fromBufferAttribute(t,i-1),_s.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=gs.distanceTo(_s);e.setAttribute("lineDistance",new mt(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const n=this.geometry,i=this.matrixWorld,r=e.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Bi.copy(n.boundingSphere),Bi.applyMatrix4(i),Bi.radius+=r,e.ray.intersectsSphere(Bi)===!1)return;xs.copy(i).invert(),Mr.copy(e.ray).applyMatrix4(xs);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=new G,u=new G,f=new G,d=new G,g=this.isLineSegments?2:1,M=n.index,h=n.attributes.position;if(M!==null){const y=Math.max(0,o.start),A=Math.min(M.count,o.start+o.count);for(let p=y,b=A-1;p<b;p+=g){const w=M.getX(p),D=M.getX(p+1);if(l.fromBufferAttribute(h,w),u.fromBufferAttribute(h,D),Mr.distanceSqToSegment(l,u,d,f)>c)continue;d.applyMatrix4(this.matrixWorld);const v=e.ray.origin.distanceTo(d);v<e.near||v>e.far||t.push({distance:v,point:f.clone().applyMatrix4(this.matrixWorld),index:p,face:null,faceIndex:null,object:this})}}else{const y=Math.max(0,o.start),A=Math.min(h.count,o.start+o.count);for(let p=y,b=A-1;p<b;p+=g){if(l.fromBufferAttribute(h,p),u.fromBufferAttribute(h,p+1),Mr.distanceSqToSegment(l,u,d,f)>c)continue;d.applyMatrix4(this.matrixWorld);const D=e.ray.origin.distanceTo(d);D<e.near||D>e.far||t.push({distance:D,point:f.clone().applyMatrix4(this.matrixWorld),index:p,face:null,faceIndex:null,object:this})}}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){const a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}class vs extends Pt{constructor(e,t,n,i,r,o,a,c,l){super(e,t,n,i,r,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Rr extends Bt{constructor(e=1,t=32,n=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:i},t=Math.max(3,t);const r=[],o=[],a=[],c=[],l=new G,u=new je;o.push(0,0,0),a.push(0,0,1),c.push(.5,.5);for(let f=0,d=3;f<=t;f++,d+=3){const g=n+f/t*i;l.x=e*Math.cos(g),l.y=e*Math.sin(g),o.push(l.x,l.y,l.z),a.push(0,0,1),u.x=(o[d]/e+1)/2,u.y=(o[d+1]/e+1)/2,c.push(u.x,u.y)}for(let f=1;f<=t;f++)r.push(f,f+1,0);this.setIndex(r),this.setAttribute("position",new mt(o,3)),this.setAttribute("normal",new mt(a,3)),this.setAttribute("uv",new mt(c,2))}static fromJSON(e){return new Rr(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class Yt extends Bt{constructor(e=1,t=1,n=1,i=32,r=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:c};const l=this;i=Math.floor(i),r=Math.floor(r);const u=[],f=[],d=[],g=[];let M=0;const m=[],h=n/2;let y=0;A(),o===!1&&(e>0&&p(!0),t>0&&p(!1)),this.setIndex(u),this.setAttribute("position",new mt(f,3)),this.setAttribute("normal",new mt(d,3)),this.setAttribute("uv",new mt(g,2));function A(){const b=new G,w=new G;let D=0;const O=(t-e)/n;for(let v=0;v<=r;v++){const L=[],B=v/r,$=B*(t-e)+e;for(let K=0;K<=i;K++){const z=K/i,F=z*c+a,Y=Math.sin(F),te=Math.cos(F);w.x=$*Y,w.y=-B*n+h,w.z=$*te,f.push(w.x,w.y,w.z),b.set(Y,O,te).normalize(),d.push(b.x,b.y,b.z),g.push(z,1-B),L.push(M++)}m.push(L)}for(let v=0;v<i;v++)for(let L=0;L<r;L++){const B=m[L][v],$=m[L+1][v],K=m[L+1][v+1],z=m[L][v+1];u.push(B,$,z),u.push($,K,z),D+=6}l.addGroup(y,D,0),y+=D}function p(b){const w=M,D=new je,O=new G;let v=0;const L=b===!0?e:t,B=b===!0?1:-1;for(let K=1;K<=i;K++)f.push(0,h*B,0),d.push(0,B,0),g.push(.5,.5),M++;const $=M;for(let K=0;K<=i;K++){const F=K/i*c+a,Y=Math.cos(F),te=Math.sin(F);O.x=L*te,O.y=h*B,O.z=L*Y,f.push(O.x,O.y,O.z),d.push(0,B,0),D.x=Y*.5+.5,D.y=te*.5*B+.5,g.push(D.x,D.y),M++}for(let K=0;K<i;K++){const z=w+K,F=$+K;b===!0?u.push(F,F+1,z):u.push(F+1,F,z),v+=3}l.addGroup(y,v,b===!0?1:2),y+=v}}static fromJSON(e){return new Yt(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Wi extends Bt{constructor(e=.5,t=1,n=32,i=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:i,thetaStart:r,thetaLength:o},n=Math.max(3,n),i=Math.max(1,i);const a=[],c=[],l=[],u=[];let f=e;const d=(t-e)/i,g=new G,M=new je;for(let m=0;m<=i;m++){for(let h=0;h<=n;h++){const y=r+h/n*o;g.x=f*Math.cos(y),g.y=f*Math.sin(y),c.push(g.x,g.y,g.z),l.push(0,0,1),M.x=(g.x/t+1)/2,M.y=(g.y/t+1)/2,u.push(M.x,M.y)}f+=d}for(let m=0;m<i;m++){const h=m*(n+1);for(let y=0;y<n;y++){const A=y+h,p=A,b=A+n+1,w=A+n+2,D=A+1;a.push(p,b,D),a.push(b,w,D)}}this.setIndex(a),this.setAttribute("position",new mt(c,3)),this.setAttribute("normal",new mt(l,3)),this.setAttribute("uv",new mt(u,2))}static fromJSON(e){return new Wi(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}class hi extends Bt{constructor(e=1,t=32,n=16,i=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const c=Math.min(o+a,Math.PI);let l=0;const u=[],f=new G,d=new G,g=[],M=[],m=[],h=[];for(let y=0;y<=n;y++){const A=[],p=y/n;let b=0;y==0&&o==0?b=.5/t:y==n&&c==Math.PI&&(b=-.5/t);for(let w=0;w<=t;w++){const D=w/t;f.x=-e*Math.cos(i+D*r)*Math.sin(o+p*a),f.y=e*Math.cos(o+p*a),f.z=e*Math.sin(i+D*r)*Math.sin(o+p*a),M.push(f.x,f.y,f.z),d.copy(f).normalize(),m.push(d.x,d.y,d.z),h.push(D+b,1-p),A.push(l++)}u.push(A)}for(let y=0;y<n;y++)for(let A=0;A<t;A++){const p=u[y][A+1],b=u[y][A],w=u[y+1][A],D=u[y+1][A+1];(y!==0||o>0)&&g.push(p,b,D),(y!==n-1||c<Math.PI)&&g.push(b,w,D)}this.setIndex(g),this.setAttribute("position",new mt(M,3)),this.setAttribute("normal",new mt(m,3)),this.setAttribute("uv",new mt(h,2))}static fromJSON(e){return new hi(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class ln extends jn{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new et(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new et(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new je(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Ws extends St{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new et(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}class oh extends Ws{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(St.DEFAULT_UP),this.updateMatrix(),this.groundColor=new et(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const Sr=new pt,ys=new G,Ms=new G;class lh{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new je(512,512),this.map=null,this.mapPass=null,this.matrix=new pt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ar,this._frameExtents=new je(1,1),this._viewportCount=1,this._viewports=[new Mt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;ys.setFromMatrixPosition(e.matrixWorld),t.position.copy(ys),Ms.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ms),t.updateMatrixWorld(),Sr.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Sr),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Sr)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class ch extends lh{constructor(){super(new Cr(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Ss extends Ws{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(St.DEFAULT_UP),this.updateMatrix(),this.target=new St,this.shadow=new ch}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"149"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="149");(function(){const s=document.getElementById("err");function e(_){s&&(s.style.display="block",s.textContent="Error: "+_),console.error(_)}const t={window:3,winScore:3,maxPlays:24,R_cover:14,lengthGain:.9,baseGuess:.35,guessGain:.65,alignThreshold:0,shootRange:30,keeperReach:20,baseGoal:.8,keeperStop:.7,setupTime:.55,resultTime:1.05,slowScale:.34,playerSpeed:26,driftSpeed:9},n={you:5301186,cpu:15414911,gkYou:28915,gkCpu:7940298,aim:16098851,ghost:16448250},i={you:"#50e3c2",cpu:"#eb367f",goal:"#50e3c2",bad:"#eb367f",warn:"#f5a623"},r=(_,E,R)=>_<E?E:_>R?R:_,o=(_,E,R)=>_+(E-_)*R,a=(_,E)=>Math.hypot(_.x-E.x,_.y-E.y),c=(_,E)=>Math.hypot(_,E);function l(_,E){const R=Math.hypot(_,E);return R<1e-9?{x:0,y:0,l:0}:{x:_/R,y:E/R,l:R}}function u(_,E,R){const N=R.x-E.x,V=R.y-E.y,P=N*N+V*V;let ae=P>1e-9?((_.x-E.x)*N+(_.y-E.y)*V)/P:0;ae=r(ae,0,1);const se={x:E.x+N*ae,y:E.y+V*ae};return{Q:se,t:ae,dist:Math.hypot(_.x-se.x,_.y-se.y)}}function f(_){let E=_>>>0;return function(){E=E+1831565813|0;let R=Math.imul(E^E>>>15,1|E);return R=R+Math.imul(R^R>>>7,61|R)^R,((R^R>>>14)>>>0)/4294967296}}function d(_,E,R){let N=2166136261^_>>>0;return[E,R||0].forEach(V=>{N^=V>>>0,N=Math.imul(N,16777619)}),N>>>0}function g(_,E,R){let N=0;for(let P=0;P<E.length;P++)N+=Math.max(0,E[P]);if(N<=1e-9)return{item:_[Math.floor(R()*_.length)],index:-1};let V=R()*N;for(let P=0;P<_.length;P++)if(V-=Math.max(0,E[P]),V<=0)return{item:_[P],index:P};return{item:_[_.length-1],index:_.length-1}}const M=(_,E,R)=>E+(R-E)*_();function m(_,E,R){const N=R.pos,V=u(N,_,E),P=a(_,E),ae=t.R_cover*(1+t.lengthGain*P/100),se=r(1-V.dist/ae,0,1);let ee=0;const _e=R.guess;if(_e&&(_e.x!==0||_e.y!==0)){const we=c(_e.x,_e.y),Fe=V.Q.x-N.x,Ye=V.Q.y-N.y,Qe=c(Fe,Ye);we>1e-9&&Qe>1e-9&&(ee=_e.x/we*(Fe/Qe)+_e.y/we*(Ye/Qe))}const Me=r((ee-t.alignThreshold+1)/2,0,1);return{pd:r(se*(t.baseGuess+t.guessGain*Me),0,1),geo:se,guessFactor:Me,a:ee,Q:V.Q,dist:V.dist,laneLen:P,R_eff:ae}}function h(_,E,R){let N=1;for(let V=0;V<R.length;V++)N*=1-m(_,E,R[V]).pd;return r(1-N,0,.95)}function y(_,E){const R=_.C,N=_.T,V=_.defenders||[],P=_.goal||{x:50,y:100},ae=_.keeper||{pos:{x:P.x,y:P.y}};let se=1,ee=null;for(let _e=0;_e<V.length;_e++){const Me=V[_e],Ge=m(R,N,Me);(!ee||Ge.pd>ee.pd)&&(ee={pd:Ge.pd,q:Ge.Q,d:Me.id,geo:Ge.geo}),se*=1-Ge.pd}if(se=r(1-se,0,.95),E()<se)return{type:"INTERCEPTION",at:{x:ee.q.x,y:ee.q.y},defender:ee.d,pIntercept:se,pGoal:null};if(a(N,P)<=t.shootRange){const _e=r(1-a(N,P)/t.shootRange,0,1),Me=r(1-Math.abs(N.x-50)/50,.3,1),Ge=u(ae.pos,R,N).dist,we=r(1-Ge/t.keeperReach,0,1),Fe=r(t.baseGoal*(.5+.5*_e)*Me-we*t.keeperStop,.03,.97);return E()<Fe?{type:"GOAL",at:{x:N.x,y:N.y},pIntercept:se,pGoal:Fe}:{type:"SAVE",at:{x:N.x,y:N.y},pIntercept:se,pGoal:Fe}}return{type:"COMPLETE",at:{x:N.x,y:N.y},pIntercept:se,pGoal:null}}function A(_){const E=[],R=(V,P,ae)=>E.push({name:V,pass:!!P,detail:ae});{const V={x:50,y:20},P={x:50,y:70},ae=Me=>({id:"d",pos:{x:57,y:45},guess:Me}),se=h(V,P,[ae({x:-1,y:0})]),ee=h(V,P,[ae({x:1,y:0})]),_e=h(V,P,[ae(null)]);R("better guess ⇒ higher pIntercept",se>_e&&_e>ee,{correct:+se.toFixed(4),unset:+_e.toFixed(4),wrong:+ee.toFixed(4)})}{const V={x:50,y:20},P={id:"d",pos:{x:56,y:30},guess:{x:-1,y:0}},ae=h(V,{x:50,y:40},[P]),se=h(V,{x:50,y:90},[P]);R("longer pass ⇒ higher pIntercept",se>ae,{laneLen20:+ae.toFixed(4),laneLen70:+se.toFixed(4)})}{const V={x:50,y:20},P={x:50,y:80},ae={x:-1,y:0},se=h(V,P,[{id:"a",pos:{x:58,y:40},guess:ae}]),ee=h(V,P,[{id:"a",pos:{x:58,y:40},guess:ae},{id:"b",pos:{x:44,y:60},guess:{x:1,y:0}}]),_e=h(V,P,[{id:"a",pos:{x:70,y:40},guess:ae}]),Me=h(V,P,[{id:"a",pos:{x:54,y:40},guess:ae}]);R("more defenders ⇒ higher pIntercept",ee>se,{one:+se.toFixed(4),two:+ee.toFixed(4)}),R("closer defender ⇒ higher pIntercept",Me>_e,{near:+Me.toFixed(4),far:+_e.toFixed(4)})}{const V={x:50,y:20},P={x:50,y:80},ae={id:"x",pos:{x:96,y:50},guess:{x:-1,y:0}},se=m(V,P,ae),ee=h(V,P,[ae]);R("geo = 0 ⇒ pd = 0 (guess cannot help)",se.geo===0&&se.pd===0&&ee===0,{geo:se.geo,pd:se.pd,pIntercept:+ee.toFixed(4)})}{const V=f(7),P={};let ae=!0;for(let se=0;se<4e3;se++){const ee={x:50,y:M(V,10,40)},_e={x:M(V,25,75),y:M(V,45,92)},Me=[0,1,2].map(we=>({id:we,pos:{x:M(V,20,80),y:M(V,40,96)},guess:V()<.7?l(V()-.5,V()-.5):null})),Ge=y({C:ee,T:_e,defenders:Me,keeper:{pos:{x:50,y:95}},goal:{x:50,y:100}},V);P[Ge.type]=(P[Ge.type]||0)+1,["COMPLETE","INTERCEPTION","GOAL","SAVE"].indexOf(Ge.type)<0&&(ae=!1),(Ge.pIntercept<0||Ge.pIntercept>.95)&&(ae=!1)}R("4000 random plays: valid outcomes, bounded pIntercept",ae&&Object.keys(P).length>=3,P)}const N=E.every(V=>V.pass);return _!==!1&&(console.groupCollapsed("%c§4 verification — "+(N?"ALL PASS":"FAILURES"),"color:"+(N?"#50e3c2":"#eb367f")+";font-weight:bold"),console.table(E.map(V=>({test:V.name,pass:V.pass,detail:JSON.stringify(V.detail)}))),console.groupEnd(),typeof window<"u"&&(window.__GAP_VERIFY_RESULTS=E)),{allPass:N,results:E}}const p={phase:"idle",possession:"you",progress:.05,humanScore:0,cpuScore:0,plays:0,decisionEndsAt:0,remaining:t.window,difficulty:.6,seed:0,timeScale:1,trauma:0,paused:!1,humanLocked:!1,cpuLocked:!1,humanChoice:null,cpuChoice:null,outcome:null,phaseT:0,reduceMotion:window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches},b={map:{},on(_,E){(this.map[_]=this.map[_]||[]).push(E)},emit(_,E){(this.map[_]||[]).forEach(R=>R(E))}},w={goalW:7.32},D={you:{x:50,y:100},cpu:{x:50,y:0}},O=_=>_==="you"?D.you:D.cpu,v=_=>_==="you"?"cpu":"you";function L(_,E){return _==="you"?20+62*E:80-62*E}function B(_,E){return r(_==="you"?(E-20)/62:(80-E)/62,.03,.97)}const $=document.getElementById("scene"),K=ra.degToRad(34),z=1/Math.cos(K),F={hw:53,hh:56};let Y;try{Y=new ks({canvas:$,antialias:!0,alpha:!1})}catch(_){e("WebGL is unavailable in this browser: "+_.message);return}Y.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),Y.setClearColor(463119,1);const te=new sh,ne=new Cr(-1,1,1,-1,-400,400);ne.position.set(0,130*Math.cos(K),130*Math.sin(K)),ne.up.set(0,1,0),ne.lookAt(0,0,0),te.add(new oh(12577279,1058079,.85));const J=new Ss(16777215,.9);J.position.set(-40,80,-30),te.add(J);const ue=new Ss(10475519,.35);ue.position.set(50,30,60),te.add(ue);const oe=_=>_-50,ve=_=>(50-_)*z;function W(_){const E=_/100,R=we=>we*E,N=we=>(100-we)*E,V=document.createElement("canvas");V.width=V.height=_;const P=V.getContext("2d");P.fillStyle="#171717",P.fillRect(0,0,_,_);for(let we=0;we<10;we++)we%2||(P.fillStyle="#1d1d1d",P.fillRect(0,we*10*E,_,10*E));for(let we=0;we<_*7;we++){const Fe=Math.random()*_,Ye=Math.random()*_;P.fillStyle=Math.random()<.5?"rgba(255,255,255,.022)":"rgba(0,0,0,.05)",P.fillRect(Fe,Ye,2,2)}const ae=P.createRadialGradient(_/2,_/2,_*.1,_/2,_/2,_*.72);ae.addColorStop(0,"rgba(255,255,255,.075)"),ae.addColorStop(1,"rgba(0,0,0,.28)"),P.fillStyle=ae,P.fillRect(0,0,_,_),P.strokeStyle="rgba(250,250,250,.48)",P.lineWidth=Math.max(2,.26*E),P.lineCap="round";const se=(we,Fe,Ye,Qe)=>{P.beginPath(),P.rect(R(we),N(Qe),(Ye-we)*E,(Qe-Fe)*E),P.stroke()},ee=(we,Fe,Ye,Qe)=>{P.beginPath(),P.moveTo(R(we),N(Fe)),P.lineTo(R(Ye),N(Qe)),P.stroke()},_e=(we,Fe,Ye,Qe,en)=>{P.beginPath(),P.arc(R(we),N(Fe),Ye*E,Qe===void 0?0:Qe,en===void 0?Math.PI*2:en),P.stroke()};se(2,2,98,98),ee(2,50,98,50),_e(50,50,9),P.fillStyle="rgba(250,250,250,.48)",P.beginPath(),P.arc(R(50),N(50),.7*E,0,Math.PI*2),P.fill(),se(31,2,69,18),se(32.5,2,67.5,7.5),se(31,82,69,98),se(32.5,92.5,67.5,98),[13,87].forEach(we=>{P.beginPath(),P.arc(R(50),N(we),.7*E,0,Math.PI*2),P.fill();const Fe=Math.abs(18-we),Ye=Math.sqrt(Math.max(0,81-Fe*Fe)),Qe=Math.atan2(N(18)-N(we)<0?-Fe*E:Fe*E,Ye*E);we<50?_e(50,we,9,-Math.PI+Math.abs(Qe),-Math.abs(Qe)):_e(50,we,9,Math.abs(Qe),Math.PI-Math.abs(Qe))}),[[2,2,0,Math.PI/2],[98,2,Math.PI/2,Math.PI],[98,98,Math.PI,Math.PI*1.5],[2,98,Math.PI*1.5,Math.PI*2]].forEach(([we,Fe,Ye,Qe])=>_e(we,Fe,1,Ye,Qe));function Me(we,Fe){const Ye=w.goalW,Qe=2.6,en=we-Ye/2,xi=we+Ye/2,Qn=Fe<0?2-Qe:98,$i=Fe<0?2:98+Qe;P.save(),P.strokeStyle="rgba(255,255,255,.30)",P.lineWidth=Math.max(1,.07*E);for(let tn=0;tn<=12;tn++)ee(en+(xi-en)*tn/12,Qn,en+(xi-en)*tn/12,$i);for(let tn=0;tn<=6;tn++)ee(en,Qn+($i-Qn)*tn/6,xi,Qn+($i-Qn)*tn/6);P.restore(),P.strokeStyle="rgba(255,255,255,.85)",P.lineWidth=Math.max(3,.4*E),ee(en,Fe<0?2:98,xi,Fe<0?2:98)}Me(50,1),Me(50,-1),P.save(),P.globalAlpha=.14,P.fillStyle=i.cyan,P.fillRect(0,N(0)-0,_,0),P.fillStyle=i.cyan,P.fillRect(R(31),N(0),38*E,0),P.restore(),P.fillStyle="rgba(120,225,208,.85)",P.font="900 "+Math.round(2.6*E)+"px ui-sans-serif, system-ui, sans-serif",P.textAlign="center",P.fillText("YOUR GOAL",R(50),N(6.4)),P.fillStyle="rgba(255,131,110,.85)",P.fillText("CPU GOAL",R(50),N(93.2));const Ge=new vs(V);return Ge.anisotropy=Y.capabilities.getMaxAnisotropy?Y.capabilities.getMaxAnisotropy():1,Ge}const Q=new tt(new fi(100,100*z),new ln({map:W(1280)}));Q.rotation.x=-Math.PI/2,Q.position.y=0,te.add(Q);const de=new tt(new fi(400,400*z),new Vn({color:662038}));de.rotation.x=-Math.PI/2,de.position.y=-.06,te.add(de);function me(_){const E=new Hn,R=new ln({color:15923188}),N=w.goalW/2,V=3,P=2.6,ae=(Me,Ge)=>{const we=new tt(new Yt(.24,.24,V,10),R);we.position.set(Me,V/2,Ge),E.add(we)},se=(Me,Ge,we,Fe,Ye)=>{const Qe=new tt(new Yt(.2,.2,Fe,8),R);Qe.rotation.z=Math.PI/2,Qe.position.set(Me,Ge,we),E.add(Qe)},ee=ve(_),_e=ve(_+(_>=50?P:-P));return ae(-N,ee),ae(N,ee),ae(-N,_e),ae(N,_e),se(0,V,ee,w.goalW+.5),se(0,V*.62,_e,w.goalW+.5),[-1,1].forEach(Me=>{const Ge=new tt(new Yt(.13,.13,Math.hypot(P*z,V*.38),6),R);Ge.position.set(Me*N,V*.81,(ee+_e)/2),Ge.rotation.x=Math.atan2(P*z,V*.38),E.add(Ge)}),te.add(E),E}me(100),me(0);const H=(()=>{const _=document.createElement("canvas");_.width=_.height=128;const E=_.getContext("2d"),R=E.createRadialGradient(64,64,2,64,64,62);return R.addColorStop(0,"rgba(0,0,0,.45)"),R.addColorStop(.55,"rgba(0,0,0,.22)"),R.addColorStop(1,"rgba(0,0,0,0)"),E.fillStyle=R,E.fillRect(0,0,128,128),new vs(_)})(),Ne=[15845797,14394745,9262372,13010498,11104575],be={you:new ln({color:n.you}),cpu:new ln({color:n.cpu}),gkYou:new ln({color:n.gkYou}),gkCpu:new ln({color:n.gkCpu})},Te={};function ye(_,E){const R=_+":"+E;if(!Te[R]){const N=new Yt(_,_*.84,E,8);N.translate(0,-E/2,0),Te[R]=N}return Te[R]}function Je(_,E){const R=new Hn,N=new ln({color:Ne[Math.floor(Math.random()*Ne.length)]}),V=new ln({color:1123358}),P=new tt(new Yt(.52,.63,1.5,12),_);P.position.y=2.42;const ae=new tt(new Yt(.5,.42,.52,12),V);ae.position.y=1.45;const se=new tt(new hi(.46,14,12),N);se.position.y=3.55;const ee=new tt(new hi(.47,12,8,0,Math.PI*2,0,Math.PI*.45),V);ee.position.y=3.58;const _e=new tt(ye(.2,1.22),N);_e.position.set(-.24,1.22,0);const Me=new tt(ye(.2,1.22),N);Me.position.set(.24,1.22,0);const Ge=new tt(ye(.15,1.3),N);Ge.position.set(-.72,3,0);const we=new tt(ye(.15,1.3),N);we.position.set(.72,3,0);const Fe=new tt(new Yt(.22,.2,.62,8),_);Fe.position.set(-.72,2.72,0);const Ye=new tt(new Yt(.22,.2,.62,8),_);return Ye.position.set(.72,2.72,0),R.add(P,ae,se,ee,_e,Me,Ge,we,Fe,Ye),R.userData.limbs={legL:_e,legR:Me,armL:Ge,armR:we,sleeveL:Fe,sleeveR:Ye,torso:P,head:se},R}function Be(_){const E=new tt(new Rr(_,22),new Vn({map:H,transparent:!0,depthWrite:!1}));return E.rotation.x=-Math.PI/2,E.position.y=.03,E}const Pe=new Wi(1.55,2,34),rt=[];let ht={};function ct(_,E,R){const N=E==="keeper"?_==="you"?be.gkYou:be.gkCpu:_==="you"?be.you:be.cpu,V=Je(N),P=new tt(Pe,new Vn({color:n.aim,transparent:!0,opacity:0,side:2,depthWrite:!1}));P.rotation.x=-Math.PI/2,P.position.y=.05;const ae=Be(1.15);te.add(V,P,ae);const se={id:_+R,team:_,role:E,num:R,label:E==="keeper"?_==="you"?"YOU-GK":"CPU-GK":(_==="you"?"YOU":"CPU")+"-"+R,x:50,y:50,tx:50,ty:50,dest:null,mesh:V,ring:P,shadow:ae,yaw:_==="you"?Math.PI:0,walk:0,px:50,py:50,hasBall:!1,selected:!1,guess:null,speed:t.playerSpeed};return V.position.set(oe(se.x),0,ve(se.y)),rt.push(se),ht[se.id]=se,se}for(let _=1;_<=4;_++)ct("you","outfield",_);ct("you","keeper",5);for(let _=1;_<=4;_++)ct("cpu","outfield",_);ct("cpu","keeper",5);const vt=_=>rt.filter(E=>E.team===_&&E.role==="outfield");function st(_){_.mesh.position.set(oe(_.x),_.mesh.position.y,ve(_.y)),_.ring.position.set(oe(_.x),.06,ve(_.y)),_.shadow.position.set(oe(_.x),.03,ve(_.y))}function Ze(_,E){const R=_.x-_.px,N=_.y-_.py;_.px=_.x,_.py=_.y;const V=Math.hypot(R,N)/Math.max(E,.001),P=r(V/t.playerSpeed,0,1);_.walk+=V*E*.22;const ae=Math.sin(_.walk*6)*.85*P,se=_.mesh.userData.limbs;if(se.legL.rotation.x=ae,se.legR.rotation.x=-ae,se.armL.rotation.x=-ae*.8,se.armR.rotation.x=ae*.8,se.sleeveL.rotation.x=-ae*.8,se.sleeveR.rotation.x=ae*.8,_.mesh.position.y=Math.abs(Math.sin(_.walk*6))*.13*P,V>.6){let _e=Math.atan2(R,-N)-_.yaw;for(;_e>Math.PI;)_e-=Math.PI*2;for(;_e<-Math.PI;)_e+=Math.PI*2;_.yaw+=_e*Math.min(1,E*9)}_.mesh.rotation.y=_.yaw}function Ct(_,E,R,N,V){const P=E-_.x,ae=R-_.y,se=Math.hypot(P,ae);if(se<.06)return _.x=E,_.y=R,!0;const ee=Math.min(N*V,se);return _.x=r(_.x+P/se*ee,3,97),_.y=r(_.y+ae/se*ee,3,97),!1}const Lt=new tt(new hi(.42,14,12),new ln({color:16777215})),T=Be(.6);te.add(Lt,T);const x={x:50,y:50,h:.42,mode:"held",holder:null,from:null,to:null,t:0,dur:.5,arc:1.2,onArrive:null};function j(_,E,R){x.x=_,x.y=E,x.h=R}function ce(_,E){const R=new Bt().setFromPoints([new G,new G]),N=new ah(R,new Vs({color:_,transparent:!0,opacity:.9}));return N.visible=!1,te.add(N),N.setEnds=(V,P)=>{N.geometry.setFromPoints([new G(oe(V.x),.1,ve(V.y)),new G(oe(P.x),.1,ve(P.y))]),N.geometry.computeBoundingSphere()},N}const le=ce(n.aim),fe=[];for(let _=0;_<8;_++)fe.push(ce(n.cpu));const Ce=new tt(new Wi(.9,1.25,24),new Vn({color:n.aim,transparent:!0,opacity:.8,side:2,depthWrite:!1}));Ce.rotation.x=-Math.PI/2,Ce.visible=!1,te.add(Ce);function xe(){rt.forEach(_=>{const E=_.selected||C&&C.carrier===_&&_.team==="you";_.ring.material.opacity=E?.9:0,_.ring.material.color.setHex((_.selected,n.aim)),_.ring.scale.setScalar(_.selected?1.08:1)})}let C=null;function Le(_,E,R,N){const V=()=>M(N,-3,3),P=(ee,_e,Me)=>({x:r(o(E.x,R.x,ee)+_e+V(),5,95),y:r(o(E.y,R.y,ee)+Me+V(),5,95)}),ae=[P(.3,-19,0),P(.3,19,0),P(.72,0,0)],se=vt(_).filter(ee=>ee!==E);return se.forEach((ee,_e)=>{const Me=ae[_e%ae.length];ee.ax=Me.x,ee.ay=Me.y,ee.x=Me.x,ee.y=Me.y,ee.px=Me.x,ee.py=Me.y,ee.tx=Me.x,ee.ty=Me.y,ee.dest=null}),{runner:se[2]||se[se.length-1],mates:se}}function De(_,E,R,N){const V=()=>M(N,-3.2,3.2),P=(ee,_e)=>({x:r(o(E.x,R.x,ee)+_e+V(),5,95),y:r(o(E.y,R.y,ee)+V(),5,95)}),ae=[P(.42,-15),P(.42,15),P(.63,0),P(.84,-9)],se=vt(_);return se.forEach((ee,_e)=>{const Me=ae[_e%ae.length];ee.ax=Me.x,ee.ay=Me.y,ee.x=Me.x,ee.y=Me.y,ee.px=Me.x,ee.py=Me.y,ee.tx=Me.x,ee.ty=Me.y,ee.dest=null,ee.guess=null}),se}function Se(){const _=ht.you5,E=ht.cpu5,R=(N,V,P)=>{N.ax=V,N.ay=P,N.tx=V,N.ty=P,N.x=V,N.y=P,N.px=V,N.py=P,N.dest=null};R(_,r(50,8,92),5.5),R(E,r(50,8,92),94.5)}function Re(_,E,R,N,V){const P=C.mates,ae=P.map(Me=>{const Ge=a(Me,R);return .2+(1-h(E,Me,_.map(Fe=>({id:Fe.id,pos:Fe,guess:null}))))*.9+(Ge<=t.shootRange?.8:.1)+r(1-Ge/90,0,1)*.4}),se=g(P,ae,V).item||P[0],ee=r(Math.round(1+3*N),1,_.length),_e=_.slice().sort(()=>V()-.5);_.forEach((Me,Ge)=>{if(!(_e.indexOf(Me)<ee)){Me.guess=null;return}if(V()>.25+.75*N){Me.guess=l(M(V,-1,1),M(V,-1,1)),Me.guess.l||(Me.guess={x:0,y:0});return}const Fe=l(se.x-Me.x,se.y-Me.y),Ye=l(E.x-Me.x,E.y-Me.y);Me.guess=l(Fe.x*.78+Ye.x*.22,Fe.y*.78+Ye.y*.22)})}function Ae(_,E,R,N,V){const P=C.mates,ae=P.map(se=>{const _e=1-h(_,se,R.map(Qe=>({id:Qe.id,pos:Qe,guess:null}))),Me=a(_,se),Ge=r(1-Math.abs(Me-30)/42,0,1),we=r((a(_,E)-a(se,E))/60,0,1),Fe=a(se,E)<=t.shootRange?.5:0,Ye=.42*_e+.18*Ge+.3*we+Fe+.05;return o(.28,Ye,N)});return V()>.15+.85*N?P[Math.floor(V()*P.length)]:g(P,ae,V).item||P[0]}const Ue=(()=>{let _=null,E=null,R=!1;function N(){if(_)return _;const ae=window.AudioContext||window.webkitAudioContext;return ae?(_=new ae,E=_.createGain(),E.gain.value=.35,E.connect(_.destination),_):null}function V(){const ae=N();ae&&ae.state==="suspended"&&ae.resume()}function P(ae,se,ee,_e,Me){const Ge=N();if(!Ge||R)return;const we=Ge.currentTime+(Me||0),Fe=Ge.createOscillator(),Ye=Ge.createGain();Fe.type=ee||"sine",Fe.frequency.setValueAtTime(ae,we),Ye.gain.setValueAtTime(1e-4,we),Ye.gain.exponentialRampToValueAtTime(_e===void 0?.3:_e,we+.012),Ye.gain.exponentialRampToValueAtTime(1e-4,we+se),Fe.connect(Ye),Ye.connect(E),Fe.start(we),Fe.stop(we+se+.03)}return{unlock:V,get muted(){return R},toggle(){return R=!R,R},kick(){P(150,.12,"triangle",.4),P(90,.16,"sine",.3,.01)},pass(){P(420,.07,"triangle",.18)},good(){P(660,.09,"sine",.22),P(880,.1,"sine",.18,.07)},bad(){P(190,.18,"sawtooth",.22),P(120,.22,"square",.16,.04)},goal(){[523,659,784,1046].forEach((ae,se)=>P(ae,.22,"triangle",.26,se*.09))},save(){P(300,.12,"square",.18),P(220,.2,"square",.14,.1)},whistle(){P(1750,.16,"square",.12),setTimeout(()=>P(1750,.18,"square",.12),170)}}})();function Ke(_){p.trauma=r(p.trauma+_,0,1)}const at=document.getElementById("flash");function I(_,E){at.style.background=_,at.style.opacity=String(E*(p.reduceMotion?.4:1)),setTimeout(()=>{at.style.opacity="0"},90)}const q=document.getElementById("banner");function re(_,E){q.textContent=_,q.style.color=E,q.classList.add("show"),clearTimeout(re._t),re._t=setTimeout(()=>q.classList.remove("show"),1100)}const ie=_=>document.getElementById(_),he={hud:ie("hud"),role:ie("role-badge"),poss:ie("possession-chip"),scoreYou:ie("score-you").querySelector("strong"),scoreCpu:ie("score-cpu").querySelector("strong"),plays:ie("plays"),timerNum:ie("timer-num"),timerWrap:ie("timer-wrap"),timerBar:ie("timer-bar"),log:ie("log"),instruction:ie("instruction"),lock:ie("btn-lock"),mute:ie("btn-mute"),pause:ie("btn-pause"),help:ie("btn-help"),difficulty:ie("difficulty")};let Xe=-1,ut=-1;function nt(_,E){const R=document.createElement("li");for(R.textContent=_,E&&(R.className=E),he.log.prepend(R);he.log.children.length>5;)he.log.lastChild.remove()}b.on("score",()=>{he.scoreYou.textContent=p.humanScore,he.scoreCpu.textContent=p.cpuScore}),b.on("plays",()=>{he.plays.textContent="PLAY "+Math.min(p.plays+1,t.maxPlays)+" / "+t.maxPlays}),b.on("role",()=>{const _=p.possession==="you";he.role.textContent=_?"ATTACK":"DEFEND",he.role.className=_?"attack":"defend",he.poss.className="chip "+p.possession,he.poss.innerHTML='<i class="dot"></i>'+(p.possession==="you"?"YOU · BALL":"CPU · BALL"),he.instruction.textContent=_?"Swipe from the carrier to a teammate to pass · drag a teammate to move your runner · tap a teammate then LOCK IN.":"Drag a defender outward to commit its guess direction · LOCK IN to commit early.",he.lock.textContent=_?"PASS ⏎":"COMMIT ⏎"}),b.on("lockstate",()=>{he.lock.disabled=p.humanLocked||p.phase!=="decision"}),b.on("log",_=>nt(_.text,_.cls));const Xt={menu:ie("screen-menu"),tutorial:ie("screen-tutorial"),pause:ie("screen-pause"),over:ie("screen-over")},$e=[];let Ot=[];function it(){return $e.length?$e[$e.length-1]:null}function Gt(_,E){if(it()===_)return;const R=Xt[_];if(!R)return;Ot.push(document.activeElement),$e.push(_),R.hidden=!1;const N=E&&E.focus?R.querySelector(E.focus):R.querySelector(".btn");N&&requestAnimationFrame(()=>N.focus()),b.emit("screen",_)}function kt(){const _=$e.pop();if(!_)return;Xt[_].hidden=!0;const E=Ot.pop();return E&&E.focus&&E.focus(),b.emit("screen",it()),_}b.on("screen",_=>{he.hud.hidden=!(_===null||_==="pause"),_===null&&(he.pause.textContent="❙❙")});function pn(){p.humanScore=0,p.cpuScore=0,p.plays=0,p.possession="you",p.progress=.05,p.seed=Math.random()*1e9|0,p.outcome=null,p.phase="over",p.trauma=0,p.timeScale=1,he.log.innerHTML="",nt("Kick-off — you attack the CPU goal (top).","good"),b.emit("score"),b.emit("plays"),Ue.unlock(),Ue.whistle(),$n()}function $n(){p.phase="setup",p.phaseT=0,p.humanLocked=!1,p.cpuLocked=!1,p.humanChoice=null,p.cpuChoice=null,p.outcome=null,p.remaining=t.window,p.timeScale=1,he.timerWrap.classList.remove("low"),ot();const _=p.possession,E=v(_),R=O(_),N=f(d(p.seed,p.plays,11)),V=vt(_)[0],P=r(50+M(N,-6,6),12,88),ae=L(_,p.progress);S(V,P,ae),vt(_).forEach(_e=>{_e.hasBall=!1,_e.guess=null}),V.hasBall=!0;const se=Le(_,{x:P,y:ae},R,N),ee=De(E,{x:P,y:ae},R,N);vt(_).forEach(_e=>{_e!==V&&_e.role}),Se(),C={attacker:_,defender:E,goal:R,carrier:V,mates:se.mates,runner:se.runner,defenders:ee,keeper:ht[E+"5"],target:null,runnerDest:null,rng:N,runnerFrom:null},C.runnerDest={x:C.runner.x,y:C.runner.y},C.runnerFrom={x:C.runner.x,y:C.runner.y},rt.forEach(_e=>{_e.selected=!1,_e.speed=t.playerSpeed}),x.mode="held",x.holder=V,x.onArrive=null,xe(),b.emit("role"),b.emit("lockstate"),b.emit("plays"),nt("Play "+(p.plays+1)+" — "+(_==="you"?"you have the ball":"CPU has the ball")+".")}function S(_,E,R){_.x=E,_.y=R,_.px=E,_.py=R,_.tx=E,_.ty=R,_.dest=null,_.ax=E,_.ay=R,st(_)}function k(){p.phase="decision",p.remaining=t.window,p.decisionEndsAt=(window.performance?performance.now():Date.now())+t.window*1e3,p.humanLocked=!1,p.cpuLocked=!1,p.humanChoice=null,p.cpuChoice=null,b.emit("lockstate"),b.emit("role")}function X(){return p.humanChoice?p.humanChoice:C.attacker==="you"?{type:"pass",target:C.mates.slice().sort((E,R)=>h(C.carrier,E,Z(C.defenders))-h(C.carrier,R,Z(C.defenders)))[0],autofilled:!0}:(C.defenders.forEach(_=>{_.guess||(_.guess=l(C.carrier.x-_.x,C.carrier.y-_.y))}),{type:"guess",autofilled:!0})}function U(){if(p.cpuChoice)return p.cpuChoice;const _=f(d(p.seed,p.plays,C.attacker==="cpu"?31:32));if(C.attacker==="cpu"){const E=Ae(C.carrier,C.goal,C.defenders,p.difficulty,_),R=C.goal,N={x:r(o(C.runner.x,R.x,.4)+M(_,-14,14),8,92),y:r(o(C.runner.y,R.y,.45),8,92)};return{type:"pass",target:E,runnerDest:N}}return Re(C.defenders,C.carrier,C.goal,p.difficulty,_),{type:"guess"}}const Z=_=>_.map(E=>({id:E.id,pos:E,guess:E.guess}));function Ee(_){if(p.phase==="decision"){if(_==="you"){if(p.humanLocked)return;p.humanChoice=X(),p.humanLocked=!0}else{if(p.cpuLocked)return;p.cpuChoice=U(),p.cpuLocked=!0,p.cpuChoice.type==="pass"&&p.cpuChoice.runnerDest&&(C.runnerDest=p.cpuChoice.runnerDest,C.runner.dest=p.cpuChoice.runnerDest)}b.emit("lockstate"),p.humanLocked&&p.cpuLocked&&Ie()}}function Ie(){p.humanLocked||(p.humanChoice=X(),p.humanLocked=!0),p.cpuLocked||(p.cpuChoice=U(),p.cpuLocked=!0),p.humanChoice&&p.humanChoice.type==="pass"&&p.humanChoice.target&&(C.target=p.humanChoice.target),p.cpuChoice&&p.cpuChoice.type==="pass"&&p.cpuChoice.target&&(C.target=p.cpuChoice.target),p.humanChoice&&p.humanChoice.type==="guess"&&Oe(),p.cpuChoice&&p.cpuChoice.type,C.target||(C.target=C.mates.slice().sort((_,E)=>h(C.carrier,_,Z(C.defenders))-h(C.carrier,E,Z(C.defenders)))[0]),p.phase="resolve",p.phaseT=0,p.pending=!0,p.timeScale=p.reduceMotion?1:t.slowScale,he.lock.disabled=!0,wt(),nt((C.attacker==="you"?"You":"CPU")+" plays it to "+C.target.label+"…"),Ue.kick()}function Oe(){C.defenders.forEach(_=>{_.guess||(_.guess=l(C.carrier.x-_.x,C.carrier.y-_.y))})}function ze(){p.pending=!1;const _=f(d(p.seed,p.plays,77)),E={x:C.carrier.x,y:C.carrier.y},R={x:C.target.x,y:C.target.y},N=y({C:E,T:R,defenders:Z(C.defenders),keeper:{pos:{x:C.keeper.x,y:C.keeper.y}},goal:C.goal},_);p.outcome=N,C.outcome=N,C.C=E,C.Tp=R;const V=a(E,R);if(x.mode="fly",x.holder=null,x.from={x:E.x,y:E.y},x.dur=r(.42+V/100*.55,.42,1)/Math.max(.15,p.timeScale),x.arc=N.type==="INTERCEPTION"?.7:1.5,x.t=0,N.type==="INTERCEPTION"){x.to={x:N.at.x,y:N.at.y};const P=ht[N.defender]||C.defenders[0];P.dest={x:N.at.x,y:N.at.y},P.speed=t.playerSpeed,Ue.bad(),Ke(.32),p.reduceMotion||I(i.bad,.18),re("INTERCEPTED",i.bad),b.emit("log",{text:"Intercepted by "+P.label+"!",cls:"bad"})}else N.type==="GOAL"?(x.to={x:R.x,y:R.y},Ue.goal(),Ke(.75),p.reduceMotion||I(i.goal,.34),re("GOAL!",i.goal),b.emit("log",{text:"GOAL for "+(C.attacker==="you"?"you":"CPU")+"!",cls:C.attacker==="you"?"good":"bad"})):N.type==="SAVE"?(x.to={x:C.keeper.x,y:C.keeper.y},C.keeper.dest={x:R.x,y:R.y},Ue.save(),Ke(.22),p.reduceMotion||I(i.cpu,.12),re("SAVED",i.warn),b.emit("log",{text:"Keeper saves it!",cls:C.attacker==="you"?"bad":"good"})):(x.to={x:R.x,y:R.y},Ue.pass(),Ue.good(),Ke(.08),re("COMPLETE",i.you),b.emit("log",{text:"Completed to "+C.target.label+".",cls:C.attacker==="you"?"good":""}));console.debug("[§4]",N.type,"pIntercept="+N.pIntercept.toFixed(3),N.pGoal!==null&&N.pGoal!==void 0?"pGoal="+N.pGoal.toFixed(3):"")}function qe(){const _=p.outcome;if(!_)return;const E=C.attacker;_.type==="COMPLETE"?(p.possession=E,p.progress=B(E,_.at.y)):_.type==="INTERCEPTION"?(p.possession=v(E),p.progress=B(p.possession,_.at.y)):_.type==="GOAL"?(E==="you"?p.humanScore++:p.cpuScore++,b.emit("score"),p.possession=v(E),p.progress=.05,Ue.whistle()):_.type==="SAVE"&&(p.possession=v(E),p.progress=B(p.possession,C.keeper.y))}function We(){if(p.plays++,b.emit("plays"),p.humanScore>=t.winScore||p.cpuScore>=t.winScore||p.plays>=t.maxPlays)return He();$n()}function He(){p.phase="over";const _=p.humanScore>p.cpuScore,E=p.humanScore===p.cpuScore;ie("over-title").textContent=E?"DRAW "+p.humanScore+"–"+p.cpuScore:(_?"YOU WIN ":"CPU WINS ")+p.humanScore+"–"+p.cpuScore,ie("over-detail").textContent=p.plays+" of "+t.maxPlays+" plays used · "+(p.humanScore>=t.winScore||p.cpuScore>=t.winScore?"decided by the 3-goal rule":"decided by the play cap"),b.emit("log",{text:E?"Full time: draw.":_?"Full time: you win!":"Full time: CPU wins.",cls:_?"good":"bad"}),Gt("over",{focus:"#btn-again"})}function ot(){fe.forEach(_=>_.visible=!1),le.visible=!1,Ce.visible=!1}const ge={kind:null,player:null,x0:0,y0:0,x:0,y:0,moved:0,id:null};function It(_){const E=$.getBoundingClientRect(),R=_.clientX-E.left,N=_.clientY-E.top,V=50+(R/E.width*2-1)*F.hw,P=50+(1-N/E.height*2)*F.hh;return{x:V,y:P,px:R,py:N,rect:E}}const Kt=_=>Math.max(24,_.height*.055);function lt(_){let E=null,R=1/0;const N=Kt(_.rect);return rt.forEach(V=>{const P={x:(V.x-50+F.hw)/(2*F.hw)*_.rect.width,y:(1-(V.y-50+F.hh)/(2*F.hh))*_.rect.height},ae=Math.hypot(P.x-_.px,P.y-_.py);ae<=N&&ae<R&&(R=ae,E=V)}),E}const ke=()=>C&&C.attacker==="you",En=()=>C&&C.attacker==="cpu";function dt(_){if(p.phase!=="decision"||p.humanLocked||it()||_.button!==void 0&&_.button!==0)return;const E=It(_),R=lt(E);ge.x0=E.x,ge.y0=E.y,ge.x=E.x,ge.y=E.y,ge.moved=0,ge.id=_.pointerId,$.setPointerCapture&&$.setPointerCapture(_.pointerId),$.classList.add("grabbing"),En()&&R&&R.team==="you"&&R.role==="outfield"?(ge.kind="guess",ge.player=R,R.selected=!0):ke()&&R===C.carrier?(ge.kind="aim",ge.player=R):ke()&&R&&R.team==="you"?(ge.kind="move",ge.player=R,R.selected=!0):ke()&&!R?(ge.kind="runner",ge.player=C.runner,C.runner.selected=!0):En()&&R&&R.team==="cpu"?(ge.kind="scout",ge.player=R):ge.kind=null,xe()}function Jt(_){if(!ge.kind)return;const E=It(_);if(ge.x=E.x,ge.y=E.y,ge.moved=Math.hypot(E.x-ge.x0,E.y-ge.y0),ge.kind==="aim"&&ge.moved>12){const R=_i(ge.x0,ge.y0,ge.x,ge.y);C.mates.forEach(N=>N.selected=N===R),C.previewTarget=R,ge.player.selected=!0,mn(ge.x0,ge.y0,ge.x,ge.y,R)}else if(ge.kind==="runner"||ge.kind==="move"&&ge.moved>12)C.previewRunner={x:r(E.x,5,95),y:r(E.y,5,95)},Ce.visible=!0,Ce.position.set(oe(C.previewRunner.x),.08,ve(C.previewRunner.y));else if(ge.kind==="guess"&&ge.moved>12){const R=l(ge.x-ge.x0,ge.y-ge.y0);ge.guessPreview=R;const N=14;fe[0].visible=!0,fe[0].setEnds({x:ge.player.x,y:ge.player.y},{x:ge.player.x+R.x*N,y:ge.player.y+R.y*N}),fe[0].material.color.setHex(ge.player.team==="you"?n.you:n.cpu)}Qt()}function _i(_,E,R,N){const V=l(R-_,N-E);if(!V.l)return null;let P=null,ae=.15;return C.mates.forEach(se=>{const ee=l(se.x-_,se.y-E);if(!ee.l)return;const _e=ee.x*V.x+ee.y*V.y,Me=_e-ee.l/400;_e>0&&Me>ae&&(ae=Me,P=se)}),P}function mn(_,E,R,N,V){le.visible=!0;const P=V?{x:V.x,y:V.y}:{x:R,y:N};le.setEnds({x:_,y:E},P),le.material.color.setHex(V?n.aim:n.ghost),le.material.opacity=V?1:.45}function An(_){if(!ge.kind){ge.id=null;return}const E=It(_);$.classList.remove("grabbing");const R=Math.hypot(E.x-ge.x0,E.y-ge.y0),N=ge.kind,V=ge.player;if(ge.kind=null,ge.player=null,ge.id=null,N==="aim")le.visible=!1,C.mates.forEach(P=>P.selected=!1),R<14?(C.previewTarget&&(C.target=C.previewTarget),C.previewTarget=null):C.previewTarget?(C.target=C.previewTarget,C.previewTarget=null,p.humanChoice={type:"pass",target:C.target},Ee("you")):(C.previewTarget=null,nt("No teammate in that direction — swipe toward one.",""));else if(N==="move"||N==="runner")R>12&&C.previewRunner&&(C.runnerDest=C.previewRunner,V.dest=C.previewRunner,V.speed=t.playerSpeed,nt("Runner sent to "+Math.round(C.runnerDest.x)+", "+Math.round(C.runnerDest.y)+".","")),C.previewRunner=null,Ce.visible=!1,V.selected=!1;else if(N==="guess"){if(R>12){const P=l(E.x-ge.x0,E.y-ge.y0);V.guess=P.l?{x:P.x,y:P.y}:null,nt(V.label+" commits "+bt(P)+".","")}V.selected=!1}else N==="scout"&&R<14&&nt(V.label+" — CPU will commit this lane at random.","");fe[0].visible=!1,xe(),p.phase==="decision"&&!p.humanLocked&&C&&C.target&&ke()}function bt(_){if(!_||!_.l)return"nothing";const E=Math.atan2(_.y,_.x)*180/Math.PI;return["right","up-right","up","up-left","left","down-left","down","down-right"][Math.round((E+360)%360/45)%8]}function Qt(){$.style.cursor=ge.kind?"grabbing":p.phase==="decision"?"crosshair":"default"}$.addEventListener("pointerdown",dt),$.addEventListener("pointermove",Jt),$.addEventListener("pointerup",An),$.addEventListener("pointercancel",An),$.addEventListener("contextmenu",_=>_.preventDefault()),window.addEventListener("keydown",_=>{if(_.key==="Escape"){_.preventDefault(),it()&&it()!=="menu"&&it()!=="over"?kt():!it()&&p.phase!=="idle"&&p.phase!=="over"&&ji();return}it()||((_.key==="Enter"||_.key===" ")&&(_.preventDefault(),p.phase==="decision"&&!p.humanLocked&&Ee("you")),(_.key==="m"||_.key==="M")&&Zi(),(_.key==="r"||_.key==="R")&&p.phase!=="idle"&&pn(),(_.key==="h"||_.key==="H")&&Gt("tutorial",{focus:"#btn-tut-close"}))});function Kn(_){if(x.mode==="held"&&x.holder){const R=x.holder,N=l(C?C.goal.x-R.x:0,C?C.goal.y-R.y:1);j(R.x+N.x*.95,R.y+N.y*.95,.42)}else if(x.mode==="fly"&&x.from&&x.to){x.t=Math.min(1,x.t+_/x.dur);const R=x.t;if(j(o(x.from.x,x.to.x,R),o(x.from.y,x.to.y,R),.42+Math.sin(Math.PI*R)*x.arc),x.t>=1){x.mode="rest";const N=x.onArrive;x.onArrive=null,N&&N()}}Lt.position.set(oe(x.x),x.h,ve(x.y)),T.position.set(oe(x.x),.04,ve(x.y));const E=1-r(x.h/4,0,.6);T.scale.setScalar(E),T.material.opacity=.75*E}function wt(_){let E=0;C.defenders.forEach(R=>{if(!R.guess)return;const N=fe[++E];if(!N)return;const V=13;N.visible=!0,N.material.color.setHex(R.team==="you"?n.you:n.cpu),N.material.opacity=.95,N.setEnds({x:R.x,y:R.y},{x:R.x+R.guess.x*V,y:R.y+R.guess.y*V})});for(let R=E+1;R<fe.length;R++)fe[R].visible=!1}function Jn(_,E){const R=_;if(p.phase==="setup")p.phaseT+=R,rt.forEach(ee=>Ct(ee,ee.ax,ee.ay,46,R)),p.phaseT>=t.setupTime&&k();else if(p.phase==="decision")p.remaining=Math.max(0,(p.decisionEndsAt-E)/1e3),p.remaining<=0&&Ie();else if(p.phase==="resolve")if(p.phaseT+=R,p.pending){const ee=C.runner,_e=ee.dest?Ct(ee,ee.dest.x,ee.dest.y,t.playerSpeed,R):!0;_e&&(ee.dest=null),(_e||p.phaseT>.75)&&ze()}else p.phaseT>x.dur+.12&&(qe(),p.phase="result",p.phaseT=0);else p.phase==="result"&&(p.phaseT+=R,p.phaseT>=t.resultTime&&We());p.timeScale+=(1-p.timeScale)*Math.min(1,R*2.6);const N=R*p.timeScale;rt.forEach(ee=>{ee.dest?Ct(ee,ee.dest.x,ee.dest.y,ee.speed,N)&&(ee.dest=null):p.phase==="setup"||Ct(ee,ee.ax,ee.ay,t.driftSpeed,N),Ze(ee,N),st(ee)}),[ht.you5,ht.cpu5].forEach(ee=>{if(!ee.dest){const _e=ee.team==="you"?5.5:94.5;ee.tx=r(50+(x.x-50)*.35,42,58),ee.ty=_e}}),C&&(p.phase==="decision"&&(wt(),C.target||(le.visible=!1)),C.carrier&&C.target&&p.phase==="decision"&&(C.carrier.yaw=Math.atan2(C.target.x-C.carrier.x,-(C.target.y-C.carrier.y)),ge.kind!=="aim"&&(le.visible=!0,le.material.color.setHex(n.aim),le.material.opacity=.8,le.setEnds(C.carrier,C.target)))),Kn(N),p.trauma=Math.max(0,p.trauma-R*1.5);const V=p.trauma*p.trauma,P=p.reduceMotion?0:2.4*V,ae=(Math.random()*2-1)*P,se=(Math.random()*2-1)*P;ne.position.x=ae,ne.position.y=130*Math.cos(K)+se*Math.sin(K),ne.position.z=130*Math.sin(K)-se*Math.cos(K),ne.rotation.z=0,ne.lookAt(ae,se*Math.sin(K),-se*Math.cos(K))}function Yi(_){if(p.phase!=="decision")return;const E=r(p.remaining/t.window,0,1);Math.abs(E-Xe)>.004&&(he.timerBar.style.transform="scaleX("+E.toFixed(3)+")",Xe=E);const R=Math.ceil(p.remaining*10)/10;R!==ut&&(he.timerNum.textContent=R.toFixed(1),ut=R),he.timerWrap.classList.toggle("low",p.remaining<=1)}function gn(){const _=$.clientWidth||window.innerWidth,E=$.clientHeight||window.innerHeight,R=_/E,N=53,V=56;let P,ae;R>=N/V?(ae=V,P=V*R):(P=N,ae=N/R),F.hw=P,F.hh=ae,ne.left=-P,ne.right=P,ne.top=ae,ne.bottom=-ae,ne.updateProjectionMatrix(),Y.setSize(_,E,!1)}window.addEventListener("resize",gn),window.addEventListener("orientationchange",()=>setTimeout(gn,120)),window.visualViewport&&window.visualViewport.addEventListener("resize",gn);let Dr=0;function ji(){p.phase==="idle"||p.phase==="over"||(p.paused=!0,Dr=performance.now(),Gt("pause",{focus:"#btn-resume"}))}function Pr(){if(!p.paused){kt();return}p.paused=!1,p.decisionEndsAt+=performance.now()-Dr,kt()}let Ir=performance.now();function Fr(_){requestAnimationFrame(Fr);const E=Math.min(.05,(_-Ir)/1e3);Ir=_,!p.paused&&!it()?Jn(E,_):p.paused,Yi(),Y.render(te,ne)}function Zi(){const _=Ue.toggle();he.mute.textContent=_?"🔇":"♪",he.mute.setAttribute("aria-pressed",String(_)),_||Ue.unlock()}ie("btn-start").addEventListener("click",()=>{kt(),pn()}),ie("btn-tutorial").addEventListener("click",()=>Gt("tutorial",{focus:"#btn-tut-close"})),ie("btn-tut-close").addEventListener("click",()=>kt()),ie("btn-help").addEventListener("click",()=>Gt("tutorial",{focus:"#btn-tut-close"})),ie("btn-lock").addEventListener("click",()=>Ee("you")),ie("btn-pause").addEventListener("click",()=>ji()),ie("btn-mute").addEventListener("click",Zi),ie("btn-resume").addEventListener("click",Pr),ie("btn-restart").addEventListener("click",()=>{for(p.paused=!1;it();)kt();pn()}),ie("btn-quit").addEventListener("click",()=>{for(p.paused=!1;it();)kt();p.phase="idle",Gt("menu",{focus:"#btn-start"})}),ie("btn-again").addEventListener("click",()=>{kt(),pn()}),ie("btn-menu").addEventListener("click",()=>{for(;it();)kt();p.phase="idle",Gt("menu",{focus:"#btn-start"})}),ie("btn-verify").addEventListener("click",()=>{const _=A(!0);re(_.allPass?"§4 ALL PASS":"§4 TESTS FAILED",_.allPass?i.goal:i.bad)}),he.difficulty.addEventListener("click",_=>{const E=_.target.closest("button[data-diff]");E&&(p.difficulty=parseFloat(E.dataset.diff),Array.from(he.difficulty.querySelectorAll("button")).forEach(R=>R.setAttribute("aria-pressed",String(R===E))))}),["pointerdown","keydown","touchstart"].forEach(_=>window.addEventListener(_,()=>Ue.unlock(),{once:!0,passive:!0})),gn(),Se(),rt.forEach(_=>st(_)),Gt("menu",{focus:"#btn-start"}),requestAnimationFrame(Fr);const Nr=A(!1);console.log("[Guess & Pass] §4 verification: "+(Nr.allPass?"ALL PASS":"FAILURES — see __GAP_VERIFY_RESULTS")),Nr.allPass||re("§4 TESTS FAILED",i.bad),window.__GAP={T:t,state:p,resolvePass:y,defenderChance:m,pInterceptOf:h,runVerification:A,get play(){return C},api:{beginMatch:pn,beginSetup:$n,beginDecision:k,beginResolve:Ie,executeResolve:ze,lockIn:Ee,pauseGame:ji,resumeGame:Pr,toggleMute:Zi,setDifficulty:_=>{p.difficulty=r(_,0,1)},forceOutcome:_=>{p.outcome={type:_,at:{x:50,y:90},pIntercept:0,pGoal:null}}}}})();const br=document.getElementById("verify-out"),bs=document.getElementById("btn-verify");br&&bs&&bs.addEventListener("click",()=>{const s=window.__GAP_VERIFY_RESULTS;s&&(br.textContent=s.map(e=>(e.pass?"PASS  ":"FAIL  ")+e.name).join(`
`),br.hidden=!1)});
