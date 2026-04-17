/**
 * 雅思口语每日推送脚本
 * 从题库随机抽取 Part 1 + Part 2/3 题目，发送到指定邮箱
 */

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const topics = JSON.parse(fs.readFileSync(path.join(__dirname, 'ielts_topics.json'), 'utf8'));

// ── 配置（通过 GitHub Secrets 环境变量传入） ──────────────────────────
const SMTP_USER  = process.env.SMTP_USER;
const SMTP_PASS  = process.env.SMTP_PASS;
const EMAIL_TO   = process.env.EMAIL_TO || SMTP_USER;   // 不配则默认发到发件邮箱
const EMAIL_FROM = SMTP_USER;                            // 发件人 = SMTP 登录账号

if (!SMTP_USER || !SMTP_PASS) {
  console.error('❌ 缺少环境变量 SMTP_USER 或 SMTP_PASS');
  console.error('   请在 GitHub 仓库 Settings → Secrets and variables → Actions 中配置：');
  console.error('   - SMTP_USER: 你的 QQ 邮箱地址');
  console.error('   - SMTP_PASS: QQ 邮箱授权码');
  process.exit(1);
}

// ── 随机抽取函数 ────────────────────────────────────────────────────
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── 抽取今日题目 ────────────────────────────────────────────────────
const part1 = pickRandom(topics.part1);
const isPart2 = Math.random() > 0.5;
const partOther = isPart2
  ? pickRandom(topics.part2)
  : pickRandom(topics.part3);
const partOtherLabel = isPart2 ? 'Part 2' : 'Part 3';

// ── 格式化日期 ──────────────────────────────────────────────────────
const today = new Date();
const dateStr = today.toLocaleDateString('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
});

// ── 构建邮件内容 ─────────────────────────────────────────────────────
function buildPart1Content(q) {
  return `📌 ${q.category}

[P1] ${q.question}`;
}

function buildPart2Content(q) {
  const hints = q.hints.map(h => `• ${h}`).join('\n');
  return `📌 ${q.type} 类

[P2] ${q.question}

📝 答题要点：
${hints}`;
}

function buildPart3Content(q) {
  return `📌 ${q.category}

[P3] ${q.question}`;
}

// ── 邮件 HTML ────────────────────────────────────────────────────────
const part1Body  = buildPart1Content(part1);
const part2Body  = isPart2 ? buildPart2Content(partOther) : buildPart3Content(partOther);

const htmlBody = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>雅思口语每日练习</title>
</head>
<body style="font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">

  <!-- 顶部卡片 -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 28px 24px; margin-bottom: 20px; color: white;">
    <div style="font-size: 12px; opacity: 0.85; margin-bottom: 6px;">📅 ${dateStr}</div>
    <div style="font-size: 22px; font-weight: 700;">雅思口语每日练习</div>
    <div style="font-size: 13px; opacity: 0.8; margin-top: 6px;">每天进步一点点，冲刺 Band 7+ 🎯</div>
  </div>

  <!-- Part 1 -->
  <div style="background: white; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
    <div style="display: inline-block; background: #e8f0fe; color: #1a73e8; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
      Part 1 · 日常话题
    </div>
    <div style="color: #555; font-size: 11px; margin-bottom: 8px;">${part1.category}</div>
    <div style="font-size: 16px; line-height: 1.7; color: #222;">
      ${part1.question}
    </div>
  </div>

  <!-- Part 2 or 3 -->
  <div style="background: white; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
    <div style="display: inline-block; background: #fce8e6; color: #d93025; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
      ${partOtherLabel} · ${isPart2 ? partOther.type + '类' : partOther.category}
    </div>
    <div style="font-size: 16px; line-height: 1.7; color: #222; margin-bottom: 14px;">
      ${partOther.question}
    </div>
    ${isPart2 ? `
    <div style="border-top: 1px solid #eee; padding-top: 12px; margin-top: 4px;">
      <div style="font-size: 12px; color: #888; margin-bottom: 8px;">📝 答题要点</div>
      ${partOther.hints.map(h => `<div style="font-size: 14px; color: #444; line-height: 2; padding-left: 12px;">• ${h}</div>`).join('')}
    </div>` : ''}
  </div>

  <!-- 提示 -->
  <div style="background: #fff8e1; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
    <div style="font-size: 13px; color: #5d4037; line-height: 1.8;">
      💡 <strong>练习建议</strong><br>
      · Part 1 每个问题建议回答 <strong>20–30 秒</strong>，3–5 句话<br>
      · Part 2 准备 1 分钟，答题 <strong>1–2 分钟</strong><br>
      · Part 3 每个问题建议回答 <strong>40–60 秒</strong>，展开观点<br>
      · 练习时<strong>录音</strong>，回听并改进表达
    </div>
  </div>

  <!-- 底部 -->
  <div style="text-align: center; font-size: 11px; color: #aaa; margin-top: 24px;">
    由 GitHub Actions 自动推送 · 雅思口语每日练习
  </div>

</body>
</html>
`;

const textBody = `
雅思口语每日练习 · ${dateStr}
=====================================

📌 Part 1 · ${part1.category}
[P1] ${part1.question}

📌 ${partOtherLabel} · ${isPart2 ? partOther.type + '类' : partOther.category}
[${partOtherLabel}] ${partOther.question}
${isPart2 ? '\n答题要点：\n' + partOther.hints.map(h => '  • ' + h).join('\n') : ''}

=====================================
💡 练习建议
· Part 1 每个问题建议回答 20–30 秒，3–5 句话
· Part 2 准备 1 分钟，答题 1–2 分钟
· Part 3 每个问题建议回答 40–60 秒，展开观点
· 练习时录音，回听并改进表达

由 GitHub Actions 自动推送
`;

// ── 发送邮件 ────────────────────────────────────────────────────────
async function send() {
  console.log('📋 今日抽题结果：');
  console.log(`  Part 1  [${part1.category}]: ${part1.question}`);
  console.log(`  ${partOtherLabel} [${isPart2 ? partOther.type : partOther.category}]: ${partOther.question}`);
  console.log('  正在发送邮件...\n');

  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: `📬 雅思口语每日练习 · ${dateStr}`,
    text: textBody,
    html: htmlBody,
  });

  console.log(`✅ 邮件已发送！Message ID: ${info.messageId}`);
}

send().catch(err => {
  console.error('❌ 发送失败:', err.message);
  process.exit(1);
});
