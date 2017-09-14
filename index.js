const http         = require('http');
const EventEmitter = require('events').EventEmitter;
const event        = new EventEmitter();
const server       = http.createServer();
const url          = require('url');
const querystring  = require('querystring');
const moment       = require('moment');
const WebSocket    = require('ws');
const process      = require('process');
const os           = require('os');
const mysql        = require('mysql');

var connection = mysql.createConnection({
    host     : 'h',
    user     : 'u',
    password : 'p',
    database : 'p'

});
connection.connect();
var sql = 'SELECT * FROM `key` WHERE `name` = "' + os.hostname() + '";';
connection.query(sql, function (err, result) {
    if(err) {
        console.log('[SELECT ERROR] - ',err.message);
        return;
    }
    var wsUrl = result[0].key;
    var ws  = new WebSocket(wsUrl);

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
    }, 5000);

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
});

connection.end();
