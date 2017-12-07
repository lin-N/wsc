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
    host     : 'pubg-cluster.cluster-cs17ac96ihrv.us-west-2.rds.amazonaws.com',
    user     : 'pubg',
    password : 'LOYO_pubg',
    database : 'pubg'

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
        global.res = null;
    });
    
    ws.on('close', function close() {
        console.log('close:' + moment().format('YYYY-MM-DD HH:mm:ss'));
        process.exit();
    });

    server.listen(11008);
    server.on('request',(req, res)=>{
        event.emit('request', req, res);
    });
    
    var action = {'steamId':'GetBroUserStatesBySteamId','accountId':'GetUserAllRecord','nickName':'GetBroUserStatesByNickname','board':'GetBroLeaderboard','accountIdPre5':'GetUserRecord'};
    var hash = {};
    var fuck = 10000;

    function sendSteamId(req, res) {
        console.log(req.url);
        if(fuck >= 89999) {
            fuck = 10000;
    }
    var urlQuery = url.parse(req.url).path.split('/');
    if ('ping' == urlQuery[1]){
        ws.send('['+(fuck)+',null,"UserProxyApi","Ping"]');
        res.writeHead(200, {'Content-Type':'text/html ; charset=utf-8'});
        res.write(os.hostname());
        res.end();
        fuck += 1;
        return
    }
    if (0 < urlQuery[2].indexOf(',')) {
        urlQuery[2] = urlQuery[2].replace(/,/g, '","');
    }
    if (undefined !== action[urlQuery[1]]) {
        if ('steamId' == urlQuery[1] || 'nickName' == urlQuery[1]) {
            ws.send('['+(fuck)+',null,"UserProxyApi","' + action[urlQuery[1]] + '",["' + urlQuery[2] + '"]]');
        } else if ('accountId' == urlQuery[1]) {
            ws.send('['+(fuck)+',null,"UserProxyApi","' + action[urlQuery[1]] + '","' + urlQuery[2] + '"]');
        } else if ('board' == urlQuery[1]) {
            ws.send('['+(fuck)+',null,"UserProxyApi","' + action[urlQuery[1]] + '","' + urlQuery[2] + '","' + urlQuery[3] + '","' + urlQuery[4] + '","account.42b96cc277014180865bead6a661f170"]');
        } else if ('accountIdPre5') {
            ws.send('['+(fuck)+',null,"UserProxyApi","' + action[urlQuery[1]] + '","' + urlQuery[2] + '","' + urlQuery[3] + '","' + urlQuery[4] + '"]');
        }
        hash[fuck] = res;
        fuck += 1;
        }
    }
    
    ws.on('message', function incoming(data) {
        console.log('data:', data);
        if(data) {
            var mdata = JSON.parse(data);
            if(-mdata[0] >= 10000) {
                var mres = hash[-mdata[0]];
                console.log(hash[-mdata[0]]);
                mres.writeHead(200, {'Content-Type':'text/html ; charset=utf-8'});
                mres.write(data);
                mres.end();
            }
        }
    });
    
    event.on('request', function(req, res) {
        try{
            sendSteamId(req, res)
        } catch (err) {
            res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
            res.write(err.toString());
            res.end();
        }
    });
});

connection.end();
