const path = require("node:path");
const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { fetch } = require("undici");
const { getConfig } = require("../config");

const avatarCircle = {
  x: 310,
  y: 403,
  radius: 226
};

async function loadRemoteImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image distante inaccessible: ${response.status}`);
  }

  return loadImage(Buffer.from(await response.arrayBuffer()));
}

async function createMemberCard(member, type) {
  const config = getConfig();
  const templatePath = path.resolve(config.rootDir, config.cardTemplate);
  const template = await loadImage(templatePath);
  const canvas = createCanvas(template.width, template.height);
  const context = canvas.getContext("2d");

  context.drawImage(template, 0, 0, template.width, template.height);

  const avatarUrl = member.user.displayAvatarURL({
    extension: "png",
    size: 1024,
    forceStatic: true
  });
  const avatar = await loadRemoteImage(avatarUrl);

  context.save();
  context.beginPath();
  context.arc(avatarCircle.x, avatarCircle.y, avatarCircle.radius, 0, Math.PI * 2);
  context.closePath();
  context.clip();
  context.drawImage(
    avatar,
    avatarCircle.x - avatarCircle.radius,
    avatarCircle.y - avatarCircle.radius,
    avatarCircle.radius * 2,
    avatarCircle.radius * 2
  );
  context.restore();

  context.beginPath();
  context.arc(avatarCircle.x, avatarCircle.y, avatarCircle.radius - 2, 0, Math.PI * 2);
  context.lineWidth = 8;
  context.strokeStyle = "#334496";
  context.stroke();

  const fileName = `${type}-${member.id}.png`;
  return {
    attachment: new AttachmentBuilder(await canvas.encode("png"), { name: fileName }),
    fileName
  };
}

module.exports = {
  createMemberCard
};
