// Modified from https://github.com/openai/openai-quickstart-node/blob/master/pages/api/generate.js
import { Configuration, OpenAIApi } from "openai"

let configuration = new Configuration({
    apiKey: "" //////////////// Test purpose only, change key after done!
});
const openai = new OpenAIApi(configuration);
delete configuration.baseOptions.headers['User-Agent'];

export const generate = async function(reqBody) {
    if (!configuration.apiKey) {
        throw new Error(`OpenAI API key not configured`);
    }
    const inString = reqBody || '';
    if (inString.trim().length === 0) {
        throw new Error(`Please enter valid input to ChatGPT`);
    }

    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: generatePrompt(inString),
            }],
            temperature: 0.6,
        });
        console.log(completion)
        return completion.data.choices[0].message.content;
    } catch(error) {
        if (error.response) {
            throw new Error(error.response.status + ": " + error.response.data);
        } else {
            throw new Error(`Error with OpenAI API request: ${error.message}`);
        }
    }
}

function generatePrompt(inString) {
    return `${inString}`;
}
