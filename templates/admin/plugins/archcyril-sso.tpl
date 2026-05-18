<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 px-0 mb-4" tabindex="0">
			<ul class="nav nav-tabs mb-3" role="tablist">
				<li class="nav-item" role="presentation">
					<button class="nav-link {{{if activeTab == "google"}}}active{{{end}}}" data-bs-toggle="tab" data-bs-target="#google-tab" type="button" role="tab">Google</button>
				</li>
				<li class="nav-item" role="presentation">
					<button class="nav-link {{{if activeTab == "github"}}}active{{{end}}}" data-bs-toggle="tab" data-bs-target="#github-tab" type="button" role="tab">GitHub</button>
				</li>
			</ul>

			<div class="tab-content">
				<!-- Google Tab -->
				<div class="tab-pane fade {{{if activeTab == "google"}}}show active{{{end}}}" id="google-tab" role="tabpanel">
					<div class="alert alert-info">
						<strong>Quick Start</strong>
						<ol>
							<li>
								Create a <strong>New Project</strong> via the
								<a href="https://console.cloud.google.com/apis/">Google Cloud Console <i class="fa fa-external-link"></i></a>
							</li>
							<li>
								From the "Credentials" page, create a new "OAuth 2.0 Client ID".
								<ul>
									<li>The "Application Type" is "Web application"</li>
									<li>"Name" can be anything. Perhaps "NodeBB SSO" will suffice.</li>
									<li>"Authorized Javascript origins" can be left empty</li>
									<li>
										The "Authorised Redirect URI" is your NodeBB's URL with <code>/auth/google/callback</code> appended to it.
										<ul>
											<li>Our best guess for this site is <code>{baseUrl}/auth/google/callback</code></li>
											<li>When you enter this value into the text field, be sure to hit <code>Enter</code> to submit the URL before saving</li>
										</ul>
									</li>
								</ul>
							</li>
							<li>You will be shown a screen containing your <strong>Client ID</strong> and <strong>Client Secret</strong>.</li>
							<li>You can set these values in two ways:
								<ul>
									<li>Use environment variables
										<ul>
											<li><code>export SSO_GOOGLE_CLIENT_ID='Client ID'</code></li>
											<li><code>export SSO_GOOGLE_CLIENT_SECRET='Client Secret'</code></li>
										</ul>
									</li>
									<li>Use the form below (this overrides environment variables)</li>
								</ul>
							</li>
							<li>Save and restart NodeBB via the ACP Dashboard</li>
						</ol>
					</div>
					<form role="form" class="sso-google-settings">
						<div class="mb-3">
							<label for="google-id">Client ID</label>
							<input type="text" name="id" id="google-id" title="Client ID" class="form-control input-lg" placeholder="Client ID">
						</div>
						<div class="mb-3">
							<label for="google-secret">Client Secret</label>
							<input type="text" name="secret" id="google-secret" title="Client Secret" class="form-control" placeholder="Client Secret">
						</div>
						<div class="mb-3">
							<label for="google-style">Login Button Style</label>
							<select class="form-select" name="style" id="google-style" title="Login Button Style">
								<option value="light">Light</option>
								<option value="dark">Dark</option>
							</select>
						</div>
						<div class="form-check mb-2">
							<input type="checkbox" class="form-check-input" id="google-autoconfirm" name="autoconfirm">
							<label for="google-autoconfirm" class="form-check-label">
								Skip email verification for people who register using SSO?
							</label>
						</div>
						<div class="form-check mb-3">
							<input type="checkbox" class="form-check-input" id="google-disableRegistration" name="disableRegistration">
							<label for="google-disableRegistration" class="form-check-label">
								Disable user registration via SSO
							</label>
						</div>
					</form>
				</div>

				<!-- GitHub Tab -->
				<div class="tab-pane fade {{{if activeTab == "github"}}}show active{{{end}}}" id="github-tab" role="tabpanel">
					<div class="alert alert-info">
						Register a new <strong>GitHub OAuth App</strong> via
						<a href="https://github.com/settings/developers">Developer Applications <i class="fa fa-external-link"></i></a> and then paste your application details here.
					</div>
					<form class="sso-github-settings">
						<div class="mb-3">
							<label for="github-id">Client ID</label>
							<input type="text" name="id" id="github-id" title="Client ID" class="form-control" placeholder="Client ID">
						</div>
						<div class="mb-3">
							<label for="github-secret">Client Secret</label>
							<input type="text" name="secret" id="github-secret" title="Client Secret" class="form-control" placeholder="Client Secret">
						</div>
						<div class="mb-3 alert alert-warning">
							<label for="github-callback">Your NodeBB's "Authorization callback URL"</label>
							<input type="text" id="github-callback" title="Authorization callback URL" class="form-control" value="{baseUrl}/auth/github/callback" readonly>
							<p class="form-text">
								Ensure that this value is set in your GitHub application's settings
							</p>
						</div>
						<div class="form-check mb-2">
							<input type="checkbox" class="form-check-input" id="github-disableRegistration" name="disableRegistration">
							<label for="github-disableRegistration" class="form-check-label">
								Disable user registration via SSO
							</label>
						</div>
						<div class="form-check mb-3">
							<input type="checkbox" class="form-check-input" id="github-needToVerifyEmail" name="needToVerifyEmail">
							<label for="github-needToVerifyEmail" class="form-check-label">
								Require email verification for SSO users
							</label>
						</div>
					</form>
				</div>
			</div>

			<p class="form-text">
				Restricting registration means that only registered users can associate their account with this SSO strategy.
				This restriction is useful if you have users bypassing registration controls by using social media accounts, or
				if you wish to use the NodeBB registration queue.
			</p>
		</div>
	</div>
</div>
