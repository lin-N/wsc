const http         = require('http');
const EventEmitter = require('events').EventEmitter;
const event        = new EventEmitter();
const server       = http.createServer();
const url          = require('url');
const querystring  = require('querystring');
const moment       = require('moment');
const WebSocket    = require('ws');
server.listen(11008);

function WebSocketClient(){
    this.number = 0;    // Message number
    this.autoReconnectInterval = 1000;
}
WebSocketClient.prototype.open = function(url){
    this.url = url;
    this.instance = new WebSocket(this.url);
    this.instance.on('open',()=>{
        this.onopen();
    });
    this.instance.on('message',(data,flags)=>{
        this.number ++;
        this.onmessage(data,flags,this.number);
    });
    this.instance.on('close',(e)=>{
        switch (e){
        case 1000:    // CLOSE_NORMAL
            console.log("WebSocket: closed");
            break;
        default:    // Abnormal closure
            this.reconnect(e);
            break;
        }
        this.onclose(e);
    });
    this.instance.on('error',(e)=>{
        switch (e.code){
        case 'ECONNREFUSED':
            this.reconnect(e);
            break;
        default:
            this.onerror(e);
            break;
        }
    });
}

WebSocketClient.prototype.send = function(data,option){
    try{
        this.instance.send(data,option);
    }catch (e){
        this.instance.emit('error',e);
    }
}
WebSocketClient.prototype.reconnect = function(e){
    console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`,e);
    var that = this;
    setTimeout(function(){
        console.log("WebSocketClient: reconnecting...");
        console.log(moment().format('YYYY-MM-DD HH:mm:ss'));        
        that.open(that.url);
    },this.autoReconnectInterval);
}
WebSocketClient.prototype.onopen = function(e){
    console.log("WebSocketClient: open",arguments);   
}
WebSocketClient.prototype.onmessage = function(data,flags,number){
    console.log("WebSocketClient: message",arguments);    
}
WebSocketClient.prototype.onerror = function(e){
    console.log("WebSocketClient: error",arguments);    
}
WebSocketClient.prototype.onclose = function(e){
    console.log("WebSocketClient: closed",arguments);    
}


var wsc = new WebSocketClient();
wsc.open('wss://prod-live-entry.playbattlegrounds.com/userproxy?provider=steam&ticket=14000000177DF53461ED663B9AC68E1A010010012A289159180000000100000002000000A606B56F6A00A8C0CB72170002000000B200000032000000040000009AC68E1A0100100120D20800F703B56F6A00A8C0000000007F418759FFF0A25901008440020000000000A5A6E04B30E8D18919845B5A7051AAB0484A33C4A72455146779A17F534A984F0B1A19396C5E113D5AE109E0B8DDC1911F62132CE8EC7A38D2C97188018D386A4D25EF778BB3E8377DF86141359F2E64C2DB3CA86C149B30A48A72039D868874B7BDB7BBF4496C3A2881DC5E9C45F2450B0E846AC50CEEB91BE2D4CB085045D0&playerNetId=76561198405830298&cc=--&clientGameVersion=2.5.39');
wsc.onopen = function(e){
    console.log("WebSocketClient connected:",e);
    //this.send("Hello World !");
    global.res = null;
}
wsc.onmessage = function(data,flags,number){
    let jsonData = JSON.parse(data);
    if (global.res) {
        global.res.writeHead(200, {'Content-Type':'text/html ; charset=utf-8'});
        global.res.write(data);
        global.res.end();
    }
}
const interval = setInterval(function() {
    if(1 == wsc.instance.readyState){
         console.log(moment().format('YYYY-MM-DD HH:mm:ss'));
         wsc.send('[10000,null,"UserProxyApi","Ping"]');
    }
}, 3000);

server.on('request',(req, res)=>{
    event.emit('request', req, res);
});

var action = {'steamId':'GetBroUserStatesBySteamId','accountId':'GetUserAllRecord','nickName':'GetBroUserStatesByNickname'};

event.on('request', function(req, res) {
    var urlQuery = url.parse(req.url).path.split('/');
    if (undefined !== action[urlQuery[1]]) {
        if ('steamId' == urlQuery[1]){
            wsc.send('[10000,null,"UserProxyApi","' + action[urlQuery[1]] + '",["' + urlQuery[2] + '"]]');
        }
        if ('accountId' == urlQuery[1]) {
            wsc.send('[10000,null,"UserProxyApi","' + action[urlQuery[1]] + '","' + urlQuery[2] + '"]');        
        }
    }
    global.res = res;
});
