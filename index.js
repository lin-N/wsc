const http         = require('http');
const EventEmitter = require('events').EventEmitter;
const event        = new EventEmitter();
const server       = http.createServer();
const url          = require('url');
const querystring  = require('querystring');
const moment       = require('moment');
const WebSocket    = require('ws');
const process      = require('process');

var ws  = new WebSocket('ws://prod-live-entry.playbattlegrounds.com/userproxy?provider=steam&ticket=14000000A05F7A736005235CC56E991A01001001151A9159180000000100000002000000760AEF7200000000C9AA020001000000B20000003200000004000000C56E991A0100100120D208006611EF720000000000000000B70C915937BCAC5901008440020000000000A7459856727196DB46E7AF07DAB719F246EC628199AA3556C9AA932C9A6DD14089B0AD7997B9304B11875CCEB7A02516138CDF08E5754F5DE88E90E58A4FF121F0C7538F93E374E1336D5F927C634D295AFCC7BECA733F6A950D7A6EDA1A276FD8C5D8B08FCA07579AB0240983ECDEAEB5366E67369EFCA371948635A8123342&playerNetId=76561198406528709&cc=--&clientGameVersion=2.5.39');

ws.on('open', function open() {
    console.log('open:' + moment().format('YYYY-MM-DD HH:mm:ss'));
    global.res = null;
});

ws.on('message', function incoming(data) {
    console.log(data);
    if (global.res) {
        global.res.writeHead(200, {'Content-Type':'text/html ; charset=utf-8'});
        global.res.write(data);
        global.res.end();
    }
});

ws.on('close', function close() {
    console.log('close:' + moment().format('YYYY-MM-DD HH:mm:ss'));
    process.exit();
});

const interval = setInterval(function() {
    if(1 == ws.readyState) {
         ws.send('[10000,null,"UserProxyApi","Ping"]');
    }
}, 15000);

server.listen(11008);
server.on('request',(req, res)=>{
    event.emit('request', req, res);
});

var action = {'steamId':'GetBroUserStatesBySteamId','accountId':'GetUserAllRecord','nickName':'GetBroUserStatesByNickname'};

event.on('request', function(req, res) {
    console.log(req.url);
    var urlQuery = url.parse(req.url).path.split('/');
    if (undefined !== action[urlQuery[1]]) {
        if ('steamId' == urlQuery[1]){
            ws.send('[10000,null,"UserProxyApi","' + action[urlQuery[1]] + '",["' + urlQuery[2] + '"]]');
        }
        if ('accountId' == urlQuery[1]) {
            ws.send('[10000,null,"UserProxyApi","' + action[urlQuery[1]] + '","' + urlQuery[2] + '"]');        
        }
    }
    global.res = res;
});
