'use strict';
var path = require('path');
var chalk = require('chalk');
var logSymbols = require('log-symbols');
var plur = require('plur');
var stringWidth = require('string-width');
var ansiEscapes = require('ansi-escapes');

module.exports = function (results) {
	var lines = [];
	var errorCount = 0;
	var warningCount = 0;
	var maxLineWidth = 0;
	var maxColumnWidth = 0;
	var maxMessageWidth = 0;

	results.forEach(function (result) {
		var messages = result.messages;

		if (messages.length === 0) {
			return;
		}

		errorCount += result.errorCount;
		warningCount += result.warningCount;

		if (lines.length !== 0) {
			lines.push({type: 'separator'});
		}

		var filePath = result.filePath;
		var relativeFilePath = path.relative('.', result.filePath);

		lines.push({
			type: 'header',
			filePath: filePath,
			relativeFilePath: relativeFilePath,
			firstLine: messages[0].line
		});

		messages.forEach(function (x) {
			var msg = x.message;

			// stylize inline code blocks
			msg = msg.replace(/`(.*?)`/g, function (m) {
				return chalk.bold(m.slice(1, -1));
			});

			var line = String(x.line || 0);
			var column = String(x.column || 0);
			var lineWidth = stringWidth(line);
			var columnWidth = stringWidth(column);
			var messageWidth = stringWidth(msg);

			maxLineWidth = Math.max(lineWidth, maxLineWidth);
			maxColumnWidth = Math.max(columnWidth, maxColumnWidth);
			maxMessageWidth = Math.max(messageWidth, maxMessageWidth);

			lines.push({
				type: 'message',
				severity: (x.fatal || x.severity === 2) ? 'error' : 'warning',
				line: line,
				lineWidth: lineWidth,
				column: column,
				columnWidth: columnWidth,
				message: msg,
				messageWidth: messageWidth,
				ruleId: x.ruleId || ''
			});
		});
	});

	var output = '\n';

	// make relative paths Cmd+click'able in iTerm
	output += ansiEscapes.iTerm.setCwd();

	output += lines.map(function (x) {
		if (x.type === 'header') {
			// add the line number so it's Cmd+click'able in some terminals
			// use dim & gray for terminals like iTerm that doesn't support `hidden`
			return '  ' + chalk.underline(x.relativeFilePath + chalk.hidden.dim.gray(':' + x.firstLine));
		}

		if (x.type === 'message') {
			var char = x.severity === 'warning' ? logSymbols.warning : logSymbols.error;
			return [
				'',
				char,
				padding(maxLineWidth - x.lineWidth) + x.line + chalk.gray(':') + x.column,
				padding(maxColumnWidth - x.columnWidth) + x.message,
				padding(maxMessageWidth - x.messageWidth) + chalk.dim(x.ruleId)
			].join('  ');
		}

		return '';
	}).join('\n') + '\n\n';

	if (errorCount > 0) {
		output += '  ' + chalk.red(errorCount + ' ' + plur('error', errorCount)) + '\n';
	}

	if (warningCount > 0) {
		output += '  ' + chalk.yellow(warningCount + ' ' + plur('warning', warningCount)) + '\n';
	}

	return (errorCount + warningCount) > 0 ? output : '';
};

function padding(size) {
	return Array(size + 1).join(' ');
}