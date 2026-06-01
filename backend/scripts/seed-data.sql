USE deployment_learning;

INSERT INTO decision_trees (name, description, is_active) VALUES
('部署方案选择器', '帮助用户选择合适的部署方案', TRUE);

INSERT INTO contents (domain, level, title, description, content, examples, tags) VALUES
('build', 1, 'Vue 项目构建基础', '学习如何构建 Vue 3 项目', '构建是将源代码转换为可部署文件的过程...', '{"build_command": "npm run build", "output_dir": "dist"}', '["vue", "构建", "基础"]'),
('build', 2, '构建优化技巧', '学习如何优化构建输出', '通过配置可以显著减少构建文件大小...', '{"optimization": "配置 splitChunks"}', '["优化", "性能", "进阶"]'),
('platform', 1, 'Vercel 部署入门', '免费平台 Vercel 的使用指南', 'Vercel 是前端开发者的首选部署平台...', '{"deploy_command": "vercel --prod"}', '["vercel", "免费", "静态部署"]'),
('platform', 2, 'Netlify 配置详解', 'Netlify 的高级配置选项', 'Netlify 提供了丰富的配置选项...', '{"netlify_toml": "配置 publish 目录"}', '["netlify", "配置", "进阶"]'),
('server', 1, '服务器购买指南', '如何选择合适的服务器', '选择服务器需要考虑配置、价格、地域...', '{"instance_type": "t3.micro (AWS)"}', '["服务器", "AWS", "选择"]'),
('server', 2, 'SSH 连接服务器', '使用 SSH 安全连接服务器', 'SSH 是连接 Linux 服务器的标准方式...', '{"ssh_command": "ssh -i key.pem user@host"}', '["SSH", "连接", "安全"]'),
('automation', 1, 'GitHub Actions 基础', '自动化部署的入门指南', 'GitHub Actions 可以自动化构建和部署流程...', '{"workflow": "on: push"}', '["GitHub Actions", "CI/CD", "自动化"]'),
('automation', 2, '自动化测试集成', '在部署流程中集成测试', '自动化测试确保代码质量...', '{"test_step": "npm test"}', '["测试", "质量", "进阶"]'),
('domain', 1, '域名购买与解析', '如何购买和配置域名', '域名是网站的地址，需要正确配置DNS...', '{"dns_record": "A记录指向服务器IP"}', '["域名", "DNS", "解析"]'),
('domain', 2, 'HTTPS 证书配置', '为网站启用 HTTPS 加密', 'HTTPS 提供安全的连接...', '{"ssl_cert": "使用 Lets Encrypt 免费证书"}', '["HTTPS", "SSL", "安全"]'),
('container', 1, 'Docker 基础入门', '容器化部署的基础知识', 'Docker 可以将应用打包成容器...', '{"dockerfile": "FROM node:16"}', '["Docker", "容器", "基础"]'),
('container', 2, 'Docker Compose 应用', '使用 Compose 管理多个服务', 'Docker Compose 简化多容器应用管理...', '{"compose_file": "version 3"}', '["Docker Compose", "多容器", "进阶"]');
