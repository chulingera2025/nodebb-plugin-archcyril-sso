'use strict';

define('admin/plugins/archcyril-sso', ['settings', 'alerts'], function (Settings, alerts) {
	var ACP = {};

	ACP.init = function () {
		Settings.load('sso-archcyril', $('.sso-archcyril-settings'));
		Settings.load('sso-google', $('.sso-google-settings'));
		Settings.load('sso-github', $('.sso-github-settings'));
		Settings.load('sso-linuxdo', $('.sso-linuxdo-settings'));

		$('#save').on('click', function () {
			var saved = 0;
			var total = 4;

			function checkDone() {
				saved += 1;
				if (saved >= total) {
					alerts.alert({
						type: 'success',
						alert_id: 'archcyril-sso-saved',
						title: 'Settings Saved',
						message: 'Please rebuild and restart your NodeBB to apply these settings, or click on this alert to do so.',
						clickfn: function () {
							socket.emit('admin.reload');
						},
					});
				}
			}

			Settings.save('sso-archcyril', $('.sso-archcyril-settings'), checkDone);
			Settings.save('sso-google', $('.sso-google-settings'), checkDone);
			Settings.save('sso-github', $('.sso-github-settings'), checkDone);
			Settings.save('sso-linuxdo', $('.sso-linuxdo-settings'), checkDone);
		});
	};

	return ACP;
});
