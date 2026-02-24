from typing import List, Dict, Any
import json
from Config.dbConfig import memory
def get_messages(thread_id: str) -> List[Dict[str, Any]]:
        config = {"configurable": {"thread_id": thread_id, "checkpoint_ns": ""}}
        result = memory.get_tuple(config)

        if not result:
            return []

        messages = result.checkpoint.get("channel_values", {}).get("messages", [])
        formatted = []

        for msg in messages:
            entry = {
                "type": msg.type,
                "content": msg.content,
                "id": getattr(msg, "id", None),
            }
            if msg.additional_kwargs.get("type") == "trip_plan":
                entry["type"] = "trip_plan"
                try:
                    entry["content"] = json.loads(msg.content)
                except Exception:
                    entry["content"] = msg.content
            if getattr(msg, "tool_calls", None):
                entry["tool_calls"] = [
                    {
                        "tool": tc["name"],
                        "args": tc["args"],
                    }
                    for tc in msg.tool_calls
                ]
            if msg.type == "tool":
                entry["tool_name"] = getattr(msg, "name", None)

            formatted.append(entry)

        return formatted