const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  EmbedBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder
} = require("discord.js");

const blue = 0x334496;

function isComponentsV2Available() {
  return Boolean(ContainerBuilder && TextDisplayBuilder && MessageFlags?.IsComponentsV2);
}

function buildFallback({ title, body, imageName, attachment, footer }) {
  const embed = new EmbedBuilder()
    .setColor(blue)
    .setTitle(title)
    .setDescription(body)
    .setFooter({ text: footer || "Gendarmerie Nationale" });

  if (imageName) embed.setImage(`attachment://${imageName}`);

  return {
    embeds: [embed],
    files: attachment ? [attachment] : [],
    allowedMentions: { parse: ["users"] }
  };
}

function buildComponentMessage({ title, body, imageName, attachment, footer, button }) {
  if (!isComponentsV2Available()) {
    return buildFallback({ title, body, imageName, attachment, footer });
  }

  const container = new ContainerBuilder()
    .setAccentColor(blue)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## ${title}\n${body}`)
    );

  if (imageName) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(`attachment://${imageName}`)
      )
    );
  }

  container
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize?.Small ?? 1)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`*${footer || "Gendarmerie Nationale"}*`)
    );

  const components = [container];

  if (button?.label && button?.url) {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel(button.label)
          .setURL(button.url)
      )
    );
  }

  return {
    flags: MessageFlags.IsComponentsV2,
    components,
    files: attachment ? [attachment] : [],
    allowedMentions: { parse: ["users"] }
  };
}

module.exports = {
  buildComponentMessage
};
