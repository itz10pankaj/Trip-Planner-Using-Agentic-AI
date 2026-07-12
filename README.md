# AI Trip Planner Backend

An Agentic AI-powered trip planner built with FastAPI, LangGraph, OpenAI, Qdrant, and MySQL.

---

## Prerequisites

Before running the application, make sure you have the following installed and running:

1. **Python / Conda**:
   - The project is configured with a Conda environment named `ai-trip-planner`.
2. **Docker Desktop**:
   - Required to run the Qdrant vector database.
3. **MySQL**:
   - Required to store user preferences, trips, and itineraries.

---

## Configuration

Make sure your `.env` file in the root directory contains the correct configuration:

```env
OPENAI_API_KEY=your_openai_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai-trip-planner
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret
```

---

## Running the Project

Follow these steps to run the application:

### 1. Start Qdrant Vector Database
Make sure Docker Desktop is open and run the following command to start Qdrant:
```bash
docker compose -f Config/docker-compose.yml up -d
```

### 2. Start MySQL
Ensure your local MySQL service is running on port `3306` and contains the database `ai-trip-planner`. If the tables are not created yet, you can import the schema from `dq_queries.sql`.

### 3. Initialize the Vector Store Collection
Run the following script to create the Qdrant collection:

**Option A (Using the local virtualenv - Recommended)**:
```powershell
.\.venv\Scripts\python.exe -c "from Config.vector_store import create_collection; create_collection()"
```

**Option B (Using the Conda environment)**:
```powershell
conda run -n ai-trip-planner python -c "from Config.vector_store import create_collection; create_collection()"
```

---

### 4. Run the FastAPI Application
Start the FastAPI uvicorn server:

**Option A (Using the local virtualenv - Recommended)**:
```powershell
.\.venv\Scripts\python.exe main.py
```

**Option B (Using the Conda environment)**:
```powershell
conda run -n ai-trip-planner python main.py
```

The server will start running on: **`http://localhost:8000`**

---

## API Documentation

Once the server is running, you can explore and test the endpoints directly from your browser:
- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
