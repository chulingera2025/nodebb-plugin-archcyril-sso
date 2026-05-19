<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 px-0 mb-4" tabindex="0">
			<!-- Global SSO Settings -->
			<div class="card mb-3">
				<div class="card-header">全局 SSO 设置</div>
				<div class="card-body">
					<form class="sso-archcyril-settings">
						<div class="form-check mb-2">
							<input type="checkbox" class="form-check-input" id="sso-autoconfirm" name="autoconfirm">
							<label class="form-check-label" for="sso-autoconfirm">跳过 SSO 注册用户的邮箱验证</label>
						</div>
						<div class="form-check mb-0">
							<input type="checkbox" class="form-check-input" id="sso-disableRegistration" name="disableRegistration">
							<label class="form-check-label" for="sso-disableRegistration">禁止通过 SSO 注册新用户</label>
						</div>
					</form>
				</div>
			</div>

			<ul class="nav nav-tabs mb-3">
				<li class="nav-item">
					<button class="nav-link {{{if isGoogleActive}}}active{{{end}}}" data-bs-toggle="tab" data-bs-target="#google-tab">Google</button>
				</li>
				<li class="nav-item">
					<button class="nav-link {{{if isGithubActive}}}active{{{end}}}" data-bs-toggle="tab" data-bs-target="#github-tab">GitHub</button>
				</li>
			</ul>

			<div class="tab-content">
				<!-- Google -->
				<div class="tab-pane fade {{{if isGoogleActive}}}show active{{{end}}}" id="google-tab">
					<div class="alert alert-info">
						<strong>快速开始</strong>
						<ol>
							<li>前往 <a href="https://console.cloud.google.com/apis/">Google Cloud 控制台 <i class="fa fa-external-link"></i></a>，创建<strong>新项目</strong></li>
							<li>凭据管理中创建 <strong>OAuth 2.0 客户端 ID</strong>，应用类型选 <strong>Web 应用</strong></li>
							<li>重定向 URI 填写: <code>{baseUrl}/auth/google/callback</code>（输入后按回车确认）</li>
							<li>获取 <strong>客户端 ID</strong> 和 <strong>密钥</strong>，填入下方或通过环境变量 <code>SSO_GOOGLE_CLIENT_ID</code>、<code>SSO_GOOGLE_CLIENT_SECRET</code> 配置</li>
							<li>保存后重启 NodeBB</li>
						</ol>
					</div>

					<form class="sso-google-settings">
						<div class="mb-3">
							<label class="form-label" for="google-id">客户端 ID</label>
							<input type="text" name="id" id="google-id" class="form-control" placeholder="客户端 ID">
						</div>
						<div class="mb-3">
							<label class="form-label" for="google-secret">客户端密钥</label>
							<input type="password" name="secret" id="google-secret" class="form-control" placeholder="客户端密钥">
						</div>
						<div class="mb-3">
							<label class="form-label" for="google-callback">重定向 URI</label>
							<input type="text" id="google-callback" class="form-control text-muted" value="{baseUrl}/auth/google/callback" readonly>
							<div class="form-text">确保 Google Cloud 中已配置此地址</div>
						</div>
						<div class="mb-3">
							<label class="form-label" for="google-style">登录按钮样式</label>
							<select class="form-select" name="style" id="google-style">
								<option value="light">浅色</option>
								<option value="dark">深色</option>
							</select>
						</div>
					</form>
				</div>

				<!-- GitHub -->
				<div class="tab-pane fade {{{if isGithubActive}}}show active{{{end}}}" id="github-tab">
					<div class="alert alert-info">
						<strong>快速开始</strong>
						<ol>
							<li>前往 <a href="https://github.com/settings/developers">GitHub 开发者设置 <i class="fa fa-external-link"></i></a>，创建 <strong>OAuth App</strong></li>
							<li>重定向 URL 填写: <code>{baseUrl}/auth/github/callback</code></li>
							<li>获取 <strong>Client ID</strong> 和 <strong>Client Secret</strong>，填入下方或通过环境变量 <code>SSO_GITHUB_CLIENT_ID</code>、<code>SSO_GITHUB_CLIENT_SECRET</code> 配置</li>
							<li>保存后重启 NodeBB</li>
						</ol>
					</div>

					<form class="sso-github-settings">
						<div class="mb-3">
							<label class="form-label" for="github-id">客户端 ID</label>
							<input type="text" name="id" id="github-id" class="form-control" placeholder="客户端 ID">
						</div>
						<div class="mb-3">
							<label class="form-label" for="github-secret">客户端密钥</label>
							<input type="password" name="secret" id="github-secret" class="form-control" placeholder="客户端密钥">
						</div>
						<div class="mb-3">
							<label class="form-label" for="github-callback">重定向 URL</label>
							<input type="text" id="github-callback" class="form-control text-muted" value="{baseUrl}/auth/github/callback" readonly>
							<div class="form-text">确保 GitHub OAuth App 中已配置此地址</div>
						</div>
					</form>
				</div>
			</div>

			<p class="form-text mt-2">
				限制注册后，仅已注册用户可将 SSO 账号与本站关联。适用于防止绕过注册管控、或配合 NodeBB 注册审核队列。
			</p>
		</div>
	</div>
</div>
