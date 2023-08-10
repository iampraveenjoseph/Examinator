import { GameType } from "@prisma/client";
import { Configuration, OpenAIApi } from "openai";
import { jsonrepair } from "jsonrepair";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

const mcqConversation = [
  {
    role: "system",
    content: "You are an assistant that generates MCQ questions.",
  },
  {
    role: "user",
    content: `Generate 4 questions about software development in valid JSON Array   :
    [{\"question\": \"question\",\"answer\": \"answer",\"oprtion1\": \"option1\",\"option2\": \"option2\", \"option3\": \"option3\"}]
    Do not escape the double quotes in the output: The JSON object is:`,
  },
];

const getConversation = (amount: number, type: GameType, prompt: string) => {
  if (type === "mcq") {
    return [
      {
        role: "system",
        content:
          "You are a helpful AI that is able to generate mcq questions and answers, the length of each answer should not be more than 15 words",
      },
      {
        role: "user",
        content: `Generate ${amount} hard questions about ${prompt} in valid JSON Array   :
        [{\"question\": \"question\",\"answer\": \"answer",\"oprtion1\": \"option1\",\"option2\": \"option2\", \"option3\": \"option3\"}]
        Do not escape the double quotes in the output: The JSON object is:`,
      },
    ];
  } else {
    return [
      {
        role: "system",
        content:
          "You are a helpful AI that is able to generate a pair of question and answers, the length of each answer should not be more than 15 word and should not be less than 3 words",
      },
      {
        role: "user",
        content: `Generate ${amount} hard questions about ${prompt} in valid JSON Array   :
        [{\"question\": \"question\",\"answer\": \"answer"}]
        Do not escape the double quotes in the output: The JSON object is:`,
      },
    ];
  }
};

export const getQuestions = async (
  amount: number,
  type: GameType,
  prompt: string
) => {
  const data: any = {
    model: "gpt-3.5-turbo",
    messages: getConversation(amount, type, prompt),
    // max_tokens: 200, // Adjust as needed
    // temperature: 0.7, // Controls randomness of the output
  };

  const response: any = await openai.createChatCompletion(data);

  const generatedText = response.data.choices[0].message.content.replace(
    /([\w]+)(:)/g,
    '"$1"$2'
  );
  //need to check on data converstion
  let questionsArray = generatedText.replace(/'/g, '"') ?? "";
  try {
    return JSON.parse(questionsArray);
  } catch (e) {
    if (e instanceof SyntaxError) {

      JSON.parse(jsonrepair(questionsArray))
      console.log('error', e)
      // expected output: SyntaxError: Unexpected token o in JSON at position 1
    } else {
      throw new Error("Try after sometime");
    }
  }
  //

  // return questionsArray;
};
