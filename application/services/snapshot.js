var webshot = require('webshot');

function SnapshotService() {

};

SnapshotService.text = {
};

SnapshotService.prototype.init = function () {
};

SnapshotService.prototype.takeTagSnapshot = function (tagCode, snapshotPath, callback) {
    webshot('https://seal.qiwi.com/online/#/details?tagCode=' + tagCode + '&hideConfidencial=1', snapshotPath, {
        phantomConfig: {
            'ssl-protocol': 'any',
            'proxy-type': 'socks5',
            'ignore-ssl-errors': 'true'
        },
        shotSize: {
            width: 1080,
            height: 1400
        },
        cookies: [{
            name: 'jwt',
            value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpbiI6Im4ua2hyb211c2hraW4iLCJpYXQiOjE0OTE0OTAwNjd9.r9rIDNv1GCsj9EmE5IaSmZab3CnwI62D5drV9JBrSKk',
            domain: 'seal.qiwi.com',
            path: '/'
        }],
        takeShotOnCallback: true
    }, callback);
};

SnapshotService.prototype.takeProviderSnapshot = function (idPrv, snapshotPath, callback) {
    webshot('https://seal.qiwi.com/47c/#/monitoring/?prv=' + idPrv + '&timeCode=M&daysCount=1&hideConfidencial=true', snapshotPath, {
        phantomConfig: {
            'ssl-protocol': 'any',
            'proxy-type': 'socks5',
            'ignore-ssl-errors': 'true'
        },
        shotSize: {
            width: 1024,
            height: 840
        },
        shotOffset: {
            //хардкод плохо
            top: 180,
            left: 0,
            right: 0,
            bottom: 180
        },
        takeShotOnCallback: true
    }, callback);
};

exports.SnapshotService = SnapshotService;