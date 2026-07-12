# 🌍 AI Trip Planner — Agentic AI Travel Assistant

An intelligent, full-stack trip planning application powered by a **multi-node agentic AI system**. Built with **FastAPI**, **LangGraph**, **OpenAI GPT-4o-mini**, **Qdrant**, and **MySQL** on the backend, and **React 19 + Vite** on the frontend.

Unlike typical chatbot wrappers, this project uses a **5-node LangGraph state machine** that classifies user intent, loads personalized preferences, autonomously calls external APIs, generates structured itineraries, and supports full version control with rollback — just like Git, but for trip plans.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗺️ **AI Itinerary Generation** | Generates structured, day-by-day travel itineraries using OpenAI with structured output |
| 🔀 **Intent-Based Routing** | Router node classifies user intent (`trip` / `general` / `rollback`) using conversation context |
| 🛠️ **Autonomous Tool Calling** | Agent decides when to call Weather, Hotel, or Currency APIs — no hardcoded logic |
| 🧠 **Vector Memory (RAG)** | Stores past trip summaries in Qdrant; retrieves similar trips by semantic search + budget filter |
| 📜 **Itinerary Version Control** | Every itinerary update creates a new version; one-click rollback to any previous version |
| ⚙️ **User Preferences** | Saves travel style, budget range, climate, food, accommodation, and pace per user |
| 🔐 **Authentication** | User registration and login with session persistence |
| 🏨 **Live Hotel Search** | Real hotel data from Amadeus API with pagination support |
| ☀️ **Live Weather Data** | Current weather conditions from OpenWeatherMap API |
| 💱 **Currency Conversion** | Real-time exchange rates via open exchange rate API |
| 💬 **Typewriter Animation** | Word-by-word streaming effect for AI responses on the frontend |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    AI TRIP PLANNER — SYSTEM ARCHITECTURE             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐            ┌────────────────────────────────┐    │
│   │   👤 User    │  ────────► │   React 19 + Vite Frontend     │    │
│   │   Browser    │  ◄──────── │   (localhost:5173)              │    │
│   └──────────────┘            │                                │    │
│                               │   • Login / Register           │    │
│                               │   • Trip Management Sidebar    │    │
│                               │   • AI Chat Interface          │    │
│                               │   • Rich Itinerary Cards       │    │
│                               │   • Hotel Search Results       │    │
│                               │   • Version History Dropdown   │    │
│                               └───────────────┬────────────────┘    │
│                                               │                      │
│                                          HTTP REST API               │
│                                               │                      │
│                                               ▼                      │
│                               ┌────────────────────────────────┐    │
│                               │   FastAPI Backend              │    │
│                               │   (localhost:8000)              │    │
│                               │                                │    │
│                               │   Routes:                      │    │
│                               │   POST /auth/register          │    │
│                               │   POST /auth/login             │    │
│                               │   GET  /trips                  │    │
│                               │   POST /trips                  │    │
│                               │   GET  /trips/{id}/chat ──► Agent   │
│                               │   GET  /preferences            │    │
│                               │   POST /preferences            │    │
│                               │   GET  /history/{id}           │    │
│                               │   GET  /history/{id}/versions  │    │
│                               │   POST /history/{id}/rollback  │    │
│                               └───────────────┬────────────────┘    │
│                                               │                      │
│                                               ▼                      │
│               ┌───────────────────────────────────────────────┐      │
│               │       LangGraph Agent (5-Node State Graph)    │      │
│               │                                               │      │
│               │   ┌──────────┐                                │      │
│               │   │  Router  │ ← Classifies user intent       │      │
│               │   │  Node    │   using GPT-4o-mini             │      │
│               │   └────┬─────┘                                │      │
│               │        │                                      │      │
│               │        ▼                                      │      │
│               │   ┌────────────┐                              │      │
│               │   │ Preference │ ← Loads user prefs from MySQL│      │
│               │   │   Node     │   Detects budget constraints  │      │
│               │   └─────┬──────┘                              │      │
│               │         │                                     │      │
│               │    ┌────┼──────────────┐                      │      │
│               │    │    │              │                       │      │
│               │    ▼    ▼              ▼                       │      │
│               │ Planner General    Rollback                   │      │
│               │  Node    Node       Node                      │      │
│               │    │      │           │                        │      │
│               │    │      ▼           │                        │      │
│               │    │   Tool Node      │                        │      │
│               │    │   (auto-call)    │                        │      │
│               └────┼──────┼───────────┼───────────────────────┘      │
│                    │      │           │                               │
│          ┌─────────┼──────┼───────────┼──────────────┐               │
│          ▼         ▼      ▼           ▼              ▼               │
│   ┌───────────┐ ┌──────────┐  ┌─────────────────────────┐           │
│   │   MySQL   │ │  Qdrant  │  │    External APIs        │           │
│   │           │ │ (Docker) │  │                         │           │
│   │ • users   │ │          │  │  ☀️ OpenWeatherMap      │           │
│   │ • trips   │ │ • Vector │  │  🏨 Amadeus Hotels      │           │
│   │ • itin.   │ │   Memory │  │  💱 Exchange Rate API   │           │
│   │ • prefs   │ │ • RAG    │  │                         │           │
│   │ • ckpts   │ │          │  │                         │           │
│   └───────────┘ └──────────┘  └─────────────────────────┘           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔀 LangGraph Agent — Node-by-Node Flow

