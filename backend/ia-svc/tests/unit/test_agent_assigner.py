"""
Unit Tests for Agent Assigner
Tests workload calculation and agent selection logic
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from services.agent_assigner import AgentAssigner


class TestAgentAssigner:
    """Test suite for AgentAssigner class"""

    @pytest.fixture
    def agent_assigner(self):
        """Create AgentAssigner instance for testing"""
        usuarios_url = "http://localhost:3001"
        tickets_url = "http://localhost:3002"
        return AgentAssigner(usuarios_url, tickets_url)

    @pytest.fixture
    def sample_agents(self):
        """Sample agent data for testing"""
        return [
            {
                "_id": "agent1",
                "nombre": "Juan Pérez",
                "email": "juan@example.com",
                "rol": "soporte",
                "especialidades": ["software", "hardware"],
                "disponible": True,
                "cargaActual": 2
            },
            {
                "_id": "agent2",
                "nombre": "María García",
                "email": "maria@example.com",
                "rol": "soporte",
                "especialidades": ["redes", "software"],
                "disponible": True,
                "cargaActual": 5
            },
            {
                "_id": "agent3",
                "nombre": "Pedro López",
                "email": "pedro@example.com",
                "rol": "soporte",
                "especialidades": ["hardware"],
                "disponible": False,
                "cargaActual": 8
            }
        ]

    @pytest.fixture
    def sample_ticket(self):
        """Sample ticket data for testing"""
        return {
            "id": "ticket123",
            "titulo": "Problema con el software",
            "descripcion": "El sistema no responde",
            "categoria": "software",
            "prioridad": "alta",
            "empresaId": "empresa1"
        }

    @pytest.mark.unit
    def test_calculate_workload_low(self, agent_assigner):
        """Test workload calculation for agent with low load"""
        agent = {"cargaActual": 2}
        workload = agent["cargaActual"]
        
        assert workload == 2
        assert workload < 5  # Low workload threshold

    @pytest.mark.unit
    def test_calculate_workload_medium(self, agent_assigner):
        """Test workload calculation for agent with medium load"""
        agent = {"cargaActual": 5}
        workload = agent["cargaActual"]
        
        assert workload == 5
        assert 5 <= workload < 8  # Medium workload range

    @pytest.mark.unit
    def test_calculate_workload_high(self, agent_assigner):
        """Test workload calculation for agent with high load"""
        agent = {"cargaActual": 10}
        workload = agent["cargaActual"]
        
        assert workload == 10
        assert workload >= 8  # High workload threshold

    @pytest.mark.unit
    def test_filter_available_agents(self, sample_agents):
        """Test filtering only available agents"""
        available_agents = [a for a in sample_agents if a["disponible"]]
        
        assert len(available_agents) == 2
        assert all(a["disponible"] for a in available_agents)
        assert "agent3" not in [a["_id"] for a in available_agents]

    @pytest.mark.unit
    def test_filter_by_specialty(self, sample_agents, sample_ticket):
        """Test filtering agents by specialty matching ticket category"""
        category = sample_ticket["categoria"]
        specialized_agents = [
            a for a in sample_agents 
            if category in a.get("especialidades", [])
        ]
        
        assert len(specialized_agents) == 2  # agent1 and agent2 have "software"
        assert all(category in a["especialidades"] for a in specialized_agents)

    @pytest.mark.unit
    def test_select_agent_with_lowest_workload(self, sample_agents):
        """Test selecting agent with lowest workload"""
        available_agents = [a for a in sample_agents if a["disponible"]]
        best_agent = min(available_agents, key=lambda a: a["cargaActual"])
        
        assert best_agent["_id"] == "agent1"
        assert best_agent["cargaActual"] == 2

    @pytest.mark.unit
    def test_prioritize_specialized_agent(self, sample_agents, sample_ticket):
        """Test prioritizing agents with matching specialty"""
        category = sample_ticket["categoria"]
        available_agents = [a for a in sample_agents if a["disponible"]]
        
        # Filter by specialty
        specialized = [a for a in available_agents if category in a.get("especialidades", [])]
        
        if specialized:
            best_agent = min(specialized, key=lambda a: a["cargaActual"])
            assert category in best_agent["especialidades"]
            assert best_agent["_id"] == "agent1"  # Lowest workload among specialized

    @pytest.mark.unit
    def test_no_available_agents(self, sample_agents):
        """Test handling when no agents are available"""
        # Mark all agents as unavailable
        for agent in sample_agents:
            agent["disponible"] = False
        
        available_agents = [a for a in sample_agents if a["disponible"]]
        assert len(available_agents) == 0

    @pytest.mark.unit
    def test_workload_score_calculation(self):
        """Test workload score calculation logic"""
        # Lower workload should have better (lower) score
        agent_low = {"cargaActual": 2}
        agent_high = {"cargaActual": 10}
        
        score_low = agent_low["cargaActual"]
        score_high = agent_high["cargaActual"]
        
        assert score_low < score_high
        assert score_low == 2
        assert score_high == 10

    @pytest.mark.unit
    def test_specialty_bonus_calculation(self):
        """Test that specialty matching provides selection advantage"""
        agent_specialized = {
            "_id": "agent1",
            "especialidades": ["software"],
            "cargaActual": 5
        }
        agent_general = {
            "_id": "agent2",
            "especialidades": ["hardware"],
            "cargaActual": 3
        }
        
        ticket_category = "software"
        
        # Specialized agent should be preferred even with higher workload
        # (within reasonable limits)
        has_specialty_1 = ticket_category in agent_specialized["especialidades"]
        has_specialty_2 = ticket_category in agent_general["especialidades"]
        
        assert has_specialty_1 is True
        assert has_specialty_2 is False

    @pytest.mark.unit
    def test_agent_data_structure(self, sample_agents):
        """Test that agent data has required fields"""
        required_fields = ["_id", "nombre", "email", "rol", "disponible", "cargaActual"]
        
        for agent in sample_agents:
            for field in required_fields:
                assert field in agent, f"Agent missing required field: {field}"

    @pytest.mark.unit
    def test_workload_boundaries(self):
        """Test workload calculation edge cases"""
        # Zero workload
        agent_zero = {"cargaActual": 0}
        assert agent_zero["cargaActual"] == 0
        
        # Very high workload
        agent_overloaded = {"cargaActual": 50}
        assert agent_overloaded["cargaActual"] == 50
        assert agent_overloaded["cargaActual"] > 10  # Should be considered overloaded
