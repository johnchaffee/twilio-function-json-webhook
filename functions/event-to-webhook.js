const fetch = require("node-fetch");

exports.handler = async function (context, event, callback) {
  // const twiml = new Twilio.twiml.MessagingResponse();

  if (Object.keys(event).length === 0) {
    console.log("EVENT OBJECT IS EMPTY");
    return callback(null);
  }

  if (event.Body === undefined) {
    // No Body, it must be an outgoing message
    // Fetch the message body via API or set it to ''
    event.Body = "";
  }

  try {
    console.log(context);
    console.log(event);

    // Translate Twilio event properties to Zipwhip event properties
    const zwEvent = {
      cc: null,
      visible: true,
      read: false,
      address: "ptn:/" + event.From,
      bcc: null,
      contactId: null,
      finalDestination: event.To,
      scheduledDate: null,
      body: event.Body,
      deviceId: null,
      dateDeleted: null,
      messageTransport: 5,
      dateDelivered: null,
      hasAttachment: event.NumMedia > 0 ? true : false,
      dateCreated: new Date().toISOString().slice(0, -5) + "Z",
      deleted: false,
      messageType: "MO",
      bodySize: 14,
      fingerprint: null,
      id: event.SmsSid,
      dateRead: null,
      finalSource: event.From,
      statusCode: 4,
      bodySize: event.Body.length,
    };

    // Send Zipwhip formatted webhook
    const res = await fetch(context.WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // body: JSON.stringify(event),
      body: JSON.stringify(zwEvent),
    });

    if (res.ok) {
      // twiml.message('The SMS was successfully forwarded to your webhook.');
      // return callback(null, twiml);
      return callback(null);
    }

    return callback(res.statusText);
  } catch (error) {
    return callback(error);
  }
};
