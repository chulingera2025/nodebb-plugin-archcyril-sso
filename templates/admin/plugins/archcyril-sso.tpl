<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 px-0 mb-4" tabindex="0">
			<ul class="nav nav-tabs mb-3">
				<li class="nav-item">
					<button class="nav-link {{{if activeTab == "google"}}}active{{{end}}}" data-bs-toggle="tab" data-bs-target="#google-tab">Google</button>
				</li>
				<li class="nav-item">
					<button class="nav-link {{{if activeTab == "github"}}}active{{{end}}}" data-bs-toggle="tab" data-bs-target="#github-tab">GitHub</button>
				</li>
			</ul>

			<div class="tab-content">
				<!-- Google -->
				<div class="tab-pane fade {{{if activeTab == "google"}}}show active{{{end}}}" id="google-tab">
					<div class="alert alert-info">
						<strong>快速开始</strong>
						<ol>
							<li>
								前往 <a href="https://console.cloud.google.com/apis/">Google Cloud 控制台 <i class="fa fa-external-link"></i></a> 创建<strong>新项目</strong>
							</li>
							<li>
								在 API 凭据管理中，创建一个<strong>OAuth 2.0 客户端 ID</strong>
								<ul>
									<li>应用类型选择 <strong>Web 应用</strong></li>
									<li>名称随意，例如 "NodeBB SSO"</li>
									<li>已获授权的 JavaScript 来源留空</li>
									<li>已获授权的重定向 URI 填写: <code>{baseUrl}/auth/google/callback</code>（输入后按回车确认）</li>
								</ul>
							</li>
							<li>创建完成后获取 <strong>客户端 ID</strong> 和 <strong>客户端密钥</strong></li>
							<li>可通过两种方式配置:
								<ul>
									<li>环境变量: <code>SSO_GOOGLE_CLIENT_ID</code>、<code>SSO_GOOGLE_CLIENT_SECRET</code></li>
									<li>下方表单（会覆盖环境变量的值）</li>
								</ul>
							</li>
							<li>保存后在 ACP 面板重启 NodeBB</li>
						</ol>
					</div>

					<form class="sso-google-settings">
						<div class="mb-3">
							<label class="form-label" for="google-id">客户端 ID</label>
							<input type="text" name="id" id="google-id" class="form-control" placeholder="客户端 ID">
						</div>
						<div class="mb-3">
							<label class="form-label" for="google-secret">客户端密钥</label>
							<input type="text" name="secret" id="google-secret" class="form-control" placeholder="客户端密钥">
						</div>
						<div class="mb-3">
							<label class="form-label" for="google-style">登录按钮样式</label>
							<select class="form-select" name="style" id="google-style">
								<option value="light">浅色</option>
								<option value="dark">深色</option>
							</select>
						</div>
						<div class="form-check mb-2">
							<input type="checkbox" class="form-check-input" id="google-autoconfirm" name="autoconfirm">
							<label class="form-check-label" for="google-autoconfirm">跳过 SSO 注册用户的邮箱验证</label>
						</div>
						<div class="form-check mb-3">
							<input type="checkbox" class="form-check-input" id="google-disableRegistration" name="disableRegistration">
							<label class="form-check-label" for="google-disableRegistration">禁止通过 SSO 注册新用户</label>
						</div>
					</form>
				</div>

				<!-- GitHub -->
				<div class="tab-pane fade {{{if activeTab == "github"}}}show active{{{end}}}" id="github-tab">
					<div class="alert alert-info">
						前往 <a href="https://github.com/settings/developers">GitHub 开发者设置 <i class="fa fa-external-link"></i></a> 创建新的 <strong>OAuth App</strong>，将凭据填入下方表单。
					</div>

					<form class="sso-github-settings">
						<div class="mb-3">
							<label class="form-label" for="github-id">客户端 ID</label>
							<input type="text" name="id" id="github-id" class="form-control" placeholder="客户端 ID">
						</div>
						<div class="mb-3">
							<label class="form-label" for="github-secret">客户端密钥</label>
							<input type="text" name="secret" id="github-secret" class="form-control" placeholder="客户端密钥">
						</div>
						<div class="mb-3">
							<label class="form-label" for="github-callback">Authorization callback URL</label>
							<input type="text" id="github-callback" class="form-control text-muted" value="{baseUrl}/auth/github/callback" readonly>
							<div class="form-text">确保 GitHub OAuth App 设置中已填写此地址</div>
						</div>
						<div class="form-check mb-2">
							<input type="checkbox" class="form-check-input" id="github-disableRegistration" name="disableRegistration">
							<label class="form-check-label" for="github-disableRegistration">禁止通过 SSO 注册新用户</label>
						</div>
						<div class="form-check mb-3">
							<input type="checkbox" class="form-check-input" id="github-needToVerifyEmail" name="needToVerifyEmail">
							<label class="form-check-label" for="github-needToVerifyEmail">要求 SSO 用户验证邮箱</label>
						</div>
					</form>
				</div>
			</div>

			<p class="form-text mt-2">
				限制注册后，仅已注册用户可以将 SSO 账号与本站关联。适用于防止用户绕过注册管控、或配合 NodeBB 注册审核队列使用。
			</p>
		</div>
	</div>
</div>
