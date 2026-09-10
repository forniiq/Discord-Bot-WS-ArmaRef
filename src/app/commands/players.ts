import { rcon } from "@/services/rcon.service";
import { ChatInputCommand, CommandData } from "commandkit";

export const command: CommandData = {
    name: "players",
    description: "Показать игроков на сервере",
};

export const chatInput: ChatInputCommand = async (ctx) => {
    try {
        const players = await rcon.players();

        if (players.length === 0) {
            await ctx.interaction.reply(
                "На сервере сейчас нет игроков."
            );

            return;
        }

        const playerList = players
            .map(player => {
                return `**${player.name}** — ID: \`${player.id}\``;
            })
            .join("\n");

        await ctx.interaction.reply(
            `### Игроки на сервере (${players.length})\n${playerList}`
        );
    } catch (error) {
        console.error("[Players] Ошибка:", error);

        await ctx.interaction.reply(
            "Не удалось получить список игроков с сервера."
        );
    }
};