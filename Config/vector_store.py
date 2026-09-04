from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    PointStruct,
    Filter,
    FieldCondition,
    Range,
)
import uuid
from openai import OpenAI
from Config.setting import get_settings

settings = get_settings()

openai_client = OpenAI(
    api_key=settings.OPENAI_API_KEY
)

client = QdrantClient(
    host="localhost",
    port=6333
)

COLLECTION_NAME = "trip_recommendations"


def create_collection():
    if client.collection_exists(COLLECTION_NAME):
        print("Collection already exists.")
        return

    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(
            size=1536,
            distance=Distance.COSINE
        )
    )

    print("Collection created successfully!")


# Create collection when this module is loaded
try:
    create_collection()
except Exception as e:
    print(f"Warning: Could not initialize Qdrant collection: {e}")


def generate_embedding(text: str):
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )

    return response.data[0].embedding


def store_trip_memory(
    trip_id: str,
    version_id: int,
    user_id: str,
    summary: str,
    budget: float
):
    embedding = generate_embedding(summary)

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "trip_id": trip_id,
                    "version": version_id,
                    "user_id": user_id,
                    "budget": budget,
                    "summary": summary
                }
            )
        ]
    )

    print(f"Trip {trip_id} stored in vector DB.")


def search_similar_with_budget(
    query_text: str,
    max_budget: float,
    limit: int = 3
) -> list[dict]:
    """
    Search for similar trip memories in Qdrant vector database matching query_text
    with budget less than or equal to max_budget.
    """
    try:
        query_embedding = generate_embedding(query_text)

        query_filter = Filter(
            must=[
                FieldCondition(
                    key="budget",
                    range=Range(lte=float(max_budget))
                )
            ]
        )

        response = client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_embedding,
            query_filter=query_filter,
            limit=limit
        )

        results = []
        for point in response.points:
            if point.payload:
                results.append(point.payload)

        return results
    except Exception as e:
        print(f"Error searching vector store: {e}")
        return []