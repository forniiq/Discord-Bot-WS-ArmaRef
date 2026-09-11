import { SERVER_CONFIG } from '@/config/server.config';
import type { ChatInputCommand, CommandData, CommandMetadata } from 'commandkit';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from 'discord.js';

export const metadata: CommandMetadata = {
    userPermissions: 'Administrator',
    guilds: SERVER_CONFIG.discord.guildId ? [SERVER_CONFIG.discord.guildId] : undefined
};

export const command: CommandData = {
    name: 'setup-players-manage',
    description: '📢 Отправить панель оплаты экзаменов и допусков',
};

export const chatInput: ChatInputCommand = async (ctx) => {
    if (!ctx.interaction.guild) return;

    const embed = new EmbedBuilder()
        .setTitle('УПРАВЛЕНИЕ ИГРОКАМИ')
        .setDescription('Нажмите на кнопку ниже.')
        .setColor('#7c1717')
    
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_player_kick')
            .setLabel('Кикнуть игрока')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('btn_player_ban')
            .setLabel('Забанить игрока')
            .setStyle(ButtonStyle.Danger),
    );

    try {
        const channel = ctx.interaction.channel;

        if (!channel || !channel.isSendable()) {
            return;
        }

        await channel.send({
            embeds: [embed],
            components: [row],
        });

        return void ctx.interaction.reply({
            content: 'Панель успешно отправлена.',
            flags: MessageFlags.Ephemeral,
        });
    } catch (err) {
        console.error("[SETUP-PLAYER-MANAGE] Ошибка отправки панели:", err);

        return void ctx.interaction.reply({
            content: '❌ Не удалось отправить панель в канал.',
            flags: MessageFlags.Ephemeral,
        });
    }
};
