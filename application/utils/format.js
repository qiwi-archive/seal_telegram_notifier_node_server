function Format() {

};

Format.text = {
    lookAtTroubles : 'Посмотрите, пожалуйста, некоторые проблемы требуют Вашего внимания: ',
    onlineCase : 'Срабатывание онлайн-мониторинга: ',
    replicationTroubles : 'Проблемы с последней репликацией: ',
    replicationTroublesNoLogs : 'Нет репликации. Совсем нет.',
    createdIssue : 'Создан тикет в Jira: '
};

Format.formatReplicationData = function (replicationData) {
    var text = Format.text.replicationTroubles + "\r\n";
    if (replicationData === 'NO_LOGS!') {
        text += Format.text.replicationTroublesNoLogs;
        return text;
    }
    for (var i = 0; i < replicationData.length; i++) {
        text += "Источник: QWDB \r\n";
        text += 'Запущена в ' + replicationData[i].replicationStartDate + "\r\n";
        text += 'Завершена в ' + replicationData[i].replicationEndDate + "\r\n";
        text += 'Последняя запись в БД - источнике от ' + replicationData[i].replicationMaxDate + "\r\n";
        text += "\r\n";
    }
    return text;
};

Format.formatCasesForTelegram = function (cases) {
    var text = Format.text.lookAtTroubles + "\r\n";
    for (var i = 0; i < cases.length; i++) {
        text += (i+1) + ': ' + '<a href="'
            + configs.clientDomainName + '/cases/?search=' + encodeURIComponent(cases[i].prsManager) + '">'
            + cases[i].prsManager + ': (' + cases[i].idPrvCount + ')' + '</a>' + "\r\n";
    }
    return text;
};

Format.formatCasesForEmail = function (cases) {
    var text = Format.text.lookAtTroubles + "<br><ul>";
    for (var i = 0; i < cases.length; i++) {
        text += '<li><a href="' + configs.clientDomainName + '/cases/?search=' + cases[i].prsManager.replace(/\s+/g, '%20') + '">'
            + cases[i].prsManager + ': (' + cases[i].idPrvCount + ')' + '</a>' + "</li>";
    }
    text += '</ul>';
    return text;
};

Format.formatOnlineCasesForTelegram = function (cases, needPrefix = true) {
    var text = needPrefix ? Format.text.onlineCase + "\r\n" : '';
    for (var i = 0; i < cases.length; i++) {
        text += (i+1) + ': ' + '<a href="'
            + configs.clientDomainName + '/online_cases/?tagCode=' + encodeURIComponent(cases[i].tagCode) + '">'
            + cases[i].tagName + ' - ' + cases[i].tagDescription + ':' + " ( \r\n"
            + cases[i].caseStartDtime + ' - ' + cases[i].caseEndDtime + " \r\n"
            + Format.formatPlusMinus(cases[i].caseCountDeviation) + '% выставлений' + "\r\n"
            + Format.formatPlusMinus(cases[i].caseConversionDeviation) + '% конверсии' + "\r\n"
            + Format.formatPlusMinus(cases[i].casePaymentsCountDeviation) + '% оплат' + "\r\n)"
            + '</a>' + "\r\n";
    }
    return text;
};

Format.formatPlusMinus = function (value) {
    if (value == 0) return '-' + value;
    return value > 0 ? '+' + value : value;
}

Format.formatOnlineCasesForEmail = function (cases) {
    var text = Format.text.onlineCase + "<br><ul>";
    for (var i = 0; i < cases.length; i++) {
        text += '<li><a href="' + configs.clientDomainName + '/online_cases/?tagCode=' + cases[i].tagCode + '">'
            + cases[i].tagName + ' - ' + cases[i].tagDescription + ':' + " ( \r\n"
            + cases[i].caseStartDtime + ' - ' + cases[i].caseEndDtime + " \r\n"
            + Format.formatPlusMinus(cases[i].caseCountDeviation) + '% выставлений' + "\r\n"
            + Format.formatPlusMinus(cases[i].caseConversionDeviation) + '% конверсии' + "\r\n"
            + Format.formatPlusMinus(cases[i].casePaymentsCountDeviation) + '% оплат' + "\r\n)"
            + '</a>' + "</li>";
    }
    text += '</ul>';
    return text;
};

Format.formatOnlineCasesForJira = function (cases) {
    var text = Format.text.onlineCase + "\r\n";
    for (var i = 0; i < cases.length; i++) {
        text += '* ' // BULLETED LIST
            + '[' + cases[i].tagName + ' - ' + cases[i].tagDescription
            + '|' // LINK
            + configs.clientDomainName + '/online_cases/?tagCode=' + cases[i].tagCode + '] :' + " \r\n"
            + '** ' +cases[i].caseStartDtime + ' - ' + cases[i].caseEndDtime + " \r\n"
            + '** ' + Format.formatPlusMinus(cases[i].caseCountDeviation) + '% выставлений' + "\r\n"
            + '** ' + Format.formatPlusMinus(cases[i].caseConversionDeviation) + '% конверсии' + "\r\n"
            + '** ' + Format.formatPlusMinus(cases[i].casePaymentsCountDeviation) + '% оплат' + "\r\n";
    }
    return text;
};

Format.formatJiraIssueLinkForTelegram = function(issueKey) {
    var text = Format.text.createdIssue + ' ';
    text += '<a href="'
            + configs.jira.host + '/browse/' + issueKey + '">'
            + issueKey + '</a>';
    return text;
}

exports.Format = Format;