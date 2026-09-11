import { SERVER_CONFIG } from '@/config/server.config';
import type { ChatInputCommand, CommandData, CommandMetadata } from 'commandkit';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from 'discord.js';

export const metadata: CommandMetadata = {
    userPermissions: 'Administrator',
    guilds: SERVER_CONFIG.discord.guildId ? [SERVER_CONFIG.discord.guildId] : undefined
};

export const command: CommandData = {
    name: 'setup-restart',
    description: '📢 Отправить панель управления сервером',
};

export const chatInput: ChatInputCommand = async (ctx) => {
    if (!ctx.interaction.guild) return;

    const embed = new EmbedBuilder()
        .setTitle('УПРАВЛЕНИЕ СЕРВЕРОМ')
        .setDescription('Нажмите на кнопку ниже.')
        .setColor('#175f7c')
    
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_server_restart')
            .setLabel('Рестарт сервера')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('btn_server_shutdown')
            .setLabel('Выключить сервер')
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
        console.error("[SETUP-RESTART] Ошибка отправки панели:", err);
        
        return void ctx.interaction.reply({
            content: '❌ Не удалось отправить панель в канал.',
            flags: MessageFlags.Ephemeral,
        });
    }
};
