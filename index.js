const Honeybadger = require('honeybadger');
const log4jsErrorLevel = require('log4js/lib/levels')().ERROR.level;

function notifyHoneybadger(filter_status, name, error, ...rest) {
    if (typeof error === 'string') {
        error = new Error(error);
    }

    if (!error) {
        return;
    }

    if (error && error.status && filter_status.indexOf(error.status) !== -1) {
        return;
    }

    let context = {};
    rest.forEach(r => {
        if (typeof r === 'string') {
            error.message += `. ${r}`;
        } else {
            Object.assign(context, r);
        }
    });

    let actionFallback = context.action;
    let componentFallback = context.component;

    delete context.action;
    delete context.component;

    let {
        headers = {}, action = actionFallback, component = componentFallback, params = {}
    } = error;

    Object.assign(context, error.context);

    Honeybadger.notify(error, {
        context,
        headers,
        cgiData: {
            'server-software': `Node ${process.version}`
        },
        action,
        component: component || name,
        params,
        fingerprint: action && component ? `${component}_${action}` : name
    });
}

const honeyBadgerAppender = ({
    filter_status = []
}) => {
    return logEvent => {
        if (logEvent.level.level < log4jsErrorLevel) {
            return;
        }
        notifyHoneybadger.apply(this, [filter_status, logEvent.categoryName].concat(logEvent.data));
    };
};

function configure(config = {}) {
    const {
        filter_status = []
    } = config;
    return honeyBadgerAppender({
        filter_status
    });
}

module.exports = {
    configure
};