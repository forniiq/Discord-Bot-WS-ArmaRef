import { SERVER_CONFIG } from '@/config/server.config';
import { rcon } from '@/services/rcon.service';
import type { EventHandler } from 'commandkit';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from 'discord.js';

const handler: EventHandler<'interactionCreate'> = async (interaction) => {
    if (!interaction.guild) return;

    if (!interaction.isButton()) return;

    // Подтверждение перезапуска сервера
    if (interaction.customId === 'btn_server_restart') {
        if (!rcon.isConnected()) {
            return void interaction.reply({
                content: 'RCON Не активен, повторите попытку позже.',
                flags: MessageFlags.Ephemeral
            })
        }

        const confirmRestartEmbed = new EmbedBuilder()
            .setTitle('⚠️ ПОДТВЕРЖДЕНИЕ РЕСТАРТА')
            .setDescription(
                `Вы действительно хотите запустить **перезапуск сервера**?`
            )
            .setColor('#fee75c');
        
        const confirmRestartRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_restart_server`)
                .setLabel(`Подтвердить рестарт`)
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⚠️'),

            new ButtonBuilder()
                .setCustomId('cancel_server')
                .setLabel('Отмена')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❌')
        );

        return void interaction.reply({
            embeds: [confirmRestartEmbed],
            components: [confirmRestartRow],
            flags: MessageFlags.Ephemeral
        });
    }

    // Подтверждение выключения сервера
    if (interaction.channelId === 'btn_server_shutdown') {
        if (!rcon.isConnected()) {
            return void interaction.reply({
                content: 'RCON Не активен, повторите попытку позже.',
                flags: MessageFlags.Ephemeral
            })
        }

        const confirmRestartEmbed = new EmbedBuilder()
            .setTitle('⚠️ ПОДТВЕРЖДЕНИЕ ВЫКЛЮЧЕНИЯ')
            .setDescription(
                `Вы действительно хотите запустить **выключение сервера**?`
            )
            .setColor('#fee75c');
        
        const confirmRestartRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_shutdown_server`)
                .setLabel(`Подтвердить выключение`)
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⚠️'),

            new ButtonBuilder()
                .setCustomId('cancel_server')
                .setLabel('Отмена')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❌')
        );

        return void interaction.reply({
            embeds: [confirmRestartEmbed],
            components: [confirmRestartRow],
            flags: MessageFlags.Ephemeral
        });
    }

    // Перезапуск сервера
    if (interaction.customId === 'confirm_restart_server')  {
        if (!rcon.isConnected()) {
            return void interaction.reply({
                content: 'RCON Не активен, повторите попытку позже.',
                flags: MessageFlags.Ephemeral
            })
        }

        await interaction.deferUpdate();

        try {
            await rcon.restart();

            const ANNOUNCE_CHANNEL_ID = SERVER_CONFIG.discord.announseChannelId;

            if (ANNOUNCE_CHANNEL_ID) {
                const announceChannel =
                    interaction.guild.channels.cache.get(
                        ANNOUNCE_CHANNEL_ID
                    ) ||
                    await interaction.guild.channels.fetch(
                        ANNOUNCE_CHANNEL_ID
                    );
                
                if (!announceChannel || !announceChannel.isSendable()) {
                    return void interaction.editReply({
                        content: "❌ Канал для анонсов недоступен.",
                        embeds: [],
                        components: [],
                    });
                }

                const publicEmbed = new EmbedBuilder()
                    .setTitle('РЕСТАРТ СЕРВЕРА')
                    .setDescription(`Перезапуск инициировал <@${interaction.user.id}>`);
                
                await announceChannel.send({
                    content: '@here',
                    embeds: [publicEmbed]
                })
            }

            return void interaction.editReply({
                content: '✅ Команда перезапуска отправлена.',
                embeds: [],
                components: [],
            });
        } catch (err) {
            console.error("[ArmaRestart] Ошибка рестарта:", err);

            return void interaction.editReply({
                content: "❌ Не удалось выполнить перезапуск сервера.",
                embeds: [],
                components: [],
            });
        }
    }

    // Выключение сервера
    if (interaction.customId === 'confirm_shutdown_server') {
        if (!rcon.isConnected()) {
            return void interaction.reply({
                content: 'RCON Не активен, повторите попытку позже.',
                flags: MessageFlags.Ephemeral
            })
        }

        await interaction.deferUpdate();

        try {
            await rcon.shutdown();

            const ANNOUNCE_CHANNEL_ID = SERVER_CONFIG.discord.announseChannelId;

            if (ANNOUNCE_CHANNEL_ID) {
                const announceChannel =
                    interaction.guild.channels.cache.get(
                        ANNOUNCE_CHANNEL_ID
                    ) ||
                    await interaction.guild.channels.fetch(
                        ANNOUNCE_CHANNEL_ID
                    );
                
                if (!announceChannel || !announceChannel.isSendable()) {
                    return void interaction.editReply({
                        content: "❌ Канал для анонсов недоступен.",
                        embeds: [],
                        components: [],
                    });
                }

                const publicEmbed = new EmbedBuilder()
                    .setTitle('ВЫКЛЮЧЕНИЕ СЕРВЕРА')
                    .setDescription(`Выключение инициировал <@${interaction.user.id}>`);
                
                await announceChannel.send({
                    content: '@here',
                    embeds: [publicEmbed]
                })
            }

            return void interaction.editReply({
                content: '✅ Команда выключения отправлена.',
                embeds: [],
                components: [],
            });
        } catch (err) {
            console.error("[ArmaShutdown] Ошибка выключения:", err);

            return void interaction.editReply({
                content: "❌ Не удалось выполнить выключение сервера.",
                embeds: [],
                components: [],
            });
        }
    }

    // Отмена
    if (interaction.channelId === 'cancel_server') {
        return void interaction.update({
            content: '❌ **Операция отменена.**',
            embeds: [],
            components: []
        });
    }
};

export default handler;
