"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'concurrent-form-update';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

var concurrentUpdateDataHolder = {};

// Connected clients
var clients = [];
var connectedClients = {};

/**
 * HTTP server
 */
var server = http.createServer(function (request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function () {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// Logging connected user w.r.t. providerId, patientId and formId
function bindConnectedUser(dataObj, keyTraceArr, mapKey, conObj) {
    if (mapKey == "connection") {
        dataObj[mapKey] = conObj;
        return;
    }

    if (!(mapKey in dataObj)) {
        dataObj[mapKey] = {};
    }
    bindConnectedUser(dataObj[mapKey], keyTraceArr, keyTraceArr.pop(), conObj);
}

// Strucuring Concurrency data
function bindConcurrencyData(dataObj, keyTraceArr, mapKey, formFieldsData) {
    if (mapKey == "fields") {
        dataObj[mapKey] = formFieldsData;
        return;
    }

    if (!(mapKey in dataObj)) {
        dataObj[mapKey] = {};
    }
    bindConcurrencyData(dataObj[mapKey], keyTraceArr, keyTraceArr.pop(), formFieldsData);
}

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    var connection = request.accept(null, request.origin);

    clients.push(connection);

    if (!('concurrentUpdateData' in concurrentUpdateDataHolder)) {
        concurrentUpdateDataHolder["concurrentUpdateData"] = {};
        console.log("concurrentUpdateDataHolder init");
    }

    // user sent some message
    connection.on('message', function (message) {
        var reqJson = {};
        var keyTraceArr = [];

        if (message.type === 'utf8') {
            reqJson = JSON.parse(message.utf8Data);
            if (reqJson.type == "REGISTER-CONNECTION-REQ") {
                keyTraceArr.push("connection");
                keyTraceArr.push(reqJson.userId);
                keyTraceArr.push(reqJson.formId);
                keyTraceArr.push(reqJson.patientId);
                keyTraceArr.push(reqJson.providerId);
                
                if(!(reqJson.providerId in connectedClients && reqJson.patientId in connectedClients[reqJson.providerId] && reqJson.formId in connectedClients[reqJson.providerId][reqJson.patientId] && reqJson.userId in connectedClients[reqJson.providerId][reqJson.patientId][reqJson.formId])) {
                    bindConnectedUser(connectedClients, keyTraceArr, keyTraceArr.pop(), connection);
                }                
                
                var json = {};
                json["type"] = "WORKING-USER-RESP";
                json["formId"] = reqJson.formId;
                json["workingUsers"] = [];
                
                for(var key in connectedClients[reqJson.providerId][reqJson.patientId][reqJson.formId]) {
                    json["workingUsers"].push(key);
                    connectedClients[reqJson.providerId][reqJson.patientId][reqJson.formId][reqJson.userId]["connection"] = connection;
                }
                
                for(key in connectedClients[reqJson.providerId][reqJson.patientId][reqJson.formId]) {
                    connectedClients[reqJson.providerId][reqJson.patientId][reqJson.formId][key]["connection"].sendUTF(JSON.stringify(json));
                }
            } else {
                keyTraceArr.push("fields");
                keyTraceArr.push(reqJson.userId);
                keyTraceArr.push(reqJson.formId);
                keyTraceArr.push(reqJson.patientId);
                keyTraceArr.push(reqJson.providerId);

                bindConcurrencyData(concurrentUpdateDataHolder.concurrentUpdateData, keyTraceArr, keyTraceArr.pop(), reqJson.fields);

                var respData = concurrentUpdateDataHolder.concurrentUpdateData[reqJson.providerId][reqJson.patientId][reqJson.formId];
                respData["type"] = "FORM-CHANGE-RESP";
                respData["formId"] = reqJson.formId;
                
                for(var key in connectedClients[reqJson.providerId][reqJson.patientId][reqJson.formId]) {
                    connectedClients[reqJson.providerId][reqJson.patientId][reqJson.formId][reqJson.userId]["connection"] = connection;
                }
                
                for(key in connectedClients[reqJson.providerId][reqJson.patientId][reqJson.formId]) {
                    connectedClients[reqJson.providerId][reqJson.patientId][reqJson.formId][key]["connection"].sendUTF(JSON.stringify(respData));
                }
            }
        }
    });

    // user disconnected
    connection.on('close', function (connection) {
        console.log(connection);
    });
});