const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const ytdl = require("ytdl-core");
const revem = '129619039508103168';
const dialogflow = require('dialogflow');
const cortex = require('./cortex.js').cortex;
const activities_list = [
  `Estou em ${client.guilds.cache.size} servidores no momento!`,
  `t.play | t.ping`, 
  ];

var queue = new Map();

client.on("ready", () => {
    console.log(`Bot foi iniciado, com ${client.users.cache.size} usuários, em ${client.channels.cache.size} canais, em ${client.guilds.cache.size} servidores.`);
    setInterval(() => {
      const index = Math.floor(Math.random() * (activities_list.length - 1) + 1);
      client.user.setActivity(activities_list[index]);
  }, 15000);
});

client.on("guildCreate", guild => {
    console.log(`O bot entrou no servidor: ${guild.name} (id: ${guild.id}) População: ${guild.memberCount} membros!`);
    client.user.setActivity(`Estou em ${client.guilds.size} servidores`);
});

client.on("guildDelete", guild => {
    console.log(`O bot foi removido do servidor: ${guild.name} (id: ${guild.id})`);
    client.user.setActivity(`Estou em ${client.guilds.size} servidores.`);
});

client.on("message", async (message) => {
    if(message.author.bot) return;
    if(message.channel.type === "dm") return;
    const serverQueue = queue.get(message.guild.id);


    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const comando = args.shift().toLowerCase();


    if(comando === "ping") {
        const m = await message.channel.send("ping?");
        m.edit(`Pong! Senpai, a latência é ${m.createdTimestamp - message.createdTimestamp}ms!`)
    }

    if(comando === "say") {
        const falar = args.join(" ");
        message.delete().catch(O_o=>{});
        message.channel.send(falar);
    }

    if(comando === "nome") {
        if (message.author.id == revem){
        const nomenovo = args.join(" ");
        message.delete().catch(O_o=>{});
        message.channel.send("Sim mestre.")
        client.user.setUsername(nomenovo);
        }
        else {
            return message.channel.send("Você não tem permissão para usar esse comando!")
        }
    }

    if(comando === "mavatar") {
        const avatarnovo = args.join(" ");
        message.delete().catch(O_o=>{});
        client.user.setAvatar(avatarnovo);
    }

    if(comando === 'play') {
        execute(message, serverQueue);
        return;
    }

    if(comando == 'skip') {
        skip(message, serverQueue);
        return;
    }

    if(comando == 'stop'){
        stop(message, serverQueue);
        return;
    }
   // else {
   //     message.channel.send("Senpai, eu não vou funcionar se você não usar um comando válido...");
   // }


});

client.on("message", async receivedMessage => {
        if((receivedMessage.cleanContent.startsWith("@" + client.user.username) || receivedMessage.channel.type == 'dm') && client.user.id != receivedMessage.author.id){
          var mess = remove(client.user.username, receivedMessage.cleanContent);
          console.log(mess);
          const user = receivedMessage.author.id;
          cortex(mess, receivedMessage.author.id).then(res=>receivedMessage.channel.send(res)).catch(err=>receivedMessage.channel.send(err));
        }
},
);
function remove(username, text) {
  return text.replace('@' + username + ' ', '');     
}

//funções de musica!

async function execute(message, serverQueue) {
    const args = message.content.split(" ");
  
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "Você precisa estar em um canal de voz!"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send(
        "Eu preciso de permissões para falar no canal de voz!"
      );
    }
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
      title: songInfo.title,
      url: songInfo.video_url
    };
    if (!serverQueue) {
        const queueContruct = {
          textChannel: message.channel,
          voiceChannel: voiceChannel,
          connection: null,
          songs: [],
          volume: 5,
          playing: true
        };
        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);
    
        try {
          var connection = await voiceChannel.join();
          queueContruct.connection = connection;
          play(message.guild, queueContruct.songs[0]);
        } catch (err) {
          console.log(err);
          queue.delete(message.guild.id);
          return message.channel.send(err);
        }
      } else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} foi adicionado à playlist!`)
  }
}

  function skip(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "Você precisa estar em um canal de voz para parar a música!"
      );
    if (!serverQueue)
      return message.channel.send("Não tem nenhuma música para pular!");
    serverQueue.connection.dispatcher.end();
  }
  
  function stop(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "Você precisa estare m um canal de voz para parar a música!"
      );
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  }
  
  function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
  
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Estou tocando: **${song.title}**`);
  }
  // fim das funções de musica!

client.login(config.token);