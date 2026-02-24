from sqlalchemy import create_engine, Table, Column, String, LargeBinary, MetaData, select
from sqlalchemy.dialects.mysql import insert
from langgraph.checkpoint.base import BaseCheckpointSaver, CheckpointTuple
from langgraph.checkpoint.serde.jsonplus import JsonPlusSerializer
from urllib.parse import quote_plus
from typing import Iterator, Optional, List, Dict, Any
from Config.setting import get_settings
import json

settings = get_settings()
DB_PASS = quote_plus(settings.DB_PASSWORD)
DB_URL = f"mysql+pymysql://{settings.DB_USER}:{DB_PASS}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"


class MySQLSaver(BaseCheckpointSaver):

    def __init__(self, db_url: str):
        super().__init__()
        self.engine = create_engine(db_url)
        self.metadata = MetaData()
        self.serde = JsonPlusSerializer()

        self.table = Table(
            "langgraph_checkpoints",
            self.metadata,
            Column("thread_id", String(255), primary_key=True),
            Column("checkpoint_ns", String(255), primary_key=True, default=""),
            Column("checkpoint_id", String(255), primary_key=True, default=""),
            Column("checkpoint", LargeBinary),
            Column("meta", String(50)),
            Column("checkpoint_metadata", LargeBinary),
            Column("checkpoint_meta_type", String(50)),
        )

        self.metadata.create_all(self.engine, checkfirst=True)

    # -------------------------
    # GET LATEST / SPECIFIC CHECKPOINT
    # -------------------------
    def get_tuple(self, config) -> Optional[CheckpointTuple]:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = config["configurable"].get("checkpoint_id")

        with self.engine.connect() as conn:
            query = select(
                self.table.c.checkpoint,
                self.table.c.meta,
                self.table.c.checkpoint_metadata,
                self.table.c.checkpoint_meta_type,
                self.table.c.checkpoint_id,
            ).where(
                self.table.c.thread_id == thread_id,
                self.table.c.checkpoint_ns == checkpoint_ns,
            )

            if checkpoint_id:
                query = query.where(self.table.c.checkpoint_id == checkpoint_id)
            else:
                query = query.order_by(self.table.c.checkpoint_id.desc()).limit(1)

            result = conn.execute(query).fetchone()

            if result:
                checkpoint = self.serde.loads_typed((result[1], result[0]))
                chk_metadata = self.serde.loads_typed((result[3], result[2])) if result[2] else {}
                return CheckpointTuple(
                    config={
                        **config,
                        "configurable": {
                            **config["configurable"],
                            "checkpoint_id": result[4]
                        }
                    },
                    checkpoint=checkpoint,
                    metadata=chk_metadata
                )

        return None

    # -------------------------
    # SAVE CHECKPOINT
    # -------------------------
    def put(self, config, checkpoint, metadata=None, new_versions=None) -> dict:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = checkpoint["id"]

        checkpoint_type, serialized_checkpoint = self.serde.dumps_typed(checkpoint)
        meta_to_store = metadata or {}
        if isinstance(meta_to_store, dict):
            meta_to_store = json.loads(json.dumps(meta_to_store))
        metadata_type, serialized_metadata = self.serde.dumps_typed(meta_to_store)

        stmt = insert(self.table).values(
            thread_id=thread_id,
            checkpoint_ns=checkpoint_ns,
            checkpoint_id=checkpoint_id,
            checkpoint=serialized_checkpoint,
            meta=checkpoint_type,
            checkpoint_metadata=serialized_metadata,
            checkpoint_meta_type=metadata_type,
        )

        stmt = stmt.on_duplicate_key_update(
            checkpoint=stmt.inserted.checkpoint,
            meta=stmt.inserted.meta,
            checkpoint_metadata=stmt.inserted.checkpoint_metadata,
            checkpoint_meta_type=stmt.inserted.checkpoint_meta_type,
        )

        with self.engine.connect() as conn:
            conn.execute(stmt)
            conn.commit()

        return {
            **config,
            "configurable": {
                **config["configurable"],
                "checkpoint_id": checkpoint_id
            }
        }

    # -------------------------
    # SAVE INTERMEDIATE WRITES
    # -------------------------
    def put_writes(self, config, writes, task_id, task_path=None) -> None:
        # Intermediate writes are transient — not persisted
        return None

    # -------------------------
    # LIST ALL CHECKPOINTS FOR A THREAD
    # -------------------------
    def list(self, config, *, filter=None, before=None, limit=None) -> Iterator[CheckpointTuple]:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")

        with self.engine.connect() as conn:
            query = select(
                self.table.c.checkpoint,
                self.table.c.meta,
                self.table.c.checkpoint_metadata,
                self.table.c.checkpoint_meta_type,
                self.table.c.checkpoint_id,
            ).where(
                self.table.c.thread_id == thread_id,
                self.table.c.checkpoint_ns == checkpoint_ns,
            ).order_by(self.table.c.checkpoint_id.desc())

            if limit:
                query = query.limit(limit)

            results = conn.execute(query).fetchall()

            for result in results:
                checkpoint = self.serde.loads_typed((result[1], result[0]))
                chk_metadata = self.serde.loads_typed((result[3], result[2])) if result[2] else {}
                yield CheckpointTuple(
                    config={
                        **config,
                        "configurable": {
                            **config["configurable"],
                            "checkpoint_id": result[4]
                        }
                    },
                    checkpoint=checkpoint,
                    metadata=chk_metadata
                )

memory = MySQLSaver(DB_URL)