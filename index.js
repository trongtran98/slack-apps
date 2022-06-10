const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('qs');
const app = express();

// const signature = require('./verifySignature');
// const appHome = require('./appHome');
// const message = require('./message');



// const apiUrl = 'https://slack.com/api';

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

app.post('/slack/events', async (req, res) => {
    const {type, user, channel, tab, text, subtype} = req.body.event;

    if (type === 'app_home_opened') {
        displayHome(user);
    }
});

const displayHome = async (user, data) => {

    const args = {
        token: 'xoxb-536622679796-3661738031265-akqF5l4NPyqLT8iw7kdWfkoJ',
        user_id: user,
        view: await updateView(user)
    };
    const result = await axios.post('/views.publish', qs.stringify(args));
};

const updateView = async (user) => {
    let blocks = [
        {
            // Section with text and a button
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*Welcome!* \nThis is a home for Stickers app. You can add small notes here!"
            },
            accessory: {
                type: "button",
                action_id: "add_note",
                text: {
                    type: "plain_text",
                    text: "Add a Stickie"
                }
            }
        },
        // Horizontal divider line
        {
            type: "divider"
        }
    ];

    let view = {
        type: 'home',
        title: {
            type: 'plain_text',
            text: 'Keep notes!'
        },
        blocks: blocks
    }

    return JSON.stringify(view);
};

app.post('/slack/actions', async (req, res) => {
    const {token, trigger_id, user, actions, type} = JSON.parse(req.body.payload);
    if (actions && actions[0].action_id.match(/add_/)) {
        openModal(trigger_id);
    } else if (type === 'view_submission') {
        res.send(''); // Make sure to respond to the server to avoid an error

        const data = {
            note: view.state.values.note01.content.value,
            color: view.state.values.note02.color.selected_option.value
        }
        displayHome(user.id, data);
    }
});

const openModal = async (trigger_id) => {

    const modal = {
        type: 'modal',
        title: {
            type: 'plain_text',
            text: 'Create a stickie note'
        },
        submit: {
            type: 'plain_text',
            text: 'Create'
        },
        blocks: [
            // Text input
            {
                "type": "input",
                "block_id": "note01",
                "label": {
                    "type": "plain_text",
                    "text": "Note"
                },
                "element": {
                    "action_id": "content",
                    "type": "plain_text_input",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Take a note... "
                    },
                    "multiline": true
                }
            },

            // Drop-down menu
            {
                "type": "input",
                "block_id": "note02",
                "label": {
                    "type": "plain_text",
                    "text": "Color",
                },
                "element": {
                    "type": "static_select",
                    "action_id": "color",
                    "options": [
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "yellow"
                            },
                            "value": "yellow"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "blue"
                            },
                            "value": "blue"
                        }
                    ]
                }
            }
        ]
    };

    const args = {
        token: 'xoxb-536622679796-3661738031265-akqF5l4NPyqLT8iw7kdWfkoJ',
        trigger_id: trigger_id,
        view: JSON.stringify(modal)
    };

    const result = await axios.post('https://slack.com/api/views.open', qs.stringify(args));
};