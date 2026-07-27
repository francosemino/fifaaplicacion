"""FIFA/EA Sports FC Tournament Tracker - Backend."""
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="FC Tournaments API")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")




@app.on_event("startup")
async def ensure_indexes():
    await db.editions.create_index([("id", 1)])
    await db.editions.create_index([("created_at", 1)])

    await db.players.create_index([("id", 1)])
    await db.players.create_index([("name", 1)])

    await db.championships.create_index([("id", 1)])
    await db.championships.create_index([("edition_id", 1), ("created_at", -1)])
    await db.championships.create_index([("champion_id", 1)])
    await db.championships.create_index([("runnerup_id", 1)])

    await db.cups.create_index([("id", 1)])
    await db.cups.create_index([("edition_id", 1), ("created_at", -1)])
    await db.cups.create_index([("champion_id", 1)])
    await db.cups.create_index([("runnerup_id", 1)])
    await db.cups.create_index([("third_place_id", 1)])

    await db.matches.create_index([("id", 1)])
    await db.matches.create_index([("competition_id", 1), ("competition_type", 1), ("date", 1)])
    await db.matches.create_index([("player1_id", 1)])
    await db.matches.create_index([("player2_id", 1)])
    await db.matches.create_index([("date", -1)])

    await db.goals.create_index([("id", 1)])
    await db.goals.create_index([("edition_id", 1), ("created_at", -1)])
    await db.goals.create_index([("competition_id", 1), ("competition_type", 1), ("created_at", -1)])
    await db.goals.create_index([("edition_id", 1), ("is_tournament_best", 1)])
    await db.goals.create_index([("edition_id", 1), ("is_puskas", 1)])
# ====================== MODELS ======================
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