When a user sends a chat message, it flows through the following **5-node state graph**:

```
              User Query
                  │
                  ▼
        ┌─────────────────┐
        │   Router Node   │   ← GPT-4o-mini with structured output
        │                 │     Classifies intent using last 5 messages
        │  Returns one of:│     as context (not just the latest message)
        │  • "trip"       │
        │  • "general"    │
        │  • "rollback"   │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Preference Node │   ← Loads user preferences from MySQL
        │                 │     Detects "similar" keyword for vector search
        │                 │     Extracts budget constraints from query
        └────────┬────────┘
                 │
        ┌────────┼────────────────┐
        │        │                │
        ▼        ▼                ▼
   ┌─────────┐ ┌──────────┐ ┌──────────┐
   │ Planner │ │ General  │ │ Rollback │
   │  Node   │ │  Node    │ │  Node    │
   └────┬────┘ └────┬─────┘ └────┬─────┘
        │           │             │
        ▼           ▼             ▼
   Structured   Tool Calls    Restore
   TripPlan     (Weather,     Previous
   JSON         Hotels,       Version
   → MySQL      Currency)     from MySQL
                    │
              ┌─────┼─────┐
              ▼     ▼     ▼
           Weather Hotel Currency
            API    API    API
              │     │     │
              └─────┼─────┘
                    │
                    ▼
              Results feed back
              into General Node
              for natural language
              response
```

### Node Details

| Node | Model | Purpose |
|------|-------|---------|
| **Router** | `gpt-4o-mini` + `with_structured_output(Intent)` | Classifies user intent into `trip`, `general`, or `rollback` using recent conversation context |
| **Preference** | — (no LLM call) | Loads user preferences from MySQL, detects budget keywords, flags vector search needs |
| **Planner** | `gpt-4o-mini` + `with_structured_output(TripPlan)` | Queries Qdrant for similar past trips, injects preferences into system prompt, generates structured JSON itinerary |
| **General** | `gpt-4o-mini` + `bind_tools([weather, hotels, currency])` | Handles all non-trip queries; LLM autonomously decides which tool to call; parses hotel JSON; detects budget updates |
| **Rollback** | — (no LLM call) | Extracts target version number from user message, restores previous itinerary from MySQL |

### Agent State Schema

The state carried through every node:

```python
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]  # Conversation history
    intent: Optional[str]              # "trip" | "general" | "rollback"
    trip_plan: Optional[TripPlan]      # Structured itinerary output
    preferences: Optional[dict]        # User travel preferences
    should_update_budget: Optional[bool]  # Flag for budget detection
    hotel_data: Optional[dict]         # Parsed hotel API response
    similar_trip: Optional[dict]       # Retrieved from Qdrant vector search
    max_budget: Optional[float]        # Budget filter for vector search
    user_id: Optional[str]            # Current authenticated user
```

