'use strict';

const nconf = require.main.require('nconf');
const passport = require.main.require('passport');
const LinuxDoStrategy = require('passport-linuxdo').Strategy;

const User = require.main.require('./src/user');
const db = require.main.require('./src/database');
const meta = require.main.require('./src/meta');

const LinuxDo = {
	meta: {
		name: 'LinuxDO',
		id: 'linuxdo',
		icon: 'fa-brands fa-linux',
		settingsKey: 'sso-linuxdo',
		envIdKey: 'SSO_LINUXDO_CLIENT_ID',
		envSecretKey: 'SSO_LINUXDO_CLIENT_SECRET',
		dbIdField: 'linuxdoid',
		dbIdMapField: 'linuxdoid:uid',
	},
	settings: {
		id: undefined,
		secret: undefined,
	},
	global: {
		autoconfirm: false,
		disableRegistration: false,
	},
};

LinuxDo.init = async function ({ router, middleware }) {
	const hostHelpers = require.main.require('./src/routes/helpers');
	const { id, name } = LinuxDo.meta;

	hostHelpers.setupPageRoute(router, `/deauth/${id}`, [middleware.requireUser], (req, res) => {
		res.render('plugins/archcyril-sso/deauth', {
			service: name,
		});
	});
	router.post(`/deauth/${id}`, [middleware.requireUser, middleware.applyCSRF], hostHelpers.tryRoute(async (req, res) => {
		await LinuxDo.deleteUserData({ uid: req.user.uid });
		res.redirect(`${nconf.get('relative_path')}/me/edit`);
	}));

	const [settings, globalSettings] = await Promise.all([
		meta.settings.get(LinuxDo.meta.settingsKey),
		meta.settings.get('sso-archcyril'),
	]);
	LinuxDo.settings.id = settings.id || process.env[LinuxDo.meta.envIdKey] || undefined;
	LinuxDo.settings.secret = settings.secret || process.env[LinuxDo.meta.envSecretKey] || undefined;
	LinuxDo.global.autoconfirm = globalSettings.autoconfirm === 'on';
	LinuxDo.global.disableRegistration = globalSettings.disableRegistration === 'on';
};

LinuxDo.getStrategy = function (strategies) {
	if (!LinuxDo.settings.id || !LinuxDo.settings.secret) {
		return strategies;
	}

	passport.use(new LinuxDoStrategy({
		clientID: LinuxDo.settings.id,
		clientSecret: LinuxDo.settings.secret,
		callbackURL: `${nconf.get('url')}/auth/linuxdo/callback`,
		passReqToCallback: true,
	}, async (req, accessToken, refreshToken, profile, done) => {
		try {
			if (req?.user?.uid && req.user.uid > 0) {
				await Promise.all([
					User.setUserField(req.user.uid, LinuxDo.meta.dbIdField, profile.id),
					db.setObjectField(LinuxDo.meta.dbIdMapField, profile.id, req.user.uid),
				]);
				return done(null, req.user);
			}

			const { queued, uid, message } = await LinuxDo.login(req, {
				ssoId: profile.id,
				username: profile.username,
				handle: profile.name || profile.username,
				email: profile.email,
				picture: profile.avatar_url,
			});

			if (queued) {
				return done(null, false, { message });
			}
			done(null, { uid });
		} catch (err) {
			done(err);
		}
	}));

	strategies.push({
		name: 'linuxdo',
		url: '/auth/linuxdo',
		callbackURL: '/auth/linuxdo/callback',
		icon: LinuxDo.meta.icon,
		icons: {
			normal: 'fa-brands fa-linux',
			square: 'fa-brands fa-linux',
		},
		labels: {
			login: '[[social:sign-in-with-linuxdo]]',
			register: '[[social:sign-up-with-linuxdo]]',
		},
		color: '#2d6da4',
		scope: 'read',
	});

	return strategies;
};

