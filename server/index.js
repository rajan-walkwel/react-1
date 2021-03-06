'use strict'

var React = require('react')
var dom = require('react-dom/server')
var combineStreams = require('combine-streams')
var statuses = require('statuses')
var base = require('../share/base')
var wrap = require('../share/wrap')

// Expose api.
module.exports = exports = reactMiddlewareSetup
exports.wrap = wrap

/**
 * Creates a Rill middleware that checks for react components in the body.
 * React components are converted to html.
 */
function reactMiddlewareSetup (opts) {
  var hasRoot = Boolean(opts && opts.root)
  return function reactMiddleware (ctx, next) {
    var req = ctx.req
    var res = ctx.res
    return next().then(function () {
      if (
        !React.isValidElement(res.body) ||
        statuses.redirect[res.status] ||
        statuses.empty[res.status] ||
        res.get('Location')
        ) return

      try {
        res.body = combineStreams()
          .append(hasRoot ? '' : '<!DOCTYPE html>')
          .append(dom.renderToNodeStream(
            React.createElement(base, {
              locals: ctx.locals,
              view: res.body,
              req: req
            })
          ))
          .append(null)
        res.set('Content-Type', 'text/html; charset=UTF-8')
      } catch (err) {
        res.body = undefined
        throw err
      }
    })
  }
}
