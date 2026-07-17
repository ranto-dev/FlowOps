def format_project(project) -> dict:
    return {
        "id": str(
            project["_id"]
        ),  # Convertit l'ObjectId en simple chaîne de caractères
        "name": project["name"],
        "description": project["description"],
        "repository": project["repository"],
        "has_workflow": project.get("has_workflow", False),
        "yaml_filename": project.get("yaml_filename", None),
    }
