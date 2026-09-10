import { Client } from "commandkit";
import { rcon } from "@/services/rcon.service";
import { RconPlayer } from "@/types/rcon.types";
import { SERVER_CONFIG } from "@/config/server.config";
import { EmbedBuilder, TextChannel } from "discord.js";
import { readFile, writeFile } from "node:fs/promises";

class MonitoringService {
    private client: Client | null = null;

    init(client: Client) {
        this.client = client;
    }

    async start() {
        while (true) {
            try {
                await this.update();
            } catch (error) {
                console.error("[MONITOR] Update error:", error);
            }

            await new Promise(resolve =>
                setTimeout(
                    resolve,
                    SERVER_CONFIG.monitor.updateInterval
                )
            );
        }
    }

    async update() {
        if (!this.client) return;

        const players = await rcon.players();

        const embed = this.createEmbedHead(players.length);

        if (players.length !== 0) {
            const playersField = this.createPlayersField(players);
            embed.addFields(playersField);
        } else {
            embed.addFields({
                name: "ИГРОКИ",
                value: "Игроков онлайн нет.",
            });
        }

        const channel = await this.client.channels.fetch(
            SERVER_CONFIG.monitor.channelId
        );

        if (!channel || !channel.isSendable()) {
            return;
        }

        const textChannel = channel as unknown as TextChannel;

        const data = await readFile("data/data.json", "utf-8");
        const json = JSON.parse(data);

        const messageId = json.monitorMessageId;

        try {
            const message = await textChannel.messages.fetch(messageId);

            await message.edit({
                embeds: [embed],
            });

        } catch {
            await this.cleanupOldMessages(textChannel);

            const message = await textChannel.send({
                embeds: [embed],
            });

            const jsonData = {
                monitorMessageId: message.id,
            };

            await writeFile(
                "data/data.json",
                JSON.stringify(jsonData, null, 2)
            );
        }
    }

    private async cleanupOldMessages(channel: TextChannel) {
        const messages = await channel.messages.fetch({
            limit: 100,
        });

        const monitorMessages = messages.filter(
            message =>
                message.embeds[0]?.title === "===== МОНИТОРИНГ ====="
        );

        for (const message of monitorMessages.values()) {
            await message.delete();
        }
    }

    private createEmbedHead(online: number) {
        const unix = Math.floor(Date.now() / 1000);

        return new EmbedBuilder()
            .setTitle("===== МОНИТОРИНГ =====")
            .setColor("#48493d")
            .setDescription(
                [
                    "```yaml",
                    `ОНЛАЙН      | ${online} Игроков`,
                    `СЕРВЕР      | ${SERVER_CONFIG.server.ip}:${SERVER_CONFIG.server.port}`,
                    "```",
                    "",
                    `*ОБНОВЛЕНО: <t:${unix}:R>`,
                ].join("\n")
            );
    }

    private createPlayersField(players: RconPlayer[]) {
        const playerList = players
            .map(player => {
                return `**${player.name}** — ID: \`${player.id}\``;
            })
            .join("\n");

        return {
            name: "ИГРОКИ",
            value: playerList,
        };
    }
}

export const monitoring = new MonitoringService();