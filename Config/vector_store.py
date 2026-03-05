from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams,Distance,PointStruct,Filter, FieldCondition, Range,MatchValue
import uuid
from openai import OpenAI
from Config.setting import get_settings
settings=get_settings()
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)


#Connect to local Qdrant
client = QdrantClient(host="localhost",port=6333)
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


def generate_embedding(text: str):
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",  # 1536 dimension
        input=text
    )
    return response.data[0].embedding

def store_trip_memory(trip_id: str,version_id:int, user_id: str, summary: str, budget: float):
    embedding = generate_embedding(summary)

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=str(uuid.uuid4()),  # important: use trip_id as ID
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

def search_similar(query_text: str):
    query_embedding = generate_embedding(query_text)

    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        limit=3
    )

    for r in results.points:
        print("Score:", r.score)
        print("Payload:", r.payload)
        print("------")

def search_similar_with_budget(query_text: str, max_budget: float):
    print("query_text.............",query_text)
    print("max_budget..........",max_budget)
    matched = []
    matched_score=0
    query_embedding = generate_embedding(query_text)
    print("query_embedding.........",query_embedding)
    results = client.query_points(
        collection_name = COLLECTION_NAME,
        query = query_embedding,
        query_filter=Filter(
              must=[
                FieldCondition(
                    key="budget",
                    range=Range(lte=max_budget)
                )
            ]
        )
    )
    for r in results.points:
        print("Score:", r.score)
        print("Payload:", r.payload)
        print("------")
        if r.score > matched_score:
            matched_score=r.score
            matched.append(r.payload)
    return matched

def retrieve_similar_trip( user_id: str, query_text: str, max_budget: float | None = None, limit: int = 1):
    query_embedding = generate_embedding(query_text)

    filters = [
        FieldCondition(
            key="user_id",
            match=MatchValue(value=user_id)
        )
    ]

    if max_budget is not None:
        filters.append(
            FieldCondition(
                key="budget",
                range=Range(lte=max_budget)
            )
        )

    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        query_filter=Filter(must=filters),
        limit=limit
    )

    return results.points

if __name__ == "__main__":
    create_collection()

    summary = """
    5-day beach vacation in Bali.
    Stayed in beachfront resort.
    Activities: snorkeling, temple visit, sunset cruise.
    Budget: 1200 USD.
    Travel style: relaxed and romantic.
    """

    insert_trip(summary, "trip_001", "user_123", 1200)

    print("\nSearching similar trips...\n")

    search_similar("Plan something like my Bali romantic beach trip")