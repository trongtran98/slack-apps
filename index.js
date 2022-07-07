/* 
 * Slack API Demo 
 * This example shows how to ustilize the App Home feature
 * October 11, 2019
 *
 * This example is written in Vanilla-ish JS with Express (No Slack SDK or Framework)
 * To see how this can be written in Bolt, https://glitch.com/edit/#!/apphome-bolt-demo-note
 */

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('qs');

const signature = require('./verifySignature');
const appHome = require('./appHome');
const message = require('./message');

const app = express();

const apiUrl = 'https://slack.com/api';

/*
 * Parse application/x-www-form-urlencoded && application/json
 * Use body-parser's `verify` callback to export a parsed raw body
 * that you need to use to verify the signature
 *
 * Forget this if you're using Bolt framework or either SDK, otherwise you need to implement this by yourself to verify signature!
 */

const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || 'utf8');
    }
};

app.use(bodyParser.urlencoded({verify: rawBodyBuffer, extended: true}));
app.use(bodyParser.json({verify: rawBodyBuffer}));


/*
 * Endpoint to receive events from Events API.
 */
app.get('/slack/install', async (req, res) => {
    console.log(req.headers)
    console.log(req.body)
    res.redirect('https://slack.com/oauth/v2/authorize?client_id=3692654791172.3768860828899&scope=users:read,team:read,team.preferences:read&user_scope=&redirect_uri=https://trongtran.herokuapp.com/');
});

app.post('/slack/events', async (req, res) => {
    console.log(req.headers)
    console.log(req.body)
    switch (req.body.type) {

        case 'url_verification': {
            // verify Events API endpoint by returning challenge if present
            res.send({challenge: req.body.challenge});
            break;
        }

        case 'event_callback': {
            // Verify the signing secret
            if (!signature.isVerified(req)) {
                res.sendStatus(404);
                return;
            }

            // Request is verified --
            else {

                const {type, user, channel, tab, text, subtype} = req.body.event;

                // Triggered when the App Home is opened by a user
                if (type === 'app_home_opened') {
                    // Display App Home
                    appHome.displayHome(user);
                }

                /*
                 * If you want to allow user to create a note from DM, uncomment the part!

                // Triggered when the bot gets a DM
                else if(type === 'message') {

                  if(subtype !== 'bot_message') {

                    // Create a note from the text with a default color
                    const timestamp = new Date();
                    const data = {
                      timestamp: timestamp,
                      note: text,
                      color: 'yellow'
                    }
                    await appHome.displayHome(user, data);

                    // DM back to the user
                    message.send(channel, text);
                  }
                }
                */
            }
            break;
        }
        default: {
            res.sendStatus(404);
        }
    }
});


/*
 * Endpoint to receive an button action from App Home UI "Add a Stickie"
 */

app.post('/slack/actions', async (req, res) => {
    console.log(req.body)

    const {token, trigger_id, user, actions, type} = JSON.parse(req.body.payload);

    // Button with "add_" action_id clicked --
    if (actions && actions[0].action_id.match(/add_/)) {
        // Open a modal window with forms to be submitted by a user
        appHome.openModal(trigger_id);
    }

    // Modal forms submitted --
    else if (type === 'view_submission') {
        res.send(''); // Make sure to respond to the server to avoid an error

        const ts = new Date();
        const {user, view} = JSON.parse(req.body.payload);

        const data = {
            timestamp: ts.toLocaleString(),
            note: view.state.values.note01.content.value,
            color: view.state.values.note02.color.selected_option.value
        }

        appHome.displayHome(user.id, data);
    }
});


/* Running Express server */
const server = app.listen(process.env.PORT, () => {
    console.log('Express web server is running on port %d in %s mode', server.address().port, app.settings.env);
});


app.get('/', async (req, res) => {
    res.send('There is no web UI for this code sample. To view the source code, click "View Source"');
});

app.get('/signin-with-slack', async (req, res) => {
    res.send(req.query);
});


