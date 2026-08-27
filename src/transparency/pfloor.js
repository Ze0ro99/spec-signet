function gcd(a,b){while(b){const t=a%b;a=b;b=t;}return a;}
export function computeFloor(R,S,Q){for(const v of [R,S,Q])if(typeof v!=='bigint'||v<0n)throw new Error('FLOOR_INPUT');const d=R+S;if(d===0n)return {code:'FLOOR_UNDEFINED'};const n=R*Q, den=d*d, g=gcd(n,den);return {code:'OK',numerator:n/g,denominator:den/g};}