---

## 🔧 Tools (External API Integrations)

The General Node has 3 tools bound via LangChain's `bind_tools()`. The LLM autonomously decides when to call each:

### ☀️ Weather Tool (`get_current_weather`)
- **API**: OpenWeatherMap (`/data/2.5/weather`)
- **Input**: City name (string)
- **Returns**: Temperature (°C), description, humidity
- **Trigger**: User asks about weather in any city

### 🏨 Hotel Tool (`get_hotels`)
- **API**: Amadeus Hotel List (`/v1/reference-data/locations/hotels/by-city`)
- **Input**: IATA city code (e.g., `PAR`, `LON`, `NYC`), offset, limit
- **Returns**: Hotel name, ID, coordinates, distance from city center
- **Features**: Pagination support (offset/limit), OAuth2 token authentication
- **Trigger**: User asks for hotel suggestions

### 💱 Currency Tool (`convert_currency`)
- **API**: Open Exchange Rates (`open.er-api.com`)
- **Input**: Amount, source currency, target currency
- **Returns**: Converted amount with exchange rate
- **Trigger**: User asks to convert between currencies

---

## 🧠 Vector Memory — Qdrant RAG System

The system implements **long-term memory** using Qdrant vector database:

1. **Storage**: When a new itinerary is generated, the trip summary is embedded using OpenAI's `text-embedding-3-small` (1536 dimensions) and stored in Qdrant along with metadata (trip_id, version, user_id, budget)

2. **Retrieval**: When a user mentions "similar" trips or specifies a budget constraint, the Planner Node performs a **semantic search** with budget filtering:
   ```
   User: "Plan something similar to my Bali trip under 1500"
     → Qdrant cosine similarity search
     → Filter: budget ≤ 1500
     → Top match injected into system prompt as context
     → GPT generates NEW itinerary inspired by past trip
   ```

3. **Collection**: `trip_recommendations` — cosine distance, 1536-dim vectors

---

## 💾 Custom MySQL Checkpoint Saver

Instead of using LangGraph's default in-memory checkpointing, this project implements a **custom `MySQLSaver`** by extending `BaseCheckpointSaver`:

- **Persistence**: Every conversation state transition is serialized and stored in MySQL (`langgraph_checkpoints` table)
- **Thread isolation**: Each trip has its own `thread_id`, so conversations don't bleed across trips
- **Resume**: Users can close the browser and return — the full conversation state is restored from MySQL
- **Operations**: `get_tuple()`, `put()`, `list()` — standard checkpoint interface backed by SQL

This ensures the agent has **true conversation persistence**, not just message history, but full state including intent, preferences, and plan data.

---

## 📊 Database Schema

Three core tables plus the checkpoint table:

```sql
-- User travel preferences (one per user)
CREATE TABLE user_preferences (
    user_id VARCHAR(255) PRIMARY KEY,
    travel_style VARCHAR(50),        -- Relaxing, Adventure, Cultural, etc.
    budget_range VARCHAR(50),        -- Economy, Mid-Range, Luxury
    preferred_climate VARCHAR(50),   -- Warm, Cold, Tropical, Any
    food_preference VARCHAR(50),     -- Any, Vegetarian, Vegan, Halal
    accommodation_type VARCHAR(50),  -- Hotel, Hostel, Resort, Apartment
    pace VARCHAR(50),                -- Slow, Medium, Fast
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Trip metadata
CREATE TABLE trips (
    trip_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    destination VARCHAR(255),
    start_date DATE NULL,
    end_date DATE NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Versioned itineraries (one trip → many versions)
CREATE TABLE trip_itineraries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id VARCHAR(50) NOT NULL,
    itinerary_json JSON,             -- Full structured itinerary
    estimated_budget DECIMAL(10,2),
    currency VARCHAR(10),
    version INT NOT NULL,            -- Auto-incrementing version number
    is_active BOOLEAN DEFAULT TRUE,  -- Only one version active at a time
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trip FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
    CONSTRAINT unique_trip_version UNIQUE (trip_id, version)
);
```

