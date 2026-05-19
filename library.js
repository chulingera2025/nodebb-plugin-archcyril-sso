'use strict';

const nconf = require.main.require('nconf');

const google = require('./lib/providers/google');
const github = require('./lib/providers/github');

const providers = [google, github];

const Plugin = {};

Plugin.init = async function (data) {
	const hostHelpers = require.main.require('./src/routes/helpers');
	const { router } = data;

	hostHelpers.setupAdminPageRoute(router, '/admin/plugins/archcyril-sso', (req, res) => {
		const tab = req.query.tab || 'google';
		res.render('admin/plugins/archcyril-sso', {
			title: 'ArchCyril SSO',
			baseUrl: nconf.get('url'),
			activeTab: tab,
			isGoogleActive: tab === 'google',
			isGithubActive: tab === 'github',
		});
	});

	await Promise.all(providers.map((p) => p.init(data)));
};

Plugin.filterAuthInit = async function (strategies) {
	for (const provider of providers) {
		strategies = await provider.getStrategy(strategies);
	}
	return strategies;
};

Plugin.filterAuthList = async function (data) {
	for (const provider of providers) {
		data = await provider.getAssociation(data);
	}
	return data;
};

Plugin.filterUserWhitelistFields = function (data) {
	for (const provider of providers) {
		data = provider.whitelistFields(data);
	}
	return data;
};

Plugin.addToApprovalQueue = async function (hookData) {
	for (const provider of providers) {
		hookData = await provider.addToApprovalQueue(hookData);
	}
	return hookData;
};

Plugin.filterUserCreate = async function (hookData) {
	for (const provider of providers) {
		hookData = await provider.filterUserCreate(hookData);
	}
	return hookData;
};

Plugin.actionUserCreate = async function (hookData) {
	for (const provider of providers) {
		hookData = await provider.actionUserCreate(hookData);
	}
};

Plugin.filterUserGetRegistrationQueue = async function (hookData) {
	for (const provider of providers) {
		hookData = await provider.filterUserGetRegistrationQueue(hookData);
	}
	return hookData;
};

Plugin.deleteUserData = async function (data) {
	await Promise.all(providers.map((p) => p.deleteUserData(data)));
};

Plugin.filterConfigGet = function (data) {
	for (const provider of providers) {
		data[provider.meta.settingsKey] = provider.getConfig();
	}
	return data;
};

Plugin.addAdminMenuItem = function (header) {
	header.authentication.push({
		route: '/plugins/archcyril-sso',
		icon: 'fa-shield-halved',
		name: 'SSO',
	});
	return header;
};

module.exports = Plugin;
