import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";

///schem for the agent state
const group = z.object({
  name: z.string().describe("the name of the group"),
  description: z
    .string()
    .describe(
      "a short description of the group construst a good description from the description of the group"
    ),
  link: z.string().describe("the link to the group"),
  visibility: z.string().describe("public or private must be private"),
  members: z
    .string()
    .describe("the number of members in the group must be more than 1000"),
});

export const groupSchema = StructuredOutputParser.fromZodSchema(
  z.array(group).describe("a list of groups that match the criteria")
);

const format_instructions = groupSchema.getFormatInstructions();

const prompt = new ChatPromptTemplate({
  promptMessages: [
    SystemMessagePromptTemplate.fromTemplate(
      `You are an assistant for filtering dataset based on specific criteria.The type of groups I'm looking for are as follows:
      1. The group must be private remove all public groups
      2. The group must have more than 1k members
      3. The group must not be a buying and selling group
      4. The group must be a town / city commutiy type of group
    Format:
    The course should be structured with  {format_instructions} no matter what

      `
    ),
    HumanMessagePromptTemplate.fromTemplate(
      "Filter {unfilteredGroups} based on the provided criteria and return the filtered groups"
    ),
  ],
  inputVariables: ["unfilteredGroups"],
  partialVariables: {
    format_instructions: format_instructions,
  },
  outputParser: groupSchema,
  validateTemplate: true,
});

export const getGroupFilterPrompt = async (content: any) => {
  const input = await prompt.format({
    unfilteredGroups: content,
  });

  return input;
};
