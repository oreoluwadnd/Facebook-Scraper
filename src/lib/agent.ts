import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";
import { RunnableLambda } from "@langchain/core/runnables";
import { scrapeFromFacebook } from "./pupperter";

interface AgentState {
  myCity: string;
  data: any;
  radius: number;
  cities?: string[];
  scrapeJson: any;
  filterJson: any;
}

function model() {
  return new ChatOpenAI({
    temperature: 0,
    modelName: "gpt-3.5-turbo",
    timeout: 100000,
    cache: true,
    maxTokens: -1,
    onFailedAttempt: (error) => {
      console.log("🚀 ~ error", error);
    },
  });
}

async function getCityWithRadius(state: {
  agentState: AgentState;
}): Promise<{ agentState: AgentState }> {
  const response = await model().invoke(
    [
      new SystemMessage(
        `You are a personal geographers, urban planners, urbanists, city planners, or cartographers.
         Your sole task is to return a list of cities in mymiles radius of myCity as a JSON list of strings return my city also
         in this format:
           [
                "Albany New York",
                "Wrentham, Massachusetts",
                "Lagos Nigeria",
                "Kiyose Tokyo",
                "Kiryu Gunma",
           ]
         .`.replace(/\s+/g, " ")
      ),
      new HumanMessage(
        `myCity: ${state.agentState.myCity}
              mymiles: ${state.agentState.radius}`
      ),
    ],

    {
      response_format: {
        type: "json_object",
      },
    }
  );

  console.log("🚀 ~ response:", response);
  const cities = JSON.parse(response.content as string).cities;
  return {
    agentState: {
      ...state.agentState,
      data: response,
      cities: cities,
    },
  };
}

async function scrape(state: {
  agentState: AgentState;
}): Promise<{ agentState: AgentState }> {
  // const cities = ["Franklin Massachusetts", "Wrentham Massachusetts"];
  const scrapeJson = await scrapeFromFacebook(state.agentState.cities);
  return {
    agentState: {
      ...state.agentState,
      scrapeJson,
    },
  };
}

// async function filter(state: {
//   agentState: AgentState;
// }): Promise<{ agentState: AgentState }> {
//   const input = await getGroupFilterPrompt(state.agentState.scrapeJson);
//   const response = await model().invoke(input);
//   console.log(response.content);
//   try {
//     const parsed = groupSchema.parse(response.content.toString());
//   } catch (error) {
//     console.log("🚀 ~ file: ai.ts:53 ~ anaylze ~ error", error);
//   }
//   return {
//     agentState: {
//       ...state.agentState,
//       filterJson: response.content,
//     },
//   };
// }
const agentState = {
  agentState: {
    value: (x: AgentState, y: AgentState) => y,
    default: () => ({
      myCity: "",
      radius: 0,
      data: [],
      cities: [],
      scrapeJson: [],
      filterJson: [],
    }),
  },
};

const workflow = new StateGraph({
  channels: agentState,
});

workflow.addNode(
  "getCityWithRadius",
  new RunnableLambda({ func: getCityWithRadius }) as any
);
workflow.addNode("scrape", new RunnableLambda({ func: scrape }) as any);
// workflow.addNode("filter", new RunnableLambda({ func: filter }) as any);

// workflow.addNode("write", new RunnableLambda({ func: write }) as any);
// workflow.addNode("critique", new RunnableLambda({ func: critique }) as any);
// workflow.addNode("revise", new RunnableLambda({ func: revise }) as any);

workflow.addEdge("getCityWithRadius", "scrape");
// workflow.addEdge("scrape", "filter");
// workflow.addEdge("write", "critique");

// workflow.addEdge("revise", "critique");

workflow.addEdge("scrape", END);

workflow.setEntryPoint("getCityWithRadius");
const app = workflow.compile();

export async function getCityWithLangGraph(myCity: string, radius: number) {
  const inputs = {
    agentState: {
      myCity: myCity,
      radius: radius,
    },
  };
  const result = await app.invoke(inputs);
  const article = result.agentState;
  return article;
}
