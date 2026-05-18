'use strict';

define('admin/plugins/archcyril-sso', ['settings', 'alerts'], function (Settings, alerts) {
	var ACP = {};

	ACP.init = function () {
		Settings.load('sso-google', $('.sso-google-settings'));
		Settings.load('sso-github', $('.sso-github-settings'));

		$('#save').on('click', function () {
			var googleSaved = false;
			var githubSaved = false;

			function checkDone() {
				if (googleSaved && githubSaved) {
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

			Settings.save('sso-google', $('.sso-google-settings'), function () {
				googleSaved = true;
				checkDone();
			});
			Settings.save('sso-github', $('.sso-github-settings'), function () {
				githubSaved = true;
				checkDone();
			});
		});
	};

	return ACP;
});
