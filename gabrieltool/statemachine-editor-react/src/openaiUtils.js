// Modified from https://github.com/openai/openai-quickstart-node/blob/master/pages/api/generate.js
import { Configuration, OpenAIApi } from "openai"

let configuration = new Configuration({
    apiKey: "" //////////////// Test purpose only, change key after done!
});
const openai = new OpenAIApi(configuration);
delete configuration.baseOptions.headers['User-Agent'];

export const generate = async function(reqBody, taskName) {
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
                content: generatePrompt(taskName, inString),
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

function generatePrompt(taskName, inString) {
    return "We will build a software application to guide users to assemble " + taskName + " step-by-step." +
        " I want you to act as an assistant to walk users through the assembly process by giving verbal instructions." +
        " Please read the below video subtitles with timestamps and create a numbered list of step-by-step guidance " +
        "on how to complete the assembly task. Each list item should start with a time range in the video, like " +
        "00:00:15 - 00:03:10. Please list around 20 items, be concise, and make sure not to repeat any steps and not " +
        "to have overlapping time ranges.\n\n" + inString;
}
