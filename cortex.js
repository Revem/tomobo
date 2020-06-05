const serviceAccount = require('./key.json')
const dialogflow = require('@google-cloud/dialogflow');
module.exports.cortex = async (message, sessionId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sessionClient = new dialogflow.SessionsClient({credentials: serviceAccount});
            const sessionPath = sessionClient.projectAgentSessionPath('rich-jigsaw-279203', sessionId);
          
            const request = {
              session: sessionPath,
              queryInput: {
                text: {
                  text: message,
                  languageCode: 'pt-BR',
                },
              },
            };
            
            const responses = await sessionClient.detectIntent(request);

            const result = responses[0].queryResult.fulfillmentText;
            console.log(result)
            resolve(result)
        }catch(e) {
            console.log(e)
            return reject('uwu')
        }
    })
}