---

## 📁 Project Structure

```
AI_TRIP_PLANNER/
│
├── Agent/                          # LLM model configurations
│   ├── all_agents.py               # 3 GPT-4o-mini models: router, planner, general
│   └── planner_agent.py            # Planner agent prompt details
│
├── Nodes/                          # LangGraph graph nodes
│   ├── router_node.py              # Intent classification (trip/general/rollback)
│   ├── preference_node.py          # Load user prefs from MySQL + budget detection
│   ├── planner_node.py             # Structured itinerary generation + Qdrant RAG
│   ├── general_node.py             # Tool-calling node (weather/hotels/currency)
│   └── rollback_node.py            # Restore previous itinerary version
│
├── LangGraph/
│   └── graph.py                    # StateGraph definition, edges, conditional routing
│
├── Tools/                          # LangChain @tool definitions
│   ├── weather_info_tool.py        # OpenWeatherMap integration
│   ├── amadeus_hotel_tool.py       # Amadeus Hotel API + OAuth2
│   └── currency_conversion_tool.py # Exchange rate API
│
├── Schemas/                        # Pydantic models
│   ├── agent_schema.py             # AgentState (TypedDict for LangGraph)
│   ├── trip_detail_response.py     # TripPlan, DayPlan, Budget schemas
│   └── router_schema.py            # Intent classification schema
│
├── Services/                       # Business logic layer
│   ├── trip_service.py             # CRUD for trips
│   ├── trip_itinerary_service.py   # Versioned itinerary save/rollback
│   ├── user_preferences_service.py # User preferences CRUD
│   ├── chat_services.py            # Budget extraction utilities
│   └── chat_history_service.py     # Chat history retrieval
│
├── Config/                         # Configuration & infrastructure
│   ├── setting.py                  # Pydantic settings (env vars)
│   ├── database.py                 # SQLAlchemy engine setup
│   ├── dbConfig.py                 # Custom MySQLSaver (LangGraph checkpointer)
│   ├── vector_store.py             # Qdrant client, embeddings, similarity search
│   └── docker-compose.yml          # Qdrant container definition
│
├── api/routes/                     # FastAPI route handlers
│   ├── auth.py                     # Registration & login endpoints
│   ├── chat.py                     # Chat endpoint → LangGraph agent invocation
│   ├── trip.py                     # Trip CRUD endpoints
│   ├── preference.py               # Preferences endpoints
│   └── history.py                  # Chat history & version management
│
├── frontend/                       # React 19 + Vite
│   └── src/
│       ├── App.jsx                 # Single-file React app (auth, chat, itinerary UI)
│       └── App.css                 # Glassmorphic dark-mode styles
│
├── app.py                          # FastAPI app factory
├── main.py                         # Uvicorn entry point
├── dq_queries.sql                  # MySQL table creation scripts
├── requirements.txt                # Python dependencies
└── .env                            # API keys & database config
```

---

## 🔄 Request Lifecycle — Example Walkthrough

### Example: User sends `"Plan a 3-day trip to Paris with sightseeing"`