LinuxDo.getAssociation = async function (data) {
	const ssoId = await User.getUserField(data.uid, LinuxDo.meta.dbIdField);
	const { name, icon, id } = LinuxDo.meta;

	if (ssoId) {
		data.associations.push({
			associated: true,
			url: '#',
			deauthUrl: `${nconf.get('url')}/deauth/${id}`,
			name,
			icon,
		});
	} else {
		data.associations.push({
			associated: false,
			url: `${nconf.get('url')}/auth/${id}`,
			name,
			icon,
		});
	}
	return data;
};

LinuxDo.login = async function (req, userData) {
	const { ssoId, handle, username, email, picture } = userData;
	const { dbIdField, dbIdMapField, name } = LinuxDo.meta;

	let uid = await db.getObjectField(dbIdMapField, ssoId);
	if (uid) {
		return { uid };
	}

	uid = await User.getUidByEmail(email);
	if (uid) {
		await Promise.all([
			User.setUserField(uid, dbIdField, ssoId),
			db.setObjectField(dbIdMapField, ssoId, uid),
		]);
		return { uid };
	}

	if (LinuxDo.global.disableRegistration) {
		throw new Error(`[[error:sso-registration-disabled, ${name}]]`);
	}

	return await User.createOrQueue(req, {
		[dbIdField]: ssoId,
		username: username,
		email,
		picture,
	}, {
		emailVerification: LinuxDo.global.autoconfirm ? 'verify' : 'send',
	});
};

LinuxDo.addToApprovalQueue = async function (hookData) {
	const { dbIdField } = LinuxDo.meta;
	const ssoId = hookData.userData[dbIdField];
	if (ssoId) {
		await validateSSOId(LinuxDo.meta.dbIdMapField, ssoId, LinuxDo.meta.name);
		hookData.data[dbIdField] = ssoId;
		if (hookData.userData.picture) {
			hookData.data.picture = hookData.userData.picture;
			hookData.data.uploadedpicture = hookData.userData.picture;
		}
	}
	return hookData;
};

LinuxDo.filterUserCreate = async function (hookData) {
	const { dbIdField } = LinuxDo.meta;
	const ssoId = hookData.data[dbIdField];
	if (ssoId) {
		await validateSSOId(LinuxDo.meta.dbIdMapField, ssoId, LinuxDo.meta.name);
		hookData.user[dbIdField] = ssoId;
		if (hookData.data.picture) {
			hookData.user.picture = hookData.data.picture;
			hookData.user.uploadedpicture = hookData.data.picture;
		}
	}
	return hookData;
};

LinuxDo.actionUserCreate = async function (hookData) {
	const { uid } = hookData.user;
	const { dbIdField, dbIdMapField } = LinuxDo.meta;
	const ssoId = await User.getUserField(uid, dbIdField);
	if (ssoId) {
		await db.setObjectField(dbIdMapField, ssoId, uid);
	}
};

LinuxDo.filterUserGetRegistrationQueue = async function (hookData) {
	const { users } = hookData;
	const { dbIdField, name, icon } = LinuxDo.meta;
	users.forEach((user) => {
		if (user?.[dbIdField]) {
			user.sso = { icon, name };
		}
	});
	return hookData;
};

LinuxDo.whitelistFields = function (data) {
	data.whitelist.push(LinuxDo.meta.dbIdField);
	return data;
};

LinuxDo.deleteUserData = async function (data) {
	const { uid } = data;
	const { dbIdField, dbIdMapField } = LinuxDo.meta;
	const ssoId = await User.getUserField(uid, dbIdField);
	if (ssoId) {
		await db.deleteObjectField(dbIdMapField, ssoId);
		await db.deleteObjectField(`user:${uid}`, dbIdField);
	}
};

LinuxDo.getConfig = function () {
	return {};
};

async function validateSSOId(dbIdMapField, ssoId, providerName) {
	const uid = await db.getObjectField(dbIdMapField, ssoId);
	if (uid) {
		throw new Error(`[[error:sso-account-exists, ${providerName}]]`);
	}
}

module.exports = LinuxDo;