class Edition(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    year: Optional[int] = None
    is_active: bool = True
    created_at: str = Field(default_factory=now_iso)


class EditionCreate(BaseModel):
    name: str
    year: Optional[int] = None


class Player(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    nickname: Optional[str] = None
    avatar_base64: Optional[str] = None
    favorite_team: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class PlayerCreate(BaseModel):
    name: str
    nickname: Optional[str] = None
    avatar_base64: Optional[str] = None
    favorite_team: Optional[str] = None


class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    avatar_base64: Optional[str] = None
    favorite_team: Optional[str] = None


class Goal(BaseModel):
    id: str = Field(default_factory=new_id)
    edition_id: str
    competition_id: Optional[str] = None
    competition_type: Optional[str] = None  # championship | cup
    player_id: str
    opponent_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    video_base64: Optional[str] = None  # data URI (data:video/mp4;base64,...)
    video_mime: Optional[str] = None
    thumbnail_base64: Optional[str] = None
    is_tournament_best: bool = False
    is_puskas: bool = False
    created_at: str = Field(default_factory=now_iso)


class GoalCreate(BaseModel):
    edition_id: str
    competition_id: Optional[str] = None
    competition_type: Optional[str] = None
    player_id: str
    opponent_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    video_base64: Optional[str] = None
    video_mime: Optional[str] = None
    thumbnail_base64: Optional[str] = None


class ChampionshipParticipant(BaseModel):
    player_id: str
    team_name: Optional[str] = None


class Championship(BaseModel):
    id: str = Field(default_factory=new_id)
    edition_id: str
    name: str
    date: str = Field(default_factory=now_iso)
    participants: List[ChampionshipParticipant]
    rounds: int = 2
    status: str = "ongoing"
    champion_id: Optional[str] = None
    runnerup_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class ChampionshipCreate(BaseModel):
    edition_id: str
    name: str
    participants: List[ChampionshipParticipant]
    rounds: int = 1
    generate_fixture: bool = False


class Match(BaseModel):
    id: str = Field(default_factory=new_id)
    competition_id: str
    competition_type: str
    round_name: Optional[str] = None
    player1_id: str
    player2_id: str
    team1: Optional[str] = None
    team2: Optional[str] = None
    goals1: int = 0
    goals2: int = 0
    played: bool = True
    extra_time: bool = False
    penalties: bool = False
    pen_goals1: Optional[int] = None
    pen_goals2: Optional[int] = None
    winner_id: Optional[str] = None
    date: str = Field(default_factory=now_iso)
    notes: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class MatchCreate(BaseModel):
    competition_id: str
    competition_type: str
    round_name: Optional[str] = None
    player1_id: str
    player2_id: str
    team1: Optional[str] = None
    team2: Optional[str] = None
    goals1: int = 0
    goals2: int = 0
    played: bool = True
    extra_time: bool = False
    penalties: bool = False
    pen_goals1: Optional[int] = None
    pen_goals2: Optional[int] = None
    date: Optional[str] = None
    notes: Optional[str] = None
    
    
class MatchUpdate(BaseModel):
    round_name: Optional[str] = None
    team1: Optional[str] = None
    team2: Optional[str] = None
    goals1: Optional[int] = None
    goals2: Optional[int] = None
    played: Optional[bool] = None
    extra_time: Optional[bool] = None
    penalties: Optional[bool] = None
    pen_goals1: Optional[int] = None
    pen_goals2: Optional[int] = None
    notes: Optional[str] = None


class Cup(BaseModel):
    id: str = Field(default_factory=new_id)
    edition_id: str
    name: str
    date: str = Field(default_factory=now_iso)
    participants: List[str]
    format: str = "SF"
    bracket: Dict[str, Any] = Field(default_factory=dict)
    status: str = "ongoing"
    champion_id: Optional[str] = None
    runnerup_id: Optional[str] = None
    third_place_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class CupCreate(BaseModel):
    edition_id: str
    name: str
    participants: List[str]
    format: str = "SF"


# ====================== HELPERS ======================
PROJECTION = {"_id": 0}


async def _get_player_map() -> Dict[str, dict]:
    players = await db.players.find({}, PROJECTION).to_list(1000)
    return {p["id"]: p for p in players}


async def _compute_standings(championship: dict) -> List[dict]:
    participants = championship["participants"]
    player_ids = [p["player_id"] for p in participants]
    team_map = {p["player_id"]: p.get("team_name") for p in participants}

    stats = {
        pid: {
            "player_id": pid,
            "team": team_map.get(pid),
            "played": 0, "won": 0, "drawn": 0, "lost": 0,
            "goals_for": 0, "goals_against": 0, "goal_diff": 0,
            "points": 0,
        }
        for pid in player_ids
    }

    matches = await db.matches.find(
        {"competition_id": championship["id"], "competition_type": "championship"},
        PROJECTION
    ).to_list(1000)

    for m in matches:
        if not m.get("played", True):
            continue
        
        p1, p2 = m["player1_id"], m["player2_id"]
        g1, g2 = m["goals1"], m["goals2"]
        if p1 not in stats or p2 not in stats:
            continue
        stats[p1]["played"] += 1
        stats[p2]["played"] += 1
        stats[p1]["goals_for"] += g1
        stats[p1]["goals_against"] += g2
        stats[p2]["goals_for"] += g2
        stats[p2]["goals_against"] += g1
        if g1 > g2:
            stats[p1]["won"] += 1
            stats[p1]["points"] += 3
            stats[p2]["lost"] += 1
        elif g2 > g1:
            stats[p2]["won"] += 1
            stats[p2]["points"] += 3
            stats[p1]["lost"] += 1
        else:
            stats[p1]["drawn"] += 1
            stats[p2]["drawn"] += 1
            stats[p1]["points"] += 1
            stats[p2]["points"] += 1

    for s in stats.values():
        s["goal_diff"] = s["goals_for"] - s["goals_against"]

    table = sorted(
        stats.values(),
        key=lambda x: (-x["points"], -x["goal_diff"], -x["goals_for"])
    )
    for idx, row in enumerate(table):
        row["position"] = idx + 1
    return table


def _match_result_for(player_id: str, m: dict) -> str:
    if player_id == m["player1_id"]:
        mine, theirs = m["goals1"], m["goals2"]
        my_pen = m.get("pen_goals1")
        their_pen = m.get("pen_goals2")
    elif player_id == m["player2_id"]:
        mine, theirs = m["goals2"], m["goals1"]
        my_pen = m.get("pen_goals2")
        their_pen = m.get("pen_goals1")
    else:
        return "N"
    if m.get("penalties") and my_pen is not None and their_pen is not None:
        if my_pen > their_pen:
            return "W"
        if my_pen < their_pen:
            return "L"
    if mine > theirs:
        return "W"
    if mine < theirs:
        return "L"
    return "D"


async def _compute_player_stats(player_id: str, edition_id: Optional[str] = None) -> dict:
    query = {"$or": [{"player1_id": player_id}, {"player2_id": player_id}]}
    all_matches = await db.matches.find(query, PROJECTION).to_list(5000)

    if edition_id:
        champs = await db.championships.find({"edition_id": edition_id}, PROJECTION).to_list(1000)
        cups = await db.cups.find({"edition_id": edition_id}, PROJECTION).to_list(1000)
        valid_ids = {c["id"] for c in champs} | {c["id"] for c in cups}
        matches = [m for m in all_matches if m["competition_id"] in valid_ids]
    else:
        matches = all_matches

    played = won = drawn = lost = 0
    gf = ga = 0
    biggest_win = None
    biggest_loss = None
    best_streak = 0
    worst_streak = 0
    cur_w = cur_l = 0

    vs: Dict[str, dict] = defaultdict(lambda: {"played": 0, "won": 0, "drawn": 0, "lost": 0, "gf": 0, "ga": 0})

    matches_sorted = sorted(matches, key=lambda m: m.get("date", ""))

    for m in matches_sorted:
        played += 1
        if player_id == m["player1_id"]:
            mine, theirs = m["goals1"], m["goals2"]
            opp = m["player2_id"]
        else:
            mine, theirs = m["goals2"], m["goals1"]
            opp = m["player1_id"]
        gf += mine
        ga += theirs
        vs[opp]["played"] += 1
        vs[opp]["gf"] += mine
        vs[opp]["ga"] += theirs

        res = _match_result_for(player_id, m)
        if res == "W":
            won += 1
            vs[opp]["won"] += 1
            cur_w += 1
            cur_l = 0
            if cur_w > best_streak:
                best_streak = cur_w
            diff = mine - theirs
            if biggest_win is None or diff > biggest_win["diff"]:
                biggest_win = {"diff": diff, "score": f"{mine}-{theirs}", "opponent_id": opp}
        elif res == "L":
            lost += 1
            vs[opp]["lost"] += 1
            cur_l += 1
            cur_w = 0
            if cur_l > worst_streak:
                worst_streak = cur_l
            diff = theirs - mine
            if biggest_loss is None or diff > biggest_loss["diff"]:
                biggest_loss = {"diff": diff, "score": f"{mine}-{theirs}", "opponent_id": opp}
        else:
            drawn += 1
            vs[opp]["drawn"] += 1
            cur_w = 0
            cur_l = 0

    champs_q = {"champion_id": player_id}
    if edition_id:
        champs_q["edition_id"] = edition_id
    champ_count = await db.championships.count_documents(champs_q)

    runner_q = {"runnerup_id": player_id}
    if edition_id:
        runner_q["edition_id"] = edition_id
    champ_runner_count = await db.championships.count_documents(runner_q)

    cups_q = {"champion_id": player_id}
    if edition_id:
        cups_q["edition_id"] = edition_id
    cup_count = await db.cups.count_documents(cups_q)

    cup_runner_q = {"runnerup_id": player_id}
    if edition_id:
        cup_runner_q["edition_id"] = edition_id
    cup_runner_count = await db.cups.count_documents(cup_runner_q)

    cup_third_q = {"third_place_id": player_id}
    if edition_id:
        cup_third_q["edition_id"] = edition_id
    cup_third_count = await db.cups.count_documents(cup_third_q)

    cp = 0
    for m in matches_sorted:
        if m["competition_type"] != "championship":
            continue
        res = _match_result_for(player_id, m)
        if res == "W":
            cp += 3
        elif res == "D":
            cp += 1
    championship_points = cp

    win_pct = round((won / played) * 100, 1) if played else 0.0
    avg_goals = round(gf / played, 2) if played else 0.0

    return {
        "player_id": player_id,
        "edition_id": edition_id,
        "played": played,
        "won": won,
        "drawn": drawn,
        "lost": lost,
        "goals_for": gf,
        "goals_against": ga,
        "goal_diff": gf - ga,
        "win_pct": win_pct,
        "avg_goals_per_match": avg_goals,
        "championships": champ_count,
        "championships_runnerup": champ_runner_count,
        "cups": cup_count,
        "cups_runnerup": cup_runner_count,
        "cups_third": cup_third_count,
        "finals_played": champ_runner_count + champ_count + cup_count + cup_runner_count,
        "championship_points": championship_points,
        "best_win_streak": best_streak,
        "worst_loss_streak": worst_streak,
        "biggest_win": biggest_win,
        "biggest_loss": biggest_loss,
        "vs_rivals": dict(vs),
    }
    
    
MAX_VIDEO_DATA_URI_CHARS = 12 * 1024 * 1024
VALID_COMPETITION_TYPES = {"championship", "cup"}


@api_router.get("/goals")
async def list_goals(
    edition_id: Optional[str] = None,
    competition_id: Optional[str] = None,
    competition_type: Optional[str] = None,
    player_id: Optional[str] = None,
    is_tournament_best: Optional[bool] = None,
    is_puskas: Optional[bool] = None,
    include_video: bool = True,
):
    q: Dict[str, Any] = {}

    if edition_id:
        q["edition_id"] = edition_id

    if competition_id:
        q["competition_id"] = competition_id

    if competition_type:
        q["competition_type"] = competition_type

    if player_id:
        q["player_id"] = player_id

    if is_tournament_best is not None:
        q["is_tournament_best"] = is_tournament_best

    if is_puskas is not None:
        q["is_puskas"] = is_puskas

    pipeline = [
        {"$match": q},
        {
            "$addFields": {
                "has_video": {
                    "$and": [
                        {"$ne": ["$video_base64", None]},
                        {"$ne": ["$video_base64", ""]},
                    ]
                }
            }
        },
        {"$sort": {"created_at": -1}},
    ]

    project = {"_id": 0}

    if not include_video:
        project["video_base64"] = 0

    pipeline.append({"$project": project})

    items = await db.goals.aggregate(pipeline).to_list(1000)
    return items


@api_router.post("/goals", response_model=Goal)
async def create_goal(body: GoalCreate):
    title = body.title.strip()

    if not title:
        raise HTTPException(400, "El título del gol es obligatorio")

    edition = await db.editions.find_one({"id": body.edition_id}, PROJECTION)
    if not edition:
        raise HTTPException(404, "Edición no encontrada")

    player = await db.players.find_one({"id": body.player_id}, PROJECTION)
    if not player:
        raise HTTPException(404, "Jugador no encontrado")

    if body.opponent_id:
        opponent = await db.players.find_one({"id": body.opponent_id}, PROJECTION)
        if not opponent:
            raise HTTPException(404, "Rival no encontrado")

    if body.competition_id:
        if body.competition_type not in VALID_COMPETITION_TYPES:
            raise HTTPException(400, "Tipo de competición inválido")

        collection = db.championships if body.competition_type == "championship" else db.cups

        competition = await collection.find_one(
            {
                "id": body.competition_id,
                "edition_id": body.edition_id,
            },
            PROJECTION,
        )

        if not competition:
            raise HTTPException(404, "Competición no encontrada")
    else:
        if body.competition_type:
            raise HTTPException(400, "competition_type no puede venir sin competition_id")

    if body.video_base64:
        if not body.video_base64.startswith("data:video/"):
            raise HTTPException(400, "El video debe venir como data URI de video")

        if ";base64," not in body.video_base64:
            raise HTTPException(400, "El video debe venir en formato base64")

        if len(body.video_base64) > MAX_VIDEO_DATA_URI_CHARS:
            raise HTTPException(
                400,
                "El video es muy grande. Probá con un clip más corto o comprimido.",
            )

    payload = body.dict()
    payload["title"] = title
    payload["description"] = body.description.strip() if body.description else None

    if body.video_base64 and not payload.get("video_mime"):
        payload["video_mime"] = body.video_base64.split(";")[0].replace("data:", "")

    g = Goal(**payload)

    await db.goals.insert_one(g.dict())

    return g


@api_router.get("/goals/puskas/current")
async def get_current_puskas(
    edition_id: Optional[str] = None,
    include_video: bool = True,
):
    q: Dict[str, Any] = {"is_puskas": True}

    if edition_id:
        q["edition_id"] = edition_id

    proj = dict(PROJECTION)

    if not include_video:
        proj["video_base64"] = 0

    g = await db.goals.find_one(q, proj)

    if g:
        g["has_video"] = bool(g.get("video_base64"))

    return g


@api_router.get("/goals/{gid}")
async def get_goal(gid: str):
    g = await db.goals.find_one({"id": gid}, PROJECTION)

    if not g:
        raise HTTPException(404, "Goal not found")

    g["has_video"] = bool(g.get("video_base64"))

    return g


@api_router.delete("/goals/{gid}")
async def delete_goal(gid: str):
    result = await db.goals.delete_one({"id": gid})

    if result.deleted_count == 0:
        raise HTTPException(404, "Goal not found")

    return {"ok": True}


@api_router.delete("/goals/{gid}/video")
async def delete_goal_video(gid: str):
    g = await db.goals.find_one({"id": gid}, PROJECTION)

    if not g:
        raise HTTPException(404, "Goal not found")

    await db.goals.update_one(
        {"id": gid},
        {
            "$set": {
                "video_base64": None,
                "video_mime": None,
                "thumbnail_base64": None,
            }
        },
    )

    updated = await db.goals.find_one({"id": gid}, PROJECTION)

    if updated:
        updated["has_video"] = False

    return updated


@api_router.post("/goals/{gid}/mark-tournament-best")
async def mark_tournament_best(gid: str):
    g = await db.goals.find_one({"id": gid}, PROJECTION)

    if not g:
        raise HTTPException(404, "Goal not found")

    if not g.get("competition_id"):
        raise HTTPException(400, "Goal has no competition")

    new_value = not g.get("is_tournament_best", False)

    scope = {
        "edition_id": g["edition_id"],
        "competition_id": g["competition_id"],
        "competition_type": g.get("competition_type"),
    }

    await db.goals.update_many(
        scope,
        {
            "$set": {
                "is_tournament_best": False,
                "is_puskas": False,
            }
        },
    )

    if new_value:
        await db.goals.update_one(
            {"id": gid},
            {
                "$set": {
                    "is_tournament_best": True,
                    "is_puskas": False,
                }
            },
        )

    return {
        "ok": True,
        "goal_id": gid,
        "is_tournament_best": new_value,
    }


@api_router.post("/goals/{gid}/mark-puskas")
async def mark_puskas(gid: str):
    g = await db.goals.find_one({"id": gid}, PROJECTION)

    if not g:
        raise HTTPException(404, "Goal not found")

    if not g.get("is_tournament_best"):
        raise HTTPException(
            400,
            "Primero marcá este gol como mejor gol del torneo.",
        )

    new_value = not g.get("is_puskas", False)

    await db.goals.update_many(
        {"edition_id": g["edition_id"]},
        {"$set": {"is_puskas": False}},
    )

    if new_value:
        await db.goals.update_one(
            {"id": gid},
            {"$set": {"is_puskas": True}},
        )

    return {
        "ok": True,
        "goal_id": gid,
        "is_puskas": new_value,
    }


# ====================== ROUTES: EDITIONS ======================
@api_router.get("/")
async def root():
    return {"message": "FC Tournaments API"}


@api_router.get("/editions", response_model=List[Edition])
async def list_editions():
    items = await db.editions.find({}, PROJECTION).sort("created_at", 1).to_list(1000)
    return [Edition(**i) for i in items]


@api_router.post("/editions", response_model=Edition)
async def create_edition(body: EditionCreate):
    existing = await db.editions.find_one({"name": body.name}, PROJECTION)
    if existing:
        return Edition(**existing)
    ed = Edition(**body.dict())
    await db.editions.insert_one(ed.dict())
    return ed


@api_router.delete("/editions/{edition_id}")
async def delete_edition(edition_id: str):
    champs = await db.championships.find({"edition_id": edition_id}, PROJECTION).to_list(1000)
    cups = await db.cups.find({"edition_id": edition_id}, PROJECTION).to_list(1000)

    champ_ids = [c["id"] for c in champs]
    cup_ids = [c["id"] for c in cups]
    competition_ids = champ_ids + cup_ids

    await db.editions.delete_one({"id": edition_id})
    await db.championships.delete_many({"edition_id": edition_id})
    await db.cups.delete_many({"edition_id": edition_id})

    if competition_ids:
        await db.matches.delete_many({"competition_id": {"$in": competition_ids}})
        await db.goals.delete_many({"competition_id": {"$in": competition_ids}})

    await db.goals.delete_many({"edition_id": edition_id})

    return {"ok": True}


@api_router.get("/editions/{edition_id}/summary")
async def edition_summary(edition_id: str):
    edition = await db.editions.find_one({"id": edition_id}, PROJECTION)
    if not edition:
        raise HTTPException(404, "Edition not found")
    champs = await db.championships.find({"edition_id": edition_id}, PROJECTION).to_list(1000)
    cups = await db.cups.find({"edition_id": edition_id}, PROJECTION).to_list(1000)

    player_ids = set()
    for c in champs:
        for p in c["participants"]:
            player_ids.add(p["player_id"])
    for c in cups:
        for pid in c["participants"]:
            player_ids.add(pid)

    ranking = []

    stats_list = await asyncio.gather(
        *[_compute_player_stats(pid, edition_id) for pid in player_ids]
    )

    for s in stats_list:
        score = s["championships"] * 100 + s["cups"] * 30 + s["championship_points"] + s["goal_diff"]
        s["score"] = score
        ranking.append(s)
    ranking.sort(key=lambda x: (-x["championships"], -x["cups"], -x["championship_points"], -x["goal_diff"]))

    best_player_id = None
    if ranking:
        top = ranking[0]
        if top["championships"] > 0:
            best_player_id = top["player_id"]

    return {
        "edition": edition,
        "championships_count": len(champs),
        "cups_count": len(cups),
        "ranking": ranking,
        "best_player_id": best_player_id,
        "champions": [c for c in champs if c.get("champion_id")],
        "cup_champions": [c for c in cups if c.get("champion_id")],
    }


# ====================== ROUTES: PLAYERS ======================
@api_router.get("/players", response_model=List[Player])
async def list_players():
    items = await db.players.find({}, PROJECTION).sort("name", 1).to_list(1000)
    return [Player(**i) for i in items]


@api_router.post("/players", response_model=Player)
async def create_player(body: PlayerCreate):
    p = Player(**body.dict())
    await db.players.insert_one(p.dict())
    return p


@api_router.get("/players/{player_id}", response_model=Player)
async def get_player(player_id: str):
    p = await db.players.find_one({"id": player_id}, PROJECTION)
    if not p:
        raise HTTPException(404, "Player not found")
    return Player(**p)


@api_router.put("/players/{player_id}", response_model=Player)
async def update_player(player_id: str, body: PlayerUpdate):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if updates:
        await db.players.update_one({"id": player_id}, {"$set": updates})
    p = await db.players.find_one({"id": player_id}, PROJECTION)
    if not p:
        raise HTTPException(404, "Player not found")
    return Player(**p)


@api_router.delete("/players/{player_id}")
async def delete_player(player_id: str):
    await db.players.delete_one({"id": player_id})
    return {"ok": True}

def _build_competition_edition_map(championships: List[dict], cups: List[dict]) -> Dict[str, str]:
    comp_to_edition: Dict[str, str] = {}

    for c in championships:
        comp_to_edition[c["id"]] = c["edition_id"]

    for c in cups:
        comp_to_edition[c["id"]] = c["edition_id"]

    return comp_to_edition


def _player_ids_in_edition(
    edition_id: str,
    championships: List[dict],
    cups: List[dict],
    matches: List[dict],
    comp_to_edition: Dict[str, str],
) -> set:
    ids = set()

    for c in championships:
        if c.get("edition_id") != edition_id:
            continue

        for part in c.get("participants", []):
            if isinstance(part, dict) and part.get("player_id"):
                ids.add(part["player_id"])

    for cup in cups:
        if cup.get("edition_id") != edition_id:
            continue

        for pid in cup.get("participants", []):
            if pid:
                ids.add(pid)

    for m in matches:
        if comp_to_edition.get(m.get("competition_id")) != edition_id:
            continue

        if m.get("player1_id"):
            ids.add(m["player1_id"])

        if m.get("player2_id"):
            ids.add(m["player2_id"])

    return ids


def _compute_player_stats_prefetched(
    player_id: str,
    matches: List[dict],
    championships: List[dict],
    cups: List[dict],
    comp_to_edition: Dict[str, str],
    edition_id: Optional[str] = None,
) -> dict:
    scoped_matches = []

    for m in matches:
        if m.get("player1_id") != player_id and m.get("player2_id") != player_id:
            continue

        if edition_id and comp_to_edition.get(m.get("competition_id")) != edition_id:
            continue

        scoped_matches.append(m)

    scoped_matches = sorted(scoped_matches, key=lambda x: x.get("date", ""))

    played = won = drawn = lost = 0
    gf = ga = 0
    best_streak = 0
    worst_streak = 0
    cur_w = 0
    cur_l = 0
    biggest_win = None
    biggest_loss = None

    vs: Dict[str, dict] = defaultdict(
        lambda: {
            "played": 0,
            "won": 0,
            "drawn": 0,
            "lost": 0,
            "gf": 0,
            "ga": 0,
        }
    )

    championship_points = 0

    for m in scoped_matches:
        played += 1

        if player_id == m["player1_id"]:
            mine = m["goals1"]
            theirs = m["goals2"]
            opp = m["player2_id"]
        else:
            mine = m["goals2"]
            theirs = m["goals1"]
            opp = m["player1_id"]

        gf += mine
        ga += theirs

        vs[opp]["played"] += 1
        vs[opp]["gf"] += mine
        vs[opp]["ga"] += theirs

        res = _match_result_for(player_id, m)

        if res == "W":
            won += 1
            vs[opp]["won"] += 1
            cur_w += 1
            cur_l = 0
            best_streak = max(best_streak, cur_w)

            diff = mine - theirs

            if biggest_win is None or diff > biggest_win["diff"]:
                biggest_win = {
                    "diff": diff,
                    "score": f"{mine}-{theirs}",
                    "opponent_id": opp,
                }

            if m.get("competition_type") == "championship":
                championship_points += 3

        elif res == "L":
            lost += 1
            vs[opp]["lost"] += 1
            cur_l += 1
            cur_w = 0
            worst_streak = max(worst_streak, cur_l)

            diff = theirs - mine

            if biggest_loss is None or diff > biggest_loss["diff"]:
                biggest_loss = {
                    "diff": diff,
                    "score": f"{mine}-{theirs}",
                    "opponent_id": opp,
                }

        else:
            drawn += 1
            vs[opp]["drawn"] += 1
            cur_w = 0
            cur_l = 0

            if m.get("competition_type") == "championship":
                championship_points += 1

    scoped_championships = [
        c for c in championships
        if not edition_id or c.get("edition_id") == edition_id
    ]

    scoped_cups = [
        c for c in cups
        if not edition_id or c.get("edition_id") == edition_id
    ]

    champ_count = sum(1 for c in scoped_championships if c.get("champion_id") == player_id)
    champ_runner_count = sum(1 for c in scoped_championships if c.get("runnerup_id") == player_id)

    cup_count = sum(1 for c in scoped_cups if c.get("champion_id") == player_id)
    cup_runner_count = sum(1 for c in scoped_cups if c.get("runnerup_id") == player_id)
    cup_third_count = sum(1 for c in scoped_cups if c.get("third_place_id") == player_id)

    win_pct = round((won / played) * 100, 1) if played else 0.0
    avg_goals = round(gf / played, 2) if played else 0.0

    return {
        "player_id": player_id,
        "edition_id": edition_id,
        "played": played,
        "won": won,
        "drawn": drawn,
        "lost": lost,
        "goals_for": gf,
        "goals_against": ga,
        "goal_diff": gf - ga,
        "win_pct": win_pct,
        "avg_goals_per_match": avg_goals,
        "championships": champ_count,
        "championships_runnerup": champ_runner_count,
        "cups": cup_count,
        "cups_runnerup": cup_runner_count,
        "cups_third": cup_third_count,
        "finals_played": champ_runner_count + champ_count + cup_count + cup_runner_count,
        "championship_points": championship_points,
        "best_win_streak": best_streak,
        "worst_loss_streak": worst_streak,
        "biggest_win": biggest_win,
        "biggest_loss": biggest_loss,
        "vs_rivals": dict(vs),
    }


@api_router.get("/players/{player_id}/profile")
async def player_profile(player_id: str):
    player = await db.players.find_one({"id": player_id}, PROJECTION)

    if not player:
        raise HTTPException(404, "Player not found")

    players = await db.players.find({}, PROJECTION).to_list(1000)
    players_compact = [
        {
            "id": p["id"],
            "name": p["name"],
            "nickname": p.get("nickname"),
            "favorite_team": p.get("favorite_team"),
        }
        for p in players
    ]
    editions = await db.editions.find({}, PROJECTION).sort("created_at", 1).to_list(1000)
    championships = await db.championships.find({}, PROJECTION).to_list(5000)
    cups = await db.cups.find({}, PROJECTION).to_list(5000)
    matches = await db.matches.find({}, PROJECTION).sort("date", 1).to_list(20000)

    comp_to_edition = _build_competition_edition_map(championships, cups)

    overall = _compute_player_stats_prefetched(
        player_id,
        matches,
        championships,
        cups,
        comp_to_edition,
    )

    by_edition = []

    for ed in editions:
        stats = _compute_player_stats_prefetched(
            player_id,
            matches,
            championships,
            cups,
            comp_to_edition,
            ed["id"],
        )

        by_edition.append({
            "edition": ed,
            "stats": stats,
        })

    champs_won = [
        c for c in championships
        if c.get("champion_id") == player_id
    ]

    champs_runner = [
        c for c in championships
        if c.get("runnerup_id") == player_id
    ]

    cups_won = [
        c for c in cups
        if c.get("champion_id") == player_id
    ]

    cups_runner = [
        c for c in cups
        if c.get("runnerup_id") == player_id
    ]

    badges = []

    overall_by_player: Dict[str, dict] = {}

    for p in players:
        overall_by_player[p["id"]] = _compute_player_stats_prefetched(
            p["id"],
            matches,
            championships,
            cups,
            comp_to_edition,
        )

    for ed in editions:
        edition_player_ids = _player_ids_in_edition(
            ed["id"],
            championships,
            cups,
            matches,
            comp_to_edition,
        )

        best_player_id = None
        best_score = None

        for pid in edition_player_ids:
            s = _compute_player_stats_prefetched(
                pid,
                matches,
                championships,
                cups,
                comp_to_edition,
                ed["id"],
            )

            score = (
                s["championships"] * 100
                + s["cups"] * 30
                + s["championship_points"]
                + s["goal_diff"]
            )

            if best_score is None or score > best_score:
                best_score = score
                best_player_id = pid

        if best_player_id == player_id:
            badges.append({
                "type": "fifa_champion",
                "label": f"Campeón {ed['name']}",
                "tier": "gold",
                "edition_id": ed["id"],
            })

    champ_wins_by_player: Dict[str, int] = defaultdict(int)

    for c in championships:
        if c.get("champion_id"):
            champ_wins_by_player[c["champion_id"]] += 1

    if champ_wins_by_player:
        top_champ_player = max(champ_wins_by_player, key=champ_wins_by_player.get)

        if champ_wins_by_player[top_champ_player] > 0 and top_champ_player == player_id:
            badges.append({
                "type": "king_of_championships",
                "label": "Rey de Campeonatos",
                "tier": "gold",
            })

    cup_wins_by_player: Dict[str, int] = defaultdict(int)

    for c in cups:
        if c.get("champion_id"):
            cup_wins_by_player[c["champion_id"]] += 1

    if cup_wins_by_player:
        top_cup_player = max(cup_wins_by_player, key=cup_wins_by_player.get)

        if cup_wins_by_player[top_cup_player] > 0 and top_cup_player == player_id:
            badges.append({
                "type": "king_of_cups",
                "label": "Rey de Copas",
                "tier": "gold",
            })

    top_gf_player = None
    top_gf = 0

    for pid, stats in overall_by_player.items():
        if stats["goals_for"] > top_gf:
            top_gf = stats["goals_for"]
            top_gf_player = pid

    if top_gf > 0 and top_gf_player == player_id:
        badges.append({
            "type": "top_scorer",
            "label": "Goleador Histórico",
            "tier": "gold",
        })

    best_def_player = None
    best_def_ratio = None

    for pid, stats in overall_by_player.items():
        if stats["played"] < 5:
            continue

        ratio = stats["goals_against"] / stats["played"]

        if best_def_ratio is None or ratio < best_def_ratio:
            best_def_ratio = ratio
            best_def_player = pid

    if best_def_player == player_id:
        badges.append({
            "type": "iron_wall",
            "label": "Muro Defensivo",
            "tier": "silver",
        })

    finals_lost_by_player: Dict[str, int] = defaultdict(int)

    for c in championships:
        if c.get("runnerup_id"):
            finals_lost_by_player[c["runnerup_id"]] += 1

    for c in cups:
        if c.get("runnerup_id"):
            finals_lost_by_player[c["runnerup_id"]] += 1

    if finals_lost_by_player:
        top_pecho = max(finals_lost_by_player, key=finals_lost_by_player.get)

        if finals_lost_by_player[top_pecho] >= 2 and top_pecho == player_id:
            badges.append({
                "type": "pecho_frio",
                "label": "Pecho Frío",
                "tier": "bronze",
            })

    return {
        "player": player,
        "players": players_compact,
        "overall": overall,
        "by_edition": by_edition,
        "championships_won": champs_won,
        "championships_runnerup": champs_runner,
        "cups_won": cups_won,
        "cups_runnerup": cups_runner,
        "badges": badges,
    }

# ====================== ROUTES: CHAMPIONSHIPS ======================
@api_router.get("/championships", response_model=List[Championship])
async def list_championships(edition_id: Optional[str] = None):
    q = {}
    if edition_id:
        q["edition_id"] = edition_id
    items = await db.championships.find(q, PROJECTION).sort("created_at", -1).to_list(1000)
    return [Championship(**i) for i in items]


def _shuffle_list(items: List[Any]) -> List[Any]:
    import random
    copied = list(items)
    random.shuffle(copied)
    return copied


def _generate_round_robin_pairs(player_ids: List[str], rounds: int = 1) -> List[dict]:
    import random

    ids = list(player_ids)
    random.shuffle(ids)

    if len(ids) < 2:
        return []

    has_bye = len(ids) % 2 == 1

    if has_bye:
        ids.append(None)

    n = len(ids)
    rounds_count = n - 1
    rotation = ids[:]
    fixtures: List[dict] = []

    for r in range(rounds_count):
        matches = []

        for i in range(n // 2):
            a = rotation[i]
            b = rotation[n - 1 - i]

            if a is None or b is None:
                continue

            if (r + i) % 2 == 0:
                home, away = a, b
            else:
                home, away = b, a

            matches.append({
                "round_name": f"Fecha {r + 1}",
                "player1_id": home,
                "player2_id": away,
            })

        fixtures.extend(matches)

        rotation = [rotation[0]] + [rotation[-1]] + rotation[1:-1]

    if rounds >= 2:
        second_leg = []

        for item in fixtures:
            fecha_number = int(item["round_name"].replace("Fecha ", ""))
            second_leg.append({
                "round_name": f"Fecha {fecha_number + rounds_count}",
                "player1_id": item["player2_id"],
                "player2_id": item["player1_id"],
            })

        fixtures.extend(second_leg)

    return fixtures


@api_router.post("/championships", response_model=Championship)
async def create_championship(body: ChampionshipCreate):
    participants = body.participants

    if len(participants) < 2:
        raise HTTPException(400, "El campeonato necesita al menos 2 participantes")

    c = Championship(
        edition_id=body.edition_id,
        name=body.name,
        participants=participants,
        rounds=body.rounds,
    )

    await db.championships.insert_one(c.dict())

    if body.generate_fixture:
        player_ids = [p.player_id for p in participants]
        team_map = {p.player_id: p.team_name for p in participants}

        fixtures = _generate_round_robin_pairs(
            player_ids,
            rounds=2 if body.rounds >= 2 else 1,
        )

        docs = []

        for fx in fixtures:
            p1 = fx["player1_id"]
            p2 = fx["player2_id"]

            m = Match(
                competition_id=c.id,
                competition_type="championship",
                round_name=fx["round_name"],
                player1_id=p1,
                player2_id=p2,
                team1=team_map.get(p1),
                team2=team_map.get(p2),
                goals1=0,
                goals2=0,
                played=False,
                winner_id=None,
            )

            docs.append(m.dict())

        if docs:
            await db.matches.insert_many(docs)

    return c


@api_router.get("/championships/{cid}")
async def get_championship(cid: str):
    c = await db.championships.find_one({"id": cid}, PROJECTION)
    if not c:
        raise HTTPException(404, "Not found")
    standings = await _compute_standings(c)
    matches = await db.matches.find(
        {"competition_id": cid, "competition_type": "championship"}, PROJECTION
    ).sort("date", 1).to_list(1000)

    top_scorer = None
    best_def = None
    biggest = None
    for row in standings:
        if top_scorer is None or row["goals_for"] > top_scorer["goals_for"]:
            top_scorer = row
        if best_def is None or row["goals_against"] < best_def["goals_against"]:
            best_def = row
    for m in matches:
        total = m["goals1"] + m["goals2"]
        diff = abs(m["goals1"] - m["goals2"])
        if biggest is None or diff > biggest["diff"]:
            biggest = {"match": m, "diff": diff, "total": total}

    return {
        "championship": c,
        "standings": standings,
        "matches": matches,
        "awards": {
            "mvp_id": standings[0]["player_id"] if standings else None,
            "top_scorer_id": top_scorer["player_id"] if top_scorer else None,
            "best_defense_id": best_def["player_id"] if best_def else None,
            "biggest_match": biggest,
        },
    }


@api_router.post("/championships/{cid}/finish")
async def finish_championship(cid: str):
    c = await db.championships.find_one({"id": cid}, PROJECTION)
    if not c:
        raise HTTPException(404, "Not found")
    standings = await _compute_standings(c)
    if not standings:
        raise HTTPException(400, "No matches yet")
    champion = standings[0]["player_id"]
    runnerup = standings[1]["player_id"] if len(standings) > 1 else None
    await db.championships.update_one(
        {"id": cid},
        {"$set": {"status": "finished", "champion_id": champion, "runnerup_id": runnerup}}
    )
    updated = await db.championships.find_one({"id": cid}, PROJECTION)
    return Championship(**updated)


@api_router.delete("/championships/{cid}")
async def delete_championship(cid: str):
    await db.championships.delete_one({"id": cid})
    await db.matches.delete_many({"competition_id": cid, "competition_type": "championship"})
    await db.goals.delete_many({"competition_id": cid, "competition_type": "championship"})
    return {"ok": True}


# ====================== ROUTES: MATCHES ======================
@api_router.post("/matches", response_model=Match)
async def create_match(body: MatchCreate):
    data = body.dict()

    if data.get("date") is None:
        data["date"] = now_iso()

    if not data.get("played", True):
        data["winner_id"] = None
        m = Match(**data)
        await db.matches.insert_one(m.dict())
        return m

    g1, g2 = data["goals1"], data["goals2"]

    if data.get("penalties") and data.get("pen_goals1") is not None and data.get("pen_goals2") is not None:
        if data["pen_goals1"] > data["pen_goals2"]:
            winner = data["player1_id"]
        elif data["pen_goals2"] > data["pen_goals1"]:
            winner = data["player2_id"]
        else:
            winner = None
    else:
        if g1 > g2:
            winner = data["player1_id"]
        elif g2 > g1:
            winner = data["player2_id"]
        else:
            winner = None

    m = Match(**data, winner_id=winner)

    await db.matches.insert_one(m.dict())

    return m


@api_router.put("/matches/{mid}", response_model=Match)
async def update_match(mid: str, body: MatchUpdate):
    existing = await db.matches.find_one({"id": mid}, PROJECTION)

    if not existing:
        raise HTTPException(404, "Match not found")

    updates = {
        k: v
        for k, v in body.dict().items()
        if v is not None
    }

    goals1 = updates.get("goals1", existing.get("goals1", 0))
    goals2 = updates.get("goals2", existing.get("goals2", 0))

    played = updates.get("played", existing.get("played", False))

    penalties = updates.get("penalties", existing.get("penalties", False))
    pen_goals1 = updates.get("pen_goals1", existing.get("pen_goals1"))
    pen_goals2 = updates.get("pen_goals2", existing.get("pen_goals2"))

    if not played:
        winner = None
    elif penalties and pen_goals1 is not None and pen_goals2 is not None:
        if pen_goals1 > pen_goals2:
            winner = existing["player1_id"]
        elif pen_goals2 > pen_goals1:
            winner = existing["player2_id"]
        else:
            winner = None
    else:
        if goals1 > goals2:
            winner = existing["player1_id"]
        elif goals2 > goals1:
            winner = existing["player2_id"]
        else:
            winner = None

    updates["goals1"] = goals1
    updates["goals2"] = goals2
    updates["played"] = played
    updates["winner_id"] = winner

    await db.matches.update_one(
        {"id": mid},
        {"$set": updates},
    )

    updated = await db.matches.find_one({"id": mid}, PROJECTION)

    return Match(**updated)


@api_router.get("/matches")
async def list_matches(competition_id: Optional[str] = None):
    q = {}
    if competition_id:
        q["competition_id"] = competition_id
    items = await db.matches.find(q, PROJECTION).sort("date", -1).to_list(5000)
    return items


# ====================== ROUTES: CUPS ======================
def _build_bracket(participants: List[str], fmt: str) -> Dict[str, Any]:
    slots = {"QF": 8, "SF": 4, "F": 2}[fmt]
    participants = participants[:slots]
    pairs = []
    i, j = 0, len(participants) - 1
    while i < j:
        pairs.append([participants[i], participants[j]])
        i += 1
        j -= 1
    rounds = []
    if fmt == "QF":
        rounds = [
            {"name": "Cuartos", "matches": [{"p1": p[0], "p2": p[1], "w": None, "score": None} for p in pairs]},
            {"name": "Semifinal", "matches": [{"p1": None, "p2": None, "w": None, "score": None} for _ in range(2)]},
            {"name": "Final", "matches": [{"p1": None, "p2": None, "w": None, "score": None}]},
            {"name": "Tercer Puesto", "matches": [{"p1": None, "p2": None, "w": None, "score": None}]},
        ]
    elif fmt == "SF":
        rounds = [
            {"name": "Semifinal", "matches": [{"p1": p[0], "p2": p[1], "w": None, "score": None} for p in pairs]},
            {"name": "Final", "matches": [{"p1": None, "p2": None, "w": None, "score": None}]},
            {"name": "Tercer Puesto", "matches": [{"p1": None, "p2": None, "w": None, "score": None}]},
        ]
    else:
        rounds = [
            {"name": "Final", "matches": [{"p1": pairs[0][0] if pairs else None, "p2": pairs[0][1] if pairs else None, "w": None, "score": None}]}
        ]
    return {"rounds": rounds}


@api_router.get("/cups", response_model=List[Cup])
async def list_cups(edition_id: Optional[str] = None):
    q = {}
    if edition_id:
        q["edition_id"] = edition_id
    items = await db.cups.find(q, PROJECTION).sort("created_at", -1).to_list(1000)
    return [Cup(**i) for i in items]


@api_router.post("/cups", response_model=Cup)
async def create_cup(body: CupCreate):
    bracket = _build_bracket(body.participants, body.format)
    c = Cup(**body.dict(), bracket=bracket)
    await db.cups.insert_one(c.dict())
    return c


@api_router.get("/cups/{cid}")
async def get_cup(cid: str):
    c = await db.cups.find_one({"id": cid}, PROJECTION)
    if not c:
        raise HTTPException(404, "Not found")
    matches = await db.matches.find(
        {"competition_id": cid, "competition_type": "cup"}, PROJECTION
    ).sort("date", 1).to_list(1000)
    return {"cup": c, "matches": matches}


class CupMatchInput(BaseModel):
    round_index: int
    match_index: int
    player1_id: str
    player2_id: str
    team1: Optional[str] = None
    team2: Optional[str] = None
    goals1: int
    goals2: int
    extra_time: bool = False
    penalties: bool = False
    pen_goals1: Optional[int] = None
    pen_goals2: Optional[int] = None


@api_router.post("/cups/{cid}/match")
async def register_cup_match(cid: str, body: CupMatchInput):
    c = await db.cups.find_one({"id": cid}, PROJECTION)
    if not c:
        raise HTTPException(404, "Cup not found")

    mc = MatchCreate(
        competition_id=cid,
        competition_type="cup",
        round_name=c["bracket"]["rounds"][body.round_index]["name"],
        player1_id=body.player1_id,
        player2_id=body.player2_id,
        team1=body.team1,
        team2=body.team2,
        goals1=body.goals1,
        goals2=body.goals2,
        extra_time=body.extra_time,
        penalties=body.penalties,
        pen_goals1=body.pen_goals1,
        pen_goals2=body.pen_goals2,
    )
    await create_match(mc)

    g1, g2 = body.goals1, body.goals2
    if body.penalties and body.pen_goals1 is not None and body.pen_goals2 is not None:
        winner = body.player1_id if body.pen_goals1 > body.pen_goals2 else body.player2_id
        loser = body.player2_id if winner == body.player1_id else body.player1_id
    else:
        if g1 > g2:
            winner, loser = body.player1_id, body.player2_id
        elif g2 > g1:
            winner, loser = body.player2_id, body.player1_id
        else:
            raise HTTPException(400, "En copas debe haber un ganador. Usá penales si quedó empatado.")

    bracket = c["bracket"]
    score_str = f"{g1}-{g2}"
    if body.penalties and body.pen_goals1 is not None:
        score_str += f" (p {body.pen_goals1}-{body.pen_goals2})"
    round_obj = bracket["rounds"][body.round_index]
    round_obj["matches"][body.match_index]["w"] = winner
    round_obj["matches"][body.match_index]["l"] = loser
    round_obj["matches"][body.match_index]["score"] = score_str
    round_obj["matches"][body.match_index]["p1"] = body.player1_id
    round_obj["matches"][body.match_index]["p2"] = body.player2_id

    rounds = bracket["rounds"]
    cur_name = round_obj["name"]

    def next_regular_round_idx(ri: int) -> Optional[int]:
        for k in range(ri + 1, len(rounds)):
            if rounds[k]["name"] != "Tercer Puesto":
                return k
        return None

    if cur_name != "Tercer Puesto":
        nxt_idx = next_regular_round_idx(body.round_index)
        if nxt_idx is not None:
            next_round = rounds[nxt_idx]
            slot = body.match_index // 2
            if slot < len(next_round["matches"]):
                m = next_round["matches"][slot]
                if body.match_index % 2 == 0:
                    m["p1"] = winner
                else:
                    m["p2"] = winner

        if cur_name == "Semifinal":
            tp_idx = None
            for k, rr in enumerate(rounds):
                if rr["name"] == "Tercer Puesto":
                    tp_idx = k
                    break
            if tp_idx is not None:
                tp_match = rounds[tp_idx]["matches"][0]
                if body.match_index == 0:
                    tp_match["p1"] = loser
                else:
                    tp_match["p2"] = loser

    update_fields = {"bracket": bracket}
    if cur_name == "Final":
        update_fields["champion_id"] = winner
        update_fields["runnerup_id"] = loser
        tp_played = any(
            rr["name"] == "Tercer Puesto" and rr["matches"][0].get("w")
            for rr in rounds
        )
        tp_exists = any(rr["name"] == "Tercer Puesto" for rr in rounds)
        if not tp_exists or tp_played:
            update_fields["status"] = "finished"
    if cur_name == "Tercer Puesto":
        update_fields["third_place_id"] = winner
        final_played = any(
            rr["name"] == "Final" and rr["matches"][0].get("w")
            for rr in rounds
        )
        if final_played:
            update_fields["status"] = "finished"

    await db.cups.update_one({"id": cid}, {"$set": update_fields})
    updated = await db.cups.find_one({"id": cid}, PROJECTION)
    return updated


@api_router.delete("/cups/{cid}")
async def delete_cup(cid: str):
    await db.cups.delete_one({"id": cid})
    await db.matches.delete_many({"competition_id": cid, "competition_type": "cup"})
    await db.goals.delete_many({"competition_id": cid, "competition_type": "cup"})
    return {"ok": True}


# ====================== ROUTES: RANKINGS / HISTORY ======================
@api_router.get("/rankings")
async def rankings(edition_id: Optional[str] = None):
    players = await db.players.find({}, PROJECTION).to_list(1000)

    stats_list = await asyncio.gather(
        *[_compute_player_stats(p["id"], edition_id) for p in players]
    )

    rows = []

    for p, s in zip(players, stats_list):
        s["player"] = p
        rows.append(s)

    general = sorted(rows, key=lambda x: (-x["championships"], -x["cups"], -x["championship_points"], -x["goal_diff"]))
    offensive = sorted(rows, key=lambda x: (-x["goals_for"], -x["avg_goals_per_match"]))
    defensive = sorted([r for r in rows if r["played"] > 0], key=lambda x: (x["goals_against"] / max(x["played"], 1),))
    effective = sorted([r for r in rows if r["played"] >= 3], key=lambda x: -x["win_pct"])

    return {
        "general": general,
        "offensive": offensive,
        "defensive": defensive,
        "effective": effective,
    }


@api_router.get("/head2head/{p1}/{p2}")
async def head_to_head(p1: str, p2: str):
    q = {
        "$or": [
            {"player1_id": p1, "player2_id": p2},
            {"player1_id": p2, "player2_id": p1},
        ]
    }
    matches = await db.matches.find(q, PROJECTION).sort("date", -1).to_list(1000)
    w1 = w2 = draws = 0
    g1 = g2 = 0
    for m in matches:
        if m["player1_id"] == p1:
            mine, theirs = m["goals1"], m["goals2"]
        else:
            mine, theirs = m["goals2"], m["goals1"]
        g1 += mine
        g2 += theirs
        res = _match_result_for(p1, m)
        if res == "W":
            w1 += 1
        elif res == "L":
            w2 += 1
        else:
            draws += 1
    return {
        "player1_id": p1,
        "player2_id": p2,
        "total": len(matches),
        "p1_wins": w1,
        "p2_wins": w2,
        "draws": draws,
        "p1_goals": g1,
        "p2_goals": g2,
        "matches": matches,
    }


@api_router.get("/dashboard")
async def dashboard():
    editions = await db.editions.find({}, PROJECTION).sort("created_at", 1).to_list(1000)
    players = await db.players.find({}, PROJECTION).to_list(1000)
    total_champs = await db.championships.count_documents({})
    total_cups = await db.cups.count_documents({})
    total_matches = await db.matches.count_documents({})
    recent_champs = await db.championships.find({"status": "finished"}, PROJECTION).sort("created_at", -1).limit(5).to_list(5)
    recent_cups = await db.cups.find({"status": "finished"}, PROJECTION).sort("created_at", -1).limit(5).to_list(5)
    ranks = await rankings()
    return {
        "editions_count": len(editions),
        "players_count": len(players),
        "championships_count": total_champs,
        "cups_count": total_cups,
        "matches_count": total_matches,
        "recent_champions": recent_champs,
        "recent_cups": recent_cups,
        "top_ranking": ranks["general"][:5],
        "editions": editions,
    }


@api_router.get("/history")
async def history():
    editions = await db.editions.find({}, PROJECTION).sort("created_at", 1).to_list(1000)
    all_champs = await db.championships.find({}, PROJECTION).sort("created_at", -1).to_list(1000)
    all_cups = await db.cups.find({}, PROJECTION).sort("created_at", -1).to_list(1000)
    players = await db.players.find({}, PROJECTION).to_list(1000)

    all_matches = await db.matches.find({}, PROJECTION).to_list(5000)
    record_goleada = None
    record_partido = None
    for m in all_matches:
        total = m["goals1"] + m["goals2"]
        diff = abs(m["goals1"] - m["goals2"])
        if record_goleada is None or diff > record_goleada["diff"]:
            record_goleada = {"match": m, "diff": diff}
        if record_partido is None or total > record_partido["total"]:
            record_partido = {"match": m, "total": total}

    return {
        "editions": editions,
        "championships": all_champs,
        "cups": all_cups,
        "players": players,
        "records": {
            "biggest_win": record_goleada,
            "highest_scoring": record_partido,
        },
    }


# ====================== SEED ======================
@api_router.post("/seed")
async def seed_demo(reset: bool = True):
    if reset:
        await db.editions.delete_many({})
        await db.players.delete_many({})
        await db.championships.delete_many({})
        await db.cups.delete_many({})
        await db.matches.delete_many({})
        await db.goals.delete_many({})

    players_data = [
        {"name": "Franco", "favorite_team": "Real Madrid"},
        {"name": "Tute", "favorite_team": "Boca Juniors"},
        {"name": "Tocruz", "favorite_team": "Manchester City"},
        {"name": "Rath", "favorite_team": "Liverpool"},
    ]
    players = []
    for pd in players_data:
        p = Player(**pd)
        await db.players.insert_one(p.dict())
        players.append(p)

    p_by_name = {p.name: p for p in players}

    fc25 = Edition(name="FC 25", year=2024)
    fc26 = Edition(name="FC 26", year=2025)
    await db.editions.insert_one(fc25.dict())
    await db.editions.insert_one(fc26.dict())

    teams = ["Real Madrid", "Barcelona", "Manchester City", "Liverpool", "Bayern Munich", "PSG", "Inter", "Arsenal"]

    import random
    random.seed(42)

    async def create_quick_championship(edition: Edition, name: str, winner_name: str, rounds: int = 1):
        parts = [ChampionshipParticipant(player_id=p.id, team_name=random.choice(teams)) for p in players]
        c = Championship(edition_id=edition.id, name=name, participants=parts, rounds=rounds)
        await db.championships.insert_one(c.dict())

        player_list = [p.id for p in players]
        for r in range(rounds):
            for i in range(len(player_list)):
                for j in range(i + 1, len(player_list)):
                    p1, p2 = player_list[i], player_list[j]
                    p1_name = next(p.name for p in players if p.id == p1)
                    p2_name = next(p.name for p in players if p.id == p2)
                    base1 = random.randint(0, 4)
                    base2 = random.randint(0, 4)
                    if p1_name == winner_name:
                        base1 = random.randint(2, 5)
                        base2 = random.randint(0, 2)
                    elif p2_name == winner_name:
                        base2 = random.randint(2, 5)
                        base1 = random.randint(0, 2)
                    m = Match(
                        competition_id=c.id,
                        competition_type="championship",
                        round_name=f"Fecha {r+1}",
                        player1_id=p1, player2_id=p2,
                        team1=random.choice(teams), team2=random.choice(teams),
                        goals1=base1, goals2=base2,
                    )
                    if base1 > base2:
                        m.winner_id = p1
                    elif base2 > base1:
                        m.winner_id = p2
                    await db.matches.insert_one(m.dict())

        standings = await _compute_standings(c.dict())
        champion = standings[0]["player_id"]
        runnerup = standings[1]["player_id"]
        await db.championships.update_one({"id": c.id}, {"$set": {"status": "finished", "champion_id": champion, "runnerup_id": runnerup}})

    fc25_winners = ["Tute"] * 3 + ["Tocruz"] * 2 + ["Franco"] * 2 + ["Rath"] * 1
    for idx, w in enumerate(fc25_winners):
        await create_quick_championship(fc25, f"Liga FC25 #{idx+1}", w, rounds=1)

    fc26_winners = ["Franco"] * 3 + ["Tute"] * 2 + ["Tocruz"] * 2 + ["Rath"] * 1
    for idx, w in enumerate(fc26_winners):
        await create_quick_championship(fc26, f"Liga FC26 #{idx+1}", w, rounds=1)

    async def create_quick_cup(edition: Edition, name: str, champion_name: str, runnerup_name: str):
        pids = [p.id for p in players]
        random.shuffle(pids)
        c = Cup(edition_id=edition.id, name=name, participants=pids, format="SF")
        c.bracket = _build_bracket(pids, "SF")
        await db.cups.insert_one(c.dict())

        champ_id = p_by_name[champion_name].id
        runner_id = p_by_name[runnerup_name].id
        others = [pid for pid in pids if pid not in (champ_id, runner_id)]

        sf_matches = [(champ_id, others[0]), (runner_id, others[1])]
        for i, (a, b) in enumerate(sf_matches):
            g1, g2 = random.randint(2, 4), random.randint(0, 1)
            m = Match(
                competition_id=c.id, competition_type="cup", round_name="Semifinal",
                player1_id=a, player2_id=b,
                team1=random.choice(teams), team2=random.choice(teams),
                goals1=g1, goals2=g2, winner_id=a,
            )
            await db.matches.insert_one(m.dict())
            c.bracket["rounds"][0]["matches"][i] = {"p1": a, "p2": b, "w": a, "l": b, "score": f"{g1}-{g2}"}

        fg1, fg2 = random.randint(1, 3), random.randint(0, 2)
        if fg1 <= fg2:
            fg1 = fg2 + 1
        fm = Match(
            competition_id=c.id, competition_type="cup", round_name="Final",
            player1_id=champ_id, player2_id=runner_id,
            team1=random.choice(teams), team2=random.choice(teams),
            goals1=fg1, goals2=fg2, winner_id=champ_id,
        )
        await db.matches.insert_one(fm.dict())
        c.bracket["rounds"][1]["matches"][0] = {"p1": champ_id, "p2": runner_id, "w": champ_id, "l": runner_id, "score": f"{fg1}-{fg2}"}

        tg1, tg2 = random.randint(0, 3), random.randint(0, 3)
        if tg1 == tg2:
            tg1 += 1
        third = others[0] if tg1 > tg2 else others[1]
        tm = Match(
            competition_id=c.id, competition_type="cup", round_name="Tercer Puesto",
            player1_id=others[0], player2_id=others[1],
            team1=random.choice(teams), team2=random.choice(teams),
            goals1=tg1, goals2=tg2, winner_id=third,
        )
        await db.matches.insert_one(tm.dict())
        c.bracket["rounds"][2]["matches"][0] = {"p1": others[0], "p2": others[1], "w": third, "l": others[1] if third == others[0] else others[0], "score": f"{tg1}-{tg2}"}

        await db.cups.update_one(
            {"id": c.id},
            {"$set": {
                "status": "finished",
                "champion_id": champ_id,
                "runnerup_id": runner_id,
                "third_place_id": third,
                "bracket": c.bracket,
            }}
        )

    return {"ok": True, "message": "Demo data seeded"}


# ====================== APP SETUP ======================
app.include_router(api_router)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()