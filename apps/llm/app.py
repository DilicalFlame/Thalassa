import duckdb
from config import GROQ_API_KEY
from typing import TypedDict, Annotated, Sequence
import operator
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage
from langchain_core.tools import tool
from langgraph.prebuilt import ToolNode
from langgraph.graph import StateGraph, END

# New imports for memory
from langchain.memory import ConversationSummaryBufferMemory

__DB_PATH = "./LOCAL/Resources/argo.db"

# ===============================
# 1. SETUP: Model and Tools
# ===============================

MODEL_NAME = "openai/gpt-oss-120b"
chat_model = ChatGroq(temperature=0.7, model_name=MODEL_NAME, api_key=GROQ_API_KEY)

# --- Database Tool ---
@tool("database_query_tool")
def database_query_tool(query: str) -> dict:
    """Executes a SQL query against the DuckDB Argo float database.
    The SQL string must be passed in the 'query' field (not 'question')."""
    try:
        con = duckdb.connect(__DB_PATH)
        cursor = con.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        column_names = [desc[0] for desc in cursor.description]
        cursor.close()
        con.close()

        # Cast everything to str for JSON safety
        safe_rows = [[str(item) for item in row] for row in rows]
        return {"columns": column_names, "data": safe_rows}

    except Exception as e:
        return {"error": str(e)}

# --- General Knowledge Tool ---
@tool("general_knowledge_tool")
def general_knowledge_tool(question: str) -> str:
    """Answers general knowledge questions about oceanography or other topics."""
    try:
        response = chat_model.invoke([HumanMessage(content=question)])
        return response.content
    except Exception as e:
        return f"Error: {e}"

# List of tools
tools = [database_query_tool, general_knowledge_tool]

db_schema = """
- platform_id (INT)
- date (TIMESTAMPTZ)
- lat (DOUBLE)
- lon (DOUBLE)
- depth_m (DOUBLE)
- temp_c (DOUBLE)
- sal_psu (DOUBLE)
- region_name (VARCHAR)
"""

system_prompt = f"""
You are a world-class oceanographic data analyst and an expert in DuckDB SQL.

**Schema**
- Only use the tables `argo2023` and `argo2024` with these columns:
{db_schema}

**Query Rules**
- For aggregates (AVG, SUM, MIN, MAX):
  - Always include `IS NOT NULL` and 'NOT ISNAN()' on the aggregated column.
  - You may add additional conditions (e.g., region_name, lat/lon ranges, date/month).
    Example filters:
      • region_name ILIKE 'Arabian Sea'
      • lat BETWEEN -20 AND -10
      • lon BETWEEN 0 AND 10
      • EXTRACT(MONTH FROM date) = 8
- Never query `information_schema` or run exploratory DISTINCT queries.
- If the query result is empty or NULL, return: “No valid data available.”

**Phase 1: Tool Selection**
- Use `database_query_tool` for numeric data.
- Use `general_knowledge_tool` for definitions.

**Phase 2: Answer Synthesis**
- Present results in plain language, without SQL.
- If the query result is empty or NaN, say so directly.
"""

# ===============================
# 2. MEMORY SETUP
# ===============================
# This maintains a rolling summary of the conversation
summary_memory = ConversationSummaryBufferMemory(
    llm=chat_model,
    max_token_limit=500,       # keep summaries short
    return_messages=True
)

# Bind tools to the model
model_with_tools = chat_model.bind_tools(tools)

# ===============================
# 3. DEFINE AGENT STATE
# ===============================
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]

# ===============================
# 4. DEFINE NODES & GRAPH
# ===============================
def call_model_node(state):
    """Call LLM to decide next actions or generate response."""
    # Inject system prompt + summarized memory + latest turn
    memory_vars = summary_memory.load_memory_variables({})
    summarized_history = memory_vars.get("history", [])
    messages = [SystemMessage(content=system_prompt)] + summarized_history + state["messages"]

    response = model_with_tools.invoke(messages)
    # print("\n--- Model raw response ---")
    # print(response)
    # print("---\n")
    return {"messages": [response]}

tool_node = ToolNode(tools)

def should_continue(state):
    """Decide whether to continue tool calls or finish."""
    last_message = state["messages"][-1]
    return "continue" if getattr(last_message, "tool_calls", None) else "end"

workflow = StateGraph(AgentState)
workflow.add_node("call_model", call_model_node)
workflow.add_node("call_tool", tool_node)
workflow.set_entry_point("call_model")
workflow.add_conditional_edges(
    "call_model", should_continue, {"continue": "call_tool", "end": END}
)
workflow.add_edge("call_tool", "call_model")
app = workflow.compile()

# ===============================
# 5. CHAT LOOP
# ===============================
def run_chat():
    print("--- 🚀 Argo AI Agent ---")
    print("Ask questions about Argo data. Type 'exit' to quit.")

    # We'll store only the *latest turn* in state, summaries come from memory
    conversation_state = {"messages": []}

    while True:
        user_question = input("\n> ")
        if user_question.lower() == "exit":
            break

        # Save user input to memory
        summary_memory.chat_memory.add_user_message(user_question)

        conversation_state["messages"] = [HumanMessage(content=user_question)]

        print("\n--- Agent Thinking... ---")
        final_answer = None

        for event in app.stream(conversation_state, {"recursion_limit": 15}):
            for key, value in event.items():
                print(f"Node '{key}':\n{value}\n---")

            if "call_model" in event:
                last_message = event["call_model"]["messages"][-1]
                if not getattr(last_message, "tool_calls", None):
                    final_answer = last_message
                    # Save AI response to memory
                    summary_memory.chat_memory.add_ai_message(final_answer.content)

        print("\n--- ✅ Final Answer ---")
        if final_answer:
            print(final_answer.content)
        else:
            print("The agent could not generate a final answer.")


if __name__ == "__main__":
    run_chat()
