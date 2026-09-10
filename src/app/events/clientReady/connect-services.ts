import { monitoring } from '@/services/monitor.service';
import { rcon } from '@/services/rcon.service';
import type { EventHandler } from 'commandkit';
import { Logger } from 'commandkit/logger';

const handler: EventHandler<'clientReady'> = async (client) => {
    await rcon.connect();
    Logger.info('[RCON] Ready');

    monitoring.init(client);
    monitoring.start();
    Logger.info('[MONITOR] Ready!');
};

export default handler;
