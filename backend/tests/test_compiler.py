"""Tests de non-régression du compilateur FlowOps → GitHub Actions.

Verrouille la structure du YAML produit (événements, injection du
``repository_dispatch``, mapping des types de steps) : c'est le contrat
partagé entre ``backend/compiler.py``, le frontend et l'exécution GitHub.
"""
from __future__ import annotations

import yaml

from compiler import compile_flowops_workflow
from schemas import FlowOpsWorkflowSchema, LowCodeJob, LowCodeStep


def _representative_config() -> FlowOpsWorkflowSchema:
    """Configuration couvrant tous les types de steps et les options de jobs."""
    return FlowOpsWorkflowSchema(
        filename="ci.yaml",
        name="CI Pipeline",
        on_events=["push", "pull_request"],
        branches="main, dev",
        global_env="NODE_ENV=production\nDEBUG=1",
        jobs=[
            LowCodeJob(
                id="j-1",
                name="Build",
                runs_on="ubuntu-latest",
                needs=[],
                steps=[
                    LowCodeStep(id="s-1", name="Checkout", type="checkout"),
                    LowCodeStep(
                        id="s-2", name="Setup Node", type="setup-node", node_version="22"
                    ),
                    LowCodeStep(id="s-3", name="Install", type="npm", npm_command="ci"),
                    LowCodeStep(
                        id="s-4",
                        name="Upload",
                        type="upload-artifact",
                        artifact_path="dist/",
                    ),
                ],
            ),
            LowCodeJob(
                id="j-2",
                name="Package",
                runs_on="ubuntu-latest",
                needs=["build"],
                matrix_key="node",
                matrix_values="20, 22",
                job_if="github.event_name == 'push'",
                steps=[
                    LowCodeStep(
                        id="s-5",
                        name="Docker",
                        type="docker",
                        docker_image="app",
                        docker_registry="dockerhub",
                    ),
                    LowCodeStep(
                        id="s-6",
                        name="Script",
                        type="custom-run",
                        custom_script="echo 'a'\necho 'b'",
                        step_if="always()",
                    ),
                ],
            ),
        ],
    )


def test_events_and_repository_dispatch():
    """Les événements choisis sont compilés et ``flowops_trigger`` est toujours injecté."""
    out = compile_flowops_workflow(_representative_config())

    assert out["on"]["push"] == {"branches": ["main", "dev"]}
    assert out["on"]["pull_request"] == {"branches": ["main", "dev"]}
    assert out["on"]["repository_dispatch"] == {"types": ["flowops_trigger"]}


def test_repository_dispatch_injected_even_without_events():
    """Cas du bouton « Execute » : l'event dispatch doit exister quoi qu'il arrive."""
    config = _representative_config()
    config.on_events = []
    config.branches = ""

    out = compile_flowops_workflow(config)

    assert out["on"] == {"repository_dispatch": {"types": ["flowops_trigger"]}}


def test_global_env_parsed_into_top_level_env():
    out = compile_flowops_workflow(_representative_config())

    assert out["env"] == {"NODE_ENV": "production", "DEBUG": "1"}


def test_job_structure_needs_matrix_and_if():
    out = compile_flowops_workflow(_representative_config())

    build = out["jobs"]["build"]
    package = out["jobs"]["package"]

    assert build["runs-on"] == "ubuntu-latest"
    assert package["needs"] == ["build"]
    assert package["if"] == "github.event_name == 'push'"
    # Les valeurs matrix sont conservées telles quelles (chaînes) par le compilateur
    assert package["strategy"] == {"matrix": {"node": ["20", "22"]}}


def test_step_types_mapping():
    """Chaque ``type`` de step produit exactement la clé attendue par GitHub."""
    out = compile_flowops_workflow(_representative_config())
    steps = {s["name"]: s for s in out["jobs"]["build"]["steps"]}

    assert steps["Checkout"]["uses"] == "actions/checkout@v4"
    assert steps["Setup Node"]["uses"] == "actions/setup-node@v4"
    assert steps["Setup Node"]["with"] == {"node-version": 22, "cache": "npm"}
    assert steps["Install"]["run"] == "npm ci"
    assert steps["Upload"]["with"] == {
        "name": "production-artifacts",
        "path": "dist/",
    }


def test_docker_and_custom_run_steps():
    out = compile_flowops_workflow(_representative_config())
    package_steps = {s["name"]: s for s in out["jobs"]["package"]["steps"]}

    docker_run = package_steps["Docker"]["run"]
    assert "docker build -t app ." in docker_run
    assert "${{ github.repository_owner }}/app:latest" in docker_run

    assert package_steps["Script"]["if"] == "always()"
    assert "\n" in package_steps["Script"]["run"]  # script multi-lignes → bloc littéral


def test_setup_node_uses_matrix_value_when_matrix_is_node():
    """Sans ``node_version`` mais avec une clé matrix « node » → ``${{ matrix.node }}``."""
    config = _representative_config()
    config.jobs[1].steps.append(
        LowCodeStep(id="s-7", name="Node Matrix", type="setup-node")
    )

    out = compile_flowops_workflow(config)
    steps = {s["name"]: s for s in out["jobs"]["package"]["steps"]}

    assert steps["Node Matrix"]["with"]["node-version"] == "${{ matrix.node }}"


def test_yaml_round_trip():
    """Le YAML produit reste parsable et équivalent au dictionnaire source."""
    out = compile_flowops_workflow(_representative_config())

    dumped = yaml.dump(out, sort_keys=False, default_flow_style=False, allow_unicode=True)
    reparsed = yaml.safe_load(dumped)

    assert reparsed == out