```
1. Frontend sends:
   GET /trips/{trip_id}/chat?question=Plan+a+3-day+trip+to+Paris
   Header: x_user_id=user_123

2. chat.py route invokes LangGraph agent:
   agent.invoke({messages: [HumanMessage], user_id}, config={thread_id: trip_id})

3. Router Node:
   ├── Takes last 5 messages as context
   ├── GPT-4o-mini classifies → intent: "trip"
   └── Returns {intent: "trip"}

4. Preference Node:
   ├── Loads preferences from MySQL for user_123
   │   {travel_style: "Adventure", budget_range: "Mid-Range", ...}
   ├── No "similar" keyword → skip vector search
   └── Returns {preferences: {...}, max_budget: null}

5. Planner Node (conditional edge: intent == "trip"):
   ├── Cleans message history (removes tool calls)
   ├── No max_budget → skips Qdrant vector search
   ├── Builds system prompt with user preferences
   ├── GPT-4o-mini → structured TripPlan JSON output
   │   {
   │     trip_summary: "3-day Parisian adventure...",
   │     estimated_budget: {amount: 2500, currency: "USD"},
   │     weather_advice: "Pack layers for mild spring weather",
   │     days: [
   │       {day: 1, title: "Iconic Landmarks", activities: [...]},
   │       {day: 2, title: "Art & Culture", activities: [...]},
   │       {day: 3, title: "Local Exploration", activities: [...]}
   │     ]
   │   }
   └── Returns structured TripPlan

6. Back in chat.py:
   ├── Detects intent == "trip" with trip_plan present
   ├── Extracts estimated_budget and currency
   ├── Calls save_or_update_itinerary() → saves as new version in MySQL
   ├── Stores trip summary embedding in Qdrant (for future RAG)
   └── Returns {status: "success", type: "trip_plan", data: {...}}

7. Frontend receives response:
   ├── Renders rich itinerary card with day tabs
   ├── Shows budget estimate and weather advice
   ├── Updates version dropdown in header
   └── Refreshes trip list in sidebar
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Purpose |
|-------------|---------|
| **Python 3.10+** | Backend runtime |
| **Conda** (optional) | Environment management (env: `ai-trip-planner`) |
| **Docker Desktop** | Runs Qdrant vector database |
| **MySQL 8.0+** | Persistent storage for users, trips, itineraries |
| **Node.js 18+** | Frontend build tool |

### Configuration

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai-trip-planner
```

### Step 1: Start Qdrant (Vector Database)

Make sure Docker Desktop is running, then:

```bash
docker compose -f Config/docker-compose.yml up -d
```

This starts Qdrant on ports `6333` (HTTP) and `6334` (gRPC).

### Step 2: Setup MySQL

Ensure MySQL is running on port `3306`. Create the database and tables:

```sql
CREATE DATABASE `ai-trip-planner`;
USE `ai-trip-planner`;
-- Then run the contents of dq_queries.sql
```

Or import directly:

```bash
mysql -u root -p ai-trip-planner < dq_queries.sql
```

### Step 3: Initialize Qdrant Collection

```powershell
# Option A: Using local virtualenv (recommended)
.\.venv\Scripts\python.exe -c "from Config.vector_store import create_collection; create_collection()"

# Option B: Using Conda
conda run -n ai-trip-planner python -c "from Config.vector_store import create_collection; create_collection()"
```

### Step 4: Start the Backend

```powershell
# Option A: Using local virtualenv (recommended)
.\.venv\Scripts\python.exe main.py

# Option B: Using Conda
conda run -n ai-trip-planner python main.py
```

The API server starts on **`http://localhost:8000`**.

### Step 5: Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **`http://localhost:5173`**.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and get user session |
| `GET` | `/trips` | List all trips for the authenticated user |
| `POST` | `/trips` | Create a new trip |
| `GET` | `/trips/{trip_id}/chat` | Send a message to the AI agent |
| `GET` | `/preferences` | Get user travel preferences |
| `POST` | `/preferences` | Update user travel preferences |
| `GET` | `/history/{trip_id}` | Get full chat history for a trip |
| `GET` | `/history/{trip_id}/versions` | List all itinerary versions |
| `POST` | `/history/{trip_id}/rollback/{version}` | Rollback to a specific itinerary version |

Explore the interactive API docs at: **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **LLM** | OpenAI GPT-4o-mini |
| **Agent Framework** | LangGraph (StateGraph with conditional edges) |
| **Embeddings** | OpenAI `text-embedding-3-small` (1536 dim) |
| **Vector DB** | Qdrant (Docker, cosine similarity) |
| **Backend** | FastAPI + Uvicorn |
| **Database** | MySQL 8.0 + SQLAlchemy |
| **Frontend** | React 19 + Vite 8 |
| **UI Icons** | Lucide React |
| **Checkpointing** | Custom MySQLSaver (extends LangGraph BaseCheckpointSaver) |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.

---

**Built by [Pankaj Garg](https://github.com/itz10pankaj)** ✨