// var a = {
//     token: 'VGrEtTrrHH8tTshlsY9W8Pd8',
//     team_id: 'TFSJAKZPE',
//     api_app_id: 'A03K45KE0TD',
//     event: {
//         type: 'app_home_opened',
//         user: 'UFU60LT62',
//         channel: 'D03KH7J6V33',
//         tab: 'home',
//         view: {
//             id: 'V03JXVDPX4N',
//             team_id: 'TFSJAKZPE',
//             type: 'home',
//             blocks: [Array],
//             private_metadata: '',
//             callback_id: '',
//             state: [Object],
//             hash: '1655087994.xVXwiG77',
//             title: [Object],
//             clear_on_close: false,
//             notify_on_close: false,
//             close: null,
//             submit: null,
//             previous_view_id: null,
//             root_view_id: 'V03JXVDPX4N',
//             app_id: 'A03K45KE0TD',
//             external_id: '',
//             app_installed_team_id: 'TFSJAKZPE',
//             bot_id: 'B03K4HQ3MLJ'
//         },
//         event_ts: '1655088039.416702'
//     },
//     type: 'event_callback',
//     event_id: 'Ev03JWEW89K9',
//     event_time: 1655088039,
//     authorizations: [
//         {
//             enterprise_id: null,
//             team_id: 'TFSJAKZPE',
//             user_id: 'U03JXV3TADU',
//             is_bot: true,
//             is_enterprise_install: false
//         }
//     ],
//     is_ext_shared_channel: false
// }
//
// var b = {
//     "type": "block_actions",
//     "user": {"id": "UFU60LT62", "username": "trongtranit", "name": "trongtranit", "team_id": "TFSJAKZPE"},
//     "api_app_id": "A03K45KE0TD",
//     "token": "VGrEtTrrHH8tTshlsY9W8Pd8",
//     "container": {"type": "view", "view_id": "V03JXVDPX4N"},
//     "trigger_id": "3657147789602.536622679796.be9b1d9c8acae3f63f3b984f8b1bacb1",
//     "team": {"id": "TFSJAKZPE", "domain": "trongtran"},
//     "enterprise": null,
//     "is_enterprise_install": false,
//     "view": {
//         "id": "V03JXVDPX4N",
//         "team_id": "TFSJAKZPE",
//         "type": "home",
//         "blocks": [{
//             "type": "section",
//             "block_id": "hPc=",
//             "text": {
//                 "type": "mrkdwn",
//                 "text": "*Welcome!* \\nThis is a home for Stickers app. You can add small notes here!",
//                 "verbatim": false
//             },
//             "accessory": {
//                 "type": "button",
//                 "action_id": "add_note",
//                 "text": {"type": "plain_text", "text": "Add a Stickie", "emoji": true}
//             }
//         }, {
//             "type": "context",
//             "block_id": "7ReIH",
//             "elements": [{
//                 "type": "mrkdwn",
//                 "text": ":wave: Hey, my source code is on <https:\\/\\/glitch.com\\/edit\\/#!\\/apphome-demo-keep|glitch>!",
//                 "verbatim": false
//             }]
//         }, {"type": "divider", "block_id": "PyYD"}],
//         "private_metadata": "",
//         "callback_id": "",
//         "state": {"values": {}},
//         "hash": "1655088408.ZOWyvhEy",
//         "title": {"type": "plain_text", "text": "View Title", "emoji": true},
//         "clear_on_close": false,
//         "notify_on_close": false,
//         "close": null,
//         "submit": null,
//         "previous_view_id": null,
//         "root_view_id": "V03JXVDPX4N",
//         "app_id": "A03K45KE0TD",
//         "external_id": "",
//         "app_installed_team_id": "TFSJAKZPE",
//         "bot_id": "B03K4HQ3MLJ"
//     },
//     "actions": [{
//         "action_id": "add_note",
//         "block_id": "hPc=",
//         "text": {"type": "plain_text", "text": "Add a Stickie", "emoji": true},
//         "type": "button",
//         "action_ts": "1655089168.163370"
//     }]
// }