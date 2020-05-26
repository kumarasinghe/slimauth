const fs=require("fs"),crypto=require("crypto"),AUTH_TOKEN_LENGTH=40,AUTH_TOKEN_AGE=2592e6,DATA_DIR=require("path").dirname(require.main.filename)+"/slimauth",ACCOUNT_STORE_FILE=DATA_DIR+"/accounts.json",TOKEN_STORE_FILE=DATA_DIR+"/tokens.json";let accountStore,tokenStore;class SlimAuth{constructor(){this.requestAuthenticator=middleware}createUser(e,t){return new Promise((r,o)=>{accountStore[e]?o("User account already exists"):(accountStore[e]=getTextHash(t),writeJSON(ACCOUNT_STORE_FILE,accountStore),r())})}deleteUser(e,t){return new Promise((r,o)=>{accountStore[e]?accountStore[e]!=getTextHash(t)?o("Incorrect password"):(delete accountStore[e],writeJSON(ACCOUNT_STORE_FILE,accountStore),this.deauthenticate(e),r()):o("User account des not exists")})}updatePassword(e,t,r){return new Promise((o,n)=>{accountStore[e]?accountStore[e]!=getTextHash(t)?n("Incorrect password"):(accountStore[e]=getTextHash(r),writeJSON(ACCOUNT_STORE_FILE,accountStore),o()):n("User account des not exists")})}authenticate(e,t,r){return new Promise((o,n)=>{let s=accountStore[e];if(s)if(s!=getTextHash(t.toString()))n(new Error("incorrect password"));else{for(let t in tokenStore)if(tokenStore[t]==e){delete tokenStore[t];break}let t;do{t=getRandomString(AUTH_TOKEN_LENGTH)}while(tokenStore[t]);r.cookie("slimauth",t,{maxAge:AUTH_TOKEN_AGE,sameSite:!0}),tokenStore[t]=e,writeJSON(TOKEN_STORE_FILE,tokenStore),o()}else n(new Error(`${e} does not exist`))})}deauthenticate(e){for(let t in tokenStore)if(tokenStore[t]==e){delete tokenStore[t];break}writeJSON(TOKEN_STORE_FILE,tokenStore)}}function middleware(e,t,r){let o=decodeURIComponent(e.headers.cookie),n=o.indexOf("slimauth=");if(n<0)return void r();let s,c=o.substr(n+9,AUTH_TOKEN_LENGTH);null!=(s=tokenStore[c])?(e.userID=t.userID=s,r()):r()}function getRandomString(e){return crypto.randomBytes(.75*e).toString("base64").replace(/\W/g,"_")}function readJSON(e){return 0==fs.existsSync(e)?void 0:JSON.parse(fs.readFileSync(e),{encoding:"utf8"})}function writeJSON(e,t){fs.writeFileSync(e,JSON.stringify(t))}function getTextHash(e){return crypto.createHash("sha1").update(e.toString()).digest("hex")}fs.existsSync(DATA_DIR)||fs.mkdirSync(DATA_DIR),fs.existsSync(ACCOUNT_STORE_FILE)||writeJSON(ACCOUNT_STORE_FILE,{}),accountStore=readJSON(ACCOUNT_STORE_FILE),fs.existsSync(TOKEN_STORE_FILE)||writeJSON(TOKEN_STORE_FILE,{}),tokenStore=readJSON(TOKEN_STORE_FILE),module.exports=new SlimAuth;