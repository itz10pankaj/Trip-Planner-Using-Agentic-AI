from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate
from Tools.weather_info_tool import get_current_weather
from Tools.currency_conversion_tool import convert_currency
from Config.setting import get_settings

settings = get_settings()

SYSTEM_PROMPT = """
You are an intelligent AI travel planner.

Rules:
- Use tools ONLY when the user explicitly asks for weather or currency.
- Do NOT use tools for general trip planning.
- Generate detailed trip itineraries when user asks to plan a trip.
- Always clearly list which tools were used (if any).
- If no tool used, tools_used must be an empty list.
"""

def create_planner_agent():

    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0,
        api_key=settings.OPENAI_API_KEY
    )

    tools = [get_current_weather,convert_currency]

    prompt=ChatPromptTemplate.from_messages(
         [
            ("system", SYSTEM_PROMPT),
            ("placeholder", "{chat_history}"),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ]
    )
    agent = create_tool_calling_agent(
        llm=llm,
        tools=tools,
        prompt=prompt
    )

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True
    )

    agent_executor=AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        memory=memory,
        return_intermediate_steps=True
    )
    return agent_executor