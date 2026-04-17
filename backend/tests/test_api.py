"""
Comprehensive backend API tests for FIFA Tournament Tracker
Tests: seed, dashboard, editions, players, championships, cups, matches, rankings, head2head, history
"""
import pytest
import requests
import os
from pathlib import Path

# Read BASE_URL from frontend .env
env_path = Path(__file__).parent.parent.parent / 'frontend' / '.env'
BASE_URL = ''
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().strip('"')
                break

if not BASE_URL:
    raise ValueError("EXPO_PUBLIC_BACKEND_URL not found in frontend/.env")

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="session")
def seeded_data():
    """Seed demo data once for all tests"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(f"{BASE_URL}/api/seed")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    return data

class TestSeedAndDashboard:
    """Test seed endpoint and dashboard"""
    
    def test_seed_endpoint(self, api_client):
        """POST /api/seed should reset and load demo data"""
        response = api_client.post(f"{BASE_URL}/api/seed")
        assert response.status_code == 200
        data = response.json()
        assert "ok" in data
        assert data["ok"] is True
        
    def test_dashboard_returns_correct_counts(self, api_client, seeded_data):
        """GET /api/dashboard should return correct counts"""
        response = api_client.get(f"{BASE_URL}/api/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "players_count" in data
        assert "editions_count" in data
        assert "championships_count" in data
        assert "cups_count" in data
        assert "matches_count" in data
        assert "top_ranking" in data
        assert "editions" in data
        
        # Verify expected counts from seed
        assert data["players_count"] == 4
        assert data["editions_count"] == 2
        assert data["championships_count"] == 16
        assert data["cups_count"] == 8
        assert data["matches_count"] == 128
        
        # Verify top_ranking has 5 players max
        assert len(data["top_ranking"]) <= 5
        
        # Verify each ranking entry has required fields
        if data["top_ranking"]:
            rank = data["top_ranking"][0]
            assert "player_id" in rank
            assert "championships" in rank
            assert "cups" in rank
            assert "championship_points" in rank

class TestEditions:
    """Test edition CRUD operations"""
    
    def test_list_editions(self, api_client, seeded_data):
        """GET /api/editions should return FC 25 and FC 26"""
        response = api_client.get(f"{BASE_URL}/api/editions")
        assert response.status_code == 200
        editions = response.json()
        assert len(editions) == 2
        
        names = [e["name"] for e in editions]
        assert "FC 25" in names
        assert "FC 26" in names
        
        # Verify structure
        for ed in editions:
            assert "id" in ed
            assert "name" in ed
            assert "is_active" in ed
            assert "created_at" in ed
    
    def test_create_edition(self, api_client):
        """POST /api/editions should create new edition"""
        response = api_client.post(f"{BASE_URL}/api/editions", json={
            "name": "TEST_FC 27",
            "year": 2026
        })
        assert response.status_code == 200
        edition = response.json()
        assert edition["name"] == "TEST_FC 27"
        assert edition["year"] == 2026
        assert "id" in edition
        
        # Verify it appears in list
        list_response = api_client.get(f"{BASE_URL}/api/editions")
        editions = list_response.json()
        assert any(e["name"] == "TEST_FC 27" for e in editions)
    
    def test_edition_summary(self, api_client, seeded_data):
        """GET /api/editions/{id}/summary should return ranking and champions"""
        # Get FC 25 edition
        editions_response = api_client.get(f"{BASE_URL}/api/editions")
        editions = editions_response.json()
        fc25 = next(e for e in editions if e["name"] == "FC 25")
        
        response = api_client.get(f"{BASE_URL}/api/editions/{fc25['id']}/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "edition" in data
        assert "championships_count" in data
        assert "cups_count" in data
        assert "ranking" in data
        assert "best_player_id" in data
        
        # Verify ranking is sorted by championships
        if len(data["ranking"]) > 1:
            for i in range(len(data["ranking"]) - 1):
                assert data["ranking"][i]["championships"] >= data["ranking"][i+1]["championships"]
    
    def test_delete_edition(self, api_client):
        """DELETE /api/editions/{id} should remove edition"""
        # Create test edition
        create_response = api_client.post(f"{BASE_URL}/api/editions", json={
            "name": "TEST_DELETE_EDITION"
        })
        edition = create_response.json()
        
        # Delete it
        delete_response = api_client.delete(f"{BASE_URL}/api/editions/{edition['id']}")
        assert delete_response.status_code == 200
        
        # Verify it's gone
        list_response = api_client.get(f"{BASE_URL}/api/editions")
        editions = list_response.json()
        assert not any(e["name"] == "TEST_DELETE_EDITION" for e in editions)

class TestPlayers:
    """Test player CRUD operations"""
    
    def test_list_players(self, api_client, seeded_data):
        """GET /api/players should return 4 players"""
        response = api_client.get(f"{BASE_URL}/api/players")
        assert response.status_code == 200
        players = response.json()
        assert len(players) == 4
        
        names = [p["name"] for p in players]
        assert "Franco" in names
        assert "Tute" in names
        assert "Tocruz" in names
        assert "Rath" in names
    
    def test_create_player(self, api_client):
        """POST /api/players should create new player"""
        response = api_client.post(f"{BASE_URL}/api/players", json={
            "name": "TEST_NewPlayer",
            "favorite_team": "Arsenal"
        })
        assert response.status_code == 200
        player = response.json()
        assert player["name"] == "TEST_NewPlayer"
        assert player["favorite_team"] == "Arsenal"
        assert "id" in player
        
        # Verify persistence with GET
        get_response = api_client.get(f"{BASE_URL}/api/players/{player['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == "TEST_NewPlayer"
    
    def test_player_profile(self, api_client, seeded_data):
        """GET /api/players/{id}/profile should return stats and badges"""
        # Get Franco
        players_response = api_client.get(f"{BASE_URL}/api/players")
        players = players_response.json()
        franco = next(p for p in players if p["name"] == "Franco")
        
        response = api_client.get(f"{BASE_URL}/api/players/{franco['id']}/profile")
        assert response.status_code == 200
        data = response.json()
        
        assert "player" in data
        assert "overall" in data
        assert "by_edition" in data
        assert "badges" in data
        assert "championships_won" in data
        assert "cups_won" in data
        
        # Verify overall stats structure
        overall = data["overall"]
        assert "played" in overall
        assert "won" in overall
        assert "goals_for" in overall
        assert "championships" in overall
        assert "cups" in overall
    
    def test_update_player(self, api_client):
        """PUT /api/players/{id} should update player"""
        # Create test player
        create_response = api_client.post(f"{BASE_URL}/api/players", json={
            "name": "TEST_UpdatePlayer"
        })
        player = create_response.json()
        
        # Update it
        update_response = api_client.put(f"{BASE_URL}/api/players/{player['id']}", json={
            "favorite_team": "Chelsea"
        })
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["favorite_team"] == "Chelsea"
        
        # Verify with GET
        get_response = api_client.get(f"{BASE_URL}/api/players/{player['id']}")
        fetched = get_response.json()
        assert fetched["favorite_team"] == "Chelsea"
    
    def test_delete_player(self, api_client):
        """DELETE /api/players/{id} should remove player"""
        # Create test player
        create_response = api_client.post(f"{BASE_URL}/api/players", json={
            "name": "TEST_DeletePlayer"
        })
        player = create_response.json()
        
        # Delete it
        delete_response = api_client.delete(f"{BASE_URL}/api/players/{player['id']}")
        assert delete_response.status_code == 200
        
        # Verify 404 on GET
        get_response = api_client.get(f"{BASE_URL}/api/players/{player['id']}")
        assert get_response.status_code == 404

class TestChampionships:
    """Test championship operations"""
    
    def test_list_championships(self, api_client, seeded_data):
        """GET /api/championships should return 16 championships"""
        response = api_client.get(f"{BASE_URL}/api/championships")
        assert response.status_code == 200
        champs = response.json()
        assert len(champs) == 16
    
    def test_create_championship(self, api_client, seeded_data):
        """POST /api/championships should create championship"""
        # Get edition and players
        editions = api_client.get(f"{BASE_URL}/api/editions").json()
        players = api_client.get(f"{BASE_URL}/api/players").json()
        
        response = api_client.post(f"{BASE_URL}/api/championships", json={
            "edition_id": editions[0]["id"],
            "name": "TEST_Championship",
            "participants": [
                {"player_id": players[0]["id"], "team_name": "Real Madrid"},
                {"player_id": players[1]["id"], "team_name": "Barcelona"}
            ],
            "rounds": 2
        })
        assert response.status_code == 200
        champ = response.json()
        assert champ["name"] == "TEST_Championship"
        assert champ["status"] == "ongoing"
        assert len(champ["participants"]) == 2
        
        # Verify with GET
        get_response = api_client.get(f"{BASE_URL}/api/championships/{champ['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["championship"]["name"] == "TEST_Championship"
    
    def test_championship_detail_with_standings(self, api_client, seeded_data):
        """GET /api/championships/{id} should return standings and matches"""
        # Get first championship
        champs = api_client.get(f"{BASE_URL}/api/championships").json()
        champ_id = champs[0]["id"]
        
        response = api_client.get(f"{BASE_URL}/api/championships/{champ_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert "championship" in data
        assert "standings" in data
        assert "matches" in data
        assert "awards" in data
        
        # Verify standings are sorted by points
        standings = data["standings"]
        if len(standings) > 1:
            for i in range(len(standings) - 1):
                assert standings[i]["points"] >= standings[i+1]["points"]
    
    def test_add_match_and_finish_championship(self, api_client, seeded_data):
        """POST /api/matches and POST /api/championships/{id}/finish"""
        # Create new championship
        editions = api_client.get(f"{BASE_URL}/api/editions").json()
        players = api_client.get(f"{BASE_URL}/api/players").json()
        
        champ_response = api_client.post(f"{BASE_URL}/api/championships", json={
            "edition_id": editions[0]["id"],
            "name": "TEST_FinishChamp",
            "participants": [
                {"player_id": players[0]["id"], "team_name": "Team A"},
                {"player_id": players[1]["id"], "team_name": "Team B"}
            ],
            "rounds": 1
        })
        champ = champ_response.json()
        
        # Add match
        match_response = api_client.post(f"{BASE_URL}/api/matches", json={
            "competition_id": champ["id"],
            "competition_type": "championship",
            "round_name": "Fecha 1",
            "player1_id": players[0]["id"],
            "player2_id": players[1]["id"],
            "goals1": 3,
            "goals2": 1
        })
        assert match_response.status_code == 200
        
        # Verify standings updated
        detail_response = api_client.get(f"{BASE_URL}/api/championships/{champ['id']}")
        standings = detail_response.json()["standings"]
        assert standings[0]["points"] == 3  # Winner has 3 points
        
        # Finish championship
        finish_response = api_client.post(f"{BASE_URL}/api/championships/{champ['id']}/finish")
        assert finish_response.status_code == 200
        finished = finish_response.json()
        assert finished["status"] == "finished"
        assert finished["champion_id"] == players[0]["id"]
    
    def test_delete_championship(self, api_client, seeded_data):
        """DELETE /api/championships/{id} should remove championship and matches"""
        # Create test championship
        editions = api_client.get(f"{BASE_URL}/api/editions").json()
        players = api_client.get(f"{BASE_URL}/api/players").json()
        
        champ_response = api_client.post(f"{BASE_URL}/api/championships", json={
            "edition_id": editions[0]["id"],
            "name": "TEST_DeleteChamp",
            "participants": [{"player_id": players[0]["id"]}],
            "rounds": 1
        })
        champ = champ_response.json()
        
        # Delete it
        delete_response = api_client.delete(f"{BASE_URL}/api/championships/{champ['id']}")
        assert delete_response.status_code == 200
        
        # Verify 404 on GET
        get_response = api_client.get(f"{BASE_URL}/api/championships/{champ['id']}")
        assert get_response.status_code == 404

class TestCups:
    """Test cup operations"""
    
    def test_list_cups(self, api_client, seeded_data):
        """GET /api/cups should return 8 cups"""
        response = api_client.get(f"{BASE_URL}/api/cups")
        assert response.status_code == 200
        cups = response.json()
        assert len(cups) == 8
    
    def test_create_cup_sf_format(self, api_client, seeded_data):
        """POST /api/cups should create cup with SF bracket"""
        editions = api_client.get(f"{BASE_URL}/api/editions").json()
        players = api_client.get(f"{BASE_URL}/api/players").json()
        
        response = api_client.post(f"{BASE_URL}/api/cups", json={
            "edition_id": editions[0]["id"],
            "name": "TEST_Cup",
            "participants": [p["id"] for p in players],
            "format": "SF"
        })
        assert response.status_code == 200
        cup = response.json()
        assert cup["name"] == "TEST_Cup"
        assert cup["format"] == "SF"
        assert cup["status"] == "ongoing"
        
        # Verify bracket structure
        bracket = cup["bracket"]
        assert "rounds" in bracket
        rounds = bracket["rounds"]
        assert len(rounds) == 3  # Semifinal, Final, Tercer Puesto
        assert rounds[0]["name"] == "Semifinal"
        assert rounds[1]["name"] == "Final"
        assert rounds[2]["name"] == "Tercer Puesto"
    
    def test_cup_match_advances_winner(self, api_client, seeded_data):
        """POST /api/cups/{id}/match should advance winner to next round"""
        # Create cup
        editions = api_client.get(f"{BASE_URL}/api/editions").json()
        players = api_client.get(f"{BASE_URL}/api/players").json()
        
        cup_response = api_client.post(f"{BASE_URL}/api/cups", json={
            "edition_id": editions[0]["id"],
            "name": "TEST_CupAdvance",
            "participants": [p["id"] for p in players],
            "format": "SF"
        })
        cup = cup_response.json()
        
        # Play first semifinal
        match_response = api_client.post(f"{BASE_URL}/api/cups/{cup['id']}/match", json={
            "round_index": 0,
            "match_index": 0,
            "player1_id": players[0]["id"],
            "player2_id": players[1]["id"],
            "goals1": 3,
            "goals2": 1
        })
        assert match_response.status_code == 200
        updated_cup = match_response.json()
        
        # Verify winner advanced to Final
        final_match = updated_cup["bracket"]["rounds"][1]["matches"][0]
        assert final_match["p1"] == players[0]["id"]
        
        # Verify loser sent to Tercer Puesto
        third_match = updated_cup["bracket"]["rounds"][2]["matches"][0]
        assert third_match["p1"] == players[1]["id"]
    
    def test_delete_cup(self, api_client, seeded_data):
        """DELETE /api/cups/{id} should remove cup and matches"""
        editions = api_client.get(f"{BASE_URL}/api/editions").json()
        players = api_client.get(f"{BASE_URL}/api/players").json()
        
        cup_response = api_client.post(f"{BASE_URL}/api/cups", json={
            "edition_id": editions[0]["id"],
            "name": "TEST_DeleteCup",
            "participants": [p["id"] for p in players[:2]],
            "format": "F"
        })
        cup = cup_response.json()
        
        delete_response = api_client.delete(f"{BASE_URL}/api/cups/{cup['id']}")
        assert delete_response.status_code == 200
        
        get_response = api_client.get(f"{BASE_URL}/api/cups/{cup['id']}")
        assert get_response.status_code == 404

class TestRankingsAndHistory:
    """Test rankings and history endpoints"""
    
    def test_rankings_general(self, api_client, seeded_data):
        """GET /api/rankings should return sorted rankings"""
        response = api_client.get(f"{BASE_URL}/api/rankings")
        assert response.status_code == 200
        data = response.json()
        
        assert "general" in data
        assert "offensive" in data
        assert "defensive" in data
        assert "effective" in data
        
        # Verify general ranking sorted by championships
        general = data["general"]
        if len(general) > 1:
            for i in range(len(general) - 1):
                assert general[i]["championships"] >= general[i+1]["championships"]
    
    def test_rankings_by_edition(self, api_client, seeded_data):
        """GET /api/rankings?edition_id=... should filter by edition"""
        editions = api_client.get(f"{BASE_URL}/api/editions").json()
        fc25 = next(e for e in editions if e["name"] == "FC 25")
        
        response = api_client.get(f"{BASE_URL}/api/rankings?edition_id={fc25['id']}")
        assert response.status_code == 200
        data = response.json()
        assert "general" in data
    
    def test_head2head(self, api_client, seeded_data):
        """GET /api/head2head/{p1}/{p2} should return rivalry stats"""
        players = api_client.get(f"{BASE_URL}/api/players").json()
        p1, p2 = players[0], players[1]
        
        response = api_client.get(f"{BASE_URL}/api/head2head/{p1['id']}/{p2['id']}")
        assert response.status_code == 200
        data = response.json()
        
        assert "player1_id" in data
        assert "player2_id" in data
        assert "total" in data
        assert "p1_wins" in data
        assert "p2_wins" in data
        assert "draws" in data
        assert "p1_goals" in data
        assert "p2_goals" in data
        assert "matches" in data
    
    def test_history(self, api_client, seeded_data):
        """GET /api/history should return all historical data"""
        response = api_client.get(f"{BASE_URL}/api/history")
        assert response.status_code == 200
        data = response.json()
        
        assert "editions" in data
        assert "championships" in data
        assert "cups" in data
        assert "players" in data
        assert "records" in data
        
        # Verify records structure
        records = data["records"]
        assert "biggest_win" in records
        assert "highest_scoring" in records
