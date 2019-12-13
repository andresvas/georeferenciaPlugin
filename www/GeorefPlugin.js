var exec = require('cordova/exec');

exports.initMonitoringControl = function (success, error) {
    exec(success, error, 'GeorefPlugin', 'INIT_MONITORING_CONTROL');
};

exports.openVisitUs = function (success, error,) {
    exec(success, error, 'GeorefPlugin', 'OPEN_VISIT_US');
};
