'use strict';

const nconf = require.main.require('nconf');
const passport = require.main.require('passport');
const GithubStrategy = require('passport-github2').Strategy;

const User = require.main.require('./src/user');
const db = require.main.require('./src/database');
const meta = require.main.require('./src/meta');

const Github = {
	meta: {
		name: 'GitHub',
		id: 'github',
		icon: 'fa-brands fa-github',
		settingsKey: 'sso-github',
		envIdKey: 'SSO_GITHUB_CLIENT_ID',
		envSecretKey: 'SSO_GITHUB_CLIENT_SECRET',
		dbIdField: 'githubid',
		dbIdMapField: 'githubid:uid',
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

Github.init = async function ({ router, middleware }) {
	const hostHelpers = require.main.require('./src/routes/helpers');
	const { id, name } = Github.meta;

	hostHelpers.setupPageRoute(router, `/deauth/${id}`, [middleware.requireUser], (req, res) => {
		res.render('plugins/archcyril-sso/deauth', {
			service: name,
		});
	});
	router.post(`/deauth/${id}`, [middleware.requireUser, middleware.applyCSRF], hostHelpers.tryRoute(async (req, res) => {
		await Github.deleteUserData({ uid: req.user.uid });
		res.redirect(`${nconf.get('relative_path')}/me/edit`);
	}));

	const [settings, globalSettings] = await Promise.all([
		meta.settings.get(Github.meta.settingsKey),
		meta.settings.get('sso-archcyril'),
	]);
	Github.settings.id = settings.id || process.env[Github.meta.envIdKey] || undefined;
	Github.settings.secret = settings.secret || process.env[Github.meta.envSecretKey] || undefined;
	Github.global.autoconfirm = globalSettings.autoconfirm === 'on';
	Github.global.disableRegistration = globalSettings.disableRegistration === 'on';
};

Github.getStrategy = function (strategies) {
	if (!Github.settings.id || !Github.settings.secret) {
		return strategies;
	}

	passport.use(new GithubStrategy({
		clientID: Github.settings.id,
		clientSecret: Github.settings.secret,
		callbackURL: `${nconf.get('url')}/auth/github/callback`,
		passReqToCallback: true,
		scope: ['user:email'],
	}, async (req, accessToken, refreshToken, profile, done) => {
		try {
			if (req?.user?.uid && req.user.uid > 0) {
				await Promise.all([
					User.setUserField(req.user.uid, Github.meta.dbIdField, profile.id),
					db.setObjectField(Github.meta.dbIdMapField, profile.id, req.user.uid),
				]);
				return done(null, req.user);
			}

			const email = (Array.isArray(profile.emails) && profile.emails.length)
				? profile.emails[0].value
				: `${profile.username}@users.noreply.github.com`;
			const picture = (Array.isArray(profile.photos) && profile.photos.length)
				? profile.photos[0].value
				: '';

			const { queued, uid, message } = await Github.login(req, profile.id, profile.displayName, profile.username, email, picture);

			if (queued) {
				return done(null, false, { message });
			}
			done(null, { uid });
		} catch (err) {
			done(err);
		}
	}));

	strategies.push({
		name: 'github',
		url: '/auth/github',
		callbackURL: '/auth/github/callback',
		icon: Github.meta.icon,
		icons: {
			normal: 'fa-brands fa-github',
			square: 'fa-brands fa-github-square',
		},
		labels: {
			login: '[[social:sign-in-with-github]]',
			register: '[[social:sign-up-with-github]]',
		},
		color: '#25292f',
		scope: 'user:email',
	});

	return strategies;
};

Github.getAssociation = async function (data) {
	const ssoId = await User.getUserField(data.uid, Github.meta.dbIdField);
	const { name, icon, id } = Github.meta;

	if (ssoId) {
		data.associations.push({
			associated: true,
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

Github.login = async function (req, githubID, displayName, username, email, pictureUrl) {
	const { dbIdField, dbIdMapField, name } = Github.meta;

	let uid = await db.getObjectField(dbIdMapField, githubID);
	if (uid) {
		return { uid };
	}

	uid = await User.getUidByEmail(email);
	if (uid) {
		await Promise.all([
			User.setUserField(uid, dbIdField, githubID),
			db.setObjectField(dbIdMapField, githubID, uid),
		]);
		return { uid };
	}

	if (Github.global.disableRegistration) {
		throw new Error(`[[error:sso-registration-disabled, ${name}]]`);
	}

	return await User.createOrQueue(req, {
		[dbIdField]: githubID,
		username,
		email,
		fullname: displayName,
		picture: pictureUrl,
	}, {
		emailVerification: Github.global.autoconfirm ? 'verify' : 'send',
	});
};

Github.addToApprovalQueue = async function (hookData) {
	const { dbIdField } = Github.meta;
	const ssoId = hookData.userData[dbIdField];
	if (ssoId) {
		await validateSSOId(Github.meta.dbIdMapField, ssoId, Github.meta.name);
		hookData.data[dbIdField] = ssoId;
		if (hookData.userData.picture) {
			hookData.data.picture = hookData.userData.picture;
			hookData.data.uploadedpicture = hookData.userData.picture;
		}
	}
	return hookData;
};

Github.filterUserCreate = async function (hookData) {
	const { dbIdField } = Github.meta;
	const ssoId = hookData.data[dbIdField];
	if (ssoId) {
		await validateSSOId(Github.meta.dbIdMapField, ssoId, Github.meta.name);
		hookData.user[dbIdField] = ssoId;
		if (hookData.data.picture) {
			hookData.user.picture = hookData.data.picture;
			hookData.user.uploadedpicture = hookData.data.picture;
		}
	}
	return hookData;
};

Github.actionUserCreate = async function (hookData) {
	const { uid } = hookData.user;
	const { dbIdField, dbIdMapField } = Github.meta;
	const ssoId = await User.getUserField(uid, dbIdField);
	if (ssoId) {
		await db.setObjectField(dbIdMapField, ssoId, uid);
	}
};

Github.filterUserGetRegistrationQueue = async function (hookData) {
	const { users } = hookData;
	const { dbIdField, name, icon } = Github.meta;
	users.forEach((user) => {
		if (user?.[dbIdField]) {
			user.sso = { icon, name };
		}
	});
	return hookData;
};

Github.whitelistFields = function (data) {
	data.whitelist.push(Github.meta.dbIdField);
	return data;
};

Github.deleteUserData = async function (data) {
	const { uid } = data;
	const { dbIdField, dbIdMapField } = Github.meta;
	const ssoId = await User.getUserField(uid, dbIdField);
	if (ssoId) {
		await db.deleteObjectField(dbIdMapField, ssoId);
		await db.deleteObjectField(`user:${uid}`, dbIdField);
	}
};

Github.getConfig = function () {
	return {};
};

async function validateSSOId(dbIdMapField, ssoId, providerName) {
	const uid = await db.getObjectField(dbIdMapField, ssoId);
	if (uid) {
		throw new Error(`[[error:sso-account-exists, ${providerName}]]`);
	}
}

module.exports = Github;
