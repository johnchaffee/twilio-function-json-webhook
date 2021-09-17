const fetch = require("node-fetch");
const CRC32 = require("crc-32");

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

    // No Body, must be a SEND|PROGRESS event
    if (event.Body === undefined) {
      console.log("BODY IS EMPTY, SET TO ''");
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
      // Set default variables
      let messageType = "ZO";
      let dateCreated = new Date().toISOString().slice(0, -5) + "Z";
      let dateRead = new Date().toISOString().slice(0, -5) + "Z";
      let dateDelivered = null;
      let read = true;
      let address = `ptn:/${event.To}`;
      console.log(`address: ${address}`);
      let fingerprint = CRC32.str(`AD:${address},CC:,BCC:`).toString();
      console.log(`fingerprint: ${fingerprint}`);
      let statusCode = 0;
      // Map SmsStatus string to Zipwhip statusCode
      if (event.SmsStatus === "received") {
        messageType = "MO";
        read = false;
        dateRead = null;
        address = `ptn:/${event.From}`;
        console.log(`CHANGED address: ${address}`);
        fingerprint = CRC32.str(`AD:${address},CC:,BCC:`).toString();
        console.log(`CHANGED fingerprint: ${fingerprint}`);
        statusCode = 4;
      } else if (event.SmsStatus.match(/^(accepted|queued|sending|sent)$/i)) {
        statusCode = 1;
      } else if (event.SmsStatus === "delivered") {
        dateDelivered = new Date().toISOString().slice(0, -5) + "Z";
        statusCode = 4;
      } else if (event.SmsStatus.match(/^(undelivered|failed)$/i)) {
        statusCode = 5;
      } else {
        console.log("NO MATCHING SMS STATUS, EXITING");
        return callback(null);
      }
      zwEvent = {
        cc: null,
        visible: true,
        read: read,
        address: address,
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
        dateCreated: dateCreated,
        deleted: false,
        messageType: messageType,
        bodySize: event.Body.length,
        fingerprint: fingerprint,
        id: event.SmsSid,
        dateRead: dateRead,
        finalSource: event.From,
        statusCode: statusCode,
        bodySize: event.Body.length,
      };
    }
    
    // Send webhook to each endpoint in WEBHOOK_URLS array
    // Using a for loop because it does not make a callback, unlike forEach
    let res = {};
    const endpoints = context.WEBHOOK_URLS.split(",");
    for (let index = 0; index < endpoints.length; index++) {
      const endpoint = endpoints[index];
      console.log(`endpoint`, endpoint);

      // Send Zipwhip formatted webhook
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // body: JSON.stringify(event),
        body: JSON.stringify(zwEvent),
      });
    }
    if (res.ok) {
      // twiml.message('The SMS was successfully forwarded to your webhook.');
      // return callback(null, twiml);
      return callback(null);
    } else {
      return callback(res.statusText);
    }
  } catch (error) {
    return callback(error);
  }
};
