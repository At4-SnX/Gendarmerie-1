# Bot Gendarmerie Nationale RP

Bot Discord professionnel pour serveur RP avec :

- messages d'arrivee et de depart en Component V2 ;
- carte visuelle avec l'avatar du membre dans le cercle bleu ;
- assistant IA Groq limite a un seul salon ;
- support vocal avec message de synthese vocale quand un membre rejoint le vocal d'attente ;
- presence Discord en stream sur `Gendarmerie` ;
- configuration par variables Railway et commande `/config`.

## Installation locale

```bash
npm install
cp .env.example .env
npm run deploy:commands
npm start
```

## Variables Railway

Ajoute ces variables dans Railway :

```env
DISCORD_TOKEN=ton_token_bot
DISCORD_CLIENT_ID=id_application_bot
DISCORD_GUILD_ID=id_serveur_discord

WELCOME_CHANNEL_ID=id_salon_arrivee
GOODBYE_CHANNEL_ID=id_salon_depart
AI_CHANNEL_ID=id_salon_assistant_ia
SUPPORT_WAITING_VOICE_ID=id_vocal_attente_de_move
SUPPORT_LOG_CHANNEL_ID=id_salon_logs_support_optionnel

GROQ_API_KEY=ta_cle_api_groq_gratuite
GROQ_MODEL=llama-3.1-8b-instant

BOT_STREAM_NAME=Gendarmerie
WELCOME_MESSAGE=Bienvenue {user} au sein de la Gendarmerie Nationale RP.
GOODBYE_MESSAGE={user} quitte la Gendarmerie Nationale RP. Bonne continuation.
SUPPORT_TTS_MESSAGE=Bonjour {user}, un membre de la gendarmerie va vous prendre en charge. Merci de patienter dans le salon attente de move.
```

Variables disponibles dans les messages :

- `{user}` : mention Discord du membre ;
- `{username}` : pseudo du compte ;
- `{displayName}` : nom affiche sur le serveur ;
- `{server}` : nom du serveur.

## Commandes Discord

Deploie les commandes avec :

```bash
npm run deploy:commands
```

Commandes disponibles :

- `/config voir`
- `/config texte`
- `/config salon`
- `/config stream`

La commande demande la permission Discord `Gerer le serveur`.

## Configuration Discord obligatoire

Dans le portail developpeur Discord, active ces intents pour le bot :

- Server Members Intent ;
- Message Content Intent ;
- Presence non obligatoire ;
- Voice States est utilise via les intents du bot.

Pour l'invitation du bot, prevois au minimum :

- View Channels ;
- Send Messages ;
- Use Slash Commands ;
- Attach Files ;
- Connect ;
- Speak ;
- Use Voice Activity.

## Railway

Le projet contient `nixpacks.toml` pour installer Node.js 20 et `ffmpeg`, necessaire au support vocal TTS.

Sur Railway :

1. Cree un nouveau projet depuis ton depot GitHub.
2. Ajoute les variables d'environnement.
3. Deploie.
4. Lance une fois `npm run deploy:commands` depuis un shell Railway ou localement avec le meme `.env`.

## Personnalisation de l'image

Le modele se trouve ici :

```text
assets/gendarmerie-template.png
```

Si tu changes l'image, les coordonnees du cercle avatar sont dans :

```text
src/services/cardService.js
```

Modifie `avatarCircle.x`, `avatarCircle.y` et `avatarCircle.radius`.
