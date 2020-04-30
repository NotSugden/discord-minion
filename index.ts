/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
const util: typeof import('util') = require('util');
import { MessageOptions, MessageEditOptions, Message } from 'discord.js';
const djs: typeof import('discord.js') = require('discord.js');
const mysql: typeof import('mysql') = require('mysql');
const fetch: typeof import('node-fetch').default = require('node-fetch');
const client = new djs.Client();
const clientConfig: ClientConfig = require('./config.json');
client.token = clientConfig.token;

declare module 'discord.js' {
	interface Message {
		commandMessage?: Message;
	}
}

client.on('messageUpdate', async (o, n) => {
	if (n.partial) await n.fetch();
	if (n.author!.id !== '381694604187009025' || o.content === n.content) return;
	return client.emit('message', n as Message);
});

client.on('message', async msg => {
	if (msg.author.id !== '381694604187009025') return;
	
	const _usedPrefix = clientConfig.prefix.find(pfx => msg.content.startsWith(pfx));
	if (!_usedPrefix) return;

	const [_command, ..._args] = msg.content.slice(_usedPrefix.length).split(' ');

	if (!/^ev(al)?$/i.test(_command)) return;

	const _sendMessage = (content: unknown, options?: MessageOptions) => {
		if (msg.commandMessage) {
			return msg.commandMessage.edit(content, options as MessageEditOptions); 
		} else return msg.channel.send(content, options);
	};

	let result: unknown;
	try {
		result = await eval(_args.join(' '));
		if (Array.isArray(result) && result.every(element => element && typeof element.then === 'function')) {
			result = await Promise.all(result);
		}
	} catch (error) {
		result = error.stack;
	}
	if (typeof result !== 'string') result = util.inspect(result);
	result = (result as string || '<empty string>')
		.replace(new RegExp(client.token!, 'gi'), '[TOKEN]');
	if ((result as string).length > 1250) {
		const json = await fetch('https://paste.nomsy.net/documents', {
			body: result as string,
			method: 'POST'
		}).then(res => res.json());
		if (!json.key) return _sendMessage([
			'Error using hastebin:',
			`\`${JSON.stringify(json)}\``
		]);
		return _sendMessage(`Output posted to hastebin: https://paste.nomsy.net/${json.key}`);
	}
	return _sendMessage(result, { code: 'js' });
});

client.login();

interface ClientConfig {
	prefix: string[];
	token: string;
}