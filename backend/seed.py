from pymongo import MongoClient
from datetime import datetime, timezone
import uuid

MONGO_URL = "mongodb+srv://barberapp:48115855aAA@cluster0.o0ws4xa.mongodb.net/fifatracker?appName=Cluster0"

client = MongoClient(MONGO_URL)
db = client["fifatracker"]

def now(): return datetime.now(timezone.utc).isoformat()
def nid(): return str(uuid.uuid4())

EDITION_ID = "0a5e34df-41a3-49ef-84af-12274bc6bf20"
FRANCO = "90c118bc-272d-4bde-83c8-fd2a12dedcbd"
TUTE = "0e6f1670-dd56-4ee2-8ecd-c134c4c57ecc"
TOCRUZ = "28eaa2c4-e01f-4ebc-99db-45deb5c4506b"
RATH = "df9c4ca5-82e5-40b8-bf9e-5428a433635c"
PANCHO = "0ea7cad7-5709-4ec2-a7bc-d7bc970dd812"

campeonatos = [TUTE]*4 + [TOCRUZ]*4 + [FRANCO]*5 + [RATH]*1 + [PANCHO]*2

for i, champ_id in enumerate(campeonatos):
    db.championships.insert_one({
        "id": nid(),
        "edition_id": EDITION_ID,
        "name": f"Liga FC25 #{i+1}",
        "date": now(),
        "participants": [
            {"player_id": FRANCO, "team_name": None},
            {"player_id": TUTE, "team_name": None},
            {"player_id": TOCRUZ, "team_name": None},
            {"player_id": RATH, "team_name": None},
            {"player_id": PANCHO, "team_name": None},
        ],
        "rounds": 1,
        "status": "finished",
        "champion_id": champ_id,
        "runnerup_id": None,
        "created_at": now(),
    })

print(f"✅ {len(campeonatos)} campeonatos insertados")

copas = [
    {"name": "Copa FC25 #1", "champion": TUTE, "runnerup": FRANCO},
    {"name": "Copa FC25 #2", "champion": TOCRUZ, "runnerup": RATH},
    {"name": "Copa FC25 #3", "champion": TOCRUZ, "runnerup": RATH},
    {"name": "Copa FC25 #4", "champion": TUTE, "runnerup": RATH},
]

for copa in copas:
    db.cups.insert_one({
        "id": nid(),
        "edition_id": EDITION_ID,
        "name": copa["name"],
        "date": now(),
        "participants": [FRANCO, TUTE, TOCRUZ, RATH],
        "format": "SF",
        "bracket": {},
        "status": "finished",
        "champion_id": copa["champion"],
        "runnerup_id": copa["runnerup"],
        "third_place_id": None,
        "created_at": now(),
    })

print(f"✅ {len(copas)} copas insertadas")
client.close()
print("🎉 Todo listo!")