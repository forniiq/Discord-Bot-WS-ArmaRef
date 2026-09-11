import RCON from "battleye-node";
import { RconPlayer } from "@/types/rcon.types";

class RconService {
    private rcon: RCON;

    constructor() {
        this.rcon = new RCON({
            address: process.env.RCON_HOST!,
            port: Number(process.env.RCON_PORT),
            password: process.env.RCON_PASSWORD!,
            connectionType: "udp4",
        });

        this.rcon.on("onConnect", (connected) => {
            if (connected) {
                console.log("[RCON] Соединение установлено");
            } else {
                console.warn("[RCON] Соединение потеряно");
            }
        });
    }

    isConnected(): boolean {
        return this.rcon.isRconConnected;
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.rcon.removeListener("message", onMessage);

                reject(new Error("RCON: не удалось дождаться авторизации"));
            }, 5000);

            const onMessage = (message: string) => {
                if (message.startsWith("Logged In!")) {
                    clearTimeout(timeout);
                    this.rcon.removeListener("message", onMessage);

                    resolve();
                }
            };

            this.rcon.on("message", onMessage);

            this.rcon.login();
        });
    }

    private send(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let processingReceived = false;

            const timeout = setTimeout(() => {
                this.rcon.removeListener("message", onMessage);

                reject(
                    new Error(
                        `RCON: сервер не ответил на команду "${command}"`
                    )
                );
            }, 5000);

            const onMessage = (message: string) => {
                if (message.startsWith("Processing Command:")) {
                    processingReceived = true;
                    return;
                }

                if (processingReceived) {
                    clearTimeout(timeout);
                    this.rcon.removeListener("message", onMessage);

                    resolve(message);
                }
            };

            this.rcon.on("message", onMessage);

            this.rcon.commandSend(command);
        });
    }

    private sendWithoutResponse(command: string): void {
        if (!this.isConnected()) {
            throw new Error("RCON_OFFLINE");
        }

        this.rcon.commandSend(command);
    }

    async players(): Promise<RconPlayer[]> {
        const response = await this.send("#players");

        return this.parsePlayers(response);
    }

    private parsePlayers(response: string): RconPlayer[] {
        const lines = response
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean);

        const players: RconPlayer[] = [];

        for (const line of lines) {
            if (
                line.startsWith("Players on server:") ||
                line.startsWith("[Player#]")
            ) {
                continue;
            }

            const parts = line.split(";").map(part => part.trim());

            if (parts.length < 3) {
                continue;
            }

            const id = parts[0];
            const uid = parts[1];
            const name = parts.slice(2).join(";").trim();

            const playerId = Number(id);

            if (
                !Number.isInteger(playerId) ||
                !uid ||
                !name
            ) {
                continue;
            }

            players.push({
                id: playerId,
                uid,
                name,
            });
        }

        return players;
    }

    async restart(): Promise<void> {
        this.sendWithoutResponse("#restart");
    }

    async shutdown(): Promise<void> {
        this.sendWithoutResponse("#shutdown");
    }

    async kick(playerId: number): Promise<string> {
        return await this.send(`#kick ${playerId}`);
    }

    disconnect() {
        this.rcon.logout();
    }
}

export const rcon = new RconService();