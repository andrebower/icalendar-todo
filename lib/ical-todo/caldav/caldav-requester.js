/**
 * Created by aab on 14.11.2014.
 */
"use strict";
var xmldoc = require('xmldoc'),
    async = require('async'),
    http = require('http'),
    optionsCreator = require('./caldav-http-options-creator'),
    queryTodosString = '<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">\n' +
        '<d:prop>\n' +
        '<d:getetag />\n' +
        '</d:prop>\n' +
        '<c:filter> \n' +
        '<c:comp-filter name="VCALENDAR" >\n' +
        '<c:comp-filter name="VTODO" />\n' +
        '</c:comp-filter>\n' +
        '</c:filter> \n' +
        '</c:calendar-query>';

module.exports = function (options) {

    var options = options;
    var queryAllTaskIds = function (callback) {
        var headers = {'Depth': 1, 'Prefer': 'return-minimal', 'Content-Type': 'application/xml; charset=utf-8'};
        var requestOptions = optionsCreator.createHttpOptions(options, 'REPORT', headers, '');
        var request = http.request(requestOptions, function (result) {
            console.log('STATUS: ' + result.statusCode);
            console.log('HEADERS: ' + JSON.stringify(result.headers));
            result.setEncoding('utf8');
            var body = '';
            result.on('data', function (chunk) {
                body += chunk;
                console.log('BODY: ' + chunk);
            });
            result.on('end', function () {
                var responses = [];
                var document = new xmldoc.XmlDocument(body);
                document.eachChild(function (child, index, array) {
                    var href = child.childNamed('d:href').val;
                    var id = href.split('/').last().split('.')[0];
                    var etag = child.childNamed('d:propstat').childNamed('d:prop').childNamed('d:getetag').val.replace(/"/g, "");
                    responses.push({file_id: id, href: href, etag: etag});
                });
                console.log('caldav');
                callback(responses);
            });
            result.on('error', function (err) {
                console.log('problem with result: ' + e.message);
                callback([
                    {'error': err.message}
                ]);
            });
        });
        request.on('error', function (e) {
            console.log('problem with request: ' + e.message);
            callback([
                {'error': e.message}
            ]);
        });
        request.write(queryTodosString);
        request.end();
    };


    var queryICSFile = function (id, callback) {
        var headers = {'Depth': 1, 'Prefer': 'return-minimal', 'Content-Type': 'application/xml; charset=utf-8'};
        var requestOptions = optionsCreator.createHttpOptions(options, 'GET', headers, id + '.ics');
        var request = http.request(requestOptions, function (result, error) {
            result.setEncoding('utf8');
            var body = '';
            result.on('data', function (chunk) {
                body += chunk;
            });
            result.on('end', function () {
                callback(body);
            });
        });
        request.end();
    };

    var getIcsData = function (callback) {
        queryAllTaskIds(function (tasks) {
            var taskQueryFunctions = [];
            tasks.forEach(function (val, index, array) {
                taskQueryFunctions.push(function (callback) {
                    queryICSFile(val.file_id, function (task) {
                        callback(null, {etag: val.etag, iCalData: task});
                    });
                });
            });
            async.parallel(taskQueryFunctions, function (err, results) {
                console.log(results);
                callback(results);
            });
        });
    };
    return {getIcsData: getIcsData};
};

if (!Array.prototype.last) {
    Array.prototype.last = function () {
        return this[this.length - 1];
    }
}