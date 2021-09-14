const fetch = require("node-fetch");

exports.handler = async function (context, event, callback) {
  // const twiml = new Twilio.twiml.MessagingResponse();

  try {
    console.log(context);
    console.log(event);

    // Object payload is empty, exit
    if (Object.keys(event).length === 0) {
      console.log("EVENT OBJECT IS EMPTY");
      return callback(null);
    }

    // Translate Twilio event properties to Zipwhip event properties
    let zwEvent = {};

    // No Body, it must be SEND|PROGRESS message
    // Fetch the message body via API or set it to ''
    if (event.Body === undefined) {
      console.log("BODY IS EMPTY");
      event.Body = "";
    }

    // Body is STOP|UNSTOP|STOPALL
    // Format zwEvent as OPTOUT event
    if (event.Body.match(/^(start|stop|stopall|unstop)$/i)) {
      console.log("OPTOUT EVENT");
      zwEvent = {
        messageBody: event.Body,
        line: event.To,
        contact: event.From,
        messageId: event.SmsSid,
        type: event.Body.toUpperCase(),
        eventDate: new Date().toISOString().slice(0, -5) + "Z",
      };
    } else {
      // Format zwEvent as SEND|PROGRESS|RECEIVE event
      console.log("SEND|PROGRESS|RECEIVE EVENT");
      zwEvent = {
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
    }

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
