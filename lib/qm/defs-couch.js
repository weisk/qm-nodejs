//- JavaScript source code

//- defs-couch.js ~~
//
//  These definitions are likely to become deprecated in the future, because
//  there's a mistake (probably several) somewhere in here that I haven't had
//  good luck finding yet. Node.js 0.12 has been released now, which means that
//  I won't have to deal with `maxSockets` anymore, so there's still hope for
//  QM and CouchDB, but ... yeah. The most likely solution will be to port the
//  current definitions over to the Ruby version and then drop Node.js support,
//  at least temporarily.
//
//                                                      ~~ (c) SRW, 25 Sep 2012
//                                                  ~~ last updated 08 Feb 2015

(function () {
    'use strict';

 // Pragmas

    /*jshint maxparams: 3, quotmark: single, strict: true */

    /*jslint indent: 4, maxlen: 80, node: true, nomen: true */

    /*properties
        api, avar_ttl, body, box_status, ceil, collect_garbage, 'Content-Type',
        couch, create, end, error, get_avar, get_list, headers, _id, isMaster,
        join, key, keys, length, log, method, now, on, parse,
        persistent_storage, protocol, push, request, _rev, set_avar,
        statusCode, stringify, toString, trafficlog_storage, trim
    */

 // Declarations

    var cluster, create_db, http, https, stringify, upload_ddoc, url;

 // Definitions

    cluster = require('cluster');

    create_db = function (conn, callback) {
     // This function needs documentation.
        var options, protocol, req;
        options = Object.create(conn);
        options.method = 'PUT';
        protocol = (conn.protocol === 'http:') ? http : https;
        req = protocol.request(options, function (response) {
         // This function needs documentation.
            var temp = [];
            response.on('data', function (chunk) {
             // This function needs documentation.
                temp.push(chunk.toString());
                return;
            });
            response.on('end', function () {
             // This function needs documentation.
                return callback(null, temp.join(''));
            });
            return;
        });
        req.on('error', callback);
        req.end();
        return;
    };

    http = require('http');

    https = require('https');

    stringify = function (obj, keys) {
     // This function only exists to serialize the design document cleanly. It
     // doesn't demand the level of sophistication that the browser client's
     // `serialize` method does because we know that this function will run in
     // Node.js and that all functions will be serializable :-)
        /*jslint unparam: true */
        var i, n, temp;
        temp = {};
        n = keys.length;
        for (i = 0; i < n; i += 1) {
            temp[keys[i]] = obj[keys[i]];
        }
        return JSON.stringify(temp, function (key, val) {
         // See the explanation above ;-)
            if ((typeof val === 'function') && (val instanceof Function)) {
                return val.toString();
            }
            return val;
        });
    };

    upload_ddoc = function (file, app_url, callback) {
     // This function needs documentation.
        var opts, protocol, req;
        opts = url.parse(app_url);
        opts.method = 'GET';
        protocol = (opts.protocol === 'http:') ? http : https;
        req = protocol.request(opts, function (response) {
         // This function needs documentation.
            var temp = [];
            response.on('data', function (chunk) {
             // This function needs documentation.
                temp.push(chunk.toString());
                return;
            });
            response.on('end', function () {
             // This function needs documentation.
                var new_dd, $new_dd, old_dd, $old_dd, opts2, req2;
                new_dd = require(file);
                $old_dd = temp.join('');
                if (response.statusCode === 200) {
                    old_dd = JSON.parse($old_dd);
                    new_dd = require(file);
                    new_dd._id = old_dd._id;
                    new_dd._rev = old_dd._rev;
                    $new_dd = stringify(new_dd, Object.keys(old_dd));
                    $old_dd = stringify(old_dd, Object.keys(old_dd));
                    if ($new_dd === $old_dd) {
                        return callback(null, 'Design document unchanged.');
                    }
                } else {
                    $new_dd = stringify(new_dd, Object.keys(new_dd));
                }
                console.log('Uploading a new design document ...');
                opts2 = Object.create(opts);
                opts2.method = 'PUT';
                req2 = protocol.request(opts2, function (response) {
                 // This function needs documentation.
                    var temp2 = [];
                    response.on('data', function (chunk) {
                     // This function needs documentation.
                        temp2.push(chunk.toString());
                        return;
                    });
                    response.on('end', function () {
                     // This function needs documentation.
                        return callback(null, temp2.join(''));
                    });
                    return;
                });
                req2.on('error', callback);
                req2.end($new_dd);
                return;
            });
            return;
        });
        req.on('error', callback);
        req.end();
        return;
    };

    url = require('url');

 // Out-of-scope definitions

    exports.api = function (settings) {
     // This function needs documentation.

        var app_url, collect_garbage, conn, get_avar, get_list, protocol,
            set_avar;

        app_url = settings.persistent_storage.couch + '/_design/app/';

        collect_garbage = function () {
         // This function removes old documents from the "db" database, but it
         // does not trigger compaction. The reason is simple -- automatic
         // compaction is a standard feature of CouchDB 1.2 and later. To read
         // more about configuring your couch, see http://goo.gl/V634R.
            var callback, opts, req, target;
            callback = function (err) {
             // This function needs documentation.
                if (err !== null) {
                    console.error('Error:', err);
                    return;
                }
                console.log('Finished collecting garbage.');
                return;
            };
            target = app_url + '_list/as-array/outdated?startkey=0&endkey=' +
                    (Date.now() - (settings.avar_ttl * 1000));
            opts = url.parse(target);
            opts.method = 'GET';
            req = protocol.request(opts, function (res) {
             // This function needs documentation.
                var temp = [];
                res.on('data', function (chunk) {
                 // This function needs documentation.
                    temp.push(chunk.toString());
                    return;
                });
                res.on('end', function () {
                 // This function needs documentation.
                    var body, opts2, req2;
                    body = temp.join('');
                    if (body === '[]') {
                        return callback(null);
                    }
                    opts2 = url.parse(settings.persistent_storage.couch +
                            '/_bulk_docs');
                    opts2.headers = {'Content-Type': 'application/json'};
                    opts2.method = 'POST';
                    req2 = protocol.request(opts2, function () {
                     // This function omits named parameters because it omits
                     // them anyway.
                        return callback(null);
                    });
                    req2.on('error', callback);
                    req2.end('{"docs":' + body + '}');
                    return;
                });
                return;
            });
            req.on('error', callback);
            req.end();
            return;
        };

        conn = url.parse(settings.persistent_storage.couch);

        get_avar = function (params, callback) {
         // This function needs documentation.
            var opts, req, target;
            target = app_url + '_update/touch/' + params[0] + '&' + params[1] +
                    '?new_edits=false'; // see http://goo.gl/K95Yf6
            opts = url.parse(target);
            opts.method = 'PUT';
            req = protocol.request(opts, function (res) {
             // This function needs documentation.
                var temp = [];
                res.on('data', function (chunk) {
                 // This function needs documentation.
                    temp.push(chunk.toString());
                    return;
                });
                res.on('end', function () {
                 // This function needs documentation.
                    return callback(null, temp.join(''));
                });
                return;
            });
            req.on('error', callback);
            req.end();
            return;
        };

        get_list = function (params, callback) {
         // This function needs documentation.
            var opts, req, target;
            target = app_url + '_list/as-array/jobs?key=["' +  params[0] +
                    '","' + params[1] + '"]';
            opts = url.parse(target);
            opts.method = 'GET';
            req = protocol.request(opts, function (res) {
             // This function needs documentation.
                var temp = [];
                res.on('data', function (chunk) {
                 // This function needs documentation.
                    temp.push(chunk.toString());
                    return;
                });
                res.on('end', function () {
                 // This function needs documentation.
                    return callback(null, temp.join(''));
                });
                return;
            });
            req.on('error', callback);
            req.end();
            return;
        };

        protocol = (conn.protocol === 'http:') ? http : https;

        set_avar = function (params, callback) {
         // This function needs documentation.
            var obj, opts, req;
            if (params.length === 4) {
                obj = {
                    _id:        params[0] + '&' + params[1], // "box_key"
                    body:       params[3],
                    box_status: params[0] + '&' + params[2],
                    key:        params[1]
                };
            } else {
                obj = {
                    _id:        params[0] + '&' + params[1], // "box_key"
                    body:       params[2],
                    key:        params[1]
                };
            }
            opts = url.parse(app_url + '_update/upsert/' + obj._id);
            opts.headers = {'Content-Type': 'application/json'};
            opts.method = 'POST';
            req = protocol.request(opts, function (res) {
             // This function needs documentation.
                if (res.statusCode === 409) {
                 // When working with update handlers, conflicts happen.
                    if (typeof setImmediate === 'function') {
                        setImmediate(set_avar, params, callback);
                    } else {
                        setTimeout(set_avar, 0, params, callback);
                    }
                    return;
                }
                res.on('data', function () {
                 // This function is empty, but it is necessary due to changes
                 // in the way that the streaming API works in Node.js, as of
                 // version 0.10 and later.
                    return;
                });
                res.on('end', function () {
                 // This function needs documentation.
                    if ((res.statusCode !== 201) && (res.statusCode !== 202)) {
                     // Ordinarily, we want a 201, but batch mode returns an
                     // "HTTP 202: Accepted" response, and Cloudant's BigCouch
                     // seems to use batch mode sometimes. All other status
                     // codes indicate an error.
                        return callback(res.statusCode);
                    }
                    return callback(null);
                });
                return;
            });
            req.on('error', callback);
            req.end(JSON.stringify(obj));
            return;
        };

        if (cluster.isMaster) {
            create_db(conn, function (err, response) {
             // This function needs documentation.
                if (err !== null) {
                    console.error('Error:', err);
                }
                upload_ddoc('./couch-api-ddoc', app_url, function (err) {
                 // This function also accepts a second argument that contains
                 // the "results" of the query, but because I don't use it, I
                 // have omitted it to avoid irritating JSLint et al.
                    if (err !== null) {
                        console.error('Error:', err);
                    }
                    console.log(response.trim());
                    console.log('API: CouchDB storage is ready.');
                    return;
                });
                return;
            });
        }
        return {
            collect_garbage: collect_garbage,
            get_avar: get_avar,
            get_list: get_list,
            set_avar: set_avar
        };
    };

    exports.log = function (settings) {
     // This function needs documentation.
        var conn, protocol;
        conn = url.parse(settings.trafficlog_storage.couch);
        protocol = (conn.protocol === 'http:') ? http : https;
        if (cluster.isMaster) {
            create_db(conn, function (err) {
             // This function needs documentation.
                if (err !== null) {
                    console.error('Error:', err);
                }
                console.log('LOG: CouchDB storage is ready.');
                return;
            });
        }
        return function (obj) {
         // This function needs documentation. It seems weird to close over the
         // `conn` object, too, so that probably needs a closer inspection ...
            var req;
            conn.headers = {'Content-Type': 'application/json'};
            conn.method = 'POST';
            req = protocol.request(conn, function (res) {
             // This function needs documentation.
                res.on('data', function () {
                 // This function is empty, but it is necessary due to changes
                 // in the way that the streaming API works in Node.js, as of
                 // version 0.10 and later.
                    return;
                });
                res.on('end', function () {
                 // See the explanation given above.
                    return;
                });
                return;
            });
            req.on('error', function (message) {
             // This function needs documentation.
                console.error('Error:', message);
                return;
            });
            req.end(JSON.stringify(obj));
            return;
        };
    };

 // That's all, folks!

    return;

}());

//- vim:set syntax=javascript:
