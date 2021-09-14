const fetch = require("node-fetch");

exports.handler = async function (context, event, callback) {
  // const twiml = new Twilio.twiml.MessagingResponse();

  try {
    console.log(context);
    console.log(event);

    // Create Zipwhip event object
    let zwEvent = {};

    // Object payload is empty, exit
    if (Object.keys(event).length === 0) {
      console.log("EVENT OBJECT IS EMPTY, EXITING");
      return callback(null);
    }

    // If SmsStatus is empty, exit
    if (event.SmsStatus === undefined) {
      console.log("SMS STATUS IS EMPTY, EXITING");
      return callback(null);
    }

    // No Body, must be a SEND|PROGRESS message
    // Fetch the message body via API or set it to ''
    if (event.Body === undefined) {
      console.log("BODY IS EMPTY");
      event.Body = "";
    }

    // Body is START|STOP|UNSTOP|STOPALL
    // Format zwEvent as optout event
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

      // Incoming messages map to RECEIVE with default type, dateDelivered, statusCode
      let messageType = "MO";
      let dateDelivered = null;
      let statusCode = 0;

      // TODO map the SmsStatus string to Zipwhip statusCode
      if (event.SmsStatus.match(/^(accepted|queued|sending|sent)$/i)) {
        messageType = "ZO";
        statusCode = 1;
      } else if (
        event.SmsStatus.match(
          /^(delivery_unkown|delivered|undelivered|failed)$/i
        )
      ) {
        messageType = "ZO";
        dateDelivered = new Date().toISOString().slice(0, -5) + "Z";
        statusCode = 4;
      } else {
        console.log("NO MATCHING SMS STATUS, EXITING");
        return callback(null);
      }
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
        dateDelivered: dateDelivered,
        hasAttachment: event.NumMedia > 0 ? true : false,
        dateCreated: new Date().toISOString().slice(0, -5) + "Z",
        deleted: false,
        messageType: messageType,
        bodySize: 14,
        fingerprint: null,
        id: event.SmsSid,
        dateRead: new Date().toISOString().slice(0, -5) + "Z",
        finalSource: event.From,
        statusCode: statusCode,
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
