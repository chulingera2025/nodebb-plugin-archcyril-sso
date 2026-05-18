'use strict';

const nconf = require.main.require('nconf');
const passport = require.main.require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require.main.require('./src/user');
const db = require.main.require('./src/database');
const meta = require.main.require('./src/meta');

const Google = {
	meta: {
		name: 'Google',
		id: 'google',
		icon: 'fa-brands fa-google',
		settingsKey: 'sso-google',
		envIdKey: 'SSO_GOOGLE_CLIENT_ID',
		envSecretKey: 'SSO_GOOGLE_CLIENT_SECRET',
		dbIdField: 'gplusid',
		dbIdMapField: 'gplusid:uid',
	},
	settings: {
		id: undefined,
		secret: undefined,
		style: 'light',
	},
	global: {
		autoconfirm: false,
		disableRegistration: false,
	},
};

Google.init = async function ({ router, middleware }) {
	const hostHelpers = require.main.require('./src/routes/helpers');
	const { id } = Google.meta;

	hostHelpers.setupPageRoute(router, `/deauth/${id}`, [middleware.requireUser], (req, res) => {
		res.render('plugins/archcyril-sso/deauth', {
			service: Google.meta.name,
		});
	});
	router.post(`/deauth/${id}`, [middleware.requireUser, middleware.applyCSRF], hostHelpers.tryRoute(async (req, res) => {
		await Google.deleteUserData({ uid: req.user.uid });
		res.redirect(`${nconf.get('relative_path')}/me/edit`);
	}));

	const [settings, globalSettings] = await Promise.all([
		meta.settings.get(Google.meta.settingsKey),
		meta.settings.get('sso-archcyril'),
	]);
	Google.settings.id = settings.id || process.env[Google.meta.envIdKey] || undefined;
	Google.settings.secret = settings.secret || process.env[Google.meta.envSecretKey] || undefined;
	Google.settings.style = settings.style || 'light';
	Google.global.autoconfirm = globalSettings.autoconfirm === 'on';
	Google.global.disableRegistration = globalSettings.disableRegistration === 'on';
};

Google.getStrategy = function (strategies) {
	if (!Google.settings.id || !Google.settings.secret) {
		return strategies;
	}

	passport.use(new GoogleStrategy({
		clientID: Google.settings.id,
		clientSecret: Google.settings.secret,
		callbackURL: `${nconf.get('url')}/auth/google/callback`,
		userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
		passReqToCallback: true,
	}, async (req, accessToken, refreshToken, profile, done) => {
		try {
			if (req?.user?.uid && req.user.uid > 0) {
				await Promise.all([
					User.setUserField(req.user.uid, Google.meta.dbIdField, profile.id),
					db.setObjectField(Google.meta.dbIdMapField, profile.id, req.user.uid),
				]);
				return done(null, req.user);
			}

			const { queued, uid, message } = await Google.login(req, {
				ssoId: profile.id,
				handle: profile.displayName,
				email: profile.emails[0].value,
				picture: profile._json.picture,
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
		name: 'google',
		url: '/auth/google',
		callbackURL: '/auth/google/callback',
		icon: Google.meta.icon,
		icons: {
			normal: 'fa-brands fa-google',
			square: 'fa-brands fa-google',
			svg: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 0 48 48" class="LgbsSe-Bz112c"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg>',
		},
		labels: {
			login: '[[social:sign-in-with-google]]',
			register: '[[social:sign-up-with-google]]',
		},
		color: '#1DA1F2',
		scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
		prompt: 'select_account',
	});

	return strategies;
};

Google.getAssociation = async function (data) {
	const ssoId = await User.getUserField(data.uid, Google.meta.dbIdField);
	const { name, icon, id } = Google.meta;

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

Google.login = async function (req, userData) {
	const { ssoId, handle, email, picture } = userData;
	const { dbIdField, dbIdMapField, name } = Google.meta;

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

	if (Google.global.disableRegistration) {
		throw new Error(`[[error:sso-registration-disabled, ${name}]]`);
	}

	return await User.createOrQueue(req, {
		[dbIdField]: ssoId,
		picture,
		username: handle,
		email,
	}, {
		emailVerification: Google.global.autoconfirm ? 'verify' : 'send',
	});
};

Google.addToApprovalQueue = async function (hookData) {
	const { dbIdField } = Google.meta;
	const ssoId = hookData.userData[dbIdField];
	if (ssoId) {
		await validateSSOId(Google.meta.dbIdMapField, ssoId, Google.meta.name);
		hookData.data[dbIdField] = ssoId;
		if (hookData.userData.picture) {
			hookData.data.picture = hookData.userData.picture;
			hookData.data.uploadedpicture = hookData.userData.picture;
		}
	}
	return hookData;
};

Google.filterUserCreate = async function (hookData) {
	const { dbIdField } = Google.meta;
	const ssoId = hookData.data[dbIdField];
	if (ssoId) {
		await validateSSOId(Google.meta.dbIdMapField, ssoId, Google.meta.name);
		hookData.user[dbIdField] = ssoId;
		if (hookData.data.picture) {
			hookData.user.picture = hookData.data.picture;
			hookData.user.uploadedpicture = hookData.data.picture;
		}
	}
	return hookData;
};

Google.actionUserCreate = async function (hookData) {
	const { uid } = hookData.user;
	const { dbIdField, dbIdMapField } = Google.meta;
	const ssoId = await User.getUserField(uid, dbIdField);
	if (ssoId) {
		await db.setObjectField(dbIdMapField, ssoId, uid);
	}
};

Google.filterUserGetRegistrationQueue = async function (hookData) {
	const { users } = hookData;
	const { dbIdField, name, icon } = Google.meta;
	users.forEach((user) => {
		if (user?.[dbIdField]) {
			user.sso = { icon, name };
		}
	});
	return hookData;
};

Google.whitelistFields = function (data) {
	data.whitelist.push(Google.meta.dbIdField);
	return data;
};

Google.deleteUserData = async function (data) {
	const { uid } = data;
	const { dbIdField, dbIdMapField } = Google.meta;
	const ssoId = await User.getUserField(uid, dbIdField);
	if (ssoId) {
		await db.deleteObjectField(dbIdMapField, ssoId);
		await db.deleteObjectField(`user:${uid}`, dbIdField);
	}
};

Google.getConfig = function () {
	return {
		style: Google.settings.style || 'light',
	};
};

async function validateSSOId(dbIdMapField, ssoId, providerName) {
	const uid = await db.getObjectField(dbIdMapField, ssoId);
	if (uid) {
		throw new Error(`[[error:sso-account-exists, ${providerName}]]`);
	}
}

module.exports = Google;
