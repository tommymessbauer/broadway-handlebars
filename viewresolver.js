var _ = require('lodash'),
    findit = require('findit'),
    path = require('path'),
    async = require('async'),
    fs = require('fs');

var ViewResolver = function(options) {
    this.options = _.defaults(options, {
        base: process.cwd(),
        ext: "html"
    });

    if (!(this.options.base instanceof Array)) {
        this.options.base = [this.options.base];
    }
};

// var getSingle = function(name, callback) {
//     fs.readFile(this.options.base + name, 'utf-8', callback);
// };

var getAll = function(base, ext, callback) {
    var regexExt = new RegExp("\\." + ext + "$"),
        dict = {},
        basePath = path.normalize(base);

    // walk the contents of the base path
    var finder = findit.find(basePath),
        paths = [];

    // for each file...
    finder.on('file', function(file, stat) {
        // ...if this is a file of the expected extension...
        if (regexExt.test(file)) {
            // ... then hold onto the path
            paths.push(file);
        }
    });

    finder.on('err', function(file, stat) {
        callback(err);
    });

    finder.on('end', function() {
        // we got all the templates. load their contents asynchronously
        async.forEach(
            // arr
            paths,
            // iterator
            function(path, callback) {
                fs.readFile(path, 'utf-8', function(err, data) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        // simplify the key to be relative to base path and omit file extension
                        var key = path.replace(basePath + '/', '').replace(regexExt, '');
                        dict[key] = data;
                        callback();
                    }
                })
            },
            // callback
            function(err) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, dict);
                }
            }

        );
    });
};

// /**
// * Retrieves the markup for a given view.
// *
// **/
// ViewResolver.prototype.get = function(name, callback) {
//     var ops = _.map(this.options.base, function(base) {
//         return function(cb) {
//             getSingle(base + name, cb);
//         };
//     });

//     async.parallel(ops, function(err, results) {
//         var markup = _.find(results, function(r) { return r != null; });
//         callback(markup || 'Could not locate the view', markup);
//     });
    
// };

/**
* Retrieves the markup for all views in a given folder.  
* Return will be in format of 
*    key: path relative to the base
*    val: the contents of the file
**/
ViewResolver.prototype.all = function(callback) {
    var that = this,
        ops = _.map(this.options.base, function(base) {
            return function(cb) {
                getAll(base, that.options.ext, cb);
            };
        });

    async.parallel(ops.reverse(), function(err, results) {
        var dict = results.splice(0, 1)[0];
        _.each(results, function(r) {
            _.extend(dict, r);
        });
        callback(null, dict);
    });
};

module.exports = ViewResolver;
